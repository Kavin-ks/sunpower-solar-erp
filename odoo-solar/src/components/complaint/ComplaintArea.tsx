'use client';

import React, { useState } from 'react';

const ComplaintArea = () => {
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');

  // Submit Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [serialCode, setSerialCode] = useState('');
  const [faultCategory, setFaultCategory] = useState('Inverter Error / Grid Sync Drop');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitResult, setSubmitResult] = useState<any>(null);

  // Track state
  const [trackTicketNo, setTrackTicketNo] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<any>(null);

  // Sign-off state
  const [signOffNotes, setSignOffNotes] = useState('Generation verified restored at normal capacity. Inverter running green.');
  const [signOffName, setSignOffName] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitResult(null);

    try {
      const res = await fetch('/api/complaint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          serialCode,
          faultCategory,
          complaintDescription,
          complaintPhotoUrl: photoUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit complaint');
      }

      setSubmitResult(data);
      // Auto-populate tracking fields
      setTrackTicketNo(data.ticketNumber);
      setTrackPhone(customerPhone);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong while submitting complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackTicketNo.trim()) return;
    setTracking(true);
    setTrackError('');
    setTrackedTicket(null);
    setConfirmSuccess(false);

    try {
      const res = await fetch(`/api/complaint/${encodeURIComponent(trackTicketNo.trim())}?phone=${encodeURIComponent(trackPhone.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ticket not found or phone number does not match record');
      }
      setTrackedTicket(data);
      if (data.customer?.fullName) {
        setSignOffName(data.customer.fullName);
      }
    } catch (err: any) {
      setTrackError(err.message || 'Failed to track service ticket');
    } finally {
      setTracking(false);
    }
  };

  const handleConfirmResolution = async () => {
    if (!trackedTicket) return;
    setConfirming(true);
    try {
      const res = await fetch(`/api/complaint/${encodeURIComponent(trackedTicket.ticketNumber)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationNotes: signOffNotes,
          confirmedByCustomerName: signOffName || trackedTicket.customer?.fullName || 'Customer Sign-off',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to confirm resolution');
      }
      setTrackedTicket(data);
      setConfirmSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Failed to confirm resolution');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <section className="tp-contact-area pt-80 pb-80">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-xl-10 col-lg-12">
            <div className="tp-section-title-wrapper text-center mb-40">
              <span className="tp-section-subtitle">Customer Care & Support</span>
              <h3 className="tp-section-title">Solar Equipment Service & Warranty Portal</h3>
              <p className="mt-2 text-muted">
                Submit breakdown complaints with serial verification, track field technician repairs live, and digitally sign off when your system generation is restored.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="d-flex justify-content-center mb-40 gap-3">
              <button
                type="button"
                onClick={() => { setActiveTab('submit'); setSubmitResult(null); }}
                className={`tp-btn ${activeTab === 'submit' ? 'tp-btn-theme' : 'tp-btn-border'}`}
                style={{ padding: '12px 28px', borderRadius: '30px', fontWeight: 600 }}
              >
                1. Register New Service Complaint
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('track')}
                className={`tp-btn ${activeTab === 'track' ? 'tp-btn-theme' : 'tp-btn-border'}`}
                style={{ padding: '12px 28px', borderRadius: '30px', fontWeight: 600 }}
              >
                2. Track Complaint & Confirm Sign-Off
              </button>
            </div>

            {/* TAB 1: SUBMIT COMPLAINT */}
            {activeTab === 'submit' && (
              <div className="card shadow-sm border-0 p-4 p-md-5 rounded-4">
                {submitResult ? (
                  <div className="text-center py-4">
                    <div className="mb-3" style={{ fontSize: '48px', color: '#10b981' }}>✓</div>
                    <h4 className="font-bold text-success mb-2">Complaint Registered Successfully!</h4>
                    <p className="text-muted mb-4">Your complaint has been submitted to the SunPower Customer Support team.</p>

                    <div className="bg-light p-4 rounded-3 text-start mx-auto mb-4" style={{ maxWidth: '600px' }}>
                      <div className="row g-3">
                        <div className="col-sm-6">
                          <span className="text-muted d-block small">Ticket Reference</span>
                          <strong className="fs-5 text-dark font-monospace">{submitResult.ticketNumber}</strong>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted d-block small">Status</span>
                          <span className="badge bg-warning text-dark px-3 py-2">{submitResult.status}</span>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted d-block small">Equipment Serial Number</span>
                          <strong className="font-monospace text-dark">{submitResult.serialNumber?.serialCode || serialCode}</strong>
                        </div>
                        <div className="col-sm-6">
                          <span className="text-muted d-block small">Adjudicated Warranty Decision</span>
                          <strong className={submitResult.underWarranty ? 'text-success' : 'text-danger'}>
                            {submitResult.underWarranty ? '✓ Active Warranty (₹0 Repair Charges)' : 'Out of Warranty (Subject to Parts/Labor)'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTrackTicketNo(submitResult.ticketNumber);
                        setActiveTab('track');
                      }}
                      className="tp-btn tp-btn-theme"
                      style={{ padding: '12px 30px', borderRadius: '25px' }}
                    >
                      Track This Complaint Live →
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitComplaint}>
                    {submitError && (
                      <div className="alert alert-danger mb-4" role="alert">
                        <strong>Error:</strong> {submitError}
                      </div>
                    )}

                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Customer Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="e.g. 9876543210 (Must match installation order)"
                          className="form-control"
                          style={{ padding: '12px', borderRadius: '10px' }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Customer Full Name</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Your Name"
                          className="form-control"
                          style={{ padding: '12px', borderRadius: '10px' }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Equipment Serial Number *</label>
                        <input
                          type="text"
                          required
                          value={serialCode}
                          onChange={(e) => setSerialCode(e.target.value)}
                          placeholder="e.g. SN-INV-5KW-001 or ITRK-PNL-ORD00001-1"
                          className="form-control font-monospace"
                          style={{ padding: '12px', borderRadius: '10px' }}
                        />
                        <small className="text-muted">Enter the serial barcode on your inverter, battery, or solar panel.</small>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Defect / Fault Category *</label>
                        <select
                          value={faultCategory}
                          onChange={(e) => setFaultCategory(e.target.value)}
                          className="form-select"
                          style={{ padding: '12px', borderRadius: '10px' }}
                        >
                          <option value="Inverter Error / Grid Sync Drop">Inverter Error / Grid Sync Drop</option>
                          <option value="Solar Panel Generation Defect">Solar Panel Generation Defect</option>
                          <option value="Battery Storage Underperformance">Battery Storage Underperformance</option>
                          <option value="SPD / Earthing Voltage Spike">SPD / Earthing Voltage Spike</option>
                          <option value="Physical / Weather Storm Damage (Excluded)">Physical / Weather Storm Damage (Excluded)</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">Problem Description *</label>
                        <textarea
                          rows={4}
                          required
                          value={complaintDescription}
                          onChange={(e) => setComplaintDescription(e.target.value)}
                          placeholder="Please describe what is happening (e.g. Inverter red fault light illuminated, zero generation shown on meter, unusual noise from battery enclosure...)"
                          className="form-control"
                          style={{ padding: '12px', borderRadius: '10px' }}
                        ></textarea>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">Upload Photo of Fault / Inverter Screen (Optional)</label>
                        <input
                          type="text"
                          value={photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          placeholder="Photo URL or file reference (e.g. https://images.unsplash.com/photo-inverter-fault)"
                          className="form-control"
                          style={{ padding: '12px', borderRadius: '10px' }}
                        />
                      </div>

                      <div className="col-12 text-center mt-4">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="tp-btn tp-btn-theme"
                          style={{ padding: '14px 40px', borderRadius: '30px', fontWeight: 700 }}
                        >
                          {submitting ? 'Verifying Serial & Submitting...' : 'Submit Support Complaint'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: TRACK & CONFIRM COMPLAINT */}
            {activeTab === 'track' && (
              <div className="card shadow-sm border-0 p-4 p-md-5 rounded-4">
                <form onSubmit={handleTrackComplaint} className="mb-4">
                  <div className="row g-3 align-items-end">
                    <div className="col-md-5">
                      <label className="form-label fw-semibold">Ticket Reference Number *</label>
                      <input
                        type="text"
                        required
                        value={trackTicketNo}
                        onChange={(e) => setTrackTicketNo(e.target.value)}
                        placeholder="e.g. TCK-00001"
                        className="form-control font-monospace"
                        style={{ padding: '12px', borderRadius: '10px' }}
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label fw-semibold">Customer Phone (Verification)</label>
                      <input
                        type="tel"
                        value={trackPhone}
                        onChange={(e) => setTrackPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="form-control"
                        style={{ padding: '12px', borderRadius: '10px' }}
                      />
                    </div>
                    <div className="col-md-2">
                      <button
                        type="submit"
                        disabled={tracking}
                        className="tp-btn tp-btn-theme w-100"
                        style={{ padding: '12px 16px', borderRadius: '10px' }}
                      >
                        {tracking ? '...' : 'Track Ticket'}
                      </button>
                    </div>
                  </div>
                </form>

                {trackError && (
                  <div className="alert alert-danger" role="alert">
                    {trackError}
                  </div>
                )}

                {trackedTicket && (
                  <div className="border rounded-4 p-4 mt-3 bg-white">
                    <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-3">
                      <div>
                        <span className="text-muted small d-block">Complaint Reference</span>
                        <h4 className="font-monospace text-dark mb-0">{trackedTicket.ticketNumber}</h4>
                      </div>
                      <div className="text-end">
                        <span className="text-muted small d-block">Current Workflow Status</span>
                        <span className={`badge px-3 py-2 fs-6 ${
                          trackedTicket.status === 'CLOSED' ? 'bg-success' :
                          trackedTicket.status === 'RESOLVED' ? 'bg-info text-dark' :
                          trackedTicket.status === 'IN_PROGRESS' ? 'bg-warning text-dark' : 'bg-primary'
                        }`}>
                          {trackedTicket.status}
                        </span>
                      </div>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-sm-6">
                        <span className="text-muted small d-block">Customer</span>
                        <strong>{trackedTicket.customer?.fullName}</strong>
                      </div>
                      <div className="col-sm-6">
                        <span className="text-muted small d-block">Equipment Serial Number</span>
                        <span className="font-monospace text-dark fw-bold">{trackedTicket.serialNumber?.serialCode || 'N/A'}</span>
                      </div>
                      <div className="col-sm-6">
                        <span className="text-muted small d-block">Warranty Adjudication</span>
                        <strong className={trackedTicket.underWarranty ? 'text-success' : 'text-danger'}>
                          {trackedTicket.underWarranty ? '✓ Active Warranty Coverage' : 'Out of Warranty (Chargeable)'}
                        </strong>
                      </div>
                      <div className="col-sm-6">
                        <span className="text-muted small d-block">Assigned Field Technician</span>
                        <strong>{trackedTicket.assignedTechnician?.name || 'Awaiting assignment'}</strong>
                      </div>
                    </div>

                    {/* Problem Description */}
                    <div className="mb-4 bg-light p-3 rounded-3">
                      <span className="text-muted small d-block fw-bold">Reported Problem Description</span>
                      <p className="mb-0 text-dark">{trackedTicket.complaintDescription}</p>
                    </div>

                    {/* Technician Diagnosis & Repair */}
                    {trackedTicket.diagnosisNotes && (
                      <div className="mb-4 p-3 rounded-3" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                        <h6 className="fw-bold text-success mb-2">Technician Resolution Evidence</h6>
                        <p className="mb-1 text-dark"><strong>Diagnosis:</strong> {trackedTicket.diagnosisNotes}</p>
                        <p className="mb-1 text-dark"><strong>Resolution:</strong> {trackedTicket.resolutionNotes}</p>
                        {trackedTicket.testingResults && (
                          <p className="mb-0 text-dark"><strong>Testing Results:</strong> {trackedTicket.testingResults}</p>
                        )}
                      </div>
                    )}

                    {/* Customer Confirmation / Sign-Off Area */}
                    {trackedTicket.status === 'RESOLVED' && (
                      <div className="border border-warning rounded-3 p-4 bg-light">
                        <h5 className="fw-bold text-dark mb-2">Action Required: Customer Satisfaction Sign-Off</h5>
                        <p className="small text-muted mb-3">
                          Our technician has completed on-site repairs. Please verify that your solar generation is active, then confirm resolution below to formally close this ticket.
                        </p>

                        {confirmSuccess ? (
                          <div className="alert alert-success mb-0">
                            ✓ Thank you! Customer confirmation recorded and ticket has been closed.
                          </div>
                        ) : (
                          <div className="row g-2">
                            <div className="col-md-6">
                              <label className="form-label small fw-semibold">Signee Name</label>
                              <input
                                type="text"
                                value={signOffName}
                                onChange={(e) => setSignOffName(e.target.value)}
                                className="form-control form-control-sm"
                              />
                            </div>
                            <div className="col-md-12">
                              <label className="form-label small fw-semibold">Confirmation Remarks</label>
                              <input
                                type="text"
                                value={signOffNotes}
                                onChange={(e) => setSignOffNotes(e.target.value)}
                                className="form-control form-control-sm"
                              />
                            </div>
                            <div className="col-12 mt-3">
                              <button
                                type="button"
                                disabled={confirming}
                                onClick={handleConfirmResolution}
                                className="tp-btn tp-btn-theme"
                                style={{ padding: '10px 24px', borderRadius: '20px' }}
                              >
                                {confirming ? 'Recording Confirmation...' : 'Confirm Solar Restoration & Close Ticket'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {trackedTicket.status === 'CLOSED' && (
                      <div className="alert alert-success mb-0 text-center">
                        ✓ This ticket was confirmed by customer and closed on {trackedTicket.customerConfirmedAt || 'record'}.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComplaintArea;
