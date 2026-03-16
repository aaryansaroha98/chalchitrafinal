import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Loader from '../components/Loader';

const TermsOfService = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader message="Loading Terms" subtitle="Reviewing legal framework..." />;
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
            <div className="policy-header terms-header" style={{textAlign: 'center', marginBottom: '2rem'}}>
              <h1 className="policy-title terms-title" style={{
                color: '#ffffff',
                fontSize: '2.5rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                TERMS OF SERVICE
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
                Terms and Conditions
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Welcome to Chalchitra. By using our website and services, you agree to the following terms and conditions. Please read them carefully.
              </p>

              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                General Terms
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                By accessing our website, you confirm that you are at least 18 years old or have parental/guardian permission to use the site. You agree not to misuse our website for illegal purposes or activities that violate the rights of others. The content on this website is for general information and use only. It is subject to change without notice.
              </p>

              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Purchases and Payments
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Prices for our products and services are listed in INR (Indian Rupees). Payments can be made via credit card, debit card, or other accepted methods at checkout. We reserve the right to change prices or services at any time without notice.
              </p>

              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Liability
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                We are not responsible for any damage or loss resulting from the use of our website or services unless caused by our gross negligence. In no event will Chalchitra be held liable for indirect, incidental, or consequential damages arising from the use of our services.
              </p>

              <h2 style={{
                color: '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Account Termination
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                We reserve the right to terminate user accounts if there is evidence of misuse, fraud, or illegal activity.
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
                Refunds
              </h2>
              <p style={{
                color: '#cccccc',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Tickets purchased through our platform are non-refundable except in cases of event cancellation by Chalchitra. Refund requests will be reviewed on a case-by-case basis.
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
                If you have any questions about these terms and conditions, please contact us:
              </p>
              <div style={{
                color: '#ffffff',
                lineHeight: '1.6'
              }}>
                <p style={{margin: '0.5rem 0', color: '#ffffff'}}><strong>Phone:</strong> +91 9569579671</p>
                <p style={{margin: '0.5rem 0', color: '#ffffff'}}><strong>Email:</strong> chalchitra@iitjammu.ac.in</p>
                <p style={{margin: '0.5rem 0', color: '#ffffff'}}>
                  <strong>Address:</strong> IIT Jammu, NH-44, PO Nagrota, Jagti, Jammu and Kashmir 181221
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default TermsOfService;
