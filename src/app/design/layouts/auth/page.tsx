import { AuthShell } from "@/components/layout";
import { Button, Field, Input } from "@/components/ui";

export default function AuthShellPreview() {
  return (
    <AuthShell heading="Connexion" subheading="Accédez à votre espace Responsable ou Star.">
      <div className="flex flex-col gap-4">
        <Field label="Email" htmlFor="p-email">
          <Input id="p-email" type="email" placeholder="vous@exemple.com" />
        </Field>
        <Field label="Mot de passe" htmlFor="p-pwd">
          <Input id="p-pwd" type="password" placeholder="••••••••" />
        </Field>
        <Button fullWidth>Se connecter</Button>
      </div>
    </AuthShell>
  );
}
