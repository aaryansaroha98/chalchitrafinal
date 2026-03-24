import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Loader from '../components/Loader';

const PrivacyPolicy = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader message="Loading Protocol" subtitle="Reviewing our privacy guidelines..." />;
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
            <div className="policy-header privacy-header" style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '0', padding: '0 1rem' }}>
              <h1 className="policy-title privacy-title" style={{
                color: '#ffffff',
                fontSize: '2.5rem',
                fontWeight: '600',
                marginBottom: '1rem',
                letterSpacing: '-0.025em'
              }}>
                PRIVACY POLICY
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
                Introduction
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                We, Chalchitra Series, IIT Jammu, respect your privacy and are committed to protecting your personal information. This privacy policy explains how we collect, use, and safeguard your data.
              </p>

              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Products and Services
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Chalchitra Series is an online platform designed for the IIT Jammu community to facilitate movie ticket bookings for screenings organized at the institute. Our services include ticket reservation, payment processing, and digital ticket issuance.
              </p>

              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Information We Collect
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                We collect personal information such as your name, email address, and payment details when you register or make a purchase on our platform.
              </p>

              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                How We Use Your Information
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Your information is used to process orders, provide customer support, and deliver our services. We may also use your contact information for important updates.
              </p>

              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Data Security
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
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
                If you have any questions about this privacy policy, please contact us at:
              </p>
              <div style={{
                color: '#cccccc',
                lineHeight: '1.6'
              }}>
                <p style={{margin: '0.5rem 0', color: '#cccccc'}}><strong>Email:</strong> chalchitra@iitjammu.ac.in</p>
                <p style={{margin: '0.5rem 0', color: '#cccccc'}}><strong>Phone:</strong> +91 9569579671</p>
                <p style={{margin: '0.5rem 0', color: '#cccccc'}}>
                  <strong>Address:</strong> Indian Institute of Technology Jammu, Jagti, PO Nagrota, NH-44, Jammu - 181221, J&K, India.
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default PrivacyPolicy;
