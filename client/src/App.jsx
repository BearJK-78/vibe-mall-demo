import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/admin/AdminPage'
import AdminProductListPage from './pages/admin/AdminProductListPage'
import ProductCreatePage from './pages/admin/ProductCreatePage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import OrderPage from './pages/OrderPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import OrderFailurePage from './pages/OrderFailurePage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import AdminOrderManagementPage from './pages/admin/AdminOrderManagementPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/products" element={<AdminProductListPage />} />
          <Route path="admin/products/new" element={<ProductCreatePage />} />
          <Route path="admin/orders" element={<AdminOrderManagementPage />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="order" element={<OrderPage />} />
          <Route path="order/success" element={<OrderSuccessPage />} />
          <Route path="order/failure" element={<OrderFailurePage />} />
          <Route path="order-history" element={<OrderHistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
