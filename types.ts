export interface FlightData {
  id: string;
  falconName: string;
  falconerName: string;
  tiempoCortesia: number; // seconds
  tiempoVuelo: number; // seconds (Label changed to "Tiempo de Remontada")
  duracionTotalVuelo: number; // seconds (New field: manual input)
  velocidadPicado: number; // km/h
  alturaServicio: number; // meters
  distanciaServicio: number; // meters
  capturaType: CapturaType | null;
  // Fix: property name with spaces must be quoted in TypeScript interfaces
  'bon recogida': number; // 0-4 points
  penPicado: number; // 0-5 points
  penSenueloEncarnado: boolean;
  penEnsenarSenuelo: boolean;
  penSueltaObligada: boolean;
  disqualifications: {
    superar10min: boolean;
    ensenarVivos: boolean;
    conductaAntideportiva: boolean;
    noComparecer: boolean;
  };
  totalPoints: number;
}

export enum CapturaType {
  LIMPIA_TRABANDO = 'LIMPIA_TRABANDO',
  PERSECUCION_CORTA = 'PERSECUCION_CORTA',
  PERSECUCION_LARGA = 'PERSECUCION_LARGA',
  ACUCHILLA = 'ACUCHILLA',
  TOCA = 'TOCA',
  RINDE = 'RINDE'
}

export interface Championship {
  id: string;
  name: string;
  date: string;
  location: string;
  participants: FlightData[];
  isPublic: boolean;
  createdAt: number;
  publishedAt?: number;
}

export interface AppState {
  championships: Championship[];
  selectedChampionshipId: string | null;
  publicChampionshipId: string | null;
}