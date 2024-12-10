import mongoose from 'mongoose';

export class askQuestion {
  messageId: string;
  content: string;
  role: string;
  type: string;
  contentType: string;
  instruction: string;
  provider: string;
  model: string;
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
  model: string;
  provider: string;
  temperature: number;
  topicId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
}
