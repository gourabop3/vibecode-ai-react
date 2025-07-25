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
import { Sandpack } from "@codesandbox/sandpack-react";

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
  }, [])

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
    <div className="h-full w-full flex flex-col">
      {/* Sandpack file explorer and code editor */}
      <Sandpack
        template="react"
        files={files as any}
        options={{
          showTabs: true,
          showLineNumbers: true,
          showInlineErrors: true,
          editorHeight: 500,
          editorWidthPercentage: 60,
          wrapContent: true,
          showConsole: true,
          previewHeight: 200,
        }}
      />
    </div>
  )
}



