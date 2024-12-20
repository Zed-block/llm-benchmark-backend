import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ collection: 'evaluation_data', timestamps: true })
export class EvaluationData extends Document {
  @Prop({ type: mongoose.Types.ObjectId, required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  evaluation_type: string;

  @Prop({ type: String, required: true })
  evaluation_metrice: string;

  @Prop({ type: String, required: true })
  topic_id: string;

  @Prop({ type: String, required: true })
  file_id: string;

  @Prop({ type: Array, default: [] })
  response: any[];
}

export const EvaluationDataSchema =
  SchemaFactory.createForClass(EvaluationData);
