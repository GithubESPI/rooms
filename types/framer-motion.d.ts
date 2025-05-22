"use client";

import type { HTMLMotionProps } from "framer-motion";

declare module "framer-motion" {
  export interface MotionProps extends HTMLMotionProps<"div"> {
    className?: string;
  }
}
