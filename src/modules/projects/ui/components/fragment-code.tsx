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

  // Convert to simple file structure
  const files: { [path: string]: string } = {};
  
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
      // Clean up the path
      let cleanPath = path.startsWith('/') ? path.substring(1) : path;
      if (!cleanPath.startsWith('src/') && !cleanPath.includes('.json') && !cleanPath.includes('.html')) {
        cleanPath = `src/${cleanPath}`;
      }
      files[cleanPath] = content;
    }
  });

  // Add default App.js if not present
  if (!files["src/App.js"]) {
    files["src/App.js"] = `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
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

  const fileKeys = Object.keys(files);
  const currentFile = files[selectedFile] || files[fileKeys[0]] || '';

  return (
    <div className="h-full w-full flex">
      {/* File List */}
      <div className="w-64 border-r bg-sidebar overflow-y-auto">
        <div className="p-2">
          <h3 className="font-semibold text-sm mb-2">Files</h3>
          {fileKeys.map((filePath) => (
            <div
              key={filePath}
              className={`p-2 text-sm cursor-pointer rounded hover:bg-accent ${
                selectedFile === filePath ? 'bg-accent' : ''
              }`}
              onClick={() => setSelectedFile(filePath)}
            >
              {filePath}
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