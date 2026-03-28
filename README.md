# 🔬 EchoDiatome

Personal research website for documenting freshwater diatom field observations, species atlas, and publications. Runs on **GitHub Pages** — no server needed.

---

## 📁 File Structure

```
diatom-site/
├── index.html              ← Main public site
├── css/style.css
├── js/main.js
├── data/
│   ├── observations.json   ← Field observations (edit to add entries)
│   ├── species.json        ← Species atlas
│   ├── publications.json   ← Publications list
│   └── config.json         ← Site settings (name, GitHub, email)
├── images/
│   ├── gallery/            ← Observation photos
│   └── species/            ← Species thumbnails
└── admin/
    ├── index.html          ← Admin panel (password protected)
    ├── style.css
    └── admin.js
```

---

## 🚀 Setup on GitHub Pages

1. Create a new GitHub repository (e.g. `diatom-research`)
2. Upload all files from this folder
3. Go to **Settings → Pages → Source: Deploy from branch → main / root**
4. Your site will be at: `https://yourusername.github.io/diatom-research/`

---

## 🔐 Setting the Admin Password

The admin panel is at `/admin/` — **only you know this URL** and it's password protected.

To set your password:

1. Go to: https://emn178.github.io/online-tools/sha256.html
2. Type your desired password → copy the SHA-256 hash
3. Open `admin/admin.js`
4. Replace the `PASSWORD_HASH` value with your hash:
   ```js
   const PASSWORD_HASH = 'your-sha256-hash-here';
   ```
5. Push to GitHub

> ⚠️ This is client-side security — sufficient for a personal site with a private URL, but don't use it to protect truly sensitive data.

---

## ➕ Adding Content (with Admin Panel)

1. Go to `https://yourusername.github.io/diatom-research/admin/`
2. Enter your password
3. Fill in the form (Observation / Species / Publication tabs)
4. Click **Generate JSON** → **Download**
5. Replace the file in `data/` on GitHub (via web editor or git push)

### Adding Images

Upload images to:
- `images/gallery/` — for observation photos (name them `obs-XXX-1.jpg` etc.)
- `images/species/` — for species thumbnails (name them `genus-species.jpg`)

Then reference them in the admin form using the relative path, e.g.:
`images/gallery/obs-003-1.jpg`

---

## ⚙️ Customizing

Edit `data/config.json`:
```json
{
  "siteName": "Your Name",
  "ownerName": "Your Name",
  "tagline": "Your tagline",
  "about": "About text",
  "github": "your-github-username"
}
```

---

## 🗺️ Map

The map uses **Leaflet** with **CartoDB dark tiles** — no API key needed. Observation coordinates are loaded from `observations.json`.

---

## 📊 Data Format Reference

### Observation entry
```json
{
  "id": "obs-003",
  "date": "2025-05-10",
  "location": {
    "name": "Lake name, area",
    "lat": 47.12,
    "lng": 18.34,
    "habitat": "Littoral zone"
  },
  "species": [
    { "name": "Cyclotella meneghiniana", "count": "abundant", "notes": "optional" }
  ],
  "images": ["images/gallery/obs-003-1.jpg"],
  "waterParams": { "pH": 7.9, "conductivity": 540, "temperature": 19.2 },
  "notes": "Field notes here.",
  "published": true
}
```

### Species entry
```json
{
  "id": "sp-004",
  "name": "Navicula lanceolata",
  "author": "Ehrenberg, 1838",
  "family": "Naviculaceae",
  "ecology": {
    "salinity": "freshwater",
    "pH": "circumneutral",
    "saprobity": "β-mesosaprobic",
    "trophicState": "mesotrophic"
  },
  "wfrf": 3.1,
  "description": "Description here.",
  "thumbnail": "images/species/navicula-lanceolata.jpg",
  "observedLocations": ["obs-001"]
}
```

---

## 🔗 Linking to the Atlas Site

If you want this to connect to your existing Atlas site at `bendi132.github.io/Atlas_diatom`, you can add a link in the navigation in `index.html`:

```html
<a href="https://bendi132.github.io/Atlas_diatom" target="_blank">WFRF Atlas</a>
```
