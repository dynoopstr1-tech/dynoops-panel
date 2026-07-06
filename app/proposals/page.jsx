"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Plus, Trash2, Printer, ChevronRight, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fmtTL, todayISO, uid } from "@/lib/format";
import AppShell from "@/components/AppShell";
import { ViewHeader, Empty, Field } from "@/components/UI";

const defaultProposal = () => ({
  customer_name: "",
  date: todayISO(),
  intro: "Stratejik olarak Reklam Performansını arttırmak için öncelikle yapılması gereken işlemler.",
  bullets: [
    { title: "Trafik Reklamları", text: "Trafik reklamlarıyla birlikte web sitesine tekil kullanıcı işlemi çekmek için kullanılacaktır." },
    { title: "Etkileşim Reklamları", text: "İnstagram Gönderisinin, Keşfet ve Akış olarak reklam alanlarında etkileşimi arttırmak için ve alışverişe dönüşüm pixel olayı için kullanılacaktır." },
    { title: "Erişim Reklamları", text: "Erişim reklamlarıyla daha fazla kişiye gösterim ve erişim alarak müşterilerin ilgisini çekmek amaçlı kullanılacaktır." },
    { title: "Dönüşüm Reklamları", text: "İnternet Sitesinin Alışveriş İşlemleri için kullanılacaktır." },
  ],
  categories: [
    { id: uid(), title: "Etkileşim Reklamları", rows: [{ id: uid(), name: "Gönderi Etkileşimi (Max Aktif 3 Adet)", price: 300, include: true }] },
    { id: uid(), title: "Erişim Reklamları", rows: [{ id: uid(), name: "Gönderi Erişimi", price: 250, include: true }] },
    { id: uid(), title: "Mesaj Reklamları", rows: [{ id: uid(), name: "DM Reklamları (x Adet Kadar)", price: 0, include: false }] },
    { id: uid(), title: "Dönüşüm Reklamları", rows: [
      { id: uid(), name: "Katalogtaki Ürünlerden Dönüşüm (Meta AI)", price: 2000, include: false },
      { id: uid(), name: "Özel Hedef Kitle Dönüşüm", price: 1500, include: false },
      { id: uid(), name: "Hedef Kitle Dönüşüm", price: 750, include: false },
      { id: uid(), name: "Ürün Odaklı Dönüşüm (x Adet Kadar)", price: 250, include: false },
    ]},
    { id: uid(), title: "Google Ads", rows: [
      { id: uid(), name: "Brand", price: 750, include: true },
      { id: uid(), name: "Keyword Sales", price: 750, include: true },
      { id: uid(), name: "Prod Sales", price: 1500, include: true },
      { id: uid(), name: "Kategori Sales (x Kategori Adet Kadar)", price: 1500, include: false },
    ]},
  ],
  pricing_items: [
    { id: uid(), title: "SEO Danışmanlığı", desc: "Web sitenin google ile uyumluluğu, ürün ve sayfalar için seo çalışmaları yapılmaktadır." },
    { id: uid(), title: "Google Ads ve Raporlama", desc: "Google Keyword, Ads, Product Marketing, Re-Marketing reklamlarının oluşturulması, performanslarının sağlanması ve aylık olarak raporlanması yapılmaktadır." },
    { id: uid(), title: "Sosyal Medya Reklamları ve Raporlama", desc: "Sosyal medya hesaplarının kurumsal planlaması ve etkileşim performanslarına göre reklam planlaması yapılmaktadır." },
  ],
  special_price: 60000,
});

export default function ProposalsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const load = async (selectId) => {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from("customers").select("*").order("name"),
      supabase.from("proposals").select("*").order("created_at", { ascending: false }),
    ]);
    setCustomers(c || []);
    setProposals(p || []);
    if (selectId) setActiveId(selectId);
    else if (!activeId && p && p.length > 0) setActiveId(p[0].id);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const active = proposals.find((p) => p.id === activeId) || null;

  const createNew = async () => {
    const { data, error } = await supabase.from("proposals").insert([defaultProposal()]).select().single();
    if (error) { notify("Hata: " + error.message); return; }
    notify("Yeni teklif taslağı oluşturuldu");
    load(data.id);
  };

  const update = async (patch) => {
    setProposals(proposals.map((p) => (p.id === activeId ? { ...p, ...patch } : p)));
    const { error } = await supabase.from("proposals").update(patch).eq("id", activeId);
    if (error) notify("Kaydedilemedi: " + error.message);
  };

  const remove = async (id) => {
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) { notify("Hata: " + error.message); return; }
    notify("Teklif silindi");
    setActiveId(null);
    load();
  };

  return (
    <AppShell>
      <ViewHeader
        eyebrow="Kurumsal Teklif" title="Teklif Oluştur"
        desc="Dynoops teklif şablonuna uygun, yazdırılabilir teklif hazırlayın."
        right={<button className="btn btn-primary" onClick={createNew}><Plus size={16} className="me-1" />Yeni Teklif</button>}
      />

      <div className="row g-4">
        <div className="col-12 col-lg-3">
          <div className="d-flex flex-column gap-2">
            {!loading && proposals.length === 0 && <div className="card card-flush"><div className="card-body"><Empty icon={FileText} title="Henüz teklif yok" desc="“Yeni Teklif” ile başlayın." /></div></div>}
            {proposals.map((p) => (
              <button key={p.id} className={`card card-flush text-start border ${p.id === activeId ? "border-primary" : "border-0"}`} style={{ cursor: "pointer" }} onClick={() => setActiveId(p.id)}>
                <div className="card-body py-3 px-4 d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="fw-semibold fs-7">{p.customer_name || "İsimsiz Teklif"}</div>
                    <div className="text-muted fs-8">{p.date}</div>
                  </div>
                  <ChevronRight size={14} className="text-muted" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-12 col-lg-9">
          {active ? (
            <ProposalEditor key={active.id} proposal={active} customers={customers} onChange={update} onDelete={() => remove(active.id)} />
          ) : (
            <div className="card card-flush"><div className="card-body"><Empty icon={FileText} title="Bir teklif seçin veya oluşturun" desc="Sol taraftan mevcut bir teklifi seçebilir ya da yeni bir tane oluşturabilirsiniz." /></div></div>
          )}
        </div>
      </div>
      {toast && <div className="position-fixed bottom-0 start-50 translate-middle-x mb-6 badge badge-light-dark fs-7 py-3 px-4" style={{ zIndex: 1080 }}>{toast}</div>}
    </AppShell>
  );
}

function ProposalEditor({ proposal, customers, onChange, onDelete }) {
  const [tab, setTab] = useState("duzenle");

  const dailyTotal = proposal.categories.reduce((sum, cat) => sum + cat.rows.filter((r) => r.include).reduce((s, r) => s + (Number(r.price) || 0), 0), 0);
  const setField = (k, v) => onChange({ [k]: v });

  const updateCategory = (catId, patch) => onChange({ categories: proposal.categories.map((c) => (c.id === catId ? { ...c, ...patch } : c)) });
  const updateRow = (catId, rowId, patch) => onChange({ categories: proposal.categories.map((c) => c.id === catId ? { ...c, rows: c.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)) } : c) });
  const addRow = (catId) => onChange({ categories: proposal.categories.map((c) => c.id === catId ? { ...c, rows: [...c.rows, { id: uid(), name: "", price: 0, include: true }] } : c) });
  const removeRow = (catId, rowId) => onChange({ categories: proposal.categories.map((c) => c.id === catId ? { ...c, rows: c.rows.filter((r) => r.id !== rowId) } : c) });
  const addCategory = () => onChange({ categories: [...proposal.categories, { id: uid(), title: "Yeni Kategori", rows: [] }] });
  const removeCategory = (catId) => onChange({ categories: proposal.categories.filter((c) => c.id !== catId) });
  const updatePricingItem = (id, patch) => onChange({ pricing_items: proposal.pricing_items.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const addPricingItem = () => onChange({ pricing_items: [...proposal.pricing_items, { id: uid(), title: "Yeni Kalem", desc: "" }] });
  const removePricingItem = (id) => onChange({ pricing_items: proposal.pricing_items.filter((p) => p.id !== id) });

  return (
    <div className="card card-flush">
      <div className="card-header pt-5 flex-wrap gap-3">
        <ul className="nav nav-pills">
          <li className="nav-item"><button className={`nav-link btn btn-sm ${tab === "duzenle" ? "active btn-primary" : "btn-light"}`} onClick={() => setTab("duzenle")}>Düzenle</button></li>
          <li className="nav-item"><button className={`nav-link btn btn-sm ${tab === "onizleme" ? "active btn-primary" : "btn-light"}`} onClick={() => setTab("onizleme")}>Önizleme</button></li>
        </ul>
        <div className="card-toolbar d-flex gap-2">
          <button className="btn btn-light-danger btn-sm" onClick={onDelete}><Trash2 size={14} className="me-1" />Sil</button>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}><Printer size={14} className="me-1" />Yazdır / PDF</button>
        </div>
      </div>

      <div className="card-body">
        {tab === "duzenle" ? (
          <div className="d-flex flex-column gap-4">
            <div className="row g-4">
              <Field label="Müşteri">
                <input className="form-control form-control-solid" list="customer-names" value={proposal.customer_name} onChange={(e) => setField("customer_name", e.target.value)} placeholder="Firma adı" />
                <datalist id="customer-names">{customers.map((c) => <option key={c.id} value={c.name} />)}</datalist>
              </Field>
              <Field label="Tarih"><input type="date" className="form-control form-control-solid" value={proposal.date} onChange={(e) => setField("date", e.target.value)} /></Field>
              <Field label="Giriş Metni" span><textarea rows={2} className="form-control form-control-solid" value={proposal.intro} onChange={(e) => setField("intro", e.target.value)} /></Field>
            </div>

            <div>
              <div className="text-primary fs-8 fw-bold text-uppercase mb-2">Reklam Kategorileri &amp; Günlük Bütçeler</div>
              <div className="d-flex flex-column gap-3">
                {proposal.categories.map((cat) => (
                  <div className="border rounded p-3" key={cat.id}>
                    <div className="d-flex gap-2 align-items-center mb-2">
                      <input className="form-control form-control-sm border-0 fw-bold px-0" value={cat.title} onChange={(e) => updateCategory(cat.id, { title: e.target.value })} />
                      <button className="btn btn-icon btn-sm btn-light-danger" onClick={() => removeCategory(cat.id)}><Trash2 size={14} /></button>
                    </div>
                    {cat.rows.map((row) => (
                      <div className="d-flex align-items-center gap-2 mb-2" key={row.id}>
                        <input type="checkbox" className="form-check-input" checked={row.include} onChange={(e) => updateRow(cat.id, row.id, { include: e.target.checked })} title="Genel toplama dahil et" />
                        <input className="form-control form-control-sm form-control-solid" value={row.name} onChange={(e) => updateRow(cat.id, row.id, { name: e.target.value })} placeholder="Hizmet adı" />
                        <input className="form-control form-control-sm form-control-solid" style={{ width: 110 }} type="number" value={row.price} onChange={(e) => updateRow(cat.id, row.id, { price: e.target.value })} placeholder="TL" />
                        <button className="btn btn-icon btn-sm btn-light-danger" onClick={() => removeRow(cat.id, row.id)}><Trash2 size={13} /></button>
                      </div>
                    ))}
                    <button className="btn btn-light btn-sm" onClick={() => addRow(cat.id)}><Plus size={13} className="me-1" />Satır Ekle</button>
                  </div>
                ))}
              </div>
              <button className="btn btn-light btn-sm mt-3" onClick={addCategory}><Plus size={14} className="me-1" />Kategori Ekle</button>
            </div>

            <div className="d-flex justify-content-between align-items-center bg-light-primary rounded p-3">
              <span className="fs-7">Günlük Toplam (işaretli kalemler)</span>
              <strong className="fs-4 text-primary">{fmtTL(dailyTotal)}</strong>
            </div>

            <div>
              <div className="text-primary fs-8 fw-bold text-uppercase mb-2">Fiyatlandırma Kalemleri</div>
              <div className="d-flex flex-column gap-3">
                {proposal.pricing_items.map((item) => (
                  <div className="border rounded p-3" key={item.id}>
                    <div className="d-flex gap-2 align-items-center mb-2">
                      <input className="form-control form-control-sm border-0 fw-bold px-0" value={item.title} onChange={(e) => updatePricingItem(item.id, { title: e.target.value })} placeholder="Başlık" />
                      <button className="btn btn-icon btn-sm btn-light-danger" onClick={() => removePricingItem(item.id)}><Trash2 size={14} /></button>
                    </div>
                    <textarea rows={2} className="form-control form-control-sm form-control-solid" value={item.desc} onChange={(e) => updatePricingItem(item.id, { desc: e.target.value })} placeholder="Açıklama" />
                  </div>
                ))}
              </div>
              <button className="btn btn-light btn-sm mt-3" onClick={addPricingItem}><Plus size={13} className="me-1" />Kalem Ekle</button>
            </div>

            <Field label="Özel Fiyat (Aylık, TL)"><input type="number" className="form-control form-control-solid" value={proposal.special_price} onChange={(e) => setField("special_price", Number(e.target.value) || 0)} /></Field>
          </div>
        ) : (
          <ProposalPrintView proposal={proposal} dailyTotal={dailyTotal} />
        )}
      </div>

      {tab === "duzenle" && (
        <div className="print-only-area">
          <ProposalPrintView proposal={proposal} dailyTotal={dailyTotal} />
        </div>
      )}
    </div>
  );
}

function ProposalPrintView({ proposal, dailyTotal }) {
  return (
    <div id="proposal-print-area" className="proposal-print">
      <div className="pp-header">
        <img src="/logo.png" alt="Dynoops" className="pp-logo-img" />
      </div>

      <h1 className="pp-title">{proposal.customer_name ? `${proposal.customer_name} Reklam Planlaması` : "Reklam Planlaması"}</h1>
      <div className="pp-date">{proposal.date}</div>
      <p className="pp-intro">{proposal.intro}</p>

      <ul className="pp-bullets">
        {(proposal.bullets || []).map((b, i) => (<li key={i}><strong>{b.title} :</strong> {b.text}</li>))}
      </ul>

      <div className="pp-sub">Günlük Harcanan Reklam Modelleri Aşağıdaki gibidir ;</div>

      {proposal.categories.map((cat) => cat.rows.length > 0 && (
        <div key={cat.id} className="pp-cat">
          <div className="pp-cat-title">{cat.title} :</div>
          <table className="pp-table">
            <tbody>
              {cat.rows.map((r) => (<tr key={r.id}><td>{r.name}</td><td className="pp-price">{r.price ? fmtTL(r.price) : "-"}</td></tr>))}
            </tbody>
          </table>
        </div>
      ))}

      <table className="pp-table pp-total-table">
        <tbody><tr><td><strong>GENEL TOPLAM (GÜNLÜK)</strong></td><td className="pp-price pp-total-price">{fmtTL(dailyTotal)}</td></tr></tbody>
      </table>

      <div className="pp-sub" style={{ marginTop: 20 }}>Fiyatlandırma :</div>
      <table className="pp-table pp-pricing-table">
        <tbody>
          {(proposal.pricing_items || []).map((item) => (
            <tr key={item.id}>
              <td><div className="pp-pricing-title">{item.title}</div><div className="pp-pricing-desc">{item.desc}</div></td>
              <td></td>
            </tr>
          ))}
          <tr className="pp-special-row"><td><strong>ÖZEL FİYAT</strong></td><td className="pp-price pp-total-price">{fmtTL(proposal.special_price)}</td></tr>
        </tbody>
      </table>

      <div className="pp-footer"><div>info@dynoops.com.tr</div><div>www.dynoops.com.tr</div></div>
    </div>
  );
}
