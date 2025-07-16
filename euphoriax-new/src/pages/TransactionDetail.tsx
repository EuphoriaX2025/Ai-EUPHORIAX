import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { IonIcon } from '@ionic/react';
import { useTransactionHistory, type TransactionHistoryItem } from '../hooks/useTransactionHistory'
import { useWallet } from '../hooks/useWallet'
import { isMobile } from '../utils/mobile'

import {
shareOutline,copyOutline,
openOutline,trashOutline
} from 'ionicons/icons';

export const TransactionDetail = () => {
  const { transactionId } = useParams()
  const navigate = useNavigate()
  const { transactions, isLoading: isTransactionsLoading, loadTransactions } = useTransactionHistory()
  const { isConnected, address } = useWallet()
  const [transaction, setTransaction] = useState<TransactionHistoryItem | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const mobile = isMobile()

  // Debug: Log transaction data
  useEffect(() => {
    // console.log('TransactionDetail Debug:', {
    //   transactionId,
    //   isWalletConnected: isConnected,
    //   walletAddress: address,
    //   transactionsCount: transactions.length,
    //   transactions: transactions.slice(0, 3), // Show first 3 for debugging
    //   isLoading: isTransactionsLoading
    // })
  }, [transactionId, transactions, isTransactionsLoading, isConnected, address])

  // Ensure transactions are loaded when component mounts
  useEffect(() => {
    if (transactions.length === 0 && !isTransactionsLoading) {
      console.log('Loading transactions...')
      loadTransactions()
    }
  }, [transactions.length, isTransactionsLoading, loadTransactions])

  useEffect(() => {
    // Add mobile-specific styles
    if (mobile) {
      const style = document.createElement('style')
      style.textContent = `
        .address-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        
        .mobile-address .address-text {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          font-weight: 500;
          color: #6c757d;
        }
        
        .mobile-address .copy-btn {
          flex-shrink: 0;
          min-width: auto;
        }
        
        .mobile-address .copy-btn:active {
          background-color: #e9ecef;
          transform: scale(0.95);
        }
        
        .mobile-detail {
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          margin: 16px;
          color: white;
        }
        
        .mobile-iconbox {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .mobile-title {
          color: white;
          font-size: 20px;
          font-weight: 600;
        }
        
        @media (max-width: 767px) {
          .listview .address-container {
            margin-top: 8px;
          }
          
          .listview li strong {
            display: block;
            margin-bottom: 4px;
            color: #495057;
            font-size: 14px;
          }
          
          .listview li {
            padding: 12px 0;
            border-bottom: 1px solid #f8f9fa;
          }
          
          .mobile-address small {
            margin-top: 8px;
            padding: 8px;
            background-color: #f8f9fa;
            border-radius: 6px;
            line-height: 1.4;
          }
          
          .section {
            padding-left: 16px;
            padding-right: 16px;
          }
          
          .btn-lg {
            font-size: 16px;
            padding: 12px 24px;
          }
        }
      `
      document.head.appendChild(style)
      
      return () => {
        document.head.removeChild(style)
      }
    }
  }, [mobile])

  useEffect(() => {
    // Find the transaction in the current list
    // Try multiple matching strategies:
    // 1. Exact ID match
    // 2. Transaction hash match
    // 3. Transaction hash with "_in" suffix removed
    const foundTransaction = transactions.find(tx => 
      tx.id === transactionId || 
      tx.hash === transactionId ||
      tx.id === `${transactionId}_in` ||
      tx.id.replace('_in', '') === transactionId
    )
    
    if (foundTransaction) {
      console.log('Found transaction:', foundTransaction)
      setTransaction(foundTransaction)
    } else {
      // Instead of showing hardcoded mock data, try to fetch the real transaction
      // This is a fallback that shows we couldn't find the transaction
      console.warn(`Transaction not found in history: ${transactionId}`)
      console.log('Available transactions:', transactions.map(tx => ({ id: tx.id, hash: tx.hash, asset: tx.asset })))
      
      // For now, we'll show a "loading" or "not found" state instead of mock data
      setTransaction(null)
    }
  }, [transactionId, transactions])

  const handleDelete = () => {
    // Implement delete logic
    console.log('Deleting transaction:', transactionId)
    setShowDeleteDialog(false)
    navigate('/transactions')
  }

  const handleShare = () => {
    if (transaction?.hash) {
      const url = `https://polygonscan.com/tx/${transaction.hash}`
      if (navigator.share) {
        navigator.share({
          title: `${transaction.asset} Transaction`,
          text: `${transaction.type} ${transaction.amount} - ${transaction.value}`,
          url: url
        })
      } else {
        // Fallback to copying to clipboard
        navigator.clipboard.writeText(url)
        alert('Transaction link copied to clipboard!')
      }
    }
  }

  const handleCopyHash = () => {
    if (transaction?.hash) {
      navigator.clipboard.writeText(transaction.hash)
      
      // Mobile haptic feedback if available
      if (mobile && 'vibrate' in navigator) {
        navigator.vibrate(50)
      }
      
      // Better feedback for mobile
      if (mobile) {
        const toast = document.createElement('div')
        toast.textContent = 'Transaction hash copied!'
        toast.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          z-index: 9999;
          font-size: 14px;
          pointer-events: none;
        `
        document.body.appendChild(toast)
        setTimeout(() => document.body.removeChild(toast), 2000)
      } else {
        alert('Transaction hash copied to clipboard!')
      }
    }
  }

  const handleCopyAddress = (address: string, type: string) => {
    navigator.clipboard.writeText(address)
    
    // Mobile haptic feedback if available
    if (mobile && 'vibrate' in navigator) {
      navigator.vibrate(50)
    }
    
    // Better feedback for mobile
    if (mobile) {
      // Create a toast-like notification
      const toast = document.createElement('div')
      toast.textContent = `${type} copied!`
      toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 9999;
        font-size: 14px;
        pointer-events: none;
      `
      document.body.appendChild(toast)
      setTimeout(() => document.body.removeChild(toast), 2000)
    } else {
      alert(`${type} copied to clipboard!`)
    }
  }

  const formatAddressForMobile = (address: string) => {
    if (!address || address === 'N/A') return 'N/A'
    if (!isMobile()) return address
    
    // For mobile, show first 6 and last 4 characters
    if (address.length > 20) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    return address
  }

  const AddressDisplay = ({ label, address, copyLabel }: { label: string, address: string, copyLabel: string }) => {
    const mobile = isMobile()
    
    if (!address || address === 'N/A') {
      return (
        <li>
          <strong>{label}</strong>
          <span>N/A</span>
        </li>
      )
    }

    return (
      <li>
        <strong>{label}</strong>
        <div className={`address-container ${mobile ? 'mobile-address' : ''}`}>
          <span className="address-text">
            {mobile ? formatAddressForMobile(address) : address}
          </span>
          <button 
            className="btn btn-sm btn-outline-secondary ms-2 copy-btn"
            onClick={() => handleCopyAddress(address, copyLabel)}
            title={`Copy ${copyLabel}`}
            style={{
              padding: mobile ? '4px 8px' : '2px 6px',
              fontSize: mobile ? '12px' : '10px',
              lineHeight: '1',
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}
          >
            <IonIcon icon={copyOutline} style={{ fontSize: mobile ? '14px' : '12px' }} />
          </button>
        </div>
        {mobile && (
          <small className="text-muted d-block mt-1" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
            Full: {address}
          </small>
        )}
      </li>
    )
  }

  const handleViewOnExplorer = () => {
    if (transaction?.hash) {
      window.open(`https://polygonscan.com/tx/${transaction.hash}`, '_blank')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success'
      case 'pending':
        return 'text-warning'
      case 'failed':
        return 'text-danger'
      default:
        return 'text-muted'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle'
      case 'pending':
        return 'time'
      case 'failed':
        return 'close-circle'
      default:
        return 'help-circle'
    }
  }

  if (isTransactionsLoading) {
    return (
      <div className="section mt-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading transaction details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="section mt-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="mb-3">
              <IonIcon icon="help-circle-outline" style={{ fontSize: '48px', color: '#6c757d' }} />
            </div>
            <h5>Transaction Not Found</h5>
            <p className="text-muted">
              The transaction with ID <code>{transactionId}</code> could not be found in your transaction history.
            </p>
            <p className="text-muted small">
              This might happen if:
              <br />• The transaction is very recent and hasn't been indexed yet
              <br />• The transaction is older than the current lookup range
              <br />• Your wallet is not connected
              <br />• The transaction ID is incorrect
            </p>
            
            {/* Debug Information */}
            {process.env.NODE_ENV === 'development' && (
              <div className="alert alert-info mt-3" style={{ fontSize: '12px', textAlign: 'left' }}>
                <strong>Debug Info:</strong>
                <br />Wallet Connected: {isConnected ? 'Yes' : 'No'}
                <br />Wallet Address: {address || 'None'}
                <br />Transactions Loaded: {transactions.length}
                <br />Looking for ID: {transactionId}
                <br />Available IDs: {transactions.slice(0, 3).map(tx => tx.id).join(', ')}
                {transactions.length > 3 && '...'}
              </div>
            )}
            
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/transactions')}
            >
              Back to Transactions
            </button>
            {transactionId && transactionId.startsWith('0x') && (
              <div className="mt-3">
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => window.open(`https://polygonscan.com/tx/${transactionId}`, '_blank')}
                >
                  View on Polygonscan
                </button>
              </div>
            )}
            
            {!isConnected && (
              <div className="mt-3">
                <p className="text-warning small">
                  <strong>Note:</strong> Please connect your wallet to view your transaction history.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="section mt-2 mb-2">
        <div className={`listed-detail mt-3 ${mobile ? 'mobile-detail' : ''}`}>
          <div className="icon-wrapper">
            <div className={`iconbox ${mobile ? 'mobile-iconbox' : ''}`}>
              <IonIcon 
                icon={getStatusIcon(transaction.status)} 
                style={mobile ? { fontSize: '32px' } : {}}
              />
            </div>
          </div>
          <h3 className={`text-center mt-2 ${mobile ? 'mobile-title' : ''}`}>
            Transaction Detail
          </h3>
          {mobile && (
            <div className="text-center mt-2">
              <span className={`badge ${getStatusColor(transaction.status)} ${mobile ? 'fs-6' : ''}`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
            </div>
          )}
        </div>

        <ul className="listview flush transparent simple-listview mt-3">
          <li>
            <strong>Status</strong>
            <span className={getStatusColor(transaction.status)}>
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </span>
          </li>
          <li>
            <strong>Type</strong>
            <span>{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</span>
          </li>
          <li>
            <strong>Asset</strong>
            <span>{transaction.asset}</span>
          </li>
          <li>
            <strong>Amount</strong>
            <span>{transaction.amount}</span>
          </li>
          <li>
            <strong>Value</strong>
            <span>{transaction.value}</span>
          </li>
          <li>
            <strong>Network Fee</strong>
            <span>{transaction.fee || 'N/A'}</span>
          </li>
          <li>
            <strong>Date</strong>
            <span>{transaction.date}</span>
          </li>
          
          <AddressDisplay 
            label="Transaction Hash" 
            address={transaction.hash || 'N/A'} 
            copyLabel="Transaction Hash"
          />
          
          <AddressDisplay 
            label="From" 
            address={transaction.fromAddress || 'N/A'} 
            copyLabel="From Address"
          />
          
          <AddressDisplay 
            label="To" 
            address={transaction.toAddress || 'N/A'} 
            copyLabel="To Address"
          />
          
          {transaction.tokenAddress && (
            <AddressDisplay 
              label="Token Contract" 
              address={transaction.tokenAddress} 
              copyLabel="Token Contract Address"
            />
          )}
        </ul>

        {/* Action Buttons */}
        <div className="section mt-3">
          {mobile ? (
            // Mobile: Stack buttons vertically for better touch experience
            <div className="d-grid gap-2">
              <button 
                className="btn btn-outline-primary btn-lg"
                onClick={handleShare}
                style={{ minHeight: '48px' }}
              >
                <IonIcon icon={shareOutline} className="me-2" />
                Share Transaction
              </button>
              <button 
                className="btn btn-outline-secondary btn-lg"
                onClick={handleCopyHash}
                style={{ minHeight: '48px' }}
              >
                <IonIcon icon={copyOutline} className="me-2" />
                Copy Hash
              </button>
            </div>
          ) : (
            // Desktop: Keep original row layout
            <div className="row">
              <div className="col-6">
                <button 
                  className="btn btn-outline-primary btn-block"
                  onClick={handleShare}
                >
                  <IonIcon icon={shareOutline} />
                  Share
                </button>
              </div>
              <div className="col-6">
                <button 
                  className="btn btn-outline-secondary btn-block"
                  onClick={handleCopyHash}
                >
                  <IonIcon icon={copyOutline} />
                  Copy Hash
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View on Explorer */}
        {transaction.hash && (
          <div className="section mt-2">
            <button 
              className={`btn btn-primary btn-block ${mobile ? 'btn-lg' : ''}`}
              onClick={handleViewOnExplorer}
              style={mobile ? { minHeight: '48px' } : {}}
            >
              <IonIcon icon={openOutline} className={mobile ? 'me-2' : ''} />
              View on Block Explorer
            </button>
          </div>
        )}

        {/* Delete Button */}
        <div className="section mt-2">
          <button 
            className={`btn btn-outline-danger btn-block ${mobile ? 'btn-lg' : ''}`}
            onClick={() => setShowDeleteDialog(true)}
            style={mobile ? { minHeight: '48px' } : {}}
          >
            <IonIcon icon={trashOutline} className={mobile ? 'me-2' : ''} />
            Delete Transaction
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="modal fade dialogbox show" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete Transaction</h5>
              </div>
              <div className="modal-body">
                Are you sure you want to delete this transaction record? This action cannot be undone.
              </div>
              <div className="modal-footer">
                <div className="btn-inline">
                  <button 
                    className="btn btn-text-secondary" 
                    onClick={() => setShowDeleteDialog(false)}
                  >
                    CANCEL
                  </button>
                  <button 
                    className="btn btn-text-danger" 
                    onClick={handleDelete}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}