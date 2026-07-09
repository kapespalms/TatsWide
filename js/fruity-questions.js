/**
 * Get Fruity — multiple-choice question banks + reveal flair copy.
 */
window.FruityQuestions = (function () {
  "use strict";

  const SELF_QUESTIONS = [
    {
      id: "self_inconvenience",
      prompt: "What is my exact reaction when a minor inconvenience happens (like dropping my phone)?",
      options: [
        { id: "A", text: "Stare at the floor in complete, silent existential dread for two minutes." },
        { id: "B", text: "Laugh maniacally like a villain whose master plan just failed." },
        { id: "C", text: "Immediately blame Mercury retrograde, even if it's June." },
        { id: "D", text: "Absorb the rage and let it power my entire personality for the next four hours." }
      ]
    },
    {
      id: "self_bedroom",
      prompt: "What does my bedroom look like right now?",
      options: [
        { id: "A", text: "A minimalist museum where everything is color-coded." },
        { id: "B", text: "An absolute disaster zone that looks like a raccoon went searching for snacks." },
        { id: "C", text: "Clean everywhere except for \"The Chair\" holding 4 weeks of laundry." },
        { id: "D", text: "Mostly plants and empty coffee cups; the bed is optional." }
      ]
    },
    {
      id: "self_apocalypse",
      prompt: "If the apocalypse happens tomorrow, what is my survival strategy?",
      options: [
        { id: "A", text: "Die in the first ten minutes because I tried to pet a mutant raccoon." },
        { id: "B", text: "Become the charismatic, slightly unhinged leader of a wasteland cult." },
        { id: "C", text: "Hide in my apartment with 40 cans of beans and refuse to look outside." },
        { id: "D", text: "Accidentally survive until the very end through pure, delusional luck." }
      ]
    },
    {
      id: "self_hobbies",
      prompt: "How many abandoned hobbies are currently rotting in my closet?",
      options: [
        { id: "A", text: "0–2 (I have terrifyingly good impulse control)." },
        { id: "B", text: "3–5 (A normal amount of hyperfixation shame)." },
        { id: "C", text: "6–10 (Crochet needles, roller skates, oil paints—you name it)." },
        { id: "D", text: "I have lost count; my closet is a graveyard of short-lived obsessions." }
      ]
    },
    {
      id: "self_crush",
      prompt: "What is my most shameful, completely indefensible celebrity crush?",
      options: [
        { id: "A", text: "A controversial cartoon character from my childhood." },
        { id: "B", text: "A toxic reality TV villain who deserves zero rights." },
        { id: "C", text: "An aging, chaotic actor who looks like they haven't slept since 1997." },
        { id: "D", text: "A deeply generic, boring mainstream celebrity (the shame is the lack of taste)." }
      ]
    },
    {
      id: "self_food",
      prompt: "What is my weirdest, most unhinged food craving?",
      options: [
        { id: "A", text: "Putting hot sauce on things that absolutely do not require hot sauce." },
        { id: "B", text: "Eating block cheese over the sink like a medieval peasant at 3:00 AM." },
        { id: "C", text: "Dipping French fries into a chocolate milkshake (a classic, but chaotic)." },
        { id: "D", text: "Mixing sweet and savory options together until it looks actively upsetting." }
      ]
    },
    {
      id: "self_redflag",
      prompt: "What is my biggest dating app red flag that I try to disguise as a quirk?",
      options: [
        { id: "A", text: "I will absolutely double-text you a chaotic meme if you don't reply within 4 hours." },
        { id: "B", text: "I look like a gentle sub but I am actually a bossy top who will control your life." },
        { id: "C", text: "I have an incredibly low tolerance for boring banter and might say something unhinged." },
        { id: "D", text: "I am secretly shopping for a future wife on day one but pretend I'm just \"seeing where things go.\"" }
      ]
    },
    {
      id: "self_pda",
      prompt: "What is my exact attitude toward public displays of affection (PDA)?",
      options: [
        { id: "A", text: "Completely shameless; I will kiss you in the middle of a crowded grocery store aisle." },
        { id: "B", text: "Strictly low-key; a subtle hand on your thigh under the table is maximum effort." },
        { id: "C", text: "Only if it feels slightly thrilling, like a quick kiss where we might get caught." },
        { id: "D", text: "I will hold your hand but get intensely flustered if you kiss my cheek in public." }
      ]
    },
    {
      id: "self_ghost",
      prompt: "What would my ghost do if I were sent to haunt a house?",
      options: [
        { id: "A", text: "Mildly inconvenience people by hiding their car keys in the fridge." },
        { id: "B", text: "Shatter all the glassware whenever someone plays terrible music." },
        { id: "C", text: "Just sit on the kitchen counter at night and try to make conversation." },
        { id: "D", text: "Aggressively reorganize the pantry by expiration date." }
      ]
    },
    {
      id: "self_swipe",
      prompt: "Why did I actually swipe right on your profile?",
      options: [
        { id: "A", text: "Your energy genuinely frightened and excited me." },
        { id: "B", text: "I saw one specific obscure reference and decided we are soulmates." },
        { id: "C", text: "You looked like you could successfully defend me in a grocery store fight." },
        { id: "D", text: "Total accident, but now I am fully invested in this chaotic experiment." }
      ]
    }
  ];

  const PARTNER_QUESTIONS = [
    {
      id: "partner_arrest",
      prompt: "If they got arrested, what would the charge most likely be?",
      options: [
        { id: "A", text: "Grand theft eco-friendly houseplant from a corporate lobby." },
        { id: "B", text: "Unsanctioned public disturbance while defending a niche pop-culture theory." },
        { id: "C", text: "Committing petty tax fraud purely because the math was too annoying." },
        { id: "D", text: "Trespassing in a cemetery at 2:00 AM because \"the vibe was immaculate.\"" }
      ]
    },
    {
      id: "partner_inconvenience",
      prompt: "What is their exact reaction when a minor inconvenience happens (like dropping their phone)?",
      options: [
        { id: "A", text: "Stare at the floor in complete, silent existential dread for two minutes." },
        { id: "B", text: "Laugh maniacally like a villain whose master plan just failed." },
        { id: "C", text: "Immediately blame Mercury retrograde, even if it's June." },
        { id: "D", text: "Absorb the rage and let it power their entire personality for four hours." }
      ]
    },
    {
      id: "partner_bedroom",
      prompt: "What does their bedroom look like right now?",
      options: [
        { id: "A", text: "A minimalist museum where everything is color-coded." },
        { id: "B", text: "An absolute disaster zone that looks like a raccoon went searching for snacks." },
        { id: "C", text: "Clean everywhere except for \"The Chair\" holding 4 weeks of laundry." },
        { id: "D", text: "Mostly plants and empty coffee cups; the bed is optional." }
      ]
    },
    {
      id: "partner_apocalypse",
      prompt: "If the apocalypse happens tomorrow, what is their survival strategy?",
      options: [
        { id: "A", text: "Die in the first ten minutes because they tried to pet a mutant raccoon." },
        { id: "B", text: "Become the charismatic, slightly unhinged leader of a wasteland cult." },
        { id: "C", text: "Hide in their apartment with 40 cans of beans and refuse to look outside." },
        { id: "D", text: "Accidentally survive until the very end through pure, delusional luck." }
      ]
    },
    {
      id: "partner_hobbies",
      prompt: "How many abandoned hobbies are currently rotting in their closet?",
      options: [
        { id: "A", text: "0–2 (Terrifyingly good impulse control)." },
        { id: "B", text: "3–5 (A normal amount of hyperfixation shame)." },
        { id: "C", text: "6–10 (Crochet needles, roller skates, oil paints—you name it)." },
        { id: "D", text: "They have lost count; the closet is a graveyard of short-lived obsessions." }
      ]
    },
    {
      id: "partner_woods",
      prompt: "If you got completely lost in the woods on a first date, what are they doing?",
      options: [
        { id: "A", text: "Crying immediately while trying to find a cell signal." },
        { id: "B", text: "Confidently leading you deeper into danger while insisting \"I know a shortcut.\"" },
        { id: "C", text: "Foraging for random berries and mushrooms with zero botanical knowledge." },
        { id: "D", text: "Proposing you build a cabin and live there forever to avoid responsibilities." }
      ]
    },
    {
      id: "partner_swipe",
      prompt: "Why did they actually swipe right on your profile?",
      options: [
        { id: "A", text: "Your energy genuinely frightened and excited them." },
        { id: "B", text: "They saw one obscure reference and decided you are soulmates." },
        { id: "C", text: "You looked like you could defend them in a grocery store fight." },
        { id: "D", text: "Total accident, but now they are fully invested in this chaotic experiment." }
      ]
    },
    {
      id: "partner_flirty_dm",
      prompt: "What kind of vibe do they give off when things get flirty in the DMs?",
      options: [
        { id: "A", text: "High-energy chaotic; five text bubbles in a row about how hot you are." },
        { id: "B", text: "The smooth operator; one devastatingly charming line that ruins your sleep schedule." },
        { id: "C", text: "Accidental menace; a wildly suggestive comment then logging off for three hours." },
        { id: "D", text: "The sweet talker; lots of teasing, compliments, and playful emojis." }
      ]
    },
    {
      id: "partner_first_date",
      prompt: "If they find you incredibly attractive on your first date, how are they handling it?",
      options: [
        { id: "A", text: "Blurring it out immediately with zero filter because they cannot hold it in." },
        { id: "B", text: "Becoming intensely sarcastic and teasing you mercilessly to mask panic." },
        { id: "C", text: "Making intense, lingering eye contact until you get flustered instead." },
        { id: "D", text: "Forgetting how words work and accidentally stumbling over their own feet." }
      ]
    },
    {
      id: "partner_cooking",
      prompt: "If you are cooking dinner together on a first date, what are they most likely to say?",
      options: [
        { id: "A", text: "\"I like it spicy, but let's see if you can handle the heat.\"" },
        { id: "B", text: "\"Don't worry, I'm excellent at handling melons.\"" },
        { id: "C", text: "\"I hope you're hungry, because the main course takes a lot of endurance.\"" },
        { id: "D", text: "\"You look like you know exactly what to do with a whisk.\"" }
      ]
    },
    {
      id: "partner_redflag",
      prompt: "What do you think their biggest dating app red flag is?",
      options: [
        { id: "A", text: "They will project past relationship trauma onto your innocent choice of font." },
        { id: "B", text: "Their profile makes them look outdoorsy, but their skin hasn't seen sunlight since 2024." },
        { id: "C", text: "Unhealthily fast reply speed that screams zero boundaries or hobbies." },
        { id: "D", text: "Secretly using the app as a free focus group for stand-up comedy ideas." }
      ]
    },
    {
      id: "partner_escape",
      prompt: "What is their actual strategy for winning a complex escape room?",
      options: [
        { id: "A", text: "Panicking silently in the corner while watching you do all the heavy lifting." },
        { id: "B", text: "Confidently trying to force open a locked door using raw, unnecessary strength." },
        { id: "C", text: "Overanalyzing a completely irrelevant piece of room decor for 45 minutes straight." },
        { id: "D", text: "Asking the game master for clues every three minutes because they value time over pride." }
      ]
    },
    {
      id: "partner_morning",
      prompt: "How do they usually act the morning after a wildly successful sleepover?",
      options: [
        { id: "A", text: "Immediately making you an elaborate breakfast while wearing your oversized hoodie." },
        { id: "B", text: "Needing to cuddle for at least an hour before their brain accepts that it's daytime." },
        { id: "C", text: "Waking up full of chaotic energy and immediately cracking jokes." },
        { id: "D", text: "Being incredibly shy and easily flustered all over again in the daylight." }
      ]
    },
    {
      id: "partner_dynamic",
      prompt: "What do you think their dynamic is in the bedroom?",
      options: [
        { id: "A", text: "The Pillow Princess; please pamper them, they have had a long week." },
        { id: "B", text: "The Domme/Top; they like taking total control and seeing you flustered." },
        { id: "C", text: "The Switch; completely dependent on the day, the vibe, and your energy." },
        { id: "D", text: "The Service Top; their entire mission is making sure you have the best time possible." }
      ]
    },
    {
      id: "partner_houseplants",
      prompt: "If they invite you over to see their \"houseplants,\" what are they actually suggesting?",
      options: [
        { id: "A", text: "They want to show you how well they can keep something wet and thriving." },
        { id: "B", text: "They need someone who isn't afraid to get their hands a little dirty." },
        { id: "C", text: "They want to see if you can handle something that grows rapidly under pressure." },
        { id: "D", text: "They literally just want you in their bedroom under false pretenses." }
      ]
    }
  ];

  const MATCH_FLAIRS = [
    { title: "PERFECT MATCH!", sub: "Are you… reading my mind or stalking me?", theme: "pink" },
    { title: "IMMACULATE VIBES!", sub: "The chemistry is giving soulmate energy. 1 Fruit awarded.", theme: "crimson" },
    { title: "ALGORITHMIC MIRACLE!", sub: "The dating app gods have smiled upon us. +1 Fruit.", theme: "matrix" },
    { title: "SYNCHRONIZED! 👾", sub: "Hive-mind status unlocked. +1 Fruit!", theme: "gold" },
    { title: "LIZARD BRAINS IN SYNC! 🦎", sub: "Our single shared neuron just fired perfectly. +1 Fruit.", theme: "lime" },
    { title: "U-HAUL DEPOSIT APPROVED! 🚚", sub: "We just agreed on a molecular level. +1 Fruit.", theme: "orange" },
    { title: "THE PROPHECY IS FULFILLED! 🕯️", sub: "We are legally soulmates in the eyes of the underworld. +1 Fruit.", theme: "ghost" },
    { title: "ALIEN SPECIES RE-EDUCATION CANCELLED! 🛸", sub: "The observers are pleased. They will not abduct us tonight. +1 Fruit.", theme: "blue" },
    { title: "🚨 MAXIMUM FREAK MATCH! 🚨", sub: "Our screens just melted. HR is drafting an email. +1 Fruit.", theme: "strobe" },
    { title: "🔥 SPONTANEOUS COMBUSTION! 🔥", sub: "We matched energy so fast the server room is on fire. +1 Fruit.", theme: "fire" },
    { title: "🐾 FERAL MIND MELD! 🐾", sub: "The absolute degeneracy of this match… I'm blushing at my router. +1 Fruit.", theme: "scratch" },
    { title: "🔮 THE SUCCUBUS SYMMETRY! 🔮", sub: "The dark forces aligned our impure thoughts perfectly. +1 Fruit.", theme: "velvet" }
  ];

  const MISMATCH_FLAIRS = [
    { title: "CHAOTIC INCOMPATIBILITY!", sub: "We are lowering your compatibility bar.", theme: "red" },
    { title: "THE VIBE IS OFF!", sub: "Opposites attract… right?", theme: "purple" },
    { title: "DELETING THE APP…", sub: "Complete mismatch. Pack it up.", theme: "grey" },
    { title: "SYSTEM ERROR! ❌", sub: "Data desync detected. 0 Fruit.", theme: "pixel" },
    { title: "GLITCH IN THE SIMULATION! 🌌", sub: "The FBI agent watching our webcams is deeply disappointed.", theme: "glitch" },
    { title: "FIGHTING OVER THE TRASH CAN! 🦝", sub: "Absolute feral mismatch. 0 Fruit.", theme: "raccoon" },
    { title: "EXILED FROM THE MANOR! 🏰", sub: "A curse upon both our houses. 0 Fruit.", theme: "blood" },
    { title: "SPECIES COMPATIBILITY FAILURE! 👽", sub: "The aliens decided Earth is a lost cause. 0 Fruit.", theme: "hazard" },
    { title: "🥶 COLD SHOWER REQUIRED! 🥶", sub: "The tension instantly evaporated. 0 Fruit.", theme: "ice" },
    { title: "💤 IMMEDIATE SNOOZE FEST! 💤", sub: "One of us is ready to cause problems and the other is asleep. 0 Fruit.", theme: "beige" },
    { title: "📉 SECKSUAL COMPATIBILITY CRASH! 📉", sub: "The algorithm just passed away from boredom. 0 Fruit.", theme: "dialup" },
    { title: "😇 ACCIDENTAL PURITY CALIBRATION! 😇", sub: "A tragic desync. 0 Fruit.", theme: "holy" }
  ];

  let selfIdx = 0;
  let partnerIdx = 0;
  let textIdx = 0;
  let wmIdx = 0;
  let ultIdx = 0;
  let ultQIdx = 0;

  const TEXT_SELF_QUESTIONS = [
    {
      id: "text_lore",
      prompt: "In one sentence: what's the most unhinged thing you've done for love?",
      placeholder: "Type your answer…"
    },
    {
      id: "text_greenflag",
      prompt: "What's your biggest green flag that you pretend is normal?",
      placeholder: "Be honest…"
    },
    {
      id: "text_hill",
      prompt: "What hill are you willing to die on that would ruin a first date?",
      placeholder: "Your chaotic take…"
    },
    {
      id: "text_3am",
      prompt: "What do you Google at 3 AM when nobody is watching?",
      placeholder: "No judgment zone…"
    }
  ];

  const WATERMELON_EVENTS = [
    {
      id: "wm_event_01",
      squareType: "watermelon_event",
      eventTitle: "🚨 POLICE ESCORT REQUIRED 🚨",
      eventText: "The app checked your browsing history and decided you are both too dangerous to be left alone. Moving forward 3 spaces.",
      spaceModifier: 3,
      pointModifier: 0,
      triggerAnimation: "slide-forward-fast"
    },
    {
      id: "wm_event_02",
      squareType: "watermelon_event",
      eventTitle: "💸 THE LESBIAN TAX 💸",
      eventText: "You spent too long over-analyzing the font on the last page. Hand over 1 Fruit as a processing fee.",
      spaceModifier: 0,
      pointModifier: -1,
      triggerAnimation: "drain-score"
    },
    {
      id: "wm_event_03",
      squareType: "watermelon_event",
      eventTitle: "🚚 COUCH BROWSING PARALYSIS 🚚",
      eventText: "You both opened Facebook Marketplace for vintage rugs at the same time. Skip your next dice roll.",
      spaceModifier: 0,
      pointModifier: 0,
      triggerAnimation: "freeze-turn",
      skipNextRoll: true
    }
  ];

  const ULTIMATE_CHALLENGES = [
    {
      id: "ult_01",
      challengeType: "speed_run",
      title: "⚡ THE 15-SECOND PRESSURE COOKER",
      prompt: "You have 15 seconds to both pick the same answer. No overthinking!",
      reward: 3,
      penalty: -2
    },
    {
      id: "ult_02",
      challengeType: "social_hijack",
      title: "📸 PUBLIC EXHIBITION",
      prompt: "Take a wildly unhinged selfie together (or screenshot your video call), add a fruit emoji over your eyes, and send it to your group chat or close friends story.",
      mechanic: "Both check the box: We actually did it.",
      reward: 2,
      bonusRoll: true
    },
    {
      id: "ult_04",
      challengeType: "betrayal",
      title: "🎰 THE PRISONER'S DILEMMA",
      prompt: "Choose SHARE THE FRUIT or STEAL THE HOARD. Both share = +4 fruit. One steals = betrayer badge, -2 fruit. Both steal = reset to start!",
      reward: 4
    },
    {
      id: "ult_06",
      challengeType: "roulette",
      title: "🎲 FRUITY ROULETTE",
      prompt: "Spin the wheel! 83% teleport forward 5 spaces. 17% lose 3 fruit.",
      reward: 0
    },
    {
      id: "ult_07",
      challengeType: "telepathy",
      title: "🔮 THE VOW OF SILENCE",
      prompt: "No talking! Pick your answer using pure psychic lesbian telepathy.",
      reward: 3
    }
  ];

  const ULTIMATE_QUESTIONS = [
    {
      id: "ultq_01",
      prompt: "Quick! Fleeing the country — ONE illegal item in our shared suitcase?",
      options: [
        { id: "A", text: "A duffel bag full of highly illegal, unpasteurized French cheese." },
        { id: "B", text: "A massive houseplant cutting stolen from a botanical garden's restricted zone." },
        { id: "C", text: "A thumb drive of classified text threads from a niche celebrity scandal." },
        { id: "D", text: "A literal lock-picking kit bought off the dark web because \"I wanted a hobby.\"" }
      ]
    },
    {
      id: "ultq_02",
      prompt: "If I were an incredibly specific type of public nuisance, which one am I?",
      options: [
        { id: "A", text: "Playing loud avant-garde synth on a Bluetooth speaker on a hiking trail." },
        { id: "B", text: "Holding up the cafe line interrogating the barista about oat milk origins." },
        { id: "C", text: "Arguing with parking enforcement while pretending not to speak English." },
        { id: "D", text: "Leaving an abandoned iced coffee on a random shelf and walking away." }
      ]
    },
    {
      id: "ultq_03",
      prompt: "Elite task force interrogation: what's our exact story for how we met?",
      options: [
        { id: "A", text: "An underground illegal racing circuit, obviously." },
        { id: "B", text: "Fighting over the last vintage leather jacket at a thrift store." },
        { id: "C", text: "One of us saved the other from a wildly aggressive goose in a park." },
        { id: "D", text: "We didn't meet. We are a figment of your imagination." }
      ]
    },
    {
      id: "ultq_04",
      prompt: "Answer as EACH OTHER: if my phone hits 2%, what am I doing?",
      options: [
        { id: "A", text: "Panic, text everyone GOODBYE I AM DYING, go off the grid." },
        { id: "B", text: "Do nothing and let it die — sweet release of being unreachable." },
        { id: "C", text: "Spend 2% frantically searching Facebook Marketplace for a vintage rug." },
        { id: "D", text: "Sprint into a random business and beg a stranger for their outlet." }
      ]
    },
    {
      id: "ultq_05",
      prompt: "Most unhinged subconscious thought I've had about you since matching?",
      options: [
        { id: "A", text: "Secretly planning our matching festival outfits three months from now." },
        { id: "B", text: "Wondering if your exes would want to form a support group with me." },
        { id: "C", text: "Calculating if our dynamic could successfully rob a bank." },
        { id: "D", text: "Deeply afraid you are a government bot testing my sanity." }
      ]
    }
  ];

  function drawWatermelon() {
    const e = WATERMELON_EVENTS[wmIdx % WATERMELON_EVENTS.length];
    wmIdx++;
    return Object.assign({ cardKind: "watermelon" }, e);
  }

  function drawUltimate() {
    const c = ULTIMATE_CHALLENGES[ultIdx % ULTIMATE_CHALLENGES.length];
    ultIdx++;
    const q = ULTIMATE_QUESTIONS[ultQIdx % ULTIMATE_QUESTIONS.length];
    ultQIdx++;
    return Object.assign(
      {
        cardKind: "ultimate",
        mode: "self",
        type: c.challengeType === "social_hijack" ? "confirm" : "mc",
        challenge: c
      },
      c.challengeType === "social_hijack" ? {} : Object.assign({ type: "mc" }, q)
    );
  }

  function drawTextSelf() {
    const q = TEXT_SELF_QUESTIONS[textIdx % TEXT_SELF_QUESTIONS.length];
    textIdx++;
    return Object.assign({ mode: "self", type: "text", cardKind: "question" }, q);
  }

  /** Weighted draw when landing on a fruit tile. */
  function drawFruitCard() {
    const r = Math.random();
    if (r < 0.1) return drawWatermelon();
    if (r < 0.18) return drawUltimate();
    if (r < 0.32) return drawTextSelf();
    return drawSelf();
  }

  function normalizeAnswer(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function answersMatch(a, b, card) {
    if (!a || !b) return false;
    if (card && card.type === "text") {
      return normalizeAnswer(a) === normalizeAnswer(b);
    }
    return a === b;
  }

  function drawSelf() {
    const q = SELF_QUESTIONS[selfIdx % SELF_QUESTIONS.length];
    selfIdx++;
    return Object.assign({ mode: "self", type: "mc", cardKind: "question" }, q);
  }

  function drawPartner() {
    const q = PARTNER_QUESTIONS[partnerIdx % PARTNER_QUESTIONS.length];
    partnerIdx++;
    return Object.assign({ mode: "partner", type: "mc", cardKind: "question" }, q);
  }

  function pickRevealFlair(match, seed) {
    const pool = match ? MATCH_FLAIRS : MISMATCH_FLAIRS;
    const idx = Math.abs(seed || 0) % pool.length;
    return pool[idx];
  }

  function optionLabel(card, choiceId) {
    if (!card) return choiceId || "?";
    if (card.type === "text") return choiceId || "?";
    if (!card.options) return choiceId || "?";
    const opt = card.options.find(function (o) { return o.id === choiceId; });
    return opt ? opt.id + ") " + opt.text : choiceId || "?";
  }

  return {
    drawSelf: drawSelf,
    drawPartner: drawPartner,
    drawFruitCard: drawFruitCard,
    drawWatermelon: drawWatermelon,
    drawUltimate: drawUltimate,
    pickRevealFlair: pickRevealFlair,
    optionLabel: optionLabel,
    normalizeAnswer: normalizeAnswer,
    answersMatch: answersMatch,
    SELF_QUESTIONS: SELF_QUESTIONS,
    PARTNER_QUESTIONS: PARTNER_QUESTIONS,
    WATERMELON_EVENTS: WATERMELON_EVENTS,
    ULTIMATE_CHALLENGES: ULTIMATE_CHALLENGES
  };
})();
