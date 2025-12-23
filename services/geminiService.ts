
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { PRODUCTION_SYSTEM_INSTRUCTION } from "../constants";

const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fix: Added generateScript function needed by ScriptFactory, HeadlineWizard and ContentTransformer
export const generateScript = async (prompt: string) => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return { content: response.text || "" };
};

export const generateAutopilotProduction = async (input: any) => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', // Model miễn phí mạnh nhất cho kịch bản
    contents: `Thiết kế kịch bản video viral chuyên nghiệp cho: ${JSON.stringify(input)}`,
    config: {
      systemInstruction: PRODUCTION_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateVisual = async (prompt: string) => {
  const ai = getAi();
  // Tăng cường prompt để mô hình ảnh miễn phí tạo ra kết quả như Pro
  const enhancedPrompt = `Cinematic masterpiece, ${prompt}. Professional photography, 8k resolution, volumetric lighting, deep shadows, cinematic color grading, shot on ARRI Alexa.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image', // Model tạo ảnh chất lượng cao miễn phí
    contents: { parts: [{ text: enhancedPrompt }] },
    config: { 
        imageConfig: { aspectRatio: "9:16" } 
    }
  });
  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : null;
};

export const generateVoiceover = async (text: string, voiceName: string = 'Puck') => {
  const ai = getAi();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts", // TTS miễn phí
    contents: [{ parts: [{ text: text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
};

// Fix: Added generateTikTokVideo function needed by ProductionStudio with proper Veo polling logic
export const generateTikTokVideo = async (prompt: string, videoConfig: { resolution: '720p' | '1080p', aspectRatio: '9:16' | '16:9' }) => {
  const ai = getAi();
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: videoConfig.resolution,
      aspectRatio: videoConfig.aspectRatio
    }
  });
  
  while (!operation.done) {
    // Wait for 10 seconds before polling again as video generation takes time
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }
  
  return operation;
};
