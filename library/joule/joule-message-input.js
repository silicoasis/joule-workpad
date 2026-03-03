/**
 * <joule-message-input>
 * Figma: 3030:1186805  "Input Field Glow"
 *
 * Attributes
 *   placeholder  {string}  default "Create with Joule"
 *   mention      {string}  mode-tag label, default "Space"
 *   disabled     {boolean}
 *
 * Events (bubble + composed)
 *   joule-send    detail: { text, mention }
 *   joule-attach
 *   joule-mention
 *   joule-voice
 *   joule-input   detail: { value }
 *   joule-resize  detail: { collapsed, paddingBottom }
 *
 * SAP Icons — Horizon v5 inline SVG paths (consistent with joule-header.js pattern)
 *   (1) sap-icon://add          — attach button (grey pill)
 *   (2) sap-icon://arobase      — mention button
 *   (3) sap-icon://add-coursebook — Space chip leading icon
 *   (4) sap-icon://decline      — chip × close
 *   (5) sap-icon://microphone   — voice button (violet)
 *   (6) sap-icon://waveform     — send button (grey pill, rotated −90°)
 */

/* ─── SAP Horizon v5 icon paths — inline SVG (see joule-header.js pattern) ── */
const SAP_ICONS = {

  /* (1) sap-icon://add — 14×14 viewBox, fill purple */
  add: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="16" height="16" fill="none" aria-hidden="true" focusable="false">
    <path d="M7 0C7.41421 0 7.75 0.335786 7.75 0.75V6.25H13.25C13.6642 6.25 14 6.58579 14 7C14 7.41421 13.6642 7.75 13.25 7.75H7.75V13.25C7.75 13.6642 7.41421 14 7 14C6.58579 14 6.25 13.6642 6.25 13.25V7.75H0.75C0.335786 7.75 0 7.41421 0 7C0 6.58579 0.335786 6.25 0.75 6.25H6.25V0.75C6.25 0.335786 6.58579 0 7 0Z" fill="var(--fill-0, #5D36FF)"/>
  </svg>`,

  /* (2) sap-icon://arobase — 16×16 viewBox, fill purple */
  arobase: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true" focusable="false">
    <path d="M7.99512 0C12.4405 9.05009e-05 16 3.55645 16 8C16 9.26439 15.7927 10.2549 15.3096 10.9453C14.7883 11.6903 14.0307 11.9707 13.2393 11.9707C12.2726 11.9707 11.4242 11.4844 10.9775 10.6279C10.2474 11.4512 9.18312 11.9707 8.00488 11.9707C5.82295 11.9706 4.03125 10.1817 4.03125 8C4.03125 5.81829 5.82295 4.02939 8.00488 4.0293C8.93723 4.0293 9.79809 4.35599 10.4785 4.90039C10.4785 4.34894 10.8143 4.0293 11.2285 4.0293C11.6427 4.02936 11.9785 4.36512 11.9785 4.7793V8C11.9785 9.64835 12.2035 9.80869 12.3975 10.0859C12.7679 10.615 13.7106 10.615 14.0811 10.0859C14.3028 9.76911 14.5 9.14891 14.5 8C14.5 4.38586 11.613 1.50009 7.99512 1.5C4.3785 1.5 1.5 4.38444 1.5 8C1.5 11.6141 4.38698 14.4999 8.00488 14.5C9.37779 14.5 10.6038 14.0677 11.6318 13.4072C11.9803 13.1836 12.4442 13.2844 12.668 13.6328C12.8918 13.9812 12.7906 14.445 12.4424 14.6689C11.207 15.4625 9.70375 16 8.00488 16C3.55953 15.9999 1.32038e-07 12.4435 0 8C0 3.55776 3.54832 0 7.99512 0ZM8.00488 5.5293C6.65039 5.52939 5.53125 6.6477 5.53125 8C5.53125 9.3523 6.65039 10.4706 8.00488 10.4707C9.36098 10.4707 10.4785 9.36093 10.4785 8C10.4785 6.64764 9.35945 5.5293 8.00488 5.5293Z" fill="var(--fill-0, #5D36FF)"/>
  </svg>`,

  /* (3) sap-icon://add-coursebook — Spaces diamond, 14.58×15.11 viewBox */
  spaces: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14.5804 15.105" width="16" height="16" fill="none" aria-hidden="true" focusable="false">
    <path d="M9.34802 0.57636C8.08142 -0.19212 6.499 -0.19212 5.2324 0.57636L1.16521 3.04474C-0.388254 3.98753 -0.38825 6.26438 1.16521 7.20716L1.73431 7.55255L1.16521 7.89774C-0.388404 8.84051 -0.388402 11.1182 1.16521 12.061L5.2324 14.5285C6.49909 15.2972 8.08133 15.2972 9.34802 14.5285L13.4152 12.061C14.9688 11.1182 14.9688 8.84051 13.4152 7.89774L12.846 7.55261L13.4152 7.20716C14.9687 6.26438 14.9687 3.98753 13.4152 3.04474L9.34802 0.57636ZM1.98865 9.28522L3.28903 8.49611L5.2324 9.67554C6.499 10.444 8.08142 10.444 9.34802 9.67554L11.2912 8.49623L12.5918 9.28522C13.1096 9.59947 13.1096 10.3592 12.5918 10.6735L8.52537 13.1411C7.76533 13.6023 6.81509 13.6023 6.05505 13.1411L1.98865 10.6735C1.47078 10.3592 1.47078 9.59947 1.98865 9.28522ZM6.05505 1.96384C6.81509 1.50263 7.76533 1.50263 8.52537 1.96384L12.5918 4.43221C13.1096 4.74647 13.1096 5.50543 12.5918 5.81969L8.52537 8.28807C7.76533 8.74928 6.81509 8.74928 6.05505 8.28807L1.98865 5.81969C1.47078 5.50543 1.47078 4.74647 1.98865 4.43221L6.05505 1.96384Z" fill="var(--fill-0, #5D36FF)"/>
  </svg>`,

  /* (4) sap-icon://decline — × close, ~10×10 viewBox */
  decline: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9.99989 9.99989" width="10" height="10" fill="none" aria-hidden="true" focusable="false">
    <path d="M8.71969 0.219671C9.01259 -0.0732235 9.48735 -0.0732235 9.78024 0.219671C10.0731 0.512569 10.0731 0.987345 9.78024 1.28022L6.06051 4.99996L9.78024 8.71969C10.0731 9.01259 10.0731 9.48737 9.78024 9.78024C9.48737 10.0731 9.01259 10.0731 8.71969 9.78024L4.99996 6.06051L1.28022 9.78024C0.987344 10.0731 0.512569 10.0731 0.219671 9.78024C-0.0732234 9.48735 -0.0732233 9.01259 0.219671 8.71969L3.93941 4.99996L0.219671 1.28022C-0.0732235 0.987326 -0.0732235 0.512565 0.219671 0.219671C0.512565 -0.0732235 0.987325 -0.0732235 1.28022 0.219671L4.99996 3.93941L8.71969 0.219671Z" fill="var(--fill-0, #5D36FF)"/>
  </svg>`,

  /* (5) sap-icon://microphone — SAP Horizon v5 path, fill purple */
  microphone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16" fill="none" aria-hidden="true" focusable="false">
    <path d="M256 320q-33 0-56.5-23.5T176 240V80q0-33 23.5-56.5T256 0t56.5 23.5T336 80v160q0 33-23.5 56.5T256 320zm-29-80q0 12 8.5 20.5T256 269t20.5-8.5T285 240V80q0-12-8.5-20.5T256 51t-20.5 8.5T227 80v160zm195-48q11 0 18.5 7.5T448 218q0 36-12.5 69t-35 60-53 44.5T282 414v72q0 11-7.5 18.5T256 512t-18.5-7.5T230 486v-72q-35-5-65.5-23t-53-44.5-35-59.5T64 218q0-11 7.5-18.5T90 192t18 7.5 7 18.5q0 28 11 55t30.5 47 45 32.5T256 365t54.5-12.5 45-32.5 30.5-47 11-55q0-11 7-18.5t18-7.5z" fill="var(--fill-0, #5D36FF)"/>
  </svg>`,

  /* (6) sap-icon://waveform — 3 horizontal bars, rotated −90° for send */
  waveform: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.2302 10.2401" width="16" height="13" fill="none" aria-hidden="true" focusable="false">
    <path d="M10.031 1.82694H3.19918C2.66043 1.82694 2.28571 1.37773 2.28571 0.913469C2.28571 0.444507 2.66984 0 3.19918 0L10.031 0C10.5274 0 10.9445 0.402182 10.9445 0.913469C10.9445 1.40595 10.5365 1.82694 10.031 1.82694ZM12.3167 6.0312H0.913469C0.402936 6.0312 0 5.61021 0 5.11773C0 4.62055 0.412342 4.20426 0.913469 4.20426H12.3167C12.8272 4.20426 13.2302 4.62995 13.2302 5.11773C13.2302 5.5961 12.8363 6.0312 12.3167 6.0312ZM10.031 10.2401H3.19918C2.64162 10.2401 2.28571 9.77214 2.28571 9.32669C2.28571 8.82014 2.70276 8.41323 3.19918 8.41323H10.031C10.5651 8.41323 10.9445 8.86247 10.9445 9.32669C10.9445 9.81447 10.5318 10.2401 10.031 10.2401Z" fill="var(--fill-0, #5D36FF)"/>
  </svg>`,

};

/* ─── Component ──────────────────────────────────────────────────────────────── */
class JouleMessageInput extends HTMLElement {
  static get observedAttributes() { return ['placeholder', 'mention', 'disabled']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._value      = '';   // current editor text
    this._tagVisible = true; // ModeSwitch chip visible by default (Figma initial state)
    this._collapsed  = false;
  }

  connectedCallback() {
    this._render();
    /* Collapse to single-row when user clicks outside this component.
       composedPath() includes the host element for any click inside the
       shadow root, so this correctly ignores clicks on the input itself. */
    this._docClick = (e) => {
      if (this._collapsed) return;
      if (e.composedPath().includes(this)) return;
      this.collapse();
    };
    document.addEventListener('click', this._docClick);
  }

  disconnectedCallback() {
    if (this._docClick) {
      document.removeEventListener('click', this._docClick);
      this._docClick = null;
    }
  }

  attributeChangedCallback() { this._render(); }

  /* ── public API ─────────────────────────────────────────────────────────── */
  get value() { return this._value; }

  /**
   * Collapse to compact footer bar — clears text, re-renders collapsed template.
   * Called after send or when user clicks away from the canvas.
   */
  collapse() {
    this._value      = '';
    this._tagVisible = true;
    this._collapsed  = true;
    const ph = this.getAttribute('placeholder') ?? 'Create with Joule';
    const mn = this.getAttribute('mention')     ?? 'Space';
    this.shadowRoot.innerHTML = this._tmplCollapsed(ph, mn);
    this._bind();
    this._emit('joule-resize', { collapsed: true, paddingBottom: 108 });
  }

  /** Expand to full input — re-renders expanded template and focuses editor. */
  expand() {
    this._collapsed = false;
    const ph = this.getAttribute('placeholder') ?? 'Create with Joule';
    const mn = this.getAttribute('mention')     ?? 'Space';
    this.shadowRoot.innerHTML = this._tmplExpanded(ph, mn);
    this._bind();
    requestAnimationFrame(() => this._editor()?.focus());
    this._emit('joule-resize', { collapsed: false, paddingBottom: 172 });
  }

  /** Reset: re-render expanded and clear state */
  reset() {
    this._value      = '';
    this._tagVisible = true;
    this._collapsed  = false;
    const ph = this.getAttribute('placeholder') ?? 'Create with Joule';
    const mn = this.getAttribute('mention')     ?? 'Space';
    this.shadowRoot.innerHTML = this._tmplExpanded(ph, mn);
    this._bind();
    this._emit('joule-resize', { collapsed: false, paddingBottom: 172 });
  }

  /* ── render — uses collapsed or expanded template based on state ─────────── */
  _render() {
    const ph = this.getAttribute('placeholder') ?? 'Create with Joule';
    const mn = this.getAttribute('mention')     ?? 'Space';
    this.shadowRoot.innerHTML = this._collapsed
      ? this._tmplCollapsed(ph, mn)
      : this._tmplExpanded(ph, mn);
    this._bind();
  }

  /* Expanded template — Figma 3030:1186805 */
  _tmplExpanded(ph, mn) {
    const tagHidden = this._tagVisible ? '' : 'style="display:none"';
    return `
<link rel="stylesheet" href="/library/joule/component-styles.css">
<div class="mi-field">

  <!-- Message Entry — 3030:1186806 -->
  <div class="mi-entry">
    <div class="mi-editor"
      role="textbox"
      contenteditable="true"
      aria-multiline="true"
      aria-label="${this._esc(ph)}"
      data-ph="${this._esc(ph)}"
    ></div>
  </div>

  <!-- Action Bar — 3030:1186808 -->
  <div class="mi-bar">

    <!-- Left actions: add (filled) + arobase + mode-tag -->
    <div class="mi-actions">
      <!-- (1) sap-icon://add — grey pill background per Figma 3030:1186810 -->
      <button class="mi-btn mi-btn--filled" data-act="attach" title="Attach" aria-label="Attach">
        ${SAP_ICONS.add}
      </button>
      <!-- (2) sap-icon://arobase — no background per Figma 3030:1186811 -->
      <button class="mi-btn" data-act="mention" title="Mention" aria-label="Mention">
        ${SAP_ICONS.arobase}
      </button>
      <!-- ModeSwitch chip — 3030:1186793 — (3) add-coursebook Spaces + (4) decline -->
      <div class="mi-tag" ${tagHidden}>
        <span class="mi-tag-icon">${SAP_ICONS.spaces}</span>
        <span class="mi-tag-label">${this._esc(mn)}</span>
        <button class="mi-tag-close" data-act="tag-close" title="Remove" aria-label="Remove">
          ${SAP_ICONS.decline}
        </button>
      </div>
    </div>

    <!-- Trailing actions: (5) microphone + (6) waveform send -->
    <div class="mi-trailing">
      <!-- (5) sap-icon://microphone — no background -->
      <button class="mi-btn" data-act="voice" title="Voice input" aria-label="Voice input">
        ${SAP_ICONS.microphone}
      </button>
      <!-- (6) sap-icon://waveform — grey pill send button, rotated −90° -->
      <button class="mi-send" data-act="send" title="Send" aria-label="Send" disabled>
        <span class="mi-send-icon">${SAP_ICONS.waveform}</span>
      </button>
    </div>

  </div><!-- /mi-bar -->
</div><!-- /mi-field -->`;
  }

  /* Collapsed template — single-row pill (60px) */
  _tmplCollapsed(ph, mn) {
    const tag = this._tagVisible
      ? `<div class="mi-tag">
           <span class="mi-tag-icon">${SAP_ICONS.spaces}</span>
           <span class="mi-tag-label">${this._esc(mn)}</span>
           <button class="mi-tag-close" data-act="tag-close" title="Remove" aria-label="Remove">
             ${SAP_ICONS.decline}
           </button>
         </div>`
      : '';
    return `
<link rel="stylesheet" href="/library/joule/component-styles.css">
<div class="mi-field mi-field--row">
  <div class="mi-actions">
    <!-- (1) sap-icon://add — grey pill background -->
    <button class="mi-btn mi-btn--filled" data-act="attach" title="Attach" aria-label="Attach">
      ${SAP_ICONS.add}
    </button>
    <!-- (2) sap-icon://arobase — no background -->
    <button class="mi-btn" data-act="mention" title="Mention" aria-label="Mention">
      ${SAP_ICONS.arobase}
    </button>
    ${tag}
  </div>
  <div class="mi-placeholder-area" data-act="expand" role="button" tabindex="0" aria-label="${this._esc(ph)}">
    <span class="mi-placeholder-text">${this._esc(ph)}</span>
  </div>
  <div class="mi-trailing">
    <!-- (5) sap-icon://microphone — no background -->
    <button class="mi-btn" data-act="voice" title="Voice input" aria-label="Voice input">
      ${SAP_ICONS.microphone}
    </button>
    <!-- (6) sap-icon://waveform — grey pill send button -->
    <button class="mi-send" data-act="send" title="Send" aria-label="Send" disabled>
      <span class="mi-send-icon">${SAP_ICONS.waveform}</span>
    </button>
  </div>
</div>`;
  }

  /* ── event binding ──────────────────────────────────────────────────────── */
  _bind() {
    const root = this.shadowRoot;

    /* expand on click/keyboard in collapsed placeholder area */
    root.querySelector('[data-act="expand"]')?.addEventListener('click',   () => this.expand());
    root.querySelector('[data-act="expand"]')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.expand(); }
    });

    /* editor */
    const ed = this._editor();
    if (ed) {
      /* restore text if any */
      if (this._value) { ed.textContent = this._value; this._syncSend(); }

      ed.addEventListener('input', () => {
        this._value = ed.textContent.trim();
        this._syncSend();
        this._emit('joule-input', { value: this._value });
      });
      ed.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (this._value) this._doSend(); }
      });
    }

    /* send */
    root.querySelector('[data-act="send"]')?.addEventListener('click', () => {
      if (this._value) this._doSend();
    });

    /* attach */
    root.querySelector('[data-act="attach"]')?.addEventListener('click', () => {
      this._emit('joule-attach');
    });

    /* mention toggle */
    root.querySelector('[data-act="mention"]')?.addEventListener('click', () => {
      this._tagVisible = !this._tagVisible;
      const tag = root.querySelector('.mi-tag');
      if (tag) tag.style.display = this._tagVisible ? '' : 'none';
      this._emit('joule-mention');
    });

    /* tag close */
    root.querySelector('[data-act="tag-close"]')?.addEventListener('click', () => {
      this._tagVisible = false;
      const tag = root.querySelector('.mi-tag');
      if (tag) tag.style.display = 'none';
    });

    /* voice */
    root.querySelector('[data-act="voice"]')?.addEventListener('click', () => {
      this._emit('joule-voice');
    });
  }

  /* ── helpers ────────────────────────────────────────────────────────────── */
  _editor()   { return this.shadowRoot.querySelector('.mi-editor'); }

  _syncSend() {
    const btn = this.shadowRoot.querySelector('[data-act="send"]');
    if (!btn) return;
    if (this._value) {
      btn.removeAttribute('disabled');
    } else {
      btn.setAttribute('disabled', '');
    }
  }

  _doSend() {
    const mn = this.getAttribute('mention') ?? 'Space';
    this._emit('joule-send', { text: this._value, mention: mn });
    this.collapse();
  }

  _emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
  }

  _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

customElements.define('joule-message-input', JouleMessageInput);