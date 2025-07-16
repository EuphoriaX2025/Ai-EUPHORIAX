import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useAccount } from 'wagmi'
import { type Address, formatUnits, parseUnits } from 'viem'
import { contracts } from '../config/wagmi'

// Staking contract ABI (simplified)
const STAKING_ABI = [
    {
        inputs: [{ name: 'amount', type: 'uint256' }],
        name: 'stake',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'amount', type: 'uint256' }],
        name: 'unstake',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'claimRewards',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'stakedBalance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'earnedRewards',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'rewardRate',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalStaked',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ name: 'user', type: 'address' }],
        name: 'rewardPerTokenEarned',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const

export interface StakingPool {
    address: Address
    tokenAddress: Address
    name: string
    symbol: string
}

export const useStaking = () => {
    const { address } = useAccount()
    const { writeContract, data: hash, isPending, error } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    })

    // Available staking pools
    const stakingPools: StakingPool[] = [
        {
            address: contracts.ERX_STAKING_POOL,
            tokenAddress: contracts.ERX_TOKEN,
            name: 'ERX Staking Pool',
            symbol: 'ERX',
        },
        {
            address: contracts.QBIT_STAKING_POOL,
            tokenAddress: contracts.QBIT_TOKEN,
            name: 'QBIT Staking Pool',
            symbol: 'QBIT',
        },
    ]

    // Get user's staked balance
    const useStakedBalance = (poolAddress: Address, userAddress?: Address) => {
        return useReadContract({
            address: poolAddress,
            abi: STAKING_ABI,
            functionName: 'stakedBalance',
            args: [userAddress || address || '0x0'],
            query: {
                enabled: !!(userAddress || address),
            },
        })
    }

    // Get user's earned rewards
    const useEarnedRewards = (poolAddress: Address, userAddress?: Address) => {
        return useReadContract({
            address: poolAddress,
            abi: STAKING_ABI,
            functionName: 'earnedRewards',
            args: [userAddress || address || '0x0'],
            query: {
                enabled: !!(userAddress || address),
            },
        })
    }

    // Get total staked in pool
    const useTotalStaked = (poolAddress: Address) => {
        return useReadContract({
            address: poolAddress,
            abi: STAKING_ABI,
            functionName: 'totalStaked',
        })
    }

    // Get reward rate
    const useRewardRate = (poolAddress: Address) => {
        return useReadContract({
            address: poolAddress,
            abi: STAKING_ABI,
            functionName: 'rewardRate',
        })
    }

    // Get reward per token earned
    const useRewardPerTokenEarned = (poolAddress: Address, userAddress?: Address) => {
        return useReadContract({
            address: poolAddress,
            abi: STAKING_ABI,
            functionName: 'rewardPerTokenEarned',
            args: [userAddress || address || '0x0'],
            query: {
                enabled: !!(userAddress || address),
            },
        })
    }

    // Stake tokens
    const stakeTokens = async (poolAddress: Address, amount: string, decimals = 18) => {
        if (!address) throw new Error('Wallet not connected')

        const parsedAmount = parseUnits(amount, decimals)

        return writeContract({
            address: poolAddress,
            abi: STAKING_ABI,
            functionName: 'stake',
            args: [parsedAmount],
        })
    }

    // Unstake tokens
    const unstakeTokens = async (poolAddress: Address, amount: string, decimals = 18) => {
        if (!address) throw new Error('Wallet not connected')

        const parsedAmount = parseUnits(amount, decimals)

        return writeContract({
            address: poolAddress,
            abi: STAKING_ABI,
            functionName: 'unstake',
            args: [parsedAmount],
        })
    }

    // Claim rewards
    const claimRewards = async (poolAddress: Address) => {
        if (!address) throw new Error('Wallet not connected')

        return writeContract({
            address: poolAddress,
            abi: STAKING_ABI,
            functionName: 'claimRewards',
            args: [],
        })
    }

    // Format staking amounts
    const formatStakingAmount = (amount: bigint, decimals = 18) => {
        return formatUnits(amount, decimals)
    }

    // Parse staking amounts
    const parseStakingAmount = (amount: string, decimals = 18) => {
        return parseUnits(amount, decimals)
    }

    // Calculate APY (Annual Percentage Yield)
    const calculateAPY = (rewardRate: bigint, totalStaked: bigint, tokenPrice = 1) => {
        if (totalStaked === BigInt(0)) return 0

        const secondsPerYear = 365 * 24 * 60 * 60
        const annualRewards = Number(formatUnits(rewardRate, 18)) * secondsPerYear
        const totalStakedValue = Number(formatUnits(totalStaked, 18)) * tokenPrice

        return (annualRewards / totalStakedValue) * 100
    }

    // Get staking pool info
    const getPoolInfo = (poolSymbol: 'ERX' | 'QBIT') => {
        return stakingPools.find(pool => pool.symbol === poolSymbol)
    }

    return {
        // Pool data
        stakingPools,
        getPoolInfo,

        // Read hooks
        useStakedBalance,
        useEarnedRewards,
        useTotalStaked,
        useRewardRate,
        useRewardPerTokenEarned,

        // Write functions
        stakeTokens,
        unstakeTokens,
        claimRewards,

        // Utility functions
        formatStakingAmount,
        parseStakingAmount,
        calculateAPY,

        // Transaction state
        hash,
        isPending,
        isConfirming,
        isConfirmed,
        error,

        // Contract addresses
        contracts,
    }
}