/**
 * Party Games — 13 separate synced games for Tats vs Wideass arena.
 * Chaos, Brain, Defend, Lore, Dice, GuessWho, Twenty, TruthsLie, ThisOrThat,
 * StoryChain, Gems, SayAnything, Closer
 */
window.PartyGames = (function () {
  "use strict";

  /* ---- deck content (flat, no visible tone tags) ---- */
  const CHAOS_CARDS = [
    "What's something you used to think you wanted, but don't anymore?",
    "What's the fastest way someone earns your trust?",
    "What's a green flag you didn't used to notice, but do now?",
    "Who brings out the best version of you, and what do they do differently?",
    "What's a small gesture that makes you feel taken care of?",
    "What's a compliment that's stuck with you for years?",
    "What's a relationship pattern you've had to unlearn?",
    "What do people usually get wrong about you at first?",
    "How do you tell the difference between 'safe' and 'boring'?",
    "What's your most alarming but harmless habit?",
    "What's a hill you'd die on that objectively does not matter?",
    "What's your weirdly specific pet peeve?",
    "What would your friends call your most chaotic trait?",
    "What's the weirdest thing you'd defend with total confidence?",
    "What store poses the highest risk to your bank account?",
    "What's the one item you cannot be trusted around?",
    "What's a subtle move that instantly makes someone more attractive to you?",
    "What's your most irrational 'type' tell?",
    "What's a trait that isn't attractive at first, but becomes irresistible over time?",
    "What's the tiny moment where you think 'oh no, I like her'?",
    "What's the best kind of tension: banter, eye contact, silence, or almost saying something?",
    "What's the first thing you notice about someone?",
    "What's the most unnecessary romantic scenario you've ever imagined?",
    "What's hotter: confidence, competence, curiosity, or restraint?",
    "You become locally famous for something completely harmless — what is it?",
    "You get banned from one public place for a ridiculous reason — what happened?",
    "Your hometown builds a statue of you — what's the pose?",
    "You have to survive a week working a mall kiosk — what are you selling?",
    "What's the most overrated first-date activity?",
    "What snack deserves way more respect than it gets?",
    "What food opinion of yours would start a fight?",
    "What's the best low-effort hangout, just the two of us?",
    "What's a formative memory that still shapes who you are?",
    "What's a value you will not compromise on?",
    "What's something you're secretly really proud of?",
    "What does your ideal Sunday actually look like?",
    "Who's your person, and what do they know about you that almost nobody else does?",
    "What's a place that feels like home even if you don't live there?",
    "What's the last thing that made you laugh until it hurt?",
    "What's something you want someone to ask you about, but nobody ever does?"
  ];

  const SAME_BRAIN_CELL = [
    { q: "Best low-pressure hangout", options: ["Coffee walk", "Bookstore", "Arcade", "Grocery store chaos"] },
    { q: "Most attractive kind of intelligence", options: ["Emotional", "Practical", "Creative", "Unhinged pattern recognition"] },
    { q: "Ideal Sunday", options: ["Do nothing", "Adventure", "Deep clean", "Errands with snacks"] },
    { q: "Best tension", options: ["Banter", "Eye contact", "Almost saying something", "Competitive board game silence"] },
    { q: "Worst video-call crime", options: ["Bad lighting", "Awkward silence", "Wi-Fi betrayal", "Talking like a work meeting"] },
    { q: "Best game-night snack", options: ["Chips and dip", "Candy", "Pizza", "Fancy little bites"] },
    { q: "Most dangerous store", options: ["Target", "Bookstore", "Thrift store", "Grocery store while hungry"] },
    { q: "Your flirting style in a crisis", options: ["Jokes", "Questions", "Directness", "Pretending not to flirt"] },
    { q: "Best vacation energy", options: ["Beach", "City", "Mountains", "Random small town with lore"] },
    { q: "Most romantic non-romantic activity", options: ["Errands together", "Cooking", "Wandering a city", "Comfortable silence"] },
    { q: "Pick the greenest flag", options: ["Consistency", "Curiosity", "Self-awareness", "Good conflict repair"] },
    { q: "Pick the funniest red flag", options: ["Owns too many mugs", "Has a favorite airport", "Says “I'm chill” too much", "Makes spreadsheets for fun"] },
    { q: "Best minor superpower", options: ["Always finding parking", "Perfect timing", "Reading the room", "Never picking a bad restaurant"] },
    { q: "Most attractive competence", options: ["Cooking", "Planning", "Fixing things", "Staying calm"] },
    { q: "Best way to spend a first month getting to know someone", options: ["Long calls", "In-person visits", "Constant texting", "Slow and quiet"] }
  ];

  const DEFEND_YOUR_TAKE = [
    "Brunch is overrated.", "A grocery store trip can be a valid hangout.", "Board games reveal character.",
    "Coffee walks are better than dinner dates.", "The best plans have one planned thing and then wandering.",
    "The aux cord is a personality test.", "A good pen can improve your entire life.",
    "Consistency is more attractive than intensity.", "Banter is only good if there's warmth underneath it.",
    "Curiosity is a better green flag than charm.", "The way someone handles a small inconvenience tells you a lot.",
    "Effort matters more when it's specific.", "Being easy to talk to is underrated.",
    "The best people make you feel more like yourself.", "Repair matters more than never messing up.",
    "Good eye contact is a public safety hazard.", "Competence is hotter than anything performative.",
    "The best flirting is technically deniable.", "Tension is better when nobody is rushing it.",
    "A little nervousness can be cute.", "The right voice can ruin your life.",
    "Playful arguing is a love language for some people.", "Paying attention is the hottest thing someone can do.",
    "Every adult should have a nemesis.", "A person's favorite grocery aisle reveals their soul.",
    "Being dramatic about minor problems is good for morale.", "A person with no weird opinions is hiding something.",
    "You should be allowed one harmless public meltdown per year.",
    "You can tell a lot about someone by how they introduce their friends to you.",
    "Long distance is easier with a plan than with just feelings."
  ];

  const LORE_CATEGORIES = [
    "Childhood lore", "Travel lore", "Food lore", "Family lore, but only the funny kind",
    "“My friends would expose me” lore", "Dating lore, light version", "Dating lore, spicy version",
    "Worst first impression lore", "Best compliment lore", "Pet peeve lore", "“I was humbled” lore",
    "Work/school lore", "Embarrassing phase lore", "Music taste lore", "Secretly competitive lore",
    "Comfort activity lore", "“This explains my personality” lore", "City you romanticize lore",
    "Texting habit lore", "“I cannot be trusted around this” lore", "Green flag lore",
    "Red flag but funny lore", "“My type is apparently…” lore", "“I thought I was chill but…” lore",
    "“How my friends found out I liked her” lore"
  ];

  const DICE_BOARD_SPACES = [
    "Hot Take", "Lore Drop", "Same Brain Cell", "Courtroom Mode", "Flirt Card", "Absurd Trial",
    "Reverse Question", "Steal a Point", "Give a Badge", "Plead the Fifth", "Red Flag Court",
    "Green Flag Evidence", "Wild Card", "Unhinged Confession", "Compliment Tax", "Sudden Death Opinion",
    "Petty Debate", "Mystery Lore", "Chaos Reroll", "Final Boss"
  ];

  const DICE_QUEST_CARDS = [
    { space: "Hot Take", text: "What's something popular that you simply do not respect?" },
    { space: "Lore Drop", text: "What's one thing you're secretly proud of?" },
    { space: "Flirt Card", text: "What's something subtle that makes someone more attractive?" },
    { space: "Absurd Trial", text: "Defend yourself against the accusation of being too dramatic." },
    { space: "Reverse Question", text: "Ask the other person anything from the last three cards." },
    { space: "Green Flag Evidence", text: "What behavior makes you trust someone more?" },
    { space: "Red Flag Court", text: "What's a red flag that becomes funny once you're self-aware about it?" },
    { space: "Unhinged Confession", text: "What's your most chaotic harmless preference?" },
    { space: "Compliment Tax", text: "Give the other person a compliment, but make it weirdly specific." },
    { space: "Petty Debate", text: "Pick one: bad texter, picky eater, always late, too chill. Which is worst?" },
    { space: "Mystery Lore", text: "Tell a story that explains one of your personality traits." },
    { space: "Final Boss", text: "What's the most “you” way to lose a game?" }
  ];

  const BADGES = [
    { id: "same-brain", label: "Same Brain Cell", desc: "You matched logic in a concerning way." },
    { id: "unhinged-valid", label: "Unhinged But Valid", desc: "The answer was insane, but the court accepts it." },
    { id: "court-adjourned", label: "Court Adjourned", desc: "Successful defense." },
    { id: "lore-unlocked", label: "Lore Unlocked", desc: "New useful information acquired." },
    { id: "suspiciously-specific", label: "Suspiciously Specific", desc: "Too detailed to be casual." },
    { id: "moral-superiority", label: "Temporary Moral Superiority", desc: "You win this argument for now." },
    { id: "follow-up", label: "Immediate Follow-Up Question", desc: "Cannot move on without explanation." },
    { id: "green-flag", label: "Green Flag Detected", desc: "Actually wholesome." },
    { id: "red-flag-funny", label: "Red Flag But Funny", desc: "Concerning, but entertaining." },
    { id: "main-character", label: "Main Character Evidence", desc: "Dramatic, branded, undeniable." },
    { id: "public-safety-flirt", label: "Public Safety Flirt", desc: "Answer was casually dangerous." },
    { id: "emotionally-expensive", label: "Emotionally Expensive", desc: "That answer had layers." },
    { id: "jail-stylish", label: "Jail, But Stylish", desc: "Wrong, but with confidence." },
    { id: "no-notes", label: "No Notes", desc: "Perfect answer." },
    { id: "deeply-unserious", label: "Deeply Unserious", desc: "Not helpful, but excellent." },
    { id: "mind-reader", label: "Mind Reader", desc: "Called their answer almost word-for-word." }
  ];

  const GUESSWHO_TRAITS = [
    "Introvert at parties", "Cries at movies", "Has (or wants) a pet", "Morning person",
    "Loves horror movies", "Vegetarian or vegan", "Has a tattoo", "Plays an instrument",
    "Loves karaoke", "Big reader", "Into astrology", "Competitive at board games",
    "Loves hiking or the outdoors", "Total homebody", "Has lived in 3+ cities",
    "Loves cooking from scratch", "Into true crime", "Plant parent", "Night-owl gamer",
    "Loves a good road trip", "Speaks more than one language", "Has run (or wants to run) a 5k",
    "Loves thrifting", "Always the one who plans the trip"
  ];

  const TWENTY_CATEGORIES = ["Person", "Place", "Thing", "Memory"];

  const TRUTHS_LIE_THEMES = [
    "Childhood", "Travel", "Firsts", "Work or school", "Hidden talents", "Family",
    "Food", "Pets", "Fears", "Achievements", "Habits", "This past year"
  ];

  const THIS_OR_THAT_PAIRS = [
    { a: "Texting all day", b: "One long call at night" },
    { a: "Plans made in advance", b: "Whatever we feel like that day" },
    { a: "Sunrise", b: "Sunset" },
    { a: "Window seat", b: "Aisle seat" },
    { a: "Rewatch a comfort show", b: "Start something brand new" },
    { a: "Cook at home", b: "Order in" },
    { a: "Quiet night in", b: "Out somewhere loud" },
    { a: "Handwritten note", b: "Perfectly timed text" },
    { a: "Road trip", b: "Flight somewhere far" },
    { a: "Save it for later", b: "Eat dessert first" },
    { a: "Talk it out immediately", b: "Take a beat and come back to it" },
    { a: "Surprise plans", b: "Know exactly what's happening" },
    { a: "Mountains", b: "Ocean" },
    { a: "Dog person", b: "Cat person" },
    { a: "Early and over-prepared", b: "Right on time, barely" },
    { a: "Big group hangs", b: "Just the two of us" },
    { a: "Coffee", b: "Tea" },
    { a: "Book you can't put down", b: "Show you binge in one sitting" },
    { a: "Give advice", b: "Just listen" },
    { a: "New place every vacation", b: "Same favorite place, every time" },
    { a: "Silly and playful", b: "Deep and thoughtful" },
    { a: "Plan the whole day", b: "See where the day takes us" },
    { a: "Say it now", b: "Sit with it first" },
    { a: "Splurge on experiences", b: "Splurge on comfort" }
  ];

  const STORY_STARTERS = [
    "It started as a completely normal Tuesday, until...",
    "The last text I expected to get today was...",
    "Nobody warned us about the raccoon in the parking lot, so...",
    "We had one job: don't miss the flight...",
    "The Wi-Fi went out at the worst possible moment...",
    "It was supposed to be a quiet coffee run...",
    "Somehow, we ended up on a rooftop with strangers...",
    "The recipe said 'simple weeknight dinner'...",
    "We should never have agreed to dog-sit that week...",
    "The GPS said turn left. We should not have listened...",
    "It was fine until the karaoke machine turned on by itself...",
    "The plan was simple: get in, get out, no eye contact with anyone."
  ];

  const STORY_TWISTS = [
    "Suddenly, a very judgmental cat enters the scene.",
    "The power goes out. Nobody has a flashlight.",
    "An old song starts playing and nobody can figure out where from.",
    "A stranger insists they know one of you from somewhere.",
    "It starts raining, hard, with zero warning.",
    "Someone's phone battery hits 1% at the worst moment.",
    "A food truck appears out of nowhere and changes everything.",
    "One of you realizes you've met this person before.",
    "The GPS confidently gives directions into a lake.",
    "A very small dog takes complete control of the situation."
  ];

  const GEM_PROMPTS = [
    "A place I want to visit", "A skill I want to learn", "A food I've never tried but want to",
    "A fear I'm slowly getting over", "A dream job I've never told anyone about",
    "Something on my bucket list", "A hobby I want to pick back up",
    "A small thing that would make my whole year", "Somewhere I'd move in a heartbeat",
    "A talent almost nobody knows I have"
  ];

  const SAY_ANYTHING_ENTRIES = [
    { word: "First date", banned: ["nervous", "dinner", "meet"] },
    { word: "Long distance", banned: ["far", "apart", "miles"] },
    { word: "Video call", banned: ["screen", "camera", "talk"] },
    { word: "Comfort food", banned: ["favorite", "cook", "eat"] },
    { word: "Road trip", banned: ["car", "drive", "music"] },
    { word: "Inside joke", banned: ["funny", "laugh", "only"] },
    { word: "Hometown", banned: ["grew up", "from", "city"] },
    { word: "Bucket list", banned: ["someday", "goals", "want"] },
    { word: "Green flag", banned: ["good", "trust", "sign"] },
    { word: "Butterflies", banned: ["nervous", "stomach", "excited"] },
    { word: "Sunday morning", banned: ["relax", "coffee", "slow"] },
    { word: "Playlist", banned: ["songs", "music", "mood"] },
    { word: "Time zone", banned: ["hours", "clock", "difference"] },
    { word: "Home", banned: ["house", "live", "feel"] },
    { word: "First impression", banned: ["met", "think", "judge"] },
    { word: "Slow burn", banned: ["time", "build", "wait"] },
    { word: "Text back", banned: ["reply", "phone", "message"] },
    { word: "Nostalgia", banned: ["remember", "past", "memory"] },
    { word: "Chosen family", banned: ["friends", "close", "choose"] },
    { word: "Dream trip", banned: ["travel", "vacation", "someday"] }
  ];

  const CLOSER_TIERS = {
    1: [
      "What's a small thing that instantly puts you in a good mood?",
      "What's your go-to order when you don't want to think about it?",
      "What's a song you'd want playing if today were a movie?",
      "What's something you're looking forward to this week?",
      "What's a place you go when you want to feel calm?",
      "What's the most 'you' way to spend a free afternoon?",
      "What's something you learned about yourself this year?",
      "What's a small tradition you'd want to build with someone?",
      "What's something you're better at than you give yourself credit for?"
    ],
    2: [
      "What's something you needed to hear once that changed how you saw yourself?",
      "What's a fear you don't usually say out loud?",
      "What's something you're still figuring out about what you want?",
      "Who's someone who shaped who you are, and how?",
      "What's a moment you felt truly proud of yourself?",
      "What does feeling understood actually look like for you?",
      "What's something you used to be ashamed of that you've made peace with?",
      "What do you need most on a hard day?",
      "What's a belief about love you didn't used to have, but do now?"
    ],
    3: [
      "What would you want someone to know about you before anything else?",
      "What does it feel like when you finally let your guard down with someone?",
      "What's something you're hoping for in this, even if it feels early to say?",
      "What's a way you've grown that you're quietly proud of?",
      "What do you want to build more of in your life right now?",
      "What does 'home' mean to you when it's not about a place?",
      "What's something you've never said to someone you were falling for?",
      "What would make you feel like this was worth being honest about, no matter what happens?",
      "What's one true thing about how this conversation felt?"
    ]
  };

  const GAME_LIST = [
    { id: "chaos", icon: "🎴", label: "Chaos Cards" },
    { id: "brain", icon: "🧠", label: "Same Brain Cell" },
    { id: "lore", icon: "🎙️", label: "Lore Auction" },
    { id: "thisorthat", icon: "⚡", label: "This or That" },
    { id: "closer", icon: "💬", label: "Closer" },
    { id: "neverever", icon: "🙈", label: "Never Have I Ever" },
    { id: "wouldrather", icon: "🤔", label: "Would You Rather" }
  ];

  const NEVER_HAVE_I_EVER = [
    "Never have I ever… stayed up way too late talking to someone I liked.",
    "Never have I ever… re-read a text thread looking for hidden meaning.",
    "Never have I ever… pretended to like a movie because my date loved it.",
    "Never have I ever… practiced what I was going to say before a call.",
    "Never have I ever… stalked someone's social media a little too thoroughly.",
    "Never have I ever… lied about being busy when I just wanted a night in.",
    "Never have I ever… had a crush on a friend's friend and said nothing.",
    "Never have I ever… sent a message and immediately wanted to unsend it.",
    "Never have I ever… gotten dressed up with nowhere to go, just because.",
    "Never have I ever… kept a screenshot of a sweet message.",
    "Never have I ever… talked to my pet about my feelings.",
    "Never have I ever… googled someone before a first date.",
    "Never have I ever… cried at a commercial and blamed allergies.",
    "Never have I ever… ordered food for two and ate it alone.",
    "Never have I ever… made a playlist for someone who never heard it.",
    "Never have I ever… walked past a place just to feel something.",
    "Never have I ever… said 'I'm fine' when I absolutely was not.",
    "Never have I ever… changed my opinion because someone explained it well.",
    "Never have I ever… felt instantly comfortable with someone new.",
    "Never have I ever… laughed so hard I couldn't finish my sentence.",
    "Never have I ever… taken the long way home to decompress.",
    "Never have I ever… written something down and never sent it.",
    "Never have I ever… been the last one awake on a group trip.",
    "Never have I ever… defended a friend in an argument they didn't know about.",
    "Never have I ever… bought something just because it reminded me of someone."
  ];

  const WOULD_YOU_RATHER = [
    "Would you rather always know what someone is thinking on a first date, or never know until they tell you?",
    "Would you rather have perfect memory of every conversation, or the ability to forget one embarrassing moment forever?",
    "Would you rather plan every hangout in detail, or always wing it and see what happens?",
    "Would you rather be famous for something silly, or unknown but deeply loved by a small circle?",
    "Would you rather live in your favorite city with a tiny apartment, or a big house somewhere just okay?",
    "Would you rather always speak your mind, or always hear the truth when someone speaks to you?",
    "Would you rather go back to one perfect day, or skip ahead to know if this works out?",
    "Would you rather be the funniest person in the room, or the most calming?",
    "Would you rather never use your phone on dates again, or never watch TV together again?",
    "Would you rather cook together every night, or try a new restaurant every week?",
    "Would you rather have long deep talks once a month, or short sweet check-ins every day?",
    "Would you rather be surprised with plans, or always know the itinerary?",
    "Would you rather win every argument logically, or lose every argument but stay happy?",
    "Would you rather read each other's minds for one hour, or swap phones for one hour?",
    "Would you rather live without music or without movies?",
    "Would you rather always be ten minutes early, or never wait on someone else?",
    "Would you rather have one best friend for life, or a wide circle you see occasionally?",
    "Would you rather take a spontaneous road trip, or a carefully planned vacation abroad?",
    "Would you rather be able to pause time during a perfect moment, or rewind one mistake?",
    "Would you rather talk through every problem immediately, or sleep on it and talk tomorrow?",
    "Would you rather receive a handwritten letter, or a voice memo, once a week?",
    "Would you rather have your dream job far away, or a good job next door?",
    "Would you rather always tell the truth when asked, or always know when someone is lying?",
    "Would you rather relive your best year, or skip to your best year ahead?",
    "Would you rather be the big spoon every time, or flip a coin forever?"
  ];

  const GEM_ROWS = ["A", "B", "C", "D", "E"];
  const GEM_COLS = [1, 2, 3, 4, 5];

  let api = null;
  let activeGameId = null;
  let badgePicker = null;

  const arenaBadges = { host: [], joiner: [] };
  const fakePoints = { host: 0, joiner: 0 };
  let guessStreak = { host: 0, joiner: 0 };

  const chaos = { started: false, answererRole: "host", card: null, answer: null, guess: null, revealed: false };
  const brain = { started: false, question: null, answers: { host: null, joiner: null }, revealed: false, match: false };
  const defend = { started: false, turn: "host", statement: null, bluffGuess: null, truthIsReal: null, verdict: null, revealed: false };
  const lore = {
    started: false, turn: "host", category: null, phase: "pick", secretDetail: null,
    detailGuess: null, story: null, followUp: null, followUpAnswer: null
  };
  const dice = {
    started: false, positions: { host: 0, joiner: 0 }, turn: "host", lastRoll: null,
    awaitingEffect: false, space: null, effect: null, recentCards: [], inline: null
  };
  const guesswho = {
    started: false, subjectRole: "host", subjectReady: false, mySelections: null,
    resolved: {}, askedCount: 0, pendingTraits: {}, finalGuess: null, score: null, phase: "setup"
  };
  const twenty = {
    started: false, pickerRole: "host", category: null, secret: null, log: [],
    questionsUsed: 0, guessAttempt: null, resolved: null
  };
  const truthslie = {
    started: false, tellerRole: "host", themePrompt: null,
    statements: [null, null, null], guess: null, revealed: false
  };
  const thisorthat = {
    started: false, pair: null, pickA: null, pickB: null, streakCount: 0, revealed: false
  };
  const storychain = { started: false, turn: "host", sentences: [], starter: null };
  const gems = {
    started: false, myGrid: null, setupDone: { host: false, joiner: false },
    myGemsFound: 0, oppGemsFound: 0, turn: "host", lastResult: null, phase: "setup", winner: null
  };
  const sayanything = {
    started: false, clueGiverRole: "host", entry: null, skipsUsed: 0, solved: null
  };
  const closer = { started: false, tier: 1, index: 0, finished: false, tierReady: false };
  const neverever = { started: false, card: null, count: 0 };
  const wouldrather = { started: false, card: null, count: 0 };

  let decks = null;
  const hostGrids = { host: null, joiner: null };
  const hostGuessWhoSelections = { host: null, joiner: null };
  const hostTwentySecrets = { host: null, joiner: null };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function myRole() { return api.myRole(); }
  function oppRole(r) { return r === "host" ? "joiner" : "host"; }
  function isGameHost() { return api.isGameHost(); }
  function hasPartner() { return api.hasPartner(); }
  function send(msg) { api.send(msg); }
  function toast(msg) { api.toast(msg); }
  function celebrate(title, sub) { api.celebrate(title, sub); }
  function nameForRole(role) { return api.nameForRole(role); }

  function panelFade(panel, buildFn) {
    if (!panel) return;
    panel.classList.add("panel-updating");
    requestAnimationFrame(function () {
      try {
        panel.innerHTML = "";
        buildFn(panel);
      } catch (e) {
        console.error("Party game render error:", e);
        panel.innerHTML = "";
        panel.appendChild(el("p", "status-line", "Could not load this game — tap ← All Games and try again."));
      }
      requestAnimationFrame(function () {
        panel.classList.remove("panel-updating");
      });
    });
  }

  function initDecks() {
    return {
      chaos: shuffle(CHAOS_CARDS.slice()),
      brain: shuffle(SAME_BRAIN_CELL.map(function (item, i) { return Object.assign({}, item, { id: i }); })),
      defend: shuffle(DEFEND_YOUR_TAKE.slice()),
      lore: shuffle(LORE_CATEGORIES.slice()),
      truthsLieThemes: shuffle(TRUTHS_LIE_THEMES.slice()),
      thisOrThat: shuffle(THIS_OR_THAT_PAIRS.map(function (p, i) { return Object.assign({}, p, { id: i }); })),
      storyStarters: shuffle(STORY_STARTERS.slice()),
      storyTwists: shuffle(STORY_TWISTS.slice()),
      sayAnything: shuffle(SAY_ANYTHING_ENTRIES.map(function (e, i) { return Object.assign({}, e, { id: i }); })),
      neverever: shuffle(NEVER_HAVE_I_EVER.slice()),
      wouldrather: shuffle(WOULD_YOU_RATHER.slice())
    };
  }

  function popDeck(key, base) {
    if (!decks) decks = initDecks();
    const pile = decks[key];
    if (!pile.length) {
      if (key === "brain") decks[key] = shuffle(SAME_BRAIN_CELL.map(function (item, i) { return Object.assign({}, item, { id: i }); }));
      else if (key === "thisOrThat") decks[key] = shuffle(THIS_OR_THAT_PAIRS.map(function (p, i) { return Object.assign({}, p, { id: i }); }));
      else if (key === "sayAnything") decks[key] = shuffle(SAY_ANYTHING_ENTRIES.map(function (e, i) { return Object.assign({}, e, { id: i }); }));
      else decks[key] = shuffle(base.slice());
    }
    return decks[key].pop();
  }

  function closerAllDeck() {
    if (!decks) decks = initDecks();
    if (!decks.closerGf || !decks.closerGf.length) {
      decks.closerGf = shuffle(CLOSER_TIERS[1].concat(CLOSER_TIERS[2], CLOSER_TIERS[3]));
    }
    return decks.closerGf;
  }

  /** Draw one prompt for Get Fruity (and other board integrations). */
  function drawPrompt(gameKey) {
    if (!decks) decks = initDecks();
    switch (gameKey) {
      case "chaos":
        return { type: "chaos", text: popDeck("chaos", CHAOS_CARDS) };
      case "brain": {
        const q = popDeck("brain", SAME_BRAIN_CELL);
        return { type: "brain", question: q.q, options: q.options.slice() };
      }
      case "lore":
        return { type: "lore", category: popDeck("lore", LORE_CATEGORIES) };
      case "thisorthat": {
        const p = popDeck("thisOrThat", THIS_OR_THAT_PAIRS);
        return { type: "thisorthat", a: p.a, b: p.b };
      }
      case "closer":
        return { type: "closer", text: closerAllDeck().pop() };
      case "neverever":
        return { type: "neverever", text: popDeck("neverever", NEVER_HAVE_I_EVER) };
      case "wouldrather":
        return { type: "wouldrather", text: popDeck("wouldrather", WOULD_YOU_RATHER) };
      default:
        return { type: "chaos", text: popDeck("chaos", CHAOS_CARDS) };
    }
  }

  function notifyScoreboard() {
    if (api.onRenderScoreboard) api.onRenderScoreboard(exportScoreboard());
  }

  function bumpGuessStreak(role) {
    guessStreak[role]++;
    guessStreak[oppRole(role)] = 0;
    notifyScoreboard();
  }

  function resetGuessStreak(role) {
    guessStreak[role] = 0;
    notifyScoreboard();
  }

  function addFakePoint(role) {
    fakePoints[role]++;
    notifyScoreboard();
  }

  function badgeById(id) {
    return BADGES.find(function (b) { return b.id === id; });
  }

  function openBadgePicker(to, suggestedId) {
    badgePicker = { to: to, suggestedId: suggestedId || null };
    if (activeGameId) render(activeGameId);
  }

  function awardBadge(to, badgeId) {
    if (!badgeId) return;
    if (arenaBadges[to].indexOf(badgeId) === -1) arenaBadges[to].push(badgeId);
    send({ type: "skBadgeAward", payload: { to: to, badgeId: badgeId } });
    badgePicker = null;
    notifyScoreboard();
    if (activeGameId) render(activeGameId);
  }

  function renderBadgePicker(panel) {
    if (!badgePicker) return;
    const box = el("div", "pg-badge-picker");
    box.appendChild(el("h4", null, "Award a badge to " + nameForRole(badgePicker.to)));
    const grid = el("div", "pg-badge-grid");
    BADGES.forEach(function (b) {
      const btn = el("button", "secondary pg-badge-btn" + (badgePicker.suggestedId === b.id ? " suggested" : ""), b.label);
      btn.title = b.desc;
      btn.addEventListener("click", function () { awardBadge(badgePicker.to, b.id); });
      grid.appendChild(btn);
    });
    const cancel = el("button", "ghost", "Skip");
    cancel.addEventListener("click", function () { badgePicker = null; if (activeGameId) render(activeGameId); });
    box.appendChild(grid);
    box.appendChild(cancel);
    panel.appendChild(box);
  }

  function renderPanelHeader(panel, title, gameId) {
    const hdr = el("div", "pg-panel-header");
    hdr.appendChild(el("h3", "sk-mode-title", title));
    if (isGameHost()) {
      const btn = el("button", "ghost pg-new-game", "🔄 New Game");
      btn.addEventListener("click", function () { newGame(gameId); });
      hdr.appendChild(btn);
    }
    panel.appendChild(hdr);
  }

  function renderFakePoints(panel) {
    const row = el("div", "pg-fake-points");
    row.appendChild(el("span", "score-pop", nameForRole("host") + ": " + fakePoints.host + " fake pts"));
    row.appendChild(el("span", "score-pop", nameForRole("joiner") + ": " + fakePoints.joiner + " fake pts"));
    panel.appendChild(row);
  }

  function renderTurnBadge(panel, role, label) {
    const active = myRole() === role;
    const tag = el("span", "pg-turn-badge" + (active ? " turn-active" : ""), (label || nameForRole(role)) + (active ? " · your turn" : ""));
    panel.appendChild(tag);
  }

  function renderWaiting(panel, text) {
    panel.appendChild(el("p", "status-line waiting-pulse", text || "Waiting for partner…"));
  }

  function flipReveal(leftLabel, leftText, rightLabel, rightText) {
    const wrap = el("div", "flip-card");
    const inner = el("div", "flip-card-inner is-flipped");
    const front = el("div", "flip-card-face flip-card-front");
    front.appendChild(el("div", "prompt-cat", leftLabel));
    front.appendChild(el("h3", null, leftText));
    const back = el("div", "flip-card-face flip-card-back");
    back.appendChild(el("div", "prompt-cat", rightLabel));
    back.appendChild(el("h3", null, rightText));
    inner.appendChild(front);
    inner.appendChild(back);
    wrap.appendChild(inner);
    return wrap;
  }

  function exportSyncPayload() {
    return {
      chaos: chaos, brain: brain, defend: defend, lore: lore, dice: dice,
      guesswho: guesswho, twenty: twenty, truthslie: truthslie, thisorthat: thisorthat,
      storychain: storychain, gems: gems, sayanything: sayanything, closer: closer,
      neverever: neverever, wouldrather: wouldrather,
      decks: decks, badgePicker: badgePicker,
      arenaBadges: arenaBadges, fakePoints: fakePoints, guessStreak: guessStreak,
      hostGrids: hostGrids, hostGuessWhoSelections: hostGuessWhoSelections,
      hostTwentySecrets: hostTwentySecrets
    };
  }

  function importSync(payload) {
    if (!payload) return;
    Object.assign(chaos, payload.chaos || {});
    Object.assign(brain, payload.brain || {});
    Object.assign(defend, payload.defend || {});
    Object.assign(lore, payload.lore || {});
    Object.assign(dice, payload.dice || {});
    Object.assign(guesswho, payload.guesswho || {});
    Object.assign(twenty, payload.twenty || {});
    Object.assign(truthslie, payload.truthslie || {});
    Object.assign(thisorthat, payload.thisorthat || {});
    Object.assign(storychain, payload.storychain || {});
    Object.assign(gems, payload.gems || {});
    Object.assign(sayanything, payload.sayanything || {});
    Object.assign(closer, payload.closer || {});
    Object.assign(neverever, payload.neverever || {});
    Object.assign(wouldrather, payload.wouldrather || {});
    decks = payload.decks || null;
    badgePicker = payload.badgePicker || null;
    if (payload.arenaBadges) { arenaBadges.host = payload.arenaBadges.host.slice(); arenaBadges.joiner = payload.arenaBadges.joiner.slice(); }
    if (payload.fakePoints) { fakePoints.host = payload.fakePoints.host; fakePoints.joiner = payload.fakePoints.joiner; }
    if (payload.guessStreak) guessStreak = Object.assign({ host: 0, joiner: 0 }, payload.guessStreak);
    if (payload.hostGrids) { hostGrids.host = payload.hostGrids.host; hostGrids.joiner = payload.hostGrids.joiner; }
    if (payload.hostGuessWhoSelections) {
      hostGuessWhoSelections.host = payload.hostGuessWhoSelections.host;
      hostGuessWhoSelections.joiner = payload.hostGuessWhoSelections.joiner;
    }
    if (payload.hostTwentySecrets) {
      hostTwentySecrets.host = payload.hostTwentySecrets.host;
      hostTwentySecrets.joiner = payload.hostTwentySecrets.joiner;
    }
    notifyScoreboard();
    const viewId = (api.getActiveGame && api.getActiveGame()) || activeGameId;
    if (viewId && GAME_LIST.some(function (g) { return g.id === viewId; })) render(viewId);
    else if (activeGameId) render(activeGameId);
  }

  function exportScoreboard() {
    return { arenaBadges: { host: arenaBadges.host.slice(), joiner: arenaBadges.joiner.slice() }, fakePoints: Object.assign({}, fakePoints), guessStreak: Object.assign({}, guessStreak) };
  }

  function syncFull() {
    if (isGameHost()) send({ type: "skStateSync", payload: exportSyncPayload() });
  }

  function pushRecentCard(text) {
    if (!text) return;
    dice.recentCards.push(text);
    if (dice.recentCards.length > 3) dice.recentCards.shift();
  }

  /* ---- 4.1 Chaos Cards ---- */
  function chaosDraw() {
    if (!isGameHost()) { send({ type: "skChaosDrawRequest" }); return; }
    const card = popDeck("chaos", CHAOS_CARDS);
    chaos.card = card;
    chaos.answer = null;
    chaos.guess = null;
    chaos.revealed = false;
    send({ type: "skChaosPrompt", payload: { card: card, answererRole: chaos.answererRole } });
    if (activeGameId === "chaos") render("chaos");
  }

  function chaosSubmitAnswer(text) {
    if (myRole() !== chaos.answererRole) return;
    chaos.answer = text;
    send({ type: "skChaosAnswer", payload: { role: myRole(), answer: text } });
    chaosMaybeReveal();
    if (activeGameId === "chaos") render("chaos");
  }

  function chaosSubmitGuess(text) {
    if (myRole() === chaos.answererRole) return;
    chaos.guess = text;
    send({ type: "skChaosGuess", payload: { role: myRole(), guess: text } });
    chaosMaybeReveal();
    if (activeGameId === "chaos") render("chaos");
  }

  function chaosMaybeReveal() {
    if (chaos.answer !== null && chaos.guess !== null && !chaos.revealed) {
      chaos.revealed = true;
      if (isGameHost()) send({ type: "skChaosReveal", payload: { answer: chaos.answer, guess: chaos.guess, revealed: true } });
    }
  }

  function chaosNextRound(nailedIt) {
    if (nailedIt) {
      bumpGuessStreak(oppRole(chaos.answererRole));
      openBadgePicker(oppRole(chaos.answererRole), "mind-reader");
    } else {
      resetGuessStreak(oppRole(chaos.answererRole));
    }
    chaos.answererRole = oppRole(chaos.answererRole);
    chaosDraw();
  }

  function renderChaos(panel, inline) {
    if (!inline) renderPanelHeader(panel, "🎴 Chaos Cards", "chaos");
    if (!chaos.started) { chaos.started = true; }
    if (!chaos.card) {
      const btn = el("button", null, isGameHost() ? "Draw Card" : "Ask Host to Draw");
      btn.addEventListener("click", chaosDraw);
      panel.appendChild(btn);
      return;
    }
    renderTurnBadge(panel, chaos.answererRole, "Answerer: " + nameForRole(chaos.answererRole));
    const box = el("div", "prompt-box");
    box.appendChild(el("h3", null, chaos.card));
    panel.appendChild(box);

    if (chaos.revealed) {
      panel.appendChild(flipReveal(nameForRole(chaos.answererRole) + " said", chaos.answer, nameForRole(oppRole(chaos.answererRole)) + " guessed", chaos.guess));
      const match = (chaos.answer || "").trim().toLowerCase() === (chaos.guess || "").trim().toLowerCase();
      panel.appendChild(el("p", "status-line", match ? "🎯 Nailed It!" : "Not even close — still fun."));
      if (isGameHost() && !inline) {
        const row = el("div", "row");
        const nailed = el("button", null, "Nailed It 🎯");
        nailed.addEventListener("click", function () { chaosNextRound(true); });
        const miss = el("button", "secondary", "Not Even Close");
        miss.addEventListener("click", function () { chaosNextRound(false); });
        row.appendChild(nailed); row.appendChild(miss);
        panel.appendChild(row);
      } else if (inline) {
        const done = el("button", "secondary", "Back to Board");
        done.addEventListener("click", function () { dice.inline = null; diceFinishEffect(false); });
        panel.appendChild(done);
      }
      return;
    }

    if (myRole() === chaos.answererRole) {
      if (chaos.answer !== null) renderWaiting(panel, "Answer locked — waiting for guess…");
      else {
        panel.appendChild(el("p", "status-line", "Your real answer (secret until reveal):"));
        const input = document.createElement("input");
        input.type = "text"; input.placeholder = "Type your answer…";
        const btn = el("button", null, "Lock Answer");
        btn.addEventListener("click", function () { if (input.value.trim()) chaosSubmitAnswer(input.value.trim()); });
        panel.appendChild(input); panel.appendChild(btn);
      }
    } else {
      if (chaos.guess !== null) renderWaiting(panel, "Guess locked — waiting for answer…");
      else {
        panel.appendChild(el("p", "status-line", "Guess what she'll say:"));
        const input = document.createElement("input");
        input.type = "text"; input.placeholder = "Your guess…";
        const btn = el("button", null, "Lock Guess");
        btn.addEventListener("click", function () { if (input.value.trim()) chaosSubmitGuess(input.value.trim()); });
        panel.appendChild(input); panel.appendChild(btn);
      }
    }
  }

  /* ---- 4.2 Same Brain Cell ---- */
  function brainStart() {
    if (!isGameHost()) { send({ type: "skBrainDrawRequest" }); return; }
    const q = popDeck("brain", SAME_BRAIN_CELL);
    brain.question = q;
    brain.answers = { host: null, joiner: null };
    brain.revealed = false;
    brain.match = false;
    send({ type: "skBrainPrompt", payload: { question: q } });
    if (activeGameId === "brain") render("brain");
  }

  function brainSubmit(choice) {
    brain.answers[myRole()] = choice;
    send({ type: "skBrainAnswer", payload: { role: myRole(), choice: choice } });
    if (isGameHost()) brainMaybeReveal();
    if (activeGameId === "brain") render("brain");
  }

  function brainMaybeReveal() {
    if (brain.answers.host !== null && brain.answers.joiner !== null) {
      brain.revealed = true;
      brain.match = brain.answers.host === brain.answers.joiner;
      send({ type: "skBrainReveal", payload: { answers: brain.answers, match: brain.match } });
      if (brain.match && !dice.inline) {
        badgePicker = { to: "host", suggestedId: "same-brain" };
      }
      if (activeGameId === "brain" || activeGameId === "dice") render(activeGameId);
    }
  }

  function renderBrain(panel, inline) {
    if (!inline) renderPanelHeader(panel, "🧠 Same Brain Cell", "brain");
    if (!brain.question) {
      const btn = el("button", null, isGameHost() ? "Draw Question" : "Waiting for host…");
      btn.disabled = !isGameHost();
      btn.addEventListener("click", brainStart);
      panel.appendChild(btn);
      return;
    }
    const box = el("div", "prompt-box");
    box.appendChild(el("div", "prompt-cat", "Pick the one you think she'll pick too"));
    box.appendChild(el("h3", null, brain.question.q));
    panel.appendChild(box);

    if (brain.revealed) {
      const reveal = el("div", "reveal-box");
      ["host", "joiner"].forEach(function (role) {
        const c = el("div", "reveal-card" + (brain.match ? " match" : ""));
        c.appendChild(el("h4", null, nameForRole(role)));
        c.appendChild(el("div", null, brain.question.options[brain.answers[role]]));
        reveal.appendChild(c);
      });
      panel.appendChild(reveal);
      panel.appendChild(el("p", "status-line", brain.match ? "🎉 Same Brain Cell!" : "Different brains. Still valid."));
      if (isGameHost()) {
        const next = el("button", null, inline ? "Done" : "Next Question");
        next.addEventListener("click", function () {
          if (inline) { dice.inline = null; diceFinishEffect(false); }
          else brainStart();
        });
        panel.appendChild(next);
      }
      return;
    }
    if (brain.answers[myRole()] !== null) renderWaiting(panel, "Locked in — waiting for partner…");
    else {
      const opts = el("div", "sk-option-grid");
      brain.question.options.forEach(function (opt, i) {
        const btn = el("button", "secondary", opt);
        btn.addEventListener("click", function () { brainSubmit(i); });
        opts.appendChild(btn);
      });
      panel.appendChild(opts);
    }
  }

  /* ---- 4.3 Defend Your Take ---- */
  function defendDraw() {
    if (!isGameHost()) { send({ type: "skDefendDrawRequest" }); return; }
    const stmt = popDeck("defend", DEFEND_YOUR_TAKE);
    defend.statement = stmt;
    defend.bluffGuess = null;
    defend.truthIsReal = null;
    defend.verdict = null;
    defend.revealed = false;
    send({ type: "skDefendPrompt", payload: { turn: defend.turn, statement: stmt } });
    if (activeGameId === "defend" || activeGameId === "dice") render(activeGameId);
  }

  function defendLockBluffGuess(guess) {
    if (myRole() === defend.turn) return;
    defend.bluffGuess = guess;
    send({ type: "skDefendBluffGuess", payload: { role: myRole(), bluffGuess: guess } });
    if (activeGameId === "defend" || activeGameId === "dice") render(activeGameId);
  }

  function defendRevealTruth(isReal) {
    if (myRole() !== defend.turn) return;
    defend.truthIsReal = isReal;
    send({ type: "skDefendTruth", payload: { truthIsReal: isReal } });
    if (activeGameId === "defend" || activeGameId === "dice") render(activeGameId);
  }

  function defendVerdict(v) {
    if (myRole() === defend.turn) return;
    defend.verdict = v;
    defend.revealed = true;
    send({ type: "skDefendVerdict", payload: { verdict: v } });
    if (defend.bluffGuess) {
      const correct = (defend.bluffGuess === "real") === defend.truthIsReal;
      if (correct) openBadgePicker(myRole(), defend.truthIsReal ? "mind-reader" : "suspiciously-specific");
      else resetGuessStreak(myRole());
    }
    if (activeGameId === "defend" || activeGameId === "dice") render(activeGameId);
  }

  function defendNextTurn() {
    if (!isGameHost()) return;
    defend.turn = oppRole(defend.turn);
    defend.statement = null;
    defend.bluffGuess = null;
    defend.truthIsReal = null;
    defend.verdict = null;
    defend.revealed = false;
    syncFull();
    if (activeGameId === "defend") render("defend");
  }

  function renderDefend(panel, inline) {
    if (!inline) renderPanelHeader(panel, "⚖️ Defend Your Take", "defend");
    renderTurnBadge(panel, defend.turn, "Defender: " + nameForRole(defend.turn));
    if (!defend.statement) {
      if (isGameHost()) {
        const btn = el("button", null, "Draw Statement");
        btn.addEventListener("click", defendDraw);
        panel.appendChild(btn);
      } else renderWaiting(panel, "Waiting for statement…");
      return;
    }
    const box = el("div", "prompt-box");
    box.appendChild(el("h3", null, defend.statement));
    panel.appendChild(box);

    if (defend.revealed) {
      panel.appendChild(el("p", "status-line", "Truth: " + (defend.truthIsReal ? "Real belief" : "Total bluff") + " · Verdict: " + defend.verdict));
      if (inline || dice.inline) {
        const done = el("button", null, "Back to Board");
        done.addEventListener("click", function () { dice.inline = null; diceFinishEffect(false); });
        panel.appendChild(done);
      } else if (isGameHost()) {
        const next = el("button", null, "Next Turn");
        next.addEventListener("click", defendNextTurn);
        panel.appendChild(next);
      }
      return;
    }

    if (myRole() !== defend.turn && defend.bluffGuess === null) {
      panel.appendChild(el("p", "status-line", "Lock your call BEFORE they defend:"));
      const row = el("div", "row");
      const real = el("button", "secondary", "Real Belief");
      real.addEventListener("click", function () { defendLockBluffGuess("real"); });
      const bluff = el("button", "secondary", "Total Bluff");
      bluff.addEventListener("click", function () { defendLockBluffGuess("bluff"); });
      row.appendChild(real); row.appendChild(bluff);
      panel.appendChild(row);
      return;
    }

    if (myRole() === defend.turn && defend.truthIsReal === null) {
      panel.appendChild(el("p", "status-line", "Defend out loud, then reveal:"));
      const row = el("div", "row");
      const r = el("button", null, "It Was Real");
      r.addEventListener("click", function () { defendRevealTruth(true); });
      const b = el("button", "secondary", "It Was a Bluff");
      b.addEventListener("click", function () { defendRevealTruth(false); });
      row.appendChild(r); row.appendChild(b);
      panel.appendChild(row);
      return;
    }

    if (myRole() !== defend.turn && defend.verdict === null) {
      const row = el("div", "row");
      const ok = el("button", null, "Court Adjourned 🔨");
      ok.addEventListener("click", function () { defendVerdict("adjourned"); });
      const no = el("button", "secondary", "Objection!");
      no.addEventListener("click", function () { defendVerdict("objection"); });
      row.appendChild(ok); row.appendChild(no);
      panel.appendChild(row);
    } else renderWaiting(panel, "Waiting for partner…");
  }

  /* ---- 4.4 Lore Auction ---- */
  function loreDraw() {
    if (!isGameHost()) { send({ type: "skLoreDrawRequest" }); return; }
    const cat = popDeck("lore", LORE_CATEGORIES);
    lore.category = cat;
    lore.phase = "pick";
    lore.secretDetail = null;
    lore.detailGuess = null;
    lore.story = null;
    lore.followUp = null;
    lore.followUpAnswer = null;
    send({ type: "skLorePrompt", payload: { turn: lore.turn, category: cat } });
    if (activeGameId === "lore") render("lore");
  }

  function loreAction(action) {
    if (myRole() !== lore.turn) { toast("Not your turn."); return; }
    if (action === "trade") { loreDraw(); return; }
    if (action === "plead") {
      addFakePoint(oppRole(lore.turn));
      toast("Fake points. They mean nothing. That's the joke.");
      loreNextTurn();
      return;
    }
    lore.phase = action;
    if (activeGameId === "lore") render("lore");
  }

  function loreSubmitSecret(detail, story, followUp) {
    if (myRole() !== lore.turn) return;
    lore.secretDetail = detail;
    lore.story = story;
    if (lore.phase === "raise") {
      lore.followUp = followUp || "";
      lore.phase = "guess";
      send({ type: "skLoreRaise", payload: { secretDetail: detail, story: story, followUp: lore.followUp, category: lore.category } });
    } else {
      lore.phase = "guess";
      send({ type: "skLoreAnswer", payload: { secretDetail: detail, story: story, category: lore.category } });
    }
    if (activeGameId === "lore") render("lore");
  }

  function loreSubmitGuess(guess) {
    if (myRole() === lore.turn) return;
    lore.detailGuess = guess;
    lore.phase = "reveal";
    const correct = (guess || "").trim().toLowerCase() === (lore.secretDetail || "").trim().toLowerCase();
    send({ type: "skLoreGuess", payload: { guess: guess, correct: correct } });
    if (correct) {
      bumpGuessStreak(myRole());
      openBadgePicker(myRole(), "mind-reader");
    } else resetGuessStreak(myRole());
    if (activeGameId === "lore") render("lore");
  }

  function loreSubmitFollowUpAnswer(text) {
    lore.followUpAnswer = text;
    send({ type: "skLoreFollowUpAnswer", payload: { answer: text } });
    loreNextTurn();
  }

  function loreNextTurn() {
    if (!isGameHost()) return;
    lore.turn = oppRole(lore.turn);
    lore.category = null;
    lore.phase = "pick";
    lore.secretDetail = null;
    lore.detailGuess = null;
    lore.story = null;
    lore.followUp = null;
    lore.followUpAnswer = null;
    syncFull();
    if (activeGameId === "lore") render("lore");
  }

  function renderLore(panel) {
    renderPanelHeader(panel, "🎙️ Lore Auction", "lore");
    renderFakePoints(panel);
    renderTurnBadge(panel, lore.turn, "Active: " + nameForRole(lore.turn));
    if (!lore.category) {
      const btn = el("button", null, myRole() === lore.turn ? "Draw Category" : "Waiting…");
      btn.disabled = myRole() !== lore.turn;
      btn.addEventListener("click", loreDraw);
      panel.appendChild(btn);
      return;
    }
    const box = el("div", "prompt-box");
    box.appendChild(el("div", "prompt-cat", "Category"));
    box.appendChild(el("h3", null, lore.category));
    panel.appendChild(box);

    if (lore.phase === "followUpWait" && myRole() !== lore.turn) {
      panel.appendChild(el("p", "status-line", "Follow-up: " + lore.followUp));
      const input = document.createElement("input");
      input.type = "text"; input.placeholder = "Your answer…";
      const btn = el("button", null, "Submit");
      btn.addEventListener("click", function () { loreSubmitFollowUpAnswer(input.value); });
      panel.appendChild(input); panel.appendChild(btn);
      return;
    }

    if (lore.phase === "reveal") {
      panel.appendChild(flipReveal("Secret detail", lore.secretDetail, nameForRole(oppRole(lore.turn)) + " guessed", lore.detailGuess));
      panel.appendChild(el("div", "reveal-card", lore.story));
      if (lore.followUp && !lore.followUpAnswer && myRole() !== lore.turn) {
        panel.appendChild(el("p", "status-line", "Follow-up: " + lore.followUp));
        const input = document.createElement("input");
        input.type = "text"; input.placeholder = "Your answer…";
        const btn = el("button", null, "Submit");
        btn.addEventListener("click", function () { loreSubmitFollowUpAnswer(input.value); });
        panel.appendChild(input); panel.appendChild(btn);
        return;
      }
      if (lore.followUpAnswer) panel.appendChild(el("div", "reveal-card", "Follow-up: " + lore.followUpAnswer));
      if (isGameHost()) {
        const next = el("button", null, "Next Turn");
        next.addEventListener("click", loreNextTurn);
        panel.appendChild(next);
      }
      return;
    }

    if (lore.phase === "guess" && myRole() !== lore.turn) {
      panel.appendChild(el("p", "status-line", "They told the story with a blank — guess the detail:"));
      const input = document.createElement("input");
      input.type = "text"; input.placeholder = "Your guess…";
      const btn = el("button", null, "Submit Guess");
      btn.addEventListener("click", function () { loreSubmitGuess(input.value); });
      panel.appendChild(input); panel.appendChild(btn);
      return;
    }

    if (myRole() === lore.turn && (lore.phase === "pick" || lore.phase === "answer" || lore.phase === "raise")) {
      if (lore.phase === "pick") {
        const actions = el("div", "sk-option-grid");
        [["answer", "Answer"], ["trade", "Trade"], ["raise", "Raise"], ["plead", "Plead the Fifth"]].forEach(function (pair) {
          const btn = el("button", "secondary", pair[1]);
          btn.addEventListener("click", function () { loreAction(pair[0]); });
          actions.appendChild(btn);
        });
        panel.appendChild(actions);
      } else {
        panel.appendChild(el("p", "status-line", "Type ONE key detail, then tell the story saying [blank] for it:"));
        const detail = document.createElement("input");
        detail.type = "text"; detail.placeholder = "Secret detail (one word/phrase)…";
        const story = document.createElement("input");
        story.type = "text"; story.placeholder = "Story summary…";
        let fuInput = null;
        if (lore.phase === "raise") {
          fuInput = document.createElement("input");
          fuInput.type = "text"; fuInput.placeholder = "Follow-up question for partner…";
          panel.appendChild(fuInput);
        }
        const btn = el("button", null, "Submit");
        btn.addEventListener("click", function () {
          if (detail.value.trim()) loreSubmitSecret(detail.value.trim(), story.value.trim(), fuInput && fuInput.value.trim());
        });
        panel.appendChild(detail); panel.appendChild(story); panel.appendChild(btn);
      }
    } else renderWaiting(panel, "Waiting for " + nameForRole(lore.turn) + "…");
  }

  /* ---- 4.5 Tiny Dice Quest ---- */
  function diceSync() {
    send({ type: "skDiceSync", payload: { dice: dice, recentCards: dice.recentCards } });
  }

  function diceRoll() {
    if (dice.turn !== myRole()) { toast("Not your turn."); return; }
    if (!isGameHost()) { send({ type: "skDiceRollRequest" }); return; }
    diceDoRoll();
  }

  function diceDoRoll() {
    const roll = 1 + Math.floor(Math.random() * 6);
    dice.lastRoll = roll;
    const role = dice.turn;
    dice.positions[role] = (dice.positions[role] + roll) % 20;
    dice.space = DICE_BOARD_SPACES[dice.positions[role]];
    dice.awaitingEffect = true;
    diceSync();
    diceResolveSpace();
  }

  function diceResolveSpace() {
    const space = dice.space;
    const card = DICE_QUEST_CARDS.find(function (c) { return c.space === space; });
    if (card) {
      pushRecentCard(card.text);
      dice.effect = { type: "prompt", text: card.text, space: space };
      diceSync();
      if (activeGameId === "dice") render("dice");
      return;
    }
    if (space === "Same Brain Cell") {
      dice.inline = { type: "brain" };
      brain.question = null;
      brain.answers = { host: null, joiner: null };
      brain.revealed = false;
      diceSync();
      if (activeGameId === "dice") render("dice");
      return;
    }
    if (space === "Courtroom Mode" || space === "Sudden Death Opinion") {
      dice.inline = { type: "defend" };
      defend.turn = dice.turn;
      defend.statement = null;
      defend.bluffGuess = null;
      defend.truthIsReal = null;
      defend.verdict = null;
      defend.revealed = false;
      if (isGameHost()) defendDraw();
      else send({ type: "skDefendDrawRequest" });
      diceSync();
      return;
    }
    if (space === "Reverse Question") {
      dice.effect = { type: "reverse" };
      diceSync();
      if (activeGameId === "dice") render("dice");
      return;
    }
    if (space === "Steal a Point") {
      dice.positions[dice.turn] = Math.min(19, dice.positions[dice.turn] + 1);
      dice.positions[oppRole(dice.turn)] = Math.max(0, dice.positions[oppRole(dice.turn)] - 1);
      diceFinishEffect(false);
      return;
    }
    if (space === "Give a Badge") {
      openBadgePicker(dice.turn, null);
      diceFinishEffect(false);
      return;
    }
    if (space === "Plead the Fifth") {
      addFakePoint(oppRole(dice.turn));
      toast("Plead the Fifth — fake point awarded.");
      diceFinishEffect(false);
      return;
    }
    if (space === "Wild Card") {
      dice.inline = { type: "chaos" };
      chaos.card = null;
      chaos.answer = null;
      chaos.guess = null;
      chaos.revealed = false;
      chaos.answererRole = dice.turn;
      if (isGameHost()) chaosDraw();
      else send({ type: "skChaosDrawRequest", payload: { fromDice: true } });
      diceSync();
      return;
    }
    if (space === "Chaos Reroll") {
      dice.awaitingEffect = false;
      dice.effect = null;
      diceDoRoll();
      return;
    }
    if (space === "Final Boss") {
      celebrate("Final Boss reached! 👑", nameForRole(dice.turn) + " made it to the end.");
      dice.effect = { type: "finalBoss" };
      diceSync();
      if (activeGameId === "dice") render("dice");
      return;
    }
    diceFinishEffect(false);
  }

  function diceFinishEffect(stayTurn) {
    dice.awaitingEffect = false;
    dice.effect = null;
    dice.inline = null;
    if (!stayTurn) dice.turn = oppRole(dice.turn);
    dice.lastRoll = null;
    dice.space = null;
    diceSync();
    if (activeGameId === "dice") render("dice");
  }

  function renderDice(panel) {
    renderPanelHeader(panel, "🎲 Tiny Dice Quest", "dice");
    renderFakePoints(panel);
    const board = el("div", "sk-dice-board");
    DICE_BOARD_SPACES.forEach(function (name, i) {
      const cell = el("div", "sk-dice-cell" + (i === dice.positions.host ? " has-host" : "") + (i === dice.positions.joiner ? " has-joiner" : ""), String(i + 1));
      cell.title = name;
      if (i === dice.positions.host) cell.appendChild(el("span", "sk-piece host", "H"));
      if (i === dice.positions.joiner) cell.appendChild(el("span", "sk-piece joiner", "J"));
      board.appendChild(cell);
    });
    panel.appendChild(board);
    renderTurnBadge(panel, dice.turn, "Turn: " + nameForRole(dice.turn) + (dice.lastRoll ? " · Rolled " + dice.lastRoll + " → " + dice.space : ""));

    if (dice.inline) {
      if (dice.inline.type === "brain") renderBrain(panel, true);
      if (dice.inline.type === "defend") renderDefend(panel, true);
      if (dice.inline.type === "chaos") renderChaos(panel, true);
      return;
    }

    if (dice.effect) {
      const fx = el("div", "prompt-box");
      if (dice.effect.type === "prompt") {
        fx.appendChild(el("h3", null, dice.effect.text));
        panel.appendChild(fx);
        const done = el("button", null, "Continue");
        done.addEventListener("click", function () { diceFinishEffect(false); });
        panel.appendChild(done);
      } else if (dice.effect.type === "reverse") {
        fx.appendChild(el("h3", null, "Reverse Question"));
        fx.appendChild(el("p", null, "Ask anything inspired by recent cards:"));
        const hist = el("ul", "sk-history");
        dice.recentCards.forEach(function (t) { hist.appendChild(el("li", null, t)); });
        fx.appendChild(hist);
        panel.appendChild(fx);
        if (dice.turn === myRole()) {
          const input = document.createElement("input");
          input.type = "text";
          const btn = el("button", null, "Ask");
          btn.addEventListener("click", function () { pushRecentCard("Q: " + input.value); diceFinishEffect(false); });
          panel.appendChild(input); panel.appendChild(btn);
        }
      } else if (dice.effect.type === "finalBoss") {
        fx.appendChild(el("h3", null, "You reached Final Boss!"));
        panel.appendChild(fx);
        if (isGameHost()) {
          const again = el("button", null, "Play Again");
          again.addEventListener("click", function () { newGame("dice"); });
          panel.appendChild(again);
        }
      }
      return;
    }

    if (!dice.awaitingEffect && dice.turn === myRole()) {
      const rollBtn = el("button", null, "Roll Dice");
      rollBtn.addEventListener("click", diceRoll);
      panel.appendChild(rollBtn);
    } else if (dice.awaitingEffect) renderWaiting(panel, "Resolving space…");
    else renderWaiting(panel, "Waiting for " + nameForRole(dice.turn) + " to roll…");
  }

  /* ---- 4.6 Get to Know Who ---- */
  function guessWhoSubmitSelections(selections) {
    guesswho.mySelections = selections;
    if (isGameHost()) {
      hostGuessWhoSelections[myRole()] = selections;
    } else {
      send({ type: "skGuessWhoSetup", payload: { role: myRole(), selections: selections } });
    }
    guesswho.subjectReady = true;
    if (isGameHost() && myRole() === guesswho.subjectRole) {
      guessWhoStartRound();
    }
    if (activeGameId === "guesswho") render("guesswho");
  }

  function guessWhoStartRound() {
    if (!isGameHost()) return;
    const sel = hostGuessWhoSelections[guesswho.subjectRole];
    if (!sel) return;
    guesswho.phase = "play";
    guesswho.resolved = {};
    guesswho.askedCount = 0;
    guesswho.finalGuess = null;
    guesswho.score = null;
    guesswho.pendingTraits = {};
    send({ type: "skGuessWhoStart", payload: { subjectRole: guesswho.subjectRole, selections: sel } });
    if (activeGameId === "guesswho") render("guesswho");
  }

  function guessWhoAsk(traitIndex) {
    if (myRole() === guesswho.subjectRole) return;
    if (guesswho.phase !== "play" && guesswho.phase !== "lock") return;
    if (guesswho.resolved[traitIndex] !== undefined) return;
    send({ type: "skGuessWhoAsk", payload: { traitIndex: traitIndex } });
    if (isGameHost()) guessWhoAnswer(traitIndex);
  }

  function guessWhoAnswer(traitIndex) {
    const sel = hostGuessWhoSelections[guesswho.subjectRole];
    if (!sel) return;
    const answer = !!sel[traitIndex];
    guesswho.resolved[traitIndex] = answer;
    guesswho.askedCount++;
    send({ type: "skGuessWhoAnswer", payload: { traitIndex: traitIndex, answer: answer } });
    if (activeGameId === "guesswho") render("guesswho");
  }

  function guessWhoFinalizeScore(predictions) {
    const sel = hostGuessWhoSelections[guesswho.subjectRole] || {};
    let score = 0;
    GUESSWHO_TRAITS.forEach(function (_, i) {
      if (!!predictions[i] === !!sel[i]) score++;
    });
    guesswho.finalGuess = predictions;
    guesswho.score = score;
    guesswho.phase = "score";
    send({ type: "skGuessWhoReveal", payload: { finalGuess: predictions, score: score, selections: sel } });
    if (score >= 20) openBadgePicker(oppRole(guesswho.subjectRole), "mind-reader");
    if (activeGameId === "guesswho") render("guesswho");
  }

  function guessWhoLockGuess(predictions) {
    if (!isGameHost()) {
      send({ type: "skGuessWhoLockRequest", payload: { predictions: predictions } });
      return;
    }
    guessWhoFinalizeScore(predictions);
  }

  function guessWhoNextRound() {
    if (!isGameHost()) return;
    const nextSubject = oppRole(guesswho.subjectRole);
    guesswho.subjectRole = nextSubject;
    guesswho.subjectReady = false;
    guesswho.mySelections = null;
    guesswho.resolved = {};
    guesswho.askedCount = 0;
    guesswho.finalGuess = null;
    guesswho.score = null;
    guesswho.pendingTraits = {};
    guesswho.phase = "setup";
    hostGuessWhoSelections.host = null;
    hostGuessWhoSelections.joiner = null;
    syncFull();
    if (activeGameId === "guesswho") render("guesswho");
  }

  function renderGuessWhoGrid(panel, mode) {
    const grid = el("div", "pg-gw-grid");
    GUESSWHO_TRAITS.forEach(function (trait, i) {
      let cls = "gw-tile";
      if (mode === "setup") cls += guesswho.mySelections && guesswho.mySelections[i] ? " is-selected" : "";
      if (mode === "play" && guesswho.resolved[i] !== undefined) cls += guesswho.resolved[i] ? " is-yes" : " is-no";
      if (mode === "lock" && guesswho.pendingTraits && guesswho.pendingTraits[i]) cls += " is-selected";
      const tile = el("button", cls, trait);
      tile.type = "button";
      tile.addEventListener("click", function () {
        if (mode === "setup") {
          if (!guesswho.mySelections) guesswho.mySelections = {};
          guesswho.mySelections[i] = !guesswho.mySelections[i];
          render("guesswho");
        } else if (mode === "play") guessWhoAsk(i);
        else if (mode === "lock") {
          if (!guesswho.pendingTraits) guesswho.pendingTraits = {};
          guesswho.pendingTraits[i] = !guesswho.pendingTraits[i];
          render("guesswho");
        }
      });
      grid.appendChild(tile);
    });
    panel.appendChild(grid);
  }

  function renderGuessWho(panel) {
    if (!guesswho.started) guesswho.started = true;
    renderPanelHeader(panel, "🔍 Get to Know Who", "guesswho");
    renderTurnBadge(panel, guesswho.subjectRole, "Subject: " + nameForRole(guesswho.subjectRole));

    if (!hasPartner()) {
      panel.appendChild(el("p", "status-line", "Connect a partner with the same arena code — one of you marks traits, the other guesses."));
    }

    if (guesswho.phase === "setup") {
      if (myRole() === guesswho.subjectRole) {
        panel.appendChild(el("p", "status-line", "Tap traits that are true about you (tap again to unselect):"));
        renderGuessWhoGrid(panel, "setup");
        const btn = el("button", null, "Submit Traits");
        btn.addEventListener("click", function () {
          const picks = Object.assign({}, guesswho.mySelections || {});
          guessWhoSubmitSelections(picks);
        });
        panel.appendChild(btn);
      } else renderWaiting(panel, "Waiting for " + nameForRole(guesswho.subjectRole) + " to mark traits…");
      return;
    }

    if (guesswho.phase === "score") {
      panel.appendChild(el("p", "status-line score-pop", "Score: " + guesswho.score + " of 24 correct"));
      if (isGameHost()) {
        const next = el("button", null, "Next Round");
        next.addEventListener("click", guessWhoNextRound);
        panel.appendChild(next);
      }
      return;
    }

    if (myRole() === guesswho.subjectRole) {
      renderWaiting(panel, "Guesser is asking about your traits…");
      return;
    }

    if (guesswho.phase === "lock") {
      panel.appendChild(el("p", "status-line", "Mark remaining tiles true/false, then lock in:"));
      renderGuessWhoGrid(panel, "lock");
      const allMarked = GUESSWHO_TRAITS.every(function (_, i) {
        return guesswho.resolved[i] !== undefined || (guesswho.pendingTraits && guesswho.pendingTraits[i] !== undefined);
      });
      const btn = el("button", null, "Lock In Final Guess");
      btn.disabled = !allMarked;
      btn.addEventListener("click", function () {
        const pred = {};
        GUESSWHO_TRAITS.forEach(function (_, i) {
          pred[i] = guesswho.resolved[i] !== undefined ? guesswho.resolved[i] : !!guesswho.pendingTraits[i];
        });
        guessWhoLockGuess(pred);
      });
      panel.appendChild(btn);
      return;
    }

    panel.appendChild(el("p", "status-line", "Click a trait to ask yes/no · Asked: " + guesswho.askedCount));
    renderGuessWhoGrid(panel, "play");
    const lockBtn = el("button", "secondary", "Lock In Final Guess");
    lockBtn.addEventListener("click", function () {
      guesswho.phase = "lock";
      guesswho.pendingTraits = {};
      GUESSWHO_TRAITS.forEach(function (_, i) {
        if (guesswho.resolved[i] !== undefined) guesswho.pendingTraits[i] = guesswho.resolved[i];
      });
      render("guesswho");
    });
    panel.appendChild(lockBtn);
  }

  /* ---- 4.7 Twenty Questions ---- */
  function twentyPickCategory(cat) {
    if (myRole() !== twenty.pickerRole) return;
    twenty.category = cat;
    if (activeGameId === "twenty") render("twenty");
  }

  function twentySubmitSecret(secret) {
    if (myRole() !== twenty.pickerRole) return;
    twenty.secret = secret;
    if (isGameHost()) hostTwentySecrets[myRole()] = secret;
    send({ type: "skTwentySecret", payload: { role: myRole(), category: twenty.category, secret: secret } });
    twenty.phase = "play";
    if (activeGameId === "twenty") render("twenty");
  }

  function twentyAskQuestion(q) {
    if (myRole() === twenty.pickerRole) return;
    send({ type: "skTwentyQuestion", payload: { question: q } });
    if (activeGameId === "twenty") render("twenty");
  }

  function twentyAnswer(answer) {
    if (myRole() !== twenty.pickerRole) return;
    const pending = twenty.log.length && twenty.log[twenty.log.length - 1].answer === undefined;
    if (!pending) return;
    twenty.log[twenty.log.length - 1].answer = answer;
    twenty.questionsUsed++;
    send({ type: "skTwentyAnswer", payload: { answer: answer, questionsUsed: twenty.questionsUsed, log: twenty.log.slice() } });
    if (twenty.questionsUsed >= 20 && !twenty.resolved) {
      twenty.resolved = "lost";
      send({ type: "skTwentyEnd", payload: { resolved: "lost" } });
    }
    if (activeGameId === "twenty") render("twenty");
  }

  function twentyGuess(guess) {
    if (myRole() === twenty.pickerRole) return;
    twenty.guessAttempt = guess;
    send({ type: "skTwentyGuess", payload: { guess: guess } });
    if (activeGameId === "twenty") render("twenty");
  }

  function twentyConfirmGuess(correct) {
    if (myRole() !== twenty.pickerRole) return;
    twenty.resolved = correct ? "won" : null;
    if (correct) {
      bumpGuessStreak(oppRole(twenty.pickerRole));
      celebrate("Correct! 🕵️", nameForRole(oppRole(twenty.pickerRole)) + " guessed it!");
      openBadgePicker(oppRole(twenty.pickerRole), "mind-reader");
    } else resetGuessStreak(oppRole(twenty.pickerRole));
    send({ type: "skTwentyEnd", payload: { resolved: correct ? "won" : null, guess: twenty.guessAttempt } });
    if (activeGameId === "twenty") render("twenty");
  }

  function twentyNextRound() {
    if (!isGameHost()) return;
    twenty.pickerRole = oppRole(twenty.pickerRole);
    twenty.category = null;
    twenty.secret = null;
    twenty.log = [];
    twenty.questionsUsed = 0;
    twenty.guessAttempt = null;
    twenty.resolved = null;
    syncFull();
    if (activeGameId === "twenty") render("twenty");
  }

  function renderTwenty(panel) {
    renderPanelHeader(panel, "🕵️ Twenty Questions", "twenty");
    renderTurnBadge(panel, twenty.pickerRole, "Picker: " + nameForRole(twenty.pickerRole));

    if (twenty.resolved) {
      panel.appendChild(el("p", "status-line", twenty.resolved === "won" ? "Guesser wins!" : "Out of questions — picker wins!"));
      panel.appendChild(el("p", "status-line", "Secret was: " + (twenty.secret || "—")));
      if (isGameHost()) {
        const next = el("button", null, "Next Round");
        next.addEventListener("click", twentyNextRound);
        panel.appendChild(next);
      }
      return;
    }

    if (!twenty.category && myRole() === twenty.pickerRole) {
      panel.appendChild(el("p", "status-line", "Pick a category and set your secret:"));
      const opts = el("div", "sk-option-grid");
      TWENTY_CATEGORIES.forEach(function (cat) {
        const btn = el("button", "secondary", cat);
        btn.addEventListener("click", function () { twentyPickCategory(cat); });
        opts.appendChild(btn);
      });
      panel.appendChild(opts);
      if (twenty.category) {
        const input = document.createElement("input");
        input.type = "text"; input.placeholder = "Something real from your life…";
        const btn = el("button", null, "Set Secret");
        btn.addEventListener("click", function () { if (input.value.trim()) twentySubmitSecret(input.value.trim()); });
        panel.appendChild(input); panel.appendChild(btn);
      }
      return;
    }

    if (!twenty.secret && myRole() !== twenty.pickerRole) {
      renderWaiting(panel, "Waiting for picker to set secret…");
      return;
    }

    panel.appendChild(el("p", "status-line", "Category: " + twenty.category + " · Questions: " + twenty.questionsUsed + "/20"));
    if (twenty.log.length) {
      const log = el("ul", "sk-history");
      twenty.log.forEach(function (entry) {
        log.appendChild(el("li", null, entry.question + " → " + entry.answer));
      });
      panel.appendChild(log);
    }

    if (myRole() !== twenty.pickerRole) {
      const pending = twenty.log.length && twenty.log[twenty.log.length - 1].answer === undefined;
      if (!pending) {
        const input = document.createElement("input");
        input.type = "text"; input.placeholder = "Ask a yes/no question…";
        const btn = el("button", null, "Ask");
        btn.addEventListener("click", function () {
          if (!input.value.trim()) return;
          twentyAskQuestion(input.value.trim());
        });
        panel.appendChild(input); panel.appendChild(btn);
      }
      if (twenty.guessAttempt) renderWaiting(panel, "Waiting for picker to confirm guess…");
      else {
        const gInput = document.createElement("input");
        gInput.type = "text"; gInput.placeholder = "Full guess…";
        const gBtn = el("button", "secondary", "Guess It");
        gBtn.addEventListener("click", function () { if (gInput.value.trim()) twentyGuess(gInput.value.trim()); });
        panel.appendChild(gInput); panel.appendChild(gBtn);
      }
    } else {
      const pending = twenty.log.length && twenty.log[twenty.log.length - 1].answer === undefined;
      if (pending) {
        panel.appendChild(el("p", "status-line", "Q: " + twenty.log[twenty.log.length - 1].question));
        const row = el("div", "row");
        ["yes", "no", "sometimes"].forEach(function (a) {
          const btn = el("button", "secondary", a.charAt(0).toUpperCase() + a.slice(1));
          btn.addEventListener("click", function () { twentyAnswer(a); });
          row.appendChild(btn);
        });
        panel.appendChild(row);
      }
      if (twenty.guessAttempt) {
        panel.appendChild(el("p", "status-line", "Guess: " + twenty.guessAttempt));
        const row = el("div", "row");
        const ok = el("button", null, "Correct!");
        ok.addEventListener("click", function () { twentyConfirmGuess(true); });
        const no = el("button", "secondary", "Not quite");
        no.addEventListener("click", function () { twentyConfirmGuess(false); twenty.guessAttempt = null; });
        row.appendChild(ok); row.appendChild(no);
        panel.appendChild(row);
      } else if (!pending) renderWaiting(panel, "Waiting for a question…");
    }
  }

  /* ---- 4.8 Two Truths and a Lie ---- */
  function truthsLieDrawTheme() {
    if (!isGameHost()) { send({ type: "skTruthsLieThemeRequest" }); return; }
    const theme = popDeck("truthsLieThemes", TRUTHS_LIE_THEMES);
    truthslie.themePrompt = theme;
    send({ type: "skTruthsLieTheme", payload: { theme: theme } });
    if (activeGameId === "truthslie") render("truthslie");
  }

  function truthsLieSubmit(statements) {
    if (myRole() !== truthslie.tellerRole) return;
    truthslie.statements = statements;
    send({ type: "skTruthsLieSubmit", payload: { statements: statements } });
    if (activeGameId === "truthslie") render("truthslie");
  }

  function truthsLieGuess(index) {
    if (myRole() === truthslie.tellerRole) return;
    truthslie.guess = index;
    truthslie.revealed = true;
    const lieIdx = truthslie.statements.findIndex(function (s) { return s && s.isLie; });
    const correct = index === lieIdx;
    send({ type: "skTruthsLieReveal", payload: { guess: index, correct: correct } });
    if (correct) {
      bumpGuessStreak(myRole());
      openBadgePicker(myRole(), "mind-reader");
    } else resetGuessStreak(myRole());
    if (activeGameId === "truthslie") render("truthslie");
  }

  function truthsLieNextRound() {
    if (!isGameHost()) return;
    truthslie.tellerRole = oppRole(truthslie.tellerRole);
    truthslie.themePrompt = null;
    truthslie.statements = [null, null, null];
    truthslie.guess = null;
    truthslie.revealed = false;
    syncFull();
    if (activeGameId === "truthslie") render("truthslie");
  }

  function renderTruthsLie(panel) {
    renderPanelHeader(panel, "🎭 Two Truths and a Lie", "truthslie");
    renderTurnBadge(panel, truthslie.tellerRole, "Teller: " + nameForRole(truthslie.tellerRole));

    if (truthslie.revealed) {
      truthslie.statements.forEach(function (s, i) {
        const card = el("div", "reveal-card" + (s.isLie ? " is-lie" : ""));
        card.appendChild(el("p", null, (i + 1) + ". " + s.text + (s.isLie ? " (LIE)" : "")));
        panel.appendChild(card);
      });
      if (isGameHost()) {
        const next = el("button", null, "Next Round");
        next.addEventListener("click", truthsLieNextRound);
        panel.appendChild(next);
      }
      return;
    }

    if (myRole() === truthslie.tellerRole && !truthslie.statements[0]) {
      if (!truthslie.themePrompt) {
        const btn = el("button", "secondary", "Draw Theme (optional)");
        btn.addEventListener("click", truthsLieDrawTheme);
        panel.appendChild(btn);
      } else panel.appendChild(el("p", "status-line", "Theme: " + truthslie.themePrompt));
      panel.appendChild(el("p", "status-line", "Write 3 statements — mark exactly one lie:"));
      const inputs = [0, 1, 2].map(function () {
        const inp = document.createElement("input");
        inp.type = "text"; inp.placeholder = "Statement…";
        return inp;
      });
      const lieSelect = document.createElement("select");
      [0, 1, 2].forEach(function (i) {
        const opt = document.createElement("option");
        opt.value = String(i); opt.textContent = "Statement " + (i + 1) + " is the lie";
        lieSelect.appendChild(opt);
      });
      inputs.forEach(function (inp) { panel.appendChild(inp); });
      panel.appendChild(lieSelect);
      const btn = el("button", null, "Submit");
      btn.addEventListener("click", function () {
        const lieIdx = parseInt(lieSelect.value, 10);
        const stmts = inputs.map(function (inp, i) {
          return { text: inp.value.trim(), isLie: i === lieIdx };
        });
        if (stmts.some(function (s) { return !s.text; })) { toast("Fill all three."); return; }
        truthsLieSubmit(stmts);
      });
      panel.appendChild(btn);
      return;
    }

    if (truthslie.statements[0] && myRole() !== truthslie.tellerRole) {
      panel.appendChild(el("p", "status-line", "Which is the lie?"));
      truthslie.statements.forEach(function (s, i) {
        const btn = el("button", "secondary", (i + 1) + ". " + s.text);
        btn.addEventListener("click", function () { truthsLieGuess(i); });
        panel.appendChild(btn);
      });
      return;
    }
    renderWaiting(panel, "Waiting for teller…");
  }

  /* ---- 4.9 This or That ---- */
  function thisOrThatStart() {
    if (!isGameHost()) { send({ type: "skThisOrThatDrawRequest" }); return; }
    const pair = popDeck("thisOrThat", THIS_OR_THAT_PAIRS);
    thisorthat.pair = pair;
    thisorthat.pickA = null;
    thisorthat.pickB = null;
    thisorthat.revealed = false;
    send({ type: "skThisOrThatPrompt", payload: { pair: pair } });
    if (activeGameId === "thisorthat") render("thisorthat");
  }

  function thisOrThatPick(choice) {
    if (myRole() === "host") thisorthat.pickA = choice;
    else thisorthat.pickB = choice;
    send({ type: "skThisOrThatPick", payload: { role: myRole(), choice: choice } });
    if (isGameHost()) thisOrThatMaybeReveal();
    if (activeGameId === "thisorthat") render("thisorthat");
  }

  function thisOrThatMaybeReveal() {
    if (thisorthat.pickA !== null && thisorthat.pickB !== null) {
      thisorthat.revealed = true;
      const match = thisorthat.pickA === thisorthat.pickB;
      if (match) {
        thisorthat.streakCount++;
        if (thisorthat.streakCount % 5 === 0) openBadgePicker("host", "same-brain");
      } else thisorthat.streakCount = 0;
      send({ type: "skThisOrThatReveal", payload: { pickA: thisorthat.pickA, pickB: thisorthat.pickB, streakCount: thisorthat.streakCount, match: match } });
      if (activeGameId === "thisorthat") render("thisorthat");
    }
  }

  function renderThisOrThat(panel) {
    renderPanelHeader(panel, "⚡ This or That", "thisorthat");
    panel.appendChild(el("p", "status-line score-pop", "Streak: " + thisorthat.streakCount));
    if (!thisorthat.pair) {
      const btn = el("button", null, isGameHost() ? "Next Pair" : "Waiting…");
      btn.disabled = !isGameHost();
      btn.addEventListener("click", thisOrThatStart);
      panel.appendChild(btn);
      return;
    }
    if (thisorthat.revealed) {
      panel.appendChild(flipReveal(nameForRole("host"), thisorthat.pair[thisorthat.pickA], nameForRole("joiner"), thisorthat.pair[thisorthat.pickB]));
      panel.appendChild(el("p", "status-line", thisorthat.pickA === thisorthat.pickB ? "Match! 🔥" : "Different picks."));
      if (isGameHost()) {
        const next = el("button", null, "Next Pair");
        next.addEventListener("click", thisOrThatStart);
        panel.appendChild(next);
      }
      return;
    }
    const pick = myRole() === "host" ? thisorthat.pickA : thisorthat.pickB;
    if (pick !== null) renderWaiting(panel, "Locked — waiting for partner…");
    else {
      const row = el("div", "row");
      const a = el("button", "secondary", "A: " + thisorthat.pair.a);
      a.addEventListener("click", function () { thisOrThatPick("a"); });
      const b = el("button", "secondary", "B: " + thisorthat.pair.b);
      b.addEventListener("click", function () { thisOrThatPick("b"); });
      row.appendChild(a); row.appendChild(b);
      panel.appendChild(row);
    }
  }

  /* ---- 4.10 Story Chain ---- */
  function storyChainStart() {
    if (!isGameHost()) { send({ type: "skStoryChainStartRequest" }); return; }
    const starter = popDeck("storyStarters", STORY_STARTERS);
    storychain.starter = starter;
    storychain.sentences = [{ author: "starter", text: starter }];
    storychain.turn = "host";
    send({ type: "skStoryChainStart", payload: { starter: starter, sentences: storychain.sentences.slice() } });
    if (activeGameId === "storychain") render("storychain");
  }

  function storyChainAddSentence(text, withTwist) {
    let twistText = null;
    if (withTwist) {
      twistText = popDeck("storyTwists", STORY_TWISTS);
      storychain.sentences.push({ author: "twist", text: twistText });
    }
    storychain.sentences.push({ author: myRole(), text: text });
    storychain.turn = oppRole(storychain.turn);
    send({ type: "skStoryChainAdd", payload: { sentences: storychain.sentences.slice(), turn: storychain.turn } });
    if (activeGameId === "storychain") render("storychain");
  }

  function storyChainEnd() {
    storychain.sentences.push({ author: "end", text: "THE END." });
    send({ type: "skStoryChainEnd", payload: { sentences: storychain.sentences.slice() } });
    if (activeGameId === "storychain") render("storychain");
  }

  function renderStoryChain(panel) {
    renderPanelHeader(panel, "📖 Story Chain", "storychain");
    if (!storychain.starter) {
      const btn = el("button", null, isGameHost() ? "Start Story" : "Waiting…");
      btn.disabled = !isGameHost();
      btn.addEventListener("click", storyChainStart);
      panel.appendChild(btn);
      return;
    }
    const story = el("div", "pg-story");
    storychain.sentences.forEach(function (s) {
      story.appendChild(el("p", "pg-story-line", s.text));
    });
    panel.appendChild(story);
    const ended = storychain.sentences.some(function (s) { return s.author === "end"; });
    if (ended) return;
    renderTurnBadge(panel, storychain.turn, "Adding: " + nameForRole(storychain.turn));
    if (myRole() === storychain.turn) {
      const input = document.createElement("input");
      input.type = "text"; input.placeholder = "One sentence…";
      const add = el("button", null, "Add Sentence");
      add.addEventListener("click", function () { if (input.value.trim()) storyChainAddSentence(input.value.trim(), false); });
      const twist = el("button", "secondary", "Draw a Twist + Sentence");
      twist.addEventListener("click", function () { if (input.value.trim()) storyChainAddSentence(input.value.trim(), true); });
      const end = el("button", "ghost", "THE END");
      end.addEventListener("click", storyChainEnd);
      panel.appendChild(input); panel.appendChild(add); panel.appendChild(twist); panel.appendChild(end);
    } else renderWaiting(panel, "Waiting for " + nameForRole(storychain.turn) + "…");
  }

  /* ---- 4.11 Hidden Gems ---- */
  function gemCellId(row, col) { return row + col; }

  function gemsSubmitGrid(grid) {
    gems.myGrid = grid;
    if (isGameHost()) hostGrids[myRole()] = grid;
    send({ type: "skGemsSetup", payload: { role: myRole(), grid: grid } });
    gems.setupDone[myRole()] = true;
    if (gems.setupDone.host && gems.setupDone.joiner) {
      gems.phase = "play";
      if (isGameHost()) send({ type: "skGemsPlayStart", payload: {} });
    }
    if (activeGameId === "gems") render("gems");
  }

  function gemsGuess(cell) {
    if (gems.turn !== myRole()) { toast("Not your turn."); return; }
    send({ type: "skGemsGuess", payload: { cell: cell, from: myRole() } });
  }

  function gemsRespond(cell, from) {
    const grid = gems.myGrid;
    const hit = grid && grid[cell] && grid[cell].prompt;
    const payload = { cell: cell, hit: !!hit, reveal: hit ? grid[cell] : null, from: from };
    send({ type: "skGemsResult", payload: payload });
    if (hit) {
      if (from === "host") gems.oppGemsFound++;
      else gems.myGemsFound++;
    }
    gems.lastResult = payload;
    gems.turn = oppRole(gems.turn);
    if (gems.myGemsFound >= 5 || gems.oppGemsFound >= 5) {
      gems.winner = gems.myGemsFound >= 5 ? myRole() : oppRole(myRole());
      celebrate("Hidden Gems! 🗺️", nameForRole(gems.winner) + " found all 5 gems!");
    }
    if (activeGameId === "gems") render("gems");
  }

  function renderGemsSetup(panel) {
    panel.appendChild(el("p", "status-line", "Pick 5 prompts, answer each, place on your secret 5×5 grid:"));
    const selected = gems.setupDraft || { prompts: [], placements: {} };
    if (!gems.setupDraft) gems.setupDraft = selected;

    const promptRow = el("div", "sk-option-grid");
    GEM_PROMPTS.forEach(function (p) {
      const btn = el("button", "secondary" + (selected.prompts.indexOf(p) >= 0 ? " active" : ""), p);
      btn.addEventListener("click", function () {
        const idx = selected.prompts.indexOf(p);
        if (idx >= 0) selected.prompts.splice(idx, 1);
        else if (selected.prompts.length < 5) selected.prompts.push(p);
        render("gems");
      });
      promptRow.appendChild(btn);
    });
    panel.appendChild(promptRow);

    if (selected.prompts.length === 5) {
      selected.prompts.forEach(function (p, pi) {
        if (!selected.answers) selected.answers = {};
        if (!selected.answers[p]) {
          const inp = document.createElement("input");
          inp.type = "text"; inp.placeholder = "Answer for: " + p;
          const btn = el("button", "secondary", "Save");
          btn.addEventListener("click", function () {
            selected.answers[p] = inp.value.trim();
            render("gems");
          });
          panel.appendChild(inp); panel.appendChild(btn);
        }
      });
      const allAnswered = selected.prompts.every(function (p) { return selected.answers && selected.answers[p]; });
      if (allAnswered) {
        panel.appendChild(el("p", "status-line", "Click 5 cells to place gems (one per prompt):"));
        const gridEl = el("div", "pg-gem-grid");
        GEM_ROWS.forEach(function (row) {
          GEM_COLS.forEach(function (col) {
            const id = gemCellId(row, col);
            const placed = selected.placements[id];
            const cell = el("button", "gw-tile" + (placed ? " is-selected" : ""), id);
            cell.addEventListener("click", function () {
              const keys = Object.keys(selected.placements);
              if (selected.placements[id]) delete selected.placements[id];
              else if (keys.length < 5) {
                const unused = selected.prompts.find(function (p) {
                  return !Object.values(selected.placements).some(function (x) { return x.prompt === p; });
                });
                if (unused) selected.placements[id] = { prompt: unused, answer: selected.answers[unused] };
              }
              render("gems");
            });
            gridEl.appendChild(cell);
          });
        });
        panel.appendChild(gridEl);
        if (Object.keys(selected.placements).length === 5) {
          const btn = el("button", null, "Submit Grid");
          btn.addEventListener("click", function () {
            gemsSubmitGrid(Object.assign({}, selected.placements));
            delete gems.setupDraft;
          });
          panel.appendChild(btn);
        }
      }
    }
  }

  function renderGems(panel) {
    renderPanelHeader(panel, "🗺️ Hidden Gems", "gems");
    panel.appendChild(el("p", "status-line score-pop", "You found: " + gems.oppGemsFound + "/5 · They found: " + gems.myGemsFound + "/5"));

    if (gems.phase === "setup" || !gems.setupDone[myRole()]) {
      renderGemsSetup(panel);
      return;
    }

    if (!gems.setupDone.host || !gems.setupDone.joiner) {
      renderWaiting(panel, "Waiting for partner to finish setup…");
      return;
    }

    renderTurnBadge(panel, gems.turn, "Turn: " + nameForRole(gems.turn));

    if (gems.lastResult) {
      panel.appendChild(el("p", "status-line", gems.lastResult.hit ? "💎 Hit at " + gems.lastResult.cell + "!" : "Miss at " + gems.lastResult.cell));
      if (gems.lastResult.reveal) {
        panel.appendChild(el("div", "reveal-card", gems.lastResult.reveal.prompt + ": " + gems.lastResult.reveal.answer));
      }
    }

    if (gems.winner) {
      panel.appendChild(el("p", "status-line", nameForRole(gems.winner) + " found all 5 gems first!"));
      return;
    }

    if (gems.turn === myRole()) {
      panel.appendChild(el("p", "status-line", "Call a coordinate on their grid:"));
      const gridEl = el("div", "pg-gem-grid");
      GEM_ROWS.forEach(function (row) {
        GEM_COLS.forEach(function (col) {
          const id = gemCellId(row, col);
          const cell = el("button", "gw-tile", id);
          cell.addEventListener("click", function () { gemsGuess(id); });
          gridEl.appendChild(cell);
        });
      });
      panel.appendChild(gridEl);
    } else renderWaiting(panel, "Waiting for " + nameForRole(gems.turn) + "…");
  }

  /* ---- 4.12 Say Anything But That ---- */
  function sayAnythingDraw() {
    if (!isGameHost()) { send({ type: "skSayAnythingDrawRequest" }); return; }
    const entry = popDeck("sayAnything", SAY_ANYTHING_ENTRIES);
    sayanything.entry = entry;
    sayanything.solved = null;
    send({ type: "skSayAnythingPrompt", payload: { entry: entry, clueGiverRole: sayanything.clueGiverRole } });
    if (activeGameId === "sayanything") render("sayanything");
  }

  function sayAnythingSkip() {
    if (myRole() !== sayanything.clueGiverRole) return;
    if (sayanything.skipsUsed >= 3) { toast("No skips left."); return; }
    sayanything.skipsUsed++;
    sayAnythingDraw();
  }

  function sayAnythingSolved() {
    if (myRole() !== sayanything.clueGiverRole) return;
    sayanything.solved = true;
    bumpGuessStreak(oppRole(sayanything.clueGiverRole));
    openBadgePicker(oppRole(sayanything.clueGiverRole), "mind-reader");
    send({ type: "skSayAnythingSolved", payload: {} });
    if (activeGameId === "sayanything") render("sayanything");
  }

  function sayAnythingNextRole() {
    sayanything.clueGiverRole = oppRole(sayanything.clueGiverRole);
    sayanything.entry = null;
    sayanything.skipsUsed = 0;
    sayanything.solved = null;
    if (isGameHost()) sayAnythingDraw();
  }

  function renderSayAnything(panel) {
    renderPanelHeader(panel, "🗣️ Say Anything But That", "sayanything");
    renderTurnBadge(panel, sayanything.clueGiverRole, "Clue giver: " + nameForRole(sayanything.clueGiverRole));

    if (!sayanything.entry) {
      if (isGameHost()) sayAnythingDraw();
      else renderWaiting(panel, "Waiting for entry…");
      return;
    }

    if (myRole() === sayanything.clueGiverRole) {
      panel.appendChild(el("div", "prompt-box"));
      panel.appendChild(el("h3", null, "Word: " + sayanything.entry.word));
      panel.appendChild(el("p", "status-line", "Banned: " + sayanything.entry.banned.join(", ")));
      panel.appendChild(el("p", "status-line", "Describe out loud — guesser calls it verbally."));
      const row = el("div", "row");
      const got = el("button", null, "Got It!");
      got.addEventListener("click", sayAnythingSolved);
      const skip = el("button", "secondary", "Skip (" + (3 - sayanything.skipsUsed) + " left)");
      skip.addEventListener("click", sayAnythingSkip);
      row.appendChild(got); row.appendChild(skip);
      panel.appendChild(row);
    } else {
      panel.appendChild(el("p", "status-line waiting-pulse", "Listen and guess out loud — clue giver confirms when you get it."));
      if (sayanything.solved) panel.appendChild(el("p", "status-line", "Solved! 🎉"));
    }

    if (sayanything.solved && isGameHost()) {
      const next = el("button", null, "Next Entry");
      next.addEventListener("click", sayAnythingNextRole);
      panel.appendChild(next);
    }
  }

  /* ---- 4.13 Closer ---- */
  function closerNext() {
    const tierArr = CLOSER_TIERS[closer.tier];
    if (closer.index < tierArr.length - 1) {
      closer.index++;
    } else if (closer.tier < 3) {
      closer.tierReady = true;
    } else {
      closer.finished = true;
    }
    send({ type: "skCloserAdvance", payload: { tier: closer.tier, index: closer.index, finished: closer.finished, tierReady: closer.tierReady } });
    if (activeGameId === "closer") render("closer");
  }

  function closerUnlockTier() {
    closer.tier++;
    closer.index = 0;
    closer.tierReady = false;
    send({ type: "skCloserAdvance", payload: { tier: closer.tier, index: closer.index, finished: false, tierReady: false } });
    if (activeGameId === "closer") render("closer");
  }

  function renderCloser(panel) {
    renderPanelHeader(panel, "💬 Closer", "closer");
    if (!closer.started) closer.started = true;

    if (closer.finished) {
      panel.appendChild(el("div", "prompt-box closer-finish"));
      panel.appendChild(el("h3", null, "Thanks for being here."));
      panel.appendChild(el("p", null, "No confetti — just the conversation. That was the whole point."));
      return;
    }

    if (closer.tierReady) {
      panel.appendChild(el("p", "status-line", "Tier " + closer.tier + " complete."));
      const btn = el("button", null, "We're Ready for More");
      btn.addEventListener("click", closerUnlockTier);
      panel.appendChild(btn);
      return;
    }

    const q = CLOSER_TIERS[closer.tier][closer.index];
    panel.appendChild(el("p", "status-line", "Tier " + closer.tier + " · Question " + (closer.index + 1)));
    const box = el("div", "prompt-box");
    box.appendChild(el("h3", null, q));
    panel.appendChild(box);
    panel.appendChild(el("p", "status-line", "Read aloud and answer in conversation — nothing to type."));
    const next = el("button", null, closer.index < CLOSER_TIERS[closer.tier].length - 1 ? "Next Question" : (closer.tier < 3 ? "Finish Tier" : "Finish"));
    next.addEventListener("click", closerNext);
    panel.appendChild(next);
  }

  /* ---- Never Have I Ever ---- */
  function nevereverDraw() {
    if (!isGameHost()) { send({ type: "skNeverDrawRequest" }); return; }
    const card = popDeck("neverever", NEVER_HAVE_I_EVER);
    neverever.card = card;
    neverever.count++;
    send({ type: "skNeverPrompt", payload: { card: card, count: neverever.count } });
    if (activeGameId === "neverever") render("neverever");
  }

  function renderNeverEver(panel) {
    renderPanelHeader(panel, "🙈 Never Have I Ever", "neverever");
    if (!neverever.started) neverever.started = true;
    if (!neverever.card) {
      const btn = el("button", null, isGameHost() ? "Draw Card" : "Ask Host to Draw");
      btn.addEventListener("click", nevereverDraw);
      panel.appendChild(btn);
      panel.appendChild(el("p", "status-line", "If you've done it, put a finger down — or just talk through it."));
      return;
    }
    panel.appendChild(el("p", "status-line", "Card " + neverever.count));
    const box = el("div", "prompt-box");
    box.appendChild(el("h3", null, neverever.card));
    panel.appendChild(box);
    panel.appendChild(el("p", "status-line", "Read aloud. Discuss — no scorekeeping required."));
    const next = el("button", null, "Next Card");
    next.addEventListener("click", nevereverDraw);
    panel.appendChild(next);
  }

  /* ---- Would You Rather ---- */
  function wouldratherDraw() {
    if (!isGameHost()) { send({ type: "skWouldDrawRequest" }); return; }
    const card = popDeck("wouldrather", WOULD_YOU_RATHER);
    wouldrather.card = card;
    wouldrather.count++;
    send({ type: "skWouldPrompt", payload: { card: card, count: wouldrather.count } });
    if (activeGameId === "wouldrather") render("wouldrather");
  }

  function renderWouldRather(panel) {
    renderPanelHeader(panel, "🤔 Would You Rather", "wouldrather");
    if (!wouldrather.started) wouldrather.started = true;
    if (!wouldrather.card) {
      const btn = el("button", null, isGameHost() ? "Draw Card" : "Ask Host to Draw");
      btn.addEventListener("click", wouldratherDraw);
      panel.appendChild(btn);
      panel.appendChild(el("p", "status-line", "Both pick a side and defend it — chaos encouraged."));
      return;
    }
    panel.appendChild(el("p", "status-line", "Card " + wouldrather.count));
    const box = el("div", "prompt-box");
    box.appendChild(el("h3", null, wouldrather.card));
    panel.appendChild(box);
    panel.appendChild(el("p", "status-line", "Read aloud, choose your answer, then ask why."));
    const next = el("button", null, "Next Card");
    next.addEventListener("click", wouldratherDraw);
    panel.appendChild(next);
  }

  function prependWaitingBanner(panel) {
    if (hasPartner()) return;
    panel.insertBefore(
      el("p", "game-wait-banner", "Waiting for your partner — share your arena code. You can browse this game while you wait."),
      panel.firstChild
    );
  }

  function render(gameId) {
    const panel = api.panel(gameId);
    if (!panel) return;
    if (GAME_LIST.findIndex(function (g) { return g.id === gameId; }) === -1) return;
    activeGameId = gameId;
    panelFade(panel, function (p) {
      prependWaitingBanner(p);
      if (badgePicker) renderBadgePicker(p);
      if (gameId === "chaos") renderChaos(p);
      else if (gameId === "brain") renderBrain(p);
      else if (gameId === "lore") renderLore(p);
      else if (gameId === "thisorthat") renderThisOrThat(p);
      else if (gameId === "closer") renderCloser(p);
      else if (gameId === "neverever") renderNeverEver(p);
      else if (gameId === "wouldrather") renderWouldRather(p);
    });
  }

  function renderActive(gameId) {
    activeGameId = gameId;
    if (gameId) render(gameId);
  }

  const RESET_TYPES = {
    chaos: "skChaosReset", brain: "skBrainReset", defend: "skDefendReset", lore: "skLoreReset",
    dice: "skDiceReset", guesswho: "skGuessWhoReset", twenty: "skTwentyReset",
    truthslie: "skTruthsLieReset", thisorthat: "skThisOrThatReset", storychain: "skStoryChainReset",
    gems: "skGemsReset", sayanything: "skSayAnythingReset", closer: "skCloserReset",
    neverever: "skNeverReset", wouldrather: "skWouldReset"
  };

  function newGame(gameId) {
    if (!isGameHost()) { toast("Only the host can start a new game."); return; }
    resetGameState(gameId);
    send({ type: RESET_TYPES[gameId] || ("sk" + capitalize(gameId) + "Reset"), payload: exportGameState(gameId) });
    render(gameId);
    toast("New game started!");
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function exportGameState(gameId) {
    const map = {
      chaos: chaos, brain: brain, defend: defend, lore: lore, dice: dice,
      guesswho: guesswho, twenty: twenty, truthslie: truthslie, thisorthat: thisorthat,
      storychain: storychain, gems: gems, sayanything: sayanything, closer: closer,
      neverever: neverever, wouldrather: wouldrather
    };
    return { state: map[gameId], decks: decks };
  }

  function resetGameState(gameId) {
    if (!decks) decks = initDecks();
    if (gameId === "chaos") Object.assign(chaos, { started: true, answererRole: "host", card: null, answer: null, guess: null, revealed: false });
    else if (gameId === "brain") Object.assign(brain, { started: true, question: null, answers: { host: null, joiner: null }, revealed: false, match: false });
    else if (gameId === "defend") Object.assign(defend, { started: true, turn: "host", statement: null, bluffGuess: null, truthIsReal: null, verdict: null, revealed: false });
    else if (gameId === "lore") Object.assign(lore, { started: true, turn: "host", category: null, phase: "pick", secretDetail: null, detailGuess: null, story: null, followUp: null, followUpAnswer: null });
    else if (gameId === "dice") Object.assign(dice, { started: true, positions: { host: 0, joiner: 0 }, turn: "host", lastRoll: null, awaitingEffect: false, space: null, effect: null, recentCards: [], inline: null });
    else if (gameId === "guesswho") {
      Object.assign(guesswho, { started: true, subjectRole: "host", subjectReady: false, mySelections: null, resolved: {}, askedCount: 0, pendingTraits: {}, finalGuess: null, score: null, phase: "setup" });
      hostGuessWhoSelections.host = null;
      hostGuessWhoSelections.joiner = null;
    }
    else if (gameId === "twenty") Object.assign(twenty, { started: true, pickerRole: "host", category: null, secret: null, log: [], questionsUsed: 0, guessAttempt: null, resolved: null });
    else if (gameId === "truthslie") Object.assign(truthslie, { started: true, tellerRole: "host", themePrompt: null, statements: [null, null, null], guess: null, revealed: false });
    else if (gameId === "thisorthat") Object.assign(thisorthat, { started: true, pair: null, pickA: null, pickB: null, streakCount: 0, revealed: false });
    else if (gameId === "storychain") Object.assign(storychain, { started: true, turn: "host", sentences: [], starter: null });
    else if (gameId === "gems") {
      Object.assign(gems, { started: true, myGrid: null, setupDone: { host: false, joiner: false }, myGemsFound: 0, oppGemsFound: 0, turn: "host", lastResult: null, phase: "setup", winner: null });
      hostGrids.host = null; hostGrids.joiner = null;
    }
    else if (gameId === "sayanything") Object.assign(sayanything, { started: true, clueGiverRole: "host", entry: null, skipsUsed: 0, solved: null });
    else if (gameId === "closer") Object.assign(closer, { started: true, tier: 1, index: 0, finished: false, tierReady: false });
    else if (gameId === "neverever") Object.assign(neverever, { started: true, card: null, count: 0 });
    else if (gameId === "wouldrather") Object.assign(wouldrather, { started: true, card: null, count: 0 });
    if (gameId === "chaos") decks.chaos = shuffle(CHAOS_CARDS.slice());
    if (gameId === "brain") decks.brain = shuffle(SAME_BRAIN_CELL.map(function (item, i) { return Object.assign({}, item, { id: i }); }));
    if (gameId === "defend") decks.defend = shuffle(DEFEND_YOUR_TAKE.slice());
    if (gameId === "lore") decks.lore = shuffle(LORE_CATEGORIES.slice());
    if (gameId === "dice") { decks.chaos = shuffle(CHAOS_CARDS.slice()); decks.brain = shuffle(SAME_BRAIN_CELL.map(function (item, i) { return Object.assign({}, item, { id: i }); })); decks.defend = shuffle(DEFEND_YOUR_TAKE.slice()); }
    if (gameId === "neverever") decks.neverever = shuffle(NEVER_HAVE_I_EVER.slice());
    if (gameId === "wouldrather") decks.wouldrather = shuffle(WOULD_YOU_RATHER.slice());
  }

  function handleMessage(msg) {
    switch (msg.type) {
      case "skStateSync": importSync(msg.payload); break;
      default: handleGameMessage(msg);
    }
  }

  function handleGameMessage(msg) {
    switch (msg.type) {
      case "skBadgeAward":
        if (arenaBadges[msg.payload.to].indexOf(msg.payload.badgeId) === -1) arenaBadges[msg.payload.to].push(msg.payload.badgeId);
        badgePicker = null;
        notifyScoreboard();
        if (activeGameId) render(activeGameId);
        break;

      case "skChaosReset":
        Object.assign(chaos, msg.payload.state);
        decks = msg.payload.decks || decks;
        if (activeGameId === "chaos") render("chaos");
        break;
      case "skChaosDrawRequest":
        if (isGameHost()) {
          if (dice.inline && dice.inline.type === "chaos") chaosDraw();
          else chaosDraw();
        }
        break;
      case "skChaosPrompt":
        chaos.card = msg.payload.card;
        chaos.answererRole = msg.payload.answererRole;
        chaos.answer = null; chaos.guess = null; chaos.revealed = false;
        if (activeGameId === "chaos" || activeGameId === "dice") render(activeGameId);
        break;
      case "skChaosAnswer":
        chaos.answer = msg.payload.answer;
        if (isGameHost()) chaosMaybeReveal();
        else if (activeGameId === "chaos") render("chaos");
        break;
      case "skChaosGuess":
        chaos.guess = msg.payload.guess;
        if (isGameHost()) chaosMaybeReveal();
        else if (activeGameId === "chaos") render("chaos");
        break;
      case "skChaosReveal":
        chaos.revealed = true;
        chaos.answer = msg.payload.answer;
        chaos.guess = msg.payload.guess;
        if (activeGameId === "chaos" || activeGameId === "dice") render(activeGameId);
        break;

      case "skBrainReset":
        Object.assign(brain, msg.payload.state);
        decks = msg.payload.decks || decks;
        if (activeGameId === "brain") render("brain");
        break;
      case "skBrainDrawRequest":
        if (isGameHost()) brainStart();
        break;
      case "skBrainPrompt":
        brain.question = msg.payload.question;
        brain.answers = { host: null, joiner: null };
        brain.revealed = false;
        if (activeGameId === "brain" || activeGameId === "dice") render(activeGameId);
        break;
      case "skBrainAnswer":
        brain.answers[msg.payload.role] = msg.payload.choice;
        if (isGameHost()) brainMaybeReveal();
        else if (activeGameId === "brain") render("brain");
        break;
      case "skBrainReveal":
        brain.revealed = true;
        brain.match = msg.payload.match;
        brain.answers = msg.payload.answers;
        if (activeGameId === "brain" || activeGameId === "dice") render(activeGameId);
        break;

      case "skDefendReset":
        Object.assign(defend, msg.payload.state);
        decks = msg.payload.decks || decks;
        if (activeGameId === "defend") render("defend");
        break;
      case "skDefendDrawRequest":
        if (isGameHost()) defendDraw();
        break;
      case "skDefendPrompt":
        defend.turn = msg.payload.turn;
        defend.statement = msg.payload.statement;
        defend.bluffGuess = null;
        defend.truthIsReal = null;
        defend.verdict = null;
        defend.revealed = false;
        if (activeGameId === "defend" || activeGameId === "dice") render(activeGameId);
        break;
      case "skDefendBluffGuess":
        defend.bluffGuess = msg.payload.bluffGuess;
        if (activeGameId === "defend" || activeGameId === "dice") render(activeGameId);
        break;
      case "skDefendTruth":
        defend.truthIsReal = msg.payload.truthIsReal;
        if (activeGameId === "defend" || activeGameId === "dice") render(activeGameId);
        break;
      case "skDefendVerdict":
        defend.verdict = msg.payload.verdict;
        defend.revealed = true;
        if (activeGameId === "defend" || activeGameId === "dice") render(activeGameId);
        break;

      case "skLoreReset":
        Object.assign(lore, msg.payload.state);
        decks = msg.payload.decks || decks;
        if (activeGameId === "lore") render("lore");
        break;
      case "skLoreDrawRequest":
        if (isGameHost()) loreDraw();
        break;
      case "skLorePrompt":
        lore.turn = msg.payload.turn;
        lore.category = msg.payload.category;
        lore.phase = "pick";
        if (activeGameId === "lore") render("lore");
        break;
      case "skLoreAnswer":
        lore.secretDetail = msg.payload.secretDetail;
        lore.story = msg.payload.story;
        lore.phase = "guess";
        if (activeGameId === "lore") render("lore");
        break;
      case "skLoreRaise":
        lore.secretDetail = msg.payload.secretDetail;
        lore.story = msg.payload.story;
        lore.followUp = msg.payload.followUp;
        lore.phase = "guess";
        if (activeGameId === "lore") render("lore");
        break;
      case "skLoreGuess":
        lore.detailGuess = msg.payload.guess;
        lore.phase = "reveal";
        if (activeGameId === "lore") render("lore");
        break;
      case "skLoreFollowUpAnswer":
        lore.followUpAnswer = msg.payload.answer;
        if (activeGameId === "lore") render("lore");
        break;

      case "skDiceReset":
        Object.assign(dice, msg.payload.state);
        decks = msg.payload.decks || decks;
        if (activeGameId === "dice") render("dice");
        break;
      case "skDiceRollRequest":
        if (isGameHost()) diceDoRoll();
        break;
      case "skDiceSync":
        dice.positions = msg.payload.dice.positions;
        dice.turn = msg.payload.dice.turn;
        dice.lastRoll = msg.payload.dice.lastRoll;
        dice.awaitingEffect = msg.payload.dice.awaitingEffect;
        dice.space = msg.payload.dice.space;
        dice.effect = msg.payload.dice.effect;
        dice.inline = msg.payload.dice.inline;
        dice.recentCards = msg.payload.recentCards || dice.recentCards;
        if (activeGameId === "dice") render("dice");
        break;

      case "skGuessWhoReset":
        Object.assign(guesswho, msg.payload.state);
        if (activeGameId === "guesswho") render("guesswho");
        break;
      case "skGuessWhoSetup":
        if (isGameHost()) hostGuessWhoSelections[msg.payload.role] = msg.payload.selections;
        if (msg.payload.role === guesswho.subjectRole) {
          guesswho.subjectReady = true;
          if (isGameHost()) guessWhoStartRound();
        }
        if (activeGameId === "guesswho") render("guesswho");
        break;
      case "skGuessWhoStart":
        guesswho.phase = "play";
        guesswho.resolved = {};
        guesswho.askedCount = 0;
        guesswho.pendingTraits = {};
        hostGuessWhoSelections[msg.payload.subjectRole] = msg.payload.selections;
        if (activeGameId === "guesswho") render("guesswho");
        break;
      case "skGuessWhoAsk":
        if (isGameHost()) guessWhoAnswer(msg.payload.traitIndex);
        break;
      case "skGuessWhoAnswer":
        guesswho.resolved[msg.payload.traitIndex] = msg.payload.answer;
        guesswho.askedCount++;
        if (activeGameId === "guesswho") render("guesswho");
        break;
      case "skGuessWhoLockRequest":
        if (isGameHost()) guessWhoFinalizeScore(msg.payload.predictions);
        break;
      case "skGuessWhoReveal":
        guesswho.finalGuess = msg.payload.finalGuess;
        guesswho.score = msg.payload.score;
        guesswho.phase = "score";
        if (msg.payload.selections) {
          hostGuessWhoSelections[guesswho.subjectRole] = msg.payload.selections;
        }
        if (activeGameId === "guesswho") render("guesswho");
        break;

      case "skTwentyReset":
        Object.assign(twenty, msg.payload.state);
        if (activeGameId === "twenty") render("twenty");
        break;
      case "skTwentySecret":
        if (isGameHost()) hostTwentySecrets[msg.payload.role] = msg.payload.secret;
        if (msg.payload.role === twenty.pickerRole) {
          twenty.category = msg.payload.category;
          twenty.secret = msg.payload.secret;
        }
        if (activeGameId === "twenty") render("twenty");
        break;
      case "skTwentyQuestion":
        twenty.log.push({ question: msg.payload.question, answer: undefined });
        if (activeGameId === "twenty") render("twenty");
        break;
      case "skTwentyAnswer":
        twenty.log = msg.payload.log;
        twenty.questionsUsed = msg.payload.questionsUsed;
        if (activeGameId === "twenty") render("twenty");
        break;
      case "skTwentyGuess":
        twenty.guessAttempt = msg.payload.guess;
        if (activeGameId === "twenty") render("twenty");
        break;
      case "skTwentyEnd":
        twenty.resolved = msg.payload.resolved;
        if (activeGameId === "twenty") render("twenty");
        break;

      case "skTruthsLieReset":
        Object.assign(truthslie, msg.payload.state);
        decks = msg.payload.decks || decks;
        if (activeGameId === "truthslie") render("truthslie");
        break;
      case "skTruthsLieThemeRequest":
        if (isGameHost()) truthsLieDrawTheme();
        break;
      case "skTruthsLieTheme":
        truthslie.themePrompt = msg.payload.theme;
        if (activeGameId === "truthslie") render("truthslie");
        break;
      case "skTruthsLieSubmit":
        truthslie.statements = msg.payload.statements;
        if (activeGameId === "truthslie") render("truthslie");
        break;
      case "skTruthsLieReveal":
        truthslie.guess = msg.payload.guess;
        truthslie.revealed = true;
        if (activeGameId === "truthslie") render("truthslie");
        break;

      case "skThisOrThatReset":
        Object.assign(thisorthat, msg.payload.state);
        decks = msg.payload.decks || decks;
        if (activeGameId === "thisorthat") render("thisorthat");
        break;
      case "skThisOrThatDrawRequest":
        if (isGameHost()) thisOrThatStart();
        break;
      case "skThisOrThatPrompt":
        thisorthat.pair = msg.payload.pair;
        thisorthat.pickA = null;
        thisorthat.pickB = null;
        thisorthat.revealed = false;
        if (activeGameId === "thisorthat") render("thisorthat");
        break;
      case "skThisOrThatPick":
        if (msg.payload.role === "host") thisorthat.pickA = msg.payload.choice;
        else thisorthat.pickB = msg.payload.choice;
        if (isGameHost()) thisOrThatMaybeReveal();
        else if (activeGameId === "thisorthat") render("thisorthat");
        break;
      case "skThisOrThatReveal":
        thisorthat.revealed = true;
        thisorthat.pickA = msg.payload.pickA;
        thisorthat.pickB = msg.payload.pickB;
        thisorthat.streakCount = msg.payload.streakCount;
        if (activeGameId === "thisorthat") render("thisorthat");
        break;

      case "skStoryChainReset":
        Object.assign(storychain, msg.payload.state);
        decks = msg.payload.decks || decks;
        if (activeGameId === "storychain") render("storychain");
        break;
      case "skStoryChainStartRequest":
        if (isGameHost()) storyChainStart();
        break;
      case "skStoryChainStart":
        storychain.starter = msg.payload.starter;
        storychain.sentences = msg.payload.sentences;
        if (activeGameId === "storychain") render("storychain");
        break;
      case "skStoryChainAdd":
        storychain.sentences = msg.payload.sentences;
        storychain.turn = msg.payload.turn;
        if (activeGameId === "storychain") render("storychain");
        break;
      case "skStoryChainEnd":
        storychain.sentences = msg.payload.sentences;
        if (activeGameId === "storychain") render("storychain");
        break;

      case "skGemsReset":
        Object.assign(gems, msg.payload.state);
        hostGrids.host = null;
        hostGrids.joiner = null;
        if (activeGameId === "gems") render("gems");
        break;
      case "skGemsSetup":
        if (isGameHost()) hostGrids[msg.payload.role] = msg.payload.grid;
        gems.setupDone[msg.payload.role] = true;
        if (gems.setupDone.host && gems.setupDone.joiner) gems.phase = "play";
        if (activeGameId === "gems") render("gems");
        break;
      case "skGemsPlayStart":
        gems.phase = "play";
        if (activeGameId === "gems") render("gems");
        break;
      case "skGemsGuess":
        if (msg.payload.from === myRole()) break;
        gemsRespond(msg.payload.cell, msg.payload.from);
        break;
      case "skGemsResult":
        gems.lastResult = msg.payload;
        if (msg.payload.hit) {
          if (msg.payload.from === "host") gems.oppGemsFound++;
          else gems.myGemsFound++;
        }
        gems.turn = oppRole(gems.turn);
        if (activeGameId === "gems") render("gems");
        break;

      case "skSayAnythingReset":
        Object.assign(sayanything, msg.payload.state);
        decks = msg.payload.decks || decks;
        if (activeGameId === "sayanything") render("sayanything");
        break;
      case "skSayAnythingDrawRequest":
        if (isGameHost()) sayAnythingDraw();
        break;
      case "skSayAnythingPrompt":
        sayanything.entry = msg.payload.entry;
        sayanything.clueGiverRole = msg.payload.clueGiverRole;
        sayanything.solved = null;
        if (activeGameId === "sayanything") render("sayanything");
        break;
      case "skSayAnythingSolved":
        sayanything.solved = true;
        if (activeGameId === "sayanything") render("sayanything");
        break;

      case "skCloserReset":
        Object.assign(closer, msg.payload.state);
        if (activeGameId === "closer") render("closer");
        break;
      case "skCloserAdvance":
        closer.tier = msg.payload.tier;
        closer.index = msg.payload.index;
        closer.finished = msg.payload.finished;
        closer.tierReady = msg.payload.tierReady;
        if (activeGameId === "closer") render("closer");
        break;

      case "skNeverReset":
        Object.assign(neverever, msg.payload.state);
        decks = msg.payload.decks || decks;
        if (activeGameId === "neverever") render("neverever");
        break;
      case "skNeverDrawRequest":
        if (isGameHost()) nevereverDraw();
        break;
      case "skNeverPrompt":
        neverever.card = msg.payload.card;
        neverever.count = msg.payload.count;
        if (activeGameId === "neverever") render("neverever");
        break;

      case "skWouldReset":
        Object.assign(wouldrather, msg.payload.state);
        decks = msg.payload.decks || decks;
        if (activeGameId === "wouldrather") render("wouldrather");
        break;
      case "skWouldDrawRequest":
        if (isGameHost()) wouldratherDraw();
        break;
      case "skWouldPrompt":
        wouldrather.card = msg.payload.card;
        wouldrather.count = msg.payload.count;
        if (activeGameId === "wouldrather") render("wouldrather");
        break;
    }
  }

  function setActiveId(gameId) {
    activeGameId = gameId || null;
  }

  return {
    init: function (opts) {
      api = opts;
      decks = initDecks();
    },
    handleMessage: handleMessage,
    render: render,
    renderActive: renderActive,
    setActiveId: setActiveId,
    GAME_LIST: GAME_LIST,
    newGame: newGame,
    importSync: importSync,
    exportScoreboard: exportScoreboard,
    syncFull: syncFull,
    drawPrompt: drawPrompt
  };
})();
