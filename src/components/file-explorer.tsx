import { Fragment, useCallback, useMemo, useState } from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import { Hint } from "./hint";
import { Button } from "./ui/button";
import { CopyCheckIcon, CopyIcon } from "lucide-react";
import { CodeView } from "./code";
import { convertFilesToTreeItems } from "@/lib/utils";
import { TreeView } from "./tree-view";
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";

type FileCollection = { [path: string]: string };

const getFileExtension = (fileName: string) => {
  return fileName.split('.').pop()?.toLowerCase() || 'text';
}

interface FileExplorerProps {
  files: FileCollection;
}

export const FileExplorer = ({
  files
}: FileExplorerProps) => {

  const [copied, setCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string|null>(()=>{
    const fileKeys = Object.keys(files);
    return fileKeys.length > 0 ? fileKeys[0] : null;
  });

  const treeData = useMemo(()=>{
    return convertFilesToTreeItems(files)
  }, [files]);

  const handleFileSelect = useCallback((filePath: string)=>{
    if (files[filePath]) {
      setSelectedFile(filePath);
    }
  }, [files]);

  const handleFileCopy = useCallback(()=>{
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }, [selectedFile])

  interface FileBreadcrumb {
    filePath: string;
  }

  const FileBreadcrumb = ({ filePath }: FileBreadcrumb) => {
    const pathsegments = filePath.split('/');
    const maxSegments = 3;
    const renderedSegments = ()=> {
      if (pathsegments.length <= maxSegments) {
        return pathsegments.map((segment, index) => {
          const isLast = index === pathsegments.length - 1;
          return (
            <Fragment key={index}>
              <BreadcrumbItem>
                {
                  isLast ? (
                    <BreadcrumbPage className="font-medium">
                      {segment}
                    </BreadcrumbPage>
                  ) : (
                    <span className="text-muted-foreground">
                      {segment}
                    </span>
                  )
                }
              </BreadcrumbItem>
              {index < pathsegments.length - 1 && <BreadcrumbSeparator/>}
            </Fragment>
          )
        });
      } else {
        const firstSegment = pathsegments[0];
        const lastSegment = pathsegments[pathsegments.length - 1];
        return (
          <>
            <BreadcrumbItem>
              <span className="text-muted-foreground">
                {firstSegment}
              </span>
            </BreadcrumbItem>
            <BreadcrumbSeparator/>
            <BreadcrumbItem>
              <BreadcrumbEllipsis/>
            </BreadcrumbItem>
            <BreadcrumbSeparator/>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">
                {lastSegment}
              </BreadcrumbPage>
            </BreadcrumbItem> 
          </>
        )
      }
    }

    return (
      <Breadcrumb>
        <BreadcrumbList>
          {renderedSegments()}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }


  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={30} minSize={30} className="h-full">
        <TreeView
          data={treeData}
          onSelect={handleFileSelect}
          value={selectedFile}
        />
      </ResizablePanel>
      <ResizableHandle withHandle className="hover:bg-primary transition-colors"/>
      <ResizablePanel defaultSize={70} minSize={50}>
        {
          selectedFile && files[selectedFile] ? (
            <div className="h-full w-full flex flex-col">
              <div className="border-b flex bg-sidebar px-4 py-2 justify-between items-center">
                <FileBreadcrumb filePath={selectedFile} />
                <Hint content="Copy the file path to clipboard">
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={handleFileCopy}
                    disabled={copied}
                  >
                    { copied ? <CopyCheckIcon/> : <CopyIcon/> }
                  </Button>
                </Hint>
              </div>
              <div className="flex-1 overflow-auto p-2">
                <CodeView
                  code={files[selectedFile]}
                  language={getFileExtension(selectedFile)}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-muted-foreground">
              Open a file to view its contents
            </div>
          )
        }
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}



