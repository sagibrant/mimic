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
              <label for="model-select">Model</label>
            </FloatLabel>
            <!-- Vision Model Selection -->
            <FloatLabel class="flex items-center" variant="on">
              <Select v-model="visionModel" inputId="model-select" :options="visionModelOptions" optionLabel="name"
                size="small" optionValue="value" class="w-22" :labelStyle="{ fontSize: '0.7rem' }" />
              <label for="model-select">Model</label>
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
import * as z from "zod";
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
// Refs
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
    const result = await SidebarUtils.engine.runScript("let a = 1; console.log('debug log', a); return 100;");
    console.log('runScript', result);
  }
  {
    await identifyElementsWithVisionModel();
  }
};

// const handleVoiceInput = () => {
//   console.log('Voice input functionality triggered');
//   // Mock voice input functionality
// };

const checkpointer = new MemorySaver();

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

const identifyElementsWithVisionModel = async (userPrompt?: string) => {
  try {
    // Use the helper function to get an appropriate vision model
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
    if (!jimpImage) return;

    const systemPrompt = `
## Role:
You are an AI assistant that helps identify UI elements.

## Objective:
- Identify elements in screenshots that match the user's description.
- Provide the coordinates of the element that matches the user's description.

## Coordinate System:
- ALL coordinates (x, y, width, height) MUST be relative to the provided screenshot image
- The screenshot dimensions are: width=${jimpImage.width}, height=${jimpImage.height}
- x must be between 0 and ${jimpImage.width - 1}
- y must be between 0 and ${jimpImage.height - 1}
- width must be positive and x + width must not exceed ${jimpImage.width}
- height must be positive and y + height must not exceed ${jimpImage.height}
- NEVER return coordinates outside these bounds

## Output Requirements:
- Return a maximum of 30 elements. If more elements exist, prioritize the most significant and relevant ones
- Ensure bounding boxes accurately encompass the entire element

## Output Format:
\`\`\`json
{
  "elements": {
    "type": string,
    "description": string,
    "x": number,
    "y": number,
    "width": number,
    "height": number
  }[], 
  "errors"?: string[]
}
\`\`\`


Fields:
* \`elements\`: Array of UI elements found in the screenshot that match the user's description (maximum 30 items)
* \`type\`: The type of the element (e.g., button, input, link, checkbox, dropdown, image, etc.)
* \`description\`: A concise description of the element's purpose or content
* \`x\`: The left coordinate of the element's bounding box.
* \`y\`: The top coordinate of the element's bounding box.
* \`width\`: The width of the element's bounding box.
* \`height\`: The height of the element's bounding box.
* \`errors\` is an optional array of error messages (if any)

For example, when an element is found:
\`\`\`json
{
  "elements": [{
    "type": "button"
    "description": "Login button"
    "x": 50,
    "y": 100,
    "width": 100,
    "height": 30
  },{
      "type": "input",
      "description": "Email input field",
      "x": 50,
      "y": 140,
      "width": 200,
      "height": 35
  }],
  "errors": []
}
\`\`\`

When no element is found:
\`\`\`json
{
  "elements": [],
  "errors": ["I can see ..., but {some element} is not found"]
}
\`\`\`
`;
    const UIElement = z.object({
      type: z.string().describe("The type of the element (button, editor, link, image, movie, etc)."),
      description: z.string().describe("The description of the element."),
      x: z.number().describe("The left of the element bounding box"),
      y: z.number().describe("The top of the element bounding box"),
      width: z.number().describe("The width of the element bounding box"),
      height: z.number().describe("The width of the element bounding box"),
    });

    const UIElementDetails = z.object({
      elements: z.array(UIElement).describe("array of the elements"),
      errors: z.array(z.string()).describe("array of error messages")
    });

    const messages = [{
      role: "system",
      content: systemPrompt
    }, {
      role: "user",
      content: [
        {
          type: "text", text: userPrompt
            || `This is the screenshot (dimensions: ${jimpImage.width}x${jimpImage.height}).
Please identify all clickable and editable UI elements. 
Return the results in the specified JSON schema format, limiting to the 30 most significant elements.` },
        {
          type: "image_url",
          image_url: {
            url: base64Image
          }
        }
      ]
    }];

    console.log("visionModel.invoke ==>", messages);
    const response = await visionModel.withStructuredOutput(UIElementDetails).invoke(messages);
    console.log("visionModel.invoke <==", response);

    if (response && response.elements) {
      response.elements = response.elements.map(elem => {
        let { x, y, width, height } = elem;

        if (x >= jimpImage.width || y >= jimpImage.height) {
          console.warn(`Element coordinates out of bounds: x=${x}, y=${y}, image size=${jimpImage.width}x${jimpImage.height}`);
          x = Math.min(x, jimpImage.width - 1);
          y = Math.min(y, jimpImage.height - 1);
        }

        if (x + width > jimpImage.width) {
          width = jimpImage.width - x;
        }

        if (y + height > jimpImage.height) {
          height = jimpImage.height - y;
        }

        return { ...elem, x, y, width, height };
      });
    }

    return response;
  } catch (error: any) {
    console.error('Error in identifyElementsWithVision:', error);
    return null;
  }
}

/** ==================================================================================================================== */
/** ================================================= Define the tools ================================================= */
/** ==================================================================================================================== */
const getAPIDocument = tool(
  async () => {
    const doc = await loadAPIDocument() || '';
    console.log('getAPIDocument ===', doc);
    return doc;
  },
  {
    name: "get_api_document",
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

const capturePage = tool(
  async () => {
    const base64ImgString = await SidebarUtils.engine.capturePage();
    const content = `The page screenshot in base64 format: ${base64ImgString}`;
    console.log('capturePage', base64ImgString);
    return [content, { base64ImgString }];
  },
  {
    name: "capture_page",
    description: "Capture the visible area of the current page",
    responseFormat: 'content_and_artifact'
  }
);

const identifyElementsWithVision = tool(
  async ({ prompt }) => {
    try {
      if (!prompt) return;
      const elements = await identifyElementsWithVisionModel(prompt);
      const content = `The identified elements: ${JSON.stringify(elements)}`;
      return [content, elements];
    } catch (error: any) {
      console.error('Error in identifyElementsWithVision:', error);
      return [`Error analyzing image: ${error.message}`, { error: error.message }];
    }
  },
  {
    name: "identify_elements_with_vision",
    description: "Analyze a page screenshot using computer vision to identify interactive elements and their positions",
    responseFormat: 'content_and_artifact',
    schema: z.object({
      prompt: z.string().optional().describe("Custom prompt for the vision model")
    })
  }
);

const getElementFromPoint = tool(
  async ({ x, y, width, height }) => {
    const elem = await SidebarUtils.engine.getElementFromPoint(x, y, width, height);
    const content = `The element in the given position is: 
\`\`\`json
${JSON.stringify(elem)}
\`\`\`
`;
    console.log('getElementFromPoint', elem);
    return [content, elem];
  },
  {
    name: "get_element_from_point",
    description: "Get the element description from the give position {x, y, width, height}",
    responseFormat: 'content_and_artifact',
    schema: z.object({
      x: z.number().describe("The x of the element position in viewport"),
      y: z.number().describe("The x of the element position in viewport"),
      width: z.number().describe("The width of the element in viewport"),
      height: z.number().describe("The height of the element in viewport"),
    })
  }
);

const runScript = tool(
  async ({ script }) => {
    const result = await SidebarUtils.engine.runScript(script);
    console.log('runScript', result);
    let content = 'The script run passed';
    if (result !== undefined && result !== null) {
      content = `The script run completed with result: ${typeof result === 'object' ? JSON.stringify(result) : result}`;
    }
    return [content, result];
  },
  {
    name: "run_script",
    description: "Run the script in Gogogo",
    responseFormat: 'content_and_artifact',
    schema: z.object({
      script: z.string().describe("The script to run")
    })
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

const createSummarizationMiddleware = () => {
  let modelName = chatModel.value;
  const models = chatModelOptions.value.filter(m => m.value !== 'auto');
  if (modelName === 'auto') {
    modelName = models[0].value;
  }
  return summarizationMiddleware({
    model: modelName,
    maxTokensBeforeSummary: 4000,
    messagesToKeep: 20,
  });
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
    temperature: task === 'vision' ? 0.2 : 0.5, // Lower temperature for vision tasks for more consistent results
    topP: 0.8,
    maxTokens: task === 'vision' ? 1024 : 4096, // Smaller for vision tasks
    streaming: false,
  });
};

const handleSend = async () => {
  if (!userInput.value.trim()) {
    return;
  }

  const baseModel = await getModelForTask('general');

  const agent = createAgent({
    model: baseModel,
    tools: [getPageInfo, capturePage, identifyElementsWithVision, getElementFromPoint, getAPIDocument, getGogogoAPI, runScript],
    middleware: [handleToolErrors, createSummarizationMiddleware()] as const,
    checkpointer,
  });
  const userMessage = new HumanMessage(userInput.value);
  chatMessages.value.push(userMessage);
  console.log('Sending message:', chatMessages.value);

  const result = await agent.invoke({
    messages: userInput.value
  }, {
    configurable: { thread_id: "1" }
  });
  // Clear input after sending
  userInput.value = '';

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