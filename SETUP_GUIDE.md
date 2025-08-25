# 🚀 Setup Guide for React AI Code Generator

## 📋 Prerequisites

- Node.js 18+ installed
- Git installed

## 🔑 Environment Variables Setup

### 1. Clerk Authentication (Required)

1. **Sign up for Clerk**:
   - Go to [https://clerk.com](https://clerk.com)
   - Create a free account

2. **Create a new application**:
   - Click "Add application"
   - Choose "Next.js" as the framework
   - Give it a name (e.g., "React AI Generator")

3. **Get your API keys**:
   - In your Clerk dashboard, go to "API Keys"
   - Copy the **Publishable key** (starts with `pk_test_`)
   - Copy the **Secret key** (starts with `sk_test_`)

4. **Update `.env.local`**:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY_HERE
   CLERK_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY_HERE
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 2. Database (Already configured)
- Using SQLite for local development (no setup needed)

### 3. AI Configuration
- **SIMPLIFIED**: Uses direct API calls for faster code generation like Libra
- No background processing setup required - AI works immediately
- Just ensure you have your Gemini API key set in `.env.local`

## 🏃‍♂️ Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up the database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

## 🧪 Testing AI Generation

1. Create a new project
2. Send a message like "create a todo app"
3. The AI will generate code directly and quickly
4. View the generated app in the preview tab
5. Check the code tab to see all generated files

## 🧪 Testing the React AI Generator

1. **Sign up/Sign in** using Clerk authentication
2. **Create a new project**
3. **Test the AI generation**:
   - Try prompts like: "Create a todo app with React"
   - The AI should generate React components instantly
   - View the generated code in the **Code** tab
   - See the live preview in the **Preview** tab (powered by Sandpack)

## 🛠️ Troubleshooting

### Issue: "Publishable key not valid"
- **Solution**: Make sure you've replaced the placeholder in `.env.local` with your actual Clerk keys

### Issue: AI generation not working
- **Solution**: Ensure your Gemini API key is set correctly in `.env.local`

### Issue: Database errors
- **Solution**: Run `npx prisma db push` to set up the SQLite database

## 🔍 Debug Information

When testing the React generation:
1. Open browser console (F12)
2. Look for debug logs starting with "Fragment files:", "Available files:", etc.
3. These logs will help identify if the AI is generating files correctly

## 📞 Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Clerk keys are correctly set
3. Make sure the development server is running on port 3000
4. Ensure your Gemini API key is valid