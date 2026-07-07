/**
 * Arena flair — pop-up stickers & taunts sent to your opponent over PeerJS.
 */
window.ArenaReactions = (function () {
  "use strict";

  var BIRKENSTOCK_SVG = '<svg viewBox="0 0 120 64" aria-hidden="true"><path fill="#c4a574" stroke="#5c4033" stroke-width="2" d="M8 38 Q20 22 48 24 L92 20 Q108 18 112 32 L112 44 Q108 52 88 50 L40 48 Q16 46 8 38Z"/><ellipse cx="52" cy="28" rx="22" ry="8" fill="#8b6914" opacity=".35"/><rect x="18" y="36" width="72" height="10" rx="4" fill="#a08050"/><path fill="#7a5230" d="M28 46 h8 v6 h-8z M44 46 h8 v6 h-8z M60 46 h8 v6 h-8z M76 46 h8 v6 h-8z"/></svg>';

  var QUIPS = {
    "youre-hot": "The arena just got 10 degrees warmer. Not sorry.",
    "going-down": "Pack a parachute. Actually don't.",
    "l-lame": "Alphabet soup called. Even L is embarrassed for you.",
    "you-rock": "Geologists are filing a complaint. You rock too hard.",
    "thumbs-up": "One thumb up. The other is busy judging your moves.",
    "devil-horns": "Rock on — or rock off. Either way I'm watching.",
    "golden-star": "Gold star for participation. The bar was underground.",
    "taco": "You look like Tuesday. Spicy and slightly falling apart.",
    "salty-chips": "Extra salty. Like your losing streak.",
    "birkenstock": "Fashion verdict: guilty. Sentence: one more game.",
    "fire": "You're not hot. You're a fire hazard with Wi-Fi.",
    "skull": "RIP your dignity. Funeral at the game board.",
    "clown": "Honk honk. That was your strategy honking past.",
    "eyes": "I'm watching. So is everyone. Blink twice if you're losing.",
    "100": "Perfect score. Shame it doesn't apply to your gameplay.",
    "crown": "Heavy is the head that wears the crown. Light is your defense.",
    "poop": "Your take stinks. I said what I said.",
    "eggplant": "Down bad and up weird. Iconic combo.",
    "peach": "Soft. Rounded. About to get squished in this arena.",
    "sweat": "Nervous sweat? Good. You should be.",
    "mind-blown": "Brain.exe has stopped working. Try rebooting your ego.",
    "side-eye": "That look you give when someone's clearly wrong.",
    "cry": "Tears fuel my victory lap. Keep 'em coming.",
    "rage": "Angry already? We haven't even started embarrassing you.",
    "kiss": "Kiss goodbye to winning. Muah.",
    "heart": "I heart watching you lose. It's my hobby.",
    "broken-heart": "Your strategy and my sympathy — both shattered.",
    "party": "Celebrate now. You'll need the memory later.",
    "banana": "Bananagrams energy. Slippery when confident.",
    "dice": "Roll for initiative. You rolled a 'yikes.'",
    "mic": "Mic drop — because your argument fell first.",
    "goat": "Greatest Of All Trash talk. That's you today.",
    "money": "Betting against you pays better than crypto.",
    "nerd": "Big brain energy. Shame the board disagrees.",
    "cool": "Too cool for school. Just warm enough to lose.",
    "sleep": "Wake up. Your turn passed three seconds ago.",
    "vomit": "That play made me physically ill. Respect.",
    "ghost": "You've been haunted by better players.",
    "alien": "Take me to your leader. Yours clearly quit.",
    "robot": "Beep boop. Error: opponent too predictable.",
    "muscle": "Flex all you want. Brains beat biceps here.",
    "wave": "Bye bye, winning streak. Wave as it leaves.",
    "ok": "OK… if OK means 'mediocre and proud.'",
    "pray": "Pray harder. The dice gods aren't listening.",
    "shush": "Shhh. Adults are playing now.",
    "zip": "Zip it. Your excuses are loud enough.",
    "brain": "Use it. I beg you. Just once.",
    "bomb": "That move was explosive. For all the wrong reasons.",
    "zap": "Zapped your confidence. You're welcome.",
    "rainbow": "Somewhere over the rainbow, you're still losing.",
    "unicorn": "Magical thinking won't save that hand.",
    "pizza": "Extra cheese, zero skill. Chef's kiss of failure.",
    "beer": "Liquid courage can't fix a solid strategy.",
    "wine": "Whine later. We're playing now.",
    "coffee": "Wake up and smell the defeat brewing.",
    "popcorn": "I'm just here for the meltdown. Pass the salt.",
    "fries": "Small, fried, and about to get salted.",
    "hotdog": "Frankly, that was the wurst move I've seen.",
    "burger": "Stacked wrong. Like your game plan.",
    "icecream": "Melting under pressure. Relatable.",
    "cake": "Happy birthday to your last-place finish.",
    "dog": "Who's a good boy? Not you. Sit.",
    "cat": "Knocked your plans off the table. Classic cat energy.",
    "pig": "Oink oink — hogging all the bad luck today.",
    "chicken": "Bawk bawk. That was a chicken move.",
    "snake": "Sssssneaky. Still got caught.",
    "dragon": "Rawr. I'm hoarding wins like gold.",
    "frog": "Ribbit. Jump to a better strategy.",
    "monkey": "Monkey see, monkey do — monkey lose.",
    "penguin": "Waddle waddle straight into second place.",
    "owl": "Who? Who thought that was a good idea? You.",
    "bee": "Buzz off with that weak play.",
    "bug": "Small bug. Big problem for your score.",
    "spider": "Caught in my web of superior tactics.",
    "soccer": "GOOOOAL — for me, not you.",
    "basketball": "Swish. That's the sound of your hopes missing.",
    "trophy": "Mine now. Start practicing for next year.",
    "medal": "Participation medal vibes. Strong.",
    "target": "Bullseye on your weaknesses. Nailed it.",
    "boom": "Mind blown? More like strategy detonated.",
    "dizzy": "Spinning from how bad that was.",
    "sparkles": "Glitter can't hide a dull performance.",
    "question": "??? Is that your strategy or your IQ showing?",
    "exclaim": "!!! Even the punctuation is judging you.",
    "check": "Checked. Mate. Next question.",
    "x": "Wrong. Delete your move and try again.",
    "stop": "Stop. Collaborate. And listen — you're losing.",
    "warning": "Warning: contents may spill when shaken by defeat.",
    "siren": "WEE-OOO. Crime scene: your scoreboard.",
    "laugh": "I'm crying laughing. You're just crying.",
    "rofl": "Rolling on the floor. From your plays, not mine.",
    "wink": "Wink if you're about to choke. I'll wait.",
    "smirk": "Smirk now. Cry later. Arena rules.",
    "devil": "Little devil, big L incoming.",
    "angel": "Angel on the shoulder. Devil on the scoreboard.",
    "yawn": "Bored waiting for you to get good.",
    "shrug": "Shrug emoji, shrug strategy, shrug results.",
    "facepalm": "Even my palm has opinions about that move.",
    "handshake": "GG. Handshake of shame accepted.",
    "clap": "Slow clap for the slow thinker.",
    "raised-hands": "Hands up if you're surrendering. You first.",
    "point": "Point taken. Point laughed at. Moving on.",
    "middle-finger": "Classy. Like your win rate.",
    "peace": "Peace out, winning chances.",
    "rock": "Rock on — your gravestone of losses.",
    "fist": "Fist bump the air. Your opponent isn't here to help.",
    "punch": "That argument needs boxing gloves and a timeout.",
    "sword": "En garde! Your defense is already pierced.",
    "shield": "Shield up. Too late — verbal damage dealt.",
    "gem": "Rare find: a take that actually sparkles.",
    "ring": "Put a ring on it. Marry that L.",
    "gift": "Surprise! It's disappointment, wrapped.",
    "balloon": "Full of hot air. Pop goes the ego.",
    "confetti": "Confetti for my win. Rain on your parade.",
    "ticket": "One ticket to the loser lounge. Non-refundable.",
    "art": "Masterpiece of chaos. Hang it in the hall of shame.",
    "guitar": "Strum another sad song about losing.",
    "headphones": "Can't hear you over the sound of me winning.",
    "gamepad": "Button mashing isn't a strategy. Learned today.",
    "slot": "Jackpot! Of embarrassment. For you.",
    "joker": "Wild card play. Wildly bad.",
    "mahjong": "Wrong game, right energy — tiles everywhere, brain nowhere.",
    "chess": "Pawn energy. Promoted to clown.",
    "puzzle": "Missing piece: your whole plan.",
    "lightbulb": "Bright idea! For me. You stay dim.",
    "book": "Chapter one: How They Lost. You're the author.",
    "scroll": "Ancient lore says you choke under pressure.",
    "memo": "Memo: you're cooked. File under urgent.",
    "chart": "Trending up: my wins. Trending down: you.",
    "chart-down": "Portfolio of failure. Red everywhere.",
    "money-bag": "Bag secured — mine, not yours.",
    "credit": "Card declined. Like your last move.",
    "toolbox": "Wrong tool. Wrong job. Wrong arena.",
    "hammer": "Nailed it — nailed you to last place.",
    "wrench": "Something's loose. Probably your grip on reality.",
    "magnet": "Attracting L's like it's your job.",
    "microscope": "Under inspection: a very small chance you win.",
    "telescope": "Still can't see you winning from here.",
    "syringe": "Injecting pure copium. Side effects include losing.",
    "pill": "Take two. Call me when you stop whiffing.",
    "dna": "Genetically predisposed to taking L's.",
    "virus": "Contagious bad luck. Patient zero: you.",
    "plant": "Growth mindset. Shame nothing's growing but my lead.",
    "flower": "Stop and smell the roses. Game's over.",
    "sun": "Blinded by my brilliance. Sunglasses recommended.",
    "moon": "Dark side of the moon. Dark side of your strategy.",
    "cloud": "Head in the clouds. Feet in the loss column.",
    "rain": "Rain on your parade. Umbrella sold separately.",
    "snow": "Cold take. Frozen strategy. Chilly results.",
    "volcano": "Erupting with confidence. Lava-level L incoming.",
    "earth": "World-class losing. Globally recognized.",
    "rocket": "To the moon? Nah. Straight into the sun.",
    "satellite": "Orbiting reality. Still not landing a win.",
    "ufo": "Alien levels of weird in that play.",
    "anchor": "Anchored in last place. Full stop.",
    "ship": "Ship has sailed. You missed the boat.",
    "car": "Beep beep. Out of my lane, out of my league.",
    "bike": "Pedal faster. I'm lapping you mentally.",
    "train": "All aboard the struggle bus. Choo choo.",
    "plane": "Your hopes have left the runway.",
    "helicopter": "Helicopter parenting your tiles won't help.",
    "parachute": "Pull the cord. Eject from that bad idea.",
    "hourglass": "Time's up. Sand's out. So are you.",
    "alarm": "WAKE UP. Bad play detected.",
    "watch": "Watch the clock. Watch me win.",
    "phone": "New phone who dis? New L who this?",
    "laptop": "404: Your skill not found.",
    "keyboard": "Keyboard warrior detected. Board game victim confirmed.",
    "mouse": "Click click. Still lost.",
    "camera": "Say cheese. Say goodbye to winning.",
    "video": "Recording this L for the highlight reel.",
    "tv": "Tune in next time for more public embarrassment.",
    "radio": "Breaking news: local player loses again.",
    "speaker": "Volume up on the trash talk.",
    "mute": "Muted. Like your comeback.",
    "bell": "Ding ding. Round over. You lost.",
    "lock": "Locked in. Locked out of victory.",
    "key": "Key to winning? Not whatever you're doing.",
    "link": "LinkedIn update: Open to new losses.",
    "paperclip": "Holding it together? Barely.",
    "scissors": "Cut that idea. Shred it. Burn it.",
    "pin": "Pinned you. Like a bug. Like a loss.",
    "pushpin": "Pinned to the wall of shame.",
    "compass": "Lost. Recalculating. Still lost.",
    "map": "X marks the spot where you threw.",
    "globe": "World tour of L's. Next stop: here.",
    "flag": "White flag? Thought so.",
    "checkered": "Checkered flag. Race over. You didn't win."
  };

  var CATALOG_RAW = [
    { id: "youre-hot", label: "You're Hot", kind: "text", text: "YOU'RE HOT", sub: "🔥", cls: "is-fire", sound: "sparkle" },
    { id: "going-down", label: "Going Down", kind: "text", text: "YOU'RE GOING DOWN", cls: "is-threat", sound: "slam" },
    { id: "l-lame", label: "L = LAME", kind: "text", text: "L IS FOR LAME", cls: "is-shade", sound: "horn" },
    { id: "you-rock", label: "You Rock", kind: "text", text: "YOU ROCK", sub: "🤘", cls: "is-rock", sound: "sparkle" },
    { id: "thumbs-up", label: "Thumbs Up", kind: "emoji", emoji: "👍", cls: "is-sticker", sound: "pop" },
    { id: "devil-horns", label: "Devil Horns", kind: "emoji", emoji: "🤘", cls: "is-sticker", sound: "horn" },
    { id: "golden-star", label: "Golden Star", kind: "emoji", emoji: "⭐", cls: "is-sticker is-gold", sound: "sparkle" },
    { id: "taco", label: "Taco", kind: "emoji", emoji: "🌮", cls: "is-sticker", sound: "pop" },
    { id: "salty-chips", label: "Salty Chips", kind: "text", text: "SALTY", sub: "🥔🧂", cls: "is-chips", sound: "chip" },
    { id: "birkenstock", label: "Birkenstock", kind: "svg", html: BIRKENSTOCK_SVG, cls: "is-birken", sound: "pop" },
    { id: "fire", label: "Fire", kind: "emoji", emoji: "🔥", sound: "sparkle" },
    { id: "skull", label: "Skull", kind: "emoji", emoji: "💀", sound: "slam" },
    { id: "clown", label: "Clown", kind: "emoji", emoji: "🤡", sound: "horn" },
    { id: "eyes", label: "Eyes", kind: "emoji", emoji: "👀", sound: "pop" },
    { id: "100", label: "100", kind: "emoji", emoji: "💯", sound: "sparkle" },
    { id: "crown", label: "Crown", kind: "emoji", emoji: "👑", sound: "sparkle" },
    { id: "poop", label: "Poop", kind: "emoji", emoji: "💩", sound: "chip" },
    { id: "eggplant", label: "Eggplant", kind: "emoji", emoji: "🍆", sound: "pop" },
    { id: "peach", label: "Peach", kind: "emoji", emoji: "🍑", sound: "pop" },
    { id: "sweat", label: "Sweat", kind: "emoji", emoji: "😅", sound: "pop" },
    { id: "mind-blown", label: "Mind Blown", kind: "emoji", emoji: "🤯", sound: "sparkle" },
    { id: "side-eye", label: "Side Eye", kind: "emoji", emoji: "🙄", sound: "horn" },
    { id: "cry", label: "Cry", kind: "emoji", emoji: "😭", sound: "pop" },
    { id: "rage", label: "Rage", kind: "emoji", emoji: "😡", sound: "slam" },
    { id: "kiss", label: "Kiss", kind: "emoji", emoji: "😘", sound: "sparkle" },
    { id: "heart", label: "Heart", kind: "emoji", emoji: "❤️", sound: "pop" },
    { id: "broken-heart", label: "Broken Heart", kind: "emoji", emoji: "💔", sound: "slam" },
    { id: "party", label: "Party", kind: "emoji", emoji: "🎉", sound: "sparkle" },
    { id: "banana", label: "Banana", kind: "emoji", emoji: "🍌", sound: "pop" },
    { id: "dice", label: "Dice", kind: "emoji", emoji: "🎲", sound: "pop" },
    { id: "mic", label: "Mic Drop", kind: "emoji", emoji: "🎤", sound: "slam" },
    { id: "goat", label: "GOAT", kind: "emoji", emoji: "🐐", sound: "horn" },
    { id: "money", label: "Money", kind: "emoji", emoji: "💸", sound: "sparkle" },
    { id: "nerd", label: "Nerd", kind: "emoji", emoji: "🤓", sound: "pop" },
    { id: "cool", label: "Cool", kind: "emoji", emoji: "😎", sound: "sparkle" },
    { id: "sleep", label: "Sleep", kind: "emoji", emoji: "😴", sound: "pop" },
    { id: "vomit", label: "Vomit", kind: "emoji", emoji: "🤮", sound: "chip" },
    { id: "ghost", label: "Ghost", kind: "emoji", emoji: "👻", sound: "horn" },
    { id: "alien", label: "Alien", kind: "emoji", emoji: "👽", sound: "sparkle" },
    { id: "robot", label: "Robot", kind: "emoji", emoji: "🤖", sound: "pop" },
    { id: "muscle", label: "Muscle", kind: "emoji", emoji: "💪", sound: "slam" },
    { id: "wave", label: "Wave", kind: "emoji", emoji: "👋", sound: "pop" },
    { id: "ok", label: "OK", kind: "emoji", emoji: "👌", sound: "pop" },
    { id: "pray", label: "Pray", kind: "emoji", emoji: "🙏", sound: "sparkle" },
    { id: "shush", label: "Shush", kind: "emoji", emoji: "🤫", sound: "pop" },
    { id: "zip", label: "Zip It", kind: "emoji", emoji: "🤐", sound: "pop" },
    { id: "brain", label: "Brain", kind: "emoji", emoji: "🧠", sound: "sparkle" },
    { id: "bomb", label: "Bomb", kind: "emoji", emoji: "💣", sound: "slam" },
    { id: "zap", label: "Zap", kind: "emoji", emoji: "⚡", sound: "sparkle" },
    { id: "rainbow", label: "Rainbow", kind: "emoji", emoji: "🌈", sound: "sparkle" },
    { id: "unicorn", label: "Unicorn", kind: "emoji", emoji: "🦄", sound: "sparkle" },
    { id: "pizza", label: "Pizza", kind: "emoji", emoji: "🍕", sound: "pop" },
    { id: "beer", label: "Beer", kind: "emoji", emoji: "🍺", sound: "pop" },
    { id: "wine", label: "Wine", kind: "emoji", emoji: "🍷", sound: "pop" },
    { id: "coffee", label: "Coffee", kind: "emoji", emoji: "☕", sound: "pop" },
    { id: "popcorn", label: "Popcorn", kind: "emoji", emoji: "🍿", sound: "chip" },
    { id: "fries", label: "Fries", kind: "emoji", emoji: "🍟", sound: "chip" },
    { id: "hotdog", label: "Hot Dog", kind: "emoji", emoji: "🌭", sound: "pop" },
    { id: "burger", label: "Burger", kind: "emoji", emoji: "🍔", sound: "pop" },
    { id: "icecream", label: "Ice Cream", kind: "emoji", emoji: "🍦", sound: "pop" },
    { id: "cake", label: "Cake", kind: "emoji", emoji: "🎂", sound: "sparkle" },
    { id: "dog", label: "Dog", kind: "emoji", emoji: "🐕", sound: "pop" },
    { id: "cat", label: "Cat", kind: "emoji", emoji: "🐈", sound: "pop" },
    { id: "pig", label: "Pig", kind: "emoji", emoji: "🐷", sound: "horn" },
    { id: "chicken", label: "Chicken", kind: "emoji", emoji: "🐔", sound: "pop" },
    { id: "snake", label: "Snake", kind: "emoji", emoji: "🐍", sound: "horn" },
    { id: "dragon", label: "Dragon", kind: "emoji", emoji: "🐉", sound: "slam" },
    { id: "frog", label: "Frog", kind: "emoji", emoji: "🐸", sound: "pop" },
    { id: "monkey", label: "Monkey", kind: "emoji", emoji: "🐒", sound: "horn" },
    { id: "penguin", label: "Penguin", kind: "emoji", emoji: "🐧", sound: "pop" },
    { id: "owl", label: "Owl", kind: "emoji", emoji: "🦉", sound: "pop" },
    { id: "bee", label: "Bee", kind: "emoji", emoji: "🐝", sound: "sparkle" },
    { id: "bug", label: "Bug", kind: "emoji", emoji: "🐛", sound: "pop" },
    { id: "spider", label: "Spider", kind: "emoji", emoji: "🕷️", sound: "slam" },
    { id: "soccer", label: "Soccer", kind: "emoji", emoji: "⚽", sound: "slam" },
    { id: "basketball", label: "Basketball", kind: "emoji", emoji: "🏀", sound: "slam" },
    { id: "trophy", label: "Trophy", kind: "emoji", emoji: "🏆", sound: "sparkle" },
    { id: "medal", label: "Medal", kind: "emoji", emoji: "🏅", sound: "sparkle" },
    { id: "target", label: "Target", kind: "emoji", emoji: "🎯", sound: "pop" },
    { id: "boom", label: "Boom", kind: "emoji", emoji: "💥", sound: "slam" },
    { id: "dizzy", label: "Dizzy", kind: "emoji", emoji: "💫", sound: "sparkle" },
    { id: "sparkles", label: "Sparkles", kind: "emoji", emoji: "✨", sound: "sparkle" },
    { id: "question", label: "?", kind: "emoji", emoji: "❓", sound: "pop" },
    { id: "exclaim", label: "!", kind: "emoji", emoji: "❗", sound: "slam" },
    { id: "check", label: "Check", kind: "emoji", emoji: "✅", sound: "pop" },
    { id: "x", label: "X", kind: "emoji", emoji: "❌", sound: "slam" },
    { id: "stop", label: "Stop", kind: "emoji", emoji: "🛑", sound: "slam" },
    { id: "warning", label: "Warning", kind: "emoji", emoji: "⚠️", sound: "horn" },
    { id: "siren", label: "Siren", kind: "emoji", emoji: "🚨", sound: "horn" },
    { id: "laugh", label: "Laugh", kind: "emoji", emoji: "😂", sound: "sparkle" },
    { id: "rofl", label: "ROFL", kind: "emoji", emoji: "🤣", sound: "sparkle" },
    { id: "wink", label: "Wink", kind: "emoji", emoji: "😉", sound: "pop" },
    { id: "smirk", label: "Smirk", kind: "emoji", emoji: "😏", sound: "horn" },
    { id: "devil", label: "Devil", kind: "emoji", emoji: "😈", sound: "horn" },
    { id: "angel", label: "Angel", kind: "emoji", emoji: "😇", sound: "sparkle" },
    { id: "yawn", label: "Yawn", kind: "emoji", emoji: "🥱", sound: "pop" },
    { id: "shrug", label: "Shrug", kind: "emoji", emoji: "🤷", sound: "pop" },
    { id: "facepalm", label: "Facepalm", kind: "emoji", emoji: "🤦", sound: "slam" },
    { id: "handshake", label: "Handshake", kind: "emoji", emoji: "🤝", sound: "pop" },
    { id: "clap", label: "Clap", kind: "emoji", emoji: "👏", sound: "sparkle" },
    { id: "raised-hands", label: "Hands Up", kind: "emoji", emoji: "🙌", sound: "sparkle" },
    { id: "point", label: "Point", kind: "emoji", emoji: "👉", sound: "pop" },
    { id: "middle-finger", label: "Middle Finger", kind: "emoji", emoji: "🖕", sound: "slam" },
    { id: "peace", label: "Peace", kind: "emoji", emoji: "✌️", sound: "pop" },
    { id: "rock", label: "Rock On", kind: "emoji", emoji: "🤘", sound: "horn" },
    { id: "fist", label: "Fist", kind: "emoji", emoji: "👊", sound: "slam" },
    { id: "punch", label: "Punch", kind: "emoji", emoji: "🥊", sound: "slam" },
    { id: "sword", label: "Sword", kind: "emoji", emoji: "⚔️", sound: "slam" },
    { id: "shield", label: "Shield", kind: "emoji", emoji: "🛡️", sound: "pop" },
    { id: "gem", label: "Gem", kind: "emoji", emoji: "💎", sound: "sparkle" },
    { id: "ring", label: "Ring", kind: "emoji", emoji: "💍", sound: "sparkle" },
    { id: "gift", label: "Gift", kind: "emoji", emoji: "🎁", sound: "sparkle" },
    { id: "balloon", label: "Balloon", kind: "emoji", emoji: "🎈", sound: "pop" },
    { id: "confetti", label: "Confetti", kind: "emoji", emoji: "🎊", sound: "sparkle" },
    { id: "ticket", label: "Ticket", kind: "emoji", emoji: "🎟️", sound: "pop" },
    { id: "art", label: "Art", kind: "emoji", emoji: "🎨", sound: "pop" },
    { id: "guitar", label: "Guitar", kind: "emoji", emoji: "🎸", sound: "horn" },
    { id: "headphones", label: "Headphones", kind: "emoji", emoji: "🎧", sound: "pop" },
    { id: "gamepad", label: "Gamepad", kind: "emoji", emoji: "🎮", sound: "pop" },
    { id: "slot", label: "Jackpot", kind: "emoji", emoji: "🎰", sound: "sparkle" },
    { id: "joker", label: "Joker", kind: "emoji", emoji: "🃏", sound: "horn" },
    { id: "mahjong", label: "Mahjong", kind: "emoji", emoji: "🀄", sound: "pop" },
    { id: "chess", label: "Chess", kind: "emoji", emoji: "♟️", sound: "pop" },
    { id: "puzzle", label: "Puzzle", kind: "emoji", emoji: "🧩", sound: "pop" },
    { id: "lightbulb", label: "Idea", kind: "emoji", emoji: "💡", sound: "sparkle" },
    { id: "book", label: "Book", kind: "emoji", emoji: "📖", sound: "pop" },
    { id: "scroll", label: "Scroll", kind: "emoji", emoji: "📜", sound: "pop" },
    { id: "memo", label: "Memo", kind: "emoji", emoji: "📝", sound: "pop" },
    { id: "chart", label: "Chart", kind: "emoji", emoji: "📈", sound: "sparkle" },
    { id: "chart-down", label: "Chart Down", kind: "emoji", emoji: "📉", sound: "slam" },
    { id: "money-bag", label: "Money Bag", kind: "emoji", emoji: "💰", sound: "sparkle" },
    { id: "credit", label: "Card", kind: "emoji", emoji: "💳", sound: "pop" },
    { id: "toolbox", label: "Toolbox", kind: "emoji", emoji: "🧰", sound: "pop" },
    { id: "hammer", label: "Hammer", kind: "emoji", emoji: "🔨", sound: "slam" },
    { id: "wrench", label: "Wrench", kind: "emoji", emoji: "🔧", sound: "pop" },
    { id: "magnet", label: "Magnet", kind: "emoji", emoji: "🧲", sound: "pop" },
    { id: "microscope", label: "Microscope", kind: "emoji", emoji: "🔬", sound: "pop" },
    { id: "telescope", label: "Telescope", kind: "emoji", emoji: "🔭", sound: "pop" },
    { id: "syringe", label: "Syringe", kind: "emoji", emoji: "💉", sound: "pop" },
    { id: "pill", label: "Pill", kind: "emoji", emoji: "💊", sound: "pop" },
    { id: "dna", label: "DNA", kind: "emoji", emoji: "🧬", sound: "sparkle" },
    { id: "virus", label: "Virus", kind: "emoji", emoji: "🦠", sound: "horn" },
    { id: "plant", label: "Plant", kind: "emoji", emoji: "🌱", sound: "pop" },
    { id: "flower", label: "Flower", kind: "emoji", emoji: "🌸", sound: "sparkle" },
    { id: "sun", label: "Sun", kind: "emoji", emoji: "☀️", sound: "sparkle" },
    { id: "moon", label: "Moon", kind: "emoji", emoji: "🌙", sound: "pop" },
    { id: "cloud", label: "Cloud", kind: "emoji", emoji: "☁️", sound: "pop" },
    { id: "rain", label: "Rain", kind: "emoji", emoji: "🌧️", sound: "pop" },
    { id: "snow", label: "Snow", kind: "emoji", emoji: "❄️", sound: "sparkle" },
    { id: "volcano", label: "Volcano", kind: "emoji", emoji: "🌋", sound: "slam" },
    { id: "earth", label: "Earth", kind: "emoji", emoji: "🌍", sound: "pop" },
    { id: "rocket", label: "Rocket", kind: "emoji", emoji: "🚀", sound: "sparkle" },
    { id: "satellite", label: "Satellite", kind: "emoji", emoji: "🛰️", sound: "sparkle" },
    { id: "ufo", label: "UFO", kind: "emoji", emoji: "🛸", sound: "horn" },
    { id: "anchor", label: "Anchor", kind: "emoji", emoji: "⚓", sound: "slam" },
    { id: "ship", label: "Ship", kind: "emoji", emoji: "🚢", sound: "pop" },
    { id: "car", label: "Car", kind: "emoji", emoji: "🚗", sound: "pop" },
    { id: "bike", label: "Bike", kind: "emoji", emoji: "🚲", sound: "pop" },
    { id: "train", label: "Train", kind: "emoji", emoji: "🚂", sound: "horn" },
    { id: "plane", label: "Plane", kind: "emoji", emoji: "✈️", sound: "sparkle" },
    { id: "helicopter", label: "Heli", kind: "emoji", emoji: "🚁", sound: "horn" },
    { id: "parachute", label: "Parachute", kind: "emoji", emoji: "🪂", sound: "pop" },
    { id: "hourglass", label: "Hourglass", kind: "emoji", emoji: "⏳", sound: "pop" },
    { id: "alarm", label: "Alarm", kind: "emoji", emoji: "⏰", sound: "horn" },
    { id: "watch", label: "Watch", kind: "emoji", emoji: "⌚", sound: "pop" },
    { id: "phone", label: "Phone", kind: "emoji", emoji: "📱", sound: "pop" },
    { id: "laptop", label: "Laptop", kind: "emoji", emoji: "💻", sound: "pop" },
    { id: "keyboard", label: "Keyboard", kind: "emoji", emoji: "⌨️", sound: "pop" },
    { id: "mouse", label: "Mouse", kind: "emoji", emoji: "🖱️", sound: "pop" },
    { id: "camera", label: "Camera", kind: "emoji", emoji: "📷", sound: "pop" },
    { id: "video", label: "Video", kind: "emoji", emoji: "📹", sound: "pop" },
    { id: "tv", label: "TV", kind: "emoji", emoji: "📺", sound: "pop" },
    { id: "radio", label: "Radio", kind: "emoji", emoji: "📻", sound: "pop" },
    { id: "speaker", label: "Speaker", kind: "emoji", emoji: "🔊", sound: "horn" },
    { id: "mute", label: "Mute", kind: "emoji", emoji: "🔇", sound: "slam" },
    { id: "bell", label: "Bell", kind: "emoji", emoji: "🔔", sound: "sparkle" },
    { id: "lock", label: "Lock", kind: "emoji", emoji: "🔒", sound: "pop" },
    { id: "key", label: "Key", kind: "emoji", emoji: "🔑", sound: "sparkle" },
    { id: "link", label: "Link", kind: "emoji", emoji: "🔗", sound: "pop" },
    { id: "paperclip", label: "Clip", kind: "emoji", emoji: "📎", sound: "pop" },
    { id: "scissors", label: "Scissors", kind: "emoji", emoji: "✂️", sound: "pop" },
    { id: "pin", label: "Pin", kind: "emoji", emoji: "📌", sound: "pop" },
    { id: "pushpin", label: "Pushpin", kind: "emoji", emoji: "📍", sound: "pop" },
    { id: "compass", label: "Compass", kind: "emoji", emoji: "🧭", sound: "pop" },
    { id: "map", label: "Map", kind: "emoji", emoji: "🗺️", sound: "pop" },
    { id: "globe", label: "Globe", kind: "emoji", emoji: "🌐", sound: "sparkle" },
    { id: "flag", label: "Flag", kind: "emoji", emoji: "🏁", sound: "sparkle" },
    { id: "checkered", label: "Finish", kind: "emoji", emoji: "🏁", sound: "sparkle" }
  ];

  var CATALOG = CATALOG_RAW.map(function (r) {
    return Object.assign({}, r, { quip: QUIPS[r.id] || "No words. Just disrespect." });
  });

  var byId = {};
  CATALOG.forEach(function (r) { byId[r.id] = r; });

  var layer = null;
  var onSend = null;
  var active = 0;
  var MAX_ACTIVE = 6;

  function playSound(name) {
    if (!window.ArenaSounds || !name) return;
    var fn = ArenaSounds[name];
    if (typeof fn === "function") fn();
  }

  function buildPopup(reaction, fromName) {
    var pop = document.createElement("div");
    pop.className = "reaction-pop " + (reaction.cls || "");
    if (fromName) {
      var tag = document.createElement("div");
      tag.className = "reaction-from";
      tag.textContent = fromName;
      pop.appendChild(tag);
    }
    var body = document.createElement("div");
    body.className = "reaction-body";
    if (reaction.kind === "text") {
      body.innerHTML = '<span class="reaction-text">' + reaction.text + "</span>" +
        (reaction.sub ? '<span class="reaction-sub">' + reaction.sub + "</span>" : "");
    } else if (reaction.kind === "emoji") {
      body.innerHTML = '<span class="reaction-emoji">' + reaction.emoji + "</span>";
    } else if (reaction.kind === "svg") {
      body.innerHTML = reaction.html;
    }
    if (reaction.quip) {
      var quip = document.createElement("div");
      quip.className = "reaction-quip";
      quip.textContent = reaction.quip;
      body.appendChild(quip);
    }
    pop.appendChild(body);
    return pop;
  }

  function show(reactionId, fromName, playFx) {
    var reaction = byId[reactionId];
    if (!reaction || !layer) return;
    if (active >= MAX_ACTIVE) {
      var old = layer.querySelector(".reaction-pop");
      if (old) old.remove();
    }
    active++;
    if (playFx !== false) playSound(reaction.sound);

    var pop = buildPopup(reaction, fromName);
    var x = 8 + Math.random() * 72;
    var y = 12 + Math.random() * 58;
    pop.style.left = x + "%";
    pop.style.top = y + "%";
    pop.style.setProperty("--rot", (Math.random() * 16 - 8) + "deg");
    layer.appendChild(pop);

    requestAnimationFrame(function () { pop.classList.add("is-visible"); });

    setTimeout(function () { pop.classList.add("is-exiting"); }, 2800);
    setTimeout(function () {
      pop.remove();
      active = Math.max(0, active - 1);
    }, 3600);
  }

  function sendReaction(id) {
    if (!byId[id]) return;
    ArenaSounds && ArenaSounds.unlock();
    show(id, null, true);
    if (typeof onSend === "function") onSend(id);
  }

  function mountPicker(container) {
    if (!container) return;
    container.innerHTML = "";
    CATALOG.forEach(function (r) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "reaction-btn";
      btn.title = r.quip;
      btn.setAttribute("aria-label", "Send " + r.label + ": " + r.quip);
      if (r.kind === "text") {
        btn.textContent = r.sub || r.text.split(" ")[0].slice(0, 3);
        btn.classList.add("is-text-chip");
      } else if (r.kind === "emoji") {
        btn.textContent = r.emoji;
      } else if (r.kind === "svg") {
        btn.innerHTML = r.html;
        btn.classList.add("is-svg-chip");
      }
      btn.addEventListener("click", function () { sendReaction(r.id); });
      container.appendChild(btn);
    });
  }

  return {
    init: function (opts) {
      layer = opts.layer;
      onSend = opts.onSend;
      mountPicker(opts.picker);
    },
    showIncoming: function (id, fromName) {
      show(id, fromName || "Opponent", true);
    },
    getCatalog: function () { return CATALOG; }
  };
})();
