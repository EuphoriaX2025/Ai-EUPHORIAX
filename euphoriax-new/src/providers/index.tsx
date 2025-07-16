import { type ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../config/wagmi'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (replaces deprecated cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      // Disable legacy behavior that might cause warnings
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

interface ProvidersProps {
  children: ReactNode
}

// Detect mobile device and preferred theme
const isMobile = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768
}

const getTheme = () => {
  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  
  const baseTheme = {
    accentColor: '#6236FF',
    accentColorForeground: 'white',
    borderRadius: 'medium' as const,
    fontStack: 'system' as const,
    overlayBlur: 'small' as const,
  }
  
  return isDark ? darkTheme(baseTheme) : lightTheme(baseTheme)
}

export const Providers = ({ children }: ProvidersProps) => {
  const mobile = isMobile()
  
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={getTheme()}
          showRecentTransactions={true}
          modalSize={mobile ? 'compact' : 'wide'} // Responsive modal size
          appInfo={{
            appName: 'EuphoriaX',
            learnMoreUrl: 'https://euphoriax.com',
            disclaimer: ({ Text, Link }) => (
              <Text>
                By connecting your wallet, you agree to our{' '}
                <Link href="https://euphoriax.com/terms">Terms of Service</Link> and{' '}
                <Link href="https://euphoriax.com/privacy">Privacy Policy</Link>.
              </Text>
            ),
          }}
          coolMode={!mobile} // Disable visual effects on mobile for performance
          locale="en-US"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
