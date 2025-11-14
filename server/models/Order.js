const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    variant: {
      type: String,
      trim: true,
    },
    skuId: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, '상품 수량은 최소 1개 이상이어야 합니다.'],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, '상품 단가는 0 이상이어야 합니다.'],
    },
    lineTotal: {
      type: Number,
      required: true,
      min: [0, '상품 합계는 0 이상이어야 합니다.'],
    },
  },
  {
    _id: false,
  }
);

const OrderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: [true, '주문 번호는 필수입니다.'],
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'paid', 'shipped', 'completed', 'cancelled'],
        message: '유효하지 않은 주문 상태입니다.',
      },
      default: 'pending',
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    payment: {
      method: {
        type: String,
        required: [true, '결제 수단은 필수입니다.'],
        trim: true,
      },
      amount: {
        type: Number,
        required: [true, '결제 금액은 필수입니다.'],
        min: [0, '결제 금액은 0 이상이어야 합니다.'],
      },
      paidAt: {
        type: Date,
      },
      transactionId: {
        type: String,
        trim: true,
      },
    },
    recipient: {
      name: {
        type: String,
        required: [true, '수령인 이름은 필수입니다.'],
        trim: true,
      },
      contactNumber: {
        type: String,
        required: [true, '수령인 연락처는 필수입니다.'],
        trim: true,
      },
    },
    address: {
      postalCode: {
        type: String,
        required: [true, '우편번호는 필수입니다.'],
        trim: true,
      },
      address1: {
        type: String,
        required: [true, '주소는 필수입니다.'],
        trim: true,
      },
      address2: {
        type: String,
        trim: true,
      },
    },
    deliveryMessage: {
      type: String,
      trim: true,
    },
    delivery: {
      provider: {
        type: String,
        trim: true,
      },
      trackingNumber: {
        type: String,
        trim: true,
      },
      shippedDate: {
        type: Date,
      },
      deliveredDate: {
        type: Date,
      },
    },
    items: {
      type: [OrderItemSchema],
      validate: [
        (items) => Array.isArray(items) && items.length > 0,
        '주문 상품은 최소 1개 이상이어야 합니다.',
      ],
    },
    discounts: {
      couponCode: {
        type: String,
        trim: true,
      },
      couponDiscount: {
        type: Number,
        default: 0,
        min: [0, '할인 금액은 0 이상이어야 합니다.'],
      },
      usedPoints: {
        type: Number,
        default: 0,
        min: [0, '사용 포인트는 0 이상이어야 합니다.'],
      },
    },
    grandTotal: {
      type: Number,
      required: [true, '총 결제 금액은 필수입니다.'],
      min: [0, '총 결제 금액은 0 이상이어야 합니다.'],
    },
    earnedPoints: {
      type: Number,
      default: 0,
      min: [0, '적립 포인트는 0 이상이어야 합니다.'],
    },
    history: [
      {
        status: {
          type: String,
          required: true,
          trim: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
        changedBy: {
          type: String,
          trim: true,
        },
        memo: {
          type: String,
          trim: true,
        },
      },
    ],
    notes: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
      default: 'web',
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

OrderSchema.index({ orderId: 1 }, { unique: true });
OrderSchema.index({ userId: 1, orderDate: -1 });

module.exports = mongoose.model('Order', OrderSchema);

