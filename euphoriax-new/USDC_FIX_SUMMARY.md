# USDC Decimal Handling Fix - Summary

## Issues Fixed

### 1. ✅ Exchange Rate Display (Previously Fixed)
- **Issue**: Sell mode exchange rate was showing wrong values (inverted rates)
- **Fix**: Updated exchange rate display logic to handle both buy and sell modes correctly
- **Location**: `/src/pages/Exchange.tsx` lines ~812-850

### 2. ✅ USDC Decimal Handling Issue (Current Fix)
- **Issue**: USDC approval amounts were incorrect (showing 1000000000 instead of 1 for 1 USDC)
- **Root Cause**: Fallback decimal logic was using 18 decimals instead of 6 for USDC
- **Fix**: Updated stablecoin decimal detection with proper fallback to TOKEN_DECIMALS config

## Key Changes Made

### In `/src/pages/Exchange.tsx`:

1. **Import TOKEN_DECIMALS config**:
   ```tsx
   import { contracts, TOKEN_DECIMALS } from '../config/wagmi'
   ```

2. **Fixed stablecoin decimal detection**:
   ```tsx
   // Before (incorrect):
   const stablecoinDecimals = stablecoinInfo?.decimals || 18

   // After (correct):
   const stablecoinDecimals = stablecoinInfo?.decimals || 
     (selectedStablecoin ? (TOKEN_DECIMALS as any)[selectedStablecoin] : undefined) || 18
   ```

3. **Fixed target stablecoin decimals for sell mode**:
   ```tsx
   const outputDecimals = exchangeDirection === 'STABLECOIN_TO_TOKEN' 
     ? 18 // ERX/QBIT have 18 decimals
     : (targetStablecoinInfo?.decimals || 
        (selectedStablecoin ? (TOKEN_DECIMALS as any)[selectedStablecoin] : undefined) || 18)
   ```

4. **Enhanced debugging**:
   - Added decimal fallback logging
   - Added approval amount calculation test
   - Added detailed debug information

### Token Decimals Configuration (in `/src/config/wagmi.ts`):
```typescript
export const TOKEN_DECIMALS = {
    [contracts.WMATIC]: 18,
    [contracts.USDC]: 6,      // ← This ensures USDC uses 6 decimals
    [contracts.USDT]: 6,      // ← USDT also uses 6 decimals
    [contracts.DAI]: 18,      // ← DAI uses 18 decimals
    [contracts.WETH]: 18,
    [contracts.ERX_TOKEN]: 18,
    [contracts.QBIT_TOKEN]: 18,
} as const
```

## How the Fix Works

### Before the Fix:
- User enters "1" USDC
- Code uses fallback: 18 decimals (wrong!)
- `parseUnits("1", 18)` = 1,000,000,000,000,000,000 (way too much!)
- Approval shows massive amount

### After the Fix:
- User enters "1" USDC
- Code checks `stablecoinInfo.decimals` first
- If not available, falls back to `TOKEN_DECIMALS[USDC_ADDRESS]` = 6
- `parseUnits("1", 6)` = 1,000,000 (correct!)
- Approval shows proper amount

## Testing

### Created Test Utilities:
1. **`/src/utils/approvalTest.ts`**: Utility functions to test approval calculations
2. **`/src/components/USDCDecimalTest.tsx`**: React component to verify USDC decimal handling

### Test Cases:
- 1 USDC = 1,000,000 units ✅
- 0.5 USDC = 500,000 units ✅  
- 100 USDC = 100,000,000 units ✅
- 1 DAI = 1,000,000,000,000,000,000 units ✅

## Contract Addresses (Polygon Mainnet)
- **USDC.e (Bridged)**: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` (6 decimals) ✅
- **USDC (Native)**: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` (6 decimals) ✅
- **USDT**: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` (6 decimals) ✅  
- **DAI**: `0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063` (18 decimals) ✅

> **Update**: Added support for USDC Native (0x3c49...) which was causing incorrect approval amounts.

## Expected Behavior After Fix

1. **USDC Approvals**: 
   - User approves 1 USDC → Contract receives approval for 1,000,000 units
   - User approves 100 USDC → Contract receives approval for 100,000,000 units

2. **Exchange Rate Display**:
   - Buy mode: "1 USDC = X.XXXXXX ERX" 
   - Sell mode: "1 ERX = X.XXXXXX USDC"

3. **Balance Display**:
   - Shows correct decimal-adjusted balances for all tokens

## Testing in Browser

1. Open the Exchange page
2. Connect wallet
3. Select USDC as the from currency
4. Enter "1" as amount
5. Check the debug panel (development mode)
6. Verify "Stablecoin Decimals" shows 6 (not 18)
7. Run the USDC decimal test component
8. Check that approval amounts are reasonable (1,000,000 for 1 USDC)

## Files Modified

- ✅ `/src/pages/Exchange.tsx` - Main exchange logic and decimal handling
- ✅ `/src/utils/approvalTest.ts` - Test utilities (new file)
- ✅ `/src/components/USDCDecimalTest.tsx` - Test component (new file)
- ✅ `/src/config/wagmi.ts` - Token decimals configuration (already correct)

## Next Steps

1. Test the application in development mode
2. Verify USDC approvals work correctly
3. Test with different stablecoins (USDT, DAI)
4. Test both buy and sell modes
5. Remove debug components before production deployment
