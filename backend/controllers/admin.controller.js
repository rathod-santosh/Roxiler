const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Get Dashboard Statistics
exports.getStats = async (req, res) => {
  try {
    const [userRes] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = "user"');
    const [storeRes] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = "store_owner"');
    const [ratingRes] = await pool.query('SELECT COUNT(*) as total FROM ratings');
    const [adminRes] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = "admin"');

    res.status(200).json({
      success: true,
      data: {
        totalUsers: userRes[0].total,
        totalStores: storeRes[0].total,
        totalRatings: ratingRes[0].total,
        totalAdmins: adminRes[0].total
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics.'
    });
  }
};

// Add New User (admin, user, or store_owner)
exports.addUser = async (req, res) => {
  const { name, email, password, address, role } = req.body;

  try {
    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, address, role]
    );

    res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} added successfully!`,
      data: {
        id: result.insertId,
        name,
        email,
        address,
        role
      }
    });

  } catch (err) {
    console.error('Admin add user error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while adding the user.'
    });
  }
};

// Get List of Stores (role = store_owner) with overall average ratings
exports.getStores = async (req, res) => {
  try {
    // Support filtering parameters
    const { name, email, address, sortField, sortOrder } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.address, u.role, u.created_at,
        ROUND(IFNULL(AVG(r.rating), 0), 1) as rating,
        COUNT(r.id) as rating_count
      FROM users u
      LEFT JOIN ratings r ON u.id = r.store_id
      WHERE u.role = 'store_owner'
    `;

    const queryParams = [];

    if (name) {
      query += ' AND u.name LIKE ?';
      queryParams.push(`%${name}%`);
    }
    if (email) {
      query += ' AND u.email LIKE ?';
      queryParams.push(`%${email}%`);
    }
    if (address) {
      query += ' AND u.address LIKE ?';
      queryParams.push(`%${address}%`);
    }

    query += ' GROUP BY u.id';

    // Support sorting
    const validSortFields = ['name', 'email', 'address', 'rating', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const actualSortField = validSortFields.includes(sortField) ? sortField : 'name';
    const actualSortOrder = validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    // Average rating sorting has to be handled carefully due to alias
    if (actualSortField === 'rating') {
      query += ` ORDER BY rating ${actualSortOrder}`;
    } else {
      query += ` ORDER BY u.${actualSortField} ${actualSortOrder}`;
    }

    const [stores] = await pool.query(query, queryParams);

    res.status(200).json({
      success: true,
      data: stores
    });
  } catch (err) {
    console.error('Admin get stores error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching stores.'
    });
  }
};

// Get List of Users (role = admin or user)
exports.getUsers = async (req, res) => {
  try {
    const { name, email, address, role, sortField, sortOrder } = req.query;

    let query = 'SELECT id, name, email, address, role, created_at FROM users WHERE role IN ("admin", "user")';
    const queryParams = [];

    if (name) {
      query += ' AND name LIKE ?';
      queryParams.push(`%${name}%`);
    }
    if (email) {
      query += ' AND email LIKE ?';
      queryParams.push(`%${email}%`);
    }
    if (address) {
      query += ' AND address LIKE ?';
      queryParams.push(`%${address}%`);
    }
    if (role) {
      query += ' AND role = ?';
      queryParams.push(role);
    }

    // Support sorting
    const validSortFields = ['name', 'email', 'address', 'role', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];

    const actualSortField = validSortFields.includes(sortField) ? sortField : 'name';
    const actualSortOrder = validSortOrders.includes(sortOrder?.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    query += ` ORDER BY ${actualSortField} ${actualSortOrder}`;

    const [users] = await pool.query(query, queryParams);

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users.'
    });
  }
};

// Get Details of a User (works for any role, displays rating if Store Owner)
exports.getUserDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const [users] = await pool.query('SELECT id, name, email, address, role, created_at FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const user = users[0];

    // If user is store owner, fetch average rating and submitted ratings details
    if (user.role === 'store_owner') {
      const [ratingStats] = await pool.query(`
        SELECT 
          ROUND(IFNULL(AVG(rating), 0), 1) as average_rating,
          COUNT(*) as total_ratings
        FROM ratings 
        WHERE store_id = ?
      `, [id]);

      const [ratingLogs] = await pool.query(`
        SELECT 
          r.id, r.rating, r.updated_at,
          u.name as user_name, u.email as user_email
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.store_id = ?
        ORDER BY r.updated_at DESC
      `, [id]);

      user.storeStats = {
        averageRating: ratingStats[0].average_rating,
        totalRatings: ratingStats[0].total_ratings,
        ratings: ratingLogs
      };
    } else if (user.role === 'user') {
      // Normal user: fetch ratings they have submitted
      const [submittedRatings] = await pool.query(`
        SELECT 
          r.id, r.rating, r.updated_at,
          s.name as store_name, s.email as store_email
        FROM ratings r
        JOIN users s ON r.store_id = s.id
        WHERE r.user_id = ?
        ORDER BY r.updated_at DESC
      `, [id]);

      user.userStats = {
        totalRatingsSubmitted: submittedRatings.length,
        ratings: submittedRatings
      };
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (err) {
    console.error('Admin get user details error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user details.'
    });
  }
};
