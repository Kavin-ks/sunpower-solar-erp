import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { SiteSurvey, Customer, Technician, SurveyStatus } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  Plus,
  CheckCircle2,
  XCircle,
  Calendar,
  Camera,
  MapPin,
  Zap,
  ArrowRight,
  ShieldCheck,
  User,
  Image as ImageIcon,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const SiteSurveysPage: React.FC = () => {
  const [surveys, setSurveys] = useState<SiteSurvey[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [approvalModalSurvey, setApprovalModalSurvey] = useState<SiteSurvey | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalAction, setApprovalAction] = useState<SurveyStatus>('APPROVED');
  const [photoModalSurvey, setPhotoModalSurvey] = useState<SiteSurvey | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    customerId: '',
    enquiryId: '',
    technicianId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    roofDirection: 'South',
    roofTilt: '15 degrees',
    availableRoofAreaSqFt: '400',
    cableDistanceMeters: '25',
    shadingAssessment: '100% Shadow-Free',
    gridSuitability: 'Single Phase 230V Suitable',
    surveyNotes: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).customerId) {
      const state = location.state as any;
      setFormData((prev) => ({
        ...prev,
        customerId: state.customerId.toString(),
        enquiryId: state.enquiryId ? state.enquiryId.toString() : '',
      }));
      setShowScheduleModal(true);
    }
  }, [location.state]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [survRes, custRes, techRes] = await Promise.all([
        api.get('/surveys'),
        api.get('/customers'),
        api.get('/technicians'),
      ]);
      setSurveys(survRes.data);
      setCustomers(custRes.data);
      setTechnicians(techRes.data);
      if (techRes.data.length > 0 && !formData.technicianId) {
        setFormData((prev) => ({ ...prev, technicianId: techRes.data[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/surveys/schedule', {
        customerId: parseInt(formData.customerId),
        enquiryId: formData.enquiryId ? parseInt(formData.enquiryId) : null,
        technicianId: parseInt(formData.technicianId),
        scheduledDate: formData.scheduledDate,
        roofDirection: formData.roofDirection,
        roofTilt: formData.roofTilt,
        availableRoofAreaSqFt: parseFloat(formData.availableRoofAreaSqFt),
        cableDistanceMeters: parseFloat(formData.cableDistanceMeters),
        shadingAssessment: formData.shadingAssessment,
        gridSuitability: formData.gridSuitability,
        surveyNotes: formData.surveyNotes,
      });
      setShowScheduleModal(false);
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule survey');
    }
  };

  const handleApprovalSubmit = async () => {
    if (!approvalModalSurvey) return;
    try {
      await api.patch(`/surveys/${approvalModalSurvey.id}/approval`, {
        status: approvalAction,
        approvalNotes,
      });
      setApprovalModalSurvey(null);
      setApprovalNotes('');
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to review survey');
    }
  };

  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoModalSurvey || !photoUrl) return;
    try {
      await api.post(`/surveys/${photoModalSurvey.id}/photos`, {
        photoUrl,
        caption: photoCaption,
      });
      setPhotoModalSurvey(null);
      setPhotoUrl('');
      setPhotoCaption('');
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add photo');
    }
  };

  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isSales = user?.roles?.includes('ROLE_SALES') || user?.roles?.includes('ROLE_DIRECTOR');
  const isTech = user?.roles?.includes('ROLE_TECHNICIAN');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rooftop Site Surveys</h1>
          <p className="text-sm text-slate-500">
            Physical rooftop assessments, solar shadow feasibility, and mandatory approval gates
          </p>
        </div>

        {isSales && (
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Site Survey</span>
          </button>
        )}
      </div>

      {/* Info Callout */}
      <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl flex items-center space-x-3 text-xs text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <p>
          <strong>Crucial Business Gate:</strong> A formal Solar Quotation cannot be generated or dispatched until a
          technician rooftop survey is reviewed and marked <strong>APPROVED</strong>.
        </p>
      </div>

      {/* Surveys List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Survey #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Orientation & Tilt</th>
                <th className="py-3 px-4">Roof Area</th>
                <th className="py-3 px-4">Shading / Grid</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {surveys.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No site surveys recorded yet.
                  </td>
                </tr>
              ) : (
                surveys.map((surv) => (
                  <tr key={surv.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{surv.surveyNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{surv.customer.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{surv.customer.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{surv.technician?.name || 'Unassigned'}</div>
                      <div className="text-[10px] text-slate-400">{surv.technician?.skills?.split(',')[0]}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{surv.scheduledDate}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">{surv.roofDirection || 'South'}</span>
                      <span className="text-slate-400"> @ {surv.roofTilt || '15°'}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {surv.availableRoofAreaSqFt ? `${surv.availableRoofAreaSqFt} sq.ft` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[11px] font-medium text-slate-700">{surv.shadingAssessment || 'Shadow-Free'}</div>
                      <div className="text-[10px] text-slate-400">{surv.gridSuitability}</div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={surv.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      {isAdmin ? (
                        <span className="text-slate-400 italic text-[11px]">View Only</span>
                      ) : (
                        <>
                          {/* Photo evidence upload button */}
                          <button
                            onClick={() => setPhotoModalSurvey(surv)}
                            title="Add Rooftop Photo"
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Camera className="w-4 h-4 inline" />
                          </button>

                          {surv.status === 'SCHEDULED' && (isSales || isTech) && (
                            <>
                              <button
                                onClick={() => {
                                  setApprovalModalSurvey(surv);
                                  setApprovalAction('APPROVED');
                                }}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-semibold cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setApprovalModalSurvey(surv);
                                  setApprovalAction('REJECTED');
                                }}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded font-semibold cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {surv.status === 'APPROVED' && isSales && (
                            <button
                              onClick={() =>
                                navigate('/quotations', {
                                  state: { customerId: surv.customer.id, siteSurveyId: surv.id },
                                })
                              }
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Generate Quote</span>
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

      {/* Schedule Survey Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Schedule Physical Site Survey</h2>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone}) - {c.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Technician *</label>
                  <select
                    required
                    value={formData.technicianId}
                    onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roof Direction</label>
                  <select
                    value={formData.roofDirection}
                    onChange={(e) => setFormData({ ...formData, roofDirection: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="South">South (Best Radiation)</option>
                    <option value="South-East">South-East</option>
                    <option value="South-West">South-West</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roof Tilt Angle</label>
                  <input
                    type="text"
                    value={formData.roofTilt}
                    onChange={(e) => setFormData({ ...formData, roofTilt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 15 degrees"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shadow-Free Area (sq. ft.)</label>
                  <input
                    type="number"
                    value={formData.availableRoofAreaSqFt}
                    onChange={(e) => setFormData({ ...formData, availableRoofAreaSqFt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cable Run Distance (meters)</label>
                  <input
                    type="number"
                    value={formData.cableDistanceMeters}
                    onChange={(e) => setFormData({ ...formData, cableDistanceMeters: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shading Assessment</label>
                  <input
                    type="text"
                    value={formData.shadingAssessment}
                    onChange={(e) => setFormData({ ...formData, shadingAssessment: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. 100% Shadow-Free, No Parapet shadow"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grid Suitability</label>
                  <input
                    type="text"
                    value={formData.gridSuitability}
                    onChange={(e) => setFormData({ ...formData, gridSuitability: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Single Phase 230V / 3-Phase 415V"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Technician Inspection Remarks</label>
                <textarea
                  rows={2}
                  value={formData.surveyNotes}
                  onChange={(e) => setFormData({ ...formData, surveyNotes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. RCC roof slab in sound structural condition. Elevated mounting recommended."
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
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs"
                >
                  Schedule Survey
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval / Rejection Modal */}
      {approvalModalSurvey && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {approvalAction === 'APPROVED' ? 'Approve Site Survey' : 'Reject Site Survey'}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Survey: {approvalModalSurvey.surveyNumber} for customer {approvalModalSurvey.customer.fullName}
            </p>

            <div className="space-y-3 text-xs mb-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <p>
                  <strong>Rooftop:</strong> {approvalModalSurvey.availableRoofAreaSqFt} sq.ft, {approvalModalSurvey.roofDirection}
                </p>
                <p>
                  <strong>Shading:</strong> {approvalModalSurvey.shadingAssessment}
                </p>
                <p>
                  <strong>Grid:</strong> {approvalModalSurvey.gridSuitability}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {approvalAction === 'APPROVED' ? 'Approval Conditions / Remarks' : 'Rejection Reason'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder={
                    approvalAction === 'APPROVED'
                      ? 'e.g. Rooftop approved for 3 kW On-Grid installation. Solid concrete slab verified.'
                      : 'e.g. Excessive shading from adjacent 4-storey commercial building.'
                  }
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setApprovalModalSurvey(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprovalSubmit}
                className={`px-4 py-2 text-white rounded-xl font-semibold text-xs shadow-xs ${
                  approvalAction === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {approvalAction === 'APPROVED' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {photoModalSurvey && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Attach Survey Rooftop Photo</h2>
            <p className="text-xs text-slate-500 mb-4">Survey: {photoModalSurvey.surveyNumber}</p>

            <form onSubmit={handleAddPhoto} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Photo Image URL / Reference</label>
                <input
                  type="text"
                  required
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. /uploads/roof_aerial_inspection.jpg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Caption / Rooftop Feature</label>
                <input
                  type="text"
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. South elevation facing shadow-free area"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPhotoModalSurvey(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs"
                >
                  Save Photograph
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
