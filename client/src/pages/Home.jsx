import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../utils/api';
import HomeFooter from '../components/HomeFooter';
import { HIGHLIGHT_COLLECTIONS, CATEGORIES } from '../data/products';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const user = outletContext?.user ?? null;
  const [productSections, setProductSections] = useState([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState('');

  const isLoggedIn = !!user;
  const isAdmin = user?.user_type === 'admin';

  const formatPrice = useCallback(
    (value) => {
      if (value === null || value === undefined) return '가격 정보 없음';
      return `${value.toLocaleString('ko-KR')}원`;
    },
    []
  );

  const buildSections = useCallback((items) => {
    if (!Array.isArray(items)) return [];

    const CATEGORY_META = {
      상의: {
        id: 'tops',
        title: '금주 인기 상의',
        subtitle: '스타일과 보온을 모두 잡은 상의 컬렉션',
        accent: 'blue',
      },
      하의: {
        id: 'bottoms',
        title: '베스트셀러 하의',
        subtitle: '편안함과 핏을 동시에 만족시키는 하의 추천',
        accent: 'red',
      },
      악세서리: {
        id: 'accessories',
        title: '포인트를 살리는 악세서리',
        subtitle: '룩에 완성도를 더해줄 아이템',
        accent: 'black',
      },
      신발: {
        id: 'shoes',
        title: '트렌디한 스니커즈',
        subtitle: '지금 가장 핫한 스니커즈 라인업',
        accent: 'blue',
      },
    };

    const sections = Object.entries(CATEGORY_META)
      .map(([category, meta]) => {
        const products = items.filter((item) => item.category === category).slice(0, 4);
        return products.length
          ? {
              ...meta,
              products,
            }
          : null;
      })
      .filter(Boolean);

    if (sections.length === 0 && items.length > 0) {
      sections.push({
        id: 'all-products',
        title: '최근 등록된 상품',
        subtitle: '막 등록된 따끈한 신상품을 만나보세요.',
        accent: 'blue',
        products: items.slice(0, 8),
      });
    }

    return sections;
  }, []);

  const fetchHomeProducts = useCallback(async () => {
    try {
      setProductLoading(true);
      setProductError('');

      const { data } = await api.get('/api/products', {
        params: {
          page: 1,
          limit: 20,
        },
      });

      if (data?.success) {
        setProductSections(buildSections(data.data || []));
      } else {
        setProductError('추천 상품을 불러오지 못했습니다.');
      }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        '추천 상품을 불러오는 중 오류가 발생했습니다.';
      setProductError(message);
    } finally {
      setProductLoading(false);
    }
  }, [buildSections]);

  useEffect(() => {
    fetchHomeProducts();
  }, [fetchHomeProducts]);

  return (
    <div className="home">
      <main className="home-main">
        <section className="hero-section">
          <div className="hero-content">
            <p className="hero-badge">WEEKLY HOT ISSUE</p>
            <h1>
              겨울 시즌을 위한
              <br />
              아우터 & 뷰티 스페셜
            </h1>
            <p className="hero-description">
              VIBE MALL 인기 브랜드의 겨울 추천 아이템. 한 번에 둘러보고 쇼핑하세요.
            </p>
            <div className="hero-actions">
              <button className="hero-primary">추천 상품 보기</button>
              <button className="hero-secondary" onClick={() => navigate('/register')}>
                회원가입하고 혜택 받기
              </button>
            </div>
          </div>
          <div className="hero-banners">
            {HIGHLIGHT_COLLECTIONS.map((collection) => (
              <article
                className="hero-banner-card"
                key={collection.id}
                style={{ backgroundImage: `url(${collection.image})` }}
              >
                <div className="hero-banner-overlay" />
                <div className="hero-banner-text">
                  <h3>{collection.title}</h3>
                  <p>{collection.description}</p>
                  <button className="hero-banner-button">{collection.cta}</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="category-section">
          <div className="section-header">
            <h2>오늘 뭐 입지?</h2>
            <p>카테고리별 인기 키워드로 빠르게 찾아보세요.</p>
          </div>
          <div className="category-grid">
            {CATEGORIES.map((category) => (
              <button key={category.id} className="category-card">
                <span className="category-icon">{category.icon}</span>
                <span className="category-label">{category.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="product-section-group" id="dynamic-products">
          {productLoading ? (
            <div className="product-loading">추천 상품을 불러오는 중입니다...</div>
          ) : productError ? (
            <div className="product-error">{productError}</div>
          ) : productSections.length === 0 ? (
            <div className="product-empty">
              <p>현재 등록된 상품이 없습니다.</p>
              {isAdmin && (
                <button type="button" className="hero-primary" onClick={() => navigate('/admin/products/new')}>
                  상품 등록하러 가기
                </button>
              )}
            </div>
          ) : (
            productSections.map((section) => (
              <div className="product-section" id={section.id} key={section.id}>
                <div className="section-header">
                  <h2>{section.title}</h2>
                  <div className={`section-accent section-accent-${section.accent}`} />
                  <p>{section.subtitle}</p>
                </div>
                <div className="product-grid">
                  {section.products.map((product) => (
                    <article
                      className="product-card"
                      key={product._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate(`/products/${product._id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(`/products/${product._id}`);
                        }
                      }}
                    >
                      <div
                        className="product-image"
                        style={{
                          backgroundImage: `url(${
                            product.image ||
                            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
                          })`,
                        }}
                      />
                      <div className="product-info">
                        <p className="product-brand">{product.category || 'VIBE MALL'}</p>
                        <h3 className="product-name">{product.name}</h3>
                        <p className="product-price">{formatPrice(product.price)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      <HomeFooter />
    </div>
  );
};

export default Home;
