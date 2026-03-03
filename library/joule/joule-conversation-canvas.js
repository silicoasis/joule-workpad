/**
 * <joule-conversation-canvas> — Joule scrollable conversation view
 * Figma: node 3013:83775
 *
 * Public API:
 *   addUserMessage(text, mention)  — append a user bubble
 *   streamResponse(lines[])        — stream an array of text lines word-by-word (LLM style)
 *   showLoading(label)             — show animated loading row
 *   hideLoading()                  — remove loading row
 *
 * Initial content is the static Figma seed conversation.
 * After init, addUserMessage() + streamResponse() drive dynamic turns.
 *
 * Styles: /library/joule/component-styles.css
 */

const LOADING_DOTS_SVG = '/library/joule/assets/7314ef4300a4dc7969f367a601971d7ed8bd03f9.svg';

/* ── Code response mock ── */
const MOCK_CODE_RESPONSE = {
  language: 'javascript',
  intro: 'Here\'s a utility to fetch and process your pay stub data from SuccessFactors:',
  lines: [
    `async function fetchPayStub(employeeId) {`,
    `  const url = \`/api/pay-stubs/\${employeeId}\`;`,
    `  const res = await fetch(url, {`,
    `    headers: { 'Authorization': \`Bearer \${getToken()}\` },`,
    `  });`,
    `  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);`,
    `  return await res.json();`,
    `}`,
    ``,
    `// Calculate net pay after all deductions`,
    `function calcNetPay(gross, deductions = []) {`,
    `  const totalDeductions = deductions`,
    `    .filter(d => d.active)`,
    `    .reduce((sum, d) => sum + d.amount, 0);`,
    `  return gross - totalDeductions;`,
    `}`,
  ],
};

/* ── Table response mock — 8 columns × 10 rows of product data ── */
const MOCK_TABLE_RESPONSE = {
  intro: 'Here\'s a summary of the current product catalog:',
  columns: ['Product ID', 'Product Name', 'Category', 'Unit Price', 'Stock', 'Supplier', 'Status', 'Last Updated'],
  rows: [
    ['P-10041', 'Ergonomic Chair Pro', 'Furniture', '$349.00', '142', 'OfficeSupply Co.', 'Active', 'Jan 15, 2025'],
    ['P-10042', 'Standing Desk 160cm', 'Furniture', '$729.00', '58', 'DeskWorld GmbH', 'Active', 'Jan 20, 2025'],
    ['P-10043', 'Monitor 27" 4K IPS', 'Electronics', '$499.00', '305', 'TechVision Ltd.', 'Active', 'Feb 02, 2025'],
    ['P-10044', 'Mechanical Keyboard', 'Electronics', '$129.00', '87', 'KeyTech Inc.', 'Active', 'Feb 10, 2025'],
    ['P-10045', 'Wireless Mouse MX', 'Electronics', '$89.00', '210', 'KeyTech Inc.', 'Active', 'Feb 10, 2025'],
    ['P-10046', 'USB-C Hub 10-in-1', 'Accessories', '$59.00', '430', 'ConnectAll AG', 'Active', 'Mar 01, 2025'],
    ['P-10047', 'Noise-Cancel Headset', 'Electronics', '$239.00', '76', 'SoundPro GmbH', 'Low Stock', 'Mar 05, 2025'],
    ['P-10048', 'Desk Lamp LED Pro', 'Accessories', '$44.00', '0', 'BrightSpace Co.', 'Out of Stock', 'Mar 08, 2025'],
    ['P-10049', 'Laptop Cooling Pad', 'Accessories', '$35.00', '192', 'CoolTech Ltd.', 'Active', 'Mar 12, 2025'],
    ['P-10050', 'Smart Webcam 1080p', 'Electronics', '$149.00', '54', 'VisionCam Inc.', 'Discontinued', 'Mar 15, 2025'],
  ],
};

/* ── Syntax highlighter — character-level tokeniser ── */
function _highlightJS(line) {
  if (!line.trim()) return '\u00a0'; /* keep blank lines */

  const KEYWORDS = new Set([
    'async', 'await', 'function', 'const', 'let', 'var', 'return',
    'if', 'else', 'for', 'while', 'throw', 'new', 'import', 'export',
    'default', 'class', 'extends', 'from', 'of', 'in', 'true', 'false',
    'null', 'undefined', 'typeof', 'instanceof', 'switch', 'case',
    'break', 'continue', 'try', 'catch', 'finally', 'delete', 'void',
  ]);

  const ESC = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const SPAN = (color, text) => `<span style="color:${color}">${text}</span>`;

  let html = '';
  let i = 0;
  const len = line.length;

  while (i < len) {
    /* single-line comment */
    if (line[i] === '/' && line[i + 1] === '/') {
      html += SPAN('#6a9955', ESC(line.slice(i)));
      break;
    }
    /* template literal */
    if (line[i] === '`') {
      let j = i + 1;
      while (j < len && line[j] !== '`') { if (line[j] === '\\') j++; j++; }
      html += SPAN('#ce9178', ESC(line.slice(i, j + 1)));
      i = j + 1; continue;
    }
    /* regular string */
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i];
      let j = i + 1;
      while (j < len && line[j] !== q) { if (line[j] === '\\') j++; j++; }
      html += SPAN('#ce9178', ESC(line.slice(i, j + 1)));
      i = j + 1; continue;
    }
    /* identifiers / keywords */
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < len && /[\w$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (KEYWORDS.has(word)) {
        html += SPAN('#569cd6', word);
      } else if (line[j] === '(') {
        html += SPAN('#dcdcaa', word);
      } else if (/^[A-Z]/.test(word)) {
        html += SPAN('#4ec9b0', word); /* class / type names */
      } else {
        html += word;
      }
      i = j; continue;
    }
    /* numbers */
    if (/[0-9]/.test(line[i])) {
      let j = i;
      while (j < len && /[0-9._]/.test(line[j])) j++;
      html += SPAN('#b5cea8', line.slice(i, j));
      i = j; continue;
    }
    /* operators & punctuation */
    const ch = line[i];
    if ('+-*/%=!<>&|?:'.includes(ch)) {
      html += SPAN('#d4d4d4', ESC(ch));
    } else if (ch === '&') {
      html += '&amp;';
    } else if (ch === '<') {
      html += '&lt;';
    } else if (ch === '>') {
      html += '&gt;';
    } else {
      html += ESC(ch);
    }
    i++;
  }
  return html || '\u00a0';
}

/* 10-row continuous mocked response — single paragraph, no line breaks */
const MOCK_RESPONSE_LINES = [
  'Your current salary band is Grade 5, Band B, as defined in your employment contract dated January 2024, and is determined by your job grade and location cluster assignment. The standard compensation range for this band is $72,000 to $88,000 per year, and your current base salary of $74,500 falls within that range. The discrepancy you noticed on your latest paycheck is most likely related to the mid-year federal tax withholding adjustment that was applied in August, as well as the updated pension contribution rate that took effect on February 1st of this year. Both changes were communicated in the HR bulletin issued in January. I recommend reviewing the detailed payslip breakdown available in the SAP SuccessFactors self-service portal, where each deduction line is itemized clearly. If after reviewing those details the figures still do not match your expectations, please raise a support ticket with HR Services and reference your employee ID for a manual review by the payroll team.',
];

/* Typing speed: ms per word */
const WORD_DELAY_MS = 55;

class JouleConversationCanvas extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._streaming = false;
  }

  connectedCallback() {
    this._render();
  }

  /**
   * Called by joule-panel's ResizeObserver whenever the footer height changes.
   * Updates the conversation-roll bottom padding so content is never hidden
   * behind the absolute-positioned footer overlay.
   * @param {number} footerHeight  Rendered border-box height of .footer in px
   */
  setFooterHeight(footerHeight) {
    const roll = this.shadowRoot?.querySelector('.conversation-roll');
    if (!roll) return;
    /* Add 8px breathing room above the footer */
    roll.style.paddingBottom = `${footerHeight + 8}px`;
  }

  /* ── render static seed conversation ── */
  _render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="/library/joule/component-styles.css" />

      <div class="scrollable-conversation-container">
        <div class="conversation-roll" id="roll">

          <!-- Timestamp — 3013:83853 -->
          <div class="timestamp">
            <span class="bold">Today</span><span class="normal"> 8:00 AM</span>
          </div>

          <!-- User message #1 — 3013:83854 -->
          <div class="user-message-row">
            <div class="user-bubble">
              <div class="user-bubble-inner">
                <p>something is off
                  <span class="mention-gradient">@performance-assistant</span>
                  with my pay stub</p>
              </div>
            </div>
          </div>

          <!-- Joule response — 3013:83855 -->
          <div class="joule-message-row">
            <div class="joule-response">
              <p>I couldn't find anything related to your pay stub. As the Performance Assistant, I can help with:<br /><br /></p>
              <ol start="1">
                <li>Creating a strong performance goal</li>
                <li>Preparing for your annual SAP Talk</li>
                <li>Explaining performance &amp; compensation matrix</li>
              </ol>
              <br />
              <p>Try changing to a different assistant, or edit your prompt based on my capabilities.</p>
            </div>
            <joule-response-actions sources="2"></joule-response-actions>
          </div>

          <!-- User message #2 — 3013:83867 -->
          <div class="user-message-row">
            <div class="user-bubble">
              <div class="user-bubble-inner">
                <p>something is off
                  <span class="mention-gradient">@performance-assistant</span>
                  with my pay stub</p>
              </div>
            </div>
          </div>

          <!-- Loading animation — 3013:83868 -->
          <div class="loading-row" id="loading-row">
            <div class="loading-dots">
              <div class="loading-dots-inner">
                <img alt="" src="${LOADING_DOTS_SVG}" />
              </div>
            </div>
            <p class="loading-text">Connecting to Performance Assistant ...</p>
          </div>

        </div>
      </div>
    `;
  }

  /* ── helpers ── */

  _roll() {
    return this.shadowRoot.getElementById('roll');
  }

  /** Demote all existing .latest rows to "old" (hover-only actions), then mark newRow as latest */
  _markLatest(newRow) {
    const roll = this._roll();
    if (!roll) return;
    roll.querySelectorAll('.joule-message-row.latest').forEach((r) => r.classList.remove('latest'));
    newRow.classList.add('latest');
  }

  _scrollToBottom() {
    const container = this.shadowRoot.querySelector('.scrollable-conversation-container');
    if (container) container.scrollTop = container.scrollHeight;
  }

  _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /* ── public API ── */

  /**
   * Append a user message bubble to the conversation roll.
   * @param {string} text    Plain text of the message
   * @param {string} mention Optional @mention label (rendered with gradient)
   */
  addUserMessage(text, mention) {
    const roll = this._roll();
    if (!roll) return;

    /* Highlight @mention tokens inside text */
    const safe = this._esc(text);
    const highlighted = mention
      ? safe.replace(
          this._esc(mention),
          `<span class="mention-gradient">${this._esc(mention)}</span>`
        )
      : safe;

    const row = document.createElement('div');
    row.className = 'user-message-row';
    row.innerHTML = `
      <div class="user-bubble">
        <div class="user-bubble-inner">
          <p>${highlighted}</p>
        </div>
      </div>
    `;
    roll.appendChild(row);
    this._scrollToBottom();
  }

  /**
   * Show the animated loading dots row.
   * @param {string} label  Text beside the dots
   */
  showLoading(label = 'Performance Assistant is thinking ...') {
    this.hideLoading(); /* remove any existing */
    const roll = this._roll();
    if (!roll) return;

    const row = document.createElement('div');
    row.className = 'loading-row';
    row.id = 'loading-row';
    row.innerHTML = `
      <div class="loading-dots">
        <div class="loading-dots-inner">
          <img alt="" src="${LOADING_DOTS_SVG}" />
        </div>
      </div>
      <p class="loading-text">${this._esc(label)}</p>
    `;
    roll.appendChild(row);
    this._scrollToBottom();
  }

  /** Remove the loading row */
  hideLoading() {
    const row = this.shadowRoot.getElementById('loading-row');
    if (row) row.remove();
  }

  /**
   * Stream an array of text lines into a new Joule response bubble.
   * Each line is streamed word-by-word with a small delay (LLM style).
   * @param {string[]} lines   Array of lines to stream
   * @param {number}   delay   ms per word (default: WORD_DELAY_MS)
   * @returns {Promise<void>}  Resolves when streaming is complete
   */
  async streamResponse(lines = MOCK_RESPONSE_LINES, delay = WORD_DELAY_MS) {
    if (this._streaming) return;
    this._streaming = true;

    this.hideLoading();

    const roll = this._roll();
    if (!roll) { this._streaming = false; return; }

    /* Create the response row with an empty paragraph ready to receive text */
    const messageRow = document.createElement('div');
    messageRow.className = 'joule-message-row';

    const responseDiv = document.createElement('div');
    responseDiv.className = 'joule-response';
    messageRow.appendChild(responseDiv);
    roll.appendChild(messageRow);
    this._scrollToBottom();

    /* Stream each line */
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const words = line.split(' ');

      /* Create a <p> for this line */
      const p = document.createElement('p');
      responseDiv.appendChild(p);

      /* Stream words one by one */
      let accumulated = '';
      for (const word of words) {
        accumulated += (accumulated ? ' ' : '') + word;
        p.textContent = accumulated;
        this._scrollToBottom();
        await this._sleep(delay);
      }

      /* Add spacing between lines */
      if (i < lines.length - 1) {
        p.insertAdjacentHTML('afterend', '<br/>');
      }
    }

    /* Append response actions toolbar after streaming completes */
    const actions = document.createElement('joule-response-actions');
    messageRow.appendChild(actions);
    this._markLatest(messageRow);
    this._scrollToBottom();

    this._streaming = false;
  }

  /** Stream the default 8-line mocked response */
  async streamMockResponse() {
    return this.streamResponse(MOCK_RESPONSE_LINES);
  }

  /**
   * Stream a syntax-highlighted code block as a Joule response.
   * Streams the intro sentence word-by-word, then reveals each code line
   * with a short delay (typing effect).
   * @param {object} codeConfig  { language, intro, lines[] }
   */
  async streamCodeResponse(codeConfig = MOCK_CODE_RESPONSE) {
    if (this._streaming) return;
    this._streaming = true;

    this.hideLoading();

    const roll = this._roll();
    if (!roll) { this._streaming = false; return; }

    /* ── message row container ── */
    const messageRow = document.createElement('div');
    messageRow.className = 'joule-message-row';
    const responseDiv = document.createElement('div');
    responseDiv.className = 'joule-response';
    messageRow.appendChild(responseDiv);
    roll.appendChild(messageRow);
    this._scrollToBottom();

    /* ── 1. Stream intro sentence word-by-word ── */
    const introP = document.createElement('p');
    responseDiv.appendChild(introP);
    const words = codeConfig.intro.split(' ');
    let accumulated = '';
    for (const word of words) {
      accumulated += (accumulated ? ' ' : '') + word;
      introP.textContent = accumulated;
      this._scrollToBottom();
      await this._sleep(45);
    }

    /* ── 2. Build the dark code block shell ── */
    const codeBlock = document.createElement('div');
    codeBlock.style.cssText = [
      'margin-top:10px',
      'border-radius:8px',
      'overflow:hidden',
      'border:1px solid #3c3c3c',
      'font-family:"Cascadia Code","Courier New",Courier,monospace',
      'font-size:12px',
      'line-height:1.6',
    ].join(';');

    /* header bar */
    const header = document.createElement('div');
    header.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:space-between',
      'background:#252526',
      'padding:6px 12px',
      'color:#858585',
      'font-size:11px',
      'letter-spacing:0.05em',
    ].join(';');
    header.innerHTML = `
      <span>${this._esc(codeConfig.language)}</span>
      <button data-copy style="background:none;border:none;color:#858585;cursor:pointer;font-size:11px;padding:0;font-family:inherit">
        Copy
      </button>`;

    /* code body */
    const pre = document.createElement('pre');
    pre.style.cssText = [
      'margin:0',
      'padding:14px 16px',
      'background:#1e1e1e',
      'color:#d4d4d4',
      'overflow-x:auto',
      'white-space:pre',
      'tab-size:2',
    ].join(';');

    const code = document.createElement('code');
    code.style.cssText = 'font-family:inherit;font-size:inherit';
    pre.appendChild(code);

    codeBlock.appendChild(header);
    codeBlock.appendChild(pre);
    responseDiv.appendChild(codeBlock);
    this._scrollToBottom();

    /* copy button handler */
    header.querySelector('[data-copy]').addEventListener('click', () => {
      const raw = codeConfig.lines.join('\n');
      navigator.clipboard?.writeText(raw).catch(() => {});
      const btn = header.querySelector('[data-copy]');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });

    /* ── 3. Stream code lines one by one ── */
    for (let i = 0; i < codeConfig.lines.length; i++) {
      const lineText = codeConfig.lines[i];
      const lineEl = document.createElement('div');
      lineEl.innerHTML = _highlightJS(lineText);
      code.appendChild(lineEl);
      this._scrollToBottom();
      await this._sleep(90);
    }

    /* Append response actions toolbar */
    const actions = document.createElement('joule-response-actions');
    messageRow.appendChild(actions);
    this._markLatest(messageRow);
    this._scrollToBottom();

    this._streaming = false;
  }

  /**
   * Stream a table response with intro sentence, then reveal rows one-by-one.
   * The table wrapper is horizontally scrollable.
   * @param {object} tableConfig  { intro, columns[], rows[][] }
   */
  async streamTableResponse(tableConfig = MOCK_TABLE_RESPONSE) {
    if (this._streaming) return;
    this._streaming = true;

    this.hideLoading();

    const roll = this._roll();
    if (!roll) { this._streaming = false; return; }

    /* ── message row container ── */
    const messageRow = document.createElement('div');
    messageRow.className = 'joule-message-row';
    const responseDiv = document.createElement('div');
    responseDiv.className = 'joule-response';
    messageRow.appendChild(responseDiv);
    roll.appendChild(messageRow);
    this._scrollToBottom();

    /* ── 1. Stream intro word-by-word ── */
    const introP = document.createElement('p');
    responseDiv.appendChild(introP);
    const words = tableConfig.intro.split(' ');
    let accumulated = '';
    for (const word of words) {
      accumulated += (accumulated ? ' ' : '') + word;
      introP.textContent = accumulated;
      this._scrollToBottom();
      await this._sleep(45);
    }

    /* ── 2. Build horizontally-scrollable table wrapper ── */
    const wrapper = document.createElement('div');
    wrapper.style.cssText = [
      'margin-top:10px',
      'overflow-x:auto',
      'border-radius:8px',
      'border:1px solid #e5e7eb',
      '-webkit-overflow-scrolling:touch',
    ].join(';');

    const table = document.createElement('table');
    table.style.cssText = [
      'border-collapse:collapse',
      'width:max-content',
      'min-width:100%',
      'font-size:12px',
      'font-family:inherit',
    ].join(';');

    /* ── header row ── */
    const thead = document.createElement('thead');
    const headerTr = document.createElement('tr');
    for (const col of tableConfig.columns) {
      const th = document.createElement('th');
      th.textContent = col;
      th.style.cssText = [
        'padding:8px 12px',
        'text-align:left',
        'background:#f3f4f6',
        'color:#374151',
        'font-weight:600',
        'font-size:11px',
        'letter-spacing:0.04em',
        'white-space:nowrap',
        'border-bottom:2px solid #d1d5db',
      ].join(';');
      headerTr.appendChild(th);
    }
    thead.appendChild(headerTr);
    table.appendChild(thead);

    /* ── tbody (rows streamed in) ── */
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    wrapper.appendChild(table);
    responseDiv.appendChild(wrapper);
    this._scrollToBottom();

    /* Status badge colour map */
    const STATUS_COLORS = {
      'Active':        { bg: '#dcfce7', color: '#166534' },
      'Low Stock':     { bg: '#fef9c3', color: '#854d0e' },
      'Out of Stock':  { bg: '#fee2e2', color: '#991b1b' },
      'Discontinued':  { bg: '#f3f4f6', color: '#6b7280' },
    };
    const STATUS_COL_IDX = 6; /* 0-based index of "Status" column */

    /* ── 3. Stream rows one by one ── */
    for (let r = 0; r < tableConfig.rows.length; r++) {  /* keep comment */
      const rowData = tableConfig.rows[r];
      const tr = document.createElement('tr');
      tr.style.cssText = r % 2 === 1
        ? 'background:#f9fafb'
        : 'background:#ffffff';

      /* hover effect */
      tr.addEventListener('mouseenter', () => { tr.style.background = '#eff6ff'; });
      tr.addEventListener('mouseleave', () => { tr.style.background = r % 2 === 1 ? '#f9fafb' : '#ffffff'; });

      for (let c = 0; c < rowData.length; c++) {
        const td = document.createElement('td');
        td.style.cssText = [
          'padding:7px 12px',
          'border-bottom:1px solid #e5e7eb',
          'white-space:nowrap',
          'color:#374151',
        ].join(';');

        if (c === STATUS_COL_IDX) {
          /* render status as a coloured badge */
          const badge = document.createElement('span');
          const sc = STATUS_COLORS[rowData[c]] || { bg: '#f3f4f6', color: '#374151' };
          badge.textContent = rowData[c];
          badge.style.cssText = [
            `background:${sc.bg}`,
            `color:${sc.color}`,
            'padding:2px 7px',
            'border-radius:999px',
            'font-size:11px',
            'font-weight:500',
          ].join(';');
          td.appendChild(badge);
        } else {
          td.textContent = rowData[c];
        }

        tr.appendChild(td);
      }

      tbody.appendChild(tr);
      this._scrollToBottom();
      await this._sleep(80);
    }

    /* Append response actions toolbar */
    const actionsEl = document.createElement('joule-response-actions');
    messageRow.appendChild(actionsEl);
    this._markLatest(messageRow);
    this._scrollToBottom();

    this._streaming = false;
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

customElements.define('joule-conversation-canvas', JouleConversationCanvas);