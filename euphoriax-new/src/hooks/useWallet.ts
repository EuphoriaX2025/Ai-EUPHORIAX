import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi'
import { useConnectModal, useAccountModal, useChainModal } from '@rainbow-me/rainbowkit'
import { polygon, polygonMumbai } from 'wagmi/chains'
import { formatEther } from 'viem'

export const useWallet = () => {
    const { address, isConnected, isConnecting } = useAccount()
    const { connect, connectors, error: connectError } = useConnect()
    const { disconnect } = useDisconnect()
    const { openConnectModal } = useConnectModal()
    const { openAccountModal } = useAccountModal()
    const { openChainModal } = useChainModal()
    const chainId = useChainId()
    const { switchChain } = useSwitchChain()

    // Get MATIC balance
    const { data: balance, isLoading: balanceLoading } = useBalance({
        address: address,
    })

    // Get ERX token balance (if address is available)
    const { data: erxBalance, isLoading: erxBalanceLoading } = useBalance({
        address: address,
        token: '0x11113847E021391e127B96be13070C7eF2931111', // ERX token address
    })

    // Get QBIT token balance (if address is available)
    const { data: qbitBalance, isLoading: qbitBalanceLoading } = useBalance({
        address: address,
        token: '0x2222d23f6AF73d835727cA5233604af03Fd12222', // QBIT token address
    })

    const isOnPolygon = chainId === polygon.id
    const isOnPolygonMumbai = chainId === polygonMumbai.id
    const isOnSupportedChain = isOnPolygon || isOnPolygonMumbai

    const switchToPolygon = () => {
        switchChain({ chainId: polygon.id })
    }

    const switchToPolygonMumbai = () => {
        switchChain({ chainId: polygonMumbai.id })
    }

    const formatBalance = (balance: bigint | undefined) => {
        if (!balance) return '0'
        return formatEther(balance).slice(0, 8) // Show up to 8 decimal places
    }

    // Mobile-specific connection helpers
    const connectWithMobileOptimization = async (connectorId?: string) => {
        try {
            if (connectorId) {
                const connector = connectors.find(c => c.id === connectorId)
                if (connector) {
                    await connect({ connector })
                    return
                }
            }

            // Fallback to opening connect modal
            openConnectModal?.()
        } catch (error) {
            console.error('Mobile connection error:', error)
            // Fallback to regular connection flow
            openConnectModal?.()
        }
    }

    const handleMobileWalletDeepLink = (walletType: string) => {
        const currentUrl = window.location.href
        let deepLink = ''

        switch (walletType.toLowerCase()) {
            case 'metamask':
                deepLink = `https://metamask.app.link/dapp/${currentUrl.replace('https://', '')}`
                break
            case 'trust':
                deepLink = `trust://open_url?coin_id=60&url=${encodeURIComponent(currentUrl)}`
                break
            case 'coinbase':
                deepLink = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(currentUrl)}`
                break
            case 'rainbow':
                deepLink = `rainbow://open?url=${encodeURIComponent(currentUrl)}`
                break
            default:
                console.warn(`Deep link not configured for ${walletType}`)
                return false
        }

        try {
            window.location.href = deepLink
            return true
        } catch (error) {
            console.error('Failed to open deep link:', error)
            return false
        }
    }

    // Enhanced connection status
    const getConnectionStatus = () => {
        if (isConnecting) return 'connecting'
        if (!isConnected) return 'disconnected'
        if (!isOnSupportedChain) return 'wrong-network'
        return 'connected'
    }

    // Formatted balances with loading states
    const getFormattedBalance = () => {
        if (balanceLoading) return 'Loading...'
        if (!balance) return '0 MATIC'
        return `${formatBalance(balance.value)} ${balance.symbol}`
    }

    const getFormattedERXBalance = () => {
        if (erxBalanceLoading) return 'Loading...'
        if (!erxBalance) return '0 ERX'
        return `${formatBalance(erxBalance.value)} ${erxBalance.symbol}`
    }

    const getFormattedQBITBalance = () => {
        if (qbitBalanceLoading) return 'Loading...'
        if (!qbitBalance) return '0 QBIT'
        return `${formatBalance(qbitBalance.value)} ${qbitBalance.symbol}`
    }

    return {
        // Connection state
        address,
        isConnected,
        isConnecting,
        chainId,
        isOnPolygon,
        isOnPolygonMumbai,
        isOnSupportedChain,

        // Connection actions
        connect,
        disconnect,
        connectors,
        connectError,

        // Modal controls
        openConnectModal,
        openAccountModal,
        openChainModal,

        // Chain switching
        switchToPolygon,
        switchToPolygonMumbai,
        switchChain,

        // Balances
        balance,
        erxBalance,
        qbitBalance,
        balanceLoading,
        erxBalanceLoading,
        qbitBalanceLoading,

        // Formatted balances
        getFormattedBalance,
        getFormattedERXBalance,
        getFormattedQBITBalance,
        formatBalance,

        // Mobile-specific
        connectWithMobileOptimization,
        handleMobileWalletDeepLink,

        // Connection status
        getConnectionStatus,
    }
}