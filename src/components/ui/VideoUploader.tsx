import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Upload, Play, AlertCircle, Scissors, CheckCircle, Clock } from 'lucide-react';
import { VideoUploadService } from '../../services/videoUpload';
import { VideoProcessor, VideoProcessingResult } from '../../services/videoProcessor';

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void;
  onVideoRemove: () => void;
  maxDurationSeconds: number;
  currentVideo?: string;
  selectedVideoFile?: File | null; // Add this to pass the selected file from parent
  disabled?: boolean;
  planType?: 'free' | 'business' | 'pro'; // Add plan type
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideoSelect,
  onVideoRemove,
  maxDurationSeconds,
  currentVideo,
  selectedVideoFile, // Get the selected file from parent
  disabled = false,
  planType = 'business' // Default to business plan
}) => {
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<VideoProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use selectedVideoFile from parent instead of internal state
  const selectedFile = selectedVideoFile;

  // Update preview when selectedVideoFile changes from parent
  useEffect(() => {
    if (selectedFile && !videoPreview) {
      setVideoPreview(URL.createObjectURL(selectedFile));
    } else if (!selectedFile && videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  }, [selectedFile, videoPreview]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setProcessingResult(null);
    setIsValidating(true);

    try {
      // Basic file validation
      const validation = VideoUploadService.validateVideoFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid video file');
        return;
      }

      // Check if browser supports video processing
      if (!VideoProcessor.isSupported()) {
        setError('Your browser does not support video processing');
        return;
      }

      setIsValidating(false);
      setIsProcessing(true);

      // Process video with automatic trimming and compression
      const result = await VideoProcessor.processVideoForPlan(file, planType);
      
      setProcessingResult(result);
      setVideoPreview(URL.createObjectURL(result.processedFile));
      onVideoSelect(result.processedFile); // Let parent manage the file state

    } catch (err) {
      setError('Failed to process video file');
      console.error('Video processing error:', err);
    } finally {
      setIsValidating(false);
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    setError(null);
    setProcessingResult(null);
    onVideoRemove(); // Let parent handle file removal
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDuration = (seconds: number): string => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {!selectedFile && !currentVideo && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Product Video</h3>
            <p className="text-sm text-gray-600 mb-4">
              Upload a video (any duration/size - we'll optimize it automatically!)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={disabled || isValidating}
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isValidating || isProcessing}
            >
              {isValidating ? 'Validating...' : isProcessing ? 'Processing video...' : 'Choose Video File'}
            </Button>
            
            <p className="text-xs text-gray-500 mt-2">
              Max upload size: 500MB • Auto-compressed to fit your plan
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-l-4 border-red-500 bg-red-50">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </Card>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <Card className="p-4 border-l-4 border-blue-500 bg-blue-50">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-blue-500 mr-2 animate-spin" />
            <p className="text-sm text-blue-700">Processing video... This may take a moment.</p>
          </div>
        </Card>
      )}

      {/* Processing Result */}
      {processingResult && processingResult.wasProcessed && (
        <Card className="p-4 border-l-4 border-green-500 bg-green-50">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <div className="text-sm text-green-700 space-y-1">
              <p className="font-medium">✅ Video automatically optimized for your plan</p>
              {processingResult.wasTrimmed && (
                <p>📹 Duration: {VideoProcessor.formatDuration(processingResult.originalDuration)} → {VideoProcessor.formatDuration(processingResult.processedDuration)}</p>
              )}
              {processingResult.wasCompressed && (
                <p>🗜️ Size: {VideoProcessor.formatFileSize(processingResult.originalSize)} → {VideoProcessor.formatFileSize(processingResult.processedSize)}</p>
              )}
              <p className="text-xs text-green-600 mt-1">Your video has been compressed to 720p resolution to meet plan requirements</p>
            </div>
          </div>
        </Card>
      )}

      {/* Video Preview */}
      {(selectedFile || currentVideo) && !error && (
        <Card className="p-4">
          <div className="flex items-start space-x-4">
            <div className="relative">
              {videoPreview || currentVideo ? (
                <video
                  src={videoPreview || currentVideo}
                  className="w-32 h-24 object-cover rounded-lg bg-gray-100"
                  controls
                />
              ) : (
                <div className="w-32 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Play className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {selectedFile?.name || 'Current Video'}
              </h4>
              
              {selectedFile && (
                <div className="text-sm text-gray-600 mt-1 space-y-1">
                  <p>Size: {formatFileSize(selectedFile.size)}</p>
                  <p>Type: {selectedFile.type}</p>
                </div>
              )}
              
              <div className="mt-3 flex space-x-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                >
                  Replace
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleRemove}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>
              
              {/* Hidden input for replace functionality */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                disabled={disabled}
                className="hidden"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Plan Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-700">📋 Your {planType.charAt(0).toUpperCase() + planType.slice(1)} Plan Limits:</p>
        <p>⏱️ Duration: {formatDuration(maxDurationSeconds)} max</p>
        <p>📦 File Size: {planType === 'pro' ? '15 MB' : '8 MB'} max</p>
        <p>📺 Resolution: 720p (1280x720)</p>
        <p className="flex items-center mt-2 text-green-600 font-medium">
          <Scissors className="h-3 w-3 mr-1" />
          Videos that exceed limits will be automatically optimized
        </p>
        <p className="text-xs text-gray-400 mt-1">Supported formats: MP4, WebM, AVI, MOV</p>
      </div>
    </div>
  );
};