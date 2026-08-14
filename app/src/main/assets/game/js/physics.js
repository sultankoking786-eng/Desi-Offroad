/**
 * Desi Offroad — 3D Vehicle Physics Engine
 * Raycast suspension, 4x4 AWD torque, terrain friction (mud drag, water resistance),
 * steering, handbrake drift, chassis roll/pitch, damage system, and fuel simulation.
 */
class DesiVehiclePhysics {
    constructor(world, vehicleDef, upgrades = {}) {
        this.world = world;
        this.def = vehicleDef;
        this.upgrades = upgrades;

        // Dynamic State
        this.position = new THREE.Vector3(0, 1.2, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.forward = new THREE.Vector3(0, 0, 1);
        this.right = new THREE.Vector3(1, 0, 0);
        this.up = new THREE.Vector3(0, 1, 0);

        this.yaw = 0; // Rotation around Y
        this.pitch = 0; // Forward/Backward tilt on hills
        this.roll = 0; // Left/Right side tilt on off-camber terrain

        this.speed = 0; // km/h
        this.rpm = 800; // idle
        this.steeringAngle = 0;
        this.gear = '4H'; // 2H, 4H, 4L, R
        this.diffLock = false;

        // Vehicle Health & Fuel
        this.health = 100;
        this.fuel = 100;
        this.fuelConsumptionRate = 0.04;
        this.isWrecked = false;
        this.isOutOfFuel = false;

        // Upgrades Multipliers
        const engLvl = upgrades.engineUpgrade || 1;
        const transLvl = upgrades.transmissionUpgrade || 1;
        const suspLvl = upgrades.suspensionUpgrade || 1;
        const tireLvl = upgrades.tiresUpgrade || 1;
        const brakeLvl = upgrades.brakesUpgrade || 1;

        this.maxPower = (this.def.basePower * 0.8) + (engLvl * 15);
        this.traction = Math.min(0.99, this.def.baseTraction + (tireLvl * 0.025));
        this.brakePower = (this.def.baseBrakes * 35) + (brakeLvl * 6);
        this.suspensionTravel = (this.def.baseSuspension * 0.4) + (suspLvl * 0.04);
        this.weight = this.def.weight;
    }

    reset(x = 0, z = 0) {
        this.position.set(x, this.world.getHeightAt(x, z) + 1.2, z);
        this.velocity.set(0, 0, 0);
        this.speed = 0;
        this.yaw = 0;
        this.pitch = 0;
        this.roll = 0;
        this.health = 100;
        this.fuel = 100;
        this.isWrecked = false;
        this.isOutOfFuel = false;
    }

    update(delta, input, vehicleMesh) {
        if (this.health <= 0) {
            this.isWrecked = true;
            this.speed = 0;
            return;
        }

        if (this.fuel <= 0) {
            this.isOutOfFuel = true;
            input.throttle = 0;
        }

        // 1. Steering with Auto-Centering
        const maxSteer = 0.58; // radians
        const steerSpeed = 3.2;
        if (input.steerLeft) {
            this.steeringAngle = Math.min(maxSteer, this.steeringAngle + steerSpeed * delta);
        } else if (input.steerRight) {
            this.steeringAngle = Math.max(-maxSteer, this.steeringAngle - steerSpeed * delta);
        } else {
            // Smooth Return to Center
            this.steeringAngle *= Math.max(0, 1 - 8 * delta);
        }

        // 2. Terrain Detection under vehicle
        const groundY = this.world.getHeightAt(this.position.x, this.position.z);
        const surface = this.world.getSurfaceType(this.position.x, this.position.z);

        // Terrain Friction Multiplier
        let surfaceFriction = this.traction;
        let dragCoefficient = 1.2;

        if (surface === 'MUD') {
            surfaceFriction *= 0.55;
            dragCoefficient = 3.8; // Mud bog slowdown
            if (Math.abs(this.speed) > 10 && Math.random() < 0.15) {
                window.DesiAudio?.playMudSplash();
            }
        } else if (surface === 'WATER') {
            surfaceFriction *= 0.45;
            dragCoefficient = 5.0; // Deep water resistance
        } else if (surface === 'TARMAC') {
            surfaceFriction *= 1.15;
            dragCoefficient = 0.9;
        }

        // 3. Acceleration & 4x4 Torque Power
        let torque = 0;
        if (input.throttle > 0) {
            let gearRatio = 1.0;
            if (this.gear === '4L') gearRatio = 1.9; // Low range rock crawl
            else if (this.gear === '2H') gearRatio = 0.85;

            torque = this.maxPower * gearRatio * input.throttle;
            this.fuel = Math.max(0, this.fuel - this.fuelConsumptionRate * delta * (this.rpm / 2000));
        }

        let braking = 0;
        if (input.brakeReverse > 0) {
            if (this.speed > 2) {
                braking = this.brakePower * input.brakeReverse;
            } else {
                // Reverse
                torque = -this.maxPower * 0.6 * input.brakeReverse;
            }
        }

        if (input.handbrake) {
            braking += this.brakePower * 1.8;
            surfaceFriction *= 0.35; // Allow power slide / drift
        }

        // 4. Slope / Incline Gravity Component
        // Sample height slightly ahead and behind to get slope
        const probeDist = 2.0;
        const frontGroundY = this.world.getHeightAt(
            this.position.x + Math.sin(this.yaw) * probeDist,
            this.position.z + Math.cos(this.yaw) * probeDist
        );
        const rearGroundY = this.world.getHeightAt(
            this.position.x - Math.sin(this.yaw) * probeDist,
            this.position.z - Math.cos(this.yaw) * probeDist
        );
        const slopeY = (frontGroundY - rearGroundY) / (probeDist * 2);
        const gravityResistance = slopeY * 45; // Hill resistance

        // 5. Update Speed & Velocity
        const netForce = (torque - braking * Math.sign(this.speed) - gravityResistance) * surfaceFriction;
        const acceleration = (netForce / (this.weight * 0.01));

        this.speed += acceleration * delta * 3.6; // Convert to km/h
        this.speed -= this.speed * dragCoefficient * delta;

        if (Math.abs(this.speed) < 0.1 && input.throttle === 0 && input.brakeReverse === 0) {
            this.speed = 0;
        }

        // 6. Turn Radius & Yaw Rotation
        if (Math.abs(this.speed) > 0.5) {
            const turnRate = (this.speed / 3.6) * Math.tan(this.steeringAngle) / 2.6;
            this.yaw += turnRate * delta;
        }

        // 7. Update World Position
        this.position.x += Math.sin(this.yaw) * (this.speed / 3.6) * delta;
        this.position.z += Math.cos(this.yaw) * (this.speed / 3.6) * delta;

        // Suspension Ground Hugging with Smooth Bounce
        const targetY = groundY + 0.65;
        this.position.y += (targetY - this.position.y) * 12 * delta;

        // 8. Dynamic Pitch and Roll calculation
        const targetPitch = Math.atan2(rearGroundY - frontGroundY, probeDist * 2);
        this.pitch += (targetPitch - this.pitch) * 8 * delta;

        // Sample Left vs Right for Side Off-Camber Roll
        const leftGroundY = this.world.getHeightAt(
            this.position.x - Math.cos(this.yaw) * 1.0,
            this.position.z + Math.sin(this.yaw) * 1.0
        );
        const rightGroundY = this.world.getHeightAt(
            this.position.x + Math.cos(this.yaw) * 1.0,
            this.position.z - Math.sin(this.yaw) * 1.0
        );
        const targetRoll = Math.atan2(leftGroundY - rightGroundY, 2.0);
        this.roll += (targetRoll - this.roll) * 8 * delta;

        // 9. Update RPM & Audio
        const minRPM = 850;
        const maxRPM = 5500;
        const rpmTarget = minRPM + (Math.abs(this.speed) / 100) * (maxRPM - minRPM) + (input.throttle * 900);
        this.rpm += (rpmTarget - this.rpm) * 10 * delta;
        window.DesiAudio?.updateEngineRPM(this.rpm / maxRPM, Math.abs(this.speed));

        // 10. Check Refueling & Repair Stations
        this.world.fuelStations.forEach(st => {
            const dx = this.position.x - st.x;
            const dz = this.position.z - st.z;
            if (Math.sqrt(dx * dx + dz * dz) < st.radius) {
                this.fuel = Math.min(100, this.fuel + delta * 25);
            }
        });

        this.world.repairStations.forEach(st => {
            const dx = this.position.x - st.x;
            const dz = this.position.z - st.z;
            if (Math.sqrt(dx * dx + dz * dz) < st.radius) {
                this.health = Math.min(100, this.health + delta * 20);
            }
        });

        // 11. Synchronize 3D Three.js Mesh
        if (vehicleMesh) {
            vehicleMesh.position.copy(this.position);
            vehicleMesh.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');

            // Steer front wheels & spin all wheels
            const wheelSpinDelta = (this.speed / 3.6) * delta * 5;
            const wheels = vehicleMesh.userData.wheels || [];
            wheels.forEach(w => {
                if (w.isFront) {
                    w.group.rotation.y = this.steeringAngle;
                }
                w.mesh.rotation.x += wheelSpinDelta;
            });
        }
    }

    applyDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        window.DesiAudio?.playCrashSound(amount / 20);
        window.DesiBackend?.triggerHaptic('crash');
    }
}

window.DesiVehiclePhysics = DesiVehiclePhysics;
