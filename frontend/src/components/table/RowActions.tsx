import { Check, Copy, Ellipsis, FileText, Edit, Trash2 } from "lucide-react"; // X
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type Props = {
  id: string;
  parent: string;
  onDelete: () => void;
  onUpdate: () => void;
  disabled?: boolean;
};

const RowActions = ({
  id,
  parent,
  onDelete,
  onUpdate,
  disabled = false,
}: Props) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-start gap-1.5">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {!disabled ? (
              <Link
                to={`${id}`}
                aria-label={"View " + parent}
                className="inline-flex items-center justify-center text-muted-foreground hover:text-sky-400 hover:scale-105 active:scale-95"
              >
                <FileText className="w-4 h-4" />
              </Link>
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </TooltipTrigger>
          <TooltipContent>View {parent}</TooltipContent>
        </Tooltip>

        {!copied ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(id);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast.success(`${parent} id copied to clipboard`);
                }}
                className="text-muted-foreground hover:text-sky-400 hover:scale-105 active:scale-95"
              >
                <Copy className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy {parent} id</TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button>
                <Check className="w-4 h-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Copied</TooltipContent>
          </Tooltip>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger className="text-muted-foreground hover:text-sky-400 hover:scale-105 active:scale-95 focus-visible:outline-none">
            <Tooltip>
              <TooltipTrigger asChild>
                <Ellipsis className="w-4 h-4" />
              </TooltipTrigger>
              <TooltipContent>More Actions</TooltipContent>
            </Tooltip>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {!disabled ? (
              <Link to={`${id}`}>
                <DropdownMenuItem className="group text-muted-foreground">
                  <FileText className="w-4 h-4 group-data-[highlighted]:text-sky-400" />
                  View
                </DropdownMenuItem>
              </Link>
            ) : (
              <DropdownMenuItem className="group text-muted-foreground">
                <FileText className="w-4 h-4" />
                View
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(id);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                toast.success(`${parent} id copied to clipboard`);
              }}
              className="group text-muted-foreground"
            >
              <Copy className="w-4 h-4 group-data-[highlighted]:text-sky-400" />
              Copy id
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onUpdate}
              className="group text-muted-foreground"
            >
              <Edit className="w-4 h-4 group-data-[highlighted]:text-sky-400" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="group text-muted-foreground"
            >
              <Trash2 className="w-4 h-4 group-data-[highlighted]:text-red-500" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
};

export default RowActions;
