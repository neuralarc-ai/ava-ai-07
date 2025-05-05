
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AvaLogo from '@/components/AvaLogo';
import ChatWindow from '@/components/Chat/ChatWindow';
import ProgressBar, { AnalysisStage } from '@/components/ProgressBar';
import AnalysisCard, { AnalysisItem } from '@/components/Card/AnalysisCard';
import { Settings, ArrowLeft } from 'lucide-react';
import { Message } from '@/components/Chat/ChatWindow';
import { v4 as uuidv4 } from 'uuid';

// Sample data
const sampleAnalysisItems: AnalysisItem[] = [
  {
    parameter: 'LDL Cholesterol',
    value: '145 mg/dL',
    referenceRange: '< 100 mg/dL',
    description: 'Your LDL (bad cholesterol) is elevated, which may increase risk of heart disease.',
    recommendation: 'Consider reducing saturated fat intake, increasing fiber, regular exercise, and possibly medication if lifestyle changes aren\'t enough.',
    riskLevel: 'medium'
  },
  {
    parameter: 'Vitamin D',
    value: '18 ng/mL',
    referenceRange: '30-50 ng/mL',
    description: 'Your Vitamin D level is low, which can affect bone health and immune function.',
    recommendation: 'Increase sun exposure (15-20 minutes daily), consume Vitamin D-rich foods like fatty fish and fortified dairy, or consider supplements (1000-2000 IU daily).',
    riskLevel: 'low'
  },
  {
    parameter: 'Triglycerides',
    value: '210 mg/dL',
    referenceRange: '< 150 mg/dL',
    description: 'Your triglyceride level is high, which can contribute to heart disease.',
    recommendation: 'Limit sugar and refined carbs, reduce alcohol consumption, increase omega-3 fatty acids, and maintain regular physical activity.',
    riskLevel: 'high'
  },
  {
    parameter: 'Hemoglobin',
    value: '14.2 g/dL',
    referenceRange: '12-15.5 g/dL',
    description: 'Your hemoglobin level is normal, indicating good oxygen-carrying capacity.',
    recommendation: 'Continue with your current diet and exercise habits to maintain healthy levels.',
    riskLevel: 'normal'
  },
];

// Simulated conversation between Ava and Sam
const simulatedConversation: (stage: AnalysisStage, userName: string) => Message[] = (stage, userName) => {
  const baseMessages: Message[] = [
    {
      id: uuidv4(),
      sender: 'ava',
      message: `I'm reviewing ${userName}'s blood report now...`,
      timestamp: new Date(Date.now() - 10000),
      isNew: false
    },
    {
      id: uuidv4(),
      sender: 'sam',
      message: "Great, let's start by checking the lipid panel.",
      timestamp: new Date(Date.now() - 9000),
      isNew: false
    }
  ];

  if (stage === 'reading' || stage === 'analyzing') {
    return baseMessages;
  }

  const discussingMessages: Message[] = [
    ...baseMessages,
    {
      id: uuidv4(),
      sender: 'ava',
      message: "I'm scanning the lipid panel now... hmm, I'm seeing elevated LDL at 145 mg/dL. That's above the recommended level.",
      timestamp: new Date(Date.now() - 8000),
      isNew: false
    },
    {
      id: uuidv4(),
      sender: 'sam',
      message: "Yes, I see that too. Let's flag it under Moderate Risk and add dietary guidance. I also notice the triglycerides are quite high at 210 mg/dL.",
      timestamp: new Date(Date.now() - 7000),
      isNew: false
    }
  ];

  if (stage === 'discussing') {
    return discussingMessages;
  }

  const finalizingMessages: Message[] = [
    ...discussingMessages,
    {
      id: uuidv4(),
      sender: 'ava',
      message: "Also noticing Vitamin D is low at 18 ng/mL. We'll suggest sunlight exposure and food-based fixes.",
      timestamp: new Date(Date.now() - 6000),
      isNew: false
    },
    {
      id: uuidv4(),
      sender: 'sam',
      message: "Good catch. Low vitamin D can affect immune function and bone health. Let's categorize it as Low Risk since it's easy to address.",
      timestamp: new Date(Date.now() - 5000),
      isNew: false
    }
  ];

  if (stage === 'finalizing') {
    return finalizingMessages;
  }

  const completeMessages: Message[] = [
    ...finalizingMessages,
    {
      id: uuidv4(),
      sender: 'ava',
      message: `I've completed my analysis of ${userName}'s blood work. Here's what we found: elevated LDL cholesterol (moderate risk), high triglycerides (high risk), and low vitamin D (low risk). All other parameters look normal.`,
      timestamp: new Date(Date.now() - 4000),
      isNew: false
    },
    {
      id: uuidv4(),
      sender: 'sam',
      message: `Perfect! I've prepared lifestyle recommendations for each finding. Let's present these results to ${userName} now with clear actionable steps.`,
      timestamp: new Date(Date.now() - 3000),
      isNew: false
    },
    {
      id: uuidv4(),
      sender: 'ava',
      message: `${userName}, your results are ready! You can now view the detailed analysis below. We've organized everything by risk level for clarity. Please let me know if you have any questions.`,
      timestamp: new Date(Date.now() - 1000),
      isNew: true
    }
  ];

  return completeMessages;
};

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stage, setStage] = useState<AnalysisStage>('reading');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState('there');
  const [currentTab, setCurrentTab] = useState('high');
  
  // Get report data from URL
  const reportId = new URLSearchParams(location.search).get('report');
  
  // Simulate the analysis process
  useEffect(() => {
    // Try to get username from localStorage
    const storedName = localStorage.getItem('user_name');
    if (storedName) {
      setUserName(storedName);
    }
    
    // Simulate the analysis stages
    const stages: AnalysisStage[] = ['reading', 'analyzing', 'discussing', 'finalizing', 'complete'];
    let currentStageIndex = 0;
    
    const interval = setInterval(() => {
      if (currentStageIndex < stages.length) {
        setStage(stages[currentStageIndex]);
        setMessages(simulatedConversation(stages[currentStageIndex], userName));
        currentStageIndex++;
      } else {
        clearInterval(interval);
      }
    }, 3000); // Change stage every 3 seconds
    
    return () => clearInterval(interval);
  }, [userName]);

  // Filter analysis items by risk level
  const highRiskItems = sampleAnalysisItems.filter(item => item.riskLevel === 'high');
  const mediumRiskItems = sampleAnalysisItems.filter(item => item.riskLevel === 'medium');
  const lowRiskItems = sampleAnalysisItems.filter(item => item.riskLevel === 'low');
  const normalItems = sampleAnalysisItems.filter(item => item.riskLevel === 'normal');

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-ava-dark text-ava-light">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleBack}
              className="text-gray-400 hover:text-ava-light hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <AvaLogo />
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-gray-400 hover:text-ava-light hover:bg-gray-800"
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
        <div className="bg-gray-900 rounded-lg shadow-lg border border-gray-800 mb-8">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-xl font-semibold">Analysis in Progress</h2>
            <p className="text-sm text-gray-400">
              Ava AI and Sam are analyzing your blood report
            </p>
          </div>
          
          <div className="h-[300px] overflow-y-auto">
            <ChatWindow 
              messages={messages}
              isTyping={stage !== 'complete'}
              whoIsTyping={stage !== 'complete' ? (Math.random() > 0.5 ? 'ava' : 'sam') : undefined}
            />
          </div>
        </div>
        
        {/* Results Section - Only shown when analysis is complete */}
        {stage === 'complete' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Your Analysis Results</h2>
              <p className="text-gray-400">
                We've analyzed your blood report and categorized findings by risk level
              </p>
            </div>
            
            <Tabs defaultValue="high" value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="mb-6 bg-gray-800">
                <TabsTrigger value="high" className="data-[state=active]:bg-red-900 data-[state=active]:text-white">
                  High Risk ({highRiskItems.length})
                </TabsTrigger>
                <TabsTrigger value="medium" className="data-[state=active]:bg-orange-900 data-[state=active]:text-white">
                  Medium Risk ({mediumRiskItems.length})
                </TabsTrigger>
                <TabsTrigger value="low" className="data-[state=active]:bg-yellow-900 data-[state=active]:text-white">
                  Low Risk ({lowRiskItems.length})
                </TabsTrigger>
                <TabsTrigger value="normal" className="data-[state=active]:bg-green-900 data-[state=active]:text-white">
                  Normal ({normalItems.length})
                </TabsTrigger>
                <TabsTrigger value="all" className="data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                  All Parameters
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="high" className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {highRiskItems.map((item, index) => (
                    <AnalysisCard key={`high-${index}`} item={item} />
                  ))}
                  {highRiskItems.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-400">
                      No high risk parameters found
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="medium" className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mediumRiskItems.map((item, index) => (
                    <AnalysisCard key={`medium-${index}`} item={item} />
                  ))}
                  {mediumRiskItems.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-400">
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
                    <div className="col-span-full text-center py-10 text-gray-400">
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
                    <div className="col-span-full text-center py-10 text-gray-400">
                      No normal parameters found
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="all" className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sampleAnalysisItems.map((item, index) => (
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
