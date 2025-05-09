import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AvaLogo from '@/components/AvaLogo';
import ChatWindow from '@/components/Chat/ChatWindow';
import MessageInput from '@/components/Chat/MessageInput';
import FileUpload from '@/components/Upload/FileUpload';
import ReportHistory from '@/components/Card/ReportHistory';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar } from 'lucide-react';
import { Message } from '@/components/Chat/ChatWindow';
import { v4 as uuidv4 } from 'uuid';
import { Report } from '@/components/Card/ReportHistory';
import { toast } from '@/hooks/use-toast';
import { useReportFile } from '@/ReportFileContext';

const Index = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('user_name'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const { setFile } = useReportFile();

  // Initial setup - show welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage: Message = {
        id: uuidv4(),
        sender: 'ava',
        message: userName ? 
          `Welcome back, ${userName}! How can I help you with your blood report analysis today?` : 
          "Hey there! I'm Ava AI, your blood report analyzer. What's your name?",
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
    
    // Check if we have a username already
    if (userName) {
      setUploadVisible(true);
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
      localStorage.setItem('user_name', message);
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
    } else {
      // Simulate response for other messages
      setIsTyping(true);
      setTimeout(() => {
        let responseMessage;
        
        if (message.toLowerCase().includes('help') || message.toLowerCase().includes('how')) {
          responseMessage = "To analyze your blood report, I need you to upload a PDF or image of your report. Once uploaded, I'll analyze the values and provide personalized insights.";
        } else if (message.toLowerCase().includes('thank')) {
          responseMessage = "You're welcome! If you have any other questions about your blood reports or need clarification on any results, don't hesitate to ask.";
        } else {
          responseMessage = "Thanks for your message. Would you like to upload a new blood report for analysis?";
        }
        
        const response: Message = {
          id: uuidv4(),
          sender: 'ava',
          message: responseMessage,
          timestamp: new Date(),
          isNew: true
        };
        
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
      }, 1500);
    }
  };

  const handleFileSelected = async (file: File) => {
    try {
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
      // Save to localStorage (just the report metadata, not the file)
      localStorage.setItem('blood_reports', JSON.stringify(allReports));
      // Set the file in context instead of localStorage
      setFile(file);
      // Add a message about the upload
      const uploadMessage: Message = {
        id: uuidv4(),
        sender: 'user',
        message: `Uploaded: ${file.name}`,
        timestamp: new Date(),
        isNew: true
      };
      setMessages(prev => [...prev, uploadMessage]);
      // Navigate to results page
      navigate(`/results?report=${newReport.id}`);
    } catch (error) {
      console.error('Error handling file upload:', error);
      toast({
        title: "Error",
        description: "Failed to process the uploaded file. Please try again.",
        variant: "destructive"
      });
    }
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
  
  const handleDeleteReport = (reportId: string) => {
    // Remove the report
    const updatedReports = reports.filter(r => r.id !== reportId);
    setReports(updatedReports);
    localStorage.setItem('blood_reports', JSON.stringify(updatedReports));
    
    // Show toast notification
    toast({
      title: "Report deleted",
      description: "The report has been removed from your history",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 p-4 bg-white shadow-sm">
        <div className="container flex justify-between items-center">
          <AvaLogo />
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-4 h-[600px] flex flex-col">
              <ChatWindow messages={messages} isTyping={isTyping} />
              <MessageInput onSendMessage={handleSendMessage} />
              {uploadVisible && (
                <div className="mt-4">
                  <FileUpload onFileSelected={handleFileSelected} />
                </div>
              )}
            </div>
          </div>
          
          {/* Reports Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Report History</h2>
              <ReportHistory 
                reports={reports}
                onSelectReport={handleSelectReport}
                onDeleteReport={handleDeleteReport}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
