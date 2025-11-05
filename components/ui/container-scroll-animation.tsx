'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ContainerScrollProps {
  children: ReactNode;
  className?: string;
}

export const ContainerScrollAnimation = ({ children, className }: ContainerScrollProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      ref={containerRef}
      className={cn('h-[60rem] md:h-[80rem] flex items-center justify-center relative p-2 md:p-20', className)}
    >
      <div
        style={{
          perspective: '1000px',
        }}
        className="flex flex-col gap-4 md:gap-10"
      >
        <motion.div
          style={{
            rotateX: rotate,
            scale,
            boxShadow:
              '0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003',
          }}
          className="max-w-5xl mx-auto"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};
