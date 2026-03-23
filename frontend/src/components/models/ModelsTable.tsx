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
import { SortableHeader } from "../table";
import type { Model } from "@/lib/actions/models/model.action";
import ModelRowActions from "./ModelRowActions";
import ModelStatusBadge from "../ui/model-status-badge";

type Props = {
  models: Model[];
  askDelete: (id: string, name: string) => void;
  askUpdate: (id: string, name: string) => void;
  askSetProd: (id: string, name: string) => void;
  task: string;
};

const ModelsTable = ({
  models,
  askDelete,
  askUpdate,
  askSetProd,
  task,
}: Props) => {
  function round(value?: number, decimals: number = 2) {
    if (value == null) return "—";
    return Math.round(value * 10 ** decimals) / 10 ** decimals;
  }

  return (
    <div>
      <Table>
        <TableCaption>
          <p>List of Models</p>
          {task === "classification" ? (
            <p className="text-xs">* Higher metrics are better</p>
          ) : (
            <p className="text-xs">* Lower metrics are better</p>
          )}
        </TableCaption>
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
              <SortableHeader field="algorithm" label="Algorithm" />
            </TableHead>
            <TableHead>
              <SortableHeader
                field="metrics"
                label="Metrics *"
                className="whitespace-nowrap"
              />
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
          {models.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">
                {m.status === "training" || m.status === "failed" ? (
                  <div>{m.name}</div>
                ) : (
                  <Link to={`${m.id}`} aria-label="View Model">
                    {m.name}
                  </Link>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{m.id}</TableCell>
              <TableCell>
                <ModelStatusBadge status={m.status} />
              </TableCell>
              <TableCell>{m.algorithm}</TableCell>
              <TableCell>
                {task === "classification"
                  ? (round(JSON.parse(m.metrics_json)?.f1, 3) ?? "—")
                  : (JSON.parse(m.metrics_json)?.rmse.toFixed(2) ?? "—")}
              </TableCell>
              <TableCell>{m.train_mode}</TableCell>
              <TableCell>
                {m.evaluation_strategy === "cv"
                  ? "cross validation"
                  : "holdout"}
              </TableCell>
              <TableCell>{m.created_at}</TableCell>
              <TableCell>
                <ModelRowActions
                  id={m.id}
                  parent="Model"
                  onDelete={() => askDelete(m.id, m.name)}
                  onUpdate={() => askUpdate(m.id, m.name)}
                  onSetProd={() => askSetProd(m.id, m.name)}
                  disabled={m.status === "training" || m.status === "failed"}
                  disableProd={m.status === "production"}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={8}>Total</TableCell>
            <TableCell className="text-right">{models.length}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default ModelsTable;
