// Monetization stubs
window.Monetization = (function(){
  async function showRewardedAd(){
    console.log('[Ads] showRewardedAd() called');
    await new Promise(r=>setTimeout(r, 1200));
    console.log('[Ads] rewarded: success');
    return true; // pretend success
  }
  async function purchaseUpgrade(){
    console.log('[IAP] purchaseUpgrade() called');
    await new Promise(r=>setTimeout(r, 800));
    console.log('[IAP] purchase: success');
    return true;
  }
  return { showRewardedAd, purchaseUpgrade };
})();
