import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { Installation, SalesOrder, Technician, SerialNumber } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
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
  ScanLine,
  Check,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Phone,
  MapPin,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';

export const InstallationsPage: React.FC = () => {
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [eligibleOrders, setEligibleOrders] = useState<SalesOrder[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<Installation | null>(null);

  // Site Product Verification Scanner Modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [orderSerials, setOrderSerials] = useState<SerialNumber[]>([]);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Camera Barcode Scanning State (ZXing)
  const [cameraActive, setCameraActive] = useState(false);
  const [lastCamScanned, setLastCamScanned] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef<boolean>(false);
  const selectedInstallationRef = useRef<Installation | null>(null);

  // Schedule Form State
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTechIds, setSelectedTechIds] = useState<number[]>([]);
  const [workNotes, setWorkNotes] = useState('');

  // Complete Form State
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
    return () => {
      stopCamera();
    };
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

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // AudioContext not available or blocked
    }
  };

  // Keep ref in sync with state for use inside ZXing callback closure
  useEffect(() => { selectedInstallationRef.current = selectedInstallation; }, [selectedInstallation]);

  const handleBarcodeFromCamera = useCallback(async (code: string) => {
    if (!code || !selectedInstallationRef.current) return;
    if (code === lastCamScanned) return;
    setLastCamScanned(code);
    setTimeout(() => setLastCamScanned(''), 2500);

    setVerifying(true);
    setScanFeedback(null);
    try {
      const res = await api.post(`/installations/${selectedInstallationRef.current.id}/verify-product`, {
        barcode: code,
      });
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } catch (e) {}
      setScanFeedback({
        type: 'success',
        message: `✓ Camera-scanned & Verified: "${res.data.product?.name}" (${code}) marked SITE_RECEIVED!`,
      });
      const serialRes = await api.get(`/serial-numbers/order/${selectedInstallationRef.current.salesOrder.id}`);
      setOrderSerials(serialRes.data);
      fetchInitialData();
    } catch (err: any) {
      setScanFeedback({
        type: 'error',
        message: err.response?.data?.message || `Barcode ${code} not found in dispatch or invalid.`,
      });
    } finally {
      setVerifying(false);
    }
  }, [lastCamScanned]);

  const startCamera = async () => {
    try {
      const reader = new BrowserMultiFormatReader();
      codeReaderRef.current = reader;
      scanningRef.current = true;

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (devices.length === 0) {
        alert('No camera found. Use USB barcode scanner or manual entry below.');
        return;
      }

      const preferredDevice = devices.find((d) => d.label.toLowerCase().includes('back')) || devices[0];

      await reader.decodeFromVideoDevice(
        preferredDevice.deviceId,
        videoRef.current!,
        (result, err) => {
          if (!scanningRef.current) return;
          if (result) {
            handleBarcodeFromCamera(result.getText());
          }
          if (err && !(err instanceof NotFoundException)) {
            console.warn('ZXing decode error:', err);
          }
        }
      );

      setCameraActive(true);
    } catch (err) {
      console.warn('Camera/ZXing error:', err);
      alert('Could not access camera. Allow camera permission or use manual entry below.');
    }
  };

  const stopCamera = () => {
    scanningRef.current = false;
    codeReaderRef.current = null;
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setLastCamScanned('');
  };

  const openVerifyModal = async (inst: Installation) => {
    setSelectedInstallation(inst);
    setScanFeedback(null);
    setScannedBarcode('');
    setShowVerifyModal(true);
    try {
      const res = await api.get(`/serial-numbers/order/${inst.salesOrder.id}`);
      setOrderSerials(res.data);
    } catch (err) {
      console.error('Failed to load order serials:', err);
    }
  };

  const handleBarcodeVerify = async (barcodeToScan?: string) => {
    const code = barcodeToScan || scannedBarcode.trim();
    if (!code || !selectedInstallation) return;
    setVerifying(true);
    setScanFeedback(null);
    try {
      const res = await api.post(`/installations/${selectedInstallation.id}/verify-product`, {
        barcode: code,
      });
      playBeep();
      setScanFeedback({
        type: 'success',
        message: `✓ Verified: Serial ${code} for product "${res.data.product?.name}" marked SITE_RECEIVED!`,
      });
      setScannedBarcode('');

      // Refresh serials for this order
      const serialRes = await api.get(`/serial-numbers/order/${selectedInstallation.salesOrder.id}`);
      setOrderSerials(serialRes.data);
      fetchInitialData();
    } catch (err: any) {
      setScanFeedback({
        type: 'error',
        message: err.response?.data?.message || `Barcode ${code} rejected: not part of order dispatch or invalid.`,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleStartInstallation = async (inst: Installation) => {
    try {
      await api.post(`/installations/${inst.id}/start`, {});
      fetchInitialData();
      alert(`Installation for Job #${inst.installationNumber} officially started. Status set to IN_PROGRESS.`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start installation');
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
      alert('Installation successfully marked completed! Product serials updated to INSTALLED, and manufacturer warranties activated from actual completion date.');
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

  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_DIRECTOR');
  const isTech = user?.roles?.includes('ROLE_TECHNICIAN') && !isAdmin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Installation Field Operations</h1>
          <p className="text-sm text-slate-500">
            Technician barcode site verification, physical mounting, start tracking, testing, and completion sign-off
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold">
              Director Audit Mode (Read-Only)
            </span>
          )}

          {isTech && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Crew & Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Lifecycle Flow Banner */}
      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <p>
            <strong>Serialized Product Lifecycle:</strong>{' '}
            <code className="text-slate-800 font-mono font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200">
              IN_STOCK → RESERVED → PICKED → DISPATCHED → SITE_RECEIVED → INSTALLED
            </code>{' '}
            • Warranties start strictly on actual physical installation completion date.
          </p>
        </div>
      </div>

      {/* Installations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Job #</th>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer & Address</th>
                <th className="py-3 px-4">Field Crew</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Technician Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {installations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
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
                      <div className="text-[11px] text-slate-400 font-normal">{inst.customer.phone} • {inst.customer.address}</div>
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
                    <td className="py-3 px-4 whitespace-nowrap">
                      {inst.actualStartTime ? (
                        <span className="text-emerald-700 font-medium">
                          {new Date(inst.actualStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not started</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inst.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* 1. Barcode Site Verification Button */}
                      <button
                        onClick={() => openVerifyModal(inst)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded text-xs font-semibold cursor-pointer inline-flex items-center space-x-1"
                        title="Scan dispatched products on-site before installation"
                      >
                        <ScanLine className="w-3.5 h-3.5" />
                        <span>Verify Products</span>
                      </button>

                      {/* 2. Start Installation Button */}
                      {isTech && inst.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleStartInstallation(inst)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Job</span>
                        </button>
                      )}

                      {/* 3. Field Sign-Off / Complete Installation Button */}
                      {isTech && inst.status !== 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setSelectedInstallation(inst);
                            setInstalledCapacityKw(inst.salesOrder.capacityKw.toString());
                            setCustomerSigneeName(inst.customer.fullName);
                            setShowCompleteModal(true);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                        >
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Complete & Sign</span>
                        </button>
                      )}

                      {isAdmin && inst.status !== 'COMPLETED' && (
                        <span className="text-xs text-slate-400 font-medium italic">View Only</span>
                      )}

                      {inst.status === 'COMPLETED' && (
                        <div className="inline-flex items-center space-x-1.5">
                          {inst.customerSignatureUrl ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center space-x-1">
                              <span>Digital Sign-Off ✓</span>
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-700 font-medium inline-flex items-center space-x-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Commissioned</span>
                            </span>
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

      {/* Modal: Site Product Verification & Barcode Scanner */}
      {showVerifyModal && selectedInstallation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900">On-Site Product Barcode Verification</h2>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-200">
                    Job {selectedInstallation.installationNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Technician physical barcode scan for Order {selectedInstallation.salesOrder.orderNumber} ({selectedInstallation.customer.fullName})
                </p>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setShowVerifyModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Camera Scanner Stream Box */}
              <div className="bg-slate-900 rounded-xl p-3 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-xs">Live Camera — ZXing Auto-Decoder (Laptop / Mobile)</span>
                  </div>
                  {cameraActive ? (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 rounded text-[11px] font-semibold cursor-pointer"
                    >
                      Stop Camera
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-[11px] font-semibold cursor-pointer"
                    >
                      Start Camera
                    </button>
                  )}
                </div>

                {cameraActive ? (
                  <div className="relative w-full h-52 bg-black rounded-xl overflow-hidden flex items-center justify-center border border-emerald-500/40">
                    <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
                    {/* Scanning reticle */}
                    <div className="absolute inset-x-8 inset-y-6 border-2 border-dashed border-emerald-400 rounded-lg pointer-events-none flex items-center justify-center">
                      <div className="w-full h-0.5 bg-emerald-400 shadow-xs shadow-emerald-400 animate-pulse" />
                    </div>
                    {/* ZXing live indicator */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-emerald-900/80 border border-emerald-500/60 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping inline-block"></span>
                      <span className="text-[10px] font-semibold text-emerald-300">ZXing Auto-Scan Active</span>
                    </div>
                    {lastCamScanned && (
                      <div className="absolute top-2 right-2 bg-emerald-700/90 px-2 py-0.5 rounded-lg text-[10px] text-white font-mono">
                        Read: {lastCamScanned}
                      </div>
                    )}
                    <div className="absolute bottom-1.5 bg-slate-900/80 px-3 py-0.5 rounded-full text-[10px] text-slate-300">
                      Auto-submits when a barcode or QR is detected
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 py-1">
                    Camera is off. Click "Start Camera" to enable ZXing live scanning, or type/scan with USB handheld scanner below.
                  </p>
                )}
              </div>

              {/* USB / Manual Barcode Input Form */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-semibold text-slate-700">Scan Barcode / Enter Serial Code:</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ScanLine className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={scannedBarcode}
                      onChange={(e) => setScannedBarcode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleBarcodeVerify();
                        }
                      }}
                      placeholder="Scan product barcode (e.g. INV-OG-3KW-GROWATT-98213)..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={verifying || !scannedBarcode.trim()}
                    onClick={() => handleBarcodeVerify()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold cursor-pointer shadow-xs"
                  >
                    {verifying ? 'Verifying...' : 'Verify'}
                  </button>
                </div>

                {/* Scan Feedback Alert */}
                {scanFeedback && (
                  <div
                    className={`p-2.5 rounded-lg border text-xs font-medium flex items-center space-x-2 ${
                      scanFeedback.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {scanFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{scanFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Order's Dispatched Products & Serial Numbers List */}
              <div>
                <h3 className="font-bold text-slate-800 mb-2">Dispatched Order Products ({orderSerials.length})</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Serial Code</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Site Receipt</th>
                        <th className="py-2.5 px-3 text-right">Quick Scan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orderSerials.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                            No serialized products assigned to this order yet.
                          </td>
                        </tr>
                      ) : (
                        orderSerials.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{s.serialCode}</td>
                            <td className="py-2.5 px-3 text-slate-700">{s.product?.name}</td>
                            <td className="py-2.5 px-3">
                              <StatusBadge status={s.status} />
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-slate-500">
                              {s.siteReceivedAt ? (
                                <span className="text-emerald-700 font-medium">
                                  ✓ {new Date(s.siteReceivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Pending scan</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleBarcodeVerify(s.serialCode)}
                                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold border border-slate-200 cursor-pointer"
                              >
                                Scan Code
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setShowVerifyModal(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Field Technicians (Crew) *</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-slate-200 p-2 rounded-lg">
                  {technicians.map((tech) => (
                    <label
                      key={tech.id}
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer border ${
                        selectedTechIds.includes(tech.id) ? 'bg-emerald-50 border-emerald-300' : 'hover:bg-slate-50 border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTechIds.includes(tech.id)}
                        onChange={() => toggleTech(tech.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <div>
                        <div className="font-semibold text-slate-800">{tech.name}</div>
                        <div className="text-[10px] text-slate-400">{tech.skills?.split(',')[0]}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Crew Field Notes</label>
                <textarea
                  rows={2}
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="e.g. Bring safety harnesses, crane lift needed for inverter mount..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
                >
                  Confirm Crew Deployment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Complete Installation & Field Sign-Off */}
      {showCompleteModal && selectedInstallation && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Rooftop Commissioning & Sign-Off</h2>
                <p className="text-xs text-slate-500">
                  Job {selectedInstallation.installationNumber} • Order {selectedInstallation.salesOrder.orderNumber}
                </p>
              </div>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                <strong>Warranty Guarantee Trigger:</strong> Marking this job completed sets actual installation completion timestamp and starts official 24-month manufacturer warranties for inverters/batteries and 240 months for solar modules.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Installed Capacity (kW) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={installedCapacityKw}
                    onChange={(e) => setInstalledCapacityKw(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Crew Hours Worked (per Tech) *</label>
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

              {/* Technical Checklists */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-semibold text-slate-700">Safety & Compliance Checklists</span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={panelMounting}
                      onChange={(e) => setPanelMounting(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>Structure & Panel Mounting</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wiringConfirmed}
                      onChange={(e) => setWiringConfirmed(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>DC/AC Wiring & SPD Box</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={earthingConfirmed}
                      onChange={(e) => setEarthingConfirmed(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>Chemical Earthing Pit Test</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testingPassed}
                      onChange={(e) => setTestingPassed(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>Live Generation Sync Test</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peak Generation / Sync Verification Notes</label>
                <textarea
                  rows={2}
                  value={testingNotes}
                  onChange={(e) => setTestingNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                    placeholder="e.g. K. Narayanan"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Customer Acceptance Feedback</label>
                  <input
                    type="text"
                    value={customerAcceptanceNote}
                    onChange={(e) => setCustomerAcceptanceNote(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Satisfied with rooftop testing"
                  />
                </div>
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
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs cursor-pointer"
                >
                  Finalize & Activate Warranties
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
