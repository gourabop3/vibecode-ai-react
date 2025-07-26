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
                include: {
                    fragment: true
                },
                orderBy: {
                    createdAt: "desc",
                },
                take : 10, // Increased from 5 to 10 for better context
            });

            for (const message of messages) {
                formattedMessages.push({
                    content: message.content,
                    role: message.role === "ASSISTANT" ? "assistant" : "user",
                    type: "text",
                });
                
                // If this is an assistant message with a fragment, add the current files as context
                if (message.role === "ASSISTANT" && message.fragment && message.fragment.files) {
                    try {
                        const files = typeof message.fragment.files === 'string' 
                            ? JSON.parse(message.fragment.files)
                            : message.fragment.files;
                        
                        if (files && Object.keys(files).length > 0) {
                            formattedMessages.push({
                                content: `Current app files:\n${JSON.stringify(files, null, 2)}`,
                                role: "assistant",
                                type: "text",
                            });
                        }
                    } catch (error) {
                        console.error("Error parsing fragment files:", error);
                    }
                }
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
            description : "An expert React development agent that creates production-ready applications",
            system: PROMPT,
            model: gemini({
                model: "gemini-2.5-flash",
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.95,
                    topK: 40,
                    maxOutputTokens: 8192,
                }
            }),
            tools : [
                createTool({
                    name : "writeFiles",
                    description: "Create or update React files for the application. Use this to save all the React component files with modern packages and features.",
                    parameters: z.object({
                        files: z.array(z.object({
                            path : z.string().describe("File path relative to project root, e.g., 'src/App.js' or 'src/components/Button.js'"),
                            content : z.string().describe("Complete file content as a string with modern React features and packages")
                        })).describe("Array of files to create or update with rich functionality"),
                    }),
                    handler: async(
                        { files },
                        { step, network } : Tool.Options<AgentState>
                    ) => {
                        console.log(`writeFiles called with ${files.length} files`);
                        
                        const newFiles =  await step?.run("create-or-update-files", async()=>{
                            try {
                                const updatedFiles = { ...(network.state.data.files || {}) };
                                
                                // Add React files to the state
                                for (const file of files) {
                                    if (!file.path || !file.content) {
                                        console.error("Invalid file object:", file);
                                        continue;
                                    }
                                    updatedFiles[file.path] = file.content;
                                    console.log(`✅ Added/Updated file: ${file.path} (${file.content.length} chars)`);
                                }
                                
                                console.log(`Total files in state: ${Object.keys(updatedFiles).length}`);
                                return updatedFiles;
                            } catch (error) {
                                console.error("Error in writeFiles:", error);
                                return network.state.data.files || {};
                            }
                        });

                        if (typeof newFiles === "object" && newFiles !== null) {
                            network.state.data.files = newFiles;
                            return `Successfully created/updated ${files.length} files. Total files: ${Object.keys(newFiles).length}`;
                        } else {
                            return "Error: Failed to update files in state";
                        }
                    }
                }),
                createTool({
                    name : "readFiles",
                    description: "Read files from the React application. Use this to understand existing files before making modifications.",
                    parameters: z.object({
                        files: z.array(z.string()).optional().describe("Specific files to read. If not provided, returns all available files."),
                    }),
                    handler: async ({ files }, { step, network })=>{
                        return await step?.run("read-files", async()=>{
                            try {
                                const currentFiles = network.state.data.files || {};
                                
                                // If no specific files requested, return all files
                                if (!files || files.length === 0) {
                                    return `All available files:\n${JSON.stringify(currentFiles, null, 2)}`;
                                }
                                
                                const contents: { path: string; content: string }[] = [];
                                
                                for (const file of files) {
                                    const content = currentFiles[file] || "File not found";
                                    contents.push({ path: file, content });
                                }
                                return JSON.stringify(contents, null, 2);
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
            maxIter : 25, // Increased from 15 to 25 for complex modifications
            defaultState : state,
            router : async ({network})=> {
                const summary = network.state.data.summary;
                if (summary) {
                    return;
                }
                return codeAgent
            }
        });

        console.log("Starting network run with input:", event.data.value);
        
        let result;
        try {
            result = await network.run(event.data.value, { state });
            console.log("Network run completed successfully");
            console.log("Final state summary:", result.state.data.summary);
            console.log("Final state files:", Object.keys(result.state.data.files || {}));
        } catch (error) {
            console.error("Network run failed:", error);
            // Create a fallback result
            result = {
                state: {
                    data: {
                        summary: `<task_summary>Error occurred during code generation: ${error}</task_summary>`,
                        files: {}
                    }
                }
            };
        }
        
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

        // More robust error checking
        const hasValidSummary = result.state.data.summary && 
                               result.state.data.summary.includes("<task_summary>");
        const hasValidFiles = result.state.data.files && 
                             Object.keys(result.state.data.files).length > 0;
        const isError = !hasValidSummary || !hasValidFiles;

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
