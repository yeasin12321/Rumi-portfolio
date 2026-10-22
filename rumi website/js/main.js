/**
 * Rumi's Personal Portfolio & CMS - Core Interactivity & Google Sheet Sync Logic
 * Dedicated to Rumi (রুমি) & Yeasin Kabir (ইয়াছিন কবির)
 * Password: 3460
 * Backend API: Google Apps Script Web App -> Google Sheets
 */

// Application State
const AppState = {
  currentPoemFilter: 'all',
  poemSearchQuery: '',
  currentGalleryFilter: 'all',
  currentLightboxIndex: 0,
  activeLightboxList: [],
  activePoemFontSize: 19, // px
  petalsRunning: true,
  isAdminLoggedIn: sessionStorage.getItem('rumi_admin_logged_in') === 'true',
  editingPoemId: null,
  editingGalleryId: null,
  isSyncing: false
};

// ==========================================
// 1. INITIALIZATION ON DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Initialize Falling Petals Animation
  initPetalsEngine();

  // Initialize Marriage Counter
  initMarriageCounter();

  // Render Public Sections (Immediate render from local cache)
  renderHeroAndMeta();
  renderPoems();
  renderGallery();
  renderLetters();
  updateAdminUIState();

  // Setup Event Listeners
  setupEventListeners();

  // Listen to store data updates (reactive updates across public & CMS)
  window.addEventListener('rumi_data_updated', (e) => {
    renderHeroAndMeta();
    renderPoems();
    renderGallery();
    if (AppState.isAdminLoggedIn) {
      renderAdminDashboard();
    }
    if (window.lucide) window.lucide.createIcons();
  });

  // Listen to Google Sheet sync status events
  window.addEventListener('rumi_sync_status', (e) => {
    updateSyncBadgeUI(e.detail);
  });

  // Trigger Google Sheet Cloud Backend Sync
  triggerGoogleSheetSync(true);
});

// ==========================================
// 2. GOOGLE SHEET SYNC CONTROLLER
// ==========================================
async function triggerGoogleSheetSync(silent = false) {
  if (AppState.isSyncing) return;
  AppState.isSyncing = true;

  const syncBtn = document.getElementById('cms-sync-btn');
  if (syncBtn) {
    syncBtn.classList.add('opacity-75', 'pointer-events-none');
    syncBtn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i><span>সিঙ্ক হচ্ছে...</span>`;
    if (window.lucide) window.lucide.createIcons();
  }

  if (!silent) {
    showToast('গুগল শিট থেকে লাইভ ডাটা লোড হচ্ছে... ☁️', 'info');
  }

  const result = await window.PortfolioStore.syncWithGoogleSheet();
  AppState.isSyncing = false;

  if (syncBtn) {
    syncBtn.classList.remove('opacity-75', 'pointer-events-none');
    syncBtn.innerHTML = `<i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i><span>শিট সিঙ্ক</span>`;
    if (window.lucide) window.lucide.createIcons();
  }

  if (result.success) {
    if (!silent || result.hasNewData) {
      showToast('গুগল শিট লাইভ ডাটাবেজের সাথে সফলভাবে সিঙ্ক সম্পন্ন হয়েছে! ☁️✨', 'success');
    }
  } else if (!silent) {
    showToast('গুগল শিট সিঙ্ক ব্যর্থ হয়েছে, লোকাল ক্যাশ ব্যবহার করা হচ্ছে', 'error');
  }
}

function updateSyncBadgeUI(detail) {
  const syncPill = document.getElementById('sheet-sync-pill');
  const syncText = document.getElementById('sheet-sync-text');
  const cmsSyncTime = document.getElementById('cms-last-sync-time');

  if (!syncPill || !syncText) return;

  if (detail.status === 'syncing') {
    syncText.textContent = 'শিট সিঙ্ক হচ্ছে...';
    syncPill.className = 'hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-sans font-medium bg-amber-950/70 border border-amber-500/30 text-amber-300 shadow-sm backdrop-blur-md';
  } else if (detail.status === 'synced') {
    syncText.textContent = 'Google Sheet Live';
    syncPill.className = 'hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-sans font-medium bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 shadow-sm backdrop-blur-md';
    if (cmsSyncTime && detail.time) {
      const timeStr = new Date(detail.time).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      cmsSyncTime.textContent = `লাইভ ডাটাবেজ সংযুক্ত। সর্বশেষ গুগল শিট সিঙ্ক: ${timeStr}।`;
    }
  } else if (detail.status === 'error') {
    syncText.textContent = 'ক্যাশড মোড (Offline)';
    syncPill.className = 'hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-sans font-medium bg-zinc-900/80 border border-zinc-600/30 text-zinc-300 shadow-sm backdrop-blur-md';
  }
}

// ==========================================
// 3. HERO & MARRIAGE COUNTER MODULE
// ==========================================
function renderHeroAndMeta() {
  const meta = window.PortfolioStore.getMeta();

  // Update dynamic texts
  const wifeNameEls = document.querySelectorAll('.dynamic-wife-name');
  wifeNameEls.forEach(el => el.textContent = meta.wifeName || 'রুমি');

  const husbandNameEls = document.querySelectorAll('.dynamic-husband-name');
  husbandNameEls.forEach(el => el.textContent = meta.husbandName || 'ইয়াছিন কবির');

  const taglineEl = document.getElementById('hero-tagline');
  if (taglineEl) taglineEl.textContent = meta.tagline || '';

  const heroBioEl = document.getElementById('hero-bio');
  if (heroBioEl) heroBioEl.textContent = meta.heroBio || '';

  const quoteTextEl = document.getElementById('featured-quote-text');
  if (quoteTextEl) quoteTextEl.textContent = `"${meta.featuredQuote || ''}"`;

  const quoteAuthorEl = document.getElementById('featured-quote-author');
  if (quoteAuthorEl) quoteAuthorEl.textContent = meta.featuredQuoteAuthor || `— ${meta.husbandName || 'ইয়াছিন কবির'}`;

  const aboutTextEl = document.getElementById('about-bio-text');
  if (aboutTextEl) aboutTextEl.textContent = meta.aboutText || '';
}

function initMarriageCounter() {
  const daysEl = document.getElementById('counter-days');
  const hoursEl = document.getElementById('counter-hours');
  const minutesEl = document.getElementById('counter-minutes');
  const secondsEl = document.getElementById('counter-seconds');

  function update() {
    const meta = window.PortfolioStore.getMeta();
    const marriageDate = new Date(meta.marriageDate || '2026-10-08T00:00:00');
    const now = new Date();

    let diff = now.getTime() - marriageDate.getTime();
    const isFuture = diff < 0;
    if (isFuture) diff = Math.abs(diff);

    const seconds = Math.floor((diff / 1000) % 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (daysEl) daysEl.textContent = convertToBengaliNumber(days);
    if (hoursEl) hoursEl.textContent = convertToBengaliNumber(hours);
    if (minutesEl) minutesEl.textContent = convertToBengaliNumber(minutes);
    if (secondsEl) secondsEl.textContent = convertToBengaliNumber(seconds);
  }

  update();
  setInterval(update, 1000);
}

function convertToBengaliNumber(num) {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).padStart(2, '0').split('').map(d => bnDigits[d] || d).join('');
}

// ==========================================
// 4. FALLING ROSE & LOTUS PETALS CANVAS
// ==========================================
let petalAnimationId = null;
function initPetalsEngine() {
  const canvas = document.getElementById('petals-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const petalCount = window.innerWidth < 768 ? 20 : 38;
  const petals = [];

  const petalColors = [
    { fill: 'rgba(244, 63, 94, 0.75)', stroke: 'rgba(255, 228, 230, 0.5)' }, // Ruby Rose
    { fill: 'rgba(251, 113, 133, 0.65)', stroke: 'rgba(255, 241, 242, 0.4)' }, // Soft Blush Rose
    { fill: 'rgba(232, 121, 249, 0.7)', stroke: 'rgba(250, 232, 255, 0.5)' }, // Pink Lotus
    { fill: 'rgba(244, 114, 182, 0.65)', stroke: 'rgba(253, 242, 248, 0.4)' }, // Petal Pink
    { fill: 'rgba(225, 29, 72, 0.8)', stroke: 'rgba(255, 205, 210, 0.4)' }  // Deep Crimson Rose
  ];

  class Petal {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * canvas.width;
      this.y = initial ? Math.random() * canvas.height : -30;
      this.size = Math.random() * 12 + 10;
      this.speedY = Math.random() * 1.2 + 0.8;
      this.speedX = Math.random() * 1 - 0.5;
      this.angle = Math.random() * Math.PI * 2;
      this.angularSpeed = (Math.random() - 0.5) * 0.025;
      this.swingSpeed = Math.random() * 0.02 + 0.01;
      this.swingPhase = Math.random() * Math.PI * 2;
      this.color = petalColors[Math.floor(Math.random() * petalColors.length)];
      this.opacity = Math.random() * 0.4 + 0.6;
    }

    update() {
      this.y += this.speedY;
      this.x += Math.sin(this.swingPhase) * 1.2 + this.speedX;
      this.swingPhase += this.swingSpeed;
      this.angle += this.angularSpeed;

      if (this.y > canvas.height + 40 || this.x < -40 || this.x > canvas.width + 40) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.globalAlpha = this.opacity;

      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.bezierCurveTo(this.size * 0.8, -this.size * 0.6, this.size * 0.8, this.size * 0.6, 0, this.size);
      ctx.bezierCurveTo(-this.size * 0.8, this.size * 0.6, -this.size * 0.8, -this.size * 0.6, 0, -this.size);
      ctx.closePath();

      ctx.fillStyle = this.color.fill;
      ctx.fill();
      ctx.strokeStyle = this.color.stroke;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -this.size * 0.8);
      ctx.lineTo(0, this.size * 0.8);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.stroke();

      ctx.restore();
    }
  }

  for (let i = 0; i < petalCount; i++) {
    petals.push(new Petal());
  }

  function loop() {
    if (!AppState.petalsRunning) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let p of petals) {
      p.update();
      p.draw();
    }
    petalAnimationId = requestAnimationFrame(loop);
  }

  loop();

  // Petal Toggle Handler
  const toggleBtn = document.getElementById('toggle-petals-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      AppState.petalsRunning = !AppState.petalsRunning;
      if (AppState.petalsRunning) {
        loop();
        showToast('পাপড়ির স্নিগ্ধ বৃষ্টি চালু হয়েছে 🌹', 'success');
        toggleBtn.classList.add('text-rose-400');
      } else {
        cancelAnimationFrame(petalAnimationId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        showToast('পাপড়ির অ্যানিমেশন সাময়িক বন্ধ করা হয়েছে', 'info');
        toggleBtn.classList.remove('text-rose-400');
      }
    });
  }
}

// ==========================================
// 5. POEMS & LITERATURE MODULE
// ==========================================
function renderPoems() {
  const container = document.getElementById('poems-grid');
  if (!container) return;

  const poems = window.PortfolioStore.getPoems(AppState.currentPoemFilter, AppState.poemSearchQuery);
  const countEl = document.getElementById('poems-count');
  if (countEl) countEl.textContent = `(${convertToBengaliNumber(poems.length)}টি রচনা)`;

  if (poems.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center glass-card rounded-3xl p-8 border border-rose-500/20">
        <i data-lucide="flower-2" class="w-12 h-12 text-rose-400/50 mx-auto mb-3 animate-pulse"></i>
        <h4 class="text-xl font-medium text-rose-200">কোনো কবিতা বা রচনা পাওয়া যায়নি</h4>
        <p class="text-sm text-rose-300/60 mt-1">অন্য কোনো ক্যাটাগরি বেছে নিন বা নতুন কবিতা যোগ করতে এডমিন প্যানেল ব্যবহার করুন।</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = poems.map(poem => {
    const isPinned = poem.pinned ? `
      <span class="inline-flex items-center gap-1 text-[11px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
        <i data-lucide="pin" class="w-3 h-3 text-rose-400"></i> প্রিয় রচনা
      </span>` : '';

    return `
      <article class="glass-card glass-card-hover rounded-3xl p-6 md:p-7 flex flex-col justify-between relative group border border-rose-500/15">
        <div class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-900/60 border border-rose-500/30 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg shadow-rose-900/40">
          🌹
        </div>

        <div>
          <!-- Top Badges & Meta -->
          <div class="flex items-center justify-between gap-2 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold px-3 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/20 shadow-inner">
                ${poem.categoryLabel || 'কাব্য'}
              </span>
              ${isPinned}
            </div>
            <span class="text-xs text-rose-300/60 flex items-center gap-1 font-sans">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-rose-400"></i> ${poem.readTime || '২ মিনিট'}
            </span>
          </div>

          <!-- Title -->
          <h3 class="text-xl md:text-2xl font-bold text-white group-hover:text-rose-200 transition-colors line-clamp-1 mb-2 font-poem">
            ${poem.title}
          </h3>

          <!-- Excerpt -->
          <p class="text-rose-100/75 text-sm md:text-base leading-relaxed mb-6 font-poem whitespace-pre-line line-clamp-3">
            ${poem.excerpt || (poem.content ? poem.content.slice(0, 100) + '...' : '')}
          </p>
        </div>

        <!-- Card Footer Actions -->
        <div class="pt-4 border-t border-rose-500/10 flex items-center justify-between">
          <button 
            onclick="likePoem('${poem.id}')" 
            class="like-btn flex items-center gap-1.5 text-xs text-rose-300/80 hover:text-rose-300 transition-colors py-1.5 px-3 rounded-full hover:bg-rose-500/10 cursor-pointer"
            title="পছন্দ করুন"
          >
            <i data-lucide="heart" class="w-4 h-4 text-rose-400 fill-rose-500/30"></i>
            <span id="poem-likes-${poem.id}">${poem.likes || 0}</span>
          </button>

          <button 
            onclick="openPoemReaderModal('${poem.id}')"
            class="inline-flex items-center gap-1.5 text-sm font-medium text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-600 px-4 py-2 rounded-xl border border-rose-500/30 transition-all duration-300 shadow-md shadow-rose-950/50 cursor-pointer"
          >
            <span>সম্পূর্ণ পড়ুন</span>
            <i data-lucide="arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-1"></i>
          </button>
        </div>
      </article>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function likePoem(poemId) {
  const newCount = window.PortfolioStore.likePoem(poemId);
  const el = document.getElementById(`poem-likes-${poemId}`);
  if (el) el.textContent = newCount;
  showToast('কবিতাটিতে ভালোবাসা জানানো হয়েছে 🌹', 'success');
}

// Full Poem Reading Modal
function openPoemReaderModal(poemId) {
  const poem = window.PortfolioStore.getPoemById(poemId);
  if (!poem) return;

  const modal = document.getElementById('poem-reader-modal');
  const titleEl = document.getElementById('reader-poem-title');
  const categoryEl = document.getElementById('reader-poem-category');
  const dateEl = document.getElementById('reader-poem-date');
  const bodyEl = document.getElementById('reader-poem-body');

  if (titleEl) titleEl.textContent = poem.title;
  if (categoryEl) categoryEl.textContent = poem.categoryLabel || 'কাব্য';
  if (dateEl) dateEl.textContent = poem.date || '২০২৬';
  if (bodyEl) {
    bodyEl.textContent = poem.content;
    bodyEl.style.fontSize = `${AppState.activePoemFontSize}px`;
  }

  modal.setAttribute('data-active-poem-id', poemId);
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';

  if (window.lucide) window.lucide.createIcons();
}

function closePoemReaderModal() {
  const modal = document.getElementById('poem-reader-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  document.body.style.overflow = 'auto';
}

function changeReaderFontSize(delta) {
  AppState.activePoemFontSize = Math.min(28, Math.max(15, AppState.activePoemFontSize + delta));
  const bodyEl = document.getElementById('reader-poem-body');
  if (bodyEl) {
    bodyEl.style.fontSize = `${AppState.activePoemFontSize}px`;
  }
}

function setReaderTheme(themeName) {
  const readerBox = document.getElementById('reader-card-box');
  if (!readerBox) return;

  readerBox.classList.remove('reader-theme-rose', 'reader-theme-parchment', 'reader-theme-dark', 'reader-theme-ivory');
  readerBox.classList.add(`reader-theme-${themeName}`);
}

function copyActivePoem() {
  const titleEl = document.getElementById('reader-poem-title');
  const bodyEl = document.getElementById('reader-poem-body');
  const meta = window.PortfolioStore.getMeta();

  const fullText = `${titleEl ? titleEl.textContent : 'কবিতা'}\n— ${meta.wifeName || 'রুমি'}\n\n${bodyEl ? bodyEl.textContent : ''}\n\n[রুমির সাহিত্য কানন]`;

  navigator.clipboard.writeText(fullText).then(() => {
    showToast('কবিতাটি ক্লিপবোর্ডে কপি করা হয়েছে! 🌸', 'success');
  }).catch(() => {
    showToast('কপি করতে ব্যর্থ হয়েছে', 'error');
  });
}

// ==========================================
// 6. FLORAL PHOTO GALLERY & LIGHTBOX
// ==========================================
function renderGallery() {
  const container = document.getElementById('gallery-grid');
  if (!container) return;

  const galleryItems = window.PortfolioStore.getGallery(AppState.currentGalleryFilter);
  AppState.activeLightboxList = galleryItems;

  const countEl = document.getElementById('gallery-count');
  if (countEl) countEl.textContent = `(${convertToBengaliNumber(galleryItems.length)}টি আলোকচিত্র)`;

  if (galleryItems.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center glass-card rounded-3xl p-8 border border-rose-500/20">
        <i data-lucide="image" class="w-12 h-12 text-rose-400/50 mx-auto mb-3 animate-pulse"></i>
        <h4 class="text-xl font-medium text-rose-200">কোনো ছবি পাওয়া যায়নি</h4>
        <p class="text-sm text-rose-300/60 mt-1">অন্য কোনো ক্যাটাগরি বেছে নিন অথবা এডমিন প্যানেল থেকে ছবি যোগ করুন।</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = galleryItems.map((item, index) => {
    return `
      <div class="gallery-img-wrapper glass-card group cursor-pointer aspect-square sm:aspect-[4/3] rounded-2xl relative shadow-lg overflow-hidden border border-rose-500/20"
           onclick="openLightbox(${index})">
        <img 
          src="${item.url}" 
          alt="${item.caption || 'Flower image'}" 
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'"
          class="w-full h-full object-cover"
        />

        <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4">
          <div class="flex justify-between items-center">
            <span class="text-[11px] font-medium bg-rose-950/90 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-full backdrop-blur-md">
              ${item.categoryLabel || 'ফুলের স্মৃতি'}
            </span>
            <button 
              onclick="event.stopPropagation(); likeGalleryItem('${item.id}', ${index})" 
              class="w-8 h-8 rounded-full bg-rose-900/80 hover:bg-rose-700 text-white flex items-center justify-center transition-colors shadow-md"
              title="ভালোবাসা দিন"
            >
              <i data-lucide="heart" class="w-4 h-4 fill-rose-300 text-rose-200"></i>
            </button>
          </div>

          <div>
            <p class="text-sm font-medium text-white line-clamp-2 font-poem drop-shadow-md">
              ${item.caption}
            </p>
            <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-[11px] text-rose-200/80">
              <span>${item.date || '২০২৬'}</span>
              <span class="flex items-center gap-1 font-sans">
                <i data-lucide="heart" class="w-3 h-3 text-rose-400"></i> <span id="gal-likes-${item.id}">${item.likes || 0}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function likeGalleryItem(itemId, index) {
  const newCount = window.PortfolioStore.likeGalleryItem(itemId);
  const el = document.getElementById(`gal-likes-${itemId}`);
  if (el) el.textContent = newCount;
  showToast('আলোকচিত্রে শুভকামনা জানানো হয়েছে 🌸', 'success');
}

// Lightbox Modal
function openLightbox(index) {
  if (!AppState.activeLightboxList || AppState.activeLightboxList.length === 0) return;
  AppState.currentLightboxIndex = index;
  updateLightboxContent();

  const lightbox = document.getElementById('gallery-lightbox');
  if (lightbox) {
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
}

function updateLightboxContent() {
  const item = AppState.activeLightboxList[AppState.currentLightboxIndex];
  if (!item) return;

  const imgEl = document.getElementById('lightbox-image');
  const captionEl = document.getElementById('lightbox-caption');
  const counterEl = document.getElementById('lightbox-counter');
  const categoryEl = document.getElementById('lightbox-category');

  if (imgEl) {
    imgEl.src = item.url;
    imgEl.alt = item.caption;
  }
  if (captionEl) captionEl.textContent = item.caption;
  if (categoryEl) categoryEl.textContent = item.categoryLabel || 'ফুল ও প্রকৃতি';
  if (counterEl) {
    counterEl.textContent = `${convertToBengaliNumber(AppState.currentLightboxIndex + 1)} / ${convertToBengaliNumber(AppState.activeLightboxList.length)}`;
  }
}

function stepLightbox(direction) {
  const total = AppState.activeLightboxList.length;
  if (total <= 1) return;
  AppState.currentLightboxIndex = (AppState.currentLightboxIndex + direction + total) % total;
  updateLightboxContent();
}

function closeLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  if (lightbox) {
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    document.body.style.overflow = 'auto';
  }
}

// ==========================================
// 7. OPEN-WHEN DIGITAL LETTERS MODULE
// ==========================================
function renderLetters() {
  const container = document.getElementById('letters-grid');
  if (!container) return;

  const letters = window.PortfolioStore.getLetters();

  if (!letters || letters.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center glass-card rounded-3xl p-8 border border-rose-500/20">
        <i data-lucide="mail" class="w-10 h-10 text-rose-400/50 mx-auto mb-3 animate-pulse"></i>
        <h4 class="text-lg font-medium text-rose-200">কোনো ডিজিটাল চিঠি বা খাম নেই</h4>
        <p class="text-xs text-rose-300/60 mt-1">গুগল শিট ডাটাবেজে চিঠি যুক্ত হলে এখানে স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = letters.map(letter => {
    return `
      <div 
        onclick="openLetterModal('${letter.id}')"
        class="envelope-card glass-card rounded-3xl p-6 pt-10 flex flex-col justify-between cursor-pointer border border-rose-400/20 shadow-xl group hover:border-rose-400/50"
      >
        <div class="wax-seal">
          <span class="text-base">${letter.flower || '🌹'}</span>
        </div>

        <div>
          <div class="text-center mb-3">
            <span class="text-[11px] font-semibold text-rose-300 uppercase tracking-wider bg-rose-950/80 px-3 py-1 rounded-full border border-rose-500/20">
              ডিজিটাল খাম
            </span>
          </div>

          <h4 class="text-lg md:text-xl font-bold text-center text-white group-hover:text-rose-200 transition-colors font-poem mb-2">
            ${letter.trigger}
          </h4>

          <p class="text-xs md:text-sm text-rose-200/70 text-center font-poem line-clamp-2 px-2">
            "${letter.preview}"
          </p>
        </div>

        <div class="mt-6 pt-3 border-t border-rose-500/15 flex items-center justify-center gap-2 text-xs font-medium text-rose-300 group-hover:text-white">
          <span>খামটি খুলুন</span>
          <i data-lucide="mail-open" class="w-4 h-4 transition-transform group-hover:scale-110"></i>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

function openLetterModal(letterId) {
  const letter = window.PortfolioStore.getLetterById(letterId);
  if (!letter) return;

  const modal = document.getElementById('letter-modal');
  const titleEl = document.getElementById('letter-modal-title');
  const triggerEl = document.getElementById('letter-modal-trigger');
  const bodyEl = document.getElementById('letter-modal-body');

  if (titleEl) titleEl.textContent = letter.title;
  if (triggerEl) triggerEl.textContent = `খাম: "${letter.trigger}"`;
  if (bodyEl) bodyEl.textContent = letter.body;

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  createFloralBurst();
}

function closeLetterModal() {
  const modal = document.getElementById('letter-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  document.body.style.overflow = 'auto';
}

// ==========================================
// 8. SECRET NOTE BOX (WITH GOOGLE SHEET SYNC)
// ==========================================
function setupContactForm() {
  const form = document.getElementById('secret-note-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const senderInput = document.getElementById('note-sender');
    const categoryInput = document.getElementById('note-category');
    const subjectInput = document.getElementById('note-subject');
    const messageInput = document.getElementById('note-message');
    const submitBtn = document.getElementById('note-submit-btn');

    const noteData = {
      sender: senderInput ? senderInput.value.trim() : 'তোমার ইয়াছিন কবির (Husband)',
      category: categoryInput ? categoryInput.value : 'ভালোবাসা',
      subject: subjectInput ? subjectInput.value.trim() : 'মনের গোপন চিঠি',
      message: messageInput ? messageInput.value.trim() : ''
    };

    if (!noteData.message) {
      showToast('অনুগ্রহ করে চিঠির বার্তা লিখুন', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.classList.add('opacity-75', 'pointer-events-none');
      submitBtn.innerHTML = `<span>গুগল শিটে পাঠানো হচ্ছে...</span> <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }

    showToast('গুগল শিটে গোপন বার্তা পাঠানো হচ্ছে... 💌☁️', 'info');

    // Add note and send to Google Sheet
    await window.PortfolioStore.addNote(noteData);

    form.reset();
    if (senderInput) senderInput.value = 'তোমার ইয়াছিন কবির (Husband)';

    if (submitBtn) {
      submitBtn.classList.remove('opacity-75', 'pointer-events-none');
      submitBtn.innerHTML = `<span>ভালোবাসা পাঠান</span> <span class="text-lg">💌</span>`;
    }

    showToast('গোপন চিঠিটি সফলভাবে গুগল শিটে সংরক্ষিত হয়েছে! 💌🌹', 'success');
    createFloralBurst();
  });
}

function createFloralBurst() {
  const symbols = ['🌹', '🪷', '🌸', '✨', '💖'];
  for (let i = 0; i < 15; i++) {
    const el = document.createElement('div');
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.position = 'fixed';
    el.style.left = `${50 + (Math.random() - 0.5) * 40}%`;
    el.style.top = `${50 + (Math.random() - 0.5) * 30}%`;
    el.style.fontSize = `${Math.random() * 18 + 16}px`;
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';
    el.style.transition = 'all 1.5s cubic-bezier(0.16, 1, 0.3, 1)';
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.transform = `translate(${(Math.random() - 0.5) * 300}px, ${-(Math.random() * 250 + 50)}px) scale(${Math.random() * 0.5 + 0.8}) rotate(${Math.random() * 360}deg)`;
      el.style.opacity = '0';
    });

    setTimeout(() => {
      el.remove();
    }, 1600);
  }
}

// ==========================================
// 9. ADMIN PANEL & CMS SYSTEM (Password: 3460)
// ==========================================
function updateAdminUIState() {
  const loginBtn = document.getElementById('nav-admin-login-btn');
  const mobileLoginBtn = document.getElementById('mobile-admin-login-btn');
  const dashboardBtn = document.getElementById('admin-dashboard-pill');

  if (AppState.isAdminLoggedIn) {
    if (loginBtn) {
      loginBtn.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i> এডমিন প্যানেল`;
      loginBtn.classList.add('border-emerald-500/40', 'bg-emerald-950/40', 'text-emerald-300');
    }
    if (mobileLoginBtn) {
      mobileLoginBtn.innerHTML = `<i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i> এডমিন প্যানেল`;
    }
    if (dashboardBtn) dashboardBtn.classList.remove('hidden');
  } else {
    if (loginBtn) {
      loginBtn.innerHTML = `<i data-lucide="lock" class="w-4 h-4 text-rose-400"></i> এডমিন লগইন`;
      loginBtn.classList.remove('border-emerald-500/40', 'bg-emerald-950/40', 'text-emerald-300');
    }
    if (mobileLoginBtn) {
      mobileLoginBtn.innerHTML = `<i data-lucide="lock" class="w-4 h-4 text-rose-400"></i> এডমিন লগইন`;
    }
    if (dashboardBtn) dashboardBtn.classList.add('hidden');
  }
  if (window.lucide) window.lucide.createIcons();
}

function handleAdminButtonClick() {
  if (AppState.isAdminLoggedIn) {
    openAdminDashboardModal();
  } else {
    openAdminLoginModal();
  }
}

function openAdminLoginModal() {
  const modal = document.getElementById('admin-login-modal');
  const input = document.getElementById('admin-password-input');
  if (input) {
    input.value = '';
    setTimeout(() => input.focus(), 100);
  }
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
}

function closeAdminLoginModal() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = 'auto';
  }
}

function submitAdminLogin() {
  const input = document.getElementById('admin-password-input');
  const password = input ? input.value.trim() : '';

  if (password === AUTH_PASSWORD) {
    AppState.isAdminLoggedIn = true;
    sessionStorage.setItem('rumi_admin_logged_in', 'true');
    closeAdminLoginModal();
    updateAdminUIState();
    showToast('এডমিন লগইন সফল হয়েছে! স্বাগতম রুমি ও ইয়াছিন কবির 🌹', 'success');
    openAdminDashboardModal();
  } else {
    showToast('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন', 'error');
    if (input) {
      input.classList.add('border-red-500', 'animate-shake');
      setTimeout(() => input.classList.remove('border-red-500', 'animate-shake'), 800);
    }
  }
}

function adminLogout() {
  AppState.isAdminLoggedIn = false;
  sessionStorage.removeItem('rumi_admin_logged_in');
  updateAdminUIState();
  closeAdminDashboardModal();
  showToast('এডমিন প্যানেল থেকে লগআউট করা হয়েছে', 'info');
}

function openAdminDashboardModal() {
  if (!AppState.isAdminLoggedIn) {
    openAdminLoginModal();
    return;
  }
  const modal = document.getElementById('admin-dashboard-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    renderAdminDashboard();
  }
}

function closeAdminDashboardModal() {
  const modal = document.getElementById('admin-dashboard-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = 'auto';
  }
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  document.querySelectorAll('.admin-tab-pane').forEach(pane => {
    if (pane.id === `admin-tab-${tabName}`) {
      pane.classList.remove('hidden');
    } else {
      pane.classList.add('hidden');
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

function renderAdminDashboard() {
  const poems = window.PortfolioStore.getPoems('all');
  const gallery = window.PortfolioStore.getGallery('all');
  const notes = window.PortfolioStore.getNotes();
  const meta = window.PortfolioStore.getMeta();

  // Overview Stats
  const statPoems = document.getElementById('cms-stat-poems');
  const statGallery = document.getElementById('cms-stat-gallery');
  const statNotes = document.getElementById('cms-stat-notes');
  const statDays = document.getElementById('cms-stat-days');

  if (statPoems) statPoems.textContent = convertToBengaliNumber(poems.length);
  if (statGallery) statGallery.textContent = convertToBengaliNumber(gallery.length);
  if (statNotes) statNotes.textContent = convertToBengaliNumber(notes.length);

  const marriageDate = new Date(meta.marriageDate || '2026-10-08');
  const diffDays = Math.max(0, Math.floor((new Date() - marriageDate) / (1000 * 60 * 60 * 24)));
  if (statDays) statDays.textContent = convertToBengaliNumber(diffDays);

  renderCmsPoemsList();
  renderCmsGalleryList();
  populateCmsMetaForm();
  renderCmsNotesList();
}

// CMS: Poems Management
function renderCmsPoemsList() {
  const container = document.getElementById('cms-poems-list');
  if (!container) return;

  const poems = window.PortfolioStore.getPoems('all');
  container.innerHTML = poems.map(p => `
    <div class="flex items-center justify-between p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/20 hover:border-rose-400/40 transition-colors">
      <div class="flex-1 mr-3">
        <div class="flex items-center gap-2">
          <span class="text-xs px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 font-sans">${p.categoryLabel}</span>
          <h5 class="text-sm font-semibold text-white font-poem">${p.title}</h5>
        </div>
        <p class="text-xs text-rose-300/60 mt-1 line-clamp-1 font-poem">${p.excerpt || p.content.slice(0, 60)}</p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="editPoemInCms('${p.id}')" class="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-colors" title="সম্পাদনা">
          <i data-lucide="edit-3" class="w-4 h-4"></i>
        </button>
        <button onclick="deletePoemInCms('${p.id}')" class="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 transition-colors" title="মুছে ফেলুন">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

async function handlePoemFormSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('cms-poem-title').value.trim();
  const category = document.getElementById('cms-poem-category').value;
  const date = document.getElementById('cms-poem-date').value;
  const readTime = document.getElementById('cms-poem-readtime').value.trim();
  const content = document.getElementById('cms-poem-content').value.trim();
  const submitBtn = document.getElementById('cms-poem-submit-btn');

  if (!title || !content) {
    showToast('দয়া করে কবিতার শিরোনাম ও বিষয়বস্তু লিখুন', 'error');
    return;
  }

  const poemData = {
    title,
    category,
    date: date || new Date().toISOString().split('T')[0],
    readTime: readTime || '২ মিনিট',
    excerpt: content.slice(0, 80) + '...',
    content
  };

  if (submitBtn) {
    submitBtn.classList.add('opacity-75', 'pointer-events-none');
    submitBtn.innerHTML = `<span>গুগল শিটে সেভ হচ্ছে...</span> <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>`;
    if (window.lucide) window.lucide.createIcons();
  }

  showToast('গুগল শিটে কবিতা সংরক্ষণ করা হচ্ছে... ☁️', 'info');

  if (AppState.editingPoemId) {
    window.PortfolioStore.updatePoem(AppState.editingPoemId, poemData);
    AppState.editingPoemId = null;
    showToast('কবিতা সফলভাবে আপডেট করা হয়েছে! 🌹', 'success');
  } else {
    await window.PortfolioStore.addPoem(poemData);
    showToast('নতুন কবিতা সরাসরি গুগল শিটে যুক্ত করা হয়েছে! 🌸☁️', 'success');
  }

  if (submitBtn) {
    submitBtn.classList.remove('opacity-75', 'pointer-events-none');
    submitBtn.innerHTML = `<span>কবিতা যোগ করুন</span> <i data-lucide="cloud-upload" class="w-4 h-4"></i>`;
  }

  document.getElementById('cms-poem-form').reset();
  document.getElementById('cms-poem-cancel-btn').classList.add('hidden');
  renderCmsPoemsList();
}

function editPoemInCms(poemId) {
  const poem = window.PortfolioStore.getPoemById(poemId);
  if (!poem) return;

  AppState.editingPoemId = poemId;
  document.getElementById('cms-poem-title').value = poem.title || '';
  document.getElementById('cms-poem-category').value = poem.category || 'prem';
  document.getElementById('cms-poem-date').value = poem.date || '';
  document.getElementById('cms-poem-readtime').value = poem.readTime || '';
  document.getElementById('cms-poem-content').value = poem.content || '';

  const submitBtn = document.getElementById('cms-poem-submit-btn');
  if (submitBtn) submitBtn.innerHTML = `<span>পরিবর্তন সংরক্ষণ করুন</span> <i data-lucide="check" class="w-4 h-4"></i>`;

  const cancelBtn = document.getElementById('cms-poem-cancel-btn');
  if (cancelBtn) cancelBtn.classList.remove('hidden');

  document.getElementById('cms-poem-form').scrollIntoView({ behavior: 'smooth' });
}

function cancelPoemEdit() {
  AppState.editingPoemId = null;
  document.getElementById('cms-poem-form').reset();
  const submitBtn = document.getElementById('cms-poem-submit-btn');
  if (submitBtn) submitBtn.innerHTML = `<span>কবিতা যোগ করুন</span> <i data-lucide="cloud-upload" class="w-4 h-4"></i>`;
  document.getElementById('cms-poem-cancel-btn').classList.add('hidden');
}

async function deletePoemInCms(poemId) {
  if (!confirm('আপনি কি নিশ্চিত যে এই কবিতাটি মুছে ফেলতে চান?')) return;

  showToast('গুগল শিট থেকে মুছে ফেলা হচ্ছে...', 'info');
  const deletion = window.PortfolioStore.deletePoem(poemId);
  renderCmsPoemsList();

  const { deleted, sheetResult } = await deletion;
  if (!deleted) {
    showToast('কবিতাটি পাওয়া যায়নি বা আগেই মুছে ফেলা হয়েছে', 'error');
    return;
  }
  if (sheetResult.success) {
    showToast('কবিতাটি Google Sheets ও ওয়েবসাইট থেকে মুছে ফেলা হয়েছে', 'success');
  } else {
    showToast('কবিতাটি ওয়েবসাইট থেকে মুছে ফেলা হয়েছে, কিন্তু Google Sheets থেকে মুছতে সমস্যা হয়েছে', 'error');
  }
}

// CMS: Gallery Management
function renderCmsGalleryList() {
  const container = document.getElementById('cms-gallery-list');
  if (!container) return;

  const items = window.PortfolioStore.getGallery('all');
  container.innerHTML = items.map(g => `
    <div class="relative group rounded-xl overflow-hidden aspect-square border border-rose-500/20">
      <img src="${g.url}" alt="${g.caption}" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-black/75 p-2 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span class="text-[10px] bg-rose-900/90 text-rose-200 px-2 py-0.5 rounded-full w-max">${g.categoryLabel}</span>
        <p class="text-[11px] text-white line-clamp-2">${g.caption}</p>
        <button onclick="deleteGalleryInCms('${g.id}')" class="w-full py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs flex items-center justify-center gap-1 cursor-pointer">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i> মুছুন
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

async function handleGalleryFormSubmit(e) {
  e.preventDefault();
  const rawUrl = document.getElementById('cms-gal-url').value.trim();
  // Auto-convert Google Drive share/view links to direct CDN URLs
  const url = convertDriveLink(rawUrl);
  const caption = document.getElementById('cms-gal-caption').value.trim();
  const category = document.getElementById('cms-gal-category').value;
  const date = document.getElementById('cms-gal-date').value;
  const submitBtn = document.getElementById('cms-gal-submit-btn');

  if (!url || !caption) {
    showToast('দয়া করে ছবির লিংক এবং ক্যাপশন দিন', 'error');
    return;
  }

  const galData = {
    url,
    caption,
    category,
    date: date || new Date().toISOString().split('T')[0]
  };

  if (submitBtn) {
    submitBtn.classList.add('opacity-75', 'pointer-events-none');
    submitBtn.innerHTML = `<span>গুগল শিটে সেভ হচ্ছে...</span> <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>`;
    if (window.lucide) window.lucide.createIcons();
  }

  showToast('গুগল শিটে ছবি সংরক্ষণ করা হচ্ছে... ☁️', 'info');
  await window.PortfolioStore.addGalleryItem(galData);

  if (submitBtn) {
    submitBtn.classList.remove('opacity-75', 'pointer-events-none');
    submitBtn.innerHTML = `<span>গ্যালারিতে যুক্ত করুন</span> <i data-lucide="cloud-upload" class="w-4 h-4"></i>`;
  }

  document.getElementById('cms-gallery-form').reset();
  showToast('নতুন আলোকচিত্র সরাসরি গুগল শিটে যুক্ত করা হয়েছে! 🌸☁️', 'success');
  renderCmsGalleryList();
}

function selectPresetGalleryImage(url) {
  const input = document.getElementById('cms-gal-url');
  if (input) {
    input.value = url;
    // Hide preview since preset URLs are already direct
    const previewEl = document.getElementById('gal-url-preview');
    if (previewEl) previewEl.classList.add('hidden');
  }
  showToast('নমুনা ফুলের ছবি লিংক হিসেবে নির্বাচিত হয়েছে', 'info');
}

/**
 * Shows a live conversion preview when a Google Drive link is typed
 * in the gallery URL input field.
 * @param {string} rawUrl - The raw value from the input
 */
function previewDriveLinkConversion(rawUrl) {
  const previewEl = document.getElementById('gal-url-preview');
  if (!previewEl) return;
  if (!rawUrl || !rawUrl.trim()) {
    previewEl.classList.add('hidden');
    return;
  }
  const isDrive = /drive\.google\.com|docs\.google\.com/.test(rawUrl);
  if (isDrive) {
    const converted = convertDriveLink(rawUrl);
    previewEl.textContent = '→ Converted: ' + converted;
    previewEl.classList.remove('hidden');
  } else {
    previewEl.classList.add('hidden');
  }
}

async function deleteGalleryInCms(itemId) {
  if (!confirm('আপনি কি নিশ্চিত যে ছবিটি গ্যালারি থেকে মুছে ফেলবেন?')) return;

  showToast('গুগল শিট থেকে মুছে ফেলা হচ্ছে...', 'info');
  const deletion = window.PortfolioStore.deleteGalleryItem(itemId);
  renderCmsGalleryList();

  const { deleted, sheetResult } = await deletion;
  if (!deleted) {
    showToast('ছবিটি পাওয়া যায়নি বা আগেই মুছে ফেলা হয়েছে', 'error');
    return;
  }
  if (sheetResult.success) {
    showToast('ছবিটি Google Sheets ও গ্যালারি থেকে মুছে ফেলা হয়েছে', 'success');
  } else {
    showToast('ছবিটি গ্যালারি থেকে মুছে ফেলা হয়েছে, কিন্তু Google Sheets থেকে মুছতে সমস্যা হয়েছে', 'error');
  }
}

// CMS: Hero & Meta Management
function populateCmsMetaForm() {
  const meta = window.PortfolioStore.getMeta();
  const wifeInput = document.getElementById('cms-meta-wife');
  const husbandInput = document.getElementById('cms-meta-husband');
  const dateInput = document.getElementById('cms-meta-marriage-date');
  const taglineInput = document.getElementById('cms-meta-tagline');
  const bioInput = document.getElementById('cms-meta-bio');
  const quoteInput = document.getElementById('cms-meta-quote');
  const authorInput = document.getElementById('cms-meta-quote-author');
  const aboutInput = document.getElementById('cms-meta-about');

  if (wifeInput) wifeInput.value = meta.wifeName || 'রুমি';
  if (husbandInput) husbandInput.value = meta.husbandName || 'ইয়াছিন কবির';
  if (dateInput && meta.marriageDate) {
    dateInput.value = meta.marriageDate.split('T')[0];
  }
  if (taglineInput) taglineInput.value = meta.tagline || '';
  if (bioInput) bioInput.value = meta.heroBio || '';
  if (quoteInput) quoteInput.value = meta.featuredQuote || '';
  if (authorInput) authorInput.value = meta.featuredQuoteAuthor || '';
  if (aboutInput) aboutInput.value = meta.aboutText || '';
}

function handleMetaFormSubmit(e) {
  e.preventDefault();
  const wifeName = document.getElementById('cms-meta-wife').value.trim();
  const husbandName = document.getElementById('cms-meta-husband').value.trim();
  const marriageDate = document.getElementById('cms-meta-marriage-date').value;
  const tagline = document.getElementById('cms-meta-tagline').value.trim();
  const heroBio = document.getElementById('cms-meta-bio').value.trim();
  const featuredQuote = document.getElementById('cms-meta-quote').value.trim();
  const featuredQuoteAuthor = document.getElementById('cms-meta-quote-author').value.trim();
  const aboutText = document.getElementById('cms-meta-about').value.trim();

  window.PortfolioStore.updateMeta({
    wifeName,
    husbandName: husbandName || 'ইয়াছিন কবির',
    marriageDate: marriageDate ? `${marriageDate}T00:00:00` : '2026-10-08T00:00:00',
    tagline,
    heroBio,
    featuredQuote,
    featuredQuoteAuthor,
    aboutText
  });

  showToast('হোমপেজের তথ্য ও প্রেমের উক্তি সফলভাবে আপডেট হয়েছে! 🌹', 'success');
}

// CMS: Secret Notes Management
function renderCmsNotesList() {
  const container = document.getElementById('cms-notes-list');
  if (!container) return;

  const notes = window.PortfolioStore.getNotes();
  if (notes.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-rose-300/60">
        <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
        <p>এখনো কোনো গোপন বার্তা জমা পড়েনি।</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = notes.map(n => `
    <div class="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/20 hover:border-rose-400/40 transition-colors">
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="text-xs px-2.5 py-0.5 rounded-full bg-rose-900/80 text-rose-200 border border-rose-500/30">
            ${n.category || 'বার্তা'}
          </span>
          <span class="text-sm font-bold text-white">${n.sender || 'ইয়াছিন কবির'}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-rose-300/60 font-sans">${n.date}</span>
          <button onclick="deleteNoteInCms('${n.id}')" class="text-red-400 hover:text-red-300 p-1 cursor-pointer" title="মুছুন">
            <i data-lucide="trash" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
      <h6 class="text-sm font-semibold text-rose-200 mb-1">${n.subject}</h6>
      <p class="text-sm text-rose-100/90 whitespace-pre-line font-poem leading-relaxed bg-black/20 p-3 rounded-xl border border-rose-500/10">
        ${n.message}
      </p>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function deleteNoteInCms(noteId) {
  if (confirm('আপনি কি এই বার্তাটি মুছে ফেলতে চান?')) {
    window.PortfolioStore.deleteNote(noteId);
    showToast('বার্তাটি মুছে ফেলা হয়েছে', 'info');
    renderCmsNotesList();
  }
}

// Backup & Reset Operations
function triggerResetDefaults() {
  if (confirm('আপনি কি সমস্ত ডাটা মুছে দিয়ে প্রাথমিক ডিফল্ট অবস্থায় ফিরে যেতে চান? (সব সংরক্ষিত কবিতা ও ছবি রিসেট হয়ে যাবে)')) {
    window.PortfolioStore.resetToDefault();
    showToast('ওয়েবসাইটটি সফলভাবে প্রাথমিক অবস্থায় রিসেট করা হয়েছে! 🌹', 'success');
  }
}

function exportCmsBackup() {
  const jsonStr = window.PortfolioStore.exportDataJSON();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rumi_portfolio_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('সম্পূর্ণ ডাটা ব্যাকআপ ডাউনলোড সম্পন্ন হয়েছে! 📂', 'success');
}

function importCmsBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const success = window.PortfolioStore.importDataJSON(e.target.result);
    if (success) {
      showToast('ব্যাকআপ সফলভাবে পুনরুদ্ধার (Restore) করা হয়েছে! 🌹', 'success');
    } else {
      showToast('ভুল ফাইল ফরম্যাট! ব্যাকআপ পুনরুদ্ধার করা যায়নি।', 'error');
    }
  };
  reader.readAsText(file);
}

// ==========================================
// 10. EVENT LISTENERS SETUP
// ==========================================
function setupEventListeners() {
  // Mobile Nav Toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
    document.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
    });
  }

  // Poem Filter Tabs
  document.querySelectorAll('.poem-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.poem-tab-btn').forEach(b => {
        b.classList.remove('bg-rose-600', 'text-white', 'shadow-lg');
        b.classList.add('text-rose-300', 'hover:bg-rose-950/60');
      });
      btn.classList.add('bg-rose-600', 'text-white', 'shadow-lg');
      btn.classList.remove('text-rose-300', 'hover:bg-rose-950/60');

      AppState.currentPoemFilter = btn.getAttribute('data-category');
      renderPoems();
    });
  });

  // Poem Search Input
  const searchInput = document.getElementById('poem-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.poemSearchQuery = e.target.value;
      renderPoems();
    });
  }

  // Gallery Filter Tabs
  document.querySelectorAll('.gallery-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gallery-tab-btn').forEach(b => {
        b.classList.remove('bg-rose-600', 'text-white', 'shadow-lg');
        b.classList.add('text-rose-300', 'hover:bg-rose-950/60');
      });
      btn.classList.add('bg-rose-600', 'text-white', 'shadow-lg');
      btn.classList.remove('text-rose-300', 'hover:bg-rose-950/60');

      AppState.currentGalleryFilter = btn.getAttribute('data-category');
      renderGallery();
    });
  });

  // Contact / Secret Note Form
  setupContactForm();

  // CMS Forms
  const poemForm = document.getElementById('cms-poem-form');
  if (poemForm) poemForm.addEventListener('submit', handlePoemFormSubmit);

  const galleryForm = document.getElementById('cms-gallery-form');
  if (galleryForm) galleryForm.addEventListener('submit', handleGalleryFormSubmit);

  const metaForm = document.getElementById('cms-meta-form');
  if (metaForm) metaForm.addEventListener('submit', handleMetaFormSubmit);

  // Keyboard navigation for Lightbox
  window.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('gallery-lightbox');
    if (lightbox && !lightbox.classList.contains('hidden')) {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') stepLightbox(1);
      if (e.key === 'ArrowLeft') stepLightbox(-1);
    }
  });

  // Navbar scroll background
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('glass-nav', 'shadow-xl');
      navbar.classList.remove('bg-transparent');
    } else {
      navbar.classList.remove('glass-nav', 'shadow-xl');
      navbar.classList.add('bg-transparent');
    }
  });

  // Back to Top button
  const bttBtn = document.getElementById('back-to-top');
  if (bttBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        bttBtn.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
      } else {
        bttBtn.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
      }
    });
    bttBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// ==========================================
// 11. TOAST NOTIFICATION UTILITY
// ==========================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-enter flex items-center gap-3 px-4 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl pointer-events-auto transition-all ${
    type === 'success' 
      ? 'bg-rose-950/90 text-rose-100 border-rose-500/40 shadow-rose-950/50' 
      : type === 'error'
      ? 'bg-red-950/90 text-red-100 border-red-500/40 shadow-red-950/50'
      : 'bg-zinc-900/90 text-zinc-100 border-zinc-700/50 shadow-black/50'
  }`;

  const iconName = type === 'success' ? 'check-circle-2' : type === 'error' ? 'alert-triangle' : 'info';
  const iconColor = type === 'success' ? 'text-rose-400' : type === 'error' ? 'text-red-400' : 'text-cyan-400';

  toast.innerHTML = `
    <i data-lucide="${iconName}" class="w-5 h-5 ${iconColor} shrink-0"></i>
    <span class="text-sm font-medium font-sans">${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-leave');
    setTimeout(() => toast.remove(), 350);
  }, 3800);
}
