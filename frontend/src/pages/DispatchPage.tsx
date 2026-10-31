import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Dispatch, SalesOrder, SerialNumber, DispatchItem } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  Plus,
  Barcode,
  CheckCircle2,
  PackageCheck,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const DispatchPage: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);

  // Serial assign state
  const [assigningItem, setAssigningItem] = useState<DispatchItem | null>(null);
  const [scannedSerialCode, setScannedSerialCode] = useState('');
  const [availableSerials, setAvailableSerials] = useState<SerialNumber[]>([]);

  // Delivery confirm state
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  // Form State
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  const location = useLocation();

  useEffect(() => {
    fetchDispatchData();
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).orderId) {
      setSelectedOrderId((location.state as any).orderId.toString());
      setShowCreateModal(true);
    }
  }, [location.state]);

  const fetchDispatchData = async () => {
    setLoading(true);
    try {
      const [dispRes, orderRes] = await Promise.all([
        api.get('/dispatches'),
        api.get('/orders'),
      ]);
      setDispatches(dispRes.data);
      const eligible = orderRes.data.filter((o: SalesOrder) => o.status !== 'PENDING_PAYMENT');
      setConfirmedOrders(eligible);
      if (eligible.length > 0 && !selectedOrderId) {
        setSelectedOrderId(eligible[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/dispatches', {
        salesOrderId: parseInt(selectedOrderId),
        vehicleNumber,
        driverName,
        driverPhone,
        dispatchNotes,
      });
      setShowCreateModal(false);
      fetchDispatchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initialize dispatch');
    }
  };

  const openSerialAssign = async (item: DispatchItem) => {
    setAssigningItem(item);
    setScannedSerialCode('');
    try {
      const res = await api.get(`/serial-numbers/available/${item.product.id}`);
      setAvailableSerials(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningItem || !scannedSerialCode.trim()) return;
    try {
      const res = await api.post('/dispatches/assign-serial', {
        dispatchItemId: assigningItem.id,
        serialCode: scannedSerialCode.trim(),
      });
      setSelectedDispatch(res.data);
      setAssigningItem(null);
      setScannedSerialCode('');
      fetchDispatchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Invalid serial number');
    }
  };

  const handleConfirmDispatch = async (dispatchId: number) => {
    try {
      const res = await api.post(`/dispatches/${dispatchId}/confirm-dispatch`);
      setSelectedDispatch(res.data);
      fetchDispatchData();
      alert('Dispatch confirmed! Inventory stock deducted and serial numbers committed.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm dispatch');
    }
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatch) return;
    try {
      const res = await api.post(`/dispatches/${selectedDispatch.id}/confirm-delivery`, {
        deliveryDate,
        notes: deliveryNotes,
      });
      setSelectedDispatch(res.data);
      setShowDeliveryModal(false);
      fetchDispatchData();
      alert('Delivery confirmed! Product warranties have been automatically activated!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm delivery');
    }
  };

  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isWarehouse = user?.roles?.includes('ROLE_WAREHOUSE') || user?.roles?.includes('ROLE_DIRECTOR');

  return (
    <div className="space-y-6">
      {/* Admin Read-Only Notice */}
      {isAdmin && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl text-amber-900 text-xs shadow-xs">
          <span className="font-bold text-sm block mb-0.5">Admin Central Oversight Mode</span>
          Material picking, unique product serial scanning, and delivery handovers are executed by the Warehouse team. Admin has read-only tracking oversight across picking lists and serialized assets.
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Warehouse Picking, Serials & Dispatch
          </h1>
          <p className="text-sm text-slate-500">
            Mandatory serial verification (inverters/batteries), barcode scanner input, and delivery confirmation
          </p>
        </div>

        {isWarehouse && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Dispatch Picking List</span>
          </button>
        )}
      </div>

      {/* Dispatches List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Dispatch #</th>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vehicle & Driver</th>
                <th className="py-3 px-4">Dispatch Date</th>
                <th className="py-3 px-4">Delivery Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No dispatch records found. Orders must receive advance payment before picking begins.
                  </td>
                </tr>
              ) : (
                dispatches.map((disp) => (
                  <tr key={disp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{disp.dispatchNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{disp.salesOrder.orderNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{disp.customer.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{disp.customer.city}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{disp.vehicleNumber || 'Unassigned'}</div>
                      <div className="text-[10px] text-slate-400">{disp.driverName} {disp.driverPhone && `(${disp.driverPhone})`}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{disp.dispatchDate || '-'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{disp.deliveryDate || '-'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={disp.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedDispatch(disp)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold cursor-pointer"
                      >
                        Picking Sheet ({disp.items?.length || 0})
                      </button>

                      {!isAdmin && isWarehouse && (
                        <>
                          {disp.status === 'PICKING' && (
                            <button
                              onClick={() => handleConfirmDispatch(disp.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Confirm Dispatch</span>
                            </button>
                          )}

                          {disp.status === 'DISPATCHED' && (
                            <button
                              onClick={() => {
                                setSelectedDispatch(disp);
                                setShowDeliveryModal(true);
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm Delivery</span>
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

      {/* Picking Sheet & Serial Allocation Modal */}
      {selectedDispatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Picking Sheet: {selectedDispatch.dispatchNumber}
                </h2>
                <p className="text-xs text-slate-500">
                  Order: {selectedDispatch.salesOrder.orderNumber} | Customer: {selectedDispatch.customer.fullName}
                </p>
              </div>
              <button onClick={() => setSelectedDispatch(null)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center space-x-2">
              <Barcode className="w-4 h-4 text-amber-700 shrink-0" />
              <p>
                <strong>Mandatory Serial Number Rule:</strong> All high-value inverters, batteries, and charge controllers
                must have an assigned serial number before dispatch can be confirmed.
              </p>
            </div>

            {/* Picking Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3">Assigned Serial Number</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedDispatch.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.product.name}
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">
                          {item.product.productCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {item.product.serialized ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            Serialized
                          </span>
                        ) : (
                          <span className="text-slate-400">Bulk Hardware</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3">
                        {item.serialNumber ? (
                          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                            {item.serialNumber.serialCode}
                          </span>
                        ) : item.product.serialized ? (
                          <span className="text-rose-600 font-semibold text-[11px] flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Missing Serial Number</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not applicable</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {item.product.serialized && selectedDispatch.status === 'PICKING' && !isAdmin && isWarehouse && (
                          <button
                            onClick={() => openSerialAssign(item)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded font-semibold cursor-pointer"
                          >
                            Scan / Assign
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Current Status: <strong>{selectedDispatch.status}</strong>
              </span>

              <div className="space-x-3">
                <button
                  onClick={() => setSelectedDispatch(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium text-xs"
                >
                  Close
                </button>
                {selectedDispatch.status === 'PICKING' && !isAdmin && isWarehouse && (
                  <button
                    onClick={() => handleConfirmDispatch(selectedDispatch.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold text-xs shadow-xs"
                  >
                    Confirm & Commit Dispatch
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode / Serial Scan Modal */}
      {assigningItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Scan Serial Number</h2>
            <p className="text-xs text-slate-500 mb-4">
              Item: <strong>{assigningItem.product.name}</strong>
            </p>

            <form onSubmit={handleAssignSerial} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Barcode Scanner Input / Serial Code *
                </label>
                <div className="relative">
                  <Barcode className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={scannedSerialCode}
                    onChange={(e) => setScannedSerialCode(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Scan barcode or enter serial (e.g. INV-GW-3K-1001)"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports hardware barcode scanner USB/Bluetooth keyboard emulation.
                </p>
              </div>

              {/* In-Stock Fast Select */}
              {availableSerials.length > 0 && (
                <div>
                  <span className="block font-semibold text-slate-700 mb-1">Available in Warehouse:</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                    {availableSerials.map((sn) => (
                      <button
                        type="button"
                        key={sn.id}
                        onClick={() => setScannedSerialCode(sn.serialCode)}
                        className="w-full text-left px-2 py-1 bg-white hover:bg-purple-50 border border-slate-200 rounded text-[11px] font-mono font-medium text-slate-800 flex justify-between items-center"
                      >
                        <span>{sn.serialCode}</span>
                        <span className="text-[10px] text-slate-400 font-sans">{sn.warehouseLocation}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold shadow-xs"
                >
                  Verify & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delivery Modal */}
      {showDeliveryModal && selectedDispatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Confirm Customer Site Delivery</h2>
            <p className="text-xs text-slate-500 mb-4">
              Dispatch: {selectedDispatch.dispatchNumber} to {selectedDispatch.customer.fullName}
            </p>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 mb-4 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <p>
                <strong>Automatic Warranty Trigger:</strong> Delivery confirmation automatically generates and activates
                warranty certificates with start date = delivery date!
              </p>
            </div>

            <form onSubmit={handleConfirmDelivery} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirmed Delivery Date *</label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery / Handover Remarks</label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Unloaded into customer premises, all cartons inspected with no physical damage."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs"
                >
                  Confirm Delivery & Activate Warranties
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Dispatch Picking List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">New Dispatch Picking List</h2>
            <p className="text-xs text-slate-500 mb-4">
              Select confirmed sales order with advance payment verified
            </p>

            <form onSubmit={handleCreateDispatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Sales Order *</label>
                <select
                  required
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Order --</option>
                  {confirmedOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customer.fullName} ({o.capacityKw} kW {o.systemType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. TN-38-BZ-4109"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Murugan V"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Driver Phone Number</label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 9842199881"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Picking Notes / Gate Pass Instructions</label>
                <textarea
                  rows={2}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Include extra 10m DC cable for terrace riser conduit..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmedOrders.length === 0}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs disabled:opacity-50"
                >
                  Generate Picking Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
