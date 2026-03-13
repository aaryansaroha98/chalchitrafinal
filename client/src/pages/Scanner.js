import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert, Modal, Badge, Spinner } from 'react-bootstrap';
import api from '../api/axios';
import jsQR from 'jsqr';

const Scanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });
  const [showManualInput, setShowManualInput] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showPartialAdmission, setShowPartialAdmission] = useState(false);
  const [partialAdmissionData, setPartialAdmissionData] = useState(null);
  const [selectedPeopleCount, setSelectedPeopleCount] = useState(1);
  const [isProcessingFrame, setIsProcessingFrame] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [foodStatus, setFoodStatus] = useState([]);
  const [pendingFood, setPendingFood] = useState([]);
  const [foodStatusLoaded, setFoodStatusLoaded] = useState(false);
  const [currentBookingFood, setCurrentBookingFood] = useState(null);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const currentFoodLoadingRef = useRef(null); // Track current food loading request


  useEffect(() => {
    // Load scan history from localStorage
    const saved = localStorage.getItem('scanner_history');
    if (saved) {
      try {
        const history = JSON.parse(saved);
        setScanHistory(history);
        updateStats(history);
      } catch (e) {
        console.error('Error loading scan history:', e);
      }
    }

    return () => {
      stopScanner();
    };
  }, []);


  // Load food status when scan result changes
  useEffect(() => {
    // Only load food status if:
    // 1. scanResult exists and has data
    // 2. scanResult has a booking_id
    // 3. scanResult status is not 'processing' (not currently loading)
    // 4. scanResult has a valid status (not null/error)
    if (scanResult && 
        scanResult.data && 
        scanResult.data.booking_id && 
        scanResult.status !== 'processing' &&
        scanResult.status !== null) {
      console.log('🔄 Loading food status for scan result:', scanResult.data.booking_id);
      loadFoodStatus(scanResult.data.booking_id);
    } else if (scanResult === null) {
      // Clear food status when scan result is cleared
      // This prevents unnecessary API calls and flickering
      setFoodStatus([]);
      setPendingFood([]);
    }
  }, [scanResult]);

  // Load food status when partial admission modal opens
  useEffect(() => {
    if (partialAdmissionData && partialAdmissionData.booking_id) {
      console.log('🔄 Loading food status for partial admission:', partialAdmissionData.booking_id);
      // Check if we need to load for a different booking
      if (currentFoodLoadingRef.current !== partialAdmissionData.booking_id) {
        loadFoodStatus(partialAdmissionData.booking_id);
      }
    } else if (!partialAdmissionData) {
      // Clear food status when modal closes
      setFoodStatus([]);
      setPendingFood([]);
      currentFoodLoadingRef.current = null;
    }
  }, [partialAdmissionData]);

  function updateStats(history) {
    const total = history.length;
    const valid = history.filter(h => h.valid).length;
    const invalid = total - valid;
    setStats({ total, valid, invalid });
  }

  function saveScanHistory(history) {
    localStorage.setItem('scanner_history', JSON.stringify(history));
    updateStats(history);
  }

  const enumerateCameras = async () => {
    try {
      // Request permission first
      await navigator.mediaDevices.getUserMedia({ video: true });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');

      console.log('Available cameras:', cameras);
      setAvailableCameras(cameras);

      // Set default camera (back camera if available, otherwise first available)
      const backCamera = cameras.find(camera =>
        camera.label.toLowerCase().includes('back') ||
        camera.label.toLowerCase().includes('rear') ||
        camera.label.toLowerCase().includes('environment')
      );

      if (backCamera) {
        setSelectedCamera(backCamera.deviceId);
      } else if (cameras.length > 0) {
        setSelectedCamera(cameras[0].deviceId);
      }

      return cameras;
    } catch (error) {
      console.error('Error enumerating cameras:', error);
      setScanResult({
        status: 'error',
        data: { message: 'Failed to access cameras. Please check permissions.' }
      });
      return [];
    }
  };

  const selectCamera = async (deviceId) => {
    setSelectedCamera(deviceId);
    setShowCameraSelector(false);

    // If currently scanning, restart with new camera
    if (isScanning) {
      await stopScanner();
      setTimeout(() => startScanner(), 100);
    }
  };

  const scanQRFromImage = (imageData) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        console.log(`🖼️ Image loaded for scanning: ${img.width}x${img.height}`);
        
        const scanAtScale = (scale) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          const width = Math.floor(img.width * scale);
          const height = Math.floor(img.height * scale);
          
          canvas.width = width;
          canvas.height = height;
          
          // Use low image smoothing for sharper edges on downscaling (better for QR)
          ctx.imageSmoothingEnabled = false;
          
          ctx.drawImage(img, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          return jsQR(imageData.data, width, height);
        };

        // Try multiple scales for robust detection
        // jsQR works best when QR module size is around 2-4 pixels
        const scales = [1.0, 0.75, 0.5, 0.25];
        let code = null;

        for (const scale of scales) {
          if (scale < 1.0 && img.width * scale < 200) continue; // Don't scale too small
          
          console.log(`🔄 Attempting QR detection at ${scale}x scale (${Math.floor(img.width * scale)}px wide)...`);
          code = scanAtScale(scale);
          if (code) break;
        }

        if (code) {
          console.log('🎯 QR Code detected in image:', code.data);
          resolve(code.data);
        } else {
          console.log('❌ No QR code found in image after multiple scaling attempts');
          resolve(null);
        }
      };
      img.onerror = (err) => {
        console.error('❌ Failed to load image for scanning:', err);
        resolve(null);
      };
      img.src = imageData;
    });
  };

  const startScanner = async () => {
    try {
      console.log('🔄 Starting automatic QR scanner...');
      console.log('📱 Available cameras:', availableCameras.length);

      setIsScanning(true);
      setScanResult(null);

      // Get camera access using selected device or default constraints
      const videoConstraints = selectedCamera ? {
        deviceId: { exact: selectedCamera },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } : {
        facingMode: 'environment', // Back camera fallback
        width: { ideal: 1280 },
        height: { ideal: 720 }
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });

      console.log('✅ Camera access granted');

      // Create video element and attach stream
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.playsInline = true; // Important for mobile
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'cover';

      // Clear the container and add video
      const container = document.getElementById('qr-reader');
      container.innerHTML = '';
      container.appendChild(videoElement);

      console.log('📹 Camera video element added to DOM');

      // Store stream for cleanup
      scannerRef.current = stream;
      videoRef.current = videoElement;

      // Wait for video to be ready
      await new Promise((resolve) => {
        videoElement.onloadedmetadata = () => {
          console.log('🎬 Video metadata loaded, starting QR scan...');
          resolve();
        };
      });

      // Start continuous QR scanning
      startContinuousScan();

      // Add a manual scan button as fallback

    } catch (error) {
      console.error('❌ Camera error:', error);
      setIsScanning(false);
      setScanResult({
        status: 'error',
        data: { message: 'Camera access failed. Please allow camera permissions.' }
      });
    }
  };

  const startContinuousScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvasRef.current = canvas;

    scanIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !videoRef.current.videoWidth || isProcessingFrame) {
        return;
      }

      setIsProcessingFrame(true);

      try {
        // Set canvas size to video size
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        // Draw current video frame to canvas
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Scan for QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          console.log('🎯 QR Code detected:', code.data);
          console.log('📏 QR Code length:', code.data.length);
          console.log('🔍 QR Code content preview:', code.data.substring(0, 200));

          // Try to parse as JSON to validate
          try {
            const parsedData = JSON.parse(code.data);
            console.log('✅ QR Code is valid JSON:', parsedData);
          } catch (parseError) {
            console.log('❌ QR Code is NOT valid JSON:', parseError.message);
            console.log('📝 Raw QR content:', code.data);
          }

          // Stop scanning
          clearInterval(scanIntervalRef.current);
          await stopScanner();

          // Process the detected QR code
          await handleScan(code.data);
        }
      } catch (error) {
        console.error('Frame scan error:', error);
      } finally {
        setIsProcessingFrame(false);
      }
    }, 500); // Scan every 500ms
  };

  const handleScan = async (qrCode, numPeople = null) => {
    console.log('🎯 Processing QR code:', qrCode, 'People:', numPeople);

    setScanResult({ status: 'processing' });
    
    // We don't want to block the whole screen during a quick scan, 
    // but the user asked for "this animation for all pages".
    // However, Scanner has its own overlay logic. 
    // Let's see if we should use Loader here.

    try {
      const requestData = { qr_code: qrCode };
      if (numPeople !== null) {
        requestData.num_people = numPeople;
      }

      const response = await api.post('/api/bookings/scan', requestData);

      const result = response.data;
      console.log('Scan result:', result);
      console.log('Food orders in result:', result.food_orders);
      console.log('Food orders type:', typeof result.food_orders);
      console.log('Food orders keys:', result.food_orders ? Object.keys(result.food_orders) : 'No food_orders');

      // Check if this is a partial admission request
      if (result.needs_selection) {
        console.log('🎫 Partial admission required for group ticket');
        let bookingId = result.booking_id;
        if (!bookingId) {
          try {
            const qrData = JSON.parse(qrCode);
            bookingId = qrData.booking_id;
          } catch (e) {
            console.error('Could not extract booking ID for partial admission food loading');
          }
        }

        if (bookingId) {
          await loadFoodStatus(bookingId);
        } else {
          setFoodStatus([]);
          setPendingFood([]);
          setFoodStatusLoaded(true);
        }

        setPartialAdmissionData(result);
        setSelectedPeopleCount(1); // Default to 1
        setShowPartialAdmission(true);
        setScanResult(null); // Clear processing state
        return;
      }

      console.log('📝 Full result object:', result);
      console.log('👤 Available name fields:', {
        student_name: result.student_name,
        name: result.name,
        user_name: result.user_name
      });
      console.log('🎬 Available movie fields:', {
        movie_name: result.movie_name,
        title: result.title,
        movie_title: result.movie_title
      });

      const scanRecord = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        data: result,
        valid: result.allowed,
        qrData: qrCode
      };

      const newHistory = [scanRecord, ...scanHistory.slice(0, 19)];
      setScanHistory(newHistory);
      saveScanHistory(newHistory);

      // Always load food status for the booking if booking_id is available, even if ticket is already used
      let bookingId = result.booking_id;
      if (!bookingId) {
        // Fallback: try to extract from QR code data
        try {
          const qrData = JSON.parse(qrCode);
          bookingId = qrData.booking_id;
        } catch (e) {
          console.error('Could not extract booking ID for food loading');
        }
      }

      if (bookingId) {
        console.log('📋 Loading food status for booking:', bookingId);
        loadFoodStatus(bookingId);
      } else {
        // Clear food status if no booking ID found
        setPendingFood([]);
        setFoodStatus([]);
      }

      // Show success/error modal and auto-restart scanner
      if (result.allowed) {
        setLastScanResult(result);
        setShowSuccessModal(true);
      } else {
        setLastScanResult(result);
        setShowErrorModal(true);
      }

      // Don't clear the result card immediately if there are pending food items
      // Let the user mark food items first
      if (!result.food_orders || Object.keys(result.food_orders).length === 0) {
        // Clear the result card after 1.5 seconds only if no food orders
        // Also clear food status to prevent flickering
        setTimeout(() => {
          setScanResult(null);
          setFoodStatus([]);
          setPendingFood([]);
        }, 1500);
      } else {
        // Keep the result card visible for food marking
        console.log('🍽️ Keeping scan result visible for food marking');
      }

    } catch (error) {
      console.error('Scan error:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);

      const errorResult = error.response?.data || { message: 'Scan failed', validity_status: 'ERROR' };

      const scanRecord = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        data: errorResult,
        valid: false,
        qrData: qrCode
      };

      const newHistory = [scanRecord, ...scanHistory.slice(0, 19)];
      setScanHistory(newHistory);
      saveScanHistory(newHistory);

      setScanResult({
        status: 'error',
        data: errorResult
      });
    }
  };

  const handlePartialAdmission = async (numPeople) => {
    if (!partialAdmissionData) return;

    console.log('👥 Processing partial admission:', numPeople, 'people');

    setShowPartialAdmission(false);
    setScanResult({ status: 'processing' });

    try {
      const response = await api.post('/api/bookings/scan', {
        qr_code: partialAdmissionData.booking_id, // Use booking ID for partial admission
        num_people: numPeople
      });

      const result = response.data;
      console.log('Partial admission result:', result);
      console.log('Partial admission food_orders:', result.food_orders);

      const scanRecord = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        data: result,
        valid: result.allowed,
        qrData: partialAdmissionData.booking_id,
        partial: true,
        peopleAdmitted: numPeople
      };

      const newHistory = [scanRecord, ...scanHistory.slice(0, 19)];
      setScanHistory(newHistory);
      saveScanHistory(newHistory);

      // For partial admission, show the result and food orders
      setScanResult({
        status: result.allowed ? 'valid' : 'invalid',
        data: result
      });

      // Show success modal for partial admission if successful
      if (result.allowed) {
        setLastScanResult(result);
        setShowSuccessModal(true);
        // Clear scan result after showing modal
        setTimeout(() => setScanResult(null), 1000);
      }

      setPartialAdmissionData(null);

    } catch (error) {
      console.error('Partial admission error:', error);
      const errorResult = error.response?.data || { message: 'Partial admission failed', validity_status: 'ERROR' };

      const scanRecord = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        data: errorResult,
        valid: false,
        qrData: partialAdmissionData.booking_id
      };

      const newHistory = [scanRecord, ...scanHistory.slice(0, 19)];
      setScanHistory(newHistory);
      saveScanHistory(newHistory);

      setScanResult({
        status: 'error',
        data: errorResult
      });

      setPartialAdmissionData(null);
    }
  };

  function stopScanner() {
    console.log('🛑 Stopping scanner...');
    setIsScanning(false);

    if (scannerRef.current) {
      // Stop all tracks
      if (scannerRef.current.getTracks) {
        scannerRef.current.getTracks().forEach(track => track.stop());
      }
      scannerRef.current = null;
    }

    // Clear the container
    const container = document.getElementById('qr-reader');
    if (container) {
      container.innerHTML = '<div class="text-center text-muted"><i class="fas fa-camera fa-3x mb-3"></i><p>Camera stopped</p></div>';
    }
  };


  const clearHistory = () => {
    setScanHistory([]);
    setStats({ total: 0, valid: 0, invalid: 0 });
    localStorage.removeItem('scanner_history');
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📁 File selected:', file.name, file.type);

    // Create a preview of the uploaded image
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target.result;

      // Show processing modal
      const modal = document.createElement('div');
      modal.className = 'modal fade show';
      modal.style.display = 'block';
      modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
      modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="fas fa-file-image me-2"></i>
                Processing Image: ${file.name}
              </h5>
            </div>
            <div class="modal-body text-center">
              <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Processing...</span>
              </div>
              <img src="${imageUrl}" alt="Uploaded QR Code" style="max-width: 100%; max-height: 300px; border: 2px solid #dee2e6; border-radius: 8px; margin-bottom: 20px;">
              <p class="mb-0">Scanning for QR code...</p>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      try {
        // Automatically detect QR code in the image
        const qrCode = await scanQRFromImage(imageUrl);

        if (qrCode) {
          // QR code found - process it
          modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-centered">
              <div class="modal-content">
                <div class="modal-header bg-success text-white">
                  <h5 class="modal-title">
                    <i class="fas fa-check-circle me-2"></i>
                    QR Code Detected!
                  </h5>
                </div>
                <div class="modal-body text-center">
                  <i class="fas fa-qrcode fa-3x text-success mb-3"></i>
                  <p class="mb-2">Successfully detected QR code in image</p>
                  <code class="d-block bg-light p-2 rounded small text-break">${qrCode}</code>
                  <p class="mt-3 mb-0">Processing ticket validation...</p>
                </div>
              </div>
            </div>
          `;

          // Wait a moment then process
          setTimeout(async () => {
            modal.remove();
            await handleScan(qrCode);
          }, 1500);

        } else {
          // No QR code found - show manual input option
          modal.innerHTML = `
            <div class="modal-dialog modal-lg modal-dialog-centered">
              <div class="modal-content">
                <div class="modal-header bg-warning">
                  <h5 class="modal-title">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    No QR Code Found
                  </h5>
                </div>
                <div class="modal-body text-center">
                  <img src="${imageUrl}" alt="Uploaded QR Code" style="max-width: 100%; max-height: 300px; border: 2px solid #dee2e6; border-radius: 8px; margin-bottom: 20px;">
                  <p class="text-muted mb-3">
                    Could not automatically detect a QR code in this image.
                    If you can see a QR code, please enter the data manually below.
                  </p>
                  <div class="input-group mb-3">
                    <span class="input-group-text">
                      <i class="fas fa-qrcode"></i>
                    </span>
                    <input type="text" class="form-control" id="qrCodeInput" placeholder="Enter QR code data manually..." />
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                  <button type="button" class="btn btn-primary" id="scanFromImageBtn">
                    <i class="fas fa-search me-1"></i>
                    Scan Manually
                  </button>
                </div>
              </div>
            </div>
          `;

          // Add manual input functionality
          setTimeout(() => {
            const scanBtn = document.getElementById('scanFromImageBtn');
            const qrInput = document.getElementById('qrCodeInput');

            scanBtn.onclick = async () => {
              const qrCode = qrInput.value.trim();
              if (qrCode) {
                modal.remove();
                await handleScan(qrCode);
              } else {
                alert('Please enter the QR code data from the image.');
              }
            };

            qrInput.focus();
          }, 100);
        }

      } catch (error) {
        console.error('File processing error:', error);
        modal.innerHTML = `
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header bg-danger text-white">
                <h5 class="modal-title">
                  <i class="fas fa-exclamation-circle me-2"></i>
                  Processing Error
                </h5>
                <button type="button" class="btn-close btn-close-white" onclick="this.closest('.modal').remove()"></button>
              </div>
              <div class="modal-body text-center">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <p class="mb-0">Failed to process the image. Please try again.</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
              </div>
            </div>
          </div>
        `;
      }
    };

    reader.readAsDataURL(file);
  };

  // Food marking functions
  async function loadFoodStatus(bookingId) {
    // Guard: Don't load food status if no booking ID
    if (!bookingId) {
      console.log('⚠️ No booking ID provided for food status');
      setFoodStatus([]);
      setPendingFood([]);
      setFoodStatusLoaded(true);
      return [];
    }

    // Guard: Don't make duplicate API call if already loading for the same booking
    // This prevents flickering and duplicate requests
    if (currentFoodLoadingRef.current === bookingId && !foodStatusLoaded) {
      console.log('⏳ Food status already loading for booking:', bookingId);
      return [];
    }

    try {
      console.log('🔄 Loading complete food status for booking:', bookingId);
      currentFoodLoadingRef.current = bookingId;
      setFoodStatusLoaded(false);
      const response = await api.get(`/api/foods/status/${bookingId}`);
      console.log('📋 API Response for food status:', response.data);

      // Only update state if this is still the current request
      if (currentFoodLoadingRef.current === bookingId) {
        setFoodStatus(response.data);

        // Also set pending food for backward compatibility with the component
        const pending = response.data.filter(food => food.quantity_given < food.ordered_quantity);
        setPendingFood(pending);
        setFoodStatusLoaded(true);
        currentFoodLoadingRef.current = null;
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error loading food status:', error);
      // Only reset state if this is still the current request
      if (currentFoodLoadingRef.current === bookingId) {
        setFoodStatus([]);
        setPendingFood([]);
        setFoodStatusLoaded(true);
        currentFoodLoadingRef.current = null;
      }
      return [];
    }
  };

  // Keep old function for backward compatibility
  const loadPendingFood = loadFoodStatus;

  const markFoodAsGiven = async (bookingId, foodId, quantity = 1) => {
    try {
      const response = await api.post(`/api/foods/mark-given/${bookingId}/${foodId}`, {
        quantity,
        given_by: 1 // TODO: Get from auth context
      });

      console.log('✅ Food marked as given:', response.data);

      // Update pending food list
      await loadPendingFood(bookingId);

      // Update food status (foodStatus is an array, not an object)
      setFoodStatus(prev => {
        return prev.map(food => {
          if (food.food_id === parseInt(foodId)) {
            return {
              ...food,
              quantity_given: (food.quantity_given || 0) + quantity,
              is_completed: response.data.is_completed
            };
          }
          return food;
        });
      });

      return response.data;
    } catch (error) {
      console.error('Error marking food as given:', error);
      throw error;
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setFoodStatus([]);
    setPendingFood([]);
    currentFoodLoadingRef.current = null;
  };

  // Food Marking Component


  return (
    <div className="bg-void" style={{minHeight: '100vh', position: 'relative', overflow: 'hidden'}}>
      {/* Classic Simple Animated Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden'
      }}>
        {/* Pure black background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#000000'
        }}></div>

        {/* White animated particles */}
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '50%',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animation: `randomFloat${i % 4} ${10 + Math.random() * 20}s linear infinite`,
              animationDelay: Math.random() * 10 + 's',
              boxShadow: '0 0 6px rgba(255, 255, 255, 0.3)',
              opacity: Math.random() * 0.4 + 0.2,
              zIndex: 2
            }}
          />
        ))}

        {/* Gentle moving waves */}
        <div style={{
          position: 'absolute',
          top: '30%',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
          animation: 'gentleWave 20s ease-in-out infinite',
          opacity: 0.3
        }}></div>

        <div style={{
          position: 'absolute',
          top: '70%',
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%)',
          animation: 'gentleWave 25s ease-in-out infinite',
          animationDelay: '5s',
          opacity: 0.2
        }}></div>

        {/* Subtle geometric shapes */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '100px',
          height: '100px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          animation: 'slowRotate 60s linear infinite',
          opacity: 0.2
        }}></div>

        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '15%',
          width: '80px',
          height: '80px',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          borderRadius: '50%',
          animation: 'slowRotateReverse 45s linear infinite',
          opacity: 0.15
        }}></div>
      </div>

      {/* Animated Background Grid */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 25% 25%, var(--primary-color) 1px, transparent 1px),
          radial-gradient(circle at 75% 75%, var(--secondary-color) 1px, transparent 1px),
          radial-gradient(circle at 50% 50%, var(--accent-color) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px, 150px 150px, 200px 200px',
        backgroundPosition: '0 0, 50px 50px, 25px 25px',
        opacity: 0.03,
        animation: 'gridMove 20s linear infinite',
        pointerEvents: 'none',
        zIndex: 1
      }}></div>



      <Container style={{padding: '2rem 2rem 4rem', position: 'relative', zIndex: 2}}>
        <div className="text-center mb-4">
          <h1 className="mb-3" style={{color: 'white'}}>
            <i className="fas fa-qrcode text-primary me-3"></i>
            QR Code Scanner
          </h1>
          <p style={{color: 'white'}}>Scan student tickets for entry validation</p>
          <Badge bg="info" className="fs-6 px-3 py-2">
            <i className="fas fa-shield-alt me-1"></i>
            Secure Entry System
          </Badge>
        </div>

        {/* Stats Dashboard */}
        <Row className="mb-4 g-3 g-md-4">
          <Col md={4} xs={4}>
            <Card className="text-center h-100" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(10px)'
            }}>
              <Card.Body className="py-3">
                <h3 className="mb-1" style={{color: '#ffffff', fontWeight: 700, fontSize: '1.6rem'}}>{stats.total}</h3>
                <p className="mb-0 fw-semibold" style={{color: '#ffffff'}}>Total Scanned</p>
                <small style={{color: 'rgba(255,255,255,0.9)'}}>All time</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} xs={4}>
            <Card className="text-center h-100" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(10px)'
            }}>
              <Card.Body className="py-3">
                <h3 className="mb-1" style={{color: '#ffffff', fontWeight: 700, fontSize: '1.6rem'}}>{stats.valid}</h3>
                <p className="mb-0 fw-semibold" style={{color: '#ffffff'}}>Valid Tickets</p>
                <small style={{color: 'rgba(255,255,255,0.9)'}}>Entry Allowed</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} xs={4}>
            <Card className="text-center h-100" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(10px)'
            }}>
              <Card.Body className="py-3">
                <h3 className="mb-1" style={{color: '#ffffff', fontWeight: 700, fontSize: '1.6rem'}}>{stats.invalid}</h3>
                <p className="mb-0 fw-semibold" style={{color: '#ffffff'}}>Invalid Tickets</p>
                <small style={{color: 'rgba(255,255,255,0.9)'}}>Entry Denied</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Scanner Controls */}
        <Row className="mb-4">
          <Col md={8} className="mx-auto">
            <Card className="shadow" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '14px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(10px)'
            }}>
              <Card.Header className="text-center" style={{
                background: 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                color: '#ffffff'
              }}>
                <h5 className="mb-0">
                  <i className="fas fa-camera me-2"></i>
                  QR Code Scanner
                </h5>
              </Card.Header>
              <Card.Body className="text-center" style={{color: '#ffffff'}}>
                {!isScanning ? (
                  <div>
                    <div className="mb-4">
                      <i className="fas fa-mobile-alt fa-4x text-primary mb-3"></i>
                      <h5 style={{color: '#ffffff'}}>Ready to Scan</h5>
                      <p style={{color: 'rgba(255,255,255,0.75)'}}>Click start to begin scanning tickets</p>
                    </div>
                    <div className="d-flex gap-2 justify-content-center flex-wrap mb-3">
                      <Button
                        variant="success"
                        size="lg"
                        onClick={startScanner}
                        className="px-4"
                      >
                        <i className="fas fa-play me-2"></i>
                        Start Scanning
                      </Button>
                      <Button
                        variant="outline-info"
                        size="lg"
                        onClick={async () => {
                          try {
                            const response = await api.get('/api/bookings');
                            alert('Server connection OK! Found ' + response.data.length + ' bookings.');
                          } catch (error) {
                            alert('Server connection failed: ' + error.message);
                          }
                        }}
                      >
                        <i className="fas fa-server me-2"></i>
                        Test Server
                      </Button>
                    </div>

                    {/* Device Selection Options */}
                    <div className="text-center">
                      <div className="d-flex gap-2 justify-content-center flex-wrap mb-2">
                        <Button
                          variant="outline-secondary"
                          onClick={() => {
                            enumerateCameras();
                            setShowCameraSelector(true);
                          }}
                        >
                          <i className="fas fa-camera me-2"></i>
                          Camera ({availableCameras.length})
                        </Button>
                        <Button
                          variant="outline-info"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <i className="fas fa-file-image me-2"></i>
                          Upload Image
                        </Button>
                      </div>
                      {selectedCamera && (
                        <div className="small text-muted">
                          Current: {availableCameras.find(c => c.deviceId === selectedCamera)?.label || 'Unknown Camera'}
                        </div>
                      )}

                      {/* Hidden file input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 d-flex justify-content-center">
                      <div className="position-relative">
                        {/* Square Scanner Frame */}
                        <div
                          style={{
                            width: '320px',
                            height: '320px',
                            background: 'transparent',
                            border: '4px solid #007bff',
                            borderRadius: '16px',
                            position: 'relative',
                            boxShadow: '0 0 20px rgba(0, 123, 255, 0.3)',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Corner markers for QR scanner look */}
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            width: '40px',
                            height: '40px',
                            borderLeft: '4px solid #007bff',
                            borderTop: '4px solid #007bff',
                            borderRadius: '10px 0 0 0'
                          }}></div>
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            width: '40px',
                            height: '40px',
                            borderRight: '4px solid #007bff',
                            borderTop: '4px solid #007bff',
                            borderRadius: '0 10px 0 0'
                          }}></div>
                          <div style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '10px',
                            width: '40px',
                            height: '40px',
                            borderLeft: '4px solid #007bff',
                            borderBottom: '4px solid #007bff',
                            borderRadius: '0 0 0 10px'
                          }}></div>
                          <div style={{
                            position: 'absolute',
                            bottom: '10px',
                            right: '10px',
                            width: '40px',
                            height: '40px',
                            borderRight: '4px solid #007bff',
                            borderBottom: '4px solid #007bff',
                            borderRadius: '0 0 10px 0'
                          }}></div>

                          {/* Camera Video Container */}
                          <div
                            id="qr-reader"
                            style={{
                              width: '100%',
                              height: '100%',
                              background: '#000',
                              position: 'relative',
                              overflow: 'hidden',
                              borderRadius: '12px'
                            }}
                          >
                            {/* Camera will render here */}
                          </div>
                        </div>

                        {/* Scan Instructions Overlay */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-60px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0, 123, 255, 0.9)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 12px rgba(0, 123, 255, 0.4)'
                          }}
                        >
                          <i className="fas fa-qrcode me-1"></i>
                          Position QR Code Inside Frame
                        </div>
                      </div>
                    </div>

                    <Alert variant="info" className="mb-3">
                      <i className="fas fa-info-circle me-2"></i>
                      <strong>Scanning Active:</strong> Point camera at QR code on ticket. The scanner will automatically detect and validate.
                    </Alert>

                    <Button
                      variant="danger"
                      size="lg"
                      onClick={stopScanner}
                      className="px-4"
                    >
                      <i className="fas fa-stop me-2"></i>
                      Stop Scanning
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Scan Result */}
        {scanResult && (
          <Row className="mb-4">
            <Col md={8} className="mx-auto">
              <Card className={`shadow border-3 ${
                scanResult.status === 'valid' ? 'border-success' :
                scanResult.status === 'invalid' ? 'border-danger' :
                scanResult.status === 'error' ? 'border-warning' : 'border-info'
              }`}>
                <Card.Header className={`text-white text-center ${
                  scanResult.status === 'valid' ? 'bg-success' :
                  scanResult.status === 'invalid' ? 'bg-danger' :
                  scanResult.status === 'error' ? 'bg-warning' : 'bg-info'
                }`}>
                  <h5 className="mb-0">
                    {scanResult.status === 'processing' ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Processing Ticket...
                      </>
                    ) : scanResult.status === 'valid' ? (
                      <>
                        <i className="fas fa-check-circle me-2"></i>
                        ✓ VALID TICKET - Entry Allowed
                      </>
                    ) : scanResult.status === 'invalid' ? (
                      <>
                        <i className="fas fa-times-circle me-2"></i>
                        ✗ INVALID TICKET - Entry Denied
                      </>
                    ) : (
                      <>
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Error Processing Ticket
                      </>
                    )}
                  </h5>
                </Card.Header>
                <Card.Body>
                  {scanResult.status === 'processing' ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" className="mb-3" />
                      <p className="mb-0">Validating ticket information...</p>
                    </div>
                  ) : (
                    <div>
                      <Row className="mb-3">
                        <Col sm={6}>
                          <strong>Name:</strong><br />
                          {scanResult.data?.student_name || 'N/A'}
                        </Col>
                        <Col sm={6}>
                          <strong>Email:</strong><br />
                          {scanResult.data?.student_email || 'N/A'}
                        </Col>
                      </Row>
                      <Row className="mb-3">
                        <Col sm={6}>
                          <strong>Movie:</strong><br />
                          {scanResult.data?.movie_name || 'N/A'}
                        </Col>
                        <Col sm={6}>
                          <strong>Booking ID:</strong><br />
                          {scanResult.data?.booking_id || 'N/A'}
                        </Col>
                      </Row>
                      {(scanResult.data?.total_people !== undefined ||
                        scanResult.data?.admitted_people !== undefined ||
                        scanResult.data?.remaining_people !== undefined) && (
                        <Row className="mb-3">
                          <Col sm={4}>
                            <strong>Total:</strong><br />
                            {scanResult.data?.total_people ?? 'N/A'}
                          </Col>
                          <Col sm={4}>
                            <strong>Admitted:</strong><br />
                            {scanResult.data?.admitted_people ?? 'N/A'}
                          </Col>
                          <Col sm={4}>
                            <strong>Remaining:</strong><br />
                            {scanResult.data?.remaining_people ?? 'N/A'}
                          </Col>
                        </Row>
                      )}

                      {/* Food Marking Component - Interactive food serving */}
                      {scanResult && scanResult.data && foodStatusLoaded && foodStatus && foodStatus.length > 0 && (
                        <Row className="mb-3">
                          <Col xs={12}>
                            <FoodMarkingComponent
                              bookingId={scanResult.data.booking_id}
                              foodStatus={foodStatus}
                              onFoodMarked={() => {
                                if (scanResult.data?.booking_id) {
                                  loadFoodStatus(scanResult.data.booking_id);
                                }
                              }}
                              markFoodAsGiven={markFoodAsGiven}
                            />
                          </Col>
                        </Row>
                      )}

                      {scanResult.data?.take_time && (
                        <Row className="mb-2">
                          <Col xs={12}>
                            <Badge bg="info" className="w-100 py-2">
                              <i className="fas fa-clock me-2"></i>
                              Estimated preparation time: {scanResult.data.take_time} minutes
                            </Badge>
                          </Col>
                        </Row>
                      )}

                      {scanResult.data?.validity_status && (
                        <Alert variant={scanResult.status === 'valid' ? 'success' : 'danger'} className="mb-0">
                          <strong>Status:</strong> {scanResult.data.validity_status}
                        </Alert>
                      )}
                    </div>
                  )}
                </Card.Body>
                {scanResult.status !== 'processing' && (
                  <Card.Footer className="text-center">
                    <Button variant="outline-primary" onClick={resetScan}>
                      <i className="fas fa-redo me-2"></i>
                      Scan Another Ticket
                    </Button>
                  </Card.Footer>
                )}
              </Card>
            </Col>
          </Row>
        )}

        {/* Current Food Orders - Persistent Section */}
        {currentBookingFood && (
          <Row className="mb-4">
            <Col md={8} className="mx-auto">
              <Card className="shadow border-warning">
                <Card.Header className="bg-warning text-dark text-center">
                  <h5 className="mb-0">
                    <i className="fas fa-utensils me-2"></i>
                    🍽️ Current Food Orders - {currentBookingFood.bookingId}
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 152, 0, 0.08))',
                    borderRadius: '12px',
                    padding: '1rem',
                    border: '2px solid rgba(255, 193, 7, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(45deg, rgba(255, 193, 7, 0.05), rgba(255, 152, 0, 0.03))',
                      borderRadius: '12px'
                    }}></div>

                    <div style={{
                      position: 'relative',
                      zIndex: 2,
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: '#f57c00',
                      marginBottom: '1rem',
                      textAlign: 'center'
                    }}>
                      <i className="fas fa-utensils me-2"></i>
                      🍽️ Food to Prepare ({currentBookingFood.items?.length || 0} items)
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      {currentBookingFood.items?.map((food, index) => (
                        <div key={index} style={{
                          background: 'white',
                          borderRadius: '10px',
                          padding: '0.75rem',
                          border: '2px solid rgba(255, 193, 7, 0.2)',
                          boxShadow: '0 2px 8px rgba(255, 152, 0, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '1rem',
                              fontWeight: '600',
                              color: '#333',
                              marginBottom: '0.25rem'
                            }}>
                              {food.name || `Food Item ${index + 1}`}
                            </div>
                            <div style={{
                              fontSize: '0.85rem',
                              color: '#666'
                            }}>
                              Ordered: {food.quantity || food.ordered_quantity || 0} |
                              Remaining: {food.remaining || food.remaining_quantity || 0}
                            </div>
                          </div>

                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => alert(`Food marked as given: ${food.name || `Food Item ${index + 1}`}`)}
                            style={{
                              minWidth: '80px',
                              fontWeight: '600'
                            }}
                          >
                            <i className="fas fa-check me-1"></i>
                            Give ({food.remaining || food.remaining_quantity || food.quantity || 0})
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.1)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 193, 7, 0.2)',
                      textAlign: 'center'
                    }}>
                      <small style={{
                        color: '#f57c00',
                        fontWeight: '600',
                        fontSize: '0.85rem'
                      }}>
                        <i className="fas fa-info-circle me-1"></i>
                        Click "Give" when food is ready for the customer
                      </small>
                    </div>
                  </div>
                </Card.Body>
                <Card.Footer className="text-center">
                  <Button variant="outline-warning" onClick={() => setCurrentBookingFood(null)}>
                    <i className="fas fa-times me-2"></i>
                    Clear Food Orders
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        )}

        {/* Scan History */}
        <Card className="shadow" style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '14px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(10px)'
        }}>
          <Card.Header className="d-flex justify-content-between align-items-center" style={{
            background: 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            color: '#ffffff'
          }}>
            <h5 className="mb-0" style={{color: '#ffffff'}}>
              <i className="fas fa-history me-2"></i>
              Recent Scans ({scanHistory.length})
            </h5>
            {scanHistory.length > 0 && (
              <Button variant="outline-danger" size="sm" onClick={clearHistory}>
                <i className="fas fa-trash me-1"></i>
                Clear History
              </Button>
            )}
          </Card.Header>
          <Card.Body style={{color: '#ffffff'}}>
            {scanHistory.length === 0 ? (
              <div className="text-center py-4" style={{color: 'rgba(255,255,255,0.7)'}}>
                <i className="fas fa-inbox fa-2x mb-3"></i>
                <p className="mb-0">No scans yet. Start scanning tickets!</p>
              </div>
            ) : (
              <div className="list-group">
                {scanHistory.map(scan => {
                  const displayName = scan.data?.student_name || scan.data?.name || 'Unknown';
                  const displayMovie = scan.data?.movie_name || scan.data?.title || 'Unknown Movie';

                  console.log('📋 Scan history item:', scan.id, {
                    student_name: scan.data?.student_name,
                    name: scan.data?.name,
                    movie_name: scan.data?.movie_name,
                    title: scan.data?.title,
                    displayName,
                    displayMovie
                  });

                  return (
                    <div key={scan.id} className="list-group-item d-flex justify-content-between align-items-center" style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: '#ffffff'
                    }}>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <strong className="text-truncate me-2" style={{maxWidth: '200px', color: '#ffffff'}}>
                            {displayName}
                          </strong>
                          <Badge bg={scan.valid ? 'success' : 'danger'} className="px-2 py-1">
                            {scan.valid ? 'VALID' : 'INVALID'}
                          </Badge>
                        </div>
                        <small className="d-block" style={{color: 'rgba(255,255,255,0.7)'}}>
                          {scan.timestamp} • {displayMovie}
                        </small>
                        {scan.data?.validity_status && (
                          <small className={`d-block ${scan.valid ? 'text-success' : 'text-danger'}`}>
                            {scan.data.validity_status}
                          </small>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Instructions */}
        <Alert variant="info" className="mt-4">
          <h6><i className="fas fa-info-circle me-2"></i>Scanning Instructions:</h6>
          <ul className="mb-0 mt-2">
            <li>Ensure good lighting and hold the QR code steady</li>
            <li>Keep the QR code within the scanning area</li>
            <li>Each ticket can only be used once</li>
            <li>Valid tickets will show green confirmation</li>
            <li>Invalid tickets will show red denial</li>
          </ul>
        </Alert>
      </Container>

      {/* Camera Selector Modal */}
      <Modal show={showCameraSelector} onHide={() => setShowCameraSelector(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-camera me-2"></i>
            Select Camera
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {availableCameras.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="fas fa-camera-slash fa-3x mb-3"></i>
              <p>No cameras found</p>
              <small>Please check camera permissions</small>
            </div>
          ) : (
            <div>
              <p className="mb-3">Choose a camera for scanning:</p>
              <div className="d-grid gap-2">
                {availableCameras.map((camera, index) => (
                  <Button
                    key={camera.deviceId}
                    variant={selectedCamera === camera.deviceId ? "primary" : "outline-primary"}
                    onClick={() => selectCamera(camera.deviceId)}
                    className="text-start"
                  >
                    <div className="d-flex align-items-center">
                      <div className="me-3">
                        <i className="fas fa-video"></i>
                      </div>
                      <div>
                        <div className="fw-bold">
                          Camera {index + 1}
                          {camera.label.toLowerCase().includes('back') && (
                            <Badge bg="success" className="ms-2">Back</Badge>
                          )}
                          {camera.label.toLowerCase().includes('front') && (
                            <Badge bg="info" className="ms-2">Front</Badge>
                          )}
                        </div>
                        <small className="text-muted">
                          {camera.label || `Camera ${index + 1}`}
                        </small>
                      </div>
                      {selectedCamera === camera.deviceId && (
                        <div className="ms-auto">
                          <i className="fas fa-check-circle text-success"></i>
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCameraSelector(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Partial Admission Modal */}
      <Modal show={showPartialAdmission} onHide={() => setShowPartialAdmission(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-users me-2"></i>
            Group Ticket - Select People
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {partialAdmissionData && (
            <div>
              <div className="text-center mb-4">
                <i className="fas fa-ticket-alt fa-3x text-primary mb-3"></i>
                <h5>🎫 Group Ticket Detected</h5>
                <p className="text-muted">How many people would you like to admit?</p>
              </div>

              {/* Food Orders with Give Button */}
              {partialAdmissionData.booking_id && (
                <Row className="mb-3">
                  <Col xs={12}>
                    {!foodStatusLoaded ? (
                      <Alert variant="warning" className="py-3 text-center">
                        <Spinner animation="border" size="sm" className="me-2" />
                        Loading food orders...
                      </Alert>
                    ) : (foodStatus && foodStatus.length > 0 ? (
                      <FoodMarkingComponent
                        bookingId={partialAdmissionData.booking_id}
                        foodStatus={foodStatus}
                        onFoodMarked={() => {
                          if (partialAdmissionData.booking_id) {
                            loadFoodStatus(partialAdmissionData.booking_id);
                          }
                        }}
                        markFoodAsGiven={markFoodAsGiven}
                      />
                    ) : (
                      <Alert variant="secondary" className="py-3 text-center">
                        <i className="fas fa-utensils me-2"></i>
                        No food order for this ticket
                      </Alert>
                    ))}
                  </Col>
                </Row>
              )}

              {/* Ticket Info */}
              <Card className="mb-4 border-primary">
                <Card.Body>
                  <Row className="text-center">
                    <Col xs={4}>
                      <div className="fw-bold text-primary">Total</div>
                      <div className="h4">{partialAdmissionData.total_people}</div>
                    </Col>
                    <Col xs={4}>
                      <div className="fw-bold text-success">Admitted</div>
                      <div className="h4">{partialAdmissionData.admitted_people}</div>
                    </Col>
                    <Col xs={4}>
                      <div className="fw-bold text-warning">Remaining</div>
                      <div className="h4">{partialAdmissionData.remaining_people}</div>
                    </Col>
                  </Row>
                  <hr />
                  <div className="text-center">
                    <small className="text-muted">
                      <strong>{partialAdmissionData.student_name}</strong><br />
                      {partialAdmissionData.movie_name}
                    </small>
                  </div>
                </Card.Body>
              </Card>

              {/* People Selection */}
              <div className="mb-4">
                <h6 className="text-center mb-3">Select Number of People to Admit:</h6>
                <div className="d-flex justify-content-center flex-wrap gap-2">
                  {partialAdmissionData.available_options.map(num => (
                    <Button
                      key={num}
                      variant={selectedPeopleCount === num ? "primary" : "outline-primary"}
                      size="lg"
                      onClick={() => setSelectedPeopleCount(num)}
                      className="rounded-circle"
                      style={{ width: '60px', height: '60px', fontSize: '1.2rem', fontWeight: 'bold' }}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
                <div className="text-center mt-3">
                  <Badge bg="info" className="fs-6 px-3 py-2">
                    <i className="fas fa-users me-1"></i>
                    Admit {selectedPeopleCount} Person{selectedPeopleCount > 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              <Alert variant="info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Note:</strong> You can scan this ticket multiple times to admit different groups of people, or admit everyone at once.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPartialAdmission(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={() => handlePartialAdmission(selectedPeopleCount)}
            className="px-4"
          >
            <i className="fas fa-check me-2"></i>
            Admit {selectedPeopleCount} Person{selectedPeopleCount > 1 ? 's' : ''}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Success Modal */}
      <Modal
        show={showSuccessModal}
        onHide={() => {
          setShowSuccessModal(false);
          setLastScanResult(null);
          // Auto-restart scanner after successful scan
          setTimeout(() => startScanner(), 500);
        }}
        centered
        size="lg"
        backdrop="static"
      >
        <Modal.Header
          className="bg-success text-white"
          closeButton
          style={{ border: 'none' }}
        >
          <Modal.Title className="w-100 text-center">
            <i className="fas fa-check-circle fa-2x me-3"></i>
            ✅ VALID TICKET - Entry Allowed
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-5">
          {lastScanResult && (
            <div>
              <i className="fas fa-check-circle fa-5x text-success mb-4"></i>
              <h4 className="text-success mb-4">Entry Granted Successfully!</h4>

              <Card className="border-success shadow-sm mb-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <Card.Body>
                      <Row className="mb-2">
                        <Col xs={4} className="text-start fw-bold">Name:</Col>
                        <Col xs={8} className="text-start">{lastScanResult.student_name || 'N/A'}</Col>
                      </Row>
                      <Row className="mb-2">
                        <Col xs={4} className="text-start fw-bold">Movie:</Col>
                        <Col xs={8} className="text-start">{lastScanResult.movie_name || 'N/A'}</Col>
                      </Row>



                      {lastScanResult.take_time && (
                        <Row className="mb-2">
                          <Col xs={4} className="text-start fw-bold">Take Time:</Col>
                          <Col xs={8} className="text-start">
                            <Badge bg="info" className="px-3 py-2">
                              <i className="fas fa-clock me-1"></i>
                              {lastScanResult.take_time} minutes
                            </Badge>
                          </Col>
                        </Row>
                      )}
                      {lastScanResult.people_admitted_now && (
                        <Row className="mb-2">
                          <Col xs={4} className="text-start fw-bold">Admitted:</Col>
                          <Col xs={8} className="text-start">
                            {lastScanResult.people_admitted_now} Person{lastScanResult.people_admitted_now > 1 ? 's' : ''}
                          </Col>
                        </Row>
                      )}
                      {(lastScanResult.total_people !== undefined ||
                        lastScanResult.admitted_people !== undefined ||
                        lastScanResult.remaining_people !== undefined) && (
                        <>
                          <Row className="mb-2">
                            <Col xs={4} className="text-start fw-bold">Total:</Col>
                            <Col xs={8} className="text-start">
                              {lastScanResult.total_people ?? 'N/A'}
                            </Col>
                          </Row>
                          <Row className="mb-2">
                            <Col xs={4} className="text-start fw-bold">Admitted:</Col>
                            <Col xs={8} className="text-start">
                              {lastScanResult.admitted_people ?? 'N/A'}
                            </Col>
                          </Row>
                          <Row className="mb-2">
                            <Col xs={4} className="text-start fw-bold">Remaining:</Col>
                            <Col xs={8} className="text-start">
                              {lastScanResult.remaining_people ?? 'N/A'}
                            </Col>
                          </Row>
                        </>
                      )}



                      {/* Food Status + Mark Given */}
                      {lastScanResult?.booking_id && foodStatusLoaded && foodStatus && foodStatus.length > 0 && (
                        <Row className="mb-2">
                          <Col xs={12}>
                            <FoodMarkingComponent
                              bookingId={lastScanResult.booking_id}
                              foodStatus={foodStatus}
                              onFoodMarked={() => {
                                if (lastScanResult.booking_id) {
                                  loadFoodStatus(lastScanResult.booking_id);
                                }
                              }}
                              markFoodAsGiven={markFoodAsGiven}
                            />
                          </Col>
                        </Row>
                      )}
                      {lastScanResult?.booking_id && foodStatusLoaded && (!foodStatus || foodStatus.length === 0) && (
                        <Row className="mb-2">
                          <Col xs={12} className="text-center">
                            <Badge bg="secondary" className="px-3 py-2">
                              <i className="fas fa-utensils me-2"></i>
                              No food order for this ticket
                            </Badge>
                          </Col>
                        </Row>
                      )}

                      <Row className="mb-0">
                        <Col xs={4} className="text-start fw-bold">Status:</Col>
                        <Col xs={8} className="text-start">
                          <Badge bg="success" className="px-3 py-2">
                            <i className="fas fa-check me-1"></i>
                            {lastScanResult?.validity_status || 'VALID'}
                          </Badge>
                        </Col>
                      </Row>
                </Card.Body>
              </Card>

              <p className="text-muted mb-0">
                Scanner will restart automatically in a moment...
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light" style={{ border: 'none' }}>
          <Button
            variant="success"
            onClick={() => {
              setShowSuccessModal(false);
              setLastScanResult(null);
              // Auto-restart scanner
              setTimeout(() => startScanner(), 500);
            }}
            className="px-4"
          >
            <i className="fas fa-play me-2"></i>
            Continue Scanning
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Error Modal */}
      <Modal
        show={showErrorModal}
        onHide={() => {
          setShowErrorModal(false);
          setLastScanResult(null);
          // Auto-restart scanner
          setTimeout(() => startScanner(), 500);
        }}
        centered
        size="lg"
        backdrop="static"
      >
        <Modal.Header
          className="bg-danger text-white"
          closeButton
          style={{ border: 'none' }}
        >
          <Modal.Title className="w-100 text-center">
            <i className="fas fa-times-circle fa-2x me-3"></i>
            ❌ INVALID TICKET - Entry Denied
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-5">
          {lastScanResult && (
            <div>
              <i className="fas fa-times-circle fa-5x text-danger mb-4"></i>
              <h4 className="text-danger mb-4">Entry Denied!</h4>

              <Card className="border-danger shadow-sm mb-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
                <Card.Body>
                  <Row className="mb-2">
                    <Col xs={4} className="text-start fw-bold">Status:</Col>
                    <Col xs={8} className="text-start">
                      <Badge bg="danger" className="px-3 py-2">
                        <i className="fas fa-times me-1"></i>
                        {lastScanResult?.validity_status || 'INVALID'}
                      </Badge>
                    </Col>
                  </Row>
                  {lastScanResult?.student_name && (
                    <Row className="mb-2">
                      <Col xs={4} className="text-start fw-bold">Name:</Col>
                      <Col xs={8} className="text-start">{lastScanResult.student_name}</Col>
                    </Row>
                  )}
                  {lastScanResult?.movie_name && (
                    <Row className="mb-2">
                      <Col xs={4} className="text-start fw-bold">Movie:</Col>
                      <Col xs={8} className="text-start">{lastScanResult.movie_name}</Col>
                    </Row>
                  )}
                  {(lastScanResult?.total_people !== undefined ||
                    lastScanResult?.admitted_people !== undefined ||
                    lastScanResult?.remaining_people !== undefined) && (
                    <>
                      <Row className="mb-2">
                        <Col xs={4} className="text-start fw-bold">Total:</Col>
                        <Col xs={8} className="text-start">
                          {lastScanResult.total_people ?? 'N/A'}
                        </Col>
                      </Row>
                      <Row className="mb-2">
                        <Col xs={4} className="text-start fw-bold">Admitted:</Col>
                        <Col xs={8} className="text-start">
                          {lastScanResult.admitted_people ?? 'N/A'}
                        </Col>
                      </Row>
                      <Row className="mb-2">
                        <Col xs={4} className="text-start fw-bold">Remaining:</Col>
                        <Col xs={8} className="text-start">
                          {lastScanResult.remaining_people ?? 'N/A'}
                        </Col>
                      </Row>
                    </>
                  )}
                  {lastScanResult?.message && (
                    <Row className="mb-0">
                      <Col xs={12} className="text-center">
                        <small className="text-muted">{lastScanResult.message}</small>
                      </Col>
                    </Row>
                  )}
                </Card.Body>
              </Card>

              {/* Food Status + Mark Given */}
              {lastScanResult?.booking_id && foodStatusLoaded && foodStatus && foodStatus.length > 0 && (
                <Row className="mb-2">
                  <Col xs={12}>
                    <FoodMarkingComponent
                      bookingId={lastScanResult.booking_id}
                      foodStatus={foodStatus}
                      onFoodMarked={() => {
                        if (lastScanResult.booking_id) {
                          loadFoodStatus(lastScanResult.booking_id);
                        }
                      }}
                      markFoodAsGiven={markFoodAsGiven}
                    />
                  </Col>
                </Row>
              )}
              {lastScanResult?.booking_id && foodStatusLoaded && (!foodStatus || foodStatus.length === 0) && (
                <Row className="mb-2">
                  <Col xs={12} className="text-center">
                    <Badge bg="secondary" className="px-3 py-2">
                      <i className="fas fa-utensils me-2"></i>
                      No food order for this ticket
                    </Badge>
                  </Col>
                </Row>
              )}

              <Alert variant="warning" className="mb-4">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Access Denied:</strong> This ticket cannot be used for entry.
                However, food orders can still be served if applicable.
                Please check the ticket details or contact support if you believe this is an error.
              </Alert>

              <p className="text-muted mb-0">
                Scanner will restart automatically in a moment...
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light" style={{ border: 'none' }}>
          <Button
            variant="danger"
            onClick={() => {
              setShowErrorModal(false);
              setLastScanResult(null);
              // Auto-restart scanner
              setTimeout(() => startScanner(), 500);
            }}
            className="px-4"
          >
            <i className="fas fa-redo me-2"></i>
            Try Again
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// Food Marking Component - defined outside to avoid re-creation on every render
const FoodMarkingComponent = ({ bookingId, foodStatus, onFoodMarked, markFoodAsGiven }) => {
  const [loadingFood, setLoadingFood] = useState(null);

  const handleMarkGiven = async (foodId, quantity) => {
    console.log('🍽️ handleMarkGiven called for:', foodId, 'Quantity:', quantity, 'Booking:', bookingId);
    setLoadingFood(foodId);
    try {
      if (!markFoodAsGiven) {
        console.error('❌ markFoodAsGiven function is missing in props!');
        return;
      }
      await markFoodAsGiven(bookingId, foodId, quantity);
      if (onFoodMarked) onFoodMarked();
    } catch (error) {
      console.error('❌ Error in handleMarkGiven:', error);
      alert('Failed to mark food as given: ' + error.message);
    } finally {
      setLoadingFood(null);
    }
  };

  // Robust check for array
  if (!Array.isArray(foodStatus) || foodStatus.length === 0) {
    return null;
  }

  const pendingCount = foodStatus.filter(food => (food.quantity_given || 0) < (food.ordered_quantity || 0)).length;
  const completedCount = foodStatus.filter(food => (food.quantity_given || 0) >= (food.ordered_quantity || 0)).length;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.15), rgba(255, 152, 0, 0.08))',
      borderRadius: '12px',
      padding: '1rem',
      border: '2px solid rgba(255, 193, 7, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(45deg, rgba(255, 193, 7, 0.05), rgba(255, 152, 0, 0.03))',
        borderRadius: '12px',
        pointerEvents: 'none',
        zIndex: 1
      }}></div>

      <div style={{
        position: 'relative',
        zIndex: 2,
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#f57c00',
        marginBottom: '1rem',
        textAlign: 'center'
      }}>
        <i className="fas fa-utensils me-2"></i>
        🍽️ Food Status ({foodStatus.length} items)
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        position: 'relative',
        zIndex: 2
      }}>
        {foodStatus.map((food, index) => {
          const isCompleted = (food.quantity_given || 0) >= (food.ordered_quantity || 0);
          const remaining = Math.max(0, (food.ordered_quantity || 0) - (food.quantity_given || 0));

          return (
            <div key={food.food_id || index} style={{
              background: isCompleted ? 'rgba(232, 245, 233, 0.8)' : 'white',
              borderRadius: '10px',
              padding: '0.75rem',
              border: isCompleted ? '2px solid #81c784' : '2px solid rgba(255, 193, 7, 0.2)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#333',
                  marginBottom: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {food.food_name || food.name || `Food Item ${index + 1}`}
                  {isCompleted && (
                    <Badge bg="success" className="ms-2">
                      <i className="fas fa-check me-1"></i>
                      Served
                    </Badge>
                  )}
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#666'
                }}>
                  Ordered: {food.ordered_quantity} | Served: {food.quantity_given}
                </div>
              </div>

              {!isCompleted && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleMarkGiven(food.food_id, remaining)}
                  disabled={loadingFood === food.food_id}
                  style={{
                    minWidth: '80px',
                    fontWeight: '600'
                  }}
                >
                  {loadingFood === food.food_id ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      <i className="fas fa-check me-1"></i>
                      Give All
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Scanner;
