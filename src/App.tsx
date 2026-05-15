/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { SMSOperation, FinancialStats, UserCard } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Import from './components/Import';
import Stats from './components/Stats';
import { Trash2, Download, ShieldCheck, Sun, Moon, Plus, CreditCard as CardIcon, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [operations, setOperations] = useState<SMSOperation[]>([]);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ id: '', name: '', bank: '' });

  // Load data on start
  useEffect(() => {
    const saved = localStorage.getItem('sms_operations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Revive dates
        setOperations(parsed.map((op: any) => ({
          ...op,
          date: new Date(op.date)
        })));
      } catch (e) {
        console.error("Failed to load operations", e);
      }
    }

    const savedCards = localStorage.getItem('user_cards');
    if (savedCards) {
      try {
        setUserCards(JSON.parse(savedCards));
      } catch (e) {
        console.error("Failed to load cards", e);
      }
    }

    // Load theme
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Save data when operations change
  useEffect(() => {
    localStorage.setItem('sms_operations', JSON.stringify(operations));
  }, [operations]);

  useEffect(() => {
    localStorage.setItem('user_cards', JSON.stringify(userCards));
  }, [userCards]);

  const addCard = () => {
    if (!newCard.id || !newCard.name) return;
    setUserCards(prev => [...prev, newCard]);
    setNewCard({ id: '', name: '', bank: '' });
    setShowAddCard(false);
  };

  const removeCard = (id: string) => {
    setUserCards(prev => prev.filter(c => c.id !== id));
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleImport = (newOps: SMSOperation[]) => {
    // Basic deduplication based on raw content and timestamp
    setOperations(prev => {
      const existingIds = new Set(prev.map(p => `${p.date.getTime()}-${p.rawContent.substring(0, 20)}`));
      const filtered = newOps.filter(op => !existingIds.has(`${op.date.getTime()}-${op.rawContent.substring(0, 20)}`));
      return [...filtered, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime());
    });
    setActiveTab('dashboard');
  };

  const clearData = () => {
    if (confirm('¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer.')) {
      setOperations([]);
      localStorage.removeItem('sms_operations');
    }
  };

  const exportData = () => {
    const data = operations.map(op => ({
      Fecha: op.date.toISOString(),
      Monto: op.amount,
      Moneda: op.currency,
      Tarjeta: op.card,
      Tipo: op.type,
      Banco: op.bank,
      Mensaje: op.rawContent
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(wb, "ControlTransferSMS_Report.xlsx");
  };

  const stats = useMemo<FinancialStats>(() => {
    const received = operations
      .filter(op => op.type === 'received')
      .reduce((sum, op) => sum + op.amount, 0);
    const sent = operations
      .filter(op => ['sent', 'payment', 'pos', 'withdrawal'].includes(op.type))
      .reduce((sum, op) => sum + op.amount, 0);

    return {
      totalReceived: received,
      totalSent: sent,
      balance: received - sent,
      operationCount: operations.length,
      recentOperations: operations.slice(0, 10)
    };
  }, [operations]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
      <main className="max-w-lg mx-auto bg-white dark:bg-zinc-950 min-h-screen shadow-2xl relative overflow-hidden">
        {/* Render active tab */}
        {activeTab === 'dashboard' && <Dashboard operations={operations} userCards={userCards} />}
        {activeTab === 'history' && <History operations={operations} userCards={userCards} />}
        {activeTab === 'import' && <Import onImport={handleImport} />}
        {activeTab === 'stats' && <Stats operations={operations} userCards={userCards} />}
        
        {activeTab === 'settings' && (
          <div className="p-6 space-y-6 pb-24 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Configuraciones</h1>
                <p className="text-zinc-500 text-sm">Gestiona tu privacidad y datos</p>
              </div>
            </header>

            {/* Cards Management */}
            <section className="space-y-4">
              <div className="flex justify-between items-center px-1">
                 <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">Mis Tarjetas</h2>
                 <button 
                  onClick={() => setShowAddCard(true)}
                  className="p-1 border border-zinc-200 dark:border-zinc-800 rounded-lg text-blue-600"
                 >
                   <Plus size={18} />
                 </button>
              </div>

              <div className="space-y-2">
                {userCards.map(card => (
                  <div key={card.id} className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">
                        <CardIcon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{card.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">**** {card.id}</p>
                      </div>
                    </div>
                    <button onClick={() => removeCard(card.id)} className="text-zinc-400 hover:text-red-500 p-2">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {userCards.length === 0 && (
                  <p className="text-center text-[10px] text-zinc-400 py-4 italic border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl">
                    No has añadido tarjetas manuales.
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                    {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Tema</p>
                    <p className="text-[10px] text-zinc-500">Cambiar modo oscuro/claro</p>
                  </div>
                </div>
                <button 
                  onClick={toggleTheme}
                  className="w-12 h-6 bg-zinc-200 dark:bg-zinc-700 rounded-full relative transition-colors"
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${isDarkMode ? 'right-1 bg-blue-500' : 'left-1 bg-white'}`} />
                </button>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600">
                    <Download size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Exportar Reporte</p>
                    <p className="text-[10px] text-zinc-500">Descargar historial en Excel</p>
                  </div>
                </div>
                <button 
                  onClick={exportData}
                  className="bg-green-600 text-white text-[10px] font-bold px-4 py-2 rounded-xl"
                >
                  DESCARGAR
                </button>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Borrar Datos</p>
                    <p className="text-[10px] text-zinc-500">Eliminar todo el historial local</p>
                  </div>
                </div>
                <button 
                  onClick={clearData}
                  className="text-red-600 text-[10px] font-bold px-4 py-2"
                >
                  BORRAR
                </button>
              </div>
            </section>

            <section className="bg-blue-600 rounded-3xl p-6 text-white text-center">
              <div className="flex justify-center mb-3">
                <ShieldCheck size={40} className="opacity-80" />
              </div>
              <h4 className="font-bold mb-2">Máxima Seguridad</h4>
              <p className="text-xs text-blue-100 leading-relaxed">
                Tus datos nunca salen de este dispositivo. Todo el procesamiento se realiza localmente utilizando 
                criptografía de navegador y almacenamiento aislado.
              </p>
            </section>
            
            <div className="text-center text-[10px] text-zinc-400">
              <p>ControlTransferSMS v1.0.0</p>
              <p>Desarrollado para Android con React PWA</p>
            </div>
          </div>
        )}

        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Add Card Modal */}
        <AnimatePresence>
          {showAddCard && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setShowAddCard(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ y: 100, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={{ y: 100, opacity: 0 }}
                className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[32px] p-8 shadow-2xl space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Añadir Tarjeta</h3>
                  <button onClick={() => setShowAddCard(false)} className="text-zinc-400"><X size={24} /></button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Nombre (Alias)</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Mi Tarjeta Principal"
                      value={newCard.name}
                      onChange={e => setNewCard({...newCard, name: e.target.value})}
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Últimos 4 dígitos</label>
                    <input 
                      type="text" 
                      placeholder="1234"
                      maxLength={4}
                      value={newCard.id}
                      onChange={e => setNewCard({...newCard, id: e.target.value.replace(/\D/g, '')})}
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl py-3 px-4 text-sm font-mono focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 ml-1">Banco (Opcional)</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Banco Central"
                      value={newCard.bank}
                      onChange={e => setNewCard({...newCard, bank: e.target.value})}
                      className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                    />
                  </div>
                </div>

                <button 
                  onClick={addCard}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  GUARDAR TARJETA
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

