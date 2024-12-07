import mongoose from 'mongoose';

export class askNewQuestionForLlmRouter{
  content: string;
  messageId: string;
  model1: string;
  model2: string;
  provider1: string;
  provider2: string;
  role: string;
  userId: mongoose.Types.ObjectId;
  type: string;
  contentType: string;
  topicId: mongoose.Types.ObjectId;
}

export class askNewQuestionForCompare{
  content: string;
  messageId: string;
  role: string;
  instruction: string;
  selectedModel: string;
  type: string;
  contentType: string;
  topicId: mongoose.Types.ObjectId;
}

export class responseForCompare{
  content: string;
  messageId: string;
  instruction: string;
  model: string;
  role: string;
  userId: mongoose.Types.ObjectId;
  type: string;
  contentType: string;
  queryId: string;
  topicId: mongoose.Types.ObjectId;
}
