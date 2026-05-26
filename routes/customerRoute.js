import express from 'express';
import { 
  createCustomer, 
  getCustomers, 
  getCustomerById, 
  deleteCustomer,
  searchCustomer,
  updateMeasurements,
  updateCustomer
} from '../controllers/CustomerController.js';
import { protect } from '../middleware/auth.js';
import { upload, uploadToGCS } from '../config/storage.js';

const router = express.Router();

router.route('/')
  .post(protect, upload.single('profileImage'), uploadToGCS, createCustomer)
  .get(protect, getCustomers);

router.get('/search', protect, searchCustomer);

router.route('/:id')
  .get(protect, getCustomerById)
  .put(protect, upload.single('profileImage'), uploadToGCS, updateCustomer)
  .delete(protect, deleteCustomer);

router.put('/:id/measurements', protect, updateMeasurements);

export default router;
