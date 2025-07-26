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
    
    console.log("📊 PROCESSED FILES:", processedFiles);
    console.log("📊 PROCESSED FILES KEYS:", Object.keys(processedFiles));
    return processedFiles;
  }, [safeFragment]);
  
  console.log("Processed files object:", files);
  
  // Create a stable key for Sandpack to prevent re-renders and readonly issues  
  const contentHash = Object.values(files || {}).join('').length;
  const sandpackKey = `sandpack-${String(safeFragment.id || 'default')}-${Object.keys(files || {}).length}-${contentHash}`;
  
  // Create minimal sandpack files using useMemo to prevent recreating objects
  const sandpackFiles: { [key: string]: string } = useMemo(() => {
    const newSandpackFiles: { [key: string]: string } = {};
  
  // Start with default, but will be replaced if AI content exists
  let appContent = '';
  let hasAIGeneratedContent = false;

  // Process fragment files if they exist
  console.log("🔍 Processing fragment files:", files);
  console.log("🔍 Files object keys:", Object.keys(files || {}));
  console.log("🔍 Files object length:", Object.keys(files || {}).length);
  
  if (files && Object.keys(files).length > 0) {
    hasAIGeneratedContent = true;
    
    // Look for App component in various locations and path formats
    const appFile = files["App.tsx"] || files["src/App.tsx"] || files["App.js"] || files["src/App.js"] ||
                   files["/src/App.tsx"] || files["/src/App.js"] || files["/App.tsx"] || files["/App.js"] ||
                   files["app.tsx"] || files["app.js"];
    
    console.log("🔍 Available files:", Object.keys(files));
    console.log("🔍 Found app file:", !!appFile);
    console.log("🔍 App file content preview:", appFile ? String(appFile).substring(0, 200) + "..." : "None");
    
    if (appFile && String(appFile).trim()) {
      // Use AI-generated app content
      appContent = String(appFile).trim();
      
      // Fix relative component imports to work in Sandpack (all components in /src/)
      appContent = appContent
        .replace(/from\s+['"`]\.\/components\/(\w+)['"`]/g, 'from "./$1"')
        .replace(/from\s+['"`]\.\/(\w+)['"`]/g, 'from "./$1"')
        .replace(/from\s+['"`]\.\.\/components\/(\w+)['"`]/g, 'from "./$1"')
        .replace(/from\s+['"`]\.\.\/(\w+)['"`]/g, 'from "./$1"')
        // Remove empty lines left by modifications
        .replace(/^\s*$/gm, '')
        .replace(/\n\n+/g, '\n\n');
      
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
      
      console.log("✅ Using AI-generated App component (processed for Sandpack compatibility)");
    } else {
      console.log("🔍 No main App file found, searching for other React components...");
      // If no main App file, try to use any React component
      const reactFiles = Object.entries(files).filter(([path, content]) => 
        content && (content.includes('function ') || content.includes('const ') || content.includes('class ')) &&
        (path.endsWith('.tsx') || path.endsWith('.jsx') || path.endsWith('.js'))
      );
      
      console.log("🔍 Found React files:", reactFiles.map(([path]) => path));
      
      if (reactFiles.length > 0) {
        const [, componentContent] = reactFiles[0];
        appContent = String(componentContent).trim();
        
        // Fix relative component imports to work in Sandpack (all components in /src/)
        appContent = appContent
          .replace(/from\s+['"`]\.\/components\/(\w+)['"`]/g, 'from "./$1"')
          .replace(/from\s+['"`]\.\/(\w+)['"`]/g, 'from "./$1"')
          .replace(/from\s+['"`]\.\.\/components\/(\w+)['"`]/g, 'from "./$1"')
          .replace(/from\s+['"`]\.\.\/(\w+)['"`]/g, 'from "./$1"')
          // Remove empty lines left by modifications
          .replace(/^\s*$/gm, '')
          .replace(/\n\n+/g, '\n\n');
        
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
        
        console.log("✅ Using first React component found as App (processed for Sandpack)");
      } else {
        console.log("❌ No React components found in AI files");
        hasAIGeneratedContent = false;
      }
    }
  }

  // Only use default if no AI content was found
  if (!hasAIGeneratedContent || !appContent.trim()) {
    console.log("⚠️ Using default app content - no AI generated content detected");
    appContent = `import React from 'react';

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

export default App;`;
  } else {
    console.log("🎉 Successfully found AI-generated content!");
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
      let fileContent = String(content || '');
      
      // Skip if path is empty after trimming
      if (!filePath) {
        console.warn("Skipping file with empty path:", { originalPath: path, content });
        return;
      }
      
      // Fix import paths for Sandpack compatibility
      if (filePath.endsWith('.js') || filePath.endsWith('.jsx') || filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        fileContent = fileContent
          // Fix relative component imports to work in Sandpack (all components in /src/)
          .replace(/from\s+['"`]\.\/components\/(\w+)['"`]/g, 'from "./$1"')
          .replace(/from\s+['"`]\.\/(\w+)['"`]/g, 'from "./$1"')
          .replace(/from\s+['"`]\.\.\/components\/(\w+)['"`]/g, 'from "./$1"')
          .replace(/from\s+['"`]\.\.\/(\w+)['"`]/g, 'from "./$1"')
          // Fix other common relative imports
          .replace(/from\s+['"`]\.\/utils\/(\w+)['"`]/g, 'from "./$1"')
          .replace(/from\s+['"`]\.\/hooks\/(\w+)['"`]/g, 'from "./$1"')
          // Remove empty lines left by removed imports
          .replace(/^\s*$/gm, '')
          .replace(/\n\n+/g, '\n\n');
      }
      
      // Convert path format for Sandpack with proper directory structure
      let sandpackPath = filePath;
      if (sandpackPath.endsWith('.tsx') || sandpackPath.endsWith('.ts')) {
        sandpackPath = sandpackPath.replace(/\.tsx?$/, '.js');
      }
      
      // Simplify path structure - place all component files in /src/ directory
      if (!sandpackPath.startsWith('/')) {
        sandpackPath = `/src/${sandpackPath}`;
      }
      
      // Clean up any nested component paths
      if (sandpackPath.includes('component')) {
        sandpackPath = sandpackPath.replace(/.*components?\//, '/src/');
      }
      
      // Ensure React import for all component files
      if ((sandpackPath.endsWith('.js') || sandpackPath.endsWith('.jsx')) && 
          fileContent.includes('function ') || fileContent.includes('const ') || fileContent.includes('export')) {
        if (!fileContent.includes('import React')) {
          fileContent = `import React from 'react';\n\n${fileContent}`;
        }
        
        // Ensure proper export for component files
        if (!fileContent.includes('export default') && !fileContent.includes('export {')) {
          const componentMatch = fileContent.match(/(?:function|const)\s+(\w+)/);
          if (componentMatch) {
            const componentName = componentMatch[1];
            fileContent += `\n\nexport default ${componentName};`;
          }
        }
      }
      
      // Final validation before assignment
      if (sandpackPath && sandpackPath.trim()) {
        newSandpackFiles[sandpackPath] = fileContent;
        console.log(`📁 Added file: ${sandpackPath}`);
        console.log(`📄 Content preview: ${fileContent.substring(0, 150)}...`);
      } else {
        console.warn("Skipping file with invalid sandpack path:", { originalPath: path, sandpackPath });
      }
    });
  } catch (error) {
    console.error("Error processing AI files:", error);
  }

  // Ensure main App.js exists and always use our processed appContent
  newSandpackFiles["/src/App.js"] = String(appContent);
  console.log("📝 Setting App.js content:", String(appContent).substring(0, 200) + "...");

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
        "react-scripts": "5.0.1"
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
  
     console.log("📋 Final sandpack files:", Object.keys(newSandpackFiles));
   console.log("📋 Component files found:", Object.keys(newSandpackFiles).filter(path => path.includes('components')));
   console.log("🔍 App.js content preview:", newSandpackFiles["/src/App.js"]?.substring(0, 500) + "...");
   
   // Log all component files for debugging
   Object.keys(newSandpackFiles).forEach(path => {
     if (path.includes('components') || path === '/src/App.js') {
       console.log(`📄 File: ${path}`);
       console.log(`📄 Content preview: ${newSandpackFiles[path]?.substring(0, 200)}...`);
     }
   });
  
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
    console.log("🔍 FINAL VALIDATION - sandpackFiles:", sandpackFiles);
    console.log("🔍 FINAL VALIDATION - sandpackFiles keys:", Object.keys(sandpackFiles || {}));
    
    // Start with guaranteed minimal valid files
    const validated: { [key: string]: string } = {
      "/src/App.js": `import React from 'react';

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

export default App;`,
      "/src/index.js": `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      "/src/index.css": `@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
}`,
      "/public/index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
      "/package.json": JSON.stringify({
        name: "react-app",
        version: "0.1.0",
        private: true,
        dependencies: {
          react: "^18.0.0",
          "react-dom": "^18.0.0",
          "react-scripts": "5.0.1",
          tailwindcss: "^3.3.0",
          autoprefixer: "^10.4.14",
          postcss: "^8.4.24"
        },
        scripts: {
          start: "react-scripts start",
          build: "react-scripts build",
          test: "react-scripts test"
        }
      }, null, 2)
    };
    
    // Add AI-generated files only if they have valid paths
    Object.entries(sandpackFiles || {}).forEach(([path, content]) => {
      console.log("🔍 VALIDATING PATH:", { path, pathType: typeof path, pathValue: JSON.stringify(path) });
      console.log("🔍 VALIDATING CONTENT:", { contentType: typeof content, contentLength: String(content || '').length });
      
      // Ensure path is valid and not one of our defaults
      if (path && typeof path === 'string' && path.trim()) {
        const cleanPath = path.trim();
        const cleanContent = typeof content === 'string' ? content : String(content || '');
        // Always override with AI content if available
        validated[cleanPath] = cleanContent;
        console.log("✅ ADDED AI FILE TO VALIDATED:", cleanPath);
        console.log("✅ CONTENT PREVIEW:", cleanContent.substring(0, 150) + "...");
      } else {
        console.error("❌ SKIPPING INVALID PATH:", { path, pathType: typeof path, content: typeof content });
      }
    });
    
    console.log("🔍 FINAL VALIDATED FILES:", Object.keys(validated));
    console.log("🔍 FINAL VALIDATED FILES OBJECT:", validated);
    
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

  // Debug log right before rendering SandpackProvider
  console.log("🚀 ABOUT TO RENDER SANDPACK WITH FILES:", validatedSandpackFiles);
  console.log("🚀 SANDPACK KEY:", sandpackKey);
  console.log("🚀 FILES KEYS:", Object.keys(validatedSandpackFiles));
  console.log("🚀 APP.JS CONTENT:", (validatedSandpackFiles["/src/App.js"] || "").substring(0, 300) + "...");
  
  return (
    <div className="flex flex-col h-full w-full">
      <SandpackToolbar />
      
      <div className="flex-1 min-h-0 h-full">
        {(() => {
          try {
            const allFiles = {
              // Include ALL validated files (this includes all AI-generated components)
              ...validatedSandpackFiles,
              // Override with essential files to ensure they work
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
    <link href="https://unpkg.com/tailwindcss@3.3.0/dist/tailwind.min.css" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`,
              "/src/index.css": `/* Enhanced CSS with comprehensive Tailwind-like utilities */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background-color: #ffffff;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root { min-height: 100vh; }

/* Layout */
.container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.block { display: block; }
.inline-block { display: inline-block; }
.hidden { display: none; }

/* Flexbox */
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-wrap { flex-wrap: wrap; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
.flex-1 { flex: 1 1 0%; }

/* Grid */
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

/* Sizing */
.w-full { width: 100%; }
.w-1\\/2 { width: 50%; }
.w-1\\/3 { width: 33.333333%; }
.w-2\\/3 { width: 66.666667%; }
.w-1\\/4 { width: 25%; }
.w-3\\/4 { width: 75%; }
.w-auto { width: auto; }
.h-full { height: 100%; }
.h-screen { height: 100vh; }
.h-auto { height: auto; }
.min-h-screen { min-height: 100vh; }
.min-h-full { min-height: 100%; }
.max-w-xs { max-width: 20rem; }
.max-w-sm { max-width: 24rem; }
.max-w-md { max-width: 28rem; }
.max-w-lg { max-width: 32rem; }
.max-w-xl { max-width: 36rem; }
.max-w-2xl { max-width: 42rem; }
.max-w-4xl { max-width: 56rem; }

/* Backgrounds */
.bg-transparent { background-color: transparent; }
.bg-white { background-color: #ffffff; }
.bg-black { background-color: #000000; }
.bg-gray-50 { background-color: #f9fafb; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-gray-200 { background-color: #e5e7eb; }
.bg-gray-300 { background-color: #d1d5db; }
.bg-gray-400 { background-color: #9ca3af; }
.bg-gray-500 { background-color: #6b7280; }
.bg-gray-600 { background-color: #4b5563; }
.bg-gray-700 { background-color: #374151; }
.bg-gray-800 { background-color: #1f2937; }
.bg-gray-900 { background-color: #111827; }
.bg-blue-50 { background-color: #eff6ff; }
.bg-blue-100 { background-color: #dbeafe; }
.bg-blue-500 { background-color: #3b82f6; }
.bg-blue-600 { background-color: #2563eb; }
.bg-blue-700 { background-color: #1d4ed8; }
.bg-green-50 { background-color: #f0fdf4; }
.bg-green-500 { background-color: #22c55e; }
.bg-green-600 { background-color: #16a34a; }
.bg-red-50 { background-color: #fef2f2; }
.bg-red-500 { background-color: #ef4444; }
.bg-red-600 { background-color: #dc2626; }
.bg-yellow-50 { background-color: #fefce8; }
.bg-yellow-500 { background-color: #eab308; }
.bg-purple-50 { background-color: #faf5ff; }
.bg-purple-500 { background-color: #a855f7; }

/* Text colors */
.text-transparent { color: transparent; }
.text-white { color: #ffffff; }
.text-black { color: #000000; }
.text-gray-50 { color: #f9fafb; }
.text-gray-100 { color: #f3f4f6; }
.text-gray-200 { color: #e5e7eb; }
.text-gray-300 { color: #d1d5db; }
.text-gray-400 { color: #9ca3af; }
.text-gray-500 { color: #6b7280; }
.text-gray-600 { color: #4b5563; }
.text-gray-700 { color: #374151; }
.text-gray-800 { color: #1f2937; }
.text-gray-900 { color: #111827; }
.text-blue-500 { color: #3b82f6; }
.text-blue-600 { color: #2563eb; }
.text-green-500 { color: #22c55e; }
.text-green-600 { color: #16a34a; }
.text-red-500 { color: #ef4444; }
.text-red-600 { color: #dc2626; }

/* Typography */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-5xl { font-size: 3rem; line-height: 1; }
.text-6xl { font-size: 3.75rem; line-height: 1; }
.font-thin { font-weight: 100; }
.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.font-extrabold { font-weight: 800; }
.font-black { font-weight: 900; }
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

/* Spacing - Margin */
.m-0 { margin: 0; }
.m-1 { margin: 0.25rem; }
.m-2 { margin: 0.5rem; }
.m-3 { margin: 0.75rem; }
.m-4 { margin: 1rem; }
.m-5 { margin: 1.25rem; }
.m-6 { margin: 1.5rem; }
.m-8 { margin: 2rem; }
.m-10 { margin: 2.5rem; }
.m-12 { margin: 3rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }
.mt-8 { margin-top: 2rem; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-8 { margin-bottom: 2rem; }
.ml-1 { margin-left: 0.25rem; }
.ml-2 { margin-left: 0.5rem; }
.ml-3 { margin-left: 0.75rem; }
.ml-4 { margin-left: 1rem; }
.mr-1 { margin-right: 0.25rem; }
.mr-2 { margin-right: 0.5rem; }
.mr-3 { margin-right: 0.75rem; }
.mr-4 { margin-right: 1rem; }

/* Spacing - Padding */
.p-0 { padding: 0; }
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-5 { padding: 1.25rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }
.p-10 { padding: 2.5rem; }
.p-12 { padding: 3rem; }
.px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.px-8 { padding-left: 2rem; padding-right: 2rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }

/* Borders */
.border { border-width: 1px; }
.border-0 { border-width: 0; }
.border-2 { border-width: 2px; }
.border-t { border-top-width: 1px; }
.border-b { border-bottom-width: 1px; }
.border-l { border-left-width: 1px; }
.border-r { border-right-width: 1px; }
.border-gray-200 { border-color: #e5e7eb; }
.border-gray-300 { border-color: #d1d5db; }
.border-gray-400 { border-color: #9ca3af; }
.border-blue-500 { border-color: #3b82f6; }

/* Border radius */
.rounded { border-radius: 0.25rem; }
.rounded-sm { border-radius: 0.125rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-2xl { border-radius: 1rem; }
.rounded-full { border-radius: 9999px; }

/* Gaps */
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-5 { gap: 1.25rem; }
.gap-6 { gap: 1.5rem; }
.gap-8 { gap: 2rem; }

/* Shadows */
.shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
.shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }

/* Position */
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }

/* Transitions */
.transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.duration-200 { transition-duration: 200ms; }
.duration-300 { transition-duration: 300ms; }

/* Hover states */
.hover\\:bg-gray-50:hover { background-color: #f9fafb; }
.hover\\:bg-gray-100:hover { background-color: #f3f4f6; }
.hover\\:bg-blue-700:hover { background-color: #1d4ed8; }
.hover\\:bg-green-600:hover { background-color: #16a34a; }
.hover\\:text-gray-900:hover { color: #111827; }
.hover\\:text-blue-600:hover { color: #2563eb; }
.hover\\:shadow-md:hover { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
.hover\\:scale-105:hover { transform: scale(1.05); }

/* Focus states */
.focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
.focus\\:ring-2:focus { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5); }

/* Cursor */
.cursor-pointer { cursor: pointer; }
.cursor-default { cursor: default; }

/* Overflow */
.overflow-hidden { overflow: hidden; }
.overflow-auto { overflow: auto; }
.overflow-x-auto { overflow-x: auto; }
.overflow-y-auto { overflow-y: auto; }

/* Miscellaneous */
.select-none { user-select: none; }
.whitespace-nowrap { white-space: nowrap; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Custom components */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  border: none;
  text-decoration: none;
  font-size: 0.875rem;
}

.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.card {
  background-color: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
}

/* Responsive utilities */
@media (min-width: 640px) {
  .sm\\:block { display: block; }
  .sm\\:flex { display: flex; }
  .sm\\:hidden { display: none; }
  .sm\\:text-lg { font-size: 1.125rem; line-height: 1.75rem; }
  .sm\\:text-xl { font-size: 1.25rem; line-height: 1.75rem; }
}

@media (min-width: 768px) {
  .md\\:block { display: block; }
  .md\\:flex { display: flex; }
  .md\\:hidden { display: none; }
  .md\\:text-xl { font-size: 1.25rem; line-height: 1.75rem; }
  .md\\:text-2xl { font-size: 1.5rem; line-height: 2rem; }
}`,
              "/package.json": JSON.stringify({
                name: "react-app",
                version: "0.1.0",
                private: true,
                dependencies: {
                  react: "^18.0.0",
                  "react-dom": "^18.0.0",
                  "react-scripts": "5.0.1"
                },
                scripts: {
                  start: "react-scripts start",
                  build: "react-scripts build",
                  test: "react-scripts test"
                }
              }, null, 2)
            };
            
            console.log("🎯 FILES BEING PASSED TO SANDPACK:", Object.keys(allFiles));
            console.log("🎯 COMPONENT FILES:", Object.keys(allFiles).filter(f => f.includes('components')));
            
            return (
              <SandpackProvider
                key={sandpackKey}
                template="react"
                files={allFiles}
                theme="light"
                customSetup={{
                  dependencies: {
                    // Core React packages
                    "react": "^18.2.0",
                    "react-dom": "^18.2.0",
                    "react-scripts": "5.0.1",
                    
                    // UI and Styling
                    "tailwindcss": "^3.4.1",
                    "postcss": "^8",
                    "autoprefixer": "^10.0.0",
                    "tailwind-merge": "^2.4.0",
                    "tailwindcss-animate": "^1.0.7",
                    "clsx": "^2.1.1",
                    "class-variance-authority": "^0.7.1",
                    
                    // Icons and UI Components  
                    "lucide-react": "^0.469.0",
                    "@radix-ui/react-dialog": "^1.1.14",
                    "@radix-ui/react-dropdown-menu": "^2.1.15",
                    "@radix-ui/react-tabs": "^1.1.12",
                    "@radix-ui/react-tooltip": "^1.2.7",
                    "@radix-ui/react-accordion": "^1.2.11",
                    "@radix-ui/react-checkbox": "^1.3.2",
                    "@radix-ui/react-select": "^2.2.5",
                    
                    // Utilities
                    "uuid": "^9.0.1",
                    "date-fns": "^4.1.0",
                    "react-hook-form": "^7.58.1",
                    "zod": "^3.25.67",
                    
                    // Routing and Navigation
                    "react-router-dom": "^6.26.1",
                    
                    // Charts and Data Visualization
                    "react-chartjs-2": "^5.3.0",
                    "chart.js": "^4.4.7",
                    "recharts": "^2.12.7",
                    
                    // HTTP and State Management
                    "axios": "^1.7.9",
                    "@tanstack/react-query": "^5.81.4",
                    
                    // Animation and Motion
                    "framer-motion": "^11.11.17",
                    
                    // Forms and Input
                    "react-textarea-autosize": "^8.5.9",
                    
                    // Firebase (optional)
                    "firebase": "^11.1.0",
                    
                    // Google AI (optional)
                    "@google/generative-ai": "^0.21.0"
                  }
                }}
                options={{
                  visibleFiles: ["/src/App.js"],
                  activeFile: "/src/App.js",
                  externalResources: [
                    "https://cdn.tailwindcss.com"
                  ]
                }}
                style={{ height: "100%" }}
              >
                 <SandpackPreview 
                   showOpenInCodeSandbox={false}
                   showRefreshButton={false}
                   style={{ height: "100%" }}
                 />
               </SandpackProvider>
            );
          } catch (error) {
            console.error("🚨 SANDPACK PROVIDER ERROR:", error);
            console.error("🚨 ERROR STACK:", error instanceof Error ? error.stack : 'No stack trace');
            console.error("🚨 FILES THAT CAUSED ERROR:", validatedSandpackFiles);
            return (
              <div className="flex items-center justify-center h-full text-red-500">
                <div className="text-center">
                  <p className="font-bold">Sandpack Error</p>
                  <p className="text-sm">{error instanceof Error ? error.message : String(error)}</p>
                </div>
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
};