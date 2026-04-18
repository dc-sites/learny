const APP = {
  data: {
    tasks: [], timeLogs: [], achievements: {}, marks: [], pomodoroSessions: [],
    examDate: null, countdowns: [], weeklyGoal: 35, currentTheme: 'purple',
    darkMode: false, streak: 0, lastLogin: null,
    pomoSettings: { work: 25, short: 5, long: 15, longBreakAfter: 4 },
    profile: { 
      name: 'User', 
      avatar: 'https://i.postimg.cc/QdPYLqrV/AIRetouch-20260412-135002012.png',
      gender: '', age: null,
      subtext: "Let's start learning 🎯"
    },
    quotes: [
      { en: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", si: "ඔවුන්ගේ සිහිනවල රූපලාවණ්‍යය විශ්වාස කරන්නන්ට අනාගතය හිමිවේ." },
      { en: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill", si: "සාර්ථකත්වය අවසාන නොවේ, අසාර්ථකත්වය මාරාන්තික නොවේ: ඉදිරියට යාමට ඇති ධෛර්ය වැදගත්ය." },
      { en: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", si: "ඔබ නතර නොවන්නේ නම් ඔබ කෙතරම් සෙමින් යන්නේ ද යන්න වැදගත් නොවේ." },
      { en: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", si: "ලෝකය වෙනස් කිරීමට ඔබට භාවිතා කළ හැකි බලවත්ම ආයුධය අධ්‍යාපනයයි." },
      { en: "Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world.", author: "Albert Einstein", si: "කල්පනාව දැනුමට වඩා වැදගත්ය. දැනුම සීමිතය. කල්පනාව ලෝකය වට කරයි." },
      { en: "You may not control all the events that happen to you, but you can decide not to be reduced by them.", author: "Maya Angelou", si: "ඔබට සිදුවන සියලු සිදුවීම් පාලනය කළ නොහැකි වුවත්, ඒවායින් පරාජය නොවී ඉදිරියට යාම ඔබේ තේරීමයි." },
      { en: "The only way to do great work is to love what you do.", author: "Steve Jobs", si: "මහා කාර්යයන් සාර්ථකව ඉටු කිරීමට ඇති එකම මාර්ගය ඔබ කරන දෙයට ආදරය කිරීමයි." },
      { en: "One child, one teacher, one book, one pen can change the world.", author: "Malala Yousafzai", si: "එක දරුවෙක්, එක ගුරුවරයෙක්, එක පොතක්, එක පෑනක් ලෝකය වෙනස් කළ හැකිය." },
      { en: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison", si: "මම අසාර්ථක වී නැත. මම වැඩ නොකරන ආකාර දසදහසක් සොයාගෙන ඇත." },
      { en: "Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence.", author: "Helen Keller", si: "සුබවාදය යනු සාර්ථකත්වයට ගෙන යන විශ්වාසයයි. බලාපොරොත්තුව හා විශ්වාසය නොමැතිව කිසිවක් කළ නොහැක." }
    ]
  },

  pomo: {
    timer: null, timeLeft: 0, endTime: 0, isRunning: false, mode: 'work', sessions: 0,
    init() {
      this.loadState(); this.bindUI(); this.updateDisplay(); this.renderSessions();
      if (this.isRunning && this.endTime > Date.now()) {
        this.timeLeft = Math.max(0, Math.ceil((this.endTime - Date.now()) / 1000));
        this.resumeBackgroundTimer();
      } else if (this.isRunning && this.endTime <= Date.now()) {
        this.completeTimer();
      }
    },
    loadState() {
      const saved = localStorage.getItem('learny_pomo_state');
      if (saved) {
        const s = JSON.parse(saved);
        this.timeLeft = s.timeLeft; this.endTime = s.endTime; this.isRunning = s.isRunning;
        this.mode = s.mode; this.sessions = s.sessions || 0;
      } else {
        this.timeLeft = (APP.data.pomoSettings?.work || 25) * 60;
      }
    },
    saveState() {
      localStorage.setItem('learny_pomo_state', JSON.stringify({
        timeLeft: this.timeLeft, endTime: this.endTime, isRunning: this.isRunning,
        mode: this.mode, sessions: this.sessions
      }));
    },
    bindUI() {
      document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.onclick = () => {
          if (this.isRunning) return;
          this.mode = btn.dataset.mode;
          document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.timeLeft = this.getDuration() * 60;
          this.isRunning = false; this.endTime = 0;
          this.updateDisplay(); this.saveState();
        };
      });
      document.getElementById('pomo-start')?.addEventListener('click', () => this.start());
      document.getElementById('pomo-pause')?.addEventListener('click', () => this.pause());
      document.getElementById('pomo-stop')?.addEventListener('click', () => this.stop());
      document.getElementById('pomo-fullscreen')?.addEventListener('click', () => this.toggleFullscreen(true));
      document.getElementById('pomo-minimize')?.addEventListener('click', () => this.toggleFullscreen(false));
      document.getElementById('save-settings')?.addEventListener('click', () => {
        const w = parseInt(document.getElementById('set-work').value) || 25;
        const s = parseInt(document.getElementById('set-short').value) || 5;
        const l = parseInt(document.getElementById('set-long').value) || 15;
        APP.data.pomoSettings = { work: w, short: s, long: l, longBreakAfter: 4 };
        APP.save();
        if (!this.isRunning) { this.timeLeft = this.getDuration() * 60; this.updateDisplay(); }
        APP.showToast('Settings saved!');
      });
      document.getElementById('export-pdf')?.addEventListener('click', () => this.exportPDF());
      const ps = APP.data.pomoSettings || { work: 25, short: 5, long: 15 };
      document.getElementById('set-work').value = ps.work;
      document.getElementById('set-short').value = ps.short;
      document.getElementById('set-long').value = ps.long;
      document.getElementById('long-break-target').textContent = ps.longBreakAfter;
      document.getElementById('session-count-display').textContent = this.sessions;
    },
    getDuration() {
      const ps = APP.data.pomoSettings || { work: 25, short: 5, long: 15 };
      return this.mode === 'work' ? ps.work : this.mode === 'shortBreak' ? ps.short : ps.long;
    },
    updateDisplay() {
      const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
      const s = (this.timeLeft % 60).toString().padStart(2, '0');
      const minEl = document.getElementById('pomo-min');
      const secEl = document.getElementById('pomo-sec');
      if (minEl) minEl.textContent = m;
      if (secEl) secEl.textContent = s;
      document.title = this.isRunning ? `(${m}:${s}) Learny Pomodoro` : 'Learny - Pomodoro';
      document.getElementById('pomo-start').classList.toggle('hidden', this.isRunning);
      document.getElementById('pomo-pause').classList.toggle('hidden', !this.isRunning);
      const statusEl = document.getElementById('pomo-status');
      if (statusEl) {
        statusEl.textContent = this.isRunning ? (this.mode === 'work' ? 'Focus Time' : this.mode === 'shortBreak' ? 'Short Break' : 'Long Break') : 'Ready';
      }
    },
    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.endTime = Date.now() + (this.timeLeft * 1000);
      this.saveState(); APP.requestNotif(); this.tick();
    },
    tick() {
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        this.timeLeft = Math.max(0, Math.ceil((this.endTime - Date.now()) / 1000));
        this.updateDisplay();
        if (this.timeLeft <= 0) this.completeTimer();
      }, 1000);
    },
    resumeBackgroundTimer() { this.isRunning = true; this.updateDisplay(); this.tick(); },
    pause() {
      clearInterval(this.timer);
      this.isRunning = false; this.endTime = 0; this.saveState(); this.updateDisplay();
    },
    stop() {
      clearInterval(this.timer);
      this.isRunning = false; this.endTime = 0; this.timeLeft = this.getDuration() * 60;
      this.saveState(); this.updateDisplay();
    },
    completeTimer() {
      clearInterval(this.timer); this.isRunning = false; this.endTime = 0;
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Learny Pomodoro', { body: `${this.mode === 'work' ? 'Focus' : 'Break'} session completed!` });
      }
      APP.showToast(`${this.mode === 'work' ? 'Focus' : 'Break'} session completed!`);
      if (this.mode === 'work') {
        this.sessions++;
        const ps = APP.data.pomoSettings || { work: 25 };
        APP.data.pomodoroSessions.push({ date: new Date().toISOString(), mode: 'work', duration: ps.work });
        APP.save(); this.renderSessions();
        if (this.sessions % (ps.longBreakAfter || 4) === 0) {
          this.mode = 'longBreak'; this.timeLeft = (ps.long || 15) * 60;
        } else {
          this.mode = 'shortBreak'; this.timeLeft = (ps.short || 5) * 60;
        }
      } else {
        this.mode = 'work'; this.timeLeft = (APP.data.pomoSettings?.work || 25) * 60;
      }
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === this.mode));
      document.getElementById('session-count-display').textContent = this.sessions;
      this.saveState(); this.updateDisplay();
    },
    toggleFullscreen(on) {
      const el = document.querySelector('.pomodoro-main');
      if (!el) return;
      if (on) { el.classList.add('fullscreen'); document.documentElement.requestFullscreen?.(); }
      else { el.classList.remove('fullscreen'); document.exitFullscreen?.(); }
    },
    renderSessions() {
      const list = document.getElementById('pomo-sessions-list');
      if (!list) return;
      const recent = (APP.data.pomodoroSessions || []).slice(-10).reverse();
      list.innerHTML = recent.length ? recent.map(s =>
        `<div class="session-item"><span><i class="fa fa-check-circle" style="color:var(--success)"></i> ${s.mode === 'work' ? 'Focus' : 'Break'} Session</span><span class="sess-time">${new Date(s.date).toLocaleString()} • ${s.duration}m</span></div>`
      ).join('') : '<p style="color:var(--text-muted);text-align:center;">No sessions yet</p>';
    },
    exportPDF() {
      if (!window.jspdf) return APP.showToast('PDF library not loaded.');
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const sessions = APP.data.pomodoroSessions || [];
      if (sessions.length === 0) return APP.showToast('No sessions to export');
      doc.setFontSize(22); doc.setTextColor(108, 43, 217);
      doc.text('Learny Pomodoro Report', 14, 22);
      doc.setFontSize(12); doc.setTextColor(100, 100, 100);
      const totalFocus = sessions.filter(s => s.mode === 'work').length;
      doc.text(`Generated: ${new Date().toLocaleDateString()} | Total Focus Sessions: ${totalFocus}`, 14, 32);
      const tableData = sessions.slice(-20).reverse().map((s, i) => [
        sessions.length - i, new Date(s.date).toLocaleString(), s.mode === 'work' ? 'Focus' : 'Break', `${s.duration} min`
      ]);
      doc.autoTable({
        startY: 40, head: [['#', 'Date & Time', 'Type', 'Duration']], body: tableData,
        theme: 'grid', headStyles: { fillColor: [108, 43, 217] }, styles: { fontSize: 10, cellPadding: 5 }
      });
      doc.save(`learny-pomodoro-${new Date().toISOString().slice(0,10)}.pdf`);
      APP.showToast('PDF exported successfully!');
    }
  },

  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  },

  updateGreetingUI() {
    const profile = this.data.profile || { name: 'User', avatar: 'https://i.postimg.cc/QdPYLqrV/AIRetouch-20260412-135002012.png', subtext: "Let's start learning 🎯" };
    const greeting = this.getGreeting();
    const defaultAvatar = 'https://i.postimg.cc/QdPYLqrV/AIRetouch-20260412-135002012.png';
    const avatar = profile.avatar || defaultAvatar;
    const userName = profile.name || 'User';
    const subtext = profile.subtext || "Let's start learning 🎯";
    
    const greetingFull = document.getElementById('greeting-full');
    const greetingSub = document.getElementById('greeting-sub');
    const dashAvatar = document.getElementById('dashboard-avatar');
    const sidebarName = document.getElementById('sidebar-username');
    
    if (greetingFull) greetingFull.textContent = `${greeting}, ${userName.charAt(0).toUpperCase() + userName.slice(1)}`;
    if (greetingSub) greetingSub.textContent = subtext;
    if (dashAvatar) dashAvatar.src = avatar;
    if (sidebarName) sidebarName.textContent = `Welcome, ${userName}!`;
    
    const previewGreeting = document.getElementById('preview-greeting');
    const previewSubtext = document.getElementById('preview-subtext');
    const previewAvatar = document.getElementById('preview-avatar');
    
    if (previewGreeting) previewGreeting.textContent = `${greeting}, ${userName.charAt(0).toUpperCase() + userName.slice(1)}`;
    if (previewSubtext) previewSubtext.textContent = subtext;
    if (previewAvatar) previewAvatar.src = avatar;
  },

  initProfile() {
    const profile = this.data.profile || { name: 'User', avatar: 'https://i.postimg.cc/QdPYLqrV/AIRetouch-20260412-135002012.png', gender: '', age: null, subtext: "Let's start learning 🎯" };
    
    const nameInput = document.getElementById('profile-name');
    const subtextInput = document.getElementById('profile-subtext');
    const genderInput = document.getElementById('profile-gender');
    const ageInput = document.getElementById('profile-age');
    
    if (nameInput && profile.name) nameInput.value = profile.name;
    if (subtextInput && profile.subtext) subtextInput.value = profile.subtext;
    if (genderInput && profile.gender) genderInput.value = profile.gender;
    if (ageInput && profile.age) ageInput.value = profile.age;
    
    if (subtextInput) {
      const counter = document.createElement('small');
      counter.className = 'char-counter';
      counter.textContent = `${subtextInput.value.length}/30`;
      subtextInput.parentNode.appendChild(counter);
      subtextInput.addEventListener('input', (e) => {
        counter.textContent = `${e.target.value.length}/30`;
        const previewSub = document.getElementById('preview-subtext');
        if (previewSub) previewSub.textContent = e.target.value || "Let's start learning 🎯";
      });
    }
    
    document.querySelectorAll('.avatar-option').forEach(option => {
      if (profile.avatar && option.dataset.avatar === profile.avatar) option.classList.add('selected');
      option.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        this.updateGreetingUI();
      });
    });
    
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        const previewGreeting = document.getElementById('preview-greeting');
        const sidebarName = document.getElementById('sidebar-username');
        const val = e.target.value.trim() || 'User';
        if (previewGreeting) {
          const greeting = this.getGreeting();
          previewGreeting.textContent = `${greeting}, ${val.charAt(0).toUpperCase() + val.slice(1)}`;
        }
        if (sidebarName) sidebarName.textContent = `Welcome, ${val}!`;
      });
    }
    
    document.getElementById('profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const selectedAvatar = document.querySelector('.avatar-option.selected');
      const subtextVal = document.getElementById('profile-subtext')?.value.trim();
      
      this.data.profile = {
        name: document.getElementById('profile-name').value.trim() || 'User',
        avatar: selectedAvatar ? selectedAvatar.dataset.avatar : 'https://i.postimg.cc/QdPYLqrV/AIRetouch-20260412-135002012.png',
        gender: document.getElementById('profile-gender').value,
        age: parseInt(document.getElementById('profile-age').value) || null,
        subtext: subtextVal ? subtextVal.slice(0, 30) : "Let's start learning 🎯"
      };
      this.save();
      this.updateGreetingUI();
      this.showToast('Profile saved successfully! 🎉');
      setTimeout(() => window.location.href = 'index.html', 1200);
    });
    this.updateGreetingUI();
  },

  init() {
    this.load(); this.fixThemeUI(); this.bindThemeToggle(); this.setupSidebar();
    this.updateStreak(); this.requestNotif();
    this.updateGreetingUI();
    const path = window.location.pathname.split('/').pop();
    if (path === 'index.html' || path === '') this.initDashboard();
    if (path.includes('tasks.html')) this.initTasks();
    if (path.includes('time.html')) this.initTime();
    if (path.includes('achievements.html')) this.initAchievements();
    if (path.includes('assistant.html')) this.initAssistant();
    if (path.includes('pomodoro.html')) this.initPomodoro();
    if (path.includes('mark.html')) this.initMark();
    if (path.includes('music.html')) this.initMusic();
    if (path.includes('countdown.html')) this.initCountdown();
    if (path.includes('settings.html')) this.initSettings();
    if (path.includes('rate.html')) this.initRate();
    if (path.includes('motivation.html')) this.initMotivation();
    if (path.includes('profile.html')) this.initProfile();
  },

  load() {
    const saved = localStorage.getItem('learny_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.profile) parsed.profile = { name: 'User', avatar: 'https://i.postimg.cc/QdPYLqrV/AIRetouch-20260412-135002012.png', gender: '', age: null, subtext: "Let's start learning 🎯" };
      if (!parsed.profile.subtext) parsed.profile.subtext = "Let's start learning 🎯";
      if (!parsed.profile.avatar) parsed.profile.avatar = 'https://i.postimg.cc/QdPYLqrV/AIRetouch-20260412-135002012.png';
      Object.assign(this.data, parsed);
    } else {
      this.data.profile = { name: 'User', avatar: 'https://i.postimg.cc/QdPYLqrV/AIRetouch-20260412-135002012.png', gender: '', age: null, subtext: "Let's start learning 🎯" };
    }
  },
  save() { localStorage.setItem('learny_data', JSON.stringify(this.data)); },
  getThemeColor() {
    const map = { purple: '#6c2bd9', red: '#ef4444', green: '#10b981', blue: '#3b82f6', yellow: '#eab308' };
    return map[this.data.currentTheme] || '#6c2bd9';
  },
  fixThemeUI() {
    if (this.data.darkMode === false) document.body.classList.add('light');
    if (this.data.currentTheme && this.data.currentTheme !== 'purple') document.body.classList.add(`theme-${this.data.currentTheme}`);
    this.updateThemeIcon();
  },
  bindThemeToggle() {
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.onclick = () => {
        this.data.darkMode = !this.data.darkMode;
        document.body.classList.toggle('light', !this.data.darkMode);
        this.updateThemeIcon(); this.save();
        this.showToast(`Switched to ${this.data.darkMode ? 'Dark' : 'Light'} Mode`);
      };
    });
  },
  updateThemeIcon() { document.querySelectorAll('.theme-toggle i').forEach(i => i.className = this.data.darkMode ? 'fa fa-moon' : 'fa fa-sun'); },
  setupSidebar() {
    const hamburger = document.querySelector('.hamburger');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.overlay');
    if (hamburger && sidebar) {
      hamburger.onclick = () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); };
      overlay.onclick = () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); };
    }
    document.querySelectorAll('.nav-item a').forEach(l => l.onclick = () => {
      if (window.innerWidth <= 768) { sidebar.classList.remove('open'); overlay.classList.remove('show'); }
    });
  },
  showToast(msg) {
    const el = document.getElementById('notification-toast');
    if (el) { el.querySelector('span').textContent = msg; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3000); }
    if ('Notification' in window && Notification.permission === 'granted') new Notification('Learny', { body: msg });
  },
  requestNotif() { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); },
  updateStreak() {
    const today = new Date().toDateString();
    if (this.data.lastLogin !== today) {
      const last = new Date(this.data.lastLogin || today);
      const diff = Math.floor((new Date() - last) / 86400000);
      this.data.streak = diff <= 1 ? this.data.streak + 1 : 1;
      this.data.lastLogin = today; this.save();
    }
  },
  getTodayStudy() {
    const t = new Date().toISOString().split('T')[0];
    return (this.data.timeLogs.find(l => l.date === t)?.hours || 0).toFixed(1);
  },
  getTotalStudy() { return this.data.timeLogs.reduce((a, l) => a + l.hours, 0); },
  drawChart(canvasId, data, color = '#6c2bd9') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr); canvas.style.width = rect.width + 'px'; canvas.style.height = rect.height + 'px';
    const w = rect.width, h = rect.height;
    const pad = { top: 20, right: 15, bottom: 35, left: 40 };
    const chartW = w - pad.left - pad.right; const chartH = h - pad.top - pad.bottom;
    const max = Math.max(...data.map(d => d.y), 2) * 1.15;
    const gridColor = getComputedStyle(document.body).getPropertyValue('--chart-grid').trim();
    const textColor = getComputedStyle(document.body).getPropertyValue('--chart-label').trim();
    ctx.clearRect(0, 0, w, h); ctx.strokeStyle = gridColor; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.moveTo(pad.left, y); ctx.lineTo(w - pad.right, y);
      ctx.fillStyle = textColor; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText((max - (max/4)*i).toFixed(1), pad.left - 8, y + 4);
    }
    ctx.stroke();
    const barW = (chartW / data.length) * 0.55; const gap = chartW / data.length;
    ctx.shadowColor = color + '40'; ctx.shadowBlur = 10;
    data.forEach((d, i) => {
      const x = pad.left + gap * i + (gap - barW) / 2;
      const barH = (d.y / max) * chartH; const y = pad.top + chartH - barH;
      const grad = ctx.createLinearGradient(x, y, x, pad.top + chartH);
      grad.addColorStop(0, color); grad.addColorStop(1, color + '33');
      ctx.fillStyle = grad; ctx.fillRect(x, y, barW, barH);
      ctx.fillStyle = textColor; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(d.x, x + barW / 2, h - 12);
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-main').trim();
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.shadowColor = 'transparent'; ctx.fillText(d.y, x + barW / 2, y - 8); ctx.shadowBlur = 10;
    });
    ctx.shadowColor = 'transparent';
  },
  initMotivation() {
    this.renderQuotes();
    document.getElementById('refresh-quotes')?.addEventListener('click', () => this.shuffleAndRender());
  },
  renderQuotes() {
    const container = document.getElementById('quotes-container');
    if (!container) return; container.innerHTML = '';
    this.data.quotes.forEach((q, i) => {
      const card = document.createElement('div'); card.className = 'quote-card fade-in-anim';
      card.style.animationDelay = `${i * 0.08}s`;
      card.innerHTML = `<div class="quote-text">${q.en}</div><div class="quote-author">— ${q.author}</div><div class="quote-sinhala">${q.si}</div><button class="translate-btn"><i class="fa fa-language"></i> Translate to Sinhala</button>`;
      container.appendChild(card);
    });
    this.bindTranslateButtons();
  },
  bindTranslateButtons() {
    document.querySelectorAll('.translate-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.quote-card');
        const sinhalaEl = card.querySelector('.quote-sinhala');
        sinhalaEl.classList.toggle('show');
        const isShowing = sinhalaEl.classList.contains('show');
        btn.innerHTML = isShowing ? '<i class="fa fa-language"></i> Hide Translation' : '<i class="fa fa-language"></i> Translate to Sinhala';
      });
    });
  },
  shuffleAndRender() {
    const btn = document.getElementById('refresh-quotes');
    if (!btn) return; btn.style.transform = 'rotate(360deg)';
    setTimeout(() => btn.style.transform = '', 400);
    const shuffled = [...this.data.quotes];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const original = this.data.quotes; this.data.quotes = shuffled;
    this.renderQuotes(); this.data.quotes = original;
    this.showToast('Quotes refreshed!');
  },
  initDashboard() {
    const today = new Date().toDateString();
    const tasks = this.data.tasks.filter(t => t.date === today);
    document.getElementById('today-tasks-count').textContent = tasks.length;
    document.getElementById('day-streak').textContent = this.data.streak;
    document.getElementById('today-study-time').textContent = this.getTodayStudy() + 'h';
    document.getElementById('total-study-hours').textContent = this.getTotalStudy().toFixed(1) + 'h';
    document.getElementById('total-days').textContent = this.data.timeLogs.length;
    document.getElementById('avg-hours').textContent = (this.getTotalStudy() / (this.data.timeLogs.length || 1)).toFixed(1);
    document.getElementById('total-done').textContent = this.data.tasks.filter(t => t.done).length;
    document.getElementById('achievement-count').textContent = (this.data.achievements.badges || []).length;
    document.getElementById('today-tasks-list').innerHTML = tasks.length ? tasks.map(t =>
      `<div class="task-item ${t.done ? 'done' : ''}"><div class="task-check ${t.done ? 'checked' : ''}" onclick="APP.toggleTask('${t.id}')"><i class="fa fa-check"></i></div><span class="task-text">${t.text}</span><span class="task-time"><i class="fa fa-clock"></i> ${t.time}</span></div>`
    ).join('') : '<p style="color:var(--text-muted);text-align:center;">No tasks today</p>';
    const daysToFetch = window.innerWidth <= 768 ? 7 : 10;
    const logs = [];
    for (let i = daysToFetch - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const log = this.data.timeLogs.find(l => l.date === ds);
      logs.push({ x: ds.slice(5), y: log ? log.hours : 0 });
    }
    this.drawChart('studyChart', logs, this.getThemeColor());
    const cdList = document.getElementById('dashboard-countdowns-list');
    if (cdList) {
      if (!this.data.countdowns || this.data.countdowns.length === 0) {
        cdList.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">No countdowns set. <a href="countdown.html" style="color:var(--primary);">Add one</a></p>';
      } else {
        cdList.innerHTML = this.data.countdowns.slice(0, 3).map(c => {
          const diff = Math.ceil((new Date(c.date) - new Date()) / 86400000);
          return `<div class="dash-cd-item"><span class="dash-cd-name">${c.name}</span><span class="dash-cd-days">${diff > 0 ? `${diff} days left` : 'Completed'}</span></div>`;
        }).join('') + (this.data.countdowns.length > 3 ? `<div style="text-align:center;margin-top:8px;"><a href="countdown.html" style="font-size:12px;color:var(--primary-light);">View all (${this.data.countdowns.length})</a></div>` : '');
      }
    }
  },
  initTasks() {
    this.renderTasks();
    document.getElementById('task-form')?.addEventListener('submit', e => {
      e.preventDefault();
      if (this.data.tasks.length >= 10) return this.showToast('Max 10 tasks allowed');
      const t = { id: Date.now().toString(), text: document.getElementById('task-input').value, time: document.getElementById('task-time-input').value, date: new Date().toDateString(), done: false };
      this.data.tasks.push(t); this.save(); this.renderTasks();
      document.getElementById('task-input').value = '';
    });
  },
  renderTasks() {
    const tasks = this.data.tasks.filter(t => t.date === new Date().toDateString());
    const done = tasks.filter(t => t.done).length;
    document.getElementById('task-count').textContent = tasks.length;
    document.getElementById('pending-count').textContent = tasks.length - done;
    document.getElementById('done-count').textContent = done;
    document.getElementById('completion-rate').textContent = tasks.length ? Math.round((done / tasks.length) * 100) + '%' : '0%';
    document.getElementById('progress-bar').style.width = tasks.length ? (done / tasks.length * 100) + '%' : '0%';
    document.getElementById('tasks-list').innerHTML = tasks.map(t =>
      `<div class="task-item ${t.done ? 'done' : ''}"><div class="task-check ${t.done ? 'checked' : ''}" onclick="APP.toggleTask('${t.id}')"><i class="fa fa-check"></i></div><span class="task-text">${t.text}</span><span class="task-time"><i class="fa fa-clock"></i> ${t.time}</span><button class="task-delete" onclick="APP.deleteTask('${t.id}')"><i class="fa fa-trash"></i></button></div>`
    ).join('') || '<p style="color:var(--text-muted);text-align:center;">No tasks</p>';
  },
  toggleTask(id) {
    const t = this.data.tasks.find(x => x.id === id);
    if (t) { t.done = !t.done; this.save(); this.renderTasks(); if (t.done) this.showToast('Task completed!'); }
  },
  deleteTask(id) { this.data.tasks = this.data.tasks.filter(x => x.id !== id); this.save(); this.renderTasks(); },
  initTime() {
    const dateInput = document.getElementById('date-input');
    const hoursInput = document.getElementById('hours-input');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    document.getElementById('time-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const h = parseFloat(hoursInput.value);
      const d = dateInput.value;
      if (!h || h < 0.5 || !d) return;
      const idx = this.data.timeLogs.findIndex(l => l.date === d);
      if (idx >= 0) this.data.timeLogs[idx].hours = h;
      else this.data.timeLogs.push({ date: d, hours: h });
      this.save(); hoursInput.value = ''; dateInput.value = new Date().toISOString().split('T')[0];
      this.showToast('Logged successfully!'); this.renderTime();
    });
    this.renderTime();
  },
  renderTime() {
    const logs = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const log = this.data.timeLogs.find(l => l.date === ds);
      logs.push({ x: ds.slice(5), y: log ? log.hours : 0 });
    }
    this.drawChart('timeChart', logs, this.getThemeColor());
    const cal = document.getElementById('study-calendar');
    const dateInput = document.getElementById('date-input');
    if (!cal) return;
    const now = new Date();
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    let html = ['S','M','T','W','T','F','S'].map(d => `<div class="cal-header">${d}</div>`).join('');
    const first = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
    for (let i = 0; i < first; i++) html += '<div class="cal-day empty"></div>';
    for (let d = 1; d <= days; d++) {
      const ds = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const log = this.data.timeLogs.find(l => l.date === ds);
      const cls = d === now.getDate() ? 'today' : log ? 'has-data' : '';
      const hoursHtml = log ? `<span class="cal-hours" style="color:${this.getThemeColor()}">${log.hours}h</span>` : '';
      html += `<div class="cal-day ${cls}" data-date="${ds}"><span class="cal-date-num">${d}</span>${hoursHtml}</div>`;
    }
    cal.innerHTML = html;
    cal.querySelectorAll('.cal-day[data-date]').forEach(el => {
      el.addEventListener('click', () => { if (dateInput) { dateInput.value = el.dataset.date; dateInput.focus(); } });
    });
  },
  initAchievements() {
    const total = this.getTotalStudy();
    const g = this.data.weeklyGoal || 35;
    document.getElementById('goal-display').textContent = `${total.toFixed(1)} / ${g}h`;
    const badges = [];
    if (total >= g * 0.6) badges.push('bronze');
    if (total >= g) badges.push('silver');
    if (total >= g * 1.3) badges.push('golden');
    this.data.achievements.badges = badges; this.save();
    ['bronze','silver','golden'].forEach(b => {
      const el = document.querySelector(`.badge.${b}`);
      if (el) badges.includes(b) ? el.classList.add('earned') : el.classList.remove('earned');
    });
    if (badges.includes('golden')) this.showConfetti();
    document.getElementById('goal-input')?.addEventListener('change', e => { this.data.weeklyGoal = parseInt(e.target.value) || 35; this.save(); this.initAchievements(); });
  },
  showConfetti() {
    const c = document.getElementById('confetti-canvas'); if (!c) return;
    const ctx = c.getContext('2d'); c.width = window.innerWidth; c.height = window.innerHeight;
    const pcs = Array.from({ length: 80 }, () => ({ x: Math.random()*c.width, y: -20, s: Math.random()*6+4, c: ['#6c2bd9','#f59e0b','#10b981','#3b82f6','#ef4444'][Math.floor(Math.random()*5)], v: Math.random()*3+1, w: Math.random()*10 }));
    const draw = () => { ctx.clearRect(0,0,c.width,c.height); let done = true; pcs.forEach(p => { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x + Math.sin(p.w)*10, p.y, p.s, 0, Math.PI*2); ctx.fill(); p.y += p.v; p.w += 0.1; if (p.y < c.height) done = false; }); if (!done) requestAnimationFrame(draw); else ctx.clearRect(0,0,c.width,c.height); };
    draw();
  },
  initAssistant() {
    this.showAssistant("Hello! I'm LearnBot. What's your name?", []);
    const optContainer = document.getElementById('chat-options');
    if(optContainer) {
      optContainer.innerHTML = `<div style="display:flex;gap:8px;margin-top:8px;"><input type="text" id="assistant-name-input" class="form-control" placeholder="Enter your name..." style="margin:0;"><button id="assistant-name-send" class="btn btn-primary" style="padding:10px 16px;">Send</button></div>`;
      const sendHandler = () => { const name = document.getElementById('assistant-name-input').value.trim() || 'Anonymous'; this.saveName(name); };
      document.getElementById('assistant-name-send').onclick = sendHandler;
      document.getElementById('assistant-name-input').addEventListener('keypress', e => { if(e.key === 'Enter') sendHandler(); });
    }
  },
  saveName(n) {
    this.assistantUser = n;
    this.showAssistant(`Hi ${n}! Ready to crush your goals?`, [{ t: 'Study Timetable', a: () => this.timetable() }, { t: 'Subject Tips', a: () => this.subjectTips() }]);
  },
  askMain() { this.showAssistant("I can help you. Pick a topic:", [{ t: 'Timetable', a: () => this.timetable() }, { t: 'Tips', a: () => this.subjectTips() }]); },
  timetable() { this.showAssistant("Try: 6-8AM Review | 10-12 Practice | 3-5 Learn New | 8-9 Review.", [{ t: 'Sounds good', a: () => this.askMain() }, { t: 'Too early', a: () => this.showAssistant("Shift it to your peak hours. Consistency > Timing.", [{ t: 'Got it', a: () => this.askMain() }]) }]); },
  subjectTips() { this.showAssistant("Pick a subject:", [{ t: 'Math', a: () => this.showAssistant("Daily practice. Focus on weak areas first.", [{ t: 'Back', a: () => this.subjectTips() }]) }, { t: 'Science', a: () => this.showAssistant("Understand concepts, then apply.", [{ t: 'Back', a: () => this.subjectTips() }]) }]); },
  showAssistant(txt, opts) {
    const c = document.getElementById('chat-messages'); if (!c) return;
    const m = document.createElement('div'); m.className = 'message bot'; m.innerHTML = txt.replace(/\n/g, '<br>'); c.appendChild(m);
    const o = document.getElementById('chat-options'); o.innerHTML = '';
    opts.forEach(x => { const b = document.createElement('button'); b.className = 'chat-option-btn'; b.textContent = x.t; b.onclick = () => { const um = document.createElement('div'); um.className = 'message user'; um.textContent = x.t; c.appendChild(um); x.a(); }; o.appendChild(b); });
    c.scrollTop = c.scrollHeight;
  },
  initPomodoro() { this.pomo.init(); },
  initMark() {
    document.getElementById('mark-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const sub = document.getElementById('mark-subject').value;
      const m = parseFloat(document.getElementById('mark-value').value);
      if (!sub || isNaN(m)) return;
      this.data.marks.push({ s: sub, m, d: document.getElementById('mark-date').value, p: document.getElementById('mark-period').value });
      this.save(); this.renderMarks();
    });
    document.getElementById('mark-clear')?.addEventListener('click', () => { this.data.marks = []; this.save(); this.renderMarks(); this.showToast('Data cleared'); });
    this.renderMarks();
  },
  renderMarks() {
    const marks = this.data.marks.slice(-10).map(x => ({ x: x.s, y: x.m }));
    this.drawChart('markChart', marks, '#3b82f6');
    if (marks.length) {
      const vals = this.data.marks.map(x => x.m);
      document.getElementById('mark-highest').textContent = Math.max(...vals);
      document.getElementById('mark-lowest').textContent = Math.min(...vals);
      document.getElementById('mark-avg').textContent = (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1);
    }
    document.getElementById('mark-tbody').innerHTML = this.data.marks.slice(-5).reverse().map(m => `<tr><td>${m.s}</td><td>${m.m}</td><td>${m.d}</td></tr>`).join('');
  },
  initMusic() {
    this.audio = new Audio();
    this.playlist = [{ n: 'Relax 1', s: 'song1.mp3' },{ n: 'Relax 2', s: 'song2.mp3' },{ n: 'Relax 3', s: 'song3.mp3' },{ n: 'Relax 4', s: 'song4.mp3' },{ n: 'Relax 5', s: 'song5.mp3' }];
    this.track = 0; this.renderPlaylist();
    this.audio.onplay = () => { this.playing = true; document.getElementById('play-pause-btn').innerHTML = '<i class="fa fa-pause"></i>'; };
    this.audio.onpause = () => { this.playing = false; document.getElementById('play-pause-btn').innerHTML = '<i class="fa fa-play"></i>'; };
    document.getElementById('play-pause-btn')?.addEventListener('click', () => { this.audio.src ? this.audio[this.playing ? 'pause' : 'play']() : this.playTrack(0); });
    this.audio.ontimeupdate = () => {
      const p = (this.audio.currentTime / this.audio.duration) * 100;
      document.getElementById('music-progress').style.width = p + '%';
      document.getElementById('music-current').textContent = this.fmt(this.audio.currentTime);
      document.getElementById('music-total').textContent = this.fmt(this.audio.duration || 0);
    };
    document.getElementById('music-upload')?.addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      this.playlist.push({ n: f.name, s: URL.createObjectURL(f), up: 1 });
      this.renderPlaylist(); this.showToast('Added');
    });
  },
  renderPlaylist() {
    document.getElementById('music-playlist').innerHTML = this.playlist.map((t,i) =>
      `<div class="playlist-item ${i===this.track?'active':''}" onclick="APP.playTrack(${i})"><div class="playlist-num">${i+1}</div><div class="playlist-info"><div class="playlist-name">${t.n}</div><div class="playlist-duration"><i class="fa fa-music"></i> Ready</div></div><i class="fa fa-play" style="color:var(--primary)"></i></div>`
    ).join('');
  },
  playTrack(i) { this.track = i; this.audio.src = this.playlist[i].s; this.audio.play(); document.getElementById('music-title').textContent = this.playlist[i].n; this.renderPlaylist(); },
  fmt(s) { const m = Math.floor(s/60); const sc = Math.floor(s%60); return `${m}:${sc.toString().padStart(2,'0')}`; },
  initCountdown() {
    this.renderCountdowns();
    document.getElementById('countdown-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('countdown-name').value.trim();
      const date = document.getElementById('countdown-date').value;
      if (!name || !date) return this.showToast('Please fill all fields');
      if (this.data.countdowns.length >= 5) return this.showToast('Maximum 5 countdowns allowed');
      this.data.countdowns.push({ id: Date.now().toString(), name, date });
      this.save(); this.renderCountdowns();
      document.getElementById('countdown-name').value = '';
      this.showToast('Countdown added!');
    });
  },
  renderCountdowns() {
    const list = document.getElementById('countdown-list');
    const limit = document.getElementById('countdown-limit');
    const empty = document.getElementById('no-countdowns');
    if (limit) limit.textContent = `${this.data.countdowns.length} / 5`;
    if (!list) return;
    list.innerHTML = '';
    if (this.data.countdowns.length === 0) { if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    this.data.countdowns.forEach(c => {
      const diff = Math.ceil((new Date(c.date) - new Date()) / 86400000);
      const isPast = diff <= 0;
      const weeks = Math.max(0, Math.floor(diff / 7));
      const hours = Math.max(0, diff * 24);
      const mins = Math.max(0, diff * 24 * 60);
      const item = document.createElement('div');
      item.className = `countdown-item ${isPast ? 'expired' : ''}`;
      item.innerHTML = `
        <div class="countdown-header">
          <h3 class="countdown-title">${c.name}</h3>
          <div class="countdown-actions">
            <button class="btn btn-sm btn-secondary share-btn" data-id="${c.id}"><i class="fa fa-share-alt"></i> Share</button>
            <button class="btn btn-sm btn-danger delete-btn" data-id="${c.id}"><i class="fa fa-trash"></i></button>
          </div>
        </div>
        <div class="countdown-grid">
          <div class="countdown-box"><div class="countdown-value">${isPast ? 0 : diff}</div><div class="countdown-label">Days</div></div>
          <div class="countdown-box"><div class="countdown-value">${weeks}</div><div class="countdown-label">Weeks</div></div>
          <div class="countdown-box"><div class="countdown-value">${hours}</div><div class="countdown-label">Hours</div></div>
          <div class="countdown-box"><div class="countdown-value">${mins}</div><div class="countdown-label">Minutes</div></div>
        </div>
        <div class="countdown-date">Target: ${new Date(c.date).toLocaleDateString()}</div>
      `;
      list.appendChild(item);
    });
    document.querySelectorAll('.share-btn').forEach(btn => { btn.onclick = () => this.shareCountdown(btn.dataset.id); });
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.onclick = () => {
        if(confirm('Delete this countdown?')) {
          this.data.countdowns = this.data.countdowns.filter(c => c.id !== btn.dataset.id);
          this.save(); this.renderCountdowns();
          this.showToast('Countdown removed');
        }
      };
    });
  },
  shareCountdown(id) {
    const c = this.data.countdowns.find(x => x.id === id);
    if (!c) return;
    const diff = Math.ceil((new Date(c.date) - new Date()) / 86400000);
    const text = `📚 ${c.name} Countdown\n📅 Target: ${c.date}\n⏳ ${diff} days remaining\nTrack it with Learny!`;
    if (navigator.share) navigator.share({ title: 'Learny Countdown', text }).catch(() => this.copyToClipboard(text));
    else this.copyToClipboard(text);
  },
  copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => this.showToast('Copied to clipboard!')).catch(() => this.showToast('Failed to copy'));
  },
  initSettings() {
    document.querySelectorAll('.theme-option').forEach(o => o.onclick = () => {
      document.body.className = this.data.darkMode === false ? 'light' : '';
      const t = o.dataset.theme;
      if (t !== 'purple') document.body.classList.add(`theme-${t}`);
      this.data.currentTheme = t; this.save();
      document.querySelectorAll('.theme-option').forEach(x => x.classList.remove('active'));
      o.classList.add('active'); this.updateThemeIcon();
    });
    document.getElementById('delete-all')?.addEventListener('click', () => { if (confirm('Delete all data?')) { localStorage.removeItem('learny_data'); location.reload(); } });
  },
  initRate() {
    let r = 0;
    document.querySelectorAll('.star-btn').forEach((s,i) => s.onclick = () => { r = i+1; document.querySelectorAll('.star-btn').forEach((st,j) => st.classList.toggle('active', j < r)); });
    document.getElementById('feedback-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const all = JSON.parse(localStorage.getItem('learny_feedbacks') || '[]');
      all.push({ r, t: document.getElementById('feedback-text').value, d: new Date().toISOString() });
      localStorage.setItem('learny_feedbacks', JSON.stringify(all));
      this.showToast('Thank you!');
    });
    document.querySelectorAll('.faq-item .faq-question').forEach(q => q.onclick = () => q.parentElement.classList.toggle('open'));
  }
};

if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
document.addEventListener('DOMContentLoaded', () => APP.init());