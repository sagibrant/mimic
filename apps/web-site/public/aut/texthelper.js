class NameValuePair {
  /**
   * name
   * @type {string}
   */
  name;
  /**
   * value
   * @type {any|undefined}
   */
  value;

  constructor(name, value) {
    this.name = name;
    this.value = value;
  }
}
class DomNodeFilter {
  /**
   * node properties
   * @type {NameValuePair[]}
   */
  properties;
  /**
   * element attributes
   * @type {NameValuePair[]}
   */
  attributes;

  constructor() {
    this.properties = [];
    this.attributes = [];
  }
}
class TextFilter {
  /**
   * mode: best | fast | all
   *  best: check the visibility on each char for node with nodeType === Node.TEXT_NODE
   *  fast: check the visibility on each word for node with nodeType === Node.TEXT_NODE
   *  all: do not filter the invisible text
   * @type {string}
   */
  mode;
  /**
   * the nodes to be included
   * @type {DomNodeFilter[]}
   */
  includes;
  /**
   * the nodes to be excluded unless allowed in the includes list
   * @type {DomNodeFilter[]}
   */
  excludes;

  constructor() {
    this.mode = 'fast';
    this.includes = [];
    this.excludes = [];
  }

  toDefault() {
    this.mode = 'best';
    this.includes = [];

    // include all text nodes
    let filter_text = new DomNodeFilter();
    filter_text.properties = [new NameValuePair('nodeType', Node.TEXT_NODE)];
    this.includes.push(filter_text);

    this.excludes = [];
    // exclude all element nodes
    let filter_elem_all = new DomNodeFilter();
    filter_elem_all.properties = [new NameValuePair('nodeType', Node.ELEMENT_NODE), new NameValuePair('nodeName', '*')];
    this.excludes.push(filter_elem_all);
  }

  includeDefaultElements() {
    // include all input element
    let filter_elem_input = new DomNodeFilter();
    filter_elem_input.properties = [
      new NameValuePair('nodeType', Node.ELEMENT_NODE),
      new NameValuePair('nodeName', 'INPUT'),
    ];
    this.includes.push(filter_elem_input);
    // include textarea element
    let filter_elem_textarea = new DomNodeFilter();
    filter_elem_textarea.properties = [
      new NameValuePair('nodeType', Node.ELEMENT_NODE),
      new NameValuePair('nodeName', 'TEXTAREA'),
    ];
    this.includes.push(filter_elem_textarea);
    // include select element
    let filter_elem_select = new DomNodeFilter();
    filter_elem_select.properties = [
      new NameValuePair('nodeType', Node.ELEMENT_NODE),
      new NameValuePair('nodeName', 'SELECT'),
    ];
    this.includes.push(filter_elem_select);
  }
}
class TextItem {
  /**
   * text
   * @type {string}
   */
  text;
  /**
   * rectangles
   * @type {Array}
   */
  rects;
  /**
   * the direction of the text: horizontal-lr (horizontal-tb + ltr), horizontal-rl (horizontal-tb + rtl), vertical-lr, vertical-rl
   * @type {string}
   */
  direction;
  /**
   * confidence
   * @type {number}
   */
  confidence;
  /**
   * text type:
   *  textNode: range, line, word, char
   *  elementNode: nodeValue, textContent, value, title, placeholder
   * @type {string}
   */
  type;
  /**
   * child items
   * @type {TextItem[]}
   */
  childItems;

  constructor() {
    this.text = undefined;
    this.rects = [];
    this.confidence = 100.0;

    this.type = undefined;
    this.direction = undefined;
    this.childItems = [];
  }
}
class NodeTextItem {
  /**
   * the dom node
   */
  node;
  /**
   * text
   * @type {TextItem}
   */
  text;

  constructor(node) {
    this.node = node;
  }
}

class TextHelper {
  constructor() {}

  /**
   * get the text items on top of the given node
   * @param {Node} node
   * @param {TextFilter} filter
   * @returns {NodeTextItem[]}
   */
  getNodeTextItems(node, filter) {
    let result = [];
    node = node || document.body;

    // check if the element node is visible based on css
    // so that we can return asap to prune the text processing
    if (node.nodeType === Node.ELEMENT_NODE && !this._isVisibleBasedOnCSS(node)) {
      return result;
    }

    // try to get text items from childNodes or shadowRoot.childNodes
    if (node.childNodes && node.childNodes.length > 0) {
      node.childNodes.forEach(childNode => {
        let childNodeTextItems = this.getNodeTextItems(childNode, filter);
        if (childNodeTextItems && childNodeTextItems.length > 0) {
          result = result.concat(childNodeTextItems);
        }
      }, this);
    }
    if (
      typeof ShadowRoot !== 'undefined' &&
      node.shadowRoot instanceof ShadowRoot &&
      node.shadowRoot &&
      node.shadowRoot.mode === 'open' &&
      node.shadowRoot.childNodes &&
      node.shadowRoot.childNodes.length > 0
    ) {
      node.shadowRoot.childNodes.forEach(childNode => {
        let childNodeTextItems = this.getNodeTextItems(childNode, filter);
        if (childNodeTextItems && childNodeTextItems.length > 0) {
          result = result.concat(childNodeTextItems);
        }
      }, this);
    }
    if (result.length > 0) {
      return result;
    }

    // continue process the current node if the node is included or not excluded by filter
    if (filter) {
      // check if the node is included
      let included = undefined;
      if (Array.isArray(filter.includes) && filter.includes.length > 0) {
        included = filter.includes.some(nodeFilter => {
          return this._matchDomNodeFilter(node, nodeFilter);
        });
      }
      // check if the node is excluded when it is not included
      let excluded = undefined;
      if (included !== true && Array.isArray(filter.excludes) && filter.excludes.length > 0) {
        excluded = filter.excludes.some(nodeFilter => {
          return this._matchDomNodeFilter(node, nodeFilter);
        });
      }
      if (included !== true && excluded === true) {
        return result;
      }
    }

    // get TextItem for TEXT_NODE
    if (node.nodeType === Node.TEXT_NODE) {
      let item = this.getNodeTextItemForTextNode(node, filter.mode);
      if (item) {
        result.push(item);
      }
      return result;
    }

    // get TextItem for ELEMENT_NODE
    if (node.nodeType === Node.ELEMENT_NODE) {
      let item = this.getNodeTextItemForElementNode(node, filter.mode);
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
   * @param {string} mode - the text mode: fast | best | all
   * @returns {NodeTextItem|null}
   */
  getNodeTextItemForTextNode(node, mode) {
    if (!node) {
      return null;
    }
    mode = mode || 'fast';

    let range = document.createRange();
    range.selectNodeContents(node);
    let text = range.toString();
    // filter the blank text
    if (this._isTrimNoise(text)) {
      return null;
    }
    // filter the invisible text
    let textRect = range.getBoundingClientRect();
    if (!this._isRectangleVisible(textRect)) {
      return null;
    }
    let rects = range.getClientRects();
    if (!(rects && rects.length > 0)) {
      return null;
    }
    let elem = this._getElementByNode(node);
    if (!elem) {
      return null;
    }
    let style = getComputedStyle(elem);
    if (!style) {
      return null;
    }
    let direction = 'horizontal-lr';
    if (style.writingMode === 'vertical-rl' || style.writingMode === 'vertical-lr') {
      direction = style.writingMode;
    } else if (style.writingMode === 'horizontal-tb') {
      if (style.direction === 'ltr') {
        direction = 'horizontal-lr';
      } else if (style.direction === 'rtl') {
        direction = 'horizontal-rl';
      }
    }
    let item = new NodeTextItem();
    item.node = node;
    // range level text
    let rangeTextItem = new TextItem();
    rangeTextItem.text = text;
    rangeTextItem.rects = [textRect];
    rangeTextItem.direction = direction;
    rangeTextItem.type = 'range';
    // range > lines > words > chars
    item.text = rangeTextItem;

    let charIndex = 0;
    for (let rect of rects) {
      // skip the invisible rect (some text will be placed in the invisible areas/outside the visible viewport)
      if (!this._isRectangleVisible(rect)) {
        continue;
      }

      let chars = [];
      let words = [];
      for (; charIndex < text.length; charIndex++) {
        range.setStart(node, charIndex);
        range.setEnd(node, charIndex + 1);
        let charRect = range.getBoundingClientRect();
        let charValue = text[charIndex]; //range.toString();
        let isSameLine = true;
        if (direction === 'vertical-rl' || direction === 'vertical-lr') {
          isSameLine = Math.abs(charRect.left - rect.left) < 1;
        } else {
          isSameLine = Math.abs(charRect.top - rect.top) < 1;
        }
        if (isSameLine) {
          if (charValue === ' ') {
            if (chars.length > 0) {
              let wordTextItem = this._tryGetOuterTextItem(chars, 'word');
              if (wordTextItem && mode === 'fast' && !this._isVisibleOnViewPort(node, wordTextItem.rects[0])) {
                wordTextItem = null;
              }
              if (wordTextItem) {
                words.push(wordTextItem);
              }
            }
            chars = [];
          } else {
            let charTextItem = new TextItem();
            charTextItem.text = charValue;
            charTextItem.rects = [charRect];
            charTextItem.direction = direction;
            charTextItem.type = 'char';
            if (mode === 'best' && !this._isVisibleOnViewPort(node, charTextItem.rects[0])) {
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
      if (chars.length > 0) {
        let wordTextItem = this._tryGetOuterTextItem(chars, 'word');
        if (wordTextItem && mode === 'fast' && !this._isVisibleOnViewPort(node, wordTextItem.rects[0])) {
          wordTextItem = null;
        }
        if (wordTextItem) {
          words.push(wordTextItem);
        }
      }

      if (words.length > 0) {
        let lineTextItem = this._tryGetOuterTextItem(words, 'line');
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
   * @param {string} mode - the text mode: fast | best | all
   * @returns {NodeTextItem|null}
   */
  getNodeTextItemForElementNode(node, mode) {
    if (!node) {
      return null;
    }
    let elem = node;
    if (node.nodeType === Node.TEXT_NODE) {
      // item.text = node.textContent
      elem = this._getElementByNode(node);
      // console.warn('getNodeTextItemForElementNode:: unexpected text node: ', elem, node);
    }

    let item = new NodeTextItem();
    item.node = node;

    if (elem.nodeType === Node.ELEMENT_NODE) {
      let elemTextItem = new TextItem();
      elemTextItem.text = elem.value;
      elemTextItem.type = 'value';
      if (this._isTrimNoise(elemTextItem.text)) {
        elemTextItem.text = elem.textContent;
        elemTextItem.type = 'textContent';
      }
      if (this._isTrimNoise(elemTextItem.text)) {
        elemTextItem.text = elem.innerText;
        elemTextItem.type = 'innerText';
      }
      if (this._isTrimNoise(elemTextItem.text) && elem.hasAttribute('placeholder')) {
        elemTextItem.text = elem.getAttribute('placeholder');
        elemTextItem.type = 'placeholder';
      }
      if (this._isTrimNoise(elemTextItem.text)) {
        return null;
      }
      let elemRect = elem.getBoundingClientRect();
      if (!this._isRectangleVisible(elemRect)) {
        return null;
      }
      if (mode !== 'all' && !this._isVisibleOnViewPort(elem, elemRect)) {
        return null;
      }
      elemTextItem.rects = [elemRect];

      let direction = 'horizontal-lr';
      let style = getComputedStyle(elem);
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

      item.text = elemTextItem;
    }

    return item;
  }

  /**
   * get the outer textItem as the given type
   * @param {TextItem[]} textItems
   * @param {string} type
   * @returns {TextItem|null}
   */
  _tryGetOuterTextItem(textItems, type) {
    if (!(Array.isArray(textItems) && textItems.length > 0)) {
      return null;
    }
    let separator = '';
    if (type === 'line') {
      separator = ' ';
    }

    let item = new TextItem();
    item.text = textItems.reduce((pre, cur) => pre + separator + cur.text, '');
    if (this._isTrimNoise(item.text)) {
      return null;
    }
    let rect = {};
    rect.left = textItems.reduce(
      (pre, cur) => (pre.rects[0].left > cur.rects[0].left ? cur : pre),
      textItems[0]
    ).rects[0].left;
    rect.top = textItems.reduce(
      (pre, cur) => (pre.rects[0].top > cur.rects[0].top ? cur : pre),
      textItems[0]
    ).rects[0].top;
    rect.right = textItems.reduce(
      (pre, cur) => (pre.rects[0].right < cur.rects[0].right ? cur : pre),
      textItems[0]
    ).rects[0].right;
    rect.bottom = textItems.reduce(
      (pre, cur) => (pre.rects[0].bottom < cur.rects[0].bottom ? cur : pre),
      textItems[0]
    ).rects[0].bottom;
    rect.width = rect.right - rect.left;
    rect.height = rect.bottom - rect.top;
    rect.x = rect.left;
    rect.y = rect.top;
    if (!this._isRectangleVisible(rect)) {
      return null;
    }
    item.rects = [rect];

    item.type = type;
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
  _matchDomNodeFilter(node, filter) {
    if (!node) {
      return false;
    }
    if (!filter) {
      return true;
    }
    let matched = undefined;
    // check if all the properties are matched
    if (Array.isArray(filter.properties) && filter.properties.length > 0) {
      filter.properties.forEach(nameValuePair => {
        let valueMatched = nameValuePair.value === '*' || node[nameValuePair.name] === nameValuePair.value;
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
    if (Array.isArray(filter.attributes) && filter.attributes.length > 0) {
      filter.attributes.forEach(nameValuePair => {
        let valueMatched = false;
        if (this._isNullOrUndefined(nameValuePair.value) || nameValuePair.value === '*') {
          valueMatched = node.hasAttribute(nameValuePair.name);
        } else if (!this._isNullOrUndefined(nameValuePair.value)) {
          valueMatched = node.getAttribute(nameValuePair.name) === nameValuePair.value;
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

  /**
   * get the element by the given node
   * @param {Node} node
   * @returns {Element|null}
   */
  _getElementByNode(node) {
    let elem = node;
    while (elem.nodeType !== Node.ELEMENT_NODE && elem.parentElement) {
      elem = elem.parentElement;
    }
    if (elem.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }
    return elem;
  }

  /**
   * get the document of the given node
   * @param {Node} node
   * @returns {Document|DocumentFragment|null}
   */
  _getDocumentObjectByNode(node) {
    while (node.nodeType !== Node.DOCUMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE && node.parentNode) {
      node = node.parentNode;
    }
    if (node.nodeType !== Node.DOCUMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      return null;
    }
    return node;
  }

  /**
   * check if the node is visible according to the css
   * @param {Node} node
   * @returns {boolean}
   */
  _isVisibleBasedOnCSS(node) {
    if (!node) {
      return false;
    }
    let elem = this._getElementByNode(node);
    if (!elem || elem.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }
    if (typeof getComputedStyle === 'undefined') {
      // console.error('getBoundingClientRect is not available', elem, node);
      return false;
    }
    let style = getComputedStyle(elem, null);
    if (!style) {
      return false;
    }
    // these styles will cause the element and the following childNodes invisible
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === 0) {
      return false;
    }
    if (style.display === 'contents') {
      return true;
    }
    if (!elem.getBoundingClientRect) {
      // console.error('elem.getBoundingClientRect is not available', elem, node);
      return false;
    }
    let rect = elem.getBoundingClientRect();

    if (!this._isRectangleVisible(rect) && style.overflow !== 'visible') {
      return false;
    }

    if (style.position === 'absolute' || style.position === 'fixed') {
      rect = null;
      let clip = style.clip;
      if (clip && clip !== 'auto' && clip !== 'inherit') {
        let match = clip.match(/rect\(([^)]+)\)/);
        if (match) {
          let values = match[1].split(',').map(value => parseInt(value.trim(), 10));
          if (values.length === 4) {
            rect = {
              top: values[0],
              right: values[1],
              bottom: values[2],
              left: values[3],
            };
            rect.height = rect.bottom - rect.top;
            rect.width = rect.right - rect.left;
          }
        }
      }
      if (rect && !this._isRectangleVisible(rect)) {
        return false;
      }
      rect = null;
      // Check for 'clip-path' property (inset format)
      let clipPath = style.clipPath;
      if (clipPath && clipPath.startsWith('inset')) {
        let match = clipPath.match(/inset\(([^)]+)\)/);
        if (match) {
          let values = match[1].split(' ').map(value => parseInt(value.trim(), 10));
          if (values.length === 4) {
            rect = {
              top: values[0],
              right: values[1],
              bottom: values[2],
              left: values[3],
            };
            rect.height = rect.bottom - rect.top;
            rect.width = rect.right - rect.left;
          }
        }
      }
      if (rect && !this._isRectangleVisible(rect)) {
        return false;
      }
    }
    return true;
  }

  /**
   * check if the rectangle area of the node is visible on the current viewport
   * @param {Node} node
   * @param {object} rect
   * @returns {boolean}
   */
  _isVisibleOnViewPort(node, rect) {
    let center_x = (rect.right + rect.left) / 2;
    let center_y = (rect.bottom + rect.top) / 2;
    if (center_x < 0 || center_y < 0) {
      return false;
    }
    let elem = this._getElementByNode(node);
    let doc = this._getDocumentObjectByNode(node);
    let pointedElem = doc.elementFromPoint(center_x, center_y);
    if (pointedElem && elem === pointedElem) {
      return true;
    }
    // specific fix for some DOM nodes
    if (pointedElem && elem !== pointedElem) {
      let style = getComputedStyle(elem);
      if (style && style.pointerEvents === 'none') {
        return true;
      }
    }
    // if (pointedElem && elem !== pointedElem && pointedElem.compareDocumentPosition) {
    //     let result = pointedElem.compareDocumentPosition(node);
    //     if ((result & Node.DOCUMENT_POSITION_CONTAINS) || (result & Node.DOCUMENT_POSITION_CONTAINED_BY)) {
    //         return true;
    //     } else {
    //         console.log('invisible', pointedElem, elem, result);
    //         return false;
    //     }
    // }
    return false;
  }

  /**
   * check if the rectangle is visible
   * @param {object} rect
   * @returns {boolean}
   */
  _isRectangleVisible(rect) {
    rect = this._fixRectangle(rect);
    if (!rect) {
      return false;
    }
    if (rect.width <= 1 || rect.height <= 1) {
      return false;
    }
    if (rect.right <= 1 && rect.bottom <= 1) {
      return false;
    }
    return true;
  }

  /**
   * fix the rectangle object (fullfill the width, height, right, bottom)
   * @param {object} rect
   * @returns {object}
   */
  _fixRectangle(rect) {
    if (!rect) {
      return rect;
    }
    // x + y = z
    let solveEquation = function (x, y, z) {
      if (this._isNullOrUndefined(z)) {
        return [x, y, x + y];
      }
      if (this._isNullOrUndefined(x)) {
        return [z - y, y, z];
      }
      if (this._isNullOrUndefined(y)) {
        return [x, z - x, z];
      }
      return [x, y, z];
    }.bind(this);
    let arr = solveEquation(rect.left, rect.width, rect.right);
    let result = {};
    result.left = arr[0];
    result.width = arr[1];
    result.right = arr[2];
    arr = solveEquation(rect.top, rect.height, rect.bottom);
    result.top = arr[0];
    result.height = arr[1];
    result.bottom = arr[2];
    result.x = result.left;
    result.y = result.top;
    return result;
  }

  /**
   * check if the text is noise after trimmed
   * @param {string} text
   * @returns {boolean}
   */
  _isTrimNoise(text) {
    if (typeof text !== 'string') {
      return true;
    }
    text = text.replace(/\n|\r/gm, '');
    text = text.replace(/\t/g, ' ');
    text = text.replace(/\xa0/g, ' '); // replace '&nbsp;' with ' '
    text = text.replace(/ +/g, ' ');
    if (text.trim() === '') {
      return true;
    }
    return false;
  }

  /**
   * check if the given x is undefined
   * @param {any} x
   * @returns {boolean}
   */
  _isUndefined(x) {
    return typeof x === 'undefined';
  }

  /**
   * check if the given x is undefined or null
   * @param {any} x
   * @returns {boolean}
   */
  _isNullOrUndefined(x) {
    return this._isUndefined(x) || x === null;
  }

  _getAllTextNodes(node) {
    let textNodes = [];
    node = node || document.body;

    function recurse(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
          // textNodes.push(node);
        }
        if (node.shadowRoot && node.shadowRoot.childNodes && node.shadowRoot.childNodes.length > 0) {
          node.shadowRoot.childNodes.forEach(node => {
            recurse(node);
          });
        }
        if (node.childNodes && node.childNodes.length > 0) {
          node.childNodes.forEach(node => {
            recurse(node);
          });
        }
      }
    }
    // let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    recurse(node);
    return textNodes;
  }
}

class HighlightItem {
  /**
   * the related node
   * @type {Node}
   */
  node;
  /**
   * the highlight rectangle
   * @type {object}
   */
  rect;
  /**
   * the text for tooltip/notes
   * @type {string}
   */
  text;

  constructor() {
    this.node = undefined;
    this.rect = undefined;
    this.text = undefined;
  }
}
