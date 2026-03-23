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
import type { Dataset } from "@/lib/actions/datasets/dataset.action";
import { Link } from "react-router-dom";
import { RowActions, SortableHeader } from "../table";

type Props = {
  datasets: Dataset[];
  askDelete: (id: string, name: string) => void;
  askUpdate: (id: string, name: string) => void;
};

const DatasetsTable = ({ datasets, askDelete, askUpdate }: Props) => {
  return (
    <div>
      <Table>
        <TableCaption>List of Datasets</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader field="name" label="Name" />
            </TableHead>
            <TableHead>id</TableHead>
            <TableHead>
              <SortableHeader field="created_at" label="Created" />
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datasets.map((ds) => (
            <TableRow key={ds.id}>
              <TableCell className="font-medium">
                <Link to={`${ds.id}`} aria-label="View dataset">
                  {ds.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{ds.id}</TableCell>
              <TableCell>{ds.created_at}</TableCell>
              <TableCell>
                <RowActions
                  id={ds.id}
                  parent="Dataset"
                  onDelete={() => askDelete(ds.id, ds.name)}
                  onUpdate={() => askUpdate(ds.id, ds.name)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right">{datasets.length}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default DatasetsTable;
