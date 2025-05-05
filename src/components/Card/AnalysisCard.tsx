
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertTriangle, Info, CheckCircle } from 'lucide-react';

export type RiskLevel = 'high' | 'medium' | 'low' | 'normal';

export interface AnalysisItem {
  parameter: string;
  value: string;
  referenceRange: string;
  description: string;
  recommendation: string;
  criticalAction?: string;
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
        return 'bg-red-100 text-red-700 border-red-300';
      case 'medium':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'low':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'normal':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const getRiskIcon = (risk: RiskLevel) => {
    switch (risk) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'low':
        return <Info className="h-4 w-4 text-yellow-600" />;
      case 'normal':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
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
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-gray-800">{item.parameter}</CardTitle>
            <CardDescription className="mt-1">
              Value: <span className="font-medium text-gray-800">{item.value}</span> | 
              Reference: <span className="font-medium text-gray-600">{item.referenceRange}</span>
            </CardDescription>
          </div>
          <div className={`px-2 py-1 rounded-md text-xs border ${getRiskBadgeColor(item.riskLevel)} flex items-center gap-1`}>
            {getRiskIcon(item.riskLevel)}
            {getRiskText(item.riskLevel)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        <p className="text-sm text-gray-600">{item.description}</p>
        
        {item.riskLevel === 'high' && item.criticalAction && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-medium text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Action Required
            </p>
            <p className="text-sm text-red-700 mt-1">{item.criticalAction}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 flex flex-col items-stretch">
        <Button 
          variant="ghost" 
          className="text-ava-neon-green-dark hover:text-ava-neon-green-dark hover:bg-green-50 w-full flex justify-between items-center"
          onClick={() => setShowRecommendation(!showRecommendation)}
        >
          <span>Recommendations</span>
          {showRecommendation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        
        {showRecommendation && (
          <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
            {item.recommendation}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default AnalysisCard;
