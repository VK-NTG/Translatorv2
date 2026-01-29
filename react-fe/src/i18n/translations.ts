// Interface translations for different languages
export interface Translation {
  // Language Modal
  selectLanguage: string
  loadingLanguages: string
  creatingSession: string

  // Chat Panel
  finishSession: string
  readAloud: string

  // Input Controls
  typeMessage: string
  sendMessage: string
  startRecording: string
  stopRecording: string

  // Info Modal
  welcomeTitle: string
  welcomeMessage: string
  howItWorks: string
  step1: string
  step2: string
  step3: string
  startTranslating: string

  // General
  loading: string
  error: string
  ok: string
  cancel: string
  originalText: string
  translating: string
}

export const translations: Record<string, Translation> = {
  'da-DK': {
    // Language Modal
    selectLanguage: 'Vælg sprog for at starte:',
    loadingLanguages: 'Henter sprog…',
    creatingSession: 'Opretter session…',

    // Chat Panel
    finishSession: 'Afslut session',
    readAloud: 'Læs højt',

    // Input Controls
    typeMessage: 'Skriv din besked...',
    sendMessage: 'Send besked',
    startRecording: 'Start optagelse',
    stopRecording: 'Stop optagelse',

    // Info Modal
    welcomeTitle: 'Velkommen til Kalundborg Kommunes Tolkeløsning',
    welcomeMessage: 'Denne løsning hjælper dig med at kommunikere på dansk og dit valgte sprog.',
    howItWorks: 'Sådan virker det:',
    step1: '1. Skriv eller tal din besked',
    step2: '2. Beskeden oversættes automatisk',
    step3: '3. Den anden person kan høre og svare',
    startTranslating: 'Begynd at oversætte',

    // General
    loading: 'Indlæser...',
    error: 'Fejl',
    ok: 'OK',
    cancel: 'Annuller',
    originalText: 'Original',
    translating: 'Oversætter...'
  },

  'en-US': {
    // Language Modal
    selectLanguage: 'Select language to start:',
    loadingLanguages: 'Loading languages…',
    creatingSession: 'Creating session…',

    // Chat Panel
    finishSession: 'Finish session',
    readAloud: 'Read aloud',

    // Input Controls
    typeMessage: 'Type your message...',
    sendMessage: 'Send message',
    startRecording: 'Start recording',
    stopRecording: 'Stop recording',

    // Info Modal
    welcomeTitle: 'Welcome to Kalundborg Municipality\'s Interpreter Solution',
    welcomeMessage: 'This solution helps you communicate in Danish and your chosen language.',
    howItWorks: 'How it works:',
    step1: '1. Write or speak your message',
    step2: '2. The message is automatically translated',
    step3: '3. The other person can listen and respond',
    startTranslating: 'Start translating',

    // General
    loading: 'Loading...',
    error: 'Error',
    ok: 'OK',
    cancel: 'Cancel',
    originalText: 'Original',
    translating: 'Translating...'
  },

  'ar': {
    // Language Modal
    selectLanguage: 'اختر اللغة للبدء:',
    loadingLanguages: 'تحميل اللغات…',
    creatingSession: 'إنشاء جلسة…',

    // Chat Panel
    finishSession: 'إنهاء الجلسة',
    readAloud: 'اقرأ بصوت عالٍ',

    // Input Controls
    typeMessage: 'اكتب رسالتك...',
    sendMessage: 'إرسال الرسالة',
    startRecording: 'بدء التسجيل',
    stopRecording: 'إيقاف التسجيل',

    // Info Modal
    welcomeTitle: 'مرحباً بك في حل الترجمة لبلدية كالوندبورغ',
    welcomeMessage: 'يساعدك هذا الحل على التواصل باللغة الدنماركية ولغتك المختارة.',
    howItWorks: 'كيف يعمل:',
    step1: '1. اكتب أو تحدث برسالتك',
    step2: '2. يتم ترجمة الرسالة تلقائياً',
    step3: '3. يمكن للشخص الآخر الاستماع والرد',
    startTranslating: 'ابدأ الترجمة',

    // General
    loading: 'تحميل...',
    error: 'خطأ',
    ok: 'موافق',
    cancel: 'إلغاء',
    originalText: 'الأصلي',
    translating: 'جار الترجمة...'
  },

  'uk': {
    // Language Modal
    selectLanguage: 'Оберіть мову для початку:',
    loadingLanguages: 'Завантаження мов…',
    creatingSession: 'Створення сесії…',

    // Chat Panel
    finishSession: 'Завершити сесію',
    readAloud: 'Читати вголос',

    // Input Controls
    typeMessage: 'Введіть ваше повідомлення...',
    sendMessage: 'Надіслати повідомлення',
    startRecording: 'Почати запис',
    stopRecording: 'Зупинити запис',

    // Info Modal
    welcomeTitle: 'Ласкаво просимо до рішення перекладача муніципалітету Калундборг',
    welcomeMessage: 'Це рішення допомагає вам спілкуватися данською та вашою обраною мовою.',
    howItWorks: 'Як це працює:',
    step1: '1. Напишіть або скажіть ваше повідомлення',
    step2: '2. Повідомлення автоматично перекладається',
    step3: '3. Інша людина може слухати та відповідати',
    startTranslating: 'Почати переклад',

    // General
    loading: 'Завантаження...',
    error: 'Помилка',
    ok: 'ОК',
    cancel: 'Скасувати',
    originalText: 'Оригінальний',
    translating: 'Перекладається...'
  },

  'so': {
    // Language Modal
    selectLanguage: 'Dooro luqadda si aad u bilowdo:',
    loadingLanguages: 'Luqadaha soo raraya…',
    creatingSession: 'Fadhi samaynaya…',

    // Chat Panel
    finishSession: 'Dhammaystir fadhiga',
    readAloud: 'Ku akhri cod dheer',

    // Input Controls
    typeMessage: 'Qor fariintaada...',
    sendMessage: 'Dir fariinta',
    startRecording: 'Bilaw duubitaanka',
    stopRecording: 'Jooji duubitaanka',

    // Info Modal
    welcomeTitle: 'Ku soo dhawoow xalka turjumaadda ee Degmada Kalundborg',
    welcomeMessage: 'Xalkan wuxuu kaa caawiyaa inaad kala hadashid Danish-ka iyo luqaddaada la doortay.',
    howItWorks: 'Sida uu u shaqeeyo:',
    step1: '1. Qor ama ku hadal fariintaada',
    step2: '2. Fariinta si otomaatig ah loo turjumaa',
    step3: '3. Qofka kale wuu dhegaysan karaa wuuna jawaabi karaa',
    startTranslating: 'Bilow turjumaadda',

    // General
    loading: 'Soo raraya...',
    error: 'Khalad',
    ok: 'Haa',
    cancel: 'Ka noqo',
    originalText: 'Asalka ah',
    translating: 'Waa la turjumayaa...'
  },

  'de': {
    // Language Modal
    selectLanguage: 'Sprache zum Starten auswählen:',
    loadingLanguages: 'Sprachen laden…',
    creatingSession: 'Sitzung wird erstellt…',

    // Chat Panel
    finishSession: 'Sitzung beenden',
    readAloud: 'Vorlesen',

    // Input Controls
    typeMessage: 'Ihre Nachricht eingeben...',
    sendMessage: 'Nachricht senden',
    startRecording: 'Aufnahme starten',
    stopRecording: 'Aufnahme stoppen',

    // Info Modal
    welcomeTitle: 'Willkommen zur Dolmetscherlösung der Gemeinde Kalundborg',
    welcomeMessage: 'Diese Lösung hilft Ihnen, auf Dänisch und in Ihrer gewählten Sprache zu kommunizieren.',
    howItWorks: 'So funktioniert es:',
    step1: '1. Schreiben oder sprechen Sie Ihre Nachricht',
    step2: '2. Die Nachricht wird automatisch übersetzt',
    step3: '3. Die andere Person kann zuhören und antworten',
    startTranslating: 'Mit der Übersetzung beginnen',

    // General
    loading: 'Lädt...',
    error: 'Fehler',
    ok: 'OK',
    cancel: 'Abbrechen',
    originalText: 'Original',
    translating: 'Übersetzt...'
  },

  'fr': {
    // Language Modal
    selectLanguage: 'Sélectionnez la langue pour commencer:',
    loadingLanguages: 'Chargement des langues…',
    creatingSession: 'Création de la session…',

    // Chat Panel
    finishSession: 'Terminer la session',
    readAloud: 'Lire à haute voix',

    // Input Controls
    typeMessage: 'Tapez votre message...',
    sendMessage: 'Envoyer le message',
    startRecording: 'Commencer l\'enregistrement',
    stopRecording: 'Arrêter l\'enregistrement',

    // Info Modal
    welcomeTitle: 'Bienvenue à la Solution d\'Interprétation de la Commune de Kalundborg',
    welcomeMessage: 'Cette solution vous aide à communiquer en danois et dans votre langue choisie.',
    howItWorks: 'Voici comment cela fonctionne:',
    step1: '1. Écrivez ou parlez votre message',
    step2: '2. Le message est traduit automatiquement',
    step3: '3. L\'autre personne peut écouter et répondre',
    startTranslating: 'Commencer la traduction',

    // General
    loading: 'Chargement...',
    error: 'Erreur',
    ok: 'OK',
    cancel: 'Annuler',
    originalText: 'Original',
    translating: 'Traduction...'
  },

  'es': {
    // Language Modal
    selectLanguage: 'Selecciona el idioma para comenzar:',
    loadingLanguages: 'Cargando idiomas…',
    creatingSession: 'Creando sesión…',

    // Chat Panel
    finishSession: 'Terminar sesión',
    readAloud: 'Leer en voz alta',

    // Input Controls
    typeMessage: 'Escribe tu mensaje...',
    sendMessage: 'Enviar mensaje',
    startRecording: 'Iniciar grabación',
    stopRecording: 'Detener grabación',

    // Info Modal
    welcomeTitle: 'Bienvenido a la Solución de Interpretación del Municipio de Kalundborg',
    welcomeMessage: 'Esta solución te ayuda a comunicarte en danés y en tu idioma elegido.',
    howItWorks: 'Así es como funciona:',
    step1: '1. Escribe o habla tu mensaje',
    step2: '2. El mensaje se traduce automáticamente',
    step3: '3. La otra persona puede escuchar y responder',
    startTranslating: 'Empezar a traducir',

    // General
    loading: 'Cargando...',
    error: 'Error',
    ok: 'OK',
    cancel: 'Cancelar',
    originalText: 'Original',
    translating: 'Traduciendo...'
  },

  'sv': {
    // Language Modal
    selectLanguage: 'Välj språk för att börja:',
    loadingLanguages: 'Laddar språk…',
    creatingSession: 'Skapar session…',

    // Chat Panel
    finishSession: 'Avsluta session',
    readAloud: 'Läs upp',

    // Input Controls
    typeMessage: 'Skriv ditt meddelande...',
    sendMessage: 'Skicka meddelande',
    startRecording: 'Börja inspelning',
    stopRecording: 'Stoppa inspelning',

    // Info Modal
    welcomeTitle: 'Välkommen till Kalundborg Kommuns Tolkningslösning',
    welcomeMessage: 'Denna lösning hjälper dig att kommunicera på danska och ditt valda språk.',
    howItWorks: 'Så här fungerar det:',
    step1: '1. Skriv eller säg ditt meddelande',
    step2: '2. Meddelandet översätts automatiskt',
    step3: '3. Den andra personen kan lyssna och svara',
    startTranslating: 'Börja översätta',

    // General
    loading: 'Laddar...',
    error: 'Fel',
    ok: 'OK',
    cancel: 'Avbryt',
    originalText: 'Original',
    translating: 'Översätter...'
  },

  'zh': {
    // Language Modal
    selectLanguage: '选择语言开始:',
    loadingLanguages: '正在加载语言…',
    creatingSession: '正在创建会话…',

    // Chat Panel
    finishSession: '结束会话',
    readAloud: '朗读',

    // Input Controls
    typeMessage: '输入您的消息...',
    sendMessage: '发送消息',
    startRecording: '开始录音',
    stopRecording: '停止录音',

    // Info Modal
    welcomeTitle: '欢迎使用卡伦堡市翻译解决方案',
    welcomeMessage: '此解决方案帮助您用丹麦语和您选择的语言进行交流。',
    howItWorks: '工作原理：',
    step1: '1. 写下或说出您的消息',
    step2: '2. 消息会自动翻译',
    step3: '3. 对方可以听到并回复',
    startTranslating: '开始翻译',

    // General
    loading: '加载中...',
    error: '错误',
    ok: '确定',
    cancel: '取消',
    originalText: '原文',
    translating: '翻译中...'
  },

  'he': {
    // Language Modal
    selectLanguage: 'בחר שפה כדי להתחיל:',
    loadingLanguages: 'טוען שפות…',
    creatingSession: 'יוצר הפעלה…',

    // Chat Panel
    finishSession: 'סיים הפעלה',
    readAloud: 'קרא בקול רם',

    // Input Controls
    typeMessage: 'הקלד את ההודעה שלך...',
    sendMessage: 'שלח הודעה',
    startRecording: 'התחל הקלטה',
    stopRecording: 'עצור הקלטה',

    // Info Modal
    welcomeTitle: 'ברוכים הבאים לפתרון התרגום של עיריית קלונדבורג',
    welcomeMessage: 'פתרון זה עוזר לכם לתקשר בדנית ובשפה שבחרתם.',
    howItWorks: 'כך זה עובד:',
    step1: '1. כתבו או אמרו את ההודעה שלכם',
    step2: '2. ההודעה מתורגמת אוטומטית',
    step3: '3. האדם השני יכול להאזין ולהגיב',
    startTranslating: 'התחל לתרגם',

    // General
    loading: 'טוען...',
    error: 'שגיאה',
    ok: 'אוקיי',
    cancel: 'ביטול',
    originalText: 'מקורי',
    translating: 'מתרגם...'
  },

  'pt': {
    // Language Modal
    selectLanguage: 'Selecione o idioma para começar:',
    loadingLanguages: 'Carregando idiomas…',
    creatingSession: 'Criando sessão…',

    // Chat Panel
    finishSession: 'Finalizar sessão',
    readAloud: 'Ler em voz alta',

    // Input Controls
    typeMessage: 'Digite sua mensagem...',
    sendMessage: 'Enviar mensagem',
    startRecording: 'Iniciar gravação',
    stopRecording: 'Parar gravação',

    // Info Modal
    welcomeTitle: 'Bem-vindo à Solução de Interpretação do Município de Kalundborg',
    welcomeMessage: 'Esta solução ajuda você a se comunicar em dinamarquês e no seu idioma escolhido.',
    howItWorks: 'Como funciona:',
    step1: '1. Escreva ou fale sua mensagem',
    step2: '2. A mensagem é traduzida automaticamente',
    step3: '3. A outra pessoa pode ouvir e responder',
    startTranslating: 'Começar a traduzir',

    // General
    loading: 'Carregando...',
    error: 'Erro',
    ok: 'OK',
    cancel: 'Cancelar',
    originalText: 'Original',
    translating: 'Traduzindo...'
  },

  'ru': {
    // Language Modal
    selectLanguage: 'Выберите язык для начала:',
    loadingLanguages: 'Загрузка языков…',
    creatingSession: 'Создание сессии…',

    // Chat Panel
    finishSession: 'Завершить сессию',
    readAloud: 'Прочитать вслух',

    // Input Controls
    typeMessage: 'Введите ваше сообщение...',
    sendMessage: 'Отправить сообщение',
    startRecording: 'Начать запись',
    stopRecording: 'Остановить запись',

    // Info Modal
    welcomeTitle: 'Добро пожаловать в решение для перевода муниципалитета Калундборг',
    welcomeMessage: 'Это решение поможет вам общаться на датском и выбранном вами языке.',
    howItWorks: 'Как это работает:',
    step1: '1. Напишите или произнесите ваше сообщение',
    step2: '2. Сообщение автоматически переводится',
    step3: '3. Другой человек может слушать и отвечать',
    startTranslating: 'Начать перевод',

    // General
    loading: 'Загрузка...',
    error: 'Ошибка',
    ok: 'ОК',
    cancel: 'Отмена',
    originalText: 'Оригинал',
    translating: 'Переводится...'
  },

  'ja': {
    // Language Modal
    selectLanguage: '開始する言語を選択:',
    loadingLanguages: '言語を読み込み中…',
    creatingSession: 'セッションを作成中…',

    // Chat Panel
    finishSession: 'セッションを終了',
    readAloud: '音読',

    // Input Controls
    typeMessage: 'メッセージを入力してください...',
    sendMessage: 'メッセージを送信',
    startRecording: '録音開始',
    stopRecording: '録音停止',

    // Info Modal
    welcomeTitle: 'カルンボー市の通訳ソリューションへようこそ',
    welcomeMessage: 'このソリューションは、デンマーク語とあなたが選んだ言語でのコミュニケーションをサポートします。',
    howItWorks: '使い方:',
    step1: '1. メッセージを書くか話してください',
    step2: '2. メッセージが自動的に翻訳されます',
    step3: '3. 相手は聞いて返答できます',
    startTranslating: '翻訳を開始',

    // General
    loading: '読み込み中...',
    error: 'エラー',
    ok: 'OK',
    cancel: 'キャンセル',
    originalText: '元のテキスト',
    translating: '翻訳中...'
  },

  'tr': {
    // Language Modal
    selectLanguage: 'Başlamak için dil seçin:',
    loadingLanguages: 'Diller yükleniyor…',
    creatingSession: 'Oturum oluşturuluyor…',

    // Chat Panel
    finishSession: 'Oturumu bitir',
    readAloud: 'Sesli oku',

    // Input Controls
    typeMessage: 'Mesajınızı yazın...',
    sendMessage: 'Mesaj gönder',
    startRecording: 'Kaydı başlat',
    stopRecording: 'Kaydı durdur',

    // Info Modal
    welcomeTitle: 'Kalundborg Belediyesi Tercüme Çözümüne Hoş Geldiniz',
    welcomeMessage: 'Bu çözüm Danca ve seçtiğiniz dilde iletişim kurmanıza yardımcı olur.',
    howItWorks: 'Nasıl çalışır:',
    step1: '1. Mesajınızı yazın veya konuşun',
    step2: '2. Mesaj otomatik olarak çevrilir',
    step3: '3. Diğer kişi dinleyebilir ve yanıt verebilir',
    startTranslating: 'Çeviriye başla',

    // General
    loading: 'Yükleniyor...',
    error: 'Hata',
    ok: 'Tamam',
    cancel: 'İptal',
    originalText: 'Orijinal',
    translating: 'Çevriliyor...'
  },

  'ko': {
    // Language Modal
    selectLanguage: '시작할 언어를 선택하세요:',
    loadingLanguages: '언어 로드 중…',
    creatingSession: '세션 생성 중…',

    // Chat Panel
    finishSession: '세션 종료',
    readAloud: '소리내어 읽기',

    // Input Controls
    typeMessage: '메시지를 입력하세요...',
    sendMessage: '메시지 리운드',
    startRecording: '녹음 시작',
    stopRecording: '녹음 중지',

    // Info Modal
    welcomeTitle: '칼룬보르그 시 통역 솔루션에 오신 것을 환영합니다',
    welcomeMessage: '이 솔루션은 데니시어와 선택하신 언어로 소통하는 데 도움을 줍니다.',
    howItWorks: '작동 방식:',
    step1: '1. 메시지를 작성하거나 말하세요',
    step2: '2. 메시지가 자동으로 번역됩니다',
    step3: '3. 상대방이 듣고 답장할 수 있습니다',
    startTranslating: '번역 시작',

    // General
    loading: '로드 중...',
    error: '오류',
    ok: '확인',
    cancel: '취소',
    originalText: '원문',
    translating: '번역 중...'
  },

  'it': {
    // Language Modal
    selectLanguage: 'Seleziona la lingua per iniziare:',
    loadingLanguages: 'Caricamento lingue…',
    creatingSession: 'Creazione sessione…',

    // Chat Panel
    finishSession: 'Termina sessione',
    readAloud: 'Leggi ad alta voce',

    // Input Controls
    typeMessage: 'Scrivi il tuo messaggio...',
    sendMessage: 'Invia messaggio',
    startRecording: 'Inizia registrazione',
    stopRecording: 'Ferma registrazione',

    // Info Modal
    welcomeTitle: 'Benvenuto alla Soluzione di Interpretazione del Comune di Kalundborg',
    welcomeMessage: 'Questa soluzione ti aiuta a comunicare in danese e nella lingua che hai scelto.',
    howItWorks: 'Come funziona:',
    step1: '1. Scrivi o pronuncia il tuo messaggio',
    step2: '2. Il messaggio viene tradotto automaticamente',
    step3: '3. L\'altra persona può ascoltare e rispondere',
    startTranslating: 'Inizia a tradurre',

    // General
    loading: 'Caricamento...',
    error: 'Errore',
    ok: 'OK',
    cancel: 'Annulla',
    originalText: 'Originale',
    translating: 'Traduzione...'
  },

  'th': {
    // Language Modal
    selectLanguage: 'เลือกภาษาเพื่อเริ่ม:',
    loadingLanguages: 'กำลังโหลดภาษา…',
    creatingSession: 'กำลังสร้างเซสชั่น…',

    // Chat Panel
    finishSession: 'จบเซสชั่น',
    readAloud: 'อ่านออกเสียง',

    // Input Controls
    typeMessage: 'พิมพ์ข้อความของคุณ...',
    sendMessage: 'ส่งข้อความ',
    startRecording: 'เริ่มบันทึก',
    stopRecording: 'หยุดบันทึก',

    // Info Modal
    welcomeTitle: 'ยินดีต้อนรับสู่ระบบการแปลของเทศบาลกาลันด์บอร์ก',
    welcomeMessage: 'ระบบนี้ช่วยคุณสื่อสารเป็นภาษาเดนมาร์กและภาษาที่คุณเลือก',
    howItWorks: 'การทำงาน:',
    step1: '1. เขียนหรือพูดข้อความของคุณ',
    step2: '2. ข้อความจะถูกแปลโดยอัตโนมัติ',
    step3: '3. อีกฝ่ายหนึ่งสามารถฟังและตอบกลับได้',
    startTranslating: 'เริ่มแปล',

    // General
    loading: 'กำลังโหลด...',
    error: 'ข้อผิดพลาด',
    ok: 'ตกลง',
    cancel: 'ยกเลิก',
    originalText: 'ต้นฉบับ',
    translating: 'กำลังแปล...'
  },

  'vi': {
    // Language Modal
    selectLanguage: 'Chọn ngôn ngữ để bắt đầu:',
    loadingLanguages: 'Đang tải ngôn ngữ…',
    creatingSession: 'Đang tạo phiên…',

    // Chat Panel
    finishSession: 'Kết thúc phiên',
    readAloud: 'Đọc to',

    // Input Controls
    typeMessage: 'Nhập tin nhắn của bạn...',
    sendMessage: 'Gửi tin nhắn',
    startRecording: 'Bắt đầu ghi âm',
    stopRecording: 'Dừng ghi âm',

    // Info Modal
    welcomeTitle: 'Chào mừng bạn đến Giải pháp Thông dịch của Thành phố Kalundborg',
    welcomeMessage: 'Giải pháp này giúp bạn giao tiếp bằng tiếng Đan Mạch và ngôn ngữ bạn đã chọn.',
    howItWorks: 'Cách hoạt động:',
    step1: '1. Viết hoặc nói tin nhắn của bạn',
    step2: '2. Tin nhắn sẽ được dịch tự động',
    step3: '3. Người kia có thể nghe và trả lời',
    startTranslating: 'Bắt đầu dịch',

    // General
    loading: 'Đang tải...',
    error: 'Lỗi',
    ok: 'OK',
    cancel: 'Hủy',
    originalText: 'Gốc',
    translating: 'Đang dịch...'
  },

  'pl': {
    // Language Modal
    selectLanguage: 'Wybierz język, aby rozpocząć:',
    loadingLanguages: 'Wczytywanie języków…',
    creatingSession: 'Tworzenie sesji…',

    // Chat Panel
    finishSession: 'Zakończ sesję',
    readAloud: 'Przeczytaj na głos',

    // Input Controls
    typeMessage: 'Wpisz swoją wiadomość...',
    sendMessage: 'Wyślij wiadomość',
    startRecording: 'Rozpocznij nagrywanie',
    stopRecording: 'Zatrzymaj nagrywanie',

    // Info Modal
    welcomeTitle: 'Witamy w Rozwiązaniu Tłumaczeniowym Gminy Kalundborg',
    welcomeMessage: 'To rozwiązanie pomaga w komunikacji po duńsku i w wybranym przez Ciebie języku.',
    howItWorks: 'Jak to działa:',
    step1: '1. Napisz lub powiedz swoją wiadomość',
    step2: '2. Wiadomość zostanie automatycznie przetłumaczona',
    step3: '3. Druga osoba może posłuchać i odpowiedzieć',
    startTranslating: 'Rozpocznij tłumaczenie',

    // General
    loading: 'Wczytywanie...',
    error: 'Błąd',
    ok: 'OK',
    cancel: 'Anuluj',
    originalText: 'Oryginał',
    translating: 'Tłumaczenie...'
  },

  'no': {
    // Language Modal
    selectLanguage: 'Velg språk for å begynne:',
    loadingLanguages: 'Laster språk…',
    creatingSession: 'Oppretter økt…',

    // Chat Panel
    finishSession: 'Avslutt økt',
    readAloud: 'Les høyt',

    // Input Controls
    typeMessage: 'Skriv meldingen din...',
    sendMessage: 'Send melding',
    startRecording: 'Start opptak',
    stopRecording: 'Stopp opptak',

    // Info Modal
    welcomeTitle: 'Velkommen til Kalundborg Kommunes Tolkeløsning',
    welcomeMessage: 'Denne løsningen hjelper deg å kommunisere på dansk og ditt valgte språk.',
    howItWorks: 'Slik fungerer det:',
    step1: '1. Skriv eller si meldingen din',
    step2: '2. Meldingen oversettes automatisk',
    step3: '3. Den andre personen kan lytte og svare',
    startTranslating: 'Begynn å oversette',

    // General
    loading: 'Laster...',
    error: 'Feil',
    ok: 'OK',
    cancel: 'Avbryt',
    originalText: 'Original',
    translating: 'Oversetter...'
  },

  'nl': {
    // Language Modal
    selectLanguage: 'Selecteer taal om te beginnen:',
    loadingLanguages: 'Talen laden…',
    creatingSession: 'Sessie aanmaken…',

    // Chat Panel
    finishSession: 'Sessie beëindigen',
    readAloud: 'Hardop voorlezen',

    // Input Controls
    typeMessage: 'Typ je bericht...',
    sendMessage: 'Bericht versturen',
    startRecording: 'Opname starten',
    stopRecording: 'Opname stoppen',

    // Info Modal
    welcomeTitle: 'Welkom bij de Vertaaloplossing van de Gemeente Kalundborg',
    welcomeMessage: 'Deze oplossing helpt je communiceren in het Deens en je gekozen taal.',
    howItWorks: 'Zo werkt het:',
    step1: '1. Schrijf of spreek je bericht',
    step2: '2. Het bericht wordt automatisch vertaald',
    step3: '3. De andere persoon kan luisteren en antwoorden',
    startTranslating: 'Begin met vertalen',

    // General
    loading: 'Laden...',
    error: 'Fout',
    ok: 'OK',
    cancel: 'Annuleren',
    originalText: 'Origineel',
    translating: 'Vertalen...'
  },

  'ro': {
    // Language Modal
    selectLanguage: 'Selectați limba pentru a începe:',
    loadingLanguages: 'Se încarcă limbile…',
    creatingSession: 'Se creează sesiunea…',

    // Chat Panel
    finishSession: 'Terminați sesiunea',
    readAloud: 'Citiți cu voce tare',

    // Input Controls
    typeMessage: 'Scrieți mesajul dvs...',
    sendMessage: 'Trimiteți mesajul',
    startRecording: 'Începeți înregistrarea',
    stopRecording: 'Opriți înregistrarea',

    // Info Modal
    welcomeTitle: 'Bine ați venit la Soluția de Interpretare a Municipalității Kalundborg',
    welcomeMessage: 'Această soluție vă ajută să comunicați în daneză și în limba aleasă.',
    howItWorks: 'Cum funcționează:',
    step1: '1. Scrieți sau spuneți mesajul',
    step2: '2. Mesajul este tradus automat',
    step3: '3. Cealaltă persoană poate asculta și răspunde',
    startTranslating: 'Începeți traducerea',

    // General
    loading: 'Se încarcă...',
    error: 'Eroare',
    ok: 'OK',
    cancel: 'Anulați',
    originalText: 'Original',
    translating: 'Traducând...'
  },

  'lt': {
    // Language Modal
    selectLanguage: 'Pasirinkite kalbą pradėti:',
    loadingLanguages: 'Kraunamos kalbos…',
    creatingSession: 'Kuriama sesija…',

    // Chat Panel
    finishSession: 'Užbaigti sesiją',
    readAloud: 'Skaityti garsiai',

    // Input Controls
    typeMessage: 'Įveskite savo žinutę...',
    sendMessage: 'Siųsti žinutę',
    startRecording: 'Pradėti įrašymą',
    stopRecording: 'Sustabdyti įrašymą',

    // Info Modal
    welcomeTitle: 'Sveiki atvykę į Kalundborgo savivaldybės vertimo sprendimą',
    welcomeMessage: 'Šis sprendimas padeda jums bendrauti danų ir jūsų pasirinkta kalba.',
    howItWorks: 'Kaip tai veikia:',
    step1: '1. Parašykite arba pasakykite savo žinutę',
    step2: '2. Žinutė automatiškai išverčiama',
    step3: '3. Kitas asmuo gali klausyti ir atsakyti',
    startTranslating: 'Pradėti vertimą',

    // General
    loading: 'Kraunama...',
    error: 'Klaida',
    ok: 'Gerai',
    cancel: 'Atšaukti',
    originalText: 'Originalas',
    translating: 'Verčiama...'
  },

  'bg': {
    // Language Modal
    selectLanguage: 'Изберете език, за да започнете:',
    loadingLanguages: 'Зареждане на езици…',
    creatingSession: 'Създаване на сесия…',

    // Chat Panel
    finishSession: 'Приключи сесията',
    readAloud: 'Прочети на глас',

    // Input Controls
    typeMessage: 'Напишете съобщението си...',
    sendMessage: 'Изпрати съобщение',
    startRecording: 'Започни записване',
    stopRecording: 'Спри записването',

    // Info Modal
    welcomeTitle: 'Добре дошли в решението за превод на община Калундборг',
    welcomeMessage: 'Това решение ви помага да общувате на датски и избрания от вас език.',
    howItWorks: 'Как работи:',
    step1: '1. Напишете или кажете съобщението си',
    step2: '2. Съобщението се превежда автоматично',
    step3: '3. Другият човек може да слуша и отговори',
    startTranslating: 'Започни превода',

    // General
    loading: 'Зареждане...',
    error: 'Грешка',
    ok: 'ОК',
    cancel: 'Отказ',
    originalText: 'Оригинал',
    translating: 'Превежда се...'
  },

  'hu': {
    // Language Modal
    selectLanguage: 'Válassz nyelvet a kezdéshez:',
    loadingLanguages: 'Nyelvek betöltése…',
    creatingSession: 'Munkamenet létrehozása…',

    // Chat Panel
    finishSession: 'Munkamenet befejezése',
    readAloud: 'Felolvasás',

    // Input Controls
    typeMessage: 'Írd be az üzeneted...',
    sendMessage: 'Üzenet küldése',
    startRecording: 'Felvétel indítása',
    stopRecording: 'Felvétel leállítása',

    // Info Modal
    welcomeTitle: 'Üdvözöljük a Kalundborg Önkormányzat Tolmácsolási Megoldásában',
    welcomeMessage: 'Ez a megoldás segít dánul és a választott nyelvén kommunikálni.',
    howItWorks: 'Hogyan működik:',
    step1: '1. Írja le vagy mondja el az üzenetét',
    step2: '2. Az üzenet automatikusan lefordítódik',
    step3: '3. A másik személy hallgathatja és válaszolhat',
    startTranslating: 'Fordítás kezdése',

    // General
    loading: 'Betöltés...',
    error: 'Hiba',
    ok: 'OK',
    cancel: 'Mégse',
    originalText: 'Eredeti',
    translating: 'Fordítás...'
  },

  'cs': {
    // Language Modal
    selectLanguage: 'Vyberte jazyk pro začátek:',
    loadingLanguages: 'Načítání jazyků…',
    creatingSession: 'Vytváření relace…',

    // Chat Panel
    finishSession: 'Ukončit relaci',
    readAloud: 'Přečíst nahlas',

    // Input Controls
    typeMessage: 'Napište svou zprávu...',
    sendMessage: 'Odeslat zprávu',
    startRecording: 'Spustit nahrávání',
    stopRecording: 'Zastavit nahrávání',

    // Info Modal
    welcomeTitle: 'Vítejte v překladatelském řešení obce Kalundborg',
    welcomeMessage: 'Toto řešení vám pomáhá komunikovat v dánštině a ve vámi zvoleném jazyce.',
    howItWorks: 'Jak to funguje:',
    step1: '1. Napište nebo řekněte svou zprávu',
    step2: '2. Zpráva se automaticky přeloží',
    step3: '3. Druhá osoba může naslouchat a odpovědět',
    startTranslating: 'Začít překládat',

    // General
    loading: 'Načítání...',
    error: 'Chyba',
    ok: 'OK',
    cancel: 'Zrušit',
    originalText: 'Originál',
    translating: 'Překládání...'
  },

  'hr': {
    // Language Modal
    selectLanguage: 'Odaberite jezik za početak:',
    loadingLanguages: 'Učitavanje jezika…',
    creatingSession: 'Stvaranje sesije…',

    // Chat Panel
    finishSession: 'Završi sesiju',
    readAloud: 'Čitaj naglas',

    // Input Controls
    typeMessage: 'Upišite svoju poruku...',
    sendMessage: 'Pošaljite poruku',
    startRecording: 'Pokreni snimanje',
    stopRecording: 'Zaustavi snimanje',

    // Info Modal
    welcomeTitle: 'Dobrodošli u prevoditeljsko rješenje općine Kalundborg',
    welcomeMessage: 'Ovo rješenje vam pomaže komunicirati na danskom i vašem odabranom jeziku.',
    howItWorks: 'Kako funkcionira:',
    step1: '1. Napišite ili recite svoju poruku',
    step2: '2. Poruka se automatski prevodi',
    step3: '3. Druga osoba može slušati i odgovoriti',
    startTranslating: 'Počni s prevodom',

    // General
    loading: 'Učitavanje...',
    error: 'Greška',
    ok: 'OK',
    cancel: 'Odustani',
    originalText: 'Izvornik',
    translating: 'Prevodi se...'
  },

  'fa': {
    // Language Modal
    selectLanguage: 'زبان مورد نظر برای شروع را انتخاب کنید:',
    loadingLanguages: 'در حال بارگیری زبان‌ها…',
    creatingSession: 'در حال ایجاد جلسه…',

    // Chat Panel
    finishSession: 'پایان جلسه',
    readAloud: 'با صدای بلند بخوان',

    // Input Controls
    typeMessage: 'پیام خود را تایپ کنید...',
    sendMessage: 'ارسال پیام',
    startRecording: 'شروع ضبط',
    stopRecording: 'توقف ضبط',

    // Info Modal
    welcomeTitle: 'به راه‌حل ترجمه شهرداری کالوندبورگ خوش آمدید',
    welcomeMessage: 'این راه‌حل به شما کمک می‌کند تا به زبان دانمارکی و زبان انتخابی خود ارتباط برقرار کنید.',
    howItWorks: 'نحوه کارکرد:',
    step1: '۱. پیام خود را بنویسید یا بگویید',
    step2: '۲. پیام به طور خودکار ترجمه می‌شود',
    step3: '۳. فرد دیگر می‌تواند گوش کند و پاسخ دهد',
    startTranslating: 'شروع ترجمه',

    // General
    loading: 'در حال بارگیری...',
    error: 'خطا',
    ok: 'تأیید',
    cancel: 'لغو',
    originalText: 'متن اصلی',
    translating: 'در حال ترجمه...'
  },

  'ur': {
    // Language Modal
    selectLanguage: 'شروع کرنے کے لیے زبان منتخب کریں:',
    loadingLanguages: 'زبانیں لوڈ ہو رہی ہیں…',
    creatingSession: 'سیشن بنایا جا رہا ہے…',

    // Chat Panel
    finishSession: 'سیشن ختم کریں',
    readAloud: 'بلند آواز میں پڑھیں',

    // Input Controls
    typeMessage: 'اپنا پیغام ٹائپ کریں...',
    sendMessage: 'پیغام بھیجیں',
    startRecording: 'ریکارڈنگ شروع کریں',
    stopRecording: 'ریکارڈنگ بند کریں',

    // Info Modal
    welcomeTitle: 'کالنڈبورگ میونسپلٹی کے ترجمے کے حل میں خوش آمدید',
    welcomeMessage: 'یہ حل آپ کو ڈینش اور آپ کی منتخب کردہ زبان میں بات چیت کرنے میں مدد کرتا ہے۔',
    howItWorks: 'یہ کیسے کام کرتا ہے:',
    step1: '۱. اپنا پیغام لکھیں یا بولیں',
    step2: '۲. پیغام خود کار طریقے سے ترجمہ ہو جاتا ہے',
    step3: '۳. دوسرا شخص سن سکتا ہے اور جواب دے سکتا ہے',
    startTranslating: 'ترجمہ شروع کریں',

    // General
    loading: 'لوڈ ہو رہا ہے...',
    error: 'خرابی',
    ok: 'ٹھیک ہے',
    cancel: 'منسوخ',
    originalText: 'اصل متن',
    translating: 'ترجمہ ہو رہا ہے...'
  },

  'ta': {
    // Language Modal
    selectLanguage: 'தொடங்க மொழியைத் தேர்ந்தெடுக்கவும்:',
    loadingLanguages: 'மொழிகள் ஏற்றப்படுகின்றன…',
    creatingSession: 'அமர்வு உருவாக்கப்படுகிறது…',

    // Chat Panel
    finishSession: 'அமர்வை முடிக்கவும்',
    readAloud: 'சத்தமாகப் படிக்கவும்',

    // Input Controls
    typeMessage: 'உங்கள் செய்தியை தட்டச்சு செய்யவும்...',
    sendMessage: 'செய்தி அனுப்பவும்',
    startRecording: 'பதிவு தொடங்கவும்',
    stopRecording: 'பதிவை நிறுத்தவும்',

    // Info Modal
    welcomeTitle: 'கலுண்ட்போர்க் நகராட்சியின் மொழிபெயர்ப்பு தீர்வுக்கு வரவேற்கிறோம்',
    welcomeMessage: 'இந்த தீர்வு டேனிஷ் மற்றும் நீங்கள் தேர்ந்தெடுத்த மொழியில் தொடர்பு கொள்ள உதவுகிறது.',
    howItWorks: 'இது எவ்வாறு செயல்படுகிறது:',
    step1: '1. உங்கள் செய்தியை எழுதவும் அல்லது பேசவும்',
    step2: '2. செய்தி தானாகவே மொழிபெயர்க்கப்படும்',
    step3: '3. மற்ற நபர் கேட்டு பதிலளிக்க முடியும்',
    startTranslating: 'மொழிபெயர்ப்பைத் தொடங்கவும்',

    // General
    loading: 'ஏற்றுகிறது...',
    error: 'பிழை',
    ok: 'சரி',
    cancel: 'ரத்து செய்',
    originalText: 'அசல் உரை',
    translating: 'மொழிபெயர்க்கப்படுகிறது...'
  },

  'bn': {
    // Language Modal
    selectLanguage: 'শুরু করতে ভাষা নির্বাচন করুন:',
    loadingLanguages: 'ভাষা লোড হচ্ছে…',
    creatingSession: 'সেশন তৈরি হচ্ছে…',

    // Chat Panel
    finishSession: 'সেশন শেষ করুন',
    readAloud: 'জোরে পড়ুন',

    // Input Controls
    typeMessage: 'আপনার বার্তা টাইপ করুন...',
    sendMessage: 'বার্তা পাঠান',
    startRecording: 'রেকর্ডিং শুরু করুন',
    stopRecording: 'রেকর্ডিং বন্ধ করুন',

    // Info Modal
    welcomeTitle: 'কালুন্ডবোর্গ পৌরসভার অনুবাদ সমাধানে স্বাগতম',
    welcomeMessage: 'এই সমাধানটি আপনাকে ডেনিশ এবং আপনার নির্বাচিত ভাষায় যোগাযোগ করতে সাহায্য করে।',
    howItWorks: 'এটি কীভাবে কাজ করে:',
    step1: '১. আপনার বার্তা লিখুন বা বলুন',
    step2: '২. বার্তাটি স্বয়ংক্রিয়ভাবে অনুবাদ হয়',
    step3: '৩. অন্য ব্যক্তি শুনতে এবং উত্তর দিতে পারেন',
    startTranslating: 'অনুবাদ শুরু করুন',

    // General
    loading: 'লোড হচ্ছে...',
    error: 'ত্রুটি',
    ok: 'ঠিক আছে',
    cancel: 'বাতিল',
    originalText: 'মূল পাঠ',
    translating: 'অনুবাদ হচ্ছে...'
  },

  'sq': {
    // Language Modal
    selectLanguage: 'Zgjidhni gjuhën për të filluar:',
    loadingLanguages: 'Po ngarkohen gjuhët…',
    creatingSession: 'Po krijohet sesioni…',

    // Chat Panel
    finishSession: 'Përfundo sesionin',
    readAloud: 'Lexo me zë të lartë',

    // Input Controls
    typeMessage: 'Shkruani mesazhin tuaj...',
    sendMessage: 'Dërgo mesazhin',
    startRecording: 'Fillo regjistrimin',
    stopRecording: 'Ndalo regjistrimin',

    // Info Modal
    welcomeTitle: 'Mirë se vini në Zgjidhjen e Përkthimit të Komunës së Kalundborg',
    welcomeMessage: 'Kjo zgjidhje ju ndihmon të komunikoni në danisht dhe në gjuhën tuaj të zgjedhur.',
    howItWorks: 'Si funksionon:',
    step1: '1. Shkruani ose thoni mesazhin tuaj',
    step2: '2. Mesazhi përkthehet automatikisht',
    step3: '3. Personi tjetër mund të dëgjojë dhe të përgjigjet',
    startTranslating: 'Fillo përkthimin',

    // General
    loading: 'Po ngarkon...',
    error: 'Gabim',
    ok: 'Në rregull',
    cancel: 'Anulo',
    originalText: 'Teksti origjinal',
    translating: 'Po përkthehet...'
  },

  'ca': {
    // Language Modal
    selectLanguage: 'Seleccioneu idioma per començar:',
    loadingLanguages: 'Carregant idiomes…',
    creatingSession: 'Creant sessió…',

    // Chat Panel
    finishSession: 'Acabar sessió',
    readAloud: 'Llegir en veu alta',

    // Input Controls
    typeMessage: 'Escriviu el vostre missatge...',
    sendMessage: 'Enviar missatge',
    startRecording: 'Començar gravació',
    stopRecording: 'Aturar gravació',

    // Info Modal
    welcomeTitle: 'Benvinguts a la Solució d\'Interpretació del Municipi de Kalundborg',
    welcomeMessage: 'Aquesta solució us ajuda a comunicar-vos en danès i en l\'idioma escollit.',
    howItWorks: 'Com funciona:',
    step1: '1. Escriviu o digueu el vostre missatge',
    step2: '2. El missatge es tradueix automàticament',
    step3: '3. L\'altra persona pot escoltar i respondre',
    startTranslating: 'Començar traducció',

    // General
    loading: 'Carregant...',
    error: 'Error',
    ok: 'D\'acord',
    cancel: 'Cancel·lar',
    originalText: 'Text original',
    translating: 'Traduint...'
  }
}

// Helper function to get translation with clean fallback
export const getTranslation = (langCode: string, key: keyof Translation): string => {
  // Try to get exact match first
  if (translations[langCode]) {
    return translations[langCode][key]
  }

  // Try language without region (e.g., 'en' from 'en-US')
  const baseLang = langCode.split('-')[0]
  const fallbackKey = Object.keys(translations).find(k => k.startsWith(baseLang))
  if (fallbackKey && translations[fallbackKey]) {
    return translations[fallbackKey][key]
  }

  // Special case: Danish speakers get Danish fallback
  if (langCode.startsWith('da')) {
    return translations['da-DK'][key]
  }

  // Clean fallback to English for all other languages
  return translations['en-US'][key]
}