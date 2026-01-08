import { useState, useEffect } from 'react';
import './App.css';
import { toast, Toaster } from 'sonner';

// Import workflow step components
import PrepareExtension from './components/WorkflowSteps/PrepareExtension';
import PrepareURL from './components/WorkflowSteps/PrepareURL';
import PrepareScripts from './components/WorkflowSteps/PrepareScripts';
import PreparePrompt from './components/WorkflowSteps/PreparePrompt';
import Gogogo from './components/WorkflowSteps/Gogogo';
import ModeToggle from './components/ModeToggle';

// Import shared types and constants
import { ToastTypes } from './utils/shared';
import type { ToastType } from './utils/shared';

function App() {
  const [url, setUrl] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);
  const [isDark, setIsDark] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Handle theme change
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setIsDark(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);



  // Toggle between AI and Code modes
  const toggleMode = () => {
    setIsAIMode(!isAIMode);
  };

  // Show toast notification
  const showToast = (type: ToastType, message: string, description?: string) => {
    switch (type) {
      case ToastTypes.Success:
        toast.success(message, { description });
        break;
      case ToastTypes.Info:
        toast.info(message, { description });
        break;
      case ToastTypes.Error:
        toast.error(message, { description });
        break;
      case ToastTypes.Warning:
        toast.warning(message, { description });
        break;
      default:
        toast(message, { description });
    }
  };

  return (
    <>
      {/* Mode Toggle */}
      <ModeToggle isAIMode={isAIMode} onToggle={toggleMode} />
      
      <div className="workflow-container">
        <h1 className="workflow-title">Web Automation Workflow</h1>

        {/* Workflow Steps */}
        <PrepareExtension 
          stepNumber={1} 
        />
        
        <PrepareURL 
          url={url} 
          onUrlChange={setUrl} 
          stepNumber={2} 
        />
        
        {/* Conditionally render step 3 based on mode */}
        {isAIMode ? (
          <PreparePrompt 
            promptContent={promptContent} 
            onPromptChange={setPromptContent} 
            stepNumber={3} 
          />
        ) : (
          <PrepareScripts 
            isDark={isDark}
            initialScriptContent={scriptContent}
            onScriptChange={setScriptContent}
            stepNumber={3} 
          />
        )}
        
        {/* Gogogo step (step 4) */}
        <Gogogo 
          isAIMode={isAIMode} 
          scriptContent={scriptContent} 
          promptContent={promptContent} 
          url={url} 
          stepNumber={4} 
          showToast={showToast} 
        />
      </div>
      <Toaster />
    </>
  );
}

export default App;
