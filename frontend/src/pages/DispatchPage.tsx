import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api/client';
import { Dispatch, SalesOrder, SerialNumber, DispatchItem } from '../types';
import { StatusBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import {
  Truck,
  Plus,
  Barcode,
  CheckCircle2,
  PackageCheck,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Camera,
  CameraOff,
  QrCode,
  Zap,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';

const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch (e) {
    // Audio context may be restricted by browser policy before first interaction
  }
};

export const DispatchPage: React.FC = () => {
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);

  // Live Barcode & QR Scanner state
  const [targetItemId, setTargetItemId] = useState<string>('auto');
  const [scannerInput, setScannerInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanningRef = useRef<boolean>(false);
  const selectedDispatchRef = useRef<Dispatch | null>(null);
  const targetItemIdRef = useRef<string>('auto');

  // Keep refs in sync with state so the ZXing callback closure can access latest values
  useEffect(() => { selectedDispatchRef.current = selectedDispatch; }, [selectedDispatch]);
  useEffect(() => { targetItemIdRef.current = targetItemId; }, [targetItemId]);

  const handleBarcodeScanFromCamera = useCallback(async (code: string) => {
    if (!code || !selectedDispatchRef.current) return;
    // Debounce: don't re-scan the same code within 2 seconds
    if (code === lastScanned) return;
    setLastScanned(code);
    setTimeout(() => setLastScanned(''), 2000);

    setIsScanning(true);
    setScanMessage(null);
    try {
      const dispatchItemId = targetItemIdRef.current !== 'auto' ? parseInt(targetItemIdRef.current) : undefined;
      const res = await api.post(`/dispatches/${selectedDispatchRef.current.id}/scan-barcode`, {
        barcode: code,
        dispatchItemId,
      });
      playBeep();
      setSelectedDispatch(res.data);
      setScanMessage({ text: `✓ Barcode '${code}' registered & allocated! Marked: Outbound for Installation.`, type: 'success' });
    } catch (err: any) {
      setScanMessage({ text: err.response?.data?.message || `Barcode '${code}' not found in dispatch or already registered.`, type: 'error' });
    } finally {
      setIsScanning(false);
    }
  }, [lastScanned]);

  const startCamera = async () => {
    setCameraError(null);
    setLastScanned('');
    try {
      // Create a new ZXing reader and start continuous decode from the default camera
      const reader = new BrowserMultiFormatReader();
      codeReaderRef.current = reader;
      scanningRef.current = true;

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      if (devices.length === 0) {
        setCameraError('No camera found. Use USB barcode scanner or manual entry.');
        return;
      }

      // Prefer back camera if on mobile; on laptop this will just pick the webcam
      const preferredDevice = devices.find((d) => d.label.toLowerCase().includes('back')) || devices[0];

      await reader.decodeFromVideoDevice(
        preferredDevice.deviceId,
        videoRef.current!,
        (result, err) => {
          if (!scanningRef.current) return;
          if (result) {
            const code = result.getText();
            handleBarcodeScanFromCamera(code);
          }
          // NotFoundException fires every frame when nothing is found — silence it
          if (err && !(err instanceof NotFoundException)) {
            console.warn('ZXing decode error:', err);
          }
        }
      );

      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera/ZXing error:', err);
      setCameraError('Camera unavailable. Allow camera permission or use manual entry below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    scanningRef.current = false;
    if (codeReaderRef.current) {
      // BrowserMultiFormatReader does not expose a direct stop; resetting the video element stops the stream
      codeReaderRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setLastScanned('');
  };

  const handleBarcodeScan = async (codeToScan?: string) => {
    const code = (codeToScan || scannerInput).trim();
    if (!code || !selectedDispatch) return;

    setIsScanning(true);
    setScanMessage(null);
    try {
      const dispatchItemId = targetItemId !== 'auto' ? parseInt(targetItemId) : undefined;
      const res = await api.post(`/dispatches/${selectedDispatch.id}/scan-barcode`, {
        barcode: code,
        dispatchItemId,
      });

      playBeep();
      setSelectedDispatch(res.data);
      setScannerInput('');
      setScanMessage({
        text: `Barcode '${code}' registered & allocated! Marked: Outbound for Installation.`,
        type: 'success',
      });
      fetchDispatchData();
    } catch (err: any) {
      setScanMessage({
        text: err.response?.data?.message || 'Failed to scan and register serial number',
        type: 'error',
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Serial assign state
  const [assigningItem, setAssigningItem] = useState<DispatchItem | null>(null);
  const [scannedSerialCode, setScannedSerialCode] = useState('');
  const [availableSerials, setAvailableSerials] = useState<SerialNumber[]>([]);

  // Delivery confirm state
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  // Form State
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');

  const location = useLocation();

  useEffect(() => {
    fetchDispatchData();
  }, []);

  useEffect(() => {
    if (location.state && (location.state as any).orderId) {
      setSelectedOrderId((location.state as any).orderId.toString());
      setShowCreateModal(true);
    }
  }, [location.state]);

  const fetchDispatchData = async () => {
    setLoading(true);
    try {
      const [dispRes, orderRes] = await Promise.all([
        api.get('/dispatches'),
        api.get('/orders'),
      ]);
      setDispatches(dispRes.data);
      const eligible = orderRes.data.filter((o: SalesOrder) => o.status !== 'PENDING_PAYMENT');
      setConfirmedOrders(eligible);
      if (eligible.length > 0 && !selectedOrderId) {
        setSelectedOrderId(eligible[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/dispatches', {
        salesOrderId: parseInt(selectedOrderId),
        vehicleNumber,
        driverName,
        driverPhone,
        dispatchNotes,
      });
      setShowCreateModal(false);
      fetchDispatchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to initialize dispatch');
    }
  };

  const openSerialAssign = async (item: DispatchItem) => {
    setAssigningItem(item);
    setScannedSerialCode('');
    try {
      const res = await api.get(`/serial-numbers/available/${item.product.id}`);
      setAvailableSerials(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningItem || !scannedSerialCode.trim()) return;
    try {
      const res = await api.post('/dispatches/assign-serial', {
        dispatchItemId: assigningItem.id,
        serialCode: scannedSerialCode.trim(),
      });
      setSelectedDispatch(res.data);
      setAssigningItem(null);
      setScannedSerialCode('');
      fetchDispatchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Invalid serial number');
    }
  };

  const handleConfirmDispatch = async (dispatchId: number) => {
    try {
      const res = await api.post(`/dispatches/${dispatchId}/confirm-dispatch`);
      setSelectedDispatch(res.data);
      fetchDispatchData();
      alert('Dispatch confirmed! Inventory stock deducted and serial numbers committed.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm dispatch');
    }
  };

  const handleConfirmDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatch) return;
    try {
      const res = await api.post(`/dispatches/${selectedDispatch.id}/confirm-delivery`, {
        deliveryDate,
        notes: deliveryNotes,
      });
      setSelectedDispatch(res.data);
      setShowDeliveryModal(false);
      fetchDispatchData();
      alert('Delivery confirmed! Product warranties have been automatically activated!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm delivery');
    }
  };

  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_DIRECTOR');
  const isWarehouse = user?.roles?.includes('ROLE_WAREHOUSE') && !isAdmin;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Warehouse Picking, Serials & Dispatch
          </h1>
          <p className="text-sm text-slate-500">
            Mandatory serial verification (inverters/batteries), barcode scanner input, and delivery confirmation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isWarehouse && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Dispatch Picking List</span>
            </button>
          )}
        </div>
      </div>

      {/* Dispatches List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Dispatch #</th>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Vehicle & Driver</th>
                <th className="py-3 px-4">Dispatch Date</th>
                <th className="py-3 px-4">Delivery Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dispatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No dispatch records found. Orders must receive advance payment before picking begins.
                  </td>
                </tr>
              ) : (
                dispatches.map((disp) => (
                  <tr key={disp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{disp.dispatchNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{disp.salesOrder.orderNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div>{disp.customer.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{disp.customer.city}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{disp.vehicleNumber || 'Unassigned'}</div>
                      <div className="text-[10px] text-slate-400">{disp.driverName} {disp.driverPhone && `(${disp.driverPhone})`}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{disp.dispatchDate || '-'}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{disp.deliveryDate || '-'}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={disp.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedDispatch(disp)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold cursor-pointer"
                      >
                        Picking Sheet ({disp.items?.length || 0})
                      </button>

                      {!isAdmin && isWarehouse && (
                        <>
                          {disp.status === 'PICKING' && (
                            <button
                              onClick={() => handleConfirmDispatch(disp.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Confirm Dispatch</span>
                            </button>
                          )}

                          {disp.status === 'DISPATCHED' && (
                            <button
                              onClick={() => {
                                setSelectedDispatch(disp);
                                setShowDeliveryModal(true);
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold shadow-xs cursor-pointer inline-flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm Delivery</span>
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

      {/* Picking Sheet & Serial Allocation Modal */}
      {selectedDispatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Picking Sheet: {selectedDispatch.dispatchNumber}
                </h2>
                <p className="text-xs text-slate-500">
                  Order: {selectedDispatch.salesOrder.orderNumber} | Customer: {selectedDispatch.customer.fullName}
                </p>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setSelectedDispatch(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Live Barcode & QR Scanner Section */}
            {selectedDispatch.status === 'PICKING' && isWarehouse && (
              <div className="mb-6 p-4 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 mb-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                      <Barcode className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>Barcode & QR Scanner</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                          Auto-Register & Allocate
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Scan any item QR or barcode — auto-generates serial number & registers outbound for installation
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (cameraActive) {
                          stopCamera();
                        } else {
                          startCamera();
                        }
                      }}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        cameraActive
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      {cameraActive ? (
                        <>
                          <CameraOff className="w-3.5 h-3.5" />
                          <span>Close Camera</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Live Camera Scan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Camera Viewfinder if active */}
                {cameraActive && (
                  <div className="relative mb-4 bg-black rounded-xl overflow-hidden border border-emerald-500/30 flex flex-col items-center justify-center min-h-[220px]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full max-h-[260px] object-cover"
                    />
                    {/* Laser scanner reticle */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-emerald-400/70 rounded-xl relative shadow-lg">
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400"></div>
                        <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse absolute top-1/2 -translate-y-1/2"></div>
                      </div>
                    </div>
                    {/* Live ZXing scanning indicator */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-emerald-900/80 border border-emerald-500/60 px-2.5 py-1 rounded-full">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping inline-block"></span>
                      <span className="text-[10px] font-semibold text-emerald-300">ZXing Live Scan — Point camera at barcode or QR</span>
                    </div>
                    {lastScanned && (
                      <div className="absolute top-2 right-2 bg-emerald-600/90 px-2 py-1 rounded-lg text-[10px] text-white font-mono">
                        Read: {lastScanned}
                      </div>
                    )}
                    <div className="absolute bottom-2 bg-slate-900/80 backdrop-blur-xs px-3 py-1 rounded-full text-[10px] text-slate-300">
                      Auto-submits immediately when a barcode is detected
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="mb-3 p-2 bg-amber-950/40 border border-amber-800/60 rounded-lg text-[11px] text-amber-300">
                    {cameraError}
                  </div>
                )}

                {/* Target Item and Input Bar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-3">
                  <div className="md:col-span-5">
                    <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                      Target Picking Item:
                    </label>
                    <select
                      value={targetItemId}
                      onChange={(e) => setTargetItemId(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="auto">⚡ Auto-assign to next pending item</option>
                      {selectedDispatch.items
                        .filter((it) => it.product.serialized)
                        .map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.product.name} {it.serialNumber ? `(Assigned: ${it.serialNumber.serialCode})` : '(Needs Serial)'}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="md:col-span-7">
                    <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                      Barcode / QR Code / USB Scanner:
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={scannerInput}
                          onChange={(e) => setScannerInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleBarcodeScan();
                            }
                          }}
                          placeholder="Scan barcode or enter code (e.g. INV-GW-5K-001)"
                          className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBarcodeScan()}
                        disabled={isScanning || !scannerInput.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer shrink-0"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Scan & Verify</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fast One-Click Test Barcodes */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-[11px]">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold mr-1">Quick Scan Test:</span>
                  <button
                    type="button"
                    onClick={() => handleBarcodeScan(`INV-GW-5K-${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 font-mono text-[10px] transition cursor-pointer"
                  >
                    + Scan Inverter Barcode
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBarcodeScan(`BAT-LFP-48V-${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded border border-slate-700 font-mono text-[10px] transition cursor-pointer"
                  >
                    + Scan Battery Barcode
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBarcodeScan(`BC-SOLAR-${Math.floor(100000 + Math.random() * 900000)}`)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-slate-700 font-mono text-[10px] transition cursor-pointer"
                  >
                    + Scan Dynamic QR
                  </button>
                </div>

                {/* Scan Status Toast Message */}
                {scanMessage && (
                  <div
                    className={`mt-3 p-2.5 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                      scanMessage.type === 'success'
                        ? 'bg-emerald-950/50 border border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-950/50 border border-rose-500/50 text-rose-300'
                    }`}
                  >
                    {scanMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{scanMessage.text}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center space-x-2">
              <Barcode className="w-4 h-4 text-amber-700 shrink-0" />
              <p>
                <strong>Mandatory Serial Number Rule:</strong> All high-value inverters, batteries, and charge controllers
                must have an assigned serial number before dispatch can be confirmed.
              </p>
            </div>

            {/* Picking Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3">Assigned Serial Number</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedDispatch.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.product.name}
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">
                          {item.product.productCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {item.product.serialized ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            Serialized
                          </span>
                        ) : (
                          <span className="text-slate-400">Bulk Hardware</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 px-3">
                        {item.serialNumber ? (
                          <div>
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {item.serialNumber.serialCode}
                            </span>
                            <span className="block text-[10px] text-emerald-600 font-sans mt-0.5 font-medium">
                              ✓ Outbound for Installation
                            </span>
                          </div>
                        ) : item.product.serialized ? (
                          <span className="text-rose-600 font-semibold text-[11px] flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Missing Serial Number</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not applicable</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {item.product.serialized && selectedDispatch.status === 'PICKING' && !isAdmin && isWarehouse && (
                          <button
                            onClick={() => {
                              setTargetItemId(item.id.toString());
                              setScannerInput('');
                              setScanMessage(null);
                            }}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded font-semibold cursor-pointer inline-flex items-center space-x-1"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                            <span>{item.serialNumber ? 'Re-scan' : 'Scan Item'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Current Status: <strong>{selectedDispatch.status}</strong>
              </span>

              <div className="space-x-3">
                <button
                  onClick={() => {
                    stopCamera();
                    setSelectedDispatch(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-medium text-xs cursor-pointer"
                >
                  Close
                </button>
                {selectedDispatch.status === 'PICKING' && !isAdmin && isWarehouse && (
                  <button
                    onClick={() => handleConfirmDispatch(selectedDispatch.id)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold text-xs shadow-xs"
                  >
                    Confirm & Commit Dispatch
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode / Serial Scan Modal */}
      {assigningItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Scan Serial Number</h2>
            <p className="text-xs text-slate-500 mb-4">
              Item: <strong>{assigningItem.product.name}</strong>
            </p>

            <form onSubmit={handleAssignSerial} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Barcode Scanner Input / Serial Code *
                </label>
                <div className="relative">
                  <Barcode className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={scannedSerialCode}
                    onChange={(e) => setScannedSerialCode(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Scan barcode or enter serial (e.g. INV-GW-3K-1001)"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports hardware barcode scanner USB/Bluetooth keyboard emulation.
                </p>
              </div>

              {/* In-Stock Fast Select */}
              {availableSerials.length > 0 && (
                <div>
                  <span className="block font-semibold text-slate-700 mb-1">Available in Warehouse:</span>
                  <div className="space-y-1 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
                    {availableSerials.map((sn) => (
                      <button
                        type="button"
                        key={sn.id}
                        onClick={() => setScannedSerialCode(sn.serialCode)}
                        className="w-full text-left px-2 py-1 bg-white hover:bg-purple-50 border border-slate-200 rounded text-[11px] font-mono font-medium text-slate-800 flex justify-between items-center"
                      >
                        <span>{sn.serialCode}</span>
                        <span className="text-[10px] text-slate-400 font-sans">{sn.warehouseLocation}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-semibold shadow-xs"
                >
                  Verify & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delivery Modal */}
      {showDeliveryModal && selectedDispatch && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Confirm Customer Site Delivery</h2>
            <p className="text-xs text-slate-500 mb-4">
              Dispatch: {selectedDispatch.dispatchNumber} to {selectedDispatch.customer.fullName}
            </p>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 mb-4 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <p>
                <strong>Automatic Warranty Trigger:</strong> Delivery confirmation automatically generates and activates
                warranty certificates with start date = delivery date!
              </p>
            </div>

            <form onSubmit={handleConfirmDelivery} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirmed Delivery Date *</label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Delivery / Handover Remarks</label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Unloaded into customer premises, all cartons inspected with no physical damage."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs"
                >
                  Confirm Delivery & Activate Warranties
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Dispatch Picking List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1">New Dispatch Picking List</h2>
            <p className="text-xs text-slate-500 mb-4">
              Select confirmed sales order with advance payment verified
            </p>

            <form onSubmit={handleCreateDispatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Sales Order *</label>
                <select
                  required
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Order --</option>
                  {confirmedOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} - {o.customer.fullName} ({o.capacityKw} kW {o.systemType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. TN-38-BZ-4109"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g. Murugan V"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Driver Phone Number</label>
                <input
                  type="tel"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. 9842199881"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Picking Notes / Gate Pass Instructions</label>
                <textarea
                  rows={2}
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="e.g. Include extra 10m DC cable for terrace riser conduit..."
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
                  disabled={confirmedOrders.length === 0}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-xs disabled:opacity-50"
                >
                  Generate Picking Sheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
