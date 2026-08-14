/**
 * Desi Offroad — 3D Indian Village World & Environment Engine
 * Procedural Indian rural terrain with hills, mud pits, flowing river,
 * village huts, banyan trees, temple, garage, dynamic day/night, and weather.
 */
class DesiWorld {
    constructor(scene) {
        this.scene = scene;
        this.terrain = null;
        this.terrainSize = 500;
        this.terrainSegments = 100;
        this.sunLight = null;
        this.ambientLight = null;
        this.hemiLight = null;
        this.rainParticles = null;
        this.mudPits = [];
        this.fuelStations = [];
        this.repairStations = [];
        this.worldObjects = [];
        this.timeOfDay = 0.35; // 0.0 to 1.0 (0.25 sunrise, 0.5 noon, 0.75 sunset, 0.0 night)
        this.weather = 'SUNNY'; // SUNNY, RAIN, FOG
        this.fogNear = 40;
        this.fogFar = 350;
        this.buildWorld();
    }

    buildWorld() {
        this.initLighting();
        this.buildTerrain();
        this.buildRiver();
        this.buildVillage();
        this.buildTemple();
        this.buildGarageAndFuelStation();
        this.buildFloraAndRocks();
        this.initRainSystem();
    }

    initLighting() {
        this.ambientLight = new THREE.AmbientLight(0xFFF3E0, 0.45);
        this.scene.add(this.ambientLight);

        this.hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x5D4037, 0.5);
        this.scene.add(this.hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xFFF8E1, 1.2);
        this.sunLight.position.set(120, 180, 80);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.sunLight.shadow.camera.near = 10;
        this.sunLight.shadow.camera.far = 400;
        const d = 160;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        this.scene.add(this.sunLight);

        this.scene.fog = new THREE.Fog(0xD7CCC8, this.fogNear, this.fogFar);
    }

    /**
     * Analytical Heightmap Function for Indian Rural Terrain
     */
    getHeightAt(x, z) {
        // Flat Village Center Hub (radius < 45)
        const distFromCenter = Math.sqrt(x * x + z * z);
        if (distFromCenter < 35) {
            return 0.5;
        }

        // River Canyon Channel (x from 40 to 65 running along z)
        if (x > 35 && x < 75) {
            const riverCenter = 55;
            const dRiver = Math.abs(x - riverCenter);
            if (dRiver < 16) {
                return -3.5 + Math.sin(z * 0.05) * 0.4;
            }
        }

        // Mud Marsh Basin (x in [-90, -40], z in [20, 80])
        if (x > -95 && x < -35 && z > 15 && z < 85) {
            return -0.8 + Math.sin(x * 0.1) * Math.cos(z * 0.1) * 0.5;
        }

        // Mountain Hill Peaks (North & East ridges)
        let h = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 8;
        h += Math.sin(x * 0.05 + 1.2) * Math.cos(z * 0.04) * 4;
        h += Math.sin(x * 0.09) * 2;

        // Big Mountain Temple Peak in the North-East
        const dxM = x - 120;
        const dzM = z - 130;
        const distM = Math.sqrt(dxM * dxM + dzM * dzM);
        if (distM < 80) {
            h += (80 - distM) * 0.42;
        }

        // West Mud Dunes
        const dxD = x + 120;
        const dzD = z - 40;
        const distD = Math.sqrt(dxD * dxD + dzD * dzD);
        if (distD < 70) {
            h += (70 - distD) * 0.25 * Math.sin(distD * 0.3);
        }

        return Math.max(-4, h);
    }

    getSurfaceType(x, z) {
        // Check Mud Pits
        if (x > -95 && x < -35 && z > 15 && z < 85) return 'MUD';
        // River
        if (x > 40 && x < 70 && Math.abs(z) > 10) return 'WATER';
        // Village Dirt/Tarmac Center
        const dCenter = Math.sqrt(x * x + z * z);
        if (dCenter < 40) return 'TARMAC';
        // General Dirt / Rock
        return 'DIRT';
    }

    buildTerrain() {
        const geom = new THREE.PlaneGeometry(this.terrainSize, this.terrainSize, this.terrainSegments, this.terrainSegments);
        geom.rotateX(-Math.PI / 2);

        const pos = geom.attributes.position;
        const colors = [];
        const cGrass = new THREE.Color(0x7CB342);
        const cDirt = new THREE.Color(0x8D6E63);
        const cMud = new THREE.Color(0x4E342E);
        const cRock = new THREE.Color(0x78909C);
        const cSand = new THREE.Color(0xD7CCC8);

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const y = this.getHeightAt(x, z);
            pos.setY(i, y);

            // Vertex Coloring based on height and surface type
            const surface = this.getSurfaceType(x, z);
            let vCol = cGrass;
            if (surface === 'MUD') vCol = cMud;
            else if (surface === 'WATER') vCol = cSand;
            else if (y > 15) vCol = cRock;
            else if (y < 2) vCol = cDirt;

            colors.push(vCol.r, vCol.g, vCol.b);
        }

        geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geom.computeVertexNormals();

        const terrainMat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.85,
            metalness: 0.1
        });

        this.terrain = new THREE.Mesh(geom, terrainMat);
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);
    }

    buildRiver() {
        const riverGeom = new THREE.PlaneGeometry(30, 480, 1, 1);
        riverGeom.rotateX(-Math.PI / 2);
        const riverMat = new THREE.MeshStandardMaterial({
            color: 0x0288D1,
            roughness: 0.15,
            metalness: 0.8,
            transparent: true,
            opacity: 0.78
        });
        const river = new THREE.Mesh(riverGeom, riverMat);
        river.position.set(55, -1.8, 0);
        this.scene.add(river);

        // Wooden Village Bridge over River at z = 0
        const bridge = new THREE.Group();
        const plankMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.9 });
        const railMat = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.8 });

        const deck = new THREE.Mesh(new THREE.BoxGeometry(34, 0.4, 7), plankMat);
        deck.position.set(55, 0.5, 0);
        deck.castShadow = true;
        bridge.add(deck);

        const rail1 = new THREE.Mesh(new THREE.BoxGeometry(34, 0.8, 0.3), railMat);
        rail1.position.set(55, 1.1, 3.3);
        const rail2 = new THREE.Mesh(new THREE.BoxGeometry(34, 0.8, 0.3), railMat);
        rail2.position.set(55, 1.1, -3.3);
        bridge.add(rail1, rail2);

        this.scene.add(bridge);
    }

    buildVillage() {
        // Village Huts (Traditional mud walls + terracotta / straw thatched roofs)
        const hutPositions = [
            { x: -18, z: -15, rot: 0.2 },
            { x: -22, z: 12, rot: -0.4 },
            { x: 15, z: -18, rot: 0.8 },
            { x: 18, z: 16, rot: -0.6 },
            { x: -5, z: -25, rot: 0.0 }
        ];

        hutPositions.forEach(pos => {
            const hut = this._createVillageHut();
            hut.position.set(pos.x, this.getHeightAt(pos.x, pos.z), pos.z);
            hut.rotation.y = pos.rot;
            this.scene.add(hut);
            this.worldObjects.push(hut);
        });

        // Village Center Banyan Tree Circle & Heritage Well
        const well = this._createVillageWell();
        well.position.set(0, 0.5, 0);
        this.scene.add(well);
    }

    _createVillageHut() {
        const group = new THREE.Group();
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xBCAAA4, roughness: 0.9 });
        const roofMat = new THREE.MeshStandardMaterial({ color: 0xD84315, roughness: 0.7 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x4E342E, roughness: 0.8 });

        // Wall Base
        const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 3.2, 5), wallMat);
        walls.position.y = 1.6;
        walls.castShadow = true;
        group.add(walls);

        // Thatched Pyramid Roof
        const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.5, 4), roofMat);
        roof.position.y = 4.4;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);

        // Wooden Door & Lantern
        const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.2), woodMat);
        door.position.set(0, 1.1, 2.55);
        group.add(door);

        // Warm Hut Lantern
        const lanternLight = new THREE.PointLight(0xFFB74D, 1.2, 18);
        lanternLight.position.set(1.2, 2.4, 2.8);
        group.add(lanternLight);

        return group;
    }

    _createVillageWell() {
        const group = new THREE.Group();
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x757575, roughness: 0.9 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.8 });

        const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.2, 16), stoneMat);
        base.position.y = 0.6;
        base.castShadow = true;
        group.add(base);

        const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 8), woodMat);
        pillar1.position.set(-1.8, 2.1, 0);
        const pillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 8), woodMat);
        pillar2.position.set(1.8, 2.1, 0);
        group.add(pillar1, pillar2);

        const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 4), woodMat);
        roof.position.y = 4.0;
        roof.rotation.y = Math.PI / 4;
        group.add(roof);

        return group;
    }

    buildTemple() {
        // Ancient Hilltop Temple on North-East mountain peak (x: 120, z: 130)
        const x = 120, z = 130;
        const y = this.getHeightAt(x, z);

        const temple = new THREE.Group();
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0xFFE082, roughness: 0.6 });
        const saffronMat = new THREE.MeshStandardMaterial({ color: 0xFF6F00, roughness: 0.5 });

        // Base Shrine Platform
        const platform = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 14), stoneMat);
        platform.position.y = 1;
        platform.castShadow = true;
        temple.add(platform);

        // Sanctum & Mandapa
        const sanctum = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 8), stoneMat);
        sanctum.position.y = 5;
        temple.add(sanctum);

        // Traditional Shikhara Tower / Spire
        const spire = new THREE.Mesh(new THREE.ConeGeometry(5, 10, 8), saffronMat);
        spire.position.y = 13;
        temple.add(spire);

        // Saffron Flag on Top
        const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 8), stoneMat);
        flagPole.position.y = 19;
        const flag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 1.8), saffronMat);
        flag.position.set(0.9, 19.5, 0);
        temple.add(flagPole, flag);

        temple.position.set(x, y, z);
        this.scene.add(temple);
        this.worldObjects.push(temple);
    }

    buildGarageAndFuelStation() {
        // Village Mechanic Garage & Fuel Station (x: -12, z: 28)
        const x = -12, z = 28;
        const y = this.getHeightAt(x, z);

        const garage = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x37474F, roughness: 0.6 });
        const yellowMat = new THREE.MeshStandardMaterial({ color: 0xFFD54F, roughness: 0.4 });
        const redMat = new THREE.MeshStandardMaterial({ color: 0xE53935, roughness: 0.4 });

        // Workshop Shed
        const shed = new THREE.Mesh(new THREE.BoxGeometry(12, 4.5, 10), metalMat);
        shed.position.set(0, 2.25, 0);
        shed.castShadow = true;
        garage.add(shed);

        // Garage Signboard
        const sign = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 0.3), yellowMat);
        sign.position.set(0, 4.8, 5.15);
        garage.add(sign);

        // Fuel Dispensers
        const pump1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 1.0), redMat);
        pump1.position.set(-5, 1.2, 8);
        const pump2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 1.0), yellowMat);
        pump2.position.set(-2, 1.2, 8);
        garage.add(pump1, pump2);

        garage.position.set(x, y, z);
        this.scene.add(garage);
        this.repairStations.push({ x, z, radius: 14 });
        this.fuelStations.push({ x: x - 3.5, z: z + 8, radius: 8 });
    }

    buildFloraAndRocks() {
        // Procedurally distribute Banyan Trees, Palms, and Boulders across hills
        const treeCount = 60;
        const rockCount = 45;

        for (let i = 0; i < treeCount; i++) {
            const x = (Math.random() - 0.5) * 380;
            const z = (Math.random() - 0.5) * 380;
            // Don't place inside village hub or river
            if (Math.abs(x) < 30 && Math.abs(z) < 30) continue;
            if (x > 35 && x < 75) continue;

            const y = this.getHeightAt(x, z);
            const isPalm = Math.random() > 0.5;
            const tree = isPalm ? this._createPalmTree() : this._createBanyanTree();
            tree.position.set(x, y, z);
            tree.rotation.y = Math.random() * Math.PI * 2;
            const scale = 0.7 + Math.random() * 0.6;
            tree.scale.set(scale, scale, scale);
            this.scene.add(tree);
        }

        for (let i = 0; i < rockCount; i++) {
            const x = (Math.random() - 0.5) * 400;
            const z = (Math.random() - 0.5) * 400;
            if (Math.abs(x) < 25 && Math.abs(z) < 25) continue;

            const y = this.getHeightAt(x, z);
            const rock = this._createBoulder();
            rock.position.set(x, y + 0.3, z);
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            const scale = 0.8 + Math.random() * 1.5;
            rock.scale.set(scale, scale, scale);
            this.scene.add(rock);
        }
    }

    _createBanyanTree() {
        const group = new THREE.Group();
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4E342E, roughness: 0.9 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.8 });

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.2, 5, 8), trunkMat);
        trunk.position.y = 2.5;
        trunk.castShadow = true;
        group.add(trunk);

        const crown1 = new THREE.Mesh(new THREE.SphereGeometry(3.5, 8, 8), leafMat);
        crown1.position.set(0, 5.8, 0);
        const crown2 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), leafMat);
        crown2.position.set(1.5, 6.4, -1);
        group.add(crown1, crown2);

        return group;
    }

    _createPalmTree() {
        const group = new THREE.Group();
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, roughness: 0.9 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x388E3C, roughness: 0.7 });

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 7, 8), trunkMat);
        trunk.position.y = 3.5;
        trunk.rotation.z = 0.08;
        trunk.castShadow = true;
        group.add(trunk);

        for (let i = 0; i < 6; i++) {
            const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 4.0), leafMat);
            leaf.position.set(0, 7.2, 0);
            leaf.rotation.y = (i * Math.PI) / 3;
            leaf.rotation.x = 0.45;
            group.add(leaf);
        }

        return group;
    }

    _createBoulder() {
        const rockMat = new THREE.MeshStandardMaterial({ color: 0x616161, roughness: 0.9, metalness: 0.1 });
        const geom = new THREE.DodecahedronGeometry(1.2, 1);
        const mesh = new THREE.Mesh(geom, rockMat);
        mesh.castShadow = true;
        return mesh;
    }

    initRainSystem() {
        const rainCount = 1200;
        const geom = new THREE.BufferGeometry();
        const positions = [];

        for (let i = 0; i < rainCount; i++) {
            positions.push(
                (Math.random() - 0.5) * 250,
                Math.random() * 80,
                (Math.random() - 0.5) * 250
            );
        }

        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({
            color: 0xBBDEFB,
            size: 0.35,
            transparent: true,
            opacity: 0.7
        });

        this.rainParticles = new THREE.Points(geom, mat);
        this.rainParticles.visible = false;
        this.scene.add(this.rainParticles);
    }

    setWeather(weatherType) {
        this.weather = weatherType;
        if (weatherType === 'RAIN' || weatherType === 'HEAVY_RAIN') {
            this.rainParticles.visible = true;
            this.scene.fog.near = 15;
            this.scene.fog.far = 160;
        } else if (weatherType === 'FOG') {
            this.rainParticles.visible = false;
            this.scene.fog.near = 10;
            this.scene.fog.far = 90;
        } else {
            // SUNNY / CLEAR
            this.rainParticles.visible = false;
            this.scene.fog.near = this.fogNear;
            this.scene.fog.far = this.fogFar;
        }
    }

    update(delta, playerPos) {
        // Day/Night Cycle Progression
        this.timeOfDay = (this.timeOfDay + delta * 0.004) % 1.0;
        const angle = this.timeOfDay * Math.PI * 2;

        const sunX = Math.cos(angle) * 200;
        const sunY = Math.sin(angle) * 200;
        const sunZ = Math.sin(angle * 0.5) * 120;
        this.sunLight.position.set(sunX, Math.max(10, sunY), sunZ);

        // Day/Night Atmospheric Colors
        const isNight = sunY < 0;
        if (isNight) {
            this.ambientLight.intensity = 0.15;
            this.sunLight.intensity = 0.2;
            this.scene.background = new THREE.Color(0x060814);
            this.scene.fog.color.setHex(0x060814);
        } else {
            const dayRatio = Math.sin(angle);
            this.ambientLight.intensity = 0.3 + dayRatio * 0.25;
            this.sunLight.intensity = 0.6 + dayRatio * 0.6;
            this.scene.background = new THREE.Color(0x87CEEB);
            this.scene.fog.color.setHex(0xD7CCC8);
        }

        // Animate Rain around player
        if (this.rainParticles && this.rainParticles.visible && playerPos) {
            this.rainParticles.position.x = playerPos.x;
            this.rainParticles.position.z = playerPos.z;
            const pos = this.rainParticles.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                let y = pos.getY(i) - delta * 65;
                if (y < 0) y = 80;
                pos.setY(i, y);
            }
            pos.needsUpdate = true;
        }
    }
}

window.DesiWorld = DesiWorld;
