# B&K Consulting — site V5 (FR / NL / EN)

Site statique (HTML/CSS/JS). Les pages HTML des 3 langues sont générées depuis un seul modèle par `tools/build.py` (Python 3, stdlib uniquement). Les fichiers générés sont versionnés : le site se sert tel quel.

## Lancer en local

```bash
cd batu
python3 -m http.server 8080
```

Ouvrir http://localhost:8080. Sous Windows : `py -m http.server 8080`. L'ouverture directe de `index.html` fonctionne aussi.

## Modifier les textes / régénérer

```bash
python3 tools/build.py
```

- Textes FR/NL/EN : `tools/i18n.py` (un dictionnaire par langue, mêmes clés).
- Structure : `tools/index.template.html`, `tools/legal.template.html`.
- Ne pas éditer à la main `index.html`, `nl/`, `en/`, `mentions-legales.html` : ils sont écrasés.
- `SITE` (`tools/build.py`) = `https://bkconsult.be`, hypothèse pour les balises canonical/hreflang : à corriger si le domaine diffère.
- Traductions NL/EN rédigées sans relecture native : à faire relire. Mentions légales à valider par un juriste.

## Structure

| Chemin | Rôle |
|---|---|
| `index.html`, `nl/index.html`, `en/index.html` | Hero (panneaux variés), carte des lieux, pour qui, formats, fonctionnement, FAQ, devis |
| `mentions-legales.html`, `nl/wettelijke-vermeldingen.html`, `en/legal-notice.html` | Mentions légales (champs à compléter) |
| `tools/` | Générateur (`build.py`, `i18n.py`, `belgium.py`, modèles) |
| `css/styles.css` | Jetons de couleur et de police en tête de fichier (`:root`) |
| `js/main.js` | Menu mobile, en-tête qui se masque, révélations au scroll, compteurs, formulaire |
| `assets/logo-dark.png` | Logo monochrome encre extrait de la brochure (raster, 640 px) |
| `fonts/` | Inter, Inter Display et Lora italique (licence OFL), sous-ensemble latin, WOFF |

## Design

- Fond blanc, texte `#0B1220`, surface `#F5F7FA`, filets `#E3E7EE`.
- Accent unique `--accent` (`#C2410C`, rouge brique) et `--accent-rgb` : boutons, liens, icônes, focus. Changer ces deux variables dans `:root` change tout le site. `--led` (`#FB923C`) sert uniquement sur les fonds sombres.
- Hero : à gauche, 5 scènes vectorielles toutes les 4,5 s, chacune avec un type de panneau différent (fixe extérieur, totem intérieur, mur modulaire, écran sur roulettes, abribus) et une étiquette. Bouton pause, arrêt au survol/focus, fixe avec `prefers-reduced-motion`.
- Carte (2e section, fond sombre) : points LED qui s'allument autour des villes du type de lieu choisi. Démo étiquetée « Illustration ». À remplacer par les vrais emplacements ou à retirer avant publication.
- Carte : légende « 200+ écrans · 100 intérieur · 100 extérieur » sous la carte (hypothèse de répartition à confirmer).
- Pour qui : 7 tuiles colorées, chacune mène au devis avec l'activité pré-remplie.
- Formats : 5 cartes qui s'élargissent au survol ou au focus clavier, avec une scène illustrée chacune (SVG inline). Empilées sur mobile et écrans tactiles.

## Remplacer les illustrations par des photos ou vidéos
Dans chaque `.fcard`, remplacer le `<svg class="fcard__media">` par `<img class="fcard__media" src="assets/media/xxx.jpg" alt="">` ou `<video class="fcard__media" src="assets/media/xxx.mp4" autoplay muted loop playsinline></video>`. Les médias doivent montrer de vraies installations de B&K.

## À fournir avant publication

- Photos et vidéos réelles des écrans installés (tous les visuels actuels sont des illustrations).
- Emplacements réels pour la carte (liste de lieux, au moins par province).
- Liste et répartition réelle des écrans (200 au total, 100 intérieur / 100 extérieur sont une hypothèse) : l'affirmation doit pouvoir être prouvée.
- Fiche technique : dimensions, résolution, luminosité, formats de fichier acceptés pour les maquettes.
- Logo vectoriel (`.ai`, `.svg`).
- Mentions légales : forme juridique, adresse, numéro BCE, TVA, hébergeur.
- Formulaire : ouvre la messagerie (`mailto:`). Prévoir un envoi serveur pour un usage réel.
- Téléphone : présent dans la couche texte de la brochure, non publié.

## Images

Aucune photo ni image IA. Le hero est un montage en HTML/CSS avec des messages génériques, sans marque ni client réels. Règles à respecter pour la suite :

- Une image entièrement générée par IA n'est en principe pas protégeable par le droit d'auteur en Belgique/UE.
- Depuis le 2 août 2026 (article 50 du règlement européen sur l'IA), les images réalistes générées qui paraissent authentiques doivent être signalées.
- Une photo ou une scène fictive présentée comme un écran ou un événement réel peut être trompeuse.
- Photos de personnes : consentement requis (article XI.174 du Code de droit économique, RGPD).
- Banques d'images : respecter la licence et le crédit.
