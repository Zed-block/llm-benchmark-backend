import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type MetricsDocument = Metrics & Document;

export type PointWiseMetrice = {
  prompt: string;
  response: string;
};

export type PairWiseMetrice = {
  prompt: string;
  response: string;
  baseline_model_response: string;
};

@Schema({ timestamps: true })
export class Metrics {
  @Prop({ required: true })
  judge_model: string;

  @Prop({ required: true })
  judge_model_provider: string;

  @Prop({ required: true })
  evaluation_type: string;

  @Prop({ required: true })
  evaluation_metrice: string;

  @Prop({ required: true })
  response: string;

  @Prop({ required: true, type: Object })
  custom_metrice_data: PointWiseMetrice | PairWiseMetrice;

  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;
}

export const MetricsSchema = SchemaFactory.createForClass(Metrics);
