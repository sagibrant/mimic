/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file DOMNode.ts
 * @description 
 * Shared DOMNode & Step types
 * Reference https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/panels/elements/DOMPath.ts
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

export class DOMNode {
  private _node: Node;
  constructor(node: Node) {
    this._node = node;
  }

  ancestorShadowRoot(): ShadowRoot | null {
    let current: Node | null = this._node;
    while (current && !(current instanceof ShadowRoot)) {
      current = current.parentNode;
    }
    return current instanceof ShadowRoot ? current : null;
  }

  ancestorShadowHost(): DOMNode | null {
    const ancestorShadowRoot = this.ancestorShadowRoot();
    return ancestorShadowRoot ? new DOMNode(ancestorShadowRoot.host) : null;
  }

  nodeName(): string {
    return this._node.nodeName;
  }

  nodeType(): number {
    return this._node.nodeType;
  }

  getAttribute(attrName: string): string | null {
    if (this._node.nodeType === Node.ELEMENT_NODE && this._node instanceof Element) {
      return this._node.getAttribute(attrName);
    }
    return null;
  }

  localName(): string {
    if (this._node.nodeType === Node.ELEMENT_NODE && this._node instanceof Element) {
      return this._node.localName;
    }
    return this._node.nodeName
  }

  get parentNode(): DOMNode | null {
    return this._node.parentNode ? new DOMNode(this._node.parentNode) : null;
  }

  get nativeNode(): Node {
    return this._node;
  }

  children(): DOMNode[] {
    const result: DOMNode[] = [];
    if (this._node.nodeType === Node.ELEMENT_NODE && this._node instanceof Element) {
      const children = this._node.children;
      for (let i = 0; i < children.length; i++) {
        const elem = new DOMNode(children[i]);
        result.push(elem);
      }
    }
    return result;
  }

  shadowRootType(): string | null {
    return this._node instanceof ShadowRoot ? this._node.mode : null;
  }

  nodeNameInCorrectCase(): string {
    const shadowRootType = this.shadowRootType();
    if (shadowRootType) {
      return '#shadow-root (' + shadowRootType + ')';
    }

    // If there is no local #name, it's case sensitive
    const localName = this.localName();
    if (!localName) {
      return this.nodeName();
    }

    // If the names are different lengths, there is a prefix and it's case sensitive
    if (localName.length !== this.nodeName().length) {
      return this.nodeName();
    }

    // Return the localname, which will be case insensitive if its an html node
    return localName;
  }
}

export class Step {
  value: string;
  optimized: boolean;
  constructor(value: string, optimized: boolean) {
    this.value = value;
    this.optimized = optimized || false;
  }

  toString(): string {
    return this.value;
  }
}

