/**
 * <joule-welcome> — Joule welcome / start screen
 * Figma: 3048:1774035  "welcome"
 *
 * Attributes:
 *   (none — content is static per Figma design)
 *
 * Events (bubble + composed):
 *   joule-suggest   detail: { category: string }  — fired when a chip is clicked
 *
 * Styles: /library/joule/component-styles.css
 */
class JouleWelcome extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this._render();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/library/joule/component-styles.css" />

      <div class="welcome">

        <!-- Joule Welcome — 3048:1774036 -->
        <div class="welcome-brand">
          <!-- Joule_icon — 3048:1774037 : 56×56 -->
          <div class="welcome-icon">
            <img alt="Joule" src="/library/joule/assets/Joule_icon.png" />
          </div>
          <!-- Headline — 3048:1774046 -->
          <p class="welcome-headline">One more thing before<br />the day wraps up?</p>
        </div>

        <!-- Input Suggestions — 3048:1774047 -->
        <div class="welcome-suggestions">
          <!-- Suggestions — 3048:1774060 (flex-wrap) -->
          <div class="welcome-chips">
            <button class="welcome-chip" style="width:181px" data-cat="Analysis &amp; Reporting">
              <span class="welcome-chip-label">Analysis &amp; Reporting</span>
            </button>
            <button class="welcome-chip" style="width:169px" data-cat="Process Automation">
              <span class="welcome-chip-label">Process Automation</span>
            </button>
            <button class="welcome-chip" style="width:191px" data-cat="Compliance &amp; Controls">
              <span class="welcome-chip-label">Compliance &amp; Controls</span>
            </button>
            <button class="welcome-chip" style="width:156px" data-cat="Strategic Planning">
              <span class="welcome-chip-label">Strategic Planning</span>
            </button>
          </div>
        </div>

      </div>
    `;

    /* Chip click → joule-suggest */
    this.shadowRoot.querySelectorAll('.welcome-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-cat');
        this.dispatchEvent(new CustomEvent('joule-suggest', {
          bubbles: true, composed: true,
          detail: { category },
        }));
      });
    });
  }
}

customElements.define('joule-welcome', JouleWelcome);