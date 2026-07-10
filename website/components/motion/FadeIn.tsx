'use client';

// Framer-motion drop-in for the old `.reveal` class. Fades + rises when it
// enters the viewport, once. Delay is staggered via the `delay` prop.

import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = Omit<HTMLMotionProps<'div'>, 'children'> & {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  as?: 'div' | 'section' | 'aside' | 'article';
};

export default function FadeIn({
  children,
  delay = 0,
  y = 20,
  duration = 0.75,
  as = 'div',
  className,
  ...rest
}: Props) {
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -7% 0px' }}
      transition={{ duration, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}
