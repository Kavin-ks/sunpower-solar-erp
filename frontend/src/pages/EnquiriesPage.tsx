import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Enquiry, EnquiryStatus } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EnquiriesPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    customerType: 'RESIDENTIAL',
    requestedCapacityKw: '3.00',
    systemType: 'ON_GRID',
    subsidyRequired: false,
    monthlyElectricityBill: '',
    shadowFreeAreaSqFt: '',
    gridSuitable: true,
    source: 'WEBSITE',
    notes: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchEnquiries();
  }, [search, statusFilter]);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      let url = '/enquiries?';
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      const res = await api.get(url);
      setEnquiries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/enquiries', {
        ...formData,
        requestedCapacityKw: parseFloat(formData.requestedCapacityKw),
        monthlyElectricityBill: formData.monthlyElectricityBill ? parseFloat(formData.monthlyElectricityBill) : null,
        shadowFreeAreaSqFt: formData.shadowFreeAreaSqFt ? parseFloat(formData.shadowFreeAreaSqFt) : null,
        gridSuitable: formData.gridSuitable,
      });
      setShowModal(false);
      fetchEnquiries();
      // Reset form
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        customerType: 'RESIDENTIAL',
        requestedCapacityKw: '3.00',
        systemType: 'ON_GRID',
        subsidyRequired: false,
        monthlyElectricityBill: '',
        shadowFreeAreaSqFt: '',
        gridSuitable: true,
        source: 'WEBSITE',
        notes: '',
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create enquiry');
    }
  };

  const handleStatusUpdate = async (id: number, newStatus: EnquiryStatus) => {
    try {
      await api.patch(`/enquiries/${id}/status`, {
        status: newStatus,
        actionNote: `Stage updated to ${newStatus}`,
      });
      fetchEnquiries();
      if (selectedEnquiry && selectedEnquiry.id === id) {
        const res = await api.get(`/enquiries/${id}`);
        setSelectedEnquiry(res.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isSales = user?.roles?.includes('ROLE_SALES') || user?.roles?.includes('ROLE_DIRECTOR');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Enquiries & Leads</h1>
          <p className="text-sm text-slate-500">Capture, qualify, and track solar rooftop enquiries</p>
        </div>

        {isSales && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer Lead</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, enquiry #..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="SURVEY_SCHEDULED">Survey Scheduled</option>
            <option value="SURVEY_APPROVED">Survey Approved</option>
            <option value="QUOTED">Quoted</option>
            <option value="CONVERTED">Converted</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Lead ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">System Req</th>
                <th className="py-3 px-4">Bill (₹)</th>
                <th className="py-3 px-4">Subsidy</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No customer enquiries found matching filter.
                  </td>
                </tr>
              ) : (
                enquiries.map((enq) => (
                  <tr key={enq.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{enq.enquiryNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{enq.customer.fullName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{enq.customer.phone}</span>
                        {enq.customer.city && <span>• {enq.customer.city}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800">{enq.requestedCapacityKw} kW</span>
                      <span className="ml-1 text-[11px] text-slate-500">
                        ({enq.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid'})
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {enq.monthlyElectricityBill ? `₹${enq.monthlyElectricityBill}` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {enq.subsidyRequired ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Yes (Govt)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-500">{enq.source.toLowerCase()}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={enq.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedEnquiry(enq)}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium cursor-pointer"
                      >
                        Details
                      </button>

                      {enq.status === 'QUALIFIED' && (
                        <button
                          onClick={() => navigate('/surveys', { state: { customerId: enq.customer.id, enquiryId: enq.id } })}
                          className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Schedule Survey</span>
                        </button>
                      )}

                      {enq.status === 'SURVEY_APPROVED' && (
                        <button
                          onClick={() => navigate('/quotations', { state: { customerId: enq.customer.id, enquiryId: enq.id } })}
                          className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Create Quote</span>
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

      {/* Lead Capture Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-900">New Solar Customer Lead</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEnquiry} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Ramesh Chandran"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 9841029384"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Category</label>
                  <select
                    value={formData.customerType}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="RESIDENTIAL">Residential Rooftop</option>
                    <option value="SMALL_FACTORY">Small Factory / Industrial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site / Roof Address</label>
                <textarea
                  rows={2}
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Street address, city, landmarks..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Required Capacity</label>
                  <select
                    value={formData.requestedCapacityKw}
                    onChange={(e) => setFormData({ ...formData, requestedCapacityKw: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="1.00">1 kW System</option>
                    <option value="2.00">2 kW System</option>
                    <option value="3.00">3 kW System (Standard)</option>
                    <option value="4.00">4 kW System</option>
                    <option value="5.00">5 kW System</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grid Architecture</label>
                  <select
                    value={formData.systemType}
                    onChange={(e) => setFormData({ ...formData, systemType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ON_GRID">On-Grid (Net Meter)</option>
                    <option value="OFF_GRID">Off-Grid (Battery Bank)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly EB Bill (₹)</label>
                  <input
                    type="number"
                    value={formData.monthlyElectricityBill}
                    onChange={(e) => setFormData({ ...formData, monthlyElectricityBill: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 3500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="WEBSITE">Website Form</option>
                    <option value="WHATSAPP">WhatsApp Enquiry</option>
                    <option value="PHONE">Phone Call</option>
                    <option value="MANUAL">Direct Field Walk-in</option>
                  </select>
                </div>

                <div className="pt-4 flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="subsidyReq"
                    checked={formData.subsidyRequired}
                    onChange={(e) => setFormData({ ...formData, subsidyRequired: e.target.checked })}
                    className="h-4 w-4 text-emerald-600 rounded border-slate-300"
                  />
                  <label htmlFor="subsidyReq" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Apply for Govt Subsidy (PM Surya Ghar)
                  </label>
                </div>
              </div>

              {/* Initial Phone Check Details */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shadow-Free Area (Sq. Ft.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.shadowFreeAreaSqFt}
                    onChange={(e) => setFormData({ ...formData, shadowFreeAreaSqFt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 450.00 (Optional)"
                  />
                </div>
                <div className="flex flex-col justify-center pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer mt-3">
                    <input
                      type="checkbox"
                      checked={formData.gridSuitable}
                      onChange={(e) => setFormData({ ...formData, gridSuitable: e.target.checked })}
                      className="h-4 w-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-700">Initial Grid Check Suitable</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Special Requirements</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Flat roof, wants morning survey call..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enquiry Details Slide-over / Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedEnquiry.enquiryNumber}</h2>
                <p className="text-xs text-slate-500">Customer: {selectedEnquiry.customer.fullName}</p>
              </div>
              <button onClick={() => setSelectedEnquiry(null)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Quick Status Advance */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-600">Current Lead Stage:</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedEnquiry.status} />
                  </div>
                </div>

                {!isAdmin && (
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Advance to:</span>
                    <select
                      value={selectedEnquiry.status}
                      onChange={(e) => handleStatusUpdate(selectedEnquiry.id, e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-800"
                    >
                      <option value="NEW">NEW</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="QUALIFIED">QUALIFIED</option>
                      <option value="SURVEY_SCHEDULED">SURVEY_SCHEDULED</option>
                      <option value="SURVEY_APPROVED">SURVEY_APPROVED</option>
                      <option value="QUOTED">QUOTED</option>
                      <option value="CONVERTED">CONVERTED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                <div>
                  <p className="text-slate-400">Phone</p>
                  <p className="font-semibold text-slate-800">{selectedEnquiry.customer.phone}</p>
                </div>
                <div>
                  <p className="text-slate-400">Email</p>
                  <p className="font-semibold text-slate-800">{selectedEnquiry.customer.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400">System Capacity</p>
                  <p className="font-semibold text-slate-800">
                    {selectedEnquiry.requestedCapacityKw} kW ({selectedEnquiry.systemType})
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Monthly Bill</p>
                  <p className="font-semibold text-slate-800">
                    {selectedEnquiry.monthlyElectricityBill ? `₹${selectedEnquiry.monthlyElectricityBill}` : 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400">Address</p>
                  <p className="text-slate-700">{selectedEnquiry.customer.address || 'N/A'}</p>
                </div>
              </div>

              {/* Activity History */}
              <div>
                <h3 className="font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Audit Trail & Activity Log</span>
                </h3>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2 max-h-48 overflow-y-auto">
                  {selectedEnquiry.activities && selectedEnquiry.activities.length > 0 ? (
                    selectedEnquiry.activities.map((act) => (
                      <div key={act.id} className="text-[11px] pb-2 border-b border-slate-200/60 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="font-bold text-slate-800">{act.action}</span>
                          <span className="text-slate-400">{new Date(act.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{act.notes}</p>
                        <p className="text-[10px] text-slate-400 italic">By: {act.performedBy}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 italic text-center py-2">No activity logged yet.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedEnquiry(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
