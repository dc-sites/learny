// ads.js - Professional Ad System v6.7 (Optimized Offer & Clean Code)
// =====================================

const firebaseConfig = {
  apiKey: "AIzaSyBuafsG2a7I5WRTcwvP2CgNv452L4BzHls",
  authDomain: "learny-ec06f.firebaseapp.com",
  projectId: "learny-ec06f",
  storageBucket: "learny-ec06f.firebasestorage.app",
  messagingSenderId: "65568577957",
  appId: "1:65568577957:web:ef9f6dae41aeec20d7b04c",
  measurementId: "G-MSYGVV8LBJ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function getTodaySL() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Colombo' })).toISOString().split('T')[0];
}
const today = getTodaySL();

const viewedAds = new Set();
const clickedAds = new Set();
let bannerAdsQueue = [];
let offerInterval = null;

function fixUrl(url) {
  if (!url) return '#';
  url = url.trim();
  return url.startsWith('http://') || url.startsWith('https://') ? url : 'https://' + url;
}

// 🎠 Banner Carousel Class
class BannerCarousel {
  constructor(containerId, delay = 5000) {
    this.container = document.getElementById(containerId);
    this.delay = delay;
    this.currentIndex = 0;
    this.interval = null;
    if (!this.container) {
      console.warn(`⚠️ Banner container not found: ${containerId}`);
      return;
    }
    console.log(`✅ Carousel initialized for: ${containerId}`);
    this.start();
  }

  start() {
    if (bannerAdsQueue.length === 0) {
      this.container.innerHTML = '';
      return;
    }
    this.showAd(bannerAdsQueue[0], bannerAdsQueue[0].id);
    if (bannerAdsQueue.length > 1) {
      this.interval = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % bannerAdsQueue.length;
        this.showAd(bannerAdsQueue[this.currentIndex], bannerAdsQueue[this.currentIndex].id);
      }, this.delay);
    }
  }

  showAd(ad, id) {
    if (!this.container || this.container.querySelector(`[data-ad-id="${id}"]`)) return;

    const indicators = bannerAdsQueue.length > 1 ? `
      <div class="carousel-indicators" style="display:flex; justify-content:center; gap:6px; margin:10px 0 0; padding:0 16px;">
        ${bannerAdsQueue.map((_, i) => `<div class="indicator ${i === this.currentIndex ? 'active' : ''}" 
              onclick="window.carousels.forEach(c => c.jumpTo(${i}))"></div>`).join('')}
      </div>
    ` : '';

    this.container.innerHTML = `
      <style>
        .pro-banner { background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; display: flex; align-items: center; gap: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); animation: fadeIn 0.3s ease; position:relative; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
        .pro-banner-logo { width: 64px; height: 64px; object-fit: contain; border-radius: 6px; background: #f9fafb; padding: 4px; flex-shrink: 0; }
        .pro-banner-content { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .pro-banner-desc { font-size: 13px; color: #374151; line-height: 1.4; margin: 0; }
        .pro-banner-btn { display: inline-block; padding: 7px 16px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 13px; width: fit-content; transition: background 0.2s; }
        .pro-banner-btn:hover { background: #2563eb; }
        .indicator { width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; cursor: pointer; transition: all 0.2s; }
        .indicator.active { background: #3b82f6; transform: scale(1.1); }
        .ad-info-inline { position:absolute; top:8px; right:8px; background:none; border:none; cursor:pointer; color:#9ca3af; font-size:16px; transition:color 0.2s; padding:4px; }
        .ad-info-inline:hover { color:#3b82f6; }
        @media (max-width: 768px) { .pro-banner { flex-direction: column; text-align: center; padding: 12px; } .pro-banner-logo { width: 48px; height: 48px; } .pro-banner-desc { font-size: 12px; } }
      </style>
      <div class="pro-banner" data-ad-id="${id}">
        <button class="ad-info-inline" onclick="toggleInfoTooltip()" title="Ad info"><i class="fas fa-info-circle"></i></button>
        <img src="${ad.imageUrl}" alt="Ad" class="pro-banner-logo">
        <div class="pro-banner-content">
          <p class="pro-banner-desc">${ad.description}</p>
          <a href="#" class="pro-banner-btn ad-click-btn" data-id="${id}" data-url="${ad.buttonUrl}">${ad.buttonText || 'Learn More'}</a>
        </div>
      </div>
      ${indicators}
      <div id="ad-info-tooltip-banner" style="position:absolute; bottom:-40px; right:0; background:#1f2937; color:#fff; padding:10px 14px; border-radius:6px; font-size:13px; white-space:nowrap; opacity:0; transform:translateY(8px); transition:all 0.2s; pointer-events:none; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:10;">
        Get premium to hide ads
        <div style="position:absolute; top:-6px; right:12px; width:12px; height:12px; background:#1f2937; transform:rotate(45deg);"></div>
      </div>`;

    document.querySelectorAll(`.ad-click-btn[data-id="${id}"]`).forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        if (clickedAds.has(id)) return;
        clickedAds.add(id);
        trackAdEvent(id, 'clicks');
        setTimeout(() => window.location.href = fixUrl(btn.getAttribute('data-url')), 300);
      });
    });
    trackViewOnce(id);
  }

  jumpTo(index) {
    if (this.interval) clearInterval(this.interval);
    this.currentIndex = index;
    this.showAd(bannerAdsQueue[index], bannerAdsQueue[index].id);
    if (bannerAdsQueue.length > 1) {
      this.interval = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % bannerAdsQueue.length;
        this.showAd(bannerAdsQueue[this.currentIndex], bannerAdsQueue[this.currentIndex].id);
      }, this.delay);
    }
  }
}

window.toggleInfoTooltip = function() {
  const tooltip = document.getElementById('ad-info-tooltip-banner');
  if (!tooltip) return;
  const isVisible = tooltip.style.opacity === '1';
  tooltip.style.opacity = isVisible ? '0' : '1';
  tooltip.style.transform = isVisible ? 'translateY(8px)' : 'translateY(0)';
};

//  Premium Offer Container (Optimized to prevent flickering)
function renderPremiumOffer(offer) {
  const container = document.getElementById('offer-ad-container');
  if (!container) return;

  const endDate = new Date(offer.endDate + 'T23:59:59').getTime();

  // 1. Build HTML Structure Once (prevents reloading/flickering)
  container.innerHTML = `
    <style>
      .offer-banner {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-left: 4px solid #f59e0b;
        border-radius: 8px;
        padding: 16px 40px 16px 16px;
        margin: 20px auto;
        max-width: 800px;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        animation: offerFadeIn 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      @keyframes offerFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      
      .offer-close-btn {
        position: absolute; top: 10px; right: 12px;
        background: #f3f4f6; border: none; color: #6b7280;
        width: 24px; height: 24px; border-radius: 50%;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        font-size: 16px; font-weight: bold; transition: all 0.2s; line-height: 1; z-index: 2;
      }
      .offer-close-btn:hover { background: #e5e7eb; color: #374151; transform: scale(1.05); }
      
      .offer-icon-box { width: 48px; height: 48px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #d97706; flex-shrink: 0; }
      .offer-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
      .offer-title { font-size: 15px; font-weight: 700; color: #111827; margin: 0; display: flex; align-items: center; gap: 6px; }
      .offer-badge { background: #fef3c7; color: #92400e; font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; }
      .offer-desc { font-size: 12px; color: #6b7280; margin: 0; line-height: 1.3; }
      .offer-price { font-size: 18px; font-weight: 800; color: #dc2626; line-height: 1; margin-top: 2px; }
      
      .offer-right { display: flex; align-items: center; gap: 16px; flex-shrink: 0; }
      .offer-timer { display: flex; gap: 6px; }
      .timer-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; padding: 6px 8px; text-align: center; min-width: 38px; }
      .timer-value { font-size: 14px; font-weight: 700; color: #111827; line-height: 1; font-family: monospace; }
      .timer-label { font-size: 8px; color: #9ca3af; text-transform: uppercase; font-weight: 600; margin-top: 2px; }
      
      .offer-btn { padding: 8px 16px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #fff; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 13px; box-shadow: 0 2px 4px rgba(245,158,11,0.2); transition: all 0.2s ease; white-space: nowrap; }
      .offer-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(245,158,11,0.3); }
      
      @media (max-width: 768px) {
        .offer-banner { flex-direction: column; text-align: center; padding: 16px 40px 12px 12px; margin: 15px 10px; gap: 12px; border-left: none; border-top: 4px solid #f59e0b; }
        .offer-close-btn { top: 8px; right: 8px; }
        .offer-icon-box { display: none; }
        .offer-info { align-items: center; }
        .offer-title { justify-content: center; }
        .offer-right { flex-direction: column; gap: 10px; width: 100%; }
        .offer-timer { justify-content: center; width: 100%; }
        .timer-box { flex: 1; min-width: auto; }
        .offer-btn { width: 100%; }
      }
    </style>
    <div class="offer-banner">
      <button class="offer-close-btn" onclick="this.parentElement.parentElement.innerHTML=''">&times;</button>
      <div class="offer-icon-box"><i class="fas fa-crown"></i></div>
      <div class="offer-info">
        <p class="offer-title">Premium Upgrade <span class="offer-badge">LIMITED</span></p>
        <p class="offer-desc">${offer.description}</p>
        <div class="offer-price">${offer.price}</div>
      </div>
      <div class="offer-right">
        <div class="offer-timer">
          <div class="timer-box"><div class="timer-value" id="offer-days">00</div><div class="timer-label">D</div></div>
          <div class="timer-box"><div class="timer-value" id="offer-hours">00</div><div class="timer-label">H</div></div>
          <div class="timer-box"><div class="timer-value" id="offer-mins">00</div><div class="timer-label">M</div></div>
          <div class="timer-box"><div class="timer-value" id="offer-secs">00</div><div class="timer-label">S</div></div>
        </div>
        <a href="${fixUrl(offer.buttonUrl)}" class="offer-btn" target="_blank">Get Premium</a>
      </div>
    </div>`;

  // 2. Timer Logic (Updates DOM directly without rebuilding HTML)
  function updateTimer() {
    const now = Date.now();
    const diff = endDate - now;
    
    if (diff <= 0) {
      container.innerHTML = '';
      clearInterval(offerInterval);
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Update text directly
    const dEl = document.getElementById('offer-days');
    const hEl = document.getElementById('offer-hours');
    const mEl = document.getElementById('offer-mins');
    const sEl = document.getElementById('offer-secs');

    if (dEl) dEl.textContent = String(days).padStart(2, '0');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
    if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
  }
  
  // Run immediately then every second
  updateTimer();
  if (offerInterval) clearInterval(offerInterval);
  offerInterval = setInterval(updateTimer, 1000);
}

//  Anchor Ad
function renderAnchorAd(ad, id) {
  const container = document.getElementById('anchor-ad-container');
  if (!container) return;
  
  container.innerHTML = `
    <style>
      .pro-anchor-wrapper { position:fixed; bottom:0; left:0; width:100%; z-index:9999; transition:transform 0.35s cubic-bezier(0.4,0,0.2,1); }
      .pro-anchor-wrapper.collapsed { transform:translateY(calc(100% - 40px)); }
      .pro-anchor-toggle { position:absolute; top:-32px; left:16px; background:#3b82f6; color:#fff; border:none; border-radius:8px 8px 0 0; padding:6px 12px; cursor:pointer; font-size:14px; box-shadow:0 -2px 8px rgba(0,0,0,0.15); transition:all 0.2s; display:flex; align-items:center; gap:4px; font-weight:600; }
      .pro-anchor-toggle:hover { background:#2563eb; }
      .pro-anchor { background:#fff; padding:12px 16px; display:flex; align-items:center; justify-content:center; gap:12px; box-shadow:0 -4px 16px rgba(0,0,0,0.06); border-top:2px solid #3b82f6; }
      .pro-anchor-logo { height:40px; width:auto; border-radius:4px; flex-shrink:0; }
      .pro-anchor-text { font-size:14px; color:#4b5563; flex:1; text-align:center; }
      .pro-anchor-btn { padding:8px 18px; background:#3b82f6; color:#fff; text-decoration:none; border-radius:5px; font-weight:600; font-size:14px; white-space:nowrap; transition:background 0.2s; }
      .pro-anchor-btn:hover { background:#2563eb; }
      @media (max-width:768px) {
        .pro-anchor { flex-wrap:wrap; padding:10px 12px; gap:8px; }
        .pro-anchor-logo { height:32px; }
        .pro-anchor-text { font-size:12px; width:100%; }
        .pro-anchor-btn { padding:7px 14px; font-size:13px; }
        .pro-anchor-toggle .arrow-text { display:none; }
      }
    </style>
    <div class="pro-anchor-wrapper" id="anchor-${id}">
      <button class="pro-anchor-toggle" onclick="toggleAnchor('${id}')">
        <span class="arrow-text">▼ Ad</span> <span class="arrow-icon">▼</span>
      </button>
      <div class="pro-anchor">
        <img src="${ad.imageUrl}" alt="Ad" class="pro-anchor-logo">
        <span class="pro-anchor-text">${ad.description}</span>
        <a href="#" class="pro-anchor-btn ad-click-btn" data-id="${id}" data-url="${ad.buttonUrl}">${ad.buttonText || 'Click Here'}</a>
      </div>
    </div>
    <div style="height:76px;"></div>`;

  window.anchorStates = window.anchorStates || {};
  window.anchorStates[id] = false;
  setupAdTracking(id, ad.buttonUrl);
  trackViewOnce(id);
}

window.toggleAnchor = function(id) {
  const wrapper = document.getElementById(`anchor-${id}`);
  const toggle = wrapper.querySelector('.pro-anchor-toggle');
  window.anchorStates[id] = !window.anchorStates[id];
  wrapper.classList.toggle('collapsed', window.anchorStates[id]);
  toggle.innerHTML = window.anchorStates[id] 
    ? '<span class="arrow-text">▲ Show</span> <span class="arrow-icon">▲</span>' 
    : '<span class="arrow-text">▼ Ad</span> <span class="arrow-icon">▼</span>';
};

function setupAdTracking(id, url) {
  document.querySelectorAll(`.ad-click-btn[data-id="${id}"]`).forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      if (clickedAds.has(id)) return;
      clickedAds.add(id);
      trackAdEvent(id, 'clicks');
      setTimeout(() => window.location.href = fixUrl(btn.getAttribute('data-url')), 300);
    });
  });
}

function trackViewOnce(adId) {
  if (viewedAds.has(adId)) return;
  viewedAds.add(adId);
  trackAdEvent(adId, 'views');
}

function trackAdEvent(adId, type) {
  db.collection('ads').doc(adId).set({
    [type === 'views' ? 'totalViews' : 'totalClicks']: firebase.firestore.FieldValue.increment(1),
    [`dailyStats.${today}.${type}`]: firebase.firestore.FieldValue.increment(1)
  }, { merge: true }).catch(console.error);
}

//  Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔄 Loading ads from Firebase...');
  
  db.collection('ads').where('active', '==', true).onSnapshot(snapshot => {
    bannerAdsQueue = [];
    let anchorAd = null;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.type === 'banner') bannerAdsQueue.push({ ...data, id: doc.id });
      if (data.type === 'anchor') anchorAd = { ...data, id: doc.id };
    });
    
    console.log(`✅ Found ${bannerAdsQueue.length} banner ads`);
    
    window.carousels = [];
    const containerIds = ['banner-ad-container-1', 'banner-ad-container-2', 'banner-ad-container'];
    containerIds.forEach(id => {
      if (document.getElementById(id)) window.carousels.push(new BannerCarousel(id));
    });
    
    if (anchorAd && document.getElementById('anchor-ad-container')) {
      renderAnchorAd(anchorAd, anchorAd.id);
    }
  }, error => console.error('❌ Firebase ads error:', error));

  db.collection('offers').where('active', '==', true).onSnapshot(snapshot => {
    let bestOffer = null;
    snapshot.forEach(doc => {
      const offer = { ...doc.data(), id: doc.id };
      if (!bestOffer || offer.endDate > bestOffer.endDate) bestOffer = offer;
    });
    if (bestOffer) renderPremiumOffer(bestOffer);
  });
});