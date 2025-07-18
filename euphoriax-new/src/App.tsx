import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';

// کامپوننت‌های اصلی و ابزارهای کمکی
import { Layout } from './components/Layout';
import { Loader } from './components/Loader';
import { ProtectedRoute } from './components/ProtectedRoute';
import { initializeApp } from './utils/appInitialization';
import { useMobileWallet, useWalletCompatibility } from './hooks/useMobileWallet';
import { isMobile } from './utils/mobile';

// وارد کردن استایل‌ها
import './styles/style.scss';
import './styles/mobile-wallet.css';

// بارگذاری هوشمند صفحات موجود
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/Register').then(module => ({ default: module.Register })));
const Cards = lazy(() => import('./pages/Cards').then(module => ({ default: module.Cards })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const Exchange = lazy(() => import('./pages/Exchange').then(module => ({ default: module.Exchange })));
const CoinDetail = lazy(() => import('./pages/CoinDetail').then(module => ({ default: module.CoinDetail })));
const Transactions = lazy(() => import('./pages/Transactions').then(module => ({ default: module.Transactions })));
const TransactionDetail = lazy(() => import('./pages/TransactionDetail').then(module => ({ default: module.TransactionDetail })));
const Explore = lazy(() => import('./pages/Explore').then(module => ({ default: module.Explore })));

// تعریف دو سیاره‌ی مربوط به پکیج‌ها طبق معماری نهایی
const Packages = lazy(() => import('./pages/Packages'));
const PackagesInfo = lazy(() => import('./pages/PackagesInfo'));


function App() {
  const mobileWallet = useMobileWallet();
  const compatibility = useWalletCompatibility();
  const mobile = isMobile();

  useEffect(() => {
    initializeApp();
    document.body.classList.add('dark-mode');
    if (mobile) {
      document.body.classList.add('mobile-device');
      if (mobileWallet.isIOS) document.body.classList.add('ios-device');
      if (mobileWallet.isAndroid) document.body.classList.add('android-device');
    }
    if (process.env.NODE_ENV === 'development') {
      console.log('Wallet Environment:', {
        mobile,
        compatibility,
        detectedWallets: mobileWallet.detectedWallets,
        recommendedConnection: mobileWallet.recommendedConnection,
      });
    }
  }, [mobile, mobileWallet, compatibility]);

  useEffect(() => {
    if (!compatibility.isChecking && !compatibility.isCompatible && compatibility.reasons.length > 0) {
      console.warn('Wallet compatibility issues:', compatibility.reasons);
      console.warn('Recommendations:', compatibility.recommendations);
    }
  }, [compatibility]);

  return (
    <Router>
      <div className="App">
        {!compatibility.isChecking && !compatibility.isCompatible && (
          <div className="compatibility-warning">
            <div className="alert alert-warning m-2">
              <strong>Browser Compatibility Warning:</strong>
              <ul className="mb-0 mt-1">
                {compatibility.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
              {compatibility.recommendations.length > 0 && (
                <div className="mt-2">
                  <strong>Recommendations:</strong>
                  <ul className="mb-0 mt-1">
                    {compatibility.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        <Routes>
          <Route path="/login" element={
            <Suspense fallback={<Loader />}>
              <Login />
            </Suspense>
          } />
          <Route element={<ProtectedRoute requireWallet={true}><Layout /></ProtectedRoute>}>
            <Route index element={
              <Suspense fallback={<Loader />}>
                <Dashboard />
              </Suspense>
            } />
            <Route path="/register" element={
              <Suspense fallback={<Loader />}>
                <Register />
              </Suspense>
            } />
            <Route path="/cards" element={
              <Suspense fallback={<Loader />}>
                <Cards />
              </Suspense>
            } />
            <Route path="/settings" element={
              <Suspense fallback={<Loader />}>
                <Settings />
              </Suspense>
            } />
            <Route path="/exchange" element={
              <Suspense fallback={<Loader />}>
                <Exchange />
              </Suspense>
            } />
            <Route path="/explore" element={
              <Suspense fallback={<Loader />}>
                <Explore />
              </Suspense>
            } />
            <Route path="/coin/:coinId" element={
              <Suspense fallback={<Loader />}>
                <CoinDetail />
              </Suspense>
            } />
            <Route path="/transactions" element={
              <Suspense fallback={<Loader />}>
                <Transactions />
              </Suspense>
            } />
            <Route path="/transaction/:transactionId" element={
              <Suspense fallback={<Loader />}>
                <TransactionDetail />
              </Suspense>
            } />
            
            {/* نقشه راه نهایی برای پکیج‌ها */}
            <Route path="/packagesinfo" element={
              <Suspense fallback={<Loader />}>
                <PackagesInfo />
              </Suspense>
            } />
            <Route path="/packages/buy" element={
              <Suspense fallback={<Loader />}>
                <Packages />
              </Suspense>
            } />
            
          </Route>

          <Route path="*" element={
            <ProtectedRoute requireWallet={true}>
              <Navigate to="/" replace />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;