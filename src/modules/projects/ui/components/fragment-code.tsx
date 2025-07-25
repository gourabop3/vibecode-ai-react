"use client";

import { Fragment } from "@/generated/prisma"
import { FileExplorer } from "@/components/file-explorer";

interface Props {
  fragment: Fragment
}

export const FragmentCode = ({
  fragment
}: Props) => {
  // Get the files from the fragment
  const fragmentFiles = fragment.files as { [path: string]: string };
  
  // Create complete React app structure (same as Sandpack)
  const completeReactFiles: { [path: string]: string } = {};
  
  // Add package.json
  completeReactFiles["package.json"] = JSON.stringify({
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

  // Add public/index.html
  completeReactFiles["public/index.html"] = `<!DOCTYPE html>
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

  // Add src/index.tsx
  completeReactFiles["src/index.tsx"] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error rendering app:', error);
  root.render(
    <div>
      <h1>Error loading app</h1>
      <p>Please check the console for details.</p>
    </div>
  );
}`;

  // Add src/index.css with Tailwind
  completeReactFiles["src/index.css"] = `@tailwind base;
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

  // Add tailwind.config.js
  completeReactFiles["tailwind.config.js"] = `/** @type {import('tailwindcss').Config} */
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

  // Add tsconfig.json
  completeReactFiles["tsconfig.json"] = `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}`;

  // Add default App.tsx if not present
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

  // Process fragment files and add/override them
  if (fragmentFiles && Object.keys(fragmentFiles).length > 0) {
    Object.entries(fragmentFiles).forEach(([path, content]) => {
      // Convert paths to match React structure
      let filePath = path;
      
      // If path doesn't start with src/, add it (except for config files)
      if (!path.startsWith('src/') && !path.startsWith('public/') && 
          !['package.json', 'tailwind.config.js', 'tsconfig.json'].includes(path)) {
        filePath = `src/${path}`;
      }
      
      // Only add valid files with content
      if (content && content.trim()) {
        completeReactFiles[filePath] = content;
      }
    });
  }

  // Ensure App.tsx exists
  if (!completeReactFiles["src/App.tsx"] || !completeReactFiles["src/App.tsx"].trim()) {
    completeReactFiles["src/App.tsx"] = defaultAppContent;
  }

  return (
    <div className="h-full w-full">
      <FileExplorer files={completeReactFiles} />
    </div>
  );
};