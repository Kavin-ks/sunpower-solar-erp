import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { InventoryStock, StockMovement, Product } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Boxes,
  Plus,
  Minus,
  AlertTriangle,
  History,
  Layers,
  ArrowDownUp,
  PackageCheck,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [stocks, setStocks] = useState<InventoryStock[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<InventoryStock | null>(null);
  const [adjustDelta, setAdjustDelta] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const [stockRes, movRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/movements'),
      ]);
      setStocks(stockRes.data);
      setMovements(movRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;
    try {
      await api.post('/inventory/adjust', {
        productId: selectedStock.product.id,
        quantityDelta: parseInt(adjustDelta),
        reason: adjustReason,
      });
      setShowAdjustModal(false);
      setAdjustDelta('');
      setAdjustReason('');
      fetchInventory();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to adjust stock');
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
  const isWarehouse = user?.roles?.includes('ROLE_WAREHOUSE') || user?.roles?.includes('ROLE_DIRECTOR');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Warehouse Inventory Management</h1>
          <p className="text-sm text-slate-500">
            Real-time stock balance, order reservations, negative stock protection, and movement audit
          </p>
        </div>
      </div>

      {/* Stock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Stock Value</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(
                stocks.reduce(
                  (acc, s) => acc + s.product.purchasePrice * (s.availableQuantity + s.reservedQuantity),
                  0
                )
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Evaluated at purchase cost</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Available Units</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {stocks.reduce((acc, s) => acc + s.availableQuantity, 0)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Ready for new customer orders</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reserved for Orders</span>
            <div className="text-2xl font-bold text-amber-700 mt-1">
              {stocks.reduce((acc, s) => acc + s.reservedQuantity, 0)}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Committed in active sales orders</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Product Catalogue & Warehouse Stock</h2>
          <span className="text-xs text-slate-500 font-medium">{stocks.length} catalogued items</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Serialized?</th>
                <th className="py-3 px-4 text-right">Available</th>
                <th className="py-3 px-4 text-right">Reserved</th>
                <th className="py-3 px-4 text-right">Total Stock</th>
                <th className="py-3 px-4">Warehouse Bay</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stocks.map((stock) => {
                const isLow = stock.availableQuantity <= stock.product.minimumStockLevel;
                return (
                  <tr key={stock.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{stock.product.productCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{stock.product.name}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-600">
                        {stock.product.category?.name || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {stock.product.serialized ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          YES (Barcode)
                        </span>
                      ) : (
                        <span className="text-slate-400">Bulk</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      <span className={isLow ? 'text-rose-600' : 'text-emerald-700'}>
                        {stock.availableQuantity} {stock.product.unit}
                      </span>
                      {isLow && (
                        <span className="block text-[10px] font-semibold text-rose-500">Low Stock Alert</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-amber-700">
                      {stock.reservedQuantity} {stock.product.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {stock.availableQuantity + stock.reservedQuantity} {stock.product.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{stock.warehouseLocation}</td>
                    <td className="py-3 px-4 text-right">
                      {!isAdmin && isWarehouse ? (
                        <button
                          onClick={() => {
                            setSelectedStock(stock);
                            setShowAdjustModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                        >
                          Adjust
                        </button>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">View Only</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Movements Log */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-800">Recent Inventory Movement Audit</h2>
          </div>
          <span className="text-xs text-slate-400">Past 50 operations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Date & Time</th>
                <th className="py-2.5 px-4">Product</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4 text-right">Qty Delta</th>
                <th className="py-2.5 px-4">Ref #</th>
                <th className="py-2.5 px-4">Notes</th>
                <th className="py-2.5 px-4">User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((mov) => (
                <tr key={mov.id}>
                  <td className="py-2 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(mov.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 font-medium text-slate-800">{mov.product.name}</td>
                  <td className="py-2 px-4">
                    <span className="font-semibold text-slate-700">{mov.movementType}</span>
                  </td>
                  <td className={`py-2 px-4 text-right font-bold ${mov.quantity >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}
                  </td>
                  <td className="py-2 px-4 font-mono text-slate-500">{mov.referenceNumber || '-'}</td>
                  <td className="py-2 px-4 text-slate-600">{mov.notes}</td>
                  <td className="py-2 px-4 text-slate-400">{mov.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedStock && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Stock Adjustment</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedStock.product.name}</p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantity Delta (+ to restock, - to deduct) *
                </label>
                <input
                  type="number"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 10 or -2"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Current available: <strong>{selectedStock.availableQuantity}</strong>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason / Reference *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Received new shipment from Growatt / Physical count adjustment"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs"
                >
                  Apply Stock Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
