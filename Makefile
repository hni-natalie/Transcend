# ------------------------------------------
# Readme
# first time install: make init && make up
# ------------------------------------------

# Color
RED		= \033[0;91m
GREEN	= \033[0;92m
GREY	= \033[0;30m
RST		= \033[0m

COMPOSE_FILE = ./dev/docker-compose.yml

init:
	@sh init.sh

up:
	@docker compose -f $(COMPOSE_FILE) up 

down: 
	@docker compose -f $(COMPOSE_FILE) down

stop:
	@docker compose -f $(COMPOSE_FILE) stop

start:
	@docker compose -f $(COMPOSE_FILE) start

restart:
	@docker compose -f $(COMPOSE_FILE) restart


nginx:
	@docker compose -f $(COMPOSE_FILE) up nginx

fe:
	@docker compose -f $(COMPOSE_FILE) up --build frontend




.PHONY: all init up down