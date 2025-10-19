// WebAudio minimal manager with oscillator beeps (no assets)
window.AudioMgr = (function(){
  const ctx = new (window.AudioContext||window.webkitAudioContext||function(){})();
  let musicNode = null;
  let siren = null;
  function canUse(){ return !!ctx && ctx.state !== 'suspended'; }
  function resume(){ if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function playMusic(){ if (!canUse() || !GameState.state.music) return; stopMusic();
    const o = ctx.createOscillator(); const g = ctx.createGain(); o.type='sine'; o.frequency.value=110;
    g.gain.value=0.03; o.connect(g); g.connect(ctx.destination); o.start(); musicNode={o,g}; }
  function stopMusic(){ if (musicNode){ musicNode.o.stop(); musicNode.g.disconnect(); musicNode=null; } }
  function click(){ if (!GameState.state.sfx || !canUse()) return; const o=ctx.createOscillator(); const g=ctx.createGain(); o.type='square'; o.frequency.value=880; g.gain.value=0.05; o.connect(g); g.connect(ctx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.1); o.stop(ctx.currentTime+0.12); }
  function crash(){ if (!GameState.state.sfx || !canUse()) return; const o=ctx.createOscillator(); const g=ctx.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(440, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(60, ctx.currentTime+0.4); g.gain.value=0.1; o.connect(g); g.connect(ctx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.4); o.stop(ctx.currentTime+0.45); }
  function sirenStart(){ if (!GameState.state.sfx || !canUse() || siren) return; const g=ctx.createGain(); g.gain.value=0.04; const o1=ctx.createOscillator(); const o2=ctx.createOscillator(); o1.type='sine'; o2.type='sine'; o1.frequency.value=650; o2.frequency.value=520; const lfo=ctx.createOscillator(); const lfoGain=ctx.createGain(); lfo.frequency.value=2; lfoGain.gain.value=0.03; lfo.connect(lfoGain); lfoGain.connect(g.gain); o1.connect(g); o2.connect(g); g.connect(ctx.destination); o1.start(); o2.start(); lfo.start(); siren={g,o1,o2,lfo,lfoGain}; }
  function sirenStop(){ if (siren){ siren.o1.stop(); siren.o2.stop(); siren.lfo.stop(); siren.g.disconnect(); siren=null; } }
  return { resume, playMusic, stopMusic, click, crash, sirenStart, sirenStop };
})();
