import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ collection: 'evaluation_status', timestamps: true })
export class EvaluationStatus extends Document {
  @Prop({ type: mongoose.Types.ObjectId, required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ type: String, required: true })
  evaluation_type: string;

  @Prop({ type: String, required: true })
  evaluation_metrice: string;

  @Prop({ type: String, required: true })
  topic_id: string;

  @Prop({ type: Object, required: false })
  error_details: any;

  @Prop({
    type: String,
    enum: ['STARTED', 'COMPLETED', 'ERROR', 'PROCESSING'],
    default: 'STARTED',
  })
  status: string;
}

export const EvaluationStatusSchema =
  SchemaFactory.createForClass(EvaluationStatus);
