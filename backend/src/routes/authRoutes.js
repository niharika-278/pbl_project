import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import express from 'express';

const router = express.Router();

const loginValidations = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  body('role').optional().isIn(['admin', 'seller']),
];
router.post('/login', validate(loginValidations), authController.login);

const registerValidations = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password at least 6 characters'),
  body('role').optional().isIn(['admin', 'seller']),
];
router.post('/register', validate(registerValidations), authController.register);

router.post(
  '/forgot-password',
  validate([body('email').isEmail().normalizeEmail().withMessage('Valid email required')]),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Token required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password at least 6 characters'),
  ]),
  authController.resetPassword
);

router.get('/me', protect, authController.me);

export default router;
