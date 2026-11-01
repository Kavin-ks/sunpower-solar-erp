import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { SiteSurvey, Customer, Technician, SurveyStatus, Enquiry } from '../types';
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
  FileText,
  AlertTriangle,
  RotateCcw,
  Eye,
  Edit3,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CameraPhotoUpload } from '../components/common/CameraPhotoUpload';

export const SiteSurveysPage: React.FC = () => {
  const [surveys, setSurveys] = useState<SiteSurvey[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [inspectionModalSurvey, setInspectionModalSurvey] = useState<SiteSurvey | null>(null);
  const [reviewModalSurvey, setReviewModalSurvey] = useState<SiteSurvey | null>(null);
  const [viewReportSurvey, setViewReportSurvey] = useState<SiteSurvey | null>(null);
  const [photoModalSurvey, setPhotoModalSurvey] = useState<SiteSurvey | null>(null);

  // Review Form State (Sales Lead)
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<SurveyStatus>('APPROVED');

  // Photo State
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  // 1. Sales Scheduling Form State (strictly enquiry, technician, date, instructions)
  const [scheduleData, setScheduleData] = useState({
    customerId: '',
    enquiryId: '',
    technicianId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    surveyNotes: '',
  });

  // 2. Technician Inspection Report Form State (technical physical inspection measurements)
  const [inspectionData, setInspectionData] = useState({
    roofDirection: 'South',
    roofTilt: '15 degrees',
    roofCondition: 'RCC Flat Concrete Slab - Excellent structural integrity',
    availableRoofAreaSqFt: '450',
    cableDistanceMeters: '20',
    shadingAssessment: '100% Shadow-Free all seasons',
    gridSuitability: 'Single Phase 230V / 3-Phase 415V Suitable for Net-Metering',
    structuralObservations: 'Slab thickness 6 inches, easily supports standard HDG modular mounting frames without roof penetration leaks.',
    surveyNotes: 'Client confirmed roof access stairs available. Earthing pit location finalized in north corner.',
    inspectionRecommendation: 'APPROVED',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).customerId) {
      const state = location.state as any;
      setScheduleData((prev) => ({
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
      const [survRes, custRes, techRes, enqRes] = await Promise.all([
        api.get('/surveys'),
        api.get('/customers'),
        api.get('/technicians'),
        api.get('/enquiries'),
      ]);
      setSurveys(survRes.data);
      setCustomers(custRes.data);
      setTechnicians(techRes.data);
      setEnquiries(enqRes.data);
      if (techRes.data.length > 0 && !scheduleData.technicianId) {
        setScheduleData((prev) => ({ ...prev, technicianId: techRes.data[0].id.toString() }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sales schedules survey (no technical fields)
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/surveys/schedule', {
        customerId: parseInt(scheduleData.customerId),
        enquiryId: scheduleData.enquiryId ? parseInt(scheduleData.enquiryId) : null,
        technicianId: parseInt(scheduleData.technicianId),
        scheduledDate: scheduleData.scheduledDate,
        surveyNotes: scheduleData.surveyNotes,
      });
      setShowScheduleModal(false);
      setScheduleData({
        customerId: '',
        enquiryId: '',
        technicianId: technicians.length > 0 ? technicians[0].id.toString() : '',
        scheduledDate: new Date().toISOString().split('T')[0],
        surveyNotes: '',
      });
      fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule survey');
    }
  };

  // Technician fills & submits/drafts physical inspection report
  const handleInspectionSubmit = async (isDraft: boolean) => {
    if (!inspectionModalSurvey) return;
    try {
      await api.post(`/surveys/${inspectionModalSurvey.id}/inspection-report`, {
        roofDirection: inspectionData.roofDirection,
        roofTilt: inspectionData.roofTilt,
        roofCondition: inspectionData.roofCondition,
        availableRoofAreaSqFt: parseFloat(inspectionData.availableRoofAreaSqFt),
        cableDistanceMeters: parseFloat(inspectionData.cableDistanceMeters),
        shadingAssessment: inspectionData.shadingAssessment,
        gridSuitability: inspectionData.gridSuitability,
        structuralObservations: inspectionData.structuralObservations,
        surveyNotes: inspectionData.surveyNotes,
        inspectionRecommendation: inspectionData.inspectionRecommendation,
        draft: isDraft,
      });
      setInspectionModalSurvey(null);
      fetchInitialData();
      alert(isDraft ? 'Inspection report draft saved successfully.' : 'Site Inspection Report successfully submitted to Sales for technical review!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit inspection report');
    }
  };

  // Sales Lead reviews submitted inspection report (approve / reject / request revisit)
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalSurvey) return;
    try {
      await api.patch(`/surveys/${reviewModalSurvey.id}/approval`, {
        status: reviewAction,
        approvalNotes: reviewNotes,
      });
      setReviewModalSurvey(null);
      setReviewNotes('');
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
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_DIRECTOR');
  const isSales = user?.roles?.includes('ROLE_SALES') && !isAdmin;
  const isTech = user?.roles?.includes('ROLE_TECHNICIAN') && !isAdmin;

  const openInspectionModal = (surv: SiteSurvey) => {
    setInspectionModalSurvey(surv);
    setInspectionData({
      roofDirection: surv.roofDirection || 'South',
      roofTilt: surv.roofTilt || '15 degrees',
      roofCondition: surv.roofCondition || 'RCC Flat Concrete Slab - Excellent structural integrity',
      availableRoofAreaSqFt: surv.availableRoofAreaSqFt ? surv.availableRoofAreaSqFt.toString() : '450',
      cableDistanceMeters: surv.cableDistanceMeters ? surv.cableDistanceMeters.toString() : '20',
      shadingAssessment: surv.shadingAssessment || '100% Shadow-Free all seasons',
      gridSuitability: surv.gridSuitability || 'Single Phase 230V / 3-Phase 415V Suitable for Net-Metering',
      structuralObservations: surv.structuralObservations || 'RCC slab solid, suitable for HDG modular mounting frame without penetration.',
      surveyNotes: surv.surveyNotes || 'Rooftop surveyed. Verified clear solar access and earthing conduit path.',
      inspectionRecommendation: (surv.inspectionRecommendation as any) || 'APPROVED',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rooftop Site Surveys</h1>
          <p className="text-sm text-slate-500">
            Separated responsibilities: Sales schedules appointments • Technician conducts physical inspection • Sales reviews & generates quotations
          </p>
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {/* Info Callout */}
      <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl flex items-center space-x-3 text-xs text-emerald-900">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <p>
          <strong>Department Boundary Gate:</strong> Technical inspection findings are strictly filled by certified technicians.
          Sales can inspect findings but cannot edit technical values. A quotation can only be generated once the survey status is <strong>APPROVED</strong>.
        </p>
      </div>

      {/* Surveys List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Survey #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Assigned Technician</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Orientation & Area</th>
                <th className="py-3 px-4">Recommendation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {surveys.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No site surveys recorded yet. Schedule one from qualified leads.
                  </td>
                </tr>
              ) : (
                surveys.map((surv) => (
                  <tr key={surv.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{surv.surveyNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{surv.customer.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{surv.customer.phone} • {surv.customer.city}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{surv.technician?.name || 'Unassigned'}</div>
                      <div className="text-[10px] text-slate-400">{surv.technician?.skills?.split(',')[0]}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{surv.scheduledDate}</td>
                    <td className="py-3 px-4">
                      {surv.roofDirection ? (
                        <div>
                          <span className="font-semibold text-slate-700">{surv.roofDirection}</span>
                          <span className="text-slate-400"> ({surv.roofTilt || '15°'})</span>
                          <div className="text-[11px] text-emerald-700 font-medium">{surv.availableRoofAreaSqFt} sq.ft</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Pending Inspection</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {surv.inspectionRecommendation ? (
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          surv.inspectionRecommendation === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          surv.inspectionRecommendation === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {surv.inspectionRecommendation}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Not submitted</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={surv.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* Photo evidence upload button */}
                      <button
                        onClick={() => setPhotoModalSurvey(surv)}
                        title="Add Rooftop Photo"
                        className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        <Camera className="w-4 h-4 inline" />
                      </button>

                      {/* View Report (Available to all) */}
                      {surv.roofDirection && (
                        <button
                          onClick={() => setViewReportSurvey(surv)}
                          title="View Technical Inspection Report"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Report</span>
                        </button>
                      )}

                      {/* Technician: Fill / Update Inspection Report */}
                      {isTech && ['SCHEDULED', 'IN_PROGRESS', 'REVISIT_REQUIRED'].includes(surv.status) && (
                        <button
                          onClick={() => openInspectionModal(surv)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Fill Inspection</span>
                        </button>
                      )}

                      {/* Sales: Review Submitted Report (Approve/Reject/Revisit) */}
                      {isSales && ['REPORT_SUBMITTED', 'IN_PROGRESS'].includes(surv.status) && (
                        <button
                          onClick={() => {
                            setReviewModalSurvey(surv);
                            setReviewAction('APPROVED');
                            setReviewNotes('');
                          }}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-xs font-semibold cursor-pointer"
                        >
                          Review & Gate
                        </button>
                      )}

                      {/* Sales: Generate Quote (Only if survey is APPROVED!) */}
                      {surv.status === 'APPROVED' && isSales && (
                        <button
                          onClick={() =>
                            navigate('/quotations', {
                              state: { customerId: surv.customer.id, siteSurveyId: surv.id, enquiryId: surv.enquiry?.id },
                            })
                          }
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Generate Quote</span>
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

      {/* 1. Modal: Sales Schedule Site Survey (NO TECHNICAL FIELDS) */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Schedule Rooftop Site Survey</h2>
                <p className="text-xs text-slate-500">Sales appointment scheduling • Assign technician</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
                <select
                  required
                  value={scheduleData.customerId}
                  onChange={(e) => setScheduleData({ ...scheduleData, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.phone}) - {c.city || 'Tamil Nadu'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Linked Customer Enquiry (Optional)</label>
                <select
                  value={scheduleData.enquiryId}
                  onChange={(e) => setScheduleData({ ...scheduleData, enquiryId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- No specific enquiry link --</option>
                  {enquiries.map((enq) => (
                    <option key={enq.id} value={enq.id}>
                      {enq.enquiryNumber} - {enq.customer.fullName} ({enq.requestedCapacityKw} kW {enq.systemType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Certified Technician *</label>
                  <select
                    required
                    value={scheduleData.technicianId}
                    onChange={(e) => setScheduleData({ ...scheduleData, technicianId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.skills?.split(',')[0] || 'Solar Tech'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={scheduleData.scheduledDate}
                    onChange={(e) => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Optional Field Instructions / Landmark Notes</label>
                <textarea
                  rows={3}
                  value={scheduleData.surveyNotes}
                  onChange={(e) => setScheduleData({ ...scheduleData, surveyNotes: e.target.value })}
                  placeholder="e.g. 2-storey house near temple, customer will be available after 10 AM, check 3-phase meter feasibility..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  Confirm & Dispatch Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Technician Site Inspection Report Form (TECHNICAL PHYSICAL OBSERVATIONS) */}
      {inspectionModalSurvey && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Physical Site Inspection Report</h2>
                <p className="text-xs text-slate-500">
                  Job {inspectionModalSurvey.surveyNumber} • Customer: {inspectionModalSurvey.customer.fullName} ({inspectionModalSurvey.customer.phone})
                </p>
              </div>
              <button onClick={() => setInspectionModalSurvey(null)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roof Direction *</label>
                  <select
                    value={inspectionData.roofDirection}
                    onChange={(e) => setInspectionData({ ...inspectionData, roofDirection: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="South">South (Optimal Yield)</option>
                    <option value="South-West">South-West</option>
                    <option value="South-East">South-East</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="Flat">Flat Roof</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roof Tilt Angle *</label>
                  <select
                    value={inspectionData.roofTilt}
                    onChange={(e) => setInspectionData({ ...inspectionData, roofTilt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="12 degrees">12° (Minimum self-cleaning)</option>
                    <option value="15 degrees">15° (Standard Tamil Nadu)</option>
                    <option value="18 degrees">18° (High latitude)</option>
                    <option value="25 degrees">25° (Sloped Tiled)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Usable Shadow-Free Roof Area (sq.ft) *</label>
                  <input
                    type="number"
                    required
                    value={inspectionData.availableRoofAreaSqFt}
                    onChange={(e) => setInspectionData({ ...inspectionData, availableRoofAreaSqFt: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 450"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cable Run Distance to Main Panel (meters) *</label>
                  <input
                    type="number"
                    required
                    value={inspectionData.cableDistanceMeters}
                    onChange={(e) => setInspectionData({ ...inspectionData, cableDistanceMeters: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 25"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shading Assessment *</label>
                  <select
                    value={inspectionData.shadingAssessment}
                    onChange={(e) => setInspectionData({ ...inspectionData, shadingAssessment: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="100% Shadow-Free all seasons">100% Shadow-Free all seasons</option>
                    <option value="Partial tree shading after 4 PM">Partial tree shading after 4 PM</option>
                    <option value="Parapet wall shadow in morning">Parapet wall shadow in morning</option>
                    <option value="High shading - requires elevated structure">High shading - requires elevated structure</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Grid Suitability & Electrical Details *</label>
                  <input
                    type="text"
                    required
                    value={inspectionData.gridSuitability}
                    onChange={(e) => setInspectionData({ ...inspectionData, gridSuitability: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. 3-Phase 415V Suitable with dedicated Net-Meter space"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roof Condition & Structural Integrity *</label>
                  <input
                    type="text"
                    required
                    value={inspectionData.roofCondition}
                    onChange={(e) => setInspectionData({ ...inspectionData, roofCondition: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="e.g. Solid RCC slab, water-proofed, safe for anchor fasteners"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Structural Observations & Mounting Assessment</label>
                <textarea
                  rows={2}
                  value={inspectionData.structuralObservations}
                  onChange={(e) => setInspectionData({ ...inspectionData, structuralObservations: e.target.value })}
                  placeholder="Detail slab thickness, parapet height, wind exposure, anchor points, etc."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Technical Remarks & Earthing Assessment</label>
                <textarea
                  rows={2}
                  value={inspectionData.surveyNotes}
                  onChange={(e) => setInspectionData({ ...inspectionData, surveyNotes: e.target.value })}
                  placeholder="Technical findings, conduit path to ground floor, chemical earthing pit location..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-800 mb-1">Technician Inspection Recommendation *</label>
                <select
                  value={inspectionData.inspectionRecommendation}
                  onChange={(e) => setInspectionData({ ...inspectionData, inspectionRecommendation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="APPROVED">APPROVED - Site physically verified & suitable for Solar Installation</option>
                  <option value="REVISIT_REQUIRED">REVISIT_REQUIRED - Tree trimming / civil preparation needed</option>
                  <option value="REJECTED">REJECTED - Structural weakness or permanent severe shading</option>
                </select>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleInspectionSubmit(true)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Save Draft
                </button>

                <div className="space-x-3">
                  <button
                    type="button"
                    onClick={() => setInspectionModalSurvey(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInspectionSubmit(false)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
                  >
                    Submit Completed Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Read-Only Inspection Report Viewer for Sales / Admin */}
      {viewReportSurvey && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Site Inspection Findings ({viewReportSurvey.surveyNumber})</h2>
                <p className="text-xs text-slate-500">
                  Technician: {viewReportSurvey.technician?.name} • Customer: {viewReportSurvey.customer.fullName}
                </p>
              </div>
              <button onClick={() => setViewReportSurvey(null)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-slate-400">Roof Direction & Tilt:</span>
                  <p className="font-semibold text-slate-800">{viewReportSurvey.roofDirection} @ {viewReportSurvey.roofTilt}</p>
                </div>
                <div>
                  <span className="text-slate-400">Usable Shadow-Free Area:</span>
                  <p className="font-semibold text-emerald-700">{viewReportSurvey.availableRoofAreaSqFt} sq.ft</p>
                </div>
                <div>
                  <span className="text-slate-400">Cable Run to Meter:</span>
                  <p className="font-semibold text-slate-800">{viewReportSurvey.cableDistanceMeters} meters</p>
                </div>
                <div>
                  <span className="text-slate-400">Shading Assessment:</span>
                  <p className="font-semibold text-slate-800">{viewReportSurvey.shadingAssessment}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Grid Suitability:</span>
                  <p className="font-semibold text-slate-800">{viewReportSurvey.gridSuitability}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Roof Condition:</span>
                  <p className="font-semibold text-slate-800">{viewReportSurvey.roofCondition || 'Standard RCC'}</p>
                </div>
              </div>

              {viewReportSurvey.structuralObservations && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-1">Structural Observations:</h4>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700">
                    {viewReportSurvey.structuralObservations}
                  </div>
                </div>
              )}

              {viewReportSurvey.surveyNotes && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-1">Technical Remarks:</h4>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700">
                    {viewReportSurvey.surveyNotes}
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Technician Recommendation:</span>
                  <div className="font-bold text-slate-900 mt-0.5">{viewReportSurvey.inspectionRecommendation || 'PENDING'}</div>
                </div>
                <StatusBadge status={viewReportSurvey.status} />
              </div>

              {/* Photos attached */}
              {viewReportSurvey.photos && viewReportSurvey.photos.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">Inspection Photos:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {viewReportSurvey.photos.map((p) => (
                      <div key={p.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <img src={p.photoUrl} alt={p.caption} className="w-full h-28 object-cover" />
                        <div className="p-1.5 text-[10px] text-slate-600 bg-white truncate">{p.caption || 'Roof photo'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setViewReportSurvey(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Sales Review & Gating Modal */}
      {reviewModalSurvey && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Technical Review & Approval Gate</h2>
            <p className="text-xs text-slate-500 mb-4">
              Review technician's physical findings for Survey #{reviewModalSurvey.surveyNumber}
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500">Technician Recommendation:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {reviewModalSurvey.inspectionRecommendation || 'Pending'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Area: {reviewModalSurvey.availableRoofAreaSqFt} sq.ft • {reviewModalSurvey.shadingAssessment}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approval Decision *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVED')}
                    className={`py-2 text-center rounded-xl font-semibold border cursor-pointer ${
                      reviewAction === 'APPROVED' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('REVISIT_REQUIRED')}
                    className={`py-2 text-center rounded-xl font-semibold border cursor-pointer ${
                      reviewAction === 'REVISIT_REQUIRED' ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Revisit
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECTED')}
                    className={`py-2 text-center rounded-xl font-semibold border cursor-pointer ${
                      reviewAction === 'REJECTED' ? 'bg-rose-600 text-white border-rose-600 shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sales Technical Review Notes *</label>
                <textarea
                  required
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="e.g. Roof measurements and structural capacity approved for standard 3 kW system. Ready for quotation."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalSurvey(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs"
                >
                  Save Review Gate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Add Photo via Camera & File Upload */}
      {photoModalSurvey && (
        <CameraPhotoUpload
          title={`Attach Roof Photo Evidence — Survey #${photoModalSurvey.surveyNumber}`}
          subtitle="Snap photo with device camera or upload image from file picker"
          captionPlaceholder="e.g. South-facing parapet wall & shadow-free roof terrace"
          onPhotoUploaded={async (uploadedUrl, captionText) => {
            await api.post(`/surveys/${photoModalSurvey.id}/photos`, {
              photoUrl: uploadedUrl,
              caption: captionText,
            });
            fetchInitialData();
          }}
          onClose={() => setPhotoModalSurvey(null)}
        />
      )}
    </div>
  );
};
