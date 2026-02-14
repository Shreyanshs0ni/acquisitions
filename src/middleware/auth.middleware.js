import { jwttoken } from '#utils/jwt.js';
import logger from '#config/logger.js';

export const authenticateToken = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const decoded = jwttoken.verify(token);
    req.user = decoded;
    next();
  } catch (e) {
    logger.error('Authentication failed', e);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireRole = roles => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};
