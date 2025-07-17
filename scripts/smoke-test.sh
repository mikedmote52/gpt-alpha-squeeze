#!/usr/bin/env bash
set -e
git pull origin squeeze-alpha-backend
npm install
npm run dev &
PID=$!; sleep 5
curl --fail http://localhost:3000/api/alpaca/positions
curl --fail -X POST http://localhost:3000/api/alpaca/order -H "Content-Type: application/json" -d '{"symbol":"AAPL","qty":0,"side":"buy","type":"market","time_in_force":"day"}'
curl --fail -X POST http://localhost:3000/api/alpaca/optimize
curl --fail -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"watchlist":["LIXT"],"messages":[{"role":"user","content":"Analyze LIXT"}]}'
kill $PID