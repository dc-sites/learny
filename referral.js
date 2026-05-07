/**
 * Learny Referral System
 * Handles referral tracking, points, and lucky wheel
 */

const ReferralSystem = {
    // Configuration
    config: {
        baseUrl: 'https://www.learny.study',
        pointsPerReferral: 1,
        pointsPerSpin: 2,
        whatsappSupport: 'https://wa.me/764720488',
        storageKey: 'learny_referrals',
        userStorageKey: 'learny_user_id'
    },

    // State
    state: {
        userId: null,
        referralData: null,
        isSpinning: false,
        wheelSegments: [
            { label: 'Lifetime Premium', color: '#ffd700', textColor: '#000' },
            { label: 'Try Again', color: '#64748b', textColor: '#fff' },
            { label: 'One Year Premium', color: '#c0c0c0', textColor: '#000' },
            { label: 'Try Again', color: '#475569', textColor: '#fff' },
            { label: 'One Month Premium', color: '#cd7f32', textColor: '#fff' }
        ]
    },

    // Initialize
    init() {
        this.generateOrGetUserId();
        this.loadReferralData();
        this.checkReferralParam();
        this.renderUI();
        this.bindEvents();
        this.drawWheel();
        this.updateSpinButton();
    },

    // Generate or retrieve user ID
    generateOrGetUserId() {
        let userId = localStorage.getItem(this.config.userStorageKey);
        if (!userId) {
            userId = 'USR_' + Math.random().toString(36).substr(2, 9).toUpperCase();
            localStorage.setItem(this.config.userStorageKey, userId);
        }
        this.state.userId = userId;
    },

    // Load referral data from storage
    loadReferralData() {
        const stored = localStorage.getItem(this.config.storageKey);
        if (stored) {
            this.state.referralData = JSON.parse(stored);
        } else {
            this.state.referralData = {
                userId: this.state.userId,
                points: 0,
                referrals: [],
                spinsUsed: 0,
                lastSpinDate: null
            };
            this.saveReferralData();
        }
    },

    // Save referral data to storage
    saveReferralData() {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.state.referralData));
    },

    // Check URL for referral parameter and credit referrer
    checkReferralParam() {
        const urlParams = new URLSearchParams(window.location.search);
        const referrerId = urlParams.get('ref');
        
        if (referrerId && referrerId !== this.state.userId) {
            // Check if this is a new user (first visit)
            const hasInstalled = sessionStorage.getItem('learny_apk_installed');
            
            if (!hasInstalled) {
                // Mark that user has been referred (prevent duplicate credits)
                sessionStorage.setItem('learny_referred_by', referrerId);
            }
        }
    },

    // This function should be called from index.html when APK install button is clicked
    // Add this to your existing script.js or call it from index.html
    creditReferral() {
        const referrerId = sessionStorage.getItem('learny_referred_by');
        const hasInstalled = sessionStorage.getItem('learny_apk_installed');
        
        if (referrerId && !hasInstalled) {
            // Load referrer's data
            const allReferrals = JSON.parse(localStorage.getItem(this.config.storageKey + '_all') || '{}');
            const referrerData = allReferrals[referrerId] || {
                userId: referrerId,
                points: 0,
                referrals: [],
                spinsUsed: 0
            };
            
            // Check if this referral already exists
            const currentUserId = localStorage.getItem(this.config.userStorageKey);
            const alreadyReferred = referrerData.referrals.some(r => r.referredUserId === currentUserId);
            
            if (!alreadyReferred) {
                // Credit the referrer
                referrerData.points += this.config.pointsPerReferral;
                referrerData.referrals.push({
                    referredUserId: currentUserId,
                    date: new Date().toISOString(),
                    status: 'completed'
                });
                
                // Save updated data
                allReferrals[referrerId] = referrerData;
                localStorage.setItem(this.config.storageKey + '_all', JSON.stringify(allReferrals));
                
                // Show toast to new user (optional)
                this.showToast('Thanks for installing! Your referrer earned a point. 🎉');
            }
            
            // Mark as installed to prevent duplicate credits
            sessionStorage.setItem('learny_apk_installed', 'true');
            return true;
        }
        return false;
    },

    // Render UI elements
    renderUI() {
        // Update referral link
        const linkInput = document.getElementById('referral-link-input');
        if (linkInput) {
            linkInput.value = `${this.config.baseUrl}?ref=${this.state.userId}`;
        }

        // Update stats
        document.getElementById('referral-count').textContent = this.state.referralData.referrals.length;
        document.getElementById('referral-points').textContent = this.state.referralData.points;
        document.getElementById('available-spins').textContent = Math.floor(this.state.referralData.points / this.config.pointsPerSpin);

        // Update sidebar username
        const sidebarName = document.getElementById('sidebar-username');
        if (sidebarName) {
            sidebarName.textContent = `${this.state.userId}!`;
        }

        // Render referral history
        this.renderHistory();
    },

    // Render referral history table
    renderHistory() {
        const tbody = document.getElementById('referral-history-body');
        if (!tbody) return;

        const referrals = this.state.referralData.referrals;
        
        if (referrals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No referrals yet. Start sharing your link!</td></tr>';
            return;
        }

        tbody.innerHTML = referrals.slice().reverse().map(ref => {
            const date = new Date(ref.date).toLocaleDateString();
            const shortId = ref.referredUserId ? ref.referredUserId.slice(0, 10) + '...' : 'Anonymous';
            return `
                <tr>
                    <td>${date}</td>
                    <td>${shortId}</td>
                    <td><span class="status-badge completed">Completed</span></td>
                    <td>+${this.config.pointsPerReferral}</td>
                </tr>
            `;
        }).join('');
    },

    // Draw the wheel on canvas
    drawWheel(rotation = 0) {
        const canvas = document.getElementById('wheel-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const segments = this.state.wheelSegments;
        const arcSize = (2 * Math.PI) / segments.length;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw segments
        segments.forEach((segment, index) => {
            const startAngle = index * arcSize + rotation;
            const endAngle = startAngle + arcSize;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();

            // Fill segment
            ctx.fillStyle = segment.color;
            ctx.fill();

            // Draw border
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + arcSize / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = segment.textColor;
            ctx.font = 'bold 11px Inter, sans-serif';
            
            // Wrap text for longer labels
            const label = segment.label;
            const words = label.split(' ');
            let textY = radius - 25;
            
            words.forEach((word, i) => {
                ctx.fillText(word, radius - 35, textY + (i * 12));
            });
            
            ctx.restore();
        });

        // Draw outer border
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 4;
        ctx.stroke();
    },

    // Spin the wheel (always lands on "Try Again")
    spinWheel() {
        if (this.state.isSpinning) return;
        if (this.state.referralData.points < this.config.pointsPerSpin) {
            this.showToast('Not enough points! You need 2 points to spin.');
            return;
        }

        this.state.isSpinning = true;
        const spinBtn = document.getElementById('spin-btn');
        const canvas = document.getElementById('wheel-canvas');
        
        if (spinBtn) {
            spinBtn.disabled = true;
            spinBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Spinning...';
        }

        // Deduct points
        this.state.referralData.points -= this.config.pointsPerSpin;
        this.state.referralData.spinsUsed++;
        this.state.referralData.lastSpinDate = new Date().toISOString();
        this.saveReferralData();

        // Calculate rotation to land on "Try Again" (index 1 or 3)
        // Segment 1: "Try Again" at index 1 (position: 72° to 144°)
        // We want the pointer (top/0°) to land on this segment
        const tryAgainIndex = 1; // Always land on first "Try Again"
        const arcSize = (2 * Math.PI) / this.state.wheelSegments.length;
        const segmentCenter = (tryAgainIndex * arcSize) + (arcSize / 2);
        
        // Calculate target rotation (multiple full spins + land on target)
        const fullSpins = 5 + Math.random() * 3; // 5-8 full rotations
        const targetRotation = (fullSpins * 2 * Math.PI) + (2 * Math.PI - segmentCenter);
        
        // Animation
        const duration = 4000; // 4 seconds
        const startTime = performance.now();
        const startRotation = 0;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth deceleration
            const easeOut = 1 - Math.pow(1 - progress, 4);
            const currentRotation = startRotation + (targetRotation * easeOut);
            
            this.drawWheel(currentRotation);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Spin complete
                this.state.isSpinning = false;
                this.drawWheel(targetRotation);
                
                // Update UI
                this.renderUI();
                this.updateSpinButton();
                
                // Show result modal after brief delay
                setTimeout(() => {
                    this.showResultModal();
                }, 500);

                // Reset button
                if (spinBtn) {
                    spinBtn.disabled = false;
                    spinBtn.innerHTML = '<i class="fa fa-play"></i> Spin Wheel (2 Points)';
                }
            }
        };

        requestAnimationFrame(animate);
    },

    // Show the result modal (always "Try Again")
    showResultModal() {
        const modal = document.getElementById('result-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    },

    // Close result modal
    closeResultModal() {
        const modal = document.getElementById('result-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    // Update spin button state
    updateSpinButton() {
        const btn = document.getElementById('spin-btn');
        const msg = document.getElementById('spin-message');
        const availableSpins = Math.floor(this.state.referralData.points / this.config.pointsPerSpin);

        if (btn) {
            btn.disabled = availableSpins < 1 || this.state.isSpinning;
        }

        if (msg) {
            if (availableSpins >= 1) {
                msg.textContent = `You have ${availableSpins} spin${availableSpins > 1 ? 's' : ''} available!`;
                msg.classList.add('earned');
            } else {
                const needed = this.config.pointsPerSpin - this.state.referralData.points;
                msg.textContent = `Earn ${needed} more point${needed > 1 ? 's' : ''} to unlock a spin!`;
                msg.classList.remove('earned');
            }
        }
    },

    // Copy referral link to clipboard
    copyReferralLink() {
        const input = document.getElementById('referral-link-input');
        if (input) {
            input.select();
            input.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(input.value).then(() => {
                this.showToast('Referral link copied to clipboard! 📋');
            }).catch(() => {
                this.showToast('Failed to copy link');
            });
        }
    },

    // Share referral link
    shareReferralLink() {
        const link = `${this.config.baseUrl}?ref=${this.state.userId}`;
        const text = `🎓 Join Learny and boost your studies!\n🔗 ${link}\n\nUse my referral link and help me earn rewards!`;

        if (navigator.share) {
            navigator.share({
                title: 'Join Learny',
                text: text,
                url: link
            }).catch(() => {});
        } else {
            this.copyReferralLink();
        }
    },

    // Show toast notification
    showToast(message) {
        const toast = document.getElementById('referral-toast');
        const toastMsg = document.getElementById('toast-message');
        
        if (toast && toastMsg) {
            toastMsg.textContent = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    },

    // Bind event listeners
    bindEvents() {
        // Copy referral link
        document.getElementById('copy-referral-btn')?.addEventListener('click', () => {
            this.copyReferralLink();
        });

        // Share referral link
        document.getElementById('share-referral-btn')?.addEventListener('click', () => {
            this.shareReferralLink();
        });

        // Spin wheel button
        document.getElementById('spin-btn')?.addEventListener('click', () => {
            this.spinWheel();
        });

        // Close modal
        document.getElementById('close-modal')?.addEventListener('click', () => {
            this.closeResultModal();
        });

        // Close modal on overlay click
        document.getElementById('result-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'result-modal') {
                this.closeResultModal();
            }
        });

        // Theme toggle (reuse from main app)
        document.querySelectorAll('.theme-toggle').forEach(btn => {
            btn.onclick = () => {
                const isDark = !document.body.classList.contains('light');
                document.body.classList.toggle('light', !isDark);
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = isDark ? 'fa fa-sun' : 'fa fa-moon';
                }
            };
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ReferralSystem.init();
});

// Export function for use in index.html (APK install button)
window.LearnyReferral = {
    creditReferral: () => ReferralSystem.creditReferral()
};
