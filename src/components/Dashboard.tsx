/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { SMSOperation, FinancialStats, UserCard } from '../types';
import { ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, TrendingUp, Calendar, ChevronDown, Check } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format, subDays, startOfDay, subMonths, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardProps {
  operations: SMSOperation[];
  userCards: UserCard[];
}

export default function Dashboard({ operations, userCards }: DashboardProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>('all');
  const [timeframe, setTimeframe] = useState<'semanal' | 'mensual'>('semanal');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const getCardName = (id: string) => {
    const card = userCards.find(c => c.id === id);
    return card ? card.name : `Tarjeta ****${id}`;
  };

  // Filter operations based on selected card and timeframe
  const filteredOps = useMemo(() => {
    let ops = selectedCardId === 'all' 
      ? operations 
      : operations.filter(op => op.card === selectedCardId);

    const cutoffDate = timeframe === 'semanal' ? subDays(new Date(), 7) : subMonths(new Date(), 1);
    return ops.filter(op => isAfter(op.date, startOfDay(cutoffDate)));
  }, [operations, selectedCardId, timeframe]);

  // Calculate local stats for the selector and dashboard summary
  const getStatsForCard = (id: string, ops: SMSOperation[]) => {
    const cardOps = id === 'all' ? ops : ops.filter(o => o.card === id);
    const received = cardOps.filter(o => o.type === 'received').reduce((sum, o) => sum + o.amount, 0);
    const sent = cardOps.filter(o => ['sent', 'payment', 'pos', 'withdrawal'].includes(o.type)).reduce((sum, o) => sum + o.amount, 0);
    return { balance: received - sent, count: cardOps.length };
  };

  const localStats = useMemo(() => {
    const received = filteredOps
      .filter(op => op.type === 'received')
      .reduce((sum, op) => sum + op.amount, 0);
    const sent = filteredOps
      .filter(op => ['sent', 'payment', 'pos', 'withdrawal'].includes(op.type))
      .reduce((sum, op) => sum + op.amount, 0);

    return {
      totalReceived: received,
      totalSent: sent,
      balance: received - sent,
      operationCount: filteredOps.length
    };
  }, [filteredOps]);

  const activeCardInfo = useMemo(() => {
    if (selectedCardId === 'all') return { name: 'Todas las Cuentas', id: 'all' };
    return userCards.find(c => c.id === selectedCardId) || { name: `Tarjeta ****${selectedCardId}`, id: selectedCardId };
  }, [selectedCardId, userCards]);

  // Prepare chart data based on timeframe
  const chartData = useMemo(() => {
    const days = timeframe === 'semanal' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayOps = filteredOps.filter(op => format(op.date, 'yyyy-MM-dd') === dateStr);
      const received = dayOps.filter(op => op.type === 'received').reduce((sum, op) => sum + op.amount, 0);
      const sent = dayOps.filter(op => ['sent', 'payment', 'pos', 'withdrawal'].includes(op.type)).reduce((sum, op) => sum + op.amount, 0);

      return {
        name: timeframe === 'semanal' ? format(date, 'EEE', { locale: es }) : format(date, 'd MMM', { locale: es }),
        received,
        sent,
      };
    });
  }, [filteredOps, timeframe]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <header className="px-6 pt-8 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Hola de nuevo</h1>
          <p className="text-zinc-500 text-sm">Resumen de tu actividad bancaria</p>
        </div>
      </header>

      {/* Modern Card Selector */}
      <div className="px-4">
        <button 
          onClick={() => setIsSelectorOpen(true)}
          className="w-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-[28px] shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600">
              <CreditCard size={24} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Cuenta Seleccionada</p>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                {activeCardInfo.name}
                <ChevronDown size={14} className="text-zinc-400 group-hover:translate-y-0.5 transition-transform" />
              </h3>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold text-blue-600 uppercase mb-0.5">Total {timeframe}</p>
             <p className="font-bold text-zinc-900 dark:text-zinc-50 text-lg">
               ${localStats.balance.toLocaleString('es-ES')}
             </p>
          </div>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 px-4">
        <motion.div 
          layout
          className="col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl shadow-lg shadow-blue-200 dark:shadow-none text-white overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet size={80} />
          </div>
          <div className="flex justify-between items-start mb-1">
            <p className="text-blue-100 text-sm font-medium">Balance {timeframe}</p>
            <div className="flex bg-white/20 p-0.5 rounded-lg">
               <button 
                onClick={(e) => { e.stopPropagation(); setTimeframe('semanal'); }}
                className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold transition-all", timeframe === 'semanal' ? "bg-white text-blue-600" : "text-white")}
               >SEM</button>
               <button 
                onClick={(e) => { e.stopPropagation(); setTimeframe('mensual'); }}
                className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold transition-all", timeframe === 'mensual' ? "bg-white text-blue-600" : "text-white")}
               >MES</button>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            ${localStats.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </h2>
          <div className="flex gap-4 text-xs font-medium uppercase tracking-wider">
            <span className="bg-white/20 px-3 py-1 rounded-full">{localStats.operationCount} ops</span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              {activeCardInfo.name}
            </span>
          </div>
        </motion.div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
            <div className="p-1.5 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <ArrowUpRight size={16} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight">Ingresos</span>
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            +${localStats.totalReceived.toLocaleString('es-ES')}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
            <div className="p-1.5 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <ArrowDownLeft size={16} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-tight">Gastos</span>
          </div>
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            -${localStats.totalSent.toLocaleString('es-ES')}
          </p>
        </div>
      </div>

      {/* Selection Backdrop & List */}
      <AnimatePresence>
        {isSelectorOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSelectorOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-t-[40px] px-6 pt-4 pb-12 shadow-2xl overflow-hidden"
            >
              <div className="w-12 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-auto mb-8" />
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 px-2">Seleccionar Cuenta</h3>
              
              <div className="space-y-2 max-h-[60vh] overflow-y-auto no-scrollbar">
                <button
                  onClick={() => { setSelectedCardId('all'); setIsSelectorOpen(false); }}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-3xl transition-all border",
                    selectedCardId === 'all' 
                      ? "bg-blue-600 text-white border-transparent" 
                      : "bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", selectedCardId === 'all' ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600")}>
                      <Wallet size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Todas las Cuentas</p>
                      <p className={cn("text-[10px]", selectedCardId === 'all' ? "text-blue-100" : "text-zinc-400")}>Global</p>
                    </div>
                  </div>
                  {selectedCardId === 'all' && <Check size={20} />}
                </button>

                {userCards.map(card => {
                  const cardStats = getStatsForCard(card.id, operations);
                  return (
                    <button
                      key={card.id}
                      onClick={() => { setSelectedCardId(card.id); setIsSelectorOpen(false); }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-3xl transition-all border",
                        selectedCardId === card.id 
                          ? "bg-blue-600 text-white border-transparent shadow-lg shadow-blue-200" 
                          : "bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-zinc-800"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", selectedCardId === card.id ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-500")}>
                          <CreditCard size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold">{card.name}</p>
                          <p className={cn("text-[10px]", selectedCardId === card.id ? "text-blue-100" : "text-zinc-400")}>**** {card.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className={cn("text-xs font-bold", selectedCardId === card.id ? "text-white" : "text-zinc-900 dark:text-zinc-100")}>
                           ${cardStats.balance.toLocaleString('es-ES')}
                         </span>
                         {selectedCardId === card.id && <Check size={20} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chart Section */}
      <div className="px-4">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center justify-between">
             <span className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              Flujo de Caja ({timeframe})
             </span>
             <span className="text-xs text-zinc-400 font-normal">
               {selectedCardId === 'all' ? 'Global' : getCardName(selectedCardId)}
             </span>
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fill: '#6B7280'}}
                  interval={timeframe === 'semanal' ? 0 : 6} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="received" stroke="#10b981" fillOpacity={1} fill="url(#colorReceived)" strokeWidth={2} name="Recibido" />
                <Area type="monotone" dataKey="sent" stroke="#ef4444" fillOpacity={1} fill="url(#colorSent)" strokeWidth={2} name="Enviado" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent History */}
      <div className="px-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Últimos movimientos</h3>
          <button className="text-blue-600 text-sm font-medium">Ver todo</button>
        </div>
        <div className="space-y-3">
          {operations.slice(0, 5).map((op) => (
            <div key={op.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  op.type === 'received' ? "bg-green-50 text-green-600" : "bg-zinc-50 text-zinc-600"
                )}>
                  {op.type === 'received' ? <ArrowUpRight size={20} /> : <CreditCard size={20} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {op.description.split(' ').slice(0, 4).join(' ')}...
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    {format(op.date, 'dd MMM, HH:mm', { locale: es })} • {getCardName(op.card)}
                  </p>
                </div>
              </div>
              <p className={cn(
                "font-bold whitespace-nowrap ml-2",
                op.type === 'received' ? "text-green-600" : "text-zinc-900 dark:text-zinc-100"
              )}>
                {op.type === 'received' ? '+' : '-'}${op.amount.toLocaleString('es-ES')}
              </p>
            </div>
          ))}
          {operations.length === 0 && (
            <div className="text-center py-10 text-zinc-400">
              <p>No hay operaciones todavía.</p>
              <p className="text-xs">Importa un archivo XML para comenzar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

