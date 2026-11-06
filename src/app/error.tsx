"use client";

import { BlocErreur, type ErreurPageProps } from "@/components/erreurs/BlocErreur";
import { AuthShell } from "@/components/layout/AuthShell";

export default function ErreurGlobale(props: ErreurPageProps) {
  return (
    <AuthShell>
      <BlocErreur {...props} />
    </AuthShell>
  );
}
