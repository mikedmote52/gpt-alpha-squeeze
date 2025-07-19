// Simple and effective recommendation parser
// Fixes the broken learning loop by actually extracting recommendations from AI responses

export interface ParsedRecommendation {
  type: 'buy' | 'sell' | 'hold' | 'watch' | 'analysis';
  symbol: string;
  confidence: number;
  reasoning: string;
  context: string;
  source: string;
  price_targets?: string[];
  timeframe?: string;
}

export class RecommendationParser {
  
  // Parse AI message and extract all recommendations
  parseMessage(message: string): ParsedRecommendation[] {
    const recommendations: ParsedRecommendation[] = [];
    
    // Find all stock symbols
    const symbols = this.extractSymbols(message);
    
    for (const symbol of symbols) {
      const rec = this.analyzeSymbol(message, symbol);
      if (rec) {
        recommendations.push(rec);
      }
    }
    
    return recommendations;
  }
  
  private extractSymbols(message: string): string[] {
    const symbolMatches = message.match(/\b[A-Z]{2,5}\b/g) || [];
    return [...new Set(symbolMatches)].filter(symbol => 
      symbol.length >= 2 && symbol.length <= 5 && 
      !this.isCommonWord(symbol)
    );
  }
  
  private isCommonWord(word: string): boolean {
    const commonWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HAS', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'USE', 'MAN', 'NEW', 'NOW', 'OLD', 'SEE', 'HIM', 'TWO', 'HOW', 'ITS', 'WHO', 'OIL', 'SIT', 'SET', 'RUN', 'EAT', 'FAR', 'SEA', 'EYE', 'AGO', 'OFF', 'FAR', 'TOO', 'ANY', 'MAY', 'SAY', 'SHE', 'OWN', 'GOT', 'TOP', 'TRY', 'LET', 'PUT', 'END', 'WHY', 'BIG', 'ADD', 'BUY', 'OWN', 'WAY', 'BAD', 'WIN', 'HIT', 'CUT', 'LOT', 'BET', 'BOX', 'BAG', 'BIT', 'BOY', 'JOB', 'AGE', 'LAW', 'AIR', 'ARM', 'BAR', 'CAR', 'CAT', 'DOG', 'EGG', 'FAN', 'GUN', 'HAT', 'ICE', 'KEY', 'LEG', 'MAP', 'NET', 'PEN', 'POT', 'RAT', 'SUN', 'TAX', 'TEA', 'VAN', 'WEB', 'YES', 'YET', 'ZOO'];
    return commonWords.includes(word);
  }
  
  private analyzeSymbol(message: string, symbol: string): ParsedRecommendation | null {
    // Get context around the symbol
    const context = this.getSymbolContext(message, symbol);
    if (!context) return null;
    
    const lowerContext = context.toLowerCase();
    const lowerMessage = message.toLowerCase();
    
    // Determine recommendation type
    let type: 'buy' | 'sell' | 'hold' | 'watch' | 'analysis' = 'analysis';
    let confidence = 0.5;
    
    // Buy indicators
    if (this.containsWords(lowerContext, [
      'recommend', 'buy', 'strong', 'excellent', 'bullish', 'positive', 
      'good opportunity', 'attractive', 'compelling', 'promising', 
      'high potential', 'upside', 'target', 'like', 'love', 'favor',
      'top pick', 'strong candidate', 'squeeze candidate', 'entry point',
      'should buy', 'would buy', 'my pick', 'solid choice', 'great pick',
      'worth buying', 'strong buy', 'buy signal', 'high conviction',
      'excellent choice', 'best bet', 'standout', 'winner', 'outperform'
    ])) {
      type = 'buy';
      confidence = 0.8;
    }
    
    // Sell indicators
    else if (this.containsWords(lowerContext, [
      'sell', 'exit', 'avoid', 'bearish', 'negative', 'poor', 'bad',
      'weak', 'risky', 'dangerous', 'concerning', 'red flag', 'warning',
      'stay away', 'steer clear', 'sell signal', 'exit signal', 'dump',
      'cash out', 'take profit', 'cut losses', 'stop out', 'bail out',
      'get rid of', 'offload', 'dispose', 'liquidate', 'close position'
    ])) {
      type = 'sell';
      confidence = 0.7;
    }
    
    // Hold indicators
    else if (this.containsWords(lowerContext, [
      'hold', 'keep', 'maintain', 'neutral', 'stable', 'steady',
      'consistent', 'reliable', 'solid', 'secure', 'safe', 'stay',
      'remain', 'continue', 'retain', 'preserve', 'hang onto',
      'keep position', 'hold position', 'maintain position'
    ])) {
      type = 'hold';
      confidence = 0.6;
    }
    
    // Watch indicators
    else if (this.containsWords(lowerContext, [
      'watch', 'monitor', 'track', 'observe', 'follow', 'keep eye on',
      'keep tabs', 'potential', 'interesting', 'worth watching',
      'worth monitoring', 'worth noting', 'worth considering',
      'worth looking at', 'on my radar', 'watching closely',
      'keeping an eye on', 'potential opportunity', 'emerging'
    ])) {
      type = 'watch';
      confidence = 0.6;
    }
    
    // Boost confidence for strong language
    if (this.containsWords(lowerContext, [
      'strongly', 'highly', 'extremely', 'very', 'absolutely',
      'definitely', 'certainly', 'clearly', 'obviously', 'excellent',
      'outstanding', 'exceptional', 'remarkable', 'fantastic', 'amazing'
    ])) {
      confidence = Math.min(0.95, confidence + 0.15);
    }
    
    // Extract reasoning
    const reasoning = this.extractReasoning(message, symbol);
    
    // Extract price targets
    const priceTargets = this.extractPriceTargets(context);
    
    // Extract timeframe
    const timeframe = this.extractTimeframe(context);
    
    return {
      type,
      symbol,
      confidence,
      reasoning,
      context: context.trim(),
      source: 'ai_chat',
      price_targets: priceTargets,
      timeframe: timeframe || undefined
    };
  }
  
  private getSymbolContext(message: string, symbol: string): string {
    // Get 150 characters before and after the symbol
    const regex = new RegExp(`(.{0,150})\\b${symbol}\\b(.{0,150})`, 'gi');
    const match = message.match(regex);
    return match ? match[0] : '';
  }
  
  private containsWords(text: string, words: string[]): boolean {
    return words.some(word => text.includes(word));
  }
  
  private extractReasoning(message: string, symbol: string): string {
    // Find sentences containing the symbol
    const sentences = message.split(/[.!?]+/);
    const relevantSentences = sentences.filter(s => 
      s.toLowerCase().includes(symbol.toLowerCase())
    );
    
    if (relevantSentences.length > 0) {
      return relevantSentences[0].trim();
    }
    
    return `Analysis of ${symbol} based on market conditions and squeeze potential`;
  }
  
  private extractPriceTargets(context: string): string[] {
    const targets = [];
    const priceRegex = /\$(\d+(?:\.\d{1,2})?)/g;
    const percentRegex = /(\d+(?:\.\d{1,2})?%)/g;
    
    const priceMatches = context.match(priceRegex);
    const percentMatches = context.match(percentRegex);
    
    if (priceMatches) targets.push(...priceMatches);
    if (percentMatches) targets.push(...percentMatches);
    
    return targets;
  }
  
  private extractTimeframe(context: string): string | null {
    const timeframes = [
      'short-term', 'long-term', 'near-term', 'immediate',
      'day', 'week', 'month', 'quarter', 'year',
      'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    ];
    
    const lowerContext = context.toLowerCase();
    
    for (const timeframe of timeframes) {
      if (lowerContext.includes(timeframe)) {
        return timeframe;
      }
    }
    
    return null;
  }
}