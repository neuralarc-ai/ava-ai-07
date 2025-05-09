import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Activity } from "lucide-react";
import { cn } from '@/lib/utils';

interface HealthMetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: 'normal' | 'warning' | 'danger' | 'high_risk' | 'medium_risk' | 'low_risk';
  description?: string;
  range?: string;
  className?: string;
}

export function HealthMetricCard({
  title,
  value,
  unit,
  status,
  description,
  range,
  className
}: HealthMetricCardProps) {
  const getStatusIcon = () => {
    switch(status) {
      case "danger":
      case "high_risk":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "warning":
      case "medium_risk":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Activity className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusText = () => {
    switch(status) {
      case "danger":
      case "high_risk":
        return "High Risk";
      case "warning":
      case "medium_risk":
        return "Medium Risk";
      default:
        return "Normal";
    }
  };

  const getStatusColor = () => {
    switch(status) {
      case "danger":
      case "high_risk":
        return "text-destructive";
      case "warning":
      case "medium_risk":
        return "text-amber-500";
      default:
        return "text-green-500";
    }
  };

  return (
    <Card className={cn(
      'overflow-hidden',
      status === 'danger' || status === 'high_risk' && 'border-destructive/50',
      status === 'warning' || status === 'medium_risk' && 'border-warning/50',
      status === 'normal' || status === 'low_risk' && 'border-success/50',
      className
    )}>
      <CardHeader className="space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          <span className="text-sm font-normal text-muted-foreground ml-1">
            {unit}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Normal Range: {range}
        </p>
      </CardContent>
    </Card>
  );
} 