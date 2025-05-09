import { toast } from "@/hooks/use-toast";
import { extractTextFromPDF } from './pdfService';

export interface OCRResult {
  text: string;
  confidence?: number;
  modelUsed?: string;
}

async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function performOCRWithModel(file: File): Promise<OCRResult | null> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not found in environment variables');
    }

    // Handle PDF files
    if (file.type === 'application/pdf') {
      const { text, images } = await extractTextFromPDF(file);
      
      // If we have images in the PDF, process them with Gemini
      if (images.length > 0) {
        const imageResults = await Promise.all(
          images.map(async (image) => {
            const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
              },
              body: JSON.stringify({
                contents: [{
                  parts: [
                    { text: "Extract all text from this image:" },
                    { inline_data: { mime_type: "image/jpeg", data: image.split(',')[1] } }
                  ]
                }]
              })
            });
            
            if (!response.ok) {
              throw new Error(`Gemini API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          })
        );
        
        // Combine PDF text and image OCR results
        return {
          text: text + '\n' + imageResults.join('\n'),
          modelUsed: 'gemini-pro-vision'
        };
      }
      
      // If no images, just return the extracted text
      return { text, modelUsed: 'pdf.js' };
    }
    
    // Handle image files
    const base64File = await convertFileToBase64(file);
    
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Extract all text from this health report:" },
            { inline_data: { mime_type: file.type, data: base64File.split(',')[1] } }
          ]
        }]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!extractedText.trim()) {
      throw new Error('No text could be extracted from the image');
    }
    
    return {
      text: extractedText,
      modelUsed: 'gemini-pro-vision'
    };
  } catch (error) {
    console.error("OCR error:", error);
    return null;
  }
}

export async function performOCR(file: File, customToast?: Function): Promise<OCRResult | null> {
  try {
    // Check if file type is supported
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a PDF, JPG, or PNG file.",
        variant: "destructive",
      });
      return null;
    }
    
    // Check if file size is within limits (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return null;
    }

    const toastFn = customToast || toast;
    toastFn({
      title: "Processing Document",
      description: "Extracting text from your document...",
    });

    // Perform OCR with Gemini
    const result = await performOCRWithModel(file);
    if (!result || !result.text.trim()) {
      throw new Error("Failed to extract text from the document");
    }

    return result;
  } catch (error) {
    console.error("Error performing OCR:", error);
    toast({
      title: "OCR Failed",
      description: "Failed to extract text from your document. Please try again.",
      variant: "destructive",
    });
    return null;
  }
} 