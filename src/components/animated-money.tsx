"use client";

import { useEffect } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { money } from "./format";

export const physicalSpring = { type: "spring" as const, stiffness: 400, damping: 40, mass: 1 };

export function AnimatedMoney({ centimes, className, testId }: { centimes: number; className?: string; testId?: string }) {
  const reducedMotion = useReducedMotion();
  const amount = Number.isFinite(centimes) ? centimes : 0;
  const spring = useSpring(amount, physicalSpring);
  const display = useTransform(spring, (value) => money(Math.round(value)));
  useEffect(() => {
    if (reducedMotion) spring.jump(amount);
    else spring.set(amount);
  }, [amount, reducedMotion, spring]);
  return <motion.span className={className} data-testid={testId} aria-label={money(amount)}>{display}</motion.span>;
}
