import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

const chatSession = model.startChat({
  generationConfig,
  history: [],
});

const CHAT_PROMPT = `
You are an AI Assistant and expert in React Development.
GUIDELINES:
- Tell user what you are building
- Response less than 15 lines
- Skip code examples and commentary
- Be friendly and helpful
`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const finalPrompt = prompt + '\n\n' + CHAT_PROMPT;
    const result = await chatSession.sendMessage(finalPrompt);
    const aiResponse = result.response.text();

    return NextResponse.json({ result: aiResponse });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
      { status: 500 }
    );
  }
}