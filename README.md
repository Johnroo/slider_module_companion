# Companion Module - Slider Motorized

Module Companion pour contrôler un slider motorisé avec capacités pan/tilt/zoom via OSC et HTTP.

## Fonctionnalités

Ce module permet de contrôler un slider motorisé avec :
- **Actions Joystick** : Pan, Tilt, Zoom, Slide
- **Variables** : Suivi en temps réel des positions (0-100%)
- **Communication** : OSC pour les commandes, HTTP pour le statut

## Actions disponibles

1. **Joystick Pan** : Contrôle le mouvement pan (-1.0 à 1.0)
2. **Joystick Tilt** : Contrôle le mouvement tilt (-1.0 à 1.0)
3. **Joystick Zoom** : Contrôle le zoom (-1.0 à 1.0)
4. **Joystick Slide** : Contrôle le mouvement du slider (-1.0 à 1.0)

## Variables disponibles

- `pan` : Position Pan en %
- `tilt` : Position Tilt en %
- `zoom` : Position Zoom en %
- `slide` : Position Slide en %

Les variables sont mises à jour automatiquement toutes les 200ms via une API HTTP.

## Configuration

### Champs de configuration

- **Target IP Address** : L'adresse IP de l'appareil slider (requis)

Format attendu : IPv4 valide (ex: 192.168.1.100)

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
├── assets/
│   ├── manifest.json
│   └── manifest.schema.json
├── dist/
│   └── module/
│       └── index.js
├── generated/
│   └── manifest.d.ts
├── lib/
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

Le module envoie des commandes OSC sur le port 8000 :
- `/pan` : Valeur pan (-1.0 à 1.0)
- `/tilt` : Valeur tilt (-1.0 à 1.0)
- `/zoom` : Valeur zoom (-1.0 à 1.0)
- `/slide` : Valeur slide (-1.0 à 1.0)

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

## Licence

MIT

## Support

Pour rapporter des bugs ou demander de nouvelles fonctionnalités, veuillez ouvrir une issue sur le dépôt du projet.
