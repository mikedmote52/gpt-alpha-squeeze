#!/bin/bash

echo "🔒 System Backup v1.0-stable Verification"
echo "========================================"

# Check git tag
echo -n "✅ Git tag v1.0-stable exists: "
if git tag -l | grep -q "v1.0-stable"; then
    echo "YES"
else
    echo "NO - Create with: git tag -a v1.0-stable -m 'Stable version'"
fi

# Check databases
echo -n "✅ AI Memory database: "
if [ -f "ai_memory.db" ]; then
    echo "EXISTS ($(stat -f%z ai_memory.db 2>/dev/null || stat --format=%s ai_memory.db) bytes)"
else
    echo "MISSING"
fi

echo -n "✅ Performance database: "
if [ -f "performance.db" ]; then
    echo "EXISTS ($(stat -f%z performance.db 2>/dev/null || stat --format=%s performance.db) bytes)"
else
    echo "MISSING"
fi

# Check backup directory
echo -n "✅ Database backups: "
if [ -d "backups/v1.0-stable" ]; then
    echo "EXISTS"
    ls -la backups/v1.0-stable/
else
    echo "MISSING - Create with: mkdir -p backups/v1.0-stable && cp *.db backups/v1.0-stable/"
fi

# Check environment
echo -n "✅ Environment file: "
if [ -f ".env.local" ]; then
    echo "EXISTS"
else
    echo "MISSING - Copy .env.local.example to .env.local and configure"
fi

# Check documentation
echo -n "✅ Backup documentation: "
if [ -f "SYSTEM_BACKUP_V1.0.md" ]; then
    echo "EXISTS"
else
    echo "MISSING"
fi

echo ""
echo "🎯 To restore this system:"
echo "1. git clone repo && git checkout v1.0-stable"
echo "2. npm install"
echo "3. Copy backed up .db files to project root"
echo "4. Configure .env.local with API keys"
echo "5. npm run dev"
echo ""
echo "📖 See SYSTEM_BACKUP_V1.0.md for complete instructions"