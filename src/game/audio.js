// WebAudio minimal manager with oscillator beeps (no assets)
window.AudioMgr = (function(){
  const ctx = new (window.AudioContext||window.webkitAudioContext||function(){})();
  let musicNode = null;
  let siren = null;
  function canUse(){ return !!ctx && ctx.state !== 'suspended'; }
  function resume(){ /* audio disabled */ }
  function playMusic(){ /* disabled */ }
  function stopMusic(){ try{ if (musicNode){ musicNode.o.stop(); musicNode.g.disconnect(); musicNode=null; } }catch(e){} }
  function click(){ /* disabled */ }
  function crash(){ /* disabled */ }
  function sirenStart(){ /* disabled */ }
  function sirenStop(){ try{ if (siren){ siren.o1.stop(); siren.o2.stop(); siren.lfo.stop(); siren.g.disconnect(); siren=null; } }catch(e){} }
  return { resume, playMusic, stopMusic, click, crash, sirenStart, sirenStop };
})();
