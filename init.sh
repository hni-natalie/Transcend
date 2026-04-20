#!/bin/sh

# Colors
GREY='\033[90m'
RST='\033[0m'

echo "${GREY}Creating data directories...${RST}"

if [ ! -d "$PWD/dev/data/frontend" ]; then
    mkdir -p "$PWD/dev/data/frontend"
    chmod 755 "$PWD/dev/data/frontend"
fi

if [ ! -d "$PWD/dev/data/backend" ]; then
    mkdir -p "$PWD/dev/data/backend"
    chmod 755 "$PWD/dev/data/backend"
fi

echo "${GREY}Data directories created!${RST}"

echo "${GREY}Copying .env.example ...${RST}"
printf "This will copy .env.example to .env. Continue? (y/n): "
read -r REPLY
if [ "$REPLY" = "y" ] || [ "$REPLY" = "Y" ]; then
    cp ./dev/.env.example ./dev/.env
else
    echo "${GREY}.env not copied.${RST}"
fi

echo "${GREY}Copying secrets.example ...${RST}"
printf "This will copy secrets.example to secrets, Continue? (y/n): "
read -r REPLY
if [ "$REPLY" = "y" ] || [ "$REPLY" = "Y" ]; then
    cp -r ./dev/secrets.example ./dev/secrets
else
    echo "${GREY}secrets not copied.${RST}"
fi

echo "${GREY}Initialization completed!${RST}"