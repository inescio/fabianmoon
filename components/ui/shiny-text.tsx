'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ShinyTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
}

export const ShinyText = ({ 
  children, 
  className,
  shimmerWidth = 100
}: ShinyTextProps) => {
  return (
    <p
      className={cn(
        "inline-block relative font-display tracking-tight",
        className
      )}
    >
      <motion.span
        className="relative block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {children}
      </motion.span>
      <motion.span
        style={{
          backgroundImage:
            "linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.8), transparent)",
          backgroundSize: `${shimmerWidth}% 100%`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "-100% 0",
        }}
        animate={{
          backgroundPosition: ["200% 0", "-100% 0"],
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: "linear",
        }}
        className={cn(
          "absolute inset-0 block",
          "[background-clip:text] [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]"
        )}
      >
        {children}
      </motion.span>
    </p>
  );
};
