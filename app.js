// Sum Finance PWA - App Logic
const SUPABASE_URL = 'https://pdtzlljvtbcdqdpbqnqsy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jr4vWRsnh1qLNKlPr5ur8w_H-YGwl_B';

// Initialize Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Global state
let currentStream = null;
let capturedImage = null;
let allExpenses = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadExpenses();
    document.getElementById('date-input').value = new Date().toISOString().split('T')[0];
});

// Load expenses from Supabase
async function loadExpenses() {
    showLoading(true);
    try {
        const { data, error } = await supabaseClient
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        allExpenses = data || [];
        updateUI();
    } catch (err) {
        console.error('Load failed:', err);
        alert('載入失敗');
    } finally {
        showLoading(false);
    }
}

// Update UI
function updateUI() {
    const total = allExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    document.getElementById('month-total').textContent = '$' + total.toFixed(0);
    document.getElementById('receipt-count').textContent = allExpenses.length;
    
    const list = document.getElementById('expenses-list');
    if (allExpenses.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:60px;color:#999;">暫時冇單據</div>';
        return;
    }
    
    list.innerHTML = allExpenses.map(e => `
        <div style="background:white;padding:16px;margin-bottom:12px;border-radius:12px;display:flex;gap:12px;">
            <div style="width:60px;height:80px;background:#f0f0f0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;">
                ${e.receipt_url ? '<img src="' + e.receipt_url + '" style="width:100%;height:100%;object-fit:cover;">' : '📷'}
            </div>
            <div style="flex:1;">
                <div style="font-size:13px;color:#666;">${e.type || 'other'}</div>
                <div style="font-size:15px;font-weight:bold;">${e.merchant || '冇名稱'}</div>
                <div style="font-size:12px;color:#999;">${e.date}</div>
            </div>
            <div style="font-size:18px;font-weight:bold;color:#e74c3c;align-self:center;">
                $${parseFloat(e.amount || 0).toFixed(0)}
            </div>
        </div>
    `).join('');
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
        modal.style.display = 'flex';
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
    modal.style.display = 'none';
}

// Capture photo
function capturePhoto() {
    const video = document.getElementById('camera-preview');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(blob => {
        capturedImage = blob;
        closeCamera();
        showOCRPreview(canvas);
    }, 'image/jpeg', 0.9);
}

// Show OCR preview
async function showOCRPreview(canvas) {
    document.getElementById('ocr-image').src = canvas.toDataURL('image/jpeg');
    document.getElementById('ocr-preview').style.display = 'flex';
    
    // Run OCR
    showLoading(true);
    try {
        const result = await Tesseract.recognize(canvas, 'chi_tra+eng');
        const text = result.data.text;
        console.log('OCR:', text);
        
        // Extract data
        const extracted = extractReceiptData(text);
        document.getElementById('merchant-input').value = extracted.merchant || '';
        document.getElementById('amount-input').value = extracted.amount || '';
        document.getElementById('date-input').value = extracted.date || new Date().toISOString().split('T')[0];
        
    } catch (err) {
        console.error('OCR failed:', err);
    } finally {
        showLoading(false);
    }
}

// Extract data from OCR text
function extractReceiptData(text) {
    const result = { merchant: '', amount: '', date: '' };
    
    // Extract amount
    const amountMatch = text.match(/(?:HK?\$|Total|總計|金額)[\s:]*([\d,]+\.?\d*)/i);
    if (amountMatch) {
        result.amount = amountMatch[1].replace(/,/g, '');
    }
    
    // Extract date
    const dateMatch = text.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (dateMatch) {
        result.date = dateMatch[1] + '-' + dateMatch[2].padStart(2, '0') + '-' + dateMatch[3].padStart(2, '0');
    }
    
    // Extract merchant (first line)
    const lines = text.split('\n').filter(l => l.trim());
    for (const line of lines.slice(0, 5)) {
        if (line.length > 2 && !line.match(/^\d/) && !line.match(/receipt|invoice/i)) {
            result.merchant = line.trim();
            break;
        }
    }
    
    return result;
}

// Cancel OCR
function cancelOCR() {
    document.getElementById('ocr-preview').style.display = 'none';
    capturedImage = null;
}

// Save receipt
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
        
        // Upload image
        if (capturedImage) {
            const fileName = 'receipt_' + Date.now() + '.jpg';
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('receipts')
                .upload(fileName, capturedImage, { contentType: 'image/jpeg' });
            
            if (!uploadError) {
                const { data: { publicUrl } } = supabaseClient.storage
                    .from('receipts')
                    .getPublicUrl(fileName);
                receiptUrl = publicUrl;
            }
        }
        
        // Save to database
        const { error } = await supabaseClient.from('expenses').insert({
            merchant, amount, date, type, job, receipt_url: receiptUrl,
            created_at: new Date().toISOString()
        });
        
        if (error) throw error;
        
        document.getElementById('ocr-preview').style.display = 'none';
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

// Show/hide loading
function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW failed:', err));
}