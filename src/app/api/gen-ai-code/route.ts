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

const codeGenerationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
};

const codeSession = model.startChat({
  generationConfig: codeGenerationConfig,
  history: []
});

// Dependency mapping for auto-detection
const DEPENDENCY_MAP: { [key: string]: string } = {
  'lucide-react': '^0.469.0',
  'date-fns': '^4.1.0',
  'react-chartjs-2': '^5.3.0',
  'chart.js': '^4.4.7',
  'axios': '^1.3.0',
  'clsx': '^1.2.0',
  'framer-motion': '^10.0.0',
  'react-router-dom': '^6.8.0',
  'uuid': '^9.0.0',
  'react-hook-form': '^7.43.0',
  'zod': '^3.20.0',
  '@hookform/resolvers': '^2.9.0',
  'react-icons': '^4.7.0',
  'tailwind-merge': '^1.12.0'
};

function ensureDependencies(response: any) {
  if (!response.files) return response;
  
  // Collect all imports from generated code
  const detectedPackages = new Set<string>();
  
  Object.values(response.files).forEach((file: any) => {
    const code = typeof file === 'string' ? file : file.code || '';
    
    // Find all import statements
    const importMatches = code.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
    if (importMatches) {
      importMatches.forEach((match: string) => {
        const packageMatch = match.match(/from\s+['"]([^'"]+)['"]/);
        if (packageMatch) {
          const packageName = packageMatch[1];
          
          // Skip relative imports and built-in modules
          if (!packageName.startsWith('.') && 
              !packageName.startsWith('/') && 
              !packageName.startsWith('http') &&
              !['react', 'react-dom'].includes(packageName)) {
            
            // Extract main package name (handle scoped packages)
            const mainPackage = packageName.startsWith('@') 
              ? packageName.split('/').slice(0, 2).join('/')
              : packageName.split('/')[0];
              
            if (DEPENDENCY_MAP[mainPackage]) {
              detectedPackages.add(mainPackage);
            }
          }
        }
      });
    }
  });
  
  // Ensure package.json exists and has all detected dependencies
  const baseDependencies: { [key: string]: string } = {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  };
  
  // Add detected dependencies
  detectedPackages.forEach(pkg => {
    baseDependencies[pkg] = DEPENDENCY_MAP[pkg];
  });
  
  // Create or update package.json
  const packageJson = {
    name: "generated-react-app",
    version: "0.1.0",
    private: true,
    dependencies: baseDependencies,
    scripts: {
      start: "react-scripts start",
      build: "react-scripts build"
    }
  };
  
  // Ensure package.json is included in files
  response.files["package.json"] = {
    code: JSON.stringify(packageJson, null, 2)
  };
  
  // Ensure package.json is in generatedFiles list
  if (!response.generatedFiles.includes("package.json")) {
    response.generatedFiles.unshift("package.json");
  }
  
  console.log('🔧 Auto-detected dependencies:', Array.from(detectedPackages));
  console.log('📦 Final package.json dependencies:', baseDependencies);
  
  return response;
}

const CODE_GEN_PROMPT = `
You are an expert React developer. Based on the user's request, create a complete React application with proper dependency management.

IMPORTANT: Return ONLY valid JSON in the following format:
{
  "projectTitle": "App Name",
  "explanation": "Brief description of what was built",
  "files": {
    "package.json": {
      "code": "{\n  \"name\": \"react-app\",\n  \"version\": \"0.1.0\",\n  \"dependencies\": {\n    \"react\": \"^18.2.0\",\n    \"react-dom\": \"^18.2.0\"\n  }\n}"
    },
    "App.js": {
      "code": "complete React component code here"
    },
    "components/ComponentName.js": {
      "code": "complete component code here"
    }
  },
  "generatedFiles": ["package.json", "App.js", "components/ComponentName.js"]
}

CRITICAL REQUIREMENTS:
1. **ALWAYS include package.json** with ALL dependencies you use in the code
2. **Match imports with dependencies** - every import must have its package in dependencies
3. Use React with modern hooks and functional components
4. Use Tailwind CSS for styling (classes like bg-blue-500, text-white, etc.)
5. Create multiple components when needed in a 'components/' folder
6. Use proper imports: import React from 'react'; for all components

DEPENDENCY MAPPING (CRITICAL - include exact versions):
- "react": "^18.2.0" (ALWAYS required)
- "react-dom": "^18.2.0" (ALWAYS required) 
- "lucide-react": "^0.469.0" (for any icons: Heart, Shield, Clock, Users, Play, Home, Search, Menu, User, Settings, Mail, Bell, Calendar, Star, Upload, Download, Trash, Edit, Plus, Minus, Check, X, ArrowRight, etc.)
- "date-fns": "^4.1.0" (for date manipulation, formatting)
- "react-chartjs-2": "^5.3.0" + "chart.js": "^4.4.7" (for charts)
- "axios": "^1.3.0" (for HTTP requests)
- "clsx": "^1.2.0" (for conditional classes)
- "framer-motion": "^10.0.0" (for animations)
- "react-router-dom": "^6.8.0" (for routing)
- "uuid": "^9.0.0" (for unique IDs)
- "react-hook-form": "^7.43.0" (for forms)
- "zod": "^3.20.0" (for validation)
- "@hookform/resolvers": "^2.9.0" (for form validation)
- "react-icons": "^4.7.0" (alternative icons)
- "tailwind-merge": "^1.12.0" (for merging Tailwind classes)

PACKAGE.JSON CREATION RULES:
1. Scan ALL your generated code for imports
2. For EVERY import that's not a relative path (./ or ../), add the corresponding package
3. Use the EXACT versions listed above
4. ALWAYS include react and react-dom

EXAMPLE: If you use "import { Calendar } from 'lucide-react'", then package.json MUST include "lucide-react": "^0.469.0"

Create a fully functional, beautiful React application with proper dependencies installed.
`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const finalPrompt = prompt + '\n\n' + CODE_GEN_PROMPT;
    const result = await codeSession.sendMessage(finalPrompt);
    const response = result.response.text();
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(response);
    
    // Post-process to ensure dependencies are included
    const processedResponse = ensureDependencies(parsedResponse);
    
    return NextResponse.json(processedResponse);
  } catch (error) {
    console.error('AI Code Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}