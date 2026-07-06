# Dynoops Yönetim Paneli

Müşteri (cari), aylık ödeme takibi ve kurumsal teklif oluşturma paneli.
**Next.js** (arayüz) + **Supabase** (Postgres veritabanı + kullanıcı girişi) ile çalışır.

Bu rehber hiçbir ön bilgi varsaymaz — sıfırdan, adım adım ilerleyin. Toplam süre yaklaşık 20-30 dakika.

---

## 0) İhtiyacınız olanlar

- Bir bilgisayar (Windows/Mac fark etmez)
- Ücretsiz bir [Supabase](https://supabase.com) hesabı
- Ücretsiz bir [Vercel](https://vercel.com) hesabı (siteyi internete açmak için)
- Ücretsiz bir [GitHub](https://github.com) hesabı (Vercel'e kod göndermek için)
- Bilgisayarınıza kurulu [Node.js](https://nodejs.org) (LTS sürüm) — sadece yerelde deneyecekseniz gerekir

---

## 1) Supabase projesi oluşturma

1. [supabase.com](https://supabase.com) adresine gidin, **Start your project** ile ücretsiz hesap açın (GitHub ile giriş yapabilirsiniz).
2. **New Project** butonuna tıklayın.
   - Organization: varsayılanı kullanın
   - Name: `dynoops-panel`
   - Database Password: güçlü bir şifre girin ve **bir kenara not edin**
   - Region: size en yakın bölge (örn. Frankfurt)
3. **Create new project** deyin, kurulmasını bekleyin (1-2 dakika sürer).

## 2) Veritabanı tablolarını oluşturma

1. Sol menüden **SQL Editor**'a girin.
2. **New query** deyin.
3. Bu projedeki `supabase/schema.sql` dosyasının **tamamını** kopyalayıp editöre yapıştırın.
4. Sağ alttaki **Run** (veya Ctrl+Enter) butonuna basın.
5. "Success. No rows returned" mesajını görürseniz tablolar (customers, payments, proposals) başarıyla oluşmuştur. Sol menüden **Table Editor**'a girip kontrol edebilirsiniz.

## 3) Bağlantı bilgilerini alma

1. Sol menüden **Project Settings** (dişli ikonu) → **API** sekmesine girin.
2. **Project URL** ve **anon public** key değerlerini kopyalayın — bunlara birazdan ihtiyacımız olacak.

## 4) Kullanıcı ekleme (giriş yapacak ekip üyeleri)

Bu panelde herkese açık kayıt ekranı yoktur — kullanıcıları siz manuel eklersiniz, böylece verileriniz güvende kalır.

1. Supabase panelinde sol menüden **Authentication** → **Users**'a girin.
2. **Add user** → **Create new user** deyin.
3. E-posta ve şifre girin (örn. `ekip@dynoops.com.tr`), **Auto Confirm User** kutusunu işaretleyin.
4. **Create user** deyin.
5. Panele giriş yapacak her ekip üyesi için bu adımı tekrarlayın.

---

## 5) Projeyi bilgisayarınızda çalıştırma (yerel test)

1. Bu klasörü bir yere çıkarın, terminali/komut istemini bu klasörde açın.
2. `.env.local.example` dosyasını `.env.local` olarak kopyalayın ve içine 3. adımda aldığınız bilgileri yapıştırın:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. Terminalde şu komutları çalıştırın:

   ```
   npm install
   npm run dev
   ```

4. Tarayıcıda `http://localhost:3000` adresini açın. Karşınıza giriş ekranı çıkacak — 4. adımda oluşturduğunuz e-posta/şifre ile giriş yapın.

---

## 6) İnternete açma (Vercel ile canlıya alma)

1. [github.com](https://github.com) üzerinde yeni, boş bir repo (repository) oluşturun (örn. `dynoops-panel`).
2. Bu proje klasöründe:

   ```
   git init
   git add .
   git commit -m "ilk yükleme"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADINIZ/dynoops-panel.git
   git push -u origin main
   ```

3. [vercel.com](https://vercel.com) hesabınıza girin, **Add New Project** deyin, GitHub reponuzu seçip **Import** edin.
4. **Environment Variables** kısmına 3. adımdaki iki değeri ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Deploy** deyin. 1-2 dakika içinde size `https://dynoops-panel-xxxx.vercel.app` gibi canlı bir adres verecek.
6. Bu adresi ekibinizle paylaşabilir, kendi alan adınızı (örn. panel.dynoops.com.tr) Vercel'in **Domains** sekmesinden bağlayabilirsiniz.

---

## Güncelleme: Yeni Özellikler (2. sürüm)

Bu sürümde eklenen özellikleri kullanabilmek için **ek bir SQL dosyasını** çalıştırmanız gerekiyor:

1. Supabase → **SQL Editor** → **New query**
2. `supabase/migration_2_yeni_ozellikler.sql` dosyasının tamamını yapıştırıp **Run** deyin
3. Bu, mevcut tablolarınıza yeni sütunlar ekler ve `sectors`, `revenue_records`, `expenses` adında üç yeni tablo oluşturur — **mevcut verileriniz silinmez**

Yeni eklenenler:
- **Sektörler** ekranı: sektör tanımları + Dashboard'da sektöre göre müşteri yüzdesi
- **Müşteriler**: Ortaklık Payı (%), Ciro Alt Limiti, Komisyon % alanları
- **Ödemeler**: Tam Ödeme (anlaşma tutarı otomatik gelir) / Kısmi Ödeme seçimi
- **Ciro / Komisyon Hesaplama** ekranı: (Ciro − Alt Limit) × Komisyon % formülüyle otomatik hesaplama
- **Giderler** ekranı: gider kalemi takibi (örn. akaryakıt, kira)
- **Muhasebe** ekranı: seçilen ay için gelir (ödemeler + komisyonlar) / gider / net özet
- Gerçek Dynoops logosu (sidebar, giriş ekranı, teklif çıktısı)

## Güncelleme: Gider Kategorileri, Responsive Tasarım, Komisyon Ayrımı (3. sürüm)

Yeni bir SQL dosyası daha çalıştırmanız gerekiyor:

1. Supabase → **SQL Editor** → **New query**
2. `supabase/migration_3_gider_kategorileri.sql` dosyasının tamamını yapıştırıp **Run** deyin

Bu sürümde eklenenler:
- **Giderler** ekranına "Kategoriler" sekmesi: her kategoriye özel renk tanımlayabilirsiniz, gider listesinde renkli etiket olarak görünür
- **Dashboard**'da bu ay giderlerinin kategoriye göre renkli pasta grafiği
- **Müşteriler**: Komisyon % girilen müşteriler "Komisyonlu" rozetiyle ayrı görünür + Tümü/Komisyonlu/Standart filtresi + her müşterinin ödenmemiş (kalan) bakiyesi listede
- **Ciro/Komisyon Hesaplama**: yalnızca Komisyon %'si tanımlı müşteriler listelenir
- **Responsive tasarım**: mobilde kenar çubuğu, hamburger menü ile açılan kayar panele dönüşür; tablolar dar ekranlarda yatay kaydırılabilir

## Güncelleme: Metronic Tema Entegrasyonu (4. sürüm)

Bu sürümde panelin tüm görsel katmanı **Metronic (Bootstrap 5 tabanlı)** tema sistemine geçirildi:

- `public/metronic/style.bundle.css` — Metronic'in derlenmiş CSS paketi (Bootstrap + Metronic bileşenleri dahil), lisansınız kapsamında projeye eklendi
- Kenar çubuğu, kartlar, tablolar, formlar, rozetler artık Metronic'in `card`, `table`, `btn`, `badge`, `form-control` gibi orijinal sınıflarını kullanıyor
- Koyu (dark) kenar çubuğu + açık içerik alanı düzeni (Metronic Demo1 stiline uygun)
- Mobilde kenar çubuğu, Metronic'in görsel diliyle ama kendi React tabanlı kayar menümüzle çalışıyor (jQuery gerektirmez)
- Teklif çıktısı (yazdırma/PDF) kasıtlı olarak admin temasından ayrı tutuldu — o hâlâ orijinal Dynoops PDF şablonuna sadık, beyaz sayfa tasarımında

**Not:** Bu entegrasyon Metronic'in yalnızca derlenmiş CSS dosyasını kullanır; jQuery tabanlı `scripts.bundle.js`/`widgets.bundle.js` kullanılmadı çünkü React ile çakışabilir. Grafikler hâlâ recharts ile çalışıyor. İleride Metronic'in ApexCharts widget'larını veya ek bileşenlerini eklemek isterseniz ayrıca entegre edebiliriz.

Bu sürüm için ek bir SQL migration gerekmiyor — sadece dosyaları kopyalayıp push etmeniz yeterli.

## Güncelleme: Reklam Performansı Takibi (5. sürüm)

Yeni bir SQL dosyası çalıştırmanız gerekiyor:

1. Supabase → **SQL Editor** → **New query**
2. `supabase/migration_4_reklam_performansi.sql` dosyasının tamamını yapıştırıp **Run** deyin

Yeni eklenen: **Reklam Performansı** ekranı — her müşteri için Google Ads, Meta Business ve TikTok Ads sekmeleri altında ayrı ayrı aylık Harcanan Tutar, Alışveriş Dönüşüm Değeri, ROAS ve Sepete Ekleme Değeri girişi yapabilir, son 6 aylık trend grafiğini görebilirsiniz.

## Kendi Domaininize Taşıma (app.dynoops.com.tr)

1. **Vercel'de** → `dynoops-panel` projesi → **Settings** → **Domains** → **Add** → `app.dynoops.com.tr` yazıp ekleyin
2. Vercel size bir **CNAME hedefi** gösterecek (genelde `cname.vercel-dns.com`) — bunu not edin
3. **Domain sağlayıcınızın** (Natro/Turhost vb.) yönetim panelinde **DNS Ayarları / DNS Yönetimi** bölümüne girin
4. Yeni bir **CNAME kaydı** ekleyin:
   - Host/Alt Alan Adı: `app`
   - Yönlendirilecek adres: Vercel'in verdiği adres (örn. `cname.vercel-dns.com`)
   - TTL: varsayılan bırakabilirsiniz
5. Kaydedin — DNS yayılması birkaç dakika ile birkaç saat sürebilir
6. Vercel otomatik olarak SSL sertifikası oluşturacak; Domains sayfasında yeşil "Valid Configuration" yazısını gördüğünüzde `https://app.dynoops.com.tr` üzerinden erişebilirsiniz

## Güncelleme: Toplantı Planlama (6. sürüm)

Yeni bir SQL dosyası çalıştırmanız gerekiyor:

1. Supabase → **SQL Editor** → **New query**
2. `supabase/migration_5_toplantilar.sql` dosyasının tamamını yapıştırıp **Run** deyin

Yeni eklenen: **Toplantılar** ekranı.

**Nasıl çalışır (Google API kurulumu gerektirmeyen hızlı yöntem):**
1. Panelde "Yeni Toplantı" ile müşteri, başlık, tarih/saat, katılımcı e-postası girip kaydedin
2. "Google Calendar'da Oluştur" butonuna tıklayın — Google Calendar, bu bilgilerle önceden doldurulmuş yeni etkinlik ekranını açar
3. O ekranda **"Google Meet video konferansı ekle"** butonuna tıklayın, Calendar otomatik bir Meet linki oluşturur
4. Oluşan linki kopyalayıp panele dönüp toplantıyı düzenleyin, **Google Meet Linki** alanına yapıştırıp kaydedin
5. Artık listede "Katıl" butonu ile doğrudan Meet linkine gidebilirsiniz

## Özellikler

- **Gelir Tablosu**: aktif müşteri sayısı, aylık sabit gelir, tahsilat/bekleyen özet kartları, son 6 aylık grafik, geciken ödemeler listesi
- **Müşteriler**: cari kartları, arama, aylık ücret ve durum takibi
- **Ödemeler**: aya/yıla göre filtrelenen ödeme kayıtları, tek tıkla "ödendi" işaretleme
- **Teklif Oluştur**: kategori/satır bazlı düzenlenebilir teklif oluşturucu; "Yazdır / PDF" ile orijinal Dynoops teklif şablonuna uygun çıktı

## Veri güvenliği

- Tüm tablolarda Row Level Security (RLS) açıktır; sadece giriş yapmış (authenticated) kullanıcılar veriye erişebilir.
- Yeni ekip üyesi eklemek için Supabase → Authentication → Users → Add user yeterlidir, kod değişikliği gerekmez.

## Sorun giderme

- **Giriş yapamıyorum**: Supabase → Authentication → Users kısmında kullanıcının "Auto Confirm" ile oluşturulduğundan emin olun.
- **"Failed to fetch" hatası**: `.env.local` (veya Vercel'deki Environment Variables) içindeki URL/anahtarın doğru kopyalandığından emin olun.
- **Veriler görünmüyor**: SQL Editor'da `schema.sql`'in eksiksiz çalıştığını, Table Editor'da tabloların göründüğünü kontrol edin.

## Sonraki adımlar (isteğe bağlı)

- Ekip üyelerine farklı yetki seviyeleri (örn. sadece görüntüleme) eklemek isterseniz RLS politikalarını Supabase üzerinden özelleştirebiliriz.
- Aylık otomatik ödeme kaydı oluşturma (her ay başında aktif müşteriler için otomatik "bekliyor" kaydı açma) eklenebilir.
- E-posta ile otomatik hatırlatma (ödeme günü yaklaşan müşteriler için) eklenebilir.
