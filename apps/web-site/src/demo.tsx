import { useState, useEffect } from 'react';
import './App.css';
import { toast, Toaster } from 'sonner';
import PrepareExtension from './components/WorkflowSteps/PrepareExtension';
import PrepareURL from './components/WorkflowSteps/PrepareURL';
import PrepareScripts from './components/WorkflowSteps/PrepareScripts';
import PreparePrompt from './components/WorkflowSteps/PreparePrompt';
import Gogogo from './components/WorkflowSteps/Gogogo';
import ModeToggle from './components/ModeToggle';
import { ToastTypes } from './utils/shared';
import type { ToastType } from './utils/shared';
import { GogogoUtils } from './utils/GogogoUtils';

function Demo() {
  const [url, setUrl] = useState(GogogoUtils.getDemoScriptWebSite());
  const [scriptContent, setScriptContent] = useState(GogogoUtils.getDemoScript());
  const [promptContent, setPromptContent] = useState('');
  const [isAIMode, setIsAIMode] = useState(false);
  const [isDark, setIsDark] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setIsDark(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const toggleMode = () => {
    setIsAIMode(!isAIMode);
  };

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
      <ModeToggle isAIMode={isAIMode} onToggle={toggleMode} />
      <div className="workflow-container">
        <h1 className="workflow-title">Web Automation Workflow</h1>
        <PrepareExtension stepNumber={1} />
        <PrepareURL url={url} onUrlChange={setUrl} stepNumber={2} />
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

export default Demo;
