"use client";

import { useMemo } from "react"
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
  
  // Process fragment files more efficiently
  const sandpackFiles = useMemo(() => {
    console.log("🔍 Processing fragment:", fragment?.id);
    console.log("🔍 Fragment files:", fragment?.files);
    
    let aiFiles: { [key: string]: { code: string } } = {};
    
    // Parse fragment files
    if (fragment?.files) {
      try {
        if (typeof fragment.files === 'string') {
          aiFiles = JSON.parse(fragment.files);
        } else {
          aiFiles = fragment.files as { [key: string]: { code: string } };
        }
      } catch (error) {
        console.error("Error parsing fragment files:", error);
        aiFiles = {};
      }
    }
    
    console.log("🔍 Parsed AI files:", Object.keys(aiFiles));
    
    // Convert AI files to Sandpack format
    const files: { [key: string]: string } = {
      // Essential React files
      "/src/index.js": `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`,
      
      "/public/index.html": `<!DOCTYPE html>
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
</html>`,
      
      "/src/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #1f2937;
}`,
      
      "/package.json": JSON.stringify({
        name: "react-app",
        version: "0.1.0",
        dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "lucide-react": "^0.469.0",
          "date-fns": "^4.1.0"
        }
      }, null, 2)
    };
    
    // Process AI-generated files
    if (Object.keys(aiFiles).length > 0) {
      Object.entries(aiFiles).forEach(([path, fileData]) => {
        try {
          let code = '';
          if (typeof fileData === 'string') {
            code = fileData;
          } else if (fileData && typeof fileData === 'object' && 'code' in fileData) {
            code = fileData.code;
          } else {
            code = String(fileData || '');
          }
          
          if (code.trim()) {
            // Clean up the path
            let cleanPath = path.startsWith('/') ? path : `/${path}`;
            
            // Place component files in src directory
            if (cleanPath.includes('components/') || (!cleanPath.includes('/src/') && cleanPath.endsWith('.js'))) {
              if (cleanPath === '/App.js' || cleanPath.includes('App.js')) {
                cleanPath = '/src/App.js';
              } else {
                const fileName = cleanPath.split('/').pop();
                cleanPath = `/src/${fileName}`;
              }
            }
            
            // Fix imports in the code
            code = code
              .replace(/from\s+['"]\.\/components\/([^'"]+)['"]/g, 'from "./$1"')
              .replace(/from\s+['"]\.\.\/components\/([^'"]+)['"]/g, 'from "./$1"')
              .replace(/from\s+['"]\.\/([^'"]+)['"]/g, 'from "./$1"');
            
            // Ensure React import
            if ((cleanPath.endsWith('.js') || cleanPath.endsWith('.jsx')) && 
                (code.includes('function ') || code.includes('const ')) &&
                !code.includes('import React')) {
              code = `import React from 'react';\n${code}`;
            }
            
            files[cleanPath] = code;
            console.log(`✅ Added file: ${cleanPath}`);
          }
        } catch (error) {
          console.error(`Error processing file ${path}:`, error);
        }
      });
    }
    
    // Ensure we have an App.js
    if (!files["/src/App.js"]) {
      files["/src/App.js"] = `import React from 'react';

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
    
    console.log("🔍 Final Sandpack files:", Object.keys(files));
    return files;
  }, [fragment]);

  if (!fragment) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No fragment available for preview.</p>
      </div>
    );
  }

  const sandpackKey = `sandpack-${fragment.id}-${Object.keys(sandpackFiles).length}`;
  
  return (
    <div className="flex flex-col h-full w-full">
      <SandpackToolbar />
      
      <div className="flex-1 min-h-0 h-full">
        <SandpackProvider
          key={sandpackKey}
          template="react"
          files={sandpackFiles}
          theme="light"
          customSetup={{
            dependencies: {
              "react": "^18.2.0",
              "react-dom": "^18.2.0",
              "lucide-react": "^0.469.0",
              "date-fns": "^4.1.0",
              "react-chartjs-2": "^5.3.0",
              "chart.js": "^4.4.7"
            }
          }}
          options={{
            visibleFiles: ["/src/App.js"],
            activeFile: "/src/App.js"
          }}
          style={{ height: "100%" }}
        >
          <SandpackPreview 
            showOpenInCodeSandbox={false}
            showRefreshButton={true}
            showNavigator={true}
            style={{ height: "100%" }}
          />
        </SandpackProvider>
      </div>
    </div>
  );
};