import { html, fixture, expect } from '@open-wc/testing';

import { MoreBar } from '../index.js';

function getTmpl() {
  return html`
    <div id=bar>
      <div id=more>More</div>
      <div>Center1</div>
      <div>Center2</div>
      <div>Center3</div>
      <div>Center4</div>
      <div>Center5</div>
      <div>Center6</div>
    </div>
  `;
}

async function setupEl() {
  const el = await fixture(getTmpl());
  const moreBar = new MoreBar(bar, more);
  moreBar.init();
  return el;
}

describe('MoreBar', () => {
  it('makes more element last child', async () => {
    const el = await setupEl();

    expect(el.lastElementChild).to.equal(more);
  });

  it('passes the a11y audit', async () => {
    const el = await setupEl();

    await expect(el).dom.to.be.accessible();
  });
});
