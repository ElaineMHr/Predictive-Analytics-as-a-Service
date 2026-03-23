import ExplainabilityClassification from "./ExplainabilityClassification";
import ExplainabilityRegression from "./ExplainabilityRegression";

type ParentImportance = {
  parent: string;
  value: number;
};

type FeatureImportance = {
  fid: number;
  value: number;
};

type FeatureDistribution = {
  fid: number;
  shap_quantiles: number[];
  X_quantiles: Array<number | string | null>;
};

type ExplainFeature = {
  fid: number;
  name: string;
  parent: string;
};

export type ExplainabilitySummaryRegression = {
  task: "regression";
  metadata: {
    model_output: string;
    output_space: string;
    n_ref: number;
    n_explain: number;
    top_k: number;
    quantiles: number[];
    seed: number;
  };

  features: ExplainFeature[];

  global: {
    mean_abs: FeatureImportance[];
    mean_abs_parent: ParentImportance[];
  };

  distributions: {
    per_feature: FeatureDistribution[];
  };
};

export type ExplainabilitySummaryClassification = {
  task: "classification";
  metadata: {
    model_output: string;
    output_space: string;
    n_ref: number;
    n_explain: number;
    top_k: number;
    quantiles: number[];
    seed: number;
    n_classes: number;
    label_classes: string[];
  };

  features: ExplainFeature[];

  global: {
    mean_abs_per_class: Record<string, FeatureImportance[]>;
    mean_abs_parent_per_class: Record<string, ParentImportance[]>;
  };

  distributions: Record<
    string,
    {
      per_feature: FeatureDistribution[];
    }
  >;
};

export type ExplainabilitySummary =
  | ExplainabilitySummaryRegression
  | ExplainabilitySummaryClassification;

type Props = {
  summary: ExplainabilitySummary;
};

const Explainability = ({ summary }: Props) => {
  if (summary.task === "regression") {
    return <ExplainabilityRegression summary={summary} />;
  } else {
    return <ExplainabilityClassification summary={summary} />;
  }
};

export default Explainability;
