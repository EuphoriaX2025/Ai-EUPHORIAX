import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { IonIcon } from '@ionic/react';
import { useCryptoPrices } from '../hooks/useCryptoPrices'
import { useEuphoriaExchange } from '../hooks/useEuphoriaExchange'

import {
trendingUp, arrowUpOutline, arrowDownOutline
} from 'ionicons/icons';

interface CoinData {
  id: string
  name: string
  symbol: string
  price: string
  change24h: string
  isPositive: boolean
  marketCap: string
  volume24h: string
  description: string
  icon: string
}

export const CoinDetail = () => {
  const { coinId } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [activeChart, setActiveChart] = useState('24h')
  const [coinData, setCoinData] = useState<CoinData | null>(null)
  
  // Get real price data
  const { bitcoin, ethereum, polygon, formatPrice, formatChange, isLoading: isPricesLoading } = useCryptoPrices()
  
  // Only call useEuphoriaExchange for ERX/QBIT coins to avoid unnecessary stablecoin loading
  const needsEuphoriaData = coinId?.toLowerCase() === 'erx' || coinId?.toLowerCase() === 'qbit'
  const euphoriaHooks = needsEuphoriaData ? useEuphoriaExchange() : null
  const { data: currentERXPrice } = needsEuphoriaData ? euphoriaHooks!.useCurrentERXPrice() : { data: undefined }
  const { data: currentQBITPrice } = needsEuphoriaData ? euphoriaHooks!.useQBITCurrentPrice() : { data: undefined }

  useEffect(() => {
    const fetchCoinData = async () => {
      let coinData: CoinData;

      switch (coinId?.toLowerCase()) {
        case 'erx':
          coinData = {
            id: 'ERX',
            name: 'ERX Token',
            symbol: 'ERX',
            price: currentERXPrice ? `$${(Number(currentERXPrice) / 1e18).toFixed(3)}` : '$0.100',
            change24h: '+3.15%',
            isPositive: true,
            marketCap: currentERXPrice ? `$${((Number(currentERXPrice) / 1e18) * 1000000).toFixed(0)}M` : '$100M',
            volume24h: '$2.1M',
            description: 'ERX is the native token of the EuphoriaX platform, designed for efficient DeFi operations and governance.',
            icon: '/assets/img/sample/brand/erx.jpg'
          }
          break;

        case 'qbit':
          coinData = {
            id: 'QBIT',
            name: 'Qbit Token',
            symbol: 'QBIT',
            price: currentQBITPrice ? `$${(Number(currentQBITPrice) / 1e18).toFixed(2)}` : '$20.00',
            change24h: '+1.50%',
            isPositive: true,
            marketCap: currentQBITPrice ? `$${((Number(currentQBITPrice) / 1e18) * 500000).toFixed(0)}M` : '$10M',
            volume24h: '$850K',
            description: 'QBIT is a premium token designed for advanced trading strategies and yield optimization.',
            icon: '/assets/img/sample/brand/qbit.jpg'
          }
          break;

        case 'btc':
          coinData = {
            id: 'BTC',
            name: 'Bitcoin',
            symbol: 'BTC',
            price: isPricesLoading ? 'Loading...' : (bitcoin?.current_price ? formatPrice(bitcoin.current_price) : '$105,503'),
            change24h: isPricesLoading ? '...' : (bitcoin?.price_change_percentage_24h !== undefined ? formatChange(bitcoin.price_change_percentage_24h) : '+2.59%'),
            isPositive: bitcoin?.price_change_percentage_24h !== undefined ? bitcoin.price_change_percentage_24h >= 0 : true,
            marketCap: bitcoin?.market_cap ? `$${(bitcoin.market_cap / 1e9).toFixed(1)}B` : '$2.1T',
            volume24h: '$32.1B',
            description: 'Bitcoin is a decentralized cryptocurrency that operates on a peer-to-peer network.',
            icon: '/assets/img/sample/brand/bitcoin.jpg'
          }
          break;

        case 'eth':
          coinData = {
            id: 'ETH',
            name: 'Ethereum',
            symbol: 'ETH',
            price: isPricesLoading ? 'Loading...' : (ethereum?.current_price ? formatPrice(ethereum.current_price) : '$3,890'),
            change24h: isPricesLoading ? '...' : (ethereum?.price_change_percentage_24h !== undefined ? formatChange(ethereum.price_change_percentage_24h) : '-1.24%'),
            isPositive: ethereum?.price_change_percentage_24h !== undefined ? ethereum.price_change_percentage_24h >= 0 : false,
            marketCap: ethereum?.market_cap ? `$${(ethereum.market_cap / 1e9).toFixed(1)}B` : '$468B',
            volume24h: '$15.2B',
            description: 'Ethereum is a decentralized platform that runs smart contracts and decentralized applications.',
            icon: '/assets/img/sample/brand/ethereum.jpg'
          }
          break;

        case 'matic':
          coinData = {
            id: 'MATIC',
            name: 'Polygon',
            symbol: 'MATIC',
            price: isPricesLoading ? 'Loading...' : (polygon?.current_price ? formatPrice(polygon.current_price) : '$0.45'),
            change24h: isPricesLoading ? '...' : (polygon?.price_change_percentage_24h !== undefined ? formatChange(polygon.price_change_percentage_24h) : '+4.85%'),
            isPositive: polygon?.price_change_percentage_24h !== undefined ? polygon.price_change_percentage_24h >= 0 : true,
            marketCap: polygon?.market_cap ? `$${(polygon.market_cap / 1e9).toFixed(1)}B` : '$10.2B',
            volume24h: polygon?.total_volume ? `$${(polygon.total_volume / 1e9).toFixed(1)}B` : '$2.1B',
            description: 'Polygon is a decentralized platform for Ethereum scaling and infrastructure development.',
            icon: '/assets/img/sample/brand/polygon.jpg'
          }
          break;

        default:
          // Default to Bitcoin if coinId not recognized
          coinData = {
            id: 'BTC',
            name: 'Bitcoin',
            symbol: 'BTC',
            price: isPricesLoading ? 'Loading...' : (bitcoin?.current_price ? formatPrice(bitcoin.current_price) : '$105,503'),
            change24h: isPricesLoading ? '...' : (bitcoin?.price_change_percentage_24h !== undefined ? formatChange(bitcoin.price_change_percentage_24h) : '+2.59%'),
            isPositive: bitcoin?.price_change_percentage_24h !== undefined ? bitcoin.price_change_percentage_24h >= 0 : true,
            marketCap: bitcoin?.market_cap ? `$${(bitcoin.market_cap / 1e9).toFixed(1)}B` : '$2.1T',
            volume24h: bitcoin?.total_volume ? `$${(bitcoin.total_volume / 1e9).toFixed(1)}B` : '$32.1B',
            description: 'Bitcoin is a decentralized cryptocurrency that operates on a peer-to-peer network.',
            icon: '/assets/img/sample/brand/bitcoin.jpg'
          }
      }

      setCoinData(coinData)
    }

    fetchCoinData()
  }, [coinId, currentERXPrice, currentQBITPrice, bitcoin, ethereum, polygon, isPricesLoading, formatPrice, formatChange])

  if (!coinData) {
    return (
      <div className="section mt-4 text-center">
        <div className="text-muted">Loading coin data...</div>
      </div>
    )
  }

  // Dynamic history data based on coin
  const getHistoryData = () => {
    switch (coinId?.toLowerCase()) {
      case 'erx':
        return [
          { date: '2024-12-15', type: 'Buy', amount: '1,250 ERX', value: '$125.00', status: 'Completed' },
          { date: '2024-12-10', type: 'Sell', amount: '500 ERX', value: '$50.00', status: 'Completed' },
          { date: '2024-12-05', type: 'Buy', amount: '2,500 ERX', value: '$250.00', status: 'Completed' }
        ];
      case 'qbit':
        return [
          { date: '2024-12-14', type: 'Buy', amount: '10 QBIT', value: '$200.00', status: 'Completed' },
          { date: '2024-12-08', type: 'Sell', amount: '5 QBIT', value: '$100.00', status: 'Completed' },
          { date: '2024-12-01', type: 'Buy', amount: '25 QBIT', value: '$500.00', status: 'Completed' }
        ];
      case 'eth':
        return [
          { date: '2024-12-15', type: 'Buy', amount: '0.5 ETH', value: '$1,945', status: 'Completed' },
          { date: '2024-12-10', type: 'Sell', amount: '0.25 ETH', value: '$972', status: 'Completed' },
          { date: '2024-12-05', type: 'Buy', amount: '1.0 ETH', value: '$3,890', status: 'Completed' }
        ];
      case 'matic':
        return [
          { date: '2024-12-14', type: 'Buy', amount: '2,500 MATIC', value: '$1,125', status: 'Completed' },
          { date: '2024-12-09', type: 'Sell', amount: '1,000 MATIC', value: '$450', status: 'Completed' },
          { date: '2024-12-03', type: 'Buy', amount: '5,000 MATIC', value: '$2,250', status: 'Completed' }
        ];
      default:
        return [
          { date: '2024-12-15', type: 'Buy', amount: '0.025 BTC', value: '$2,638', status: 'Completed' },
          { date: '2024-12-10', type: 'Sell', amount: '0.015 BTC', value: '$1,583', status: 'Completed' },
          { date: '2024-12-05', type: 'Buy', amount: '0.050 BTC', value: '$5,275', status: 'Completed' }
        ];
    }
  }

  // Get circulating supply based on coin
  const getCirculatingSupply = () => {
    switch (coinId?.toLowerCase()) {
      case 'erx':
        return '1M ERX'
      case 'qbit':
        return '500K QBIT'
      case 'btc':
        return '19.8M BTC'
      case 'eth':
        return '120.5M ETH'
      case 'matic':
        return '10B MATIC'
      default:
        return '19.8M BTC'
    }
  }

  // Get all time high based on coin
  const getAllTimeHigh = () => {
    switch (coinId?.toLowerCase()) {
      case 'erx':
        return '$0.150'
      case 'qbit':
        return '$25.00'
      case 'btc':
        return '$110,045.00'
      case 'eth':
        return '$4,891.70'
      case 'matic':
        return '$2.92'
      default:
        return '$69,045.00'
    }
  }

  // Get all time low based on coin
  const getAllTimeLow = () => {
    switch (coinId?.toLowerCase()) {
      case 'erx':
        return '$0.050'
      case 'qbit':
        return '$15.00'
      case 'btc':
        return '$67.81'
      case 'eth':
        return '$0.43'
      case 'matic':
        return '$0.003'
      default:
        return '$67.81'
    }
  }

  // Get total supply based on coin
  const getTotalSupply = () => {
    switch (coinId?.toLowerCase()) {
      case 'erx':
        return '10M ERX'
      case 'qbit':
        return '1M QBIT'
      case 'btc':
        return '21M BTC'
      case 'eth':
        return 'No Limit'
      case 'matic':
        return '10B MATIC'
      default:
        return '21M BTC'
    }
  }

  const historyData = getHistoryData()

  return (
    <>
      <div className="section full gradientSection">
        <div className="in coin-head">
          <div className="coin-info">
            <div className="coin-logo">
              <img src={coinData.icon} alt={coinData.name} className="imaged w48" 
                   onError={(e) => { (e.target as HTMLImageElement).src = '/assets/img/sample/brand/1.jpg' }} />
            </div>
            <div className="coin-details">
              <h1 className="coin-name">{coinData.name}</h1>
              <div className="coin-symbol">{coinData.symbol}</div>
            </div>
          </div>
          <div className="coin-price">
            <div className="price">{coinData.price}</div>
            <div className={`change ${coinData.isPositive ? 'text-success' : 'text-danger'}`}>
              <IonIcon icon={coinData.isPositive ? arrowUpOutline : arrowDownOutline} />
              {coinData.change24h}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Time Selection */}
      <div className="section mt-3">
        <div className="card">
          <div className="card-body pt-1 pb-1">
            <ul className="nav nav-tabs capsuled" role="tablist">
              {['24h', '1w', '1m', '1y', 'all'].map(period => (
                <li key={period} className="nav-item">
                  <a 
                    className={`nav-link ${activeChart === period ? 'active' : ''}`}
                    onClick={() => setActiveChart(period)}
                    href="#"
                  >
                    {period.toUpperCase()}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Chart Placeholder */}
          <div className="card-body">
            <div style={{ 
              height: '200px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <div className="text-center">
                <IonIcon icon={trendingUp} style={{ fontSize: '48px' }} />
                <div className="mt-2">Price Chart ({activeChart})</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy/Sell Buttons */}
      <div className="section mt-3">
        <div className="card">
          <div className="card-body">
            <div className="row">
              <div className="col">
                <Link to="/exchange" className="btn btn-block btn-lg btn-buy">BUY</Link>
              </div>
              <div className="col">
                <Link to="/exchange" className="btn btn-block btn-lg btn-sell">SELL</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="section mt-3">
        <div className="card">
          <div className="card-body pt-1 pb-1">
            <ul className="nav nav-tabs capsuled" role="tablist">
              <li className="nav-item">
                <a 
                  className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                  href="#"
                >
                  Overview
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className={`nav-link ${activeTab === 'market' ? 'active' : ''}`}
                  onClick={() => setActiveTab('market')}
                  href="#"
                >
                  Market
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                  href="#"
                >
                  History
                </a>
              </li>
            </ul>
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="tab-pane fade show active">
                <div className="section mt-4">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">About {coinData.name}</h5>
                      <p className="card-text">{coinData.description}</p>
                      
                      <ul className="listview flush transparent no-line">
                        <li>
                          <div className="item">
                            <div className="in">
                              <div>
                                <strong>Market Cap</strong>
                                <div className="text-muted">{coinData.marketCap}</div>
                              </div>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="item">
                            <div className="in">
                              <div>
                                <strong>24h Volume</strong>
                                <div className="text-muted">{coinData.volume24h}</div>
                              </div>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="item">
                            <div className="in">
                              <div>
                                <strong>Circulating Supply</strong>
                                <div className="text-muted">{getCirculatingSupply()}</div>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'market' && (
              <div className="tab-pane fade show active">
                <div className="section mt-4">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">Market Statistics</h5>
                      <ul className="listview flush transparent no-line">
                        <li>
                          <div className="item">
                            <div className="in">
                              <div>
                                <strong>All Time High</strong>
                                <div className="text-muted">{getAllTimeHigh()}</div>
                              </div>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="item">
                            <div className="in">
                              <div>
                                <strong>All Time Low</strong>
                                <div className="text-muted">{getAllTimeLow()}</div>
                              </div>
                            </div>
                          </div>
                        </li>
                        <li>
                          <div className="item">
                            <div className="in">
                              <div>
                                <strong>Total Supply</strong>
                                <div className="text-muted">{getTotalSupply()}</div>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="tab-pane fade show active">
                <div className="section mt-4">
                  <div className="section-heading">
                    <h2 className="title">History</h2>
                    <a href="#" className="link">View All</a>
                  </div>
                  <div className="card">
                    <ul className="listview flush transparent no-line image-listview detailed-list mt-1 mb-1">
                      {historyData.map((item, index) => (
                        <li key={index}>
                          <a href="#" className="item">
                            <div className={`icon-box ${item.type === 'Buy' ? 'bg-success' : 'bg-danger'}`}>
                              <IonIcon icon={item.type === 'Buy' ? arrowDownOutline : arrowUpOutline} />
                            </div>
                            <div className="in">
                              <div>
                                <strong>{item.type} {coinData.symbol}</strong>
                                <div className="text-small text-secondary">{item.status}</div>
                              </div>
                              <div className="text-end">
                                <strong>{item.amount}</strong>
                                <div className="text-small">{item.date}</div>
                              </div>
                            </div>
                          </a>
                        </li>
                      ))}
                    </ul>
                    <div className="card-body pt-0">
                      <a href="#" className="btn btn-block btn-outline-secondary">Load more</a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="appFooter">
        <div className="footer-title">
          Copyright © EuphoriaX 2025. All Rights Reserved.
        </div>
      </div>
    </>
  )
}