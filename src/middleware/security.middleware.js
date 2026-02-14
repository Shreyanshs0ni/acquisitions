import aj from '#config/arcjet.js';
import logger from '#config/logger.js';
import { tokenBucket } from '@arcjet/node';

const roleClients = {
  admin: aj.withRule(
    tokenBucket({
      mode: 'LIVE',
      refillRate: 20,
      interval: '1m',
      capacity: 20,
    })
  ),
  user: aj.withRule(
    tokenBucket({
      mode: 'LIVE',
      refillRate: 10,
      interval: '1m',
      capacity: 10,
    })
  ),
  guest: aj.withRule(
    tokenBucket({
      mode: 'LIVE',
      refillRate: 5,
      interval: '1m',
      capacity: 5,
    })
  ),
};

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';
    const client = roleClients[role] || roleClients.guest;

    console.log('IP:', req.ip); // 👈 put it here
    const decision = await client.protect(req, {
      requested: 1,
    });

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated requests are not allowed',
      });
    }
    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Request blocked by security policy',
      });
    }
    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('rate limit exceeded ', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res
        .status(403)
        .json({ error: 'Forbidden', message: 'Too many requests' });
    }

    next();
  } catch (e) {
    console.log('Arcjet middleware error:', e);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong with the security middleware',
    });
  }
};
export default securityMiddleware;
