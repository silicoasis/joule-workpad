/**
 * <joule-header> — Joule panel header component
 * Figma: node 3012:78213
 *
 * Attributes:
 *   title  {string}  Panel title text (default: "")
 *
 * Dispatched events:
 *   joule-menu       — hamburger button clicked
 *   joule-fullscreen — fullscreen button clicked
 *   joule-close      — close button clicked
 *
 * Icons: SAP icons from @ui5/webcomponents-icons v5 (Horizon theme)
 *   sap-icon://menu2, sap-icon://full-screen, sap-icon://decline
 *   Inlined as SVG so fill="currentColor" inherits the CSS color.
 *
 * Styles: /library/joule/component-styles.css
 */

/* SAP icon path data — @ui5/webcomponents-icons v5 / Horizon theme */
const SAP_ICONS = {
  menu2: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M486 115H26q-11 0-18.5-7T0 90t7.5-18.5T26 64h460q11 0 18.5 7.5T512 90t-7.5 18-18.5 7zm0 167H26q-11 0-18.5-7.5T0 256t7.5-18.5T26 230h460q11 0 18.5 7.5T512 256t-7.5 18.5T486 282zm0 166H26q-11 0-18.5-7.5T0 422t7.5-18 18.5-7h460q11 0 18.5 7t7.5 18-7.5 18.5T486 448z"/>
  </svg>`,

  fullscreen: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M486 0q11 0 18.5 7.5T512 26v108q0 11-7.5 18.5T486 160t-18-7.5-7-18.5V87l-97 97q-8 8-18 8-11 0-18.5-7.5T320 166q0-10 8-18l97-97h-47q-11 0-18.5-7T352 26t7.5-18.5T378 0h108zM230 32q11 0 18.5 7.5T256 58t-7.5 18-18.5 7H90q-7 0-7 7v140q0 11-7 18.5T58 256t-18.5-7.5T32 230V90q0-24 17-41t41-17h140zm224 224q11 0 18.5 7.5T480 282v140q0 24-17 41t-41 17H282q-11 0-18.5-7.5T256 454t7.5-18 18.5-7h140q7 0 7-7V282q0-11 7-18.5t18-7.5zm-306 71q7-7 18-7t18.5 7.5T192 346t-7 18l-98 97h47q11 0 18.5 7t7.5 18-7.5 18.5T134 512H26q-11 0-18.5-7.5T0 486V378q0-11 7.5-18.5T26 352t18 7.5 7 18.5v47z"/>
  </svg>`,

  decline: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M292 256l117 116q7 7 7 18 0 12-7.5 19t-18.5 7q-10 0-18-8L256 292 140 408q-8 8-18 8-11 0-18.5-7.5T96 390q0-10 8-18l116-116-116-116q-8-8-8-18 0-11 7.5-18.5T122 96t18 7l116 117 116-117q7-7 18-7t18.5 7.5T416 122t-7 18z"/>
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

      <div class="header">

        <!-- Caption — 3012:78214 -->
        <div class="caption">

          <!-- nav-button (sap-icon://menu2) — 3012:78215 -->
          <button class="icon-btn" data-action="menu" title="Menu" aria-label="Menu">
            <span class="sap-icon">${SAP_ICONS.menu2}</span>
          </button>

          <!-- title — 3012:78216 -->
          <p class="title">${this._esc(title)}</p>

        </div>

        <!-- Actions — 3012:78217 -->
        <div class="actions">

          <!-- fullscreen (sap-icon://full-screen) — 3012:78218 -->
          <button class="icon-btn" data-action="fullscreen" title="Full screen" aria-label="Full screen">
            <span class="sap-icon">${SAP_ICONS.fullscreen}</span>
          </button>

          <!-- close (sap-icon://decline) — 3012:78219 -->
          <button class="icon-btn" data-action="close" title="Close" aria-label="Close">
            <span class="sap-icon">${SAP_ICONS.decline}</span>
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

  /** Escape HTML special characters to prevent XSS in attribute values */
  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

customElements.define('joule-header', JouleHeader);