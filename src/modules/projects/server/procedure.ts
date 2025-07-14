import * as z from "zod";

import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import {protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { generateSlug } from "random-word-slugs";
import { TRPCError } from "@trpc/server";
import { consumeUsage } from "@/lib/usage";

export const projectRouter = createTRPCRouter({
    getOne : protectedProcedure
    .input(z.object({
        projectId : z.string().min(1, "Project ID is required")
    }))
    .query(async({ input, ctx })=>{
        const projects = await prisma.project.findUnique({
            where : {
                id : input.projectId,
                userId : ctx.auth.userId ?? ctx.userId,
            }
        });

        if (!projects) {
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Project not found"
            });
        }
        return projects;
    }),
    getMany : protectedProcedure
    .query(async({ctx})=>{
        const projects = await prisma.project.findMany({
            where : {
                userId : ctx.auth.userId ?? ctx.userId,
            },
            orderBy : {
                updatedAt : "desc"
            }
        });
        return projects;
    }),
    create : protectedProcedure
    .input(z.object({
        value : z.string().min(1, "Prompt cannot be empty").max(1000, "Prompt cannot be longer than 1000 characters")
    }))
    .mutation(async({input, ctx})=>{
        try {
            await consumeUsage();
        } catch (error) {
            if (error instanceof Error) {
                throw new TRPCError({
                    code : "BAD_REQUEST",
                    message : error.message
                });
            } 
            else {
                throw new TRPCError({
                    code : "TOO_MANY_REQUESTS",
                    message : "You have exceeded your usage limit. Please upgrade your plan to continue using the service."
                });
            }  
        }

        const project = await prisma.project.create({
            data : {
                userId : ctx.auth.userId ?? ctx.userId,
                name : generateSlug(2, { format : "kebab" }),
                messages : {
                    create :[{
                        content : input.value,
                        role : "USER",
                        type : "RESULT"
                    }]
                }
            }
        })

        await inngest.send({
            name : "code-agent/run",
            data : {
                value: input.value,
                projectId: project.id
            }
        })

        return project;
    })
})