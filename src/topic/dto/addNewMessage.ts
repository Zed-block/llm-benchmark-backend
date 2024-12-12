import mongoose from 'mongoose';

export class topicType {
  type: string;
  userId: mongoose.Types.ObjectId;
  _id: mongoose.Types.ObjectId;
}

export class createNewMsgTopic {
  title: string;
  type: string;
  userId: mongoose.Types.ObjectId;
  model1?: string;
  model2?: string;
  provider1?: string;
  provider2?: string;
  compareId?: mongoose.Types.ObjectId;
}
