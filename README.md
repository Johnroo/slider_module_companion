# Companion Module - Slider Motorized

Module Companion pour contrôler un slider motorisé avec capacités pan/tilt/slide/zoom via OSC et HTTP.

## Fonctionnalités

Ce module permet de contrôler un slider motorisé avec :
- **Actions de mouvement** : Pan Left/Right, Tilt Up/Down, Slide Left/Right, Zoom In/Out
- **Actions de vitesse** : Configuration dynamique de la vitesse pour chaque axe
- **Actions Stop** : Arrêt instantané de chaque axe ou de tous les axes
- **Variables** : Suivi en temps réel des positions (-100 à 100)
- **Communication** : OSC pour les commandes, HTTP pour le statut
- **Test de connexion** : Validation de l'IP avant activation

## Actions disponibles

### Mouvement (8 actions)
1. **Pan Left** : Mouvement pan vers la gauche
2. **Pan Right** : Mouvement pan vers la droite
3. **Tilt Up** : Mouvement tilt vers le haut
4. **Tilt Down** : Mouvement tilt vers le bas
5. **Slide Left** : Mouvement du slider vers la gauche
6. **Slide Right** : Mouvement du slider vers la droite
7. **Zoom In** : Zoom avant
8. **Zoom Out** : Zoom arrière

Chaque action de mouvement permet de choisir la vitesse (Slow 0.1, Medium 0.5, Fast 1.0) ou d'utiliser la vitesse par défaut configurée.

### Vitesse (3 actions)
1. **Set Pan/Tilt Speed** : Configure la vitesse pour pan et tilt
2. **Set Slide Speed** : Configure la vitesse pour slide
3. **Set Zoom Speed** : Configure la vitesse pour zoom

### Stop (5 actions)
1. **Stop Pan** : Arrête le mouvement pan (envoie 0)
2. **Stop Tilt** : Arrête le mouvement tilt (envoie 0)
3. **Stop Slide** : Arrête le mouvement slide (envoie 0)
4. **Stop Zoom** : Arrête le zoom (envoie 0)
5. **Stop All** : Arrête tous les mouvements

## Variables disponibles

- `pan` : Position Pan (-100 à 100)
- `tilt` : Position Tilt (-100 à 100)
- `zoom` : Position Zoom (-100 à 100)
- `slide` : Position Slide (-100 à 100)

Les variables sont mises à jour automatiquement toutes les 200ms via une API HTTP.

**Mapping des valeurs** :
- 0.0 → -100 (mouvement complètement vers le négatif)
- 0.5 → 0 (position neutre)
- 1.0 → 100 (mouvement complètement vers le positif)

## Configuration

### Champs de configuration

- **Target IP Address** : L'adresse IP de l'appareil slider (requis)
  - Format attendu : IPv4 valide (ex: 192.168.1.100)
  - Un test de connexion automatique valide l'IP avant activation

- **Pan/Tilt Speed** : Vitesse par défaut pour pan et tilt (0.1 à 1.0)
- **Slide Speed** : Vitesse par défaut pour slide (0.1 à 1.0)
- **Zoom Speed** : Vitesse par défaut pour zoom (0.1 à 1.0)

## Installation

### Prérequis

- Node.js 18.12+ ou 22.8+
- Yarn 4.10.3+
- Companion 4.1+ (recommandé)

### Étapes d'installation

1. **Installer les dépendances** :
```bash
yarn install
```

2. **Construire le module** :
```bash
yarn build
yarn companion-module-build
```

3. **Installer le module dans Companion** :

**Option A - Installation automatique (recommandé)** :
```bash
./install.sh
```

**Option B - Installation manuelle** :

Pour un développement local, vous devez copier le dossier entier dans le répertoire des modules de Companion :

**Linux/Mac** : 
```
~/.local/share/companion-module-slider/
```

**Windows** :
```
%APPDATA%/companion-module-slider/
```

La structure finale devrait être :
```
companion-module-slider/
├── companion/
│   └── manifest.json
├── main.js
├── package.json
└── README.md
```

4. **Redémarrer Companion** pour que le module soit reconnu

## Développement

### Mode développement avec recompilation automatique

```bash
yarn dev
```

### Tests

```bash
yarn unit
```

### Linting

```bash
yarn lint
```

## Communication

### OSC

Le module envoie des commandes OSC sur le port 8000 via UDP :
- `/pan` : Valeur pan (positive = right, négative = left, 0 = stop)
- `/tilt` : Valeur tilt (positive = up, négative = down, 0 = stop)
- `/zoom` : Valeur zoom (positive = in, négative = out, 0 = stop)
- `/slide` : Valeur slide (positive = right, négative = left, 0 = stop)

Note : Le module utilise une implémentation UDP personnalisée pour éviter les problèmes avec l'OSC sender de Companion.

### HTTP

Le module interroge l'API HTTP pour obtenir le statut :
- **URL** : `http://<target_ip>/api/axes/status`
- **Méthode** : GET
- **Format de réponse** : JSON avec `pan`, `tilt`, `zoom`, `slide` (0.0 à 1.0)

Exemple de réponse :
```json
{
  "pan": 0.5,
  "tilt": 0.3,
  "zoom": 0.8,
  "slide": 0.2
}
```

Ces valeurs (0.0 à 1.0) sont automatiquement converties en -100 à 100 pour les variables Companion.

## Licence

MIT

## Support

Pour rapporter des bugs ou demander de nouvelles fonctionnalités, veuillez ouvrir une issue sur le dépôt du projet.
