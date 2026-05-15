/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { SMSOperation, UserCard } from '../types';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Calendar, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistoryProps {
  operations: SMSOperation[];
  userCards: UserCard[];
}

export default function History({ operations, userCards }: HistoryProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCard, setFilterCard] = useState<string>('all');

  const getCardName = (id: string) => {
    const card = userCards.find(c => c.id === id);
    return card ? card.name : `TARJETA ****${id}`;
  };

  // Get ONLY manually added cards for filtering
  const availableCards = userCards.sort((a, b) => a.name.localeCompare(b.name));

  const filtered = operations.filter(op => {
    const cardName = getCardName(op.card).toLowerCase();
    const matchesSearch = op.description.toLowerCase().includes(search.toLowerCase()) || 
                          op.card.includes(search) || 
                          cardName.includes(search.toLowerCase()) ||
                          op.bank?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || 
                        (filterType === 'in' && op.type === 'received') ||
                        (filterType === 'out' && op.type !== 'received');
    const matchesCard = filterCard === 'all' || op.card === filterCard;
    
    return matchesSearch && matchesType && matchesCard;
  });

  return (
    <div className="p-4 space-y-4 pb-24 animate-in fade-in duration-500">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Historial</h1>
        <p className="text-zinc-500 text-sm">Gestiona todos tus movimientos</p>
      </header>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por tarjeta, banco o texto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 transition-all dark:text-zinc-100"
          />
        </div>
        
        <div className="space-y-2">
          {/* Type Filters */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'in', label: 'Ingresos' },
              { id: 'out', label: 'Gastos' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`
                  px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all
                  ${filterType === f.id ? 'bg-blue-600 text-white shadow-md' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}
                `}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Card Filters */}
          {availableCards.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-zinc-100 dark:border-zinc-800 pt-2">
              <button
                onClick={() => setFilterCard('all')}
                className={`
                  px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border
                  ${filterCard === 'all' 
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent' 
                    : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800'}
                `}
              >
                TODAS LAS TARJETAS
              </button>
              {availableCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => setFilterCard(card.id)}
                  className={`
                    px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border flex items-center gap-2
                    ${filterCard === card.id 
                      ? 'bg-blue-600 text-white border-transparent' 
                      : 'bg-transparent text-zinc-500 border-zinc-200 dark:border-zinc-800'}
                  `}
                >
                  <CreditCard size={12} />
                  {card.name.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Operations List */}
      <div className="space-y-3">
        {filtered.map((op) => (
          <div key={op.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-2xl 
                  ${op.type === 'received' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}
                `}>
                  {op.type === 'received' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                </div>
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-[10px] tracking-widest opacity-50 mb-0.5">
                    {op.type}
                  </h4>
                  <div className="flex items-center gap-2 text-zinc-500 text-xs">
                     <Calendar size={12} />
                     {format(op.date, 'dd MMMM yyyy, HH:mm', { locale: es })}
                  </div>
                </div>
              </div>
              <p className={`font-bold text-lg ${op.type === 'received' ? 'text-green-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                {op.type === 'received' ? '+' : '-'}${op.amount.toLocaleString('es-ES')}
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 italic leading-relaxed">
                "{op.rawContent}"
              </p>
            </div>

            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2 text-zinc-400">
                <CreditCard size={14} />
                <span className="text-[10px] font-bold uppercase">{getCardName(op.card)}</span>
              </div>
              <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full text-zinc-500 border border-zinc-200 dark:border-zinc-700">
                {op.bank || 'Banco'}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
            <p className="text-zinc-400 font-medium">No se encontraron resultados</p>
            <p className="text-zinc-500 text-xs">Intenta con otros filtros o términos</p>
          </div>
        )}
      </div>
    </div>
  );
}
