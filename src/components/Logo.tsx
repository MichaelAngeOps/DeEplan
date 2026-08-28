import type { SVGProps } from "react";

/**
 * Logo de l'application (repris de maquette/mark.svg & logo-on-dark.svg).
 * Le tracé utilise `currentColor` → contrôlable via la classe `text-*`.
 *
 * NB : le libellé de la maquette est « Obscura » (nom générique du design
 * system). À remplacer par « DeEplan » quand la direction artistique du
 * wordmark sera tranchée.
 */

type MarkProps = SVGProps<SVGSVGElement> & { title?: string };

/** Symbole seul (ouverture / aperture). */
export function LogoMark({ title = "DeEplan", ...props }: MarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={36}
      height={36}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m14.31 8 5.74 9.94" />
      <path d="M9.69 8h11.48" />
      <path d="m7.38 12 5.74-9.94" />
      <path d="M9.69 16 3.95 6.06" />
      <path d="M14.31 16H2.83" />
      <path d="m16.62 12-5.74 9.94" />
    </svg>
  );
}

/** Symbole + wordmark, pensé pour les fonds sombres (couleur héritée). */
export function LogoWordmark({ title = "DeEplan", ...props }: MarkProps) {
  return (
    <svg
      viewBox="0 0 156 36"
      width={156}
      height={36}
      fill="none"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        transform="translate(2,4) scale(1.1667)"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m14.31 8 5.74 9.94" />
        <path d="M9.69 8h11.48" />
        <path d="m7.38 12 5.74-9.94" />
        <path d="M9.69 16 3.95 6.06" />
        <path d="M14.31 16H2.83" />
        <path d="m16.62 12-5.74 9.94" />
      </g>
      <text
        x="44"
        y="25"
        fontFamily="var(--font-inter), system-ui, sans-serif"
        fontSize="22"
        fontWeight="600"
        letterSpacing="-0.6"
        fill="currentColor"
      >
        Obscura
      </text>
    </svg>
  );
}
