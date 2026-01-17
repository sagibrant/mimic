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

export class RuntimeUtils {
  private static _dispatcher?: Dispatcher;
  private static _repo?: ObjectRepository;

  static set dispatcher(dispatcher: Dispatcher) {
    RuntimeUtils._dispatcher = dispatcher;
  }

  static get dispatcher(): Dispatcher {
    // init with build-in MainToContentDispatcher for web package
    if (Utils.isNullOrUndefined(RuntimeUtils._dispatcher)) {
      RuntimeUtils._dispatcher = new MainToContentDispatcher();
    }
    return RuntimeUtils._dispatcher;
  }

  static set repo(repo: ObjectRepository) {
    RuntimeUtils._repo = repo;
  }

  static get repo(): ObjectRepository {
    if (Utils.isNullOrUndefined(RuntimeUtils._repo)) {
      RuntimeUtils._repo = new ObjectRepository();
    }
    return RuntimeUtils._repo;
  }
}