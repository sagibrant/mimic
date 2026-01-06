<template>
  <div class="ai-agent-container flex flex-col h-full bg-transparent">
    <!-- Chat Messages Area -->
    <div class="chat-messages flex-1 overflow-y-auto p-2 space-y-4">
      <!-- Example messages -->
      <div v-for="(message, index) in chatMessages" :key="index" class="message mb-4"
        :class="message.type === 'human' ? 'user-message flex justify-end' : 'ai-message flex justify-start'">
        <div :class="[
          'rounded-2xl px-4 py-2 max-w-[85%]',
          message.type === 'human'
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        ]">
          <p>{{ message.content }}</p>
        </div>
      </div>
    </div>

    <!-- Fade effect between Chat Messages and User Input Area -->
    <div class="pointer-events-none relative w-full">
      <div class="absolute inset-x-0 bottom-0 h-4">
        <div class="h-full bg-linear-to-t from-(--vscode-editor-background,#ffffff) to-transparent"></div>
      </div>
    </div>

    <!-- User Input Area -->
    <div class="user-input-area p-2 shrink-0">
      <!-- Input Area -->
      <div class="input-area mb-4">
        <div class="input-container flex items-end space-x-2">
          <textarea ref="inputTextArea" v-model="userInput" @keydown="handleKeyDown" placeholder="Type your message..."
            class="flex-1 border rounded-lg p-2 min-h-24 max-h-32 resize-none overflow-y-auto" rows="2"></textarea>
        </div>
      </div>

      <!-- Bottom Controls -->
      <div class="bottom-controls">
        <div class="flex flex-row items-center justify-between gap-2">
          <!-- Left Controls -->
          <div class="flex items-center gap-2">
            <!-- Chat Model Selection -->
            <FloatLabel class="flex items-center" variant="on">
              <Select v-model="chatModel" inputId="model-select" :options="chatModelOptions" optionLabel="name"
                size="small" optionValue="value" class="w-22" :labelStyle="{ fontSize: '0.7rem' }" />
              <label for="model-select">Chat</label>
            </FloatLabel>
            <!-- Vision Model Selection -->
            <FloatLabel class="flex items-center" variant="on">
              <Select v-model="visionModel" inputId="model-select" :options="visionModelOptions" optionLabel="name"
                size="small" optionValue="value" class="w-22" :labelStyle="{ fontSize: '0.7rem' }" />
              <label for="model-select">Vision</label>
            </FloatLabel>
          </div>

          <!-- Right Controls -->
          <div class="flex items-center space-x-2">
            <!-- Inspect Button -->
            <Button icon="pi pi-search" size="small" variant="text" rounded severity="secondary" @click="handleInspect"
              title="Inspect elements on the page" />

            <!-- Voice Button -->
            <!-- <Button icon="pi pi-microphone" rounded text severity="secondary" @click="handleVoiceInput"
              title="Voice input" class="w-8 h-8" /> -->

            <!-- Send Button -->
            <Button icon="pi pi-send" size="small" rounded @click="handleSend"
              title="Send message (Enter to send, Shift+Enter for new line)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { Jimp } from "jimp";
import Button from 'primevue/button';
import Select from 'primevue/select';
import FloatLabel from 'primevue/floatlabel';
import { ChatOpenAI } from '@langchain/openai';
import { createAgent, createMiddleware, tool, ToolMessage, HumanMessage, SystemMessage, BaseMessage, summarizationMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
// import { createAgent, createMiddleware, tool, ToolMessage, HumanMessage, SystemMessage, BaseMessage } from "@langchain/langgraph/web";
import * as z from "zod/v3";
import { AIUtils } from "@gogogo/shared";
import { SidebarUtils } from './SidebarUtils';
/**
 * Get localized text by key
 * @param key - The key of the text to localize
 * @returns Localized text string
 */
// const t = (key: string) => {
//   return chrome.i18n.getMessage(key) || key; // Fallback to key if message not found
// };

// State
const userInput = ref('');
const chatModel = ref('auto'); // Default to auto model
const visionModel = ref('auto'); // Default to auto model

// Options
const chatModelOptions = ref<{ name: string; value: string }[]>([
  { name: 'Auto', value: 'auto' }
]);
const visionModelOptions = ref<{ name: string; value: string }[]>([
  { name: 'Auto', value: 'auto' }
]);

const chatMessages = ref<BaseMessage[]>([]);
const inputTextArea = ref<HTMLTextAreaElement | null>(null);

// // tool functions
const handleInspect = async () => {
  console.log('Inspect functionality triggered');
  // test
  // 1. get api docs
  {
    console.log("loadAPIDocument", await loadAPIDocument());
    console.log("loadAPIDefinition", await loadAPIDefinition());
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
    const elem = await SidebarUtils.engine.getElementFromPoint(115.5, 331.375, 153, 21);
    console.log("getElementFromPoint(115.5, 331.375, 153, 21)", elem);
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
    const result = await SidebarUtils.engine.runScript("let a = 1; console.log('debug log', a); return 100;");
    console.log('runScript', result);
  }
  {
    const result = await analyzePageWithVisionModel();
    if (!result) return;
    for (const element of result.elements) {
      const elem = await SidebarUtils.engine.getElementFromPoint((element.bbox[0] + element.bbox[2]) / 2, (element.bbox[1] + element.bbox[3]) / 2);
      console.log("element-", element, " in ", element.bbox, " is ", elem);
      const script = `await ${elem.pageScript}.${elem.elementScript}.highlight();`;
      await SidebarUtils.engine.runScript(script);
    }
  }
};

// const handleVoiceInput = () => {
//   console.log('Voice input functionality triggered');
//   // Mock voice input functionality
// };

const UIElement = z.object({
  type: z.string().describe("The type of the element (e.g., button, input, link, checkbox, dropdown, image, etc.)"),
  description: z.string().describe("A concise description of the element's purpose or content."),
  bbox: z.array(z.number()).describe("The bounding box of the element [xmin, ymin, xmax, ymax]")
});

const UIPageDetails = z.object({
  summary: z.string().describe("The summary of the main topic of the screenshot (maximum 50 words)"),
  width: z.number().describe("The width of the screenshot"),
  height: z.number().describe("The height of the screenshot"),
  elements: z.array(UIElement).describe("Array of UI elements found in the screenshot that match the user's description (maximum 20 items)"),
  errors: z.array(z.string()).describe("Optional array of error messages (if any)")
});

// type UIElementType = z.infer<typeof UIElement>;

const loadAPIDocument = async () => {
  const docURL = chrome.runtime.getURL('assets/docs/README.md');
  const response = await fetch(docURL);
  if (!response.ok) {
    throw new Error(`resource error: status - ${response.status}`);
  }
  const doc = await response.text();
  return doc;
}

const loadAPIDefinition = async () => {
  const apiURL = chrome.runtime.getURL('assets/types/types.d.ts');
  const response = await fetch(apiURL);
  if (!response.ok) {
    throw new Error(`resource error: status - ${response.status}`);
  }
  const doc = await response.text();
  return doc;
}

const analyzePageWithVisionModel = async (userPrompt?: string) => {
  try {
    const visionModel = await getModelForTask('vision');
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
* \`errors\`: Optional array of error messages (if any)
* \`element.type\`: The type of the element (e.g., button, input, link, checkbox, dropdown, image, etc.)
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
  "I want know what is the weather today according to this page."
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

    console.log("visionModel.invoke ==>", messages);
    const response = await visionModel.withStructuredOutput(UIPageDetails).invoke(messages);
    console.log("visionModel.invoke <==", response);

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

/** ==================================================================================================================== */
/** ================================================= Define the tools ================================================= */
/** ==================================================================================================================== */
const getGogogoAPIDocument = tool(
  async () => {
    const doc = await loadAPIDocument() || '';
    console.log('getGogogoAPIDocument ===', doc);
    return doc;
  },
  {
    name: "get_gogogo_api_document",
    description: "Get the API documentation for Gogogo extension"
  }
);

const getGogogoAPI = tool(
  async () => {
    const doc = await loadAPIDefinition() || '';
    console.log('getGogogoAPI ===', doc);
    return doc;
  },
  {
    name: "get_gogogo_api",
    description: "Get the TypeScript API definitions for Gogogo extension"
  }
);

const runGogogoScript = tool(
  async ({ script }) => {
    try {
      console.log('runScript ==>', script);
      const result = await SidebarUtils.engine.runScript(script);
      console.log('runScript <==', result);
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
    }
    catch (err) {
      console.error('runScript error', err);
      const content = `The script run completed with error: ${err instanceof Error ? err.message : String(err)}`;
      return [content, err];
    }
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

const getPageInfo = tool(
  async () => {
    const url = await SidebarUtils.engine.getPageUrl();
    const title = await SidebarUtils.engine.getPageTitle();
    const status = await SidebarUtils.engine.getPageStatus();
    const content = `The page information: url=${url}, title=${title}, status=${status}`;
    console.log('getPageInfo', { url, title, status });
    return [content, { url, title, status }];
  },
  {
    name: "get_page_info",
    description: "Get the information of the current page { url, title, status }",
    responseFormat: 'content_and_artifact'
  }
);

const analyzePageWithVision = tool(
  async ({ userPrompt }) => {
    try {
      const result = await analyzePageWithVisionModel(userPrompt);
      const content = `The analyze result for this page: 
\`\`\`json
${JSON.stringify(result)}
\`\`\`
`;
      return [content, result];
    } catch (error: any) {
      console.error('Error in identifyElementsWithVision:', error);
      return [`Error analyzing image: ${error.message}`, { error: error.message }];
    }
  },
  {
    name: "analyze_page_with_vision",
    description: "Analyze a page screenshot using computer vision and return the identified UI elements based on the user's description",
    responseFormat: 'content_and_artifact',
    schema: z.object({
      userPrompt: z.string().optional().describe("User's question or description for analyzing the page. e.g., 'Find the login button and input fields'")
    })
  }
);

const getElementFromPoint = tool(
  async ({ type, description, bbox }) => {
    const x = (bbox[0] + bbox[2]) / 2;
    const y = (bbox[1] + bbox[3]) / 2;
    const elem = await SidebarUtils.engine.getElementFromPoint(x, y);
    const content = `The element in the given position is: 
\`\`\`javascript
${elem.pageScript}.${elem.elementScript}
\`\`\`

The example code for this element is:

\`\`\`javascript
// highlight the element
await ${elem.pageScript}.${elem.elementScript}.highlight();

// click with event
await ${elem.pageScript}.${elem.elementScript}.click();
// set value with event
await ${elem.pageScript}.${elem.elementScript}.fill('abcde');

// enable cdp
await browser.attachDebugger();
// click with cdp (must enable cdp before using cdp mode)
await ${elem.pageScript}.${elem.elementScript}.click({mode: 'cdp'});
// set value with cdp (must enable cdp before using cdp mode)
await ${elem.pageScript}.${elem.elementScript}.fill('abcde', {mode: 'cdp'});
// disable cdp
await browser.detachDebugger();

\`\`\`
`;
    console.log('getElementFromPoint', elem, type, description, bbox);
    return [content, elem];
  },
  {
    name: "get_element_from_point",
    description: "Get the element description from the give position {x, y, width, height}",
    responseFormat: 'content_and_artifact',
    schema: UIElement
  }
);

const handleToolErrors = createMiddleware({
  name: "HandleToolErrors",
  wrapToolCall: (request, handler) => {
    try {
      return handler(request);
    } catch (error) {
      // Return a custom error message to the model
      return new ToolMessage({
        content: `Tool error: Please check your input and try again. (${error})`,
        tool_call_id: request.toolCall.id!,
      });
    }
  },
});

const getSystemPrompt = async () => {
  const api_doc = await loadAPIDefinition();
  const systemPrompt = `## Role:
You are a versatile professional in web testing and automation. Your outstanding contributions will impact the user experience of billions of users.

## Objective:
* You need to analyze the user's request and make plans.
* You need to analyze the current page's screenshot and decide what to do next.
* You need to write script and run script with Gogogo APIs to achieve user's task goal.

## Important
* You are working with the Gogogo extension, and you can automate/test the browser pages by running Gogogo scripts in Gogogo extension.
* You can get the Gogogo api definitions using tool get_gogogo_api.
* You can get the Gogogo api document with examples using tool get_gogogo_api_document.
* You can run the Gogogo scripts using tool run_gogogo_script.
* You can identify the page elements using tool analyze_page_with_vision.
* You can get the element using the tool get_element_from_point based on the returned result from tool analyze_page_with_vision.

## Script Guidelines:
* Use Gogogo API to interact with the page and browser, make sure write safe and correct javascript code
* Use PURE JavaScript script. Although TypeScript definitions of Gogogo API are provided (defined in types.d.ts), DO NOT use TypeScript-specific syntax (type annotations, interfaces, type aliases, enums)
* Use async/await for all asynchronous operations
* Test scripts in your mind before running them
* If scripts have errors, try to review the Gogogo api definitions using tool get_gogogo_api and the Gogogo api document with examples using tool get_gogogo_api_document and fix the errors
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

// Helper function to get an appropriate model for a specific task
const getModelForTask = async (task: 'general' | 'vision' = 'general') => {
  if (task === 'general' && chatModel.value.length <= 1) {
    throw new Error('No valid model');
  }
  if (task === 'vision' && visionModelOptions.value.length <= 1) {
    throw new Error('No valid model');
  }

  const settings = task === 'vision' ? await AIUtils.getAIVisionSettings() : await AIUtils.getAISettings();
  let modelName = task === 'vision' ? visionModel.value : chatModel.value;
  if (modelName === 'auto') {
    const options = (task === 'vision' ? visionModelOptions.value : chatModelOptions.value).filter(m => m.value !== 'auto');
    if (options.length > 0) {
      modelName = options[0].value;
    }
  }
  return new ChatOpenAI({
    model: modelName,
    configuration: {
      baseURL: settings.baseURL,
      apiKey: settings.apiKey,
      dangerouslyAllowBrowser: true,
    },
    temperature: task === 'vision' ? 0 : 0.5, // Lower temperature for vision tasks for more consistent results
    topP: 0.8,
    maxTokens: 4096,
    streaming: false,
  });
};

const checkpointer = new MemorySaver();

const handleSend = async () => {
  if (!userInput.value.trim()) {
    return;
  }
  const userInputValue = userInput.value.trim();
  const userMessage = new HumanMessage(userInputValue);
  chatMessages.value.push(userMessage);
  console.log('Sending message:', chatMessages.value);
  const baseModel = await getModelForTask();
  const systemPrompt = await getSystemPrompt();
  const agent = createAgent({
    model: baseModel,
    tools: [getPageInfo, analyzePageWithVision, getElementFromPoint, getGogogoAPIDocument, getGogogoAPI, runGogogoScript],
    middleware: [handleToolErrors, summarizationMiddleware({
      model: baseModel,
      maxTokensBeforeSummary: 4000,
      messagesToKeep: 20,
    })] as const,
    checkpointer,
    systemPrompt: systemPrompt
  });
  userInput.value = '';
  const result = await agent.invoke({
    messages: userInputValue
  }, {
    configurable: { thread_id: "1" }
  });
  chatMessages.value = result.messages;
  console.log("result", result);
  nextTick(() => {
    const chatContainer = document.querySelector('.chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });

  // Focus back to the input area after sending
  if (inputTextArea.value) {
    inputTextArea.value.focus();
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
  // Shift + Enter for new line is handled by default behavior
};

onMounted(async () => {
  const chatAISettings = await AIUtils.getAISettings();
  const chatModels = chatAISettings.models.split(';').filter(m => m.trim().length > 0);
  if (chatModels.length > 0) {
    for (const model of chatModels) {
      chatModelOptions.value.push({ name: model, value: model });
    }
    chatModel.value = chatModelOptions.value[0].value;
  }
  chatMessages.value.push(new SystemMessage('Hello! I\'m your AI assistant. How can I help you today?'));

  const visionAISettings = await AIUtils.getAIVisionSettings();
  const visionModels = visionAISettings.models.split(';').filter(m => m.trim().length > 0);
  if (visionModels.length > 0) {
    for (const model of visionModels) {
      visionModelOptions.value.push({ name: model, value: model });
    }
    visionModel.value = visionModelOptions.value[0].value;
  }
});
</script>

<style scoped>
.ai-agent-container {
  height: 70vh;
  flex: 0 0 auto;
  overflow: hidden;
  transition: max-height 0.3s ease;
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
  /* Set global font size to text-xs equivalent */
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
}

.user-message .bg-blue-500 {
  background-color: #3b82f6;
  color: white;
}

.ai-message .bg-gray-200 {
  background-color: #e5e7eb;
  color: #374151;
}

.message p {
  margin: 0;
  word-wrap: break-word;
}

/* Rounded corners for chat bubbles */
.user-message .rounded-2xl {
  border-top-right-radius: 0.5rem;
}

.ai-message .rounded-2xl {
  border-top-left-radius: 0.5rem;
}

/* Styling for the input area */
.input-area textarea {
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  padding: 0.75rem;
  resize: none;
  width: 100%;
  font-size: 0.75rem;
}

.input-area textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

/* Override PrimeVue default font sizes with higher specificity */
/* .ai-agent-container :deep(.p-select-label) {
  font-size: 0.6rem !important;
} */

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  .ai-agent-container {
    --vscode-editor-background: #1e1e1e;
  }
}
</style>