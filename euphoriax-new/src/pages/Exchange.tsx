// src/pages/Exchange.tsx

import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { swapVertical } from 'ionicons/icons';
// import { useAccount, useBalance, useReadContract } from 'wagmi';
// import { formatUnits, parseUnits } from 'viem';

// توجه: برای سادگی، هوک‌های wagmi کامنت شده‌اند تا ابتدا روی ظاهر و منطق داخلی تمرکز کنیم.
// در مراحل بعد، آن‌ها را برای اتصال نهایی فعال خواهیم کرد.


// بهبود ۶: تعریف لیست ارزها به صورت مجزا
const stablecoinList = [
  { symbol: 'DAI', address: '0x...', rate: 1.0 },
  { symbol: 'USDT', address: '0x...', rate: 1.0 },
  { symbol: 'USDC', address: '0x...', rate: 1.0 },
  { symbol: 'GHO', address: '0x...', rate: 0.99 },
  { symbol: 'MIM', address: '0x...', rate: 0.99 },
];
const projectTokenList = [
  { symbol: 'ERX', address: '0x...', rate: 0.1 },
  { symbol: 'QBit', address: '0x...', rate: 20.0 },
];

const ExchangeInputBox = ({ label, amount, onAmountChange, selectedCurrency, balance }) => (
    <div className="exchange-input-group">
        <div className="d-flex justify-content-between">
            <span className="text-muted small">{label}</span>
            <span className="text-muted small">Balance: {balance}</span>
        </div>
        <div className="input-row mt-1">
            <input 
                type="text" 
                value={amount} 
                onChange={onAmountChange} 
                placeholder="0.00"
            />
            <div className="currency-selector">{selectedCurrency.symbol}</div>
        </div>
    </div>
);

export const Exchange = () => {
    // منطق جدید برای مدیریت باکس‌ها و جابجایی کامل آن‌ها
    const [isSwapped, setIsSwapped] = useState(false);
    
    const [stablecoinAmount, setStablecoinAmount] = useState('1');
    const [stablecoinCurrency, setStablecoinCurrency] = useState(stablecoinList[0]);
    
    const [projectTokenAmount, setProjectTokenAmount] = useState('');
    const [projectTokenCurrency, setProjectTokenCurrency] = useState(projectTokenList[0]);

    // بهبود ۳: تابع برای فرمت کردن اعداد با کاما
    const formatNumberWithCommas = (value: string) => {
        const parts = value.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/,/g, ''); // حذف کاما برای محاسبات
        if (/^\d*\.?\d*$/.test(value)) { // فقط به اعداد و یک نقطه اجازه می‌دهد
            isSwapped ? setProjectTokenAmount(value) : setStablecoinAmount(value);
        }
    };
    
    // تعیین باکس From و To بر اساس وضعیت isSwapped
    const fromData = isSwapped ? { amount: projectTokenAmount, currency: projectTokenCurrency, list: projectTokenList } : { amount: stablecoinAmount, currency: stablecoinCurrency, list: stablecoinList };
    const toData = !isSwapped ? { amount: projectTokenAmount, currency: projectTokenCurrency, list: projectTokenList } : { amount: stablecoinAmount, currency: stablecoinCurrency, list: stablecoinList };

    useEffect(() => {
        const fromRate = fromData.currency.rate;
        const toRate = toData.currency.rate;
        const amount = parseFloat(fromData.amount);

        if (amount > 0 && fromRate && toRate) {
            const result = (amount * fromRate) / toRate;
            // تعیین اینکه کدام state باید آپدیت شود
            isSwapped ? setStablecoinAmount(result.toString()) : setProjectTokenAmount(result.toString());
        } else {
            isSwapped ? setStablecoinAmount('') : setProjectTokenAmount('');
        }
    }, [fromData.amount, fromData.currency, toData.currency, isSwapped]);
    
    // بهبود ۱: تابع جابجایی کامل باکس‌ها
    const handleSwap = () => {
        setIsSwapped(!isSwapped);
    };

    const exchangeRateDisplay = `1 ${fromData.currency.symbol} ≈ ${(fromData.currency.rate / toData.currency.rate).toFixed(4)} ${toData.currency.symbol}`;
    const commissionRateDisplay = "Commission rate: 2%";
    const networkFeeDisplay = "Network Fee: ≈ 0.02 POL";

    return (
        <div className="exchange-page-container">
            <div id="appCapsule" className="header-large-title">
                <div className="appHeader">
                    <div className="pageTitle">Exchange</div>
                </div>

                <div className="section pt-3">
                    <div className="exchange-box">
                        <ExchangeInputBox 
                            label="From" 
                            amount={formatNumberWithCommas(fromData.amount)}
                            onAmountChange={handleAmountChange}
                            selectedCurrency={fromData.currency} 
                            balance={"1,234.56"}
                        />
                        
                        <div className="btn-swap-container d-flex justify-content-center">
                            <button className="btn btn-icon btn-swap-pulse rounded-circle" onClick={handleSwap}>
                                <IonIcon icon={swapVertical} />
                            </button>
                        </div>

                        <ExchangeInputBox 
                            label="To" 
                            amount={formatNumberWithCommas(toData.amount)}
                            selectedCurrency={toData.currency}
                            balance={"789.10"}
                        />

                        <div className="exchange-info-box mt-4">
                            <div className="d-flex justify-content-between py-1">
                                <span>{exchangeRateDisplay}</span>
                            </div>
                             <div className="d-flex justify-content-between py-1">
                                <span>{commissionRateDisplay}</span>
                                <span className="text-end">{networkFeeDisplay}</span>
                            </div>
                        </div>

                        <div className="form-group basic mt-3">
                            <button type="button" className="btn btn-primary btn-block btn-lg">Exchange</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Exchange;