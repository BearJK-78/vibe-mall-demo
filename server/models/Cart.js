const mongoose = require('mongoose');

// 장바구니에 담기는 개별 상품 항목 스키마
const cartItemSchema = new mongoose.Schema(
  {
    // 어떤 상품을 담았는지 Product 문서를 참조
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, '상품 정보는 필수입니다.'],
    },
    // 담긴 수량
    quantity: {
      type: Number,
      required: [true, '수량은 필수입니다.'],
      min: [1, '수량은 1개 이상이어야 합니다.'],
      default: 1,
    },
    // 장바구니 담을 당시의 상품 가격 스냅샷 (가격 변동 대비)
    priceSnapshot: {
      type: Number,
      min: [0, '가격 스냅샷은 0 이상이어야 합니다.'],
      default: 0,
    },
    // 구매 대상 여부 (체크박스 UI 대응)
    checked: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false } // 서브 문서에 별도의 ObjectId가 필요 없게 처리
);

// 사용자 단위 장바구니 스키마
const cartSchema = new mongoose.Schema(
  {
    // 장바구니 소유자
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '사용자 정보는 필수입니다.'],
    },
    // 장바구니에 담긴 상품 목록
    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: Array.isArray,
        message: '장바구니 항목은 배열이어야 합니다.',
      },
    },
    // 장바구니 상태 (active: 진행 중, converted: 주문으로 전환 완료)
    status: {
      type: String,
      enum: {
        values: ['active', 'converted'],
        message: '장바구니 상태는 active 또는 converted 여야 합니다.',
      },
      default: 'active',
    },
    // 유저가 입력한 메모
    memo: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt 자동 관리
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 사용자당 하나의 활성 장바구니만 존재하도록 유니크 인덱스
cartSchema.index({ user: 1 }, { unique: true });
// 상태별 조회를 위한 복합 인덱스
cartSchema.index({ user: 1, status: 1 });

// 장바구니 총 수량을 계산하는 가상 필드
cartSchema.virtual('totalQuantity').get(function totalQuantity() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// 장바구니 총 금액(스냅샷 기준)을 계산하는 가상 필드
cartSchema.virtual('totalAmount').get(function totalAmount() {
  return this.items.reduce(
    (sum, item) => sum + (item.priceSnapshot || 0) * item.quantity,
    0
  );
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;