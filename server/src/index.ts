import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import dotenv from 'dotenv';
import { prisma } from './prisma';
import { authMiddleware, AuthRequest } from './middleware/auth';

dotenv.config();

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'pulsechat_real_jwt_secret_key_super_secure_32_bytes';

const app = express();
const server = http.createServer(app);

// CORS & Middleware
app.use(cors());
app.use(express.json());

// Ensure Uploads Directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer Storage for File & Audio Uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).substring(2)}${ext}`);
  }
});
const upload = multer({ storage });

// WebSocket Server Initialization
const wss = new WebSocketServer({ server });
const connectedClients = new Map<string, WebSocket>(); // userId -> WebSocket

wss.on('connection', (ws, req) => {
  let authenticatedUserId: string | null = null;

  ws.on('message', (messageRaw) => {
    try {
      const data = JSON.parse(messageRaw.toString());

      if (data.type === 'AUTH') {
        const decoded = jwt.verify(data.token, JWT_SECRET) as { userId: string };
        authenticatedUserId = decoded.userId;
        connectedClients.set(authenticatedUserId, ws);

        // Broadcast User Online Presence
        broadcast({ type: 'PRESENCE_CHANGE', userId: authenticatedUserId, status: 'online' });
      } else if (data.type === 'TYPING_START' || data.type === 'TYPING_STOP') {
        broadcastToConversation(data.conversationId, authenticatedUserId, data);
      }
    } catch (e) {
      console.error('WS Message Error:', e);
    }
  });

  ws.on('close', () => {
    if (authenticatedUserId) {
      connectedClients.delete(authenticatedUserId);
      broadcast({ type: 'PRESENCE_CHANGE', userId: authenticatedUserId, status: 'offline' });
    }
  });
});

function broadcast(payload: any) {
  const jsonStr = JSON.stringify(payload);
  connectedClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(jsonStr);
    }
  });
}

function broadcastToConversation(conversationId: string, senderUserId: string | null, payload: any) {
  const jsonStr = JSON.stringify(payload);
  connectedClients.forEach((ws, userId) => {
    if (userId !== senderUserId && ws.readyState === WebSocket.OPEN) {
      ws.send(jsonStr);
    }
  });
}

// ----------------------------------------------------
// REAL AUTH ROUTES
// ----------------------------------------------------

// 1. REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, phone, name, password } = req.body;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({ error: 'All fields (username, email, phone, password) are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Check duplicates
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: cleanEmail },
          { phone: cleanPhone }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === cleanUsername) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }
      if (existingUser.email === cleanEmail) {
        return res.status(400).json({ error: 'Email address is already registered.' });
      }
      return res.status(400).json({ error: 'Phone number is already registered.' });
    }

    // Hash Password with Bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        phone: cleanPhone,
        name: name?.trim() || cleanUsername,
        password: hashedPassword,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`
      }
    });

    // Create JWT Token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// 2. LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { credential, password } = req.body;

    if (!credential || !password) {
      return res.status(400).json({ error: 'Credential and password are required.' });
    }

    const query = credential.trim().toLowerCase();

    // Find User by Username, Email, or Phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: query },
          { email: query },
          { phone: query }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username/email/phone or password.' });
    }

    // Compare Bcrypt Password Hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username/email/phone or password.' });
    }

    // Create JWT Token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userWithoutPassword } = user;
    return res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// 3. GET CURRENT USER (ME)
app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// ----------------------------------------------------
// USER & CONTACT SEARCH ROUTES
// ----------------------------------------------------
app.get('/api/users', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const search = req.query.search ? String(req.query.search).toLowerCase().trim() : '';

    const users = await prisma.user.findMany({
      where: {
        id: { not: req.userId },
        ...(search ? {
          OR: [
            { username: { contains: search } },
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } }
          ]
        } : {})
      },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        name: true,
        avatar: true,
        bio: true,
        status: true
      }
    });

    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to search users.' });
  }
});

// ----------------------------------------------------
// CONVERSATIONS ROUTES
// ----------------------------------------------------
app.get('/api/conversations', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: req.userId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                    phone: true,
                    name: true,
                    avatar: true,
                    status: true
                  }
                }
              }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    const conversations = memberships.map(m => {
      const conv = m.conversation;
      const members = conv.members.map(mem => mem.user);
      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id,
        name: conv.name,
        isGroup: conv.isGroup,
        avatar: conv.avatar,
        members,
        lastMessage,
        unreadCount: 0,
        updatedAt: conv.updatedAt.toISOString()
      };
    });

    return res.json(conversations);
  } catch (error) {
    console.error('Fetch conversations error:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// CREATE / GET DM CONVERSATION
app.post('/api/conversations/dm', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required.' });

    // Check if DM exists
    const existingDM = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: req.userId } } },
          { members: { some: { userId: targetUserId } } }
        ]
      },
      include: {
        members: { include: { user: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (existingDM) {
      return res.json({
        id: existingDM.id,
        isGroup: false,
        members: existingDM.members.map(m => m.user),
        lastMessage: existingDM.messages[0] || null,
        unreadCount: 0,
        updatedAt: existingDM.updatedAt.toISOString()
      });
    }

    // Create New DM
    const newConv = await prisma.conversation.create({
      data: {
        isGroup: false,
        members: {
          create: [
            { userId: req.userId! },
            { userId: targetUserId }
          ]
        }
      },
      include: {
        members: { include: { user: true } }
      }
    });

    return res.status(201).json({
      id: newConv.id,
      isGroup: false,
      members: newConv.members.map(m => m.user),
      lastMessage: null,
      unreadCount: 0,
      updatedAt: newConv.updatedAt.toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create DM conversation.' });
  }
});

// CREATE GROUP CONVERSATION
app.post('/api/conversations/group', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, memberIds, avatar } = req.body;
    if (!name || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ error: 'Group name and memberIds are required.' });
    }

    const allMemberIds = Array.from(new Set([req.userId!, ...memberIds]));

    const group = await prisma.conversation.create({
      data: {
        name,
        isGroup: true,
        avatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
        members: {
          create: allMemberIds.map(userId => ({ userId }))
        }
      },
      include: {
        members: { include: { user: true } }
      }
    });

    return res.status(201).json({
      id: group.id,
      name: group.name,
      isGroup: true,
      avatar: group.avatar,
      members: group.members.map(m => m.user),
      lastMessage: null,
      unreadCount: 0,
      updatedAt: group.updatedAt.toISOString()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create group channel.' });
  }
});

// ----------------------------------------------------
// MESSAGES ROUTES
// ----------------------------------------------------
app.get('/api/messages/:conversationId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        },
        replyTo: true
      }
    });

    const formatted = messages.map(m => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.sender.name,
      senderAvatar: m.sender.avatar || '',
      text: m.text,
      mediaUrl: m.mediaUrl || undefined,
      mediaType: m.mediaType as any,
      fileName: m.fileName || undefined,
      voiceDurationMs: m.voiceDurationMs || undefined,
      codeSnippet: m.codeSnippet ? JSON.parse(m.codeSnippet) : undefined,
      createdAt: m.createdAt.toISOString(),
      status: m.status as any,
      replyTo: m.replyTo ? { id: m.replyTo.id, senderName: 'User', text: m.replyTo.text } : undefined
    }));

    return res.json(formatted);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

app.post('/api/messages', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { conversationId, text, mediaUrl, mediaType, fileName, voiceDurationMs, codeSnippet, replyToId } = req.body;

    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId is required.' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: req.userId!,
        text: text || '',
        mediaUrl,
        mediaType,
        fileName,
        voiceDurationMs,
        codeSnippet: codeSnippet ? JSON.stringify(codeSnippet) : null,
        replyToId
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Touch Conversation updatedAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    const formattedMessage = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderAvatar: message.sender.avatar || '',
      text: message.text,
      mediaUrl: message.mediaUrl || undefined,
      mediaType: message.mediaType as any,
      fileName: message.fileName || undefined,
      voiceDurationMs: message.voiceDurationMs || undefined,
      codeSnippet: codeSnippet || undefined,
      createdAt: message.createdAt.toISOString(),
      status: 'delivered'
    };

    // Broadcast over WebSocket to all connected users
    broadcastToConversation(conversationId, null, {
      type: 'NEW_MESSAGE',
      message: formattedMessage
    });

    return res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Failed to send message.' });
  }
});

// FILE UPLOAD ROUTE
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
  return res.json({ url: fileUrl, filename: req.file.originalname });
});

// START SERVER
server.listen(PORT, () => {
  console.log(`🚀 Real PulseChat Server running on http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Server running on ws://localhost:${PORT}`);
});
