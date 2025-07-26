"use client";

import { Fragment } from "@/generated/prisma"
import { useState } from "react";

interface Props {
  fragment: Fragment
}

export const FragmentCode = ({
  fragment
}: Props) => {
  const [selectedFile, setSelectedFile] = useState<string>("src/App.js");

  // Parse fragment files safely
  let fragmentFiles: { [path: string]: any } = {};
  try {
    if (fragment?.files) {
      if (typeof fragment.files === 'string') {
        fragmentFiles = JSON.parse(fragment.files);
      } else {
        fragmentFiles = fragment.files as { [path: string]: any };
      }
    }
  } catch (error) {
    console.error("Error parsing fragment files:", error);
    fragmentFiles = {};
  }

  // Create complete React app structure with all files
  const files: { [path: string]: string } = {};
  
  // Add essential React project files first
  files["package.json"] = JSON.stringify({
    name: "react-app",
    version: "0.1.0",
    private: true,
    dependencies: {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "lucide-react": "^0.469.0",
      "date-fns": "^4.1.0"
    },
    scripts: {
      start: "react-scripts start",
      build: "react-scripts build",
      test: "react-scripts test"
    }
  }, null, 2);

  files["public/index.html"] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React App</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

  files["src/index.js"] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`;

  files["src/index.css"] = `/* Tailwind CSS and base styles */
@import 'https://cdn.tailwindcss.com/3.4.1';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #1f2937;
}`;

  files["README.md"] = `# React App

This project was created with AI and uses React 18 with Tailwind CSS.

## Available Scripts

- \`npm start\` - Runs the app in development mode
- \`npm run build\` - Builds the app for production
- \`npm test\` - Launches the test runner`;

  // Process AI-generated files and add/override them
  Object.entries(fragmentFiles).forEach(([path, fileData]) => {
    let content = '';
    if (typeof fileData === 'string') {
      content = fileData;
    } else if (fileData && typeof fileData === 'object' && 'code' in fileData) {
      content = fileData.code;
    } else {
      content = String(fileData || '');
    }
    
    if (content.trim()) {
      // Clean up the path - keep original structure but fix format
      let cleanPath = path.startsWith('/') ? path.substring(1) : path;
      
      // Handle different path formats
      if (cleanPath === 'App.js' || cleanPath === 'src/App.js') {
        cleanPath = 'src/App.js';
      } else if (cleanPath.startsWith('components/')) {
        // Keep components in their folder: components/TodoList.js
        cleanPath = `src/${cleanPath}`;
      } else if (cleanPath.includes('/components/')) {
        // Handle nested: some/path/components/TodoList.js -> src/components/TodoList.js
        const fileName = cleanPath.split('/').pop();
        cleanPath = `src/components/${fileName}`;
      } else if (!cleanPath.startsWith('src/') && 
                !cleanPath.startsWith('public/') && 
                !['package.json', 'tailwind.config.js', 'README.md', '.gitignore'].includes(cleanPath) &&
                (cleanPath.endsWith('.js') || cleanPath.endsWith('.jsx'))) {
        // Other JS files go in src/
        cleanPath = `src/${cleanPath}`;
      }
      
      files[cleanPath] = content;
    }
  });

  // Ensure we have a default App.js
  if (!files["src/App.js"]) {
    files["src/App.js"] = `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Your React App
        </h1>
        <p className="text-lg text-gray-600">
          Start building something amazing!
        </p>
      </div>
    </div>
  );
}

export default App;`;
  }

  const fileKeys = Object.keys(files).sort((a, b) => {
    // Sort files with folders first, then files
    const aIsFolder = a.includes('/');
    const bIsFolder = b.includes('/');
    
    if (aIsFolder && !bIsFolder) return 1;
    if (!aIsFolder && bIsFolder) return -1;
    
    // Put important files at top
    const importantFiles = ['package.json', 'README.md', 'src/App.js', 'src/index.js', 'src/index.css', 'public/index.html'];
    const aIndex = importantFiles.indexOf(a);
    const bIndex = importantFiles.indexOf(b);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    return a.localeCompare(b);
  });
  
  const currentFile = files[selectedFile] || files[fileKeys[0]] || '';

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return '📄';
    if (fileName.endsWith('.css')) return '🎨';
    if (fileName.endsWith('.html')) return '🌐';
    if (fileName.endsWith('.json')) return '⚙️';
    if (fileName.endsWith('.md')) return '📝';
    if (fileName.includes('/')) return '📁';
    return '📄';
  };

  return (
    <div className="h-full w-full flex">
      {/* File List */}
      <div className="w-64 border-r bg-sidebar overflow-y-auto">
        <div className="p-2">
          <h3 className="font-semibold text-sm mb-2">Project Files</h3>
          {fileKeys.map((filePath) => (
            <div
              key={filePath}
              className={`p-2 text-sm cursor-pointer rounded hover:bg-accent ${
                selectedFile === filePath ? 'bg-accent' : ''
              } flex items-center gap-2`}
              onClick={() => setSelectedFile(filePath)}
            >
              <span>{getFileIcon(filePath)}</span>
              <span className="truncate">{filePath}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Code Viewer */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="bg-muted rounded p-4">
            <pre className="text-sm overflow-auto">
              <code>{currentFile}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};