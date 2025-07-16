# Exchange Development Tools

## Overview

All test components, debug panels, and development utilities for the Exchange page have been moved to a dedicated `ExchangeDevTools.tsx` component. This keeps the production build clean while preserving all testing functionality for development.

## How It Works

### Production Mode
- The `ExchangeDevTools` component returns `null` when `process.env.NODE_ENV !== 'development'`
- No test code is included in the production bundle
- Users never see any debug information

### Development Mode
- A "🔧 Dev Tools" button appears fixed in the bottom-right corner
- Clicking it opens a floating panel with all debug information and test components
- The panel includes:
  - Approval status debugging
  - Decimal configuration checking
  - USDC decimal testing
  - Sell functionality testing
  - Stablecoin debugging utilities

## Features Moved to DevTools

### Test Components
- `USDCDecimalTest` - Tests USDC decimal handling
- `SellFunctionalityTestPanel` - Tests sell functionality

### Debug Functions
- `testApprovalAmount()` - Tests approval amount calculations
- `runApprovalTests()` - Runs comprehensive approval tests
- `debugStablecoinDecimals()` - Debugs stablecoin decimal configurations

### Debug Information
- Exchange direction status
- Token addresses and contract information
- Approval status (both hook and function results)
- Decimal configuration validation
- Real-time allowance monitoring

## Usage

### For Developers
1. Start the app in development mode: `npm run dev`
2. Navigate to the Exchange page
3. Look for the "🔧 Dev Tools" button in the bottom-right
4. Click to open the debug panel
5. Use the various test components and debug information

### For Production
- Nothing changes for end users
- All debug code is automatically excluded from production builds
- The exchange page remains clean and professional

## Benefits

✅ **Clean Production Build** - No test code in production  
✅ **Preserved Test Utilities** - All tests remain available for development  
✅ **Easy Access** - One-click access to all debug tools  
✅ **Organized Structure** - All debug code in one dedicated component  
✅ **Future-Proof** - Easy to add new debug features  
✅ **Performance** - Zero impact on production performance  

## Adding New Debug Features

To add new debug features:

1. Open `src/components/ExchangeDevTools.tsx`
2. Add your debug component to the appropriate section
3. Pass any needed props from the Exchange component
4. Update the `ExchangeDevToolsProps` interface if needed

## File Structure

```
src/
├── pages/
│   └── Exchange.tsx              # Clean production exchange page
├── components/
│   ├── ExchangeDevTools.tsx      # All debug/test components
│   ├── USDCDecimalTest.tsx       # Individual test components
│   └── SellFunctionalityTestPanel.tsx
└── utils/
    ├── approvalTest.ts           # Test utilities
    └── stablecoinDebug.ts        # Debug utilities
```

This approach follows React development best practices and ensures a clean separation between production and development code.
