/* ========================================
FIFA 2026 FINAL - INTERACTIVE MODULE
======================================== */

const FIFA = {
  data: {
    finalDate: new Date('2026-07-19T20:00:00-04:00').getTime(), // MetLife, 8PM ET
    teams: [
      { name: 'Argentina', flag: '🇦🇷', confed: 'CONMEBOL', votes: 1842 },
      { name: 'France', flag: '🇫🇷', confed: 'UEFA', votes: 1567 },
      { name: 'Brazil', flag: '🇧🇷', confed: 'CONMEBOL', votes: 1423 },
      { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confed: 'UEFA', votes: 1189 },
      { name: 'Spain', flag: '🇪🇸', confed: 'UEFA', votes: 987 },
      { name: 'Germany', flag: '🇩🇪', confed: 'UEFA', votes: 876 },
      { name: 'USA', flag: '🇺🇸', confed: 'CONCACAF', votes: 754 },
      { name: 'Portugal', flag: '🇵🇹', confed: 'UEFA', votes: 698 }
    ],
    players: [
      { name: 'L. Messi', country: 'Argentina', pos: 'Forward', emoji: '🐐' },
      { name: 'K. Mbappé', country: 'France', pos: 'Forward', emoji: '⚡' },
      { name: 'Vinícius Jr', country: 'Brazil', pos: 'Forward', emoji: '💨' },
      { name: 'J. Bellingham', country: 'England', pos: 'Midfielder', emoji: '🎯' },
      { name: 'Rodri', country: 'Spain', pos: 'Midfielder', emoji: '🛡️' },
      { name: 'Jamal Musiala', country: 'Germany', pos: 'Midfielder', emoji: '✨' },
      { name: 'C. Pulisic', country: 'USA', pos: 'Forward', emoji: '🇺🇸' },
      { name: 'B. Fernandes', country: 'Portugal', pos: 'Midfielder', emoji: '🎨' }
    ],
    userVote: null,
    scoreA: 0,
    scoreB: 0,
    predictions: []
  },

  init() {
    this.loadState();
    this.startCountdown();
    this.renderPoll();
    this.renderPlayers();
    this.renderPredictions();
    this.bindEvents();
    this.simulateLiveVotes();
  },

  loadState() {
    try {
      const saved = localStorage.getItem('learny_fifa_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.teams) this.data.teams = parsed.teams;
        if (parsed.predictions) this.data.predictions = parsed.predictions;
        if (parsed.userVote !== undefined) this.data.userVote = parsed.userVote;
      }
    } catch(e) { console.warn('Load error', e); }
  },

  saveState() {
    try {
      localStorage.setItem('learny_fifa_data', JSON.stringify({
        teams: this.data.teams,
        predictions: this.data.predictions,
        userVote: this.data.userVote
      }));
    } catch(e) { console.warn('Save error', e); }
  },

  bindEvents() {
    document.getElementById('resetVoteBtn')?.addEventListener('click', () => {
      if (this.data.userVote !== null) {
        this.data.teams[this.data.userVote].votes = Math.max(0, this.data.teams[this.data.userVote].votes - 1);
        this.data.userVote = null;
        this.saveState();
        this.renderPoll();
        this.showToast('Vote removed. Pick a new champion! 🏆');
      }
    });
  },

  // COUNTDOWN
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

  // POLL
  renderPoll() {
    const container = document.getElementById('pollContainer');
    if (!container) return;
    const total = this.data.teams.reduce((s, t) => s + t.votes, 0);
    container.innerHTML = this.data.teams.map((team, i) => {
      const pct = total > 0 ? ((team.votes / total) * 100) : 0;
      const isVoted = this.data.userVote === i;
      return `
        <div class="poll-option ${isVoted ? 'voted' : ''} ${this.data.userVote !== null && !isVoted ? 'disabled' : ''}" 
             data-index="${i}" onclick="FIFA.vote(${i})">
          <div class="poll-bar" style="width: ${pct}%"></div>
          <div class="poll-content">
            <div class="poll-flag">${team.flag}</div>
            <div class="poll-info">
              <div class="poll-team">${team.name}</div>
              <div class="poll-confed">${team.confed}</div>
            </div>
            <div>
              <div class="poll-percent">${pct.toFixed(1)}%</div>
              <div class="poll-votes">${team.votes.toLocaleString()} votes</div>
            </div>
            <div class="poll-check"><i class="fa fa-check"></i></div>
          </div>
        </div>`;
    }).join('');
    document.getElementById('totalVotes').textContent = total.toLocaleString();
  },

  vote(index) {
    if (this.data.userVote !== null) {
      this.showToast('You already voted! Click "Change Vote" to switch.');
      return;
    }
    this.data.userVote = index;
    this.data.teams[index].votes++;
    this.saveState();
    this.renderPoll();
    this.showToast(`Voted for ${this.data.teams[index].name}! ${this.data.teams[index].flag}`);
    this.celebrate();
  },

  simulateLiveVotes() {
    setInterval(() => {
      const randomTeam = Math.floor(Math.random() * this.data.teams.length);
      this.data.teams[randomTeam].votes += Math.floor(Math.random() * 3) + 1;
      this.saveState();
      this.renderPoll();
    }, 5000);
  },

  // PLAYERS
  renderPlayers() {
    const grid = document.getElementById('playersGrid');
    if (!grid) return;
    grid.innerHTML = this.data.players.map(p => `
      <div class="player-card">
        <div class="player-avatar">${p.emoji}</div>
        <div class="player-name">${p.name}</div>
        <div class="player-country">${p.country}</div>
        <div class="player-position">${p.pos}</div>
      </div>
    `).join('');
  },

  // PREDICT SCORE
  adjustScore(team, delta) {
    if (team === 'a') {
      this.data.scoreA = Math.max(0, Math.min(15, this.data.scoreA + delta));
      document.getElementById('scoreA').textContent = this.data.scoreA;
    } else {
      this.data.scoreB = Math.max(0, Math.min(15, this.data.scoreB + delta));
      document.getElementById('scoreB').textContent = this.data.scoreB;
    }
  },

  submitPrediction() {
    const teamA = document.getElementById('teamA').value.trim() || 'Team A';
    const teamB = document.getElementById('teamB').value.trim() || 'Team B';
    if (this.data.scoreA === 0 && this.data.scoreB === 0) {
      this.showToast('Please set a score first! ⚽');
      return;
    }
    const prediction = {
      id: Date.now(),
      teamA, teamB,
      scoreA: this.data.scoreA,
      scoreB: this.data.scoreB,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.data.predictions.unshift(prediction);
    if (this.data.predictions.length > 10) this.data.predictions = this.data.predictions.slice(0, 10);
    this.saveState();
    this.renderPredictions();
    this.showToast(`Prediction saved: ${teamA} ${this.data.scoreA}-${this.data.scoreB} ${teamB} 🎯`);
    this.celebrate();
    document.getElementById('teamA').value = '';
    document.getElementById('teamB').value = '';
    this.data.scoreA = 0; this.data.scoreB = 0;
    document.getElementById('scoreA').textContent = '0';
    document.getElementById('scoreB').textContent = '0';
  },

  renderPredictions() {
    const content = document.getElementById('predictionsContent');
    if (!content) return;
    if (this.data.predictions.length === 0) {
      content.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px;">No predictions yet. Be the first! 🎯</p>';
      return;
    }
    content.innerHTML = this.data.predictions.map(p => `
      <div class="prediction-item">
        <div>
          <strong>${p.teamA}</strong> 
          <span class="prediction-score">${p.scoreA} - ${p.scoreB}</span> 
          <strong>${p.teamB}</strong>
        </div>
        <div class="prediction-time"><i class="fa fa-clock"></i> ${p.time}</div>
      </div>
    `).join('');
  },

  // CHANTS
  playChant(type) {
    const btn = event.currentTarget;
    btn.classList.add('playing');
    setTimeout(() => btn.classList.remove('playing'), 2000);
    
    // Web Audio API - simple tones
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      
      if (type === 'ole') {
        osc.frequency.value = 440;
        osc.type = 'sine';
      } else if (type === 'champions') {
        osc.frequency.value = 523;
        osc.type = 'triangle';
      } else {
        osc.frequency.value = 220;
        osc.type = 'sawtooth';
      }
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch(e) {
      this.showToast('🎵 Chant playing!');
    }
  },

  // SHARE
  share(platform) {
    const text = `🏆 FIFA World Cup 2026 Final!\n⚽ July 19, 2026 - MetLife Stadium\n🔥 Who will be crowned champions?\n\nVote now on Learny!`;
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

  // UTILITIES
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

// Initialize
document.addEventListener('DOMContentLoaded', () => FIFA.init());

// Sidebar toggle (reuse Learny logic)
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