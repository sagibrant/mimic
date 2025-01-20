class HighlightHelper {
  async asyncClear() {
    if (!(Array.isArray(window.debug_rect_elems) && window.debug_rect_elems.length > 0)) {
      return;
    }
    window.debug_rect_elems.forEach(item => {
      document.body.removeChild(item);
    });
    window.debug_rect_elems = [];
  }

  /**
   * draw the rectangle based on the given HighlightItem
   * @param {HighlightItem} textItem
   * @param {number} scrollX
   * @param {number} scrollY
   * @param {number} scrollWidth
   * @param {number} scrollHeight
   */
  Highlight(item, scrollX, scrollY, scrollWidth, scrollHeight) {
    if (scrollX == null) {
      scrollX = window.scrollX; //|| window.pageXOffset || document.documentElement.scrollLeft;
    }
    if (scrollY == null) {
      scrollY = window.scrollY; //|| window.pageYOffset || document.documentElement.scrollTop;
    }
    if (scrollWidth == null) {
      scrollWidth = document.documentElement.scrollWidth;
    }
    if (scrollHeight == null) {
      scrollHeight = document.documentElement.scrollHeight;
    }
    let rect = this._adjustRectangle(item.rect, scrollX, scrollY, scrollWidth, scrollHeight);
    if (rect.width < 0 || rect.height < 0) {
      // console.error('skip draw rect, because the rect exceeded the scroll section:', textItem, node, scrollX, scrollY, scrollWidth, scrollHeight);
      return;
    }
    this._drawRect(item, rect);
  }

  _drawRect(item, rect) {
    let rect_elem = document.createElement('canvas');
    rect_elem.style.backgroundColor = 'rgba(18, 110, 198, 0.4)';
    rect_elem.style.border = '1px solid rgba(18, 110, 198, 0)';
    rect_elem.style.borderRadius = 0;
    rect_elem.style.left = rect.left + 'px';
    rect_elem.style.top = rect.top + 'px';
    rect_elem.style.width = rect.width + 'px';
    rect_elem.style.height = rect.height + 'px';
    rect_elem.style.margin = '0px';
    rect_elem.style.padding = '0px';
    rect_elem.style.position = 'absolute';
    rect_elem.style.zIndex = '999';
    rect_elem.dir = 'ltr';

    if (item.text) {
      rect_elem.setAttribute('tooltip', item.text);
      this._addTooltip(rect_elem, item.text);
      rect_elem.addEventListener('click', ev => {
        this._displayHighlightInfo(item);
      });
    }
    document.body.appendChild(rect_elem);

    // let updateRectangle = () => {
    //     let rect = this._adjustRectangle(item.rect, window.scrollX, window.scrollY, document.documentElement.scrollWidth, document.documentElement.scrollHeight);
    //     rect_elem.style.left = `${rect.left}px`;
    //     rect_elem.style.top = `${rect.top}px`;
    //     rect_elem.style.width = `${rect.width}px`;
    //     rect_elem.style.height = `${rect.height}px`;
    // };

    // Recalculate the position when scrolling or resizing the window
    //window.addEventListener('scroll', updateRectangle);
    //window.addEventListener('resize', updateRectangle);

    window.debug_rect_elems = window.debug_rect_elems || [];
    window.debug_rect_elems.push(rect_elem);
  }

  _addTooltip(element, tooltipText) {
    // Create the tooltip element
    const tooltip = document.createElement('span');
    tooltip.textContent = tooltipText;

    // Set the tooltip's inline styles
    tooltip.style.visibility = 'hidden';
    tooltip.style.backgroundColor = 'black';
    tooltip.style.color = '#fff';
    tooltip.style.textAlign = 'center';
    tooltip.style.borderRadius = '5px';
    tooltip.style.padding = '8px';
    tooltip.style.position = 'absolute';
    tooltip.style.zIndex = '1';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.3s';
    tooltip.style.whiteSpace = 'normal'; // Prevent text from overflowing

    // Append the tooltip to the document body
    document.body.appendChild(tooltip);

    // Show the tooltip on hover
    element.addEventListener('mouseover', () => {
      // Get the element's position relative to the viewport
      const rect = element.getBoundingClientRect();

      // Adjust position based on scroll offsets
      const offsetX = window.scrollX;
      const offsetY = window.scrollY;

      // Make the tooltip visible and adjust its position
      tooltip.style.visibility = 'visible';
      tooltip.style.opacity = '1';

      // Position the tooltip above the element
      tooltip.style.top = `${rect.top + offsetY - tooltip.offsetHeight - 5}px`; // 5px offset from the element
      tooltip.style.left = `${rect.left + offsetX + rect.width / 2 - tooltip.offsetWidth / 2}px`; // Center horizontally

      // Ensure the tooltip stays within the viewport horizontally
      const tooltipRect = tooltip.getBoundingClientRect();
      const tooltipRight = tooltipRect.right;

      if (tooltipRight > window.innerWidth) {
        tooltip.style.left = `${window.innerWidth - tooltip.offsetWidth - 10}px`; // Move it to the right edge
      } else if (tooltip.getBoundingClientRect().left < 0) {
        tooltip.style.left = '10px'; // Prevent it from going outside the left side
      }
    });

    // Hide the tooltip when mouse leaves
    element.addEventListener('mouseout', () => {
      tooltip.style.visibility = 'hidden';
      tooltip.style.opacity = '0';
    });
  }

  /**
   * adjust the rectangle
   * @param {object} rect
   * @param {number} scrollX
   * @param {number} scrollY
   * @param {number} scrollWidth
   * @param {number} scrollHeight
   * @returns
   */
  _adjustRectangle(rect, scrollX, scrollY, scrollWidth, scrollHeight) {
    let adjustedRect = {};
    adjustedRect.left = scrollX + rect.left - 1;
    adjustedRect.top = scrollY + rect.top - 1;
    adjustedRect.right = adjustedRect.left + rect.width + 1;
    if (adjustedRect.right > scrollWidth) {
      // console.error('debug right scrollX, scrollY, scrollWidth, scrollHeight', scrollX, scrollY, scrollWidth, scrollHeight);
      // console.error('debug right:', adjustedRect.right, scrollWidth);
      adjustedRect.right = scrollWidth - 2;
      adjustedRect.width = adjustedRect.right - adjustedRect.left;
      // console.error('debug right adjustedRect.width = ', adjustedRect.width, adjustedRect, ',rect.width=', rect.width, rect);
    } else {
      adjustedRect.width = adjustedRect.right - adjustedRect.left;
    }
    adjustedRect.bottom = adjustedRect.top + rect.height + 1;
    if (adjustedRect.bottom > scrollHeight) {
      // console.error('debug bottom scrollX, scrollY, scrollWidth, scrollHeight', scrollX, scrollY, scrollWidth, scrollHeight);
      // console.error('debug bottom:', adjustedRect.bottom, scrollHeight);
      adjustedRect.bottom = scrollHeight - 2;
      adjustedRect.height = adjustedRect.bottom - adjustedRect.top;
      // console.error('debug bottom adjustedRect.height = ', adjustedRect.height, adjustedRect, ',rect.height=', rect.height, rect);
    } else {
      adjustedRect.height = adjustedRect.bottom - adjustedRect.top;
    }

    return adjustedRect;
  }

  /**
   * display the highlight information
   * @param {HighlightItem} item
   */
  _displayHighlightInfo(item) {
    let elt = document.getElementById('ft-highlight-info');
    if (elt == null) {
      elt = document.createElement('div');
      elt.id = 'ft-highlight-info';
      elt.style.display = 'none';
      elt.style.position = 'fixed';
      elt.style.backgroundColor = 'cyan';
      elt.style.width = '800px';
      elt.style.maxWidth = '800px';
      elt.style.height = '250px';
      elt.style.maxHeight = '250px';
      elt.style.right = '0px';
      elt.style.top = '0px';
      elt.style.margin = '0px';
      elt.style.padding = '0px';
      elt.style.zIndex = '1000';
      elt.style.overflow = 'scroll';
      elt.style.whiteSpace = 'nowrap';
      elt.addEventListener(
        'click',
        () => {
          if (elt.style.display !== 'none') {
            elt.style.display = 'none';
          }
        },
        true
      );
      document.body.appendChild(elt);
    }
    elt.style.display = 'inline-block';
    elt.innerText =
      'text identification result:' +
      '\r\n node: ' +
      getTagNamePath(item.node) +
      '\r\n text: ' +
      item.text +
      '' +
      '\r\n rect: ' +
      JSON.stringify(item.rect) +
      '\r\n outerHTML: ' +
      item.node.outerHTML;

    function getTagNamePath(node) {
      let tagNames = '';
      if (node.nodeType === Node.TEXT_NODE) {
        tagNames = '#text';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        tagNames = node.tagName + '[' + node.type + ']';
      } else {
        tagNames = 'node(' + node.nodeType + ')';
      }
      node = node.parentNode;
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          tagNames = '#text' + '->' + tagNames;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          tagNames = node.tagName + '->' + tagNames;
        } else {
          tagNames = 'node(' + node.nodeType + ')' + '->' + tagNames;
        }
        node = node.parentNode;
      }
      return tagNames;
    }
  }
}
