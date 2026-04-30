#!/bin/bash
echo "🌿 Starting EcoManage – Waste to Value Management System"
echo ""

# Start backend
echo "📦 Installing backend dependencies..."
cd backend && npm install
cp .env.example .env
echo "🚀 Starting backend on port 5000..."
node seed.js 2>/dev/null || true
npm run dev &
BACKEND_PID=$!

# Start frontend
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install
echo "🌐 Starting frontend on port 5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ EcoManage is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Demo logins:"
echo "   Admin:   admin@eco.gov / admin123"
echo "   Citizen: citizen@test.com / test123"
echo ""
echo "Press Ctrl+C to stop all services."
wait $BACKEND_PID $FRONTEND_PID
