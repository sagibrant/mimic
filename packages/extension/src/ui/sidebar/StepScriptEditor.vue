<!-- StepEditor.vue -->
<template>
  <div class="step-script-container">
    <!-- script editor with codemirror -->
    <div class="editor-section">
      <div class="editor-header">
        <label class="editor-label">{{ t('step_script_editor_scripts_title') }}</label>
        <div>
          <button class="btn btn-back" @click="handleCodeGoBack" :title="t('step_script_editor_btn_title_go_back')">
            {{ t('step_script_editor_btn_label_go_back') }}
          </button>
          <button class="btn btn-forward" @click="handleCodeGoForward"
            :title="t('step_script_editor_btn_title_go_forward')">
            {{ t('step_script_editor_btn_label_go_forward') }}
          </button>
          <button class="btn btn-run" @click="handleRunScript" :title="t('step_script_editor_btn_title_run_script')">
            {{ t('step_script_editor_btn_label_run_script') }}
          </button>
        </div>
      </div>
      <div class="editor-container">
        <Codemirror v-model="editorContent" :extensions="editorExtensions" @ready="onCodemirrorReady" />
      </div>
    </div>

    <!-- ai chat box -->
    <div class="ai-chatbox">
      <div class="ai-chat-controls">
        <div class="ai-selector">
          <label for="ai-model-select">AI:</label>
          <select id="ai-model-select" v-model="selectedAIModel" @change="handleChangeAI">
            <option v-for="model in aiModels" :key="model.value" :value="model.value">
              {{ model.label }}
            </option>
          </select>
        </div>
        <div class="analyze-page-option" :hidden="true">
          <input type="checkbox" id="analyzePageHtml" :disabled="!isAnalyzePageHtmlSupported" v-model="analyzePageHtml"
            :title="isAnalyzePageHtmlSupported ? t('step_script_editor_cb_title_analyze_page_html') : t('step_script_editor_cb_title_analyze_page_html_disabled')" />
          <label for="checkbox">{{ t('step_script_editor_cb_label_analyze_page_html') }}</label>
        </div>
        <button class="btn btn-inspect" @click="handleInspect" :title="inspectedTitle">
          {{ inspectedLabel }}
        </button>
      </div>
      <div class="ai-chat-messages" ref="chatMessagesContainer">
        <div v-for="(msg, idx) in chatMessages" :key="idx" :class="['chat-msg', msg.role, { waiting: msg.waiting }]">
          <span class="model-label" v-if="msg.model">{{ msg.model }}:</span>
          {{ msg.text }}
        </div>
      </div>
      <div class="ai-chat-input-row">
        <textarea v-model="chatInput" @keydown.enter.exact.prevent="handleSend" @keydown.enter.shift="() => { }"
          :placeholder="t('step_script_editor_input_placeholder_ai_chat')" class="ai-chat-input" rows="2"></textarea>
        <button class="btn btn-send" @click="handleSend" :title="t('step_script_editor_btn_title_ai_chat_send')">
          {{ t('step_script_editor_btn_label_ai_chat_send') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, PropType, watch, nextTick } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { placeholder, EditorView } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { autocompletion, Completion } from "@codemirror/autocomplete";
import { EditorState, Extension } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { ayuLight, coolGlow } from 'thememirror';
import { ObjectDescription, Step } from '../../execution/Task';
import { StepScriptEditorHelper } from './StepScriptEditorHelper';
import { OpenAI, OpenAIError } from 'openai';
import { AIMessage, AIMessageContent, AIUtils } from '@/common/AIUtils';
import { Utils } from '@/common/Common';
import { Diagnostic, linter, lintGutter } from '@codemirror/lint';
import { JSHINT, LintOptions, LintError } from 'jshint';

// Define component props with type annotations
const props = defineProps({
  /** The node data to be rendered */
  step: {
    type: Object as PropType<Step>,
    required: true,
    description: 'The tree node data including id, name, type, and children (for groups)'
  },
  getPageHtml: {
    type: Function,
    required: true, // Ensure the parent passes the method
    validator: (value) => typeof value === 'function' // Validate it's a function
  },
  getPageUrl: {
    type: Function,
    required: true, // Ensure the parent passes the method
    validator: (value) => typeof value === 'function' // Validate it's a function
  },
  toggleInspectMode: {
    type: Function,
    required: true, // Ensure the parent passes the method
    validator: (value) => typeof value === 'function' // Validate it's a function
  },
  inspectedNodeDetails: {
    type: Object as PropType<ObjectDescription | null>,
    required: true,
    description: 'The inspected node details'
  }
});

// Define component emission events
const emit = defineEmits<{
  /** Emitted when try to run the script, passes the script content */
  (e: 'run-script', script: string): void;
  /** Emitted when try to show the notification message, passes the message content */
  (e: 'show-notification-message', message: string, timeout: number): void;
}>();

/** ==================================================================================================================== */
/** ======================================================= code ======================================================= */
/** ==================================================================================================================== */
const isDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
const codemirrorRef = ref<any>(null);
const editorContent = ref('');
const scriptIndex = ref(0);
const scriptHistory = ref<string[]>([]);

watch(editorContent, (newScript) => {
  props.step.script = newScript;
});

const onCodemirrorReady = (cm: any) => {
  codemirrorRef.value = cm;
};

const editorExtensions = computed(() => isDark.value ?
  [
    createAutocompleteExtension(),
    EditorView.lineWrapping,
    coolGlow,
    placeholder(t('step_script_editor_scripts_placeholder'))
  ]
  :
  [
    createAutocompleteExtension(),
    EditorView.lineWrapping,
    ayuLight,
    placeholder(t('step_script_editor_scripts_placeholder'))
  ]
);

const codeLinter = linter(async (view: EditorView): Promise<Diagnostic[]> => {
  const diagnostics: Diagnostic[] = [];
  const doc = view.state.doc;
  const codeContent = doc.toString().trim();
  if (!codeContent) return diagnostics;

  //  or add /* jshint -W083 */
  const codes = `(async () => {
${codeContent}
})();`;

  const lintOptions: LintOptions = {
    esversion: 11,
    browser: true,
    devel: true,
    undef: true,
    unused: true,
    eqeqeq: true,
    curly: true,
    globals: {
      ai: true,
      browser: true,
      page: true,
      BrowserLocator: true,
      expect: true,
      wait: true
    }
    // '-W083': true
  };

  const isPassed = JSHINT(codes, lintOptions);

  if (!isPassed && JSHINT.errors) {
    JSHINT.errors.forEach((err: LintError | null) => {
      if (!err) return;
      const targetLineNum = err.line - 1;
      if (targetLineNum < 1 || targetLineNum > doc.lines) return;
      const targetLine = doc.line(targetLineNum);
      const errorStart = targetLine.from + (err.character - 1);
      const errorEnd = err.evidence
        ? errorStart + err.evidence.length
        : errorStart + 1;

      diagnostics.push({
        from: errorStart,
        to: errorEnd,
        message: err.reason,
        severity: err.code && err.code.startsWith('W') ? 'warning' : (err.code && err.code.startsWith('E') ? 'error' : "info")
      });
    });
  }

  return diagnostics;
}, { delay: 1000 });

const variableTypes = new Map<string, string>();
variableTypes.set('ai', 'AIClient');
variableTypes.set('browser', 'Browser');
variableTypes.set('page', 'Page');
variableTypes.set('console', 'Console');

const updateVariableTypes = (state: EditorState) => {
  const doc = state.doc.toString();
  const varPattern = /(let|const|var)\s+(\w+)\s*=\s*(await\s+)?(.+?)(;|$)/g;
  let match;
  while ((match = varPattern.exec(doc)) !== null) {
    const [, , varName, hasAwait, expr] = match;
    const cleanedExpr = expr.trim().replace(/;$/, '');
    let varType = StepScriptEditorHelper.getExpressionType(cleanedExpr, variableTypes);

    if (hasAwait && varType?.startsWith('Promise<')) {
      varType = varType.replace(/^Promise<(.+)>$/, '$1');
    }
    if (varType && StepScriptEditorHelper.TypeDefinitions[varType]) {
      variableTypes.set(varName, varType);
    }
  }
}

const createCompletions = (typeName: string): Completion[] => {
  if (!typeName || !StepScriptEditorHelper.TypeDefinitions[typeName]) return [];

  const methods = StepScriptEditorHelper.getTypeMethods(typeName);

  return methods.map(method => {
    const paramsStr = method.params.join(', ');
    const label = `${method.name}(${paramsStr})`;
    const info = `${method.name}(${paramsStr}): ${method.returnType}`;

    return {
      label,
      type: "function",
      info,
      apply: (view, _completion, from, to) => {
        const insertText = `${method.name}(${paramsStr})`;
        view.dispatch({
          changes: { from, to, insert: insertText },
          selection: paramsStr
            ? {
              // move the cursor select all the parameters:  ([aaa,bbb,ccc]) 
              anchor: from + method.name.length + 1,
              head: from + insertText.length - 1
            }
            : {
              // move the cursor after the ()|
              anchor: from + insertText.length
            }
        });
      }
    };
  });
}

const createCompletionSource = () => {
  return (context: { state: EditorState; pos: number }) => {
    const { state, pos } = context;
    const tree = syntaxTree(state);
    const nodeBefore = tree.resolveInner(pos, -1);
    if (!nodeBefore) return null;
    if (!nodeBefore.parent) return null;
    // we only support the auto completion on one object. global varaible is not supported
    // e.g.
    // expr: let elm = await page.frame().nth(0).element().nth(1).element().filter().nth(1).element('#id').cl
    // leftExpr: "page.frame().nth(0).element().nth(1).element().filter().nth(1).element('#id')"
    // methodPrefix: cl

    // try to find the dot '.'
    const textBefore = state.sliceDoc(nodeBefore.from, nodeBefore.to).trim();
    let dotPos = -1;
    if (textBefore === ".") {
      dotPos = nodeBefore.from;
    }
    else if (nodeBefore.from > 0) {
      const dotText = state.sliceDoc(nodeBefore.from - 1, nodeBefore.from).trim();
      if (dotText === '.') {
        dotPos = nodeBefore.from - 1;
      }
    }
    if (dotPos < 0) {
      return null;
    }
    const methodPrefix = state.sliceDoc(dotPos + 1, nodeBefore.to).trim();
    const leftExpr = state.sliceDoc(nodeBefore.parent.from, dotPos).trim();
    if (!leftExpr) return null;

    const type = StepScriptEditorHelper.getExpressionType(leftExpr, variableTypes);
    if (!type || !StepScriptEditorHelper.TypeDefinitions[type]) return null;

    let completions = createCompletions(type);

    if (methodPrefix) {
      completions = completions.filter(completion =>
        completion.label.toLowerCase().startsWith(methodPrefix)
      );
    }
    return {
      from: methodPrefix ? dotPos + 1 : pos,
      options: completions
    };
  };
}

const createAutocompleteExtension = (): Extension => {
  return [
    javascript(),
    codeLinter,
    lintGutter(),
    autocompletion({
      override: [createCompletionSource()],
      activateOnTyping: true,
      maxRenderedOptions: 20
    }),
    EditorView.updateListener.of(update => {
      if (update.docChanged) {
        updateVariableTypes(update.state);
      }
    })
  ];
}

const handleCodeGoBack = () => {
  if (scriptIndex.value <= 0) {
    return;
  }
  scriptIndex.value -= 1;
  if (scriptIndex.value >= 0 && scriptIndex.value < scriptHistory.value.length) {
    editorContent.value = scriptHistory.value[scriptIndex.value];
  }
}

const handleCodeGoForward = () => {
  if (scriptIndex.value >= scriptHistory.value.length - 1) {
    return;
  }
  scriptIndex.value += 1;
  if (scriptIndex.value >= 0 && scriptIndex.value < scriptHistory.value.length) {
    editorContent.value = scriptHistory.value[scriptIndex.value];
  }
}

const addStepScript = (stepScript: string) => {
  editorContent.value = editorContent.value ? editorContent.value + '\n' + stepScript : stepScript;
  nextTick(() => {
    const scrollContainer = codemirrorRef?.value?.view?.scrollDOM;
    if (!scrollContainer) return;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  });
}
/** ==================================================================================================================== */
/** ======================================================== AI ======================================================== */
/** ==================================================================================================================== */
const aiModels = ref<{ label: string, value: string }[]>([]);
const selectedAIModel = ref('');

const chatMessagesContainer = ref<HTMLDivElement | null>(null);

const chatMessages = ref<{ role: string; text: string; model?: string; waiting?: boolean }[]>([]);
const chatInput = ref('');
const analyzePageHtml = ref(false);
const isAnalyzePageHtmlSupported = ref(false);
const inspectedLabel = computed(() => props.inspectedNodeDetails === null ? t('step_script_editor_btn_label_inspect') : t('step_script_editor_btn_label_inspected'));
const inspectedTitle = computed(() => props.inspectedNodeDetails === null ? t('step_script_editor_btn_title_inspect') : JSON.stringify(props.inspectedNodeDetails, null, 2));
/**
 * Get localized text by key
 * @param key - The key of the text to localize
 * @returns Localized text string
 */
const t = (key: string) => {
  return chrome.i18n.getMessage(key) || key; // Fallback to key if message not found
};

const handleRunScript = () => {
  emit('run-script', editorContent.value);
}

const handleInspect = () => {
  const result = props.toggleInspectMode();
  if (result instanceof Promise) {
    result.catch((error) => {
      const errorMsg = error instanceof Error ? error.message : String(error);
      emit('show-notification-message', errorMsg, 3000);
    });
  }
}

const handleChangeAI = () => {
  // const modelLabel = aiModels.value.find(e => e.value === selectedAIModel.value)?.label;
  // emit('show-notification-message', `Changed to ${modelLabel}`);
}

const aiMessages: AIMessage[] = [];
const aiMessageContents: AIMessageContent[] = [];

const handleSend = async () => {
  if (!chatInput.value.trim()) return;
  const userInput = chatInput.value.trim();
  const modelLabel = aiModels.value.find(e => e.value === selectedAIModel.value)?.label || t('step_script_editor_text_placeholder_ai_chat_ai');
  const userLabel = t('step_script_editor_text_placeholder_ai_chat_user');
  chatMessages.value.push({
    role: 'user',
    text: userInput,
    model: userLabel
  });
  const waitingMsg = {
    role: 'ai',
    text: t('step_script_editor_text_placeholder_ai_chat_wait'),
    model: modelLabel,
    waiting: true
  };
  chatMessages.value.push(waitingMsg);
  chatInput.value = '';
  nextTick(() => {
    if (chatMessagesContainer.value) {
      chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
    }
  });
  // todo: add timeout?
  const response = await sendMessage(userInput);
  if (response.script) {
    scriptHistory.value.push(response.script);
    scriptIndex.value = scriptHistory.value.length - 1;
    editorContent.value = scriptHistory.value[scriptIndex.value];
  }
  const idx = chatMessages.value.indexOf(waitingMsg);
  if (idx !== -1) {
    chatMessages.value.splice(idx, 1, {
      role: 'ai',
      text: response.answer,
      model: modelLabel
    });
  }
  nextTick(() => {
    if (chatMessagesContainer.value) {
      chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
    }
  });
}

let openai: OpenAI | undefined = undefined;

const sendMessage = async (userInput: string): Promise<AIMessageContent> => {
  try {
    if (AIUtils.IsUsingDemoAI()) {
      const all_tokens = await AIUtils.getTotalTokens();
      if (all_tokens > 30000) {
        throw new Error(t('step_script_editor_text_placeholder_ai_chat_demo_token_exceeded'));
      }
    }
    if (!userInput) {
      throw new Error('Message cannot be empty');
    }
    const ai_model = aiModels.value.find(e => e.value === selectedAIModel.value)?.value;
    if (!ai_model) {
      throw new Error('Invalid model');
    }
    const settings = await AIUtils.getAISettings();
    if (!openai) {
      if (!settings.baseURL) {
        throw new Error('Invalid baseURL');
      }
      if (!settings.apiKey) {
        throw new Error('Invalid apiKey');
      }
      openai = new OpenAI({
        baseURL: settings.baseURL,
        apiKey: settings.apiKey,
        dangerouslyAllowBrowser: true
      });
    }

    const pageHtml = analyzePageHtml.value ? await props.getPageHtml() : '';
    const inspectedNodeJsonDetails = props.inspectedNodeDetails ? JSON.stringify(props.inspectedNodeDetails, null, 2) : '';
    const pageUrl = inspectedNodeJsonDetails.length > 0 ? await props.getPageUrl() : '';
    const existingCode = editorContent.value || '';
    const summary = aiMessageContents.length > 0 ? aiMessageContents[aiMessageContents.length - 1].answer : '';
    const language = await AIUtils.getLanguage();
    const systemPrompt = AIUtils.getSystemPrompt(language);
    let userPrompt = AIUtils.getUserPrompt(userInput, pageUrl, pageHtml, inspectedNodeJsonDetails, existingCode, summary);
    for (let i = 0; i < 2; i++) {
      const response = await openai.chat.completions.create({
        model: ai_model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        top_p: 0.8,
        max_tokens: 4096,
        stream: false,
        n: 1
      });

      if (response && response.choices.length > 0 && response.choices[0].message?.content) {
        const tokens = response.usage?.total_tokens || 3000;
        if (AIUtils.IsUsingDemoAI()) {
          let all_tokens = await AIUtils.getTotalTokens();
          all_tokens += tokens;
          AIUtils.setTotalTokens(all_tokens);
        }
        const aiMessage: AIMessage = { role: 'assistant', content: response.choices[0].message.content };
        aiMessages.push(aiMessage);
        let msgContent = response.choices[0].message.content;
        // some stupid model will always wrapper the json with ```json ...```
        msgContent = msgContent.trim();
        const json_pre = '```json';
        const json_end = '```';
        if (msgContent.indexOf(json_pre) >= 0 && msgContent.endsWith(json_end)) {
          const index_pre = msgContent.indexOf(json_pre);
          msgContent = msgContent.slice(index_pre + json_pre.length).trim();
          msgContent = msgContent.slice(0, msgContent.length - json_end.length).trim();
        }
        const content = AIUtils.parse2AIMessageContent(msgContent);
        if (content) {
          aiMessageContents.push(content);
          return content;
        }
        else {
          // retry
          const summaryEx = `${summary}
In previous session, you output in the wrong format:
${response.choices[0].message.content}

This output is not a valid JSON, and it cannot be parsed using JSON.parse directly.
Please make sure your output is in the correct JSON format: { script: string, answer: string }
Do not add any useless prefix like \`\`\`json or other extra styles, text, Markdown, or code blocks. Make sure the whole output can be parsed by JSON.parse.
`;
          const userInputEx = `${userInput}
Output the result in plain text which in the JSON format: { script: string, answer: string }
Do not add any useless prefix like \`\`\`json or other extra styles, text, Markdown, or code blocks. Make sure the whole output can be parsed by JSON.parse.
`
          userPrompt = AIUtils.getUserPrompt(userInputEx, pageUrl, pageHtml, inspectedNodeJsonDetails, existingCode, summaryEx);
        }
      }
    }

    throw new Error('Invalid AI Response');
  }
  catch (error) {
    console.error('sendMessage error:', error);
    if (error instanceof OpenAIError) {
      if ('code' in error && !Utils.isNullOrUndefined(error.code)) {
        return { script: '', answer: `${error.code}:${error.message}` };
      }
      else {
        return { script: '', answer: error.message };
      }
    }
    else if (error instanceof Error) {
      return { script: '', answer: error.message };
    }
    else {
      return { script: '', answer: String(error) };
    }
  }
}

onMounted(async () => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const update = () => { isDark.value = media.matches; };
  media.addEventListener('change', update);
  // Clean up
  onUnmounted(() => {
    media.removeEventListener('change', update);
  });

  editorContent.value = props.step.script;

  const settings = await AIUtils.getAISettings();
  const models = settings.models.split(';').filter(m => m.trim().length > 0);
  if (models.length > 0) {
    aiModels.value = [];
    for (const model of models) {
      aiModels.value.push({ label: model, value: model });
    }
    selectedAIModel.value = aiModels.value[0].value;
  }
  if (aiModels.value.length > 0) {
    chatMessages.value.push({ role: 'ai', text: t('step_script_editor_text_placeholder_ai_chat'), model: aiModels.value[0].label });
  }

  if (AIUtils.IsUsingDemoAI()) {
    isAnalyzePageHtmlSupported.value = false;
  }
  else {
    isAnalyzePageHtmlSupported.value = true;
  }
});

defineExpose({ addStepScript });
</script>

<style scoped>
[hidden] {
  display: none !important;
}

.step-script-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  padding: 0 0 4px 0;
  font-size: 14px;
}

.editor-section {
  display: flex;
  flex: 0 0 50%;
  flex-direction: column;
  margin-bottom: 0;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.editor-header>div:last-child {
  display: flex;
  gap: 4px;
}

.editor-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  letter-spacing: 0.02em;
}

.btn {
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;
  background-color: transparent;
  color: #555;
}

.btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  transform: none;
  box-shadow: none;
}

.btn:active {
  background-color: rgba(0, 0, 0, 0.1);
  transform: none;
  box-shadow: none;
}

.btn-back,
.btn-forward .btn-run .btn-inspect {
  background-color: transparent;
}

.btn-send {
  background: linear-gradient(90deg, #673ab7 0%, #9c27b0 100%);
  color: white;
  border: none;
}

.editor-container {
  flex: 1 0 0;
  overflow: hidden;
  border: 1px solid #ccc;
  border-radius: 4px;
}

:deep(.cm-editor) {
  height: 100% !important;
  font-size: 14px;
}

:deep(.cm-scroller) {
  overflow-x: hidden !important;
  overflow-y: auto !important;
  white-space: pre-wrap !important;
  max-height: 100% !important;
}

.ai-chatbox {
  display: flex;
  flex: 0 0 50%;
  flex-direction: column;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fafafa;
}

.ai-chat-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  width: 100%;
}

.ai-selector {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-selector label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.ai-selector select {
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #bbb;
  font-size: 14px;
  background: #fff;
  color: #222;
  transition: border 0.2s;
  width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-selector select:focus {
  border-color: #1976d2;
  background-color: rgba(0, 0, 0, 0.1);
  outline: none;
}

.analyze-page-option {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding: 4px 0;
  cursor: pointer;
}

.analyze-page-option input[type="checkbox"] {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid #bbb;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  position: relative;
}

.analyze-page-option input[type="checkbox"]:disabled {
  cursor: not-allowed;
}

.analyze-page-option input[type="checkbox"]:checked {
  background-color: #673ab7;
  border-color: #673ab7;
}

.analyze-page-option input[type="checkbox"]:checked::after {
  content: "✓";
  position: absolute;
  color: white;
  font-size: 12px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.analyze-page-option label {
  font-size: 14px;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
}

.ai-chat-messages {
  display: flex;
  flex: 1 1 0;
  overflow-y: auto;
  margin-bottom: 8px;
  flex-direction: column;
  min-height: 80px;
}

.chat-msg {
  margin-bottom: 4px;
  padding: 4px 8px;
  border-radius: 3px;
  word-break: break-word;
  background: rgba(0, 0, 0, 0.05);
  align-self: flex-start;
  font-size: 14px;
}

.chat-msg.user {
  background: rgba(25, 118, 210, 0.1);
  align-self: flex-end;
}

.chat-msg.waiting {
  color: #888;
  font-style: italic;
}

.model-label {
  font-size: 11px;
  color: #888;
  margin-right: 4px;
}

.ai-chat-input-row {
  display: flex;
  gap: 8px;
}

.ai-chat-input {
  flex: 1;
  padding: 4px 8px;
  border-radius: 3px;
  border: 1px solid #ccc;
  background-color: rgba(0, 0, 0, 0.05);
  font-size: 14px;
  line-height: 1.4;
  /* 14px*1.4 + 4px*2 + 2px= 34px */
  min-height: 34px;
  /* (14px*1.4)*2 + 4px*2 + 2px = 64px */
  max-height: 64px;
  overflow-y: auto;
  resize: none;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.ai-chat-input:focus {
  background-color: rgba(0, 0, 0, 0.1);
  outline: none;
}

/* Dark mode adaptations */
@media (prefers-color-scheme: dark) {

  .editor-label {
    color: #e0e0e0;
  }

  .btn {
    color: #ccc;
  }

  .btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .editor-container {
    border-color: #333;
  }

  .ai-chatbox {
    border-color: #333;
    background: #23272e;
  }

  .ai-selector label {
    color: #b0b0b0;
  }

  .ai-selector select {
    background-color: rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
    border-color: #444;
  }

  .ai-selector select:focus {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .analyze-page-option input[type="checkbox"] {
    background-color: #2d2d2d;
    border-color: #555;
  }

  .analyze-page-option label {
    color: #e0e0e0;
  }

  .chat-msg {
    background-color: rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
  }

  .chat-msg.user {
    background-color: rgba(66, 165, 245, 0.2);
    color: #b3e5fc;
  }

  .chat-msg.waiting {
    color: #b0b0b0;
  }

  .ai-chat-input {
    background-color: rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
    border-color: #444;
  }

  .ai-chat-input:focus {
    border-color: #82b1ff;
    background-color: rgba(255, 255, 255, 0.15);
    color: #fff;
  }

  .ai-selector label,
  .model-label {
    color: #b0b0b0;
  }

}
</style>