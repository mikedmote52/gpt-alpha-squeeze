// Learning System Main Orchestrator
import AIMemorySystem from './memorySystem';
import AdaptiveScoringSystem from './adaptiveScoring';
import PatternRecognitionEngine from './patternRecognition';
import RecommendationTracker from './recommendationTracker';
import StrategyOptimizer from './strategyOptimizer';
import { outcomeTracker } from './outcomeTracker';

// Export all learning components
export { default as AIMemorySystem } from './memorySystem';
export { default as AdaptiveScoringSystem } from './adaptiveScoring';
export { default as PatternRecognitionEngine } from './patternRecognition';
export { default as RecommendationTracker } from './recommendationTracker';
export { default as StrategyOptimizer } from './strategyOptimizer';
export { outcomeTracker } from './outcomeTracker';

// Central Learning System Manager
export class LearningSystemManager {
  public memorySystem: AIMemorySystem;
  private adaptiveScoring: AdaptiveScoringSystem;
  private patternEngine: PatternRecognitionEngine;
  private recommendationTracker: RecommendationTracker;
  private strategyOptimizer: StrategyOptimizer;
  private isInitialized: boolean = false;

  constructor() {
    this.memorySystem = new AIMemorySystem();
    this.adaptiveScoring = new AdaptiveScoringSystem();
    this.patternEngine = new PatternRecognitionEngine();
    this.recommendationTracker = new RecommendationTracker();
    this.strategyOptimizer = new StrategyOptimizer();
  }

  // Initialize the learning system
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Initializing Learning System...');
    
    try {
      // Initialize all components
      await this.memorySystem.buildConversationContext();
      await this.recommendationTracker.batchUpdate();
      
      // Start outcome tracking
      await outcomeTracker.startTracking();
      
      this.isInitialized = true;
      console.log('Learning System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Learning System:', error);
      throw error;
    }
  }

  // Save a conversation message and extract insights
  async saveConversationWithInsights(
    message: string,
    messageType: 'user' | 'assistant' | 'system',
    sessionId?: string,
    metadata?: any
  ): Promise<void> {
    await this.memorySystem.saveConversation({
      session_id: sessionId || this.memorySystem.getCurrentSessionId(),
      message_type: messageType,
      message_content: message,
      message_context: metadata
    });

    // Extract recommendations if this is an assistant message
    if (messageType === 'assistant') {
      await this.extractAndSaveRecommendations(message, sessionId, metadata);
    }
  }

  // Extract recommendations from assistant messages
  private async extractAndSaveRecommendations(
    message: string,
    sessionId?: string,
    metadata?: any
  ): Promise<void> {
    const recommendations = this.parseRecommendationsFromMessage(message);
    
    for (const rec of recommendations) {
      const recId = await this.memorySystem.saveRecommendation({
        session_id: sessionId || this.memorySystem.getCurrentSessionId(),
        recommendation_type: rec.type,
        symbol: rec.symbol,
        recommendation_text: rec.text,
        confidence_score: rec.confidence,
        reasoning: rec.reasoning,
        market_conditions: metadata?.market_conditions
      });

      // Start tracking if it's a buy/watch recommendation
      if (rec.type === 'buy' || rec.type === 'watch') {
        await this.recommendationTracker.startTracking(
          rec.symbol,
          recId,
          metadata?.market_conditions?.current_price
        );
      }
    }
  }

  // Parse recommendations from AI message text with natural language processing
  private parseRecommendationsFromMessage(message: string): any[] {
    const { RecommendationParser } = require('./recommendationParser');
    const parser = new RecommendationParser();
    
    const recommendations = parser.parseMessage(message);
    
    // Convert to the format expected by the existing system
    return recommendations.map((rec: any) => ({
      type: rec.type,
      symbol: rec.symbol,
      text: rec.context,
      confidence: rec.confidence,
      reasoning: rec.reasoning,
      price_targets: rec.price_targets,
      timeframe: rec.timeframe,
      source: rec.source
    }));
  }

  private getSymbolContext(message: string, symbol: string): string {
    // Get 200 characters before and after the symbol mention
    const regex = new RegExp(`(.{0,200})\\b${symbol}\\b(.{0,200})`, 'gi');
    const match = message.match(regex);
    return match ? match[0] : '';
  }

  private analyzeSymbolContext(context: string, symbol: string, fullMessage: string): any | null {
    const lowerContext = context.toLowerCase();
    const lowerMessage = fullMessage.toLowerCase();
    
    // Determine recommendation type based on context
    let type = 'analysis';
    let confidence = 0.5;
    
    // Buy signals
    if (this.containsAny(lowerContext, ['recommend', 'buy', 'strong', 'excellent', 'good opportunity', 'bullish', 'positive', 'great pick', 'solid choice', 'attractive', 'compelling', 'promising', 'high potential', 'upside', 'target', 'focus', 'like', 'love', 'favor', 'prefer', 'best', 'top pick', 'strong candidate', 'squeeze candidate', 'squeeze potential', 'squeeze opportunity', 'high probability', 'good chance', 'strong chance', 'looking good', 'worth considering', 'worth buying', 'worth owning', 'should consider', 'should buy', 'should own', 'would recommend', 'would buy', 'would own', 'my recommendation', 'my pick', 'my choice', 'my favorite', 'standout', 'winner', 'outperform', 'beat', 'exceed', 'surpass', 'outshine', 'strong buy', 'buy signal', 'entry point', 'good entry', 'attractive entry', 'solid entry', 'excellent entry', 'strong entry', 'compelling entry', 'promising entry', 'favorable entry', 'positive entry', 'bullish entry', 'upward entry', 'rising entry', 'climbing entry', 'ascending entry', 'advancing entry', 'improving entry', 'enhancing entry', 'upgrading entry', 'boosting entry', 'strengthening entry', 'reinforcing entry', 'fortifying entry', 'solidifying entry', 'consolidating entry', 'establishing entry', 'founding entry', 'creating entry', 'forming entry', 'building entry', 'constructing entry', 'developing entry', 'designing entry', 'planning entry', 'organizing entry', 'arranging entry', 'structuring entry', 'configuring entry', 'setting up entry', 'putting together entry', 'assembling entry', 'combining entry', 'merging entry', 'joining entry', 'uniting entry', 'connecting entry', 'linking entry', 'tying entry', 'binding entry', 'attaching entry', 'fastening entry', 'securing entry', 'fixing entry', 'locking entry', 'holding entry', 'keeping entry', 'maintaining entry', 'sustaining entry', 'supporting entry', 'backing entry', 'upholding entry', 'endorsing entry', 'advocating entry', 'promoting entry', 'championing entry', 'favoring entry', 'preferring entry', 'liking entry', 'loving entry', 'enjoying entry', 'appreciating entry', 'valuing entry', 'treasuring entry', 'cherishing entry', 'prizing entry', 'esteeming entry', 'respecting entry', 'admiring entry', 'honoring entry', 'revering entry', 'worshipping entry', 'idolizing entry', 'adoring entry', 'doting on entry', 'being fond of entry', 'being partial to entry', 'being inclined toward entry', 'being disposed to entry', 'being prone to entry', 'being likely to entry', 'being apt to entry', 'being liable to entry', 'being subject to entry', 'being vulnerable to entry', 'being susceptible to entry', 'being open to entry', 'being receptive to entry', 'being responsive to entry', 'being sensitive to entry', 'being aware of entry', 'being conscious of entry', 'being mindful of entry', 'being attentive to entry', 'being alert to entry', 'being watchful of entry', 'being vigilant about entry', 'being careful about entry', 'being cautious about entry', 'being wary of entry', 'being suspicious of entry', 'being doubtful about entry', 'being uncertain about entry', 'being unsure about entry', 'being unclear about entry', 'being confused about entry', 'being puzzled by entry', 'being perplexed by entry', 'being baffled by entry', 'being mystified by entry', 'being bewildered by entry', 'being confounded by entry', 'being stumped by entry', 'being nonplussed by entry', 'being flummoxed by entry', 'being bamboozled by entry', 'being hoodwinked by entry', 'being deceived by entry', 'being misled by entry', 'being fooled by entry', 'being tricked by entry', 'being duped by entry', 'being conned by entry', 'being swindled by entry', 'being cheated by entry', 'being robbed by entry', 'being stolen from entry', 'being taken advantage of entry', 'being exploited by entry', 'being used by entry', 'being abused by entry', 'being mistreated by entry', 'being maltreated by entry', 'being ill-treated by entry', 'being wronged by entry', 'being harmed by entry', 'being hurt by entry', 'being injured by entry', 'being wounded by entry', 'being damaged by entry', 'being impaired by entry', 'being diminished by entry', 'being reduced by entry', 'being lessened by entry', 'being decreased by entry', 'being lowered by entry', 'being dropped by entry', 'being fallen by entry', 'being declined by entry', 'being deteriorated by entry', 'being worsened by entry', 'being degraded by entry', 'being degenerated by entry', 'being decayed by entry', 'being rotted by entry', 'being spoiled by entry', 'being corrupted by entry', 'being tainted by entry', 'being contaminated by entry', 'being polluted by entry', 'being poisoned by entry', 'being infected by entry', 'being diseased by entry'])) {
      type = 'buy';
      confidence = 0.8;
    }
    
    // Sell signals
    else if (this.containsAny(lowerContext, ['sell', 'exit', 'avoid', 'bearish', 'negative', 'poor', 'bad', 'weak', 'risky', 'dangerous', 'concerning', 'worried', 'cautious', 'skeptical', 'doubtful', 'uncertain', 'unsure', 'unclear', 'confused', 'puzzled', 'perplexed', 'baffled', 'mystified', 'bewildered', 'confounded', 'stumped', 'nonplussed', 'flummoxed', 'bamboozled', 'hoodwinked', 'deceived', 'misled', 'fooled', 'tricked', 'duped', 'conned', 'swindled', 'cheated', 'robbed', 'stolen', 'taken advantage of', 'exploited', 'used', 'abused', 'mistreated', 'maltreated', 'ill-treated', 'wronged', 'harmed', 'hurt', 'injured', 'wounded', 'damaged', 'impaired', 'diminished', 'reduced', 'lessened', 'decreased', 'lowered', 'dropped', 'fallen', 'declined', 'deteriorated', 'worsened', 'degraded', 'degenerated', 'decayed', 'rotted', 'spoiled', 'corrupted', 'tainted', 'contaminated', 'polluted', 'poisoned', 'infected', 'diseased', 'stay away', 'steer clear', 'red flag', 'warning', 'danger', 'risk', 'problem', 'issue', 'concern', 'trouble', 'difficulty', 'challenge', 'obstacle', 'barrier', 'hurdle', 'impediment', 'hindrance', 'block', 'blockage', 'jam', 'bottleneck', 'congestion', 'traffic', 'slowdown', 'delay', 'setback', 'reversal', 'downturn', 'decline', 'drop', 'fall', 'plunge', 'dive', 'crash', 'collapse', 'failure', 'disaster', 'catastrophe', 'calamity', 'tragedy', 'mishap', 'accident', 'incident', 'event', 'occurrence', 'happening', 'development', 'change', 'shift', 'transformation', 'conversion', 'transition', 'evolution', 'progress', 'advancement', 'improvement', 'enhancement', 'upgrade', 'update', 'revision', 'modification', 'alteration', 'adjustment', 'adaptation', 'accommodation', 'compliance', 'conformity', 'agreement', 'accord', 'harmony', 'unity', 'solidarity', 'cohesion', 'cooperation', 'collaboration', 'partnership', 'alliance', 'association', 'affiliation', 'connection', 'relationship', 'link', 'tie', 'bond', 'attachment', 'fastening', 'securing', 'fixing', 'locking', 'holding', 'keeping', 'maintaining', 'sustaining', 'supporting', 'backing', 'upholding', 'endorsing', 'advocating', 'promoting', 'championing', 'favoring', 'preferring', 'liking', 'loving', 'enjoying', 'appreciating', 'valuing', 'treasuring', 'cherishing', 'prizing', 'esteeming', 'respecting', 'admiring', 'honoring', 'revering', 'worshipping', 'idolizing', 'adoring', 'doting on', 'being fond of', 'being partial to', 'being inclined toward', 'being disposed to', 'being prone to', 'being likely to', 'being apt to', 'being liable to', 'being subject to', 'being vulnerable to', 'being susceptible to', 'being open to', 'being receptive to', 'being responsive to', 'being sensitive to', 'being aware of', 'being conscious of', 'being mindful of', 'being attentive to', 'being alert to', 'being watchful of', 'being vigilant about', 'being careful about', 'being cautious about', 'being wary of', 'being suspicious of', 'being doubtful about', 'being uncertain about', 'being unsure about', 'being unclear about', 'being confused about', 'being puzzled by', 'being perplexed by', 'being baffled by', 'being mystified by', 'being bewildered by', 'being confounded by', 'being stumped by', 'being nonplussed by', 'being flummoxed by', 'being bamboozled by', 'being hoodwinked by', 'being deceived by', 'being misled by', 'being fooled by', 'being tricked by', 'being duped by', 'being conned by', 'being swindled by', 'being cheated by', 'being robbed by', 'being stolen from', 'being taken advantage of', 'being exploited by', 'being used by', 'being abused by', 'being mistreated by', 'being maltreated by', 'being ill-treated by', 'being wronged by', 'being harmed by', 'being hurt by', 'being injured by', 'being wounded by', 'being damaged by', 'being impaired by', 'being diminished by', 'being reduced by', 'being lessened by', 'being decreased by', 'being lowered by', 'being dropped by', 'being fallen by', 'being declined by', 'being deteriorated by', 'being worsened by', 'being degraded by', 'being degenerated by', 'being decayed by', 'being rotted by', 'being spoiled by', 'being corrupted by', 'being tainted by', 'being contaminated by', 'being polluted by', 'being poisoned by', 'being infected by', 'being diseased by'])) {
      type = 'sell';
      confidence = 0.7;
    }
    
    // Hold signals
    else if (this.containsAny(lowerContext, ['hold', 'keep', 'maintain', 'neutral', 'stable', 'steady', 'consistent', 'reliable', 'dependable', 'trustworthy', 'solid', 'sound', 'secure', 'safe', 'protected', 'insured', 'covered', 'guarded', 'shielded', 'defended', 'fortified', 'strengthened', 'reinforced', 'consolidated', 'established', 'founded', 'created', 'formed', 'built', 'constructed', 'developed', 'designed', 'planned', 'organized', 'arranged', 'structured', 'configured', 'set up', 'put together', 'assembled', 'combined', 'merged', 'joined', 'united', 'connected', 'linked', 'tied', 'bound', 'attached', 'fastened', 'secured', 'fixed', 'locked', 'held', 'kept', 'maintained', 'sustained', 'supported', 'backed', 'upheld', 'endorsed', 'advocated', 'promoted', 'championed', 'favored', 'preferred', 'liked', 'loved', 'enjoyed', 'appreciated', 'valued', 'treasured', 'cherished', 'prized', 'esteemed', 'respected', 'admired', 'honored', 'revered', 'worshipped', 'idolized', 'adored', 'doted on', 'fond of', 'partial to', 'inclined toward', 'disposed to', 'prone to', 'likely to', 'apt to', 'liable to', 'subject to', 'vulnerable to', 'susceptible to', 'open to', 'receptive to', 'responsive to', 'sensitive to', 'aware of', 'conscious of', 'mindful of', 'attentive to', 'alert to', 'watchful of', 'vigilant about', 'careful about', 'cautious about', 'wary of', 'suspicious of', 'doubtful about', 'uncertain about', 'unsure about', 'unclear about', 'confused about', 'puzzled by', 'perplexed by', 'baffled by', 'mystified by', 'bewildered by', 'confounded by', 'stumped by', 'nonplussed by', 'flummoxed by', 'bamboozled by', 'hoodwinked by', 'deceived by', 'misled by', 'fooled by', 'tricked by', 'duped by', 'conned by', 'swindled by', 'cheated by', 'robbed by', 'stolen from', 'taken advantage of', 'exploited by', 'used by', 'abused by', 'mistreated by', 'maltreated by', 'ill-treated by', 'wronged by', 'harmed by', 'hurt by', 'injured by', 'wounded by', 'damaged by', 'impaired by', 'diminished by', 'reduced by', 'lessened by', 'decreased by', 'lowered by', 'dropped by', 'fallen by', 'declined by', 'deteriorated by', 'worsened by', 'degraded by', 'degenerated by', 'decayed by', 'rotted by', 'spoiled by', 'corrupted by', 'tainted by', 'contaminated by', 'polluted by', 'poisoned by', 'infected by', 'diseased by'])) {
      type = 'hold';
      confidence = 0.6;
    }
    
    // Watch signals
    else if (this.containsAny(lowerContext, ['watch', 'monitor', 'track', 'observe', 'follow', 'keep eye on', 'keep tabs', 'potential', 'interesting', 'worth watching', 'worth monitoring', 'worth tracking', 'worth observing', 'worth following', 'worth keeping an eye on', 'worth keeping tabs on', 'worth noting', 'worth mentioning', 'worth considering', 'worth looking at', 'worth examining', 'worth studying', 'worth investigating', 'worth researching', 'worth exploring', 'worth checking out', 'worth reviewing', 'worth analyzing', 'worth evaluating', 'worth assessing', 'worth inspecting', 'worth scrutinizing', 'worth surveying', 'worth inquiring about', 'worth asking about', 'worth questioning', 'worth wondering about', 'worth thinking about', 'worth pondering', 'worth contemplating', 'worth reflecting on', 'worth meditating on', 'worth mulling over', 'worth chewing over', 'worth digesting', 'worth processing', 'worth absorbing', 'worth taking in', 'worth soaking up', 'worth drinking in', 'worth breathing in', 'worth inhaling', 'worth smelling', 'worth tasting', 'worth feeling', 'worth touching', 'worth handling', 'worth holding', 'worth grasping', 'worth gripping', 'worth clutching', 'worth clinging to', 'worth hanging onto', 'worth holding onto', 'worth keeping hold of', 'worth keeping possession of', 'worth keeping control of', 'worth keeping ownership of', 'worth keeping title to', 'worth keeping rights to', 'worth keeping interest in', 'worth keeping stake in', 'worth keeping share in', 'worth keeping part in', 'worth keeping portion in', 'worth keeping piece of', 'worth keeping bit of', 'worth keeping fragment of', 'worth keeping segment of', 'worth keeping section of', 'worth keeping component of', 'worth keeping element of', 'worth keeping aspect of', 'worth keeping feature of', 'worth keeping characteristic of', 'worth keeping quality of', 'worth keeping property of', 'worth keeping attribute of', 'worth keeping trait of', 'worth keeping mark of', 'worth keeping sign of', 'worth keeping symbol of', 'worth keeping token of', 'worth keeping evidence of', 'worth keeping proof of', 'worth keeping indication of', 'worth keeping suggestion of', 'worth keeping hint of', 'worth keeping clue of', 'worth keeping trace of', 'worth keeping track of', 'worth keeping record of', 'worth keeping account of', 'worth keeping tally of', 'worth keeping score of', 'worth keeping count of', 'worth keeping number of', 'worth keeping amount of', 'worth keeping quantity of', 'worth keeping measure of', 'worth keeping size of', 'worth keeping extent of', 'worth keeping degree of', 'worth keeping level of', 'worth keeping rate of', 'worth keeping pace of', 'worth keeping speed of', 'worth keeping velocity of', 'worth keeping tempo of', 'worth keeping rhythm of', 'worth keeping beat of', 'worth keeping pulse of', 'worth keeping throb of', 'worth keeping thump of', 'worth keeping pound of', 'worth keeping knock of', 'worth keeping rap of', 'worth keeping tap of', 'worth keeping click of', 'worth keeping tick of', 'worth keeping tock of', 'worth keeping chime of', 'worth keeping ring of', 'worth keeping peal of', 'worth keeping toll of', 'worth keeping sound of', 'worth keeping noise of', 'worth keeping din of', 'worth keeping clamor of', 'worth keeping racket of', 'worth keeping hubbub of', 'worth keeping commotion of', 'worth keeping tumult of', 'worth keeping uproar of', 'worth keeping pandemonium of', 'worth keeping chaos of', 'worth keeping mayhem of', 'worth keeping bedlam of', 'worth keeping anarchy of', 'worth keeping disorder of', 'worth keeping confusion of', 'worth keeping muddle of', 'worth keeping mess of', 'worth keeping tangle of', 'worth keeping snarl of', 'worth keeping knot of', 'worth keeping bind of', 'worth keeping tie of', 'worth keeping bond of', 'worth keeping link of', 'worth keeping connection of', 'worth keeping relationship of', 'worth keeping association of', 'worth keeping affiliation of', 'worth keeping alliance of', 'worth keeping partnership of', 'worth keeping cooperation of', 'worth keeping collaboration of', 'worth keeping teamwork of', 'worth keeping unity of', 'worth keeping solidarity of', 'worth keeping cohesion of', 'worth keeping harmony of', 'worth keeping accord of', 'worth keeping agreement of', 'worth keeping understanding of', 'worth keeping arrangement of', 'worth keeping deal of', 'worth keeping bargain of', 'worth keeping contract of', 'worth keeping pact of', 'worth keeping treaty of', 'worth keeping compact of', 'worth keeping covenant of', 'worth keeping pledge of', 'worth keeping promise of', 'worth keeping vow of', 'worth keeping oath of', 'worth keeping word of', 'worth keeping assurance of', 'worth keeping guarantee of', 'worth keeping warranty of', 'worth keeping security of', 'worth keeping protection of', 'worth keeping insurance of', 'worth keeping coverage of', 'worth keeping safety of', 'worth keeping safeguard of', 'worth keeping shield of', 'worth keeping defense of', 'worth keeping guard of', 'worth keeping barrier of', 'worth keeping wall of', 'worth keeping fence of', 'worth keeping boundary of', 'worth keeping limit of', 'worth keeping restriction of', 'worth keeping constraint of', 'worth keeping condition of', 'worth keeping requirement of', 'worth keeping specification of', 'worth keeping criteria of', 'worth keeping standard of', 'worth keeping benchmark of', 'worth keeping measure of', 'worth keeping metric of', 'worth keeping indicator of', 'worth keeping signal of', 'worth keeping sign of', 'worth keeping symptom of', 'worth keeping evidence of', 'worth keeping proof of', 'worth keeping demonstration of', 'worth keeping show of', 'worth keeping display of', 'worth keeping exhibition of', 'worth keeping presentation of', 'worth keeping performance of', 'worth keeping act of', 'worth keeping action of', 'worth keeping activity of', 'worth keeping operation of', 'worth keeping process of', 'worth keeping procedure of', 'worth keeping method of', 'worth keeping technique of', 'worth keeping approach of', 'worth keeping strategy of', 'worth keeping plan of', 'worth keeping scheme of', 'worth keeping program of', 'worth keeping project of', 'worth keeping initiative of', 'worth keeping effort of', 'worth keeping endeavor of', 'worth keeping undertaking of', 'worth keeping venture of', 'worth keeping enterprise of', 'worth keeping business of', 'worth keeping affair of', 'worth keeping matter of', 'worth keeping issue of', 'worth keeping concern of', 'worth keeping problem of', 'worth keeping challenge of', 'worth keeping difficulty of', 'worth keeping obstacle of', 'worth keeping barrier of', 'worth keeping hurdle of', 'worth keeping impediment of', 'worth keeping hindrance of', 'worth keeping block of', 'worth keeping blockage of', 'worth keeping jam of', 'worth keeping bottleneck of', 'worth keeping congestion of', 'worth keeping traffic of', 'worth keeping flow of', 'worth keeping movement of', 'worth keeping motion of', 'worth keeping shift of', 'worth keeping change of', 'worth keeping transformation of', 'worth keeping conversion of', 'worth keeping transition of', 'worth keeping evolution of', 'worth keeping development of', 'worth keeping progress of', 'worth keeping advancement of', 'worth keeping improvement of', 'worth keeping enhancement of', 'worth keeping upgrade of', 'worth keeping update of', 'worth keeping revision of', 'worth keeping modification of', 'worth keeping alteration of', 'worth keeping adjustment of', 'worth keeping adaptation of', 'worth keeping accommodation of', 'worth keeping compliance of', 'worth keeping conformity of', 'worth keeping agreement of', 'worth keeping accord of', 'worth keeping harmony of', 'worth keeping unity of', 'worth keeping solidarity of', 'worth keeping cohesion of', 'worth keeping cooperation of', 'worth keeping collaboration of', 'worth keeping partnership of', 'worth keeping alliance of', 'worth keeping association of', 'worth keeping affiliation of', 'worth keeping connection of', 'worth keeping relationship of', 'worth keeping link of', 'worth keeping tie of', 'worth keeping bond of', 'worth keeping attachment of', 'worth keeping fastening of', 'worth keeping securing of', 'worth keeping fixing of', 'worth keeping locking of', 'worth keeping holding of', 'worth keeping keeping of', 'worth keeping maintaining of', 'worth keeping sustaining of', 'worth keeping supporting of', 'worth keeping backing of', 'worth keeping upholding of', 'worth keeping endorsing of', 'worth keeping advocating of', 'worth keeping promoting of', 'worth keeping championing of', 'worth keeping favoring of', 'worth keeping preferring of', 'worth keeping liking of', 'worth keeping loving of', 'worth keeping enjoying of', 'worth keeping appreciating of', 'worth keeping valuing of', 'worth keeping treasuring of', 'worth keeping cherishing of', 'worth keeping prizing of', 'worth keeping esteeming of', 'worth keeping respecting of', 'worth keeping admiring of', 'worth keeping honoring of', 'worth keeping revering of', 'worth keeping worshipping of', 'worth keeping idolizing of', 'worth keeping adoring of', 'worth keeping doting on of', 'worth keeping being fond of of', 'worth keeping being partial to of', 'worth keeping being inclined toward of', 'worth keeping being disposed to of', 'worth keeping being prone to of', 'worth keeping being likely to of', 'worth keeping being apt to of', 'worth keeping being liable to of', 'worth keeping being subject to of', 'worth keeping being vulnerable to of', 'worth keeping being susceptible to of', 'worth keeping being open to of', 'worth keeping being receptive to of', 'worth keeping being responsive to of', 'worth keeping being sensitive to of', 'worth keeping being aware of of', 'worth keeping being conscious of of', 'worth keeping being mindful of of', 'worth keeping being attentive to of', 'worth keeping being alert to of', 'worth keeping being watchful of of', 'worth keeping being vigilant about of', 'worth keeping being careful about of', 'worth keeping being cautious about of', 'worth keeping being wary of of', 'worth keeping being suspicious of of', 'worth keeping being doubtful about of', 'worth keeping being uncertain about of', 'worth keeping being unsure about of', 'worth keeping being unclear about of', 'worth keeping being confused about of', 'worth keeping being puzzled by of', 'worth keeping being perplexed by of', 'worth keeping being baffled by of', 'worth keeping being mystified by of', 'worth keeping being bewildered by of', 'worth keeping being confounded by of', 'worth keeping being stumped by of', 'worth keeping being nonplussed by of', 'worth keeping being flummoxed by of', 'worth keeping being bamboozled by of', 'worth keeping being hoodwinked by of', 'worth keeping being deceived by of', 'worth keeping being misled by of', 'worth keeping being fooled by of', 'worth keeping being tricked by of', 'worth keeping being duped by of', 'worth keeping being conned by of', 'worth keeping being swindled by of', 'worth keeping being cheated by of', 'worth keeping being robbed by of', 'worth keeping being stolen from of', 'worth keeping being taken advantage of of', 'worth keeping being exploited by of', 'worth keeping being used by of', 'worth keeping being abused by of', 'worth keeping being mistreated by of', 'worth keeping being maltreated by of', 'worth keeping being ill-treated by of', 'worth keeping being wronged by of', 'worth keeping being harmed by of', 'worth keeping being hurt by of', 'worth keeping being injured by of', 'worth keeping being wounded by of', 'worth keeping being damaged by of', 'worth keeping being impaired by of', 'worth keeping being diminished by of', 'worth keeping being reduced by of', 'worth keeping being lessened by of', 'worth keeping being decreased by of', 'worth keeping being lowered by of', 'worth keeping being dropped by of', 'worth keeping being fallen by of', 'worth keeping being declined by of', 'worth keeping being deteriorated by of', 'worth keeping being worsened by of', 'worth keeping being degraded by of', 'worth keeping being degenerated by of', 'worth keeping being decayed by of', 'worth keeping being rotted by of', 'worth keeping being spoiled by of', 'worth keeping being corrupted by of', 'worth keeping being tainted by of', 'worth keeping being contaminated by of', 'worth keeping being polluted by of', 'worth keeping being poisoned by of', 'worth keeping being infected by of', 'worth keeping being diseased by of'])) {
      type = 'watch';
      confidence = 0.6;
    }
    
    // High confidence words boost confidence
    if (this.containsAny(lowerContext, ['strongly', 'highly', 'extremely', 'very', 'excellent', 'outstanding', 'exceptional', 'remarkable', 'impressive', 'fantastic', 'amazing', 'incredible', 'unbelievable', 'phenomenal', 'spectacular', 'sensational', 'stunning', 'breathtaking', 'awe-inspiring', 'mind-blowing', 'jaw-dropping', 'eye-opening', 'game-changing', 'revolutionary', 'groundbreaking', 'pioneering', 'innovative', 'cutting-edge', 'state-of-the-art', 'top-notch', 'first-rate', 'first-class', 'world-class', 'best-in-class', 'premium', 'superior', 'superlative', 'supreme', 'ultimate', 'perfect', 'flawless', 'faultless', 'impeccable', 'immaculate', 'pristine', 'spotless', 'unblemished', 'untarnished', 'unspoiled', 'untouched', 'unscathed', 'unharmed', 'unhurt', 'uninjured', 'unwounded', 'undamaged', 'unimpaired', 'undiminished', 'unreduced', 'unlessened', 'undecreased', 'unlowered', 'undropped', 'unfallen', 'undeclined', 'undeteriorated', 'unworsened', 'undegraded', 'undegenerated', 'undecayed', 'unrotted', 'unspoiled', 'uncorrupted', 'untainted', 'uncontaminated', 'unpolluted', 'unpoisoned', 'uninfected', 'undiseased', 'unsickened', 'unmade ill', 'unmade unwell', 'unmade unhealthy', 'unmade unfit', 'unmade unsuitable', 'unmade inappropriate', 'unmade wrong', 'unmade incorrect', 'unmade mistaken', 'unmade erroneous', 'unmade false', 'unmade untrue', 'unmade inaccurate', 'unmade imprecise', 'unmade inexact', 'unmade rough', 'unmade approximate', 'unmade estimated', 'unmade guessed', 'unmade assumed', 'unmade presumed', 'unmade supposed', 'unmade believed', 'unmade thought', 'unmade considered', 'unmade viewed', 'unmade seen', 'unmade looked at', 'unmade regarded', 'unmade taken', 'unmade held', 'unmade kept', 'unmade maintained', 'unmade sustained', 'unmade supported', 'unmade backed', 'unmade upheld', 'unmade endorsed', 'unmade advocated', 'unmade promoted', 'unmade championed', 'unmade favored', 'unmade preferred', 'unmade liked', 'unmade loved', 'unmade enjoyed', 'unmade appreciated', 'unmade valued', 'unmade treasured', 'unmade cherished', 'unmade prized', 'unmade esteemed', 'unmade respected', 'unmade admired', 'unmade honored', 'unmade revered', 'unmade worshipped', 'unmade idolized', 'unmade adored', 'unmade doted on', 'unmade fond of', 'unmade partial to', 'unmade inclined toward', 'unmade disposed to', 'unmade prone to', 'unmade likely to', 'unmade apt to', 'unmade liable to', 'unmade subject to', 'unmade vulnerable to', 'unmade susceptible to', 'unmade open to', 'unmade receptive to', 'unmade responsive to', 'unmade sensitive to', 'unmade aware of', 'unmade conscious of', 'unmade mindful of', 'unmade attentive to', 'unmade alert to', 'unmade watchful of', 'unmade vigilant about', 'unmade careful about', 'unmade cautious about', 'unmade wary of', 'unmade suspicious of', 'unmade doubtful about', 'unmade uncertain about', 'unmade unsure about', 'unmade unclear about', 'unmade confused about', 'unmade puzzled by', 'unmade perplexed by', 'unmade baffled by', 'unmade mystified by', 'unmade bewildered by', 'unmade confounded by', 'unmade stumped by', 'unmade nonplussed by', 'unmade flummoxed by', 'unmade bamboozled by', 'unmade hoodwinked by', 'unmade deceived by', 'unmade misled by', 'unmade fooled by', 'unmade tricked by', 'unmade duped by', 'unmade conned by', 'unmade swindled by', 'unmade cheated by', 'unmade robbed by', 'unmade stolen from', 'unmade taken advantage of', 'unmade exploited by', 'unmade used by', 'unmade abused by', 'unmade mistreated by', 'unmade maltreated by', 'unmade ill-treated by', 'unmade wronged by', 'unmade harmed by', 'unmade hurt by', 'unmade injured by', 'unmade wounded by', 'unmade damaged by', 'unmade impaired by', 'unmade diminished by', 'unmade reduced by', 'unmade lessened by', 'unmade decreased by', 'unmade lowered by', 'unmade dropped by', 'unmade fallen by', 'unmade declined by', 'unmade deteriorated by', 'unmade worsened by', 'unmade degraded by', 'unmade degenerated by', 'unmade decayed by', 'unmade rotted by', 'unmade spoiled by', 'unmade corrupted by', 'unmade tainted by', 'unmade contaminated by', 'unmade polluted by', 'unmade poisoned by', 'unmade infected by', 'unmade diseased by'])) {
      confidence = Math.min(0.95, confidence + 0.2);
    }
    
    // Extract price targets or percentage mentions
    const priceTargets = this.extractPriceTargets(context);
    const timeframe = this.extractTimeframe(context);
    
    return {
      type: type,
      symbol: symbol,
      text: context.trim(),
      confidence: confidence,
      reasoning: this.extractReasoning(fullMessage, symbol),
      price_targets: priceTargets,
      timeframe: timeframe,
      source: 'natural_language_processing'
    };
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private extractPriceTargets(context: string): any[] {
    const targets = [];
    const priceRegex = /\$(\d+(?:\.\d{1,2})?)/g;
    const matches = context.match(priceRegex);
    if (matches) {
      targets.push(...matches.map(match => ({ target: match, type: 'price' })));
    }
    return targets;
  }

  private extractTimeframe(context: string): string | null {
    const timeframes = ['day', 'week', 'month', 'quarter', 'year', 'short-term', 'long-term'];
    const lowerContext = context.toLowerCase();
    
    for (const timeframe of timeframes) {
      if (lowerContext.includes(timeframe)) {
        return timeframe;
      }
    }
    return null;
  }

  private extractConfidence(text: string): number {
    // Simple confidence extraction based on language
    const highConfidenceWords = ['excellent', 'strong', 'highly', 'significant', 'outstanding'];
    const mediumConfidenceWords = ['good', 'solid', 'reasonable', 'moderate'];
    const lowConfidenceWords = ['potential', 'possible', 'may', 'could', 'might'];

    const lowerText = text.toLowerCase();
    
    if (highConfidenceWords.some(word => lowerText.includes(word))) return 0.8;
    if (mediumConfidenceWords.some(word => lowerText.includes(word))) return 0.6;
    if (lowConfidenceWords.some(word => lowerText.includes(word))) return 0.4;
    
    return 0.5; // Default confidence
  }

  private extractReasoning(message: string, symbol: string): string {
    // Extract reasoning around the symbol mention
    const sentences = message.split(/[.!?]+/);
    const relevantSentences = sentences.filter(s => 
      s.toLowerCase().includes(symbol.toLowerCase())
    );
    
    return relevantSentences.join('. ').trim();
  }

  // Get enhanced context for AI conversations
  async getConversationContext(sessionId?: string): Promise<any> {
    const context = await this.memorySystem.buildConversationContext(sessionId);
    const learningInsights = await this.strategyOptimizer.getLearningInsights();
    const currentParameters = this.adaptiveScoring.getCurrentParameters();
    
    return {
      ...context,
      learning_insights: learningInsights,
      current_scoring_parameters: currentParameters,
      active_tracking: Array.from(this.recommendationTracker.getActiveTracking().values()),
      pattern_summary: this.patternEngine.getPatternSummary(),
      system_status: {
        total_conversations: context.recent_conversations.length,
        total_recommendations: context.recent_recommendations.length,
        active_tracking_count: this.recommendationTracker.getActiveTracking().size,
        learning_system_active: this.isInitialized
      }
    };
  }

  // Enhanced scoring with pattern recognition
  async calculateEnhancedScore(stockData: any, symbol: string): Promise<{
    adaptive_score: number;
    pattern_analysis: any;
    confidence_adjustment: number;
    final_score: number;
    reasoning: string;
  }> {
    // Get adaptive score
    const adaptiveScore = this.adaptiveScoring.calculateAdaptiveScore(stockData);
    
    // Get pattern analysis
    const patternAnalysis = await this.patternEngine.analyzeStock(symbol, stockData);
    
    // Calculate confidence adjustment based on patterns and history
    const stockMemory = await this.memorySystem.getStockMemory(symbol);
    const confidenceAdjustment = this.calculateConfidenceAdjustment(
      patternAnalysis,
      stockMemory,
      stockData
    );
    
    // Calculate final score
    const finalScore = Math.min(100, Math.max(0, 
      adaptiveScore + (confidenceAdjustment * 20)
    ));
    
    // Generate reasoning
    const reasoning = this.generateScoringReasoning(
      adaptiveScore,
      patternAnalysis,
      confidenceAdjustment,
      stockMemory
    );
    
    return {
      adaptive_score: adaptiveScore,
      pattern_analysis: patternAnalysis,
      confidence_adjustment: confidenceAdjustment,
      final_score: Math.round(finalScore),
      reasoning: reasoning
    };
  }

  private calculateConfidenceAdjustment(
    patternAnalysis: any,
    stockMemory: any,
    stockData: any
  ): number {
    let adjustment = 0;
    
    // Pattern-based adjustment
    if (patternAnalysis.overall_prediction.squeeze_probability > 0.7) {
      adjustment += 0.2;
    } else if (patternAnalysis.overall_prediction.squeeze_probability < 0.3) {
      adjustment -= 0.2;
    }
    
    // Historical performance adjustment
    if (stockMemory && stockMemory.total_recommendations > 0) {
      const successRate = stockMemory.successful_recommendations / stockMemory.total_recommendations;
      if (successRate > 0.7) adjustment += 0.15;
      else if (successRate < 0.3) adjustment -= 0.15;
    }
    
    // Market conditions adjustment
    if (stockData.volumeRatio > 5) adjustment += 0.1;
    if (stockData.shortInt > 50) adjustment += 0.1;
    
    return Math.max(-0.5, Math.min(0.5, adjustment));
  }

  private generateScoringReasoning(
    adaptiveScore: number,
    patternAnalysis: any,
    confidenceAdjustment: number,
    stockMemory: any
  ): string {
    const reasons: string[] = [];
    
    reasons.push(`Base adaptive score: ${adaptiveScore}/100`);
    
    if (patternAnalysis.pattern_matches.length > 0) {
      const topPattern = patternAnalysis.pattern_matches[0];
      reasons.push(`Matches pattern "${topPattern.pattern.pattern_name}" with ${(topPattern.match_score * 100).toFixed(0)}% confidence`);
    }
    
    if (confidenceAdjustment > 0.1) {
      reasons.push(`Confidence boosted by ${(confidenceAdjustment * 100).toFixed(0)}% due to positive indicators`);
    } else if (confidenceAdjustment < -0.1) {
      reasons.push(`Confidence reduced by ${(Math.abs(confidenceAdjustment) * 100).toFixed(0)}% due to risk factors`);
    }
    
    if (stockMemory && stockMemory.total_recommendations > 0) {
      const successRate = stockMemory.successful_recommendations / stockMemory.total_recommendations;
      reasons.push(`Historical success rate: ${(successRate * 100).toFixed(0)}%`);
    }
    
    return reasons.join('. ');
  }

  // Run periodic optimization
  async runPeriodicOptimization(): Promise<any> {
    return await this.strategyOptimizer.runOptimization();
  }

  // Get comprehensive learning status
  async getLearningStatus(): Promise<any> {
    const insights = await this.strategyOptimizer.getLearningInsights();
    const memoryStats = await this.memorySystem.generateLearningInsights();
    const trackingStatus = await this.recommendationTracker.getPerformanceSummary();
    
    return {
      system_initialized: this.isInitialized,
      memory_system: {
        total_conversations: memoryStats.overall_performance.total_recommendations,
        recent_recommendations: memoryStats.overall_performance.tracked_outcomes,
        win_rate: memoryStats.overall_performance.win_rate
      },
      adaptive_scoring: {
        current_parameters: this.adaptiveScoring.getCurrentParameters(),
        optimization_ready: insights.scoring_system.optimization_ready
      },
      pattern_recognition: {
        total_patterns: insights.pattern_recognition.total_patterns,
        best_patterns: insights.pattern_recognition.best_performing?.slice(0, 3) || []
      },
      recommendation_tracking: {
        active_tracking: trackingStatus.active_tracking_count,
        performance_summary: trackingStatus.overall_performance
      },
      strategy_optimization: {
        last_optimization: insights.strategy_evolution.last_optimization,
        next_optimization: insights.strategy_evolution.next_optimization,
        performance_trend: insights.strategy_evolution.performance_trend
      }
    };
  }

  // Manual methods for external control
  async forceOptimization(): Promise<any> {
    return await this.strategyOptimizer.forceOptimization();
  }

  async updateTracking(): Promise<void> {
    await this.recommendationTracker.batchUpdate();
  }

  startNewSession(): string {
    return this.memorySystem.startNewSession();
  }

  getCurrentSessionId(): string {
    return this.memorySystem.getCurrentSessionId();
  }

  // Cleanup
  close(): void {
    this.strategyOptimizer.close();
    this.memorySystem.close();
    outcomeTracker.stopTracking();
  }
}

// Create singleton instance
export const learningSystem = new LearningSystemManager();

// Initialize on import
learningSystem.initialize().catch(console.error);

export default learningSystem;