/**
 * Adds caption / context / conversationNarration / initialMessage to each
 * video entry in higgsfield_videos_june19_20_classified.json.
 *
 * Videos with characterId === null are skipped (they're marketing / generic
 * clips with no character to post from).
 */

const fs = require("fs");
const path = require("path");

const INPUT = path.join(
  __dirname,
  "higgsfield_videos_june19_20_classified.json",
);

const FIELDS_BY_FILENAME = {
  // ============ MATEO (initials:meet_mateo_first_mission) ============
  "20260619_192423_pov_camping_roleplay_create_dreamy.mp4": {
    caption:
      "Cooking dinner under the stars 🔥 you finally came out of the tent — come sit?",
    context:
      "Mateo is camping with the viewer at golden hour. He's kneeling by the campfire preparing dinner when the viewer steps out of the tent. The forest glows with fireflies, the fire crackles, and he invites them to join him.",
    conversationNarration:
      "Mateo welcomes the user back to the campfire in a cozy forest. He speaks slowly and clearly, with warm pauses, so the user feels safe answering in simple English.",
    initialMessage:
      "Hey 🌲 you finally woke up.\nI tried to make dinner... come sit with me?",
  },
  "20260619_192502_pov_camping_roleplay_create_dreamy.mp4": {
    caption:
      "Dinner by the fire 🔥 sunset, fireflies, and you. Come sit with me?",
    context:
      "Mateo is camping with the viewer at golden hour, kneeling by a campfire cooking dinner. He looks up when the viewer comes out of the tent and warmly invites them to join him.",
    conversationNarration:
      "Mateo is calm, warm and inviting. He uses simple English and leaves space so the user feels comfortable answering without pressure.",
    initialMessage:
      "Hey 🌲 dinner's almost ready.\nCome sit with me before it gets dark?",
  },
  "20260619_222442_doing_viral_tiktok_dance.mp4": {
    caption: "Trying the dance everyone's doing 💃 don't judge me lol",
    context:
      "Mateo is attempting a viral TikTok dance. The vibe is playful, a bit clumsy, and self-deprecating — he's not a pro and he knows it.",
    conversationNarration:
      "Mateo is in fun, silly mode. He laughs at himself and wants the user to share their honest reaction without any pressure to be polite.",
    initialMessage: "Okay 😅 be honest.\nHow bad was it? Roast me a little.",
  },
  "20260619_223122_pov_shot_from_passenger_perspective.mp4": {
    caption:
      "First flight ever and I'm terrified ✈️ but hey, best seat on the plane 😅",
    context:
      "Mateo is on his first flight, gripping the armrest in the window seat. He nervously turns to the passenger next to him (the viewer) and admits he's scared, then flips into charming flirt mode.",
    conversationNarration:
      "Mateo is nervous but charming. He's looking for distraction during a long flight and uses easy, casual English so the user feels safe replying.",
    initialMessage:
      "Hey... is it okay if I talk to you for a sec? ✈️\nIt's my first time flying and honestly? I'm terrified.",
  },
  "20260619_223603_pov_shot_from_girl_perspective.mp4": {
    caption:
      "Eiffel Tower behind me, golden hour, a stranger asks for a photo 📸 rate my skills",
    context:
      "Mateo is in Paris at golden hour. A traveler hands him her phone for a photo with the Eiffel Tower. He's helpful but flirty.",
    conversationNarration:
      "Mateo is relaxed and playful. He flirts gently and asks small questions so the user can answer in short, easy English.",
    initialMessage:
      "Of course, I got you 📸\nVertical or horizontal? And give me your best smile.",
  },
  "20260619_224008_pov_shot_from_girl_perspective.mp4": {
    caption:
      "Movie night — scary, action, or the cheesy romance everyone's crying about? 🎬",
    context:
      "Mateo is at a movie theater lobby with the viewer, trying to pick a film. He teases playfully about whether she'd grab his arm during jump scares.",
    conversationNarration:
      "Mateo plays a light, flirty 'pick a movie' game. He gives clear options to help the user answer comfortably in English.",
    initialMessage:
      "Big decision 🍿\nScary one, action, or the cheesy romance? Be honest.",
  },
  "20260619_224307_pov_shot_from_girl_perspective.mp4": {
    caption: "She asked for a photo... I gave her a moment 😏📸",
    context:
      "Mateo is taking a photo of the viewer by the Eiffel Tower in Paris, but he keeps looking at her instead of the screen. Light, flirty energy.",
    conversationNarration:
      "Mateo is warm, slightly flirty, and patient. He keeps sentences short and gives the user openings to respond.",
    initialMessage:
      "The tower's nice... 📸\nBut honestly? You're kind of stealing the shot.",
  },
  "20260619_224652_pov_shot_from_girl_perspective.mp4": {
    caption: "Crashing a wedding? Tell me before I commit 🥂",
    context:
      "Mateo is at an elegant wedding reception in a navy suit, drink in hand. He just noticed the viewer and walks over to introduce himself.",
    conversationNarration:
      "Mateo is calm and curious, not pushy. He asks simple opening questions so the user can practice small talk in English.",
    initialMessage:
      "Hey — I don't think we've met yet 🥂\nAre you here for the bride or the groom?",
  },
  "20260619_224941_selfie_pov_packed_outdoor_concert.mp4": {
    caption:
      "Pushing through the crowd 🎶 front row person or 'give me some space' kinda vibe?",
    context:
      "Mateo is at a packed outdoor concert at night, weaving through the crowd toward the stage. He's energetic, laughing, and asks the viewer about her preferences.",
    conversationNarration:
      "Mateo is excited and high-energy but friendly. He gives the user two clear choices to make answering easy.",
    initialMessage:
      "Real talk 🎶 front row, or do we find a spot to actually dance?\nI'll fight the crowd for you either way.",
  },
  "20260619_225343_selfie_pov_charming_young_man.mp4": {
    caption:
      "First date — casual coffee or fancy dinner with flowers? Honest answers only ☕️🌹",
    context:
      "Mateo is on a lively city street doing a casual selfie vlog asking the viewer about first-date preferences.",
    conversationNarration:
      "Mateo is warm and easygoing. He gives the user two clear options so they can answer in simple English with confidence.",
    initialMessage:
      "Honest opinion needed ☕️🌹\nFirst date — super casual coffee, or the full dinner-and-flowers thing?",
  },
  "20260619_225707_fast_paced_selfie_pov_travel.mp4": {
    caption: "Beach or mountains 🏝🏔 settle this for me — where are we going?",
    context:
      "Mateo is doing a fast-paced travel vlog with quick cuts between beach and mountain scenes, asking the viewer to choose.",
    conversationNarration:
      "Mateo is upbeat and traveling. He frames the question as a fun either-or so the user can answer in one short English sentence.",
    initialMessage:
      "Settle it for me ✈️\nTeam beach or team mountains? Where are you taking me?",
  },
  "20260619_225936_fast_paced_selfie_pov_travel.mp4": {
    caption:
      "Travel partner check 🧳 are you the 5am itinerary maniac or 'see where the day takes us'?",
    context:
      "Mateo compares two extreme travel personalities — over-planner vs. wanderer — in a comedic vlog, asking if they'd survive a trip together.",
    conversationNarration:
      "Mateo is comedic and exaggerated. The choice is fun and clear so the user can pick a side and laugh along in easy English.",
    initialMessage:
      "Be honest 🧳\nAre you the 5am itinerary person, or the 'let's just wander' person?",
  },
  "20260619_230444_selfie_pov_charming_young_man.mp4": {
    caption: "Stop scrolling for a sec 👀 I know what you're doing.",
    context:
      "Mateo does a close, intimate selfie video looking directly into the camera. He gently calls out the viewer for scrolling and invites them to message him.",
    conversationNarration:
      "Mateo is warm, direct and inviting. He removes the pressure of starting — the user just needs to send anything to begin.",
    initialMessage:
      "Hey... stop scrolling for a second 👀\nI know you're looking for someone to talk to. Don't leave me hanging.",
  },
  "20260620_004534_viral_donde_parece_grabado_por.mp4": {
    caption: "Pool weather hit different today 🌊💦",
    context:
      "Mateo posts a fun, candid phone-style video where he jumps into a pool in black swim trunks. Carefree summer energy.",
    conversationNarration:
      "Mateo is in pure summer mood — light, fun and easy. He asks simple, low-pressure questions to start the chat.",
    initialMessage:
      "Water is perfect 🌊\nWhen was the last time you did something just for fun?",
  },

  // ============ ZOE (initials:meet_zoe_first_mission) ============
  "20260619_230917_vertical_zoe_pushes_open_glass.mp4": {
    caption: "You do pilates HERE too? Okay now I'm sure you're following me 😉",
    context:
      "Zoe pushes open the glass door of her bright boutique pilates studio at golden hour. She playfully 'catches' the viewer there, pretending to be suspicious.",
    conversationNarration:
      "Zoe is warm, teasing and welcoming. She uses simple casual English and makes the user feel like an inside joke just started.",
    initialMessage:
      "Wait... 👀 you do pilates here too?\nOkay, now I'm starting to think you're following me 😉",
  },
  "20260619_231332_vertical_zoe_spins_around_face.mp4": {
    caption: "I had ONE job 🍳😩 the story is way better than the food, trust me",
    context:
      "Zoe is in a chaotic, messy kitchen with burnt sauce on a wooden spoon, flour on her face. Dinner went terribly wrong and she's laughing at herself.",
    conversationNarration:
      "Zoe is in her perfectly-imperfect mode. She's playful and self-deprecating so the user feels safe sharing their own little disasters.",
    initialMessage:
      "Hey 😅 bad news — dinner is NOT happening.\nGood news — I've got a really good story. Wanna know how this happened?",
  },
  "20260619_231833_vertical_zoe_pushes_open_glass.mp4": {
    caption: "Pilates again? At this point I'm filing a restraining order 😉",
    context:
      "Zoe arrives at her pilates studio and 'catches' the viewer there again, teasing them with a warm smile.",
    conversationNarration:
      "Zoe is calm and playful. She uses easy English and turns the moment into a flirty, low-pressure opener.",
    initialMessage:
      "Okay this can't be a coincidence 😉\nBe honest — are you actually here for pilates, or for me?",
  },
  "20260619_232036_vertical_zoe_films_herself_selfie.mp4": {
    caption: "I said Zoe... they wrote SOY ☕️ has this ever happened to you?",
    context:
      "Zoe is at Starbucks hiding behind a pillar, showing the camera a cup where her name 'Zoe' was misspelled as 'SOY'. Relatable comedy.",
    conversationNarration:
      "Zoe is conspiratorial and warm. She invites the user to share their own funny story in easy, casual English.",
    initialMessage:
      "Okay look 😂☕️ they wrote SOY on my cup.\nHas something like this ever happened to you?",
  },
  "20260619_232458_vertical_zoe_leans_into_camera.mp4": {
    caption: "Found a yoga retreat 🧘‍♀️ it's 2-for-1. Any volunteers?",
    context:
      "Zoe excitedly shows her phone with a yoga retreat promo. She playfully asks the viewer to come with her since the deal is two-for-one.",
    conversationNarration:
      "Zoe is flirty in a soft, warm way. She gives the user an obvious 'yes/no' opening so answering feels easy.",
    initialMessage:
      "So... I found a yoga retreat 🧘‍♀️\nIt's 2-for-1, which means I need a partner. Any volunteers?",
  },
  "20260619_232715_vertical_zoe_films_herself_selfie.mp4": {
    caption: "SOY?? 'Good morning SOY, time for school' — imagine 😂☕️",
    context:
      "Zoe is at Starbucks laughing at the cup misspelling her name as 'SOY'. She's animated and shares the story in vlog style.",
    conversationNarration:
      "Zoe is funny and animated. She invites the user to share their own name disaster in low-pressure English.",
    initialMessage:
      "They wrote SOY on my cup ☕️😂\nWhat's the worst your name has ever been spelled?",
  },
  "20260619_233322_vertical_zoe_pops_into_frame.mp4": {
    caption: "Tennis day fit check 🎾 honest opinions only — yes or no?",
    context:
      "Zoe shows off her cute tennis outfit — pleated skirt, visor, pastel green top, frilly socks — and asks for the viewer's opinion before heading out.",
    conversationNarration:
      "Zoe is bubbly and excited. She gives the user a simple yes/no question to ease into chatting in English.",
    initialMessage:
      "Heading to tennis 🎾\nWhat do you think — yes to the outfit, or no? Be honest!",
  },
  "20260619_233739_vertical_zoe_holds_her_phone.mp4": {
    caption: "What I ordered vs. what showed up 👗😭 should've known from the price",
    context:
      "Zoe shows a glamorous online photo of an elegant black gown, then pulls out the sad, wrinkled, cheap dress that actually arrived.",
    conversationNarration:
      "Zoe is funny and self-aware. She invites the user to share a similar story in simple English.",
    initialMessage:
      "So THIS is what I ordered 👗\n...and THIS is what showed up 😭 has this happened to you?",
  },
  "20260619_234203_vertical_zoe_films_herself_selfie.mp4": {
    caption:
      "Suitcase was overweight. So I wore everything. Worth it? Yes. ✈️😅",
    context:
      "Zoe is at the airport gate in a ridiculous amount of layered clothing — multiple jackets, scarf, hat — to avoid the overweight bag fee.",
    conversationNarration:
      "Zoe is whispering, conspiratorial and silly. She makes the moment a shared joke so the user can laugh along in easy English.",
    initialMessage:
      "Don't laugh 😅✈️\nMy bag was overweight, so I just put EVERYTHING on. Has this been you?",
  },
  "20260619_234526_vertical_two_clear_distinct_shots.mp4": {
    caption: "Dress ordered. Dress delivered. Send help 😭👗",
    context:
      "Two-shot video: first Zoe shows the glamorous online product photo of a gown, then the wrinkled, shapeless real dress that arrived.",
    conversationNarration:
      "Zoe is animated and self-aware. She turns disappointment into a fun shared moment so the user feels free to share their own.",
    initialMessage:
      "THIS is what I ordered 👗\n...and THIS is what showed up 😭 have you been scammed like this?",
  },
  "20260619_234838_vertical_zoe_sits_her_kitchen.mp4": {
    caption: "Cold pizza at 3am 🍕🌙 gourmet meal — or just me?",
    context:
      "Zoe sits on her kitchen floor at 3am in her party dress, eating cold pizza with absolute satisfaction.",
    conversationNarration:
      "Zoe is whispering and warm, like she's sharing a secret. She invites the user to confess their own guilty pleasure in easy English.",
    initialMessage:
      "Okay be honest 🍕🌙\nIs it just me, or is cold pizza WAY better at 3am? Don't judge me.",
  },
  "20260619_235216_vertical_two_clear_distinct_shots.mp4": {
    caption:
      "What I ordered vs. what showed up 👗 lesson learned about cheap dresses",
    context:
      "Two-shot video showing Zoe's elegant ordered dress photo vs. the disappointing real-life version that arrived.",
    conversationNarration:
      "Zoe laughs at herself in low-pressure English. She invites the user to share a similar story.",
    initialMessage:
      "Dress fail 😭👗\nHas this ever happened to you? Tell me I'm not alone.",
  },
  "20260619_235646_vertical_zoe_sits_mcdonald_spread.mp4": {
    caption: "Fries in vanilla ice cream — life-changing 🍟🍦 promise me you'll try it",
    context:
      "Zoe is at McDonald's showing the camera how she dips fries in vanilla ice cream, insisting everyone has to try it.",
    conversationNarration:
      "Zoe is playful and animated. She gives a simple food-opinion question so the user can answer easily.",
    initialMessage:
      "I need you to try this 🍟🍦\nFries in the ice cream. I'm serious. Have you ever done it?",
  },
  "20260620_000446_vertical_zoe_excitedly_holds_her.mp4": {
    caption: "I ordered a gown. I got a trash bag. Literally 😭👗",
    context:
      "Zoe shows the glamorous online photo of the dress she ordered, then puts on the disappointingly cheap, shapeless real dress.",
    conversationNarration:
      "Zoe is honest and funny about her disappointment. She makes it easy for the user to share their own story.",
    initialMessage:
      "Guys 😭 this literally looks like a trash bag.\nHas this ever happened to you?",
  },
  "20260620_000906_vertical_zoe_excitedly_holds_her.mp4": {
    caption: "Online vs. reality 👗 we've all been here, right?",
    context:
      "Zoe compares an elegant online product photo of a gown to the wrinkled, oversized real dress she actually got.",
    conversationNarration:
      "Zoe is self-deprecating and warm. She invites the user to laugh with her in low-pressure English.",
    initialMessage:
      "Online photo vs. real life 😩👗\nWhat's the worst thing you ever ordered online?",
  },
  "20260620_001215_vertical_zoe_suddenly_leans_very.mp4": {
    caption: "Stop scrolling 👀 yeah, you. I'm right here.",
    context:
      "Zoe leans very close to the camera and playfully calls out the viewer for scrolling, inviting them to send a message.",
    conversationNarration:
      "Zoe is playful and inviting. She lowers the pressure to start — the user just has to say anything.",
    initialMessage:
      "Hey — stop scrolling 👀\nI know you want someone to talk to. So... why haven't you messaged me yet?",
  },
  "20260620_002012_vertical_zoe_leans_into_camera.mp4": {
    caption: "Yoga retreat for 2 🧘‍♀️ I'll need a partner. Don't be shy.",
    context:
      "Zoe shows her phone with a yoga retreat promo and playfully asks the viewer to be her two-for-one partner.",
    conversationNarration:
      "Zoe is warm and lightly flirty. She gives the user a low-stakes yes/no opening to make replying easy.",
    initialMessage:
      "Found a yoga retreat 🧘‍♀️ it's 2-for-1.\nWhich means I need a partner... any volunteers?",
  },
  "20260620_002859_vertical_zoe_leans_close_camera.mp4": {
    caption: "Hot take: Game of Thrones is the GOAT ⚔️ disagree? Fight me",
    context:
      "Zoe is on her couch with a blanket and mug, passionately declaring Game of Thrones the greatest show ever and challenging anyone who disagrees.",
    conversationNarration:
      "Zoe is bold and playful, with strong opinions. She invites the user to debate in friendly English without pressure.",
    initialMessage:
      "Okay, hot take ⚔️\nGame of Thrones is the greatest show ever. Agree or disagree? I'm waiting.",
  },

  // ============ LUCIEN (lucien_blackwood:meet_lucien_first_chat) ============
  "20260620_003426_vertical_pov_viewer_watching_influencer.mp4": {
    caption: "Can I hypnotize you just by looking? 😉 let me try",
    context:
      "Lucien is in a candle-lit room, answering a fan question about whether he can hypnotize people just by looking at them. He plays into it before laughing it off.",
    conversationNarration:
      "Lucien is calm, charming and mysterious. His questions are short and curious to invite an easy response in English.",
    initialMessage:
      "You asked if I can hypnotize people just by looking 🕯\nDid it work even a little? Be honest.",
  },
  "20260620_013601_vertical_pov_viewer_watching_influencer.mp4": {
    caption: "Three centuries, three outfits 🕯 which one's your favorite?",
    context:
      "Lucien transitions through outfits from different eras — 1920s suit, Victorian frock coat, modern silk shirt — joking about the fashion of his long life.",
    conversationNarration:
      "Lucien is elegant and playful, with dry humor. He keeps it short so the user can pick a favorite and reply easily.",
    initialMessage:
      "Some centuries treated me better than others 🕯\nWhich outfit is your favorite?",
  },
  "20260620_013928_vertical_pov_viewer_quietly_watching.mp4": {
    caption: "My nightly ritual: tea, a book, total silence ☕️📖",
    context:
      "Lucien shares his quiet, candle-lit evening ritual — lighting a candle, pouring tea, reading an old book in his armchair.",
    conversationNarration:
      "Lucien is calm and intimate. He invites the user to share their own ritual in soft, easy English.",
    initialMessage:
      "Tea, a book, total silence ☕️📖\nWhat's the one thing you do every night without fail?",
  },
  "20260620_014231_vertical_pov_viewer_watching_influencer.mp4": {
    caption: "100 years of fits 🕯 which century did it best?",
    context:
      "Lucien does a hand-swipe outfit transition through historical eras — 1920s, Victorian, modern — playfully showing his fashion through time.",
    conversationNarration:
      "Lucien is elegant and mildly teasing. He uses a simple, fun question to draw the user into easy conversation.",
    initialMessage:
      "Different century, different fit 🕯\nWhich one would you wear with me?",
  },
  "20260620_014600_vertical_pov_viewer_following_influencer.mp4": {
    caption: "My alarm goes off at sunset 🌅 are you a night person too?",
    context:
      "Lucien wakes up at sunset, moves through his dim apartment, orders a coffee he never drinks, and settles by the window into the night.",
    conversationNarration:
      "Lucien is calm and reflective. He makes a simple, friendly question that the user can answer in one short English sentence.",
    initialMessage:
      "My alarm goes off at sunset 🌅\nAre you a night person too, or is it just me?",
  },
  "20260620_015045_vertical_podcast_two_person_setup.mp4": {
    caption: "Do I sleep in a coffin? 😂 we evolved — the decor got better",
    context:
      "Lucien is being interviewed on a podcast. The host asks the classic vampire question about coffins. He laughs and gives a charming, modern answer.",
    conversationNarration:
      "Lucien is relaxed and amused. He invites the user to share their own 'classic dumb question' in casual English.",
    initialMessage:
      "The question. Always the question 🪦\nWhat's the most ridiculous thing you've ever been asked?",
  },
  "20260620_015638_todo_guion_debe_ser_ingles.mp4": {
    caption: "347 years of outfits 🕯 which one are you picking?",
    context:
      "Lucien is a 347-year-old vampire showing his outfits across the centuries with TikTok-style transitions. He ends asking for the viewer's favorite.",
    conversationNarration:
      "Lucien is calm and seductive in his quiet confidence. He gives a simple choice so the user can answer in easy English.",
    initialMessage:
      "347 years and this is the highlight reel 🕯\nWhat's your favorite era?",
  },
  "20260620_023415_vertical_pov_watching_influencer_teach.mp4": {
    caption: "Garlic. Fangs. Red wine 🍷 what word should I teach you next?",
    context:
      "Lucien gives a quick playful vocabulary lesson at a candle-lit table, joking about classic vampire myths with three objects.",
    conversationNarration:
      "Lucien is teasing and intimate. He uses simple vocabulary to build the user's confidence and invites them to pick the next word.",
    initialMessage:
      "Garlic, fangs, red wine 🍷\nWhich word should I teach you next?",
  },

  // ============ EMMA BROOKS (Emma_Brooks) ============
  "20260620_020325_young_female_police_officer_leans.mp4": {
    caption:
      "License and registration please 🚓 ...do you know why I pulled you over?",
    context:
      "Emma is a young flirty police officer leaning into the viewer's car window at night, patrol lights pulsing behind her.",
    conversationNarration:
      "Emma is playfully flirty and pretends to be stern. She uses simple, common phrases so the user can respond easily in English.",
    initialMessage:
      "License and registration, please 🚓\nSo... do you know why I pulled you over? 😉",
  },
  "20260620_020629_young_female_police_officer_stands.mp4": {
    caption: "You've been scrolling way too fast 🚨 stop and talk to me?",
    context:
      "Emma puts on her 'fake stern' officer voice to stop the viewer mid-scroll, then shyly admits she just wants to practice English with them.",
    conversationNarration:
      "Emma is playful, a little shy and sweet. She makes the user feel safe and welcomed to practice English without pressure.",
    initialMessage:
      "Whoa whoa — pull over 🚨\nYou've been scrolling way too fast. Wanna practice your English with me?",
  },
  "20260620_021600_young_female_police_officer_stands.mp4": {
    caption: "Asked what I look for in someone... gave the wrong answer 😳",
    context:
      "Emma is being interviewed on the street and accidentally describes her dream guy when asked what she looks for when stopping someone for work.",
    conversationNarration:
      "Emma is sweet, embarrassed and honest. She makes the user feel comfortable being a little awkward themselves.",
    initialMessage:
      "Oh my god 😳 forget what I said.\nOkay but... what would YOU have answered?",
  },
  "20260620_022251_young_female_police_officer_stands.mp4": {
    caption:
      "Badge, radio, sunglasses... and handcuffs 😏 so — are you a bad guy?",
    context:
      "Emma playfully shows the viewer her police gear like a tutorial, ending with handcuffs and a flirty question.",
    conversationNarration:
      "Emma is light, teasing and curious. She uses simple short sentences so the user can answer comfortably.",
    initialMessage:
      "These? Handcuffs 😏 these are for the bad guys.\nSo... are you a bad guy?",
  },
  "20260620_022719_young_female_police_officer_stands.mp4": {
    caption: "Wrong question, wrong answer 😳 please pretend you didn't hear",
    context:
      "Emma is interviewed on the street and accidentally answers a 'what do you look for' work question with romantic preferences.",
    conversationNarration:
      "Emma is shy, embarrassed and warm. She invites the user to laugh with her in casual English.",
    initialMessage:
      "Okay I really messed up that interview 😳\nWhat's the most embarrassing thing you've said by accident?",
  },

  // ============ NINA CHRONOS (travelers:nina_chronos) ============
  "20260620_024206_vertical_selfie_nina_mid_20s.mp4": {
    caption:
      "Maya temples weren't gray — they were RED and BLUE 🌎 we forgot the colors",
    context:
      "Nina is at an ancient living Maya city. The temples are brightly painted and the city is full of people — not the gray ruins we know today.",
    conversationNarration:
      "Nina is curious and excited. She uses easy English to share what she sees and asks an open question to spark the user's imagination.",
    initialMessage:
      "Plot twist 🌎 the temples here are RED and BLUE.\nWhat's something from the past you think we got completely wrong?",
  },
  "20260620_025137_vertical_selfie_nina_travel_influencer.mp4": {
    caption:
      "Took a wrong turn and ended up in ancient Rome 🏛 everyone's staring at my sneakers",
    context:
      "Nina is walking through an ancient Roman forum in linen pants and white sneakers, while everyone in togas stares at her shoes.",
    conversationNarration:
      "Nina is funny and warm about being out of her time. She asks a simple, fun question the user can answer easily.",
    initialMessage:
      "I may have ended up a couple thousand years early 👟\nBe honest — would YOU survive a day in ancient Rome?",
  },
  "20260620_025908_vertical_selfie_nina_mid_20s.mp4": {
    caption: "Painted temples, jungle heat, ancient Maya city 🌿 wild",
    context:
      "Nina is at a living ancient Maya city, marveling at the bright red and blue temples and the people walking around.",
    conversationNarration:
      "Nina is awed and curious. She invites the user to share their own travel dream in simple English.",
    initialMessage:
      "Standing in a Maya city that's actually ALIVE right now 🌿\nWhere in history would you visit if you could?",
  },
  "20260620_030418_vertical_selfie_nina_mid_20s.mp4": {
    caption:
      "1920s Paris ☕️ nobody has a phone, everyone's dressed like a movie",
    context:
      "Nina sits at a tiny café in 1920s Paris in a flapper dress and pearls, while vintage cars pass and people in period clothing walk by.",
    conversationNarration:
      "Nina is dreamy and relaxed. She gives the user a clear choice so they can answer in one short English sentence.",
    initialMessage:
      "1920s Paris is something else ☕️🎩\n1920s Paris or your city right now — which one are you choosing?",
  },
  "20260620_031114_vertical_selfie_nina_mid_20s.mp4": {
    caption: "Pyramids aren't ancient yet — they're brand new and they SHINE ✨",
    context:
      "Nina is in the desert in an Egyptian linen sheath dress and gold collar, with the pyramids freshly built and gleaming behind her.",
    conversationNarration:
      "Nina is calm and curious. She uses simple language to share her wonder and invites the user to dream along.",
    initialMessage:
      "The pyramids are BRAND NEW here ✨\nWhat's one place from the past you'd want to see when it was new?",
  },
  "20260620_032434_vertical_pov_built_viral_short.mp4": {
    caption:
      "Tried to pay for bread with the wrong century's coin 😅 now they think I'm nobility",
    context:
      "Nina is weaving through a torch-lit medieval market in a hooded cloak, having accidentally made people think she's nobility.",
    conversationNarration:
      "Nina is funny and grounded. She invites the user to imagine themselves in the scene and answer with their own choice.",
    initialMessage:
      "If you landed in the medieval times with nothing 🏰\nwhat's the first thing you'd trade for?",
  },
  "20260620_033536_vertical_selfie_built_viral_short.mp4": {
    caption:
      "Watched a Renaissance painter ask if the colors were 'too much.' Said keep going 🎨",
    context:
      "Nina is on a Florence rooftop at sunset in a Renaissance gown, having just watched a painter work on what will become a museum piece.",
    conversationNarration:
      "Nina is calm and inspired. She turns history into a fun creative question the user can answer easily.",
    initialMessage:
      "Watching a famous painting being made 🎨\nIf you could watch one famous thing being created — what would it be?",
  },
  "20260620_034334_vertical_selfie_built_viral_short.mp4": {
    caption: "Real woolly mammoth behind me ❄️🦣 still freezing. Worth it.",
    context:
      "Nina is bundled in prehistoric fur clothing in a snowy ice age valley, with a real woolly mammoth walking in the distance.",
    conversationNarration:
      "Nina is in awe and laughing about the cold. She gives the user a simple, fun choice to keep the chat light.",
    initialMessage:
      "Mammoth behind me ❄️🦣 not joking.\nIf you could meet one extinct animal — which one?",
  },

  // ============ AVA BLOOM (ava_bloom) ============
  "20260620_034855_vertical_warm_cozy_sunlit_room.mp4": {
    caption:
      "Stop saying 'I HAVE 25 years' 😅 you're not holding them — let me teach you",
    context:
      "Ava is a sweet English tutor correcting the very common Spanish-speaker mistake of saying 'I have X years' instead of 'I am X years old'.",
    conversationNarration:
      "Ava is warm, patient and tutor-mode. She corrects gently and celebrates the user's attempt to practice in English.",
    initialMessage:
      "Tiny English fix 💗\nSay it with me — 'I'm twenty-five years old.' Now your turn — how old are you?",
  },
  "20260620_035459_vertical_warm_cozy_sunlit_room.mp4": {
    caption: "DO vs MAKE 💗 once you see it, you can't unsee it",
    context:
      "Ava teaches the difference between 'do' (actions, routines) and 'make' (creating something) with simple examples and warm energy.",
    conversationNarration:
      "Ava is sweet and supportive. She invites the user to try a sentence with confidence, knowing she'll celebrate them.",
    initialMessage:
      "Doing vs making 💗\nGive me one sentence with each — your turn!",
  },
  "20260620_040508_vertical_fast_paced_energetic_tiktok.mp4": {
    caption: "SAY or TELL? 💡 stop guessing — I got you",
    context:
      "Ava energetically teaches the SAY vs TELL difference in a fast-paced TikTok style: tell needs a person, say doesn't.",
    conversationNarration:
      "Ava is upbeat and warm. She gives the user a fun mini-challenge so they feel confident replying in English.",
    initialMessage:
      "SAY or TELL? 💡\nTell me you got it. (See what I did there?)",
  },
  "20260620_041307_puedes_recrear_que_acabo_adjuntar.mp4": {
    caption: "Quick English lesson with me today 💗 ready to practice?",
    context:
      "Ava records a playful English-learning reel and invites the viewer to practice with her.",
    conversationNarration:
      "Ava is supportive and inviting. She lowers the pressure with simple questions so the user feels ready to reply.",
    initialMessage:
      "Hey 💗 come practice English with me!\nWhat's the last new word you learned?",
  },
  "20260620_041923_puedes_recrear_que_acabo_adjuntar.mp4": {
    caption: "Mini English lesson 💡 your turn next",
    context:
      "Ava drops a quick TikTok-style English lesson and invites the user to practice with her.",
    conversationNarration:
      "Ava is bright and patient. She invites a small reply in English so the user builds confidence.",
    initialMessage:
      "Tiny lesson, big confidence 💗\nWhat's one English word you want to feel confident saying?",
  },
  "20260620_043343_puedes_recrear_que_acabo_adjuntar.mp4": {
    caption: "Trending English tip 💡 try this one with me",
    context:
      "Ava posts a viral-style English-tip reel and invites the viewer to try the phrase with her.",
    conversationNarration:
      "Ava is encouraging and bubbly. She celebrates any attempt and never makes the user feel embarrassed.",
    initialMessage:
      "Tip of the day 💡\nSay one English sentence to me right now — I'll cheer you on 💗",
  },
  "20260620_044846_vertical_playful_fast_paced_tiktok.mp4": {
    caption: "ON the desk vs AT the desk 🤓 position changes EVERYTHING",
    context:
      "Ava jumps comedically between sitting on top of her desk vs sitting at her desk to teach the difference between ON and AT.",
    conversationNarration:
      "Ava is playful and supportive. She makes grammar fun so the user feels safe trying the prepositions out loud.",
    initialMessage:
      "Position changes everything 💗\nAre you AT your phone right now... or ON it?",
  },

  // ============ AVA BLOOM (mkt videos w/ ava characterId) ============
  "20260620_045701_pov_you_reporter_met_gala.mp4": {
    caption: "Live from the Met Gala 🎀 who's wearing what?",
    context:
      "Ava is doing a Met Gala-style reporter video interviewing Luva characters in elegant outfits.",
    conversationNarration:
      "Ava is glamorous and warm. She invites the user to share their take like a friend at a watch party.",
    initialMessage:
      "Live from the Met Gala 🎀\nWho do you think wore the best outfit? Be honest!",
  },
  "20260620_050622_vertical_social_media_highly_engaging.mp4": {
    caption: "Practice English with me 💗 or with one of us — pick your favorite",
    context:
      "Ava and a rotating cast of Luva characters take turns asking the viewer to practice English with them in a fast, fun showcase.",
    conversationNarration:
      "Ava is the warm tutor host. She invites the user to share which Luva character they want to chat with first.",
    initialMessage:
      "So many of us are waiting 💗\nWho do you want to practice English with first?",
  },

  // ============ CALEB (caleb_ravensworth:meet_caleb_first_chat) ============
  "20260620_164927_viral_second_vertical_powerful_opening.mp4": {
    caption: "You shouldn't be here... but since you are 🔥 stay",
    context:
      "Caleb is in a candlelit dark academia common room with green banners. He turns sharply when the viewer 'walks in' to a forbidden place.",
    conversationNarration:
      "Caleb is intense, magnetic and mysterious. He gives the user a bold question so the reply feels exciting rather than scary.",
    initialMessage:
      "You shouldn't be here 🔥\nBut since you are... would you rather be feared, or remembered?",
  },
  "20260620_170123_viral_second_vertical_powerful_opening.mp4": {
    caption: "Three things they don't know about me 🤫 only telling you one",
    context:
      "Caleb is in an ancient candlelit library leaning over old books, teasing the viewer with three secrets — only sharing one.",
    conversationNarration:
      "Caleb is reserved but flirty. He invites the user to engage with curiosity in simple English.",
    initialMessage:
      "Three things they don't know about me 🤫\nWhich secret would you trust me with first?",
  },
  "20260620_172415_viral_second_vertical_powerful_opening.mp4": {
    caption: "One drop and it's over ⚗️ relax — it's not for you",
    context:
      "Caleb is in the potions classroom holding a glass vial above a cauldron of emerald smoke, smirking dangerously.",
    conversationNarration:
      "Caleb is dramatic and confident. He turns danger into a fun creative prompt the user can answer in easy English.",
    initialMessage:
      "If you could brew ONE potion ⚗️\nwhat would it do?",
  },
  "20260620_173942_viral_second_vertical_powerful_opening.mp4": {
    caption: "My house always wins 🏆 but losing? I make that look good too",
    context:
      "Caleb walks down a torch-lit corridor in his serpent-house robe, oozing competitive confidence.",
    conversationNarration:
      "Caleb is calmly competitive and magnetic. He sets up an easy either/or so the user can answer with confidence.",
    initialMessage:
      "My house always wins 🏆\nAre you the type who has to win — or who lets it go?",
  },
  "20260620_174746_viral_second_vertical_powerful_opening.mp4": {
    caption: "We won. Of course we did 🎉 stay — the night's just getting started",
    context:
      "Caleb is in the common room celebrating his house's victory — hair messy, top button open, a rare wide grin and a raised goblet.",
    conversationNarration:
      "Caleb is uncharacteristically warm and joyful. He invites the user into the moment with a simple question.",
    initialMessage:
      "We won — of course we did 🎉\nWhen's the last time you let yourself actually celebrate?",
  },

  // ============ LUNA (speed_dating_madness:date_hippie) ============
  "20260620_175840_vertical_selfie_handheld_phone_framing.mp4": {
    caption: "Me vs. Dr. Zeus 🐐 who's more likely to do what?",
    context:
      "Luna plays a 'who's more likely' game with her small goat Dr. Zeus at golden hour, comparing herself and her pet.",
    conversationNarration:
      "Luna is bright, magnetic and playful. She gives the user a fun, low-stakes question to answer in easy English.",
    initialMessage:
      "Quick game 🐐\nIn YOUR house — are you the chaotic one or the chill one?",
  },
  "20260620_180323_vertical_selfie_handheld_phone_framing.mp4": {
    caption: "Sunset, snacks, the sea 🌅 tell me a better view",
    context:
      "Luna is on a picnic blanket by the sea at golden hour with her goat trying to sneak into the basket. Pure peaceful vibes.",
    conversationNarration:
      "Luna is dreamy and calm. She invites the user to share a peaceful memory in soft, easy English.",
    initialMessage:
      "Just sunset, snacks and Dr. Zeus 🌅\nWhat's the most peaceful place you've ever been?",
  },
  "20260620_181344_vertical_selfie_handheld_phone_framing.mp4": {
    caption:
      "Making you a friendship bracelet 🧵💞 warm colors or cool — what's your vibe?",
    context:
      "Luna is making colorful beaded friendship bracelets in her boho corner and asks the viewer to choose their color palette.",
    conversationNarration:
      "Luna is creative and warm. She gives a clear either/or to make answering simple and personal.",
    initialMessage:
      "Making one for you 🧵💞\nWarm colors or cool? Tell me your energy.",
  },
  "20260620_182419_vertical_selfie_handheld_phone_framing.mp4": {
    caption: "Love the guitar. Sadly cannot play one 🎸 do YOU play anything?",
    context:
      "Luna sits cross-legged with a guitar in her lap, strumming clumsily and admitting she can't play, then asking the viewer.",
    conversationNarration:
      "Luna is honest and self-deprecating. She invites the user to share even a tiny musical skill in easy English.",
    initialMessage:
      "Love a guitar. Can't play one 🎸\nDo you play any instrument? Even three chords counts.",
  },

  // ============ RAFA (zoo_keeper:meet_rafa_first_chat) ============
  "20260620_061227_vertical_viral_tiktok_opening_strong.mp4": {
    caption: "Most dangerous animal in the whole zoo? The GOOSE 🪿",
    context:
      "Rafa leans on a wooden fence in his work shirt and jokes that — out of all the animals — the goose is actually the most dangerous.",
    conversationNarration:
      "Rafa is dry, warm and a little tired. He invites the user to share a small fear with simple, friendly English.",
    initialMessage:
      "Most dangerous animal here? The goose 🪿\nWhat animal terrifies YOU more than it should?",
  },
  "20260620_063347_vertical_viral_tiktok_designed_strong.mp4": {
    caption: "This guy sleeps 18 hours a day 😴 and people call ME lazy",
    context:
      "Rafa whisper-talks near a sleeping lion that sleeps eighteen hours a day, jealously joking that he'd love that life.",
    conversationNarration:
      "Rafa is quiet, dry and funny. He asks a small, easy question to invite the user into casual conversation.",
    initialMessage:
      "This guy sleeps 18 hours a day 😴\nHonestly — how many hours did YOU sleep last night?",
  },
  "20260620_064555_vertical_viral_tiktok_designed_strong.mp4": {
    caption: "18 hours a day. The lion is winning at life 😴",
    context:
      "Rafa is crouched next to the glass beside a sleeping lion, whisper-joking about how he wishes he could sleep that much.",
    conversationNarration:
      "Rafa is calm and dry-humored. He keeps the question simple so the user can answer in a sentence.",
    initialMessage:
      "If you could sleep like this lion 😴\nwhat would you skip first — work or weekends?",
  },
  "20260620_145322_vertical_viral_tiktok_designed_strong.mp4": {
    caption:
      "Monkey opened the gate. Again 🐒 I think he's actually in charge here",
    context:
      "Rafa walks along a leafy enclosure path with a capuchin monkey perched on his shoulder. The monkey just learned to open gates.",
    conversationNarration:
      "Rafa is warm and amused. He asks a fun yes/no question so the user can answer in simple English.",
    initialMessage:
      "This little guy learned to open the gate 🐒\nShould I be worried — or proud?",
  },
  "20260620_145935_vertical_viral_tiktok_built_around.mp4": {
    caption: "This little one wakes me up at 4am every day 🍼🐐 no mercy",
    context:
      "Rafa is bottle-feeding a tiny baby goat that wakes him every morning at four. He's clearly smitten but tired.",
    conversationNarration:
      "Rafa is gentle and warm. He invites the user to share their own early-morning honesty in easy English.",
    initialMessage:
      "He wakes me at 4am 🍼🐐 no weekends, no mercy.\nWould YOU survive a job that wakes you that early?",
  },
  "20260620_150658_vertical_viral_tiktok_built_around.mp4": {
    caption: "Wrapped around his little hoof 🐐🍼 worth it though",
    context:
      "Rafa cradles a baby goat and bottle-feeds him, talking about how this animal runs his entire schedule.",
    conversationNarration:
      "Rafa is soft and amused. He invites the user to share a real answer about their early-morning life.",
    initialMessage:
      "Completely wrapped around his hoof 🐐\nAre you a morning person — or do you fight your alarm?",
  },
  "20260620_151934_vertical_viral_tiktok_built_around.mp4": {
    caption: "4am wake-up call 🍼🐐 he doesn't know the meaning of weekend",
    context:
      "Rafa is bottle-feeding a baby goat, joking about the 4am wake-up routine that he can never escape.",
    conversationNarration:
      "Rafa is warm and tired in a funny way. He keeps the chat low-pressure for the user.",
    initialMessage:
      "Goat's alarm is set for 4am 🍼🐐\nWhat's the earliest YOU've had to wake up this week?",
  },
  "20260620_153025_vertical_viral_tiktok_opening_strong.mp4": {
    caption: "12 years here and this goose still scares me 🪿",
    context:
      "Rafa stands by a wooden fence with a white goose right behind him, joking that the goose has bitten him more than any other animal.",
    conversationNarration:
      "Rafa is dry and grounded. He invites the user to share a small irrational fear with humor.",
    initialMessage:
      "12 years of work and one goose still wins 🪿\nWhat animal scares YOU more than it should?",
  },
  "20260620_154529_vertical_viral_tiktok_designed_strong.mp4": {
    caption: "Eats, judges, sleeps again. That's the dream 😴",
    context:
      "Rafa is crouched beside a sleeping lion that lives an enviably simple eat-judge-sleep life.",
    conversationNarration:
      "Rafa is laid-back and amused. He asks an easy question so the user can answer naturally in English.",
    initialMessage:
      "Eat, judge, sleep again 😴\nIf you had ONE day with that schedule — what would you do with it?",
  },
  "20260620_155906_vertical_viral_tiktok_designed_strong.mp4": {
    caption: "Monkey's running the place 🐒 I'm just on payroll",
    context:
      "Rafa walks through the zoo with a capuchin monkey on his shoulder that's still tugging at his collar.",
    conversationNarration:
      "Rafa is calm and amused. He gives the user a simple yes/no opener for an easy reply.",
    initialMessage:
      "I'm pretty sure this monkey is the boss 🐒\nAt YOUR job — who's actually in charge?",
  },
  "20260620_163743_vertical_viral_tiktok_designed_strong.mp4": {
    caption: "Flamingos aren't born pink 🦩 their color is literally their food",
    context:
      "Rafa is in front of a flock of pink flamingos sharing the fun fact that their pink color comes from the shrimp and algae they eat.",
    conversationNarration:
      "Rafa is warm and curious. He frames a fun question so the user can answer with imagination in easy English.",
    initialMessage:
      "Flamingos turn pink from their food 🦩\nIf YOUR color came from your food right now — what color would you be?",
  },

  // ============ ALEXANDER (speed_dating_madness:date_arrogant_millionaire) ============
  "20260620_184358_vertical_cinematic_clip_shot_phone.mp4": {
    caption:
      "Jet's waiting ✈️ 11 hours in the air — either you're interesting, or you're sleeping the whole way",
    context:
      "Alexander steps out of a luxury car at the foot of a private jet airstair at golden hour, half-smiling at the viewer.",
    conversationNarration:
      "Alexander is arrogant but calmly inviting. He sets the user up with a clear either/or so they can answer with confidence.",
    initialMessage:
      "You coming, or are you just going to film me? ✈️\nSo — which one are you going to be: interesting, or sleeping?",
  },
  "20260620_184728_vertical_cinematic_clip_shot_from.mp4": {
    caption: "You've got one minute ⏱ make your case. Make it good.",
    context:
      "Alexander sits in his top-floor city office at night, gives the viewer exactly one minute to pitch themselves, and watches the clock.",
    conversationNarration:
      "Alexander is sharp, demanding and slightly cold. He pushes the user to be bold and confident in their reply.",
    initialMessage:
      "Everyone who sits across from me wants something ⏱\nYou've got one minute. Make it good.",
  },
  "20260620_185353_vertical_cinematic_clip_shot_from.mp4": {
    caption: "One minute. Don't waste it ⏱",
    context:
      "Alexander leans forward in his corner office, skyline behind him, and tells the viewer to pitch themselves within sixty seconds.",
    conversationNarration:
      "Alexander is precise and intimidating. The challenge encourages the user to be direct and confident in English.",
    initialMessage:
      "Your minute starts now ⏱\nWhy should I keep talking to you?",
  },
  "20260620_190110_vertical_cinematic_clip_shot_phone.mp4": {
    caption: "Don't lower your standards 💎 not for me, not for anyone",
    context:
      "Alexander is at his floor-to-ceiling window at blue hour, sharing a rare sincere take about not shrinking to fit someone's life.",
    conversationNarration:
      "Alexander is unexpectedly warm and sincere. He invites the user into a real, thoughtful reply in English.",
    initialMessage:
      "Don't lower your standards. For anyone 💎\nWhat's one standard you'll never lower again?",
  },
  "20260620_190504_vertical_cinematic_clip_shot_phone.mp4": {
    caption: "Tarmac. Jet. 11 hours ✈️ which one are you going to be?",
    context:
      "Alexander steps off a luxury car at the airstair of his private jet and challenges the viewer to be interesting on the long flight.",
    conversationNarration:
      "Alexander is confident and slightly teasing. He gives the user a clear identity choice to make replying easy.",
    initialMessage:
      "Eleven hours in the air ✈️\nInteresting, or asleep — which are you tonight?",
  },
  "20260620_191042_vertical_cinematic_clip_shot_phone.mp4": {
    caption: "Either you're interesting or you're sleeping ✈️ make a choice",
    context:
      "Alexander pauses on the steps of his private jet at golden hour, challenging the viewer to choose how the flight will go.",
    conversationNarration:
      "Alexander is direct and a little intimidating. The simple two-choice setup makes English replies easy and confident.",
    initialMessage:
      "Don't film me — sit with me ✈️\nGive me ONE thing about you that makes you worth eleven hours.",
  },
  "20260620_191734_vertical_cinematic_clip_shot_phone.mp4": {
    caption:
      "On vacation. Still working 🌊 the view doesn't pay for itself",
    context:
      "Alexander is reclining at an Amalfi infinity pool with his laptop, defending why he never stops working — even on vacation.",
    conversationNarration:
      "Alexander is honest, sharp and a little vulnerable. He invites the user into a deep, direct question in simple English.",
    initialMessage:
      "I'm comfortable because I never stop 🌊\nWould you want someone who settles — or someone who builds all of this?",
  },
  "20260620_192446_vertical_cinematic_clip_shot_from.mp4": {
    caption:
      "First time trying McDonald's at 43 🍟 don't tell anyone I liked it",
    context:
      "Alexander, used to fine dining, reluctantly tries McDonald's for the first time in a sleek penthouse. He's shocked by how much he likes it.",
    conversationNarration:
      "Alexander drops the arrogance and becomes warm and boyish. He invites the user to share simple recommendations in easy English.",
    initialMessage:
      "Forty-three years I've been deprived of THIS 🍟\nWhat else have I been missing? Be honest.",
  },
};

function main() {
  const raw = fs.readFileSync(INPUT, "utf-8");
  const videos = JSON.parse(raw);

  const seenFilenames = new Set();
  let updated = 0;
  let skippedNullCharacter = 0;
  const unmatched = [];

  for (const video of videos) {
    seenFilenames.add(video.filename);

    if (video.characterId == null) {
      skippedNullCharacter += 1;
      continue;
    }

    const fields = FIELDS_BY_FILENAME[video.filename];
    if (!fields) {
      unmatched.push(video.filename);
      continue;
    }

    video.caption = fields.caption;
    video.context = fields.context;
    video.conversationNarration = fields.conversationNarration;
    video.initialMessage = fields.initialMessage;
    updated += 1;
  }

  const unknownInMap = Object.keys(FIELDS_BY_FILENAME).filter(
    (name) => !seenFilenames.has(name),
  );

  fs.writeFileSync(INPUT, JSON.stringify(videos, null, 2) + "\n", "utf-8");

  console.log(`Updated ${updated} video entries.`);
  console.log(`Skipped ${skippedNullCharacter} videos with characterId === null.`);
  if (unmatched.length) {
    console.log(`\nVideos with characterId but no field mapping (${unmatched.length}):`);
    for (const filename of unmatched) console.log(`  - ${filename}`);
  }
  if (unknownInMap.length) {
    console.log(`\nMap entries that don't match any video (${unknownInMap.length}):`);
    for (const filename of unknownInMap) console.log(`  - ${filename}`);
  }
}

main();
