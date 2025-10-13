K6 Load/Stress/Spike Tests

Como rodar com Docker (isolado dos testes unitários/integrados/E2E):

1. Subir stack dedicada com Postgres/Redis/API + K6 (load-mix):

   docker compose --env-file .env.k6.server -f docker-compose.k6.yml \
    up --build --abort-on-container-exit --exit-code-from k6-load

2. Rodar variantes alterando o serviço (substitua o nome do serviço no compose com profiles ou edite o comando k6):
   - scripts disponíveis:
     - tests/k6/smoke.js
     - tests/k6/read-heavy.js
     - tests/k6/write-heavy.js
     - tests/k6/load-mix.js
     - tests/k6/stress.js
     - tests/k6/spike.js

3. Relatórios

- O serviço k6-load exporta automaticamente:
  - JSON: `server/tests/k6/results/<script>.summary.json`
  - TXT: `server/tests/k6/results/<script>.summary.txt`
  - HTML: `server/tests/k6/results/<script>.summary.html`

4. Rodar k6 localmente (com API já rodando):

   k6 run tests/k6/load-mix.js -e API_BASE_URL=http://localhost:3000 --summary-export=results/summary.json

Observações

- Esses testes são isolados dos jobs de CI (unit/integration/E2E) e não executam na pipeline por padrão.
- Ajuste thresholds, estágios e mix de operações conforme seus SLOs.
