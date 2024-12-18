import mongoose from 'mongoose';

export class metricChat {
  system_prompt: string;
  user_query: string;
  model_name: string;
  user_id: string;
}

export class metricChatRes {
  response: string;
  metadata: metadataType[] | metadataType | null;
  total_time: number;
}

export class metadataType {
  tokens: tokenType;
  cost: costType;
}

export class costType {
  'input_cost': number;
  'output_cost': number;
  'total_cost': number;
}
export class tokenType {
  'input_tokens': number;
  'output_tokens': number;
  'total_tokens': number;
}
