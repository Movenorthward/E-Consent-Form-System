📝 通用型電子同意書系統 (E-Consent Form System)

📖 專案簡介 (Description)

這是一個專為學校、教育機構或任何大型活動設計的**「全動態電子同意書系統」**。
具備手機全螢幕手寫簽名、動態自訂收集欄位與授權項目、多國語系支援，並內建強大的教師管理後台，可一鍵預覽並匯出包含「家長簽名圖檔」的整理報表。

A fully dynamic, multi-lingual E-Consent Form System designed for schools, educational institutions, and large events. Features include a mobile-friendly signature pad, customizable data fields, multi-language support (Zh/En/Ja), and a secure admin dashboard for exporting visual HTML/CSV reports.

✨ 核心特色功能

🎨 零程式碼！全動態前台設定

多國語系支援：前台內建 中文 (zh)、英文 (en)、日文 (ja) 即時切換，打破國際交流活動的語言障礙。

動態收集欄位：管理者可在後台自由勾選需要收集的個資（如：班級、座號、姓名、性別、生日、身分證字號、監護人、電話），前台表單與「個資蒐集聲明」會自動連動更新。

自訂主題與授權項目：提供 5 種質感莫蘭迪配色切換；可無限新增/修改授權項目（如肖像權、活動保險等）。

表單總開關：後台提供一鍵「開啟/關閉」表單功能，輕鬆控管資料收集期限。

📱 極致的使用者體驗 (家長端)

防滑動全螢幕簽名板：專為手機觸控設計，確保家長簽名時畫面不會滑動跑版。

嚴格防呆驗證：強制要求必填欄位格式（如 5 碼座號、電話格式），確保收集到的資料乾淨整齊。

預覽與下載授權憑證：家長送出表單後，可直接在網頁上「預覽」專屬的授權憑證，並支援「列印 / 存為 PDF」保留完整簽名紀錄，減少未來爭議。

📊 強大且安全的管理後台 (教師端)

專屬隱藏入口：首頁右下角點擊「鎖頭 🔒」圖示即可進入後台。

智慧列表排序：後台名單支援點擊標題「按填寫時間」或「按班級座號 / 各欄位」進行升降冪排序，點名對帳超方便。

多種報表匯出預覽：

純文字 CSV：供匯入 Excel 進行一般文書與名單處理。

含簽名圖檔 HTML 報表：完美解決 Excel 阻擋圖檔的問題。系統會先彈出「全螢幕預覽」，確認無誤後再一鍵列印或下載 HTML 檔案備查。

🛠️ 開源部署與安全設定指南 (必讀)

為了確保專案上傳至 GitHub 時不會外洩您的 API Key，並保護家長與學生的個人資料隱私，請在部署時嚴格遵守以下步驟：

1. 保護 Firebase API Key (環境變數設定)

本系統已支援環境變數載入，請不要將您的 Firebase Config 直接寫死在 App.jsx 中。
請在專案的根目錄建立一個 .env 檔案，並填入以下內容（請務必將 .env 加入 .gitignore 檔案中）：

# 若使用 Create React App (CRA):
REACT_APP_FIREBASE_API_KEY="您的API_KEY"
REACT_APP_FIREBASE_AUTH_DOMAIN="您的DOMAIN"
REACT_APP_FIREBASE_PROJECT_ID="您的PROJECT_ID"
REACT_APP_FIREBASE_STORAGE_BUCKET="您的BUCKET"
REACT_APP_FIREBASE_MESSAGING_SENDER_ID="您的SENDER_ID"
REACT_APP_FIREBASE_APP_ID="您的APP_ID"

# 若使用 Vite:
VITE_FIREBASE_API_KEY="您的API_KEY"
... (其餘以此類推替換前綴)


2. 設定 Firestore 資料庫安全規則 (保護隱私)

這是最重要的一步！ 前端的密碼只是防止一般人誤觸後台介面。為了防止有心人士透過 API 直接抓取資料庫內的家長個資，您必須到 Firebase Console 的 Firestore Database -> Rules (規則) 中，貼上以下安全規則：

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 同意書資料庫：任何人都可以寫入(家長送出表單)，但【禁止】一般未授權者讀取、修改、刪除
    match /artifacts/{appId}/public/data/consent_forms/{document=**} {
      allow create: if true;
      allow read, update, delete: if false; // 正式環境中，老師登入應改為 if request.auth != null;
    }
    
    // 系統設定資料庫：任何人都可以讀取(為了渲染表單外觀與選項)，但禁止寫入
    match /artifacts/{appId}/public/data/settings/{document=**} {
      allow read: if true; 
      allow write: if false; 
    }
  }
}


🔑 管理員預設資訊

如果您在本地端或伺服器上直接運行此程式碼，請參考以下資訊進入後台：

後台入口：點擊畫面右下角的「鎖頭 🔒」圖示。

預設密碼：admin

⚠️ 注意：為保護個資安全，系統偵測到預設密碼時會強制跳出紅底警告。請於第一次登入後立即前往「更改密碼」！

🤖 給非工程師的客製化指南

本專案將所有核心功能集中於單一檔案 App.jsx 中。您完全不需要懂程式碼，只需要會使用 AI（如 Google Gemini 或 ChatGPT）即可快速客製化：

下載本專案中的 App.jsx 檔案。

將 App.jsx 拖曳給 AI，並使用自然語言下達指令。

「請幫我修改這個 App.jsx，在動態收集欄位中再加入一個『特殊疾病史』的選項。」

「請幫我把多國語系中，所有的日文翻譯換成韓文翻譯。」


🚀 如何在您的學校部署這套系統？

這套系統採用 React 開發，並使用 Google Firebase 作為免費的後台資料庫。您不需要租用伺服器，只需按照以下步驟設定即可。

步驟一：建立 Firebase 專案 (免費資料庫)

前往 Firebase Console，點擊「新增專案」。

進入專案後，在左側選單找到 「Build」 -> 「Firestore Database」，點擊「建立資料庫」（選擇「測試模式 Test Mode」方便初期設定，之後可再改為安全規則）。

在左側選單找到 「Build」 -> 「Authentication」，點擊「開始使用」，並啟用 「匿名登入 (Anonymous)」。

回到專案總覽 (Project Overview) 點擊「網頁 (</>)」圖示來新增一個網頁應用程式。

註冊應用程式後，Firebase 會提供一段 firebaseConfig 的程式碼，請把裡面的數值複製下來。

步驟二：執行 React 程式碼

您可以使用 CodeSandbox、StackBlitz 等線上編輯器，或是使用本機的 Vite/Create React App 建立 React 環境。

將本專案中的 App.jsx 替換掉原本的檔案。

確認您的專案有安裝 lucide-react 與 firebase 套件：

npm install lucide-react firebase



【重要】 將 App.jsx 檔案上半部的 firebaseConfig 替換為您在步驟一取得的專屬設定：

const firebaseConfig = {
apiKey: "您的API\_KEY",
authDomain: "您的\_AUTH\_DOMAIN",
projectId: "您的\_PROJECT\_ID",
storageBucket: "您的\_STORAGE\_BUCKET",
messagingSenderId: "您的\_SENDER\_ID",
appId: "您的\_APP\_ID"
};


步驟三：開始使用與發布

執行系統後，預設的管理員密碼為：admin

請務必在正式讓家長填寫前，先進入右下角的「教師管理後台」，將預設密碼修改為您自己的密碼。

在後台設定好，系統首頁就會自動更新！


👤 關於作者與出處

作者：詹夫子 @MoveNorthward

開發備註：作者本身為非資訊專長教師，本系統為從教學現場實際出發，運用現有工具輔助開發而成。若您有任何程式碼優化建議、功能許願，或發現需要改進的地方，非常歡迎各界先進與老師們來信交流與指教！

聯繫方式：pe-fen@ckjh.kl.edu.tw

📄 版權聲明

@2026 Master. 本專案開源並歡迎自由修改與分享，致力於讓教育與行政數位化更加輕鬆！
