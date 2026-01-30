import { CapturaType } from './types.ts';

// Centralized version constant to avoid scope errors across components
export const APP_VERSION = "1.5.2";

export const SCORING = {
  // 0.1 points per meter
  calculateAlturaPoints: (meters: number) => meters * 0.1,

  // Position/Service distance points from Table 2
  calculateServicioPoints: (meters: number) => {
    if (meters <= 30) return 15;
    if (meters > 160) return 0;
    // Approximation based on table: decreases by roughly 0.1-0.3 pts per meter
    if (meters <= 40) return 15 - (meters - 30) * 0.3; // 30-40 range
    return Math.max(0, 12 - (meters - 40) * 0.1); // 40-160 range
  },

  // Picado speed points: 100km/h = 0, +1 pt every 10km/h
  calculatePicadoPoints: (kmh: number) => {
    if (kmh < 100) return 0;
    return (kmh - 100) / 10;
  },

  // Remontada = (Height / FlightTime) * 60
  calculateRemontadaValue: (height: number, timeSeconds: number) => {
    if (timeSeconds === 0) return 0;
    return (height / timeSeconds) * 60;
  },

  calculateRemontadaPoints: (mMin: number) => {
    if (mMin < 20) return 0;
    // 20 = 2pts, 30 = 4pts, 40 = 6pts... Slope is 0.2
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
    if (seconds <= 420) return 6; // Hasta 7:00 min (420s)
    if (seconds <= 480) return 4; // De 7:01 a 8:00 min (421s - 480s)
    if (seconds <= 540) return 2; // De 8:01 a 9:00 min (481s - 540s)
    return 0; // De 9:01 en adelante (> 540s)
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