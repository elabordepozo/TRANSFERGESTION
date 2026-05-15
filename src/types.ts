/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type OperationType = 'received' | 'sent' | 'payment' | 'withdrawal' | 'deposit' | 'pos' | 'recharge' | 'fee' | 'other';

export interface SMSOperation {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  card: string; // e.g., "1234"
  type: OperationType;
  description: string;
  sender: string;
  rawContent: string;
  bank?: string;
  category?: string;
}

export interface BankCard {
  lastFour: string;
  bank?: string;
  balance: number;
  lastUpdated: Date;
}

export interface UserCard {
  id: string; // the last four or identifier
  name: string;
  bank?: string;
}

export interface FinancialStats {
  totalReceived: number;
  totalSent: number;
  balance: number;
  operationCount: number;
  recentOperations: SMSOperation[];
}
