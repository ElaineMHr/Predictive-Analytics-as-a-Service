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
import { SortableHeader } from "@/components/table";
import type { MLPredictionJoined } from "@/lib/actions/predictions/prediction.action";
import MLPredictionActions from "./MLPredictionActions";
import PredictionStatusBadge from "@/components/ui/prediction-status-badge";

type Props = {
  predictions: MLPredictionJoined[];
  askDelete: (id: string, name: string) => void;
  askUpdate: (id: string, name: string) => void;
};

const MLPredictionsTable = ({ predictions, askDelete, askUpdate }: Props) => {
  return (
    <div>
      <Table>
        <TableCaption>List of Predictions</TableCaption>

        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader field="name" label="Prediction name" />
            </TableHead>
            <TableHead>
              <SortableHeader field="model_name" label="Model" />
            </TableHead>
            <TableHead>
              <SortableHeader field="status" label="Status" />
            </TableHead>
            <TableHead>
              <SortableHeader field="created_at" label="Created" />
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {predictions.map((pr) => {
            return (
              <TableRow key={pr.id}>
                <TableCell className="font-medium">
                  {pr.status === "predicting" || pr.status === "failed" ? (
                    <div>{pr.name}</div>
                  ) : (
                    <Link
                      to={`${pr.model_id}/${pr.id}`}
                      aria-label="View prediction"
                    >
                      {pr.name}
                    </Link>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link
                    to={`${pr.model_id}`}
                    aria-label="View model"
                    className="font-medium"
                  >
                    {pr.model_name}
                  </Link>
                </TableCell>
                <TableCell>
                  <PredictionStatusBadge status={pr.status} />
                </TableCell>
                <TableCell>{pr.created_at}</TableCell>
                <TableCell>
                  <MLPredictionActions
                    modelId={pr.model_id}
                    predictionId={pr.id}
                    parent="Prediction"
                    onDelete={() => askDelete(pr.id, pr.name)}
                    onUpdate={() => askUpdate(pr.id, pr.name)}
                    disabled={
                      pr.status === "predicting" || pr.status === "failed"
                    }
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={7}>Total</TableCell>
            <TableCell className="text-right">{predictions.length}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default MLPredictionsTable;
