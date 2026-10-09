export type Lang = 'el' | 'en' | 'de' | 'tr';
/** Κείμενα δεδομένων (παραλίες): πάντα ελληνικά και αγγλικά· γερμανικά/τουρκικά προαιρετικά. */
export type Text = { el: string; en: string; de?: string; tr?: string };

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
  waveDir: number | null;    // από πού έρχεται το κύμα (μοίρες)
  wavePeriod: number | null; // s (περίοδος κύματος)
  seaTemp: number | null;    // °C θάλασσας
}

export interface SeaCondition {
  level: SeaLevel;
  /** Ποσοστό -1..1: θετικό = ο αέρας έρχεται από τη θάλασσα, αρνητικό = από τη στεριά */
  onshore: number;
  /** Ένδειξη κύματος στην ακτή (km/h ισοδύναμου ανέμου) */
  index: number;
  /** 0..1: πόσο από το κύμα των ανοιχτών φτάνει σε αυτή την παραλία (ανάλογα με την κατεύθυνσή του). null = άγνωστο */
  waveReach: number | null;
  /** Εκτιμώμενο ύψος κύματος στην ακτή (m) */
  coastWave: number;
  /** Τι καθορίζει το επίπεδο: ο τοπικός άνεμος ή το κύμα από τα ανοιχτά */
  driver: 'wind' | 'waves';
  offshoreWarning: boolean;
  beaufort: number;
}
