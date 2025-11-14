const mongoose = require('mongoose');
const { Cart, Product } = require('../models');

// 사용자별 장바구니를 조회하거나 없으면 생성하는 헬퍼
const ensureCart = async (userId) => {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { new: true, upsert: true }
  );
  return cart;
};

// 공통 응답용 장바구니 데이터를 populate 해서 반환
const populateCart = async (cart) =>
  cart.populate({
    path: 'items.product',
    select: 'name price image sku category',
  });

// GET /api/cart - 현재 사용자 장바구니 조회
exports.getCart = async (req, res) => {
  try {
    const cart = await ensureCart(req.userId);
    await populateCart(cart);

    res.json({
      success: true,
      data: cart,
      meta: {
        totalQuantity: cart.totalQuantity,
        totalAmount: cart.totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니 조회에 실패했습니다.',
      error: error.message,
    });
  }
};

// POST /api/cart/items - 장바구니 항목 추가 또는 수량 합산
exports.addOrUpdateItem = async (req, res) => {
  try {
    const { productId, quantity = 1, priceSnapshot, checked } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: '유효한 상품 ID가 필요합니다.',
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: '수량은 1개 이상이어야 합니다.',
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    const cart = await ensureCart(req.userId);
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      if (checked !== undefined) {
        existingItem.checked = Boolean(checked);
      }
      if (priceSnapshot !== undefined) {
        existingItem.priceSnapshot = priceSnapshot;
      } else if (!existingItem.priceSnapshot) {
        existingItem.priceSnapshot = product.price;
      }
    } else {
      cart.items.push({
        product: productId,
        quantity,
        checked: checked !== undefined ? Boolean(checked) : true,
        priceSnapshot:
          priceSnapshot !== undefined ? priceSnapshot : product.price,
      });
    }

    await cart.save();
    await populateCart(cart);

    res.status(201).json({
      success: true,
      message: '장바구니에 상품이 추가되었습니다.',
      data: cart,
      meta: {
        totalQuantity: cart.totalQuantity,
        totalAmount: cart.totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니에 상품을 추가하지 못했습니다.',
      error: error.message,
    });
  }
};

// PATCH /api/cart/items/:productId - 장바구니 항목 수정
exports.updateItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, checked, priceSnapshot } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: '유효한 상품 ID가 필요합니다.',
      });
    }

    const cart = await ensureCart(req.userId);
    const item = cart.items.find(
      (entry) => entry.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: '장바구니에 해당 상품이 없습니다.',
      });
    }

    if (quantity !== undefined) {
      if (quantity <= 0) {
        cart.items = cart.items.filter(
          (entry) => entry.product.toString() !== productId
        );
      } else {
        item.quantity = quantity;
      }
    }

    if (checked !== undefined) {
      item.checked = Boolean(checked);
    }

    if (priceSnapshot !== undefined) {
      item.priceSnapshot = priceSnapshot;
    }

    await cart.save();
    await populateCart(cart);

    res.json({
      success: true,
      message: '장바구니 항목이 업데이트되었습니다.',
      data: cart,
      meta: {
        totalQuantity: cart.totalQuantity,
        totalAmount: cart.totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니 항목을 수정하지 못했습니다.',
      error: error.message,
    });
  }
};

// DELETE /api/cart/items/:productId - 특정 상품 제거
exports.removeItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: '유효한 상품 ID가 필요합니다.',
      });
    }

    const cart = await ensureCart(req.userId);
    const beforeCount = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    if (cart.items.length === beforeCount) {
      return res.status(404).json({
        success: false,
        message: '장바구니에 해당 상품이 없습니다.',
      });
    }

    await cart.save();
    await populateCart(cart);

    res.json({
      success: true,
      message: '장바구니에서 상품이 제거되었습니다.',
      data: cart,
      meta: {
        totalQuantity: cart.totalQuantity,
        totalAmount: cart.totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니에서 상품을 제거하지 못했습니다.',
      error: error.message,
    });
  }
};

// DELETE /api/cart - 장바구니 전체 비우기
exports.clearCart = async (req, res) => {
  try {
    const cart = await ensureCart(req.userId);
    cart.items = [];
    cart.status = 'active';
    cart.memo = undefined;

    await cart.save();
    await populateCart(cart);

    res.json({
      success: true,
      message: '장바구니가 비워졌습니다.',
      data: cart,
      meta: {
        totalQuantity: cart.totalQuantity,
        totalAmount: cart.totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니를 비우지 못했습니다.',
      error: error.message,
    });
  }
};

