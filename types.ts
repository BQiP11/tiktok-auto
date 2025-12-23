
export interface ProductionBlueprint {
  evaluation: string;
  critique?: {
    weakness: string;
    improvement: string;
  };
  hooks: {
    question: string;
    warning: string;
    extreme_benefit: string;
  };
  table_script: {
    timestamp: string;
    visual: string;
    audio: string;
    speaker?: string;
  }[];
  edit_suggestions: string;
  hashtags: string;
  blueprint: {
    character: string;
    scene: string;
    audio_full: string;
  };
}

export interface DeepFormData {
  productName: string;
  location?: string;
  audience: string;
  painPoint: string;
  features: string;
  style: string;
  specialReq: string;
  duration: '15s' | '30s' | '60s';
  voiceTone: 'Hào hứng' | 'Sâu lắng' | 'Chuyên gia' | 'Gen Z';
  musicMood: 'Trending TikTok' | 'Kịch tính' | 'Lo-fi Chill';
  videoConfig: {
    resolution: '720p' | '1080p';
    aspectRatio: '9:16' | '16:9';
  };
}

export interface PulseData {
  text: string;
  sources: {
    web?: { uri: string; title: string };
    maps?: { uri: string; title: string };
  }[];
}

/**
 * Added missing FactoryMode to fix import error in ScriptFactory.tsx
 */
export type FactoryMode = 'instant' | 'deep';
