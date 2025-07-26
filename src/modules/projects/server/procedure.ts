import * as z from "zod";

import { prisma } from "@/lib/db";
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

        // Create project with initial user message
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
        });

        // Generate AI response in background (don't await - fire and forget)
        (async () => {
            try {
                // Call AI code generation API directly
                const aiResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/gen-ai-code`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt: input.value }),
                });

                if (!aiResponse.ok) {
                    throw new Error('Failed to generate code');
                }

                const aiResult = await aiResponse.json();
                
                // Also get a chat response for the user
                const chatResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai-chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ prompt: `I'm building: ${aiResult.projectTitle}. ${aiResult.explanation}` }),
                });

                let assistantMessage = "I've created your React app!";
                if (chatResponse.ok) {
                    const chatResult = await chatResponse.json();
                    assistantMessage = chatResult.result || assistantMessage;
                }

                // Create assistant message with fragment
                await prisma.message.create({
                    data: {
                        projectId: project.id,
                        content: assistantMessage,
                        role: "ASSISTANT",
                        type: "RESULT",
                        fragment: {
                            create: {
                                title: aiResult.projectTitle || "React App",
                                sandboxUrl: "sandpack://preview",
                                files: aiResult.files || {},
                            }
                        }
                    }
                });

            } catch (error) {
                console.error('Direct AI generation error in project creation:', error);
                
                // Create error message
                await prisma.message.create({
                    data: {
                        projectId: project.id,
                        content: "Sorry, I encountered an error while generating your app. Please try again.",
                        role: "ASSISTANT",
                        type: "ERROR"
                    }
                });
            }
        })().catch(console.error); // Fire and forget with error handling

        return project;
    })
})