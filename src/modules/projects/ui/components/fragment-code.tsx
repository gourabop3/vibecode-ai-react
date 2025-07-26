"use client";

import { Fragment } from "@/generated/prisma"
import { useState, useMemo } from "react";
import "@/app/code-theme.css";
import { Button } from "@/components/ui/button";
import { CopyIcon, CopyCheckIcon } from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarGroup,
  SidebarMenu,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight, FileIcon, FolderIcon } from "lucide-react";

interface Props {
  fragment: Fragment
}

// Tree item type for file structure
type TreeItem = string | [string, ...TreeItem[]];

// File collection type
type FileCollection = { [path: string]: string };

const getFileExtension = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'text';
  }
};

// Simple syntax highlighting function
const highlightCode = (code: string, language: string) => {
  // Basic syntax highlighting for common patterns
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  if (language === 'javascript' || language === 'typescript') {
    highlighted = highlighted
      .replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|class|extends|super|this|new|async|await|try|catch|finally|throw|default|export default)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="boolean">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
      .replace(/(['"`])(.*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/(\/\/.*)/g, '<span class="comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
  } else if (language === 'css') {
    highlighted = highlighted
      .replace(/([.#]?\w+)\s*{/g, '<span class="selector">$1</span> {')
      .replace(/(\w+):\s*([^;]+);/g, '<span class="property">$1</span>: <span class="value">$2</span>;')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
  } else if (language === 'html') {
    highlighted = highlighted
      .replace(/(&lt;\/?)(\w+)/g, '$1<span class="tag">$2</span>')
      .replace(/(\w+)=/g, '<span class="attribute">$1</span>=');
  }

  return highlighted;
};

// Convert flat file structure to tree structure
const buildFileTree = (files: FileCollection): TreeItem[] => {
  const tree: { [key: string]: any } = {};
  
  Object.keys(files).forEach(filePath => {
    const parts = filePath.split('/');
    let current = tree;
    
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        // This is a file
        current[part] = filePath;
      } else {
        // This is a directory
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    });
  });
  
  const convertToTreeItem = (obj: any): TreeItem[] => {
    return Object.entries(obj).map(([key, value]) => {
      if (typeof value === 'string') {
        return key; // File
      } else {
        return [key, ...convertToTreeItem(value)]; // Directory
      }
    });
  };
  
  return convertToTreeItem(tree);
};

export const FragmentCode = ({
  fragment
}: Props) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Parse fragment files safely
  const files: FileCollection = useMemo(() => {
    let fragmentFiles: { [path: string]: any } = {};
    try {
      if (fragment?.files) {
        if (typeof fragment.files === 'string') {
          fragmentFiles = JSON.parse(fragment.files);
        } else {
          fragmentFiles = fragment.files as { [path: string]: any };
        }
      }
    } catch (error) {
      console.error("Error parsing fragment files:", error);
      fragmentFiles = {};
    }

    const completeFiles: FileCollection = {};
    
    // Add essential React project files first
    completeFiles["package.json"] = JSON.stringify({
      name: "react-app",
      version: "0.1.0",
      private: true,
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "lucide-react": "^0.469.0",
        "date-fns": "^4.1.0"
      },
      scripts: {
        start: "react-scripts start",
        build: "react-scripts build",
        test: "react-scripts test"
      }
    }, null, 2);

    completeFiles["public/index.html"] = `<!DOCTYPE html>
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
</html>`;

    completeFiles["src/index.js"] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`;

    completeFiles["src/index.css"] = `/* Base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #1f2937;
}`;

    completeFiles["README.md"] = `# React App

This project was created with AI and uses React 18 with Tailwind CSS.

## Available Scripts

- \`npm start\` - Runs the app in development mode
- \`npm run build\` - Builds the app for production
- \`npm test\` - Launches the test runner`;

    // Process AI-generated files and add/override them
    Object.entries(fragmentFiles).forEach(([path, fileData]) => {
      let content = '';
      if (typeof fileData === 'string') {
        content = fileData;
      } else if (fileData && typeof fileData === 'object' && 'code' in fileData) {
        content = fileData.code;
      } else {
        content = String(fileData || '');
      }
      
      if (content.trim()) {
        // Clean up the path - keep original structure but fix format
        let cleanPath = path.startsWith('/') ? path.substring(1) : path;
        
        // Handle different path formats
        if (cleanPath === 'App.js' || cleanPath === 'src/App.js') {
          cleanPath = 'src/App.js';
        } else if (cleanPath.startsWith('components/')) {
          // Keep components in their folder: components/TodoList.js
          cleanPath = `src/${cleanPath}`;
        } else if (cleanPath.includes('/components/')) {
          // Handle nested: some/path/components/TodoList.js -> src/components/TodoList.js
          const fileName = cleanPath.split('/').pop();
          cleanPath = `src/components/${fileName}`;
        } else if (!cleanPath.startsWith('src/') && 
                  !cleanPath.startsWith('public/') && 
                  !['package.json', 'tailwind.config.js', 'README.md', '.gitignore'].includes(cleanPath) &&
                  (cleanPath.endsWith('.js') || cleanPath.endsWith('.jsx'))) {
          // Other JS files go in src/
          cleanPath = `src/${cleanPath}`;
        }
        
        completeFiles[cleanPath] = content;
      }
    });

    // Ensure we have a default App.js
    if (!completeFiles["src/App.js"]) {
      completeFiles["src/App.js"] = `import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto text-center">
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

    return completeFiles;
  }, [fragment]);

  const treeData = useMemo(() => buildFileTree(files), [files]);

  // Set default selected file
  useMemo(() => {
    if (!selectedFile && Object.keys(files).length > 0) {
      const defaultFiles = ['src/App.js', 'src/index.js', 'package.json'];
      for (const defaultFile of defaultFiles) {
        if (files[defaultFile]) {
          setSelectedFile(defaultFile);
          break;
        }
      }
    }
  }, [files, selectedFile]);

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
  };

  const handleFileCopy = async () => {
    if (selectedFile) {
      try {
        await navigator.clipboard.writeText(selectedFile);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy file path:', err);
      }
    }
  };

  // File Breadcrumb Component
  const FileBreadcrumb = ({ filePath }: { filePath: string }) => {
    const pathSegments = filePath.split('/');
    
    const renderedSegments = () => {
      if (pathSegments.length <= 3) {
        return pathSegments.map((segment, index) => (
          <BreadcrumbItem key={index}>
            {index === pathSegments.length - 1 ? (
              <BreadcrumbPage className="font-medium">
                {segment}
              </BreadcrumbPage>
            ) : (
              <span className="text-muted-foreground">
                {segment}
              </span>
            )}
            {index < pathSegments.length - 1 && <BreadcrumbSeparator/>}
          </BreadcrumbItem>
        ));
      } else {
        const firstSegment = pathSegments[0];
        const lastSegment = pathSegments[pathSegments.length - 1];
        return (
          <>
            <BreadcrumbItem>
              <span className="text-muted-foreground">
                {firstSegment}
              </span>
            </BreadcrumbItem>
            <BreadcrumbSeparator/>
            <BreadcrumbItem>
              <span className="text-muted-foreground">...</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator/>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">
                {lastSegment}
              </BreadcrumbPage>
            </BreadcrumbItem> 
          </>
        );
      }
    };

    return (
      <Breadcrumb>
        <BreadcrumbList>
          {renderedSegments()}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  // Tree Component
  const Tree = ({
    item,
    onSelect,
    value,
    parentPath
  }: {
    item: TreeItem;
    onSelect?: (filePath: string) => void;
    value?: string | null;
    parentPath: string;
  }) => {
    const [name, ...items] = Array.isArray(item) ? item : [item];
    const currentPath = parentPath ? `${parentPath}/${name}` : name;

    if (!items.length) {
      const isSelected = value === currentPath;
      return (
        <SidebarMenuButton
          isActive={isSelected}
          onClick={() => onSelect?.(currentPath)}
          className="data-[active=true]:bg-transparent"
        >
          <FileIcon/>
          <span className="truncate">{name}</span>
        </SidebarMenuButton>
      );
    }

    return (
      <SidebarMenuItem>
        <Collapsible className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90" defaultOpen>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton>
              <ChevronRight className="transition-transform"/>
              <FolderIcon/>
              <span className="truncate">{name}</span>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {items.map((subItem, index) => (
                <Tree
                  key={index}
                  item={subItem}
                  onSelect={onSelect}
                  value={value}
                  parentPath={currentPath}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>
    );
  };

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={30} minSize={30} className="h-full">
        <SidebarProvider className="h-full">
          <Sidebar collapsible="none" className="w-full">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {treeData.map((item, index) => (
                      <Tree
                        key={index}
                        item={item}
                        onSelect={handleFileSelect}
                        value={selectedFile}
                        parentPath=""
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </SidebarProvider>
      </ResizablePanel>
      <ResizableHandle withHandle className="hover:bg-primary transition-colors"/>
      <ResizablePanel defaultSize={70} minSize={50}>
        {selectedFile && files[selectedFile] ? (
          <div className="h-full w-full flex flex-col">
            <div className="border-b flex bg-sidebar px-4 py-2 justify-between items-center">
              <FileBreadcrumb filePath={selectedFile} />
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={handleFileCopy}
                disabled={copied}
              >
                {copied ? <CopyCheckIcon className="w-4 h-4"/> : <CopyIcon className="w-4 h-4"/>}
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <div className="bg-background border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 border-b">
                  <span className="text-sm font-medium text-muted-foreground">
                    {getFileExtension(selectedFile)}
                  </span>
                </div>
                <div className="p-4">
                  <pre className="text-sm overflow-auto bg-transparent border-none rounded-none m-0">
                    <code 
                      className={`language-${getFileExtension(selectedFile)}`}
                      dangerouslySetInnerHTML={{
                        __html: highlightCode(files[selectedFile], getFileExtension(selectedFile))
                      }}
                    />
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-muted-foreground">
            Open a file to view its contents
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};