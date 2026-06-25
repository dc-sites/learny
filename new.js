/* ============================================================
   LEARNY - NEW.JS (COMPLETE)
   Handles: Translator, Calculator, Converter, Quiz, OCR
   ============================================================ */

const NEW = {

    /* ==========================================================
       TRANSLATOR MODULE
       ========================================================== */
    translator: {
        history: [],
        sourceLang: 'en',
        targetLang: 'si',
        lastTranslation: null,

        init() {
            this.loadHistory();
            this.bindEvents();
            this.renderHistory();
        },

        bindEvents() {
            const src = document.getElementById('source-text');
            const charCount = document.getElementById('char-count');
            if (src) {
                src.addEventListener('input', () => {
                    charCount.textContent = `${src.value.length} / 1000`;
                });
            }

            document.getElementById('translate-btn')?.addEventListener('click', () => this.translate());
            document.getElementById('swap-langs')?.addEventListener('click', () => this.swapLanguages());
            document.getElementById('clear-source')?.addEventListener('click', () => {
                document.getElementById('source-text').value = '';
                if (charCount) charCount.textContent = '0 / 1000';
            });
            document.getElementById('paste-source')?.addEventListener('click', () => this.pasteText());
            document.getElementById('copy-result')?.addEventListener('click', () => this.copyResult());
            document.getElementById('speak-result')?.addEventListener('click', () => this.speakResult());
            document.getElementById('save-translation')?.addEventListener('click', () => this.saveTranslation());
            document.getElementById('clear-history')?.addEventListener('click', () => this.clearHistory());

            document.getElementById('source-text')?.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') this.translate();
            });
        },

        async translate() {
            const text = document.getElementById('source-text').value.trim();
            const resultEl = document.getElementById('result-text');
            if (!text) {
                APP.showToast('Please enter text to translate');
                return;
            }

            resultEl.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Translating...';

            try {
                const langPair = `${this.sourceLang}|${this.targetLang}`;
                const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.responseStatus === 200 && data.responseData) {
                    const translated = data.responseData.translatedText;
                    resultEl.textContent = translated;
                    this.lastTranslation = {
                        source: text,
                        result: translated,
                        from: this.sourceLang,
                        to: this.targetLang,
                        time: new Date().toISOString()
                    };
                } else {
                    resultEl.textContent = 'Translation failed. Try again.';
                }
            } catch (err) {
                resultEl.textContent = 'Network error. Check connection.';
                console.error(err);
            }
        },

        swapLanguages() {
            [this.sourceLang, this.targetLang] = [this.targetLang, this.sourceLang];
            document.getElementById('source-lang-label').textContent = this.sourceLang === 'en' ? 'English' : 'සිංහල';
            document.getElementById('target-lang-label').textContent = this.targetLang === 'en' ? 'English' : 'සිංහල';

            const src = document.getElementById('source-text');
            const result = document.getElementById('result-text');
            const resultText = result.textContent;
            if (resultText && !resultText.includes('Translation will appear') && !resultText.includes('Translating')) {
                src.value = resultText;
                document.getElementById('char-count').textContent = `${resultText.length} / 1000`;
            }
            APP.showToast('Languages swapped');
        },

        async pasteText() {
            try {
                const text = await navigator.clipboard.readText();
                document.getElementById('source-text').value = text;
                document.getElementById('char-count').textContent = `${text.length} / 1000`;
            } catch {
                APP.showToast('Paste permission denied');
            }
        },

        copyResult() {
            const text = document.getElementById('result-text').textContent;
            if (!text || text.includes('Translation will appear')) return;
            navigator.clipboard.writeText(text).then(() => APP.showToast('Copied!'));
        },

        speakResult() {
            const text = document.getElementById('result-text').textContent;
            if (!text || text.includes('Translation will appear')) return;
            if ('speechSynthesis' in window) {
                const utter = new SpeechSynthesisUtterance(text);
                utter.lang = this.targetLang === 'si' ? 'si-LK' : 'en-US';
                utter.rate = 0.9;
                speechSynthesis.speak(utter);
            } else {
                APP.showToast('Speech not supported');
            }
        },

        saveTranslation() {
            if (!this.lastTranslation) {
                APP.showToast('Nothing to save');
                return;
            }
            this.history.unshift(this.lastTranslation);
            if (this.history.length > 50) this.history.pop();
            this.saveHistory();
            this.renderHistory();
            APP.showToast('Saved to history ✓');
        },

        clearHistory() {
            if (!confirm('Clear all translation history?')) return;
            this.history = [];
            this.saveHistory();
            this.renderHistory();
            APP.showToast('History cleared');
        },

        saveHistory() {
            localStorage.setItem('learny_translator_history', JSON.stringify(this.history));
        },

        loadHistory() {
            const saved = localStorage.getItem('learny_translator_history');
            if (saved) this.history = JSON.parse(saved);
        },

        renderHistory() {
            const list = document.getElementById('history-list');
            if (!list) return;
            if (this.history.length === 0) {
                list.innerHTML = '<p class="empty-text">No translations saved yet.</p>';
                return;
            }
            list.innerHTML = this.history.map((h, i) => {
                const from = h.from === 'en' ? 'EN' : 'සි';
                const to = h.to === 'en' ? 'EN' : 'සි';
                const time = new Date(h.time).toLocaleString();
                return `
                    <div class="history-item">
                        <div class="history-header">
                            <span class="history-lang">${from} → ${to}</span>
                            <span class="history-time">${time}</span>
                        </div>
                        <div class="history-source">${this.escapeHtml(h.source)}</div>
                        <div class="history-result">${this.escapeHtml(h.result)}</div>
                        <div class="history-actions">
                            <button class="btn btn-sm btn-secondary" onclick="NEW.translator.copyItem(${i})">
                                <i class="fa fa-copy"></i> Copy
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="NEW.translator.deleteItem(${i})">
                                <i class="fa fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        },

        copyItem(i) {
            navigator.clipboard.writeText(this.history[i].result).then(() => APP.showToast('Copied!'));
        },

        deleteItem(i) {
            this.history.splice(i, 1);
            this.saveHistory();
            this.renderHistory();
        },

        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    },

    /* ==========================================================
       CALCULATOR MODULE
       ========================================================== */
    calculator: {
        expression: '',
        result: '0',
        memory: 0,
        history: [],
        isScientific: true,
        lastAnswer: 0,
        justCalculated: false,

        scientificButtons: [
            { label: 'sin', action: 'sin', class: 'sci' },
            { label: 'cos', action: 'cos', class: 'sci' },
            { label: 'tan', action: 'tan', class: 'sci' },
            { label: 'π', action: 'pi', class: 'sci' },
            { label: 'e', action: 'euler', class: 'sci' },
            { label: 'x²', action: 'square', class: 'sci' },
            { label: 'xʸ', action: 'power', class: 'sci' },
            { label: '√', action: 'sqrt', class: 'sci' },
            { label: 'log', action: 'log', class: 'sci' },
            { label: 'ln', action: 'ln', class: 'sci' },
            { label: '(', action: '(', class: 'sci' },
            { label: ')', action: ')', class: 'sci' },
            { label: 'n!', action: 'fact', class: 'sci' },
            { label: '1/x', action: 'recip', class: 'sci' },
            { label: 'Ans', action: 'ans', class: 'sci' }
        ],

        basicButtons: [
            { label: 'C', action: 'clear', class: 'func' },
            { label: '⌫', action: 'backspace', class: 'func' },
            { label: '%', action: 'percent', class: 'func' },
            { label: '÷', action: '/', class: 'op' },
            { label: '7', action: '7' },
            { label: '8', action: '8' },
            { label: '9', action: '9' },
            { label: '×', action: '*', class: 'op' },
            { label: '4', action: '4' },
            { label: '5', action: '5' },
            { label: '6', action: '6' },
            { label: '−', action: '-', class: 'op' },
            { label: '1', action: '1' },
            { label: '2', action: '2' },
            { label: '3', action: '3' },
            { label: '+', action: '+', class: 'op' },
            { label: '±', action: 'negate', class: 'func' },
            { label: '0', action: '0' },
            { label: '.', action: '.' },
            { label: '=', action: 'equals', class: 'equals' }
        ],

        init() {
            this.loadHistory();
            this.renderGrid();
            this.bindEvents();
            this.renderHistory();
            this.updateDisplay();
        },

        renderGrid() {
            const grid = document.getElementById('calc-grid');
            if (!grid) return;

            let sciHtml = '';
            if (this.isScientific) {
                sciHtml = `
                    <div class="calc-sci-grid">
                        ${this.scientificButtons.map(b =>
                            `<button class="calc-btn ${b.class}" data-action="${b.action}">${b.label}</button>`
                        ).join('')}
                    </div>
                `;
            }

            const basicHtml = `
                <div class="calc-basic-grid">
                    ${this.basicButtons.map(b =>
                        `<button class="calc-btn ${b.class || ''}" data-action="${b.action}">${b.label}</button>`
                    ).join('')}
                </div>
            `;

            grid.innerHTML = sciHtml + basicHtml;

            grid.querySelectorAll('.calc-btn').forEach(btn => {
                btn.addEventListener('click', () => this.handleAction(btn.dataset.action));
            });
        },

        bindEvents() {
            document.getElementById('calc-mode-toggle')?.addEventListener('click', () => {
                this.isScientific = !this.isScientific;
                const btn = document.getElementById('calc-mode-toggle');
                btn.innerHTML = this.isScientific ? '<i class="fa fa-flask"></i> Scientific' : '<i class="fa fa-th"></i> Basic';
                this.renderGrid();
            });

            document.getElementById('calc-clear-history')?.addEventListener('click', () => {
                if (confirm('Clear calculator history?')) {
                    this.history = [];
                    this.saveHistory();
                    this.renderHistory();
                    APP.showToast('History cleared');
                }
            });

            document.addEventListener('keydown', (e) => {
                if (!document.getElementById('calc-grid')) return;
                const key = e.key;
                if (/^[0-9.]$/.test(key)) this.handleAction(key);
                else if (['+', '-', '*', '/'].includes(key)) this.handleAction(key);
                else if (key === 'Enter' || key === '=') { e.preventDefault(); this.handleAction('equals'); }
                else if (key === 'Backspace') this.handleAction('backspace');
                else if (key === 'Escape') this.handleAction('clear');
                else if (key === '(' || key === ')') this.handleAction(key);
            });
        },

        handleAction(action) {
            const exprEl = document.getElementById('calc-expression');
            const resEl = document.getElementById('calc-result');

            if (action === 'clear') {
                this.expression = '';
                this.result = '0';
                this.justCalculated = false;
                if (exprEl) exprEl.textContent = '\u00A0';
                if (resEl) resEl.textContent = '0';
                return;
            }

            if (/^[0-9.]$/.test(action)) {
                if (this.justCalculated) {
                    if (action === '.') {
                        this.expression = '0.';
                    } else {
                        this.expression = action;
                    }
                    this.justCalculated = false;
                    if (exprEl) exprEl.textContent = this.expression;
                    return;
                }
                if (action === '.' && this.expression.split(/[\+\-\*\/\(\)]/).pop().includes('.')) return;
                this.expression += action;
            }
            else if (['+', '-', '*', '/'].includes(action)) {
                if (this.expression === '' && action !== '-') return;
                const last = this.expression.slice(-1);
                if (['+', '-', '*', '/'].includes(last)) {
                    this.expression = this.expression.slice(0, -1) + action;
                } else {
                    this.expression += action;
                }
                this.justCalculated = false;
            }
            else if (action === '(' || action === ')') {
                this.expression += action;
                this.justCalculated = false;
            }
            else if (action === 'backspace') {
                this.expression = this.expression.slice(0, -1);
                this.justCalculated = false;
            }
            else if (action === 'percent') {
                if (!this.expression) return;
                try {
                    const val = this.evaluate(this.expression);
                    this.expression = String(val / 100);
                } catch { }
            }
            else if (action === 'negate') {
                if (this.expression.startsWith('-')) this.expression = this.expression.slice(1);
                else if (this.expression) this.expression = '-' + this.expression;
            }
            else if (action === 'equals') {
                this.calculate();
                return;
            }
            else if (action === 'pi') this.expression += Math.PI.toString();
            else if (action === 'euler') this.expression += Math.E.toString();
            else if (action === 'sin') this.expression += 'sin(';
            else if (action === 'cos') this.expression += 'cos(';
            else if (action === 'tan') this.expression += 'tan(';
            else if (action === 'sqrt') this.expression += 'sqrt(';
            else if (action === 'log') this.expression += 'log(';
            else if (action === 'ln') this.expression += 'ln(';
            else if (action === 'square') this.expression += '**2';
            else if (action === 'power') this.expression += '**';
            else if (action === 'recip') this.expression = '1/(' + this.expression + ')';
            else if (action === 'fact') {
                if (!this.expression) return;
                try {
                    const val = this.evaluate(this.expression);
                    this.expression = String(this.factorial(val));
                } catch { }
            }
            else if (action === 'ans') {
                this.expression += this.lastAnswer.toString();
            }
            else if (['mc', 'mr', 'm+', 'm-', 'ms'].includes(action)) {
                this.handleMemory(action);
                return;
            }

            this.justCalculated = false;
            this.updateDisplay();
        },

        handleMemory(action) {
            const current = parseFloat(this.result) || 0;
            if (action === 'mc') this.memory = 0;
            else if (action === 'mr') this.expression += this.memory.toString();
            else if (action === 'm+') this.memory += current;
            else if (action === 'm-') this.memory -= current;
            else if (action === 'ms') this.memory = current;
            const ind = document.getElementById('calc-memory-indicator');
            if (ind) ind.textContent = this.memory !== 0 ? 'M' : '';
            this.updateDisplay();
        },

        factorial(n) {
            if (n < 0 || !Number.isInteger(n)) return NaN;
            if (n === 0 || n === 1) return 1;
            let r = 1;
            for (let i = 2; i <= n; i++) r *= i;
            return r;
        },

        evaluate(expr) {
            if (!expr || !expr.trim()) throw new Error('Empty expression');

            let openCount = (expr.match(/\(/g) || []).length;
            let closeCount = (expr.match(/\)/g) || []).length;
            while (closeCount < openCount) {
                expr += ')';
                closeCount++;
            }

            let safe = expr
                .replace(/sin\(/g, '_sin(')
                .replace(/cos\(/g, '_cos(')
                .replace(/tan\(/g, '_tan(')
                .replace(/sqrt\(/g, 'Math.sqrt(')
                .replace(/log\(/g, 'Math.log10(')
                .replace(/ln\(/g, 'Math.log(')
                .replace(/π/g, 'Math.PI');

            if (!/^[\d\+\-\*\/\(\)\.\,\s_a-zA-Z]*$/.test(safe)) {
                throw new Error('Invalid characters');
            }

            const _sin = (d) => Math.sin(d * Math.PI / 180);
            const _cos = (d) => Math.cos(d * Math.PI / 180);
            const _tan = (d) => Math.tan(d * Math.PI / 180);

            return Function('_sin', '_cos', '_tan', '"use strict"; return (' + safe + ')')(_sin, _cos, _tan);
        },

        calculate() {
            if (!this.expression) return;
            try {
                const val = this.evaluate(this.expression);
                if (!isFinite(val)) throw new Error('Invalid');
                const rounded = Math.round(val * 1e10) / 1e10;

                this.history.unshift({
                    expr: this.expression,
                    result: rounded,
                    time: new Date().toISOString()
                });
                if (this.history.length > 30) this.history.pop();
                this.saveHistory();
                this.renderHistory();

                this.lastAnswer = rounded;
                this.result = String(rounded);

                const exprEl = document.getElementById('calc-expression');
                if (exprEl) exprEl.textContent = this.expression + ' =';

                this.expression = String(rounded);
                this.justCalculated = true;

                const resEl = document.getElementById('calc-result');
                if (resEl) resEl.textContent = this.result;
            } catch (err) {
                this.result = 'Error';
                const resEl = document.getElementById('calc-result');
                if (resEl) resEl.textContent = 'Error';
                APP.showToast('Invalid expression');
                setTimeout(() => {
                    this.expression = '';
                    this.result = '0';
                    this.updateDisplay();
                }, 1200);
            }
        },

        updateDisplay() {
            const exprEl = document.getElementById('calc-expression');
            const resEl = document.getElementById('calc-result');
            if (exprEl) {
                exprEl.textContent = this.expression || '\u00A0';
            }
            if (resEl) {
                resEl.textContent = this.result;
            }
        },

        loadHistory() {
            const saved = localStorage.getItem('learny_calc_history');
            if (saved) this.history = JSON.parse(saved);
        },

        saveHistory() {
            localStorage.setItem('learny_calc_history', JSON.stringify(this.history));
        },

        renderHistory() {
            const list = document.getElementById('calc-history');
            if (!list) return;
            if (this.history.length === 0) {
                list.innerHTML = '<p class="empty-text">No calculations yet.</p>';
                return;
            }
            list.innerHTML = this.history.map((h, i) => `
                <div class="calc-history-item" onclick="NEW.calculator.useHistory(${i})">
                    <div class="calc-history-expr">${this.escapeHtml(h.expr)}</div>
                    <div class="calc-history-result">= ${h.result}</div>
                </div>
            `).join('');
        },

        useHistory(i) {
            this.expression = String(this.history[i].result);
            this.result = String(this.history[i].result);
            this.justCalculated = false;
            this.updateDisplay();
        },

        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    },

    /* ==========================================================
       CONVERTER MODULE
       ========================================================== */
    converter: {
        categories: {
            length: {
                name: 'Length',
                units: {
                    'nm': { name: 'Nanometer (nm)', factor: 1e-9 },
                    'µm': { name: 'Micrometer (µm)', factor: 1e-6 },
                    'mm': { name: 'Millimeter (mm)', factor: 0.001 },
                    'cm': { name: 'Centimeter (cm)', factor: 0.01 },
                    'dm': { name: 'Decimeter (dm)', factor: 0.1 },
                    'm': { name: 'Meter (m)', factor: 1 },
                    'km': { name: 'Kilometer (km)', factor: 1000 }
                },
                defaultFrom: 'm',
                defaultTo: 'cm'
            },
            volume: {
                name: 'Volume',
                units: {
                    'mm3': { name: 'Cubic mm (mm³)', factor: 1e-9 },
                    'cm3': { name: 'Cubic cm (cm³)', factor: 1e-6 },
                    'dm3': { name: 'Cubic dm (dm³)', factor: 0.001 },
                    'm3': { name: 'Cubic m (m³)', factor: 1 },
                    'mL': { name: 'Milliliter (mL)', factor: 1e-6 },
                    'L': { name: 'Liter (L)', factor: 0.001 }
                },
                defaultFrom: 'dm3',
                defaultTo: 'cm3'
            },
            concentration: {
                name: 'Concentration',
                units: {
                    'ppm': { name: 'ppm', factor: 1 },
                    'mg/dm3': { name: 'mg/dm³', factor: 1 },
                    'mg/L': { name: 'mg/L', factor: 1 },
                    'g/L': { name: 'g/L', factor: 1000 },
                    'g/m3': { name: 'g/m³', factor: 1 },
                    'µg/L': { name: 'µg/L', factor: 0.001 }
                },
                defaultFrom: 'ppm',
                defaultTo: 'mg/dm3'
            },
            area: {
                name: 'Area',
                units: {
                    'mm2': { name: 'Square mm (mm²)', factor: 1e-6 },
                    'cm2': { name: 'Square cm (cm²)', factor: 1e-4 },
                    'm2': { name: 'Square m (m²)', factor: 1 },
                    'km2': { name: 'Square km (km²)', factor: 1e6 },
                    'ha': { name: 'Hectare (ha)', factor: 10000 }
                },
                defaultFrom: 'm2',
                defaultTo: 'cm2'
            },
            mass: {
                name: 'Mass',
                units: {
                    'mg': { name: 'Milligram (mg)', factor: 1e-6 },
                    'g': { name: 'Gram (g)', factor: 0.001 },
                    'kg': { name: 'Kilogram (kg)', factor: 1 },
                    't': { name: 'Tonne (t)', factor: 1000 }
                },
                defaultFrom: 'kg',
                defaultTo: 'g'
            }
        },

        currentCategory: 'length',

        init() {
            this.bindTabs();
            this.loadCategory('length');
            document.getElementById('conv-from-value')?.addEventListener('input', () => this.convert());
            document.getElementById('conv-from-unit')?.addEventListener('change', () => this.convert());
            document.getElementById('conv-to-unit')?.addEventListener('change', () => this.convert());
            document.getElementById('conv-swap')?.addEventListener('click', () => this.swapUnits());
        },

        bindTabs() {
            document.querySelectorAll('.conv-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.conv-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.loadCategory(tab.dataset.category);
                });
            });
        },

        loadCategory(cat) {
            this.currentCategory = cat;
            const data = this.categories[cat];
            const fromSel = document.getElementById('conv-from-unit');
            const toSel = document.getElementById('conv-to-unit');
            fromSel.innerHTML = Object.entries(data.units).map(([k, v]) =>
                `<option value="${k}">${v.name}</option>`).join('');
            toSel.innerHTML = fromSel.innerHTML;
            fromSel.value = data.defaultFrom;
            toSel.value = data.defaultTo;
            this.convert();
        },

        swapUnits() {
            const from = document.getElementById('conv-from-unit');
            const to = document.getElementById('conv-to-unit');
            [from.value, to.value] = [to.value, from.value];
            this.convert();
        },

        convert() {
            const data = this.categories[this.currentCategory];
            const val = parseFloat(document.getElementById('conv-from-value').value);
            const fromUnit = document.getElementById('conv-from-unit').value;
            const toUnit = document.getElementById('conv-to-unit').value;
            const resultEl = document.getElementById('conv-to-value');
            const formulaEl = document.getElementById('conv-formula-text');

            if (isNaN(val)) {
                resultEl.value = '';
                return;
            }

            const fromFactor = data.units[fromUnit].factor;
            const toFactor = data.units[toUnit].factor;
            const result = (val * fromFactor) / toFactor;

            let formatted;
            if (result === 0) formatted = '0';
            else if (Math.abs(result) < 0.0001 || Math.abs(result) > 1e9) {
                formatted = result.toExponential(6);
            } else {
                formatted = parseFloat(result.toPrecision(10)).toString();
            }
            resultEl.value = formatted;

            const ratio = fromFactor / toFactor;
            formulaEl.textContent = `1 ${fromUnit} = ${ratio} ${toUnit}`;

            this.renderTable(val, fromUnit);
        },

        renderTable(val, fromUnit) {
            const data = this.categories[this.currentCategory];
            const tbody = document.getElementById('conv-table-body');
            const unitHeader = document.getElementById('conv-table-unit');
            if (!tbody) return;
            unitHeader.textContent = data.name + ' Conversions';

            const values = [0.1, 1, 5, 10, 25, 50, 100, 500, 1000];
            tbody.innerHTML = values.map(v => {
                const cells = Object.entries(data.units).map(([k, u]) => {
                    if (k === fromUnit) return `<td><strong>${v} ${k}</strong></td>`;
                    const r = (v * data.units[fromUnit].factor) / u.factor;
                    const fmt = Math.abs(r) < 0.0001 || Math.abs(r) > 1e9 ? r.toExponential(3) : parseFloat(r.toPrecision(6));
                    return `<td>${fmt} ${k}</td>`;
                }).join('');
                return `<tr><td><strong>${v}</strong></td>${cells}</tr>`;
            }).join('');
        }
    },

    /* ==========================================================
       QUIZ MODULE (PREMIUM)
       ========================================================== */
    quiz: {
        isPremium: false,
        questions: [],
        currentQ: 0,
        score: 0,
        startTime: null,
        timerInterval: null,
        selectedAnswer: null,

        init() {
            this.checkPremium();
            document.getElementById('start-quiz-btn')?.addEventListener('click', () => this.startQuiz());
            document.getElementById('quiz-next')?.addEventListener('click', () => this.nextQuestion());
            document.getElementById('quiz-skip')?.addEventListener('click', () => this.skipQuestion());
            document.getElementById('quiz-restart')?.addEventListener('click', () => this.startQuiz());
        },

        checkPremium() {
            const premium = localStorage.getItem('learny_premium');
            this.isPremium = premium === 'true';
            const locked = document.getElementById('quiz-locked');
            const active = document.getElementById('quiz-active');
            const btn = document.getElementById('start-quiz-btn');

            if (this.isPremium) {
                locked?.classList.add('hidden');
                btn?.classList.remove('hidden');
            } else {
                locked?.classList.remove('hidden');
                active?.classList.add('hidden');
                btn?.addEventListener('click', (e) => {
                    if (!this.isPremium) {
                        e.preventDefault();
                        location.href = 'premium.html';
                    }
                }, { once: false });
            }
        },

        generateQuestions() {
            const questions = [];
            const cat = NEW.converter.categories;
            const catKeys = Object.keys(cat);

            for (let i = 0; i < 10; i++) {
                const catKey = catKeys[Math.floor(Math.random() * catKeys.length)];
                const catData = cat[catKey];
                const units = Object.keys(catData.units);
                const fromUnit = units[Math.floor(Math.random() * units.length)];
                let toUnit = units[Math.floor(Math.random() * units.length)];
                while (toUnit === fromUnit && units.length > 1) {
                    toUnit = units[Math.floor(Math.random() * units.length)];
                }

                const value = Math.floor(Math.random() * 100) + 1;
                const fromFactor = catData.units[fromUnit].factor;
                const toFactor = catData.units[toUnit].factor;
                const answer = (value * fromFactor) / toFactor;

                const options = [answer];
                while (options.length < 4) {
                    const wrong = answer * (0.5 + Math.random() * 2);
                    const rounded = parseFloat(wrong.toPrecision(4));
                    if (!options.some(o => Math.abs(o - rounded) / (rounded || 1) < 0.01)) {
                        options.push(rounded);
                    }
                }
                options.sort(() => Math.random() - 0.5);

                questions.push({
                    question: `Convert ${value} ${fromUnit} to ${toUnit}`,
                    options: options.map(o => parseFloat(o.toPrecision(6))),
                    correct: parseFloat(answer.toPrecision(6)),
                    category: catData.name
                });
            }
            return questions;
        },

        startQuiz() {
            if (!this.isPremium) {
                location.href = 'premium.html';
                return;
            }
            this.questions = this.generateQuestions();
            this.currentQ = 0;
            this.score = 0;
            this.startTime = Date.now();

            document.getElementById('quiz-locked')?.classList.add('hidden');
            document.getElementById('quiz-result')?.classList.add('hidden');
            document.getElementById('quiz-active')?.classList.remove('hidden');

            this.startTimer();
            this.renderQuestion();
        },

        startTimer() {
            clearInterval(this.timerInterval);
            this.timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
                const s = String(elapsed % 60).padStart(2, '0');
                document.getElementById('quiz-timer').textContent = `${m}:${s}`;
            }, 1000);
        },

        renderQuestion() {
            const q = this.questions[this.currentQ];
            document.getElementById('quiz-question').textContent = q.question;
            document.getElementById('quiz-current').textContent = this.currentQ + 1;
            document.getElementById('quiz-score').textContent = this.score;
            document.getElementById('quiz-progress-bar').style.width = `${((this.currentQ) / 10) * 100}%`;

            const opts = document.getElementById('quiz-options');
            opts.innerHTML = q.options.map((o, i) => `
                <button class="quiz-option" data-index="${i}" data-value="${o}">
                    <span class="quiz-option-letter">${String.fromCharCode(65 + i)}</span>
                    <span class="quiz-option-text">${o}</span>
                </button>
            `).join('');

            opts.querySelectorAll('.quiz-option').forEach(btn => {
                btn.addEventListener('click', () => this.selectAnswer(btn));
            });

            document.getElementById('quiz-next').disabled = true;
            this.selectedAnswer = null;
        },

        selectAnswer(btn) {
            if (this.selectedAnswer) return;
            this.selectedAnswer = btn;
            const value = parseFloat(btn.dataset.value);
            const q = this.questions[this.currentQ];
            const isCorrect = Math.abs(value - q.correct) / (q.correct || 1) < 0.01;

            document.querySelectorAll('.quiz-option').forEach(b => {
                const v = parseFloat(b.dataset.value);
                const correct = Math.abs(v - q.correct) / (q.correct || 1) < 0.01;
                if (correct) b.classList.add('correct');
                else if (b === btn && !isCorrect) b.classList.add('wrong');
            });

            if (isCorrect) this.score++;
            document.getElementById('quiz-next').disabled = false;
        },

        nextQuestion() {
            this.currentQ++;
            if (this.currentQ >= 10) {
                this.finishQuiz();
            } else {
                this.renderQuestion();
            }
        },

        skipQuestion() {
            this.nextQuestion();
        },

        finishQuiz() {
            clearInterval(this.timerInterval);
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const s = String(elapsed % 60).padStart(2, '0');

            document.getElementById('quiz-active')?.classList.add('hidden');
            document.getElementById('quiz-result')?.classList.remove('hidden');

            document.getElementById('result-score').textContent = `${this.score}/10`;
            document.getElementById('result-percent').textContent = `${this.score * 10}%`;
            document.getElementById('result-time').textContent = `${m}:${s}`;

            let icon = '🏆', title = 'Excellent!';
            if (this.score < 5) { icon = '📚'; title = 'Keep Practicing!'; }
            else if (this.score < 8) { icon = '⭐'; title = 'Good Job!'; }
            document.getElementById('quiz-result-icon').textContent = icon;
            document.getElementById('quiz-result-title').textContent = title;

            const best = parseInt(localStorage.getItem('learny_quiz_best') || '0');
            if (this.score > best) {
                localStorage.setItem('learny_quiz_best', this.score);
                APP.showToast('🏆 New best score!');
            }
        }
    },

    /* ==========================================================
       OCR MODULE (Image & PDF Text Extractor)
       ========================================================== */
    ocr: {
        currentImage: null,
        currentPdf: null,
        isPdf: false,

        init() {
            this.bindEvents();
        },

        bindEvents() {
            const uploadZone = document.getElementById('ocr-upload-zone');
            const fileInput = document.getElementById('ocr-file-input');
            const removeBtn = document.getElementById('ocr-remove-img');
            const extractBtn = document.getElementById('ocr-extract-btn');
            const copyBtn = document.getElementById('ocr-copy-text');
            const useTranslatorBtn = document.getElementById('ocr-use-translator');
            const clearBtn = document.getElementById('ocr-clear-text');

            if (uploadZone) {
                uploadZone.addEventListener('click', () => fileInput?.click());
                uploadZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadZone.classList.add('dragover');
                });
                uploadZone.addEventListener('dragleave', () => {
                    uploadZone.classList.remove('dragover');
                });
                uploadZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadZone.classList.remove('dragover');
                    const files = e.dataTransfer.files;
                    if (files.length) this.handleFile(files[0]);
                });
            }

            fileInput?.addEventListener('change', (e) => {
                if (e.target.files.length) this.handleFile(e.target.files[0]);
            });

            removeBtn?.addEventListener('click', () => {
                this.resetOCR();
            });

            extractBtn?.addEventListener('click', () => {
                this.extractText();
            });

            copyBtn?.addEventListener('click', () => {
                const text = document.getElementById('ocr-extracted-text')?.value || '';
                if (text) {
                    navigator.clipboard.writeText(text).then(() => {
                        APP.showToast('Text copied to clipboard!');
                    });
                }
            });

            useTranslatorBtn?.addEventListener('click', () => {
                const text = document.getElementById('ocr-extracted-text')?.value || '';
                if (text) {
                    const sourceText = document.getElementById('source-text');
                    if (sourceText) {
                        sourceText.value = text;
                        document.getElementById('char-count').textContent = `${text.length} / 1000`;
                        document.querySelector('.translator-layout')?.scrollIntoView({ behavior: 'smooth' });
                        APP.showToast('Text added to translator!');
                    }
                }
            });

            clearBtn?.addEventListener('click', () => {
                const textarea = document.getElementById('ocr-extracted-text');
                if (textarea) {
                    textarea.value = '';
                    document.getElementById('ocr-char-count').textContent = '0 characters';
                }
            });
        },

        handleFile(file) {
            const isPdf = file.type === 'application/pdf';
            const isImage = file.type.startsWith('image/');

            if (!isPdf && !isImage) {
                APP.showToast('Please upload an image or PDF file');
                return;
            }

            const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
            if (file.size > maxSize) {
                APP.showToast(`${isPdf ? 'PDF' : 'Image'} size must be less than ${maxSize / (1024*1024)}MB`);
                return;
            }

            this.isPdf = isPdf;
            
            if (isPdf) {
                this.currentPdf = file;
                this.currentImage = null;
                this.showPdfPreview(file);
            } else {
                this.currentImage = file;
                this.currentPdf = null;
                this.showImagePreview(file);
            }
        },

        showImagePreview(file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewImg = document.getElementById('ocr-preview-img');
                const previewSection = document.getElementById('ocr-preview-section');
                const uploadZone = document.getElementById('ocr-upload-zone');
                
                if (previewImg) {
                    previewImg.src = e.target.result;
                    previewImg.style.display = 'block';
                }
                if (uploadZone) uploadZone.classList.add('hidden');
                if (previewSection) previewSection.classList.remove('hidden');
                
                const pdfInfo = document.getElementById('ocr-pdf-info');
                if (pdfInfo) pdfInfo.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        },

        showPdfPreview(file) {
            const previewImg = document.getElementById('ocr-preview-img');
            const previewSection = document.getElementById('ocr-preview-section');
            const uploadZone = document.getElementById('ocr-upload-zone');
            
            if (previewImg) previewImg.style.display = 'none';
            
            let pdfInfo = document.getElementById('ocr-pdf-info');
            if (!pdfInfo) {
                pdfInfo = document.createElement('div');
                pdfInfo.id = 'ocr-pdf-info';
                pdfInfo.className = 'ocr-pdf-info';
                previewSection?.appendChild(pdfInfo);
            }
            
            pdfInfo.innerHTML = `
                <div class="pdf-preview-icon">
                    <i class="fa fa-file-pdf"></i>
                </div>
                <div class="pdf-preview-details">
                    <h4>${file.name}</h4>
                    <p>${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <p class="pdf-pages-count" id="pdf-pages-count">Loading...</p>
                </div>
            `;
            pdfInfo.classList.remove('hidden');
            
            if (uploadZone) uploadZone.classList.add('hidden');
            if (previewSection) previewSection.classList.remove('hidden');
            
            this.getPdfPageCount(file);
        },

        async getPdfPageCount(file) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const pageCount = pdf.numPages;
                
                const pageCountEl = document.getElementById('pdf-pages-count');
                if (pageCountEl) {
                    pageCountEl.textContent = `${pageCount} page${pageCount > 1 ? 's' : ''}`;
                }
            } catch (error) {
                console.error('PDF Error:', error);
                const pageCountEl = document.getElementById('pdf-pages-count');
                if (pageCountEl) {
                    pageCountEl.textContent = 'Unable to read PDF';
                }
            }
        },

        async extractText() {
            if (this.isPdf) {
                await this.extractFromPdf();
            } else {
                await this.extractFromImage();
            }
        },

        async extractFromImage() {
            const lang = document.getElementById('ocr-lang')?.value || 'eng';
            const progressBar = document.getElementById('ocr-progress-bar');
            const progressText = document.getElementById('ocr-progress-text');
            const progressSection = document.getElementById('ocr-progress');
            const resultSection = document.getElementById('ocr-result');
            const extractedText = document.getElementById('ocr-extracted-text');
            const charCount = document.getElementById('ocr-char-count');
            const extractBtn = document.getElementById('ocr-extract-btn');

            if (!this.currentImage) {
                APP.showToast('Please select an image first');
                return;
            }

            if (progressSection) progressSection.classList.remove('hidden');
            if (resultSection) resultSection.classList.add('hidden');
            if (extractBtn) extractBtn.disabled = true;

            try {
                const result = await Tesseract.recognize(
                    this.currentImage,
                    lang,
                    {
                        logger: (m) => {
                            if (m.status === 'recognizing text') {
                                const progress = Math.round(m.progress * 100);
                                if (progressBar) progressBar.style.width = progress + '%';
                                if (progressText) progressText.textContent = `Extracting text... ${progress}%`;
                            } else {
                                if (progressText) progressText.textContent = m.status;
                            }
                        }
                    }
                );

                const text = result.data.text;
                
                if (extractedText) extractedText.value = text;
                if (charCount) charCount.textContent = `${text.length} characters`;
                if (resultSection) resultSection.classList.remove('hidden');
                
                APP.showToast('Text extracted successfully!');

            } catch (error) {
                console.error('OCR Error:', error);
                APP.showToast('Failed to extract text. Try again.');
            } finally {
                if (extractBtn) extractBtn.disabled = false;
                setTimeout(() => {
                    if (progressSection) progressSection.classList.add('hidden');
                    if (progressBar) progressBar.style.width = '0%';
                }, 1000);
            }
        },

        async extractFromPdf() {
            const lang = document.getElementById('ocr-lang')?.value || 'eng';
            const progressBar = document.getElementById('ocr-progress-bar');
            const progressText = document.getElementById('ocr-progress-text');
            const progressSection = document.getElementById('ocr-progress');
            const resultSection = document.getElementById('ocr-result');
            const extractedText = document.getElementById('ocr-extracted-text');
            const charCount = document.getElementById('ocr-char-count');
            const extractBtn = document.getElementById('ocr-extract-btn');

            if (!this.currentPdf) {
                APP.showToast('Please select a PDF first');
                return;
            }

            if (progressSection) progressSection.classList.remove('hidden');
            if (resultSection) resultSection.classList.add('hidden');
            if (extractBtn) extractBtn.disabled = true;

            try {
                const arrayBuffer = await this.currentPdf.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const totalPages = pdf.numPages;
                let allText = '';

                for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                    if (progressText) {
                        progressText.textContent = `Processing page ${pageNum} of ${totalPages}...`;
                    }

                    const page = await pdf.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 2.0 });
                    
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    }).promise;

                    const canvasBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

                    const result = await Tesseract.recognize(
                        canvasBlob,
                        lang,
                        {
                            logger: (m) => {
                                if (m.status === 'recognizing text') {
                                    const pageProgress = m.progress;
                                    const totalProgress = ((pageNum - 1 + pageProgress) / totalPages) * 100;
                                    if (progressBar) progressBar.style.width = totalProgress + '%';
                                }
                            }
                        }
                    );

                    allText += `\n--- Page ${pageNum} ---\n${result.data.text}\n`;
                }

                if (extractedText) extractedText.value = allText.trim();
                if (charCount) charCount.textContent = `${allText.length} characters`;
                if (resultSection) resultSection.classList.remove('hidden');
                
                APP.showToast(`Extracted text from ${totalPages} page${totalPages > 1 ? 's' : ''}!`);

            } catch (error) {
                console.error('PDF OCR Error:', error);
                APP.showToast('Failed to extract text from PDF. Try again.');
            } finally {
                if (extractBtn) extractBtn.disabled = false;
                setTimeout(() => {
                    if (progressSection) progressSection.classList.add('hidden');
                    if (progressBar) progressBar.style.width = '0%';
                }, 1000);
            }
        },

        resetOCR() {
            this.currentImage = null;
            this.currentPdf = null;
            this.isPdf = false;
            const uploadZone = document.getElementById('ocr-upload-zone');
            const previewSection = document.getElementById('ocr-preview-section');
            const fileInput = document.getElementById('ocr-file-input');
            const extractedText = document.getElementById('ocr-extracted-text');
            const pdfInfo = document.getElementById('ocr-pdf-info');
            
            if (uploadZone) uploadZone.classList.remove('hidden');
            if (previewSection) previewSection.classList.add('hidden');
            if (fileInput) fileInput.value = '';
            if (extractedText) extractedText.value = '';
            if (pdfInfo) pdfInfo.classList.add('hidden');
            
            document.getElementById('ocr-progress')?.classList.add('hidden');
            document.getElementById('ocr-result')?.classList.add('hidden');
        }
    },

    /* ==========================================================
       INIT ROUTER
       ========================================================== */
    init() {
        const path = window.location.pathname.split('/').pop();
        if (path.includes('translator.html')) {
            this.translator.init();
            this.ocr.init();
        }
        if (path.includes('calculator.html')) this.calculator.init();
        if (path.includes('converter.html')) {
            this.converter.init();
            this.quiz.init();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => NEW.init());
