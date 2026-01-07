.PHONY: help install dev dev-go dev-go-watch dev-all build preview serve-go fmt vet tidy clean backend-build

FRONTEND_DIR := .
BACKEND_DIR := server

help:
	@echo "Targets:"
	@echo "  install         - Instala dependências do frontend"
	@echo "  dev             - Sobe Vite (frontend)"
	@echo "  dev-go          - Sobe Go (backend)"
	@echo "  dev-go-watch    - Sobe Go com hot-reload (Air)"
	@echo "  dev-all         - Sobe Go+Vite com health-check e abre navegador"
	@echo "  build           - Build do frontend (Vite)"
	@echo "  preview         - Preview do build (Vite)"
	@echo "  serve-go        - Sobe Go servindo dist/"
	@echo "  fmt             - Formata código Go"
	@echo "  vet             - go vet no backend"
	@echo "  tidy            - go mod tidy no backend"
	@echo "  backend-build   - Compila o backend"
	@echo "  clean           - Remove artefatos (dist, tmp)"

install:
	npm ci

dev:
	npm run dev

dev-go:
	npm run dev:go

dev-go-watch:
	npm run dev:go:watch

dev-all:
	npm run dev:all

build:
	npm run build

preview:
	npm run preview

serve-go:
	npm run serve:go

fmt:
	cd $(BACKEND_DIR) && go fmt ./...

vet:
	cd $(BACKEND_DIR) && go vet ./...

tidy:
	cd $(BACKEND_DIR) && go mod tidy

backend-build:
	cd $(BACKEND_DIR) && go build ./...

clean:
	rm -rf dist $(BACKEND_DIR)/tmp
