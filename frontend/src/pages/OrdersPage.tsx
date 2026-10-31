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
  Eye,
  Layers,
  ShieldCheck,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [acceptedQuotations, setAcceptedQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // Workflow Inspection Modals
  const [detailsOrder, setDetailsOrder] = useState<SalesOrder | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bom' | 'payments' | 'dispatch' | 'installation'>('overview');

  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [advancePercent, setAdvancePercent] = useState('30');

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
      // Filter accepted quotes that are NOT already converted to avoid duplicate conversion
      const existingQuoteIds = new Set(orderRes.data.map((o: SalesOrder) => o.quotation?.id));
      const unassignedAccepted = quoteRes.data.filter(
        (q: Quotation) => q.status === 'ACCEPTED' && !existingQuoteIds.has(q.id)
      );
      setAcceptedQuotations(unassignedAccepted);
      if (unassignedAccepted.length > 0 && !selectedQuoteId) {
        setSelectedQuoteId(unassignedAccepted[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuoteId) {
      alert('Please select an accepted quotation to convert.');
      return;
    }
    setConverting(true);
    try {
      await api.post('/orders/convert', {
        quotationId: parseInt(selectedQuoteId),
        advancePercentage: parseFloat(advancePercent),
      });
      setShowConvertModal(false);
      fetchOrdersData();
      alert('Quotation successfully converted to Sales Order! Required BOM quantities hard-reserved in warehouse.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to convert quotation to order');
    } finally {
      setConverting(false);
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
      alert('Payment successfully recorded and allocated to order balance.');
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
  const isWarehouse = user?.roles?.includes('ROLE_WAREHOUSE') || user?.roles?.includes('ROLE_DIRECTOR');
  const isTechnician = user?.roles?.includes('ROLE_TECHNICIAN') || user?.roles?.includes('ROLE_DIRECTOR');

  const openOrderWorkflows = (order: SalesOrder, tab: 'overview' | 'bom' | 'payments' | 'dispatch' | 'installation' = 'overview') => {
    setDetailsOrder(order);
    setActiveTab(tab);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Orders & Workflows</h1>
          <p className="text-sm text-slate-500">
            Confirmed customer contracts, automated BOM reservations, payment schedules, and departmental execution
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

      {/* Cross-Department Integration Banner */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p>
            <strong>Centralized Integration:</strong> Confirmed orders automatically reserve warehouse inventory, unlock finance invoicing,
            enable barcode dispatch scanning, and schedule installation tracking.
          </p>
        </div>
        <div className="text-[11px] font-semibold text-slate-500">
          Total Active Orders: <span className="text-slate-900">{orders.length}</span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">System Spec</th>
                <th className="py-3 px-4 text-right">Contract Total</th>
                <th className="py-3 px-4 text-right">Advance Req</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Workflows & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No confirmed sales orders found. Accept a customer quotation and convert it.
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
                      {/* Universal Action: View Order Details & BOM Breakdown */}
                      <button
                        onClick={() => openOrderWorkflows(order, 'overview')}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                        title="View Full Order Details, BOM, and Statuses"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Details</span>
                      </button>

                      {/* BOM Breakdown Quick Button */}
                      <button
                        onClick={() => openOrderWorkflows(order, 'bom')}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                        title="View Bill of Materials and Stock Reservation Status"
                      >
                        <Layers className="w-3 h-3" />
                        <span>BOM</span>
                      </button>

                      {/* Department Operation: Finance Payment Button */}
                      {order.remainingBalance > 0 && isFinance && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setPaymentAmount(order.remainingBalance.toString());
                            setShowPaymentModal(true);
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Pay</span>
                        </button>
                      )}

                      {/* Department Operation: Warehouse Dispatch Button */}
                      {order.status !== 'PENDING_PAYMENT' && isWarehouse && (
                        <button
                          onClick={() => navigate('/dispatch', { state: { orderId: order.id } })}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Dispatch</span>
                        </button>
                      )}

                      {/* Department Operation: Technician Install Button */}
                      {['CONFIRMED', 'DISPATCHED', 'IN_INSTALLATION'].includes(order.status) && isTechnician && (
                        <button
                          onClick={() => navigate('/installations', { state: { orderId: order.id } })}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Install</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Order Workflow Details Modal (Tabs: Overview, BOM & Reservations, Payments, Dispatch, Installation) */}
      {detailsOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900">{detailsOrder.orderNumber}</h2>
                  <StatusBadge status={detailsOrder.status} />
                </div>
                <p className="text-xs text-slate-500">
                  Customer: {detailsOrder.customer.fullName} ({detailsOrder.customer.phone}) • {detailsOrder.capacityKw} kW {detailsOrder.systemType}
                </p>
              </div>
              <button onClick={() => setDetailsOrder(null)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            {/* Workflow Navigation Tabs */}
            <div className="flex space-x-2 border-b border-slate-200 pb-2 mb-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Contract Overview
              </button>
              <button
                onClick={() => setActiveTab('bom')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${activeTab === 'bom' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                BOM & Stock Allocation ({detailsOrder.items?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${activeTab === 'payments' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Payment Ledger ({detailsOrder.payments?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('dispatch')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${activeTab === 'dispatch' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Warehouse Dispatch Status
              </button>
              <button
                onClick={() => setActiveTab('installation')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${activeTab === 'installation' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                Rooftop Installation Status
              </button>
            </div>

            {/* Tab 1: Contract Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-slate-400">Total Contract Value</span>
                    <p className="font-bold text-slate-900 text-sm">{formatCurrency(detailsOrder.totalAmount)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Advance Required (30%)</span>
                    <p className="font-semibold text-amber-700 text-sm">{formatCurrency(detailsOrder.advanceRequired)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Paid to Date</span>
                    <p className="font-semibold text-emerald-700 text-sm">{formatCurrency(detailsOrder.totalPaid)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Remaining Balance</span>
                    <p className="font-semibold text-rose-600 text-sm">{formatCurrency(detailsOrder.remainingBalance)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                  <div>
                    <p className="text-slate-400">Order Date</p>
                    <p className="font-semibold text-slate-800">{detailsOrder.orderDate}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Linked Quotation</p>
                    <p className="font-mono font-semibold text-emerald-700">{detailsOrder.quotation?.quotationNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Installation Address</p>
                    <p className="text-slate-800">{detailsOrder.customer?.address || 'Site Address Verified'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Package Model</p>
                    <p className="text-slate-800">{detailsOrder.solarPackage?.name || `${detailsOrder.capacityKw} kW System`}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: BOM Breakdown & Stock Reservations */}
            {activeTab === 'bom' && (
              <div className="space-y-3 text-xs">
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between">
                  <span>Atomic Warehouse Allocation: All items below are hard-reserved in MySQL central inventory.</span>
                  <span className="font-semibold">{detailsOrder.items?.length || 0} line items</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Product / SKU</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                        <th className="py-2.5 px-3 text-center">Stock Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailsOrder.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{item.product.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{item.product.productCode}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{item.product.category?.name || 'Solar Parts'}</td>
                          <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-900">{formatCurrency(item.totalPrice)}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-semibold">
                              Reserved ✓
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: Payment History */}
            {activeTab === 'payments' && (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-slate-500">Collected: </span>
                    <span className="font-bold text-emerald-700">{formatCurrency(detailsOrder.totalPaid)}</span>
                    <span className="text-slate-400 mx-2">|</span>
                    <span className="text-slate-500">Pending: </span>
                    <span className="font-bold text-rose-600">{formatCurrency(detailsOrder.remainingBalance)}</span>
                  </div>
                  {isFinance && detailsOrder.remainingBalance > 0 && (
                    <button
                      onClick={() => {
                        setSelectedOrder(detailsOrder);
                        setPaymentAmount(detailsOrder.remainingBalance.toString());
                        setShowPaymentModal(true);
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold cursor-pointer"
                    >
                      Record Payment
                    </button>
                  )}
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Receipt #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailsOrder.payments && detailsOrder.payments.length > 0 ? (
                        detailsOrder.payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.paymentNumber}</td>
                            <td className="py-2.5 px-3">{p.paymentDate}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">{p.type}</td>
                            <td className="py-2.5 px-3 capitalize">{p.method?.toLowerCase().replace('_', ' ')}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">{p.referenceNumber || '-'}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(p.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                            No payment transactions recorded for this order yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: Dispatch Status */}
            {activeTab === 'dispatch' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                  <div className="font-semibold mb-1">Warehouse Picking & Barcode Scan Dispatch Tracking</div>
                  <p className="text-[11px] text-blue-700">
                    Dispatched materials are scanned with live camera / USB barcode readers and registered in the central serial number database.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-slate-400">Current Order Dispatch Stage:</span>
                    <div className="mt-1"><StatusBadge status={detailsOrder.status} /></div>
                  </div>
                  <div>
                    <span className="text-slate-400">Dispatched Location:</span>
                    <p className="font-semibold text-slate-800 mt-1">{detailsOrder.customer?.city || 'Installation Bay'}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => navigate('/dispatch', { state: { orderId: detailsOrder.id } })}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Open Warehouse Dispatch Bay</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 5: Installation Status */}
            {activeTab === 'installation' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900">
                  <div className="font-semibold mb-1">Rooftop Physical Installation & Commissioning</div>
                  <p className="text-[11px] text-purple-700">
                    Technicians physically scan serial numbers at customer site, commence installation, and record field sign-offs with actual completion timestamp.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-slate-400">Installation Status:</span>
                    <div className="mt-1"><StatusBadge status={detailsOrder.status} /></div>
                  </div>
                  <div>
                    <span className="text-slate-400">Installed Capacity:</span>
                    <p className="font-semibold text-slate-800 mt-1">{detailsOrder.capacityKw} kW ({detailsOrder.systemType})</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => navigate('/installations', { state: { orderId: detailsOrder.id } })}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Open Installation Field Ops</span>
                  </button>
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setDetailsOrder(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Convert Quotation to Order (IDEMPOTENT & PREVENTS DUPLICATES) */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Convert Quotation to Confirmed Order</h2>
            <p className="text-xs text-slate-500 mb-4">
              Hard-reserves required BOM stock atomically in warehouse and initializes project ledger
            </p>

            <form onSubmit={handleConvertOrder} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Accepted Quotation *</label>
                {acceptedQuotations.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
                    No unconverted accepted quotations found. Have customer accept a quotation first.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedQuoteId}
                    onChange={(e) => setSelectedQuoteId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {acceptedQuotations.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quotationNumber} - {q.customer.fullName} ({q.capacityKw} kW - {formatCurrency(q.totalAmount)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Advance Payment Requirement (%)</label>
                <select
                  value={advancePercent}
                  onChange={(e) => setAdvancePercent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="20">20% Booking Advance</option>
                  <option value="30">30% Standard EPC Advance (Default)</option>
                  <option value="50">50% Commercial Project Advance</option>
                  <option value="100">100% Full Payment</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting || acceptedQuotations.length === 0}
                  className="px-4 py-2 bg-emerald-600 disabled:opacity-50 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  {converting ? <span>Converting & Reserving...</span> : <span>Confirm Order & Reserve Stock</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payment (Finance Only) */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Record Customer Payment</h2>
            <p className="text-xs text-slate-500 mb-4">
              Applying payment against Order #{selectedOrder.orderNumber} (Balance Due: {formatCurrency(selectedOrder.remainingBalance)})
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 50000"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="BANK_TRANSFER">Bank NEFT/RTGS</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Milestone *</label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ADVANCE">Advance Booking (30%)</option>
                    <option value="PROGRESS">Pre-Dispatch Milestone</option>
                    <option value="FULL">Final Settlement</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transaction UTR / Cheque # *</label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. SBIN202610319871"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Finance Notes</label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Verified in ICICI Current Account statement"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
                >
                  Post Payment & Reconcile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
