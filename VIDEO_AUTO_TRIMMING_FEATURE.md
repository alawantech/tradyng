# Video Auto-Trimming Feature

## Overview
The VideoUploader component now includes automatic video trimming functionality that automatically resizes videos to fit within plan limits when business owners upload product videos.

## How It Works

### 1. **Automatic Processing**
- When a user uploads a video that exceeds their plan's duration limit
- The system automatically trims the video from the beginning to match the allowed duration
- No manual intervention required from the user

### 2. **Plan-Based Limits**
- **Free Plan**: No videos allowed (0 seconds)
- **Business Plan**: Up to 30 seconds
- **Pro Plan**: Up to 60 seconds (1 minute)

### 3. **User Experience**
1. User selects a video file
2. System validates file format and size
3. If video exceeds plan limit:
   - Shows "Processing video..." message with spinner
   - Automatically trims video to fit plan duration
   - Shows success message with before/after durations
   - User can preview the trimmed video
4. Processed video is ready for upload

### 4. **Visual Feedback**
- **Processing**: Blue status card with spinning clock icon
- **Success**: Green status card with checkmark showing original vs trimmed duration
- **Error**: Red status card with error details
- **Info**: Gray text showing plan limits and auto-trim feature

## Technical Implementation

### VideoProcessor Service
- `processVideoForPlan()`: Main function that handles automatic trimming
- `trimVideo()`: Uses Canvas API and MediaRecorder to trim videos
- `isSupported()`: Checks browser compatibility
- Format support: WebM with VP9/VP8 codecs for best compression

### Browser Compatibility
- Requires modern browsers with Canvas.captureStream() support
- Uses MediaRecorder API for video encoding
- Fallback error handling for unsupported browsers

### File Output
- Trimmed videos are saved in WebM format for optimal compression
- Maintains original video quality and resolution
- File names prefixed with "trimmed_" for identification

## Usage in Products Dashboard

1. Navigate to Products → Add Product → Video section
2. Click "Choose Video File"
3. Select any video file (MP4, WebM, AVI, MOV)
4. If video exceeds plan limit, it will be automatically trimmed
5. Preview and save the product with the processed video

## Benefits

- **User-Friendly**: No need to manually edit videos
- **Plan Compliance**: Ensures all videos meet plan restrictions
- **Automatic**: Zero user intervention required
- **Quality Maintained**: Preserves video quality while reducing duration
- **Instant Feedback**: Clear status updates throughout the process