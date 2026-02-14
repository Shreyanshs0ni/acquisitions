import logger from '#config/logger.js';
import {
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/users.service.js';
import {
  userIdSchema,
  updateUserSchema,
} from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users');
    const allUsers = await getAllUsers();
    res.json({
      message: 'All users found',
      users: allUsers,
      count: allUsers.length,
    });
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    logger.info(`Getting user by id: ${id}`);

    const user = await getUserByIdService(parseInt(id, 10));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User found',
      user,
    });
  } catch (e) {
    logger.error('Error getting user by id', e);
    next(e);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const idValidation = userIdSchema.safeParse(req.params);

    if (!idValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idValidation.error),
      });
    }

    const bodyValidation = updateUserSchema.safeParse(req.body);

    if (!bodyValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyValidation.error),
      });
    }

    const { id } = idValidation.data;
    const updates = bodyValidation.data;
    const targetUserId = parseInt(id, 10);

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Users can only update their own information unless they are admin
    if (req.user.id !== targetUserId && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Forbidden: You can only update your own information' });
    }

    // Only admins can change roles
    if (updates.role && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Forbidden: Only admins can change user roles' });
    }

    logger.info(`Updating user: ${id}`);

    const user = await updateUserService(targetUserId, updates);

    res.json({
      message: 'User updated successfully',
      user,
    });
  } catch (e) {
    logger.error('Error updating user', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }

    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    const targetUserId = parseInt(id, 10);

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Users can only delete their own account unless they are admin
    if (req.user.id !== targetUserId && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Forbidden: You can only delete your own account' });
    }

    logger.info(`Deleting user: ${id}`);

    const deleted = await deleteUserService(targetUserId);

    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deleted successfully',
    });
  } catch (e) {
    logger.error('Error deleting user', e);
    next(e);
  }
};
