/* =========================================
   ADMIN DASHBOARD - UNDANGAN DIGITAL
   Ghibli Game Edition
   ========================================= */

const SUPABASE_URL = 'https://eaklrdnwodbyzagfitqb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVha2xyZG53b2RieXphZ2ZpdHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTc3NDUsImV4cCI6MjA5MTUzMzc0NX0.Utl5GGT4A9DdTc30WzaJZnrggBCuHTthmCdeXpOcD6Q';

let _supaAdmin = null;
let CLIENT_ID = 'ghibli-demo';

// Local Memory State
let localStore = {
    settings: null,
    guests: null,
    wishes: null,
    gallery: null,
    story: null
};

document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initSidebar();

    const urlParams = new URLSearchParams(window.location.search);
    CLIENT_ID = urlParams.get('id') || 'ghibli-demo';

    const idDisplay = document.getElementById('loginClientIdDisplay');
    if (idDisplay) idDisplay.textContent = CLIENT_ID;

    try {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            _supaAdmin = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            await initAuthSystem();
        } else {
            console.warn('[ADMIN] Supabase SDK tidak tersedia.');
            hideLoginOverlay(); 
        }
    } catch (e) {
        console.error('[ADMIN] Gagal inisialisasi Supabase:', e.message);
    }
});

async function startDashboard() {
    const headerTitle = document.getElementById('pageTitle');
    if (headerTitle) headerTitle.textContent = `Dashboard — ${CLIENT_ID}`;

    const previewUrl = `index.html?id=${CLIENT_ID}`;
    const sidebarLink = document.getElementById('sidebarPreviewLink');
    const headerLink = document.getElementById('headerPreviewLink');
    if (sidebarLink) sidebarLink.href = previewUrl;
    if (headerLink) headerLink.href = previewUrl;

    loadDashboard();
    initWeddingInfoForm();
    initGuestManagement();
    initWishesManagement();
    initGalleryManagement();
    initStoryManagement();
}

async function fetchCloudData() {
    if (!_supaAdmin) {
        console.error('[ADMIN] Supabase client not initialized');
        return null;
    }
    try {
        const { data: invData, error: invErr } = await _supaAdmin
            .from('wedding_invitations')
            .select('*')
            .eq('client_id', CLIENT_ID)
            .maybeSingle();

        if (invErr) throw invErr;

        if (!invData) {
            console.warn(`[ADMIN] Client "${CLIENT_ID}" not found. Creating...`);
            const { data: newData, error: insErr } = await _supaAdmin
                .from('wedding_invitations')
                .insert({
                    client_id: CLIENT_ID,
                    domain_origin: window.location.origin,
                    settings: getDefaultSettings(),
                    gallery: getDefaultGallery(),
                    story: getDefaultStory(),
                    admin_password: 'admin' // Default password for new setups
                })
                .select()
                .single();
            
            if (insErr) throw insErr;
            localStore.settings = newData.settings;
            localStore.gallery = newData.gallery;
            localStore.story = newData.story;
            return newData;
        }

        const [guestsRes, wishesRes] = await Promise.all([
            _supaAdmin.from('guests').select('*').eq('client_id', CLIENT_ID).order('id', { ascending: false }),
            _supaAdmin.from('wishes').select('*').eq('client_id', CLIENT_ID).order('created_at', { ascending: false })
        ]);

        localStore.settings = invData.settings;
        localStore.gallery = invData.gallery;
        localStore.story = invData.story;
        localStore.guests = guestsRes.data || [];
        localStore.wishes = (wishesRes.data || []).map(w => ({
            id: w.id, name: w.name, attendance: w.attendance,
            guests: w.guest_count, message: w.message, timestamp: w.created_at
        }));
        
        return invData;
    } catch (err) {
        console.error('[ADMIN] Sync Error:', err.message);
        showToast('❌ Gagal Sinkronisasi: ' + err.message);
    }
    return null;
}

// Default Settings for Ghibli theme
function getDefaultSettings() {
    return {
        groomName: 'Rizky',
        groomOrder: 'Putra kedua dari',
        groomFather: 'Bapak Hartono',
        groomMother: 'Ibu Sumiati',
        groomIg: '@rizky_ghibli',
        groomPhoto: 'assets/img/groom.png',
        brideName: 'Anastasia',
        brideOrder: 'Putri sulung dari',
        brideFather: 'Bapak Sudirman',
        brideMother: 'Ibu Lestari',
        brideIg: '@anastasia_ghibli',
        bridePhoto: 'assets/img/bride.png',
        akadDate: '2026-10-15T09:00',
        akadTime: '09:00 — 10:30 WIB',
        akadVenue: 'Gedung Serbaguna Ghibli',
        akadAddress: 'Jl. Anggrek No. 15, Bogor',
        akadMap: 'https://maps.google.com',
        resepsiDate: '2026-10-15T11:00',
        resepsiTime: '11:00 — 16:00 WIB',
        resepsiVenue: 'Ghibli Grand Ballroom',
        resepsiAddress: 'Jl. Anggrek No. 15, Bogor',
        resepsiMap: 'https://maps.google.com',
        bank1Name: 'Bank BCA',
        bank1Number: '1234567890',
        bank1Holder: 'Anastasia Putri',
        bank2Name: 'Bank Mandiri',
        bank2Number: '0987654321',
        bank2Holder: 'Rizky Pratama',
        quoteText: 'Two souls, one destiny. Our journey begins under the Ghibli sky.',
        quoteSource: '— Ghibli Memoir',
        hashtag: '#AnastasiaRizky2026',
        musicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
    };
}

function getDefaultGallery() {
    return [
        { id: 1, url: 'assets/img/gallery-1.png', alt: 'Memoir 1' },
        { id: 2, url: 'assets/img/gallery-2.png', alt: 'Memoir 2' }
    ];
}

function getDefaultStory() {
    return [
        { id: 1, year: '2019', title: 'The Ancient Library', description: 'Two fates crossed in the Ancient Library.', url: '' },
        { id: 2, year: '2020', title: 'Green Valleys', description: 'The journey through the Green Valleys began.', url: '' }
    ];
}

/* --- Navigation & Sidebar --- */
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`panel-${section}`).classList.add('active');
            if (section === 'dashboard') loadDashboard();
            if (section === 'rsvp') loadRSVPTable();
            if (section === 'guests') loadGuestTable();
            if (section === 'gallery') loadGalleryAdmin();
            if (section === 'story') loadStoryAdmin();
            if (section === 'wishes') loadWishesAdmin();
        });
    });
}

function initSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('sidebarOverlay');
    if (toggle) toggle.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('open');
        overlay.classList.toggle('show');
    });
    if (overlay) overlay.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        overlay.classList.remove('show');
    });
}

/* --- Auth System --- */
let cloudDataCache = null;
async function initAuthSystem() {
    const btnLogin = document.getElementById('btnLoginAdmin');
    cloudDataCache = await fetchCloudData();
    const sessionKey = `admin_auth_${CLIENT_ID}`;
    const savedPass = sessionStorage.getItem(sessionKey);

    if (cloudDataCache?.admin_password && savedPass === cloudDataCache.admin_password) {
        hideLoginOverlay();
        startDashboard();
    } else {
        btnLogin.addEventListener('click', handleLogin);
    }
}

async function handleLogin() {
    const passInput = document.getElementById('adminPasswordInput');
    const pass = passInput.value.trim();
    if (!pass) return;

    if (!cloudDataCache || !cloudDataCache.admin_password) {
        await _supaAdmin.from('wedding_invitations').update({ admin_password: pass }).eq('client_id', CLIENT_ID);
        sessionStorage.setItem(`admin_auth_${CLIENT_ID}`, pass);
        hideLoginOverlay();
        startDashboard();
    } else if (pass === cloudDataCache.admin_password) {
        sessionStorage.setItem(`admin_auth_${CLIENT_ID}`, pass);
        hideLoginOverlay();
        startDashboard();
    } else {
        alert('Password Salah!');
    }
}

function hideLoginOverlay() {
    const o = document.getElementById('loginOverlay');
    if (o) o.classList.add('hidden');
}

/* --- Utility --- */
function getData(key) {
    const map = { 'wedding_settings': 'settings', 'wedding_guests': 'guests', 'wedding_wishes': 'wishes', 'wedding_gallery': 'gallery', 'wedding_story': 'story' };
    return localStore[map[key]] || null;
}

function setData(key, data) {
    const map = { 'wedding_settings': 'settings', 'wedding_guests': 'guests', 'wedding_wishes': 'wishes', 'wedding_gallery': 'gallery', 'wedding_story': 'story' };
    const colName = map[key];
    localStore[colName] = data;
    if (_supaAdmin && colName !== 'guests' && colName !== 'wishes') {
        _supaAdmin.from('wedding_invitations').update({ [colName]: data }).eq('client_id', CLIENT_ID).then();
    }
}

function showToast(msg) {
    const t = document.getElementById('adminToast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function esc(t) {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

function formatDate(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('id-ID');
}

function loadDashboard() {
    const wishes = getData('wedding_wishes') || [];
    const guests = getData('wedding_guests') || [];
    document.getElementById('statTotalGuests').textContent = guests.length;
    document.getElementById('statConfirmed').textContent = wishes.filter(w => w.attendance === 'hadir').length;
    document.getElementById('statDeclined').textContent = wishes.filter(w => w.attendance === 'tidak').length;
    document.getElementById('statWishes').textContent = wishes.length;

    // Recent Wishes Table (max 5)
    const tbody = document.getElementById('recentWishesBody');
    if (tbody) {
        const recent = wishes.slice(0, 5);
        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888; padding:20px;">Belum ada ucapan masuk.</td></tr>';
        } else {
            tbody.innerHTML = recent.map(w => `<tr>
                <td>${esc(w.name)}</td>
                <td><span style="padding:3px 8px; border-radius:12px; font-size:11px; background:${w.attendance === 'hadir' ? 'var(--success-bg)' : 'var(--danger-bg)'}; color:${w.attendance === 'hadir' ? 'var(--success)' : 'var(--danger)'}">${w.attendance === 'hadir' ? '✅ Hadir' : '❌ Tidak'}</span></td>
                <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(w.message || '-')}</td>
                <td style="font-size:12px; color:#888;">${formatDate(w.timestamp)}</td>
            </tr>`).join('');
        }
    }
}

/* --- Guest & RSVP Tables (Simplified) --- */
function loadGuestTable() {
    const guests = getData('wedding_guests') || [];
    const tbody = document.getElementById('guestTableBody');
    document.getElementById('guestCount').textContent = guests.length;
    tbody.innerHTML = guests.map((g, i) => {
        const inviteLink = `${window.location.origin}/index.html?to=${encodeURIComponent(g.name)}`;
        const waLink = g.phone ? `https://wa.me/${g.phone.replace(/^0/, '62')}?text=${encodeURIComponent(`Halo ${g.name}, kami mengundang Anda ke acara pernikahan kami. Buka undangan: ${inviteLink}`)}` : '#';
        
        return `<tr>
            <td>${i+1}</td>
            <td>${esc(g.name)}</td>
            <td>${esc(g.phone || '-')}</td>
            <td style="display:flex; gap:8px;">
                <button onclick="copyToClipboard('${inviteLink}')" class="btn btn-outline btn-sm" style="padding:4px 8px; font-size:12px;">🔗 Salin Link</button>
                ${g.phone ? `<a href="${waLink}" target="_blank" class="btn btn-primary btn-sm" style="padding:4px 8px; font-size:12px; text-decoration:none;">💬 WA</a>` : ''}
            </td>
            <td><button onclick="deleteGuest(${g.id})" style="background:transparent; border:none; cursor:pointer; color:red;">🗑️</button></td>
        </tr>`;
    }).join('');
}

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Link disalin!');
    });
};

async function addGuest() {
    const name = document.getElementById('addGuestName').value.trim();
    const phone = document.getElementById('addGuestPhone').value.trim();
    if (!name || !_supaAdmin) return;
    
    // Simulate optimistic UI if we want, but let's just insert to supa.
    const { data } = await _supaAdmin.from('guests').insert({ client_id: CLIENT_ID, name, phone }).select().single();
    if (data) { 
        localStore.guests.unshift(data); 
        loadGuestTable();
        document.getElementById('addGuestName').value = '';
        document.getElementById('addGuestPhone').value = '';
        showToast('✅ Tamu ditambahkan!');
    }
}

window.deleteGuest = async function(id) {
    if (!confirm('Hapus tamu ini?')) return;
    if (_supaAdmin) {
        await _supaAdmin.from('guests').delete().eq('id', id);
    }
    localStore.guests = localStore.guests.filter(g => g.id !== id);
    loadGuestTable();
    showToast('✅ Tamu dihapus!');
};

function initGuestManagement() {
    const btn = document.getElementById('btnAddGuest');
    if (btn) btn.addEventListener('click', addGuest);

    // Export CSV for Guests
    const btnExport = document.getElementById('btnExportGuests');
    if (btnExport) btnExport.addEventListener('click', exportGuestsCSV);

    loadGuestTable();
}

function exportGuestsCSV() {
    const guests = getData('wedding_guests') || [];
    if (guests.length === 0) return showToast('⚠️ Tidak ada data tamu.');
    const header = 'No,Nama,WhatsApp';
    const rows = guests.map((g, i) => `${i+1},"${g.name}","${g.phone || '-'}"`);
    downloadCSV([header, ...rows].join('\n'), `daftar-tamu-${CLIENT_ID}.csv`);
    showToast('✅ Export CSV berhasil!');
}

function exportRsvpCSV() {
    const wishes = getData('wedding_wishes') || [];
    if (wishes.length === 0) return showToast('⚠️ Tidak ada data RSVP.');
    const header = 'No,Nama,Kehadiran,Jumlah Tamu,Ucapan,Waktu';
    const rows = wishes.map((w, i) => `${i+1},"${w.name}","${w.attendance}","${w.guests || 1}","${(w.message || '').replace(/"/g, '""')}","${formatDate(w.timestamp)}"`);
    downloadCSV([header, ...rows].join('\n'), `rsvp-${CLIENT_ID}.csv`);
    showToast('✅ Export RSVP berhasil!');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
}

/* --- RSVP Table --- */
function loadRSVPTable() {
    const wishes = getData('wedding_wishes') || [];
    const tbody = document.getElementById('rsvpTableBody');
    if (!tbody) return;
    if (wishes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#888; padding:20px;">Belum ada data RSVP.</td></tr>';
        return;
    }
    tbody.innerHTML = wishes.map((w, i) => `<tr>
        <td>${i+1}</td>
        <td>${esc(w.name)}</td>
        <td><span style="padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600; background:${w.attendance === 'hadir' ? 'var(--success-bg)' : 'var(--danger-bg)'}; color:${w.attendance === 'hadir' ? 'var(--success)' : 'var(--danger)'}">${w.attendance === 'hadir' ? '✅ Hadir' : '❌ Tidak Hadir'}</span></td>
        <td>${w.guests || 1}</td>
        <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(w.message || '-')}</td>
        <td style="font-size:12px; color:#888;">${formatDate(w.timestamp)}</td>
    </tr>`).join('');
}

function initWishesManagement() {
    // Export RSVP CSV
    const btnExportRsvp = document.getElementById('btnExportRsvp');
    if (btnExportRsvp) btnExportRsvp.addEventListener('click', exportRsvpCSV);

    // Clear All Wishes
    const btnClear = document.getElementById('btnClearAllWishes');
    if (btnClear) btnClear.addEventListener('click', clearAllWishes);

    loadWishesAdmin();
}

async function clearAllWishes() {
    if (!confirm('⚠️ Yakin hapus SEMUA ucapan? Aksi ini tidak bisa dibatalkan.')) return;
    if (_supaAdmin) {
        const { error } = await _supaAdmin.from('wishes').delete().eq('client_id', CLIENT_ID);
        if (error) { showToast('❌ Gagal: ' + error.message); return; }
    }
    localStore.wishes = [];
    loadWishesAdmin();
    loadDashboard();
    showToast('✅ Semua ucapan telah dihapus.');
}

function loadWishesAdmin() {
    const wishes = getData('wedding_wishes') || [];
    const container = document.getElementById('wishesAdminList');
    const badge = document.getElementById('wishCount');
    if (badge) badge.textContent = wishes.length;
    if (container) {
        if (wishes.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding: 20px; color: #888;">Belum ada ucapan yang masuk.</p>';
        } else {
            container.innerHTML = wishes.map(w => `
                <div class="wish-admin-card">
                    <div class="wish-admin-info">
                        <strong>${esc(w.name)}</strong>
                        <span class="wish-badge ${w.attendance === 'hadir' ? 'badge-success' : 'badge-danger'}">${w.attendance === 'hadir' ? 'Hadir' : 'Tidak Hadir'}</span>
                    </div>
                    <p style="margin:6px 0; font-size:14px; color:#555;">${esc(w.message || '-')}</p>
                    <small style="color:#aaa;">${formatDate(w.timestamp)}</small>
                </div>
            `).join('');
        }
    }
}

function initWeddingInfoForm() {
    const s = getData('wedding_settings') || getDefaultSettings();
    const fields = [
        'groomName', 'groomOrder', 'groomFather', 'groomMother', 'groomIg', 'groomPhoto',
        'brideName', 'brideOrder', 'brideFather', 'brideMother', 'brideIg', 'bridePhoto',
        'akadDate', 'akadTime', 'akadVenue', 'akadAddress', 'akadMap',
        'resepsiDate', 'resepsiTime', 'resepsiVenue', 'resepsiAddress', 'resepsiMap',
        'bank1Name', 'bank1Number', 'bank1Holder',
        'bank2Name', 'bank2Number', 'bank2Holder',
        'musicUrl', 'quoteText', 'quoteSource', 'hashtag'
    ];

    // Populate inputs from settings
    fields.forEach(f => {
        const id = 'wi' + f.charAt(0).toUpperCase() + f.slice(1);
        const el = document.getElementById(id);
        if (el) el.value = s[f] !== undefined ? s[f] : '';
    });

    // Save inputs to settings
    document.getElementById('btnSaveWedding').addEventListener('click', () => {
        const up = { ...s };
        fields.forEach(f => {
            const id = 'wi' + f.charAt(0).toUpperCase() + f.slice(1);
            const el = document.getElementById(id);
            if (el) up[f] = el.value;
        });
        setData('wedding_settings', up);
        showToast('✅ Saved!');
    });
}

function initGalleryManagement() {
    loadGalleryAdmin();
    const btnAdd = document.getElementById('btnAddPhoto');
    const modal = document.getElementById('photoModal');
    if (btnAdd) btnAdd.addEventListener('click', () => modal.classList.add('show'));
    document.getElementById('btnCancelPhoto').addEventListener('click', () => modal.classList.remove('show'));
    
    document.getElementById('btnConfirmPhoto').addEventListener('click', () => {
        const url = document.getElementById('modalPhotoUrl').value;
        const alt = document.getElementById('modalPhotoAlt').value;
        if (!url) return;
        const g = getData('wedding_gallery') || [];
        g.push({ id: Date.now(), url, alt });
        setData('wedding_gallery', g);
        modal.classList.remove('show');
        document.getElementById('modalPhotoUrl').value = '';
        document.getElementById('modalPhotoAlt').value = '';
        loadGalleryAdmin();
        showToast('✅ Foto Ditambahkan!');
    });
}

window.deletePhoto = function(id) {
    let g = getData('wedding_gallery') || [];
    g = g.filter(p => p.id !== id);
    setData('wedding_gallery', g);
    loadGalleryAdmin();
};

function loadGalleryAdmin() {
    const g = getData('wedding_gallery') || getDefaultGallery();
    const grid = document.getElementById('galleryAdminGrid');
    if (grid) {
        galleryItems = g.map(p => `
            <div class="gallery-admin-item" style="position:relative;">
                <img src="${p.url}" style="width:100%; height:100%; object-fit:cover;">
                <button onclick="deletePhoto(${p.id})" style="position:absolute; top:5px; right:5px; background:white; border:none; border-radius:50%; width:24px; height:24px; cursor:pointer; color:red; box-shadow:0 2px 4px rgba(0,0,0,0.2);">🗑️</button>
            </div>
        `).join('');
        grid.innerHTML = galleryItems + `
            <div class="gallery-admin-add" id="btnAddPhoto" onclick="document.getElementById('photoModal').classList.add('show')">
                <span class="add-icon">➕</span>
                <span>Tambah Foto</span>
            </div>
        `;
    }
}

function initStoryManagement() {
    loadStoryAdmin();
    const btnAdd = document.getElementById('btnAddStory');
    const modal = document.getElementById('storyModal');
    if (btnAdd) btnAdd.addEventListener('click', () => modal.classList.add('show'));
    document.getElementById('btnCancelStory').addEventListener('click', () => modal.classList.remove('show'));
    
    document.getElementById('btnConfirmStory').addEventListener('click', () => {
        const year = document.getElementById('modalStoryYear').value;
        const title = document.getElementById('modalStoryTitle').value;
        const url = document.getElementById('modalStoryUrl').value;
        const description = document.getElementById('modalStoryDesc').value;
        if (!year || !title) return;
        
        const s = getData('wedding_story') || [];
        s.push({ id: Date.now(), year, title, url, description });
        setData('wedding_story', s);
        modal.classList.remove('show');
        
        document.getElementById('modalStoryYear').value = '';
        document.getElementById('modalStoryTitle').value = '';
        document.getElementById('modalStoryUrl').value = '';
        document.getElementById('modalStoryDesc').value = '';
        loadStoryAdmin();
        showToast('✅ Cerita Ditambahkan!');
    });
}

window.deleteStory = function(id) {
    let s = getData('wedding_story') || [];
    s = s.filter(i => i.id !== id);
    setData('wedding_story', s);
    loadStoryAdmin();
};

function loadStoryAdmin() {
    const s = getData('wedding_story') || getDefaultStory();
    const list = document.getElementById('storyAdminList');
    if (list) {
        list.innerHTML = s.map(i => `
            <div class="wish-admin-card" style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${esc(i.year)}</strong>: ${esc(i.title)}<br>
                    <span style="font-size:12px; color:#666;">${esc(i.description || '')}</span>
                </div>
                <button onclick="deleteStory(${i.id})" style="background:transparent; border:none; cursor:pointer; color:red; font-size:16px;">🗑️</button>
            </div>
        `).join('');
    }
}
