import express from 'express';
import { healthCheck, connectionPoolStatus } from '../controllers/health.controller';

const router = express.Router();

// 基本健康检查
router.get('/health', healthCheck);

// 连接池状态检查
router.get('/health/pool', connectionPoolStatus);

export default router;