// popup-ad.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, updateDoc, doc, increment, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAUlaYW7amE3tl7klCZ0WbVUfmTgOn0NSM",
  authDomain: "pop-up-2545a.firebaseapp.com",
  projectId: "pop-up-2545a",
  storageBucket: "pop-up-2545a.firebasestorage.app",
  messagingSenderId: "77878116792",
  appId: "1:77878116792:web:25c2da56b15d023cddcf4d",
  measurementId: "G-XZS0186BCP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== SHARED STYLES =====
const sharedStyles = `
  <style>
    .popup-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }
    .popup-box {
      background: #fff;
      border-radius: 16px;
      max-width: 90%;
      width: 380px;
      padding: 20px;
      position: relative;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      animation: popupSlide 0.3s ease;
    }
    @keyframes popupSlide {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .popup-img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 12px;
      background: #f5f5f5;
    }
    .popup-desc {
      font-size: 14px;
      color: #333;
      margin-bottom: 16px;
      line-height: 1.4;
    }
    .popup-btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .popup-btn:active { transform: scale(0.98); }
    .info-icon {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 22px;
      height: 22px;
      background: #e0e0e0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      color: #555;
      cursor: pointer;
      user-select: none;
    }
    .info-icon:hover { background: #ccc; }
    .premium-tip {
      position: absolute;
      top: 40px;
      right: 0;
      background: #fff;
      padding: 10px 14px;
      border-radius: 10px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.2);
      font-size: 13px;
      color: #444;
      white-space: nowrap;
      display: none;
      z-index: 10001;
    }
    .premium-tip.show { display: block; animation: fadeIn 0.2s; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .premium-tip a { color: #667eea; text-decoration: none; font-weight: 600; }
    
    /* Skippable ad specific */
    .skip-btn {
      position: absolute;
      top: 12px;
      left: 12px;
      padding: 6px 14px;
      background: #666;
      color: white;
      border: none;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      cursor: not-allowed;
      opacity: 0.7;
      transition: all 0.2s;
    }
    .skip-btn.enabled {
      background: #e74c3c;
      cursor: pointer;
      opacity: 1;
    }
    .skip-btn.enabled:hover { background: #c0392b; }
    .skip-timer {
      position: absolute;
      top: 12px;
      left: 12px;
      padding: 6px 14px;
      background: #666;
      color: white;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    
    /* Footer branding */
    .ad-footer {
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px solid #eee;
      text-align: center;
      font-size: 11px;
      color: #888;
    }
    .ad-footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
    .ad-footer a:hover { text-decoration: underline; }
    
    @media (max-width: 480px) {
      .popup-box { width: 92%; padding: 16px; }
      .popup-img { height: 180px; }
      .popup-desc { font-size: 13px; }
    }
  </style>
`;

// ===== NORMAL AD (Shows ONCE per user until admin reactivates) =====
async function showNormalAd() {
  const container = document.getElementById('popup-ad-container');
  if (!container) return;
  
  try {
    // Fetch only active NORMAL ads
    const q = query(collection(db, "ads"), where("isActive", "==", true), where("adType", "==", "normal"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const activeAds = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      // Ensure lastActivatedAt exists (fallback to createdAt timestamp)
      if (!data.lastActivatedAt && data.createdAt) {
        data.lastActivatedAt = new Date(data.createdAt).getTime();
      }
      activeAds.push({ id: docSnap.id, ...data });
    });

    // Get seen ads from localStorage (format: { adId: timestamp })
    let seenAds = JSON.parse(localStorage.getItem('learny_seen_normal_ads') || '{}');
    // Migrate old array format if exists
    if (Array.isArray(seenAds)) {
      const migrated = {};
      seenAds.forEach(id => migrated[id] = Date.now());
      seenAds = migrated;
      localStorage.setItem('learny_seen_normal_ads', JSON.stringify(seenAds));
    }

    // Filter: Show only if ad was activated AFTER user last saw it
    const eligibleAds = activeAds.filter(ad => {
      const userLastSeen = seenAds[ad.id] || 0;
      const adLastActivated = ad.lastActivatedAt || 0;
      // Show if: admin reactivated after user saw it, OR user never saw it
      return adLastActivated > userLastSeen;
    });

    if (eligibleAds.length === 0) return;
    
    // Pick random eligible ad
    const ad = eligibleAds[Math.floor(Math.random() * eligibleAds.length)];
    
    // Track view
    await updateDoc(doc(db, "ads", ad.id), { views: increment(1) });
    
    // Render popup
    renderNormalAd(container, ad);
    
  } catch (error) {
    console.error("Error loading normal ad:", error);
  }
}

function renderNormalAd(container, ad) {
  container.innerHTML = sharedStyles + `
    <div class="popup-overlay">
      <div class="popup-box">
        <div class="info-icon" id="infoIcon">ⓘ</div>
        <div class="premium-tip" id="premiumTip">🎁 <a href="premium.html" target="_blank">Get Premium</a> to hide ads</div>
        <img src="${ad.imageUrl}" alt="Ad" class="popup-img" onerror="this.src='https://via.placeholder.com/380x200?text=Ad+Image'">
        <p class="popup-desc">${escapeHtml(ad.description)}</p>
        <button class="popup-btn" id="adBtn">${escapeHtml(ad.buttonText)}</button>
        <div class="ad-footer">Ads by <a href="https://hexasolutions.online" target="_blank">Hexa Solutions</a></div>
      </div>
    </div>
  `;

  const infoIcon = container.querySelector('#infoIcon');
  const premiumTip = container.querySelector('#premiumTip');
  
  // Info icon tooltip
  infoIcon?.addEventListener('click', (e) => {
    e.stopPropagation();
    premiumTip?.classList.toggle('show');
    setTimeout(() => premiumTip?.classList.remove('show'), 3000);
  });

  // Button click: track + mark as seen + close
  container.querySelector('#adBtn')?.addEventListener('click', async () => {
    // Track click
    await updateDoc(doc(db, "ads", ad.id), { clicks: increment(1) });
    
    // Mark as seen in localStorage with current timestamp
    let seenAds = JSON.parse(localStorage.getItem('learny_seen_normal_ads') || '{}');
    seenAds[ad.id] = Date.now();
    localStorage.setItem('learny_seen_normal_ads', JSON.stringify(seenAds));
    
    // Remove popup
    container.innerHTML = '';
    
    // Open URL if provided
    if (ad.buttonUrl?.trim()) {
      window.open(ad.buttonUrl, '_blank');
    }
  });

  // Prevent closing by clicking overlay
  container.addEventListener('click', (e) => e.stopPropagation());
}

// ===== SKIPPABLE AD (Shows every reload, skip after 3s) =====
async function showSkippableAd() {
  const container = document.getElementById('popup-skip');
  if (!container) return;
  
  try {
    const q = query(collection(db, "ads"), where("isActive", "==", true), where("adType", "==", "skippable"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const activeAds = [];
    snapshot.forEach(docSnap => activeAds.push({ id: docSnap.id, ...docSnap.data() }));
    if (activeAds.length === 0) return;

    const ad = activeAds[Math.floor(Math.random() * activeAds.length)];
    await updateDoc(doc(db, "ads", ad.id), { views: increment(1) });
    renderSkippableAd(container, ad);
  } catch (error) {
    console.error("Error loading skippable ad:", error);
  }
}

function renderSkippableAd(container, ad) {
  let canSkip = false;
  let timer = 3;

  container.innerHTML = sharedStyles + `
    <div class="popup-overlay">
      <div class="popup-box">
        <div class="info-icon" id="infoIcon">ⓘ</div>
        <div class="premium-tip" id="premiumTip">🎁 <a href="premium.html" target="_blank">Get Premium</a> to hide ads</div>
        <button class="skip-timer" id="skipTimer">Skip in ${timer}s</button>
        <img src="${ad.imageUrl}" alt="Ad" class="popup-img" onerror="this.src='https://via.placeholder.com/380x200?text=Ad+Image'">
        <p class="popup-desc">${escapeHtml(ad.description)}</p>
        <button class="popup-btn" id="adBtn">${escapeHtml(ad.buttonText)}</button>
        <div class="ad-footer">Ads by <a href="https://hexasolutions.online" target="_blank">Hexa Solutions</a></div>
      </div>
    </div>
  `;

  const skipTimer = container.querySelector('#skipTimer');
  const infoIcon = container.querySelector('#infoIcon');
  const premiumTip = container.querySelector('#premiumTip');

  // Countdown: enable skip after 3 seconds
  const countdown = setInterval(() => {
    timer--;
    if (timer > 0) {
      skipTimer.textContent = `Skip in ${timer}s`;
    } else {
      clearInterval(countdown);
      canSkip = true;
      skipTimer.textContent = '✕ Skip Ad';
      skipTimer.classList.add('enabled');
    }
  }, 1000);

  // Info icon tooltip
  infoIcon?.addEventListener('click', (e) => {
    e.stopPropagation();
    premiumTip?.classList.toggle('show');
    setTimeout(() => premiumTip?.classList.remove('show'), 3000);
  });

  // Skip button click
  skipTimer?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (canSkip) {
      clearInterval(countdown);
      container.innerHTML = '';
    }
  });

  // Ad button click
  container.querySelector('#adBtn')?.addEventListener('click', async () => {
    await updateDoc(doc(db, "ads", ad.id), { clicks: increment(1) });
    clearInterval(countdown);
    container.innerHTML = '';
    if (ad.buttonUrl?.trim()) window.open(ad.buttonUrl, '_blank');
  });

  // Prevent close by clicking outside
  container.addEventListener('click', (e) => e.stopPropagation());
}

// ===== UTILS =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== INIT =====
window.addEventListener('load', () => {
  // Small delay for better UX
  setTimeout(() => {
    showNormalAd();   // Shows once per user
    showSkippableAd(); // Shows every reload
  }, 1500);
});
