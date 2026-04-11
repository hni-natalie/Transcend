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
nginx-d:
	@docker compose -f $(COMPOSE_FILE) down nginx

redis:
	@docker compose -f $(COMPOSE_FILE) up --build redis

livekit:
	@docker compose -f $(COMPOSE_FILE) up --build livekit

t:
# 	@docker compose -f $(COMPOSE_FILE) run --rm --entrypoint /bin/sh backend
	@docker compose -f $(COMPOSE_FILE) run --rm -p 0.0.0.0:443:443 nginx
# 	@docker compose -f "./dev/docker-compose-ddns.yml" run --rm --entrypoint /bin/sh ddns

fe:
	@docker compose -f $(COMPOSE_FILE) up --build frontend

be:
	@docker compose -f $(COMPOSE_FILE) up backend

cf:
	@docker compose -f $(COMPOSE_FILE) up --build cloudflared

ddns:
	@docker compose -f "./dev/docker-compose-ddns.yml" up --build
ddns-log:
	@docker compose -f "./dev/docker-compose-ddns.yml" logs -f

ddns-stop:
	@docker compose -f "./dev/docker-compose-ddns.yml" stop


.PHONY: all init up down