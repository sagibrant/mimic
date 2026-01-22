/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file App.tsx
 * @description 
 * Sidebar UI root component
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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import TreeNode from './TreeNode';
import StepScriptEditor, { StepScriptEditorRef } from './StepScriptEditor';
import StepAIAgent from './StepAIAgent';
import { TaskAsset, TaskGroup, Task, Step, TaskResult, StepResult } from '../../execution/Task';
import * as TaskUtils from '../../execution/TaskUtils';
import { BrowserUtils, SettingUtils, Utils } from '@mimic-sdk/core';
import { SidebarUtils } from './SidebarUtils';
import { toast, Toaster } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { ThemeProvider } from '../components/theme-provider';

export default function App() {
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
  const showNotificationMessage = useCallback(
    (
      message: string,
      timeout: number = 3000,
      severity: 'success' | 'info' | 'warning' | 'error' = 'info',
      summary: string = ''
    ) => {
      if (summary) {
        toast[severity](message, { description: summary, duration: timeout });
      } else {
        toast[severity](message, { duration: timeout });
      }
    },
    []
  );
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
      if (node?.type === 'group' && node.children.length > 0) {
        nodes = [...nodes, ...node.children];
      }
    }
    return null;
  }, []);
  /**
   * deep update node
   */
  const deepUpdateNode = useCallback(
    (match: (node: TaskNode) => boolean, node: TaskNode, nodeData: Partial<TaskNode>): TaskNode => {
      if (match(node)) {
        return {
          ...node,
          ...nodeData,
        } as TaskNode;
      }
      if (node.type === 'group' && node.children && node.children.length > 0) {
        return {
          ...node,
          children: node.children.map(child => deepUpdateNode(match, child, nodeData)),
        };
      }
      return { ...node };
    },
    []
  );
  /**
   * deep remove node
   */
  const deepRemoveNode = useCallback((match: (node: TaskNode) => boolean, node: TaskNode): TaskNode => {
    if (node.type === 'group' && node.children && node.children.length > 0) {
      const children = [];
      for (const child of node.children) {
        if (!match(child)) {
          const newChild = deepRemoveNode(match, child);
          children.push(newChild);
        }
      }
      return {
        ...node,
        children,
      };
    }
    return { ...node };
  }, []);
  /**
   * deep add node
   */
  const deepAddNode = useCallback((match: (node: TaskNode) => boolean, node: TaskNode, newNode: TaskNode): TaskNode => {
    if (node.type === 'group' && match(node)) {
      return {
        ...node,
        children: [...node.children, newNode],
      };
    }
    if (node.type === 'group' && node.children && node.children.length > 0) {
      const children = [...node.children];
      const index = children.findIndex(child => match(child));
      if (index >= 0 && children[index].type === 'task') {
        children.splice(index + 1, 0, newNode);
        return {
          ...node,
          children,
        };
      } else {
        return {
          ...node,
          children: children.map(child => deepAddNode(match, child, newNode)),
        };
      }
    }
    return { ...node };
  }, []);

  const deepUpdateStep = useCallback(
    (match: (step: Step) => boolean, node: TaskNode, stepData: Partial<Step>): TaskNode => {
      if (node.type === 'group') {
        return {
          ...node,
          children: node.children.map(child => deepUpdateStep(match, child, stepData)),
        };
      } else {
        const task = node as Task;
        const steps = [...task.steps];
        const index = steps.findIndex(s => match(s));
        if (index < 0) {
          return { ...node };
        } else {
          const step = steps[index];
          steps[index] = { ...step, ...stepData };
          return {
            ...node,
            steps,
          };
        }
      }
    },
    []
  );

  // Type definitions
  type TaskNode = TaskGroup | Task;

  // Empty task asset for initialization
  const emptyTaskAsset: TaskAsset = useMemo(() => {
    return TaskUtils.createNewTaskAsset();
  }, []);

  // State management
  const [uiMode, setUiMode] = useState<'idle' | 'record' | 'replay'>('idle');
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

  // AlertDialog state
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [alertDialogTitle, setAlertDialogTitle] = useState('');
  const [alertDialogDescription, setAlertDialogDescription] = useState('');
  const confirmCallbackRef = useRef<(() => void) | null>(null);

  const [replayAbortController, setReplayAbortController] = useState<AbortController | null>(null);

  // require async get, to be set in useEffect
  const [isDebuggerAttached, setIsDebuggerAttached] = useState(false);

  // Refs
  const stepScriptEditorRef = useRef<StepScriptEditorRef | null>(null);

  // Computed values
  const isReplaying = uiMode === 'replay';
  const isRecording = uiMode === 'record';
  const isIdle = uiMode === 'idle';
  const activeTask: Task | null = activeTaskId
    ? (findTaskNode(node => node.id === activeTaskId, taskTree) as Task)
    : null;
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
    { name: t('sidebar_btn_action_tree_add_node_dialog_input_type_group'), code: 'group' },
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

  // refresh active task & selected step
  const refreshActiveTaskStep = useCallback(
    (root: TaskNode) => {
      // Select first available task by default
      const selectFirstAvailableTask = () => {
        const task = findTaskNode(node => node.type === 'task', root);
        if (task) {
          setActiveTaskNodeId(task.id);
          setActiveTaskId(task.id);
          setSelectedStepUid('');
        } else {
          setActiveTaskNodeId(root.id);
          setActiveTaskId('');
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
        const node = findTaskNode(node => node.id === activeTaskNodeId, root);
        if (!node) {
          selectFirstAvailableTask();
          return;
        }
      }

      // select previously active task if still exists
      if (activeTaskId) {
        const node = findTaskNode(node => node.id === activeTaskId && node.type === 'task', root);
        if (!node) {
          selectFirstAvailableTask();
          return;
        } else if (
          !(
            node.type === 'task' &&
            selectedStepUid &&
            (node as Task).steps.findIndex(s => s.uid === selectedStepUid) >= 0
          )
        ) {
          setSelectedStepUid('');
        }
      }
    },
    [taskTree, activeTaskNodeId, activeTaskId, selectedStepUid, findTaskNode]
  );

  /** ==================================================================================================================== */
  /** =================================================== alert dialog =================================================== */
  /** ==================================================================================================================== */
  /**
   * Custom confirm dialog using AlertDialog
   */
  const showConfirmDialog = useCallback((title: string, description: string, onConfirm: () => void | Promise<void>) => {
    setAlertDialogTitle(title);
    setAlertDialogDescription(description);
    confirmCallbackRef.current = onConfirm;
    setIsAlertDialogOpen(true);
  }, []);

  /**
   * Handle confirm dialog confirm button click
   */
  const handleConfirmDialogConfirm = useCallback(async () => {
    if (confirmCallbackRef.current) {
      await confirmCallbackRef.current();
      confirmCallbackRef.current = null;
    }
    setIsAlertDialogOpen(false);
  }, []);

  /**
   * Handle confirm dialog cancel button click
   */
  const handleConfirmDialogCancel = useCallback(() => {
    confirmCallbackRef.current = null;
    setIsAlertDialogOpen(false);
  }, []);
  /** ==================================================================================================================== */
  /** ==================================================== menu btns ===================================================== */
  /** ==================================================================================================================== */
  // Handle demo task
  const handleDemoTask = useCallback(async () => {
    if (!isIdle) {
      return;
    }
    try {
      const docURL = 'https://www.youtube.com/playlist?list=PLvU_JUL1nukuMO1qCllN19VDgO2t9pd9x';
      await chrome.tabs.create({ url: docURL });
    } catch (error) {
      console.error(error);
      showNotificationMessage(t('sidebar_btn_action_demo_error_failedToOpenDemoWebSite'), 3000, 'error');
    }
  }, [isIdle, showNotificationMessage, t]);

  // Handle load task
  const handleLoadTask = useCallback(() => {
    if (!isIdle) {
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.mimic';
    fileInput.addEventListener('change', async event => {
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
          setTaskAsset(asset);
          setTaskTree(asset.root);
          setTaskResults(asset.results);
          refreshActiveTaskStep(asset.root);
        } else {
          showNotificationMessage(t('sidebar_btn_action_load_error_invalid_file'), 3000, 'error');
        }
      } catch (error) {
        console.error(error);
        showNotificationMessage(t('sidebar_btn_action_load_error'), 3000, 'error');
      }
    });

    fileInput.click();
  }, [isIdle, updateAllTaskStepResults, refreshActiveTaskStep, showNotificationMessage, t]);

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
        lastAsset: jsonContent,
      });
      showNotificationMessage(t('sidebar_btn_action_save_notification'));
    } catch (error) {
      console.error(error);
      showNotificationMessage(t('sidebar_btn_action_save_error'), 3000, 'error');
    }
  }, [isIdle, taskAsset, taskTree, taskResults, showNotificationMessage, t]);

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
      a.download = 'tasks.mimic';
      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      showNotificationMessage(t('sidebar_btn_action_download_error'), 3000, 'error');
    }
  }, [isIdle, taskAsset, taskTree, taskResults, showNotificationMessage, t]);

  // Handle open help document
  const handleOpenHelpDocument = useCallback(async () => {
    if (!isIdle) {
      return;
    }
    try {
      const docURL = 'https://sagibrant.github.io/mimic/';
      await chrome.tabs.create({ url: docURL });
    } catch (error) {
      console.error(error);
      showNotificationMessage(t('sidebar_btn_action_help_docs_error_failedToOpenHelpDocument'), 3000, 'error');
    }
  }, [isIdle, showNotificationMessage, t]);

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
  const handleTaskNodeSelect = useCallback(
    (nodeId: string) => {
      if (!isIdle) {
        console.warn(`Unexpected task node selection event - ${nodeId}, uiMode - ${uiMode}`);
        return;
      }

      const node = findTaskNode(node => node.id === nodeId, taskTree);
      if (!node) {
        console.warn(`Task node not found for task node selection event - ${nodeId}`);
        return;
      }
      setActiveTaskNodeId(nodeId);
    },
    [isIdle, uiMode, taskTree, findTaskNode]
  );

  // Handle task node rename
  const handleTaskNodeRename = useCallback(
    (nodeId: string, newName: string) => {
      if (!isIdle) {
        console.warn(`Unexpected task node name change event - ${nodeId}, ${newName}, uiMode - ${uiMode}`);
        return;
      }

      const node = findTaskNode(node => node.id === nodeId, taskTree);
      if (!node) {
        console.warn(`Task node not found for task node name change event - ${nodeId}, ${newName}`);
        return;
      }

      const root = deepUpdateNode(node => node.id === nodeId, taskTree, { name: newName });
      setTaskTree(root);
    },
    [isIdle, uiMode, taskTree, findTaskNode, deepUpdateNode]
  );

  // Handle task selection
  const handleTaskSelect = useCallback(
    (taskId: string) => {
      if (!taskId) {
        console.warn(`Unexpected task node selection event - ${taskId}, uiMode - ${uiMode}`);
        return;
      }

      const task = findTaskNode(node => node.id === taskId && node.type === 'task', taskTree);
      if (!task || task.type !== 'task') {
        console.warn(`Task not found for task node selection event - ${taskId}`);
        return;
      }

      setActiveTaskId(taskId);
      if (task.steps.findIndex(s => s.uid === selectedStepUid) < 0) {
        setSelectedStepUid('');
      }
    },
    [isIdle, uiMode, taskTree, findTaskNode, selectedStepUid]
  );

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
    showConfirmDialog(
      t('sidebar_btn_action_tree_delete_node_confirm_header'),
      t('sidebar_btn_action_tree_delete_node_confirm_message'),
      () => {
        // Remove node from tree
        const node = findTaskNode(node => node.id === activeTaskNodeId, taskTree);
        if (!node) {
          console.warn(`Task node not found for task node delete - ${activeTaskNodeId}`);
          showNotificationMessage(t('sidebar_btn_action_tree_delete_node_failed'), 3000, 'error');
          return;
        }
        if (node === taskTree) {
          showNotificationMessage(t('sidebar_btn_action_tree_delete_node_failed'), 3000, 'error');
          return;
        }
        const root = deepRemoveNode(node => node.id === activeTaskNodeId, taskTree);
        setTaskTree(root);
        refreshActiveTaskStep(root);
      }
    );
  }, [
    isIdle,
    activeTaskNodeId,
    taskTree,
    refreshActiveTaskStep,
    showNotificationMessage,
    showConfirmDialog,
    t,
    findTaskNode,
    deepRemoveNode,
  ]);

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

    const node = findTaskNode(node => node.id === activeTaskNodeId, taskTree);
    if (!node) {
      console.warn(`Task node not found for task node add - ${activeTaskNodeId}`);
      showNotificationMessage(t('sidebar_btn_action_tree_add_node_failed'), 3000, 'error');
      return;
    }

    const newNode: TaskNode = {
      id: Utils.generateUUID(),
      name: nodeName.trim(),
      type: nodeType,
      ...(nodeType === 'group' ? { children: [] } : { steps: [] }),
    } as TaskNode;

    const root = deepAddNode(node => node.id === activeTaskNodeId, taskTree, newNode);
    setTaskTree(root);
  }, [addNodeType, addNodeName, activeTaskNodeId, taskTree, showNotificationMessage, t, findTaskNode, deepAddNode]);

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
  const handleAddStep = useCallback(
    (script: string = '', description: string = '', edit: boolean = true) => {
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
        script: script,
      };

      const steps = [...task.steps];
      if (selectedStepUid) {
        // Add after selected step
        const index = steps.findIndex(step => step.uid === selectedStepUid);
        if (index >= 0) {
          steps.splice(index + 1, 0, newStep);
        } else {
          steps.push(newStep);
        }
      } else {
        steps.push(newStep);
      }

      const updatedTask = { ...task, steps };
      const root = deepUpdateNode(node => node.id === task.id, taskTree, updatedTask);
      setTaskTree(root);
      setSelectedStepUid(newStep.uid);

      if (!edit) return newStep;

      setEditingStepUid(newStep.uid);
      setEditedStepDescription(newStep.description || '');
      return newStep;
    },
    [isIdle, activeTaskId, selectedStepUid, findTaskNode, t, taskTree, deepUpdateNode]
  );

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
    showConfirmDialog(
      t('sidebar_btn_action_steps_delete_step_confirm_header'),
      t('sidebar_btn_action_steps_delete_step_confirm_message'),
      () => {
        const steps = [...task.steps];
        // Remove the selected step
        steps.splice(index, 1);
        task.steps = steps;
        // Update selection
        if (steps.length > 0) {
          const newIndex = index > steps.length - 1 ? steps.length - 1 : index;
          setSelectedStepUid(steps[newIndex].uid);
        } else {
          setSelectedStepUid('');
        }
      }
    );
  }, [isIdle, activeTaskId, selectedStepUid, findTaskNode, showConfirmDialog, t, taskTree]);

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
  }, [isIdle, activeTaskId, findTaskNode, taskTree, selectedStepUid, handleAddStep]);

  /**
   * run a step
   */
  const runStep = useCallback(async (step: Step): Promise<StepResult> => {
    const settings = SettingUtils.getSettings();
    const stepResult: StepResult = {
      step_uid: step.uid,
      step_description: step.description,
      step_start_time: Date.now(),
      step_end_time: -1,
      status: 'passed',
      result: undefined,
      error: undefined,
      screenshot: undefined,
    };
    try {
      const result = await SidebarUtils.engine.runScript(step.script, true, settings.replaySettings.stepTimeout);
      stepResult.step_end_time = Date.now();
      stepResult.status = 'passed';
      stepResult.result = result;
    } catch (error) {
      let errorMessage = error instanceof Error ? error.stack || error.message : String(error);
      stepResult.step_end_time = Date.now();
      stepResult.status = 'failed';
      const stepEngineInvokeFunctionIndicator = 'at StepEngine.invokeFunction';
      if (errorMessage.includes(stepEngineInvokeFunctionIndicator)) {
        errorMessage = errorMessage.split(stepEngineInvokeFunctionIndicator)[0].trim();
      }
      while (errorMessage.startsWith('Error: ')) {
        errorMessage = errorMessage.replace('Error: ', '');
      }
      stepResult.error = errorMessage;
    }
    return stepResult;
  }, []);

  /**
   * run the give steps on the given taskId, update the step results into the taskResults
   * @param taskId id of the task
   * @param stepIds ids of steps to run
   * @param stopOnError whether to stop on first error
   */
  const runSteps = useCallback(
    async (taskId: string, stepIds: string[], stopOnError: boolean = true): Promise<StepResult[]> => {
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
        steps: [],
      };
      const taskResultIndex = taskResults.findIndex(r => r.task_id === taskId);
      if (taskResultIndex >= 0) {
        taskResult = taskResults[taskResultIndex];
        taskResult.task_start_time = Date.now();
        taskResult.task_end_time = -1;
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
          setIsDebuggerAttached(true);
        }
      } catch (error) {
        console.error('runSteps: attachDebugger failed', error);
      }

      let updatedTree = taskTree;
      try {
        for (const step of steps) {
          if (signal.aborted) {
            break;
          }
          // select the step on ui
          setSelectedStepUid(step.uid);

          // Update step status to undefined before running
          updatedTree = deepUpdateStep(s => s.uid === step.uid, updatedTree, {
            last_error: undefined,
            last_status: undefined,
          });
          setTaskTree(updatedTree);

          const stepResult = await runStep(step);

          // Update step status passed or failed
          updatedTree = deepUpdateStep(s => s.uid === step.uid, updatedTree, {
            last_error: stepResult.error,
            last_status: stepResult.status,
          });
          setTaskTree(updatedTree);

          const stepResultIndex = taskResult.steps.findIndex(s => s.step_uid === step.uid);
          if (stepResultIndex < 0) {
            taskResult.steps.push(stepResult);
          } else {
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
      } else {
        taskResult.status = 'passed';
      }

      if (taskResultIndex >= 0) {
        setTaskResults([...taskResults]);
      } else {
        setTaskResults([...taskResults, taskResult]);
      }

      // disable cdp if needed
      try {
        if (settings.replaySettings.attachDebugger && !wasDebuggerAttached) {
          await SidebarUtils.engine.detachDebugger();
          setIsDebuggerAttached(false);
        }
      } catch (error) {
        console.error('runSteps: detachDebugger failed', error);
      }

      return stepResults;
    },
    [taskTree, findTaskNode, isDebuggerAttached, deepUpdateStep, runStep, taskResults, wait]
  );

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
    setIsBottomExpanded(false);
    setIsTreeCollapsed(true);

    const pre_selectedStepUid = selectedStepUid;
    const stepIds = task.steps.map(s => s.uid);

    showNotificationMessage(t('sidebar_btn_action_steps_replay_start'));

    const stepResults = await runSteps(task.id, stepIds);

    const lastErrorStep = [...stepResults].reverse().find(r => r.status === 'failed');
    if (lastErrorStep) {
      showNotificationMessage(t('sidebar_btn_action_steps_replay_failed'), 3000, 'error');
    } else {
      showNotificationMessage(t('sidebar_btn_action_steps_replay_passed'), 3000, 'success');
    }

    setSelectedStepUid(pre_selectedStepUid);

    setUiMode('idle');
  }, [isIdle, activeTaskId, selectedStepUid, taskTree, findTaskNode, runSteps, showNotificationMessage, t]);

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

    setUiMode('replay');
    setIsTreeCollapsed(true);

    const stepIds = steps.map(s => s.uid);

    showNotificationMessage(t('sidebar_btn_action_steps_replay_start'));

    const stepResults = await runSteps(task.id, stepIds);

    const lastErrorStep = [...stepResults].reverse().find(r => r.status === 'failed');
    if (lastErrorStep) {
      showNotificationMessage(t('sidebar_btn_action_steps_replay_failed'), 3000, 'error');
    } else {
      showNotificationMessage(t('sidebar_btn_action_steps_replay_passed'), 3000, 'success');
    }

    setSelectedStepUid(pre_selectedStepUid);

    setUiMode('idle');
  }, [
    isIdle,
    activeTaskId,
    selectedStepUid,
    taskTree,
    activeSteps,
    findTaskNode,
    runSteps,
    showNotificationMessage,
    t,
  ]);

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

  // Toggle CDP attach
  const toggleCDPAttach = useCallback(async () => {
    try {
      const engine = SidebarUtils.engine;
      if (isDebuggerAttached) {
        await engine.detachDebugger();
      } else {
        await engine.attachDebugger();
      }
      setIsDebuggerAttached(!isDebuggerAttached);
    } catch (error) {
      console.error('toggleCDPAttach failed', error);
      const msg = isDebuggerAttached
        ? t('sidebar_btn_action_steps_debugger_detach_failed')
        : t('sidebar_btn_action_steps_debugger_attach_failed');
      showNotificationMessage(msg, 3000, 'error');
    }
  }, [isDebuggerAttached, t, showNotificationMessage]);

  // Open AI dialog
  const openAIDialog = useCallback(async () => {
    const settings = SettingUtils.getSettings().aiSettings;
    if (!settings.baseURL || !settings.apiKey || !settings.models) {
      showConfirmDialog(
        t('sidebar_btn_action_steps_ai_assistant_config_settings_confirm_header'),
        t('sidebar_btn_action_steps_ai_assistant_config_settings_confirm_message'),
        async () => {
          try {
            const browserInfo = BrowserUtils.getBrowserInfo();
            const prefix = browserInfo.name === 'edge' ? 'extension' : 'chrome-extension';
            const url = `${prefix}://${chrome.runtime.id}/ui/options/index.html`;
            await chrome.tabs.create({ url: url });
          } catch (error) {
            console.error('Error opening options:', error);
            showNotificationMessage(t('action_error_failedToOpenOptions'), 3000, 'error');
          }
        }
      );
      return;
    }
    setIsTreeCollapsed(true);
    setIsBottomExpanded(false);
    setIsAIDialogVisible(true);
  }, []);

  /** ==================================================================================================================== */
  /** ==================================================== step panel ==================================================== */
  /** ==================================================================================================================== */
  // Handle step selection
  const handleStepSelect = useCallback(
    (stepUid: string) => {
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

      const task = findTaskNode(node => node.id === activeTaskId && node.type === 'task', taskTree);
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
    },
    [activeTaskId, selectedStepUid, taskTree, findTaskNode]
  );

  // Get step description
  const getStepDescription = useCallback((step: Step): string => {
    return step.description || 'new step'; // todo: mlu
  }, []);

  // Get step last run status
  const getStepLastStatus = useCallback((step: Step): string => {
    return step.last_status === 'passed' ? '✓' : step.last_status === 'failed' ? '✗' : '○';
  }, []);

  // Get step last run error
  const getStepLastError = useCallback((step: Step): string => {
    return step.last_error || '';
  }, []);

  // Check if step is editing
  const isStepEditing = useCallback(
    (uid: string) => {
      return editingStepUid === uid;
    },
    [editingStepUid]
  );

  // Cancel step edit
  const cancelStepEdit = useCallback(() => {
    setEditingStepUid('');
    setEditedStepDescription('');
  }, []);

  // Handle step description double click
  const handleStepDescriptionDblClick = useCallback(
    (stepUid: string) => {
      const step = activeSteps.find(s => s.uid === stepUid);
      if (!step) {
        console.warn(`Step not found for description edit - ${stepUid}`);
        return;
      }
      setEditingStepUid(stepUid);
      setEditedStepDescription(step.description || '');
    },
    [activeSteps]
  );

  // Save step description
  const saveStepDescription = useCallback(
    (stepUid: string) => {
      const trimmedDesc = editedStepDescription.trim();
      if (trimmedDesc) {
        const step = activeSteps.find(s => s.uid === stepUid);
        if (step) {
          step.description = trimmedDesc;
        }
      }
      setEditingStepUid('');
      setEditedStepDescription('');
    },
    [activeSteps, editedStepDescription]
  );

  // Handle step result click
  const handleStepResultClick = useCallback(() => {
    // todo: display results in a better UI
    // setSidebarBottomType('result');
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((stepUid: string) => {
    setDraggedStepUid(stepUid);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback(() => {
    // Prevent default to allow drop
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (targetStepUid: string) => {
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

      // Update task steps and trigger re-render
      const updatedTask = { ...task, steps };
      const root = deepUpdateNode(node => node.id === activeTaskId, taskTree, updatedTask);
      setTaskTree(root);
      setDraggedStepUid('');
    },
    [draggedStepUid, activeTaskId, taskTree, findTaskNode, deepUpdateNode]
  );

  // Handle steps panel click
  const handleStepsPanelClick = useCallback(() => {
    setIsTreeCollapsed(true);
    setSelectedStepUid('');
    setIsBottomExpanded(false);
  }, []);

  /** ==================================================================================================================== */
  /** =================================================== bottom panel =================================================== */
  /** ==================================================================================================================== */
  // Toggle bottom expanded
  const toggleBottomExpanded = useCallback(() => {
    if (!isBottomExpanded) {
      setIsTreeCollapsed(true);
    }
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

    const steps = [selectedStep];
    if (steps.length <= 0) {
      return;
    }

    setUiMode('replay');
    setIsTreeCollapsed(true);

    const stepIds = steps.map(s => s.uid);

    showNotificationMessage(t('sidebar_btn_action_steps_replay_start'));

    const stepResults = await runSteps(task.id, stepIds);

    const lastErrorStep = [...stepResults].reverse().find(r => r.status === 'failed');
    if (lastErrorStep) {
      showNotificationMessage(t('sidebar_btn_action_steps_replay_failed'), 3000, 'error');
    } else {
      showNotificationMessage(t('sidebar_btn_action_steps_replay_passed'), 3000, 'success');
    }

    setUiMode('idle');
  }, [
    isIdle,
    activeTaskId,
    selectedStepUid,
    selectedStep,
    taskTree,
    findTaskNode,
    runSteps,
    showNotificationMessage,
    t,
  ]);

  // handle the script change from code editor
  const handleOnSelectedStepScriptChange = useCallback(
    (script: string) => {
      if (!(selectedStepUid && selectedStep)) {
        return;
      }
      selectedStep.script = script;
    },
    [selectedStepUid, selectedStep]
  );

  /** ==================================================================================================================== */
  /** ===================================================== AI Dialog ==================================================== */
  /** ==================================================================================================================== */
  // Run script with new step
  const runScriptWithNewStep = useCallback(
    async (script: string, newStep: boolean = true) => {
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
        setSelectedStepUid(step.uid);

        let taskResult: TaskResult = {
          task_id: task.id,
          task_start_time: Date.now(),
          task_end_time: -1,
          status: 'passed',
          last_error: undefined,
          steps: [],
        };
        const taskResultIndex = taskResults.findIndex(r => r.task_id === taskId);
        if (taskResultIndex >= 0) {
          taskResult = taskResults[taskResultIndex];
        }
        const stepResult = await runStep(step);
        setTaskTree(prev =>
          deepUpdateStep(s => s.uid === step.uid, prev, {
            last_error: stepResult.error,
            last_status: stepResult.status,
          })
        );
        taskResult.steps.push(stepResult);
        taskResult.task_end_time = Date.now();
        const lastErrorStep = [...taskResult.steps].reverse().find(r => r.status === 'failed');
        if (lastErrorStep) {
          taskResult.status = 'failed';
          taskResult.last_error = lastErrorStep.error;
        } else {
          taskResult.status = 'passed';
        }

        if (taskResultIndex >= 0) {
          setTaskResults([...taskResults]);
        } else {
          setTaskResults([...taskResults, taskResult]);
        }

        return stepResult.status === 'passed' ? stepResult.result : stepResult.error;
      } else {
        const settings = SettingUtils.getSettings();
        try {
          const result = await SidebarUtils.engine.runScript(script, true, settings.replaySettings.stepTimeout);
          return result;
        } catch (error) {
          let errorMessage = error instanceof Error ? error.stack || error.message : String(error);
          const stepEngineInvokeFunctionIndicator = 'at StepEngine.invokeFunction';
          if (errorMessage.includes(stepEngineInvokeFunctionIndicator)) {
            errorMessage = errorMessage.split(stepEngineInvokeFunctionIndicator)[0].trim();
          }
          while (errorMessage.startsWith('Error: ')) {
            errorMessage = errorMessage.replace('Error: ', '');
          }
          return errorMessage;
        }
      }
    },
    [
      activeTaskId,
      taskTree,
      taskResults,
      findTaskNode,
      handleAddStep,
      runStep,
      setSelectedStepUid,
      deepUpdateStep,
      setTaskTree,
    ]
  );

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
              setTaskAsset(asset);
              setTaskTree(asset.root);
              setTaskResults(asset.results);
              refreshActiveTaskStep(asset.root);
            }
          } catch (error) {
            console.warn('Failed to parse lastAsset:', error);
          }
        }
        else {
          refreshActiveTaskStep(taskAsset.root);
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
    const onStepRecorded = async ({ step }: { step: unknown }) => {
      const s = step as {
        browserScript?: string;
        pageScript?: string;
        frameScript?: string;
        elementScript?: string;
        actionScript?: string;
        await?: boolean;
      };
      const scripts: string[] = [];
      if (s.browserScript) scripts.push(s.browserScript);
      if (s.pageScript) scripts.push(s.pageScript);
      if (s.frameScript) scripts.push(s.frameScript);
      if (s.elementScript) scripts.push(s.elementScript);
      if (s.actionScript) scripts.push(s.actionScript);
      const stepScript = (s.await ? 'await ' : '') + scripts.join('.') + ';';
      if (stepScriptEditorRef.current) {
        stepScriptEditorRef.current.addStepScript(stepScript);
      }
    };
    SidebarUtils.handler.on('stepRecorded', onStepRecorded);
    return () => {
      SidebarUtils.handler.off('stepRecorded', onStepRecorded);
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="sidebar-container font-sans text-sm">
        {/* Toaster for notifications */}
        <Toaster position="bottom-right" className="max-w-xs p-2 text-sm" />

        {/* AlertDialog for confirmations */}
        <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
          <AlertDialogContent className="max-w-[20rem]">
            <AlertDialogHeader>
              <AlertDialogTitle>{alertDialogTitle}</AlertDialogTitle>
              <AlertDialogDescription className="text-left">{alertDialogDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-row justify-end gap-2 pt-2">
              <AlertDialogCancel onClick={handleConfirmDialogCancel}>{t('sidebar_confirm_cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDialogConfirm} autoFocus>
                {t('sidebar_confirm_accept')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Task Node Dialog */}
        <Dialog open={isAddTaskNodeDialogVisible} onOpenChange={setIsAddTaskNodeDialogVisible}>
          <DialogContent className="max-w-[20rem]">
            <DialogHeader>
              <DialogTitle>{t('sidebar_btn_action_tree_add_node_dialog_header')}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={e => {
                e.preventDefault();
                onAddTaskNodeSubmit();
              }}
              className="space-y-4 py-4"
            >
              <div className="grid grid-cols-12 gap-4">
                <Label
                  htmlFor="add_new_node_type"
                  className="col-span-3 flex items-center justify-end text-right font-semibold"
                >
                  {t('sidebar_btn_action_tree_add_node_dialog_label_type')}
                </Label>
                <div className="col-span-9">
                  <Select value={addNodeType} onValueChange={value => setAddNodeType(value as 'task' | 'group')}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskNodeTypes.map(type => (
                        <SelectItem key={type.code} value={type.code}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-4">
                <Label
                  htmlFor="add_new_node_name"
                  className="col-span-3 flex items-center justify-end text-right font-semibold"
                >
                  {t('sidebar_btn_action_tree_add_node_dialog_label_name')}
                </Label>
                <div className="col-span-9">
                  <Input
                    type="text"
                    id="add_new_node_name"
                    value={addNodeName}
                    onChange={e => setAddNodeName(e.target.value)}
                    placeholder="Enter name"
                    autoComplete="off"
                    className="w-full"
                    autoFocus
                  />
                </div>
              </div>

              <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button variant="outline" onClick={handleAddTaskNodeCanceled}>
                    {t('sidebar_dialog_cancel')}
                  </Button>
                </DialogClose>
                <Button type="submit">{t('sidebar_dialog_ok')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* AI Dialog */}
        <Dialog open={isAIDialogVisible} onOpenChange={setIsAIDialogVisible}>
          <DialogContent className="max-w-[20rem]">
            <DialogHeader>
              <DialogTitle>{t('sidebar_btn_action_steps_ai_assistant_dialog_header')}</DialogTitle>
              <DialogDescription></DialogDescription>
            </DialogHeader>
            <StepAIAgent runScript={runScriptWithNewStep} />
          </DialogContent>
        </Dialog>

        {/* Header with menus */}
        <header className="sidebar-header">
          {/* Task menus */}
          <div className={`menu-bar ${isRecording || isReplaying || isBottomExpanded ? 'readonly' : ''}`}>
            <Button
              variant="ghost"
              size="sm"
              disabled={!isIdle}
              onClick={handleDemoTask}
              title={t('sidebar_btn_title_demo')}
            >
              {t('sidebar_btn_label_demo')}
            </Button>
            <Separator orientation="vertical" />
            <Button
              variant="ghost"
              size="sm"
              disabled={!isIdle}
              onClick={handleLoadTask}
              title={t('sidebar_btn_title_load')}
            >
              {t('sidebar_btn_label_load')}
            </Button>
            <Separator orientation="vertical" />
            <Button
              variant="ghost"
              size="sm"
              disabled={!isIdle}
              onClick={handleSaveTask}
              title={t('sidebar_btn_title_save')}
            >
              {t('sidebar_btn_label_save')}
            </Button>
            <Separator orientation="vertical" />
            <Button
              variant="ghost"
              size="sm"
              disabled={!isIdle}
              onClick={handleDownloadTask}
              title={t('sidebar_btn_label_download')}
            >
              {t('sidebar_btn_title_download')}
            </Button>
            <Separator orientation="vertical" />
            <Button
              variant="ghost"
              size="sm"
              disabled={!isIdle}
              onClick={handleOpenHelpDocument}
              title={t('sidebar_btn_title_help')}
            >
              {t('sidebar_btn_label_help')}
            </Button>
          </div>
        </header>

        {/* Middle section with task tree and steps panel */}
        <main className="sidebar-middle">
          {/* Task tree panel with toggle */}
          <div
            className={`task-tree-panel ${isTreeCollapsed ? 'collapsed' : ''} ${isRecording || isReplaying || isBottomExpanded ? 'readonly' : ''}`}
          >
            {/* Task tree controls */}
            <div className="tree-controls">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!isIdle}
                onClick={handleToggleTreeClick}
                title={isTreeCollapsed ? t('sidebar_btn_title_tree_expand') : t('sidebar_btn_title_tree_collapse')}
              >
                {isTreeCollapsed ? '→' : '←'}
              </Button>
              {!isTreeCollapsed && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!(activeTaskNodeId && isIdle)}
                    onClick={handleShowAddTaskNodeDialog}
                    title={t('sidebar_btn_title_tree_add_node')}
                  >
                    +
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={!(activeTaskNodeId && isIdle)}
                    onClick={handleDeleteTaskNode}
                    title={t('sidebar_btn_title_tree_delete_node')}
                  >
                    -
                  </Button>
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
          <div className="steps-panel">
            {/* Steps controls */}
            <div className="steps-controls">
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!(activeTaskId && isIdle && !isBottomExpanded)}
                onClick={() => handleAddStep()}
                title={t('sidebar_btn_title_steps_add_step')}
              >
                +
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!(activeTaskId && isIdle && selectedStepUid && !isBottomExpanded)}
                onClick={handleRemoveStep}
                title={t('sidebar_btn_title_steps_delete_step')}
              >
                -
              </Button>
              <Separator orientation="vertical" />
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!(activeTaskId && isIdle)}
                onClick={handleRecord}
                title={t('sidebar_btn_title_steps_record')}
              >
                ◉
              </Button>
              <Separator orientation="vertical" />
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!(activeTaskId && isIdle && !isBottomExpanded)}
                onClick={handleReplay}
                title={t('sidebar_btn_title_steps_replay')}
              >
                ▶
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!(activeTaskId && isIdle && selectedStepUid && !isBottomExpanded)}
                onClick={handleReplayFromStep}
                title={t('sidebar_btn_title_steps_replayFromStep')}
              >
                ▷
              </Button>
              <Separator orientation="vertical" />
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!(activeTaskId && (isReplaying || isRecording))}
                onClick={handleStop}
                title={t('sidebar_btn_title_steps_stop')}
              >
                ■
              </Button>
              <Separator orientation="vertical" />
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!isIdle}
                onClick={toggleCDPAttach}
                title={
                  isDebuggerAttached
                    ? t('sidebar_btn_title_steps_debugger_detach')
                    : t('sidebar_btn_title_steps_debugger_attach')
                }
              >
                {isDebuggerAttached ? '☍' : '☌'}
              </Button>
              <Separator orientation="vertical" />
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={!isIdle}
                onClick={openAIDialog}
                title={t('sidebar_btn_title_steps_ai_assistant')}
              >
                AI
              </Button>
            </div>
            {/* Steps container */}
            <div
              className={`steps-container ${isRecording || isReplaying ? 'readonly' : ''}`}
              onClick={handleStepsPanelClick}
            >
              {activeSteps.map(step => (
                <Card
                  key={step.uid}
                  draggable={!!(activeTaskId && isIdle)}
                  className={`step-card ${selectedStepUid === step.uid ? 'selected' : ''} h-15 flex-row items-center gap-2 px-2 py-2`}
                  onClick={e => {
                    e.stopPropagation();
                    handleStepSelect(step.uid);
                  }}
                  onDragStart={e => {
                    e.stopPropagation();
                    handleDragStart(step.uid);
                  }}
                  onDragOver={e => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDragOver();
                  }}
                  onDrop={e => {
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
                      onDoubleClick={e => {
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
                      onChange={e => setEditedStepDescription(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveStepDescription(step.uid);
                        if (e.key === 'Escape') cancelStepEdit();
                      }}
                      onBlur={() => saveStepDescription(step.uid)}
                      autoFocus
                    />
                  )}
                  <div
                    className={`step-status ${step.last_status || 'pending'}`}
                    onClick={e => {
                      e.stopPropagation();
                      handleStepResultClick();
                    }}
                    title={getStepLastError(step)}
                  >
                    {getStepLastStatus(step)}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>

        {/* Bottom section with tabs */}
        <footer
          className={`sidebar-bottom ${isBottomExpanded ? 'expanded' : ''} ${isRecording || isReplaying ? 'readonly' : ''}`}
        >
          <div className="sidebar-bottom-content">
            {selectedStep && (
              <StepScriptEditor
                key={selectedStep.uid}
                ref={stepScriptEditorRef}
                initialScriptContent={selectedStep.script}
                onScriptChange={handleOnSelectedStepScriptChange}
                runScript={handleReplaySelectedStep}
              />
            )}
          </div>
          <div className="sidebar-bottom-controls">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!(activeTaskId && selectedStepUid && isIdle)}
              onClick={toggleBottomExpanded}
              title={isBottomExpanded ? t('sidebar_btn_title_bottom_collapse') : t('sidebar_btn_title_bottom_expand')}
            >
              ⇵
            </Button>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
