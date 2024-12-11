import mongoose from 'mongoose';

export class singleAiChat {
  system_prompt: string;
  user_query: string;
  model_name: string;
  user_id: string;
}

export class singleAiChatRes {
  response: string;
  metadata: metadataType | null;
  total_time: number;
  model_used: string;
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
