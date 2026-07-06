"use client";

import { X, Inbox } from "lucide-react";

export function Field({ label, children, span }) {
  return (
    <div className={span ? "col-12" : "col-12 col-md-6"}>
      <label className="form-label fs-7 fw-semibold text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}

export function Empty({ icon: Icon = Inbox, title, desc }) {
  return (
    <div className="d-flex flex-column align-items-center text-center py-10 text-muted">
      <Icon size={30} strokeWidth={1.4} className="mb-3" />
      <div className="fw-semibold text-gray-700 fs-6 mb-1">{title}</div>
      <div className="fs-7" style={{ maxWidth: 320 }}>{desc}</div>
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    aktif: { c: "badge-light-success", t: "Aktif" },
    pasif: { c: "badge-light-secondary", t: "Pasif" },
    odendi: { c: "badge-light-success", t: "Ödendi" },
    bekliyor: { c: "badge-light-warning", t: "Bekliyor" },
    gecikti: { c: "badge-light-danger", t: "Gecikti" },
  };
  const m = map[status] || { c: "badge-light-secondary", t: status };
  return <span className={`badge ${m.c}`}>{m.t}</span>;
}

export function ViewHeader({ eyebrow, title, desc, right }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-6">
      <div>
        <div className="text-primary fs-8 fw-bold text-uppercase mb-1">{eyebrow}</div>
        <h1 className="fs-2 fw-bold mb-1">{title}</h1>
        {desc && <div className="text-muted fs-7">{desc}</div>}
      </div>
      {right}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, accent = "primary" }) {
  return (
    <div className="card card-flush h-100">
      <div className="card-body py-4">
        <div className={`text-${accent} mb-2`}>
          <Icon size={17} strokeWidth={2} />
        </div>
        <div className="fs-2 fw-bold">{value}</div>
        <div className="text-muted fs-8 mt-1">{label}</div>
      </div>
    </div>
  );
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title fs-5">{title}</h3>
            <button type="button" className="btn btn-sm btn-icon btn-light" onClick={onClose}><X size={16} /></button>
          </div>
          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>
  );
}
