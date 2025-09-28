import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import { Button } from './Button';
import { Card } from './Card';
import { X, RotateCw, Crop as CropIcon } from 'lucide-react';

interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onSkip: () => void;
  onCancel: () => void;
  fileName: string;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  src,
  onCropComplete,
  onSkip,
  onCancel,
  fileName
}) => {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Set initial crop to center square
    const size = Math.min(width, height) * 0.9;
    const x = (width - size) / 2;
    const y = (height - size) / 2;
    
    setCrop({
      unit: 'px',
      width: size,
      height: size,
      x,
      y
    });
  }, []);

  const getCroppedImage = useCallback(async (
    image: HTMLImageElement,
    crop: PixelCrop
  ): Promise<Blob> => {
    const canvas = canvasRef.current;
    if (!canvas || !crop) {
      throw new Error('Canvas or crop not available');
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/jpeg', 0.9);
    });
  }, []);

  const handleCrop = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;

    setIsCropping(true);
    try {
      const croppedBlob = await getCroppedImage(
        imgRef.current,
        completedCrop
      );
      onCropComplete(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsCropping(false);
    }
  }, [completedCrop, fileName, getCroppedImage, onCropComplete]);

  // Prevent background scrolling and handle keyboard shortcuts
  useEffect(() => {
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onCancel();
          break;
        case 'Enter':
          e.preventDefault();
          if (completedCrop) {
            handleCrop();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [completedCrop, onCancel, handleCrop]);

  const resetCrop = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const size = Math.min(width, height) * 0.9;
      const x = (width - size) / 2;
      const y = (height - size) / 2;
      
      setCrop({
        unit: 'px',
        width: size,
        height: size,
        x,
        y
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CropIcon className="h-5 w-5 mr-2" />
            Crop Image: {fileName}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close cropper"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="p-6">
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Drag to adjust the crop area. The image will be cropped to the selected area.
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={undefined}
              minWidth={50}
              minHeight={50}
              className="max-w-full max-h-[400px]"
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={src}
                onLoad={onImageLoad}
                className="max-w-full max-h-[400px] object-contain"
              />
            </ReactCrop>
          </div>

          {/* Hidden canvas for cropping */}
          <canvas
            ref={canvasRef}
            style={{ display: 'none' }}
          />

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetCrop}
                className="flex items-center"
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Reset Crop
              </Button>
            </div>

            <div className="flex gap-3 order-first sm:order-last">
              <Button
                variant="outline"
                onClick={onCancel}
                className="text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                ← Back to Product
              </Button>
              <Button
                variant="outline"
                onClick={onSkip}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                Use Original
              </Button>
              <Button
                onClick={handleCrop}
                disabled={!completedCrop || isCropping}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isCropping ? 'Processing...' : 'Apply Crop'}
              </Button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
              <CropIcon className="h-4 w-4 mr-2" />
              How to crop:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Resize:</strong> Drag the corners or edges of the crop box</li>
              <li>• <strong>Move:</strong> Drag the center of the crop box to reposition</li>
              <li>• <strong>Apply Crop:</strong> Use the cropped version for your product</li>
              <li>• <strong>Use Original:</strong> Skip cropping and use the full image</li>
              <li>• <strong>Back to Product:</strong> Cancel and choose a different image</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};