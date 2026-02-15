import express from 'express';
import { protect, requireRole } from '../middleware/auth.js';
import {
  uploadMiddleware,
  ingestCustomers,
  ingestInventory,
  ingestProducts,
  ingestSales,
} from '../controllers/ingestionController.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('admin', 'seller'));

router.post('/customers', uploadMiddleware, ingestCustomers);
router.post('/products', uploadMiddleware, ingestProducts);
router.post('/inventory', uploadMiddleware, ingestInventory);
router.post('/sales', uploadMiddleware, ingestSales);

export default router;
