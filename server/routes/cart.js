const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

// 현재 사용자 장바구니 조회
router.get('/', authenticate, cartController.getCart);

// 장바구니에 상품 추가 또는 수량 증가
router.post('/items', authenticate, cartController.addOrUpdateItem);

// 장바구니 항목 수정 (수량/체크 상태 등)
router.patch('/items/:productId', authenticate, cartController.updateItem);

// 장바구니에서 특정 상품 제거
router.delete('/items/:productId', authenticate, cartController.removeItem);

// 장바구니 전체 비우기
router.delete('/', authenticate, cartController.clearCart);

module.exports = router;

