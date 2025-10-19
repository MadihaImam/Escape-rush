// UI wiring and helpers for overlays
window.UI = (function(){
  const $ = (id)=>document.getElementById(id);
  const show = (el)=>{ el.classList.remove('hidden'); el.classList.add('show'); };
  const hide = (el)=>{ el.classList.add('hidden'); el.classList.remove('show'); };
  const overlays = {
    main: $('overlay-main'), hud: $('overlay-hud'), pause: $('overlay-pause'),
    gameover: $('overlay-gameover'), settings: $('overlay-settings'), shop: $('overlay-shop')
  };
  const btn = {
    start: $('btn-start'), settings: $('btn-settings'), shop: $('btn-shop'),
    pause: $('btn-pause'), resume: $('btn-resume'), exit: $('btn-exit'),
    restart: $('btn-restart'), cont: $('btn-continue'), menu: $('btn-menu'),
    settingsBack: $('btn-settings-back'), shopBack: $('btn-shop-back'),
    removeAds: $('btn-remove-ads')
  };
  const hudScore = $('hud-score');
  const hudBest = $('hud-highscore');
  const hudFps = $('hud-fps');
  const finalScore = $('final-score');
  const toggleMusic = $('toggle-music');
  const toggleSfx = $('toggle-sfx');
  const toggleFps = $('toggle-fps');
  const rangeSens = $('range-sens');

  function syncSettings(){
    toggleMusic.checked = !!GameState.state.music;
    toggleSfx.checked = !!GameState.state.sfx;
    toggleFps.checked = !!GameState.state.showFps;
    rangeSens.value = GameState.state.sensitivity || 1.0;
    setFpsVisible(!!GameState.state.showFps);
  }
  function setScore(s){ hudScore.textContent = `Score: ${Math.floor(s)}`; }
  function setBest(b){ hudBest.textContent = `Best: ${Math.floor(b)}`; }
  function setFinal(s){ finalScore.textContent = `Score: ${Math.floor(s)}`; }
  function setFps(v){ hudFps.textContent = `FPS: ${Math.round(v)}`; }
  function setFpsVisible(v){ if (v) hudFps.classList.remove('hidden'); else hudFps.classList.add('hidden'); }
  function getSensitivity(){ return parseFloat(rangeSens.value || '1'); }

  return { $, show, hide, overlays, btn, setScore, setBest, setFinal, setFps, setFpsVisible, getSensitivity, toggleMusic, toggleSfx, toggleFps, rangeSens, syncSettings, hudFps };
})();
