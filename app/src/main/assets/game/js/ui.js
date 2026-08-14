/**
 * Desi Offroad — UI & Input Controller
 * Orchestrates HUD instruments, minimap rendering, screen routing,
 * touch & keyboard control bindings, garage tuning, and modal dialogs.
 */
class DesiUI {
    constructor() {
        this.currentScreen = 'screen-loading';
        this.inputState = {
            throttle: 0,
            brakeReverse: 0,
            steerLeft: false,
            steerRight: false,
            handbrake: false
        };
        this.minimapCtx = null;
        this.largeMapCtx = null;
        this.init();
    }

    init() {
        this.setupMinimapCanvas();
        this.bindTouchControls();
        this.bindKeyboardControls();
        this.bindScreenNavigation();
    }

    setupMinimapCanvas() {
        const miniCanvas = document.getElementById('minimap-canvas');
        if (miniCanvas) this.minimapCtx = miniCanvas.getContext('2d');
        const largeCanvas = document.getElementById('large-map-canvas');
        if (largeCanvas) this.largeMapCtx = largeCanvas.getContext('2d');
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen-layer').forEach(layer => {
            layer.classList.add('hidden');
        });
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.remove('hidden');
            this.currentScreen = screenId;
        }
        window.DesiAudio?.playButtonClick();
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('hidden');
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('hidden');
    }

    showToast(message, durationMs = 2600) {
        const toast = document.getElementById('game-toast');
        if (toast) {
            toast.textContent = message;
            toast.classList.remove('hidden');
            clearTimeout(this.toastTimeout);
            this.toastTimeout = setTimeout(() => {
                toast.classList.add('hidden');
            }, durationMs);
        }
    }

    bindTouchControls() {
        const addTouchHandler = (elemId, onPress, onRelease) => {
            const btn = document.getElementById(elemId);
            if (!btn) return;

            const handleDown = (e) => {
                e.preventDefault();
                btn.classList.add('active');
                onPress();
                window.DesiBackend?.triggerHaptic('click');
            };

            const handleUp = (e) => {
                e.preventDefault();
                btn.classList.remove('active');
                onRelease();
            };

            btn.addEventListener('touchstart', handleDown, { passive: false });
            btn.addEventListener('touchend', handleUp, { passive: false });
            btn.addEventListener('touchcancel', handleUp, { passive: false });
            btn.addEventListener('mousedown', handleDown);
            btn.addEventListener('mouseup', handleUp);
            btn.addEventListener('mouseleave', handleUp);
        };

        // Steering
        addTouchHandler('btn-steer-left', () => this.inputState.steerLeft = true, () => this.inputState.steerLeft = false);
        addTouchHandler('btn-steer-right', () => this.inputState.steerRight = true, () => this.inputState.steerRight = false);

        // Pedals
        addTouchHandler('btn-accelerate', () => this.inputState.throttle = 1.0, () => this.inputState.throttle = 0);
        addTouchHandler('btn-brake-reverse', () => this.inputState.brakeReverse = 1.0, () => this.inputState.brakeReverse = 0);
        addTouchHandler('btn-handbrake', () => this.inputState.handbrake = true, () => this.inputState.handbrake = false);

        // Quick Toggles
        const hornBtn = document.getElementById('btn-horn');
        if (hornBtn) {
            hornBtn.addEventListener('click', () => {
                window.DesiAudio?.playDesiHorn();
                window.DesiBackend?.triggerHaptic('horn');
            });
        }

        const resetBtn = document.getElementById('btn-reset-car');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                window.gameEngine?.recoverVehicle();
                this.showToast('Vehicle recovered to nearest safe track!');
            });
        }

        const modeBtn = document.getElementById('btn-4x4-toggle');
        if (modeBtn) {
            modeBtn.addEventListener('click', () => {
                window.gameEngine?.toggle4x4Mode();
            });
        }
    }

    bindKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            if (this.currentScreen !== 'game-hud') return;
            switch (e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.inputState.throttle = 1.0;
                    break;
                case 's':
                case 'arrowdown':
                    this.inputState.brakeReverse = 1.0;
                    break;
                case 'a':
                case 'arrowleft':
                    this.inputState.steerLeft = true;
                    break;
                case 'd':
                case 'arrowright':
                    this.inputState.steerRight = true;
                    break;
                case ' ':
                    this.inputState.handbrake = true;
                    break;
                case 'h':
                    window.DesiAudio?.playDesiHorn();
                    break;
                case 'c':
                    window.gameEngine?.cycleCamera();
                    break;
                case 'l':
                    window.gameEngine?.toggleHeadlights();
                    break;
                case 'r':
                    window.gameEngine?.recoverVehicle();
                    break;
                case 'm':
                    this.showScreen('screen-map');
                    break;
                case 'p':
                case 'escape':
                    this.showModal('modal-pause');
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.inputState.throttle = 0;
                    break;
                case 's':
                case 'arrowdown':
                    this.inputState.brakeReverse = 0;
                    break;
                case 'a':
                case 'arrowleft':
                    this.inputState.steerLeft = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.inputState.steerRight = false;
                    break;
                case ' ':
                    this.inputState.handbrake = false;
                    break;
            }
        });
    }

    bindScreenNavigation() {
        // Main Menu Navigation
        document.getElementById('btn-menu-play')?.addEventListener('click', () => {
            window.gameEngine?.startDriving();
            this.showScreen('game-hud');
        });
        document.getElementById('btn-menu-garage')?.addEventListener('click', () => {
            window.gameEngine?.openGarage();
            this.showScreen('screen-garage');
        });
        document.getElementById('btn-menu-missions')?.addEventListener('click', () => {
            this.populateMissionsList();
            this.showScreen('screen-missions');
        });
        document.getElementById('btn-menu-map')?.addEventListener('click', () => {
            this.showScreen('screen-map');
        });
        document.getElementById('btn-menu-leaderboard')?.addEventListener('click', () => {
            this.populateLeaderboard();
            this.showScreen('screen-leaderboard');
        });
        document.getElementById('btn-menu-profile')?.addEventListener('click', () => {
            this.populateProfile();
            this.showScreen('screen-profile');
        });
        document.getElementById('btn-menu-shop')?.addEventListener('click', () => {
            this.showScreen('screen-shop');
        });
        document.getElementById('btn-menu-settings')?.addEventListener('click', () => {
            this.showScreen('screen-settings');
        });

        // Back Buttons
        document.getElementById('btn-garage-back')?.addEventListener('click', () => {
            window.gameEngine?.exitGarage();
            this.showScreen('screen-main-menu');
        });
        document.getElementById('btn-missions-back')?.addEventListener('click', () => this.showScreen('screen-main-menu'));
        document.getElementById('btn-map-back')?.addEventListener('click', () => {
            if (window.gameEngine?.isDriving) this.showScreen('game-hud');
            else this.showScreen('screen-main-menu');
        });
        document.getElementById('btn-leaderboard-back')?.addEventListener('click', () => this.showScreen('screen-main-menu'));
        document.getElementById('btn-profile-back')?.addEventListener('click', () => this.showScreen('screen-main-menu'));
        document.getElementById('btn-shop-back')?.addEventListener('click', () => this.showScreen('screen-main-menu'));
        document.getElementById('btn-settings-back')?.addEventListener('click', () => this.showScreen('screen-main-menu'));

        // HUD mini actions
        document.getElementById('btn-hud-map')?.addEventListener('click', () => this.showScreen('screen-map'));
        document.getElementById('btn-hud-cam')?.addEventListener('click', () => window.gameEngine?.cycleCamera());
        document.getElementById('btn-hud-pause')?.addEventListener('click', () => this.showModal('modal-pause'));

        // Pause Modal Actions
        document.getElementById('btn-resume-game')?.addEventListener('click', () => this.hideModal('modal-pause'));
        document.getElementById('btn-pause-restart')?.addEventListener('click', () => {
            this.hideModal('modal-pause');
            window.gameEngine?.recoverVehicle(0, 0);
        });
        document.getElementById('btn-pause-settings')?.addEventListener('click', () => {
            this.hideModal('modal-pause');
            this.showScreen('screen-settings');
        });
        document.getElementById('btn-pause-quit')?.addEventListener('click', () => {
            this.hideModal('modal-pause');
            window.gameEngine?.stopDriving();
            this.showScreen('screen-main-menu');
        });

        // Victory Modal
        document.getElementById('btn-victory-continue')?.addEventListener('click', () => {
            this.hideModal('modal-mission-complete');
            this.showScreen('screen-main-menu');
        });

        // Game Over Modal
        document.getElementById('btn-gameover-respawn')?.addEventListener('click', () => {
            this.hideModal('modal-game-over');
            window.gameEngine?.recoverVehicle(0, 0);
            this.showScreen('game-hud');
        });
        document.getElementById('btn-gameover-menu')?.addEventListener('click', () => {
            this.hideModal('modal-game-over');
            window.gameEngine?.stopDriving();
            this.showScreen('screen-main-menu');
        });

        // Test Drive button in Garage
        document.getElementById('btn-test-drive')?.addEventListener('click', () => {
            window.gameEngine?.exitGarage();
            window.gameEngine?.startDriving();
            this.showScreen('game-hud');
        });

        // Garage Tabs
        document.getElementById('tab-btn-upgrades')?.addEventListener('click', () => {
            document.getElementById('tab-btn-upgrades').classList.add('active');
            document.getElementById('tab-btn-custom').classList.remove('active');
            document.getElementById('tab-content-upgrades').classList.add('active');
            document.getElementById('tab-content-custom').classList.remove('active');
        });
        document.getElementById('tab-btn-custom')?.addEventListener('click', () => {
            document.getElementById('tab-btn-custom').classList.add('active');
            document.getElementById('tab-btn-upgrades').classList.remove('active');
            document.getElementById('tab-content-custom').classList.add('active');
            document.getElementById('tab-content-upgrades').classList.remove('active');
        });

        // Fast travel
        document.getElementById('btn-map-teleport')?.addEventListener('click', () => {
            window.gameEngine?.recoverVehicle(0, 0);
            this.showToast('Fast traveled to Village Hub!');
            if (window.gameEngine?.isDriving) this.showScreen('game-hud');
            else this.showScreen('screen-main-menu');
        });

        // Shop purchase handlers
        document.querySelectorAll('.btn-buy-shop').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const item = btn.getAttribute('data-item');
                const cost = parseInt(btn.getAttribute('data-cost') || '0');
                const user = await window.DesiBackend.getProfile();
                if (cost > 0 && user.coins < cost) {
                    this.showToast('Not enough coins!');
                    return;
                }
                if (item === 'fuel') {
                    window.gameEngine?.physics && (window.gameEngine.physics.fuel = 100);
                    this.showToast('Fuel tank 100% refilled!');
                } else if (item === 'repair') {
                    window.gameEngine?.physics && (window.gameEngine.physics.health = 100);
                    this.showToast('Vehicle 100% repaired!');
                } else if (item === 'coinpack') {
                    user.coins += 2500;
                    this.showToast('Claimed Sardar\'s gift of 2,500 Coins!');
                }
                this.updateCurrencyHeader();
            });
        });
    }

    async updateCurrencyHeader() {
        const user = await window.DesiBackend.getProfile();
        if (!user) return;
        const fmt = user.coins.toLocaleString();
        ['hud-coins-val', 'menu-coins-val', 'garage-coins-val', 'missions-coins-val', 'shop-coins-val'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = fmt;
        });
        const userEl = document.getElementById('menu-username');
        if (userEl) userEl.textContent = user.username;
        const lvlEl = document.getElementById('menu-level-badge');
        if (lvlEl) lvlEl.textContent = 'LVL ' + user.level;
    }

    populateMissionsList() {
        const container = document.getElementById('missions-list-container');
        if (!container) return;
        const list = DesiMissionManager.getMissionList();
        container.innerHTML = '';

        list.forEach(m => {
            const card = document.createElement('div');
            card.className = 'mission-card glass-panel';
            card.innerHTML = `
                <div class="mission-type-tag">${m.type} • ${m.difficulty}</div>
                <div class="mission-card-title">${m.title}</div>
                <div class="mission-card-desc">${m.description}</div>
                <div class="mission-rewards-row">
                    <span>🪙 +${m.coinsReward}</span>
                    <span>⚡ +${m.xpReward} XP</span>
                    <span>⏱️ ${m.timeLimitSeconds}s</span>
                </div>
                <button class="desi-btn btn-primary-play btn-start-mission" data-mission-id="${m.id}">START MISSION</button>
            `;
            container.appendChild(card);
        });

        container.querySelectorAll('.btn-start-mission').forEach(btn => {
            btn.addEventListener('click', () => {
                const missionId = btn.getAttribute('data-mission-id');
                window.gameEngine?.startMission(missionId);
                this.showScreen('game-hud');
            });
        });
    }

    async populateLeaderboard(isWeekly = false) {
        const container = document.getElementById('leaderboard-rows-container');
        if (!container) return;
        container.innerHTML = '<div class="table-row">Loading village rankings...</div>';
        const list = await window.DesiBackend.getLeaderboard(isWeekly);
        container.innerHTML = '';

        list.forEach((entry, idx) => {
            const row = document.createElement('div');
            row.className = 'table-row' + (entry.username === 'DesiRider_007' ? ' highlight' : '');
            row.innerHTML = `
                <span class="rank-badge">#${entry.rank || (idx + 1)}</span>
                <span><b>${entry.username}</b><br><small style="color:var(--text-muted)">${entry.vehicleName || 'Thar 4x4'}</small></span>
                <span>LVL ${entry.level}</span>
                <span>${entry.bestTime ? entry.bestTime.toFixed(1) + 's' : '--'}</span>
                <span style="color:#FFD54F"><b>${(entry.score || 0).toLocaleString()}</b></span>
            `;
            container.appendChild(row);
        });
    }

    async populateProfile() {
        const user = await window.DesiBackend.getProfile();
        if (!user) return;
        document.getElementById('prof-username').textContent = user.username;
        document.getElementById('prof-email').textContent = user.email || 'desirider@village.in';
        document.getElementById('prof-level-txt').textContent = `Level ${user.level} Desi Offroader`;
        document.getElementById('prof-coins-stat').textContent = user.coins.toLocaleString();
        document.getElementById('prof-rep-stat').textContent = user.reputation;

        const xpPct = ((user.xp % 500) / 500) * 100;
        document.getElementById('prof-xp-fill').style.width = xpPct + '%';
    }

    updateHUD(physics, missionState, weather) {
        if (!physics) return;

        // Speedometer & RPM
        const speedVal = Math.round(Math.abs(physics.speed));
        document.getElementById('hud-speed-val').textContent = speedVal;
        const rpmPct = Math.min(100, Math.max(5, (physics.rpm / 6000) * 100));
        document.getElementById('hud-rpm-fill').style.width = rpmPct + '%';

        // Fuel & Health Bars
        const fuelPct = Math.round(physics.fuel);
        document.getElementById('hud-fuel-fill').style.width = fuelPct + '%';
        document.getElementById('hud-fuel-pct').textContent = fuelPct + '%';

        const healthPct = Math.round(physics.health);
        document.getElementById('hud-health-fill').style.width = healthPct + '%';
        document.getElementById('hud-health-pct').textContent = healthPct + '%';

        document.getElementById('hud-gear-label').textContent = physics.gear;
        document.getElementById('hud-weather-badge').textContent = (weather === 'RAIN' ? '🌧️ RAIN' : weather === 'FOG' ? '🌫️ FOG' : '☀️ SUNNY');

        // Mission Floating HUD Banner
        const banner = document.getElementById('hud-mission-banner');
        if (missionState && missionState.status === 'IN_PROGRESS') {
            banner.classList.remove('hidden');
            const mins = Math.floor(missionState.timeRemaining / 60);
            const secs = Math.floor(missionState.timeRemaining % 60);
            document.getElementById('hud-mission-timer').textContent =
                `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            if (missionState.checkpoint) {
                document.getElementById('hud-mission-desc').textContent = 'Next: ' + missionState.checkpoint.label;
            }
        } else {
            banner.classList.add('hidden');
        }

        // Render Minimap Radar
        this.renderMinimap(physics.position, physics.yaw, missionState?.checkpoint);
    }

    renderMinimap(playerPos, playerYaw, checkpoint) {
        if (!this.minimapCtx) return;
        const ctx = this.minimapCtx;
        const w = 130, h = 130;
        ctx.clearRect(0, 0, w, h);

        // Circular background
        ctx.fillStyle = '#1A1410';
        ctx.fillRect(0, 0, w, h);

        const centerX = w / 2;
        const centerY = h / 2;
        const scale = 0.45; // pixels per world meter

        // Draw River Channel
        ctx.fillStyle = '#0288D1';
        const riverX = centerX + (55 - playerPos.x) * scale;
        ctx.fillRect(riverX - 8, 0, 16, h);

        // Draw Village Hub Dot
        const hubX = centerX + (0 - playerPos.x) * scale;
        const hubY = centerY + (0 - playerPos.z) * scale;
        ctx.fillStyle = '#FFB300';
        ctx.beginPath();
        ctx.arc(hubX, hubY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw Active Checkpoint Target Beacon
        if (checkpoint) {
            const cpX = centerX + (checkpoint.x - playerPos.x) * scale;
            const cpY = centerY + (checkpoint.z - playerPos.z) * scale;
            ctx.fillStyle = '#00E676';
            ctx.beginPath();
            ctx.arc(cpX, cpY, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw Player Arrow at Center
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-playerYaw);
        ctx.fillStyle = '#FF3D00';
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(5, 6);
        ctx.lineTo(0, 3);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

window.DesiUI = DesiUI;
