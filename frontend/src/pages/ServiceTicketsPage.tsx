import React, { useState, useEffect } from 'react';
import {
  Headphones,
  Search,
  Plus,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  AlertTriangle,
  FileCheck,
  X,
  Phone,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ServiceTicket, Customer, Technician, Product, TicketStatus } from '../types';
import { Badge } from '../components/ui/Badge';

export const ServiceTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<ServiceTicket[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    customerId: '',
    serialCode: '',
    faultCode: 'E04 - Grid Phase Overvoltage',
    complaintDescription: '',
  });

  const [assignTechId, setAssignTechId] = useState<string>('');

  const [resolveForm, setResolveForm] = useState({
    diagnosisNotes: '',
    resolutionNotes: '',
    laborCharges: 0,
    parts: [] as { productId: number; quantity: number }[],
  });

  const [confirmForm, setConfirmForm] = useState({
    customerSatisfactionNotes: 'Customer tested and acknowledged solar generation restored at 4.2 kW.',
    confirmedByCustomerName: '',
  });

  const [selectedPartProduct, setSelectedPartProduct] = useState<string>('');
  const [selectedPartQty, setSelectedPartQty] = useState<number>(1);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/service-tickets');
      setTickets(res.data);
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const [custRes, techRes, prodRes] = await Promise.all([
        api.get('/api/customers'),
        api.get('/api/technicians'),
        api.get('/api/products'),
      ]);
      setCustomers(custRes.data);
      setTechnicians(techRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error('Failed to load auxiliary data', err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchAuxiliaryData();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/service-tickets', {
        customerId: Number(createForm.customerId),
        serialCode: createForm.serialCode.trim() || undefined,
        faultCode: createForm.faultCode,
        complaintDescription: createForm.complaintDescription,
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        customerId: '',
        serialCode: '',
        faultCode: 'E04 - Grid Phase Overvoltage',
        complaintDescription: '',
      });
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create service ticket');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !assignTechId) return;
    try {
      await api.patch(`/api/service-tickets/${selectedTicket.id}/assign/${assignTechId}`);
      setIsAssignModalOpen(false);
      setSelectedTicket(null);
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to assign technician');
    }
  };

  const handleAddPart = () => {
    if (!selectedPartProduct) return;
    const prod = products.find((p) => p.id === Number(selectedPartProduct));
    if (!prod) return;
    setResolveForm({
      ...resolveForm,
      parts: [
        ...resolveForm.parts,
        { productId: prod.id, quantity: selectedPartQty },
      ],
    });
    setSelectedPartProduct('');
    setSelectedPartQty(1);
  };

  const handleRemovePart = (index: number) => {
    setResolveForm({
      ...resolveForm,
      parts: resolveForm.parts.filter((_, i) => i !== index),
    });
  };

  const handleResolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await api.post(`/api/service-tickets/${selectedTicket.id}/resolve`, {
        diagnosisNotes: resolveForm.diagnosisNotes,
        resolutionNotes: resolveForm.resolutionNotes,
        laborCharges: selectedTicket.underWarranty ? 0 : Number(resolveForm.laborCharges),
        parts: resolveForm.parts,
      });
      setIsResolveModalOpen(false);
      setSelectedTicket(null);
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resolve ticket');
    }
  };

  const handleConfirmAndClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    try {
      await api.post(`/api/service-tickets/${selectedTicket.id}/confirm-and-close`, {
        confirmedByCustomerName: confirmForm.confirmedByCustomerName,
        customerSatisfactionNotes: confirmForm.customerSatisfactionNotes,
      });
      setIsConfirmModalOpen(false);
      setSelectedTicket(null);
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to close ticket');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customer?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customer?.phone.includes(searchTerm) ||
      (t.serialNumber?.serialCode && t.serialNumber.serialCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.faultCode && t.faultCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_DIRECTOR');
  const isSupport = user?.roles?.includes('ROLE_SUPPORT') && !isAdmin;
  const isTech = user?.roles?.includes('ROLE_TECHNICIAN') && !isAdmin;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Headphones className="w-6 h-6 text-emerald-600" />
            After-Sales Service & Breakdown Desk
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            End-to-end fault logging, serial warranty verification (₹0 warranty coverage vs paid), technician dispatch, & customer closure gate.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold">
              Director Audit Mode (Read-Only)
            </span>
          )}

          {isSupport && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-medium shadow-sm hover:bg-emerald-700 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log New Service Ticket
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Open / Assigned</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {tickets.filter((t) => ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length}
            </div>
            <div className="text-xs text-amber-600 mt-1 font-medium">Active In Field</div>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Under Warranty</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {tickets.filter((t) => t.underWarranty).length}
            </div>
            <div className="text-xs text-emerald-600 mt-1 font-medium">100% Free Parts & Labor</div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Awaiting Sign-Off</div>
            <div className="text-2xl font-bold text-purple-700 mt-1">
              {tickets.filter((t) => t.status === 'RESOLVED').length}
            </div>
            <div className="text-xs text-purple-600 mt-1 font-medium">Customer Confirmation Gate</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Closed & Satisfied</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {tickets.filter((t) => ['CUSTOMER_CONFIRMED', 'CLOSED'].includes(t.status)).length}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">Complete Lifecycle Done</div>
          </div>
          <div className="p-3 bg-slate-100 rounded-xl text-slate-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ticket #, customer, serial, fault code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
          {['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading service tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No service tickets matching criteria</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Ticket / Date</th>
                  <th className="py-3 px-4">Customer & Phone</th>
                  <th className="py-3 px-4">Fault Code & Issue</th>
                  <th className="py-3 px-4">Serial & Warranty Status</th>
                  <th className="py-3 px-4">Assigned Tech</th>
                  <th className="py-3 px-4">Status & Cost</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      <div>{t.ticketNumber}</div>
                      <div className="text-xs font-sans text-slate-400">{t.reportedDate}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{t.customer?.fullName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {t.customer?.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {t.faultCode && (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-800 mb-1">
                          {t.faultCode}
                        </span>
                      )}
                      <p className="text-xs text-slate-600 line-clamp-2">{t.complaintDescription}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {t.serialNumber ? (
                        <div className="font-mono text-xs text-slate-800 font-medium">
                          {t.serialNumber.serialCode}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">General System</span>
                      )}
                      <div className="mt-1">
                        {t.underWarranty ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <ShieldCheck className="w-3 h-3" /> In-Warranty (Free)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                            <ShieldAlert className="w-3 h-3" /> Out of Warranty (Billable)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {t.assignedTechnician ? (
                        <div className="text-xs">
                          <p className="font-semibold text-slate-900">{t.assignedTechnician.name}</p>
                          <p className="text-slate-400">{t.assignedTechnician.phone}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={t.status} />
                      <div className="text-xs mt-1">
                        {t.underWarranty ? (
                          <span className="font-semibold text-emerald-700">₹0 Total</span>
                        ) : (
                          <span className="font-semibold text-slate-900">
                            ₹{(t.totalCustomerCharges || 0).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {isAdmin ? (
                        <span className="text-slate-400 italic text-[11px]">View Only</span>
                      ) : (
                        <>
                          {/* Assign button */}
                          {['OPEN', 'ASSIGNED'].includes(t.status) && isSupport && (
                            <button
                              onClick={() => {
                                setSelectedTicket(t);
                                setAssignTechId(t.assignedTechnician ? String(t.assignedTechnician.id) : '');
                                setIsAssignModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                            >
                              {t.assignedTechnician ? 'Reassign' : 'Assign'}
                            </button>
                          )}

                          {/* Resolve button */}
                          {['ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_PARTS'].includes(t.status) && (isSupport || isTech) && (
                            <button
                              onClick={() => {
                                setSelectedTicket(t);
                                setResolveForm({
                                  diagnosisNotes: 'Inverter error E04 diagnosed: grid phase voltage spike triggered auto-shutdown. Firmware re-flashed and DC isolator checked.',
                                  resolutionNotes: 'Firmware updated to v3.2.0. Cleaned contactors and tested grid voltage at 238V. Inverter generating steady power.',
                                  laborCharges: t.underWarranty ? 0 : 500,
                                  parts: [],
                                });
                                setIsResolveModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer"
                            >
                              Resolve
                            </button>
                          )}

                          {/* Customer confirmation gate */}
                          {t.status === 'RESOLVED' && isSupport && (
                            <button
                              onClick={() => {
                                setSelectedTicket(t);
                                setConfirmForm({
                                  confirmedByCustomerName: t.customer?.fullName || '',
                                  customerSatisfactionNotes: 'Customer satisfied with inverter reset and confirmed normal generation.',
                                });
                                setIsConfirmModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold rounded bg-purple-600 text-white hover:bg-purple-700 transition cursor-pointer inline-flex items-center gap-1"
                            >
                              <UserCheck className="w-3 h-3 inline mr-1" />
                              Confirm & Close
                            </button>
                          )}
                        </>
                      )}

                      {/* Printable Job Sheet */}
                      {['RESOLVED', 'CUSTOMER_CONFIRMED', 'CLOSED'].includes(t.status) && (
                        <button
                          onClick={() => {
                            setSelectedTicket(t);
                            setTimeout(() => window.print(), 300);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 transition rounded"
                          title="Print Service Job Sheet"
                        >
                          <Printer className="w-4 h-4 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE TICKET MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Headphones className="w-5 h-5 text-emerald-600" />
                Log Customer Service Ticket
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Customer *
                </label>
                <select
                  required
                  value={createForm.customerId}
                  onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone}) - {c.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Product Serial Number (Optional - Auto-verifies Warranty)
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-GROWATT-2026-9041"
                  value={createForm.serialCode}
                  onChange={(e) => setCreateForm({ ...createForm, serialCode: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  If serial code is provided, system automatically checks active warranty period (20-yr panel / 2-yr inverter).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Fault / Error Code
                </label>
                <select
                  value={createForm.faultCode}
                  onChange={(e) => setCreateForm({ ...createForm, faultCode: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
                >
                  <option value="E04 - Grid Phase Overvoltage">E04 - Grid Phase Overvoltage</option>
                  <option value="E01 - Low PV Insulation Resistance">E01 - Low PV Insulation Resistance</option>
                  <option value="E02 - Inverter Over-Temperature">E02 - Inverter Over-Temperature</option>
                  <option value="E08 - Battery BMS Disconnected">E08 - Battery BMS Disconnected</option>
                  <option value="GEN01 - Solar Generation Zero on Display">GEN01 - Solar Generation Zero on Display</option>
                  <option value="PHYS01 - Panel Physical Glass Cracked / Hail Damage">PHYS01 - Panel Physical Glass Cracked / Hail Damage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Complaint Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={createForm.complaintDescription}
                  onChange={(e) => setCreateForm({ ...createForm, complaintDescription: e.target.value })}
                  placeholder="Customer observed red error LED blinking since morning after heavy rain..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN TECHNICIAN MODAL */}
      {isAssignModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Assign Service Technician</h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-1">
                <div>
                  <span className="font-semibold text-slate-700">Ticket:</span>{' '}
                  {selectedTicket.ticketNumber}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Customer:</span>{' '}
                  {selectedTicket.customer?.fullName}
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Fault:</span>{' '}
                  {selectedTicket.faultCode || 'General'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Select Certified Technician
                </label>
                <select
                  required
                  value={assignTechId}
                  onChange={(e) => setAssignTechId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Technician --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} - Skills: {t.skills} ({t.available ? 'Available' : 'Busy'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE TICKET MODAL */}
      {isResolveModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Technical Resolution & Parts Replacement
                </h3>
                <p className="text-xs text-slate-500">
                  Ticket #{selectedTicket.ticketNumber} • {selectedTicket.customer?.fullName}
                </p>
              </div>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedTicket.underWarranty ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-900">
                  <span className="font-bold">Active Warranty Rule Applied:</span> All replacement parts and technician labor charges will automatically be ₹0 on customer invoice.
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold">Out of Warranty:</span> Parts and labor will be billed to customer upon completion.
                </div>
              </div>
            )}

            <form onSubmit={handleResolveTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Root Cause Diagnosis Notes *
                </label>
                <textarea
                  required
                  rows={2}
                  value={resolveForm.diagnosisNotes}
                  onChange={(e) => setResolveForm({ ...resolveForm, diagnosisNotes: e.target.value })}
                  placeholder="Detailed root cause explanation..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Resolution & Action Taken Notes *
                </label>
                <textarea
                  required
                  rows={2}
                  value={resolveForm.resolutionNotes}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })}
                  placeholder="Actions taken to resolve the breakdown..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {!selectedTicket.underWarranty && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Labor Charges (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={resolveForm.laborCharges}
                    onChange={(e) => setResolveForm({ ...resolveForm, laborCharges: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Replaced Parts Section */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase">
                  Replaced Spare Parts (Optional)
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedPartProduct}
                    onChange={(e) => setSelectedPartProduct(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="">-- Select Product From Inventory --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.currentStock}) - ₹{p.sellingPrice}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={selectedPartQty}
                    onChange={(e) => setSelectedPartQty(Number(e.target.value))}
                    className="w-16 border border-slate-200 rounded-lg p-2 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-900"
                  >
                    Add Part
                  </button>
                </div>

                {resolveForm.parts.length > 0 && (
                  <div className="space-y-1">
                    {resolveForm.parts.map((item, idx) => {
                      const prod = products.find((p) => p.id === item.productId);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{prod?.name}</span> x{' '}
                            {item.quantity}
                            {selectedTicket.underWarranty && (
                              <span className="ml-2 text-emerald-600 font-bold">(₹0 Warranty)</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePart(idx)}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                >
                  Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER CONFIRMATION & CLOSURE GATE MODAL */}
      {isConfirmModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                  Customer Confirmation Gate
                </h3>
                <p className="text-xs text-slate-500">
                  A service ticket cannot be closed without verified customer sign-off.
                </p>
              </div>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-xs text-purple-900 space-y-1">
              <div className="font-semibold">Resolution Summary:</div>
              <div>{selectedTicket.resolutionNotes || 'Inverter serviced and generation restored.'}</div>
            </div>

            <form onSubmit={handleConfirmAndClose} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Customer / Signee Name *
                </label>
                <input
                  required
                  type="text"
                  value={confirmForm.confirmedByCustomerName}
                  onChange={(e) =>
                    setConfirmForm({ ...confirmForm, confirmedByCustomerName: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Customer Acceptance / Satisfaction Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={confirmForm.customerSatisfactionNotes}
                  onChange={(e) =>
                    setConfirmForm({ ...confirmForm, customerSatisfactionNotes: e.target.value })
                  }
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Confirm & Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE SERVICE JOB SHEET (Print View Only) */}
      {selectedTicket && (
        <div className="hidden print:block fixed inset-0 bg-white p-8 z-50 text-slate-900">
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider text-emerald-800">
                SunPower Solutions
              </h1>
              <p className="text-xs text-slate-500">
                Rooftop Solar EPC • Field Service & Warranty Division
              </p>
              <p className="text-xs text-slate-500">Helpline: +91 98765 43210 | support@sunpowersolutions.in</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-mono font-bold">{selectedTicket.ticketNumber}</div>
              <div className="text-xs text-slate-500">Reported: {selectedTicket.reportedDate}</div>
              <div className="text-xs font-bold mt-1 text-emerald-700">
                {selectedTicket.underWarranty ? 'UNDER WARRANTY - ZERO CHARGE' : 'CHARGEABLE SERVICE'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div className="border border-slate-200 p-4 rounded-lg">
              <h3 className="font-bold text-xs uppercase text-slate-400 mb-2">Customer Details</h3>
              <p className="font-semibold text-slate-900">{selectedTicket.customer?.fullName}</p>
              <p className="text-slate-600">{selectedTicket.customer?.address}</p>
              <p className="text-slate-600">
                {selectedTicket.customer?.city} - {selectedTicket.customer?.pincode}
              </p>
              <p className="text-slate-600">Phone: {selectedTicket.customer?.phone}</p>
            </div>

            <div className="border border-slate-200 p-4 rounded-lg">
              <h3 className="font-bold text-xs uppercase text-slate-400 mb-2">Equipment & Fault</h3>
              <p>
                <span className="font-medium text-slate-600">Serial Code:</span>{' '}
                <span className="font-mono">{selectedTicket.serialNumber?.serialCode || 'N/A'}</span>
              </p>
              <p>
                <span className="font-medium text-slate-600">Fault Code:</span>{' '}
                <span className="font-bold">{selectedTicket.faultCode || 'None'}</span>
              </p>
              <p>
                <span className="font-medium text-slate-600">Complaint:</span>{' '}
                {selectedTicket.complaintDescription}
              </p>
              <p>
                <span className="font-medium text-slate-600">Service Engineer:</span>{' '}
                {selectedTicket.assignedTechnician?.name || 'Unassigned'}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 p-4 rounded-lg mb-6 text-sm">
            <h3 className="font-bold text-xs uppercase text-slate-400 mb-2">Technical Resolution</h3>
            <p className="mb-2">
              <span className="font-semibold">Diagnosis:</span> {selectedTicket.diagnosisNotes || 'N/A'}
            </p>
            <p>
              <span className="font-semibold">Action Taken:</span>{' '}
              {selectedTicket.resolutionNotes || 'N/A'}
            </p>
          </div>

          <div className="border-t-2 border-slate-200 pt-6 mt-12 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="h-16 border-b border-dashed border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-800">Technician Signature</p>
              <p className="text-slate-400">SunPower Certified Solar Engineer</p>
            </div>
            <div>
              <div className="h-16 border-b border-dashed border-slate-400 mb-2"></div>
              <p className="font-bold text-slate-800">Customer Sign-off & Acceptance</p>
              <p className="text-slate-400">
                {selectedTicket.customer?.fullName}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
