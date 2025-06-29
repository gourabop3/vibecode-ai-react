import { inngest } from "./client";
import { Agent, gemini, createAgent } from "@inngest/agent-kit";

export const helloWorld = inngest.createFunction(
    { id: "hello-world" },
    { event: "test/hello.world" },
    async ({ event }) => {
        const codeAgent = createAgent({
            name: "code-agent",
            system: "You are an expert next.js developer. You write readable and maintainable code. You write code in TypeScript. You write code that is compatible with Next.js 14. You write code that is compatible with React 18. You write code that is compatible with Node.js 20.",
            model: gemini({
                model: "gemini-2.5-flash", 
            }),
        });

        
        const { output } = await codeAgent.run(`Write the following snippet: ${event.data.value}`);
        console.log("output", output);

        return { message: output };
    },
);
