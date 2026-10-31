import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Installation, SalesOrder, Technician } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import {
  Wrench,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Zap,
  Camera,
  UserCheck,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const InstallationsPage: React.FC = () => {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [eligibleOrders, setEligibleOrders] = useState<SalesOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);

  // Schedule Form State
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTechIds, setSelectedTechIds] = useState<number[]>([]);
  const [workNotes, setWorkNotes] = useState('');

  // Complete Form State (Phone & Tablet Friendly Field Form)
  const [installedCapacityKw, setInstalledCapacityKw] = useState('');
  const [panelMounting, setPanelMounting] = useState(true);
  const [wiringConfirmed, setWiringConfirmed] = useState(true);
  const [earthingConfirmed, setEarthingConfirmed] = useState(true);
  const [testingPassed, setTestingPassed] = useState(true);
  const [testingNotes, setTestingNotes] = useState('System generated 4.85 kW at peak noon, grid synchronization normal.');
  const [customerSigneeName, setCustomerSigneeName] = useState('');
  const [customerAcceptanceNote, setCustomerAcceptanceNote] = useState('Satisfied with rooftop solar mounting and inverter operation.');
  const [hoursWorked, setHoursWorked] = useState('8.0');

  // Digital Signature Canvas
  const signatureCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const location = useLocation();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).orderId) {
      setSelectedOrderId((location.state as any).orderId.toString());
      setShowScheduleModal(true);
    }
  }, [location.state]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [instRes, orderRes, techRes] = await Promise.all([
        api.get('/installations'),
        api.get('/orders'),
        api.get('/technicians'),
      ]);
      setInstallations(instRes.data);
      const eligible = orderRes.data.filter((o: SalesOrder) =>
        ['CONFIRMED', 'DISPATCHED', 'IN_INSTALLATION'].includes(o.status)
      );
      setEligibleOrders(eligible);
      setTechnicians(techRes.data);
      if (techRes.data.length >= 2 && selectedTechIds.length === 0) {
        setSelectedTechIds([techRes.data[0].id, techRes.data[1].id]);
      }
      if (eligible.length > 0 && !selectedOrderId) {
        setSelectedOrderId(eligible[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTechIds.length === 0) {
      alert('Please assign at least one technician to the installation crew.');
      return;
    }
    try {
      await api.post('/installations/schedule', {
        salesOrderId: parseInt(selectedOrderId),
        scheduledDate,
        technicians: selectedTechIds.map((id, idx) => ({
          technicianId: id,
          roleInCrew: idx === 0 ? 'Lead Commissioning Engineer' : 'Mounting Specialist',
        })),
        workNotes,
      });
      setShowScheduleModal(false);
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule installation');
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallation) return;
    try {
      const hours = parseFloat(hoursWorked) || 8.0;
      let signatureUrl: string | undefined = undefined;
      if (signatureCanvasRef.current && hasSignature) {
        signatureUrl = signatureCanvasRef.current.toDataURL('image/png');
      }

      await api.post(`/installations/${selectedInstallation.id}/complete`, {
        installedCapacityKw: parseFloat(installedCapacityKw) || selectedInstallation.salesOrder.capacityKw,
        panelMountingConfirmed: panelMounting,
        wiringConfirmed,
        earthingConfirmed,
        testingPassed,
        testingNotes,
        customerSigneeName,
        customerSignatureUrl: signatureUrl,
        customerAcceptanceNote,
        technicianHours: selectedInstallation.assignedTechnicians.map((it) => ({
          technicianId: it.technician.id,
          hoursWorked: hours,
          payoutAmount: hours * (it.technician.hourlyRate || 250), // Auto-calculated with technician hourly rate
        })),
      });
      setShowCompleteModal(false);
      fetchInitialData();
      alert('Installation successfully marked completed! Customer digital sign-off and technician disbursements recorded.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete installation');
    }
  };

  const toggleTech = (id: number) => {
    if (selectedTechIds.includes(id)) {
      setSelectedTechIds(selectedTechIds.filter((t) => t !== id));
    } else {
      setSelectedTechIds([...selectedTechIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Installation Field Operations</h1>
          <p className="text-sm text-slate-500">
            Crew dispatching (15 technicians), mounting, earthing, generation testing, and customer digital sign-off
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Assign Crew & Schedule</span>
        </button>
      </div>

      {/* Installations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Job #</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Assigned Field Crew</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Testing Result</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {installations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No installation jobs currently scheduled.
                  </td>
                </tr>
              ) : (
                installations.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{inst.installationNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{inst.salesOrder.orderNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{inst.customer.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{inst.customer.city}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        {inst.assignedTechnicians?.map((t) => (
                          <div key={t.id} className="text-[11px] text-slate-700 flex items-center space-x-1">
                            <span className="font-semibold">{t.technician.name}</span>
                            <span className="text-slate-400 text-[10px]">({t.roleInCrew})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{inst.scheduledDate}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {inst.installedCapacityKw || inst.salesOrder.capacityKw} kW
                    </td>
                    <td className="py-3 px-4">
                      {inst.testingPassed ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASSED</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pending Commissioning</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inst.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      {inst.status !== 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setSelectedInstallation(inst);
                            setInstalledCapacityKw(inst.salesOrder.capacityKw.toString());
                            setCustomerSigneeName(inst.customer.fullName);
                            setShowCompleteModal(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs shadow-xs cursor-pointer inline-flex items-center space-x-1"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Field Sign-Off</span>
                        </button>
                      )}

                      {inst.status === 'COMPLETED' && (
                        <div className="inline-flex items-center space-x-1.5">
                          {inst.customerSignatureUrl ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center space-x-1">
                              <span>Digital Sign-Off ✓</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium italic">Commissioned</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Assign Crew & Schedule */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Assign Installation Crew</h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Confirmed Order *</label>
                <select
                  required
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Order --</option>
                  {eligibleOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customer.fullName} ({o.capacityKw} kW {o.systemType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Installation Target Date *</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Multi-Select Field Technicians (Crew of 15) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assign Technicians from Crew (Select 1 to 3) *
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                  {technicians.map((t) => {
                    const isSelected = selectedTechIds.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => toggleTech(t.id)}
                        className={`p-2 rounded-lg border transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded text-emerald-600 pointer-events-none"
                          />
                          <span className="truncate">{t.name}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{t.skills}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Instructions / Roof Safety Notes</label>
                <textarea
                  rows={2}
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Roof safety harnesses required. Elevated structure mounting bolts."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={eligibleOrders.length === 0}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs disabled:opacity-50"
                >
                  Confirm Crew Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Field Technician Tablet/Phone Completion Form */}
      {showCompleteModal && selectedInstallation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Field Commissioning & Sign-Off</h2>
                <p className="text-xs text-slate-500">
                  Job: {selectedInstallation.installationNumber} | {selectedInstallation.customer.fullName}
                </p>
              </div>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Installed Capacity (kW) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={installedCapacityKw}
                  onChange={(e) => setInstalledCapacityKw(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Technical Milestone Checklists */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <span className="block font-bold text-slate-800 text-xs">Technical Checklist & Verification:</span>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={panelMounting}
                    onChange={(e) => setPanelMounting(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded"
                  />
                  <span className="font-medium text-slate-700">1. Solar Panel Mounting & Structure Torque Confirmed</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wiringConfirmed}
                    onChange={(e) => setWiringConfirmed(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded"
                  />
                  <span className="font-medium text-slate-700">2. DC / AC Cabling, Conduit & MC4 Connections Verified</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={earthingConfirmed}
                    onChange={(e) => setEarthingConfirmed(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded"
                  />
                  <span className="font-medium text-slate-700">3. Chemical Safety Earthing & SPD Lightning Arrestor Grounded</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testingPassed}
                    onChange={(e) => setTestingPassed(e.target.checked)}
                    className="h-4 w-4 text-emerald-600 rounded"
                  />
                  <span className="font-medium text-slate-700">4. Live Generation Testing & Grid Sync Commissioned</span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Testing & Generation Measurement Notes</label>
                <input
                  type="text"
                  required
                  value={testingNotes}
                  onChange={(e) => setTestingNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Generating 4.9 kW at 1:30 PM. Inverter display normal."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Signee Full Name *</label>
                  <input
                    type="text"
                    required
                    value={customerSigneeName}
                    onChange={(e) => setCustomerSigneeName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Crew Hours Worked (per tech)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer Digital Acceptance Remarks</label>
                <textarea
                  rows={2}
                  required
                  value={customerAcceptanceNote}
                  onChange={(e) => setCustomerAcceptanceNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Digital Signature Pad */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Homeowner On-Screen Digital Signature</label>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[11px] text-slate-500 hover:text-rose-600 underline cursor-pointer"
                  >
                    Clear Signature
                  </button>
                </div>
                <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50 p-1">
                  <canvas
                    ref={signatureCanvasRef}
                    width={450}
                    height={100}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-24 touch-none bg-white rounded-lg cursor-crosshair border border-slate-200"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Please draw signature above (touchscreen or mouse supported)</p>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs"
                >
                  Submit Completion & Customer Acceptance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
