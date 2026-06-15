# 🍺 18Beers

A social bar check-in app inspired by 18Birdies — but for beer lovers. Check in at bars, log your beers, see what friends are drinking, and discover nearby spots with live happy hour deals and to-go cocktail availability — all filtered by **real state liquor laws**.

---

## ✨ Features

- **Social Feed** — See beer check-ins from friends with ratings, notes, and bar locations
- **Real GPS Location** — Detects your state automatically via browser geolocation
- **State Liquor Law Engine** — All 50 states mapped with:
  - 🍻 Happy hour legality
  - 🥡 To-go cocktail status (permanent / temporary / banned)
  - 🛵 Third-party delivery availability
- **Nearby Bars** — Discover bars close to you with live check-in counts and happy hour deals
- **Check-In Modal** — Log a beer, rate it, tag the bar, and optionally mark it as to-go
- **Profile & Badges** — Track beers logged, bars visited, and earn achievements

---

## 🗺️ Google Maps Integration (optional)

The app is built to support a Google Maps + Places API layer for real bar suggestions and per-bar post feeds. To enable:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project and enable:
   - **Maps JavaScript API**
   - **Places API**
3. Create an API key under **Credentials**
4. Add it to your `.env` file (see below)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm or yarn

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/18beers.git
cd 18beers

# 2. Install dependencies
npm install

# 3. (Optional) Add your Google Maps API key
cp .env.example .env
# Then edit .env and add: VITE_GOOGLE_MAPS_KEY=your_key_here

# 4. Start the dev server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🏗️ Project Structure

```
18beers/
├── src/
│   ├── App.jsx          # Root app with tab navigation & GPS logic
│   ├── components/
│   │   ├── FeedCard.jsx       # Social post card with law badges
│   │   ├── CheckInModal.jsx   # Beer check-in form (state-aware)
│   │   ├── NearbyTab.jsx      # Bar discovery with happy hour info
│   │   ├── ProfileTab.jsx     # User stats and badges
│   │   ├── LocationBanner.jsx # GPS status + state law summary
│   │   ├── StatePickerModal.jsx # Manual state selector
│   │   └── LawBadges.jsx      # Happy hour / to-go / delivery badges
│   ├── data/
│   │   ├── stateLaws.js       # All 50-state liquor law database
│   │   └── mockData.js        # Sample feed posts and nearby bars
│   └── utils/
│       └── geocode.js         # Reverse geocode lat/lng → state via OpenStreetMap
├── .env.example
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 🌐 State Liquor Law Data

The app includes a hand-researched database of liquor laws across all 50 US states and DC, sourced from:

- [Distilled Spirits Council (DISCUS)](https://distilledspirits.org)
- [Avalara State Alcohol Delivery Tracker](https://www.avalara.com)
- State alcohol control board websites

| Feature | States |
|---|---|
| Happy hour **banned** | AK, IN, MA, NC, OK, RI, UT, VT |
| To-go cocktails **permanent** | AZ, AR, CO, DE, FL, GA, IA, KY, LA, ME, MI, MO, MT, NE, OH, OK, OR, RI, TX, VA, WA, WV, WI, DC |
| To-go cocktails **temporary** | CA (thru 2026), IL (thru 2028), NJ (TBD), NY (thru 2030) |
| Third-party delivery **allowed** | AZ, AR, CA, CO, DE, FL, GA, IA, IL, KY, LA, MI, MO, MT, NE, NJ, NY, OH, OR, RI, TX, VA, WA, WV, WI, DC |

> ⚠️ Laws change frequently. Always verify with your state's alcohol control board before relying on this data for business purposes.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite |
| Styling | Inline styles (design token system) |
| Geocoding | OpenStreetMap Nominatim (free, no key needed) |
| Maps (optional) | Google Maps JavaScript API + Places API |

---

## 📦 Adding Google Maps

Once you have a Maps API key, update `src/components/NearbyTab.jsx` to replace the mock bar data with live Places API results:

```js
// Example Places API call (add to NearbyTab.jsx)
const map = new google.maps.Map(mapRef.current, {
  center: { lat, lng },
  zoom: 14,
});
const service = new google.maps.places.PlacesService(map);
service.nearbySearch({
  location: { lat, lng },
  radius: 1000,
  type: "bar",
}, (results, status) => {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    setBars(results);
  }
});
```

---

## 🤝 Contributing

Pull requests welcome! For major changes, open an issue first.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT — do whatever you want, just don't blame us if you drink too many.

---

*Built with Claude · Inspired by 18Birdies · Powered by beer 🍺*
