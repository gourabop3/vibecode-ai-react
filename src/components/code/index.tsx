import prismjs from 'prismjs';
import { useEffect } from 'react';
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "./code-theme.css";

interface Props {
  code: string;
  language: string;
}

export const CodeView = ({
  code,
  language
}: Props) => {

  useEffect(() => {
    prismjs.highlightAll();
  }, [code, language]);

  return (
    <pre
      className='p-2 bg-transparent border-none rounded-none m-0 text-sm'
    >
      <code className={`language-${language}`}>
        {code}
      </code>
    </pre>
  )
}

