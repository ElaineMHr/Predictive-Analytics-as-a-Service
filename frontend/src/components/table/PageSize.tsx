import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useSearchParams } from "react-router-dom";

type Props = {
  size: number;
  sizeParam?: string;
  pageParam?: string;
};

const DEFAULT_SIZE = 20;

const PageSize = ({ size, sizeParam = "size", pageParam = "page" }: Props) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const onChange = (size: string) => {
    const params = new URLSearchParams(searchParams);
    if (Number(size) === DEFAULT_SIZE) params.delete(sizeParam);
    else params.set(sizeParam, size);
    params.delete(pageParam);
    setSearchParams(params, { replace: true });
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Results per page</span>
      <Select value={size.toString()} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className="w-14 text-xs focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="min-w-0">
          {[10, 20, 50].map((v) => (
            <SelectItem
              key={v}
              value={v.toString()}
              className="text-xs w-12"
              hideIndicator={true}
            >
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default PageSize;
