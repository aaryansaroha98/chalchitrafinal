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
      backgroundColor: '#ffffff',
      padding: '2rem 0'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={8} xl={6}>
            {/* Header */}
            <div className="policy-header terms-header" style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '0', padding: '0 1rem' }}>
              <h1 className="policy-title terms-title" style={{
                color: '#0b0e17',
                fontSize: '2.5rem',
                fontWeight: '600',
                marginBottom: '1rem',
                letterSpacing: '-0.025em'
              }}>
                TERMS OF SERVICE
              </h1>
            </div>

            {/* Content */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                color: '#0b0e17',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Terms and Conditions
              </h2>
              <p style={{
                color: '#5c6270',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Welcome to Chalchitra Series, an initiative by IIT Jammu. By using our website and services, you agree to the following terms and conditions. Please read them carefully.
              </p>

              <h2 style={{
                color: '#0b0e17',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Description of Services
              </h2>
              <p style={{
                 color: '#5c6270',
                 lineHeight: '1.6',
                 marginBottom: '2rem'
              }}>
                Chalchitra Series is an online platform exclusively developed for the Indian Institute of Technology Jammu (IIT Jammu) community. Our primary service is to facilitate the online booking of movie tickets for cinematic screenings held at the institute's venues (such as the Mansar Auditorium). 
                <br/><br/>
                Our services include:
                <ul style={{ paddingLeft: '1.2rem' }}>
                  <li>Browsing upcoming movie screenings and event details.</li>
                  <li>All tickets are purchased using the Chalchitra Coin system.</li>
                  <li>Generation and delivery of digital tickets (PDF) with unique QR codes.</li>
                  <li>QR code-based admission management at event venues.</li>
                </ul>
                The services provided through this website are intended for authorized users within the IIT Jammu ecosystem.
              </p>

              <h2 style={{
                color: '#0b0e17',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                General Terms
              </h2>
              <p style={{
                color: '#5c6270',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                By accessing our website, you confirm that you are at least 18 years old or have parental/guardian permission to use the site. You agree not to misuse our website for illegal purposes or activities that violate the rights of others. The content on this website is for general information and use only. It is subject to change without notice.
              </p>

              <h2 style={{
                color: '#0b0e17',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Chalchitra Coins and Bookings
              </h2>
              <p style={{
                color: '#5c6270',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                All bookings on our platform are made using Chalchitra Coins, our in-platform credit system. Ticket and food prices are listed in Coins, and the required Coins are deducted from your account balance at the time of booking. Chalchitra Coins have no monetary value, cannot be exchanged for cash, and are usable only within the Chalchitra Series platform. We reserve the right to change Coin pricing or services at any time without notice.
              </p>

              <h2 style={{
                color: '#0b0e17',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Liability
              </h2>
              <p style={{
                color: '#5c6270',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                We are not responsible for any damage or loss resulting from the use of our website or services unless caused by our gross negligence. In no event will Chalchitra be held liable for indirect, incidental, or consequential damages arising from the use of our services.
              </p>

              <h2 style={{
                color: '#0b0e17',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Account Termination
              </h2>
              <p style={{
                color: '#5c6270',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                We reserve the right to terminate user accounts if there is evidence of misuse, fraud, or illegal activity.
              </p>

              <h2 style={{
                color: '#0b0e17',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Privacy Policy
              </h2>
              <p style={{
                color: '#5c6270',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                Please refer to our Privacy Policy for information on how we collect, use, and protect your personal data.
              </p>

              <h2 style={{
                color: '#0b0e17',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Coin Refunds
              </h2>
              <p style={{
                color: '#5c6270',
                lineHeight: '1.6',
                marginBottom: '2rem'
              }}>
                When you book a ticket, the Chalchitra Coins are deducted from your account. Once you attend the screening and your ticket is scanned for admission at the venue, the full Coin amount for that booking is credited back to your account. In other words, attending the screening returns your Coins. Coins are not returned for tickets that are never scanned or for no-shows, except where the event is cancelled by Chalchitra. As Chalchitra Coins carry no monetary value, no cash refunds are provided.
              </p>

              <h2 style={{
                color: '#0b0e17',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '1rem'
              }}>
                Contact Us
              </h2>
              <p style={{
                color: '#5c6270',
                lineHeight: '1.6',
                marginBottom: '1rem'
              }}>
                If you have any questions about these terms and conditions, please contact us:
              </p>
              <div style={{
                color: '#5c6270',
                lineHeight: '1.6'
              }}>
                <p style={{margin: '0.5rem 0', color: '#5c6270'}}><strong>Phone:</strong> +91 9569579671</p>
                <p style={{margin: '0.5rem 0', color: '#5c6270'}}><strong>Email:</strong> chalchitra@iitjammu.ac.in</p>
                <p style={{margin: '0.5rem 0', color: '#5c6270'}}>
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

export default TermsOfService;
