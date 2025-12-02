import 'package:http/http.dart' as http;
import 'dart:convert';

class BackendIntegration {
  static const String backendUrl = 'http://192.168.1.9:3000';
  
  static Future<bool> registerDeviceToken({
    required String fcmToken,
    required String userId,
    required String jwtToken,
    String deviceType = 'android',
  }) async {
    try {
      print('📤 Registering FCM token with backend...');
      print('   Token: $fcmToken');
      print('   User ID: $userId');
      
      final response = await http.post(
        Uri.parse('$backendUrl/api/device-tokens/register'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken',
        },
        body: jsonEncode({
          'token': fcmToken,
          'deviceType': deviceType,
        }),
      ).timeout(const Duration(seconds: 10));

      print('✅ Backend response: ${response.statusCode}');
      print('   Body: ${response.body}');
      
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('❌ Failed to register token: $e');
      return false;
    }
  }

  static Future<bool> sendTestNotification({
    required String userId,
    required String jwtToken,
    String title = 'Test Notification',
    String body = 'This is a test notification from Flutter app',
  }) async {
    try {
      print('📤 Sending test notification...');
      
      final response = await http.post(
        Uri.parse('$backendUrl/api/notifications/send/user'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken',
        },
        body: jsonEncode({
          'userId': userId,
          'title': title,
          'body': body,
          'type': 'test',
        }),
      ).timeout(const Duration(seconds: 10));

      print('✅ Notification sent: ${response.statusCode}');
      print('   Body: ${response.body}');
      
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('❌ Failed to send notification: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>?> getBackendConfig() async {
    try {
      print('📥 Fetching backend configuration...');
      
      final response = await http.get(
        Uri.parse('$backendUrl/api/firebase-config'),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final config = jsonDecode(response.body);
        print('✅ Backend config received');
        return config;
      }
      return null;
    } catch (e) {
      print('❌ Failed to get backend config: $e');
      return null;
    }
  }
}
