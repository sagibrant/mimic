<template>
  <div class="sidebar-container">
    <ConfirmDialog :style="{ width: '20rem' }"></ConfirmDialog>
    <Dialog v-model:visible="isAddTaskNodeDialogVisible" modal header="Add a Task or Group" :style="{ width: '20rem' }">
        <div class="flex items-center gap-4 mb-4">
            <label for="add_new_node_type" class="font-semibold w-24">Type</label>
            <Select id="add_new_node_type" v-model="selectedAddTaskNodeType" :options="addTaskNodeTypes" optionLabel="name" defaultValue="task" class="flex-auto" fluid />
        </div>
        <div class="flex items-center gap-4 mb-8">
            <label for="add_new_node_name" class="font-semibold w-24">Name</label>
            <InputText id="add_new_node_name" class="flex-auto" autocomplete="off" fluid />
        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="isAddTaskNodeDialogVisible = false"></Button>
            <Button type="button" label="Save" @click="isAddTaskNodeDialogVisible = false"></Button>
        </div>
    </Dialog>

    <!-- Header with menus -->
    <header class="sidebar-header">
      <!-- Task menus -->
      <div class="menu-bar" :class="{ 'readonly': isRecording || isReplaying || isBottomExpanded }">
        <button class="menu-btn" :disabled="!isIdle" @click="handleDemoTask" :title="t('sidebar_btn_title_demo')">
          {{ t('sidebar_btn_label_demo') }}
        </button>
        <span class="menu-divider"></span>
        <button class="menu-btn" :disabled="!isIdle" @click="handleLoadTask" :title="t('sidebar_btn_title_load')">
          {{ t('sidebar_btn_label_load') }}
        </button>
        <span class="menu-divider"></span>
        <button class="menu-btn" :disabled="!isIdle" @click="handleSaveTask" :title="t('sidebar_btn_title_save')">
          {{ t('sidebar_btn_label_save') }}
        </button>
        <span class="menu-divider"></span>
        <button class="menu-btn" :disabled="!isIdle" @click="handleDownloadTask"
          :title="t('sidebar_btn_label_download')">
          {{ t('sidebar_btn_title_download') }}
        </button>
        <!-- <span class="menu-divider"></span>
        <button class="menu-btn" :disabled="!isIdle" @click="handleOpenStore" :title="t('sidebar_btn_title_store')">
          {{ t('sidebar_btn_label_store') }}
        </button> -->
        <span class="menu-divider"></span>
        <button class="menu-btn" :disabled="!isIdle" @click="handleOpenHelpDocument"
          :title="t('sidebar_btn_title_help')">
          {{ t('sidebar_btn_label_help') }}
        </button>
      </div>
    </header>

    <!-- Middle section with task tree and steps panel -->
    <main class="sidebar-middle">
      <!-- Task tree panel with toggle -->
      <div class="task-tree-panel"
        :class="{ 'collapsed': isTreeCollapsed, 'readonly': isRecording || isReplaying || isBottomExpanded }">
        <!-- Task tree controls -->
        <div class="tree-controls">
          <button class="command-btn" :disabled="!isIdle" @click="toggleTree"
            :title="isTreeCollapsed ? t('sidebar_btn_title_tree_expand') : t('sidebar_btn_title_tree_collapse')">
            {{ isTreeCollapsed ? t('sidebar_btn_label_tree_expand') : t('sidebar_btn_label_tree_collapse') }}
          </button>
          <button class="command-btn" v-if="!isTreeCollapsed" :disabled="!(activeTaskNodeId && isIdle)"
            @click="handleAddTaskNode" :title="t('sidebar_btn_title_tree_add_node')">
            {{ t('sidebar_btn_label_tree_add_node') }}
          </button>
          <button class="command-btn" v-if="!isTreeCollapsed" :disabled="!(activeTaskNodeId && isIdle)"
            @click="handleDeleteTaskNode" :title="t('sidebar_btn_title_tree_delete_node')">
            {{ t('sidebar_btn_label_tree_delete_node') }}
          </button>
        </div>
        <!-- Task tree container -->
        <div class="tree-container" v-if="!isTreeCollapsed">
          <tree-node :node="taskTree" :active-node-id="activeTaskNodeId" @node-selected="handleTaskNodeSelect"
            @rename-node="handleTaskNodeRename" />
        </div>
      </div>

      <!-- Steps panel -->
      <div class="steps-panel" @click="handleStepsPanelClick">
        <!-- Steps controls -->
        <div class="steps-controls">
          <button class="command-btn" :disabled="!(activeTaskId && isIdle)" :class="{ 'readonly': isBottomExpanded }"
            @click="handleAddStep" :title="t('sidebar_btn_title_steps_add_step')">
            {{ t('sidebar_btn_label_steps_add_step') }}
          </button>
          <button class="command-btn" :disabled="!(activeTaskId && isIdle && selectedStepUid)"
            :class="{ 'readonly': isBottomExpanded }" @click="handleRemoveStep"
            :title="t('sidebar_btn_title_steps_delete_step')">
            {{ t('sidebar_btn_label_steps_delete_step') }}
          </button>
          <span class="menu-divider"></span>
          <button class="command-btn" :disabled="!(activeTaskId && isIdle)" @click="handleRecord"
            :title="t('sidebar_btn_title_steps_record')">
            {{ t('sidebar_btn_label_steps_record') }}
          </button>
          <span class="menu-divider"></span>
          <button class="command-btn" :disabled="!(activeTaskId && isIdle)" :class="{ 'readonly': isBottomExpanded }"
            @click="handleReplay" :title="t('sidebar_btn_title_steps_replay')">
            {{ t('sidebar_btn_label_steps_replay') }}
          </button>
          <button class="command-btn" :disabled="!(activeTaskId && isIdle && selectedStepUid)"
            @click="handleReplayFromStep" :title="t('sidebar_btn_title_steps_replayFromStep')">
            {{ t('sidebar_btn_label_steps_replayFromStep') }}
          </button>
          <span class="menu-divider"></span>
          <button class="command-btn" :disabled="!(activeTaskId && (isReplaying || isRecording))" @click="handleStop"
            :title="t('sidebar_btn_title_steps_stop')">
            {{ t('sidebar_btn_label_steps_stop') }}
          </button>
          <span class="menu-divider"></span>
          <button class="command-btn" :disabled="!(isIdle)" @click="toggleCDPAttach"
            :title="isDebuggerAttached ? t('sidebar_btn_title_steps_debugger_detach') : t('sidebar_btn_title_steps_debugger_attach')">
            {{ isDebuggerAttached ? t('sidebar_btn_label_steps_debugger_detach') :
              t('sidebar_btn_label_steps_debugger_attach') }}
          </button>
        </div>
        <!-- Steps container -->
        <div class="steps-container" :class="{ 'readonly': isRecording || isReplaying || isBottomExpanded }">
          <div v-for="step in activeSteps" :key="step.uid" :draggable="!!(activeTaskId && isIdle)" class="step-card"
            :class="{ 'selected': selectedStepUid === step.uid }" @click.stop="handleStepSelect(step.uid)"
            @dragstart="handleDragStart(step.uid)" @dragover.prevent="handleDragOver(step.uid)"
            @drop.prevent="handleDrop(step.uid)">
            <div class="step-type">
              <span class="step-type-icon">≡</span>
            </div>
            <div class="step-description" @dblclick.stop="handleStepDescriptionDblClick(step.uid)"
              v-if="!isStepEditing(step.uid)">
              {{ getStepDescription(step) }}
            </div>
            <input type="text" class="step-description-edit" v-if="isStepEditing(step.uid)"
              v-model="editedStepDescription" @keydown.enter="saveStepDescription(step.uid)"
              @blur="saveStepDescription(step.uid)" @keydown.esc="cancelStepEdit" ref="stepInput">
            <div class="step-status" :class="step.last_status ?? 'pending'"
              @click.stop="handleStepResultClick(step.uid)" :title="step.last_error">
              {{ step.last_status === 'passed' ? '✓' : (step.last_status === 'failed' ? '✗' : '○') }}
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom section with tabs -->
    <footer class="sidebar-bottom" :class="{ 'expanded': isBottomExpanded, 'readonly': isRecording || isReplaying }">
      <div class="bottom-controls">
        <button class="bottom-control-btn" :disabled="!(activeTaskId && selectedStepUid && isIdle)"
          @click="toggleBottomExpanded"
          :title="isBottomExpanded ? t('sidebar_btn_title_bottom_collapse') : t('sidebar_btn_title_bottom_expand')">
          {{ isBottomExpanded ? t('sidebar_btn_label_bottom_expand') : t('sidebar_btn_label_bottom_collapse') }}
        </button>
      </div>

      <div class="sidebar-bottom-content content-panel" v-if="sidebarBottomType === 'step' && selectedStep">
        <step-script-editor ref="stepScriptEditor" :step="selectedStep" :key="selectedStep.uid"
          :inspected-node-details="inspectedNodeDetails" @run-script="handleRunScript"
          @show-notification-message="showNotificationMessage" :get-page-html="getPageHtml" :get-page-url="getPageUrl"
          :toggle-inspect-mode="toggleInspectMode"></step-script-editor>
      </div>
      <!-- Result tab -->
      <div class="sidebar-bottom-content content-panel" v-if="sidebarBottomType === 'result' && selectedStepResult">
        <step-result-view :result="selectedStepResult" :key="selectedStepResult.step_uid"
          @show-notification-message="showNotificationMessage"></step-result-view>
      </div>
    </footer>

    <!-- Notification component -->
    <div class="notification" :class="{ 'visible': showNotification }">
      {{ notificationMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import TreeNode from './TreeNode.vue';
import StepScriptEditor from './StepScriptEditor.vue'
import StepResultView from './StepResultView.vue'
import { TaskAsset, TaskGroup, Task, Step, TaskResult, StepResult } from '../../execution/Task';
import { TaskUtils } from '../../execution/TaskUtils';
import { Utils } from '@/common/Common';
import { SettingUtils } from '@/common/Settings';
import { SidebarUtils } from './SidebarUtils';
import { useConfirm } from "primevue/useconfirm";

/**
 * Get localized text by key
 * @param key - The key of the text to localize
 * @returns Localized text string
 */
const t = (key: string) => {
  return chrome.i18n.getMessage(key) || key; // Fallback to key if message not found
};

const primevueConfirm = useConfirm();
const isAddTaskNodeDialogVisible = ref(false);
const selectedAddTaskNodeType = ref<'group'|'task'>('group');
const addTaskNodeTypes = ref([
    { name: t('sidebar_btn_action_tree_add_node_task'), code: 'task' },
    { name: t('sidebar_btn_action_tree_add_node_group'), code: 'group' }
]);

/**
 * Union type representing either a task or a task group in the tree
 */
type TaskNode = TaskGroup | Task;

/**
 * Demo task group with sample data
 */
const emptyTaskAsset: TaskAsset = TaskUtils.createNewTaskAsset();

// Reactive state management
/** Whether the task tree panel is collapsed */
const isTreeCollapsed = ref(true);

/** Currently active tab in the bottom panel */
const sidebarBottomType = ref<'step' | 'result'>('step');

/** Whether to show the notification message */
const showNotification = ref(false);

/** Text content of the notification message */
const notificationMessage = ref('');

/** The current timeout id for the notification message */
const lastNotificationMessageTimeOutId = ref<any>(undefined);

/** The task assets */
const taskAsset = ref<TaskAsset>(emptyTaskAsset);

/** The root node of the task tree */
const taskTree = ref<TaskNode>(emptyTaskAsset.root);

/** The list of the task run results */
const taskResults: TaskResult[] = [];

/** ID of the currently active node in the task tree. */
const activeTaskNodeId = ref('');

/** ID of the currently active task. */
const activeTaskId = ref('');

/** Steps inside the steps-container (may only contain one step when bottom script panel enlarged) */
const activeSteps = ref<Step[]>([]);

/** UID of the currently selected step */
const selectedStepUid = ref('');

/** the currently selected step */
const selectedStep = ref<Step | null>(null);

/** Execution result of the currently selected step */
const selectedStepResult = ref<StepResult | null>(null);

/** UID of the step being dragged */
const draggedStepUid = ref('');

/** Step editing state */
const stepScriptEditor = ref<InstanceType<typeof StepScriptEditor> | null>(null);
const editingStepUid = ref('');
const editedStepDescription = ref('');

/** 
 * The UI mode for the sidebar
 * idle:
 *    menu buttons: enable
 *    task tree: enable
 *    task buttons: enbable
 *    script panel: normal or expanded
 * record:
 *    menu buttons: disabled
 *    task tree: disabled
 *    task buttons: disabled except 'stop record' button
 *    script panel: expanded
 * replay:
 *    menu buttons: disabled
 *    task tree: disabled
 *    task buttons: disabled except 'stop replay' button
 *    script panel: normal
 */
const uiMode = ref<'idle' | 'record' | 'replay'>('idle');
const isReplaying = computed(() => uiMode.value === 'replay');
const isRecording = computed(() => uiMode.value === 'record');
const isIdle = computed(() => uiMode.value === 'idle');
const isBottomExpanded = ref<boolean>(false);
const runningScript = ref('');
const isDebuggerAttached = ref<boolean>(false);
/** task replay & replay abort controller */
const replayAbortController = ref<AbortController | null>(null);
const recordAbortController = ref<AbortController | null>(null);
const isInspectStarted = ref(false);
const inspectedNodeDetails = computed(() => selectedStep.value?.objects?.length ? selectedStep.value.objects[0] : null);

// Methods

/**
 * Show a notification message
 * @param message - The message to display
 */
const showNotificationMessage = (message: string, timeout: number = 1000) => {
  notificationMessage.value = message;
  showNotification.value = true;
  if (lastNotificationMessageTimeOutId.value) {
    clearTimeout(lastNotificationMessageTimeOutId.value);
    lastNotificationMessageTimeOutId.value = undefined;
  }
  const timeoutId = setTimeout(() => {
    showNotification.value = false;
    lastNotificationMessageTimeOutId.value = undefined;
  }, timeout);
  lastNotificationMessageTimeOutId.value = timeoutId;
};

// Mock menu handlers
/**
 * Handle "Demo" button click
 */
const handleDemoTask = () => {
  if (!isIdle.value) {
    return;
  }
  const task = findTaskNode(n => n.type === 'task');
  if (task) {
    primevueConfirm.require({
      message: t('sidebar_btn_action_load_demo_confirm_text'),
      header: t('sidebar_btn_action_load_demo_confirm_header'),
      icon: 'pi pi-exclamation-triangle',
      rejectProps: {
        label: t('sidebar_confirm_cancel'),
        severity: 'secondary',
        outlined: true
      },
      acceptProps: {
        label: t('sidebar_confirm_accept')
      },
      accept: () => {
        taskResults.splice(0);
        const asset = createDemoTaskAsset();
        initTaskData(asset.root);
      },
      reject: () => {
        return;
      }
    });
  }
  else {
    taskResults.splice(0);
    const asset = createDemoTaskAsset();
    initTaskData(asset.root);
  }
};

const createDemoTaskAsset = () => {
  const uiLanguage = chrome.i18n.getUILanguage();
  const asset = TaskUtils.createNewTaskAsset();
  const task = findTaskNode(n => n.type === 'task', asset.root);
  if (task?.type !== 'task') {
    throw new Error('Fail to create Demo Task asset');
  }
  const sjtudemoSteps = [
    {
      description: '1. 打开新页面',
      script: `const newpage = await page.openNewPage();
await newpage.bringToFront();`
    },
    {
      description: '2. 导航到 Bing',
      script: `await page.navigate("https://www.bing.com");
await page.sync();`
    },
    {
      description: '3. 输入 sjtu',
      script: `await page.element('#sb_form_q').first().fill('sjtu');`
    },
    {
      description: '4. 点击搜索',
      script: `await page.element('#sb_form_go').click();`
    },
    {
      description: '5. 点击进入sjtu主页',
      script: `await page.sync();
const elements = await page.querySelectorAll('#b_results > li.b_algo > h2 > a');
for (const elem of elements) {
  const textContent = await elem.textContent();
  if (textContent.includes('上海交通大学中文主页')) {
    await elem.click();
    break;
  }
}`
    },
  ];
  const saucedemoSteps = [
    {
      description: '1. Navigate to demo page',
      script: `const url = 'https://www.saucedemo.com/';
await page.navigate(url);
await page.bringToFront();
await page.sync();`
    },
    {
      description: '2. Login',
      script: `await page.element('#login_credentials').first().text().nth(1).highlight();
const username = await page.element('#login_credentials').first().text().nth(1).textContent();

const password = await page.element().filter({ name: 'data-test', value: 'login-password', type: 'attribute' }).first().text().nth(1).textContent();
await page.element().filter({ name: 'data-test', value: 'login-password', type: 'attribute' }).first().text().nth(1).highlight();

await page.element('#user-name').highlight();
await page.element('#user-name').fill(username);

await page.element('#password').highlight();
await page.element('#password').fill(password);

await page.element('#login-button').highlight();
await page.element('#login-button').click();

await page.sync();`
    },
    {
      description: '3. Buy Backpack',
      script: `await page.element('div .inventory_item_name ').filter({ name: 'textContent', value: /Backpack/ }).highlight();
await page.element('div .inventory_item_name ').filter({ name: 'textContent', value: /Backpack/ }).click();
await page.sync();
const count = await page.element('button#add-to-cart').count();
if (count === 1) {
  await page.element('button#add-to-cart').highlight();
  await page.element('button#add-to-cart').click();
}
await page.element('#back-to-products').highlight();
await page.element('#back-to-products').click();
await page.sync();`
    },
    {
      description: '4. Buy Bike Light & Fleece Jacket',
      script: `const items = await page.element('div .inventory_item_description').all();
const names = [/Bike Light/, /Fleece Jacket/];
for (const item of items) {
  for (const name of names) {
    if (await item.text(name).count() === 1 && await item.text('Add to cart').count() === 1) {
      await item.text(name).highlight();
      await item.text('Add to cart').highlight();
      await item.text('Add to cart').click();
    }
  }
}
const itemCount = await page.element('#shopping_cart_container > a > span').textContent();
expect(itemCount).toEqual('3');
await page.element('#shopping_cart_container > a').highlight();
await page.element('#shopping_cart_container > a').click();
await page.sync();`
    },
    {
      description: '5. Checkout',
      script: `await page.element('#checkout').highlight();
await page.element('#checkout').click();
await page.sync();
await page.element('input#first-name').highlight();
await page.element('input#first-name').fill('first_name');
await page.element('input#last-name').highlight();
await page.element('input#last-name').fill('last_name');
await page.element('input#postal-code').highlight();
await page.element('input#postal-code').fill('111111');
await page.element('#continue').highlight();
await page.element('#continue').click();
await page.sync();`
    },
    {
      description: '6. Verify and Finish',
      script: `const elems = await page.element('div.inventory_item_price').all();
let total_price = 0;
for (const elem of elems) {
  await elem.highlight();
  const textContent = await elem.textContent();
  const index = textContent.indexOf('$');
  const price = Number(textContent.slice(index + 1));
  total_price += price;
}
await page.element('div.summary_subtotal_label').highlight();
const summary_total_text = await page.element('div.summary_subtotal_label').textContent();
const index = summary_total_text.indexOf('$');
const summary_total_price = Number(summary_total_text.slice(index + 1));
expect(total_price).toBe(summary_total_price);

await page.element('#finish').highlight();
await page.element('#finish').click();`
    },
    {
      description: '7. Back Home',
      script: `await page.element('#back-to-products').highlight();
await page.element('#back-to-products').click();`
    },
    {
      description: '8. Reset and Logout',
      script: `await page.element('#react-burger-menu-btn').highlight();
await page.element('#react-burger-menu-btn').click();
let exists = await page.element('div.bm-menu').text('Reset App State').count() === 1;
while (!exists) {
  await wait(500);
  exists = await page.element('div.bm-menu').text('Reset App State').count() === 1;
}
await page.element('div.bm-menu').text('Reset App State').highlight();
await page.element('div.bm-menu').text('Reset App State').click();
await page.element('div.bm-menu').text('Logout').highlight();
await page.element('div.bm-menu').text('Logout').click();`
    },
  ];
  const demoSteps = uiLanguage.startsWith('zh') ? sjtudemoSteps : saucedemoSteps;
  for (const stepInfo of demoSteps) {
    const step: Step = {
      uid: Utils.generateUUID(),
      type: 'script_step',
      description: stepInfo.description,
      script: stepInfo.script
    };
    task.steps.push(step);
  }
  return asset;
};

/**
 * Handle "Load" button click
 */
const handleLoadTask = () => {
  if (!isIdle.value) {
    return;
  }

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.gogogo';
  fileInput.addEventListener('change', async (event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const content = await readFileContent(file);
      const asset = JSON.parse(content);
      if (TaskUtils.isTaskAsset(asset)) {
        taskAsset.value = asset;
        taskResults.splice(0);
        taskResults.splice(0, 0, ...asset.results);
        updateAllTaskStepResults(asset.root, taskResults);
        initTaskData(asset.root);
      }
      else {
        showNotificationMessage(t('sidebar_btn_action_load_error_invalid_file'), 2000);
      }
    } catch (error) {
      console.error(error);
      showNotificationMessage(t('sidebar_btn_action_load_error'), 2000);
    }
  });

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Cannot read the file contents'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  fileInput.click();
};

/**
 * Handle "Save Task" button click
 */
const handleSaveTask = async () => {
  if (!isIdle.value) {
    return;
  }

  if (!taskTree.value || !taskAsset.value) {
    return;
  }

  const asset: TaskAsset = taskAsset.value;
  asset.root = taskTree.value;
  asset.results = taskResults;
  const jsonContent = JSON.stringify(asset, null, 2);

  try {
    await chrome.storage.local.set({
      lastAsset: jsonContent
    });
    showNotificationMessage(t('sidebar_btn_action_save_notification'));
  } catch (error) {
    console.error(error);
    showNotificationMessage(t('sidebar_btn_action_save_error'), 2000);
  }
};

/**
 * Handle "Download" button click
 */
const handleDownloadTask = () => {
  if (!isIdle.value) {
    return;
  }

  if (!taskTree.value || !taskAsset.value) {
    return;
  }

  try {
    const asset = taskAsset.value;
    asset.root = taskTree.value;
    asset.results = taskResults;

    const jsonContent = JSON.stringify(asset, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = 'tasks.gogogo';
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    showNotificationMessage(t('sidebar_btn_action_download_error'), 2000);
  }
};

/**
 * Handle "Open Store" button click
 */
// const handleOpenStore = async () => {
//   if (!isIdle.value) {
//     return;
//   }
//   try {
//     const result = SettingUtils.getSettings();
//     if (result && result.storeURL) {
//       await chrome.tabs.create({ url: result.storeURL });
//     } else {
//       showNotificationMessage(t('sidebar_btn_action_store_error_storeURLNotConfigured'));
//     }
//   } catch (error) {
//     console.error(error);
//     showNotificationMessage(t('sidebar_btn_action_store_error_failedToOpenStore'));
//   }
// };

/**
 * Handle "Open Help Document" button click
 */
const handleOpenHelpDocument = async () => {
  if (!isIdle.value) {
    return;
  }
  try {
    const docURL = 'https://github.com/sagibrant/gogogo-docs';
    await chrome.tabs.create({ url: docURL });
  } catch (error) {
    console.error(error);
    showNotificationMessage(t('sidebar_btn_action_help_docs_error_failedToOpenHelpDocument'));
  }
};

// Lifecycle hooks
/**
 * Initialize component on mount
 */
onMounted(async () => {
  const result = await chrome.storage.local.get(['lastAsset']);
  const content = result.lastAsset || '';
  let asset: TaskAsset = emptyTaskAsset;
  if (content && typeof (content) === 'string') {
    try {
      let result = JSON.parse(content);
      if (TaskUtils.isTaskAsset(result)) {
        asset = result;
      }
    }
    catch (error) {
      console.warn('onMounted', error);
    }
  }
  taskAsset.value = asset;
  taskResults.splice(0);
  taskResults.splice(0, 0, ...asset.results);
  updateAllTaskStepResults(asset.root, taskResults);
  initTaskData(asset.root);

  try {
    const engine = SidebarUtils.engine;
    const attached = await engine.isDebuggerAttached();
    isDebuggerAttached.value = attached;
    // the sidebar may closed before stop recording, we need to manually close the recording if it is in recording
    const isRecording = await engine.isRecording();
    if (isRecording) {
      await engine.stopRecording();
    }
  }
  catch (error) {
    console.warn('onMounted::cdp', error);
  }

  SidebarUtils.handler.on('nodeInspected', ({ details }) => {
    if (selectedStep.value) {
      selectedStep.value.objects = [details as any];
    }
    toggleInspectMode();
  });

  SidebarUtils.handler.on('stepRecorded', ({ step }) => {
    if (selectedStep.value) {
      const scripts: string[] = [];
      if (step.browserScript) {
        scripts.push(step.browserScript);
      }
      if (step.pageScript) {
        scripts.push(step.pageScript);
      }
      if (step.frameScript) {
        scripts.push(step.frameScript);
      }
      if (step.elementScript) {
        scripts.push(step.elementScript);
      }
      if (step.actionScript) {
        scripts.push(step.actionScript);
      }
      const stepScript = (step.await ? 'await ' : '') + scripts.join('.') + ';'
      if (stepScriptEditor.value) {
        stepScriptEditor.value.addStepScript(stepScript);
      }
    }
  });
});

const updateAllTaskStepResults = (root: TaskNode, taskResults: TaskResult[]) => {
  let nodes = [root];
  while (nodes.length > 0) {
    const node = nodes.shift();
    if (node && node.type === 'task') {
      const task = node as Task;
      const taskResult = taskResults.find(t => t.task_id === task.id);
      if (taskResult) {
        for (const step of task.steps) {
          const stepResult = taskResult.steps.find(r => r.step_uid === step.uid);
          if (stepResult) {
            step.last_error = stepResult.error;
            step.last_status = stepResult.status;
          }
        }
      }
    }
    if (node?.type == 'group' && node.children.length > 0) {
      nodes = [...nodes, ...node.children];
    }
  }
};

/**
 * Recursively load task data from the task tree
 * @param node - Current node to process
 */
const initTaskData = (root: TaskNode) => {
  // check if the pre node still exists
  if (activeTaskNodeId.value) {
    const node = findTaskNode((node) => {
      return node.id === activeTaskNodeId.value
    }, root);
    if (!node) {
      activeTaskNodeId.value = '';
    }
  }
  // check if the pre task still exists
  if (activeTaskId.value) {
    const node = findTaskNode((node) => {
      return node.id === activeTaskId.value && node.type === 'task'
    }, root);
    if (!node) {
      activeTaskId.value = '';
    }
    // check if the pre step still exists
    else if (!(node.type === 'task' && selectedStepUid.value && node.steps.findIndex(s => s.uid === selectedStepUid.value) >= 0)) {
      selectedStepUid.value = '';
    }
  }
  // if not task selected, try to select the first non-empty task
  if (activeTaskNodeId.value.length === 0) {
    const task = findTaskNode((node) => {
      return node.type === 'task' && node.steps.length > 0;
    }, root);
    if (task) {
      activeTaskNodeId.value = task.id;
      activeTaskId.value = task.id;
      selectedStepUid.value = '';
    }
  }
  // if still not task selected, try to select the first task
  if (activeTaskNodeId.value.length === 0) {
    const task = findTaskNode((node) => {
      return node.type === 'task';
    }, root);
    if (task) {
      activeTaskNodeId.value = task.id;
      activeTaskId.value = task.id;
      selectedStepUid.value = '';
    }
  }

  taskTree.value = { ...root };

  handleTaskNodeSelect(activeTaskNodeId.value);
  if (activeTaskId.value !== activeTaskNodeId.value || !activeTaskId.value) {
    handleTaskSelect(activeTaskId.value);
  }
  handleStepSelect(selectedStepUid.value);
};

/**
 * find a task node using the match function
 * @param match match function
 */
const findTaskNode = (match: (node: TaskNode) => boolean, root: TaskNode = taskTree.value) => {
  let nodes = [root];
  while (nodes.length > 0) {
    const node = nodes.shift();
    if (node && match(node)) {
      return node;
    }
    if (node?.type == 'group' && node.children.length > 0) {
      nodes = [...nodes, ...node.children];
    }
  }
  return null;
}

/**
 * Handle selection of a task from the task tree
 * @param taskId - ID of the selected task
 */
const handleTaskSelect = (taskId: string) => {
  if (!taskId) {
    selectedStepResult.value = null;
    selectedStep.value = null;
    selectedStepUid.value = '';
    activeSteps.value = [];
    activeTaskId.value = '';
    return;
  }
  const task = findTaskNode((node) => {
    return node.id === taskId && node.type === 'task';
  });
  if (!task || task.type !== 'task') {
    return;
  }

  selectedStepResult.value = null;
  selectedStep.value = null;
  selectedStepUid.value = '';

  activeTaskId.value = taskId;
  activeSteps.value = [...task.steps];
};

/**
 * Handle selection of a step from the steps panel
 * @param uid - UID of the selected step
 */
const handleStepSelect = (stepUid: string) => {
  // allow to unselect the steps in any cases
  if (!stepUid) {
    selectedStepResult.value = null;
    selectedStep.value = null;
    selectedStepUid.value = '';
    return
  }

  if (!activeTaskId.value || selectedStepUid.value === stepUid) {
    return;
  }

  const task = findTaskNode((node) => {
    return node.id === activeTaskId.value && node.type === 'task';
  });
  if (!task || task.type === 'group') {
    return;
  }
  const step = task.steps.find(s => s.uid === stepUid);
  if (!step) {
    return;
  }

  selectedStepUid.value = stepUid;
  selectedStep.value = step;
  const result_task = taskResults.find(t => t.task_id === task.id);
  if (result_task) {
    const result = result_task.steps.find(s => s.step_uid === stepUid);
    if (result) {
      selectedStepResult.value = result;
    }
  }

  // update the bottom content to script editor view
  sidebarBottomType.value = 'step';
};

/**
 * Get a human-readable description for a step
 * @param step - The step to generate a description for
 * @returns Description string
 */
const getStepDescription = (step: Step): string => {
  return step.description || 'new step';
};

/**
 * Check if a step is in editing mode
 * @param uid - Step UID
 * @returns Boolean indicating edit mode
 */
const isStepEditing = (uid: string) => {
  return editingStepUid.value === uid;
};

/**
 * Cancel step description editing
 */
const cancelStepEdit = () => {
  editingStepUid.value = '';
};

/**
 * Handle double click on step description to edit
 * @param uid - Step UID
 */
const handleStepDescriptionDblClick = (stepUid: string) => {
  const step = activeSteps.value.find(s => s.uid === stepUid);
  if (step) {
    editingStepUid.value = stepUid;
    editedStepDescription.value = step.description || '';

    nextTick(() => {
      const input = document.querySelector(`.step-description-edit`) as HTMLInputElement;
      input?.focus();
    });
  }
};

/**
 * Save edited step description
 * @param uid - Step UID
 */
const saveStepDescription = (stepUid: string) => {
  const trimmedDesc = editedStepDescription.value.trim();
  if (trimmedDesc) {
    const step = activeSteps.value.find(s => s.uid === stepUid);
    if (step) {
      step.description = trimmedDesc;
      activeSteps.value = [...activeSteps.value];
    }
  }
  editingStepUid.value = '';
  editedStepDescription.value = '';
};

/**
 * Handle click on a step result from the steps panel
 * @param uid - UID of the selected step
 */
const handleStepResultClick = (_uid: string) => {
  // todo: display results in a better ui
  // sidebarBottomType.value = 'result';
};

// Tree node management functions
/**
 * Toggle the collapsed state of the task tree panel
 */
const toggleTree = () => {
  if (!isIdle.value) {
    return;
  }

  isTreeCollapsed.value = !isTreeCollapsed.value;
};

/**
 * Handle selection of a task/task group from the task tree panel
 * @param nodeId - ID of the selected task/task group
 */
const handleTaskNodeSelect = (nodeId: string) => {
  if (!isIdle.value) {
    console.warn(`unexpected task node selection event - ${nodeId} , uimode - ${uiMode.value}`);
    return;
  }

  const node = findTaskNode((node) => {
    return node.id === nodeId;
  });
  if (!node) {
    return;
  }
  activeTaskNodeId.value = nodeId;
  if (node && node.type === 'task') {
    handleTaskSelect(node.id);
  }
};

/**
 * Rename node
 * @param nodeId - Node ID to rename
 * @param newName - New name for the node
 */
const handleTaskNodeRename = (nodeId: string, newName: string) => {
  if (!isIdle.value) {
    console.warn(`unexpected task node name change event - ${nodeId} , ${newName} , uimode - ${uiMode.value}`);
    return;
  }

  const node = findTaskNode((node) => {
    return node.id === nodeId;
  });
  if (!node) {
    return;
  }
  node.name = newName;
  // Trigger reactivity
  taskTree.value = { ...taskTree.value };
};

/**
 * Add new task node (group or task)
 */
const handleAddTaskNode = () => {
  if (!(isIdle.value && activeTaskNodeId.value)) {
    return;
  }

  const t_task = t('sidebar_btn_action_tree_add_node_task');
  const t_group = t('sidebar_btn_action_tree_add_node_group');
  isAddTaskNodeDialogVisible.value = true;
  let nodeType = prompt(t('sidebar_btn_action_tree_add_node_prompt_enter_node_type'), t_task);
  if (!nodeType || (nodeType !== t_group && nodeType !== t_task)) {
    alert(t('sidebar_btn_action_tree_add_node_alert_enter_node_type_invalid'));
    return;
  }

  if (nodeType === t_group) {
    nodeType = 'group';
  }
  else {
    nodeType = 'task';
  }

  const nodeName = prompt(t('sidebar_btn_action_tree_add_node_prompt_enter_node_name'));
  if (!nodeName?.trim()) {
    alert(t('sidebar_btn_action_tree_add_node_alert_enter_node_name_invalid'));
    return;
  }

  const newNode = {
    id: Utils.generateUUID(),
    name: nodeName.trim(),
    type: nodeType as 'group' | 'task',
    ...(nodeType === 'group' ? { children: [] } : { steps: [] })
  } as TaskNode;

  // Find parent and add new node
  const addNewNodeToTree = (node: TaskNode, targetId: string): boolean => {
    if (node.id === targetId) {
      if (node.type === 'group' && node.children) {
        node.children.push(newNode);
        return true;
      }
      // If target is a task, should be handled by its parent group
      return false;
    }

    if (node.type === 'group' && node.children) {
      // If target found in children task, use splice to update the children array
      if (node.children.some(child => child.id === targetId && child.type === 'task')) {
        const targetIndex = node.children.findIndex(child => child.id === targetId);
        node.children.splice(targetIndex + 1, 0, newNode as TaskNode);
        return true;
      }
      // if target not found, try the child groups
      for (let i = 0; i < node.children.length; i++) {
        if (node.children[i].type === 'group' && addNewNodeToTree(node.children[i], targetId)) {
          return true;
        }
      }
    }

    return false;
  };

  const targetId = activeTaskNodeId.value ?? activeTaskId.value;
  if (addNewNodeToTree(taskTree.value, targetId)) {
    activeTaskNodeId.value = newNode.id;
    if (nodeType === 'task') {
      activeTaskId.value = newNode.id;
    }
    // taskTree.value = { ...taskTree.value }; 
    initTaskData(taskTree.value); // Trigger reactivity
  } else {
    showNotificationMessage(t('sidebar_btn_action_tree_add_node_failed'));
  }
};

/**
 * Delete selected task node
 */
const handleDeleteTaskNode = () => {
  if (!(isIdle.value && activeTaskNodeId.value)) {
    return;
  }

  primevueConfirm.require({
    message: t('sidebar_btn_action_tree_delete_node_confirm_text'),
    header: t('sidebar_btn_action_tree_delete_node_confirm_header'),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: t('sidebar_confirm_cancel'),
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: t('sidebar_confirm_accept')
    },
    accept: () => {
      // Remove node from tree
      const removeNodeFromTree = (node: TaskNode, targetId: string): boolean => {
        if (node.type === 'group' && node.children) {
          const index = node.children.findIndex(child => child.id === targetId);
          if (index !== -1) {
            node.children.splice(index, 1);
            return true;
          }

          for (const child of node.children) {
            if (removeNodeFromTree(child, targetId)) {
              return true;
            }
          }
        }
        return false;
      };

      if (removeNodeFromTree(taskTree.value, activeTaskNodeId.value)) {
        // taskTree.value = { ...taskTree.value }; // Trigger reactivity
        initTaskData(taskTree.value);
      } else {
        showNotificationMessage(t('sidebar_btn_action_tree_delete_node_failed'));
      }
    },
    reject: () => {
      return;
    }
  });

};


// Step management functions
/**
 * Add new step
 */
const handleAddStep = (payload: MouseEvent | undefined, edit: boolean = true) => {
  if (!(isIdle.value && activeTaskId.value)) {
    return;
  }

  const task = findTaskNode(node => node.id === activeTaskId.value);
  if (!task || task.type !== 'task') {
    return;
  }

  const newStep: Step = {
    uid: Utils.generateUUID(),
    type: 'script_step',
    description: t('sidebar_btn_action_steps_add_step_new_step_label'),
    script: ''
  };

  if (selectedStepUid.value) {
    // Add after selected step
    const index = task.steps.findIndex(step => step.uid === selectedStepUid.value);
    if (index < 0) {
      return;
    }
    task.steps.splice(index + 1, 0, newStep);
  } else {
    task.steps.push(newStep);
  }

  activeSteps.value = [...task.steps];
  handleStepSelect(newStep.uid);

  if (!edit) return;
  nextTick(() => {
    handleStepDescriptionDblClick(newStep.uid);
  });
};

/**
 * Remove selected step
 */
const handleRemoveStep = () => {
  if (!(isIdle.value && activeTaskId.value && selectedStepUid.value)) {
    return;
  }

  const task = findTaskNode(node => node.id === activeTaskId.value);
  if (!task || task.type !== 'task') {
    return;
  }

  const index = task.steps.findIndex(step => step.uid === selectedStepUid.value);
  if (index < 0) {
    return;
  }

  task.steps.splice(index, 1);
  activeSteps.value = [...task.steps];

  // Update selection
  if (activeSteps.value.length > 0) {
    const newIndex = index > activeSteps.value.length - 1 ? activeSteps.value.length - 1 : index;
    handleStepSelect(activeSteps.value[newIndex].uid);
  }
  else {
    handleStepSelect('');
  }
};


// Drag and drop handlers
/**
 * Handle drag start event for reordering steps
 * @param uid - UID of the step being dragged
 */
const handleDragStart = (uid: string) => {
  draggedStepUid.value = uid;
};

/**
 * Handle drag over event (required to allow drop)
 * @param uid - UID of the step being dragged over
 */
const handleDragOver = (_uid: string) => {
  // Prevent default to allow drop
};

/**
 * Handle drop event to reorder steps
 * @param targetUid - UID of the step where the dragged step is dropped
 */
const handleDrop = (targetUid: string) => {
  if (!(isIdle.value && activeTaskId.value)) {
    draggedStepUid.value = '';
    return;
  }

  const task = findTaskNode(node => node.id === activeTaskId.value);
  if (!task || task.type !== 'task') {
    return;
  }

  if (draggedStepUid.value && draggedStepUid.value !== targetUid) {
    // Find indices of dragged and target steps
    const draggedIndex = task.steps.findIndex(s => s.uid === draggedStepUid.value);
    if (draggedIndex >= 0) {
      const newSteps = [...task.steps];
      // remove the dragged step
      const [movedStep] = newSteps.splice(draggedIndex, 1);
      const targetIndex = newSteps.findIndex(s => s.uid === targetUid);
      if (targetIndex >= 0) {
        // insert the dragged step before the dropped step
        newSteps.splice(targetIndex, 0, movedStep);
      }
      // make sure we replace the steps only if the drag drop succeeded
      if (newSteps.length === task.steps.length) {
        task.steps = newSteps;
        activeSteps.value = [...task.steps];
        handleStepSelect(draggedStepUid.value);
      }
    }
  }

  draggedStepUid.value = '';
};

/**
 * Handle steps panel click (for deselecting steps)
 * @param e - Click event
 */
const handleStepsPanelClick = (e: MouseEvent) => {
  if (!isIdle.value) {
    return;
  }
  // Check if click is on empty area
  if ((e.target as HTMLElement).closest('.steps-container') &&
    !(e.target as HTMLElement).closest('.step-card')) {
    handleStepSelect('');
  }
};

const toggleUIMode = (newMode: 'idle' | 'record' | 'replay' | 'replayFromStep') => {
  uiMode.value = newMode === 'replayFromStep' ? 'replay' : newMode;
  if (newMode === 'record') {
    isTreeCollapsed.value = true;
    if (isBottomExpanded.value === false) {
      toggleBottomExpanded();
    }
  }
  else if (newMode === 'replay') {
    isTreeCollapsed.value = true;
    if (isBottomExpanded.value === true) {
      toggleBottomExpanded();
    }
  }
  else if (newMode === 'replayFromStep') {
    isTreeCollapsed.value = true;
  }
}

/**
 * Handle "Record" button click
 */
const handleRecord = async () => {
  if (!(isIdle.value && activeTaskId.value)) {
    return;
  }

  const task = findTaskNode(node => node.id === activeTaskId.value);
  if (!task || task.type !== 'task') {
    return;
  }

  if (!selectedStepUid.value) {
    handleAddStep(undefined, false);
  }

  if (!selectedStepUid.value) return;

  toggleUIMode('record');
  await SidebarUtils.engine.startRecording();
};

/**
 * Handle "Replay" button click
 * the replay will run all the steps
 */
const handleReplay = async () => {
  if (!(isIdle.value && activeTaskId.value)) {
    return;
  }

  const task = findTaskNode(node => node.id === activeTaskId.value);
  if (!task || task.type !== 'task') {
    return;
  }

  if (task.steps.length <= 0) {
    return;
  }

  const pre_selectedStepUid = selectedStepUid.value;
  toggleUIMode('replay');

  const taskResult: TaskResult = {
    task_id: task.id,
    task_start_time: Date.now(),
    task_end_time: -1,
    status: 'passed',
    last_error: undefined,
    steps: []
  };

  const index = taskResults.findIndex(r => r.task_id === taskResult.task_id);
  if (index >= 0) {
    taskResults.splice(index, 1, taskResult);
  }
  else {
    taskResults.push(taskResult);
  }

  for (const step of activeSteps.value) {
    step.last_error = undefined;
    step.last_status = undefined;
  }

  showNotificationMessage(t('sidebar_btn_action_steps_replay_start'));

  const stepResults = await runSteps(activeSteps.value);

  taskResult.steps = stepResults;
  taskResult.task_end_time = Date.now();
  const lastErrorStep = stepResults.findLast(r => r.status === 'failed');
  if (lastErrorStep) {
    taskResult.status = 'failed';
    taskResult.last_error = lastErrorStep.error;
    showNotificationMessage(t('sidebar_btn_action_steps_replay_failed'), 3000);
  }
  else {
    taskResult.status = 'passed';
    showNotificationMessage(t('sidebar_btn_action_steps_replay_passed'), 3000);
  }

  activeSteps.value = [...activeSteps.value];
  handleStepSelect(pre_selectedStepUid);

  toggleUIMode('idle');
};

/**
 * Handle "Replay from Step" button click
 * the "Replay from Step" will run the steps from the selectedStep in the activeSteps
 */
const handleReplayFromStep = async () => {
  if (!(isIdle.value && activeTaskId.value && selectedStepUid.value)) {
    return;
  }

  const task = findTaskNode(node => node.id === activeTaskId.value);
  if (!task || task.type !== 'task') {
    return;
  }

  const pre_selectedStepUid = selectedStepUid.value;
  const selectedStepIndex = activeSteps.value.findIndex(s => s.uid === pre_selectedStepUid);
  if (selectedStepIndex < 0) {
    return;
  }

  const steps = activeSteps.value.slice(selectedStepIndex);
  if (steps.length <= 0) {
    return;
  }

  toggleUIMode('replayFromStep');

  let taskResult: TaskResult = {
    task_id: task.id,
    task_start_time: Date.now(),
    task_end_time: -1,
    status: 'passed',
    last_error: undefined,
    steps: []
  };

  const index = taskResults.findIndex(r => r.task_id === taskResult.task_id);
  if (index >= 0) {
    taskResult = taskResults[index];
    taskResult.task_start_time = Date.now();
    taskResult.task_end_time = -1;
  }
  else {
    taskResults.push(taskResult);
  }

  for (const step of steps) {
    const stepIndex = taskResult.steps.findIndex(s => s.step_uid === step.uid);
    if (stepIndex >= 0) {
      taskResult.steps[stepIndex].error = undefined;
      taskResult.steps[stepIndex].status = undefined;
    }
    step.last_error = undefined;
    step.last_status = undefined;
  }

  showNotificationMessage(t('sidebar_btn_action_steps_replay_start'));

  const stepResults = await runSteps(steps);

  for (const stepResult of stepResults) {
    const stepIndex = taskResult.steps.findIndex(s => s.step_uid === stepResult.step_uid);
    if (stepIndex >= 0) {
      taskResult.steps[stepIndex] = stepResult;
    }
    else {
      taskResult.steps.push(stepResult);
    }
  }
  taskResult.task_end_time = Date.now();
  const lastErrorStep = stepResults.findLast(r => r.status === 'failed');
  if (lastErrorStep) {
    taskResult.status = 'failed';
    taskResult.last_error = lastErrorStep.error;
    showNotificationMessage(t('sidebar_btn_action_steps_replay_failed'), 3000);
  }
  else {
    taskResult.status = 'passed';
    showNotificationMessage(t('sidebar_btn_action_steps_replay_passed'), 3000);
  }

  activeSteps.value = [...activeSteps.value];
  handleStepSelect(pre_selectedStepUid);

  toggleUIMode('idle');
};

/**
 * Handle "Pause Replay" button click
 */
const handleStop = async () => {
  if (!(isRecording.value || isReplaying.value)) {
    return;
  }

  if (replayAbortController.value) {
    replayAbortController.value.abort();
    showNotificationMessage(t('sidebar_btn_action_steps_replay_stopped'));
  }

  if (recordAbortController.value) {
    recordAbortController.value.abort();
    showNotificationMessage(t('sidebar_btn_action_steps_record_stopped'));
  }

  if (isRecording.value) {
    await SidebarUtils.engine.stopRecording();
  }

  toggleUIMode('idle');
};

/**
 * toggle the cdp attach or detach
 */
const toggleCDPAttach = async () => {
  try {
    const engine = SidebarUtils.engine;
    if (isDebuggerAttached.value) {
      await engine.detachDebugger();
    }
    else {
      await engine.attachDebugger();
    }
    isDebuggerAttached.value = !isDebuggerAttached.value;
  }
  catch (error) {
    console.error('toggleCDPAttach failed', error);
    const msg = isDebuggerAttached.value ? t('sidebar_btn_action_steps_debugger_detach_failed') : t('sidebar_btn_action_steps_debugger_attach_failed');
    showNotificationMessage(msg);
  }
}

/**
 * Helper function for waiting with abort support
 */
const wait = (timeout: number, signal: AbortSignal) => {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, timeout);

    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new Error('Operation aborted'));
    });
  });
};

/**
 * run the give steps
 * @param steps steps to run
 */
const runSteps = async (steps: Step[]): Promise<StepResult[]> => {

  replayAbortController.value = new AbortController();
  const signal = replayAbortController.value.signal;
  const settings = SettingUtils.getSettings();

  // update the current settings into the sandbox
  try {
    const engine = SidebarUtils.engine;
    await engine.updateSettings();
  } catch (error) {
    console.error('runSteps: updateSettings failed', error);
  }

  // enable cdp if needed
  const stepResults: StepResult[] = [];
  let lastStepResult: StepResult | undefined = undefined;
  let lastStep: Step | undefined = undefined;
  try {
    if (settings.replaySettings.attachDebugger) {
      await SidebarUtils.engine.attachDebugger();
    }
  } catch (error) {
    console.error('runSteps: attachDebugger failed', error);
  }

  try {
    for (const step of steps) {
      if (signal.aborted) {
        break;
      }
      handleStepSelect(step.uid);
      lastStepResult = {
        step_uid: step.uid,
        step_description: step.description,
        step_start_time: Date.now(),
        step_end_time: -1,
        status: 'passed',
        error: undefined,
        screenshot: undefined
      };
      lastStep = step;
      lastStep.last_status = undefined;
      lastStep.last_error = undefined;

      await runStep(step, settings.replaySettings.stepTimeout);

      lastStepResult.step_end_time = Date.now();
      lastStepResult.status = 'passed';
      stepResults.push(lastStepResult);
      lastStepResult = undefined;
      lastStep.last_status = 'passed';
      lastStep = undefined;

      if (signal.aborted) {
        break;
      }

      if (settings.replaySettings.stepInterval > 0) {
        await wait(settings.replaySettings.stepInterval, signal);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (lastStepResult) {
      lastStepResult.step_end_time = Date.now();
      lastStepResult.status = 'failed';
      lastStepResult.error = errorMessage;
      stepResults.push(lastStepResult);
    }
    if (lastStep) {
      lastStep.last_status = 'failed';
      lastStep.last_error = errorMessage;
    }
  } finally {
    try {
      if (settings.replaySettings.attachDebugger) {
        await SidebarUtils.engine.detachDebugger();
      }
    } catch (error) {
      console.error('runSteps: detachDebugger failed', error);
    }
    return stepResults;
  }
}

/** 
 * run a step
 */
const runStep = async (step: Step, timeout: number) => {
  if (step.script.length === 0) {
    return undefined;
  }
  const engine = SidebarUtils.engine;
  return await engine.runScript(step.script, true, timeout);
}

/**
 * Handle "Run Script" button click in StepScriptEditor
 */
const handleRunScript = async (script: string) => {
  if (script.length === 0) {
    return;
  }
  if (runningScript.value.length > 0) {
    showNotificationMessage('Another script is running');
    return;
  }
  showNotificationMessage('Script run started', 1000);
  const settings = SettingUtils.getSettings();
  const engine = SidebarUtils.engine;
  // update the current settings into the sandbox
  try {
    const engine = SidebarUtils.engine;
    await engine.updateSettings();
  } catch (error) {
    console.error('handleRunScript: updateSettings failed', error);
  }
  runningScript.value = script;
  try {
    const result = await engine.runScript(script, true, settings.replaySettings.stepTimeout);
    if (result) {
      console.debug('Script run result:', result);
      if (typeof result === 'object') {
        try {
          const msg = JSON.stringify(result);
          showNotificationMessage(`Script run result: ${msg}`, 3000);
        }
        catch {
          showNotificationMessage(`Script run result: ${result}`, 3000);
        }
      }
      else {
        showNotificationMessage(`Script run result: ${result}`, 3000);
      }
    }
    else {
      showNotificationMessage('Script run completed', 2000);
    }
  }
  catch (error) {
    showNotificationMessage(error instanceof Error ? error.message : String(error), 3000);
  }
  finally {
    runningScript.value = '';
  }
}

/**
 * toggle InspectMode
 */
const toggleInspectMode = async (): Promise<void> => {
  const engine = SidebarUtils.engine;
  await engine.toggleInspectMode();
  isInspectStarted.value = !isInspectStarted.value;
  if (isInspectStarted.value === true && inspectedNodeDetails.value !== null) {
    if (selectedStep.value) {
      selectedStep.value.objects = [];
    }
  }
}

/**
 * Get the page url
 */
const getPageUrl = async (): Promise<string> => {
  const engine = SidebarUtils.engine;
  const pageUrl = await engine.getPageUrl();
  return pageUrl;
}

/**
 * Get the page html content
 */
const getPageHtml = async (): Promise<string> => {
  const engine = SidebarUtils.engine;
  const pageHtml = await engine.getPageHtml();
  return pageHtml;
}

/**
 * Toggle expanded state for sidebar bottom
 * only allow to toggle when select on a step
 * the purpose is to make sure the script editor is big enough for editing
 */
const toggleBottomExpanded = () => {
  if (!(activeTaskId.value && selectedStepUid.value)) {
    return;
  }

  const task = findTaskNode(node => node.id === activeTaskId.value);
  if (!task || task.type !== 'task') {
    return;
  }
  const stepUid = selectedStepUid.value;
  if (!stepUid) {
    return;
  }
  const step = task.steps.find(s => s.uid === stepUid);
  if (!step) {
    return;
  }

  if (isBottomExpanded.value) {
    isBottomExpanded.value = false;
    activeSteps.value = [...task.steps];
    handleStepSelect(stepUid);
  }
  else {
    isBottomExpanded.value = true;
    isTreeCollapsed.value = true;
    const newSteps = [step];
    activeSteps.value = newSteps;
    handleStepSelect(stepUid);
  }
};

</script>

<style scoped>
.readonly {
  pointer-events: none;
  opacity: 0.7;
}

.disabled {
  cursor: not-allowed;
}

/* Main container Styles */
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  color: #333;
  background-color: #fff;
  font-family: Roboto, Arial, sans-serif;
  overflow: hidden;
  border-left: 1px solid #e0e0e0;
}

/* Header Styles */
.sidebar-header {
  flex-shrink: 0;
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.menu-bar {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  user-select: none;
}

.menu-bar:last-child {
  margin-bottom: 0;
}

.menu-btn {
  padding: 6px 12px;
  border: none;
  background-color: transparent;
  color: #555;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 2px;
}

.menu-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #333;
}

.menu-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.menu-divider {
  width: 1px;
  height: 16px;
  background-color: #ddd;
  margin: 0 4px;
}


/* Middle Section Styles */
.sidebar-middle {
  display: flex;
  flex: 1 1 auto;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

/** Task tree panel Styles */
.task-tree-panel {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
  background-color: #fafafa;
  min-width: 160px;
  max-width: 160px;
}

.task-tree-panel.collapsed {
  min-width: 24px;
}

.task-tree-panel.collapsed .tree-controls {
  border-bottom: none;
  padding: 0, 4px;
}

.task-tree-panel.collapsed .tree-container {
  display: none;
}

.tree-controls {
  display: flex;
  align-items: center;
  padding: 4px;
  border-bottom: 1px solid #e0e0e0;
  user-select: none;
}

.command-btn {
  padding: 6px;
  border: none;
  background-color: transparent;
  color: #555;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 2px;
  font-size: 16px;
}

.command-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #333;
}

.command-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 2px;
  overflow-x: auto;
  min-width: 160px;
}

/* Steps panel controls */
.steps-panel {
  flex: 1 1 auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.steps-controls {
  display: flex;
  align-items: center;
  padding: 4px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  user-select: none;
}

.steps-container {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-card {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.step-card:hover {
  border-color: #bdbdbd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.step-card:hover .step-type-icon {
  color: #555;
}

.step-card.selected {
  background-color: #337ab7;
  color: white;
  border-color: #337ab7;
}

.step-card.selected .step-type {
  border-right-color: rgba(255, 255, 255, 0.3);
}

.step-card.selected .step-type-icon {
  color: rgba(255, 255, 255, 0.8);
}

.step-type {
  min-width: 40px;
  height: 100%;
  padding: 0 12px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;
  transition: background-color 0.2s;
}

.step-type:active {
  background-color: rgba(0, 0, 0, 0.05);
}

.step-type-icon {
  font-size: 16px;
  color: #888;
  transition: color 0.2s;
}

.step-description {
  flex: 1;
  padding: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-description-edit {
  flex: 1;
  padding: 0 12px;
  min-width: 100px;
}

.step-status {
  min-width: 24px;
  text-align: center;
  font-weight: bold;
}

.step-status.passed {
  color: #4caf50;
}

.step-status.failed {
  color: #f44336;
}

.step-status.pending {
  color: #9e9e9e;
}

/* Bottom Section Styles */
.sidebar-bottom {
  border-top: 1px solid #e0e0e0;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  overflow: hidden;
  transition: max-height 0.3s ease;
  max-height: 300px;
}

.sidebar-bottom.expanded {
  flex: 1 0 auto;
  max-height: none;
}

/** if bottom expanded, middle should be collapsed and display as readonly */
.sidebar-container:has(.sidebar-bottom.expanded) .sidebar-middle {
  flex: 0 0 auto;
}

.bottom-controls {
  display: flex;
  justify-content: flex-end;
  padding: 4px;
  background-color: #f5f5f5;
  user-select: none;
}

.bottom-control-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #555;
}

.bottom-control-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #333;
}

.bottom-control-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.sidebar-bottom-content {
  padding: 0 16px 16px 16px;
  overflow-y: auto;
  flex: 1 0 auto;
}

.content-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Notification */
.notification {
  position: absolute;
  bottom: 20px;
  right: 20px;
  padding: 12px 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 4px;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 100;
}

.notification.visible {
  opacity: 1;
}


/* Dark Mode Styles */
@media (prefers-color-scheme: dark) {
  .sidebar-container {
    color: #e0e0e0;
    background-color: #121212;
  }

  .sidebar-header {
    border-bottom-color: #333;
    background-color: #1e1e1e;
  }

  .menu-btn {
    color: #ccc;
    background-color: transparent;
  }

  .menu-btn:hover {
    color: #fff;
    background-color: rgba(0, 0, 0, 0.05);
  }

  .menu-btn:disabled {
    color: #555;
  }

  .task-tree-panel {
    border-right-color: #333;
    background-color: #1e1e1e;
  }

  .command-btn {
    color: #ccc;
  }

  .command-btn:hover {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.1);
  }

  .command-btn:disabled {
    color: #555;
  }

  .tree-controls,
  .steps-controls {
    background-color: #1e1e1e;
    border-bottom-color: #333;
  }

  .step-card {
    border-color: #333;
    background-color: #1e1e1e;
  }

  .step-card:hover {
    border-color: #555;
  }

  .step-card:hover .step-type-icon {
    color: #ddd;
  }

  .step-type {
    border-right-color: #333;
  }

  .step-type:active {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .step-type-icon {
    color: #aaa;
  }

  .sidebar-bottom {
    border-top-color: #333;
    background-color: #1e1e1e;
  }

  .bottom-controls {
    background-color: #1e1e1e;
  }

  .bottom-control-btn {
    color: #ccc;
  }

  .bottom-control-btn:hover {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.1);
  }

  .bottom-control-btn:disabled {
    color: #555;
  }
}
</style>