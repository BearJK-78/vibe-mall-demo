const mongoose = require('mongoose');
const axios = require('axios');
const { Order, Cart } = require('../models');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const buildOrderHistoryEntry = (status, changedBy = 'system', memo) => ({
  status,
  changedBy,
  memo,
  changedAt: new Date(),
});

const PORTONE_API_BASE_URL = 'https://api.iamport.kr';

const getPortoneAccessToken = async () => {
  const apiKey = process.env.PORTONE_API_KEY;
  const apiSecret = process.env.PORTONE_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('PortOne API 키/시크릿이 설정되지 않았습니다.');
  }

  const response = await axios.post(`${PORTONE_API_BASE_URL}/users/getToken`, {
    imp_key: apiKey,
    imp_secret: apiSecret,
  });

  const token = response.data?.response?.access_token;

  if (!token) {
    throw new Error('PortOne 액세스 토큰 발급에 실패했습니다.');
  }

  return token;
};

const verifyPaymentWithPortone = async ({ transactionId, expectedAmount, expectedMerchantUid }) => {
  if (!transactionId) {
    throw new Error('결제 고유번호(imp_uid)가 필요합니다.');
  }

  const accessToken = await getPortoneAccessToken();

  const response = await axios.get(`${PORTONE_API_BASE_URL}/payments/${transactionId}`, {
    headers: { Authorization: accessToken },
  });

  const paymentData = response.data?.response;

  if (!paymentData) {
    throw new Error('PortOne에서 결제 정보를 찾을 수 없습니다.');
  }

  if (expectedMerchantUid && paymentData.merchant_uid !== expectedMerchantUid) {
    throw new Error('결제와 주문 번호가 일치하지 않습니다.');
  }

  if (typeof expectedAmount === 'number' && paymentData.amount !== expectedAmount) {
    throw new Error('결제 금액이 요청 금액과 일치하지 않습니다.');
  }

  if (paymentData.status !== 'paid') {
    throw new Error('해당 결제가 완료 상태가 아닙니다.');
  }

  return paymentData;
};

const clearOrderedItemsFromCart = async (userId, items = []) => {
  if (!userId || !Array.isArray(items) || items.length === 0) {
    return;
  }

  const productIds = items
    .map((item) => {
      try {
        return new mongoose.Types.ObjectId(item.productId);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean);

  if (productIds.length === 0) {
    return;
  }

  await Cart.updateOne(
    { user: userId },
    {
      $pull: { items: { product: { $in: productIds } } },
      $set: { status: 'active', memo: undefined },
    }
  );
};

exports.createOrder = async (req, res) => {
  try {
    const {
      orderId,
      userId,
      items,
      payment,
      recipient,
      address,
      deliveryMessage,
      discounts,
      grandTotal,
      earnedPoints,
      source,
      ipAddress,
      userAgent,
    } = req.body;

    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: '주문 번호와 주문 상품은 필수입니다.',
      });
    }

    if (userId && !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: '유효한 사용자 ID가 필요합니다.',
      });
    }

    if (!payment || !payment.transactionId) {
      return res.status(400).json({
        success: false,
        message: '결제 검증을 위해 transactionId(imp_uid)가 필요합니다.',
      });
    }

    const duplicateOrder = await Order.findOne({
      $or: [
        { orderId },
        { 'payment.transactionId': payment.transactionId },
      ],
    });

    if (duplicateOrder) {
      return res.status(409).json({
        success: false,
        message: '이미 처리된 주문입니다.',
      });
    }

    let verifiedPayment;
    try {
      verifiedPayment = await verifyPaymentWithPortone({
        transactionId: payment.transactionId,
        expectedAmount: grandTotal ?? payment.amount,
        expectedMerchantUid: orderId,
      });
    } catch (verificationError) {
      return res.status(400).json({
        success: false,
        message: verificationError.message || '결제 검증에 실패했습니다.',
      });
    }

    const normalizedPayment = {
      method: verifiedPayment.pay_method || payment.method || 'card',
      amount: verifiedPayment.amount,
      paidAt: verifiedPayment.paid_at ? new Date(verifiedPayment.paid_at * 1000) : new Date(),
      transactionId: verifiedPayment.imp_uid,
    };

    const initialStatus = verifiedPayment.status === 'paid' ? 'paid' : 'pending';

    const order = await Order.create({
      orderId,
      userId: userId || req.userId,
      status: initialStatus,
      items,
      payment: normalizedPayment,
      recipient,
      address,
      deliveryMessage,
      discounts,
      grandTotal: grandTotal ?? verifiedPayment.amount,
      earnedPoints,
      source,
      ipAddress: ipAddress || req.ip,
      userAgent: userAgent || req.headers['user-agent'],
      history: [buildOrderHistoryEntry(initialStatus, req.userId || 'system')],
    });

    res.status(201).json({
      success: true,
      message: '주문이 생성되었습니다.',
      data: order,
    });

    await clearOrderedItemsFromCart(order.userId, order.items);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '주문 생성에 실패했습니다.',
      error: error.message,
    });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    // 관리자가 아닌 경우에만 해당 사용자의 주문만 조회
    // 관리자는 모든 주문을 조회할 수 있음
    const isAdmin = req.user?.user_type === 'admin';
    
    if (!isAdmin && req.userId) {
      filter.userId = req.userId;
    } else if (req.query.userId) {
      // 쿼리 파라미터로 userId가 제공된 경우 (관리자가 특정 사용자 주문 조회)
      if (!isValidObjectId(req.query.userId)) {
        return res.status(400).json({
          success: false,
          message: '유효한 사용자 ID가 필요합니다.',
        });
      }
      filter.userId = req.query.userId;
    }

    if (status) {
      filter.status = status;
    }

    // 주문 조회 시 product 정보와 userId 정보 populate
    const orders = await Order.find(filter)
      .populate('items.productId', 'name image price sku category')
      .populate('userId', 'name email')
      .sort({ orderDate: -1 });

    // populate된 product 정보를 items에 포함
    const ordersWithProductInfo = orders.map((order) => {
      const orderObj = order.toObject();
      if (orderObj.items) {
        orderObj.items = orderObj.items.map((item) => {
          const populatedItem = { ...item };
          if (item.productId && typeof item.productId === 'object') {
            populatedItem.productImage = item.productId.image;
            populatedItem.productName = item.productName || item.productId.name;
            populatedItem.product = item.productId;
          }
          return populatedItem;
        });
      }
      return orderObj;
    });

    res.json({
      success: true,
      data: ordersWithProductInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '주문 목록을 불러오지 못했습니다.',
      error: error.message,
    });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({ orderId: id }) || (isValidObjectId(id) && await Order.findById(id));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '주문 상세를 가져오지 못했습니다.',
      error: error.message,
    });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, memo } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '변경할 주문 상태가 필요합니다.',
      });
    }

    const order = await Order.findOne(
      { orderId: id },
      null,
      { lean: false }
    ) || (isValidObjectId(id) && await Order.findById(id));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.',
      });
    }

    order.status = status;
    order.history.push(buildOrderHistoryEntry(status, req.userId || 'system', memo));

    if (status === 'paid' && !order.payment.paidAt) {
      order.payment.paidAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: '주문 상태가 업데이트되었습니다.',
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '주문 상태를 변경하지 못했습니다.',
      error: error.message,
    });
  }
};


