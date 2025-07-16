// src/components/ReportTable.tsx

import React from 'react';
import { ReportItem } from '../types';

interface ReportTableProps {
  items: ReportItem[];
}

export const ReportTable: React.FC<ReportTableProps> = ({ items }) => {
  const ERX_PRICE_IN_USD = 0.1;
  const QBIT_PRICE_IN_USD = 20;

  const totalSubtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalFee = totalSubtotal * 0.05;
  const grandTotal = totalSubtotal + totalFee;
  
  const erxAmount = totalSubtotal / ERX_PRICE_IN_USD;
  const qbitAmount = totalFee / QBIT_PRICE_IN_USD;

  return (
    // افزودن یک کلاس والد جدید برای کنترل بهتر استایل
    <div className="section mt-2 report-table-container"> 
      <div className="section-title">Report</div>
      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Package ID</th>
                <th scope="col">PRICE</th>
                <th scope="col">Number</th>
                <th scope="col">Fee (5%)</th>
                <th scope="col" className="text-end">Pay</th>
              </tr>
            </thead>
            <tbody>
              {/* بهبود: نمایش حالت خالی به جای حذف کامل کامپوننت */}
              {items.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={5}>- No packages selected yet -</td>
                </tr>
              ) : (
                items.map(item => {
                  const subtotal = item.price * item.quantity;
                  const fee = subtotal * 0.05;
                  const pay = subtotal + fee;

                  return (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>${item.price.toLocaleString()}</td>
                      <td>{item.quantity}</td>
                      <td>${fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="text-end fw-bold">${pay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mt-2 report-summary-card">
        <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="text-muted small">Packages Value:</div>
                <div className="fw-bold text-end">
                    <div>${totalSubtotal.toLocaleString()}</div>
                    <div className="text-muted small">≈ {erxAmount.toLocaleString()} ERX</div>
                </div>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="text-muted small">Fee:</div>
                <div className="fw-bold text-end">
                    <div>${totalFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-muted small">≈ {qbitAmount.toLocaleString()} QBit</div>
                </div>
            </div>
            <hr />
            <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="fs-5">Total Payment:</div>
                <div className="fw-bold fs-4">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
        </div>
      </div>
      
      <div className="form-group basic mt-2 mb-2">
        <button type="button" className="btn btn-primary btn-block btn-lg">
          Payment
        </button>
      </div>
    </div>
  );
};