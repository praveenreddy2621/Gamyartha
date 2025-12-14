const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
    // The auth middleware should have already populated req.user
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

module.exports = verifyAdmin;
