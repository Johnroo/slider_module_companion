#!/bin/bash
# Script d'installation pour installer le module Companion dans le répertoire approprié

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Récupérer le nom du module depuis package.json
if [ -f "package.json" ]; then
    MODULE_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "companion-module-slider")
else
    MODULE_NAME="companion-module-slider"
fi

echo -e "${GREEN}=== Installation du module: $MODULE_NAME ===${NC}"
echo ""

# Déterminer le répertoire d'installation en fonction du système
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    # Linux ou macOS
    INSTALL_DIR="$HOME/.local/share/$MODULE_NAME"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    INSTALL_DIR="$APPDATA/$MODULE_NAME"
else
    echo -e "${RED}Erreur: Système d'exploitation non supporté${NC}"
    exit 1
fi

echo -e "${YELLOW}Répertoire d'installation: ${INSTALL_DIR}${NC}"
echo ""

# Vérifier que le build a été fait
if [ ! -d "pkg" ]; then
    echo -e "${RED}Erreur: Le dossier 'pkg' n'existe pas. Veuillez d'abord exécuter 'yarn build && yarn companion-module-build'${NC}"
    exit 1
fi

if [ ! -f "pkg/main.js" ]; then
    echo -e "${RED}Erreur: Le fichier 'pkg/main.js' n'existe pas. Veuillez d'abord exécuter 'yarn companion-module-build'${NC}"
    exit 1
fi

if [ ! -f "pkg/companion/manifest.json" ]; then
    echo -e "${RED}Erreur: Le fichier 'pkg/companion/manifest.json' n'existe pas. Veuillez d'abord exécuter 'yarn companion-module-build'${NC}"
    exit 1
fi

# Supprimer l'ancienne installation si elle existe
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Suppression de l'ancienne installation...${NC}"
    rm -rf "$INSTALL_DIR"
fi

# Créer le répertoire d'installation
mkdir -p "$INSTALL_DIR"

# Copier les fichiers nécessaires depuis pkg/
echo "Copie des fichiers..."
cp -r pkg/* "$INSTALL_DIR/"
cp README.md "$INSTALL_DIR/" 2>/dev/null || true

echo ""
echo -e "${GREEN}✓ Module installé avec succès dans: ${INSTALL_DIR}${NC}"
echo ""
echo -e "${YELLOW}Prochaines étapes:${NC}"
echo "1. Redémarrer Companion pour que le module soit reconnu"
echo "2. Ajouter une nouvelle instance du module dans Companion"
echo ""
echo -e "${GREEN}Installation terminée !${NC}"

