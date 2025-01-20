// load texthelper.js
// load highlighthelper.js
async function asyncCalculateAndDraw(type) {
  let scrollX = window.scrollX; //|| window.pageXOffset || document.documentElement.scrollLeft;
  let scrollY = window.scrollY; //|| window.pageYOffset || document.documentElement.scrollTop;
  let scrollWidth = document.documentElement.scrollWidth;
  let scrollHeight = document.documentElement.scrollHeight;

  let textHelper = new TextHelper();
  console.time('calculate');
  let filter = new TextFilter();
  filter.toDefault();
  filter.includeDefaultElements();
  let nodeTextItems = textHelper.getNodeTextItems(document.body, filter);
  window.debug_text_with_rects = nodeTextItems;
  console.timeEnd('calculate');
  let draw_count = 0;

  let highlightHelper = new HighlightHelper();

  let getAllTextItems = (textItem, type) => {
    if (textItem.type === type) {
      return [textItem];
    }
    let result = [];
    if (Array.isArray(textItem.childItems) && textItem.childItems.length > 0) {
      textItem.childItems.forEach(child => {
        result = result.concat(getAllTextItems(child, type));
      });
    }
    return result;
  };

  console.time('draw');
  nodeTextItems.forEach(nodeTextItem => {
    let drawed = false;
    let textItems = getAllTextItems(nodeTextItem.text, type);
    if (Array.isArray(textItems) && textItems.length > 0) {
      textItems.forEach(textItem => {
        let item = new HighlightItem();
        item.node = nodeTextItem.node;
        item.text = textItem.text;
        item.rect = textItem.rects[0];
        highlightHelper.Highlight(item, scrollX, scrollY, scrollWidth, scrollHeight);
        draw_count++;
      });
    } else if (nodeTextItem.text && nodeTextItem.text.type !== 'range') {
      let item = new HighlightItem();
      item.node = nodeTextItem.node;
      item.text = nodeTextItem.text.text;
      item.rect = nodeTextItem.text.rects[0];
      highlightHelper.Highlight(item, scrollX, scrollY, scrollWidth, scrollHeight);
      draw_count++;
    }
  });
  console.timeEnd('draw');
  console.log(type, 'draw ', draw_count, ' times');
}

function calculateAndDraw(type) {
  asyncCalculateAndDraw(type);
}
