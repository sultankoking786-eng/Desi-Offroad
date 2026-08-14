package com.example.bridge

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.example.data.AppDatabase
import com.example.data.GameRepository
import com.example.data.UserEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

class GameBridge(
    private val context: Context,
    private val webView: WebView,
    private val scope: CoroutineScope
) {
    private val repository = GameRepository(AppDatabase.getDatabase(context))
    private var currentUser: UserEntity? = null

    private val vibrator: Vibrator? by lazy {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            vibratorManager?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }
    }

    private fun sendCallbackToWeb(callbackId: String, success: Boolean, dataJson: String) {
        scope.launch(Dispatchers.Main) {
            val safeData = JSONObject.quote(dataJson)
            val js = "window.onNativeBridgeResponse && window.onNativeBridgeResponse('$callbackId', $success, $safeData);"
            webView.evaluateJavascript(js, null)
        }
    }

    @JavascriptInterface
    fun triggerHaptic(type: String) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                when (type) {
                    "impact" -> vibrator?.vibrate(VibrationEffect.createOneShot(45, VibrationEffect.DEFAULT_AMPLITUDE))
                    "engine" -> vibrator?.vibrate(VibrationEffect.createOneShot(15, 60))
                    "crash" -> vibrator?.vibrate(VibrationEffect.createOneShot(120, VibrationEffect.DEFAULT_AMPLITUDE))
                    "horn" -> vibrator?.vibrate(VibrationEffect.createOneShot(80, 100))
                    "click" -> vibrator?.vibrate(VibrationEffect.createOneShot(20, 80))
                }
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(30)
            }
        } catch (_: Exception) {}
    }

    @JavascriptInterface
    fun getProfile(callbackId: String) {
        scope.launch(Dispatchers.IO) {
            val user = repository.getCurrentUser()
            currentUser = user
            if (user != null) {
                val json = JSONObject().apply {
                    put("id", user.id)
                    put("username", user.username)
                    put("email", user.email)
                    put("level", user.level)
                    put("xp", user.xp)
                    put("coins", user.coins)
                    put("reputation", user.reputation)
                    put("currentVehicleId", user.currentVehicleId)
                    put("soundVolume", user.soundVolume.toDouble())
                    put("musicVolume", user.musicVolume.toDouble())
                    put("graphicsQuality", user.graphicsQuality)
                }
                sendCallbackToWeb(callbackId, true, json.toString())
            } else {
                sendCallbackToWeb(callbackId, false, JSONObject().put("error", "No user found").toString())
            }
        }
    }

    @JavascriptInterface
    fun login(credentialsJson: String, callbackId: String) {
        scope.launch(Dispatchers.IO) {
            try {
                val json = JSONObject(credentialsJson)
                val username = json.getString("username")
                val password = json.getString("password")
                val result = repository.loginUser(username, password)
                result.fold(
                    onSuccess = { user ->
                        currentUser = user
                        val resp = JSONObject().apply {
                            put("id", user.id)
                            put("username", user.username)
                            put("email", user.email)
                            put("level", user.level)
                            put("xp", user.xp)
                            put("coins", user.coins)
                            put("reputation", user.reputation)
                            put("currentVehicleId", user.currentVehicleId)
                        }
                        sendCallbackToWeb(callbackId, true, resp.toString())
                    },
                    onFailure = { err ->
                        sendCallbackToWeb(callbackId, false, JSONObject().put("error", err.message).toString())
                    }
                )
            } catch (e: Exception) {
                sendCallbackToWeb(callbackId, false, JSONObject().put("error", e.message).toString())
            }
        }
    }

    @JavascriptInterface
    fun register(credentialsJson: String, callbackId: String) {
        scope.launch(Dispatchers.IO) {
            try {
                val json = JSONObject(credentialsJson)
                val username = json.getString("username")
                val email = json.optString("email", "$username@village.in")
                val password = json.getString("password")
                val result = repository.registerUser(username, email, password)
                result.fold(
                    onSuccess = { user ->
                        currentUser = user
                        val resp = JSONObject().apply {
                            put("id", user.id)
                            put("username", user.username)
                            put("email", user.email)
                            put("level", user.level)
                            put("xp", user.xp)
                            put("coins", user.coins)
                            put("reputation", user.reputation)
                            put("currentVehicleId", user.currentVehicleId)
                        }
                        sendCallbackToWeb(callbackId, true, resp.toString())
                    },
                    onFailure = { err ->
                        sendCallbackToWeb(callbackId, false, JSONObject().put("error", err.message).toString())
                    }
                )
            } catch (e: Exception) {
                sendCallbackToWeb(callbackId, false, JSONObject().put("error", e.message).toString())
            }
        }
    }

    @JavascriptInterface
    fun getPlayerVehicles(userId: String, callbackId: String) {
        scope.launch(Dispatchers.IO) {
            val list = repository.getPlayerVehicles(userId)
            val array = JSONArray()
            list.forEach { v ->
                array.put(JSONObject().apply {
                    put("id", v.id)
                    put("vehicleId", v.vehicleId)
                    put("isOwned", v.isOwned)
                    put("color", v.color)
                    put("engineUpgrade", v.engineUpgrade)
                    put("transmissionUpgrade", v.transmissionUpgrade)
                    put("suspensionUpgrade", v.suspensionUpgrade)
                    put("tiresUpgrade", v.tiresUpgrade)
                    put("brakesUpgrade", v.brakesUpgrade)
                    put("fuelTankUpgrade", v.fuelTankUpgrade)
                    put("diffLockUpgrade", v.diffLockUpgrade)
                    put("decal", v.decal)
                    put("roofAccessory", v.roofAccessory)
                    put("bumper", v.bumper)
                    put("suspensionLift", v.suspensionLift.toDouble())
                })
            }
            sendCallbackToWeb(callbackId, true, array.toString())
        }
    }

    @JavascriptInterface
    fun buyVehicle(paramsJson: String, callbackId: String) {
        scope.launch(Dispatchers.IO) {
            try {
                val json = JSONObject(paramsJson)
                val userId = json.getString("userId")
                val vehicleId = json.getString("vehicleId")
                val price = json.getInt("price")
                val result = repository.buyVehicle(userId, vehicleId, price)
                result.fold(
                    onSuccess = { user ->
                        val resp = JSONObject().apply {
                            put("coins", user.coins)
                            put("currentVehicleId", user.currentVehicleId)
                        }
                        sendCallbackToWeb(callbackId, true, resp.toString())
                    },
                    onFailure = { err ->
                        sendCallbackToWeb(callbackId, false, JSONObject().put("error", err.message).toString())
                    }
                )
            } catch (e: Exception) {
                sendCallbackToWeb(callbackId, false, JSONObject().put("error", e.message).toString())
            }
        }
    }

    @JavascriptInterface
    fun upgradeVehicle(paramsJson: String, callbackId: String) {
        scope.launch(Dispatchers.IO) {
            try {
                val json = JSONObject(paramsJson)
                val userId = json.getString("userId")
                val vehicleId = json.getString("vehicleId")
                val upgradeType = json.getString("upgradeType")
                val cost = json.getInt("cost")
                val result = repository.upgradeVehicle(userId, vehicleId, upgradeType, cost)
                result.fold(
                    onSuccess = { v ->
                        val resp = JSONObject().apply {
                            put("vehicleId", v.vehicleId)
                            put("engineUpgrade", v.engineUpgrade)
                            put("transmissionUpgrade", v.transmissionUpgrade)
                            put("suspensionUpgrade", v.suspensionUpgrade)
                            put("tiresUpgrade", v.tiresUpgrade)
                            put("brakesUpgrade", v.brakesUpgrade)
                            put("fuelTankUpgrade", v.fuelTankUpgrade)
                            put("diffLockUpgrade", v.diffLockUpgrade)
                        }
                        sendCallbackToWeb(callbackId, true, resp.toString())
                    },
                    onFailure = { err ->
                        sendCallbackToWeb(callbackId, false, JSONObject().put("error", err.message).toString())
                    }
                )
            } catch (e: Exception) {
                sendCallbackToWeb(callbackId, false, JSONObject().put("error", e.message).toString())
            }
        }
    }

    @JavascriptInterface
    fun customizeVehicle(paramsJson: String, callbackId: String) {
        scope.launch(Dispatchers.IO) {
            try {
                val json = JSONObject(paramsJson)
                val userId = json.getString("userId")
                val vehicleId = json.getString("vehicleId")
                val color = json.getString("color")
                val decal = json.optString("decal", "NONE")
                val roofAccessory = json.optString("roofAccessory", "STANDARD")
                val bumper = json.optString("bumper", "STANDARD")
                val suspensionLift = json.optDouble("suspensionLift", 1.0).toFloat()
                val cost = json.optInt("cost", 0)
                val result = repository.customizeVehicle(userId, vehicleId, color, decal, roofAccessory, bumper, suspensionLift, cost)
                result.fold(
                    onSuccess = { v ->
                        val resp = JSONObject().apply {
                            put("vehicleId", v.vehicleId)
                            put("color", v.color)
                            put("decal", v.decal)
                            put("roofAccessory", v.roofAccessory)
                            put("bumper", v.bumper)
                            put("suspensionLift", v.suspensionLift.toDouble())
                        }
                        sendCallbackToWeb(callbackId, true, resp.toString())
                    },
                    onFailure = { err ->
                        sendCallbackToWeb(callbackId, false, JSONObject().put("error", err.message).toString())
                    }
                )
            } catch (e: Exception) {
                sendCallbackToWeb(callbackId, false, JSONObject().put("error", e.message).toString())
            }
        }
    }

    @JavascriptInterface
    fun completeMission(paramsJson: String, callbackId: String) {
        scope.launch(Dispatchers.IO) {
            try {
                val json = JSONObject(paramsJson)
                val userId = json.getString("userId")
                val missionId = json.getString("missionId")
                val timeTaken = json.getDouble("timeTaken").toFloat()
                val damageTaken = json.getDouble("damageTaken").toFloat()
                val coinsEarned = json.getInt("coinsEarned")
                val xpEarned = json.getInt("xpEarned")
                val result = repository.completeMission(userId, missionId, timeTaken, damageTaken, coinsEarned, xpEarned)
                result.fold(
                    onSuccess = { user ->
                        val resp = JSONObject().apply {
                            put("level", user.level)
                            put("xp", user.xp)
                            put("coins", user.coins)
                            put("reputation", user.reputation)
                        }
                        sendCallbackToWeb(callbackId, true, resp.toString())
                    },
                    onFailure = { err ->
                        sendCallbackToWeb(callbackId, false, JSONObject().put("error", err.message).toString())
                    }
                )
            } catch (e: Exception) {
                sendCallbackToWeb(callbackId, false, JSONObject().put("error", e.message).toString())
            }
        }
    }

    @JavascriptInterface
    fun getPlayerMissions(userId: String, callbackId: String) {
        scope.launch(Dispatchers.IO) {
            val list = repository.getPlayerMissions(userId)
            val array = JSONArray()
            list.forEach { m ->
                array.put(JSONObject().apply {
                    put("missionId", m.missionId)
                    put("completed", m.completed)
                    put("stars", m.stars)
                    put("bestTimeSeconds", m.bestTimeSeconds.toDouble())
                    put("timesCompleted", m.timesCompleted)
                })
            }
            sendCallbackToWeb(callbackId, true, array.toString())
        }
    }

    @JavascriptInterface
    fun getLeaderboards(isWeekly: Boolean, callbackId: String) {
        scope.launch(Dispatchers.IO) {
            val list = repository.getLeaderboards(isWeekly)
            val array = JSONArray()
            list.forEach { entry ->
                array.put(JSONObject().apply {
                    put("rank", entry.rank)
                    put("username", entry.username)
                    put("level", entry.level)
                    put("xp", entry.xp)
                    put("score", entry.score)
                    put("bestTime", entry.bestTime.toDouble())
                    put("vehicleName", entry.vehicleName)
                })
            }
            sendCallbackToWeb(callbackId, true, array.toString())
        }
    }

    @JavascriptInterface
    fun saveSettings(settingsJson: String) {
        scope.launch(Dispatchers.IO) {
            try {
                val json = JSONObject(settingsJson)
                val userId = json.getString("userId")
                val soundVol = json.getDouble("soundVolume").toFloat()
                val musicVol = json.getDouble("musicVolume").toFloat()
                val graphics = json.getString("graphicsQuality")
                val vehicleId = json.getString("currentVehicleId")
                repository.saveSettings(userId, soundVol, musicVol, graphics, vehicleId)
            } catch (_: Exception) {}
        }
    }
}
