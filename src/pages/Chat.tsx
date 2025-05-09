import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import ChatWindow from '@/components/Chat/ChatWindow';
import MessageInput from '@/components/Chat/MessageInput';
import FileUpload from '@/components/Upload/FileUpload';
import { Message } from '@/components/Chat/ChatWindow';
import { v4 as uuidv4 } from 'uuid';
import { useReportFile } from '@/ReportFileContext';
import { useNavigate } from 'react-router-dom';
import { useFileUpload } from '@/hooks/use-file-upload';

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(true);
  const { setFile } = useReportFile();
  const { handleFileUpload } = useFileUpload({ 
    redirectToResults: true,
    onSuccess: () => setUploadVisible(false)
  });

  // Initial setup - show welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage: Message = {
        id: uuidv4(),
        sender: 'ava',
        message: "Hello! I'm Ava AI, your blood report analysis assistant. How can I help you today?",
        timestamp: new Date(),
        isNew: true
      };
      setMessages([initialMessage]);
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

    // Simulate Ava's response
    setIsTyping(true);
    setTimeout(() => {
      const response: Message = {
        id: uuidv4(),
        sender: 'ava',
        message: "I can help you analyze your blood report. Please upload your report using the upload button, or ask me any questions about your previous reports.",
        timestamp: new Date(),
        isNew: true
      };
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  const handleFileSelected = async (file: File) => {
    await handleFileUpload(file);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 h-[calc(100vh-2rem)]">
        <div className="bg-white rounded-lg shadow-sm p-4 h-full flex flex-col">
          <div className="mb-4">
            <h1 className="text-2xl font-bold">Chat with Ava AI</h1>
            <p className="text-muted-foreground">Ask questions about your blood reports or upload a new report for analysis</p>
          </div>
          
          <div className="flex-1 flex flex-col">
            <ChatWindow messages={messages} isTyping={isTyping} />
            {uploadVisible && (
              <div className="mt-4">
                <FileUpload onFileSelected={handleFileSelected} />
              </div>
            )}
            <MessageInput onSendMessage={handleSendMessage} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat; 