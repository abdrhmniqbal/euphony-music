package com.startune.music.appupdater

import android.app.DownloadManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val NOTIFICATION_CHANNEL = "app_update_download"
private const val NOTIFICATION_ID = 1001

class InstallBroadcastReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val downloadId = intent.getLongExtra("download_id", -1L)
    if (downloadId != -1L) {
      AppUpdaterModule.installApk(context, downloadId)
    }
  }
}

class AppUpdaterModule : Module() {
  companion object {
    private const val TAG = "AppUpdater"
    private var handler: Handler? = null
    private var currentDownloadId: Long = -1L
    private var receiverRegistered = false

    fun installApk(context: Context, downloadId: Long) {
      try {
        val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val uri = dm.getUriForDownloadedFile(downloadId)
        if (uri != null) {
          val installIntent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          }
          context.startActivity(installIntent)
        }
      } catch (_: Exception) {
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("AppUpdater")

    AsyncFunction("downloadAndInstall") { url: String ->
      startDownload(url)
    }
  }

  private fun startDownload(url: String) {
    Log.d(TAG, "startDownload called with url: $url")
    val context = appContext.reactContext
    if (context == null) {
      Log.e(TAG, "startDownload failed: reactContext is null")
      return
    }

    createNotificationChannel(context)

    val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager

    val request = DownloadManager.Request(Uri.parse(url))
      .setTitle("Startune Music Update")
      .setDescription("Downloading...")
      .setNotificationVisibility(DownloadManager.Request.VISIBILITY_HIDDEN)
      .setMimeType("application/vnd.android.package-archive")

    currentDownloadId = dm.enqueue(request)
    Log.d(TAG, "Download enqueued with id: $currentDownloadId")

    showProgressNotification(context, dm, currentDownloadId)
    registerCompletionReceiver(context)
  }

  private fun createNotificationChannel(context: Context) {
    val channel = NotificationChannel(
      NOTIFICATION_CHANNEL,
      "App Updates",
      NotificationManager.IMPORTANCE_LOW
    ).apply {
      description = "App update download progress"
    }
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.createNotificationChannel(channel)
  }

  private fun showProgressNotification(
    context: Context,
    dm: DownloadManager,
    downloadId: Long
  ) {
    handler?.removeCallbacksAndMessages(null)
    handler = Handler(Looper.getMainLooper())
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    val runnable = object : Runnable {
      override fun run() {
        val query = DownloadManager.Query().setFilterById(downloadId)
        var cursor: Cursor? = null
        try {
          cursor = dm.query(query)
          if (cursor != null && cursor.moveToFirst()) {
            val status =
              cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))

            if (status == DownloadManager.STATUS_RUNNING || status == DownloadManager.STATUS_PENDING) {
              val downloaded = cursor.getLong(
                cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
              )
              val total = cursor.getLong(
                cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
              )
              val progress = if (total > 0) (downloaded * 100 / total).toInt() else 0

              val notification = NotificationCompat.Builder(context, NOTIFICATION_CHANNEL)
                .setSmallIcon(android.R.drawable.stat_sys_download)
                .setContentTitle("Downloading Update")
                .setContentText("$progress%")
                .setProgress(100, progress, false)
                .setOngoing(true)
                .setSilent(true)
                .build()
              nm.notify(NOTIFICATION_ID, notification)

              handler?.postDelayed(this, 1000)
            }
          }
        } catch (_: Exception) {
        } finally {
          cursor?.close()
        }
      }
    }
    handler?.post(runnable)
  }

  private fun registerCompletionReceiver(context: Context) {
    if (receiverRegistered) return
    receiverRegistered = true

    val receiver = object : BroadcastReceiver() {
      override fun onReceive(ctx: Context, intent: Intent) {
        val id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
        if (id != currentDownloadId) return

        handler?.removeCallbacksAndMessages(null)

        val downloadId = id
        val query = DownloadManager.Query().setFilterById(downloadId)
        var cursor: Cursor? = null
        try {
          cursor = (ctx.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager).query(query)
          if (cursor != null && cursor.moveToFirst()) {
            val status =
              cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))

            if (status == DownloadManager.STATUS_SUCCESSFUL) {
              // Show install notification
              showInstallNotification(ctx, downloadId)
              // Auto-install if app is running
              installApk(ctx, downloadId)
            } else if (status == DownloadManager.STATUS_FAILED) {
              showDownloadFailedNotification(ctx)
            }
          }
        } catch (_: Exception) {
        } finally {
          cursor?.close()
        }

        try {
          ctx.unregisterReceiver(this)
        } catch (_: Exception) {
        }
        receiverRegistered = false
      }
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(
        receiver,
        IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
        Context.RECEIVER_NOT_EXPORTED
      )
    } else {
      context.registerReceiver(
        receiver,
        IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
      )
    }
  }

  private fun showInstallNotification(context: Context, downloadId: Long) {
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    val installIntent = Intent(context, InstallBroadcastReceiver::class.java).apply {
      putExtra("download_id", downloadId)
    }
    val pendingIntent = PendingIntent.getBroadcast(
      context,
      0,
      installIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val notification = NotificationCompat.Builder(context, NOTIFICATION_CHANNEL)
      .setSmallIcon(android.R.drawable.stat_sys_download_done)
      .setContentTitle("Update Ready")
      .setContentText("Tap to install")
      .setContentIntent(pendingIntent)
      .setAutoCancel(true)
      .build()
    nm.notify(NOTIFICATION_ID, notification)
  }

  private fun showDownloadFailedNotification(context: Context) {
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val notification = NotificationCompat.Builder(context, NOTIFICATION_CHANNEL)
      .setSmallIcon(android.R.drawable.stat_sys_warning)
      .setContentTitle("Download Failed")
      .setContentText("Could not download update")
      .setAutoCancel(true)
      .build()
    nm.notify(NOTIFICATION_ID, notification)
  }
}
