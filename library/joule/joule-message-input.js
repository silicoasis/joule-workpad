/**
 * <joule-message-input> — Joule message input component
 * Figma: node 3013:83825
 *
 * Attributes:
 *   placeholder  {string}  Placeholder text
 *   mention      {string}  @mention tag label (default: "@performance-assistant")
 *   disabled     {boolean} Disable the input
 *
 * Dispatched events:
 *   joule-send    — { detail: { text, mention } } — send button clicked / Enter pressed
 *   joule-attach  — attach button clicked
 *   joule-mention — @ button clicked
 *   joule-mode    — customize/mode button clicked
 *   joule-input   — { detail: { value } } — input value changed
 *
 * Features:
 *   - Collapsed single-row mode after message submission (space-saving)
 *   - Expands to full multi-row mode on click / focus
 *   - contenteditable auto-wrapping textarea (grows with content)
 *   - Send enabled when text is non-empty; disabled when empty
 *   - Enter (without Shift) submits; Shift+Enter inserts newline
 *   - Resets + collapses after submission
 *
 * Icons: SAP icons from @ui5/webcomponents-icons v5 (Horizon theme), inlined SVG
 * Styles: /library/joule/component-styles.css
 */

/* SAP icon path data — @ui5/webcomponents-icons v5 / Horizon theme */
const SAP_ICONS = {
  add: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M454 230q11 0 18.5 7.5T480 256t-7.5 18.5T454 282H282v172q0 11-7.5 18.5T256 480t-18.5-7.5T230 454V282H58q-11 0-18.5-7.5T32 256t7.5-18.5T58 230h172V58q0-11 7.5-18.5T256 32t18.5 7.5T282 58v172h172z"/>
  </svg>`,

  customize: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M368 160q-33 0-56.5-23.5T288 80t23.5-56.5T368 0q29 0 51 18t27 46h40q11 0 18.5 7.5T512 90t-7.5 18-18.5 7h-46q-10 20-29 32.5T368 160zm0-109q-12 0-20.5 8.5T339 80t8.5 20.5T368 109t20.5-8.5T397 80t-8.5-20.5T368 51zM26 115q-11 0-18.5-7T0 90t7.5-18.5T26 64h172q11 0 18.5 7.5T224 90t-7.5 18-18.5 7H26zm118 77q33 0 56.5 23.5T224 272t-23.5 56.5T144 352t-56.5-23.5T64 272t23.5-56.5T144 192zm342 45q11 0 18.5 7t7.5 18-7.5 18.5T486 288H314q-11 0-18.5-7.5T288 262t7.5-18 18.5-7h172zm-342 64q12 0 20.5-8.5T173 272t-8.5-20.5T144 243t-20.5 8.5T115 272t8.5 20.5T144 301zm342 96q11 0 18.5 7t7.5 18-7.5 18.5T486 448H382q-5 28-27 46t-51 18q-33 0-56.5-23.5T224 432t23.5-56.5T304 352q24 0 43 12.5t29 32.5h110zm-352 0q11 0 18.5 7t7.5 18-7.5 18.5T134 448H26q-11 0-18.5-7.5T0 422t7.5-18 18.5-7h108zm170 64q12 0 20.5-8.5T333 432t-8.5-20.5T304 403t-20.5 8.5T275 432t8.5 20.5T304 461z"/>
  </svg>`,

  arobase: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M256 512q-53 0-100-20t-81.5-54.5T20 356 0 256t20-100 54.5-81.5T156 20 256 0q54 0 101 20t81.5 55.5 54 82.5T512 259q0 22-4 44.5T493.5 344 466 373t-44 11-43-11-24-22l-5-8q-17 19-41.5 30T256 384q-27 0-50-10t-40.5-27.5T138 306t-10-50 10-50 27.5-40.5T206 138t50-10q22 0 41 7t36 19q0-11 7-18.5t18-7.5 18.5 7.5T384 154v102q0 9 1 22.5t4.5 25.5 11.5 20.5 22 8.5 21.5-7.5 11-17.5 4.5-21 1-18q0-45-14.5-85T405 114.5 341 68t-82-17q-43 0-81 16t-66.5 43.5-44.5 65T51 256t16 80 44 65 65 44 80 16q48 0 85-20 13-5 17-5 11 0 18.5 7t7.5 18q0 15-16 24.5T330.5 501t-43 8.5T256 512zm0-333q-32 0-54.5 22.5T179 256t22.5 54.5T256 333t54.5-22.5T333 256t-22.5-54.5T256 179z"/>
  </svg>`,

  paperPlane: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M455 32q10 0 17.5 7.5T480 58q0 6-2 9L323 464q-7 16-24 16-8 0-14.5-4t-9.5-12l-64-164-163-65q-16-6-16-24 0-17 16-24L445 34q6-2 10-2zM127 212l97 39 126-125zm259-50L260 287l39 98z"/>
  </svg>`,

  decline: `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M292 256l117 116q7 7 7 18 0 12-7.5 19t-18.5 7q-10 0-18-8L256 292 140 408q-8 8-18 8-11 0-18.5-7.5T96 390q0-10 8-18l116-116-116-116q-8-8-8-18 0-11 7.5-18.5T122 96t18 7l116 117 116-117q7-7 18-7t18.5 7.5T416 122t-7 18z"/>
  </svg>`,
};

class JouleMessageInput extends HTMLElement {
  static get observedAttributes() {
    return ['placeholder', 'mention', 'disabled'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._text = '';
    this._mentionActive = false;
    this._collapsed = false; /* starts expanded (Figma default) */
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
     Public API
  ══════════════════════════════════════════════════════════════ */

  /** Collapse to compact mode (no-op if already collapsed) */
  collapse() {
    if (!this._collapsed) this._collapse();
  }

  /** Clear the input field (does not change collapsed state) */
  reset() {
    this._text = '';
    this._mentionActive = false;
    const editor = this.shadowRoot?.querySelector('.editor');
    if (editor) {
      editor.textContent = '';
      this._syncSendState();
    }
  }

  /** Programmatically set the input value */
  setValue(text) {
    this._text = text;
    const editor = this.shadowRoot?.querySelector('.editor');
    if (editor) {
      editor.textContent = text;
      this._syncSendState();
    }
  }

  /* ══════════════════════════════════════════════════════════════
     Render
  ══════════════════════════════════════════════════════════════ */

  _render() {
    const placeholder = this.getAttribute('placeholder') ?? 'Message with Performance Assistant ...';
    const mention     = this.getAttribute('mention')     ?? '@performance-assistant';

    if (this._collapsed) {
      this._renderCollapsed(placeholder, mention);
    } else {
      this._renderExpanded(placeholder, mention);
    }
  }

  /* ── Collapsed: compact single-row pill ── */
  _renderCollapsed(placeholder, mention) {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/library/joule/component-styles.css" />

      <div class="input-field input-field--collapsed">
        <div class="collapsed-bar">

          <!-- action buttons — left side -->
          <div class="input-actions">

            <button class="input-icon-btn" data-action="attach" title="Attach" aria-label="Attach">
              <span class="sap-icon sap-icon--input">${SAP_ICONS.add}</span>
            </button>

            <button class="input-icon-btn" data-action="mode" title="Customize" aria-label="Customize">
              <span class="sap-icon sap-icon--input">${SAP_ICONS.customize}</span>
            </button>

            <button class="input-icon-btn" data-action="mention" title="Mention" aria-label="Mention">
              <span class="sap-icon sap-icon--input">${SAP_ICONS.arobase}</span>
            </button>

            ${this._mentionActive ? `
            <div class="mention-tag">
              <p class="mention-tag-label">${this._esc(mention)}</p>
              <button class="mention-tag-close" data-action="remove-mention" title="Remove" aria-label="Remove mention">
                <span class="sap-icon sap-icon--chip">${SAP_ICONS.decline}</span>
              </button>
            </div>` : ''}

          </div>

          <!-- click-to-expand placeholder area — centre -->
          <div
            class="collapsed-placeholder-area"
            data-action="expand"
            role="button"
            tabindex="0"
            aria-label="${this._esc(placeholder)}"
          >
            <span class="collapsed-placeholder-text">${this._esc(placeholder)}</span>
          </div>

          <!-- send button — right side (always disabled in collapsed state) -->
          <button class="send-btn" data-action="send" title="Send" aria-label="Send" disabled>
            <span class="sap-icon sap-icon--send">${SAP_ICONS.paperPlane}</span>
          </button>

        </div>
      </div>
    `;
  }

  /* ── Expanded: full multi-row input (Figma design) ── */
  _renderExpanded(placeholder, mention) {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/library/joule/component-styles.css" />

      <div class="input-field">

        <!-- editable message area -->
        <div class="message-entry">
          <div
            class="editor"
            role="textbox"
            contenteditable="true"
            aria-multiline="true"
            aria-label="${this._esc(placeholder)}"
            data-placeholder="${this._esc(placeholder)}"
          ></div>
        </div>

        <!-- input-bar — 3013:83829 -->
        <div class="input-bar">

          <!-- actions — 3013:83830 -->
          <div class="input-actions">

            <!-- Attachments-Button (sap-icon://add) — 3013:83831 -->
            <button class="input-icon-btn" data-action="attach" title="Attach" aria-label="Attach">
              <span class="sap-icon sap-icon--input">${SAP_ICONS.add}</span>
            </button>

            <!-- mode-Button (sap-icon://customize) — 3013:83833 -->
            <button class="input-icon-btn" data-action="mode" title="Customize" aria-label="Customize">
              <span class="sap-icon sap-icon--input">${SAP_ICONS.customize}</span>
            </button>

            <!-- mention-Button (sap-icon://arobase) — 3013:83834 -->
            <button class="input-icon-btn" data-action="mention" title="Mention" aria-label="Mention">
              <span class="sap-icon sap-icon--input">${SAP_ICONS.arobase}</span>
            </button>

            <!-- @mention tag — 3013:83835 (hidden until activated) -->
            <div class="mention-tag" style="display:none">
              <p class="mention-tag-label">${this._esc(mention)}</p>
              <button class="mention-tag-close" data-action="remove-mention" title="Remove" aria-label="Remove mention">
                <span class="sap-icon sap-icon--chip">${SAP_ICONS.decline}</span>
              </button>
            </div>

          </div>

          <!-- send button (sap-icon://paper-plane) — 2809:10595 -->
          <button
            class="send-btn"
            data-action="send"
            title="Send"
            aria-label="Send"
            disabled
          >
            <span class="sap-icon sap-icon--send">${SAP_ICONS.paperPlane}</span>
          </button>

        </div>
      </div>
    `;

    /* restore previous text if any */
    if (this._text) {
      const editor = this.shadowRoot.querySelector('.editor');
      if (editor) {
        editor.textContent = this._text;
        this._syncSendState();
      }
    }

    /* restore mention tag visibility */
    if (this._mentionActive) {
      const tag = this.shadowRoot.querySelector('.mention-tag');
      if (tag) tag.style.display = '';
    }
  }

  /* ══════════════════════════════════════════════════════════════
     Collapse / Expand
  ══════════════════════════════════════════════════════════════ */

  /** Switch to compact single-row mode */
  _collapse() {
    this._collapsed = true;
    this._render();
    this._bindEvents();
    /* Notify conversation canvas to shrink bottom padding */
    this.dispatchEvent(new CustomEvent('joule-resize', {
      bubbles: true, composed: true,
      detail: { collapsed: true, paddingBottom: 108 },
    }));
  }

  /** Switch to full multi-row mode, resume the mention tag, and focus the editor */
  _expand() {
    this._mentionActive = true; /* resume the @mention tag (matches Figma initial state) */
    this._collapsed = false;
    this._render();
    this._bindEvents();
    /* Notify conversation canvas to restore bottom padding */
    this.dispatchEvent(new CustomEvent('joule-resize', {
      bubbles: true, composed: true,
      detail: { collapsed: false, paddingBottom: 140 },
    }));
    /* Focus editor after the new DOM is live */
    requestAnimationFrame(() => {
      const editor = this.shadowRoot?.querySelector('.editor');
      if (editor) editor.focus();
    });
  }

  /* ══════════════════════════════════════════════════════════════
     Events
  ══════════════════════════════════════════════════════════════ */

  _bindEvents() {
    const root    = this.shadowRoot;
    const editor  = root.querySelector('.editor');
    const sendBtn = root.querySelector('.send-btn');

    /* ── Collapsed: expand on click / keyboard ── */
    const expandArea = root.querySelector('[data-action="expand"]');
    if (expandArea) {
      expandArea.addEventListener('click', () => this._expand());
      expandArea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this._expand();
        }
      });
    }

    /* ── Expanded: text input, keyboard, send ── */
    if (editor) {
      /* track text, toggle send button, show/hide mention chip */
      editor.addEventListener('input', () => {
        this._text = editor.textContent.trim();
        this._syncSendState();

        /* show chip after "@performance-" + at least 2 more chars are typed */
        const mentionTyped = /@performance-.{2,}/i.test(this._text);
        if (!this._mentionActive && mentionTyped) {
          this._showMention();
        } else if (this._mentionActive && !mentionTyped) {
          this._hideMention();
        }

        this.dispatchEvent(new CustomEvent('joule-input', {
          bubbles: true, composed: true,
          detail: { value: this._text },
        }));
      });

      /* Enter submits; Shift+Enter inserts newline */
      editor.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (this._text) this._submit();
        }
      });
    }

    /* send button click */
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        if (!sendBtn.disabled && this._text) this._submit();
      });
    }

    /* @ button toggles mention tag */
    const mentionBtn = root.querySelector('[data-action="mention"]');
    if (mentionBtn) {
      mentionBtn.addEventListener('click', () => {
        if (this._mentionActive) {
          this._hideMention();
        } else {
          this._showMention();
        }
        this.dispatchEvent(new CustomEvent('joule-mention', {
          bubbles: true, composed: true,
        }));
      });
    }

    /* remove-mention button */
    const removeMentionBtn = root.querySelector('[data-action="remove-mention"]');
    if (removeMentionBtn) {
      removeMentionBtn.addEventListener('click', () => this._hideMention());
    }

    /* other action buttons (attach, mode) */
    root.querySelectorAll('[data-action]').forEach((el) => {
      if (el === sendBtn) return;
      if (['mention', 'remove-mention', 'expand', 'send'].includes(el.dataset.action)) return;
      el.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent(`joule-${el.dataset.action}`, {
          bubbles: true, composed: true,
        }));
      });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     Helpers
  ══════════════════════════════════════════════════════════════ */

  _showMention() {
    this._mentionActive = true;
    const tag = this.shadowRoot?.querySelector('.mention-tag');
    if (tag) tag.style.display = '';
  }

  _hideMention() {
    this._mentionActive = false;
    const tag = this.shadowRoot?.querySelector('.mention-tag');
    if (tag) tag.style.display = 'none';
  }

  _submit() {
    const mention = this.getAttribute('mention') ?? '@performance-assistant';
    this.dispatchEvent(new CustomEvent('joule-send', {
      bubbles: true, composed: true,
      detail: { text: this._text, mention },
    }));
    /* Clear state first, then switch to collapsed layout */
    this._text = '';
    this._mentionActive = false;
    this._collapse();
  }

  _syncSendState() {
    const sendBtn = this.shadowRoot?.querySelector('.send-btn');
    if (!sendBtn) return;
    if (this._text) {
      sendBtn.removeAttribute('disabled');
      sendBtn.style.opacity = '1';
      sendBtn.style.cursor  = 'pointer';
    } else {
      sendBtn.setAttribute('disabled', '');
      sendBtn.style.opacity = '';
      sendBtn.style.cursor  = '';
    }
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

customElements.define('joule-message-input', JouleMessageInput);