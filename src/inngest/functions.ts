import * as z from "zod";
import { inngest } from "./client";
import { lastAssistantTextMessageContent } from "./utils";
import {
    gemini,
    createAgent,
    createTool,
    createNetwork,
    Tool,
    Message,
    createState
} from "@inngest/agent-kit";

import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "@/lib/prompt";
import { prisma } from "@/lib/db";

interface AgentState {
    summary : string;
    files : Record<string, string>;
}

export const codeAgentFunction = inngest.createFunction(
    { id: "code-agent" },
    { event: "code-agent/run" },
    async ({ event, step }) => {

        // No need for E2B sandbox - we'll use Sandpack for preview
        console.log("Generating React app files for project:", event.data.projectId);

        const previousMessages = await step.run("get-previous-messages", async () => {
            const formattedMessages : Message[] = [];
            const messages = await prisma.message.findMany({
                where: {
                    projectId: event.data.projectId,
                },
                orderBy: {
                    createdAt: "desc",
                },
                take : 5,
            });

            for (const message of messages) {
                formattedMessages.push({
                    content: message.content,
                    role: message.role === "ASSISTANT" ? "assistant" : "user",
                    type: "text",
                });
            }
            return formattedMessages.reverse();
        });

        const state = createState<AgentState>(
            {
                summary: "",
                files : {}
            },
            {
                messages : previousMessages,
            }
        )
        
        const codeAgent = createAgent<AgentState>({
            name: "code-agent",
            description : "An expert coding agent",
            system: PROMPT,
            model: gemini({
                model: "gemini-2.5-flash",
            }),
            tools : [
                createTool({
                    name : "writeFiles",
                    description: "Create or update React files for the application.",
                    parameters: z.object({
                        files: z.array(z.object({
                            path : z.string(),
                            content : z.string()
                        })),
                    }),
                    handler: async(
                        { files },
                        { step, network } : Tool.Options<AgentState>
                    ) => {
                        const newFiles =  await step?.run("create-or-update-files", async()=>{
                            try {
                                const updatedFiles = network.state.data.files || {};
                                
                                // Add React files to the state
                                for (const file of files) {
                                    updatedFiles[file.path] = file.content;
                                    console.log(`Added/Updated file: ${file.path}`);
                                }
                                return updatedFiles;
                            } catch (error) {
                                return `Error creating or updating files: ${error}`;
                            }
                        });

                        if (typeof newFiles === "object") {
                            network.state.data.files = newFiles;
                        }
                        
                        return "Files created/updated successfully";
                    }
                }),
                createTool({
                    name : "readFiles",
                    description: "Read files from the React application.",
                    parameters: z.object({
                        files: z.array(z.string())
                    }),
                    handler: async ({ files }, { step, network })=>{
                        return await step?.run("read-files", async()=>{
                            try {
                                const currentFiles = network.state.data.files || {};
                                const contents: { path: string; content: string }[] = [];
                                
                                for (const file of files) {
                                    const content = currentFiles[file] || "File not found";
                                    contents.push({ path: file, content });
                                }
                                return `Files read successfully: ${JSON.stringify(contents)}`;
                            } catch (error) {
                                return `Error reading files: ${error}`;
                            }
                        })
                    }
                }),
            ],
            lifecycle : {
                onResponse : async({ result, network }) => {
                   const lastAssistantMessageText = lastAssistantTextMessageContent(result);
                    if (lastAssistantMessageText && network ) {
                        if (lastAssistantMessageText.includes("<task_summary>")) {
                            network.state.data.summary = lastAssistantMessageText;
                        }
                    }
                   return result;
                }
            }
        });

        const network = createNetwork<AgentState>({ 
            name : "coding-agent-network",
            agents : [codeAgent],
            maxIter : 15,
            defaultState : state,
            router : async ({network})=> {
                const summary = network.state.data.summary;
                if (summary) {
                    return;
                }
                return codeAgent
            }
        });

        const result = await network.run(event.data.value, { state });
        
        const fragmentTitleGenerator = createAgent({
            name : "fragment-title-generator",
            description : "Generates a short, descriptive title for a code fragment",
            system: FRAGMENT_TITLE_PROMPT,
            model : gemini({
                model: "gemini-2.5-flash",
            }),
        });

        const responseGenerator = createAgent({
            name : "response-generator",
            description : "Generates a user-friendly message explaining what was built",
            system: RESPONSE_PROMPT,
            model : gemini({
                model: "gemini-2.5-flash",
            }),
        });

        const { output : fragmentTitleOutput } = await fragmentTitleGenerator.run(result.state.data.summary);
        const { output : responseOutput } = await responseGenerator.run(result.state.data.summary);
        
        const generateFragmentTitle = () => {
            if (fragmentTitleOutput[0].type !== "text") {
                return "Fragment";
            }
            else if (Array.isArray(fragmentTitleOutput[0].content)){
                return fragmentTitleOutput[0].content.map((item) => item.text).join(" ");
            }
            else {
                return fragmentTitleOutput[0].content.trim();
            }
        }
        const generateResponse = () => {
            if (responseOutput[0].type !== "text") {
                return "Here's what I built for you.";
            }
            else if (Array.isArray(responseOutput[0].content)){
                return responseOutput[0].content.map((item) => item.text).join(" ");
            }
            else {
                return responseOutput[0].content.trim();
            }
        }

        const isError = !result.state.data.summary || Object.keys(result.state.data.files || {}).length === 0;

        // Debug: Log the files being saved
        console.log("Files about to be saved to fragment:", result.state.data.files);
        console.log("Number of files:", Object.keys(result.state.data.files || {}).length);
        console.log("Summary:", result.state.data.summary);

        // No sandbox URL needed - Sandpack will handle the preview
        const sandboxUrl = "sandpack://preview";

        await step.run("save-result", async ()=>{

            if (isError) {
                return await prisma.message.create({
                    data : {
                        projectId : event.data.projectId,
                        content : "Error: No summary or files generated.",
                        role : "ASSISTANT",
                        type : "ERROR"
                    }
                }) 
            }

            await prisma.message.create({
                data : {
                    projectId : event.data.projectId,
                    content : generateResponse(),
                    role : "ASSISTANT",
                    type : "RESULT",
                    fragment : {
                        create : {
                            sandboxUrl,
                            title : generateFragmentTitle(),
                            files : result.state.data.files || {},
                        }
                    }
                }
            })
        })

        return {
            url: sandboxUrl,
            title : "Fragment",
            files : result.state.data.files,
            summary: result.state.data.summary
        };
    },
);
