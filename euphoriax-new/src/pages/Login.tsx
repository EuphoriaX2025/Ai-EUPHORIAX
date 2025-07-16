import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { WalletConnection } from '../components/WalletConnection'
import { ParticleAnimation } from '../components/ParticleAnimation'
import { useAccount } from 'wagmi'
import { useWallet } from '../hooks/useWallet'
import { isMobile } from '../utils/mobile'
import '../styles/mobile-wallet.css'

export const Login = () => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { isConnected } = useAccount()
  const { isConnecting } = useWallet()
  const mobileDevice = isMobile()

  // Auto-redirect when connected
  useEffect(() => {
    if (isConnected && !isConnecting) {
      setIsLoading(true)
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 1500)
    }
  }, [isConnected, isConnecting, navigate])

  const handleWalletConnect = () => {
    // Callback when wallet connects successfully
    console.log('Wallet connected successfully')
  }

  if (isLoading || (isConnected && isConnecting)) {
    return <Loader />
  }

  return (
    <div className="login-page">
      <ParticleAnimation />
      <div className="appHeader no-border transparent position-absolute"></div>
      <div id="appCapsule">
        <div className="glass-container">
          <div className="section mt-2 text-center">
            <h1>EUPHORIAX!</h1>
            <h3>Welcome</h3>
          </div>
          <div className="section mt-4 mb-2 p-2">
            
            {/* Enhanced Wallet Connection Component */}
            <WalletConnection 
              onConnect={handleWalletConnect}
              showBalance={false}
              compact={false}
            />
            
            {/* <div className="mt-3">
              <button type="button" className="btn btn-secondary btn-block">
                Sign in with Username
              </button>
            </div> */}
            
            {/* Mobile-optimized wallet info */}
            <div className="mt-4 text-center">
              {/* <p className="text-muted small">
                {mobileDevice ? 
                  'Connect using your mobile wallet app or scan QR code with WalletConnect' :
                  'Connect using MetaMask, WalletConnect, Trust Wallet, Coinbase Wallet, or any other supported wallet'
                }
              </p> */}
              
              {mobileDevice && process.env.NODE_ENV === 'development' && (
                <div className="mobile-device-info mt-2">
                  <small className="text-info">
                    📱 Mobile device detected - optimized wallet connection experience enabled
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

