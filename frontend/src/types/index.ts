export type UserRole = "admin" | "comptable" | "employe";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_enable_2f: boolean;
  created_at: string;
  updated_at: string;
}

// --- 2. Cœur Comptable ---
export type AccountType = "bancaire" | "mobile_money" | "especes" | "autre";

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  transactions?: Transaction[]; // Chargé optionnellement
}

export type TransactionType = "revenu" | "depense";

export interface TransactionCategory {
  id: number;
  name: string;
  type: TransactionType;
}

export interface Transaction {
  id: number;
  account_id: number;
  transaction_category_id: number | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  transaction_date: string;
  account?: Account;
  category?: TransactionCategory;
}

export type RecurringFrequency = "mensuel" | "trimestriel" | "annuel";

export interface RecurringOperation {
  id: number;
  description: string;
  type: TransactionType;
  amount: number;
  frequency: RecurringFrequency;
  due_day: number;
  account_id: number | null;
  transaction_category_id: number | null;
  next_due_date: string | null;
  account?: Account;
  category?: TransactionCategory;
}

// --- 3. Gestion des Actifs ---
export type AssetStatus =
  | "neuf"
  | "en_service"
  | "en_maintenance"
  | "hors_service";

export interface Asset {
  id: number;
  name: string;
  description: string | null;
  serial_number: string | null;
  acquisition_date: string | null;
  acquisition_value: number | null;
  status: AssetStatus;
  location: string;
  loans?: AssetLoan[]; // Chargé optionnellement
}

export type AssetLoanStatus = "en_cours" | "termine";

export interface AssetLoan {
  id: number;
  asset_id: number;
  user_id: number;
  loan_date: string;
  due_date: string | null;
  return_date: string | null;
  status: AssetLoanStatus;
  signature: string | null;
  asset?: Asset;
  user?: User;
}

export interface Application {
  id: number;
  name: string;
  cost: number | null;
  user_id: number | null; // Responsable
  license_type: string | null;
  current_users: number;
  max_users: number | null;
  purchase_date: string | null;
  renewal_date: string | null;
  status: string | null;
  owner?: User; // Relation 'user'
}

// --- 4. Facturation ---
export type ThirdPartyType = "client" | "fournisseur";

export interface ThirdParty {
  id: number;
  name: string;
  type: ThirdPartyType;
  details: string | null;
  email: string | null;
  invoices?: Invoice[]; // Chargé optionnellement
}

export type InvoiceType = "client" | "depense";
export type InvoiceStatus =
  | "brouillon"
  | "envoye"
  | "partiellement_paye"
  | "paye"
  | "en_retard"
  | "annule";

export interface Invoice {
  id: number;
  type: InvoiceType;
  third_party_id: number;
  invoice_number: string | null;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  status: InvoiceStatus;
  payment_terms: string | null;
  // Relations
  thirdParty?: ThirdParty;
  lines?: InvoiceLine[];
  payments?: InvoicePayment[];
  documents?: AttachedDocument[];
}

export interface InvoiceLine {
  id: number;
  invoice_id: number;
  designation: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount: number;
}

export interface InvoicePayment {
  id: number;
  invoice_id: number;
  transaction_id: number | null;
  amount: number;
  payment_date: string;
  payment_method: string | null;
  transaction?: Transaction;
}

export interface AttachedDocument {
  id: number;
  invoice_id: number;
  file_path: string;
  file_name: string;
  file_type: string | null;
}
