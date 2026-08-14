package com.example.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.MessageDigest

class GameRepository(private val database: AppDatabase) {

    private val userDao = database.userDao()
    private val vehicleDao = database.vehicleDao()
    private val missionDao = database.missionDao()
    private val leaderboardDao = database.leaderboardDao()

    private fun hashPassword(password: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(password.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }

    suspend fun getCurrentUser(): UserEntity? = withContext(Dispatchers.IO) {
        userDao.getFirstUser()
    }

    suspend fun registerUser(username: String, email: String, password: String):Result<UserEntity> = withContext(Dispatchers.IO) {
        if (username.isBlank() || password.length < 4) {
            return@withContext Result.failure(Exception("Username must be valid and password at least 4 chars."))
        }
        val existing = userDao.getUserByUsername(username)
        if (existing != null) {
            return@withContext Result.failure(Exception("Username already exists."))
        }
        val newUser = UserEntity(
            id = "user_${System.currentTimeMillis()}",
            username = username.trim(),
            email = email.trim(),
            passwordHash = hashPassword(password),
            level = 1,
            xp = 0,
            coins = 3000,
            reputation = 100,
            currentVehicleId = "thar_4x4"
        )
        userDao.insertUser(newUser)
        // Init vehicles for user
        val defaultVehicles = listOf(
            PlayerVehicleEntity("${newUser.id}_thar_4x4", newUser.id, "thar_4x4", true, "#E53935", 1, 1, 1, 1, 1, 1, 1, "DESI_WARRIOR", "CARRIER_LIGHTS", "HEAVY_BULLBAR", 1.15f),
            PlayerVehicleEntity("${newUser.id}_tractor_desi", newUser.id, "tractor_desi", false, "#1E88E5"),
            PlayerVehicleEntity("${newUser.id}_pickup_4x4", newUser.id, "pickup_4x4", false, "#43A047"),
            PlayerVehicleEntity("${newUser.id}_gorkha_beast", newUser.id, "gorkha_beast", false, "#FB8C00"),
            PlayerVehicleEntity("${newUser.id}_desi_truck_6x6", newUser.id, "desi_truck_6x6", false, "#8E24AA")
        )
        vehicleDao.insertVehicles(defaultVehicles)
        Result.success(newUser)
    }

    suspend fun loginUser(username: String, password: String): Result<UserEntity> = withContext(Dispatchers.IO) {
        val user = userDao.getUserByUsername(username) ?: userDao.getUserByEmail(username)
        if (user == null) {
            return@withContext Result.failure(Exception("User not found."))
        }
        if (user.passwordHash != hashPassword(password) && user.passwordHash != "guest_hash") {
            return@withContext Result.failure(Exception("Invalid password."))
        }
        Result.success(user)
    }

    suspend fun getPlayerVehicles(userId: String): List<PlayerVehicleEntity> = withContext(Dispatchers.IO) {
        vehicleDao.getVehiclesForUser(userId)
    }

    suspend fun buyVehicle(userId: String, vehicleId: String, price: Int): Result<UserEntity> = withContext(Dispatchers.IO) {
        val user = userDao.getUserById(userId) ?: return@withContext Result.failure(Exception("User not found"))
        if (user.coins < price) {
            return@withContext Result.failure(Exception("Insufficient coins! Complete more missions."))
        }
        val updatedUser = user.copy(coins = user.coins - price, currentVehicleId = vehicleId)
        userDao.updateUser(updatedUser)

        val vehicleKey = "${userId}_$vehicleId"
        val existing = vehicleDao.getVehicle(userId, vehicleId)
        if (existing != null) {
            vehicleDao.insertOrUpdateVehicle(existing.copy(isOwned = true))
        } else {
            vehicleDao.insertOrUpdateVehicle(
                PlayerVehicleEntity(
                    id = vehicleKey,
                    userId = userId,
                    vehicleId = vehicleId,
                    isOwned = true,
                    color = "#E53935",
                    engineUpgrade = 1,
                    transmissionUpgrade = 1,
                    suspensionUpgrade = 1,
                    tiresUpgrade = 1,
                    brakesUpgrade = 1,
                    fuelTankUpgrade = 1,
                    diffLockUpgrade = 1
                )
            )
        }
        Result.success(updatedUser)
    }

    suspend fun upgradeVehicle(
        userId: String,
        vehicleId: String,
        upgradeType: String,
        cost: Int
    ): Result<PlayerVehicleEntity> = withContext(Dispatchers.IO) {
        val user = userDao.getUserById(userId) ?: return@withContext Result.failure(Exception("User not found"))
        if (user.coins < cost) {
            return@withContext Result.failure(Exception("Not enough coins for upgrade!"))
        }
        val vehicle = vehicleDao.getVehicle(userId, vehicleId) ?: return@withContext Result.failure(Exception("Vehicle not found"))
        if (!vehicle.isOwned) {
            return@withContext Result.failure(Exception("Vehicle must be owned first!"))
        }

        val updatedVehicle = when (upgradeType.lowercase()) {
            "engine" -> vehicle.copy(engineUpgrade = (vehicle.engineUpgrade + 1).coerceAtMost(5))
            "transmission" -> vehicle.copy(transmissionUpgrade = (vehicle.transmissionUpgrade + 1).coerceAtMost(5))
            "suspension" -> vehicle.copy(suspensionUpgrade = (vehicle.suspensionUpgrade + 1).coerceAtMost(5))
            "tires" -> vehicle.copy(tiresUpgrade = (vehicle.tiresUpgrade + 1).coerceAtMost(5))
            "brakes" -> vehicle.copy(brakesUpgrade = (vehicle.brakesUpgrade + 1).coerceAtMost(5))
            "fueltank" -> vehicle.copy(fuelTankUpgrade = (vehicle.fuelTankUpgrade + 1).coerceAtMost(5))
            "difflock" -> vehicle.copy(diffLockUpgrade = (vehicle.diffLockUpgrade + 1).coerceAtMost(5))
            else -> vehicle
        }

        userDao.updateUser(user.copy(coins = user.coins - cost))
        vehicleDao.insertOrUpdateVehicle(updatedVehicle)
        Result.success(updatedVehicle)
    }

    suspend fun customizeVehicle(
        userId: String,
        vehicleId: String,
        color: String,
        decal: String,
        roofAccessory: String,
        bumper: String,
        suspensionLift: Float,
        cost: Int
    ): Result<PlayerVehicleEntity> = withContext(Dispatchers.IO) {
        val user = userDao.getUserById(userId) ?: return@withContext Result.failure(Exception("User not found"))
        if (cost > 0 && user.coins < cost) {
            return@withContext Result.failure(Exception("Not enough coins for custom parts!"))
        }
        val vehicle = vehicleDao.getVehicle(userId, vehicleId) ?: return@withContext Result.failure(Exception("Vehicle not found"))
        val updated = vehicle.copy(
            color = color,
            decal = decal,
            roofAccessory = roofAccessory,
            bumper = bumper,
            suspensionLift = suspensionLift
        )
        if (cost > 0) {
            userDao.updateUser(user.copy(coins = user.coins - cost))
        }
        vehicleDao.insertOrUpdateVehicle(updated)
        Result.success(updated)
    }

    suspend fun completeMission(
        userId: String,
        missionId: String,
        timeTakenSeconds: Float,
        damageTakenPct: Float,
        coinsEarned: Int,
        xpEarned: Int
    ): Result<UserEntity> = withContext(Dispatchers.IO) {
        // Anti-cheat verification
        val user = userDao.getUserById(userId) ?: return@withContext Result.failure(Exception("User not found"))
        val validatedCoins = coinsEarned.coerceIn(100, 10000)
        val validatedXp = xpEarned.coerceIn(50, 5000)

        var newXp = user.xp + validatedXp
        var newLevel = user.level
        var xpForNext = newLevel * 500
        while (newXp >= xpForNext) {
            newXp -= xpForNext
            newLevel++
            xpForNext = newLevel * 500
        }

        val updatedUser = user.copy(
            coins = user.coins + validatedCoins,
            xp = newXp,
            level = newLevel,
            reputation = user.reputation + 25
        )
        userDao.updateUser(updatedUser)

        val missionKey = "${userId}_$missionId"
        val existingMission = missionDao.getMission(userId, missionId)
        val bestTime = if (existingMission != null && existingMission.bestTimeSeconds > 0f) {
            minOf(existingMission.bestTimeSeconds, timeTakenSeconds)
        } else {
            timeTakenSeconds
        }
        val stars = when {
            damageTakenPct < 15f && timeTakenSeconds < 120f -> 3
            damageTakenPct < 40f -> 2
            else -> 1
        }
        missionDao.insertOrUpdateMission(
            PlayerMissionEntity(
                id = missionKey,
                userId = userId,
                missionId = missionId,
                completed = true,
                stars = maxOf(existingMission?.stars ?: 0, stars),
                bestTimeSeconds = bestTime,
                timesCompleted = (existingMission?.timesCompleted ?: 0) + 1
            )
        )

        Result.success(updatedUser)
    }

    suspend fun getPlayerMissions(userId: String): List<PlayerMissionEntity> = withContext(Dispatchers.IO) {
        missionDao.getMissionsForUser(userId)
    }

    suspend fun getLeaderboards(isWeekly: Boolean): List<LeaderboardEntryEntity> = withContext(Dispatchers.IO) {
        leaderboardDao.getLeaderboard(isWeekly)
    }

    suspend fun saveSettings(userId: String, soundVol: Float, musicVol: Float, graphics: String, currentVehicle: String) = withContext(Dispatchers.IO) {
        val user = userDao.getUserById(userId) ?: return@withContext
        userDao.updateUser(
            user.copy(
                soundVolume = soundVol,
                musicVolume = musicVol,
                graphicsQuality = graphics,
                currentVehicleId = currentVehicle
            )
        )
    }
}
