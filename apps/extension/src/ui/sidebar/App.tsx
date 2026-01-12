import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import TreeNode from './TreeNode';
import StepScriptEditor from './StepScriptEditor';
import StepAIAgent from './StepAIAgent';
import { TaskAsset, TaskGroup, Task, Step, TaskResult, StepResult, ObjectDescription } from '../../execution/Task';
import { TaskUtils } from '../../execution/TaskUtils';
import { SettingUtils, Utils } from "@gogogo/shared";
import { SidebarUtils } from './SidebarUtils';
import { toast, Toaster } from "sonner";

export default function App() {
  console.log('sidebar ==> App');
  // Stable Util methods
  /**
   * Localization helper
   */
  const t = useCallback((key: string) => {
    return chrome.i18n.getMessage(key) || key;
  }, []);
  /**
   * wait with abort support
   */
  const wait = useCallback((timeout: number, signal: AbortSignal) => {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, timeout);

      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Operation aborted'));
      });
    });
  }, []);
  // Notification message handler
  const showNotificationMessage = useCallback((message: string, timeout: number = 3000, severity: 'success' | 'info' | 'warning' | 'error' = 'info', summary: string = '') => {
    if (summary) {
      toast[severity](message, { description: summary, duration: timeout });
    } else {
      toast[severity](message, { duration: timeout });
    }
  }, []);
  /**
   * Find task node helper function
   */
  const findTaskNode = useCallback((match: (node: TaskNode) => boolean, root: TaskNode): TaskNode | null => {
    let nodes: TaskNode[] = [root];
    while (nodes.length > 0) {
      const node = nodes.shift();
      if (node && match(node)) {
        return node;
      }
      if (node?.type === 'group' && (node as TaskGroup).children.length > 0) {
        nodes = [...nodes, ...(node as TaskGroup).children];
      }
    }
    return null;
  }, []);
  /**
   * deep update node
   */
  const deepUpdateNode = useCallback((match: (node: TaskNode) => boolean, node: TaskNode, nodeData: Partial<TaskNode>): TaskNode => {
    if (match(node)) {
      return {
        ...node,
        ...nodeData
      } as TaskNode;
    }
    if (node.type === 'group' && node.children && node.children.length > 0) {
      return {
        ...node,
        children: node.children.map(child => deepUpdateNode(match, child, nodeData))
      }
    }
    return node;
  }, []);
  /**
   * deep remove node
   */
  const deepRemoveNode = useCallback((match: (node: TaskNode) => boolean, node: TaskNode): TaskNode => {
    if (node.type === 'group' && node.children && node.children.length > 0) {
      const children = [];
      for (const child of node.children) {
        if (child.type === 'group') {
          const newChild = deepRemoveNode(match, child);
          children.push(newChild);
        }
        else if (!match(child)) {
          children.push(child);
        }
      }
      return {
        ...node,
        children
      };
    }
    return node;
  }, []);
  /**
   * deep add node
   */
  const deepAddNode = useCallback((match: (node: TaskNode) => boolean, node: TaskNode, newNode: TaskNode): TaskNode => {
    if (node.type === 'group' && match(node)) {
      return {
        ...node,
        children: [...node.children, newNode]
      }
    }
    if (node.type === 'group' && node.children && node.children.length > 0) {
      const children = [...node.children];
      const index = children.findIndex(child => match(child));
      if (index >= 0 && children[index].type === 'task') {
        children.splice(index + 1, 0, newNode);
        return {
          ...node,
          children
        }
      }
      else {
        return {
          ...node,
          children: children.map((child) => deepAddNode(match, child, newNode))
        }
      }
    }
    return node;
  }, []);

  const deepUpdateStep = useCallback((match: (step: Step) => boolean, node: TaskNode, stepData: Partial<Step>): TaskNode => {
    if (node.type === 'group') {
      return {
        ...node,
        children: node.children.map(child => deepUpdateStep(match, child, stepData))
      };
    }
    else {
      const task = node as Task;
      const steps = [...task.steps];
      const index = steps.findIndex(s => match(s));
      if (index < 0) {
        return node;
      }
      else {
        const step = steps[index];
        steps[index] = { ...step, ...stepData };
        return {
          ...task,
          steps
        };
      }
    }
  }, []);

  // Type definitions
  type TaskNode = TaskGroup | Task;

  // Empty task asset for initialization
  const emptyTaskAsset: TaskAsset = useMemo(() => {
    return TaskUtils.createNewTaskAsset()
  }, []);

  // State management
  const [uiMode, setUiMode] = useState<'idle' | 'record' | 'replay' | 'replayFromStep'>('idle');
  const [isTreeCollapsed, setIsTreeCollapsed] = useState(true);
  const [isBottomExpanded, setIsBottomExpanded] = useState(false);

  const [taskAsset, setTaskAsset] = useState<TaskAsset>(emptyTaskAsset);
  const [taskTree, setTaskTree] = useState<TaskGroup | Task>(emptyTaskAsset.root);
  const [taskResults, setTaskResults] = useState<TaskResult[]>(emptyTaskAsset.results);
  const [activeTaskNodeId, setActiveTaskNodeId] = useState('');
  const [activeTaskId, setActiveTaskId] = useState('');
  const [selectedStepUid, setSelectedStepUid] = useState('');
  const [draggedStepUid, setDraggedStepUid] = useState('');
  const [editingStepUid, setEditingStepUid] = useState('');
  const [editedStepDescription, setEditedStepDescription] = useState('');

  const [isAddTaskNodeDialogVisible, setIsAddTaskNodeDialogVisible] = useState(false);
  const [isAIDialogVisible, setIsAIDialogVisible] = useState(false);

  const [replayAbortController, setReplayAbortController] = useState<AbortController | null>(null);

  // require async get, to be set in useEffect
  const [isDebuggerAttached, setIsDebuggerAttached] = useState(false);
  const [isInspectStarted, setIsInspectStarted] = useState(false);
  const [inspectedObject, setInspectedObject] = useState<ObjectDescription | undefined>(undefined);

  // Refs
  const stepScriptEditorRef = useRef<any>(null); // todo: remove this one, update script instead

  // Computed values
  const isReplaying = uiMode === 'replay';
  const isRecording = uiMode === 'record';
  const isIdle = uiMode === 'idle';
  const activeTask: Task | null = activeTaskId ? (findTaskNode((node) => node.id === activeTaskId, taskTree) as Task) : null;
  const activeSteps: Step[] = useMemo(() => {
    if (!activeTask) {
      return [];
    }
    if (isBottomExpanded && selectedStepUid) {
      const selectedStep = activeTask.steps.find(s => s.uid === selectedStepUid);
      return selectedStep ? [selectedStep] : [];
    }
    return activeTask.steps;
  }, [activeTask, isBottomExpanded, selectedStepUid]);
  const selectedStep: Step | undefined = activeSteps.find(s => s.uid === selectedStepUid);

  // Form schema and initialization
  const taskNodeTypes = [
    { name: t('sidebar_btn_action_tree_add_node_dialog_input_type_task'), code: 'task' },
    { name: t('sidebar_btn_action_tree_add_node_dialog_input_type_group'), code: 'group' }
  ];

  // Add node dialog state
  const [addNodeType, setAddNodeType] = useState<'task' | 'group'>('task');
  const [addNodeName, setAddNodeName] = useState('');

  // Update all task step status based on the task results
  const updateAllTaskStepResults = useCallback((root: TaskNode, results: TaskResult[]) => {
    let nodes: TaskNode[] = [root];
    while (nodes.length > 0) {
      const node = nodes.shift();
      if (node && node.type === 'task') {
        const task = node as Task;
        const taskResult = results.find(t => t.task_id === task.id);
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
      if (node?.type === 'group' && (node as TaskGroup).children.length > 0) {
        nodes = [...nodes, ...(node as TaskGroup).children];
      }
    }
  }, []);

  // Initialize task data
  const updateTaskData = useCallback((root?: TaskNode) => {
    if (root) {
      setTaskTree(root);
    }
    root = root || taskTree;

    // Select first available task by default
    const selectFirstAvailableTask = () => {
      const task = findTaskNode((node) => node.type === 'task', root);
      if (task) {
        setActiveTaskNodeId(task.id);
        setActiveTaskId(task.id);
        setSelectedStepUid('');
      }
    };

    // no previous selection, select first available task
    if (!activeTaskNodeId || !activeTaskId) {
      selectFirstAvailableTask();
      return;
    }

    // select previously active task node if still exists
    if (activeTaskNodeId) {
      const node = findTaskNode((node) => node.id === activeTaskNodeId, root);
      if (!node) {
        selectFirstAvailableTask();
        return;
      }
    }

    // select previously active task if still exists
    if (activeTaskId) {
      const node = findTaskNode((node) => node.id === activeTaskId && node.type === 'task', root);
      if (!node) {
        selectFirstAvailableTask();
        return;
      } else if (!(node.type === 'task' && selectedStepUid && (node as Task).steps.findIndex(s => s.uid === selectedStepUid) >= 0)) {
        setSelectedStepUid('');
      }
    }
  }, [taskAsset]);

  /** ==================================================================================================================== */
  /** ==================================================== menu btns ===================================================== */
  /** ==================================================================================================================== */
  // Handle demo task
  const handleDemoTask = useCallback(() => {
    if (!isIdle) {
      return;
    }

    const task = findTaskNode(n => n.type === 'task', taskTree);

    const loadDemoTask = () => {
      const asset = TaskUtils.createDemoTaskAsset();
      setTaskAsset(asset);
      setTaskTree(asset.root);
      updateTaskData(asset.root);
      setTaskResults(asset.results);
    };

    if (task) {
      if (window.confirm(t('sidebar_btn_action_load_demo_confirm_text'))) {
        loadDemoTask();
      }
    } else {
      loadDemoTask();
    }
  }, [isIdle, taskTree, updateTaskData]);

  // Handle load task
  const handleLoadTask = useCallback(() => {
    if (!isIdle) {
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
        const content = await file.text();
        const asset = JSON.parse(content);
        if (TaskUtils.isTaskAsset(asset)) {
          updateAllTaskStepResults(asset.root, asset.results);
          updateTaskData(asset.root);
          setTaskAsset(asset);
          setTaskTree(asset.root);
          setTaskResults(asset.results);
        } else {
          showNotificationMessage(t('sidebar_btn_action_load_error_invalid_file'), 3000, 'error');
        }
      } catch (error) {
        console.error(error);
        showNotificationMessage(t('sidebar_btn_action_load_error'), 3000, 'error');
      }
    });

    fileInput.click();
  }, [isIdle, updateAllTaskStepResults, updateTaskData, showNotificationMessage]);

  // Handle save task
  const handleSaveTask = useCallback(async () => {
    if (!isIdle) {
      return;
    }

    if (!taskAsset) {
      return;
    }

    const asset: TaskAsset = { ...taskAsset };
    asset.root = taskTree;
    asset.results = taskResults;
    const jsonContent = JSON.stringify(asset, null, 2);

    try {
      await chrome.storage.local.set({
        lastAsset: jsonContent
      });
      showNotificationMessage(t('sidebar_btn_action_save_notification'));
    } catch (error) {
      console.error(error);
      showNotificationMessage(t('sidebar_btn_action_save_error'), 3000, 'error');
    }
  }, [isIdle, taskAsset, taskTree, taskResults, showNotificationMessage]);

  // Handle download task
  const handleDownloadTask = useCallback(() => {
    if (!isIdle) {
      return;
    }

    if (!taskAsset) {
      return;
    }

    try {
      const asset = { ...taskAsset };
      asset.root = taskTree;
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
      showNotificationMessage(t('sidebar_btn_action_download_error'), 3000, 'error');
    }
  }, [isIdle, taskAsset, taskTree, taskResults, showNotificationMessage]);

  // Handle open help document
  const handleOpenHelpDocument = useCallback(async () => {
    if (!isIdle) {
      return;
    }
    try {
      const docURL = 'https://github.com/sagibrant/gogogo-docs';
      await chrome.tabs.create({ url: docURL });
    } catch (error) {
      console.error(error);
      showNotificationMessage(t('sidebar_btn_action_help_docs_error_failedToOpenHelpDocument'), 3000, 'error');
    }
  }, [isIdle, showNotificationMessage]);

  /** ==================================================================================================================== */
  /** ==================================================== task tree ===================================================== */
  /** ==================================================================================================================== */
  // Toggle tree collapse/expand
  const handleToggleTreeClick = useCallback(() => {
    if (!isIdle) {
      return;
    }
    setIsTreeCollapsed(!isTreeCollapsed);
  }, [isIdle, isTreeCollapsed]);

  // Handle task node selection
  const handleTaskNodeSelect = useCallback((nodeId: string) => {
    if (!isIdle) {
      console.warn(`Unexpected task node selection event - ${nodeId}, uiMode - ${uiMode}`);
      return;
    }

    const node = findTaskNode((node) => node.id === nodeId, taskTree);
    if (!node) {
      console.warn(`Task node not found for task node selection event - ${nodeId}`);
      return;
    }
    setActiveTaskNodeId(nodeId);
  }, [isIdle, uiMode, taskTree]);

  // Handle task node rename
  const handleTaskNodeRename = useCallback((nodeId: string, newName: string) => {
    if (!isIdle) {
      console.warn(`Unexpected task node name change event - ${nodeId}, ${newName}, uiMode - ${uiMode}`);
      return;
    }

    const node = findTaskNode((node) => node.id === nodeId, taskTree);
    if (!node) {
      console.warn(`Task node not found for task node name change event - ${nodeId}, ${newName}`);
      return;
    }

    const root = deepUpdateNode((node) => node.id === nodeId, taskTree, { name: newName });
    updateTaskData(root);
  }, [isIdle, uiMode, taskTree, updateTaskData]);

  // Handle task selection
  const handleTaskSelect = useCallback((taskId: string) => {
    if (!taskId) {
      console.warn(`Unexpected task node selection event - ${taskId}, uiMode - ${uiMode}`);
      return;
    }

    const task = findTaskNode((node) => node.id === taskId && node.type === 'task', taskTree);
    if (!task || task.type !== 'task') {
      console.warn(`Task not found for task node selection event - ${taskId}`);
      return;
    }

    setActiveTaskId(taskId);
    if (task.steps.findIndex(s => s.uid === selectedStepUid) < 0) {
      setSelectedStepUid('');
    }
  }, [isIdle, uiMode, taskTree]);

  // Handle the click to display the AddTaskNodeDialog 
  const handleShowAddTaskNodeDialog = useCallback(() => {
    if (!(isIdle && activeTaskNodeId)) {
      return;
    }
    setIsAddTaskNodeDialogVisible(true);
  }, [isIdle, activeTaskNodeId]);

  // Handle delete the active task node
  const handleDeleteTaskNode = useCallback(() => {
    if (!(isIdle && activeTaskNodeId)) {
      return;
    }

    // todo: change to use shadcn/ui 
    // Confirm deletion 
    if (window.confirm(t('sidebar_btn_action_tree_delete_node_confirm_message'))) {
      // Remove node from tree
      const node = findTaskNode((node) => node.id === activeTaskNodeId, taskTree);
      if (!node) {
        console.warn(`Task node not found for task node delete - ${activeTaskNodeId}`);
        showNotificationMessage(t('sidebar_btn_action_tree_delete_node_failed'), 3000, 'error');
        return;
      }
      const root = deepRemoveNode((node) => node.id === activeTaskNodeId, taskTree);
      updateTaskData(root);
    }
  }, [isIdle, activeTaskNodeId, taskTree, updateTaskData, showNotificationMessage]);

  // Handle add task node submit
  const onAddTaskNodeSubmit = useCallback(() => {
    const nodeType = addNodeType;
    const nodeName = addNodeName;
    if (!nodeType) {
      showNotificationMessage(t('sidebar_btn_action_tree_add_node_dialog_input_type_invalid'), 3000, 'error');
      return;
    }
    if (!nodeName) {
      showNotificationMessage(t('sidebar_btn_action_tree_add_node_dialog_input_name_invalid'), 3000, 'error');
      return;
    }

    setIsAddTaskNodeDialogVisible(false);
    // Reset form
    setAddNodeType('task');
    setAddNodeName('');

    const node = findTaskNode((node) => node.id === activeTaskNodeId, taskTree);
    if (!node) {
      console.warn(`Task node not found for task node add - ${activeTaskNodeId}`);
      showNotificationMessage(t('sidebar_btn_action_tree_add_node_failed'), 3000, 'error');
      return;
    }

    const newNode: TaskNode = {
      id: Utils.generateUUID(),
      name: nodeName.trim(),
      type: nodeType,
      ...(nodeType === 'group' ? { children: [] } : { steps: [] })
    } as TaskNode;

    const root = deepAddNode((node) => node.id === activeTaskNodeId, taskTree, newNode);
    updateTaskData(root);

  }, [addNodeType, addNodeName, activeTaskNodeId, taskTree, updateTaskData, showNotificationMessage]);

  // Handle add task node canceled
  const handleAddTaskNodeCanceled = useCallback(() => {
    setIsAddTaskNodeDialogVisible(false);
    // Reset form
    setAddNodeType('task');
    setAddNodeName('');
  }, []);

  /** ==================================================================================================================== */
  /** ==================================================== step menus ==================================================== */
  /** ==================================================================================================================== */
  // Handle add step
  const handleAddStep = useCallback((script: string = '', description: string = '', edit: boolean = true) => {
    if (!(isIdle && activeTaskId)) {
      return;
    }

    const task = findTaskNode(node => node.id === activeTaskId, taskTree);
    if (!task || task.type !== 'task') {
      return;
    }

    const newStep: Step = {
      uid: Utils.generateUUID(),
      type: 'script_step',
      description: description || t('sidebar_btn_action_steps_add_step_new_step_label'),
      script: script
    };

    if (selectedStepUid) {
      // Add after selected step
      const steps = [...task.steps];
      const index = steps.findIndex(step => step.uid === selectedStepUid);
      if (index >= 0) {
        steps.splice(index + 1, 0, newStep);
        task.steps = steps;
      }
      else {
        const steps = [...task.steps, newStep];
        task.steps = steps;
      }
    } else {
      const steps = [...task.steps, newStep];
      task.steps = steps;
    }

    setSelectedStepUid(newStep.uid);

    if (!edit) return newStep;

    setEditingStepUid(newStep.uid);
    setEditedStepDescription(newStep.description || '');
    return newStep;
  }, [isIdle, activeTaskId, selectedStepUid, findTaskNode]);

  // Handle remove step
  const handleRemoveStep = useCallback(() => {
    if (!(isIdle && activeTaskId && selectedStepUid)) {
      return;
    }

    const task = findTaskNode(node => node.id === activeTaskId, taskTree);
    if (!task || task.type !== 'task') {
      return;
    }

    const index = task.steps.findIndex(step => step.uid === selectedStepUid);
    if (index < 0) {
      return;
    }

    // Confirm deletion
    if (window.confirm(t('sidebar_btn_action_steps_delete_step_confirm_message'))) {
      const steps = [...task.steps];
      // Remove the selected step
      steps.splice(index, 1);
      task.steps = steps;
      // Update selection
      if (steps.length > 0) {
        const newIndex = index > task.steps.length - 1 ? task.steps.length - 1 : index;
        setSelectedStepUid(task.steps[newIndex].uid);
      } else {
        setSelectedStepUid('');
      }
    }
  }, [isIdle, activeTaskId, selectedStepUid, findTaskNode]);

  // Handle record
  const handleRecord = useCallback(async () => {
    if (!(isIdle && activeTaskId)) {
      return;
    }

    const task = findTaskNode(node => node.id === activeTaskId, taskTree);
    if (!task || task.type !== 'task') {
      return;
    }

    if (!selectedStepUid) {
      handleAddStep('', '', false);
    }

    setUiMode('record');

    await SidebarUtils.engine.startRecording();
  }, []);

  // Handle replay
  const handleReplay = useCallback(async () => {
    if (!(isIdle && activeTaskId)) {
      return;
    }

    const task = findTaskNode(node => node.id === activeTaskId, taskTree);
    if (!task || task.type !== 'task' || task.steps.length <= 0) {
      return;
    }

    setUiMode('replay');

    const pre_selectedStepUid = selectedStepUid;
    const stepIds = task.steps.map(s => s.uid);

    showNotificationMessage(t('sidebar_btn_action_steps_replay_start'));

    const stepResults = await runSteps(task.id, stepIds);

    const lastErrorStep = [...stepResults].reverse().find(r => r.status === 'failed');
    if (lastErrorStep) {
      showNotificationMessage(t('sidebar_btn_action_steps_replay_failed'), 3000, 'error');
    }
    else {
      showNotificationMessage(t('sidebar_btn_action_steps_replay_passed'), 3000, 'success');
    }

    setSelectedStepUid(pre_selectedStepUid);

    setUiMode('idle');
  }, [isIdle, activeTaskId, selectedStepUid, taskTree]);

  // Handle replay from step
  const handleReplayFromStep = useCallback(async () => {
    if (!(isIdle && activeTaskId && selectedStepUid)) {
      return;
    }

    const task = findTaskNode(node => node.id === activeTaskId, taskTree);
    if (!task || task.type !== 'task') {
      return;
    }

    const pre_selectedStepUid = selectedStepUid;
    const selectedStepIndex = activeSteps.findIndex(s => s.uid === pre_selectedStepUid);
    if (selectedStepIndex < 0) {
      return;
    }

    const steps = activeSteps.slice(selectedStepIndex);
    if (steps.length <= 0) {
      return;
    }

    setUiMode('replayFromStep');

    const stepIds = steps.map(s => s.uid);

    showNotificationMessage(t('sidebar_btn_action_steps_replay_start'));

    const stepResults = await runSteps(task.id, stepIds);

    const lastErrorStep = [...stepResults].reverse().find(r => r.status === 'failed');
    if (lastErrorStep) {
      showNotificationMessage(t('sidebar_btn_action_steps_replay_failed'), 3000, 'error');
    }
    else {
      showNotificationMessage(t('sidebar_btn_action_steps_replay_passed'), 3000, 'success');
    }

    setSelectedStepUid(pre_selectedStepUid);

    setUiMode('idle');
  }, [isIdle, activeTaskId, selectedStepUid, taskTree, activeSteps]);

  // Handle stop
  const handleStop = useCallback(async () => {
    if (!(isRecording || isReplaying)) {
      return;
    }

    if (replayAbortController) {
      replayAbortController.abort();
      showNotificationMessage(t('sidebar_btn_action_steps_replay_stopped'));
    }

    if (isRecording) {
      await SidebarUtils.engine.stopRecording();
      showNotificationMessage(t('sidebar_btn_action_steps_record_stopped'));
    }

    setUiMode('idle');
  }, [isRecording, isReplaying, replayAbortController]);

  // Toggle inspect mode
  const handleToggleInspectMode = useCallback(async () => {
    const engine = SidebarUtils.engine;
    await engine.toggleInspectMode();
    setIsInspectStarted(!isInspectStarted);
  }, [isInspectStarted]);

  // Toggle CDP attach
  const toggleCDPAttach = useCallback(async () => {
    try {
      const engine = SidebarUtils.engine;
      if (isDebuggerAttached) {
        await engine.detachDebugger();
      }
      else {
        await engine.attachDebugger();
      }
      setIsDebuggerAttached(!isDebuggerAttached);
    }
    catch (error) {
      console.error('toggleCDPAttach failed', error);
      const msg = isDebuggerAttached ? t('sidebar_btn_action_steps_debugger_detach_failed') : t('sidebar_btn_action_steps_debugger_attach_failed');
      showNotificationMessage(msg, 3000, 'error');
    }

  }, [isDebuggerAttached]);

  // Open AI dialog
  const openAIDialog = useCallback(() => {
    setIsAIDialogVisible(true);
  }, []);

  /** ==================================================================================================================== */
  /** ==================================================== step panel ==================================================== */
  /** ==================================================================================================================== */
  // Handle step selection
  const handleStepSelect = useCallback((stepUid: string) => {
    // Allow to unselect steps in any case
    if (!stepUid) {
      setSelectedStepUid('');
      return;
    }

    if (!activeTaskId) {
      console.warn('Invalid active task id for step selection');
      return;
    }

    if (selectedStepUid === stepUid) {
      return;
    }

    const task = findTaskNode((node) => node.id === activeTaskId && node.type === 'task', taskTree);
    if (!task || task.type === 'group') {
      console.warn(`Task not found for step selection - ${activeTaskId}`);
      return;
    }

    const step = task.steps.find(s => s.uid === stepUid);
    if (!step) {
      console.warn(`Step not found for step selection - ${stepUid}`);
      return;
    }

    setSelectedStepUid(stepUid);
  }, [activeTaskId, selectedStepUid, taskTree]);

  // Get step description
  const getStepDescription = useCallback((step: Step): string => {
    return step.description || 'new step';// todo: mlu
  }, []);

  // Check if step is editing
  const isStepEditing = useCallback((uid: string) => {
    return editingStepUid === uid;
  }, [editingStepUid]);

  // Cancel step edit
  const cancelStepEdit = useCallback(() => {
    setEditingStepUid('');
    setEditedStepDescription('');
  }, []);

  // Handle step description double click
  const handleStepDescriptionDblClick = useCallback((stepUid: string) => {
    const step = activeSteps.find(s => s.uid === stepUid);
    if (!step) {
      console.warn(`Step not found for description edit - ${stepUid}`);
      return;
    }
    setEditingStepUid(stepUid);
    setEditedStepDescription(step.description || '');
  }, [activeSteps]);

  // Save step description
  const saveStepDescription = useCallback((stepUid: string) => {
    const trimmedDesc = editedStepDescription.trim();
    if (trimmedDesc) {
      const step = activeSteps.find(s => s.uid === stepUid);
      if (step) {
        step.description = trimmedDesc;
      }
    }
    setEditingStepUid('');
    setEditedStepDescription('');
  }, [activeSteps, editedStepDescription]);

  // Handle step result click
  const handleStepResultClick = useCallback((_uid: string) => {
    // todo: display results in a better UI
    // setSidebarBottomType('result');
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((stepUid: string) => {
    setDraggedStepUid(stepUid);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((stepUid: string) => {
    // Prevent default to allow drop
  }, []);

  // Handle drop
  const handleDrop = useCallback((targetStepUid: string) => {
    if (!draggedStepUid || draggedStepUid === targetStepUid) {
      return;
    }

    const task = findTaskNode(node => node.id === activeTaskId && node.type === 'task', taskTree);
    if (!task || task.type !== 'task') {
      return;
    }

    const steps = [...task.steps];
    const draggedIndex = steps.findIndex(step => step.uid === draggedStepUid);
    const targetIndex = steps.findIndex(step => step.uid === targetStepUid);

    if (draggedIndex === -1 || targetIndex === -1) {
      return;
    }

    // Remove dragged step from its original position
    const [draggedStep] = steps.splice(draggedIndex, 1);
    // Insert it at the target position
    steps.splice(targetIndex, 0, draggedStep);

    // Update task steps
    task.steps = steps;
    setDraggedStepUid('');
  }, [draggedStepUid, activeTaskId, taskTree, findTaskNode]);

  // Handle steps panel click
  const handleStepsPanelClick = useCallback(() => {
    // Deselect any selected step when clicking on the panel background
  }, []);

  /** 
   * run a step
   */
  const runStep = async (step: Step): Promise<StepResult> => {
    const settings = SettingUtils.getSettings();
    const stepResult: StepResult = {
      step_uid: step.uid,
      step_description: step.description,
      step_start_time: Date.now(),
      step_end_time: -1,
      status: 'passed',
      result: undefined,
      error: undefined,
      screenshot: undefined
    };
    try {
      deepUpdateStep(s => s.uid === step.uid, taskTree, { last_error: undefined, last_status: undefined });
      setSelectedStepUid(step.uid);
      const result = await SidebarUtils.engine.runScript(step.script, true, settings.replaySettings.stepTimeout);
      stepResult.step_end_time = Date.now();
      stepResult.status = 'passed';
      stepResult.result = result;
      deepUpdateStep(s => s.uid === step.uid, taskTree, { last_error: undefined, last_status: 'passed' });
      setSelectedStepUid(step.uid);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
      stepResult.step_end_time = Date.now();
      stepResult.status = 'failed';
      stepResult.error = errorMessage;
      deepUpdateStep(s => s.uid === step.uid, taskTree, { last_error: errorMessage, last_status: 'failed' });
      setSelectedStepUid(step.uid);
    }
    return stepResult;
  }

  /**
   * run the give steps on the given taskId, update the step results into the taskResults
   * @param taskId id of the task
   * @param stepIds ids of steps to run
   * @param stopOnError whether to stop on first error
   */
  const runSteps = useCallback(async (taskId: string, stepIds: string[], stopOnError: boolean = true): Promise<StepResult[]> => {
    const replayAbortController = new AbortController();
    setReplayAbortController(replayAbortController);
    const signal = replayAbortController.signal;
    const settings = SettingUtils.getSettings();

    // get task and steps
    const task = findTaskNode(node => node.id === taskId, taskTree);
    if (!task || task.type !== 'task') {
      throw new Error(`runSteps: task not found - ${taskId}`);
    }
    const steps = task.steps.filter(s => stepIds.includes(s.uid));
    // prepare task result
    let taskResult: TaskResult = {
      task_id: task.id,
      task_start_time: Date.now(),
      task_end_time: -1,
      status: 'passed',
      last_error: undefined,
      steps: []
    };
    const taskResultIndex = taskResults.findIndex(r => r.task_id === taskId);
    if (taskResultIndex >= 0) {
      taskResult = taskResults[taskResultIndex];
      taskResult.task_start_time = Date.now();
      taskResult.task_end_time = -1;
    }
    else {
      taskResults.push(taskResult);
    }

    const stepResults: StepResult[] = [];

    // update the current settings into the sandbox
    try {
      await SidebarUtils.engine.updateSettings();
    } catch (error) {
      console.error('runSteps: updateSettings failed', error);
    }
    // enable cdp if needed
    const wasDebuggerAttached = isDebuggerAttached;
    try {
      if (settings.replaySettings.attachDebugger && !wasDebuggerAttached) {
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
        // select the step on ui
        setSelectedStepUid(step.uid);

        const stepResult = await runStep(step);

        const stepResultIndex = taskResult.steps.findIndex(s => s.step_uid === step.uid);
        if (stepResultIndex < 0) {
          taskResult.steps.push(stepResult);
        }
        else {
          taskResult.steps[stepResultIndex] = stepResult;
        }
        stepResults.push(stepResult);

        if (stopOnError && stepResult.status === 'failed') {
          break;
        }

        if (signal.aborted) {
          break;
        }

        if (settings.replaySettings.stepInterval > 0) {
          await wait(settings.replaySettings.stepInterval, signal);
        }
      }
    } catch (error) {
      console.error('runSteps: runSteps failed', error);
    }

    // finalize task result
    taskResult.task_end_time = Date.now();
    const lastErrorStep = [...taskResult.steps].reverse().find(r => r.status === 'failed');
    if (lastErrorStep) {
      taskResult.status = 'failed';
      taskResult.last_error = lastErrorStep.error;
    }
    else {
      taskResult.status = 'passed';
    }

    // disable cdp if needed
    try {
      if (settings.replaySettings.attachDebugger && !wasDebuggerAttached) {
        await SidebarUtils.engine.detachDebugger();
      }
    } catch (error) {
      console.error('runSteps: detachDebugger failed', error);
    }

    return stepResults;
  }, [taskTree]);

  /** ==================================================================================================================== */
  /** =================================================== bottom panel =================================================== */
  /** ==================================================================================================================== */
  // Toggle bottom expanded
  const toggleBottomExpanded = useCallback(() => {
    setIsBottomExpanded(!isBottomExpanded);
  }, [isBottomExpanded]);

  // Replay with the selected step only
  const handleReplaySelectedStep = useCallback(async () => {
    if (!(isIdle && activeTaskId && selectedStepUid && selectedStep)) {
      return;
    }

    const task = findTaskNode(node => node.id === activeTaskId, taskTree);
    if (!task || task.type !== 'task') {
      return;
    }

    const steps = [selectedStep]
    if (steps.length <= 0) {
      return;
    }

    setUiMode('replayFromStep');

    const stepIds = steps.map(s => s.uid);

    showNotificationMessage(t('sidebar_btn_action_steps_replay_start'));

    const stepResults = await runSteps(task.id, stepIds);

    const lastErrorStep = [...stepResults].reverse().find(r => r.status === 'failed');
    if (lastErrorStep) {
      showNotificationMessage(t('sidebar_btn_action_steps_replay_failed'), 3000, 'error');
    }
    else {
      showNotificationMessage(t('sidebar_btn_action_steps_replay_passed'), 3000, 'success');
    }

    setUiMode('idle');
  }, [isIdle, activeTaskId, selectedStepUid, selectedStep, taskTree]);

  /** ==================================================================================================================== */
  /** ===================================================== AI Dialog ==================================================== */
  /** ==================================================================================================================== */
  // Run script with new step
  const runScriptWithNewStep = useCallback(async (script: string, newStep: boolean) => {
    if (!script || script.length === 0) {
      throw new Error('Step script is empty');
    }
    if (!activeTaskId) {
      throw new Error('No active task selected, please select a task first');
    }
    const taskId = activeTaskId;
    const task = findTaskNode(node => node.id === taskId, taskTree);
    if (!task || task.type !== 'task') {
      return;
    }
    if (newStep) {
      const step = handleAddStep(script, '', false);
      if (!step) {
        throw new Error('No step after adding new step');
      }
      const stepResults = await runSteps(taskId, [step.uid]);
      setSelectedStepUid(step.uid);
      const result = stepResults[0].status === 'passed' ? stepResults[0].result : stepResults[0].error;
      return result;
    }
    else {
      const settings = SettingUtils.getSettings();
      const result = await SidebarUtils.engine.runScript(script, true, settings.replaySettings.stepTimeout);
      return result;
    }
  }, [activeTaskId, taskTree]);

  // Initialize component
  useEffect(() => {
    const init = async () => {
      try {
        // Load last asset from storage
        const result = await chrome.storage.local.get(['lastAsset']);
        const content = result.lastAsset || '';
        if (content && typeof content === 'string') {
          try {
            const parsed = JSON.parse(content);
            if (TaskUtils.isTaskAsset(parsed) && !Utils.isEqual(taskAsset, parsed)) {
              const asset = parsed;
              updateAllTaskStepResults(asset.root, asset.results);
              updateTaskData(asset.root);
              setTaskAsset(asset);
              setTaskTree(asset.root);
              setTaskResults(asset.results);
            }
          } catch (error) {
            console.warn('Failed to parse lastAsset:', error);
          }
        }

        // Check if debugger is attached
        const engine = SidebarUtils.engine;
        const attached = await engine.isDebuggerAttached();
        setIsDebuggerAttached(attached);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    init();

    // Set up event listeners
    const onNodeInspected = async ({ details }: any) => {
      setInspectedObject(details);
      setIsInspectStarted(!isInspectStarted);
    };
    SidebarUtils.handler.on('nodeInspected', onNodeInspected);
    const onStepRecorded = ({ step }: any) => {
      if (!selectedStep) return;
      const scripts: string[] = [];
      if (step.browserScript) scripts.push(step.browserScript);
      if (step.pageScript) scripts.push(step.pageScript);
      if (step.frameScript) scripts.push(step.frameScript);
      if (step.elementScript) scripts.push(step.elementScript);
      if (step.actionScript) scripts.push(step.actionScript);
      const stepScript = (step.await ? 'await ' : '') + scripts.join('.') + ';';
      if (stepScriptEditorRef.current) {
        stepScriptEditorRef.current.addStepScript(stepScript);
      }
    };
    SidebarUtils.handler.on('stepRecorded', onStepRecorded);

    return () => {
      SidebarUtils.handler.off('nodeInspected', onNodeInspected);
      SidebarUtils.handler.off('stepRecorded', onNodeInspected);
    };
  }, [updateTaskData, taskTree, selectedStepUid, selectedStep, isInspectStarted]);

  return (
    <div className="sidebar-container">
      {/* Toaster for notifications */}
      <Toaster position="bottom-right" className="text-sm p-2 max-w-xs" />

      {/* Add Task Node Dialog */}
      {isAddTaskNodeDialogVisible && (
        <div className="dialog-overlay">
          <div className="dialog-content" style={{ width: '20rem' }}>
            <div className="dialog-header">
              <h2>{t('sidebar_btn_action_tree_add_node_dialog_header')}</h2>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              onAddTaskNodeSubmit();
            }} className="flex justify-center flex-col gap-4">
              <div className="flex items-center gap-4 mb-4">
                <label htmlFor="add_new_node_type" className="font-semibold w-24">
                  {t('sidebar_btn_action_tree_add_node_dialog_label_type')}
                </label>
                <select
                  id="add_new_node_type"
                  value={addNodeType}
                  onChange={(e) => setAddNodeType(e.target.value as 'task' | 'group')}
                  className="flex-auto"
                >
                  {taskNodeTypes.map(type => (
                    <option key={type.code} value={type.code}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <label htmlFor="add_new_node_name" className="font-semibold w-24">
                  {t('sidebar_btn_action_tree_add_node_dialog_label_name')}
                </label>
                <input
                  type="text"
                  id="add_new_node_name"
                  value={addNodeName}
                  onChange={(e) => setAddNodeName(e.target.value)}
                  className="flex-auto"
                  placeholder="Enter name"
                  autoComplete="off"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button type="submit" className="btn secondary">
                  {t('sidebar_dialog_ok')}
                </button>
                <button type="button" className="btn" onClick={handleAddTaskNodeCanceled}>
                  {t('sidebar_dialog_cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Dialog */}
      {isAIDialogVisible && (
        <div className="dialog-overlay">
          <div className="dialog-content" style={{ width: '20rem' }}>
            <div className="dialog-header">
              <h2>{t('sidebar_btn_action_steps_ai_assistant_header')}</h2>
            </div>
            <StepAIAgent runScript={runScriptWithNewStep} />
          </div>
        </div>
      )}

      {/* Header with menus */}
      <header className="sidebar-header">
        {/* Task menus */}
        <div className={`menu-bar ${isRecording || isReplaying || isBottomExpanded ? 'readonly' : ''}`}>
          <button className="menu-btn" disabled={!isIdle} onClick={handleDemoTask} title={t('sidebar_btn_title_demo')}>
            {t('sidebar_btn_label_demo')}
          </button>
          <span className="menu-divider"></span>
          <button className="menu-btn" disabled={!isIdle} onClick={handleLoadTask} title={t('sidebar_btn_title_load')}>
            {t('sidebar_btn_label_load')}
          </button>
          <span className="menu-divider"></span>
          <button className="menu-btn" disabled={!isIdle} onClick={handleSaveTask} title={t('sidebar_btn_title_save')}>
            {t('sidebar_btn_label_save')}
          </button>
          <span className="menu-divider"></span>
          <button className="menu-btn" disabled={!isIdle} onClick={handleDownloadTask} title={t('sidebar_btn_label_download')}>
            {t('sidebar_btn_title_download')}
          </button>
          <span className="menu-divider"></span>
          <button className="menu-btn" disabled={!isIdle} onClick={handleOpenHelpDocument} title={t('sidebar_btn_title_help')}>
            {t('sidebar_btn_label_help')}
          </button>
        </div>
      </header>

      {/* Middle section with task tree and steps panel */}
      <main className="sidebar-middle">
        {/* Task tree panel with toggle */}
        <div className={`task-tree-panel ${isTreeCollapsed ? 'collapsed' : ''} ${isRecording || isReplaying || isBottomExpanded ? 'readonly' : ''}`}>
          {/* Task tree controls */}
          <div className="tree-controls">
            <button
              className="command-btn"
              disabled={!isIdle}
              onClick={handleToggleTreeClick}
              title={isTreeCollapsed ? t('sidebar_btn_title_tree_expand') : t('sidebar_btn_title_tree_collapse')}
            >
              {isTreeCollapsed ? '→' : '←'}
            </button>
            {!isTreeCollapsed && (
              <>
                <button
                  className="command-btn"
                  disabled={!(activeTaskNodeId && isIdle)}
                  onClick={handleShowAddTaskNodeDialog}
                  title={t('sidebar_btn_title_tree_add_node')}
                >
                  +
                </button>
                <button
                  className="command-btn"
                  disabled={!(activeTaskNodeId && isIdle)}
                  onClick={handleDeleteTaskNode}
                  title={t('sidebar_btn_title_tree_delete_node')}
                >
                  -
                </button>
              </>
            )}
          </div>
          {/* Task tree container */}
          {!isTreeCollapsed && (
            <div className="tree-container">
              <TreeNode
                node={taskTree}
                activeNodeId={activeTaskNodeId}
                onNodeSelected={handleTaskNodeSelect}
                onTaskSelected={handleTaskSelect}
                onRenameNode={handleTaskNodeRename}
              />
            </div>
          )}
        </div>

        {/* Steps panel */}
        <div className="steps-panel" onClick={handleStepsPanelClick}>
          {/* Steps controls */}
          <div className="steps-controls">
            <button
              className={`command-btn ${isBottomExpanded ? 'readonly' : ''}`}
              disabled={!(activeTaskId && isIdle)}
              onClick={() => handleAddStep()}
              title={t('sidebar_btn_title_steps_add_step')}
            >
              +
            </button>
            <button
              className={`command-btn ${isBottomExpanded ? 'readonly' : ''}`}
              disabled={!(activeTaskId && isIdle && selectedStepUid)}
              onClick={handleRemoveStep}
              title={t('sidebar_btn_title_steps_delete_step')}
            >
              -
            </button>
            <span className="menu-divider"></span>
            <button
              className="command-btn"
              disabled={!(activeTaskId && isIdle)}
              onClick={handleRecord}
              title={t('sidebar_btn_title_steps_record')}
            >
              ◉
            </button>
            <span className="menu-divider"></span>
            <button
              className={`command-btn ${isBottomExpanded ? 'readonly' : ''}`}
              disabled={!(activeTaskId && isIdle)}
              onClick={handleReplay}
              title={t('sidebar_btn_title_steps_replay')}
            >
              ▶
            </button>
            <button
              className="command-btn"
              disabled={!(activeTaskId && isIdle && selectedStepUid)}
              onClick={handleReplayFromStep}
              title={t('sidebar_btn_title_steps_replayFromStep')}
            >
              ▷
            </button>
            <span className="menu-divider"></span>
            <button
              className="command-btn"
              disabled={!(activeTaskId && (isReplaying || isRecording))}
              onClick={handleStop}
              title={t('sidebar_btn_title_steps_stop')}
            >
              ■
            </button>
            <span className="menu-divider"></span>
            <button
              className="command-btn"
              disabled={!(isIdle)}
              onClick={handleToggleInspectMode}
              title={inspectedObject ? t('step_script_editor_btn_title_inspect') : JSON.stringify(inspectedObject, null, 2)}
            >
              {inspectedObject ? "⛶" : "▣"}
            </button>
            <button
              className="command-btn"
              disabled={!(isIdle)}
              onClick={toggleCDPAttach}
              title={isDebuggerAttached ? t('sidebar_btn_title_steps_debugger_detach') : t('sidebar_btn_title_steps_debugger_attach')}
            >
              {isDebuggerAttached ? '☍' : '☌'}
            </button>
            <span className="menu-divider"></span>
            <button
              className="command-btn"
              disabled={!(isIdle)}
              onClick={openAIDialog}
              title={t('sidebar_btn_title_steps_ai_assistant')}
            >
              AI
            </button>
          </div>
          {/* Steps container */}
          <div className={`steps-container ${isRecording || isReplaying ? 'readonly' : ''}`}>
            {activeSteps.map(step => (
              <div
                key={step.uid}
                draggable={!!(activeTaskId && isIdle)}
                className={`step-card ${selectedStepUid === step.uid ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStepSelect(step.uid);
                }}
                onDragStart={(e) => {
                  e.stopPropagation();
                  handleDragStart(step.uid);
                }}
                onDragOver={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleDragOver(step.uid);
                }}
                onDrop={(e) => {
                  e.stopPropagation();
                  handleDrop(step.uid);
                }}
              >
                <div className="step-type">
                  <span className="step-type-icon">≡</span>
                </div>
                {!isStepEditing(step.uid) ? (
                  <div
                    className="step-description"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleStepDescriptionDblClick(step.uid);
                    }}
                  >
                    {getStepDescription(step)}
                  </div>
                ) : (
                  <input
                    type="text"
                    className="step-description-edit"
                    value={editedStepDescription}
                    onChange={(e) => setEditedStepDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveStepDescription(step.uid);
                      if (e.key === 'Escape') cancelStepEdit();
                    }}
                    onBlur={() => saveStepDescription(step.uid)}
                    autoFocus
                  />
                )}
                <div
                  className={`step-status ${step.last_status || 'pending'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStepResultClick(step.uid);
                  }}
                  title={step.last_error || ''}
                >
                  {step.last_status === 'passed' ? '✓' : (step.last_status === 'failed' ? '✗' : '○')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom section with tabs */}
      <footer className={`sidebar-bottom ${isBottomExpanded ? 'expanded' : ''} ${isRecording || isReplaying ? 'readonly' : ''}`}>
        <div className="sidebar-bottom-controls">
          <button
            className="sidebar-bottom-control-btn"
            disabled={!(activeTaskId && selectedStepUid && isIdle)}
            onClick={toggleBottomExpanded}
            title={isBottomExpanded ? t('sidebar_btn_title_bottom_collapse') : t('sidebar_btn_title_bottom_expand')}
          >
            ⇵
          </button>
        </div>

        {selectedStep && (
          <div className="sidebar-bottom-content">
            <StepScriptEditor
              key={selectedStep.uid}
              initialScriptContent={selectedStep.script}
              onScriptChange={(script) => selectedStep.script = script}
              runScript={handleReplaySelectedStep}
            />
          </div>
        )}
      </footer>
    </div>
  );
};