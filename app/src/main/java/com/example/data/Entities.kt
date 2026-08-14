package com.example.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: String,
    val username: String,
    val email: String,
    val passwordHash: String,
    val level: Int = 1,
    val xp: Int = 0,
    val coins: Int = 2500,
    val reputation: Int = 100,
    val currentVehicleId: String = "thar_4x4",
    val soundVolume: Float = 0.8f,
    val musicVolume: Float = 0.6f,
    val graphicsQuality: String = "HIGH",
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "player_vehicles")
data class PlayerVehicleEntity(
    @PrimaryKey val id: String, // userId_vehicleId
    val userId: String,
    val vehicleId: String,
    val isOwned: Boolean,
    val color: String,
    val engineUpgrade: Int = 0,
    val transmissionUpgrade: Int = 0,
    val suspensionUpgrade: Int = 0,
    val tiresUpgrade: Int = 0,
    val brakesUpgrade: Int = 0,
    val fuelTankUpgrade: Int = 0,
    val diffLockUpgrade: Int = 0,
    val decal: String = "NONE",
    val roofAccessory: String = "STANDARD",
    val bumper: String = "STANDARD",
    val suspensionLift: Float = 1.0f
)

@Entity(tableName = "player_missions")
data class PlayerMissionEntity(
    @PrimaryKey val id: String, // userId_missionId
    val userId: String,
    val missionId: String,
    val completed: Boolean,
    val stars: Int = 0,
    val bestTimeSeconds: Float = 0f,
    val timesCompleted: Int = 0
)

@Entity(tableName = "leaderboard_entries")
data class LeaderboardEntryEntity(
    @PrimaryKey val id: String,
    val username: String,
    val level: Int,
    val xp: Int,
    val score: Int,
    val bestTime: Float,
    val vehicleName: String,
    val rank: Int,
    val isWeekly: Boolean = false
)
