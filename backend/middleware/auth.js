const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const auth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' }); // This already handles missing token
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded || !decoded.userId) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const [users] = await req.pool.query(
            'SELECT id, email, full_name, is_admin, currency FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!users || users.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = {
            id: users[0].id,
            email: users[0].email,
            fullName: users[0].full_name,
            is_admin: users[0].is_admin,
            currency: users[0].currency
        };

        // Track activity (fire and forget)
        req.pool.query('UPDATE users SET last_active_at = NOW() WHERE id = ?', [req.user.id])
            .catch(err => console.error('Error updating last_active_at:', err));

        next();
    } catch (error) {
        console.error('Token verification error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        res.status(403).json({ error: 'Invalid token' });
    }
};

module.exports = auth;