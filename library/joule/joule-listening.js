/**
 * <joule-listening>
 * Figma: 3058:1854967  "listening"
 *
 * Voice mode overlay — shown when the microphone button is clicked.
 * Covers the full panel with an animated gradient background and a
 * frosted-glass card containing an animated waveform + action buttons.
 *
 * Methods (public API):
 *   show()                         — display the listening overlay (fade in)
 *   hide()                         — dismiss the overlay (fade out) + cleanup
 *   setTranscript(confirmed, interim) — update live transcription display
 *   connectAnalyser(analyserNode)  — drive waveform bars from Web Audio API
 *
 * Events (bubble + composed):
 *   joule-listening-stop  — user tapped close / microphone button
 */

/* ─── SAP icon paths (inline SVG) ─────────────────────────────────────────── */
const ICON_MICROPHONE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="22" height="22" fill="none" aria-hidden="true" focusable="false">
  <path d="M256 320q-33 0-56.5-23.5T176 240V80q0-33 23.5-56.5T256 0t56.5 23.5T336 80v160q0 33-23.5 56.5T256 320zm-29-80q0 12 8.5 20.5T256 269t20.5-8.5T285 240V80q0-12-8.5-20.5T256 51t-20.5 8.5T227 80v160zm195-48q11 0 18.5 7.5T448 218q0 36-12.5 69t-35 60-53 44.5T282 414v72q0 11-7.5 18.5T256 512t-18.5-7.5T230 486v-72q-35-5-65.5-23t-53-44.5-35-59.5T64 218q0-11 7.5-18.5T90 192t18 7.5 7 18.5q0 28 11 55t30.5 47 45 32.5T256 365t54.5-12.5 45-32.5 30.5-47 11-55q0-11 7-18.5t18-7.5z" fill="#5D36FF"/>
</svg>`;

const ICON_DECLINE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="14" height="14" fill="none" aria-hidden="true" focusable="false">
  <path d="M8.71969 0.219671C9.01259 -0.0732235 9.48735 -0.0732235 9.78024 0.219671C10.0731 0.512569 10.0731 0.987345 9.78024 1.28022L6.06051 4.99996L9.78024 8.71969C10.0731 9.01259 10.0731 9.48737 9.78024 9.78024C9.48737 10.0731 9.01259 10.0731 8.71969 9.78024L4.99996 6.06051L1.28022 9.78024C0.987344 10.0731 0.512569 10.0731 0.219671 9.78024C-0.0732234 9.48735 -0.0732233 9.01259 0.219671 8.71969L3.93941 4.99996L0.219671 1.28022C-0.0732235 0.987326 -0.0732235 0.512565 0.219671 0.219671C0.512565 -0.0732235 0.987325 -0.0732235 1.28022 0.219671L4.99996 3.93941L8.71969 0.219671Z" fill="#475E75"/>
</svg>`;

/* ─── Component ──────────────────────────────────────────────────────────────── */
class JouleListening extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    /* Web Audio waveform state */
    this._waveRaf      = null;         // rAF handle for audio-driven waveform loop
    this._analyser     = null;         // AnalyserNode (passed in via connectAnalyser)
    this._analyserData = null;         // Uint8Array frequency buffer
    this._smoothed     = new Float32Array(9).fill(0.15); // per-bar exponential smooth
    /* Transcript state */
    this._transcriptVisible = false;
  }

  connectedCallback() {
    this._render();
  }

  /* ── Public API ─────────────────────────────────────────────────────────── */

  /**
   * Display the listening overlay exactly over the input field.
   */
  show(inputRect, wrapperRect) {
    this._applyRect(inputRect, wrapperRect);
    this.removeAttribute('hidden');
    this.style.display = '';
    void this.offsetHeight;
    requestAnimationFrame(() => {
      const card = this.shadowRoot?.querySelector('.vm-card');
      const bg   = this.shadowRoot?.querySelector('.vm-bg');
      if (card) { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }
      if (bg)   { bg.style.opacity   = '1'; }
    });
  }

  /**
   * Update the overlay position every rAF frame (follows panel on drag).
   */
  updatePosition(inputRect, wrapperRect) {
    this._applyRect(inputRect, wrapperRect);
  }

  /**
   * Apply viewport-fixed coords matching the panel wrapper's bounds exactly.
   */
  _applyRect(inputRect, wrapperRect) {
    if (!wrapperRect) return;
    this.style.position = 'fixed';
    this.style.left   = wrapperRect.left + 'px';
    this.style.right  = (window.innerWidth  - wrapperRect.right)  + 'px';
    this.style.top    = wrapperRect.top  + 'px';
    this.style.bottom = (window.innerHeight - wrapperRect.bottom) + 'px';
    this.style.height = 'auto';
    this.style.borderRadius = '30px';
    this.style.overflow = 'hidden';
    this.style.paddingBottom = (wrapperRect.bottom - inputRect.bottom) + 'px';
    this.style.setProperty('--vm-card-ml', (inputRect.left  - wrapperRect.left)  + 'px');
    this.style.setProperty('--vm-card-mr', (wrapperRect.right - inputRect.right) + 'px');
  }

  /** Dismiss the overlay: fade out, stop audio waveform RAF, reset transcript. */
  hide() {
    const card = this.shadowRoot?.querySelector('.vm-card');
    const bg   = this.shadowRoot?.querySelector('.vm-bg');
    if (card) { card.style.opacity = '0'; card.style.transform = 'translateY(-10px)'; }
    if (bg)   { bg.style.opacity   = '0'; }
    setTimeout(() => {
      this.style.display = 'none';
      /* Reset transcript for next session */
      this._resetTranscript();
    }, 300);
    /* Stop audio-driven waveform */
    this._stopWaveformRaf();
  }

  /**
   * Update live transcript display inside the card.
   *
   * @param {string} confirmed  — final corrected words (solid text)
   * @param {string} interim    — live partial recognition (ghost text)
   */
  setTranscript(confirmed, interim) {
    const vmText    = this.shadowRoot?.querySelector('.vm-text');
    const vmTrans   = this.shadowRoot?.querySelector('.vm-transcript');
    const tcEl      = this.shadowRoot?.querySelector('.vm-tc');
    const tiEl      = this.shadowRoot?.querySelector('.vm-ti');
    if (!vmTrans || !tcEl || !tiEl) return;

    const hasContent = !!(confirmed || interim);

    if (hasContent && !this._transcriptVisible) {
      /* First words — fade out "Hi, I'm listening" and reveal transcript zone */
      this._transcriptVisible = true;
      if (vmText) {
        vmText.style.transition = 'opacity 0.3s ease, max-height 0.3s ease';
        vmText.style.opacity    = '0';
        vmText.style.maxHeight  = '0';
        vmText.style.overflow   = 'hidden';
        vmText.style.margin     = '0';
      }
      vmTrans.style.display  = 'block';
      vmTrans.style.opacity  = '0';
      requestAnimationFrame(() => {
        vmTrans.style.transition = 'opacity 0.3s ease';
        vmTrans.style.opacity    = '1';
      });
    } else if (!hasContent && this._transcriptVisible) {
      /* All text cleared — restore welcome text */
      this._resetTranscript();
    }

    tcEl.textContent = confirmed || '';
    /* Interim text: append with a space separator */
    tiEl.textContent = interim ? (confirmed ? ' ' + interim : interim) : '';

    /* Auto-scroll transcript to bottom */
    vmTrans.scrollTop = vmTrans.scrollHeight;
  }

  /**
   * Update the hint text inside the card (status / error messages).
   * Safe to call at any time; ignored once transcript becomes visible.
   * @param {string} html — inner HTML for the hint paragraph
   */
  setHint(html) {
    const vmText = this.shadowRoot?.querySelector('.vm-text');
    if (!vmText || this._transcriptVisible) return;
    vmText.innerHTML  = html;
    vmText.style.opacity   = '1';
    vmText.style.maxHeight = '';
    vmText.style.overflow  = '';
    vmText.style.margin    = '';
  }

  /**
   * Connect a Web Audio API AnalyserNode to drive the waveform bars in real time.
   * Call this after getUserMedia + createMediaStreamSource + createAnalyser.
   *
   * @param {AnalyserNode} analyserNode
   */
  connectAnalyser(analyserNode) {
    this._analyser     = analyserNode;
    this._analyserData = new Uint8Array(analyserNode.frequencyBinCount);
    /* Reset smoothing state */
    this._smoothed.fill(0.15);
    this._startWaveformRaf();
  }

  /* ── Waveform: audio-driven rAF loop ────────────────────────────────────── */

  _startWaveformRaf() {
    const bars = [...(this.shadowRoot?.querySelectorAll('.vm-bar') || [])];
    if (!bars.length) return;

    /* Suspend the CSS keyframe animation — JS takes over */
    bars.forEach(b => {
      b.style.animation = 'none';
      b.style.transition = 'height 55ms ease-out';
    });

    /* Natural maximum heights for the mountain profile (bars 0–8) */
    const maxH = [14, 24, 38, 50, 56, 50, 38, 24, 14];

    /*
     * Map 9 bars into the voice-frequency range.
     * For fftSize=1024: frequencyBinCount=512, each bin ≈ 43 Hz.
     * Voice band: ~80 Hz (bin 2) to ~4 kHz (bin 93).
     * We use log-spaced bands within that range so lower frequencies
     * (fundamental pitch) drive the outer bars and mid-frequencies
     * (formants, harmonics) drive the center bars.
     */
    const LOW_BIN  = 2;    // ~86 Hz
    const HIGH_BIN = 93;   // ~4 kHz
    const logLow   = Math.log(LOW_BIN  + 1);
    const logHigh  = Math.log(HIGH_BIN + 1);

    const getBinRange = (barIdx) => {
      const t0 = barIdx       / 9;
      const t1 = (barIdx + 1) / 9;
      const start = Math.round(Math.exp(logLow + t0 * (logHigh - logLow)) - 1);
      const end   = Math.round(Math.exp(logLow + t1 * (logHigh - logLow)) - 1);
      return [Math.max(LOW_BIN, start), Math.min(HIGH_BIN, Math.max(start + 1, end))];
    };

    const tick = () => {
      if (!this._analyser) return;
      this._analyser.getByteFrequencyData(this._analyserData);

      bars.forEach((bar, i) => {
        const [lo, hi] = getBinRange(i);
        let sum = 0;
        for (let b = lo; b < hi; b++) sum += this._analyserData[b];
        const raw = sum / (hi - lo) / 255; // 0–1

        /* Exponential smoothing: fast rise (0.45), slow fall (0.85) */
        const alpha = raw > this._smoothed[i] ? 0.45 : 0.85;
        this._smoothed[i] = this._smoothed[i] * alpha + raw * (1 - alpha);

        /* Scale to 10%–100% of the bar's natural max height */
        const scale = 0.10 + this._smoothed[i] * 0.90;
        bar.style.height = (maxH[i] * scale).toFixed(1) + 'px';
      });

      this._waveRaf = requestAnimationFrame(tick);
    };

    if (this._waveRaf) cancelAnimationFrame(this._waveRaf);
    this._waveRaf = requestAnimationFrame(tick);
  }

  _stopWaveformRaf() {
    if (this._waveRaf) {
      cancelAnimationFrame(this._waveRaf);
      this._waveRaf = null;
    }
    /* Restore CSS keyframe animation on bars */
    const bars = this.shadowRoot?.querySelectorAll('.vm-bar');
    bars?.forEach(b => {
      b.style.animation  = '';
      b.style.transition = '';
      b.style.height     = '';
    });
    this._analyser     = null;
    this._analyserData = null;
    this._smoothed.fill(0.15);
  }

  /* ── Reset transcript display ───────────────────────────────────────────── */
  _resetTranscript() {
    this._transcriptVisible = false;
    const vmText  = this.shadowRoot?.querySelector('.vm-text');
    const vmTrans = this.shadowRoot?.querySelector('.vm-transcript');
    const tcEl    = this.shadowRoot?.querySelector('.vm-tc');
    const tiEl    = this.shadowRoot?.querySelector('.vm-ti');

    if (vmText) {
      vmText.innerHTML   = "Hi, I'm listening.<br>Talk to me naturally.";
      vmText.style.transition = '';
      vmText.style.opacity    = '';
      vmText.style.maxHeight  = '';
      vmText.style.overflow   = '';
      vmText.style.margin     = '';
    }
    if (vmTrans) {
      vmTrans.style.display  = 'none';
      vmTrans.style.opacity  = '';
      vmTrans.style.transition = '';
    }
    if (tcEl) tcEl.textContent = '';
    if (tiEl) tiEl.textContent = '';
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  _render() {
    this.shadowRoot.innerHTML = `
<style>
/* ── Host: fixed overlay matching panel bounds exactly ───────────────────── */
:host {
  position: fixed;
  left: 0; right: 0; top: 0; bottom: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-end;
  padding: 0;
  border-radius: 30px;
  overflow: hidden;
  pointer-events: none;
}

/* ── Animated gradient background ───────────────────────────────────────── */
.vm-bg {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.vm-blob {
  position: absolute;
  border-radius: 50%;
  will-change: transform;
}

.vm-blob--1 {
  width: 70%;
  padding-bottom: 70%;
  background: radial-gradient(circle, rgba(93,54,255,0.55) 0%, rgba(93,54,255,0) 70%);
  top: -15%; left: -15%;
  filter: blur(32px);
  animation: vm-drift-1 5s ease-in-out infinite alternate;
}

.vm-blob--2 {
  width: 60%;
  padding-bottom: 60%;
  background: radial-gradient(circle, rgba(161,0,194,0.45) 0%, rgba(161,0,194,0) 70%);
  bottom: 5%; right: -10%;
  filter: blur(40px);
  animation: vm-drift-2 6s ease-in-out infinite alternate;
  animation-delay: -2s;
}

.vm-blob--3 {
  width: 50%;
  padding-bottom: 50%;
  background: radial-gradient(circle, rgba(120,88,255,0.35) 0%, rgba(120,88,255,0) 70%);
  top: 25%; left: 20%;
  filter: blur(48px);
  animation: vm-drift-3 7s ease-in-out infinite alternate;
  animation-delay: -4s;
}

@keyframes vm-drift-1 {
  0%   { transform: translate(0,    0)    scale(1.00); }
  33%  { transform: translate(6%,   8%)   scale(1.06); }
  66%  { transform: translate(-4%,  12%)  scale(0.94); }
  100% { transform: translate(10%,  -6%)  scale(1.08); }
}
@keyframes vm-drift-2 {
  0%   { transform: translate(0,    0)    scale(1.00); }
  40%  { transform: translate(-8%,  -6%)  scale(1.05); }
  80%  { transform: translate(4%,   8%)   scale(0.96); }
  100% { transform: translate(-6%,  4%)   scale(1.04); }
}
@keyframes vm-drift-3 {
  0%   { transform: translate(0,    0)    scale(1.00); }
  50%  { transform: translate(-10%, 6%)   scale(1.10); }
  100% { transform: translate(8%,   -10%) scale(0.92); }
}

.vm-noise {
  position: absolute; inset: 0;
  background: rgba(255,255,255,0.06);
  pointer-events: none;
}

/* ── Voice Mode Card ─────────────────────────────────────────────────────── */
.vm-card {
  position: relative;
  margin-left:  var(--vm-card-ml, 16px);
  margin-right: var(--vm-card-mr, 16px);
  background: rgba(131, 150, 168, 0.09);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0px 2px 16px 0px rgba(93, 54, 255, 0.2);
  padding: 32px 16px 26px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  pointer-events: auto;
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Center content: waveform + transcript/text ─────────────────────────── */
.vm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 0 16px;
}

/* ── Animated waveform bars ─────────────────────────────────────────────── */
.vm-waveform {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 56px;
  flex-shrink: 0;
}

.vm-bar {
  width: 5px;
  border-radius: 100px;
  background: linear-gradient(180deg, #5d36ff 0%, #a100c2 100%);
  animation: vm-wave 0.9s ease-in-out infinite alternate;
  transform-origin: center center;
  flex-shrink: 0;
}

/* Staggered heights and delays — symmetric mountain waveform shape */
.vm-bar:nth-child(1) { height: 14px; animation-delay: 0.00s; }
.vm-bar:nth-child(2) { height: 24px; animation-delay: 0.12s; }
.vm-bar:nth-child(3) { height: 38px; animation-delay: 0.24s; }
.vm-bar:nth-child(4) { height: 50px; animation-delay: 0.36s; }
.vm-bar:nth-child(5) { height: 56px; animation-delay: 0.48s; }
.vm-bar:nth-child(6) { height: 50px; animation-delay: 0.36s; }
.vm-bar:nth-child(7) { height: 38px; animation-delay: 0.24s; }
.vm-bar:nth-child(8) { height: 24px; animation-delay: 0.12s; }
.vm-bar:nth-child(9) { height: 14px; animation-delay: 0.00s; }

@keyframes vm-wave {
  0%   { transform: scaleY(0.2); opacity: 0.7; }
  100% { transform: scaleY(1);   opacity: 1;   }
}

/* ── Transcription display zone ─────────────────────────────────────────── */
/* Hidden by default; shown (via JS) once first words are recognised.        */
/* Replaces .vm-text — expands card upward as transcript grows.              */
.vm-transcript {
  display: none;  /* toggled to block by setTranscript() */
  width: 100%;
  max-height: 220px;
  overflow-y: auto;
  overscroll-behavior: contain;
  /* Custom scrollbar — thin + branded */
  scrollbar-width: thin;
  scrollbar-color: rgba(93,54,255,0.3) transparent;
  font-family: '72', var(--sapFontFamily, sans-serif);
  font-size: 15px;
  line-height: 1.6;
  text-align: left;
  padding: 4px 2px;
  word-break: break-word;
  /* fade-in handled inline by JS */
}

.vm-transcript::-webkit-scrollbar        { width: 4px; }
.vm-transcript::-webkit-scrollbar-thumb  { background: rgba(93,54,255,0.35); border-radius: 4px; }
.vm-transcript::-webkit-scrollbar-track  { background: transparent; }

/* Confirmed — final, auto-corrected words */
.vm-tc {
  font-weight: 500;
  color: #1a1a2e;
}

/* Interim — live partial result, ghost styling */
.vm-ti {
  font-weight: 400;
  font-style: italic;
  color: rgba(93, 54, 255, 0.60);
}

/* ── Static hint text ("Hi, I'm listening…") ───────────────────────────── */
.vm-text {
  font-family: '72', var(--sapFontFamily, sans-serif);
  font-weight: 600;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
  background: linear-gradient(90deg, #5d36ff 3%, #a100c2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  margin: 0;
  flex-shrink: 0;
  /* JS may set max-height + opacity for collapse animation */
  transition: opacity 0.3s ease, max-height 0.3s ease;
}

/* ── Correction badge — briefly shown on verbal corrections ─────────────── */
.vm-correction-badge {
  display: none;
  align-items: center;
  gap: 6px;
  background: rgba(93,54,255,0.12);
  border-radius: 100px;
  padding: 4px 12px;
  font-family: '72', var(--sapFontFamily, sans-serif);
  font-size: 11px;
  font-weight: 500;
  color: #5d36ff;
  flex-shrink: 0;
  animation: vm-badge-in 0.25s ease;
}
.vm-correction-badge.visible { display: flex; }
@keyframes vm-badge-in {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1);   }
}

/* ── Actions row ─────────────────────────────────────────────────────────── */
.vm-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 8px;
}

/* ── Action buttons — chrome pill ───────────────────────────────────────── */
.vm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: none;
  border-radius: 100px;
  cursor: pointer;
  flex-shrink: 0;
  padding: 0;
  transition: background 0.12s ease, transform 0.12s ease;
  position: relative;
}

.vm-btn:hover  { background: rgba(255, 255, 255, 0.97); }
.vm-btn:active { transform: scale(0.95); background: rgba(245, 246, 247, 0.97); }

/* Microphone button: pulsing outer rings when active */
.vm-btn--mic::before {
  content: '';
  position: absolute; inset: -5px;
  border-radius: 100px;
  border: 2px solid rgba(93, 54, 255, 0.35);
  animation: vm-pulse 1.8s ease-in-out infinite;
  pointer-events: none;
}
.vm-btn--mic::after {
  content: '';
  position: absolute; inset: -10px;
  border-radius: 100px;
  border: 1.5px solid rgba(93, 54, 255, 0.15);
  animation: vm-pulse 1.8s ease-in-out infinite;
  animation-delay: 0.35s;
  pointer-events: none;
}

@keyframes vm-pulse {
  0%   { transform: scale(1);    opacity: 0.9; }
  60%  { transform: scale(1.18); opacity: 0.1; }
  100% { transform: scale(1);    opacity: 0.9; }
}

.vm-btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
</style>

<!-- ── Voice Mode Card ──────────────────────────────────────────────────── -->
<div class="vm-card" role="status" aria-live="polite" aria-label="Listening mode active">

  <!-- Animated gradient background -->
  <div class="vm-bg" aria-hidden="true">
    <div class="vm-blob vm-blob--1"></div>
    <div class="vm-blob vm-blob--2"></div>
    <div class="vm-blob vm-blob--3"></div>
    <div class="vm-noise"></div>
  </div>

  <!-- Waveform + transcript/hint text -->
  <div class="vm-content">
    <div class="vm-waveform" aria-hidden="true">
      <div class="vm-bar"></div>
      <div class="vm-bar"></div>
      <div class="vm-bar"></div>
      <div class="vm-bar"></div>
      <div class="vm-bar"></div>
      <div class="vm-bar"></div>
      <div class="vm-bar"></div>
      <div class="vm-bar"></div>
      <div class="vm-bar"></div>
    </div>

    <!-- Live transcription zone — replaces vm-text once speech begins -->
    <div class="vm-transcript" aria-live="polite" aria-atomic="false">
      <span class="vm-tc"></span><span class="vm-ti"></span>
    </div>

    <!-- "Correction applied" badge -->
    <div class="vm-correction-badge" aria-live="polite">
      ✦ Correction applied
    </div>

    <!-- Static hint — fades out when first words arrive -->
    <p class="vm-text">Hi, I'm listening.<br>Talk to me naturally.</p>
  </div>

  <!-- Action buttons -->
  <div class="vm-actions">
    <!-- Microphone — active / pulsing -->
    <button class="vm-btn vm-btn--mic" data-act="mic" title="Microphone active" aria-label="Microphone active">
      <span class="vm-btn-icon">${ICON_MICROPHONE}</span>
    </button>
    <!-- Close / dismiss -->
    <button class="vm-btn vm-btn--close" data-act="close" title="Stop listening" aria-label="Stop listening">
      <span class="vm-btn-icon">${ICON_DECLINE}</span>
    </button>
  </div>

</div><!-- /vm-card -->
`;

    /* ── Bind button events ─────────────────────────────────────────────── */
    this.shadowRoot.querySelector('[data-act="close"]')?.addEventListener('click', () => {
      this.hide();
      this._emit('joule-listening-stop');
    });

    this.shadowRoot.querySelector('[data-act="mic"]')?.addEventListener('click', () => {
      this.hide();
      this._emit('joule-listening-stop');
    });
  }

  /* ── Show correction badge briefly ─────────────────────────────────────── */
  flashCorrectionBadge() {
    const badge = this.shadowRoot?.querySelector('.vm-correction-badge');
    if (!badge) return;
    badge.classList.add('visible');
    clearTimeout(this._badgeTimer);
    this._badgeTimer = setTimeout(() => badge.classList.remove('visible'), 2000);
  }

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  _emit(name, detail = {}) {
    this.dispatchEvent(new CustomEvent(name, { bubbles: true, composed: true, detail }));
  }
}

customElements.define('joule-listening', JouleListening);