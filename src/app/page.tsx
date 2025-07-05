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
  const createMessage = useMutation(trpc.messages.create.mutationOptions({
    onSuccess : ()=> {
      toast.success("Background job invoked successfully");
    }
  }));
  

  return (
    <div>
        <Input value={value} onChange={(e)=>setValue(e.target.value)} />
        <Button disabled={createMessage.isPending} onClick={()=>createMessage.mutate({ value })}  >
          Invoke
        </Button>
    </div>
  );
}
