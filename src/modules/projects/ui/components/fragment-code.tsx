"use client";

import { Fragment } from "@/generated/prisma"
import { FileExplorer } from "@/components/file-explorer";

interface Props {
  fragment: Fragment
}

export const FragmentCode = ({
  fragment
}: Props) => {
  // Get the files from the fragment
  const files = fragment.files as { [path: string]: string };

  return (
    <div className="h-full w-full">
      <FileExplorer files={files} />
    </div>
  );
};