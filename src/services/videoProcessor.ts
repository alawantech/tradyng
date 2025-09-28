// Video processing service for automatic trimming and compression
export interface VideoProcessingResult {
  processedFile: File;
  originalDuration: number;
  processedDuration: number;
  wasProcessed: boolean;
}

export class VideoProcessor {
  // Automatically trim video to fit within duration limit
  static async processVideoForPlan(
    file: File,
    maxDurationSeconds: number
  ): Promise<VideoProcessingResult> {
    try {
      const originalDuration = await this.getVideoDuration(file);
      
      // If video is within limits, return as-is
      if (originalDuration <= maxDurationSeconds) {
        return {
          processedFile: file,
          originalDuration,
          processedDuration: originalDuration,
          wasProcessed: false
        };
      }

      // Auto-trim video to fit plan limits
      const processedFile = await this.trimVideo(file, 0, maxDurationSeconds);
      
      return {
        processedFile,
        originalDuration,
        processedDuration: maxDurationSeconds,
        wasProcessed: true
      };
    } catch (error) {
      console.error('Error processing video:', error);
      throw new Error('Failed to process video');
    }
  }

  // Get video duration
  static getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  }

  // Trim video using canvas and MediaRecorder
  static async trimVideo(
    file: File,
    startTime: number,
    endTime: number
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      let mediaRecorder: MediaRecorder;
      const chunks: Blob[] = [];
      
      video.onloadedmetadata = () => {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Create MediaRecorder for the canvas stream
        const canvasStream = canvas.captureStream(30); // 30 FPS
        
        // Use the best available codec
        const mimeType = this.getBestMimeType();
        
        mediaRecorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: 1000000 // 1Mbps
        });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const processedBlob = new Blob(chunks, { type: mimeType });
          const processedFile = new File(
            [processedBlob], 
            `trimmed_${file.name}`,
            { type: mimeType }
          );
          resolve(processedFile);
        };

        // Start recording and seek to start time
        mediaRecorder.start();
        video.currentTime = startTime;
        video.play();
      };

      video.ontimeupdate = () => {
        if (video.currentTime >= endTime) {
          video.pause();
          mediaRecorder.stop();
          window.URL.revokeObjectURL(video.src);
          return;
        }
        
        // Draw current frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to process video'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  // Get the best supported MIME type for recording
  static getBestMimeType(): string {
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];

    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    
    return 'video/webm'; // Fallback
  }

  // Check if browser supports video processing
  static isSupported(): boolean {
    const canvas = document.createElement('canvas');
    try {
      return !!(
        typeof canvas.captureStream === 'function' &&
        MediaRecorder &&
        MediaRecorder.isTypeSupported
      );
    } catch (error) {
      return false;
    }
  }

  // Format duration for display
  static formatDuration(seconds: number): string {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }
}