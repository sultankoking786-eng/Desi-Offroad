/**
 * Desi Offroad — Backend & Database Bridge
 * Handles Authentication, Player Progress, Economy, Garage Upgrades,
 * Anti-Cheat Server Validation, Leaderboards, and Native Room DB Sync.
 */
class DesiBackendService {
    constructor() {
        this.callbacks = {};
        this.callbackCounter = 0;
        this.isNative = typeof window.AndroidNativeBridge !== 'undefined';
        this.storageKey = 'desi_offroad_save_v1';
        this.currentUser = null;
        this.initStorage();
    }

    initStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialData = {
                user: {
                    id: "driver_default",
                    username: "DesiRider_007",
                    email: "desirider@village.in",
                    level: 1,
                    xp: 150,
                    coins: 3000,
                    reputation: 120,
                    currentVehicleId: "thar_4x4",
                    soundVolume: 0.8,
                    musicVolume: 0.6,
                    graphicsQuality: "HIGH"
                },
                vehicles: [
                    {
                        id: "driver_default_thar_4x4",
                        userId: "driver_default",
                        vehicleId: "thar_4x4",
                        isOwned: true,
                        color: "#E53935",
                        engineUpgrade: 1,
                        transmissionUpgrade: 1,
                        suspensionUpgrade: 1,
                        tiresUpgrade: 1,
                        brakesUpgrade: 1,
                        fuelTankUpgrade: 1,
                        diffLockUpgrade: 1,
                        decal: "DESI_WARRIOR",
                        roofAccessory: "CARRIER_LIGHTS",
                        bumper: "HEAVY_BULLBAR",
                        suspensionLift: 1.15
                    },
                    {
                        id: "driver_default_tractor_desi",
                        userId: "driver_default",
                        vehicleId: "tractor_desi",
                        isOwned: false,
                        color: "#1E88E5",
                        engineUpgrade: 0,
                        transmissionUpgrade: 0,
                        suspensionUpgrade: 0,
                        tiresUpgrade: 0,
                        brakesUpgrade: 0,
                        fuelTankUpgrade: 0,
                        diffLockUpgrade: 0,
                        decal: "NONE",
                        roofAccessory: "STANDARD",
                        bumper: "STANDARD",
                        suspensionLift: 1.0
                    },
                    {
                        id: "driver_default_pickup_4x4",
                        userId: "driver_default",
                        vehicleId: "pickup_4x4",
                        isOwned: false,
                        color: "#43A047",
                        engineUpgrade: 0,
                        transmissionUpgrade: 0,
                        suspensionUpgrade: 0,
                        tiresUpgrade: 0,
                        brakesUpgrade: 0,
                        fuelTankUpgrade: 0,
                        diffLockUpgrade: 0,
                        decal: "NONE",
                        roofAccessory: "STANDARD",
                        bumper: "STANDARD",
                        suspensionLift: 1.0
                    },
                    {
                        id: "driver_default_gorkha_beast",
                        userId: "driver_default",
                        vehicleId: "gorkha_beast",
                        isOwned: false,
                        color: "#FB8C00",
                        engineUpgrade: 0,
                        transmissionUpgrade: 0,
                        suspensionUpgrade: 0,
                        tiresUpgrade: 0,
                        brakesUpgrade: 0,
                        fuelTankUpgrade: 0,
                        diffLockUpgrade: 0,
                        decal: "NONE",
                        roofAccessory: "STANDARD",
                        bumper: "STANDARD",
                        suspensionLift: 1.0
                    },
                    {
                        id: "driver_default_desi_truck_6x6",
                        userId: "driver_default",
                        vehicleId: "desi_truck_6x6",
                        isOwned: false,
                        color: "#8E24AA",
                        engineUpgrade: 0,
                        transmissionUpgrade: 0,
                        suspensionUpgrade: 0,
                        tiresUpgrade: 0,
                        brakesUpgrade: 0,
                        fuelTankUpgrade: 0,
                        diffLockUpgrade: 0,
                        decal: "NONE",
                        roofAccessory: "STANDARD",
                        bumper: "STANDARD",
                        suspensionLift: 1.0
                    }
                ],
                missions: {},
                leaderboard: [
                    { rank: 1, username: "Raju_Offroader", level: 15, xp: 8400, score: 15200, bestTime: 84.5, vehicleName: "Gorkha Beast" },
                    { rank: 2, username: "Veer_Singh_Punjab", level: 12, xp: 6200, score: 12800, bestTime: 92.1, vehicleName: "Desi 6x6 Hauler" },
                    { rank: 3, username: "Kisan_King", level: 10, xp: 4900, score: 10400, bestTime: 98.4, vehicleName: "Tractor Pro" },
                    { rank: 4, username: "Pooja_Racer", level: 8, xp: 3800, score: 8900, bestTime: 105.2, vehicleName: "Thar 4x4 Custom" },
                    { rank: 5, username: "DesiRider_007", level: 1, xp: 150, score: 2400, bestTime: 142.0, vehicleName: "Thar 4x4" },
                    { rank: 6, username: "Himalaya_Biker", level: 6, xp: 2600, score: 6100, bestTime: 118.7, vehicleName: "Pickup 4x4" },
                    { rank: 7, username: "Chauhan_Speed", level: 5, xp: 2100, score: 5200, bestTime: 126.3, vehicleName: "Thar 4x4" }
                ]
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialData));
        }
    }

    getLocalDB() {
        return JSON.parse(localStorage.getItem(this.storageKey));
    }

    saveLocalDB(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    triggerHaptic(type) {
        if (this.isNative) {
            try { window.AndroidNativeBridge.triggerHaptic(type); } catch (e) {}
        }
    }

    registerCallback(resolve, reject) {
        const id = 'cb_' + (++this.callbackCounter);
        this.callbacks[id] = { resolve, reject };
        return id;
    }

    handleNativeResponse(callbackId, success, dataJsonStr) {
        if (this.callbacks[callbackId]) {
            const { resolve, reject } = this.callbacks[callbackId];
            delete this.callbacks[callbackId];
            try {
                const parsed = JSON.parse(dataJsonStr);
                if (success) resolve(parsed);
                else reject(new Error(parsed.error || 'Native error'));
            } catch (e) {
                if (success) resolve(dataJsonStr);
                else reject(e);
            }
        }
    }

    async getProfile() {
        if (this.isNative) {
            return new Promise((res, rej) => {
                const cbId = this.registerCallback(res, rej);
                window.AndroidNativeBridge.getProfile(cbId);
            });
        }
        const db = this.getLocalDB();
        this.currentUser = db.user;
        return db.user;
    }

    async login(username, password) {
        if (this.isNative) {
            return new Promise((res, rej) => {
                const cbId = this.registerCallback(res, rej);
                window.AndroidNativeBridge.login(JSON.stringify({ username, password }), cbId);
            });
        }
        const db = this.getLocalDB();
        db.user.username = username;
        this.saveLocalDB(db);
        this.currentUser = db.user;
        return db.user;
    }

    async register(username, email, password) {
        if (this.isNative) {
            return new Promise((res, rej) => {
                const cbId = this.registerCallback(res, rej);
                window.AndroidNativeBridge.register(JSON.stringify({ username, email, password }), cbId);
            });
        }
        const db = this.getLocalDB();
        db.user.id = "user_" + Date.now();
        db.user.username = username;
        db.user.email = email || `${username}@village.in`;
        db.user.coins = 3000;
        db.user.xp = 0;
        db.user.level = 1;
        this.saveLocalDB(db);
        this.currentUser = db.user;
        return db.user;
    }

    async getVehicles(userId) {
        if (this.isNative) {
            return new Promise((res, rej) => {
                const cbId = this.registerCallback(res, rej);
                window.AndroidNativeBridge.getPlayerVehicles(userId || 'driver_default', cbId);
            });
        }
        const db = this.getLocalDB();
        return db.vehicles;
    }

    async buyVehicle(userId, vehicleId, price) {
        if (this.isNative) {
            return new Promise((res, rej) => {
                const cbId = this.registerCallback(res, rej);
                window.AndroidNativeBridge.buyVehicle(JSON.stringify({ userId, vehicleId, price }), cbId);
            });
        }
        const db = this.getLocalDB();
        if (db.user.coins < price) throw new Error("Insufficient coins!");
        db.user.coins -= price;
        db.user.currentVehicleId = vehicleId;
        const v = db.vehicles.find(item => item.vehicleId === vehicleId);
        if (v) v.isOwned = true;
        this.saveLocalDB(db);
        return { coins: db.user.coins, currentVehicleId: vehicleId };
    }

    async upgradeVehicle(userId, vehicleId, upgradeType, cost) {
        if (this.isNative) {
            return new Promise((res, rej) => {
                const cbId = this.registerCallback(res, rej);
                window.AndroidNativeBridge.upgradeVehicle(JSON.stringify({ userId, vehicleId, upgradeType, cost }), cbId);
            });
        }
        const db = this.getLocalDB();
        if (db.user.coins < cost) throw new Error("Insufficient coins!");
        db.user.coins -= cost;
        const v = db.vehicles.find(item => item.vehicleId === vehicleId);
        if (!v) throw new Error("Vehicle not found!");
        const key = upgradeType.toLowerCase() + "Upgrade";
        if (v[key] !== undefined) {
            v[key] = Math.min(5, (v[key] || 0) + 1);
        }
        this.saveLocalDB(db);
        return v;
    }

    async customizeVehicle(userId, vehicleId, color, decal, roofAccessory, bumper, suspensionLift, cost = 0) {
        if (this.isNative) {
            return new Promise((res, rej) => {
                const cbId = this.registerCallback(res, rej);
                window.AndroidNativeBridge.customizeVehicle(JSON.stringify({ userId, vehicleId, color, decal, roofAccessory, bumper, suspensionLift, cost }), cbId);
            });
        }
        const db = this.getLocalDB();
        if (cost > 0) {
            if (db.user.coins < cost) throw new Error("Insufficient coins!");
            db.user.coins -= cost;
        }
        const v = db.vehicles.find(item => item.vehicleId === vehicleId);
        if (v) {
            v.color = color;
            v.decal = decal;
            v.roofAccessory = roofAccessory;
            v.bumper = bumper;
            v.suspensionLift = suspensionLift;
        }
        this.saveLocalDB(db);
        return v;
    }

    /**
     * Anti-Cheat Validated Mission Reward Claim
     */
    async completeMission(userId, missionId, timeTaken, damageTaken, coinsEarned, xpEarned) {
        // Sanitize client parameters
        const validCoins = Math.min(10000, Math.max(50, Math.round(coinsEarned)));
        const validXp = Math.min(5000, Math.max(25, Math.round(xpEarned)));

        if (this.isNative) {
            return new Promise((res, rej) => {
                const cbId = this.registerCallback(res, rej);
                window.AndroidNativeBridge.completeMission(JSON.stringify({
                    userId, missionId, timeTaken, damageTaken, coinsEarned: validCoins, xpEarned: validXp
                }), cbId);
            });
        }

        const db = this.getLocalDB();
        db.user.coins += validCoins;
        db.user.xp += validXp;
        db.user.reputation += 25;

        // Level progression
        let xpThreshold = db.user.level * 500;
        while (db.user.xp >= xpThreshold) {
            db.user.xp -= xpThreshold;
            db.user.level += 1;
            xpThreshold = db.user.level * 500;
        }

        if (!db.missions) db.missions = {};
        const stars = damageTaken < 15 && timeTaken < 120 ? 3 : (damageTaken < 40 ? 2 : 1);
        db.missions[missionId] = {
            completed: true,
            stars: Math.max(db.missions[missionId]?.stars || 0, stars),
            bestTime: db.missions[missionId]?.bestTime ? Math.min(db.missions[missionId].bestTime, timeTaken) : timeTaken
        };

        this.saveLocalDB(db);
        return db.user;
    }

    async getLeaderboard(isWeekly = false) {
        if (this.isNative) {
            return new Promise((res, rej) => {
                const cbId = this.registerCallback(res, rej);
                window.AndroidNativeBridge.getLeaderboards(isWeekly, cbId);
            });
        }
        const db = this.getLocalDB();
        return db.leaderboard;
    }

    saveSettings(userId, soundVol, musicVol, graphics, vehicleId) {
        if (this.isNative) {
            window.AndroidNativeBridge.saveSettings(JSON.stringify({
                userId, soundVolume: soundVol, musicVolume: musicVol, graphicsQuality: graphics, currentVehicleId: vehicleId
            }));
        }
        const db = this.getLocalDB();
        db.user.soundVolume = soundVol;
        db.user.musicVolume = musicVol;
        db.user.graphicsQuality = graphics;
        db.user.currentVehicleId = vehicleId;
        this.saveLocalDB(db);
    }
}

window.DesiBackend = new DesiBackendService();
window.onNativeBridgeResponse = (cbId, success, data) => {
    window.DesiBackend.handleNativeResponse(cbId, success, data);
};
