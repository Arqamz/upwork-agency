'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface OrgSwitchOverlayProps {
  visible: boolean;
  orgName: string;
}

export function OrgSwitchOverlay({ visible, orgName }: OrgSwitchOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="org-switch-overlay"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />

          {/* Gradient orbs for flair */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            <motion.div
              className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber/20 blur-3xl"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
            />
          </div>

          {/* Content */}
          <div className="relative flex flex-col items-center gap-4 text-center">
            {/* Spinner ring */}
            <motion.div
              className="h-14 w-14 rounded-full border-2 border-border/30 border-t-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <p className="text-sm text-muted-foreground tracking-widest uppercase mb-1">
                Switching to
              </p>
              <p
                className="text-3xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--amber)))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {orgName}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
