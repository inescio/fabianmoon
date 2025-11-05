'use client';

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { ReactNode, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TiltEffectProps {
  children: ReactNode;
  className?: string;
}

export const TiltEffect = ({ children, className }: TiltEffectProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct * 10);
    y.set(-yPct * 10);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x,
        y,
        rotateX: useMotionTemplate`${y}deg`,
        rotateY: useMotionTemplate`${x}deg`,
        transformStyle: 'preserve-3d',
      }}
      className={cn('relative', className)}
    >
      {children}
    </motion.div>
  );
};
