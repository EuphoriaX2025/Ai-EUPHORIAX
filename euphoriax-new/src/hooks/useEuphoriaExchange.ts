import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi'
import { useAccount } from 'wagmi'
import { type Address, formatUnits, parseUnits } from 'viem'
import { contracts, ERC20_ABI, CUSTOM_TOKEN_METADATA } from '../config/wagmi'
import { useState, useEffect } from 'react'

// Euphoria contract ABI (for stablecoins and buy functions)
const EUPHORIA_ABI = [
    // Function to get all supported stablecoin addresses
    {
        inputs: [],
        name: 'getSupportedStablecoins',
        outputs: [{ name: 'tokens', type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
    },
    // Function to get current ERX token price
    {
        inputs: [],
        name: 'getCurrentPrice',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    // Individual stablecoin getter (for fallback if needed)
    {
        inputs: [{ "name": "", "type": "uint256", "internalType": "uint256" }],
        name: 'stablecoins',
        outputs: [{ "name": "", "type": "address", "internalType": "contract IERC20Metadata" }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { name: 'usdAmount', type: 'uint256' },
            { name: 'tokenSymbol', type: 'string' }
        ],
        name: 'buy',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'stablecoin', type: 'address' }],
        name: 'getPrice',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    // ERX sell function
    {
        inputs: [
            { name: 'erxAmount', type: 'uint256' },
            { name: 'tokenSymbol', type: 'string' }
        ],
        name: 'sell',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
] as const

// QBIT contract ABI (for buy function and stage data)
const QBIT_ABI = [
    {
        inputs: [
            { name: 'qbitAmount', type: 'uint256' },
            { name: 'tokenSymbol', type: 'string' }
        ],
        name: 'buy',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'stablecoin', type: 'address' }],
        name: 'getPrice',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    // New functions for stage-based pricing
    {
        inputs: [],
        name: 'getStageData',
        outputs: [
            { name: 'limits', type: 'uint256[]' },
            { name: 'prices', type: 'uint256[]' },
            { name: 'sold', type: 'uint256' }
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'soldInitialAmount',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: '', type: 'uint256' }],
        name: 'stagePrices',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: '', type: 'uint256' }],
        name: 'stageLimits',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const

export interface StablecoinMetadata {
    address: string
    symbol: string
    name: string
    decimals: number
    displayLabel: string
    isLoaded: boolean
    priority: number
}

export interface StablecoinInfo {
    address: Address
    symbol: string
    name: string
    decimals: number
    balance: bigint
}

export interface TokenMetadata {
    address: Address
    symbol: string
    name: string
    decimals: number
}

export interface CachedStablecoinData {
    metadata: TokenMetadata[]
    isLoading: boolean
    lastUpdated: number
}

export interface ExchangeQuote {
    inputAmount: string
    outputAmount: string
    price: bigint
    priceFormatted: string
}

export const useEuphoriaExchange = () => {
    const { address } = useAccount()
    const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    })

    // Cache for token metadata to avoid repeated calls
    const [tokenMetadataCache, setTokenMetadataCache] = useState<Map<Address, TokenMetadata>>(new Map())
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)

    // Fetch all supported stablecoins from ERX contract using the dedicated function
    const { data: stablecoinAddresses, isLoading: isLoadingStablecoins } = useReadContract({
        address: contracts.ERX_TOKEN,
        abi: EUPHORIA_ABI,
        functionName: 'getSupportedStablecoins',
    })

    // Create contracts array for batch fetching metadata of all stablecoins
    const metadataContracts = stablecoinAddresses ? stablecoinAddresses.flatMap(addr => [
        {
            address: addr,
            abi: ERC20_ABI,
            functionName: 'symbol' as const,
        },
        {
            address: addr,
            abi: ERC20_ABI,
            functionName: 'name' as const,
        },
        {
            address: addr,
            abi: ERC20_ABI,
            functionName: 'decimals' as const,
        }
    ]) : []

    // Batch fetch metadata for all stablecoins
    const { data: metadataResults, isLoading: isLoadingBatchMetadata } = useReadContracts({
        contracts: metadataContracts,
        query: {
            enabled: !!stablecoinAddresses && stablecoinAddresses.length > 0,
        },
    })

    // Process batch metadata results and update cache
    useEffect(() => {
        if (!stablecoinAddresses || !metadataResults) return

        setIsLoadingMetadata(true)
        const newCache = new Map(tokenMetadataCache)

        stablecoinAddresses.forEach((addr, index) => {
            // Each token has 3 contract calls (symbol, name, decimals)
            const symbolResult = metadataResults[index * 3]
            const nameResult = metadataResults[index * 3 + 1]
            const decimalsResult = metadataResults[index * 3 + 2]

            if (
                symbolResult?.status === 'success' &&
                nameResult?.status === 'success' &&
                decimalsResult?.status === 'success'
            ) {
                newCache.set(addr, {
                    address: addr,
                    symbol: symbolResult.result as string,
                    name: nameResult.result as string,
                    decimals: decimalsResult.result as number,
                })
            }
        })

        setTokenMetadataCache(newCache)
        setIsLoadingMetadata(false)
    }, [stablecoinAddresses, metadataResults])

    // Get cached token metadata
    const getTokenMetadata = (address: Address): TokenMetadata | null => {
        return tokenMetadataCache.get(address) || null
    }

    // Get enhanced stablecoin data with metadata
    const getStablecoinWithMetadata = (address: Address): StablecoinMetadata => {
        const metadata = getTokenMetadata(address)
        const customMetadata = CUSTOM_TOKEN_METADATA[address as keyof typeof CUSTOM_TOKEN_METADATA]

        // Use custom metadata if available, otherwise fall back to contract metadata
        const symbol = customMetadata?.displaySymbol || metadata?.symbol || 'Unknown'
        const name = customMetadata?.displayName || metadata?.name || 'Unknown Token'
        const decimals = customMetadata?.decimals || metadata?.decimals || 18

        return {
            address,
            symbol,
            name,
            decimals,
            displayLabel: metadata || customMetadata
                ? symbol
                : `${address.slice(0, 6)}...${address.slice(-4)}`,
            isLoaded: !!(metadata || customMetadata),
            priority: customMetadata?.priority || 999 // Default low priority for sorting
        }
    }

    // Get stablecoin info (symbol, name, decimals, balance) using batched calls for better performance
    const useStablecoinInfo = (tokenAddress: Address | undefined): StablecoinInfo | null => {
        const { data: stablecoinInfoResults } = useReadContracts({
            contracts: [
                {
                    address: tokenAddress as Address,
                    abi: ERC20_ABI,
                    functionName: 'symbol',
                },
                {
                    address: tokenAddress as Address,
                    abi: ERC20_ABI,
                    functionName: 'name',
                },
                {
                    address: tokenAddress as Address,
                    abi: ERC20_ABI,
                    functionName: 'decimals',
                },
                {
                    address: tokenAddress as Address,
                    abi: ERC20_ABI,
                    functionName: 'balanceOf',
                    args: [address || '0x0'],
                },
            ],
            query: {
                enabled: !!tokenAddress && tokenAddress !== '0x0' && !!address,
            },
        })

        // Extract results from the batch call
        const symbol = stablecoinInfoResults?.[0]?.result as string
        const name = stablecoinInfoResults?.[1]?.result as string
        const decimals = stablecoinInfoResults?.[2]?.result as number
        const balance = stablecoinInfoResults?.[3]?.result as bigint

        // Check if we have valid data - balance can be 0n so check for !== undefined instead of truthy
        if (!tokenAddress || !symbol || !name || decimals === undefined || balance === undefined) {
            return null
        }

        return {
            address: tokenAddress,
            symbol,
            name,
            decimals,
            balance,
        }
    }

    // Check allowance for a stablecoin to ERX or QBIT contract
    const useAllowance = (stablecoinAddress: Address, spenderAddress: Address, enabled: boolean = true) => {
        return useReadContract({
            address: stablecoinAddress,
            abi: ERC20_ABI,
            functionName: 'allowance',
            args: [address || '0x0', spenderAddress],
            query: {
                enabled: !!address && enabled,
            },
        })
    }

    // Check if approval is needed
    // Hook to check if approval is needed for a given amount
    const useNeedsApproval = (
        stablecoinAddress: Address | undefined,
        spenderAddress: Address | undefined,
        amount: string,
        decimals: number
    ) => {
        const { data: allowance } = useAllowance(
            stablecoinAddress || '0x0',
            spenderAddress || '0x0',
            !!stablecoinAddress && !!spenderAddress && !!amount && parseFloat(amount) > 0
        )

        // If we don't have the required parameters, assume approval is needed
        if (!stablecoinAddress || !spenderAddress || !amount || parseFloat(amount) <= 0) {
            return false; // Don't show approval needed if data is incomplete
        }

        // If allowance data is not available yet, assume approval is needed
        if (!allowance) {
            return true;
        }

        try {
            const parsedAmount = parseUnits(amount, decimals)
            const needsApproval = allowance < parsedAmount
            return needsApproval
        } catch (error) {
            console.error('Error parsing amount in useNeedsApproval:', error)
            return false
        }
    }

    // Non-hook function to check approval (for legacy compatibility)
    const checkNeedsApproval = (
        allowance: bigint | undefined,
        amount: string,
        decimals: number
    ) => {
        if (!allowance || !amount || parseFloat(amount) <= 0) return true

        try {
            const parsedAmount = parseUnits(amount, decimals)
            return allowance < parsedAmount
        } catch {
            return true
        }
    }

    // Get ERX price for a stablecoin
    const useERXPrice = (stablecoinAddress: Address | undefined) => {
        return useReadContract({
            address: contracts.ERX_TOKEN,
            abi: EUPHORIA_ABI,
            functionName: 'getPrice',
            args: [stablecoinAddress as Address],
            query: {
                enabled: !!stablecoinAddress && stablecoinAddress !== '0x0',
            },
        })
    }

    // Get current ERX token price from the contract
    const useCurrentERXPrice = () => {
        return useReadContract({
            address: contracts.ERX_TOKEN,
            abi: EUPHORIA_ABI,
            functionName: 'getCurrentPrice',
        })
    }

    // Get QBIT current stage data and calculate current price
    const useQBITStageData = () => {
        return useReadContract({
            address: contracts.QBIT_TOKEN,
            abi: QBIT_ABI,
            functionName: 'getStageData',
        })
    }

    // Get current QBIT price based on stage data
    const useQBITCurrentPrice = () => {
        const { data: stageData } = useQBITStageData()

        // Calculate current stage based on sold amount vs stage limits
        const getCurrentStagePrice = () => {
            if (!stageData) return null

            const [limits, prices, sold] = stageData as [bigint[], bigint[], bigint]
            let cumulativeLimit = 0n

            // Find which stage we're in based on sold amount
            for (let i = 0; i < limits.length; i++) {
                cumulativeLimit += limits[i]
                if (sold < cumulativeLimit) {
                    return prices[i]
                }
            }

            // If we've exceeded all stages, return the last stage price
            return prices[prices.length - 1]
        }

        return {
            data: getCurrentStagePrice(),
            stageData,
            isLoading: false, // Since this is a computed value
        }
    }

    // Legacy QBIT price function (kept for compatibility)
    const useQBITPrice = (stablecoinAddress: Address | undefined) => {
        return useReadContract({
            address: contracts.QBIT_TOKEN,
            abi: QBIT_ABI,
            functionName: 'getPrice',
            args: [stablecoinAddress as Address],
            query: {
                enabled: !!stablecoinAddress && stablecoinAddress !== '0x0',
            },
        })
    }

    // Calculate exchange quote for both buy and sell modes
    const calculateQuote = (
        inputAmount: string,
        price: bigint,
        inputDecimals: number,
        outputDecimals: number = 18,
        isSellMode: boolean = false
    ): ExchangeQuote | null => {
        if (!inputAmount || !price || isNaN(parseFloat(inputAmount)) || parseFloat(inputAmount) <= 0) {
            return null
        }

        try {
            // Parse input amount to bigint with proper decimals
            const parsedInput = parseUnits(inputAmount, inputDecimals)

            // Prevent overflow by checking if numbers are reasonable
            if (parsedInput > parseUnits('1000000000', inputDecimals)) {
                console.warn('Input amount too large')
                return null
            }

            if (price > parseUnits('1000000000', 18)) {
                console.warn('Price too large')
                return null
            }

            // Critical: Check for zero or very small price to prevent division by zero
            if (price <= 0n) {
                console.warn('Price is zero or negative, cannot calculate quote')
                return null
            }

            // Additional safeguard: Check if price is too small (less than 1 wei in 18 decimals)
            const minPrice = 1n // 1 wei
            if (price < minPrice) {
                console.warn('Price too small, cannot calculate quote safely')
                return null
            }

            let outputAmount: bigint

            if (isSellMode) {
                // SELL MODE: Convert token amount to stablecoin amount
                // Formula: outputAmount = (inputAmount * price) / 10^(18 - outputDecimals)
                // Price is in 18 decimals, inputAmount is in token decimals (18), output is in stablecoin decimals

                // Calculate: tokenAmount * pricePerToken = stablecoinAmount
                // Both inputAmount and price are scaled to their respective decimals
                // We need to adjust for output decimals

                if (outputDecimals <= 18) {
                    // Scale down if stablecoin has fewer decimals than 18
                    const scaleFactor = 10n ** BigInt(18 - outputDecimals)
                    outputAmount = (parsedInput * price) / (10n ** 18n) / scaleFactor
                } else {
                    // Scale up if stablecoin has more decimals than 18 (unlikely but handle it)
                    const scaleFactor = 10n ** BigInt(outputDecimals - 18)
                    outputAmount = (parsedInput * price * scaleFactor) / (10n ** 18n)
                }

                // console.log('calculateQuote SELL MODE debug:', {
                //     parsedInput: parsedInput.toString(),
                //     price: price.toString(),
                //     inputDecimals,
                //     outputDecimals,
                //     outputAmount: outputAmount.toString(),
                //     calculation: `(${parsedInput.toString()} * ${price.toString()}) / 10^18 = ${outputAmount.toString()}`
                // })
            } else {
                // BUY MODE: Convert stablecoin amount to token amount (original logic)
                // Formula: outputAmount = (inputAmount * 10^outputDecimals) / (price * 10^(inputDecimals-18))

                // If price is in 18 decimals and we want to convert to inputDecimals scale:
                let scaledPrice: bigint
                if (inputDecimals >= 18) {
                    // Scale price up
                    scaledPrice = price * (10n ** BigInt(inputDecimals - 18))
                } else {
                    // Scale price down, but check for zero division
                    const scaleFactor = 10n ** BigInt(18 - inputDecimals)
                    scaledPrice = price / scaleFactor

                    // Additional check after scaling down
                    if (scaledPrice <= 0n) {
                        console.warn('Scaled price became zero, cannot calculate quote')
                        return null
                    }
                }

                // Now calculate: outputAmount = (inputAmount * 10^outputDecimals) / scaledPrice
                outputAmount = (parsedInput * (10n ** BigInt(outputDecimals))) / scaledPrice

                // console.log('calculateQuote BUY MODE debug:', {
                //     parsedInput: parsedInput.toString(),
                //     price: price.toString(),
                //     scaledPrice: scaledPrice.toString(),
                //     outputAmount: outputAmount.toString(),
                //     inputDecimals,
                //     outputDecimals
                // })
            }

            // Validate the result
            if (outputAmount <= 0n) {
                console.warn('Invalid output amount calculated')
                return null
            }

            const formattedOutput = formatUnits(outputAmount, outputDecimals)

            // Additional validation on formatted output
            if (isNaN(parseFloat(formattedOutput)) || parseFloat(formattedOutput) <= 0) {
                console.warn('Invalid formatted output')
                return null
            }

            return {
                inputAmount,
                outputAmount: formattedOutput,
                price,
                priceFormatted: formatUnits(price, 18), // Price is always in 18 decimals
            }
        } catch (error) {
            console.error('Error in calculateQuote:', error)
            return null
        }
    }

    // Approve stablecoin spending with Trust Wallet compatibility
    const approveStablecoin = async (
        stablecoinAddress: Address,
        spenderAddress: Address,
        amount: string,
        decimals: number
    ) => {
        if (!address) throw new Error('Wallet not connected')

        // Import Trust Wallet utilities dynamically to avoid circular imports
        const { getTrustWalletApprovalAmount, isTrustWallet } = await import('../utils/trustWalletFixes')

        // Use Trust Wallet-specific approval amount if needed
        const approvalAmount = isTrustWallet()
            ? getTrustWalletApprovalAmount(amount, decimals)
            : parseUnits(amount, decimals)

        return writeContract({
            address: stablecoinAddress,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [spenderAddress, approvalAmount],
        })
    }

    // Buy ERX with stablecoin
    // ERX buy function takes: (usdAmount, tokenSymbol)
    const buyERX = async (
        stablecoinAddress: Address,
        amount: string,
        decimals: number
    ) => {
        if (!address) throw new Error('Wallet not connected')

        // Get stablecoin symbol from address
        const stablecoinMetadata = getStablecoinWithMetadata(stablecoinAddress)
        const tokenSymbol = stablecoinMetadata.symbol

        const parsedAmount = parseUnits(amount, decimals)

        return writeContract({
            address: contracts.ERX_TOKEN,
            abi: EUPHORIA_ABI,
            functionName: 'buy',
            args: [parsedAmount, tokenSymbol], // ERX takes (usdAmount, tokenSymbol)
        })
    }

    // Buy QBIT with stablecoin
    // QBIT buy function takes: (qbitAmount, tokenSymbol)
    // Note: This requires calculating the QBIT amount beforehand using current price
    const buyQBIT = async (
        stablecoinAddress: Address,
        _stablecoinAmount: string, // Not used in QBIT contract call
        _stablecoinDecimals: number, // Not used in QBIT contract call
        expectedQBITAmount: string // Pre-calculated QBIT amount from UI
    ) => {
        if (!address) throw new Error('Wallet not connected')

        // Get stablecoin symbol from address
        const stablecoinMetadata = getStablecoinWithMetadata(stablecoinAddress)
        const tokenSymbol = stablecoinMetadata.symbol

        // Parse the expected QBIT amount (calculated in UI)
        const qbitAmount = parseUnits(expectedQBITAmount, 18) // QBIT has 18 decimals

        return writeContract({
            address: contracts.QBIT_TOKEN,
            abi: QBIT_ABI,
            functionName: 'buy',
            args: [qbitAmount, tokenSymbol], // QBIT takes (qbitAmount, tokenSymbol)
        })
    }

    // Sell ERX using the smart contract sell function
    const sellERX = async (
        stablecoinSymbol: string,
        amount: string,
        tokenDecimals: number = 18
    ) => {
        if (!address) throw new Error('Wallet not connected')

        const parsedAmount = parseUnits(amount, tokenDecimals)

        return writeContract({
            address: contracts.ERX_TOKEN,
            abi: EUPHORIA_ABI,
            functionName: 'sell',
            args: [parsedAmount, stablecoinSymbol],
        })
    }

    // QBIT sell function - not available in smart contract
    const sellQBIT = async (
        _stablecoinSymbol: string,
        _amount: string,
        _tokenDecimals: number = 18
    ) => {
        throw new Error('QBIT selling is not supported at this phase')
    }

    // Get ERX token balance for current user
    const useERXBalance = () => {
        return useReadContract({
            address: contracts.ERX_TOKEN,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address || '0x0'],
            query: {
                enabled: !!address,
            },
        })
    }

    // Get QBIT token balance for current user
    const useQBITBalance = () => {
        return useReadContract({
            address: contracts.QBIT_TOKEN,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address || '0x0'],
            query: {
                enabled: !!address,
            },
        })
    }

    // Get token info including balance for any ERC20 token
    const useTokenBalance = (tokenAddress: Address) => {
        return useReadContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address || '0x0'],
            query: {
                enabled: !!address && !!tokenAddress && tokenAddress !== '0x0',
            },
        })
    }

    // Get all stablecoin info - Note: This function doesn't work due to hooks rules
    // Use individual useStablecoinInfo calls in components instead
    const getAllStablecoins = (): StablecoinInfo[] => {
        // This function can't be implemented due to React hooks rules
        // Components should call useStablecoinInfo for each stablecoin address individually
        return []
    }

    return {
        // Data - stablecoinAddresses is now an array from getSupportedStablecoins
        stablecoinAddresses: (stablecoinAddresses as Address[]) || [],
        isLoadingStablecoins: isLoadingStablecoins || isLoadingMetadata || isLoadingBatchMetadata,

        // Token metadata functions
        getTokenMetadata,
        getStablecoinWithMetadata,
        tokenMetadataCache: Array.from(tokenMetadataCache.values()),

        // Hooks
        useStablecoinInfo,
        useAllowance,
        useERXPrice,
        useCurrentERXPrice,
        useQBITPrice,
        useQBITStageData,
        useQBITCurrentPrice,
        useERXBalance,
        useQBITBalance,
        useTokenBalance,

        // Utility functions
        useNeedsApproval,
        checkNeedsApproval,
        calculateQuote,
        getAllStablecoins,

        // Transaction functions
        approveStablecoin,
        buyERX,
        buyQBIT,
        sellERX,
        sellQBIT,

        // Transaction state
        hash,
        isPending,
        isConfirming,
        isConfirmed,
        error,

        // Reset function to clear error state
        resetError: reset,

        // Contract addresses
        contracts,
    }
}