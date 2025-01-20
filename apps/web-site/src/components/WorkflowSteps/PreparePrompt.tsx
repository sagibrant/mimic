import React from 'react';

interface PreparePromptProps {
  promptContent: string;
  onPromptChange: (prompt: string) => void;
  stepNumber: number;
}

const PreparePrompt: React.FC<PreparePromptProps> = ({ 
  promptContent, 
  onPromptChange, 
  stepNumber 
}) => {
  return (
    <div className="workflow-step">
      <div className="step-header">
        <div className="step-number">{stepNumber}</div>
        <h2 className="step-title">Prompt (optional)</h2>
      </div>
      <div className="step-content">
        <div className="prompt-input-container">
          <textarea
            id="prompt-input"
            className="prompt-input"
            placeholder="Enter your automation requirements here..."
            value={promptContent}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={8}
          />
        </div>
        <p className="step-description">
          Describe what you want to automate, and our AI will handle the rest.
        </p>
      </div>
    </div>
  );
};

export default PreparePrompt;