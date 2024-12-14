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
    provider: string;
    topicId?: string;
    compareId?: string;
    compareQuestionId: string;
    compareSide: string;
  };
  message2: {
    messageId: string;
    content: string;
    role: string;
    type: string;
    contentType: string;
    instruction: string;
    model: string;
    provider: string;
    topicId?: string;
    compareId?: string;
    compareQuestionId: string;
    compareSide: string;
  };
}

export class singleCompare {
  messageId: string;
  content: string;
  role: string;
  type: string;
  contentType: string;
  instruction: string;
  model: string;
  provider: string;
  topicId?: string;
  compareId: string;
  compareQuestionId: string;
  compareSide: string;
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
