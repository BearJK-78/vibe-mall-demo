const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticate } = require('../middleware/auth');

// 모든 사용자 조회 (GET /api/users)
router.get('/', usersController.getAllUsers);

// 토큰으로 현재 사용자 정보 조회 (GET /api/users/me)
// 이 라우트는 /:id 라우트보다 먼저 와야 함
router.get('/me', authenticate, usersController.getCurrentUser);

// 특정 사용자 조회 (GET /api/users/:id)
router.get('/:id', usersController.getUserById);

// 새 사용자 생성 (POST /api/users)
router.post('/', usersController.createUser);

// 사용자 로그인 (POST /api/users/login)
router.post('/login', usersController.loginUser);

// 사용자 정보 수정 (PUT /api/users/:id)
router.put('/:id', usersController.updateUser);

// 사용자 정보 부분 수정 (PATCH /api/users/:id)
router.patch('/:id', usersController.patchUser);

// 사용자 삭제 (DELETE /api/users/:id)
router.delete('/:id', usersController.deleteUser);

module.exports = router;

