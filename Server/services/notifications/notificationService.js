const User = require('../../models/User');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  // In a real app, use a service account key stored securely
  // For development, you can use a mock implementation
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
    });
  } else {
    console.log('[Notification] Firebase not configured, using mock implementation');
  }
}

// Send push notification to a user
exports.sendPushNotification = async (userId, notification) => {
  try {
    // Find user
    const user = await User.findById(userId);
    
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`[Notification] No FCM tokens found for user ${userId}`);
      return;
    }
    
    // Structure notification message
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      tokens: user.fcmTokens
    };
    
    // Send notification if Firebase is configured
    if (admin.apps.length) {
      try {
        const response = await admin.messaging().sendMulticast(message);
        console.log(`[Notification] Sent to ${response.successCount} devices for user ${userId}`);
        
        // Remove invalid tokens
        if (response.failureCount > 0) {
          const invalidTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              console.log('[Notification] Failed:', resp.error.code);
              invalidTokens.push(user.fcmTokens[idx]);
            }
          });
          
          if (invalidTokens.length > 0) {
            const validTokens = user.fcmTokens.filter(token => !invalidTokens.includes(token));
            await User.findByIdAndUpdate(userId, { fcmTokens: validTokens });
          }
        }
      } catch (error) {
        console.error('[Notification] Error sending to Firebase:', error);
      }
    } else {
      // Log notification for development
      console.log(`[Notification] Would send to user ${userId}:`, message);
    }
  } catch (error) {
    console.error('[Notification] Service error:', error);
  }
};