import mongoose from 'mongoose';

export class topicType {
  type: string;
  userId: mongoose.Types.ObjectId;
  _id: mongoose.Types.ObjectId;
}

export class createNewMsgTopic {
  title: string;
  type: string;
  temperature?: number;
  userId: mongoose.Types.ObjectId;
  fileId?: string;
  model?: string;
  provider?: string;
}

export class createNewMsgTopicForCompare {
  title: string;
  type: string;
  userId: mongoose.Types.ObjectId;
  model: string;
  provider: string;
  temperature: number;
  compareId: mongoose.Types.ObjectId;
  compareSide: string;
}

export class createNewMsgTopicForLlmRouter {
  title: string;
  type: string;
  userId: mongoose.Types.ObjectId;
  strongModels: string[];
  weakModels: string[];
}
