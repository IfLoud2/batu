# B&K Consulting — site V1

Site statique (HTML/CSS/JS, sans build ni dépendance). Page unique + page de mentions légales.

## Lancer en local

```bash
cd batu
python3 -m http.server 8080
```

Ouvrir http://localhost:8080. Sous Windows : `py -m http.server 8080`. L'ouverture directe de `index.html` fonctionne aussi.

## Structure

| Chemin | Rôle |
|---|---|
| `index.html` | Page unique : accueil, présentation, événement, réseau, approche, formules, contact |
| `mentions-legales.html` | Mentions légales (champs `à compléter`) |
| `css/styles.css` | Jetons de couleur et de police en tête de fichier (`:root`) |
| `js/main.js` | Menu mobile, en-tête qui se masque, révélations au scroll, compteur, formulaire |
| `assets/logo-white.png` | Logo monochrome blanc extrait de la brochure (raster, 640 px) |
| `fonts/` | Poppins (OFL) en repli de Montserrat |

## Choix de design

- Fond `#171718`, texte `#f4f4f2`, accent plat `#f9af24` (barres, numéros, focus), brun `#573a13` pour les étiquettes.
- Aucun dégradé or métallique. Pour supprimer l'ambre : changer `--accent` dans `:root`.
- Animations : carte (tracé + points), compteur 0 → 200, ligne de l'approche, apparition des cartes. Tout est coupé avec `prefers-reduced-motion`.

## Police Montserrat

La charte utilise Montserrat. Elle n'est pas fournie ici : le site utilise Poppins tant qu'elle manque.

1. Télécharger Montserrat (variable, licence OFL) sur Google Fonts.
2. Copier `Montserrat-Variable.woff2` dans `fonts/`.
3. Dans `css/styles.css`, remplacer la ligne `src: local("Montserrat");` par :

```css
src: local("Montserrat"), url("../fonts/Montserrat-Variable.woff2") format("woff2");
```

## À remplacer avant publication

- **Carte de la Belgique** : contour simplifié dessiné à la main, points illustratifs. À remplacer par un fond officiel et par les vraies positions d'écrans. L'affirmation « 200+ écrans à travers la Belgique » doit pouvoir être prouvée (liste des écrans, lieux, événements).
- **Logo** : raster extrait d'une brochure. Demander le fichier vectoriel (`.ai`, `.svg`).
- **Mentions légales** : forme juridique, adresse, numéro BCE, TVA, hébergeur.
- **Formulaire** : ouvre la messagerie (`mailto:`). Prévoir un envoi serveur pour un usage réel.
- **Téléphone** : la brochure contient `+32 499 81 79 47` dans la couche texte mais pas à l'affichage ; non publié.

## Images

Aucune photo dans cette V1, volontairement. Les visuels des brochures sont générés par IA :

- Une image entièrement générée n'est en principe pas protégeable par le droit d'auteur en Belgique/UE (il faut une création humaine originale). Un concurrent peut la réutiliser.
- Les conditions de l'outil utilisé décident de l'usage commercial permis. Les conserver.
- Depuis le 2 août 2026 (article 50 du règlement européen sur l'IA), les images réalistes qui ressemblent à des lieux, objets ou événements existants et paraissent authentiques doivent être signalées comme générées. Les mises en scène d'écrans et d'événements des brochures sont concernées.
- Une photo ou une scène fictive présentée comme un événement ou un écran réel peut être trompeuse.
- Photos de personnes : consentement requis (droit à l'image, article XI.174 du Code de droit économique, et RGPD).
- Banques d'images : respecter la licence et le crédit.

Pour la suite : photos réelles des écrans et événements, ou visuels signalés comme illustrations.
