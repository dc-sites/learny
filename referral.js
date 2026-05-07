const ReferralSystem = {
  userId: null,
  points: 0,
  referred: 0,
  isSpinning: false,
  
  // 5 Segments: [Label, Color, PrizeKey]
  segments: [
    { text: 'Lifetime Premium', color: '#f59e0b', key: 'lifetime' },
    { text: 'Try Again', color: '#64748b', key: 'tryagain' },
    { text: '1 Year Premium', color: '#10b981', key: '1year' },
    { text: '1 Month Premium', color: '#3b82f6', key: '1month' },
    { text: 'Try Again', color: '#64748b', key: 'tryagain' } // Always lands here
  ],

  init() {
    this.userId = localStorage.getItem('learny_user_id') || 'anonymous';
    this.loadData();
    this.setupUI();
    this.drawWheel();
    this.bindEvents();
    this.updateUI();

    // Sync across tabs in real-time
    window.addEventListener('storage', e => {
      if (e.key === 'learny_referrals') this.loadData();
      this.updateUI();
    });
  },

  loadData() {
    try {
      const all = JSON.parse(localStorage.getItem('learny_referrals') || '{}');
      const user = all[this.userId] || { points: 0, referred: 0 };
      this.points = user.points;
      this.referred = user.referred;
    } catch {
      this.points = 0; this.referred = 0;
    }
  },

  setupUI() {
    // Generate link
    const url = `${window.location.origin}/index.html?ref=${this.userId}`;
    document.getElementById('ref-link-input').value = url;
    
    // Sync username if available
    const name = APP?.data?.profile?.name || 'User';
    const sidebar = document.getElementById('sidebar-username');
    if (sidebar) sidebar.textContent = `Welcome, ${name.charAt(0).toUpperCase() + name.slice(1)}!`;
  },

  drawWheel() {
    const canvas = document.getElementById('spin-canvas');
    const ctx = canvas.getContext('2d');
    const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 10;
    const angle = (2 * Math.PI) / this.segments.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.segments.forEach((seg, i) => {
      const start = i * angle - Math.PI / 2;
      const end = start + angle;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath(); ctx.fillStyle = seg.color; ctx.fill();
      ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 2; ctx.stroke();

      // Text
      ctx.save(); ctx.translate(cx, cy);
      ctx.rotate(start + angle / 2);
      ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(seg.text, r - 15, 4);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a2e'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('SPIN', cx, cy + 4);
  },

  spinWheel() {
    if (this.isSpinning || this.points < 2) return;
    this.isSpinning = true;
    this.points -= 2;
    this.saveData();
    this.updateUI();

    const canvas = document.getElementById('spin-canvas');
    // Force landing on "Try Again" (index 1 or 4)
    const targetIdx = Math.random() > 0.5 ? 1 : 4;
    const segAngle = 360 / this.segments.length;
    const centerOfTarget = (targetIdx * segAngle) + (segAngle / 2);
    const totalRotation = 360 * 8 + (360 - centerOfTarget); // 8 full spins + alignment

    canvas.style.transform = `rotate(${totalRotation}deg)`;

    setTimeout(() => {
      this.showResult('tryagain');
      canvas.style.transition = 'none';
      canvas.style.transform = `rotate(${totalRotation % 360}deg)`;
      this.isSpinning = false;
      this.updateUI();
    }, 4000);
  },

  showResult(key) {
    const modal = document.getElementById('result-modal');
    const overlay = document.querySelector('.overlay');
    const title = document.getElementById('res-title');
    const prize = document.getElementById('res-prize');
    const contact = document.getElementById('contact-box');

    contact.classList.add('hidden');
    
    if (key === 'tryagain') {
      title.textContent = '😔 Better Luck Next Time!';
      prize.textContent = 'Try Again';
      contact.classList.remove('hidden'); // Show WhatsApp button
    } else {
      title.textContent = '🎉 Congratulations!';
      prize.textContent = key.replace('1month', '1 Month Premium').replace('1year', '1 Year Premium').replace('lifetime', 'Lifetime Premium');
    }

    modal.classList.add('show');
    overlay.classList.add('show');
  },

  updateUI() {
    document.getElementById('ref-points').textContent = this.points;
    document.getElementById('total-referred').textContent = this.referred;
    const spins = Math.floor(this.points / 2);
    document.getElementById('spins-left').textContent = spins;
    
    const btn = document.getElementById('spin-btn');
    const status = document.getElementById('spin-status');
    btn.disabled = spins < 1 || this.isSpinning;
    status.textContent = this.isSpinning ? 'Spinning...' : spins > 0 ? `You have ${spins} spin${spins>1?'s':''} available!` : `Earn ${2 - (this.points % 2)} more point(s) to spin!`;
  },

  saveData() {
    const all = JSON.parse(localStorage.getItem('learny_referrals') || '{}');
    all[this.userId] = { points: this.points, referred: this.referred };
    localStorage.setItem('learny_referrals', JSON.stringify(all));
  },

  bindEvents() {
    document.getElementById('spin-btn').onclick = () => this.spinWheel();
    document.getElementById('close-modal').onclick = () => {
      document.getElementById('result-modal').classList.remove('show');
      document.querySelector('.overlay').classList.remove('show');
    };
    document.getElementById('copy-btn').onclick = () => {
      const input = document.getElementById('ref-link-input');
      input.select(); navigator.clipboard.writeText(input.value);
      APP.showToast?.('Link copied!');
    };
    document.getElementById('share-btn').onclick = () => {
      const link = document.getElementById('ref-link-input').value;
      const text = `🎓 Join Learny Study App! Use my referral link: ${link}`;
      if (navigator.share) navigator.share({ title: 'Learny Referral', text });
      else { navigator.clipboard.writeText(text); APP.showToast?.('Text copied for sharing!'); }
    };
    // Theme toggle sync
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.onclick = () => {
        APP.data.darkMode = !APP.data.darkMode;
        document.body.classList.toggle('light', !APP.data.darkMode);
        APP.updateThemeIcon?.(); APP.save?.();
      };
    });
  }
};

document.addEventListener('DOMContentLoaded', () => ReferralSystem.init());
