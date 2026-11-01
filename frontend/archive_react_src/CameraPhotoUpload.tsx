import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RotateCcw, CheckCircle2, AlertCircle, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { api } from '../../api/client';

interface CameraPhotoUploadProps {
  title?: string;
  subtitle?: string;
  captionPlaceholder?: string;
  defaultCaption?: string;
  onPhotoUploaded: (photoUrl: string, caption: string) => Promise<void> | void;
  onClose: () => void;
  allowedStages?: string[];
  selectedStage?: string;
  onStageChange?: (stage: string) => void;
}

export const CameraPhotoUpload: React.FC<CameraPhotoUploadProps> = ({
  title = 'Capture & Attach Photo',
  subtitle = 'Snap a live photo using device camera or select image from file picker',
  captionPlaceholder = 'e.g. South-facing rooftop shadow-free area',
  defaultCaption = '',
  onPhotoUploaded,
  onClose,
  allowedStages,
  selectedStage,
  onStageChange,
}) => {
  const [mode, setMode] = useState<'camera' | 'file'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState(defaultCaption);
  const [stage, setStage] = useState(selectedStage || (allowedStages && allowedStages.length > 0 ? allowedStages[0] : ''));
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start device camera using getUserMedia with facingMode: environment
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API (getUserMedia) not supported in this browser. Please use the File Upload tab.');
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      let msg = 'Camera unavailable or permission denied. Please switch to file upload.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in browser settings or upload a file.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera found on this device. Please upload an image file instead.';
      }
      setCameraError(msg);
      setCameraActive(false);
      setMode('file');
    }
  }, []);

  // Automatically start camera on mount if mode is camera
  useEffect(() => {
    if (mode === 'camera' && !capturedBlob) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, capturedBlob, startCamera, stopCamera]);

  // Capture frame from video to canvas and convert to Blob
  const handleSnapPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedBlob(blob);
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          stopCamera();
        }
      },
      'image/jpeg',
      0.9
    );
  };

  // Retake photo
  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setCapturedBlob(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    if (mode === 'camera') {
      startCamera();
    }
  };

  // Handle file picker selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Invalid file format. Allowed formats: JPG, PNG, WEBP.');
      return;
    }

    setCapturedBlob(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // Upload to backend and persist
  const handleUploadAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capturedBlob) {
      setErrorMessage('Please snap a photo or choose an image file first.');
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      // 1. Prepare Multipart Form Data
      const formData = new FormData();
      const fileName = capturedBlob instanceof File ? capturedBlob.name : `photo_${Date.now()}.jpg`;
      formData.append('file', capturedBlob, fileName);

      // 2. Upload to Spring Boot /api/upload
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const photoUrl = uploadRes.data?.url;
      if (!photoUrl) {
        throw new Error('Backend failed to return stored photo URL.');
      }

      // 3. Attach metadata to Entity via parent callback
      const finalCaption = caption.trim() || 'Site Photo';
      if (onStageChange && stage) {
        onStageChange(stage);
      }
      await onPhotoUploaded(photoUrl, finalCaption);

      setUploadSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to upload photo to central server.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              {title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Mode Switcher Tabs */}
          {!previewUrl && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('camera')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  mode === 'camera' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                Live Camera Snap
              </button>
              <button
                type="button"
                onClick={() => setMode('file')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                  mode === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Photo File
              </button>
            </div>
          )}

          {/* Camera Error Alert */}
          {cameraError && mode === 'camera' && !previewUrl && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">{cameraError}</p>
                <p className="text-[11px] text-amber-700 mt-0.5">Switched to file upload mode for convenience.</p>
              </div>
            </div>
          )}

          {/* General Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Badge */}
          {uploadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">Photo successfully uploaded and attached to central record!</span>
            </div>
          )}

          {/* Viewfinder / Preview Container */}
          <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-200 shadow-inner">
            {previewUrl ? (
              // Captured / Selected Image Preview
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            ) : mode === 'camera' ? (
              // Live Camera Viewfinder
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />
                {!cameraActive && (
                  <div className="text-center p-4">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-300">Initializing device camera stream...</p>
                  </div>
                )}
              </>
            ) : (
              // File Picker Dropzone
              <div
                onClick={() => fileInputRef.current?.click()}
                className="text-center p-6 cursor-pointer hover:bg-slate-800/80 transition w-full h-full flex flex-col items-center justify-center"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-3 shadow-md">
                  <ImageIcon className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-white">Click to Select Site Photograph</p>
                <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP up to 10MB</p>
                <span className="mt-3 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold">
                  Browse Files
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}

            {/* Hidden canvas used for frame capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera Action Buttons (Snap vs Retake) */}
          {!previewUrl && mode === 'camera' && cameraActive && (
            <button
              type="button"
              onClick={handleSnapPhoto}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Snap Photograph Now
            </button>
          )}

          {previewUrl && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRetake}
                disabled={uploading || uploadSuccess}
                className="flex-1 py-2 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake / Change Photo
              </button>
            </div>
          )}

          {/* Form Fields: Caption & Stage (if preview ready) */}
          {previewUrl && (
            <form onSubmit={handleUploadAndSave} className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              {allowedStages && allowedStages.length > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Installation Stage *</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-slate-800"
                  >
                    {allowedStages.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photo Description / Notes *</label>
                <input
                  type="text"
                  required
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={captionPlaceholder}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  disabled={uploading}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || uploadSuccess}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading & Saving...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload & Attach to Record
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
