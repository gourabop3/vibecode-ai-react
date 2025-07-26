import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash-exp',
});

const codeGenerationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'application/json',
};

const codeSession = model.startChat({
  generationConfig: codeGenerationConfig,
  history: [
    {
      role: "user",
      parts: [
        {
          text: `Generate a Project in React. Create multiple components, organizing them in separate folders with filenames using the .js extension, if needed. The output should use Tailwind CSS for styling, 
without any third-party dependencies or libraries, except for icons from the lucide-react library, which should only be used when necessary. Available icons include: Heart, Shield, Clock, Users, Play, Home, Search, Menu, User, Settings, Mail, Bell, Calendar, Star, Upload, Download, Trash, Edit, Plus, Minus, Check, X, and ArrowRight. For example, you can import an icon as import { Heart } from "lucide-react" and use it in JSX as <Heart className="" />.
also you can use date-fns for date format and react-chartjs-2 chart, graph library

Return the response in JSON format with the following schema:
{
  "projectTitle": "",
  "explanation": "",
  "files": {
    "/App.js": {
      "code": ""
    },
    ...
  },
  "generatedFiles": []
}

Generate a programming code structure for a React project. Create multiple components, organizing them in separate folders with filenames using the .js extension, if needed. The output should use Tailwind CSS for styling, without any third-party dependencies or libraries, except for icons from the lucide-react library, which should only be used when necessary. Available icons include: Heart, Shield, Clock, Users, Play, Home, Search, Menu, User, Settings, Mail, Bell, Calendar, Star, Upload, Download, Trash, Edit, Plus, Minus, Check, X, and ArrowRight.

Ensure the files field contains all created files, and the generatedFiles field lists all the filenames. Each file's code should be included in the code field, following this example:
files:{
  "/App.js": {
    "code": "import React from 'react';\nimport './styles.css';\nexport default function App() {\n  return (\n    <div className='p-4 bg-gray-100 text-center'>\n      <h1 className='text-2xl font-bold text-blue-500'>Hello, Tailwind CSS with Sandpack!</h1>\n      <p className='mt-2 text-gray-700'>This is a live code editor.</p>\n    </div>\n  );\n}"
  }
}
Additionally, include an explanation of the project's structure, purpose, and functionality in the explanation field. Make the response concise and clear in one paragraph.
- When asked then only use this package to import, here are some packages available to import and use (date-fns,react-chartjs-2,"firebase","@google/generative-ai" ) only when it required

- For placeholder images, please use a https://archive.org/download/placeholder-image/placeholder-image.jpg
-Add Emoji icons whenever needed to give good user experinence
- all designs I ask you to make, have them be beautiful, not cookie cutter. Make webpages that are fully featured and worthy for production.

- By default, this template supports JSX syntax with Tailwind CSS classes, React hooks, and Lucide React for icons. Do not install other packages for UI themes, icons, etc unless absolutely necessary or I request them.

- Use icons from lucide-react for logos.

- Use stock photos from unsplash where appropriate, only valid URLs you know exist. Do not download the images, only link to them in image tags.`
        }
      ]
    },
    {
      role: "model",
      parts: [
        {
          text: `{
  "projectTitle": "React Todo App with Tailwind CSS",
  "explanation": "This project implements a simple Todo application using React and Tailwind CSS. The application is structured into components located in the '/components' folder, including a Todo list, a Todo form, and a filter bar. It features basic add, delete and complete functionality for to-do items, using local storage to persist data between sessions and includes date format with date-fns.",
  "files": {
    "/App.js": {
      "code": "import React, { useState, useEffect } from 'react';\\nimport TodoList from './components/TodoList';\\nimport TodoForm from './components/TodoForm';\\nimport FilterBar from './components/FilterBar';\\nimport { Plus, Check } from 'lucide-react';\\n\\nfunction App() {\\n  const [todos, setTodos] = useState(() => {\\n    const savedTodos = localStorage.getItem('todos');\\n    return savedTodos ? JSON.parse(savedTodos) : [];\\n  });\\n  const [filter, setFilter] = useState('all');\\n\\n  useEffect(() => {\\n    localStorage.setItem('todos', JSON.stringify(todos));\\n  }, [todos]);\\n\\n  const addTodo = (text) => {\\n    if (text) {\\n     setTodos([...todos, { id: Date.now(), text, completed: false, createdAt: new Date() }]);\\n    }\\n  };\\n\\n  const toggleComplete = (id) => {\\n    setTodos(todos.map(todo => todo.id === id ? {...todo, completed: !todo.completed} : todo));\\n  };\\n\\n  const deleteTodo = (id) => {\\n    setTodos(todos.filter(todo => todo.id !== id));\\n  };\\n\\n  const filteredTodos = () => {\\n    switch (filter) {\\n      case 'completed':\\n        return todos.filter(todo => todo.completed);\\n      case 'incomplete':\\n        return todos.filter(todo => !todo.completed);\\n      default:\\n        return todos;\\n    }\\n  };\\n\\n  return (\\n    <div className=\\"min-h-screen bg-gray-100 flex flex-col items-center p-4\\">\\n       <h1 className=\\"text-4xl font-bold text-center mb-8 text-blue-700\\">My Todo List <Check className=\\"inline-block ml-2 text-green-500\\" /></h1>\\n      <div className=\\"bg-white p-6 rounded-lg shadow-md w-full max-w-md space-y-4\\">\\n       <TodoForm onAddTodo={addTodo} />\\n        <FilterBar onFilterChange={setFilter} filter={filter} />\\n        <TodoList todos={filteredTodos()} onToggleComplete={toggleComplete} onDeleteTodo={deleteTodo} />\\n      </div>\\n        <div className=\\"mt-4 text-center text-gray-600\\">\\n        <p>Crafted with ❤️ using React and Tailwind CSS. <Plus className=\\"inline-block ml-1\\" /> </p>\\n         </div>\\n    </div>\\n  );\\n}\\n\\nexport default App;\\n"
    }
  },
  "generatedFiles": ["/App.js"]
}`
        }
      ]
    }
  ]
});

const CODE_GEN_PROMPT = `
Generate a Project in React. Create multiple components, organizing them in separate folders with filenames using the .js extension, if needed. The output should use Tailwind CSS for styling, 
without any third-party dependencies or libraries, except for icons from the lucide-react library, which should only be used when necessary. Available icons include: Heart, Shield, Clock, Users, Play, Home, Search, Menu, User, Settings, Mail, Bell, Calendar, Star, Upload, Download, Trash, Edit, Plus, Minus, Check, X, and ArrowRight. For example, you can import an icon as import { Heart } from "lucide-react" and use it in JSX as <Heart className="" />.
also you can use date-fns for date format and react-chartjs-2 chart, graph library

Return the response in JSON format with the following schema:
{
  "projectTitle": "",
  "explanation": "",
  "files": {
    "/App.js": {
      "code": ""
    },
    ...
  },
  "generatedFiles": []
}

Generate a programming code structure for a React project. Create multiple components, organizing them in separate folders with filenames using the .js extension, if needed. The output should use Tailwind CSS for styling, without any third-party dependencies or libraries, except for icons from the lucide-react library.

Ensure the files field contains all created files, and the generatedFiles field lists all the filenames. Each file's code should be included in the code field.
Additionally, include an explanation of the project's structure, purpose, and functionality in the explanation field. Make the response concise and clear in one paragraph.
- When asked then only use this package to import, here are some packages available to import and use (date-fns,react-chartjs-2,"firebase","@google/generative-ai" ) only when it required

- For placeholder images, please use a https://archive.org/download/placeholder-image/placeholder-image.jpg
-Add Emoji icons whenever needed to give good user experinence
- all designs I ask you to make, have them be beautiful, not cookie cutter. Make webpages that are fully featured and worthy for production.

- By default, this template supports JSX syntax with Tailwind CSS classes, React hooks, and Lucide React for icons. Do not install other packages for UI themes, icons, etc unless absolutely necessary or I request them.

- Use icons from lucide-react for logos.

- Use stock photos from unsplash where appropriate, only valid URLs you know exist. Do not download the images, only link to them in image tags.
`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const finalPrompt = prompt + '\n\n' + CODE_GEN_PROMPT;
    const result = await codeSession.sendMessage(finalPrompt);
    const response = result.response.text();
    
    // Parse the JSON response
    const parsedResponse = JSON.parse(response);
    
    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error('AI Code Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}