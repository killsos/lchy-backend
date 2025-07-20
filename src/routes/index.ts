import express from 'express';
import apiRoutes from './api.routes';
import csvRoutes from './upload.routes';
import healthRoutes from './health.routes';
const router = express.Router();

/* GET home page. */
router.get('/', function (_req, res, _next) {
  res.json({ message: 'Hello world' });
});

router.use('/api/', apiRoutes);
router.use('/upload', csvRoutes);
router.use('/', healthRoutes);

export default router;