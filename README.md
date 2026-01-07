# up-to-grade

Projeto Vite + TypeScript + Phaser com backend Go simples.

## Requisitos

- Node.js (recomendado LTS)
- Go 1.25+

## Desenvolvimento

Abra dois terminais:

1. Backend Go

```bash
npm run dev:go
```

2. Frontend Vite

```bash
npm run dev
```

Acesse: http://localhost:5173

As chamadas para `/api` serão proxyadas para `http://localhost:8080`.

## Produção (build + servidor Go servindo estáticos)

```bash
npm run build
npm run serve:go
```

Acesse: http://localhost:8080

## Observações

- O áudio `assets/audio/base_beat.mp3` é opcional. Se ausente, o jogo roda sem som.
- A função de salvar progresso envia POST para `/api/save` com `{ username, xp, level }`.

## Makefile

- `make dev-all`: sobe Go (hot-reload) + Vite e abre o navegador
- `make build`: builda o frontend (dist/)
- `make serve-go`: sobe o backend Go servindo `dist/`
- `make tidy` / `make vet` / `make fmt`: utilidades Go
- `make backend-build`: compila o backend

## CI

Pipeline em [.github/workflows/ci.yml](.github/workflows/ci.yml) para buildar frontend e backend em PRs e pushes.

## Publicando no GitHub

Criar repositório e enviar (ajuste o nome do seu usuário/remote):

```bash
git init
git add -A
git commit -m "chore: bootstrap up-to-grade"
git branch -M main
git remote add origin git@github.com:<seu-usuario>/up-to-grade.git
git push -u origin main
```
