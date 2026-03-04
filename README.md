# Sum 財務助手 PWA

📱 一個簡單嘅漸進式網絡應用程式 (PWA)，用嚟掃描收據同管理開支。

## 功能

- 📷 **相機掃描** — 直接用手機相機影收據
- 🔍 **OCR 辨識** — 自動提取商舖名稱、金額、日期
- 💾 **儲存到 Supabase** — 雲端資料庫，多裝置同步
- 📊 **按月檢視** — 睇返每月開支總結
- 🏷️ **項目分類** — 標記唔同 project/job
- 📱 **離線可用** — 無網絡都可以用

## 安裝步驟

### 1. 開新 Supabase Project

1. 去 [supabase.com](https://supabase.com) 開新帳號/登入
2. 撳 "New Project"
3. 填寫項目名稱（例如 `sum-finance`）
4. 等 2-3 分鐘建立完成

### 2. 建立資料表

去 Database → Table Editor，開新表叫 `expenses`：

```sql
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  merchant text,
  amount numeric,
  date date,
  type text default 'other',
  job text default 'General',
  receipt_url text,
  created_at timestamp default now()
);
```

### 3. 開 Storage 儲存相

1. 去 Storage → New Bucket，名稱填 `receipts`
2. 將 "Public bucket" 打開 ✅
3. 去 Policies → 開新 Policy：
   - Name: "Allow public read"
   - Operation: SELECT
   - Policy: `true`

### 4. 攞 API Key

去 Project Settings → API：
- 複製 `anon public` key（eyJ... 開頭嗰個）
- 複製 Project URL

### 5. 設定 PWA

開 `app.js`，改呢兩行：

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_KEY = 'YOUR_ANON_KEY';
```

### 6. 部署去 Vercel

```bash
git init
git add .
git commit -m "Initial PWA"
git push origin main
```

去 Vercel Dashboard → Import Project → 揀 GitHub repo → Deploy。

### 7. 安裝到手機

1. 喺手機瀏覽器開個網址
2. iPhone：撳分享掣 → "Add to Home Screen"
3. Android：撳選單 → "Add to Home Screen"

## 使用說明

- 撳 "📷 掃描單據" 影相
- 檢查自動提取嘅資料
- 撳 "儲存"

## License

MIT License
