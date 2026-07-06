"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Plus, Pencil, Trash2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AYLAR, fmtTL, currentYM } from "@/lib/format";
import AppShell from "@/components/AppShell";
import { ViewHeader, Empty, StatusPill, Modal, Field } from "@/components/UI";

const computeCommission = (ciro, altLimit, commissionPercent) => {
  const fark = Math.max(0, (Number(ciro) || 0) - (Number(altLimit) || 0));
  return Math.round(fark * ((Number(commissionPercent) || 0) / 100));
};

const emptyRecord = (customer) => {
  const { year, month } = currentYM();
  return { customer_id: customer?.id || "", year, month, ciro: "", alt_limit: customer?.alt_limit || 0, commission_percent: customer?.commission_percent || 0, status: "bekliyor", note: "" };
};

export default function RevenuePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [records, setRecords] = useState([]);
  const { year, month } = currentYM();
  const [filterYear, setFilterYear] = useState(year);
  const [filterMonth, setFilterMonth] = useState(month);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const load = async () => {
    const [{ data: c }, { data: r }] = await Promise.all([
      supabase.from("customers").select("*").order("name"),
      supabase.from("revenue_records").select("*"),
    ]);
    setCustomers((c || []).filter((x) => Number(x.commission_percent) > 0));
    setRecords(r || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const years = useMemo(() => {
    const s = new Set(records.map((r) => r.year));
    s.add(year);
    return Array.from(s).sort((a, b) => b - a);
  }, [records, year]);

  const rows = records
    .filter((r) => r.year === filterYear && r.month === filterMonth)
    .sort((a, b) => (customers.find((c) => c.id === a.customer_id)?.name || "").localeCompare(customers.find((c) => c.id === b.customer_id)?.name || ""));

  const save = async (r) => {
    const commission_amount = computeCommission(r.ciro, r.alt_limit, r.commission_percent);
    const payload = { ...r, year: Number(r.year), month: Number(r.month), ciro: Number(r.ciro) || 0, alt_limit: Number(r.alt_limit) || 0, commission_percent: Number(r.commission_percent) || 0, commission_amount };
    if (r.id) {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("revenue_records").update(rest).eq("id", id);
      if (error) { notify("Hata: " + error.message); return; }
      notify("Kayıt güncellendi");
    } else {
      const { error } = await supabase.from("revenue_records").insert([payload]);
      if (error) { notify("Hata: " + error.message); return; }
      notify("Ciro kaydı eklendi");
    }
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    const { error } = await supabase.from("revenue_records").delete().eq("id", id);
    if (error) { notify("Hata: " + error.message); return; }
    notify("Kayıt silindi");
    load();
  };

  const markPaid = (r) => save({ ...r, status: "tahsil_edildi" });

  const totalCommission = rows.reduce((s, r) => s + (Number(r.commission_amount) || 0), 0);
  const totalPending = rows.filter((r) => r.status !== "tahsil_edildi").reduce((s, r) => s + (Number(r.commission_amount) || 0), 0);

  return (
    <AppShell>
      <ViewHeader
        eyebrow="Performans Bazlı Gelir" title="Ciro / Komisyon Hesaplama"
        desc={loading ? "Yükleniyor…" : `${AYLAR[filterMonth - 1]} ${filterYear} — Hesaplanan komisyon: ${fmtTL(totalCommission)} (${fmtTL(totalPending)} bekliyor)`}
        right={<button className="btn btn-primary" disabled={customers.length === 0} onClick={() => setEditing(emptyRecord(customers[0]))}><Plus size={16} className="me-1" />Ciro Girişi Ekle</button>}
      />

      <div className="alert alert-primary fs-7 py-3 mb-4">
        <strong>Formül:</strong> (Reklamlardan Yapılan Ciro − Tanımlanan Alt Limit) × Komisyon % = Hesaplanan Ödeme.
        Alt limit ve komisyon yüzdesi müşteri kartından otomatik gelir; burada dönem bazlı değiştirebilirsiniz.
      </div>

      <div className="d-flex gap-2 mb-4">
        <select className="form-select form-select-solid w-auto" value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
          {AYLAR.map((a, i) => <option key={a} value={i + 1}>{a}</option>)}
        </select>
        <select className="form-select form-select-solid w-auto" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {!loading && customers.length === 0 ? (
        <div className="card card-flush"><div className="card-body"><Empty icon={Calculator} title="Komisyonlu müşteri bulunamadı" desc="Bu ekranda yalnızca Müşteriler kartında Komisyon % alanı 0'dan büyük girilen müşteriler listelenir." /></div></div>
      ) : !loading && rows.length === 0 ? (
        <div className="card card-flush"><div className="card-body"><Empty icon={Calculator} title="Bu döneme ait ciro kaydı yok" desc="Sağ üstten yeni bir ciro girişi ekleyebilirsiniz." /></div></div>
      ) : (
        <div className="card card-flush">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-row-dashed table-row-gray-300 align-middle gy-3 mb-0">
                <thead><tr className="text-muted fs-8 text-uppercase"><th className="ps-6">Müşteri</th><th>Ciro</th><th>Alt Limit</th><th>Komisyon %</th><th>Hesaplanan</th><th>Durum</th><th className="pe-6"></th></tr></thead>
                <tbody>
                  {rows.map((r) => {
                    const c = customers.find((x) => x.id === r.customer_id);
                    return (
                      <tr key={r.id}>
                        <td className="ps-6 fw-semibold">{c ? c.name : "Silinmiş müşteri"}</td>
                        <td>{fmtTL(r.ciro)}</td>
                        <td className="text-muted">{fmtTL(r.alt_limit)}</td>
                        <td className="text-muted">%{r.commission_percent}</td>
                        <td className="fw-semibold">{fmtTL(r.commission_amount)}</td>
                        <td><StatusPill status={r.status === "tahsil_edildi" ? "odendi" : "bekliyor"} /></td>
                        <td className="pe-6 text-end">
                          {r.status !== "tahsil_edildi" && <button className="btn btn-icon btn-sm btn-light-success me-2" title="Tahsil edildi işaretle" onClick={() => markPaid(r)}><Check size={14} /></button>}
                          <button className="btn btn-icon btn-sm btn-light me-2" onClick={() => setEditing(r)}><Pencil size={14} /></button>
                          <button className="btn btn-icon btn-sm btn-light-danger" onClick={() => remove(r.id)}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Ciro Kaydını Düzenle" : "Yeni Ciro Girişi"}>
          <RevenueForm initial={editing} customers={customers} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {toast && <div className="position-fixed bottom-0 start-50 translate-middle-x mb-6 badge badge-light-dark fs-7 py-3 px-4" style={{ zIndex: 1080 }}>{toast}</div>}
    </AppShell>
  );
}

function RevenueForm({ initial, customers, onSave, onCancel }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const onCustomerChange = (e) => {
    const cust = customers.find((c) => c.id === e.target.value);
    setF({ ...f, customer_id: e.target.value, alt_limit: cust?.alt_limit || 0, commission_percent: cust?.commission_percent || 0 });
  };

  const preview = computeCommission(f.ciro, f.alt_limit, f.commission_percent);

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!f.customer_id) return; onSave(f); }}>
      <div className="row g-4">
        <Field label="Müşteri" span>
          <select className="form-select form-select-solid" value={f.customer_id} onChange={onCustomerChange} required>
            <option value="" disabled>Seçiniz…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Ay">
          <select className="form-select form-select-solid" value={f.month} onChange={set("month")}>
            {AYLAR.map((a, i) => <option key={a} value={i + 1}>{a}</option>)}
          </select>
        </Field>
        <Field label="Yıl"><input type="number" className="form-control form-control-solid" value={f.year} onChange={set("year")} /></Field>
        <Field label="Reklamlardan Yapılan Ciro (TL)"><input type="number" min="0" className="form-control form-control-solid" value={f.ciro} onChange={set("ciro")} placeholder="4000000" /></Field>
        <Field label="Alt Limit (TL)"><input type="number" min="0" className="form-control form-control-solid" value={f.alt_limit} onChange={set("alt_limit")} placeholder="2000000" /></Field>
        <Field label="Komisyon %"><input type="number" min="0" step="0.1" className="form-control form-control-solid" value={f.commission_percent} onChange={set("commission_percent")} placeholder="2" /></Field>
        <Field label="Durum">
          <select className="form-select form-select-solid" value={f.status} onChange={set("status")}>
            <option value="bekliyor">Bekliyor</option>
            <option value="tahsil_edildi">Tahsil Edildi</option>
          </select>
        </Field>
        <Field label="Not"><input className="form-control form-control-solid" value={f.note || ""} onChange={set("note")} placeholder="Opsiyonel" /></Field>

        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center bg-light-primary rounded p-3">
            <span className="fs-7">Hesaplanan Ödeme</span>
            <strong className="fs-4 text-primary">{fmtTL(preview)}</strong>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-6">
        <button type="button" className="btn btn-light" onClick={onCancel}>Vazgeç</button>
        <button type="submit" className="btn btn-primary"><Check size={15} className="me-1" />Kaydet</button>
      </div>
    </form>
  );
}
