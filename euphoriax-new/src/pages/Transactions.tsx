import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IonIcon } from '@ionic/react';
import { useTransactionHistory } from '../hooks/useTransactionHistory'
import { useWallet } from '../hooks/useWallet'

import {
closeCircle,filterOutline,refreshOutline,walletOutline
} from 'ionicons/icons';

export const Transactions = () => {
  const { isConnected, openConnectModal } = useWallet()
  const {
    groupedTransactions,
    transactionStats,
    isLoading,
    error,
    loadTransactions,
    getTransactionIcon,
    getTransactionColor,
    getStatusColor
  } = useTransactionHistory()

  const [searchTerm, setSearchTerm] = useState('')

  if (!isConnected) {
    return (
      <>
        {/* Not Connected State */}
        <div className="section mt-4">
          <div className="card">
            <div className="card-body text-center">
              <IonIcon icon={walletOutline} className="mb-3" style={{ fontSize: '48px' }} />
              <h4>Connect Your Wallet</h4>
              <p className="text-muted">Connect your wallet to view your transaction history</p>
              <button 
                className="btn btn-primary"
                onClick={openConnectModal}
              >
                Connect Wallet
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (isLoading) {
    return (
      <>
        <div className="section mt-2">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-muted">Loading your transactions...</div>
              <div className="spinner-border mt-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="section mt-2">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-danger mb-3">{error}</div>
              <button 
                className="btn btn-outline-primary"
                onClick={loadTransactions}
              >
                <IonIcon icon={refreshOutline} /> Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Filter/Search Section */}
      <div className="section mt-2">
        <div className="card">
          <div className="card-body">
            <div className="row">
              <div className="col-8">
                <div className="form-group basic">
                  <div className="input-wrapper">
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Search transactions..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <i className="clear-input">
                      <IonIcon icon={closeCircle} />
                    </i>
                  </div>
                </div>
              </div>
              <div className="col-4">
                <button className="btn btn-outline-primary btn-block">
                  <IonIcon icon={filterOutline} />
                  Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Stats */}
      <div className="section mt-2">
        <div className="row">
          <div className="col-6">
            <div className="card">
              <div className="card-body text-center">
                <div className="text-muted">Total Spent</div>
                <h4 className="text-danger">{transactionStats.totalSpent}</h4>
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="card">
              <div className="card-body text-center">
                <div className="text-muted">Total Earned</div>
                <h4 className="text-success">{transactionStats.totalEarned}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {Object.keys(groupedTransactions).length === 0 ? (
        <div className="section mt-3">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-muted">No transactions found</div>
              <p className="text-small mt-2">
                Your transaction history will appear here after you make your first transaction.
              </p>
            </div>
          </div>
        </div>
      ) : (
        Object.entries(groupedTransactions).map(([dateGroup, transactionList]) => (
          <div key={dateGroup} className="section mt-2">
            <div className="section-title">{dateGroup}</div>
            <div className="card">
              <ul className="listview flush transparent no-line image-listview detailed-list mt-1 mb-1">
                {transactionList
                  .filter(transaction => 
                    searchTerm === '' || 
                    transaction.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((transaction) => (
                  <li key={transaction.id}>
                    <Link to={`/transaction/${transaction.id}`} className="item">
                      <div className={`icon-box ${getTransactionColor(transaction.type)}`}>
                        <IonIcon icon={getTransactionIcon(transaction.type)} />
                      </div>
                      <div className="in">
                        <div>
                          <strong>{transaction.asset}</strong>
                          <div className="text-small text-secondary">
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            {transaction.status !== 'completed' && (
                              <span className={`ms-2 ${getStatusColor(transaction.status)}`}>
                                • {transaction.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-end">
                          <strong>{transaction.value}</strong>
                          <div className="text-small">
                            {transaction.amount}
                          </div>
                          <div className="text-small text-muted">
                            {transaction.date}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))
      )}

      {/* Load More Button */}
      {Object.keys(groupedTransactions).length > 0 && (
        <div className="section mt-3">
          <button 
            className="btn btn-outline-primary btn-block"
            onClick={loadTransactions}
          >
            <IonIcon icon={refreshOutline} />
            Refresh Transactions
          </button>
        </div>
      )}
    </>
  )
}