import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Alert, Card, Spinner, Badge } from 'react-bootstrap';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../api/axios';

const QRScanner = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [foodStatus, setFoodStatus] = useState([]);
  const [foodStatusLoaded, setFoodStatusLoaded] = useState(false);
  const [foodLoadingId, setFoodLoadingId] = useState(null);
  const scannerRef = useRef(null);
  const foodRequestRef = useRef(null);

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

        // Auto-close after 2 seconds for valid tickets without food orders
        if (result?.allowed && (!result?.food_orders || Object.keys(result.food_orders).length === 0)) {
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

  useEffect(() => {
    if (scanResult?.data?.booking_id) {
      loadFoodStatus(scanResult.data.booking_id);
    } else {
      setFoodStatus([]);
      setFoodStatusLoaded(false);
      foodRequestRef.current = null;
    }
  }, [scanResult?.data?.booking_id]);

  const loadFoodStatus = async (bookingId) => {
    if (!bookingId) {
      setFoodStatus([]);
      setFoodStatusLoaded(true);
      return;
    }

    try {
      setFoodStatusLoaded(false);
      foodRequestRef.current = bookingId;
      const response = await api.get(`/api/foods/status/${bookingId}`);

      if (foodRequestRef.current === bookingId) {
        setFoodStatus(Array.isArray(response.data) ? response.data : []);
        setFoodStatusLoaded(true);
      }
    } catch (err) {
      console.error('Failed to load food status:', err);
      if (foodRequestRef.current === bookingId) {
        setFoodStatus([]);
        setFoodStatusLoaded(true);
      }
    }
  };

  const markFoodAsGiven = async (bookingId, foodId, quantity) => {
    await api.post(`/api/foods/mark-given/${bookingId}/${foodId}`, {
      quantity,
      given_by: 1
    });
  };

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
    setFoodStatus([]);
    setFoodStatusLoaded(false);
    setFoodLoadingId(null);
    foodRequestRef.current = null;

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

          if (result?.allowed && (!result?.food_orders || Object.keys(result.food_orders).length === 0)) {
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
        {scanResult?.status === 'processing' && (
          <div className="py-5">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <h3>Processing Ticket...</h3>
            <p className="mb-0">Validating QR code...</p>
          </div>
        )}

        {/* QR Scanner */}
        {isScanning && !scanResult && (
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

        {scanResult && scanResult.status !== 'processing' && (
          <div className="mt-2">
            <div className={`rounded p-4 mb-3 ${
              scanResult.status === 'valid' ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'
            }`}>
              <div className="mb-3">
                {scanResult.status === 'valid' ? (
                  <>
                    <i className="fas fa-check-circle fa-3x text-success mb-2"></i>
                    <h3 className="mb-1">✓ VALID TICKET</h3>
                  </>
                ) : (
                  <>
                    <i className="fas fa-times-circle fa-3x text-danger mb-2"></i>
                    <h3 className="mb-1">✗ INVALID TICKET</h3>
                  </>
                )}
                <p className="mb-0 text-muted">{scanResult.data?.validity_status || scanResult.data?.message}</p>
              </div>

              <div className="bg-white bg-opacity-75 rounded p-3">
                <p className="mb-1 fw-bold">{scanResult.data?.student_name || 'N/A'}</p>
                <p className="mb-1">{scanResult.data?.student_email || 'N/A'}</p>
                <p className="mb-0">{scanResult.data?.movie_name || 'N/A'}</p>
              </div>
            </div>

            {scanResult.data?.booking_id && (
              <FoodMarkingComponent
                bookingId={scanResult.data.booking_id}
                foodStatus={foodStatus}
                foodStatusLoaded={foodStatusLoaded}
                loadingFoodId={foodLoadingId}
                onGive={async (foodId, remaining) => {
                  setFoodLoadingId(foodId);
                  try {
                    await markFoodAsGiven(scanResult.data.booking_id, foodId, remaining);
                    await loadFoodStatus(scanResult.data.booking_id);
                  } finally {
                    setFoodLoadingId(null);
                  }
                }}
              />
            )}

            <div className="d-flex gap-2 justify-content-center flex-wrap mt-3">
              <Button onClick={resetScanner} variant="outline-primary">
                <i className="fas fa-redo me-2"></i>
                Scan Another
              </Button>
            </div>
          </div>
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

const FoodMarkingComponent = ({ bookingId, foodStatus, foodStatusLoaded, onGive, loadingFoodId }) => {
  if (!foodStatusLoaded) {
    return (
      <div className="text-center py-3">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading food orders...
      </div>
    );
  }

  if (!foodStatus || foodStatus.length === 0) {
    return null;
  }

  return (
    <div className="text-start">
      <h5 className="mb-3">
        <i className="fas fa-utensils me-2 text-warning"></i>
        Food Orders
      </h5>
      <div className="d-flex flex-column gap-2">
        {foodStatus.map((food) => {
          const remaining = Math.max((food.ordered_quantity || 0) - (food.quantity_given || 0), 0);
          const isCompleted = remaining === 0;

          return (
            <div key={`${bookingId}-${food.food_id}`} className="border rounded p-2 d-flex align-items-center justify-content-between">
              <div>
                <div className={`fw-semibold ${isCompleted ? 'text-success text-decoration-line-through' : ''}`}>
                  {food.name || `Food ${food.food_id}`}
                </div>
                <small className="text-muted">
                  Ordered: {food.ordered_quantity || 0} • Served: {food.quantity_given || 0}
                </small>
              </div>
              {!isCompleted && (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => onGive(food.food_id, remaining)}
                  disabled={loadingFoodId === food.food_id}
                >
                  {loadingFoodId === food.food_id ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>Give ({remaining})</>
                  )}
                </Button>
              )}
              {isCompleted && (
                <Badge bg="success">Given</Badge>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QRScanner;
