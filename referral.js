const ReferralSystem = {
  userId: null,
  points: 0,
  referred: 0,
  isSpinning: false,
  
  // 5 Segments: [Label, Color, PrizeKey] - Always lands on Try Again (index 1 or 4)
  segments: [
    { text: 'Lifetime Premium', color: '#f59e0b', key: 'lifetime' },
    { text: 'Try Again', color: '#64748b', key: 'tryagain' },
    { text: '1 Year Premium', color: '#10b981', key: '1year' },
    { text: '1 Month Premium', color: '#3b82f6', key: '1month' },
    { text: 'Try Again', color: '#64748b', key: 'tryagain' }
  ],

  init() {
    this.userId = localStorage.getItem('learny_user_id') || this.generateUserId();
    this.loadData();
    this.setupUI();
    this.drawWheel();
    this.bindEvents();
    this.updateUI(); // ✅ Critical: Sets button state on load

    // Sync across tabs in real-time
    window.addEventListener('storage', (e) => {
      if (e.key === 'learny_referrals') {
        this.loadData();
        this.updateUI();
      }
    });
  },

  generateUserId() {
    const id = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    localStorage.setItem('learny_user_id', id);
    return id;
  },

  loadData() {
    try {
      const all = JSON.parse(localStorage.getItem('learny_referrals') || '{}');
      const user = all[this.userId] || { points: 0, referred: 0 };
      this.points = user.points;
      this.referred = user.referred;
    } catch (e) {
      console.error('Load error:', e);
      this.points = 0;
      this.referred = 0;
    }
  },

  setupUI() {
    // Generate referral link
    const baseUrl = window.location.origin + window.location.pathname.replace(/referral\.html$/, 'index.html');
    const url = `${baseUrl}?ref=${this.userId}`;
    const input = document.getElementById('ref-link-input');
    if (input) input.value = url;
    
    // Sync username from APP
    try {
      if (typeof APP !== 'undefined' && APP.data?.profile?.name) {
        const name = APP.data.profile.name;
        const sidebar = document.getElementById('sidebar-username');
        if (sidebar) sidebar.textContent = `Welcome, ${name}!`;
      }
    } catch(e) {}
  },

  drawWheel() {
    const canvas = document.getElementById('spin-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 10;
    const angle = (2 * Math.PI) / this.segments.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    this.segments.forEach((seg, i) => {
      const start = i * angle - Math.PI / 2;
      const end = start + angle;
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + angle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(seg.text, r - 15, 4);
      ctx.restore();
    });
    
    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', cx, cy + 4);
  },

  spinWheel() {
    // ✅ STRICT: Must have 2+ points AND not spinning
    if (this.isSpinning || this.points < 2) {
      this.showToast('Need 2 points to spin!');
      return;
    }
    
    this.isSpinning = true;
    this.points -= 2; // Deduct immediately
    this.saveData();
    this.updateUI(); // Update button state NOW
    
    const canvas = document.getElementById('spin-canvas');
    
    // Force land on "Try Again" (index 1 or 4)
    const targetIdx = Math.random() > 0.5 ? 1 : 4;
    const segAngle = 360 / this.segments.length;
    const centerOfTarget = (targetIdx * segAngle) + (segAngle / 2);
    const totalRotation = 360 * 8 + (360 - centerOfTarget);
    
    canvas.style.transition = 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)';
    canvas.style.transform = `rotate(${totalRotation}deg)`;
    
    setTimeout(() => {
      this.showResult('tryagain');
      canvas.style.transition = 'none';
      canvas.style.transform = `rotate(${totalRotation % 360}deg)`;
      this.isSpinning = false;
      this.updateUI(); // Re-enable if enough points remain
    }, 4000);
  },

  showResult(key) {
    const modal = document.getElementById('result-modal');
    const overlay = document.querySelector('.overlay');
    const title = document.getElementById('res-title');
    const prize = document.getElementById('res-prize');
    const contact = document.getElementById('contact-box');
    
    contact?.classList.add('hidden');
    
    if (key === 'tryagain') {
      title.textContent = '😔 Better Luck Next Time!';
      prize.textContent = 'Try Again';
      contact?.classList.remove('hidden'); // Show WhatsApp ONLY for Try Again
    } else {
      title.textContent = '🎉 Congratulations!';
      const labels = {
        '1month': '1 Month Premium',
        '1year': '1 Year Premium', 
        'lifetime': 'Lifetime Premium'
      };
      prize.textContent = labels[key] || key;
    }
    
    modal?.classList.add('show');
    overlay?.classList.add('show');
  },

  updateUI() {
    // Update stats
    const refPointsEl = document.getElementById('ref-points');
    const totalRefEl = document.getElementById('total-referred');
    const spinsEl = document.getElementById('spins-available');
    
    if (refPointsEl) refPointsEl.textContent = this.points;
    if (totalRefEl) totalRefEl.textContent = this.referred;
    
    const spins = Math.floor(this.points / 2);
    if (spinsEl) spinsEl.textContent = spins;
    
    // ✅ CRITICAL: Disable spin button if < 2 points OR spinning
    const spinBtn = document.getElementById('spin-btn');
    const spinStatus = document.getElementById('spin-status');
    
    if (spinBtn) {
      spinBtn.disabled = (this.points < 2) || this.isSpinning;
    }
    
    if (spinStatus) {
      if (this.isSpinning) {
        spinStatus.textContent = 'Spinning...';
      } else if (this.points >= 2) {
        spinStatus.textContent = `You have ${spins} spin${spins > 1 ? 's' : ''} available!`;
      } else {
        const needed = 2 - (this.points % 2);
        spinStatus.textContent = `Earn ${needed} more point${needed > 1 ? 's' : ''} to spin!`;
      }
    }
  },

  saveData() {
    try {
      const all = JSON.parse(localStorage.getItem('learny_referrals') || '{}');
      all[this.userId] = { points: this.points, referred: this.referred };
      localStorage.setItem('learny_referrals', JSON.stringify(all));
    } catch(e) {
      console.error('Save error:', e);
    }
  },

  bindEvents() {
    // Spin button
    const spinBtn = document.getElementById('spin-btn');
    if (spinBtn) {
      spinBtn.onclick = (e) => {
        e.preventDefault();
        this.spinWheel();
      };
    }
    
    // Close modal
    const closeModal = document.getElementById('close-modal');
    const overlay = document.querySelector('.overlay');
    if (closeModal) {
      closeModal.onclick = () => {
        document.getElementById('result-modal')?.classList.remove('show');
        overlay?.classList.remove('show');
      };
    }
    if (overlay) {
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          document.getElementById('result-modal')?.classList.remove('show');
          overlay.classList.remove('show');
        }
      };
    }
    
    // ✅ COPY BUTTON - Works without APP dependency
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const input = document.getElementById('ref-link-input');
        if (input) {
          input.select();
          input.setSelectionRange(0, 99999); // For mobile
          navigator.clipboard.writeText(input.value)
            .then(() => this.showToast('Link copied to clipboard! 📋'))
            .catch(() => {
              // Fallback
              document.execCommand('copy');
              this.showToast('Link copied! 📋');
            });
        }
      };
    }
    
    // ✅ SHARE BUTTON - With fallback
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
      shareBtn.onclick = () => {
        const link = document.getElementById('ref-link-input')?.value || '';
        const text = `🎓 Join Learny Study App!\nUse my referral link: ${link}\n\nInstall the APK & help me earn rewards! 🚀`;
        
        if (navigator.share) {
          navigator.share({ title: 'Learny Referral', text, url: link }).catch(() => {});
        } else {
          navigator.clipboard.writeText(text)
            .then(() => this.showToast('Referral text copied! Paste to share 📋'))
            .catch(() => {
              // Last resort fallback
              const ta = document.createElement('textarea');
              ta.value = text;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
              this.showToast('Text copied! Paste to share 📋');
            });
        }
      };
    }
    
    // Theme toggle sync
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.onclick = () => {
        if (typeof APP !== 'undefined') {
          APP.data.darkMode = !APP.data.darkMode;
          document.body.classList.toggle('light', !APP.data.darkMode);
          APP.updateThemeIcon?.();
          APP.save?.();
        } else {
          document.body.classList.toggle('light');
        }
      };
    });
    
    // Hamburger menu
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    if (hamburger && sidebar) {
      hamburger.onclick = () => {
        sidebar.classList.toggle('open');
        overlay?.classList.toggle('show');
      };
    }
  },

  // ✅ Toast that works WITH or WITHOUT APP
  showToast(msg) {
    if (typeof APP !== 'undefined' && typeof APP.showToast === 'function') {
      APP.showToast(msg);
      return;
    }
    
    // Fallback toast
    let toast = document.getElementById('referral-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'referral-toast';
      toast.style.cssText = `
        position: fixed; top: 20px; right: 20px; 
        background: var(--bg-card, #1a1a2e); 
        color: var(--text-main, #e2e8f0);
        padding: 12px 20px; border-radius: 12px;
        border: 1px solid var(--border, rgba(255,255,255,0.1));
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000; display: flex; align-items: center; gap: 10px;
        transform: translateX(150%); transition: transform 0.3s ease;
        font-size: 14px; font-weight: 500;
      `;
      toast.innerHTML = '<i class="fa fa-bell" style="color:var(--primary,#6c2bd9)"></i><span></span>';
      document.body.appendChild(toast);
    }
    
    toast.querySelector('span').textContent = msg;
    toast.style.transform = 'translateX(0)';
    setTimeout(() => { toast.style.transform = 'translateX(150%)'; }, 3000);
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => ReferralSystem.init(), 50); // Wait for APP to load
});
