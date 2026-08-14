/**
 * Desi Offroad — Mission System
 * Full mission catalog: Delivery, Rescue, Hill Climb, Mud Challenge,
 * Time Trial, Fragile Cargo, and Exploration with 3D Waypoint Beacons.
 */
class DesiMissionManager {
    static getMissionList() {
        return [
            {
                id: 'm1_delivery',
                title: 'Village Mango Supply Run',
                type: 'DELIVERY',
                difficulty: 'EASY',
                description: 'Transport freshly harvested mango crates from the village center to the farm depot across the river.',
                coinsReward: 1200,
                xpReward: 350,
                timeLimitSeconds: 150,
                startPos: { x: 0, z: 0 },
                checkpoints: [
                    { x: 30, z: 0, label: 'Cross River Bridge' },
                    { x: 90, z: -20, label: 'Farm Depot Arrival' }
                ],
                maxDamagePct: 50
            },
            {
                id: 'm2_hillclimb',
                title: 'Sacred Hilltop Temple Ascent',
                type: 'HILL CLIMB',
                difficulty: 'MEDIUM',
                description: 'Climb the steep rocky mountain trail to reach the holy temple shrine on the highest peak.',
                coinsReward: 1800,
                xpReward: 500,
                timeLimitSeconds: 180,
                startPos: { x: 0, z: 0 },
                checkpoints: [
                    { x: 60, z: 50, label: 'Mountain Base Camp' },
                    { x: 90, z: 90, label: 'Hairpin Rocky Ridge' },
                    { x: 120, z: 130, label: 'Temple Peak Shrine' }
                ],
                maxDamagePct: 40
            },
            {
                id: 'm3_mud_bog',
                title: 'Marshland Mud Challenge',
                type: 'MUD CHALLENGE',
                difficulty: 'HARD',
                description: 'Navigate deep treacherous mud marshlands on the west boundary without stalling your 4x4.',
                coinsReward: 2400,
                xpReward: 650,
                timeLimitSeconds: 140,
                startPos: { x: -20, z: 20 },
                checkpoints: [
                    { x: -50, z: 35, label: 'Deep Mud Entrance' },
                    { x: -75, z: 55, label: 'Quicksand Mud Basin' },
                    { x: -90, z: 75, label: 'Dry Bank Finish' }
                ],
                maxDamagePct: 45
            },
            {
                id: 'm4_rescue',
                title: 'Stranded Tractor Rescue',
                type: 'RESCUE',
                difficulty: 'MEDIUM',
                description: 'A farmer tractor broke down near the riverbank. Rush emergency mechanical parts before sunset.',
                coinsReward: 1600,
                xpReward: 420,
                timeLimitSeconds: 110,
                startPos: { x: 0, z: 0 },
                checkpoints: [
                    { x: 45, z: -40, label: 'Stranded Tractor Site' }
                ],
                maxDamagePct: 35
            },
            {
                id: 'm5_timetrial',
                title: 'Desi Village Circuit Sprint',
                type: 'TIME TRIAL',
                difficulty: 'HARD',
                description: 'Complete a high-speed circuit loop through village streets and outer dirt trails in record time.',
                coinsReward: 2000,
                xpReward: 550,
                timeLimitSeconds: 90,
                startPos: { x: 0, z: 0 },
                checkpoints: [
                    { x: -30, z: -30, label: 'Checkpoint 1 (Huts)' },
                    { x: -40, z: 40, label: 'Checkpoint 2 (Mud Trail)' },
                    { x: 25, z: 30, label: 'Checkpoint 3 (Bridge)' },
                    { x: 0, z: 0, label: 'Village Finish Line' }
                ],
                maxDamagePct: 30
            },
            {
                id: 'm6_fragile_pottery',
                title: 'Fragile Clay Pottery Transport',
                type: 'CARGO TRANSPORT',
                difficulty: 'EXPERT',
                description: 'Carefully carry delicate village clay pots without heavy impacts. Damage must stay under 20%.',
                coinsReward: 2800,
                xpReward: 750,
                timeLimitSeconds: 200,
                startPos: { x: -15, z: -15 },
                checkpoints: [
                    { x: 10, z: -40, label: 'Pottery Checkpoint 1' },
                    { x: 80, z: -60, label: 'Market Delivery Stall' }
                ],
                maxDamagePct: 20
            },
            {
                id: 'm7_exploration',
                title: 'Village Landmarks Explorer',
                type: 'EXPLORATION',
                difficulty: 'MEDIUM',
                description: 'Explore the outskirts and discover 3 hidden heritage spots in the rural landscape.',
                coinsReward: 1500,
                xpReward: 400,
                timeLimitSeconds: 240,
                startPos: { x: 0, z: 0 },
                checkpoints: [
                    { x: -80, z: -70, label: 'Ancient Banyan Grove' },
                    { x: 70, z: -80, label: 'Old Water Mill' },
                    { x: 110, z: 40, label: 'Scenic Valley Overlook' }
                ],
                maxDamagePct: 60
            },
            {
                id: 'm8_river_expedition',
                title: 'Rocky River Current Crossing',
                type: 'EXPEDITION',
                difficulty: 'EXPERT',
                description: 'Cross against the upstream rocky riverbed to reach the ancient stone ruins on the east bank.',
                coinsReward: 3200,
                xpReward: 900,
                timeLimitSeconds: 160,
                startPos: { x: 0, z: 0 },
                checkpoints: [
                    { x: 45, z: 30, label: 'Rocky River Entry' },
                    { x: 55, z: 90, label: 'Deep Rapids Crossing' },
                    { x: 95, z: 110, label: 'Ancient Ruins Site' }
                ],
                maxDamagePct: 35
            }
        ];
    }

    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.activeMission = null;
        this.currentCheckpointIndex = 0;
        this.elapsedTime = 0;
        this.damageIncurred = 0;
        this.isActive = false;
        this.beaconMesh = null;
        this.buildWaypointBeacon();
    }

    buildWaypointBeacon() {
        const group = new THREE.Group();
        const cylinderMat = new THREE.MeshBasicMaterial({
            color: 0x00E676,
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide
        });
        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 20, 16, 1, true), cylinderMat);
        cylinder.position.y = 10;
        group.add(cylinder);

        // Pulsing Ring on Ground
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00E676, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(new THREE.RingGeometry(2.5, 3.5, 24), ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.1;
        group.add(ring);

        group.visible = false;
        this.scene.add(group);
        this.beaconMesh = group;
    }

    startMission(missionId) {
        const def = DesiMissionManager.getMissionList().find(m => m.id === missionId);
        if (!def) return null;

        this.activeMission = def;
        this.currentCheckpointIndex = 0;
        this.elapsedTime = 0;
        this.damageIncurred = 0;
        this.isActive = true;

        this.updateBeaconPosition();
        window.DesiAudio?.playButtonClick();
        return def;
    }

    cancelMission() {
        this.isActive = false;
        this.activeMission = null;
        if (this.beaconMesh) this.beaconMesh.visible = false;
    }

    updateBeaconPosition() {
        if (!this.isActive || !this.activeMission) {
            if (this.beaconMesh) this.beaconMesh.visible = false;
            return;
        }

        const cp = this.activeMission.checkpoints[this.currentCheckpointIndex];
        if (cp && this.beaconMesh) {
            const y = this.world.getHeightAt(cp.x, cp.z);
            this.beaconMesh.position.set(cp.x, y, cp.z);
            this.beaconMesh.visible = true;
        }
    }

    update(delta, playerPos, playerDamagePct) {
        if (!this.isActive || !this.activeMission) return null;

        this.elapsedTime += delta;
        this.damageIncurred = playerDamagePct;

        // Check if Time Expired
        if (this.activeMission.timeLimitSeconds && this.elapsedTime > this.activeMission.timeLimitSeconds) {
            this.isActive = false;
            if (this.beaconMesh) this.beaconMesh.visible = false;
            return { status: 'FAILED_TIME' };
        }

        // Check Checkpoint Proximity
        const cp = this.activeMission.checkpoints[this.currentCheckpointIndex];
        if (cp) {
            const dx = playerPos.x - cp.x;
            const dz = playerPos.z - cp.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < 6.0) {
                // Checkpoint reached!
                window.DesiAudio?.playButtonClick();
                window.DesiBackend?.triggerHaptic('click');
                this.currentCheckpointIndex++;

                if (this.currentCheckpointIndex >= this.activeMission.checkpoints.length) {
                    // Mission Complete!
                    this.isActive = false;
                    if (this.beaconMesh) this.beaconMesh.visible = false;
                    window.DesiAudio?.playVictoryJingle();
                    return {
                        status: 'COMPLETED',
                        mission: this.activeMission,
                        timeTaken: this.elapsedTime,
                        damageTaken: this.damageIncurred,
                        coins: this.activeMission.coinsReward,
                        xp: this.activeMission.xpReward
                    };
                } else {
                    this.updateBeaconPosition();
                    return {
                        status: 'CHECKPOINT_REACHED',
                        nextCheckpoint: this.activeMission.checkpoints[this.currentCheckpointIndex]
                    };
                }
            }
        }

        // Rotate Waypoint Beacon for Visual Effect
        if (this.beaconMesh && this.beaconMesh.visible) {
            this.beaconMesh.rotation.y += delta * 1.5;
        }

        return {
            status: 'IN_PROGRESS',
            timeRemaining: Math.max(0, this.activeMission.timeLimitSeconds - this.elapsedTime),
            checkpoint: cp
        };
    }
}

window.DesiMissionManager = DesiMissionManager;
