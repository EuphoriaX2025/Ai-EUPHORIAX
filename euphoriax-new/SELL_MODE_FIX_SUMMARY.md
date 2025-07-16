# Sell Mode Calculation Fix - Summary

## Issue Fixed
The main issue was that the `calculateQuote` function was designed only for buy mode (stablecoin → token) but was being used for both buy and sell modes. In sell mode (token → stablecoin), the calculation logic needed to be inverted.

## Problem Description
When selling 100 ERX tokens (where 1 ERX = 0.100000 DAI), the system should return 10 DAI, but it was showing incorrect amounts due to the wrong calculation formula being used.

### Original Issue:
- **Buy Mode**: Working correctly - stablecoin amount gets converted to token amount using division
- **Sell Mode**: Broken - token amount was being processed with the same division logic instead of multiplication

## Changes Made

### 1. Enhanced `calculateQuote` Function (`useEuphoriaExchange.ts`)

**Added new parameter `isSellMode`:**
```typescript
const calculateQuote = (
    inputAmount: string,
    price: bigint,
    inputDecimals: number,
    outputDecimals: number = 18,
    isSellMode: boolean = false  // NEW PARAMETER
): ExchangeQuote | null => {
```

**Added proper sell mode calculation logic:**
```typescript
if (isSellMode) {
    // SELL MODE: Convert token amount to stablecoin amount
    // Formula: outputAmount = (inputAmount * price) / 10^(18 - outputDecimals)
    
    if (outputDecimals <= 18) {
        // Scale down if stablecoin has fewer decimals than 18
        const scaleFactor = 10n ** BigInt(18 - outputDecimals)
        outputAmount = (parsedInput * price) / (10n ** 18n) / scaleFactor
    } else {
        // Scale up if stablecoin has more decimals than 18
        const scaleFactor = 10n ** BigInt(outputDecimals - 18)
        outputAmount = (parsedInput * price * scaleFactor) / (10n ** 18n)
    }
} else {
    // BUY MODE: Original logic unchanged
    // ...existing buy mode calculation...
}
```

### 2. Updated Exchange Component Call (`Exchange.tsx`)

**Modified the `calculateQuote` call to pass the sell mode flag:**
```typescript
const quote = calculateQuote(
    fromAmount, 
    exchangePrice, 
    inputDecimals, 
    outputDecimals,
    exchangeDirection === 'TOKEN_TO_STABLECOIN' // isSellMode
)
```

## Technical Details

### Buy Mode (STABLECOIN_TO_TOKEN):
- **Input**: Stablecoin amount (e.g., 10 DAI)
- **Calculation**: `tokenAmount = stablecoinAmount / tokenPrice`
- **Output**: Token amount (e.g., 100 ERX)

### Sell Mode (TOKEN_TO_STABLECOIN):
- **Input**: Token amount (e.g., 100 ERX)  
- **Calculation**: `stablecoinAmount = tokenAmount * tokenPrice`
- **Output**: Stablecoin amount (e.g., 10 DAI)

### Decimal Handling:
- **ERX/QBIT tokens**: 18 decimals
- **Stablecoins**: Variable decimals (USDC=6, DAI=18, USDT=6)
- **Price**: Always in 18 decimals
- **Proper scaling**: Applied based on output token decimals

## Example Calculation (Sell Mode):

If selling 100 ERX where 1 ERX = 0.100000 DAI:

```
Input: 100 ERX (100 * 10^18 wei)
Price: 0.100000 DAI (0.1 * 10^18 wei)
Output Decimals: 18 (DAI)

Calculation:
outputAmount = (100 * 10^18 * 0.1 * 10^18) / 10^18 / 1
            = (10^20 * 10^17) / 10^18
            = 10^37 / 10^18
            = 10^19 wei
            = 10 DAI
```

## Files Modified:

1. **`/src/hooks/useEuphoriaExchange.ts`** - Enhanced `calculateQuote` function
2. **`/src/pages/Exchange.tsx`** - Updated function call with sell mode parameter

## Testing:

1. **Start development server**: `npm run dev`
2. **Navigate to**: http://localhost:5174/
3. **Test buy mode**: Select stablecoin → ERX/QBIT, enter amount, verify calculation
4. **Test sell mode**: Click swap button, select ERX/QBIT → stablecoin, enter amount, verify calculation

## Expected Behavior After Fix:

- ✅ **Buy Mode**: 10 DAI should get ~100 ERX (when 1 ERX = 0.1 DAI)
- ✅ **Sell Mode**: 100 ERX should get ~10 DAI (when 1 ERX = 0.1 DAI)
- ✅ **Exchange Rate Display**: Correctly shows rates for both directions
- ✅ **Decimal Handling**: Proper handling for all stablecoin decimals (USDC, DAI, USDT)

## Previous Issues Resolved:

1. ✅ **Exchange rate display** - Fixed in previous iteration
2. ✅ **USDC decimal handling** - Fixed in previous iteration  
3. ✅ **Sell mode calculation** - Fixed in this iteration

The system now correctly handles both buy and sell mode calculations with proper decimal scaling for all supported stablecoins.
