
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useTRPC } from "@/trpc/client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeftIcon, SunMoon } from "lucide-react";

interface Props {
  projectId: string;
}

export const Header = ({
  projectId
}: Props) => {

  const trpc = useTRPC();
  const theme = useTheme();
  const { data: project } = useSuspenseQuery(trpc.projects.getOne.queryOptions({
    projectId
  }));

  return (
    <header className="p-2 flex justify-between items-center border-b">
      <DropdownMenu>
        <DropdownMenuTrigger asChild >
          <Button
            variant="ghost"
            size="sm"
            className="focus-visible:ring-0 hover:bg-transparent hover:opacity-75 transition-opacity pl-2!"
          >
            <Image
              src="/logo.svg"
              alt="Vibe"
              height={18}
              width={18}
            />
            <span className="text-sm font-medium">{project.name}</span>
            <ChevronDown/>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="bottom">
          <DropdownMenuItem asChild>
            <Link href="/">
              <ChevronLeftIcon/>
              <span>Back to projects</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator/>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <SunMoon className="size-4 text-muted-foreground"/>
              <span>Appearance</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme.theme} onValueChange={(e) => theme.setTheme(e)}>
                  <DropdownMenuRadioItem value="light">
                    <span>Light</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <span>Dark</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    <span>System</span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
