"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Video, Plus, Pencil, Trash2, Check, ExternalLink, CalendarPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { todayISO } from "@/lib/format";
import AppShell from "@/components/AppShell";
import { ViewHeader, Empty, Modal, Field } from "@/components/UI";

const emptyMeeting = (customerId) => ({
  customer_id: customerId || "",
  title: "",
  date: todayISO(),
  time: "10:00",
  duration_minutes: 30,
  attendee_email: "",
  meet_link: "",
  status: "planlandi",
  note: "",
});

function buildGoogleCalendarUrl(m) {
  try {
    const timeStr = (m.time || "10:00").toString().slice(0, 5);
    const start = new Date(`${m.date}T${timeStr}:00`);
    if (isNaN(start.getTime())) {
      return "https://calendar.google.com/calendar/render?action=TEMPLATE";
    }
    const end = new Date(start.getTime() + (Number(m.duration_minutes) || 30) * 60000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: m.title || "Dynoops Toplantısı",
      dates: `${fmt(start)}/${fmt(end)}`,
      details: (m.note || "") + "\n\nGoogle Meet eklemek için etkinlik ekranında 'Google Meet video konferansı ekle' butonuna tıklayın, oluşan linki kopyalayıp panele geri yapıştırın.",
    });
    if (m.attendee_email) params.append("add", m.attendee_email);
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch (e) {
    return "https://calendar.google.com/calendar/render?action=TEMPLATE";
  }
}

const statusBadge = (status) => {
  const map = { planlandi: "badge-light-primary", tamamlandi: "badge-light-success", iptal: "badge-light-danger" };
  const label = { planlandi: "Planlandı", tamamlandi: "Tamamlandı", iptal: "İptal" };
  return <span className={`badge ${map[status] || "badge-light-secondary"}`}>{label[status] || status}</span>;
};

export default function MeetingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("yaklasan");
  const [toast, setToast] = useState(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const load = async () => {
    const [{ data: c }, { data: m }] = await Promise.all([
      supabase.from("customers").select("*").order("name"),
      supabase.from("meetings").select("*").order("date", { ascending: true }),
    ]);
    setCustomers(c || []);
    setMeetings(m || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const today = todayISO();
  const filtered = meetings.filter((m) => {
    if (filter === "yaklasan") return m.date >= today && m.status !== "iptal";
    if (filter === "gecmis") return m.date < today || m.status === "tamamlandi";
    return true;
  });

  const save = async (m) => {
    const payload = { ...m, duration_minutes: Number(m.duration_minutes) || 30 };
    if (m.id) {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("meetings").update(rest).eq("id", id);
      if (error) { notify("Hata: " + error.message); return; }
      notify("Toplantı güncellendi");
    } else {
      const { error } = await supabase.from("meetings").insert([payload]);
      if (error) { notify("Hata: " + error.message); return; }
      notify("Toplantı kaydedildi");
    }
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) { notify("Hata: " + error.message); return; }
    notify("Toplantı silindi");
    load();
  };

  return (
    <AppShell>
      <ViewHeader
        eyebrow="Müşteri Görüşmeleri" title="Toplantılar"
        desc={loading ? "Yükleniyor…" : "Google Meet ile müşteri toplantılarınızı planlayın ve takip edin."}
        right={<button className="btn btn-primary" onClick={() => setEditing(emptyMeeting(customers[0]?.id))}><Plus size={16} className="me-1" />Yeni Toplantı</button>}
      />

      <div className="alert alert-primary fs-7 py-3 mb-4">
        <strong>Nasıl çalışır:</strong> Toplantıyı burada oluşturun → "Google Calendar'da Oluştur" ile Calendar'ı hazır bilgilerle açın → Calendar ekranında "Google Meet video konferansı ekle" butonuna tıklayıp oluşan linki kopyalayın → panele dönüp toplantıyı düzenleyip Meet linkini yapıştırın.
      </div>

      <ul className="nav nav-pills mb-4">
        <li className="nav-item"><button className={`nav-link btn btn-sm ${filter === "yaklasan" ? "active btn-primary" : "btn-light"}`} onClick={() => setFilter("yaklasan")}>Yaklaşan</button></li>
        <li className="nav-item"><button className={`nav-link btn btn-sm ${filter === "gecmis" ? "active btn-primary" : "btn-light"}`} onClick={() => setFilter("gecmis")}>Geçmiş</button></li>
        <li className="nav-item"><button className={`nav-link btn btn-sm ${filter === "hepsi" ? "active btn-primary" : "btn-light"}`} onClick={() => setFilter("hepsi")}>Tümü</button></li>
      </ul>

      {!loading && filtered.length === 0 ? (
        <div className="card card-flush"><div className="card-body"><Empty icon={Video} title="Bu filtrede toplantı yok" desc="Sağ üstten yeni bir toplantı oluşturabilirsiniz." /></div></div>
      ) : (
        <div className="card card-flush">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-row-dashed table-row-gray-300 align-middle gy-3 mb-0">
                <thead>
                  <tr className="text-muted fs-8 text-uppercase">
                    <th className="ps-6">Başlık</th><th>Müşteri</th><th>Tarih / Saat</th><th>Durum</th><th>Meet</th><th className="pe-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const c = customers.find((x) => x.id === m.customer_id);
                    return (
                      <tr key={m.id}>
                        <td className="ps-6 fw-semibold">{m.title}</td>
                        <td>{c ? c.name : <span className="text-muted">—</span>}</td>
                        <td className="text-muted">{m.date} {m.time?.slice(0, 5)}</td>
                        <td>{statusBadge(m.status)}</td>
                        <td>
                          {m.meet_link ? (
                            <a href={m.meet_link} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-light-success">
                              <ExternalLink size={13} className="me-1" />Katıl
                            </a>
                          ) : (
                            <a href={buildGoogleCalendarUrl(m)} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-light-primary">
                              <CalendarPlus size={13} className="me-1" />Calendar'da Oluştur
                            </a>
                          )}
                        </td>
                        <td className="pe-6 text-end">
                          <button className="btn btn-icon btn-sm btn-light me-2" onClick={() => setEditing(m)}><Pencil size={14} /></button>
                          <button className="btn btn-icon btn-sm btn-light-danger" onClick={() => remove(m.id)}><Trash2 size={14} /></button>
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
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Toplantıyı Düzenle" : "Yeni Toplantı"}>
          <MeetingForm initial={editing} customers={customers} onSave={save} onCancel={() => setEditing(null)} />
        </Modal>
      )}
      {toast && <div className="position-fixed bottom-0 start-50 translate-middle-x mb-6 badge badge-light-dark fs-7 py-3 px-4" style={{ zIndex: 1080 }}>{toast}</div>}
    </AppShell>
  );
}

function MeetingForm({ initial, customers, onSave, onCancel }) {
  const [f, setF] = useState({ ...initial, time: (initial.time || "10:00").toString().slice(0, 5) });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const onCustomerChange = (e) => {
    const cust = customers.find((c) => c.id === e.target.value);
    setF({ ...f, customer_id: e.target.value, attendee_email: cust?.email || f.attendee_email });
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!f.title.trim()) return; onSave(f); }}>
      <div className="row g-4">
        <Field label="Başlık" span><input className="form-control form-control-solid" value={f.title} onChange={set("title")} placeholder="Örn. Öz Sarıçam - Aylık Değerlendirme" required /></Field>
        <Field label="Müşteri">
          <select className="form-select form-select-solid" value={f.customer_id} onChange={onCustomerChange}>
            <option value="">Seçiniz…</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Katılımcı E-postası"><input type="email" className="form-control form-control-solid" value={f.attendee_email || ""} onChange={set("attendee_email")} placeholder="musteri@ornek.com" /></Field>
        <Field label="Tarih"><input type="date" className="form-control form-control-solid" value={f.date} onChange={set("date")} /></Field>
        <Field label="Saat"><input type="time" className="form-control form-control-solid" value={f.time} onChange={set("time")} /></Field>
        <Field label="Süre (dakika)"><input type="number" min="5" step="5" className="form-control form-control-solid" value={f.duration_minutes} onChange={set("duration_minutes")} /></Field>
        <Field label="Durum">
          <select className="form-select form-select-solid" value={f.status} onChange={set("status")}>
            <option value="planlandi">Planlandı</option>
            <option value="tamamlandi">Tamamlandı</option>
            <option value="iptal">İptal</option>
          </select>
        </Field>
        <Field label="Google Meet Linki" span>
          <input className="form-control form-control-solid" value={f.meet_link || ""} onChange={set("meet_link")} placeholder="https://meet.google.com/xxx-xxxx-xxx" />
        </Field>
        <Field label="Not" span><textarea rows={2} className="form-control form-control-solid" value={f.note || ""} onChange={set("note")} placeholder="Opsiyonel gündem/not" /></Field>

        <div className="col-12">
          <a href={buildGoogleCalendarUrl(f)} target="_blank" rel="noopener noreferrer" className="btn btn-light-primary btn-sm">
            <CalendarPlus size={14} className="me-1" />Google Calendar'da Oluştur (Meet linki almak için)
          </a>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-6">
        <button type="button" className="btn btn-light" onClick={onCancel}>Vazgeç</button>
        <button type="submit" className="btn btn-primary"><Check size={15} className="me-1" />Kaydet</button>
      </div>
    </form>
  );
}
