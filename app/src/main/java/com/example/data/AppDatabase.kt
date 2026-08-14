package com.example.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        UserEntity::class,
        PlayerVehicleEntity::class,
        PlayerMissionEntity::class,
        LeaderboardEntryEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun vehicleDao(): VehicleDao
    abstract fun missionDao(): MissionDao
    abstract fun leaderboardDao(): LeaderboardDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "desi_offroad_database"
                )
                .addCallback(DatabaseCallback())
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }

        private class DatabaseCallback : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                // Pre-populate default starter user and leaderboards
                CoroutineScope(Dispatchers.IO).launch {
                    INSTANCE?.let { database ->
                        val defaultUserId = "driver_default"
                        database.userDao().insertUser(
                            UserEntity(
                                id = defaultUserId,
                                username = "DesiRider_007",
                                email = "desirider@village.in",
                                passwordHash = "guest_hash",
                                level = 1,
                                xp = 150,
                                coins = 3000,
                                reputation = 120,
                                currentVehicleId = "thar_4x4"
                            )
                        )

                        // Default starter vehicle
                        database.vehicleDao().insertVehicles(
                            listOf(
                                PlayerVehicleEntity(
                                    id = "${defaultUserId}_thar_4x4",
                                    userId = defaultUserId,
                                    vehicleId = "thar_4x4",
                                    isOwned = true,
                                    color = "#E53935",
                                    engineUpgrade = 1,
                                    transmissionUpgrade = 1,
                                    suspensionUpgrade = 1,
                                    tiresUpgrade = 1,
                                    brakesUpgrade = 1,
                                    fuelTankUpgrade = 1,
                                    diffLockUpgrade = 1,
                                    decal = "DESI_WARRIOR",
                                    roofAccessory = "CARRIER_LIGHTS",
                                    bumper = "HEAVY_BULLBAR",
                                    suspensionLift = 1.15f
                                ),
                                PlayerVehicleEntity(
                                    id = "${defaultUserId}_tractor_desi",
                                    userId = defaultUserId,
                                    vehicleId = "tractor_desi",
                                    isOwned = false,
                                    color = "#1E88E5",
                                    engineUpgrade = 0,
                                    transmissionUpgrade = 0,
                                    suspensionUpgrade = 0,
                                    tiresUpgrade = 0,
                                    brakesUpgrade = 0,
                                    fuelTankUpgrade = 0,
                                    diffLockUpgrade = 0
                                ),
                                PlayerVehicleEntity(
                                    id = "${defaultUserId}_pickup_4x4",
                                    userId = defaultUserId,
                                    vehicleId = "pickup_4x4",
                                    isOwned = false,
                                    color = "#43A047",
                                    engineUpgrade = 0,
                                    transmissionUpgrade = 0,
                                    suspensionUpgrade = 0,
                                    tiresUpgrade = 0,
                                    brakesUpgrade = 0,
                                    fuelTankUpgrade = 0,
                                    diffLockUpgrade = 0
                                ),
                                PlayerVehicleEntity(
                                    id = "${defaultUserId}_gorkha_beast",
                                    userId = defaultUserId,
                                    vehicleId = "gorkha_beast",
                                    isOwned = false,
                                    color = "#FB8C00",
                                    engineUpgrade = 0,
                                    transmissionUpgrade = 0,
                                    suspensionUpgrade = 0,
                                    tiresUpgrade = 0,
                                    brakesUpgrade = 0,
                                    fuelTankUpgrade = 0,
                                    diffLockUpgrade = 0
                                ),
                                PlayerVehicleEntity(
                                    id = "${defaultUserId}_desi_truck_6x6",
                                    userId = defaultUserId,
                                    vehicleId = "desi_truck_6x6",
                                    isOwned = false,
                                    color = "#8E24AA",
                                    engineUpgrade = 0,
                                    transmissionUpgrade = 0,
                                    suspensionUpgrade = 0,
                                    tiresUpgrade = 0,
                                    brakesUpgrade = 0,
                                    fuelTankUpgrade = 0,
                                    diffLockUpgrade = 0
                                )
                            )
                        )

                        // Default leaderboards
                        val sampleLeaders = listOf(
                            LeaderboardEntryEntity("lb1", "Raju_Offroader", 15, 8400, 15200, 84.5f, "Gorkha Beast", 1),
                            LeaderboardEntryEntity("lb2", "Veer_Singh_Punjab", 12, 6200, 12800, 92.1f, "Desi 6x6 Hauler", 2),
                            LeaderboardEntryEntity("lb3", "Kisan_King", 10, 4900, 10400, 98.4f, "Tractor Pro", 3),
                            LeaderboardEntryEntity("lb4", "Pooja_Racer", 8, 3800, 8900, 105.2f, "Thar 4x4 Custom", 4),
                            LeaderboardEntryEntity("lb5", "DesiRider_007", 1, 150, 2400, 142.0f, "Thar 4x4", 5),
                            LeaderboardEntryEntity("lb6", "Himalaya_Biker", 6, 2600, 6100, 118.7f, "Pickup 4x4", 6),
                            LeaderboardEntryEntity("lb7", "Chauhan_Speed", 5, 2100, 5200, 126.3f, "Thar 4x4", 7)
                        )
                        database.leaderboardDao().insertEntries(sampleLeaders)
                    }
                }
            }
        }
    }
}
