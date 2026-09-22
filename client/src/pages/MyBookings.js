import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Modal, Card, Badge, Alert } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { istDate, istTime, istDateTime } from '../utils/movieStatus';
import Loader from '../components/Loader';
import { buildTicketModel, renderTicketCanvas, ticketCanvasToPdf } from '../utils/ticketPdf';

// Keep relative assets on the frontend origin so hosting rewrites proxy them.
// This avoids direct browser requests to Render, which some campus networks block.
const apiBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [downloadingTicket, setDownloadingTicket] = useState(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/api/bookings/my');
      setBookings(res.data);
      setLoading(false);

      // Check for feedback request in URL
      const movieId = searchParams.get('movie_id');
      const isFeedback = searchParams.get('feedback') === 'true';

      if (isFeedback && movieId && res.data.length > 0) {
        const bookingToFeedback = res.data.find(b => b.movie_id === parseInt(movieId, 10));
        if (bookingToFeedback) {
          setSelectedBooking(bookingToFeedback);
          setShowFeedback(true);
        }
      }
    } catch (err) {
      setError('Failed to load bookings');
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    // One review per movie, so a second press must not create a second row.
    if (submittingFeedback) return;
    setSubmittingFeedback(true);
    try {
      const res = await api.post('/api/feedback', {
        movie_id: selectedBooking.movie_id,
        rating: feedbackRating,
        comment: feedbackComment
      });
      alert(res.data?.updated
        ? 'Your review has been updated. Thank you!'
        : 'Thank you for your feedback!');
      setShowFeedback(false);
      setFeedbackRating(5);
      setFeedbackComment('');
    } catch (error) {
      alert('Failed to submit feedback: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleDownloadTicket = async (booking) => {
    try {
      console.log('Starting ticket download for booking:', booking);

      // Set downloading state
      setDownloadingTicket(booking.id);

      const canvas = await renderTicketCanvas(buildTicketModel({
        bookingCode: booking.booking_code || booking.id,
        title: booking.title,
        persons: booking.num_people || 1,
        seats: booking.selected_seats,
        date: booking.date,
        venue: booking.venue,
        qrDataUrl: booking.qr_code,
        backgroundUrl: `${window.location.origin}/misc/ticc.png`,
      }));

      console.log('Ticket rendered:', canvas.width, 'x', canvas.height);

      const pdf = ticketCanvasToPdf(canvas);

      console.log('PDF created with visual ticket design');

      // Generate filename using movie name instead of user name
      const movieName = (booking.title || 'Movie').replace(/[^a-zA-Z0-9]/g, '_');
      const bookingId = booking.booking_code || booking.id;
      const filename = movieName + '_' + bookingId + '.pdf';

      console.log('Saving PDF:', filename);
      pdf.save(filename);


    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to download ticket. Please try again.');
    } finally {
      // Reset downloading state
      setDownloadingTicket(null);
    }
  };

  if (loading) {
    return <Loader message="Fetching Your Bookings" subtitle="Getting your tickets ready..." />;
  }

  return (
    <div className="bg-void" style={{minHeight: '100vh'}}>
      <style>
        {`
          .my-bookings-container {
            padding: 6rem 2rem 3.5rem;
          }

          .my-bookings-header {
            text-align: center;
            margin-bottom: 1.5rem;
            margin-top: -4.5rem;
            padding: 0 1rem;
          }

          .my-bookings-title {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 2.5rem;
            font-weight: 600;
            color: var(--qt-text);
            margin-bottom: 0.85rem;
            letter-spacing: -0.025em;
          }

          .my-bookings-title i {
            color: var(--qt-text);
            font-size: 2rem;
          }

          .my-bookings-subtitle {
            font-size: 1.05rem;
            color: var(--qt-muted);
            max-width: 620px;
            margin: 0 auto;
            line-height: 1.6;
            font-weight: 400;
          }

          @media (max-width: 768px) {
            .my-bookings-container {
              padding: 5.2rem 1.25rem 3rem;
            }

            .my-bookings-header {
              margin-top: -3.4rem !important;
              margin-bottom: 1.1rem !important;
            }

            .my-bookings-title {
              font-size: 1.9rem !important;
              font-weight: 700 !important;
            }

            .my-bookings-title i {
              font-size: 1.55rem !important;
            }

            .my-bookings-subtitle {
              font-size: 1rem !important;
              margin-top: -0.15rem !important;
            }
          }
        `}
      </style>

      <div>
        <Container className="my-bookings-container">
          <div className="my-bookings-header">
            <h1 className="my-bookings-title">
              MY BOOKINGS
            </h1>
            <p className="my-bookings-subtitle">
              Access your tickets, download passes, and manage bookings in one place.
            </p>
          </div>

        {error && (
          <Alert variant="danger" style={{marginBottom: '2rem'}}>
            {error}
          </Alert>
        )}

        {bookings.length === 0 ? (
          <Card style={{
            padding: '3rem',
            textAlign: 'center',
            background: 'var(--qt-surface)',
            border: '1px solid var(--qt-line)',
            color: 'var(--qt-text)'
          }}>
            <Card.Body>
              <i className="fas fa-ticket-alt" style={{
                fontSize: '4rem',
                color: 'var(--qt-quiet)',
                marginBottom: '1.5rem',
                display: 'block'
              }}></i>
              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>No Bookings Yet</h3>
              <p style={{
                color: 'var(--qt-muted)',
                fontSize: '1.1rem',
                marginBottom: '2rem',
                maxWidth: '500px',
                margin: '0 auto 2rem'
              }}>You haven't booked any movie tickets yet. Discover amazing films and reserve your seats!</p>
              <Button
                variant="primary"
                onClick={() => window.location.href = '/upcoming-movies'}
              >
                Explore Movies
              </Button>
            </Card.Body>
          </Card>
        ) : (
          <>
              <Row className="my-bookings-row">
              {bookings.map((booking) => (
                <Col lg={3} md={4} sm={6} xs={6} key={booking.id} className="mb-4">
                  <Card className="h-100 border-0 my-booking-card" style={{
                  background: 'var(--qt-surface)',
                  border: '1px solid var(--qt-line)',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}>

                  <Card.Body className="my-booking-card-body" style={{padding: '0.75rem'}}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                      gap: '0.75rem'
                    }}>
                      {/* Poster on left */}
                      <div className="my-booking-poster" style={{
                        width: '60px',
                        height: '60px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid var(--qt-line)'
                      }}>
                        {booking.poster_url ? (
                          <img
                            src={booking.poster_url.startsWith('http') ? booking.poster_url : `${apiBaseUrl}${booking.poster_url}`}
                            alt={booking.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'var(--qt-panel-soft)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <i className="fas fa-film" style={{
                              fontSize: '1.2rem',
                              color: 'var(--qt-quiet)'
                            }}></i>
                          </div>
                        )}
                      </div>

                      {/* Movie name and status on right */}
                      <div style={{flex: 1}}>
                        <h6 className="my-booking-title-text" style={{
                          fontSize: '0.95rem',
                          fontWeight: '700',
                          color: 'var(--qt-text)',
                          marginBottom: '0.25rem',
                          lineHeight: '1.2'
                        }}>
                          {booking.title}
                        </h6>
                        <div className="my-booking-status" style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.2rem 0.5rem',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: 'var(--qt-surface)',
                          border: booking.is_used ?
                            '1px solid #d64545' :
                            '1px solid #0f9d63',
                          color: booking.is_used ? '#d64545' : '#0f9d63'
                        }}>
                          <i className={`fas ${booking.is_used ? 'fa-times-circle' : 'fa-check-circle'} me-1`}
                             style={{fontSize: '0.6rem'}}></i>
                          {booking.is_used ? 'Used' : 'Valid'}
                        </div>
                      </div>
                    </div>

                    <div className="my-booking-info-section" style={{marginBottom: '0.75rem'}}>
                      <div className="my-booking-info-row" style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                        {/* Date Box */}
                        <div className="my-booking-info-box my-booking-info-date" style={{
                          flex: '1 1 auto',
                          minWidth: '100px',
                          background: 'var(--qt-panel-soft)',
                          border: '1px solid var(--qt-line)',
                          padding: '0.4rem 0.6rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className="fas fa-calendar" style={{
                            color: 'var(--qt-muted)',
                            marginBottom: '0.2rem',
                            fontSize: '0.8rem',
                            display: 'block'
                          }}></i>
                          <span style={{color: 'var(--qt-text)', fontSize: '0.8rem', fontWeight: '600'}}>
                            {istDate(booking.date, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        {/* Time Box */}
                        <div className="my-booking-info-box my-booking-info-time" style={{
                          flex: '1 1 auto',
                          minWidth: '100px',
                          background: 'var(--qt-panel-soft)',
                          border: '1px solid var(--qt-line)',
                          padding: '0.4rem 0.6rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className="fas fa-clock" style={{
                            color: 'var(--qt-muted)',
                            marginBottom: '0.2rem',
                            fontSize: '0.8rem',
                            display: 'block'
                          }}></i>
                          <span style={{color: 'var(--qt-text)', fontSize: '0.75rem', fontWeight: '600'}}>
                            {istTime(booking.date, {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Venue Box */}
                        <div className="my-booking-info-box my-booking-info-venue" style={{
                          flex: '1 1 auto',
                          minWidth: '100px',
                          background: 'var(--qt-panel-soft)',
                          border: '1px solid var(--qt-line)',
                          padding: '0.4rem 0.6rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className="fas fa-map-marker-alt" style={{
                            color: 'var(--qt-muted)',
                            marginBottom: '0.2rem',
                            fontSize: '0.8rem',
                            display: 'block'
                          }}></i>
                          <span style={{
                            color: 'var(--qt-text)',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {booking.venue}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="my-booking-actions" style={{
                      display: 'flex',
                      gap: '0.5rem',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      pointerEvents: 'auto'
                    }}>
                      {booking.is_used ? (
                        <>
                          <Button
                            size="sm"
                            style={{
                              background: 'var(--qt-ink)',
                              border: '1px solid var(--qt-ink)',
                              padding: '0.5rem 1rem',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              color: 'var(--qt-on-ink)',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setFeedbackRating(5);
                              setFeedbackComment('');
                              setShowFeedback(true);
                            }}
                          >
                            <i className="fas fa-star me-1"></i>
                            Feedback
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            disabled={downloadingTicket === booking.id}
                            style={{
                              background: 'var(--qt-ink)',
                              border: '1px solid var(--qt-ink)',
                              padding: '0.5rem 1rem',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              color: 'var(--qt-on-ink)',
                              transition: 'all 0.2s ease',
                              opacity: downloadingTicket === booking.id ? 0.6 : 1,
                              cursor: downloadingTicket === booking.id ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => handleDownloadTicket(booking)}
                          >
                            {downloadingTicket === booking.id ? (
                              <>
                                <div style={{
                                  display: 'inline-block',
                                  width: '12px',
                                  height: '12px',
                                  border: '2px solid #ffffff',
                                  borderTop: '2px solid transparent',
                                  borderRadius: '50%',
                                  animation: 'spin 1s linear infinite',
                                  marginRight: '0.25rem'
                                }}></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-download me-1"></i>
                                Download
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
        )}

        {/* Feedback Modal - Glass Effect Design */}
        <Modal
          show={showFeedback}
          onHide={() => setShowFeedback(false)}
          centered
          contentClassName="feedback-modal-content"
          style={{
            backgroundColor: 'rgba(11, 14, 23, 0.4)'
          }}
        >
          <div style={{
            background: 'var(--qt-surface)',
            border: '1px solid var(--qt-line)',
            position: 'relative',
            overflow: 'hidden',
            width: '95%',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            {/* Modal Header */}
            <Modal.Header closeButton style={{
              background: 'transparent',
              borderBottom: '1px solid var(--qt-line-soft)',
              color: 'var(--qt-text)',
              position: 'relative',
              zIndex: 2,
              padding: '1.25rem 1.5rem 1rem'
            }}>
              <Modal.Title style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                textAlign: 'left',
                width: '100%',
                margin: 0,
                color: 'var(--qt-text)'
              }}>
                Share Your Experience
              </Modal.Title>
            </Modal.Header>

            {/* Modal Body */}
            <Modal.Body style={{
              padding: '1.25rem 1.5rem 1.5rem',
              position: 'relative',
              zIndex: 2
            }}>
              {/* Rating Section with Slider */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    color: 'var(--qt-muted)',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    Rating
                  </span>
                  <span style={{
                    color: 'var(--qt-text)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    background: 'var(--qt-panel-soft)',
                    padding: '0.25rem 0.75rem',
                    border: '1px solid var(--qt-line)'
                  }}>
                    {feedbackRating} / 5
                  </span>
                </div>

                {/* Slider Container */}
                <div style={{
                  padding: '0.5rem 0',
                  background: 'var(--qt-panel-soft)',
                  border: '1px solid var(--qt-line)',
                  paddingLeft: '1rem',
                  paddingRight: '1rem'
                }}>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={feedbackRating}
                    onChange={(e) => setFeedbackRating(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      height: '6px',
                      appearance: 'none',
                      background: `linear-gradient(to right, #0b0e17 0%, #0b0e17 ${(feedbackRating - 1) * 25}%, #e5e7eb ${(feedbackRating - 1) * 25}%, #e5e7eb 100%)`,
                      borderRadius: '5px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '0.5rem',
                    padding: '0 0.25rem'
                  }}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <span
                        key={num}
                        style={{
                          color: feedbackRating === num ? '#0b0e17' : '#8b909c',
                          fontSize: '0.75rem',
                          fontWeight: feedbackRating === num ? '600' : '400',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Comment Section */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'var(--qt-muted)',
                  fontSize: '0.9rem'
                }}>
                  Comment
                  <span style={{ color: 'var(--qt-quiet)', fontWeight: '400', marginLeft: '0.5rem' }}>(optional)</span>
                </label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Tell us what you think..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: 'var(--qt-surface)',
                    border: '1px solid var(--qt-line)',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    outline: 'none',
                    color: 'var(--qt-text)',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0b0e17';
                    e.target.style.boxShadow = 'none';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </Modal.Body>

            {/* Modal Footer */}
            <Modal.Footer style={{
              borderTop: '1px solid var(--qt-line-soft)',
              padding: '1rem 1.5rem 1.25rem',
              background: 'transparent',
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              gap: '0.75rem'
            }}>
              <Button
                variant="secondary"
                onClick={() => setShowFeedback(false)}
                style={{
                  padding: '0.7rem 1.25rem',
                  fontWeight: '600',
                  background: 'var(--qt-surface)',
                  border: '1px solid var(--qt-line)',
                  color: 'var(--qt-text)',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f6f6f7';
                  e.target.style.borderColor = '#0b0e17';
                  e.target.style.color = '#0b0e17';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#ffffff';
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.color = '#0b0e17';
                }}
              >
                Cancel
              </Button>
              <Button
                style={{
                  background: 'var(--qt-ink)',
                  border: '1px solid var(--qt-ink)',
                  padding: '0.7rem 1.25rem',
                  fontWeight: '600',
                  color: 'var(--qt-on-ink)',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease',
                  flex: 1.5
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#000000';
                  e.target.style.borderColor = '#000000';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#0b0e17';
                  e.target.style.borderColor = '#0b0e17';
                }}
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback}
              >
                <i className="fas fa-paper-plane" style={{marginRight: '0.5rem'}}></i>
                {submittingFeedback ? 'Sending…' : 'Submit'}
              </Button>
            </Modal.Footer>
          </div>
        </Modal>
        </Container>
      </div>

      <style>
        {`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            background: var(--qt-ink);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #ffffff;
          }
          input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: var(--qt-ink);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #ffffff;
          }
          @media (max-width: 576px) {
            .my-bookings-title {
              font-size: 1.2rem !important;
              font-weight: 500 !important;
              margin-bottom: 0.45rem !important;
              font-family: Arial, Helvetica, sans-serif !important;
            }

            .my-bookings-title {
              margin-top: -1rem !important;
            }

            .my-bookings-row {
              --bs-gutter-x: 0.6rem;
              --bs-gutter-y: 0.8rem;
              margin-top: -0.6rem !important;
            }

            .my-booking-card {
              border-radius: 14px !important;
            }

            .my-booking-card-body {
              padding: 0.6rem !important;
            }

            .my-booking-poster {
              width: 48px !important;
              height: 48px !important;
              border-radius: 6px !important;
            }

            .my-booking-title-text {
              font-size: 0.75rem !important;
              margin-bottom: 0.2rem !important;
            }

            .my-booking-status {
              font-size: 0.5rem !important;
              padding: 0.15rem 0.4rem !important;
              border-radius: 10px !important;
            }

            .my-booking-info-section {
              margin-bottom: 0.6rem !important;
            }

            .my-booking-info-row {
              gap: 0.3rem !important;
              display: grid !important;
              grid-template-columns: 1fr 1fr;
            }

            .my-booking-info-box {
              min-width: 0 !important;
              padding: 0.1rem 0.16rem !important;
              border-radius: 5px !important;
            }

            .my-booking-info-box i {
              font-size: 0.48rem !important;
              margin-bottom: 0.04rem !important;
            }

            .my-booking-info-box span {
              font-size: 0.52rem !important;
            }

            .my-booking-info-box {
              min-height: 22px;
            }

            .my-booking-info-venue {
              grid-column: 1 / -1;
            }

            .my-booking-select {
              width: 16px !important;
              height: 16px !important;
              top: 6px !important;
              right: 6px !important;
            }

            .my-booking-select i {
              font-size: 0.45rem !important;
            }

            .my-booking-actions {
              gap: 0.4rem !important;
            }

            .my-booking-actions button {
              padding: 0.24rem 0.45rem !important;
              font-size: 0.58rem !important;
              border-radius: 5px !important;
            }


          }
        `}
      </style>
    </div>
  );
};

export default MyBookings;
