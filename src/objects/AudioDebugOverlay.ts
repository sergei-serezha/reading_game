import Phaser from 'phaser';
import { SAY_TO_LETTER_DELAY_MS, LETS_FIND_TO_LETTER_DELAY_MS } from '../config/Constants';

/**
 * Debug overlay with sliders to tune audio prompt delays at runtime.
 * Open/close with backtick (`) in Level 1 or Level 2.
 * Values are persisted to localStorage so they survive page reloads.
 *
 * Cleanup path: once right delays are found, update Constants.ts defaults,
 * then delete this file and remove the backtick listener from both scenes.
 */
export class AudioDebugOverlay {
  private domElement: Phaser.GameObjects.DOMElement;

  constructor(scene: Phaser.Scene) {
    const sayVal = parseInt(localStorage.getItem('dbg_say_delay') ?? String(SAY_TO_LETTER_DELAY_MS), 10);
    const letsFindVal = parseInt(localStorage.getItem('dbg_letsfind_delay') ?? String(LETS_FIND_TO_LETTER_DELAY_MS), 10);

    const html = `
<div id="audio-dbg" style="
  position:absolute;
  top:12px; right:12px;
  background:rgba(0,0,0,0.82);
  color:#fff;
  font:12px monospace;
  padding:14px 16px;
  border:2px solid #888;
  border-radius:6px;
  min-width:260px;
  z-index:9999;
  user-select:none;
">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
    <span style="font-weight:bold;letter-spacing:1px;">AUDIO DELAY DEBUG</span>
    <button id="dbg-close" style="background:none;border:1px solid #888;color:#fff;cursor:pointer;padding:2px 7px;font-size:12px;">×</button>
  </div>

  <label>Say → Phoneme: <span id="say-val">${sayVal}</span> ms</label><br>
  <input id="say-slider" type="range" min="0" max="1500" step="25" value="${sayVal}"
    style="width:100%;margin:4px 0 12px;">

  <label>Let's Find → Phoneme: <span id="lf-val">${letsFindVal}</span> ms</label><br>
  <input id="lf-slider" type="range" min="0" max="1500" step="25" value="${letsFindVal}"
    style="width:100%;margin:4px 0 4px;">

  <div style="margin-top:8px;font-size:10px;color:#aaa;">
    Press \` to close &nbsp;·&nbsp; values auto-saved
  </div>
</div>`;

    this.domElement = scene.add.dom(0, 0).createFromHTML(html);
    this.domElement.setOrigin(0, 0);
    this.domElement.setDepth(1000);

    const el = this.domElement.node as HTMLElement;

    const saySlider = el.querySelector('#say-slider') as HTMLInputElement;
    const sayDisplay = el.querySelector('#say-val') as HTMLElement;
    saySlider.addEventListener('input', () => {
      sayDisplay.textContent = saySlider.value;
      localStorage.setItem('dbg_say_delay', saySlider.value);
    });

    const lfSlider = el.querySelector('#lf-slider') as HTMLInputElement;
    const lfDisplay = el.querySelector('#lf-val') as HTMLElement;
    lfSlider.addEventListener('input', () => {
      lfDisplay.textContent = lfSlider.value;
      localStorage.setItem('dbg_letsfind_delay', lfSlider.value);
    });

    const closeBtn = el.querySelector('#dbg-close') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => {
      this.destroy();
      // Notify parent scene to clear its reference
      scene.events.emit('audioDebugOverlayClosed');
    });
  }

  destroy(): void {
    this.domElement.destroy();
  }
}
