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
  
  // Handle different possible data formats - create a new object to avoid readonly issues
  if (fragment.files) {
    console.log("✅ Fragment has files");
    if (typeof fragment.files === 'string') {
      console.log("📄 Files are stored as string, parsing...");
      try {
        const parsed = JSON.parse(fragment.files);
        files = { ...parsed }; // Create new object to avoid readonly issues
      } catch (e) {
        console.error("❌ Failed to parse fragment.files as JSON:", e);
        files = {};
      }
    } else if (typeof fragment.files === 'object' && fragment.files !== null) {
      console.log("📦 Files are stored as object, creating copy...");
      files = { ...(fragment.files as { [path: string]: string }) }; // Create new object to avoid readonly issues
    } else {
      console.log("❓ Unknown fragment.files format:", typeof fragment.files);
    }
  } else {
    console.log("❌ Fragment has no files property");
  }
  
  console.log("Processed files object:", files);
  
  // Create a stable key for Sandpack to prevent re-renders and readonly issues
  const sandpackKey = `sandpack-${fragment.id || 'default'}-${Object.keys(files || {}).length}`;
  
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

  // Set up complete files for Sandpack with safety checks
  // Add all AI-generated files to Sandpack
  try {
    Object.entries(files || {}).forEach(([path, content]) => {
      // Create new variables to avoid readonly issues
      let sandpackPath = String(path);
      const sandpackContent = String(content || '');
      
      // Convert any remaining .tsx/.ts extensions to .js (shouldn't happen with new prompt)
      if (sandpackPath.endsWith('.tsx') || sandpackPath.endsWith('.ts')) {
        sandpackPath = sandpackPath.replace(/\.tsx?$/, '.js');
      }
      
      // Ensure path starts with /
      if (!sandpackPath.startsWith('/')) {
        sandpackPath = `/${sandpackPath}`;
      }
      
      // Create new property in sandpackFiles object
      sandpackFiles[sandpackPath] = sandpackContent;
    });
  } catch (error) {
    console.error("Error processing files for Sandpack:", error);
  }
  
  // Ensure App.js is always present in sandpackFiles
  if (!sandpackFiles["/src/App.js"]) {
    console.log("⚠️ App.js not found in sandpackFiles, adding processed appContent");
    sandpackFiles["/src/App.js"] = appContent;
  }
  
  // Add essential React files with Sandpack-compatible packages
  try {
    sandpackFiles["/package.json"] = JSON.stringify({
      dependencies: {
        react: "^18.0.0",
        "react-dom": "^18.0.0",
        uuid: "^9.0.0",
        clsx: "^2.0.0",
        "date-fns": "^2.30.0"
      }
    }, null, 2);
    
    sandpackFiles["/index.js"] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`;
    
    // Add index.css file that AI might reference
    sandpackFiles["/src/index.css"] = `/* Basic CSS reset and Tailwind base styles */
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
}

/* Tailwind CSS is loaded via CDN, so this file just provides basic styles */`;
  } catch (error) {
    console.error("Error creating essential files:", error);
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
          options={{
            externalResources: ["https://cdn.tailwindcss.com"]
          }}
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <SandpackPreview 
            showOpenInCodeSandbox={false}
            showRefreshButton={false}
            style={{ height: "100%", width: "100%", flex: 1 }}
            onLoadStart={() => console.log("🔄 Sandpack loading started")}
            onLoadEnd={() => console.log("✅ Sandpack loaded successfully")}
          />
        </SandpackProvider>
      </div>
    </div>
  );
};