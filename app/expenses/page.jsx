"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Receipt, Plus, Pencil, Trash2, Check, Tags } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fmtTL, todayISO } from "@/lib/format";
import AppShell from "@/components/AppShell";
import { ViewHeader, Empty, Modal, Field } from "@/components/UI";

const emptyExpense = () => ({ title: "", category: "", amount: "", date: todayISO(), note: "" });
const emptyCategory = () => ({ name: "", color: "#3E97FF" });
const RENK_SECENEKLERI = ["#3E97FF", "#50cd89", "#ffc700", "#f1416c", "#7239ea", "#e4626f", "#17a2b8", "#6f42c1", "#B08968"];

export default function ExpensesPage() {
  const supabase = createClient();
  const [tab, setTab] = useState("giderler");
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editingCat, setEditingCat] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const load = async () => {
    const [{ data: e }, { data: c }] = await Promise.all([
      supabase.from("expenses").select("*").order("date", { ascending: false }),
      supabase.from("expense_categories").select("*").order("name"),
    ]);
    setExpenses(e || []);
    setCategories(c || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const colorFor = (categoryName) => categories.find((c) => c.name === categoryName)?.color || "#99A1B7";

  const save = async (exp) => {
    const payload = { ...exp, amount: Number(exp.amount) || 0 };
    if (exp.id) {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("expenses").update(rest).eq("id", id);
      if (error) { notify("Hata: " + error.message); return; }
      notify("Gider güncellendi");
    } else {
      const { error } = await supabase.from("expenses").insert([payload]);
      if (error) { notify("Hata: " + error.message); return; }
      notify("Gider eklendi");
    }
    setEditing(null);
    load();
  };

  const remove = async (id) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) { notify("Hata: " + error.message); return; }
    notify("Gider silindi");
    load();
  };

  const saveCategory = async (cat) => {
    if (cat.id) {
      const { id, ...rest } = cat;
      const { error } = await supabase.from("expense_categories").update(rest).eq("id", id);
      if (error) { notify("Hata: " + error.message); return; }
      notify("Kategori güncellendi");
    } else {
      const { error } = await supabase.from("expense_categories").insert([cat]);
      if (error) { notify("Hata: " + (error.message.includes("duplicate") ? "Bu kategori zaten var" : error.message)); return; }
      notify("Kategori eklendi");
    }
    setEditingCat(null);
    load();
  };

  const removeCategory = async (id) => {
    const { error } = await supabase.from("expense_categories").delete().eq("id", id);
    if (error) { notify("Hata: " + error.message); return; }
    notify("Kategori silindi");
    load();
  };

  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return (
    <AppShell>
      <ViewHeader
        eyebrow="Gider Kalemleri" title="Giderler"
        desc={loading ? "Yükleniyor…" : `${expenses.length} kayıt — toplam ${fmtTL(total)}`}
        right={tab === "giderler"
          ? <button className="btn btn-primary" onClick={() => setEditing(emptyExpense())}><Plus size={16} className="me-1" />Yeni Gider</button>
          : <button className="btn btn-primary" onClick={() => setEditingCat(emptyCategory())}><Plus size={16} className="me-1" />Yeni Kategori</button>}
      />

      <ul className="nav nav-pills mb-4">
        <li className="nav-item"><button className={`nav-link btn btn-sm ${tab === "giderler" ? "active btn-primary" : "btn-light"}`} onClick={() => setTab("giderler")}>Giderler</button></li>
        <li className="nav-item"><button className={`nav-link btn btn-sm ${tab === "kategoriler" ? "active btn-primary" : "btn-light"}`} onClick={() => setTab("kategoriler")}>Kategoriler</button></li>
      </ul>

      {tab === "giderler" ? (
        !loading && expenses.length === 0 ? (
          <div className="card card-flush"><div className="card-body"><Empty icon={Receipt} title="Henüz gider kaydı yok" desc="Örn. akaryakıt, kira, personel gideri gibi kalemleri buradan ekleyin." /></div></div>
        ) : (
          <div className="card card-flush">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-row-dashed table-row-gray-300 align-middle gy-3 mb-0">
                  <thead><tr className="text-muted fs-8 text-uppercase"><th className="ps-6">Gider</th><th>Kategori</th><th>Tutar</th><th>Tarih</th><th>Not</th><th className="pe-6"></th></tr></thead>
                  <tbody>
                    {expenses.map((e) => (
                      <tr key={e.id}>
                        <td className="ps-6 fw-semibold">{e.title}</td>
                        <td>
                          {e.category ? (
                            <span className="badge" style={{ background: `${colorFor(e.category)}22`, color: colorFor(e.category) }}>
                              <span className="cat-dot" style={{ background: colorFor(e.category) }} />{e.category}
                            </span>
                          ) : <span className="text-muted">—</span>}
                        </td>
                        <td>{fmtTL(e.amount)}</td>
                        <td className="text-muted">{e.date}</td>
                        <td className="text-muted">{e.note || "—"}</td>
                        <td className="pe-6 text-end">
                          <button className="btn btn-icon btn-sm btn-light me-2" onClick={() => setEditing(e)}><Pencil size={14} /></button>
                          <button className="btn btn-icon btn-sm btn-light-danger" onClick={() => remove(e.id)}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : (
        !loading && categories.length === 0 ? (
          <div className="card card-flush"><div className="card-body"><Empty icon={Tags} title="Henüz kategori tanımlanmadı" desc="Sağ üstten ilk gider kategorinizi ekleyin (örn. Ulaşım, Kira, Personel)." /></div></div>
        ) : (
          <div className="card card-flush">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-row-dashed table-row-gray-300 align-middle gy-3 mb-0">
                  <thead><tr className="text-muted fs-8 text-uppercase"><th className="ps-6">Kategori</th><th>Renk</th><th className="pe-6"></th></tr></thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.id}>
                        <td className="ps-6 fw-semibold">
                          <span className="badge" style={{ background: `${c.color}22`, color: c.color }}>
                            <span className="cat-dot" style={{ background: c.color }} />{c.name}
                          </span>
                        </td>
                        <td className="text-muted">{c.color}</td>
                        <td className="pe-6 text-end">
                          <button className="btn btn-icon btn-sm btn-light me-2" onClick={() => setEditingCat(c)}><Pencil size={14} /></button>
                          <button className="btn btn-icon btn-sm btn-light-danger" onClick={() => removeCategory(c.id)}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Gideri Düzenle" : "Yeni Gider"}>
          <form onSubmit={(e) => { e.preventDefault(); if (!editing.title.trim()) return; save(editing); }}>
            <div className="row g-4">
              <Field label="Gider Adı" span><input className="form-control form-control-solid" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Örn. Akaryakıt" required /></Field>
              <Field label="Kategori">
                <select className="form-select form-select-solid" value={editing.category || ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                  <option value="">Seçiniz…</option>
                  {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Tutar (TL)"><input type="number" min="0" className="form-control form-control-solid" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} placeholder="1000" required /></Field>
              <Field label="Tarih"><input type="date" className="form-control form-control-solid" value={editing.date || ""} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></Field>
              <Field label="Not" span><textarea rows={2} className="form-control form-control-solid" value={editing.note || ""} onChange={(e) => setEditing({ ...editing, note: e.target.value })} placeholder="Opsiyonel" /></Field>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-6">
              <button type="button" className="btn btn-light" onClick={() => setEditing(null)}>Vazgeç</button>
              <button type="submit" className="btn btn-primary"><Check size={15} className="me-1" />Kaydet</button>
            </div>
          </form>
        </Modal>
      )}

      {editingCat && (
        <Modal onClose={() => setEditingCat(null)} title={editingCat.id ? "Kategoriyi Düzenle" : "Yeni Kategori"}>
          <form onSubmit={(e) => { e.preventDefault(); if (!editingCat.name.trim()) return; saveCategory(editingCat); }}>
            <div className="row g-4">
              <Field label="Kategori Adı" span><input className="form-control form-control-solid" value={editingCat.name} onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })} placeholder="Örn. Ulaşım" required /></Field>
              <Field label="Renk" span>
                <div className="color-picker-row">
                  {RENK_SECENEKLERI.map((c) => (
                    <button type="button" key={c} className={`color-swatch ${editingCat.color === c ? "color-swatch-active" : ""}`} style={{ background: c }} onClick={() => setEditingCat({ ...editingCat, color: c })} />
                  ))}
                  <input type="color" value={editingCat.color} onChange={(e) => setEditingCat({ ...editingCat, color: e.target.value })} className="color-custom-input" />
                </div>
              </Field>
            </div>
            <div className="d-flex justify-content-end gap-2 mt-6">
              <button type="button" className="btn btn-light" onClick={() => setEditingCat(null)}>Vazgeç</button>
              <button type="submit" className="btn btn-primary"><Check size={15} className="me-1" />Kaydet</button>
            </div>
          </form>
        </Modal>
      )}
      {toast && <div className="position-fixed bottom-0 start-50 translate-middle-x mb-6 badge badge-light-dark fs-7 py-3 px-4" style={{ zIndex: 1080 }}>{toast}</div>}
    </AppShell>
  );
}
