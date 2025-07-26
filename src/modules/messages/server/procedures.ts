import * as z from "zod";

import { prisma } from "@/lib/db";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { consumeUsage } from "@/lib/usage";

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

        // Create user message first
        const userMessage = await prisma.message.create({
            data : {
                projectId : existingProject.id,
                content : input.value,
                role : "USER",
                type : "RESULT"
            }
        });

        try {
            // Get previous messages for context
            const previousMessages = await prisma.message.findMany({
                where: {
                    projectId: input.projectId,
                },
                include: {
                    fragment: true
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 5,
            });

            // Build context from previous messages
            let conversationContext = "";
            if (previousMessages.length > 1) {
                conversationContext = "Previous conversation:\n";
                previousMessages.reverse().forEach(msg => {
                    if (msg.role === "USER") {
                        conversationContext += `User: ${msg.content}\n`;
                    } else if (msg.role === "ASSISTANT" && msg.fragment) {
                        conversationContext += `Assistant: Built ${msg.fragment.title || 'a React app'}\n`;
                    }
                });
                conversationContext += "\nCurrent request: ";
            }

            const fullPrompt = conversationContext + input.value;

            // Call AI code generation API directly
            const aiResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/gen-ai-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: fullPrompt }),
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
            const assistantMessageRecord = await prisma.message.create({
                data: {
                    projectId: existingProject.id,
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

            return assistantMessageRecord;

        } catch (error) {
            console.error('Direct AI generation error:', error);
            
            // Create error message
            await prisma.message.create({
                data: {
                    projectId: existingProject.id,
                    content: "Sorry, I encountered an error while generating your app. Please try again.",
                    role: "ASSISTANT",
                    type: "ERROR"
                }
            });

            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to generate app. Please try again."
            });
        }
    })
})