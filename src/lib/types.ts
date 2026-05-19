export interface UserData {
  niveau: 'anfaenger' | 'wiedereinsteiger_schule' | 'wiedereinsteiger_a2' | 'wiedereinsteiger_b1';
  themen: string[];
  why: string;
  onboardingDone: boolean;
  letztesOeffnen: string;
  etappe?: 1 | 2 | 3 | 4 | 5;
  lektionenInEtappe?: number;
}

export type EnergyMode = 'muede' | 'okay' | 'fit' | 'erzaehl';

export interface VocabItem {
  es: string;
  de: string;
}

export interface TiredLesson {
  mode: 'muede';
  text: string;
  translation: string;
  vocab: VocabItem[];
  schluesselwort?: VocabItem;
}

export interface OkayLesson {
  mode: 'okay';
  text: string;
  translation: string;
  questions: QuizQuestion[];
  schluesselwort?: VocabItem;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface DialogLine {
  speaker: string;
  es: string;
  de: string;
}

export interface FitLesson {
  mode: 'fit';
  dialog: DialogLine[];
  vocab: VocabItem[];
  schluesselwort?: VocabItem;
}

export interface ErzaehlLesson {
  mode: 'erzaehl';
  saetze: { es: string; de: string }[];
  vocab: VocabItem[];
  schluesselwort?: VocabItem;
}

export type Lesson = TiredLesson | OkayLesson | FitLesson | ErzaehlLesson;

export interface LessonHistoryItem {
  datum: string;
  modus: EnergyMode;
  content: Lesson;
}

