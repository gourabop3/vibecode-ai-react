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
  
  console.log("🔍 SANDPACK COMPONENT RENDERED");
  console.log("Raw fragment object:", fragment);
  console.log("Fragment ID:", fragment.id);
  console.log("Fragment title:", fragment.title);
  console.log("Raw fragment.files:", fragment.files);
  console.log("Type of fragment.files:", typeof fragment.files);
  console.log("Fragment.files is null/undefined:", fragment.files == null);
  
  // Handle different possible data formats - create a completely new object to avoid readonly issues
  if (fragment.files) {
    console.log("✅ Fragment has files");
    if (typeof fragment.files === 'string') {
      console.log("📄 Files are stored as string, parsing...");
      try {
        const parsed = JSON.parse(fragment.files);
        // Deep clone to ensure no readonly issues
        files = JSON.parse(JSON.stringify(parsed));
      } catch (e) {
        console.error("❌ Failed to parse fragment.files as JSON:", e);
        files = {};
      }
    } else if (typeof fragment.files === 'object' && fragment.files !== null) {
      console.log("📦 Files are stored as object, creating deep copy...");
      // Deep clone to ensure complete separation from readonly source
      files = JSON.parse(JSON.stringify(fragment.files));
    } else {
      console.log("❓ Unknown fragment.files format:", typeof fragment.files);
      files = {};
    }
  } else {
    console.log("❌ Fragment has no files property");
    files = {};
  }
  
  console.log("Processed files object:", files);
  
  // Create a stable key for Sandpack to prevent re-renders and readonly issues
  const sandpackKey = `sandpack-${String(fragment.id || 'default')}-${Object.keys(files || {}).length}-${Date.now()}`;
  
  // Create minimal sandpack files
  const sandpackFiles: { [key: string]: string } = {};
  
  // Default App component - create new string to avoid any readonly issues
  let appContent = String(`import React from 'react';

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

export default App;`);

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
    
    if (appFile && String(appFile).trim()) {
      // Ensure we're working with a string copy to avoid readonly issues
      appContent = String(appFile);
      
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
      
      console.log("✅ Using AI-generated app content");
    } else {
      console.log("❌ No main App file found, searching for other React components...");
      // If no main App file, try to use any React component
      const reactFiles = Object.entries(files).filter(([path, content]) => 
        content && (content.includes('function ') || content.includes('const ') || content.includes('class ')) &&
        (path.endsWith('.tsx') || path.endsWith('.jsx') || path.endsWith('.js'))
      );
      
      console.log("Found React files:", reactFiles.map(([path]) => path));
      
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

  // Process all AI-generated files for React template
  try {
    Object.entries(files || {}).forEach(([path, content]) => {
      // Create completely new variables to avoid any readonly references
      const filePath = String(path);
      const fileContent = String(content || '');
      
      // Convert path format for Sandpack
      let sandpackPath = filePath;
      if (sandpackPath.endsWith('.tsx') || sandpackPath.endsWith('.ts')) {
        sandpackPath = sandpackPath.replace(/\.tsx?$/, '.js');
      }
      if (!sandpackPath.startsWith('/')) {
        sandpackPath = `/${sandpackPath}`;
      }
      
             // Directly assign to avoid readonly issues
       sandpackFiles[sandpackPath] = fileContent;
    });
  } catch (error) {
    console.error("Error processing AI files:", error);
  }

  // Ensure main App.js exists
  if (!sandpackFiles["/src/App.js"]) {
    sandpackFiles["/src/App.js"] = String(appContent);
  }

  // Add COMPLETE React project files
  try {
    // package.json with full React setup
    const packageJson = {
      name: "react-app",
      version: "0.1.0",
      private: true,
      dependencies: {
        react: "^18.0.0",
        "react-dom": "^18.0.0",
        "react-scripts": "5.0.1",
        uuid: "^9.0.0",
        clsx: "^2.0.0",
        "date-fns": "^2.30.0"
      },
      scripts: {
        start: "react-scripts start",
        build: "react-scripts build",
        test: "react-scripts test",
        eject: "react-scripts eject"
      },
      eslintConfig: {
        extends: ["react-app", "react-app/jest"]
      },
      browserslist: {
        production: [">0.2%", "not dead", "not op_mini all"],
        development: ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
      }
    };

    // index.js - main entry point
    const indexJs = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

    // index.css with Tailwind imports
    const indexCss = `@tailwind base;
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
}

* {
  box-sizing: border-box;
}`;

    // public/index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="React app created with AI" />
    <title>React App</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;

    // tailwind.config.js
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  darkMode: 'class',
}`;

    // .gitignore
    const gitignore = `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*`;

    // README.md
    const readme = `# React App

This project was created with AI and uses React 18 with Tailwind CSS.

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### \`npm run build\`

Builds the app for production to the \`build\` folder.

### \`npm test\`

Launches the test runner in interactive watch mode.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).`;

    // Create all React project files
    sandpackFiles["/package.json"] = JSON.stringify(packageJson, null, 2);
    sandpackFiles["/src/index.js"] = indexJs;
    sandpackFiles["/src/index.css"] = indexCss;
    sandpackFiles["/public/index.html"] = indexHtml;
    sandpackFiles["/tailwind.config.js"] = tailwindConfig;
    sandpackFiles["/.gitignore"] = gitignore;
    sandpackFiles["/README.md"] = readme;
    
  } catch (error) {
    console.error("Error creating React files:", error);
  }
  
     console.log("Final sandpack files:", Object.keys(sandpackFiles));
   console.log("Converted App.js content:", sandpackFiles["/src/App.js"]?.substring(0, 500) + "...");
  
  // TEMPORARY TEST: Force some content to see if Sandpack works
  if (appContent.includes("Welcome to Your React App")) {
    console.log("⚠️ USING DEFAULT CONTENT - AI files not detected!");
    console.log("Fragment object:", fragment);
    console.log("Files available:", files ? Object.keys(files) : "No files");
  } else {
    console.log("✅ USING AI-GENERATED CONTENT");
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      <SandpackToolbar />
      
      <div className="flex-1 min-h-0">
        <SandpackProvider
          key={sandpackKey}
          template="react"
          files={sandpackFiles}
          theme="light"
        >
          <SandpackPreview 
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
          />
        </SandpackProvider>
      </div>
    </div>
  );
};