"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Tags, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import { ViewHeader, Empty } from "@/components/UI";

export default function SectorsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [sectors, setSectors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [name, setName] = useState("");
  const [toast, setToast] = useState(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const load = async () => {
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from("sectors").select("*").order("name"),
      supabase.from("customers").select("id, sector, status"),
    ]);
    setSectors(s || []);
    setCustomers(c || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addSector = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const { error } = await supabase.from("sectors").insert([{ name: trimmed }]);
    if (error) { notify("Hata: " + (error.message.includes("duplicate") ? "Bu sektör zaten var" : error.message)); return; }
    setName("");
    notify("Sektör eklendi");
    load();
  };

  const removeSector = async (id) => {
    const { error } = await supabase.from("sectors").delete().eq("id", id);
    if (error) { notify("Hata: " + error.message); return; }
    notify("Sektör silindi");
    load();
  };

  const activeCustomers = customers.filter((c) => c.status === "aktif");
  const total = activeCustomers.length || 1;
  const distribution = sectors.map((s) => {
    const count = activeCustomers.filter((c) => c.sector === s.name).length;
    return { ...s, count, percent: Math.round((count / total) * 100) };
  });

  return (
    <AppShell>
      <ViewHeader eyebrow="Tanımlar" title="Sektörler" desc={loading ? "Yükleniyor…" : `${sectors.length} tanımlı sektör`} />

      <div className="card card-flush mb-4">
        <div className="card-header pt-5"><h3 className="card-title fs-5">Yeni Sektör Ekle</h3></div>
        <div className="card-body">
          <form className="d-flex gap-2" onSubmit={addSector}>
            <input className="form-control form-control-solid" value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. E-ticaret, Mobilya, Gıda…" />
            <button type="submit" className="btn btn-primary text-nowrap"><Plus size={15} className="me-1" />Ekle</button>
          </form>
        </div>
      </div>

      <div className="card card-flush">
        <div className="card-header pt-5"><h3 className="card-title fs-5">Sektöre Göre Aktif Müşteri Dağılımı</h3></div>
        <div className="card-body">
          {sectors.length === 0 && !loading ? (
            <Empty icon={Tags} title="Henüz sektör tanımlanmadı" desc="Yukarıdan ilk sektörünüzü ekleyin." />
          ) : (
            distribution.map((s) => (
              <div className="sector-row" key={s.id}>
                <div className="fs-7 fw-semibold">{s.name}</div>
                <div className="progress h-6px">
                  <div className="progress-bar bg-primary" style={{ width: `${s.percent}%` }} />
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-7">{s.percent}% <span className="text-muted">({s.count})</span></span>
                  <button className="btn btn-icon btn-sm btn-light-danger" onClick={() => removeSector(s.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {toast && <div className="position-fixed bottom-0 start-50 translate-middle-x mb-6 badge badge-light-dark fs-7 py-3 px-4" style={{ zIndex: 1080 }}>{toast}</div>}
    </AppShell>
  );
}
