# Notification Service

A comprehensive Express.js + MySQL + Sequelize notification service with Firebase Cloud Messaging (FCM) integration, JWT authentication, and role-based authorization.

## Features

- **Device Token Management**: Register and manage user device tokens for push notifications
- **Notification System**: Send, receive, and manage notifications
- **Firebase Cloud Messaging**: Send push notifications to iOS, Android, and Web devices
- **JWT Authentication**: Secure API endpoints with JWT tokens
- **Role-Based Authorization**: Admin and user roles with different permissions
- **Cron Jobs**: Automated weekly summaries and daily reminders
- **Event System**: Handle material added and exam published events
- **Database**: MySQL with Sequelize ORM
- **Logging**: Comprehensive logging with color-coded output

## Project Structure

```
notification_service/
├── config/
│   └── firebase.js              # Firebase Admin SDK initialization
├── models/
│   ├── DeviceToken.js           # Device token schema
│   ├── Notification.js          # Notification schema
│   ├── User.js                  # User schema
│   └── index.js                 # Model aggregator
├── routes/
│   ├── deviceToken.js           # Device token routes
│   ├── notifications.js         # Notification routes
│   └── index.js                 # Route aggregator
├── controllers/
│   ├── deviceTokenController.js # Device token logic
│   ├── notificationController.js # Notification logic
│   └── adminController.js       # Admin notification logic
├── middleware/
│   ├── auth.js                  # JWT authentication
│   ├── authorization.js         # Role-based authorization
│   └── errorHandler.js          # Error handling
├── services/
│   ├── fcmService.js            # FCM sending logic
│   ├── notificationService.js   # Notification business logic
│   └── tokenService.js          # Token management
├── cron/
│   ├── weeklySummary.js         # Weekly summary job
│   ├── dailyReminder.js         # Daily exam reminder job
│   └── index.js                 # Cron job aggregator
├── events/
│   ├── materialAdded.js         # New material event
│   ├── examPublished.js         # New exam event
│   └── index.js                 # Event aggregator
├── utils/
│   ├── logger.js                # Logging utility
│   └── validators.js            # Input validation
├── migrations/                  # Database migrations
├── seeders/                     # Database seeders
├── .env                         # Environment variables
├── .env.example                 # Example env file
├── app.js                       # Express app setup
├── server.js                    # Server entry point
├── package.json                 # Dependencies
└── README.md                    # Documentation
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   cd notification_service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your configuration:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=notification_service
   DB_PORT=3306
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   ```

4. **Create database**
   ```bash
   mysql -u root -p
   CREATE DATABASE notification_service;
   EXIT;
   ```

5. **Run migrations**
   ```bash
   npm run db:migrate
   ```

6. **Start the server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Device Token Routes (`/api/device-tokens`)

- **POST** `/register` - Register or update device token
  ```json
  {
    "token": "device_token_here",
    "deviceType": "ios|android|web",
    "deviceName": "iPhone 12"
  }
  ```

- **GET** `/` - Get all device tokens for user

- **DELETE** `/:tokenId` - Remove specific device token

- **POST** `/deactivate-all` - Deactivate all device tokens

### Notification Routes (`/api/notifications`)

- **POST** `/send` - Send notification
  ```json
  {
    "title": "Notification Title",
    "body": "Notification body",
    "type": "exam|material|reminder|announcement|system",
    "relatedId": "optional_id",
    "relatedType": "exam|material|course",
    "data": {}
  }
  ```

- **GET** `/` - Get user notifications
  - Query params: `limit`, `offset`

- **PATCH** `/:notificationId/read` - Mark notification as read

- **DELETE** `/:notificationId` - Delete notification

- **GET** `/unread/count` - Get unread notification count

### Admin Routes (`/api/notifications/admin`)

- **POST** `/bulk-send` - Send bulk notification (admin only)
  ```json
  {
    "userIds": ["user_id_1", "user_id_2"],
    "title": "Title",
    "body": "Body",
    "type": "announcement",
    "data": {}
  }
  ```

- **GET** `/stats/notifications` - Get notification statistics

- **GET** `/stats/users` - Get user statistics

- **GET** `/all` - Get all notifications (admin only)

### Health Check

- **GET** `/api/health` - Service health check

## Authentication

All endpoints (except health check) require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Database Models

### User
- `id` (UUID, PK)
- `email` (String, unique)
- `firstName` (String)
- `lastName` (String)
- `role` (Enum: user, admin, moderator)
- `isActive` (Boolean)
- `notificationPreferences` (JSON)
- `createdAt` (Date)
- `updatedAt` (Date)

### DeviceToken
- `id` (UUID, PK)
- `userId` (UUID, FK)
- `token` (Text, unique)
- `deviceType` (Enum: ios, android, web)
- `deviceName` (String)
- `isActive` (Boolean)
- `lastUsedAt` (Date)
- `createdAt` (Date)
- `updatedAt` (Date)

### Notification
- `id` (UUID, PK)
- `userId` (UUID, FK)
- `title` (String)
- `body` (Text)
- `type` (Enum: exam, material, reminder, announcement, system)
- `relatedId` (String)
- `relatedType` (Enum: exam, material, course)
- `isRead` (Boolean)
- `isSent` (Boolean)
- `sentAt` (Date)
- `readAt` (Date)
- `data` (JSON)
- `createdAt` (Date)
- `updatedAt` (Date)

## Cron Jobs

### Weekly Summary (Monday 9:00 AM)
Sends a summary of notifications received during the week to all active users.

### Daily Reminder (Every day 8:00 AM)
Sends a reminder about unread notifications to users who have unread notifications.

## Events

### material:added
Triggered when new material is added. Sends notification to all active users.

### exam:published
Triggered when new exam is published. Sends notification to all active users.

## Logging

The service uses a custom logger with color-coded output:
- **ERROR** (Red): Error messages
- **WARN** (Yellow): Warning messages
- **INFO** (Cyan): Information messages
- **DEBUG** (Magenta): Debug messages

Set `LOG_LEVEL` in `.env` to control logging verbosity:
- `error`: Only errors
- `warn`: Errors and warnings
- `info`: Errors, warnings, and info
- `debug`: All messages (default)

## Firebase Setup

To enable Firebase Cloud Messaging:

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Generate a service account key
3. Add the following to `.env`:
   ```
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY=your_private_key
   FIREBASE_CLIENT_EMAIL=your_client_email
   ```

## Development

### Run in development mode
```bash
npm run dev
```

### Create a new model
```bash
npm run model:create -- --name ModelName --attributes field1:string,field2:integer
```

### Create a new migration
```bash
npm run migration:create -- --name migration_name
```

### Run migrations
```bash
npm run db:migrate
```

### Undo migrations
```bash
npm run db:migrate:undo
```

## Error Handling

The service includes comprehensive error handling with:
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Server errors (500)

All errors return a JSON response with `success: false` and a descriptive message.

## Best Practices

1. Always include JWT token in Authorization header
2. Validate input data before sending requests
3. Use pagination for large datasets
4. Handle errors gracefully on the client side
5. Monitor logs for debugging issues
6. Keep Firebase credentials secure in environment variables

## Troubleshooting

### Database connection error
- Ensure MySQL is running
- Check database credentials in `.env`
- Verify database exists

### Firebase not initialized
- Check Firebase credentials in `.env`
- Ensure service account key is valid
- FCM features will be disabled if Firebase is not configured

### Cron jobs not running
- Ensure server is running
- Check logs for cron job errors
- Verify system time is correct

## License

ISC
