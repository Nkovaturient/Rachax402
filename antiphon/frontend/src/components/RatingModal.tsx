import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketplaceStore } from '../store/useMarketplaceStore';

const RatingModal = () => {
  const { showRatingModal, setShowRatingModal } = useMarketplaceStore();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      setShowRatingModal(false);
      setSubmitted(false);
      setRating(0);
      setComment('');
    }, 2000);
  };

  return (
    <AnimatePresence>
      {showRatingModal && (
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
            className="w-full max-w-md mx-4 p-6 rounded-2xl bg-card border border-border shadow-2xl"
          >
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">✅</div>
                <h3 className="text-xl font-bold text-foreground">Rating Submitted!</h3>
                <p className="text-sm text-muted-foreground mt-2">Recorded on-chain</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-foreground mb-4">Rate Agent Performance</h3>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(star)}
                      className="text-3xl transition-transform hover:scale-110"
                    >
                      {star <= (hover || rating) ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Leave a comment..."
                  className="w-full p-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground resize-none h-24 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2 mb-4">⛽ Submitting costs gas on Base Sepolia</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="flex-1 py-3 rounded-lg border border-border text-foreground font-semibold hover:bg-secondary transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={rating === 0}
                    className="flex-1 py-3 rounded-lg bg-emerald text-foreground font-semibold hover:brightness-110 transition disabled:opacity-50"
                  >
                    Submit On-Chain
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RatingModal;
