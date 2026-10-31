import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  AdminDashboardData,
  SalesDashboardData,
  WarehouseDashboardData,
  TechnicianDashboardData,
  SupportDashboardData,
  FinanceDashboardData,
} from '../types';
import {
  Users,
  Compass,
  FileCheck,
  ShoppingCart,
  Wrench,
  CircleDollarSign,
  Boxes,
  Headphones,
  Download,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Layers,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  ShieldAlert,
  Search,
  ExternalLink,
  ChevronRight,
  Calendar,
  Phone,
  MapPin,
  Barcode,
  Package,
  Activity,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const roles = user?.roles || [];
  const isAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ROLE_DIRECTOR');
  const isSales = roles.includes('ROLE_SALES');
  const isWarehouse = roles.includes('ROLE_WAREHOUSE');
  const isTechnician = roles.includes('ROLE_TECHNICIAN');
  const isSupport = roles.includes('ROLE_SUPPORT');
  const isFinance = roles.includes('ROLE_FINANCE');

  // State for all dashboards
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [salesData, setSalesData] = useState<SalesDashboardData | null>(null);
  const [warehouseData, setWarehouseData] = useState<WarehouseDashboardData | null>(null);
  const [technicianData, setTechnicianData] = useState<TechnicianDashboardData | null>(null);
  const [supportData, setSupportData] = useState<SupportDashboardData | null>(null);
  const [financeData, setFinanceData] = useState<FinanceDashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  // Quick serial lookup state for Support dashboard
  const [quickSerial, setQuickSerial] = useState('');
  const [serialLookupResult, setSerialLookupResult] = useState<any>(null);
  const [searchingSerial, setSearchingSerial] = useState(false);

  useEffect(() => {
    fetchDepartmentDashboard();
  }, [user?.username, period]);

  const fetchDepartmentDashboard = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const res = await api.get('/dashboard/admin');
        setAdminData(res.data);
      } else if (isSales) {
        const res = await api.get('/dashboard/sales');
        setSalesData(res.data);
      } else if (isWarehouse) {
        const res = await api.get('/dashboard/warehouse');
        setWarehouseData(res.data);
      } else if (isTechnician) {
        const res = await api.get('/dashboard/technician');
        setTechnicianData(res.data);
      } else if (isSupport) {
        const res = await api.get('/dashboard/support');
        setSupportData(res.data);
      } else if (isFinance) {
        const res = await api.get('/dashboard/finance');
        setFinanceData(res.data);
      } else {
        const res = await api.get('/dashboard/admin');
        setAdminData(res.data);
      }
    } catch (err) {
      console.error('Failed to load department dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSerialSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSerial.trim()) return;
    setSearchingSerial(true);
    setSerialLookupResult(null);
    try {
      const res = await api.get(`/warranties/serial/${quickSerial.trim()}`);
      setSerialLookupResult({ found: true, data: res.data });
    } catch (err) {
      // Try serial-numbers lookup
      try {
        const sRes = await api.get(`/serial-numbers/lookup/${quickSerial.trim()}`);
        setSerialLookupResult({ found: true, serialOnly: true, data: sRes.data });
      } catch (err2) {
        setSerialLookupResult({ found: false });
      }
    } finally {
      setSearchingSerial(false);
    }
  };

  const formatCurrency = (val: number | undefined) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-600"></div>
        <p className="text-xs text-slate-500 font-medium">Loading departmental workspace...</p>
      </div>
    );
  }

  // ----------------------------------------------------------------------------------------
  // 1. ADMIN / EXECUTIVE DIRECTOR DASHBOARD
  // ----------------------------------------------------------------------------------------
  if (isAdmin && adminData) {
    return (
      <div className="space-y-6">
        {/* Executive Oversight Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold mb-2 border border-indigo-500/30">
                <Eye className="w-3.5 h-3.5" />
                <span>Executive Overview</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Central Operations & Financial Governance</h1>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Centralized real-time visibility across all 6 departments. Monitor organizational health, audit trails, and project financials.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                to="/finance"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <CircleDollarSign className="w-4 h-4" />
                <span>Financial Ledger</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Invoiced</span>
            <span className="text-lg font-extrabold text-slate-900 mt-1 block">{formatCurrency(adminData.totalInvoiced)}</span>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center mt-1">
              <span>GST Invoices</span>
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cash Collected</span>
            <span className="text-lg font-extrabold text-emerald-700 mt-1 block">{formatCurrency(adminData.totalPaymentsReceived)}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Verified Receipts</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Receivables</span>
            <span className="text-lg font-extrabold text-amber-600 mt-1 block">{formatCurrency(adminData.totalOutstanding)}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Unpaid Balances</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Operating Profit</span>
            <span className="text-lg font-extrabold text-indigo-700 mt-1 block">{formatCurrency(adminData.netProfit)}</span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1">Recognized Profit</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Conversion</span>
            <span className="text-lg font-extrabold text-blue-700 mt-1 block">{adminData.leadConversionRate?.toFixed(1)}%</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">{adminData.confirmedOrders} of {adminData.totalEnquiries} Leads</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Warranties</span>
            <span className="text-lg font-extrabold text-teal-700 mt-1 block">{adminData.activeWarranties || 0}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Units Covered</span>
          </div>
        </div>

        {/* Operational Status Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-3 shadow-2xs">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Site Surveys</span>
              <span className="text-base font-bold text-slate-900">{adminData.approvedSurveys} Approved / {adminData.pendingSurveys} Pending</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-3 shadow-2xs">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Quotations</span>
              <span className="text-base font-bold text-slate-900">{adminData.acceptedQuotations} Accepted / {adminData.pendingQuotations} Pending</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-3 shadow-2xs">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Installations</span>
              <span className="text-base font-bold text-slate-900">{adminData.completedInstallations} Commissioned / {adminData.activeInstallations} Active</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center space-x-3 shadow-2xs">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Service Tickets</span>
              <span className="text-base font-bold text-slate-900">{adminData.openServiceTickets} Open Complaints</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Monthly Revenue vs Project Cost Trends</h3>
                <p className="text-xs text-slate-400">Cash receipts vs hardware, labour & operating expense</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                P&L Reconciled
              </span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adminData.revenueTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="revenue" name="Collected Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name="Project Cost" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Net Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Installed Solar Packages</h3>
            <p className="text-xs text-slate-400 mb-4">Demand distribution by capacity & grid configuration</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={adminData.capacityDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="capacity"
                  >
                    {(adminData.capacityDistribution || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Technician Workload & Productivity Grid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Technician Workload & Field Productivity</h3>
              <p className="text-xs text-slate-400">Monitoring 15 specialized field crew members across rooftop projects</p>
            </div>
            <Link
              to="/surveys"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
            >
              <span>Inspect Field Surveys</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Technician Name</th>
                  <th className="px-4 py-2.5">Phone Contact</th>
                  <th className="px-4 py-2.5">Field Specialization</th>
                  <th className="px-4 py-2.5 text-center">Active Jobs</th>
                  <th className="px-4 py-2.5 text-center">Completed Jobs</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(adminData.technicianWorkloads || []).slice(0, 8).map((tech, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{tech.name}</td>
                    <td className="px-4 py-3 text-slate-600">{tech.phone}</td>
                    <td className="px-4 py-3 text-slate-500">{tech.specialization}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${tech.activeJobs > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'}`}>
                        {tech.activeJobs}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        {tech.completedJobs}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center space-x-1 text-emerald-600 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>Active</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------------------
  // 2. SALES DEPARTMENT WORKSPACE
  // ----------------------------------------------------------------------------------------
  if (isSales && salesData) {
    return (
      <div className="space-y-6">
        {/* Sales Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md text-xs font-semibold border border-blue-200 mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>Sales & Commercial Workspace</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Enquiries, Surveys & Quotations</h1>
            <p className="text-xs text-slate-500">Qualify incoming enquiries, schedule physical site surveys, and generate dynamic package quotations</p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to="/surveys"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Schedule Site Survey</span>
            </Link>
            <Link
              to="/quotations"
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Quotation</span>
            </Link>
          </div>
        </div>

        {/* Sales KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Customer Leads</span>
            <span className="text-xl font-extrabold text-slate-900 mt-1 block">{salesData.totalEnquiries}</span>
            <span className="text-[11px] text-blue-600 font-medium mt-1">{salesData.newEnquiries} New / {salesData.qualifiedEnquiries} Qualified</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lead Conversion</span>
            <span className="text-xl font-extrabold text-emerald-700 mt-1 block">{salesData.leadConversionRate?.toFixed(1)}%</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">{salesData.acceptedQuotations} Accepted Quotations</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Surveys Awaiting Review</span>
            <span className="text-xl font-extrabold text-amber-600 mt-1 block">{salesData.surveysAwaitingReview}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">{salesData.approvedSurveys} Surveys Approved</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Pipeline Value</span>
            <span className="text-xl font-extrabold text-indigo-700 mt-1 block">{formatCurrency(salesData.pipelineValue)}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">{salesData.pendingQuotations} Pending Quotes</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Awaiting Advance Pay</span>
            <span className="text-xl font-extrabold text-rose-600 mt-1 block">{salesData.ordersAwaitingAdvance}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">{salesData.confirmedOrders} Confirmed Orders</span>
          </div>
        </div>

        {/* Action Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Surveys Requiring Sales Approval */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Surveys Awaiting Sales Lead Review</h3>
                <p className="text-xs text-slate-400">Technicians have submitted rooftop measurements and recommendations</p>
              </div>
              <Link to="/surveys" className="text-xs text-emerald-600 font-semibold hover:underline">View All</Link>
            </div>
            {salesData.surveysNeedingReview && salesData.surveysNeedingReview.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {salesData.surveysNeedingReview.map((srv) => (
                  <div key={srv.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 text-xs">{srv.customer?.fullName}</span>
                      <span className="text-[11px] text-slate-500 block">
                        Technician: {srv.technician?.name} • Rec: <strong className="text-emerald-700">{srv.inspectionRecommendation || 'APPROVED'}</strong>
                      </span>
                    </div>
                    <Link
                      to="/surveys"
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded text-xs border border-emerald-200"
                    >
                      Review & Approve
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No site surveys currently awaiting review.
              </div>
            )}
          </div>

          {/* Recent Inbound Leads */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Recent Customer Enquiries</h3>
                <p className="text-xs text-slate-400">Captured through public portal ready for phone qualification</p>
              </div>
              <Link to="/enquiries" className="text-xs text-blue-600 font-semibold hover:underline">View All Leads</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {(salesData.recentEnquiries || []).map((enq) => (
                <div key={enq.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{enq.customer?.fullName}</span>
                    <span className="text-[11px] text-slate-500 block">
                      {enq.requestedCapacityKw} kW {enq.systemType} • {enq.customer?.phone}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    enq.status === 'NEW' ? 'bg-blue-50 text-blue-700' :
                    enq.status === 'QUALIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {enq.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------------------
  // 3. WAREHOUSE & INVENTORY WORKSPACE
  // ----------------------------------------------------------------------------------------
  if (isWarehouse && warehouseData) {
    return (
      <div className="space-y-6">
        {/* Warehouse Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md text-xs font-semibold border border-amber-200 mb-1">
              <Boxes className="w-3.5 h-3.5" />
              <span>Warehouse & Physical Inventory Control</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Stock Levels, Barcode Picking & Dispatch</h1>
            <p className="text-xs text-slate-500">Manage real-time inventory balances, allocate serial numbers, and scan outbound dispatches</p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to="/dispatch"
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1"
            >
              <Barcode className="w-4 h-4" />
              <span>Barcode Dispatch Scanner</span>
            </Link>
          </div>
        </div>

        {/* Warehouse KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stock Valuation</span>
            <span className="text-xl font-extrabold text-slate-900 mt-1 block">{formatCurrency(warehouseData.totalStockValue)}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Purchase Cost Value</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Physical Units</span>
            <span className="text-xl font-extrabold text-blue-700 mt-1 block">{warehouseData.totalStockUnits}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">In Warehouse Bays</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hard Reserved</span>
            <span className="text-xl font-extrabold text-amber-600 mt-1 block">{warehouseData.reservedStockUnits}</span>
            <span className="text-[11px] text-amber-700 font-medium mt-1">Allocated to Orders</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Free Stock</span>
            <span className="text-xl font-extrabold text-emerald-700 mt-1 block">{warehouseData.availableStockUnits}</span>
            <span className="text-[11px] text-emerald-600 font-medium mt-1">Ready for New Orders</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Low Stock Alerts</span>
            <span className="text-xl font-extrabold text-rose-600 mt-1 block">{warehouseData.lowStockCount}</span>
            <span className="text-[11px] text-rose-600 font-medium mt-1">At/Below Min Level</span>
          </div>
        </div>

        {/* Orders Ready for Picking & Low Stock Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Confirmed Orders Awaiting Picking</h3>
                <p className="text-xs text-slate-400">BOM components reserved, ready for serialized scan</p>
              </div>
              <Link to="/dispatch" className="text-xs text-amber-600 font-semibold hover:underline">Open Dispatch</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {(warehouseData.pendingPickingOrders || []).map((ord) => (
                <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{ord.orderNumber}</span>
                    <span className="text-[11px] text-slate-500 block">
                      Customer: {ord.customer?.fullName} • {ord.capacityKw} kW {ord.systemType}
                    </span>
                  </div>
                  <Link
                    to="/dispatch"
                    className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold rounded text-xs border border-amber-200"
                  >
                    Pick & Dispatch
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Low Stock Threshold Warnings</h3>
                <p className="text-xs text-slate-400">Items reaching or falling below safety buffer stock</p>
              </div>
              <Link to="/inventory" className="text-xs text-slate-600 font-semibold hover:underline">Full Inventory</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {(warehouseData.lowStockAlerts || []).map((stk) => (
                <div key={stk.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{stk.product?.name}</span>
                    <span className="text-[11px] text-slate-500 block">
                      Code: {stk.product?.productCode} • Unit Cost: {formatCurrency(stk.product?.purchasePrice)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-600 text-xs">{stk.availableQuantity} Avail</span>
                    <span className="text-[10px] text-slate-400 block">Min: {stk.product?.minimumStockLevel}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------------------
  // 4. TECHNICIAN DEPARTMENT WORKSPACE
  // ----------------------------------------------------------------------------------------
  if (isTechnician && technicianData) {
    return (
      <div className="space-y-6">
        {/* Technician Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md text-xs font-semibold border border-emerald-200 mb-1">
              <Wrench className="w-3.5 h-3.5" />
              <span>Field Technician & Commissioning Workspace</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lead Rooftop Inspections & Installations</h1>
            <p className="text-xs text-slate-500">
              Assigned to: <strong>{technicianData.technicianName}</strong> ({technicianData.specialization}) • {technicianData.phone}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to="/installations"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1"
            >
              <Barcode className="w-4 h-4" />
              <span>Verify & Install Products</span>
            </Link>
          </div>
        </div>

        {/* Technician Field KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Site Surveys</span>
            <span className="text-2xl font-extrabold text-blue-700 mt-1 block">{technicianData.assignedSurveysCount}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">{technicianData.pendingSurveysCount} Scheduled</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Installations</span>
            <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">{technicianData.assignedInstallationsCount}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">{technicianData.inProgressInstallationsCount} In Progress</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Commissioning</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{technicianData.completedInstallationsCount}</span>
            <span className="text-[11px] text-emerald-600 font-medium mt-1">Digitally Signed Off</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service Visits</span>
            <span className="text-2xl font-extrabold text-rose-600 mt-1 block">{technicianData.assignedServiceVisitsCount}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Field Repair Jobs</span>
          </div>
        </div>

        {/* Active Installations & Surveys Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Assigned Installations Ready for Work</h3>
                <p className="text-xs text-slate-400">On-site verification, commissioning & customer digital sign-off</p>
              </div>
              <Link to="/installations" className="text-xs text-emerald-600 font-semibold hover:underline">All Installations</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {(technicianData.activeInstallations || []).map((inst) => (
                <div key={inst.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{inst.installationNumber}</span>
                    <span className="text-[11px] text-slate-500 block">
                      Customer: {inst.customer?.fullName} • {inst.customer?.phone}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{inst.customer?.address || inst.customer?.city || 'Site Address'}</span>
                  </div>
                  <Link
                    to="/installations"
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs shadow-xs"
                  >
                    Open Job
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Assigned Site Surveys</h3>
                <p className="text-xs text-slate-400">Physical rooftop shadow & electrical feasibility visits</p>
              </div>
              <Link to="/surveys" className="text-xs text-blue-600 font-semibold hover:underline">All Surveys</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {(technicianData.upcomingSurveys || []).map((srv) => (
                <div key={srv.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{srv.surveyNumber}</span>
                    <span className="text-[11px] text-slate-500 block">
                      Customer: {srv.customer?.fullName} • {srv.customer?.phone}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Scheduled: {srv.scheduledDate}</span>
                  </div>
                  <Link
                    to="/surveys"
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded text-xs border border-blue-200"
                  >
                    Fill Inspection
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------------------
  // 5. SUPPORT & WARRANTY WORKSPACE
  // ----------------------------------------------------------------------------------------
  if (isSupport && supportData) {
    return (
      <div className="space-y-6">
        {/* Support Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md text-xs font-semibold border border-rose-200 mb-1">
              <Headphones className="w-3.5 h-3.5" />
              <span>Customer Care & Warranty Verification</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Complaint Tickets & Warranty Claims</h1>
            <p className="text-xs text-slate-500">Log customer complaints, scan serial numbers for instant warranty lookup, and coordinate field visits</p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to="/service"
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Register Complaint Ticket</span>
            </Link>
          </div>
        </div>

        {/* Support KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Open Tickets</span>
            <span className="text-xl font-extrabold text-slate-900 mt-1 block">{supportData.openTickets + supportData.assignedTickets}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Pending Resolution</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Critical Complaints</span>
            <span className="text-xl font-extrabold text-rose-600 mt-1 block">{supportData.criticalTicketsCount}</span>
            <span className="text-[11px] text-rose-600 font-medium mt-1">High Severity</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Warranties</span>
            <span className="text-xl font-extrabold text-teal-700 mt-1 block">{supportData.activeWarrantiesCount}</span>
            <span className="text-[11px] text-teal-600 font-medium mt-1">Registered Serial Units</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolved This Month</span>
            <span className="text-xl font-extrabold text-emerald-700 mt-1 block">{supportData.resolvedTickets + supportData.closedTickets}</span>
            <span className="text-[11px] text-emerald-600 font-medium mt-1">Confirmed Closed</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Turnaround Time</span>
            <span className="text-xl font-extrabold text-indigo-700 mt-1 block">{supportData.avgResolutionDays} Days</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Within Service SLA</span>
          </div>
        </div>

        {/* Instant Serial & Warranty Quick Lookup Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-1">Instant Serial Number & Warranty Scanner</h3>
          <p className="text-xs text-slate-400 mb-3">Scan physical QR/barcode on customer rooftop or enter serial code to verify warranty coverage</p>
          <form onSubmit={handleQuickSerialSearch} className="flex gap-2 max-w-lg mb-3">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={quickSerial}
                onChange={(e) => setQuickSerial(e.target.value)}
                placeholder="e.g. INV-GROWATT-3K-108-1"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={searchingSerial}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
            >
              {searchingSerial ? 'Scanning...' : 'Verify Warranty'}
            </button>
          </form>

          {serialLookupResult && (
            <div className={`p-4 rounded-xl text-xs border ${serialLookupResult.found ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              {serialLookupResult.found ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Serial Code</span>
                    <span className="font-bold text-slate-900">{serialLookupResult.data?.serialNumber?.serialCode || quickSerial}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Product</span>
                    <span className="font-bold text-slate-900">{serialLookupResult.data?.product?.name || 'Solar Equipment'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Warranty Status</span>
                    <span className="font-bold text-emerald-700">{serialLookupResult.data?.status || 'ACTIVE'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Warranty Valid Until</span>
                    <span className="font-bold text-slate-900">{serialLookupResult.data?.warrantyEndDate || 'Valid'}</span>
                  </div>
                </div>
              ) : (
                <p className="text-rose-700 font-medium">Serial number not found in database. Please verify barcode code.</p>
              )}
            </div>
          )}
        </div>

        {/* Urgent Service Tickets Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Customer Complaints Awaiting Support Action</h3>
              <p className="text-xs text-slate-400">Field visit assignment, parts requisition, and customer sign-off</p>
            </div>
            <Link to="/service" className="text-xs text-rose-600 font-semibold hover:underline">View All Tickets</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {(supportData.urgentTickets || []).map((tkt) => (
              <div key={tkt.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{tkt.ticketNumber}</span>
                    {tkt.faultCode && (
                      <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-200">
                        {tkt.faultCode}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tkt.underWarranty ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {tkt.underWarranty ? '100% Under Warranty' : 'Paid Service'}
                    </span>
                  </div>
                  <span className="text-slate-600 block mt-0.5">{tkt.complaintDescription}</span>
                  <span className="text-[11px] text-slate-400 block">Customer: {tkt.customer?.fullName} • {tkt.customer?.phone}</span>
                </div>
                <Link
                  to="/service"
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs"
                >
                  Manage
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------------------------
  // 6. FINANCE & PROFITABILITY WORKSPACE
  // ----------------------------------------------------------------------------------------
  if (isFinance && financeData) {
    return (
      <div className="space-y-6">
        {/* Finance Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md text-xs font-semibold border border-teal-200 mb-1">
              <CircleDollarSign className="w-3.5 h-3.5" />
              <span>Finance, Invoicing & Job Profitability</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Accounting & Margin Reconciliation</h1>
            <p className="text-xs text-slate-500">Record customer advance payments, reconcile hardware BOM costs, track direct expenses, and export P&L reports</p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to="/finance"
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1"
            >
              <CircleDollarSign className="w-4 h-4" />
              <span>Record Expense / Invoice</span>
            </Link>
            <a
              href="/api/finance/export/job-profitability"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Export P&L CSV</span>
            </a>
          </div>
        </div>

        {/* Finance KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoiced Revenue</span>
            <span className="text-lg font-extrabold text-slate-900 mt-1 block">{formatCurrency(financeData.totalInvoiced)}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">GST Tax Invoices</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verified Cash Collected</span>
            <span className="text-lg font-extrabold text-emerald-700 mt-1 block">{formatCurrency(financeData.totalPaymentsReceived)}</span>
            <span className="text-[11px] text-emerald-600 font-medium mt-1">Bank / UPI Receipts</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Receivables Balance</span>
            <span className="text-lg font-extrabold text-amber-600 mt-1 block">{formatCurrency(financeData.outstandingReceivables)}</span>
            <span className="text-[11px] text-amber-700 font-medium mt-1">{financeData.unpaidInvoicesCount} Pending Invoices</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hardware BOM Cost</span>
            <span className="text-lg font-extrabold text-slate-800 mt-1 block">{formatCurrency(financeData.hardwareCost)}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Actual BOM Purchase</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Operating Profit</span>
            <span className="text-lg font-extrabold text-indigo-700 mt-1 block">{formatCurrency(financeData.netOperatingProfit)}</span>
            <span className="text-[11px] text-indigo-600 font-semibold mt-1">Revenue - All Costs</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Margin %</span>
            <span className="text-lg font-extrabold text-teal-700 mt-1 block">{financeData.grossMarginPercentage?.toFixed(1)}%</span>
            <span className="text-[11px] text-slate-500 font-medium mt-1">Project Profitability</span>
          </div>
        </div>

        {/* Job Profitability Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Solar Project-Wise Profitability Ledger</h3>
              <p className="text-xs text-slate-400">Reconciliation of invoiced amount, hardware costs, technician payout, and net operating margin</p>
            </div>
            <Link to="/finance" className="text-xs text-emerald-600 font-semibold hover:underline">Full Finance View</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Order Number</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5">System Specs</th>
                  <th className="px-4 py-2.5 text-right">Order Value</th>
                  <th className="px-4 py-2.5 text-right">Hardware Cost</th>
                  <th className="px-4 py-2.5 text-right">Net Profit</th>
                  <th className="px-4 py-2.5 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(financeData.recentJobProfitability || []).map((job, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{job.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{job.customerName}</td>
                    <td className="px-4 py-3 text-slate-500">{job.capacityKw} kW {job.systemType}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(job.orderAmount)}</td>
                    <td className="px-4 py-3 text-right text-rose-600">{formatCurrency(job.hardwareCost)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{formatCurrency(job.netProfit)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                        {job.profitMarginPercentage?.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="p-8 text-center text-slate-500 text-sm">
      Loading workspace for {user?.fullName}...
    </div>
  );
};

export default DashboardPage;
