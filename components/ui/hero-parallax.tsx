'use client';

import React, { forwardRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface HeroParallaxProps extends React.HTMLProps<HTMLDivElement> {
  products: {
    title: string;
    link?: string;
    thumbnail: string;
    description?: string;
  }[];
  areLinksDisabled?: boolean;
}

export const HeroParallax = forwardRef<HTMLDivElement, HeroParallaxProps>(
  function HeroParallax(props, ref) {
    const { products, areLinksDisabled = false, className, ...rest } = props;

    const firstRow = products.slice(0, 5);
    const secondRow = products.slice(5, 10);
    const thirdRow = products.slice(10, 15);

    const { scrollYProgress } = useScroll({
      target: ref as React.RefObject<HTMLDivElement>,
      offset: ['start start', 'end start'],
    });

    const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

    const translateX = useSpring(
      useTransform(scrollYProgress, [0, 1], [0, 1000]),
      springConfig
    );
    const translateXReverse = useSpring(
      useTransform(scrollYProgress, [0, 1], [0, -1000]),
      springConfig
    );
    const rotateX = useSpring(
      useTransform(scrollYProgress, [0, 0.2], [15, 0]),
      springConfig
    );
    const opacity = useSpring(
      useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
      springConfig
    );
    const rotateZ = useSpring(
      useTransform(scrollYProgress, [0, 0.2], [20, 0]),
      springConfig
    );
    const translateY = useSpring(
      useTransform(scrollYProgress, [0, 0.2], [-700, 500]),
      springConfig
    );

    return (
      <div
        ref={ref}
                  className={cn(
          'h-[300vh] sm:h-[310vh] tall:h-[280vh] bg-background pt-20 sm:pt-40 pb-0 overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]',
          className
        )}
        {...rest}
      >
        <motion.div
          style={{
            rotateX,
            rotateZ,
            translateY,
            opacity,
          }}
          className="absolute flex flex-col"
        >
          <motion.div className="flex flex-row-reverse space-x-reverse space-x-8 sm:space-x-20">
            {firstRow.map((product) => (
              <ProductCard
                product={product}
                translate={translateX}
                key={product.title}
                isLinkDisabled={areLinksDisabled}
              />
            ))}
          </motion.div>
          <motion.div className="flex flex-row space-x-8 sm:space-x-20 my-10 sm:my-20">
            {secondRow.map((product) => (
              <ProductCard
                product={product}
                translate={translateXReverse}
                key={product.title}
                isLinkDisabled={areLinksDisabled}
              />
            ))}
          </motion.div>
          <motion.div className="flex flex-row-reverse space-x-reverse space-x-8 sm:space-x-20">
            {thirdRow.map((product) => (
              <ProductCard
                product={product}
                translate={translateX}
                key={product.title}
                isLinkDisabled={areLinksDisabled}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }
);

HeroParallax.displayName = 'HeroParallax';

export const ProductCard = ({
  product,
  translate,
  isLinkDisabled = false,
}: {
  product: {
    title: string;
    link?: string;
    thumbnail: string;
    description?: string;
  };
  translate: MotionValue<number>;
  isLinkDisabled?: boolean;
}) => {
  const content = (
    <>
      <Image
        src={product.thumbnail}
        height={600}
        width={600}
        className="object-cover object-left-top absolute h-full w-full inset-0"
        alt={product.title}
        sizes="(max-width: 768px) 100vw, 600px"
        unoptimized
      />
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-80 bg-black pointer-events-none transition-opacity duration-300"></div>
      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover/product:opacity-100 transition-opacity duration-300">
        <h2 className="text-white text-xl font-display font-semibold mb-2">
          {product.title}
        </h2>
        {product.description && (
          <p className="text-white/80 text-sm">{product.description}</p>
        )}
      </div>
    </>
  );

  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={product.title}
      className="group/product h-80 sm:h-96 w-[24rem] sm:w-[32rem] relative flex-shrink-0 rounded-2xl overflow-hidden glass glass-hover cursor-pointer"
    >
      {isLinkDisabled || !product.link ? (
        <div className="block group-hover/product:shadow-2xl transition-shadow duration-300">
          {content}
        </div>
      ) : (
        <Link
          href={product.link}
          className="block group-hover/product:shadow-2xl transition-shadow duration-300"
        >
          {content}
        </Link>
      )}
    </motion.div>
  );
};
