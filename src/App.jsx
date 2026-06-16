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

const MAPS_KEY = "AIzaSyC9eQ826QANnf_GvuRVRQLIBceKmfrHicE";

// ── Style helpers ─────────────────────────────────────────────────────────────
const avatarBox = {
  width:40, height:40, borderRadius:"50%", background:"#2A2218",
  border:"2px solid #E8A020", display:"flex", alignItems:"center",
  justifyContent:"center", fontSize:20, flexShrink:0,
};
const inp = (active) => ({
  width:"100%", background:"#161208",
  border:"1px solid " + (active ? C.amber : C.border),
  borderRadius:10, padding:"10px 13px", color:C.cream, fontSize:14,
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
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
    s.async = true;
    s.onload = () => resolve(window.google.maps);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return mapsPromise;
}

// ── Reverse geocode ───────────────────────────────────────────────────────────
async function reverseGeocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers:{"Accept-Language":"en"} }
    );
    const d = await r.json();
    const state = d?.address?.["ISO3166-2-lvl4"]?.replace("US-","") || null;
    return { city: d?.address?.city || d?.address?.town || d?.address?.county || "", state };
  } catch { return null; }
}

// ── Time helper ───────────────────────────────────────────────────────────────
function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

// ── Shared components ─────────────────────────────────────────────────────────
function StarRow({ value, onChange }) {
  return (
    <div style={{display:"flex",gap:2}}>
      {[1,2,3,4,5].map(n=>(
        <span key={n} onClick={()=>onChange?.(n)}
          style={{cursor:onChange?"pointer":"default",fontSize:20,
            color:n<=value?C.amber:"#3A3228"}}>★</span>
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
      {laws.toGo==="permanent"&&<span style={{fontSize:10,fontWeight:700,...pill(C.amber)}}>🥡 To-Go Permanent</span>}
      {laws.toGo==="temporary"&&<span style={{fontSize:10,fontWeight:700,...pill(C.amber)}}>🥡 To-Go Temp</span>}
      {!laws.toGo&&<span style={{fontSize:10,fontWeight:700,...pill(C.red)}}>🚫 No To-Go</span>}
      {laws.delivery
        ?<span style={{fontSize:10,fontWeight:700,...pill(C.blue)}}>🛵 Delivery OK</span>
        :<span style={{fontSize:10,fontWeight:700,...pill(C.red)}}>🚫 No Delivery</span>}
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
  const colors = [C.amber,C.green,C.blue,"#E05050","#9B59B6"];
  const color = colors[(name||"").charCodeAt(0)%colors.length];
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:color+"22",
      border:`2px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:size*0.35,fontWeight:800,color,flexShrink:0}}>
      {initials}
    </div>
  );
}

// ── Star display (half-star visual) ──────────────────────────────────────────
function StarDisplay({ value, size=16 }) {
  return (
    <span style={{color:C.amber,fontSize:size,fontWeight:700,letterSpacing:1}}>
      {"★".repeat(Math.floor(value))}{"☆".repeat(5-Math.floor(value))}
      <span style={{color:C.muted,fontSize:size*0.75,marginLeft:4}}>({value.toFixed(1)})</span>
    </span>
  );
}

// ── Auth Screen ───────────────────────────────────────────────────────────────
function AuthScreen() {
  const [mode,setMode]         = useState("login");
  const [email,setEmail]       = useState("");
  const [password,setPassword] = useState("");
  const [name,setName]         = useState("");
  const [loading,setLoading]   = useState(false);
  const [error,setError]       = useState(null);
  const [success,setSuccess]   = useState(null);

  async function handleSubmit() {
    setLoading(true); setError(null); setSuccess(null);
    if (mode==="signup") {
      const displayName = name || email.split("@")[0];
      const { data, error:e } = await supabase.auth.signUp({
        email, password, options:{ data:{ display_name:displayName } }
      });
      if (e) { setError(e.message); setLoading(false); return; }
      if (data.user) await supabase.from("profiles").upsert({ id:data.user.id, display_name:displayName });
      setSuccess("Account created! Check your email to confirm, then sign in.");
      setMode("login");
    } else {
      const { error:e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) setError(e.message);
    }
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:24,
      fontFamily:"'Inter',-apple-system,sans-serif"}}>
      <div style={{textAlign:"center",marginBottom:36}}>
        <div style={{fontSize:56,marginBottom:10}}>🍺</div>
        <div style={{color:C.amber,fontSize:36,fontWeight:900,letterSpacing:"-1.5px",lineHeight:1}}>
          18<span style={{color:C.cream}}>Beers</span>
        </div>
        <div style={{color:C.muted,fontSize:13,marginTop:8}}>Check in. Drink up. Share the round.</div>
      </div>
      <div style={{width:"100%",maxWidth:360}}>
        <div style={{display:"flex",background:C.card,borderRadius:12,padding:4,
          border:`1px solid ${C.border}`,marginBottom:20}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError(null);setSuccess(null);}}
              style={{flex:1,padding:"9px 0",border:"none",borderRadius:9,cursor:"pointer",
                fontWeight:700,fontSize:13,transition:"all .2s",
                background:mode===m?C.amber:"none",color:mode===m?"#141210":C.muted}}>
              {m==="login"?"Sign In":"Create Account"}
            </button>
          ))}
        </div>
        {success&&<div style={{background:"#1A2015",border:`1px solid ${C.green}44`,borderRadius:10,
          padding:"10px 14px",marginBottom:14,color:C.green,fontSize:13}}>{success}</div>}
        {error&&<div style={{background:"#201515",border:`1px solid ${C.red}44`,borderRadius:10,
          padding:"10px 14px",marginBottom:14,color:C.red,fontSize:13}}>{error}</div>}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {mode==="signup"&&(
            <input value={name} onChange={e=>setName(e.target.value)}
              placeholder="Display name" style={inp(!!name)}/>
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
              color:email&&password?"#141210":C.muted}}>
            {loading?"...":(mode==="login"?"Sign In 🍺":"Create Account 🍺")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bar Page (full-screen) ────────────────────────────────────────────────────
function BarPage({ barName, placeId, laws, currentUser, location, onBack, onPostTap, onUserTap }) {
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sortBy, setSortBy]     = useState("likes"); // "likes" | "recent"
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    loadPosts();
    // Realtime for new posts at this bar
    const channel = supabase.channel("bar-posts-"+placeId)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"posts" },
        p => { if (p.new.place_id===placeId || p.new.bar_name===barName) setPosts(prev=>[p.new,...prev]); })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [placeId, barName]);

  async function loadPosts() {
    setLoading(true);
    const query = placeId
      ? supabase.from("posts").select("*").eq("place_id", placeId)
      : supabase.from("posts").select("*").eq("bar_name", barName);
    const { data } = await query.order("created_at", { ascending:false });
    setPosts(data || []);
    setLoading(false);
  }

  const sorted = [...posts].sort((a,b) =>
    sortBy==="likes" ? (b.likes-a.likes) : (new Date(b.created_at)-new Date(a.created_at))
  );

  // Aggregate stats
  const avgRating = posts.length
    ? (posts.reduce((s,p)=>s+p.rating,0)/posts.length)
    : null;
  const beerCounts = {};
  posts.forEach(p=>{ beerCounts[p.beer]=(beerCounts[p.beer]||0)+1; });
  const topBeer = Object.entries(beerCounts).sort((a,b)=>b[1]-a[1])[0]?.[0];

  return (
    <div style={{position:"fixed",inset:0,zIndex:150,background:C.bg,
      display:"flex",flexDirection:"column",
      fontFamily:"'Inter',-apple-system,sans-serif",overflowY:"auto"}}>

      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,
        padding:"14px 16px",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
          <button onClick={onBack} style={{background:"none",border:"none",
            color:C.amber,fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>‹</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:C.cream,fontWeight:800,fontSize:17,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{barName}</div>
            {laws && <div style={{color:C.muted,fontSize:11,marginTop:1}}>{laws.name}</div>}
          </div>
          <button onClick={()=>setShowCheckIn(true)} style={{
            background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
            color:"#141210",border:"none",borderRadius:10,
            padding:"9px 13px",fontSize:12,fontWeight:800,cursor:"pointer",flexShrink:0}}>
            🍺 Check In
          </button>
        </div>

        {/* Stats row */}
        <div style={{display:"flex",gap:12,marginBottom:8}}>
          <div style={{background:"#161208",borderRadius:10,padding:"10px 14px",flex:1,
            border:`1px solid ${C.border}`}}>
            <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",
              letterSpacing:".06em",marginBottom:4}}>Avg Rating</div>
            {avgRating
              ? <StarDisplay value={avgRating}/>
              : <span style={{color:C.muted,fontSize:13}}>No ratings yet</span>}
          </div>
          <div style={{background:"#161208",borderRadius:10,padding:"10px 14px",flex:1,
            border:`1px solid ${C.border}`}}>
            <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",
              letterSpacing:".06em",marginBottom:4}}>Check-ins</div>
            <span style={{color:C.cream,fontWeight:800,fontSize:18}}>{posts.length}</span>
          </div>
          {topBeer && (
            <div style={{background:"#161208",borderRadius:10,padding:"10px 14px",flex:2,
              border:`1px solid ${C.border}`}}>
              <div style={{color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",
                letterSpacing:".06em",marginBottom:4}}>Most Popular</div>
              <div style={{color:C.amber,fontWeight:700,fontSize:12,
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🍺 {topBeer}</div>
            </div>
          )}
        </div>

        {laws && <LawBadges laws={laws}/>}
      </div>

      {/* Sort tabs */}
      <div style={{display:"flex",gap:0,padding:"10px 14px 0"}}>
        {[["likes","🍻 Most Liked"],["recent","🕐 Most Recent"]].map(([k,label])=>(
          <button key={k} onClick={()=>setSortBy(k)}
            style={{flex:1,padding:"8px 0",border:"none",cursor:"pointer",
              fontWeight:700,fontSize:12,transition:"all .15s",
              background:"none",
              color:sortBy===k?C.amber:C.muted,
              borderBottom:`2px solid ${sortBy===k?C.amber:"transparent"}`}}>
            {label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div style={{flex:1,padding:"10px 14px 30px"}}>
        {loading ? (
          <div style={{textAlign:"center",padding:40,color:C.muted}}>Loading…</div>
        ) : sorted.length===0 ? (
          <div style={{textAlign:"center",padding:"40px 0"}}>
            <div style={{fontSize:40,marginBottom:10}}>🍺</div>
            <div style={{color:C.cream,fontWeight:700,marginBottom:6}}>No check-ins yet</div>
            <div style={{color:C.muted,fontSize:13,marginBottom:16}}>Be the first to post here!</div>
            <button onClick={()=>setShowCheckIn(true)}
              style={{background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
                color:"#141210",border:"none",borderRadius:10,
                padding:"10px 20px",fontWeight:800,fontSize:14,cursor:"pointer"}}>
              Check In Now 🍺
            </button>
          </div>
        ) : sorted.map(post=>(
          <BarPostCard key={post.id} post={post} currentUser={currentUser} onPostTap={onPostTap} onUserTap={onUserTap}/>
        ))}
      </div>

      {showCheckIn && (
        <CheckInModal
          onClose={()=>setShowCheckIn(false)}
          onPost={newPost=>{ setPosts(prev=>[newPost,...prev]); setShowCheckIn(false); }}
          location={location} laws={laws} currentUser={currentUser}
          preselectedBar={barName} preselectedPlaceId={placeId}/>
      )}
    </div>
  );
}

// ── Comment thread ────────────────────────────────────────────────────────────
function CommentThread({ postId, currentUser, onUserTap }) {
  const [comments, setComments] = useState([]);
  const [body, setBody]         = useState("");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    supabase.from("comments").select("*").eq("post_id", postId)
      .order("created_at", { ascending:true })
      .then(({ data }) => { if (data) setComments(data); setLoading(false); });

    const ch = supabase.channel("comments-" + postId)
      .on("postgres_changes", { event:"INSERT", schema:"public", table:"comments" },
        p => { if (p.new.post_id === postId) setComments(prev => [...prev, p.new]); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [postId]);

  async function submit() {
    if (!body.trim() || saving) return;
    setSaving(true);
    const entry = {
      post_id: postId,
      user_id: currentUser.id,
      display_name: currentUser.user_metadata?.display_name || currentUser.email?.split("@")[0],
      body: body.trim(),
    };
    const { data } = await supabase.from("comments").insert(entry).select().single();
    if (data) setComments(prev => [...prev, data]);
    setBody(""); setSaving(false);
  }

  return (
    <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
      {loading ? (
        <div style={{color:C.muted,fontSize:12,padding:"4px 0"}}>Loading comments…</div>
      ) : comments.length === 0 ? (
        <div style={{color:C.muted,fontSize:12,padding:"2px 0"}}>No comments yet. Be first!</div>
      ) : comments.map(c => (
        <div key={c.id} style={{display:"flex",gap:8,marginBottom:8}}>
          <InitialsAvatar name={c.display_name} size={26}/>
          <div style={{flex:1,background:"#161208",borderRadius:10,padding:"7px 10px",
            border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:3}}>
              <span onClick={()=>onUserTap?.({id:c.user_id,display_name:c.display_name})}
                style={{color:C.cream,fontWeight:700,fontSize:12,cursor:"pointer"}}>{c.display_name}</span>
              <span style={{color:C.muted,fontSize:10}}>{timeAgo(c.created_at)}</span>
            </div>
            <div style={{color:C.cream,fontSize:13,lineHeight:1.4}}>{c.body}</div>
          </div>
        </div>
      ))}

      {/* Comment input */}
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <InitialsAvatar name={currentUser.user_metadata?.display_name||currentUser.email} size={26}/>
        <div style={{flex:1,display:"flex",gap:6}}>
          <input value={body} onChange={e=>setBody(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="Add a comment…"
            style={{...inp(false),padding:"7px 11px",fontSize:13,flex:1}}/>
          <button onClick={submit} disabled={!body.trim()||saving}
            style={{background:body.trim()?C.amber:"#2A2218",color:body.trim()?"#141210":C.muted,
              border:"none",borderRadius:10,padding:"0 12px",fontSize:13,
              fontWeight:800,cursor:body.trim()?"pointer":"not-allowed",flexShrink:0}}>
            {saving?"…":"↑"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Post actions row (likes + comments, shared by FeedCard and BarPostCard) ──
function PostActions({ post, currentUser, showComments, onToggleComments }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [busy,  setBusy]  = useState(false);
  const [commentCount]    = useState(post.comment_count || 0);

  // Fetch real like count + whether current user has liked
  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      supabase.from("posts").select("likes").eq("id", post.id).single(),
      supabase.from("likes").select("id").match({ post_id:post.id, user_id:currentUser.id }).maybeSingle(),
    ]).then(([countRes, likedRes]) => {
      if (countRes.data) setLikes(countRes.data.likes || 0);
      if (likedRes.data) setLiked(true);
    });
  }, [post.id, currentUser?.id]);

  async function handleLike() {
    if (!currentUser || busy) return;
    setBusy(true);
    if (!liked) {
      setLiked(true);
      setLikes(l => l + 1);
      const { error } = await supabase.from("likes").insert({ post_id:post.id, user_id:currentUser.id });
      if (!error) {
        await supabase.rpc("increment_likes", { post_id: post.id });
      } else {
        setLiked(false);
        setLikes(l => l - 1);
      }
    } else {
      setLiked(false);
      setLikes(l => Math.max(0, l - 1));
      await supabase.from("likes").delete().match({ post_id:post.id, user_id:currentUser.id });
      await supabase.rpc("decrement_likes", { post_id: post.id });
    }
    setBusy(false);
  }

  return (
    <div style={{paddingTop:8,borderTop:`1px solid ${C.border}`}}>
      <div style={{display:"flex",gap:14}}>
        <button onClick={handleLike} disabled={busy}
          style={{background:"none",border:"none",
            cursor:busy?"default":"pointer", padding:0,
            color:liked?C.amber:C.muted,
            fontSize:13, fontWeight:liked?700:400,
            display:"flex", alignItems:"center", gap:4}}>
          🍻 {likes}
        </button>
        <button onClick={onToggleComments}
          style={{background:"none",border:"none",cursor:"pointer",padding:0,
            color:showComments?C.amber:C.muted,fontSize:13,
            display:"flex",alignItems:"center",gap:4}}>
          💬 {commentCount}
        </button>
      </div>
    </div>
  );
}

// ── Bar post card (used inside BarPage) ───────────────────────────────────────
function BarPostCard({ post, currentUser, onPostTap, onUserTap }) {
  return (
    <div onClick={()=>onPostTap?.(post)}
      style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,
        padding:14,marginBottom:11,cursor:"pointer"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <InitialsAvatar name={post.display_name} size={38}/>
        <div style={{flex:1}}>
          <span style={{color:C.cream,fontWeight:700,fontSize:14}}>{post.display_name||"Someone"}</span>
          <div style={{color:C.muted,fontSize:11,marginTop:1}}>{timeAgo(post.created_at)}</div>
        </div>
        {post.to_go&&<span style={{fontSize:10,...pill(C.green)}}>🥡 To-go</span>}
      </div>

      <div style={{background:"#161208",borderRadius:10,padding:"9px 12px",marginBottom:9,
        border:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:22}}>🍺</span>
        <div>
          <div style={{color:C.amber,fontWeight:700,fontSize:14}}>{post.beer}</div>
          <StarRow value={post.rating}/>
        </div>
      </div>

      {post.note&&<p style={{color:C.cream,fontSize:13,margin:"0 0 10px",lineHeight:1.5}}>{post.note}</p>}

      <div onClick={e=>e.stopPropagation()}>
        <PostActions post={post} currentUser={currentUser}
          showComments={false} onToggleComments={()=>onPostTap?.(post)}/>
      </div>
    </div>
  );
}


// ── Post detail page ──────────────────────────────────────────────────────────
function PostPage({ post, currentUser, onBack, onBarTap, onUserTap }) {
  const laws = post.state ? STATE_LAWS[post.state] : null;

  return (
    <div style={{position:"fixed",inset:0,zIndex:160,background:C.bg,
      display:"flex",flexDirection:"column",
      fontFamily:"'Inter',-apple-system,sans-serif"}}>

      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,
        padding:"14px 16px",display:"flex",alignItems:"center",gap:12,
        position:"sticky",top:0,zIndex:10}}>
        <button onClick={onBack} style={{background:"none",border:"none",
          color:C.amber,fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>‹</button>
        <div style={{color:C.cream,fontWeight:800,fontSize:16}}>Post</div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"14px 14px 40px"}}>
        {/* Post body */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,
          borderRadius:14,padding:16,marginBottom:14}}>

          {/* Author row */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <div onClick={()=>onUserTap?.({id:post.user_id,display_name:post.display_name})} style={{cursor:"pointer"}}>
              <InitialsAvatar name={post.display_name} size={44}/>
            </div>
            <div style={{flex:1}}>
              <div onClick={()=>onUserTap?.({id:post.user_id,display_name:post.display_name})}
                style={{color:C.cream,fontWeight:800,fontSize:15,cursor:"pointer"}}>{post.display_name||"Someone"}</div>
              <div style={{marginTop:3}}>
                <button onClick={()=>onBarTap?.(post)}
                  style={{background:"none",border:"none",padding:0,cursor:"pointer",
                    color:C.amber,fontSize:12,fontWeight:600,textDecoration:"underline",
                    textDecorationColor:C.amber+"66",textUnderlineOffset:2}}>
                  📍 {post.bar_name}
                </button>
                <span style={{color:C.muted,fontSize:12}}>
                  {post.city?` · ${post.city}`:""}
                  {post.state?`, ${post.state}`:""}
                </span>
              </div>
              <div style={{color:C.muted,fontSize:11,marginTop:2}}>{timeAgo(post.created_at)}</div>
            </div>
          </div>

          {/* Beer block */}
          <div style={{background:"#161208",borderRadius:12,padding:"12px 14px",
            marginBottom:12,border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:32}}>🍺</span>
              <div>
                <div style={{color:C.amber,fontWeight:800,fontSize:17}}>{post.beer}</div>
                <StarRow value={post.rating}/>
              </div>
              {post.to_go&&<span style={{marginLeft:"auto",fontSize:11,...pill(C.green)}}>🥡 To-go</span>}
            </div>
          </div>

          {/* Note */}
          {post.note&&(
            <p style={{color:C.cream,fontSize:15,margin:"0 0 12px",lineHeight:1.6}}>{post.note}</p>
          )}

          {/* Law badges */}
          {laws&&(
            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
              {!laws.happyHour&&<span style={{fontSize:10,fontWeight:700,...pill(C.red)}}>🚫 No HH in {post.state}</span>}
              {laws.toGo==="permanent"&&<span style={{fontSize:10,fontWeight:700,...pill(C.green)}}>🥡 To-go OK</span>}
              {laws.delivery&&<span style={{fontSize:10,fontWeight:700,...pill(C.blue)}}>🛵 Delivery</span>}
            </div>
          )}

          {/* Likes + comment count */}
          <PostActions post={post} currentUser={currentUser}
            showComments={true} onToggleComments={()=>{}}/>
        </div>

        {/* Comments section */}
        <div style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:".06em",
          textTransform:"uppercase",marginBottom:10}}>Comments</div>
        <CommentThread postId={post.id} currentUser={currentUser} onUserTap={onUserTap} alwaysOpen/>
      </div>
    </div>
  );
}

// ── Feed card — tap to open PostPage ─────────────────────────────────────────
function FeedCard({ post, currentUser, onBarTap, onPostTap, onUserTap }) {
  const laws = post.state ? STATE_LAWS[post.state] : null;

  return (
    <div onClick={()=>onPostTap?.(post)}
      style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,
        padding:14,marginBottom:11,cursor:"pointer"}}>

      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <div onClick={e=>{e.stopPropagation();onUserTap?.({id:post.user_id,display_name:post.display_name});}}
          style={{cursor:"pointer"}}>
          <InitialsAvatar name={post.display_name} size={40}/>
        </div>
        <div style={{flex:1}}>
          <span onClick={e=>{e.stopPropagation();onUserTap?.({id:post.user_id,display_name:post.display_name});}}
            style={{color:C.cream,fontWeight:700,fontSize:14,cursor:"pointer"}}>{post.display_name||"Someone"}</span>
          <div style={{marginTop:2}}>
            <button onClick={e=>{e.stopPropagation();onBarTap?.(post);}}
              style={{background:"none",border:"none",padding:0,cursor:"pointer",
                color:C.amber,fontSize:11,fontWeight:600,textDecoration:"underline",
                textDecorationColor:C.amber+"66",textUnderlineOffset:2}}>
              📍 {post.bar_name}
            </button>
            <span style={{color:C.muted,fontSize:11}}>
              {post.city?` · ${post.city}`:""}
              {post.state?`, ${post.state}`:""}
            </span>
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
          {post.to_go&&<span style={{marginLeft:"auto",fontSize:10,...pill(C.green)}}>🥡 To-go</span>}
        </div>
      </div>

      {post.note&&<p style={{color:C.cream,fontSize:13,margin:"0 0 9px",lineHeight:1.5}}>{post.note}</p>}

      {laws&&(
        <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:9}}>
          {!laws.happyHour&&<span style={{fontSize:10,fontWeight:700,...pill(C.red)}}>🚫 No HH in {post.state}</span>}
          {laws.toGo==="permanent"&&<span style={{fontSize:10,fontWeight:700,...pill(C.green)}}>🥡 To-go OK</span>}
          {laws.delivery&&<span style={{fontSize:10,fontWeight:700,...pill(C.blue)}}>🛵 Delivery</span>}
        </div>
      )}

      {/* Action row — stop propagation so taps don't open post page */}
      <div onClick={e=>e.stopPropagation()}>
        <PostActions post={post} currentUser={currentUser}
          showComments={false} onToggleComments={()=>onPostTap?.(post)}/>
      </div>
    </div>
  );
}

// ── Check-in modal ────────────────────────────────────────────────────────────
function CheckInModal({ onClose, onPost, location, laws, currentUser, preselectedBar="", preselectedPlaceId=null }) {
  const [beer,setBeer]         = useState("");
  const [rating,setRating]     = useState(0);
  const [bar,setBar]           = useState(preselectedBar);
  const [placeId,setPlaceId]   = useState(preselectedPlaceId);
  const [note,setNote]         = useState("");
  const [toGo,setToGo]         = useState(false);
  const [tagged,setTagged]     = useState([]);
  const [saving,setSaving]     = useState(false);
  const [posted,setPosted]     = useState(false);
  const barInputRef = useRef(null);

  function toggleTag(friend) {
    setTagged(t => t.some(f=>f.id===friend.id) ? t.filter(f=>f.id!==friend.id) : [...t, friend]);
  }

  useEffect(() => {
    if (!window.google?.maps?.places || !barInputRef.current || preselectedBar) return;
    const ac = new window.google.maps.places.Autocomplete(barInputRef.current, {
      types:["establishment"], fields:["name","place_id"],
    });
    ac.addListener("place_changed", () => {
      const p = ac.getPlace();
      if (p?.name) { setBar(p.name); setPlaceId(p.place_id||null); }
    });
  }, [preselectedBar]);

  const canPost = beer && rating && bar;

  async function post() {
    if (!canPost||saving) return;
    setSaving(true);
    const entry = {
      user_id: currentUser.id,
      display_name: currentUser.user_metadata?.display_name || currentUser.email?.split("@")[0],
      beer, rating, bar_name:bar, place_id:placeId,
      city:location?.city||null, state:location?.state||null,
      note:note||null, to_go:toGo, likes:0,
    };
    const { data, error } = await supabase.from("posts").insert(entry).select().single();
    if (!error && data && tagged.length > 0) {
      await supabase.from("post_tags").insert(
        tagged.map(f => ({ post_id:data.id, user_id:f.id, display_name:f.display_name }))
      );
    }
    setSaving(false);
    if (!error&&data) { setPosted(true); setTimeout(()=>{ onPost(data); onClose(); },1000); }
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.8)",
      backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.card,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,
        padding:"18px 18px 34px",border:`1px solid ${C.border}`,animation:"slideUp .25s ease"}}>
        <div style={{width:36,height:4,background:"#3A3228",borderRadius:2,margin:"0 auto 16px"}}/>
        {!posted ? (
          <>
            <h2 style={{color:C.cream,fontSize:18,fontWeight:800,margin:"0 0 14px"}}>
              🍺 Check In{preselectedBar?` @ ${preselectedBar}`:""}
            </h2>
            <Field label="What are you drinking?">
              <input value={beer} onChange={e=>setBeer(e.target.value)}
                placeholder="e.g. Goose Island IPA" style={inp(!!beer)}/>
            </Field>
            <Field label="Rate it"><StarRow value={rating} onChange={setRating}/></Field>
            {!preselectedBar && (
              <Field label="Bar / Location">
                <input ref={barInputRef} value={bar} onChange={e=>setBar(e.target.value)}
                  placeholder="Search for a bar…" style={inp(!!bar)}/>
              </Field>
            )}
            <FriendPicker currentUser={currentUser} selected={tagged} onToggle={toggleTag}/>

            <Field label="Note (optional)">
              <textarea value={note} onChange={e=>setNote(e.target.value)}
                placeholder="How's the vibe?" rows={2}
                style={{...inp(false),resize:"none",lineHeight:1.5}}/>
            </Field>
            {laws?.toGo&&(
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
            {laws&&!laws.happyHour&&(
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

// ── Demo seeder ───────────────────────────────────────────────────────────────
const DEMO_POSTS = [
  { display_name:"Jake M.",   beer:"Goose Island IPA",        rating:4, bar_name:"The Rusty Anchor", city:"Chicago",   state:"IL", note:"Perfect pour, super chill vibes tonight 🍺",                 to_go:false, likes:14 },
  { display_name:"Sara K.",   beer:"Modelo Especial",          rating:5, bar_name:"Lola's Cantina",   city:"Austin",    state:"TX", note:"$3 Modelos til 7 — happy hour is undefeated.",               to_go:false, likes:31 },
  { display_name:"Derek P.",  beer:"Guinness Stout",           rating:5, bar_name:"O'Malley's Pub",   city:"Boston",    state:"MA", note:"Best Guinness outside Dublin. No debate.",                   to_go:false, likes:58 },
  { display_name:"Mia R.",    beer:"Blue Moon",                rating:3, bar_name:"Rooftop 21",       city:"Nashville", state:"TN", note:"Decent beer, incredible view. Worth it for the vibe.",       to_go:false, likes:22 },
  { display_name:"Carlos V.", beer:"Dogfish Head 60 Min",      rating:5, bar_name:"Craft & Draft",    city:"Denver",    state:"CO", note:"Ordered this to go on the walk home. Love Colorado 🥡",     to_go:true,  likes:19 },
  { display_name:"Priya S.",  beer:"Allagash White",           rating:5, bar_name:"The Taproom",      city:"Portland",  state:"ME", note:"This is my happy place. Every. Single. Time.",               to_go:false, likes:27 },
  { display_name:"Marcus T.", beer:"Coors Banquet",            rating:4, bar_name:"Ziggy's Bar",      city:"Billings",  state:"MT", note:"Sometimes you just need a Banquet. No notes.",               to_go:false, likes:11 },
  { display_name:"Emma L.",   beer:"Lagunitas IPA",            rating:4, bar_name:"The Back Bar",     city:"Seattle",   state:"WA", note:"Rainy night, great beer, good music. Solid combo.",          to_go:false, likes:9  },
  { display_name:"Jake M.",   beer:"Three Floyds Zombie Dust", rating:5, bar_name:"The Rusty Anchor", city:"Chicago",   state:"IL", note:"If you know you know. Best pale ale in the midwest.",        to_go:false, likes:44 },
  { display_name:"Sara K.",   beer:"Lone Star",                rating:3, bar_name:"The White Horse",  city:"Austin",    state:"TX", note:"It's the national beer of Texas. You drink it. End of story.",to_go:false, likes:18 },
  { display_name:"Priya S.",  beer:"Shipyard Pumpkinhead",     rating:2, bar_name:"The Taproom",      city:"Portland",  state:"ME", note:"Fall beer season is a trap. Still drank the whole thing.",   to_go:false, likes:6  },
  { display_name:"Marcus T.", beer:"Big Sky Moose Drool",      rating:5, bar_name:"Ziggy's Bar",      city:"Billings",  state:"MT", note:"Montana people don't mess around with their brown ales.",    to_go:true,  likes:33 },
  { display_name:"Emma L.",   beer:"Fremont Lush IPA",         rating:5, bar_name:"Optimism Brewing", city:"Seattle",   state:"WA", note:"Fresh hop season hits different up here. Unreal.",           to_go:false, likes:41 },
  { display_name:"Derek P.",  beer:"Sam Adams Boston Lager",   rating:4, bar_name:"O'Malley's Pub",   city:"Boston",    state:"MA", note:"Tourist trap but the beer is always cold and I respect it.", to_go:false, likes:15 },
  { display_name:"Carlos V.", beer:"Breckenridge Avalanche",   rating:4, bar_name:"Craft & Draft",    city:"Denver",    state:"CO", note:"Oldest bar in Denver. Order the Avalanche. Trust me.",       to_go:false, likes:22 },
];
async function seedDemoPosts() {
  const demoUserId = "00000000-0000-0000-0000-000000000001";
  const rows = DEMO_POSTS.map((p,i)=>({
    ...p, user_id:demoUserId, place_id:null,
    created_at: new Date(Date.now()-(i*18*60*1000)).toISOString(),
  }));
  await supabase.from("posts").insert(rows);
}

// ── Feed tab ──────────────────────────────────────────────────────────────────
function FeedTab({ location, laws, currentUser, onCheckIn, onBarTap, onPostTap, onUserTap, friendIds }) {
  const [posts,setPosts]     = useState([]);
  const [loading,setLoading] = useState(true);
  const [filter,setFilter]   = useState("all"); // "all" | "friends" 

  useEffect(() => {
    supabase.from("posts").select("*").order("created_at",{ascending:false}).limit(50)
      .then(async ({data})=>{
        if (data&&data.length===0) {
          await seedDemoPosts();
          const {data:seeded} = await supabase.from("posts").select("*")
            .order("created_at",{ascending:false}).limit(50);
          if (seeded) setPosts(seeded);
        } else if (data) setPosts(data);
        setLoading(false);
      });
    const channel = supabase.channel("posts-feed")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"posts"},
        p=>setPosts(prev=>[p.new,...prev]))
      .subscribe();
    return ()=>supabase.removeChannel(channel);
  }, []);

  return (
    <div>
      {location&&laws&&(
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,
          padding:"10px 14px",marginBottom:12}}>
          <div style={{color:C.cream,fontWeight:700,fontSize:13}}>
            📍 {location.city}{location.city?", ":""}{laws.name}
          </div>
          <LawBadges laws={laws}/>
        </div>
      )}
      {/* Friends / All toggle */}
      <div style={{display:"flex",background:C.card,borderRadius:10,padding:3,
        border:`1px solid ${C.border}`,marginBottom:12}}>
        {[["all","🌍 Everyone"],["friends","🍻 Friends"]].map(([k,label])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{flex:1,padding:"7px 0",border:"none",borderRadius:8,cursor:"pointer",
              fontWeight:700,fontSize:12,transition:"all .2s",
              background:filter===k?C.amber:"none",
              color:filter===k?"#141210":C.muted}}>
            {label}
          </button>
        ))}
      </div>
      <div style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:".06em",
        textTransform:"uppercase",marginBottom:10}}>
        {filter==="friends" ? "Friends' Check-ins" : "Latest Check-ins"}
      </div>
      {loading ? (
        <div style={{textAlign:"center",padding:40,color:C.muted}}>Loading…</div>
      ) : posts.length===0 ? (
        <div style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:40,marginBottom:10}}>🍺</div>
          <div style={{color:C.cream,fontWeight:700,marginBottom:6}}>No posts yet</div>
          <button onClick={onCheckIn} style={{background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
            color:"#141210",border:"none",borderRadius:10,padding:"10px 20px",
            fontWeight:800,fontSize:14,cursor:"pointer"}}>Check In Now 🍺</button>
        </div>
      ) : posts.map(p=>(
        <FeedCard key={p.id} post={p} currentUser={currentUser} onBarTap={onBarTap} onPostTap={onPostTap}/>
      ))}
    </div>
  );
}

// ── Nearby tab ────────────────────────────────────────────────────────────────
function NearbyTab({ location, laws, currentUser, onBarTap }) {
  const [mapsReady,setMapsReady]   = useState(!!window.google?.maps);
  const [bars,setBars]             = useState([]);
  const [loadingBars,setLoadingBars] = useState(false);
  const [selectedBar,setSelectedBar] = useState(null);
  const [barPosts,setBarPosts]     = useState({});
  const [mapsError,setMapsError]   = useState(null);
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const markersRef = useRef([]);

  useEffect(()=>{
    if (!MAPS_KEY) { setMapsError("Google Maps key not configured."); return; }
    loadGoogleMaps().then(()=>setMapsReady(true)).catch(()=>setMapsError("Failed to load Google Maps"));
  },[]);

  useEffect(()=>{
    if (!mapsReady||!location?.lat) return;
    setLoadingBars(true);
    const tmp = document.createElement("div");
    const map = new window.google.maps.Map(tmp);
    new window.google.maps.places.PlacesService(map).nearbySearch(
      {location:{lat:location.lat,lng:location.lng},radius:1200,type:"bar"},
      (results,status)=>{
        setLoadingBars(false);
        if (status==="OK") {
          const top = results.slice(0,12); setBars(top);
          const ids = top.map(b=>b.place_id).filter(Boolean);
          if (ids.length) supabase.from("posts").select("place_id").in("place_id",ids)
            .then(({data})=>{
              const counts={};
              (data||[]).forEach(p=>{counts[p.place_id]=(counts[p.place_id]||0)+1;});
              setBarPosts(counts);
            });
        } else setMapsError("Places search failed — make sure Places API is enabled in Google Cloud.");
      }
    );
  },[mapsReady,location?.lat,location?.lng]);

  // Map rendering
  useEffect(()=>{
    if (!mapsReady||!location?.lat||!mapRef.current) return;
    if (!mapInst.current) {
      mapInst.current = new window.google.maps.Map(mapRef.current,{
        center:{lat:location.lat,lng:location.lng},zoom:15,
        styles:darkMapStyles,disableDefaultUI:true,zoomControl:true,
      });
    }
    markersRef.current.forEach(m=>m.setMap(null)); markersRef.current=[];
    new window.google.maps.Marker({
      position:{lat:location.lat,lng:location.lng},map:mapInst.current,
      icon:{path:window.google.maps.SymbolPath.CIRCLE,scale:8,
        fillColor:C.amber,fillOpacity:1,strokeColor:"#fff",strokeWeight:2},zIndex:999,
    });
    bars.forEach(bar=>{
      const count=barPosts[bar.place_id]||0;
      const isSel=selectedBar?.place_id===bar.place_id;
      const m = new window.google.maps.Marker({
        position:bar.geometry.location,map:mapInst.current,title:bar.name,
        icon:{path:window.google.maps.SymbolPath.CIRCLE,scale:isSel?14:10,
          fillColor:isSel?C.amberLt:C.amber,fillOpacity:1,
          strokeColor:isSel?"#fff":C.card,strokeWeight:isSel?3:2},
        label:count>0?{text:String(count),color:"#111",fontSize:"10px",fontWeight:"bold"}:undefined,
        zIndex:isSel?100:1,
      });
      m.addListener("click",()=>setSelectedBar(bar));
      markersRef.current.push(m);
    });
  },[mapsReady,bars,selectedBar,barPosts,location]);

  if (!location?.lat) return (
    <div style={{textAlign:"center",padding:"40px 20px"}}>
      <div style={{fontSize:36,marginBottom:10}}>📍</div>
      <div style={{color:C.cream,fontWeight:700,fontSize:15,marginBottom:6}}>Location needed</div>
      <div style={{color:C.muted,fontSize:13}}>Allow location access to see bars near you.</div>
    </div>
  );

  if (mapsError) return (
    <div style={{background:"#201515",border:`1px solid ${C.red}33`,borderRadius:12,padding:16,margin:4}}>
      <div style={{color:C.red,fontWeight:700,marginBottom:4}}>Maps unavailable</div>
      <div style={{color:C.muted,fontSize:13}}>{mapsError}</div>
    </div>
  );

  return (
    <div>
      <div ref={mapRef} style={{width:"100%",height:240,borderRadius:12,overflow:"hidden",
        marginBottom:12,background:C.card}}>
        {!mapsReady&&<div style={{height:"100%",display:"flex",alignItems:"center",
          justifyContent:"center",color:C.muted}}>Loading map…</div>}
      </div>
      {laws&&(
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
        const count=barPosts[bar.place_id]||0;
        const isSel=selectedBar?.place_id===bar.place_id;
        const avgRating = null; // could load per-bar if needed
        return (
          <div key={bar.place_id}
            onClick={()=>onBarTap({bar_name:bar.name,place_id:bar.place_id,state:location?.state})}
            style={{background:isSel?"#242018":C.card,
              border:`1px solid ${isSel?C.amber+"66":C.border}`,
              borderRadius:12,padding:"12px 14px",marginBottom:9,cursor:"pointer",
              transition:"all .15s"}}>
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
                <div style={{color:C.blue,fontSize:10,marginTop:2}}>View →</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Profile tab ───────────────────────────────────────────────────────────────
function ProfileTab({ currentUser, onLogout, onBarTap, onFriends, onUserTap }) {
  const [posts,setPosts]     = useState([]);
  const [loading,setLoading] = useState(true);
  const [filter,setFilter]   = useState("all"); // "all" | "friends" 
  const displayName = currentUser?.user_metadata?.display_name || currentUser?.email?.split("@")[0]||"You";

  useEffect(()=>{
    supabase.from("posts").select("*").eq("user_id",currentUser.id)
      .order("created_at",{ascending:false})
      .then(({data})=>{ if(data) setPosts(data); setLoading(false); });
  },[currentUser.id]);

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
        <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:14}}>
          <button onClick={onFriends}
            style={{background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
              color:"#141210",border:"none",borderRadius:8,padding:"7px 16px",
              fontWeight:800,fontSize:12,cursor:"pointer"}}>🍻 Friends</button>
          <button onClick={onLogout} style={{background:"none",
            border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 16px",
            color:C.muted,fontSize:12,cursor:"pointer"}}>Sign Out</button>
        </div>
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
      : posts.length===0 ? <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:20}}>No check-ins yet!</div>
      : posts.map(p=>(
        <div key={p.id} onClick={()=>onBarTap?.(p)}
          style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,
          padding:"10px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
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
  const [q,setQ]=useState("");
  const list=US_STATES.filter(s=>s.name.toLowerCase().includes(q.toLowerCase())||s.code.includes(q.toUpperCase()));
  return (
    <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.85)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:20}}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{background:C.card,borderRadius:16,width:"100%",maxWidth:380,
        maxHeight:"80vh",display:"flex",flexDirection:"column",border:`1px solid ${C.border}`}}>
        <div style={{padding:"14px 14px 0"}}>
          <div style={{color:C.cream,fontWeight:800,fontSize:15,marginBottom:10}}>Select your state</div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…"
            style={{...inp(false),marginBottom:8}}/>
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
  const [session,setSession]         = useState(null);
  const [authLoading,setAuthLoading] = useState(true);
  const [tab,setTab]                 = useState("feed");
  const [showModal,setShowModal]     = useState(false);
  const [showPicker,setShowPicker]   = useState(false);
  const [location,setLocation]       = useState(null);
  const [barPage,setBarPage]         = useState(null);
  const [postPage,setPostPage]       = useState(null);
  const [friendsPage,setFriendsPage] = useState(false);
  const [userPage,setUserPage]       = useState(null); // {id, display_name}

  const laws = location?.state ? STATE_LAWS[location.state] : null;
  const barLaws = barPage?.state ? STATE_LAWS[barPage.state] : laws;

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{ setSession(session); setAuthLoading(false); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,s)=>{ setSession(s); setAuthLoading(false); });
    return ()=>subscription.unsubscribe();
  },[]);

  const requestGPS = useCallback(()=>{
    if (!navigator.geolocation) { setShowPicker(true); return; }
    navigator.geolocation.getCurrentPosition(
      async pos=>{
        const {latitude:lat,longitude:lng}=pos.coords;
        const geo=await reverseGeocode(lat,lng);
        if (geo?.state&&STATE_LAWS[geo.state]) setLocation({...geo,lat,lng});
        else setShowPicker(true);
      },
      ()=>setShowPicker(true),
      {timeout:10000}
    );
  },[]);

  useEffect(()=>{ if(session) requestGPS(); },[session]);

  const { friends, incoming, reload: reloadFriends } = useFriends(session?.user);
  const friendIds = new Set(friends.map(f => f.id));

  function handleBarTap(post) {
    setBarPage({ bar_name: post.bar_name, place_id: post.place_id||null, state: post.state||location?.state });
  }

  if (authLoading) return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",
      justifyContent:"center",fontFamily:"'Inter',sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>🍺</div>
        <div style={{color:C.muted,fontSize:14}}>Loading…</div>
      </div>
    </div>
  );

  if (!session) return <AuthScreen/>;

  const TABS=[{key:"feed",icon:"🍻",label:"Feed"},{key:"nearby",icon:"📍",label:"Nearby"},{key:"profile",icon:"👤",label:"Profile"}];

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
        {tab==="feed"    && <FeedTab location={location} laws={laws} currentUser={session.user} onCheckIn={()=>setShowModal(true)} onBarTap={handleBarTap} onPostTap={p=>setPostPage(p)} onUserTap={u=>setUserPage(u)} friendIds={friendIds}/>}
        {tab==="nearby"  && <NearbyTab location={location} laws={laws} currentUser={session.user} onBarTap={handleBarTap}/>}
        {tab==="profile" && <ProfileTab currentUser={session.user} onLogout={()=>supabase.auth.signOut()} onBarTap={handleBarTap} onFriends={()=>setFriendsPage(true)} onUserTap={u=>setUserPage(u)}/>}
      </div>

      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"100%",maxWidth:480,background:C.card,borderTop:`1px solid ${C.border}`,
        display:"flex",justifyContent:"space-around",padding:"9px 0 15px",zIndex:10}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{background:"none",border:"none",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"0 18px"}}>
            <div style={{position:"relative",display:"inline-block"}}>
              <span style={{fontSize:20,opacity:tab===t.key?1:.4}}>{t.icon}</span>
              {t.key==="profile" && incoming.length>0 && (
                <div style={{position:"absolute",top:-2,right:-4,background:C.red,color:"#fff",
                  borderRadius:"50%",width:14,height:14,display:"flex",alignItems:"center",
                  justifyContent:"center",fontSize:9,fontWeight:800}}>{incoming.length}</div>
              )}
            </div>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:".04em",textTransform:"uppercase",
              color:tab===t.key?C.amber:C.muted}}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Friends page */}
      {friendsPage && (
        <FriendsPage currentUser={session.user} onBack={()=>{ setFriendsPage(false); reloadFriends(); }} onUserTap={u=>setUserPage(u)}/>
      )}

      {/* User profile page */}
      {userPage && (
        <UserPage
          userId={userPage.id} displayName={userPage.display_name}
          currentUser={session.user}
          onBack={()=>setUserPage(null)}
          onBarTap={p=>{ setUserPage(null); handleBarTap(p); }}
          onPostTap={p=>setPostPage(p)}
          onUserTap={u=>{ if(u.id!==userPage.id) setUserPage(u); }}/>
      )}

      {/* Post page */}
      {postPage && (
        <PostPage
          post={postPage} currentUser={session.user}
          onBack={()=>setPostPage(null)}
          onBarTap={p=>{ setPostPage(null); handleBarTap(p); }}
          onUserTap={u=>setUserPage(u)}/>
      )}

      {/* Bar page — slides over everything */}
      {barPage && (
        <BarPage
          barName={barPage.bar_name} placeId={barPage.place_id}
          laws={barLaws} currentUser={session.user} location={location}
          onBack={()=>setBarPage(null)}
          onPostTap={p=>setPostPage(p)}
          onUserTap={u=>setUserPage(u)}/>
      )}

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

// ── User profile page ────────────────────────────────────────────────────────
function UserPage({ userId, displayName, currentUser, onBack, onBarTap, onPostTap }) {
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [friendship, setFriendship] = useState(null); // null | {id, status, iRequested}
  const [actionLoading, setActionLoading] = useState(false);

  const isMe = userId === currentUser?.id;

  useEffect(() => {
    // Load their posts
    supabase.from("posts").select("*").eq("user_id", userId)
      .order("created_at", { ascending:false })
      .then(({ data }) => { if (data) setPosts(data); setLoading(false); });

    // Load friendship status
    if (!isMe) {
      supabase.from("friendships").select("*")
        .or(`and(requester_id.eq.${currentUser.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${currentUser.id})`)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setFriendship({ id: data.id, status: data.status, iRequested: data.requester_id === currentUser.id });
        });
    }
  }, [userId]);

  async function sendRequest() {
    setActionLoading(true);
    const { data } = await supabase.from("friendships")
      .insert({ requester_id: currentUser.id, addressee_id: userId, status:"pending" })
      .select().single();
    if (data) setFriendship({ id: data.id, status:"pending", iRequested:true });
    setActionLoading(false);
  }

  async function acceptRequest() {
    setActionLoading(true);
    await supabase.from("friendships").update({ status:"accepted" }).eq("id", friendship.id);
    setFriendship(f => ({...f, status:"accepted"}));
    setActionLoading(false);
  }

  async function removeFriend() {
    setActionLoading(true);
    await supabase.from("friendships").delete().eq("id", friendship.id);
    setFriendship(null);
    setActionLoading(false);
  }

  const avgRating = posts.length
    ? (posts.reduce((s,p) => s + p.rating, 0) / posts.length).toFixed(1)
    : null;
  const uniqueBars = new Set(posts.map(p => p.bar_name)).size;

  // Friend action button
  function FriendButton() {
    if (isMe) return null;
    if (!friendship) return (
      <button onClick={sendRequest} disabled={actionLoading}
        style={{background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
          color:"#141210",border:"none",borderRadius:10,padding:"9px 18px",
          fontWeight:800,fontSize:13,cursor:"pointer"}}>
        {actionLoading ? "…" : "Add Friend 🍻"}
      </button>
    );
    if (friendship.status === "pending" && friendship.iRequested) return (
      <button onClick={removeFriend} disabled={actionLoading}
        style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,
          padding:"9px 18px",color:C.muted,fontSize:13,cursor:"pointer",fontWeight:600}}>
        {actionLoading ? "…" : "Request Sent"}
      </button>
    );
    if (friendship.status === "pending" && !friendship.iRequested) return (
      <div style={{display:"flex",gap:8}}>
        <button onClick={acceptRequest} disabled={actionLoading}
          style={{background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
            color:"#141210",border:"none",borderRadius:10,padding:"9px 16px",
            fontWeight:800,fontSize:13,cursor:"pointer"}}>
          {actionLoading ? "…" : "Accept 🍻"}
        </button>
        <button onClick={removeFriend} disabled={actionLoading}
          style={{background:"none",border:`1px solid ${C.border}`,borderRadius:10,
            padding:"9px 14px",color:C.muted,fontSize:13,cursor:"pointer"}}>
          Decline
        </button>
      </div>
    );
    if (friendship.status === "accepted") return (
      <button onClick={removeFriend} disabled={actionLoading}
        style={{background:"none",border:`1px solid ${C.amber}44`,borderRadius:10,
          padding:"9px 18px",color:C.amber,fontSize:13,cursor:"pointer",fontWeight:700}}>
        {actionLoading ? "…" : "🍻 Friends"}
      </button>
    );
    return null;
  }

  return (
    <div style={{position:"fixed",inset:0,zIndex:165,background:C.bg,
      display:"flex",flexDirection:"column",
      fontFamily:"'Inter',-apple-system,sans-serif"}}>

      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,
        padding:"14px 16px",display:"flex",alignItems:"center",gap:12,
        position:"sticky",top:0,zIndex:10}}>
        <button onClick={onBack} style={{background:"none",border:"none",
          color:C.amber,fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>‹</button>
        <div style={{color:C.cream,fontWeight:800,fontSize:16}}>{displayName}</div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"14px 14px 40px"}}>

        {/* Profile card */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,
          padding:"20px 16px",marginBottom:14,textAlign:"center"}}>
          <InitialsAvatar name={displayName} size={64}/>
          <div style={{color:C.cream,fontWeight:800,fontSize:20,marginTop:10}}>{displayName}</div>

          {/* Stats */}
          <div style={{display:"flex",justifyContent:"center",gap:24,marginTop:16,marginBottom:16}}>
            {[
              ["Beers", posts.length],
              ["Bars",  uniqueBars],
              ["Avg ★", avgRating || "—"],
            ].map(([l,v]) => (
              <div key={l} style={{textAlign:"center"}}>
                <div style={{color:C.amber,fontSize:20,fontWeight:800}}>{v}</div>
                <div style={{color:C.muted,fontSize:11}}>{l}</div>
              </div>
            ))}
          </div>

          <FriendButton/>
        </div>

        {/* Their posts */}
        <div style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:".06em",
          textTransform:"uppercase",marginBottom:10}}>
          {isMe ? "Your Check-ins" : `${displayName.split(" ")[0]}'s Check-ins`}
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:40,color:C.muted}}>Loading…</div>
        ) : posts.length === 0 ? (
          <div style={{textAlign:"center",padding:"30px 0"}}>
            <div style={{fontSize:36,marginBottom:8}}>🍺</div>
            <div style={{color:C.muted,fontSize:13}}>No check-ins yet</div>
          </div>
        ) : posts.map(p => (
          <FeedCard key={p.id} post={p} currentUser={currentUser}
            onBarTap={onBarTap} onPostTap={onPostTap}
            onUserTap={onUserTap}/>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FRIENDS SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

// ── Friends hook ──────────────────────────────────────────────────────────────
function useFriends(currentUser) {
  const [friends, setFriends]         = useState([]); // accepted
  const [incoming, setIncoming]       = useState([]); // pending requests TO me
  const [outgoing, setOutgoing]       = useState([]); // pending requests FROM me
  const [loading, setLoading]         = useState(true);

  const load = useCallback(async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from("friendships")
      .select("*, requester:requester_id(id,display_name:display_name), addressee:addressee_id(id,display_name:display_name)")
      .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`);

    const rows = data || [];
    const accepted = rows.filter(r => r.status === "accepted");
    const pend_in  = rows.filter(r => r.status === "pending" && r.addressee_id === currentUser.id);
    const pend_out = rows.filter(r => r.status === "pending" && r.requester_id === currentUser.id);

    // Resolve the "other person" for each row
    const resolve = (row) => {
      const isRequester = row.requester_id === currentUser.id;
      return {
        friendshipId: row.id,
        id:           isRequester ? row.addressee_id : row.requester_id,
        display_name: isRequester ? row.addressee?.display_name : row.requester?.display_name,
        status:       row.status,
      };
    };

    setFriends(accepted.map(resolve));
    setIncoming(pend_in.map(r => ({ friendshipId:r.id, id:r.requester_id, display_name:r.requester?.display_name })));
    setOutgoing(pend_out.map(r => ({ friendshipId:r.id, id:r.addressee_id, display_name:r.addressee?.display_name })));
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => { load(); }, [load]);

  return { friends, incoming, outgoing, loading, reload: load };
}

// ── User search ───────────────────────────────────────────────────────────────
async function searchUsers(query, currentUserId) {
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name")
    .ilike("display_name", `%${query}%`)
    .neq("id", currentUserId)
    .limit(10);
  return data || [];
}

// ── Friends page ──────────────────────────────────────────────────────────────
function FriendsPage({ currentUser, onBack, onUserTap }) {
  const { friends, incoming, outgoing, loading, reload } = useFriends(currentUser);
  const [tab, setTab]         = useState("friends"); // friends | requests | find
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const friendIds = new Set(friends.map(f => f.id));
  const outgoingIds = new Set(outgoing.map(f => f.id));

  async function handleSearch(q) {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const users = await searchUsers(q, currentUser.id);
    setResults(users);
    setSearching(false);
  }

  async function sendRequest(userId) {
    setActionLoading(l => ({...l, [userId]:true}));
    await supabase.from("friendships").insert({
      requester_id: currentUser.id,
      addressee_id: userId,
      status: "pending",
    });
    await reload();
    setActionLoading(l => ({...l, [userId]:false}));
  }

  async function acceptRequest(friendshipId, userId) {
    setActionLoading(l => ({...l, [userId]:true}));
    await supabase.from("friendships").update({ status:"accepted" }).eq("id", friendshipId);
    await reload();
    setActionLoading(l => ({...l, [userId]:false}));
  }

  async function declineRequest(friendshipId, userId) {
    setActionLoading(l => ({...l, [userId]:true}));
    await supabase.from("friendships").update({ status:"declined" }).eq("id", friendshipId);
    await reload();
    setActionLoading(l => ({...l, [userId]:false}));
  }

  async function removeFriend(friendshipId, userId) {
    setActionLoading(l => ({...l, [userId]:true}));
    await supabase.from("friendships").delete().eq("id", friendshipId);
    await reload();
    setActionLoading(l => ({...l, [userId]:false}));
  }

  const tabs = [
    { key:"friends",  label:`Friends${friends.length ? ` (${friends.length})` : ""}` },
    { key:"requests", label:`Requests${incoming.length ? ` (${incoming.length})` : ""}` },
    { key:"find",     label:"Find Friends" },
  ];

  return (
    <div style={{position:"fixed",inset:0,zIndex:160,background:C.bg,
      display:"flex",flexDirection:"column",fontFamily:"'Inter',-apple-system,sans-serif"}}>

      {/* Header */}
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,
        padding:"14px 16px",display:"flex",alignItems:"center",gap:12,
        position:"sticky",top:0,zIndex:10}}>
        <button onClick={onBack} style={{background:"none",border:"none",
          color:C.amber,fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>‹</button>
        <div style={{color:C.cream,fontWeight:800,fontSize:16}}>Friends</div>
        {incoming.length > 0 && (
          <div style={{marginLeft:"auto",background:C.red,color:"#fff",borderRadius:"50%",
            width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:11,fontWeight:800}}>{incoming.length}</div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",background:C.card,borderBottom:`1px solid ${C.border}`}}>
        {tabs.map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{flex:1,padding:"10px 4px",border:"none",cursor:"pointer",
              background:"none",fontSize:12,fontWeight:700,transition:"all .15s",
              color:tab===t.key?C.amber:C.muted,
              borderBottom:`2px solid ${tab===t.key?C.amber:"transparent"}`}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"14px 14px 30px"}}>

        {/* Friends list */}
        {tab === "friends" && (
          loading ? <div style={{textAlign:"center",padding:40,color:C.muted}}>Loading…</div>
          : friends.length === 0 ? (
            <div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{fontSize:40,marginBottom:10}}>🍻</div>
              <div style={{color:C.cream,fontWeight:700,marginBottom:6}}>No friends yet</div>
              <div style={{color:C.muted,fontSize:13,marginBottom:16}}>Find people to drink with!</div>
              <button onClick={()=>setTab("find")}
                style={{background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
                  color:"#141210",border:"none",borderRadius:10,padding:"10px 20px",
                  fontWeight:800,fontSize:14,cursor:"pointer"}}>Find Friends</button>
            </div>
          ) : friends.map(f => (
            <div key={f.id} style={{background:C.card,border:`1px solid ${C.border}`,
              borderRadius:12,padding:"12px 14px",marginBottom:9,
              display:"flex",alignItems:"center",gap:12}}>
              <div onClick={()=>onUserTap?.({id:f.id,display_name:f.display_name})} style={{cursor:"pointer"}}>
                <InitialsAvatar name={f.display_name} size={40}/>
              </div>
              <div style={{flex:1,cursor:"pointer"}} onClick={()=>onUserTap?.({id:f.id,display_name:f.display_name})}>
                <div style={{color:C.cream,fontWeight:700,fontSize:14}}>{f.display_name||"Unknown"}</div>
                <div style={{color:C.muted,fontSize:11,marginTop:2}}>🍺 Friend</div>
              </div>
              <button onClick={()=>removeFriend(f.friendshipId, f.id)}
                disabled={actionLoading[f.id]}
                style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,
                  padding:"5px 11px",color:C.muted,fontSize:12,cursor:"pointer"}}>
                {actionLoading[f.id] ? "…" : "Remove"}
              </button>
            </div>
          ))
        )}

        {/* Requests */}
        {tab === "requests" && (
          <div>
            {incoming.length > 0 && (
              <>
                <div style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:".06em",
                  textTransform:"uppercase",marginBottom:10}}>Incoming</div>
                {incoming.map(f => (
                  <div key={f.id} style={{background:C.card,border:`1px solid ${C.border}`,
                    borderRadius:12,padding:"12px 14px",marginBottom:9,
                    display:"flex",alignItems:"center",gap:12}}>
                    <div onClick={()=>onUserTap?.({id:f.id,display_name:f.display_name})} style={{cursor:"pointer"}}>
                      <InitialsAvatar name={f.display_name} size={40}/>
                    </div>
                    <div style={{flex:1,cursor:"pointer"}} onClick={()=>onUserTap?.({id:f.id,display_name:f.display_name})}>
                      <div style={{color:C.cream,fontWeight:700,fontSize:14}}>{f.display_name||"Someone"}</div>
                      <div style={{color:C.muted,fontSize:11,marginTop:2}}>wants to be friends</div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>acceptRequest(f.friendshipId, f.id)}
                        disabled={actionLoading[f.id]}
                        style={{background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
                          color:"#141210",border:"none",borderRadius:8,
                          padding:"6px 12px",fontSize:12,fontWeight:800,cursor:"pointer"}}>
                        {actionLoading[f.id] ? "…" : "Accept"}
                      </button>
                      <button onClick={()=>declineRequest(f.friendshipId, f.id)}
                        disabled={actionLoading[f.id]}
                        style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,
                          padding:"6px 10px",color:C.muted,fontSize:12,cursor:"pointer"}}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {outgoing.length > 0 && (
              <>
                <div style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:".06em",
                  textTransform:"uppercase",marginBottom:10,marginTop:incoming.length?16:0}}>Sent</div>
                {outgoing.map(f => (
                  <div key={f.id} style={{background:C.card,border:`1px solid ${C.border}`,
                    borderRadius:12,padding:"12px 14px",marginBottom:9,
                    display:"flex",alignItems:"center",gap:12}}>
                    <InitialsAvatar name={f.display_name} size={40}/>
                    <div style={{flex:1}}>
                      <div style={{color:C.cream,fontWeight:700,fontSize:14}}>{f.display_name||"Someone"}</div>
                      <div style={{color:C.muted,fontSize:11,marginTop:2}}>Request pending</div>
                    </div>
                    <button onClick={()=>removeFriend(f.friendshipId, f.id)}
                      disabled={actionLoading[f.id]}
                      style={{background:"none",border:`1px solid ${C.border}`,borderRadius:8,
                        padding:"5px 11px",color:C.muted,fontSize:12,cursor:"pointer"}}>
                      {actionLoading[f.id] ? "…" : "Cancel"}
                    </button>
                  </div>
                ))}
              </>
            )}

            {incoming.length === 0 && outgoing.length === 0 && (
              <div style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{fontSize:40,marginBottom:10}}>📭</div>
                <div style={{color:C.muted,fontSize:13}}>No pending requests</div>
              </div>
            )}
          </div>
        )}

        {/* Find friends */}
        {tab === "find" && (
          <div>
            <input value={query} onChange={e=>handleSearch(e.target.value)}
              placeholder="Search by name…"
              style={{...inp(!!query),marginBottom:14}}/>

            {searching && <div style={{color:C.muted,fontSize:13,textAlign:"center",padding:20}}>Searching…</div>}

            {results.map(u => {
              const isFriend   = friendIds.has(u.id);
              const isOutgoing = outgoingIds.has(u.id);
              return (
                <div key={u.id} style={{background:C.card,border:`1px solid ${C.border}`,
                  borderRadius:12,padding:"12px 14px",marginBottom:9,
                  display:"flex",alignItems:"center",gap:12}}>
                  <InitialsAvatar name={u.display_name} size={40}/>
                  <div style={{flex:1}}>
                    <div style={{color:C.cream,fontWeight:700,fontSize:14}}>{u.display_name}</div>
                  </div>
                  {isFriend ? (
                    <span style={{fontSize:11,...pill(C.green)}}>🍻 Friends</span>
                  ) : isOutgoing ? (
                    <span style={{fontSize:11,...pill(C.muted)}}>Pending</span>
                  ) : (
                    <button onClick={()=>sendRequest(u.id)}
                      disabled={actionLoading[u.id]}
                      style={{background:`linear-gradient(135deg,${C.amber},${C.amberLt})`,
                        color:"#141210",border:"none",borderRadius:8,
                        padding:"6px 12px",fontSize:12,fontWeight:800,cursor:"pointer"}}>
                      {actionLoading[u.id] ? "…" : "Add Friend"}
                    </button>
                  )}
                </div>
              );
            })}

            {query.length >= 2 && !searching && results.length === 0 && (
              <div style={{textAlign:"center",padding:"30px 0",color:C.muted,fontSize:13}}>
                No users found for "{query}"
              </div>
            )}
            {query.length < 2 && (
              <div style={{textAlign:"center",padding:"30px 0",color:C.muted,fontSize:13}}>
                Type at least 2 characters to search
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tag friends picker (in check-in modal) ────────────────────────────────────
function FriendPicker({ currentUser, selected, onToggle }) {
  const { friends } = useFriends(currentUser);
  if (friends.length === 0) return null;
  return (
    <div style={{marginBottom:14}}>
      <div style={{color:C.muted,fontSize:11,fontWeight:700,letterSpacing:".06em",
        textTransform:"uppercase",marginBottom:8}}>Tag Friends</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {friends.map(f => {
          const isSelected = selected.some(s => s.id === f.id);
          return (
            <button key={f.id} onClick={()=>onToggle(f)}
              style={{display:"flex",alignItems:"center",gap:6,
                background: isSelected ? C.amber+"22" : "#161208",
                border:`1px solid ${isSelected ? C.amber : C.border}`,
                borderRadius:20,padding:"5px 10px 5px 6px",cursor:"pointer"}}>
              <InitialsAvatar name={f.display_name} size={22}/>
              <span style={{color:isSelected?C.amber:C.cream,fontSize:12,fontWeight:600}}>
                {f.display_name}
              </span>
              {isSelected && <span style={{color:C.amber,fontSize:12}}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
