"use client";

import { useState } from "react"
import { Fragment } from "@/generated/prisma"
import { Button } from "@/components/ui/button"
import { RefreshCcwIcon, CodeIcon, EyeIcon, ExternalLinkIcon } from "lucide-react"
import { Hint } from "@/components/hint"
import { 
  SandpackProvider, 
  SandpackPreview, 
  SandpackLayout,
  SandpackCodeEditor,
  SandpackFileExplorer,
  SandpackConsole,
  useSandpack
} from "@codesandbox/sandpack-react"
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

interface Props {
  fragment: Fragment
}

const SandpackToolbar = () => {
  const { sandpack } = useSandpack();
  
  const handleRefresh = () => {
    sandpack.resetAllModules();
  };

  const handleOpenInNewWindow = () => {
    // Open preview in new window
    if (sandpack.iframe && sandpack.iframe.contentWindow) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(sandpack.iframe.contentDocument?.documentElement.outerHTML || '');
        newWindow.document.close();
      }
    }
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
      <Hint content="Open in new tab" align="start">
        <Button
          size="sm"
          variant="outline"
          onClick={handleOpenInNewWindow}
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
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "console">("preview");
  
  // Convert fragment files to Sandpack format
  const files = fragment.files as { [path: string]: string };
  
  // Process files to match React app structure
  const sandpackFiles: { [key: string]: string } = {};
  
  // Set up the basic React app structure
  sandpackFiles["/package.json"] = JSON.stringify({
    name: "react-app",
    version: "0.1.0",
    private: true,
    dependencies: {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "react-scripts": "5.0.1",
      "typescript": "^4.4.2",
      "tailwindcss": "^3.3.0",
      "autoprefixer": "^10.4.14",
      "postcss": "^8.4.24",
      "@tailwindcss/forms": "^0.5.3",
      "@tailwindcss/typography": "^0.5.9",
      "lucide-react": "^0.263.1",
      "class-variance-authority": "^0.7.0",
      "clsx": "^1.2.1",
      "tailwind-merge": "^1.13.2"
    },
    scripts: {
      start: "react-scripts start",
      build: "react-scripts build",
      test: "react-scripts test",
      eject: "react-scripts eject"
    },
    browserslist: {
      production: [">0.2%", "not dead", "not op_mini all"],
      development: ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
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

  // Add index.tsx
  sandpackFiles["/src/index.tsx"] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

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

  // Process the fragment files
  Object.entries(files).forEach(([path, content]) => {
    // Convert paths to match React structure
    let sandpackPath = path;
    
    // If path doesn't start with src/, add it
    if (!path.startsWith('src/') && !path.startsWith('/')) {
      sandpackPath = `/src/${path}`;
    } else if (path.startsWith('src/')) {
      sandpackPath = `/${path}`;
    }
    
    sandpackFiles[sandpackPath] = content;
  });

  // Ensure App.tsx exists
  if (!sandpackFiles["/src/App.tsx"]) {
    sandpackFiles["/src/App.tsx"] = `import React from 'react';

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

  return (
    <div className="flex flex-col h-full w-full">
      <SandpackProvider
        template="react-ts"
        files={sandpackFiles}
        theme="light"
        options={{
          showNavigator: false,
          showTabs: false,
          showLineNumbers: true,
          showInlineErrors: true,
          wrapContent: true,
          editorHeight: "100%",
          editorWidthPercentage: 50,
        }}
      >
        <SandpackToolbar />
        
        <Tabs
          className="h-full flex flex-col"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "preview" | "code" | "console")}
        >
          <div className="px-2 py-1 border-b">
            <TabsList className="h-8 p-0 border rounded-md">
              <TabsTrigger value="preview" className="rounded-md px-3 py-1">
                <EyeIcon className="w-4 h-4 mr-1" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="rounded-md px-3 py-1">
                <CodeIcon className="w-4 h-4 mr-1" />
                Code
              </TabsTrigger>
              <TabsTrigger value="console" className="rounded-md px-3 py-1">
                Console
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="preview" className="flex-1 m-0">
            <SandpackPreview 
              showOpenInCodeSandbox={false}
              showRefreshButton={false}
              style={{ height: "100%" }}
            />
          </TabsContent>
          
          <TabsContent value="code" className="flex-1 m-0">
            <SandpackLayout style={{ height: "100%" }}>
              <SandpackFileExplorer />
              <SandpackCodeEditor 
                showTabs={true}
                showLineNumbers={true}
                showInlineErrors={true}
                wrapContent={true}
              />
            </SandpackLayout>
          </TabsContent>
          
          <TabsContent value="console" className="flex-1 m-0">
            <SandpackConsole style={{ height: "100%" }} />
          </TabsContent>
        </Tabs>
      </SandpackProvider>
    </div>
  );
};