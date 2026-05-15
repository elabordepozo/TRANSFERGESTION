/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { SMSOperation, UserCard } from '../types';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Calendar, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, startOfMonth, startOfWeek, endOfMonth, endOfWeek, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface StatsProps {
  operations: SMSOperation[];
  userCards: UserCard[];
}

type ViewMode = 'weekly' | 'monthly';

export default function Stats({ operations, userCards }: StatsProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');

  // Identify all unique cards and their balance
  const cards = useMemo(() => {
    const cardMap: Record<string, { balance: number; name?: string }> = {};
    
    // Start with user-defined cards
    userCards.forEach(uc => {
      cardMap[uc.id] = { balance: 0, name: uc.name };
    });

    // Add cards from operations
    operations.forEach(op => {
      if (!cardMap[op.card]) cardMap[op.card] = { balance: 0 };
      if (op.type === 'received') cardMap[op.card].balance += op.amount;
      else if (['sent', 'payment', 'pos', 'withdrawal'].includes(op.type)) cardMap[op.card].balance -= op.amount;
    });

    return Object.keys(cardMap).map(id => ({ 
      id, 
      balance: cardMap[id].balance, 
      name: cardMap[id].name || `**** ${id}` 
    }));
  }, [operations, userCards]);

  // Set initial selected card if none
  if (!selectedCard && cards.length > 0) {
    setSelectedCard(cards[0].id);
  }

  const activeCardInfo = cards.find(c => c.id === selectedCard);

  // Filter ops for selected card
  const cardOps = useMemo(() => 
    operations.filter(op => op.card === selectedCard),
    [operations, selectedCard]
  );

  // Calculate Chart Data based on viewMode
  const chartData = useMemo(() => {
    const now = new Date();
    const data: any[] = [];

    if (viewMode === 'monthly') {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);
        
        const periodOps = cardOps.filter(op => op.date >= start && op.date <= end);
        const received = periodOps.filter(op => op.type === 'received');
        const sent = periodOps.filter(op => ['sent', 'payment', 'pos', 'withdrawal'].includes(op.type));

        data.push({
          name: format(monthDate, 'MMM', { locale: es }),
          recibido: received.reduce((sum, op) => sum + op.amount, 0),
          enviado: sent.reduce((sum, op) => sum + op.amount, 0),
          countRec: received.length,
          countSent: sent.length,
        });
      }
    } else {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekDate = new Date();
        weekDate.setDate(now.getDate() - (i * 7));
        const start = startOfWeek(weekDate);
        const end = endOfWeek(weekDate);

        const periodOps = cardOps.filter(op => op.date >= start && op.date <= end);
        const received = periodOps.filter(op => op.type === 'received');
        const sent = periodOps.filter(op => ['sent', 'payment', 'pos', 'withdrawal'].includes(op.type));

        data.push({
          name: `Sem ${format(start, 'd')}`,
          recibido: received.reduce((sum, op) => sum + op.amount, 0),
          enviado: sent.reduce((sum, op) => sum + op.amount, 0),
          countRec: received.length,
          countSent: sent.length,
        });
      }
    }
    return data;
  }, [cardOps, viewMode]);

  return (
    <div className="p-4 space-y-6 pb-24 animate-in fade-in duration-500">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Análisis Detallado</h1>
        <p className="text-zinc-500 text-sm">Transferencias por tarjeta</p>
      </header>

      {/* Card Selector Swiper */}
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setSelectedCard(card.id)}
            className={`
              flex-shrink-0 p-4 rounded-2xl border-2 transition-all text-left w-40
              ${selectedCard === card.id 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'}
            `}
          >
            <CreditCard size={16} className={selectedCard === card.id ? 'text-blue-600' : 'text-zinc-400'} />
            <p className={`text-xs font-bold mt-2 truncate ${selectedCard === card.id ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-500'}`}>
              {card.name}
            </p>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              ${card.balance.toLocaleString('es-ES')}
            </p>
          </button>
        ))}
        {cards.length === 0 && (
          <div className="text-center w-full py-10 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-400 text-sm italic">Importa datos para analizar tus tarjetas</p>
          </div>
        )}
      </div>

      {selectedCard && (
        <>
          {/* View Mode Toggle */}
          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'weekly' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600' : 'text-zinc-500'}`}
            >
              Semanal
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${viewMode === 'monthly' ? 'bg-white dark:bg-zinc-800 shadow-sm text-blue-600' : 'text-zinc-500'}`}
            >
              Mensual
            </button>
          </div>

          {/* Chart Card */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-500" />
              Recibido vs Enviado
            </h3>
            
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#6B7280'}} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: 'rgba(59, 130, 246, 0.05)'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px' }} />
                  <Bar dataKey="recibido" fill="#10b981" radius={[4, 4, 0, 0]} name="Recibido" />
                  <Bar dataKey="enviado" fill="#ef4444" radius={[4, 4, 0, 0]} name="Enviado" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Period Breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 px-1">Desglose por periodo</h4>
            {chartData.slice().reverse().map((data) => (
              <div key={data.name} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{data.name}</span>
                  <div className="flex gap-2">
                    <span className="text-[10px] bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">
                      {data.countRec} recibidas
                    </span>
                    <span className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">
                      {data.countSent} enviadas
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Monto Recibido</p>
                    <p className="text-lg font-bold text-green-600">${data.recibido.toLocaleString('es-ES')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Monto Enviado</p>
                    <p className="text-lg font-bold text-red-500">${data.enviado.toLocaleString('es-ES')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {cards.length === 0 && (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">No hay tarjetas registradas</p>
          <p className="text-zinc-500 text-xs px-10">Usa la sección de Importar para procesar tus mensajes bancarios.</p>
        </div>
      )}
    </div>
  );
}
