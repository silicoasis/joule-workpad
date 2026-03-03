/**
 * <joule-response-actions> — Joule response action toolbar
 * Figma: node 3029:963302
 *
 * Renders a horizontal row of 7 icon buttons followed by a "Sources" count button.
 *
 * Attributes:
 *   sources  {number}  Number of sources to display in the badge (default: 0, hidden when 0)
 *
 * Dispatched events:
 *   joule-action  — { detail: { action } } — one of:
 *     'duplicate' | 'thumb-up' | 'thumb-down' | 'refresh' |
 *     'sound-loud' | 'add-coursebook' | 'overflow' | 'sources'
 *
 * Styles: /library/joule/component-styles.css
 */

/* ── Icon asset paths (served from local static file server) ── */
const ICONS = {
  duplicate:      '/library/joule/assets/00761bfee259f0f2a817ddbb189e2b94ebcddee7.svg',
  thumbUp:        '/library/joule/assets/0f4cf64e2f924eae0e8b59d7ac45e2429ff6ef51.svg',
  thumbDown:      '/library/joule/assets/eec1f74733283eb5a14abc7e6f4816b38f8eedae.svg',
  refresh:        '/library/joule/assets/120a27d48249d536f5ee9630db2f97cc535d5d7f.svg',
  soundLoud:      '/library/joule/assets/080814b7de2ce92fe419b3a03ec8a511b1c672df.svg',
  /* add-coursebook is composed from two SVG layers */
  addCoursebook1: '/library/joule/assets/c78f98be45b2f41b1be8e8e6d77c42905575915f.svg',
  addCoursebook2: '/library/joule/assets/42d26e9091ac0fd5ac9eb59df109411fe7da5ed2.svg',
  overflow:       '/library/joule/assets/d51222febc3279ff85f49efaab857b18d2790e49.svg',
};

class JouleResponseActions extends HTMLElement {
  static get observedAttributes() {
    return ['sources'];
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

  /* ══════════════════════════════════════════════════════════════
     Render
  ══════════════════════════════════════════════════════════════ */

  _render() {
    const sourcesCount = parseInt(this.getAttribute('sources') ?? '0', 10) || 0;

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/library/joule/component-styles.css" />

      <div class="response-actions" role="toolbar" aria-label="Response actions">

        <!-- ── Icon button slot ── -->
        <div class="action-icon-slot">

          <!-- (1) duplicate — sap-icon://duplicate -->
          <button class="action-btn" data-action="duplicate" title="Copy" aria-label="Copy">
            <div class="action-icon-wrap">
              <img alt="" src="${ICONS.duplicate}" />
            </div>
          </button>

          <!-- (2) thumb-up — sap-icon://thumb-up -->
          <button class="action-btn" data-action="thumb-up" title="Good response" aria-label="Good response">
            <div class="action-icon-wrap">
              <img alt="" src="${ICONS.thumbUp}" />
            </div>
          </button>

          <!-- (3) thumb-down — sap-icon://thumb-down -->
          <button class="action-btn" data-action="thumb-down" title="Bad response" aria-label="Bad response">
            <div class="action-icon-wrap">
              <img alt="" src="${ICONS.thumbDown}" />
            </div>
          </button>

          <!-- (4) refresh — sap-icon://refresh -->
          <button class="action-btn" data-action="refresh" title="Regenerate" aria-label="Regenerate">
            <div class="action-icon-wrap">
              <img alt="" src="${ICONS.refresh}" />
            </div>
          </button>

          <!-- (5) sound-loud — sap-icon://sound-loud -->
          <button class="action-btn" data-action="sound-loud" title="Read aloud" aria-label="Read aloud">
            <div class="action-icon-wrap">
              <img alt="" src="${ICONS.soundLoud}" />
            </div>
          </button>

          <!-- (6) add-coursebook — sap-icon://add-coursebook (two-layer composite) -->
          <button class="action-btn" data-action="add-coursebook" title="Save to spaces" aria-label="Save to spaces">
            <div class="action-icon-wrap action-icon-wrap--lg">
              <img alt="" class="action-icon-layer" src="${ICONS.addCoursebook1}" />
              <img alt="" class="action-icon-layer action-icon-layer--plus" src="${ICONS.addCoursebook2}" />
            </div>
          </button>

          <!-- (7) overflow — sap-icon://overflow -->
          <button class="action-btn" data-action="overflow" title="More actions" aria-label="More actions">
            <div class="action-icon-wrap">
              <img alt="" src="${ICONS.overflow}" />
            </div>
          </button>

        </div>

        <!-- ── Sources button ── -->
        ${sourcesCount > 0 ? `
        <button class="sources-btn" data-action="sources" aria-label="Sources (${sourcesCount})">
          <span class="sources-label">Sources</span>
          <div class="sources-badge-row">
            <span class="sources-badge">${sourcesCount}</span>
          </div>
        </button>` : ''}

      </div>
    `;
  }

  /* ══════════════════════════════════════════════════════════════
     Events
  ══════════════════════════════════════════════════════════════ */

  _bindEvents() {
    this.shadowRoot.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('joule-action', {
          bubbles: true,
          composed: true,
          detail: { action: btn.dataset.action },
        }));
      });
    });
  }
}

customElements.define('joule-response-actions', JouleResponseActions);