import { PairWiseMetrice, PointWiseMetrice } from "../metrics.schema";

export class metricsRun {
    judge_model: string;
    judge_model_provider: string;
    evaluation_type: string;
    evaluation_metrice: string;
    custom_metrice_data: PairWiseMetrice | PointWiseMetrice;
}
