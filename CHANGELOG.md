# Changelog

## [1.0.0] - 2025-11-01

### Features
- **Initial release** : Module complet pour contrôler un slider motorisé

#### Actions (16)
- **Mouvement** :
  - Pan Left / Pan Right
  - Tilt Up / Tilt Down
  - Slide Left / Slide Right
  - Zoom In / Zoom Out
  - Chaque action supporte 3 vitesses (Slow 0.1, Medium 0.5, Fast 1.0) ou config default
- **Vitesse** :
  - Set Pan/Tilt Speed
  - Set Slide Speed
  - Set Zoom Speed
- **Stop** :
  - Stop Pan / Stop Tilt / Stop Slide / Stop Zoom
  - Stop All

#### Variables (4)
- Pan / Tilt / Zoom / Slide Position
- Mapping : 0.0 → -100, 0.5 → 0, 1.0 → 100
- Mise à jour en temps réel toutes les 200ms

#### Configuration
- Target IP Address avec validation automatique de connexion
- Vitesses par défaut configurables pour chaque axe (Pan/Tilt, Slide, Zoom)

#### Communication
- OSC via UDP sur le port 8000
- HTTP polling pour le statut des axes
- Implémentation UDP personnalisée pour contourner les problèmes de l'OSC sender de Companion

### Technical
- TypeScript + Node.js 18+
- Architecture based on @companion-module/base
- CI/CD avec GitHub Actions
- Tests unitaires avec Vitest

[1.0.0]: https://github.com/Johnroo/slider_module_companion/releases/tag/v1.0.0
