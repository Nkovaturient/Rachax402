import { create } from 'zustand';

export type ServiceType = 'analyze' | 'store';

export interface AgentInfo {
  address: string;
  reputation: number;
  totalRatings: number;
  serviceName: string;
}

export interface AnalysisResults {
  summary: string;
  statistics: {
    rowCount: number;
    columnCount: number;
    numericalStats: Record<string, {
      mean: number;
      median: number;
      stdDev: number;
      min: number;
      max: number;
    }>;
  };
  insights: string[];
  resultCID: string;
}

export interface StorageResults {
  cid: string;
  fileName: string;
  fileSize: number;
}

interface Step {
  id: number;
  label: string;
  icon: string;
  protocol: 'emerald' | 'indigo' | 'orange' | 'violet' | 'green';
  desc: string;
}

export const analysisSteps: Step[] = [
  { id: 1, label: 'Discovery', icon: '🔍', protocol: 'emerald', desc: 'Finding agents via ERC-8004' },
  { id: 2, label: 'Reputation', icon: '⭐', protocol: 'emerald', desc: 'Checking on-chain ratings' },
  { id: 3, label: 'Upload', icon: '📤', protocol: 'orange', desc: 'Uploading to Storacha' },
  { id: 4, label: 'Payment', icon: '💳', protocol: 'indigo', desc: 'Signing x402 payment' },
  { id: 5, label: 'Processing', icon: '⚙️', protocol: 'violet', desc: 'AgentB analyzing data' },
  { id: 6, label: 'Results', icon: '✅', protocol: 'green', desc: 'Retrieving results' },
];

export const storageSteps: Step[] = [
  { id: 1, label: 'Discovery', icon: '🔍', protocol: 'emerald', desc: 'Finding storage service' },
  { id: 2, label: 'Payment', icon: '💳', protocol: 'indigo', desc: 'Signing x402 payment' },
  { id: 3, label: 'Upload', icon: '📤', protocol: 'orange', desc: 'Uploading to Storacha' },
  { id: 4, label: 'Complete', icon: '✅', protocol: 'green', desc: 'File stored on IPFS' },
];

interface MarketplaceState {
  service: ServiceType;
  currentStep: number;
  isProcessing: boolean;
  file: File | null;
  inputCID: string | null;
  resultCID: string | null;
  discoveredAgent: AgentInfo | null;
  analysisResults: AnalysisResults | null;
  storageResults: StorageResults | null;
  txHash: string | null;
  error: string | null;
  showPaymentModal: boolean;
  showRatingModal: boolean;

  setService: (s: ServiceType) => void;
  setCurrentStep: (step: number) => void;
  setIsProcessing: (v: boolean) => void;
  setFile: (f: File | null) => void;
  setInputCID: (cid: string | null) => void;
  setResultCID: (cid: string | null) => void;
  setDiscoveredAgent: (a: AgentInfo | null) => void;
  setAnalysisResults: (r: AnalysisResults | null) => void;
  setStorageResults: (r: StorageResults | null) => void;
  setTxHash: (h: string | null) => void;
  setError: (e: string | null) => void;
  setShowPaymentModal: (v: boolean) => void;
  setShowRatingModal: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  service: 'analyze' as ServiceType,
  currentStep: 0,
  isProcessing: false,
  file: null,
  inputCID: null,
  resultCID: null,
  discoveredAgent: null,
  analysisResults: null,
  storageResults: null,
  txHash: null,
  error: null,
  showPaymentModal: false,
  showRatingModal: false,
};

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  ...initialState,
  setService: (service) => set({ service, currentStep: 0, isProcessing: false, file: null, error: null, analysisResults: null, storageResults: null }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setFile: (file) => set({ file }),
  setInputCID: (inputCID) => set({ inputCID }),
  setResultCID: (resultCID) => set({ resultCID }),
  setDiscoveredAgent: (discoveredAgent) => set({ discoveredAgent }),
  setAnalysisResults: (analysisResults) => set({ analysisResults }),
  setStorageResults: (storageResults) => set({ storageResults }),
  setTxHash: (txHash) => set({ txHash }),
  setError: (error) => set({ error }),
  setShowPaymentModal: (showPaymentModal) => set({ showPaymentModal }),
  setShowRatingModal: (showRatingModal) => set({ showRatingModal }),
  reset: () => set(initialState),
}));
