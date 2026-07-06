"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Users, Plus, Pencil, Trash2, Check, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fmtTL, todayISO } from "@/lib/format";
import AppShell from "@/components/AppShell";
import { ViewHeader, Empty, StatusPill, Modal, Field } from "@/components/UI";

const emptyCustomer = () => ({
  name: "", contact: "", phone: "", email: "",
  tax_no: "", sector: "", monthly_fee: "", start_date: todayISO(), status: "aktif", note: "",
  partnership_percent: "", alt_limit: "", commission_percent: "",
});

export default function CustomersPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("hepsi");
  const [toast, setToast] = useState(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const load = async () => {
    const [{ data: c }, { data: s }, { data: p }] = await Promise.all([
      supabase.from("customers").select("*").order("name"),
      supabase.from("sectors").select("*").order("name"),
      supabase.from("payments").select("customer_id, amount, status"),
    ]);
    setCustomers(c || []);
    setSectors(s || []);
    setPayments(p || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const balanceFor = (customerId) =>
    payments.filter((p) => p.customer_id === customerId && p.status !== "odendi").reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const filtered = customers
    .filter((c) => `${c.name} ${c.contact || ""} ${c.sector || ""}`.toLowerCase().includes(query.toLowerCase()))
    .filter((c) => {
      if (filterType === "komisyonlu") return Number(c.commission_percent) > 0;
      if (filterType === "standart") return !(Number(c.commission_percent) > 0);
      return true;
    });

  const save = async (cust) => {
    const payload = {
      ...cust,
      monthly_fee: Number(cust.monthly_fee) || 0,
      partnership_percent: Number(cust.partnership_percent) || 0,
      alt_limit: Number(cust.alt_limit) || 0,
      commission_percent: Number(cust.commission_percent) || 0,
    };
    if (cust.id) {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("customers").update(rest).eq("id", id);
      if (error) { notify("Hata: " + error.message); return; }
      notify("Müşteri güncellendi");
    } else {
      const { error } = await supabase.from("customers").insert([payload]);
      if (error) { notify("Hata: " + error.message); return; }
      notify("Müşteri eklendi");
    }
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) { notify("Hata: " + error.message); return; }
    notify("Müşteri silindi");
    load();
  };

  return (
    <AppShell>
      <ViewHeader
        eyebrow="Cari Yönetimi" title="Müşteriler"
        desc={loading ? "Yükleniyor…" : `${customers.length} kayıtlı müşteri`}
        right={<button className="btn btn-primary" onClick={() => setEditing(emptyCustomer())}><Plus size={16} className="me-1" />Yeni Müşteri</button>}
      />

      <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
        <div className="position-relative" style={{ maxWidth: 340, width: "100%" }}>
          <Search size={15} className="position-absolute top-50 translate-middle-y ms-3 text-muted" />
          <input className="form-control form-control-solid ps-10" placeholder="Müşteri, yetkili veya sektöre göre ara…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <ul className="nav nav-pills">
          {[["hepsi", "Tümü"], ["komisyonlu", "Komisyonlu"], ["standart", "Standart"]].map(([key, label]) => (
            <li className="nav-item" key={key}>
              <button className={`nav-link btn btn-sm ${filterType === key ? "active btn-primary" : "btn-light"}`} onClick={() => setFilterType(key)}>{label}</button>
            </li>
          ))}
        </ul>
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="card card-flush"><div className="card-body"><Empty icon={Users} title="Müşteri bulunamadı" desc="Yeni bir müşteri ekleyerek başlayın." /></div></div>
      ) : (
        <div className="card card-flush">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-row-dashed table-row-gray-300 align-middle gy-3 mb-0">
                <thead>
                  <tr className="text-muted fs-8 text-uppercase">
                    <th className="ps-6">Firma</th><th>Yetkili</th><th>İletişim</th><th>Sektör</th>
                    <th>Aylık Ücret</th><th>Kalan Bakiye</th><th>Durum</th><th className="pe-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const komisyonlu = Number(c.commission_percent) > 0;
                    const bakiye = balanceFor(c.id);
                    return (
                      <tr key={c.id}>
                        <td className="ps-6 fw-semibold">
                          {c.name}
                          {komisyonlu && <span className="badge badge-light-info ms-2" title={`Komisyon %${c.commission_percent}`}>Komisyonlu</span>}
                        </td>
                        <td>{c.contact || "—"}</td>
                        <td className="text-muted">{c.phone || c.email || "—"}</td>
                        <td>{c.sector || "—"}</td>
                        <td>{fmtTL(c.monthly_fee)}</td>
                        <td className={bakiye > 0 ? "text-warning fw-semibold" : "text-muted"}>{fmtTL(bakiye)}</td>
                        <td><StatusPill status={c.status} /></td>
                        <td className="pe-6 text-end">
                          <button className="btn btn-icon btn-sm btn-light me-2" onClick={() => setEditing(c)}><Pencil size={14} /></button>
                          <button className="btn btn-icon btn-sm btn-light-danger" onClick={() => remove(c.id)}><Trash2 size={14} /></button>
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
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Müşteriyi Düzenle" : "Yeni Müşteri"}>
          <CustomerForm initial={editing} sectors={sectors} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {toast && <div className="position-fixed bottom-0 start-50 translate-middle-x mb-6 badge badge-light-dark fs-7 py-3 px-4" style={{ zIndex: 1080 }}>{toast}</div>}
    </AppShell>
  );
}

function CustomerForm({ initial, sectors, onSave, onCancel }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!f.name.trim()) return; onSave(f); }}>
      <div className="row g-4">
        <Field label="Firma Adı" span><input className="form-control form-control-solid" value={f.name} onChange={set("name")} required placeholder="Öz Sarıçam" /></Field>
        <Field label="Yetkili Kişi"><input className="form-control form-control-solid" value={f.contact} onChange={set("contact")} placeholder="Ad Soyad" /></Field>
        <Field label="Sektör">
          <select className="form-select form-select-solid" value={f.sector || ""} onChange={set("sector")}>
            <option value="">Seçiniz…</option>
            {sectors.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Telefon"><input className="form-control form-control-solid" value={f.phone} onChange={set("phone")} placeholder="05xx xxx xx xx" /></Field>
        <Field label="E-posta"><input className="form-control form-control-solid" value={f.email} onChange={set("email")} placeholder="mail@ornek.com" /></Field>
        <Field label="Vergi No"><input className="form-control form-control-solid" value={f.tax_no} onChange={set("tax_no")} /></Field>
        <Field label="Aylık Ücret (TL)"><input type="number" min="0" className="form-control form-control-solid" value={f.monthly_fee} onChange={set("monthly_fee")} placeholder="60000" /></Field>
        <Field label="Başlangıç Tarihi"><input type="date" className="form-control form-control-solid" value={f.start_date || ""} onChange={set("start_date")} /></Field>
        <Field label="Durum">
          <select className="form-select form-select-solid" value={f.status} onChange={set("status")}>
            <option value="aktif">Aktif</option>
            <option value="pasif">Pasif</option>
          </select>
        </Field>

        <div className="col-12"><div className="separator my-2"></div><div className="text-primary fs-8 fw-bold text-uppercase">Ortaklık &amp; Ciro Komisyonu</div></div>

        <Field label="Ortaklık Payı (%)"><input type="number" min="0" max="100" step="0.1" className="form-control form-control-solid" value={f.partnership_percent} onChange={set("partnership_percent")} placeholder="Örn. 10" /></Field>
        <Field label="Ciro Alt Limiti (TL)"><input type="number" min="0" className="form-control form-control-solid" value={f.alt_limit} onChange={set("alt_limit")} placeholder="2000000" /></Field>
        <Field label="Komisyon % (Alt Limit Üstü)"><input type="number" min="0" step="0.1" className="form-control form-control-solid" value={f.commission_percent} onChange={set("commission_percent")} placeholder="2" /></Field>

        <div className="col-12">
          <div className="alert alert-primary fs-7 py-3 mb-0">
            Komisyon % alanına 0'dan büyük bir değer girerseniz, bu müşteri listede <strong>"Komisyonlu"</strong> olarak işaretlenir ve Ciro/Komisyon ekranında seçilebilir hale gelir.
          </div>
        </div>

        <Field label="Not" span><textarea rows={2} className="form-control form-control-solid" value={f.note || ""} onChange={set("note")} placeholder="Opsiyonel not…" /></Field>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-6">
        <button type="button" className="btn btn-light" onClick={onCancel}>Vazgeç</button>
        <button type="submit" className="btn btn-primary"><Check size={15} className="me-1" />Kaydet</button>
      </div>
    </form>
  );
}
