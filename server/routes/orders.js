const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// 주문 목록 조회 - 인증 필요 (일반 사용자는 자신의 주문만, 관리자는 모든 주문)
router.get('/', authenticate, ordersController.getOrders);
router.post('/', ordersController.createOrder);
router.get('/:id', ordersController.getOrderById);
// 주문 상태 업데이트 - 관리자만 가능
router.patch('/:id/status', authenticate, requireAdmin, ordersController.updateOrderStatus);

module.exports = router;

