import React from 'react';

interface PrepareURLProps {
  url: string;
  onUrlChange: (url: string) => void;
  stepNumber: number;
}

const PrepareURL: React.FC<PrepareURLProps> = ({ url, onUrlChange, stepNumber }) => {
  return (
    <div className="workflow-step">
      <div className="step-header">
        <div className="step-number">{stepNumber}</div>
        <h2 className="step-title">Your URL</h2>
      </div>
      <div className="step-content">
        <div className="url-input-container">
          <input
            type="url"
            id="url-input"
            className="url-input"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
          />
        </div>
        <p className="step-description">Enter the URL of the page you want to automate.</p>
      </div>
    </div>
  );
};

export default PrepareURL;