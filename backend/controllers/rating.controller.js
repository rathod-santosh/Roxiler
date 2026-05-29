const pool = require('../config/db');

// List all registered stores with overall rating and user's own rating
exports.getStoresForUser = async (req, res) => {
  const userId = req.user.id;
  const { name, address, sortField, sortOrder } = req.query;

  try {
    let query = `
      SELECT 
        u.id, u.name, u.email, u.address,
        ROUND(IFNULL(avg_rating.rating, 0), 1) as overallRating,
        IFNULL(avg_rating.rating_count, 0) as ratingCount,
        user_rating.rating as userRating
      FROM users u
      LEFT JOIN (
        SELECT store_id, AVG(rating) as rating, COUNT(*) as rating_count 
        FROM ratings 
        GROUP BY store_id
      ) avg_rating ON u.id = avg_rating.store_id
      LEFT JOIN ratings user_rating ON u.id = user_rating.store_id AND user_rating.user_id = ?
      WHERE u.role = 'store_owner'
    `;

    const queryParams = [userId];

    if (name) {
      query += ' AND u.name LIKE ?';
      queryParams.push(`%${name}%`);
    }
    if (address) {
      query += ' AND u.address LIKE ?';
      queryParams.push(`%${address}%`);
    }

    // Support sorting
    const validSortFields = ['name', 'address', 'overallRating', 'userRating'];
    const validSortOrders = ['ASC', 'DESC'];

    const actualSortField = validSortFields.includes(sortField) ? sortField : 'name';
    const actualSortOrder = validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    if (actualSortField === 'overallRating') {
      query += ` ORDER BY overallRating ${actualSortOrder}`;
    } else if (actualSortField === 'userRating') {
      // Put unrated stores at the end
      query += ` ORDER BY CASE WHEN userRating IS NULL THEN 1 ELSE 0 END, userRating ${actualSortOrder}`;
    } else {
      query += ` ORDER BY u.${actualSortField} ${actualSortOrder}`;
    }

    const [stores] = await pool.query(query, queryParams);

    res.status(200).json({
      success: true,
      data: stores
    });

  } catch (err) {
    console.error('User get stores error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stores listing.'
    });
  }
};

// Submit or Modify Rating for a Store
exports.submitRating = async (req, res) => {
  const userId = req.user.id;
  const { storeId, rating } = req.body;

  try {
    // 1. Verify target store exists and is a store_owner
    const [stores] = await pool.query('SELECT id FROM users WHERE id = ? AND role = "store_owner"', [storeId]);
    if (stores.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'The selected store does not exist or is not registered.'
      });
    }

    // 2. Insert or update rating (portable for both SQLite and MySQL)
    const [existingRating] = await pool.query(
      'SELECT id FROM ratings WHERE user_id = ? AND store_id = ?',
      [userId, storeId]
    );

    if (existingRating.length > 0) {
      // Update existing rating
      await pool.query(
        'UPDATE ratings SET rating = ? WHERE user_id = ? AND store_id = ?',
        [rating, userId, storeId]
      );
    } else {
      // Insert new rating
      await pool.query(
        'INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)',
        [userId, storeId, rating]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully!'
    });

  } catch (err) {
    console.error('Submit rating error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting your rating.'
    });
  }
};
