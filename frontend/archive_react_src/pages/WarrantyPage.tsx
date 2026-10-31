import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Warranty } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  Calendar,
  Barcode,
  Award,
  Clock,
  Printer,
} from 'lucide-react';

export const WarrantyPage: React.FC = () => {
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [searchSerial, setSearchSerial] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedWarranty, setSelectedWarranty] = useState<Warranty | null>(null);

  useEffect(() => {
    fetchWarranties();
  }, []);

  const fetchWarranties = async () => {
    setLoading(true);
    try {
      const res = await api.get('/warranties');
      setWarranties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSerialLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSerial.trim()) {
      fetchWarranties();
      return;
    }
    try {
      const res = await api.get(`/warranties/serial/${encodeURIComponent(searchSerial.trim())}`);
      setWarranties([res.data]);
    } catch (err) {
      alert('No warranty found for serial number: ' + searchSerial);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Automatic Warranty Management</h1>
          <p className="text-sm text-slate-500">
            Serialized component tracking, 20-year panel & 2-year inverter/battery duration management
          </p>
        </div>

        {/* Quick Serial Lookup */}
        <form onSubmit={handleSerialLookup} className="flex items-center space-x-2">
          <div className="relative">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchSerial}
              onChange={(e) => setSearchSerial(e.target.value)}
              placeholder="Instant Serial Lookup..."
              className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            Verify
          </button>
        </form>
      </div>

      {/* Warranties Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Warranty ID</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Warranty Period</th>
                <th className="py-3 px-4">Coverage Status</th>
                <th className="py-3 px-4 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {warranties.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No active warranty records found. Warranties activate automatically when dispatches are marked DELIVERED.
                  </td>
                </tr>
              ) : (
                warranties.map((w) => {
                  const now = new Date();
                  const end = new Date(w.warrantyEndDate);
                  const isCurrentlyValid = w.status === 'ACTIVE' && end >= now;
                  return (
                    <tr key={w.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{w.warrantyNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {w.product.name}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {w.product.category?.name}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {w.serialNumber ? (
                          <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {w.serialNumber.serialCode}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Bulk/Panels Group</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{w.customer.fullName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{w.salesOrder.orderNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800">{w.durationMonths / 12} Years</span>
                        <span className="text-slate-400 text-[10px]"> ({w.durationMonths}m)</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div>From: {w.warrantyStartDate}</div>
                        <div className="text-[11px] text-slate-400 font-medium">To: {w.warrantyEndDate}</div>
                      </td>
                      <td className="py-3 px-4">
                        {isCurrentlyValid ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ACTIVE</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            EXPIRED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedWarranty(w)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-xs cursor-pointer"
                        >
                          View Certificate
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Modal */}
      {selectedWarranty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border-4 border-emerald-600 relative">
            <button
              onClick={() => setSelectedWarranty(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg no-print"
            >
              ✕
            </button>

            <div className="text-center pb-4 border-b border-slate-200 mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mb-2">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">SUNPOWER SOLUTIONS</h2>
              <p className="text-xs uppercase tracking-widest text-emerald-700 font-bold mt-0.5">
                Official Warranty Certificate
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800">Certificate Number</span>
                  <div className="font-mono font-bold text-emerald-900 text-sm">{selectedWarranty.warrantyNumber}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-800">Coverage Duration</span>
                  <div className="font-bold text-emerald-900 text-sm">{selectedWarranty.durationMonths / 12} Years</div>
                </div>
              </div>

              <div className="space-y-2 border-b border-slate-100 pb-4">
                <div className="flex justify-between">
                  <span className="text-slate-500">Registered Customer:</span>
                  <span className="font-bold text-slate-900">{selectedWarranty.customer.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Protected Equipment:</span>
                  <span className="font-bold text-slate-900">{selectedWarranty.product.name}</span>
                </div>
                {selectedWarranty.serialNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Unique Serial Number:</span>
                    <span className="font-mono font-bold text-purple-700">{selectedWarranty.serialNumber.serialCode}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Site Commissioning Date:</span>
                  <span className="font-semibold text-slate-800">{selectedWarranty.deliveryDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Warranty Valid Until:</span>
                  <span className="font-bold text-emerald-800">{selectedWarranty.warrantyEndDate}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic text-center">
                This certificate guarantees manufacturer free replacement and repair service during the active coverage period.
              </p>

              <div className="flex justify-end space-x-2 pt-2 no-print">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
