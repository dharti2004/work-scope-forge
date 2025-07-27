import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, MessageCircle } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDirectChat = () => {
    // Create a new chat session
    const sessionId = Date.now().toString();
    const newSession = {
      id: sessionId,
      name: 'New Chat',
      type: 'chat',
      messages: [],
    };

    // Save to localStorage
    const existingSessions = JSON.parse(localStorage.getItem('work-scope-sessions') || '[]');
    const updatedSessions = [...existingSessions, newSession];
    localStorage.setItem('work-scope-sessions', JSON.stringify(updatedSessions));

    navigate(`/chat/${sessionId}`);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a new folder session
      const sessionId = Date.now().toString();
      const newSession = {
        id: sessionId,
        name: file.name,
        type: 'folder',
        fileName: file.name,
        messages: [{
          id: Date.now().toString(),
          content: `Uploaded: ${file.name}`,
          sender: 'user',
          timestamp: new Date()
        }],
      };

      // Save to localStorage
      const existingSessions = JSON.parse(localStorage.getItem('work-scope-sessions') || '[]');
      const updatedSessions = [...existingSessions, newSession];
      localStorage.setItem('work-scope-sessions', JSON.stringify(updatedSessions));

      navigate(`/chat/${sessionId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-8">
      <div className="w-full max-w-2xl mx-auto text-center space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-foreground">
            Work Scope Generator
          </h1>
          <h2 className="text-2xl font-medium text-foreground/80">
            How can I help you today
          </h2>
          <p className="text-lg text-muted-foreground">
            Upload your document or chat directly to get your work scope
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <Card 
            className="bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer transform hover:scale-105"
            onClick={handleUploadClick}
          >
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Upload your document
              </h3>
              <p className="text-muted-foreground">
                Upload a PDF, Word doc, or text file to generate a work scope based on your content
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer transform hover:scale-105"
            onClick={handleDirectChat}
          >
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Direct chat
              </h3>
              <p className="text-muted-foreground">
                Start a conversation to describe your project and get a customized work scope
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default Index;
