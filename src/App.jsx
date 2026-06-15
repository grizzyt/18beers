import { useState, useEffect, useCallback, useRef } from "react";

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      "#111009",
  card:    "#1C1810",
  border:  "#2C2618",
  amber:   "#E8A020",
  amberLt: "#F5C842",
  cream:   "#F0E8D4",
  muted:   "#7A6E60",
  green:   "#4CAF6E",
  red:     "#E05050",
  blue:    "#4A9EE0",
  ms:      "#2F7BE8",  // Microsoft blue
};

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";
const MS_CLIENT_ID = import.meta.env.VITE_MS_CLIENT_ID || "";

// ── State liquor law database ────────────────────────────────────────────────
const STATE_LAWS = {
  AL:{name:"Alabama",        happyHour:true,  toGo:false,         delivery:false},
  AK:{name:"Alaska",         happyHour:false, toGo:false,         delivery:false},
  AZ:{name:"Arizona",        happyHour:true,  toGo:"permanent",   delivery:true },
  AR:{name:"Arkansas",       happyHour:true,  toGo:"permanent",   delivery:true },
  CA:{name:"California",     happyHour:true,  toGo:"temporary",   delivery:true },
  CO:{name:"Colorado",       happyHour:true,  toGo:"permanent",   delivery:true },
  CT:{name:"Connecticut",    happyHour:true,  toGo:false,         delivery:false},
  DE:{name:"Delaware",       happyHour:true,  toGo:"permanent",   delivery:true },
  FL:{name:"Florida",        happyHour:true,  toGo:"permanent",   delivery:true },
  GA:{name:"Georgia",        happyHour:true,  toGo:"permanent",   delivery:true },
  HI:{name:"Hawaii",         happyHour:true,  toGo:false,         delivery:false},
  ID:{name:"Idaho",          happyHour:true,  toGo:false,         delivery:false},
  IL:{name:"Illinois",       happyHour:true,  toGo:"temporary",   delivery:true },
  IN:{name:"Indiana",        happyHour:false, toGo:false,         delivery:false},
  IA:{name:"Iowa",           happyHour:true,  toGo:"permanent",   delivery:true },
  KS:{name:"Kansas",         happyHour:true,  toGo:false,         delivery:false},
  KY:{name:"Kentucky",       happyHour:true,  toGo:"permanent",   delivery:true },
  LA:{name:"Louisiana",      happyHour:true,  toGo:"permanent",   delivery:true },
  ME:{name:"Maine",          happyHour:true,  toGo:"permanent",   delivery:false},
  MD:{name:"Maryland",       happyHour:true,  toGo:false,         delivery:false},
  MA:{name:"Massachusetts",  happyHour:false, toGo:false,         delivery:false},
  MI:{name:"Michigan",       happyHour:true,  toGo:"permanent",   delivery:true },
  MN:{name:"Minnesota",      happyHour:true,  toGo:false,         delivery:false},
  MS:{name:"Mississippi",    happyHour:true,  toGo:false,         delivery:false},
  MO:{name:"Missouri",       happyHour:true,  toGo:"permanent",   delivery:true },
  MT:{name:"Montana",        happyHour:true,  toGo:"permanent",   delivery:true },
  NE:{name:"Nebraska",       happyHour:true,  toGo:"permanent",   delivery:true },
  NV:{name:"Nevada",         happyHour:true,  toGo:false,         delivery:false},
  NH:{name:"New Hampshire",  happyHour:true,  toGo:false,         delivery:false},
  NJ:{name:"New Jersey",     happyHour:true,  toGo:"temporary",   delivery:true },
  NM:{name:"New Mexico",     happyHour:true,  toGo:false,         delivery:false},
  NY:{name:"New York",       happyHour:true,  toGo:"temporary",   delivery:true },
  NC:{name:"North Carolina", happyHour:false, toGo:false,         delivery:false},
  ND:{name:"North Dakota",   happyHour:true,  toGo:false,         delivery:false},
  OH:{name:"Ohio",           happyHour:true,  toGo:"permanent",   delivery:true },
  OK:{name:"Oklahoma",       happyHour:true,  toGo:"permanent",   delivery:false},
  OR:{name:"Oregon",         happyHour:true,  toGo:"permanent",   delivery:true },
  PA:{name:"Pennsylvania",   happyHour:true,  toGo:false,         delivery:false},
  RI:{name:"Rhode Island",   happyHour:false, toGo:"permanent",   delivery:true },
  SC:{name:"South Carolina", happyHour:true,  toGo:false,         delivery:false},
  SD:{name:"South Dakota",   happyHour:true,  toGo:false,         delivery:false},
  TN:{name:"Tennessee",      happyHour:true,  toGo:false,         delivery:false},
  TX:{name:"Texas",          happyHour:true,  toGo:"permanent",   delivery:true },
  UT:{name:"Utah",           happyHour:false, toGo:false,         delivery:false},
  VT:{name:"Vermont",        happyHour:false, toGo:false,         delivery:false},
  VA:{name:"Virginia",       happyHour:true,  toGo:"permanent",   delivery:true },
  WA:{name:"Washington",     happyHour:true,  toGo:"permanent",   delivery:true },
  WV:{name:"West Virginia",  happyHour:true,  toGo:"permanent",   delivery:true },
  WI:{name:"Wisconsin",      happyHour:true,  toGo:"permanent",   delivery:true },
  WY:{name:"Wyoming",        happyHour:true,  toGo:false,         delivery:false},
  DC:{name:"Washington DC",  happyHour:true,  toGo:"permanent",   delivery:true },
};

const US_STATES = Object.entries(STATE_LAWS).map(([k,v])=>({code:k,name:v.name}));

// ── Mock post store keyed by Google Place ID ─────────────────────────────────
const BAR_POSTS_STORE = {};

// ── Google Maps loader ───────────────────────────────────────────────────────
let mapsPromise = null;
function loadGoogleMaps() {
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(window.google.maps); return; }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return mapsPromise;
}

// ── Microsoft MSAL-lite login (OAuth implicit/popup) ─────────────────────────
async function msLoginPopup() {
  const tenantId = "common";
  const redirectUri = encodeURIComponent(window.location.origin);
  const scope = encodeURIComponent("openid profile email User.Read");
  const nonce = Math.random().toString(36).slice(2);
  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`
    + `?client_id=${MS_CLIENT_ID}&response_type=token`
    + `&redirect_uri=${redirectUri}&scope=${scope}&nonce=${nonce}&response_mode=fragment`;

  return new Promise((resolve, reject) => {
    const popup = window.open(url, "ms-login", "width=480,height=640,left=200,top=100");
    const timer = setInterval(() => {
      try {
        if (!popup || popup.closed) { clearInterval(timer); reject(new Error("Popup closed")); return; }
        const hash = popup.location.hash;
        if (hash && hash.includes("access_token")) {
          clearInterval(timer);
          popup.close();
          const params = new URLSearchParams(hash.slice(1));
          resolve(params.get("access_token"));
        }
      } catch (_) { /* cross-origin, keep waiting */ }
    }, 300);
  });
}

async function fetchMsProfile(token) {
  const r = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return r.json();
}

// ── Reverse geocode ───────────────────────────────────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────
const inp = (active) => ({
  width:"100%", background:"#161208", border:`1px solid ${active?C.amber:C.border}`,
  borderRadius:10, padding:"10px 13px", color:C.cream, fontSize:14,
  outline:"none", boxSizing:"border-box", transition:"border-color .2s",
});
const pill = (color) => ({
  color, background:color+"18", border:`1px solid ${color}33`, borderRadius:20, padding:"3px 8px",
});
const avatarBox = {
  width:40, height:40, borderRadius:"50%", background:"#2A2218",
  border:`2px solid ${C.amber}`, display:"flex", alignItems:"center",
  justifyContent:"center", fontSize:20, flexShrink:0,
};

function StarRow({ value, onChange }) {
  return (
    <div style={{display:"flex",gap:2}}>
      {[1,2,3,4,5].map(n=>(
        <span key={n} onClick={()=>onChange?.(n)}
          style={{cursor:onChange?"pointer":"default",fontSize:20,color:n<=value?C.amber:"#3A3228"}}>★</span>
      ))}
    </div>
  );
}

function LawBadges({ laws }) {
  if (!laws) return null;
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:6}}>
      {laws.happyHour
        ? <span style={{fontSize:10,fontWeight:700,...pill(C.green)}}>🍻 Happy Hour OK</span>
        : <span style={{fontSize:10,fontWeight:700,...pill(C.red)}}>🚫 No Happy Hour</span>}
      {laws.toGo==="permanent" && <span style={{fontSize:10,fontWeight:700,...pill(C.green)}}>🥡 To-Go (Permanent)</span>}
      {laws.toGo==="temporary" && <span style={{fontSize:10,fontWeight:700,...pill(C.amber)}}>🥡 To-Go (Temp)</span>}
      {!laws.toGo              && <span style={{fontSize:10,fontWeight:700,...pill(C.red)}}>🚫 No To-Go</span>}
      {laws.delivery
        ? <span style={{fontSize:10,fontWeight:700,...pill(C.blue)}}>🛵 Delivery OK</span>
        : <span style={{fontSize:10,fontWeight:700,...pill(C.red)}}>🚫 No Delivery</span>}
    </div>
  );
}

// ── Microsoft Login Button ────────────────────────────────────────────────────
function MsLoginButton({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin() {
    if (!MS_CLIENT_ID) {
      setError("Add VITE_MS_CLIENT_ID to .env to enable Microsoft login.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await msLoginPopup();
      const profile = await fetchMsProfile(token);
      onLogin({ token, profile });
    } catch (e) {
      setError("Login cancelled or failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={handleLogin} disabled={loading} style={{
        display:"flex", alignItems:"center", gap:10, width:"100%",
        background:C.ms, color:"#fff", border:"none", borderRadius:12,
        padding:"13px 16px", fontSize:14, fontWeight:700, cursor:"pointer",
        opacity: loading?0.7:1, transition:"opacity .2s",
      }}>
        <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
          <rect x="1"  y="1"  width="9" height="9" fill="#F25022"/>
          <rect x="11" y="1"  width="9" height="9" fill="#7FBA00"/>
          <rect x="1"  y="11" width="9" height="9" fill="#00A4EF"/>
          <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
        </svg>
        {loading ? "Signing in…" : "Continue with Microsoft"}
      </button>
      {error && <div style={{color:C.red,fontSize:12,marginTop:6}}>{error}</div>}
    </div>
  );
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onLogin, onGuest }) {
  return (
    <div style={{
      minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:24,
    }}>
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:60,marginBottom:12}}>🍺</div>
        <div style={{color:C.amber,fontSize:38,fontWeight:900,letterSpacing:"-1.5px",lineHeight:1}}>
          18<span style={{color:C.cream}}>Beers</span>
        </div>
        <div style={{color:C.muted,fontSize:14,marginTop:8}}>Check in. Drink up. Share the round.</div>
      </div>

      <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:12}}>
        <MsLoginButton onLogin={onLogin} />

        <div style={{display:"flex",alignItems:"center",gap:10,margin:"4px 0"}}>
          <div style={{flex:1,height:1,background:C.border}}/>
          <span style={{color:C.muted,fontSize:12}}>or</span>
          <div style={{flex:1,height:1,background:C.border}}/>
        </div>

        <button onClick={onGuest} style={{
          background:"none", border:`1px solid ${C.border}`, borderRadius:12,
          padding:"13px 16px", color:C.muted, fontSize:14, fontWeight:600, cursor:"pointer",
        }}>
          Continue as Guest
        </button>

        <p style={{color:C.muted,fontSize:11,textAlign:"center",margin:0,lineHeight:1.5}}>
          By continuing you agree to drink responsibly 🍻
        </p>
      </div>
    </div>
  );
}

// ── Google Map + Places bar finder ───────────────────────────────────────────
function MapView({ lat, lng, bars, selectedBar, onSelectBar, userState }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    if (!mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 15,
        styles: darkMapStyles,
        disableDefaultUI: true,
        zoomControl: true,
      });
    } else {
      mapInstance.current.setCenter({ lat, lng });
    }
  }, [lat, lng]);

  // Place markers
  useEffect(() => {
    if (!mapInstance.current || !window.google) return;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // User location dot
    new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstance.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: C.amber,
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
      },
      title: "You are here",
      zIndex: 999,
    });

    bars.forEach(bar => {
      const postCount = (BAR_POSTS_STORE[bar.place_id] || []).length;
      const isSelected = selectedBar?.place_id === bar.place_id;
      const marker = new window.google.maps.Marker({
        position: bar.geometry.location,
        map: mapInstance.current,
        title: bar.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 14 : 10,
          fillColor: isSelected ? C.amberLt : C.amber,
          fillOpacity: 1,
          strokeColor: isSelected ? "#fff" : C.card,
          strokeWeight: isSelected ? 3 : 2,
        },
        label: postCount > 0 ? {
          text: String(postCount),
          color: "#111",
          fontSize: "10px",
          fontWeight: "bold",
        } : undefined,
        zIndex: isSelected ? 100 : 1,
      });
      marker.addListener("click", () => onSelectBar(bar));
      markersRef.current.push(marker);
    });
  }, [bars, selectedBar, lat, lng]);

  return <div ref={mapRef} style={{ width:"100%", height:260, borderRadius:12, overflow:"hidden" }} />;
}

// ── Bar detail sheet ──────────────────────────────────────────────────────────
function BarSheet({ bar, laws, user, onClose, onCheckIn }) {
  const posts = BAR_POSTS_STORE[bar.place_id] || [];
  const rating = bar.rating || "—";
  const laws2 = laws;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:90, background:"rgba(0,0,0,0.7)",
      backdropFilter:"blur(3px)", display:"flex", alignItems:"flex-end", justifyContent:"center",
    }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{
        background:C.card, borderRadius:"18px 18px 0 0", width:"100%", maxWidth:480,
        maxHeight:"80vh", display:"flex", flexDirection:"column",
        border:`1px solid ${C.border}`, animation:"slideUp .22s ease",
      }}>
        <div style={{width:36,height:4,background:"#3A3228",borderRadius:2,margin:"14px auto 0"}}/>
        {/* Bar header */}
        <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
            <div style={{flex:1}}>
              <div style={{color:C.cream,fontWeight:800,fontSize:17,lineHeight:1.2}}>{bar.name}</div>
              <div style={{color:C.muted,fontSize:12,marginTop:3}}>{bar.vicinity}</div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:5}}>
                <span style={{color:C.amber,fontWeight:700,fontSize:13}}>★ {rating}</span>
                {bar.opening_hours?.open_now !== undefined && (
                  <span style={{fontSize:11,fontWeight:700,
                    color:bar.opening_hours.open_now?C.green:C.red}}>
                    {bar.opening_hours.open_now?"● Open Now":"● Closed"}
                  </span>
                )}
                <span style={{color:C.muted,fontSize:11}}>{posts.length} check-in{posts.length!==1?"s":""}</span>
              </div>
            </div>
            <button onClick={()=>onCheckIn(bar)} style={{
              background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
              color:"#141210", border:"none", borderRadius:10,
              padding:"9px 13px", fontSize:12, fontWeight:800, cursor:"pointer", flexShrink:0,
            }}>🍺 Check In</button>
          </div>
          <LawBadges laws={laws2}/>
        </div>

        {/* Posts at this bar */}
        <div style={{overflowY:"auto",padding:"10px 14px 20px",flex:1}}>
          {posts.length === 0 ? (
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <div style={{fontSize:36,marginBottom:8}}>🍺</div>
              <div style={{color:C.muted,fontSize:13}}>No check-ins here yet.</div>
              <div style={{color:C.muted,fontSize:12,marginTop:4}}>Be the first!</div>
            </div>
          ) : (
            posts.map((p,i) => (
              <div key={i} style={{
                background:"#161208", borderRadius:10, padding:"10px 12px",
                marginBottom:8, border:`1px solid ${C.border}`,
              }}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <div style={{...avatarBox,width:30,height:30,fontSize:14}}>{p.avatar}</div>
                  <div>
                    <span style={{color:C.cream,fontWeight:700,fontSize:13}}>{p.user}</span>
                    <span style={{color:C.muted,fontSize:11,marginLeft:6}}>{p.time}</span>
                  </div>
                </div>
                <div style={{color:C.amber,fontWeight:700,fontSize:13,marginBottom:3}}>{p.beer}</div>
                <StarRow value={p.rating}/>
                {p.note && <p style={{color:C.cream,fontSize:12,margin:"6px 0 0",lineHeight:1.5}}>{p.note}</p>}
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

// ── Nearby Tab with real Google Maps ─────────────────────────────────────────
function NearbyTab({ location, laws, user }) {
  const [mapsReady, setMapsReady] = useState(!!window.google?.maps);
  const [bars, setBars] = useState([]);
  const [loadingBars, setLoadingBars] = useState(false);
  const [selectedBar, setSelectedBar] = useState(null);
  const [checkInBar, setCheckInBar] = useState(null);
  const [mapsError, setMapsError] = useState(null);

  useEffect(() => {
    if (!MAPS_KEY) { setMapsError("Add VITE_GOOGLE_MAPS_KEY to .env"); return; }
    loadGoogleMaps()
      .then(() => setMapsReady(true))
      .catch(() => setMapsError("Failed to load Google Maps"));
  }, []);

  useEffect(() => {
    if (!mapsReady || !location?.lat) return;
    setLoadingBars(true);
    const tempDiv = document.createElement("div");
    const map = new window.google.maps.Map(tempDiv);
    const svc = new window.google.maps.places.PlacesService(map);
    svc.nearbySearch({
      location: { lat: location.lat, lng: location.lng },
      radius: 1200,
      type: "bar",
    }, (results, status) => {
      setLoadingBars(false);
      if (status === "OK") setBars(results.slice(0, 12));
      else setMapsError("Places search failed: " + status);
    });
  }, [mapsReady, location?.lat, location?.lng]);

  if (!location?.lat) return (
    <div style={{textAlign:"center",padding:"40px 20px"}}>
      <div style={{fontSize:36,marginBottom:10}}>📍</div>
      <div style={{color:C.cream,fontWeight:700,fontSize:15,marginBottom:6}}>Location needed</div>
      <div style={{color:C.muted,fontSize:13}}>Allow location access to see bars near you.</div>
    </div>
  );

  if (mapsError) return (
    <div style={{background:"#201515",border:`1px solid ${C.red}33`,borderRadius:12,padding:16}}>
      <div style={{color:C.red,fontWeight:700,marginBottom:4}}>Maps error</div>
      <div style={{color:C.muted,fontSize:13}}>{mapsError}</div>
    </div>
  );

  return (
    <div>
      {/* Live map */}
      <div style={{marginBottom:14}}>
        {mapsReady && location?.lat ? (
          <MapView
            lat={location.lat} lng={location.lng}
            bars={bars} selectedBar={selectedBar}
            onSelectBar={setSelectedBar} userState={location.state}
          />
        ) : (
          <div style={{height:260,background:C.card,borderRadius:12,display:"flex",
            alignItems:"center",justifyContent:"center"}}>
            <span style={{color:C.muted,fontSize:13}}>Loading map…</span>
          </div>
        )}
      </div>

      {/* Law summary */}
      {laws && (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,
          padding:"10px 14px",marginBottom:14}}>
          <div style={{color:C.cream,fontWeight:700,fontSize:13,marginBottom:2}}>
            📍 {location.city}{location.city?", ":""}{laws.name}
          </div>
          <LawBadges laws={laws}/>
        </div>
      )}

      {/* Bar list */}
      {loadingBars ? (
        <div style={{textAlign:"center",padding:30,color:C.muted}}>Finding bars near you…</div>
      ) : (
        bars.map(bar => {
          const postCount = (BAR_POSTS_STORE[bar.place_id] || []).length;
          const isOpen = bar.opening_hours?.open_now;
          return (
            <div key={bar.place_id}
              onClick={() => setSelectedBar(bar)}
              style={{
                background: selectedBar?.place_id===bar.place_id ? "#242018" : C.card,
                border:`1px solid ${selectedBar?.place_id===bar.place_id ? C.amber+"66" : C.border}`,
                borderRadius:12, padding:"12px 14px", marginBottom:9, cursor:"pointer",
                transition:"all .15s",
              }}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:C.cream,fontWeight:700,fontSize:14}}>{bar.name}</div>
                  <div style={{color:C.muted,fontSize:11,marginTop:2,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {bar.vicinity}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                    {bar.rating && <span style={{color:C.amber,fontSize:12,fontWeight:700}}>★ {bar.rating}</span>}
                    {isOpen !== undefined && (
                      <span style={{fontSize:11,fontWeight:600,color:isOpen?C.green:C.red}}>
                        {isOpen?"Open":"Closed"}
                      </span>
                    )}
                    {laws?.happyHour && <span style={{fontSize:10,...pill(C.green)}}>🍻 HH</span>}
                    {laws?.toGo     && <span style={{fontSize:10,...pill(C.amber)}}>🥡 To-Go</span>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                  {postCount > 0 && (
                    <div style={{color:C.amber,fontWeight:800,fontSize:18,lineHeight:1}}>{postCount}</div>
                  )}
                  <div style={{color:C.muted,fontSize:10}}>{postCount>0?"check-ins":"no posts"}</div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {selectedBar && (
        <BarSheet
          bar={selectedBar} laws={laws} user={user}
          onClose={() => setSelectedBar(null)}
          onCheckIn={(bar) => { setSelectedBar(null); setCheckInBar(bar); }}
        />
      )}

      {checkInBar && (
        <CheckInModal
          onClose={() => setCheckInBar(null)}
          onPost={(data) => {
            if (!BAR_POSTS_STORE[checkInBar.place_id]) BAR_POSTS_STORE[checkInBar.place_id] = [];
            BAR_POSTS_STORE[checkInBar.place_id].unshift(data);
            setCheckInBar(null);
          }}
          location={location} laws={laws} user={user}
          preselectedBar={checkInBar.name}
        />
      )}
    </div>
  );
}

// ── Check-in modal ────────────────────────────────────────────────────────────
function CheckInModal({ onClose, onPost, location, laws, user, preselectedBar }) {
  const [beer,   setBeer]   = useState("");
  const [rating, setRating] = useState(0);
  const [bar,    setBar]    = useState(preselectedBar || "");
  const [note,   setNote]   = useState("");
  const [toGo,   setToGo]   = useState(false);
  const [posted, setPosted] = useState(false);

  // Google Places autocomplete on bar input
  const barInputRef = useRef(null);
  const acRef = useRef(null);
  useEffect(() => {
    if (!window.google?.maps?.places || !barInputRef.current || preselectedBar) return;
    acRef.current = new window.google.maps.places.Autocomplete(barInputRef.current, {
      types: ["establishment"],
      fields: ["name","place_id","vicinity"],
    });
    acRef.current.addListener("place_changed", () => {
      const place = acRef.current.getPlace();
      if (place?.name) setBar(place.name);
    });
  }, [preselectedBar]);

  const canPost = beer && rating && bar;

  function post() {
    if (!canPost) return;
    setPosted(true);
    const entry = {
      user: user?.displayName || "Guest",
      avatar: user ? "🧑‍💼" : "👤",
      beer, rating, bar, note,
      toGo, time: "Just now",
    };
    setTimeout(() => { onPost(entry); onClose(); }, 1000);
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.78)",
      backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.card,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,
        padding:"18px 18px 34px",border:`1px solid ${C.border}`,animation:"slideUp .25s ease"}}>
        <div style={{width:36,height:4,background:"#3A3228",borderRadius:2,margin:"0 auto 16px"}}/>

        {!posted ? (
          <>
            <h2 style={{color:C.cream,fontSize:18,fontWeight:800,margin:"0 0 14px",letterSpacing:"-.3px"}}>
              🍺 Check In
            </h2>

            <Field label="What are you drinking?">
              <input value={beer} onChange={e=>setBeer(e.target.value)}
                placeholder="e.g. Goose Island IPA" style={inp(!!beer)}/>
            </Field>

            <Field label="Rate it">
              <StarRow value={rating} onChange={setRating}/>
            </Field>

            <Field label="Bar / Location">
              <input ref={barInputRef} value={bar} onChange={e=>setBar(e.target.value)}
                placeholder="Search for a bar…" style={inp(!!bar)}
                readOnly={!!preselectedBar}/>
              {!preselectedBar && window.google && (
                <div style={{color:C.muted,fontSize:10,marginTop:3}}>Powered by Google Maps</div>
              )}
            </Field>

            <Field label="Note (optional)">
              <textarea value={note} onChange={e=>setNote(e.target.value)}
                placeholder="How's the vibe?" rows={2}
                style={{...inp(false),resize:"none",lineHeight:1.5}}/>
            </Field>

            {laws?.toGo && (
              <div style={{background:"#1A2015",border:`1px solid ${C.green}44`,borderRadius:10,
                padding:"10px 12px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>🥡</span>
                <div style={{flex:1}}>
                  <div style={{color:C.green,fontWeight:700,fontSize:12}}>To-go allowed in {laws.name}!</div>
                  <div style={{color:C.muted,fontSize:11}}>Mark as to-go order</div>
                </div>
                <div onClick={()=>setToGo(t=>!t)} style={{
                  width:38,height:21,borderRadius:11,cursor:"pointer",transition:"background .2s",
                  background:toGo?C.green:C.border,position:"relative",flexShrink:0,
                }}>
                  <div style={{position:"absolute",top:3,left:toGo?18:3,
                    width:15,height:15,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                </div>
              </div>
            )}

            {laws?.delivery && (
              <div style={{background:"#15182A",border:`1px solid ${C.blue}44`,borderRadius:10,
                padding:"10px 12px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>🛵</span>
                <div style={{flex:1}}>
                  <div style={{color:C.blue,fontWeight:700,fontSize:12}}>Delivery available in {laws.name}</div>
                </div>
                <button style={{background:C.blue,color:"#fff",border:"none",borderRadius:8,
                  padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Order</button>
              </div>
            )}

            {laws && !laws.happyHour && (
              <div style={{background:"#201515",border:`1px solid ${C.red}33`,borderRadius:10,
                padding:"8px 12px",marginBottom:14}}>
                <span style={{color:C.red,fontSize:11}}>🚫 Happy hour banned in {laws.name} — full price only.</span>
              </div>
            )}

            <button onClick={post} disabled={!canPost} style={{
              width:"100%", padding:13, border:"none", borderRadius:12, fontSize:15,
              fontWeight:800, cursor:canPost?"pointer":"not-allowed",
              background:canPost?`linear-gradient(135deg,${C.amber},${C.amberLt})`:"#2A2218",
              color:canPost?"#141210":C.muted, transition:"all .2s",
            }}>Post Check-In 🍻</button>
          </>
        ) : (
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:50,marginBottom:8}}>🍺</div>
            <div style={{color:C.amber,fontSize:21,fontWeight:800,marginBottom:4}}>Cheers!</div>
            <div style={{color:C.muted,fontSize:13}}>Your check-in is live</div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{marginBottom:13}}>
      <label style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:".06em",
        textTransform:"uppercase",display:"block",marginBottom:5}}>{label}</label>
      {children}
    </div>
  );
}

// ── Feed card ─────────────────────────────────────────────────────────────────
function FeedCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const laws = post.state ? STATE_LAWS[post.state] : null;
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,marginBottom:11}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <div style={avatarBox}>{post.avatar||"👤"}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"baseline",gap:6}}>
            <span style={{color:C.cream,fontWeight:700,fontSize:14}}>{post.user}</span>
            {post.handle && <span style={{color:C.muted,fontSize:12}}>{post.handle}</span>}
          </div>
          <div style={{color:C.muted,fontSize:11}}>📍 {post.bar}{post.city?` · ${post.city}`:""}
            {post.state?`, ${post.state}`:""}</div>
        </div>
        <span style={{color:C.muted,fontSize:11,flexShrink:0}}>{post.time}</span>
      </div>
      <div style={{background:"#161208",borderRadius:10,padding:"9px 12px",marginBottom:9,
        border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>🍺</span>
          <div>
            <div style={{color:C.amber,fontWeight:700,fontSize:14}}>{post.beer}</div>
            <StarRow value={post.rating}/>
          </div>
        </div>
      </div>
      {post.note && <p style={{color:C.cream,fontSize:13,margin:"0 0 9px",lineHeight:1.5}}>{post.note}</p>}
      {laws && (
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:9}}>
          {!laws.happyHour && <span style={{fontSize:10,fontWeight:700,...pill(C.red)}}>🚫 No HH in {post.state}</span>}
          {laws.toGo==="permanent" && <span style={{fontSize:10,fontWeight:700,...pill(C.green)}}>🥡 To-go OK</span>}
          {laws.delivery && <span style={{fontSize:10,fontWeight:700,...pill(C.blue)}}>🛵 Delivery</span>}
        </div>
      )}
      <div style={{display:"flex",gap:14,paddingTop:8,borderTop:`1px solid ${C.border}`}}>
        <button onClick={()=>{setLiked(l=>!l);setLikes(n=>liked?n-1:n+1);}}
          style={{background:"none",border:"none",cursor:"pointer",
            color:liked?C.amber:C.muted,fontSize:13,padding:0,fontWeight:liked?700:400}}>
          🍻 {likes}
        </button>
        <button style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:13,padding:0}}>
          💬 {post.comments||0}
        </button>
        <button style={{background:"none",border:"none",cursor:"pointer",color:C.muted,
          fontSize:13,padding:0,marginLeft:"auto"}}>↗ Share</button>
      </div>
    </div>
  );
}

// ── Profile tab ───────────────────────────────────────────────────────────────
function ProfileTab({ user, onLogout }) {
  const stats = [{l:"Beers Logged",v:"47"},{l:"Bars Visited",v:"18"},{l:"Friends",v:"12"}];
  const badges = [
    {icon:"🍺",label:"First Pour",earned:true},{icon:"🏆",label:"18 Logged",earned:true},
    {icon:"🗺️",label:"Bar Hopper",earned:true},{icon:"⭐",label:"Critic",earned:false},
    {icon:"🌍",label:"Explorer",earned:false},{icon:"👑",label:"Legend",earned:false},
  ];
  return (
    <div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,
        padding:"18px 16px",marginBottom:14,textAlign:"center"}}>
        <div style={{...avatarBox,width:60,height:60,fontSize:28,margin:"0 auto 10px"}}>
          {user ? "🧑‍💼" : "👤"}
        </div>
        <div style={{color:C.cream,fontWeight:800,fontSize:18}}>
          {user?.displayName || "Guest"}
        </div>
        {user?.mail && <div style={{color:C.muted,fontSize:12,marginTop:2}}>{user.mail}</div>}
        {user ? (
          <button onClick={onLogout} style={{marginTop:10,background:"none",
            border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 14px",
            color:C.muted,fontSize:12,cursor:"pointer"}}>Sign Out</button>
        ) : (
          <div style={{color:C.muted,fontSize:12,marginTop:4}}>Signed in as guest</div>
        )}
        <div style={{display:"flex",justifyContent:"center",gap:28,marginTop:16}}>
          {stats.map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <div style={{color:C.amber,fontSize:20,fontWeight:800}}>{s.v}</div>
              <div style={{color:C.muted,fontSize:11}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:".06em",
        textTransform:"uppercase",marginBottom:9}}>Badges</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9}}>
        {badges.map(b=>(
          <div key={b.label} style={{background:b.earned?C.card:"#141210",
            border:`1px solid ${b.earned?C.amber+"55":C.border}`,
            borderRadius:12,padding:"12px 8px",textAlign:"center",opacity:b.earned?1:.4}}>
            <div style={{fontSize:22,marginBottom:3}}>{b.icon}</div>
            <div style={{color:b.earned?C.cream:C.muted,fontSize:11,fontWeight:600}}>{b.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── State picker modal ────────────────────────────────────────────────────────
function StatePickerModal({ onSelect, onClose }) {
  const [q, setQ] = useState("");
  const list = US_STATES.filter(s=>s.name.toLowerCase().includes(q.toLowerCase())||s.code.includes(q.toUpperCase()));
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.85)",
      backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.card,borderRadius:16,width:"100%",maxWidth:380,
        maxHeight:"80vh",display:"flex",flexDirection:"column",border:`1px solid ${C.border}`}}>
        <div style={{padding:"14px 14px 0"}}>
          <div style={{color:C.cream,fontWeight:800,fontSize:15,marginBottom:10}}>Select your state</div>
          <input value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Search…" style={{...inp(false),marginBottom:8}}/>
        </div>
        <div style={{overflowY:"auto",padding:"0 8px 14px"}}>
          {list.map(s=>{
            const l=STATE_LAWS[s.code];
            return (
              <button key={s.code} onClick={()=>onSelect(s.code)}
                style={{width:"100%",background:"none",border:"none",cursor:"pointer",
                  display:"flex",alignItems:"center",gap:10,padding:"9px 8px",
                  borderBottom:`1px solid ${C.border}`}}>
                <div style={{flex:1,textAlign:"left"}}>
                  <div style={{color:C.cream,fontSize:13,fontWeight:600}}>{s.name}</div>
                  <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                    {l.happyHour?<span style={{fontSize:9,...pill(C.green)}}>🍻 HH</span>
                                :<span style={{fontSize:9,...pill(C.red)}}>🚫 No HH</span>}
                    {l.toGo&&<span style={{fontSize:9,...pill(C.amber)}}>🥡</span>}
                    {l.delivery&&<span style={{fontSize:9,...pill(C.blue)}}>🛵</span>}
                  </div>
                </div>
                <span style={{color:C.muted,fontSize:12}}>›</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Dark map style ────────────────────────────────────────────────────────────
const darkMapStyles = [
  {elementType:"geometry",stylers:[{color:"#1a1610"}]},
  {elementType:"labels.text.stroke",stylers:[{color:"#111009"}]},
  {elementType:"labels.text.fill",stylers:[{color:"#7A6E60"}]},
  {featureType:"road",elementType:"geometry",stylers:[{color:"#2c2618"}]},
  {featureType:"road",elementType:"geometry.stroke",stylers:[{color:"#111009"}]},
  {featureType:"road.highway",elementType:"geometry",stylers:[{color:"#3a3020"}]},
  {featureType:"water",elementType:"geometry",stylers:[{color:"#0d0e14"}]},
  {featureType:"poi",elementType:"geometry",stylers:[{color:"#1c1a14"}]},
  {featureType:"poi.park",elementType:"geometry",stylers:[{color:"#141a10"}]},
  {featureType:"transit",elementType:"geometry",stylers:[{color:"#1a1810"}]},
];

// ── Mock feed ─────────────────────────────────────────────────────────────────
const MOCK_FEED = [
  {id:1,user:"Jake M.",handle:"@jakemac",avatar:"🧔",beer:"Goose Island IPA",rating:4,bar:"The Rusty Anchor",state:"IL",city:"Chicago",note:"Perfect pour tonight 🍺",time:"8 min ago",likes:14,comments:3},
  {id:2,user:"Sara K.",handle:"@saraK",avatar:"👩‍🦱",beer:"Modelo Especial",rating:5,bar:"Lola's Cantina",state:"TX",city:"Austin",note:"$3 Modelos til 7 — happy hour wins.",time:"22 min ago",likes:31,comments:7},
  {id:3,user:"Derek P.",handle:"@dp_taps",avatar:"🧑",beer:"Guinness Stout",rating:5,bar:"O'Malley's Pub",state:"MA",city:"Boston",note:"Best Guinness outside Dublin.",time:"1 hr ago",likes:58,comments:12},
  {id:4,user:"Carlos V.",handle:"@cvegasdrinks",avatar:"🧑‍🦱",beer:"Dogfish Head 60 Min",rating:5,bar:"Craft & Draft",state:"CO",city:"Denver",note:"Ordered to-go on the walk home. Love CO 🥡",time:"2 hr ago",likes:19,comments:2},
];

// ── Root app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]             = useState(null);   // null = not logged in
  const [authed, setAuthed]         = useState(false);  // has chosen guest or ms
  const [tab, setTab]               = useState("feed");
  const [feed, setFeed]             = useState(MOCK_FEED);
  const [showModal, setShowModal]   = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [location, setLocation]     = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError]     = useState(null);

  const laws = location?.state ? STATE_LAWS[location.state] : null;

  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) { setShowPicker(true); return; }
    setGpsLoading(true); setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const geo = await reverseGeocode(lat, lng);
        setGpsLoading(false);
        if (geo?.state && STATE_LAWS[geo.state]) {
          setLocation({ ...geo, lat, lng });
        } else {
          setGpsError("Couldn't detect state."); setShowPicker(true);
        }
      },
      () => { setGpsLoading(false); setGpsError("Location denied."); setShowPicker(true); },
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => { if (authed) requestGPS(); }, [authed]);

  function handleMsLogin({ profile }) {
    setUser(profile);
    setAuthed(true);
  }

  function handlePost(data) {
    const post = {
      id: Date.now(),
      user: user?.displayName || "Guest",
      avatar: user ? "🧑‍💼" : "👤",
      state: location?.state || "??",
      city:  location?.city  || "",
      time:  "Just now",
      likes: 0, comments: 0,
      ...data,
    };
    setFeed(f => [post, ...f]);
    setTab("feed");
  }

  if (!authed) return (
    <AuthScreen
      onLogin={handleMsLogin}
      onGuest={() => setAuthed(true)}
    />
  );

  const TABS = [
    { key:"feed",   icon:"🍻", label:"Feed"    },
    { key:"nearby", icon:"📍", label:"Nearby"  },
    { key:"profile",icon:"👤", label:"Profile" },
  ];

  return (
    <div style={{minHeight:"100vh",background:C.bg,
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
      display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto",position:"relative"}}>

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:10,background:C.bg,
        borderBottom:`1px solid ${C.border}`,padding:"13px 16px 10px",
        display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{color:C.amber,fontSize:25,fontWeight:900,letterSpacing:"-1px",lineHeight:1}}>
            18<span style={{color:C.cream}}>Beers</span>
          </div>
          {user && <div style={{color:C.muted,fontSize:11,marginTop:1}}>Hey, {user.displayName?.split(" ")[0]} 👋</div>}
        </div>
        <button onClick={()=>setShowModal(true)} style={{
          background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
          color:"#141210",border:"none",borderRadius:11,
          padding:"9px 14px",fontSize:13,fontWeight:800,cursor:"pointer",
        }}>🍺 Check In</button>
      </div>

      {/* Content */}
      <div style={{flex:1,padding:"13px 13px 80px",overflowY:"auto"}}>
        {tab==="feed" && (
          <>
            {gpsLoading && (
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,
                padding:"10px 14px",marginBottom:12,color:C.muted,fontSize:13}}>
                📡 Detecting your location…
              </div>
            )}
            {location && laws && (
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,
                padding:"10px 14px",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <span style={{color:C.cream,fontWeight:700,fontSize:13}}>
                    📍 {location.city}{location.city?", ":""}{laws.name}
                  </span>
                  <button onClick={()=>setShowPicker(true)} style={{background:"none",
                    border:`1px solid ${C.border}`,borderRadius:7,padding:"3px 9px",
                    color:C.muted,fontSize:11,cursor:"pointer"}}>Change</button>
                </div>
                <LawBadges laws={laws}/>
              </div>
            )}
            <div style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:".06em",
              textTransform:"uppercase",marginBottom:10}}>Friends & Following</div>
            {feed.map(p=><FeedCard key={p.id} post={p}/>)}
          </>
        )}
        {tab==="nearby"  && <NearbyTab location={location} laws={laws} user={user}/>}
        {tab==="profile" && <ProfileTab user={user} onLogout={()=>{setUser(null);setAuthed(false);}}/>}
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:480,background:C.card,borderTop:`1px solid ${C.border}`,
        display:"flex",justifyContent:"space-around",padding:"9px 0 15px",zIndex:10}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{background:"none",border:"none",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"0 18px"}}>
            <span style={{fontSize:20,opacity:tab===t.key?1:.4}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:".04em",textTransform:"uppercase",
              color:tab===t.key?C.amber:C.muted}}>{t.label}</span>
          </button>
        ))}
      </div>

      {showModal && (
        <CheckInModal onClose={()=>setShowModal(false)} onPost={handlePost}
          location={location} laws={laws} user={user}/>
      )}
      {showPicker && (
        <StatePickerModal
          onSelect={code=>{setLocation(l=>({...l,state:code,city:""}));setShowPicker(false);}}
          onClose={()=>setShowPicker(false)}/>
      )}
    </div>
  );
}
