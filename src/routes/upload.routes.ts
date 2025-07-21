import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { addCsv, upload } from '../controllers/uploadCsv.controller';

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMiddleware = multer({ 
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传CSV文件'));
    }
  }
});

const router = Router();

// 添加multer错误处理中间件
const handleMulterError = (error: any, req: any, res: any, next: any) => {
  console.error('=== Multer Error ===');
  console.error('Error:', error);
  
  if (error instanceof multer.MulterError) {
    console.error('Multer specific error:', error.code, error.message);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: '文件大小超过限制，最大支持5MB'
      });
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: '意外的文件字段'
      });
    }
  }
  
  if (error.message === '只允许上传CSV文件') {
    return res.status(400).json({
      success: false,
      error: '只允许上传CSV文件'
    });
  }
  
  console.error('Unknown multer error:', error.message);
  res.status(500).json({
    success: false,
    error: '文件上传失败',
    details: error.message
  });
};

// 请求调试中间件
const debugRequest = (req: any, res: any, next: any) => {
  console.log('=== Upload Request Debug ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Content-Type:', req.headers['content-type']);
  next();
};

// 简单测试端点
router.post('/test', (req, res) => {
  console.log('=== Test POST endpoint reached ===');
  res.json({ success: true, message: 'POST route works' });
});

router.get('/', addCsv);
router.post('/csv', debugRequest, (req, res, next) => {
  uploadMiddleware.single('file')(req, res, (err) => {
    if (err) {
      handleMulterError(err, req, res, next);
    } else {
      next();
    }
  });
}, upload);

export default router;