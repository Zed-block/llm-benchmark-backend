import mongoose from 'mongoose';

export class topicType {
  type: string;
  userId: mongoose.Types.ObjectId;
  _id: mongoose.Types.ObjectId;
}

export class createNewMsgTopic {
  type: string;
  userId: mongoose.Types.ObjectId;
}
