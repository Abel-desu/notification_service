// Copyright 2022, the Chromium project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// BSD-style license that can be found in the LICENSE file.

// ignore_for_file: require_trailing_commas

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'backend_integration.dart';

/// Manages & returns the users FCM token.
///
/// Also monitors token refreshes and updates state.
class TokenMonitor extends StatefulWidget {
  // ignore: public_member_api_docs
  TokenMonitor(this._builder);

  final Widget Function(String? token) _builder;

  @override
  State<StatefulWidget> createState() => _TokenMonitor();
}

class _TokenMonitor extends State<TokenMonitor> {
  String? _token;
  late Stream<String> _tokenStream;

  void setToken(String? token) {
    print('FCM Token: $token');
    setState(() {
      _token = token;
    });
    
    // Register token with backend
    if (token != null && token.isNotEmpty) {
      _registerTokenWithBackend(token);
    }
  }

  Future<void> _registerTokenWithBackend(String token) async {
    try {
      // For demo purposes, use a test user ID and JWT token
      // In production, these should come from your auth system
      const String userId = 'test-user-123';
      const String jwtToken = 'demo-jwt-token';
      
      final success = await BackendIntegration.registerDeviceToken(
        fcmToken: token,
        userId: userId,
        jwtToken: jwtToken,
        deviceType: 'android',
      );
      
      if (success) {
        print('Token registered with backend successfully');
      } else {
        print('Failed to register token with backend');
      }
    } catch (e) {
      print('Error registering token: $e');
    }
  }

  @override
  void initState() {
    super.initState();
    FirebaseMessaging.instance
        .getToken(
            vapidKey:
                'BNKkaUWxyP_yC_lki1kYazgca0TNhuzt2drsOrL6WrgGbqnMnr8ZMLzg_rSPDm6HKphABS0KzjPfSqCXHXEd06Y')
        .then(setToken)
        .catchError((e) {
          print('Error getting FCM token: $e');
          print('This is likely due to invalid Firebase API key');
          print('Please provide a valid Web API key from Firebase Console');
          setToken(null);
        });
    _tokenStream = FirebaseMessaging.instance.onTokenRefresh;
    _tokenStream.listen(setToken);
  }

  @override
  Widget build(BuildContext context) {
    return widget._builder(_token);
  }
}