// Game state, persistence via localStorage
window.GameState = (function(){
  const KEY = 'escape_rush_state_v1';
  const defaults = {
    highScore: 0,
    music: true,
    sfx: true,
    removeAds: false,
    skin: 'red',
    sensitivity: 1.0,
    showFps: false,
    invertSteer: true
  };
  function load(){
    try { return { ...defaults, ...(JSON.parse(localStorage.getItem(KEY))||{}) }; }
    catch { return { ...defaults }; }
  }
  function save(state){
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }
  const state = load();
  function set(k,v){ state[k]=v; save(state); }
  return { state, set, save };
})();
