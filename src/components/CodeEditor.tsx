import { Editor } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string | undefined) => void;
  height?: string;
  theme?: 'vs-dark' | 'light';
  readOnly?: boolean;
}

export const CodeEditor = ({
  language,
  value,
  onChange,
  height = '500px',
  theme = 'vs-dark',
  readOnly = false,
}: CodeEditorProps) => {
  const handleEditorChange = (value: string | undefined) => {
    onChange(value);
  };

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleEditorChange}
        theme={theme}
        loading={
          <div className="flex items-center justify-center h-full bg-gray-900">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: true,
          scrollBeyondLastLine: false,
          readOnly: readOnly,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          folding: true,
          foldingHighlight: true,
          bracketPairColorization: {
            enabled: true,
          },
        }}
      />
    </div>
  );
};



