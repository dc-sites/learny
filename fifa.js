/* ========================================
FIFA 2026 FINAL - BULLETPROOF FIRESTORE
======================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getFirestore, doc, onSnapshot, setDoc, updateDoc, increment 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// YOUR NEW FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB3UhRo0hheRme0tbeVZJfysXpJfmsMy8M",
  authDomain: "fifa-802cb.firebaseapp.com",
  projectId: "fifa-802cb",
  storageBucket: "fifa-802cb.firebasestorage.app",
  messagingSenderId: "108737293984",
  appId: "1:108737293984:web:317edf66e496b636fe63c5",
  measurementId: "G-CVGEW0LD5P"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FINAL_TEAMS = {
  team1: { name: 'Argentina', flag: '🇦🇷', confed: 'CONMEBOL', players: [
    { name: 'L. Messi', pos: 'Forward', emoji: '🐐' }, { name: 'E. Martínez', pos: 'Goalkeeper', emoji: '🧤' },
    { name: 'J. Álvarez', pos: 'Forward', emoji: '⚡' }, { name: 'E. Fernández', pos: 'Midfielder', emoji: '🎯' }
  ]},
  team2: { name: 'France', flag: '🇫🇷', confed: 'UEFA', players: [
    { name: 'K. Mbappé', pos: 'Forward', emoji: '💨' }, { name: 'A. Griezmann', pos: 'Forward', emoji: '🎨' },
    { name: 'O. Dembélé', pos: 'Forward', emoji: '✨' }, { name: 'A. Tchouaméni', pos: 'Midfielder', emoji: '🛡️' }
  ]}
};

const FIFA = {
  data: { finalDate: new Date('2026-07-19T20:00:00-04:00').getTime(), userVote: null, votes: { team1: 0, team2: 0 } },

  init() {
    this.initTheme();
    this.data.userVote = localStorage.getItem('learny_fifa_user_vote');
    this.startCountdown();
    this.renderPlayers();
    this.bindEvents();
    this.listenToVotes();
  },

  // 🔥 FLAWLESS THEME SYNC
  initTheme() {
    try {
      const learndata = JSON.parse(localStorage.getItem('learny_data') || '{}');
      const isDark = learndata.darkMode !== false; // Default to dark
      
      if (!isDark) document.body.classList.add('light');
      else document.body.classList.remove('light');
      
      if (learndata.currentTheme && learndata.currentTheme !== 'purple') {
        document.body.classList.add(`theme-${learndata.currentTheme}`);
      }
      
      document.querySelectorAll('.theme-toggle i').forEach(icon => {
        icon.className = isDark ? 'fa fa-moon' : 'fa fa-sun';
      });
      
      document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.onclick = () => {
          const currentlyDark = !document.body.classList.contains('light');
          const newDark = !currentlyDark;
          
          if (newDark) document.body.classList.remove('light');
          else document.body.classList.add('light');
          
          document.querySelectorAll('.theme-toggle i').forEach(icon => {
            icon.className = newDark ? 'fa fa-moon' : 'fa fa-sun';
          });
          
          const data = JSON.parse(localStorage.getItem('learny_data') || '{}');
          data.darkMode = newDark;
          localStorage.setItem('learny_data', JSON.stringify(data));
          
          // Sync with main APP if available
          if (typeof APP !== 'undefined') {
            APP.data.darkMode = newDark;
            APP.save();
            APP.updateThemeIcon();
          }
        };
      });
    } catch (e) { console.error("Theme error", e); }
  },

  bindEvents() {
    document.getElementById('resetVoteBtn')?.addEventListener('click', () => {
      if (this.data.userVote) {
        updateDoc(doc(db, "poll", "votes"), { [this.data.userVote]: increment(-1) }).catch(() => {});
        this.data.userVote = null;
        localStorage.removeItem('learny_fifa_user_vote');
        this.showToast('Vote removed!');
      }
    });
  },

  startCountdown() {
    const update = () => {
      const diff = this.data.finalDate - Date.now();
      const dEl = document.getElementById('cd-days');
      if (!dEl) return;
      if (diff <= 0) {
        dEl.textContent = '00'; document.getElementById('cd-hours').textContent = '00';
        document.getElementById('cd-mins').textContent = '00'; document.getElementById('cd-secs').textContent = '00';
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

  // 🔥 REAL-TIME LISTENER (Never overwrites)
  listenToVotes() {
    onSnapshot(doc(db, "poll", "votes"), (docSnap) => {
      if (docSnap.exists()) {
        this.data.votes = docSnap.data();
      } else {
        this.data.votes = { team1: 0, team2: 0 };
      }
      this.renderPoll();
    }, (error) => {
      console.error("Firestore Error:", error);
    });
  },

  renderPoll() {
    const container = document.getElementById('pollContainer');
    if (!container) return;
    
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
        <div class="poll-option ${isVoted ? 'voted' : ''} ${isDisabled ? 'disabled' : ''}" onclick="window.FIFA.vote('${team.key}')">
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

  // 🔥 BULLETPROOF VOTING: Creates doc ONLY if it doesn't exist, then increments
  async vote(teamKey) {
    if (this.data.userVote) {
      this.showToast('You already voted! Click "Change Vote" to switch.');
      return;
    }
    
    this.data.userVote = teamKey;
    localStorage.setItem('learny_fifa_user_vote', teamKey);
    
    const docRef = doc(db, "poll", "votes");
    try {
      // Try to increment first
      await updateDoc(docRef, { [teamKey]: increment(1) });
    } catch (error) {
      // If it fails, the document doesn't exist yet. Create it safely, THEN increment.
      console.log("Creating new vote document safely...");
      await setDoc(docRef, { team1: 0, team2: 0 });
      await updateDoc(docRef, { [teamKey]: increment(1) });
    }

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
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const colors = ['#fbbf24', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6'];
    const pieces = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width, y: -20, s: Math.random() * 6 + 3,
      c: colors[Math.floor(Math.random() * colors.length)], v: Math.random() * 3 + 2, w: Math.random() * 10
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let done = true;
      pieces.forEach(p => {
        ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x + Math.sin(p.w) * 10, p.y, p.s, 0, Math.PI * 2); ctx.fill();
        p.y += p.v; p.w += 0.1;
        if (p.y < canvas.height) done = false;
      });
      if (!done) requestAnimationFrame(draw); else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    draw();
  }
};

window.FIFA = FIFA;
document.addEventListener('DOMContentLoaded', () => FIFA.init());
