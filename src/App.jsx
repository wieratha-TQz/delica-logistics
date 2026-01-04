import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Box, 
  HardDrive,
  Info,
  Package,
  Edit2,
  X,
  CheckCircle2,
  Navigation,
  Home,
  RotateCcw,
  Clock,
  Download,
  ClipboardList,
  Phone,
  UserCheck,
  Users,
  FileText,
  BarChart3,
  FileSpreadsheet,
  IceCream,
  Activity,
  Map as MapIcon,
  MapPin,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Search,
  Lock,
  LogOut,
  User,
  Key
} from 'lucide-react';

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDniYENI0ZTnM5T2rBSsfl2yzI8W0wgxnk",
  authDomain: "delica-logistic.firebaseapp.com",
  projectId: "delica-logistic",
  storageBucket: "delica-logistic.firebasestorage.app",
  messagingSenderId: "1045680211754",
  appId: "1:1045680211754:web:b16f7d1763f667f063c053",
  measurementId: "G-6EFC9XG5KT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'delica-logistic-v1'; 

const STATUS_OPTIONS = [
  { label: 'Ready', color: 'bg-red-50 text-red-500 border-red-100', timelineColor: '#ef4444', icon: <Clock size={12}/> },
  { label: 'Pengantaran', color: 'bg-sky-50 text-sky-500 border-sky-100', timelineColor: '#38bdf8', icon: <Navigation size={12}/> },
  { label: 'Di Lokasi', color: 'bg-blue-50 text-blue-500 border-blue-100', timelineColor: '#60a5fa', icon: <Home size={12}/> },
  { label: 'Pengambilan', color: 'bg-green-50 text-green-600 border-green-100', timelineColor: '#22c55e', icon: <RotateCcw size={12}/> },
  { label: 'Selesai', color: 'bg-slate-100 text-slate-400 border-slate-200', timelineColor: '#94a3b8', icon: <CheckCircle2 size={12}/> },
];

const MONTHS_LIST = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// DATABASE HARI LIBUR NASIONAL (Contoh 2024-2025)
const HOLIDAYS_DATA = {
  '2024-01-01': 'Tahun Baru Masehi',
  '2024-02-08': 'Isra Mikraj',
  '2024-02-10': 'Tahun Baru Imlek',
  '2024-03-11': 'Hari Suci Nyepi',
  '2024-03-29': 'Wafat Isa Al Masih',
  '2024-03-31': 'Paskah',
  '2024-04-10': 'Hari Raya Idul Fitri',
  '2024-04-11': 'Hari Raya Idul Fitri',
  '2024-05-01': 'Hari Buruh Internasional',
  '2024-05-09': 'Kenaikan Isa Al Masih',
  '2024-05-23': 'Hari Raya Waisak',
  '2024-06-01': 'Hari Lahir Pancasila',
  '2024-06-17': 'Hari Raya Idul Adha',
  '2024-07-07': 'Tahun Baru Islam',
  '2024-08-17': 'Hari Kemerdekaan RI',
  '2024-09-16': 'Maulid Nabi Muhammad SAW',
  '2024-12-25': 'Hari Raya Natal',
  // 2025 Estimasi
  '2025-01-01': 'Tahun Baru Masehi',
  '2025-01-29': 'Tahun Baru Imlek',
  '2025-03-29': 'Hari Suci Nyepi',
  '2025-03-31': 'Hari Raya Idul Fitri',
  '2025-04-01': 'Hari Raya Idul Fitri',
  '2025-04-18': 'Wafat Isa Al Masih',
  '2025-05-01': 'Hari Buruh Internasional',
  '2025-05-12': 'Hari Raya Waisak',
  '2025-05-29': 'Kenaikan Isa Al Masih',
  '2025-06-01': 'Hari Lahir Pancasila',
  '2025-06-06': 'Hari Raya Idul Adha',
  '2025-06-27': 'Tahun Baru Islam',
  '2025-08-17': 'Hari Kemerdekaan RI',
  '2025-09-05': 'Maulid Nabi Muhammad SAW',
  '2025-12-25': 'Hari Raya Natal',
};

const safeDate = (dateVal) => {
  if (!dateVal) return new Date(0);
  if (dateVal.toDate && typeof dateVal.toDate === 'function') return dateVal.toDate();
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

// Helper untuk cek libur/weekend
const getDayStatus = (date) => {
  const day = date.getDay(); // 0 = Minggu, 6 = Sabtu
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${d}`;
  
  const isWeekend = day === 0 || day === 6;
  const holidayName = HOLIDAYS_DATA[dateKey];
  
  return { isWeekend, isHoliday: !!holidayName, holidayName };
};

const BrandLogo = ({ size = 'normal' }) => (
  <div className={`flex items-center gap-3 text-left ${size === 'large' ? 'scale-125' : ''}`}>
    <div className="bg-sky-500 p-2.5 rounded-[1.25rem] shadow-sky-200 shadow-xl flex items-center justify-center relative overflow-hidden group">
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
      <IceCream className="text-white relative z-10" size={size === 'large' ? 32 : 24} />
    </div>
    <div className="flex flex-col">
      <div className="flex items-baseline gap-1 leading-none text-left">
        <span className="font-semibold text-xl tracking-tighter text-slate-700 italic">delica.</span>
      </div>
      <span className="text-[8px] font-bold text-sky-500 uppercase tracking-widest text-left">Logistic System</span>
    </div>
  </div>
);

// --- KOMPONEN LOGIN PAGE ---
const LoginScreen = ({ onLogin, isLoading, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-sky-200 rounded-full blur-[100px] opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full blur-[100px] opacity-30"></div>
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white relative z-10 animate-in">
        <div className="flex justify-center mb-10">
          <BrandLogo size="large" />
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">Login Admin</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Masukkan kredensial khusus Anda</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl flex items-start gap-3 font-bold text-xs">
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                required 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-sky-400 outline-none font-bold text-slate-600 transition-all shadow-inner"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password" 
                required 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-sky-400 outline-none font-bold text-slate-600 transition-all shadow-inner"
                placeholder="delica."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-sky-100 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? <span className="animate-spin">◌</span> : <Lock size={16} />} 
            {isLoading ? 'Memproses...' : 'Masuk Dashboard'}
          </button>
        </form>
        
        <p className="text-center mt-12 text-[10px] text-slate-300 font-bold uppercase tracking-wider">
            Delica Logistic System v1.0
        </p>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [orders, setOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
    
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  const [tlFilterStatus, setTlFilterStatus] = useState('Semua');
  const [tlFilterCup, setTlFilterCup] = useState('Semua');
  const [tlFilterDriver, setTlFilterDriver] = useState('Semua');

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isStockCheckModalOpen, setIsStockCheckModalOpen] = useState(false);
    
  const [isConfirmUpdateOpen, setIsConfirmUpdateOpen] = useState(false);
  const [isConfirmAssetUpdateOpen, setIsConfirmAssetUpdateOpen] = useState(false); 
  const [isConfirmDriverUpdateOpen, setIsConfirmDriverUpdateOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
    
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
   
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
    
  const [logisticsDate, setLogisticsDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterDriverCopy, setFilterDriverCopy] = useState('Semua');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [editingDriverId, setEditingDriverId] = useState(null);

  const [checkStockStart, setCheckStockStart] = useState(new Date().toISOString().split('T')[0]);
  const [checkStockEnd, setCheckStockEnd] = useState(new Date().toISOString().split('T')[0]);
  const [stockCheckResult, setStockCheckResult] = useState([]);

  const statusChartRef = useRef(null);
  const driverChartRef = useRef(null);
  const annualChartRef = useRef(null);

  const [orderForm, setOrderForm] = useState({
    customerName: '', phone: '', deliveryDate: '', eventDate: '', returnDate: '', unitCount: 1, 
    freezerType: '', address: '', mapsLink: '', productQuantity: '', cupDesign: 'Regular', 
    status: 'Ready', deliveryDriver: '', pickupDriver: '' 
  });

  const [assetForm, setAssetForm] = useState({ name: '', type: '', quantity: 1 });
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', carPlate: '' });

  // --- SCRIPT INJECTION (FIX PDF) ---
  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(); 
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const loadAllScripts = async () => {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0');
        
        // FIX: Load jspdf first
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        
        // FIX: Explicitly set global jsPDF BEFORE loading autotable
        if (window.jspdf && window.jspdf.jsPDF) {
            window.jsPDF = window.jspdf.jsPDF;
        }
        
        // Then load autotable which relies on window.jsPDF (UPDATE VERSION)
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js');
        
        await loadScript('https://cdn.tailwindcss.com');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');

        setScriptsLoaded(true);
        console.log("Semua script eksternal berhasil dimuat.");
      } catch (err) {
        console.error("Gagal memuat library eksternal:", err);
      }
    };
    loadAllScripts();
  }, []);

  // --- AUTH STATE LISTENER (FIXED SESSION CHECK) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      if (u) {
        // Cek apakah sesi valid (disimpan saat login manual)
        const isAdminSession = sessionStorage.getItem('delica_admin_session');
        if (isAdminSession) {
            setUser(u);
        } else {
            // Jika user ada di Firebase tapi tidak punya sesi di browser ini (misal sisa Anonymous Auth lama), logout
            signOut(auth);
            setUser(null);
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
      if (u) setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  // --- LOGIN HANDLERS ---
  const handleLogin = async (username, password) => {
    setAuthLoading(true);
    setLoginError('');
    
    // HARDCODED CREDENTIAL CHECK
    if (username === 'admin' && password === 'delica.') {
      try {
        // Set flag sesi di sessionStorage agar persist saat refresh tapi hilang saat tab ditutup/logout
        sessionStorage.setItem('delica_admin_session', 'true');
        await signInAnonymously(auth);
      } catch (err) {
        console.error(err);
        sessionStorage.removeItem('delica_admin_session');
        setAuthLoading(false);
        setLoginError('Gagal koneksi ke server.');
      }
    } else {
        setTimeout(() => {
            setAuthLoading(false);
            setLoginError('Username atau Password salah!');
        }, 800);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('delica_admin_session'); // Hapus sesi
      setActiveTab('dashboard'); // Reset tab
      setOrders([]); 
    } catch (err) {
      console.error(err);
    }
  };

  // --- DATA FETCHING (Only if User) ---
  useEffect(() => {
    if (!user) return;
    const unsubOrders = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), (s) => setOrders(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubAssets = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'assets'), (s) => setAssets(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubDrivers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'drivers'), (s) => setDrivers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubOrders(); unsubAssets(); unsubDrivers(); };
  }, [user]);

  // Data Logic
  const expandedFreezers = useMemo(() => {
    const list = [];
    if (!assets) return list;
    assets.forEach(asset => {
      const qty = parseInt(asset.quantity) || 0;
      for (let i = 1; i <= qty; i++) {
        list.push({ id: `${asset.type}-${i}`, type: asset.type, label: `${asset.type} #${i}`, displayName: asset.name });
      }
    });
    return list;
  }, [assets]);

  const monthDays = useMemo(() => {
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    return Array.from({ length: lastDay }, (_, i) => i + 1);
  }, [currentDate]);

  // Sorting dan Penomoran Order
  const sortedOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    return [...orders].sort((a, b) => safeDate(a.eventDate) - safeDate(b.eventDate));
  }, [orders]);

  const orderIndexMap = useMemo(() => {
    const map = {};
    const filtered = sortedOrders.filter(o => {
      const matchStatus = tlFilterStatus === 'Semua' || o.status === tlFilterStatus;
      const matchCup = tlFilterCup === 'Semua' || o.cupDesign === tlFilterCup;
      const matchDriver = tlFilterDriver === 'Semua' || o.deliveryDriver === tlFilterDriver || o.pickupDriver === tlFilterDriver;
      return matchStatus && matchCup && matchDriver;
    });
    
    filtered.forEach((o, index) => {
      map[o.id] = index + 1;
    });
    return map;
  }, [sortedOrders, tlFilterStatus, tlFilterCup, tlFilterDriver]);

  const filteredOrders = useMemo(() => {
    return sortedOrders.filter(o => orderIndexMap[o.id] !== undefined);
  }, [sortedOrders, orderIndexMap]);

  const allocation = useMemo(() => {
    if (!expandedFreezers.length || !filteredOrders.length) return [];
    const unitsSchedule = {}; 
    const result = [];
    filteredOrders.forEach(order => {
      const dDate = safeDate(order.deliveryDate || order.eventDate);
      const rDate = safeDate(order.returnDate || order.eventDate);
      dDate.setHours(0,0,0,0); rDate.setHours(23,59,59,999);
      let assigned = 0;
      const targetUnits = expandedFreezers.filter(u => u.type === order.freezerType);
      for (const unit of targetUnits) {
        if (assigned >= (parseInt(order.unitCount) || 1)) break;
        const sched = unitsSchedule[unit.id] || [];
        if (!sched.some(s => (dDate <= s.end && rDate >= s.start))) {
          if (!unitsSchedule[unit.id]) unitsSchedule[unit.id] = [];
          unitsSchedule[unit.id].push({ start: dDate, end: rDate, order });
          result.push({ unitId: unit.id, start: dDate, end: rDate, order });
          assigned++;
        }
      }
    });
    return result;
  }, [filteredOrders, expandedFreezers]);

  const visibleFreezers = useMemo(() => {
    const isFiltering = tlFilterStatus !== 'Semua' || tlFilterCup !== 'Semua' || tlFilterDriver !== 'Semua';
    if (!isFiltering) return expandedFreezers;
    const activeUnitIds = new Set(allocation.map(a => a.unitId));
    return expandedFreezers.filter(u => activeUnitIds.has(u.id));
  }, [expandedFreezers, allocation, tlFilterStatus, tlFilterCup, tlFilterDriver]);

  const reportStats = useMemo(() => {
    const filtered = (orders || []).filter(o => {
      const d = safeDate(o.eventDate);
      return d.getMonth() === reportMonth && d.getFullYear() === reportYear;
    });
    const statusCounts = STATUS_OPTIONS.map(opt => ({
      label: opt.label,
      count: filtered.filter(o => o.status === opt.label).length,
      color: opt.timelineColor
    }));
    const driverStats = (drivers || []).map(d => {
      const deliveryTasks = filtered.filter(o => o.deliveryDriver === d.name);
      const pickupTasks = filtered.filter(o => o.pickupDriver === d.name);
      const total = deliveryTasks.length + pickupTasks.length;
      let completed = 0;
      deliveryTasks.forEach(o => { if (['Di Lokasi', 'Pengambilan', 'Selesai'].includes(o.status)) completed++; });
      pickupTasks.forEach(o => { if (o.status === 'Selesai') completed++; });
      return { name: d.name, total, done: completed };
    });
    return { filtered, statusCounts, driverStats, total: filtered.length, active: filtered.filter(o => o.status !== 'Selesai').length };
  }, [orders, drivers, reportMonth, reportYear]);

  const annualStats = useMemo(() => {
    const stats = Array(12).fill(0);
    orders.forEach(o => {
      const d = safeDate(o.eventDate);
      if (d.getFullYear() === reportYear) {
        stats[d.getMonth()]++;
      }
    });
    return stats;
  }, [orders, reportYear]);

  // --- LOGIKA CEK STOK ---
  const handleCheckStock = () => {
    const start = new Date(checkStockStart);
    const end = new Date(checkStockEnd);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);

    if (end < start) {
      alert("Tanggal akhir tidak boleh kurang dari tanggal mulai.");
      return;
    }

    const assetTypes = {};
    assets.forEach(a => {
      if (!assetTypes[a.type]) assetTypes[a.type] = { type: a.type, total: 0, maxUsage: 0 };
      assetTypes[a.type].total += parseInt(a.quantity || 0);
    });

    const dayUsage = {}; 

    orders.forEach(o => {
      const oStart = new Date(o.deliveryDate || o.eventDate);
      const oEnd = new Date(o.returnDate || o.eventDate);
      oStart.setHours(0,0,0,0);
      oEnd.setHours(23,59,59,999);

      for (let d = new Date(oStart); d <= oEnd; d.setDate(d.getDate() + 1)) {
        if (d >= start && d <= end) {
          const dateKey = d.toISOString().split('T')[0];
          if (!dayUsage[dateKey]) dayUsage[dateKey] = {};
            
          if (!dayUsage[dateKey][o.freezerType]) dayUsage[dateKey][o.freezerType] = 0;
          dayUsage[dateKey][o.freezerType] += parseInt(o.unitCount || 0);
        }
      }
    });

    Object.values(dayUsage).forEach(usage => {
      Object.keys(usage).forEach(type => {
        if (assetTypes[type]) {
          if (usage[type] > assetTypes[type].maxUsage) {
            assetTypes[type].maxUsage = usage[type];
          }
        }
      });
    });

    setStockCheckResult(Object.values(assetTypes));
    setIsStockCheckModalOpen(true);
  };

  // --- RENDER GRAFIK ---
  useEffect(() => {
    if (activeTab === 'reports' && !loading && scriptsLoaded) {
      
      const renderCharts = () => {
        if (window.Chart) {
          if (window.ChartDataLabels) {
             try { window.Chart.register(window.ChartDataLabels); } catch (e) { console.warn("Plugin register warn", e); }
          }

          const ctxStatusEl = document.getElementById('statusReportChart');
          if (ctxStatusEl) {
            const ctxStatus = ctxStatusEl.getContext('2d');
            if (statusChartRef.current) statusChartRef.current.destroy();
            statusChartRef.current = new window.Chart(ctxStatus, {
              type: 'doughnut',
              data: {
                labels: reportStats.statusCounts.map(s => s.label),
                datasets: [{ data: reportStats.statusCounts.map(s => s.count), backgroundColor: reportStats.statusCounts.map(s => s.color), borderWidth: 0 }]
              },
              options: { 
                responsive: true, maintainAspectRatio: false, 
                plugins: { 
                  legend: { position: 'bottom', labels: { usePointStyle: true, font: { weight: 'bold', size: 10 } } },
                  datalabels: { 
                    color: '#fff', 
                    font: { weight: 'bold', size: 14 }, 
                    formatter: (v) => v > 0 ? v : '', 
                    display: true,
                    anchor: 'center', 
                    align: 'center',
                    backgroundColor: 'rgba(0,0,0,0.4)', 
                    borderRadius: 4,
                    padding: 4
                  }
                } 
              }
            });
          }

          const ctxDriverEl = document.getElementById('driverPerformanceChart');
          if (ctxDriverEl) {
            const ctxDriver = ctxDriverEl.getContext('2d');
            if (driverChartRef.current) driverChartRef.current.destroy();
            driverChartRef.current = new window.Chart(ctxDriver, {
              type: 'bar',
              data: {
                labels: reportStats.driverStats.map(d => d.name),
                datasets: [
                  { label: 'Total Tugas', data: reportStats.driverStats.map(d => d.total), backgroundColor: '#38bdf8', borderRadius: 6 },
                  { label: 'Selesai', data: reportStats.driverStats.map(d => d.done), backgroundColor: '#10b981', borderRadius: 6 }
                ]
              },
              options: { 
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false, 
                layout: { padding: { right: 50 } }, 
                scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }, 
                plugins: { 
                  legend: { position: 'bottom' }, 
                  datalabels: { 
                    display: true,
                    color: '#334155',
                    anchor: 'end',
                    align: 'end',
                    font: { weight: 'bold' }
                  } 
                } 
              }
            });
          }

          const ctxAnnualEl = document.getElementById('annualReportChart');
          if (ctxAnnualEl) {
            const ctxAnnual = ctxAnnualEl.getContext('2d');
            if (annualChartRef.current) annualChartRef.current.destroy();
            annualChartRef.current = new window.Chart(ctxAnnual, {
              type: 'line',
              data: {
                labels: MONTHS_LIST.map(m => m.substring(0, 3)),
                datasets: [{
                  label: `Total Order ${reportYear}`,
                  data: annualStats,
                  borderColor: '#0ea5e9',
                  backgroundColor: 'rgba(14, 165, 233, 0.1)',
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#0ea5e9',
                  pointRadius: 4
                }]
              },
              options: {
                responsive: true, maintainAspectRatio: false,
                layout: { padding: { top: 30 } },
                plugins: {
                  legend: { display: false },
                  datalabels: { display: true, align: 'top', anchor: 'end', color: '#64748b', font: { weight: 'bold' } }
                },
                scales: {
                  y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                  x: { grid: { display: false } }
                }
              }
            });
          }
        }
      };

      setTimeout(renderCharts, 100);
    }
  }, [activeTab, reportStats, annualStats, loading, scriptsLoaded]);

  const handleOpenEditOrder = (order) => {
    if (!order) return;
    setEditingId(order.id);
    setOrderForm({
      customerName: order.customerName || '',
      phone: order.phone || '',
      deliveryDate: order.deliveryDate || '',
      eventDate: order.eventDate || '',
      returnDate: order.returnDate || '',
      unitCount: order.unitCount || 1,
      freezerType: order.freezerType || '',
      address: order.address || '',
      mapsLink: order.mapsLink || '',
      productQuantity: order.productQuantity || '',
      cupDesign: order.cupDesign || 'Regular',
      status: order.status || 'Ready',
      deliveryDriver: order.deliveryDriver || order.assignedDriver || '',
      pickupDriver: order.pickupDriver || ''
    });
    setIsOrderModalOpen(true);
  };

  const handleOpenAddAsset = () => {
    setEditingAssetId(null);
    setAssetForm({ name: '', type: '', quantity: 1 });
    setIsAssetModalOpen(true);
  };
  const handleOpenEditAsset = (asset) => {
    if (!asset) return;
    setEditingAssetId(asset.id);
    setAssetForm({ name: asset.name || '', type: asset.type || '', quantity: asset.quantity || 1 });
    setIsAssetModalOpen(true);
  };
  const handleOpenAddDriver = () => {
    setEditingDriverId(null);
    setDriverForm({ name: '', phone: '', carPlate: '' });
    setIsDriverModalOpen(true);
  };
  const handleOpenEditDriver = (d) => {
    if (!d) return;
    setEditingDriverId(d.id);
    setDriverForm({ name: d.name || '', phone: d.phone || '', carPlate: d.carPlate || '' });
    setIsDriverModalOpen(true);
  };

  const closeOrderModal = () => { 
    setEditingId(null); 
    setIsOrderModalOpen(false); 
    setErrorMessage(''); 
    setOrderForm({
      customerName: '', phone: '', deliveryDate: '', eventDate: '', returnDate: '', unitCount: 1, 
      freezerType: '', address: '', mapsLink: '', productQuantity: '', cupDesign: 'Regular', 
      status: 'Ready', deliveryDriver: '', pickupDriver: ''
    });
  };
  const closeAssetModal = () => { setEditingAssetId(null); setIsAssetModalOpen(false); };
  const closeDriverModal = () => { setEditingDriverId(null); setIsDriverModalOpen(false); };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (!orderForm.customerName || !orderForm.freezerType || !orderForm.eventDate) { setErrorMessage('Lengkapi data wajib.'); return; }
    
    if (orderForm.deliveryDate && orderForm.deliveryDate > orderForm.eventDate) {
      setErrorMessage('Tanggal Antar tidak boleh setelah Tanggal Acara.'); return;
    }
    if (orderForm.returnDate && orderForm.returnDate < orderForm.eventDate) {
      setErrorMessage('Tanggal Ambil tidak boleh sebelum Tanggal Acara.'); return;
    }

    const reqStart = new Date(orderForm.deliveryDate || orderForm.eventDate);
    const reqEnd = new Date(orderForm.returnDate || orderForm.eventDate);
    reqStart.setHours(0,0,0,0);
    reqEnd.setHours(23,59,59,999);

    const selectedAsset = assets.find(a => a.type === orderForm.freezerType);
    const totalStock = parseInt(selectedAsset?.quantity || 0);
    
    let usedStock = 0;
    orders.forEach(o => {
      if (editingId && o.id === editingId) return;
      if (o.freezerType === orderForm.freezerType) {
        const oStart = new Date(o.deliveryDate || o.eventDate);
        const oEnd = new Date(o.returnDate || o.eventDate);
        oStart.setHours(0,0,0,0);
        oEnd.setHours(23,59,59,999);
        if (reqStart <= oEnd && reqEnd >= oStart) {
          usedStock += parseInt(o.unitCount || 0);
        }
      }
    });

    const reqQty = parseInt(orderForm.unitCount || 0);
    if (usedStock + reqQty > totalStock) {
      setErrorMessage(`Gagal! Stok ${orderForm.freezerType} penuh pada tanggal tsb. Sisa: ${Math.max(0, totalStock - usedStock)} unit.`);
      return; 
    }

    const payload = { ...orderForm, assignedDriver: orderForm.deliveryDriver }; 

    if (editingId) setIsConfirmUpdateOpen(true);
    else {
      setIsSaving(true);
      try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), { ...payload, createdAt: Timestamp.now() }); closeOrderModal(); } 
      catch (err) { setErrorMessage('Gagal menyimpan.'); } finally { setIsSaving(false); }
    }
  };

  const executeSaveOrder = async () => {
    setIsSaving(true);
    const payload = { ...orderForm, assignedDriver: orderForm.deliveryDriver, updatedAt: Timestamp.now() };
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', editingId), payload); closeOrderModal(); setIsConfirmUpdateOpen(false); } 
    catch (err) { setErrorMessage('Gagal update.'); } finally { setIsSaving(false); }
  };

  const handleAssetFormSubmit = async (e) => { 
    e.preventDefault();
    if (editingAssetId) setIsConfirmAssetUpdateOpen(true); 
    else { try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assets'), { ...assetForm, createdAt: Timestamp.now() }); closeAssetModal(); } catch (err) { console.error(err); } }
  };

  const executeSaveAsset = async () => {
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'assets', editingAssetId), { ...assetForm }); closeAssetModal(); setIsConfirmAssetUpdateOpen(false); } catch (err) { console.error(err); }
  };

  const handleDriverFormSubmit = async (e) => {
    e.preventDefault();
    if (editingDriverId) setIsConfirmDriverUpdateOpen(true);
    else { try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'drivers'), { ...driverForm, createdAt: Timestamp.now() }); closeDriverModal(); } catch (err) { console.error(err); } }
  };

  const executeSaveDriver = async () => {
    try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'drivers', editingDriverId), { ...driverForm }); closeDriverModal(); setIsConfirmDriverUpdateOpen(false); } catch (err) { console.error(err); }
  };

  const triggerDelete = (col, id, name) => { setItemToDelete({ col, id, name }); setIsConfirmDeleteOpen(true); };
  const executeDelete = async () => {
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', itemToDelete.col, itemToDelete.id)); setIsConfirmDeleteOpen(false); setItemToDelete(null); } catch (err) { console.error(err); }
  };

  const copyLogisticsText = () => {
    let text = `*LOGISTIK delica. Ice Cream*\n📅 *${new Date(logisticsDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}*\n👤 *DRIVER:* ${filterDriverCopy.toUpperCase()}\n\n`;
    
    // 1. PENGANTARAN
    let deliveryList = "";
    let dCount = 1;
    orders.forEach(o => {
      if (o.deliveryDate === logisticsDate) {
        if (filterDriverCopy === 'Semua' || o.deliveryDriver === filterDriverCopy) {
          deliveryList += `${dCount++}. *${o.customerName}* (Driver: ${o.deliveryDriver || '?'})\n📍 ${o.address}\n🗺️ Maps: ${o.mapsLink || '-'}\n❄️ ${o.unitCount}x ${o.freezerType}\n📞 ${o.phone}\n\n`;
        }
      }
    });

    text += "*🚛 PENGANTARAN:*\n" + (deliveryList || "_Tidak ada jadwal_\n\n");

    text += "--------------------------------\n\n";

    // 2. PENGAMBILAN
    let pickupList = "";
    let pCount = 1;
    orders.forEach(o => {
      if (o.returnDate === logisticsDate) {
        if (filterDriverCopy === 'Semua' || o.pickupDriver === filterDriverCopy) {
          pickupList += `${pCount++}. *${o.customerName}* (Driver: ${o.pickupDriver || '?'})\n📍 ${o.address}\n🗺️ Maps: ${o.mapsLink || '-'}\n❄️ ${o.unitCount}x ${o.freezerType}\n\n`;
        }
      }
    });

    text += "*🔙 PENGAMBILAN:*\n" + (pickupList || "_Tidak ada jadwal_\n\n");

    const textarea = document.createElement('textarea'); textarea.value = text; document.body.appendChild(textarea); textarea.select();
    try { document.execCommand('copy'); setCopyFeedback(true); setTimeout(() => setCopyFeedback(false), 2000); } catch (err) { console.error(err); }
    document.body.removeChild(textarea);
  };

  const downloadJPG = async () => {
    const node = document.getElementById('report-content');
    if (!node || !window.htmlToImage) return;
    setIsDownloading(true);
    try {
      const dataUrl = await window.htmlToImage.toJpeg(node, { 
        quality: 0.95, backgroundColor: '#ffffff',
        filter: (el) => !el.classList?.contains('no-capture')
      });
      const link = document.createElement('a'); link.download = `delica-timeline.jpg`; link.href = dataUrl; link.click();
    } catch (error) { console.error(error); } finally { setIsDownloading(false); }
  };

  const downloadExcel = () => {
    if (!window.XLSX) return;
    const ws = window.XLSX.utils.json_to_sheet(reportStats.filtered.map(o => ({ 
      'Pelanggan': o.customerName, 
      'Nomor HP': o.phone,
      'Alamat': o.address,
      'Maps Link': o.mapsLink || '-',
      'Tgl Acara': o.eventDate, 
      'Tgl Antar': o.deliveryDate,
      'Tgl Ambil': o.returnDate,
      'Driver Antar': o.deliveryDriver, 
      'Driver Ambil': o.pickupDriver, 
      'Status': o.status, 
      'Jenis Freezer': o.freezerType,
      'Jml Unit': o.unitCount,
      'Produk (Pcs)': o.productQuantity, 
      'Desain Cup': o.cupDesign
    })));
    const wb = window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(wb, ws, "Orders");
    window.XLSX.writeFile(wb, `Laporan_Logistik_${reportYear}.xlsx`);
  };

  const downloadPDF = () => {
    const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDF) { alert("Library PDF belum siap. Mohon refresh halaman."); return; }
    const doc = new jsPDF('l', 'pt');
    doc.setFontSize(18);
    doc.text(`Laporan Lengkap delica. Ice Cream - ${reportYear}`, 40, 40);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 40, 60);

    const columns = [
      { header: '#', dataKey: 'no' },
      { header: 'Pelanggan', dataKey: 'name' },
      { header: 'Tgl Acara', dataKey: 'date' },
      { header: 'Unit', dataKey: 'unit' },
      { header: 'Produk', dataKey: 'product' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Driver Antar', dataKey: 'driver1' },
      { header: 'Driver Ambil', dataKey: 'driver2' },
      { header: 'Alamat Singkat', dataKey: 'addr' },
    ];

    const data = reportStats.filtered.map((o, i) => ({
      no: i + 1,
      name: `${o.customerName}\n(${o.phone})`,
      date: o.eventDate,
      unit: `${o.unitCount}x ${o.freezerType}`,
      product: `${o.productQuantity} Pcs\n(${o.cupDesign})`,
      status: o.status,
      driver1: o.deliveryDriver || '-',
      driver2: o.pickupDriver || '-',
      addr: o.address ? o.address.substring(0, 30) + '...' : '-'
    }));

    if (doc.autoTable) {
        doc.autoTable({
            startY: 80, columns: columns, body: data, theme: 'grid',
            headStyles: { fillColor: [14, 165, 233] }, styles: { fontSize: 8, cellPadding: 4 },
        });
        doc.save(`Laporan_Logistik_${reportYear}.pdf`);
    } else { alert("Plugin Tabel PDF belum dimuat sempurna. Tunggu sebentar atau refresh."); }
  };

  // --- HELPER UNTUK RENDER KONTEN (MENGHINDARI BUG TAMPILAN GANDA) ---
  const renderContent = () => {
    switch(activeTab) {
      case 'calendar':
        return (
          <div className="max-w-[1600px] mx-auto space-y-12 animate-in">
            {/* TOP ACTIONS */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-white flex flex-col gap-8 no-capture">
              <div className="flex flex-col xl:flex-row items-center justify-between gap-6">
                <button onClick={() => { setOrderForm({ customerName: '', phone: '', deliveryDate: '', eventDate: '', returnDate: '', unitCount: 1, freezerType: '', address: '', mapsLink: '', productQuantity: '', cupDesign: 'Regular', status: 'Ready', deliveryDriver: '', pickupDriver: '' }); setEditingId(null); setIsOrderModalOpen(true); }} className="w-full xl:w-1/3 py-5 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-[1.8rem] font-black text-xs shadow-xl shadow-sky-100 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest">BOOKING PESANAN BARU</button>
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner text-left">
                  <div className="flex flex-col px-3 text-left"><span className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1 text-left">Tgl Logistik</span><input type="date" className="bg-transparent text-xs font-bold text-slate-600 outline-none" value={logisticsDate} onChange={(e) => setLogisticsDate(e.target.value)} /></div>
                  <select className="bg-white text-xs font-bold pl-4 pr-10 py-2 rounded-xl border border-slate-100 outline-none focus:ring-2 focus:ring-sky-100" value={filterDriverCopy} onChange={(e) => setFilterDriverCopy(e.target.value)}><option value="Semua">Pilih Driver</option>{drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select>
                  <button onClick={copyLogisticsText} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${copyFeedback ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-700 text-white hover:bg-slate-800 shadow-md'}`}>{copyFeedback ? <CheckCircle2 size={14}/> : <ClipboardList size={14}/>} {copyFeedback ? 'Tersalin!' : 'Salin WhatsApp'}</button>
                </div>
                <button onClick={downloadJPG} disabled={isDownloading} className="flex items-center gap-2 bg-white border border-sky-100 text-sky-500 px-7 py-3 rounded-2xl font-bold hover:bg-sky-50 shadow-sm">{isDownloading ? <span className="animate-spin">◌</span> : <Download size={18}/>} JPG Timeline</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-inner no-capture">
                  {['Status', 'Tutup Cup', 'Driver'].map((type, i) => (
                    <div key={type} className="flex flex-col gap-2 text-left">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Saring {type}</span>
                        <select className="pl-3 pr-10 py-3 rounded-xl border-none font-bold text-xs bg-white shadow-sm outline-sky-500 cursor-pointer" value={[tlFilterStatus, tlFilterCup, tlFilterDriver][i]} onChange={e => [setTlFilterStatus, setTlFilterCup, setTlFilterDriver][i](e.target.value)}>
                        <option value="Semua">Semua {type}</option>
                        {i === 0 ? STATUS_OPTIONS.map(s => <option key={s.label} value={s.label}>{s.label}</option>) : i === 1 ? ['Regular', 'Custom'].map(c => <option key={c} value={c}>{c}</option>) : drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className="flex flex-col justify-end"><button onClick={() => { setTlFilterStatus('Semua'); setTlFilterCup('Semua'); setTlFilterDriver('Semua'); }} className="p-3 rounded-xl font-black text-[10px] uppercase text-sky-500 bg-white hover:bg-sky-50 transition-all tracking-widest shadow-sm">Reset Filter ↻</button></div>
              </div>
            </div>

            <div id="report-content" className="space-y-12">
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-white overflow-hidden relative z-[5]">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full border-collapse table-fixed min-w-[1200px]">
                    <thead>
                      <tr className="bg-sky-50/20 text-sky-400 font-bold text-[10px] uppercase tracking-widest">
                        <th className="sticky left-0 z-50 bg-white/95 backdrop-blur-sm border-r border-b border-sky-50 p-3 text-left w-40">Unit Freezer</th>
                        {monthDays.map(day => {
                          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                          const { isWeekend, isHoliday, holidayName } = getDayStatus(date);
                          const isToday = new Date().toDateString() === date.toDateString();
                          
                          return (
                            <th key={day} className={`border-b border-sky-50 p-3 text-center w-14 ${isToday ? 'bg-sky-50/50' : ''}`} title={isHoliday ? holidayName : ''}>
                              <div className="flex flex-col items-center">
                                <span className={`text-[9px] font-bold ${isWeekend || isHoliday ? 'text-rose-500' : ''}`}>
                                  {date.toLocaleDateString('id-ID', { weekday: 'narrow' })}
                                </span>
                                <div className={`text-sm font-bold ${isWeekend || isHoliday ? 'text-rose-500' : ''}`}>
                                  {day}
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sky-50/50">
                      {visibleFreezers.map((unit, idx) => (
                        <tr key={unit.id} className="hover:bg-sky-50/20 group text-left">
                          <td className="sticky left-0 z-40 bg-white border-r border-sky-50 p-3 text-[10px] font-black text-slate-500 uppercase italic text-left">{unit.label}</td>
                          {monthDays.map(day => {
                            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                            const { isWeekend, isHoliday } = getDayStatus(date);
                            const loopDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 12, 0, 0);
                            const target = allocation.find(a => a.unitId === unit.id && loopDate >= a.start && loopDate <= a.end);
                            
                            let bBg = 'transparent'; let op = 1;
                            
                            // Background untuk hari libur/weekend (lebih terang)
                            if ((isWeekend || isHoliday) && !target) {
                                bBg = 'rgba(255, 228, 230, 0.3)'; // rose-50 with opacity
                            }

                            if (target) {
                              const info = STATUS_OPTIONS.find(s => s.label === target.order.status);
                              bBg = info?.timelineColor || '#cbd5e1';
                              const eV = safeDate(target.order.eventDate).setHours(0,0,0,0);
                              const lT = new Date(loopDate).setHours(0,0,0,0);
                              if (lT === eV) op = 1; else if (lT < eV) op = 0.3; else op = 0.6;
                            }
                            return (<td key={day} className="border-r border-sky-50/30 p-1.5 h-16 relative" style={{ backgroundColor: !target && (isWeekend || isHoliday) ? '#fff1f2' : undefined }}>
                              {target && (
                                <div onClick={() => handleOpenEditOrder(target.order)} className="absolute inset-1.5 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.05] cursor-pointer z-20" style={{ backgroundColor: bBg, opacity: op }}>
                                  <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <span className="text-white text-[10px] font-black drop-shadow-md">
                                      {orderIndexMap[target.order.id]}
                                    </span>
                                  </div>
                                  {!target.order.deliveryDriver && (
                                    <div className="absolute top-0 right-0 -mt-1 -mr-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center z-30 shadow-md" title="Belum ada Driver">
                                      <span className="text-[9px] font-bold text-white">!</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>);
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* LIST VIEW */}
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-white overflow-hidden text-left">
                  <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center"><h3 className="text-xl font-black text-slate-800 uppercase italic">Database Booking Aktif</h3></div>
                  <div className="overflow-x-auto"><table className="w-full border-collapse">
                    <thead><tr className="text-slate-400 text-[10px] uppercase font-black border-b border-slate-50">
                      <th className="p-4 text-center w-12">#</th>
                      <th className="p-4 text-left">Status & Driver</th>
                      <th className="p-4 text-left">Pelanggan & Produk</th>
                      <th className="p-4 text-left">Unit & Cup</th>
                      <th className="p-4 text-left">Lokasi</th>
                      <th className="p-4 text-center">Tgl Acara</th>
                      <th className="p-4 text-right">Opsi</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">{filteredOrders.map(o => { const info = STATUS_OPTIONS.find(s => s.label === o.status); return (
                      <tr key={o.id} className="hover:bg-slate-50/80 transition-all text-left">
                        <td className="p-4 text-center font-black text-slate-300 text-xs">{orderIndexMap[o.id]}</td>
                        <td className="p-4">
                          <div className={`w-fit px-3 py-1 rounded-full border text-[9px] font-black uppercase ${info?.color}`}>{o.status}</div>
                          <div className="mt-2 flex flex-col gap-1">
                             <div className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                                <ArrowRight size={10} className="text-sky-500"/> 
                                {o.deliveryDriver ? o.deliveryDriver : <span className="text-rose-400">? (Antar)</span>}
                             </div>
                             <div className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                                <ArrowLeft size={10} className="text-rose-500"/> 
                                {o.pickupDriver ? o.pickupDriver : <span className="text-slate-300">? (Ambil)</span>}
                             </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-black text-slate-700 uppercase italic text-sm">{o.customerName}</p>
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mb-1"><Phone size={10}/> {o.phone}</p>
                          {o.productQuantity && <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[9px] font-bold">{o.productQuantity} Pcs</span>}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="bg-sky-50 text-sky-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase w-fit">{o.unitCount}x {o.freezerType}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${o.cupDesign === 'Custom' ? 'text-indigo-600' : 'text-slate-400'}`}>Cup: {o.cupDesign}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="max-w-[180px]">
                            <p className="text-[10px] font-medium text-slate-500 line-clamp-2 mb-2">{o.address}</p>
                          </div>
                        </td>
                        <td className="p-4 text-center text-[10px] font-black">{o.eventDate ? safeDate(o.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 relative z-[50]">
                            {o.mapsLink && (
                              <a href={o.mapsLink} target="_blank" rel="noopener noreferrer" className="p-2 bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all" title="Buka Lokasi">
                                <MapIcon size={14}/>
                              </a>
                            )}
                            <button onClick={() => handleOpenEditOrder(o)} className="p-2 bg-sky-50 text-sky-400 hover:bg-sky-500 hover:text-white rounded-lg transition-all"><Edit2 size={14}/></button>
                            <button onClick={() => triggerDelete('orders', o.id, o.customerName)} className="p-2 bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white rounded-lg transition-all"><Trash2 size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    )})}</tbody>
                  </table></div>
              </div>
            </div>
          </div>
        );
      
      case 'reports':
        return (
          <div className="max-w-[1400px] mx-auto space-y-12 animate-in text-left">
            {/* HEADER LAPORAN + CEK STOK BUTTON */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-white flex flex-col md:flex-row items-center justify-between gap-6 no-capture">
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none mb-1 text-left">Analisa Logistik</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest border-l-2 border-sky-400 pl-3 text-left">Performa {MONTHS_LIST[reportMonth]} {reportYear}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <button onClick={() => setIsStockCheckModalOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 text-white font-bold text-xs shadow-lg hover:bg-indigo-600 transition-all uppercase tracking-widest">
                  <Search size={14}/> Cek Sisa Stok
                </button>
                <select className="flex-1 md:w-32 p-3 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm outline-none focus:border-sky-400 transition-all cursor-pointer" value={reportMonth} onChange={(e) => setReportMonth(parseInt(e.target.value))}>{MONTHS_LIST.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
                <select className="flex-1 md:w-24 p-3 rounded-2xl border-2 border-slate-50 bg-slate-50 font-bold text-sm outline-none focus:border-sky-400 transition-all cursor-pointer" value={reportYear} onChange={(e) => setReportYear(parseInt(e.target.value))}>{[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-white flex flex-col items-center">
                 <h3 className="text-lg font-bold text-slate-700 mb-8 italic">Status Order Terkini</h3>
                 <div className="w-full h-80 relative flex items-center justify-center"><canvas id="statusReportChart"></canvas></div>
              </div>
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-white flex flex-col items-center">
                 <h3 className="text-lg font-bold text-slate-700 mb-8 italic">Performa Driver</h3>
                 <div className="w-full h-80 relative flex items-center justify-center"><canvas id="driverPerformanceChart"></canvas></div>
              </div>
              {/* GRAFIK LAPORAN TAHUNAN BARU */}
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-white flex flex-col items-center lg:col-span-2">
                 <h3 className="text-lg font-bold text-slate-700 mb-8 italic">Tren Order Tahunan {reportYear}</h3>
                 <div className="w-full h-80 relative flex items-center justify-center"><canvas id="annualReportChart"></canvas></div>
              </div>
            </div>

            {/* TOMBOL DOWNLOAD DETAIL */}
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-white text-center space-y-8 no-capture">
               <div className="max-w-md mx-auto space-y-4 text-center">
                 <div className="w-20 h-20 bg-sky-50 rounded-3xl flex items-center justify-center mx-auto text-sky-400 shadow-inner text-center"><Download size={40}/></div>
                 <h3 className="text-xl font-bold text-slate-700 italic uppercase tracking-tight text-center leading-none">Ekspor Laporan Detail</h3>
                 <p className="text-xs font-medium text-slate-400 leading-relaxed italic text-center">Unduh rekapitulasi data lengkap tahun {reportYear} dalam format Excel atau PDF.</p>
               </div>
               <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                 <button onClick={downloadExcel} className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg uppercase text-xs tracking-widest active:scale-95 cursor-pointer"><FileSpreadsheet size={18}/> Download Excel</button>
                 <button onClick={downloadPDF} className="flex items-center gap-3 bg-rose-400 hover:bg-rose-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-rose-100 transition-all uppercase text-xs tracking-widest active:scale-95 cursor-pointer"><FileText size={18}/> Download PDF</button>
               </div>
            </div>
          </div>
        );

      case 'assets':
        return (
          <div className="max-w-6xl mx-auto space-y-12 animate-in text-left">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-white overflow-hidden">
              <div className="p-10 border-b border-sky-50 flex items-center justify-between bg-sky-50/20">
                <h2 className="text-xl font-bold text-slate-700 italic uppercase">Inventaris Freezer</h2>
                <button onClick={handleOpenAddAsset} className="bg-slate-900 text-white px-7 py-3.5 rounded-2xl font-bold uppercase text-xs tracking-wider z-50">Tambah Kategori</button>
              </div>
              <div className="p-6 overflow-x-auto text-left"><table className="w-full">
                <thead><tr className="text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-50"><th className="px-6 py-4 text-left">Kategori</th><th className="px-6 py-4 text-center">Model</th><th className="px-6 py-4 text-center">Stok</th><th className="px-6 py-4 text-right">Opsi</th></tr></thead>
                <tbody>{(assets || []).map(a => (<tr key={a.id} className="hover:bg-sky-50/30 border-b border-slate-50 transition-all text-left"><td className="px-6 py-4 uppercase font-black text-sky-500 text-sm">{a.type}</td><td className="px-6 py-4 text-center italic">{a.name}</td><td className="px-6 py-4 text-center font-black text-xl">{a.quantity} Unit</td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-3 z-[50]"><button onClick={() => handleOpenEditAsset(a)} className="p-3 bg-sky-50 text-sky-500 hover:bg-sky-500 hover:text-white rounded-2xl transition-all"><Edit2 size={16}/></button><button onClick={() => triggerDelete('assets', a.id, a.type)} className="p-3 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"><Trash2 size={16}/></button></div></td></tr>))}</tbody>
              </table></div>
            </div>
             
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-white overflow-hidden">
              <div className="p-10 border-b border-sky-50 flex items-center justify-between bg-sky-50/20">
                <h2 className="text-xl font-bold text-slate-700 italic uppercase">Database Personil Driver</h2>
                <button onClick={handleOpenAddDriver} className="bg-emerald-500 text-white px-7 py-3.5 rounded-2xl font-bold uppercase text-xs tracking-wider z-50">Tambah Driver</button>
              </div>
              <div className="p-6 overflow-x-auto text-left"><table className="w-full">
                <thead><tr className="text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-50"><th className="px-6 py-4 text-left">Nama Driver</th><th className="px-6 py-4 text-center">Kontak</th><th className="px-6 py-4 text-center">Plat Mobil</th><th className="px-6 py-4 text-right">Opsi</th></tr></thead>
                <tbody>{(drivers || []).map(d => (<tr key={d.id} className="hover:bg-sky-50/30 border-b border-slate-50 transition-all text-left"><td className="px-6 py-4 font-bold text-lg italic">{d.name}</td><td className="px-6 py-4 text-center text-slate-400">{d.phone}</td><td className="px-6 py-4 text-center font-mono font-black">{d.carPlate}</td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-3 z-[50]"><button onClick={() => handleOpenEditDriver(d)} className="p-3 bg-sky-50 text-sky-500 hover:bg-sky-500 hover:text-white rounded-2xl transition-all"><Edit2 size={16}/></button><button onClick={() => triggerDelete('drivers', d.id, d.name)} className="p-3 bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"><Trash2 size={16}/></button></div></td></tr>))}</tbody>
              </table></div>
            </div>
          </div>
        );

      case 'dashboard':
      default:
        return (
          <div className="max-w-6xl mx-auto space-y-12 animate-in text-left">
             <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-white relative overflow-hidden group">
                <div className="relative z-10 space-y-6">
                   <h2 className="text-5xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">Mission Control <br/><span className="text-sky-500">Logistik Gudang</span></h2>
                   <p className="text-slate-500 max-w-2xl text-lg font-medium italic">Monitor seluruh pergerakan freezer dan performa driver logistik harian Anda.</p>
                </div>
                <Activity className="absolute -right-20 -bottom-20 text-sky-500/5 group-hover:rotate-12 transition-all duration-1000" size={500} />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-white flex flex-col gap-4 group hover:scale-[1.02] transition-all">
                  <div className="w-14 h-14 bg-sky-50 text-sky-500 rounded-2xl flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all shadow-lg shadow-sky-100"><Box size={28}/></div>
                  <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Inventaris</span><h3 className="text-4xl font-black text-slate-700 tracking-tighter">{(assets || []).reduce((acc, curr) => acc + (parseInt(curr.quantity) || 0), 0)} Unit</h3></div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-white flex flex-col gap-4 group hover:scale-[1.02] transition-all">
                  <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all shadow-lg shadow-orange-100"><Package size={28}/></div>
                  <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking Berjalan</span><h3 className="text-4xl font-black text-slate-700 tracking-tighter">{(orders || []).filter(o => o.status !== 'Selesai').length} Job</h3></div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-white flex flex-col gap-4 group hover:scale-[1.02] transition-all">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg shadow-emerald-100"><Users size={28}/></div>
                  <div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Driver Siaga</span><h3 className="text-4xl font-black text-slate-700 tracking-tighter">{(drivers || []).length} Orang</h3></div>
                </div>
             </div>
          </div>
        );
    }
  };

  // --- RENDER UTAMA ---
  if (authLoading) return <div className="flex h-screen items-center justify-center bg-sky-50"><BrandLogo /></div>;

  // JIKA USER BELUM LOGIN, TAMPILKAN LOGIN SCREEN
  if (!user) {
    return <LoginScreen onLogin={handleLogin} isLoading={authLoading} error={loginError} />;
  }

  // JIKA SUDAH LOGIN, TAMPILKAN DASHBOARD
  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20 text-slate-600">
      <nav className="bg-white/80 backdrop-blur-md border-b border-sky-100 sticky top-0 z-[1000] shadow-sm no-capture">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex gap-2 bg-sky-50/50 p-1.5 rounded-[1.25rem]">
              {[
                { id: 'dashboard', label: 'Beranda', icon: <Activity size={18}/> }, 
                { id: 'calendar', label: 'Timeline', icon: <CalendarIcon size={18}/> }, 
                { id: 'assets', label: 'Manajemen', icon: <HardDrive size={18}/> }, 
                { id: 'reports', label: 'Laporan', icon: <BarChart3 size={18}/> }
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-sky-600 hover:bg-sky-50'}`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
            
            {/* LOGOUT BUTTON */}
            <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 font-bold text-xs transition-all"
                title="Keluar"
            >
                <LogOut size={16} /> 
                <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU (Simple) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex justify-around z-[1000] no-capture">
         {[
            { id: 'dashboard', icon: <Activity size={20}/> }, 
            { id: 'calendar', icon: <CalendarIcon size={20}/> }, 
            { id: 'assets', icon: <HardDrive size={20}/> }, 
            { id: 'reports', icon: <BarChart3 size={20}/> }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-3 rounded-2xl transition-all ${activeTab === tab.id ? 'bg-sky-50 text-sky-500' : 'text-slate-400'}`}>
              {tab.icon}
            </button>
          ))}
      </div>

      <div className="p-6 md:p-10 relative z-10 text-left">
        {renderContent()}
      </div>

      {/* --- MODALS --- */}
      {/* MODAL CEK STOK (BARU) */}
      {isStockCheckModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl text-left">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
              <div><h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Cek Sisa Stok</h3><p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Kalkulasi Ketersediaan Gudang</p></div>
              <button onClick={() => setIsStockCheckModalOpen(false)} className="p-3 bg-slate-50 text-slate-300 rounded-full"><X/></button>
            </div>
             
            <div className="flex gap-4 mb-6">
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Dari</label><input type="date" className="w-full p-3 rounded-xl bg-slate-50 font-bold text-slate-700" value={checkStockStart} onChange={(e) => setCheckStockStart(e.target.value)} /></div>
              <div className="flex-1"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Sampai</label><input type="date" className="w-full p-3 rounded-xl bg-slate-50 font-bold text-slate-700" value={checkStockEnd} onChange={(e) => setCheckStockEnd(e.target.value)} /></div>
            </div>
            <button onClick={handleCheckStock} className="w-full py-4 mb-8 bg-indigo-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-indigo-600 transition-all">Hitung Ketersediaan</button>

            {stockCheckResult.length > 0 ? (
              <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
                {stockCheckResult.map((res, idx) => {
                  const available = res.total - res.maxUsage;
                  const isCritical = available <= 0;
                  return (
                    <div key={idx} className={`p-4 rounded-2xl flex justify-between items-center border ${isCritical ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                      <div>
                        <h4 className="font-bold text-slate-700">{res.type}</h4>
                        <p className="text-[10px] font-medium text-slate-400">Total Asset: {res.total} Unit</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-black ${isCritical ? 'text-rose-500' : 'text-emerald-500'}`}>{Math.max(0, available)}</span>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tersedia</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-xs text-slate-400 italic">Pilih rentang tanggal untuk melihat stok.</p>
            )}
          </div>
        </div>
      )}

      {/* MODAL LAINNYA & OVERLAYS TETAP SAMA */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in text-left">
           <div className="bg-white rounded-[3rem] w-full max-w-4xl p-10 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-6">
                 <div><h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{editingId ? 'Update Booking' : 'Booking Baru'}</h3><p className="text-[10px] font-black text-sky-400 uppercase tracking-widest italic leading-none">{editingId ? 'Ubah data booking yang sudah ada' : 'Formulir Logistik delica.'}</p></div>
                 <button onClick={closeOrderModal} className="p-4 bg-slate-50 text-slate-300 hover:text-slate-600 rounded-full transition-all"><X/></button>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl flex items-center gap-2 font-bold text-sm">
                  <Info size={18}/> {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {/* Field Khusus Edit: Status & Driver (DIPINDAHKAN KE ATAS) */}
                 {editingId && (
                   <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-sky-50/20 p-6 rounded-[2rem] border border-sky-50">
                    <div className="flex flex-col"><label className="text-[10px] font-black text-sky-600 uppercase tracking-widest ml-1">Progres Status</label><select required className="w-full p-4 rounded-xl mt-2 font-bold shadow-inner border-none" value={orderForm.status} onChange={e => setOrderForm({...orderForm, status: e.target.value})}>{STATUS_OPTIONS.map(opt => <option key={opt.label} value={opt.label}>{opt.label}</option>)}</select></div>
                    {/* DUA KOLOM DRIVER */}
                    <div className="flex flex-col"><label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest ml-1">Driver Antar</label><select className="w-full p-4 rounded-xl mt-2 font-bold shadow-inner border-none" value={orderForm.deliveryDriver} onChange={e => setOrderForm({...orderForm, deliveryDriver: e.target.value})}><option value="">-- Pilih --</option>{drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
                    <div className="flex flex-col"><label className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1">Driver Ambil</label><select className="w-full p-4 rounded-xl mt-2 font-bold shadow-inner border-none" value={orderForm.pickupDriver} onChange={e => setOrderForm({...orderForm, pickupDriver: e.target.value})}><option value="">-- Pilih --</option>{drivers.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
                   </div>
                 )}

                 {/* Data Pelanggan */}
                 <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Pelanggan</label><input required className="w-full p-5 rounded-[1.8rem] bg-slate-50 border-none mt-2 font-bold shadow-inner text-lg" placeholder="Nama Lengkap" value={orderForm.customerName} onChange={e => setOrderForm({...orderForm, customerName: e.target.value})}/></div>
                 <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label><input required className="w-full p-5 rounded-[1.8rem] bg-slate-50 border-none mt-2 font-bold shadow-inner text-lg" placeholder="0812..." value={orderForm.phone} onChange={e => setOrderForm({...orderForm, phone: e.target.value})}/></div>
                 
                 {/* Penjadwalan (Acara, Antar, Ambil) */}
                 <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
                    <div className="flex flex-col"><label className="text-[10px] font-black text-slate-800 uppercase tracking-widest ml-1 italic">1. Tanggal Acara</label><input type="date" required className="w-full p-4 rounded-xl bg-white mt-2 font-black text-slate-800 shadow-sm border border-slate-100 outline-none" value={orderForm.eventDate} onChange={e => setOrderForm({...orderForm, eventDate: e.target.value})}/></div>
                    <div className="flex flex-col"><label className="text-[10px] font-black text-sky-500 uppercase tracking-widest ml-1 italic">2. Tanggal Antar</label><input type="date" required max={orderForm.eventDate} className="w-full p-4 rounded-xl bg-white mt-2 font-black text-sky-600 shadow-sm border border-sky-100 outline-none" value={orderForm.deliveryDate} onChange={e => setOrderForm({...orderForm, deliveryDate: e.target.value})}/></div>
                    <div className="flex flex-col"><label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1 italic">3. Tanggal Ambil</label><input type="date" required min={orderForm.eventDate} className="w-full p-4 rounded-xl bg-white mt-2 font-black text-rose-600 shadow-sm border border-rose-100 outline-none" value={orderForm.returnDate} onChange={e => setOrderForm({...orderForm, returnDate: e.target.value})}/></div>
                 </div>

                 {/* Detail Produk & Desain */}
                 <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Pcs Produk</label><input type="number" min="0" required className="w-full p-4 rounded-2xl bg-slate-50 border-none mt-2 font-bold shadow-inner" placeholder="0" value={orderForm.productQuantity} onChange={e => setOrderForm({...orderForm, productQuantity: e.target.value})}/></div>
                 <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tutup Cup</label><select className="w-full p-4 rounded-2xl bg-slate-50 border-none mt-2 font-bold shadow-inner" value={orderForm.cupDesign} onChange={e => setOrderForm({...orderForm, cupDesign: e.target.value})}><option value="Regular">Regular</option><option value="Custom">Custom</option></select></div>

                 {/* Pemilihan Freezer */}
                 <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Freezer</label><select required className="w-full p-4 rounded-2xl bg-slate-50 border-none mt-2 font-bold shadow-inner" value={orderForm.freezerType} onChange={e => setOrderForm({...orderForm, freezerType: e.target.value})}><option value="">-- Pilih --</option>{assets.map(a => <option key={a.id} value={a.type}>{a.type} ({a.name})</option>)}</select></div>
                 <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Unit</label><input type="number" min="1" required className="w-full p-4 rounded-2xl bg-slate-50 border-none mt-2 font-black text-sky-500 text-center shadow-inner" value={orderForm.unitCount} onChange={e => setOrderForm({...orderForm, unitCount: e.target.value})}/></div>

                 {/* Maps Link */}
                 <div className="md:col-span-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link Google Maps</label><input className="w-full p-4 rounded-2xl bg-slate-50 border-none mt-2 font-bold shadow-inner text-sky-500" placeholder="https://maps.google.com/..." value={orderForm.mapsLink} onChange={e => setOrderForm({...orderForm, mapsLink: e.target.value})}/></div>

                 {/* Alamat */}
                 <div className="md:col-span-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Penempatan Unit</label><textarea required className="w-full p-5 rounded-[1.8rem] bg-slate-50 border-none mt-2 font-bold h-24 shadow-inner resize-none" placeholder="Masukkan alamat lengkap..." value={orderForm.address} onChange={e => setOrderForm({...orderForm, address: e.target.value})}/></div>

                 <button type="submit" disabled={isSaving} className="md:col-span-3 bg-sky-500 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:bg-sky-600 active:scale-95 transition-all mt-6 text-center"> {editingId ? 'SIMPAN PERUBAHAN DATA' : 'KONFIRMASI DAN SIMPAN DATA BOOKING'} </button>
              </form>
           </div>
        </div>
      )}

      {/* ASSET MODAL */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in text-left">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl text-left">
              <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-6 text-left"><h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none text-left">{editingAssetId ? 'Edit Freezer' : 'Tambah Freezer'}</h3><button onClick={closeAssetModal} className="p-3 bg-slate-50 text-slate-300 rounded-full"><X/></button></div>
              <form onSubmit={handleAssetFormSubmit} className="space-y-6 text-left">
                 <div className="text-left text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block text-left">Kapasitas</label><input required className="w-full p-4 rounded-2xl bg-slate-50 border-none mt-2 font-bold shadow-inner text-left" value={assetForm.type} onChange={e => setAssetForm({...assetForm, type: e.target.value})}/></div>
                 <div className="text-left text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block text-left text-left text-left">Model / Merek</label><input required className="w-full p-4 rounded-2xl bg-slate-50 border-none mt-2 font-bold shadow-inner text-left" value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})}/></div>
                 <div className="text-left text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block text-left text-left text-left">Total Unit</label><input type="number" min="1" required className="w-full p-4 rounded-2xl bg-slate-50 border-none mt-2 font-black text-sky-500 text-3xl shadow-inner text-center text-left" value={assetForm.quantity} onChange={e => setAssetForm({...assetForm, quantity: e.target.value})}/></div>
                 <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-xl mt-4 cursor-pointer text-center">Simpan Perubahan</button>
              </form>
           </div>
        </div>
      )}

      {/* DRIVER MODAL */}
      {isDriverModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in text-left">
           <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl text-left">
              <div className="flex justify-between items-center mb-10 border-b border-slate-50 pb-6 text-left text-left">
                 <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter leading-none text-left">{editingDriverId ? 'Edit Driver' : 'Tambah Driver'}</h3>
                 <button onClick={closeDriverModal} className="p-3 bg-slate-50 text-slate-300 rounded-full"><X/></button>
              </div>
              <form onSubmit={handleDriverFormSubmit} className="space-y-6 text-left">
                 <div className="text-left text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block text-left">Nama Lengkap</label><input required className="w-full p-4 rounded-2xl bg-slate-50 border-none mt-2 font-bold shadow-inner text-lg text-left" value={driverForm.name} onChange={e => setDriverForm({...driverForm, name: e.target.value})}/></div>
                 <div className="text-left text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block text-left">WhatsApp</label><input required className="w-full p-4 rounded-2xl bg-slate-50 border-none mt-2 font-bold shadow-inner text-left" value={driverForm.phone} onChange={e => setDriverForm({...driverForm, phone: e.target.value})}/></div>
                 <div className="text-left text-left"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block text-left">Plat Nomor Kendaraan</label><input required className="w-full p-4 rounded-2xl bg-slate-50 border-none mt-2 font-black text-emerald-600 text-2xl tracking-widest shadow-inner uppercase text-left text-left text-left" value={driverForm.carPlate} onChange={e => setDriverForm({...driverForm, carPlate: e.target.value})}/></div>
                 <button type="submit" className="w-full bg-emerald-500 text-white py-4 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-xl mt-4 cursor-pointer text-center text-center">Simpan Perubahan</button>
              </form>
           </div>
        </div>
      )}

      {/* CONFIRMATION POPUPS */}
      {isConfirmUpdateOpen && ( <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in duration-200 text-left"><div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl text-center"><div className="bg-sky-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><CheckCircle2 size={40} className="text-sky-500" /></div><h4 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter mb-2 leading-tight">Simpan Perubahan?</h4><div className="flex flex-col gap-4 mt-6"><button onClick={executeSaveOrder} className="w-full py-5 bg-sky-500 text-white rounded-[1.5rem] font-black shadow-xl uppercase text-[10px] tracking-widest">YA, SIMPAN DATA</button><button onClick={() => setIsConfirmUpdateOpen(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">BATALKAN</button></div></div></div> )}
      {isConfirmAssetUpdateOpen && ( <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in duration-200 text-left"><div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl text-center text-left text-left"><div className="bg-sky-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-center text-left"><Box size={40} className="text-sky-500" /></div><h4 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter mb-2 leading-tight text-center text-left text-center">Update Stok?</h4><div className="flex flex-col gap-4 mt-6 text-left text-left"><button onClick={executeSaveAsset} className="w-full py-5 bg-sky-500 text-white rounded-[1.5rem] font-black shadow-xl uppercase text-[10px] tracking-widest text-left text-center cursor-pointer">YA, UPDATE</button><button onClick={() => setIsConfirmAssetUpdateOpen(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest text-center cursor-pointer">BATALKAN</button></div></div></div> )}
      {isConfirmDriverUpdateOpen && ( <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in duration-200 text-left text-left text-left"><div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl text-center text-left text-left"><div className="bg-sky-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-left text-center text-center"><UserCheck size={40} className="text-sky-500" /></div><h4 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter mb-2 leading-tight text-center text-left text-center text-center">Update Driver?</h4><div className="flex flex-col gap-4 mt-6 text-left text-left"><button onClick={executeSaveDriver} className="w-full py-5 bg-sky-500 text-white rounded-[1.5rem] font-black shadow-xl uppercase text-[10px] tracking-widest text-center text-center cursor-pointer">YA, UPDATE</button><button onClick={() => setIsConfirmDriverUpdateOpen(false)} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest text-center cursor-pointer">BATALKAN</button></div></div></div> )}
      {isConfirmDeleteOpen && ( <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in duration-200 text-left"><div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl text-center"><div className="bg-rose-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Trash2 size={40} className="text-rose-400" /></div><h4 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter mb-2 leading-tight">Hapus Data?</h4><p className="text-slate-400 text-xs font-medium mb-10 px-4 leading-relaxed italic">Data {itemToDelete?.name} akan dihapus permanen.</p><div className="flex flex-col gap-4"><button onClick={executeDelete} className="w-full py-5 bg-rose-400 text-white rounded-[1.5rem] font-black shadow-xl uppercase text-[10px] tracking-widest">YA, HAPUS PERMANEN</button><button onClick={() => { setIsConfirmDeleteOpen(false); setItemToDelete(null); }} className="w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">BATALKAN</button></div></div></div> )}

      <footer className="mt-auto py-12 text-center opacity-30 no-capture">
         <p className="text-[10px] font-black uppercase tracking-[0.6em] italic text-slate-400">Powered by delica. Logistic Hub • 2025</p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,800;1,800&display=swap');
        body { margin: 0; padding: 0; overflow-x: hidden; -webkit-font-smoothing: antialiased; font-family: 'Plus Jakarta Sans', sans-serif; background-color: #f8fafc; }
        .animate-in { animation: fadeIn 0.6s cubic-bezier(0.23, 1, 0.32, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { height: 10px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; border: 3px solid #f8fafc; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1.5rem center; background-size: 1.2rem; }
      `}</style>
    </div>
  );
}