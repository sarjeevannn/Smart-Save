import React, { useState, useMemo } from 'react';
import type { Transaction } from '../types';
import { TrashIcon, ExportIcon } from '../constants';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface TransactionHistoryProps {
    transactions: Transaction[];
    onDeleteTransaction: (id: string) => void;
    slotCategories: string[];
    formatCurrency: (amount: number) => string;
}

type SortKey = keyof Transaction;

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, onDeleteTransaction, slotCategories, formatCurrency }) => {
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredTransactions = useMemo(() => {
        let sortedTransactions = [...transactions];

        if (sortConfig !== null) {
            sortedTransactions.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        if (filterCategory === 'all') {
            return sortedTransactions;
        }
        return sortedTransactions.filter(t => t.category === filterCategory);

    }, [transactions, filterCategory, sortConfig]);

    const getSortIndicator = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? '▲' : '▼';
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Transaction History", 14, 20);
        
        const tableColumn = ["Date", "Description", "Category", "Amount"];
        const tableRows: (string | number)[][] = [];

        sortedAndFilteredTransactions.forEach(t => {
            const transactionData = [
                new Date(t.date).toLocaleDateString(),
                t.description,
                t.category,
                formatCurrency(t.amount),
            ];
            tableRows.push(transactionData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
        });
        
        doc.save("transaction-history.pdf");
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-cyan-300">Transaction History</h2>
                <div className="flex items-center gap-4">
                     <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                        <option value="all">All Categories</option>
                        {slotCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button onClick={handleExportPDF} className="p-2 rounded-lg hover:bg-gray-700 transition-colors" aria-label="Export to PDF">
                        <ExportIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-600">
                            <th className="p-3 cursor-pointer" onClick={() => requestSort('date')}>Date {getSortIndicator('date')}</th>
                            <th className="p-3">Description</th>
                            <th className="p-3">Category</th>
                            <th className="p-3 cursor-pointer text-right" onClick={() => requestSort('amount')}>Amount {getSortIndicator('amount')}</th>
                            <th className="p-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredTransactions.length > 0 ? (
                            sortedAndFilteredTransactions.map(t => (
                                <tr key={t.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="p-3 text-sm text-gray-400">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="p-3">{t.description}</td>
                                    <td className="p-3">
                                        <span className="bg-gray-600 px-2 py-1 text-xs rounded-full">{t.category}</span>
                                    </td>
                                    <td className="p-3 text-right font-mono text-red-400">-{formatCurrency(t.amount)}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => onDeleteTransaction(t.id)} className="text-gray-400 hover:text-red-500" aria-label={`Delete transaction: ${t.description}`}>
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center p-6 text-gray-500">No transactions yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionHistory;