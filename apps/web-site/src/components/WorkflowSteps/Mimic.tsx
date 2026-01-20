import React from 'react';
import { MimicUtils } from '../../utils/MimicUtils';
import { ToastTypes } from '../../utils/shared';
import type { ToastType } from '../../utils/shared';

interface MimicProps {
  isAIMode: boolean;
  scriptContent: string;
  promptContent: string;
  url: string;
  stepNumber: number;
  showToast: (type: ToastType, message: string, description?: string) => void;
}

const Mimic: React.FC<MimicProps> = ({
  isAIMode,
  scriptContent,
  promptContent,
  url,
  stepNumber,
  showToast
}) => {

  // Handle script execution
  const handleRunScript = async () => {
    console.log('Running script:', scriptContent);
    try {
      showToast(
        ToastTypes.Info,
        'Script Executed started',
        'Your automation script is being executed.'
      );
      const result = await MimicUtils.runScript(scriptContent, url);
      if (result) {
        console.log('Script result:', result);
        showToast(
          ToastTypes.Success,
          'Script Executed Successfully',
          `Your automation script has been executed successfully with result ${typeof result === 'object' ? JSON.stringify(result) : String(result)}`
        );
      } else {
        console.log('Script executed with no result.');
        showToast(
          ToastTypes.Success,
          'Script Executed',
          'Your automation script has been executed successfully.'
        );
      }
    } catch (error) {
      console.error('Error running script:', error);
      showToast(
        ToastTypes.Error,
        'Script Execution Failed',
        error instanceof Error ? error.stack || error.message : 'An unexpected error occurred.'
      );
    }
  };

  // Handle AI agent execution
  const handleRunAI = async () => {
    console.log('Running AI agent with prompt:', promptContent);
    try {
      // Mock AI agent execution
      console.log('AI agent is processing your request...');
      console.log('URL:', url);
      console.log('Prompt:', promptContent);
      // showToast(
      //   ToastTypes.Info,
      //   'AI Automation Started',
      //   'Our AI agent is now executing your automation request.'
      // );
      // // Simulate some processing time
      // await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock success response
      showToast(
        ToastTypes.Info,
        'AI Coming Soon',
        "Thanks for trying Mimic AI — it's still in development and will be available soon."
      );
    } catch (error) {
      console.error('Error running AI agent:', error);
      showToast(
        ToastTypes.Error,
        'AI Execution Error',
        error instanceof Error ? error.message : 'An unexpected error occurred while running the AI agent.'
      );
    }
  };

  return (
    <div className="workflow-step">
      <div className="step-header">
        <div className="step-number">{stepNumber}</div>
        <h2 className="step-title">{'Mimic'}</h2>
      </div>
      <div className="step-content">
        <button
          className="run-btn"
          onClick={isAIMode ? handleRunAI : handleRunScript}
        >
          {'Go'}
        </button>
        <p className="step-description">
          {isAIMode
            ? 'Click the button above to let our AI agent handle your request.'
            : 'Click the button above to execute the script.'
          }
        </p>
      </div>
    </div>
  );
};

export default Mimic;
