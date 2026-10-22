/**
 * Rumi's Personal Portfolio & CMS - Pure Google Sheets Database Engine
 * Dedicated to Rumi (রুমি) & Yeasin Kabir (ইয়াছিন কবির)
 * Password: 3460
 * Live Backend: Google Apps Script Web App -> Google Sheets API
 */

const STORAGE_KEY = 'rumi_portfolio_sheet_v3';
const AUTH_PASSWORD = '3460';
const GOOGLE_SCRIPT_API_URL = 'https://script.google.com/macros/s/AKfycbzEAbrHF8agHIv-tagjI4PXwWDi5ZvnQq2AfwtoAK1xF9HuEQNH4kg-kDjEb8iTSAe7/exec';

/**
 * Converts a Google Drive share/view link to a direct CDN image URL.
 * Non-Drive URLs are returned unchanged.
 * @param {string} url - Raw URL input from the admin panel
 * @returns {string} - Direct image URL (lh3.googleusercontent.com for Drive links)
 */
function convertDriveLink(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  const driveRegex = /(?:https?:\/\/)?(?:drive|docs)\.google\.com\/(?:(?:file\/d\/|folders\/|d\/|open\?id=|uc\?id=)|(?:[^\/]+\/[^\/]+\/))([a-zA-Z0-9_-]{25,})/;
  const match = trimmed.match(driveRegex);
  if (match && match[1]) {
    return 'https://lh3.googleusercontent.com/d/' + match[1];
  }
  return trimmed;
}

// Pure empty initial data store - No hardcoded dummy content
const DEFAULT_PORTFOLIO_DATA = {
  meta: {
    wifeName: "রুমি",
    wifeEnglish: "Rumi",
    husbandName: "ইয়াছিন কবির",
    husbandEnglish: "Yeasin Kabir",
    marriageDate: "2026-10-08T00:00:00",
    tagline: "স্নিগ্ধ হৃদয়ের নিভৃত কথামালা, হিজাবের পবিত্র সুরভী ও লাল গোলাপের প্রণয়",
    heroBio: "একটি পর্দাবতী মনের কাব্যকানন। যেখানে লাল গোলাপের স্নিগ্ধতা আর শ্বেত পদ্মের শুভ্রতায় রচিত হয় জীবনের আধ্যাত্মিক সৌন্দর্য, অনুভূতির স্ফুরণ আর অর্ধাঙ্গ ইয়াছিন কবিরের প্রতি অফুরন্ত প্রেম।",
    featuredQuote: "তুমি আমার দ্বীনের অর্ধেক, আর জীবনের সেই সুরভিত লাল গোলাপ যার ভালোবাসায় জান্নাতের পথ সুগম হয়।",
    featuredQuoteAuthor: "— ইয়াছিন কবির (আমার প্রিয় অর্ধাঙ্গ)",
    heroAvatar: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    aboutText: "আসসালামু আলাইকুম। আমি রুমি। একজন সাধারণ পর্দানশীন মুসলিমাহ, যে লাল গোলাপের পাপড়িতে খুঁজে পায় ভালোবাসার পবিত্রতা আর পদ্মফুলের নির্জনতায় খুঁজে পায় আধ্যাত্মিক প্রশান্তি। কাব্য ও সাহিত্য আমার হৃদয়ের একান্ত অনুভূতি প্রকাশের মাধ্যম। আর আমার এই ছোট ভুবনের সবচেয়ে সুন্দর অধ্যায় আমার স্বামী ইয়াছিন কবির, যার হাত ধরে জান্নাত পর্যন্ত পথচলার অঙ্গীকার।"
  },
  poems: [],
  gallery: [],
  letters: [],
  notes: []
};

class PortfolioDataStore {
  constructor() {
    this.apiUrl = GOOGLE_SCRIPT_API_URL;
    this.syncStatus = 'idle'; // idle | syncing | synced | error
    this.lastSyncedAt = null;

    // Purge legacy storage keys that contained dummy data
    try {
      localStorage.removeItem('rumi_portfolio_cms_v1');
      localStorage.removeItem('rumi_portfolio_cms_v2');
    } catch (e) {}

    this.data = this.loadData();
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const meta = { ...DEFAULT_PORTFOLIO_DATA.meta, ...(parsed.meta || {}) };
        meta.husbandName = "ইয়াছিন কবির";
        meta.husbandEnglish = "Yeasin Kabir";
        meta.wifeName = "রুমি";
        meta.wifeEnglish = "Rumi";

        return {
          meta,
          poems: Array.isArray(parsed.poems) ? parsed.poems : [],
          gallery: Array.isArray(parsed.gallery) ? parsed.gallery : [],
          letters: Array.isArray(parsed.letters) ? parsed.letters : [],
          notes: Array.isArray(parsed.notes) ? parsed.notes : []
        };
      }
    } catch (e) {
      console.warn("Using empty defaults", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      window.dispatchEvent(new CustomEvent('rumi_data_updated', { detail: this.data }));
      return true;
    } catch (e) {
      console.error("Failed to save data to localStorage", e);
      return false;
    }
  }

  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_DATA));
    this.saveData();
    return this.data;
  }

  // ==========================================
  // PURE GOOGLE SHEETS LIVE DATA SYNC
  // ==========================================
  async syncWithGoogleSheet() {
    this.syncStatus = 'syncing';
    window.dispatchEvent(new CustomEvent('rumi_sync_status', { detail: { status: 'syncing' } }));

    try {
      // Concurrently fetch live Poems, Gallery, and Notes from Google Sheet API
      const [poemsRes, galleryRes, notesRes] = await Promise.all([
        fetch(`${this.apiUrl}?action=Poems`, { redirect: 'follow' }).then(r => r.json()).catch(() => null),
        fetch(`${this.apiUrl}?action=Gallery`, { redirect: 'follow' }).then(r => r.json()).catch(() => null),
        fetch(`${this.apiUrl}?action=Notes`, { redirect: 'follow' }).then(r => r.json()).catch(() => null)
      ]);

      // 1. Live Poems from Google Sheet (Only valid poems retrieved from sheet)
      if (Array.isArray(poemsRes)) {
        const validSheetPoems = poemsRes.filter(p => p && p.title && String(p.title).trim() !== '');
        this.data.poems = validSheetPoems.map(p => ({
          id: p.id || ('poem-' + Date.now() + Math.random().toString(36).substr(2, 4)),
          title: String(p.title || '').trim(),
          category: p.category || 'prem',
          categoryLabel: p.categoryLabel || this.getCategoryLabel(p.category),
          date: p.date || new Date().toISOString().split('T')[0],
          readTime: p.readTime || '২ মিনিট',
          excerpt: p.excerpt || (p.content ? String(p.content).slice(0, 80) + '...' : ''),
          content: p.content || '',
          likes: parseInt(p.likes, 10) || 0,
          pinned: !!p.pinned
        }));
      }

      // 2. Live Gallery from Google Sheet (Only valid images retrieved from sheet)
      if (Array.isArray(galleryRes)) {
        const validSheetGallery = galleryRes.filter(g => g && g.url && String(g.url).trim().startsWith('http'));
        this.data.gallery = validSheetGallery.map(g => ({
          id: g.id || ('gal-' + Date.now() + Math.random().toString(36).substr(2, 4)),
          url: String(g.url).trim(),
          caption: g.caption || 'ফুলের স্নিগ্ধ স্মৃতি',
          category: g.category || 'roses',
          categoryLabel: g.categoryLabel || this.getGalleryCategoryLabel(g.category),
          date: g.date || new Date().toISOString().split('T')[0],
          likes: parseInt(g.likes, 10) || 0
        }));
      }

      // 3. Live Notes from Google Sheet (Only valid notes retrieved from sheet)
      if (Array.isArray(notesRes)) {
        const validSheetNotes = notesRes.filter(n => n && ((n.message && String(n.message).trim() !== '') || (n.subject && String(n.subject).trim() !== '')));
        this.data.notes = validSheetNotes.map(n => ({
          id: n.id || ('note-' + Date.now() + Math.random().toString(36).substr(2, 4)),
          sender: n.sender || 'ইয়াছিন কবির (Husband)',
          category: n.category || 'ভালোবাসা',
          subject: n.subject || 'একটি হৃদয়ের চিঠি',
          message: n.message || '',
          date: n.date || new Date().toLocaleString('bn-BD'),
          isRead: true
        }));
      }

      // Letters remain pure empty unless provided via future sheet
      this.data.letters = [];

      this.syncStatus = 'synced';
      this.lastSyncedAt = new Date();
      this.saveData();

      window.dispatchEvent(new CustomEvent('rumi_sync_status', { 
        detail: { status: 'synced', time: this.lastSyncedAt } 
      }));

      return { success: true, count: { poems: this.data.poems.length, gallery: this.data.gallery.length, notes: this.data.notes.length } };
    } catch (err) {
      console.warn("Google Sheet sync error:", err);
      this.syncStatus = 'error';
      window.dispatchEvent(new CustomEvent('rumi_sync_status', { detail: { status: 'error', error: err.message } }));
      return { success: false, error: err.message };
    }
  }

  // ==========================================
  // HTTP POST TO GOOGLE APPS SCRIPT API
  // ==========================================
  async postToGoogleSheet(payload) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });

      if (!response.ok) {
        return { success: false, error: `Google Apps Script returned HTTP ${response.status}` };
      }

      let result;
      try {
        result = await response.json();
      } catch (e) {
        return { success: false, error: 'Google Apps Script returned an invalid JSON response' };
      }

      if (result && (result.status === 'error' || result.success === false)) {
        return { success: false, error: result.message || result.error || 'Google Apps Script rejected the request' };
      }

      return { success: true, result };
    } catch (e) {
      console.error("Error posting to Google Apps Script:", e);
      return { success: false, error: e.message };
    }
  }

  // Meta & Hero
  getMeta() {
    return this.data.meta;
  }

  updateMeta(newMeta) {
    this.data.meta = { ...this.data.meta, ...newMeta };
    this.saveData();
    return this.data.meta;
  }

  // Poems
  getPoems(category = 'all', searchQuery = '') {
    let list = [...this.data.poems];
    if (category && category !== 'all') {
      list = list.filter(p => p.category === category);
    }
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.excerpt && p.excerpt.toLowerCase().includes(q)) ||
        (p.content && p.content.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getPoemById(id) {
    return this.data.poems.find(p => p.id === id);
  }

  async addPoem(poemData) {
    const newPoem = {
      id: 'poem-' + Date.now(),
      title: poemData.title || "শিরোনামহীন কবিতা",
      category: poemData.category || "prem",
      categoryLabel: poemData.categoryLabel || this.getCategoryLabel(poemData.category),
      date: poemData.date || new Date().toISOString().split('T')[0],
      readTime: poemData.readTime || "২ মিনিট",
      excerpt: poemData.excerpt || (poemData.content ? poemData.content.slice(0, 80) + '...' : ''),
      content: poemData.content || "",
      likes: 0,
      pinned: !!poemData.pinned
    };

    // Instant local reflection
    this.data.poems.unshift(newPoem);
    this.saveData();

    // Append as a new row in Google Sheets
    const postPayload = {
      action: 'Poems',
      id: newPoem.id,
      title: newPoem.title,
      category: newPoem.category,
      categoryLabel: newPoem.categoryLabel,
      date: newPoem.date,
      readTime: newPoem.readTime,
      excerpt: newPoem.excerpt,
      content: newPoem.content,
      likes: 0
    };

    const sheetResult = await this.postToGoogleSheet(postPayload);
    return { poem: newPoem, sheetResult };
  }

  updatePoem(id, updatedFields) {
    const index = this.data.poems.findIndex(p => p.id === id);
    if (index !== -1) {
      if (updatedFields.category && !updatedFields.categoryLabel) {
        updatedFields.categoryLabel = this.getCategoryLabel(updatedFields.category);
      }
      this.data.poems[index] = { ...this.data.poems[index], ...updatedFields };
      this.saveData();
      return this.data.poems[index];
    }
    return null;
  }

  async deletePoem(id) {
    const beforeCount = this.data.poems.length;
    this.data.poems = this.data.poems.filter(p => p.id !== id);
    const deleted = this.data.poems.length !== beforeCount;
    if (!deleted) {
      return { deleted: false, sheetResult: null };
    }

    this.saveData();
    const sheetResult = await this.postToGoogleSheet({ action: 'deletePoem', id });
    return { deleted: true, sheetResult };
  }

  likePoem(id) {
    const poem = this.getPoemById(id);
    if (poem) {
      poem.likes = (poem.likes || 0) + 1;
      this.saveData();
      return poem.likes;
    }
    return 0;
  }

  getCategoryLabel(catKey) {
    const map = {
      'prem': 'প্রেম ও অর্ধাঙ্গ',
      'prokriti': 'স্নিগ্ধ প্রকৃতি',
      'onukobita': 'অনুকবিতা',
      'jibon': 'জীবন ও আত্মা'
    };
    return map[catKey] || 'কাব্যকথা';
  }

  // Gallery
  getGallery(category = 'all') {
    if (category && category !== 'all') {
      return this.data.gallery.filter(item => item.category === category);
    }
    return this.data.gallery;
  }

  getGalleryItemById(id) {
    return this.data.gallery.find(item => item.id === id);
  }

  async addGalleryItem(itemData) {
    // Auto-convert Google Drive share links to direct CDN URLs
    const resolvedUrl = convertDriveLink(itemData.url) || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80";
    const newItem = {
      id: 'gal-' + Date.now(),
      url: resolvedUrl,
      caption: itemData.caption || "ফুলের স্নিগ্ধ স্মৃতি",
      category: itemData.category || "roses",
      categoryLabel: this.getGalleryCategoryLabel(itemData.category),
      date: itemData.date || new Date().toISOString().split('T')[0],
      likes: 0
    };

    // Instant local reflection
    this.data.gallery.unshift(newItem);
    this.saveData();

    // Append row to Google Sheets
    const postPayload = {
      action: 'Gallery',
      id: newItem.id,
      url: newItem.url,
      caption: newItem.caption,
      category: newItem.category,
      categoryLabel: newItem.categoryLabel,
      date: newItem.date,
      likes: 0
    };

    const sheetResult = await this.postToGoogleSheet(postPayload);
    return { item: newItem, sheetResult };
  }

  updateGalleryItem(id, updatedFields) {
    const index = this.data.gallery.findIndex(g => g.id === id);
    if (index !== -1) {
      if (updatedFields.category && !updatedFields.categoryLabel) {
        updatedFields.categoryLabel = this.getGalleryCategoryLabel(updatedFields.category);
      }
      this.data.gallery[index] = { ...this.data.gallery[index], ...updatedFields };
      this.saveData();
      return this.data.gallery[index];
    }
    return null;
  }

  async deleteGalleryItem(id) {
    const beforeCount = this.data.gallery.length;
    this.data.gallery = this.data.gallery.filter(g => g.id !== id);
    const deleted = this.data.gallery.length !== beforeCount;
    if (!deleted) {
      return { deleted: false, sheetResult: null };
    }

    this.saveData();
    const sheetResult = await this.postToGoogleSheet({ action: 'deleteGallery', id });
    return { deleted: true, sheetResult };
  }

  likeGalleryItem(id) {
    const item = this.getGalleryItemById(id);
    if (item) {
      item.likes = (item.likes || 0) + 1;
      this.saveData();
      return item.likes;
    }
    return 0;
  }

  getGalleryCategoryLabel(catKey) {
    const map = {
      'roses': 'লাল গোলাপ',
      'lotus': 'পদ্ম কানন',
      'memories': 'স্মৃতি ও অনুভূতি',
      'nature': 'স্নিগ্ধ প্রকৃতি'
    };
    return map[catKey] || 'ফুল ও স্মৃতি';
  }

  // Letters
  getLetters() {
    return this.data.letters || [];
  }

  getLetterById(id) {
    return (this.data.letters || []).find(l => l.id === id);
  }

  // Notes
  getNotes() {
    return this.data.notes || [];
  }

  async addNote(noteData) {
    const newNote = {
      id: 'note-' + Date.now(),
      sender: noteData.sender || 'তোমার ইয়াছিন কবির (Husband)',
      category: noteData.category || 'ভালোবাসা',
      subject: noteData.subject || 'একটি হৃদয়ের চিঠি',
      message: noteData.message || '',
      date: new Date().toLocaleString('bn-BD', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      isRead: false
    };

    if (!this.data.notes) this.data.notes = [];
    this.data.notes.unshift(newNote);
    this.saveData();

    // Append row to Google Sheets
    const postPayload = {
      action: 'Notes',
      id: newNote.id,
      sender: newNote.sender,
      category: newNote.category,
      subject: newNote.subject,
      message: newNote.message,
      date: newNote.date
    };

    const sheetResult = await this.postToGoogleSheet(postPayload);
    return { note: newNote, sheetResult };
  }

  deleteNote(id) {
    if (!this.data.notes) return false;
    this.data.notes = this.data.notes.filter(n => n.id !== id);
    this.saveData();
    return true;
  }

  markNoteRead(id) {
    if (!this.data.notes) return;
    const note = this.data.notes.find(n => n.id === id);
    if (note) {
      note.isRead = true;
      this.saveData();
    }
  }

  // Export / Import
  exportDataJSON() {
    return JSON.stringify(this.data, null, 2);
  }

  importDataJSON(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.meta && Array.isArray(parsed.poems)) {
        this.data = parsed;
        this.saveData();
        return true;
      }
    } catch (e) {
      console.error("Invalid JSON format for import", e);
    }
    return false;
  }
}

// Global Singleton Instance
window.PortfolioStore = new PortfolioDataStore();
