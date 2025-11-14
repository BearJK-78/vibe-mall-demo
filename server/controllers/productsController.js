const { Product } = require('../models');

// 전체 상품 조회
exports.getAllProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 2, 1);
    const skip = (page - 1) * limit;
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';

    const filter = keyword
      ? {
          $or: [
            { name: { $regex: keyword, $options: 'i' } },
            { sku: { $regex: keyword, $options: 'i' } },
            { category: { $regex: keyword, $options: 'i' } },
          ],
        }
      : {};

    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ]);

    const totalPages = Math.max(Math.ceil(totalProducts / limit), 1);

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems: totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        keyword: keyword || undefined,
      },
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 목록 조회에 실패했습니다.',
      error: error.message,
    });
  }
};

// 단일 상품 조회
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 조회에 실패했습니다.',
      error: error.message,
    });
  }
};

// 상품 생성
exports.createProduct = async (req, res) => {
  try {
    const { sku, name, price, category, image, description } = req.body;

    if (!sku || !name || price === undefined || !category || !image) {
      return res.status(400).json({
        success: false,
        message: 'sku, name, price, category, image는 필수입니다.',
      });
    }

    const existingProduct = await Product.findOne({ sku: sku.trim().toUpperCase() });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 SKU입니다.',
      });
    }

    const product = await Product.create({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      price,
      category,
      image: image.trim(),
      description: description ? description.trim() : undefined,
    });

    res.status(201).json({
      success: true,
      message: '상품이 성공적으로 생성되었습니다.',
      data: product,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: '유효성 검사에 실패했습니다.',
        errors: messages,
      });
    }

    if (error.code === 11000 || error.code === 11001) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 SKU입니다.',
      });
    }

    res.status(500).json({
      success: false,
      message: '상품 생성에 실패했습니다.',
      error: error.message,
    });
  }
};

// 상품 수정
exports.updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.sku) {
      updateData.sku = updateData.sku.trim().toUpperCase();
      const duplicateProduct = await Product.findOne({
        sku: updateData.sku,
        _id: { $ne: req.params.id },
      });

      if (duplicateProduct) {
        return res.status(400).json({
          success: false,
          message: '이미 존재하는 SKU입니다.',
        });
      }
    }

    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    if (updateData.image) {
      updateData.image = updateData.image.trim();
    }

    if (typeof updateData.description === 'string') {
      updateData.description = updateData.description.trim();
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
      context: 'query',
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '상품이 성공적으로 수정되었습니다.',
      data: product,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: '유효성 검사에 실패했습니다.',
        errors: messages,
      });
    }

    if (error.code === 11000 || error.code === 11001) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 SKU입니다.',
      });
    }

    res.status(500).json({
      success: false,
      message: '상품 수정에 실패했습니다.',
      error: error.message,
    });
  }
};

// 상품 삭제
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      message: '상품이 성공적으로 삭제되었습니다.',
      data: {
        id: product._id,
        sku: product.sku,
        name: product.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 삭제에 실패했습니다.',
      error: error.message,
    });
  }
};

