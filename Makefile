# ------------------------------------------
# Readme
# first time install: make init && make up
# -d : detached mode, make logs to see logs
# --build : code changes
# --no-cache : dependancy changes
# ------------------------------------------

# Color
RED		= \033[0;91m
GREEN	= \033[0;92m
GREY	= \033[0;30m
RST		= \033[0m

COMPOSE_FILE = ./dev/docker-compose.yml
COMPOSE = docker compose -f $(COMPOSE_FILE)

init:
	@sh init.sh

help:
	@echo "$(GREEN)Commands:$(RST)"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make fe    	  - Rebuild frontend (code)"
	@echo "  make be	      - Rebuild backend (code)"
	@echo "  make fe-re       - Rebuild frontend (dependency)"
	@echo "  make be-re       - Rebuild backend (dependency)"
	@echo "  make logs        - View all logs"

up:
	@$(COMPOSE) up --build 

down: 
	@$(COMPOSE) down

stop:
	@$(COMPOSE) stop

start:
	@$(COMPOSE) start

restart:
	@$(COMPOSE) restart

logs:
	@$(COMPOSE) logs -f

ps:
	@$(COMPOSE) ps

nginx:
	@$(COMPOSE) up --build nginx

fe:
	@$(COMPOSE) up --build frontend

fe-re:
	@$(COMPOSE) up --build --no-cache frontend

be:
	@$(COMPOSE) up --build backend

be-re:
	@$(COMPOSE) up --build --no-cache backend

vm-start:
	@colima start --profile transcendence

vm-stop:
	@colima stop --profile transcendence

.PHONY: init help up down stop start restart log ps nginx fe fe-re be be-re vm-start vm-stop