import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Modal, Card, Badge, Alert } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Icon from '../components/Icon';

// Derive API base URL to build absolute URLs for poster assets
const apiBaseUrl = process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  'http://localhost:3000';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [downloadingTicket, setDownloadingTicket] = useState(null);
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
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

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await api.delete(`/api/bookings/${bookingId}`);
        setBookings(bookings.filter(booking => booking.id !== bookingId));
        alert('Booking deleted successfully!');
      } catch (err) {
        alert('Failed to delete booking');
      }
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await api.post('/api/feedback', {
        movie_id: selectedBooking.movie_id,
        rating: feedbackRating,
        comment: feedbackComment
      });
      alert('Thank you for your feedback!');
      setShowFeedback(false);
      setFeedbackRating(5);
      setFeedbackComment('');
    } catch (error) {
      alert('Failed to submit feedback');
    }
  };

  const handleBulkDelete = async () => {
    try {
      // Convert Set to array for API call
      const bookingIds = Array.from(selectedBookings);
      
      // Delete all selected bookings
      await Promise.all(bookingIds.map(id => api.delete(`/api/bookings/${id}`)));
      
      // Update state to remove deleted bookings
      setBookings(bookings.filter(booking => !selectedBookings.has(booking.id)));
      
      // Clear selection
      setSelectedBookings(new Set());
      
      // Close modal
      setShowBulkDelete(false);
      
      alert(`Successfully deleted ${selectedBookings.size} booking${selectedBookings.size > 1 ? 's' : ''}!`);
    } catch (err) {
      console.error('Failed to delete bookings:', err);
      alert('Failed to delete some bookings. Please try again.');
    }
  };

  const handleDownloadTicket = async (booking) => {
    try {
      console.log('Starting ticket download for booking:', booking);

      // Set downloading state
      setDownloadingTicket(booking.id);

      const ticketBgUrl = `${window.location.origin}/misc/ticc.png`;

      // Generate the ticket HTML (same as PaymentSuccess) - updated visual design
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
              ${booking.booking_code || booking.id}
            </div>
          </div>

          <div style="position: absolute; left: 227px; top: 141.5px; width: 230px; color: #000000; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 12px; font-weight: 400; letter-spacing: 0.2px;">
              ${booking.title}
            </div>
          </div>

          <div style="position: absolute; left: 227px; top: 165px; width: 230px; color: #000000; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 12px; font-weight: 400; letter-spacing: 0.2px;">
              ${booking.num_people || 1}
            </div>
          </div>

          <div style="position: absolute; left: 227px; top: 189px; width: 260px; color: #000000; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 12px; font-weight: 400; letter-spacing: 0.2px;">
              ${booking.selected_seats
                ? JSON.parse(booking.selected_seats).map(seat => String(seat)).join(', ')
                : 'N/A'}
            </div>
          </div>

          <div style="position: absolute; left: 635px; top: 62.5px; color: #1a5f7a; fontSize: 15px; fontWeight: 'bold';">:</div>
          <div style="position: absolute; right: -25px; top: 67px; width: 180px; color: #000000; textAlign: 'left'; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2; text-transform: uppercase;">
              ${booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long' }) : 'N/A'}
            </div>
            <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2; marginTop: '2px';">
              ${booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
            </div>
          </div>

          <div style="position: absolute; left: 635px; top: 113.5px; color: #1a5f7a; fontSize: 15px; fontWeight: 'bold';">:</div>
          <div style="position: absolute; right: -25px; top: 118px; width: 180px; color: #000000; textAlign: 'left'; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2;">
              ${booking.date ? new Date(booking.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </div>
          </div>

          <div style="position: absolute; left: 641px; top: 165.5px; color: #1a5f7a; fontSize: 15px; fontWeight: 'bold';">:</div>
          <div style="position: absolute; right: -30px; top: 171px; width: 180px; color: #000000; textAlign: 'left'; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2;">
              ${booking.venue || 'N/A'}
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
            ${booking.qr_code && booking.qr_code.trim() !== '' ?
              '<img src="' + booking.qr_code + '" style="width: 98px; height: 98px; object-fit: contain; display: block;" alt="QR Code" crossorigin="anonymous" />' :
              '<div style="width: 98px; height: 98px; background: transparent; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #666; font-weight: 400;">QR NOT FOUND</div>'
            }
          </div>
        </div>
      `;

      // Create a temporary div with the ticket HTML
      const ticketElement = document.createElement('div');
      ticketElement.style.position = 'absolute';
      ticketElement.style.left = '-9999px';
      ticketElement.style.top = '-9999px';
      ticketElement.style.width = '800px'; // Set explicit width
      ticketElement.style.height = '260px';
      ticketElement.innerHTML = ticketHTML;
      document.body.appendChild(ticketElement);

      console.log('Ticket element created and added to DOM');

      // Function to preload images
      const preloadImages = (element) => {
        const images = element.querySelectorAll('img');
        const promises = Array.from(images).map(img => {
          return new Promise((resolve, reject) => {
            if (img.complete && img.naturalHeight !== 0) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => {
                console.warn('Image failed to load:', img.src);
                // Create a placeholder for failed images
                img.style.display = 'none';
                resolve();
              };
              // Set a reasonable timeout
              setTimeout(() => {
                console.warn('Image load timeout:', img.src);
                resolve();
              }, 5000);
            }
          });
        });
        return Promise.all(promises);
      };

      // Preload all images in the ticket
      await preloadImages(ticketElement);
      console.log('All images preloaded');

      // Additional wait for rendering
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate PDF using html2canvas with optimized settings
      console.log('Starting html2canvas with optimized settings...');
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

      console.log('Canvas created, dimensions:', canvas.width, 'x', canvas.height);

      // Create PDF from canvas with no margins
      const imgData = canvas.toDataURL('image/png', 1.0);

      // Calculate PDF dimensions to fit content exactly
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: pdfHeight > 297 ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, Math.min(pdfHeight, 297)]
      });

      // Add image to PDF with no margins (fill entire page)
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

      console.log('PDF created with visual ticket design');

      // Generate filename using movie name instead of user name
      const movieName = (booking.title || 'Movie').replace(/[^a-zA-Z0-9]/g, '_');
      const bookingId = booking.booking_code || booking.id;
      const filename = movieName + '_' + bookingId + '.pdf';

      console.log('Saving PDF:', filename);
      pdf.save(filename);

      // Clean up
      if (ticketElement.parentNode) {
        ticketElement.parentNode.removeChild(ticketElement);
      }

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
            color: #0b0e17;
            margin-bottom: 0.85rem;
            letter-spacing: -0.025em;
          }

          .my-bookings-title i {
            color: #0b0e17;
            font-size: 2rem;
          }

          .my-bookings-subtitle {
            font-size: 1.05rem;
            color: #5c6270;
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
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            color: '#0b0e17'
          }}>
            <Card.Body>
              <Icon name="ticket-alt" style={{
                fontSize: '4rem',
                color: '#8b909c',
                marginBottom: '1.5rem',
                display: 'block'
              }} />
              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>No Bookings Yet</h3>
              <p style={{
                color: '#5c6270',
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
            {/* Bulk Delete Controls */}
            {selectedBookings.size > 0 && (
              <div className="my-booking-bulk" style={{
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                padding: '1rem',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap'}}>
                  <span className="my-booking-bulk-text" style={{
                    color: '#0b0e17',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}>
                    Selected: {selectedBookings.size} booking{selectedBookings.size > 1 ? 's' : ''}
                  </span>
                  <div className="my-booking-bulk-actions" style={{display: 'flex', gap: '0.5rem'}}>
                    <Button
                      variant="outline-light"
                      onClick={() => {
                        const allIds = new Set(bookings.map(b => b.id));
                        setSelectedBookings(allIds);
                      }}
                      style={{
                        border: '1px solid #e5e7eb',
                        color: '#0b0e17',
                        padding: '0.4rem 0.8rem',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#f6f6f7';
                        e.target.style.borderColor = '#0b0e17';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <Icon name="check-double" className="me-1" />
                      Select All
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSelectedBookings(new Set())}
                      style={{
                        border: '1px solid #e5e7eb',
                        color: '#5c6270',
                        padding: '0.4rem 0.8rem',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = '#f6f6f7';
                        e.target.style.borderColor = '#0b0e17';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.borderColor = '#e5e7eb';
                      }}
                    >
                      <Icon name="times" className="me-1" />
                      Deselect All
                    </Button>
                  </div>
                </div>
                  <Button
                    className="my-booking-bulk-delete"
                    variant="outline-danger"
                  onClick={() => {
                    if (selectedBookings.size === 0) return;
                    const confirmed = window.confirm(`Delete ${selectedBookings.size} booking${selectedBookings.size > 1 ? 's' : ''}? This action cannot be undone.`);
                    if (confirmed) {
                      handleBulkDelete();
                    }
                  }}
                  style={{
                    border: '1px solid #d64545',
                    color: '#d64545',
                    padding: '0.5rem 1rem',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#d64545';
                    e.target.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#d64545';
                  }}
                >
                  <Icon name="trash" className="me-1" />
                  Delete Selected ({selectedBookings.size})
                </Button>
              </div>
            )}

              <Row className="my-bookings-row">
              {bookings.map((booking) => (
                <Col lg={3} md={4} sm={6} xs={6} key={booking.id} className="mb-4">
                  <Card className="h-100 border-0 my-booking-card" style={{
                  background: '#ffffff',
                  border: selectedBookings.has(booking.id)
                    ? '1px solid #0b0e17'
                    : '1px solid #e5e7eb',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.2s ease'
                }}>
                  {/* Selection Checkbox */}
                  <div className="my-booking-select" style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    zIndex: 10,
                    background: selectedBookings.has(booking.id)
                      ? '#0b0e17'
                      : '#ffffff',
                    border: selectedBookings.has(booking.id)
                      ? '1px solid #0b0e17'
                      : '1px solid #e5e7eb',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                    onClick={() => {
                      const newSelection = new Set(selectedBookings);
                      if (newSelection.has(booking.id)) {
                        newSelection.delete(booking.id);
                      } else {
                        newSelection.add(booking.id);
                      }
                      setSelectedBookings(newSelection);
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedBookings.has(booking.id)) {
                        e.target.style.background = '#f6f6f7';
                        e.target.style.borderColor = '#0b0e17';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedBookings.has(booking.id)) {
                        e.target.style.background = '#ffffff';
                        e.target.style.borderColor = '#e5e7eb';
                      }
                    }}
                  >
                    {selectedBookings.has(booking.id) ? (
                      <Icon name="check" style={{color: '#ffffff'}} />
                    ) : (
                      <Icon name="check" style={{color: '#8b909c'}} />
                    )}
                  </div>

                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: selectedBookings.has(booking.id)
                      ? '1px solid #0b0e17'
                      : '1px solid #eef0f2',
                    pointerEvents: 'none'
                  }}></div>

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
                        border: '1px solid #e5e7eb'
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
                            background: '#f6f6f7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Icon name="film" style={{
                              fontSize: '1.2rem',
                              color: '#8b909c'
                            }} />
                          </div>
                        )}
                      </div>

                      {/* Movie name and status on right */}
                      <div style={{flex: 1}}>
                        <h6 className="my-booking-title-text" style={{
                          fontSize: '0.95rem',
                          fontWeight: '700',
                          color: '#0b0e17',
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
                          background: '#ffffff',
                          border: booking.is_used ?
                            '1px solid #d64545' :
                            '1px solid #0f9d63',
                          color: booking.is_used ? '#d64545' : '#0f9d63'
                        }}>
                          {booking.is_used ? <Icon name="times-circle" className="me-1" /> : <Icon name="check-circle" className="me-1" />}
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
                          background: '#f6f6f7',
                          border: '1px solid #e5e7eb',
                          padding: '0.4rem 0.6rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon name="calendar" style={{
                            color: '#5c6270',
                            marginBottom: '0.2rem',
                            fontSize: '0.8rem',
                            display: 'block'
                          }} />
                          <span style={{color: '#0b0e17', fontSize: '0.8rem', fontWeight: '600'}}>
                            {new Date(booking.date).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        {/* Time Box */}
                        <div className="my-booking-info-box my-booking-info-time" style={{
                          flex: '1 1 auto',
                          minWidth: '100px',
                          background: '#f6f6f7',
                          border: '1px solid #e5e7eb',
                          padding: '0.4rem 0.6rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon name="clock" style={{
                            color: '#5c6270',
                            marginBottom: '0.2rem',
                            fontSize: '0.8rem',
                            display: 'block'
                          }} />
                          <span style={{color: '#0b0e17', fontSize: '0.75rem', fontWeight: '600'}}>
                            {new Date(booking.date).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        {/* Venue Box */}
                        <div className="my-booking-info-box my-booking-info-venue" style={{
                          flex: '1 1 auto',
                          minWidth: '100px',
                          background: '#f6f6f7',
                          border: '1px solid #e5e7eb',
                          padding: '0.4rem 0.6rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Icon name="map-marker-alt" style={{
                            color: '#5c6270',
                            marginBottom: '0.2rem',
                            fontSize: '0.8rem',
                            display: 'block'
                          }} />
                          <span style={{
                            color: '#0b0e17',
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
                              background: '#0b0e17',
                              border: '1px solid #0b0e17',
                              padding: '0.5rem 1rem',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              color: '#ffffff',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => {
                              setSelectedBooking(booking);
                              setFeedbackRating(5);
                              setFeedbackComment('');
                              setShowFeedback(true);
                            }}
                          >
                            <Icon name="star" className="me-1" />
                            Feedback
                          </Button>

                          <Button
                            size="sm"
                            variant="outline-danger"
                            style={{
                              border: '1px solid #d64545',
                              color: '#d64545',
                              padding: '0.5rem 1rem',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#d64545';
                              e.target.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent';
                              e.target.style.color = '#d64545';
                            }}
                            onClick={() => handleDeleteBooking(booking.id)}
                          >
                            <Icon name="trash" className="me-1" />
                            Delete
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            disabled={downloadingTicket === booking.id}
                            style={{
                              background: '#0b0e17',
                              border: '1px solid #0b0e17',
                              padding: '0.5rem 1rem',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              color: '#ffffff',
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
                                <Icon name="download" className="me-1" />
                                Download
                              </>
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline-danger"
                            style={{
                              border: '1px solid #d64545',
                              color: '#d64545',
                              padding: '0.5rem 1rem',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#d64545';
                              e.target.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent';
                              e.target.style.color = '#d64545';
                            }}
                            onClick={() => handleDeleteBooking(booking.id)}
                          >
                            <Icon name="trash" className="me-1" />
                            Delete
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

        {/* Bulk Delete Modal */}
        <Modal
          show={showBulkDelete}
          onHide={() => setShowBulkDelete(false)}
          centered
          size="md"
          style={{
            backgroundColor: 'rgba(11, 14, 23, 0.4)'
          }}
        >
          <div style={{
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            color: '#0b0e17',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <Modal.Header
              style={{
                borderBottom: 'none',
                background: 'transparent',
                padding: '1rem 1.2rem 0.2rem',
                zIndex: 1,
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <h5 style={{ margin: 0, color: '#0b0e17', fontWeight: 700, textAlign: 'center' }}>Delete booking{selectedBookings.size > 1 ? 's' : ''}</h5>
            </Modal.Header>

            {/* Modal Body */}
            <Modal.Body style={{ padding: '0.6rem 1.4rem 1rem', zIndex: 1 }}>
              <div style={{
                background: '#f6f6f7',
                border: '1px solid #e5e7eb',
                maxHeight: '260px',
                overflow: 'auto',
                padding: '0.75rem'
              }}>
                {Array.from(selectedBookings).map((bookingId) => {
                  const booking = bookings.find(b => b.id === bookingId);
                  return (
                    <div
                      key={bookingId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.65rem 0.75rem',
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        marginBottom: '0.6rem'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: '#0b0e17', fontWeight: 600, fontSize: '1rem' }}>
                          {booking?.title || 'Booking'}
                        </span>
                        <span style={{ color: '#8b909c', fontSize: '0.85rem' }}>
                          #{booking?.booking_code || booking?.id}
                        </span>
                      </div>
                      <span style={{
                        color: '#5c6270',
                        fontSize: '0.9rem',
                        background: '#f6f6f7',
                        padding: '0.3rem 0.7rem',
                        border: '1px solid #e5e7eb'
                      }}>
                        {booking ? new Date(booking.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>
                  );
                })}
                {selectedBookings.size === 0 && (
                  <div style={{ color: '#8b909c', textAlign: 'center', padding: '1rem' }}>
                    No bookings selected.
                  </div>
                )}
              </div>
            </Modal.Body>

            {/* Modal Footer */}
            <Modal.Footer style={{
              borderTop: 'none',
              padding: '1rem 1.4rem 1.3rem',
              background: 'transparent',
              zIndex: 1
            }}>
              <Button
                variant="outline-light"
                onClick={() => setShowBulkDelete(false)}
                style={{
                  padding: '0.75rem 1.4rem',
                  fontWeight: 600,
                  color: '#0b0e17',
                  border: '1px solid #e5e7eb',
                  background: '#ffffff'
                }}
              >
                Cancel
              </Button>
              <Button
                variant="dark"
                onClick={handleBulkDelete}
                style={{
                  padding: '0.75rem 1.6rem',
                  fontWeight: 700,
                  background: '#d64545',
                  border: '1px solid #d64545',
                  color: '#ffffff'
                }}
              >
                Delete {selectedBookings.size}
              </Button>
            </Modal.Footer>
          </div>
        </Modal>

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
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            position: 'relative',
            overflow: 'hidden',
            width: '95%',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            {/* Modal Header */}
            <Modal.Header closeButton style={{
              background: 'transparent',
              borderBottom: '1px solid #eef0f2',
              color: '#0b0e17',
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
                color: '#0b0e17'
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
                    color: '#5c6270',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    Rating
                  </span>
                  <span style={{
                    color: '#0b0e17',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    background: '#f6f6f7',
                    padding: '0.25rem 0.75rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    {feedbackRating} / 5
                  </span>
                </div>

                {/* Slider Container */}
                <div style={{
                  padding: '0.5rem 0',
                  background: '#f6f6f7',
                  border: '1px solid #e5e7eb',
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
                  color: '#5c6270',
                  fontSize: '0.9rem'
                }}>
                  Comment
                  <span style={{ color: '#8b909c', fontWeight: '400', marginLeft: '0.5rem' }}>(optional)</span>
                </label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Tell us what you think..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    outline: 'none',
                    color: '#0b0e17',
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
              borderTop: '1px solid #eef0f2',
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
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  color: '#0b0e17',
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
                  background: '#0b0e17',
                  border: '1px solid #0b0e17',
                  padding: '0.7rem 1.25rem',
                  fontWeight: '600',
                  color: '#ffffff',
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
              >
                <Icon name="paper-plane" style={{marginRight: '0.5rem'}} />
                Submit
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
            background: #0b0e17;
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #ffffff;
          }
          input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: #0b0e17;
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

            .my-booking-bulk {
              padding: 0.7rem !important;
              gap: 0.6rem !important;
              margin-bottom: 1rem !important;
            }

            .my-booking-bulk-text {
              font-size: 0.7rem !important;
            }

            .my-booking-bulk-actions button,
            .my-booking-bulk-delete {
              padding: 0.3rem 0.6rem !important;
              font-size: 0.65rem !important;
              border-radius: 6px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default MyBookings;
