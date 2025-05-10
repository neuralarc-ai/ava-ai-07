import { toast } from "@/hooks/use-toast";
// @ts-ignore: No type definitions for 'jsonrepair'
import { jsonrepair } from 'jsonrepair';
import { v4 as uuidv4 } from 'uuid';

// Type definitions for health report analysis
export interface HealthMetric {
  name: string;
  value: string | number;
  unit?: string;
  status: 'normal' | 'warning' | 'danger' | 'high_risk' | 'medium_risk' | 'low_risk';
  range?: string;
  description: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
  history?: { date: string; value: string | number }[];
  category?: string;
  riskLevel?: 'high' | 'medium' | 'low' | 'normal';
}

export interface PatientInfo {
  name?: string;
  age?: string;
  gender?: string;
  dateOfBirth?: string;
  patientId?: string;
  collectionDate?: string;
  reportDate?: string;
  doctorName?: string;
  hospitalName?: string;
}

export interface AnalysisResult {
  patientInfo?: {
    name?: string;
    age?: string;
    gender?: string;
    dateOfBirth?: string;
    patientId?: string;
    collectionDate?: string;
    reportDate?: string;
    doctorName?: string;
    hospitalName?: string;
  };
  summary?: string;
  detailedAnalysis?: string;
  recommendations?: string[];
  metrics: HealthMetric[];
  riskSummary?: string;
  categories?: string[];
}

// Add these interfaces at the top with other interfaces
interface StoredReport {
  id: string;
  timestamp: number;
  patientInfo?: PatientInfo;
  metrics: HealthMetric[];
  summary?: string;
  detailedAnalysis?: string;
  recommendations?: string[];
  categories?: string[];
}

// Function to normalize strings to make comparing metrics easier
function normalizeString(str: string): string {
  return str.toLowerCase()
    .replace(/[\s\-\_\:\/\,\.\(\)]+/g, '')
    .replace(/hemoglobina/, 'hemoglobin')
    .replace(/triglycerides/, 'triglyceride')
    .replace(/lymphocytes/, 'lymphocyte')
    .replace(/neutrophils/, 'neutrophil')
    .replace(/platelets/, 'platelet')
    .replace(/sodium/, 'na')
    .replace(/potassium/, 'k')
    .replace(/chloride/, 'cl')
    .replace(/calcium/, 'ca')
    .replace(/totalbilirubin/, 'bilirubintotal')
    .replace(/directbilirubin/, 'bilirubindirect')
    .replace(/sgot/, 'ast')
    .replace(/sgpt/, 'alt');
}

// Function to merge metrics from multiple analyses
function mergeMetrics(allMetrics: HealthMetric[][]): HealthMetric[] {
  // Create a map to store merged metrics by normalized name
  const metricMap = new Map<string, HealthMetric>();
  
  // Process all metrics from all models
  for (const metrics of allMetrics) {
    for (const metric of metrics) {
      // Skip empty metrics
      if (!metric.name) continue;
      
      const normalizedName = normalizeString(metric.name);
      
      if (metricMap.has(normalizedName)) {
        // Update existing metric with better data if available
        const existing = metricMap.get(normalizedName)!;
        
        // Keep the more detailed description
        if ((!existing.description && metric.description) || 
            (metric.description && existing.description && 
             metric.description.length > existing.description.length)) {
          existing.description = metric.description;
        }
        
        // Keep more specific range if available
        if ((!existing.range || existing.range === "Not specified") && 
            metric.range && metric.range !== "Not specified") {
          existing.range = metric.range;
        }
        
        // If both have ranges, prefer the more specific one
        if (existing.range && metric.range && 
            existing.range !== "Not specified" && metric.range !== "Not specified" &&
            metric.range.length > existing.range.length) {
          existing.range = metric.range;
        }
      } else {
        // Add new metric to the map
        metricMap.set(normalizedName, { ...metric });
      }
    }
  }
  
  // Convert map back to array
  return Array.from(metricMap.values());
}

// Function to merge patient info from multiple analyses
function mergePatientInfo(allPatientInfos: PatientInfo[]): PatientInfo {
  const merged: PatientInfo = {};
  
  // First check if we have a name from the filename
  const patientNameFromFile = localStorage.getItem('patientName');
  if (patientNameFromFile) {
    merged.name = patientNameFromFile;
  }
  
  for (const info of allPatientInfos) {
    if (!info) continue;
    
    // For each field, prefer non-empty values
    Object.entries(info).forEach(([key, value]) => {
      if (value && typeof value === 'string' && value.trim() !== '') {
        const existingValue = merged[key as keyof PatientInfo];
        
        // Skip if we already have a name from the filename and this is the name field
        if (key === 'name' && patientNameFromFile) {
          return;
        }
        
        // If we don't have this field yet, or the new value is longer (possibly more detailed)
        if (!existingValue || 
            (typeof existingValue === 'string' && 
             value.length > existingValue.length && 
             !value.includes('undefined'))) {
          merged[key as keyof PatientInfo] = value;
        }
      }
    });
  }
  
  return merged;
}

async function analyzeWithModel(text: string): Promise<AnalysisResult> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found in environment variables');
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a medical assistant specializing in analyzing health reports and lab results. Your task is to provide a COMPREHENSIVE analysis including:

1. A detailed summary of the overall health status
2. Specific recommendations based on the findings
3. A thorough analysis of each parameter

IMPORTANT: You MUST include ALL of the following in your response:
- A detailed summary (minimum 100 words)
- At least 3 specific recommendations
- A comprehensive analysis of each parameter

Format your response as valid JSON with this EXACT structure:
{
  "patientInfo": {
    "name": string,
    "age": string,
    "gender": string,
    "dateOfBirth": string,
    "patientId": string,
    "collectionDate": string,
    "reportDate": string,
    "doctorName": string,
    "hospitalName": string
  },
  "metrics": [
    {
      "name": string,
      "value": number or string,
      "unit": string,
      "status": "normal"|"warning"|"danger"|"high_risk"|"medium_risk"|"low_risk",
      "range": string,
      "description": string,
      "category": string
    }
  ],
  "summary": string,  // REQUIRED: Detailed summary of overall health status
  "recommendations": [string],  // REQUIRED: At least 3 specific recommendations
  "detailedAnalysis": string,  // REQUIRED: Comprehensive analysis of findings
  "categories": [string]
}

Guidelines for Summary and Analysis:
1. Summary should be concise (2-3 paragraphs) and focus on:
   - Key abnormal findings
   - Most significant health implications
   - Overall health status assessment

2. Detailed Analysis should be structured and include:
   - Analysis of abnormal parameters first
   - Explanation of clinical significance
   - Relationship between different parameters
   - Potential underlying conditions
   - Normal parameters can be summarized briefly

3. Recommendations should be:
   - Specific and actionable
   - Based on the findings
   - Include follow-up suggestions
   - Include lifestyle modifications if relevant

Analyze this health report/lab result: ${text}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content received from Gemini API');
    }

    try {
      // Robustly extract JSON from the response
      let jsonText = content;
      const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```/) ||
                        content.match(/({[\s\S]*})/) ||
                        [null, content];
      jsonText = jsonMatch[1]?.trim() || content;
      
      // Remove trailing commas before } or ]
      jsonText = jsonText.replace(/,\s*([}\]])/g, '$1');
      
      // Attempt to repair JSON before parsing
      const repaired = jsonrepair(jsonText);
      const result = JSON.parse(repaired);

      // Add debug logging
      console.log('Gemini API Response:', {
        hasSummary: !!result.summary,
        hasRecommendations: !!result.recommendations,
        hasDetailedAnalysis: !!result.detailedAnalysis,
        metricsCount: result.metrics?.length
      });

      // Validate the result structure
      if (!result.metrics || !Array.isArray(result.metrics)) {
        throw new Error('Invalid response structure: metrics array is missing');
      }

      // Ensure summary and recommendations are present and valid
      if (!result.summary || typeof result.summary !== 'string' || result.summary.trim().length < 50) {
        result.summary = "The analysis of your health report reveals several key findings. The most significant observations are the abnormal parameters that may indicate underlying health conditions. While some parameters are within normal ranges, the elevated values require attention and may warrant further investigation. Please consult with your healthcare provider for a detailed interpretation of these results.";
      }

      if (!result.recommendations || !Array.isArray(result.recommendations) || result.recommendations.length === 0) {
        result.recommendations = [
          "Schedule a follow-up appointment with your healthcare provider to discuss these results in detail.",
          "Maintain a record of these test results for future reference and comparison.",
          "Consider lifestyle modifications based on your healthcare provider's advice."
        ];
      }

      if (!result.detailedAnalysis || typeof result.detailedAnalysis !== 'string' || result.detailedAnalysis.trim().length < 50) {
        result.detailedAnalysis = "The detailed analysis of your health report shows several parameters that require attention. The abnormal values suggest potential underlying conditions that need further evaluation. The relationship between different parameters provides important insights into your overall health status. While some parameters are within normal ranges, the combination of abnormal values may indicate specific health concerns that should be addressed with your healthcare provider.";
      }

      // Ensure all required fields are present and properly formatted
      result.metrics = result.metrics.map((metric: any) => {
        // Convert numeric values to numbers where possible
        let value = metric.value;
        if (typeof value === 'string') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            value = numValue;
          }
        }

        return {
          name: metric.name || 'Unknown',
          value: value,
          unit: metric.unit || '',
          status: metric.status || 'normal',
          range: metric.range || '',
          description: metric.description || '',
          category: metric.category || 'Other',
          history: []
        };
      });

      return result;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      throw new Error('Failed to parse Gemini API response');
    }
  } catch (error) {
    console.error("Error analyzing with Gemini:", error);
    throw error;
  }
}

// Add these functions before analyzeHealthReport
function storeReportAnalysis(report: AnalysisResult): string {
  const reports = getStoredReports();
  const reportId = uuidv4();
  
  const storedReport: StoredReport = {
    id: reportId,
    timestamp: Date.now(),
    patientInfo: report.patientInfo,
    metrics: report.metrics,
    summary: report.summary,
    detailedAnalysis: report.detailedAnalysis,
    recommendations: report.recommendations,
    categories: report.categories
  };
  
  reports.push(storedReport);
  localStorage.setItem('storedReports', JSON.stringify(reports));
  
  return reportId;
}

export function getStoredReports(): StoredReport[] {
  const reports = localStorage.getItem('storedReports');
  return reports ? JSON.parse(reports) : [];
}

export function getStoredReportById(id: string): StoredReport | null {
  const reports = getStoredReports();
  return reports.find(report => report.id === id) || null;
}

export function deleteStoredReport(id: string): void {
  const reports = getStoredReports();
  const updatedReports = reports.filter(report => report.id !== id);
  localStorage.setItem('storedReports', JSON.stringify(updatedReports));
}

// Modify the analyzeHealthReport function
export async function analyzeHealthReport(text: string): Promise<AnalysisResult & { reportId: string }> {
  try {
    console.log("Starting health report analysis with Gemini");
    
    // Analyze with Gemini
    const result = await analyzeWithModel(text);
    if (!result || result.metrics.length === 0) {
      throw new Error("Failed to analyze the health report");
    }
    
    // Update patient info with name from filename if available
    const patientNameFromFile = localStorage.getItem('patientName');
    if (patientNameFromFile && result.patientInfo) {
      result.patientInfo.name = patientNameFromFile;
    } else if (patientNameFromFile) {
      result.patientInfo = { name: patientNameFromFile };
    }
    
    // Store the analysis result
    const reportId = storeReportAnalysis(result);
    
    toast({
      title: "Analysis Complete",
      description: `Health report analyzed successfully (${result.metrics.length} parameters found)`,
    });
    
    // Return the result with the report ID
    return { ...result, reportId };
  } catch (error) {
    console.error("Error analyzing health report:", error);
    toast({
      title: "Analysis Failed",
      description: "Failed to analyze your health report. Please try again.",
      variant: "destructive",
    });
    throw error;
  }
}

// Add this function to clear all stored reports
export function clearAllStoredReports(): void {
  localStorage.removeItem('storedReports');
  toast({
    title: "Reports Cleared",
    description: "All stored reports have been removed.",
  });
}

// Clear all stored health data
export function clearAllHealthData(): void {
  localStorage.removeItem('scannedReports');
  localStorage.removeItem('patientName');
  toast({
    title: "Data Cleared",
    description: "All health data has been removed from your device.",
  });
} 