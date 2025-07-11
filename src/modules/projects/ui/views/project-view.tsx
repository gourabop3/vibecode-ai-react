"use client";
;
import { Suspense, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import { MessagesContainer } from "../components/messages-container";
import { Fragment } from "@/generated/prisma";
import { Header } from "../components/header";

interface ProjectViewProps {
  projectId: string;
}

export const ProjectView = ({
  projectId
}: ProjectViewProps) => {

  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <Suspense fallback={<div>Loading header...</div>}>
            <Header projectId={projectId}/>
          </Suspense>
          <Suspense fallback={<div>Loading messages...</div>}>
            <MessagesContainer
              projectId={projectId}
              activeFragment={activeFragment}
              setActiveFragment={setActiveFragment}
            />
          </Suspense>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          defaultSize={65}
          minSize={50}
        >
          PEREVIEW
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

