/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file content.ts
 * @description 
 * the extension content.js
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
import { FrameHandler } from "./content/handlers/FrameHandler";
import { ContentDispatcher } from "./content/ContentDispatcher";
import { ObjectRepository } from "./content/ObjectRepository";
import { ContentUtils } from "./content/ContentUtils";

await SettingUtils.init();
// create frame
const frame = new FrameHandler();
ContentUtils.frame = frame;
// create dispatcher
const dispatcher = new ContentDispatcher();
dispatcher.addHandler(frame);
ContentUtils.dispatcher = dispatcher;
// create repo
const repo = new ObjectRepository(frame);
ContentUtils.repo = repo;

declare global {
  interface Window {
    gogogo: {
      frame: FrameHandler;
      dispatcher: ContentDispatcher;
      repo: ObjectRepository;
    };
  }
}
window.gogogo = {
  frame: frame,
  dispatcher: dispatcher,
  repo: repo
};

await dispatcher.init();