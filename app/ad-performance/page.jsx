"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { Megaphone, Plus, Pencil, Trash2, Check, Users } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { AYLAR, fmtTL, currentYM } from "@/lib/format";
import AppShell from "@/components/AppShell";
import { ViewHeader, Empty, Modal, Field, StatCard } from "@/components/UI";

const PLATFORMLAR = [
  { key: "google_ads", label: "Google Ads" },
  { key: "meta", label: "Meta Business" },
  { key: "tiktok", label: "TikTok Ads" },
];

const emptyRecord = (customerId, platform) => {
  const { year, month } = currentYM();
  return { customer_id: customerId || "", platform, year, month, amount_spent: "", purchase_value: "", roas: "", add_to_cart_value: "", note: "" };
};

export default function AdPerformancePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [records, setRecords] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [platform, setPlatform] = useState("google_ads");
  const { year, month } = currentYM();
  const [filterYear, setFilterYear] = useState(year);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const load = async () => {
    const [{ data: c }, { data: r }] = await Promise.all([
      supabase.from("customers").select("*").order("name"),
      supabase.from("ad_performance").select("*"),
    ]);
    setCustomers(c || []);
    setRecords(r || []);
    if (!customerId && c && c.length > 0) setCustomerId(c[0].id);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const years = useMemo(() => {
    const s = new Set(records.map((r) => r.year));
    s.add(year);
    return Array.from(s).sort((a, b) => b - a);
  }, [records, year]);

  const customerRecords = records.filter((r) => r.customer_id === customerId && r.platform === platform);
  const thisMonthRecord = customerRecords.find((r) => r.year === year && r.month === month);

  const yearRows = customerRecords.filter((r) => r.year === filterYear).sort((a, b) => a.month - b.month);

  const last6 = useMemo(() => {
    const arr = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const dd = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const y = dd.getFullYear(), m = dd.getMonth() + 1;
      const rec = customerRecords.find((r) => r.year === y && r.month === m);
      arr.push({
        name: `${AYLAR[m - 1].slice(0, 3)} ${String(y).slice(2)}`,
        Harcanan: rec?.amount_spent || 0,
        "Dönüşüm Değeri": rec?.purchase_value || 0,
        ROAS: rec?.roas || 0,
      });
    }
    return arr;
  }, [customerRecords]);

  const save = async (r) => {
    const payload = {
      ...r, year: Number(r.year), month: Number(r.month),
      amount_spent: Number(r.amount_spent) || 0,
      purchase_value: Number(r.purchase_value) || 0,
      roas: Number(r.roas) || 0,
      add_to_cart_value: Number(r.add_to_cart_value) || 0,
    };
    if (r.id) {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("ad_performance").update(rest).eq("id", id);
      if (error) { notify("Hata: " + error.message); return; }
      notify("Kayıt güncellendi");
    } else {
      const { error } = await supabase.from("ad_performance").insert([payload]);
      if (error) { notify("Hata: " + error.message); return; }
      notify("Reklam performansı kaydedildi");
    }
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    const { error } = await supabase.from("ad_performance").delete().eq("id", id);
    if (error) { notify("Hata: " + error.message); return; }
    notify("Kayıt silindi");
    load();
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <AppShell>
      <ViewHeader
        eyebrow="Kanal Bazlı Performans" title="Reklam Performansı"
        desc={loading ? "Yükleniyor…" : "Google Ads, Meta Business ve TikTok reklam performansını müşteri bazında takip edin."}
        right={
          <button className="btn btn-primary" disabled={!customerId} onClick={() => setEditing(emptyRecord(customerId, platform))}>
            <Plus size={16} className="me-1" />Veri Girişi Ekle
          </button>
        }
      />

      {!loading && customers.length === 0 ? (
        <div className="card card-flush"><div className="card-body"><Empty icon={Users} title="Önce müşteri ekleyin" desc="Reklam performansı takibi için en az bir müşteriniz olmalı." /></div></div>
      ) : (
        <>
          <div className="d-flex flex-wrap gap-3 mb-4 align-items-center">
            <select className="form-select form-select-solid w-auto" style={{ minWidth: 220 }} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ul className="nav nav-pills mb-0">
              {PLATFORMLAR.map((p) => (
                <li className="nav-item" key={p.key}>
                  <button className={`nav-link btn btn-sm ${platform === p.key ? "active btn-primary" : "btn-light"}`} onClick={() => setPlatform(p.key)}>{p.label}</button>
                </li>
              ))}
            </ul>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-6 col-md-3"><StatCard label="Bu Ay Harcanan" value={fmtTL(thisMonthRecord?.amount_spent)} icon={Megaphone} accent="warning" /></div>
            <div className="col-6 col-md-3"><StatCard label="Dönüşüm Değeri" value={fmtTL(thisMonthRecord?.purchase_value)} icon={Megaphone} accent="success" /></div>
            <div className="col-6 col-md-3"><StatCard label="ROAS" value={thisMonthRecord?.roas ? `${thisMonthRecord.roas}x` : "—"} icon={Megaphone} accent="primary" /></div>
            <div className="col-6 col-md-3"><StatCard label="Sepete Ekleme" value={fmtTL(thisMonthRecord?.add_to_cart_value)} icon={Megaphone} accent="info" /></div>
          </div>

          <div className="card card-flush mb-4">
            <div className="card-header pt-5"><h3 className="card-title fs-5">Son 6 Ay Trend — {selectedCustomer?.name} / {PLATFORMLAR.find((p) => p.key === platform)?.label}</h3></div>
            <div className="card-body">
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={last6}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                    <Tooltip formatter={(v) => fmtTL(v)} />
                    <Bar dataKey="Harcanan" fill="#ffc700" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Dönüşüm Değeri" fill="#50cd89" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mb-4">
            <select className="form-select form-select-solid w-auto" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {yearRows.length === 0 ? (
            <div className="card card-flush"><div className="card-body"><Empty icon={Megaphone} title="Bu yıla ait kayıt yok" desc="Sağ üstten yeni bir veri girişi ekleyebilirsiniz." /></div></div>
          ) : (
            <div className="card card-flush">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-row-dashed table-row-gray-300 align-middle gy-3 mb-0">
                    <thead>
                      <tr className="text-muted fs-8 text-uppercase">
                        <th className="ps-6">Ay</th><th>Harcanan Tutar</th><th>Dönüşüm Değeri</th><th>ROAS</th><th>Sepete Ekleme</th><th className="pe-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearRows.map((r) => (
                        <tr key={r.id}>
                          <td className="ps-6 fw-semibold">{AYLAR[r.month - 1]}</td>
                          <td>{fmtTL(r.amount_spent)}</td>
                          <td>{fmtTL(r.purchase_value)}</td>
                          <td><span className="badge badge-light-primary">{r.roas}x</span></td>
                          <td className="text-muted">{fmtTL(r.add_to_cart_value)}</td>
                          <td className="pe-6 text-end">
                            <button className="btn btn-icon btn-sm btn-light me-2" onClick={() => setEditing(r)}><Pencil size={14} /></button>
                            <button className="btn btn-icon btn-sm btn-light-danger" onClick={() => remove(r.id)}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Kaydı Düzenle" : "Yeni Reklam Performansı"}>
          <AdPerformanceForm initial={editing} customers={customers} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {toast && <div className="position-fixed bottom-0 start-50 translate-middle-x mb-6 badge badge-light-dark fs-7 py-3 px-4" style={{ zIndex: 1080 }}>{toast}</div>}
    </AppShell>
  );
}

function AdPerformanceForm({ initial, customers, onSave, onCancel }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const calculatedRoas = f.amount_spent > 0 ? (Number(f.purchase_value) / Number(f.amount_spent)).toFixed(2) : "0.00";

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!f.customer_id) return; onSave(f); }}>
      <div className="row g-4">
        <Field label="Müşteri" span>
          <select className="form-select form-select-solid" value={f.customer_id} onChange={set("customer_id")} required>
            <option value="" disabled>Seçiniz…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Platform">
          <select className="form-select form-select-solid" value={f.platform} onChange={set("platform")}>
            {PLATFORMLAR.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </Field>
        <Field label="Ay">
          <select className="form-select form-select-solid" value={f.month} onChange={set("month")}>
            {AYLAR.map((a, i) => <option key={a} value={i + 1}>{a}</option>)}
          </select>
        </Field>
        <Field label="Yıl"><input type="number" className="form-control form-control-solid" value={f.year} onChange={set("year")} /></Field>

        <Field label="Harcanan Tutar (TL)"><input type="number" min="0" className="form-control form-control-solid" value={f.amount_spent} onChange={set("amount_spent")} placeholder="15000" /></Field>
        <Field label="Alışveriş Dönüşüm Değeri (TL)"><input type="number" min="0" className="form-control form-control-solid" value={f.purchase_value} onChange={set("purchase_value")} placeholder="60000" /></Field>
        <Field label="ROAS"><input type="number" min="0" step="0.01" className="form-control form-control-solid" value={f.roas} onChange={set("roas")} placeholder="4.00" /></Field>
        <Field label="Sepete Ekleme Değeri (TL)"><input type="number" min="0" className="form-control form-control-solid" value={f.add_to_cart_value} onChange={set("add_to_cart_value")} placeholder="90000" /></Field>

        <div className="col-12">
          <div className="alert alert-primary fs-7 py-3 mb-0">
            Girdiğiniz Harcanan Tutar / Dönüşüm Değeri'ne göre hesaplanan ROAS: <strong>{calculatedRoas}x</strong> — panele reklam aracından raporladığınız ROAS değerini girebilirsiniz.
          </div>
        </div>

        <Field label="Not" span><input className="form-control form-control-solid" value={f.note || ""} onChange={set("note")} placeholder="Opsiyonel" /></Field>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-6">
        <button type="button" className="btn btn-light" onClick={onCancel}>Vazgeç</button>
        <button type="submit" className="btn btn-primary"><Check size={15} className="me-1" />Kaydet</button>
      </div>
    </form>
  );
}
