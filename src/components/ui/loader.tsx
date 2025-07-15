import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface Props {
  className?: string;
}

export const Loader = ({
  className
}: Props) => {
  return (
    <div
      className={cn(
        "size-full flex-1 relative flex items-center justify-center",
        className
      )}
    >
      <Loader2
        className="text-muted-foreground animate-spin size-5"
      />
    </div>
  )
}

