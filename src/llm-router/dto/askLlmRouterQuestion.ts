import mongoose from 'mongoose';

export class askLlmRouterQuestion {
  messageId: string;
  content: string;
  role: string;
  type: string;
  contentType: string;
  model1: string;
  model2: string;
  provider1: string;
  provider2: string;
  topicId?: string;
  routing_threshold?: number;
}
