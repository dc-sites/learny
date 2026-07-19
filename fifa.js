/* ========================================
FIFA 2026 FINAL - FIREBASE LIVE MODULE
======================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Your exact Firebase configuration
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
const db = getDatabase(app);

// ============ FINAL TEAMS CONFIGURATION ============
// Update these names/flags when the actual 2026 finalists are known
const FINAL_TEAMS = {
  team1: {
    name: 'Argentina',
    flag: '🇦🇷',
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
    flag: '🇫🇷',
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
    this.loadUserVote();
    this.startCountdown();
    this.renderPlayers();
    this.bindEvents();
    this.listenToVotes();
  },

  loadUserVote() {
    try {
      const saved = localStorage.getItem('learny_fifa_user_vote');
      if (saved) this.data.userVote = saved;
    } catch(e) { console.warn('Load error', e); }
  },

  saveUserVote() {
    try {
      if (this.data.userVote) {
        localStorage.setItem('learny_fifa_user_vote', this.data.userVote);
      } else {
        localStorage.removeItem('learny_fifa_user_vote');
      }
    } catch(e) { console.warn('Save error', e); }
  },

  bindEvents() {
    document.getElementById('resetVoteBtn')?.addEventListener('click', () => {
      if (this.data.userVote) {
        const teamKey = this.data.userVote;
        runTransaction(ref(db, `votes/${teamKey}`), current => {
          return (current || 0) - 1;
        });
        this.data.userVote = null;
        this.saveUserVote();
        this.showToast('Vote removed. Pick a new champion! 🏆');
      }
    });
  },

  startCountdown() {
    const update = () => {
      const now = Date.now();
      const diff = this.data.finalDate - now;
      const dEl = document.getElementById('cd-days');
      const hEl = document.getElementById('cd-hours');
      const mEl = document.getElementById('cd-mins');
      const sEl = document.getElementById('cd-secs');
      if (!dEl) return;

      if (diff <= 0) {
        dEl.textContent = '00'; hEl.textContent = '00';
        mEl.textContent = '00'; sEl.textContent = '00';
        document.querySelector('.hero-badge').textContent = '🔴 MATCH DAY!';
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      dEl.textContent = String(days).padStart(2, '0');
      hEl.textContent = String(hours).padStart(2, '0');
      mEl.textContent = String(mins).padStart(2, '0');
      sEl.textContent = String(secs).padStart(2, '0');
    };
    update();
    setInterval(update, 1000);
  },

  listenToVotes() {
    onValue(ref(db, 'votes'), snapshot => {
      this.data.votes = snapshot.val() || { team1: 0, team2: 0 };
      this.renderPoll();
    });
  },

  renderPoll() {
    const container = document.getElementById('pollContainer');
    if (!container) return;
    
    const total = this.data.votes.team1 + this.data.votes.team2;
    const pct1 = total > 0 ? ((this.data.votes.team1 / total) * 100) : 0;
    const pct2 = total > 0 ? ((this.data.votes.team2 / total) * 100) : 0;
    
    const teams = [
      { ...FINAL_TEAMS.team1, key: 'team1', pct: pct1, votes: this.data.votes.team1 },
      { ...FINAL_TEAMS.team2, key: 'team2', pct: pct2, votes: this.data.votes.team2 }
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
    
    document.getElementById('totalVotes').textContent = total.toLocaleString();
  },

  vote(teamKey) {
    if (this.data.userVote) {
      this.showToast('You already voted! Click "Change Vote" to switch.');
      return;
    }
    
    this.data.userVote = teamKey;
    this.saveUserVote();
    
    runTransaction(ref(db, `votes/${teamKey}`), current => {
      return (current || 0) + 1;
    });
    
    const teamName = teamKey === 'team1' ? FINAL_TEAMS.team1.name : FINAL_TEAMS.team2.name;
    const teamFlag = teamKey === 'team1' ? FINAL_TEAMS.team1.flag : FINAL_TEAMS.team2.flag;
    this.showToast(`Voted for ${teamName}! ${teamFlag}`);
    this.celebrate();
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
      
      if (type === 'ole') {
        osc.frequency.value = 440; osc.type = 'sine';
      } else if (type === 'champions') {
        osc.frequency.value = 523; osc.type = 'triangle';
      } else {
        osc.frequency.value = 220; osc.type = 'sawtooth';
      }
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

// Expose to window so HTML onclick handlers can access it
window.FIFA = FIFA;

// Initialize
document.addEventListener('DOMContentLoaded', () => FIFA.init());

// Sidebar toggle logic
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.overlay');
  if (hamburger && sidebar) {
    hamburger.onclick = () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); };
    overlay.onclick = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); };
  }
  document.querySelectorAll('.nav-item a').forEach(l => l.onclick = () => {
    if (window.innerWidth <= 768) { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); }
  });
});
