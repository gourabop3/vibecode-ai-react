"use client";

import Link from "next/link";
import Image from "next/image";

import { useTRPC } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProjectList = () => {
  
  const trpc = useTRPC();
  const { user } = useClerk();
  const { data : projects, isPending } = useQuery(trpc.projects.getMany.queryOptions());

  return (
    <div className="w-full bg-white dark:bg-sidebar rounded-xl p-8 border flex flex-col gap-y-6 sm:gap-y-4">
      <h2 className="text-2xl font-bold">
        {user?.fullName ?? "Your" }&apos; Vibes
      </h2>
      {
        isPending ? (
          <div className="py-10 flex items-center justify-center">
            <span className="text-muted-foreground">
              <Loader2
                className="animate-spin size-6"
              />
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {projects && projects.length > 0 ? (
              projects.map((project) => (
                <Button
                  variant="outline"
                  key={project.id}
                  className="font-normal h-auto justify-start p-4 text-start"
                  asChild
                >
                  <Link href={`/project/${project.id}`}>
                    <div className="flex items-center gap-x-4">
                      <Image
                        src="/logo.svg"
                        alt="Project Logo"
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                      <div className="flex flex-col">
                        <h3 className="truncate font-medium">
                          {project.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(project.createdAt, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                </Button>
              ))
            ) : (
              <div className="col-span-full text-center">
                <p className="text-muted-foreground text-sm">
                  No projects found. Start by creating a new project!
                </p>
              </div>
            )}
          </div>
        )
      }
    </div>
  )
}
