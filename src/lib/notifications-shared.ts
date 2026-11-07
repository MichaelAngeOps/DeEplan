// Partagé client + serveur (aucune dépendance serveur).

export type EspaceNotifications = "star" | "responsable";

/** Types de notifications destinés à l'espace Responsable. Tous les autres vont à l'espace Star. */
export const TYPES_RESPONSABLE = ["conflit_dispo"] as const;

interface RequeteFiltrable<T> {
  in(colonne: "type", valeurs: readonly string[]): T;
  not(colonne: "type", operateur: "in", valeur: string): T;
}

export function filtrerParEspace<T extends RequeteFiltrable<T>>(
  requete: T,
  espace: EspaceNotifications,
): T {
  return espace === "responsable"
    ? requete.in("type", TYPES_RESPONSABLE)
    : requete.not("type", "in", `(${TYPES_RESPONSABLE.join(",")})`);
}
