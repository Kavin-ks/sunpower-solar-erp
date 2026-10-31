import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Enquiry, EnquiryStatus } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  Zap,
  Clock,
  CheckCircle2,
  Calendar,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EnquiriesPage: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [followupNote, setFollowupNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

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

  const handleStatusUpdate = async (id: number, newStatus: EnquiryStatus, customNote?: string) => {
    try {
      await api.patch(`/enquiries/${id}/status`, {
        status: newStatus,
        actionNote: customNote || `Stage updated to ${newStatus}`,
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

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry || !followupNote.trim()) return;
    setSubmittingNote(true);
    try {
      await api.patch(`/enquiries/${selectedEnquiry.id}/status`, {
        status: selectedEnquiry.status,
        actionNote: followupNote.trim(),
      });
      setFollowupNote('');
      const res = await api.get(`/enquiries/${selectedEnquiry.id}`);
      setSelectedEnquiry(res.data);
      fetchEnquiries();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to log follow-up note');
    } finally {
      setSubmittingNote(false);
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
          <p className="text-sm text-slate-500">
            Qualify incoming solar rooftop customer enquiries originating from the public customer portal
          </p>
        </div>

        {/* Public customer enquiry portal link - Enquiries strictly originate from public form */}
        <div className="flex items-center space-x-2">
          <a
            href="/enquiry"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Customer Enquiry Portal</span>
          </a>
        </div>
      </div>

      {/* Compliance Callout Banner */}
      <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-xl flex items-center space-x-3 text-xs text-blue-900">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
        <p>
          <strong>Department Workflow Notice:</strong> Manual lead creation has been decommissioned from Sales interface.
          All customer enquiries originate automatically from the public customer submission portal to preserve customer source integrity,
          prevent duplicate phone numbers, and ensure centralized database synchronization.
        </p>
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
                          Yes (PM Surya Ghar)
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-500">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-700">
                        {enq.source.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={enq.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedEnquiry(enq)}
                        className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded text-xs font-semibold cursor-pointer"
                      >
                        View & Qualify
                      </button>

                      {enq.status === 'QUALIFIED' && isSales && (
                        <button
                          onClick={() => navigate('/surveys', { state: { customerId: enq.customer.id, enquiryId: enq.id } })}
                          className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Schedule Survey</span>
                        </button>
                      )}

                      {enq.status === 'SURVEY_APPROVED' && isSales && (
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

      {/* Enquiry Details & Qualification Drawer / Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedEnquiry.enquiryNumber}</h2>
                <p className="text-xs text-slate-500">Customer: {selectedEnquiry.customer.fullName} • Source: {selectedEnquiry.source}</p>
              </div>
              <button onClick={() => setSelectedEnquiry(null)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Quick Status Qualification */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-slate-600">Current Lead Stage:</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedEnquiry.status} />
                  </div>
                </div>

                {isSales && (
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 font-medium">Update Status:</span>
                    <button
                      onClick={() => handleStatusUpdate(selectedEnquiry.id, 'CONTACTED', 'Customer contacted by Sales phone follow-up')}
                      disabled={selectedEnquiry.status === 'CONTACTED'}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold text-xs cursor-pointer disabled:opacity-50"
                    >
                      Contacted
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedEnquiry.id, 'QUALIFIED', 'Lead qualified: rooftop feasible and budget verified')}
                      disabled={selectedEnquiry.status === 'QUALIFIED' || ['SURVEY_SCHEDULED', 'SURVEY_APPROVED', 'QUOTED', 'CONVERTED'].includes(selectedEnquiry.status)}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded font-semibold text-xs cursor-pointer disabled:opacity-50"
                    >
                      Qualify
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedEnquiry.id, 'REJECTED', 'Customer not interested / unreachable')}
                      disabled={selectedEnquiry.status === 'REJECTED'}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded font-semibold text-xs cursor-pointer disabled:opacity-50"
                    >
                      Lost / Reject
                    </button>
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
                  <p className="text-slate-400">System Capacity Requested</p>
                  <p className="font-semibold text-slate-800">
                    {selectedEnquiry.requestedCapacityKw} kW ({selectedEnquiry.systemType})
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Monthly EB Bill</p>
                  <p className="font-semibold text-slate-800">
                    {selectedEnquiry.monthlyElectricityBill ? `₹${selectedEnquiry.monthlyElectricityBill}` : 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400">Installation Address</p>
                  <p className="text-slate-700">{selectedEnquiry.customer.address || 'N/A'}</p>
                </div>
                {selectedEnquiry.notes && (
                  <div className="col-span-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <p className="text-slate-400 font-semibold mb-0.5">Customer Initial Remarks</p>
                    <p className="text-slate-700 italic">{selectedEnquiry.notes}</p>
                  </div>
                )}
              </div>

              {/* Add Follow-up Note Form */}
              {isSales && (
                <form onSubmit={handleAddFollowup} className="flex gap-2">
                  <input
                    type="text"
                    value={followupNote}
                    onChange={(e) => setFollowupNote(e.target.value)}
                    placeholder="Log a follow-up conversation note with customer..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingNote || !followupNote.trim()}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>
                </form>
              )}

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

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <div className="space-x-2">
                  {selectedEnquiry.status === 'QUALIFIED' && isSales && (
                    <button
                      onClick={() => navigate('/surveys', { state: { customerId: selectedEnquiry.customer.id, enquiryId: selectedEnquiry.id } })}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Proceed to Schedule Survey</span>
                    </button>
                  )}

                  {selectedEnquiry.status === 'SURVEY_APPROVED' && isSales && (
                    <button
                      onClick={() => navigate('/quotations', { state: { customerId: selectedEnquiry.customer.id, enquiryId: selectedEnquiry.id } })}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Proceed to Create Quote</span>
                    </button>
                  )}
                </div>

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
