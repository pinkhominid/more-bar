/**
 * MoreBar
 * Add responsive behavior to web toolbars
 * pinkhominid <pinkhominid@birdbomb>
 * MIT Licensed
 */
export class MoreBar {
  constructor(barEl, moreEl, isJustifyEnd = false) {
    if (!barEl || !moreEl) throw new Error('MoreBar: two arguments required!');

    this.barEl = barEl;
    this.moreEl = moreEl;
    this.isJustifyEnd = isJustifyEnd;
    this.__onIntersection = this.__onIntersection.bind(this);
  }

  // If items are added/removed, consumer should call init() again
  // TODO: consider automating with mutationObserver
  init() {
    this.destroy();

    const barEl = this.barEl;
    const moreEl = this.moreEl;
    const isJustifyEnd = this.isJustifyEnd;

    // side effects
    barEl.style.display = 'flex'; // IMPORTANT: apply flex before getting moreEl width
    moreEl.style.position = 'static';
    const moreElWidthPlusMargins = getWidthPlusMargins(moreEl);
    this.__hideEl(moreEl);
    this.barEl.style.minWidth = moreElWidthPlusMargins + 'px';

    // move moreEl to proper child position
    // const barItems = this.barItems;
    // const lastBarItem = barItems[barItems.length - 1];
    // if (lastBarItem[`${isJustifyEnd ? 'previous' : 'next'}ElementSibling`] !== moreEl) {
    //   lastBarItem.insertAdjacentElement(isJustifyEnd ? 'beforebegin' : 'afterend', moreEl);
    // }

    // options
    const itemObserverOpts = {
      root: barEl,
      threshold: .99, // cant't use 1, chrome computation is off a hair
      // setup margin placeholder for more item
      rootMargin: isJustifyEnd
        ? `0px 0px 0px ${-moreElWidthPlusMargins}px`
        : `0px ${-moreElWidthPlusMargins}px 0px 0px`,
    };
    const lastItemObserverOpts = {
      ...itemObserverOpts,
      rootMargin: '0px'
    };

    // setup
    this.__itemObserver = new IntersectionObserver(this.__onIntersection, itemObserverOpts);
    this.__lastItemObserver = new IntersectionObserver(this.__onIntersection, lastItemObserverOpts);
    this.__observe();
  }

  destroy() {
    this.__unobserve();
    // TODO: revert side effects
  }

  get barItems() {
    let barChildArry;
    if (this.barEl.matches('slot')) {
      barChildArry = this.barEl.assignedElements();
    } else {
      barChildArry = Array.from(this.barEl.children);
    }

    const items = barChildArry.reduce((items, child) => {
      if (child.matches('slot')) { // use slotted elements
        items = items.concat(child.assignedElements());
      } else if (child !== this.moreEl) { // otherwise use element (except more)
        items.push(child);
      }
      return items;
    }, []);

    return this.isJustifyEnd ? items.reverse() : items;
  }

  get __firstHiddenItem() {
    for (const item of this.barItems) {
      if (this.__isHidden(item)) return item;
    }
    return undefined;
  }

  __observe() {
    const barItems = this.barItems;

    for (const item of barItems) {
      if (item !== barItems[barItems.length - 1]) { // not last item
        this.__itemObserver.observe(item);
      } else {
        this.__lastItemObserver.observe(item);
      }
    }
  }

  __unobserve() {
    this.__itemObserver?.disconnect();
    this.__lastItemObserver?.disconnect();
  }

  __isHidden(el) {
    return el?.style.visibility === 'hidden'
  }

  __hideEl(el) {
    el.style.visibility = 'hidden';
  }

  __showEl(el) {
    el.style.visibility = 'visible';
  }

  __positionMoreItem() {
    this.__hideEl(this.moreEl);
    this.moreEl.style.transform = '';

    const firstHiddenItem = this.__firstHiddenItem;

    if (firstHiddenItem) {
      this.moreEl.style.transform = `
        translateX(${
          firstHiddenItem.getBoundingClientRect().left - this.moreEl.getBoundingClientRect().left
        }px)
      `;
      this.__showEl(this.moreEl);

      this.barEl.dispatchEvent(new CustomEvent(
        'morebar-moreitem-show',
        {
          bubbles: true,
          detail: {
            item: this.moreEl,
            type: 'show',
            transform: this.moreEl.style.transform,
            moreBar: this,
          }
        }
      ));
    }
  }

  __onIntersection(entries) {
    for (const entry of entries) {
      let isShow;
      if (entry.isIntersecting) {
        this.__showEl(entry.target);
        isShow = true;
      } else {
        this.__hideEl(entry.target);
        isShow = false;
      }

      this.barEl.dispatchEvent(new CustomEvent(
        'morebar-item-update',
        {
          bubbles: true,
          detail: {
            item: entry.target,
            type: isShow ? 'show' : 'hide',
            index: this.barItems.indexOf(entry.target),
            moreBar: this,
          }
        }
      ));
    }

    this.__positionMoreItem();
  }
}

function getMargins(el) {
  const style = getComputedStyle(el);
  return {
    top: parseInt(style.marginTop, 10),
    right: parseInt(style.marginRight, 10),
    bottom: parseInt(style.marginBottom, 10),
    left: parseInt(style.marginLeft, 10)
  };
}

function getWidthPlusMargins(el) {
  const margins = getMargins(el);
  return el.offsetWidth + margins.left + margins.right;
}
