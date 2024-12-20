import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Types } from 'mongoose';

@Schema({ collection: 'routing_models', timestamps: true }) // Adds createdAt and updatedAt fields automatically
export class RoutingModels extends Document {
  @Prop({ type: Types.ObjectId, auto: true }) // Auto-generated MongoDB _id
  _id: Types.ObjectId;

  @Prop({ required: true }) // Required field
  strong_model: string;

  @Prop({ required: true }) // Required field
  weak_model: string;

  @Prop({ required: true }) // Required field
  quality_index: number;

  @Prop({ required: true }) // Required field
  price_usd_per_million_tokens: number;

  @Prop({ required: true }) // Required field
  tokens_per_second: number;

  @Prop({ required: true }) // Required field
  first_chunk_latency_seconds: number;

  @Prop({ default: 0 }) // Default value
  positive_feedback: number;

  @Prop({ default: 0 }) // Default value
  negative_feedback: number;
}

// Create the schema
export const RoutingModelsSchema = SchemaFactory.createForClass(RoutingModels);
