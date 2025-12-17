"use strict";
// Simple audio synthesis library (no external files)
// Generates sound using Web Audio API
let audioContext = null;
function ensureAudioContext(){
  if(audioContext) return audioContext;
  try{
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    // Some browsers require a user gesture to resume audio
    if(audioContext.state === 'suspended'){
      const resume = ()=>{ audioContext.resume().catch(()=>{}); removeListeners(); };
      const removeListeners = ()=>{ document.removeEventListener('pointerdown', resume); document.removeEventListener('keydown', resume); };
      document.addEventListener('pointerdown', resume, {once:true});
      document.addEventListener('keydown', resume, {once:true});
    }
    return audioContext;
  } catch(e){
    console.warn('Audio context unavailable:', e);
    audioContext = null;
    return null;
  }
}

const Audio = {
  playFootstep() {
    const ac = ensureAudioContext(); if(!ac) return;
    try {
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch(e) { console.warn('Footstep sound failed:', e); }
  },

  playJump() {
    const ac = ensureAudioContext(); if(!ac) return;
    try {
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.15);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch(e) { console.warn('Jump sound failed:', e); }
  },

  playPickup() {
    const ac = ensureAudioContext(); if(!ac) return;
    try {
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.2);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      osc.start(t);
      osc.stop(t + 0.2);
    } catch(e) { console.warn('Pickup sound failed:', e); }
  },

  playDanger() {
    const ac = ensureAudioContext(); if(!ac) return;
    try {
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.setValueAtTime(600, t + 0.1);
      osc.frequency.setValueAtTime(800, t + 0.2);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch(e) { console.warn('Danger sound failed:', e); }
  },
};
