# DeEplan — application de bureau (Electron)

Coquille Electron minimale : elle charge l'app web déployée
(`https://de-eplan.vercel.app`). **Aucun code applicatif n'est dupliqué** — une
mise à jour du site web est immédiatement visible dans l'app.

## Développement

```bash
cd desktop
npm install
npm start            # ouvre l'app (charge la prod)
DEEPLAN_URL=http://localhost:3000 npm start   # pour pointer sur le dev local
```

## Construire les installateurs

```bash
npm run dist:linux   # .AppImage   (constructible sous Linux)
npm run dist:win     # .exe        (Windows, ou CI)
npm run dist:mac     # .dmg        (macOS uniquement, ou CI)
```

Les artefacts sont dans `desktop/dist/` (gitignoré).

### Les 3 plateformes d'un coup : GitHub Actions

Le workflow `.github/workflows/desktop.yml` construit Linux + Windows + macOS
sur des runners GitHub (gratuits, repo public) :

- **Manuel** : onglet *Actions* → *Desktop (Electron)* → *Run workflow* → les
  installateurs sont téléchargeables en *artifacts*.
- **Release** : pousser un tag `desktop-v1.0.0` → une *Release GitHub* est créée
  avec les 3 installateurs attachés.

## Signature

Aucune signature pour l'instant :

- **Windows** : l'`.exe` fonctionne ; SmartScreen affiche « Éditeur inconnu »
  (→ *Informations complémentaires* → *Exécuter quand même*).
- **macOS** : le `.dmg` n'est pas notarisé ; à la 1ʳᵉ ouverture, **clic droit sur
  l'app → Ouvrir**.
- **Linux** : l'`.AppImage` fonctionne directement.

Signature Windows (certificat) et macOS (compte Apple Developer 99 $/an) à
ajouter plus tard.
