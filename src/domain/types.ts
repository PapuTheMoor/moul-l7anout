/** Shared contract. Money is integer centimes; business state is immutable. */
export type InputSource = "typed" | "sample" | "speech";
export type Product = Readonly<{
  id: string;
  name: string;
  aliases: readonly string[];
  priceCentimes: number;
  stock: number;
}>;

export type Customer = Readonly<{
  id: string;
  name: string;
  balanceCentimes: number;
}>;

export type TransactionLine = Readonly<{ productId: string; quantity: number }>;

type ProposalBase = Readonly<{
  id: string;
  originalInput: string;
  source: InputSource;
}>;
export type SaleProposal = ProposalBase & Readonly<{
  kind: "sale";
  payment: "cash" | "credit";
  customerId: string | null;
  lines: readonly TransactionLine[];
}>;
export type RepaymentProposal = ProposalBase & Readonly<{
  kind: "repayment";
  customerId: string;
  amountCentimes: number;
}>;
export type TransactionProposal = SaleProposal | RepaymentProposal;
export type RecordedLine = Readonly<{ productId: string; quantity: number; unitPriceCentimes: number }>;

export type RecordedTransaction = Readonly<{
  proposal: TransactionProposal;
  totalCentimes: number;
  recordedAt: string;
  lines: readonly RecordedLine[];
}>;

export type ShopState = Readonly<{
  version: 1;
  products: readonly Product[];
  customers: readonly Customer[];
  transactions: readonly RecordedTransaction[];
}>;

export type DomainResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: string }>;

export type CaptureInput = Readonly<{
  id: string;
  text: string;
  source: TransactionProposal["source"];
}>;

export type ShopSummary = Readonly<{ salesCentimes: number; cashCentimes: number; creditCentimes: number; transactionCount: number }>;
export type InterpretationEngine = "openai" | "local";

/** UI boundary: the parent integrates domain operations; components render. */
export type ShopWorkspaceProps = Readonly<{
  state: ShopState;
  summary: ShopSummary;
  proposal: TransactionProposal | null;
  text: string;
  error: string | null;
  notice: string | null;
  busy: boolean;
  engine: InterpretationEngine;
  recording: boolean;
  canRecord: boolean;
  hydrated: boolean;
  onTextChange: (text: string) => void;
  onInterpret: () => void;
  onExample: (text: string) => void;
  onEngineChange: (engine: InterpretationEngine) => void;
  onProposalChange: (proposal: TransactionProposal) => void;
  onDismissProposal: () => void;
  onConfirm: () => void;
  onUndo: () => void;
  onReset: () => void;
  onRecordingToggle: () => void;
}>;
