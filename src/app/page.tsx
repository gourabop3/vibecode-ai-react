"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export default function Home() {

  const [value, setValue] = useState("");

  const trpc = useTRPC();
  const createProject = useMutation(trpc.projects.create.mutationOptions({
    onSuccess : ()=> {
      toast.success("Background job invoked successfully");
    }
  }));
  

  return (
    <div>
        <Input value={value} onChange={(e)=>setValue(e.target.value)} />
        <Button disabled={createProject.isPending} onClick={()=>createProject.mutate({ value })}  >
          Invoke
        </Button>
    </div>
  );
}
