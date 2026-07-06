"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AYLAR, fmtTL, currentYM } from "@/lib/format";
import AppShell from "@/components/AppShell";
import { ViewHeader, StatCard, Empty } from "@/components/UI";

export default function AccountingPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [revenueRecords, setRevenueRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const { year, month } = currentYM();
  const [filterYear, setFilterYear] = useState(year);
  const [filterMonth, setFilterMonth] = useState(month);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: p }, { data: r }, { data: e }] = await Promise.all([
        supabase.from("customers").select("*"),
        supabase.from("payments").select("*"),
        supabase.from("revenue_records").select("*"),
        supabase.from("expenses").select("*"),
      ]);
      setCustomers(c || []);
      setPayments(p || []);
      setRevenueRecords(r || []);
      setExpenses(e || []);
      setLoading(false);
    })();
  }, []);

  const years = useMemo(() => {
    const s = new Set([...payments.map((p) => p.year), ...revenueRecords.map((r) => r.year), ...expenses.map((e) => Number(e.date?.slice(0, 4))).filter(Boolean)]);
    s.add(year);
    return Array.from(s).sort((a, b) => b - a);
  }, [payments, revenueRecords, expenses, year]);

  const gelirPayments = payments.filter((p) => p.year === filterYear && p.month === filterMonth && p.status === "odendi");
  const gelirKomisyon = revenueRecords.filter((r) => r.year === filterYear && r.month === filterMonth && r.status === "tahsil_edildi");
  const giderler = expenses.filter((e) => { if (!e.date) return false; const d = new Date(e.date); return d.getFullYear() === filterYear && d.getMonth() + 1 === filterMonth; });

  const toplamGelirOdeme = gelirPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const toplamGelirKomisyon = gelirKomisyon.reduce((s, r) => s + (Number(r.commission_amount) || 0), 0);
  const toplamGelir = toplamGelirOdeme + toplamGelirKomisyon;
  const toplamGider = giderler.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const net = toplamGelir - toplamGider;

  return (
    <AppShell>
      <ViewHeader eyebrow="Finansal Özet" title="Muhasebe" desc={loading ? "Yükleniyor…" : `${AYLAR[filterMonth - 1]} ${filterYear} gelir / gider tablosu`} />

      <div className="d-flex gap-2 mb-4">
        <select className="form-select form-select-solid w-auto" value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
          {AYLAR.map((a, i) => <option key={a} value={i + 1}>{a}</option>)}
        </select>
        <select className="form-select form-select-solid w-auto" value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-6 col-md-3"><StatCard label="Toplam Gelir" value={fmtTL(toplamGelir)} icon={TrendingUp} accent="success" /></div>
        <div className="col-6 col-md-3"><StatCard label="Toplam Gider" value={fmtTL(toplamGider)} icon={TrendingDown} accent="warning" /></div>
        <div className="col-6 col-md-3"><StatCard label="Net" value={fmtTL(net)} icon={Scale} accent={net >= 0 ? "info" : "danger"} /></div>
        <div className="col-6 col-md-3"><StatCard label="Komisyon Geliri" value={fmtTL(toplamGelirKomisyon)} icon={BookOpen} accent="primary" /></div>
      </div>

      <div className="card card-flush mb-4">
        <div className="card-header pt-5"><h3 className="card-title fs-5">Gelir — Müşteri Ödemeleri</h3></div>
        <div className="card-body pt-0">
          {gelirPayments.length === 0 ? (
            <Empty icon={TrendingUp} title="Bu dönemde tahsil edilen ödeme yok" desc="Ödemeler ekranından ödeme işaretleyin." />
          ) : (
            <div className="table-responsive">
              <table className="table table-row-dashed table-row-gray-300 align-middle gy-3 mb-0">
                <thead><tr className="text-muted fs-8 text-uppercase"><th>Müşteri</th><th>Tutar</th><th>Ödeme Tarihi</th></tr></thead>
                <tbody>
                  {gelirPayments.map((p) => {
                    const c = customers.find((x) => x.id === p.customer_id);
                    return (<tr key={p.id}><td>{c ? c.name : "—"}</td><td>{fmtTL(p.amount)}</td><td className="text-muted">{p.paid_date || "—"}</td></tr>);
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card card-flush mb-4">
        <div className="card-header pt-5"><h3 className="card-title fs-5">Gelir — Ciro Üstü Komisyon</h3></div>
        <div className="card-body pt-0">
          {gelirKomisyon.length === 0 ? (
            <Empty icon={TrendingUp} title="Bu dönemde tahsil edilen komisyon yok" desc="Ciro / Komisyon Hesaplama ekranından tahsil edildi işaretleyin." />
          ) : (
            <div className="table-responsive">
              <table className="table table-row-dashed table-row-gray-300 align-middle gy-3 mb-0">
                <thead><tr className="text-muted fs-8 text-uppercase"><th>Müşteri</th><th>Ciro</th><th>Komisyon</th></tr></thead>
                <tbody>
                  {gelirKomisyon.map((r) => {
                    const c = customers.find((x) => x.id === r.customer_id);
                    return (<tr key={r.id}><td>{c ? c.name : "—"}</td><td className="text-muted">{fmtTL(r.ciro)}</td><td>{fmtTL(r.commission_amount)}</td></tr>);
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card card-flush">
        <div className="card-header pt-5"><h3 className="card-title fs-5">Gider Kalemleri</h3></div>
        <div className="card-body pt-0">
          {giderler.length === 0 ? (
            <Empty icon={TrendingDown} title="Bu dönemde gider kaydı yok" desc="Giderler ekranından ekleyebilirsiniz." />
          ) : (
            <div className="table-responsive">
              <table className="table table-row-dashed table-row-gray-300 align-middle gy-3 mb-0">
                <thead><tr className="text-muted fs-8 text-uppercase"><th>Gider</th><th>Kategori</th><th>Tutar</th><th>Tarih</th></tr></thead>
                <tbody>
                  {giderler.map((e) => (<tr key={e.id}><td className="fw-semibold">{e.title}</td><td className="text-muted">{e.category || "—"}</td><td>{fmtTL(e.amount)}</td><td className="text-muted">{e.date}</td></tr>))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
