/**
 * <joule-header> — Joule panel header component
 * Figma: node 3029:963351  "Pane Bar"
 *
 * Attributes:
 *   title  {string}  Panel title text (default: "")
 *
 * Dispatched events (bubble + composed):
 *   joule-overflow  — more-options button clicked
 *   joule-share     — share button clicked
 *
 * Icons: SAP Horizon assets from Figma node 3029:963351
 *   (1) sap-icon://add-coursebook  → 4b17463c...svg  (overflow / more)
 *   (2) sap-icon://share-2         → 8b7f254d...svg  (share)
 *
 * Styles: /library/joule/component-styles.css
 */

/* Inline SVG icon data — avoids img-sizing issues with viewBox-only SVGs
   that use width="100%"/height="100%" and preserveAspectRatio="none" */
const HEADER_ICONS = {

  /* sap-icon://add-coursebook — overflow / three dots   viewBox 0 0 16 4
     fill: #5d36ff  (Joule brand purple — CSS var --fill-0 in Figma) */
  overflow: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 4" width="16" height="4" fill="none">
    <path d="M2 0C3.10457 0 4 0.89543 4 2C4 3.10457 3.10457 4 2 4C0.89543 4 0 3.10457 0 2C0 0.89543 0.89543 0 2 0ZM8 0C9.10457 0 10 0.89543 10 2C10 3.10457 9.10457 4 8 4C6.89543 4 6 3.10457 6 2C6 0.89543 6.89543 0 8 0ZM14 0C15.1046 0 16 0.89543 16 2C16 3.10457 15.1046 4 14 4C12.8954 4 12 3.10457 12 2C12 0.89543 12.8954 0 14 0Z" fill="#5d36ff"/>
  </svg>`,

  /* sap-icon://share-2 — share   viewBox 0 0 16 16
     fill: #5d36ff  (Joule brand purple — CSS var --fill-0 in Figma) */
  share: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="none">
    <path d="M13 0C14.6569 0 16 1.34315 16 3C16 4.65685 14.6569 6 13 6C11.9739 6 11.0693 5.48404 10.5283 4.69824L5.84082 7.04199C6.04372 7.64389 6.0625 8.31641 5.84082 8.95703L10.5283 11.3008C11.0693 10.5154 11.9742 10 13 10C14.6569 10 16 11.3431 16 13C16 14.6569 14.6569 16 13 16C11.3431 16 10 14.6569 10 13C10 12.9055 10.0041 12.812 10.0127 12.7197L5.0127 10.2197C4.48016 10.7029 3.77569 11 3 11C1.34315 11 0 9.65685 0 8C0 6.34315 1.34315 5 3 5C3.77546 5 4.48022 5.2964 5.0127 5.7793L10.0127 3.2793C10.0042 3.18734 10 3.09417 10 3C10 1.34315 11.3431 0 13 0ZM13 11.5C12.1716 11.5 11.5 12.1716 11.5 13C11.5 13.8284 12.1716 14.5 13 14.5C13.8284 14.5 14.5 13.8284 14.5 13C14.5 12.1716 13.8284 11.5 13 11.5ZM3 6.5C2.17157 6.5 1.5 7.17157 1.5 8C1.5 8.82843 2.17157 9.5 3 9.5C3.82843 9.5 4.5 8.82843 4.5 8C4.5 7.17157 3.82843 6.5 3 6.5ZM13 1.5C12.1716 1.5 11.5 2.17157 11.5 3C11.5 3.82843 12.1716 4.5 13 4.5C13.8284 4.5 14.5 3.82843 14.5 3C14.5 2.17157 13.8284 1.5 13 1.5Z" fill="#5d36ff"/>
  </svg>`,

};

class JouleHeader extends HTMLElement {
  static get observedAttributes() {
    return ['title'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();
    this._bindEvents();
  }

  attributeChangedCallback() {
    this._render();
    this._bindEvents();
  }

  _render() {
    const title = this.getAttribute('title') ?? '';

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/library/joule/component-styles.css" />

      <!-- Pane Bar — 3029:963351 -->
      <div class="header">

        <!-- Leading Slot — title only -->
        <div class="caption">
          <p class="title">${this._esc(title)}</p>
        </div>

        <!-- Trailing Slot — two circle icon buttons -->
        <div class="actions">

          <!-- (1) sap-icon://add-coursebook — overflow / more options -->
          <button class="icon-btn" data-action="overflow" title="More options" aria-label="More options">
            ${HEADER_ICONS.overflow}
          </button>

          <!-- (2) sap-icon://share-2 — share -->
          <button class="icon-btn" data-action="share" title="Share" aria-label="Share">
            ${HEADER_ICONS.share}
          </button>

        </div>
      </div>
    `;
  }

  _bindEvents() {
    this.shadowRoot.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.dispatchEvent(
          new CustomEvent(`joule-${btn.dataset.action}`, { bubbles: true, composed: true })
        );
      });
    });
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

customElements.define('joule-header', JouleHeader);