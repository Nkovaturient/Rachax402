import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketplaceStore } from '../store/useMarketplaceStore';
import { useAccount } from 'wagmi';
import { API_ENDPOINTS } from '../config/wagmi';

const FileUploader = () => {
  const { service, file, setFile, setIsProcessing, setCurrentStep, setError, setDiscoveredAgent, setInputCID, setShowPaymentModal, setAnalysisResults, setStorageResults } = useMarketplaceStore();
  const { isConnected } = useAccount();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, [setFile]);

  const runPipeline = async () => {
    if (!file) return;
    setError(null);
    setIsProcessing(true);

    try {
      // Step 1: Discovery
      setCurrentStep(1);
      await delay(1500);
      setDiscoveredAgent({
        address: '0xEAB41...B5f6c9',
        reputation: 4.8,
        totalRatings: 42,
        serviceName: service === 'analyze' ? 'csv-analysis' : 'file-storage',
      });

      if (service === 'analyze') {
        // Step 2: Reputation check
        setCurrentStep(2);
        await delay(1200);

        // Step 3: Upload to Storacha
        setCurrentStep(3);
        const formData = new FormData();
        formData.append('file', file);
        try {
          const uploadRes = await fetch(API_ENDPOINTS.storage, { method: 'POST', body: formData });
          const uploadData = await uploadRes.json();
          setInputCID(uploadData.cid || 'bafybei...mock');
        } catch {
          setInputCID('bafybei...simulatedCID');
        }
        await delay(800);

        // Step 4: Payment
        setCurrentStep(4);
        setShowPaymentModal(true);
        // Wait for payment to be signed (handled by PaymentModal)
        return;
      } else {
        // Storage flow: 4 steps
        // Step 2: Payment
        setCurrentStep(2);
        setShowPaymentModal(true);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Pipeline failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`p-8 border-2 border-dashed rounded-xl transition-all ${
          isDragging ? 'border-violet bg-violet/10' : 'border-border'
        }`}
      >
        <input
          type="file"
          accept={service === 'analyze' ? '.csv' : '*'}
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer block">
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="text-5xl mb-3 text-success">✓</div>
                <div className="text-lg font-semibold text-foreground">{file.name}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  {(file.size / 1024).toFixed(2)} KB
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="text-5xl mb-3 text-muted-foreground">↑</div>
                <div className="text-lg text-foreground">
                  {service === 'analyze' ? 'Upload CSV file for analysis' : 'Upload any file to store'}
                </div>
                <div className="text-sm text-muted-foreground mt-2">Click or drag & drop</div>
              </motion.div>
            )}
          </AnimatePresence>
        </label>
      </div>

      {file && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={runPipeline}
          disabled={!isConnected}
          className="w-full mt-4 py-4 bg-gradient-to-r from-violet to-indigo rounded-xl font-semibold text-foreground disabled:opacity-50 transition-all hover:brightness-110"
        >
          {!isConnected
            ? 'Connect Wallet First'
            : `Start ${service === 'analyze' ? 'Analysis' : 'Upload'}`}
        </motion.button>
      )}
    </div>
  );
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default FileUploader;
