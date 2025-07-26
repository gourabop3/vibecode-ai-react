"use client";
;
import Link from "next/link";
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
import { FragmentSandpack } from "../components/fragment-sandpack";
import { FragmentCode } from "../components/fragment-code";
import { CodeIcon, CrownIcon, EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserControl } from "@/components/user-control";
import { useAuth } from "@clerk/nextjs";
import { Loader } from "@/components/ui/loader";

interface ProjectViewProps {
  projectId: string;
}

export const ProjectView = ({
  projectId
}: ProjectViewProps) => {

  const { has } = useAuth();
  const hasPremiumAccess = has?.({
    plan : "pro"
  });
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview"|"code">("preview");

  return (
    <div className="h-full w-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full resizable-panel-group">
        <ResizablePanel
          defaultSize={35}
          minSize={15}
          maxSize={70}
          className="flex flex-col min-h-0 overflow-hidden resizable-panel"
        >
          <Suspense fallback={<Loader/>}>
            <Header projectId={projectId}/>
          </Suspense>
          <Suspense fallback={<Loader/>}>
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
          minSize={30}
          maxSize={85}
          className="flex flex-col min-h-0 overflow-hidden resizable-panel"
        >
          <Tabs
            className="h-full w-full flex flex-col"
            defaultValue="preview"
            value={tabState}
            onValueChange={(value)=>setTabState(value as "preview"|"code")}
          >
            <div className="w-full flex items-center p-2 border-b gap-x-2 flex-shrink-0">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon/>
                  <span className="ml-1">Preview</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon/>
                  <span className="ml-1">Code</span>
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-x-2">
                {
                  !hasPremiumAccess && (
                    <Button
                      asChild
                      size="sm"
                    >
                      <Link href="/pricing">
                        <CrownIcon/>
                        Upgrade
                      </Link>
                    </Button>
                  )
                }
                <UserControl/>
              </div>
            </div>
            <TabsContent value="preview" className="flex-1 min-h-0 overflow-hidden tabs-content">
              {
                !!activeFragment ? (
                  <FragmentSandpack
                    fragment={activeFragment}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>No fragment selected. Generate a React app to see the preview.</p>
                  </div>
                )
              }
            </TabsContent>
            <TabsContent value="code" className="flex-1 min-h-0 overflow-hidden tabs-content">
              {
                !!activeFragment && (
                  <FragmentCode
                    fragment={activeFragment}
                  />
                )
              }
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

