import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { prompt, projectId } = await req.json();

    if (!prompt || !projectId) {
      return NextResponse.json(
        { error: "Prompt and projectId are required" },
        { status: 400 }
      );
    }

    // Immediately create a user message
    await prisma.message.create({
      data: {
        projectId,
        content: prompt,
        role: "USER",
        type: "PROMPT"
      }
    });

    // Trigger the background job
    await inngest.send({
      name: "code-agent/run",
      data: { projectId }
    });

    // Return immediate response with streaming-like feedback
    return NextResponse.json({
      success: true,
      message: "Code generation started! Your app is being built with modern React features...",
      status: "generating",
      projectId,
      estimatedTime: "15-30 seconds",
      features: [
        "🎨 Beautiful Tailwind CSS styling",
        "⚛️ Modern React components", 
        "🔧 Rich package ecosystem",
        "📱 Responsive design",
        "✨ Interactive features"
      ]
    });

  } catch (error) {
    console.error("Code generation API error:", error);
    return NextResponse.json(
      { error: "Failed to start code generation" },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint to check generation status
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: "Project ID required" }, { status: 400 });
  }

  try {
    // Get the latest message for this project
    const latestMessage = await prisma.message.findFirst({
      where: { projectId },
      include: { fragment: true },
      orderBy: { createdAt: 'desc' }
    });

    if (latestMessage?.fragment) {
      return NextResponse.json({
        status: "completed",
        message: latestMessage.content,
        fragment: {
          id: latestMessage.fragment.id,
          title: latestMessage.fragment.title,
          files: latestMessage.fragment.files
        }
      });
    }

    return NextResponse.json({
      status: "generating",
      message: "Still working on your app..."
    });

  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}