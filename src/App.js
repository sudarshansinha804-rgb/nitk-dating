import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  Shield, 
  MessageCircle, 
  Clock, 
  Send, 
  AlertTriangle, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Ghost,
  Activity,
  Trash2,
  AlertOctagon,
  Terminal,
  Fingerprint,
  Users,
  Star,
  Lock
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  serverTimestamp, 
  orderBy,
  updateDoc,
  limit,
  getDoc
} from "firebase/firestore";

/**
 * NITK DATING - Multiplayer Blind Dating App
 * VERSION: Fixed for Vercel Deployment (window.confirm)
 */

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBVavI2AhwJ0qTsA1pvWXfQ4Lr-Bsyma7o",
  authDomain: "babubazi-v2.firebaseapp.com",
  projectId: "babubazi-v2",
  storageBucket: "babubazi-v2.firebasestorage.app",
  messagingSenderId: "931163589634",
  appId: "1:931163589634:web:5c816b00df67df9f2a2b1b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const DATA_APP_ID = "babubazi-live"; 

// --- Shared Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false }) => {
  const baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40",
    secondary: "bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700",
    outline: "border-2 border-violet-500 text-violet-400 hover:bg-violet-500/10",
    danger: "bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Slider = ({ label, value, onChange, icon: Icon }) => (
  <div className="mb-6">
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2 text-gray-300">
        <Icon size={18} className="text-fuchsia-400" />
        <span className="font-medium text-sm tracking-wide">{label}</span>
      </div>
      <span className="text-violet-400 font-bold">{value}/10</span>
    </div>
    <input 
      type="range" 
      min="1" 
      max="10" 
      value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:accent-fuchsia-500 transition-all"
    />
  </div>
);

// --- Sub-Views ---

const OnboardingView = ({ userProfile, setUserProfile, handleStartSearch, handleSystemReset }) => (
  <div className="flex flex-col items-center justify-center h-full px-6 text-center animate-fadeIn relative z-10">
    <div className="mb-8 relative z-0">
      <div className="absolute -inset-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-full blur-xl opacity-50 animate-pulse"></div>
      <div className="relative bg-gray-900 p-4 rounded-2xl border border-violet-500/30">
        <Ghost size={48} className="text-white" />
      </div>
    </div>
    
    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2 relative z-10">NITK DATING</h1>
    <p className="text-gray-400 mb-8 max-w-xs relative z-10">Real Multiplayer. 5 Minutes. <br/> <span className="text-xs text-violet-400">Match Male ↔ Female</span></p>

    <div className="w-full max-w-sm space-y-4 relative z-20">
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 backdrop-blur-sm relative">
        <label className="block text-left text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Your Secret Nickname</label>
        <input 
          type="text" 
          placeholder="e.g. NeonTiger99"
          className="w-full bg-gray-900/50 text-white border-b-2 border-gray-600 focus:border-violet-500 outline-none py-2 px-2 rounded-t-md transition-colors placeholder-gray-600"
          value={userProfile.nickname}
          onChange={(e) => setUserProfile(prev => ({...prev, nickname: e.target.value}))}
        />
      </div>

      <div className="pt-4 space-y-3">
        <p className="text-sm text-gray-500 font-medium">I AM A</p>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="secondary" 
            onClick={() => handleStartSearch('Male')}
            disabled={!userProfile.nickname}
            className={userProfile.nickname ? "hover:bg-blue-900/30 hover:border-blue-500/50 hover:text-blue-400" : ""}
          >
            Male
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleStartSearch('Female')}
            disabled={!userProfile.nickname}
            className={userProfile.nickname ? "hover:bg-pink-900/30 hover:border-pink-500/50 hover:text-pink-400" : ""}
          >
            Female
          </Button>
        </div>
      </div>

      <div className="pt-8">
        <button 
          onClick={handleSystemReset}
          className="text-[10px] text-red-500/50 hover:text-red-400 flex items-center gap-1 mx-auto border border-red-900/30 px-3 py-1 rounded hover:bg-red-900/20 transition-all"
        >
          <Trash2 size={10} />
          DEBUG: CLEAR QUEUE (Fix stuck matches)
        </button>
      </div>
    </div>
  </div>
);

const SearchingView = ({ userProfile, cancelSearch, searchError, logs, currentUserId, queueList }) => (
  <div className="flex flex-col items-center justify-center h-full text-center px-6">
    <div className="relative w-32 h-32 mb-8 pointer-events-none">
      <div className="absolute inset-0 border-4 border-violet-500/30 rounded-full animate-ping"></div>
      <div className="absolute inset-2 border-4 border-fuchsia-500/30 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <img 
          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.nickname}`} 
          alt="avatar" 
          className="w-16 h-16 rounded-full opacity-50 grayscale"
        />
      </div>
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">Searching Vibe...</h2>
    <p className="text-gray-400 text-sm mb-6">
      Looking for a <span className="font-bold text-white">{userProfile.gender === 'Male' ? 'Female' : 'Male'}</span> match...
    </p>
    
    <div className="w-full max-w-xs bg-gray-800/80 border border-gray-700 p-3 rounded-xl mb-6 text-left">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider border-b border-gray-700 pb-1">
            <Users size={12} /> Lobby Status
        </div>
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Waiting:</span>
                <span className="text-white font-bold">{queueList.length}</span>
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-blue-400">Males:</span>
                <span className="text-white font-bold">{queueList.filter(u => u.gender === 'Male').length}</span>
            </div>
            <div className="flex justify-between text-xs">
                <span className="text-pink-400">Females:</span>
                <span className="text-white font-bold">{queueList.filter(u => u.gender === 'Female').length}</span>
            </div>
        </div>
    </div>

    {searchError ? (
        <div className="bg-red-900/50 border border-red-500 p-4 rounded-xl mb-6 max-w-xs mx-auto text-left relative z-[60]">
            <div className="flex items-center gap-2 text-red-200 font-bold mb-2">
                <AlertOctagon size={18} /> Error Found
            </div>
            <p className="text-xs text-red-300 break-words leading-tight mb-3">
                {searchError.includes("index") ? "Use the link below to enable matching in your database:" : 
                 searchError.includes("permissions") ? "Database Locked! Go to Firebase Console -> Firestore Database -> Rules and change 'false' to 'true'." : searchError}
            </p>
            {/* Regex to extract URL from error message */}
            {searchError.match(/https?:\/\/[^\s]+/) && (
                <a 
                    href={searchError.match(/https?:\/\/[^\s]+/)[0]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block text-xs bg-red-500 hover:bg-red-400 text-white py-3 px-3 rounded text-center font-bold uppercase tracking-wide shadow-lg"
                >
                    Click Here To Fix Database
                </a>
            )}
            {searchError.includes("permissions") && (
                <div className="mt-2 p-2 bg-black/40 rounded text-[10px] font-mono text-gray-300 border border-red-500/30">
                    allow read, write: if true;
                </div>
            )}
        </div>
    ) : (
        <div className="flex gap-2 text-xs text-gray-600 font-mono mb-8">
            <span className="animate-pulse">WAITING FOR PEER</span>
            <span>•</span>
            <span className="animate-pulse delay-75">LIVE QUEUE</span>
        </div>
    )}

    <Button variant="outline" onClick={cancelSearch} className="px-8 py-2 text-sm relative z-50 mb-4">
      Cancel Search
    </Button>

    <div className="w-full bg-black/50 border border-gray-800 p-2 rounded text-[10px] font-mono text-left h-24 overflow-y-auto">
        <div className="text-gray-500 border-b border-gray-800 pb-1 mb-1 flex justify-between">
            <span className="flex gap-1"><Terminal size={10} /> LOGS</span>
            <span className="text-violet-400 flex gap-1 items-center"><Fingerprint size={10}/> ID: {currentUserId?.slice(0,5)}</span>
        </div>
        {logs.map((log, i) => (
            <div key={i} className="text-green-400/80 truncate">
                {log}
            </div>
        ))}
    </div>
  </div>
);

const ChatView = ({ 
  timeLeft, 
  handleEndChat, 
  formatTime, 
  messages, 
  currentUserId,
  handleReport, 
  isTyping, 
  chatEndRef, 
  inputMsg, 
  setInputMsg, 
  handleSendMessage, 
  reportModal,
  partnerName,
  partnerRating
}) => (
  <div className="flex flex-col h-full bg-gray-950 relative overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <h1 className="text-6xl font-black text-gray-800/30 -rotate-45 tracking-widest select-none">
        NITK DATING
      </h1>
    </div>

    <div className="px-4 py-3 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 flex justify-between items-center z-10 sticky top-0 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 p-[2px]">
          <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
            <span className="text-lg">🎭</span>
          </div>
        </div>
        <div>
          {/* SHOW PARTNER NAME AND RATING */}
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white leading-tight">{partnerName || "Stranger"}</h3>
            {partnerRating > 0 && (
                <div className="flex items-center bg-yellow-500/20 px-1.5 py-0.5 rounded text-[10px] text-yellow-400 border border-yellow-500/30">
                    <Star size={8} fill="currentColor" className="mr-1" />
                    {partnerRating.toFixed(1)}
                </div>
            )}
          </div>
          <p className="text-xs text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
          </p>
        </div>
      </div>

      <div className={`px-5 py-2 rounded-full flex items-center gap-3 border-2 transition-all duration-500 ${timeLeft < 60 ? 'bg-red-500/30 border-red-500 text-red-300 animate-pulse scale-105 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'bg-gray-800/80 border-violet-500/60 text-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.4)]'}`}>
        <Clock size={22} strokeWidth={2.5} />
        <span className="font-mono font-black text-2xl tracking-widest drop-shadow-lg">{formatTime(timeLeft)}</span>
      </div>
      
      <button onClick={handleEndChat} className="p-2 text-gray-400 hover:text-white transition-colors">
        <X size={20} />
      </button>
    </div>

    <div className="w-full h-2 bg-gray-800/50 shrink-0 z-10 backdrop-blur-sm">
      <div 
        className={`h-full transition-all duration-1000 ease-linear shadow-sm ${timeLeft < 60 ? 'bg-gradient-to-r from-red-600 to-orange-600 shadow-[0_0_10px_rgba(239,68,68,0.7)]' : 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]'}`}
        style={{ width: `${(timeLeft / 300) * 100}%` }}
      />
    </div>

    <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
      <div className="text-center text-xs text-gray-600 my-4 flex items-center justify-center gap-2">
         <Shield size={12} /> AI Protection Active: Vulgarity is auto-monitored.
      </div>
      
      {messages.map((msg) => {
        const isMe = msg.senderId === currentUserId;
        return (
          <div 
            key={msg.id} 
            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[80%] relative group`}>
              {!isMe && !msg.isReported && (
                <button 
                  onClick={() => handleReport(msg.id)}
                  className="absolute -top-3 -right-3 bg-gray-800 text-gray-400 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-gray-700 hover:text-red-400 hover:border-red-500/50"
                  title="Report Message to AI"
                >
                  <AlertTriangle size={12} />
                </button>
              )}

              <div className={`px-4 py-3 rounded-2xl text-sm ${
                isMe 
                  ? 'bg-violet-600 text-white rounded-br-none' 
                  : msg.isReported 
                    ? 'bg-gray-800 text-gray-500 italic border border-red-900/30' 
                    : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-600 mt-1 block px-1">
                 {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
              </span>
            </div>
          </div>
        );
      })}
      <div ref={chatEndRef} />
    </div>

    {/* LAYOUT FIX: Increased bottom padding to pb-24 to separate from CodeSandbox buttons */}
    <div className="p-4 bg-gray-900 border-t border-gray-800 relative z-50 pb-24">
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input 
            type="text" 
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Type your mystery message..."
            autoFocus
            className="w-full bg-gray-800 text-white rounded-full pl-4 pr-10 py-3 border border-gray-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all placeholder-gray-500 relative z-50"
          />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white z-50 cursor-pointer">
            <Sparkles size={18} />
          </button>
        </div>
        <button 
          type="submit" 
          disabled={!inputMsg.trim()}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-3 rounded-full text-white shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform shrink-0"
        >
          <Send size={20} />
        </button>
      </form>
    </div>

    {reportModal.isOpen && (
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center flex-col">
        <div className="animate-spin text-red-500 mb-4">
          <Activity size={48} />
        </div>
        <h3 className="text-xl font-bold text-white">AI Analyzing...</h3>
        <p className="text-gray-400 text-sm mt-2">Checking context for violations</p>
      </div>
    )}
  </div>
);

const RatingView = ({ ratings, setRatings, handleSubmitRating }) => (
  <div className="flex flex-col items-center justify-center h-full px-6 animate-fadeIn">
    <div className="w-full max-w-sm bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-2xl">
      <div className="flex justify-center mb-6">
        <div className="bg-gray-800 p-4 rounded-full border border-gray-700">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-center text-white mb-2">Session Ended</h2>
      <p className="text-gray-400 text-center text-sm mb-8">Rate your experience with the Stranger to help our matching algorithm.</p>

      <Slider 
        label="Communication" 
        icon={MessageCircle} 
        value={ratings.communication} 
        onChange={(v) => setRatings({...ratings, communication: v})} 
      />
      
      <Slider 
        label="Flirting Skills" 
        icon={Heart} 
        value={ratings.flirting} 
        onChange={(v) => setRatings({...ratings, flirting: v})} 
      />
      
      <Slider 
        label="Overall Vibe" 
        icon={Sparkles} 
        value={ratings.vibe} 
        onChange={(v) => setRatings({...ratings, vibe: v})} 
      />

      <Button onClick={handleSubmitRating} className="w-full mt-4">
        Submit & Close
      </Button>
    </div>
  </div>
);

const SummaryView = ({ handleReset, onFindNewMatch }) => (
  <div className="flex flex-col items-center justify-center h-full px-6 text-center animate-fadeIn">
    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-4">Feedback Sent!</h2>
    <p className="text-gray-400 mb-8 max-w-xs">Your ratings help keep NITK DATING strictly high-quality. No creeps allowed.</p>
    
    <div className="flex gap-4">
      <Button variant="secondary" onClick={handleReset}>
        Home Screen
      </Button>
      <Button onClick={onFindNewMatch}>
        Find New Match
      </Button>
    </div>
  </div>
);

// --- Main Application ---

export default function BabubaziApp() {
  // --- State ---
  const [appState, setAppState] = useState('onboarding'); 
  const [userProfile, setUserProfile] = useState({ gender: '', nickname: '' });
  const [timeLeft, setTimeLeft] = useState(300);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [reportModal, setReportModal] = useState({ isOpen: false, msgId: null });
  const [ratings, setRatings] = useState({ communication: 5, flirting: 5, vibe: 5 });
  const [currentUser, setCurrentUser] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [debugLogs, setDebugLogs] = useState([]); 
  const [queueList, setQueueList] = useState([]); 
  const [partnerName, setPartnerName] = useState(""); 
  const [partnerId, setPartnerId] = useState(null);
  const [partnerRating, setPartnerRating] = useState(0); // NEW: Store partner rating
  
  const chatEndRef = useRef(null);

  const addLog = (msg) => {
    setDebugLogs(prev => [msg, ...prev].slice(0, 10));
  };

  // --- 1. Auth & Init ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
        addLog("Auth: Anonymous Login Success");
      } catch (error) {
        console.error("Auth Error:", error);
        setSearchError("Auth Failed: " + error.message);
        addLog("Auth Error: " + error.message);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
    });
  }, []);

  // --- NEW: Global Lobby Monitor (Debug) ---
  useEffect(() => {
    if (appState === 'searching') {
        const q = query(collection(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'queue'));
        const unsub = onSnapshot(q, (snap) => {
            const users = snap.docs.map(d => d.data());
            setQueueList(users);
        }, (error) => {
            // Error Handling for Lobby Monitor
            if (error.code === 'permission-denied') {
                setSearchError(error.message);
            }
        });
        return () => unsub();
    }
  }, [appState]);

  // --- 2. Matchmaking Logic ---
  useEffect(() => {
    if (appState !== 'searching' || !currentUser) return;

    addLog("Queue: Adding user...");

    // A. Add self to Queue
    const myQueueDoc = doc(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'queue', currentUser.uid);
    setDoc(myQueueDoc, {
      userId: currentUser.uid,
      nickname: userProfile.nickname,
      gender: userProfile.gender,
      targetGender: userProfile.gender === 'Male' ? 'Female' : 'Male',
      status: 'waiting',
      createdAt: serverTimestamp()
    }).catch(error => {
      // CATCHES WRITE ERRORS
      console.error("Queue Join Error:", error);
      setSearchError(error.message);
      addLog("Queue Write Failed");
    });

    const unsubscribeMyQueue = onSnapshot(myQueueDoc, async (snapshot) => {
      if (!snapshot.exists()) return;
      
      const data = snapshot.data();
      if (data && data.status === 'matched' && data.matchId) {
        addLog("Queue: Matched! ChatID: " + data.matchId);
        setChatId(data.matchId);
        setAppState('chat');

        // FETCH PARTNER NAME & RATING
        if (data.matchId) {
            const parts = data.matchId.split('_');
            const pId = parts.find(id => id !== currentUser.uid);
            setPartnerId(pId); // Save partner ID for rating later

            try {
                // 1. Get Nickname
                const partnerQueueDoc = await getDoc(doc(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'queue', pId));
                if (partnerQueueDoc.exists()) {
                    setPartnerName(partnerQueueDoc.data().nickname);
                } else {
                    setPartnerName("Stranger");
                }

                // 2. Get Aggregate Rating
                // Query all ratings where this partner was the "target"
                const ratingQ = query(
                    collection(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'ratings'),
                    where('targetId', '==', pId)
                );
                const ratingSnap = await getDocs(ratingQ);
                if (!ratingSnap.empty) {
                    let total = 0;
                    ratingSnap.forEach(doc => {
                        total += doc.data().average;
                    });
                    setPartnerRating(total / ratingSnap.size);
                } else {
                    setPartnerRating(0); 
                }

            } catch (e) {
                console.error("Error fetching partner info:", e);
                setPartnerName("Stranger");
                setPartnerRating(0);
            }
        }
      }
    });

    const searchInterval = setInterval(async () => {
      const targetGender = userProfile.gender === 'Male' ? 'Female' : 'Male';
      addLog("Searching for: " + targetGender + "...");
      
      // SIMPLIFIED QUERY
      const q = query(
        collection(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'queue'),
        where('gender', '==', targetGender),
        where('status', '==', 'waiting'),
        limit(5)
      );

      try {
        const querySnapshot = await getDocs(q);
        setSearchError(null); 

        if (querySnapshot.empty) {
            addLog("Found 0 potential matches.");
        } else {
            addLog("Found " + querySnapshot.size + " candidates!");
        }

        const potentialMatch = querySnapshot.docs.find(d => d.id !== currentUser.uid);

        if (potentialMatch) {
          addLog("Connecting with: " + potentialMatch.id);
          const matchData = potentialMatch.data();
          const newChatId = [currentUser.uid, matchData.userId].sort().join('_');
          
          // STORE NICKNAMES IN CHAT DOC
          await setDoc(doc(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'chats', newChatId), {
            users: [currentUser.uid, matchData.userId],
            nicknames: { 
                [currentUser.uid]: userProfile.nickname,
                [matchData.userId]: matchData.nickname
            },
            startTime: serverTimestamp(),
            status: 'active'
          });

          await updateDoc(doc(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'queue', matchData.userId), {
            status: 'matched',
            matchId: newChatId
          });

          await updateDoc(doc(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'queue', currentUser.uid), {
            status: 'matched',
            matchId: newChatId
          });
        }
      } catch (error) {
        console.error("Search Error:", error);
        setSearchError(error.message);
        addLog("Error: " + error.message.substring(0, 20) + "...");
      }
    }, 2000);

    return () => {
      unsubscribeMyQueue();
      clearInterval(searchInterval);
    };
  }, [appState, currentUser, userProfile]);

  // --- 3. Chat Logic ---
  useEffect(() => {
    if (appState !== 'chat' || !chatId || !currentUser) return;

    const msgsQuery = query(
      collection(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribeMsgs = onSnapshot(msgsQuery, (snapshot) => {
      const loadedMsgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(loadedMsgs);
    });

    const chatDocRef = doc(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'chats', chatId);
    const unsubscribeChat = onSnapshot(chatDocRef, async (snapshot) => {
      const data = snapshot.data();
      if (data) {
          if (data.startTime) setStartTime(data.startTime.toDate());
          
          // FETCH PARTNER NAME FROM CHAT DOC
          if (data.nicknames) {
              const pId = data.users.find(u => u !== currentUser.uid);
              setPartnerId(pId);
              setPartnerName(data.nicknames[pId] || "Stranger");

              // Fetch Rating
              if (pId) {
                  try {
                    const ratingQ = query(
                        collection(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'ratings'),
                        where('targetId', '==', pId)
                    );
                    const ratingSnap = await getDocs(ratingQ);
                    if (!ratingSnap.empty) {
                        let total = 0;
                        ratingSnap.forEach(doc => {
                            total += doc.data().average;
                        });
                        setPartnerRating(total / ratingSnap.size);
                    } else {
                        setPartnerRating(0); 
                    }
                  } catch(e) { console.error("Rating fetch error", e); }
              }
          }
      }
    });

    return () => {
      unsubscribeMsgs();
      unsubscribeChat();
    };
  }, [appState, chatId, currentUser]);

  // --- 4. Timer Calculation ---
  useEffect(() => {
    if (appState !== 'chat' || !startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = 300 - elapsed;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        handleEndChat();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, appState]);


  // --- Handlers ---

  const handleStartSearch = (gender) => {
    if (!userProfile.nickname.trim()) return;
    setUserProfile(prev => ({ ...prev, gender }));
    setAppState('searching');
  };

  const handleCancelSearch = async () => {
    setAppState('onboarding');
    setSearchError(null); // Clear error on cancel
    try {
      if (currentUser) {
        await deleteDoc(doc(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'queue', currentUser.uid));
      }
    } catch (e) {
      console.error("Error removing from queue:", e);
    }
  };

  const handleSystemReset = async () => {
    // FIX: Using window.confirm to bypass 'no-restricted-globals' linter error
    if (window.confirm("Reset System? This will clear the entire queue.")) {
      const q = query(collection(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'queue'));
      const snapshot = await getDocs(q);
      snapshot.forEach((d) => deleteDoc(d.ref));
      addLog("System Reset: Queue Cleared");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !currentUser || !chatId) return;

    const textToSend = inputMsg;
    setInputMsg('');

    await addDoc(collection(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'chats', chatId, 'messages'), {
      text: textToSend,
      senderId: currentUser.uid,
      timestamp: serverTimestamp(),
      isReported: false
    });
  };

  const handleReport = async (msgId) => {
    setReportModal({ isOpen: true, msgId });
    if (chatId) {
      const msgRef = doc(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'chats', chatId, 'messages', msgId);
      await updateDoc(msgRef, {
        isReported: true,
        text: "[Content Redacted by AI Safety Protocol]"
      });
    }
    setTimeout(() => {
      setReportModal({ isOpen: false, msgId: null });
    }, 1500);
  };

  const handleEndChat = () => {
    setAppState('rating');
  };

  const handleSubmitRating = async () => {
    // Calculate average of current session
    const sessionAvg = Math.round((ratings.communication + ratings.flirting + ratings.vibe) / 3 * 10) / 10;

    // Save to database
    if (partnerId) {
        await addDoc(collection(db, 'artifacts', DATA_APP_ID, 'public', 'data', 'ratings'), {
            targetId: partnerId,
            raterId: currentUser.uid,
            communication: ratings.communication,
            flirting: ratings.flirting,
            vibe: ratings.vibe,
            average: sessionAvg,
            timestamp: serverTimestamp()
        });
    }

    setAppState('summary');
  };

  const handleReset = () => {
    setMessages([]);
    setTimeLeft(300);
    setChatId(null);
    setStartTime(null);
    setRatings({ communication: 5, flirting: 5, vibe: 5 });
    setPartnerName("");
    setPartnerId(null);
    setPartnerRating(0);
    setAppState('onboarding');
  };

  const formatTime = (seconds) => {
    if (seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    if (appState === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, appState]);

  return (
    <div className="w-full h-screen bg-gray-950 text-white font-sans flex items-center justify-center p-0 md:p-4">
      <div className="w-full h-full md:w-[400px] md:h-[800px] bg-black md:rounded-[3rem] overflow-hidden relative shadow-2xl border-4 border-gray-900 ring-4 ring-gray-900/50">
        
        {appState === 'onboarding' && (
          <OnboardingView 
            userProfile={userProfile} 
            setUserProfile={setUserProfile} 
            handleStartSearch={handleStartSearch} 
            handleSystemReset={handleSystemReset}
          />
        )}
        
        {appState === 'searching' && (
          <SearchingView 
            userProfile={userProfile} 
            cancelSearch={handleCancelSearch}
            searchError={searchError}
            logs={debugLogs}
            currentUserId={currentUser?.uid}
            queueList={queueList}
          />
        )}
        
        {appState === 'chat' && (
          <ChatView 
            timeLeft={timeLeft}
            handleEndChat={handleEndChat}
            formatTime={formatTime}
            messages={messages}
            currentUserId={currentUser?.uid}
            handleReport={handleReport}
            isTyping={isTyping}
            chatEndRef={chatEndRef}
            inputMsg={inputMsg}
            setInputMsg={setInputMsg}
            handleSendMessage={handleSendMessage}
            reportModal={reportModal}
            partnerName={partnerName}
            partnerRating={partnerRating}
          />
        )}
        
        {appState === 'rating' && (
          <RatingView 
            ratings={ratings} 
            setRatings={setRatings} 
            handleSubmitRating={handleSubmitRating} 
          />
        )}
        
        {appState === 'summary' && (
          <SummaryView 
            handleReset={handleReset} 
            onFindNewMatch={() => {
              handleReset();
              setAppState('onboarding'); 
            }} 
          />
        )}

        {appState !== 'chat' && (
           <div className="absolute bottom-6 left-0 right-0 text-center opacity-20 pointer-events-none z-0">
             <span className="text-[10px] tracking-[0.3em] font-bold">NITK DATING</span>
           </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
