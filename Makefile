# Makefile

RUNTIME := podman # podman or docker
REGISTRY := localhost
IMAGE_NAME := poopyfeed-fe
IMAGE_TAG := latest

.PHONY: help
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Development:"
	@echo "  run                  Build dev image and start containers"
	@echo "  stop                 Stop containers"
	@echo "  logs                 Show container logs"
	@echo "  shell                Open shell in web container"
	@echo ""
	@echo "Build:"
	@echo "  build                Build the Angular app locally"
	@echo "  image-build-prod     Build production container image"
	@echo "  image-build-dev      Build development container image"
	@echo ""
	@echo "Testing:"
	@echo "  test                 Run tests in container"
	@echo "  test-local           Run tests locally"
	@echo "  test-coverage        Run tests with coverage in container"
	@echo "  test-coverage-local  Run tests with coverage locally"
	@echo ""
	@echo "Code Quality:"
	@echo "  lint                 Run linter"
	@echo "  format               Run formatter"
	@echo "  pre-commit-setup     Install and run pre-commit hooks"
	@echo ""
	@echo "Misc:"
	@echo "  install              Install npm dependencies"
	@echo "  clean                Remove node_modules, dist, and .angular"

.PHONY: pre-commit-setup
pre-commit-setup:
	@echo "Setting up pre-commit hooks..."
	@echo "consider running <pre-commit autoupdate> to get the latest versions"
	pre-commit install
	pre-commit install --install-hooks
	pre-commit run --all-files

.PHONY: image-build-prod
image-build-prod: Containerfile
	$(RUNTIME) build -t $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG) -f Containerfile --target production .

.PHONY: image-build-dev
image-build-dev: Containerfile
	$(RUNTIME) build -t $(REGISTRY)/$(IMAGE_NAME):dev -f Containerfile --target development .

.PHONY: stop
stop:
	$(RUNTIME) compose down

.PHONY: run
run: podman-compose.yaml image-build-dev
	$(RUNTIME) compose down || true
	$(RUNTIME) compose -f $< up -d

.PHONY: test
test:
	$(RUNTIME) compose exec web npm test -- --watch=false

.PHONY: test-local
test-local:
	cd poopyfeed && npm test

.PHONY: test-coverage
test-coverage:
	$(RUNTIME) compose exec web npm test -- --watch=false --coverage=true

.PHONY: test-coverage-local
test-coverage-local:
	cd poopyfeed && npm test -- --watch=false --coverage=true

.PHONY: build
build:
	cd poopyfeed && npm run build

.PHONY: lint
lint:
	cd poopyfeed && npm run lint

.PHONY: format
format:
	cd poopyfeed && npm run format || npx prettier --write .

.PHONY: logs
logs:
	sleep 2
	$(RUNTIME) compose logs

.PHONY: shell
shell:
	$(RUNTIME) compose exec web sh

.PHONY: install
install:
	cd poopyfeed && npm install

.PHONY: clean
clean:
	cd poopyfeed && rm -rf node_modules dist .angular
