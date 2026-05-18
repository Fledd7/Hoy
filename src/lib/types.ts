export interface UserData {
  niveau: 'anfaenger' | 'wiedereinsteiger_schule' | 'wiedereinsteiger_a2' | 'wiedereinsteiger_b1';
  themen: string[];
  why: string;
  onboardingDone: boolean;
  letztesOeffnen: string;
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
}

export interface OkayLesson {
  mode: 'okay';
  text: string;
  translation: string;
  questions: QuizQuestion[];
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
}

export interface ErzaehlLesson {
  mode: 'erzaehl';
  saetze: { es: string; de: string }[];
  vocab: VocabItem[];
}

export type Lesson = TiredLesson | OkayLesson | FitLesson | ErzaehlLesson;
