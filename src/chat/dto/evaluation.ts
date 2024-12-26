export class EvalutionRun {
  query: string;
  response: string;
  response2?: string;
  history: string;
  model: string;
  question: string;
  responseArr?: string[];
  metrics: string[];
  messageId: string;
  context?: string[];
}
