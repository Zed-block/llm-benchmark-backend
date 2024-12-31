import {
  jailBreakCustomMetriceDataType,
  llmCustomMetriceDataType,
  PairWiseMetrice,
  PointWiseMetrice,
  WithoutType,
} from '../metrics.schema';

export class metricsRun {
  response_model_name?: string;
  judge_model?: string;
  model_name?: string;
  response_model_provider?: string;
  evaluation_type?: string;
  evaluation_metrice: string;
  baseline_model_name?: string;
  question?: string;
  custom_metrice_data?: PairWiseMetrice | PointWiseMetrice | WithoutType;
}

export class metricsRunForDb {
  evaluation_type: string;
  judge_model: string;
  evaluation_metrice: string;
  dataset_path?: string;
  topic_id: string;
  file_id: string;
}

export class pointWiseData {
  response_model_name?: string;
  judge_model: string;
  response_model_provider?: string;
  evaluation_type: string;
  evaluation_metrice: string;
  custom_metrice_data?: PointWiseMetrice;
}

export class pairWiseData {
  response_model_name?: string;
  judge_model: string;
  response_model_provider?: string;
  evaluation_type: string;
  evaluation_metrice: string;
  baseline_model_name?: string;
  custom_metrice_data?: PairWiseMetrice;
}

export class jailBreakDataType {
  response_model_name: string;
  evaluation_metrice: string;
  custom_metrice_data?: jailBreakCustomMetriceDataType;
}

export class llmContextDataType {
  response_model_name: string;
  evaluation_metrice: string;
  custom_metrice_data?: llmCustomMetriceDataType;
}

export class multiqueryaccuracyDataType {
  response_model_name: string;
  evaluation_metrice: string;
  custom_metrice_data?: jailBreakCustomMetriceDataType;
}

export class metricsRunInput {
  response_model_name?: string;
  judge_model: string;
  model_name?: string;
  response_model_provider?: string;
  evaluation_type?: string;
  evaluation_metrice: string;
  baseline_model_name?: string;
  question?: string;
  fileId?: string;
  topicId?: string;
  messageTopic?: string;
  custom_metrice_data?: PairWiseMetrice | PointWiseMetrice | WithoutType;
}

export class metricsRunInputForDb {
  evaluation_type: string;
  judge_model: string;
  evaluation_metrice: string;
  dataset_path?: string;
  fileId: string;
  topicId?: string;
}
