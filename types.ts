
export interface Question {
  paperNumber: string;
  questionNumber: string;
  section: string;
  subject: string;
  topic: string;
  subtopic: string;
  questionText: string;
  questionImage: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  optionAImage: string;
  optionBImage: string;
  optionCImage: string;
  optionDImage: string;
  correctOption: 'A' | 'B' | 'C' | 'D' | '';
  correctAnswerText: string;
  // Spaced repetition fields
  reviewStatus?: 'new' | 'learning' | 'review';
  easeFactor?: number;
  interval?: number;
  nextReviewDate?: string;
}

export type Syllabus = {
  [section: string]: {
    [subject: string]: {
      [topic: string]: string[];
    };
  };
};
