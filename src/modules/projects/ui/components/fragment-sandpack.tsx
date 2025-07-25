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
  
  // Convert fragment files to Sandpack format
  const files = fragment.files as { [path: string]: string };
  
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
  if (files && Object.keys(files).length > 0) {
    // Look for App component in various locations
    const appFile = files["App.tsx"] || files["src/App.tsx"] || files["App.js"] || files["src/App.js"];
    
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
    }
  }

  // Set up minimal files
  sandpackFiles["/App.js"] = appContent;

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