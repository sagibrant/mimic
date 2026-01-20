/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file TextUtils.ts
 * @description 
 * The Utils for text tokens (words)
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

import { Utils, RectInfo } from "@mimic-sdk/core";
import { ContentUtils } from "./ContentUtils";

/**
 * Represents a key-value pair, optionally typed.
 */
export interface NameValuePair {
    name: string;
    value?: unknown;
}

export interface DomNodeFilter {
    /**
     * node properties
     */
    properties: NameValuePair[];
    /**
     * element attributes
     */
    attributes: NameValuePair[];
}
export interface TextFilter {
    /**
     * visibilityLevel: char | fast | none
     *  char: check the visibility on each char for node with nodeType === Node.TEXT_NODE
     *  word: check the visibility on each word for node with nodeType === Node.TEXT_NODE
     *  none: do not check the visibility
     */
    visibilityLevel: 'char' | 'word' | 'none';
    /**
     * the nodes to be included
     */
    includes: DomNodeFilter[];
    /**
     * the nodes to be excluded unless allowed in the includes list
     */
    excludes: DomNodeFilter[];
}
/**
 * the direction of the text: horizontal-lr (horizontal-tb + ltr), horizontal-rl (horizontal-tb + rtl), vertical-lr, vertical-rl
 */
export type TextDirection = 'horizontal-lr' | 'horizontal-rl' | 'vertical-rl' | 'vertical-lr';
export type TextItemType = 'range' | 'line' | 'word' | 'char' | 'element';
/**
 * The type of a text item in 'range' | 'line' | 'word' | 'char' | 'element'
 */
export interface TextItem {
    /**
     * text type: 
     *  textNode: range, line, word, char
     *  elementNode: value, textContent, innerText, placeholder
     */
    type: TextItemType;
    /**
     * text
     */
    text: string;
    /**
     * rectangles
     */
    rects: RectInfo[];
    /**
     * the direction of the text: horizontal-lr (horizontal-tb + ltr), horizontal-rl (horizontal-tb + rtl), vertical-lr, vertical-rl
     */
    direction: TextDirection;
    /**
     * confidence
     */
    confidence: number;
    /**
     * child items
     */
    childItems: TextItem[];
}
/**
 * The type of the text collection for a DOM Node
 */
export interface NodeTextItem {
    /**
     * the dom node
     */
    node: Node;
    /**
     * text
     */
    text: TextItem;
}

export function getDefaultTextFilter(): TextFilter {
    const filter: TextFilter = {
        visibilityLevel: 'char',
        includes: [],
        excludes: []
    };

    // include all text nodes
    const filter_text: DomNodeFilter = {
        properties: [{ name: 'nodeType', value: Node.TEXT_NODE }],
        attributes: []
    };
    filter.includes.push(filter_text);

    // exclude all element nodes
    const filter_elem_all: DomNodeFilter = {
        properties: [
            { name: 'nodeType', value: Node.ELEMENT_NODE },
            { name: 'nodeName', value: '*' },
        ],
        attributes: []
    };
    filter.excludes.push(filter_elem_all);
    return filter;
}

export function getDefaultTextFilterWithElements(): TextFilter {
    const filter: TextFilter = {
        visibilityLevel: 'char',
        includes: [],
        excludes: []
    };

    // include all text nodes
    const filter_text: DomNodeFilter = {
        properties: [{ name: 'nodeType', value: Node.TEXT_NODE }],
        attributes: []
    };
    filter.includes.push(filter_text);


    // include all input element
    const filter_elem_input: DomNodeFilter = {
        properties: [
            { name: 'nodeType', value: Node.ELEMENT_NODE },
            { name: 'nodeName', value: 'INPUT' },
        ],
        attributes: []
    };
    filter.includes.push(filter_elem_input);

    // include textarea element
    const filter_elem_textarea: DomNodeFilter = {
        properties: [
            { name: 'nodeType', value: Node.ELEMENT_NODE },
            { name: 'nodeName', value: 'TEXTAREA' },
        ],
        attributes: []
    };
    filter.includes.push(filter_elem_textarea);

    // include select element
    const filter_elem_select: DomNodeFilter = {
        properties: [
            { name: 'nodeType', value: Node.ELEMENT_NODE },
            { name: 'nodeName', value: 'SELECT' },
        ],
        attributes: []
    };
    filter.includes.push(filter_elem_select);
    return filter;
}

/**
 * get the text items on top of the given node
 * @param {Node} node 
 * @param {TextFilter} filter 
 * @returns {NodeTextItem[]}
 */
export function getNodeTextItems(node: Node, filter: TextFilter): NodeTextItem[] {
    let result: NodeTextItem[] = [];
    node = node || document.body;

    // check if the element node is visible based on css
    // so that we can return asap to prune the text processing 
    if (node.nodeType === Node.ELEMENT_NODE && !ContentUtils.isVisibleBasedOnCSS(node)) {
        return result;
    }

    // try to get text items from childNodes or shadowRoot.childNodes
    if (node.childNodes && node.childNodes.length > 0) {
        node.childNodes.forEach(childNode => {
            const childNodeTextItems = getNodeTextItems(childNode, filter);
            if (childNodeTextItems && childNodeTextItems.length > 0) {
                result.push(...childNodeTextItems);
            }
        });
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        const elem = node as Element;
        const shadowRoot = ContentUtils.getShadowRoot(elem);
        if (shadowRoot && shadowRoot.childNodes && shadowRoot.childNodes.length > 0) {
            shadowRoot.childNodes.forEach(childNode => {
                const childNodeTextItems = getNodeTextItems(childNode, filter);
                if (childNodeTextItems && childNodeTextItems.length > 0) {
                    result = result.concat(childNodeTextItems);
                }
            });
        }
    }

    if (result.length > 0) {
        return result;
    }

    // continue process the current node if the node is included or not excluded by filter
    if (filter) {
        // check if the node is included
        let included = undefined;
        if (Array.isArray(filter.includes) && filter.includes.length > 0) {
            included = filter.includes.some((nodeFilter) => {
                return matchDomNodeFilter(node, nodeFilter);
            });
        }
        // check if the node is excluded when it is not included
        let excluded = undefined;
        if (included !== true && Array.isArray(filter.excludes) && filter.excludes.length > 0) {
            excluded = filter.excludes.some((nodeFilter) => {
                return matchDomNodeFilter(node, nodeFilter);
            });
        }
        if (included !== true && excluded === true) {
            return result;
        }
    }

    // check if the node is visible on the viewport
    if (!ContentUtils.isVisibleOnViewPort(node)) {
        return result;
    }

    // get TextItem for TEXT_NODE
    if (node.nodeType === Node.TEXT_NODE) {
        const item = getNodeTextItemForTextNode(node, filter.visibilityLevel);
        if (item) {
            result.push(item);
        }
        return result;
    }

    // get TextItem for ELEMENT_NODE
    if (node.nodeType === Node.ELEMENT_NODE) {
        const item = getNodeTextItemForElementNode(node, filter.visibilityLevel);
        if (item) {
            result.push(item);
            return result;
        }
    }

    return result;
}

/**
 * get the NodeTextItem for the given node
 * @param {Node} node - the DOM node with nodeType === Node.TEXT_NODE
 * @param {string} mode - the text mode: 'char' | 'word' | 'none'
 * @returns {NodeTextItem|null}
 */
export function getNodeTextItemForTextNode(node: Node, visibilityLevel: 'char' | 'word' | 'none'): NodeTextItem | null {
    if (!node || node.nodeType !== Node.TEXT_NODE) {
        return null;
    }
    visibilityLevel = visibilityLevel ?? 'char';

    const range = document.createRange();
    range.selectNodeContents(node);
    const text = range.toString();
    // filter the blank text
    if (ContentUtils.isTrimNoise(text)) {
        return null;
    }
    // filter the invisible text
    const textRect = range.getBoundingClientRect();
    if (!ContentUtils.isRectangleVisible(textRect)) {
        return null;
    }
    const rects = range.getClientRects();
    if (!(rects && rects.length > 0)) {
        return null;
    }
    const elem = ContentUtils.getElementByNode(node);
    if (!elem) {
        return null;
    }
    const style = getComputedStyle(elem);
    if (!style) {
        return null;
    }
    let direction: TextDirection = 'horizontal-lr';
    if (style.writingMode === 'vertical-rl' || style.writingMode === 'vertical-lr') {
        direction = style.writingMode;
    } else if (style.writingMode === 'horizontal-tb') {
        if (style.direction === 'ltr') {
            direction = 'horizontal-lr';
        } else if (style.direction === 'rtl') {
            direction = 'horizontal-rl';
        }
    }

    // range > lines > words > chars
    // range level text
    const rangeTextItem: TextItem = {
        type: 'range',
        text: text,
        rects: [textRect],
        direction: direction,
        childItems: [],
        confidence: 100
    };
    const item: NodeTextItem = {
        node: node,
        text: rangeTextItem
    };
    let charIndex = 0;
    for (let i = 0; i < rects.length; i++) {
        const rect = rects.item(i);
        if (!rect) {
            continue;
        }
        // skip the invisible rect (some text will be placed in the invisible areas/outside the visible viewport)
        if (!ContentUtils.isRectangleVisible(rect)) {
            continue;
        }

        let chars: TextItem[] = [];
        const words: TextItem[] = [];
        for (; charIndex < text.length; charIndex++) {
            range.setStart(node, charIndex);
            range.setEnd(node, charIndex + 1);
            const charRect = range.getBoundingClientRect();
            const charValue = text[charIndex]; //range.toString();
            let isSameLine = true;
            if (direction === 'vertical-rl' || direction === 'vertical-lr') {
                isSameLine = Math.abs(charRect.left - rect.left) < 1;
            } else {
                isSameLine = Math.abs(charRect.top - rect.top) < 1;
            }
            if (isSameLine) {
                if (charValue === ' ') {
                    if (chars.length > 0) {
                        let wordTextItem = tryGetOuterTextItem(chars, 'word');
                        if (wordTextItem && visibilityLevel === 'word' && !ContentUtils.isVisibleUsingInspect(node, wordTextItem.rects[0])) {
                            wordTextItem = null;
                        }
                        if (wordTextItem) {
                            words.push(wordTextItem);
                        }
                    }
                    chars = [];
                } else {
                    let charTextItem: TextItem | null = {
                        type: 'char',
                        text: charValue,
                        rects: [charRect],
                        direction: direction,
                        confidence: 100,
                        childItems: []
                    };
                    if (visibilityLevel === 'char' && !ContentUtils.isVisibleUsingInspect(node, charTextItem.rects[0])) {
                        charTextItem = null;
                    }
                    if (charTextItem) {
                        chars.push(charTextItem);
                    }
                }
            } else {
                break;
            }
        }
        // last word
        if (chars.length > 0) {
            let wordTextItem = tryGetOuterTextItem(chars, 'word');
            if (wordTextItem && visibilityLevel === 'word' && !ContentUtils.isVisibleUsingInspect(node, wordTextItem.rects[0])) {
                wordTextItem = null;
            }
            if (wordTextItem) {
                words.push(wordTextItem);
            }
        }
        // line
        if (words.length > 0) {
            const lineTextItem = tryGetOuterTextItem(words, 'line');
            if (lineTextItem) {
                rangeTextItem.childItems.push(lineTextItem);
            }
        }
    }
    return item;
}

/**
 * get the NodeTextItem for the given node
 * @param {Node} node - the DOM node with nodeType === Node.ELEMENT_NODE
 * @param {string} mode - the text mode: 'char' | 'word' | 'none'
 * @returns {NodeTextItem|null}
 */
export function getNodeTextItemForElementNode(node: Node, visibilityLevel: 'char' | 'word' | 'none'): NodeTextItem | null {
    if (!node || node.nodeType !== Node.ELEMENT_NODE || !(node instanceof Element)) {
        return null;
    }
    const elem = node as Element;
    const elemTextItem: TextItem = {
        type: 'element',
        text: '',
        rects: [],
        direction: 'horizontal-lr',
        childItems: [],
        confidence: 75.0
    };

    if (elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA') {
        elemTextItem.text = (elem as HTMLInputElement | HTMLTextAreaElement).value;
        if (ContentUtils.isTrimNoise(elemTextItem.text) && elem.hasAttribute('placeholder')) {
            elemTextItem.text = elem.getAttribute('placeholder') || '';
        }
    }
    else if (elem.tagName === 'SELECT' && elem instanceof HTMLSelectElement) {
        const selectedOptions = elem.selectedOptions;
        let optionsText = '';
        for (let i = 0; i < selectedOptions.length; i++) {
            const option = selectedOptions[i];
            optionsText += option.label + '\r\n';
        }
        elemTextItem.text = optionsText;
    }
    else if (elem instanceof HTMLElement && elem.isContentEditable) {
        elemTextItem.text = elem.textContent;
    }
    else {
        if (ContentUtils.isTrimNoise(elem.textContent)) {
            elemTextItem.text = elem.textContent;
        }
        else if (elem instanceof HTMLElement && ContentUtils.isTrimNoise(elem.innerText)) {
            elemTextItem.text = elem.innerText;
        }
    }

    if (ContentUtils.isTrimNoise(elemTextItem.text)) {
        return null;
    }
    const elemRect = elem.getBoundingClientRect();
    if (!ContentUtils.isRectangleVisible(elemRect)) {
        return null;
    }
    if (visibilityLevel !== 'none' && !ContentUtils.isVisibleUsingInspect(elem, elemRect)) {
        return null;
    }
    elemTextItem.rects = [elemRect];

    let direction: TextDirection = 'horizontal-lr';
    const style = getComputedStyle(elem);
    if (style.writingMode === 'vertical-rl' || style.writingMode === 'vertical-lr') {
        direction = style.writingMode;
    } else if (style.writingMode === 'horizontal-tb') {
        if (style.direction === 'ltr') {
            direction = 'horizontal-lr';
        } else if (style.direction === 'rtl') {
            direction = 'horizontal-rl';
        }
    }
    elemTextItem.direction = direction;
    elemTextItem.confidence = 75.0;

    const item: NodeTextItem = {
        node: node,
        text: elemTextItem
    };
    return item;
}

/**
 * get the outer textItem as the given type
 * @param {TextItem[]} textItems 
 * @param {string} type 
 * @returns {TextItem|null}
 */
export function tryGetOuterTextItem(textItems: TextItem[], type: TextItemType): TextItem | null {
    if (!(Array.isArray(textItems) && textItems.length > 0)) {
        return null;
    }
    let separator = '';
    if (type === 'line') {
        separator = ' ';
    }
    const item: TextItem = {
        type: type,
        text: '',
        rects: [],
        direction: 'horizontal-lr',
        childItems: [],
        confidence: 100
    };
    item.text = textItems.reduce((pre, cur) => pre + separator + cur.text, '');
    if (ContentUtils.isTrimNoise(item.text)) {
        return null;
    }
    const rect: Partial<RectInfo> = {};
    rect.left = textItems.reduce((pre, cur) => pre.rects[0].left > cur.rects[0].left ? cur : pre, textItems[0]).rects[0].left;
    rect.top = textItems.reduce((pre, cur) => pre.rects[0].top > cur.rects[0].top ? cur : pre, textItems[0]).rects[0].top;
    rect.right = textItems.reduce((pre, cur) => pre.rects[0].right < cur.rects[0].right ? cur : pre, textItems[0]).rects[0].right;
    rect.bottom = textItems.reduce((pre, cur) => pre.rects[0].bottom < cur.rects[0].bottom ? cur : pre, textItems[0]).rects[0].bottom;
    rect.width = rect.right - rect.left;
    rect.height = rect.bottom - rect.top;
    rect.x = rect.left;
    rect.y = rect.top;
    const textRect = Utils.fixRectangle(rect);
    if (!ContentUtils.isRectangleVisible(textRect)) {
        return null;
    }
    item.rects = [textRect];
    item.direction = textItems[0].direction;
    item.childItems = textItems;

    return item;
}

/**
 * check if the given node match the give filter
 * @param {Node} node 
 * @param {DomNodeFilter} filter 
 * @returns {boolean}
 */
export function matchDomNodeFilter(node: Node, filter: DomNodeFilter): boolean {
    if (!node) {
        return false;
    }
    if (!filter) {
        return true;
    }
    let matched: boolean | undefined = undefined;
    // check if all the properties are matched
    if (Array.isArray(filter.properties) && filter.properties.length > 0) {
        filter.properties.forEach((nameValuePair) => {
            const valueMatched = (nameValuePair.value === '*') || ((node as unknown as Record<string, unknown>)[nameValuePair.name] === nameValuePair.value);
            if (valueMatched === true && matched !== false) {
                matched = true;
            } else if (valueMatched === false) {
                matched = false;
            }
        });
    }
    if (matched === false) {
        return false;
    }
    // check if all the attributes are matched
    if (Array.isArray(filter.attributes) && filter.attributes.length > 0 && node instanceof Element) {
        const elem = node as Element;
        filter.attributes.forEach((nameValuePair) => {
            let valueMatched = false;
            if (Utils.isNullOrUndefined(nameValuePair.value) || nameValuePair.value === '*') {
                valueMatched = elem.hasAttribute(nameValuePair.name);
            } else if (!Utils.isNullOrUndefined(nameValuePair.value)) {
                valueMatched = elem.getAttribute(nameValuePair.name) === nameValuePair.value;
            }
            if (valueMatched === true && matched !== false) {
                matched = true;
            } else if (valueMatched === false) {
                matched = false;
            }
        });
    }
    if (matched === false) {
        return false;
    }

    return true;
}
