
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateImage = async (prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "16:9" | "9:16" = "1:1"): Promise<string | null> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: { aspectRatio }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation failed:", error);
  }
  return null;
};

export const editImage = async (
  base64Image: string,
  instruction: string,
  aspectRatio: "1:1" | "3:4" | "4:3" | "16:9" | "9:16" = "1:1"
): Promise<string | null> => {
  const ai = getAI();
  const mimeType = base64Image.split(',')[0].split(':')[1].split(';')[0];
  const data = base64Image.split(',')[1];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data, mimeType } },
          { text: instruction }
        ]
      },
      config: {
        imageConfig: { aspectRatio }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image editing failed:", error);
  }
  return null;
};

export const upscaleImage = async (base64Image: string): Promise<string | null> => {
  return editImage(base64Image, "Upscale this image to high resolution, enhance all details, textures, and clarity while maintaining original content.");
};

export const removeBackground = async (base64Image: string): Promise<string | null> => {
  return editImage(base64Image, "Remove the background of this image. Keep only the main subject on a clean, solid background or transparent-ready cutout.");
};

export const eraseObject = async (base64Image: string, description: string): Promise<string | null> => {
  return editImage(base64Image, `Erase the ${description} from this image and fill the area seamlessly with appropriate background textures.`);
};
