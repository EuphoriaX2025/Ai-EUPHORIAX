import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { IonIcon } from '@ionic/react'
import { useWallet } from '../hooks/useWallet'
import { useEuphoriaExchange } from '../hooks/useEuphoriaExchange'
import { ExchangeErrorBoundary } from '../components/ExchangeErrorBoundary'

import {
swapVertical,swapHorizontalOutline
} from 'ionicons/icons';

export const Exchange = () => {
  const location = useLocation()
  const { isConnected } = useWallet()
  
  // Add the hook but gradually add more functions
  const {
    stablecoinAddresses,
    isLoadingStablecoins,
    // getStablecoinWithMetadata,
    // useStablecoinInfo,
    useERXPrice,
    useCurrentERXPrice,
    // useQBITPrice,
    useERXBalance,
    useQBITBalance,
    calculateQuote, // This is likely the culprit!
  } = useEuphoriaExchange()
  
  console.log('Testing hook data:', {
    stablecoinAddresses,
    isLoadingStablecoins,
    stablecoinCount: stablecoinAddresses?.length || 0
  })

  // Test the price hooks but don't use them in calculations yet
  const { data: currentERXPrice } = useCurrentERXPrice()
  const firstStablecoin = stablecoinAddresses?.[0]
  const { data: erxPrice } = useERXPrice(firstStablecoin || '0x0')
  
  console.log('Testing price data:', {
    currentERXPrice: currentERXPrice?.toString(),
    erxPrice: erxPrice?.toString(),
    firstStablecoin
  })

  // Test the balance hooks
  const { data: erxBalance } = useERXBalance()
  const { data: qbitBalance } = useQBITBalance()
  
  console.log('Testing balance data:', {
    erxBalance: erxBalance?.toString(),
    qbitBalance: qbitBalance?.toString(),
  })
  
  // State for UI
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Input validation and handlers
  const handleFromAmountChange = (value: string) => {
    try {
      console.log('Exchange: Input changed to:', value)
      // Allow empty string, numbers, and decimal points
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFromAmount(value)
        
        // Test the calculateQuote function with real data
        if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0 && currentERXPrice) {
          console.log('Testing calculateQuote with:', {
            value,
            currentERXPrice: currentERXPrice.toString(),
            inputDecimals: 6,
            outputDecimals: 18
          })
          
          const quote = calculateQuote(value, currentERXPrice, 6, 18)
          console.log('calculateQuote result:', quote)
          
          if (quote && quote.outputAmount) {
            setToAmount(quote.outputAmount)
          } else {
            console.log('calculateQuote returned null, using fallback')
            // Fallback to simple calculation if quote fails
            const calculated = (parseFloat(value) * 0.065).toFixed(6)
            setToAmount(calculated)
          }
        } else {
          setToAmount('')
        }
      }
    } catch (error) {
      console.error('Error handling from amount change:', error)
      // Fallback calculation if anything fails
      if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
        const calculated = (parseFloat(value) * 0.065).toFixed(6)
        setToAmount(calculated)
      }
    }
  }

  const handleToAmountChange = (value: string) => {
    try {
      // Allow empty string, numbers, and decimal points
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setToAmount(value)
      }
    } catch (error) {
      console.error('Error handling to amount change:', error)
    }
  }

  // Initialize component on mount and route changes
  useEffect(() => {
    console.log('Exchange component mounting/route changed:', location.pathname)
    setIsInitialized(false)
    
    // Reset amounts when component mounts/remounts
    setFromAmount('')
    setToAmount('')
    
    // Mark as initialized after a short delay to ensure DOM is ready
    setTimeout(() => {
      setIsInitialized(true)
    }, 100)
  }, [location.pathname])

  console.log('Exchange rendering:', {
    fromAmount,
    toAmount,
    isInitialized,
    isConnected
  })

  return (
    <ExchangeErrorBoundary>
      {!isInitialized && (
        <div className="section mt-4 text-center">
          <div className="text-muted">Loading Exchange...</div>
        </div>
      )}
      
      <div className={`exchange-container ${isInitialized ? 'initialized' : 'loading'}`}>
        <div className="section mt-4" id="from-section">
          <div className="card energy-container">
            <div className="card-body">
              <div className="form-group basic p-0">
                <div className="exchange-heading">
                  <label className="group-label" htmlFor="fromAmount">From</label>
                  <div className="exchange-wallet-info">
                    Balance : <strong id="from-balance">0.00</strong>
                  </div>
                </div>
                <div className="exchange-group">
                  <div className="input-col">
                    <input 
                      type="text" 
                      className="form-control form-control-lg pe-0 border-0"
                      id="fromAmount" 
                      placeholder="0"
                      value={fromAmount}
                      onChange={(e) => handleFromAmountChange(e.target.value)}
                    />
                  </div>
                  <div className="select-col">
                    <select 
                      className="form-select form-select-lg currency" 
                      id="from-currency"
                      defaultValue="USDT"
                    >
                      <option value="USDT">USDT</option>
                      <option value="USDC">USDC</option>
                      <option value="DAI">DAI</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="section text-center">
          <div className="text-muted small mb-2">
            Buy Mode: Stablecoin → ERX
          </div>
          <button 
            className="fab-swap" 
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease'
            }}
            title="Switch to Sell Mode"
          >
              <IonIcon icon={swapVertical} />
          </button>
        </div>

        <div className="section" id="to-section">
          <div className="card energy-container">
            <div className="card-body">
              <div className="form-group basic p-0">
                <div className="exchange-heading">
                  <label className="group-label" htmlFor="toAmount">To</label>
                  <div className="exchange-wallet-info">
                    Balance : <strong id="to-balance">0.00</strong>
                  </div>
                </div>
                <div className="exchange-group">
                  <div className="input-col">
                    <input 
                      type="text" 
                      className="form-control form-control-lg pe-0 border-0"
                      id="toAmount" 
                      placeholder="0"
                      value={toAmount}
                      onChange={(e) => handleToAmountChange(e.target.value)}
                    />
                  </div>
                  <div className="select-col">
                    <select 
                      className="form-select form-select-lg currency" 
                      id="to-currency"
                      defaultValue="ERX"
                    >
                      <option value="ERX">ERX Token</option>
                      <option value="QBIT">QBIT Token</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Rate Info */}
        <div className="section mt-3">
          <div className="card">
            <div className="card-body">
              <div className="row">
                <div className="col-6">
                  <div className="text-muted">Exchange Rate</div>
                  <div className="h6">1 USDT = 15.384615 ERX</div>
                </div>
                <div className="col-6 text-end">
                  <div className="text-muted">Network Fee</div>
                  <div className="h6">~$2.50</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Button */}
        <div className="section mt-3">
          {!isConnected ? (
            <button className="btn btn-warning btn-block btn-lg" disabled>
              Connect Wallet First
            </button>
          ) : !fromAmount || !toAmount ? (
            <button className="btn btn-secondary btn-block btn-lg" disabled>
              Enter Amount
            </button>
          ) : (
            <button 
              className="btn btn-success btn-block btn-lg"
              onClick={() => console.log('Exchange button clicked')}
            >
              Buy ERX
            </button>
          )}
        </div>

        {/* Recent Exchanges */}
        <div className="section mt-4">
          <div className="section-heading">
            <h2 className="title">Recent Exchanges</h2>
          </div>
          <div className="card">
            <ul className="listview flush transparent no-line image-listview detailed-list mt-1 mb-1">
              <li>
                <a href="#" className="item">
                  <div className="icon-box bg-success">
                    <IonIcon icon={swapHorizontalOutline} />
                  </div>
                  <div className="in">
                    <div>
                      <strong>USDT → ERX</strong>
                      <div className="text-small text-secondary">Completed</div>
                    </div>
                    <div className="text-end">
                      <strong>100 USDT</strong>
                      <div className="text-small">
                        Today 2:30 PM
                      </div>
                    </div>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ExchangeErrorBoundary>
  )
}
