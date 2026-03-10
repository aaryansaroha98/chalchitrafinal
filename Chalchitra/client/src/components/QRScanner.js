import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Initialize scanner
    const scanner = new Html5QrcodeScanner('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      defaultZoomValueIfSupported: 2,
    });

    scannerRef.current = scanner;

    // Success callback
    const onScanSuccess = async (decodedText, decodedResult) => {
      if (isProcessing) return; // Prevent multiple processing

      console.log('QR Code scanned:', decodedText);
      setIsProcessing(true);
      setIsScanning(false);

      // Stop scanner
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }

      try {
        setScanResult({ status: 'processing' });

        const result = await onScan(decodedText);

        setScanResult({
          status: result?.allowed ? 'valid' : 'invalid',
          data: result
        });

        // Auto-close after 2 seconds for valid tickets 
        if (result?.allowed) {
          setTimeout(() => {
            onClose();
          }, 2000);
        }

      } catch (error) {
        console.error('Scan processing error:', error);
        setScanResult({
          status: 'error',
          data: { message: 'Processing failed' }
        });
      }
    };

    // Error callback - ignore most errors
    const onScanError = (errorMessage) => {
      // Only log serious errors
      if (!errorMessage.includes('NotFoundException')) {
        console.warn('QR Scan error:', errorMessage);
      }
    };

    // Start scanner
    scanner.render(onScanSuccess, onScanError);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const handleManualInput = () => {
    const code = prompt('Enter QR Code data:');
    if (code && code.trim()) {
      onScan(code.trim());
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setIsScanning(true);
    setIsProcessing(false);

    // Reinitialize scanner
    setTimeout(() => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }

      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      });

      scannerRef.current = scanner;

      const onScanSuccess = async (decodedText) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setIsScanning(false);

        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }

        try {
          setScanResult({ status: 'processing' });
          const result = await onScan(decodedText);
          setScanResult({
            status: result?.allowed ? 'valid' : 'invalid',
            data: result
          });

          if (result?.allowed) {
            setTimeout(() => onClose(), 2000);
          }
        } catch (error) {
          setScanResult({ status: 'error', data: { message: 'Processing failed' } });
        }
      };

      scanner.render(onScanSuccess, () => {});
    }, 100);
  };

  return (
    <Modal show={true} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="text-center w-100">
          <i className="fas fa-qrcode me-2"></i>
          QR Code Scanner
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="text-center">
        {/* Scan Result Overlay */}
        {scanResult && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: scanResult.status === 'processing' ? 'rgba(0,0,0,0.8)' :
                              scanResult.status === 'valid' ? 'rgba(40, 167, 69, 0.95)' :
                              'rgba(220, 53, 69, 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
          >
            <div className="text-center text-white p-4">
              {scanResult.status === 'processing' ? (
                <>
                  <Spinner animation="border" variant="light" className="mb-3" />
                  <h3>Processing Ticket...</h3>
                  <p className="mb-0">Validating QR code...</p>
                </>
              ) : scanResult.status === 'valid' ? (
                <>
                  <i className="fas fa-check-circle fa-4x mb-3"></i>
                  <h2 className="mb-3">✓ VALID TICKET</h2>
                  <div className="bg-white bg-opacity-20 rounded p-3">
                    <p className="mb-1 fw-bold">{scanResult.data?.student_name}</p>
                    <p className="mb-1">{scanResult.data?.student_email}</p>
                    <p className="mb-0">{scanResult.data?.movie_name}</p>
                  </div>
                  <p className="mt-3 small">Entry Allowed - Auto-closing...</p>
                </>
              ) : (
                <>
                  <i className="fas fa-times-circle fa-4x mb-3"></i>
                  <h2 className="mb-3">✗ INVALID TICKET</h2>
                  <div className="bg-white bg-opacity-20 rounded p-3">
                    <p className="mb-0">{scanResult.data?.validity_status || 'Entry Denied'}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* QR Scanner */}
        {isScanning && (
          <>
            <div className="mb-4">
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-3">
                  <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
                </Card.Body>
              </Card>
            </div>

            <div className="mb-3">
              <i className="fas fa-mobile-alt fa-2x text-primary mb-3"></i>
              <h5>Scan Student Ticket</h5>
              <p className="text-muted">Point camera at QR code on ticket</p>
            </div>

            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <Button onClick={handleManualInput} variant="outline-secondary">
                <i className="fas fa-keyboard me-2"></i>
                Manual Input
              </Button>
              <Button onClick={resetScanner} variant="outline-primary">
                <i className="fas fa-redo me-2"></i>
                Reset Scanner
              </Button>
            </div>
          </>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="danger" className="mt-3">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close Scanner
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default QRScanner;
