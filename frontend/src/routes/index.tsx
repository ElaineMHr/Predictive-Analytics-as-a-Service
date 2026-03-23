import { createBrowserRouter } from "react-router-dom";
import AppPage from "../pages/app/AppPage";
import DashboardLayout from "../layouts/dashboard/DashboardLayout";
import OverviewPage from "../pages/dashboard/OverviewPage";
import DatasetsPage from "../pages/dashboard/datasets/DatasetsPage";
import JobsPage from "../pages/dashboard/jobs/JobsPage";
import DatasetDetailPage from "../pages/dashboard/datasets/DatasetDetailPage";
import DatasetVersionDetailPage from "../pages/dashboard/dataset_versions/DatasetVersionDetailPage";
import MLProblemDetailPage from "../pages/dashboard/ml_problems/MLProblemDetailPage";
import ModelDetailPage from "@/pages/dashboard/models/ModelDetailPage";
import PredictionDetailPage from "@/pages/dashboard/predictions/PredictionDetailPage";
import DatasetVersionsPage from "@/pages/dashboard/dataset_versions/DatasetVersionsPage";
import MLProblemsPage from "@/pages/dashboard/ml_problems/MLProblemsPage";
import ModelsPage from "@/pages/dashboard/models/ModelsPage";
import PredictionsPage from "@/pages/dashboard/predictions/PredictionsPage";

export const router = createBrowserRouter([
  { path: "/", element: <AppPage /> },
  {
    path: "/dashboard",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: "datasets", element: <DatasetsPage /> },
      { path: "datasets/:datasetId", element: <DatasetDetailPage /> },
      {
        path: "datasets/:datasetId/:datasetVersionId",
        element: <DatasetVersionDetailPage />,
      },
      {
        path: "datasets/:datasetId/:datasetVersionId/:problemId",
        element: <MLProblemDetailPage />,
      },
      {
        path: "datasets/:datasetId/:datasetVersionId/:problemId/:modelId",
        element: <ModelDetailPage />,
      },
      {
        path: "datasets/:datasetId/:datasetVersionId/:problemId/:modelId/:predictionId",
        element: <PredictionDetailPage />,
      },
      { path: "dataset-versions", element: <DatasetVersionsPage /> },
      { path: "ml-problems", element: <MLProblemsPage /> },
      { path: "models", element: <ModelsPage /> },
      { path: "predictions", element: <PredictionsPage /> },
      { path: "jobs", element: <JobsPage /> },
    ],
  },
]);
