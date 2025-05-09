import { toast } from "@/hooks/use-toast";

// Type definitions for health report analysis
export interface HealthMetric {
  name: string;
  value: number | string;
  unit: string;
  status: "normal" | "warning" | "danger" | "high_risk" | "medium_risk" | "low_risk";
  range: string;
  history: Array<{
    date: string;
    value: number;
  }>;
  description?: string;
  category?: string;
  visualIndicator?: "H" | "L" | "M" | "↑" | "↓" | "normal";
  riskLevel?: "high" | "medium" | "low" | "normal";
  trend?: "increasing" | "decreasing" | "stable";
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
  metrics: HealthMetric[];
  recommendations: string[];
  summary?: string;
  detailedAnalysis?: string;
  modelUsed?: string;
  categories?: string[];
  patientInfo?: PatientInfo;
  riskSummary?: {
    highRisk: string[];
    mediumRisk: string[];
    lowRisk: string[];
    normal: string[];
  };
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
        
        // Keep more specific category
        if ((!existing.category && metric.category) || 
            (metric.category && existing.category && 
             metric.category !== "Other" && existing.category === "Other")) {
          existing.category = metric.category;
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
            text: `You are a medical assistant specializing in analyzing health reports and lab results. Extract ALL relevant information in detail:

1. Patient Information: Extract any patient details (name, ID, gender, date of birth, collection date).
2. Health Metrics: For EVERY single parameter mentioned in the report:
   - Extract the exact parameter name AS SHOWN in the report (maintain original terminology)
   - Extract the value and unit exactly as shown
   - Extract the reference range exactly as shown
   - Identify any visual indicators (H, L, M, ↑, ↓) or color coding
   - Determine risk level based on:
     * HIGH RISK: Significantly outside range (>50% deviation) or marked with H/↑
     * MEDIUM RISK: Moderately outside range (20-50% deviation) or marked with M
     * LOW RISK: Slightly outside range (<20% deviation) or marked with L/↓
     * NORMAL: Within reference range
   - Provide a detailed description of what each parameter measures
   - Categorize each parameter into one of these categories:
     * "Complete Blood Count (CBC)"
     * "Lipid Profile"
     * "Liver Function"
     * "Kidney Function"
     * "Electrolytes"
     * "Thyroid Function"
     * "Diabetes Markers"
     * "Inflammatory Markers"
     * "Cardiac Markers"
     * "Other"

Format your response as valid JSON with the structure:
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
      "category": string,
      "visualIndicator": "H"|"L"|"M"|"↑"|"↓"|"normal",
      "riskLevel": "high"|"medium"|"low"|"normal",
      "trend": "increasing"|"decreasing"|"stable"
    }
  ],
  "recommendations": [string],
  "summary": string,
  "detailedAnalysis": string,
  "categories": [string],
  "riskSummary": {
    "highRisk": [string],
    "mediumRisk": [string],
    "lowRisk": [string],
    "normal": [string]
  }
}

The detailedAnalysis should provide a comprehensive assessment of overall health based on the test results. Extract EVERY parameter mentioned, even rare ones, using EXACTLY the same terminology used in the report. DO NOT skip any parameters.

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
      // Try to parse
      const result = JSON.parse(jsonText);

      // Validate the result structure
      if (!result.metrics || !Array.isArray(result.metrics)) {
        throw new Error('Invalid response structure: metrics array is missing');
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

        // Determine risk level based on status and visual indicators
        let riskLevel = metric.riskLevel || 'normal';
        if (metric.status === 'high_risk' || metric.visualIndicator === 'H' || metric.visualIndicator === '↑') {
          riskLevel = 'high';
        } else if (metric.status === 'medium_risk' || metric.visualIndicator === 'M') {
          riskLevel = 'medium';
        } else if (metric.status === 'low_risk' || metric.visualIndicator === 'L' || metric.visualIndicator === '↓') {
          riskLevel = 'low';
        }

        return {
          name: metric.name || 'Unknown',
          value: value,
          unit: metric.unit || '',
          status: metric.status || 'normal',
          range: metric.range || '',
          description: metric.description || '',
          category: metric.category || 'Other',
          visualIndicator: metric.visualIndicator || 'normal',
          riskLevel: riskLevel,
          trend: metric.trend || 'stable'
        };
      });

      // Ensure risk summary is present
      if (!result.riskSummary) {
        result.riskSummary = {
          highRisk: [],
          mediumRisk: [],
          lowRisk: [],
          normal: []
        };
      }

      // Categorize metrics by risk level
      result.metrics.forEach((metric: HealthMetric) => {
        const metricName = `${metric.name} (${metric.value} ${metric.unit})`;
        switch (metric.riskLevel) {
          case 'high':
            result.riskSummary.highRisk.push(metricName);
            break;
          case 'medium':
            result.riskSummary.mediumRisk.push(metricName);
            break;
          case 'low':
            result.riskSummary.lowRisk.push(metricName);
            break;
          default:
            result.riskSummary.normal.push(metricName);
        }
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

export async function analyzeHealthReport(ocrText: string): Promise<AnalysisResult | null> {
  try {
    console.log("Starting health report analysis with Gemini");
    
    // Analyze with Gemini
    const result = await analyzeWithModel(ocrText);
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
    
    toast({
      title: "Analysis Complete",
      description: `Health report analyzed successfully (${result.metrics.length} parameters found)`,
    });
    
    // Remove all historical data by storing only the current report
    localStorage.removeItem('scannedReports');
    
    return result;
  } catch (error) {
    console.error("Error analyzing health report:", error);
    toast({
      title: "Analysis Failed",
      description: "Failed to analyze your health report. Please check your API key and try again.",
      variant: "destructive",
    });
    return null;
  }
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