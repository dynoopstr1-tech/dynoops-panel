"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { Building2, TrendingUp, Wallet, AlertCircle, Check } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { AYLAR, fmtTL, currentYM } from "@/lib/format";
import AppShell from "@/components/AppShell";
import { ViewHeader, StatCard, Empty, StatusPill } from "@/components/UI";

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: p }, { data: s }, { data: ex }, { data: ec }] = await Promise.all([
        supabase.from("customers").select("*"),
        supabase.from("payments").select("*"),
        supabase.from("sectors").select("*").order("name"),
        supabase.from("expenses").select("*"),
        supabase.from("expense_categories").select("*"),
      ]);
      setCustomers(c || []);
      setPayments(p || []);
      setSectors(s || []);
      setExpenses(ex || []);
      setExpenseCategories(ec || []);
      setLoading(false);
    })();
  }, []);

  const { year, month } = currentYM();

  const activeCustomers = customers.filter((c) => c.status === "aktif");
  const monthlyRecurring = activeCustomers.reduce((s, c) => s + (Number(c.monthly_fee) || 0), 0);

  const thisMonthPayments = payments.filter((p) => p.year === year && p.month === month);
  const collected = thisMonthPayments.filter((p) => p.status === "odendi").reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const pending = thisMonthPayments.filter((p) => p.status !== "odendi").reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const last6 = useMemo(() => {
    const arr = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const dd = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const y = dd.getFullYear(), m = dd.getMonth() + 1;
      const rows = payments.filter((p) => p.year === y && p.month === m);
      const odendi = rows.filter((p) => p.status === "odendi").reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const bekliyor = rows.filter((p) => p.status !== "odendi").reduce((s, p) => s + (Number(p.amount) || 0), 0);
      arr.push({ name: `${AYLAR[m - 1].slice(0, 3)} ${String(y).slice(2)}`, Ödendi: odendi, Bekleyen: bekliyor });
    }
    return arr;
  }, [payments]);

  const overdue = payments.filter((p) => p.status === "gecikti");

  const sectorTotal = activeCustomers.length || 1;
  const sectorDistribution = sectors.map((s) => {
    const count = activeCustomers.filter((c) => c.sector === s.name).length;
    return { ...s, count, percent: Math.round((count / sectorTotal) * 100) };
  }).filter((s) => s.count > 0).sort((a, b) => b.count - a.count);

  const thisMonthExpenses = expenses.filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
  const expenseByCategory = expenseCategories.map((cat) => {
    const total = thisMonthExpenses.filter((e) => e.category === cat.name).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return { name: cat.name, value: total, color: cat.color };
  }).filter((c) => c.value > 0);
  const totalExpenseThisMonth = expenseByCategory.reduce((s, c) => s + c.value, 0);

  if (loading) {
    return (
      <AppShell>
        <div className="d-flex justify-content-center py-20">
          <div className="spinner-border text-primary" role="status" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ViewHeader eyebrow="Genel Bakış" title="Aylık Gelir Tablosu" desc={`${AYLAR[month - 1]} ${year} performans özeti`} />

      <div className="row g-4 mb-4">
        <div className="col-6 col-md-3"><StatCard label="Aktif Müşteri" value={activeCustomers.length} icon={Building2} accent="primary" /></div>
        <div className="col-6 col-md-3"><StatCard label="Aylık Sabit Gelir" value={fmtTL(monthlyRecurring)} icon={TrendingUp} accent="info" /></div>
        <div className="col-6 col-md-3"><StatCard label={`${AYLAR[month - 1]} Tahsilat`} value={fmtTL(collected)} icon={Wallet} accent="success" /></div>
        <div className="col-6 col-md-3"><StatCard label="Bekleyen Ödeme" value={fmtTL(pending)} icon={AlertCircle} accent="warning" /></div>
      </div>

      <div className="card card-flush mb-4">
        <div className="card-header pt-5"><h3 className="card-title fs-5">Son 6 Ay — Tahsilat / Bekleyen</h3></div>
        <div className="card-body">
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={last6} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                <Tooltip formatter={(v) => fmtTL(v)} />
                <Bar dataKey="Ödendi" stackId="a" fill="#50cd89" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Bekleyen" stackId="a" fill="#ffc700" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card card-flush mb-4">
        <div className="card-header pt-5"><h3 className="card-title fs-5">Bu Ay Gider Dağılımı</h3></div>
        <div className="card-body">
          {expenseByCategory.length === 0 ? (
            <Empty icon={Wallet} title="Bu ay gider kaydı yok" desc="Giderler ekranından kategori tanımlayıp gider ekleyin." />
          ) : (
            <div className="d-flex flex-wrap align-items-center gap-6">
              <div style={{ width: 180, height: 180, flexShrink: 0 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {expenseByCategory.map((c, i) => <Cell key={i} fill={c.color} stroke="none" />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtTL(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-grow-1" style={{ minWidth: 200 }}>
                {expenseByCategory.map((c) => (
                  <div className="d-flex align-items-center gap-2 fs-7 mb-2" key={c.name}>
                    <span className="cat-dot" style={{ background: c.color }} />
                    <span className="fw-semibold flex-grow-1">{c.name}</span>
                    <span>{fmtTL(c.value)}</span>
                    <span className="text-muted">({Math.round((c.value / totalExpenseThisMonth) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card card-flush mb-4">
        <div className="card-header pt-5"><h3 className="card-title fs-5">Sektöre Göre Müşteri Dağılımı</h3></div>
        <div className="card-body">
          {sectorDistribution.length === 0 ? (
            <Empty icon={Building2} title="Sektör verisi yok" desc="Sektörler ekranından tanım ekleyip müşterilere atayın." />
          ) : (
            sectorDistribution.map((s) => (
              <div className="sector-row" key={s.id}>
                <div className="fs-7 fw-semibold">{s.name}</div>
                <div className="progress h-6px">
                  <div className="progress-bar bg-primary" style={{ width: `${s.percent}%` }} />
                </div>
                <div className="fs-7 text-end">{s.percent}% <span className="text-muted">({s.count})</span></div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card card-flush">
        <div className="card-header pt-5"><h3 className="card-title fs-5">Geciken Ödemeler</h3></div>
        <div className="card-body pt-0">
          {overdue.length === 0 ? (
            <Empty icon={Check} title="Geciken ödeme yok" desc="Tüm ödemeler zamanında ya da bekleme aşamasında." />
          ) : (
            <div className="table-responsive">
              <table className="table table-row-dashed table-row-gray-300 align-middle gy-3">
                <thead><tr className="text-muted fs-8 text-uppercase"><th>Müşteri</th><th>Dönem</th><th>Tutar</th><th>Durum</th></tr></thead>
                <tbody>
                  {overdue.map((p) => {
                    const c = customers.find((x) => x.id === p.customer_id);
                    return (
                      <tr key={p.id}>
                        <td>{c ? c.name : "—"}</td>
                        <td>{AYLAR[p.month - 1]} {p.year}</td>
                        <td>{fmtTL(p.amount)}</td>
                        <td><StatusPill status={p.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
