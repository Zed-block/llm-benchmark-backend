import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Mongoose, ObjectId } from 'mongoose';

export type KeyDocument = Key & Document;

@Schema({ timestamps: true })
export class Key {
  @Prop({ required: true })
  provider: string;

  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  apiKey: string;

  @Prop({ required: true })
  models: string[];

  @Prop({ required: false })
  version: string;

  @Prop({ required: false, default: 0.1 })
  temperature: number;
}

export const KeySchema = SchemaFactory.createForClass(Key);
