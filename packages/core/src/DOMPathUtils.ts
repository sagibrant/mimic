/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file DOMPathUtils.ts
 * @description 
 * DOMPath utility classes and functions
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
import { DOMElementDescription } from "./types/protocol";
import { DOMNode, Step } from "./DOMNode";

export function fullQualifiedSelector(node: DOMNode, justSelector?: boolean): string {
  if (node.nodeType() !== Node.ELEMENT_NODE) {
    return node.localName() || node.nodeName().toLowerCase();
  }
  return cssPath(node, justSelector);
}

export function cssPath(node: DOMNode, optimized?: boolean): string {
  if (node.nodeType() !== Node.ELEMENT_NODE) {
    return '';
  }

  const steps = [];
  let contextNode: DOMNode | null = node;
  while (contextNode) {
    const step = cssPathStep(contextNode, Boolean(optimized), contextNode.nativeNode === node.nativeNode);
    if (!step) {
      break;
    }  // Error - bail out early.
    steps.push(step);
    if (step.optimized) {
      break;
    }
    contextNode = contextNode.parentNode;
  }

  steps.reverse();
  return steps.join(' > ');
}

export function canGetJSPath(node: DOMNode): boolean {
  let wp: DOMNode | null = node;
  while (wp) {
    const shadowRoot = wp.ancestorShadowRoot();
    if (shadowRoot && shadowRoot.mode !== 'open') {
      return false;
    }
    wp = wp.ancestorShadowHost();
  }
  return true;
}

export function jsPath(node: DOMNode, optimized?: boolean): string {
  if (node.nodeType() !== Node.ELEMENT_NODE) {
    return '';
  }

  const path = [];
  let wp: (DOMNode | null) | DOMNode = node;
  while (wp) {
    path.push(cssPath(wp, optimized));
    wp = wp.ancestorShadowHost();
  }
  path.reverse();
  let result = '';
  for (let i = 0; i < path.length; ++i) {
    const string = JSON.stringify(path[i]);
    if (i) {
      result += `.shadowRoot.querySelector(${string})`;
    } else {
      result += `document.querySelector(${string})`;
    }
  }
  return result;
}

export function cssPathStep(node: DOMNode, optimized: boolean, isTargetNode: boolean): Step | null {
  if (node.nodeType() !== Node.ELEMENT_NODE) {
    return null;
  }

  const id = node.getAttribute('id');
  if (optimized) {
    if (id) {
      return new Step(idSelector(id), true);
    }
    const nodeNameLower = node.nodeName().toLowerCase();
    if (nodeNameLower === 'body' || nodeNameLower === 'head' || nodeNameLower === 'html') {
      return new Step(node.nodeNameInCorrectCase(), true);
    }
  }
  const nodeName = node.nodeNameInCorrectCase();

  if (id) {
    return new Step(nodeName + idSelector(id), true);
  }
  const parent = node.parentNode;
  if (!parent || parent.nodeType() === Node.DOCUMENT_NODE) {
    return new Step(nodeName, true);
  }

  function prefixedElementClassNames(node: DOMNode): string[] {
    const classAttribute = node.getAttribute('class');
    if (!classAttribute) {
      return [];
    }

    return classAttribute.split(/\s+/g).filter(Boolean).map(function (name) {
      // The prefix is required to store "__proto__" in a object-based map.
      return '$' + name;
    });
  }

  function idSelector(id: string): string {
    return '#' + CSS.escape(id);
  }

  const prefixedOwnClassNamesArray = prefixedElementClassNames(node);
  let needsClassNames = false;
  let needsNthChild = false;
  let ownIndex = -1;
  let elementIndex = -1;
  const siblings = parent.children();
  for (let i = 0; siblings && (ownIndex === -1 || !needsNthChild) && i < siblings.length; ++i) {
    const sibling = siblings[i];
    if (sibling.nodeType() !== Node.ELEMENT_NODE) {
      continue;
    }
    elementIndex += 1;
    if (sibling.nativeNode === node.nativeNode) {
      ownIndex = elementIndex;
      continue;
    }
    if (needsNthChild) {
      continue;
    }
    if (sibling.nodeNameInCorrectCase() !== nodeName) {
      continue;
    }

    needsClassNames = true;
    const ownClassNames = new Set<string>(prefixedOwnClassNamesArray);
    if (!ownClassNames.size) {
      needsNthChild = true;
      continue;
    }
    const siblingClassNamesArray = prefixedElementClassNames(sibling);
    for (let j = 0; j < siblingClassNamesArray.length; ++j) {
      const siblingClass = siblingClassNamesArray[j];
      if (!ownClassNames.has(siblingClass)) {
        continue;
      }
      ownClassNames.delete(siblingClass);
      if (!ownClassNames.size) {
        needsNthChild = true;
        break;
      }
    }
  }

  let result = nodeName;
  if (isTargetNode && nodeName.toLowerCase() === 'input' && node.getAttribute('type') && !node.getAttribute('id') &&
    !node.getAttribute('class')) {
    result += '[type=' + CSS.escape((node.getAttribute('type')) || '') + ']';
  }
  if (needsNthChild) {
    result += ':nth-child(' + (ownIndex + 1) + ')';
  } else if (needsClassNames) {
    for (const prefixedName of prefixedOwnClassNamesArray) {
      result += '.' + CSS.escape(prefixedName.slice(1));
    }
  }

  return new Step(result, false);
}

export function xPath(node: DOMNode, optimized?: boolean): string {
  if (node.nodeType() === Node.DOCUMENT_NODE) {
    return '/';
  }

  const steps = [];
  let contextNode: DOMNode | null = node;
  while (contextNode) {
    const step = xPathValue(contextNode, optimized);
    if (!step) {
      break;
    }  // Error - bail out early.
    steps.push(step);
    if (step.optimized) {
      break;
    }

    if (!contextNode.parentNode && contextNode.nativeNode instanceof ShadowRoot) {
      contextNode = contextNode.ancestorShadowHost();
    }
    else {
      contextNode = contextNode.parentNode;
    }
  }

  steps.reverse();
  return (steps.length && steps[0].optimized ? '' : '/') + steps.join('/');
}

export function xPathValue(node: DOMNode, optimized?: boolean): Step | null {
  let ownValue;
  const ownIndex = xPathIndex(node);
  if (ownIndex === -1) {
    return null;
  }  // Error.

  switch (node.nodeType()) {
    case Node.ELEMENT_NODE:
      if (optimized && node.getAttribute('id')) {
        return new Step('//*[@id="' + node.getAttribute('id') + '"]', true);
      }
      ownValue = node.localName() ?? node.nodeName();
      break;
    case Node.ATTRIBUTE_NODE:
      ownValue = '@' + node.nodeName();
      break;
    case Node.TEXT_NODE:
    case Node.CDATA_SECTION_NODE:
      ownValue = 'text()';
      break;
    case Node.PROCESSING_INSTRUCTION_NODE:
      ownValue = 'processing-instruction()';
      break;
    case Node.COMMENT_NODE:
      ownValue = 'comment()';
      break;
    case Node.DOCUMENT_NODE:
      ownValue = '';
      break;
    default:
      ownValue = '';
      break;
  }

  if (ownIndex > 0) {
    ownValue += '[' + ownIndex + ']';
  }

  return new Step(ownValue, node.nodeType() === Node.DOCUMENT_NODE);
}

export function xPathIndex(node: DOMNode): number {
  /**
   * Returns -1 in case of error, 0 if no siblings matching the same expression,
   * <XPath index among the same expression-matching sibling nodes> otherwise.
   */
  function areNodesSimilar(left: DOMNode, right: DOMNode): boolean {
    if (left === right) {
      return true;
    }

    if (left.nodeType() === Node.ELEMENT_NODE && right.nodeType() === Node.ELEMENT_NODE) {
      return left.localName() === right.localName();
    }

    if (left.nodeType() === right.nodeType()) {
      return true;
    }

    // XPath treats CDATA as text nodes.
    const leftType = left.nodeType() === Node.CDATA_SECTION_NODE ? Node.TEXT_NODE : left.nodeType();
    const rightType = right.nodeType() === Node.CDATA_SECTION_NODE ? Node.TEXT_NODE : right.nodeType();
    return leftType === rightType;
  }

  const siblings = node.parentNode ? node.parentNode.children() : null;
  if (!siblings) {
    return 0;
  }  // Root node - no siblings.
  let hasSameNamedElements = false;
  for (let i = 0; i < siblings.length; ++i) {
    if (areNodesSimilar(node, siblings[i]) && siblings[i].nativeNode !== node.nativeNode) {
      hasSameNamedElements = true;
      break;
    }
  }
  if (!hasSameNamedElements) {
    return 0;
  }
  let ownIndex = 1;  // XPath indices start with 1.
  for (let i = 0; i < siblings.length; ++i) {
    if (areNodesSimilar(node, siblings[i])) {
      if (siblings[i].nativeNode === node.nativeNode) {
        return ownIndex;
      }
      ++ownIndex;
    }
  }
  return -1;  // An error occurred: |node| not found in parent's children.
}

export function getDOMNodeDetails(node: Node): DOMElementDescription {
  while (node && (node.nodeType !== Node.ELEMENT_NODE || node.nodeName.startsWith(':')) && node.parentNode) {
    node = node.parentNode;
  }
  if (!node || node.nodeType !== Node.ELEMENT_NODE) {
    throw new Error('Invalid element node provided.');
  }
  const elem = node as Element;
  const nodeName = elem.nodeName;
  const nodeValue = elem.nodeValue;
  const textContent = elem.textContent;
  const localName = elem.localName;
  const tagName = elem.tagName;

  const domNode = new DOMNode(node);
  const selector = cssPath(domNode, true);
  const xPathVal = xPath(domNode, true);
  const fullXPath = xPath(domNode);

  let nodeDetails: DOMElementDescription = { nodeType: Node.ELEMENT_NODE, nodeName, selector, xPath: xPathVal, fullXPath };
  if (nodeValue !== undefined) {
    nodeDetails = { ...nodeDetails, nodeValue };
  }
  if (textContent !== undefined) {
    nodeDetails = { ...nodeDetails, textContent };
  }
  if (localName !== undefined) {
    nodeDetails = { ...nodeDetails, localName };
  }
  if (tagName !== undefined) {
    nodeDetails = { ...nodeDetails, tagName };
  }

  if (elem.attributes) {
    const attributes: Record<string, string> = {};
    for (let i = 0; i < elem.attributes.length; i++) {
      const attr = elem.attributes[i];
      attributes[attr.name] = attr.value;
    }
    nodeDetails = { ...nodeDetails, attributes };
  }

  const canGetJSPathForDomNode = canGetJSPath(domNode);
  if (canGetJSPathForDomNode) {
    const jsPathVal = jsPath(domNode, true);
    nodeDetails = { ...nodeDetails, jsPath: jsPathVal };
  }

  const frameUrl = window.location.href;
  nodeDetails = { ...nodeDetails, frameUrl };

  const isInSubFrame = window.parent !== window;
  nodeDetails = { ...nodeDetails, isInSubFrame };

  const shadowRoot = domNode.ancestorShadowRoot();
  if (shadowRoot) {
    const shadowRootMode = shadowRoot.mode;
    nodeDetails = { ...nodeDetails, isInShadowRoot: true, shadowRootMode };
  }
  else {
    nodeDetails = { ...nodeDetails, isInShadowRoot: false };
  }
  return nodeDetails;
}