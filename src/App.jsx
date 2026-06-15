import { useState, useEffect, useCallback } from "react";

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg:       "#111009",
  card:     "#1C1810",
  border:   "#2C2618",
  amber:    "#E8A020",
  amberLt:  "#F5C842",
  cream:    "#F0E8D4",
  muted:    "#7A6E60",
  green:    "#4CAF6E",
  red:      "#E05050",
  blue:     "#4A9EE0",
};

// ── State liquor law database (sourced from DISCUS + state alcohol boards) ──
// happyHour: true = allowed, false = banned
// toGo: "permanent" | "temporary" | false
// delivery: true = third-party delivery allowed
const STATE_LAWS = {
  AL: { name:"Alabama",        happyHour:true,  toGo:false,       delivery:false },
  AK: { name:"Alaska",         happyHour:false, toGo:false,       delivery:false },
  AZ: { name:"Arizona",        happyHour:true,  toGo:"permanent", delivery:true  },
  AR: { name:"Arkansas",       happyHour:true,  toGo:"permanent", delivery:true  },
  CA: { name:"California",     happyHour:true,  toGo:"temporary", delivery:true  },
  CO: { name:"Colorado",       happyHour:true,  toGo:"permanent", delivery:true  },
  CT: { name:"Connecticut",    happyHour:true,  toGo:false,       delivery:false },
  DE: { name:"Delaware",       happyHour:true,  toGo:"permanent", delivery:true  },
  FL: { name:"Florida",        happyHour:true,  toGo:"permanent", delivery:true  },
  GA: { name:"Georgia",        happyHour:true,  toGo:"permanent", delivery:true  },
  HI: { name:"Hawaii",         happyHour:true,  toGo:false,       delivery:false },
  ID: { name:"Idaho",          happyHour:true,  toGo:false,       delivery:false },
  IL: { name:"Illinois",       happyHour:true,  toGo:"temporary", delivery:true  },
  IN: { name:"Indiana",        happyHour:false, toGo:false,       delivery:false },
  IA: { name:"Iowa",           happyHour:true,  toGo:"permanent", delivery:true  },
  KS: { name:"Kansas",         happyHour:true,  toGo:false,       delivery:false },
  KY: { name:"Kentucky",       happyHour:true,  toGo:"permanent", delivery:true  },
  LA: { name:"Louisiana",      happyHour:true,  toGo:"permanent", delivery:true  },
  ME: { name:"Maine",          happyHour:true,  toGo:"permanent", delivery:false },
  MD: { name:"Maryland",       happyHour:true,  toGo:false,       delivery:false },
  MA: { name:"Massachusetts",  happyHour:false, toGo:false,       delivery:false },
  MI: { name:"Michigan",       happyHour:true,  toGo:"permanent", delivery:true  },
  MN: { name:"Minnesota",      happyHour:true,  toGo:false,       delivery:false },
  MS: { name:"Mississippi",    happyHour:true,  toGo:false,       delivery:false },
  MO: { name:"Missouri",       happyHour:true,  toGo:"permanent", delivery:true  },
  MT: { name:"Montana",        happyHour:true,  toGo:"permanent", delivery:true  },
  NE: { name:"Nebraska",       happyHour:true,  toGo:"permanent", delivery:true  },
  NV: { name:"Nevada",         happyHour:true,  toGo:false,       delivery:false },
  NH: { name:"New Hampshire",  happyHour:true,  toGo:false,       delivery:false },
  NJ: { name:"New Jersey",     happyHour:true,  toGo:"temporary", delivery:true  },
  NM: { name:"New Mexico",     happyHour:true,  toGo:false,       delivery:false },
  NY: { name:"New York",       happyHour:true,  toGo:"temporary", delivery:true  },
  NC: { name:"North Carolina", happyHour:false, toGo:false,       delivery:false },
  ND: { name:"North Dakota",   happyHour:true,  toGo:false,       delivery:false },
  OH: { name:"Ohio",           happyHour:true,  toGo:"permanent", delivery:true  },
  OK: { name:"Oklahoma",       happyHour:true,  toGo:"permanent", delivery:false },
  OR: { name:"Oregon",         happyHour:true,  toGo:"permanent", delivery:true  },
  PA: { name:"Pennsylvania",   happyHour:true,  toGo:false,       delivery:false },
  RI: { name:"Rhode Island",   happyHour:false, toGo:"permanent", delivery:true  },
  SC: { name:"South Carolina", happyHour:true,  toGo:false,       delivery:false },
  SD: { name:"South Dakota",   happyHour:true,  toGo:false,       delivery:false },
  TN: { name:"Tennessee",      happyHour:true,  toGo:false,       delivery:false },
  TX: { name:"Texas",          happyHour:true,  toGo:"permanent", delivery:true  },
  UT: { name:"Utah",           happyHour:false, toGo:false,       delivery:false },
  VT: { name:"Vermont",        happyHour:false, toGo:false,       delivery:false },
  VA: { name:"Virginia",       happyHour:true,  toGo:"permanent", delivery:true  },
  WA: { name:"Washington",     happyHour:true,  toGo:"permanent", delivery:true  },
  WV: { name:"West Virginia",  happyHour:true,  toGo:"permanent", delivery:true  },
  WI: { name:"Wisconsin",      happyHour:true,  toGo:"permanent", delivery:true  },
  WY: { name:"Wyoming",        happyHour:true,  toGo:false,       delivery:false },
  DC: { name:"Washington DC",  happyHour:true,  toGo:"permanent", delivery:true  },
};

const US_STATES = Object.entries(STATE_LAWS).map(([k,v])=>({ code:k, name:v.name }));

// Reverse geocode lat/lng → state code via nominatim
async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const d = await r.json();
    const stateCode = d?.address?.["ISO3166-2-lvl4"]?.replace("US-","") || null;
    return { city: d?.address?.city || d?.address?.town || d?.address?.county || "", state: stateCode };
  } catch { return null; }
}

// ── Mock data ───────────────────────────────────────────────────────────────
const MOCK_FEED = [
  { id:1, user:"Jake M.", handle:"@jakemac", avatar:"🧔", beer:"Goose Island IPA", rating:4, bar:"The Rusty Anchor", state:"IL", city:"Chicago", note:"Perfect pour, super chill vibes tonight 🍺", time:"8 min ago", likes:14, comments:3 },
  { id:2, user:"Sara K.", handle:"@saraK",  avatar:"👩‍🦱", beer:"Modelo Especial",  rating:5, bar:"Lola's Cantina",   state:"TX", city:"Austin",  note:"Happy hour til 7! $3 Modelos, can't beat it.", time:"22 min ago", likes:31, comments:7 },
  { id:3, user:"Derek P.", handle:"@dp_taps", avatar:"🧑", beer:"Guinness Stout", rating:5, bar:"O'Malley's Pub", state:"MA", city:"Boston", note:"Best Guinness outside Dublin. No debate.", time:"1 hr ago", likes:58, comments:12 },
  { id:4, user:"Mia R.", handle:"@miabrew", avatar:"👩", beer:"Blue Moon", rating:3, bar:"Rooftop 21", state:"TN", city:"Nashville", note:"Decent beer, incredible view. Worth it.", time:"2 hr ago", likes:22, comments:4 },
  { id:5, user:"Carlos V.", handle:"@cvegasdrinks", avatar:"🧑‍🦱", beer:"Dogfish Head 60 Min", rating:5, bar:"Craft & Draft", state:"CO", city:"Denver", note:"Ordered this to go on the walk home. Love Colorado 🍺", time:"3 hr ago", likes:19, comments:2 },
];

const NEARBY_BARS = [
  { id:1, name:"The Rusty Anchor", distance:"0.2 mi", checkins:34, top:"Goose Island IPA", vibe:"Dive Bar", happyHour:"4–7 PM", deals:["$3 domestics","Half-off apps"] },
  { id:2, name:"Craft & Draft",    distance:"0.5 mi", checkins:61, top:"Dogfish Head 60 Min", vibe:"Craft Beer", happyHour:"5–8 PM", deals:["$2 off all drafts"] },
  { id:3, name:"O'Malley's Pub",   distance:"0.8 mi", checkins:88, top:"Guinness Stout", vibe:"Irish Pub", happyHour:"4–6 PM", deals:["$4 Guinness","$5 well drinks"] },
  { id:4, name:"Lola's Cantina",   distance:"1.1 mi", checkins:27, top:"Modelo Especial", vibe:"Mexican Bar", happyHour:"3–7 PM", deals:["$3 Modelo","$6 margaritas"] },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function Star({ filled }) {
  return <span style={{ color: filled ? C.amber : "#3A3228", fontSize:18 }}>★</span>;
}
function StarRow({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:2 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onClick={() => onChange?.(n)}
          style={{ cursor: onChange?"pointer":"default", fontSize:20, color: n<=value?C.amber:"#3A3228" }}>★</span>
      ))}
    </div>
  );
}

function Badge({ icon, label, sub, color=C.amber }) {
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:5,
      background:"#1A1510", border:`1px solid ${color}44`,
      borderRadius:20, padding:"5px 10px" }}>
      <span style={{ fontSize:14 }}>{icon}</span>
      <div>
        <div style={{ color, fontSize:11, fontWeight:700 }}>{label}</div>
        {sub && <div style={{ color:C.muted, fontSize:10 }}>{sub}</div>}
      </div>
    </div>
  );
}

function LawBadges({ laws }) {
  if (!laws) return null;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
      {laws.happyHour
        ? <Badge icon="🍻" label="Happy Hour OK"    color={C.green} />
        : <Badge icon="🚫" label="No Happy Hour"    color={C.red} />}
      {laws.toGo === "permanent" && <Badge icon="🥡" label="To-Go Cocktails" sub="Permanent" color={C.green} />}
      {laws.toGo === "temporary" && <Badge icon="🥡" label="To-Go Cocktails" sub="Temporary law" color={C.amber} />}
      {!laws.toGo                && <Badge icon="🚫" label="No To-Go Drinks" color={C.red} />}
      {laws.delivery
        ? <Badge icon="🛵" label="Delivery Allowed" color={C.green} />
        : <Badge icon="🚫" label="No Delivery"      color={C.red} />}
    </div>
  );
}

// ── Location banner ─────────────────────────────────────────────────────────
function LocationBanner({ location, laws, onRequest, loading, error }) {
  if (loading) return (
    <div style={bannerStyle(C.border)}>
      <span style={{ fontSize:20 }}>📡</span>
      <span style={{ color:C.muted, fontSize:13 }}>Finding your location…</span>
    </div>
  );
  if (error) return (
    <div style={bannerStyle(C.red+"33")}>
      <span style={{ fontSize:18 }}>⚠️</span>
      <div style={{ flex:1 }}>
        <div style={{ color:C.cream, fontSize:13, fontWeight:700 }}>Location unavailable</div>
        <div style={{ color:C.muted, fontSize:11 }}>{error}</div>
      </div>
      <button onClick={onRequest} style={ghostBtn}>Retry</button>
    </div>
  );
  if (!location) return (
    <div style={bannerStyle(C.amber+"33")}>
      <span style={{ fontSize:20 }}>📍</span>
      <div style={{ flex:1 }}>
        <div style={{ color:C.cream, fontSize:13, fontWeight:700 }}>Enable location</div>
        <div style={{ color:C.muted, fontSize:11 }}>See happy hours, deals & laws near you</div>
      </div>
      <button onClick={onRequest} style={{ ...ghostBtn, borderColor:C.amber, color:C.amber }}>Allow</button>
    </div>
  );
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"12px 14px", marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
        <span style={{ fontSize:18 }}>📍</span>
        <div style={{ flex:1 }}>
          <span style={{ color:C.cream, fontWeight:700, fontSize:14 }}>{location.city}{location.city?", ":""}{laws?.name || location.state}</span>
          <span style={{ marginLeft:8, background:C.green, color:"#fff", borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:700 }}>LIVE</span>
        </div>
        <button onClick={onRequest} style={{ ...ghostBtn, fontSize:10 }}>Change</button>
      </div>
      <LawBadges laws={laws} />
    </div>
  );
}
const bannerStyle = (bg) => ({
  background: bg, border:`1px solid ${C.border}`, borderRadius:14,
  padding:"12px 14px", marginBottom:14,
  display:"flex", alignItems:"center", gap:10,
});
const ghostBtn = {
  background:"none", border:`1px solid ${C.border}`, borderRadius:8,
  padding:"5px 10px", color:C.muted, fontSize:11, cursor:"pointer",
};

// ── Feed card ───────────────────────────────────────────────────────────────
function FeedCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const laws = STATE_LAWS[post.state];
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:16, marginBottom:12 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
        <div style={avatarStyle}>{post.avatar}</div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
            <span style={{ color:C.cream, fontWeight:700, fontSize:14 }}>{post.user}</span>
            <span style={{ color:C.muted, fontSize:12 }}>{post.handle}</span>
          </div>
          <div style={{ color:C.muted, fontSize:11 }}>📍 {post.bar} · {post.city}, {post.state}</div>
        </div>
        <span style={{ color:C.muted, fontSize:11 }}>{post.time}</span>
      </div>

      {/* Beer block */}
      <div style={{ background:"#161208", borderRadius:10, padding:"10px 12px", marginBottom:10, border:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:24 }}>🍺</span>
          <div>
            <div style={{ color:C.amber, fontWeight:700, fontSize:14 }}>{post.beer}</div>
            <StarRow value={post.rating} />
          </div>
        </div>
      </div>

      {post.note && <p style={{ color:C.cream, fontSize:14, margin:"0 0 10px", lineHeight:1.5, opacity:.9 }}>{post.note}</p>}

      {/* State law mini-badges on post */}
      {laws && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:10 }}>
          {!laws.happyHour && <span style={miniBadge(C.red)}>🚫 No happy hour in {post.state}</span>}
          {laws.toGo === "permanent" && <span style={miniBadge(C.green)}>🥡 To-go allowed in {post.state}</span>}
          {laws.delivery && <span style={miniBadge(C.blue)}>🛵 Delivery available</span>}
        </div>
      )}

      <div style={{ display:"flex", gap:16, paddingTop:8, borderTop:`1px solid ${C.border}` }}>
        <button onClick={() => { setLiked(l=>!l); setLikes(n=>liked?n-1:n+1); }}
          style={{ background:"none", border:"none", cursor:"pointer",
            color:liked?C.amber:C.muted, fontSize:13, padding:0, fontWeight:liked?700:400 }}>
          🍻 {likes}
        </button>
        <button style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:13, padding:0 }}>
          💬 {post.comments}
        </button>
        <button style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:13, padding:0, marginLeft:"auto" }}>
          ↗ Share
        </button>
      </div>
    </div>
  );
}
const avatarStyle = {
  width:40, height:40, borderRadius:"50%",
  background:"#2A2218", border:`2px solid ${C.amber}`,
  display:"flex", alignItems:"center", justifyContent:"center",
  fontSize:20, flexShrink:0,
};
const miniBadge = (color) => ({
  fontSize:10, fontWeight:700, color, background:color+"18",
  border:`1px solid ${color}33`, borderRadius:20, padding:"3px 8px",
});

// ── Nearby tab ──────────────────────────────────────────────────────────────
function NearbyTab({ location, laws }) {
  return (
    <div>
      <LocationBanner location={location} laws={laws} />
      {NEARBY_BARS.map(bar => (
        <div key={bar.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:8 }}>
            <div>
              <div style={{ color:C.cream, fontWeight:700, fontSize:15 }}>{bar.name}</div>
              <div style={{ color:C.muted, fontSize:12, marginTop:2 }}>{bar.distance} · {bar.vibe}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ color:C.amber, fontWeight:800, fontSize:18 }}>{bar.checkins}</div>
              <div style={{ color:C.muted, fontSize:11 }}>check-ins</div>
            </div>
          </div>

          {/* Happy hour — only show if allowed in current state */}
          {laws?.happyHour ? (
            <div style={{ background:"#1A2015", border:`1px solid ${C.green}33`, borderRadius:8, padding:"7px 10px", marginBottom:8 }}>
              <div style={{ color:C.green, fontSize:12, fontWeight:700 }}>🍻 Happy Hour: {bar.happyHour}</div>
              <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                {bar.deals.map(d=>(
                  <span key={d} style={{ color:C.cream, fontSize:11, background:"#222", borderRadius:6, padding:"2px 7px" }}>{d}</span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background:"#201515", border:`1px solid ${C.red}33`, borderRadius:8, padding:"7px 10px", marginBottom:8 }}>
              <div style={{ color:C.red, fontSize:12, fontWeight:700 }}>🚫 Happy hour promotions not allowed in {laws?.name || "your state"}</div>
            </div>
          )}

          {/* To-go & delivery row */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:10, fontWeight:700, ...badgePill(C.amber) }}>🍺 {bar.top}</span>
            {laws?.toGo && (
              <span style={{ fontSize:10, fontWeight:700, ...badgePill(C.green) }}>
                🥡 To-go {laws.toGo === "temporary" ? "(temp)" : ""}
              </span>
            )}
            {laws?.delivery && (
              <button style={{ fontSize:10, fontWeight:700, cursor:"pointer", border:"none", ...badgePill(C.blue) }}>
                🛵 Order Delivery
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
const badgePill = (color) => ({
  color, background:color+"18", border:`1px solid ${color}33`, borderRadius:20, padding:"4px 9px",
});

// ── Check-in modal ──────────────────────────────────────────────────────────
function CheckInModal({ onClose, onPost, location, laws }) {
  const [beer, setBeer]   = useState("");
  const [rating, setRating] = useState(0);
  const [bar, setBar]     = useState("");
  const [note, setNote]   = useState("");
  const [toGo, setToGo]   = useState(false);
  const [posted, setPosted] = useState(false);

  const canPost = beer && rating && bar;

  function post() {
    if (!canPost) return;
    setPosted(true);
    setTimeout(() => {
      onPost({ beer, rating, bar, note, toGo });
      onClose();
    }, 1100);
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.78)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:C.card, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:480,
        padding:"20px 18px 36px", border:`1px solid ${C.border}`, animation:"slideUp .25s ease" }}>
        <div style={{ width:36, height:4, background:"#3A3228", borderRadius:2, margin:"0 auto 18px" }} />

        {!posted ? (
          <>
            <h2 style={{ color:C.cream, fontSize:19, fontWeight:800, margin:"0 0 4px", letterSpacing:"-.3px" }}>🍺 Check In</h2>
            {location && laws && (
              <div style={{ color:C.muted, fontSize:12, marginBottom:14 }}>
                📍 {location.city}{location.city?", ":""}{laws.name}
              </div>
            )}

            <Field label="What are you drinking?">
              <input value={beer} onChange={e=>setBeer(e.target.value)}
                placeholder="e.g. Goose Island IPA" style={inputStyle(!!beer)} />
            </Field>

            <Field label="Rate it">
              <StarRow value={rating} onChange={setRating} />
            </Field>

            <Field label="Bar / Location">
              <input value={bar} onChange={e=>setBar(e.target.value)}
                placeholder="Bar name" style={inputStyle(!!bar)} />
              {location && <div style={{ color:C.muted, fontSize:11, marginTop:4 }}>📍 Near {location.city || location.state}</div>}
            </Field>

            <Field label="Note (optional)">
              <textarea value={note} onChange={e=>setNote(e.target.value)}
                placeholder="How's the vibe? Any must-tries?" rows={2}
                style={{ ...inputStyle(false), resize:"none", lineHeight:1.5 }} />
            </Field>

            {/* To-go toggle — only show if state allows it */}
            {laws?.toGo && (
              <div style={{ background:"#1A2015", border:`1px solid ${C.green}44`, borderRadius:10,
                padding:"10px 12px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20 }}>🥡</span>
                <div style={{ flex:1 }}>
                  <div style={{ color:C.green, fontWeight:700, fontSize:13 }}>To-go cocktails are allowed in {laws.name}!</div>
                  <div style={{ color:C.muted, fontSize:11 }}>Mark this check-in as a to-go order</div>
                </div>
                <div onClick={()=>setToGo(t=>!t)} style={{
                  width:40, height:22, borderRadius:11, cursor:"pointer", transition:"background .2s",
                  background: toGo ? C.green : C.border, position:"relative",
                }}>
                  <div style={{ position:"absolute", top:3, left: toGo?20:3,
                    width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }} />
                </div>
              </div>
            )}

            {/* Delivery CTA — only if allowed */}
            {laws?.delivery && (
              <div style={{ background:"#15182A", border:`1px solid ${C.blue}44`, borderRadius:10,
                padding:"10px 12px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20 }}>🛵</span>
                <div style={{ flex:1 }}>
                  <div style={{ color:C.blue, fontWeight:700, fontSize:13 }}>Delivery available in {laws.name}</div>
                  <div style={{ color:C.muted, fontSize:11 }}>Skip the trip — get drinks delivered</div>
                </div>
                <button style={{ background:C.blue, color:"#fff", border:"none", borderRadius:8,
                  padding:"6px 10px", fontSize:11, fontWeight:700, cursor:"pointer" }}>Order</button>
              </div>
            )}

            {/* Happy hour note */}
            {laws && !laws.happyHour && (
              <div style={{ background:"#201515", border:`1px solid ${C.red}33`, borderRadius:10,
                padding:"8px 12px", marginBottom:16 }}>
                <span style={{ color:C.red, fontSize:12 }}>🚫 Happy hour specials are banned in {laws.name} — all drinks must be full price.</span>
              </div>
            )}

            <button onClick={post} disabled={!canPost}
              style={{ width:"100%", padding:14, border:"none", borderRadius:12, fontSize:15,
                fontWeight:800, cursor:canPost?"pointer":"not-allowed", letterSpacing:"-.2px",
                background: canPost ? `linear-gradient(135deg, ${C.amber}, ${C.amberLt})` : "#2A2218",
                color: canPost ? "#141210" : C.muted, transition:"all .2s" }}>
              Post Check-In 🍻
            </button>
          </>
        ) : (
          <div style={{ textAlign:"center", padding:"24px 0" }}>
            <div style={{ fontSize:52, marginBottom:10 }}>🍺</div>
            <div style={{ color:C.amber, fontSize:22, fontWeight:800, marginBottom:4 }}>Cheers!</div>
            <div style={{ color:C.muted, fontSize:13 }}>Your check-in is live</div>
          </div>
        )}
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:".06em",
        textTransform:"uppercase", display:"block", marginBottom:6 }}>{label}</label>
      {children}
    </div>
  );
}
const inputStyle = (active) => ({
  width:"100%", background:"#161208", border:`1px solid ${active?C.amber:C.border}`,
  borderRadius:10, padding:"10px 13px", color:C.cream, fontSize:14,
  outline:"none", boxSizing:"border-box", transition:"border-color .2s",
});

// ── State picker modal ──────────────────────────────────────────────────────
function StatePickerModal({ onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = US_STATES.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.code.includes(search.toUpperCase())
  );
  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.82)", backdropFilter:"blur(4px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:C.card, borderRadius:16, width:"100%", maxWidth:380,
        maxHeight:"80vh", display:"flex", flexDirection:"column", border:`1px solid ${C.border}` }}>
        <div style={{ padding:"16px 16px 0" }}>
          <div style={{ color:C.cream, fontWeight:800, fontSize:16, marginBottom:12 }}>Select your state</div>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search states…" style={{ ...inputStyle(false), marginBottom:10 }} />
        </div>
        <div style={{ overflowY:"auto", padding:"0 10px 16px" }}>
          {filtered.map(s => {
            const l = STATE_LAWS[s.code];
            return (
              <button key={s.code} onClick={()=>onSelect(s.code)}
                style={{ width:"100%", background:"none", border:"none", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:10, padding:"10px 8px",
                  borderBottom:`1px solid ${C.border}` }}>
                <div style={{ flex:1, textAlign:"left" }}>
                  <div style={{ color:C.cream, fontSize:14, fontWeight:600 }}>{s.name}</div>
                  <div style={{ display:"flex", gap:4, marginTop:3, flexWrap:"wrap" }}>
                    {l.happyHour  ? <span style={{ fontSize:9, ...badgePill(C.green) }}>🍻 Happy Hour</span>
                                  : <span style={{ fontSize:9, ...badgePill(C.red)   }}>🚫 No HH</span>}
                    {l.toGo      && <span style={{ fontSize:9, ...badgePill(C.amber) }}>🥡 To-Go</span>}
                    {l.delivery  && <span style={{ fontSize:9, ...badgePill(C.blue)  }}>🛵 Delivery</span>}
                  </div>
                </div>
                <span style={{ color:C.muted, fontSize:13 }}>›</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Profile tab ─────────────────────────────────────────────────────────────
function ProfileTab() {
  const stats  = [{l:"Beers Logged",v:"47"},{l:"Bars Visited",v:"18"},{l:"Friends",v:"12"}];
  const badges = [
    {icon:"🍺",label:"First Pour",earned:true},
    {icon:"🏆",label:"18 Logged",earned:true},
    {icon:"🗺️",label:"Bar Hopper",earned:true},
    {icon:"⭐",label:"Critic",earned:false},
    {icon:"🌍",label:"Explorer",earned:false},
    {icon:"👑",label:"Legend",earned:false},
  ];
  return (
    <div>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
        padding:"20px 16px", marginBottom:14, textAlign:"center" }}>
        <div style={{ ...avatarStyle, width:64, height:64, fontSize:32, margin:"0 auto 10px" }}>🧔</div>
        <div style={{ color:C.cream, fontWeight:800, fontSize:18 }}>You</div>
        <div style={{ color:C.muted, fontSize:13 }}>@you</div>
        <div style={{ display:"flex", justifyContent:"center", gap:28, marginTop:16 }}>
          {stats.map(s=>(
            <div key={s.l} style={{ textAlign:"center" }}>
              <div style={{ color:C.amber, fontSize:22, fontWeight:800 }}>{s.v}</div>
              <div style={{ color:C.muted, fontSize:11 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:".06em",
        textTransform:"uppercase", marginBottom:10 }}>Badges</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
        {badges.map(b=>(
          <div key={b.label} style={{ background:b.earned?C.card:"#141210",
            border:`1px solid ${b.earned?C.amber+"55":C.border}`,
            borderRadius:12, padding:"14px 8px", textAlign:"center", opacity:b.earned?1:.4 }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{b.icon}</div>
            <div style={{ color:b.earned?C.cream:C.muted, fontSize:11, fontWeight:600 }}>{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Root app ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]           = useState("feed");
  const [feed, setFeed]         = useState(MOCK_FEED);
  const [showModal, setShowModal] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [location, setLocation] = useState(null);   // { city, state }
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const laws = location?.state ? STATE_LAWS[location.state] : null;

  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("GPS not supported — pick your state manually.");
      setShowPicker(true);
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setGpsLoading(false);
        if (result?.state && STATE_LAWS[result.state]) {
          setLocation(result);
        } else {
          setGpsError("Couldn't detect state — pick manually.");
          setShowPicker(true);
        }
      },
      err => {
        setGpsLoading(false);
        setGpsError("Location denied — pick your state manually.");
        setShowPicker(true);
      },
      { timeout: 10000 }
    );
  }, []);

  // Auto-request on mount
  useEffect(() => { requestGPS(); }, []);

  function handlePickState(code) {
    setLocation({ city:"", state:code });
    setGpsError(null);
    setShowPicker(false);
  }

  function handlePost({ beer, rating, bar, note, toGo }) {
    const newPost = {
      id:Date.now(), user:"You", handle:"@you", avatar:"🧔",
      beer, rating, bar,
      state: location?.state || "??",
      city:  location?.city  || "",
      note: [note, toGo ? "🥡 Ordered to-go!" : ""].filter(Boolean).join(" "),
      time:"Just now", likes:0, comments:0,
    };
    setFeed(f=>[newPost,...f]);
    setTab("feed");
  }

  const TABS = [
    { key:"feed",    icon:"🍻", label:"Feed"    },
    { key:"nearby",  icon:"📍", label:"Nearby"  },
    { key:"profile", icon:"👤", label:"Profile" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg,
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
      display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", position:"relative" }}>

      {/* Header */}
      <div style={{ position:"sticky", top:0, zIndex:10, background:C.bg,
        borderBottom:`1px solid ${C.border}`, padding:"14px 18px 10px",
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ color:C.amber, fontSize:26, fontWeight:900, letterSpacing:"-1px", lineHeight:1 }}>
            18<span style={{ color:C.cream }}>Beers</span>
          </div>
          <div style={{ color:C.muted, fontSize:11, marginTop:1 }}>Check in. Drink up.</div>
        </div>
        <button onClick={()=>setShowModal(true)}
          style={{ background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
            color:"#141210", border:"none", borderRadius:12, padding:"10px 15px",
            fontSize:13, fontWeight:800, cursor:"pointer", letterSpacing:"-.2px" }}>
          🍺 Check In
        </button>
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:"14px 14px 80px", overflowY:"auto" }}>
        {tab === "feed" && (
          <>
            <LocationBanner
              location={location} laws={laws}
              onRequest={()=>{ setShowPicker(true); }}
              loading={gpsLoading} error={gpsError} />
            <div style={{ color:C.muted, fontSize:11, fontWeight:700, letterSpacing:".06em",
              textTransform:"uppercase", marginBottom:10 }}>Friends & Following</div>
            {feed.map(p=><FeedCard key={p.id} post={p} />)}
          </>
        )}
        {tab === "nearby" && (
          <NearbyTab location={location} laws={laws}
            onRequestLocation={()=>setShowPicker(true)} />
        )}
        {tab === "profile" && <ProfileTab />}
      </div>

      {/* Bottom nav */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
        width:"100%", maxWidth:480, background:C.card, borderTop:`1px solid ${C.border}`,
        display:"flex", justifyContent:"space-around", padding:"10px 0 16px", zIndex:10 }}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ background:"none", border:"none", cursor:"pointer",
              display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"0 20px" }}>
            <span style={{ fontSize:20, opacity:tab===t.key?1:.4 }}>{t.icon}</span>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:".04em", textTransform:"uppercase",
              color:tab===t.key?C.amber:C.muted }}>{t.label}</span>
          </button>
        ))}
      </div>

      {showModal && (
        <CheckInModal onClose={()=>setShowModal(false)} onPost={handlePost}
          location={location} laws={laws} />
      )}
      {showPicker && (
        <StatePickerModal onSelect={handlePickState} onClose={()=>setShowPicker(false)} />
      )}
    </div>
  );
}
