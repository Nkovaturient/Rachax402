import { motion } from 'framer-motion';
import { useMarketplaceStore, analysisSteps, storageSteps } from '../store/useMarketplaceStore';

const protocolColors: Record<string, string> = {
  emerald: 'bg-emerald border-emerald',
  indigo: 'bg-indigo border-indigo',
  orange: 'bg-orange border-orange',
  violet: 'bg-violet border-violet',
  green: 'bg-success border-success',
};

const protocolBg: Record<string, string> = {
  emerald: 'bg-emerald/10 border-emerald/30',
  indigo: 'bg-indigo/10 border-indigo/30',
  orange: 'bg-orange/10 border-orange/30',
  violet: 'bg-violet/10 border-violet/30',
  green: 'bg-success/10 border-success/30',
};

const ProgressStepper = () => {
  const { service, currentStep, isProcessing } = useMarketplaceStore();
  
  if (currentStep === 0) return null;

  const steps = service === 'analyze' ? analysisSteps : storageSteps;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-6 py-6"
    >
      <h2 className="text-lg font-semibold text-foreground mb-4">⚡ Processing Pipeline</h2>
      <div className="space-y-3">
        {steps.map((step: typeof analysisSteps[number] | typeof storageSteps[number]) => {
          const completed = currentStep > step.id;
          const active = currentStep === step.id;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.id * 0.1 }}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                completed
                  ? 'bg-success/10 border-success/30'
                  : active
                  ? `${protocolBg[step.protocol]} animate-protocol-pulse`
                  : 'bg-card/40 border-border'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  completed
                    ? 'bg-success text-foreground'
                    : active
                    ? protocolColors[step.protocol].split(' ')[0] + ' text-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {completed ? '✓' : step.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground">{step.label}</div>
                <div className="text-sm text-muted-foreground truncate">{step.desc}</div>
              </div>
              {active && isProcessing && (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ProgressStepper;
