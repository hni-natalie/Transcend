NAME = transcend 

# Color
RED		= \033[0;91m
GREEN	= \033[0;92m
GREY	= \033[0;30m
RST		= \033[0m

COMPOSE_FILE = ./dev/docker-compose.yml

init:
	@echo "$(GREY)Creating data directories...$(RST)"
	@if [ ! -d "$(PWD)/dev/data/frontend" ]; then \
		mkdir -p $(PWD)/dev/data/frontend; \
		chmod 755 $(PWD)/dev/data/frontend; \
	fi
	
	@if [ ! -d "$(PWD)/dev/data/backend" ]; then \
		mkdir -p $(PWD)/dev/data/backend \
		chmod 755 $(PWD)/dev/data/backend; \
	fi
	@echo "$(GREY)Data directories created!$(RST)"

up:
	@docker-compose -f $(COMPOSE_FILE) up -d

down:
	@docker-compose -f $(COMPOSE_FILE) down

.PHONY: all init up down