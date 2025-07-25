"use client";

import { useState } from "react"
import { Fragment } from "@/generated/prisma"
import { Button } from "@/components/ui/button"
import { RefreshCcwIcon, ExternalLinkIcon } from "lucide-react"
import { Hint } from "@/components/hint"
import { 
  SandpackProvider, 
  SandpackPreview, 
  useSandpack
} from "@codesandbox/sandpack-react"


interface Props {
  fragment: Fragment
}

const SandpackToolbar = () => {
  const { sandpack } = useSandpack();
  
  const handleRefresh = () => {
    sandpack.resetAllFiles();
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
      <Hint content="Open in CodeSandbox" align="start">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // This will be handled by Sandpack's built-in functionality
            const event = new CustomEvent('sandpack-open-in-codesandbox');
            window.dispatchEvent(event);
          }}
        >
          <ExternalLinkIcon className="w-4 h-4" />
        </Button>
      </Hint>
    </div>
  );
};

export const FragmentSandpack = ({
  fragment
}: Props) => {
  
  // Convert fragment files to Sandpack format
  const files = fragment.files as { [path: string]: string };
  
  // Process files to match React app structure
  const sandpackFiles: { [key: string]: string } = {};
  
  // Keep the package.json minimal for Sandpack
  sandpackFiles["/package.json"] = JSON.stringify({
    dependencies: {
      "react": "^18.0.0",
      "react-dom": "^18.0.0"
    }
  }, null, 2);

  // Add index.html
  sandpackFiles["/public/index.html"] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="React app created with AI" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;

  // Add simple index.js
  sandpackFiles["/src/index.js"] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`;

  // Add index.css with Tailwind
  sandpackFiles["/src/index.css"] = `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`;

  // Add Tailwind config
  sandpackFiles["/tailwind.config.js"] = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}`;

  // Always ensure we have the base React app structure first
  // Then add/override with fragment files
  
  // Process the fragment files
  if (files && Object.keys(files).length > 0) {
    Object.entries(files).forEach(([path, content]) => {
      // Convert paths to match React structure
      let sandpackPath = path;
      
      // If path doesn't start with src/, add it
      if (!path.startsWith('src/') && !path.startsWith('/')) {
        sandpackPath = `/src/${path}`;
      } else if (path.startsWith('src/')) {
        sandpackPath = `/${path}`;
      }
      
      // Only add valid React files
      if (content && content.trim()) {
        sandpackFiles[sandpackPath] = content;
      }
    });
  }

  // Always ensure App.js exists with valid content (using .js for better compatibility)
  const defaultAppContent = `import React from 'react';

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

  // Validate and fix App.js content (using .js for better compatibility)
  let appContent = sandpackFiles["/src/App.js"] || files["src/App.tsx"] || files["App.tsx"];
  
  if (!appContent || !appContent.trim()) {
    appContent = defaultAppContent;
  } else {
    // Fix common import/export issues
    if (!appContent.includes('import React')) {
      appContent = `import React from 'react';\n\n${appContent}`;
    }
    
    // Ensure proper export
    if (!appContent.includes('export default')) {
      // Try to find the main component and add export
      const componentMatch = appContent.match(/(?:function|const|class)\s+(\w+)/);
      if (componentMatch) {
        const componentName = componentMatch[1];
        if (!appContent.includes(`export default ${componentName}`)) {
          appContent += `\n\nexport default ${componentName};`;
        }
      } else {
        // Fallback to default app
        appContent = defaultAppContent;
      }
    }
    
    // Clean up any conflicting exports
    appContent = appContent.replace(/export default function App\(\)/g, 'function App()');
    if (!appContent.includes('export default App') && appContent.includes('function App')) {
      appContent += '\n\nexport default App;';
    }
  }
  
  sandpackFiles["/src/App.js"] = appContent;

  // Debug logging
  console.log("Sandpack files:", Object.keys(sandpackFiles));
  console.log("App.js content:", sandpackFiles["/src/App.js"]);

  return (
    <div className="flex flex-col h-full w-full">
      <SandpackProvider
        template="react"
        files={sandpackFiles}
        theme="light"
        options={{
          showNavigator: false,
          showTabs: false,
          showLineNumbers: false,
          closableTabs: false,
          editorWidthPercentage: 0,
          editorHeight: 400
        }}
      >
        <SandpackToolbar />
        
        <div className="flex-1">
          <SandpackPreview 
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            style={{ height: "100%" }}
          />
        </div>
      </SandpackProvider>
    </div>
  );
};