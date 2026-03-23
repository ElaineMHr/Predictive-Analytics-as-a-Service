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
import { RowActions, SortableHeader } from "../table";
import type { Prediction } from "@/lib/actions/predictions";
import PredictionStatusBadge from "../ui/prediction-status-badge";

type Props = {
  predictions: Prediction[];
  askDelete: (id: string, name: string) => void;
  askUpdate: (id: string, name: string) => void;
};

const PredictionsTable = ({ predictions, askDelete, askUpdate }: Props) => {
  return (
    <div>
      <Table>
        <TableCaption>List of Predictions</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader field="name" label="Name" />
            </TableHead>
            <TableHead>id</TableHead>
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
          {predictions.map((pr) => (
            <TableRow key={pr.id}>
              <TableCell className="font-medium">
                {pr.status === "predicting" || pr.status === "failed" ? (
                  <div>{pr.name}</div>
                ) : (
                  <Link to={`${pr.id}`} aria-label="View prediction">
                    {pr.name}
                  </Link>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{pr.id}</TableCell>
              <TableCell>
                <PredictionStatusBadge status={pr.status} />
              </TableCell>
              <TableCell>{pr.created_at}</TableCell>
              <TableCell>
                <RowActions
                  id={pr.id}
                  parent="Prediction"
                  onDelete={() => askDelete(pr.id, pr.name)}
                  onUpdate={() => askUpdate(pr.id, pr.name)}
                  disabled={
                    pr.status === "predicting" || pr.status === "failed"
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell className="text-right">{predictions.length}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default PredictionsTable;
