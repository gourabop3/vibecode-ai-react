"use client";

import * as z from "zod";
import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Form,
  FormControl,
  FormField
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TextareaAutosize from 'react-textarea-autosize';
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { PROJECT_TEMPLATES } from "@/lib/constants";
import { TemplateCard } from "./template-card";
import { Usage } from "@/modules/projects/ui/components/usage";


const formSchema = z.object({
  value : z.string().min(1, "Prompt cannot be empty").max(1000, "Prompt cannot be longer than 1000 characters"),
})

export const ProjectForm = () => {

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const clerk = useClerk();
  const [isFocused, setIsFocused] = useState(false);

  const { data : usage } = useQuery(trpc.usage.status.queryOptions());
  const createProject = useMutation(trpc.projects.create.mutationOptions({
    onSuccess : (data) => {
      queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
      queryClient.invalidateQueries(trpc.usage.status.queryOptions());
      router.push(`/project/${data.id}`);
    },
    onError : (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        clerk.openSignIn();
        return;
      }
      if (error.data?.code === "TOO_MANY_REQUESTS") {
        router.push("/pricing");
        return;
      }
      toast.error(error.message || "Failed to create message");
    }
  }));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver : zodResolver(formSchema),
    defaultValues : {
      value : "",
    }
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await createProject.mutateAsync({
      value: data.value,
    });
  }

  const isPending = createProject.isPending;
  const isDisabled = isPending || !form.formState.isValid;
  const showUsage = !!usage;


  return (
    <Form {...form} >
      {
        showUsage && <Usage points={usage.remainingPoints} msBeforeNext={usage.msBeforeNext} />
      }
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all",
          isFocused && "shadow-xs",
          showUsage && "rounded-t-none"
        )}
      >
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormControl>
              <TextareaAutosize
                disabled={isPending}
                {...field}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                minRows={2}
                maxRows={8}
                className="pt-4 resize-none border-none w-full outline-none bg-transparent"
                placeholder="What would you like to build?"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)(e);
                  }
                }}
              />
            </FormControl>
          )}
        />
        <div className="flex gap-x-2 items-end justify-between pt-2">
          <div className="text-[10px] text-muted-foreground font-mono">
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <span>&#8984</span>Enter
            </kbd>
            &nbsp;to submit
          </div>
          <Button
            className={cn(
              "size-8 rounded-full",
              isDisabled && "bg-muted-foreground border"
            )}
            disabled={isDisabled}
          >
            {isPending ? (
              <SquareIcon className="size-4 bg-white"/>
            ) : (
              <ArrowUpIcon className="size-4" />
            )}
          </Button>
        </div>
      </form>
      <div className="grid grid-cols-2 md:grid-cols-3 mt-12 gap-6">
        {
          PROJECT_TEMPLATES.map((template)=>(
            <button
              key={template.title}
              className="w-full"
              onClick={() => {
                form.setValue("value", template.prompt)
                form.handleSubmit(onSubmit)();
              }}
            >
              <TemplateCard
                title={template.title}
                imageUrl={template.image}
              />
            </button>
          ))
        }
      </div>
    </Form>
  )
}
