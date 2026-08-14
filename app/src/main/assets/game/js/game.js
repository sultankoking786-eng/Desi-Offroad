/**
 * Desi Offroad — Core Game Engine Controller
 * Initializes Three.js WebGL, game loop, camera systems (3rd, Close, Hood, Cockpit),
 * Day/Night transitions, garage showroom, and mission progression.
 */
class DesiGameEngine {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = null;

        this.world = null;
        this.vehicleMesh = null;
        this.physics = null;
        this.missions = null;
        this.ui = null;

        this.isDriving = false;
        this.isGarageMode = false;
        this.currentVehicleId = 'thar_4x4';
        this.currentVehicleConfig = {};
        this.cameraMode = 0; // 0: 3rd Chase, 1: Close, 2: Hood, 3: Cockpit
        this.cameraModes = ['3RD', 'CLOSE', 'HOOD', 'COCKPIT'];

        this.camShake = 0;
        this.garageAngle = 0;

        this.init();
    }

    async init() {
        this.ui = new DesiUI();
        window.desiUI = this.ui;

        // Initialize Three.js WebGL Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
        this.camera.position.set(0, 10, -15);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();

        window.addEventListener('resize', () => this.onWindowResize());

        // Build Indian Village World
        this.world = new DesiWorld(this.scene);
        this.missions = new DesiMissionManager(this.scene, this.world);

        // Load Player Profile & Vehicle
        const user = await window.DesiBackend.getProfile();
        this.currentVehicleId = user.currentVehicleId || 'thar_4x4';
        const vehicles = await window.DesiBackend.getVehicles(user.id);
        const activeVeh = vehicles.find(v => v.vehicleId === this.currentVehicleId) || vehicles[0];
        this.currentVehicleConfig = activeVeh || {};

        // Spawn Default Vehicle
        this.spawnVehicle(this.currentVehicleId, this.currentVehicleConfig);

        // Update UI
        await this.ui.updateCurrencyHeader();

        // Finish Loading
        setTimeout(() => {
            const fill = document.getElementById('loading-bar-fill');
            if (fill) fill.style.width = '100%';
            setTimeout(() => {
                this.ui.showScreen('screen-main-menu');
            }, 500);
        }, 1200);

        // Start Animation Loop
        this.animate();
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    spawnVehicle(vehicleId, config = {}) {
        if (this.vehicleMesh) {
            this.scene.remove(this.vehicleMesh);
        }

        const defs = DesiVehicleFactory.getVehicleDefinitions();
        const def = defs[vehicleId] || defs.thar_4x4;
        this.vehicleMesh = DesiVehicleFactory.buildVehicle(vehicleId, config);
        this.scene.add(this.vehicleMesh);

        this.physics = new DesiVehiclePhysics(this.world, def, config);
        this.physics.reset(0, 0);

        const nameEl = document.getElementById('menu-current-veh-name');
        if (nameEl) nameEl.textContent = def.name;
    }

    startDriving() {
        this.isDriving = true;
        this.isGarageMode = false;
        window.DesiAudio?.startEngine();
    }

    stopDriving() {
        this.isDriving = false;
        window.DesiAudio?.stopEngine();
    }

    openGarage() {
        this.isGarageMode = true;
        this.isDriving = false;
        window.DesiAudio?.stopEngine();
        this.populateGarageData();
    }

    exitGarage() {
        this.isGarageMode = false;
    }

    cycleCamera() {
        this.cameraMode = (this.cameraMode + 1) % 4;
        const label = document.getElementById('cam-mode-label');
        if (label) label.textContent = this.cameraModes[this.cameraMode];
        this.ui.showToast(`Camera: ${this.cameraModes[this.cameraMode]}`);
    }

    toggleHeadlights() {
        if (!this.vehicleMesh) return;
        const spot = this.vehicleMesh.userData.spotLight;
        if (spot) {
            spot.visible = !spot.visible;
            this.ui.showToast(spot.visible ? 'Headlights: ON' : 'Headlights: OFF');
        }
    }

    toggle4x4Mode() {
        if (!this.physics) return;
        if (this.physics.gear === '4H') {
            this.physics.gear = '4L';
            this.ui.showToast('4x4 LOW GEAR (High Torque Mud/Rock Climb)');
        } else if (this.physics.gear === '4L') {
            this.physics.gear = '2H';
            this.ui.showToast('2H HIGHWAY DRIVE (High Speed)');
        } else {
            this.physics.gear = '4H';
            this.ui.showToast('4x4 ALL-TERRAIN AWD');
        }
        document.getElementById('hud-gear-label').textContent = this.physics.gear;
    }

    recoverVehicle(x = 0, z = 0) {
        if (this.physics) {
            this.physics.reset(x, z);
        }
    }

    startMission(missionId) {
        this.startDriving();
        const m = this.missions.startMission(missionId);
        if (m) {
            this.recoverVehicle(m.startPos.x, m.startPos.z);
            this.ui.showToast(`Mission Started: ${m.title}`);
        }
    }

    async handleMissionComplete(result) {
        const user = await window.DesiBackend.getProfile();
        await window.DesiBackend.completeMission(
            user.id,
            result.mission.id,
            result.timeTaken,
            result.damageTaken,
            result.coins,
            result.xp
        );

        // Update Victory Modal
        document.getElementById('victory-time-val').textContent = result.timeTaken.toFixed(1) + 's';
        document.getElementById('victory-damage-val').textContent = Math.round(result.damageTaken) + '%';
        document.getElementById('victory-coins-val').textContent = result.coins.toLocaleString();
        document.getElementById('victory-xp-val').textContent = result.xp.toLocaleString();

        this.ui.showModal('modal-mission-complete');
        await this.ui.updateCurrencyHeader();
    }

    populateGarageData() {
        const defs = DesiVehicleFactory.getVehicleDefinitions();
        const def = defs[this.currentVehicleId];
        if (!def) return;

        document.getElementById('garage-veh-name').textContent = def.name;
        document.getElementById('garage-veh-type').textContent = def.type;

        // Populate Upgrades List
        const listContainer = document.getElementById('upgrades-list-container');
        if (!listContainer) return;
        listContainer.innerHTML = '';

        const upgradeCategories = [
            { id: 'engine', name: '⚡ Off-Road Engine Power', key: 'engineUpgrade', cost: 600 },
            { id: 'transmission', name: '⚙️ Heavy-Duty 4x4 Gearbox', key: 'transmissionUpgrade', cost: 500 },
            { id: 'suspension', name: '🚜 Long-Travel Suspension', key: 'suspensionUpgrade', cost: 450 },
            { id: 'tires', name: '🛞 Mud-Terrain Deep Tread Tires', key: 'tiresUpgrade', cost: 550 },
            { id: 'brakes', name: '🛑 High-Bite Ceramic Brakes', key: 'brakesUpgrade', cost: 400 },
            { id: 'difflock', name: '🔒 4x4 Differential Lock', key: 'diffLockUpgrade', cost: 700 }
        ];

        upgradeCategories.forEach(cat => {
            const currentLvl = this.currentVehicleConfig[cat.key] || 1;
            const cost = cat.cost * currentLvl;
            const isMax = currentLvl >= 5;

            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.innerHTML = `
                <div class="upg-info">
                    <div class="upg-title">${cat.name}</div>
                    <div class="upg-level-pips">
                        ${[1, 2, 3, 4, 5].map(i => `<div class="pip ${i <= currentLvl ? 'filled' : ''}"></div>`).join('')}
                    </div>
                </div>
                <button class="upg-btn btn-upg-action" data-cat="${cat.id}" data-cost="${cost}" ${isMax ? 'disabled' : ''}>
                    ${isMax ? 'MAX' : `${cost} 🪙`}
                </button>
            `;
            listContainer.appendChild(card);
        });

        listContainer.querySelectorAll('.btn-upg-action').forEach(btn => {
            btn.addEventListener('click', async () => {
                const cat = btn.getAttribute('data-cat');
                const cost = parseInt(btn.getAttribute('data-cost') || '0');
                const user = await window.DesiBackend.getProfile();
                try {
                    const updated = await window.DesiBackend.upgradeVehicle(user.id, this.currentVehicleId, cat, cost);
                    this.currentVehicleConfig = updated;
                    this.ui.showToast(`Upgraded ${cat.toUpperCase()} to Level ${updated[cat + 'Upgrade']}!`);
                    this.populateGarageData();
                    await this.ui.updateCurrencyHeader();
                } catch (e) {
                    this.ui.showToast(e.message);
                }
            });
        });

        // Vehicle Selector Prev / Next
        const vehKeys = Object.keys(defs);
        document.getElementById('btn-prev-veh').onclick = () => {
            let idx = vehKeys.indexOf(this.currentVehicleId) - 1;
            if (idx < 0) idx = vehKeys.length - 1;
            this.switchGarageVehicle(vehKeys[idx]);
        };
        document.getElementById('btn-next-veh').onclick = () => {
            let idx = (vehKeys.indexOf(this.currentVehicleId) + 1) % vehKeys.length;
            this.switchGarageVehicle(vehKeys[idx]);
        };

        // Color Swatches
        document.querySelectorAll('#paint-color-swatches .swatch').forEach(swatch => {
            swatch.onclick = async () => {
                document.querySelectorAll('#paint-color-swatches .swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                const col = swatch.getAttribute('data-color');
                this.currentVehicleConfig.color = col;
                this.spawnVehicle(this.currentVehicleId, this.currentVehicleConfig);
                const user = await window.DesiBackend.getProfile();
                await window.DesiBackend.customizeVehicle(user.id, this.currentVehicleId, col, this.currentVehicleConfig.decal, this.currentVehicleConfig.roofAccessory, this.currentVehicleConfig.bumper, this.currentVehicleConfig.suspensionLift);
            };
        });
    }

    async switchGarageVehicle(vehicleId) {
        this.currentVehicleId = vehicleId;
        const user = await window.DesiBackend.getProfile();
        const vehicles = await window.DesiBackend.getVehicles(user.id);
        this.currentVehicleConfig = vehicles.find(v => v.vehicleId === vehicleId) || { isOwned: false };
        this.spawnVehicle(vehicleId, this.currentVehicleConfig);
        this.populateGarageData();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(0.05, this.clock.getDelta());

        // Update World Environment (Day/Night, rain)
        if (this.world && this.physics) {
            this.world.update(delta, this.physics.position);
        }

        // Driving Mode
        if (this.isDriving && this.physics) {
            this.physics.update(delta, this.ui.inputState, this.vehicleMesh);

            // Mission Checkpoint Tracking
            const missionRes = this.missions.update(delta, this.physics.position, 100 - this.physics.health);
            if (missionRes && missionRes.status === 'COMPLETED') {
                this.handleMissionComplete(missionRes);
            }

            // HUD Instrument Updates
            this.ui.updateHUD(this.physics, missionRes, this.world.weather);

            // Update Dynamic Camera
            this.updateDrivingCamera(delta);
        } else if (this.isGarageMode || this.ui.currentScreen === 'screen-main-menu') {
            // Turntable Camera Orbit
            this.garageAngle += delta * 0.4;
            const radius = 6.5;
            this.camera.position.set(
                Math.sin(this.garageAngle) * radius,
                2.8,
                Math.cos(this.garageAngle) * radius
            );
            this.camera.lookAt(0, 0.8, 0);
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateDrivingCamera(delta) {
        if (!this.physics) return;

        const pos = this.physics.position;
        const yaw = this.physics.yaw;
        const speed = this.physics.speed;

        let targetCamPos = new THREE.Vector3();
        let targetLookAt = new THREE.Vector3();

        if (this.cameraMode === 0) {
            // 3rd Person Dynamic Chase
            const dist = 7.5 + (Math.abs(speed) / 100) * 2.0;
            const height = 3.2;
            targetCamPos.set(
                pos.x - Math.sin(yaw) * dist,
                pos.y + height,
                pos.z - Math.cos(yaw) * dist
            );
            targetLookAt.set(pos.x, pos.y + 1.2, pos.z);
        } else if (this.cameraMode === 1) {
            // Close Chase
            const dist = 4.8;
            const height = 2.0;
            targetCamPos.set(
                pos.x - Math.sin(yaw) * dist,
                pos.y + height,
                pos.z - Math.cos(yaw) * dist
            );
            targetLookAt.set(pos.x, pos.y + 1.0, pos.z);
        } else if (this.cameraMode === 2) {
            // Hood Camera
            targetCamPos.set(
                pos.x + Math.sin(yaw) * 0.8,
                pos.y + 1.1,
                pos.z + Math.cos(yaw) * 0.8
            );
            targetLookAt.set(
                pos.x + Math.sin(yaw) * 15,
                pos.y + 1.0,
                pos.z + Math.cos(yaw) * 15
            );
        } else {
            // Cockpit / First-person
            targetCamPos.set(
                pos.x - Math.sin(yaw) * 0.2 - Math.cos(yaw) * 0.35,
                pos.y + 1.35,
                pos.z - Math.cos(yaw) * 0.2 + Math.sin(yaw) * 0.35
            );
            targetLookAt.set(
                pos.x + Math.sin(yaw) * 20,
                pos.y + 1.2,
                pos.z + Math.cos(yaw) * 20
            );
        }

        // Smooth Camera Lerp
        const lerpFactor = this.cameraMode >= 2 ? 1.0 : Math.min(1.0, 10 * delta);
        this.camera.position.lerp(targetCamPos, lerpFactor);
        this.camera.lookAt(targetLookAt);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new DesiGameEngine();
});
