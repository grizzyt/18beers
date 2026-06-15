import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

// ── Design tokens ─────────────────────────────────────────────────────────────
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
};

const MAPS_KEY = "";

// ── Shared style helpers ──────────────────────────────────────────────────────
const avatarBox = {
  width:40, height:40, borderRadius:"50%", background:"#2A2218",
  border:"2px solid #E8A020", display:"flex", alignItems:"center",
  justifyContent:"center", fontSize:20, flexShrink:0,
};
const inp = (active) => ({
  width:"100%", background:"#161208",
  border:"1px solid " + (active ? "#E8A020" : "#2C2618"),
  borderRadius:10, padding:"10px 13px", color:"#F0E8D4", fontSize:14,
  outline:"none", boxSizing:"border-box", transition:"border-color .2s",
});
const pill = (color) => ({
  color, background:color+"18", border:"1px solid "+color+"33",
  borderRadius:20, padding:"3px 8px",
});

// ── State liquor law database ─────────────────────────────────────────────────
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

// ── Google Maps loader ────────────────────────────────────────────────────────
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

// ── Shared components ─────────────────────────────────────────────────────────
function StarRow({ value, onChange }) {
  return (
    <div style={{display:"flex",gap:2}}>
      {[1,2,3,4,5].map(n=>(
        <span key={n} onClick={()=>onChange?.(n)}
          style={{cursor:onChange?"pointer":"default",fontSize:20,
            color:n<=value?"#E8A020":"#3A3228"}}>★</span>
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
      {laws.toGo==="permanent" && <span style={{fontSize:10,fontWeight:700,...pill(C.amber)}}>🥡 To-Go (Permanent)</span>}
      {laws.toGo==="temporary" && <span style={{fontSize:10,fontWeight:700,...pill(C.amber)}}>🥡 To-Go (Temp)</span>}
      {!laws.toGo              && <span style={{fontSize:10,fontWeight:700,...pill(C.red)}}>🚫 No To-Go</span>}
      {laws.delivery
        ? <span style={{fontSize:10,fontWeight:700,...pill(C.blue)}}>🛵 Delivery OK</span>
        : <span style={{fontSize:10,fontWeight:700,...pill(C.red)}}>🚫 No Delivery</span>}
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

function InitialsAvatar({ name, size=40 }) {
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
  const colors = ["#E8A020","#4CAF6E","#4A9EE0","#E05050","#9B59B6"];
  const color = colors[(name||"").charCodeAt(0) % colors.length];
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:color+"33",
      border:`2px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:size*0.35,fontWeight:800,color,flexShrink:0}}>
      {initials}
    </div>
  );
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode]       = useState("login"); // "login" | "signup"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleSubmit() {
    setLoading(true); setError(null); setSuccess(null);
    if (mode === "signup") {
      const { data, error: e } = await supabase.auth.signUp({
        email, password,
        options: { data: { display_name: name || email.split("@")[0] } }
      });
      if (e) { setError(e.message); setLoading(false); return; }
      // Update profile display name
      if (data.user) {
        await supabase.from("profiles").upsert({ id: data.user.id, display_name: name || email.split("@")[0] });
      }
      setSuccess("Account created! Check your email to confirm, then log in.");
      setMode("login");
    } else {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) { setError(e.message); setLoading(false); return; }
      // onAuth will be called by the auth listener in root
    }
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:24,
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:56,marginBottom:10}}>🍺</div>
        <div style={{color:C.amber,fontSize:36,fontWeight:900,letterSpacing:"-1.5px",lineHeight:1}}>
          18<span style={{color:C.cream}}>Beers</span>
        </div>
        <div style={{color:C.muted,fontSize:13,marginTop:8}}>Check in. Drink up. Share the round.</div>
      </div>

      <div style={{width:"100%",maxWidth:360}}>
        {/* Tab toggle */}
        <div style={{display:"flex",background:C.card,borderRadius:12,padding:4,
          border:`1px solid ${C.border}`,marginBottom:20}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError(null);setSuccess(null);}}
              style={{flex:1,padding:"9px 0",border:"none",borderRadius:9,cursor:"pointer",
                fontWeight:700,fontSize:13,transition:"all .2s",
                background:mode===m?C.amber:"none",
                color:mode===m?"#141210":C.muted}}>
              {m==="login"?"Sign In":"Create Account"}
            </button>
          ))}
        </div>

        {success && (
          <div style={{background:"#1A2015",border:`1px solid ${C.green}44`,borderRadius:10,
            padding:"10px 14px",marginBottom:14,color:C.green,fontSize:13}}>{success}</div>
        )}
        {error && (
          <div style={{background:"#201515",border:`1px solid ${C.red}44`,borderRadius:10,
            padding:"10px 14px",marginBottom:14,color:C.red,fontSize:13}}>{error}</div>
        )}

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {mode==="signup" && (
            <input value={name} onChange={e=>setName(e.target.value)}
              placeholder="Display name (e.g. Jake M.)"
              style={inp(!!name)}/>
          )}
          <input value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="Email" type="email" style={inp(!!email)}/>
          <input value={password} onChange={e=>setPassword(e.target.value)}
            placeholder="Password" type="password" style={inp(!!password)}
            onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>

          <button onClick={handleSubmit} disabled={loading||!email||!password}
            style={{padding:13,border:"none",borderRadius:12,fontSize:15,fontWeight:800,
              cursor:email&&password?"pointer":"not-allowed",marginTop:4,
              background:email&&password?`linear-gradient(135deg,${C.amber},${C.amberLt})`:"#2A2218",
              color:email&&password?"#141210":C.muted,transition:"all .2s"}}>
            {loading?"...":(mode==="login"?"Sign In 🍺":"Create Account 🍺")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Feed card ─────────────────────────────────────────────────────────────────
function FeedCard({ post, currentUser }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const laws = post.state ? STATE_LAWS[post.state] : null;

  async function handleLike() {
    if (!currentUser) return;
    if (!liked) {
      setLiked(true); setLikes(l=>l+1);
      await supabase.from("likes").insert({ post_id: post.id, user_id: currentUser.id });
      await supabase.from("posts").update({ likes: likes+1 }).eq("id", post.id);
    } else {
      setLiked(false); setLikes(l=>l-1);
      await supabase.from("likes").delete().match({ post_id: post.id, user_id: currentUser.id });
      await supabase.from("posts").update({ likes: likes-1 }).eq("id", post.id);
    }
  }

  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s/60)}m ago`;
    if (s < 86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:14,marginBottom:11}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <InitialsAvatar name={post.display_name} size={40}/>
        <div style={{flex:1}}>
          <span style={{color:C.cream,fontWeight:700,fontSize:14}}>{post.display_name || "Someone"}</span>
          <div style={{color:C.muted,fontSize:11,marginTop:1}}>
            📍 {post.bar_name}{post.city ? ` · ${post.city}` : ""}{post.state ? `, ${post.state}` : ""}
          </div>
        </div>
        <span style={{color:C.muted,fontSize:11,flexShrink:0}}>{timeAgo(post.created_at)}</span>
      </div>

      <div style={{background:"#161208",borderRadius:10,padding:"9px 12px",marginBottom:9,
        border:`1px solid ${C.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>🍺</span>
          <div>
            <div style={{color:C.amber,fontWeight:700,fontSize:14}}>{post.beer}</div>
            <StarRow value={post.rating}/>
          </div>
          {post.to_go && <span style={{marginLeft:"auto",fontSize:10,...pill(C.green)}}>🥡 To-go</span>}
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
        <button onClick={handleLike}
          style={{background:"none",border:"none",cursor:"pointer",
            color:liked?C.amber:C.muted,fontSize:13,padding:0,fontWeight:liked?700:400}}>
          🍻 {likes}
        </button>
        <button style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:13,padding:0}}>
          💬 0
        </button>
        <button style={{background:"none",border:"none",cursor:"pointer",color:C.muted,
          fontSize:13,padding:0,marginLeft:"auto"}}>↗ Share</button>
      </div>
    </div>
  );
}

// ── Check-in modal ────────────────────────────────────────────────────────────
function CheckInModal({ onClose, onPost, location, laws, currentUser, preselectedBar="" }) {
  const [beer,   setBeer]   = useState("");
  const [rating, setRating] = useState(0);
  const [bar,    setBar]    = useState(preselectedBar);
  const [note,   setNote]   = useState("");
  const [toGo,   setToGo]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [posted, setPosted] = useState(false);
  const barInputRef = useRef(null);

  useEffect(() => {
    if (!window.google?.maps?.places || !barInputRef.current || preselectedBar) return;
    const ac = new window.google.maps.places.Autocomplete(barInputRef.current, {
      types:["establishment"], fields:["name","place_id"],
    });
    ac.addListener("place_changed", () => {
      const p = ac.getPlace();
      if (p?.name) setBar(p.name);
    });
  }, [preselectedBar]);

  const canPost = beer && rating && bar;

  async function post() {
    if (!canPost || saving) return;
    setSaving(true);
    const entry = {
      user_id: currentUser.id,
      display_name: currentUser.user_metadata?.display_name || currentUser.email?.split("@")[0],
      beer, rating,
      bar_name: bar,
      place_id: null,
      city: location?.city || null,
      state: location?.state || null,
      note: note || null,
      to_go: toGo,
      likes: 0,
    };
    const { data, error } = await supabase.from("posts").insert(entry).select().single();
    setSaving(false);
    if (!error && data) {
      setPosted(true);
      setTimeout(() => { onPost(data); onClose(); }, 1000);
    }
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
            <h2 style={{color:C.cream,fontSize:18,fontWeight:800,margin:"0 0 14px"}}>🍺 Check In</h2>

            <Field label="What are you drinking?">
              <input value={beer} onChange={e=>setBeer(e.target.value)}
                placeholder="e.g. Goose Island IPA" style={inp(!!beer)}/>
            </Field>
            <Field label="Rate it"><StarRow value={rating} onChange={setRating}/></Field>
            <Field label="Bar / Location">
              <input ref={barInputRef} value={bar} onChange={e=>setBar(e.target.value)}
                placeholder="Search for a bar…" style={inp(!!bar)} readOnly={!!preselectedBar}/>
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
                </div>
                <div onClick={()=>setToGo(t=>!t)} style={{width:38,height:21,borderRadius:11,
                  cursor:"pointer",background:toGo?C.green:C.border,position:"relative",flexShrink:0}}>
                  <div style={{position:"absolute",top:3,left:toGo?18:3,width:15,height:15,
                    borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                </div>
              </div>
            )}

            {laws && !laws.happyHour && (
              <div style={{background:"#201515",border:`1px solid ${C.red}33`,borderRadius:10,
                padding:"8px 12px",marginBottom:14}}>
                <span style={{color:C.red,fontSize:11}}>🚫 Happy hour banned in {laws.name}.</span>
              </div>
            )}

            <button onClick={post} disabled={!canPost||saving}
              style={{width:"100%",padding:13,border:"none",borderRadius:12,fontSize:15,
                fontWeight:800,cursor:canPost?"pointer":"not-allowed",
                background:canPost?`linear-gradient(135deg,${C.amber},${C.amberLt})`:"#2A2218",
                color:canPost?"#141210":C.muted}}>
              {saving?"Posting…":"Post Check-In 🍻"}
            </button>
          </>
        ) : (
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:50,marginBottom:8}}>🍺</div>
            <div style={{color:C.amber,fontSize:21,fontWeight:800}}>Cheers!</div>
            <div style={{color:C.muted,fontSize:13,marginTop:4}}>Your check-in is live</div>
          </div>
        )}
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}

// ── Feed tab ──────────────────────────────────────────────────────────────────
function FeedTab({ location, laws, currentUser, onCheckIn }) {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load
    supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setPosts(data); setLoading(false); });

    // Realtime subscription
    const channel = supabase.channel("posts-feed")
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"posts" },
        payload => setPosts(prev => [payload.new, ...prev]))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div>
      {location && laws && (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,
          padding:"10px 14px",marginBottom:12}}>
          <div style={{color:C.cream,fontWeight:700,fontSize:13}}>
            📍 {location.city}{location.city?", ":""}{laws.name}
          </div>
          <LawBadges laws={laws}/>
        </div>
      )}
      <div style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:".06em",
        textTransform:"uppercase",marginBottom:10}}>Latest Check-ins</div>
      {loading ? (
        <div style={{textAlign:"center",padding:40,color:C.muted}}>Loading posts…</div>
      ) : posts.length === 0 ? (
        <div style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:40,marginBottom:10}}>🍺</div>
          <div style={{color:C.cream,fontWeight:700,marginBottom:6}}>No posts yet</div>
          <div style={{color:C.muted,fontSize:13}}>Be the first to check in!</div>
          <button onClick={onCheckIn} style={{marginTop:14,background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
            color:"#141210",border:"none",borderRadius:10,padding:"10px 20px",
            fontWeight:800,fontSize:14,cursor:"pointer"}}>Check In Now 🍺</button>
        </div>
      ) : (
        posts.map(p => <FeedCard key={p.id} post={p} currentUser={currentUser}/>)
      )}
    </div>
  );
}

// ── Nearby tab ────────────────────────────────────────────────────────────────
function NearbyTab({ location, laws, currentUser }) {
  const [mapsReady, setMapsReady]   = useState(!!window.google?.maps);
  const [bars, setBars]             = useState([]);
  const [loadingBars, setLoadingBars] = useState(false);
  const [selectedBar, setSelectedBar] = useState(null);
  const [checkInBar, setCheckInBar] = useState(null);
  const [mapsError, setMapsError]   = useState(null);
  const [barPosts, setBarPosts]     = useState({});
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!MAPS_KEY) { setMapsError("Add your Google Maps key to enable this feature."); return; }
    loadGoogleMaps().then(()=>setMapsReady(true)).catch(()=>setMapsError("Failed to load Google Maps"));
  }, []);

  useEffect(() => {
    if (!mapsReady || !location?.lat) return;
    setLoadingBars(true);
    const tempDiv = document.createElement("div");
    const map = new window.google.maps.Map(tempDiv);
    const svc = new window.google.maps.places.PlacesService(map);
    svc.nearbySearch({ location:{lat:location.lat,lng:location.lng}, radius:1200, type:"bar" },
      (results, status) => {
        setLoadingBars(false);
        if (status==="OK") {
          const top = results.slice(0,12);
          setBars(top);
          // Load post counts for each bar
          const placeIds = top.map(b=>b.place_id).filter(Boolean);
          if (placeIds.length) {
            supabase.from("posts").select("place_id").in("place_id", placeIds)
              .then(({data}) => {
                const counts = {};
                (data||[]).forEach(p=>{ counts[p.place_id]=(counts[p.place_id]||0)+1; });
                setBarPosts(counts);
              });
          }
        } else setMapsError("Places search failed.");
      });
  }, [mapsReady, location?.lat, location?.lng]);

  // Map rendering
  useEffect(() => {
    if (!mapsReady || !location?.lat || !mapRef.current) return;
    if (!mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center:{lat:location.lat,lng:location.lng}, zoom:15,
        styles:darkMapStyles, disableDefaultUI:true, zoomControl:true,
      });
    }
    markersRef.current.forEach(m=>m.setMap(null));
    markersRef.current = [];
    new window.google.maps.Marker({
      position:{lat:location.lat,lng:location.lng}, map:mapInstance.current,
      icon:{path:window.google.maps.SymbolPath.CIRCLE,scale:8,
        fillColor:C.amber,fillOpacity:1,strokeColor:"#fff",strokeWeight:2},zIndex:999,
    });
    bars.forEach(bar=>{
      const count = barPosts[bar.place_id]||0;
      const isSel = selectedBar?.place_id===bar.place_id;
      const marker = new window.google.maps.Marker({
        position:bar.geometry.location, map:mapInstance.current, title:bar.name,
        icon:{path:window.google.maps.SymbolPath.CIRCLE,scale:isSel?14:10,
          fillColor:isSel?C.amberLt:C.amber,fillOpacity:1,
          strokeColor:isSel?"#fff":C.card,strokeWeight:isSel?3:2},
        label:count>0?{text:String(count),color:"#111",fontSize:"10px",fontWeight:"bold"}:undefined,
        zIndex:isSel?100:1,
      });
      marker.addListener("click",()=>setSelectedBar(bar));
      markersRef.current.push(marker);
    });
  }, [mapsReady, bars, selectedBar, barPosts, location]);

  if (!location?.lat) return (
    <div style={{textAlign:"center",padding:"40px 20px"}}>
      <div style={{fontSize:36,marginBottom:10}}>📍</div>
      <div style={{color:C.cream,fontWeight:700,fontSize:15,marginBottom:6}}>Location needed</div>
      <div style={{color:C.muted,fontSize:13}}>Allow location access to see bars near you.</div>
    </div>
  );

  if (mapsError) return (
    <div style={{background:"#201515",border:`1px solid ${C.red}33`,borderRadius:12,padding:16}}>
      <div style={{color:C.red,fontWeight:700,marginBottom:4}}>Maps unavailable</div>
      <div style={{color:C.muted,fontSize:13}}>{mapsError}</div>
    </div>
  );

  return (
    <div>
      <div ref={mapRef} style={{width:"100%",height:240,borderRadius:12,overflow:"hidden",marginBottom:12,
        background:C.card,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {!mapsReady && <span style={{color:C.muted}}>Loading map…</span>}
      </div>

      {laws && (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,
          padding:"10px 14px",marginBottom:12}}>
          <div style={{color:C.cream,fontWeight:700,fontSize:13}}>
            📍 {location.city}{location.city?", ":""}{laws.name}
          </div>
          <LawBadges laws={laws}/>
        </div>
      )}

      {loadingBars ? (
        <div style={{textAlign:"center",padding:30,color:C.muted}}>Finding bars near you…</div>
      ) : bars.map(bar=>{
        const count = barPosts[bar.place_id]||0;
        const isSel = selectedBar?.place_id===bar.place_id;
        return (
          <div key={bar.place_id} onClick={()=>setSelectedBar(bar)}
            style={{background:isSel?"#242018":C.card,
              border:`1px solid ${isSel?C.amber+"66":C.border}`,
              borderRadius:12,padding:"12px 14px",marginBottom:9,cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:C.cream,fontWeight:700,fontSize:14}}>{bar.name}</div>
                <div style={{color:C.muted,fontSize:11,marginTop:2,overflow:"hidden",
                  textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{bar.vicinity}</div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                  {bar.rating&&<span style={{color:C.amber,fontSize:12,fontWeight:700}}>★ {bar.rating}</span>}
                  {bar.opening_hours?.open_now!==undefined&&(
                    <span style={{fontSize:11,fontWeight:600,
                      color:bar.opening_hours.open_now?C.green:C.red}}>
                      {bar.opening_hours.open_now?"Open":"Closed"}
                    </span>
                  )}
                  {laws?.happyHour&&<span style={{fontSize:10,...pill(C.green)}}>🍻 HH</span>}
                  {laws?.toGo&&<span style={{fontSize:10,...pill(C.amber)}}>🥡</span>}
                </div>
              </div>
              <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                {count>0&&<div style={{color:C.amber,fontWeight:800,fontSize:18}}>{count}</div>}
                <div style={{color:C.muted,fontSize:10}}>{count>0?"posts":"no posts"}</div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Bar detail sheet */}
      {selectedBar && (
        <BarSheet bar={selectedBar} laws={laws} currentUser={currentUser}
          onClose={()=>setSelectedBar(null)}
          onCheckIn={()=>{ setCheckInBar(selectedBar); setSelectedBar(null); }}/>
      )}

      {checkInBar && (
        <CheckInModal onClose={()=>setCheckInBar(null)} onPost={()=>setCheckInBar(null)}
          location={location} laws={laws} currentUser={currentUser}
          preselectedBar={checkInBar.name}/>
      )}
    </div>
  );
}

// ── Bar sheet ─────────────────────────────────────────────────────────────────
function BarSheet({ bar, laws, currentUser, onClose, onCheckIn }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("posts").select("*").eq("place_id", bar.place_id)
      .order("created_at", { ascending:false })
      .then(({data}) => { if(data) setPosts(data); setLoading(false); });
  }, [bar.place_id]);

  return (
    <div style={{position:"fixed",inset:0,zIndex:90,background:"rgba(0,0,0,0.72)",
      backdropFilter:"blur(3px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.card,borderRadius:"18px 18px 0 0",width:"100%",maxWidth:480,
        maxHeight:"80vh",display:"flex",flexDirection:"column",border:`1px solid ${C.border}`}}>
        <div style={{width:36,height:4,background:"#3A3228",borderRadius:2,margin:"14px auto 0"}}/>
        <div style={{padding:"14px 16px 10px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10}}>
            <div style={{flex:1}}>
              <div style={{color:C.cream,fontWeight:800,fontSize:17}}>{bar.name}</div>
              <div style={{color:C.muted,fontSize:12,marginTop:2}}>{bar.vicinity}</div>
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
                {bar.rating&&<span style={{color:C.amber,fontWeight:700,fontSize:13}}>★ {bar.rating}</span>}
                {bar.opening_hours?.open_now!==undefined&&(
                  <span style={{fontSize:11,fontWeight:700,
                    color:bar.opening_hours.open_now?C.green:C.red}}>
                    {bar.opening_hours.open_now?"● Open":"● Closed"}
                  </span>
                )}
                <span style={{color:C.muted,fontSize:11}}>{posts.length} post{posts.length!==1?"s":""}</span>
              </div>
            </div>
            <button onClick={onCheckIn} style={{background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
              color:"#141210",border:"none",borderRadius:10,padding:"9px 13px",
              fontSize:12,fontWeight:800,cursor:"pointer",flexShrink:0}}>🍺 Check In</button>
          </div>
          <LawBadges laws={laws}/>
        </div>
        <div style={{overflowY:"auto",padding:"10px 14px 20px",flex:1}}>
          {loading ? <div style={{textAlign:"center",padding:30,color:C.muted}}>Loading…</div>
          : posts.length===0 ? (
            <div style={{textAlign:"center",padding:"28px 0"}}>
              <div style={{fontSize:34,marginBottom:8}}>🍺</div>
              <div style={{color:C.muted,fontSize:13}}>No check-ins yet — be the first!</div>
            </div>
          ) : posts.map((p,i)=>(
            <div key={i} style={{background:"#161208",borderRadius:10,padding:"10px 12px",
              marginBottom:8,border:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <InitialsAvatar name={p.display_name} size={28}/>
                <span style={{color:C.cream,fontWeight:700,fontSize:13}}>{p.display_name}</span>
                <span style={{color:C.muted,fontSize:11,marginLeft:"auto"}}>
                  {Math.floor((Date.now()-new Date(p.created_at))/60000)}m ago
                </span>
              </div>
              <div style={{color:C.amber,fontWeight:700,fontSize:13,marginBottom:3}}>{p.beer}</div>
              <StarRow value={p.rating}/>
              {p.note&&<p style={{color:C.cream,fontSize:12,margin:"6px 0 0",lineHeight:1.5}}>{p.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Profile tab ───────────────────────────────────────────────────────────────
function ProfileTab({ currentUser, onLogout }) {
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const displayName = currentUser?.user_metadata?.display_name || currentUser?.email?.split("@")[0] || "You";

  useEffect(() => {
    supabase.from("posts").select("*").eq("user_id", currentUser.id)
      .order("created_at",{ascending:false})
      .then(({data})=>{ if(data) setPosts(data); setLoading(false); });
  }, [currentUser.id]);

  const badges = [
    {icon:"🍺",label:"First Pour",  earned:posts.length>=1},
    {icon:"🏆",label:"18 Logged",   earned:posts.length>=18},
    {icon:"🗺️",label:"Bar Hopper",  earned:new Set(posts.map(p=>p.bar_name)).size>=5},
    {icon:"⭐",label:"Critic",       earned:posts.filter(p=>p.note).length>=5},
    {icon:"🌍",label:"Explorer",     earned:new Set(posts.map(p=>p.state)).size>=3},
    {icon:"👑",label:"Legend",       earned:posts.length>=50},
  ];

  return (
    <div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,
        padding:"18px 16px",marginBottom:14,textAlign:"center"}}>
        <InitialsAvatar name={displayName} size={60}/>
        <div style={{color:C.cream,fontWeight:800,fontSize:18,marginTop:10}}>{displayName}</div>
        <div style={{color:C.muted,fontSize:12,marginTop:2}}>{currentUser.email}</div>
        <div style={{display:"flex",justifyContent:"center",gap:28,marginTop:16}}>
          {[["Beers",posts.length],["Bars",new Set(posts.map(p=>p.bar_name)).size],
            ["States",new Set(posts.map(p=>p.state).filter(Boolean)).size]].map(([l,v])=>(
            <div key={l} style={{textAlign:"center"}}>
              <div style={{color:C.amber,fontSize:22,fontWeight:800}}>{v}</div>
              <div style={{color:C.muted,fontSize:11}}>{l}</div>
            </div>
          ))}
        </div>
        <button onClick={onLogout} style={{marginTop:14,background:"none",
          border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 18px",
          color:C.muted,fontSize:12,cursor:"pointer"}}>Sign Out</button>
      </div>

      <div style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:".06em",
        textTransform:"uppercase",marginBottom:9}}>Badges</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:16}}>
        {badges.map(b=>(
          <div key={b.label} style={{background:b.earned?C.card:"#141210",
            border:`1px solid ${b.earned?C.amber+"55":C.border}`,
            borderRadius:12,padding:"12px 8px",textAlign:"center",opacity:b.earned?1:.4}}>
            <div style={{fontSize:22,marginBottom:3}}>{b.icon}</div>
            <div style={{color:b.earned?C.cream:C.muted,fontSize:11,fontWeight:600}}>{b.label}</div>
          </div>
        ))}
      </div>

      <div style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:".06em",
        textTransform:"uppercase",marginBottom:9}}>Your Check-ins</div>
      {loading ? <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:20}}>Loading…</div>
      : posts.length===0 ? (
        <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:20}}>No check-ins yet!</div>
      ) : posts.map(p=>(
        <div key={p.id} style={{background:C.card,border:`1px solid ${C.border}`,
          borderRadius:10,padding:"10px 14px",marginBottom:8,
          display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>🍺</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:C.amber,fontWeight:700,fontSize:13}}>{p.beer}</div>
            <div style={{color:C.muted,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {p.bar_name}{p.city?` · ${p.city}`:""}
            </div>
          </div>
          <StarRow value={p.rating}/>
        </div>
      ))}
    </div>
  );
}

// ── State picker ──────────────────────────────────────────────────────────────
function StatePickerModal({ onSelect, onClose }) {
  const [q,setQ] = useState("");
  const list = US_STATES.filter(s=>s.name.toLowerCase().includes(q.toLowerCase())||s.code.includes(q.toUpperCase()));
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.85)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.card,borderRadius:16,width:"100%",maxWidth:380,
        maxHeight:"80vh",display:"flex",flexDirection:"column",border:`1px solid ${C.border}`}}>
        <div style={{padding:"14px 14px 0"}}>
          <div style={{color:C.cream,fontWeight:800,fontSize:15,marginBottom:10}}>Select your state</div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" style={{...inp(false),marginBottom:8}}/>
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
                <span style={{color:C.muted}}>›</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Dark map styles ───────────────────────────────────────────────────────────
const darkMapStyles = [
  {elementType:"geometry",stylers:[{color:"#1a1610"}]},
  {elementType:"labels.text.stroke",stylers:[{color:"#111009"}]},
  {elementType:"labels.text.fill",stylers:[{color:"#7A6E60"}]},
  {featureType:"road",elementType:"geometry",stylers:[{color:"#2c2618"}]},
  {featureType:"road.highway",elementType:"geometry",stylers:[{color:"#3a3020"}]},
  {featureType:"water",elementType:"geometry",stylers:[{color:"#0d0e14"}]},
  {featureType:"poi",elementType:"geometry",stylers:[{color:"#1c1a14"}]},
];

// ── Root app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession]       = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab]               = useState("feed");
  const [showModal, setShowModal]   = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [location, setLocation]     = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const laws = location?.state ? STATE_LAWS[location.state] : null;

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => {
      setSession(session); setAuthLoading(false);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session) => {
      setSession(session); setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // GPS
  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) { setShowPicker(true); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const {latitude:lat, longitude:lng} = pos.coords;
        const geo = await reverseGeocode(lat, lng);
        setGpsLoading(false);
        if (geo?.state && STATE_LAWS[geo.state]) setLocation({...geo,lat,lng});
        else setShowPicker(true);
      },
      () => { setGpsLoading(false); setShowPicker(true); },
      {timeout:10000}
    );
  }, []);

  useEffect(() => { if (session) requestGPS(); }, [session]);

  if (authLoading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",
      justifyContent:"center",fontFamily:"'Inter',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🍺</div>
        <div style={{color:C.muted,fontSize:14}}>Loading…</div>
      </div>
    </div>
  );

  if (!session) return <AuthScreen onAuth={()=>{}} />;

  const TABS = [{key:"feed",icon:"🍻",label:"Feed"},{key:"nearby",icon:"📍",label:"Nearby"},{key:"profile",icon:"👤",label:"Profile"}];

  return (
    <div style={{minHeight:"100vh",background:C.bg,
      fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
      display:"flex",flexDirection:"column",maxWidth:480,margin:"0 auto"}}>

      <div style={{position:"sticky",top:0,zIndex:10,background:C.bg,
        borderBottom:`1px solid ${C.border}`,padding:"13px 16px 10px",
        display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{color:C.amber,fontSize:25,fontWeight:900,letterSpacing:"-1px",lineHeight:1}}>
            18<span style={{color:C.cream}}>Beers</span>
          </div>
          <div style={{color:C.muted,fontSize:11,marginTop:1}}>Check in. Drink up.</div>
        </div>
        <button onClick={()=>setShowModal(true)} style={{
          background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
          color:"#141210",border:"none",borderRadius:11,
          padding:"9px 14px",fontSize:13,fontWeight:800,cursor:"pointer"}}>
          🍺 Check In
        </button>
      </div>

      <div style={{flex:1,padding:"13px 13px 80px",overflowY:"auto"}}>
        {tab==="feed"    && <FeedTab location={location} laws={laws} currentUser={session.user} onCheckIn={()=>setShowModal(true)}/>}
        {tab==="nearby"  && <NearbyTab location={location} laws={laws} currentUser={session.user}/>}
        {tab==="profile" && <ProfileTab currentUser={session.user} onLogout={()=>supabase.auth.signOut()}/>}
      </div>

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
        <CheckInModal onClose={()=>setShowModal(false)} onPost={()=>setShowModal(false)}
          location={location} laws={laws} currentUser={session.user}/>
      )}
      {showPicker && (
        <StatePickerModal
          onSelect={code=>{setLocation(l=>({...l,state:code,city:""}));setShowPicker(false);}}
          onClose={()=>setShowPicker(false)}/>
      )}
    </div>
  );
}
