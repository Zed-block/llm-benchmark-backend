import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { metadataType } from 'src/ai-service/dto/metricChat';

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
  @Prop({ required: false })
  response_model_name: string;

  @Prop({ required: false })
  response_model_provider: string;

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

  @Prop({ required: false })
  metadata: metadataType[];
}

export const MetricsSchema = SchemaFactory.createForClass(Metrics);
