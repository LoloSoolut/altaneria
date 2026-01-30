import { CapturaType } from './types.ts';

// Versión 1.5.7: Parche de exclusividad y auto-saneamiento
export const APP_VERSION = "1.5.7";

export const SCORING = {
  calculateAlturaPoints: (meters: number) => meters * 0.1,
  calculateServicioPoints: (meters: number) => {
    if (meters <= 30) return 15;
    if (meters > 160) return 0;
    if (meters <= 40) return 15 - (meters - 30) * 0.3;
    return Math.max(0, 12 - (meters - 40) * 0.1);
  },
  calculatePicadoPoints: (kmh: number) => {
    if (kmh < 100) return 0;
    return (kmh - 100) / 10;
  },
  calculateRemontadaValue: (height: number, timeSeconds: number) => {
    if (timeSeconds === 0) return 0;
    return (height / timeSeconds) * 60;
  },
  calculateRemontadaPoints: (mMin: number) => {
    if (mMin < 20) return 0;
    return (mMin - 20) * 0.2 + 2;
  },
  calculateCapturaPoints: (type: CapturaType, height: number) => {
    switch (type) {
      case CapturaType.LIMPIA_TRABANDO: return height / 12;
      case CapturaType.PERSECUCION_CORTA: return height / 15;
      case CapturaType.PERSECUCION_LARGA: return height / 18;
      case CapturaType.ACUCHILLA: return height / 40;
      case CapturaType.TOCA:
      case CapturaType.RINDE: return height / 50;
      default: return 0;
    }
  },
  calculateTimeBonus: (seconds: number) => {
    if (seconds <= 0) return 0;
    if (seconds <= 420) return 6;
    if (seconds <= 480) return 4;
    if (seconds <= 540) return 2;
    return 0;
  }
};

export const CAPTURA_LABELS: Record<CapturaType, string> = {
  [CapturaType.LIMPIA_TRABANDO]: "Cuchillada Limpia o Trabando",
  [CapturaType.PERSECUCION_CORTA]: "Persecución Corta o Suelo",
  [CapturaType.PERSECUCION_LARGA]: "Persecución Larga",
  [CapturaType.ACUCHILLA]: "Acuchilla",
  [CapturaType.TOCA]: "Toca",
  [CapturaType.RINDE]: "Rinde"
};