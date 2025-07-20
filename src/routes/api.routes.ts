import express from 'express';
import { filters, filtersByAppName, getAllDate, getAllData } from '../controllers/filters.controller';

const router = express.Router();

router.get('/filters', filters);
router.get('/filteByAppName', filtersByAppName)
router.get('/getAllDate', getAllDate)
router.get('/getAllData', getAllData)

export default router;
