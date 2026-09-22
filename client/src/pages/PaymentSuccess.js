import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { istDate, istTime, istDateTime } from '../utils/movieStatus';
import { buildTicketModel, renderTicketCanvas, ticketCanvasToPdf } from '../utils/ticketPdf';
import CoinIcon from '../components/CoinIcon';

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

        const canvas = await renderTicketCanvas(buildTicketModel({
          bookingCode: ticket.booking_id,
          title: ticket.movie,
          persons: ticket.num_people || navCustomerDetails?.numPeople || 1,
          seats: ticket.selected_seats,
          date: ticket.date,
          venue: ticket.venue,
          qrDataUrl: ticket.qr_code,
          backgroundUrl: `${window.location.origin}/misc/ticc.png`,
        }));

        const pdf = ticketCanvasToPdf(canvas);
        const pdfDataUri = pdf.output('datauristring');
        const pdfBase64 = pdfDataUri.split(',')[1];


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
                      <div className="email-status-sub">Check spam/junk if it's not in your inbox and mark it as <span style={{ color: 'var(--qt-amber)', fontWeight: 'bold' }}>"Not Spam"</span>.</div>
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
                {ticket.date ? istDate(ticket.date, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                }) : (movie?.date ? istDate(movie.date, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                }) : 'N/A')}
              </span>
              <span className="badge">
                {ticket.date ? istTime(ticket.date, {
                  hour: '2-digit',
                  minute: '2-digit'
                }) : (movie?.date ? istTime(movie.date, {
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
                <span className="detail-value"><CoinIcon size={14} /> {payment?.amount ?? (selectedSeats?.length * 20) ?? 0} Coins</span>
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
