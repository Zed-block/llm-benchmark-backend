import mongoose from 'mongoose';

export class askNewQuestionForLlmRouter {
  content: string;
  messageId: string;
  strongModels: string[];
  weakModels: string[];
  role: string;
  userId: mongoose.Types.ObjectId;
  type: string;
  contentType: string;
  topicId: mongoose.Types.ObjectId;
  routing_threshold: number;
}

export class askNewQuestionForCompare {
  content: string;
  messageId: string;
  role: string;
  instruction: string;
  model: string;
  type: string;
  contentType: string;
  topicId: mongoose.Types.ObjectId;
  compareId: mongoose.Types.ObjectId;
}

export class responseForCompare {
  content: string;
  messageId: string;
  instruction: string;
  model: string;
  role: string;
  userId: mongoose.Types.ObjectId;
  type: string;
  contentType: string;
  queryId: string;
  compareId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
}
