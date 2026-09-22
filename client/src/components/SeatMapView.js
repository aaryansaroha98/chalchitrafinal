import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Button, Spinner, Form } from 'react-bootstrap';
import api from '../api/axios';
import { istDate, istTime } from '../utils/movieStatus';

/*
 * Who is sitting where, drawn as the venue.
 *
 * The block shapes are the same ones the booking page draws, so a seat here is
 * the seat someone actually picked. They are declared as data rather than
 * copied as markup, because two hand-written copies of a seat plan drift the
 * first time a row changes.
 */
const VENUES = {
  mansar: {
    match: /mansar/i,
    label: 'Mansar Auditorium',
    blocks: [
      { id: 'A', name: 'Block A', rows: Array.from({ length: 15 }, () => 7) },
      { id: 'B', name: 'Block B', rows: Array.from({ length: 14 }, () => 11) },
      { id: 'C', name: 'Block C', rows: Array.from({ length: 15 }, () => 7) },
    ],
  },
  pushkar: {
    match: /pushkar/i,
    label: 'Pushkar',
    blocks: [
      { id: 'A', name: 'Block A', rows: Array.from({ length: 5 }, () => 5) },
      { id: 'B', name: 'Block B', rows: [8, 8, 9, 10, 11, 12, 12] },
      { id: 'C', name: 'Block C', rows: Array.from({ length: 5 }, () => 5) },
    ],
  },
};

const venueFor = (name) => {
  const found = Object.values(VENUES).find((v) => v.match.test(name || ''));
  return found || VENUES.mansar;
};

const SeatMapView = ({ show, movies = [], initialMovieId, onHide }) => {
  const [movieId, setMovieId] = useState(initialMovieId || '');
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [picked, setPicked] = useState(null);

  // Follow whatever the Bookings tab was already filtered to, but only when
  // the sheet opens — changing it in here should not fight the caller.
  useEffect(() => {
    if (show) setMovieId(initialMovieId || (movies[0] ? String(movies[0].id) : ''));
  }, [show, initialMovieId]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async (quiet = false) => {
    if (!movieId) { setData(null); return; }
    if (!quiet) setLoading(true);
    try {
      const res = await api.get(`/api/admin/movies/${movieId}/seat-map`);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    if (!show) { setPicked(null); setQuery(''); return undefined; }
    load();
    // Re-read while the sheet is open so someone scanning at the door, or a
    // booking made in another tab, shows up without anyone pressing anything.
    const tick = setInterval(() => load(true), 8000);
    return () => clearInterval(tick);
  }, [show, load]);

  const selectedMovie = useMemo(
    () => movies.find((m) => String(m.id) === String(movieId)) || null,
    [movies, movieId]
  );
  const venue = useMemo(
    () => venueFor(data?.movie?.venue || selectedMovie?.venue),
    [data, selectedMovie]
  );
  const seats = data?.seats || {};

  // A search lights up every seat belonging to anyone who matches — by name,
  // student id, email or booking id — so one person's whole party is visible
  // at once rather than one seat at a time.
  const matchedSeats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const hits = new Set();
    Object.entries(seats).forEach(([id, o]) => {
      const hay = `${o.name} ${o.studentId} ${o.email} ${o.bookingCode}`.toLowerCase();
      if (hay.includes(q)) hits.add(id);
    });
    return hits;
  }, [query, seats]);

  const matchedPeople = useMemo(() => {
    if (!matchedSeats) return [];
    const byBooking = new Map();
    matchedSeats.forEach((id) => {
      const o = seats[id];
      if (o && !byBooking.has(o.bookingCode)) byBooking.set(o.bookingCode, o);
    });
    return [...byBooking.values()];
  }, [matchedSeats, seats]);

  const seatState = (id) => {
    const o = seats[id];
    if (!o) return 'free';
    if (o.conflictsWith?.length) return 'conflict';
    return o.isUsed || o.admitted > 0 ? 'scanned' : 'taken';
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title style={{ fontSize: '1.1rem' }}>
          <i className="fas fa-chair me-2"></i>
          Graphical View
          {data?.movie?.date && (
            <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 400 }}>
              {' '}&middot; {data.movie.title} &middot; {istDate(data.movie.date)} {istTime(data.movie.date, { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="row g-2 mb-3">
          <div className="col-md-6">
            <Form.Label className="mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Movie</Form.Label>
            <Form.Select value={movieId} onChange={(e) => { setMovieId(e.target.value); setPicked(null); }}>
              {movies.length === 0 && <option value="">No movies</option>}
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} — {m.venue || 'venue not set'} — {istDate(m.date)}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-md-6">
            <Form.Label className="mb-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              Search person
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Name, student ID, email or booking ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {matchedSeats && (
          <div className="seatmap-search-result mb-3">
            {matchedSeats.size === 0 ? (
              <span>Nobody here matches <strong>{query}</strong>.</span>
            ) : (
              <span>
                <strong>{matchedSeats.size}</strong> seat{matchedSeats.size === 1 ? '' : 's'} highlighted
                {' '}for {matchedPeople.map((p) => `${p.name}${p.studentId ? ` (${p.studentId})` : ''}`).join(', ')}
              </span>
            )}
          </div>
        )}

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div className="d-flex flex-wrap align-items-center gap-3" style={{ fontSize: '0.85rem' }}>
            <span><span className="seatmap-key seatmap-free" /> Free</span>
            <span><span className="seatmap-key seatmap-taken" /> Booked</span>
            <span><span className="seatmap-key seatmap-scanned" /> Scanned in</span>
            <span><span className="seatmap-key seatmap-conflict" /> Double-booked</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              {data?.summary?.seatsTaken ?? 0} seat{data?.summary?.seatsTaken === 1 ? '' : 's'} taken
              {' '}&middot; {data?.summary?.bookings ?? 0} booking{data?.summary?.bookings === 1 ? '' : 's'}
              {' '}&middot; {venue.label}
            </span>
            <Button size="sm" variant="outline-secondary" style={{ borderRadius: 0 }}
              onClick={() => load()} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        {loading && !data ? (
          <div className="text-center py-5"><Spinner animation="border" size="sm" /> Loading seats…</div>
        ) : (
          <>
            <div className="seatmap-screen">SCREEN</div>

            <div className="seatmap-blocks">
              {venue.blocks.map((block) => (
                <div key={block.id} className="seatmap-block">
                  <div className="seatmap-block-name">{block.name}</div>
                  {block.rows.map((count, rowIndex) => (
                    <div key={rowIndex} className="seatmap-row">
                      <span className="seatmap-rownum">{rowIndex + 1}</span>
                      {Array.from({ length: count }, (_, col) => {
                        const id = `${block.id}-R${rowIndex + 1}-S${col + 1}`;
                        const state = seatState(id);
                        const occupant = seats[id];
                        return (
                          <button
                            key={id}
                            type="button"
                            className={[
                              'seatmap-seat',
                              `seatmap-${state}`,
                              picked?.id === id ? 'is-picked' : '',
                              matchedSeats ? (matchedSeats.has(id) ? 'is-hit' : 'is-dimmed') : '',
                            ].filter(Boolean).join(' ')}
                            title={occupant ? `${id} — ${occupant.name}` : id}
                            onClick={() => setPicked(occupant ? { id, ...occupant } : { id, empty: true })}
                          >
                            {col + 1}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="d-block">
        {picked ? (
          picked.empty ? (
            <div className="seatmap-detail">
              <strong>{picked.id}</strong> — nobody has booked this seat.
            </div>
          ) : (
            <div className="seatmap-detail">
              <div className="d-flex flex-wrap align-items-baseline gap-2 mb-1">
                <strong style={{ fontSize: '1.05rem' }}>{picked.name}</strong>
                <span className="badge bg-secondary">{picked.id}</span>
                {picked.isUsed || picked.admitted > 0 ? (
                  <span className="badge bg-success">Scanned in</span>
                ) : (
                  <span className="badge bg-dark">Not scanned</span>
                )}
                {picked.conflictsWith?.length > 0 && (
                  <span className="badge bg-danger">
                    Also claimed by {picked.conflictsWith.join(', ')}
                  </span>
                )}
              </div>
              <div className="seatmap-detail-grid">
                <span>Student ID</span><strong>{picked.studentId || '—'}</strong>
                <span>Email</span><strong>{picked.email || '—'}</strong>
                <span>Booking ID</span><strong>{picked.bookingCode}</strong>
                <span>Seats on this booking</span><strong>{picked.seats.join(', ')}</strong>
                <span>People</span><strong>{picked.numPeople}</strong>
                <span>Booked at</span>
                <strong>{picked.bookedAt ? `${istDate(picked.bookedAt)} ${istTime(picked.bookedAt, { hour: '2-digit', minute: '2-digit' })}` : '—'}</strong>
              </div>
            </div>
          )
        ) : (
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>
            Click any seat to see who booked it.
          </div>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SeatMapView;
