// src/pages/TransactionsPage.tsx

import React, { useState, useMemo } from 'react';
import { IonIcon } from '@ionic/react';
import { useTransactionHistory, TransactionHistoryItem } from '../hooks/useTransactionHistory';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { chevronBackOutline, searchOutline } from 'ionicons/icons';

const groupTransactionsByDate = (transactions: TransactionHistoryItem[]) => {
    const groups: { [key: string]: TransactionHistoryItem[] } = {};
    transactions.forEach(tx => {
        const groupKey = new Date(tx.rawDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(tx);
    });
    return groups;
};

export const TransactionsPage: React.FC = () => {
    const { address } = useAccount();
    const { transactions, isLoading, error, getTransactionIcon, getTransactionColor } = useTransactionHistory();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTransactions = useMemo(() => {
        if (!searchQuery) return transactions;
        return transactions.filter(tx =>
            tx.asset.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.hash.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [transactions, searchQuery]);

    const groupedTransactions = useMemo(() => groupTransactionsByDate(filteredTransactions), [filteredTransactions]);

    return (
        <div id="appCapsule">
            <div className="appHeader">
                <div className="left">
                    <Link to="/" className="headerButton goBack">
                        <IonIcon icon={chevronBackOutline} />
                    </Link>
                </div>
                <div className="pageTitle">Transactions</div>
            </div>

            <div className="section mt-2">
                <div className="form-group searchbox">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Search by asset or hash..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <IonIcon icon={searchOutline} className="search-icon" />
                </div>
            </div>

            {isLoading && <div className="text-center p-4">Loading history...</div>}
            {error && <div className="alert alert-danger m-2">{error}</div>}

            {!isLoading && !error && Object.keys(groupedTransactions).length === 0 && (
                <div className="text-center p-4 text-muted">
                    {searchQuery ? 'No matching transactions found.' : 'No transactions found.'}
                </div>
            )}

            {!isLoading && !error && Object.keys(groupedTransactions).map(dateGroup => (
                <div className="section mt-2" key={dateGroup}>
                    <div className="section-title">{dateGroup}</div>
                    <div className="card">
                        <ul className="listview flush transparent no-line image-listview detailed-list mt-1 mb-1">
                            {groupedTransactions[dateGroup].map(tx => {
                                const color = getTransactionColor(tx.type);
                                const icon = getTransactionIcon(tx.type);
                                return (
                                    <li key={tx.id}>
                                        <a href={`https://polygonscan.com/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="item">
                                            <div className={`icon-box bg-${color}`}>
                                                <IonIcon icon={icon} />
                                            </div>
                                            <div className="in">
                                                <div>
                                                    <strong>{tx.asset}</strong>
                                                    <div className="text-small text-secondary">{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</div>
                                                </div>
                                                <div className="text-end">
                                                    <strong className={`text-${color}`}>
                                                        {tx.type === 'receive' ? '+' : '-'} {tx.amount}
                                                    </strong>
                                                    <div className="text-small">{tx.date}</div>
                                                </div>
                                            </div>
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            ))}
            
            <div className="section mt-3 mb-3">
                <a href={`https://polygonscan.com/address/${address}`} target="_blank" rel="noopener noreferrer" className="btn btn-lg btn-block btn-primary">
                    View Full History on Polygonscan
                </a>
            </div>
        </div>
    );
};