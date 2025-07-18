#!/usr/bin/env bash
# do not exit on non-2xx, always complete
# set -e
function run_curl() {
  echo "→ Testing $1"
  shift
  http_status=$(curl -s -o /dev/null -w "%{http_code}" "$@" || true)
  echo "HTTP $http_status"
}
git pull origin squeeze-alpha-backend
npm install
npm run dev &
PID=$!; sleep 5
run_curl "GET /api/alpaca/positions" http://localhost:3000/api/alpaca/positions
run_curl "POST /api/alpaca/order" "http://localhost:3000/api/alpaca/order" -d '{"symbol":"AAPL","qty":1,"side":"buy"}'
run_curl "POST /api/alpaca/optimize" "http://localhost:3000/api/alpaca/optimize"
run_curl "POST /api/chat" "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"tickers":["LIXT"]}'
kill $PID

# always succeed
exit 0