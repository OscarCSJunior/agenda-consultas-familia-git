import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
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
  RefreshCw,
  FileText
} from 'lucide-react';

// ============================================================================
// ATENÇÃO: COLE AQUI SUAS CHAVE DE CONFIGURAÇÃO DO FIREBASE (PROJETO REAL)
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

// Verifica se as chaves foram alteradas do padrão
const isDummyConfig = firebaseConfig.apiKey.includes("DummyKey");

let app, auth, db;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.warn("Falha ao inicializar o Firebase SDK:", error);
}

const LOCAL_STORAGE_KEY = 'consultas_medicas_backup_data_v5';

const INITIAL_APPOINTMENTS = [
  { cliente: 'Tania', especialidade: 'Oftalmologista', medico: 'Luiz Fernando Pozzi', local: 'COH - Franceschini', endereco: 'Rua Franceschini, Campinas - SP', dia: '2026-10-31', hora: '00:00' },
  { cliente: 'Oscar', especialidade: 'Exame', medico: 'sem nome', local: 'DMS Burnier', endereco: 'Av. Dr. Alberto Sarmento, Campinas - SP', dia: '2026-11-02', hora: '09:00' },
  { cliente: 'Bruna', especialidade: 'Podologa', medico: 'Lucineia Dias', local: 'Podoclinica', endereco: 'Podoclinica, Campinas - SP', dia: '2026-11-03', hora: '10:00' },
  { cliente: 'Tania', especialidade: 'Cardiologista', medico: 'Alexandre', local: 'Amanda', endereco: 'Clinica Amanda, Campinas - SP', dia: '2026-11-03', hora: '14:50' },
  { cliente: 'Oscar', especialidade: 'Otorrinolaringologista', medico: 'Danila', local: 'Unison', endereco: 'Clinica Unison, Campinas - SP', dia: '2026-11-07', hora: '09:00' },
  { cliente: 'Tania', especialidade: 'Acupuntura', medico: 'Dr. Tadeu', local: 'white', endereco: 'Clinica White, Campinas - SP', dia: '2026-11-09', hora: '17:00' },
  { cliente: 'Tania', especialidade: 'Alergologista', medico: 'Caludia Leite', local: 'Pro Vida', endereco: 'Clinica Pro Vida, Campinas - SP', dia: '2026-11-11', hora: '09:00' },
  { cliente: 'Tania', especialidade: 'Dentista', medico: 'Sarah/Caio', local: 'ICS', endereco: 'ICS Odontologia, Campinas - SP', dia: '2026-11-12', hora: '10:30' },
  { cliente: 'Oscar', especialidade: 'Endocrino', medico: 'Dr Bradley', local: 'white', endereco: 'Clinica White, Campinas - SP', dia: '2026-11-16', hora: '00:00' },
  { cliente: 'Tania', especialidade: 'Endocrino', medico: 'Dr Bradley', local: 'white', endereco: 'Clinica White, Campinas - SP', dia: '2026-11-16', hora: '15:40' },
  { cliente: 'Bruna', especialidade: 'Psiquiatria', medico: 'André Akamini', local: 'Fco Glicerio', endereco: 'Av. Fco Glicerio, 1867 - 9ºandar - sala 92, Campinas - SP', dia: '2026-11-25', hora: '10:40' },
  { cliente: 'Tania', especialidade: 'Ginecologista', medico: 'Dr. Francisco', local: 'Clinmed', endereco: 'Clinica Clinmed, Campinas - SP', dia: '2026-11-30', hora: '11:45' },
  { cliente: 'Bruna', especialidade: 'Reumatologista', medico: 'Marina', local: 'Especialidades', endereco: 'Centro de Especialidades, Campinas - SP', dia: '2027-01-08', hora: '10:20' }
];

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAutoNoticeModal, setShowAutoNoticeModal] = useState(false);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState(false);
  const [showSyncInfoModal, setShowSyncInfoModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  // Referência para mover o foco para a Data da Consulta
  const dateInputRef = useRef(null);
  
  // Estado para Modal de Confirmação de Exclusão
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Status da Nuvem
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

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

  // Conectar ou recuar para armazenamento local
  useEffect(() => {
    if (isDummyConfig || !db || !auth) {
      setIsCloudConnected(false);
      setConnectionError("As chaves reais do Firebase não foram coladas no arquivo App.jsx.");
      loadFromLocalStorage();
      return;
    }

    let unsubscribeSnapshot;

    const initFirebaseSync = async () => {
      try {
        await signInAnonymously(auth);
        
        // Conexão em Tempo Real
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
              // Se o banco online estiver vazio, popula com os dados base
              seedCloudDatabase(colRef);
            }
            setIsCloudConnected(true);
            setConnectionError(null);
            setLoading(false);
          }, 
          (err) => {
            console.warn("Erro ao ler banco de dados do Firebase:", err);
            setIsCloudConnected(false);
            setConnectionError(err.message);
            loadFromLocalStorage();
          }
        );
      } catch (err) {
        console.warn("Falha ao autenticar no Firebase:", err);
        setIsCloudConnected(false);
        setConnectionError(err.message);
        loadFromLocalStorage();
      }
    };

    initFirebaseSync();

    return () => {
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

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
      console.error("Erro ao popular o banco:", err);
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

    return {
      clientes: Array.from(clientesSet).sort(sortFn),
      especialidades: Array.from(espSet).sort(sortFn),
      medicos: Array.from(medSet).sort(sortFn),
      locais: Array.from(localSet).sort(sortFn)
    };
  }, [appointments, loading]);

  const handleSendWhatsAppReminder = (appItem) => {
    const dataFormatada = formatDate(appItem.dia);
    const horaFormatada = appItem.hora === '00:00' ? 'A confirmar' : `${appItem.hora}h`;
    const localInfo = [appItem.local, appItem.endereco].filter(Boolean).join(' - ');
    const queryMaps = encodeURIComponent([appItem.local, appItem.endereco].filter(Boolean).join(', '));
    const mapsLink = `https://www.google.com/maps/search/?api=1&query=${queryMaps}`;

    const mensagem = 
`📌 *LEMBRETE DE CONSULTA MÉDICA* 📌

Olá *${appItem.cliente}*, segue o lembrete da sua consulta:

🩺 *Especialidade:* ${appItem.especialidade}
👨‍⚕️ *Médico(a):* ${appItem.medico || 'Não especificado'}
📅 *Data:* ${dataFormatada} às ${horaFormatada}
🏥 *Local:* ${localInfo}

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
      mensagem += `🩺 *Especialidade:* ${appItem.especialidade}\n`;
      mensagem += `👨‍⚕️ *Médico(a):* ${appItem.medico || 'Não especificado'}\n`;
      mensagem += `🕒 *Horário:* ${horaFormatada}\n`;
      mensagem += `🏥 *Local:* ${localInfo}\n`;
      mensagem += `🗺️ *Google Maps:* ${mapsLink}\n\n`;
    });

    mensagem += `_Por favor, fiquem atentos aos horários!_`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  const handleSendEmailReminder = (appItem) => {
    const dataFormatada = formatDate(appItem.dia);
    const horaFormatada = appItem.hora === '00:00' ? 'A confirmar' : `${appItem.hora}h`;
    const localInfo = [appItem.local, appItem.endereco].filter(Boolean).join(' - ');

    const assunto = encodeURIComponent(`Lembrete de Consulta Médica: ${appItem.especialidade} - ${appItem.cliente}`);
    const corpo = encodeURIComponent(
`Olá,

Segue o lembrete da consulta agendada:

• Paciente: ${appItem.cliente}
• Especialidade: ${appItem.especialidade}
• Médico(a): ${appItem.medico || 'Não informado'}
• Data: ${dataFormatada} às ${horaFormatada}
• Local: ${localInfo}

Atenciosamente,
Agenda Familiar de Consultas`
    );

    window.open(`mailto:?subject=${assunto}&body=${corpo}`, '_blank');
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
      // Busca o último endereço cadastrado para essa clínica padrão, se existir
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

  // Função para tratar a seleção da clínica, autopreenchendo endereço e mudando o foco para a data
  const handleClinicChange = (selectedLocal) => {
    if (selectedLocal === 'NEW') {
      setIsCustomLocal(true);
      setFormData(prev => ({ ...prev, local: '', endereco: '' }));
    } else {
      setIsCustomLocal(false);
      // Localiza o endereço associado a esta clínica nos agendamentos
      const matchingApp = appointments.find(a => a.local === selectedLocal && a.endereco);
      const foundAddress = matchingApp ? matchingApp.endereco : '';
      
      setFormData(prev => ({ 
        ...prev, 
        local: selectedLocal, 
        endereco: foundAddress 
      }));

      // Move o foco diretamente para a Data da Consulta
      setTimeout(() => {
        if (dateInputRef.current) {
          dateInputRef.current.focus();
        }
      }, 50);
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

  const getPatientTheme = (name) => {
    switch (name) {
      case 'Tania':
        return {
          bg: 'bg-pink-100 border-pink-300 text-pink-950',
          pin: 'bg-rose-500',
          badge: 'bg-pink-200 text-pink-800 border-pink-300',
          filterActive: 'bg-pink-200 border-pink-400 text-pink-900 font-black shadow-xs ring-2 ring-pink-400',
          filterInactive: 'bg-pink-50/80 text-pink-800 border-pink-200 hover:bg-pink-100',
        };
      case 'Oscar':
        return {
          bg: 'bg-amber-100 border-amber-300 text-amber-950',
          pin: 'bg-amber-500',
          badge: 'bg-amber-200 text-amber-900 border-amber-300',
          filterActive: 'bg-amber-200 border-amber-400 text-amber-950 font-black shadow-xs ring-2 ring-amber-400',
          filterInactive: 'bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100',
        };
      case 'Bruna':
        return {
          bg: 'bg-purple-100 border-purple-300 text-purple-950',
          pin: 'bg-purple-500',
          badge: 'bg-purple-200 text-purple-900 border-purple-300',
          filterActive: 'bg-purple-200 border-purple-400 text-purple-950 font-black shadow-xs ring-2 ring-purple-400',
          filterInactive: 'bg-purple-50/80 text-purple-800 border-purple-200 hover:bg-purple-100',
        };
      default:
        return {
          bg: 'bg-emerald-100 border-emerald-300 text-emerald-950',
          pin: 'bg-emerald-500',
          badge: 'bg-emerald-200 text-emerald-900 border-emerald-300',
          filterActive: 'bg-emerald-200 border-emerald-400 text-emerald-950 font-black shadow-xs ring-2 ring-emerald-400',
          filterInactive: 'bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-12">
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center space-x-3 text-left w-full sm:w-auto">
              <div className="p-2 bg-amber-400 text-slate-900 rounded-2xl shadow-md">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2 text-left">
                  Agenda de Consultas
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold">
                    Post-its
                  </span>
                </h1>
                
                {/* STATUS DA CONEXÃO DE SINCRONIZAÇÃO DA NUVEM */}
                <button 
                  onClick={() => setShowSyncInfoModal(true)}
                  className="mt-1 flex items-center gap-1.5 text-xs text-left cursor-pointer hover:opacity-80 transition"
                >
                  {isCloudConnected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Sincronizado na Nuvem (Todos Vêem)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      Salvo Apenas Neste Aparelho (Clique para Ativar)
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-wrap gap-y-2">
              <button
                onClick={() => setShowSyncInfoModal(true)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                  isCloudConnected ? 'bg-emerald-800/60 text-emerald-200 border border-emerald-600' : 'bg-amber-600 text-white font-black animate-pulse'
                }`}
              >
                {isCloudConnected ? <Cloud className="w-4 h-4 text-emerald-300" /> : <CloudOff className="w-4 h-4" />}
                <span>{isCloudConnected ? 'Nuvem OK' : 'Ativar Nuvem'}</span>
              </button>

              <button
                onClick={() => setShowInstallGuideModal(true)}
                className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Smartphone className="w-4 h-4" />
                <span>Baixar no Celular</span>
              </button>

              <button
                onClick={() => setShowAutoNoticeModal(true)}
                className="relative flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <BellRing className="w-4 h-4" />
                <span>Notificar Hoje</span>
                {todayAppointments.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-amber-950 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-slate-900 animate-bounce">
                    {todayAppointments.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => openModal()}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-xl text-xs font-black shadow-xs transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Post-it</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Alerta de Desconexão da Nuvem */}
      {!isCloudConnected && !loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-xs flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3 text-left">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
              <div className="text-left">
                <h4 className="text-xs font-black text-amber-950">A Sincronização entre Notebook e Celular não está ativa!</h4>
                <p className="text-[11px] text-amber-800">
                  Os dados digitados neste aparelho não aparecerão no celular dos outros familiares até que as chaves reais do Firebase sejam coladas no arquivo.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSyncInfoModal(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black rounded-xl text-xs shadow-xs"
            >
              Ver Passo a Passo para Ativar
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/80 mb-6 space-y-4">
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Alternar Abas */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setViewMode('proximas')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  viewMode === 'proximas' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-4 h-4 text-amber-500" />
                <span>Próximos Agendamentos</span>
              </button>
              
              <button
                onClick={() => setViewMode('historico')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  viewMode === 'historico' 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-4 h-4 text-indigo-500" />
                <span>Histórico Passado</span>
              </button>
            </div>

            {/* Pesquisa */}
            <div className="relative flex-1 max-w-md text-left">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar especialidade, médico ou clínica..."
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

          {/* FILTRO DE PACIENTES */}
          <div className="flex items-center space-x-2 overflow-x-auto pt-2 pb-1 scrollbar-none text-left">
            <span className="text-xs font-bold text-slate-500 mr-1 shrink-0">Paciente:</span>
            
            <button
              onClick={() => setSelectedPatient('Todos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs transition shrink-0 border ${
                selectedPatient === 'Todos'
                  ? 'bg-slate-900 border-slate-900 text-white font-black shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>

            {loading ? (
              <span className="text-[11px] text-slate-400 italic font-medium px-2 py-1 bg-slate-50 rounded-lg">
                Lendo lista de pacientes...
              </span>
            ) : (
              optionsList.clientes.map(patient => {
                const theme = getPatientTheme(patient);
                const isActive = selectedPatient === patient;

                return (
                  <button
                    key={patient}
                    onClick={() => setSelectedPatient(patient)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs transition shrink-0 border ${
                      isActive ? theme.filterActive : theme.filterInactive
                    }`}
                  >
                    {patient}
                  </button>
                );
              })
            )}
          </div>

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
              className="mt-4 px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 rounded-xl text-xs font-black shadow-xs transition"
            >
              Criar Novo Agendamento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.map(appItem => {
              const theme = getPatientTheme(appItem.cliente);
              const isToday = appItem.dia === todayStr;

              return (
                <div
                  key={appItem.id}
                  className={`relative p-6 rounded-3xl border shadow-sm transition hover:shadow-md ${theme.bg} flex flex-col justify-between text-left`}
                >
                  <div className={`absolute -top-2.5 left-6 w-5 h-5 rounded-full ${theme.pin} shadow-md border-2 border-white`} />

                  <div>
                    <div className="flex items-start justify-between gap-2 mb-4 text-left">
                      <div className="text-left">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-black border mb-1.5 ${theme.badge}`}>
                          {appItem.cliente}
                        </span>
                        <h2 className="text-base font-black tracking-tight leading-snug text-left">
                          {appItem.especialidade}
                        </h2>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => openModal(appItem, true)}
                          className="p-1.5 hover:bg-emerald-500/15 rounded-lg text-emerald-800 transition flex items-center gap-1"
                          title="Agendar Retorno"
                        >
                          <RotateCcw className="w-4 h-4 text-emerald-700" />
                        </button>
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

                    <div className="space-y-2.5 text-xs text-left">
                      <div className="flex items-start space-x-2.5 text-left">
                        <User className="w-4 h-4 opacity-70 shrink-0 mt-0.5" />
                        <span className="text-left"><strong className="font-bold">Médico(a):</strong> {appItem.medico || 'Não informado'}</span>
                      </div>

                      <div className="flex items-start space-x-2.5 text-left">
                        <MapPin className="w-4 h-4 opacity-70 shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="text-left"><strong className="font-bold">Clínica:</strong> {appItem.local}</p>
                          {appItem.endereco && (
                            <p className="text-[11px] opacity-80 mt-0.5 text-left">{appItem.endereco}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5 text-left">
                        <Calendar className="w-4 h-4 opacity-70 shrink-0" />
                        <span className="font-mono font-bold text-left">
                          {formatDate(appItem.dia)} {appItem.hora && appItem.hora !== '00:00' ? `às ${appItem.hora}h` : ''}
                        </span>
                        {isToday && (
                          <span className="ml-2 px-2 py-0.5 bg-emerald-500 text-white rounded-md text-[10px] font-black uppercase tracking-wider animate-pulse">
                            HOJE
                          </span>
                        )}
                      </div>

                      {/* Exibição Destacada do Campo de Observações */}
                      {appItem.observacoes ? (
                        <div className="mt-3 p-3 bg-white/70 border border-black/10 rounded-2xl text-xs text-left space-y-1 shadow-2xs">
                          <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                            <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Observações:</span>
                          </div>
                          <p className="text-[11px] text-slate-700 leading-relaxed italic text-left pl-5">
                            "{appItem.observacoes}"
                          </p>
                        </div>
                      ) : (
                        <div className="mt-3 p-2 bg-black/5 rounded-xl text-[10px] italic text-slate-500 text-left">
                          Sem observações registradas.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-black/10 flex flex-col gap-2 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => openGoogleMapsRoute(appItem.local, appItem.endereco)}
                        className="w-full py-2 px-3 bg-white/80 hover:bg-white text-slate-900 rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 border border-black/10"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ver Rota no Maps</span>
                      </button>

                      <button
                        onClick={() => openModal(appItem, true)}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Agendar Retorno</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSendWhatsAppReminder(appItem)}
                        className="py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center space-x-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleSendEmailReminder(appItem)}
                        className="py-1.5 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center space-x-1"
                      >
                        <Mail className="w-3 h-3 text-amber-400" />
                        <span>E-mail</span>
                      </button>
                    </div>
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
              Tem certeza que deseja excluir o agendamento de <strong className="text-slate-900">{itemToDelete.especialidade}</strong> do(a) paciente <strong className="text-slate-900">{itemToDelete.cliente}</strong> no dia <strong>{formatDate(itemToDelete.dia)}</strong>?
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
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-xs transition"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Instruções de Sincronização na Nuvem */}
      {showSyncInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 text-left space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-amber-600">
                <Cloud className="w-6 h-6" />
                <h3 className="text-base font-bold text-slate-900">Como Ativar a Sincronização Celular/Notebook</h3>
              </div>
              <button onClick={() => setShowSyncInfoModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Para que todos os aparelhos (computador e celulares da Tania, Oscar e Bruna) leiam e gravem as consultas em tempo real, siga estes 2 passos:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <h4 className="font-bold text-slate-900 mb-1">1. Pegar as chaves no Firebase:</h4>
                <p className="text-slate-600 text-[11px]">
                  Acesse <strong>console.firebase.google.com</strong> &gt; Engrenagem ⚙️ &gt; Configurações do Projeto &gt; Role até o fim e copie o trecho <code>const firebaseConfig = ...</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <h4 className="font-bold text-slate-900 mb-1">2. Colar no topo do arquivo <code>App.jsx</code>:</h4>
                <p className="text-slate-600 text-[11px]">
                  Abra o arquivo <strong>App.jsx</strong> e substitua as chaves genéricas pelas suas chaves reais na linha 35.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSyncInfoModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}

      {/* Modal de Cadastro */}
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
              
              {/* Campo Paciente */}
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

              {/* Campo Especialidade */}
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

              {/* Campo Médico */}
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

              {/* Campo Nome da Clínica */}
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

              {/* Campo Endereço (Desabilitado / Automático quando a clínica já existe) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-bold text-slate-700 text-left">
                    Endereço Completo {!isCustomLocal && formData.local && <span className="text-[10px] font-normal text-emerald-600">(Preenchido Automaticamente)</span>}
                  </label>
                  {(formData.endereco || formData.local) && (
                    <button
                      type="button"
                      onClick={() => openGoogleMapsRoute(formData.local, formData.endereco)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <SearchCheck className="w-3.5 h-3.5" />
                      <span>Testar no Maps</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={isCustomLocal ? "Digite o endereço da nova clínica..." : "Endereço associado à clínica"}
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

              {/* Data e Horário */}
              <div className={`grid grid-cols-2 gap-3 p-3 rounded-2xl transition ${isReturnAppointment ? 'bg-emerald-100/60 border border-emerald-300' : ''}`}>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-left">
                    Data {isReturnAppointment && <span className="text-emerald-700 font-black">(Foco Retorno)</span>}
                  </label>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={formData.dia}
                    onChange={(e) => setFormData({ ...formData, dia: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-left focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    required
                    autoFocus={isReturnAppointment}
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

              {/* Observações */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-left">Observações Adicionais</label>
                <textarea
                  placeholder="Instruções de jejum, documentos..."
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl h-20 text-left"
                />
              </div>

              {/* Botões do Formulário */}
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
                  className={`px-5 py-2 font-black rounded-xl shadow-xs ${
                    isReturnAppointment 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                      : 'bg-amber-400 hover:bg-amber-500 text-amber-950'
                  }`}
                >
                  {isReturnAppointment ? 'Confirmar Retorno' : editingId ? 'Salvar Alterações' : 'Criar Post-it'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal de Compartilhamento */}
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
              <button 
                onClick={() => setShowInstallGuideModal(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Siga os passos abaixo no navegador do celular de cada pessoa da família para criar o ícone de atalho na tela inicial:
            </p>

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

      {/* Modal Lembretes do Dia */}
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
                  <p className="text-[11px] text-emerald-800">
                    Gera uma única mensagem contendo todas as consultas de hoje formatadas com links do Maps.
                  </p>
                  <button
                    onClick={handleSendAllTodayRemindersSummary}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-xs transition"
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

    </div>
  );
}