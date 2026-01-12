import React, { useState, useEffect, useRef, useMemo } from 'react';
import './StepAIAgent.css';
import { HumanMessage, SystemMessage } from "langchain";
import { AgentMode, AIAgent, ChatMessage } from './AIAgent';

interface StepAIAgentProps {
  runScript: (script: string, newStep: boolean) => Promise<any>;
}

interface ModeOption {
  name: string;
  value: AgentMode;
}

export default function StepAIAgent({ runScript }: StepAIAgentProps) {
  // State
  const [userInput, setUserInput] = useState('');
  const [agentMode, setAgentMode] = useState<AgentMode>('agent');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([new SystemMessage('Hello! I\'m your AI assistant. How can I help you today?')]);
  const agent = useMemo(() => {
    const aiAgent = new AIAgent(runScript);
    return aiAgent;
  }, [runScript]);

  // Refs
  const inputTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const modeOptions: ModeOption[] = [
    { name: "Agent", value: 'agent' },
    { name: "Chat", value: 'chat' }
  ];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Event handlers
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter key for new line, handled by default behavior
    // Shift + Enter also for new line, handled by default behavior
  };

  const handleSend = async () => {
    if (!userInput.trim() || isLoading) {
      return;
    }
    try {
      const userInputValue = userInput.trim();
      const userMessage = new HumanMessage(userInputValue);

      setChatMessages(prev => [...prev, userMessage]);
      setUserInput('');
      setIsLoading(true);
      for await (const msg of agent.invoke(userInputValue, agentMode)) {
        setChatMessages(prev => [...prev, msg]);
      }
      if (inputTextAreaRef.current) {
        inputTextAreaRef.current.focus();
      }
    } catch (error) {
      console.error('Error in AI agent processing:', error);
      setChatMessages(prev => [...prev, new SystemMessage(`Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`)]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInspect = async () => {
    console.log('Inspect functionality triggered');
    await agent.toolTest();
  };

  return (
    <div className="ai-agent-container flex flex-col h-full bg-transparent">
      {/* Chat Messages Area */}
      <div ref={chatContainerRef} className="chat-messages flex-1 overflow-y-auto p-2 space-y-4">
        {chatMessages.map((message, index) => (
          <div key={index} className={['message mb-4',
            message.type === 'human' ? 'user-message flex justify-end' :
              message.messageType === 'tool' ? 'tool-message flex justify-start' :
                message.messageType === 'think' ? 'think-message flex justify-start' :
                  'ai-message flex justify-start'
          ].join(' ')}>
            <div className={[
              'rounded-2xl px-4 py-2 max-w-[85%]',
              message.type === 'human'
                ? 'bg-blue-500 text-white rounded-br-none'
                : message.messageType === 'tool'
                  ? 'bg-purple-100 text-purple-800 rounded-bl-none border border-purple-200'
                  : message.messageType === 'think'
                    ? 'bg-yellow-50 text-yellow-800 rounded-bl-none border border-yellow-200 italic'
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'
            ].join(' ')}>
              <p>{typeof message.content === 'string' ? message.content : (message.content as any[]).map(block => block.type === 'text' ? block.text : JSON.stringify(block)).join('\n')}</p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="ai-message flex justify-start">
            <div className="bg-gray-200 text-gray-800 rounded-2xl px-4 py-2 rounded-bl-none flex items-center space-x-2">
              <span className="loading-spinner animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></span>
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Fade effect between Chat Messages and User Input Area */}
      <div className="pointer-events-none relative w-full">
        <div className="absolute inset-x-0 bottom-0 h-4">
          <div className="h-full bg-linear-to-t from-(--vscode-editor-background,#ffffff) to-transparent"></div>
        </div>
      </div>

      {/* User Input Area */}
      <div className="user-input-area p-2 shrink-0">
        {/* Input Area */}
        <div className="input-area mb-4">
          <div className="input-container flex items-end space-x-2">
            <textarea
              ref={inputTextAreaRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 border rounded-lg p-2 min-h-24 max-h-32 resize-none overflow-y-auto"
              rows={2}
            ></textarea>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="bottom-controls">
          <div className="flex flex-row items-center justify-between gap-2">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              {/* Agent/Chat Mode Selection */}
              <div className="flex items-center">
                <select
                  value={agentMode}
                  onChange={(e) => setAgentMode(e.target.value === 'chat' ? 'chat' : 'agent')}
                  className="w-22"
                >
                  {modeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.name}</option>
                  ))}
                </select>
                <label htmlFor="model-select">Chat</label>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Inspect Button */}
              <button
                onClick={handleInspect}
                title="Inspect elements on the page"
                className="icon-button"
              >
                🔍
              </button>

              {/* Send Button */}
              <button
                onClick={handleSend}
                title="Send message"
                disabled={isLoading}
                className="send-button"
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

