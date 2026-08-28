# Cartographie de la maquette de référence

> Analyse de `Planning Responsable - Wireframes copy.dc.html` (1431 lignes) +
> `support.js`. **Aucun code applicatif produit** — document de cadrage avant
> implémentation.
>
> ⚠️ La maquette est un **prototype `.dc.html`** : un seul « composant »
> (`class Component extends DCLogic`) avec un `state`, des handlers, et
> `renderVals()` qui renvoie le view-model. Templating : `<sc-if value="{{ }}">`
> (conditionnel), `<sc-for list="{{ }}" as="x">` (boucle), `{{ }}` (binding).
> Données 100 % **mockées en dur** dans le fichier.

---

## 1. Vue d'ensemble — 3 parcours

Le `state` pilote 3 zones mutuellement exclusives (`renderVals()` l.1321-1322) :

| Flag | Condition | Zone |
|---|---|---|
| `isAuthFlow` | `!!state.authPage` | Parcours connexion / inscription |
| `isAppFlow` | `!authPage && !starFlow` | **Espace Responsable** (app complète, sidebar) |
| `isStarFlow` | `!!state.starFlow` | **Espace Star** (frame desktop/mobile) |

### Échafaudage de démo à NE PAS reproduire
- Les bandeaux « Aperçu du parcours de connexion » / « Aperçu de l'espace Star »
  + le sélecteur **Desktop / Mobile** encadrant l'écran → chrome de présentation.
- Les liens « (démo) », « Simuler la validation (démo) », « Démo sélecteur de rôle »,
  les `alert(...)` (`duplicatePrevMonth`, `exportPlanning`, `submitAvailability`).
- Le cadre fixe 460px / 375px (auth) et 900×720 / 375×720 (star).

En vrai : l'espace Responsable est une app web pleine page ; l'auth et l'espace
Star sont **responsive** (desktop + mobile réels).

---

## 2. Modèle de navigation

### 2.1 Parcours Auth — `state.authPage`

```
home ──"Se connecter"──────────────► login
 │                                     │
 │                                     ├─"Mot de passe oublié ?"─► forgot-password ─(envoi)─► (écran "Email envoyé")
 │                                     ├─"Créer un compte"───────► account-type
 │                                     └─"Démo sélecteur de rôle"─► role-selector
 │
 └──"Créer un compte"──► account-type ──(coche ≥1 rôle, "Continuer")──► signup-identity
                                                                          │
                        ┌─── manager coché : ──► app (page:'dashboard'), bannière "Star en attente" si star aussi coché
   "Créer mon compte" ──┤
                        └─── star seul : ──────► pending-validation ──"Simuler validation"──► welcome ──"Continuer"──► star flow (calendar)

role-selector ──"Continuer en tant que Responsable"──► app (dashboard)
              └─"Continuer en tant que Star"─────────► star flow (calendar)
```

Valeurs de `authPage` : `home`, `login`, `forgot-password`, `role-selector`,
`account-type`, `signup-identity`, `pending-validation`, `welcome`, `null` (= app).

### 2.2 Espace Responsable — `state.page`

Sidebar fixe (`NAV`, l.1028) — 6 entrées :

| `page` | Libellé sidebar | Icône lucide | Route cible (prompt §4) |
|---|---|---|---|
| `dashboard` | Tableau de bord | `layout-dashboard` | `/responsable/dashboard` |
| `planning` | Planification mensuelle | `calendar-days` | `/responsable/planning` |
| `structure` | Structure | `folder-tree` | `/responsable/structure` |
| `directory` | Annuaire des stars | `users` | `/responsable/stars` |
| `pending` | Comptes en attente | `user-plus` | `/responsable/validations` |
| `announcements` | Annonces | `megaphone` | `/responsable/annonces` |

- `directory` a **2 sous-états** : liste (`isDirectoryList`) / détail
  (`isDirectoryDetail`, quand `selectedStar`). → routes `/responsable/stars` et
  `/responsable/stars/[id]`.
- Pas de page « notifications » côté Responsable dans la maquette.

### 2.3 Espace Star — `state.starFlow`

Sidebar (desktop) / tab bar (mobile) — 4 entrées (`STAR_NAV`, l.1215) :

| `starFlow` | Libellé | Icône | Route cible |
|---|---|---|---|
| `calendar` | Mon calendrier | `calendar-days` | `/star/calendrier` |
| `availability` | Mes disponibilités | `clock` | `/star/disponibilites` |
| `announcements` | Annonces | `megaphone` | `/star/annonces` |
| `notifications` | Notifications | `bell` | `/star/notifications` |

---

## 3. Inventaire des écrans

### 3.1 — Auth

| Écran | Contenu | Champs | Actions | États |
|---|---|---|---|---|
| **home** | logo `mark.svg`, titre « DeEplan », pitch | — | *Se connecter* → login ; *Créer un compte* → account-type | — |
| **login** | titre, retour accueil | email, mot de passe | *Se connecter* (pas de logique maquette) ; liens forgot / créer / sélecteur de rôle | — |
| **forgot-password** | 2 sous-vues | email | *Envoyer le lien* → passe `forgotPasswordSent=true` | form / « Email envoyé à {email} » |
| **role-selector** | 2 gros boutons rôle | — | *Continuer en tant que Responsable* / *… Star* | visible seulement si « les 2 rôles validés » |
| **account-type** | 2 cases à cocher (Responsable / Star), cumul possible | `signupRoles.manager`, `signupRoles.star` | *Continuer* (désactivé si aucun rôle) → signup-identity | bordure/fond accent quand coché ; bouton grisé si 0 rôle |
| **signup-identity** | prénom, nom, email, mdp + **bloc conditionnel** | + si manager : nom + description du **département** ; si star : encart « soumis à validation » | *Créer mon compte* | résumé du rôle : « Compte Responsable et Star. » / « Compte Responsable. » / « Compte Star — soumis à validation. » |
| **pending-validation** | icône horloge, texte « en attente », « aucun accès » | — | *Simuler la validation* → welcome ; *Se déconnecter* → login | — |
| **welcome** | icône party, « Bienvenue dans le département {X} » | — | *Continuer* → espace Star | — |

**Règle comptes (prompt §8) confirmée par la maquette** (`createAccount`, l.983) :
- `manager` coché → accès **immédiat** à l'espace Responsable (création directe du département à l'inscription).
- `star` seul → écran **pending-validation**, aucun accès tant que non validé.
- `manager + star` → accès Responsable + **bannière** « rôle Star en attente de validation » sur le dashboard (`starRolePendingBanner`).

### 3.2 — Espace Responsable

#### Layout commun (`isAppFlow`, l.185-217)
- **Sidebar** 248px, fond `--bg-dark`, sticky pleine hauteur :
  - en-tête : `mark.svg` + « DeEplan » + « Planning · Responsable »
  - liste `navItems` (actif = fond `--accent`, texte blanc)
  - pied : avatar initiales + « Camille Morel » / « Responsable »
  - liens démo (à retirer)
- **Zone contenu** : `padding:36px 44px 80px`, `position:relative` (pour les modales).

#### `dashboard` (`isDashboard`)
- Titre + date du jour.
- Bannière conditionnelle `starRolePendingBanner`.
- Grille 2 colonnes (1.4fr / 1fr) :
  - **Carte « Stars de service aujourd'hui »** : liste `dutyToday` — avatar, nom, poste · horaire, 2 boutons toggle **A servi** / **N'a pas servi** (couleur verte / rouge quand actif).
  - **Carte « Alertes »** :
    - « Statuts non confirmés depuis 24h » → liste `unconfirmed` (nom · poste · depuis Xh)
    - « Conflits de disponibilité non résolus » → liste `conflicts` (détail texte)
    - Encart cliquable « Comptes en attente de validation » + compteur → va sur `pending`

#### `planning` (`isPlanning`) — écran central
- En-tête : titre + boutons *Dupliquer le planning du mois précédent* / *Exporter*.
- Navigateur de mois : ‹ `monthLabel` › (`prevMonth` / `nextMonth`).
- **Grille** (`<table>` scroll horizontal) :
  - colonne gauche sticky « Poste » (min 180px)
  - 1 colonne par jour du mois (28-31), en-tête weekend teinté, **dimanche** repérable
  - lignes : alternance **ligne-section** (barre `--bg-alt`, colspan) / **lignes-poste**
  - chaque **cellule** = chip initiales (`--accent` si assigné, vide sinon), cliquable → ouvre la modale `activeCell`
- Données : `planningRows` (sections + postes) × `days` ; assignation effective = `state.assignments[posteId_day]` sinon `cellSeed()` (mock).

#### `structure` (`isStructure`)
- Titre + bouton *Nouvelle section*.
- Liste `sectionsTree` — cartes accordéon :
  - en-tête : chevron (toggle `expanded`), nom section, « N postes », icônes ✏️ / 🗑️
  - corps (si `expanded`) : liste des postes (icône, nom, ✏️ / 🗑️) + bouton *Ajouter un poste*
- CRUD Sections & Postes (les boutons édit/suppr n'ont pas de logique maquette).

#### `directory` — liste (`isDirectoryList`)
- Titre + `<select>` filtre par section (`filterSection`, option « Toutes les sections »).
- **Table** : Nom · Sections · Statut (« Actif ») · Dimanches travaillés. Ligne cliquable → détail.

#### `directory` — détail (`isDirectoryDetail`)
- Lien retour, en-tête (avatar, nom, sections) + bouton *Désactiver le compte*.
- Grille 2×2 de cartes :
  - **Dimanches travaillés** (gros chiffre accent)
  - **Sections assignées** (chips)
  - **Disponibilités soumises** (date / créneau)
  - **Historique de statuts** (date / statut)

#### `pending` (`isPending`) — validations
- Titre + « N nouvelles inscriptions à traiter ».
- Liste `pendingAccounts` — cartes :
  - nom, email · inscrit le {date}
  - « Assigner à une ou plusieurs sections » → chips-checkbox (`sectionChoices`)
  - boutons *Valider* / *Refuser* (retirent la carte de la liste)
- État vide : « Aucun compte en attente. »

#### `announcements` (`isAnnouncements`)
- Titre + bouton *Nouvelle annonce* (ouvre `announcementModal` mode `new`).
- Liste `announcements` — cartes : date | titre + extrait | ✏️ (édit) / 🗑️.

### 3.3 — Espace Star

#### Layout (`isStarFlow`, l.615-796)
- **Desktop** : sidebar 220px (fond `--bg-dark`), en-tête « Planning · Star », `starNavItems`, pied avatar « Nora Haddad », lien retour démo.
- **Mobile** : barre statut simulée + header (titre page + lien « Responsable ‹ »), **tab bar** bas (4 onglets icône + libellé court).
- Contenu scrollable, `padding:24px`.

#### `calendar` (`isStarCalendar`)
- Titre (desktop), navigateur de mois.
- **Légende de statuts** (`statusLegend`, 5 pastilles) : Pas en service / De service / A servi / N'a pas servi / À confirmer.
- **Grille mensuelle 7 colonnes** (Lun→Dim), cellules jour :
  - numéro + badge statut coloré (`STATUS_STYLES`)
  - cliquable seulement si statut ≠ `off` → modale `starShiftDetail`

#### `availability` (`isStarAvailability`)
- Titre + consigne « Cliquez sur une date pour basculer disponible / indisponible ».
- Navigateur de mois (**défaut = mois suivant**, `availMonth:9`).
- Légende : Disponible (vert) / Indisponible (rouge) / Non renseigné (gris).
- Grille 7 colonnes ; clic sur cellule → cycle `available → unavailable → non renseigné` (`toggleAvailability`).
- Bouton *Valider mes disponibilités*.

#### `announcements` (`isStarAnnouncements`)
- Liste `announcements` (lecture seule) — date, titre, extrait.

#### `notifications` (`isStarNotifications`)
- Liste `starNotifications` — pastille non-lu (accent), icône ronde, texte (gras si non-lu), date.

---

## 4. Modales & popups

| Nom (state) | Écran | Déclencheur | Contenu | Actions |
|---|---|---|---|---|
| `activeCell` | planning | clic sur une cellule | **si occupée** : star assigné + *Changer de star* / *Retirer* / *Annuler* ; **si libre** : liste candidats (`Assigner`) ou « Aucun star disponible » | overlay, `stopProp`, `closeCell` |
| `pendingAssignment` | planning | assignation d'un star déjà sur **3 dimanches** ce mois (`requestAssign`) | ⚠️ « Règle des dimanches » + message | *Annuler* / *Planifier quand même* (`confirmAssignAnyway`) |
| `announcementModal` | annonces (Responsable) | *Nouvelle annonce* / ✏️ | titre + contenu (textarea) | *Annuler* / *Publier* \| *Enregistrer* |
| `starShiftDetail` | calendrier Star | clic sur un jour « de service » | date, section, poste, horaire, description | fermeture overlay |

**Pattern modale** : overlay `position:fixed;inset:0;background:rgba(0,0,0,0.28)` +
carte centrée `--r-lg`, `box-shadow:0 12px 40px rgba(0,0,0,.2)`, clic hors carte = fermeture, `stopProp` sur la carte.

---

## 5. Inventaire des composants à créer

### Primitifs / partagés
| Composant | Usage | Notes |
|---|---|---|
| `Button` | partout | variantes : `primary` (accent plein), `secondary` (pearl + bordure), `ghost`, `danger` (texte `#c0392b`), `dashed` ; forme pilule ; `active:scale-press` |
| `IconButton` | ✏️ 🗑️ ‹ › ✕ | lucide-react |
| `Input` / `Textarea` / `Select` | formulaires | bordure `--border`, `--r-sm`, focus accent |
| `Checkbox` | account-type, pending, availability | `accent-color: var(--accent)` |
| `Card` | toutes les zones de contenu | `--bg`, `1px --border`, `--r-lg`, padding 20-24 |
| `Modal` | 4 usages (§4) | overlay + carte + close-on-backdrop + `stopProp` |
| `Avatar` | initiales | rond, `--bg-alt`, bordure |
| `StatusBadge` | dashboard, calendrier Star, détail star | mappe `STATUS_STYLES` (5 statuts) |
| `MonthNavigator` | planning, calendrier Star, dispos | ‹ label › |
| `Chip` / `Tag` | sections, filtres | pilule `--bg-alt` |
| `Banner` / `Alert` | bannière « Star en attente », alertes dashboard | icône + texte |
| `EmptyState` | pending, candidats | icône + message |
| `Legend` | calendrier Star, dispos | pastille + libellé |

### Layout
| Composant | Usage |
|---|---|
| `ResponsableShell` | sidebar 248px + zone contenu |
| `StarShell` | sidebar desktop / header + tab bar mobile |
| `AuthShell` | conteneur centré responsive (remplace le frame de démo) |
| `Sidebar` / `SidebarNav` / `NavItem` | Responsable + Star desktop |
| `MobileTabBar` | Star mobile |

### Métier
| Composant | Écran | Complexité |
|---|---|---|
| `PlanningGrid` (+ `PlanningRow`, `PlanningCell`) | planning | **élevée** — table scrollable, colonne sticky, sections/postes, chips, dimanches |
| `AssignStarModal` | planning | filtrage candidats (section + dispo), assignation, retrait, changement |
| `SundayRuleDialog` | planning | popup règle des 4 dimanches |
| `SectionsTree` (+ `SectionCard`, `PosteRow`) | structure | accordéon + CRUD |
| `DutyTodayList` (+ `DutyRow`) | dashboard | toggle statut |
| `AlertsPanel` | dashboard | 3 blocs (non confirmés / conflits / en attente) |
| `StarsTable` | directory liste | filtre section |
| `StarDetail` | directory détail | 4 cartes |
| `PendingAccountCard` | validations | chips-checkbox sections + valider/refuser |
| `AnnouncementList` (+ `AnnouncementCard`) | annonces (R + S) | R = édition, S = lecture |
| `AnnouncementEditorModal` | annonces R | titre + contenu |
| `MonthCalendar` (générique 7 col.) | calendrier Star + dispos | réutilisable, cellules paramétrables |
| `ShiftDetailModal` | calendrier Star | lecture |
| `AvailabilityCalendar` | dispos Star | cycle disponible/indispo/non renseigné |
| `NotificationList` (+ `NotificationRow`) | notifications Star | non-lu |

**Ordre de dépendance suggéré** : primitifs → layout shells → composants métier par lot fonctionnel (§9 prompt).

---

## 6. Données observées → tables Supabase (prompt §7)

| Entité maquette | Champs vus | Table Supabase probable |
|---|---|---|
| `sections` | id, name, postes[] | `sections`, `postes` |
| `stars` | id, name, sections[], sundaysWorked | `utilisateurs` (+ `roles_utilisateurs`), `star_sections` |
| `assignments` | `{posteId_day: starId}` | `plannings` (poste + date + star + statut) |
| `dutyStatus` / statuts | `served` / `not_served` / `on_duty` / `to_confirm` / `off` | colonne statut de `plannings` |
| `availability` | `{année-mois-jour: available\|unavailable}` | `disponibilites` |
| `announcements` | id, date, title, excerpt/content | `annonces` |
| `pendingAccounts` | id, name, email, date, checks{section} | `utilisateurs` (statut « en attente ») + `star_sections` |
| `starNotifications` / `unconfirmed` / `conflicts` | texte, date, unread, icône | `notifications` |
| département | nom, description | `departements` |

**Correspondance statuts** (maquette → prompt §8) :
`on_duty` = `de_service` · `served` = `a_servi` · `not_served` = `na_pas_servi` ·
`to_confirm` = `a_confirmer` · `off` = pas de shift. *(Utiliser les noms du prompt
côté code.)*

---

## 7. Règles métier confirmées par la maquette

1. **Règle des 4 dimanches** (`sundayCountForStar` + `requestAssign`, l.913-933) :
   si le star a **≥ 3 dimanches** assignés dans le mois → popup avant la 4ᵉ, contournable (`confirmAssignAnyway`). ✅ conforme §8.
2. **Filtrage des candidats** (`renderVals`, l.1110) : `stars.filter(st => st.sections.includes(sectionName))`.
   ⚠️ la maquette **ne filtre que par section**, pas encore par disponibilité du jour → à compléter (prompt §8 « bonne section ET disponibles ce jour-là »).
3. **Cycle de statut** : maquette = changement **manuel** (boutons A servi / N'a pas servi). Les bascules automatiques (`de_service` à 00h, `a_confirmer` après 24h) = **hors périmètre frontend** (Edge Functions, phase ultérieure — prompt §10).
4. **Comptes** : cf. §3.1.
5. **Conflits dispo/planning** : la maquette les **affiche** (bloc « Conflits ») mais ne les calcule pas → logique à écrire.
6. **Disponibilités par défaut sur le mois suivant** (`availMonth: 9` alors que mois courant = 8).

---

## 8. Écarts / décisions de l'ingénieur principal (tranchés le 2026-08-28)

| # | Point | Décision |
|---|---|---|
| 1 | Wordmark « Obscura » du logo | **Remplacer par « DeEplan »** |
| 2 | Granularité des disponibilités | **Binaire, sur la journée** (dispo / pas dispo). Pas de créneaux matin/soir pour cette phase. |
| 3 | Horaires d'un shift | **Portés par le poste** (horaire par défaut du poste). Surcharge au shift éventuellement plus tard. |
| 4 | Statut « pas en service » | **= absence de ligne `plannings`**. 4 statuts réels : `de_service`, `a_servi`, `na_pas_servi`, `a_confirmer`. |
| 5 | Export planning / Duplication mois précédent | **Duplication : maintenant.** **Export : plus tard** (bouton visible mais inactif / `TODO`). |
| 6 | « Désactiver le compte » d'un star | **Soft-delete** : compte marqué inactif ; shifts passés conservés ; plus d'assignation future possible. |
| 7 | Notifications côté Responsable | **Pas d'écran dédié** — on garde le bloc « Alertes » du dashboard tel quel. |
| 8 | Filtre de l'annuaire | **Par section + recherche par nom.** Filtre par statut : plus tard. |
| 9 | Multi-département | **Non** — un responsable ne gère **qu'un seul** département. |
| 10 | Mot de passe oublié | **Flux Supabase Auth standard** (email de réinitialisation). |

---

## 9. Proposition d'ordre d'implémentation (aligné §9 du prompt)

| Lot | Écrans | Composants clés |
|---|---|---|
| **0. Fondations** | — | primitifs (§5), `AuthShell`, `ResponsableShell`, `StarShell` |
| **1. Auth + validation compte** | home, login, forgot-password, account-type, signup-identity, pending-validation, welcome, role-selector | formulaires, `Checkbox`, guards de session, middleware Supabase |
| **2. Structure** | `structure` | `SectionsTree`, CRUD sections/postes |
| **3. Disponibilités (Star)** | `/star/disponibilites` (+ shell Star) | `MonthCalendar`, `AvailabilityCalendar` |
| **4. Planification** | `planning` | `PlanningGrid`, `AssignStarModal`, `SundayRuleDialog` |
| **5. Statuts & notifications** | `dashboard` (duty + alertes), `/star/calendrier`, `/star/notifications` | `StatusBadge`, `DutyTodayList`, `AlertsPanel`, `NotificationList` |
| **6. Annonces** | `/responsable/annonces`, `/star/annonces` | `AnnouncementList`, `AnnouncementEditorModal` |
| **7. Annuaire** | `directory` liste + détail | `StarsTable`, `StarDetail` |

*(Note : l'annuaire n'est pas un lot §9 explicite ; placé en fin car il agrège des
données produites par les lots précédents.)*
