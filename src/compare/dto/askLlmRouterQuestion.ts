import mongoose from 'mongoose';

export class compareAsk {
  submitType: string;
  selectedMetrics?: string[];
  context?: string[];
  message1: {
    messageId: string;
    content: string;
    role: string;
    type: string;
    contentType: string;
    temperature: number;
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
    temperature: number;
    instruction: string;
    model: string;
    provider: string;
    topicId?: string;
    compareId?: string;
    compareQuestionId: string;
    compareSide: string;
  };
}

export class compareAskFromData {
  submitType: string;
  selectedMetrics?: string;
  context?: string;
  message1: string;
  message2: string;
}

export class singleCompare {
  messageId: string;
  content: string;
  role: string;
  type: string;
  contentType: string;
  temperature: number;
  instruction: string;
  model: string;
  provider: string;
  topicId?: string;
  compareId: string;
  compareQuestionId: string;
  compareSide: string;
  images?: any;
}

export class compareRunMetrics {
  messageId: string;
  content: string;
  role: string;
  type: string;
  contentType: string;
  temperature: number;
  instruction: string;
  model: string;
  provider: string;
  topicId?: string;
  compareId: string;
  compareQuestionId: string;
  context?: string[];
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
    temperature: number;
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
    temperature: number;
  };
}
