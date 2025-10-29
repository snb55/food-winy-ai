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
  title: string; // AI-generated entry title (e.g., "Grilled Chicken Salad")
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
  let fieldsToExtract: any[] = [];
  if (schema?.fields) {
    fieldsToExtract = schema.fields.filter((f: any) => f.extractFromAI && f.id !== 'name' && f.id !== 'summary');
    console.log('Fields to extract from AI:', fieldsToExtract.map((f: any) => f.name));
  }

  // Build dynamic extraction prompt
  let extractionInstructions = '';
  let extractionExample = '';

  if (fieldsToExtract.length > 0) {
    const fieldDescriptions = fieldsToExtract.map(f => {
      const hint = f.aiPromptHint || `Estimate the ${f.name.toLowerCase()}`;
      return `"${f.id}": ${hint} (${f.type === 'number' ? `number in ${f.unit || 'units'}` : f.type})`;
    }).join('\n');

    const exampleFields = fieldsToExtract.reduce((acc: any, f) => {
      if (f.type === 'number') {
        // Provide reasonable example values
        if (f.id === 'protein') acc[f.id] = 35;
        else if (f.id === 'carbs' || f.id === 'net_carbs') acc[f.id] = 45;
        else if (f.id === 'fat') acc[f.id] = 15;
        else if (f.id === 'calories') acc[f.id] = 450;
        else acc[f.id] = 20;
      }
      return acc;
    }, {});

    extractionInstructions = `Extract the following nutritional information:
${fieldDescriptions}`;

    extractionExample = JSON.stringify(exampleFields);
  } else {
    // Default to basic macros if no schema
    extractionInstructions = `Extract basic nutritional information:
"protein": Estimated grams of protein
"carbs": Estimated grams of carbohydrates
"fat": Estimated grams of fat
"calories": Estimated total calories (kcal)`;

    extractionExample = '{"protein": 35, "carbs": 45, "fat": 15, "calories": 450}';
  }

  const prompt = `Analyze this food and provide a title, nutritional estimates, and a brief summary.

Food description: ${text}

You MUST return EXACTLY this format:
TITLE: [A short, descriptive meal name (2-5 words)]
SUMMARY: [Brief 1-2 sentence nutritional summary]
EXTRACTED_DATA: {JSON object with nutritional data}

${extractionInstructions}

Example format:
TITLE: Grilled Chicken Salad
SUMMARY: High-protein grilled chicken breast with mixed greens and olive oil dressing - a clean, balanced meal perfect for muscle building and weight management.
EXTRACTED_DATA: ${extractionExample}

IMPORTANT:
- Generate a natural, appetizing title that describes the meal
- Always provide your best estimates for ALL requested fields (use 0 or null only if truly unknown)
- Return valid JSON in the EXTRACTED_DATA section`;

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
    const titleMatch = fullResponse.match(/TITLE:\s*(.+?)(?:\n|$)/);
    const summaryMatch = fullResponse.match(/SUMMARY:\s*(.+?)(?:\n|EXTRACTED_DATA)/s);
    const extractedMatch = fullResponse.match(/EXTRACTED_DATA:\s*(\{[\s\S]*?\})/);

    console.log('Title match:', titleMatch);
    console.log('Summary match:', summaryMatch);
    console.log('Extracted match:', extractedMatch);

    let title = titleMatch ? titleMatch[1].trim() : 'Food Entry';
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
        const proteinMatch = fullResponse.match(/protein["\s]*:?\s*([\d.]+)/i);
        const carbsMatch = fullResponse.match(/(?:carbs|net_carbs)["\s]*:?\s*([\d.]+)/i);
        const fatMatch = fullResponse.match(/fat["\s]*:?\s*([\d.]+)/i);
        const caloriesMatch = fullResponse.match(/calories["\s]*:?\s*([\d.]+)/i);

        if (proteinMatch || carbsMatch || fatMatch || caloriesMatch) {
          extractedFields = {
            protein: proteinMatch ? parseFloat(proteinMatch[1]) : null,
            carbs: carbsMatch ? parseFloat(carbsMatch[1]) : null,
            fat: fatMatch ? parseFloat(fatMatch[1]) : null,
            calories: caloriesMatch ? parseFloat(caloriesMatch[1]) : null
          };
          console.log('Manually extracted fields:', extractedFields);
        }
      }
    }

    return {
      title,
      summary,
      extractedFields
    };
  } catch (error: any) {
    console.error('Error generating AI summary:', error);
    
    if (error.message?.includes('API key')) {
      return {
        title: 'Food Entry',
        summary: 'Unable to generate summary: Invalid API key.',
        extractedFields: {}
      };
    } else if (error.status === 404) {
      return {
        title: 'Food Entry',
        summary: 'Unable to generate summary: Model not found.',
        extractedFields: {}
      };
    }

    return {
      title: 'Food Entry',
      summary: 'Unable to generate summary. Please try again.',
      extractedFields: {}
    };
  }
}
