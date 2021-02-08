export class MoreBar {
  constructor(barEl, moreEl, isJustifyEnd = false) {
    if (!barEl || !moreEl) throw new Error('MoreBar: two arguments required!');

    this.__barEl = barEl;
    this.__moreEl = moreEl;
    this.__isJustifyEnd = isJustifyEnd;
    this.__onIntersection = this.__onIntersection.bind(this);
  }

  // If items are added/removed, consumer should call init() again
  // TODO: consider automating with mutationObserver
  init() {
    this.destroy();

    const barEl = this.__barEl;
    const moreEl = this.__moreEl;
    const isJustifyEnd = this.__isJustifyEnd;

    // side effects
    barEl.style.display = 'flex'; // IMPORTANT: apply flex before getting moreEl width
    moreEl.style.position = 'relative';
    const moreElWidthPlusMargins = getWidthPlusMargins(moreEl);
    this.__hideEl(moreEl);
    this.__barEl.style.minWidth = moreElWidthPlusMargins + 'px';
    if (isJustifyEnd) {
      barEl.insertBefore(moreEl, barEl.firstChild); // move moreEl to first
    } else {
      barEl.insertBefore(moreEl, null); // move moreEl to last
    }

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

  get __barItems() {
    // except more
    const items = Array.from(this.__barEl.children).filter(item => item !== this.__moreEl);
    return this.__isJustifyEnd ? items.reverse() : items;
  }

  get __firstHiddenItem() {
    for (const item of this.__barItems) {
      if (this.__isHidden(item)) return item;
    }
    return undefined;
  }

  __observe() {
    const barItems = this.__barItems;

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
    this.__hideEl(this.__moreEl);
    this.__moreEl.style.transform = '';

    const firstHiddenItem = this.__firstHiddenItem;

    if (firstHiddenItem) {
      this.__moreEl.style.transform = `
        translateX(${
          firstHiddenItem.getBoundingClientRect().left - this.__moreEl.getBoundingClientRect().left
        }px)
      `;
      this.__showEl(this.__moreEl);
    }
  }

  __onIntersection(entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        this.__showEl(entry.target);
      } else {
        this.__hideEl(entry.target);
      }
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
