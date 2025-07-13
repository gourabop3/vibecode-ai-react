import * as z from "zod";

import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";

export const messageRouter = createTRPCRouter({
    getMany : protectedProcedure
    .input(z.object({
        projectId : z.string().min(1, "Project ID is required")
    }))
    .query(async({ input, ctx })=>{
        const messages = await prisma.message.findMany({
            where : {
                projectId : input.projectId,
                project : {
                    userId : ctx.auth.userId ?? ctx.userId,
                }
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
    create : protectedProcedure
    .input(z.object({
        value : z.string().min(1, "Prompt cannot be empty").max(1000, "Prompt cannot be longer than 1000 characters"),
        projectId : z.string().min(1, "Project ID is required")
    }))
    .mutation(async({input, ctx})=>{

        const existingProject = await prisma.project.findUnique({
            where : {
                id : input.projectId,
                userId : ctx.auth.userId ?? ctx.userId,
            }
        });

        if (!existingProject) {
            throw new TRPCError({
                code : "NOT_FOUND",
                message : "Project not found or you do not have access to it"
            });
        }

        const message = await prisma.message.create({
            data : {
                projectId : existingProject.id,
                content : input.value,
                role : "USER",
                type : "RESULT"
            }
        });

        await inngest.send({
            name : "code-agent/run",
            data : {
                value: input.value,
                projectId: input.projectId
            }
        });

        return message;
    })
})