import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, X, Edit3, Trash2, ShieldCheck, AlertCircle, 
  Database, ArrowLeft, Download, Lock, Unlock, Key, 
  Globe, Plane, Settings, LogOut, Calendar, ZoomIn, FileText, Type, PlusCircle, Palette,
  Power, ChevronUp, ChevronDown, FileCheck
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

// --- Firebase Initialization ---
// [開源安全建議] 任何人下載此專案後，請勿將 API Key 直接上傳至公開的 GitHub。
// 實際部署時，請將下方 defaultConfig 的空字串替換為您自己的 Firebase 設定，
// 或整合您專案慣用的環境變數寫法。
const defaultConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : defaultConfig;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// 預設授權項目
const defaultAuthItems = [
  {
    id: 'auth_portrait',
    title: '肖像權與影音資料授權說明',
    description: '為紀錄本次活動之珍貴回憶，並作為學校成果展示、教育推廣及校內外刊物與網站公告之用，教師與隨行人員將進行拍照與錄影。\n\n● 非營利使用：所有影音資料僅限於教育與交流成果推廣，絕不作為商業營利目的。\n● 尊重意願：若不同意授權，校方將於後續公開之照片與影片中，針對學生容貌進行遮蔽或模糊處理。',
    question: '本人對於校方於活動期間拍攝之照片與影片，授權處理方式如下：'
  },
  {
    id: 'auth_airtag',
    title: '安全管理授權說明 (AirTag)',
    description: '為確保學生於外出活動（或寄宿家庭期間）之行動安全，本校擬發放「AirTag 鑰匙圈」供學生隨身配戴。\n\n● 專款專用：僅限本次活動期間配戴，活動結束後即收回。\n● 隱私保護：定位資訊僅供帶隊教師於「確保安全」及「緊急維難」時查詢，絕不主動追蹤。',
    question: '本人對於校方採用上述安全管理措施，並授權於必要時刻讀取定位資訊：'
  }
];

// 動態收集欄位設定配置
const FIELD_CONFIG = [
  { id: 'studentClass', zh: '班級', en: 'Class', ja: 'クラス', type: 'text', placeholder: { zh: '例如：701', en: 'e.g. 701', ja: '例: 701' } },
  { id: 'studentNumber', zh: '座號', en: 'Seat No.', ja: '出席番号', type: 'text', placeholder: { zh: '例如：01', en: 'e.g. 01', ja: '例: 01' } },
  { id: 'studentId', zh: '班級座號', en: 'Class & No.', ja: 'クラス・出席番号', type: 'text', placeholder: { zh: '例如：70101', en: 'e.g. 70101', ja: '例: 70101' } },
  { id: 'studentName', zh: '學生姓名', en: 'Student Name', ja: '生徒氏名', type: 'text', placeholder: { zh: '請輸入全名', en: 'Full Name', ja: 'フルネーム' } },
  { id: 'gender', zh: '性別', en: 'Gender', ja: '性別', type: 'select', options: { zh: ['男', '女'], en: ['Male', 'Female'], ja: ['男性', '女性'] } },
  { id: 'birthday', zh: '生日', en: 'Birthday', ja: '生年月日', type: 'date', placeholder: {} },
  { id: 'idNumber', zh: '身分證字號', en: 'ID Number', ja: '身分証番号', type: 'text', placeholder: { zh: '請輸入身分證字號', en: 'Enter ID Number', ja: '身分証番号を入力' } },
  { id: 'guardianName', zh: '監護人姓名', en: 'Guardian Name', ja: '保護者氏名', type: 'text', placeholder: { zh: '請輸入監護人姓名', en: 'Enter Guardian Name', ja: '保護者氏名を入力' } },
  { id: 'parentPhone', zh: '聯絡電話', en: 'Phone Number', ja: '連絡先電話番号', type: 'tel', placeholder: { zh: '例如：0912345678', en: 'e.g. 0912345678', ja: '例: 0912345678' } }
];

// 系統主題色碼對照
const THEME_HEX = {
  teal: { stroke: '#115e59', htmlMain: '#0f766e', htmlLight: '#f0fdfa', htmlHover: '#115e59', htmlShadow: 'rgba(15, 118, 110, 0.2)' },
  blue: { stroke: '#1e40af', htmlMain: '#1d4ed8', htmlLight: '#eff6ff', htmlHover: '#1e3a8a', htmlShadow: 'rgba(29, 78, 216, 0.2)' },
  indigo: { stroke: '#3730a3', htmlMain: '#4338ca', htmlLight: '#eef2ff', htmlHover: '#312e81', htmlShadow: 'rgba(67, 56, 202, 0.2)' },
  rose: { stroke: '#9f1239', htmlMain: '#e11d48', htmlLight: '#fff1f2', htmlHover: '#be123c', htmlShadow: 'rgba(225, 29, 72, 0.2)' },
  violet: { stroke: '#5b21b6', htmlMain: '#6d28d9', htmlLight: '#f5f3ff', htmlHover: '#5b21b6', htmlShadow: 'rgba(109, 40, 217, 0.2)' },
};

const ThemeSafelist = () => (
  <div className="hidden bg-teal-800 bg-teal-900 bg-teal-50 bg-teal-100 bg-teal-200 text-teal-900 text-teal-800 text-teal-700 text-teal-600 text-teal-50 text-teal-100 text-teal-200 text-teal-300 border-teal-600 border-teal-500 border-teal-400 border-teal-300 border-teal-200 border-teal-100 border-teal-600/30 border-teal-600/40 focus:ring-teal-600 focus:ring-teal-600/20 focus:border-teal-600 hover:bg-teal-900 hover:bg-teal-100 hover:bg-teal-50 group-hover:text-teal-900 group-hover:text-teal-600 hover:text-teal-700 hover:border-teal-400 hover:shadow-teal-900/20 shadow-teal-900/20 bg-teal-900/50 border-teal-600/30 text-teal-900/50 bg-blue-800 bg-blue-900 bg-blue-50 bg-blue-100 bg-blue-200 text-blue-900 text-blue-800 text-blue-700 text-blue-600 text-blue-50 text-blue-100 text-blue-200 text-blue-300 border-blue-600 border-blue-500 border-blue-400 border-blue-300 border-blue-200 border-blue-100 border-blue-600/30 border-blue-600/40 focus:ring-blue-600 focus:ring-blue-600/20 focus:border-blue-600 hover:bg-blue-900 hover:bg-blue-100 hover:bg-blue-50 group-hover:text-blue-900 group-hover:text-blue-600 hover:text-blue-700 hover:border-blue-400 hover:shadow-blue-900/20 shadow-blue-900/20 bg-blue-900/50 border-blue-600/30 text-blue-900/50 bg-indigo-800 bg-indigo-900 bg-indigo-50 bg-indigo-100 bg-indigo-200 text-indigo-900 text-indigo-800 text-indigo-700 text-indigo-600 text-indigo-50 text-indigo-100 text-indigo-200 text-indigo-300 border-indigo-600 border-indigo-500 border-indigo-400 border-indigo-300 border-indigo-200 border-indigo-100 border-indigo-600/30 border-indigo-600/40 focus:ring-indigo-600 focus:ring-indigo-600/20 focus:border-indigo-600 hover:bg-indigo-900 hover:bg-indigo-100 hover:bg-indigo-50 group-hover:text-indigo-900 group-hover:text-indigo-600 hover:text-indigo-700 hover:border-indigo-400 hover:shadow-indigo-900/20 shadow-indigo-900/20 bg-indigo-900/50 border-indigo-600/30 text-indigo-900/50 bg-rose-800 bg-rose-900 bg-rose-50 bg-rose-100 bg-rose-200 text-rose-900 text-rose-800 text-rose-700 text-rose-600 text-rose-50 text-rose-100 text-rose-200 text-rose-300 border-rose-600 border-rose-500 border-rose-400 border-rose-300 border-rose-200 border-rose-100 border-rose-600/30 border-rose-600/40 focus:ring-rose-600 focus:ring-rose-600/20 focus:border-rose-600 hover:bg-rose-900 hover:bg-rose-100 hover:bg-rose-50 group-hover:text-rose-900 group-hover:text-rose-600 hover:text-rose-700 hover:border-rose-400 hover:shadow-rose-900/20 shadow-rose-900/20 bg-rose-900/50 border-rose-600/30 text-rose-900/50 bg-violet-800 bg-violet-900 bg-violet-50 bg-violet-100 bg-violet-200 text-violet-900 text-violet-800 text-violet-700 text-violet-600 text-violet-50 text-violet-100 text-violet-200 text-violet-300 border-violet-600 border-violet-500 border-violet-400 border-violet-300 border-violet-200 border-violet-100 border-violet-600/30 border-violet-600/40 focus:ring-violet-600 focus:ring-violet-600/20 focus:border-violet-600 hover:bg-violet-900 hover:bg-violet-100 hover:bg-violet-50 group-hover:text-violet-900 group-hover:text-violet-600 hover:text-violet-700 hover:border-violet-400 hover:shadow-violet-900/20 shadow-violet-900/20 bg-violet-900/50 border-violet-600/30 text-violet-900/50"></div>
);

// --- 多國語系字典 ---
const i18n = {
  zh: {
    consentTitle: "活動授權同意書", activityTime: "活動時間",
    pdpaTitle: "個資保護與蒐集聲明", pdpaNotice: "依個人資料保護法規定，本校向您告知下列事項：",
    pdpaPurpose: "蒐集目的", pdpaPurposeText: "教育活動推廣、安全管理及緊急聯絡。",
    pdpaCategory: "資料類別",
    pdpaPeriod: "利用期間", pdpaPeriodText: "活動報名起至活動結束或授權處理完畢為止。",
    pdpaAgree: "我已閱讀、瞭解並同意接受上述個資告知事項。",
    authItemsTitle: "各項授權同意事項", item: "項目", agree: "我同意", disagree: "我不同意",
    studentInfoTitle: "學生與家長資料",
    signatureTitle: "家長親自簽名", signatureWarning: "如有假冒願受校規處分",
    clickToSign: "點擊此處開啟「全螢幕簽名板」", touchSupport: "支援手機觸控，防畫面滑動干擾", removeSignature: "移除重新簽名",
    submitText: "確認送出同意書", submittingText: "資料傳送中...",
    formClosedTitle: "表單已關閉填寫", formClosedDesc: "本同意書目前未開放填寫或已超過收集期限。如有疑問，請逕洽學校負責單位。",
    successTitle: "同意書已成功送出", successDesc: "感謝您的授權與配合，我們將致力維護您的權益與安全。",
    downloadReceipt: "預覽 / 列印同意憑證", returnFill: "返回填寫其他資料",
    signModalTitle: "請在下方空白處簽名", fullScreenPad: "全螢幕簽名板", clearSign: "清除重寫", confirmSign: "確認完成",
    errorNetwork: "連線失敗，請檢查網路後重試。", errorMissingFields: "請確認所有標示 * 號的欄位格式正確且皆已填寫。",
    receiptPreviewTitle: "同意憑證預覽", fillDate: "填寫日期：", agreeAuth: "我同意授權", disagreeAuth: "我不同意",
    parentSignatureLabel: "家長/監護人親筆簽名：", backBtn: "返回", printPdfBtn: "確定列印 / 存為 PDF",
    receiptNotice: "本文件由系統自動產生，具有效力證明之用途。保護您的資料是我們的責任。"
  },
  en: {
    consentTitle: "Activity Consent Form", activityTime: "Activity Period",
    pdpaTitle: "Data Protection Statement", pdpaNotice: "In accordance with the Personal Data Protection Act, we inform you of the following:",
    pdpaPurpose: "Purpose", pdpaPurposeText: "Educational promotion, safety management, and emergency contact.",
    pdpaCategory: "Data Categories",
    pdpaPeriod: "Period", pdpaPeriodText: "From registration until the end of the activity.",
    pdpaAgree: "I have read, understood, and agree to the above statement.",
    authItemsTitle: "Authorization Items", item: "Item", agree: "I Agree", disagree: "I Disagree",
    studentInfoTitle: "Student & Parent Info",
    signatureTitle: "Parent Signature", signatureWarning: "Forging signature is strictly prohibited",
    clickToSign: "Click to open Signature Pad", touchSupport: "Supports touch devices to prevent scrolling", removeSignature: "Remove & Resign",
    submitText: "Submit Consent Form", submittingText: "Submitting...",
    formClosedTitle: "Form Closed", formClosedDesc: "This form is currently closed or past the deadline. Please contact the school for inquiries.",
    successTitle: "Successfully Submitted", successDesc: "Thank you for your cooperation. We are committed to protecting your rights and safety.",
    downloadReceipt: "Preview / Print Receipt", returnFill: "Fill out another form",
    signModalTitle: "Please sign in the blank area below", fullScreenPad: "Signature Pad", clearSign: "Clear", confirmSign: "Confirm",
    errorNetwork: "Connection failed. Please check network.", errorMissingFields: "Please ensure all * fields are correctly filled.",
    receiptPreviewTitle: "Consent Receipt Preview", fillDate: "Date: ", agreeAuth: "I Agree", disagreeAuth: "I Disagree",
    parentSignatureLabel: "Parent/Guardian Signature:", backBtn: "Back", printPdfBtn: "Print / Save as PDF",
    receiptNotice: "This document is automatically generated by the system and serves as proof of validity. Protecting your data is our responsibility."
  },
  ja: {
    consentTitle: "活動参加同意書", activityTime: "活動期間",
    pdpaTitle: "個人情報保護方針", pdpaNotice: "個人情報保護法に基づき、以下の事項をお知らせいたします：",
    pdpaPurpose: "収集目的", pdpaPurposeText: "教育活動の推進、安全管理、および緊急連絡。",
    pdpaCategory: "データ項目",
    pdpaPeriod: "利用期間", pdpaPeriodText: "申し込みから活動終了、または処理完了まで。",
    pdpaAgree: "上記の内容を読み、理解し、同意します。",
    authItemsTitle: "同意事項", item: "項目", agree: "同意する", disagree: "同意しない",
    studentInfoTitle: "生徒・保護者情報",
    signatureTitle: "保護者署名", signatureWarning: "署名の偽造は処罰の対象となります",
    clickToSign: "タップして署名パッドを開く", touchSupport: "タッチ操作対応、画面スクロール防止", removeSignature: "署名を削除して書き直す",
    submitText: "同意書を送信する", submittingText: "送信中...",
    formClosedTitle: "受付終了", formClosedDesc: "このフォームは現在受付を終了しています。ご不明な点は学校までお問い合わせください。",
    successTitle: "送信完了", successDesc: "ご協力ありがとうございます。皆様の安全と権利の保護に努めてまいります。",
    downloadReceipt: "控えをプレビュー / 印刷", returnFill: "他のフォームに入力する",
    signModalTitle: "下の空白スペースに署名してください", fullScreenPad: "全画面署名パッド", clearSign: "クリア", confirmSign: "完了",
    errorNetwork: "送信に失敗しました。通信環境を確認してください。", errorMissingFields: "すべての * 項目が正しく入力されていることを確認してください。",
    receiptPreviewTitle: "同意書の控えプレビュー", fillDate: "記入日: ", agreeAuth: "同意する", disagreeAuth: "同意しない",
    parentSignatureLabel: "保護者署名:", backBtn: "戻る", printPdfBtn: "印刷 / PDFとして保存",
    receiptNotice: "この文書はシステムによって自動生成されたものであり、有効性の証明として機能します。"
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [viewMode, setViewMode] = useState('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // --- Form Config State ---
  const [schoolNameZh, setSchoolNameZh] = useState('基隆市立成功國民中學');
  const [schoolNameEn, setSchoolNameEn] = useState('Keelung Municipal Cheng Kung Junior high School');
  const [themeColor, setThemeColor] = useState('teal');
  const [formTitle, setFormTitle] = useState('日本中能登中學校國際交流');
  const [displayStartDate, setDisplayStartDate] = useState('');
  const [displayEndDate, setDisplayEndDate] = useState('');
  const [authItems, setAuthItems] = useState(defaultAuthItems);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [collectedFields, setCollectedFields] = useState(['studentClass', 'studentNumber', 'studentName', 'parentPhone']);

  // Admin Config Edit State
  const [editSchoolNameZh, setEditSchoolNameZh] = useState('基隆市立成功國民中學');
  const [editSchoolNameEn, setEditSchoolNameEn] = useState('Keelung Municipal Cheng Kung Junior high School');
  const [editThemeColor, setEditThemeColor] = useState('teal');
  const [editFormTitle, setEditFormTitle] = useState('日本中能登中學校國際交流');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editAuthItems, setEditAuthItems] = useState(defaultAuthItems);
  const [editIsFormOpen, setEditIsFormOpen] = useState(true);
  const [editCollectedFields, setEditCollectedFields] = useState(['studentClass', 'studentNumber', 'studentName', 'parentPhone']);

  // --- Form Input State ---
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [consents, setConsents] = useState({});
  const [formData, setFormData] = useState({});
  const [signatureData, setSignatureData] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  
  // Modals & Misc
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);

  // --- Admin State ---
  const [submissions, setSubmissions] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdUpdateMsg, setPwdUpdateMsg] = useState({ type: '', text: '' });
  const [isDefaultPwd, setIsDefaultPwd] = useState(false);
  const [previewSignature, setPreviewSignature] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lang, setLang] = useState('zh');
  
  // Feature: Admin Report Preview
  const [showAdminReportPreview, setShowAdminReportPreview] = useState(false);
  const [adminReportHtml, setAdminReportHtml] = useState('');

  // Canvas Ref
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const t = (classes) => classes.replace(/teal/g, themeColor);
  const l = (key) => i18n[lang][key] || i18n['zh'][key];

  // 動態個資文字產生器
  const getDynamicPdpaText = () => {
    const labels = collectedFields.map(id => FIELD_CONFIG.find(f => f.id === id)?.[lang]).filter(Boolean).join(lang === 'en' ? ', ' : '、');
    if (lang === 'en') return `${labels}, and authorization statuses.`;
    if (lang === 'ja') return `${labels}、および同意状況。`;
    return `${labels}、各項授權狀態。`;
  };

  // --- Init & Fetch Data ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error('Auth error:', error);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'form_config');
    const unsub = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSchoolNameZh(data.schoolNameZh || '基隆市立成功國民中學');
        setSchoolNameEn(data.schoolNameEn || 'Keelung Municipal Cheng Kung Junior high School');
        setThemeColor(data.themeColor || 'teal');
        setDisplayStartDate(data.startDate || '');
        setDisplayEndDate(data.endDate || '');
        setFormTitle(data.formTitle || '日本中能登中學校國際交流');
        setAuthItems(data.authItems && data.authItems.length > 0 ? data.authItems : defaultAuthItems);
        setIsFormOpen(data.isFormOpen !== false);
        setCollectedFields(data.collectedFields || ['studentClass', 'studentNumber', 'studentName', 'parentPhone']);

        setEditSchoolNameZh(prev => prev || data.schoolNameZh || '基隆市立成功國民中學');
        setEditSchoolNameEn(prev => prev || data.schoolNameEn || 'Keelung Municipal Cheng Kung Junior high School');
        setEditThemeColor(prev => prev || data.themeColor || 'teal');
        setEditStartDate(prev => prev || data.startDate || '');
        setEditEndDate(prev => prev || data.endDate || '');
        setEditFormTitle(prev => prev || data.formTitle || '日本中能登中學校國際交流');
        setEditAuthItems(data.authItems && data.authItems.length > 0 ? data.authItems : defaultAuthItems);
        setEditIsFormOpen(data.isFormOpen !== false);
        setEditCollectedFields(data.collectedFields || ['studentClass', 'studentNumber', 'studentName', 'parentPhone']);
      }
    });
    return () => unsub();
  }, [appId, user]);

  useEffect(() => {
    if (!user || viewMode !== 'admin') return;
    const formsRef = collection(db, 'artifacts', appId, 'public', 'data', 'consent_forms');
    const unsubscribe = onSnapshot(formsRef, 
      (snapshot) => {
        const data = [];
        snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
        setSubmissions(data);
      },
      (error) => console.error("Error fetching submissions:", error)
    );
    return () => unsubscribe();
  }, [user, viewMode, appId]);

  // --- Sorting Logic ---
  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedSubmissions = [...submissions].sort((a, b) => {
    let aVal = a.formData?.[sortConfig.key] || a[sortConfig.key] || '';
    let bVal = b.formData?.[sortConfig.key] || b[sortConfig.key] || '';
    
    if (['studentId', 'studentClass', 'studentNumber'].includes(sortConfig.key)) {
      aVal = parseInt(aVal, 10) || 0;
      bVal = parseInt(bVal, 10) || 0;
    }
    
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // --- Signature Canvas ---
  useEffect(() => {
    if (showSignatureModal) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showSignatureModal]);

  useEffect(() => {
    if (showSignatureModal && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const resizeObserver = new ResizeObserver(() => {
        if (!canvasRef.current) return;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        ctx.strokeStyle = THEME_HEX[themeColor]?.stroke || '#115e59'; 
      });
      resizeObserver.observe(canvas);
      const preventScroll = (e) => e.preventDefault();
      canvas.addEventListener('touchstart', preventScroll, { passive: false });
      canvas.addEventListener('touchmove', preventScroll, { passive: false });
      canvas.addEventListener('touchend', preventScroll, { passive: false });
      return () => {
        resizeObserver.disconnect();
        canvas.removeEventListener('touchstart', preventScroll);
        canvas.removeEventListener('touchmove', preventScroll);
        canvas.removeEventListener('touchmove', preventScroll);
      };
    }
  }, [showSignatureModal, themeColor]);

  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (event.touches && event.touches.length > 0) {
      return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
    }
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const { x, y } = getCoordinates(e.nativeEvent || e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e.nativeEvent || e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const endDrawing = () => { if (!isDrawing) return; setIsDrawing(false); };
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  const handleConfirmSignature = () => {
    if (canvasRef.current) setSignatureData(canvasRef.current.toDataURL('image/png'));
    setShowSignatureModal(false);
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // --- Admin Settings Logic ---
  const handleSaveSettings = async () => {
    if (!user) return showToast("連線中請稍候...");
    if (editAuthItems.length === 0) return showToast("請至少保留一個授權項目！");
    if (editCollectedFields.length === 0) return showToast("請至少選擇一項收集資料！");
    try {
      const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'form_config');
      await setDoc(settingsRef, { 
        schoolNameZh: editSchoolNameZh,
        schoolNameEn: editSchoolNameEn,
        themeColor: editThemeColor,
        startDate: editStartDate, 
        endDate: editEndDate,
        formTitle: editFormTitle,
        authItems: editAuthItems,
        isFormOpen: editIsFormOpen,
        collectedFields: editCollectedFields
      }, { merge: true });
      showToast("✅ 表單設定已成功更新！");
    } catch (error) {
      showToast("更新設定失敗，請重試。");
    }
  };

  const addEditAuthItem = () => {
    setEditAuthItems([...editAuthItems, { id: 'auth_' + Date.now(), title: '新增授權項目標題', description: '請在此輸入授權內容說明...', question: '本人對於校方採用上述措施，授權意願如下：' }]);
  };
  const removeEditAuthItem = (id) => setEditAuthItems(editAuthItems.filter(item => item.id !== id));
  const updateEditAuthItem = (id, field, value) => setEditAuthItems(editAuthItems.map(item => item.id === id ? { ...item, [field]: value } : item));

  // --- Form Input Handlers ---
  const handleFieldChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const isFormValid = () => {
    const isConsentsComplete = authItems.every(item => consents[item.id] !== undefined && consents[item.id] !== '');
    const isFieldsComplete = collectedFields.every(fieldId => {
      const val = formData[fieldId];
      if (!val || val.trim() === '') return false;
      if (fieldId === 'studentId' && !/^\d{5}$/.test(val)) return false;
      if (fieldId === 'parentPhone' && !/^[\d\-\+\s#()]{8,20}$/.test(val)) return false;
      return true;
    });
    return pdpaConsent && isConsentsComplete && isFieldsComplete && signatureData && !isSubmitting;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return showToast(l('errorNetwork'));
    if (!isFormValid()) return showToast(l('errorMissingFields'));

    setIsSubmitting(true);
    try {
      const dataToSave = {
        pdpaConsent, consents, 
        formData, 
        // 為了相容舊資料結構，依然將基礎資料寫在 root level
        studentId: formData.studentId || formData.studentClass || '',
        studentName: formData.studentName || formData.guardianName || '',
        parentPhone: formData.parentPhone || '',
        signatureData,
        timestamp: Date.now(), submitterUid: user.uid
      };
      
      const formsRef = collection(db, 'artifacts', appId, 'public', 'data', 'consent_forms');
      await addDoc(formsRef, dataToSave);
      
      setSubmittedData({ ...dataToSave, dateStr: new Date().toLocaleDateString(lang === 'zh' ? 'zh-TW' : 'en-US') });
      setSubmitSuccess(true);
    } catch (error) {
      showToast(l('errorNetwork'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPdpaConsent(false); setConsents({}); setFormData({}); setSignatureData('');
    setSubmitSuccess(false); setSubmittedData(null);
    setShowReceiptPreview(false);
  };

  const executeDelete = async () => {
    if (!deleteTarget || !user) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'single') {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'consent_forms', deleteTarget.id));
        showToast("✅ 已成功移除該筆資料！");
      } else if (deleteTarget.type === 'all') {
        const batch = writeBatch(db);
        submissions.forEach(sub => {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'consent_forms', sub.id);
          batch.delete(docRef);
        });
        await batch.commit();
        showToast("✅ 已成功清空所有資料！");
      }
    } catch (error) {
      console.error("Delete error:", error);
      showToast("移除失敗，請稍後重試。");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // --- Feature 5: Print Receipt Logic ---
  const executePrintReceipt = () => {
    if (!submittedData) return;
    const thx = THEME_HEX[themeColor] || THEME_HEX.teal;
    
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="${lang === 'zh' ? 'zh-TW' : lang}">
      <head>
        <meta charset="utf-8">
        <title>${l('receiptPreviewTitle')}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, '微軟正黑體', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          .container { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid ${thx.htmlMain}; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: ${thx.htmlMain}; margin: 0 0 10px 0; font-size: 28px; }
          .header p { color: #64748b; margin: 0; font-size: 16px; }
          .info-block { display: flex; flex-wrap: wrap; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
          .info-item { flex: 1; min-width: 200px; }
          .info-item strong { display: block; color: #475569; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; }
          .info-item span { font-size: 18px; font-weight: bold; color: #0f172a; }
          .consent-item { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px dashed #cbd5e1; }
          .consent-item h3 { margin: 0 0 10px 0; color: #334155; font-size: 18px; }
          .consent-status { display: inline-block; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 14px; }
          .status-yes { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
          .status-no { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
          .signature-box { margin-top: 40px; }
          .signature-box h3 { color: #334155; margin-bottom: 15px; }
          .signature-img { border: 2px solid ${thx.htmlMain}; border-radius: 8px; max-height: 150px; padding: 10px; background: white; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; }
          .print-btn { display: block; margin: 0 auto 30px auto; padding: 12px 24px; background: ${thx.htmlMain}; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; }
          @media print { .print-btn { display: none; } .container { border: none; box-shadow: none; padding: 0; } }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ ${l('printPdfBtn')}</button>
        <div class="container">
          <div class="header">
            <h1>${lang === 'zh' ? schoolNameZh : schoolNameEn}</h1>
            <h2>${formTitle} - ${l('consentTitle')}</h2>
            <p>${l('fillDate')}${submittedData.dateStr}</p>
          </div>
          
          <div class="info-block">
            ${collectedFields.map(id => `
              <div class="info-item">
                <strong>${FIELD_CONFIG.find(f => f.id === id)?.[lang]}</strong>
                <span>${submittedData.formData?.[id] || submittedData[id] || ''}</span>
              </div>
            `).join('')}
          </div>

          <div class="consents-list">
    `;

    authItems.forEach((item, i) => {
      const ans = submittedData.consents[item.id];
      const isYes = ans === 'yes';
      htmlContent += `
        <div class="consent-item">
          <h3>${i+1}. ${item.title}</h3>
          <div class="consent-status ${isYes ? 'status-yes' : 'status-no'}">
            ${isYes ? '✓ ' + l('agreeAuth') : '✕ ' + l('disagreeAuth')}
          </div>
        </div>
      `;
    });

    htmlContent += `
          </div>
          
          <div class="signature-box">
            <h3>${l('parentSignatureLabel')}</h3>
            <img class="signature-img" src="${submittedData.signatureData}" alt="Signature" />
          </div>
          
          <div class="footer">
            <p>${l('receiptNotice')}</p>
          </div>
        </div>
        <script>
          window.onload = function() {
             setTimeout(function() {
               window.print();
             }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      const blob = new Blob(['\uFEFF' + htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${formTitle}_${l('consentTitle')}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- Admin Logic & Export ---
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!user) return setLoginError('系統尚未就緒，請稍後。');
    try {
      const authRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'admin_auth');
      const authDoc = await getDoc(authRef);
      let correctPwd = 'admin';
      if (authDoc.exists()) { correctPwd = authDoc.data().password; } 
      else { await setDoc(authRef, { password: 'admin' }); }

      if (loginPassword === correctPwd) {
        setViewMode('admin'); setShowLoginModal(false); setLoginPassword('');
        if (correctPwd === 'admin') {
          setIsDefaultPwd(true); setShowPwdModal(true);
          setTimeout(() => setToastMsg("⚠️ 系統安全提醒：請務必變更預設密碼！"), 500);
        } else { setIsDefaultPwd(false); }
      } else { setLoginError('密碼錯誤，請重新輸入。'); }
    } catch (error) { setLoginError('驗證失敗，請檢查網路。'); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) return;
    try {
      const authRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'admin_auth');
      await setDoc(authRef, { password: newPassword }, { merge: true });
      setPwdUpdateMsg({ type: 'success', text: '密碼更新成功！' });
      setIsDefaultPwd(false);
      setTimeout(() => { setShowPwdModal(false); setNewPassword(''); setPwdUpdateMsg({ type: '', text: '' }); }, 1500);
    } catch (error) { setPwdUpdateMsg({ type: 'error', text: '更新失敗，請重試。' }); }
  };

  const downloadCSV = () => {
    const dynamicHeaders = [...collectedFields.map(id => FIELD_CONFIG.find(f => f.id === id)?.zh || id), ...authItems.map(item => item.title), '簽名狀態'];
    
    const rows = sortedSubmissions.map(sub => {
      const basicCells = collectedFields.map(id => `="${sub.formData?.[id] || sub[id] || ''}"`);
      const authCells = authItems.map(item => sub.consents?.[item.id] === 'yes' ? '同意' : (sub.consents?.[item.id] === 'no' ? '不同意' : '無紀錄'));
      return [
        new Date(sub.timestamp).toLocaleString('zh-TW'),
        ...basicCells,
        ...authCells,
        sub.signatureData ? '已簽署' : '未簽署'
      ];
    });

    const csvContent = [
      ['填寫時間', ...dynamicHeaders].join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${formTitle}_純文字名單_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateReportHTML = () => {
    const thx = THEME_HEX[themeColor] || THEME_HEX.teal;
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="utf-8">
        <title>${formTitle} - 同意書名單</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, '微軟正黑體', sans-serif; padding: 30px; color: #333; background: #f8fafc; }
          .page-container { background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); max-width: 1400px; margin: 0 auto; }
          .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${thx.htmlMain}; padding-bottom: 15px; margin-bottom: 20px; }
          h2 { color: ${thx.htmlMain}; margin: 0; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 14px; }
          th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; vertical-align: middle; }
          th { background-color: ${thx.htmlLight}; font-weight: bold; color: ${thx.htmlMain}; }
          tr:nth-child(even) { background-color: #f8fafc; }
          tr:hover { background-color: ${thx.htmlLight}; }
          img.sig-thumbnail { max-height: 50px; display: block; border: 1px solid #e2e8f0; border-radius: 6px; background: white; padding: 4px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
          img.sig-thumbnail:hover { transform: scale(1.15); box-shadow: 0 4px 10px ${thx.htmlShadow}; border-color: ${thx.htmlMain}; }
          .print-btn { padding: 10px 24px; background: ${thx.htmlMain}; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background 0.2s; }
          .print-btn:hover { background: ${thx.htmlHover}; }
          .alert-box { background: #fffbeb; color: #b45309; padding: 15px; border-radius: 8px; border: 1px solid #fef3c7; margin-bottom: 20px; font-size: 14px; line-height: 1.5; }
          #sigModal { display: none; position: fixed; z-index: 9999; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(15, 23, 42, 0.85); backdrop-filter: blur(4px); align-items: center; justify-content: center; }
          #sigModal .modal-content { position: relative; background: #fff; padding: 25px; border-radius: 16px; max-width: 90%; max-height: 90%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4); display: flex; flex-direction: column; align-items: center; animation: modalIn 0.3s ease-out; }
          #sigModal img { max-width: 100%; max-height: 65vh; object-fit: contain; border: 2px dashed #cbd5e1; padding: 10px; border-radius: 8px; background: #f8fafc; }
          #sigModal .close-btn { position: absolute; top: -15px; right: -15px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 24px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.2); transition: background 0.2s; }
          #sigModal .close-btn:hover { background: #dc2626; transform: scale(1.05); }
          #sigModal .modal-title { font-size: 20px; font-weight: bold; color: ${thx.htmlMain}; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; width: 100%; text-align: center; }
          @keyframes modalIn { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @media print { .no-print { display: none !important; } body { padding: 0; background: #fff; } .page-container { box-shadow: none; padding: 0; max-width: 100%; } #sigModal { display: none !important; } img.sig-thumbnail { max-height: 60px; border: none; padding: 0; } }
        </style>
      </head>
      <body>
        <div class="page-container">
          <div class="no-print header-container">
            <h2>📝 簽名圖檔報表系統</h2>
            <button class="print-btn" onclick="window.print()">🖨️ 列印 / 另存為 PDF</button>
          </div>
          <div class="no-print alert-box">
            <strong>💡 小提示：</strong><br>
            1. 點擊表格中的「家長簽名圖檔」即可放大檢視完整簽名。<br>
            2. 您可以點擊右上方按鈕將此報表印出或另存為 PDF 檔。
          </div>
          <h2 style="text-align:center; margin-bottom: 25px; color: #1e293b;">${schoolNameZh}<br>${formTitle} 同意書名單</h2>
          <table>
            <thead>
              <tr>
                <th width="5%" style="text-align:center;">序號</th>
                <th width="12%">填寫時間</th>
                ${collectedFields.map(id => `<th>${FIELD_CONFIG.find(f => f.id === id)?.zh || id}</th>`).join('')}
                ${authItems.map(item => `<th>${item.title}</th>`).join('')}
                <th width="20%">家長簽名 (點擊放大)</th>
              </tr>
            </thead>
            <tbody>
              ${sortedSubmissions.map((sub, index) => `
                <tr>
                  <td style="text-align:center;"><strong>${index + 1}</strong></td>
                  <td>${new Date(sub.timestamp).toLocaleString('zh-TW')}</td>
                  ${collectedFields.map(id => `<td>${sub.formData?.[id] || sub[id] || ''}</td>`).join('')}
                  ${authItems.map(item => `
                    <td>
                      <span style="color: ${sub.consents?.[item.id] === 'yes' ? '#166534' : (sub.consents?.[item.id] === 'no' ? '#991b1b' : '#64748b')}; font-weight: bold;">
                        ${sub.consents?.[item.id] === 'yes' ? '同意' : (sub.consents?.[item.id] === 'no' ? '不同意' : '無紀錄')}
                      </span>
                    </td>
                  `).join('')}
                  <td>${sub.signatureData ? `<img class="sig-thumbnail" src="${sub.signatureData}" alt="簽名" onclick="openModal('${sub.signatureData}', '家長簽名')" title="點擊放大預覽" />` : '<span style="color: #94a3b8;">未簽署</span>'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div id="sigModal" onclick="closeModal()">
          <div class="modal-content" onclick="event.stopPropagation()">
            <button class="close-btn" onclick="closeModal()">×</button>
            <div class="modal-title" id="modalTitle">家長簽名預覽</div>
            <img id="modalImg" src="" alt="放大簽名">
          </div>
        </div>
        <script>
          function openModal(src, studentInfo) {
            document.getElementById('modalImg').src = src;
            document.getElementById('modalTitle').innerText = studentInfo;
            document.getElementById('sigModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
          }
          function closeModal() {
            document.getElementById('sigModal').style.display = 'none';
            document.getElementById('modalImg').src = '';
            document.body.style.overflow = '';
          }
          document.addEventListener('keydown', function(event) { if (event.key === 'Escape') closeModal(); });
        </script>
      </body>
      </html>
    `;
    return htmlContent;
  };

  const openReportPreview = () => {
    setAdminReportHtml(generateReportHTML());
    setShowAdminReportPreview(true);
  };

  const handleDownloadAdminReport = () => {
    const blob = new Blob(['\uFEFF' + adminReportHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${formTitle}_圖檔報表_${new Date().toISOString().slice(0,10)}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowAdminReportPreview(false);
  };

  const handlePrintAdminReport = () => {
    const printHtml = adminReportHtml.replace('</body>', '<script>setTimeout(function(){ window.print(); }, 500);</script></body>');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
    } else {
      showToast("請允許瀏覽器開啟彈跳視窗，以進行列印。");
    }
  };

  // --- Render Admin View ---
  if (viewMode === 'admin') {
    return (
      <div className="min-h-screen bg-[#F5F5F0] p-4 md:p-8 font-sans text-stone-800 relative pb-20">
        <ThemeSafelist />
        {toastMsg && (
          <div className={t("fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-teal-900 text-stone-50 px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center animate-fade-in-down")}>
            <Check className={t("w-4 h-4 mr-2 text-teal-300")} />
            {toastMsg}
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className={t("text-2xl font-bold text-teal-900 flex items-center")}>
                <Database className={t("w-6 h-6 mr-3 text-teal-700")} />
                管理後台：同意書資料庫
              </h1>
              <p className="text-sm text-stone-500 mt-1">{formTitle} 專案</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setDeleteTarget({ type: 'all' })} disabled={submissions.length === 0} className="flex items-center px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition"><Trash2 className="w-4 h-4 mr-2" /> 全部移除</button>
              <button onClick={downloadCSV} className="flex items-center px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-sm font-medium transition"><Download className="w-4 h-4 mr-2" /> 匯出 CSV (純文字)</button>
              <button onClick={openReportPreview} className={t("flex items-center px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-sm font-medium transition shadow-sm border border-teal-200")}><FileText className="w-4 h-4 mr-2" /> 匯出報表 (含圖檔)</button>
              <button onClick={() => setShowPwdModal(true)} className="flex items-center px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-sm font-medium transition"><Settings className="w-4 h-4 mr-2" /> 更改密碼</button>
              <button onClick={() => setViewMode('form')} className={t("flex items-center px-4 py-2 bg-teal-800 text-white hover:bg-teal-900 rounded-lg text-sm font-medium transition")}><LogOut className="w-4 h-4 mr-2" /> 登出後台</button>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-6 items-start">
            {/* Form Setup Left Column */}
            <div className="w-full xl:w-[400px] flex-shrink-0 bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sticky top-6">
              <h2 className={t("text-lg font-bold text-teal-900 mb-5 flex items-center border-b border-stone-100 pb-3")}>
                <Type className={t("w-5 h-5 mr-2 text-teal-700")} />
                基礎設定與收集資料
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-bold text-stone-700">表單總開關</label>
                    <span className="text-xs text-stone-500">關閉後家長將無法填寫</span>
                  </div>
                  <button 
                    onClick={() => setEditIsFormOpen(!editIsFormOpen)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editIsFormOpen ? t('bg-teal-600') : 'bg-stone-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editIsFormOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-1">學校中文名稱</label>
                  <input type="text" value={editSchoolNameZh} onChange={e => setEditSchoolNameZh(e.target.value)} className={t("w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none transition text-sm text-stone-800")} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-1">學校英文名稱</label>
                  <input type="text" value={editSchoolNameEn} onChange={e => setEditSchoolNameEn(e.target.value)} className={t("w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none transition text-sm text-stone-800")} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-500 mb-1 flex items-center"><Palette className="w-4 h-4 mr-1"/>系統主題配色</label>
                  <select value={editThemeColor} onChange={e => setEditThemeColor(e.target.value)} className={t("w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none transition text-sm text-stone-800")}>
                    <option value="teal">湖水綠 (Teal) - 預設</option>
                    <option value="blue">知性藍 (Blue)</option>
                    <option value="indigo">靛青紫 (Indigo)</option>
                    <option value="violet">羅蘭紫 (Violet)</option>
                    <option value="rose">玫瑰紅 (Rose)</option>
                  </select>
                </div>
                <div className="pt-2 border-t border-stone-100">
                  <label className="block text-sm font-bold text-stone-500 mb-1">自訂表單大標題 (活動名稱)</label>
                  <input type="text" value={editFormTitle} onChange={e => setEditFormTitle(e.target.value)} placeholder="例如：日本中能登中學校國際交流" className={t("w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none transition text-sm text-stone-800")} />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1"><label className="block text-sm font-bold text-stone-500 mb-1">開始日期</label><input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} className={t("w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none text-sm text-stone-800")} /></div>
                  <div className="flex-1"><label className="block text-sm font-bold text-stone-500 mb-1">結束日期</label><input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} className={t("w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none text-sm text-stone-800")} /></div>
                </div>

                {/* 動態收集欄位設定 */}
                <div className="pt-4 border-t border-stone-100">
                  <label className="block text-sm font-bold text-stone-500 mb-2 flex items-center">勾選收集資料項目</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FIELD_CONFIG.map(field => (
                      <label key={field.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg border border-stone-200 hover:bg-stone-50 transition">
                        <input 
                          type="checkbox"
                          checked={editCollectedFields.includes(field.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newFields = [...editCollectedFields, field.id];
                              const orderedFields = FIELD_CONFIG.map(f => f.id).filter(id => newFields.includes(id));
                              setEditCollectedFields(orderedFields);
                            } else {
                              setEditCollectedFields(editCollectedFields.filter(id => id !== field.id));
                            }
                          }}
                          className={t("w-4 h-4 text-teal-600 rounded")}
                        />
                        <span className="text-sm font-medium text-stone-700">{field.zh}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <label className={t("block text-sm font-bold text-teal-800")}>同意書授權項目管理</label>
                  <span className="text-xs text-stone-400">目前共 {editAuthItems.length} 項</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
                  {editAuthItems.map((item, index) => (
                    <div key={item.id} className="bg-stone-50 border border-stone-200 p-4 rounded-xl relative group">
                      <button onClick={() => removeEditAuthItem(item.id)} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-rose-600" title="移除此項目"><X className="w-4 h-4" /></button>
                      <div className="space-y-3">
                        <div><label className="block text-xs font-bold text-stone-500 mb-1">項目 {index + 1} 標題</label><input type="text" value={item.title} onChange={e => updateEditAuthItem(item.id, 'title', e.target.value)} className={t("w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-1 focus:ring-teal-500 outline-none text-sm font-bold text-teal-900")} /></div>
                        <div><label className="block text-xs font-bold text-stone-500 mb-1">授權說明內容</label><textarea value={item.description} onChange={e => updateEditAuthItem(item.id, 'description', e.target.value)} rows="4" className={t("w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-1 focus:ring-teal-500 outline-none text-sm text-stone-700 resize-none whitespace-pre-wrap")} /></div>
                        <div><label className="block text-xs font-bold text-stone-500 mb-1">詢問文字</label><input type="text" value={item.question} onChange={e => updateEditAuthItem(item.id, 'question', e.target.value)} className={t("w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-1 focus:ring-teal-500 outline-none text-sm text-stone-800")} /></div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={addEditAuthItem} className={t("w-full py-3 border-2 border-dashed border-teal-300 text-teal-700 hover:bg-teal-50 rounded-xl font-bold flex items-center justify-center transition text-sm")}><PlusCircle className="w-4 h-4 mr-2" /> 新增授權項目</button>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100">
                <button onClick={handleSaveSettings} className={t("w-full py-3 bg-teal-800 text-white rounded-xl font-bold hover:bg-teal-900 transition shadow-md")}>儲存所有設定並發佈</button>
              </div>
            </div>

            {/* Right Column: Submissions Table */}
            <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-6 overflow-hidden">
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-stone-50 text-stone-600 text-sm">
                      <th className="p-4 border-b border-stone-200 font-medium whitespace-nowrap">序號</th>
                      <th 
                        className={t("p-4 border-b border-stone-200 font-medium whitespace-nowrap cursor-pointer hover:bg-stone-100 hover:text-teal-700 transition select-none group")}
                        onClick={() => handleSort('timestamp')}
                      >
                        <div className="flex items-center">
                          填寫時間
                          {sortConfig.key === 'timestamp' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1"/> : <ChevronDown className="w-4 h-4 ml-1"/>)}
                          {sortConfig.key !== 'timestamp' && <ChevronDown className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-30"/>}
                        </div>
                      </th>
                      
                      {/* 動態表頭 */}
                      {collectedFields.map(id => {
                        const fieldLabel = FIELD_CONFIG.find(f => f.id === id)?.zh || id;
                        return (
                          <th key={id} className={t("p-4 border-b border-stone-200 font-medium whitespace-nowrap cursor-pointer hover:bg-stone-100 hover:text-teal-700 transition select-none group")} onClick={() => handleSort(id)}>
                            <div className="flex items-center">
                              {fieldLabel}
                              {sortConfig.key === id && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 ml-1"/> : <ChevronDown className="w-4 h-4 ml-1"/>)}
                              {sortConfig.key !== id && <ChevronDown className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-30"/>}
                            </div>
                          </th>
                        );
                      })}

                      {authItems.map(item => (<th key={item.id} className="p-4 border-b border-stone-200 font-medium max-w-[150px] truncate" title={item.title}>{item.title}</th>))}
                      <th className="p-4 border-b border-stone-200 font-medium whitespace-nowrap">家長簽名 (點擊)</th>
                      <th className="p-4 border-b border-stone-200 font-medium text-center whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {sortedSubmissions.length === 0 ? (
                      <tr><td colSpan={5 + collectedFields.length + authItems.length} className="text-center p-12 text-stone-400">目前尚無資料</td></tr>
                    ) : (
                      sortedSubmissions.map((sub, index) => (
                        <tr key={sub.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition">
                          <td className={t("p-4 font-bold text-teal-700 whitespace-nowrap")}>{index + 1}</td>
                          <td className="p-4 text-stone-500 whitespace-nowrap">{new Date(sub.timestamp).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })}</td>
                          
                          {/* 動態資料列 */}
                          {collectedFields.map(id => (
                            <td key={id} className="p-4 font-medium text-stone-800 whitespace-nowrap">
                              {sub.formData?.[id] || sub[id] || ''}
                            </td>
                          ))}

                          {authItems.map(item => (
                            <td key={item.id} className="p-4 whitespace-nowrap">
                              {sub.consents?.[item.id] === 'yes' ? <span className={t("inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100")}>同意</span> : sub.consents?.[item.id] === 'no' ? <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100">不同意</span> : <span className="text-stone-400 text-xs italic">無紀錄</span>}
                            </td>
                          ))}
                          <td className="p-4 whitespace-nowrap">
                            {sub.signatureData ? (
                              <div onClick={() => setPreviewSignature(sub.signatureData)} className={t("relative group cursor-pointer inline-block border border-stone-200 rounded bg-white p-1 hover:border-teal-400 transition")} title="點擊放大預覽">
                                <img src={sub.signatureData} alt="Signature" className="h-10 object-contain" />
                                <div className={t("absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition")}><ZoomIn className={t("w-4 h-4 text-teal-700")} /></div>
                              </div>
                            ) : <span className="text-stone-400 italic">未簽名</span>}
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <button onClick={() => setDeleteTarget({ type: 'single', id: sub.id })} className="p-2 bg-rose-50 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition" title="移除此筆資料"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-stone-500 text-right">
                共計收集 {submissions.length} 份同意書
              </div>
            </div>
          </div>
        </div>

        {/* Delete Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[130] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative shadow-2xl animate-fade-in-up">
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-6 mx-auto"><AlertCircle className="w-8 h-8" /></div>
              <h3 className="text-2xl font-bold text-center text-stone-900 mb-2">{deleteTarget.type === 'all' ? '確定要全部移除嗎？' : '確定要移除這筆資料嗎？'}</h3>
              <p className="text-center text-stone-500 mb-8 leading-relaxed">{deleteTarget.type === 'all' ? '此操作將會永久刪除所有收集到的同意書資料，且無法復原。' : '移除後資料將無法復原，請確認是否繼續。'}</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="flex-1 py-3 px-4 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition">取消</button>
                <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-3 px-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition flex justify-center items-center">{isDeleting ? '移除中...' : '確定移除'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Signature Preview Modal */}
        {previewSignature && (
          <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4 touch-none" onClick={() => setPreviewSignature(null)}>
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full relative shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
              <button onClick={() => setPreviewSignature(null)} className="absolute top-5 right-5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 p-2 rounded-full transition"><X className="w-6 h-6" /></button>
              <h3 className={t("text-xl font-bold text-teal-900 mb-4 border-b border-stone-100 pb-3 flex items-center")}><ZoomIn className={t("w-5 h-5 mr-2 text-teal-700")} />家長簽名預覽</h3>
              <div className="bg-stone-50 border-2 border-stone-200 border-dashed rounded-2xl flex justify-center items-center p-4 min-h-[200px]"><img src={previewSignature} alt="Signature Preview Large" className="w-full h-auto max-h-[60vh] object-contain" /></div>
            </div>
          </div>
        )}

        {/* Admin Report Preview Modal */}
        {showAdminReportPreview && (
          <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-sm z-[140] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-6xl w-full relative shadow-2xl flex flex-col h-[90vh] animate-fade-in-up">
              <button onClick={() => setShowAdminReportPreview(false)} className="absolute top-5 right-5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 p-2 rounded-full transition z-10">
                <X className="w-6 h-6" />
              </button>
              <h3 className={t("text-xl sm:text-2xl font-bold text-teal-900 mb-4 border-b border-stone-100 pb-3 flex items-center shrink-0")}>
                <FileText className={t("w-6 h-6 mr-2 text-teal-700")} />
                報表匯出預覽
              </h3>
              
              <div className="flex-1 overflow-hidden bg-stone-100 border-2 border-stone-200 rounded-xl mb-6 relative">
                 <iframe srcDoc={adminReportHtml} className="w-full h-full bg-white absolute inset-0" title="Admin Report Preview" />
              </div>

              <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row gap-4 shrink-0">
                <button onClick={() => setShowAdminReportPreview(false)} className="flex-1 py-3 px-4 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition">
                  返回修改
                </button>
                <button onClick={handleDownloadAdminReport} className="flex-1 py-3 px-4 bg-stone-800 text-white rounded-xl font-bold hover:bg-stone-900 transition flex justify-center items-center">
                  <Download className="w-5 h-5 mr-2" /> 下載 HTML 檔案
                </button>
                <button onClick={handlePrintAdminReport} className={t("flex-1 py-3 px-4 bg-teal-700 text-white rounded-xl font-bold hover:bg-teal-800 transition flex justify-center items-center")}>
                  <FileCheck className="w-5 h-5 mr-2" /> 確定開啟列印
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPwdModal && (
          <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
              <button onClick={() => setShowPwdModal(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
              <h3 className={t("text-lg font-bold text-teal-900 mb-4 flex items-center")}><Key className={t("w-5 h-5 mr-2 text-teal-700")} />修改後台密碼</h3>
              {isDefaultPwd && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-bold flex items-start"><AlertCircle className="w-5 h-5 mr-2 shrink-0" />為保護個資安全，系統強制提醒：請務必將預設密碼變更為您的專屬密碼。</div>}
              <form onSubmit={handleChangePassword}>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="請輸入新密碼" className={t("w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none mb-4 text-stone-800")} required />
                {pwdUpdateMsg.text && <div className={`mb-4 text-sm ${pwdUpdateMsg.type === 'success' ? t('text-teal-700') : 'text-rose-600'}`}>{pwdUpdateMsg.text}</div>}
                <button type="submit" className={t("w-full py-3 bg-teal-800 text-white rounded-xl font-medium hover:bg-teal-900 transition")}>確認修改</button>
              </form>
            </div>
          </div>
        )}
        <div className="w-full text-center text-stone-400 text-sm mt-12 pb-4">
          @2026 Master
        </div>
      </div>
    );
  }

  // --- Render Form View ---
  return (
    <div className="min-h-screen bg-stone-200/60 py-8 px-4 sm:px-6 lg:px-8 font-sans text-stone-800 relative">
      <ThemeSafelist />
      
      {toastMsg && (
        <div className={t("fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-teal-900 text-stone-50 px-6 py-3 rounded-full shadow-lg text-sm font-medium flex items-center animate-fade-in-down")}>
          <AlertCircle className="w-4 h-4 mr-2 text-amber-300" />
          {toastMsg}
        </div>
      )}

      {/* Feature 1: Form Closed View */}
      {!isFormOpen && !submitSuccess && (
        <div className="max-w-3xl mx-auto bg-[#FCFBF9] rounded-3xl shadow-xl border border-stone-100 overflow-hidden relative z-10 p-12 text-center flex flex-col items-center">
          
          {/* Language Switcher */}
          <div className="absolute top-6 right-6 z-20 flex items-center bg-white border border-stone-200 rounded-lg px-3 py-1.5 shadow-sm hover:bg-stone-50 transition cursor-pointer">
            <Globe className="w-4 h-4 text-stone-500 mr-2" />
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value)}
              className="bg-transparent text-sm font-bold text-stone-600 outline-none cursor-pointer appearance-none pr-4"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2 pointer-events-none" />
          </div>

          <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6 border border-stone-200 mt-4">
            <Power className="w-10 h-10 text-stone-400" />
          </div>
          <h1 className="text-3xl font-bold text-stone-700 mb-4">{l('formClosedTitle')}</h1>
          <p className="text-lg text-stone-500 leading-relaxed max-w-md">
            {l('formClosedDesc')}
          </p>
        </div>
      )}

      {/* Main Form View */}
      {isFormOpen && (
        <div className="max-w-3xl mx-auto bg-[#FCFBF9] rounded-3xl shadow-xl border border-stone-100 overflow-hidden relative z-10">
          
          <div className={t("relative bg-teal-800 text-stone-50 p-8 sm:p-12 overflow-hidden")}>
            <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4"><Globe className="w-48 h-48" /></div>
            
            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-20 flex items-center bg-white/10 backdrop-blur-md border border-white/30 rounded-lg px-3 py-1.5 shadow-sm hover:bg-white/20 transition cursor-pointer">
              <Globe className="w-4 h-4 text-white mr-2" />
              <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value)}
                className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer appearance-none pr-4"
              >
                <option value="zh" className="text-stone-800">中文</option>
                <option value="en" className="text-stone-800">English</option>
                <option value="ja" className="text-stone-800">日本語</option>
              </select>
              <ChevronDown className="w-4 h-4 text-white/80 absolute right-2 pointer-events-none" />
            </div>

            <div className="relative z-10 mt-6 sm:mt-0">
              <div className={t("flex items-center space-x-2 text-teal-200 font-medium tracking-widest text-xs uppercase mb-3")}>
                <FileText className="w-4 h-4" /><span>{schoolNameEn}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-wide mb-2 leading-snug">{lang === 'zh' ? schoolNameZh : schoolNameEn}<br/>{formTitle}</h1>
              <h2 className={t("text-xl sm:text-2xl text-teal-100/80 font-light border-l-4 border-teal-500 pl-4 mt-4")}>{l('consentTitle')}</h2>
              {displayStartDate && displayEndDate && (
                <div className={t("mt-6 inline-block bg-teal-900/50 px-5 py-3 rounded-xl border border-teal-600/30 backdrop-blur-sm")}>
                  <span className="text-stone-50 text-base font-medium flex items-center"><Calendar className={t("w-5 h-5 mr-3 text-teal-300")} />{l('activityTime')}：{displayStartDate} ~ {displayEndDate}</span>
                </div>
              )}
            </div>
          </div>

          {submitSuccess ? (
            <div className="p-12 text-center flex flex-col items-center bg-[#FCFBF9]">
              <div className={t("w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-6 border border-teal-100")}><Check className={t("w-10 h-10 text-teal-600")} /></div>
              <h3 className={t("text-3xl font-bold text-teal-900 mb-2")}>{l('successTitle')}</h3>
              <p className="text-stone-500 mb-8 text-lg">{l('successDesc')}</p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                {/* Feature 5: 預覽/下載憑證 */}
                <button onClick={() => setShowReceiptPreview(true)} className={t("px-6 py-4 bg-teal-50 text-teal-800 border-2 border-teal-600 rounded-xl hover:bg-teal-100 transition shadow-sm font-bold text-lg flex items-center justify-center")}>
                  <FileCheck className="w-5 h-5 mr-2"/> {l('downloadReceipt')}
                </button>
                <button onClick={resetForm} className={t("px-6 py-4 bg-teal-800 text-white rounded-xl hover:bg-teal-900 transition shadow-sm font-bold text-lg")}>
                  {l('returnFill')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 sm:p-12 space-y-12">
              
              <div className="bg-stone-100/80 p-6 sm:p-8 rounded-3xl border border-stone-200">
                <h3 className={t("text-xl font-bold text-teal-900 flex items-center mb-5")}><ShieldCheck className={t("w-6 h-6 mr-3 text-teal-700")} />{l('pdpaTitle')}</h3>
                <div className="text-base text-stone-700 space-y-2 mb-6 leading-relaxed">
                  <p>{l('pdpaNotice')}</p>
                  <ul className="list-disc pl-6 space-y-2 mt-2">
                    <li><strong className="text-stone-900">{l('pdpaPurpose')}</strong>：{l('pdpaPurposeText')}</li>
                    <li><strong className="text-stone-900">{l('pdpaCategory')}</strong>：{getDynamicPdpaText()}</li>
                    <li><strong className="text-stone-900">{l('pdpaPeriod')}</strong>：{l('pdpaPeriodText')}</li>
                  </ul>
                </div>
                <label className="flex items-start space-x-4 cursor-pointer group bg-white p-4 rounded-2xl border border-stone-200 hover:shadow-md transition">
                  <div className="flex-shrink-0 mt-0.5"><input type="checkbox" className={t("w-6 h-6 text-teal-700 border-stone-300 rounded focus:ring-teal-600")} checked={pdpaConsent} onChange={(e) => setPdpaConsent(e.target.checked)} /></div>
                  <span className={t("text-base font-bold text-stone-800 group-hover:text-teal-900 transition")}>{l('pdpaAgree')}</span>
                </label>
              </div>

              {/* 動態表單輸入區塊 */}
              <div className="space-y-6 pt-6">
                <h3 className={t("text-2xl font-bold text-teal-900 border-b border-stone-200 pb-4 flex items-center")}><Edit3 className={t("w-7 h-7 mr-3 text-teal-700")} />{l('studentInfoTitle')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {collectedFields.map(fieldId => {
                    const config = FIELD_CONFIG.find(f => f.id === fieldId);
                    const val = formData[fieldId] || '';
                    
                    let isError = false;
                    let errorMsg = '';
                    if (val) {
                       if (fieldId === 'studentId' && !/^\d{5}$/.test(val)) { isError = true; errorMsg = l('classNumberError'); }
                       if (fieldId === 'parentPhone' && !/^[\d\-\+\s#()]{8,20}$/.test(val)) { isError = true; errorMsg = l('parentPhoneError'); }
                    }

                    return (
                      <div key={fieldId} className={['parentPhone', 'idNumber'].includes(fieldId) ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                          {config[lang]} <span className="text-rose-500">*</span>
                        </label>
                        
                        {config.type === 'select' ? (
                           <select 
                             value={val} onChange={(e) => handleFieldChange(fieldId, e.target.value)}
                             className={t(`w-full px-5 py-4 bg-white border-2 rounded-2xl focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition text-lg font-medium text-stone-800 ${isError ? 'border-rose-400' : 'border-stone-200'}`)}
                           >
                             <option value="" disabled>{lang === 'zh' ? '請選擇' : lang === 'en' ? 'Select' : '選択してください'}</option>
                             {config.options[lang].map((opt, i) => (
                               <option key={i} value={config.options.zh[i]}>{opt}</option> 
                             ))}
                           </select>
                        ) : (
                           <input 
                             type={config.type} 
                             placeholder={config.placeholder?.[lang] || ''}
                             maxLength={fieldId === 'studentId' ? 5 : undefined}
                             className={t(`w-full px-5 py-4 bg-white border-2 rounded-2xl focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 outline-none transition text-lg font-medium text-stone-800 placeholder:text-stone-300 ${isError ? 'border-rose-400' : 'border-stone-200'}`)}
                             value={val} 
                             onChange={(e) => {
                               let newVal = e.target.value;
                               if (fieldId === 'studentId') newVal = newVal.replace(/\D/g, '');
                               handleFieldChange(fieldId, newVal);
                             }}
                           />
                        )}
                        {isError && <p className="text-xs text-rose-500 mt-2">{errorMsg}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-8">
                <h3 className={t("text-2xl font-bold text-teal-900 flex items-center border-b border-stone-200 pb-4")}><AlertCircle className={t("w-7 h-7 mr-3 text-teal-700")} />{l('authItemsTitle')}</h3>
                {authItems.map((item, index) => (
                  <div key={item.id} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={t("bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded-lg text-sm")}>{l('item')} {index + 1}</span>
                      <h4 className={t("text-xl font-bold text-teal-900")}>{item.title}</h4>
                    </div>
                    <p className="text-base text-stone-600 leading-relaxed bg-stone-50 p-5 rounded-2xl border border-stone-100 whitespace-pre-wrap">{item.description}</p>
                    <div className="pt-2">
                      <p className="text-base font-bold text-stone-800 mb-4">{item.question}</p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <label className={t(`flex-1 flex items-center justify-center space-x-3 p-5 rounded-2xl border-2 cursor-pointer transition-all ${consents[item.id] === 'yes' ? 'border-teal-600 bg-teal-50 shadow-md' : 'border-stone-200 hover:border-stone-300 bg-white'}`)}>
                          <input type="radio" name={item.id} value="yes" checked={consents[item.id] === 'yes'} onChange={() => setConsents({...consents, [item.id]: 'yes'})} className="hidden" />
                          <Check className={t(`w-6 h-6 ${consents[item.id] === 'yes' ? 'text-teal-600' : 'text-stone-300'}`)} />
                          <span className={t(`text-xl font-bold ${consents[item.id] === 'yes' ? 'text-teal-900' : 'text-stone-500'}`)}>{l('agree')}</span>
                        </label>
                        <label className={t(`flex-1 flex items-center justify-center space-x-3 p-5 rounded-2xl border-2 cursor-pointer transition-all ${consents[item.id] === 'no' ? 'border-rose-400 bg-rose-50 shadow-md' : 'border-stone-200 hover:border-stone-300 bg-white'}`)}>
                          <input type="radio" name={item.id} value="no" checked={consents[item.id] === 'no'} onChange={() => setConsents({...consents, [item.id]: 'no'})} className="hidden" />
                          <X className={`w-6 h-6 ${consents[item.id] === 'no' ? 'text-rose-500' : 'text-stone-300'}`} />
                          <span className={`text-xl font-bold ${consents[item.id] === 'no' ? 'text-rose-900' : 'text-stone-500'}`}>{l('disagree')}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6 pt-4">
                <div className="flex items-end justify-between border-b border-stone-200 pb-3">
                  <h3 className={t("text-2xl font-bold text-teal-900")}>{l('signatureTitle')}</h3>
                  <span className="text-sm text-rose-600 bg-rose-50 px-2 py-1 rounded font-bold">{l('signatureWarning')}</span>
                </div>
                <div onClick={() => setShowSignatureModal(true)} className="relative border-4 border-stone-200 border-dashed rounded-[2rem] bg-white overflow-hidden hover:bg-stone-50 transition cursor-pointer flex flex-col items-center justify-center min-h-[16rem] shadow-sm group">
                  {signatureData ? (
                    <img src={signatureData} alt="已簽名" className="w-full h-56 object-contain" />
                  ) : (
                    <div className={t("flex flex-col items-center justify-center text-stone-400 group-hover:text-teal-600 transition p-6 text-center")}>
                      <Edit3 className="w-16 h-16 mb-4 opacity-60" />
                      <span className="text-2xl font-bold">{l('clickToSign')}</span>
                      <span className="text-base mt-2 opacity-80">{l('touchSupport')}</span>
                    </div>
                  )}
                </div>
                {signatureData && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setSignatureData('')} className="px-5 py-3 text-base font-bold text-rose-500 hover:text-rose-700 bg-rose-50 rounded-xl transition flex items-center">
                      <Trash2 className="w-5 h-5 mr-2" /> {l('removeSignature')}
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-8 mt-8 border-t border-stone-200">
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className={t(`w-full py-5 rounded-[1.5rem] text-2xl font-bold shadow-xl transition-all duration-300 ${!isFormValid() ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none' : 'bg-teal-800 text-white hover:bg-teal-900 hover:shadow-2xl transform hover:-translate-y-1'}`)}
                >
                  {isSubmitting ? l('submittingText') : l('submitText')}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Admin Floating Icon */}
      <button onClick={() => setShowLoginModal(true)} className={t("fixed bottom-6 right-6 p-5 bg-white/90 backdrop-blur-md border border-stone-200 text-stone-400 hover:text-teal-700 rounded-full shadow-2xl hover:shadow-teal-900/20 transition-all z-40 group")} title="管理者登入"><Lock className="w-7 h-7 group-hover:scale-110 transition-transform" /></button>

      {/* Feature 5: Receipt Preview Modal (憑證預覽畫面) */}
      {showReceiptPreview && submittedData && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[140] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full relative shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up">
            <button onClick={() => setShowReceiptPreview(false)} className="absolute top-5 right-5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 p-2 rounded-full transition">
              <X className="w-6 h-6" />
            </button>
            <h3 className={t("text-2xl font-bold text-teal-900 mb-4 border-b border-stone-100 pb-3 flex items-center")}>
              <FileCheck className={t("w-6 h-6 mr-2 text-teal-700")} />
              {l('receiptPreviewTitle')}
            </h3>
            
            {/* 憑證內容預覽 (可滾動區域) */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <div className={t("border-2 border-teal-100 rounded-2xl p-6 bg-white")}>
                 <div className={t("text-center border-b-2 border-teal-600 pb-4 mb-6")}>
                    <h1 className={t("text-xl sm:text-2xl font-bold text-teal-800 mb-1")}>{lang === 'zh' ? schoolNameZh : schoolNameEn}</h1>
                    <h2 className={t("text-lg sm:text-xl font-bold text-teal-700")}>{formTitle} - {l('consentTitle')}</h2>
                    <p className="text-sm text-stone-500 mt-2">{l('fillDate')}{submittedData.dateStr}</p>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200 mb-6">
                    {collectedFields.map(id => (
                      <div key={id}>
                        <span className="block text-xs font-bold text-stone-400 mb-1">{FIELD_CONFIG.find(f => f.id === id)?.[lang]}</span>
                        <span className="text-lg font-bold text-stone-800">{submittedData.formData?.[id] || submittedData[id] || ''}</span>
                      </div>
                    ))}
                 </div>

                 <div className="space-y-4 mb-6">
                    {authItems.map((item, i) => {
                      const isYes = submittedData.consents[item.id] === 'yes';
                      return (
                        <div key={item.id} className="border-b border-stone-100 pb-4">
                          <h4 className="font-bold text-stone-700 mb-2">{i+1}. {item.title}</h4>
                          <div className={`inline-flex px-3 py-1 rounded-md text-sm font-bold border ${isYes ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {isYes ? '✓ ' + l('agreeAuth') : '✕ ' + l('disagreeAuth')}
                          </div>
                        </div>
                      );
                    })}
                 </div>

                 <div>
                    <h4 className="font-bold text-stone-700 mb-3">{l('parentSignatureLabel')}</h4>
                    <img src={submittedData.signatureData} alt="Signature" className={t("h-32 object-contain border-2 border-teal-600 rounded-xl p-2 bg-white")} />
                 </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 flex gap-4">
              <button onClick={() => setShowReceiptPreview(false)} className="flex-1 py-3 px-4 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition">
                {l('backBtn')}
              </button>
              <button onClick={executePrintReceipt} className={t("flex-1 py-3 px-4 bg-teal-700 text-white rounded-xl font-bold hover:bg-teal-800 transition flex justify-center items-center")}>
                {l('printPdfBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-[100] flex items-center justify-center sm:p-6 touch-none">
          <div className="bg-white w-full h-[100dvh] sm:h-[85vh] sm:max-w-4xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h3 className={t("text-2xl font-bold text-teal-900 flex items-center")}><Edit3 className={t("w-7 h-7 mr-3 text-teal-700")} />{l('signModalTitle')}</h3>
              <button onClick={() => setShowSignatureModal(false)} className="p-3 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200 transition"><X className="w-8 h-8" /></button>
            </div>
            <div className="flex-1 relative bg-white touch-none">
              <canvas ref={canvasRef} className="w-full h-full cursor-crosshair touch-none" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={endDrawing} onMouseLeave={endDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={endDrawing}></canvas>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-[0.03]"><Edit3 className="w-40 h-40 mb-4" /><span className={t("text-5xl font-bold text-teal-900 tracking-widest")}>{l('fullScreenPad')}</span></div>
            </div>
            <div className="p-5 border-t border-stone-100 bg-stone-50 flex justify-between items-center gap-4 pb-10 sm:pb-5">
              <button type="button" onClick={clearSignature} className="px-6 py-5 bg-white border-2 border-stone-300 rounded-2xl shadow-sm hover:bg-stone-100 text-stone-600 font-bold transition flex items-center text-xl"><Trash2 className="w-7 h-7 sm:mr-3" /><span className="hidden sm:inline">{l('clearSign')}</span></button>
              <button type="button" onClick={handleConfirmSignature} className={t("flex-1 py-5 bg-teal-800 text-white rounded-2xl shadow-lg hover:bg-teal-900 font-bold transition text-2xl flex justify-center items-center")}><Check className="w-8 h-8 mr-3" />{l('confirmSign')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-10 relative animate-fade-in-up">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 text-stone-400 hover:text-stone-600"><X className="w-7 h-7" /></button>
            <div className={t("w-16 h-16 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mb-8 shadow-inner")}><Unlock className="w-8 h-8" /></div>
            <h3 className={t("text-2xl font-bold text-teal-900 mb-2")}>教師管理後台</h3>
            <p className="text-lg text-stone-500 mb-8">請輸入管理密碼以檢視同意書</p>
            <form onSubmit={handleAdminLogin}>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="預設密碼為: admin" className={t("w-full px-5 py-4 bg-stone-50 border-2 border-stone-200 rounded-2xl focus:ring-4 focus:ring-teal-600/20 focus:border-teal-600 outline-none mb-3 text-xl text-stone-800")} autoFocus />
              {loginError && <p className="text-base font-bold text-rose-500 mb-5">{loginError}</p>}
              <button type="submit" className={t("w-full py-4 mt-6 bg-teal-800 text-white rounded-2xl text-xl font-bold hover:bg-teal-900 transition shadow-lg")}>登入</button>
            </form>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="w-full text-center text-stone-400 text-sm mt-12 pb-4">
        @2026 Master
      </div>
    </div>
  );
}