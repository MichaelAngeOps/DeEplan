/**
 * Groupe de routes d'authentification. Les écrans gèrent eux-mêmes le cas d'un
 * utilisateur déjà connecté (`/login` et `/inscription` proposent alors de
 * continuer ou de changer de compte) — pas de redirection globale ici, sinon
 * impossible d'atteindre le formulaire pour se connecter avec un autre compte.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
