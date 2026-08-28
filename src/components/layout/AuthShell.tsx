import { LogoMark } from "@/components/Logo";

export interface AuthShellProps {
  /** Titre optionnel sous le logo. */
  heading?: string;
  subheading?: string;
  children: React.ReactNode;
}

/**
 * Conteneur centré des écrans d'authentification (responsive).
 * Remplace le cadre Desktop/Mobile de démo de la maquette.
 */
export function AuthShell({ heading, subheading, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-parchment px-5 py-10 text-ink">
      <div className="w-full max-w-[420px] rounded-lg border border-hairline bg-canvas p-8 sm:p-9">
        <div className="mb-6 text-center">
          <LogoMark
            width={40}
            height={40}
            className="mx-auto mb-4 text-ink"
          />
          {heading && (
            <h1 className="font-display text-[22px] font-semibold tracking-[-0.3px] text-ink">
              {heading}
            </h1>
          )}
          {subheading && (
            <p className="mt-1 text-caption text-ink-48">{subheading}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
