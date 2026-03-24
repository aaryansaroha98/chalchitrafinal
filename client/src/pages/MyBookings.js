import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Modal, Card, Badge, Alert } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

          <div style="position: absolute; right: -25px; top: 69px; width: 180px; color: #000000; textAlign: 'left'; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2; text-transform: uppercase;">
              ${booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long' }) : 'N/A'}
            </div>
            <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2; marginTop: '2px';">
              ${booking.date ? new Date(booking.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
            </div>
          </div>

          <div style="position: absolute; right: -25px; top: 120px; width: 180px; color: #000000; textAlign: 'left'; fontFamily: 'Tahoma, Arial, sans-serif';">
            <div style="font-size: 13px; font-weight: 400; letter-spacing: 0.2px; line-height: 1.2;">
              ${booking.date ? new Date(booking.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </div>
          </div>

          <div style="position: absolute; right: -30px; top: 171.5px; width: 180px; color: #000000; textAlign: 'left'; fontFamily: 'Tahoma, Arial, sans-serif';">
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
            color: #ffffff;
            margin-bottom: 0.85rem;
            letter-spacing: -0.025em;
          }

          .my-bookings-title i {
            color: #0d6efd;
            font-size: 2rem;
          }

          .my-bookings-subtitle {
            font-size: 1.05rem;
            color: #6c757d;
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

      <div style={{position: 'relative', zIndex: 2}}>
        <Container className="my-bookings-container">
          <div className="my-bookings-header">
            <h1 className="my-bookings-title">
              <i className="fas fa-ticket-alt"></i>
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
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(25px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            color: '#ffffff'
          }}>
            <Card.Body>
              <i className="fas fa-ticket-alt" style={{
                fontSize: '4rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '1.5rem',
                display: 'block'
              }}></i>
              <h3 style={{
                fontSize: '1.8rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>No Bookings Yet</h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '1.1rem',
                marginBottom: '2rem',
                maxWidth: '500px',
                margin: '0 auto 2rem'
              }}>You haven't booked any movie tickets yet. Discover amazing films and reserve your seats!</p>
              <Button 
                variant="primary" 
                onClick={() => window.location.href = '/upcoming-movies'}
                style={{
                  background: 'linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)',
                  padding: '0.75rem 2rem',
                  borderRadius: '12px',
                  fontWeight: '600',
                  border: 'none',
                  boxShadow: '0 4px 15px rgba(13, 110, 253, 0.3)'
                }}
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
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
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
                    color: '#ffffff',
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
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: '#ffffff',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <i className="fas fa-check-double me-1"></i>
                      Select All
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSelectedBookings(new Set())}
                      style={{
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'rgba(255, 255, 255, 0.8)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      <i className="fas fa-times me-1"></i>
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
                    border: '1px solid #dc3545',
                    color: '#dc3545',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#dc3545';
                    e.target.style.color = 'white';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = '#dc3545';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="fas fa-trash me-1"></i>
                  Delete Selected ({selectedBookings.size})
                </Button>
              </div>
            )}

              <Row className="my-bookings-row">
              {bookings.map((booking) => (
                <Col lg={3} md={4} sm={6} xs={6} key={booking.id} className="mb-4">
                  <Card className="h-100 border-0 shadow-lg my-booking-card" style={{
                  background: selectedBookings.has(booking.id) 
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.06))'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                  backdropFilter: 'blur(20px)',
                  border: selectedBookings.has(booking.id) 
                    ? '1px solid rgba(255, 255, 255, 0.35)'
                    : '1px solid rgba(255, 215, 0, 0.2)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: selectedBookings.has(booking.id)
                    ? '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    : '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  transition: 'all 0.3s ease'
                }}>
                  {/* Selection Checkbox */}
                  <div className="my-booking-select" style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    zIndex: 10,
                    background: selectedBookings.has(booking.id) 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.12))'
                      : 'rgba(0, 0, 0, 0.5)',
                    border: selectedBookings.has(booking.id)
                      ? '1px solid rgba(255,255,255,0.35)'
                      : '2px solid rgba(255, 255, 255, 0.8)',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedBookings.has(booking.id)
                      ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                      : '0 2px 4px rgba(0, 0, 0, 0.3)'
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
                        e.target.style.background = 'rgba(40, 167, 69, 0.5)';
                        e.target.style.borderColor = '#28a745';
                        e.target.style.transform = 'scale(1.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedBookings.has(booking.id)) {
                        e.target.style.background = 'rgba(0, 0, 0, 0.5)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.8)';
                        e.target.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {selectedBookings.has(booking.id) ? (
                      <i className="fas fa-check" style={{color: '#ffffff', fontSize: '0.65rem', fontWeight: 'bold'}}></i>
                    ) : (
                      <i className="far fa-check" style={{color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.65rem'}}></i>
                    )}
                  </div>

                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: selectedBookings.has(booking.id)
                      ? '2px solid rgba(40, 167, 69, 0.4)'
                      : '1px solid rgba(255, 215, 0, 0.1)',
                    borderRadius: '20px',
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
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid rgba(255, 255, 255, 0.2)'
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
                            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(192, 192, 192, 0.05))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <i className="fas fa-film" style={{
                              fontSize: '1.2rem',
                              color: 'rgba(255, 215, 0, 0.7)'
                            }}></i>
                          </div>
                        )}
                      </div>

                      {/* Movie name and status on right */}
                      <div style={{flex: 1}}>
                        <h6 className="my-booking-title-text" style={{
                          fontSize: '0.95rem',
                          fontWeight: '700',
                          color: '#ffffff',
                          marginBottom: '0.25rem',
                          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                          lineHeight: '1.2'
                        }}>
                          {booking.title}
                        </h6>
                        <div className="my-booking-status" style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: booking.is_used ?
                            'linear-gradient(135deg, rgba(220, 53, 69, 0.2), rgba(176, 42, 55, 0.1))' :
                            'linear-gradient(135deg, rgba(40, 167, 69, 0.2), rgba(34, 197, 94, 0.1))',
                          border: booking.is_used ?
                            '1px solid rgba(220, 53, 69, 0.3)' :
                            '1px solid rgba(40, 167, 69, 0.3)',
                          color: booking.is_used ? '#ff6b7a' : '#51cf66',
                          backdropFilter: 'blur(5px)',
                          boxShadow: booking.is_used ?
                            '0 2px 8px rgba(220, 53, 69, 0.15)' :
                            '0 2px 8px rgba(40, 167, 69, 0.15)'
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
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '0.4rem 0.6rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                          <i className="fas fa-calendar" style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            marginBottom: '0.2rem',
                            fontSize: '0.8rem',
                            display: 'block'
                          }}></i>
                          <span style={{color: '#ffffff', fontSize: '0.8rem', fontWeight: '600'}}>
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
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '0.4rem 0.6rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                          <i className="fas fa-clock" style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            marginBottom: '0.2rem',
                            fontSize: '0.8rem',
                            display: 'block'
                          }}></i>
                          <span style={{color: '#ffffff', fontSize: '0.75rem', fontWeight: '600'}}>
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
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04))',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '0.4rem 0.6rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                          <i className="fas fa-map-marker-alt" style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            marginBottom: '0.2rem',
                            fontSize: '0.8rem',
                            display: 'block'
                          }}></i>
                          <span style={{
                            color: '#ffffff',
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
                              background: 'linear-gradient(135deg, #ffc107, #fd7e14)',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-1px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(255, 193, 7, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = '0 2px 8px rgba(255, 193, 7, 0.3)';
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

                          <Button
                            size="sm"
                            variant="outline-danger"
                            style={{
                              border: '1px solid #dc3545',
                              color: '#dc3545',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#dc3545';
                              e.target.style.color = 'white';
                              e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent';
                              e.target.style.color = '#dc3545';
                              e.target.style.transform = 'translateY(0)';
                            }}
                            onClick={() => handleDeleteBooking(booking.id)}
                          >
                            <i className="fas fa-trash me-1"></i>
                            Delete
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            disabled={downloadingTicket === booking.id}
                            style={{
                              background: downloadingTicket === booking.id ?
                                'linear-gradient(135deg, #6c757d, #495057)' :
                                'linear-gradient(135deg, #28a745, #20c997)',
                              border: 'none',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              boxShadow: downloadingTicket === booking.id ?
                                '0 2px 8px rgba(108, 117, 125, 0.3)' :
                                '0 2px 8px rgba(40, 167, 69, 0.3)',
                              transition: 'all 0.3s ease',
                              opacity: downloadingTicket === booking.id ? 0.7 : 1,
                              cursor: downloadingTicket === booking.id ? 'not-allowed' : 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              if (downloadingTicket !== booking.id) {
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (downloadingTicket !== booking.id) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.3)';
                              }
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

                          <Button
                            size="sm"
                            variant="outline-danger"
                            style={{
                              border: '1px solid #dc3545',
                              color: '#dc3545',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = '#dc3545';
                              e.target.style.color = 'white';
                              e.target.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'transparent';
                              e.target.style.color = '#dc3545';
                              e.target.style.transform = 'translateY(0)';
                            }}
                            onClick={() => handleDeleteBooking(booking.id)}
                          >
                            <i className="fas fa-trash me-1"></i>
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
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }}
        >
          <div style={{
            background: '#0b0c10',
            backdropFilter: 'blur(14px)',
            borderRadius: '6px',
            border: '1px solid rgba(0, 0, 0, 0.4)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            color: '#e9edf5',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Glow accent */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 50% -20%, rgba(255,255,255,0.015), transparent 32%)',
              pointerEvents: 'none'
            }} />

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
              <h5 style={{ margin: 0, color: '#f7f8fc', fontWeight: 700, textAlign: 'center' }}>Delete booking{selectedBookings.size > 1 ? 's' : ''}</h5>
            </Modal.Header>

            {/* Modal Body */}
            <Modal.Body style={{ padding: '0.6rem 1.4rem 1rem', zIndex: 1 }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
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
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.025)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        marginBottom: '0.6rem'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>
                          {booking?.title || 'Booking'}
                        </span>
                        <span style={{ color: '#98a0b3', fontSize: '0.85rem' }}>
                          #{booking?.booking_code || booking?.id}
                        </span>
                      </div>
                      <span style={{
                        color: '#e9edf5',
                        fontSize: '0.9rem',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '10px',
                        padding: '0.3rem 0.7rem',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        {booking ? new Date(booking.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>
                  );
                })}
                {selectedBookings.size === 0 && (
                  <div style={{ color: '#98a0b3', textAlign: 'center', padding: '1rem' }}>
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
                  borderRadius: '12px',
                  fontWeight: 600,
                  color: '#e9edf5',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                Cancel
              </Button>
              <Button
                variant="dark"
                onClick={handleBulkDelete}
                style={{
                  padding: '0.75rem 1.6rem',
                  borderRadius: '12px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(10px)'
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
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{
            background: 'rgba(15, 17, 21, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            position: 'relative',
            overflow: 'hidden',
            width: '95%',
            maxWidth: '400px',
            margin: '0 auto',
            backdropFilter: 'blur(20px)'
          }}>
            {/* Modal Header */}
            <Modal.Header closeButton style={{
              background: 'transparent',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
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
                color: '#ffffff',
                fontFamily: 'Arial, sans-serif'
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
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    Rating
                  </span>
                  <span style={{
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}>
                    {feedbackRating} / 5
                  </span>
                </div>
                
                {/* Slider Container */}
                <div style={{
                  padding: '0.5rem 0',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
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
                      background: `linear-gradient(to right, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.6) ${(feedbackRating - 1) * 25}%, rgba(255, 255, 255, 0.15) ${(feedbackRating - 1) * 25}%, rgba(255, 255, 255, 0.15) 100%)`,
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
                          color: feedbackRating === num ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
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
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.9rem'
                }}>
                  Comment
                  <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontWeight: '400', marginLeft: '0.5rem' }}>(optional)</span>
                </label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Tell us what you think..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    outline: 'none',
                    color: '#f9fafb',
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 255, 255, 0.05)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </Modal.Body>

            {/* Modal Footer */}
            <Modal.Footer style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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
                  borderRadius: '10px',
                  fontWeight: '600',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease',
                  flex: 1
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                  e.target.style.color = 'rgba(255, 255, 255, 0.8)';
                }}
              >
                Cancel
              </Button>
              <Button
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.7rem 1.25rem',
                  borderRadius: '10px',
                  fontWeight: '600',
                  color: '#ffffff',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease',
                  flex: 1.5
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                }}
                onClick={handleSubmitFeedback}
              >
                <i className="fas fa-paper-plane" style={{marginRight: '0.5rem'}}></i>
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
            background: #ffffff;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.8);
          }
          input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: #ffffff;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.8);
          }
          @keyframes liquidFlow {
            0% {
              transform: translateX(-20px) translateY(-20px) scale(1);
              opacity: 0.6;
            }
            25% {
              transform: translateX(20px) translateY(-10px) scale(1.05);
              opacity: 0.8;
            }
            50% {
              transform: translateX(-10px) translateY(20px) scale(0.95);
              opacity: 0.5;
            }
            75% {
              transform: translateX(10px) translateY(-20px) scale(1.02);
              opacity: 0.7;
            }
            100% {
              transform: translateX(-20px) translateY(-20px) scale(1);
              opacity: 0.6;
            }
          }

          @keyframes randomFloat0 {
            0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0.2; }
            25% { transform: translate(15px, -20px) rotate(90deg); opacity: 0.6; }
            50% { transform: translate(-10px, -40px) rotate(180deg); opacity: 0.3; }
            75% { transform: translate(5px, -20px) rotate(270deg); opacity: 0.5; }
            100% { transform: translate(0px, 0px) rotate(360deg); opacity: 0.2; }
          }

          @keyframes randomFloat1 {
            0% { transform: translate(0px, 0px) scale(1); opacity: 0.3; }
            33% { transform: translate(-15px, -25px) scale(1.2); opacity: 0.7; }
            66% { transform: translate(20px, -15px) scale(0.8); opacity: 0.4; }
            100% { transform: translate(0px, 0px) scale(1); opacity: 0.3; }
          }

          @keyframes randomFloat2 {
            0% { transform: translate(0px, 0px) rotate(0deg); opacity: 0.25; }
            50% { transform: translate(18px, -22px) rotate(180deg); opacity: 0.6; }
            100% { transform: translate(0px, 0px) rotate(360deg); opacity: 0.25; }
          }

          @keyframes randomFloat3 {
            0% { transform: translate(0px, 0px) scale(1); opacity: 0.2; }
            25% { transform: translate(10px, -15px) scale(1.3); opacity: 0.5; }
            50% { transform: translate(-8px, -30px) scale(0.9); opacity: 0.3; }
            75% { transform: translate(12px, -15px) scale(1.1); opacity: 0.4; }
            100% { transform: translate(0px, 0px) scale(1); opacity: 0.2; }
          }

          @keyframes gentleWave {
            0%, 100% { opacity: 0.2; transform: translateX(-10px); }
            50% { opacity: 0.4; transform: translateX(10px); }
          }

          @keyframes slowRotate {
            0% { transform: translate(-50%, -50%) rotate(0deg); }
            100% { transform: translate(-50%, -50%) rotate(360deg); }
          }

          @keyframes slowRotateReverse {
            0% { transform: translate(-50%, -50%) rotate(360deg); }
            100% { transform: translate(-50%, -50%) rotate(0deg); }
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
