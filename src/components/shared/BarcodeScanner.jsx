import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, FlashlightOff, Flashlight, RotateCcw } from 'lucide-react';

export function BarcodeScanner({ isOpen, onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasFlash, setHasFlash] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = back camera
  const scanIntervalRef = useRef(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(false);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);

        // Check for flash capability
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities?.();
        setHasFlash(capabilities?.torch || false);

        // Start scanning
        startScanning();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setFlashOn(false);
  }, []);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (streamRef.current && hasFlash) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
        setFlashOn(!flashOn);
      } catch (err) {
        console.error('Flash toggle error:', err);
      }
    }
  }, [hasFlash, flashOn]);

  // Switch camera
  const switchCamera = useCallback(() => {
    setFacingMode(mode => mode === 'environment' ? 'user' : 'environment');
  }, []);

  // Start barcode scanning
  const startScanning = useCallback(() => {
    // Check if BarcodeDetector is available (Chrome, Edge, Opera)
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
      });

      scanIntervalRef.current = setInterval(async () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const barcode = barcodes[0].rawValue;
              // Vibrate for feedback if available
              if (navigator.vibrate) navigator.vibrate(100);
              stopCamera();
              onScan(barcode);
            }
          } catch (err) {
            // Scanning error, continue trying
          }
        }
      }, 200);
    } else {
      // Fallback: Manual barcode entry
      setError('Barcode scanning not supported on this device. Please enter the barcode manually.');
    }
  }, [onScan, stopCamera]);

  // Effect to handle open/close
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Effect to restart camera when facingMode changes
  useEffect(() => {
    if (isOpen && facingMode) {
      startCamera();
    }
  }, [facingMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onClose} className="p-2 rounded-full bg-dark-800/80">
          <X className="w-6 h-6 text-white" />
        </button>
        <span className="text-white font-medium">Scan Barcode</span>
        <div className="flex gap-2">
          {hasFlash && (
            <button onClick={toggleFlash} className="p-2 rounded-full bg-dark-800/80">
              {flashOn ? (
                <Flashlight className="w-6 h-6 text-accent-primary" />
              ) : (
                <FlashlightOff className="w-6 h-6 text-white" />
              )}
            </button>
          )}
          <button onClick={switchCamera} className="p-2 rounded-full bg-dark-800/80">
            <RotateCcw className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Camera view */}
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning frame overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-72 h-40">
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-accent-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-accent-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-accent-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-accent-primary rounded-br-lg" />

            {/* Scanning line animation */}
            {isScanning && (
              <div className="absolute left-2 right-2 h-0.5 bg-accent-primary animate-scan-line" />
            )}
          </div>
        </div>

        {/* Darkened areas outside scan zone */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/50" style={{
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, calc(50% - 144px) calc(50% - 80px), calc(50% - 144px) calc(50% + 80px), calc(50% + 144px) calc(50% + 80px), calc(50% + 144px) calc(50% - 80px), calc(50% - 144px) calc(50% - 80px))'
          }} />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        {error ? (
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-accent-primary text-white rounded-lg font-medium"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-white text-lg mb-2">
              {isScanning ? 'Position barcode within frame' : 'Starting camera...'}
            </p>
            <p className="text-gray-400 text-sm">
              Works with UPC, EAN, and most product barcodes
            </p>
          </div>
        )}
      </div>

      {/* Add scan line animation styles */}
      <style>{`
        @keyframes scan-line {
          0% { top: 0; }
          50% { top: calc(100% - 2px); }
          100% { top: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default BarcodeScanner;
