/**
 * Learny Referral System
 * Handles: referral tracking, points, spin wheel
 */

const ReferralSystem = {
  BASE_URL: 'https://www.learny.study',
  POINTS_PER_REFERRAL: 1,
  POINTS_PER_SPIN: 2,
  
  // Wheel segments (5 total, 2 are "Try Again")
  segments: [
    { label: 'Lifetime Premium', color: '#ffd700', prize: 'lifetime' },
    { label: 'Try Again', color: '#64748b', prize: 'tryagain' },
    { label: 'One Year Premium', color: '#10b981', prize: '1year' },
    { label: 'One Month Premium', color: '#3b82f6', prize: '1month' },
    { label: 'Try Again', color: '#64748b', prize: 'tryagain' } // Always lands here
  ],
  
  // State
  userId: null,
  referralPoints: 0,
  totalReferred: 0,
  isSpinning: false,
  
  init() {
    this.generateUserId();
    this.checkReferralParam();
    this.loadUserData();
    this.setupUI();
    this.setupEventListeners();
    this.drawWheel();
    this.updateDisplay();
  },
  
  // Generate unique user ID if not exists
  generateUserId() {
    let uid = localStorage.getItem('learny_user_id');
    if (!uid) {
      uid = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem('learny_user_id', uid);
    }
    this.userId = uid;
  },
  
  // Check if user came via referral link
  checkReferralParam() {
    const params = new URLSearchParams(window.location.search);
    const referrerId = params.get('ref');
    
    if (referrerId && referrerId !== this.userId) {
      // User was referred - store referrer in session
      sessionStorage.setItem('referred_by', referrerId);
      
      // Track that this user has been counted (prevent double-counting)
      const alreadyCounted = localStorage.getItem('referral_counted_' + this.userId);
      if (!alreadyCounted) {
        this.creditReferrer(referrerId);
        localStorage.setItem('referral_counted_' + this.userId, '1');
      }
    }
  },
  
  // Credit points to referrer
  creditReferrer(referrerId) {
    const refData = JSON.parse(localStorage.getItem('learny_referrals') || '{}');
    
    if (!refData[referrerId]) {
      refData[referrerId] = { points: 0, referred: 0 };
    }
    
    refData[referrerId].points += this.POINTS_PER_REFERRAL;
    refData[referrerId].referred += 1;
    
    localStorage.setItem('learny_referrals', JSON.stringify(refData));
    
    // Show notification to referrer if they're on the site
    if (referrerId === localStorage.getItem('learny_user_id')) {
      this.showToast('🎉 You earned 1 referral point!');
    }
  },
  
  // Load user's referral data
  loadUserData() {
    const refData = JSON.parse(localStorage.getItem('learny_referrals') || '{}');
    const userData = refData[this.userId] || { points: 0, referred: 0 };
    
    this.referralPoints = userData.points;
    this.totalReferred = userData.referred;
  },
  
  // Save user data
  saveUserData() {
    const refData = JSON.parse(localStorage.getItem('learny_referrals') || '{}');
    refData[this.userId] = {
      points: this.referralPoints,
      referred: this.totalReferred
    };
    localStorage.setItem('learny_referrals', JSON.stringify(refData));
  },
  
  // Setup UI elements
  setupUI() {
    // Set referral link
    const linkInput = document.getElementById('referral-link');
    if (linkInput) {
      linkInput.value = `${this.BASE_URL}/index.html?ref=${this.userId}`;
    }
    
    // Update stats display
    this.updateDisplay();
  },
  
  // Update display with current data
  updateDisplay() {
    document.getElementById('referral-points').textContent = this.referralPoints;
    document.getElementById('total-referred').textContent = this.totalReferred;
    
    const spins = Math.floor(this.referralPoints / this.POINTS_PER_SPIN);
    document.getElementById('spins-available').textContent = spins;
    
    // Enable/disable spin button
    const spinBtn = document.getElementById('spin-btn');
    const spinMsg = document.getElementById('spin-message');
    
    if (spins > 0 && !this.isSpinning) {
      spinBtn.disabled = false;
      spinMsg.textContent = `You have ${spins} spin${spins > 1 ? 's' : ''} available!`;
    } else if (this.isSpinning) {
      spinBtn.disabled = true;
      spinMsg.textContent = 'Spinning...';
    } else {
      spinBtn.disabled = true;
      spinMsg.textContent = `Earn ${this.POINTS_PER_SPIN - (this.referralPoints % this.POINTS_PER_SPIN)} more point(s) to spin!`;
    }
  },
  
  // Setup event listeners
  setupEventListeners() {
    // Copy link button
    document.getElementById('copy-link')?.addEventListener('click', () => {
      const link = document.getElementById('referral-link').value;
      navigator.clipboard.writeText(link).then(() => {
        this.showToast('Link copied to clipboard!');
      });
    });
    
    // Share button
    document.getElementById('share-link')?.addEventListener('click', () => {
      const link = document.getElementById('referral-link').value;
      const text = `🎓 Join Learny with my referral link!\n📚 Get study tools, AI assistant & more!\n🔗 ${link}`;
      
      if (navigator.share) {
        navigator.share({ title: 'Join Learny', text }).catch(() => this.copyToClipboard(link));
      } else {
        this.copyToClipboard(link);
      }
    });
    
    // Spin button
    document.getElementById('spin-btn')?.addEventListener('click', () => this.spinWheel());
    
    // Modal close
    document.getElementById('close-modal')?.addEventListener('click', () => this.closeModal());
    document.getElementById('modal-overlay')?.addEventListener('click', () => this.closeModal());
    
    // Theme toggle (sync with main app)
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.onclick = () => {
        const isDark = !document.body.classList.contains('light');
        document.body.classList.toggle('light', !isDark);
        document.querySelectorAll('.theme-toggle i').forEach(i => {
          i.className = isDark ? 'fa fa-sun' : 'fa fa-moon';
        });
      };
    });
  },
  
  // Draw the wheel on canvas
  drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const segmentAngle = (2 * Math.PI) / this.segments.length;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    this.segments.forEach((seg, i) => {
      const startAngle = i * segmentAngle - Math.PI / 2;
      const endAngle = startAngle + segmentAngle;
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(seg.label, radius - 20, 4);
      ctx.restore();
    });
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 25, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw center text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', centerX, centerY + 4);
  },
  
  // Spin the wheel (always lands on "Try Again")
  spinWheel() {
    if (this.isSpinning || this.referralPoints < this.POINTS_PER_SPIN) return;
    
    this.isSpinning = true;
    this.referralPoints -= this.POINTS_PER_SPIN;
    this.saveUserData();
    this.updateDisplay();
    
    const canvas = document.getElementById('wheel-canvas');
    const wheel = canvas;
    
    // Find "Try Again" segments indices (1 and 4)
    const tryAgainIndices = [1, 4];
    const targetIndex = tryAgainIndices[Math.floor(Math.random() * tryAgainIndices.length)];
    
    // Calculate rotation to land on target
    const segmentAngle = 360 / this.segments.length;
    const baseRotation = 360 * 8; // 8 full spins
    const offset = targetIndex * segmentAngle + segmentAngle / 2; // Center of segment
    const totalRotation = baseRotation + (360 - offset);
    
    // Apply animation
    wheel.style.transition = 'transform 4s cubic-bezier(0.25, 0.1, 0.25, 1)';
    wheel.style.transform = `rotate(${totalRotation}deg)`;
    
    // Show result after animation
    setTimeout(() => {
      this.showResult('tryagain');
      wheel.style.transition = 'none';
      wheel.style.transform = `rotate(${totalRotation % 360}deg)`;
      this.isSpinning = false;
      this.updateDisplay();
      this.drawWheel(); // Redraw to reset visual
    }, 4000);
  },
  
  // Show result modal
  showResult(prize) {
    const modal = document.getElementById('result-modal');
    const overlay = document.getElementById('modal-overlay');
    const title = document.getElementById('result-title');
    const message = document.getElementById('result-message');
    const prizeName = document.getElementById('prize-name');
    const contactSection = document.getElementById('contact-support-section');
    
    // Reset modal
    contactSection.classList.add('hidden');
    
    if (prize === 'tryagain') {
      title.textContent = '😔 Try Again!';
      prizeName.textContent = 'Better luck next time';
      message.innerHTML = 'You landed on <strong>Try Again</strong>. Keep referring friends to spin again!';
      contactSection.classList.remove('hidden'); // Show contact button for "Try Again"
    } else {
      const prizeLabels = {
        'lifetime': '🏆 Lifetime Premium',
        '1year': '⭐ One Year Premium',
        '1month': '✨ One Month Premium'
      };
      title.textContent = '🎉 Congratulations!';
      prizeName.textContent = prizeLabels[prize] || prize;
      message.textContent = `You won: ${prizeLabels[prize] || prize}!`;
    }
    
    modal.classList.add('show');
    overlay.classList.add('show');
  },
  
  // Close modal
  closeModal() {
    document.getElementById('result-modal').classList.remove('show');
    document.getElementById('modal-overlay').classList.remove('show');
  },
  
  // Copy to clipboard helper
  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Link copied to clipboard!');
    });
  },
  
  // Show toast notification
  showToast(msg) {
    let toast = document.getElementById('referral-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'referral-toast';
      toast.className = 'notification';
      toast.innerHTML = '<i class="fa fa-bell"></i><span></span>';
      document.body.appendChild(toast);
    }
    toast.querySelector('span').textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
};

// Handle APK install click tracking (for index.html integration)
// Add this listener to your existing "Install APK" button in index.html:
// document.querySelector('a[href="learny.apk"]')?.addEventListener('click', function(e) {
//   const referrer = sessionStorage.getItem('referred_by');
//   if (referrer) {
//     // Credit is already handled in referral.js checkReferralParam
//     // This is just for analytics if needed
//     console.log('APK installed via referral:', referrer);
//   }
// });

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  ReferralSystem.init();
  
  // Sync with main APP if it exists
  if (typeof APP !== 'undefined' && APP.data?.profile?.name) {
    document.getElementById('sidebar-username').textContent = `Welcome, ${APP.data.profile.name}!`;
  }
});
