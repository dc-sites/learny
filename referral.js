/**
 * Learny Referral System
 * Handles referral tracking, points, and lucky wheel
 */

const ReferralSystem = {
    // Configuration
    config: {
        baseUrl: 'https://www.learny.study',
        apkInstallPath: 'learny.apk',
        pointsPerReferral: 1,
        pointsPerSpin: 2,
        whatsappSupport: 'https://wa.me/764720488',
        wheelSegments: [
            { name: 'Lifetime Premium', class: 'segment-premium', color: '#ffd700' },
            { name: 'Try Again', class: 'segment-tryagain', color: '#6b7280' },
            { name: 'One Year Premium', class: 'segment-1year', color: '#c0c0c0' },
            { name: 'One Month Premium', class: 'segment-1month', color: '#cd7f32' },
            { name: 'Try Again', class: 'segment-tryagain', color: '#6b7280' }
        ]
    },

    // State
    state: {
        userId: null,
        points: 0,
        spinsUsed: 0,
        referrals: [],
        isSpinning: false
    },

    /**
     * Initialize the referral system
     */
    init() {
        this.generateOrGetUserId();
        this.loadReferralData();
        this.checkIncomingReferral();
        this.setupEventListeners();
        this.renderWheel();
        this.updateUI();
        this.renderHistory();
        
        // Handle APK install tracking
        this.trackApkInstall();
    },

    /**
     * Generate or retrieve unique user ID
     */
    generateOrGetUserId() {
        let userId = localStorage.getItem('learny_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
            localStorage.setItem('learny_user_id', userId);
        }
        this.state.userId = userId;
    },

    /**
     * Load referral data from localStorage
     */
    loadReferralData() {
        const data = JSON.parse(localStorage.getItem('learny_referral_' + this.state.userId)) || {
            points: 0,
            spinsUsed: 0,
            referrals: []
        };
        this.state.points = data.points;
        this.state.spinsUsed = data.spinsUsed;
        this.state.referrals = data.referrals;
    },

    /**
     * Save referral data to localStorage
     */
    saveReferralData() {
        localStorage.setItem('learny_referral_' + this.state.userId, JSON.stringify({
            points: this.state.points,
            spinsUsed: this.state.spinsUsed,
            referrals: this.state.referrals
        }));
    },

    /**
     * Check for incoming referral from URL parameter
     */
    checkIncomingReferral() {
        const urlParams = new URLSearchParams(window.location.search);
        const referrerId = urlParams.get('ref');
        
        if (referrerId && referrerId !== this.state.userId) {
            // Check if user already has a referrer recorded
            if (!localStorage.getItem('learny_referred_by')) {
                // Record the referrer
                localStorage.setItem('learny_referred_by', referrerId);
                localStorage.setItem('learny_referral_apk_clicked', 'false');
                
                // Add to referrer's data (simulated - in production, this would be server-side)
                this.addReferralToUser(referrerId, this.state.userId);
            }
        }
    },

    /**
     * Add referral to user's record (client-side simulation)
     */
    addReferralToUser(referrerId, newUserId) {
        const referrerData = JSON.parse(localStorage.getItem('learny_referral_' + referrerId)) || {
            points: 0,
            spinsUsed: 0,
            referrals: []
        };
        
        // Check if this referral already exists
        const exists = referrerData.referrals.some(r => r.newUserId === newUserId);
        if (!exists) {
            referrerData.referrals.push({
                newUserId: newUserId,
                date: new Date().toISOString(),
                apkInstalled: false
            });
            referrerData.points += this.config.pointsPerReferral;
            localStorage.setItem('learny_referral_' + referrerId, JSON.stringify(referrerData));
        }
    },

    /**
     * Track APK install button click for referral credit
     */
    trackApkInstall() {
        // Listen for clicks on APK install buttons (on index.html)
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[href*="learny.apk"], [data-apk-install]');
            if (target) {
                const hasReferrer = localStorage.getItem('learny_referred_by');
                const apkClicked = localStorage.getItem('learny_referral_apk_clicked');
                
                if (hasReferrer && apkClicked !== 'true') {
                    // Mark as clicked to prevent duplicate credits
                    localStorage.setItem('learny_referral_apk_clicked', 'true');
                    
                    // Credit the referrer
                    this.creditReferral(hasReferrer);
                    
                    // Show thank you notification
                    this.showToast('🎉 Thanks for installing! Your referrer has been credited.');
                }
            }
        });
    },

    /**
     * Credit a referral to the referrer
     */
    creditReferral(referrerId) {
        const referrerData = JSON.parse(localStorage.getItem('learny_referral_' + referrerId)) || {
            points: 0,
            spinsUsed: 0,
            referrals: []
        };
        
        // Update referral as installed
        const referral = referrerData.referrals.find(r => !r.apkInstalled);
        if (referral) {
            referral.apkInstalled = true;
            referral.installedDate = new Date().toISOString();
            
            // Save updated data
            localStorage.setItem('learny_referral_' + referrerId, JSON.stringify(referrerData));
            
            // If this is the current user viewing their referral page, update UI
            if (referrerId === this.state.userId) {
                this.loadReferralData();
                this.updateUI();
                this.renderHistory();
            }
        }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Copy referral link button
        document.getElementById('copy-link-btn')?.addEventListener('click', () => {
            this.copyReferralLink();
        });

        // Spin wheel button
        document.getElementById('spin-btn')?.addEventListener('click', () => {
            this.spinWheel();
        });

        // Modal close button
        document.getElementById('modal-close')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on overlay click
        document.getElementById('result-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'result-modal') {
                this.closeModal();
            }
        });

        // Theme toggle (inherited from main app)
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            btn.onclick = () => {
                const isDark = !document.body.classList.contains('light');
                document.body.classList.toggle('light', !isDark);
                localStorage.setItem('learny_dark_mode', isDark);
            };
        });
    },

    /**
     * Copy referral link to clipboard
     */
    copyReferralLink() {
        const linkInput = document.getElementById('referral-link');
        if (linkInput) {
            linkInput.select();
            linkInput.setSelectionRange(0, 99999);
            
            navigator.clipboard.writeText(linkInput.value).then(() => {
                this.showToast('✅ Link copied to clipboard!');
                
                // Visual feedback
                const copyBtn = document.getElementById('copy-link-btn');
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fa fa-check"></i> Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            }).catch(() => {
                this.showToast('❌ Failed to copy link');
            });
        }
    },

    /**
     * Render the wheel with 5 segments
     */
    renderWheel() {
        const wheel = document.getElementById('wheel');
        if (!wheel) return;

        const segmentAngle = 360 / this.config.wheelSegments.length;
        
        this.config.wheelSegments.forEach((segment, index) => {
            const segmentEl = document.createElement('div');
            segmentEl.className = `wheel-segment ${segment.class}`;
            segmentEl.style.transform = `rotate(${index * segmentAngle}deg)`;
            
            const span = document.createElement('span');
            span.textContent = segment.name;
            segmentEl.appendChild(span);
            
            wheel.appendChild(segmentEl);
        });
    },

    /**
     * Update UI elements with current state
     */
    updateUI() {
        // Update points display
        const pointsEl = document.getElementById('referral-points');
        if (pointsEl) {
            pointsEl.textContent = this.state.points;
            
            // Animate number change
            pointsEl.style.transform = 'scale(1.2)';
            setTimeout(() => {
                pointsEl.style.transform = 'scale(1)';
            }, 200);
        }

        // Update spin button state
        const spinBtn = document.getElementById('spin-btn');
        const spinReq = document.getElementById('spin-requirement');
        if (spinBtn && spinReq) {
            const availableSpins = Math.floor(this.state.points / this.config.pointsPerSpin) - this.state.spinsUsed;
            
            if (availableSpins > 0) {
                spinBtn.disabled = false;
                spinBtn.innerHTML = `<i class="fa fa-sync-alt"></i> Spin Wheel (${availableSpins} spin${availableSpins > 1 ? 's' : ''} available)`;
                spinReq.textContent = `You have ${availableSpins} spin${availableSpins > 1 ? 's' : ''} ready!`;
                spinReq.classList.remove('text-muted');
                spinReq.style.color = 'var(--success)';
            } else {
                spinBtn.disabled = true;
                const needed = this.config.pointsPerSpin - (this.state.points % this.config.pointsPerSpin);
                spinBtn.innerHTML = `<i class="fa fa-sync-alt"></i> Spin Wheel (Need ${needed} more point${needed > 1 ? 's' : ''})`;
                spinReq.textContent = `Collect ${needed} more referral${needed > 1 ? 's' : ''} to unlock your spin!`;
                spinReq.classList.add('text-muted');
                spinReq.style.color = '';
            }
        }

        // Update referral link display
        const linkInput = document.getElementById('referral-link');
        if (linkInput && this.state.userId) {
            linkInput.value = `${this.config.baseUrl}/index.html?ref=${this.state.userId}`;
        }

        // Update sidebar username if available
        if (APP?.data?.profile?.name) {
            document.getElementById('sidebar-username')?.textContent = `Welcome, ${APP.data.profile.name}!`;
        }
    },

    /**
     * Render referral history list
     */
    renderHistory() {
        const historyContainer = document.getElementById('referral-history');
        if (!historyContainer) return;

        if (this.state.referrals.length === 0) {
            historyContainer.innerHTML = '<p class="empty-history">No referrals yet. Share your link to get started! 🚀</p>';
            return;
        }

        historyContainer.innerHTML = this.state.referrals.slice().reverse().map(ref => {
            const date = new Date(ref.date).toLocaleDateString();
            const status = ref.apkInstalled 
                ? '<span style="color:var(--success);font-weight:600">✓ Installed</span>' 
                : '<span style="color:var(--warning);font-weight:600">⏳ Pending</span>';
            
            return `
                <div class="referral-item">
                    <div class="referral-info">
                        <div class="referral-avatar">${(ref.newUserId || 'U').charAt(0).toUpperCase()}</div>
                        <div class="referral-details">
                            <span class="referral-name">New User</span>
                            <span class="referral-date">${date}</span>
                        </div>
                    </div>
                    <div style="text-align:right">
                        <span class="referral-points-badge">+${this.config.pointsPerReferral} pt</span>
                        <div style="font-size:11px;margin-top:4px">${status}</div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Spin the wheel (always lands on "Try Again")
     */
    spinWheel() {
        if (this.state.isSpinning) return;
        
        const availableSpins = Math.floor(this.state.points / this.config.pointsPerSpin) - this.state.spinsUsed;
        if (availableSpins <= 0) {
            this.showToast('❌ Not enough points to spin!');
            return;
        }

        this.state.isSpinning = true;
        const wheel = document.getElementById('wheel');
        const spinBtn = document.getElementById('spin-btn');
        
        // Disable button during spin
        spinBtn.disabled = true;
        spinBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Spinning...';

        // Find "Try Again" segment index (there are two, pick one randomly)
        const tryAgainIndices = this.config.wheelSegments
            .map((seg, idx) => seg.name === 'Try Again' ? idx : -1)
            .filter(idx => idx !== -1);
        const targetIndex = tryAgainIndices[Math.floor(Math.random() * tryAgainIndices.length)];
        
        const segmentAngle = 360 / this.config.wheelSegments.length;
        // Calculate rotation to land on target segment at top (pointer position)
        // Pointer is at top (0deg), segments rotate clockwise
        const segmentCenter = (targetIndex * segmentAngle) + (segmentAngle / 2);
        const targetRotation = 360 - segmentCenter;
        
        // Add multiple full rotations for effect (5-8 rotations)
        const fullRotations = 5 + Math.floor(Math.random() * 4);
        const totalRotation = (fullRotations * 360) + targetRotation;

        // Apply spin animation
        wheel.classList.add('spinning');
        wheel.style.transform = `rotate(${totalRotation}deg)`;

        // After animation completes
        setTimeout(() => {
            wheel.classList.remove('spinning');
            this.state.isSpinning = false;
            
            // Deduct points and increment spins used
            this.state.points -= this.config.pointsPerSpin;
            this.state.spinsUsed += 1;
            this.saveReferralData();
            
            // Show result modal (always "Try Again")
            this.showResultModal('Try Again', false);
            
            // Update UI
            this.updateUI();
            
        }, 4000); // Match CSS transition duration
    },

    /**
     * Show result modal
     */
    showResultModal(prize, isWinner) {
        const modal = document.getElementById('result-modal');
        const title = document.getElementById('modal-title');
        const icon = document.getElementById('result-icon');
        const prizeEl = document.getElementById('result-prize');
        const message = document.getElementById('result-message');
        const submessage = document.getElementById('result-submessage');
        const contactBtn = document.getElementById('contact-support-btn');

        if (prize === 'Try Again') {
            title.textContent = '🎲 Better Luck Next Time!';
            icon.textContent = '🔄';
            prizeEl.textContent = 'Try Again';
            message.innerHTML = `You won: <strong>Try Again</strong>`;
            submessage.textContent = 'Keep sharing your referral link to earn more spins!';
            contactBtn.style.display = 'inline-flex';
            contactBtn.href = this.config.whatsappSupport;
        } else {
            title.textContent = '🎉 Congratulations!';
            icon.textContent = '🎁';
            prizeEl.textContent = prize;
            message.innerHTML = `You won: <strong>${prize}</strong>`;
            submessage.textContent = 'Your reward has been added to your account!';
            contactBtn.style.display = 'none';
        }

        modal.classList.remove('hidden');
    },

    /**
     * Close result modal
     */
    closeModal() {
        document.getElementById('result-modal')?.classList.add('hidden');
    },

    /**
     * Show toast notification
     */
    showToast(message) {
        const toast = document.getElementById('notification-toast');
        if (toast) {
            toast.querySelector('span').textContent = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ReferralSystem.init();
    
    // If APP object exists (from script.js), update greeting
    if (typeof APP !== 'undefined' && APP.updateGreetingUI) {
        APP.updateGreetingUI();
    }
});
