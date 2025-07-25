import { useState } from "react"
import { Fragment } from "@/generated/prisma"
import { Button } from "@/components/ui/button"
import { ExternalLinkIcon, RefreshCcwIcon } from "lucide-react"
import { Hint } from "@/components/hint"

interface Props {
  fragment : Fragment
}

export const FragmentWeb = ({
  fragment
}: Props) => {

  const [ fragmentKey, setFragmentKey ] = useState(0);
  const [copied, setCopied] = useState(false);

  const onRefresh = () => {
    setFragmentKey(prev => prev + 1);
  }

  const onCopy = () => {
    navigator.clipboard.writeText(fragment.sandboxUrl || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  
  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
        >
          <RefreshCcwIcon/>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCopy}
          className="flex-1 justify-start text-start font-normal"
        >
          <span className="truncate text-foreground">{fragment.sandboxUrl}</span>
        </Button>
        <Hint content="Open in new tab" align="start">
          <Button
            size="sm"
            variant="outline"
            disabled={!fragment.sandboxUrl}
            onClick={() => {
              if (fragment.sandboxUrl) {
                window.open(fragment.sandboxUrl, "_blank");
              }
            }}
          >
            <ExternalLinkIcon/>
          </Button>
        </Hint>
      </div>
      {/* Original iframe preview */}
      <iframe
        key={fragmentKey}
        className="w-full h-full"
        sandbox="allow-scripts allow-same-origin allow-forms"
        loading="lazy"
        src={fragment.sandboxUrl}
      />
    </div>
  )
}
