export type EvalResult = "correct" | "partial" | "incorrect";

export interface EvaluationFeedback {
  grammar: string[];
  wording: string[];
  naturalness: string[];
  register: string[];
}

export interface EvaluationResponse {
  score: number; // 0-100
  result: EvalResult;
  feedback: EvaluationFeedback;
  suggestions: string[];
  nextHint?: string;
}

export interface ApiResponse<T = unknown> {
  statusCode: number;
  headers?: Record<string, string>;
  body: string; // JSON
}

export interface SessionStartResponse {
  sessionId: string;
  uploadUrl: string;
}

export interface CardItem {
  cardId: string;
  type: "phrasal" | "structure" | "vocab";
  prompt: string;
  answers: string[];
  hints: string[];
  examples: string[];
  tags: string[];
  difficulty: "B1" | "B1+" | "B2";
}

