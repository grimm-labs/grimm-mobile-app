import type { DepositInfo, Payment } from '@breeztech/breez-sdk-spark-react-native';

import type { OnchainTransaction } from '@/lib/bdk';

export enum TransactionSource {
  LIGHTNING = 'lightning',
  ONCHAIN = 'onchain',
}

export enum UnifiedTransactionType {
  RECEIVE = 'receive',
  SEND = 'send',
}

export enum UnifiedTransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
}

export interface UnifiedTransaction {
  id: string;
  timestamp: number;
  amountSat: number;
  feesSat: number;
  type: UnifiedTransactionType;
  status: UnifiedTransactionStatus;
  source: TransactionSource;
  lightningData?: Payment;
  onchainData?: OnchainTransaction;
  /** Set for an on-chain deposit to the Lightning wallet that is not in the balance yet */
  depositData?: DepositInfo;
}
