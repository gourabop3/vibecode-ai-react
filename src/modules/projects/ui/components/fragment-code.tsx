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
  
  // Add complete package.json (matching Sandpack)
  completeReactFiles["package.json"] = JSON.stringify({
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
  }, null, 2);

  // Add public/index.html
  completeReactFiles["public/index.html"] = `<!DOCTYPE html>
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

  // Add src/index.js
  completeReactFiles["src/index.js"] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;

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
}

* {
  box-sizing: border-box;
}`;

  // Add tailwind.config.js
  completeReactFiles["tailwind.config.js"] = `/** @type {import('tailwindcss').Config} */
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

  // Add .gitignore
  completeReactFiles[".gitignore"] = `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

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

  // Add README.md
  completeReactFiles["README.md"] = `# React App

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

  // Add default App.js if not present
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

  // Ensure App.js exists
  if (!completeReactFiles["src/App.js"] || !completeReactFiles["src/App.js"].trim()) {
    completeReactFiles["src/App.js"] = defaultAppContent;
  }

  return (
    <div className="h-full w-full">
      <FileExplorer files={completeReactFiles} />
    </div>
  );
};