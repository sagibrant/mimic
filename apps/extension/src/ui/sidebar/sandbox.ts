/**
 * @copyright 2025 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file sandbox.ts
 * @description 
 * Entry point for sandbox.html
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

import { SettingUtils } from "@gogogo/shared";
import { ObjectRepository, RuntimeUtils } from "@gogogo/web";
import { SandboxHandler } from "./SandboxHandler";
import { SandboxDispatcher } from "./SandboxDispatcher";

SettingUtils.getSettings().logLevel = 'WARN';
const repo = new ObjectRepository();
const dispatcher = new SandboxDispatcher();
const handler = new SandboxHandler();
dispatcher.addHandler(handler);
RuntimeUtils.dispatcher = dispatcher;
RuntimeUtils.repo = repo;
await dispatcher.init();