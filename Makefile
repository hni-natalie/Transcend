NAME = transcend 

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

fe: 
	@docker compose -f $(COMPOSE_FILE) up --build frontend

stop:
	@docker compose -f $(COMPOSE_FILE) stop

down:
	@docker compose -f $(COMPOSE_FILE) down


.PHONY: all init up down