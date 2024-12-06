import mongoose from 'mongoose';

export class askQuestion {
  messageId: string;
  content: string;
  role: string;
  type: string;
  contentType: string;
  instruction: string;
  selectedModel: string;
  temperature: number;
  topicId?: string;
}

export class askQuestionRes {
  messageId: string;
  content: string;
  role: string;
  type: string;
  contentType: string;
  instruction: string;
  selectedModel: string;
  temperature: number;
  topicId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}
