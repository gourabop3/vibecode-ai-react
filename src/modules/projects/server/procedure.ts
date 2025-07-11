import * as z from "zod";

import { prisma } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { generateSlug } from "random-word-slugs";
import { TRPCError } from "@trpc/server";

export const projectRouter = createTRPCRouter({
    getOne : baseProcedure
    .input(z.object({
        projectId : z.string().min(1, "Project ID is required")
    }))
    .query(async({ input })=>{
        const projects = await prisma.project.findUnique({
            where : {
                id : input.projectId
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
    getMany : baseProcedure
    .query(async()=>{
        const projects = await prisma.project.findMany({
            orderBy : {
                updatedAt : "desc"
            }
        });
        return projects;
    }),
    create : baseProcedure
    .input(z.object({
        value : z.string().min(1, "Prompt cannot be empty").max(1000, "Prompt cannot be longer than 1000 characters")
    }))
    .mutation(async({input})=>{

        const project = await prisma.project.create({
            data : {
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