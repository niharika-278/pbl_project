import express from 'express';
import { body } from 'express-validator';
import { protect, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as checkoutController from '../controllers/checkoutController.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('admin', 'seller'));

router.get('/customers', checkoutController.getCustomers);
router.get('/customers/search', checkoutController.searchCustomers);
const customerValidations = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('phone').optional().trim(),
  body('email').optional().isEmail().trim(),
  body('zip_code').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('unique_id').optional().trim(),
];
router.post('/customers', validate(customerValidations), checkoutController.createCustomer);
router.get('/products', checkoutController.getProducts);
const orderValidations = [
  body('customerId').isInt().withMessage('Valid customerId required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.productId').isInt().withMessage('Valid productId required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
];
router.post('/orders', validate(orderValidations), checkoutController.createOrder);

export default router;
