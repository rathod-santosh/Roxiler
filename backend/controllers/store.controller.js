const pool = require('../config/db');

// Get Store Owner Dashboard Details
exports.getStoreDashboard = async (req, res) => {
  const storeId = req.user.id;
  const { sortField, sortOrder } = req.query;

  try {
    // 1. Get average rating and count
    const [stats] = await pool.query(`
      SELECT 
        ROUND(IFNULL(AVG(rating), 0), 1) as averageRating,
        COUNT(*) as totalRatings
      FROM ratings
      WHERE store_id = ?
    `, [storeId]);

    // 2. Get list of users who submitted ratings, with sorting support
    let ratingsQuery = `
      SELECT 
        u.id as userId, u.name as userName, u.email as userEmail, u.address as userAddress,
        r.rating, r.updated_at as date
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = ?
    `;

    const validSortFields = ['name', 'email', 'rating', 'date'];
    const validSortOrders = ['ASC', 'DESC'];

    const actualSortField = validSortFields.includes(sortField) ? sortField : 'date';
    const actualSortOrder = validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Map frontend field to SQL field
    let sqlSortField = 'r.updated_at';
    if (actualSortField === 'name') sqlSortField = 'u.name';
    else if (actualSortField === 'email') sqlSortField = 'u.email';
    else if (actualSortField === 'rating') sqlSortField = 'r.rating';

    ratingsQuery += ` ORDER BY ${sqlSortField} ${actualSortOrder}`;

    const [ratings] = await pool.query(ratingsQuery, [storeId]);

    res.status(200).json({
      success: true,
      data: {
        averageRating: stats[0].averageRating,
        totalRatings: stats[0].totalRatings,
        ratings
      }
    });

  } catch (err) {
    console.error('Store dashboard error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while loading store dashboard.'
    });
  }
};
