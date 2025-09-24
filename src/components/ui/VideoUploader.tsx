import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Upload, Play, AlertCircle } from 'lucide-react';
import { VideoUploadService } from '../../services/videoUpload';

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void;
  onVideoRemove: () => void;
  maxDurationSeconds: number;
  currentVideo?: string;
  disabled?: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideoSelect,
  onVideoRemove,
  maxDurationSeconds,
  currentVideo,
  disabled = false
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsValidating(true);

    try {
      // Basic file validation
      const validation = VideoUploadService.validateVideoFile(file);
      if (!validation.isValid) {
        setError(validation.error || 'Invalid video file');
        return;
      }

      // Duration validation
      const duration = await VideoUploadService.getVideoDuration(file);
      if (duration > maxDurationSeconds) {
        setError(`Video duration (${Math.round(duration)}s) exceeds the ${maxDurationSeconds}s limit for your plan`);
        return;
      }

      // File is valid
      setSelectedFile(file);
      setVideoPreview(URL.createObjectURL(file));
      onVideoSelect(file);
    } catch (err) {
      setError('Failed to validate video file');
      console.error('Video validation error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    setError(null);
    onVideoRemove();
    
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
              Upload a video (max {maxDurationSeconds} seconds, MP4/WebM/AVI/MOV format)
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
              disabled={disabled || isValidating}
            >
              {isValidating ? 'Validating...' : 'Choose Video File'}
            </Button>
            
            <p className="text-xs text-gray-500 mt-2">
              Max file size: 50MB
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
      <div className="text-xs text-gray-500">
        <p>Video length limit for your plan: {formatDuration(maxDurationSeconds)}</p>
        <p>Supported formats: MP4, WebM, AVI, MOV (max 50MB)</p>
      </div>
    </div>
  );
};