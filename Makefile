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

up-b:
	@docker compose -f $(COMPOSE_FILE) up --build

log:
	@docker compose -f $(COMPOSE_FILE) logs -f

down:
	@docker compose -f $(COMPOSE_FILE) down

stop:
	@docker compose -f $(COMPOSE_FILE) stop

start:
	@docker compose -f $(COMPOSE_FILE) start

restart:
	@docker compose -f $(COMPOSE_FILE) restart


nginx:
	@docker compose -f $(COMPOSE_FILE) up --build nginx

redis:
	@docker compose -f $(COMPOSE_FILE) up --build redis

livekit:
	@docker compose -f $(COMPOSE_FILE) up --build livekit

t:
	@docker compose -f $(COMPOSE_FILE) run --rm --entrypoint /bin/sh backend

fe:
	@docker compose -f $(COMPOSE_FILE) up --build frontend

be:
	@docker compose -f $(COMPOSE_FILE) up --build backend



.PHONY: all init up down