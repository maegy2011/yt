# 🐛 Debug Console Logs - Resumable Playback Feature

## 📍 Debug Log Categories & Emojis

### 🔧 **API Endpoints** (`/api/playback-position`)
- 🎯 `[PLAYBACK-POSITION-API]` - Main API operations
- 📺 `[PLAYBACK-POSITION-API]` - Request parameters received
- 🔧 `[PLAYBACK-POSITION-API]` - Video ID sanitization
- 🔍 `[PLAYBACK-POSITION-API]` - Database queries
- 📝 `[PLAYBACK-POSITION-API]` - No existing record found
- 🔄 `[PLAYBACK-POSITION-API]` - Updating existing records
- ➕ `[PLAYBACK-POSITION-API]` - Creating new records
- ✅ `[PLAYBACK-POSITION-API]` - Successful operations
- ❌ `[PLAYBACK-POSITION-API]` - Validation errors
- 💥 `[PLAYBACK-POSITION-API]` - General errors

### 🎮 **Background Player Context**
- 🎯 `[BACKGROUND-PLAYER]` - Getting playback position
- 💾 `[BACKGROUND-PLAYER]` - Saving playback position
- 📤 `[BACKGROUND-PLAYER]` - Sending save requests
- 🔄 `[BACKGROUND-PLAYER]` - Resume position decisions
- 🔍 `[BACKGROUND-PLAYER]` - Resume logic evaluation
- ✅ `[BACKGROUND-PLAYER]` - Successful resume operations
- 🔄 `[BACKGROUND-PLAYER]` - Start from beginning decisions
- ❌ `[BACKGROUND-PLAYER]` - Failed operations
- 💥 `[BACKGROUND-PLAYER]` - General errors

### 🎬 **Video Note Component**
- 🎯 `[VIDEO-NOTE]` - Resume position checking
- 📊 `[VIDEO-NOTE]` - Video data preparation
- 📋 `[VIDEO-NOTE]` - Resume position results
- ✅ `[VIDEO-NOTE]` - Showing resume prompt
- 🔄 `[VIDEO-NOTE]` - No resume needed
- ⏯ `[VIDEO-NOTE]` - User resume actions
- 🔄 `[VIDEO-NOTE]` - User restart actions
- ⏱ `[VIDEO-NOTE]` - Auto-save interval start
- 💾 `[VIDEO-NOTE]` - Auto-saving position
- 🛑 `[VIDEO-NOTE]` - Auto-save interval cleanup
- ⏸ `[VIDEO-NOTE]` - Video pause events
- 💥 `[VIDEO-NOTE]` - Component errors

### 🎴 **Video Card Converter**
- 🎯 `[VIDEO-CARD-CONVERTER]` - Converting watched videos
- 📊 `[VIDEO-CARD-CONVERTER]` - Progress calculation
- 📝 `[VIDEO-CARD-CONVERTER]` - No progress possible
- ✅ `[VIDEO-CARD-CONVERTER]` - Final card data

## 🔍 **What You'll See in Console**

### 1. **When a video is selected:**
```
🎯 [VIDEO-NOTE] Checking resume position for video: { videoId: "abc123", title: "Video Title" }
📊 [VIDEO-NOTE] Getting resume position for video data: { id: "abc123", title: "Video Title", ... }
🔄 [BACKGROUND-PLAYER] Getting resume position for video: { videoId: "abc123", title: "Video Title" }
🎯 [BACKGROUND-PLAYER] Getting playback position for video: abc123
📺 [PLAYBACK-POSITION-API] GET request received
📺 [PLAYBACK-POSITION-API] Request params: { videoId: "abc123" }
🔧 [PLAYBACK-POSITION-API] Sanitized videoId: { original: "abc123", sanitized: "abc123" }
🔍 [PLAYBACK-POSITION-API] Querying database for videoId: abc123
✅ [PLAYBACK-POSITION-API] Successfully retrieved position: { videoId: "abc123", currentPosition: 45, exists: true }
✅ [BACKGROUND-PLAYER] Retrieved playback position: { videoId: "abc123", position: 45, exists: true }
🤔 [BACKGROUND-PLAYER] Resume decision: { videoId: "abc123", savedPosition: 45, duration: 300, shouldResume: true, reason: "Valid resume point" }
✅ [BACKGROUND-PLAYER] Will resume video from saved position: { videoId: "abc123", resumePosition: 45 }
📋 [VIDEO-NOTE] Resume position result: { videoId: "abc123", position: 45 }
✅ [VIDEO-NOTE] Showing resume prompt for position: 45
```

### 2. **During video playback:**
```
⏱ [VIDEO-NOTE] Starting auto-save interval for video: abc123
💾 [VIDEO-NOTE] Auto-saving position: { videoId: "abc123", position: 55.2 }
💾 [BACKGROUND-PLAYER] Saving playback position: { videoId: "abc123", position: 55.2 }
📤 [BACKGROUND-PLAYER] Sending save request: { videoId: "abc123", position: 55.2, hasVideoData: true, title: "Video Title" }
📝 [PLAYBACK-POSITION-API] POST request received
📊 [PLAYBACK-POSITION-API] Request body: { videoId: "abc123", title: "Video Title", currentPosition: 55.2, ... }
🔄 [PLAYBACK-POSITION-API] Updating existing record: { videoId: "abc123", oldPosition: 45, newPosition: 55.2, ... }
✅ [PLAYBACK-POSITION-API] Successfully saved position: { videoId: "abc123", currentPosition: 55.2, ... }
✅ [BACKGROUND-PLAYER] Successfully saved playback position: { videoId: "abc123", position: 55.2 }
```

### 3. **When pausing video:**
```
⏸ [VIDEO-NOTE] Video paused, saving position: { videoId: "abc123", position: 120.5 }
💾 [BACKGROUND-PLAYER] Saving playback position: { videoId: "abc123", position: 120.5 }
📤 [BACKGROUND-PLAYER] Sending save request: { videoId: "abc123", position: 120.5, ... }
✅ [PLAYBACK-POSITION-API] Successfully saved position: { videoId: "abc123", currentPosition: 120.5, ... }
```

### 4. **In watched history with progress bars:**
```
🎯 [VIDEO-CARD-CONVERTER] Converting watched video to card data: { videoId: "abc123", title: "Video Title", currentPosition: 120.5, duration: "5:30" }
📊 [VIDEO-CARD-CONVERTER] Calculated progress: { videoId: "abc123", currentPosition: 120.5, durationString: "5:30", durationInSeconds: 330, progressPercent: 36.5 }
✅ [VIDEO-CARD-CONVERTER] Final card data: { videoId: "abc123", title: "Video Title", progress: 37 }
```

## 🎯 **Key Debug Points**

### **Resume Logic:**
- ✅ Position > 5 seconds = Resumable
- ✅ Position < (duration - 30 seconds) = Not too close to end
- ❌ Position ≤ 5 seconds = Too early, start from beginning
- ❌ Position ≥ (duration - 30 seconds) = Too close to end, start from beginning

### **Auto-Save Frequency:**
- ⏱ Every 10 seconds during playback
- ⏸ Immediately when pausing
- 🛑 Cleanup when component unmounts

### **Progress Calculation:**
- 📊 Formula: `(currentPosition / durationInSeconds) × 100`
- 🎯 Rounds to nearest integer for UI display
- 📝 Handles both MM:SS and HH:MM:SS formats

## 🚀 **How to Use Debug Logs**

1. **Open Browser DevTools** (F12)
2. **Go to Console tab**
3. **Filter by emoji**: Type `🎯` to see resume operations
4. **Search for patterns**: 
   - `[VIDEO-NOTE]` for component operations
   - `[BACKGROUND-PLAYER]` for context operations  
   - `[PLAYBACK-POSITION-API]` for API operations
   - `[VIDEO-CARD-CONVERTER]` for progress calculations

## 🎛️ **Troubleshooting with Debug Logs**

### **No Resume Prompt?**
Look for: `🔄 [VIDEO-NOTE] No resume prompt needed`
Check: `🤔 [BACKGROUND-PLAYER] Resume decision`

### **Position Not Saving?**
Look for: `💾 [VIDEO-NOTE] Auto-saving position`
Check: `✅ [PLAYBACK-POSITION-API] Successfully saved position`

### **Progress Bar Not Showing?**
Look for: `📊 [VIDEO-CARD-CONVERTER] Calculated progress`
Check: `✅ [VIDEO-CARD-CONVERTER] Final card data`

---

🎯 **Debug logs are now fully enabled for comprehensive resumable playback monitoring!**