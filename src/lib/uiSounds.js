// src/lib/uiSounds.js
// Sons de interface (beep/click/erro) sem arquivos externos.
// Usa WebAudio com envelopes bem curtinhos, estilo PC antigo.

let ctx;

const LS_KEY = "ordem_sound_enabled";
let enabled = true;

try {
  const v = localStorage.getItem(LS_KEY);
  if (v === "0") enabled = false;
  if (v === "1") enabled = true;
} catch {
  // sem localStorage? tudo bem
}

export function getSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(next) {
  enabled = !!next;
  try {
    localStorage.setItem(LS_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

export async function unlockAudio() {
  try {
    const c = getCtx();
    if (c.state === "suspended") await c.resume();
  } catch {
    // ignore
  }
}

function getCtx() {
  if (!ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioContext();
  }
  return ctx;
}

function tone({ freq = 440, duration = 0.06, type = "square", gain = 0.06 } = {}) {
  if (!enabled) return;
  const c = getCtx();
  if (c.state === "suspended") {
    // precisa de interação do usuário: deixa o caller tentar depois
    c.resume().catch(() => {});
  }

  const o = c.createOscillator();
  const g = c.createGain();

  o.type = type;
  o.frequency.value = freq;

  const now = c.currentTime;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  o.connect(g);
  g.connect(c.destination);

  o.start(now);
  o.stop(now + duration + 0.02);
}

export function playClick() {
  // clique seco
  tone({ freq: 920, duration: 0.03, type: "square", gain: 0.05 });
}

export function playBeep() {
  // beep de foco/confirmação
  tone({ freq: 660, duration: 0.05, type: "square", gain: 0.055 });
}

export function playError() {
  // “erro” em dois tons
  tone({ freq: 220, duration: 0.07, type: "square", gain: 0.06 });
  setTimeout(() => {
    tone({ freq: 165, duration: 0.08, type: "square", gain: 0.06 });
  }, 60);
}
