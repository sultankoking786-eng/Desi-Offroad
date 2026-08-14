package com.example.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Query("SELECT * FROM users WHERE id = :userId LIMIT 1")
    suspend fun getUserById(userId: String): UserEntity?

    @Query("SELECT * FROM users WHERE username = :username LIMIT 1")
    suspend fun getUserByUsername(username: String): UserEntity?

    @Query("SELECT * FROM users WHERE email = :email LIMIT 1")
    suspend fun getUserByEmail(email: String): UserEntity?

    @Query("SELECT * FROM users LIMIT 1")
    suspend fun getFirstUser(): UserEntity?

    @Query("SELECT * FROM users LIMIT 1")
    fun observeCurrentUser(): Flow<UserEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Update
    suspend fun updateUser(user: UserEntity)
}

@Dao
interface VehicleDao {
    @Query("SELECT * FROM player_vehicles WHERE userId = :userId")
    suspend fun getVehiclesForUser(userId: String): List<PlayerVehicleEntity>

    @Query("SELECT * FROM player_vehicles WHERE userId = :userId")
    fun observeVehiclesForUser(userId: String): Flow<List<PlayerVehicleEntity>>

    @Query("SELECT * FROM player_vehicles WHERE userId = :userId AND vehicleId = :vehicleId LIMIT 1")
    suspend fun getVehicle(userId: String, vehicleId: String): PlayerVehicleEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateVehicle(vehicle: PlayerVehicleEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertVehicles(vehicles: List<PlayerVehicleEntity>)
}

@Dao
interface MissionDao {
    @Query("SELECT * FROM player_missions WHERE userId = :userId")
    suspend fun getMissionsForUser(userId: String): List<PlayerMissionEntity>

    @Query("SELECT * FROM player_missions WHERE userId = :userId")
    fun observeMissionsForUser(userId: String): Flow<List<PlayerMissionEntity>>

    @Query("SELECT * FROM player_missions WHERE userId = :userId AND missionId = :missionId LIMIT 1")
    suspend fun getMission(userId: String, missionId: String): PlayerMissionEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateMission(mission: PlayerMissionEntity)
}

@Dao
interface LeaderboardDao {
    @Query("SELECT * FROM leaderboard_entries WHERE isWeekly = :isWeekly ORDER BY score DESC LIMIT 50")
    suspend fun getLeaderboard(isWeekly: Boolean): List<LeaderboardEntryEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEntries(entries: List<LeaderboardEntryEntity>)
}
