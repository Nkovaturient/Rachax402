import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion } from 'framer-motion';

const Header = () => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass border-b border-border sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet to-indigo flex items-center justify-center text-lg">
            🚀
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Rachax402</h1>
            <p className="text-xs text-muted-foreground">Agent Coordination System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Base Sepolia
          </div>
          <ConnectButton
            chainStatus="icon"
            showBalance={{ smallScreen: false, largeScreen: true }}
            accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
          />
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
