"use client";
;
import { Suspense, useState } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import { MessagesContainer } from "../components/messages-container";
import { Fragment } from "@/generated/prisma";
import { Header } from "../components/header";
import { FragmentWeb } from "../components/fragment-web";
import { CodeIcon, CrownIcon, EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileExplorer } from "@/components/file-explorer";

interface ProjectViewProps {
  projectId: string;
}

export const ProjectView = ({
  projectId
}: ProjectViewProps) => {

  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview"|"code">("preview");

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
          <Tabs
            className="h-full gap-0"
            defaultValue="preview"
            value={tabState}
            onValueChange={(value)=>setTabState(value as "preview"|"code")}
          >
            <div className="w-full flex items-center p-2 border-b gap-x-2">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon/>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon/>
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-x-2">
                <Button
                  asChild
                  size="sm"
                >
                  <Link href="/pricing">
                    <CrownIcon/>
                    Upgrade
                  </Link>
                </Button>
              </div>
            </div>
            <TabsContent value="preview">
              {
                !!activeFragment && (
                  <FragmentWeb
                    fragment={activeFragment}
                  />
                )
              }
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
              {
                !!activeFragment && (
                  <FileExplorer files={activeFragment.files as { [path: string]: string }} />
                )
              }
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

