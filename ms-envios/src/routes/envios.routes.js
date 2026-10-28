const { Router } = require('express');
const controller = require('../controllers/envios.controller');

const router = Router();
// Taller 1: listar, consultar por id y crear.
router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);

module.exports = router;
