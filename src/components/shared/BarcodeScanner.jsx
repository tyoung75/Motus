import React, { useEffect, useRef, useState } from 'react';
import { X, Keyboard, Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export function BarcodeScanner({ isOpen, onScan, onClose }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameras, setCameras] = useState([]);

  // Refs to avoid stale closures
  const html5QrCodeRef = useRef(null);
  const onScanRef = useRef(onScan);
  const cameraIdRef = useRef(null);
  const mountedRef = useRef(false);
  const scannerBusyRef = useRef(false);

  // Keep callback ref current
  onScanRef.current = onScan;

  // Cleanup scanner instance
  const cleanup = async () => {
    const scanner = html5QrCodeRef.current;
    if (!scanner) return;

    try {
      const state = scanner.getState();
      if (state === 2) { // SCANNING
        await scanner.stop();
      }
      scanner.clear();
    } catch (e) {
      // Ignore cleanup errors
    }
    html5QrCodeRef.current = null;
    setIsScanning(false);
  };

  // Initialize and start scanner
  useEffect(() => {
    if (!isOpen) return;

    mountedRef.current = true;
    let timer;

    const init = async () => {
      if (scannerBusyRef.current || !mountedRef.current) return;
      scannerBusyRef.current = true;

      try {
        // Get cameras
        const devices = await Html5Qrcode.getCameras();
        if (!mountedRef.current) return;

        setCameras(devices);

        if (devices.length === 0) {
          setError('No cameras found. Use manual entry.');
          setShowManualEntry(true);
          scannerBusyRef.current = false;
          return;
        }

        // Prefer back camera
        const backCam = devices.find(d =>
          /back|rear|environment/i.test(d.label)
        );
        const selectedId = backCam?.id || devices[0]?.id;
        cameraIdRef.current = selectedId;

        // Verify DOM element exists
        const el = document.getElementById('barcode-scanner-region');
        if (!el || !mountedRef.current) {
          scannerBusyRef.current = false;
          return;
        }

        const scanner = new Html5Qrcode('barcode-scanner-region');
        html5QrCodeRef.current = scanner;

        await scanner.start(
          selectedId,
          {
            fps: 10,
            qrbox: { width: 280, height: 120 },
            aspectRatio: 1.0,
            formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          },
          (decodedText) => {
            // Barcode detected
            if (navigator.vibrate) navigator.vibrate(100);
            cleanup().then(() => {
              onScanRef.current(decodedText);
            });
          },
          () => {
            // No barcode in frame — ignore
          }
        );

        if (mountedRef.current) {
          setIsScanning(true);
        }
      } catch (err) {
        console.error('Scanner init error:', err);
        if (mountedRef.current) {
          setError(err.message || 'Failed to start camera.');
          setShowManualEntry(true);
        }
      } finally {
        scannerBusyRef.current = false;
      }
    };

    // Small delay for DOM readiness
    timer = setTimeout(init, 300);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      cleanup();
    };
  }, [isOpen]); // Only depend on isOpen — no function deps that change

  // Handle manual barcode submission
  const handleManualSubmit = () => {
    if (manualBarcode.trim()) {
      cleanup();
      onScanRef.current(manualBarcode.trim());
      setManualBarcode('');
      setShowManualEntry(false);
    }
  };

  // Switch camera
  const switchCamera = async () => {
    if (cameras.length <= 1 || scannerBusyRef.current) return;
    scannerBusyRef.current = true;

    const currentIndex = cameras.findIndex(c => c.id === cameraIdRef.current);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextId = cameras[nextIndex].id;
    cameraIdRef.current = nextId;

    try {
      await cleanup();
      // Small delay then restart
      await new Promise(r => setTimeout(r, 200));

      const el = document.getElementById('barcode-scanner-region');
      if (!el || !mountedRef.current) {
        scannerBusyRef.current = false;
        return;
      }

      const scanner = new Html5Qrcode('barcode-scanner-region');
      html5QrCodeRef.current = scanner;

      await scanner.start(
        nextId,
        {
          fps: 10,
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.0,
          formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        },
        (decodedText) => {
          if (navigator.vibrate) navigator.vibrate(100);
          cleanup().then(() => onScanRef.current(decodedText));
        },
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Camera switch error:', err);
      setError('Failed to switch camera.');
    } finally {
      scannerBusyRef.current = false;
    }
  };

  // Retry scanner
  const retryScanner = () => {
    setError(null);
    setShowManualEntry(false);
    cleanup().then(() => {
      // Small delay then re-trigger by remounting
      const el = document.getElementById('barcode-scanner-region');
      if (el) {
        scannerBusyRef.current = false;
        // Re-init
        const init = async () => {
          if (scannerBusyRef.current) return;
          scannerBusyRef.current = true;
          try {
            const selectedId = cameraIdRef.current || cameras[0]?.id;
            if (!selectedId) {
              setError('No camera available.');
              setShowManualEntry(true);
              scannerBusyRef.current = false;
              return;
            }
            const scanner = new Html5Qrcode('barcode-scanner-region');
            html5QrCodeRef.current = scanner;
            await scanner.start(
              selectedId,
              { fps: 10, qrbox: { width: 280, height: 120 }, aspectRatio: 1.0, formatsToSupport: [0,1,2,3,4,5,6,7,8,9,10,11] },
              (decodedText) => {
                if (navigator.vibrate) navigator.vibrate(100);
                cleanup().then(() => onScanRef.current(decodedText));
              },
              () => {}
            );
            setIsScanning(true);
          } catch (err) {
            setError(err.message || 'Failed to restart camera.');
            setShowManualEntry(true);
          } finally {
            scannerBusyRef.current = false;
          }
        };
        setTimeout(init, 300);
      }
    });
  };

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

      {/* Scanner view — html5-qrcode draws its own scanning box, no extra overlay needed */}
      <div className="flex-1 relative bg-black">
        <div
          id="barcode-scanner-region"
          className="w-full h-full"
          style={{ minHeight: '300px' }}
        />
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
                onClick={retryScanner}
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
                onClick={retryScanner}
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
