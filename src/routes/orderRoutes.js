// src/routes/orderRoutes.js
import { Router } from 'express';
import { crearPedido, obtenerMisPedidos } from '../controllers/orderController.js';
import { proteger, esAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Crear pedido (cliente logueado)
router.post('/', proteger, crearPedido);

// Ver pedidos del usuario logueado
router.get('/mis-pedidos', proteger, obtenerMisPedidos);

// (Opcional) Ver todos los pedidos como admin
// router.get('/', proteger, esAdmin, obtenerTodosLosPedidos);

export default router;
