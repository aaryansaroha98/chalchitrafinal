import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, Modal } from 'react-bootstrap';
import api from '../api/axios';
import QRScanner from '../components/QRScanner';

const TeamScanner = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scanHistory, setScanHistory] = useState(() => {
    // Load scan history from localStorage on component mount
    try {
      const saved = localStorage.getItem('chalchitra_scan_history');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading scan history from localStorage:', error);
      return [];
    }
  });

  // Calculate stats from scanHistory
  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('chalchitra_scan_history');
      const history = saved ? JSON.parse(saved) : [];
      return {
        totalScanned: history.length,
        validTickets: history.filter(scan => scan.success).length,
        invalidTickets: history.filter(scan => !scan.success).length
      };
    } catch (error) {
      console.error('Error calculating stats from localStorage:', error);
      return {
        totalScanned: 0,
        validTickets: 0,
        invalidTickets: 0
      };
    }
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCodeScanner, setIsCodeScanner] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkScannerAccess();
  }, []);

  // Save scan history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('chalchitra_scan_history', JSON.stringify(scanHistory));
    } catch (error) {
      console.error('Error saving scan history to localStorage:', error);
    }
  }, [scanHistory]);

  const checkScannerAccess = async () => {
    try {
      const response = await api.get('/api/auth/current_user');
      const user = response.data;
      setCurrentUser(user);

      // Check if user is marked as code scanner or is a team leader with scanner access
      if (user && (user.code_scanner || user.team_scanner)) {
        setIsCodeScanner(true);
        // Auto-start scanning for team leaders
        if (user.team_scanner) {
          setTimeout(() => {
            setShowScanner(true);
          }, 1000); // Small delay to allow page to render
        }
      } else {
        setError('Access denied. You are not authorized to use the QR scanner.');
      }
    } catch (err) {
      setError('Authentication failed. Please login again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async (qrData, numPeople) => {
    try {
      const requestData = {
        qr_code: qrData
      };

      // If numPeople is provided, this is a partial admission request
      if (numPeople !== undefined) {
        requestData.num_people = numPeople;
      }

      const response = await api.post('/api/bookings/scan', requestData);

      const data = response.data;

      // Add to scan history
      const scanRecord = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        result: data,
        success: data.allowed,
        partial: numPeople !== undefined,
        peopleAdmitted: numPeople || (data.allowed ? 1 : 0)
      };

      setScanHistory(prev => [scanRecord, ...prev.slice(0, 9)]); // Keep last 10

      // Update stats
      setStats(prev => ({
        totalScanned: prev.totalScanned + 1,
        validTickets: prev.validTickets + (data.allowed ? 1 : 0),
        invalidTickets: prev.invalidTickets + (data.allowed ? 0 : 1)
      }));

      // Return data for QRScanner to display
      return data;

    } catch (error) {
      console.error('Scanning failed:', error);
      throw error; // Re-throw so QRScanner can handle it
    }
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Checking scanner access...</p>
        </div>
      </Container>
    );
  }

  if (error || !isCodeScanner) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
          <h4>Access Denied</h4>
          <p>{error || 'You are not authorized to use the QR scanner.'}</p>
          <p className="mb-0">Please contact an administrator to grant scanner access.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="text-center mb-4">
        <h1 className="mb-3">
          <i className="fas fa-qrcode text-primary me-3"></i>
          🎫 QR Code Scanner
        </h1>
        <p className="text-muted">Scan student tickets for movie entry validation</p>
        <Badge bg="success" className="fs-6 px-3 py-2">
          <i className="fas fa-user-check me-1"></i>
          Authorized Scanner: {currentUser?.name}
        </Badge>
      </div>

      {/* Stats Dashboard */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center border-primary shadow-sm">
            <Card.Body className="py-4">
              <div className="mb-2">
                <i className="fas fa-qrcode fa-2x text-primary"></i>
              </div>
              <h2 className="text-primary mb-1">{stats.totalScanned}</h2>
              <p className="mb-0 fw-bold">Total Scanned</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-success shadow-sm">
            <Card.Body className="py-4">
              <div className="mb-2">
                <i className="fas fa-check-circle fa-2x text-success"></i>
              </div>
              <h2 className="text-success mb-1">{stats.validTickets}</h2>
              <p className="mb-0 fw-bold">Valid Tickets</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-danger shadow-sm">
            <Card.Body className="py-4">
              <div className="mb-2">
                <i className="fas fa-times-circle fa-2x text-danger"></i>
              </div>
              <h2 className="text-danger mb-1">{stats.invalidTickets}</h2>
              <p className="mb-0 fw-bold">Invalid Tickets</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Scanner Button */}
      <div className="text-center mb-4">
        <Button
          size="lg"
          variant="primary"
          onClick={() => setShowScanner(true)}
          className="px-5 py-3 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
            border: 'none',
            borderRadius: '50px'
          }}
        >
          <i className="fas fa-camera me-2"></i>
          Start Scanning Tickets
        </Button>
        <p className="text-muted mt-2 small">
          <i className="fas fa-info-circle me-1"></i>
          Use device camera to scan QR codes on student tickets
        </p>
      </div>

      {/* Scan History */}
      <Card className="shadow-sm">
        <Card.Header className="bg-light">
          <h5 className="mb-0">
            <i className="fas fa-history me-2"></i>
            Recent Scans
          </h5>
        </Card.Header>
        <Card.Body>
          {scanHistory.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="fas fa-inbox fa-2x mb-3"></i>
              <p className="mb-0">No scans yet. Start scanning tickets!</p>
            </div>
          ) : (
            <div className="list-group">
              {scanHistory.map(scan => (
                <div key={scan.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong className="d-block">{scan.timestamp}</strong>
                    <small className={`text-${scan.success ? 'success' : 'danger'}`}>
                      <i className={`fas fa-${scan.success ? 'check' : 'times'} me-1`}></i>
                      {scan.success ? 'Entry Allowed' : 'Entry Denied'}
                    </small>
                  </div>
                  <Badge bg={scan.success ? 'success' : 'danger'} className="px-3 py-2">
                    {scan.success ? 'VALID' : 'INVALID'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </Container>
  );
};

export default TeamScanner;
