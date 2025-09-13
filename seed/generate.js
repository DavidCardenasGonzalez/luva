// Generate 100 cards and 5 stories
// Run: node generate.js
const { writeFileSync } = require('node:fs');

const phrasals = [
  ['set up', ['install', 'configure', 'arrange'], ['Separable: set it up', "Similar to 'install'"], ['I\'ll set up the projector', 'She set up a meeting'], ['B2','tech','separable']],
  ['carry on', ['continue', 'keep doing'], ['Often after interruption'], ['Carry on with your work'], ['B1+','fluency']],
  ['come across', ['find by chance', 'encounter'], ['Often with problems or info'], ['I came across an old photo'], ['B2','storytelling']],
  ['figure out', ['understand', 'solve'], ['Often with problems'], ['We need to figure this out'], ['B2','problem-solving']],
  ['run into', ['meet unexpectedly', 'encounter'], ['People or problems'], ['I ran into an old friend'], ['B2','social']],
  ['pick up', ['learn', 'collect'], ['Separable: pick it up'], ['She picked up Spanish quickly'], ['B2','learning','separable']],
  ['turn down', ['reject', 'refuse'], ['Separable: turn it down'], ['He turned down the offer'], ['B2','work','separable']],
  ['bring up', ['mention', 'raise'], ['Separable: bring it up'], ['She brought up an important point'], ['B2','meeting','separable']],
  ['go over', ['review'], ['Often before exam or meeting'], ['Let\'s go over the plan'], ['B1+','prep']],
  ['look into', ['investigate', 'check'], ['Formal-ish'], ['We\'ll look into the issue'], ['B2','work']],
  ['put off', ['postpone', 'delay'], ['Separable: put it off'], ['Don\'t put it off again'], ['B2','time','separable']],
  ['take over', ['assume control', 'replace'], ['Often in work contexts'], ['She took over as manager'], ['B2','work']],
  ['back up', ['support', 'make a copy'], ['Separable'], ['Back up your files'], ['B2','tech','separable']],
  ['break down', ['stop working', 'analyze'], ['Machine or problem'], ['Let\'s break it down'], ['B2','analysis']],
  ['call off', ['cancel'], ['Separable: call it off'], ['They called off the meeting'], ['B1+','work','separable']],
  ['come up with', ['invent', 'create'], ['Idea/solution'], ['She came up with a plan'], ['B2','creativity']],
  ['cut down on', ['reduce'], ['Often with consumption'], ['Cut down on sugar'], ['B1+','health']],
  ['drop by', ['visit briefly'], ['Informal'], ['Drop by my office'], ['B2','social']],
  ['fill out', ['complete a form'], ['Separable'], ['Fill out this form'], ['B1+','service','separable']],
  ['get along with', ['have a good relationship'], ['People'], ['I get along with my team'], ['B2','work']],
  ['get by', ['manage', 'survive'], ['Limited resources'], ['We can get by on this'], ['B2','life']],
  ['give up', ['stop trying', 'quit'], ['Separable'], ['Don\'t give up'], ['B1+','motivation','separable']],
  ['hand in', ['submit'], ['Separable'], ['Hand in your report'], ['B1+','work','separable']],
  ['keep up with', ['stay informed', 'maintain pace'], ['Trends, workload'], ['Keep up with changes'], ['B2','work']],
  ['look after', ['take care of'], ['People or things'], ['Look after the kids'], ['B1+','life']],
  ['look forward to', ['anticipate with pleasure'], ['Followed by -ing'], ['I look forward to meeting you'], ['B2','politeness']],
  ['make up for', ['compensate'], ['Often for mistakes'], ['Make up for the delay'], ['B2','service']],
  ['put up with', ['tolerate'], ['Negative experiences'], ['I can\'t put up with noise'], ['B2','complaints']],
  ['reach out', ['contact'], ['Offer help or request'], ['Reach out if you need help'], ['B2','support']],
  ['sort out', ['resolve', 'organize'], ['Problems/tasks'], ['We\'ll sort it out'], ['B2','work']],
  ['take up', ['start a hobby', 'occupy'], ['Time/space meanings'], ['Take up running'], ['B2','lifestyle']],
  ['turn up', ['arrive', 'increase volume'], ['Context dependent'], ['Turn up the volume'], ['B1+','everyday']],
  ['work out', ['exercise', 'solve'], ['Ambiguous meanings'], ['It will work out'], ['B1+','health','problem-solving']],
  ['bring about', ['cause'], ['Formal-ish'], ['Change brought about by...'], ['B2','formal']],
  ['cut off', ['disconnect', 'interrupt'], ['Separable'], ['We got cut off'], ['B1+','phone','separable']],
  ['fall through', ['fail to happen'], ['Plans/arrangements'], ['The deal fell through'], ['B2','work']],
  ['hold on', ['wait'], ['Phone/situations'], ['Hold on a second'], ['B1+','service']],
  ['lay off', ['dismiss staff'], ['Work context'], ['They laid off 50 people'], ['B2','work']],
  ['point out', ['indicate', 'highlight'], ['Separable'], ['She pointed out the risk'], ['B2','meeting','separable']],
  ['set off', ['start a journey', 'trigger'], ['Context dependent'], ['We set off at 7'], ['B2','travel']],
  ['step up', ['increase effort', 'take charge'], ['Work/team'], ['We need to step up'], ['B2','work']],
  ['take on', ['accept (work)', 'confront'], ['Work/challenges'], ['Take on new tasks'], ['B2','work']],
  ['wind down', ['relax', 'close gradually'], ['After work/business'], ['Time to wind down'], ['B2','health','work']],
  ['zero in on', ['focus on'], ['AmE often'], ['Zero in on the cause'], ['B2','analysis']]
];

const structures = [
  ['Inversion (never)', "Reformulate: 'I had never seen such a view'", ['Never had I seen such a view'], ['Use inversion after negative adverbials'], ['B2','grammar']],
  ['Inversion (rarely)', "Reformulate: 'I rarely feel so relaxed'", ['Rarely do I feel so relaxed'], ['Aux before subject'], ['B2','grammar']],
  ['Cleft (it-cleft)', "Emphasize: 'John broke the vase'", ["It was John who broke the vase"], ['Use it + be + relative clause'], ['B2','discourse']],
  ['Cleft (wh-cleft)', "Paraphrase: 'What I need is time'", ["What I need is time"], ['Focus with what-clause'], ['B2','discourse']],
  ['Relative (non-defining)', "Combine: 'My car is old. It still runs.'", ["My car, which is old, still runs."], ['Use commas'], ['B2','relative']],
  ['Hedging (softeners)', "Soften: 'You are wrong'", ["I\'m not sure that\'s entirely accurate"], ['Use softeners for politeness'], ['B2','register']],
  ['Hedging (possibility)', "Soften: 'This will fail'", ["This might not work as expected"], ['Modals: might/may/could'], ['B2','register']],
  ['Fronting (adverbials)', "Emphasis: 'I was shocked at the news'", ["At the news was I shocked"], ['Advanced; check naturalness'], ['B2','style']],
  ['Participle clause', "Compress: 'Because he was tired, he went home'", ["Being tired, he went home"], ['Use -ing for cause'], ['B2','conciseness']],
  ['Contrastive inversion', "Reformulate: 'He had hardly sat when...'", ["Hardly had he sat down when..."], ['Use hardly/scarcely/no sooner'], ['B2','grammar']]
];

const vocab = [
  ['workplace', "Natural alternative to 'do a meeting'?", ['have a meeting','hold a meeting'], ['Collocation: have/hold a meeting'], ['B1+','workplace']],
  ['travel', "Say 'return ticket' in AmE?", ['round-trip ticket'], ['BrE: return ticket'], ['B1+','travel']],
  ['service', "Polite: 'I want water'", ["Could I get some water, please?"], ['Register: polite requests'], ['B1+','service']],
  ['health', "Phrase for mild illness at work", ['I\'m feeling under the weather'], ['Idiomatic'], ['B2','health']],
  ['finance', "Verb: 'pay in parts'", ['pay in installments'], ['Fixed expression'], ['B2','finance']],
  ['email', "Polite close for emails", ['Best regards','Kind regards'], ['Register/formality'], ['B1+','workplace']],
  ['tech', "Noun: 'unexpected software issue'", ['a glitch'], ['Casual tech term'], ['B2','tech']]
];

const makeCard = (id, type, prompt, answers, hints, examples, tags, difficulty = 'B2') => ({
  cardId: id,
  type,
  prompt,
  answers,
  hints,
  examples,
  tags,
  difficulty
});

const cards = [];

// Build ~50 phrasals
phrasals.forEach(([pv, answers, hints, examples, tags], i) => {
  cards.push(makeCard(`pv_${pv.replace(/\s+/g,'_')}_${String(i+1).padStart(3,'0')}`, 'phrasal', `What does '${pv}' mean in this context?`, answers, hints, examples, tags, 'B2'));
});

// Duplicate phrasals with context variants until ~50
let pCount = cards.filter(c=>c.type==='phrasal').length;
for (let i = 0; pCount < 50 && i < phrasals.length; i++, pCount++) {
  const [pv, answers, hints] = phrasals[i % phrasals.length];
  cards.push(makeCard(`pv_${pv.replace(/\s+/g,'_')}_${String(pCount+1).padStart(3,'0')}`, 'phrasal', `Use '${pv}' naturally in a sentence about work.`, answers, hints, ["We need to " + pv + " the system"], ['B2','production']));
}

// ~25 structures
structures.forEach(([name, prompt, answers, hints, tags], i) => {
  cards.push(makeCard(`st_${name.replace(/\W+/g,'_').toLowerCase()}_${String(i+1).padStart(3,'0')}`, 'structure', prompt, answers, hints, [answers[0]], tags, 'B2'));
});
let sCount = cards.filter(c=>c.type==='structure').length;
for (let i = 0; sCount < 25; i++, sCount++) {
  const [name, prompt, answers, hints, tags] = structures[i % structures.length];
  cards.push(makeCard(`st_${name.replace(/\W+/g,'_').toLowerCase()}_${String(sCount+1).padStart(3,'0')}`, 'structure', prompt + ' (variation)', answers, hints, [answers[0]], tags, 'B2'));
}

// ~25 vocab
vocab.forEach(([topic, prompt, answers, hints, tags], i) => {
  cards.push(makeCard(`vb_${topic}_${String(i+1).padStart(3,'0')}`, 'vocab', prompt, answers, hints, [answers[0]], tags, 'B1+'));
});
let vCount = cards.filter(c=>c.type==='vocab').length;
for (let i = 0; vCount < 25; i++, vCount++) {
  const [topic, prompt, answers, hints, tags] = vocab[i % vocab.length];
  cards.push(makeCard(`vb_${topic}_${String(vCount+1).padStart(3,'0')}`, 'vocab', prompt + ' (context: workplace)', answers, hints, [answers[0]], tags, 'B1+'));
}

// Trim/ensure 100
while (cards.length > 100) cards.pop();
while (cards.length < 100) {
  const idx = cards.length + 1;
  cards.push(makeCard(`extra_${String(idx).padStart(3,'0')}`, 'vocab', 'Choose the most natural option', ['appropriate'], ['Preference for collocations'], ['Context matters'], ['B2']));
}

// Stories (5)
const stories = [
  {
    storyId: 'restaurant_rush',
    title: 'Restaurant Rush',
    sceneOrder: [0,1,2,3,4],
    unlockCost: 50,
    tags: ['food','service']
  },
  {
    storyId: 'hotel_check_in',
    title: 'Hotel Check-in',
    sceneOrder: [0,1,2,3],
    unlockCost: 60,
    tags: ['travel','service']
  },
  {
    storyId: 'job_interview',
    title: 'Job Interview',
    sceneOrder: [0,1,2,3,4,5],
    unlockCost: 80,
    tags: ['work']
  },
  {
    storyId: 'doctors_visit',
    title: "Doctor's Visit",
    sceneOrder: [0,1,2,3],
    unlockCost: 70,
    tags: ['health']
  },
  {
    storyId: 'customer_support',
    title: 'Customer Support',
    sceneOrder: [0,1,2,3,4],
    unlockCost: 65,
    tags: ['service','tech']
  }
];

const sceneTemplates = (storyId) => ([
  { narrative: 'Set the scene', goal: 'Greet and state need', expectedIntents: ['greet','state_goal'], hints: ['Be polite'], successCriteria: ['intent_match'] },
  { narrative: 'Ask a question', goal: 'Clarify and respond', expectedIntents: ['ask','clarify'], hints: ['Use could/would'], successCriteria: ['intent_match'] },
  { narrative: 'Handle complication', goal: 'Resolve issue', expectedIntents: ['negotiate','resolve'], hints: ['Hedge politely'], successCriteria: ['intent_match'] },
  { narrative: 'Wrap up', goal: 'Close interaction', expectedIntents: ['close'], hints: ['Thank them'], successCriteria: ['intent_match'] }
].map(function(s, i) { return Object.assign({ pk: 'STORY#' + storyId, sk: 'SCENE#' + i }, s); });

const storyScenes = stories.reduce((acc, s) => {
  const base = sceneTemplates(s.storyId);
  const extra = s.sceneOrder.length > 4 ? [{ pk: `STORY#${s.storyId}`, sk: `SCENE#4`, narrative: 'Bonus scene', goal: 'Follow-up', expectedIntents: ['follow_up'], hints: ['Be concise'], successCriteria: ['intent_match'] }] : [];
  return acc.concat(base.slice(0, s.sceneOrder.length), extra.slice(0, Math.max(0, s.sceneOrder.length-4)));
}, []);

writeFileSync(__dirname + '/cards.json', JSON.stringify(cards, null, 2));
writeFileSync(__dirname + '/stories.json', JSON.stringify({ stories, scenes: storyScenes }, null, 2));

console.log('Generated: cards.json (', cards.length, '), stories.json');
