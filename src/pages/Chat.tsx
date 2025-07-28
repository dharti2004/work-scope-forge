import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Copy, MoreHorizontal, Upload, Folder, MessageCircle, Plus, User, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadFile, sendInitialInput, sendInput } from '@/services/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// --- HELPER COMPONENTS FOR RICH CONTENT RENDERING (UNCHANGED) ---

const TechStack = ({ data }: { data: Record<string, string[]> }) => {
  const formatTitle = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return (
    <div className="space-y-4">
      {Object.entries(data).map(([category, items]) => (
        <div key={category}>
          <h3 className="font-semibold text-primary mb-2">{formatTitle(category)}</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {items.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
};

const ScopeOfWork = ({ data }: { data: any }) => {
  const formatTitle = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return (
    <div className="space-y-6 text-left">
      {Object.entries(data).map(([key, value]) => {
        if (key === 'follow_up_question' || !value) return null;
        return (
          <div key={key}>
            <h2 className="text-lg font-bold text-primary mb-2 border-b border-primary/20 pb-1">{formatTitle(key)}</h2>
            {key === 'tech_stack' && typeof value === 'object' && <div className="p-2"><TechStack data={value as Record<string, string[]>} /></div>}
            {key === 'effort_estimation_table' && typeof value === 'object' && (
              <table className="w-full text-sm my-2">
                <thead>
                  <tr className="border-b border-border">
                    {(value.headers as string[]).map(header => <th key={header} className="p-2 text-left font-semibold">{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(value.rows as string[][]).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-border/50">
                      {row.map((cell, cellIndex) => <td key={cellIndex} className="p-2">{cell}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {typeof value === 'string' && <p className="whitespace-pre-wrap text-sm leading-relaxed">{value}</p>}
          </div>
        );
      })}
      {data.follow_up_question && (
        <div className="mt-6 p-4 bg-sidebar-accent rounded-lg">
          <p className="font-semibold text-center">{data.follow_up_question}</p>
        </div>
      )}
    </div>
  );
};

const MessageContent = ({ content }: { content: string }) => {
  try {
    const data = JSON.parse(content);
    if (data.overview && data.effort_estimation_table) {
      return <ScopeOfWork data={data} />;
    }
    if (data.frontend && data.backend) {
      return <TechStack data={data} />;
    }
    return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>;
  } catch (e) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }
};


// --- MAIN CHAT COMPONENT ---

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface Session {
  id: string;
  name: string;
  type: 'folder' | 'chat';
  fileName?: string;
  messages: Message[];
}

const Chat = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedSessions = localStorage.getItem('work-scope-sessions');
    if (savedSessions) {
      const parsedSessions: Session[] = JSON.parse(savedSessions).map((s: any) => ({
        ...s,
        messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
      }));
      setSessions(parsedSessions);
      
      if (sessionId) {
        const session = parsedSessions.find((s) => s.id === sessionId);
        setCurrentSession(session || null);
      } else {
        setCurrentSession(null);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages, isLoading]);
  
  const updateAndSaveSessions = (newSessions: Session[]) => {
    setSessions(newSessions);
    localStorage.setItem('work-scope-sessions', JSON.stringify(newSessions));
  }

  const deleteSession = (sessionIdToDelete: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionIdToDelete);
    updateAndSaveSessions(updatedSessions);
    if (currentSession?.id === sessionIdToDelete) navigate('/');
    toast({ title: "Session deleted" });
  };

  const handleFileUpload = () => fileInputRef.current?.click();

  const onFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (event.target) event.target.value = '';
    if (!file) return;

    setIsLoading(true);
    toast({ title: "Uploading...", description: `Processing: ${file.name}` });

    try {
      const newSessionId = Date.now().toString();
      const response = await uploadFile(newSessionId, file);
      
      // FIX 1: Ensure filename does not include the extension.
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      
      // FIX 2: Correctly handle JSON content and follow-up questions.
      let finalContent = response.content;
      try {
        const parsedContent = JSON.parse(response.content);
        if (response.follow_up_question) {
          parsedContent.follow_up_question = response.follow_up_question;
        }
        finalContent = JSON.stringify(parsedContent);
      } catch (error) {
        if (response.follow_up_question) {
          finalContent += `\n\n${response.follow_up_question}`;
        }
      }

      const newSession: Session = {
        id: newSessionId, 
        name: nameWithoutExtension, 
        type: 'folder', 
        fileName: file.name,
        messages: [{ 
          id: Date.now().toString(), 
          content: finalContent, 
          sender: 'assistant', 
          timestamp: new Date() 
        }],
      };

      setSessions(prevSessions => {
        const updated = [...prevSessions, newSession];
        localStorage.setItem('work-scope-sessions', JSON.stringify(updated));
        return updated;
      });
      navigate(`/chat/${newSession.id}`);
    } catch (error) {
      toast({ title: "Upload Error", description: error instanceof Error ? error.message : "An unknown error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNewChat = () => {
    const newSessionId = Date.now().toString();
    const newSession: Session = { id: newSessionId, name: "New Chat", type: 'chat', messages: [] };
    setSessions(prev => {
        const updated = [...prev, newSession];
        localStorage.setItem('work-scope-sessions', JSON.stringify(updated));
        return updated;
    });
    navigate(`/chat/${newSession.id}`);
  }

  const handleSendMessage = async () => {
    if (!message.trim() || !currentSession || isLoading) return;

    setIsLoading(true);
    const userMessageContent = message;
    setMessage('');
    
    const userMessage: Message = { id: Date.now().toString(), content: userMessageContent, sender: 'user', timestamp: new Date() };

    let updatedSessionForUI: Session | null = null;
    
    setSessions(prevSessions => {
      const isInitialMessageInChat = currentSession.type === 'chat' && currentSession.messages.length === 0;
      const newSessions = prevSessions.map(s => {
        if (s.id === currentSession.id) {
          const newName = isInitialMessageInChat ? userMessageContent.substring(0, 30) + (userMessageContent.length > 30 ? '...' : '') : s.name;
          updatedSessionForUI = { ...s, name: newName, messages: [...s.messages, userMessage] };
          return updatedSessionForUI;
        }
        return s;
      });
      localStorage.setItem('work-scope-sessions', JSON.stringify(newSessions));
      return newSessions;
    });

    if (updatedSessionForUI) setCurrentSession(updatedSessionForUI);

    try {
      const isInitial = currentSession.type === 'chat' && currentSession.messages.length === 0;
      const response = isInitial
        ? await sendInitialInput(currentSession.id, userMessageContent)
        : await sendInput(currentSession.id, userMessageContent);

      if (response) {
        let responseContent = response.content;
        try {
          const parsed = JSON.parse(responseContent);
          if (response.follow_up_question) {
            parsed.follow_up_question = response.follow_up_question;
            responseContent = JSON.stringify(parsed);
          }
        } catch (e) {
          if (response.follow_up_question) {
            responseContent += `\n\n${response.follow_up_question}`;
          }
        }
        
        const assistantMessage: Message = { id: Date.now().toString() + 'A', content: responseContent, sender: 'assistant', timestamp: new Date() };
        
        setSessions(prevSessions => {
            const finalSessions = prevSessions.map(s => {
                if(s.id === currentSession.id) {
                    const finalUpdatedSession = {...s, messages: [...s.messages, assistantMessage]};
                    setCurrentSession(finalUpdatedSession);
                    return finalUpdatedSession;
                }
                return s;
            });
            localStorage.setItem('work-scope-sessions', JSON.stringify(finalSessions));
            return finalSessions;
        });
      }
    } catch (error) {
       toast({ title: "Connection Error", description: error instanceof Error ? error.message : "Failed to send message.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied" });
  };

  const folders = sessions.filter(s => s.type === 'folder');
  const chats = sessions.filter(s => s.type === 'chat');

  return (
    <div className="flex h-screen bg-gradient-background">
      <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-6 border-b border-sidebar-border"><h2 className="text-xl font-semibold text-sidebar-foreground">Work Scope Generator</h2></div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-medium text-sidebar-foreground">Folders</h3><Button variant="ghost" size="sm" onClick={handleFileUpload} className="text-primary hover:text-primary-foreground hover:bg-primary"><Upload className="h-4 w-4" /></Button></div>
            <div className="space-y-1">{folders.map((folder) => (<div key={folder.id} className={`group p-3 rounded-lg cursor-pointer flex items-center justify-between hover-accent ${folder.id === sessionId ? 'active-indicator' : ''}`} onClick={() => navigate(`/chat/${folder.id}`)}><div className="flex items-center flex-1 min-w-0 space-x-3"><Folder className="h-4 w-4 text-primary flex-shrink-0" /><p className="text-sm font-medium text-sidebar-foreground truncate">{folder.name}</p></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteSession(folder.id); }} className="text-destructive">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>))}</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-medium text-sidebar-foreground">Chats</h3><Button variant="ghost" size="sm" onClick={handleNewChat} className="text-primary hover:text-primary-foreground hover:bg-primary"><Plus className="h-4 w-4" /></Button></div>
            <div className="space-y-1">{chats.map((chat) => (<div key={chat.id} className={`group p-3 rounded-lg cursor-pointer flex items-center justify-between hover-accent ${chat.id === sessionId ? 'active-indicator' : ''}`} onClick={() => navigate(`/chat/${chat.id}`)}><div className="flex items-center flex-1 min-w-0 space-x-3"><MessageCircle className="h-4 w-4 text-primary flex-shrink-0" /><p className="text-sm font-medium text-sidebar-foreground truncate">{chat.name}</p></div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteSession(chat.id); }} className="text-destructive">Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>))}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            <div className="p-6 border-b border-border bg-card"><h1 className="text-xl font-semibold text-foreground">{currentSession.name}</h1></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {currentSession.messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.sender === 'assistant' && (<div className="flex-shrink-0 w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center"><Bot className="w-5 h-5 text-primary" /></div>)}
                  <div className={`group relative max-w-4xl p-4 rounded-lg border message-user`}>
                    <MessageContent content={msg.content} />
                    <div className="absolute top-1 right-1"><Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-7 w-7" onClick={() => copyMessage(msg.content)}><Copy className="h-3.5 w-3.5" /></Button></div>
                  </div>
                  {msg.sender === 'user' && (<div className="flex-shrink-0 w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div>)}
                </div>
              ))}
              
              {isLoading && (<div className="flex items-start gap-4 justify-start"><div className="flex-shrink-0 w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center"><Bot className="w-5 h-5 text-primary" /></div><div className="max-w-4xl p-4 rounded-lg border message-user flex items-center justify-center space-x-1.5"><span className="dot dot-1"></span><span className="dot dot-2"></span><span className="dot dot-3"></span></div></div>)}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 border-t border-border bg-card">
              <div className="relative">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={isLoading ? "Generating response..." : "Type your message..."}
                  className="pr-12"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading}
                />
                <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center">
                  <Button onClick={handleSendMessage} disabled={!message.trim() || isLoading} size="icon" className="h-8 w-8"><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center"><div><h2 className="text-2xl font-semibold text-foreground mb-2">Welcome!</h2><p className="text-muted-foreground max-w-md">Select a conversation or start a new one by uploading a document or clicking the <Plus className="inline h-4 w-4 mx-1" /> button.</p></div></div>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept=".pdf" onChange={onFileSelect} className="hidden" />
    </div>
  );
};

export default Chat;