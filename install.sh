#!/bin/bash
# Script d'installation pour installer le module Companion dans le répertoire approprié

set -e

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Installation du module Companion Slider ===${NC}"
echo ""

# Déterminer le répertoire d'installation en fonction du système
if [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "darwin"* ]]; then
    # Linux ou macOS
    INSTALL_DIR="$HOME/.local/share/companion-module-slider"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    INSTALL_DIR="$APPDATA/companion-module-slider"
else
    echo -e "${RED}Erreur: Système d'exploitation non supporté${NC}"
    exit 1
fi

echo -e "${YELLOW}Répertoire d'installation: ${INSTALL_DIR}${NC}"
echo ""

# Vérifier que le build a été fait
if [ ! -d "dist" ]; then
    echo -e "${RED}Erreur: Le dossier 'dist' n'existe pas. Veuillez d'abord exécuter 'yarn build'${NC}"
    exit 1
fi

if [ ! -f "dist/module/index.js" ]; then
    echo -e "${RED}Erreur: Le fichier 'dist/module/index.js' n'existe pas. Veuillez d'abord exécuter 'yarn build'${NC}"
    exit 1
fi

# Supprimer l'ancienne installation si elle existe
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Suppression de l'ancienne installation...${NC}"
    rm -rf "$INSTALL_DIR"
fi

# Créer le répertoire d'installation
mkdir -p "$INSTALL_DIR"

# Copier les fichiers nécessaires
echo "Copie des fichiers..."
cp -r assets "$INSTALL_DIR/"
cp -r dist "$INSTALL_DIR/"
cp -r generated "$INSTALL_DIR/"
cp -r lib "$INSTALL_DIR/"
cp package.json "$INSTALL_DIR/"
cp README.md "$INSTALL_DIR/"

echo ""
echo -e "${GREEN}✓ Module installé avec succès dans: ${INSTALL_DIR}${NC}"
echo ""
echo -e "${YELLOW}Prochaines étapes:${NC}"
echo "1. Redémarrer Companion pour que le module soit reconnu"
echo "2. Ajouter une nouvelle instance 'Slider Motorized' dans Companion"
echo "3. Configurer l'adresse IP de votre appareil slider"
echo ""
echo -e "${GREEN}Installation terminée !${NC}"

