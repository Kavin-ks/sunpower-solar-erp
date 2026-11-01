import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Quotation, SiteSurvey, SolarPackage, Customer, QuotationStatus } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Printer,
  Zap,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [approvedSurveys, setApprovedSurveys] = useState<SiteSurvey[]>([]);
  const [packages, setPackages] = useState<SolarPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);

  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [installationFee, setInstallationFee] = useState('15000');
  const [notes, setNotes] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).siteSurveyId) {
      setSelectedSurveyId((location.state as any).siteSurveyId.toString());
      setShowCreateModal(true);
    }
  }, [location.state]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [quotesRes, survRes, pkgRes] = await Promise.all([
        api.get('/quotations'),
        api.get('/surveys?status=APPROVED'),
        api.get('/packages'),
      ]);
      setQuotations(quotesRes.data);
      setApprovedSurveys(survRes.data);
      setPackages(pkgRes.data);
      if (pkgRes.data.length > 0 && !selectedPackageId) {
        setSelectedPackageId(pkgRes.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    const survey = approvedSurveys.find((s) => s.id === parseInt(selectedSurveyId));
    if (!survey) {
      alert('Please select an approved site survey.');
      return;
    }

    try {
      await api.post('/quotations', {
        customerId: survey.customer.id,
        siteSurveyId: survey.id,
        solarPackageId: parseInt(selectedPackageId),
        installationFee: parseFloat(installationFee),
        taxRatePercent: 5.0,
        notes,
      });
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create quotation');
    }
  };

  const handleStatusUpdate = async (id: number, status: QuotationStatus) => {
    try {
      await api.patch(`/quotations/${id}/status`, { status });
      fetchData();
      if (previewQuotation && previewQuotation.id === id) {
        setPreviewQuotation((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update quotation');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number | undefined) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_DIRECTOR');
  const isSales = user?.roles?.includes('ROLE_SALES') && !isAdmin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quotations & BOM Estimations</h1>
          <p className="text-sm text-slate-500">
            Automated Bill of Materials (BOM), pricing, and survey-gated customer proposals
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSales && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate New Quotation</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Quote #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">GST (5%)</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No quotations generated yet. Complete and approve a site survey first.
                  </td>
                </tr>
              ) : (
                quotations.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{quote.quotationNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{quote.customer.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{quote.customer.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{quote.capacityKw} kW</span>
                      <span className="ml-1 text-[11px] text-slate-500">
                        ({quote.systemType === 'ON_GRID' ? 'On-Grid' : 'Off-Grid'})
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{quote.quotationDate}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(quote.subtotal)}</td>
                    <td className="py-3 px-4 text-right text-slate-500">{formatCurrency(quote.taxAmount)}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatCurrency(quote.totalAmount)}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={quote.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setPreviewQuotation(quote)}
                        className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded font-medium cursor-pointer"
                      >
                        Preview / Print
                      </button>

                      {!isAdmin && isSales && (
                        <>
                          {quote.status === 'DRAFT' && (
                            <button
                              onClick={() => handleStatusUpdate(quote.id, 'SENT')}
                              className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded font-semibold cursor-pointer"
                            >
                              Send to Client
                            </button>
                          )}

                          {quote.status === 'SENT' && (
                            <button
                              onClick={() => handleStatusUpdate(quote.id, 'ACCEPTED')}
                              className="px-2.5 py-1 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Accept & Confirm</span>
                            </button>
                          )}

                          {quote.status === 'ACCEPTED' && (
                            <button
                              onClick={() => navigate('/orders', { state: { quotationId: quote.id } })}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Convert to Order</span>
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

      {/* Modal: Generate Quotation */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Generate BOM-Calculated Quotation</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Approved Site Survey *
                </label>
                <select
                  required
                  value={selectedSurveyId}
                  onChange={(e) => setSelectedSurveyId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Approved Survey --</option>
                  {approvedSurveys.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.surveyNumber} - {s.customer.fullName} ({s.availableRoofAreaSqFt} sq.ft {s.roofDirection})
                    </option>
                  ))}
                </select>
                {approvedSurveys.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>No approved surveys found. Go to Site Surveys and approve one first.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Solar Package Template *</label>
                <select
                  required
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} ({pkg.capacityKw} kW {pkg.systemType}) - Base: {formatCurrency(pkg.basePrice)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Installation & Commissioning Fee (₹)</label>
                  <input
                    type="number"
                    value={installationFee}
                    onChange={(e) => setInstallationFee(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tax Scheme</label>
                  <input
                    type="text"
                    disabled
                    value="5% GST (Solar Hardware Concessional Rate)"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proposal Terms / Custom Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="Includes 20-year panel warranty, 2-year inverter warranty, and net-metering liaison..."
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
                  disabled={approvedSurveys.length === 0}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs disabled:opacity-50"
                >
                  Generate BOM Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Quotation Preview Modal */}
      {previewQuotation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 no-print">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
              <button onClick={() => setPreviewQuotation(null)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            {/* Formal Quotation Paper Document */}
            <div className="space-y-6 text-xs text-slate-700">
              <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">SUNPOWER SOLUTIONS</h2>
                  <p className="text-slate-500">Rooftop Solar EPC & Installation Specialists</p>
                  <p className="text-slate-500">GSTIN: 33AAACS1234F1Z5 | contact@sunpower.com</p>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-emerald-800">{previewQuotation.quotationNumber}</div>
                  <p className="text-slate-500">Date: {previewQuotation.quotationDate}</p>
                  <p className="text-slate-500">Valid Until: {previewQuotation.validityDate}</p>
                  <div className="mt-1">
                    <StatusBadge status={previewQuotation.status} />
                  </div>
                </div>
              </div>

              {/* Customer & Site Details */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                <div>
                  <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Client Details</h3>
                  <p className="font-semibold text-slate-800">{previewQuotation.customer.fullName}</p>
                  <p>{previewQuotation.customer.phone}</p>
                  <p>{previewQuotation.customer.email}</p>
                  <p>{previewQuotation.customer.address}</p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-1">Approved Site Survey</h3>
                  <p>Ref: {previewQuotation.siteSurvey.surveyNumber}</p>
                  <p>System Capacity: <strong>{previewQuotation.capacityKw} kW</strong></p>
                  <p>Grid Type: <strong>{previewQuotation.systemType === 'ON_GRID' ? 'On-Grid Net Meter' : 'Off-Grid Battery'}</strong></p>
                  <p>Orientation: {previewQuotation.siteSurvey.roofDirection} ({previewQuotation.siteSurvey.availableRoofAreaSqFt} sq.ft)</p>
                </div>
              </div>

              {/* BOM Line Items */}
              <div>
                <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wider mb-2">
                  Bill of Materials (BOM) & Equipment Specifications
                </h3>
                <table className="w-full text-left border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Item / Description</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {previewQuotation.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {item.product.name}
                          <span className="block text-[10px] text-slate-400 font-normal">{item.product.productCode}</span>
                        </td>
                        <td className="py-2 px-3 text-center">{item.quantity} {item.product.unit}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 px-3 text-right font-semibold">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="py-2 px-3 font-medium text-slate-700">
                        Professional Fitting, Cabling, Earthing & Commissioning
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">{formatCurrency(previewQuotation.installationFee)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-right">Subtotal:</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(previewQuotation.subtotal.valueOf() + previewQuotation.installationFee)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-right">GST (5% Concessional):</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(previewQuotation.taxAmount)}</td>
                    </tr>
                    <tr className="text-sm text-emerald-800 bg-emerald-50">
                      <td colSpan={3} className="py-2.5 px-3 text-right">Total Net Payable:</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(previewQuotation.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Warranty and Terms */}
              <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 space-y-1">
                <p><strong>Standard Warranties:</strong> Solar Panels: 20 Years | Inverter: 2 Years | Battery Bank: 2 Years.</p>
                <p><strong>Advance Payment Requirement:</strong> 20% on quotation acceptance prior to inventory allocation and dispatch.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
