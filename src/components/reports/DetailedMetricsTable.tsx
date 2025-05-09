import { HealthMetric } from "@/services/healthAnalysisService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Filter, Search } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface DetailedMetricsTableProps {
  metrics: HealthMetric[];
}

export function DetailedMetricsTable({ metrics }: DetailedMetricsTableProps) {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Create a unique identifier for each metric
  const getMetricKey = (metric: HealthMetric, index: number) => {
    return `${metric.name}-${metric.category || ''}-${index}`;
  };

  // Filter and sort metrics
  const sortedMetrics = metrics
    .filter(metric => {
      const matchesSearch = metric.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || metric.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by risk level first
      const riskOrder = {
        danger: 0,
        high_risk: 0,
        warning: 1,
        medium_risk: 1,
        normal: 2,
        low_risk: 2
      };
      const riskDiff = (riskOrder[a.status as keyof typeof riskOrder] || 2) - 
                      (riskOrder[b.status as keyof typeof riskOrder] || 2);
      if (riskDiff !== 0) return riskDiff;
      
      // Then sort alphabetically
      return a.name.localeCompare(b.name);
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "danger":
      case "high_risk":
        return <Badge variant="destructive">High Risk</Badge>;
      case "warning":
      case "medium_risk":
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Medium Risk</Badge>;
      default:
        return <Badge variant="outline" className="border-green-500 text-green-500">Normal</Badge>;
    }
  };

  // Helper function to ensure values are strings
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const toggleMetricDetails = (metricName: string) => {
    if (expandedMetric === metricName) {
      setExpandedMetric(null);
    } else {
      setExpandedMetric(metricName);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Input
            placeholder="Search parameters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
          />
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
        </div>
        <div className="w-full md:w-64">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {["all", "danger", "high_risk", "warning", "medium_risk", "normal", "low_risk"].map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All Statuses" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-semibold">Parameter</TableHead>
              <TableHead className="font-semibold">Value</TableHead>
              <TableHead className="font-semibold">Unit</TableHead>
              <TableHead className="font-semibold">Reference Range</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold w-10">Info</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedMetrics.length > 0 ? (
              sortedMetrics.map((metric, index) => (
                <TableRow 
                  key={getMetricKey(metric, index)}
                  className={
                    metric.status === "danger" || metric.status === "high_risk" ? "bg-red-900/10" :
                    metric.status === "warning" || metric.status === "medium_risk" ? "bg-amber-900/10" : ""
                  }
                >
                  <TableCell className="font-medium">
                    {metric.name}
                    {metric.category && (
                      <div className="text-xs text-muted-foreground mt-1">{metric.category}</div>
                    )}
                  </TableCell>
                  <TableCell className={`font-medium ${
                    metric.status === "danger" || metric.status === "high_risk" ? "text-destructive" :
                    metric.status === "warning" || metric.status === "medium_risk" ? "text-amber-500" : ""
                  }`}>
                    {formatValue(metric.value)}
                  </TableCell>
                  <TableCell>{formatValue(metric.unit)}</TableCell>
                  <TableCell>{formatValue(metric.range)}</TableCell>
                  <TableCell>{getStatusBadge(metric.status)}</TableCell>
                  <TableCell>
                    {metric.description && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{metric.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No metrics found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        Showing {sortedMetrics.length} of {metrics.length} parameters
      </div>
    </div>
  );
} 