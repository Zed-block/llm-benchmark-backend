import mongoose from 'mongoose';

export class chatReplyForLlmRouter {
  content: string;
  messageId: string;
  model: string;
  role: string;
  userId: mongoose.Types.ObjectId;
  type: string;
  contentType: string;
  queryId: string;
  topicId: mongoose.Types.ObjectId;
}
