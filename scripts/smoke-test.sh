#!/usr/bin/env bash
set -e
echo "Pulling latest branch…"
git pull origin squeeze-alpha-backend
echo "Installing deps…"
npm install
echo "Starting server…"
npm run dev &
PID=$!
sleep 5
echo "✔ Testing /api/alpaca/positions"
curl --fail http://localhost:3000/api/alpaca/positions
echo "✔ Testing /api/alpaca/order"
curl --fail -X POST http://localhost:3000/api/alpaca/order \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","qty":0,"side":"buy","type":"market","time_in_force":"day"}'
echo "✔ Testing /api/alpaca/optimize"
curl --fail -X POST http://localhost:3000/api/alpaca/optimize
echo "✔ Testing /api/chat"
curl --fail -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"watchlist":["LIXT"],"messages":[{"role":"user","content":"Analyze LIXT"}]}'
echo "All smoke tests passed."
kill $PID