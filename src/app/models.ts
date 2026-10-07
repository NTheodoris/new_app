export type Lang = 'el' | 'en';
export type Text = Record<Lang, string>;

export type Surface = 'sand' | 'pebbles' | 'mixed';
export type Tag =
  | 'family' | 'quiet' | 'nudist' | 'hotspring' | 'snorkel' | 'tavern'
  | 'surf' | 'shade' | 'sunset' | 'birds' | 'watersports';

export interface Beach {
  id: string;
  name: Text;
  area: Text;
  lat: number;
  lon: number;
  /** Κατεύθυνση (μοίρες) προς την οποία κοιτάει η παραλία, δηλ. προς τη θάλασσα. */
  facing: number;
  /** 0..1 — πόσο εκτεθειμένη είναι στο ανοιχτό πέλαγος. */
  exposure: number;
  /** null = δεν είναι επιβεβαιωμένο */
  surface: Surface | null;
  /** null = δεν είναι επιβεβαιωμένο */
  organized: boolean | null;
  tags: Tag[];
  desc: Text;
  /** Προαιρετικά: συγκεκριμένα αρχεία του Wikimedia Commons, π.χ. "File:Petra beach.jpg". */
  photos?: string[];
}

/** Φωτογραφία με ελεύθερη άδεια και τα στοιχεία αναφοράς της. */
export interface Photo {
  title: string;      // όνομα αρχείου στο Commons
  thumb: string;      // URL μικρογραφίας (~800px)
  page: string;       // σελίδα του αρχείου στο Commons (εκεί είναι όλα τα στοιχεία)
  author: string;     // δημιουργός
  license: string;    // π.χ. "CC BY-SA 4.0"
  licenseUrl: string | null;
  description: string;
}

/** 0 = ήρεμα, 1 = λίγος κυματισμός, 2 = κύμα, 3 = μεγάλο κύμα */
export type SeaLevel = 0 | 1 | 2 | 3;

export interface HourWeather {
  time: string;          // ISO τοπική ώρα
  windSpeed: number;     // km/h
  windDir: number;       // από πού φυσάει (μοίρες)
  gusts: number;         // km/h
  temp: number | null;   // °C αέρα
  waveHeight: number | null; // m (ανοιχτά)
  seaTemp: number | null;    // °C θάλασσας
}

export interface SeaCondition {
  level: SeaLevel;
  /** Ποσοστό -1..1: θετικό = ο αέρας έρχεται από τη θάλασσα, αρνητικό = από τη στεριά */
  onshore: number;
  /** Ένδειξη κύματος στην ακτή (km/h ισοδύναμου ανέμου) */
  index: number;
  offshoreWarning: boolean;
  beaufort: number;
}
