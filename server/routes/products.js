const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// 상품 목록 조회 (모든 사용자 접근 가능)
router.get('/', productsController.getAllProducts);

// 단일 상품 조회 (모든 사용자 접근 가능)
router.get('/:id', productsController.getProductById);

// 상품 생성 (관리자만)
router.post('/', authenticate, requireAdmin, productsController.createProduct);

// 상품 수정 (관리자만)
router.put('/:id', authenticate, requireAdmin, productsController.updateProduct);

// 상품 삭제 (관리자만)
router.delete('/:id', authenticate, requireAdmin, productsController.deleteProduct);

module.exports = router;

