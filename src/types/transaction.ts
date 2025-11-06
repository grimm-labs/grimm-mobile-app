import type { Payment } from '@breeztech/react-native-breez-sdk-liquid';
import type { TransactionDetails } from 'bdk-rn/lib/classes/Bindings';

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
  onchainData?: TransactionDetails;
}
