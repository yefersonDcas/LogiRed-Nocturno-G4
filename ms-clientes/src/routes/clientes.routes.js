const { Router } = require('express');
const controller = require('../controllers/clientes.controller');
const { verificarToken, requiereRol } = require('../middlewares/auth');

const router = Router();
const accesoClientes = requiereRol('administrador', 'despacho');

router.use(verificarToken);
router.get('/', accesoClientes, controller.listar);
router.get('/:id', accesoClientes, controller.obtener);
router.post('/', accesoClientes, controller.crear);
router.put('/:id', accesoClientes, controller.actualizar);
router.delete('/:id', requiereRol('administrador'), controller.eliminar);

module.exports = router;
