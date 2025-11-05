'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam = ({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = '#fbbf24',
  colorTo = '#d97706',
  delay = 0,
}: BorderBeamProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      style={
        {
          '--size': size,
          '--duration': duration,
          '--anchor': anchor,
          '--border-width': borderWidth,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          '--delay': `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        'pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]',
        className
      )}
    >
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: `${borderWidth}px`,
          borderImage: `linear-gradient(${anchor}deg,${colorFrom},${colorTo},${colorFrom},${colorTo}) 1`,
          borderRadius: 'inherit',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '200% 0%'],
        }}
        transition={{
          repeat: Infinity,
          repeatType: 'loop',
          duration,
          ease: 'linear',
          delay,
        }}
        className="absolute inset-0 rounded-[inherit] [background-size:200%_100%] [border:calc(var(--border-width)*1px)_solid_transparent]"
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderWidth: `${borderWidth}px`,
          borderImage: `linear-gradient(${anchor + 90}deg,${colorFrom},${colorTo},${colorFrom},${colorTo}) 1`,
          borderRadius: 'inherit',
        }}
        className="absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent] opacity-50"
      />
    </div>
  );
};
