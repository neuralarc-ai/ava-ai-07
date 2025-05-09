import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import FileUpload from '@/components/Upload/FileUpload';
import { Message } from './ChatWindow';
import { v4 as uuidv4 } from 'uuid';
import { useReportFile } from '@/ReportFileContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface FloatingChatProps {
  className?: string;
}

export function FloatingChat({ className }: FloatingChatProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(true);
  const { setFile } = useReportFile();
  const [userName, setUserName] = useState<string | null>(localStorage.getItem('user_name'));

  // Initial setup - show welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage: Message = {
        id: uuidv4(),
        sender: 'ava',
        message: userName 
          ? `Welcome back, ${userName}! How can I help you with your blood report analysis today?`
          : "Hey there! I'm Ava AI, your blood report analyzer. What's your name?",
        timestamp: new Date(),
        isNew: true
      };
      setMessages([initialMessage]);
    }
  }, [userName]);

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
      }, 1000);
    } else {
      // Simulate response for other messages
      setIsTyping(true);
      setTimeout(() => {
        const response: Message = {
          id: uuidv4(),
          sender: 'ava',
          message: "I can help you analyze your blood report. Please upload your report using the upload button.",
          timestamp: new Date(),
          isNew: true
        };
        setMessages(prev => [...prev, response]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleFileSelected = async (file: File) => {
    try {
      setFile(file);
      navigate(`/results`);
    } catch (error) {
      console.error('Error handling file upload:', error);
    }
  };

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      {/* Chat Icon Button */}
      {!isOpen && (
        <Button
          size="lg"
          className="h-12 w-12 rounded-full bg-ava-neon-green hover:bg-ava-neon-green-dark shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="h-6 w-6 text-background" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-lg w-[380px] h-[600px] flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h3 className="font-semibold">Ava AI</h3>
              <p className="text-sm text-muted-foreground">Blood Analysis Expert</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Content */}
          <div className="flex-1 flex flex-col p-4">
            <ChatWindow messages={messages} isTyping={isTyping} />
            {uploadVisible && (
              <div className="mt-4">
                <FileUpload onFileSelected={handleFileSelected} />
              </div>
            )}
            <MessageInput onSendMessage={handleSendMessage} />
          </div>
        </div>
      )}
    </div>
  );
} 