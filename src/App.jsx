import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc
} from 'firebase/firestore';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  Search, 
  History, 
  CalendarDays, 
  Navigation, 
  Share2, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Printer, 
  Mail, 
  MessageCircle, 
  BellRing, 
  Smartphone,
  ExternalLink,
  RotateCcw,
  SearchCheck,
  SendHorizontal,
  Cloud,
  CloudOff,
  AlertTriangle,
  FileText,
  Activity,
  LogOut,
  LogIn,
  GripVertical,
  Palette
} from 'lucide-react';

// ============================================================================
// COLE ABAIXO SUAS CHAVES REAIS DO FIREBASE CONSOLE
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyCI1Uen8stm5p1qq-vzINMNNlmveCCxicc",
  authDomain: "agenda-familia-4cf24.firebaseapp.com",
  databaseURL: "https://agenda-familia-4cf24-default-rtdb.firebaseio.com",
  projectId: "agenda-familia-4cf24",
  storageBucket: "agenda-familia-4cf24.firebasestorage.app",
  messagingSenderId: "439157932854",
  appId: "1:439157932854:web:89e13abd2d38702d68a997",
  measurementId: "G-EPXKEXQZ9G"
};

const isDummyConfig = firebaseConfig.apiKey.includes("DummyKey");

let app, auth, db;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Falha ao inicializar o Firebase SDK:", error);
}

const LOCAL_STORAGE_KEY = 'consultas_medicas_backup_data_v8';
const PATIENT_ORDER_KEY = 'consultas_medicas_patient_order_v1';
const PATIENT_COLORS_KEY = 'consultas_medicas_patient_colors_v1';

// Paleta de cores harmonizadas (Fundo pastel + Detalhes mais fortes)
const THEME_PALETTES = {
  pink: {
    label: 'Rosa',
    swatch: 'bg-pink-400',
    bg: 'bg-pink-100 border-pink-300 text-pink-950',
    pin: 'bg-rose-500',
    badge: 'bg-pink-200 text-pink-800 border-pink-300',
    filterActive: 'bg-pink-200 border-pink-400 text-pink-900 font-black ring-2 ring-pink-400',
    filterInactive: 'bg-pink-50/80 text-pink-800 border-pink-200 hover:bg-pink-100',
  },
  amber: {
    label: 'Amarelo',
    swatch: 'bg-amber-400',
    bg: 'bg-amber-100 border-amber-300 text-amber-950',
    pin: 'bg-amber-500',
    badge: 'bg-amber-200 text-amber-900 border-amber-300',
    filterActive: 'bg-amber-200 border-amber-400 text-amber-950 font-black ring-2 ring-amber-400',
    filterInactive: 'bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100',
  },
  purple: {
    label: 'Roxo',
    swatch: 'bg-purple-400',
    bg: 'bg-purple-100 border-purple-300 text-purple-950',
    pin: 'bg-purple-500',
    badge: 'bg-purple-200 text-purple-900 border-purple-300',
    filterActive: 'bg-purple-200 border-purple-400 text-purple-950 font-black ring-2 ring-purple-400',
    filterInactive: 'bg-purple-50/80 text-purple-800 border-purple-200 hover:bg-purple-100',
  },
  emerald: {
    label: 'Verde',
    swatch: 'bg-emerald-400',
    bg: 'bg-emerald-100 border-emerald-300 text-emerald-950',
    pin: 'bg-emerald-500',
    badge: 'bg-emerald-200 text-emerald-900 border-emerald-300',
    filterActive: 'bg-emerald-200 border-emerald-400 text-emerald-950 font-black ring-2 ring-emerald-400',
    filterInactive: 'bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
  },
  sky: {
    label: 'Azul Céu',
    swatch: 'bg-sky-400',
    bg: 'bg-sky-100 border-sky-300 text-sky-950',
    pin: 'bg-sky-500',
    badge: 'bg-sky-200 text-sky-900 border-sky-300',
    filterActive: 'bg-sky-200 border-sky-400 text-sky-950 font-black ring-2 ring-sky-400',
    filterInactive: 'bg-sky-50/80 text-sky-800 border-sky-200 hover:bg-sky-100',
  },
  orange: {
    label: 'Pêssego',
    swatch: 'bg-orange-400',
    bg: 'bg-orange-100 border-orange-300 text-orange-950',
    pin: 'bg-orange-500',
    badge: 'bg-orange-200 text-orange-900 border-orange-300',
    filterActive: 'bg-orange-200 border-orange-400 text-orange-950 font-black ring-2 ring-orange-400',
    filterInactive: 'bg-orange-50/80 text-orange-800 border-orange-200 hover:bg-orange-100',
  },
  teal: {
    label: 'Turquesa',
    swatch: 'bg-teal-400',
    bg: 'bg-teal-100 border-teal-300 text-teal-950',
    pin: 'bg-teal-500',
    badge: 'bg-teal-200 text-teal-900 border-teal-300',
    filterActive: 'bg-teal-200 border-teal-400 text-teal-950 font-black ring-2 ring-teal-400',
    filterInactive: 'bg-teal-50/80 text-teal-800 border-teal-200 hover:bg-teal-100',
  },
  indigo: {
    label: 'Índigo',
    swatch: 'bg-indigo-400',
    bg: 'bg-indigo-100 border-indigo-300 text-indigo-950',
    pin: 'bg-indigo-500',
    badge: 'bg-indigo-200 text-indigo-900 border-indigo-300',
    filterActive: 'bg-indigo-200 border-indigo-400 text-indigo-950 font-black ring-2 ring-indigo-400',
    filterInactive: 'bg-indigo-50/80 text-indigo-800 border-indigo-200 hover:bg-indigo-100',
  }
};

const INITIAL_APPOINTMENTS = [
  { cliente: 'Tania', especialidade: 'Oftalmologista', medico: 'Luiz Fernando Pozzi', local: 'COH - Franceschini', endereco: 'Rua Franceschini, Campinas - SP', dia: '2026-10-31', hora: '00:00', observacoes: '' },
  { cliente: 'Oscar', especialidade: 'Exame', medico: 'sem nome', local: 'DMS Burnier', endereco: 'Av. Dr. Alberto Sarmento, Campinas - SP', dia: '2026-11-02', hora: '09:00', observacoes: '' },
  { cliente: 'Bruna', especialidade: 'Podologa', medico: 'Lucineia Dias', local: 'Podoclinica', endereco: 'Podoclinica, Campinas - SP', dia: '2026-11-03', hora: '10:00', observacoes: '' },
  { cliente: 'Tania', especialidade: 'Cardiologista', medico: 'Alexandre', local: 'Amanda', endereco: 'Clinica Amanda, Campinas - SP', dia: '2026-11-03', hora: '14:50', observacoes: '' },
  { cliente: 'Oscar', especialidade: 'Otorrinolaringologista', medico: 'Danila', local: 'Unison', endereco: 'Clinica Unison, Campinas - SP', dia: '2026-11-07', hora: '09:00', observacoes: '' },
  { cliente: 'Tania', especialidade: 'Acupuntura', medico: 'Dr. Tadeu', local: 'white', endereco: 'Clinica White, Campinas - SP', dia: '2026-11-09', hora: '17:00', observacoes: '' },
  { cliente: 'Tania', especialidade: 'Alergologista', medico: 'Caludia Leite', local: 'Pro Vida', endereco: 'Clinica Pro Vida, Campinas - SP', dia: '2026-11-11', hora: '09:00', observacoes: '' },
  { cliente: 'Tania', especialidade: 'Dentista', medico: 'Sarah/Caio', local: 'ICS', endereco: 'ICS Odontologia, Campinas - SP', dia: '2026-11-12', hora: '10:30', observacoes: '' },
  { cliente: 'Oscar', especialidade: 'Endocrino', medico: 'Dr Bradley', local: 'white', endereco: 'Clinica White, Campinas - SP', dia: '2026-11-16', hora: '00:00', observacoes: '' },
  { cliente: 'Tania', especialidade: 'Endocrino', medico: 'Dr Bradley', local: 'white', endereco: 'Clinica White, Campinas - SP', dia: '2026-11-16', hora: '15:40', observacoes: '' },
  { cliente: 'Bruna', especialidade: 'Psiquiatria', medico: 'André Akamini', local: 'Fco Glicerio', endereco: 'Av. Fco Glicerio, 1867 - 9ºandar - sala 92, Campinas - SP', dia: '2026-11-25', hora: '10:40', observacoes: '' },
  { cliente: 'Tania', especialidade: 'Ginecologista', medico: 'Dr. Francisco', local: 'Clinmed', endereco: 'Clinica Clinmed, Campinas - SP', dia: '2026-11-30', hora: '11:45', observacoes: '' },
  { cliente: 'Bruna', especialidade: 'Reumatologista', medico: 'Marina', local: 'Especialidades', endereco: 'Centro de Especialidades, Campinas - SP', dia: '2027-01-08', hora: '10:20', observacoes: '' }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAutoNoticeModal, setShowAutoNoticeModal] = useState(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const dateInputRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const isLongPressTriggeredRef = useRef(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Estado para ordenação personalizada (arrastar e soltar) dos pacientes
  const [patientOrder, setPatientOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(PATIENT_ORDER_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [draggedPatient, setDraggedPatient] = useState(null);

  // Estado para cores personalizadas por paciente
  const [patientColors, setPatientColors] = useState(() => {
    try {
      const saved = localStorage.getItem(PATIENT_COLORS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [colorPickerPatient, setColorPickerPatient] = useState(null);

  const [viewMode, setViewMode] = useState('proximas'); 
  const [selectedPatient, setSelectedPatient] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isReturnAppointment, setIsReturnAppointment] = useState(false);

  const [isCustomCliente, setIsCustomCliente] = useState(false);
  const [isCustomEspecialidade, setIsCustomEspecialidade] = useState(false);
  const [isCustomMedico, setIsCustomMedico] = useState(false);
  const [isCustomLocal, setIsCustomLocal] = useState(false);

  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const todayAppointments = useMemo(() => {
    return appointments.filter(appItem => appItem.dia === todayStr);
  }, [appointments, todayStr]);

  const [formData, setFormData] = useState({
    cliente: '',
    especialidade: '',
    medico: '',
    local: '',
    endereco: '',
    dia: todayStr,
    hora: '09:00',
    observacoes: ''
  });

  // Monitorar Autenticação e Firestore
  useEffect(() => {
    if (isDummyConfig || !db || !auth) {
      setIsCloudConnected(false);
      loadFromLocalStorage();
      return;
    }

    let unsubscribeSnapshot;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.warn("Erro ao entrar como visitante anônimo:", e);
        }
      }

      const colRef = collection(db, 'consultas_familia');
      unsubscribeSnapshot = onSnapshot(colRef, 
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          if (data.length > 0) {
            setAppointments(data);
          } else {
            seedCloudDatabase(colRef);
          }
          setIsCloudConnected(true);
          setLoading(false);
        }, 
        (err) => {
          console.warn("Bloqueio de permissão no Firestore:", err);
          setIsCloudConnected(false);
          loadFromLocalStorage();
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (!auth) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowProfileMenu(false);
    } catch (err) {
      console.error("Erro no Login do Google:", err);
      alert("Não foi possível conectar com a Conta Google: " + err.message);
    }
  };

  const handleGoogleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setShowProfileMenu(false);
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  const seedCloudDatabase = async (colRef) => {
    try {
      const promises = INITIAL_APPOINTMENTS.map(item => 
        addDoc(colRef, {
          ...item,
          createdAt: new Date().toISOString()
        })
      );
      await Promise.all(promises);
    } catch (err) {
      console.error("Erro ao popular banco inicial:", err);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setAppointments(JSON.parse(saved));
      } else {
        const initialWithIds = INITIAL_APPOINTMENTS.map((item, index) => ({
          ...item,
          id: `local-${index}-${Date.now()}`
        }));
        setAppointments(initialWithIds);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialWithIds));
      }
    } catch (e) {
      console.error("Erro ao ler LocalStorage:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveToLocalStorage = (newAppointments) => {
    setAppointments(newAppointments);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newAppointments));
    } catch (e) {
      console.error("Erro ao salvar no LocalStorage:", e);
    }
  };

  const optionsList = useMemo(() => {
    if (loading) {
      return { clientes: [], especialidades: [], medicos: [], locais: [] };
    }

    const clientesSet = new Set();
    const espSet = new Set();
    const medSet = new Set();
    const localSet = new Set();

    appointments.forEach(a => {
      if (a.cliente && a.cliente.trim()) clientesSet.add(a.cliente.trim());
      if (a.especialidade && a.especialidade.trim()) espSet.add(a.especialidade.trim());
      if (a.medico && a.medico.trim()) medSet.add(a.medico.trim());
      if (a.local && a.local.trim()) localSet.add(a.local.trim());
    });

    const sortFn = (a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
    const rawClientes = Array.from(clientesSet).sort(sortFn);

    // Aplica a ordem personalizada salva pelo usuário (arrastar e soltar)
    const orderedClientes = [...rawClientes].sort((a, b) => {
      const idxA = patientOrder.indexOf(a);
      const idxB = patientOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return sortFn(a, b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return {
      clientes: orderedClientes,
      especialidades: Array.from(espSet).sort(sortFn),
      medicos: Array.from(medSet).sort(sortFn),
      locais: Array.from(localSet).sort(sortFn)
    };
  }, [appointments, loading, patientOrder]);

  // Funções para arrastar e reordenar os nomes dos pacientes
  const handleDragStartPatient = (e, patient) => {
    setDraggedPatient(patient);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOverPatient = (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDropPatient = (e, targetPatient) => {
    e.preventDefault();
    if (!draggedPatient || draggedPatient === targetPatient) return;

    const currentList = [...optionsList.clientes];
    const fromIndex = currentList.indexOf(draggedPatient);
    const toIndex = currentList.indexOf(targetPatient);

    if (fromIndex !== -1 && toIndex !== -1) {
      currentList.splice(fromIndex, 1);
      currentList.splice(toIndex, 0, draggedPatient);
      setPatientOrder(currentList);
      try {
        localStorage.setItem(PATIENT_ORDER_KEY, JSON.stringify(currentList));
      } catch (err) {
        console.warn("Não foi possível salvar ordem dos pacientes:", err);
      }
    }
    setDraggedPatient(null);
  };

  // Controle de toque longo (3 segundos) para abrir o seletor de cores
  const handlePatientPressStart = (patient) => {
    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setColorPickerPatient(patient);
    }, 3000);
  };

  const handlePatientPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleSendWhatsAppReminder = (appItem) => {
    const dataFormatada = formatDate(appItem.dia);
    const horaFormatada = appItem.hora === '00:00' ? 'A confirmar' : `${appItem.hora}h`;
    const localInfo = [appItem.local, appItem.endereco].filter(Boolean).join(' - ');
    const queryMaps = encodeURIComponent([appItem.local, appItem.endereco].filter(Boolean).join(', '));
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${queryMaps}`;

    const mensagem = 
`📌 *LEMBRETE DE CONSULTA MÉDICA* 📌

Olá *${appItem.cliente}*, segue o lembrete da sua consulta:

👨‍⚕️ *Médico(a):* ${appItem.medico || 'Não especificado'}
🩺 *Especialidade:* ${appItem.especialidade}
🏥 *Local:* ${localInfo}
📅 *Data:* ${dataFormatada} às ${horaFormatada}
${appItem.observacoes ? `📄 *Observações:* ${appItem.observacoes}\n` : ''}
🗺️ *Abrir rota no Google Maps:*
${mapsLink}

_Tenha um ótimo atendimento!_`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const handleSendAllTodayRemindersSummary = () => {
    if (todayAppointments.length === 0) return;

    let mensagem = `🔔 *RESUMO DAS CONSULTAS DE HOJE (${formatDate(todayStr)})* 🔔\n\nExistem *${todayAppointments.length} agendamentos* para hoje:\n\n`;

    todayAppointments.forEach((appItem, idx) => {
      const horaFormatada = appItem.hora === '00:00' ? 'A confirmar' : `${appItem.hora}h`;
      const localInfo = [appItem.local, appItem.endereco].filter(Boolean).join(' - ');
      const queryMaps = encodeURIComponent([appItem.local, appItem.endereco].filter(Boolean).join(', '));
      const mapsLink = `https://www.google.com/maps/search/?api=1&query=${queryMaps}`;

      mensagem += `-----------------------------------\n`;
      mensagem += `📌 *${idx + 1}. PACIENTE: ${appItem.cliente.toUpperCase()}*\n`;
      mensagem += `👨‍⚕️ *Médico(a):* ${appItem.medico || 'Não especificado'}\n`;
      mensagem += `🩺 *Especialidade:* ${appItem.especialidade}\n`;
      mensagem += `🏥 *Local:* ${localInfo}\n`;
      mensagem += `🕒 *Horário:* ${horaFormatada}\n`;
      if (appItem.observacoes) mensagem += `📄 *Obs:* ${appItem.observacoes}\n`;
      mensagem += `🗺️ *Google Maps:* ${mapsLink}\n\n`;
    });

    mensagem += `_Por favor, fiquem atentos aos horários!_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const openGoogleMapsRoute = (local, endereco) => {
    const query = [local, endereco].filter(Boolean).join(', ');
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const isPastDate = (dateStr) => {
    if (!dateStr) return false;
    return dateStr < todayStr;
  };

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter(appItem => {
        const isPast = isPastDate(appItem.dia);
        if (viewMode === 'proximas' && isPast) return false;
        if (viewMode === 'historico' && !isPast) return false;

        if (selectedPatient !== 'Todos' && appItem.cliente !== selectedPatient) {
          return false;
        }

        if (searchTerm.trim() !== '') {
          const term = searchTerm.toLowerCase();
          const matchCliente = appItem.cliente?.toLowerCase().includes(term);
          const matchEsp = appItem.especialidade?.toLowerCase().includes(term);
          const matchMed = appItem.medico?.toLowerCase().includes(term);
          const matchLocal = appItem.local?.toLowerCase().includes(term);
          const matchEnd = appItem.endereco?.toLowerCase().includes(term);
          return matchCliente || matchEsp || matchMed || matchLocal || matchEnd;
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = `${a.dia} ${a.hora || '00:00'}`;
        const dateB = `${b.dia} ${b.hora || '00:00'}`;
        return viewMode === 'proximas' 
          ? dateA.localeCompare(dateB) 
          : dateB.localeCompare(dateA); 
      });
  }, [appointments, viewMode, selectedPatient, searchTerm, todayStr]);

  const openModal = (appToEdit = null, isReturn = false) => {
    setIsCustomCliente(false);
    setIsCustomEspecialidade(false);
    setIsCustomMedico(false);
    setIsCustomLocal(false);
    setIsReturnAppointment(isReturn);

    if (isReturn && appToEdit) {
      setEditingId(null);
      setFormData({
        cliente: appToEdit.cliente || (optionsList.clientes[0] || ''),
        especialidade: appToEdit.especialidade ? `${appToEdit.especialidade} (Retorno)` : 'Retorno',
        medico: appToEdit.medico || '',
        local: appToEdit.local || '',
        endereco: appToEdit.endereco || '',
        dia: todayStr,
        hora: '09:00',
        observacoes: `Retorno da consulta de ${formatDate(appToEdit.dia)}.`
      });
    } else if (appToEdit) {
      setEditingId(appToEdit.id);
      setFormData({
        cliente: appToEdit.cliente || (optionsList.clientes[0] || ''),
        especialidade: appToEdit.especialidade || '',
        medico: appToEdit.medico || '',
        local: appToEdit.local || '',
        endereco: appToEdit.endereco || '',
        dia: appToEdit.dia || todayStr,
        hora: appToEdit.hora || '09:00',
        observacoes: appToEdit.observacoes || ''
      });
    } else {
      setEditingId(null);
      const defaultLocal = optionsList.locais[0] || '';
      const existingAddress = defaultLocal 
        ? (appointments.find(a => a.local === defaultLocal && a.endereco)?.endereco || '')
        : '';

      setFormData({
        cliente: optionsList.clientes[0] || '',
        especialidade: optionsList.especialidades[0] || '',
        medico: optionsList.medicos[0] || '',
        local: defaultLocal,
        endereco: existingAddress,
        dia: todayStr,
        hora: '09:00',
        observacoes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleClinicChange = (selectedLocal) => {
    if (selectedLocal === 'NEW') {
      setIsCustomLocal(true);
      setFormData(prev => ({ ...prev, local: '', endereco: '' }));
    } else {
      setIsCustomLocal(false);
      const matchingApp = appointments.find(a => a.local === selectedLocal && a.endereco);
      const foundAddress = matchingApp ? matchingApp.endereco : '';
      
      setFormData(prev => ({ 
        ...prev, 
        local: selectedLocal, 
        endereco: foundAddress 
      }));

      setTimeout(() => {
        if (dateInputRef.current) {
          dateInputRef.current.focus();
        }
      }, 50);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isCloudConnected || !db) {
      if (editingId) {
        const updated = appointments.map(appItem => 
          appItem.id === editingId ? { ...appItem, ...formData } : appItem
        );
        saveToLocalStorage(updated);
      } else {
        const newItem = {
          ...formData,
          id: `local-${Date.now()}`
        };
        saveToLocalStorage([newItem, ...appointments]);
      }
      setIsModalOpen(false);
      return;
    }

    try {
      if (editingId) {
        const docRef = doc(db, 'consultas_familia', editingId);
        await updateDoc(docRef, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        const colRef = collection(db, 'consultas_familia');
        await addDoc(colRef, {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.warn("Salvando alteração localmente:", err.message);
      if (editingId) {
        const updated = appointments.map(appItem => 
          appItem.id === editingId ? { ...appItem, ...formData } : appItem
        );
        saveToLocalStorage(updated);
      } else {
        const newItem = {
          ...formData,
          id: `local-${Date.now()}`
        };
        saveToLocalStorage([newItem, ...appointments]);
      }
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isCloudConnected || !db) {
      const updated = appointments.filter(appItem => appItem.id !== id);
      saveToLocalStorage(updated);
      setItemToDelete(null);
      return;
    }

    try {
      const docRef = doc(db, 'consultas_familia', id);
      await deleteDoc(docRef);
      setItemToDelete(null);
    } catch (err) {
      console.warn("Erro ao excluir do banco online:", err.message);
      const updated = appointments.filter(appItem => appItem.id !== id);
      saveToLocalStorage(updated);
      setItemToDelete(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleCopyShareLink = () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSelectPatientColor = (patientName, colorKey) => {
    const updatedColors = { ...patientColors, [patientName]: colorKey };
    setPatientColors(updatedColors);
    try {
      localStorage.setItem(PATIENT_COLORS_KEY, JSON.stringify(updatedColors));
    } catch (err) {
      console.warn("Não foi possível salvar a cor do paciente:", err);
    }
    setColorPickerPatient(null);
  };

  const getPatientTheme = (name) => {
    const customKey = patientColors[name];
    if (customKey && THEME_PALETTES[customKey]) {
      return THEME_PALETTES[customKey];
    }

    switch (name) {
      case 'Tania':
        return THEME_PALETTES.pink;
      case 'Oscar':
        return THEME_PALETTES.amber;
      case 'Bruna':
        return THEME_PALETTES.purple;
      default:
        return THEME_PALETTES.emerald;
    }
  };

  const isCompactPatientBar = optionsList.clientes.length >= 4;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100 text-slate-800 font-sans pb-12">
      {/* Cabeçalho Limpo e Moderno */}
      <header className="w-full bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            
            {/* Título Minimalista */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-left min-w-0">
              <div className="p-1.5 sm:p-2 bg-amber-400 text-slate-900 rounded-xl shadow-xs shrink-0">
                <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-left truncate">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                  Agenda
                  <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold">
                    Post-its
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${isCloudConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  <span className="truncate">{isCloudConnected ? 'Nuvem' : 'Local'}</span>
                </p>
              </div>
            </div>

            {/* Ações do Topo: Botões Lado a Lado + Foto Perfil */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              
              {/* Botão Notificar Hoje */}
              <button
                onClick={() => setShowAutoNoticeModal(true)}
                className="relative flex items-center justify-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] sm:text-xs font-bold transition shadow-xs"
              >
                <BellRing className="w-3.5 h-3.5 shrink-0" />
                <span>Notificar</span>
                {todayAppointments.length > 0 && (
                  <span className="ml-0.5 w-4 h-4 bg-amber-400 text-amber-950 rounded-full flex items-center justify-center text-[9px] font-black">
                    {todayAppointments.length}
                  </span>
                )}
              </button>

              {/* Botão Novo Post-it */}
              <button
                onClick={() => openModal()}
                className="flex items-center justify-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-xl text-[11px] sm:text-xs font-black transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Post-it</span>
              </button>

              {/* Foto do Perfil com Pop-up Popover */}
              <div className="relative ml-0.5">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 border-2 border-slate-700 hover:border-amber-400 overflow-hidden flex items-center justify-center transition focus:outline-none shrink-0"
                  title="Opções da Conta"
                >
                  {currentUser && currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Perfil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-amber-400" />
                  )}
                </button>

                {/* Pop-up do Perfil */}
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-3 text-slate-800 text-left space-y-2">
                      
                      <div className="pb-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {currentUser && !currentUser.isAnonymous 
                            ? (currentUser.displayName || currentUser.email) 
                            : 'Visitante (Anônimo)'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {isCloudConnected ? '🟢 Conectado na Nuvem' : '🟡 Modo Aparelho Local'}
                        </p>
                      </div>

                      <div className="space-y-1 text-xs font-semibold">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowShareModal(true);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-slate-100 rounded-xl text-slate-700 text-left"
                        >
                          <Share2 className="w-4 h-4 text-blue-600" />
                          <span>Compartilhar App</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowInstallGuideModal(true);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-slate-100 rounded-xl text-slate-700 text-left"
                        >
                          <Smartphone className="w-4 h-4 text-indigo-600" />
                          <span>Baixar no Celular</span>
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        {currentUser && !currentUser.isAnonymous ? (
                          <button
                            onClick={handleGoogleLogout}
                            className="w-full flex items-center space-x-2 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold text-left transition"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sair da Conta Google</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold text-left transition"
                          >
                            <LogIn className="w-4 h-4" />
                            <span>Entrar com Google</span>
                          </button>
                        )}
                      </div>

                    </div>
                  </>
                )}
              </div>

            </div>

          </div>
        </div>
      </header>

      {/* Banner de Notificação para HOJE */}
      {todayAppointments.length > 0 && (
        <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 mt-4 print:hidden">
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shrink-0">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div className="text-left">
                <h3 className="text-xs sm:text-sm font-black text-emerald-950 text-left">
                  {todayAppointments.length === 1 
                    ? 'Existe 1 consulta médica agendada para HOJE!' 
                    : `Existem ${todayAppointments.length} consultas médicas agendadas para HOJE!`}
                </h3>
                <p className="text-[11px] text-emerald-800 mt-0.5 text-left">
                  Pacientes hoje: <span className="font-bold">{todayAppointments.map(a => `${a.cliente} (${a.especialidade})`).join(', ')}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleSendAllTodayRemindersSummary}
              className="w-full md:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-xs transition flex items-center justify-center space-x-2 shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar {todayAppointments.length} Lembretes (WhatsApp)</span>
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 mt-4">
        <div className="bg-white rounded-3xl p-3 sm:p-5 shadow-xs border border-slate-200/80 mb-5 space-y-3 print:hidden">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Alternar Abas */}
            <div className="grid grid-cols-2 sm:flex items-center bg-slate-100 p-1 rounded-2xl w-full lg:w-auto">
              <button
                onClick={() => setViewMode('proximas')}
                className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  viewMode === 'proximas' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Próximas</span>
              </button>
              
              <button
                onClick={() => setViewMode('historico')}
                className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                  viewMode === 'historico' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Histórico</span>
              </button>
            </div>

            {/* Pesquisa */}
            <div className="relative flex-1 w-full lg:max-w-md text-left">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar médico, especialidade ou clínica..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none transition text-left"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

          {/* FILTRO DINÂMICO DE PACIENTES COM ARRASTAR E SOLTAR + SELETOR DE CORES */}
          <div className={`flex items-center ${isCompactPatientBar ? 'gap-1 overflow-x-auto scrollbar-none' : 'flex-wrap gap-1.5'} pt-1 text-left w-full`}>
            {!isCompactPatientBar && (
              <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0 flex items-center gap-1">
                Paciente:
              </span>
            )}
            
            <button
              onClick={() => {
                setSelectedPatient('Todos');
                setColorPickerPatient(null);
              }}
              className={`${isCompactPatientBar ? 'px-2 py-1 text-[10px] sm:text-xs' : 'px-2.5 py-1 text-xs'} rounded-xl transition shrink-0 border ${
                selectedPatient === 'Todos'
                  ? 'bg-slate-900 border-slate-900 text-white font-black'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>

            {loading ? (
              <span className="text-[11px] text-slate-400 italic font-medium px-2 py-1 bg-slate-50 rounded-lg">
                Lendo pacientes...
              </span>
            ) : (
              optionsList.clientes.map(patient => {
                const theme = getPatientTheme(patient);
                const isActive = selectedPatient === patient;
                const isBeingDragged = draggedPatient === patient;

                return (
                  <button
                    key={patient}
                    draggable
                    onDragStart={(e) => {
                      handlePatientPressEnd();
                      handleDragStartPatient(e, patient);
                    }}
                    onDragOver={handleDragOverPatient}
                    onDrop={(e) => handleDropPatient(e, patient)}
                    onDragEnd={() => setDraggedPatient(null)}
                    onMouseDown={() => handlePatientPressStart(patient)}
                    onMouseUp={handlePatientPressEnd}
                    onMouseLeave={handlePatientPressEnd}
                    onTouchStart={() => handlePatientPressStart(patient)}
                    onTouchEnd={handlePatientPressEnd}
                    onTouchMove={handlePatientPressEnd}
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={() => {
                      if (isLongPressTriggeredRef.current) {
                        isLongPressTriggeredRef.current = false;
                        return;
                      }
                      setSelectedPatient(patient);
                    }}
                    title="Toque para filtrar • Segure por 3 segundos para escolher a cor • Arraste para reordenar"
                    className={`flex items-center ${isCompactPatientBar ? 'space-x-0.5 px-1.5 sm:px-2 py-1 text-[10px] sm:text-xs' : 'space-x-1 px-2.5 py-1 text-xs'} rounded-xl transition shrink-0 border cursor-grab active:cursor-grabbing select-none ${
                      isActive ? theme.filterActive : theme.filterInactive
                    } ${isBeingDragged ? 'opacity-50 scale-95' : ''}`}
                  >
                    <GripVertical className={`${isCompactPatientBar ? 'w-2.5 h-2.5' : 'w-3 h-3'} opacity-40 shrink-0`} />
                    <span className="truncate max-w-[68px] sm:max-w-none">{patient}</span>
                    {colorPickerPatient === patient && (
                      <Palette className={`${isCompactPatientBar ? 'w-2.5 h-2.5' : 'w-3 h-3'} opacity-75 shrink-0 ml-0.5`} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Barra Pop-up Discreta de Seleção de Cor do Paciente */}
          {colorPickerPatient && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs animate-fadeIn">
              <div className="flex items-center space-x-1.5 text-slate-700 font-bold text-[11px]">
                <Palette className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Cor de <strong className="text-slate-900">{colorPickerPatient}</strong>:</span>
              </div>

              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                {Object.entries(THEME_PALETTES).map(([key, palette]) => {
                  const currentTheme = getPatientTheme(colorPickerPatient);
                  const isSelectedColor = currentTheme.swatch === palette.swatch;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectPatientColor(colorPickerPatient, key)}
                      title={palette.label}
                      className={`w-6 h-6 rounded-full ${palette.swatch} border-2 transition transform hover:scale-110 flex items-center justify-center ${
                        isSelectedColor ? 'border-slate-900 scale-110 shadow-xs' : 'border-white shadow-2xs'
                      }`}
                    >
                      {isSelectedColor && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setColorPickerPatient(null)}
                  className="ml-1 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                  title="Fechar seletor de cores"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Lista de Post-its */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs font-bold">Lendo consultas do arquivo...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-8">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Nenhuma consulta encontrada</h3>
            <p className="text-xs text-slate-500 mt-1">
              Não há agendamentos cadastrados para o filtro selecionado.
            </p>
            <button
              onClick={() => openModal()}
              className="mt-4 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-xl text-xs font-black transition"
            >
              Criar Novo Agendamento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAppointments.map(appItem => {
              const theme = getPatientTheme(appItem.cliente);
              const isToday = appItem.dia === todayStr;

              return (
                <div
                  key={appItem.id}
                  className={`relative p-5 rounded-3xl border shadow-xs transition hover:shadow-md ${theme.bg} flex flex-col justify-between text-left`}
                >
                  <div className={`absolute -top-2.5 left-6 w-5 h-5 rounded-full ${theme.pin} shadow-md border-2 border-white`} />

                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3 text-left">
                      <div className="text-left">
                        <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-black border mb-1 ${theme.badge}`}>
                          {appItem.cliente}
                        </span>
                        
                        {/* 1. Nome do Médico */}
                        <h2 className="text-base font-black tracking-tight leading-snug text-left text-slate-900">
                          {appItem.medico || 'Médico Não Informado'}
                        </h2>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => openModal(appItem)}
                          className="p-1.5 hover:bg-black/5 rounded-lg text-slate-700 transition"
                          title="Editar Consulta"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(appItem)}
                          className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-700 transition"
                          title="Excluir Consulta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-left">
                      
                      {/* 2. Especialidade */}
                      <div className="flex items-start space-x-2 text-left">
                        <Activity className="w-3.5 h-3.5 opacity-70 shrink-0 mt-0.5 text-slate-700" />
                        <span className="text-left">
                          <strong className="font-bold">Especialidade:</strong> {appItem.especialidade}
                        </span>
                      </div>

                      {/* 3. Clínica / Hospital */}
                      <div className="flex items-start space-x-2 text-left">
                        <MapPin className="w-3.5 h-3.5 opacity-70 shrink-0 mt-0.5 text-slate-700" />
                        <div className="text-left">
                          <p className="text-left"><strong className="font-bold">Clínica:</strong> {appItem.local}</p>
                          {appItem.endereco && (
                            <p className="text-[11px] opacity-80 mt-0.5 text-left">{appItem.endereco}</p>
                          )}
                        </div>
                      </div>

                      {/* Data e Hora */}
                      <div className="flex items-center space-x-2 text-left">
                        <Calendar className="w-3.5 h-3.5 opacity-70 shrink-0 text-slate-700" />
                        <span className="font-mono font-bold text-left">
                          {formatDate(appItem.dia)} {appItem.hora && appItem.hora !== '00:00' ? `às ${appItem.hora}h` : ''}
                        </span>
                        {isToday && (
                          <span className="ml-1.5 px-2 py-0.5 bg-emerald-500 text-white rounded-md text-[9px] font-black uppercase tracking-wider animate-pulse">
                            HOJE
                          </span>
                        )}
                      </div>

                      {/* Observações */}
                      {appItem.observacoes ? (
                        <div className="mt-2.5 p-2.5 bg-white/80 border border-black/10 rounded-2xl text-xs text-left space-y-0.5 shadow-2xs">
                          <div className="flex items-center space-x-1 font-bold text-slate-800 text-[11px]">
                            <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Observações:</span>
                          </div>
                          <p className="text-[11px] text-slate-700 leading-relaxed italic text-left pl-4">
                            "{appItem.observacoes}"
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2.5 p-1.5 bg-black/5 rounded-xl text-[10px] italic text-slate-500 text-left">
                          Sem observações registradas.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3 Botões Retangulares em Linha Única (Maps, Retorno, WhatsApp) */}
                  <div className="mt-4 pt-3 border-t border-black/10 grid grid-cols-3 gap-1.5 text-left">
                    <button
                      onClick={() => openGoogleMapsRoute(appItem.local, appItem.endereco)}
                      className="py-2 px-1 bg-white/90 hover:bg-white text-slate-900 rounded-xl text-[10px] font-bold transition flex items-center justify-center space-x-1 border border-black/10 shadow-2xs"
                      title="Google Maps"
                    >
                      <Navigation className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="truncate">Maps</span>
                    </button>

                    <button
                      onClick={() => openModal(appItem, true)}
                      className="py-2 px-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center space-x-1 shadow-2xs"
                      title="Agendar Retorno"
                    >
                      <RotateCcw className="w-3 h-3 shrink-0" />
                      <span className="truncate">Retorno</span>
                    </button>

                    <button
                      onClick={() => handleSendWhatsAppReminder(appItem)}
                      className="py-2 px-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-[10px] font-bold transition flex items-center justify-center space-x-1 shadow-2xs"
                      title="Enviar WhatsApp"
                    >
                      <MessageCircle className="w-3 h-3 text-amber-300 shrink-0" />
                      <span className="truncate">Whats</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de Confirmação de Exclusão */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 text-left space-y-4 border border-slate-100">
            <div className="flex items-center space-x-3 text-rose-600 border-b pb-3">
              <div className="p-2 bg-rose-100 rounded-2xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirmar Exclusão</h3>
                <p className="text-xs text-slate-500">Essa ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700">
              Tem certeza que deseja excluir a consulta de <strong className="text-slate-900">{itemToDelete.especialidade}</strong> do(a) paciente <strong className="text-slate-900">{itemToDelete.cliente}</strong> no dia <strong>{formatDate(itemToDelete.dia)}</strong>?
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cancelar Exclusão
              </button>
              <button
                type="button"
                onClick={() => handleDelete(itemToDelete.id)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Compartilhar */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 text-center space-y-4 border border-slate-100">
            <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center mx-auto">
              <Share2 className="w-6 h-6" />
            </div>
            
            <h3 className="text-base font-bold text-slate-900">Compartilhar Agenda da Família</h3>
            <p className="text-xs text-slate-600">
              Qualquer pessoa com este link pode acessar e visualizar as consultas médicas sincronizadas em tempo real.
            </p>

            <div className="p-3 bg-slate-100 rounded-2xl flex items-center justify-between text-xs">
              <span className="truncate max-w-[240px] text-slate-500 font-mono">{window.location.href}</span>
              <button
                onClick={handleCopyShareLink}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center space-x-1 shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal Guia de Instalação */}
      {showInstallGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 text-left space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-indigo-600">
                <Smartphone className="w-6 h-6" />
                <h3 className="text-base font-bold text-slate-900">Como Baixar o App no Celular</h3>
              </div>
              <button onClick={() => setShowInstallGuideModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-slate-900">
                  <span className="p-1 bg-slate-200 rounded-md"></span>
                  <span>iPhone (Safari)</span>
                </div>
                <ol className="list-decimal list-inside text-slate-600 space-y-1 text-[11px]">
                  <li>Abra este site no Safari.</li>
                  <li>Toque no botão <strong>Compartilhar</strong>.</li>
                  <li>Selecione <strong>Adicionar à Tela de Início</strong>.</li>
                </ol>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-slate-900">
                  <span className="p-1 bg-slate-200 rounded-md">🤖</span>
                  <span>Android (Chrome)</span>
                </div>
                <ol className="list-decimal list-inside text-slate-600 space-y-1 text-[11px]">
                  <li>Abra este site no Chrome.</li>
                  <li>Toque no menu de <strong>3 pontinhos</strong>.</li>
                  <li>Selecione <strong>Adicionar à tela inicial</strong>.</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowInstallGuideModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}

      {/* Modal de Lembretes do Dia */}
      {showAutoNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 text-center space-y-4 border border-slate-100 text-left">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
              <BellRing className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center">Lembretes do Dia no WhatsApp</h3>
            
            {todayAppointments.length > 0 ? (
              <div className="space-y-4 text-left">
                <p className="text-xs text-slate-600 text-center">
                  Encontramos <strong className="text-slate-900">{todayAppointments.length} consultas pendentes</strong> para hoje:
                </p>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-emerald-950">📋 Enviar Resumo Completo ({todayAppointments.length} Consultas)</span>
                  <button
                    onClick={handleSendAllTodayRemindersSummary}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition"
                  >
                    <SendHorizontal className="w-4 h-4" />
                    <span>Enviar Resumo Completo no WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">
                Não existem consultas médicas agendadas para a data de hoje ({formatDate(todayStr)}).
              </p>
            )}

            <button
              onClick={() => setShowAutoNoticeModal(false)}
              className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Form / Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-100 text-left">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between text-left">
              <div className="flex items-center space-x-2 text-left">
                {isReturnAppointment ? (
                  <RotateCcw className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Edit3 className="w-5 h-5 text-amber-400" />
                )}
                <h3 className="font-bold text-sm text-left">
                  {isReturnAppointment 
                    ? 'Agendar Retorno da Consulta' 
                    : editingId ? 'Editar Post-it de Consulta' : 'Novo Post-it de Consulta'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-left">
              
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-left">Paciente</label>
                {!isCustomCliente ? (
                  <select
                    value={formData.cliente}
                    onChange={(e) => {
                      if (e.target.value === 'NEW') {
                        setIsCustomCliente(true);
                        setFormData({ ...formData, cliente: '' });
                      } else {
                        setFormData({ ...formData, cliente: e.target.value });
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-left"
                  >
                    {optionsList.clientes.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="NEW">+ Adicionar novo paciente...</option>
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Nome do novo paciente"
                      value={formData.cliente}
                      onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                      className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-bold text-left"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomCliente(false)}
                      className="px-3 py-2.5 bg-slate-200 rounded-xl font-bold text-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-left">Especialidade Médica</label>
                {!isCustomEspecialidade ? (
                  <select
                    value={formData.especialidade}
                    onChange={(e) => {
                      if (e.target.value === 'NEW') {
                        setIsCustomEspecialidade(true);
                        setFormData({ ...formData, especialidade: '' });
                      } else {
                        setFormData({ ...formData, especialidade: e.target.value });
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left"
                  >
                    <option value="">Selecione...</option>
                    {optionsList.especialidades.map(esp => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                    <option value="NEW">+ Adicionar nova especialidade...</option>
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Ex: Cardiologista..."
                      value={formData.especialidade}
                      onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                      className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-bold text-left"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomEspecialidade(false)}
                      className="px-3 py-2.5 bg-slate-200 rounded-xl font-bold text-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-left">Nome do Médico(a)</label>
                {!isCustomMedico ? (
                  <select
                    value={formData.medico}
                    onChange={(e) => {
                      if (e.target.value === 'NEW') {
                        setIsCustomMedico(true);
                        setFormData({ ...formData, medico: '' });
                      } else {
                        setFormData({ ...formData, medico: e.target.value });
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left"
                  >
                    <option value="">Selecione...</option>
                    {optionsList.medicos.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="NEW">+ Adicionar novo médico...</option>
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Nome do profissional"
                      value={formData.medico}
                      onChange={(e) => setFormData({ ...formData, medico: e.target.value })}
                      className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-bold text-left"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomMedico(false)}
                      className="px-3 py-2.5 bg-slate-200 rounded-xl font-bold text-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-left">Nome da Clínica / Hospital</label>
                {!isCustomLocal ? (
                  <select
                    value={formData.local}
                    onChange={(e) => handleClinicChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left font-semibold"
                  >
                    <option value="">Selecione...</option>
                    {optionsList.locais.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                    <option value="NEW">+ Adicionar nova clínica...</option>
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Nome da clínica"
                      value={formData.local}
                      onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                      className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl font-bold text-left"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomLocal(false)}
                      className="px-3 py-2.5 bg-slate-200 rounded-xl font-bold text-slate-700"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-slate-700 text-left">
                    Endereço Completo {!isCustomLocal && formData.local && <span className="text-[10px] font-normal text-emerald-600">(Preenchido Automático)</span>}
                  </label>
                </div>
                <input
                  type="text"
                  placeholder={isCustomLocal ? "Digite o endereço da nova clínica..." : "Endereço da clínica"}
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  readOnly={!isCustomLocal && !!formData.local}
                  className={`w-full p-2.5 rounded-xl text-left transition ${
                    !isCustomLocal && formData.local 
                      ? 'bg-slate-100/80 border border-slate-200 text-slate-600 cursor-not-allowed font-medium' 
                      : 'bg-amber-50 border border-amber-300 text-slate-900 font-bold'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-left">Data da Consulta</label>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={formData.dia}
                    onChange={(e) => setFormData({ ...formData, dia: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-left focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-left">Horário</label>
                  <input
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-left"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-left">Observações Adicionais</label>
                <textarea
                  placeholder="Instruções de jejum, documentos..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl h-20 text-left"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-black rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 transition"
                >
                  {isReturnAppointment ? 'Confirmar Retorno' : editingId ? 'Salvar Alterações' : 'Criar Post-it'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}