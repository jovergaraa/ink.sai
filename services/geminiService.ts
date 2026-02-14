import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from '../types';

// Initialize Gemini Client
// CRITICAL: Using process.env.API_KEY as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelId = "gemini-3-flash-preview";

export const refineTattooIdea = async (rawIdea: string): Promise<AIResponse | null> => {
  try {
    const prompt = `
      Actúa como un tatuador profesional experto y consultor de arte.
      El usuario tiene una idea vaga para un tatuaje: "${rawIdea}".
      
      Tu objetivo es:
      1. Refinar la idea para que sea artísticamente viable.
      2. Sugerir el estilo de tatuaje más adecuado (ej. Realismo, Tradicional, Blackwork, Acuarela, etc.).
      3. Proveer notas técnicas para el tatuador (ubicación sugerida, complejidad, paleta de colores).

      Responde estrictamente en formato JSON.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refinedIdea: {
              type: Type.STRING,
              description: "Una descripción detallada y artística de la idea mejorada.",
            },
            suggestedStyle: {
              type: Type.STRING,
              description: "El estilo de tatuaje recomendado.",
            },
            technicalNotes: {
              type: Type.STRING,
              description: "Consejos técnicos sobre tamaño, ubicación y color.",
            },
          },
          required: ["refinedIdea", "suggestedStyle", "technicalNotes"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AIResponse;
    }
    return null;
  } catch (error) {
    console.error("Error refining tattoo idea with Gemini:", error);
    return null;
  }
};