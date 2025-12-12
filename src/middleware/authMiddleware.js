// src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const proteger = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Debe venir: Authorization: Bearer token
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No autorizado, falta token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id, rol, iat, exp }
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ msg: 'Token inválido o expirado' });
  }
};

export const esAdmin = (req, res, next) => {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ msg: 'Acceso solo para administradores' });
  }
  next();
};
