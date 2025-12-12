// src/routes/productRoutes.js
import { Router } from 'express';
import {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from '../controllers/productController.js';

import { proteger, esAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// 👇 Público: cualquiera puede ver productos
router.get('/', listarProductos);       // GET /api/products
router.get('/:id', obtenerProducto);    // GET /api/products/1

// 👇 Solo ADMIN: necesita token + rol admin
router.post('/', proteger, esAdmin, crearProducto);         // POST /api/products
router.put('/:id', proteger, esAdmin, actualizarProducto);  // PUT /api/products/1
router.delete('/:id', proteger, esAdmin, eliminarProducto); // DELETE /api/products/1

export default router;
