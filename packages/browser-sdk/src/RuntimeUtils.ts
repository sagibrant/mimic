/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file RuntimeUtils.ts
 * @description 
 * Shared utility classes and functions for runtime
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

import { Utils, Dispatcher } from "@gogogo/shared";
import { ObjectRepository } from "./ObjectRepository";
import { MainToContentDispatcher } from "./Dispatcher";

interface InternalRuntimeObjects {
  dispatcher?: Dispatcher,
  repo?: ObjectRepository
}

const RuntimeObjects: InternalRuntimeObjects = {
  dispatcher: undefined,
  repo: undefined
}

export const RuntimeUtils = {

  set dispatcher(dispatcher: Dispatcher) {
    RuntimeObjects.dispatcher = dispatcher;
  },

  get dispatcher(): Dispatcher {
    // init with build-in MainToContentDispatcher for web package
    if (Utils.isNullOrUndefined(RuntimeObjects.dispatcher)) {
      RuntimeObjects.dispatcher = new MainToContentDispatcher();
    }
    return RuntimeObjects.dispatcher;
  },

  set repo(repo: ObjectRepository) {
    RuntimeObjects.repo = repo;
  },

  get repo(): ObjectRepository {
    if (Utils.isNullOrUndefined(RuntimeObjects.repo)) {
      RuntimeObjects.repo = new ObjectRepository();
    }
    return RuntimeObjects.repo;
  }
}
