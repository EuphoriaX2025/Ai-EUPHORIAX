import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IonIcon } from '@ionic/react';
import { Splide } from '@splidejs/splide';
import '@splidejs/splide/dist/css/splide.min.css';
import { useBalance } from 'wagmi';
import { WalletConnection } from '../components/WalletConnection'
import { TransactionErrorModal, TransactionSuccessModal } from '../components/TransactionModals'
import { BalanceDebugPanel } from '../components/BalanceDebugPanel'
import { useWallet } from '../hooks/useWallet'
import { RecentTransactions } from '../components/RecentTransactions';
import { usePortfolioBalance } from '../hooks/usePortfolioBalance'
import { useCryptoPrices } from '../hooks/useCryptoPrices'
import { useEuphoriaExchange, type StablecoinMetadata } from '../hooks/useEuphoriaExchange'
import { useTransactionHistory } from '../hooks/useTransactionHistory'
import { useTransfer } from '../hooks/useTransfer'
import { validateWalletAddress, getAddressValidationMessage, getInputValidationState } from '../utils/addressValidation'
import { parseTransactionError } from '../utils/errorParser'
import { formatUnits, parseUnits, type Address } from 'viem'
import { isMobile } from '../utils/mobile'
import erxLogo from '../assets/img/tokens/erx-logo.png';
import qbitLogo from '../assets/img/tokens/qbit-logo.png';

// import { SmartContractDemo } from '../components/SmartContractDemo'
import '../styles/cards.css';
import '../assets/css/carousel-fixes.css';
import '../styles/mobile-modals.css';
import '../styles/address-validation.css';
import '../styles/charts.css';
import { CoinChart } from '../components/CoinChart';
import { useCoinChartData } from '../hooks/useCoinChartData';

import {
arrowDownOutline,arrowForwardOutline,
cardOutline,swapVertical,arrowUpCircleOutline,closeOutline,
pencilOutline,ellipsisHorizontal,arrowUpOutline,
trendingUpOutline,trendingDownOutline,swapVerticalOutline,
checkmarkCircleOutline,addOutline,ellipsisVertical
} from 'ionicons/icons';

export const Dashboard = () => {
  const { isConnected, address, getFormattedBalance, balance: nativeBalance } = useWallet()
  const { totalValue, breakdown, isLoading: isPortfolioLoading } = usePortfolioBalance()
  const { bitcoin, ethereum, polygon, formatPrice, formatChange, isLoading: isPricesLoading } = useCryptoPrices()
  const { useCurrentERXPrice, useQBITCurrentPrice, useERXBalance, useQBITBalance, stablecoinAddresses, getStablecoinWithMetadata, useStablecoinInfo } = useEuphoriaExchange()
  const { transactions: recentTransactions, isLoading: isTransactionsLoading, getTransactionColor } = useTransactionHistory()
  const { transfer, resetTransfer, isLoading: isTransferLoading, isSuccess: isTransferSuccess, error: transferError, hash: transferHash } = useTransfer()
  const navigate = useNavigate()

  // Send money form state
  const [sendForm, setSendForm] = useState({
    asset: 'ERX',
    recipientAddress: '',
    amount: '',
  })
  
  // State to track selected stablecoin balance info
  const [selectedStablecoinForSend, setSelectedStablecoinForSend] = useState<Address | undefined>(undefined)
  
  // Get stablecoin info for the selected stablecoin in send form
  const selectedStablecoinInfo = useStablecoinInfo(selectedStablecoinForSend)
  
  // Address validation state
  const [addressValidation, setAddressValidation] = useState<{
    state: 'empty' | 'invalid' | 'valid' | 'warning'
    message?: string
    showCheckmark?: boolean
  }>({ state: 'empty' })
  
  // Modal states for error and success handling
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [currentError, setCurrentError] = useState<any>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [lastProcessedError, setLastProcessedError] = useState<string | null>(null) // Track processed errors
  const [lastSuccessHash, setLastSuccessHash] = useState<string | null>(null) // Track last successful transaction
  const [errorProcessingTimeout, setErrorProcessingTimeout] = useState<NodeJS.Timeout | null>(null) // Debounce error processing

  // Get live prices for ERX and QBIT from smart contracts
  const { data: currentERXPrice } = useCurrentERXPrice()
  const { data: currentQBITPrice } = useQBITCurrentPrice()

  // Get current token balances
  const { data: erxBalance } = useERXBalance()
  const { data: qbitBalance } = useQBITBalance()

  // Generate chart data using the custom hook
  const btcChartData = useCoinChartData(bitcoin);
  const ethChartData = useCoinChartData(ethereum);
  const maticChartData = useCoinChartData(polygon);

  // Alternative balance hook for POL/MATIC with better error handling
  const { data: alternativeNativeBalance, isLoading: alternativeBalanceLoading, error: balanceError } = useBalance({
    address: address,
    query: {
      enabled: !!address && isConnected,
      refetchInterval: 10000, // Refetch every 10 seconds
      retry: 3,
    }
  })

  // Helper function to get display symbol for an asset
  const getAssetDisplaySymbol = (asset: string): string => {
    switch (asset.toUpperCase()) {
      case 'ERX':
        return 'ERX'
      case 'QBIT':
        return 'QBIT'
      case 'MATIC':
      case 'POL':
        return 'POL'
      default:
        // Check if it's a stablecoin address
        if (asset.startsWith('0x') && stablecoinAddresses && stablecoinAddresses.includes(asset as Address)) {
          const metadata = getStablecoinWithMetadata(asset as Address)
          return metadata.symbol
        }
        return asset
    }
  }

  // Helper function to get available balance for selected asset
  const getAvailableBalance = (asset: string): string => {
    switch (asset.toUpperCase()) {
      case 'ERX':
        return erxBalance ? formatUnits(erxBalance, 18) : '0'
      case 'QBIT':
        return qbitBalance ? formatUnits(qbitBalance, 18) : '0'
      case 'MATIC':
      case 'POL':
        // Try alternative balance first, then fallback to nativeBalance
        const balanceToUse = alternativeNativeBalance || nativeBalance
        return balanceToUse ? formatUnits(balanceToUse.value, 18) : '0'
      default:
        // Check if it's a stablecoin address
        if (asset.startsWith('0x') && stablecoinAddresses && stablecoinAddresses.includes(asset as Address)) {
          // If this is the currently selected stablecoin, use its balance
          if (asset === selectedStablecoinForSend && selectedStablecoinInfo) {
            return (Number(selectedStablecoinInfo.balance) / Math.pow(10, selectedStablecoinInfo.decimals)).toFixed(6)
          }
          // Otherwise return 0 for other stablecoins (we could enhance this later to fetch all balances)
          return '0'
        }
        return '0'
    }
  }

  // Helper function to check if user has sufficient balance
  const hasInsufficientBalance = (asset: string, amount: string): boolean => {
    if (!amount || parseFloat(amount) <= 0) return false
    
    const availableBalance = parseFloat(getAvailableBalance(asset))
    const requestedAmount = parseFloat(amount)
    
    // Add debugging for POL/MATIC balance issues
    if (asset.toUpperCase() === 'POL' || asset.toUpperCase() === 'MATIC') {
      console.log('POL/MATIC Balance Debug:', {
        asset,
        nativeBalance,
        nativeBalanceValue: nativeBalance?.value,
        nativeBalanceFormatted: nativeBalance ? formatUnits(nativeBalance.value, 18) : 'undefined',
        availableBalance,
        requestedAmount,
        hasInsufficient: requestedAmount > availableBalance,
        isDev: process.env.NODE_ENV === 'development',
        buildMode: import.meta.env.MODE
      })
    }
    
    return requestedAmount > availableBalance
  }

  // Reset transfer states when transfer completes
  useEffect(() => {
    // Add detailed debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Transfer useEffect triggered:', {
        isTransferSuccess,
        transferError: transferError?.toString(),
        transferHash,
        isTransferLoading,
        lastProcessedError,
        lastSuccessHash,
        showSuccessModal,
        showErrorModal
      })
    }

    // Clear any pending error processing timeout
    if (errorProcessingTimeout) {
      clearTimeout(errorProcessingTimeout)
      setErrorProcessingTimeout(null)
    }

    // Handle successful transfers
    if (isTransferSuccess && transferHash) {
      // Only process this success if it's a new transaction
      if (transferHash !== lastSuccessHash) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Processing successful transfer:', transferHash)
          console.log('Setting showSuccessModal to true')
        }
        
        setLastSuccessHash(transferHash)
        setTransactionHash(transferHash)
        setShowSuccessModal(true)
        setSendForm({ asset: 'ERX', recipientAddress: '', amount: '' })
        
        // Clear any previous error state when success occurs
        setShowErrorModal(false)
        setCurrentError(null)
        setLastProcessedError(null)
        
        // Close the send money modal first
        const sendModal = document.getElementById('sendActionSheet')
        if (sendModal) {
          const modalInstance = (window as any).bootstrap?.Modal?.getInstance(sendModal)
          if (modalInstance) {
            modalInstance.hide()
          }
          // Force remove Bootstrap modal classes and backdrops
          sendModal.classList.remove('show')
          sendModal.style.display = 'none'
          const backdrops = document.querySelectorAll('.modal-backdrop')
          backdrops.forEach(backdrop => backdrop.remove())
        }
        
        // Wait for send modal to close before showing success modal
        setTimeout(() => {
          setShowSuccessModal(true)
          if (process.env.NODE_ENV === 'development') {
            console.log('Success modal shown after delay')
          }
        }, 200)
        
        // Note: Don't call resetTransfer() here immediately, let the success modal handle cleanup
      }
    }
    
    // Handle transfer errors - simplified logic
    if (transferError && !isTransferSuccess) {
      const errorMessage = transferError.toString()
      const parsedError = parseTransactionError(transferError)
      
      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Transfer Error Detected:', {
          errorMessage,
          parsedErrorType: parsedError.type,
          lastProcessedError,
          isTransferLoading,
          willProcess: errorMessage !== lastProcessedError
        })
      }
      
      // Only process new errors to avoid duplicates
      if (errorMessage !== lastProcessedError) {
        // Mark as processed immediately to prevent duplicate handling
        setLastProcessedError(errorMessage)
        
        // Helper function to close send modal
        const closeSendModal = () => {
          const sendModal = document.getElementById('sendActionSheet')
          if (sendModal) {
            const modalInstance = (window as any).bootstrap?.Modal?.getInstance(sendModal)
            if (modalInstance) {
              modalInstance.hide()
            }
            // Force remove Bootstrap modal classes and backdrops
            sendModal.classList.remove('show')
            sendModal.style.display = 'none'
            const backdrops = document.querySelectorAll('.modal-backdrop')
            backdrops.forEach(backdrop => backdrop.remove())
          }
          document.body.style.overflow = 'unset'
        }
        
        // For all errors (including user cancellation), show the error modal
        if (process.env.NODE_ENV === 'development') {
          console.log('Showing error modal for:', parsedError.type)
        }
        closeSendModal()
        resetTransfer()
        
        // Small delay to ensure send modal is closed before showing error modal
        setTimeout(() => {
          setCurrentError(transferError)
          setShowErrorModal(true)
        }, 100)
      }
    }
  }, [isTransferSuccess, transferError, transferHash, lastProcessedError, lastSuccessHash, resetTransfer])

  // Ensure body overflow is properly reset when all modals are closed
  useEffect(() => {
    if (!showErrorModal && !showSuccessModal) {
      // Both modals are closed, ensure body scroll is restored
      document.body.style.overflow = 'unset'
    }
  }, [showErrorModal, showSuccessModal])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (errorProcessingTimeout) {
        clearTimeout(errorProcessingTimeout)
      }
    }
  }, [errorProcessingTimeout])

  // Auto-correct address checksum when needed
  useEffect(() => {
    if (sendForm.recipientAddress && addressValidation.state === 'warning') {
      const addressValidationResult = validateWalletAddress(sendForm.recipientAddress.trim())
      
      if (
        addressValidationResult.isValid &&
        addressValidationResult.normalizedAddress &&
        addressValidationResult.normalizedAddress !== sendForm.recipientAddress.trim()
      ) {
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log('Auto-correcting address via useEffect:', {
            from: sendForm.recipientAddress.trim(),
            to: addressValidationResult.normalizedAddress
          })
        }
        
        // Auto-correct the address
        setSendForm(prev => ({ ...prev, recipientAddress: addressValidationResult.normalizedAddress! }))
        // Update validation state for the corrected address
        const correctedValidation = getInputValidationState(addressValidationResult.normalizedAddress!)
        setAddressValidation(correctedValidation)
      }
    }
  }, [sendForm.recipientAddress, addressValidation.state])

  const handleSendFormChange = (field: string, value: string) => {
    // Update form state first
    setSendForm(prev => ({ ...prev, [field]: value }))
    
    // Handle asset selection - update stablecoin state if needed
    if (field === 'asset') {
      // Check if the selected asset is a stablecoin address
      if (value.startsWith('0x') && stablecoinAddresses && stablecoinAddresses.includes(value as Address)) {
        setSelectedStablecoinForSend(value as Address)
      } else {
        setSelectedStablecoinForSend(undefined)
      }
    }
    
    // Handle recipient address validation
    if (field === 'recipientAddress') {
      const validation = getInputValidationState(value)
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Address validation:', {
          input: value,
          validationState: validation.state,
          message: validation.message
        })
      }
      
      setAddressValidation(validation)
    }
    
    // Clear error modals when user makes changes
    if (showErrorModal) {
      setShowErrorModal(false)
      setCurrentError(null)
      setLastProcessedError(null)
    }
    if (showSuccessModal) {
      setShowSuccessModal(false)
    }
  }

  const handleSendMoney = async () => {
    // Add debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('handleSendMoney called with:', {
        sendForm,
        isTransferLoading,
        isConnected
      })
    }

    // Clear any existing modals and transfer state
    setShowErrorModal(false)
    setShowSuccessModal(false)
    setCurrentError(null)
    setLastProcessedError(null)
    setLastSuccessHash(null)
    resetTransfer()

    // Helper function to close the send money modal
    const closeSendModal = () => {
      const sendModal = document.getElementById('sendActionSheet')
      if (sendModal) {
        const modalInstance = (window as any).bootstrap?.Modal?.getInstance(sendModal)
        if (modalInstance) {
          modalInstance.hide()
        }
        // Force remove Bootstrap modal classes and backdrops
        sendModal.classList.remove('show')
        sendModal.style.display = 'none'
        const backdrops = document.querySelectorAll('.modal-backdrop')
        backdrops.forEach(backdrop => backdrop.remove())
      }
    }

    // Validation
    if (!sendForm.recipientAddress.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Validation failed: No recipient address')
      }
      closeSendModal()
      setTimeout(() => {
        setCurrentError(new Error('Please enter a recipient address'))
        setShowErrorModal(true)
      }, 100)
      return
    }

    // Validate wallet address format
    const addressValidationResult = validateWalletAddress(sendForm.recipientAddress.trim())
    if (!addressValidationResult.isValid) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Validation failed: Invalid address', addressValidationResult)
      }
      closeSendModal()
      setTimeout(() => {
        setCurrentError(new Error(addressValidationResult.error || 'Invalid wallet address'))
        setShowErrorModal(true)
      }, 100)
      return
    }

    if (!sendForm.amount || parseFloat(sendForm.amount) <= 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Validation failed: Invalid amount')
      }
      closeSendModal()
      setTimeout(() => {
        setCurrentError(new Error('Please enter a valid amount'))
        setShowErrorModal(true)
      }, 100)
      return
    }

    // Check for insufficient balance
    if (hasInsufficientBalance(sendForm.asset, sendForm.amount)) {
      const availableBalance = getAvailableBalance(sendForm.asset)
      if (process.env.NODE_ENV === 'development') {
        console.log('Validation failed: Insufficient balance')
      }
      closeSendModal()
      setTimeout(() => {
        setCurrentError(new Error(`Insufficient balance. You have ${parseFloat(availableBalance).toFixed(6)} ${sendForm.asset} available, but tried to send ${sendForm.amount} ${sendForm.asset}.`))
        setShowErrorModal(true)
      }, 100)
      return
    }

    try {
      // Use the normalized address from validation
      const normalizedAddress = addressValidationResult.normalizedAddress || sendForm.recipientAddress.trim()
      
      // Log transaction attempt
      if (process.env.NODE_ENV === 'development') {
        console.log('Starting transfer:', {
          asset: sendForm.asset,
          to: normalizedAddress,
          amount: sendForm.amount
        })
      }
      
      // Call transfer function - let the useEffect handle the response
      await transfer(sendForm.asset, normalizedAddress, sendForm.amount)
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Transfer function completed without throwing')
      }
      
    } catch (error: any) {
      // Log the error for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Transfer function threw error:', error)
      }
      
      const parsedError = parseTransactionError(error)
      
      // For all errors (including user cancellation), show the error modal
      if (process.env.NODE_ENV === 'development') {
        console.log('Showing error modal for:', parsedError.type, error)
      }
      
      closeSendModal()
      setLastProcessedError(error.toString())
      resetTransfer()
      
      // Small delay to ensure send modal is closed before showing error modal
      setTimeout(() => {
        setCurrentError(error)
        setShowErrorModal(true)
      }, 100)
    }
  }

  const handleExchangeNavigation = () => {
    // Close the modal first
    const modal = document.getElementById('exchangeActionSheet')
    if (modal) {
      const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modal)
      if (modalInstance) {
        modalInstance.hide()
      }
    }
    
    // Navigate to exchange page after a short delay to allow modal to close
    setTimeout(() => {
      navigate('/exchange')
    }, 150)
  }

  // Watchlist data with proper chart data
  const watchlistCoins = useMemo(() => {
    const erxPrice = currentERXPrice ? `$${(Number(currentERXPrice) / 1e18).toFixed(3)}` : '$0.100';
    const qbitPrice = currentQBITPrice ? `$${(Number(currentQBITPrice) / 1e18).toFixed(2)}` : '$20.00';
    const btcPrice = isPricesLoading ? 'Loading...' : (bitcoin?.current_price ? formatPrice(bitcoin.current_price) : '$105,503');
    const ethPrice = isPricesLoading ? 'Loading...' : (ethereum?.current_price ? formatPrice(ethereum.current_price) : '$3,890');
    const maticPrice = isPricesLoading ? 'Loading...' : (polygon?.current_price ? formatPrice(polygon.current_price) : '$0.45');
    
    return [
      { 
        id: 'ERX', 
        name: 'ERX/USD', 
        price: erxPrice,
        change: '3.15%', 
        isPositive: true, 
        chartData: Array.from({ length: 12 }, (_, i) => {
          const basePrice = currentERXPrice ? Number(currentERXPrice) / 1e18 : 0.100;
          const variation = basePrice * 0.02; // 2% variation
          const trend = (i - 6) * (basePrice * 0.003); // Small upward trend
          const noise = (Math.random() - 0.5) * variation;
          return Math.max(basePrice * 0.95, basePrice + trend + noise);
        }),
        stableId: 'erx-stable',
        currentPrice: currentERXPrice ? Number(currentERXPrice) / 1e18 : 0.100,
        symbol: 'ERX'
      },
      { 
        id: 'QBIT', 
        name: 'QBit/USD', 
        price: qbitPrice,
        change: '1.50%', 
        isPositive: true, 
        chartData: Array.from({ length: 12 }, (_, i) => {
          const basePrice = currentQBITPrice ? Number(currentQBITPrice) / 1e18 : 20.00;
          const variation = basePrice * 0.015; // 1.5% variation
          const trend = (i - 6) * (basePrice * 0.002); // Small upward trend
          const noise = (Math.random() - 0.5) * variation;
          return Math.max(basePrice * 0.98, basePrice + trend + noise);
        }),
        stableId: 'qbit-stable',
        currentPrice: currentQBITPrice ? Number(currentQBITPrice) / 1e18 : 20.00,
        symbol: 'QBIT'
      },
      { 
        id: 'BTC', 
        name: 'BTC/USD', 
        price: btcPrice,
        change: isPricesLoading ? '...' : (bitcoin?.price_change_percentage_24h !== undefined ? formatChange(bitcoin.price_change_percentage_24h) : '2.59%'),
        isPositive: bitcoin?.price_change_percentage_24h !== undefined ? bitcoin.price_change_percentage_24h >= 0 : true,
        chartData: btcChartData,
        stableId: 'btc-stable',
        currentPrice: bitcoin?.current_price || 105503,
        symbol: 'BTC'
      },
      { 
        id: 'ETH', 
        name: 'ETH/USD', 
        price: ethPrice,
        change: isPricesLoading ? '...' : (ethereum?.price_change_percentage_24h !== undefined ? formatChange(ethereum.price_change_percentage_24h) : '-1.24%'),
        isPositive: ethereum?.price_change_percentage_24h !== undefined ? ethereum.price_change_percentage_24h >= 0 : false,
        chartData: ethChartData,
        stableId: 'eth-stable',
        currentPrice: ethereum?.current_price || 3890,
        symbol: 'ETH'
      },
      { 
        id: 'MATIC', 
        name: 'POL/USD', 
        price: maticPrice,
        change: isPricesLoading ? '...' : (polygon?.price_change_percentage_24h !== undefined ? formatChange(polygon.price_change_percentage_24h) : '4.85%'),
        isPositive: polygon?.price_change_percentage_24h !== undefined ? polygon.price_change_percentage_24h >= 0 : true,
        chartData: maticChartData,
        stableId: 'matic-stable',
        currentPrice: polygon?.current_price || 0.45,
        symbol: 'POL'
      }
    ];
  }, [currentERXPrice, currentQBITPrice, bitcoin, ethereum, polygon, isPricesLoading, formatPrice, formatChange, btcChartData, ethChartData, maticChartData]);

  // Initialize Splide carousels
  useEffect(() => {
    // Wait for DOM to be ready
    const initializeCarousels = () => {
      // console.log('Initializing Splide carousels...');
      
      // Check if already initialized to prevent double init
      if (document.querySelector('.splide--initialized')) {
        // console.log('Carousels already initialized, skipping...');
        return;
      }
      
      // Single Carousel (My Cards - show 3 cards at a time)
      document.querySelectorAll('.carousel-single').forEach(carousel => {
        const carouselElement = carousel as HTMLElement;
        if (!carouselElement.classList.contains('splide--initialized') && !carouselElement.hasAttribute('data-splide-init')) {
          carouselElement.setAttribute('data-splide-init', 'true');
          const splideInstance = new Splide(carouselElement, {
            perPage: 3, // Show 3 cards at a time
            rewind: true,
            type: "loop",
            gap: 16, // Gap between cards
            padding: { left: 16, right: 16 }, // Padding on sides
            arrows: false,
            pagination: false,
            clones: 1,
            autoWidth: false, // Force consistent width
            focus: 'center',
            width: '100%', // Ensure full width
            breakpoints: {
              768: {
                perPage: 1, // Mobile: show 1 card
                padding: { left: 16, right: 16 },
                gap: 16
              },
              991: {
                perPage: 2, // Tablet: show 2 cards
                padding: { left: 16, right: 16 },
                gap: 16
              }
            }
          });
          
          // Store reference for cleanup
          (carouselElement as any).splideInstance = splideInstance;
          splideInstance.mount();
        }
      });

      // Multiple Carousel (watchlist - show all 5 cards at once)
      document.querySelectorAll('.carousel-multiple').forEach(carousel => {
        const carouselElement = carousel as HTMLElement;
        if (!carouselElement.classList.contains('splide--initialized') && !carouselElement.hasAttribute('data-splide-init')) {
          // console.log('Initializing multiple carousel (watchlist)');
          carouselElement.setAttribute('data-splide-init', 'true');
          try {
            // Count actual slides (not clones)
            const actualSlides = carouselElement.querySelectorAll('.splide__slide:not(.splide__slide--clone)').length;
            // console.log(`Watchlist has ${actualSlides} slides`);
            
            const splideInstance = new Splide(carouselElement, {
              perPage: 5, // Show all 5 cards at once
              rewind: false,
              type: "slide", // Use slide type since we don't need looping for 5 cards
              gap: 4, // Very small gap for maximum card width
              padding: { left: 4, right: 4 }, // Minimal padding for full width coverage
              arrows: false,
              pagination: false,
              autoWidth: false,
              focus: 0, // No centering needed since all cards are visible
              trimSpace: false,
              drag: true, // Disable dragging since all cards are visible
              breakpoints: {
                768: {
                  perPage: 2, // Mobile: show 2 cards
                  gap: 8,
                  padding: { left: 12, right: 12 },
                  drag: actualSlides > 2
                },
                991: {
                  perPage: 3, // Tablet: show 3 cards
                  gap: 6,
                  padding: { left: 8, right: 8 },
                  drag: actualSlides > 3
                },
                1200: {
                  perPage: 4, // Large tablets: show 4 cards
                  gap: 4,
                  padding: { left: 4, right: 4 },
                  drag: actualSlides > 4
                }
              }
            });
            
            // Store reference for cleanup
            (carouselElement as any).splideInstance = splideInstance;
            splideInstance.mount();
            // console.log('Multiple carousel initialized successfully');
          } catch (error) {
            console.error('Error initializing multiple carousel:', error);
          }
        }
      });

      // Small Carousel
      document.querySelectorAll('.carousel-small').forEach(carousel => {
        const carouselElement = carousel as HTMLElement;
        if (!carouselElement.classList.contains('splide--initialized') && !carouselElement.hasAttribute('data-splide-init')) {
          // console.log('Initializing small carousel');
          carouselElement.setAttribute('data-splide-init', 'true');
          const splideInstance = new Splide(carouselElement, {
            perPage: 7,
            rewind: true,
            type: "loop",
            gap: 16,
            padding: 16,
            arrows: false,
            pagination: false,
            clones: 1, // Limit the number of clones
            breakpoints: {
              768: {
                perPage: 4
              },
              991: {
                perPage: 5
              }
            }
          });
          
          // Store reference for cleanup
          (carouselElement as any).splideInstance = splideInstance;
          splideInstance.mount();
        }
      });
    };

    // Initialize with a delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeCarousels, 100);
    
    return () => {
      clearTimeout(timeoutId);
      // Cleanup: destroy any existing splide instances when component unmounts
      document.querySelectorAll('.carousel-single, .carousel-multiple, .carousel-small').forEach(carousel => {
        try {
          const carouselElement = carousel as any;
          // Try to get the splide instance we stored
          const splideInstance = carouselElement.splideInstance || carouselElement.splide;
          if (splideInstance && typeof splideInstance.destroy === 'function') {
            // console.log('Destroying splide instance');
            splideInstance.destroy();
          }
          // Remove our initialization markers
          carouselElement.removeAttribute('data-splide-init');
          carouselElement.classList.remove('splide--initialized');
        } catch (error) {
          console.warn('Error destroying splide instance:', error);
        }
      });
    };
  }, []);

  // Top Coins data - ERX and QBIT from real smart contract prices, BTC/ETH/MATIC from real API prices
  const topCoins = [
    {
      id: 'ERX',
      name: 'ERX',
      amount: `1.00 ERX`,
      // amount: isConnected ? `${breakdown.erx.amount} ERX` : '0.00 ERX',
      value: currentERXPrice ? `$${(Number(currentERXPrice) / 1e18).toFixed(3)}` : '$0.10',
      change: '3.15%', 
      isPositive: true,
      icon: trendingUpOutline
    },
    {
      id: 'QBIT',
      name: 'Qbit',
      amount: `1.00 QBIT`,
      // amount: isConnected ? `${breakdown.qbit.amount} QBIT` : '20.00 QBIT',
      value: currentQBITPrice ? `$${(Number(currentQBITPrice) / 1e18).toFixed(2)}` : '$20.00',
      change: '1.50%', 
      isPositive: true,
      icon: trendingUpOutline
    },
    {
      id: 'BTC',
      name: 'Bitcoin',
      amount: '1.00 BTC', 
      value: isPricesLoading ? 'Loading...' : (bitcoin?.current_price ? formatPrice(bitcoin.current_price * 1) : '$105,503.30'),
      change: isPricesLoading ? '...' : (bitcoin?.price_change_percentage_24h !== undefined ? formatChange(bitcoin.price_change_percentage_24h) : '2.59%'),
      isPositive: !isPricesLoading && bitcoin?.price_change_percentage_24h !== undefined ? bitcoin.price_change_percentage_24h >= 0 : true,
      icon: !isPricesLoading && bitcoin?.price_change_percentage_24h !== undefined ? (bitcoin.price_change_percentage_24h >= 0 ? trendingUpOutline : trendingDownOutline) : trendingUpOutline
    },
    {
      id: 'ETH',
      name: 'Ethereum',
      amount: '1.00 ETH', 
      value: isPricesLoading ? 'Loading...' : (ethereum?.current_price ? formatPrice(ethereum.current_price * 1) : '$2,546.47'),
      change: isPricesLoading ? '...' : (ethereum?.price_change_percentage_24h !== undefined ? formatChange(ethereum.price_change_percentage_24h) : '2.59%'),
      isPositive: !isPricesLoading && ethereum?.price_change_percentage_24h !== undefined ? ethereum.price_change_percentage_24h >= 0 : true,
      icon: !isPricesLoading && ethereum?.price_change_percentage_24h !== undefined ? (ethereum.price_change_percentage_24h >= 0 ? trendingUpOutline : trendingDownOutline) : trendingUpOutline
    },
    {
      id: 'MATIC',
      name: 'Polygon',
      amount: '1.00 POL', 
      value: isPricesLoading ? 'Loading...' : (polygon?.current_price ? formatPrice(polygon.current_price * 1) : '$0.19'),
      change: isPricesLoading ? '...' : (polygon?.price_change_percentage_24h !== undefined ? formatChange(polygon.price_change_percentage_24h) : '-0.25%'),
      isPositive: !isPricesLoading && polygon?.price_change_percentage_24h !== undefined ? polygon.price_change_percentage_24h >= 0 : false,
      icon: !isPricesLoading && polygon?.price_change_percentage_24h !== undefined ? (polygon.price_change_percentage_24h >= 0 ? trendingUpOutline : trendingDownOutline) : trendingDownOutline
    }
  ]

  // Get recent transactions (limit to 4 for dashboard display)
  const displayTransactions = useMemo(() => {
    // Temporarily use hardcoded data while debugging
    if (!isConnected) {
      return []
    }

    try {
      return recentTransactions.slice(0, 4).map(transaction => {
        // Map transaction icon based on type
        let iconName = arrowUpOutline
        switch (transaction.type) {
          case 'buy':
          case 'receive':
            iconName = arrowDownOutline
            break
          case 'sell':
          case 'send':
            iconName = arrowUpOutline
            break
          case 'trade':
            iconName = swapVerticalOutline
            break
          case 'approve':
            iconName = arrowForwardOutline
            break
        }

        return {
          id: transaction.id,
          type: transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
          name: transaction.asset,
          amount: transaction.value,
          date: transaction.date,
          icon: iconName,
          color: getTransactionColor(transaction.type),
          hasAvatar: false,
          avatar: undefined as string | undefined
        }
      })
    } catch (error) {
      console.error('Error processing transactions:', error)
      return []
    }
  }, [recentTransactions, getTransactionColor, isConnected])

  // Cards data from the HTML with correct order and values
  const cards = [
    { id: 1, type: 'card-vip-s7', balance: '$4,000', package: 'VIP', group: '7 Star', price: '$2000' },
    { id: 2, type: 'card-classic-s1', balance: '$12', package: 'Classic', group: '1 Star', price: '$10' },
    { id: 3, type: 'card-vip-s2', balance: '$120', package: 'VIP', group: '2 Star', price: '$60' },
    { id: 4, type: 'card-classic-s4', balance: '$1,500', package: 'Classic', group: '4 Star', price: '$100' },
    { id: 5, type: 'card-vip-s5', balance: '$150', package: 'VIP', group: '5 Star', price: '$600' },
    { id: 6, type: 'card-classic-s6', balance: '$300', package: 'Classic', group: '6 Star', price: '$500' }
  ]

  // Send Money users data (currently unused)
  // const sendMoneyUsers = [
  //   { id: 1, name: 'Jurrien', avatar: 'assets/img/sample/avatar/avatar2.jpg' },
  //   { id: 2, name: 'Elwin', avatar: 'assets/img/sample/avatar/avatar3.jpg' },
  //   { id: 3, name: 'Alma', avatar: 'assets/img/sample/avatar/avatar4.jpg' },
  //   { id: 4, name: 'Justine', avatar: 'assets/img/sample/avatar/avatar5.jpg' },
  //   { id: 5, name: 'Maria', avatar: 'assets/img/sample/avatar/avatar6.jpg' },
  //   { id: 6, name: 'Pamela', avatar: 'assets/img/sample/avatar/avatar7.jpg' },
  //   { id: 7, name: 'Neville', avatar: 'assets/img/sample/avatar/avatar8.jpg' },
  //   { id: 8, name: 'Alex', avatar: 'assets/img/sample/avatar/avatar9.jpg' },
  //   { id: 9, name: 'Stina', avatar: 'assets/img/sample/avatar/avatar10.jpg' }
  // ]

  return (
    <>
      {/* Temporary Balance Debug Panel */}
      {/* <BalanceDebugPanel /> */}
      
      {/* Wallet Card Section */}
      <div className="section wallet-card-section pt-1" style={{ position: 'relative' }}>
        {/* Mobile wallet connection button - positioned at the right of wallet-card-section */}
        {isMobile() && (
          <div style={{ 
            position: 'absolute',
            top: '35px',
            right: '40px',
            zIndex: 10
          }}>
            <WalletConnection 
              compact={true}
              showBalance={false}
            />
          </div>
        )}
        <div className="wallet-card">
          <div className="balance">
            <div className="left">
              <span className="title">Total Balance</span>
              <h1 className="total">$ {isConnected ? (isPortfolioLoading ? 'Loading...' : totalValue) : '0.00'}</h1>
              
     

            </div>
            {/* <div className="right">
              <Link to="/exchange" className="button">
                <IonIcon icon={addOutline} />
              </Link>
            </div> */}
          </div>
          <div className="wallet-footer">
            <div className="item">
              <a 
                href="#" 
                data-bs-toggle="modal" 
                data-bs-target="#withdrawActionSheet"
                onClick={(e) => {
                  if (!isConnected) {
                    e.preventDefault()
                    alert('Please connect your wallet first')
                  }
                }}
              >
                <div className="icon-wrapper" style={{ background: 'linear-gradient(to right, #00F2C3, #00C9E0)' }}>
                  <IonIcon icon={arrowDownOutline} />
                </div>
                <strong>Receive</strong>
              </a>
            </div>
            <div className="item">
              <a 
                href="#" 
                data-bs-toggle="modal" 
                data-bs-target="#sendActionSheet"
                onClick={(e) => {
                  if (!isConnected) {
                    e.preventDefault()
                    alert('Please connect your wallet first')
                  }
                }}
              >
                <div className="icon-wrapper" style={{ background: 'linear-gradient(to right, #F020A0, #A020F0)' }}>
                  <IonIcon icon={arrowForwardOutline} />
                </div>
                <strong>Send</strong>
              </a>
            </div>
            <div className="item">
              <a href="#" onClick={() => false} style={{ cursor: 'default' }}>
                <div className="icon-wrapper" style={{ background: 'linear-gradient(to right, #4D4DFF, #2020B0)' }}>
                  <IonIcon icon={cardOutline} />
                </div>
                <strong>Plans</strong>
              </a>
            </div>
            <div className="item">
              <a href="#" data-bs-toggle="modal" data-bs-target="#exchangeActionSheet">
                <div className="icon-wrapper" style={{ background: 'linear-gradient(to right, #FFD700, #FFA500)' }}>
                  <IonIcon icon={swapVertical} />
                </div>
                <strong>Exchange</strong>
              </a>
            </div>
          </div>
        </div>
      </div>

{/* Portfolio -- نسخه نهایی با چیدمان جدید */}
<div className="section mt-4">
    <div className="section-heading">
        <h2 className="title">Portfolio</h2>
        {(isPricesLoading || !currentERXPrice || !currentQBITPrice) && (
            <small className="text-muted ms-2">
                <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
            </small>
        )}
    </div>
    <div className="card">
        <ul className="listview image-listview transparent flush">
            {[
                { symbol: 'ERX', price: currentERXPrice ? formatUnits(currentERXPrice, 18) : '0.00', logo: erxLogo, contractAddress: null },
                { symbol: 'QBit', price: currentQBITPrice ? formatUnits(currentQBITPrice, 18) : '0.00', logo: qbitLogo, contractAddress: null },
                { symbol: 'POL', price: polygon?.current_price ? polygon.current_price.toFixed(2) : '0.00', logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png', contractAddress: 'native' },
                { symbol: 'USDT', price: '1.00', logo: null, contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
                { symbol: 'DAI', price: '1.00', logo: null, contractAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' },
                { symbol: 'USDC', price: '1.00', logo: null, contractAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' }
            ].map((asset) => {
                const alwaysShow = ['erx', 'qbit', 'dai', 'pol'];
                let assetData;
                if (asset.symbol.toLowerCase() === 'pol') {
                    assetData = breakdown.native;
                } else {
                    assetData = breakdown[asset.symbol.toLowerCase()];
                }
                
                if (!assetData || !assetData.amount || parseFloat(assetData.amount) === 0) {
                    if (!alwaysShow.includes(asset.symbol.toLowerCase())) {
                        return null;
                    }
                    assetData = { amount: '0', value: '0' };
                }
                
                const getLogoSrc = (asset) => {
                    if (asset.logo) return asset.logo;
                    if (asset.contractAddress && asset.contractAddress !== 'native') {
                        return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/${asset.contractAddress}/logo.png`;
                    }
                    return 'assets/img/sample/brand/1.jpg';
                };

                return (
                    <li key={asset.symbol}>
                        <div className="item">
                            <div className="image-container">
                                <img src={getLogoSrc(asset)} alt={`${asset.symbol} logo`} className="image" />
                            </div>
                            <div className="in">
                                {/* ستون نماد و قیمت واحد (اکنون در سمت چپ) */}
                                <div>
                                    <strong>{asset.symbol}</strong>
                                    <div className="text-small text-secondary">
                                        ${parseFloat(asset.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                    </div>
                                </div>
                                {/* ستون موجودی و ارزش کل (اکنون در سمت راست) */}
                                <div className="text-end">
                                    <strong>
                                        {/* نماد ارز از اینجا حذف شده است */}
                                        {parseFloat(assetData.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                    </strong>
                                    <div className="text-small">
                                        $ {parseFloat(assetData.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    </div>
</div>

      {/* Watchlist Section */}
      <div className="section-heading padding mt-4">
        <h2 className="title">Watchlist</h2>
        {/* <Link to="/coin-detail" className="link">View All</Link> */}
      </div>
      <div className="carousel-multiple splide" data-max-items="5">
        <div className="splide__track">
          <ul className="splide__list" style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0 }}>
            {watchlistCoins.map((coin) => (
              <li key={coin.stableId} className="splide__slide" style={{ flex: '0 0 auto', minWidth: '200px', maxWidth: '250px' }}>
                <div className="card coinbox" data-stable-id={coin.stableId}>
                  <div className="card-body pb-0">
                    <h4 data-coin-name={coin.stableId}>{coin.name}</h4>
                    <div className="text" data-coin-price={coin.stableId}>{coin.price}</div>
                    <div className="change">
                      <span className={`badge ${coin.isPositive ? 'badge-success' : 'badge-danger'}`}>
                        <IonIcon icon={coin.isPositive ? arrowUpOutline : arrowDownOutline} />
                        {coin.change}
                      </span>
                    </div>
                  </div>
                  <CoinChart
                    coinId={coin.id}
                    data={coin.chartData}
                    isPositive={coin.isPositive}
                    height={80}
                    currentPrice={coin.currentPrice}
                    symbol={coin.symbol}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <RecentTransactions />

      {/* My Cards Section */}
      <div className="section full mt-4">
        <div className="section-heading padding">
        <h2 className="title">My Packages</h2>
                  <a href="#" className="link" style={{ opacity: 0.5, pointerEvents: 'none' }}>View All</a>
        </div>
        <div className="carousel-single splide">
          <div className="splide__track">
            <ul className="splide__list">
              {cards.map((card) => (
                <li key={card.id} className="splide__slide">
                  <div className={`card-block ${card.type}`}>
                    <div className="card-main">
                      <div className="card-button dropdown">
                        <button type="button" className="btn btn-link btn-icon" data-bs-toggle="dropdown">
                          <IonIcon icon={ellipsisHorizontal} />
                        </button>
                        <div className="dropdown-menu dropdown-menu-end">
                          <a className="dropdown-item" href="#"><IonIcon icon={pencilOutline} />Edit</a>
                          <a className="dropdown-item" href="#"><IonIcon icon={closeOutline} />Remove</a>
                          <a className="dropdown-item" href="#"><IonIcon icon={arrowUpCircleOutline} />Upgrade</a>
                        </div>
                      </div>
                      <div className="balance">
                        <span className="label">CREDIT</span>
                        <h1 className="title">{card.balance}</h1>
                      </div>
                      <div className="in">
                        <div className="card-number">
                          <span className="label">PACKAGE</span>{card.package}
                        </div>
                        <div className="bottom">
                          <div className="card-expiry">
                            <span className="label">GROUP</span>{card.group}
                          </div>
                          <div className="card-ccv">
                            <span className="label">PRICE</span>{card.price}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Send Money Section */}
      {/* <div className="section full mt-4">
        <div className="section-heading padding">
          <h2 className="title">Send Money</h2>
          <a href="#" className="link">Add New</a>
        </div>
        <div className="carousel-small splide">
          <div className="splide__track">
            <ul className="splide__list">
              {sendMoneyUsers.map((user) => (
                <li key={user.id} className="splide__slide">
                  <a href="#">
                    <div className="user-card">
                      <img src={user.avatar} alt="img" className="imaged w-100" />
                      <strong>{user.name}</strong>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div> */}

      {/* Watchlist Modal */}
      <div className="modal fade action-sheet" id="actionSheetWatchlist" tabIndex={-1} role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">BTC/USD</h5>
              <h3 className="text-center mb-05 fontsize-headingLarge text-success">$38,509.44</h3>
              <div className="text-muted text-center mb-1 fontsize-caption">Added 28 days ago</div>
            </div>
            <div className="modal-body">
              <ul className="action-button-list">
                <li>
                  <Link to="/exchange" className="btn btn-list">
                    <span>Buy</span>
                  </Link>
                </li>
                <li>
                  <Link to="/exchange" className="btn btn-list">
                    <span>Sell</span>
                  </Link>
                </li>
                <li className="action-divider"></li>
                <li>
                  <a href="#" className="btn btn-list text-danger" data-bs-dismiss="modal">
                    <span>Close</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* App Footer */}
      <div className="appFooter">
        <div className="footer-title">
          Copyright © EuphoriaX 2025. All Rights Reserved.
        </div>
      </div>

      {/* Receive Money Modal */}
      <div className="modal fade action-sheet" id="withdrawActionSheet" tabIndex={-1} role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Receive Money</h5>
            </div>
            <div className="modal-body">
              <div className="action-sheet-content">
                {!isConnected ? (
                  <div className="text-center">
                    <div className="mb-3">
                      <IonIcon icon={arrowDownOutline} style={{ fontSize: '48px', color: '#6c757d' }} />
                    </div>
                    <h6>Connect Your Wallet</h6>
                    <p className="text-muted">Connect your wallet to receive crypto payments</p>
                    <WalletConnection 
                      compact={false}
                      showBalance={false}
                    />
                  </div>
                ) : (
                  <form>
                    <div className="form-group basic">
                      <div className="input-wrapper">
                        <label className="label" htmlFor="network-select">Network</label>
                        <select className="form-control custom-select" id="network-select" disabled>
                          <option value="polygon">Polygon</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group basic">
                      <div className="input-wrapper">
                        <label className="label" htmlFor="crypto-select">Crypto</label>
                        <select className="form-control custom-select" id="crypto-select">
                          <option value="" selected>Select a currency...</option>
                          <option value="ERX">ERX</option>
                          <option value="QBit">QBit</option>
                          <option value="MATIC">POL</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group basic" id="wallet-address-container">
                      <label className="label" id="wallet-address-label">Your Wallet Address</label>
                      <div className="input-group">
                        <input 
                          type="text" 
                          className="form-control" 
                          id="wallet-address-input" 
                          value={address || ''} 
                          readOnly
                          placeholder="Your wallet address will appear here"
                        />
                      </div>
                    </div>
                    <div className="form-group basic mt-2">
                      <button 
                        type="button" 
                        id="copy-address-btn" 
                        className="btn btn-primary btn-block btn-lg"
                        onClick={() => {
                          if (address) {
                            navigator.clipboard.writeText(address)
                            alert('Wallet address copied to clipboard!')
                          }
                        }}
                      >
                        Copy Address
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Send Money Modal */}
      <div className="modal fade action-sheet" id="sendActionSheet" tabIndex={-1} role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Send Money</h5>
            </div>
            <div className="modal-body">
              <div className="action-sheet-content">
                {!isConnected ? (
                  <div className="text-center">
                    <div className="mb-3">
                      <IonIcon icon={arrowForwardOutline} style={{ fontSize: '48px', color: '#6c757d' }} />
                    </div>
                    <h6>Connect Your Wallet</h6>
                    <p className="text-muted">Connect your wallet to send crypto payments</p>
                    <WalletConnection 
                      compact={false}
                      showBalance={false}
                    />
                  </div>
                ) : (
                  <form id="send-money-form">
                    <div className="form-group basic">
                      <div className="input-wrapper">
                        <label className="label" htmlFor="asset-select-send">From</label>
                        <select 
                          className="form-control custom-select" 
                          id="asset-select-send"
                          value={sendForm.asset}
                          onChange={(e) => handleSendFormChange('asset', e.target.value)}
                          disabled={isTransferLoading}
                        >
                          <option value="ERX">ERX</option>
                          <option value="QBIT">QBIT</option>
                          <option value="MATIC">POL</option>
                          {/* Add stablecoins if available */}
                          {stablecoinAddresses && stablecoinAddresses.length > 0 && stablecoinAddresses
                            .map(address => ({ address, metadata: getStablecoinWithMetadata(address) as StablecoinMetadata }))
                            .sort((a, b) => a.metadata.priority - b.metadata.priority)
                            .map(({ address, metadata }) => (
                              <option key={address} value={address}>
                                {metadata.symbol}
                              </option>
                            ))}
                          {(!stablecoinAddresses || stablecoinAddresses.length === 0) && (
                            <option disabled>Loading stablecoins...</option>
                          )}
                        </select>
                        <div className="form-text text-muted">
                          Available: {parseFloat(getAvailableBalance(sendForm.asset)).toFixed(6)} {getAssetDisplaySymbol(sendForm.asset)}
                          {parseFloat(getAvailableBalance(sendForm.asset)) === 0 && (
                            <span className="text-warning ms-2">⚠️ No balance available</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="form-group basic">
                      <div className="input-wrapper">
                        <label className="label" htmlFor="recipient-address">To Address</label>
                        <input 
                          type="text" 
                          className={`form-control ${
                            addressValidation.state === 'invalid' ? 'is-invalid' :
                            addressValidation.state === 'valid' ? 'is-valid' :
                            addressValidation.state === 'warning' ? 'is-warning' : ''
                          }`}
                          id="recipient-address" 
                          placeholder="Enter recipient wallet address (0x...)"
                          value={sendForm.recipientAddress}
                          onChange={(e) => handleSendFormChange('recipientAddress', e.target.value)}
                          disabled={isTransferLoading}
                        />
                        {addressValidation.showCheckmark && addressValidation.state === 'valid' && (
                          <div className="form-icon" style={{ 
                            position: 'absolute', 
                            right: '12px', 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            color: '#28a745' 
                          }}>
                            <IonIcon icon={checkmarkCircleOutline} />
                          </div>
                        )}
                        {addressValidation.message && (
                          <div className={`form-text ${
                            addressValidation.state === 'invalid' ? 'text-danger' :
                            addressValidation.state === 'valid' ? 'text-success' :
                            addressValidation.state === 'warning' ? 'text-warning' : ''
                          }`}>
                            {addressValidation.message}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group basic">
                      <div className="input-wrapper">
                        <label className="label" htmlFor="send-amount">Amount</label>
                        <div className="input-group">
                          <input 
                            type="number" 
                            className={`form-control ${hasInsufficientBalance(sendForm.asset, sendForm.amount) ? 'is-invalid' : ''}`}
                            id="send-amount" 
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            value={sendForm.amount}
                            onChange={(e) => handleSendFormChange('amount', e.target.value)}
                            disabled={isTransferLoading}
                          />
                          <button 
                            type="button" 
                            className="btn btn-outline-secondary" 
                            onClick={() => {
                              const maxBalance = getAvailableBalance(sendForm.asset)
                              // For POL, leave a small amount for gas fees
                              if (sendForm.asset === 'MATIC' || sendForm.asset === 'POL') {
                                const gasReserve = 0.01 // Reserve 0.01 POL for gas
                                const availableForSend = Math.max(0, parseFloat(maxBalance) - gasReserve)
                                handleSendFormChange('amount', availableForSend.toString())
                              } else {
                                handleSendFormChange('amount', maxBalance)
                              }
                            }}
                            disabled={isTransferLoading || parseFloat(getAvailableBalance(sendForm.asset)) <= 0}
                          >
                            Max
                          </button>
                        </div>
                        {hasInsufficientBalance(sendForm.asset, sendForm.amount) && (
                          <div className="form-text text-danger">
                            Insufficient balance. You have {parseFloat(getAvailableBalance(sendForm.asset)).toFixed(6)} {getAssetDisplaySymbol(sendForm.asset)} available.
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group basic mt-2">
                      <button 
                        type="button" 
                        className={`btn btn-primary btn-block btn-lg ${isTransferLoading ? 'btn-loading' : ''}`}
                        onClick={handleSendMoney}
                        disabled={
                          isTransferLoading || 
                          !sendForm.recipientAddress.trim() || 
                          !sendForm.amount || 
                          addressValidation.state === 'invalid' ||
                          hasInsufficientBalance(sendForm.asset, sendForm.amount)
                        }
                      >
                        {isTransferLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending...
                          </>
                        ) : (
                          'Send'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Modal Placeholder */}
      <div className="modal fade action-sheet" id="exchangeActionSheet" tabIndex={-1} role="dialog">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Exchange</h5>
            </div>
            <div className="modal-body">
              <div className="action-sheet-content text-center">
                <div className="mb-3">
                  <IonIcon icon={swapVertical} style={{ fontSize: '48px', color: '#6c757d' }} />
                </div>
                <h6>Exchange Feature</h6>
                <p className="text-muted">Crypto exchange functionality</p>
                <button 
                  className="btn btn-primary"
                  onClick={handleExchangeNavigation}
                >
                  Go to Exchange Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Error Modal */}
      <TransactionErrorModal
        isVisible={showErrorModal}
        error={currentError}
        onClose={() => {
          setShowErrorModal(false)
          setCurrentError(null)
          resetTransfer() // Clear transfer state when closing error modal
          document.body.style.overflow = 'unset'
        }}
        onRetry={async () => {
          setShowErrorModal(false)
          setCurrentError(null)
          setLastProcessedError(null)
          setLastSuccessHash(null)
          resetTransfer()
          
          // Small delay to ensure state is cleared
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Retry the transfer with the current form data
          try {
            const addressValidationResult = validateWalletAddress(sendForm.recipientAddress.trim())
            const normalizedAddress = addressValidationResult.normalizedAddress || sendForm.recipientAddress.trim()
            await transfer(sendForm.asset, normalizedAddress, sendForm.amount)
          } catch (error: any) {
            // For retry operations, always show error modal (including user cancellations)
            // This provides consistent feedback to the user
            setCurrentError(error)
            setShowErrorModal(true)
            setLastProcessedError(error.toString())
            
            if (process.env.NODE_ENV === 'development') {
              console.log('Retry failed, showing error modal:', error)
            }
          }
        }}
      />

      {/* Transaction Success Modal */}
      <TransactionSuccessModal
        isVisible={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          setTransactionHash(null)
          // Clear error state when closing success modal
          setShowErrorModal(false)
          setCurrentError(null)
          resetTransfer() // Clear transfer state completely
          // Ensure body scroll is restored when success modal is closed
          document.body.style.overflow = 'unset'
        }}
        transactionHash={transactionHash || undefined}
        fromCurrency={sendForm.asset}
        amount={sendForm.amount}
      />

      {/* Development Tools - Address Validation Test Panel */}
      

    </>
  )
}

