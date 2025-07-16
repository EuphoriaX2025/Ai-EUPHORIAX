# USDC Token Distinction Implementation

## Overview

Successfully implemented a solution to distinguish between two USDC tokens with identical symbols and names:

1. **USDC Native** (`0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`) - Native USDC on Polygon
2. **USDC.e** (`0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`) - Bridged USDC from Ethereum

## Problem Statement

Both tokens have the same symbol ("USDC") and similar names from their smart contracts, making them indistinguishable in the frontend without showing contract addresses, which is not user-friendly.

## Solution Implemented

### 1. Custom Token Metadata Configuration

Added `CUSTOM_TOKEN_METADATA` in `/src/config/wagmi.ts`:

```typescript
export const CUSTOM_TOKEN_METADATA = {
    // USDC native on Polygon (newer, official)
    '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359': {
        symbol: 'USDC',
        name: 'USD Coin',
        displaySymbol: 'USDC',
        displayName: 'USDC (Native)',
        description: 'Native USDC on Polygon',
        decimals: 6,
        priority: 1, // Higher priority = show first
    },
    // USDC.e (bridged from Ethereum)
    '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': {
        symbol: 'USDC',
        name: 'USD Coin (PoS)',
        displaySymbol: 'USDC.e',
        displayName: 'USDC.e (Bridged)',
        description: 'Bridged USDC from Ethereum',
        decimals: 6,
        priority: 2, // Lower priority = show after native
    },
}
```

### 2. Enhanced Metadata Interface

Added `StablecoinMetadata` interface in `/src/hooks/useEuphoriaExchange.ts`:

```typescript
export interface StablecoinMetadata {
    address: string
    symbol: string
    name: string
    decimals: number
    displayLabel: string
    isLoaded: boolean
    priority: number
}
```

### 3. Updated getStablecoinWithMetadata Function

Modified the function to use custom metadata with fallback to contract data:

```typescript
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
```

### 4. Updated Frontend Components

#### Dashboard.tsx (Send Money Modal)
- Added priority-based sorting for stablecoins
- Clean symbol display without contract addresses
- Type-safe implementation with `StablecoinMetadata` interface

#### Exchange.tsx
- Updated both `getFromCurrencies` and `getToCurrencies` functions
- Priority-based sorting ensures USDC (native) appears before USDC.e
- Clean symbol display in dropdowns

### 5. User Experience Improvements

**Before:**
- Both tokens showed as "USDC (0x3c49...3359)" and "USDC (0x2791...4174)"
- Confusing for users to understand the difference

**After:**
- Native USDC shows as "USDC"
- Bridged USDC shows as "USDC.e"
- Native USDC appears first due to higher priority
- Clear distinction without technical jargon

## Technical Benefits

1. **Extensible System**: Easy to add custom metadata for other similar tokens
2. **Backward Compatible**: Falls back to contract metadata if custom data not available
3. **Type Safe**: Full TypeScript support with proper interfaces
4. **Sorting Logic**: Priority-based ordering for better UX
5. **Performance**: No additional network calls required

## Files Modified

1. `/src/config/wagmi.ts` - Added custom token metadata configuration
2. `/src/hooks/useEuphoriaExchange.ts` - Enhanced metadata interface and function
3. `/src/pages/Dashboard.tsx` - Updated send money modal with sorting
4. `/src/pages/Exchange.tsx` - Updated exchange dropdowns with sorting

## Testing Verification

- ✅ No TypeScript compilation errors
- ✅ Custom metadata properly applied
- ✅ Priority sorting working correctly
- ✅ Fallback to contract metadata for unknown tokens
- ✅ Both Dashboard and Exchange pages updated consistently

## Future Enhancements

1. **Additional Token Support**: Can easily add metadata for other duplicate-symbol tokens
2. **Dynamic Priority**: Could implement dynamic priority based on liquidity or usage
3. **User Preferences**: Allow users to customize token display preferences
4. **Tooltip Information**: Add hover tooltips with detailed token information

## Conclusion

This implementation provides a clean, user-friendly solution to distinguish between similar tokens without exposing technical details like contract addresses. The system is extensible, maintainable, and provides a consistent experience across the application.
