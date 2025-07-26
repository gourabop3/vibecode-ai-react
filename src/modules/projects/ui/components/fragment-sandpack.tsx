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
    <script>
      tailwind.config = {
        theme: {
          extend: {}
        }
      }
    </script>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html, body {
        height: 100%;
        width: 100%;
        overflow-x: hidden;
      }
      #root {
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      
             "/src/index.css": `/* Import Tailwind CSS */
@import 'https://cdn.tailwindcss.com/3.4.1';

/* Reset and base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background-color: #ffffff;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}

/* Ensure Tailwind classes work */
.min-h-screen { min-height: 100vh; }
.bg-gray-50 { background-color: #f9fafb; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-blue-500 { background-color: #3b82f6; }
.text-white { color: #ffffff; }
.text-gray-900 { color: #111827; }
.text-gray-600 { color: #4b5563; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.text-center { text-align: center; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.font-bold { font-weight: 700; }
.mb-4 { margin-bottom: 1rem; }
.p-4 { padding: 1rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.rounded-lg { border-radius: 0.5rem; }
.border { border-width: 1px; }
.border-gray-300 { border-color: #d1d5db; }
.cursor-pointer { cursor: pointer; }
.hover\\:bg-blue-700:hover { background-color: #1d4ed8; }
.hover\\:bg-gray-50:hover { background-color: #f9fafb; }
.transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }`,
      
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
             // Clean up the path - remove leading slash if present
             let cleanPath = path.startsWith('/') ? path.substring(1) : path;
             
             // Handle different path formats properly
             if (cleanPath === 'App.js' || cleanPath === 'src/App.js') {
               cleanPath = '/src/App.js';
             } else if (cleanPath.startsWith('components/')) {
               // Handle components in subdirectory: components/TodoList.js -> /src/TodoList.js
               const fileName = cleanPath.split('/').pop();
               cleanPath = `/src/${fileName}`;
             } else if (cleanPath.includes('/components/')) {
               // Handle nested components: some/path/components/TodoList.js -> /src/TodoList.js
               const fileName = cleanPath.split('/').pop();
               cleanPath = `/src/${fileName}`;
             } else if (!cleanPath.startsWith('src/') && 
                       !cleanPath.startsWith('public/') && 
                       !['package.json', 'tailwind.config.js', 'README.md'].includes(cleanPath)) {
               // All other JS files go in src/
               cleanPath = `/src/${cleanPath}`;
             } else {
               // Already properly formatted or config file
               cleanPath = `/${cleanPath}`;
             }
             
             // Fix imports in the code to work with flat src/ structure
             code = code
               // Fix relative component imports
               .replace(/from\s+['"]\.\/components\/([^'"]+)['"]/g, 'from "./$1"')
               .replace(/from\s+['"]\.\.\/components\/([^'"]+)['"]/g, 'from "./$1"')
               .replace(/from\s+['"]components\/([^'"]+)['"]/g, 'from "./$1"')
               // Fix other relative imports
               .replace(/from\s+['"]\.\/([^'"]+)['"]/g, 'from "./$1"')
               .replace(/from\s+['"]\.\.\/([^'"]+)['"]/g, 'from "./$1"');
             
             // Ensure React import for component files
             if ((cleanPath.endsWith('.js') || cleanPath.endsWith('.jsx')) && 
                 (code.includes('function ') || code.includes('const ')) &&
                 !code.includes('import React')) {
               code = `import React from 'react';\n${code}`;
             }
             
             files[cleanPath] = code;
             console.log(`✅ Added file: ${cleanPath} (from original: ${path})`);
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your React App
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Start building something amazing!
          </p>
          <div className="flex gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Get Started
            </button>
            <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
              Learn More
            </button>
          </div>
        </div>
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
    <div className="flex flex-col h-full w-full overflow-hidden">
      <SandpackToolbar />
      
      <div className="flex-1 min-h-0 overflow-hidden relative">
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
          style={{ height: "100%", width: "100%" }}
        >
          <SandpackPreview 
            showOpenInCodeSandbox={false}
            showRefreshButton={true}
            showNavigator={true}
            className="sandpack-preview"
            style={{ 
              height: "100%", 
              width: "100%",
              display: "flex",
              flexDirection: "column",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0
            }}
          />
        </SandpackProvider>
      </div>
    </div>
  );
};