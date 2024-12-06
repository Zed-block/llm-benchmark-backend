import mongoose from 'mongoose';

export class chatReply {
  content: string;
  messageId: string;
  instruction: string;
  model: string;
  role: string;
  selectedModel: string;
  temperature: number;
  userId: mongoose.Types.ObjectId;
  type: string;
  contentType: string;
  queryId: string;
  topicId: mongoose.Types.ObjectId;
}
