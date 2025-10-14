K6 Load/Stress/Spike Tests

Como rodar com Docker (isolado dos testes unitários/integrados/E2E)

1) Serviços dedicados por cenário (recomendado)

Cada cenário tem um serviço próprio e grava relatórios em pasta específica.

- Load-mix:
  docker compose --env-file .env.k6.server -f docker-compose.k6.yml up --build --abort-on-container-exit --exit-code-from k6-load-mix k6-load-mix

- Smoke:
  docker compose --env-file .env.k6.server -f docker-compose.k6.yml up --build --abort-on-container-exit --exit-code-from k6-smoke k6-smoke

- Spike:
  docker compose --env-file .env.k6.server -f docker-compose.k6.yml up --build --abort-on-container-exit --exit-code-from k6-spike k6-spike

- Stress:
  docker compose --env-file .env.k6.server -f docker-compose.k6.yml up --build --abort-on-container-exit --exit-code-from k6-stress k6-stress

- Read-heavy:
  docker compose --env-file .env.k6.server -f docker-compose.k6.yml up --build --abort-on-container-exit --exit-code-from k6-read-heavy k6-read-heavy

- Write-heavy:
  docker compose --env-file .env.k6.server -f docker-compose.k6.yml up --build --abort-on-container-exit --exit-code-from k6-write-heavy k6-write-heavy

- Volume (constante taxa de chegada, crescimento de dados):
  docker compose --env-file .env.k6.server -f docker-compose.k6.yml up --build --abort-on-container-exit --exit-code-from k6-volume k6-volume

2) Serviço genérico k6-load (manual)

O serviço k6-load está em profile manual e não sobe por padrão. Útil para executar um script arbitrário via K6_SCRIPT.

- Executar com o padrão (load-mix.js):
  docker compose --profile manual --env-file .env.k6.server -f docker-compose.k6.yml up --build --abort-on-container-exit --exit-code-from k6-load k6-load

- Executar escolhendo o script (ex.: spike.js) em PowerShell:
  $env:K6_SCRIPT='spike.js'; docker compose --profile manual --env-file .env.k6.server -f docker-compose.k6.yml up --build --abort-on-container-exit --exit-code-from k6-load k6-load
  Remove-Item Env:K6_SCRIPT

3) Relatórios

- Serviços dedicados: salvos em server/tests/k6/results/<cenario>/
  - JSON padrão: summary.json
  - Arquivos do handleSummary: <script-base>.summary.json | .txt | .html

- Serviço genérico (manual): salvos em server/tests/k6/results/
  - JSON padrão: summary.json
  - Arquivos do handleSummary: <script-base>.summary.json | .txt | .html

4) Rodar k6 localmente (com API já rodando)

  k6 run server/tests/k6/load-mix.js -e API_BASE_URL=http://localhost:3000 --summary-export=server/tests/k6/results/summary.json

Observações

- Esses testes são isolados dos jobs de CI e não executam na pipeline por padrão.
- Ajuste thresholds, estágios e mix de operações conforme seus SLOs.
