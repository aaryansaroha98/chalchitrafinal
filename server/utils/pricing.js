const normalizeSelectedSeats = (selectedSeats) => {
  if (Array.isArray(selectedSeats)) {
    return selectedSeats;
  }
  return [];
};

const normalizeFoodOrders = (foodOrders) => {
  if (!foodOrders || typeof foodOrders !== 'object' || Array.isArray(foodOrders)) {
    return {};
  }

  const normalized = {};
  Object.entries(foodOrders).forEach(([rawFoodId, rawQty]) => {
    const foodId = Number.parseInt(rawFoodId, 10);
    if (!Number.isInteger(foodId) || foodId <= 0) return;

    const qtyNumber = Number(rawQty);
    if (!Number.isFinite(qtyNumber)) return;
    const qty = Math.floor(qtyNumber);
    if (qty <= 0) return;

    const safeQty = Math.min(qty, 20);
    normalized[foodId] = (normalized[foodId] || 0) + safeQty;
  });

  return normalized;
};

const calculateFoodCostFromDb = (db, movieId, foodOrders) => new Promise((resolve, reject) => {
  if (!db) return reject({ status: 500, message: 'Database not available' });

  const normalizedOrders = normalizeFoodOrders(foodOrders);
  const foodIds = Object.keys(normalizedOrders).map((id) => Number.parseInt(id, 10)).filter(Boolean);
  if (foodIds.length === 0) {
    return resolve(0);
  }

  const placeholders = foodIds.map(() => '?').join(',');
  const query = `
    SELECT f.id, f.price, mf.is_free
    FROM foods f
    JOIN movie_foods mf ON mf.food_id = f.id
    WHERE mf.movie_id = ?
      AND f.is_available = 1
      AND f.id IN (${placeholders})
  `;

  db.all(query, [movieId, ...foodIds], (err, rows) => {
    if (err) return reject({ status: 500, message: err.message });

    const priceById = new Map();
    (rows || []).forEach((row) => {
      // If food is marked as free for this movie, price is 0
      const price = row.is_free ? 0 : Number(row.price);
      priceById.set(Number(row.id), Number.isFinite(price) ? price : 0);
    });

    const missing = foodIds.filter((id) => !priceById.has(id));
    if (missing.length > 0) {
      return reject({ status: 400, message: 'Invalid food selection' });
    }

    const total = foodIds.reduce((sum, id) => {
      const price = priceById.get(id) || 0;
      const qty = normalizedOrders[id] || 0;
      return sum + (price * qty);
    }, 0);

    resolve(total);
  });
});

const calculateSubtotalFromDb = async (db, movieId, moviePrice, selectedSeats, foodOrders) => {
  const seats = normalizeSelectedSeats(selectedSeats);
  const numPeople = seats.length;
  const ticketPrice = Number(moviePrice);
  const ticketTotal = (Number.isFinite(ticketPrice) ? ticketPrice : 0) * numPeople;
  const foodTotal = await calculateFoodCostFromDb(db, movieId, foodOrders);
  return ticketTotal + foodTotal;
};

module.exports = {
  normalizeSelectedSeats,
  normalizeFoodOrders,
  calculateFoodCostFromDb,
  calculateSubtotalFromDb
};
