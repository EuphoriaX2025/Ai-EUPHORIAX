import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { polygon, polygonMumbai } from 'wagmi/chains'
import {
    injectedWallet,
    metaMaskWallet,
    walletConnectWallet,
    coinbaseWallet,
    trustWallet,
    safeWallet,
    rainbowWallet,
    phantomWallet,
    braveWallet,
    ledgerWallet,
    argentWallet
} from '@rainbow-me/rainbowkit/wallets'

// Get from environment variables or use defaults for development
const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || 'f8f1fc035616528fa7f6e2bc37f0b87f'

if (!projectId || projectId === 'YOUR_PROJECT_ID') {
    console.warn('VITE_WALLET_CONNECT_PROJECT_ID is not set. Please get a project ID from https://cloud.walletconnect.com')
}

// Detect if we're on mobile for wallet configuration
const isMobileDevice = () => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
}

export const config = getDefaultConfig({
    appName: 'EuphoriaX',
    appDescription: 'EuphoriaX - Modern Crypto Fintech Mobile Web Application',
    appUrl: 'https://euphoriax.com',
    appIcon: 'https://euphoriax.com/logo.png',
    projectId,
    chains: [polygon, polygonMumbai],

    // **تغییر اصلی در اینجا اعمال شده است**
    // آدرس RPC اختصاصی شما از QuickNode در اینجا قرار گرفته است
    transports: {
        [polygon.id]: http('https://billowing-floral-seed.matic.quiknode.pro/c5bde56f30d2f68b948c26904310d8e7ac512f0c/'),
        [polygonMumbai.id]: http(), // برای شبکه تستی از RPC عمومی استفاده می‌شود
    },

    wallets: [
        {
            groupName: 'Recommended',
            wallets: [
                walletConnectWallet,
                metaMaskWallet,
                trustWallet,
                injectedWallet,
                coinbaseWallet,
            ],
        },
        {
            groupName: 'Popular',
            wallets: [
                rainbowWallet,
                argentWallet,
                ledgerWallet,
            ],
        },
        {
            groupName: 'More Options',
            wallets: [
                braveWallet,
                phantomWallet,
                safeWallet,
            ],
        },
    ],
    ssr: false,
    multiInjectedProviderDiscovery: true,

    ...(isMobileDevice() && {
      initialChain: polygon,
    })
})

// Export chains for easy access
export { polygon, polygonMumbai }

// Contract addresses
export const contracts = {
    ERX_TOKEN: '0x11113847E021391e127B96be13070C7eF2931111' as const,
    QBIT_TOKEN: '0x2222d23f6AF73d835727cA5233604af03Fd12222' as const,
    QUICKSWAP_ROUTER: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff' as const,
    SUSHISWAP_ROUTER: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506' as const,
    ERX_STAKING_POOL: '0x11113847E021391e127B96be13070C7eF2931111' as const,
    QBIT_STAKING_POOL: '0x2222d23f6AF73d835727cA5233604af03Fd12222' as const,
    WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' as const,
    USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as const,
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as const,
    DAI: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063' as const,
    WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' as const,
} as const

// Custom token metadata
export const CUSTOM_TOKEN_METADATA = {
    '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063': {
        symbol: 'DAI', name: 'Dai Stablecoin', displaySymbol: 'DAI',
        displayName: 'DAI', description: 'Multi-Collateral Dai', decimals: 18, priority: 1,
    },
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': {
        symbol: 'USDT', name: 'Tether USD', displaySymbol: 'USDT',
        displayName: 'USDT', description: 'Tether USD on Polygon', decimals: 6, priority: 2,
    },
    '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359': {
        symbol: 'USDC', name: 'USD Coin', displaySymbol: 'USDC',
        displayName: 'USDC (Native)', description: 'Native USDC on Polygon', decimals: 6, priority: 3,
    },
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': {
        symbol: 'USDC', name: 'USD Coin (PoS)', displaySymbol: 'USDC.e',
        displayName: 'USDC.e (Bridged)', description: 'Bridged USDC from Ethereum', decimals: 6, priority: 4,
    },
} as const

// Common token decimals
export const TOKEN_DECIMALS = {
    [contracts.WMATIC]: 18,
    [contracts.USDC]: 6,
    [contracts.USDT]: 6,
    [contracts.DAI]: 18,
    [contracts.WETH]: 18,
    [contracts.ERX_TOKEN]: 18,
    [contracts.QBIT_TOKEN]: 18,
    '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359': 6,
} as const

// Common ABI definitions
export const ERC20_ABI = [
    {
        "inputs": [{ "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" }],
        "name": "approve", "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable", "type": "function",
    },
    {
        "inputs": [{ "name": "owner", "type": "address" }, { "name": "spender", "type": "address" }],
        "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view", "type": "function",
    },
    {
        "inputs": [{ "name": "account", "type": "address" }],
        "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view", "type": "function",
    },
    {
        "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }],
        "stateMutability": "view", "type": "function",
    },
    {
        "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }],
        "stateMutability": "view", "type": "function",
    },
    {
        "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }],
        "stateMutability": "view", "type": "function",
    },
    {
        "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view", "type": "function",
    },
    {
        "inputs": [{ "name": "to", "type": "address" }, { "name": "amount", "type": "uint256" }],
        "name": "transfer", "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable", "type": "function",
    },
    {
        "inputs": [{ "name": "from", "type": "address" }, { "name": "to", "type": "address" }, { "name": "amount", "type": "uint256" }],
        "name": "transferFrom", "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "nonpayable", "type": "function",
    },
] as const