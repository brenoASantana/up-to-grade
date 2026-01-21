# up-to-grade

Projeto Vite + TypeScript + Phaser com backend Go simples.

## Requisitos

- Node.js (recomendado LTS)
- Go 1.25+

## Começando

### Instalar dependências

```bash
make install
```

## Desenvolvimento

### Modo desenvolvimento completo (recomendado)

Sobe o backend Go com hot-reload + frontend Vite e abre o navegador automaticamente:

```bash
make dev-all
```

Acesse: http://localhost:5173

### Componentes individuais

Se preferir, suba cada um em um terminal separado:

```bash
make dev-go-watch   # Backend Go com hot-reload (Air)
make dev            # Frontend Vite
```

As chamadas para `/api` serão proxyadas para `http://localhost:8080`.

## Build & Produção

### Build do frontend

```bash
make build
```

Gera o diretório `dist/` com os arquivos estáticos otimizados.

### Preview do build

```bash
make preview
```

### Servir em produção

```bash
make serve-go
```

Sobe o backend Go servindo os arquivos estáticos do `dist/`. Acesse: http://localhost:8080

## Utilitários Go

```bash
make fmt           # Formata código Go
make vet           # Verifica erros comuns
make tidy          # Organiza go.mod
make backend-build # Compila o backend
```

## Limpeza

```bash
make clean
```

Remove os artefatos gerados (`dist/` e `server/tmp/`).

## Ajuda

```bash
make help
```

Lista todos os comandos disponíveis.

## Observações

- O áudio `assets/audio/base_beat.mp3` é opcional. Se ausente, o jogo roda sem som.
- A função de salvar progresso envia POST para `/api/save` com `{ username, xp, level }`.

## CI/CD

Pipeline em [.github/workflows/ci.yml](.github/workflows/ci.yml) para buildar frontend e backend em PRs e pushes.
