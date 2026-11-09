const { Router } = require('express');
const controller = require('../controllers/envios.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();
const accesoEnvios = requiereRol('administrador', 'despacho');

router.use(verificarToken);
router.get('/', accesoEnvios, controller.listar);
router.get('/:id', accesoEnvios, controller.obtener);
router.post('/', accesoEnvios, controller.crear);
router.put('/:id', accesoEnvios, controller.actualizar);
router.delete('/:id', requiereRol('administrador'), controller.eliminar);

module.exports = router;
