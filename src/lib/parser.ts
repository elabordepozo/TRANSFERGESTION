/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SMSOperation, OperationType } from '../types';

export const parseSMSContent = (content: string, sender: string, date: Date): SMSOperation | null => {
  const text = content.toLowerCase();
  
  // Ignore patterns for non-transactional or unwanted messages
  const ignoredKeywords = [
    'consulta de saldo',
    'ha autenticado en la plataforma',
    'compra del plan',
    'la recarga se realizo con exito'
  ];

  if (ignoredKeywords.some(keyword => text.includes(keyword))) {
    return null;
  }
  
  // Basic patterns
  const amountRegex = /(?:amount|monto|total|de):?\s*([$|usd|cup|eur]?\s*[\d,.]+)/i;
  const cardRegex = /(?:\*{2,4}|x|tarjeta|cuenta)\s*(\d+)/i;
  
  // Specific Operation Detectors
  let type: OperationType = 'other';
  if (text.includes('recibida') || text.includes('transferencia de') || text.includes('has recibido') || text.includes('le ha realizado una transferencia')) type = 'received';
  else if (text.includes('debitado') || text.includes('transferencia enviada')) type = 'sent';
  else if (text.includes('pago') || text.includes('compra')) type = 'payment';
  else if (text.includes('pos')) type = 'pos';
  else if (text.includes('extracción') || text.includes('retiro')) type = 'withdrawal';
  else if (text.includes('depósito')) type = 'deposit';
  else if (text.includes('recarga')) type = 'recharge';
  else if (text.includes('comisión')) type = 'fee';

  // Extract Amount
  // matches like "2500.00", "1,200", "5000 cup"
  const amountMatch = content.match(/(\d{1,}(?:[.,]\d{2})?)\s*(cup|usd|eur|mwk|clp|$)/i) || 
                      content.match(/(cup|usd|eur|mwk|clp|$)\s*(\d{1,}(?:[.,]\d{2})?)/i);
  
  let amount = 0;
  let currency = 'CUP'; // Default

  if (amountMatch) {
    const numPart = amountMatch[1].replace(/,/g, '');
    amount = parseFloat(numPart) || 0;
    // Check if the match is a currency or number
    if (isNaN(amount)) {
      // Re-try swap if match order was different
      const secondPart = amountMatch[2]?.replace(/,/g, '');
      amount = parseFloat(secondPart) || 0;
      currency = amountMatch[1]?.toUpperCase() || currency;
    } else {
      currency = amountMatch[3]?.toUpperCase() || currency;
    }
  } else {
    // Try specifically for numbers in strings like "total 2500"
    const fallbackMatch = content.match(/(\d+[,.]?\d*)/);
    if (fallbackMatch) amount = parseFloat(fallbackMatch[1].replace(/,/g, '')) || 0;
  }

  // Extract Card
  const cardMatch = content.match(cardRegex);
  const card = cardMatch ? cardMatch[1].slice(-4) : 'Unknown';

  if (amount === 0 && type === 'other') return null;

  return {
    id: Math.random().toString(36).substr(2, 9),
    date,
    amount,
    currency,
    card,
    type,
    description: content,
    sender,
    rawContent: content,
    bank: sender // Usually banks use shortnames or numbers
  };
};

export const parseXMLBackup = (xmlText: string): SMSOperation[] => {
  const operations: SMSOperation[] = [];
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const smsNodes = xmlDoc.getElementsByTagName("sms");

  for (let i = 0; i < smsNodes.length; i++) {
    const sms = smsNodes[i];
    const body = sms.getAttribute("body") || "";
    const address = sms.getAttribute("address") || "";
    const dateStr = sms.getAttribute("date");
    const date = dateStr ? new Date(parseInt(dateStr)) : new Date();

    const op = parseSMSContent(body, address, date);
    if (op) {
      operations.push(op);
    }
  }

  return operations.sort((a, b) => b.date.getTime() - a.date.getTime());
};
