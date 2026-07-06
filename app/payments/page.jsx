"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { Users, Wallet, Plus, Pencil, Trash2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AYLAR, fmtTL, todayISO, currentYM } from "@/lib/format";
import AppShell from "@/components/AppShell";
import { ViewHeader, Empty, StatusPill, Modal, Field } from "@/components/UI";

const emptyPayment = (customer) => {
  const { year, month } = currentYM();
  return { customer_id: customer?.id || "", year, month, amount: customer?.monthly_fee || "", payment_type: "tam", status: "bekliyor", paid_date: "", note: "" };
};

export default function PaymentsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const { year, month } = currentYM();
  const [filterYear, setFilterYear] = useState(year);
  const [filterMonth, setFilterMonth] = useState(month);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const load = async () => {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from("customers").select("*").order("name"),
      supabase.from("payments").select("*"),
    ]);
    setCustomers(c || []);
    setPayments(p || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const years = useMemo(() => {
    const s = new Set(payments.map((p) => p.year));
    s.add(year);
    return Array.from(s).sort((a, b) => b - a);
  }, [payments, year]);

  const rows = payments
    .filter((p) => p.year === filterYear && p.month === filterMonth)
    .sort((a, b) => (customers.find((c) => c.id === a.customer_id)?.name || "").localeCompare(customers.find((c) => c.id === b.customer_id)?.name || ""));

  const save = async (p) => {
    const payload = { ...p, year: Number(p.year), month: Number(p.month), amount: Number(p.amount) || 0 };
    if (p.id) {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("payments").update(rest).eq("id", id);
      if (error) { notify("Hata: " + error.message); return; }
      notify("Ödeme güncellendi");
    } else {
      const { error } = await supabase.from("payments").insert([payload]);
      if (error) { notify("Hata: " + error.message); return; }
      notify("Ödeme kaydedildi");
    }
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) { notify("Hata: " + error.message); return; }
    notify("Ödeme kaydı silindi");
    load();
  };

  const markPaid = (p) => save({ ...p, status: "odendi", paid_date: p.paid_date || todayISO() });

  const total = rows.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalPaid = rows.filter((p) => p.status === "odendi").reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return (
    <AppShell>
      <ViewHeader
        eyebrow="Tahsilat Takibi" title="Ödemeler"
        desc={loading ? "Yükleniyor…" : `${AYLAR[filterMonth - 1]} ${filterYear} — ${fmtTL(totalPaid)} / ${fmtTL(total)} tahsil edildi`}
        right={<button className="btn btn-primary" disabled={customers.length === 0} onClick={() => setEditing(emptyPayment(customers[0]))}><Plus size={16} className="me-1" />Ödeme Ekle</button>}
      />

      <div className="d-flex gap-2 mb-4">
        <select className="form-select form-select-solid w-auto" value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
          {AYLAR.map((a, i) => <option key={a} value={i + 1}>{a}</option>)}
        </select>
        <select className="form-select form-select-solid w-auto" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {!loading && customers.length === 0 ? (
        <div className="card card-flush"><div className="card-body"><Empty icon={Users} title="Önce müşteri ekleyin" desc="Ödeme kaydı oluşturmak için en az bir müşteriniz olmalı." /></div></div>
      ) : !loading && rows.length === 0 ? (
        <div className="card card-flush"><div className="card-body"><Empty icon={Wallet} title="Bu döneme ait ödeme yok" desc="Sağ üstten yeni bir ödeme kaydı ekleyebilirsiniz." /></div></div>
      ) : (
        <div className="card card-flush">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-row-dashed table-row-gray-300 align-middle gy-3 mb-0">
                <thead><tr className="text-muted fs-8 text-uppercase"><th className="ps-6">Müşteri</th><th>Tip</th><th>Tutar</th><th>Durum</th><th>Ödeme Tarihi</th><th>Not</th><th className="pe-6"></th></tr></thead>
                <tbody>
                  {rows.map((p) => {
                    const c = customers.find((x) => x.id === p.customer_id);
                    return (
                      <tr key={p.id}>
                        <td className="ps-6 fw-semibold">{c ? c.name : "Silinmiş müşteri"}</td>
                        <td className="text-muted">{p.payment_type === "kismi" ? "Kısmi" : "Tam"}</td>
                        <td>{fmtTL(p.amount)}</td>
                        <td><StatusPill status={p.status} /></td>
                        <td className="text-muted">{p.paid_date || "—"}</td>
                        <td className="text-muted">{p.note || "—"}</td>
                        <td className="pe-6 text-end">
                          {p.status !== "odendi" && <button className="btn btn-icon btn-sm btn-light-success me-2" title="Ödendi olarak işaretle" onClick={() => markPaid(p)}><Check size={14} /></button>}
                          <button className="btn btn-icon btn-sm btn-light me-2" onClick={() => setEditing(p)}><Pencil size={14} /></button>
                          <button className="btn btn-icon btn-sm btn-light-danger" onClick={() => remove(p.id)}><Trash2 size={14} /></button>
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
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Ödemeyi Düzenle" : "Yeni Ödeme"}>
          <PaymentForm initial={editing} customers={customers} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {toast && <div className="position-fixed bottom-0 start-50 translate-middle-x mb-6 badge badge-light-dark fs-7 py-3 px-4" style={{ zIndex: 1080 }}>{toast}</div>}
    </AppShell>
  );
}

function PaymentForm({ initial, customers, onSave, onCancel }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const selectedCustomer = customers.find((c) => c.id === f.customer_id);

  const onCustomerChange = (e) => {
    const cust = customers.find((c) => c.id === e.target.value);
    setF({ ...f, customer_id: e.target.value, amount: f.payment_type === "kismi" ? f.amount : (cust?.monthly_fee || "") });
  };

  const onPaymentTypeChange = (type) => {
    setF({ ...f, payment_type: type, amount: type === "tam" ? (selectedCustomer?.monthly_fee || f.amount) : f.amount });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!f.customer_id) return; onSave(f); }}>
      <div className="row g-4">
        <Field label="Müşteri" span>
          <select className="form-select form-select-solid" value={f.customer_id} onChange={onCustomerChange} required>
            <option value="" disabled>Seçiniz…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field label="Ödeme Tipi" span>
          <div className="d-flex flex-column gap-2">
            <label className={`payment-type-option ${f.payment_type !== "kismi" ? "payment-type-option-active" : ""}`}>
              <input type="radio" name="payment_type" checked={f.payment_type !== "kismi"} onChange={() => onPaymentTypeChange("tam")} />
              Tam Ödeme (Anlaşma Tutarı{selectedCustomer ? `: ${fmtTL(selectedCustomer.monthly_fee)}` : ""})
            </label>
            <label className={`payment-type-option ${f.payment_type === "kismi" ? "payment-type-option-active" : ""}`}>
              <input type="radio" name="payment_type" checked={f.payment_type === "kismi"} onChange={() => onPaymentTypeChange("kismi")} />
              Kısmi Ödeme
            </label>
          </div>
        </Field>

        <Field label="Ay">
          <select className="form-select form-select-solid" value={f.month} onChange={set("month")}>
            {AYLAR.map((a, i) => <option key={a} value={i + 1}>{a}</option>)}
          </select>
        </Field>
        <Field label="Yıl"><input type="number" className="form-control form-control-solid" value={f.year} onChange={set("year")} /></Field>
        <Field label="Tutar (TL)"><input type="number" min="0" className="form-control form-control-solid" value={f.amount} onChange={set("amount")} placeholder="60000" disabled={f.payment_type !== "kismi"} /></Field>
        <Field label="Durum">
          <select className="form-select form-select-solid" value={f.status} onChange={set("status")}>
            <option value="bekliyor">Bekliyor</option>
            <option value="odendi">Ödendi</option>
            <option value="gecikti">Gecikti</option>
          </select>
        </Field>
        <Field label="Ödeme Tarihi"><input type="date" className="form-control form-control-solid" value={f.paid_date || ""} onChange={set("paid_date")} /></Field>
        <Field label="Not" span><input className="form-control form-control-solid" value={f.note || ""} onChange={set("note")} placeholder="Opsiyonel" /></Field>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-6">
        <button type="button" className="btn btn-light" onClick={onCancel}>Vazgeç</button>
        <button type="submit" className="btn btn-primary"><Check size={15} className="me-1" />Kaydet</button>
      </div>
    </form>
  );
}
