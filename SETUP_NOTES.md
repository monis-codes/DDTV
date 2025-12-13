# Appwrite Backend Setup Notes

## Package Installation

You need to install the Appwrite SDK:

```bash
npm install appwrite
```

## Environment Variables

Create a `.env` file in your project root (or configure in `app.json` for Expo) with the following variables:

```
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PLATFORM=com.doomdoomtv.app
EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
EXPO_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
```

**OR** update the values directly in `lib/appwrite.ts`:

```typescript
const ENDPOINT = 'https://cloud.appwrite.io/v1';
const PLATFORM = 'com.doomdoomtv.app';
const PROJECT_ID = 'YOUR_PROJECT_ID';
const DATABASE_ID = 'YOUR_DATABASE_ID';
```

## Appwrite Collections Setup

### 1. `yt-links` Collection

**Collection ID:** `yt-links`

**Attributes:**
- `language` (String, required) - **Must be full language name in lowercase**: "english", "hindi", "spanish", "arabic", "french", "german"
  - ⚠️ **Important:** The app stores language codes (e.g., "en") but the database should store full names (e.g., "english")
  - The code automatically maps: en→english, hi→hindi, es→spanish, ar→arabic, fr→french, de→german
- `title` (String, required) - Video title
- `imageURL` (String, required) - Thumbnail image URL
- `youtubeId` (String, required) - **YouTube video ID only** (e.g., "Rc4967cMQIA" from URL `https://www.youtube.com/watch?v=Rc4967cMQIA`)
  - ⚠️ **Important:** Store only the video ID, NOT the full URL
  - Example: For `https://www.youtube.com/watch?v=Rc4967cMQIA`, store `Rc4967cMQIA`

**Permissions:**
- Read: `any` (allows both guests and authenticated users to view videos)
- Create/Update/Delete: As needed for your use case (typically admin-only)

### 2. `users` Collection

**Collection ID:** `users`

**Attributes:**
- `userId` (String, required, unique)
- `name` (String, required)
- `preferredLanguage` (String, required)

**Permissions:**
- Read: `users` (any authenticated user)
- Create/Update: `users` (users can create/update their own documents)
- Delete: As needed

### 3. `favorites` Collection

**Collection ID:** `favorites`

**Attributes:**
- `userId` (String, required)
- `videoId` (String, required)

**Indexes:**
- Create a composite index on `userId` and `videoId` for efficient queries

**Permissions:**
- Read: `users` (any authenticated user)
- Create/Update/Delete: `users` (users can manage their own favorites)

## Features Implemented

### ✅ Authentication Context
- Guest mode support
- User authentication with Appwrite
- Session persistence
- Auto-initialization on app launch

### ✅ Video Fetching
- 4-hour cache strategy
- Language-based filtering with automatic code-to-name mapping
- Pull-to-refresh functionality for immediate updates
- Automatic cache refresh
- Fallback to cached data on error

### ✅ Favorites Gatekeeper
- Guest users redirected to sign-in when trying to favorite
- Logged-in users save favorites to Appwrite
- Auto-redirect back to video after login

### ✅ User Profile Management
- Onboarding saves to AsyncStorage
- Logged-in users also save to Appwrite `users` collection
- Profile updates sync to Appwrite

## Usage

The app will automatically:
1. Check for existing session/guest mode on launch
2. Redirect to appropriate screen based on auth state
3. Fetch videos based on user's preferred language
4. Cache videos for 4 hours
5. Handle favorites based on auth state

## Testing

1. **Guest Flow:**
   - Tap "Enter as Guest" → Complete onboarding → View videos
   - Try to favorite a video → Should redirect to sign-in

2. **User Flow:**
   - Sign in → Complete onboarding → View videos
   - Favorite videos → Should save to Appwrite
   - Close and reopen app → Should maintain session

3. **Cache Testing:**
   - Load videos → Close app → Reopen within 4 hours → Should use cache
   - Wait 4+ hours → Should fetch fresh data

