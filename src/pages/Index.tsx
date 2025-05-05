
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AvaLogo from '@/components/AvaLogo';
import ChatWindow from '@/components/Chat/ChatWindow';
import MessageInput from '@/components/Chat/MessageInput';
import FileUpload from '@/components/Upload/FileUpload';
import ReportHistory from '@/components/Card/ReportHistory';
import ApiKeyModal from '@/components/Settings/ApiKeyModal';
import { useNavigate } from 'react-router-dom';
import { Settings, FileText } from 'lucide-react';
import { Message } from '@/components/Chat/ChatWindow';
import { v4 as uuidv4 } from 'uuid';
import { Report } from '@/components/Card/ReportHistory';

const Index = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('openai_api_key'));
  const [selectedModel, setSelectedModel] = useState<string>(localStorage.getItem('openai_model') || 'gpt-4o');
  const [isTyping, setIsTyping] = useState(false);
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);

  // Initial setup - show welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage: Message = {
        id: uuidv4(),
        sender: 'ava',
        message: "Hey there! I'm Ava AI, your blood report analyzer. What's your name?",
        timestamp: new Date(),
        isNew: true
      };
      setMessages([initialMessage]);
    }
  }, []);

  // Load reports from localStorage
  useEffect(() => {
    const savedReports = localStorage.getItem('blood_reports');
    if (savedReports) {
      try {
        setReports(JSON.parse(savedReports));
      } catch (e) {
        console.error('Failed to parse saved reports', e);
      }
    }
  }, []);

  const handleSendMessage = (message: string) => {
    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      sender: 'user',
      message,
      timestamp: new Date(),
      isNew: true
    };
    setMessages(prev => [...prev, userMessage]);
    
    // If user is providing their name
    if (!userName) {
      setUserName(message);
      setIsTyping(true);
      
      // Simulate Ava's response after receiving name
      setTimeout(() => {
        const response: Message = {
          id: uuidv4(),
          sender: 'ava',
          message: `Nice to meet you, ${message}! To help you understand your blood test results, please upload your blood report (PDF or image).`,
          timestamp: new Date(),
          isNew: true
        };
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
        setUploadVisible(true);
      }, 1000);
    }
  };

  const handleFileSelected = (file: File) => {
    // Create a new report
    const newReport: Report = {
      id: uuidv4(),
      name: file.name,
      date: new Date().toLocaleDateString(),
      isActive: true
    };
    
    // Deactivate any previously active reports
    const updatedReports = reports.map(report => ({
      ...report,
      isActive: false
    }));
    
    // Add the new report to the list
    const allReports = [...updatedReports, newReport];
    setReports(allReports);
    
    // Save to localStorage
    localStorage.setItem('blood_reports', JSON.stringify(allReports));
    
    // Add a message about the upload
    const uploadMessage: Message = {
      id: uuidv4(),
      sender: 'user',
      message: `Uploaded: ${file.name}`,
      timestamp: new Date(),
      isNew: true
    };
    setMessages(prev => [...prev, uploadMessage]);
    
    // Check if API key is available
    if (!apiKey) {
      setApiKeyModalOpen(true);
    } else {
      // Simulate processing and redirect to results page
      simulateProcessing(file, newReport.id);
    }
  };

  const simulateProcessing = (file: File, reportId: string) => {
    // Add an upload confirmation message from Ava
    const confirmationMessage: Message = {
      id: uuidv4(),
      sender: 'ava',
      message: `Thanks for uploading your report! I'll analyze it right away.`,
      timestamp: new Date(),
      isNew: true
    };
    
    setMessages(prev => [...prev, confirmationMessage]);
    
    // After a short delay, navigate to the results page
    setTimeout(() => {
      navigate(`/results?report=${reportId}`);
    }, 1500);
  };

  const handleSaveApiKey = (key: string, model: string) => {
    setApiKey(key);
    setSelectedModel(model);
    localStorage.setItem('openai_api_key', key);
    localStorage.setItem('openai_model', model);
  };

  const handleSelectReport = (report: Report) => {
    // Update active report
    const updatedReports = reports.map(r => ({
      ...r,
      isActive: r.id === report.id
    }));
    
    setReports(updatedReports);
    localStorage.setItem('blood_reports', JSON.stringify(updatedReports));
    
    // Navigate to results page for the selected report
    navigate(`/results?report=${report.id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-ava-dark text-ava-light">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="container flex justify-between items-center">
          <AvaLogo />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setApiKeyModalOpen(true)}
            className="text-gray-400 hover:text-ava-light hover:bg-gray-800"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Column */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-xl font-semibold">Chat with <span className="text-ava-neon-green">Ava AI</span></h2>
                <p className="text-sm text-gray-400">Your personal blood report analyzer</p>
              </div>
              
              {/* Chat Window */}
              <div className="flex-1 overflow-hidden">
                <ChatWindow 
                  messages={messages} 
                  isTyping={isTyping}
                  whoIsTyping="ava"
                  animateTyping={true}
                />
              </div>
              
              {/* Upload Area (conditionally shown) */}
              {uploadVisible && (
                <div className="px-4 pb-4">
                  <FileUpload onFileSelected={handleFileSelected} />
                </div>
              )}
              
              {/* Message Input */}
              <div className="p-4 border-t border-gray-800">
                <MessageInput 
                  onSendMessage={handleSendMessage}
                  placeholder={userName ? "Type your message..." : "Enter your name..."}
                />
              </div>
            </div>
          </div>
          
          {/* Sidebar Column */}
          <div className="lg:col-span-1">
            {/* Report History */}
            <ReportHistory 
              reports={reports}
              onSelectReport={handleSelectReport}
            />
            
            {/* Information Card */}
            <div className="mt-6 bg-ava-card-bg border border-gray-700 rounded-lg p-5">
              <h3 className="flex items-center gap-2 text-lg font-medium mb-3">
                <FileText className="h-5 w-5 text-ava-neon-green" />
                How It Works
              </h3>
              <ol className="space-y-3 text-sm text-gray-300">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-ava-muted flex items-center justify-center text-ava-neon-green text-xs font-medium">1</span>
                  <span>Upload your blood test report (PDF or image)</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-ava-muted flex items-center justify-center text-ava-neon-green text-xs font-medium">2</span>
                  <span>Ava AI will analyze the results using advanced AI</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-ava-muted flex items-center justify-center text-ava-neon-green text-xs font-medium">3</span>
                  <span>Get personalized insights about your health</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-ava-muted flex items-center justify-center text-ava-neon-green text-xs font-medium">4</span>
                  <span>Receive recommendations to improve your results</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
      
      {/* API Key Modal */}
      <ApiKeyModal
        open={apiKeyModalOpen}
        onOpenChange={setApiKeyModalOpen}
        onSaveApiKey={handleSaveApiKey}
        apiKey={apiKey || ''}
        selectedModel={selectedModel}
      />
    </div>
  );
};

export default Index;
