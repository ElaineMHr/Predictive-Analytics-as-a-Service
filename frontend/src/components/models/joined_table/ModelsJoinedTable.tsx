import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import ModelActions from "./ModelActions";
import { SortableHeader } from "@/components/table";
import type { ModelJoined } from "@/lib/actions/models/model.action";
import ModelStatusBadge from "@/components/ui/model-status-badge";

type Props = {
  models: ModelJoined[];
  askDelete: (id: string, name: string) => void;
  askUpdate: (id: string, name: string) => void;
};

const ModelsJoinedTable = ({ models, askDelete, askUpdate }: Props) => {
  function round(value?: number, decimals: number = 2) {
    if (value == null) return "—";
    return Math.round(value * 10 ** decimals) / 10 ** decimals;
  }

  function safeMetric(metrics_json: string) {
    try {
      const { f1, rmse } = JSON.parse(metrics_json || "{}");

      if (Number.isFinite(f1)) {
        return round(f1, 3);
      }

      if (Number.isFinite(rmse)) {
        return rmse.toFixed(2);
      }

      return "";
    } catch {
      return "";
    }
  }

  return (
    <div>
      <Table>
        <TableCaption>List of Models</TableCaption>

        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader field="name" label="Model name" />
            </TableHead>
            <TableHead>
              <SortableHeader field="problem_name" label="ML Problem" />
            </TableHead>
            <TableHead>
              <SortableHeader
                field="dataset_version_name"
                label="Dataset Version"
              />
            </TableHead>
            <TableHead>
              <SortableHeader field="dataset_name" label="Dataset" />
            </TableHead>
            <TableHead>
              <SortableHeader field="status" label="Status" />
            </TableHead>
            <TableHead>
              <SortableHeader field="algorithm" label="Algorithm" />
            </TableHead>
            <TableHead>
              <SortableHeader field="metrics" label="Metrics" />
            </TableHead>
            <TableHead>
              <SortableHeader field="train_mode" label="Train Mode" />
            </TableHead>
            <TableHead>
              <SortableHeader
                field="evaluation_strategy"
                label="Evaluation Strategy"
              />
            </TableHead>
            <TableHead>
              <SortableHeader field="created_at" label="Created" />
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {models.map((m) => {
            return (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  {m.status === "training" || m.status === "failed" ? (
                    <div>{m.name}</div>
                  ) : (
                    <Link
                      to={`/dashboard/datasets/${m.dataset_id}/${m.dataset_version_id}/${m.problem_id}/${m.id}`}
                      aria-label="View Model"
                    >
                      {m.name}
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link
                    to={`/dashboard/datasets/${m.dataset_id}/${m.dataset_version_id}/${m.problem_id}`}
                    aria-label="View ML problem"
                    className="font-medium"
                  >
                    {m.problem_name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link
                    to={`/dashboard/datasets/${m.dataset_id}/${m.dataset_version_id}`}
                    aria-label="View dataset version"
                    className="font-medium"
                  >
                    {m.dataset_version_name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link
                    to={`/dashboard/datasets/${m.dataset_id}`}
                    aria-label="View dataset"
                    className="font-medium"
                  >
                    {m.dataset_name}
                  </Link>
                </TableCell>
                <TableCell>
                  <ModelStatusBadge status={m.status} />
                </TableCell>
                <TableCell>{m.algorithm}</TableCell>
                <TableCell>{safeMetric(m.metrics_json)}</TableCell>
                <TableCell>{m.train_mode}</TableCell>
                <TableCell>
                  {m.evaluation_strategy === "cv"
                    ? "cross validation"
                    : "holdout"}
                </TableCell>
                <TableCell>{m.created_at}</TableCell>

                <TableCell>
                  <ModelActions
                    datasetId={m.dataset_id}
                    datasetVersionId={m.dataset_version_id}
                    problemId={m.problem_id}
                    modelId={m.id}
                    parent="Model"
                    onDelete={() => askDelete(m.id, m.name)}
                    onUpdate={() => askUpdate(m.id, m.name)}
                    disabled={m.status === "training" || m.status === "failed"}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={10}>Total</TableCell>
            <TableCell className="text-right">{models.length}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default ModelsJoinedTable;
