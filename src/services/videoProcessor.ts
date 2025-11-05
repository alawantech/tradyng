// Video processing service for automatic trimming and compression
export interface VideoProcessingResult {
  processedFile: File;
  originalDuration: number;
  processedDuration: number;
  originalSize: number;
  processedSize: number;
  wasProcessed: boolean;
  wasTrimmed: boolean;
  wasCompressed: boolean;
}

interface PlanLimits {
  maxDurationSeconds: number;
  maxSizeMB: number;
  maxResolution: { width: number; height: number };
}

export class VideoProcessor {
  // Plan-specific limits
  private static readonly PLAN_LIMITS: Record<string, PlanLimits> = {
    free: {
      maxDurationSeconds: 30,
      maxSizeMB: 8,
      maxResolution: { width: 1280, height: 720 } // 720p
    },
    business: {
      maxDurationSeconds: 30,
      maxSizeMB: 8,
      maxResolution: { width: 1280, height: 720 } // 720p
    },
    pro: {
      maxDurationSeconds: 60,
      maxSizeMB: 15,
      maxResolution: { width: 1280, height: 720 } // 720p
    }
  };

  // Automatically process video to fit within plan limits
  static async processVideoForPlan(
    file: File,
    planType: 'free' | 'business' | 'pro' = 'business'
  ): Promise<VideoProcessingResult> {
    try {
      const originalDuration = await this.getVideoDuration(file);
      const originalSize = file.size;
      const limits = this.PLAN_LIMITS[planType];
      
      let processedFile = file;
      let wasTrimmed = false;
      let wasCompressed = false;
      let processedDuration = originalDuration;

      // Step 1: Trim if exceeds duration
      if (originalDuration > limits.maxDurationSeconds) {
        processedFile = await this.trimVideo(processedFile, 0, limits.maxDurationSeconds);
        processedDuration = limits.maxDurationSeconds;
        wasTrimmed = true;
      }

      // Step 2: Compress if exceeds size or needs resolution reduction
      const fileSizeMB = processedFile.size / (1024 * 1024);
      const videoDimensions = await this.getVideoDimensions(processedFile);
      const needsResolutionChange = 
        videoDimensions.width > limits.maxResolution.width || 
        videoDimensions.height > limits.maxResolution.height;

      if (fileSizeMB > limits.maxSizeMB || needsResolutionChange) {
        processedFile = await this.compressVideo(
          processedFile,
          limits.maxResolution,
          limits.maxSizeMB
        );
        wasCompressed = true;
      }

      return {
        processedFile,
        originalDuration,
        processedDuration,
        originalSize,
        processedSize: processedFile.size,
        wasProcessed: wasTrimmed || wasCompressed,
        wasTrimmed,
        wasCompressed
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

  // Get video dimensions
  static getVideoDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve({ width: video.videoWidth, height: video.videoHeight });
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  }

  // Compress video to meet size and resolution requirements
  static async compressVideo(
    file: File,
    maxResolution: { width: number; height: number },
    maxSizeMB: number
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { 
        alpha: false, 
        desynchronized: true 
      }); // Faster canvas context
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      let mediaRecorder: MediaRecorder;
      const chunks: Blob[] = [];
      let frameCount = 0;
      let animationId: number;
      
      video.onloadedmetadata = () => {
        // Calculate new dimensions maintaining aspect ratio
        let targetWidth = video.videoWidth;
        let targetHeight = video.videoHeight;
        
        if (targetWidth > maxResolution.width || targetHeight > maxResolution.height) {
          const aspectRatio = targetWidth / targetHeight;
          if (aspectRatio > 1) {
            // Landscape
            targetWidth = maxResolution.width;
            targetHeight = Math.round(targetWidth / aspectRatio);
          } else {
            // Portrait
            targetHeight = maxResolution.height;
            targetWidth = Math.round(targetHeight * aspectRatio);
          }
        }
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Calculate bitrate to meet target file size - more aggressive compression
        const targetSizeBytes = maxSizeMB * 0.85 * 1024 * 1024; // 85% of max for safety
        const videoBitsPerSecond = Math.floor((targetSizeBytes * 8) / video.duration);
        
        // Use lower FPS for faster processing (20 FPS instead of 30)
        const fps = 20;
        const canvasStream = canvas.captureStream(fps);
        const mimeType = this.getBestMimeType();
        
        mediaRecorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: Math.min(videoBitsPerSecond, 1500000) // Max 1.5Mbps for faster processing
        });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          cancelAnimationFrame(animationId);
          const processedBlob = new Blob(chunks, { type: mimeType });
          const processedFile = new File(
            [processedBlob], 
            `compressed_${file.name}`,
            { type: mimeType }
          );
          resolve(processedFile);
        };

        // Fast frame capture function
        const captureFrame = () => {
          if (video.paused || video.ended) {
            mediaRecorder.stop();
            window.URL.revokeObjectURL(video.src);
            return;
          }

          // Skip frames for faster processing (process every 2nd frame)
          frameCount++;
          if (frameCount % 2 === 0) {
            // Use faster drawing - no image smoothing
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }

          animationId = requestAnimationFrame(captureFrame);
        };

        // Start recording with faster playback
        mediaRecorder.start(100); // Collect data every 100ms for faster processing
        video.playbackRate = 2.0; // Process at 2x speed for faster conversion
        video.currentTime = 0;
        video.play();
        captureFrame();
      };

      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        reject(new Error('Failed to compress video'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  // Trim video using canvas and MediaRecorder - OPTIMIZED FOR SPEED
  static async trimVideo(
    file: File,
    startTime: number,
    endTime: number
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { 
        alpha: false, 
        desynchronized: true 
      }); // Faster canvas
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      let mediaRecorder: MediaRecorder;
      const chunks: Blob[] = [];
      let frameCount = 0;
      let animationId: number;
      
      video.onloadedmetadata = () => {
        // Set canvas dimensions - reduce for faster processing
        const scale = video.videoWidth > 1280 ? 0.75 : 1; // Scale down large videos
        canvas.width = Math.floor(video.videoWidth * scale);
        canvas.height = Math.floor(video.videoHeight * scale);
        
        // Faster frame rate
        const fps = 20; // Lower FPS for faster processing
        const canvasStream = canvas.captureStream(fps);
        const mimeType = this.getBestMimeType();
        
        mediaRecorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: 800000 // Lower bitrate for faster processing
        });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          cancelAnimationFrame(animationId);
          const processedBlob = new Blob(chunks, { type: mimeType });
          const processedFile = new File(
            [processedBlob], 
            `trimmed_${file.name}`,
            { type: mimeType }
          );
          resolve(processedFile);
        };

        // Fast frame capture
        const captureFrame = () => {
          if (video.currentTime >= endTime || video.paused || video.ended) {
            video.pause();
            mediaRecorder.stop();
            window.URL.revokeObjectURL(video.src);
            return;
          }

          // Skip frames for speed (process every other frame)
          frameCount++;
          if (frameCount % 2 === 0) {
            ctx.imageSmoothingEnabled = false; // Faster drawing
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }

          animationId = requestAnimationFrame(captureFrame);
        };

        // Start recording with faster playback
        mediaRecorder.start(100); // Collect data every 100ms
        video.currentTime = startTime;
        video.playbackRate = 2.0; // 2x speed for faster processing
        video.play();
        captureFrame();
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