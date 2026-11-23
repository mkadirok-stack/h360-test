// Çok dilli destek: Türkçe (varsayılan), İngilizce, Fransızca, Arapça (sağdan sola).
// Anahtar = Türkçe metin. Sözlükte [en, fr, ar] sırasıyla karşılıklar bulunur.
// Yeni metin eklerken sözlüğe satır ekleyin; sözlükte olmayan metin Türkçe kalır.
(function () {
  const LANGS = ['tr', 'en', 'fr', 'ar', 'ru'];
  const LOCALES = { tr: 'tr-TR', en: 'en-GB', fr: 'fr-FR', ar: 'ar-u-nu-latn', ru: 'ru-RU' };
  const IDX = { en: 0, fr: 1, ar: 2, ru: 3 };

  let lang = '';
  try { lang = localStorage.getItem('lang') || ''; } catch (e) {}
  const qp = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(qp)) { lang = qp; try { localStorage.setItem('lang', lang); } catch (e) {} }
  if (!LANGS.includes(lang)) {
    const n = (navigator.language || 'tr').slice(0, 2).toLowerCase();
    lang = LANGS.includes(n) ? n : 'tr';
  }

  const D = {
    // ---- Üst menü / ortak
    'Ürünler': ['Products', 'Produits', 'المنتجات'],
    'Neden Biz': ['Why Us', 'Pourquoi nous', 'لماذا نحن'],
    'Süreç': ['Process', 'Processus', 'العملية'],
    'İletişim': ['Contact', 'Contact', 'اتصل بنا'],
    'İlanlar': ['Listings', 'Annonces', 'الإعلانات'],
    'Giriş / Üye Ol': ['Log in / Sign up', 'Connexion / Inscription', 'تسجيل الدخول / إنشاء حساب'],
    'Teklif Al': ['Get a Quote', 'Demander un devis', 'اطلب عرض سعر'],
    'Ana Sayfa': ['Home', 'Accueil', 'الرئيسية'],
    'İlan Ver': ['Post a Listing', 'Publier une annonce', 'أضف إعلانًا'],
    'Yönetim': ['Admin', 'Administration', 'الإدارة'],
    'Çıkış': ['Log out', 'Déconnexion', 'تسجيل الخروج'],
    '⚠ Test yayınıdır. Site yapım aşamasındadır, bilgiler kesinleşmemiştir.': ['⚠ Test version. The site is under construction; information is not final.', '⚠ Version de test. Le site est en construction ; les informations ne sont pas définitives.', '⚠ نسخة تجريبية. الموقع قيد الإنشاء والمعلومات غير نهائية.'],
    'Hammadde360 ana sayfa': ['Hammadde360 home page', 'Page d\'accueil Hammadde360', 'الصفحة الرئيسية لـ Hammadde360'],
    'Menüyü aç': ['Open menu', 'Ouvrir le menu', 'افتح القائمة'],

    // ---- Kur şeridi / kur kutusu / canlı destek
    'TCMB döviz satış kuru:': ['CBRT selling rate:', 'Taux vendeur BCRT :', 'سعر البيع للبنك المركزي التركي:'],
    '{d} tarihli TCMB ilanı': ['CBRT announcement of {d}', 'annonce BCRT du {d}', 'إعلان البنك المركزي التركي بتاريخ {d}'],
    'Sonraki iş günü ({d} ilanı):': ['Next business day ({d} announcement):', 'Jour ouvré suivant (annonce du {d}) :', 'يوم العمل التالي (إعلان {d}):'],
    'Fiyatlar USD cinsindendir ve KDV hariçtir (KDV oranı ilana göre ayrıca eklenir). Faturalandırma TCMB döviz satış kuru esas alınarak yapılır.': ['Prices are in USD and exclude VAT (VAT is added at the rate stated for each listing). Invoicing is based on the CBRT selling rate.', 'Les prix sont en USD et hors TVA (la TVA s\'ajoute au taux indiqué pour chaque annonce). La facturation est établie au taux vendeur de la BCRT.', 'الأسعار بالدولار الأمريكي وغير شاملة ضريبة القيمة المضافة (تُضاف بالنسبة المحددة لكل إعلان). تتم الفوترة وفق سعر البيع للبنك المركزي التركي.'],
    'Nakit ödemelerde %{n} iskonto.': ['{n}% discount on cash payments.', '{n} % de remise pour les paiements comptant.', 'خصم {n}% على الدفع النقدي.'],
    'WhatsApp canlı destek': ['WhatsApp live support', 'Assistance WhatsApp en direct', 'دعم واتساب المباشر'],
    'Canlı Destek': ['Live Support', 'Support en direct', 'الدعم المباشر'],
    'Şu an kapalıyız · Mesaj bırakın': ['We are closed now · Leave a message', 'Fermé actuellement · Laissez un message', 'نحن مغلقون الآن · اترك رسالة'],
    'Merhaba, bilgi almak istiyorum.': ['Hello, I would like some information.', 'Bonjour, je souhaite des informations.', 'مرحبًا، أود الحصول على معلومات.'],
    'TCMB döviz kurları': ['CBRT exchange rates', 'Taux de change BCRT', 'أسعار الصرف – البنك المركزي التركي'],
    'TCMB Kurları': ['CBRT Rates', 'Taux BCRT', 'أسعار البنك المركزي'],
    'Bugün geçerli · {d} ilanı': ['Valid today · {d} announcement', 'Valable aujourd\'hui · annonce du {d}', 'ساري اليوم · إعلان {d}'],
    'Sonraki iş günü · {d} ilanı': ['Next business day · {d} announcement', 'Jour ouvré suivant · annonce du {d}', 'يوم العمل التالي · إعلان {d}'],
    'Döviz': ['Currency', 'Devise', 'العملة'],
    'Alış': ['Buy', 'Achat', 'شراء'],
    'Satış': ['Sell', 'Vente', 'بيع'],
    'Kaynak: T.C. Merkez Bankası (döviz alış/satış). Fiyatlar + KDV. Faturalandırmada döviz satış kuru esas alınır.': ['Source: Central Bank of the Republic of Türkiye (FX buying/selling). Prices + VAT. Invoicing uses the selling rate.', 'Source : Banque centrale de la République de Turquie (change achat/vente). Prix + TVA. La facturation utilise le taux vendeur.', 'المصدر: البنك المركزي لجمهورية تركيا (شراء/بيع العملات). الأسعار + ضريبة القيمة المضافة. تعتمد الفوترة سعر البيع.'],
    'Bu sayfayı görmek için giriş yapmanız gerekiyor.': ['You need to log in to view this page.', 'Vous devez vous connecter pour voir cette page.', 'يجب تسجيل الدخول لعرض هذه الصفحة.'],
    'Bu sayfaya erişim yetkiniz yok.': ['You do not have access to this page.', 'Vous n\'avez pas accès à cette page.', 'ليس لديك صلاحية الوصول إلى هذه الصفحة.'],

    // ---- Ana sayfa
    'Hammadde360 | Hammadde Tedariği': ['Hammadde360 | Raw Material Supply', 'Hammadde360 | Approvisionnement en matières premières', 'Hammadde360 | توريد المواد الخام'],
    'Hammadde360: PP, PE, PVC, PET, PS, ABS, PA ve geri dönüşümlü plastik hammadde satışı. Rekabetçi fiyat, hızlı teslimat, kaliteli tedarik.': ['Hammadde360: PP, PE, PVC, PET, PS, ABS, PA and recycled plastic raw materials. Competitive prices, fast delivery, quality supply.', 'Hammadde360 : matières premières plastiques PP, PE, PVC, PET, PS, ABS, PA et recyclées. Prix compétitifs, livraison rapide, approvisionnement de qualité.', 'Hammadde360: مواد خام بلاستيكية PP وPE وPVC وPET وPS وABS وPA ومعاد تدويرها. أسعار تنافسية وتسليم سريع وتوريد عالي الجودة.'],
    'Hammadde Tedarikçiniz': ['Your Raw Material Supplier', 'Votre fournisseur de matières premières', 'مورّد المواد الخام الخاص بك'],
    'HERO_H1': ['The right raw material for your production,<br>with <em>360°</em> assurance in every way.', 'La bonne matière première pour votre production,<br>avec une garantie <em>360°</em> à tous égards.', 'المادة الخام المناسبة لإنتاجك،<br>بضمان <em>360°</em> من كل الجوانب.'],
    'PP, PE, PVC, PET, PS, ABS ve daha fazlası. Birincil ve geri dönüşümlü granüller; rekabetçi fiyat, düzenli stok ve zamanında teslimat.': ['PP, PE, PVC, PET, PS, ABS and more. Virgin and recycled granules; competitive prices, regular stock and on-time delivery.', 'PP, PE, PVC, PET, PS, ABS et plus encore. Granulés vierges et recyclés ; prix compétitifs, stock régulier et livraison dans les délais.', 'PP وPE وPVC وPET وPS وABS وأكثر. حبيبات أصلية ومعاد تدويرها؛ أسعار تنافسية ومخزون منتظم وتسليم في الوقت المحدد.'],
    'Hemen Teklif Alın': ['Get a Quote Now', 'Demandez un devis maintenant', 'احصل على عرض سعر الآن'],
    'Ürünleri İnceleyin': ['Browse Products', 'Découvrir les produits', 'تصفّح المنتجات'],
    'Polimer grubu': ['Polymer groups', 'Groupes de polymères', 'مجموعات البوليمرات'],
    '24 saat': ['24 hours', '24 heures', '24 ساعة'],
    'Teklif dönüş süresi': ['Quote response time', 'Délai de réponse au devis', 'مدة الرد على عرض السعر'],
    'Türkiye geneli': ['Nationwide (Türkiye)', 'Partout en Turquie', 'في جميع أنحاء تركيا'],
    'Sevkiyat': ['Shipping', 'Expédition', 'الشحن'],
    'Ürün Gruplarımız': ['Our Product Groups', 'Nos groupes de produits', 'مجموعات منتجاتنا'],
    'İhtiyacınıza uygun kalite, MFI ve renk seçenekleri için bizimle iletişime geçin. Diğer hammadde sektörleri zamanla eklenecektir.': ['Contact us for grade, MFI and colour options that fit your needs. Other raw material sectors will be added over time.', 'Contactez-nous pour les qualités, indices de fluidité (MFI) et couleurs adaptés à vos besoins. D\'autres secteurs de matières premières seront ajoutés progressivement.', 'تواصل معنا لخيارات الجودة ومؤشر الانسياب (MFI) والألوان التي تناسب احتياجاتك. ستُضاف قطاعات المواد الخام الأخرى مع الوقت.'],
    'Polipropilen': ['Polypropylene', 'Polypropylène', 'البولي بروبيلين'],
    'Ambalaj, otomotiv, ev eşyası, tekstil': ['Packaging, automotive, household goods, textiles', 'Emballage, automobile, articles ménagers, textile', 'التغليف، السيارات، الأدوات المنزلية، النسيج'],
    'Film, boru, şişe, enjeksiyon': ['Film, pipe, bottle, injection', 'Film, tuyaux, bouteilles, injection', 'الأغشية، الأنابيب، الزجاجات، الحقن'],
    'Polivinil Klorür': ['Polyvinyl Chloride', 'Polychlorure de vinyle', 'بولي فينيل كلوريد'],
    'Profil, boru, kablo, zemin': ['Profiles, pipe, cable, flooring', 'Profilés, tuyaux, câbles, revêtements de sol', 'البروفيلات، الأنابيب، الكابلات، الأرضيات'],
    'Polietilen Tereftalat': ['Polyethylene Terephthalate', 'Polyéthylène téréphtalate', 'بولي إيثيلين تيريفثاليت'],
    'Şişe, ambalaj, elyaf': ['Bottles, packaging, fibre', 'Bouteilles, emballage, fibres', 'الزجاجات، التغليف، الألياف'],
    'Tek kullanımlık, beyaz eşya, ambalaj': ['Disposables, white goods, packaging', 'Produits jetables, électroménager, emballage', 'المنتجات أحادية الاستخدام، الأجهزة المنزلية، التغليف'],
    'Akrilonitril Bütadien Stiren': ['Acrylonitrile Butadiene Styrene', 'Acrylonitrile butadiène styrène', 'أكريلونيتريل بوتادين ستايرين'],
    'Elektronik, otomotiv, oyuncak': ['Electronics, automotive, toys', 'Électronique, automobile, jouets', 'الإلكترونيات، السيارات، الألعاب'],
    'Poliamid / Polikarbonat': ['Polyamide / Polycarbonate', 'Polyamide / Polycarbonate', 'بولي أميد / بولي كربونات'],
    'Mühendislik plastikleri': ['Engineering plastics', 'Plastiques techniques', 'البلاستيك الهندسي'],
    'Geri Dönüşüm': ['Recycling', 'Recyclage', 'إعادة التدوير'],
    'Rejenere granül': ['Regranulated pellets', 'Granulés régénérés', 'حبيبات معاد تدويرها'],
    'Ekonomik ve sürdürülebilir çözüm': ['Economical and sustainable solution', 'Solution économique et durable', 'حل اقتصادي ومستدام'],
    'Neden Hammadde360?': ['Why Hammadde360?', 'Pourquoi Hammadde360 ?', 'لماذا Hammadde360؟'],
    'Rekabetçi Fiyat': ['Competitive Pricing', 'Prix compétitifs', 'أسعار تنافسية'],
    'Güncel piyasa verileriyle şeffaf ve avantajlı fiyatlandırma. Nakit ödemelerde %2 iskonto.': ['Transparent, advantageous pricing based on current market data. 2% discount on cash payments.', 'Tarification transparente et avantageuse basée sur les données actuelles du marché. 2 % de remise pour les paiements comptant.', 'تسعير شفاف ومميز بناءً على بيانات السوق الحالية. خصم 2% على الدفع النقدي.'],
    'Kalite Güvencesi': ['Quality Assurance', 'Assurance qualité', 'ضمان الجودة'],
    'Her partide teknik veri sayfası (TDS) ve analiz sertifikası desteği.': ['Technical data sheet (TDS) and certificate of analysis support for every batch.', 'Fiche technique (TDS) et certificat d\'analyse pour chaque lot.', 'ورقة البيانات الفنية (TDS) وشهادة التحليل لكل دفعة.'],
    'Hızlı Teslimat': ['Fast Delivery', 'Livraison rapide', 'تسليم سريع'],
    'Planlı sevkiyat, esnek miktar seçenekleri, kapıya teslim.': ['Scheduled shipping, flexible quantities, door-to-door delivery.', 'Expédition planifiée, quantités flexibles, livraison à domicile.', 'شحن مخطط، كميات مرنة، تسليم حتى الباب.'],
    'Uzman Destek': ['Expert Support', 'Assistance experte', 'دعم الخبراء'],
    'Uygulamanıza en uygun kaliteyi birlikte seçiyoruz.': ['We choose the grade best suited to your application together with you.', 'Nous choisissons ensemble la qualité la mieux adaptée à votre application.', 'نختار معك الدرجة الأنسب لتطبيقك.'],
    'Nasıl Çalışıyoruz?': ['How We Work', 'Comment nous travaillons', 'كيف نعمل؟'],
    'Talebinizi iletin': ['Send your request', 'Envoyez votre demande', 'أرسل طلبك'],
    'Ürün, miktar ve teslim yerini paylaşın.': ['Share the product, quantity and delivery location.', 'Indiquez le produit, la quantité et le lieu de livraison.', 'شاركنا المنتج والكمية ومكان التسليم.'],
    'Teklif alın': ['Get a quote', 'Recevez un devis', 'احصل على عرض سعر'],
    '24 saat içinde net fiyat ve termin bilgisi.': ['Firm price and lead time within 24 hours.', 'Prix ferme et délai sous 24 heures.', 'سعر نهائي وموعد التسليم خلال 24 ساعة.'],
    'Siparişi onaylayın': ['Confirm the order', 'Confirmez la commande', 'أكّد الطلب'],
    'Ödeme ve sevkiyat planı netleşir.': ['Payment and shipping plan are finalised.', 'Le paiement et le plan d\'expédition sont finalisés.', 'يتم تحديد خطة الدفع والشحن.'],
    'Teslim alın': ['Receive delivery', 'Réceptionnez la livraison', 'استلم الشحنة'],
    'Hammaddeniz tesisinize ulaşır.': ['Your raw material arrives at your facility.', 'Votre matière première arrive sur votre site.', 'تصل المادة الخام إلى منشأتك.'],
    'Teklif Talep Formu': ['Quote Request Form', 'Formulaire de demande de devis', 'نموذج طلب عرض سعر'],
    'Formu doldurun, size en kısa sürede dönüş yapalım.': ['Fill in the form and we will get back to you as soon as possible.', 'Remplissez le formulaire et nous vous répondrons dans les meilleurs délais.', 'املأ النموذج وسنعود إليك في أقرب وقت.'],
    'Ad Soyad': ['Full name', 'Nom et prénom', 'الاسم الكامل'],
    'Firma': ['Company', 'Entreprise', 'الشركة'],
    'Telefon': ['Phone', 'Téléphone', 'الهاتف'],
    'E-posta': ['Email', 'E-mail', 'البريد الإلكتروني'],
    'Ürün': ['Product', 'Produit', 'المنتج'],
    'Seçiniz': ['Select', 'Sélectionnez', 'اختر'],
    'Geri Dönüşümlü Granül': ['Recycled granules', 'Granulés recyclés', 'حبيبات معاد تدويرها'],
    'Diğer': ['Other', 'Autre', 'أخرى'],
    'Miktar (ton)': ['Quantity (tonnes)', 'Quantité (tonnes)', 'الكمية (طن)'],
    'Mesajınız': ['Your message', 'Votre message', 'رسالتك'],
    'Kalite, MFI, renk, teslim yeri vb.': ['Grade, MFI, colour, delivery location, etc.', 'Qualité, MFI, couleur, lieu de livraison, etc.', 'الجودة، MFI، اللون، مكان التسليم، إلخ.'],
    'Kişisel verilerimin teklif sürecinde işlenmesini kabul ediyorum.': ['I consent to my personal data being processed for the quotation process.', 'J\'accepte que mes données personnelles soient traitées dans le cadre du devis.', 'أوافق على معالجة بياناتي الشخصية في عملية عرض السعر.'],
    'Teklif İste': ['Request Quote', 'Demander un devis', 'اطلب عرض سعر'],
    'Mesaj gönderin': ['Send a message', 'Envoyer un message', 'أرسل رسالة'],
    'Adres': ['Address', 'Adresse', 'العنوان'],
    'Adres bilgisi eklenecek': ['Address to be added', 'Adresse à venir', 'سيتم إضافة العنوان'],
    'Koşullar ve Sözleşmeler': ['Terms and Agreements', 'Conditions et contrats', 'الشروط والاتفاقيات'],
    'Üyelik sözleşmesi ve satış koşulları': ['Membership agreement and sales terms', "Contrat d'adhésion et conditions de vente", 'اتفاقية العضوية وشروط البيع'],
    'Hammadde360. Tüm hakları saklıdır.': ['Hammadde360. All rights reserved.', 'Hammadde360. Tous droits réservés.', 'Hammadde360. جميع الحقوق محفوظة.'],
    'Lütfen ad, telefon, e-posta ve ürün alanlarını doldurun.': ['Please fill in name, phone, email and product.', 'Veuillez renseigner le nom, le téléphone, l\'e-mail et le produit.', 'يرجى ملء الاسم والهاتف والبريد الإلكتروني والمنتج.'],
    'Devam etmek için onay kutusunu işaretleyin.': ['Please tick the consent box to continue.', 'Cochez la case de consentement pour continuer.', 'يرجى تحديد خانة الموافقة للمتابعة.'],
    'E-posta uygulamanız açılıyor. Gönder\'e basarak talebi tamamlayın.': ['Your email app is opening. Press Send to complete the request.', 'Votre application de messagerie s\'ouvre. Appuyez sur Envoyer pour finaliser la demande.', 'يتم فتح تطبيق البريد. اضغط «إرسال» لإكمال الطلب.'],
    'Gönderiliyor...': ['Sending...', 'Envoi en cours...', 'جارٍ الإرسال...'],
    'Talebiniz alındı. En kısa sürede size dönüş yapacağız. Teşekkürler!': ['Your request has been received. We will get back to you shortly. Thank you!', 'Votre demande a bien été reçue. Nous vous répondrons très bientôt. Merci !', 'تم استلام طلبك. سنعود إليك في أقرب وقت. شكرًا لك!'],
    'Gönderilemedi. Lütfen tekrar deneyin veya bizi arayın.': ['Could not be sent. Please try again or call us.', 'Envoi impossible. Veuillez réessayer ou nous appeler.', 'تعذّر الإرسال. يرجى المحاولة مرة أخرى أو الاتصال بنا.'],

    // ---- Giriş / üye ol
    'Giriş / Üye Ol | Hammadde360': ['Log in / Sign up | Hammadde360', 'Connexion / Inscription | Hammadde360', 'تسجيل الدخول / إنشاء حساب | Hammadde360'],
    'Giriş Yap': ['Log In', 'Se connecter', 'تسجيل الدخول'],
    'Üye Ol': ['Sign Up', 'S\'inscrire', 'إنشاء حساب'],
    'Şifre': ['Password', 'Mot de passe', 'كلمة المرور'],
    'Üyelik türü': ['Account type', 'Type de compte', 'نوع الحساب'],
    'Alıcı': ['Buyer', 'Acheteur', 'مشترٍ'],
    'Hammadde arıyorum': ['I am looking for raw materials', 'Je cherche des matières premières', 'أبحث عن مواد خام'],
    'Satıcı': ['Seller', 'Vendeur', 'بائع'],
    'Elimdeki malı satmak istiyorum': ['I want to sell the goods I have', 'Je souhaite vendre ma marchandise', 'أريد بيع ما لدي من بضائع'],
    'Şehir': ['City', 'Ville', 'المدينة'],
    'İlgilendiğiniz hammaddeler': ['Raw materials you are interested in', 'Matières premières qui vous intéressent', 'المواد الخام التي تهتم بها'],
    'Sattığınız hammaddeler': ['Raw materials you sell', 'Matières premières que vous vendez', 'المواد الخام التي تبيعها'],
    'Örn: PP granül, HDPE, rejenere PET': ['E.g. PP granules, HDPE, recycled PET', 'Ex. : granulés PP, HDPE, PET recyclé', 'مثال: حبيبات PP، HDPE، PET معاد تدويره'],
    'Şifre (en az 8 karakter)': ['Password (at least 8 characters)', 'Mot de passe (8 caractères minimum)', 'كلمة المرور (8 أحرف على الأقل)'],
    'Kişisel verilerimin üyelik ve ilan süreçlerinde işlenmesini kabul ediyorum. (Aydınlatma metni şirket kurulduktan sonra eklenecektir.)': ['I consent to my personal data being processed for membership and listing processes. (The privacy notice will be added once the company is established.)', 'J\'accepte que mes données personnelles soient traitées pour l\'adhésion et la publication d\'annonces. (La notice d\'information sera ajoutée après la création de la société.)', 'أوافق على معالجة بياناتي الشخصية في عمليات العضوية والإعلانات. (سيتم إضافة إشعار الخصوصية بعد تأسيس الشركة.)'],
    'Kampanya, duyuru ve yeni ilanlardan e-posta ile haberdar olmak istiyorum. (İsteğe bağlı)': ['I would like to receive campaigns, announcements and new listings by email. (Optional)', 'Je souhaite recevoir par e-mail les promotions, annonces et nouvelles annonces. (Facultatif)', 'أرغب في تلقي الحملات والإعلانات والإعلانات الجديدة عبر البريد الإلكتروني. (اختياري)'],
    'E-posta ve şifre gerekli.': ['Email and password are required.', 'L\'e-mail et le mot de passe sont requis.', 'البريد الإلكتروني وكلمة المرور مطلوبان.'],
    'Giriş yapılıyor...': ['Logging in...', 'Connexion en cours...', 'جارٍ تسجيل الدخول...'],
    'E-postanızı henüz doğrulamadınız. Gelen kutunuzu kontrol edin.': ['You have not verified your email yet. Please check your inbox.', 'Vous n\'avez pas encore confirmé votre e-mail. Vérifiez votre boîte de réception.', 'لم تؤكد بريدك الإلكتروني بعد. يرجى التحقق من صندوق الوارد.'],
    'E-posta veya şifre hatalı.': ['Incorrect email or password.', 'E-mail ou mot de passe incorrect.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'],
    'Ad soyad, telefon ve e-posta zorunludur.': ['Full name, phone and email are required.', 'Le nom, le téléphone et l\'e-mail sont obligatoires.', 'الاسم الكامل والهاتف والبريد الإلكتروني مطلوبة.'],
    'Şifre en az 8 karakter olmalı.': ['The password must be at least 8 characters.', 'Le mot de passe doit contenir au moins 8 caractères.', 'يجب ألا تقل كلمة المرور عن 8 أحرف.'],
    'Devam etmek için kişisel veri onayını işaretleyin.': ['Please tick the personal data consent to continue.', 'Cochez le consentement relatif aux données personnelles pour continuer.', 'يرجى تحديد الموافقة على معالجة البيانات الشخصية للمتابعة.'],
    'Kayıt yapılıyor...': ['Signing up...', 'Inscription en cours...', 'جارٍ إنشاء الحساب...'],
    'Bu e-posta ile zaten üyelik var. Giriş yapın.': ['An account already exists with this email. Please log in.', 'Un compte existe déjà avec cet e-mail. Connectez-vous.', 'يوجد حساب بهذا البريد الإلكتروني. يرجى تسجيل الدخول.'],
    'Kayıt yapılamadı: {m}': ['Sign-up failed: {m}', 'Échec de l\'inscription : {m}', 'تعذّر إنشاء الحساب: {m}'],
    'Kaydınız alındı. E-posta adresinize bir doğrulama bağlantısı gönderdik. Bağlantıya tıkladıktan sonra giriş yapabilirsiniz.': ['Your registration has been received. We sent a verification link to your email address. You can log in after clicking the link.', 'Votre inscription a été enregistrée. Nous avons envoyé un lien de vérification à votre adresse e-mail. Vous pourrez vous connecter après avoir cliqué sur le lien.', 'تم استلام تسجيلك. أرسلنا رابط التحقق إلى بريدك الإلكتروني. يمكنك تسجيل الدخول بعد الضغط على الرابط.'],

    // ---- İlan ver
    'İlan Ver | Hammadde360': ['Post a Listing | Hammadde360', 'Publier une annonce | Hammadde360', 'أضف إعلانًا | Hammadde360'],
    'Satmak istediğiniz hammaddenin bilgilerini girin. Talebiniz incelendikten sonra yayınlanır ve size dönüş yapılır.': ['Enter the details of the raw material you want to sell. Your request will be published after review and we will get back to you.', 'Saisissez les informations de la matière première que vous souhaitez vendre. Votre demande sera publiée après examen et nous reviendrons vers vous.', 'أدخل معلومات المادة الخام التي تريد بيعها. سيتم نشر طلبك بعد المراجعة وسنتواصل معك.'],
    'İlan başlığı': ['Listing title', 'Titre de l\'annonce', 'عنوان الإعلان'],
    'Örn: HDPE boru granülü, 20 ton': ['E.g. HDPE pipe granules, 20 tonnes', 'Ex. : granulés HDPE pour tuyaux, 20 tonnes', 'مثال: حبيبات HDPE للأنابيب، 20 طن'],
    'Ürün türü': ['Product type', 'Type de produit', 'نوع المنتج'],
    'Örn: HDPE granül, PP rejenere, PET flake': ['E.g. HDPE granules, recycled PP, PET flakes', 'Ex. : granulés HDPE, PP régénéré, flocons de PET', 'مثال: حبيبات HDPE، PP معاد تدويره، رقائق PET'],
    'Miktar': ['Quantity', 'Quantité', 'الكمية'],
    'Birim': ['Unit', 'Unité', 'الوحدة'],
    'ton': ['tonne', 'tonne', 'طن'],
    'adet': ['pcs', 'pièces', 'قطعة'],
    'litre': ['litre', 'litre', 'لتر'],
    'birim': ['unit', 'unité', 'وحدة'],
    'KDV oranı': ['VAT rate', 'Taux de TVA', 'نسبة ضريبة القيمة المضافة'],
    '%0 (KDV\'siz)': ['0% (no VAT)', '0 % (sans TVA)', '0% (بدون ضريبة)'],
    'Ürününüze uygulanan KDV oranını seçin. Fiyat KDV hariç girilir.': ['Select the VAT rate applicable to your product. Enter the price excluding VAT.', 'Sélectionnez le taux de TVA applicable à votre produit. Saisissez le prix hors TVA.', 'اختر نسبة ضريبة القيمة المضافة المطبقة على منتجك. يُدخل السعر دون الضريبة.'],
    'Birim fiyatınız (USD / birim, KDV hariç)': ['Your unit price (USD / unit, excl. VAT)', 'Votre prix unitaire (USD / unité, hors TVA)', 'سعر الوحدة لديك (دولار / وحدة، دون الضريبة)'],
    'Bulunduğu şehir': ['City where located', 'Ville où se trouve la marchandise', 'المدينة التي توجد بها'],
    'Açıklama': ['Description', 'Description', 'الوصف'],
    'Kalite, özellik, renk, ambalaj, teslim koşulları vb.': ['Grade, properties, colour, packaging, delivery terms, etc.', 'Qualité, caractéristiques, couleur, emballage, conditions de livraison, etc.', 'الجودة، الخصائص، اللون، التغليف، شروط التسليم، إلخ.'],
    'Fiyatlar USD cinsindendir ve KDV hariç girilir. Sitede alıcılara gösterilecek fiyat ve ilanın yayın şekli Hammadde360 tarafından belirlenir. Faturalandırma TCMB döviz satış kuru esas alınarak yapılır.': ['Prices are in USD and entered excluding VAT. The price shown to buyers on the site and how the listing is published are determined by Hammadde360. Invoicing is based on the CBRT selling rate.', 'Les prix sont en USD et saisis hors TVA. Le prix affiché aux acheteurs et le mode de publication de l\'annonce sont déterminés par Hammadde360. La facturation est établie au taux vendeur de la BCRT.', 'الأسعار بالدولار الأمريكي وتُدخل دون ضريبة القيمة المضافة. يحدد Hammadde360 السعر المعروض للمشترين وطريقة نشر الإعلان. تتم الفوترة وفق سعر البيع للبنك المركزي التركي.'],
    'İlanı Gönder': ['Submit Listing', 'Envoyer l\'annonce', 'إرسال الإعلان'],
    'İlanlarım': ['My Listings', 'Mes annonces', 'إعلاناتي'],
    'Yükleniyor...': ['Loading...', 'Chargement...', 'جارٍ التحميل...'],
    'Tarih': ['Date', 'Date', 'التاريخ'],
    'İlan': ['Listing', 'Annonce', 'الإعلان'],
    'Fiyatınız': ['Your price', 'Votre prix', 'سعرك'],
    'Durum': ['Status', 'Statut', 'الحالة'],
    'Beklemede': ['Pending', 'En attente', 'قيد الانتظار'],
    'Yayında': ['Published', 'Publiée', 'منشور'],
    'Reddedildi': ['Rejected', 'Refusée', 'مرفوض'],
    'Henüz ilanınız yok.': ['You have no listings yet.', 'Vous n\'avez pas encore d\'annonce.', 'ليس لديك إعلانات بعد.'],
    'İlanlar yüklenemedi.': ['Listings could not be loaded.', 'Impossible de charger les annonces.', 'تعذّر تحميل الإعلانات.'],
    'Başlık, ürün türü, miktar, fiyat ve şehir zorunludur.': ['Title, product type, quantity, price and city are required.', 'Le titre, le type de produit, la quantité, le prix et la ville sont obligatoires.', 'العنوان ونوع المنتج والكمية والسعر والمدينة مطلوبة.'],
    'Gönderilemedi: {m}': ['Could not be sent: {m}', 'Envoi impossible : {m}', 'تعذّر الإرسال: {m}'],
    'İlanınız alındı. İncelendikten sonra yayınlanacak ve sizinle iletişime geçeceğiz.': ['Your listing has been received. It will be published after review and we will contact you.', 'Votre annonce a été reçue. Elle sera publiée après examen et nous vous contacterons.', 'تم استلام إعلانك. سيتم نشره بعد المراجعة وسنتواصل معك.'],

    // ---- İlanlar / detay
    'İlanlar | Hammadde360': ['Listings | Hammadde360', 'Annonces | Hammadde360', 'الإعلانات | Hammadde360'],
    'Yayındaki hammadde ilanları. Sorularınız ve teklifleriniz için WhatsApp\'tan bize yazabilirsiniz.': ['Published raw material listings. You can message us on WhatsApp with your questions and offers.', 'Annonces de matières premières publiées. Écrivez-nous sur WhatsApp pour vos questions et offres.', 'إعلانات المواد الخام المنشورة. يمكنك مراسلتنا عبر واتساب لأسئلتك وعروضك.'],
    'Ara: ürün, şehir...': ['Search: product, city...', 'Rechercher : produit, ville...', 'بحث: منتج، مدينة...'],
    'Tüm kategoriler': ['All categories', 'Toutes les catégories', 'جميع الفئات'],
    'Şu anda gösterilecek ilan yok.': ['There are no listings to show right now.', 'Aucune annonce à afficher pour le moment.', 'لا توجد إعلانات لعرضها حاليًا.'],
    'Detay': ['Details', 'Détails', 'التفاصيل'],
    'WhatsApp ile sor': ['Ask on WhatsApp', 'Demander sur WhatsApp', 'اسأل عبر واتساب'],
    'Nakit ödemede %{n} iskonto': ['{n}% discount for cash payment', '{n} % de remise pour paiement comptant', 'خصم {n}% عند الدفع النقدي'],
    '/ {u} + %{v} KDV': ['/ {u} + {v}% VAT', '/ {u} + TVA {v} %', '/ {u} + ضريبة {v}%'],
    'Merhaba, #{id} numaralı "{title}" ilanı hakkında bilgi almak istiyorum.': ['Hello, I would like information about listing #{id} "{title}".', 'Bonjour, je souhaite des informations sur l\'annonce n°{id} « {title} ».', 'مرحبًا، أود الحصول على معلومات حول الإعلان رقم #{id} "{title}".'],
    'İlan Detayı | Hammadde360': ['Listing Details | Hammadde360', 'Détails de l\'annonce | Hammadde360', 'تفاصيل الإعلان | Hammadde360'],
    'İlan bulunamadı.': ['Listing not found.', 'Annonce introuvable.', 'لم يتم العثور على الإعلان.'],
    'İlan bulunamadı veya yayından kaldırılmış.': ['Listing not found or no longer published.', 'Annonce introuvable ou retirée.', 'لم يتم العثور على الإعلان أو تم إلغاء نشره.'],
    'İlanlara dön': ['Back to listings', 'Retour aux annonces', 'العودة إلى الإعلانات'],
    '← İlanlara dön': ['← Back to listings', '← Retour aux annonces', '← العودة إلى الإعلانات'],
    'İlan #{id} · {d}': ['Listing #{id} · {d}', 'Annonce n°{id} · {d}', 'الإعلان #{id} · {d}'],
    '(TCMB döviz satış kuru)': ['(CBRT selling rate)', '(taux vendeur BCRT)', '(سعر البيع للبنك المركزي التركي)'],
    'Nakit ödemede %{n} iskonto:': ['{n}% discount for cash payment:', 'Remise de {n} % pour paiement comptant :', 'خصم {n}% عند الدفع النقدي:'],
    'WhatsApp ile sor / teklif ver': ['Ask / make an offer on WhatsApp', 'Demander / faire une offre sur WhatsApp', 'اسأل / قدّم عرضًا عبر واتساب'],
    'Fiyatlar USD cinsindendir ve KDV hariçtir; bu ilan için KDV oranı %{v} olup fiyata ayrıca eklenir. Faturalandırma, fatura tarihindeki TCMB döviz satış kuru esas alınarak TL olarak yapılır.': ['Prices are in USD and exclude VAT; the VAT rate for this listing is {v}% and is added to the price. Invoicing is done in TRY at the CBRT selling rate on the invoice date.', 'Les prix sont en USD et hors TVA ; le taux de TVA de cette annonce est de {v} % et s\'ajoute au prix. La facturation est faite en TRY au taux vendeur de la BCRT à la date de la facture.', 'الأسعار بالدولار الأمريكي وغير شاملة الضريبة؛ نسبة ضريبة القيمة المضافة لهذا الإعلان {v}% وتُضاف إلى السعر. تتم الفوترة بالليرة التركية وفق سعر البيع للبنك المركزي التركي في تاريخ الفاتورة.'],
    'Konum': ['Location', 'Localisation', 'الموقع'],

    // ---- Katalog (sektör / ürün grubu / marka / ürün kodu) ve talepler
    'Sektör': ['Sector', 'Secteur', 'القطاع'],
    'Ürün grubu': ['Product group', 'Groupe de produits', 'مجموعة المنتج'],
    'Marka': ['Brand', 'Marque', 'العلامة التجارية'],
    'Ürün kodu': ['Product code', 'Code produit', 'رمز المنتج'],
    'LİSTEDE YOK': ['NOT IN LIST', 'NON LISTÉ', 'غير موجود في القائمة'],
    'Aradığınız ürün listede yok.': ['The product you are looking for is not in the list.', 'Le produit recherché ne figure pas dans la liste.', 'المنتج الذي تبحث عنه غير موجود في القائمة.'],
    'Aşağıdaki bilgileri BÜYÜK HARFLE yazın. Talebiniz incelenip kataloğa eklenir.': ['Write the details below in CAPITAL LETTERS. Your request will be reviewed and added to the catalogue.', 'Saisissez les informations ci-dessous en MAJUSCULES. Votre demande sera examinée puis ajoutée au catalogue.', 'اكتب المعلومات أدناه بالأحرف الكبيرة. سيتم مراجعة طلبك وإضافته إلى الكتالوج.'],
    'Sektör adı': ['Sector name', 'Nom du secteur', 'اسم القطاع'],
    'Ürün grubu adı': ['Product group name', 'Nom du groupe de produits', 'اسم مجموعة المنتج'],
    'Marka adı': ['Brand name', 'Nom de la marque', 'اسم العلامة التجارية'],
    'Notunuz (isteğe bağlı)': ['Your note (optional)', 'Votre note (facultatif)', 'ملاحظتك (اختياري)'],
    'Talebi Gönder': ['Submit Request', 'Envoyer la demande', 'إرسال الطلب'],
    'Taleplerim': ['My Requests', 'Mes demandes', 'طلباتي'],
    'Talep': ['Request', 'Demande', 'الطلب'],
    'Henüz talebiniz yok.': ['You have no requests yet.', 'Vous n\'avez pas encore de demande.', 'ليس لديك طلبات بعد.'],
    'Lütfen tüm alanları BÜYÜK HARFLE doldurun.': ['Please fill in all fields in CAPITAL LETTERS.', 'Veuillez remplir tous les champs en MAJUSCULES.', 'يرجى ملء جميع الحقول بالأحرف الكبيرة.'],
    'Talebiniz alındı. 30 dakika içinde dönüş sağlanacaktır. İşlem tamamlandığında e-posta ile bilgilendirileceksiniz.': ['Your request has been received. We will respond within 30 minutes. You will be notified by email when it is completed.', 'Votre demande a été reçue. Une réponse vous sera apportée sous 30 minutes. Vous serez informé par e-mail une fois le traitement terminé.', 'تم استلام طلبك. سيتم الرد خلال 30 دقيقة. سيتم إعلامك عبر البريد الإلكتروني عند اكتمال المعالجة.'],
    'Evet, bu ürün': ['Yes, this product', 'Oui, ce produit', 'نعم، هذا المنتج'],
    'Hayır, farklı bir ürün': ['No, a different product', 'Non, un autre produit', 'لا، منتج مختلف'],
    'İnceleniyor': ['Under review', 'En cours d\'examen', 'قيد المراجعة'],
    'Oluşturuldu, ilan verebilirsiniz': ['Created, you can post a listing', 'Créé, vous pouvez publier une annonce', 'تم الإنشاء، يمكنك إضافة إعلان'],
    'Yanıtınız bekleniyor': ['Awaiting your reply', 'En attente de votre réponse', 'بانتظار ردك'],
    'Onaylandı': ['Confirmed', 'Confirmé', 'تم التأكيد'],
    'İşleniyor': ['Processing', 'En cours de traitement', 'قيد المعالجة'],
    'Başlık, miktar, fiyat ve şehir zorunludur.': ['Title, quantity, price and city are required.', 'Le titre, la quantité, le prix et la ville sont obligatoires.', 'العنوان والكمية والسعر والمدينة مطلوبة.'],
    'YOĞUNLUK': ['DENSITY', 'DENSITÉ', 'الكثافة'],
    'PLASTİK': ['PLASTICS', 'PLASTIQUES', 'البلاستيك'],
    'İlgilendiğiniz ürün grupları': ['Product groups you are interested in', 'Groupes de produits qui vous intéressent', 'مجموعات المنتجات التي تهتم بها'],
    'Sattığınız ürün grupları': ['Product groups you sell', 'Groupes de produits que vous vendez', 'مجموعات المنتجات التي تبيعها'],
    'Lütfen ilgilendiğiniz en az bir ürün grubunu seçin.': ['Please select at least one product group you are interested in.', 'Veuillez sélectionner au moins un groupe de produits qui vous intéresse.', 'يرجى اختيار مجموعة منتجات واحدة على الأقل تهتم بها.'],
    // ---- Haberler
    'Haberler': ['News', 'Actualités', 'الأخبار'],
    'Sektörden Haberler': ['Industry News', 'Actualités du secteur', 'أخبار القطاع'],
    'Plastik sektöründen güncel haberler': ['Latest news from the plastics industry', 'Dernières actualités du secteur des plastiques', 'آخر أخبار قطاع البلاستيك'],
    'Tüm haberler': ['All news', 'Toutes les actualités', 'جميع الأخبار'],
    'Kaynak:': ['Source:', 'Source :', 'المصدر:'],
    'Henüz haber yok.': ['No news yet.', 'Aucune actualité pour le moment.', 'لا توجد أخبار بعد.'],
    'Haberler yüklenemedi.': ['News could not be loaded.', 'Impossible de charger les actualités.', 'تعذّر تحميل الأخبار.'],
    'Haberler otomatik taranır ve kısaca özetlenir. Ayrıntı ve doğruluk için lütfen kaynağı kontrol edin.': ['News is collected automatically and briefly summarised. Please check the source for details and accuracy.', 'Les actualités sont collectées automatiquement et résumées brièvement. Veuillez consulter la source pour les détails et leur exactitude.', 'يتم جمع الأخبار تلقائيًا وتلخيصها باختصار. يرجى مراجعة المصدر للتفاصيل والتحقق من الدقة.'],
    'Haberler | Hammadde360': ['News | Hammadde360', 'Actualités | Hammadde360', 'الأخبار | Hammadde360'],
    // ---- Depo teslim / TDS
    'Bulunduğu şehir (depo teslim)': ['City where located (ex-warehouse)', 'Ville où se trouve la marchandise (départ entrepôt)', 'المدينة التي توجد بها (تسليم من المستودع)'],
    'Fiyatlar depo teslimdir (ürünün bulunduğu şehirde). Nakliye dahil fiyat talep edilirse alıcılar bizimle iletişime geçer.': ['Prices are ex-warehouse (in the city where the goods are located). If a delivered price including freight is requested, buyers contact us.', 'Les prix s\'entendent départ entrepôt (dans la ville où se trouve la marchandise). Pour un prix transport inclus, les acheteurs nous contactent.', 'الأسعار تسليم من المستودع (في المدينة التي توجد بها البضاعة). عند طلب سعر شامل الشحن يتواصل المشترون معنا.'],
    'Fiyatlar depo teslimdir (ürünün bulunduğu şehirde). Nakliye dahil fiyat için bizimle iletişime geçebilirsiniz.': ['Prices are ex-warehouse (in the city where the goods are located). Contact us for a delivered price including freight.', 'Les prix s\'entendent départ entrepôt (dans la ville où se trouve la marchandise). Contactez-nous pour un prix transport inclus.', 'الأسعار تسليم من المستودع (في المدينة التي توجد بها البضاعة). تواصل معنا للحصول على سعر شامل الشحن.'],
    'TDS (teknik veri sayfası, PDF)': ['TDS (technical data sheet, PDF)', 'TDS (fiche technique, PDF)', 'TDS (ورقة البيانات الفنية، PDF)'],
    'İsteğe bağlı': ['Optional', 'Facultatif', 'اختياري'],
    'Yüklemezseniz sistem, üreticinin sitesinden TDS\'yi kendisi bulmaya çalışır.': ['If you do not upload one, the system tries to find the TDS on the manufacturer\'s website by itself.', 'Si vous n\'en téléversez pas, le système tente de trouver la TDS sur le site du fabricant.', 'إذا لم تقم بالتحميل، سيحاول النظام العثور على TDS في موقع الشركة المصنّعة تلقائيًا.'],
    'Tüm alanlar zorunludur (TDS hariç).': ['All fields are required (except TDS).', 'Tous les champs sont obligatoires (sauf la TDS).', 'جميع الحقول مطلوبة (باستثناء TDS).'],
    'TDS dosyası en fazla 5 MB ve PDF olmalıdır.': ['The TDS file must be a PDF of at most 5 MB.', 'Le fichier TDS doit être un PDF de 5 Mo maximum.', 'يجب أن يكون ملف TDS بصيغة PDF وبحجم أقصاه 5 ميغابايت.'],
    'TDS yüklenemedi: {m}': ['TDS could not be uploaded: {m}', 'Échec du téléversement de la TDS : {m}', 'تعذّر تحميل TDS: {m}'],
    'Depo teslim': ['Ex-warehouse', 'Départ entrepôt', 'تسليم من المستودع'],
    'Tüm şehirler': ['All cities', 'Toutes les villes', 'جميع المدن'],
    'TDS indir (PDF)': ['Download TDS (PDF)', 'Télécharger la TDS (PDF)', 'تنزيل TDS (PDF)'],
    'TDS (üretici)': ['TDS (manufacturer)', 'TDS (fabricant)', 'TDS (الشركة المصنّعة)'],
    'Teknik veri sayfası (TDS)': ['Technical data sheet (TDS)', 'Fiche technique (TDS)', 'ورقة البيانات الفنية (TDS)'],
    // ---- Palet
    'Palet başına miktar': ['Quantity per pallet', 'Quantité par palette', 'الكمية لكل منصة نقالة'],
    'Minimum sipariş 1 palettir.': ['Minimum order is 1 pallet.', 'La commande minimale est de 1 palette.', 'الحد الأدنى للطلب منصة واحدة.'],
    '≈ {n} palet': ['≈ {n} pallets', '≈ {n} palettes', '≈ {n} منصة'],
    'Palet bazlı fiyat kademeleri': ['Pallet-based price tiers', 'Paliers de prix par palette', 'شرائح الأسعار حسب المنصات'],
    '1 palet fiyatı yukarıdaki birim fiyattır. Daha fazla palet için daha düşük fiyat verebilirsiniz.': ['The price for 1 pallet is the unit price above. You can offer a lower price for more pallets.', 'Le prix pour 1 palette est le prix unitaire ci-dessus. Vous pouvez proposer un prix plus bas pour plusieurs palettes.', 'سعر منصة واحدة هو سعر الوحدة أعلاه. يمكنك تقديم سعر أقل لعدد أكبر من المنصات.'],
    'Palet ve üzeri': ['Pallets or more', 'Palettes ou plus', 'منصات أو أكثر'],
    'Fiyat kademeleri geçersiz: palet sayısı artmalı, fiyat bir öncekinden yüksek olmamalı.': ['Invalid price tiers: pallet counts must increase and prices must not exceed the previous tier.', 'Paliers de prix invalides : le nombre de palettes doit augmenter et le prix ne doit pas dépasser celui du palier précédent.', 'شرائح الأسعار غير صالحة: يجب أن يزداد عدد المنصات ولا يزيد السعر عن الشريحة السابقة.'],
    'Toplam miktar en az 1 palet olmalıdır.': ['The total quantity must be at least 1 pallet.', 'La quantité totale doit être d\'au moins 1 palette.', 'يجب أن تكون الكمية الإجمالية منصة واحدة على الأقل.'],
    'Palet bazlı fiyat': ['Pallet-based pricing', 'Prix par palette', 'التسعير حسب المنصات'],
    'Minimum sipariş: 1 palet ({q} {u})': ['Minimum order: 1 pallet ({q} {u})', 'Commande minimale : 1 palette ({q} {u})', 'الحد الأدنى للطلب: منصة واحدة ({q} {u})'],
    'Min. sipariş: 1 palet ({q} {u})': ['Min. order: 1 pallet ({q} {u})', 'Cmd min. : 1 palette ({q} {u})', 'الحد الأدنى: منصة واحدة ({q} {u})'],
    '{n} palet ve üzeri': ['{n} pallets or more', '{n} palettes ou plus', '{n} منصات أو أكثر'],
    'Palet': ['Pallet', 'Palette', 'المنصة'],
    'palet': ['pallet', 'palette', 'منصة'],
    'Min. sipariş': ['Min. order', 'Cmd min.', 'الحد الأدنى للطلب'],
    'Birim fiyat (USD, + KDV)': ['Unit price (USD, + VAT)', 'Prix unitaire (USD, + TVA)', 'سعر الوحدة (دولار، + ضريبة)'],
    'Birim fiyat': ['Unit price', 'Prix unitaire', 'سعر الوحدة'],
    'TL karşılığı': ['TRY equivalent', 'Équivalent en TRY', 'ما يعادله بالليرة'],
    'Palet sayısı': ['Number of pallets', 'Nombre de palettes', 'عدد المنصات'],
    'Toplam': ['Total', 'Total', 'الإجمالي'],
    'KDV': ['VAT', 'TVA', 'ضريبة القيمة المضافة'],
    'Merhaba, #{id} numaralı "{title}" ilanı için {n} palet ({q} {u}) hakkında bilgi almak istiyorum.': ['Hello, I would like information about listing #{id} "{title}" for {n} pallet(s) ({q} {u}).', 'Bonjour, je souhaite des informations sur l\'annonce n°{id} « {title} » pour {n} palette(s) ({q} {u}).', 'مرحبًا، أود الحصول على معلومات حول الإعلان رقم #{id} "{title}" لعدد {n} منصة ({q} {u}).'],
    'Tüm markalar': ['All brands', 'Toutes les marques', 'جميع العلامات'],
    'Tüm ürün grupları': ['All product groups', 'Tous les groupes de produits', 'جميع مجموعات المنتجات'],
    'Tüm kullanım alanları': ['All applications', 'Toutes les applications', 'جميع مجالات الاستخدام'],
    'MFI en az': ['MFI min', 'MFI min', 'MFI الأدنى'],
    'MFI en çok': ['MFI max', 'MFI max', 'MFI الأعلى'],
    'Palet ağırlığı (kg)': ['Pallet weight (kg)', 'Poids de la palette (kg)', 'وزن المنصة (كغ)'],
    'Diğer (kg yazın)': ['Other (enter kg)', 'Autre (saisir en kg)', 'أخرى (اكتب بالكغ)'],
    'Palet ağırlığı 100 ile 5000 kg arasında olmalıdır.': ['Pallet weight must be between 100 and 5000 kg.', 'Le poids de la palette doit être compris entre 100 et 5000 kg.', 'يجب أن يكون وزن المنصة بين 100 و5000 كغ.'],
    'Üretici Fiyat Duyuruları': ['Manufacturer Price Announcements', 'Annonces de prix des producteurs', 'إعلانات أسعار المصنّعين'],
    'Fiyat duyuruları üyelere özeldir.': ['Price announcements are for members only.', 'Les annonces de prix sont réservées aux membres.', 'إعلانات الأسعار للأعضاء فقط.'],
    'Giriş yap veya üye ol': ['Log in or sign up', 'Se connecter ou s\'inscrire', 'سجّل الدخول أو انضم'],
    'Fiyat duyuruları yüklenemedi.': ['Price announcements could not be loaded.', 'Impossible de charger les annonces de prix.', 'تعذّر تحميل إعلانات الأسعار.'],
    'Henüz fiyat duyurusu yok.': ['No price announcements yet.', 'Aucune annonce de prix pour le moment.', 'لا توجد إعلانات أسعار بعد.'],
    'ZAM': ['INCREASE', 'HAUSSE', 'زيادة'],
    'İNDİRİM': ['DISCOUNT', 'BAISSE', 'خصم'],
    'Tüm ürünler': ['All products', 'Tous les produits', 'جميع المنتجات'],
    'Geçerlilik:': ['Effective:', 'En vigueur :', 'ساري من:'],
    'Bilgi amaçlıdır; kesin fiyat ve koşullar için bizimle iletişime geçin.': ['For information only; contact us for exact prices and terms.', 'À titre indicatif ; contactez-nous pour les prix et conditions exacts.', 'للاطلاع فقط؛ تواصل معنا للحصول على الأسعار والشروط الدقيقة.'],
    'KULLANIM ALANI': ['APPLICATION', 'APPLICATION', 'مجال الاستخدام'],
    'ENJEKSİYON': ['INJECTION MOLDING', 'INJECTION', 'الحقن'],
    'EKSTRÜZYON': ['EXTRUSION', 'EXTRUSION', 'البثق'],
    'FİLM': ['FILM', 'FILM', 'أفلام'],
    'BORU / PROFİL': ['PIPE / PROFILE', 'TUYAU / PROFILÉ', 'أنابيب / بروفيلات'],
    'ÜFLEME (ŞİŞİRME)': ['BLOW MOLDING', 'SOUFFLAGE', 'النفخ'],
    'TERMOFORM': ['THERMOFORMING', 'THERMOFORMAGE', 'التشكيل الحراري'],
    'ELYAF / İPLİK': ['FIBRE / YARN', 'FIBRE / FIL', 'ألياف / خيوط'],
    'KABLO': ['CABLE', 'CÂBLE', 'كابلات'],
    'DİĞER': ['OTHER', 'AUTRE', 'أخرى']
  };

  // Rusça çeviriler ayrı dosyada (js/i18n-ru.js), dizinin 4. elemanı olarak birleştirilir
  const RU = window.I18N_RU || {};
  Object.keys(RU).forEach(k => { if (D[k]) D[k][3] = RU[k]; });

  const norm = s => s.replace(/\s+/g, ' ').trim();
  const fmt = (s, v) => v ? s.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m)) : s;
  function t(key, v) {
    const e = D[key];
    const out = (lang !== 'tr' && e && e[IDX[lang]]) ? e[IDX[lang]] : key;
    return fmt(out, v);
  }

  function node(n) {
    if (lang === 'tr' || !n.nodeValue) return;
    const p = n.parentNode && n.parentNode.nodeName;
    if (p === 'SCRIPT' || p === 'STYLE') return;
    const k = norm(n.nodeValue);
    const e = k && D[k];
    if (e && e[IDX[lang]]) {
      const raw = n.nodeValue;
      n.nodeValue = raw.match(/^\s*/)[0] + e[IDX[lang]] + raw.match(/\s*$/)[0];
    }
  }
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  function el(e) {
    if (lang === 'tr') return;
    ATTRS.forEach(a => {
      const v = e.getAttribute && e.getAttribute(a);
      const d = v && D[norm(v)];
      if (d && d[IDX[lang]]) e.setAttribute(a, d[IDX[lang]]);
    });
    const hk = e.getAttribute && e.getAttribute('data-i18n-html');
    if (hk && D[hk] && D[hk][IDX[lang]]) e.innerHTML = D[hk][IDX[lang]];
  }
  function walk(root) {
    if (lang === 'tr' || !root) return;
    if (root.nodeType === 3) return node(root);
    if (root.nodeType !== 1) return;
    el(root);
    root.querySelectorAll('[placeholder],[title],[aria-label],[alt],[data-i18n-html]').forEach(el);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) node(n);
  }

  function mountSwitcher() {
    const menu = document.getElementById('menu');
    if (!menu || menu.querySelector('.langsel')) return;
    const s = document.createElement('select');
    s.className = 'langsel';
    s.setAttribute('aria-label', 'Language');
    [['tr', 'Türkçe'], ['en', 'English'], ['fr', 'Français'], ['ar', 'العربية'], ['ru', 'Русский']].forEach(([c, n]) => {
      const o = document.createElement('option'); o.value = c; o.textContent = n; if (c === lang) o.selected = true; s.appendChild(o);
    });
    s.addEventListener('change', () => { try { localStorage.setItem('lang', s.value); } catch (e) {} location.reload(); });
    menu.appendChild(s);
  }

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  function start() {
    // <title> ve meta açıklaması
    if (lang !== 'tr') {
      const tt = D[norm(document.title)];
      if (tt && tt[IDX[lang]]) document.title = tt[IDX[lang]];
      const md = document.querySelector('meta[name="description"]');
      if (md) { const d = D[norm(md.content)]; if (d && d[IDX[lang]]) md.content = d[IDX[lang]]; }
    }
    walk(document.body);
    mountSwitcher();
    new MutationObserver(muts => {
      muts.forEach(m => m.addedNodes.forEach(walk));
      mountSwitcher();
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.I18N = { lang, locale: LOCALES[lang], t, dir: lang === 'ar' ? 'rtl' : 'ltr' };
  window.t = t;
})();
