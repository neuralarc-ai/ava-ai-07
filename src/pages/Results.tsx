import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AvaLogo from '@/components/AvaLogo';
import ChatWindow from '@/components/Chat/ChatWindow';
import MessageInput from '@/components/Chat/MessageInput';
import ProgressBar, { AnalysisStage } from '@/components/ProgressBar';
import AnalysisCard, { AnalysisItem } from '@/components/Card/AnalysisCard';
import { Settings, ArrowLeft, FileText } from 'lucide-react';
import { Message } from '@/components/Chat/ChatWindow';
import { v4 as uuidv4 } from 'uuid';
import { processPDF, BloodTestResult } from '@/services/pdfService';

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stage, setStage] = useState<AnalysisStage>('reading');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState('there');
  const [currentTab, setCurrentTab] = useState('high');
  const [userMessage, setUserMessage] = useState('');
  const [analysisResults, setAnalysisResults] = useState<BloodTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  
  // Get report data from URL
  const reportId = new URLSearchParams(location.search).get('report');
  
  // Add a message to the chat
  const addMessage = (sender: 'user' | 'ava', message: string) => {
    const newMessage: Message = {
      id: uuidv4(),
      sender,
      message,
      timestamp: new Date(),
      isNew: true
    };
    setMessages(prev => [...prev, newMessage]);
  };

  // Process the PDF and analyze results
  useEffect(() => {
    const processReport = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the report file from localStorage
        const reports = JSON.parse(localStorage.getItem('blood_reports') || '[]');
        const currentReport = reports.find((r: any) => r.id === reportId);
        
        if (!currentReport) {
          throw new Error('Report not found');
        }
        
        // Get the file from localStorage
        const base64Data = localStorage.getItem(`report_file_${reportId}`);
        if (!base64Data) {
          throw new Error('Report file not found');
        }
        
        // Convert base64 back to File
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: 'application/pdf' });
        const file = new File([blob], currentReport.name, { type: 'application/pdf' });
        
        // Start the conversation
        addMessage('ava', `Hello ${userName}! I'm analyzing your blood report now. This might take a few moments.`);
        
        // Add a message about the file
        addMessage('ava', `I see you've uploaded "${currentReport.name}". Let me take a look at it.`);
        
        // Add a message about the analysis process
        addMessage('ava', "I'm extracting all the parameters and values from your report. I'll categorize them by risk level and provide detailed explanations.");
        
        // Process the PDF
        const results = await processPDF(file);
        setAnalysisResults(results);
        
        // Update the analysis stage
        setStage('complete');
        
        // Add completion message with a summary
        const highRiskCount = results.filter(r => r.riskLevel === 'high').length;
        const mediumRiskCount = results.filter(r => r.riskLevel === 'medium').length;
        const lowRiskCount = results.filter(r => r.riskLevel === 'low').length;
        const normalCount = results.filter(r => r.riskLevel === 'normal').length;
        
        addMessage('ava', `I've completed analyzing your report! Here's a quick summary:`);
        addMessage('ava', `• High Risk Parameters: ${highRiskCount}
• Medium Risk Parameters: ${mediumRiskCount}
• Low Risk Parameters: ${lowRiskCount}
• Normal Parameters: ${normalCount}`);
        
        addMessage('ava', "You can find detailed results below, categorized by risk level. Feel free to ask me any questions about specific parameters or your overall health status.");
        
      } catch (err) {
        console.error('Error processing report:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        
        // Check if it's a worker initialization error
        if (errorMessage.includes('Failed to initialize PDF.js worker')) {
          if (retryCount < maxRetries) {
            setRetryCount(prev => prev + 1);
            addMessage('ava', "I'm having a bit of trouble processing your report. Let me try again...");
            // Wait for 2 seconds before retrying
            setTimeout(() => {
              processReport();
            }, 2000);
            return;
          }
          setError('Unable to initialize PDF processing. Please refresh the page and try again.');
          addMessage('ava', "I apologize, but I'm having trouble processing your report. Please try refreshing the page.");
        } else {
          setError(`Failed to process report: ${errorMessage}`);
          addMessage('ava', "I apologize, but I encountered an error while analyzing your report. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Try to get username from localStorage
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      setUserName(storedName);
    }
    
    // Start processing the report
    processReport();
  }, [reportId, userName, retryCount]);

  // Handle user sending a message
  const handleSendMessage = (message: string) => {
    // Add user message to chat
    addMessage('user', message);
    setUserMessage('');
    
    // Generate response based on the analysis results
    setTimeout(() => {
      let responseMessage = '';
      
      // Check if the message mentions any specific parameter
      const mentionedParameter = analysisResults.find(result => 
        message.toLowerCase().includes(result.parameter.toLowerCase())
      );
      
      if (mentionedParameter) {
        responseMessage = `${mentionedParameter.description} ${mentionedParameter.recommendation}`;
        if (mentionedParameter.criticalAction) {
          responseMessage += ` ${mentionedParameter.criticalAction}`;
        }
      } else if (message.toLowerCase().includes('summary') || message.toLowerCase().includes('overall')) {
        const highRiskCount = analysisResults.filter(r => r.riskLevel === 'high').length;
        const mediumRiskCount = analysisResults.filter(r => r.riskLevel === 'medium').length;
        const lowRiskCount = analysisResults.filter(r => r.riskLevel === 'low').length;
        const normalCount = analysisResults.filter(r => r.riskLevel === 'normal').length;
        
        responseMessage = `Here's a summary of your results:
• High Risk Parameters: ${highRiskCount}
• Medium Risk Parameters: ${mediumRiskCount}
• Low Risk Parameters: ${lowRiskCount}
• Normal Parameters: ${normalCount}

${highRiskCount > 0 ? '⚠️ You have some parameters that need immediate attention. Please consult your healthcare provider.' : 
  mediumRiskCount > 0 ? '📋 You have some parameters that should be monitored. Consider discussing these with your healthcare provider.' :
  '✅ Your results are generally within normal ranges.'}`;
      } else {
        responseMessage = "I'm happy to answer any specific questions you have about your blood test results. You can ask about particular parameters, or I can provide an overall summary of your results.";
      }
      
      // Add AI response to chat
      addMessage('ava', responseMessage);
    }, 1500);
  };

  // Filter analysis items by risk level
  const highRiskItems = analysisResults.filter(item => item.riskLevel === 'high');
  const mediumRiskItems = analysisResults.filter(item => item.riskLevel === 'medium');
  const lowRiskItems = analysisResults.filter(item => item.riskLevel === 'low');
  const normalItems = analysisResults.filter(item => item.riskLevel === 'normal');

  const handleBack = () => {
    navigate('/');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="border-b border-gray-200 p-4 bg-white shadow-sm">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <AvaLogo />
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container py-6">
        {/* Progress Tracker */}
        <div className="mb-6">
          <ProgressBar stage={stage} />
        </div>
        
        {/* Chat Window */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Analysis in Progress</h2>
            <p className="text-sm text-gray-500">
              Ava AI <span className="text-xs">(Blood Analysis Expert)</span> is analyzing your blood report
            </p>
          </div>
          
          <div className="h-[300px] overflow-y-auto">
            <ChatWindow 
              messages={messages}
              isTyping={stage !== 'complete'}
              whoIsTyping={stage !== 'complete' ? 'ava' : undefined}
            />
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <MessageInput 
              onSendMessage={handleSendMessage} 
              placeholder={stage === 'complete' ? "Ask about your results..." : "Please wait while I analyze your report..."}
              disabled={stage !== 'complete'}
            />
          </div>
        </div>
        
        {/* Results Section - Only shown when analysis is complete */}
        {stage === 'complete' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Your Analysis Results</h2>
              <p className="text-gray-500">
                We've analyzed your blood report and categorized findings by risk level
              </p>
            </div>
            
            <Tabs defaultValue="high" value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="mb-6 bg-gray-100">
                <TabsTrigger value="high" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800">
                  High Risk ({highRiskItems.length})
                </TabsTrigger>
                <TabsTrigger value="medium" className="data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
                  Medium Risk ({mediumRiskItems.length})
                </TabsTrigger>
                <TabsTrigger value="low" className="data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-800">
                  Low Risk ({lowRiskItems.length})
                </TabsTrigger>
                <TabsTrigger value="normal" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
                  Normal ({normalItems.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                  All Parameters
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="high" className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {highRiskItems.map((item, index) => (
                    <AnalysisCard key={`high-${index}`} item={item} />
                  ))}
                  {highRiskItems.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                      No high risk parameters found
                    </div>
                  )}
                </div>
                
                {highRiskItems.length > 0 && (
                  <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5" />
                      Critical Summary
                    </h3>
                    <p className="text-red-700">
                      Your high-risk parameters require immediate attention. Please consider scheduling a follow-up appointment with your healthcare provider within the next 2 weeks to discuss these results and potential treatment options.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="medium" className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mediumRiskItems.map((item, index) => (
                    <AnalysisCard key={`medium-${index}`} item={item} />
                  ))}
                  {mediumRiskItems.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                      No medium risk parameters found
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="low" className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lowRiskItems.map((item, index) => (
                    <AnalysisCard key={`low-${index}`} item={item} />
                  ))}
                  {lowRiskItems.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                      No low risk parameters found
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="normal" className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {normalItems.map((item, index) => (
                    <AnalysisCard key={`normal-${index}`} item={item} />
                  ))}
                  {normalItems.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                      No normal parameters found
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="all" className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysisResults.map((item, index) => (
                    <AnalysisCard key={`all-${index}`} item={item} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
};

export default Results;
