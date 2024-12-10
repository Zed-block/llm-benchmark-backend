import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  messageId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: string;

  @Prop({ required: false })
  model: string;

  @Prop({ required: false })
  queryId: string;

  @Prop({ required: true, enum: ['chat', 'llmrouter', 'compare'] })
  type: string;

  @Prop({ required: true, enum: ['question', 'answer'] })
  contentType: string;

  @Prop({ required: false })
  provider: string;

  @Prop({ required: false })
  model1: string;

  @Prop({ required: false })
  provider1: string;

  @Prop({ required: false })
  model2: string;

  @Prop({ required: false })
  provider2: string;

  @Prop({ required: false })
  instruction: string;

  @Prop({ required: false })
  temperature: number;

  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  topicId: mongoose.Types.ObjectId;

  @Prop({ required: false })
  compareId: mongoose.Types.ObjectId;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
