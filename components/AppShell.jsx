"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Users, Wallet, FileText, LayoutDashboard, LogOut,
  Tags, Calculator, Receipt, BookOpen, Menu, X, Megaphone,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/dashboard", label: "Gelir Tablosu", icon: LayoutDashboard },
  { href: "/customers", label: "Müşteriler", icon: Users },
  { href: "/ad-performance", label: "Reklam Performansı", icon: Megaphone },
  { href: "/payments", label: "Ödemeler", icon: Wallet },
  { href: "/revenue", label: "Ciro / Komisyon", icon: Calculator },
  { href: "/proposals", label: "Teklif Oluştur", icon: FileText },
  { href: "/sectors", label: "Sektörler", icon: Tags },
  { href: "/expenses", label: "Giderler", icon: Receipt },
  { href: "/accounting", label: "Muhasebe", icon: BookOpen },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="d-flex flex-column flex-root app-root" id="kt_app_root">
      <div className="app-page flex-column flex-column-fluid" id="kt_app_page">

        <div className="app-mobile-topbar">
          <button className="btn btn-icon btn-sm btn-color-white" onClick={() => setMobileOpen(true)} aria-label="Menüyü aç">
            <Menu size={20} />
          </button>
          <img src="/logo.png" alt="Dynoops" style={{ height: 20 }} />
          <span style={{ width: 32 }} />
        </div>

        {mobileOpen && <div className="app-mobile-backdrop" onClick={() => setMobileOpen(false)} />}

        <div className="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
          <div id="kt_app_sidebar" className={`app-sidebar flex-column ${mobileOpen ? "sidebar-open" : ""}`}>
            <div className="app-sidebar-logo px-6 d-flex align-items-center justify-content-between" id="kt_app_sidebar_logo">
              <img alt="Dynoops" src="/logo.png" style={{ height: 22 }} />
              <button className="btn btn-icon btn-sm btn-color-white d-lg-none" onClick={() => setMobileOpen(false)} aria-label="Menüyü kapat">
                <X size={18} />
              </button>
            </div>

            <div className="app-sidebar-menu overflow-hidden flex-column-fluid">
              <div className="app-sidebar-wrapper">
                <div className="menu menu-column menu-rounded menu-sub-indention fw-semibold fs-6" data-kt-menu="true">
                  {NAV.map((n) => {
                    const active = pathname.startsWith(n.href);
                    return (
                      <div className="menu-item" key={n.href}>
                        <Link href={n.href} onClick={() => setMobileOpen(false)} className={`menu-link ${active ? "active" : ""}`}>
                          <span className="menu-icon">
                            <n.icon size={18} strokeWidth={2} />
                          </span>
                          <span className="menu-title">{n.label}</span>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="app-sidebar-footer px-6 py-4">
              <div className="text-gray-500 fs-8 mb-3">Reklam &amp; Dijital Pazarlama</div>
              <button className="btn btn-sm btn-color-white btn-active-color-primary d-flex align-items-center gap-2 px-0" onClick={signOut}>
                <LogOut size={14} /> Çıkış Yap
              </button>
            </div>
          </div>

          <div className="app-main flex-column flex-row-fluid" id="kt_app_main">
            <div className="d-flex flex-column flex-column-fluid">
              <div id="kt_app_content" className="app-content flex-column-fluid">
                <div className="app-container container-fluid app-content-area">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
