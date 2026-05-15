/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, DragEvent } from 'react';
import { Upload, FileCode, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { parseXMLBackup } from '../lib/parser';
import { SMSOperation } from '../types';
import { motion } from 'motion/react';

interface ImportProps {
  onImport: (ops: SMSOperation[]) => void;
}

export default function Import({ onImport }: ImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ count: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xml')) {
      setError('Por favor selecciona un archivo .xml válido.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const text = await file.text();
      const operations = parseXMLBackup(text);
      
      if (operations.length === 0) {
        throw new Error('No se detectaron operaciones válidas en el archivo.');
      }

      setStats({ count: operations.length });
      setStatus('success');
      onImport(operations);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el archivo.');
      setStatus('error');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <div className="p-6 space-y-6 pb-24 animate-in slide-in-from-bottom duration-500">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Importar XML</h1>
        <p className="text-zinc-500 text-sm">Carga tus respaldos de SMS Backup & Restore</p>
      </header>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-zinc-200 dark:border-zinc-800 hover:border-blue-400'}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xml"
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        />
        
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl mb-4">
          <Upload className="text-blue-600 dark:text-blue-400 w-8 h-8" />
        </div>
        
        <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          {isDragging ? 'Suelta el archivo aquí' : 'Selecciona o arrastra tu XML'}
        </p>
        <p className="text-xs text-zinc-400 text-center max-w-[200px]">
          Soporta archivos generados por Android SMS Backup tools.
        </p>
      </div>

      {status === 'loading' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center p-6 gap-3">
          <Loader2 className="animate-spin text-blue-600" />
          <span className="text-zinc-600 dark:text-zinc-400 font-medium">Analizando mensajes...</span>
        </motion.div>
      )}

      {status === 'success' && stats && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-2xl p-4 flex items-start gap-3"
        >
          <CheckCircle2 className="text-green-600 mt-0.5" />
          <div>
            <p className="font-bold text-green-900 dark:text-green-100">¡Importación terminada!</p>
            <p className="text-sm text-green-700 dark:text-green-400">
              Se han analizado y guardado {stats.count} operaciones bancarias.
            </p>
          </div>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="text-red-600 mt-0.5" />
          <div>
            <p className="font-bold text-red-900 dark:text-red-100">Error en el archivo</p>
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        </motion.div>
      )}

      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-100 dark:border-zinc-800">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
          <FileCode size={20} className="text-zinc-400" />
          Instrucciones
        </h3>
        <ul className="text-xs text-zinc-500 space-y-2 list-disc pl-4">
          <li>Usa app como "SMS Backup & Restore" para exportar tus mensajes.</li>
          <li>Asegúrate de exportar los mensajes de tus números bancarios.</li>
          <li>El archivo debe estar en formato .xml directamente.</li>
          <li>Toda la detección se realiza localmente en tu dispositivo.</li>
        </ul>
      </div>
    </div>
  );
}
