import * as z from "zod";

import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";

export const messageRouter = createTRPCRouter({
    getMany : baseProcedure
    .input(z.object({
        projectId : z.string().min(1, "Project ID is required")
    }))
    .query(async({ input })=>{
        const messages = await prisma.message.findMany({
            where : {
                projectId : input.projectId
            },
            include : {
                fragment : true 
            },
            orderBy : {
                createdAt : "asc"
            }
        })
        return messages;
    }),
    create : baseProcedure
    .input(z.object({
        value : z.string().min(1, "Prompt cannot be empty").max(1000, "Prompt cannot be longer than 1000 characters"),
        projectId : z.string().min(1, "Project ID is required")
    }))
    .mutation(async({input})=>{

        const message = await prisma.message.create({
            data : {
                projectId : input.projectId,
                content : input.value,
                role : "USER",
                type : "RESULT"
            }
        })

        await inngest.send({
            name : "code-agent/run",
            data : {
                value: input.value,
                projectId: input.projectId
            }
        })

        return message;
    })
})