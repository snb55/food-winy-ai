/**
 * Gemini AI Service
 *
 * Handles AI-powered analysis of food entries using Google's Gemini API.
 * Generates summaries including nutritional insights and meal categorization.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Analysis Result
 */
export interface AIAnalysisResult {
  summary: string;
  extractedFields: Record<string, any>;
}

/**
 * Generate AI summary and extract field values for a food entry
 * @param text - User's text description of the food
 * @param imageBase64 - Optional base64-encoded image data
 * @param schema - Optional schema to determine which fields to extract
 * @returns AI-generated summary and extracted field values
 */
export async function generateFoodSummary(
  text: string,
  imageBase64?: string,
  schema?: any
): Promise<AIAnalysisResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Build extraction prompt based on schema
  if (schema?.fields) {
    const extractableFields = schema.fields.filter((f: any) => f.extractFromAI);
    if (extractableFields.length > 0) {
      console.log('Fields to extract from AI:', extractableFields.map((f: any) => f.name));
    }
  }

  const prompt = `Analyze this food and estimate the macronutrients.

Food: ${text}

You MUST return EXACTLY this format:
SUMMARY: [Brief 1-2 sentence summary]
EXTRACTED_DATA: {"protein": [number], "carbs": [number], "fat": [number], "calories": [number]}

Example:
SUMMARY: High-protein grilled chicken with steamed broccoli - a clean, nutritious dinner perfect for muscle building.
EXTRACTED_DATA: {"protein": 45, "carbs": 8, "fat": 12, "calories": 320}

IMPORTANT: Always provide numerical estimates for protein, carbs, fat, and calories. Use your best judgment based on the food description.`;

  console.log('Gemini prompt:', prompt);

  try {
    let result;

    if (imageBase64) {
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg',
        },
      };
      result = await model.generateContent([prompt, imagePart]);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const fullResponse = response.text();
    
    console.log('Gemini full response:', fullResponse);
    
    // Parse the response
    const summaryMatch = fullResponse.match(/SUMMARY:\s*(.+?)(?:\n|$)/);
    const extractedMatch = fullResponse.match(/EXTRACTED_DATA:\s*(\{[\s\S]*?\})/);
    
    console.log('Summary match:', summaryMatch);
    console.log('Extracted match:', extractedMatch);
    
    let summary = summaryMatch ? summaryMatch[1].trim() : fullResponse;
    let extractedFields: Record<string, any> = {};
    
    if (extractedMatch) {
      try {
        const jsonStr = extractedMatch[1].trim();
        extractedFields = JSON.parse(jsonStr);
        console.log('Parsed extracted fields:', extractedFields);
      } catch (e) {
        console.warn('Failed to parse extracted data:', e);
        console.warn('Raw extracted data:', extractedMatch[1]);
        
        // Try to extract numbers manually if JSON parsing fails
        const proteinMatch = fullResponse.match(/protein["\s]*:?\s*(\d+)/i);
        const carbsMatch = fullResponse.match(/carbs["\s]*:?\s*(\d+)/i);
        const fatMatch = fullResponse.match(/fat["\s]*:?\s*(\d+)/i);
        const caloriesMatch = fullResponse.match(/calories["\s]*:?\s*(\d+)/i);
        
        if (proteinMatch || carbsMatch || fatMatch || caloriesMatch) {
          extractedFields = {
            protein: proteinMatch ? parseInt(proteinMatch[1]) : null,
            carbs: carbsMatch ? parseInt(carbsMatch[1]) : null,
            fat: fatMatch ? parseInt(fatMatch[1]) : null,
            calories: caloriesMatch ? parseInt(caloriesMatch[1]) : null
          };
          console.log('Manually extracted fields:', extractedFields);
        }
      }
    }

    return {
      summary,
      extractedFields
    };
  } catch (error: any) {
    console.error('Error generating AI summary:', error);
    
    if (error.message?.includes('API key')) {
      return {
        summary: 'Unable to generate summary: Invalid API key.',
        extractedFields: {}
      };
    } else if (error.status === 404) {
      return {
        summary: 'Unable to generate summary: Model not found.',
        extractedFields: {}
      };
    }
    
    return {
      summary: 'Unable to generate summary. Please try again.',
      extractedFields: {}
    };
  }
}
