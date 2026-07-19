/* ========================================
FIFA 2026 FINAL - FIRESTORE LIVE MODULE
======================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  increment 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyACbyx4EOnLWyTKXsAKP8T7qplUHibPzyY",
  authDomain: "fifa-f3b77.firebaseapp.com",
  databaseURL: "https://fifa-f3b77-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fifa-f3b77",
  storageBucket: "fifa-f3b77.firebasestorage.app",
  messagingSenderId: "1060348132581",
  appId: "1:1060348132581:web:bf2e94082e30349119e80c",
  measurementId: "G-7ZSRYTDMZW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============ FINAL TEAMS CONFIGURATION ============
const FINAL_TEAMS = {
  team1: {
    name: 'Argentina',
    flag: '🇦',
    confed: 'CONMEBOL',
    players: [
      { name: 'L. Messi', pos: 'Forward', emoji: '🐐' },
      { name: 'E. Martínez', pos: 'Goalkeeper', emoji: '🧤' },
      { name: 'J. Álvarez', pos: 'Forward', emoji: '⚡' },
      { name: 'E. Fernández', pos: 'Midfielder', emoji: '🎯' }
    ]
  },
  team2: {
    name: 'France',
    flag: '🇫',
    confed: 'UEFA',
    players: [
      { name: 'K. Mbappé', pos: 'Forward', emoji: '💨' },
      { name: 'A. Griezmann', pos: 'Forward', emoji: '🎨' },
      { name: 'O. Dembélé', pos: 'Forward', emoji: '✨' },
      { name: 'A. Tchouaméni', pos: 'Midfielder', emoji: '🛡️' }
    ]
  }
};

const FIFA = {
  data: {
    finalDate: new Date('2026-07-19T20:00:00-04:00').getTime(),
    userVote: null,
    votes: { team1: 0, team2: 0 }
  },

  init() {
    console.log('FIFA Module Initializing...');
    this.loadUserVote();
    this.startCountdown();
    this.renderPlayers();
    this.bindThemeToggle();
    this.applySavedTheme();
    this.bindEvents();
    this.initializeFirestore();
    this.listenToVotes();
    console.log('FIFA Module Initialized');
  },

  loadUserVote() {
    try {
      const saved = localStorage.getItem('learny_fifa_user_vote');
      if (saved) {
        this.data.userVote = saved;
        console.log('Loaded user vote:', saved);
      }
    } catch(e) { 
      console.warn('Load vote error', e); 
    }
  },

  saveUserVote() {
    try {
      if (this.data.userVote) {
        localStorage.setItem('learny_fifa_user_vote', this.data.userVote);
      } else {
        localStorage.removeItem('learny_fifa_user_vote');
      }
    } catch(e) { 
      console.warn('Save vote error', e); 
    }
  },

  bindThemeToggle() {
    console.log('Binding theme toggle...');
    const themeBtn = document.querySelector('.theme-toggle');
    if (themeBtn) {
      themeBtn.onclick = () => {
        console.log('Theme toggle clicked');
        const isDark = !document.body.classList.contains('light');
        document.body.classList.toggle('light', !isDark);
        
        const icon = themeBtn.querySelector('i');
        if (icon) {
          icon.className = isDark ? 'fa fa-sun' : 'fa fa-moon';
        }
        
        try {
          const learndata = JSON.parse(localStorage.getItem('learny_data') || '{}');
          learndata.darkMode = isDark;
          localStorage.setItem('learny_data', JSON.stringify(learndata));
          console.log('Theme saved:', isDark ? 'dark' : 'light');
        } catch(e) {
          console.warn('Theme save error', e);
        }
      };
    } else {
      console.warn('Theme toggle button not found');
    }
  },

  applySavedTheme() {
    try {
      const learndata = JSON.parse(localStorage.getItem('learny_data') || '{}');
      const isDark = learndata.darkMode !== false;
      
      if (!isDark) {
        document.body.classList.add('light');
      }
      
      const themeBtn = document.querySelector('.theme-toggle i');
      if (themeBtn) {
        themeBtn.className = isDark ? 'fa fa-moon' : 'fa fa-sun';
      }
      
      if (learndata.currentTheme && learndata.currentTheme !== 'purple') {
        document.body.classList.add(`theme-${learndata.currentTheme}`);
      }
    } catch(e) {
      console.warn('Apply theme error', e);
    }
  },

  bindEvents() {
    const resetBtn = document.getElementById('resetVoteBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (this.data.userVote) {
          const teamKey = this.data.userVote;
          const docRef = doc(db, "poll", "votes");
          updateDoc(docRef, { [teamKey]: increment(-1) })
            .then(() => {
              this.data.userVote = null;
              this.saveUserVote();
              this.showToast('Vote removed. Pick a new champion! 🏆');
            })
            .catch(err => {
              console.error('Remove vote error:', err);
              this.showToast('Failed to remove vote');
            });
        }
      });
    }
  },

  startCountdown() {
    const update = () => {
      const now = Date.now();
      const diff = this.data.finalDate - now;
      const dEl = document.getElementById('cd-days');
      if (!dEl) return;
      
      if (diff <= 0) {
        dEl.textContent = '00';
        document.getElementById('cd-hours').textContent = '00';
        document.getElementById('cd-mins').textContent = '00';
        document.getElementById('cd-secs').textContent = '00';
        const badge = document.querySelector('.hero-badge');
        if (badge) badge.textContent = ' MATCH DAY!';
        return;
      }
      
      document.getElementById('cd-days').textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
      document.getElementById('cd-hours').textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
      document.getElementById('cd-mins').textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      document.getElementById('cd-secs').textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    };
    update();
    setInterval(update, 1000);
  },

  initializeFirestore() {
    const docRef = doc(db, "poll", "votes");
    setDoc(docRef, { team1: 0, team2: 0 }, { merge: true })
      .then(() => console.log('Firestore initialized'))
      .catch(e => console.error("Firestore init error", e));
  },

  listenToVotes() {
    const docRef = doc(db, "poll", "votes");
    onSnapshot(docRef, (doc) => {
      console.log('Received votes update');
      if (doc.exists()) {
        this.data.votes = doc.data();
        console.log('Votes data:', this.data.votes);
      } else {
        this.data.votes = { team1: 0, team2: 0 };
      }
      this.renderPoll();
    }, (error) => {
      console.error('Firestore listener error:', error);
    });
  },

  renderPoll() {
    const container = document.getElementById('pollContainer');
    if (!container) {
      console.error('Poll container not found');
      return;
    }
    
    const total = (this.data.votes.team1 || 0) + (this.data.votes.team2 || 0);
    const pct1 = total > 0 ? ((this.data.votes.team1 / total) * 100) : 0;
    const pct2 = total > 0 ? ((this.data.votes.team2 / total) * 100) : 0;
    
    const teams = [
      { ...FINAL_TEAMS.team1, key: 'team1', pct: pct1, votes: this.data.votes.team1 || 0 },
      { ...FINAL_TEAMS.team2, key: 'team2', pct: pct2, votes: this.data.votes.team2 || 0 }
    ];
    
    container.innerHTML = teams.map(team => {
      const isVoted = this.data.userVote === team.key;
      const isDisabled = this.data.userVote !== null && !isVoted;
      return `
        <div class="poll-option ${isVoted ? 'voted' : ''} ${isDisabled ? 'disabled' : ''}" 
             data-team="${team.key}" onclick="window.FIFA.vote('${team.key}')">
          <div class="poll-bar" style="width: ${team.pct}%"></div>
          <div class="poll-content">
            <div class="poll-flag">${team.flag}</div>
            <div class="poll-info">
              <div class="poll-team">${team.name}</div>
              <div class="poll-confed">${team.confed}</div>
            </div>
            <div>
              <div class="poll-percent">${team.pct.toFixed(1)}%</div>
              <div class="poll-votes">${team.votes.toLocaleString()} votes</div>
            </div>
            <div class="poll-check"><i class="fa fa-check"></i></div>
          </div>
        </div>`;
    }).join('');
    
    const totalEl = document.getElementById('totalVotes');
    if (totalEl) {
      totalEl.textContent = total.toLocaleString();
    }
    
    console.log('Poll rendered, total votes:', total);
  },

  vote(teamKey) {
    console.log('Voting for:', teamKey);
    
    if (this.data.userVote) {
      this.showToast('You already voted! Click "Change Vote" to switch.');
      return;
    }
    
    this.data.userVote = teamKey;
    this.saveUserVote();
    
    const docRef = doc(db, "poll", "votes");
    updateDoc(docRef, { [teamKey]: increment(1) })
      .then(() => {
        const teamName = teamKey === 'team1' ? FINAL_TEAMS.team1.name : FINAL_TEAMS.team2.name;
        const teamFlag = teamKey === 'team1' ? FINAL_TEAMS.team1.flag : FINAL_TEAMS.team2.flag;
        this.showToast(`Voted for ${teamName}! ${teamFlag}`);
        this.celebrate();
      })
      .catch(error => {
        console.error('Vote error:', error);
        this.showToast('Vote failed. Try again!');
      });
  },

  renderPlayers() {
    const grid = document.getElementById('playersGrid');
    if (!grid) return;
    
    const allPlayers = [
      ...FINAL_TEAMS.team1.players.map(p => ({ ...p, country: FINAL_TEAMS.team1.name })),
      ...FINAL_TEAMS.team2.players.map(p => ({ ...p, country: FINAL_TEAMS.team2.name }))
    ];
    
    grid.innerHTML = allPlayers.map(p => `
      <div class="player-card">
        <div class="player-avatar">${p.emoji}</div>
        <div class="player-name">${p.name}</div>
        <div class="player-country">${p.country}</div>
        <div class="player-position">${p.pos}</div>
      </div>
    `).join('');
  },

  playChant(type) {
    const btn = event.currentTarget;
    btn.classList.add('playing');
    setTimeout(() => btn.classList.remove('playing'), 2000);
    
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      
      if (type === 'ole') { osc.frequency.value = 440; osc.type = 'sine'; } 
      else if (type === 'champions') { osc.frequency.value = 523; osc.type = 'triangle'; } 
      else { osc.frequency.value = 220; osc.type = 'sawtooth'; }
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      osc.start(); 
      osc.stop(ctx.currentTime + 1.5);
    } catch(e) { 
      this.showToast('🎵 Chant playing!'); 
    }
  },

  share(platform) {
    const t1 = FINAL_TEAMS.team1.name;
    const t2 = FINAL_TEAMS.team2.name;
    const text = `🏆 FIFA World Cup 2026 Final!\n⚽ July 19, 2026 - MetLife Stadium\n🔥 ${t1} vs ${t2}\n\nVote now on Learny!`;
    const url = window.location.href;
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      navigator.clipboard.writeText(text + '\n' + url).then(() => {
        this.showToast('Link copied to clipboard! 📋');
      });
    }
  },

  showToast(msg) {
    const el = document.getElementById('notification-toast');
    if (el) {
      el.querySelector('span').textContent = msg;
      el.classList.add('show');
      setTimeout(() => el.classList.remove('show'), 3000);
    } else {
      alert(msg);
    }
  },

  celebrate() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight;
    const colors = ['#fbbf24', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];
    const pieces = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, 
      y: -20, 
      s: Math.random() * 6 + 3,
      c: colors[Math.floor(Math.random() * colors.length)], 
      v: Math.random() * 3 + 2, 
      w: Math.random() * 10
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let done = true;
      pieces.forEach(p => {
        ctx.fillStyle = p.c; 
        ctx.beginPath(); 
        ctx.arc(p.x + Math.sin(p.w) * 10, p.y, p.s, 0, Math.PI * 2); 
        ctx.fill();
        p.y += p.v; 
        p.w += 0.1;
        if (p.y < canvas.height) done = false;
      });
      if (!done) requestAnimationFrame(draw); 
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    draw();
  }
};

// Expose to window
window.FIFA = FIFA;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing FIFA...');
  FIFA.init();
});

// Sidebar toggle logic
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.overlay');
  
  if (hamburger && sidebar) {
    hamburger.onclick = () => { 
      sidebar.classList.toggle('open'); 
      overlay.classList.toggle('show'); 
    };
    overlay.onclick = () => { 
      sidebar.classList.remove('open'); 
      overlay.classList.remove('show'); 
    };
  }
  
  document.querySelectorAll('.nav-item a').forEach(l => {
    l.onclick = () => {
      if (window.innerWidth <= 768) { 
        sidebar?.classList.remove('open'); 
        overlay?.classList.remove('show'); 
      }
    };
  });
});
