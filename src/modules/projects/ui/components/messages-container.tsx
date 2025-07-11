import { use, useEffect, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

import { MessageCard } from "./message-card";
import { MessageForm } from "./message-form";


interface Props {
  projectId: string;
}

export const MessagesContainer = ({
  projectId
}: Props) => {
  
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const trpc = useTRPC();
  const { data : messages } = useSuspenseQuery(trpc.messages.getMany.queryOptions({projectId}));

  useEffect(()=>{
    const lastAssistantMessage = messages.findLast(message => message.role === "ASSISTANT");
    if (lastAssistantMessage) {
    }

  }, [messages]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length])
  
  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="pt-2 pr-4">
          {messages.map((message)=>(
            <MessageCard
              key={message.id}
              content={message.content}
              role={message.role}
              fragment={message.fragment}
              createdAt={message.createdAt}
              isActive={false}
              onFragmentClick={() => {}}
              type={message.type}
            />
          ))}
          <div ref={bottomRef}/>
        </div>
      </div>
      <div className="relative p-3 pt-1">
          <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background/70 pointer-events-none"/>
          <MessageForm projectId={projectId} />
      </div>
    </div>
  )
}


