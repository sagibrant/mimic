/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file Task.ts
 * @description 
 * Defines interfaces for tasks and steps for automation.
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

/**
 * Interface representing an asset describing a task or a group of tasks
 */
export interface TaskAsset {
  id: string;
  name: string;
  type: 'asset';
  url: string;
  author: string;
  description: string;
  version: string;
  tags: string[];
  root: TaskGroup | Task;
  results: TaskResult[];
  creation_time: number;
  last_modified_time: number;
}

/**
 * Interface representing a group of tasks or other groups
 */
export interface TaskGroup {
  id: string;
  name: string;
  type: 'group';
  children: Array<TaskGroup | Task>;
}

/**
 * Interface representing a task containing multiple steps
 */
export interface Task {
  id: string;
  name: string;
  type: 'task';
  steps: Step[];
}

/**
 * Interface representing an automated step
 */

export interface Step {
  uid: string;
  type: 'script_step';
  objects?: ObjectDescription[];
  description: string;
  script: string;
  last_status?: 'passed' | 'failed';
  last_error?: string;
}

export type ObjectDescription = Record<string, any>;

/**
 * Interface representing the result of executing a task
 */
export interface TaskResult {
  task_id: string;
  task_start_time: number;
  task_end_time: number;
  status?: 'passed' | 'failed';
  last_error?: string;
  steps: StepResult[];
}

/**
 * Interface representing the result of executing a step
 */
export interface StepResult {
  step_uid: string;
  step_description: string;
  step_start_time: number;
  step_end_time: number;
  status?: 'passed' | 'failed';
  error?: string;
  screenshot?: string;
}

