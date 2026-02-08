# Makefile

RUNTIME := podman # podman or docker

.PHONY: pre-commit-setup
pre-commit-setup:
	@echo "Setting up pre-commit hooks..."
	@echo "consider running <pre-commit autoupdate> to get the latest versions"
	pre-commit install
	pre-commit install --install-hooks
	pre-commit run --all-files

.PHONY: image-build
image-build: Containerfile
	$(RUNTIME) build -t poopyfeed-frontend -f Containerfile --target development .

.PHONY: image-build-prod
image-build-prod: Containerfile
	$(RUNTIME) build -t poopyfeed-frontend:prod -f Containerfile --target production .

.PHONY: stop
stop:
	$(RUNTIME) compose down

.PHONY: run
run: podman-compose.yaml image-build
	$(RUNTIME) compose down || true
	$(RUNTIME) compose -f $< up -d

.PHONY: test
test:
	$(RUNTIME) compose exec web npm test

.PHONY: test-local
test-local:
	cd poopyfeed && npm test

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
