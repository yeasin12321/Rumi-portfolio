# রুমি • Rumi — Personal Floral Portfolio & Google Sheet Live CMS

A world-class, ultra-aesthetic, full-featured Personal Portfolio and Content Management System (CMS) custom-crafted for **Rumi (রুমি)** and her husband **Yeasin Kabir (ইয়াছিন কবির)**.

Theme & Aesthetics: Modest Muslim mind, Hijabi & Niqabi grace, profound adoration for Red Roses (লাল গোলাপ) and Lotus blossoms (পদ্মফুল), soft romantic floral pastel aesthetic with modern glassmorphism, floating rose petal physics, and full real-time Google Sheets Cloud API integration.

Married Date: **October 8, 2026**.

---

## ☁️ Live Google Sheets Cloud Backend API

- **Google Apps Script Web App URL**:
  `https://script.google.com/macros/s/AKfycbzEAbrHF8agHIv-tagjI4PXwWDi5ZvnQq2AfwtoAK1xF9HuEQNH4kg-kDjEb8iTSAe7/exec`

### Data Sync Engine & Architecture:
1. **Dynamic Real-time Fetch**:
   - On page load, dynamically fetches from Google Sheets using `fetch()`:
     - `?action=Poems` -> Loads all poems directly from the **Poems** sheet.
     - `?action=Gallery` -> Loads all flower photos from the **Gallery** sheet.
     - `?action=Notes` -> Loads all secret letters and messages from the **Notes** sheet.
   - Merges cloud data into the live UI and caches in `localStorage` for instant load and offline resilience.
2. **Direct Row Appending via HTTP POST**:
   - When Admin adds a Poem or Photo, or when Yeasin submits a Secret Note:
     - Sends an HTTP POST request to the Web App URL with payload `{ action: 'Poems' | 'Gallery' | 'Notes', ... }`.
     - Data is directly appended as a new row in Google Sheets in real-time.
     - Animated toast notifications indicate loading and success status.
3. **Synchronized Deletions**:
   - Deleting a poem or gallery photo removes it from the local cache immediately and sends `{ action: 'deletePoem' | 'deleteGallery', id }` to the Web App to delete its matching sheet row.
   - The CMS reports whether the Google Sheets deletion succeeded.
4. **Manual 1-Click Sync**:
   - Admin CMS contains a *"শিট সিঙ্ক (Sync Now)"* button to manually re-fetch and sync the latest Google Sheet data on demand.

---

## 🌹 Core Features

### 1. Public Portfolio View (পাঠক ও দর্শকদের জন্য)
- **Hero Section & Live Marriage Counter**:
  - Heartfelt greeting dedicated to **রুমি** and **ইয়াছিন কবির** with Islamic blessing badges (*"বিসমিল্লাহির রাহমানির রাহীম"*).
  - **Live Marriage Counter ("Together Since Oct 8, 2026")**: Dynamic real-time timer counting elapsed **Days (দিন), Hours (ঘণ্টা), Minutes (মিনিট), and Seconds (সেকেন্ড)**.
  - **Featured Love Quote & Stanza Card**: Displays dynamic love quotes dedicated by ইয়াছিন কবির.
- **Falling Rose & Lotus Petals Canvas Engine**:
  - High-performance HTML5 Canvas physics engine dropping delicate Red Rose Petals, Pink Lotus Petals, and dewdrops.
  - Interactive toggle button in the navbar to pause or resume petal drift at any time.
- **Rumi's World & Soul (রুমির ভুবন ও আত্মকথা)**:
  - Pillars of her identity: Hijab & Niqab dignity, Red Rose passion, Lotus tranquility, and spiritual companionship with ইয়াছিন কবির.
- **Interactive Poem & Writing Reader (রুমির সাহিত্য কানন)**:
  - Category filters: **প্রেম ও অর্ধাঙ্গ**, **স্নিগ্ধ প্রকৃতি**, **অনুকবিতা**, and **জীবন ও আত্মা**.
  - Instant live search bar filtering across poem titles and stanzas.
  - Full reading modal with 4 themes: Rose Quartz, Parchment, Night Lotus, and Pure Ivory, plus font size adjusters and one-click copy.
- **Floral Photo & Art Gallery (পুষ্প কানন ও স্মৃতিমালা)**:
  - High-resolution photography with category filters and full-screen Lightbox with keyboard navigation.
- **Open-When Digital Letter Envelopes (যখন মনে পড়বে... ডিজিটাল খাম)**:
  - 3D interactive envelopes with wax seal opening animation and heartfelt letters.
- **Husband's Secret Note Box (ইয়াছিন কবিরের গোপন চিঠি ও বার্তা বক্স)**:
  - Direct form to send love notes and prayers that save straight into Google Sheets and Admin Inbox.

---

### 2. Admin Panel & CMS System (সম্পূর্ণ এডিটেবল সিএমএস)
- **Password**: `3460`
- **Dashboard Tabs**:
  1. **ওভারভিউ (Overview)**: Summary metrics, Google Sheets live connection status, and manual sync action.
  2. **কবিতা ব্যবস্থাপনা (Manage Poems)**: Add/Edit/Delete poems with live preview and Google Sheets sync.
  3. **গ্যালারি ব্যবস্থাপনা (Manage Gallery)**: Add new photo URLs (with 1-click preset flower buttons) and delete photos.
  4. **হোমপেজ টেক্সট ও উক্তি আপডেট (Hero & Quotes CMS)**: Edit Wife/Husband names, marriage date, tagline, hero bio, featured love quote, and about text.
  5. **প্রাপ্ত গোপন চিঠি (Secret Notes Inbox)**: Read all letters and notes received from the secret note box with mood tags and timestamps.
  6. **ব্যাকআপ ও রিসেট (Backup & Reset)**: Export full site data as a JSON file, import backups, or reset to initial default state.

---

## 📁 File Structure

```text
modern-portfolio/
├── index.html          # Main HTML5 application structure with Tailwind CSS, Lucide icons & live sync indicator
├── css/
│   └── style.css       # Custom styles: romantic glassmorphism, wax seals, reader themes, glows
├── js/
│   ├── projects.js     # Data store class, Google Sheet API engine (?action=Poems, Gallery, Notes), local cache
│   └── main.js         # Reactive app logic, petal particle engine, marriage counter, modals, Google Sheet POST handlers
└── README.md           # Documentation & instructions
```

---

## 🔐 Credentials & Names

- **Admin CMS Password**: `3460`
- **Husband**: ইয়াছিন কবির (Yeasin Kabir)
- **Wife**: রুমি (Rumi)
- **Married Date**: October 8, 2026
- **Live Local Server**: `http://localhost:3000`
