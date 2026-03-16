import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Loader from '../components/Loader';

const RefundPolicy = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader message="Reviewing Policy" subtitle="Loading refund guidelines..." />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      padding: '2rem 0'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={8} xl={6}>
            {/* Header */}
            <div className="policy-header refund-header" style={{textAlign: 'center', marginBottom: '2rem'}}>
              <h1 className="policy-title refund-title" style={{
                color: '#ffffff',
                fontSize: '2.5rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                Refund and Cancellation Policy
              </h1>
            </div>

            {/* Content */}
            <div style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Refund and Cancellation Policy
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                We strive to ensure customer satisfaction with our products and services. Below is our refund and cancellation policy.
              </p>

              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Refunds
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Refunds are available for eligible products within 7 days of delivery. To be eligible, items must be returned in their original condition and packaging. Once we receive and inspect the returned product, we will process your refund within 5-7 working days. The refund will be credited back to your original payment method. Refunds are not available for digital products or services once they are delivered unless there is a technical issue.
              </p>

              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Cancellations
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                You can cancel your order within 24 hours of purchase. After 48 hours, cancellations may incur a 10% cancellation fee. For subscription-based services, cancellations must be made before the next billing cycle.
              </p>

              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Privacy Policy
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Please refer to our Privacy Policy for information on how we collect, use, and protect your personal data.
              </p>

              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Terms and Conditions
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Please refer to our Terms and Conditions for detailed information about using our services.
              </p>

              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Contact Us
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '1rem'
              }}>
                If you have any questions about our refund and cancellation policy, please contact us:
              </p>
              <div style={{
                color: '#cccccc',
                lineHeight: '1.6'
              }}>
                <p style={{margin: '0.5rem 0'}}><strong>Email:</strong> chalchitra@iitjammu.ac.in</p>
                <p style={{margin: '0.5rem 0'}}><strong>Phone:</strong> +91 9569579671</p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default RefundPolicy;
