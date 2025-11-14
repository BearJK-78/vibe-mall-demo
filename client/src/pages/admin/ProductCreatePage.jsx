import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../../utils/api';
import './ProductCreatePage.css';

const CATEGORY_OPTIONS = [
  { value: '', label: '카테고리 선택', icon: '📂' },
  { value: '상의', label: '상의', icon: '👕' },
  { value: '하의', label: '하의', icon: '👖' },
  { value: '악세서리', label: '악세서리', icon: '💍' },
  { value: '신발', label: '신발', icon: '👟' },
];

const initialFormState = {
  sku: '',
  name: '',
  price: '',
  category: '',
  image: '',
  description: '',
};

const ProductCreatePage = () => {
  const navigate = useNavigate();
  const outletContext = useOutletContext();
  const user = outletContext?.user ?? null;
  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadWidget, setUploadWidget] = useState(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetError, setWidgetError] = useState('');
  const [imagePreviewError, setImagePreviewError] = useState(false);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const priceFormatted = useMemo(() => {
    if (form.price === '') return '-';
    const numeric = Number(form.price);
    if (Number.isNaN(numeric)) return form.price;
    return `₩${numeric.toLocaleString()}`;
  }, [form.price]);

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

  useEffect(() => {
    let isMounted = true;

    const initializeWidget = () => {
      if (!isMounted) return;

      if (!cloudName || !uploadPreset) {
        setWidgetError('Cloudinary 환경 변수를 설정해주세요.');
        return;
      }

      if (typeof window === 'undefined' || !window.cloudinary) {
        setTimeout(initializeWidget, 200);
        return;
      }

      try {
        const widget = window.cloudinary.createUploadWidget(
          {
            cloudName: cloudName,
            uploadPreset: uploadPreset,
            multiple: false,
            maxFiles: 1,
            folder: 'products',
            resourceType: 'image',
            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
            cropping: false,
            sources: ['local', 'url', 'camera'],
            showAdvancedOptions: false,
            styles: {
              palette: {
                window: '#ffffff',
                sourceBg: '#f4f4f5',
                windowBorder: '#f4f4f5',
                tabIcon: '#101010',
                menuIcons: '#5f6368',
                textDark: '#101010',
                link: '#101010',
                action: '#101010',
                inactiveTabIcon: '#a7a7ad',
                error: '#e95959',
              },
              fonts: {
                default: {
                  family: "'Noto Sans KR', sans-serif",
                  size: '16px',
                },
              },
            },
          },
          (widgetErrorEvent, result) => {
            if (!isMounted) return;
            if (widgetErrorEvent) {
              setError('이미지 업로드 중 오류가 발생했습니다.');
              return;
            }

            if (result && result.event === 'success') {
              setForm((prev) => ({
                ...prev,
                image: result.info.secure_url,
              }));
              setImagePreviewError(false);
              setWidgetError('');
              setSuccessMessage('');
              setError('');
            }
          }
        );

        setUploadWidget(widget);
        setWidgetReady(true);
      } catch (createError) {
        setWidgetError('Cloudinary 위젯 초기화에 실패했습니다.');
      }
    };

    initializeWidget();

    return () => {
      isMounted = false;
    };
  }, [cloudName, uploadPreset]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'price' ? value.replace(/[^\d]/g, '') : value,
    }));
  };

  useEffect(() => {
    if (form.image) {
      setImagePreviewError(false);
    }
  }, [form.image]);

  const handleOpenWidget = useCallback(() => {
    if (!cloudName || !uploadPreset) {
      setWidgetError('Cloudinary 환경 변수를 설정해주세요.');
      return;
    }

    if (!uploadWidget) {
      setWidgetError('업로드 위젯을 초기화하는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setWidgetError('');
    uploadWidget.open();
  }, [cloudName, uploadPreset, uploadWidget]);

  const handleClearImage = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      image: '',
    }));
    setImagePreviewError(false);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.sku || !form.name || !form.price || !form.category || !form.image) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        sku: form.sku,
        name: form.name,
        price: Number(form.price),
        category: form.category,
        image: form.image,
        description: form.description || undefined,
      };

      const { data } = await api.post('/api/products', payload);

      if (data?.success) {
        setSuccessMessage('상품이 성공적으로 등록되었습니다.');
        setForm(initialFormState);
        setTimeout(() => {
          navigate('/admin');
        }, 1200);
      }
    } catch (submitError) {
      const message =
        submitError.response?.data?.message ||
        submitError.response?.data?.error ||
        '상품 등록 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (uploadWidget) {
      uploadWidget.close();
    }
    navigate(-1);
  };

  return (
    <div className="product-create-page">
      <header className="product-create-header">
        <p className="product-create-badge">
          <span role="img" aria-label="sparkles">
            ✨
          </span>{' '}
          NEW PRODUCT
        </p>
        <h1>상품 등록</h1>
        <p className="product-create-subtitle">
          새 상품을 등록하고 SKU, 가격, 카테고리 등을 관리하세요.
        </p>
      </header>

      <div className="product-create-content">
        <form className="product-create-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="sku">
              <span aria-hidden="true">🔖</span> SKU *
            </label>
            <input
              id="sku"
              name="sku"
              type="text"
              placeholder="예: TOP-2025-001"
              value={form.sku}
              onChange={handleChange}
              maxLength={32}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">
              <span aria-hidden="true">🧾</span> 상품 이름 *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="예: 클래식 울 코트"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">
              <span aria-hidden="true">💰</span> 상품 가격 *
            </label>
            <input
              id="price"
              name="price"
              type="text"
              inputMode="numeric"
              placeholder="예: 189000"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">
              <span aria-hidden="true">🗂️</span> 카테고리 *
            </label>
            <div className="select-wrapper">
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value || 'placeholder'} value={option.value} disabled={!option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="image">
              <span aria-hidden="true">🖼️</span> 대표 이미지 *
            </label>
            <div className="product-image-controls">
              <input
                id="image"
                name="image"
                type="text"
                value={form.image}
                placeholder="Cloudinary 업로드 후 이미지 URL이 표시됩니다."
                readOnly
                className="product-image-url"
              />
              <div className="product-image-buttons">
                <button
                  type="button"
                  className="form-button form-button-primary product-image-upload-button"
                  onClick={handleOpenWidget}
                  disabled={!widgetReady || submitting}
                >
                  이미지 업로드
                </button>
                {form.image && (
                  <button
                    type="button"
                    className="form-button form-button-ghost"
                    onClick={handleClearImage}
                    disabled={submitting}
                  >
                    이미지 제거
                  </button>
                )}
              </div>
            </div>
            {widgetError && <p className="form-helper-error">{widgetError}</p>}
          </div>

          <div className="form-group form-group-full">
            <label htmlFor="description">
              <span aria-hidden="true">📝</span> 상품 설명
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="상품 상세 설명을 입력하세요."
              value={form.description}
              onChange={handleChange}
              rows={4}
            />
          </div>

          {(error || successMessage) && (
            <div className={`form-feedback ${error ? 'form-feedback-error' : 'form-feedback-success'}`}>
              {error || successMessage}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="form-button form-button-secondary" onClick={handleCancel}>
              취소
            </button>
            <button type="submit" className="form-button form-button-primary" disabled={submitting}>
              {submitting ? '등록 중...' : '상품 등록'}
            </button>
          </div>
        </form>

        <aside className="product-preview">
          <div className="preview-card">
            <div className="preview-image">
              {form.image && !imagePreviewError ? (
                <img
                  src={form.image}
                  alt="상품 미리보기"
                  onError={() => setImagePreviewError(true)}
                />
              ) : (
                <span role="img" aria-label="placeholder">
                  🛍️
                </span>
              )}
            </div>
            <div className="preview-info">
              <p className="preview-category">
                {CATEGORY_OPTIONS.find((option) => option.value === form.category)?.icon || '📦'}{' '}
                {form.category || '카테고리 미정'}
              </p>
              <h3 className="preview-name">{form.name || '상품 이름'}</h3>
              <p className="preview-price">{priceFormatted}</p>
              <p className="preview-sku">SKU: {form.sku || '-'}</p>
            </div>
          </div>
          <div className="preview-helper">
            <p>
              <span role="img" aria-label="light">
                💡
              </span>{' '}
              이미지 URL을 입력하면 미리보기에서 즉시 확인할 수 있습니다.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ProductCreatePage;

