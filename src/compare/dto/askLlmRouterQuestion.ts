import mongoose from 'mongoose';

export class compareAsk {
  message1: {
    messageId: string;
    content: string;
    role: string;
    type: string;
    contentType: string;
    instruction: string;
    model: string;
    topicId?: string;
    compareId?: string;
  };
  message2: {
    messageId: string;
    content: string;
    role: string;
    type: string;
    contentType: string;
    instruction: string;
    model: string;
    topicId?: string;
    compareId?: string;
  };
}

export class compareRes {
  message1: {
    messageId: string;
    content: string;
    role: string;
    type: string;
    contentType: string;
    instruction: string;
    model: string;
    topicId: mongoose.Types.ObjectId;
  };
  message2: {
    messageId: string;
    content: string;
    role: string;
    type: string;
    contentType: string;
    instruction: string;
    model: string;
    topicId: mongoose.Types.ObjectId;
  };
}
