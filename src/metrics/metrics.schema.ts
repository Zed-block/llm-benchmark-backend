import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { metadataType } from 'src/ai-service/dto/metricChat';

export type MetricsDocument = Metrics & Document;

export type PointWiseMetrice = {
  prompt: string;
  response: string;
  history?: string;
};

export type PairWiseMetrice = {
  prompt: string;
  response: string;
  history?: string;
  baseline_model_response: string;
};

export interface WithoutType {
  question: string;
  response?: string | string[];
  context?: string[];
}

export interface jailBreakCustomMetriceDataType {
  question: string;
  response?: string;
}

export interface llmCustomMetriceDataType {
  question: string;
  response?: string;
  context: string[];
}

export interface multiqueryaccuracyCustomMetriceDataType {
  question: string;
  response?: string[];
}

@Schema({ timestamps: true })
export class Metrics {
  @Prop({ required: false })
  response_model_name: string;

  @Prop({ required: false })
  baseline_model_name: string;

  @Prop({ required: false })
  response_model_provider: string;

  @Prop({ required: false })
  evaluation_type: string;

  @Prop({ required: true })
  evaluation_metrice: string;

  @Prop({ required: false })
  response: string;

  @Prop({ required: false })
  judge_model: string;

  @Prop({ required: false })
  messageTopic: mongoose.Types.ObjectId;

  @Prop({ required: false })
  dataset_metrice_api: string;

  @Prop({ required: false, type: Object })
  custom_metrice_data: PointWiseMetrice | PairWiseMetrice;

  @Prop({ required: true })
  userId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  topicId: mongoose.Types.ObjectId;

  @Prop({ required: false })
  fileId: string;

  @Prop({ required: false })
  totalToken: number;

  @Prop({ required: false })
  inputToken: number;

  @Prop({ required: false })
  outputToken: number;

  @Prop({ required: false })
  totalCost: number;

  @Prop({ required: false })
  inputCost: number;

  @Prop({ required: false })
  outputCost: number;

  @Prop({ required: false })
  timeTaken: number;
}

export const MetricsSchema = SchemaFactory.createForClass(Metrics);
