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
