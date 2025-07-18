#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Initialize performance database
function initializeDatabase() {
  const dbPath = path.join(process.cwd(), 'performance.db');
  const schemaPath = path.join(process.cwd(), 'lib', 'performance', 'schema.sql');
  
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found:', schemaPath);
    process.exit(1);
  }

  const schema = fs.readFileSync(schemaPath, 'utf8');
  const db = new sqlite3.Database(dbPath);
  
  db.exec(schema, (err) => {
    if (err) {
      console.error('❌ Database initialization failed:', err);
      process.exit(1);
    } else {
      console.log('✅ Performance database initialized successfully');
      console.log('📊 Database location:', dbPath);
    }
    
    db.close();
  });
}

// Validate performance directory structure
function validateStructure() {
  const requiredFiles = [
    'lib/performance/schema.sql',
    'lib/performance/database.ts',
    'lib/performance/tradeLogger.ts',
    'lib/performance/returnCalculator.ts',
    'lib/performance/riskMetrics.ts',
    'lib/performance/alphaTest.ts',
    'lib/performance/alertSystem.ts',
    'lib/performance/index.ts'
  ];

  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(process.cwd(), file))
  );

  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }

  console.log('✅ All performance validation files are present');
}

// Create sample data for testing
function createSampleData() {
  const dbPath = path.join(process.cwd(), 'performance.db');
  const db = new sqlite3.Database(dbPath);
  
  // Insert sample performance data for the last 30 days
  const today = new Date();
  const sampleData = [];
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const baseValue = 100000; // $100k starting value
    const growth = Math.pow(1.638, i / 30.44) - 1; // 63.8% monthly growth
    const noise = (Math.random() - 0.5) * 0.02; // ±1% daily noise
    const portfolioValue = baseValue * (1 + growth + noise);
    
    sampleData.push({
      date: date.toISOString().split('T')[0],
      portfolio_value: portfolioValue,
      daily_return: i === 30 ? 0 : (Math.random() - 0.45) * 0.05, // Slight positive bias
      cumulative_return: growth + noise,
      benchmark_return: 0.638 * (i / 30.44),
      excess_return: (growth + noise) - (0.638 * (i / 30.44))
    });
  }
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO performance_metrics 
    (date, portfolio_value, daily_return, cumulative_return, benchmark_return, excess_return)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  sampleData.forEach(row => {
    stmt.run([
      row.date,
      row.portfolio_value,
      row.daily_return,
      row.cumulative_return,
      row.benchmark_return,
      row.excess_return
    ]);
  });
  
  stmt.finalize();
  
  console.log('✅ Sample performance data created (30 days)');
  console.log('📈 You can now test the performance dashboard');
  
  db.close();
}

// Main execution
console.log('🚀 Initializing Performance Validation System...\n');

validateStructure();
initializeDatabase();
createSampleData();

console.log('\n🎉 Performance validation system is ready!');
console.log('\nNext steps:');
console.log('1. Run: npm install');
console.log('2. Start your application: npm run dev');
console.log('3. Visit: http://localhost:3000/performance');
console.log('4. Test the system with: curl -X POST http://localhost:3000/api/performance/sync');
console.log('\n📊 The system will now track and validate your trading performance against the 63.8% monthly baseline.');