import { PairWiseMetrice, PointWiseMetrice, WithoutType } from '../metrics.schema';

export class metricsRun {
  response_model_name?: string;
  model_name?: string;
  response_model_provider?: string;
  evaluation_type: string;
  evaluation_metrice: string;
  baseline_model_name?: string;
  dataset_path?: string;
  fileId?: string;
  topicId?: string;
  custom_metrice_data?: PairWiseMetrice | PointWiseMetrice | WithoutType;
}
