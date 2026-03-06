// Legacy fallback price map. Prefer `calculateFoodCostFromDb` for accurate pricing.
const FOOD_PRICES = {
  1: 50, // Popcorn
  2: 30, // Soda
  3: 80, // Combo Meal
  4: 60, // Nachos
  5: 20  // Candy
};

const normalizeSelectedSeats = (selectedSeats) => {
  if (Array.isArray(selectedSeats)) {
    return selectedSeats;
  }
  return [];
};

const calculateFoodCost = (foodOrders = {}) => {
  if (!foodOrders || typeof foodOrders !== 'object') {
    return 0;
  }

  return Object.entries(foodOrders).reduce((total, [foodId, quantity]) => {
    const price = FOOD_PRICES[foodId] || 30;
    const qty = Number.isFinite(Number(quantity)) ? Number(quantity) : 0;
    return total + (price * qty);
  }, 0);
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
    SELECT f.id, f.price
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
      const price = Number(row.price);
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

const calculateSubtotal = (moviePrice, selectedSeats, foodOrders) => {
  const seats = normalizeSelectedSeats(selectedSeats);
  const numPeople = seats.length;
  const ticketTotal = (Number(moviePrice) || 0) * numPeople;
  const foodTotal = calculateFoodCost(foodOrders);
  return ticketTotal + foodTotal;
};

const calculateSubtotalFromDb = async (db, movieId, moviePrice, selectedSeats, foodOrders) => {
  const seats = normalizeSelectedSeats(selectedSeats);
  const numPeople = seats.length;
  const ticketPrice = Number(moviePrice);
  const ticketTotal = (Number.isFinite(ticketPrice) ? ticketPrice : 0) * numPeople;
  const foodTotal = await calculateFoodCostFromDb(db, movieId, foodOrders);
  return ticketTotal + foodTotal;
};

const getCouponDiscount = (db, couponCode, totalAmount) => {
  return new Promise((resolve, reject) => {
    if (!couponCode || !couponCode.trim()) {
      return resolve({ discount: 0, finalAmount: totalAmount, coupon: null });
    }

    const code = couponCode.trim().toUpperCase();
    const currentDate = new Date().toISOString().split('T')[0];

    db.get(
      `SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expiry_date IS NULL OR expiry_date >= ?)`,
      [code, currentDate],
      (err, coupon) => {
        if (err) {
          return reject({ status: 500, message: err.message });
        }

        if (!coupon) {
          return reject({ status: 400, message: 'Invalid or expired coupon code' });
        }

        if (coupon.usage_limit !== -1 && coupon.used_count >= coupon.usage_limit) {
          return reject({ status: 400, message: 'Coupon usage limit exceeded' });
        }

        if (totalAmount < coupon.min_purchase) {
          return reject({
            status: 400,
            message: `Minimum purchase amount of ₹${coupon.min_purchase} required for this coupon`
          });
        }

        let discount = 0;
        if (coupon.discount_type === 'percentage') {
          discount = (totalAmount * coupon.discount_value) / 100;
        } else {
          discount = coupon.discount_value;
        }

        if (coupon.max_discount && discount > coupon.max_discount) {
          discount = coupon.max_discount;
        }

        discount = Math.min(discount, totalAmount);

        const finalAmount = Math.max(0, totalAmount - discount);
        return resolve({ discount, finalAmount, coupon });
      }
    );
  });
};

module.exports = {
  FOOD_PRICES,
  calculateFoodCost,
  calculateFoodCostFromDb,
  calculateSubtotal,
  calculateSubtotalFromDb,
  getCouponDiscount
};
