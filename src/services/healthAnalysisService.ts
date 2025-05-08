import { toast } from "@/hooks/use-toast";

// Type definitions for health report analysis
export interface HealthMetric {
  name: string;
  value: number | string;
  unit: string;
  status: "normal" | "warning" | "danger";
  range: string;
  history: Array<{
    date: string;
    value: number;
  }>;
  description?: string;
  category?: string;
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

async function analyzeWithModel(ocrText: string, apiKey: string): Promise<AnalysisResult | null> {
  try {
    // Make the API call to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system", 
            content: `You are a medical assistant specializing in analyzing health reports and lab results. Extract ALL relevant information in detail:

1. Patient Information: Extract any patient details (name, ID, gender, date of birth, collection date).
2. Health Metrics: For EVERY single parameter mentioned in the report:
   - Extract the exact parameter name AS SHOWN in the report (maintain original terminology)
   - Extract the value and unit exactly as shown
   - Extract the reference range exactly as shown
   - Determine status: 'normal' if within range, 'warning' if slightly outside, 'danger' if significantly outside
   - Provide a detailed description of what each parameter measures
   - Categorize each parameter (e.g., "Electrolytes", "Lipids", "Liver Function", etc.)

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
      "status": "normal"|"warning"|"danger",
      "range": string,
      "description": string,
      "category": string
    }
  ],
  "recommendations": [string],
  "summary": string,
  "detailedAnalysis": string,
  "categories": [string]
}

The detailedAnalysis should provide a comprehensive assessment of overall health based on the test results. Extract EVERY parameter mentioned, even rare ones, using EXACTLY the same terminology used in the report. DO NOT skip any parameters.`
          },
          {
            role: "user", 
            content: `Analyze this health report/lab result. Extract ALL metrics mentioned, patient details, and reference ranges: ${ocrText}`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Extract the content from the response
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid API response structure:", data);
      return null;
    }
    
    const contentText = data.choices[0].message.content;
    console.log("Raw content response:", contentText);
    
    // Try to parse the JSON response, handling different response formats
    let analysisContent;
    try {
      // If the content is already an object, use it directly
      if (typeof contentText === 'object') {
        analysisContent = contentText;
      } else if (typeof contentText === 'string') {
        // Try to extract JSON if it's wrapped in markdown code blocks or text
        const jsonMatch = contentText.match(/```(?:json)?([\s\S]*?)```/) || 
                          contentText.match(/({[\s\S]*})/) ||
                          [null, contentText];
        
        const jsonText = jsonMatch[1]?.trim() || contentText;
        analysisContent = JSON.parse(jsonText);
      }
      
      if (!analysisContent || !analysisContent.metrics) {
        // If we couldn't parse proper JSON or the metrics are missing, create a basic structure
        analysisContent = {
          metrics: [],
          patientInfo: {},
          recommendations: ["Unable to extract specific metrics from this report format. Please consult your healthcare provider for interpretation."],
          summary: "The analysis could not extract structured metrics from this report format.",
          detailedAnalysis: "The report format could not be properly parsed into structured metrics. The OCR text has been preserved for reference."
        };
      }
      
      console.log("Parsed analysis result:", analysisContent);
    } catch (error) {
      console.error("Error parsing model response:", error);
      console.log("Failed content:", contentText);
      // Return a basic structure if parsing fails
      return {
        metrics: [],
        patientInfo: {},
        recommendations: ["Unable to analyze the report format. Please consult your healthcare provider for interpretation."],
        summary: "The analysis encountered an error when processing this report.",
        detailedAnalysis: "There was an error processing the report content. The OCR text has been preserved for reference.",
        modelUsed: "gpt-4-turbo-preview"
      };
    }
    
    // Add empty history arrays to each metric and ensure values are properly formatted
    const metricsWithHistory = (analysisContent.metrics || []).map((metric: any) => {
      // Ensure the value is a number when possible, or keep as string if not
      let value = metric.value;
      if (typeof value === 'string' && !isNaN(parseFloat(value)) && !value.includes('/')) {
        value = parseFloat(value);
      }
      
      return {
        name: String(metric.name || "Unnamed Parameter"),
        value: value,
        unit: String(metric.unit || ""),
        status: metric.status || "normal",
        range: String(metric.range || "Not specified"),
        history: [],
        description: String(metric.description || ""),
        category: String(metric.category || "Other")
      };
    });
    
    return {
      metrics: metricsWithHistory,
      recommendations: analysisContent.recommendations || [],
      summary: analysisContent.summary || "",
      detailedAnalysis: analysisContent.detailedAnalysis || "",
      categories: analysisContent.categories || [],
      patientInfo: analysisContent.patientInfo || {},
      modelUsed: "gpt-4-turbo-preview"
    };
  } catch (error) {
    console.error("Error analyzing with model:", error);
    return null;
  }
}

export async function analyzeHealthReport(ocrText: string): Promise<AnalysisResult | null> {
  try {
    const apiKey = localStorage.getItem("openai_api_key");
    
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your OpenAI API key in the settings first.",
        variant: "destructive",
      });
      return null;
    }

    console.log("Starting health report analysis with OpenAI GPT-4");
    
    // Analyze with OpenAI
    const result = await analyzeWithModel(ocrText, apiKey);
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