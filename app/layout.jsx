import "./globals.css";
import "../styles/metronic.css";

export const metadata = {
  title: "Dynoops Yönetim Paneli",
  description: "Müşteri, ödeme ve teklif yönetimi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" data-bs-theme="light">
      <body
        className="app-default"
        data-kt-app-layout="dark-sidebar"
        data-kt-app-header-fixed="true"
        data-kt-app-sidebar-fixed="true"
        data-kt-app-sidebar-push-header="true"
        data-kt-app-sidebar-push-toolbar="true"
        data-kt-app-sidebar-push-footer="true"
      >
        {children}
      </body>
    </html>
  );
}
