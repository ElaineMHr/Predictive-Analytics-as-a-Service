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
import MLProblemActions from "./MLProblemActions";
import { SortableHeader } from "@/components/table";
import type { MLProblemJoined } from "@/lib/actions/mlProblems/mlProblem.action";

type Props = {
  mlProblems: MLProblemJoined[];
  askDelete: (id: string, name: string) => void;
  askUpdate: (id: string, name: string) => void;
};

const MLProblemsJoinedTable = ({ mlProblems, askDelete, askUpdate }: Props) => {
  return (
    <div>
      <Table>
        <TableCaption>List of ML Problems</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader field="name" label="ML Problem name" />
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
              <SortableHeader field="task" label="Task" />
            </TableHead>
            <TableHead>
              <SortableHeader field="target" label="Target" />
            </TableHead>
            <TableHead>
              <SortableHeader field="created_at" label="Created" />
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mlProblems.map((mlp) => {
            return (
              <TableRow key={mlp.id}>
                <TableCell>
                  <Link
                    to={`/dashboard/datasets/${mlp.dataset_id}/${mlp.dataset_version_id}/${mlp.id}`}
                    aria-label="View ML problem"
                    className="font-medium"
                  >
                    {mlp.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link
                    to={`/dashboard/datasets/${mlp.dataset_id}/${mlp.dataset_version_id}`}
                    aria-label="View dataset version"
                    className="font-medium"
                  >
                    {mlp.dataset_version_name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link
                    to={`/dashboard/datasets/${mlp.dataset_id}`}
                    aria-label="View dataset"
                    className="font-medium"
                  >
                    {mlp.dataset_name}
                  </Link>
                </TableCell>
                <TableCell>{mlp.task}</TableCell>
                <TableCell>{mlp.target}</TableCell>
                <TableCell>{mlp.created_at}</TableCell>
                <TableCell>
                  <MLProblemActions
                    datasetId={mlp.dataset_id}
                    datasetVersionId={mlp.dataset_version_id}
                    problemId={mlp.id}
                    parent="ML Problem"
                    onDelete={() => askDelete(mlp.id, mlp.name)}
                    onUpdate={() => askUpdate(mlp.id, mlp.name)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={6}>Total</TableCell>
            <TableCell className="text-right">{mlProblems.length}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default MLProblemsJoinedTable;
