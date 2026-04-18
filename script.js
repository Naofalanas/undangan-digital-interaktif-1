const SUPABASE_URL = 'https://eaklrdnwodbyzagfitqb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVha2xyZG53b2RieXphZ2ZpdHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTc3NDUsImV4cCI6MjA5MTUzMzc0NX0.Utl5GGT4A9DdTc30WzaJZnrggBCuHTthmCdeXpOcD6Q';

let _supa = null;
let CLIENT_ID = 'ghibli-demo';
let cloudSettings = null;
let cloudWishes = [];

document.addEventListener('DOMContentLoaded', async () => {
    initPetals();
    initHotspotSparkles();
    
    const params = new URLSearchParams(window.location.search);
    const guestName = params.get('to');
    if (guestName) {
        const badge = document.getElementById('guest-name-badge');
        if (badge) badge.innerHTML = `Special Invitation For:<br><strong style="font-size: 18px; color: #5a3520;">${guestName}</strong>`;
        
        const rsvpName = document.getElementById('rsvp-name');
        if (rsvpName) rsvpName.value = guestName;
    }
    
    // Initialize Supabase
    if (typeof window.supabase !== 'undefined') {
        _supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        CLIENT_ID = params.get('id') || 'ghibli-demo';
        await loadCloudData();
    }
});

async function loadCloudData() {
    if (!_supa) return;
    try {
        const [invRes, wishesRes] = await Promise.all([
            _supa.from('wedding_invitations').select('*').eq('client_id', CLIENT_ID).maybeSingle(),
            _supa.from('wishes').select('*').eq('client_id', CLIENT_ID).order('created_at', { ascending: false })
        ]);
        
        if (invRes.data) {
            cloudSettings = invRes.data;
            cloudWishes = wishesRes.data || [];
            syncCloudToUI(invRes.data.settings);
            updatePopupData(invRes.data, cloudWishes);
        }
    } catch (e) {
        console.error("Cloud Error:", e);
    }
}

function syncCloudToUI(s) {
    if (!s) return;
    // Title Card
    if (s.groomName) document.getElementById('title-groom').innerText = s.groomName.split(' ')[0];
    if (s.brideName) document.getElementById('title-bride').innerText = s.brideName.split(' ')[0];
    
    if (s.hashtag) document.getElementById('title-hashtag').innerText = s.hashtag;
    if (s.quoteText) {
        document.getElementById('title-quote').innerText = s.quoteText;
        if (s.quoteSource) document.getElementById('title-quote-source').innerText = s.quoteSource;
    }
    
    if (s.musicUrl) {
        document.getElementById('bg-music').src = s.musicUrl;
    }

    // Board Text
    const chapter = document.getElementById('chapter-text');
    if (chapter) chapter.innerText = `Chapter I: ${s.groomName.split(' ')[0]} & ${s.brideName.split(' ')[0]}`;

    // Date Badge
    const dateBadge = document.getElementById('hs-date-text');
    if (dateBadge && s.akadDate) {
        const d = new Date(s.akadDate);
        dateBadge.innerText = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    // Dynamic Meta Tags — update title & OG for proper WhatsApp/social preview
    const groom = s.groomName ? s.groomName.split(' ')[0] : '';
    const bride = s.brideName ? s.brideName.split(' ')[0] : '';
    const params = new URLSearchParams(window.location.search);
    const guestName = params.get('to');

    if (groom && bride) {
        const coupleName = `${bride} & ${groom}`;
        const baseTitle = `Undangan Pernikahan — ${coupleName}`;
        const personalTitle = guestName ? `Untuk ${guestName} — Undangan ${coupleName}` : baseTitle;
        const desc = guestName 
            ? `Hai ${guestName}, Anda diundang ke acara pernikahan ${coupleName}. Buka undangan digital ini untuk detail acara.`
            : `Anda diundang ke acara pernikahan ${coupleName}. Buka undangan digital ini untuk melihat detail acara dan konfirmasi kehadiran.`;

        document.title = personalTitle;
        
        const ogTitle = document.getElementById('og-title');
        const ogDesc = document.getElementById('og-desc');
        const twTitle = document.getElementById('tw-title');
        const twDesc = document.getElementById('tw-desc');
        const metaDesc = document.querySelector('meta[name="description"]');
        
        if (ogTitle) ogTitle.setAttribute('content', personalTitle);
        if (ogDesc) ogDesc.setAttribute('content', desc);
        if (twTitle) twTitle.setAttribute('content', personalTitle);
        if (twDesc) twDesc.setAttribute('content', desc);
        if (metaDesc) metaDesc.setAttribute('content', desc);
    }
}

function updatePopupData(data, wishes) {
    const s = data.settings || {};
    const gallery = data.gallery || [];
    const story = data.story || [];
    const allWishes = wishes || [];

    popupData.about.html = `
        <div style="margin-bottom:25px; text-align:center">
            ${s.bridePhoto ? `<img src="${s.bridePhoto}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:2px solid #c9a84c; margin-bottom:10px;">` : ''}
            <p style="font-size:20px; font-weight:600; color:#5a3520">${s.brideName || 'Anastasia'}</p>
            <p style="font-size:14px">${s.brideOrder || 'Putri sulung dari'}</p>
            <p style="font-size:13px; font-style:italic">${s.brideFather || 'Bapak A'} & ${s.brideMother || 'Ibu B'}</p>
            ${s.brideIg ? `<p style="font-size:12px; margin-top:5px; color:#c9a84c;">${s.brideIg}</p>` : ''}
        </div>
        <div style="text-align:center">
            ${s.groomPhoto ? `<img src="${s.groomPhoto}" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:2px solid #c9a84c; margin-bottom:10px;">` : ''}
            <p style="font-size:20px; font-weight:600; color:#5a3520">${s.groomName || 'Rizky'}</p>
            <p style="font-size:14px">${s.groomOrder || 'Putra kedua dari'}</p>
            <p style="font-size:13px; font-style:italic">${s.groomFather || 'Bapak X'} & ${s.groomMother || 'Ibu Y'}</p>
            ${s.groomIg ? `<p style="font-size:12px; margin-top:5px; color:#c9a84c;">${s.groomIg}</p>` : ''}
        </div>`;

    // Dynamic Date popup with countdown
    const akadDateObj = s.akadDate ? new Date(s.akadDate) : null;
    const akadDateStr = akadDateObj ? akadDateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const resepsiDateObj = s.resepsiDate ? new Date(s.resepsiDate) : null;
    const resepsiDateStr = resepsiDateObj ? resepsiDateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

    popupData.date.html = `
        <div style="text-align:center">
            <div class="bank-card" style="margin-bottom:15px; padding:15px;">
                <p style="color:#c9a84c; font-weight:bold; font-size:18px;">Akad Nikah</p>
                <p style="font-size:13px; margin:5px 0; color:#7a4f2d;">${akadDateStr}</p>
                <p><strong>${s.akadTime || '09.00 - 10.30 WIB'}</strong></p>
                <p style="margin-top:8px">${s.akadVenue || 'Venue'}</p>
                <p style="font-size:13px; font-style:italic">${s.akadAddress || 'Address'}</p>
                ${s.akadMap ? `<button class="submit-btn" style="padding:5px 10px; margin-top:10px; font-size:11px;" onclick="window.open('${s.akadMap}')">📍 Map</button>` : ''}
            </div>
            
            <div class="bank-card" style="padding:15px;">
                <p style="color:#c9a84c; font-weight:bold; font-size:18px;">Resepsi</p>
                <p style="font-size:13px; margin:5px 0; color:#7a4f2d;">${resepsiDateStr}</p>
                <p><strong>${s.resepsiTime || '11.00 - 16.00 WIB'}</strong></p>
                <p style="margin-top:8px">${s.resepsiVenue || 'Venue Name'}</p>
                <p style="font-size:13px; font-style:italic">${s.resepsiAddress || 'Address'}</p>
                ${s.resepsiMap ? `<button class="submit-btn" style="padding:5px 10px; margin-top:10px; font-size:11px;" onclick="window.open('${s.resepsiMap}')">📍 Map</button>` : ''}
            </div>
        </div>`;

    // Dynamic Rundown from settings
    popupData.rundown.html = `
        <div style="font-size:15px">
            <div style="margin-bottom:15px; padding:12px; border-left:3px solid #c9a84c; background:rgba(201,168,76,0.05);">
                <strong style="color:#c9a84c;">💍 Akad Nikah</strong><br>
                <strong>${s.akadTime || '09:00 — 10:30 WIB'}</strong><br>
                <span style="font-size:13px; color:#7a4f2d;">${s.akadVenue || 'Venue'}</span>
            </div>
            <div style="margin-bottom:15px; padding:12px; border-left:3px solid #c9a84c; background:rgba(201,168,76,0.05);">
                <strong style="color:#c9a84c;">🎉 Resepsi</strong><br>
                <strong>${s.resepsiTime || '11:00 — 16:00 WIB'}</strong><br>
                <span style="font-size:13px; color:#7a4f2d;">${s.resepsiVenue || 'Venue'}</span>
            </div>
        </div>`;

    popupData.gift.html = `
        <p style="text-align:center; margin-bottom:20px">Send a tribute to support the adventure:</p>
        <div class="bank-card">
            <p><strong>${s.bank1Name || 'Bank'}</strong></p>
            <span style="font-family:monospace; font-size:18px; display:block">${s.bank1Number || '0000'}</span>
            <p>${s.bank1Holder || 'Name'}</p>
            <button class="submit-btn" style="padding:8px" onclick="copyAccount(this, '${s.bank1Number}')">Add to Vault</button>
        </div>
        ${s.bank2Number ? `
        <div class="bank-card" style="margin-top:15px">
            <p><strong>${s.bank2Name || 'Bank'}</strong></p>
            <span style="font-family:monospace; font-size:18px; display:block">${s.bank2Number || '0000'}</span>
            <p>${s.bank2Holder || 'Name'}</p>
            <button class="submit-btn" style="padding:8px" onclick="copyAccount(this, '${s.bank2Number}')">Add to Vault</button>
        </div>` : ''}`;

    if (gallery.length > 0) {
        popupData.gallery.html = `<div class="gallery-grid">` + 
            gallery.map((img, idx) => `<div class="gallery-item" style="background-image:url('${img.url}'); background-size:cover; height:100px;" onclick="openLightbox('${img.url}', '${(img.alt || '').replace(/'/g, "\\'")}')"></div>`).join('') + 
            `</div>`;
    }

    if (story.length > 0) {
        popupData.love.html = story.map(item => `
            <div class="timeline-item">
                <span style="color:#c9a84c; font-weight:bold">${item.year}</span>
                <p><strong>${item.title}</strong></p>
                ${item.url ? `<img src="${item.url}" style="width:100%; border-radius:8px; margin: 8px 0; border: 2px solid #c9a84c;">` : ''}
                <p style="font-size:14px">${item.description}</p>
            </div>`).join('');
    }

    // RSVP Form with guest_count field
    popupData.rsvp.html = `
        <form id="rsvp-form" onsubmit="submitRSVP(event)">
            <input type="text" id="rsvp-name" placeholder="Nama Anda" required style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #c9a84c; border-radius:4px; font-family:'Playfair Display', serif;">
            <select id="rsvp-attend" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #c9a84c; border-radius:4px; font-family:'Playfair Display', serif;">
                <option value="hadir">Hadir</option>
                <option value="tidak">Tidak Hadir</option>
            </select>
            <select id="rsvp-guests" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #c9a84c; border-radius:4px; font-family:'Playfair Display', serif;">
                <option value="1">1 Orang</option>
                <option value="2">2 Orang</option>
                <option value="3">3 Orang</option>
                <option value="4">4 Orang</option>
                <option value="5">5 Orang</option>
            </select>
            <textarea id="rsvp-message" placeholder="Tulis pesan untuk mempelai..." rows="3" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #c9a84c; border-radius:4px; font-family:'Playfair Display', serif;"></textarea>
            <button type="submit" class="submit-btn" id="rsvp-submit" style="width:100%; padding:12px;">Kirim RSVP</button>
        </form>
        <div id="rsvp-success" class="hidden" style="color:#8fad88; text-align:center; margin-top:15px; font-weight:600">RSVP telah dicatat! Terima kasih.</div>
    `;

    // Wishes wall — show received messages
    if (allWishes.length > 0) {
        popupData.rsvp.html += `
            <div style="margin-top:20px; border-top:2px solid #c9a84c; padding-top:15px;">
                <p style="text-align:center; font-weight:600; color:#c9a84c; margin-bottom:10px;">✨ Ucapan & Doa ✨</p>
                <div style="max-height:200px; overflow-y:auto;">
                    ${allWishes.slice(0, 20).map(w => `
                        <div style="padding:10px; margin-bottom:8px; border-left:3px solid #c9a84c; background:rgba(201,168,76,0.05);">
                            <strong style="font-size:13px; color:#5a3520;">${w.name || 'Anonim'}</strong>
                            <p style="font-size:13px; margin-top:3px; color:#4a2c1a;">${w.message || '-'}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

function startCinematic() {
    const card = document.getElementById('title-card');
    card.classList.add('fade-out');
    
    const music = document.getElementById('bg-music');
    if (music && music.src) {
        music.play().catch(e => console.log('Audio auto-play prevented:', e));
    }

    setTimeout(() => {
        card.style.display = 'none';
        initGameIntro();
    }, 1500);
}

function initGameIntro() {
    const boardText = document.getElementById('chapter-text');
    if (boardText) {
        const text = boardText.innerText;
        boardText.innerText = '';
        typeWriter(boardText, text, 0);
    }
}

function typeWriter(el, text, i, callback) {
    if (i < text.length) {
        el.innerText += text.charAt(i);
        setTimeout(() => typeWriter(el, text, i + 1, callback), 100);
    } else if (callback) {
        callback();
    }
}

function initHotspotSparkles() {
    document.querySelectorAll('.hs').forEach(hs => {
        setInterval(() => spawnSparkle(hs), 1000 + Math.random() * 1000);
    });
}

function spawnSparkle(parent) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle-mote';
    sparkle.style.setProperty('--dx', `${(Math.random() - 0.5) * 100}px`);
    sparkle.style.setProperty('--dy', `${(Math.random() - 0.5) * 100}px`);
    sparkle.style.left = '50%'; sparkle.style.top = '50%';
    parent.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 2000);
}

function initPetals() {
    const layer = document.getElementById('petals-layer');
    const colors = ['#f5c4d0', '#f9dde5', '#e8d8c0', '#f0b8a8'];
    for (let i = 0; i < 20; i++) {
        const petal = document.createElement('div');
        petal.className = 'petal';
        const size = Math.random() * 10 + 6;
        petal.style.width = `${size}px`; petal.style.height = `${size}px`;
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        petal.style.animationDuration = `${Math.random() * 6 + 5}s`;
        petal.style.animationDelay = `${Math.random() * 10}s`;
        petal.style.transform = `rotate(${Math.random() * 360}deg)`;
        layer.appendChild(petal);
    }
}

function enterRoom() {
    const p1 = document.getElementById('page1');
    const p2 = document.getElementById('page2');
    const trans = document.getElementById('transition-layer');
    
    trans.classList.add('open');
    setTimeout(() => {
        p1.style.display = 'none';
        p2.classList.remove('hidden');
        setTimeout(() => {
            trans.classList.remove('open');
        }, 800);
    }, 600);
}

const popupData = {
    date: { title: "Quest: The Sacred Day", html: `` },
    dress: { title: "Warrior Outfits", html: `<p style="text-align:center; margin-bottom:15px">Recommended Palettes:</p><div style="display:flex; justify-content:center; gap:12px; margin-bottom:20px"><div style="width:35px; height:35px; border-radius:4px; background:#fdf6e9; border:2px solid #c9a84c"></div><div style="width:35px; height:35px; border-radius:4px; background:#f5c4a0; border:2px solid #c9a84c"></div><div style="width:35px; height:35px; border-radius:4px; background:#8fad88; border:2px solid #c9a84c"></div><div style="width:35px; height:35px; border-radius:4px; background:#c9a84c; border:2px solid #c9a84c"></div></div><p><strong>Dress Code:</strong> Formal / Studio Ghibli Aesthetic</p>` },
    love: { title: "Epic Timeline", html: `` },
    about: { title: "Party Members", html: `` },
    gallery: { title: "Fragment Gallery", html: `<p style="text-align:center; color:#888">No fragments collected yet.</p>` },
    gift: { title: "Offerings", html: `` },
    rsvp: { title: "Join the Party", html: `` },
    rundown: { title: "Quest Log", html: `<div style="font-size:15px"><div style="margin-bottom:15px"><strong>09:00</strong><br>The Blessing Ceremony</div><div style="margin-bottom:15px"><strong>11:00</strong><br>The Grand Celebration</div><div><strong>16:00</strong><br>Journey into Sunset</div></div>` }
};

function showPopup(key) {
    const data = popupData[key];
    if (!data) return;
    document.getElementById('popup-title').innerText = data.title;
    document.getElementById('popup-body').innerHTML = data.html;
    document.getElementById('overlay').classList.add('open');
}

function closePopup() { document.getElementById('overlay').classList.remove('open'); }
function handleOverlayClick(event) { if (event.target.id === 'overlay') closePopup(); }

async function submitRSVP(event) {
    event.preventDefault();
    const name = document.getElementById('rsvp-name').value;
    const attend = document.getElementById('rsvp-attend').value;
    const guestCount = document.getElementById('rsvp-guests') ? parseInt(document.getElementById('rsvp-guests').value) : 1;
    const msg = document.getElementById('rsvp-message') ? document.getElementById('rsvp-message').value : 'Attending';
    
    if (_supa) {
        document.getElementById('rsvp-submit').innerText = "Mengirim...";
        const { error } = await _supa.from('wishes').insert({ 
            client_id: CLIENT_ID, 
            name, 
            attendance: attend, 
            guest_count: guestCount, 
            message: msg 
        });
        if (error) console.error(error);
        else {
            document.getElementById('rsvp-form').classList.add('hidden');
            document.getElementById('rsvp-success').classList.remove('hidden');
            
            // Background load the wishes so the next time they open the popup, it is updated.
            loadCloudData();
            
            setTimeout(() => {
                closePopup();
            }, 2000);
        }
    }
}

function copyAccount(btn, number) {
    navigator.clipboard.writeText(number).then(() => {
        const originalText = btn.innerText;
        btn.innerText = "✓ Vaulted!";
        setTimeout(() => { btn.innerText = originalText; }, 2000);
    });
}

function toggleMusic() {
    const music = document.getElementById('bg-music');
    const btn = document.getElementById('music-btn');
    if (!music) return;
    
    if (music.paused) {
        music.play();
        btn.innerText = "🎵 On";
    } else {
        music.pause();
        btn.innerText = "🎵 Off";
    }
}

/* --- GALLERY LIGHTBOX --- */
function initLightbox() {
    if (document.getElementById('gallery-lightbox')) return;
    const lb = document.createElement('div');
    lb.id = 'gallery-lightbox';
    lb.onclick = function(e) { if (e.target === lb) closeLightbox(); };
    lb.innerHTML = `
        <button class="lightbox-close" onclick="closeLightbox()">✕</button>
        <img id="lightbox-img" src="" alt="">
        <div class="lightbox-caption" id="lightbox-caption"></div>
    `;
    document.body.appendChild(lb);
}

function openLightbox(url, caption) {
    initLightbox();
    const lb = document.getElementById('gallery-lightbox');
    const img = document.getElementById('lightbox-img');
    const cap = document.getElementById('lightbox-caption');
    img.src = url;
    cap.textContent = caption || '';
    cap.style.display = caption ? 'block' : 'none';
    lb.classList.add('open');
}

function closeLightbox() {
    const lb = document.getElementById('gallery-lightbox');
    if (lb) lb.classList.remove('open');
}

// Close lightbox on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
        closePopup();
    }
});

