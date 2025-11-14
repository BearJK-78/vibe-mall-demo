const express = require('express');
const router = express.Router();

// 기본 API 라우트
router.get('/', (req, res) => {
  res.json({ message: 'API 라우트가 정상적으로 작동합니다.' });
});

// 사용자 라우트
router.use('/users', require('./users'));

// 상품 라우트
router.use('/products', require('./products'));

// 장바구니 라우트
router.use('/cart', require('./cart'));

// 주문 라우트
router.use('/orders', require('./orders'));

module.exports = router;
