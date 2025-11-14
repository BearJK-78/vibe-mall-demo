import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../utils/api';
import './AdminProductListPage.css';

const AdminProductListPage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const user = outletContext?.user ?? null;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 2,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [deletingId, setDeletingId] = useState(null);

  const LIMIT = 2;

  useEffect(() => {
    // 관리자가 아닌 경우 관리자 페이지로 리다이렉트
    if (outletContext?.userLoading === false && user?.user_type !== 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, outletContext?.userLoading, navigate]);

  // 관리자가 아니면 아무것도 렌더링하지 않음
  if (user?.user_type !== 'admin') {
    return null;
  }

  const fetchProducts = useCallback(async (pageParam = 1, keyword = '') => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/products', {
        params: {
          page: pageParam,
          limit: LIMIT,
          keyword: keyword.trim() || undefined,
        },
      });

      if (data?.success) {
        const nextPagination =
          data.pagination || {
            page: pageParam,
            limit: LIMIT,
            totalPages: 1,
            totalItems: 0,
            hasNextPage: false,
            hasPrevPage: pageParam > 1,
          };

        if (pageParam > nextPagination.totalPages && nextPagination.totalPages >= 1) {
          setPage(nextPagination.totalPages);
          return;
        }

        setProducts(data.data || []);
        setPagination(nextPagination);
      } else {
        setError('상품 목록을 불러오는 데 실패했습니다.');
      }
    } catch (fetchError) {
      const message =
        fetchError.response?.data?.message ||
        fetchError.response?.data?.error ||
        '상품 목록을 불러오는 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(page, searchTerm);
  }, [fetchProducts, page, searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  const handleCreateClick = () => {
    navigate('/admin/products/new');
  };

  const handleBackToDashboard = () => {
    navigate('/admin');
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeletingId(productId);
      await api.delete(`/api/products/${productId}`);
      fetchProducts(page, searchTerm);
    } catch (deleteError) {
      const message =
        deleteError.response?.data?.message ||
        deleteError.response?.data?.error ||
        '상품 삭제에 실패했습니다.';
      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (productId) => {
    navigate(`/admin/products/${productId}/edit`);
  };

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      setPage((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="admin-product-page">
      <header className="admin-product-header">
        <button type="button" className="admin-product-back" onClick={handleBackToDashboard}>
          ← 대시보드로
        </button>
        <div className="admin-product-title">
          <h1>상품 관리</h1>
          <p>등록된 상품을 확인하고 빠르게 관리하세요.</p>
        </div>
        <button type="button" className="admin-product-create-button" onClick={handleCreateClick}>
          <span aria-hidden="true">＋</span> 새 상품 등록
        </button>
      </header>

      <div className="admin-product-tabs">
        <button type="button" className="admin-product-tab active">
          상품 목록
        </button>
        <button type="button" className="admin-product-tab" onClick={handleCreateClick}>
          상품 등록
        </button>
      </div>

      <div className="admin-product-toolbar">
        <div className="admin-product-search">
          <span className="icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="search"
            placeholder="상품명, SKU 또는 카테고리로 검색..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <button type="button" className="admin-product-filter">
          <span aria-hidden="true">⛃</span> 필터
        </button>
      </div>

      {error && <div className="admin-product-alert admin-product-alert-error">{error}</div>}

      <section className="admin-product-table-wrapper">
        <header className="admin-product-table-head">
          <span>이미지</span>
          <span>상품명</span>
          <span>카테고리</span>
          <span>가격</span>
          <span>등록일</span>
          <span>액션</span>
        </header>

        {loading ? (
          <div className="admin-product-empty">상품 정보를 불러오는 중입니다...</div>
        ) : products.length === 0 ? (
          <div className="admin-product-empty">조건에 맞는 상품이 없습니다.</div>
        ) : (
          <ul className="admin-product-list">
            {products.map((product) => (
              <li 
                key={product._id} 
                className="admin-product-row"
                onClick={(e) => {
                  // 액션 버튼 클릭 시에는 상세 페이지로 이동하지 않음
                  if (e.target.closest('.admin-product-actions')) {
                    return;
                  }
                  navigate(`/products/${product._id}`);
                }}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!e.target.closest('.admin-product-actions')) {
                      navigate(`/products/${product._id}`);
                    }
                  }
                }}
              >
                <div className="admin-product-image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <span aria-hidden="true">🖼️</span>
                  )}
                </div>
                <div className="admin-product-info">
                  <p className="admin-product-name">{product.name}</p>
                  <p className="admin-product-sku">SKU: {product.sku}</p>
                </div>
                <div className="admin-product-category">{product.category}</div>
                <div className="admin-product-price">₩{product.price?.toLocaleString()}</div>
                <div className="admin-product-date">
                  {product.createdAt
                    ? new Date(product.createdAt).toLocaleDateString('ko-KR')
                    : '-'}
                </div>
                <div className="admin-product-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="admin-product-action edit"
                    onClick={() => handleEdit(product._id)}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="admin-product-action delete"
                    onClick={() => handleDelete(product._id)}
                    disabled={deletingId === product._id}
                  >
                    {deletingId === product._id ? '…' : '🗑️'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="admin-product-pagination">
        <div className="admin-product-pagination-info">
          페이지 {pagination.page} / {pagination.totalPages} · 총 {pagination.totalItems}개
        </div>
        <div className="admin-product-pagination-controls">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={!pagination.hasPrevPage || loading}
          >
            이전
          </button>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={!pagination.hasNextPage || loading}
          >
            다음
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AdminProductListPage;

