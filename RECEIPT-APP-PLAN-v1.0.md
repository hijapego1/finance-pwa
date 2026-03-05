# 🧾 Receipt PWA - 單據掃描助手

**Version:** 1.0  
**Created:** 2026-03-05  
**Status:** ⏸️ PAUSED — Awaiting Requirements Review  
**Rename:** `finance-pwa` → `receipt-pwa` (more accurate name)

---

## 🎯 核心原則

**「先規劃，後寫 Code」** — 唔好邊做邊改，浪費時間。

---

## 📋 開發流程

```
1. 需求收集 → 寫清楚要咩功能
2. 畫 Blueprint → 結構 + 流程圖
3. Review Blueprint → 確認 OK 先開始
4. 開始寫 Code → 一步步跟 blueprint
5. 測試 → 確保功能正常
6. 部署 → Vercel / PWA 安裝
```

---

## ❓ 待確認問題

### 核心功能
1. **個 app 係做咩嘅？**
   - [ ] 掃描單據 → OCR → 記錄開支？
   - [ ] 仲有其他功能？（報表、分類、匯出？）

2. **目標用戶？**
   - [ ] 淨係 Sum 自己用？
   - [ ] 定係要支援多用戶？

3. **數據儲存？**
   - [ ] 繼續用 Supabase？
   - [ ] 定係本地儲存（localStorage/IndexedDB）就夠？

### 技術棧
4. **Pure JS PWA？定係用 Framework？**
   - [ ] React / Vue / Svelte？
   - [ ] 定係保持輕量（vanilla JS）？

5. **部署目標？**
   - [ ] Vercel？
   - [ ] 手機安裝？

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-05 | Initial plan (renamed from PLAN-LATER.md) |

---

## 📂 Project Structure

```
receipt-pwa/
├── RECEIPT-APP-PLAN-v1.0.md   ← 呢個 file
├── README.md                   ← 使用說明
├── index.html                  ← HTML + CSS
├── app.js                      ← JavaScript 邏輯
├── sw.js                       ← Service Worker
├── manifest.json               ← PWA manifest
└── .git/                       ← Git repo
```

---

## ✅ Next Steps

- [ ] Sum review 呢個 plan
- [ ] 答覆上面嘅待確認問題
- [ ] 升級去 v1.01（如果有修改）
- [ ] Ready 先開始寫 code

---

*Created: 2026-03-05*  
*Rename: finance-pwa → receipt-pwa (more focused name)*
