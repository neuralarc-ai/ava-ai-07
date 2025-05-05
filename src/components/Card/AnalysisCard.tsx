
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

export type RiskLevel = 'high' | 'medium' | 'low' | 'normal';

export interface AnalysisItem {
  parameter: string;
  value: string;
  referenceRange: string;
  description: string;
  recommendation: string;
  riskLevel: RiskLevel;
}

interface AnalysisCardProps {
  item: AnalysisItem;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ item }) => {
  const [showRecommendation, setShowRecommendation] = useState(false);

  const getRiskBadgeColor = (risk: RiskLevel) => {
    switch (risk) {
      case 'high':
        return 'bg-red-900 text-red-200';
      case 'medium':
        return 'bg-orange-900 text-orange-200';
      case 'low':
        return 'bg-yellow-900 text-yellow-200';
      case 'normal':
        return 'bg-green-900 text-green-200';
      default:
        return 'bg-blue-900 text-blue-200';
    }
  };

  const getRiskText = (risk: RiskLevel) => {
    switch (risk) {
      case 'high':
        return 'High Risk';
      case 'medium':
        return 'Medium Risk';
      case 'low':
        return 'Low Risk';
      case 'normal':
        return 'Normal';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="bg-ava-card-bg border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-ava-light">{item.parameter}</CardTitle>
            <CardDescription className="mt-1">
              Value: <span className="font-medium text-ava-light">{item.value}</span> | 
              Reference: <span className="font-medium text-gray-300">{item.referenceRange}</span>
            </CardDescription>
          </div>
          <div className={`px-2 py-1 rounded-md text-xs ${getRiskBadgeColor(item.riskLevel)}`}>
            {getRiskText(item.riskLevel)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <p className="text-sm text-gray-300">{item.description}</p>
      </CardContent>
      
      <CardFooter className="pt-2 flex flex-col items-stretch">
        <Button 
          variant="ghost" 
          className="text-ava-neon-green hover:text-ava-neon-green-light hover:bg-gray-800 w-full flex justify-between items-center"
          onClick={() => setShowRecommendation(!showRecommendation)}
        >
          <span>How to fix it</span>
          {showRecommendation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        
        {showRecommendation && (
          <div className="mt-2 p-3 bg-gray-800 rounded-md text-sm text-gray-300">
            {item.recommendation}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default AnalysisCard;
