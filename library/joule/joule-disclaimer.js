/**
 * <joule-disclaimer> — Joule "AI disclaimer" footer text
 * Figma: node 3013:83799
 *
 * Attributes:
 *   text  {string}  Disclaimer text (default: "Joule uses AI, verify results.")
 *
 * Styles: /library/joule/component-styles.css
 */
class JouleDisclaimer extends HTMLElement {
  static get observedAttributes() {
    return ['text'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();
  }

  attributeChangedCallback() {
    this._render();
  }

  _render() {
    const text = this.getAttribute('text') ?? 'Joule uses AI, verify results.';

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/library/joule/component-styles.css" />

      <div class="disclaimer-inner">
        <p class="disclaimer-text">${this._esc(text)}</p>
      </div>
    `;
  }

  /** Escape HTML special characters */
  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

customElements.define('joule-disclaimer', JouleDisclaimer);