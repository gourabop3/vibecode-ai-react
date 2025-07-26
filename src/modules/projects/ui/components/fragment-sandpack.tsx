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
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>React App</title>
    <script src="https://cdn.tailwindcss.com"></script>
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
      
             "/src/index.css": `/* Base styles */
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
  width: 100%;
  display: flex;
  flex-direction: column;
}`,
      
      "/package.json": JSON.stringify({
        name: "react-app",
        version: "0.1.0",
        dependencies: {
          "react": "^18.2.0",
          "react-dom": "^18.2.0",
          "lucide-react": "^0.469.0",
          "date-fns": "^4.1.0",
          "react-chartjs-2": "^5.3.0",
          "chart.js": "^4.4.7",
          "react-router-dom": "^6.8.0",
          "uuid": "^9.0.0",
          "axios": "^1.3.0",
          "firebase": "^9.17.0",
          "react-hook-form": "^7.43.0",
          "zod": "^3.20.0",
          "@hookform/resolvers": "^2.9.0",
          "framer-motion": "^10.0.0",
          "react-icons": "^4.7.0",
          "clsx": "^1.2.0",
          "tailwind-merge": "^1.12.0"
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

     // Scan for missing imports and create placeholder components
     const missingComponents = new Set<string>();
     
     // Extract all import statements from all files
     Object.values(files).forEach(code => {
       if (typeof code === 'string') {
         // Match different types of import statements
         const importPatterns = [
           // Default imports: import Component from './Component'
           /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
           // Named imports: import { Component } from './Component'
           /import\s*{\s*(\w+)\s*}\s+from\s+['"]([^'"]+)['"]/g,
           // Mixed imports: import Component, { OtherComponent } from './Component'
           /import\s+(\w+)\s*,\s*{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/g
         ];

         importPatterns.forEach(pattern => {
           const importMatches = code.match(pattern);
           if (importMatches) {
             importMatches.forEach(match => {
               let componentNames: string[] = [];
               let importPath = '';

               if (pattern.source.includes('{\\s*([^}]+)\\s*}')) {
                 // Named imports
                 const namedMatch = match.match(/import\s*{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/);
                 if (namedMatch) {
                   componentNames = namedMatch[1].split(',').map(name => name.trim());
                   importPath = namedMatch[2];
                 }
               } else if (pattern.source.includes('\\s*,\\s*{\\s*([^}]+)\\s*}')) {
                 // Mixed imports
                 const mixedMatch = match.match(/import\s+(\w+)\s*,\s*{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/);
                 if (mixedMatch) {
                   componentNames = [mixedMatch[1], ...mixedMatch[2].split(',').map(name => name.trim())];
                   importPath = mixedMatch[3];
                 }
               } else {
                 // Default imports
                 const defaultMatch = match.match(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/);
                 if (defaultMatch) {
                   componentNames = [defaultMatch[1]];
                   importPath = defaultMatch[2];
                 }
               }

               // Check if it's a relative import (starts with ./ or ../)
               if (importPath.startsWith('./') || importPath.startsWith('../')) {
                 // Extract the component name from the path
                 const pathParts = importPath.split('/');
                 const fileName = pathParts[pathParts.length - 1];
                 const componentFromPath = fileName.replace(/\.(js|jsx|ts|tsx)$/, '');
                 
                 // Check if this component file exists
                 const componentFilePath = `/src/${componentFromPath}.js`;
                 if (!files[componentFilePath] && !files[`/src/${componentFromPath}.jsx`]) {
                   missingComponents.add(componentFromPath);
                 }
               }
             });
           }
         });
       }
     });

     // Create placeholder components for missing imports
     missingComponents.forEach(componentName => {
       const placeholderCode = `import React from 'react';

function ${componentName}() {
  return (
    <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
      <div className="text-center">
        <div className="text-gray-500 text-sm mb-2">Placeholder Component</div>
        <div className="text-gray-700 font-medium">${componentName}</div>
        <div className="text-gray-500 text-xs mt-1">
          This component was referenced but not generated by AI
        </div>
      </div>
    </div>
  );
}

export default ${componentName};`;
       
       files[`/src/${componentName}.js`] = placeholderCode;
       console.log(`🔧 Created placeholder for missing component: ${componentName}`);
     });

     // Also check for missing CSS imports and create empty CSS files
     Object.values(files).forEach(code => {
       if (typeof code === 'string') {
         const cssImports = code.match(/import\s+['"]([^'"]+\.css)['"]/g);
         if (cssImports) {
           cssImports.forEach(cssImport => {
             const cssMatch = cssImport.match(/import\s+['"]([^'"]+\.css)['"]/);
             if (cssMatch) {
               const cssPath = cssMatch[1];
               if (cssPath.startsWith('./') || cssPath.startsWith('../')) {
                 const pathParts = cssPath.split('/');
                 const fileName = pathParts[pathParts.length - 1];
                 const cleanCssPath = `/src/${fileName}`;
                 
                 if (!files[cleanCssPath]) {
                   files[cleanCssPath] = `/* Placeholder CSS file for ${fileName} */`;
                   console.log(`🔧 Created placeholder CSS file: ${fileName}`);
                 }
               }
             }
           });
         }
       }
     });

     // Auto-detect dependencies from import statements
     const detectedDependencies = new Set<string>();
     
     Object.values(files).forEach(code => {
       if (typeof code === 'string') {
         // Match import statements for external packages
         const importMatches = code.match(/import\s+.*?from\s+['"]([^'"]+)['"]/g);
         if (importMatches) {
           importMatches.forEach(match => {
             const packageMatch = match.match(/import\s+.*?from\s+['"]([^'"]+)['"]/);
             if (packageMatch) {
               const packageName = packageMatch[1];
               
               // Skip relative imports and built-in modules
               if (!packageName.startsWith('.') && 
                   !packageName.startsWith('/') && 
                   !packageName.startsWith('http') &&
                   !['react', 'react-dom'].includes(packageName)) {
                 
                 // Extract the main package name (handle sub-packages)
                 const mainPackage = packageName.split('/')[0];
                 
                 // Skip @types packages and other non-runtime packages
                 if (!mainPackage.startsWith('@types/') && 
                     !mainPackage.startsWith('@babel/') &&
                     !mainPackage.startsWith('@testing-library/')) {
                   detectedDependencies.add(mainPackage);
                 }
               }
             }
           });
         }
       }
     });

          console.log("🔍 Auto-detected dependencies:", Array.from(detectedDependencies));
     
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

  console.log("🔍 Rendering FragmentSandpack with fragment:", fragment.id);
  console.log("🔍 Sandpack files count:", Object.keys(sandpackFiles).length);
  console.log("🔍 Sandpack files:", Object.keys(sandpackFiles));

  const sandpackKey = `sandpack-${fragment.id}-${Object.keys(sandpackFiles).length}`;
  
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <SandpackToolbar />
      
      <div className="flex-1 min-h-0 overflow-visible relative">
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
              "chart.js": "^4.4.7",
              "react-router-dom": "^6.8.0",
              "uuid": "^9.0.0",
              "axios": "^1.3.0",
              "firebase": "^9.17.0",
              "react-hook-form": "^7.43.0",
              "zod": "^3.20.0",
              "@hookform/resolvers": "^2.9.0",
              "framer-motion": "^10.0.0",
              "react-icons": "^4.7.0",
              "clsx": "^1.2.0",
              "tailwind-merge": "^1.12.0",
              ...Object.fromEntries(
                Array.from(detectedDependencies || []).map(dep => [dep, "latest"])
              )
            }
          }}
          options={{
            visibleFiles: ["/src/App.js"],
            activeFile: "/src/App.js",
            externalResources: ['https://cdn.tailwindcss.com']
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
              position: "relative"
            }}
          />
        </SandpackProvider>
      </div>
    </div>
  );
};