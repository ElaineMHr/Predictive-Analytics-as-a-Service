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
import type { MLProblem } from "@/lib/actions/mlProblems/mlProblem.action";

type Props = {
  mlProblems: MLProblem[];
  askDelete: (id: string, name: string) => void;
  askUpdate: (id: string, name: string) => void;
};

const MLProblemsTable = ({ mlProblems, askDelete, askUpdate }: Props) => {
  return (
    <div>
      <Table>
        <TableCaption>List of ML Problems</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader field="name" label="Name" />
            </TableHead>
            <TableHead>id</TableHead>
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
          {mlProblems.map((mlp) => (
            <TableRow key={mlp.id}>
              <TableCell className="font-medium">
                <Link to={`${mlp.id}`} aria-label="View ML problem">
                  {mlp.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{mlp.id}</TableCell>
              <TableCell>{mlp.task}</TableCell>
              <TableCell>{mlp.target}</TableCell>
              <TableCell>{mlp.created_at}</TableCell>
              <TableCell>
                <RowActions
                  id={mlp.id}
                  parent="ML Problem"
                  onDelete={() => askDelete(mlp.id, mlp.name)}
                  onUpdate={() => askUpdate(mlp.id, mlp.name)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5}>Total</TableCell>
            <TableCell className="text-right">{mlProblems.length}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default MLProblemsTable;
