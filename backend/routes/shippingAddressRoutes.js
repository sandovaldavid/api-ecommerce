import express from 'express';
import {createShippingAddress, getShippingAddressesByUserId} from '../controllers/shippingAddressController.js';

const router = express.Router();

router.post('/', createShippingAddress);
router.get('/:usuario_id', getShippingAddressesByUserId);

export default router;
