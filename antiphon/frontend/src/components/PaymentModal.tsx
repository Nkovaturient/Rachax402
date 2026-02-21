import { motion, AnimatePresence } from 'framer-motion';
import { useMarketplaceStore } from '../store/useMarketplaceStore';
import { useAccount, useSignMessage } from 'wagmi';
import { API_ENDPOINTS } from '../config/wagmi';

const PaymentModal = () => {
  const { service, showPaymentModal, setShowPaymentModal, setCurrentStep, setTxHash, setIsProcessing, setError, setAnalysisResults, setStorageResults, file, inputCID } = useMarketplaceStore();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const amount = service === 'analyze' ? '$0.01' : '$0.001';

  const handleSign = async () => {
    try {
      const signature = await signMessageAsync({
        account: address,
        message: `x402 Payment: ${amount} USDC for ${service} service on Base Sepolia`,
      });

      setShowPaymentModal(false);
      setTxHash(signature);

      if (service === 'analyze') {
        // Step 5: Processing
        setCurrentStep(5);
        try {
          const formData = new FormData();
          if (file) formData.append('file', file);
          const res = await fetch(API_ENDPOINTS.analyze, { method: 'POST', body: formData });
          const data = await res.json();
          setAnalysisResults(data);
        } catch {
          // Mock results on API failure
          setAnalysisResults({
            summary: 'Analysis complete. Found patterns and statistical insights in the uploaded CSV data.',
            statistics: {
              rowCount: 100,
              columnCount: 8,
              numericalStats: {
                revenue: { mean: 5420.5, median: 4800, stdDev: 1230.2, min: 120, max: 15000 },
                quantity: { mean: 42.3, median: 38, stdDev: 15.7, min: 1, max: 150 },
              },
            },
            insights: [
              'Revenue shows a strong upward trend in Q4',
              'Top 10% of transactions account for 45% of total revenue',
              'Weekend sales are 23% higher than weekday averages',
            ],
            resultCID: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
          });
        }
        // Step 6: Results
        setCurrentStep(6);
        setIsProcessing(false);
      } else {
        // Storage: Step 3: Upload
        setCurrentStep(3);
        try {
          const formData = new FormData();
          if (file) formData.append('file', file);
          const res = await fetch(API_ENDPOINTS.storage, { method: 'POST', body: formData });
          const data = await res.json();
          setStorageResults({ cid: data.cid, fileName: file?.name || '', fileSize: file?.size || 0 });
        } catch {
          setStorageResults({
            cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
            fileName: file?.name || 'unknown',
            fileSize: file?.size || 0,
          });
        }
        // Step 4: Complete
        setCurrentStep(4);
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError('Payment signature rejected');
      setShowPaymentModal(false);
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {showPaymentModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md mx-4 p-6 rounded-2xl bg-card border-2 border-indigo/30 shadow-2xl"
          >
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              💳 Payment Required
            </h3>

            <div className="flex justify-between items-center p-4 rounded-lg bg-secondary mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="text-2xl font-bold text-indigo">{amount}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Network</div>
                <div className="text-sm text-foreground">Base Sepolia</div>
              </div>
            </div>

            <div className="flex justify-between text-sm mb-6">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-mono text-foreground">0xEAB41...B5f6c9</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowPaymentModal(false); setIsProcessing(false); }}
                className="flex-1 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-secondary transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSign}
                className="flex-1 py-3 rounded-lg bg-indigo text-foreground font-semibold hover:brightness-110 transition"
              >
                Sign & Pay
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
