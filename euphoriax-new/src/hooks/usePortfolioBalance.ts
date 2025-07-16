import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { useEuphoriaExchange } from './useEuphoriaExchange'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

export const usePortfolioBalance = () => {
    const { isConnected, address } = useAccount()
    const location = useLocation()

    // Only load exchange data on pages that need it (Dashboard, Exchange)
    const shouldLoadExchangeData = useMemo(() => {
        const path = location.pathname
        return path === '/' || path === '/dashboard' || path === '/exchange' ||
            (path.startsWith('/coin/') && (path.includes('/coin/ERX') || path.includes('/coin/QBIT')))
    }, [location.pathname])

    // Always call useEuphoriaExchange to follow Rules of Hooks
    const {
        stablecoinAddresses,
        useStablecoinInfo,
        useERXBalance,
        useQBITBalance,
        useCurrentERXPrice,
        useQBITCurrentPrice,
        isLoadingStablecoins,
    } = useEuphoriaExchange()

    // Get ERX and QBIT balances - only if we should load exchange data
    const { data: erxBalance, isLoading: erxLoading } = useERXBalance()
    const { data: qbitBalance, isLoading: qbitLoading } = useQBITBalance()

    // Get current prices - only if we should load exchange data
    const { data: erxPrice } = useCurrentERXPrice()
    const { data: qbitPrice } = useQBITCurrentPrice()

    // Get all stablecoin balances - only if we should load exchange data
    const daiInfo = useStablecoinInfo(
        shouldLoadExchangeData ? stablecoinAddresses?.find(addr =>
            addr.toLowerCase() === '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063' // DAI
        ) : undefined
    )

    const usdcInfo = useStablecoinInfo(
        shouldLoadExchangeData ? stablecoinAddresses?.find(addr =>
            addr.toLowerCase() === '0x2791bca1f2de4661ed88a30c99a7a9449aa84174' || // USDC.e
            addr.toLowerCase() === '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359'    // USDC native
        ) : undefined
    )

    const usdtInfo = useStablecoinInfo(
        shouldLoadExchangeData ? stablecoinAddresses?.find(addr =>
            addr.toLowerCase() === '0xc2132d05d31c914a87c6611c10748aeb04b58e8f' // USDT
        ) : undefined
    )

    // Calculate total portfolio value
    const portfolioData = useMemo(() => {
        if (!isConnected || !address) {
            return {
                totalValue: '0.00',
                breakdown: {
                    erx: { amount: '0.00', value: '0.00' },
                    qbit: { amount: '0.00', value: '0.00' },
                    dai: { amount: '0.00', value: '0.00' },
                    usdc: { amount: '0.00', value: '0.00' },
                    usdt: { amount: '0.00', value: '0.00' },
                },
                isLoading: false,
            }
        }

        // If we shouldn't load exchange data, return empty portfolio
        if (!shouldLoadExchangeData) {
            return {
                totalValue: '0.00',
                breakdown: {
                    erx: { amount: '0.00', value: '0.00' },
                    qbit: { amount: '0.00', value: '0.00' },
                    dai: { amount: '0.00', value: '0.00' },
                    usdc: { amount: '0.00', value: '0.00' },
                    usdt: { amount: '0.00', value: '0.00' },
                },
                isLoading: false,
            }
        }

        const isLoading = erxLoading || qbitLoading || isLoadingStablecoins
        let totalValue = 0

        // ERX calculation
        const erxAmount = erxBalance ? Number(formatUnits(erxBalance, 18)) : 0
        const erxPriceUSD = erxPrice ? Number(formatUnits(erxPrice, 18)) : 0
        const erxValue = erxAmount * erxPriceUSD

        // QBIT calculation
        const qbitAmount = qbitBalance ? Number(formatUnits(qbitBalance, 18)) : 0
        const qbitPriceUSD = qbitPrice ? Number(formatUnits(qbitPrice, 18)) : 0
        const qbitValue = qbitAmount * qbitPriceUSD

        // DAI calculation (1:1 with USD)
        const daiAmount = daiInfo?.balance ? Number(formatUnits(daiInfo.balance, daiInfo.decimals)) : 0
        const daiValue = daiAmount // DAI ≈ $1

        // USDC calculation (1:1 with USD)
        const usdcAmount = usdcInfo?.balance ? Number(formatUnits(usdcInfo.balance, usdcInfo.decimals)) : 0
        const usdcValue = usdcAmount // USDC ≈ $1

        // USDT calculation (1:1 with USD)
        const usdtAmount = usdtInfo?.balance ? Number(formatUnits(usdtInfo.balance, usdtInfo.decimals)) : 0
        const usdtValue = usdtAmount // USDT ≈ $1

        // Calculate total
        totalValue = erxValue + qbitValue + daiValue + usdcValue + usdtValue

        return {
            totalValue: totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            breakdown: {
                erx: {
                    amount: erxAmount.toFixed(4),
                    value: erxValue.toFixed(2)
                },
                qbit: {
                    amount: qbitAmount.toFixed(4),
                    value: qbitValue.toFixed(2)
                },
                dai: {
                    amount: daiAmount.toFixed(2),
                    value: daiValue.toFixed(2)
                },
                usdc: {
                    amount: usdcAmount.toFixed(2),
                    value: usdcValue.toFixed(2)
                },
                usdt: {
                    amount: usdtAmount.toFixed(2),
                    value: usdtValue.toFixed(2)
                },
            },
            isLoading,
        }
    }, [
        isConnected,
        address,
        shouldLoadExchangeData,
        erxBalance,
        qbitBalance,
        erxPrice,
        qbitPrice,
        daiInfo,
        usdcInfo,
        usdtInfo,
        erxLoading,
        qbitLoading,
        isLoadingStablecoins,
    ])

    return portfolioData
}
