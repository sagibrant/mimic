/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file TaskUtils.ts
 * @description 
 * Defines Utils for tasks and steps for automation.
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

import { Utils } from "@gogogo/shared";
import { ObjectDescription, StepResult, Task, TaskAsset, TaskGroup, TaskResult } from "./Task";

export class TaskUtils {

  static createNewTaskAsset(): TaskAsset {
    const emptyTask: Task = {
      id: Utils.generateUUID(),
      name: 'task',
      type: 'task',
      steps: []
    }
    const root: TaskGroup = {
      id: Utils.generateUUID(),
      name: 'root',
      type: 'group',
      children: [emptyTask]
    };
    const asset: TaskAsset = {
      id: Utils.generateUUID(),
      name: 'asset',
      type: 'asset',
      url: '',
      author: 'placeholder',
      description: 'placeholder',
      version: '0.0.1',
      tags: [],
      root: root,
      results: [],
      creation_time: Date.now(),
      last_modified_time: Date.now(),
    };
    return asset;
  }

  static isTaskAsset(asset: any): asset is TaskAsset {

    if (asset === null || typeof asset !== 'object') {
      return false;
    }

    const basicChecks = [
      typeof asset.id === 'string',
      typeof asset.name === 'string',
      typeof asset.type === 'string' && asset.type === 'asset',
      typeof asset.url === 'string',
      typeof asset.author === 'string',
      typeof asset.description === 'string',
      typeof asset.version === 'string',
      Array.isArray(asset.tags) && asset.tags.every((tag: any) => typeof tag === 'string'),
      typeof asset.creation_time === 'number',
      typeof asset.last_modified_time === 'number'
    ];

    if (basicChecks.some(check => !check)) {
      return false;
    }

    if (!TaskUtils.isTaskNode(asset.root)) {
      return false;
    }

    if (!Array.isArray(asset.results)) {
      return false;
    }
    if (!asset.results.every((result: any) => TaskUtils.isTaskResult(result))) {
      return false;
    }

    return true;
  }

  private static isTaskResult(result: any): result is TaskResult {
    if (result === null || typeof result !== 'object') {
      return false;
    }

    const requiredChecks = [
      typeof result.task_id === 'string',
      typeof result.task_start_time === 'number',
      typeof result.task_end_time === 'number',
      Array.isArray(result.steps) && result.steps.every((step: any) => TaskUtils.isStepResult(step))
    ];

    if (requiredChecks.some(check => !check)) {
      return false;
    }

    const optionalStatus = result.status === undefined ||
      ['passed', 'failed'].includes(result.status);
    const optionalError = result.last_error === undefined || typeof result.last_error === 'string';

    return optionalStatus && optionalError;
  }

  private static isStepResult(step: any): step is StepResult {
    if (step === null || typeof step !== 'object') {
      return false;
    }

    const requiredChecks = [
      typeof step.step_uid === 'string',
      typeof step.step_description === 'string',
      typeof step.step_start_time === 'number',
      typeof step.step_end_time === 'number'
    ];

    if (requiredChecks.some(check => !check)) {
      return false;
    }

    const optionalStatus = step.status === undefined ||
      ['passed', 'failed'].includes(step.status);
    const optionalError = step.error === undefined || typeof step.error === 'string';
    const optionalScreenshot = step.screenshot === undefined || typeof step.screenshot === 'string';

    return optionalStatus && optionalError && optionalScreenshot;
  }

  private static isTaskNode(root: any): root is TaskGroup | Task {
    if (root === null || typeof root !== 'object') {
      return false;
    }

    if (
      typeof root.id !== 'string' ||
      typeof root.name !== 'string' ||
      typeof root.type !== 'string'
    ) {
      return false;
    }

    if (root.type === 'group') {
      return (
        Array.isArray(root.children) &&
        root.children.every((child: any) => TaskUtils.isTaskNode(child))
      );
    } else if (root.type === 'task') {
      if (!Array.isArray(root.steps)) {
        return false;
      }

      return root.steps.every((step: any) =>
        typeof step === 'object' &&
        step !== null &&
        typeof step.uid === 'string' &&
        step.type === 'script_step' &&
        typeof step.description === 'string' &&
        typeof step.script === 'string' &&
        (step.objects === undefined ||
          (Array.isArray(step.objects) &&
            step.objects.every(TaskUtils.isObjectDescription)))
      );
    }

    return false;
  }

  private static isObjectDescription(obj: any): obj is ObjectDescription {
    if (obj === null || typeof obj !== 'object') {
      return false;
    }
    if ('title' in obj && 'url' in obj && 'index' in obj) {
      return (
        typeof obj.title === 'string' &&
        typeof obj.url === 'string' &&
        typeof obj.index === 'number'
      );
    }

    if ('tagName' in obj) {
      const baseCheck = typeof obj.tagName === 'string';

      const parentCheck = obj.parent === undefined || TaskUtils.isObjectDescription(obj.parent);
      const valueCheck = obj.value === undefined || typeof obj.value === 'string';
      const textContentCheck = obj.textContent === undefined || typeof obj.textContent === 'string';
      const attributesCheck = obj.attributes === undefined ||
        (typeof obj.attributes === 'object' &&
          obj.attributes !== null &&
          !Array.isArray(obj.attributes));

      return baseCheck && parentCheck && valueCheck && textContentCheck && attributesCheck;
    }

    return false;
  }

}