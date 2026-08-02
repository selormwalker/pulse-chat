import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { AuthModal } from './components/AuthModal';
import { NewDMModal } from './components/NewDMModal';
import { NewGroupModal } from './components/NewGroupModal';

function MainApp() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNewDMOpen, setIsNewDMOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenNewGroup={() => setIsNewGroupOpen(true)}
        onOpenNewDM={() => setIsNewDMOpen(true)}
      />

      {/* Main Chat Area */}
      <ChatArea />

      {/* Auth Modal (Register / Login) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* New DM Modal */}
      <NewDMModal
        isOpen={isNewDMOpen}
        onClose={() => setIsNewDMOpen(false)}
      />

      {/* New Group Channel Modal */}
      <NewGroupModal
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <MainApp />
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
