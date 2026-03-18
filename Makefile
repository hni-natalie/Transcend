NAME = transcend 

# Color
RED		= \033[0;91m
GREEN	= \033[0;92m
GREY	= \033[0;30m
RST		= \033[0m

DOCKER_COMPOSE_FILE = ./docker-compose.yml

init:
	@echo "$(GREY)Creating data directories...$(RST)"
	@mkdir -p $(PWD)/dev/data/frontend
	@mkdir -p $(PWD)/dev/data/backend
	@chmod 755 $(PWD)/dev/data/frontend || true
	@chmod 755 $(PWD)/dev/data/backend || true
	@echo "$(GREY)Data directories created!$(RST)"

up:
	docker-compose up

down:
	docker-compose down