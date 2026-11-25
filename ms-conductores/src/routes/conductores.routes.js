const { Router } = require('express');
const controller = require('../controllers/conductores.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();

// Permisos de LogiRed para conductores (tabla de roles del Taller 1):
// cualquier usuario autenticado consulta; solo administrador y flota gestionan.
const gestionaConductores = requiereRol('administrador', 'flota');

router.use(verificarToken);                          // todas las rutas exigen token (401)

router.get('/', controller.listar);                  // cualquier rol autenticado
router.get('/:id', controller.obtener);
router.post('/', gestionaConductores, controller.crear);          // otro rol: 403
router.put('/:id', gestionaConductores, controller.actualizar);
router.delete('/:id', gestionaConductores, controller.eliminar);

module.exports = router;
