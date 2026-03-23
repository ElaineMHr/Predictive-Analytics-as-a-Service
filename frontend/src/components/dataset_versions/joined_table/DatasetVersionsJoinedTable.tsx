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
import type { DatasetVersionJoined } from "@/lib/actions/dataset_versions/datasetVersion.action";
import DatasetVersionActions from "./DatasetVersionActions";

type Props = {
  datasetVersions: DatasetVersionJoined[];
  askDelete: (id: string, name?: string) => void;
  askUpdate: (id: string, name?: string) => void;
};

const DatasetVersionsJoinedTable = ({
  datasetVersions,
  askDelete,
  askUpdate,
}: Props) => {
  return (
    <div>
      <Table>
        <TableCaption>List of Dataset Versions</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortableHeader field="name" label="Dataset version name" />
            </TableHead>
            <TableHead>
              <SortableHeader field="dataset_name" label="Dataset name" />
            </TableHead>
            <TableHead>
              <SortableHeader field="filename" label="Filename" />
            </TableHead>
            <TableHead>
              <SortableHeader field="created_at" label="Created" />
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {datasetVersions.map((dsv) => (
            <TableRow key={dsv.id}>
              <TableCell>
                <Link
                  to={`/dashboard/datasets/${dsv.dataset_id}/${dsv.id}`}
                  aria-label="View dataset version"
                  className="font-medium"
                >
                  {dsv.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <Link
                  to={`/dashboard/datasets/${dsv.dataset_id}`}
                  aria-label="View dataset"
                  className="font-medium"
                >
                  {dsv.dataset_name}
                </Link>
              </TableCell>
              <TableCell>{dsv.filename}</TableCell>
              <TableCell>{dsv.created_at}</TableCell>
              <TableCell>
                <DatasetVersionActions
                  datasetId={dsv.dataset_id}
                  datasetVersionId={dsv.id}
                  parent="Dataset Version"
                  onDelete={() => askDelete(dsv.id, dsv.name)}
                  onUpdate={() => askUpdate(dsv.id, dsv.name)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>Total</TableCell>
            <TableCell className="text-right">
              {datasetVersions.length}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default DatasetVersionsJoinedTable;
