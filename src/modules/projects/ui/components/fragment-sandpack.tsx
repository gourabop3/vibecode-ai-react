"use client";

import { useState } from "react"
import { Fragment } from "@/generated/prisma"
import { Button } from "@/components/ui/button"
import { RefreshCcwIcon } from "lucide-react"
import { 
  SandpackProvider, 
  SandpackPreview
} from "@codesandbox/sandpack-react"


interface Props {
  fragment: Fragment
}

const SandpackToolbar = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleRefresh}
      >
        <RefreshCcwIcon className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="flex-1 justify-start text-start font-normal"
        disabled
      >
        <span className="truncate text-foreground">React App Preview</span>
      </Button>
    </div>
  );
};

export const FragmentSandpack = ({
  fragment
}: Props) => {
  
  // Convert fragment files to Sandpack format - handle different data structures
  let files: { [path: string]: string } = {};
  
  console.log("Raw fragment object:", fragment);
  console.log("Raw fragment.files:", fragment.files);
  console.log("Type of fragment.files:", typeof fragment.files);
  
  // Handle different possible data formats
  if (fragment.files) {
    if (typeof fragment.files === 'string') {
      try {
        files = JSON.parse(fragment.files);
      } catch (e) {
        console.error("Failed to parse fragment.files as JSON:", e);
        files = {};
      }
    } else if (typeof fragment.files === 'object') {
      files = fragment.files as { [path: string]: string };
    }
  }
  
  console.log("Processed files object:", files);
  
  // Create a stable key for Sandpack to prevent re-renders
  const sandpackKey = JSON.stringify(Object.keys(files || {})).substring(0, 20);
  
  // Create minimal sandpack files
  const sandpackFiles: { [key: string]: string } = {};
  
  // Default App component
  let appContent = `import React from 'react';

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          color: '#111827',
          marginBottom: '1rem'
        }}>
          Welcome to Your React App
        </h1>
        <p style={{ 
          fontSize: '1.125rem', 
          color: '#6b7280' 
        }}>
          Start building something amazing!
        </p>
      </div>
    </div>
  );
}

export default App;`;

  // Process fragment files if they exist
  console.log("Fragment files:", files);
  console.log("Files object keys:", Object.keys(files || {}));
  console.log("Files object length:", Object.keys(files || {}).length);
  
  if (files && Object.keys(files).length > 0) {
    // Look for App component in various locations and path formats
    const appFile = files["App.tsx"] || files["src/App.tsx"] || files["App.js"] || files["src/App.js"] ||
                   files["/src/App.tsx"] || files["/src/App.js"] || files["/App.tsx"] || files["/App.js"] ||
                   files["app.tsx"] || files["app.js"];
    
    console.log("Available files:", Object.keys(files));
    console.log("Found app file:", appFile);
    
    if (appFile && appFile.trim()) {
      appContent = appFile;
      
      // Ensure React import
      if (!appContent.includes('import React')) {
        appContent = `import React from 'react';\n\n${appContent}`;
      }
      
      // Ensure export
      if (!appContent.includes('export default')) {
        const componentMatch = appContent.match(/(?:function|const|class)\s+(\w+)/);
        if (componentMatch) {
          const componentName = componentMatch[1];
          appContent += `\n\nexport default ${componentName};`;
        } else {
          appContent += '\n\nexport default App;';
        }
      }
      
      console.log("Using AI-generated app content");
    } else {
      // If no main App file, try to use any React component
      const reactFiles = Object.entries(files).filter(([path, content]) => 
        content && (content.includes('function ') || content.includes('const ') || content.includes('class ')) &&
        (path.endsWith('.tsx') || path.endsWith('.jsx') || path.endsWith('.js'))
      );
      
      if (reactFiles.length > 0) {
        const [, componentContent] = reactFiles[0];
        appContent = componentContent;
        
        // Ensure React import
        if (!appContent.includes('import React')) {
          appContent = `import React from 'react';\n\n${appContent}`;
        }
        
        // Find component name and set as default export
        const componentMatch = appContent.match(/(?:function|const|class)\s+(\w+)/);
        if (componentMatch && !appContent.includes('export default')) {
          const componentName = componentMatch[1];
          appContent += `\n\nexport default ${componentName};`;
        }
        
        console.log("Using first React component found");
      } else {
        console.log("No React components found, using default");
      }
    }
  }

  // Set up minimal files
  sandpackFiles["/App.js"] = appContent;
  
  console.log("Final app content being used:", appContent);
  
  // TEMPORARY TEST: Force some content to see if Sandpack works
  if (appContent.includes("Welcome to Your React App")) {
    console.log("⚠️ USING DEFAULT CONTENT - AI files not detected!");
    console.log("Fragment object:", fragment);
    console.log("Files available:", files ? Object.keys(files) : "No files");
  } else {
    console.log("✅ USING AI-GENERATED CONTENT");
  }

  return (
    <div className="flex flex-col h-full w-full">
      <SandpackToolbar />
      
      <div className="flex-1">
        <SandpackProvider
          key={sandpackKey}
          template="vanilla"
          files={{
            "/index.html": `<!DOCTYPE html>
<html>
<head>
  <title>React App</title>
  <meta charset="UTF-8" />
</head>
<body>
  <div id="app"></div>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel">
    ${appContent.replace('export default App;', '')}
    
    const root = ReactDOM.createRoot(document.getElementById('app'));
    root.render(React.createElement(App));
  </script>
</body>
</html>`
                     }}
           theme="light"
        >
          <SandpackPreview 
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            style={{ height: "100%" }}
          />
        </SandpackProvider>
      </div>
    </div>
  );
};