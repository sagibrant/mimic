/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file AIClient.ts
 * @description 
 * Class for AIClient
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

import * as api from "@gogogo/shared";
import { Utils } from "@gogogo/shared";
import { ChannelBase } from "../Channel";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { ClientOptions } from "openai";

export class AIClient extends ChannelBase implements api.AIClient {
  private _openai: OpenAI | undefined = undefined;
  private _model: string | undefined;
  private _systemPrompt: string | undefined;
  private _history: Array<ChatCompletionMessageParam> = [];

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  init(options?: Record<string, unknown>): this {
    this._openai = undefined;
    this._model = undefined;
    this._systemPrompt = undefined;
    this._history = [];
    if (options) {
      this._openai = new OpenAI({ ...(options as ClientOptions), dangerouslyAllowBrowser: true });
    }
    return this;
  }

  setModel(model: string): this {
    this._model = model;
    return this;
  }

  setSystemPrompt(prompt: string): this {
    this._systemPrompt = prompt;
    return this;
  }

  async chat(message: string): Promise<string | null> {
    const settings = await api.SettingUtils.getSettings().aiSettings;
    if (!this._openai) {
      if (!settings.baseURL) {
        throw new Error('Invalid baseURL');
      }
      if (!settings.apiKey) {
        throw new Error('Invalid apiKey');
      }
      this._openai = new OpenAI({
        baseURL: settings.baseURL,
        apiKey: settings.apiKey,
        dangerouslyAllowBrowser: true
      });
    }

    if (!this._model) {
      const models = settings.models.split(';').filter(m => m.length > 0);
      this._model = models[0];
    }
    if (!this._model) {
      throw new Error('Invalid model');
    }
    const messages: Array<ChatCompletionMessageParam> = [];
    // first chat, init with system if exists
    if (this._history.length === 0 && !Utils.isEmpty(this._systemPrompt)) {
      this._history.push({ content: this._systemPrompt, role: 'system' });
    }
    messages.push(...this._history);
    const newMessage: ChatCompletionMessageParam = { content: message, role: 'user' };
    messages.push(newMessage);
    const response = await this._openai.chat.completions.create({
      model: this._model,
      messages: messages,
      temperature: 0.5,
      top_p: 0.8,
      max_tokens: 4096,
      stream: false,
      n: 1
    });

    if (response && response.choices.length > 0 && response.choices[0].message) {
      this._history.push(newMessage);
      this._history.push(Utils.deepClone(response.choices[0].message));
      return response.choices[0].message.content;
    }
    else {
      return null;
    }
  }

}
