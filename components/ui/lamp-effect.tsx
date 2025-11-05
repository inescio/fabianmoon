'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface LampEffectProps {
  children: ReactNode;
  className?: string;
}

export const LampEffect = ({ children, className }: LampEffectProps) => {
  return (
    <div className={cn('relative flex w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-20 md:px-8', className)}>
      <div className="relative z-0 flex w-full flex-col items-center justify-center">
        <div className="absolute top-0 h-[300px] w-full bg-gradient-to-b from-accent/50 via-accent/30 to-transparent blur-3xl" />
        <div className="relative z-10 w-full">
          {children}
        </div>
        <motion.div
          initial={{ opacity: 0.5, width: '15rem' }}
          whileInView={{ opacity: 1, width: '30rem' }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: 'easeInOut',
          }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-56 w-[30rem] overflow-visible bg-gradient-conic from-accent via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          <div className="absolute bottom-0 left-0 z-0 h-40 w-[100%] bg-background [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute bottom-0 left-0 z-0 h-[100%] w-[100%] bg-background [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>
      </div>
    </div>
  );
};
