// Sum Finance PWA - App Logic
// Config - UPDATE THESE with your Supabase credentials
const SUPABASE_URL = 'https://pdtzlljvtbcdqdpbqnqsy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jr4vWRsnh1qLNKlPr5ur8w_H-YGwl_B';

// Initialize Supabase
let supabase;
try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} catch (e) {
    console.error('Supabase init failed:', e);
}

// Global state
let currentStream = null;
let capturedImage = null;
let allExpenses = [];
let currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadExpenses();
    setupMonthSelector();
    
    // Set default date to today
    document.getElementById('date-input').value = new Date().toISOString().split('T')[0];
});

// Load expenses from Supabase
async function loadExpenses() {
    showLoading(true);
    
    try {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        allExpenses = data || [];
        updateUI();
    } catch (err) {
        console.error('Load failed:', err);
        alert('載入失敗，請檢查網絡');
    } finally {
        showLoading(false);
    }
}

// Update UI with expenses
function updateUI() {
    const monthSelect = document.getElementById('month-select');
    const selectedMonth = monthSelect.value === 'current' 
        ? new Date().toISOString().slice(0, 7) 
        : monthSelect.value;
    
    // Filter by month
    const filtered = allExpenses.filter(e => e.date && e.date.startsWith(selectedMonth));
    
    // Update stats
    const total = filtered.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    document.getElementById('month-total').textContent = `$${total.toFixed(0)}`;
    document.getElementById('receipt-count').textContent = filtered.length;
    document.getElementById('receipt-count-label').textContent = `${filtered.length} 張單據`;
    
    // Render list
    const list = document.getElementById('expenses-list');
    
    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="icon">🧾</div>
                <p>暫時冇單據</p>
                <p style="font-size: 12px; margin-top: 8px;">撳下面按鈕掃描</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = filtered.map(e => `
        <div class="expense-item">
            <div class="expense-thumb">
                ${e.receipt_url 
                    ? `<img src="${e.receipt_url}" alt="收據" onerror="this.parentElement.innerHTML='📷'">` 
                    : '📷'}
            </div>
            <div class="expense-info">
                <span class="expense-type type-${e.type || 'other'}">${getTypeLabel(e.type)}</span>
                ${e.job && e.job !== 'General' ? `<span style="font-size: 11px; color: #666;">🏷️ ${e.job}</span>` : ''}
                <div class="expense-merchant">${e.merchant || '冇名稱'}</div>
                <div class="expense-date">${formatDate(e.date)}</div>
            </div>
            <div class="expense-amount">$${parseFloat(e.amount || 0).toFixed(0)}</div>
        </div>
    `).join('');
}

// Setup month selector dropdown
function setupMonthSelector() {
    const select = document.getElementById('month-select');
    const months = [...new Set(allExpenses.map(e => e.date?.slice(0, 7)).filter(Boolean))].sort().reverse();
    
    // Keep "本月" option, add others
    months.forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = formatMonthLabel(m);
        select.appendChild(option);
    });
    
    select.addEventListener('change', updateUI);
}

// Get type label
function getTypeLabel(type) {
    const labels = {
        dining: '飲食',
        parking: '停車場',
        equipment: '器材',
        supplies: '用品',
        travel: '交通',
        other: '其他'
    };
    return labels[type] || '其他';
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// Format month label
function formatMonthLabel(monthStr) {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    return `${year}年${parseInt(month)}月`;
}

// Show/hide loading
function showLoading(show) {
    document.getElementById('loading').classList.toggle('active', show);
}

// Open camera
async function openCamera() {
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-preview');
    
    try {
        currentStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });
        video.srcObject = currentStream;
        modal.classList.add('active');
    } catch (err) {
        console.error('Camera failed:', err);
        alert('開唔到相機，請檢查權限');
    }
}

// Close camera
function closeCamera() {
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-preview');
    
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    video.srcObject = null;
    modal.classList.remove('active');
}

// Capture photo
function capturePhoto() {
    const video = document.getElementById('camera-preview');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Convert to blob
    canvas.toBlob(blob => {
        capturedImage = blob;
        closeCamera();
        processOCR(canvas);
    }, 'image/jpeg', 0.9);
}

// Process OCR
async function processOCR(canvas) {
    showLoading(true);
    
    try {
        const result = await Tesseract.recognize(
            canvas,
            'chi_tra+eng',
            { logger: m => console.log(m) }
        );
        
        const text = result.data.text;
        console.log('OCR Text:', text);
        
        // Extract data
        const extracted = extractReceiptData(text);
        
        // Show preview
        document.getElementById('ocr-image').src = canvas.toDataURL('image/jpeg');
        document.getElementById('merchant-input').value = extracted.merchant || '';
        document.getElementById('amount-input').value = extracted.amount || '';
        document.getElementById('date-input').value = extracted.date || new Date().toISOString().split('T')[0];
        
        document.getElementById('ocr-preview').classList.add('active');
        
    } catch (err) {
        console.error('OCR failed:', err);
        alert('OCR 失敗，請手動輸入');
        document.getElementById('ocr-image').src = canvas.toDataURL('image/jpeg');
        document.getElementById('ocr-preview').classList.add('active');
    } finally {
        showLoading(false);
    }
}

// Extract receipt data from OCR text
function extractReceiptData(text) {
    const result = {
        merchant: '',
        amount: '',
        date: ''
    };
    
    // Extract amount - look for $ or HK$ followed by numbers
    const amountMatch = text.match(/(?:HK?\$|Total|總計|金額|Amount)[\s:]*([\d,]+\.?\d*)/i);
    if (amountMatch) {
        result.amount = amountMatch[1].replace(/,/g, '');
    }
    
    // Extract date - look for common date formats
    const datePatterns = [
        /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,  // 2024-01-15 or 2024/01/15
        /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,  // 15-01-2024 or 15/01/2024
        /(\d{4})年(\d{1,2})月(\d{1,2})日/,       // 2024年1月15日
    ];
    
    for (const pattern of datePatterns) {
        const dateMatch = text.match(pattern);
        if (dateMatch) {
            // Determine format and normalize
            let year, month, day;
            if (dateMatch[1].length === 4) {
                [year, month, day] = [dateMatch[1], dateMatch[2], dateMatch[3]];
            } else {
                [day, month, year] = [dateMatch[1], dateMatch[2], dateMatch[3]];
            }
            result.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            break;
        }
    }
    
    // Extract merchant - first line that's not a date/amount
    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines.slice(0, 5)) {
        if (line.length > 2 && 
            !line.match(/^\d/) && 
            !line.match(/receipt|invoice|單據|發票/i)) {
            result.merchant = line.trim();
            break;
        }
    }
    
    return result;
}

// Cancel OCR
function cancelOCR() {
    document.getElementById('ocr-preview').classList.remove('active');
    capturedImage = null;
}

// Save receipt to Supabase
async function saveReceipt() {
    const merchant = document.getElementById('merchant-input').value.trim();
    const amount = parseFloat(document.getElementById('amount-input').value);
    const date = document.getElementById('date-input').value;
    const type = document.getElementById('type-input').value;
    const job = document.getElementById('job-input').value.trim() || 'General';
    
    if (!merchant || !amount || !date) {
        alert('請填寫商舖名稱、金額同日期');
        return;
    }
    
    showLoading(true);
    
    try {
        let receiptUrl = '';
        
        // Upload image if captured
        if (capturedImage) {
            const fileName = `receipt_${Date.now()}.jpg`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(fileName, capturedImage, {
                    contentType: 'image/jpeg'
                });
            
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage
                .from('receipts')
                .getPublicUrl(fileName);
            
            receiptUrl = publicUrl;
        }
        
        // Save to database
        const { error } = await supabase
            .from('expenses')
            .insert({
                merchant,
                amount,
                date,
                type,
                job,
                receipt_url: receiptUrl,
                created_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        // Reset and refresh
        document.getElementById('ocr-preview').classList.remove('active');
        capturedImage = null;
        await loadExpenses();
        
        alert('儲存成功！');
        
    } catch (err) {
        console.error('Save failed:', err);
        alert('儲存失敗：' + err.message);
    } finally {
        showLoading(false);
    }
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('SW registered'))
        .catch(err => console.log('SW failed:', err));
}
