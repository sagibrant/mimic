/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file StepAIAgent.tsx
 * @description 
 * Sidebar AI assistant panel component
 * 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect, useRef } from 'react';
import './StepAIAgent.css';
import { HumanMessage, SystemMessage } from 'langchain';
import { AIAgent, ChatMessage } from './AIAgent';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Ellipsis, Send } from 'lucide-react';
import { CryptoUtil, SettingUtils } from '@mimic-sdk/core';

interface StepAIAgentProps {
  runScript: (script: string, newStep: boolean) => Promise<unknown>;
}

export default function StepAIAgent({ runScript }: StepAIAgentProps) {
  // State
  const [userInput, setUserInput] = useState('');
  const [model, setModel] = useState('');
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    new SystemMessage("Hello! I'm your AI assistant. How can I help you today?"),
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
      setChatMessages(prev => [
        ...prev,
        new SystemMessage(`Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`),
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ai-agent-container bg-background text-foreground flex h-full flex-col">
      {/* Chat Messages Area */}
      <div ref={chatContainerRef} className="chat-messages flex-1 space-y-4 overflow-y-auto p-2">
        {chatMessages.map((message, index) => (
          <div
            key={index}
            className={['message mb-4', message.type === 'human' ? 'flex justify-end' : 'flex justify-start'].join(' ')}
          >
            <div
              className={[
                'max-w-[85%] rounded-2xl px-4 py-2',
                message.type === 'human'
                  ? 'message-human rounded-br-none'
                  : message.messageType === 'tool' || message.messageType === 'think'
                    ? 'message-secondary rounded-bl-none italic'
                    : 'message-default rounded-bl-none',
              ].join(' ')}
            >
              <p className="whitespace-pre-wrap">
                {typeof message.content === 'string'
                  ? message.content
                  : (message.content as Array<Record<string, unknown>>)
                      .map(block => (block['type'] === 'text' ? block['text'] as string : JSON.stringify(block)))
                      .join('\n')}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="ai-message flex justify-start">
            <div className="flex items-center space-x-2 rounded-2xl rounded-bl-none bg-gray-200 px-4 py-2 text-gray-800">
              <span className="loading-spinner h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600"></span>
              <span>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Fade effect between Chat Messages and User Input Area */}
      <div className="pointer-events-none relative w-full">
        <div className="absolute inset-x-0 bottom-0 h-4">
          <div className="from-background h-full bg-linear-to-t to-transparent"></div>
        </div>
      </div>

      {/* User Input Area */}
      <div className="user-input-area shrink-0 pt-2">
        {/* Input Area */}
        <div className="input-area mb-2">
          <div className="input-container flex items-end space-x-2">
            <Textarea
              ref={inputTextAreaRef}
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="max-h-32 min-h-24 flex-1 resize-none overflow-y-auto text-xs focus-visible:border-blue-500 focus-visible:shadow-none focus-visible:ring-1 focus-visible:ring-blue-500/40"
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
                <Select value={model} onValueChange={value => setModel(value)}>
                  <SelectTrigger size="sm" className="w-22">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map(option => (
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
              <Button type="button" onClick={handleSend} title="Send message" disabled={isLoading} size="icon-sm">
                {isLoading ? <Ellipsis /> : <Send />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
