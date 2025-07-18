// src/hooks/useDashboard.ts

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBalance } from 'wagmi';
import { useWallet } from './useWallet'; // مسیر را در صورت نیاز اصلاح کنید
import { usePortfolioBalance } from './usePortfolioBalance'; // مسیر را در صورت نیاز اصلاح کنید
import { useCryptoPrices } from './useCryptoPrices'; // مسیر را در صورت نیاز اصلاح کنید
import { useEuphoriaExchange, type StablecoinMetadata } from './useEuphoriaExchange'; // مسیر را در صورت نیاز اصلاح کنید
import { useTransactionHistory } from './useTransactionHistory'; // مسیر را در صورت نیاز اصلاح کنید
import { useTransfer } from './useTransfer'; // مسیر را در صورت نیاز اصلاح کنید
import { validateWalletAddress, getInputValidationState } from '../utils/addressValidation';
import { parseTransactionError } from '../utils/errorParser';
import { formatUnits, type Address } from 'viem';
import { useCoinChartData } from './useCoinChartData'; // مسیر را در صورت نیاز اصلاح کنید

export const useDashboard = () => {
    const navigate = useNavigate();
    const { isConnected, address, getFormattedBalance, balance: nativeBalance } = useWallet();
    const { totalValue, breakdown, isLoading: isPortfolioLoading } = usePortfolioBalance();
    const { bitcoin, ethereum, polygon, formatPrice, formatChange, isLoading: isPricesLoading } = useCryptoPrices();
    const { useCurrentERXPrice, useQBITCurrentPrice, useERXBalance, useQBITBalance, stablecoinAddresses, getStablecoinWithMetadata, useStablecoinInfo } = useEuphoriaExchange();
    const { transactions: recentTransactions, isLoading: isTransactionsLoading, getTransactionColor } = useTransactionHistory();
    const { transfer, resetTransfer, isLoading: isTransferLoading, isSuccess: isTransferSuccess, error: transferError, hash: transferHash } = useTransfer();

    // States
    const [sendForm, setSendForm] = useState({ asset: 'ERX', recipientAddress: '', amount: '' });
    const [selectedStablecoinForSend, setSelectedStablecoinForSend] = useState<Address | undefined>(undefined);
    const [addressValidation, setAddressValidation] = useState<{ state: 'empty' | 'invalid' | 'valid' | 'warning', message?: string, showCheckmark?: boolean }>({ state: 'empty' });
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [currentError, setCurrentError] = useState<any>(null);
    const [transactionHash, setTransactionHash] = useState<string | null>(null);
    const [lastProcessedError, setLastProcessedError] = useState<string | null>(null);
    const [lastSuccessHash, setLastSuccessHash] = useState<string | null>(null);
    const [errorProcessingTimeout, setErrorProcessingTimeout] = useState<NodeJS.Timeout | null>(null);

    // Data fetching hooks
    const selectedStablecoinInfo = useStablecoinInfo(selectedStablecoinForSend);
    const { data: currentERXPrice } = useCurrentERXPrice();
    const { data: currentQBITPrice } = useQBITCurrentPrice();
    const { data: erxBalance } = useERXBalance();
    const { data: qbitBalance } = useQBITBalance();
    const btcChartData = useCoinChartData(bitcoin);
    const ethChartData = useCoinChartData(ethereum);
    const maticChartData = useCoinChartData(polygon);
    const { data: alternativeNativeBalance } = useBalance({
        address: address,
        query: { enabled: !!address && isConnected, refetchInterval: 10000, retry: 3 }
    });

    // Helper Functions
    const getAssetDisplaySymbol = (asset: string): string => {
        // ... (کد این تابع بدون تغییر باقی می‌ماند)
        switch (asset.toUpperCase()) {
            case 'ERX': return 'ERX';
            case 'QBIT': return 'QBIT';
            case 'MATIC': case 'POL': return 'POL';
            default:
                if (asset.startsWith('0x') && stablecoinAddresses && stablecoinAddresses.includes(asset as Address)) {
                    const metadata = getStablecoinWithMetadata(asset as Address);
                    return metadata.symbol;
                }
                return asset;
        }
    };

    const getAvailableBalance = (asset: string): string => {
        // ... (کد این تابع بدون تغییر باقی می‌ماند)
        switch (asset.toUpperCase()) {
            case 'ERX': return erxBalance ? formatUnits(erxBalance, 18) : '0';
            case 'QBIT': return qbitBalance ? formatUnits(qbitBalance, 18) : '0';
            case 'MATIC': case 'POL':
                const balanceToUse = alternativeNativeBalance || nativeBalance;
                return balanceToUse ? formatUnits(balanceToUse.value, 18) : '0';
            default:
                if (asset.startsWith('0x') && stablecoinAddresses && stablecoinAddresses.includes(asset as Address)) {
                    if (asset === selectedStablecoinForSend && selectedStablecoinInfo) {
                        return (Number(selectedStablecoinInfo.balance) / Math.pow(10, selectedStablecoinInfo.decimals)).toFixed(6);
                    }
                    return '0';
                }
                return '0';
        }
    };

    const hasInsufficientBalance = (asset: string, amount: string): boolean => {
        // ... (کد این تابع بدون تغییر باقی می‌ماند)
        if (!amount || parseFloat(amount) <= 0) return false;
        const availableBalance = parseFloat(getAvailableBalance(asset));
        const requestedAmount = parseFloat(amount);
        return requestedAmount > availableBalance;
    };

    // Event Handlers
    const handleSendFormChange = (field: string, value: string) => {
        setSendForm(prev => ({ ...prev, [field]: value }));
        if (field === 'asset') {
            if (value.startsWith('0x') && stablecoinAddresses && stablecoinAddresses.includes(value as Address)) {
                setSelectedStablecoinForSend(value as Address);
            } else {
                setSelectedStablecoinForSend(undefined);
            }
        }
        if (field === 'recipientAddress') {
            const validation = getInputValidationState(value);
            setAddressValidation(validation);
        }
        if (showErrorModal) {
            setShowErrorModal(false);
            setCurrentError(null);
            setLastProcessedError(null);
        }
        if (showSuccessModal) {
            setShowSuccessModal(false);
        }
    };

    const handleSendMoney = async () => {
        // ... (کد این تابع بدون تغییر باقی می‌ماند، فقط `return` ها را چک کنید)
        setShowErrorModal(false);
        setShowSuccessModal(false);
        setCurrentError(null);
        setLastProcessedError(null);
        setLastSuccessHash(null);
        resetTransfer();

        const closeSendModal = () => {
            const sendModal = document.getElementById('sendActionSheet');
            if (sendModal) {
                const modalInstance = (window as any).bootstrap?.Modal?.getInstance(sendModal);
                if (modalInstance) modalInstance.hide();
                sendModal.classList.remove('show');
                sendModal.style.display = 'none';
                document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
            }
        };

        if (!sendForm.recipientAddress.trim()) {
            closeSendModal();
            setTimeout(() => {
                setCurrentError(new Error('Please enter a recipient address'));
                setShowErrorModal(true);
            }, 100);
            return;
        }

        const addressValidationResult = validateWalletAddress(sendForm.recipientAddress.trim());
        if (!addressValidationResult.isValid) {
            closeSendModal();
            setTimeout(() => {
                setCurrentError(new Error(addressValidationResult.error || 'Invalid wallet address'));
                setShowErrorModal(true);
            }, 100);
            return;
        }

        if (!sendForm.amount || parseFloat(sendForm.amount) <= 0) {
            closeSendModal();
            setTimeout(() => {
                setCurrentError(new Error('Please enter a valid amount'));
                setShowErrorModal(true);
            }, 100);
            return;
        }

        if (hasInsufficientBalance(sendForm.asset, sendForm.amount)) {
            const availableBalance = getAvailableBalance(sendForm.asset);
            closeSendModal();
            setTimeout(() => {
                setCurrentError(new Error(`Insufficient balance. You have ${parseFloat(availableBalance).toFixed(6)} ${getAssetDisplaySymbol(sendForm.asset)} available, but tried to send ${sendForm.amount} ${getAssetDisplaySymbol(sendForm.asset)}.`));
                setShowErrorModal(true);
            }, 100);
            return;
        }
        
        try {
            const normalizedAddress = addressValidationResult.normalizedAddress || sendForm.recipientAddress.trim();
            await transfer(sendForm.asset, normalizedAddress, sendForm.amount);
        } catch (error: any) {
            const parsedError = parseTransactionError(error);
            closeSendModal();
            setLastProcessedError(error.toString());
            resetTransfer();
            setTimeout(() => {
                setCurrentError(error);
                setShowErrorModal(true);
            }, 100);
        }
    };
    
    const handleExchangeNavigation = () => {
        const modal = document.getElementById('exchangeActionSheet');
        if (modal) {
            const modalInstance = (window as any).bootstrap?.Modal?.getInstance(modal);
            if (modalInstance) modalInstance.hide();
        }
        setTimeout(() => navigate('/exchange'), 150);
    };

    // useEffects
    useEffect(() => {
        // ... (کد تمام useEffect ها بدون تغییر باقی می‌ماند)
        if (errorProcessingTimeout) {
            clearTimeout(errorProcessingTimeout);
            setErrorProcessingTimeout(null);
        }

        if (isTransferSuccess && transferHash) {
            if (transferHash !== lastSuccessHash) {
                setLastSuccessHash(transferHash);
                setTransactionHash(transferHash);
                setShowSuccessModal(true);
                setSendForm({ asset: 'ERX', recipientAddress: '', amount: '' });
                setShowErrorModal(false);
                setCurrentError(null);
                setLastProcessedError(null);
                const sendModal = document.getElementById('sendActionSheet');
                if (sendModal) {
                    const modalInstance = (window as any).bootstrap?.Modal?.getInstance(sendModal);
                    if (modalInstance) modalInstance.hide();
                    sendModal.classList.remove('show');
                    sendModal.style.display = 'none';
                    document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
                }
                setTimeout(() => setShowSuccessModal(true), 200);
            }
        }
        
        if (transferError && !isTransferSuccess) {
            const errorMessage = transferError.toString();
            if (errorMessage !== lastProcessedError) {
                setLastProcessedError(errorMessage);
                const sendModal = document.getElementById('sendActionSheet');
                if (sendModal) {
                    const modalInstance = (window as any).bootstrap?.Modal?.getInstance(sendModal);
                    if (modalInstance) modalInstance.hide();
                    sendModal.classList.remove('show');
                    sendModal.style.display = 'none';
                    document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
                }
                document.body.style.overflow = 'unset';
                resetTransfer();
                setTimeout(() => {
                    setCurrentError(transferError);
                    setShowErrorModal(true);
                }, 100);
            }
        }
    }, [isTransferSuccess, transferError, transferHash, lastProcessedError, lastSuccessHash, resetTransfer]);

    useEffect(() => {
        if (!showErrorModal && !showSuccessModal) {
            document.body.style.overflow = 'unset';
        }
    }, [showErrorModal, showSuccessModal]);

    useEffect(() => {
        return () => {
            if (errorProcessingTimeout) clearTimeout(errorProcessingTimeout);
        };
    }, [errorProcessingTimeout]);

    useEffect(() => {
        if (sendForm.recipientAddress && addressValidation.state === 'warning') {
            const addressValidationResult = validateWalletAddress(sendForm.recipientAddress.trim());
            if (addressValidationResult.isValid && addressValidationResult.normalizedAddress && addressValidationResult.normalizedAddress !== sendForm.recipientAddress.trim()) {
                setSendForm(prev => ({ ...prev, recipientAddress: addressValidationResult.normalizedAddress! }));
                const correctedValidation = getInputValidationState(addressValidationResult.normalizedAddress!);
                setAddressValidation(correctedValidation);
            }
        }
    }, [sendForm.recipientAddress, addressValidation.state]);

    useEffect(() => {
        const initializeCarousels = () => {
            // Logic for initializing splide carousels remains the same
        };
        const timeoutId = setTimeout(initializeCarousels, 100);
        return () => {
            clearTimeout(timeoutId);
            // Logic for destroying splide instances remains the same
        };
    }, []);

    // Memoized Data
    const watchlistCoins = useMemo(() => {
        const erxPrice = currentERXPrice ? `$${(Number(currentERXPrice) / 1e18).toFixed(3)}` : '$0.100';
        const qbitPrice = currentQBITPrice ? `$${(Number(currentQBITPrice) / 1e18).toFixed(2)}` : '$20.00';
        const btcPrice = isPricesLoading ? 'Loading...' : (bitcoin?.current_price ? formatPrice(bitcoin.current_price) : '$105,503');
        const ethPrice = isPricesLoading ? 'Loading...' : (ethereum?.current_price ? formatPrice(ethereum.current_price) : '$3,890');
        const maticPrice = isPricesLoading ? 'Loading...' : (polygon?.current_price ? formatPrice(polygon.current_price) : '$0.45');
        
        return [
            // ... (محتوای آرایه watchlistCoins بدون تغییر باقی می‌ماند)
        ];
    }, [currentERXPrice, currentQBITPrice, bitcoin, ethereum, polygon, isPricesLoading, formatPrice, formatChange, btcChartData, ethChartData, maticChartData]);

    const displayTransactions = useMemo(() => {
        if (!isConnected) return [];
        try {
            return recentTransactions.slice(0, 4).map(transaction => {
                // ... (کد این تابع بدون تغییر باقی می‌ماند)
            });
        } catch (error) {
            console.error('Error processing transactions:', error);
            return [];
        }
    }, [recentTransactions, getTransactionColor, isConnected]);

    const cards = [
        // ... (آرایه cards بدون تغییر باقی می‌ماند)
    ];

    // Return all states and functions that the UI will need
    return {
        isConnected,
        address,
        totalValue,
        isPortfolioLoading,
        isPricesLoading,
        breakdown,
        currentERXPrice,
        currentQBITPrice,
        polygon,
        watchlistCoins,
        displayTransactions,
        cards,
        sendForm,
        addressValidation,
        isTransferLoading,
        showErrorModal,
        showSuccessModal,
        currentError,
        transactionHash,
        getFormattedBalance,
        getAvailableBalance,
        getAssetDisplaySymbol,
        hasInsufficientBalance,
        handleSendFormChange,
        handleSendMoney,
        handleExchangeNavigation,
        resetTransfer,
        setShowErrorModal,
        setShowSuccessModal,
        setCurrentError,
        stablecoinAddresses,
        getStablecoinWithMetadata
    };
};