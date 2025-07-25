import * as z from "zod";
import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import {
    gemini,
    createAgent,
    createTool,
    createNetwork,
    Tool,
    Message,
    createState
} from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";
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

        const sandboxId = await step.run("get-sandbox-id", async () => {
            const sandbox = await Sandbox.create(); // Use default template for React app
            return sandbox.sandboxId
        });

        await step.run("setup-react-app", async () => {
            const sandbox = await getSandbox(sandboxId);
            
            // Create React app structure
            await sandbox.commands.run("npx create-react-app . --template typescript --yes", {
                onStdout: (data) => console.log(data),
                onStderr: (data) => console.error(data)
            });
            
            // Install additional packages
            await sandbox.commands.run("npm install tailwindcss @tailwindcss/forms @tailwindcss/typography autoprefixer postcss lucide-react class-variance-authority clsx tailwind-merge --yes", {
                onStdout: (data) => console.log(data),
                onStderr: (data) => console.error(data)
            });
            
            // Initialize Tailwind CSS
            await sandbox.commands.run("npx tailwindcss init -p", {
                onStdout: (data) => console.log(data),
                onStderr: (data) => console.error(data)
            });
            
            // Update tailwind.config.js
            await sandbox.files.write("tailwind.config.js", `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}`);
            
            // Update src/index.css
            await sandbox.files.write("src/index.css", `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`);
            
            return "React app setup complete";
        });

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
                    name : "terminal",
                    description: "Use the terminal to run shell commands.",
                    parameters : z.object({
                        command : z.string()
                    }),
                    handler: async({ command }, { step }) => {
                        return await step?.run("terminal", async()=>{
                            const buffers = { stdout: "", stderr: "" };
                            try {
                                const sandbox = await getSandbox(sandboxId);
                                const result = await sandbox.commands.run(command, {
                                    onStdout: (data)=>{
                                        buffers.stdout += data;
                                    },
                                    onStderr: (data)=>{
                                        buffers.stderr += data;
                                    }
                                });
                                return result.stdout
                            } catch (error) {
                                console.error(
                                    `Command failed: ${error}\nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`,
                                );
                                return `Command failed: ${error}\nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`
                            }
                        })
                    }
                }),
                createTool({
                    name : "createOrUpdateFiles",
                    description: "Create or update files in the Sandbox.",
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
                                const sandbox = await getSandbox(sandboxId);
                                for (const file of files) {
                                    await sandbox.files.write(file.path, file.content);
                                    updatedFiles[file.path] = file.content;
                                }
                                return updatedFiles;
                            } catch (error) {
                                return `Error creating or updating files: ${error}`;
                            }
                        });

                        if (typeof newFiles === "object") {
                            network.state.data.files = newFiles;
                        }
                    }
                }),
                createTool({
                    name : "readFiles",
                    description: "Read files from the Sandbox.",
                    parameters: z.object({
                        files: z.array(z.string())
                    }),
                    handler: async ({ files }, { step })=>{
                        return await step?.run("read-files", async()=>{
                            try {
                                
                                const sandbox = await getSandbox(sandboxId);
                                const contents: Record<string, string>[] = [];
                                for (const file of files) {
                                    const content = await sandbox.files.read(file);
                                    contents.push({path: file, content});
                                }
                                return JSON.stringify(contents);
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

        const sandboxUrl = await step.run("get-sandbox-url", async () => {
            const sandbox = await getSandbox(sandboxId);
            
            // Start the React development server
            await sandbox.commands.run("npm start", {
                background: true,
                onStdout: (data) => console.log("React server:", data),
                onStderr: (data) => console.error("React server error:", data)
            });
            
            // Wait a moment for the server to start
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const host = sandbox.getHost(3000);
            return `https://${host}`;
        });

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
