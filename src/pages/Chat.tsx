import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Send, Copy, MoreHorizontal, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface Session {
  id: string;
  name: string;
  type: 'folder' | 'chat';
  fileName?: string;
  messages: Message[];
  isActive?: boolean;
}

const Chat = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load sessions from localStorage
    const savedSessions = localStorage.getItem('work-scope-sessions');
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions);
      setSessions(parsedSessions);
      
      if (sessionId) {
        const session = parsedSessions.find((s: Session) => s.id === sessionId);
        setCurrentSession(session || null);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const createNewSession = (type: 'folder' | 'chat', fileName?: string, initialMessage?: string) => {
    const newSession: Session = {
      id: Date.now().toString(),
      name: fileName || 'New Chat',
      type,
      fileName,
      messages: initialMessage ? [{
        id: Date.now().toString(),
        content: initialMessage,
        sender: 'user',
        timestamp: new Date()
      }] : [],
    };

    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    localStorage.setItem('work-scope-sessions', JSON.stringify(updatedSessions));
    
    navigate(`/chat/${newSession.id}`);
    return newSession;
  };

  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    localStorage.setItem('work-scope-sessions', JSON.stringify(updatedSessions));
    
    if (currentSession?.id === sessionId) {
      navigate('/');
    }
    
    toast({
      title: "Session deleted",
      description: "The session has been removed successfully."
    });
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const session = createNewSession('folder', file.name, `Uploaded: ${file.name}`);
      setCurrentSession(session);
      
      // Simulate API call for file processing
      setTimeout(() => {
        addMessage("I've processed your document. How can I help you create a work scope based on this content?", 'assistant');
      }, 1000);
    }
  };

  const addMessage = (content: string, sender: 'user' | 'assistant') => {
    if (!currentSession) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date()
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, newMessage]
    };

    const updatedSessions = sessions.map(s => 
      s.id === currentSession.id ? updatedSession : s
    );

    setSessions(updatedSessions);
    setCurrentSession(updatedSession);
    localStorage.setItem('work-scope-sessions', JSON.stringify(updatedSessions));
  };

  const handleSendMessage = () => {
    if (!message.trim() || !currentSession) return;

    addMessage(message, 'user');
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      addMessage("I understand your request. Let me help you create a comprehensive work scope for this project.", 'assistant');
    }, 1000);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message copied to clipboard."
    });
  };

  const folders = sessions.filter(s => s.type === 'folder');
  const chats = sessions.filter(s => s.type === 'chat');

  return (
    <div className="flex h-screen bg-gradient-background">
      {/* Sidebar */}
      <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h2 className="text-xl font-semibold text-sidebar-foreground">Work Scope Generator</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Folders Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-sidebar-foreground">Folders</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleFileUpload}
                className="text-primary hover:text-primary-foreground hover:bg-primary"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className={`group p-3 rounded-lg cursor-pointer hover-accent ${
                    currentSession?.id === folder.id ? 'active-indicator bg-sidebar-accent' : 'bg-sidebar-accent/50'
                  }`}
                  onClick={() => navigate(`/chat/${folder.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {folder.fileName}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60">
                        {folder.messages.length} messages
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(folder.id);
                          }}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chats Section */}
          <div>
            <h3 className="text-sm font-medium text-sidebar-foreground mb-3">Chats</h3>
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group p-3 rounded-lg cursor-pointer hover-accent ${
                    currentSession?.id === chat.id ? 'active-indicator bg-sidebar-accent' : 'bg-sidebar-accent/50'
                  }`}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {chat.name}
                      </p>
                      <p className="text-xs text-sidebar-foreground/60">
                        {chat.messages.length} messages
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(chat.id);
                          }}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-border bg-card">
              <h1 className="text-xl font-semibold text-foreground">
                {currentSession.fileName || currentSession.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentSession.type === 'folder' ? 'Document-based chat' : 'Direct conversation'}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentSession.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`group max-w-2xl p-4 rounded-lg border relative ${
                      msg.sender === 'user' 
                        ? 'message-user ml-12' 
                        : 'message-assistant mr-12'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        msg.sender === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-accent text-accent-foreground'
                      }`}>
                        {msg.sender === 'user' ? 'U' : 'AI'}
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        onClick={() => copyMessage(msg.content)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-6 border-t border-border bg-card">
              <div className="flex items-center space-x-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button variant="ghost" size="sm">
                  <Mic className="h-4 w-4" />
                </Button>
                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                Welcome to Work Scope Generator
              </h2>
              <p className="text-muted-foreground">
                Select a session from the sidebar or return to the home page to start a new one.
              </p>
              <Button 
                onClick={() => navigate('/')} 
                className="mt-4"
                variant="outline"
              >
                Go to Home
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={onFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default Chat;