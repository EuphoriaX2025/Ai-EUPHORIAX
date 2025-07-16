/**
 * Mobile detection and wallet utilities
 */

// Detect if the user is on a mobile device
export const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    ) || window.innerWidth <= 768
}

// Detect if user is on iOS
export const isIOS = (): boolean => {
    if (typeof window === 'undefined') return false

    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

// Detect if user is on Android
export const isAndroid = (): boolean => {
    if (typeof window === 'undefined') return false

    return /Android/i.test(navigator.userAgent)
}

// Check if MetaMask mobile app is available
export const isMetaMaskMobileApp = (): boolean => {
    if (typeof window === 'undefined') return false

    return (
        window.ethereum?.isMetaMask &&
        (isIOS() || isAndroid()) &&
        !window.ethereum?.isDesktop
    )
}

// Check if Trust Wallet is available
export const isTrustWallet = (): boolean => {
    if (typeof window === 'undefined') return false

    return window.ethereum?.isTrust || (window as any).trustwallet !== undefined
}

// Check if Coinbase Wallet is available
export const isCoinbaseWallet = (): boolean => {
    if (typeof window === 'undefined') return false

    return window.ethereum?.isCoinbaseWallet || (window as any).coinbaseWalletExtension !== undefined
}

// Generate wallet deep links for mobile
export const getWalletDeepLink = (walletType: string, dappUrl: string): string => {
    const encodedUrl = encodeURIComponent(dappUrl)

    switch (walletType.toLowerCase()) {
        case 'metamask':
            return `https://metamask.app.link/dapp/${dappUrl.replace('https://', '')}`

        case 'trust':
        case 'trustwallet':
            return `trust://open_url?coin_id=60&url=${encodedUrl}`

        case 'coinbase':
            return `https://go.cb-w.com/dapp?cb_url=${encodedUrl}`

        case 'rainbow':
            return `rainbow://open?url=${encodedUrl}`

        default:
            return dappUrl
    }
}

// Check if wallet is installed on mobile
export const isWalletInstalled = (walletType: string): boolean => {
    if (typeof window === 'undefined') return false

    switch (walletType.toLowerCase()) {
        case 'metamask':
            return window.ethereum?.isMetaMask || false

        case 'trust':
        case 'trustwallet':
            return isTrustWallet()

        case 'coinbase':
            return isCoinbaseWallet()

        default:
            return false
    }
}

// Get user agent info for debugging
export const getUserAgentInfo = () => {
    if (typeof window === 'undefined') return {}

    return {
        userAgent: navigator.userAgent,
        isMobile: isMobile(),
        isIOS: isIOS(),
        isAndroid: isAndroid(),
        isMetaMaskMobile: isMetaMaskMobileApp(),
        isTrustWallet: isTrustWallet(),
        isCoinbaseWallet: isCoinbaseWallet(),
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
    }
}

// Enhanced mobile wallet detection
export const detectWalletEnvironment = () => {
    if (typeof window === 'undefined') return { environment: 'server', wallets: [] }

    const detectedWallets = []
    const environment = isMobile() ? 'mobile' : 'desktop'

    // Check for injected wallets
    if (window.ethereum) {
        if (window.ethereum.isMetaMask) detectedWallets.push('MetaMask')
        if (window.ethereum.isTrust) detectedWallets.push('Trust Wallet')
        if (window.ethereum.isCoinbaseWallet) detectedWallets.push('Coinbase Wallet')
        if (window.ethereum.isBraveWallet) detectedWallets.push('Brave Wallet')
        if (window.ethereum.isRabby) detectedWallets.push('Rabby')
    }

    // Check for mobile app browsers
    if (isMobile()) {
        const userAgent = navigator.userAgent.toLowerCase()
        if (userAgent.includes('trustwallet')) detectedWallets.push('Trust Wallet App Browser')
        if (userAgent.includes('metamask')) detectedWallets.push('MetaMask App Browser')
        if (userAgent.includes('coinbase')) detectedWallets.push('Coinbase Wallet App Browser')
    }

    return {
        environment,
        wallets: [...new Set(detectedWallets)], // Remove duplicates
        hasInjectedWallet: !!window.ethereum,
        isWalletBrowser: detectedWallets.some(w => w.includes('App Browser'))
    }
}

// Mobile-specific wallet connection strategies
export const getMobileWalletStrategy = (walletType: string) => {
    const dappUrl = window.location.href

    const strategies: Record<string, any> = {
        metamask: {
            name: 'MetaMask',
            deepLink: getWalletDeepLink('metamask', dappUrl),
            fallbackUrl: 'https://metamask.io/download/',
            detectInstalled: () => window.ethereum?.isMetaMask,
            supportsWalletConnect: true
        },
        trust: {
            name: 'Trust Wallet',
            deepLink: getWalletDeepLink('trust', dappUrl),
            fallbackUrl: 'https://trustwallet.com/',
            detectInstalled: () => isTrustWallet(),
            supportsWalletConnect: true
        },
        coinbase: {
            name: 'Coinbase Wallet',
            deepLink: getWalletDeepLink('coinbase', dappUrl),
            fallbackUrl: 'https://www.coinbase.com/wallet',
            detectInstalled: () => isCoinbaseWallet(),
            supportsWalletConnect: true
        },
        walletconnect: {
            name: 'WalletConnect',
            qrCodeRequired: true,
            supportsWalletConnect: true,
            universalLink: true
        }
    }

    return strategies[walletType.toLowerCase()] || null
}

// Create mobile-optimized connection modal
export const createMobileWalletModal = (onWalletSelect: (wallet: string) => void) => {
    const walletDetection = detectWalletEnvironment()
    const strategies = ['metamask', 'trust', 'coinbase', 'walletconnect']

    const modalHTML = `
    <div class="mobile-wallet-modal" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      align-items: flex-end;
      padding: 20px;
    ">
      <div class="modal-content" style="
        background: white;
        border-radius: 20px 20px 0 0;
        width: 100%;
        max-height: 70vh;
        overflow-y: auto;
        padding: 20px;
      ">
        <div class="modal-header" style="text-align: center; margin-bottom: 20px;">
          <h3>Connect Wallet</h3>
          <button class="close-btn" onclick="this.closest('.mobile-wallet-modal').remove()" style="
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
          ">&times;</button>
        </div>
        
        <div class="detected-info" style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
          <small style="color: #666;">
            Environment: ${walletDetection.environment} | 
            Detected: ${walletDetection.wallets.length ? walletDetection.wallets.join(', ') : 'None'}
          </small>
        </div>
        
        <div class="wallet-options">
          ${strategies.map(wallet => {
        const strategy = getMobileWalletStrategy(wallet)
        if (!strategy) return ''

        const isInstalled = strategy.detectInstalled ? strategy.detectInstalled() : false
        const statusText = isInstalled ? 'Installed' : 'Install Required'
        const statusColor = isInstalled ? '#28a745' : '#ffc107'

        return `
              <button class="wallet-option" onclick="selectWallet('${wallet}')" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                padding: 15px;
                margin-bottom: 10px;
                border: 1px solid #ddd;
                border-radius: 12px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
              " onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                <div style="display: flex; align-items: center;">
                  <div style="font-weight: 500;">${strategy.name}</div>
                </div>
                <div style="font-size: 12px; color: ${statusColor};">${statusText}</div>
              </button>
            `
    }).join('')}
        </div>
        
        <div class="help-text" style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
          ${walletDetection.environment === 'mobile' ?
            'On mobile, you can either use an installed wallet app or scan QR code with WalletConnect' :
            'Choose your preferred wallet to connect'
        }
        </div>
      </div>
    </div>
  `

    // Add to DOM
    const modalDiv = document.createElement('div')
    modalDiv.innerHTML = modalHTML
    document.body.appendChild(modalDiv)

        // Add global function for wallet selection
        ; (window as any).selectWallet = (wallet: string) => {
            onWalletSelect(wallet)
            modalDiv.remove()
        }

    return modalDiv
}
