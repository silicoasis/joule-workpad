/**
 * <joule-panel> — Joule root panel container
 * Figma: node 3012:83760
 *
 * Provides the full 416×768 card shell with four named slot regions:
 *
 *   <slot name="header">          → inside .header-container
 *   <slot name="content">         → inside .content  (flex-grow, scrollable)
 *   <slot name="message-input">   → inside .message-input-container
 *   <slot name="disclaimer">      → inside .disclaimer
 *
 * Attributes:
 *   background  {string}  Optional URL to an SVG/image rendered as an absolute
 *                         background layer inside the panel (clipped by border-radius).
 *                         e.g. background="http://localhost:3845/assets/abc123.svg"
 *
 * Styles: /library/joule/component-styles.css
 */
class JoulePanel extends HTMLElement {
  static get observedAttributes() {
    return ['background'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();
    this._observeFooter();
  }

  disconnectedCallback() {
    if (this._ro) { this._ro.disconnect(); this._ro = null; }
  }

  attributeChangedCallback() {
    this._render();
    this._observeFooter();
  }

  /** Watch footer height with ResizeObserver and push the value to the canvas */
  _observeFooter() {
    if (this._ro) this._ro.disconnect();
    const footer = this.shadowRoot?.querySelector('.footer');
    if (!footer) return;

    this._ro = new ResizeObserver((entries) => {
      const h = entries[0].borderBoxSize?.[0]?.blockSize
             ?? entries[0].contentRect.height;
      /* find slotted canvas and update its bottom padding */
      const slot = this.shadowRoot?.querySelector('slot[name="content"]');
      const canvas = slot?.assignedElements({ flatten: true })?.[0];
      if (canvas && typeof canvas.setFooterHeight === 'function') {
        canvas.setFooterHeight(Math.ceil(h));
      }
    });
    this._ro.observe(footer);
  }

  _render() {
    const bg = this.getAttribute('background') ?? '';

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/library/joule/component-styles.css" />

      ${bg ? `
      <!-- decorative background layer (clipped by panel overflow:hidden) -->
      <div class="panel-bg" aria-hidden="true">
        <img alt="" src="${this._esc(bg)}" />
      </div>` : ''}

      <!-- root layout — 3012:83760 -->
      <div class="header-container">
        <slot name="header"></slot>
      </div>

      <div class="content">
        <slot name="content"></slot>
      </div>

      <div class="footer">
        <div class="message-input-container">
          <slot name="message-input"></slot>
        </div>
        <div class="disclaimer">
          <slot name="disclaimer"></slot>
        </div>
      </div>
    `;
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

customElements.define('joule-panel', JoulePanel);