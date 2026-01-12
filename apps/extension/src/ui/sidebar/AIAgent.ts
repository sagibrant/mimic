/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file AIAgentUtils.ts
 * @description 
 * Shared AI utility classes and functions
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
import { Logger, SettingUtils, Utils } from "@gogogo/shared";
import { BaseMessage, AIMessage, ToolMessage, summarizationMiddleware, ReactAgent, HumanMessage } from "langchain";
import { ChatOpenAI } from '@langchain/openai';
import { createAgent, createMiddleware, tool } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import * as z from "zod/v3";
import { SidebarUtils } from "./SidebarUtils";

export interface ChatMessage extends BaseMessage {
  messageType?: 'think' | 'tool' | 'final';
}
export type AgentMode = 'agent' | 'chat';

export const UIElement = z.object({
  type: z.string().describe("The type of the element (e.g., button, input, link, checkbox, dropdown, image, etc.)"),
  description: z.string().describe("A concise description of the element's purpose or content."),
  bbox: z.array(z.number()).describe("The bounding box of the element [xmin, ymin, xmax, ymax]")
});

export const UIPageDetails = z.object({
  summary: z.string().describe("The summary of the main topic of the screenshot (maximum 50 words)"),
  answer: z.optional(z.nullable(z.string())).describe("The answer to the user's question based on the content of the screenshot (if any, optional)"),
  width: z.number().describe("The width of the screenshot"),
  height: z.number().describe("The height of the screenshot"),
  elements: z.array(UIElement).describe("Array of UI elements found in the screenshot that match the user's description (maximum 20 items)"),
  errors: z.optional(z.nullable(z.array(z.string()))).describe("Optional array of error messages (if any, optional, such as no matching elements found, screenshot not related to the user's query or image processing issues)")
});

export class AIAgent {
  private readonly logger: Logger;
  private runScript: (script: string, newStep: boolean) => Promise<any>;
  private mode: AgentMode = 'agent';
  private agentInstance?: ReactAgent;
  constructor(runScript: (script: string, newStep: boolean) => Promise<any>) {
    this.runScript = runScript;
    const prefix = Utils.isEmpty(this.constructor?.name) ? "AIAgent" : this.constructor?.name;
    this.logger = new Logger(prefix);
  }

  /** ==================================================================================================================== */
  /** ====================================================== Prompt ====================================================== */
  /** ==================================================================================================================== */
  private async loadVisionSystemPrompt() {
    const systemPrompt = `
## Role:
You are an AI assistant that helps identify UI elements on a webpage screenshot based on the user's description.

## Objective:
- Analyzes and summary the content of the screenshot.
- Analyzes and answers the user's question according to the content of the screenshot if any.
- Identify elements in screenshot that match the user's description.
- Provide the coordinates of the element that matches the user's description.

## Output Requirements:
- Return a maximum of 20 elements. If more elements exist, prioritize the most significant and relevant ones
- Ensure bounding boxes accurately encompass the entire element

## Output Format:
\`\`\`json
{
  "summary": string,
  "answer": string,
  "width": number,
  "height": number,
  "elements": {
    "type": string,
    "description": string,
    "bbox": [number, number, number, number] // 2d bounding box for the element, should be [xmin, ymin, xmax, ymax]
  }[], 
  "errors": string[]
}
\`\`\`

Fields:
* \`summary\`: The summary of the main topic of the screenshot (maximum 50 words)
* \`answer\`: The answer to the user's question based on the content of the screenshot (if any, optional)
* \`width\`: The width of the screenshot
* \`height\`: The height of the screenshot
* \`elements\`: Array of UI elements found in the screenshot that match the user's description (maximum 20 items)
* \`errors\`: Optional array of error messages (if any, optional, such as no matching elements found, screenshot not related to the user's query or image processing issues)
* \`element.type\`: The type of the element (e.g., button, input, link, checkbox, dropdown, image, text, etc.)
* \`element.description\`: A concise description of the element's purpose or content
* \`element.bbox\`: The bounding box of the element that matches the user's description

## Examples:
* Scenario 1: User login scenario
  * When the user message is 
  "I want to login the page. Check if the user is already logged in or not. If not, find the elements required for login action."
  * Then the response could be:
  \`\`\`json
  {
    "summary": "The login page",
    "answer": "The user is not logged in.",
    "width": 1024,
    "height": 1080,
    "elements": [{
        "type": "input",
        "description": "Email input field",
        "bbox": [50, 140, 100, 160]
    },{
        "type": "input",
        "description": "Password input field",
        "bbox": [50, 160, 100, 180]
    },{
      "type": "button"
      "description": "Login button"
      "bbox": [80, 200, 100, 210]
    }],
    "errors": []
  }
  \`\`\`

* Scenario 2: Weather forecast scenario
  * When the user message is 
  "What is the weather today according to this page?"
  * Then the response could be:
  \`\`\`json
  {
    "summary": "The weather forecast page",
    "answer": "The weather today is sunny with a high of 75°F and a low of 55°F.",
    "width": 1024,
    "height": 1080,
    "elements": [],
    "errors": []
  }
  \`\`\`

* Scenario 3: Page does not contain the required elements
  * When the user message is 
  "I want to buy a flight ticket from New York to San Francisco. Find the elements required for this action."
  * Then the response could be:
  When no element is found:
  \`\`\`json
  {
    "summary": "The login page",
    "answer": "This page does not contain the elements required for booking a flight ticket. It is a login page. You may need to login first.",
    "width": 1024,
    "height": 1080,
    "elements": [],
    "errors": ["I can see login buttons, but the elements for the flight booking action are not found"]
  }
  \`\`\`
`;
    return systemPrompt;
  }

  private async loadChatSystemPrompt() {
    const api_doc = await this.loadGogogoAPIDefinition();
    const systemPrompt = `## Role:
You are a versatile professional in web testing and automation. Your outstanding contributions will impact the user experience of billions of users.

## Objective:
* You need to analyze the user's request and make plans.
* You need to analyze the current page's screenshot and decide what to do next.
* You need to write script and run script with Gogogo APIs to achieve user's task goal.

## Important
* You are working with the Gogogo extension, and you can automate/test the browser pages by running Gogogo scripts in Gogogo extension.
* You can get the Gogogo api definitions using tool get_gogogo_api_definition.
* You can get the Gogogo api document with examples using tool get_gogogo_api_document.
* You can run the Gogogo scripts using tool run_gogogo_script.
* You can identify the page elements using tool analyze_page_with_vision.
* You can get the element using the tool get_element_from_point based on the returned result from tool analyze_page_with_vision.
* You can try to get some answer directly on the page using tool analyze_page_with_vision if you failed to get result by running the Gogogo scripts with tool run_gogogo_script. e.g.: call tool analyze_page_with_vision with userPrompt "What is the weather today according to this page?".
* You should use the same language as the user's instruction.

## Script Guidelines:
* Use Gogogo API to interact with the page and browser, make sure write safe and correct javascript code
* Use PURE JavaScript script. Although TypeScript definitions of Gogogo API are provided (defined in types.d.ts), DO NOT use TypeScript-specific syntax (type annotations, interfaces, type aliases, enums)
* Use async/await for all asynchronous operations
* Test scripts in your mind before running them
* If scripts have errors, try to review the Gogogo api definitions using tool get_gogogo_api_definition and the Gogogo api document with examples using tool get_gogogo_api_document and fix the errors
* Global variables:
  (1) ai: Corresponds to the AIClient interface in types.d.ts, representing the AIClient object (use methods defined in types.d.ts), e.g., const response = await ai.init().setMode('gpt-4o').chat('hello');
  (2) browser: Corresponds to the Browser interface in types.d.ts, representing the current browser (use methods defined in types.d.ts), e.g., await browser.page().first().bringToFront();
  (3) page: Corresponds to the Page interface in types.d.ts, representing the current page (use methods defined in types.d.ts), e.g., await page.element("#id").nth(0).click();
  (4) console: For logging only (browser native API)
* Global functions (use with JavaScript syntax):
  (1) expect(actual: unknown): Returns an Expect instance (defined in types.d.ts), e.g., await expect(1 === 1).toBeTruthy()
  (2) wait(timeout: number): Returns a Promise for waiting, e.g., await wait(2000)
* Prohibited Operations:
  (1) DO NOT use third-party libraries (Selenium, Playwright, Puppeteer—NONE are supported)
  (2) DO NOT use browser native APIs except console (e.g., document, window, document.querySelector, fetch are forbidden)
  (3) DO NOT use TypeScript-specific syntax (type annotations like "let x: string", interfaces, type aliases, enums)
  (4) DO NOT add un-requested logic (auto-navigation, extra wait time, redundant console.log—only implement user-specified features)

## Gogogo API Reference (types.d.ts):
\`\`\`typescript
${api_doc}
\`\`\`

`;
    return systemPrompt;
  };

  /** ==================================================================================================================== */
  /** ================================================= Define the tools ================================================= */
  /** ==================================================================================================================== */
  private async loadGogogoAPIDocument() {
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

  private async loadGogogoAPIDefinition() {
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
      const visionModel = await this.createModel('vision');
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
      const userMessage = `This is the screenshot.
${userPrompt ? userPrompt : "Please summary the page screenshot's content and identify the UI elements."}
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
        response.width = Math.round((response.width * width) / 1000);
        response.height = Math.round((response.height * height) / 1000);
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
        "width": 0,
        "height": 0,
        "elements": [],
        "errors": [err instanceof Error ? err.message : String(err)]
      };
    }
  }

  private getGogogoAPIDocument = tool(
    async () => {
      const doc = await this.loadGogogoAPIDocument() || '';
      return doc;
    },
    {
      name: "get_gogogo_api_document",
      description: "Get the API documentation for Gogogo extension"
    }
  );

  private getGogogoAPIDefinition = tool(
    async () => {
      const doc = await this.loadGogogoAPIDefinition() || '';
      return doc;
    },
    {
      name: "get_gogogo_api_definition",
      description: "Get the TypeScript API definitions for Gogogo extension"
    }
  );

  private runGogogoScript = tool(
    async ({ script }) => {
      const result = await this.runScript(script, this.mode === 'agent');
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
    },
    {
      name: "run_gogogo_script",
      description: "Run the script in Gogogo extension",
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
      description: "Get the element description from the give position {x, y, width, height}",
      responseFormat: 'content_and_artifact',
      schema: UIElement
    }
  );

  /** ==================================================================================================================== */
  /** ==================================================== middleware ==================================================== */
  /** ==================================================================================================================== */
  private handleToolErrors = createMiddleware({
    name: "HandleToolErrors",
    wrapToolCall: (request, handler) => {
      try {
        return handler(request);
      } catch (error) {
        // Return a custom error message to the model
        return new ToolMessage({
          content: `Tool error: Please check your input and try again. (${error instanceof Error ? error.stack || error.message : String(error)})`,
          tool_call_id: request.toolCall.id!,
        });
      }
    },
  });

  /** ==================================================================================================================== */
  /** =================================================== llm instance =================================================== */
  /** ==================================================================================================================== */
  private async createModel(type: 'general' | 'vision' = 'general',) {
    try {
      const settings = type === 'vision' ? SettingUtils.getSettings().aiVisionSettings : SettingUtils.getSettings().aiSettings;
      if (!settings.baseURL) {
        throw new Error('Base URL not configured');
      }
      if (!settings.apiKey) {
        throw new Error('API key not configured');
      }
      let modelName = settings.models.split(';')[0];
      if (!modelName) {
        throw new Error('Model not configured');
      }

      return new ChatOpenAI({
        model: modelName,
        configuration: {
          baseURL: settings.baseURL,
          apiKey: settings.apiKey,
          dangerouslyAllowBrowser: true,
        },
        temperature: type === 'vision' ? 0 : 0.5, // Lower temperature for vision tasks for more consistent results
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
    const model = await this.createModel();
    const systemPrompt = await this.loadChatSystemPrompt();
    const agent = createAgent({
      model: model,
      tools: [this.getPageInfo, this.analyzePageWithVision, this.getElementFromPoint, this.getGogogoAPIDocument, this.getGogogoAPIDefinition, this.runGogogoScript],
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

        return content.length > 2000 ? content.substring(0, 2000) + '...' : content;
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
              case 'get_gogogo_api_document': {
                toolCallMsg = 'Loading Gogogo API Documentation';
                break;
              }
              case 'get_gogogo_api_definition': {
                toolCallMsg = 'Loading Gogogo API Definition';
                break;
              }
              case 'run_gogogo_script': {
                toolCallMsg = `Running script\n${toolCall.args?.script?.length > 100 ? toolCall.args?.script.substring(0, 100) + '...' : toolCall.args?.script}`;
                break;
              }
              case 'get_page_info': {
                toolCallMsg = 'Retrieving page information';
                break;
              }
              case 'analyze_page_with_vision': {
                toolCallMsg = 'Analyzing page with vision model';
                break;
              }
              case 'get_element_from_point': {
                toolCallMsg = 'Getting element from coordinates';
                break;
              }
              default:
                toolCallMsg = `Unrecognized tool call: ${toolCall.name}`;
            }
            const chatMessage = new AIMessage(`🔧 ${toolCallMsg}`) as ChatMessage;
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
            const chatMessage = new AIMessage(`💭 Thinking: ${content}`) as ChatMessage;
            chatMessage.messageType = 'think';
            return [chatMessage];
          }
        }
      }
      else if (lastMessage.type === 'tool') {
        const toolMessage = lastMessage as ToolMessage;
        let toolCallResultMsg = '';
        switch (toolMessage.name) {
          case 'get_gogogo_api_document': {
            toolCallResultMsg = 'Gogogo API Documentation loaded successfully';
            break;
          }
          case 'get_gogogo_api_definition': {
            toolCallResultMsg = 'Gogogo API Definition loaded successfully';
            break;
          }
          case 'run_gogogo_script': {
            if (toolMessage.artifact) {
              const jsonArtifact = JSON.stringify(toolMessage.artifact);
              toolCallResultMsg = `Script executed successfully\nResult: ${jsonArtifact.length > 100 ? jsonArtifact.substring(0, 100) + '...' : jsonArtifact}`;
            }
            else {
              toolCallResultMsg = 'Script executed successfully';
            }
            break;
          }
          case 'get_page_info': {
            if (toolMessage.artifact) {
              const jsonArtifact = JSON.stringify(toolMessage.artifact);
              toolCallResultMsg = `Page information retrieved:\n${jsonArtifact.length > 100 ? jsonArtifact.substring(0, 100) + '...' : jsonArtifact}`;
            }
            else {
              toolCallResultMsg = 'Page information retrieved successfully';
            }
            break;
          }
          case 'analyze_page_with_vision': {
            if (toolMessage.artifact) {
              const jsonArtifact = JSON.stringify(toolMessage.artifact);
              toolCallResultMsg = `Page analysis complete:\n${jsonArtifact.length > 100 ? jsonArtifact.substring(0, 100) + '...' : jsonArtifact}`;
            }
            else {
              toolCallResultMsg = 'Page analysis complete';
            }
            break;
          }
          case 'get_element_from_point': {
            if (toolMessage.artifact) {
              const jsonArtifact = JSON.stringify(toolMessage.artifact);
              toolCallResultMsg = `Element retrieved from coordinates:\n${jsonArtifact.length > 100 ? jsonArtifact.substring(0, 100) + '...' : jsonArtifact}`;
            }
            else {
              toolCallResultMsg = 'Element retrieved from coordinates';
            }
            break;
          }
          default: {
            const content = getMsgContent(toolMessage) || 'Tool execution completed';
            toolCallResultMsg = content;
          }
        }
        const chatMessage = new AIMessage(`🔧 ${toolCallResultMsg}`) as ChatMessage;
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

  async* invoke(message: string, mode: AgentMode = 'agent') {
    const userMessage = new HumanMessage(message);
    this.mode = mode;

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
          this.logger.debug('')
          const msgs = this.toChatMessage(content.messages);
          for (const msg of msgs) {
            yield msg;
          }
        }
      } catch (streamError) {
        console.warn('Stream error, falling back to regular invoke:', streamError);
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
      console.log("loadGogogoAPIDocument", await this.loadGogogoAPIDocument());
      console.log("loadGogogoAPIDefinition", await this.loadGogogoAPIDefinition());
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
      const result1 = await this.runScript(`let a = 1; console.log('debug log', a); return 100;} `, true);
      console.log('runScript with new step', result1);
      const result2 = await this.runScript(`let a = 1; console.log('debug log', a); throw new Error("Simulated error");} `, false);
      console.log('runScript with error', result2);
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
