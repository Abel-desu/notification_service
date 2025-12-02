# Complete Testing Guide - Device Token & Backend Functionality

## 🎯 Objective
Get device token from phone → Register on backend → Test all backend functionalities

---

## 📱 Step 1: Get Device Token from Phone

### 1.1 Run Flutter App on Device

```bash
cd c:\Users\X1\pro\Abst\notification_service\flutter_test_app
flutter clean
flutter pub get
flutter run
```

### 1.2 App Startup Flow

The app will:
1. ✅ Detect your PC's IP automatically
2. ✅ Find backend server on network
3. ✅ Request notification permissions
4. ✅ Get FCM token from Firebase
5. ✅ Display token in logs

### 1.3 Copy Device Token

Look for log line:
```
✅ FCM Token: eV8xK9pM0kc:APA91bE...
```

**Copy the full token** (it's long, ~150+ characters)

---

## 🔧 Step 2: Register Device Token on Backend

### 2.1 Get Your PC's IP

```powershell
ipconfig
```

Look for IPv4 Address (e.g., `192.168.1.100`)

### 2.2 Register Device Token via API

**Using cURL:**
```bash
curl -X POST http://192.168.1.100:3000/api/device-tokens/register \
  -H "Content-Type: application/json" \
  -d '{
    "token":"PASTE_YOUR_FCM_TOKEN_HERE",
    "deviceType":"android",
    "deviceName":"Infinix X650B"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Device token registered successfully",
  "data": {
    "id": "uuid",
    "userId": "user-id",
    "token": "eV8xK9pM0kc:APA91bE...",
    "deviceType": "android",
    "isActive": true,
    "createdAt": "2025-11-27T09:13:00.000Z"
  }
}
```

---

## 🧪 Step 3: Test Backend Functionalities

### 3.1 Test 1: Send Notification to Single User

**Endpoint**: `POST /api/notifications/send/user`

```bash
curl -X POST http://192.168.1.100:3000/api/notifications/send/user \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"test-user-id",
    "title":"Test Notification",
    "body":"This is a test message from backend",
    "data":{"key":"value"}
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "notificationId": "uuid",
    "successCount": 1
  }
}
```

**Check Phone**: Notification should appear on device

---

### 3.2 Test 2: Send Bulk Notifications

**Endpoint**: `POST /api/notifications/send/bulk`

```bash
curl -X POST http://192.168.1.100:3000/api/notifications/send/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "userIds":["user-1","user-2","user-3"],
    "title":"Bulk Notification",
    "body":"Sent to multiple users",
    "type":"system"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Bulk notifications sent",
  "data": {
    "totalUsers": 3,
    "successCount": 1,
    "failureCount": 2
  }
}
```

---

### 3.3 Test 3: Get All Notifications

**Endpoint**: `GET /api/notifications`

```bash
curl -X GET http://192.168.1.100:3000/api/notifications \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "total": 5,
    "notifications": [
      {
        "id": "uuid",
        "title": "Test Notification",
        "body": "Message body",
        "type": "system",
        "isRead": false,
        "createdAt": "2025-11-27T09:13:00.000Z"
      }
    ]
  }
}
```

---

### 3.4 Test 4: Mark Notification as Read

**Endpoint**: `PATCH /api/notifications/:id/read`

```bash
curl -X PATCH http://192.168.1.100:3000/api/notifications/NOTIFICATION_ID/read \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "uuid",
    "isRead": true,
    "readAt": "2025-11-27T09:13:00.000Z"
  }
}
```

---

### 3.5 Test 5: Delete Notification

**Endpoint**: `DELETE /api/notifications/:id`

```bash
curl -X DELETE http://192.168.1.100:3000/api/notifications/NOTIFICATION_ID \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

### 3.6 Test 6: Subscribe to Topic

**Endpoint**: `POST /api/device-tokens/:tokenId/subscribe-topic`

```bash
curl -X POST http://192.168.1.100:3000/api/device-tokens/TOKEN_ID/subscribe-topic \
  -H "Content-Type: application/json" \
  -d '{
    "topic":"news"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Subscribed to topic successfully"
}
```

---

### 3.7 Test 7: Send to Topic

**Endpoint**: `POST /api/notifications/send/topic`

```bash
curl -X POST http://192.168.1.100:3000/api/notifications/send/topic \
  -H "Content-Type: application/json" \
  -d '{
    "topic":"news",
    "title":"News Update",
    "body":"Breaking news from backend"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Topic notification sent",
  "data": {
    "messageId": "uuid"
  }
}
```

---

## 📊 Testing Checklist

- [ ] **Step 1**: Flutter app runs on device
- [ ] **Step 1**: Device shows permission dialog
- [ ] **Step 1**: Permission granted
- [ ] **Step 1**: FCM token displayed in logs
- [ ] **Step 2**: Device token registered on backend
- [ ] **Test 1**: Single notification sent and received
- [ ] **Test 2**: Bulk notifications sent
- [ ] **Test 3**: Notifications listed via API
- [ ] **Test 4**: Notification marked as read
- [ ] **Test 5**: Notification deleted
- [ ] **Test 6**: Device subscribed to topic
- [ ] **Test 7**: Topic notification received

---

## 🔍 Troubleshooting

### Issue: App won't start
```bash
flutter clean
flutter pub get
flutter run -v
```

### Issue: Permission denied
- Check Android manifest has notification permission
- Device must be Android 13+ for runtime permission
- Tap "Allow" when dialog appears

### Issue: No FCM token
- Check Firebase is initialized
- Check internet connection
- Check Google Play Services installed

### Issue: Notification not received
- Check device token is registered
- Check backend logs for errors
- Verify device is online
- Check notification settings on device

### Issue: Backend API error
- Check backend is running: `npm run dev`
- Check IP address is correct
- Check firewall allows port 3000
- Check request format is valid JSON

---

## 📝 Notes

- **Device Token**: Valid for ~1 month, regenerates if app is reinstalled
- **Notifications**: Stored in database, can be queried anytime
- **Topics**: Useful for broadcasting to multiple devices
- **Permissions**: Required for Android 13+, automatic on iOS
- **Delivery**: Immediate if device is online, queued if offline

---

## ✅ Success Indicators

✅ App starts without errors
✅ Permission dialog appears
✅ FCM token generated
✅ Device token registered
✅ Notification received on phone
✅ All API tests pass
✅ Backend logs show successful delivery

---

**Status**: Ready for testing
**Backend**: Running on port 3000
**Device**: Connected and ready
**Next**: Run Flutter app and get device token
