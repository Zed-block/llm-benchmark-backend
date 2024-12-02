import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Mongoose, ObjectId } from 'mongoose';

export type KeyDocument = Key & Document;

@Schema({ timestamps: true })
export class Key {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  version: string;
}

export const KeySchema = SchemaFactory.createForClass(Key);
