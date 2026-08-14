/**
 * Desi Offroad — 3D Procedural Vehicles Engine
 * Generates rich, high-performance 3D models for Desi 4x4 Jeep,
 * Village Tractor, Pickup 4x4, Gorkha Beast, and 6x6 Hauler.
 */
class DesiVehicleFactory {
    static getVehicleDefinitions() {
        return {
            thar_4x4: {
                id: 'thar_4x4',
                name: 'Desi Thar 4x4',
                type: '4x4 ALL-TERRAIN JEEP',
                price: 0,
                basePower: 110,
                baseTraction: 0.88,
                baseBrakes: 0.85,
                baseSuspension: 0.9,
                fuelCapacity: 60,
                weight: 1650,
                desc: 'The iconic Indian village off-roader. Excellent balance of torque, agility, and hill-climbing power.'
            },
            tractor_desi: {
                id: 'tractor_desi',
                name: 'Desi Power Tractor',
                type: 'HEAVY AGRICULTURAL BULL',
                price: 4500,
                basePower: 140,
                baseTraction: 0.96,
                baseBrakes: 0.75,
                baseSuspension: 0.7,
                fuelCapacity: 50,
                weight: 2200,
                desc: 'Unmatched raw low-end torque and giant rear agricultural tires that power through the deepest mud pits.'
            },
            pickup_4x4: {
                id: 'pickup_4x4',
                name: 'Desi Crew Pickup 4x4',
                type: 'HEAVY CARGO TRANSPORT',
                price: 7500,
                basePower: 130,
                baseTraction: 0.85,
                baseBrakes: 0.88,
                baseSuspension: 0.85,
                fuelCapacity: 75,
                weight: 1950,
                desc: 'Extended cargo bay capable of transporting fragile pottery, mango boxes, and heavy grain sacks.'
            },
            gorkha_beast: {
                id: 'gorkha_beast',
                name: 'Gorkha Mountain Beast',
                type: 'EXTREME ROCK CRAWLER',
                price: 12000,
                basePower: 165,
                baseTraction: 0.98,
                baseBrakes: 0.92,
                baseSuspension: 0.98,
                fuelCapacity: 80,
                weight: 1850,
                desc: 'Extreme mountain conqueror with snorkel intake, portal axles, and military-grade suspension.'
            },
            desi_truck_6x6: {
                id: 'desi_truck_6x6',
                name: 'Desi 6x6 Heavy Hauler',
                type: '6-WHEEL EXPEDITION TRUCK',
                price: 18000,
                basePower: 220,
                baseTraction: 0.95,
                baseBrakes: 0.90,
                baseSuspension: 0.90,
                fuelCapacity: 120,
                weight: 3400,
                desc: 'Ultimate 6x6 Indian rural heavy hauler with painted artistic visor and indestructible chassis.'
            }
        };
    }

    /**
     * Build 3D Mesh for the given vehicle configuration
     */
    static buildVehicle(vehicleId, config = {}) {
        const root = new THREE.Group();
        root.name = 'vehicle_root';

        const bodyColor = config.color || '#E53935';
        const decal = config.decal || 'NONE';
        const roofAcc = config.roofAccessory || 'STANDARD';
        const bumper = config.bumper || 'STANDARD';
        const lift = config.suspensionLift || 1.0;

        const bodyMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(bodyColor),
            metalness: 0.4,
            roughness: 0.35
        });

        const darkMetalMat = new THREE.MeshStandardMaterial({
            color: 0x212121,
            metalness: 0.7,
            roughness: 0.4
        });

        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xE0E0E0,
            metalness: 0.9,
            roughness: 0.1
        });

        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x1A1A1A,
            roughness: 0.9,
            metalness: 0.1
        });

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x37474F,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.65
        });

        const headlightMat = new THREE.MeshBasicMaterial({ color: 0xFFF9C4 });
        const taillightMat = new THREE.MeshBasicMaterial({ color: 0xD50000 });

        const wheels = [];
        const headlights = [];
        const taillights = [];

        const chassisGroup = new THREE.Group();
        chassisGroup.name = 'chassis';
        root.add(chassisGroup);

        if (vehicleId === 'tractor_desi') {
            this._buildTractor(chassisGroup, bodyMat, darkMetalMat, chromeMat, tireMat, glassMat, headlightMat, taillightMat, wheels, headlights, taillights);
        } else if (vehicleId === 'pickup_4x4') {
            this._buildPickup(chassisGroup, bodyMat, darkMetalMat, chromeMat, tireMat, glassMat, headlightMat, taillightMat, wheels, headlights, taillights, roofAcc, bumper);
        } else if (vehicleId === 'gorkha_beast') {
            this._buildGorkha(chassisGroup, bodyMat, darkMetalMat, chromeMat, tireMat, glassMat, headlightMat, taillightMat, wheels, headlights, taillights, roofAcc, bumper);
        } else if (vehicleId === 'desi_truck_6x6') {
            this._buildTruck6x6(chassisGroup, bodyMat, darkMetalMat, chromeMat, tireMat, glassMat, headlightMat, taillightMat, wheels, headlights, taillights, roofAcc, bumper);
        } else {
            // Default Thar 4x4
            this._buildThar4x4(chassisGroup, bodyMat, darkMetalMat, chromeMat, tireMat, glassMat, headlightMat, taillightMat, wheels, headlights, taillights, roofAcc, bumper);
        }

        // Apply Suspension Lift
        chassisGroup.position.y = 0.55 * lift;

        // Dynamic Spotlight for Night Driving
        const spotLight = new THREE.SpotLight(0xFFF8E1, 2.5, 55, Math.PI / 5, 0.4);
        spotLight.position.set(0, 0.8 * lift, 1.8);
        spotLight.target.position.set(0, 0, 15);
        chassisGroup.add(spotLight);
        chassisGroup.add(spotLight.target);

        root.userData = {
            wheels,
            headlights,
            taillights,
            chassis: chassisGroup,
            spotLight,
            bodyMat,
            id: vehicleId
        };

        return root;
    }

    static _buildThar4x4(chassis, bodyMat, darkMetal, chrome, tireMat, glassMat, headMat, tailMat, wheels, heads, tails, roofAcc, bumper) {
        // Lower Cabin Base
        const baseGeom = new THREE.BoxGeometry(1.7, 0.65, 3.2);
        const baseMesh = new THREE.Mesh(baseGeom, bodyMat);
        baseMesh.position.set(0, 0.35, 0);
        baseMesh.castShadow = true;
        chassis.add(baseMesh);

        // Front Hood
        const hoodGeom = new THREE.BoxGeometry(1.6, 0.4, 1.2);
        const hoodMesh = new THREE.Mesh(hoodGeom, bodyMat);
        hoodMesh.position.set(0, 0.6, 0.95);
        chassis.add(hoodMesh);

        // Iconic Vertical Slotted Indian 4x4 Grille
        const grillGeom = new THREE.BoxGeometry(1.5, 0.45, 0.1);
        const grillMesh = new THREE.Mesh(grillGeom, darkMetal);
        grillMesh.position.set(0, 0.58, 1.56);
        chassis.add(grillMesh);

        // Round Headlights
        const headGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16);
        headGeom.rotateX(Math.PI / 2);
        const hl1 = new THREE.Mesh(headGeom, headMat);
        hl1.position.set(-0.55, 0.6, 1.6);
        const hl2 = new THREE.Mesh(headGeom, headMat);
        hl2.position.set(0.55, 0.6, 1.6);
        chassis.add(hl1, hl2);
        heads.push(hl1, hl2);

        // Cabin Top & Windshield
        const cabinGeom = new THREE.BoxGeometry(1.55, 0.75, 1.6);
        const cabinMesh = new THREE.Mesh(cabinGeom, darkMetal);
        cabinMesh.position.set(0, 0.95, -0.45);
        chassis.add(cabinMesh);

        const windGeom = new THREE.BoxGeometry(1.4, 0.5, 0.05);
        const windMesh = new THREE.Mesh(windGeom, glassMat);
        windMesh.position.set(0, 1.0, 0.36);
        windMesh.rotation.x = 0.25;
        chassis.add(windMesh);

        // Rear Spare Wheel
        const spareTire = this._createWheel(0.38, 0.24, darkMetal, tireMat);
        spareTire.rotation.y = Math.PI / 2;
        spareTire.position.set(0, 0.65, -1.65);
        chassis.add(spareTire);

        // Taillights
        const tailGeom = new THREE.BoxGeometry(0.2, 0.15, 0.05);
        const tl1 = new THREE.Mesh(tailGeom, tailMat);
        tl1.position.set(-0.65, 0.6, -1.61);
        const tl2 = new THREE.Mesh(tailGeom, tailMat);
        tl2.position.set(0.65, 0.6, -1.61);
        chassis.add(tl1, tl2);
        tails.push(tl1, tl2);

        // Bumper
        if (bumper === 'HEAVY_BULLBAR') {
            const bullbar = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 16, Math.PI), chrome);
            bullbar.position.set(0, 0.45, 1.68);
            bullbar.rotation.z = Math.PI;
            chassis.add(bullbar);
        }

        // Roof Accessories
        if (roofAcc === 'CARRIER_LIGHTS' || roofAcc === 'SAFARI_RACK') {
            const rack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 1.4), darkMetal);
            rack.position.set(0, 1.4, -0.45);
            chassis.add(rack);

            // Roof Fog Lamps
            for (let i = -0.4; i <= 0.4; i += 0.26) {
                const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12), headMat);
                lamp.rotateX(Math.PI / 2);
                lamp.position.set(i, 1.5, 0.25);
                chassis.add(lamp);
                heads.push(lamp);
            }
        }

        // 4 Off-road Wheels
        const wheelPositions = [
            { x: -0.9, y: 0, z: 0.95, isFront: true },
            { x: 0.9, y: 0, z: 0.95, isFront: true },
            { x: -0.9, y: 0, z: -0.95, isFront: false },
            { x: 0.9, y: 0, z: -0.95, isFront: false }
        ];

        wheelPositions.forEach(pos => {
            const wheelNode = new THREE.Group();
            wheelNode.position.set(pos.x, pos.y, pos.z);
            const mesh = this._createWheel(0.42, 0.28, darkMetal, tireMat);
            wheelNode.add(mesh);
            chassis.add(wheelNode);
            wheels.push({ group: wheelNode, mesh, isFront: pos.isFront, x: pos.x, z: pos.z });
        });
    }

    static _buildTractor(chassis, bodyMat, darkMetal, chrome, tireMat, glassMat, headMat, tailMat, wheels, heads, tails) {
        // Long Engine Bonnet
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 2.2), bodyMat);
        hood.position.set(0, 0.65, 0.4);
        chassis.add(hood);

        // Tall Vertical Exhaust Chimney
        const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 12), chrome);
        exhaust.position.set(0.4, 1.4, 0.8);
        chassis.add(exhaust);

        // Driver Seat & Mudguards
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), darkMetal);
        seat.position.set(0, 0.8, -0.6);
        chassis.add(seat);

        // Big Curved Mudguards
        const mgL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 1.4), bodyMat);
        mgL.position.set(-0.95, 0.85, -0.7);
        const mgR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 1.4), bodyMat);
        mgR.position.set(0.95, 0.85, -0.7);
        chassis.add(mgL, mgR);

        // Steering Wheel
        const steer = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 16), darkMetal);
        steer.rotation.x = Math.PI / 3;
        steer.position.set(0, 1.1, -0.2);
        chassis.add(steer);

        // Headlights on side struts
        const hl1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), headMat);
        hl1.rotateX(Math.PI / 2);
        hl1.position.set(-0.55, 0.75, 1.4);
        const hl2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), headMat);
        hl2.rotateX(Math.PI / 2);
        hl2.position.set(0.55, 0.75, 1.4);
        chassis.add(hl1, hl2);
        heads.push(hl1, hl2);

        // Wheels: Small Front Wheels, Massive Rear Lugged Tractor Wheels
        const fWheels = [
            { x: -0.75, y: -0.15, z: 1.2, r: 0.32, w: 0.22, isFront: true },
            { x: 0.75, y: -0.15, z: 1.2, r: 0.32, w: 0.22, isFront: true },
            { x: -1.0, y: 0.1, z: -0.7, r: 0.65, w: 0.45, isFront: false },
            { x: 1.0, y: 0.1, z: -0.7, r: 0.65, w: 0.45, isFront: false }
        ];

        fWheels.forEach(pos => {
            const wheelNode = new THREE.Group();
            wheelNode.position.set(pos.x, pos.y, pos.z);
            const mesh = this._createWheel(pos.r, pos.w, chrome, tireMat, true);
            wheelNode.add(mesh);
            chassis.add(wheelNode);
            wheels.push({ group: wheelNode, mesh, isFront: pos.isFront, x: pos.x, z: pos.z });
        });
    }

    static _buildPickup(chassis, bodyMat, darkMetal, chrome, tireMat, glassMat, headMat, tailMat, wheels, heads, tails, roofAcc, bumper) {
        // Cabin
        const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 1.6), bodyMat);
        cab.position.set(0, 0.8, 0.1);
        chassis.add(cab);

        // Long Cargo Bed
        const bed = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.6, 1.8), bodyMat);
        bed.position.set(0, 0.5, -1.3);
        chassis.add(bed);

        // Cargo Mango/Grain Crates in back
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x8D6E63, roughness: 0.8 });
        for (let i = 0; i < 3; i++) {
            const crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.45), crateMat);
            crate.position.set((i - 1) * 0.45, 0.9, -1.25);
            chassis.add(crate);
        }

        // Hood
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.5, 1.3), bodyMat);
        hood.position.set(0, 0.6, 1.35);
        chassis.add(hood);

        // Wheels
        const wPos = [
            { x: -0.92, y: 0, z: 1.25, isFront: true },
            { x: 0.92, y: 0, z: 1.25, isFront: true },
            { x: -0.92, y: 0, z: -1.25, isFront: false },
            { x: 0.92, y: 0, z: -1.25, isFront: false }
        ];

        wPos.forEach(pos => {
            const wheelNode = new THREE.Group();
            wheelNode.position.set(pos.x, pos.y, pos.z);
            const mesh = this._createWheel(0.44, 0.28, darkMetal, tireMat);
            wheelNode.add(mesh);
            chassis.add(wheelNode);
            wheels.push({ group: wheelNode, mesh, isFront: pos.isFront, x: pos.x, z: pos.z });
        });
    }

    static _buildGorkha(chassis, bodyMat, darkMetal, chrome, tireMat, glassMat, headMat, tailMat, wheels, heads, tails, roofAcc, bumper) {
        // Reinforced High-Clearance Body
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.85, 3.4), bodyMat);
        body.position.set(0, 0.65, 0);
        chassis.add(body);

        // Snorkel
        const snorkel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8), darkMetal);
        snorkel.position.set(0.9, 1.1, 0.8);
        chassis.add(snorkel);

        // Massive Heavy-Duty Wheels
        const wPos = [
            { x: -1.0, y: -0.05, z: 1.1, isFront: true },
            { x: 1.0, y: -0.05, z: 1.1, isFront: true },
            { x: -1.0, y: -0.05, z: -1.1, isFront: false },
            { x: 1.0, y: -0.05, z: -1.1, isFront: false }
        ];

        wPos.forEach(pos => {
            const wheelNode = new THREE.Group();
            wheelNode.position.set(pos.x, pos.y, pos.z);
            const mesh = this._createWheel(0.50, 0.34, darkMetal, tireMat);
            wheelNode.add(mesh);
            chassis.add(wheelNode);
            wheels.push({ group: wheelNode, mesh, isFront: pos.isFront, x: pos.x, z: pos.z });
        });
    }

    static _buildTruck6x6(chassis, bodyMat, darkMetal, chrome, tireMat, glassMat, headMat, tailMat, wheels, heads, tails) {
        // Forward Control High Cab
        const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 1.8), bodyMat);
        cab.position.set(0, 1.1, 1.5);
        chassis.add(cab);

        // Decorated Indian Truck Roof Crown/Visor
        const visorMat = new THREE.MeshStandardMaterial({ color: 0xFFD54F });
        const visor = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.3, 0.6), visorMat);
        visor.position.set(0, 1.9, 1.8);
        chassis.add(visor);

        // Massive Flatbed / High-wall Body
        const bed = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.0, 3.4), bodyMat);
        bed.position.set(0, 0.9, -1.0);
        chassis.add(bed);

        // 6 Heavy-Duty Wheels
        const wPos = [
            { x: -1.1, y: 0.1, z: 1.5, isFront: true },
            { x: 1.1, y: 0.1, z: 1.5, isFront: true },
            { x: -1.1, y: 0.1, z: -0.4, isFront: false },
            { x: 1.1, y: 0.1, z: -0.4, isFront: false },
            { x: -1.1, y: 0.1, z: -1.7, isFront: false },
            { x: 1.1, y: 0.1, z: -1.7, isFront: false }
        ];

        wPos.forEach(pos => {
            const wheelNode = new THREE.Group();
            wheelNode.position.set(pos.x, pos.y, pos.z);
            const mesh = this._createWheel(0.52, 0.36, chrome, tireMat);
            wheelNode.add(mesh);
            chassis.add(wheelNode);
            wheels.push({ group: wheelNode, mesh, isFront: pos.isFront, x: pos.x, z: pos.z });
        });
    }

    static _createWheel(radius, width, rimMat, tireMat, isTractor = false) {
        const wheelGroup = new THREE.Group();

        // Tire Cylinder
        const tireGeom = new THREE.CylinderGeometry(radius, radius, width, isTractor ? 16 : 20);
        tireGeom.rotateZ(Math.PI / 2);
        const tireMesh = new THREE.Mesh(tireGeom, tireMat);
        tireMesh.castShadow = true;
        wheelGroup.add(tireMesh);

        // Rim
        const rimGeom = new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, width * 1.02, 16);
        rimGeom.rotateZ(Math.PI / 2);
        const rimMesh = new THREE.Mesh(rimGeom, rimMat);
        wheelGroup.add(rimMesh);

        return wheelGroup;
    }
}

window.DesiVehicleFactory = DesiVehicleFactory;
