import express from 'express';
import cors from 'cors';
import router from './routes';
import logger from './utils/logger';

const app = express();

// CORS配置
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// 中间件配置
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log('=== Request Info ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('IP:', req.ip);
  console.log('User-Agent:', req.get('User-Agent'));
  console.log('Content-Type:', req.get('Content-Type'));
  
  logger.info('请求信息', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// 安全头设置
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 导入router
app.use(router);

// 全局错误处理中间件
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('=== Global Error Handler ===');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('URL:', req.url);
  console.error('Method:', req.method);
  
  logger.error('服务器错误', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    details: err.message
  });
});

export default app;
