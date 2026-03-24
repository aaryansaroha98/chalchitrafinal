import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const storedState = useMemo(() => {
    try {
      const raw = sessionStorage.getItem('payment_success');
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('Failed to read payment success payload:', err);
      return null;
    }
  }, []);

  const resolvedState = (location.state && Object.keys(location.state).length > 0)
    ? location.state
    : (storedState || {});

  const { ticket, movie, payment, selectedSeats: navigationSelectedSeats, customerDetails: navCustomerDetails } = resolvedState;
  const selectedSeats = ticket?.selectedSeats || ticket?.selected_seats || navigationSelectedSeats;
  const bookingIdentifier = ticket?.booking_id || ticket?.booking_code || ticket?.id || ticket?.bookingId;
  const emailStatusKey = bookingIdentifier ? `ticket_email_status_${bookingIdentifier}` : null;
  const hasAttemptedEmailRef = useRef(false);
  const [emailStatus, setEmailStatus] = useState('idle'); // idle | sending | sent | failed
  const [emailError, setEmailError] = useState('');
  
  // Log what we have for debugging
  useEffect(() => {
    console.log('Nav customerDetails:', navCustomerDetails);
    console.log('Ticket customer_details:', ticket?.customer_details);
  }, [navCustomerDetails, ticket]);

  useEffect(() => {
    const sendTicketEmail = async () => {
      if (!ticket || hasAttemptedEmailRef.current) return;

      // If we've already sent the email for this booking in this session, skip re-sending on reload
      const alreadySent = emailStatusKey && sessionStorage.getItem(emailStatusKey) === 'sent';
      if (alreadySent) {
        setEmailStatus('sent');
        return;
      }

      hasAttemptedEmailRef.current = true;

      try {
        setEmailStatus('sending');
        setEmailError('');

        const ticketBgUrl = `${window.location.origin}/misc/ticc.png`;

        const ticketHTML = `
          <div style="
            width: 800px;
            height: 260px;
            position: relative;
            font-family: Arial, sans-serif;
            color: #0b1a2b;
            box-sizing: border-box;
          " id="ticket-design">
            <img
              src="${ticketBgUrl}"
              alt="Ticket Background"
              style="width: 100%; height: 100%; object-fit: cover; display: block;"
              crossorigin="anonymous"
            />

            <div style="position: absolute; left: 227px; top: 117.5px; width: 230px; color: #000000; fontFamily: 'Tahoma, Arial, sans-serif';">
              <div style="font-size: 12px; font-weight: 400; letter-spacing: 0.2px;">
                ${ticket.booking_id}
              </div>
            </div>

            <div style="position: absolute; left: 227px; top: 141.5px; width: 230px; color: #000000; fontFamily: 'Tahoma, Arial, sans-serif';">
              <div style="font-size: 12px; font-weight: 400; letter-spacing: 0.2px;">
                ${ticket.movie}
              </div>
            </div>

            <div style="position: absolute; left: 227px; top: 165px; width: 230px; color: #000000; fontFamily: 'Tahoma, Arial, sans-serif';">
              <div style="font-size: 12px; font-weight: 400; letter-spacing: 0.2px;">
                ${selectedSeats?.length || 1}
              </div>
            </div>

            <div style="position: absolute; left: 227px; top: 189px; width: 260px; color: #000000; fontFamily: 'Tahoma, Arial, sans-serif';">
              <div style="font-size: 12px; font-weight: 400; letter-spacing: 0.2px;">
                ${selectedSeats ? selectedSeats.map(seat => String(seat)).join(', ') : 'N/A'}
              </div>
            </div>

            <div style="position: absolute; left: 635px; top: 64px; color: #1a5f7a; fontSize: 15px; fontWeight: 'bold';">:</div>
            <div style="position: absolute; right: -25px; top: 67px; width: 180px; color: #000000; textAlign: 'left'; fontFamily: 'Tahoma, Arial, sans-serif';">
              <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2; text-transform: uppercase;">
                ${ticket.date ? new Date(ticket.date).toLocaleDateString('en-IN', { weekday: 'long' }) : 'N/A'}
              </div>
              <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2; marginTop: '2px';">
                ${ticket.date ? new Date(ticket.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
              </div>
            </div>

            <div style="position: absolute; left: 635px; top: 115px; color: #1a5f7a; fontSize: 15px; fontWeight: 'bold';">:</div>
            <div style="position: absolute; right: -25px; top: 118px; width: 180px; color: #000000; textAlign: 'left'; fontFamily: 'Tahoma, Arial, sans-serif';">
              <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2;">
                ${ticket.date ? new Date(ticket.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </div>
            </div>

            <div style="position: absolute; left: 638px; top: 168.5px; color: #1a5f7a; fontSize: 15px; fontWeight: 'bold';">:</div>
            <div style="position: absolute; right: -30px; top: 169.5px; width: 180px; color: #000000; textAlign: 'left'; fontFamily: 'Tahoma, Arial, sans-serif';">
              <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2;">
                ${ticket.venue || 'N/A'}
              </div>
            </div>

            <div style="
              position: absolute;
              left: 472px;
              top: 98px;
              width: 98px;
              height: 98px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${ticket.qr_code && ticket.qr_code.trim() !== '' ?
                '<img src="' + ticket.qr_code + '" style="width: 98px; height: 98px; object-fit: contain; display: block;" alt="QR Code" crossorigin="anonymous" />' :
                '<div style="width: 98px; height: 98px; background: transparent; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #666; font-weight: 400;">QR NOT FOUND</div>'
              }
            </div>
          </div>
        `;

        const ticketElement = document.createElement('div');
        ticketElement.style.position = 'absolute';
        ticketElement.style.left = '-9999px';
        ticketElement.style.top = '-9999px';
        ticketElement.style.width = '800px';
        ticketElement.style.height = '260px';
        ticketElement.innerHTML = ticketHTML;
        document.body.appendChild(ticketElement);

        const preloadImages = (element) => {
          const images = element.querySelectorAll('img');
          const promises = Array.from(images).map(img => (
            new Promise((resolve) => {
              if (img.complete && img.naturalHeight !== 0) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve();
                setTimeout(() => resolve(), 5000);
              }
            })
          ));
          return Promise.all(promises);
        };

        await preloadImages(ticketElement);
        await new Promise(resolve => setTimeout(resolve, 1500));

        const canvas = await html2canvas(ticketElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          width: 800,
          height: ticketElement.scrollHeight,
          scrollX: 0,
          scrollY: 0,
          imageTimeout: 10000,
          removeContainer: false,
          foreignObjectRendering: false
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdfWidth = 210;
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        const pdf = new jsPDF({
          orientation: pdfHeight > 297 ? 'portrait' : 'landscape',
          unit: 'mm',
          format: [pdfWidth, Math.min(pdfHeight, 297)]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        const pdfDataUri = pdf.output('datauristring');
        const pdfBase64 = pdfDataUri.split(',')[1];

        if (ticketElement.parentNode) {
          ticketElement.parentNode.removeChild(ticketElement);
        }

        await api.post('/api/bookings/send-ticket-email', {
          booking_id: ticket.booking_id,
          pdf_base64: pdfBase64,
          customer_email: navCustomerDetails?.email,
          customer_name: navCustomerDetails?.name,
          selected_seats: selectedSeats || [],
          payment_amount: payment?.amount,
          payment_method: payment?.method,
          payment_id: payment?.transaction_id
        }).then(response => {
          const data = response.data;
          if (data.status === 'sent' || data.status === 'duplicate') {
            setEmailStatus('sent');
            if (emailStatusKey) sessionStorage.setItem(emailStatusKey, 'sent');
          } else if (data.status === 'skipped') {
            console.warn('Email skipped:', data.error || data.message);
            setEmailStatus('failed');
            setEmailError('Email service not configured. Please contact admin.');
          } else if (data.status === 'failed') {
            console.error('Email send failed:', data.error || data.message);
            setEmailStatus('failed');
            setEmailError(data.error || 'Failed to send email');
          } else {
            // Legacy fallback
            setEmailStatus('sent');
            if (emailStatusKey) sessionStorage.setItem(emailStatusKey, 'sent');
          }
        });
      } catch (err) {
        console.error('Failed to send ticket email:', err);
        setEmailStatus('failed');
        setEmailError(err.response?.data?.error || err.message);
      }
    };

    sendTicketEmail();
  }, [ticket, movie, selectedSeats, navCustomerDetails]);

  if (!ticket) {
    return (
      <div className="payment-success-page">
        <div className="error-container">
          <div className="error-card">
            <p>No ticket information found. Please try booking again.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-page">
      {/* Particles Background */}
      <div className="particles">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 10 + 's',
              animationDuration: (10 + Math.random() * 20) + 's'
            }}
          />
        ))}
      </div>

      <div className="success-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="check-icon"></div>
          <h1 className="success-title">Payment Success</h1>
          <p className="success-subtitle">Your cinematic experience awaits you!</p>
        </div>

        {/* Main Card */}
        <div className="success-card">
          <div className="card-header">
            <span className="card-header-title">Booking Confirmed</span>
          </div>

          <div className="card-body">
            {(['sending', 'failed', 'sent'].includes(emailStatus)) && (
              <div className={`email-status-banner status-${emailStatus}`}>
                <div className="email-status-visual">
                  {emailStatus === 'sending' && (
                    <div className="mail-send-animation">
                      <div className="mail-envelope">
                        <div className="mail-letter" />
                        <div className="mail-trail" />
                      </div>
                    </div>
                  )}
                  {emailStatus === 'sent' && (
                    <div className="mail-status-icon success">✓</div>
                  )}
                  {emailStatus === 'failed' && (
                    <div className="mail-status-icon error">!</div>
                  )}
                </div>
                <div className="email-status-copy">
                  {emailStatus === 'sending' && (
                    <>
                      <div className="email-status-title">Sending your ticket to your email...</div>
                      <div className="email-status-sub">Hang tight while we deliver your PDF ticket.</div>
                    </>
                  )}
                  {emailStatus === 'sent' && (
                    <>
                      <div className="email-status-title">Ticket email sent successfully!</div>
                      <div className="email-status-sub">Check spam/junk if it's not in your inbox and mark it as <span style={{ color: '#ffd700', fontWeight: 'bold' }}>"Not Spam"</span>.</div>
                    </>
                  )}
                  {emailStatus === 'failed' && (
                    <>
                      <div className="email-status-title">Ticket email failed{emailError ? `: ${emailError}` : ''}.</div>
                      <div className="email-status-sub">You can download it from My Bookings or try again later.</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Movie Title */}
            <h2 className="movie-title">{ticket.movie}</h2>

            {/* Date and Time */}
            <div className="badge-row">
              <span className="badge">
                {ticket.date ? new Date(ticket.date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                }) : (movie?.date ? new Date(movie.date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                }) : 'N/A')}
              </span>
              <span className="badge">
                {ticket.date ? new Date(ticket.date).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : (movie?.date ? new Date(movie.date).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A')}
              </span>
            </div>

            {/* Divider */}
            <div className="divider"></div>

            {/* Booking Details */}
            <div className="details-section">
              <h3 className="section-title">Booking Details</h3>

              <div className="detail-row">
                <span className="detail-label">Venue</span>
                <span className="detail-value">{ticket.venue}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Seats</span>
                <span className="detail-value">{selectedSeats?.join(', ')}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Booking ID</span>
                <span className="detail-value">{ticket.booking_id}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Amount Paid</span>
                <span className="detail-value">Rs.{payment?.amount || (selectedSeats?.length * 100) || 0}</span>
              </div>

              {payment?.transaction_id && (
                <div className="detail-row">
                  <span className="detail-label">Transaction ID</span>
                  <span className="detail-value transaction-id">{payment.transaction_id}</span>
                </div>
              )}

              {payment?.method && (
                <div className="detail-row">
                  <span className="detail-label">Payment Method</span>
                  <span className="detail-value">{payment.method}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="divider"></div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                className="action-btn primary"
                onClick={() => navigate('/my-bookings')}
              >
                Download Tickets
              </button>
              <button
                className="action-btn secondary"
                onClick={() => navigate('/')}
              >
                Back to Home
              </button>
            </div>

            <p className="action-hint">You can download your ticket from the My Bookings page</p>
          </div>
        </div>

        {/* Important Notice Card */}
        <div className="notice-card">
          <h3 className="notice-title">Important Information</h3>
          <ul className="notice-list">
            <li>Arrive at the venue 15 minutes before show time</li>
            <li>Valid ID proof is required for entry</li>
            <li>Tickets are non-refundable and non-transferable</li>
            <li>Keep this confirmation safe for reference</li>
          </ul>
        </div>

        {/* Footer Note */}
        <div className="footer-note">
          <span>Thank you for choosing Chalchitra! Enjoy your movie experience.</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
