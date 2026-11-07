/**
 * Mesure de charge sur un jeu fictif, dans un Postgres temporaire (PGlite). Ne contacte jamais Supabase.
 * Lancer : node scripts/mesure-charge.mjs
 * Avant/après une migration, dans la même exécution :
 *   COMPARER=20261107212557_index_cles_etrangeres.sql node scripts/mesure-charge.mjs
 *
 * Les durées sont à comparer entre elles : PGlite tourne dans Node, pas sur un vrai serveur.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const DEPARTEMENTS = Number(process.env.DEPARTEMENTS ?? 16);
const STARS_PAR_DEPARTEMENT = Number(process.env.STARS ?? 63);
const SECTIONS_PAR_DEPARTEMENT = 5;
const POSTES_PAR_SECTION = Number(process.env.POSTES_SECTION ?? 8);
const JOURS_HISTORIQUE = 365;
const JOURS_A_VENIR = 60;
const NOTIFICATIONS_PAR_STAR = 200;
const REPETITIONS = 5;

const racine = join(import.meta.dirname, "..", "supabase");
const db = new PGlite();
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0)} s] ${m}`);

await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth; grant usage on schema auth to public;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create publication supabase_realtime;
`);
await db.exec(readFileSync(join(racine, "schema", "schema-complet.sql"), "utf8"));
const COMPARER = process.env.COMPARER;
for (const f of readdirSync(join(racine, "migrations")).filter((f) => f.endsWith(".sql") && f.slice(0, 14) > "20261106064650" && f !== COMPARER).sort()) {
  await db.exec(readFileSync(join(racine, "migrations", f), "utf8"));
}
await db.exec("set search_path = public");

const POSTES_PAR_DEPARTEMENT = SECTIONS_PAR_DEPARTEMENT * POSTES_PAR_SECTION;
log(`génération : ${DEPARTEMENTS} départements, ${STARS_PAR_DEPARTEMENT} stars et ${POSTES_PAR_DEPARTEMENT} postes par département`);

// Identifiants lisibles : d'abord le type, puis le département, puis le rang.
const uuid = (type, d, n) => `('00000000-0000-4000-8${type}00-' || lpad(((${d}) * 100000 + (${n}))::text, 12, '0'))::uuid`;

await db.exec(`
  set session_replication_role = replica;
  insert into auth.users (id) select ${uuid(1, "d", 0)} from generate_series(1, ${DEPARTEMENTS}) d;
  insert into utilisateurs (id, email, nom, prenom) select ${uuid(1, "d", 0)}, 'resp' || d || '@test.local', 'Responsable', 'R' || d from generate_series(1, ${DEPARTEMENTS}) d;
  insert into departements (id, nom, responsable_id) select ${uuid(2, "d", 0)}, 'Departement ' || d, ${uuid(1, "d", 0)} from generate_series(1, ${DEPARTEMENTS}) d;
  insert into sections (id, departement_id, nom)
    select ${uuid(3, "d", "s")}, ${uuid(2, "d", 0)}, 'Section ' || s
    from generate_series(1, ${DEPARTEMENTS}) d, generate_series(1, ${SECTIONS_PAR_DEPARTEMENT}) s;
  insert into postes (id, section_id, nom)
    select ${uuid(4, "d", "(s - 1) * 100 + p")}, ${uuid(3, "d", "s")}, 'Poste ' || s || '-' || p
    from generate_series(1, ${DEPARTEMENTS}) d, generate_series(1, ${SECTIONS_PAR_DEPARTEMENT}) s, generate_series(1, ${POSTES_PAR_SECTION}) p;
  insert into auth.users (id) select ${uuid(5, "d", "n")} from generate_series(1, ${DEPARTEMENTS}) d, generate_series(1, ${STARS_PAR_DEPARTEMENT}) n;
  insert into utilisateurs (id, email, nom, prenom) select ${uuid(5, "d", "n")}, 's' || d || '-' || n || '@test.local', 'Star', 'S' || n from generate_series(1, ${DEPARTEMENTS}) d, generate_series(1, ${STARS_PAR_DEPARTEMENT}) n;
  insert into roles_utilisateurs (utilisateur_id, role, statut) select ${uuid(5, "d", "n")}, 'star', 'valide' from generate_series(1, ${DEPARTEMENTS}) d, generate_series(1, ${STARS_PAR_DEPARTEMENT}) n;
  insert into demandes_departement (star_id, departement_id, statut) select ${uuid(5, "d", "n")}, ${uuid(2, "d", 0)}, 'valide' from generate_series(1, ${DEPARTEMENTS}) d, generate_series(1, ${STARS_PAR_DEPARTEMENT}) n;
  insert into star_sections (star_id, section_id) select ${uuid(5, "d", "n")}, ${uuid(3, "d", `((n - 1) % ${SECTIONS_PAR_DEPARTEMENT}) + 1`)} from generate_series(1, ${DEPARTEMENTS}) d, generate_series(1, ${STARS_PAR_DEPARTEMENT}) n;
`);
log("comptes et structure créés");
await db.exec(`
  insert into plannings (star_id, poste_id, date, cree_par, statut)
    select ${uuid(5, "d", `(((s - 1) * 100 + p + j) % ${STARS_PAR_DEPARTEMENT}) + 1`)}, ${uuid(4, "d", "(s - 1) * 100 + p")}, current_date + j, ${uuid(1, "d", 0)},
      case when j < 0 then 'a_servi' else 'de_service' end
    from generate_series(1, ${DEPARTEMENTS}) d, generate_series(1, ${SECTIONS_PAR_DEPARTEMENT}) s, generate_series(1, ${POSTES_PAR_SECTION}) p, generate_series(-${JOURS_HISTORIQUE}, ${JOURS_A_VENIR}) j;
`);
log("plannings créés");
await db.exec(`
  insert into disponibilites (star_id, date, statut)
    select ${uuid(5, "d", "n")}, current_date + j, case when (n + j) % 11 = 0 then 'indisponible' else 'disponible' end
    from generate_series(1, ${DEPARTEMENTS}) d, generate_series(1, ${STARS_PAR_DEPARTEMENT}) n, generate_series(-${JOURS_HISTORIQUE}, ${JOURS_A_VENIR}, 2) j;
`);
log("disponibilités créées");
await db.exec(`
  insert into notifications (utilisateur_id, type, contenu, lu, date_creation)
    select ${uuid(5, "d", "n")}, 'annonce', 'Message ' || k, k > 3, now() - (k || ' days')::interval
    from generate_series(1, ${DEPARTEMENTS}) d, generate_series(1, ${STARS_PAR_DEPARTEMENT}) n, generate_series(1, ${NOTIFICATIONS_PAR_STAR}) k;
  set session_replication_role = origin;
  analyze;
`);
log("notifications créées");

const compte = await db.query(`select
  (select count(*)::int from plannings) plannings, (select count(*)::int from disponibilites) disponibilites,
  (select count(*)::int from notifications) notifications, (select count(*)::int from utilisateurs) utilisateurs`);
console.log("Volumes :", compte.rows[0]);

const D = 8;
const R = `00000000-0000-4000-8100-${String(D * 100000).padStart(12, "0")}`;
const S = `00000000-0000-4000-8500-${String(D * 100000 + 7).padStart(12, "0")}`;
const DEP = `00000000-0000-4000-8200-${String(D * 100000).padStart(12, "0")}`;
const SEC = `00000000-0000-4000-8300-${String(D * 100000 + 1).padStart(12, "0")}`;

const debutMois = "date_trunc('month', current_date)::date";
const finMois = "(date_trunc('month', current_date) + interval '1 month')::date";

const REQUETES = [
  ["Connexion : droits (getAcces, 4 requêtes)", R, [
    `select id from departements where responsable_id = '${R}'`,
    `select role, statut from roles_utilisateurs where utilisateur_id = '${R}'`,
    `select section_id from star_sections where star_id = '${R}'`,
    `select departement_id, statut from demandes_departement where star_id = '${R}'`,
  ]],
  ["Grille du mois", R, [`select p.id, p.poste_id, p.date, p.statut, u.prenom, u.nom from plannings p left join utilisateurs u on u.id = p.star_id where p.date >= ${debutMois} and p.date < ${finMois}`]],
  ["Shifts du jour", R, [`select p.id, p.statut, u.prenom, po.nom from plannings p join postes po on po.id = p.poste_id join sections s on s.id = po.section_id left join utilisateurs u on u.id = p.star_id where p.date = current_date and s.departement_id = '${DEP}'`]],
  ["Conflits à venir", R, [`select p.id, p.date, p.star_id from plannings p join postes po on po.id = p.poste_id join sections s on s.id = po.section_id where p.date >= current_date and s.departement_id = '${DEP}'`]],
  ["Annuaire : stars du département", R, [
    `select star_id, statut from demandes_departement where departement_id = '${DEP}' and statut in ('valide', 'refuse')`,
    `select u.id, u.prenom, u.nom, u.email from utilisateurs u where u.id in (select star_id from demandes_departement where departement_id = '${DEP}')`,
  ]],
  ["Candidats d'une case", R, [
    `select star_id from star_sections where section_id = '${SEC}'`,
    `select d.star_id, d.statut from disponibilites d where d.date = current_date + 5 and d.star_id in (select star_id from star_sections where section_id = '${SEC}')`,
  ]],
  ["Star : calendrier du mois", S, [`select p.id, p.date, p.statut, po.nom from plannings p join postes po on po.id = p.poste_id where p.star_id = '${S}' and p.date >= ${debutMois} and p.date < ${finMois}`]],
  ["Star : notifications", S, [`select id, type, contenu, lu from notifications where utilisateur_id = '${S}' and type not in ('conflit_dispo') order by date_creation desc limit 50`]],
  ["Star : pastille non lues", S, [`select count(*) from notifications where utilisateur_id = '${S}' and lu = false and type not in ('conflit_dispo')`]],
  ["Star : ses disponibilités", S, [`select date, statut from disponibilites where star_id = '${S}' and date >= current_date`]],
];

async function mesurer(titre) {
  console.log(`\n=== ${titre}`);
  const resultat = {};
  for (const [nom, utilisateur, sqls] of REQUETES) {
    const durees = [];
    let lignes = 0;
    for (let i = 0; i < REPETITIONS; i += 1) {
      const debut = performance.now();
      lignes = 0;
      await db.transaction(async (tx) => {
        await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [utilisateur]);
        await tx.exec("set local role authenticated");
        for (const sql of sqls) lignes += (await tx.query(sql)).rows.length;
      });
      durees.push(performance.now() - debut);
    }
    durees.sort((a, b) => a - b);
    const mediane = durees[Math.floor(REPETITIONS / 2)];
    resultat[nom] = mediane;
    console.log(`${nom.padEnd(46)} ${mediane.toFixed(1).padStart(10)} ms  ${String(lignes).padStart(6)} lignes`);
  }
  return resultat;
}

const avant = await mesurer("Base actuelle");

const grille = await db.query(`select count(*)::int n from plannings p join postes po on po.id = p.poste_id join sections s on s.id = po.section_id where s.departement_id = '${DEP}' and p.date >= ${debutMois} and p.date < ${finMois}`);
console.log(`\nShifts d'un département ce mois-ci : ${grille.rows[0].n} (limite probable d'une lecture : 1 000)`);
const debutTache = performance.now();
const tache = await db.query("select public.shifts_marquer_a_confirmer() n");
console.log(`Tâche planifiée : ${(performance.now() - debutTache).toFixed(0)} ms, ${tache.rows[0].n} lignes`);

async function supprimerDepartement(d) {
  const id = `00000000-0000-4000-8200-${String(d * 100000).padStart(12, "0")}`;
  const debut = performance.now();
  await db.query("delete from departements where id = $1", [id]);
  return performance.now() - debut;
}

const suppressionAvant = await supprimerDepartement(1);
console.log(`Suppression d'un département : ${suppressionAvant.toFixed(0)} ms`);

if (COMPARER) {
  await db.exec(readFileSync(join(racine, "migrations", COMPARER), "utf8"));
  await db.exec("analyze");
  log(`migration appliquée : ${COMPARER}`);
  const apres = await mesurer("Après la migration");
  const suppressionApres = await supprimerDepartement(2);
  console.log(`Suppression d'un département : ${suppressionApres.toFixed(0)} ms`);

  console.log("\n=== Comparaison");
  for (const nom of Object.keys(avant)) {
    console.log(`${nom.padEnd(46)} ${avant[nom].toFixed(1).padStart(10)} -> ${apres[nom].toFixed(1).padStart(10)} ms`);
  }
  console.log(`${"Suppression d'un département".padEnd(46)} ${suppressionAvant.toFixed(1).padStart(10)} -> ${suppressionApres.toFixed(1).padStart(10)} ms`);
}
await db.close();
