/* =========================================================
   LEARNY - OTHER.JS (FIXED VERSION)
   Translator | Calculator | Converter
   ========================================================= */

// ============ TRANSLATOR MODULE ============
APP.translator = {
  history: [],
  lastTranslation: null,
  init() {
    console.log('[Translator] Initializing...');
    this.loadHistory();
    this.bindEvents();
    this.renderHistory();
    this.updateLangLabels();
  },
  bindEvents() {
    const input = document.getElementById('trans-input');
    const langSel = document.getElementById('trans-lang');
    if (input) {
      input.addEventListener('input', () => {
        const c = document.getElementById('char-count');
        if (c) c.textContent = input.value.length;
      });
    }
    if (langSel) langSel.addEventListener('change', () => this.updateLangLabels());

    const btn = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    btn('trans-translate', () => this.translate());
    btn('trans-clear', () => {
      const inp = document.getElementById('trans-input');
      const res = document.getElementById('trans-result');
      const cc = document.getElementById('char-count');
      if (inp) inp.value = '';
      if (res) res.textContent = 'Translation will appear here...';
      if (cc) cc.textContent = '0';
    });
    btn('trans-paste', async () => {
      try {
        const text = await navigator.clipboard.readText();
        const inp = document.getElementById('trans-input');
        if (inp) {
          inp.value = text;
          const cc = document.getElementById('char-count');
          if (cc) cc.textContent = text.length;
        }
      } catch { APP.showToast('Paste permission denied'); }
    });
    btn('trans-copy', () => {
      const res = document.getElementById('trans-result');
      if (!res) return;
      const text = res.textContent;
      if (!text || text === 'Translation will appear here...') return;
      navigator.clipboard.writeText(text).then(() => APP.showToast('Copied!'));
    });
    btn('trans-swap', () => {
      const sel = document.getElementById('trans-lang');
      if (!sel) return;
      sel.value = sel.value === 'en|si' ? 'si|en' : 'en|si';
      this.updateLangLabels();
      const inp = document.getElementById('trans-input');
      const res = document.getElementById('trans-result');
      if (res && res.textContent && res.textContent !== 'Translation will appear here...') {
        if (inp) {
          inp.value = res.textContent;
          const cc = document.getElementById('char-count');
          if (cc) cc.textContent = inp.value.length;
        }
      }
    });
    btn('trans-save', () => this.saveToHistory());
    btn('trans-speak', () => {
      const inp = document.getElementById('trans-input');
      if (inp) this.speak(inp.value, 'en');
    });
    btn('trans-speak-result', () => {
      const res = document.getElementById('trans-result');
      const sel = document.getElementById('trans-lang');
      if (!res || !sel) return;
      const lang = sel.value.split('|')[1];
      this.speak(res.textContent, lang === 'si' ? 'si' : 'en');
    });
    btn('clear-history', () => {
      if (confirm('Clear all translation history?')) {
        this.history = [];
        this.saveHistory();
        this.renderHistory();
        APP.showToast('History cleared');
      }
    });

    // Image upload
    const imgZone = document.getElementById('img-upload-zone');
    const imgInput = document.getElementById('img-upload');
    if (imgZone && imgInput) {
      imgZone.addEventListener('click', () => imgInput.click());
      imgInput.addEventListener('change', (e) => {
        if (e.target.files[0]) this.handleImage(e.target.files[0]);
      });
    }
    // PDF upload
    const pdfZone = document.getElementById('pdf-upload-zone');
    const pdfInput = document.getElementById('pdf-upload');
    if (pdfZone && pdfInput) {
      pdfZone.addEventListener('click', () => pdfInput.click());
      pdfInput.addEventListener('change', (e) => {
        if (e.target.files[0]) this.handlePDF(e.target.files[0]);
      });
    }
  },
  updateLangLabels() {
    const sel = document.getElementById('trans-lang');
    if (!sel) return;
    const [from, to] = sel.value.split('|');
    const src = document.getElementById('source-lang-label');
    const tgt = document.getElementById('target-lang-label');
    if (src) src.textContent = from === 'en' ? 'English' : 'Sinhala';
    if (tgt) tgt.textContent = to === 'si' ? 'Sinhala' : 'English';
  },
  async translate() {
    const inp = document.getElementById('trans-input');
    const res = document.getElementById('trans-result');
    const sel = document.getElementById('trans-lang');
    if (!inp || !res || !sel) return;

    const text = inp.value.trim();
    if (!text) return APP.showToast('Please enter text to translate');

    res.textContent = 'Translating...';
    const lang = sel.value;

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${lang}`;
      const response = await fetch(url);
      const data = await response.json();
      const translated = data.responseData?.translatedText || 'Translation failed';
      res.textContent = translated;
      this.lastTranslation = {
        from: text,
        to: translated,
        lang: lang,
        time: new Date().toISOString()
      };
    } catch (err) {
      console.error('Translation error:', err);
      res.textContent = 'Error: Could not translate. Check internet connection.';
    }
  },
  speak(text, lang) {
    if (!text || !('speechSynthesis' in window)) return;
    if (text === 'Translation will appear here...') return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'si' ? 'si-LK' : 'en-US';
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  },
  saveToHistory() {
    if (!this.lastTranslation) return APP.showToast('Nothing to save yet');
    this.history.unshift(this.lastTranslation);
    if (this.history.length > 50) this.history.pop();
    this.saveHistory();
    this.renderHistory();
    APP.showToast('Saved to history ✓');
  },
  loadHistory() {
    try {
      this.history = JSON.parse(localStorage.getItem('learny_trans_history') || '[]');
    } catch {
      this.history = [];
    }
  },
  saveHistory() {
    localStorage.setItem('learny_trans_history', JSON.stringify(this.history));
  },
  renderHistory() {
    const el = document.getElementById('trans-history');
    if (!el) return;
    if (this.history.length === 0) {
      el.innerHTML = '<p class="empty-text">No history yet. Start translating!</p>';
      return;
    }
    el.innerHTML = this.history.map((h, i) => {
      const [from, to] = h.lang.split('|');
      const time = new Date(h.time).toLocaleString();
      return `
        <div class="history-item">
          <div class="history-header">
            <span class="history-lang">${from.toUpperCase()} → ${to.toUpperCase()}</span>
            <span class="history-time">${time}</span>
          </div>
          <div class="history-source">${this.escapeHtml(h.from)}</div>
          <div class="history-result">${this.escapeHtml(h.to)}</div>
          <div class="history-actions">
            <button class="btn btn-sm btn-secondary" onclick="APP.translator.loadFromHistory(${i})"><i class="fa fa-redo"></i> Reuse</button>
            <button class="btn btn-sm btn-danger" onclick="APP.translator.deleteHistory(${i})"><i class="fa fa-trash"></i></button>
          </div>
        </div>`;
    }).join('');
  },
  loadFromHistory(i) {
    const h = this.history[i];
    if (!h) return;
    const sel = document.getElementById('trans-lang');
    const inp = document.getElementById('trans-input');
    const res = document.getElementById('trans-result');
    const cc = document.getElementById('char-count');
    if (sel) sel.value = h.lang;
    if (inp) inp.value = h.from;
    if (res) res.textContent = h.to;
    if (cc) cc.textContent = h.from.length;
    this.updateLangLabels();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  deleteHistory(i) {
    this.history.splice(i, 1);
    this.saveHistory();
    this.renderHistory();
  },
  escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },
  async handleImage(file) {
    if (!file) return;
    if (!window.Tesseract) {
      APP.showToast('OCR library still loading... please wait a moment');
      return;
    }
    this.showProgress('Extracting text from image...');
    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      const inp = document.getElementById('trans-input');
      const cc = document.getElementById('char-count');
      if (inp) inp.value = text;
      if (cc) cc.textContent = text.length;
      APP.showToast('Text extracted! ✓');
    } catch (e) {
      console.error(e);
      APP.showToast('OCR failed: ' + e.message);
    }
    this.hideProgress();
  },
  async handlePDF(file) {
    if (!file) return;
    if (!window.pdfjsLib) {
      APP.showToast('PDF library still loading... please wait');
      return;
    }
    this.showProgress('Extracting text from PDF...');
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(it => it.str).join(' ') + '\n';
        this.updateProgress((i / pdf.numPages) * 100);
      }
      const inp = document.getElementById('trans-input');
      const cc = document.getElementById('char-count');
      if (inp) inp.value = fullText.trim();
      if (cc) cc.textContent = fullText.length;
      APP.showToast('PDF text extracted! ✓');
    } catch (e) {
      console.error(e);
      APP.showToast('PDF extraction failed');
    }
    this.hideProgress();
  },
  showProgress(msg) {
    const p = document.getElementById('file-progress');
    if (p) {
      p.style.display = 'block';
      const t = document.getElementById('file-progress-text');
      if (t) t.textContent = msg;
    }
  },
  updateProgress(pct) {
    const bar = document.getElementById('file-progress-bar');
    if (bar) bar.style.width = pct + '%';
  },
  hideProgress() {
    const p = document.getElementById('file-progress');
    if (p) p.style.display = 'none';
  }
};

// ============ CALCULATOR MODULE ============
APP.calculator = {
  expr: '',
  result: '0',
  memory: 0,
  history: [],
  scientific: true,
  init() {
    console.log('[Calculator] Initializing...');
    this.loadHistory();
    this.bindEvents();
    this.renderHistory();
    this.updateMemIndicator();
    this.updateDisplay();
  },
  bindEvents() {
    document.querySelectorAll('.calc-btn[data-val]').forEach(btn => {
      btn.addEventListener('click', () => this.inputValue(btn.dataset.val));
    });
    document.querySelectorAll('.calc-btn[data-act]').forEach(btn => {
      btn.addEventListener('click', () => this.doAction(btn.dataset.act));
    });
    document.querySelectorAll('.calc-btn[data-mem]').forEach(btn => {
      btn.addEventListener('click', () => this.memoryOp(btn.dataset.mem));
    });
    const toggle = document.getElementById('calc-mode-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        this.scientific = !this.scientific;
        const grid = document.getElementById('calc-sci-grid');
        if (grid) grid.style.display = this.scientific ? 'grid' : 'none';
        toggle.innerHTML = this.scientific
          ? '<i class="fa fa-th"></i> Basic'
          : '<i class="fa fa-flask"></i> Scientific';
      });
    }
    const clearHist = document.getElementById('calc-clear-history');
    if (clearHist) {
      clearHist.addEventListener('click', () => {
        if (confirm('Clear calculator history?')) {
          this.history = [];
          this.saveHistory();
          this.renderHistory();
        }
      });
    }
    // Keyboard support - only on calculator page
    this._keyHandler = (e) => this.handleKey(e);
    document.addEventListener('keydown', this._keyHandler);
  },
  inputValue(v) {
    this.expr += v;
    this.updateDisplay();
  },
  doAction(act) {
    if (act === 'clear') {
      this.expr = '';
      this.result = '0';
    } else if (act === 'back') {
      this.expr = this.expr.slice(0, -1);
    } else if (act === 'equals') {
      this.calculate();
    }
    this.updateDisplay();
  },
  memoryOp(op) {
    const cur = parseFloat(this.result) || 0;
    if (op === 'MC') this.memory = 0;
    else if (op === 'MR') this.expr += this.memory.toString();
    else if (op === 'M+') this.memory += cur;
    else if (op === 'M-') this.memory -= cur;
    else if (op === 'MS') this.memory = cur;
    this.updateMemIndicator();
    this.updateDisplay();
  },
  updateMemIndicator() {
    const el = document.getElementById('calc-mem-ind');
    if (el) el.textContent = this.memory !== 0 ? 'M' : '';
  },
  factorial(n) {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  },
  calculate() {
    if (!this.expr) return;
    try {
      let e = this.expr;
      // Replace constants
      e = e.replace(/\bpi\b/g, Math.PI.toString());
      e = e.replace(/\be\b/g, Math.E.toString());
      // Factorial
      e = e.replace(/(\d+(?:\.\d+)?)!/g, (m, n) => this.factorial(parseFloat(n)).toString());
      // Powers
      e = e.replace(/\^/g, '**');
      // Scientific functions (degrees)
      const toRad = '((Math.PI/180)*';
      e = e.replace(/sin\(/g, `Math.sin(${toRad}(`);
      e = e.replace(/cos\(/g, `Math.cos(${toRad}(`);
      e = e.replace(/tan\(/g, `Math.tan(${toRad}(`);
      e = e.replace(/asin\(/g, '((180/Math.PI)*Math.asin(');
      e = e.replace(/acos\(/g, '((180/Math.PI)*Math.acos(');
      e = e.replace(/atan\(/g, '((180/Math.PI)*Math.atan(');
      e = e.replace(/sqrt\(/g, 'Math.sqrt(');
      e = e.replace(/log\(/g, 'Math.log10(');
      e = e.replace(/ln\(/g, 'Math.log(');
      e = e.replace(/abs\(/g, 'Math.abs(');

      // Balance parentheses
      const open = (e.match(/\(/g) || []).length;
      const close = (e.match(/\)/g) || []).length;
      for (let i = 0; i < open - close; i++) e += ')';

      const val = Function('"use strict";return (' + e + ')')();
      if (!isFinite(val)) throw new Error('Math error');
      const rounded = Math.round(val * 1e10) / 1e10;
      this.result = rounded.toString();
      this.history.unshift({ expr: this.expr, result: this.result, time: Date.now() });
      if (this.history.length > 30) this.history.pop();
      this.saveHistory();
      this.renderHistory();
      this.expr = this.result;
    } catch (err) {
      console.error('Calc error:', err);
      this.result = 'Error';
      this.updateDisplay();
      setTimeout(() => {
        this.result = '0';
        this.updateDisplay();
      }, 1500);
    }
  },
  updateDisplay() {
    const exprEl = document.getElementById('calc-expr');
    const resEl = document.getElementById('calc-result');
    if (exprEl) exprEl.textContent = this.expr || '\u00A0';
    if (resEl) resEl.textContent = this.result;
  },
  handleKey(e) {
    // Only handle keys if calculator page is visible
    if (!document.querySelector('.calc-display')) return;
    const k = e.key;
    if (/[0-9.+\-*/()%]/.test(k)) { this.inputValue(k); e.preventDefault(); }
    else if (k === 'Enter' || k === '=') { this.doAction('equals'); e.preventDefault(); }
    else if (k === 'Backspace') { this.doAction('back'); e.preventDefault(); }
    else if (k === 'Escape') { this.doAction('clear'); e.preventDefault(); }
  },
  loadHistory() {
    try {
      this.history = JSON.parse(localStorage.getItem('learny_calc_history') || '[]');
    } catch {
      this.history = [];
    }
  },
  saveHistory() {
    localStorage.setItem('learny_calc_history', JSON.stringify(this.history));
  },
  renderHistory() {
    const el = document.getElementById('calc-history');
    if (!el) return;
    if (this.history.length === 0) {
      el.innerHTML = '<p class="empty-text">No calculations yet</p>';
      return;
    }
    el.innerHTML = this.history.map((h, i) => `
      <div class="calc-history-item" onclick="APP.calculator.loadFromHistory(${i})">
        <div class="calc-history-expr">${APP.translator.escapeHtml(h.expr)} =</div>
        <div class="calc-history-result">${APP.translator.escapeHtml(h.result)}</div>
      </div>`).join('');
  },
  loadFromHistory(i) {
    const h = this.history[i];
    if (!h) return;
    this.expr = h.result;
    this.result = h.result;
    this.updateDisplay();
  }
};

// ============ CONVERTER MODULE ============
APP.converter = {
  categories: {
    length: {
      icon: 'ruler', name: 'Length',
      units: {
        'mm': { name: 'Millimeter (mm)', factor: 0.001 },
        'cm': { name: 'Centimeter (cm)', factor: 0.01 },
        'dm': { name: 'Decimeter (dm)', factor: 0.1 },
        'm':  { name: 'Meter (m)', factor: 1 },
        'km': { name: 'Kilometer (km)', factor: 1000 },
        'nm': { name: 'Nanometer (nm)', factor: 1e-9 },
        'μm': { name: 'Micrometer (μm)', factor: 1e-6 },
        'in': { name: 'Inch (in)', factor: 0.0254 },
        'ft': { name: 'Foot (ft)', factor: 0.3048 },
        'yd': { name: 'Yard (yd)', factor: 0.9144 },
        'mi': { name: 'Mile (mi)', factor: 1609.344 }
      }
    },
    mass: {
      icon: 'weight', name: 'Mass',
      units: {
        'mg':  { name: 'Milligram (mg)', factor: 0.001 },
        'g':   { name: 'Gram (g)', factor: 1 },
        'kg':  { name: 'Kilogram (kg)', factor: 1000 },
        't':   { name: 'Tonne (t)', factor: 1e6 },
        'lb':  { name: 'Pound (lb)', factor: 453.592 },
        'oz':  { name: 'Ounce (oz)', factor: 28.3495 }
      }
    },
    volume: {
      icon: 'flask', name: 'Volume',
      units: {
        'mL':   { name: 'Milliliter (mL)', factor: 0.001 },
        'cm3':  { name: 'Cubic cm (cm³)', factor: 0.001 },
        'dm3':  { name: 'Cubic dm (dm³)', factor: 1 },
        'L':    { name: 'Liter (L)', factor: 1 },
        'm3':   { name: 'Cubic m (m³)', factor: 1000 },
        'gal':  { name: 'Gallon (US)', factor: 3.78541 },
        'ft3':  { name: 'Cubic foot (ft³)', factor: 28.3168 }
      }
    },
    area: {
      icon: 'vector-square', name: 'Area',
      units: {
        'mm2': { name: 'mm²', factor: 1e-6 },
        'cm2': { name: 'cm²', factor: 1e-4 },
        'm2':  { name: 'm²', factor: 1 },
        'km2': { name: 'km²', factor: 1e6 },
        'ha':  { name: 'Hectare', factor: 10000 },
        'acre':{ name: 'Acre', factor: 4046.86 }
      }
    },
    temperature: {
      icon: 'thermometer-half', name: 'Temperature',
      units: { 'C': { name: 'Celsius (°C)' }, 'F': { name: 'Fahrenheit (°F)' }, 'K': { name: 'Kelvin (K)' } },
      special: true
    },
    time: {
      icon: 'clock', name: 'Time',
      units: {
        'ms':   { name: 'Millisecond', factor: 0.001 },
        's':    { name: 'Second', factor: 1 },
        'min':  { name: 'Minute', factor: 60 },
        'hr':   { name: 'Hour', factor: 3600 },
        'day':  { name: 'Day', factor: 86400 },
        'week': { name: 'Week', factor: 604800 },
        'year': { name: 'Year', factor: 31536000 }
      }
    },
    speed: {
      icon: 'tachometer-alt', name: 'Speed',
      units: {
        'm/s':  { name: 'Meter/sec', factor: 1 },
        'km/h': { name: 'Km/hour', factor: 0.277778 },
        'mph':  { name: 'Mile/hour', factor: 0.44704 },
        'knot': { name: 'Knot', factor: 0.514444 }
      }
    },
    concentration: {
      icon: 'vial', name: 'Concentration',
      units: {
        'ppm':      { name: 'ppm', factor: 1 },
        'mg/dm3':   { name: 'mg/dm³', factor: 1 },
        'g/L':      { name: 'g/L', factor: 1000 },
        'g/dm3':    { name: 'g/dm³', factor: 1000 },
        'percent':  { name: 'Percent (%)', factor: 10000 }
      }
    },
    data: {
      icon: 'database', name: 'Data',
      units: {
        'B':   { name: 'Byte', factor: 1 },
        'KB':  { name: 'Kilobyte', factor: 1024 },
        'MB':  { name: 'Megabyte', factor: 1048576 },
        'GB':  { name: 'Gigabyte', factor: 1073741824 },
        'TB':  { name: 'Terabyte', factor: 1099511627776 }
      }
    },
    energy: {
      icon: 'bolt', name: 'Energy',
      units: {
        'J':    { name: 'Joule', factor: 1 },
        'kJ':   { name: 'Kilojoule', factor: 1000 },
        'cal':  { name: 'Calorie', factor: 4.184 },
        'kcal': { name: 'Kilocalorie', factor: 4184 },
        'Wh':   { name: 'Watt-hour', factor: 3600 },
        'kWh':  { name: 'Kilowatt-hour', factor: 3600000 }
      }
    }
  },
  currentCat: 'length',
  quiz: { questions: [], current: 0, score: 0, answered: false },

  init() {
    console.log('[Converter] Initializing...');
    this.renderTabs();
    this.renderUnits();
    this.bindEvents();
    this.convert();
    this.renderReference();
  },
  renderTabs() {
    const tabs = document.getElementById('conv-tabs');
    if (!tabs) return;
    tabs.innerHTML = Object.entries(this.categories).map(([k, v]) =>
      `<div class="conv-tab ${k === this.currentCat ? 'active' : ''}" data-cat="${k}">
         <i class="fa fa-${v.icon}"></i> ${v.name}
       </div>`
    ).join('');
    tabs.querySelectorAll('.conv-tab').forEach(t => {
      t.addEventListener('click', () => {
        this.currentCat = t.dataset.cat;
        this.renderTabs();
        this.renderUnits();
        this.convert();
        this.renderReference();
      });
    });
  },
  renderUnits() {
    const cat = this.categories[this.currentCat];
    const fromSel = document.getElementById('conv-from-unit');
    const toSel = document.getElementById('conv-to-unit');
    if (!fromSel || !toSel) return;
    const opts = Object.entries(cat.units).map(([k, v]) =>
      `<option value="${k}">${v.name}</option>`).join('');
    fromSel.innerHTML = opts;
    toSel.innerHTML = opts;
    const keys = Object.keys(cat.units);
    fromSel.value = keys[0];
    toSel.value = keys.length > 1 ? keys[1] : keys[0];
  },
  bindEvents() {
    const fromVal = document.getElementById('conv-from-val');
    const fromUnit = document.getElementById('conv-from-unit');
    const toUnit = document.getElementById('conv-to-unit');
    const swap = document.getElementById('conv-swap');
    const qStart = document.getElementById('quiz-start');
    const qStartMain = document.getElementById('quiz-start-main');
    const qNext = document.getElementById('quiz-next');
    const qSkip = document.getElementById('quiz-skip');
    const qRetry = document.getElementById('quiz-retry');

    if (fromVal) fromVal.addEventListener('input', () => this.convert());
    if (fromUnit) fromUnit.addEventListener('change', () => this.convert());
    if (toUnit) toUnit.addEventListener('change', () => this.convert());
    if (swap) swap.addEventListener('click', () => {
      const f = document.getElementById('conv-from-unit');
      const t = document.getElementById('conv-to-unit');
      const tmp = f.value; f.value = t.value; t.value = tmp;
      this.convert();
    });
    if (qStart) qStart.addEventListener('click', () => this.startQuiz());
    if (qStartMain) qStartMain.addEventListener('click', () => this.startQuiz());
    if (qNext) qNext.addEventListener('click', () => this.nextQuestion());
    if (qSkip) qSkip.addEventListener('click', () => this.nextQuestion());
    if (qRetry) qRetry.addEventListener('click', () => this.startQuiz());
  },
  convert() {
    const cat = this.categories[this.currentCat];
    const fromValEl = document.getElementById('conv-from-val');
    const fromUnitEl = document.getElementById('conv-from-unit');
    const toUnitEl = document.getElementById('conv-to-unit');
    const resultEl = document.getElementById('conv-to-val');
    const formulaEl = document.getElementById('conv-formula-text');
    if (!fromValEl || !fromUnitEl || !toUnitEl || !resultEl) return;

    const val = parseFloat(fromValEl.value);
    const from = fromUnitEl.value;
    const to = toUnitEl.value;

    if (isNaN(val)) { resultEl.value = ''; return; }

    let result, formula;
    if (cat.special && this.currentCat === 'temperature') {
      const r = this.convertTemp(val, from, to);
      result = r.value;
      formula = r.formula;
    } else {
      const fromFactor = cat.units[from].factor;
      const toFactor = cat.units[to].factor;
      result = (val * fromFactor) / toFactor;
      formula = `1 ${from} = ${(fromFactor / toFactor).toPrecision(6)} ${to}`;
    }
    resultEl.value = this.formatNumber(result);
    if (formulaEl) formulaEl.textContent = formula;
  },
  convertTemp(val, from, to) {
    let c;
    if (from === 'C') c = val;
    else if (from === 'F') c = (val - 32) * 5/9;
    else c = val - 273.15;

    let r, f;
    if (to === 'C') {
      r = c;
      if (from === 'F') f = `${val}°F → ${c.toFixed(2)}°C`;
      else if (from === 'K') f = `${val}K → ${c.toFixed(2)}°C`;
      else f = 'Same unit';
    } else if (to === 'F') {
      r = c * 9/5 + 32;
      f = `°C → (°C × 9/5) + 32`;
    } else {
      r = c + 273.15;
      f = `°C → °C + 273.15`;
    }
    return { value: r, formula: f };
  },
  formatNumber(n) {
    if (isNaN(n)) return '0';
    if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(4);
    if (Math.abs(n) > 1e9) return n.toExponential(4);
    return Math.round(n * 1e8) / 1e8;
  },
  renderReference() {
    const el = document.getElementById('conv-reference');
    if (!el) return;
    const cat = this.categories[this.currentCat];
    const keys = Object.keys(cat.units);
    if (keys.length < 2) { el.innerHTML = ''; return; }
    const base = keys[0];
    const refs = keys.slice(1, 7).map(k => {
      const factor = cat.units[base].factor / cat.units[k].factor;
      return `<div class="ref-item"><strong>1 ${base}</strong> = ${this.formatNumber(factor)} ${k}</div>`;
    });
    el.innerHTML = refs.join('');
  },

  // ===== QUIZ =====
  startQuiz() {
    this.quiz = { questions: this.generateQuestions(10), current: 0, score: 0, answered: false };
    const intro = document.getElementById('quiz-intro');
    const result = document.getElementById('quiz-result');
    const game = document.getElementById('quiz-game');
    if (intro) intro.style.display = 'none';
    if (result) result.style.display = 'none';
    if (game) game.style.display = 'block';
    this.showQuestion();
  },
  generateQuestions(n) {
    const questions = [];
    const catKeys = Object.keys(this.categories).filter(k => k !== 'temperature');
    for (let i = 0; i < n; i++) {
      const catKey = catKeys[Math.floor(Math.random() * catKeys.length)];
      const cat = this.categories[catKey];
      const unitKeys = Object.keys(cat.units);
      const fromIdx = Math.floor(Math.random() * unitKeys.length);
      let toIdx = Math.floor(Math.random() * unitKeys.length);
      while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * unitKeys.length);
      const from = unitKeys[fromIdx], to = unitKeys[toIdx];
      const value = this.randomValue();
      const correct = (value * cat.units[from].factor) / cat.units[to].factor;
      const options = this.generateOptions(correct);
      questions.push({
        catName: cat.name,
        from, to, value,
        correct: this.formatNumber(correct),
        options
      });
    }
    return questions;
  },
  randomValue() {
    const vals = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 0.5, 2.5, 7.5];
    return vals[Math.floor(Math.random() * vals.length)];
  },
  generateOptions(correct) {
    const opts = new Set([this.formatNumber(correct)]);
    let attempts = 0;
    while (opts.size < 4 && attempts < 50) {
      const factor = 0.1 + Math.random() * 10;
      const v = this.formatNumber(correct * factor);
      if (v !== this.formatNumber(correct)) opts.add(v);
      attempts++;
    }
    return [...opts].sort(() => Math.random() - 0.5);
  },
  showQuestion() {
    const q = this.quiz.questions[this.quiz.current];
    const qNum = document.getElementById('quiz-q-num');
    const score = document.getElementById('quiz-score');
    const progBar = document.getElementById('quiz-progress-bar');
    const qText = document.getElementById('quiz-question');
    const optsEl = document.getElementById('quiz-options');
    const nextBtn = document.getElementById('quiz-next');

    if (qNum) qNum.textContent = this.quiz.current + 1;
    if (score) score.textContent = this.quiz.score;
    if (progBar) progBar.style.width = ((this.quiz.current) / 10 * 100) + '%';
    if (qText) qText.textContent = `Convert ${q.value} ${q.from} to ${q.to} (${q.catName})`;

    if (optsEl) {
      optsEl.innerHTML = q.options.map((o, i) => {
        const letter = ['A', 'B', 'C', 'D'][i];
        return `<div class="quiz-option" data-val="${o}">
          <div class="quiz-option-letter">${letter}</div>
          <div>${o}</div>
        </div>`;
      }).join('');
      optsEl.querySelectorAll('.quiz-option').forEach(opt => {
        opt.addEventListener('click', () => this.answerQuestion(opt.dataset.val));
      });
    }
    if (nextBtn) nextBtn.style.display = 'none';
    this.quiz.answered = false;
  },
  answerQuestion(val) {
    if (this.quiz.answered) return;
    this.quiz.answered = true;
    const q = this.quiz.questions[this.quiz.current];
    const opts = document.querySelectorAll('#quiz-options .quiz-option');
    opts.forEach(o => {
      if (o.dataset.val === q.correct) o.classList.add('correct');
      else if (o.dataset.val === val) o.classList.add('wrong');
    });
    if (val === q.correct) {
      this.quiz.score++;
      APP.showToast('✅ Correct!');
    } else {
      APP.showToast('❌ Correct: ' + q.correct);
    }
    const score = document.getElementById('quiz-score');
    if (score) score.textContent = this.quiz.score;
    const nextBtn = document.getElementById('quiz-next');
    if (nextBtn) nextBtn.style.display = 'inline-flex';
  },
  nextQuestion() {
    this.quiz.current++;
    if (this.quiz.current >= 10) this.endQuiz();
    else this.showQuestion();
  },
  endQuiz() {
    const game = document.getElementById('quiz-game');
    const result = document.getElementById('quiz-result');
    if (game) game.style.display = 'none';
    if (result) result.style.display = 'block';

    const score = this.quiz.score;
    const correct = document.getElementById('quiz-correct');
    const wrong = document.getElementById('quiz-wrong');
    const percent = document.getElementById('quiz-percent');
    const icon = document.getElementById('quiz-result-icon');
    const title = document.getElementById('quiz-result-title');

    if (correct) correct.textContent = score;
    if (wrong) wrong.textContent = 10 - score;
    if (percent) percent.textContent = (score * 10) + '%';

    let iconText = '🏆', titleText = 'Excellent!';
    if (score < 4) { iconText = '📚'; titleText = 'Keep Practicing!'; }
    else if (score < 7) { iconText = '👍'; titleText = 'Good Job!'; }
    else if (score < 10) { iconText = '🌟'; titleText = 'Great Work!'; }

    if (icon) icon.textContent = iconText;
    if (title) title.textContent = titleText;
  }
};

// ============ PAGE ROUTER - FIXED ============
(function() {
  const origInit = APP.init.bind(APP);
  APP.init = function() {
    origInit();
    const path = window.location.pathname.split('/').pop();
    if (path.includes('translator.html')) APP.translator.init();
    else if (path.includes('calculator.html')) APP.calculator.init();
    else if (path.includes('converter.html')) APP.converter.init();
  };
})();
