import mongoose from 'mongoose';

export class askLlmRouterQuestion {
  messageId: string;
  content: string;
  role: string;
  type: string;
  contentType: string;
  strongModels: string[];
  weakModels: string[];
  topicId?: string;
  routing_threshold?: number;
}
