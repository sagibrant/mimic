/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file AIAgentUtils.ts
 * @description 
 * AI utility classes and functions
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
import { Jimp } from "jimp";
import { Logger, Utils } from "@mimic-sdk/core";
import { BaseMessage, AIMessage, ToolMessage, summarizationMiddleware, ReactAgent, HumanMessage } from "langchain";
import { ChatOpenAI } from '@langchain/openai';
import { createAgent, createMiddleware, tool } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import * as z from "zod/v3";
import { SidebarUtils } from "./SidebarUtils";

export interface ChatMessage extends BaseMessage {
  messageType?: 'think' | 'tool' | 'final';
}

export const UIElement = z.object({
  type: z.string().describe("The type of the element (e.g., button, input, link, checkbox, dropdown, image, etc.)"),
  description: z.string().describe("A concise description of the element's purpose or content."),
  bbox: z.array(z.number()).describe("The bounding box of the element [xmin, ymin, xmax, ymax]")
});

export const UIPageDetails = z.object({
  summary: z.string().describe("The summary of the main topic of the screenshot (maximum 50 words)"),
  answer: z.string().nullable().optional().describe("Optional answer to the user's question based on the screenshot; use null when not applicable"),
  elements: z.array(UIElement).describe("Array of UI elements found in the screenshot that match the user's description (maximum 20 items)"),
  errors: z.array(z.string()).nullable().optional().describe("Optional array of error messages or null (e.g., no matching elements found, screenshot not related to the user's query, image processing issues)")
});

export class AIAgent {
  private readonly logger: Logger;
  private runScript: (script: string, newStep: boolean) => Promise<any>;
  private llm_chat: ChatOpenAI;
  private llm_vision: ChatOpenAI;
  private agentInstance?: ReactAgent;

  constructor(baseURL: string, apiKey: string, model: string, runScript: (script: string, newStep: boolean) => Promise<any>) {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "AIAgent" : this.constructor?.name;
    this.logger = new Logger(prefix);
    this.runScript = runScript;
    this.llm_chat = this.createModel(baseURL, apiKey, model, 'general');
    this.llm_vision = this.createModel(baseURL, apiKey, model, 'vision');
  }

  /** ==================================================================================================================== */
  /** ====================================================== Prompt ====================================================== */
  /** ==================================================================================================================== */
  private async loadVisionSystemPrompt() {
    const systemPrompt = `
## Role:
You are an AI assistant that helps identify UI elements on a webpage screenshot based on the user's description.

## Objective:
- Summarize the screenshot content.
- Answer the user's question directly from the screenshot when the request is informational.
- Identify elements that match the user's description when the task is interactive.
- Provide element coordinates that can be resolved to DOM elements.

## Output Requirements:
- Return at most 20 elements; prioritize the most significant and relevant.
- Use a normalized 0-1000 coordinate system:
  - bbox MUST be [xmin, ymin, xmax, ymax] with each value in 0-1000
- Ensure bounding boxes tightly encompass the entire target element.
- Round bbox values to integers; clamp to image bounds.
- Eliminate duplicates: if boxes overlap heavily (IoU > 0.5), keep the best single match.
- Internally estimate confidence for each candidate; select the highest-confidence, most relevant elements.

## Output Format:
\`\`\`json
{
  "summary": string,
  "answer": string,
  "elements": {
    "type": string,
    "description": string,
    "bbox": [number, number, number, number]
  }[], 
  "errors": string[]
}
\`\`\`

Fields:
* \`summary\`: Summary of the main topic of the screenshot (≤50 words)
* \`answer\`: Direct answer to the user's question based on the screenshot (optional)
* \`elements\`: Matched elements based on the user's description (≤20 items)
* \`elements[].type\`: The element type (e.g., button, input, link, checkbox, dropdown, image, text, etc.)
* \`elements[].description\`: A concise description of the element's purpose or visible text/content
* \`elements[].bbox\`: The bounding box [xmin, ymin, xmax, ymax] with each value in 0-1000
* \`errors\`: Optional errors (e.g., no matching elements found)

## Decision Policy:
* If the request is informational (Q&A), provide \`answer\` and leave \`elements\` empty.
* If the request is interactive (element finding/interaction), populate \`elements\` with the best-matching UI elements using normalized integer bboxes.
* Prefer elements that are visually salient, enabled/interactive, and semantically aligned with the description; include visible text in \`description\` when helpful.
* When multiple candidates exist, choose those with higher internal confidence and avoid near-duplicates.

## Examples:
* Scenario 1: Login page element detection
  * User message:
  "Find the login button and the input fields for username and password."
  * Response:
  \`\`\`json
  {
    "summary": "Login page with username/password and a submit button",
    "answer": null,
    "elements": [
      {
        "type": "input",
        "description": "Username input field",
        "bbox": [98, 192, 402, 242]
      },
      {
        "type": "input",
        "description": "Password input field",
        "bbox": [98, 252, 402, 302]
      },
      {
        "type": "button",
        "description": "Login button",
        "bbox": [420, 252, 520, 302]
      }
    ],
    "errors": []
  }
  \`\`\`

* Scenario 2: Weather forecast scenario
  * User message is 
  "What is the weather today according to this page?"
  * Response:
  \`\`\`json
  {
    "summary": "Weather forecast page",
    "answer": "Sunny with a high of 75°F and a low of 55°F.",
    "elements": [],
    "errors": []
  }
  \`\`\`

* Scenario 3: Page does not contain the required elements
  * User message is 
  "I want to buy a flight ticket from New York to San Francisco. Find the elements required for this action."
  * Response when no element is found:
  \`\`\`json
  {
    "summary": "Login page",
    "answer": "This page does not contain elements for booking a flight ticket. It appears to be a login page. You may need to log in first.",
    "elements": [],
    "errors": ["No elements related to flight booking were found"]
  }
  \`\`\`
`;
    return systemPrompt;
  }

  private async loadChatSystemPrompt() {
    const api_doc = await this.loadMimicAPIDefinition();
    const systemPrompt = `## Role:
You are a versatile professional in web testing and automation. Your outstanding contributions will impact the user experience of billions of users.

## Objective:
* Analyze the user's request and plan actions.
* Decide when to use screenshot analysis versus DOM interaction.
* Write and run Mimic JavaScript to achieve the user's goal.

## Important
* Use Mimic extension tools only; automation must be via Mimic APIs.
* Review APIs with get_mimic_api_definition and get_mimic_api_document when unsure.
* For Q&A, prefer analyze_page_with_vision to read from the screenshot.
* For interaction, use analyze_page_with_vision → get_element_from_point → run_mimic_script.
* Respond using the user's language.

## Tool Selection Heuristics:
* Start by calling get_page_info to understand URL, title, and status.
* If the request is informational (Q&A about page content), call analyze_page_with_vision with a direct question and return the answer.
* If the request is interactive (click, fill, select, etc.):
  1) Call analyze_page_with_vision with a concise element description.
  2) Choose the best element and pass it to get_element_from_point to obtain its Mimic locator script.
  3) Compose a minimal Mimic JavaScript using that locator and call run_mimic_script.
* After navigation or tab changes, re-check context via get_page_info and page.sync before further actions.
* If a script fails, review the definitions/documents via tools, fix the script, and retry (max 2 retries). If repeated failure, fall back to analyze_page_with_vision Q&A when appropriate.

## Mimic API Guidelines:
* Use Mimic API to interact with the page and browser, make sure write safe and correct javascript code
* Use PURE JavaScript script. Although TypeScript definitions of Mimic API are provided (defined in types.d.ts), DO NOT use TypeScript-specific syntax (type annotations, interfaces, type aliases, enums)
* Use async/await for all asynchronous operations
* Test scripts in your mind before running them
* If scripts have errors, try to review the Mimic api definitions using tool get_mimic_api_definition and the Mimic api document with examples using tool get_mimic_api_document and fix the errors
* Global variables:
  (1) ai: Corresponds to the AIClient interface in types.d.ts, representing the AIClient object (use methods defined in types.d.ts), e.g., const response = await ai.init().setModel('gpt-4o').chat('hello');
  (2) browser: Corresponds to the Browser interface in types.d.ts, representing the current browser (use methods defined in types.d.ts), e.g., await browser.page().first().bringToFront();
  (3) page: Corresponds to the Page interface in types.d.ts, representing the current page (use methods defined in types.d.ts), e.g., await page.element("#id").nth(0).click();
  (4) console: For logging only (browser native API)
* Global functions (use with JavaScript syntax):
  (1) expect(actual: unknown): Returns an Expect instance (defined in types.d.ts), e.g., await expect(1 === 1).toBeTruthy()
  (2) wait(timeout: number): Returns a Promise for waiting, e.g., await wait(2000)
* Prohibited Operations:
  (1) DO NOT use third-party libraries (Selenium, Playwright, Puppeteer—NONE are supported)
  (2) DO NOT use browser native APIs except console (e.g., document, window, document.querySelector, fetch are forbidden)
  (3) DO NOT import or require any modules
  (3) DO NOT use TypeScript-specific syntax (type annotations like "let x: string", interfaces, type aliases, enums)
  (4) DO NOT add un-requested logic (auto-navigation, extra wait time, redundant console.log—only implement user-specified features)

## Script Authoring Rules:
* Keep scripts minimal, deterministic, and directly tied to the user's goal.
* Prefer explicit readiness checks over long waits; use page.sync after navigation.
* Use locator chains (filter/prefer/nth/first/last) to target complex elements.
* Use {mode: 'cdp'} for trusted interactions when necessary (enable via await browser.attachDebugger()).
* Use expect for validations; include only essential assertions.

## ReAct Execution Pattern:
* Thought: Briefly explain the next action and why.
* Tool Call Justification: One short sentence explaining why this tool is appropriate now.
* Action: Call the appropriate tool with precise inputs.
* Observation: Summarize only key results from the tool; avoid verbose output unless necessary.
* Action: If interactive, generate a minimal Mimic script and run it via run_mimic_script.
* Final: Report the outcome in user's language. If applicable, include concise JSON results.

## Mimic API Reference (types.d.ts):
\`\`\`typescript
${api_doc}
\`\`\`

`;
    return systemPrompt;
  };

  /** ==================================================================================================================== */
  /** ================================================= Define the tools ================================================= */
  /** ==================================================================================================================== */
  private async loadMimicAPIDocument() {
    try {
      const docURL = chrome.runtime.getURL('assets/docs/README.md');
      const response = await fetch(docURL);
      if (!response.ok) {
        throw new Error(`Failed to load API document: HTTP ${response.status}`);
      }
      const doc = await response.text();
      return doc;
    } catch (error) {
      this.logger.error('Error loading API document:', error);
      throw new Error(`Error loading API document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async loadMimicAPIDefinition() {
    try {
      const apiURL = chrome.runtime.getURL('assets/types/types.d.ts');
      const response = await fetch(apiURL);
      if (!response.ok) {
        throw new Error(`Failed to load API definition: HTTP ${response.status}`);
      }
      const doc = await response.text();
      return doc;
    } catch (error) {
      this.logger.error('Error loading API definition:', error);
      throw new Error(`Error loading API definition: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzePageWithVisionModel(userPrompt?: string) {
    try {
      const visionModel = this.llm_vision;
      const base64Image = await SidebarUtils.engine.capturePage();// startWith data:image/jpeg;base64,
      const base64Prefix = 'data:image/jpeg;base64,';
      // use Jimp to load the base64Image and get the image size
      const base64str = base64Image.startsWith(base64Prefix) ? base64Image.slice(base64Prefix.length) : base64Image;
      // Browser-compatible base64 decoding (Buffer is Node.js only)
      const binaryString = atob(base64str);
      const imageBuffer = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        imageBuffer[i] = binaryString.charCodeAt(i);
      }
      const jimpImage = await Jimp.fromBuffer(imageBuffer.buffer);
      if (!jimpImage) {
        throw new Error('Failed to load image from buffer');
      }

      const systemPrompt = await this.loadVisionSystemPrompt();
      const userMessage = `This is the page screenshot. You need to analyze the screenshot, summary the screenshot content, identify the UI elements, recognize the texts${userPrompt ? ' and answer user\'s request.' : '.'}
${!userPrompt ? "" : `## User Request:
${userPrompt}`}
Return the results in the specified JSON schema format, limiting to the 20 most significant elements.`

      const messages = [{
        role: "system",
        content: systemPrompt
      }, {
        role: "user",
        content: [
          {
            type: "text", text: userMessage
          },
          {
            type: "image_url",
            image_url: {
              url: base64Image,
              detail: 'high'
            }
          }
        ]
      }];

      const response = await visionModel.withStructuredOutput(UIPageDetails).invoke(messages);

      if (response && response.elements) {
        const width = jimpImage.width;
        const height = jimpImage.height;
        response.elements = response.elements.map(elem => {
          // x1, y1, x2, y2 -> 0-1000
          const bbox = [
            Math.round((elem.bbox[0] * width) / 1000),
            Math.round((elem.bbox[1] * height) / 1000),
            Math.round((elem.bbox[2] * width) / 1000),
            Math.round((elem.bbox[3] * height) / 1000)
          ];
          return { ...elem, bbox };
        });
      }

      return response;
    } catch (err) {
      console.error('Error in identifyElementsWithVision:', err);
      return {
        "summary": "",
        "elements": [],
        "errors": [err instanceof Error ? err.message : String(err)]
      };
    }
  }

  private getMimicAPIDocument = tool(
    async () => {
      const doc = await this.loadMimicAPIDocument() || '';
      return doc;
    },
    {
      name: "get_mimic_api_document",
      description: "Get the API documentation for Mimic extension"
    }
  );

  private getMimicAPIDefinition = tool(
    async () => {
      const doc = await this.loadMimicAPIDefinition() || '';
      return doc;
    },
    {
      name: "get_mimic_api_definition",
      description: "Get the TypeScript API definitions for Mimic extension"
    }
  );

  private runMimicScript = tool(
    async ({ script }) => {
      try {
        const result = await this.runScript(script, true);
      let content = 'The script run completed';
      if (result !== undefined && result !== null) {
        let resultStr = typeof result === 'object' ? `
\`\`\`json
${JSON.stringify(result)}
\`\`\`
`: String(result);
        content = `The script run completed with result: ${resultStr}`;
      }
      return [content, result];
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const content = `Script failed: ${msg}\nPlease use Mimic API only and avoid third-party automation libraries or browser-native DOM/Network APIs.`;
        return [content, null];
      }
    },
    {
      name: "run_mimic_script",
      description: "Run the script in Mimic extension",
      responseFormat: 'content_and_artifact',
      schema: z.object({
        script: z.string().describe("The script to run")
      })
    }
  );

  private getPageInfo = tool(
    async () => {
      const url = await SidebarUtils.engine.getPageUrl();
      const title = await SidebarUtils.engine.getPageTitle();
      const status = await SidebarUtils.engine.getPageStatus();
      const content = `The page information: url=${url}, title=${title}, status=${status}`;
      return [content, { url, title, status }];
    },
    {
      name: "get_page_info",
      description: "Get the information of the current page { url, title, status }",
      responseFormat: 'content_and_artifact'
    }
  );

  private analyzePageWithVision = tool(
    async ({ userPrompt }) => {
      const result = await this.analyzePageWithVisionModel(userPrompt);
      const content = `The analyze result for this page: 
\`\`\`json
${JSON.stringify(result)}
\`\`\`
`;
      return [content, result];
    },
    {
      name: "analyze_page_with_vision",
      description: "Analyze the current page screenshot using computer vision and return the answer of user's question or find the identified UI elements based on the user's description",
      responseFormat: 'content_and_artifact',
      schema: z.object({
        userPrompt: z.string().optional().describe("User's question or description for analyzing the page. e.g., 'What is the weather today according to this page?' or 'Find the login button and input fields in this page.'")
      })
    }
  );

  private getElementFromPoint = tool(
    async ({ bbox }) => {
      const x = (bbox[0] + bbox[2]) / 2;
      const y = (bbox[1] + bbox[3]) / 2;
      const elem = await SidebarUtils.engine.getElementFromPoint(x, y);
      const locatorScript = `${elem.pageScript}.${elem.elementScript}`;
      const content = `The element in the given position is: 
\`\`\`javascript
${locatorScript}
\`\`\`

The example script for this element:

\`\`\`javascript
// highlight the element
await ${locatorScript}.highlight();

// by default, use web event based click/fill
// click with event
await ${locatorScript}.click();
// set value with event
await ${locatorScript}.fill('abcde');

// use {mode: 'cdp'} to simulate the click/fill using ChromeDevTool protocol
// enable cdp
await browser.attachDebugger();
// click with cdp (must enable cdp before using cdp mode)
await ${locatorScript}.click({mode: 'cdp'});
// set value with cdp (must enable cdp before using cdp mode)
await ${locatorScript}.fill('abcde', {mode: 'cdp'});
\`\`\`
`;
      return [content, elem];
    },
    {
      name: "get_element_from_point",
      description: "Get the element description from the give bounding box [xmin, ymin, xmax, ymax]",
      responseFormat: 'content_and_artifact',
      schema: UIElement
    }
  );

  /** ==================================================================================================================== */
  /** ==================================================== middleware ==================================================== */
  /** ==================================================================================================================== */
  private handleToolErrors = createMiddleware({
    name: "HandleToolErrors",
    wrapToolCall: async (request, handler) => {
      try {
        return await handler(request);
      } catch (error) {
        const toolName = request.toolCall.name;
        const errMsg = error instanceof Error ? (error.stack || error.message) : String(error);
        let guidance = "Tool error occurred. ";
        if (toolName === "run_mimic_script") {
          guidance += "Use Mimic API only. Review API definition and document. Simplify the script or consider analyze_page_with_vision for Q&A.";
        } else if (toolName === "get_element_from_point") {
          guidance += "Verify bbox coordinates in normalized 0-1000 space and consider alternative candidate elements.";
        } else if (toolName === "analyze_page_with_vision") {
          guidance += "Refine the userPrompt or reduce the number of requested elements.";
        }
        return new ToolMessage({
          content: `${guidance} (${errMsg})`,
          tool_call_id: request.toolCall.id!,
        });
      }
    },
  });

  /** ==================================================================================================================== */
  /** =================================================== llm instance =================================================== */
  /** ==================================================================================================================== */
  private createModel(baseURL: string, apiKey: string, model: string, type: 'vision' | 'general' = 'general') {
    try {
      if (!model) {
        throw new Error('Model not configured');
      }
      if (!baseURL) {
        throw new Error('Base URL not configured');
      }
      if (!apiKey) {
        throw new Error('API key not configured');
      }

      return new ChatOpenAI({
        model: model,
        configuration: {
          baseURL: baseURL,
          apiKey: apiKey,
          dangerouslyAllowBrowser: true,
        },
        temperature: type === 'vision' ? 0 : 0.3, // Lower temperature for vision tasks for more consistent results
        topP: 0.8,
        maxTokens: 10240,
        streaming: type === 'general', // Enable streaming only for general chat model, keep vision model with full response
      });
    } catch (error) {
      this.logger.error(`Error getting ${type} model:`, error);
      throw new Error(`Failed to initialize ${type} model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  private async createAgent() {
    const checkpointer = new MemorySaver();
    const model = this.llm_chat;
    const systemPrompt = await this.loadChatSystemPrompt();
    const agent = createAgent({
      model: model,
      tools: [this.getPageInfo, this.analyzePageWithVision, this.getElementFromPoint, this.getMimicAPIDocument, this.getMimicAPIDefinition, this.runMimicScript],
      middleware: [this.handleToolErrors, summarizationMiddleware({
        model: model,
        trigger: { tokens: 10240 }, // Updated from maxTokensBeforeSummary
        keep: { messages: 20 }, // Updated from messagesToKeep
      })] as const,
      checkpointer,
      systemPrompt: systemPrompt
    });
    return agent;
  }

  /** ==================================================================================================================== */
  /** ====================================================== methods ===================================================== */
  /** ==================================================================================================================== */

  private toChatMessage(messages: BaseMessage[]): ChatMessage[] {
    try {
      this.logger.log('toChatMessage', messages);
      if (!messages || messages.length === 0) {
        throw new Error('No messages provided');
      }
      const getMsgContent = (msg: BaseMessage): string => {
        if (!msg.content) return '';
        const content = typeof msg.content === 'string' ? msg.content
          : msg.content.map((block) => block.type === 'text' ? block.text : JSON.stringify(block, null, 2)).join('\n');

        return content;
      };

      const lastMessage = messages[messages.length - 1];

      if (lastMessage.type === 'ai') {
        // call tool
        const aiMessage = lastMessage as AIMessage;
        if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
          const chatMsgs = [];
          const toolCalls = aiMessage.tool_calls;
          for (const toolCall of toolCalls) {
            let toolCallMsg = '';
            switch (toolCall.name) {
              case 'get_mimic_api_document': {
                toolCallMsg = 'Loading Mimic API documentation…';
                break;
              }
              case 'get_mimic_api_definition': {
                toolCallMsg = 'Loading Mimic API definitions…';
                break;
              }
              case 'run_mimic_script': {
                if (toolCall.args?.script) {
                  toolCallMsg = `Executing script:
\`\`\`javascript
 ${toolCall.args?.script}
\`\`\``;
                }
                else {
                  toolCallMsg = `Executing script…`;
                }
                break;
              }
              case 'get_page_info': {
                toolCallMsg = 'Retrieving page info…';
                break;
              }
              case 'analyze_page_with_vision': {
                toolCallMsg = 'Analyzing page screenshot…';
                break;
              }
              case 'get_element_from_point': {
                toolCallMsg = 'Resolving element from bbox coordinates…';
                break;
              }
              default:
                toolCallMsg = `Unrecognized tool call: ${toolCall.name}`;
            }
            const chatMessage = new AIMessage(`${toolCallMsg}`) as ChatMessage;
            chatMessage.messageType = 'tool';
            chatMsgs.push(chatMessage);
          }
          return chatMsgs;
        }
        else if (aiMessage.content) {
          const content = getMsgContent(aiMessage);
          if (aiMessage.response_metadata && aiMessage.response_metadata.finish_reason === 'stop') {
            const chatMessage = new AIMessage(content) as ChatMessage;
            chatMessage.messageType = 'final';
            return [chatMessage];
          }
          else {
            const chatMessage = new AIMessage(`Thinking:\n${content}`) as ChatMessage;
            chatMessage.messageType = 'think';
            return [chatMessage];
          }
        }
      }
      else if (lastMessage.type === 'tool') {
        const toolMessage = lastMessage as ToolMessage;
        let toolCallResultMsg = '';
        switch (toolMessage.name) {
          case 'get_mimic_api_document': {
            toolCallResultMsg = 'API documentation loaded';
            break;
          }
          case 'get_mimic_api_definition': {
            toolCallResultMsg = 'API definitions loaded';
            break;
          }
          case 'run_mimic_script': {
            if (toolMessage.artifact) {
              const jsonArtifact = JSON.stringify(toolMessage.artifact, null, 2);
              if (jsonArtifact) {
                toolCallResultMsg = `Script completed. Result:
\`\`\`json
${jsonArtifact}
\`\`\``;
              }
              else {
                toolCallResultMsg = 'Script completed';
              }
            }
            else {
              toolCallResultMsg = 'Script completed';
            }
            break;
          }
          case 'get_page_info': {
            if (toolMessage.artifact) {
              const jsonArtifact = JSON.stringify(toolMessage.artifact, null, 2);
              if (jsonArtifact) {
                toolCallResultMsg = `Page info:
\`\`\`json
${jsonArtifact}
\`\`\``;
              }
              else {
                toolCallResultMsg = 'Page info retrieved';
              }
            }
            else {
              toolCallResultMsg = 'Page info retrieved';
            }
            break;
          }
          case 'analyze_page_with_vision': {
            if (toolMessage.artifact) {
              const jsonArtifact = JSON.stringify(toolMessage.artifact, null, 2);
              if (jsonArtifact) {
                toolCallResultMsg = `Vision analysis:
\`\`\`json
${jsonArtifact}
\`\`\``;
              }
              else {
                toolCallResultMsg = 'Vision analysis completed';
              }
            }
            else {
              toolCallResultMsg = 'Vision analysis completed';
            }
            break;
          }
          case 'get_element_from_point': {
            if (toolMessage.artifact) {
              const jsonArtifact = JSON.stringify(toolMessage.artifact, null, 2);
              if (jsonArtifact) {
                toolCallResultMsg = `Element resolved:
\`\`\`json
${jsonArtifact}
\`\`\``;
              }
              else {
                toolCallResultMsg = 'Element resolved from coordinates';
              }
            }
            else {
              toolCallResultMsg = 'Element resolved from coordinates';
            }
            break;
          }
          default: {
            const content = getMsgContent(toolMessage) || 'Tool execution completed';
            toolCallResultMsg = content;
          }
        }
        const chatMessage = new AIMessage(`${toolCallResultMsg}`) as ChatMessage;
        chatMessage.messageType = 'tool';
        return [chatMessage];
      }
      else if (lastMessage.content) {
        const content = getMsgContent(lastMessage);
        const chatMessage = new AIMessage(`${content}`) as ChatMessage;
        chatMessage.messageType = 'final';
        return [chatMessage];
      }
      return [];
    } catch (error) {
      this.logger.error('Error formatting chat message:', error);
      return [];
    }
  }

  async* invoke(message: string) {
    const userMessage = new HumanMessage(message);

    if (!this.agentInstance) {
      this.agentInstance = await this.createAgent();
    }

    const agent = this.agentInstance;
    let useStreaming = typeof agent.stream === 'function' ? true : false;
    if (useStreaming) {
      try {
        for await (const chunk of await agent.stream(
          { messages: [userMessage] },
          { configurable: { thread_id: "1" }, streamMode: "updates" }
        )) {
          const [step, content] = Object.entries(chunk)[0];
          if (!step || !content || step === 'SummarizationMiddleware.before_model') {
            continue;
          }
          const msgs = this.toChatMessage(content.messages);
          for (const msg of msgs) {
            yield msg;
          }
        }
      } catch (streamError) {
        this.logger.warn('Stream error, falling back to regular invoke:', streamError);
        useStreaming = false;
      }
    }

    if (!useStreaming) {
      const result = await agent.invoke(
        { messages: [userMessage] },
        { configurable: { thread_id: "1" } }
      );
      const msgs = this.toChatMessage(result.messages);
      for (const msg of msgs) {
        yield msg;
      }
    }
  }

  async toolTest() {
    console.log('Inspect functionality triggered');
    // test
    // 1. get api docs
    {
      console.log("loadMimicAPIDocument", await this.loadMimicAPIDocument());
      console.log("loadMimicAPIDefinition", await this.loadMimicAPIDefinition());
    }
    {
      const url = await SidebarUtils.engine.getPageUrl();
      const title = await SidebarUtils.engine.getPageTitle();
      const status = await SidebarUtils.engine.getPageStatus();
      console.log('getPageInfo', { url, title, status });
    }
    {
      const base64ImgString = await SidebarUtils.engine.capturePage();
      console.log('capturePage', base64ImgString);
    }
    {
      const elem = await SidebarUtils.engine.getElementFromPoint(115.5, 292.375, 153, 21);
      console.log("getElementFromPoint(115.5, 292.375, 153, 21)", elem);
    }
    {
      const elem = await SidebarUtils.engine.getElementFromPoint(415, 355.875);
      console.log("getElementFromPoint(415, 355.875, 64, 64)", elem);
    }
    {
      const elem = await SidebarUtils.engine.getElementFromPoint(28, 34);
      console.log("getElementFromPoint(28, 34)", elem);
    }
    {
      const result1 = await this.runScript(`let a = 1; console.log('debug log', a); return 100; `, true);
      console.log('runScript with new step, result expect to be 100, now the result is: ', result1);
      const result2 = await this.runScript(`let a = 1; console.log('debug log', a); throw new Error("Simulated error"); `, false);
      console.log('runScript with error, result expect to be Error: Simulated error, now the result is: ', result2);
    }
    {
      const result = await this.analyzePageWithVisionModel();
      if (!result) return;
      for (const element of result.elements) {
        const elem = await SidebarUtils.engine.getElementFromPoint((element.bbox[0] + element.bbox[2]) / 2, (element.bbox[1] + element.bbox[3]) / 2);
        console.log("element-", element, " in ", element.bbox, " is ", elem);
        const script = `await ${elem.pageScript}.${elem.elementScript}.highlight();`;
        await SidebarUtils.engine.runScript(script);
      }
    }
  }
}
