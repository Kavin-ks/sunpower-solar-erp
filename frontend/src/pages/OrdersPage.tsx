import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { SalesOrder, Quotation, PaymentMethod, PaymentType } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingCart,
  Plus,
  CreditCard,
  DollarSign,
  AlertCircle,
  Truck,
  Wrench,
  CheckCircle2,
  FileText,
  Clock,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [acceptedQuotations, setAcceptedQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [advancePercent, setAdvancePercent] = useState('20');

  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [paymentType, setPaymentType] = useState<PaymentType>('ADVANCE');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrdersData();
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).quotationId) {
      setSelectedQuoteId((location.state as any).quotationId.toString());
      setShowConvertModal(true);
    }
  }, [location.state]);

  const fetchOrdersData = async () => {
    setLoading(true);
    try {
      const [orderRes, quoteRes] = await Promise.all([
        api.get('/orders'),
        api.get('/quotations'),
      ]);
      setOrders(orderRes.data);
      const accepted = quoteRes.data.filter((q: Quotation) => q.status === 'ACCEPTED');
      setAcceptedQuotations(accepted);
      if (accepted.length > 0 && !selectedQuoteId) {
        setSelectedQuoteId(accepted[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/orders/convert', {
        quotationId: parseInt(selectedQuoteId),
        advancePercentage: parseFloat(advancePercent),
      });
      setShowConvertModal(false);
      fetchOrdersData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to convert order');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await api.post('/payments', {
        salesOrderId: selectedOrder.id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
        type: paymentType,
        referenceNumber,
        notes: paymentNotes,
      });
      setShowPaymentModal(false);
      setPaymentAmount('');
      setReferenceNumber('');
      setPaymentNotes('');
      fetchOrdersData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const formatCurrency = (val: number | undefined) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isSales = user?.roles?.includes('ROLE_SALES') || user?.roles?.includes('ROLE_DIRECTOR');
  const isFinance = user?.roles?.includes('ROLE_FINANCE') || user?.roles?.includes('ROLE_DIRECTOR');

  return (
    <div className="space-y-6">
      {/* Admin Read-Only Notice */}
      {isAdmin && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl text-amber-900 text-xs shadow-xs">
          <span className="font-bold text-sm block mb-0.5">Admin Central Oversight Mode</span>
          Sales orders and stock reservations are converted by the Sales Department upon quotation acceptance, and payments are recorded exclusively by Finance. Admin has central visibility into contract statuses and payment summaries without operational execution.
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Orders & Payment Gateway</h1>
          <p className="text-sm text-slate-500">
            Order conversion, inventory reservation, advance collection, and milestone payments
          </p>
        </div>

        {isSales && (
          <button
            onClick={() => setShowConvertModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Convert Accepted Quotation</span>
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">System</th>
                <th className="py-3 px-4 text-right">Contract Total</th>
                <th className="py-3 px-4 text-right">Advance Req</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Workflows</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No confirmed sales orders found. Accept a quotation and convert it.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{order.customer.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{order.customer.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{order.capacityKw} kW</span>
                      <span className="ml-1 text-[11px] text-slate-500">
                        ({order.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid'})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(order.totalAmount)}</td>
                    <td className="py-3 px-4 text-right text-amber-700 font-medium">
                      {formatCurrency(order.advanceRequired)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                      {formatCurrency(order.totalPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-rose-600">
                      {formatCurrency(order.remainingBalance)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      {isAdmin ? (
                        <span className="text-slate-400 italic text-[11px]">View Only</span>
                      ) : (
                        <>
                          {/* Record payment button (Finance only) */}
                          {order.remainingBalance > 0 && isFinance && (
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setPaymentAmount(order.remainingBalance.toString());
                                setShowPaymentModal(true);
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Pay</span>
                            </button>
                          )}

                          {/* Schedule Dispatch button (Warehouse only, unlocked once advance paid) */}
                          {order.status !== 'PENDING_PAYMENT' && (user?.roles?.includes('ROLE_WAREHOUSE') || user?.roles?.includes('ROLE_DIRECTOR')) && (
                            <button
                              onClick={() => navigate('/dispatch', { state: { orderId: order.id } })}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {/* Installation schedule button (Technician only) */}
                          {['CONFIRMED', 'DISPATCHED', 'IN_INSTALLATION'].includes(order.status) && (user?.roles?.includes('ROLE_TECHNICIAN') || user?.roles?.includes('ROLE_DIRECTOR')) && (
                            <button
                              onClick={() => navigate('/installations', { state: { orderId: order.id } })}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                            >
                              <Wrench className="w-3 h-3" />
                              <span>Install</span>
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Convert Quotation to Order */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Convert Quotation to Confirmed Order</h2>
            <p className="text-xs text-slate-500 mb-4">
              Reserves required BOM stock atomically in warehouse and initializes project ledger
            </p>

            <form onSubmit={handleConvertOrder} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Accepted Quotation *</label>
                <select
                  required
                  value={selectedQuoteId}
                  onChange={(e) => setSelectedQuoteId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Accepted Quote --</option>
                  {acceptedQuotations.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.quotationNumber} - {q.customer.fullName} ({formatCurrency(q.totalAmount)})
                    </option>
                  ))}
                </select>
                {acceptedQuotations.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No accepted quotations available. Accept a quotation from the Quotations page first.
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Required Advance Payment Percentage (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={advancePercent}
                  onChange={(e) => setAdvancePercent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">Standard company policy: 20% advance required</p>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={acceptedQuotations.length === 0}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs disabled:opacity-50"
                >
                  Confirm Order & Reserve Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Customer Payment */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Record Customer Payment</h2>
            <p className="text-xs text-slate-500 mb-4">
              Order: {selectedOrder.orderNumber} for {selectedOrder.customer.fullName}
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Contract Value:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already Received:</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(selectedOrder.totalPaid)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                <span className="text-slate-700">Remaining Balance:</span>
                <span className="text-rose-600">{formatCurrency(selectedOrder.remainingBalance)}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedOrder.remainingBalance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Type</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ADVANCE">Advance Deposit</option>
                    <option value="PROGRESS">Progress / Milestone</option>
                    <option value="FULL">Full Settlement</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">NEFT / RTGS Bank Transfer</option>
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="CHEQUE">Bank Cheque / DD</option>
                    <option value="CASH">Cash Deposit</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction Ref / Cheque #</label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. UTR-SBI2026-99014"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Received via State Bank of India net banking"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
