import React, { useState, useEffect, useRef } from 'react';
import './StepAIAgent.css';
import { HumanMessage, SystemMessage } from "langchain";
import { AIAgent, ChatMessage } from './AIAgent';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Ellipsis, Send } from 'lucide-react';
import { CryptoUtil, SettingUtils } from '@gogogo/shared';

interface StepAIAgentProps {
  runScript: (script: string, newStep: boolean) => Promise<any>;
}

export default function StepAIAgent({ runScript }: StepAIAgentProps) {
  // State
  const [userInput, setUserInput] = useState('');
  const [model, setModel] = useState('');
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    new SystemMessage('Hello! I\'m your AI assistant. How can I help you today?')
  ]);

  const agent = useRef<AIAgent | null>(null);

  // Refs
  const inputTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // init the models
  useEffect(() => {
    const aiSettings = SettingUtils.getSettings().aiSettings;
    const models = aiSettings.models.split(';').filter(s => s.length > 0);
    setModelOptions(models);
    if (models.length > 0) {
      setModel(models[0]);
    }
  }, [runScript]);

  useEffect(() => {
    if (!model) {
      agent.current = null;
      return;
    }
    const initAgent = async () => {
      const aiSettings = SettingUtils.getSettings().aiSettings;
      const apiKey = await CryptoUtil.decrypt(aiSettings.apiKey);
      agent.current = new AIAgent(aiSettings.baseURL, apiKey, model, runScript);
    };
    initAgent();
  }, [model, runScript]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Event handlers
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if (!userInput.trim() || isLoading || !agent.current) {
      return;
    }
    try {
      const userInputValue = userInput.trim();
      const userMessage = new HumanMessage(userInputValue);

      setChatMessages(prev => [...prev, userMessage]);
      setUserInput('');
      setIsLoading(true);
      for await (const msg of agent.current.invoke(userInputValue)) {
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

  return (
    <div className="ai-agent-container flex flex-col h-full bg-background text-foreground">
      {/* Chat Messages Area */}
      <div ref={chatContainerRef} className="chat-messages flex-1 overflow-y-auto p-2 space-y-4">
        {chatMessages.map((message, index) => (
          <div key={index} className={['message mb-4',
            message.type === 'human' ? 'flex justify-end' : 'flex justify-start'
          ].join(' ')}>
            <div className={[
              'rounded-2xl px-4 py-2 max-w-[85%]',
              message.type === 'human'
                ? 'message-human rounded-br-none'
                : message.messageType === 'tool' || message.messageType === 'think'
                  ? 'message-secondary italic rounded-bl-none'
                  : 'message-default rounded-bl-none'
            ].join(' ')}>
              <p className="whitespace-pre-wrap">{typeof message.content === 'string' ? message.content : (message.content as any[]).map(block => block.type === 'text' ? block.text : JSON.stringify(block)).join('\n')}</p>
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
          <div className="h-full bg-linear-to-t from-background to-transparent"></div>
        </div>
      </div>

      {/* User Input Area */}
      <div className="user-input-area pt-2 shrink-0">
        {/* Input Area */}
        <div className="input-area mb-2">
          <div className="input-container flex items-end space-x-2">
            <Textarea
              ref={inputTextAreaRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 min-h-24 max-h-32 resize-none overflow-y-auto text-xs focus-visible:ring-1 focus-visible:ring-blue-500/40 focus-visible:border-blue-500 focus-visible:shadow-none"
              rows={2}
            />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="bottom-controls bg-background pt-1">
          <div className="flex flex-row items-center justify-between gap-2">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              {/* Agent/Chat Mode Selection */}
              <div className="flex items-center gap-2">
                <Select
                  value={model}
                  onValueChange={(value) => setModel(value)}
                >
                  <SelectTrigger size="sm" className="w-22">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Send Button */}
              <Button
                type="button"
                onClick={handleSend}
                title="Send message"
                disabled={isLoading}
                size="icon-sm"
              >
                {isLoading ? (<Ellipsis />) : (<Send />)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
