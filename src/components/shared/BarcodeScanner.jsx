import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Keyboard, Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export function BarcodeScanner({ isOpen, onScan, onClose }) {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameraId, setCameraId] = useState(null);
  const [cameras, setCameras] = useState([]);

  // Get available cameras
  const getCameras = useCallback(async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);
      // Prefer back camera
      const backCamera = devices.find(d =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
      );
      setCameraId(backCamera?.id || devices[0]?.id);
      return devices;
    } catch (err) {
      console.error('Error getting cameras:', err);
      setError('Unable to access camera. Please grant camera permissions.');
      return [];
    }
  }, []);

  // Start scanning
  const startScanner = useCallback(async () => {
    if (!scannerRef.current || html5QrCodeRef.current) return;

    try {
      setError(null);
      setIsScanning(false);

      const deviceCameras = cameras.length > 0 ? cameras : await getCameras();

      if (deviceCameras.length === 0) {
        setError('No cameras found. Please connect a camera or use manual entry.');
        setShowManualEntry(true);
        return;
      }

      const selectedCameraId = cameraId || deviceCameras[0]?.id;

      const html5QrCode = new Html5Qrcode("barcode-scanner-region");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        selectedCameraId,
        {
          fps: 15, // Increased for faster scanning
          qrbox: { width: 300, height: 120 }, // Optimized for 1D barcodes
          aspectRatio: 1.777,
          formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Common barcode formats
        },
        (decodedText) => {
          // Success callback
          if (navigator.vibrate) navigator.vibrate(100);
          stopScanner();
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignore scan errors (just means no barcode found in frame)
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Scanner start error:', err);
      setError(err.message || 'Failed to start camera. Please try manual entry.');
      setShowManualEntry(true);
    }
  }, [cameraId, cameras, getCameras, onScan]);

  // Stop scanning
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Handle manual barcode submission
  const handleManualSubmit = useCallback(() => {
    if (manualBarcode.trim()) {
      stopScanner();
      onScan(manualBarcode.trim());
      setManualBarcode('');
      setShowManualEntry(false);
    }
  }, [manualBarcode, onScan, stopScanner]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (cameras.length <= 1) return;

    const currentIndex = cameras.findIndex(c => c.id === cameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCameraId = cameras[nextIndex].id;

    await stopScanner();
    setCameraId(nextCameraId);
  }, [cameras, cameraId, stopScanner]);

  // Effect to handle open/close
  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
      setShowManualEntry(false);
      setManualBarcode('');
      setError(null);
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  // Effect to restart scanner when camera changes
  useEffect(() => {
    if (isOpen && cameraId && !showManualEntry) {
      startScanner();
    }
  }, [cameraId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-dark-900/90">
        <button onClick={onClose} className="p-2 rounded-full bg-dark-800/80 hover:bg-dark-700">
          <X className="w-6 h-6 text-white" />
        </button>
        <span className="text-white font-medium">Scan Barcode</span>
        <div className="flex gap-2">
          {cameras.length > 1 && (
            <button onClick={switchCamera} className="p-2 rounded-full bg-dark-800/80 hover:bg-dark-700">
              <Camera className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Scanner view */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        <div
          id="barcode-scanner-region"
          ref={scannerRef}
          className="w-full h-full"
          style={{ minHeight: '300px' }}
        />

        {/* Scanning indicator overlay */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-72 h-40 border-2 border-accent-primary/50 rounded-lg">
              <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-accent-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-accent-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-accent-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-accent-primary rounded-br-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Instructions / Manual Entry */}
      <div className="p-6 bg-dark-900">
        {showManualEntry ? (
          <div className="text-center">
            {error && (
              <p className="text-amber-400 text-sm mb-3">{error}</p>
            )}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                placeholder="Enter barcode number"
                className="flex-1 px-4 py-3 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 text-center text-lg tracking-wider"
                autoFocus
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowManualEntry(false);
                  setManualBarcode('');
                  setError(null);
                  startScanner();
                }}
                className="flex-1 px-4 py-3 bg-dark-700 text-white rounded-lg font-medium"
              >
                Back to Camera
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={!manualBarcode.trim()}
                className="flex-1 px-4 py-3 bg-accent-primary text-white rounded-lg font-medium disabled:opacity-50"
              >
                Search
              </button>
            </div>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  startScanner();
                }}
                className="px-6 py-3 bg-accent-primary text-white rounded-lg font-medium"
              >
                Try Again
              </button>
              <button
                onClick={() => setShowManualEntry(true)}
                className="px-6 py-3 bg-dark-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Keyboard className="w-4 h-4" />
                Enter Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-white text-lg mb-2">
              {isScanning ? 'Position barcode within frame' : 'Starting camera...'}
            </p>
            <p className="text-gray-400 text-sm mb-3">
              Works with UPC, EAN, QR codes, and most product barcodes
            </p>
            <button
              onClick={() => setShowManualEntry(true)}
              className="text-accent-primary text-sm flex items-center gap-1 mx-auto"
            >
              <Keyboard className="w-4 h-4" />
              Enter barcode manually
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BarcodeScanner;
