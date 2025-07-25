"use client";

import { useState, useMemo } from "react"
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
  
  // Completely isolate and clone all fragment data to prevent readonly issues
  const safeFragment = useMemo(() => {
    try {
      // Ensure fragment exists before cloning
      if (!fragment) {
        return { id: 'default', files: {} };
      }
      // Deep clone the entire fragment to break any readonly references
      return JSON.parse(JSON.stringify(fragment));
    } catch (error) {
      console.error("Error cloning fragment:", error);
      return { id: 'default', files: {} };
    }
  }, [fragment]);
  
  // Convert fragment files to Sandpack format - handle different data structures
  const files: { [path: string]: string } = useMemo(() => {
    console.log("🔍 SANDPACK COMPONENT RENDERED");
    console.log("Safe fragment object:", safeFragment);
    console.log("Fragment ID:", safeFragment.id);
    console.log("Fragment title:", safeFragment.title);
    console.log("Raw fragment.files:", safeFragment.files);
    console.log("Type of fragment.files:", typeof safeFragment.files);
    console.log("Fragment.files is null/undefined:", safeFragment.files == null);
    
    let processedFiles: { [path: string]: string } = {};
    
    // Handle different possible data formats
    if (safeFragment.files) {
      console.log("✅ Fragment has files");
      if (typeof safeFragment.files === 'string') {
        console.log("📄 Files are stored as string, parsing...");
        try {
          const parsed = JSON.parse(safeFragment.files);
          // Filter out any null/undefined keys from parsed object
          if (parsed && typeof parsed === 'object') {
            processedFiles = {};
            Object.entries(parsed).forEach(([key, value]) => {
              if (key && key !== null && key !== undefined && String(key).trim()) {
                processedFiles[String(key).trim()] = String(value || '');
              } else {
                console.warn("Skipping invalid key in parsed files:", { key, value });
              }
            });
          } else {
            processedFiles = {};
          }
        } catch (e) {
          console.error("❌ Failed to parse fragment.files as JSON:", e);
          processedFiles = {};
        }
      } else if (typeof safeFragment.files === 'object' && safeFragment.files !== null) {
        console.log("📦 Files are stored as object, creating copy...");
        // Filter out any null/undefined keys from object
        processedFiles = {};
        Object.entries(safeFragment.files).forEach(([key, value]) => {
          if (key && key !== null && key !== undefined && String(key).trim()) {
            processedFiles[String(key).trim()] = String(value || '');
          } else {
            console.warn("Skipping invalid key in files object:", { key, value });
          }
        });
      } else {
        console.log("❓ Unknown fragment.files format:", typeof safeFragment.files);
        processedFiles = {};
      }
    } else {
      console.log("❌ Fragment has no files property");
      processedFiles = {};
    }
    
    return processedFiles;
  }, [safeFragment]);
  
  console.log("Processed files object:", files);
  
  // Create a stable key for Sandpack to prevent re-renders and readonly issues
  const sandpackKey = `sandpack-${String(safeFragment.id || 'default')}-${Object.keys(files || {}).length}`;
  
  // Create minimal sandpack files using useMemo to prevent recreating objects
  const sandpackFiles: { [key: string]: string } = useMemo(() => {
    const newSandpackFiles: { [key: string]: string } = {};
  
  // Default App component with Tailwind CSS classes
  let appContent = String(`import React from 'react';

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="text-center px-4">
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
      // Robust validation - ensure path is not null/undefined
      if (!path || path === null || path === undefined) {
        console.warn("Skipping file with null/undefined path:", { path, content });
        return;
      }
      
      // Create completely new variables to avoid any readonly references
      const filePath = String(path).trim();
      const fileContent = String(content || '');
      
      // Skip if path is empty after trimming
      if (!filePath) {
        console.warn("Skipping file with empty path:", { originalPath: path, content });
        return;
      }
      
      // Convert path format for Sandpack
      let sandpackPath = filePath;
      if (sandpackPath.endsWith('.tsx') || sandpackPath.endsWith('.ts')) {
        sandpackPath = sandpackPath.replace(/\.tsx?$/, '.js');
      }
      if (!sandpackPath.startsWith('/')) {
        sandpackPath = `/${sandpackPath}`;
      }
      
      // Final validation before assignment
      if (sandpackPath && sandpackPath.trim()) {
        newSandpackFiles[sandpackPath] = fileContent;
      } else {
        console.warn("Skipping file with invalid sandpack path:", { originalPath: path, sandpackPath });
      }
    });
  } catch (error) {
    console.error("Error processing AI files:", error);
  }

  // Ensure main App.js exists
  if (!newSandpackFiles["/src/App.js"]) {
    newSandpackFiles["/src/App.js"] = String(appContent);
  }

  // Add COMPLETE React project files
  try {
    // package.json with full React setup including Tailwind CSS
    const packageJson = {
      name: "react-app",
      version: "0.1.0",
      private: true,
      dependencies: {
        react: "^18.0.0",
        "react-dom": "^18.0.0",
        "react-scripts": "5.0.1",
        tailwindcss: "^3.3.0",
        autoprefixer: "^10.4.14",
        postcss: "^8.4.24",
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

    // index.css - Exactly like Bolt.new clones
    const indexCss = `@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* Base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
}

#root {
  min-height: 100vh;}`;

        // public/index.html - Clean like Bolt clones
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Web site created using create-react-app" />
    <title>React App</title>
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
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}`;

    // postcss.config.js
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
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
    newSandpackFiles["/package.json"] = JSON.stringify(packageJson, null, 2);
    newSandpackFiles["/src/index.js"] = indexJs;
    newSandpackFiles["/src/index.css"] = indexCss;
    newSandpackFiles["/public/index.html"] = indexHtml;
    newSandpackFiles["/tailwind.config.js"] = tailwindConfig;
    newSandpackFiles["/postcss.config.js"] = postcssConfig;

    newSandpackFiles["/.gitignore"] = gitignore;
    newSandpackFiles["/README.md"] = readme;
    
  } catch (error) {
    console.error("Error creating React files:", error);
  }
  
     console.log("Final sandpack files:", Object.keys(newSandpackFiles));
   console.log("Converted App.js content:", newSandpackFiles["/src/App.js"]?.substring(0, 500) + "...");
   console.log("Index.js content:", newSandpackFiles["/src/index.js"]);
   console.log("Package.json content:", newSandpackFiles["/package.json"]);
  
  // TEMPORARY TEST: Force some content to see if Sandpack works
  if (appContent.includes("Welcome to Your React App")) {
    console.log("⚠️ USING DEFAULT CONTENT - AI files not detected!");
    console.log("Fragment object:", safeFragment);
    console.log("Files available:", files ? Object.keys(files) : "No files");
  } else {
    console.log("✅ USING AI-GENERATED CONTENT");
  }
  
  return newSandpackFiles;
  }, [files, safeFragment]);

  // Final validation of sandpack files before rendering
  const validatedSandpackFiles = useMemo(() => {
    const validated: { [key: string]: string } = {};
    
    Object.entries(sandpackFiles || {}).forEach(([path, content]) => {
      // Ensure path is valid
      if (path && typeof path === 'string' && path.trim()) {
        const cleanPath = path.trim();
        const cleanContent = typeof content === 'string' ? content : String(content || '');
        validated[cleanPath] = cleanContent;
      } else {
        console.warn("Skipping invalid path in sandpack files:", { path, content: typeof content });
      }
    });
    
    return validated;
  }, [sandpackFiles]);

  // Validation check after all hooks - ensure fragment exists
  if (!fragment) {
    console.error("FragmentSandpack: No fragment provided");
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No fragment available for preview.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <SandpackToolbar />
      
      <div className="flex-1 min-h-0 h-full">
        <SandpackProvider
          key={sandpackKey}
          template="react"
          files={validatedSandpackFiles}
          theme="light"
          options={{
            visibleFiles: ["/src/App.js", "/src/index.js"],
            activeFile: "/src/App.js"
          }}
          style={{ height: "100%" }}
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