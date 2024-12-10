import mongoose from 'mongoose';

export class aiRouterChat {
  user_query: string;
  strong_model: string;
  weak_model: string;
  user_id: string;
  routing_threshold: number;
}

export class singleAiChatRes {
  response: string;
  metadata: metadataType | null;
  total_time: string;
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
