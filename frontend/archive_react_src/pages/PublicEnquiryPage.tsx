import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, CheckCircle2, ArrowLeft, Send, Sparkles, Building2, Home, Factory, Phone, Mail, MapPin } from 'lucide-react';
import axios from 'axios';

export const PublicEnquiryPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: 'Coimbatore',
    pincode: '641001',
    customerType: 'RESIDENTIAL',
    systemType: 'ON_GRID',
    requestedCapacityKw: 3,
    subsidyRequired: true,
    monthlyElectricityBill: 3500,
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [successResponse, setSuccessResponse] = useState<any>(null);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessResponse(null);

    try {
      const payload = {
        ...formData,
        requestedCapacityKw: Number(formData.requestedCapacityKw),
        monthlyElectricityBill: Number(formData.monthlyElectricityBill),
      };
      const res = await axios.post('/api/enquiries/public', payload);
      setSuccessResponse(res.data);
    } catch (err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Failed to submit enquiry. Please verify details.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-600 text-white flex items-center justify-center shadow-md">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">SunPower Solutions</h1>
              <p className="text-xs text-slate-500">Clean Energy • PM Surya Ghar Rooftop Solar</p>
            </div>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg border border-emerald-200 transition"
          >
            <span>Employee Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Government Subsidy Available under PM Surya Ghar</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Request Rooftop Solar Survey & Quote</h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto mt-1">
            Submit your rooftop details below. Our certified solar engineering team will inspect your site and provide an itemized Bill of Materials quotation.
          </p>
        </div>

        {successResponse ? (
          <div className="bg-white rounded-2xl p-8 border border-emerald-200 shadow-xl text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Enquiry Registered Successfully!</h3>
            <div className="bg-emerald-50 rounded-xl p-4 my-4 border border-emerald-200 inline-block text-left w-full">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">Enquiry Reference:</span>
                  <span className="font-bold text-emerald-800 text-base">{successResponse.enquiryNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Customer Name:</span>
                  <span className="font-semibold text-slate-800">{successResponse.customer?.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Requested System:</span>
                  <span className="font-semibold text-slate-800">{successResponse.requestedCapacityKw} kW ({successResponse.systemType})</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Subsidy Eligible:</span>
                  <span className="font-semibold text-emerald-700">{successResponse.subsidyRequired ? 'Yes (PM Surya Ghar)' : 'Standard'}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Our Sales Lead will contact you at <span className="font-semibold text-slate-900">{successResponse.customer?.phone}</span> within 24 hours to schedule the physical rooftop survey.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSuccessResponse(null);
                  setFormData({
                    fullName: '',
                    phone: '',
                    email: '',
                    address: '',
                    city: 'Coimbatore',
                    pincode: '641001',
                    customerType: 'RESIDENTIAL',
                    systemType: 'ON_GRID',
                    requestedCapacityKw: 3,
                    subsidyRequired: true,
                    monthlyElectricityBill: 3500,
                    notes: '',
                  });
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
              >
                Submit Another Enquiry
              </button>
              <Link
                to="/login"
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {error && (
              <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-700 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              {/* Customer Contact Details */}
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-emerald-600" />
                  <span>1. Contact & Location Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Arun Balaji"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="10-digit mobile number"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer Category
                    </label>
                    <select
                      name="customerType"
                      value={formData.customerType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="RESIDENTIAL">Residential (Individual Home / Villa)</option>
                      <option value="COMMERCIAL">Commercial (Offices / Retail)</option>
                      <option value="SMALL_FACTORY">Small Factory / Industrial Shed</option>
                      <option value="AGRICULTURAL">Agricultural / Farm House</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Installation Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        placeholder="House / Building No., Street, Area"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City / Town</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Solar Requirements */}
              <div>
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span>2. Solar System Requirements</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      System Type
                    </label>
                    <select
                      name="systemType"
                      value={formData.systemType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="ON_GRID">On-Grid (Grid-Tied with Net-Metering)</option>
                      <option value="OFF_GRID">Off-Grid (With Lithium Battery Storage)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Desired Capacity (kW)
                    </label>
                    <select
                      name="requestedCapacityKw"
                      value={formData.requestedCapacityKw}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="1">1 kW (Saves ~120 units/mo)</option>
                      <option value="2">2 kW (Saves ~240 units/mo)</option>
                      <option value="3">3 kW (Saves ~360 units/mo - Most Popular)</option>
                      <option value="4">4 kW (Saves ~480 units/mo)</option>
                      <option value="5">5 kW (Saves ~600 units/mo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Approx Monthly Electricity Bill (₹)
                    </label>
                    <input
                      type="number"
                      name="monthlyElectricityBill"
                      value={formData.monthlyElectricityBill}
                      onChange={handleChange}
                      min="500"
                      step="100"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="flex items-center space-x-2.5 bg-emerald-50 p-3 rounded-xl border border-emerald-200 cursor-pointer">
                      <input
                        type="checkbox"
                        name="subsidyRequired"
                        checked={formData.subsidyRequired}
                        onChange={handleChange}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300"
                      />
                      <span className="text-xs font-semibold text-emerald-900">
                        Apply for PM Surya Ghar Muft Bijli Yojana Central Government Subsidy (up to ₹78,000 for residential 3kW)
                      </span>
                    </label>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rooftop or Site Observations / Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      placeholder="e.g. Flat RCC concrete roof, shadow free, 3rd floor..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Submitting Enquiry...' : 'Submit Solar Enquiry'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
