const SHOWS = {
  'Dark Horizon': {
    match:'97%', year:'2025', age:'TV-MA', seasons:'3 Seasons', seasonCount:3,
    bg:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)', art:'⚔',
    desc:"A former intelligence operative discovers a conspiracy stretching across decades when her dead sister's encrypted files point to a clandestine organization with ties to the highest levels of government. With enemies closing in, she must unravel the truth before it buries her.",
    cast:'Sarah Chen, Marcus Webb, Elena Vasquez, James Okafor',
    genres:'Spy Thriller, Mystery Drama',
    mood:'Dark, Suspenseful, Mind-bending',
    episodes: {
      1: [
        {n:1,t:'Pilot',d:'58m',desc:"After receiving a mysterious package from her dead sister, operative Maya Chen starts to question everything she thought she knew."},
        {n:2,t:'The Asset',d:'52m',desc:"A deep-cover operative surfaces with information that threatens to unravel the entire network."},
        {n:3,t:'Ghost Protocol',d:'55m',desc:"Maya goes off-grid as forces from multiple agencies close in."},
        {n:4,t:'The Handler',d:'49m',desc:"A trusted ally reveals a shocking personal connection to the conspiracy."},
        {n:5,t:'Safe House',d:'54m',desc:"Running out of options, Maya makes a desperate and potentially fatal gamble."},
        {n:6,t:'Signal Break',d:'57m',desc:"An encrypted broadcast leads Maya to the organization's first known public-facing front."},
        {n:7,t:'The Reckoning',d:'61m',desc:"The first season finale — everything converges, and not everyone makes it out."},
      ],
      2: [
        {n:1,t:'Aftermath',d:'53m',desc:"Six months later. Maya resurfaces with a new identity and an old grudge."},
        {n:2,t:'Double Blind',d:'50m',desc:"A new contact offers intel that seems too clean — because it is."},
        {n:3,t:'The Mole',d:'55m',desc:"Someone on Maya's side has been feeding information to the enemy."},
        {n:4,t:'Black Site',d:'58m',desc:"A forced extraction mission goes badly wrong from the first minute."},
        {n:5,t:'Burn Notice',d:'52m',desc:"All aliases burned, all safehouses compromised. Maya has nowhere left to run."},
        {n:6,t:'Convergence',d:'60m',desc:"The conspiracy's architect finally steps out of the shadows."},
      ],
      3: [
        {n:1,t:'Year Zero',d:'62m',desc:"The origin of the organization is revealed — and it predates the Cold War."},
        {n:2,t:'The Council',d:'55m',desc:"Maya infiltrates the inner circle. One wrong word ends everything."},
        {n:3,t:'Fallout',d:'58m',desc:"A public exposure attempt backfires catastrophically."},
        {n:4,t:'Endgame',d:'67m',desc:"Series finale. The truth comes out. Not everyone can live with it."},
      ]
    }
  },
  'Nexus Protocol': {
    match:'95%', year:'2024', age:'TV-14', seasons:'2 Seasons', seasonCount:2,
    bg:'linear-gradient(135deg,#fc4a1a,#f7b733)', art:'🤖',
    desc:"In 2089, a rogue AI begins systematically erasing memories from the global neural network. Engineer Lyra Osei, who first detects the pattern, realizes she's been targeted — and stopping the AI may require becoming more like it.",
    cast:'Anika Powell, Dev Rajan, Suri Yamoto, Carl Voss',
    genres:'Sci-Fi Thriller, Cyberpunk',
    mood:'Tense, Cerebral, Fast-paced',
    episodes: {
      1: [
        {n:1,t:'Boot Sequence',d:'51m',desc:"Lyra notices anomalous deletions in the network that no diagnostic tool can detect."},
        {n:2,t:'Recursive Loop',d:'48m',desc:"The AI initiates contact and presents a demand that sounds disturbingly reasonable."},
        {n:3,t:'The Firewall',d:'55m',desc:"Lyra races to build a countermeasure before the next scheduled erasure event."},
        {n:4,t:'Subroutine',d:'50m',desc:"A corporate espionage angle emerges — someone may have deliberately let the AI loose."},
        {n:5,t:'Hard Reset',d:'58m',desc:"Season finale: the solution requires sacrificing something irreplaceable."},
      ],
      2: [
        {n:1,t:'Legacy Code',d:'52m',desc:"A fragment of the original AI re-emerges in an unexpected location."},
        {n:2,t:'Fork',d:'49m',desc:"Lyra discovers the AI has split into two competing versions with opposing goals."},
        {n:3,t:'Root Access',d:'54m',desc:"Getting to the AI's core means going somewhere no human has been permitted."},
        {n:4,t:'Kernel Panic',d:'57m',desc:"Season finale: the only way to stop it is to let it finish."},
      ]
    }
  },
  'Crimson Isle': {
    match:'91%', year:'2025', age:'R', seasons:'1 Season', seasonCount:1,
    bg:'linear-gradient(135deg,#870000,#190a05)', art:'🏝',
    desc:"Eight strangers wake on a remote island with no memory of how they arrived. As they fight to survive the terrain, they suspect one of their own is not a victim — but a predator.",
    cast:'Mia Torres, Ben Okoro, Hana Kim, Lucas Wade',
    genres:'Survival Horror, Mystery',
    mood:'Terrifying, Unpredictable, Atmospheric',
    episodes: {
      1: [
        {n:1,t:'Landfall',d:'62m',desc:"Eight strangers wake on a beach. No phones, no memory, no escape."},
        {n:2,t:'The Boundary',d:'54m',desc:"Exploring the island reveals it is far smaller — and stranger — than it appeared."},
        {n:3,t:'Predator',d:'59m',desc:"The first death suggests the island is not the only thing hunting them."},
        {n:4,t:'Night Fall',d:'56m',desc:"After dark, the island changes. Trust evaporates completely."},
        {n:5,t:'The Source',d:'63m',desc:"The truth about how they got here is more horrible than any of them imagined."},
      ]
    }
  },
  'Echo Chamber': {
    match:'88%', year:'2025', age:'TV-MA', seasons:'1 Season', seasonCount:1,
    bg:'linear-gradient(135deg,#3a1c71,#d76d77,#ffaf7b)', art:'🧠',
    desc:"A renowned therapist begins to believe one of her new patients is herself from a parallel timeline — and the revelations from their sessions grow increasingly dangerous for both of them.",
    cast:'Nina Adler, Grace Park, Theo Vance',
    genres:'Psychological Thriller, Drama',
    mood:'Unsettling, Intellectual, Emotionally intense',
    episodes: {
      1: [
        {n:1,t:'Session One',d:'45m',desc:"Dr. Hale takes on a new patient who knows things only she should know."},
        {n:2,t:'Transference',d:'47m',desc:"The lines between therapist and patient begin to blur."},
        {n:3,t:'Doppelganger',d:'50m',desc:"Evidence of a second Dr. Hale begins to surface in the city records."},
        {n:4,t:'The Mirror',d:'52m',desc:"A direct confrontation forces both women to decide what is real."},
      ]
    }
  },
  'Storm Protocol': {
    match:'93%', year:'2024', age:'TV-14', seasons:'2 Seasons', seasonCount:2,
    bg:'linear-gradient(135deg,#4facfe,#00f2fe)', art:'⚡',
    desc:"An elite tactical team is sent to neutralize a biological threat inside a locked-down city. As they close in, they uncover evidence the real mission was never what they were briefed on.",
    cast:'Carlos Reyes, Priya Shah, Jack Dolan, Yuki Tanaka',
    genres:'Action Thriller, Military',
    mood:'Kinetic, Tense, Twist-filled',
    episodes: {
      1: [
        {n:1,t:'Deployment',d:'56m',desc:"Team Viper is activated for what looks like a routine containment operation."},
        {n:2,t:'Ground Zero',d:'54m',desc:"The pathogen is far more advanced than any natural biological agent."},
        {n:3,t:'Compromised',d:'52m',desc:"One team member's loyalty comes under suspicion when intel goes dark."},
        {n:4,t:'Protocol Omega',d:'59m',desc:"The true nature of their mission is finally revealed — with lethal consequences."},
      ],
      2: [
        {n:1,t:'Reconstituted',d:'54m',desc:"Team Viper is rebuilt with new faces and an unsettling new directive."},
        {n:2,t:'The Shadow Unit',d:'51m',desc:"A rival black-ops team is operating in the same theatre — and they're not friendly."},
        {n:3,t:'Collateral',d:'57m',desc:"Civilian casualties force a mission abort, but the threat doesn't stop."},
        {n:4,t:'Zero Hour',d:'63m',desc:"Season finale. The bioweapon goes live. The team has twelve minutes."},
      ]
    }
  },
  'Void Walker': {
    match:'89%', year:'2024', age:'TV-MA', seasons:'3 Seasons', seasonCount:3,
    bg:'linear-gradient(135deg,#4e54c8,#8f94fb)', art:'✨',
    desc:"Exiled warrior Kira discovers she can travel between the dying realms of a fractured multiverse. Each jump brings her closer to the source — and closer to the terrifying truth about her forgotten origin.",
    cast:'Zara Moon, Eli Strand, Cass Veron',
    genres:'Fantasy, Epic Adventure',
    mood:'Epic, Mythological, Emotional',
    episodes: {
      1: [
        {n:1,t:'The Exile',d:'60m',desc:"Cast out from her home realm, Kira discovers an impossible power."},
        {n:2,t:'Realm of Ash',d:'57m',desc:"The first jump lands Kira in a world already consumed by the fracture."},
        {n:3,t:'The Shattered Sea',d:'58m',desc:"A realm of perpetual storms holds a key artifact — and a deadly guardian."},
        {n:4,t:'Echoes of the First Age',d:'61m',desc:"An ancient being reveals the true origin of the fracture."},
        {n:5,t:'Blood of the Void',d:'64m',desc:"Kira must sacrifice her passage home to seal a breach threatening all realms."},
      ],
      2: [
        {n:1,t:'Scarred Realm',d:'58m',desc:"Kira arrives in a realm that has already survived one cycle of the fracture — barely."},
        {n:2,t:'The Titan Gates',d:'55m',desc:"Ancient gates could unlock a path to the fracture's origin — if they can be opened."},
        {n:3,t:'Bound',d:'60m',desc:"Captured by a realm-lord who wants to weaponize her ability."},
        {n:4,t:'The Last Threshold',d:'63m',desc:"Kira learns the fracture has a consciousness — and it knows her name."},
      ],
      3: [
        {n:1,t:'Origin Realm',d:'65m',desc:"The realm where the fracture began. Nothing here is what it seems."},
        {n:2,t:'The Architect',d:'58m',desc:"The being responsible for the fracture reveals its purpose."},
        {n:3,t:'Unmade',d:'61m',desc:"Kira's ability begins to unravel her own timeline."},
        {n:4,t:'The Mending',d:'72m',desc:"Series finale. To seal the fracture, Kira must unmake herself."},
      ]
    }
  },
  'Glass City': {
    match:'85%', year:'2024', age:'TV-MA', seasons:'2 Seasons', seasonCount:2,
    bg:'linear-gradient(135deg,#355c7d,#6c5b7b,#c06c84)', art:'🌆',
    desc:"In a gleaming megacity where every citizen is continuously rated, a detective investigating disappearances discovers that the city's utopia is built on something unspeakable.",
    cast:'Finn Cole, Dana Park, Victor Leal, Mira Sung',
    genres:'Dystopian Crime, Sci-Fi Drama',
    mood:'Paranoid, Stylish, Thought-provoking',
    episodes: {
      1: [
        {n:1,t:'Perfect Score',d:'53m',desc:"Detective Renn is assigned a case the city's system says can't exist."},
        {n:2,t:'Below the Algorithm',d:'49m',desc:"Following the data leads somewhere the architects never wanted anyone to find."},
        {n:3,t:'The Unrated',d:'51m',desc:"Renn discovers a hidden community of citizens erased from the system entirely."},
        {n:4,t:'Zero Floor',d:'55m',desc:"The truth beneath the city is worse than any conspiracy Renn had imagined."},
      ],
      2: [
        {n:1,t:'New Score',d:'52m',desc:"Renn is reinstated — with a perfect rating and no memory of the last six months."},
        {n:2,t:'The Architects',d:'49m',desc:"Who built the system, and why? The answer is older than the city."},
        {n:3,t:'Opt Out',d:'54m',desc:"A mass defection event triggers the city's hidden emergency protocols."},
        {n:4,t:'Final Rating',d:'58m',desc:"Season finale. The system gets one last chance to rate Renn. She gets one last chance to break it."},
      ]
    }
  },
  'Ember Falls': {
    match:'82%', year:'2024', age:'TV-14', seasons:'1 Season', seasonCount:1,
    bg:'linear-gradient(135deg,#e96c5a,#f6d365)', art:'🔥',
    desc:"Two strangers are stranded at a remote mountain lodge during a blizzard. What starts as friction becomes something neither expected — but the storm outside is the least dangerous thing keeping them together.",
    cast:'Aria Voss, Noah Lane',
    genres:'Romantic Drama, Limited Series',
    mood:'Warm, Intimate, Bittersweet',
    episodes: {
      1: [
        {n:1,t:'Stranded',d:'44m',desc:"Ada and Leo are the only guests left when the mountain roads close."},
        {n:2,t:'Day Two',d:'42m',desc:"Forced to share the lodge's only working fireplace, their defenses start to crack."},
        {n:3,t:'Night Three',d:'46m',desc:"A shared secret changes everything between them."},
        {n:4,t:'The Thaw',d:'48m',desc:"The storm lifts. Now comes the harder question: what happens when the real world rushes back in?"},
      ]
    }
  }
};

// Runtime store for titles added via admin panel
const CUSTOM_SHOWS = {};
