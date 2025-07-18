#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Initialize learning system databases
function initializeLearningDatabases() {
  const learningDbPath = path.join(process.cwd(), 'ai_memory.db');
  const performanceDbPath = path.join(process.cwd(), 'performance.db');
  
  // Initialize learning schema
  const learningSchemaPath = path.join(process.cwd(), 'lib', 'learning', 'schema.sql');
  
  if (!fs.existsSync(learningSchemaPath)) {
    console.error('❌ Learning schema file not found:', learningSchemaPath);
    process.exit(1);
  }

  const learningSchema = fs.readFileSync(learningSchemaPath, 'utf8');
  const learningDb = new sqlite3.Database(learningDbPath);
  
  learningDb.exec(learningSchema, (err) => {
    if (err) {
      console.error('❌ Learning database initialization failed:', err);
      process.exit(1);
    } else {
      console.log('✅ Learning database initialized successfully');
      console.log('🧠 AI Memory database location:', learningDbPath);
    }
    
    learningDb.close();
  });

  // Initialize performance database if it doesn't exist
  if (!fs.existsSync(performanceDbPath)) {
    const performanceSchemaPath = path.join(process.cwd(), 'lib', 'performance', 'schema.sql');
    
    if (fs.existsSync(performanceSchemaPath)) {
      const performanceSchema = fs.readFileSync(performanceSchemaPath, 'utf8');
      const performanceDb = new sqlite3.Database(performanceDbPath);
      
      performanceDb.exec(performanceSchema, (err) => {
        if (err) {
          console.error('❌ Performance database initialization failed:', err);
        } else {
          console.log('✅ Performance database initialized successfully');
          console.log('📊 Performance database location:', performanceDbPath);
        }
        
        performanceDb.close();
      });
    }
  }
}

// Validate learning system structure
function validateLearningStructure() {
  const requiredFiles = [
    'lib/learning/schema.sql',
    'lib/learning/memorySystem.ts',
    'lib/learning/recommendationTracker.ts',
    'lib/learning/adaptiveScoring.ts',
    'lib/learning/patternRecognition.ts',
    'lib/learning/strategyOptimizer.ts',
    'lib/learning/index.ts'
  ];

  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(process.cwd(), file))
  );

  if (missingFiles.length > 0) {
    console.error('❌ Missing required learning system files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }

  console.log('✅ All learning system files are present');
}

// Create sample learning data for testing
function createSampleLearningData() {
  const learningDbPath = path.join(process.cwd(), 'ai_memory.db');
  const db = new sqlite3.Database(learningDbPath);
  
  // Insert sample conversation data
  const sampleConversations = [
    {
      session_id: 'sample_session_1',
      message_type: 'user',
      message_content: 'What do you think about my portfolio?',
      timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      session_id: 'sample_session_1',
      message_type: 'assistant',
      message_content: 'Based on your current holdings, I see some potential squeeze opportunities. ADTX shows moderate potential with its current metrics.',
      timestamp: new Date(Date.now() - 86400000 + 1000).toISOString()
    },
    {
      session_id: 'sample_session_2',
      message_type: 'user',
      message_content: 'Tell me about TSLA squeeze potential',
      timestamp: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
    }
  ];

  const conversationStmt = db.prepare(`
    INSERT INTO ai_conversations (session_id, message_type, message_content, timestamp)
    VALUES (?, ?, ?, ?)
  `);

  sampleConversations.forEach(conv => {
    conversationStmt.run([conv.session_id, conv.message_type, conv.message_content, conv.timestamp]);
  });

  conversationStmt.finalize();

  // Insert sample recommendations
  const sampleRecommendations = [
    {
      session_id: 'sample_session_1',
      recommendation_type: 'watch',
      symbol: 'ADTX',
      recommendation_text: 'ADTX shows moderate squeeze potential with current metrics',
      confidence_score: 0.7,
      reasoning: 'Short interest at 25% with improving volume patterns'
    },
    {
      session_id: 'sample_session_2',
      recommendation_type: 'analysis',
      symbol: 'TSLA',
      recommendation_text: 'TSLA analysis shows low squeeze probability',
      confidence_score: 0.8,
      reasoning: 'Large float and low short interest reduce squeeze potential'
    }
  ];

  const recommendationStmt = db.prepare(`
    INSERT INTO ai_recommendations 
    (session_id, recommendation_type, symbol, recommendation_text, confidence_score, reasoning)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  sampleRecommendations.forEach(rec => {
    recommendationStmt.run([
      rec.session_id, rec.recommendation_type, rec.symbol, 
      rec.recommendation_text, rec.confidence_score, rec.reasoning
    ]);
  });

  recommendationStmt.finalize();

  // Insert sample stock memory
  const sampleStockMemory = [
    {
      symbol: 'ADTX',
      times_analyzed: 3,
      total_recommendations: 2,
      successful_recommendations: 1,
      avg_recommendation_return: 0.08,
      best_return: 0.15,
      worst_return: -0.02
    },
    {
      symbol: 'TSLA',
      times_analyzed: 5,
      total_recommendations: 1,
      successful_recommendations: 0,
      avg_recommendation_return: -0.03,
      best_return: 0.05,
      worst_return: -0.12
    }
  ];

  const stockMemoryStmt = db.prepare(`
    INSERT INTO stock_memory 
    (symbol, times_analyzed, total_recommendations, successful_recommendations, 
     avg_recommendation_return, best_return, worst_return)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  sampleStockMemory.forEach(stock => {
    stockMemoryStmt.run([
      stock.symbol, stock.times_analyzed, stock.total_recommendations,
      stock.successful_recommendations, stock.avg_recommendation_return,
      stock.best_return, stock.worst_return
    ]);
  });

  stockMemoryStmt.finalize();

  console.log('✅ Sample learning data created');
  console.log('🎯 Learning system ready for AI training');
  
  db.close();
}

// Test learning system connectivity
function testLearningSystem() {
  console.log('🧪 Testing learning system connectivity...');
  
  // This would import and test the learning system
  // For now, just check if the databases exist and are accessible
  
  const learningDbPath = path.join(process.cwd(), 'ai_memory.db');
  const performanceDbPath = path.join(process.cwd(), 'performance.db');
  
  if (fs.existsSync(learningDbPath) && fs.existsSync(performanceDbPath)) {
    console.log('✅ Learning system databases are accessible');
    
    // Test database connectivity
    const db = new sqlite3.Database(learningDbPath);
    db.get("SELECT COUNT(*) as count FROM ai_conversations", (err, row) => {
      if (err) {
        console.error('❌ Database connectivity test failed:', err);
      } else {
        console.log(`✅ Database connectivity test passed: ${row.count} conversations found`);
      }
      db.close();
    });
  } else {
    console.error('❌ Learning system databases not found');
  }
}

// Main execution
console.log('🚀 Initializing AI Learning System...\n');

validateLearningStructure();
initializeLearningDatabases();

// Wait a moment for database initialization
setTimeout(() => {
  createSampleLearningData();
  testLearningSystem();
  
  console.log('\n🎉 AI Learning System is ready!');
  console.log('\nLearning System Features:');
  console.log('• 🧠 Persistent conversation memory across sessions');
  console.log('• 📊 Adaptive scoring based on historical performance');
  console.log('• 🔍 Pattern recognition for successful trade setups');
  console.log('• 📈 Recommendation tracking with outcome analysis');
  console.log('• 🔄 Strategy optimization feedback loop');
  console.log('• 💡 AI-powered learning and improvement');
  
  console.log('\nNext steps:');
  console.log('1. Start your application: npm run dev');
  console.log('2. Test the enhanced chat: The AI now remembers conversations!');
  console.log('3. Check learning status: GET /api/learning/status');
  console.log('4. Force optimization: POST /api/learning/optimize');
  console.log('\n🤖 The AI will now learn and improve from every interaction!');
}, 2000);