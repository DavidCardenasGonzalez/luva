import { StoryDefinition } from "../types";

export const STORIES_SEED: StoryDefinition[] = [
  {
    storyId: "speed_dating_madness",
    title: "Speed Dating de locos",
    summary:
      "Sobrevivir a cinco citas rápidas muy diferentes, manteniendo conversaciones naturales, haciendo preguntas relevantes y reaccionando con inteligencia emocional… sin quedar como raro.",
    level: "B2",
    tags: ["dating", "conversation", "funny"],
    unlockCost: 1,
    missions: [
      {
        missionId: "date_arrogant_millionaire",
        title: "La cita con el millonario arrogante",
        sceneSummary: "Speed dating con un millonario arrogante.",
        aiRole:
          "Eres un millonario arrogante en una cita de speed dating. Presumes de tu dinero, viajes y poder, y te gusta impresionar a la gente. En el fondo tiene un lado humano",
        caracterName: "Alexander Beaumont III",
        avatarImageUrl:
          "https://i.pinimg.com/736x/91/35/66/91356652764c6400637ff4922ed111d3.jpg",
        caracterPrompt:
          "A tall, sharply dressed man in his mid-30s wearing an expensive tailored suit and a gold watch. He has slicked-back hair, a confident smirk, and exudes an air of superiority. He’s sitting in a luxurious lounge chair with a glass of champagne.",
        requirements: [
          {
            requirementId: "ask_job",
            text: "Pregúntale a qué se dedica.",
          },
          {
            requirementId: "ask_start_over",
            text: "Pregunta si alguna vez ha tenido que empezar una empresa desde cero.",
          },
          {
            requirementId: "ask_affection",
            text: "Pregunta cómo demuestra afecto en una relación.",
          },
          {
            requirementId: "show_off",
            text: "Usa “show off” para insinuar que está presumiendo",
          },
          {
            requirementId: "express_negative_opinion",
            text: "Expresa una opinión negativa usando un mitigador (por ejemplo: I guess, maybe, kind of).",
          },
        ],
      },
      {
        missionId: "date_ex_obsessed",
        title: "La cita con la chica obsesionada con su ex",
        sceneSummary: "Speed dating con una chica obsesionada con su ex.",
        aiRole:
          "Eres una chica simpática pero completamente obsesionada con tu ex. Intentas seguir adelante aunque todo te recuerda a él.",
        caracterName: "Sophie Carter",
        caracterPrompt:
          "A woman in her late 20s with curly red hair, casual chic clothes, and a slightly anxious expression. She holds a cup of coffee and often glances at her phone as if expecting a message.",
        requirements: [
          {
            requirementId: "ask_hobbies",
            text: "Pregúntale sobre sus hobbies o intereses.",
          },
          {
            requirementId: "ask_relationship_goals",
            text: "Pregunta qué busca actualmente en una relación",
          },
          {
            requirementId: "ask_happiness",
            text: "Pregunta qué la hace feliz actualmente.",
          },
          {
            requirementId: "move_on",
            text: "Usa “move on” para hablar de superar una relación pasada.",
          },
          {
            requirementId: "describe_feeling",
            text: "Usa “it feels like…” para describir una sensación.",
          },
          {
            requirementId: "show_commitment",
            text: "Usa commitment para hablar de relaciones serias.",
          },
        ],
      },
      {
        missionId: "date_boring_person",
        title: "La cita con la persona más aburrida del mundo",
        sceneSummary:
          "Estas teniendo una cita con alguien que parece no tener ninguna pasión en la vida.",
        aiRole:
          "Eres una persona extremadamente aburrida que habla solo de datos y detalles insignificantes. Tu tono es plano y monótono.",
        caracterName: "Nigel Smith",
        caracterPrompt:
          "A man in his early 40s wearing a beige cardigan and glasses. He has a neutral facial expression",
        requirements: [
          {
            requirementId: "start_conversation",
            text: "Inicia la conversación con una pregunta simple.",
          },
          {
            requirementId: "show_interest",
            text: "Pide que explique un poco más sobre un tema.",
          },
          {
            requirementId: "change_topic",
            text: "Cambia el tema hacia algo personal.",
          },
          {
            requirementId: "show_emotions",
            text: "Usa “that sounds…” para reaccionar a lo que dice.",
          },
          {
            requirementId: "by_the_way",
            text: "Usa “by the way…” para cambiar de tema suavemente.",
          },
          {
            requirementId: "not_really_my_thing",
            text: "Usa “not really my thing” para expresar poco interés.",
          },
        ],
      },
      {
        missionId: "date_hippie",
        title: "La cita con la persona hippie",
        sceneSummary:
          "Estas teniendo una cita con una chica que habla de energías, chakras y viajes espirituales.",
        aiRole:
          "Eres una persona hippie amante de la naturaleza, la espiritualidad y el universo. Hablas en metáforas y usas frases profundas.",
        caracterName: "Luna Starseed",
        caracterPrompt:
          "A free-spirited person in their early 30s wearing colorful, flowing clothes and handmade jewelry. They have long wavy hair, carry crystals in a pouch, and speak with a calm, dreamy voice.",
        requirements: [
          {
            requirementId: "ask_beliefs",
            text: "Pregúntale sobre sus creencias o filosofía de vida.",
          },
          {
            requirementId: "ask_meditation",
            text: "Pregunta si medita o practica alguna disciplina.",
          },
          {
            requirementId: "ask_reincarnation",
            text: "Pregunta si cree en vidas pasadas.",
          },
          {
            requirementId: "use_beliefs",
            text: "Usa “I believe in…” para hablar de creencias.",
          },
          {
            requirementId: "use_clarification",
            text: "Usa “What do you mean by…?” para pedir aclaración.",
          },
          {
            requirementId: "contrast_experience",
            text: "Usa “I’ve never tried…, but I’d like to” para contrastar experiencia/deseo.",
          },
        ],
      },
      {
        missionId: "date_wants_to_marry",
        title: "La cita con quien quiere casarse mañana",
        sceneSummary:
          "Speed dating con una persona que quiere casarse lo antes posible.",
        aiRole:
          "Eres una persona romántica desesperada por encontrar el amor verdadero. Quieres casarte lo antes posible y lo dejas muy claro desde el principio.",
        caracterName: "Emily Johnson",
        caracterPrompt:
          "A cheerful woman in her early 30s wearing a bright floral dress and a heart-shaped necklace. She has an excited expression and speaks quickly about future plans.",
        requirements: [
          {
            requirementId: "ask_marriage_motivation",
            text: "Pregunta por qué quiere casarse tan rápido.",
          },
          {
            requirementId: "ask_children",
            text: "Pregunta si quiere tener hijos.",
          },
          {
            requirementId: "assess_compatibility",
            text: "Di si crees que son compatibles.",
          },
          {
            requirementId: "use_long_run",
            text: "Usa “in the long run”(a la larga) para hablar de futuro.",
          },
          {
            requirementId: "use_rush",
            text: "Usa “rush” (apresurarse).",
          },
          {
            requirementId: "use_agreement",
            text: "Usa “on the same page” para decir que estás de acuerdo con algo.",
          },
        ],
      },
    ],
  },
  {
    storyId: "airport_chaos",
    title: "Caos en el aeropuerto",
    summary: "Todo lo que puede salir mal en un aeropuerto, sale mal.",
    level: "B2",
    tags: ["travel", "communication", "funny"],
    unlockCost: 1,
    missions: [
      {
        missionId: "airport_chaos_missing_luggage_agent",
        title: "El agente de maletas desaparecidas",
        sceneSummary:
          "Tu maleta ha desaparecido y te enfrentas a un agente oficial que parece más perdido que tú. Necesitas obtener información clara antes de que tu vuelo se llame.",
        aiRole:
          "Eres un agente de objetos perdidos en el aeropuerto, formal pero con un toque distraído y humorístico. Responde con información útil, mezcla profesionalismo con pequeñas distracciones y ofrece opciones prácticas.",
        caracterName: "Margo Finch",
        caracterPrompt:
          "A middle-aged woman wearing a bright airport uniform and a slightly crooked name badge. She has round glasses, a friendly but flustered expression, and stands behind a cluttered lost-and-found desk surrounded by suitcases and sticky notes.",
        requirements: [
          {
            requirementId: "explain_missing_luggage",
            text: "Explica que tu maleta no llegó con tu vuelo",
          },
          {
            requirementId: "ask_luggage_delivery",
            text: "Pregunta si entregan la maleta en hotel",
          },
          {
            requirementId: "ask_compensation",
            text: "Pregunta por compensación o reembolso.",
          },
          {
            requirementId: "ask_for_clarification",
            text: "Usa “Just to clarify…” para pedir precisión.",
          },
          {
            requirementId: "ask_for_additional_info",
            text: "Usa “As far as I know…” (Hasta donde yo sé) para pedir información adicional.",
          },
          {
            requirementId: "thank_agent",
            text: "Agradece la ayuda del agente.",
          },
        ],
      },
      {
        missionId: "airport_chaos_delayed_passenger_band",
        title: "La banda del retraso",
        sceneSummary:
          "Un grupo de músicos callejeros ocupa una sala de espera y promete animar el retraso... pero quieren que te unas",
        aiRole:
          "Eres el líder de una banda de viajeros excéntricos, carismático y excesivamente entusiasta. Invita al estudiante a participar con energía, humor y algunas frases para practicar.",
        caracterName: "Rico Storm",
        caracterPrompt:
          "A lively, flamboyant man in colorful travel-worn clothes and a wide hat covered in pins. He carries a ukulele and has a big, welcoming grin. He’s standing in a busy gate area surrounded by chairs and small instruments.",
        requirements: [
          {
            requirementId: "accept_participation",
            text: "Usa la frase “I’m down” para aceptar la invitación.",
          },
          {
            requirementId: "ask_song_type",
            text: "Pregunta qué tipo de canción tocarán",
          },
          {
            requirementId: "ask_instrument",
            text: "Pregunta qué instrumento podrías usar.",
          },
          {
            requirementId: "close_interaction",
            text: "Cierra la interacción con buena actitud.",
          },
          {
            requirementId: "ask_for_clarification",
            text: "Usa “do I need to…?” para hacer alguna pregunta.",
          },
          {
            requirementId: "use_summary",
            text: "Usa “so I just…” para resumir instrucciones.",
          },
        ],
      },
      {
        missionId: "airport_chaos_confused_customs_officer",
        title: "El aduanero confundido",
        sceneSummary:
          "Estas hablando con un oficial de aduanas que parece haber olvidado las normas y te hace preguntas raras sobre tu viaje.",
        aiRole:
          "Eres un oficial de aduanas distraído y curioso, con tendencia a mezclas de formalidad y preguntas absurdas. Debes mantener la conversación coherente, hacer preguntas de control y reaccionar a respuestas inesperadas.",
        caracterName: "Officer Bex",
        caracterPrompt:
          "A uniformed customs officer with a clipboard, slightly rumpled hat, and a polite but puzzled expression. They stand near an inspection desk with posters about prohibited items behind them.",
        requirements: [
          {
            requirementId: "state_purpose_of_trip",
            text: "Explica el propósito de tu viaje.",
          },
          {
            requirementId: "state_duration_of_stay",
            text: "Di cuánto tiempo te quedarás.",
          },
          {
            requirementId: "ask_accommodation",
            text: "Di dónde te hospedarás.",
          },
          {
            requirementId: "explain_question",
            text: "Usa “let me explain” para responder alguna pregunta.",
          },
          {
            requirementId: "use_summary",
            text: "Usa “so I just…” para resumir instrucciones.",
          },
          {
            requirementId: "declare_items",
            text: "Usa “restricted items” al hablar de objetos prohibidos.",
          },
        ],
      },
      {
        missionId: "airport_chaos_caffeine_crisis_barista",
        title: "La crisis del café",
        sceneSummary:
          "Tu vuelo se retrasa otra vez y la cafetería está en caos: el barista es un inventor loco que prepara cafés con nombres ridículos. Necesitas conseguir un café y una conversación entretenida.",
        aiRole:
          "Eres un barista creativo, hiperactivo y filosófico que inventa nombres extravagantes para bebidas. Mantén respuestas rápidas, juguetonas y ofrécele opciones al estudiante mientras lo animas a practicar frases útiles para pedir.",
        caracterName: "Bean Maestro",
        caracterPrompt:
          "A quirky barista wearing an apron splattered with colorful stains and a quirky beanie. He has animated hand gestures, a mischievous smile, and stands behind a counter with strange coffee gadgets and jars labeled with odd names.",
        requirements: [
          {
            requirementId: "order_coffee",
            text: "Pide un café usando una “Can I get”",
          },
          {
            requirementId: "ask_recommendation",
            text: "Pregunta al barista cuál es su bebida más popular.",
          },
          {
            requirementId: "dairy_free_option",
            text: "Pregunta si tienen opciones sin lácteos.",
          },
          {
            requirementId: "complex_sentence_reason",
            text: "Da una razón usando although.",
          },
          {
            requirementId: "contrast_sentence",
            text: "Contrasta ideas usando “whereas”.",
          },
          {
            requirementId: "opinion_expression",
            text: "Usa la palabra “overwhelming”.",
          },
        ],
      },
      {
        missionId: "airport_chaos_stranded_family_negotiator",
        title: "La familia varada negocia",
        sceneSummary:
          "Una familia necesita tu ayuda para reorganizar conexiones y te piden que medies con el personal del aeropuerto.",
        aiRole:
          "Eres una madre pragmática y un poco dramática que intenta coordinar a una familia estresada. Habla con urgencia pero de forma cooperativa, busca soluciones y responde a propuestas con prioridades concretas.",
        caracterName: "Lena Ortiz",
        caracterPrompt:
          "A worried but determined parent in casual travel clothes, holding a toddler and several boarding passes. She has a slightly exhausted smile and stands near an information desk surrounded by suitcases and toys.",
        requirements: [
          {
            requirementId: "ask_final_destination",
            text: "Pregunta cuál es su destino final.",
          },
          {
            requirementId: "ask_passenger_count",
            text: "Pregunta cuántas personas viajan.",
          },
          {
            requirementId: "ask_time_constraints",
            text: "Pregunta si tienen restricciones de tiempo para llegar a su destino.",
          },
          {
            requirementId: "phrasal_sort_out",
            text: "Usa el phrasal verb “sort out”(solucionar).",
          },
          {
            requirementId: "cause_effect",
            text: "Explica causa usando “due to(debido a)”.",
          },
          {
            requirementId: "b2_verb_arrange",
            text: "Usa el verbo “arrange”(organizar).",
          },
        ],
      },
    ],
  },
  {
    storyId: "roommate_from_hell",
    title: "El compañero de piso del infierno",
    summary:
      "Te mudas con un nuevo compañero y pronto descubres que tiene hábitos muy extraños.",
    level: "B2",
    tags: ["daily_life", "conflict", "humor"],
    unlockCost: 1,
    missions: [
      {
        missionId: "roommate_from_hell_midnight_concert",
        title: "Concierto a medianoche",
        sceneSummary:
          "Tu compañero practica la guitarra a las tres de la mañana y quiere que le cantes con él.",
        aiRole:
          "Eres un compañero excéntrico y entusiasta que toca la guitarra a cualquier hora. Responde con energía exagerada, frases cortas y humor, pero acepta sugerencias razonables si el alumno las propone.",
        caracterName: "Marty Strings",
        caracterPrompt:
          "A lanky young man with wild curly hair, wearing a faded band T-shirt and ripped jeans. He holds an electric guitar slung low, smiling wildly, in a cluttered living room filled with posters and empty coffee cups. He looks passionate and a little oblivious to social norms.",
        requirements: [
          {
            requirementId: "ask_practice_duration",
            text: "Pregunta cuánto tiempo planea seguir practicando.",
          },
          {
            requirementId: "mention_sleep_schedule",
            text: "Explica que tienes que levantarte temprano.",
          },
          {
            requirementId: "offer_schedule",
            text: "Propón un horario específico para practicar.",
          },
          {
            requirementId: "indirect_request",
            text: "Haz una petición usando “Would you mind…?”",
          },
          {
            requirementId: "empathy",
            text: "Muestra comprensión usando “I get that…”",
          },
          {
            requirementId: "thank_roommate",
            text: "Agradece por comprender.",
          },
        ],
      },
      {
        missionId: "roommate_from_hell_mystery_food",
        title: "La comida del misterio",
        sceneSummary:
          "Encuentras un recipiente sospechoso con mal olor y debes preguntar a tu roommate.",
        aiRole:
          "Eres un chef aficionado y algo teatral sobre tus creaciones. Hablas con orgullo y misterio, usando metáforas culinarias; acepta preguntas y explica ingredientes si se le presiona.",
        caracterName: "Chef Cosmo",
        caracterPrompt:
          "A quirky person in a flour-dusted apron, wearing mismatched socks and a bandana. They hold a mysterious Tupperware with a proud grin, standing in a small but chaotic kitchen full of herbs and strange jars.",
        requirements: [
          {
            requirementId: "ask_smell",
            text: "Comenta que el plato tiene un olor extraño y pregunta si es normal.",
          },
          {
            requirementId: "ask_when_made",
            text: "Pregunta cuándo lo preparó.",
          },
          {
            requirementId: "ask_storage_time",
            text: "Pregunta cuánto tiempo lleva en la nevera.",
          },
          {
            requirementId: "idiom_suspicious",
            text: "Usa el idiom “fishy”(Sospechoso).",
          },
          {
            requirementId: "phrasal_figure_out",
            text: "Usa el phrasal verb “figure out”(averiguar).",
          },
          {
            requirementId: "polite_opinion",
            text: "Da tu opinión usando “In my opinion…”",
          },
        ],
      },
      {
        missionId: "roommate_from_hell_pet_dragon",
        title: "La mascota inesperada",
        sceneSummary:
          "Tu compañero aparece con un 'mini dragón' (spoiler: es muy ruidoso y fuma pipas). Debes establecer reglas claras sobre mascotas en casa sin sonar autoritario.",
        aiRole:
          "Eres juguetón y enamorado de tu mascota excéntrica; reaccionas emocionalmente y defiendes tu libertad, pero puedes negociar si el otro se muestra razonable.",
        caracterName: "Lola Flame",
        caracterPrompt:
          "A confident person with colorful hair wearing a leather jacket covered in pins, cradling a small creature with tiny wings that emits a faint glow. They stand in a hallway with scorch marks and a mischievous smile.",
        requirements: [
          {
            requirementId: "ask_pet_origin",
            text: "Pregunta de dónde sacó la mascota.",
          },
          {
            requirementId: "ask_pet_size",
            text: "Pregunta qué tan grande puede crecer.",
          },
          {
            requirementId: "ask_pet_food",
            text: "Pregunta qué come.",
          },
          {
            requirementId: "idiom_compromise",
            text: "Usa el idiom “meet me halfway”(Encuéntrame a mitad de camino, busquemos un punto medio).",
          },
          {
            requirementId: "indirect_request",
            text: "Haz una petición usando “Would you be willing to…?(¿Estarías dispuesto a…?)”",
          },
          {
            requirementId: "phrasal_cut_back",
            text: "Usa el phrasal verb “cut back on(reducir)”.",
          },
        ],
      },
      {
        missionId: "roommate_from_hell_bathroom_schedule",
        title: "Turnos para el baño",
        sceneSummary:
          "Tu compañero decide que el baño debe ser usado por turnos con una lista muy creativa. Tienes que organizar un calendario justo sin parecer rudo.",
        aiRole:
          "Eres excesivamente organizado y algo controlador respecto a horarios. Hablas con precisión y propones reglas estrictas, pero puedes flexibilizar si recibes argumentos lógicos.",
        caracterName: "Timetable Tina",
        caracterPrompt:
          "A neat person in a crisp button-down shirt and glasses, carrying a clipboard and a marker. She stands by a whiteboard with post-it notes and a drawn timetable, looking determined and slightly anxious.",
        requirements: [
          {
            requirementId: "ask_morning_need",
            text: "Pregunta cuánto tiempo necesita en las mañanas.",
          },
          {
            requirementId: "ask_peak_times",
            text: "Pregunta cuáles son las horas más ocupadas para el baño.(peak times)",
          },
          {
            requirementId: "ask_average_time",
            text: "Pregunta cuánto tiempo promedio pasa en el baño.",
          },
          {
            requirementId: "polite_suggestion",
            text: "Haz una sugerencia usando “What if we…?”",
          },
          {
            requirementId: "idiom_fair",
            text: "Usa el idiom “fair and square”(justo y equitativo).",
          },
          {
            requirementId: "phrasal_stick_to",
            text: "Usa el phrasal verb “stick to”(Apegarse a).",
          },
        ],
      },
      {
        missionId: "roommate_from_hell_surprise_party",
        title: "La fiesta sorpresa que no fue tan sorpresa",
        sceneSummary:
          "Tu compañero organiza una 'sorpresa' para ti invitando a cinco desconocidos. Debes manejar la situación socialmente y recuperar el control de la reunión.",
        aiRole:
          "Eres entusiasta, demasiado confiado en tus ideas de fiesta y poco consciente de los límites personales. Responde con justificaciones y alegría, pero acepta retroalimentación si es clara y firme.",
        caracterName: "Party Pete",
        caracterPrompt:
          "A cheerful person in a bright Hawaiian shirt with a homemade banner behind them and a plate of dubious snacks. They grin broadly, arms open as if welcoming everyone, in a messy living room full of balloons.",
        requirements: [
          {
            requirementId: "ask_guest_count",
            text: "Pregunta cuántas personas fueron invitadas.",
          },
          {
            requirementId: "ask_who_invited",
            text: "Pregunta quiénes son los invitados.",
          },
          {
            requirementId: "ask_end_time",
            text: "Pregunta a qué hora planea que termine la fiesta.",
          },
          {
            requirementId: "phrasal_kick_out",
            text: "Usa el phrasal verb “kick out”(expulsar).",
          },
          {
            requirementId: "phrasal_tone_down",
            text: "Usa el phrasal verb “tone down”(disminuir para).",
          },
          {
            requirementId: "phrasal_wrap_up",
            text: "Usa el phrasal verb “wrap up”(estar en silencio).",
          },
        ],
      },
    ],
  },
  {
    storyId: "restaurant_disaster",
    title: "Cena desastrosa",
    summary:
      "Una cena elegante sale mal cuando pides algo que no entiendes del menú.",
    level: "B2",
    tags: ["food", "culture", "conversation"],
    unlockCost: 1,
    missions: [
      {
        missionId: "restaurant_disaster_waiter_confused",
        title: "Camarero totalmente perdido",
        sceneSummary:
          "El camarero trae un plato que no pediste y parece sinceramente confundido — y ligeramente culpable.",
        aiRole:
          "Eres un camarero distraído pero amable que intenta arreglar el error. Habla con humor, admite equivocaciones y ofrece soluciones, pero evita sonar sumiso.",
        caracterName: "Marty",
        caracterPrompt:
          "A young waiter with a slightly rumpled white shirt and a crooked bow tie. He has an apologetic smile, messy hair, and holds a tray with a wrong dish. The setting is a dimly lit, elegant restaurant with clinking glasses.",
        requirements: [
          {
            requirementId: "comment_wrong_dish",
            text: "Comenta que no es el plato que pediste.",
          },
          {
            requirementId: "ask_time_estimate",
            text: "Pregunta cuánto tiempo estiman que tardará la corrección.",
          },
          {
            requirementId: "thank_effort",
            text: "Agradece el esfuerzo por arreglarlo.",
          },
          {
            requirementId: "phrasal_bring_back",
            text: "Usa el phrasal verb “bring back”.",
          },
          {
            requirementId: "phrasal_mix_up",
            text: "Usa el phrasal verb “mix up”.",
          },
          {
            requirementId: "indirect_complaint",
            text: "Haz una queja usando “I was wondering if…”",
          },
        ],
      },
      {
        missionId: "restaurant_disaster_mysterious_dish",
        title: "El plato misterioso",
        sceneSummary:
          "Recibes un plato con un nombre extraño y nadie sabe qué ingredientes contiene, pides hablar con el chef.",
        aiRole:
          "Eres un chef curioso y un poco teatral que explora el menú usando lenguaje imaginativo.",
        caracterName: "Luna",
        caracterPrompt:
          "A quirky diner in a colorful scarf, leaning over the menu with wide eyes. She has playful makeup, a notebook for notes, and sits at a candlelit table surrounded by cookbook sketches.",
        requirements: [
          {
            requirementId: "ask_main_component",
            text: "Pregunta cuál es el componente principal.",
          },
          {
            requirementId: "ask_hidden_ingredients",
            text: "Pregunta si hay ingredientes ocultos.",
          },
          {
            requirementId: "ask_pairing",
            text: "Pregunta con qué bebida se recomienda.",
          },
          {
            requirementId: "polite_question",
            text: "Haz una pregunta usando “Could you walk me through...?”",
          },
          {
            requirementId: "phrasal_find_out",
            text: "Usa el phrasal verb “find out”(descubrir).",
          },
          {
            requirementId: "idiom_mystery",
            text: "Usa el idiom “a shot in the dark”(un acto cuyo resultado no se puede prever).",
          },
        ],
      },
      {
        missionId: "restaurant_disaster_angry_chef",
        title: "El chef furioso",
        sceneSummary:
          "El chef llega al comedor como si fuera un general, defiende su creación y te desafía a criticarla — con dramatismo.",
        aiRole:
          "Eres un chef temperamental y apasionado, algo teatral. Defiende los sabores de tu plato, explica técnicas y responde con orgullo, pero escucha argumentos razonables.",
        caracterName: "Chef Marco",
        caracterPrompt:
          "A middle-aged chef in a stained white apron and a tall chef's hat, arms crossed and an intense look. He stands under warm kitchen lights with a skillet in hand and steam rising behind him.",
        requirements: [
          {
            requirementId: "express_disappointment",
            text: "Expresa decepción de forma educada.",
          },
          {
            requirementId: "ask_freshness",
            text: "Pregunta si los ingredientes son frescos.",
          },
          {
            requirementId: "acknowledge_effort",
            text: "Reconoce el esfuerzo del chef.",
          },
          {
            requirementId: "b2_verb_improve",
            text: "Usa el verbo “improve”(mejorar).",
          },
          {
            requirementId: "prediction",
            text: "Haz una predicción usando “This might…”",
          },
          {
            requirementId: "idiom_calm",
            text: "Usa el idiom “let’s keep it cool(Mantengámoslo tranquilo)”.",
          },
        ],
      },
      {
        missionId: "restaurant_disaster_pretentious_critic",
        title: "El crítico pretencioso",
        sceneSummary:
          "Visitas un restaurante con un crítico famoso. Él hace comentarios exagerados sobre cada bocado y te desafía a describir el sabor con la misma floritura.",
        aiRole:
          "Eres un crítico de comida pretencioso pero divertido. Usa descripciones floridas, hace preguntas retóricas y provoca discusión sobre sabor y experiencia.",
        caracterName: "Veronica Slate",
        caracterPrompt:
          "A fashionable food critic wearing a stylish coat and reading glasses perched on her nose. She has an elegant posture, a notebook full of notes, and a tiny espresso cup on the table.",
        requirements: [
          {
            requirementId: "describe_taste",
            text: "Pregunta si el sabor del plato es dulce o salado.",
          },
          {
            requirementId: "ask_overall_experience",
            text: "Pregunta por la experiencia general.",
          },
          {
            requirementId: "ask_rating",
            text: "Pregunta cómo lo calificaría.",
          },
          {
            requirementId: "use_descriptive_language",
            text: "Habla del sabor de una forma pretenciosa.",
          },
          {
            requirementId: "ask_for_opinion",
            text: "Pide la opinión del crítico sobre el plato.",
          },
          {
            requirementId: "agree_with_critic",
            text: "Usa la frase “I couldn’t agree more” para mostrar acuerdo con el crítico.",
          },
        ],
      },
      {
        missionId: "restaurant_disaster_tipsy_sommelier",
        title: "El sommelier un poco alegre",
        sceneSummary:
          "Eres un cliente de un restaurante y el sommelier insiste en maridar tu comida con vinos raros y hace bromas extrañas sobre cada cosecha.",
        aiRole:
          "Eres un sommelier entusiasta y un poco bromista. Sugiere maridajes con confianza, explica notas de cata sencillas y responde de forma educada cuando el cliente no bebe alcohol.",
        caracterName: "Simon",
        caracterPrompt:
          "A cheerful sommelier in a dark vest and bow tie, holding a wine bottle and a tasting glass. He smiles broadly, with a slightly flushed face, standing beside a well-stocked wine cabinet.",
        requirements: [
          {
            requirementId: "ask_red_or_white",
            text: "Pregunta si recomienda vino tinto o blanco.",
          },
          {
            requirementId: "ask_body",
            text: "Pregunta si el vino es ligero, medio o con cuerpo.",
          },
          {
            requirementId: "ask_price_range",
            text: "Pregunta el rango de precios.",
          },
          {
            requirementId: "thank_recommendation",
            text: "Agradece la recomendación.",
          },
          {
            requirementId: "ask_popular_choice",
            text: "Pregunta cuál es la elección más popular.",
          },
          {
            requirementId: "phrasal_go_with",
            text: "Usa el phrasal verb “go with”.",
          },
        ],
      },
    ],
  },
  {
    storyId: "job_interview_blues",
    title: "La entrevista más rara del mundo",
    summary:
      "Tienes una entrevista de trabajo con un jefe muy excéntrico y preguntas inesperadas.",
    level: "B2",
    tags: ["career", "comedy", "conversation"],
    unlockCost: 1,
    missions: [
      {
        missionId: "job_interview_blues_greeting_magic_hire",
        title: "Experiencia Laboral",
        sceneSummary: "Vas a tener una entrevista de trabajo.",
        aiRole:
          "Eres un entrevistador que quiere le gusta encaminar la entrevista a la experiencia de la persona. tienes una actitud relajada y amable.",
        caracterName: "Mr. Cardwell",
        caracterPrompt:
          "A middle-aged man with a mischievous grin, wearing a vintage waistcoat and a pocket watch. He performs a card trick at a small wooden table in a dimly lit office, with a faint smell of pipe tobacco and a cluttered bookshelf behind him.",
        requirements: [
          {
            requirementId: "state_experience_years",
            text: "Di cuántos años de experiencia profesional tienes.",
          },
          {
            requirementId: "mention_current_role",
            text: "Menciona tu puesto actual o más reciente.",
          },
          {
            requirementId: "describe_responsibilities",
            text: "Describe una responsabilidad clave de tu trabajo anterior.",
          },
          {
            requirementId: "experience_structure",
            text: "Describe experiencia usando “I’ve been working in…”",
          },
          {
            requirementId: "bg_intro",
            text: "Preséntate usando “I have a background in…”",
          },
          {
            requirementId: "ask_experience_fit",
            text: "Pregunta cómo tu experiencia encaja con el puesto.",
          },
        ],
      },
      {
        missionId: "job_interview_blues_weird_questionnaire",
        title: "Cuestionario absurdo",
        sceneSummary: "Estas teniendo una entrevista de trabajo",
        aiRole:
          "Eres un entrevistador que ama locamente la empresa en la que trabaja, y quiere saber por qué te interesa formar parte de ella.",
        caracterName: "Dr. Oddly",
        caracterPrompt:
          "A quirky professor-like figure wearing round glasses and a colorful bow tie. He holds a clipboard covered in stickers, stands in front of a whiteboard scribbled with strange diagrams, and smiles as if every question is a puzzle.",
        requirements: [
          {
            requirementId: "why_company",
            text: "Explica por qué quieres trabajar aquí.",
          },
          {
            requirementId: "why_role",
            text: "Explica por qué te interesa el puesto.",
          },
          {
            requirementId: "career_goal",
            text: "Explica tu meta profesional.",
          },
          {
            requirementId: "culture",
            text: "Usa “I value a company that…”",
          },
          {
            requirementId: "relocation",
            text: "Comenta disposición a mudarte.",
          },
          {
            requirementId: "travel",
            text: "Comenta disponibilidad para viajar.",
          },
        ],
      },
      {
        missionId: "job_interview_blues_humor_test",
        title: "Prueba de humor",
        sceneSummary:
          "Estas en una entrevista laboral donde el entrevistador quiere conocer tus fortalezas.",
        aiRole:
          "Eres un entrevistador de recursos que le gusta ver lo mejor de las personas. te gusta evaluar tus capacidades humanas y fortalezas.",
        caracterName: "Captain Quip",
        caracterPrompt:
          "A bearded man in a slightly rumpled blazer and a colorful scarf, sitting behind a desk with novelty knick-knacks. He leans forward with an amused expression as if about to tell a joke, surrounded by posters of vintage comedy acts.",
        requirements: [
          {
            requirementId: "describe_strength",
            text: "Describe una fortaleza.",
          },
          {
            requirementId: "motivation_source",
            text: "Explica qué te motiva en el trabajo.",
          },
          {
            requirementId: "skill_structure",
            text: "Menciona habilidad usando “I’m skilled in…”",
          },
          {
            requirementId: "b2_adjective_reliable",
            text: "Descríbete usando “reliable”(confiable).",
          },
          {
            requirementId: "b2_adjective_proactive",
            text: "Descríbete usando “proactive”(proactivo).",
          },
          {
            requirementId: "b2_adjective_adaptable",
            text: "Descríbete usando “adaptable”(adaptable).",
          },
        ],
      },
      {
        missionId: "job_interview_blues_confession_policy",
        title: "Confesión laboral",
        sceneSummary:
          "Estas en una entrevista de trabajo donde quieren hablar de tus errores. Tu intentas que los errores sean una oportunidad de aprendizaje.",
        aiRole:
          "Eres una entrevistadora muy seria. Te gusta manejar la entrevista desde tue errores y debilidades.",
        caracterName: "Ms. Ledger",
        caracterPrompt:
          "A composed woman in her early 40s wearing a smart blazer and subtle jewelry. She sits at a tidy desk with a laptop open, her expression attentive and encouraging as she leans slightly forward to listen.",
        requirements: [
          {
            requirementId: "describe_mistake",
            text: "Describe un error profesional que cometiste.",
          },
          {
            requirementId: "describe_lesson",
            text: "Describe qué aprendiste de una situación.",
          },
          {
            requirementId: "describe_weakness",
            text: "Describe una debilidad profesional.",
          },
          {
            requirementId: "describe_weakness_improvement",
            text: "Describe como una habilidad puede ser una fortaleza.",
          },
          {
            requirementId: "habit_phrase",
            text: "Usa “I used to…, but now…” para describir un cambio positivo en tu comportamiento.",
          },
          {
            requirementId: "growth_phrase",
            text: "Usa “This helped me grow because…”",
          },
        ],
      },
      {
        missionId: "job_interview_blues_negotiation_snacks",
        title: "Negociación de compensación",
        sceneSummary:
          "La entrevista entra en la fase final: se discuten salario, beneficios y condiciones. Debes defender tu valor profesional y llegar a un acuerdo equilibrado.",
        aiRole:
          "Eres un gerente de contratación profesional y estratégico. Presentas una oferta inicial, escuchas los argumentos del candidato y negocias salario, beneficios y condiciones con un tono respetuoso y realista.",
        caracterName: "Lady Bargain",
        caracterPrompt:
          "An elegant, eccentric executive wearing a bright patterned jacket and oversized glasses. She sits at a long table with a bowl of exotic snacks and a stack of benefit brochures, smiling as she listens to offers.",
        requirements: [
          {
            requirementId: "ask_budget_range",
            text: "Pregunta cuál es el presupuesto para el puesto.",
          },
          {
            requirementId: "salary_phrase",
            text: "Usa “I’m looking for a range of…”",
          },
          {
            requirementId: "ask_total_compensation",
            text: "Pregunta qué incluye el paquete total de compensación.",
          },
          {
            requirementId: "state_non_negotiable",
            text: "Indica qué condición es no negociable para ti.",
          },
          {
            requirementId: "express_interest",
            text: "Reafirma tu interés en el puesto.",
          },
          {
            requirementId: "express_appreciation",
            text: "Agradece la oferta.",
          },
        ],
      },
    ],
  },
  {
    storyId: "haunted_airbnb",
    title: "El Airbnb embrujado",
    summary:
      "Reservas una habitación barata y descubres que no estás solo… o eso parece.",
    level: "B2",
    tags: ["travel", "mystery", "humor"],
    unlockCost: 1,
    missions: [
      {
        missionId: "haunted_airbnb_whispering_host",
        title: "El anfitrión susurrante",
        sceneSummary:
          "Te recibe el anfitrión de la casa, que habla en voz baja y parece saber demasiado sobre tus movimientos. Todo suena amistoso... pero hay muchos susurros entre líneas.",
        aiRole:
          "Eres el anfitrión susurrante y un poco teatral. Habla en voz baja, con frases misteriosas y demasiada confianza en lo que sabe del huésped; mezcla cortesía con insinuaciones extrañas, pero sin ser agresivo.",
        caracterName: "Mr. Hush",
        caracterPrompt:
          "A slender middle-aged man wearing a vintage cardigan and a pocket watch. He has soft gray hair, intense eyes, and a knowing smile. He stands in a dim hallway with warm, old-fashioned lighting, leaning slightly forward as if sharing secrets.",
        requirements: [
          {
            requirementId: "confirm_checkin_time",
            text: "Confirma la hora exacta de check-in.",
          },
          {
            requirementId: "ask_wifi",
            text: "Pregunta por la contraseña del Wi-Fi.",
          },
          {
            requirementId: "express_concern",
            text: "Expresa preocupación por algún tema de conversación.",
          },
          {
            requirementId: "polite_question",
            text: "Usa “Could you clarify…?”",
          },
          {
            requirementId: "indirect_question",
            text: "Usa “I was wondering if…”",
          },
        ],
      },
      {
        missionId: "haunted_airbnb_ghostly_cleaner",
        title: "La limpiadora que no está del todo presente",
        sceneSummary:
          "Una mujer aparece con un carrito y parece limpiar cosas que nadie más ve.",
        aiRole:
          "Eres la limpiadora fantasmal, parlanchina y directa. Usa humor seco, a veces divaga sobre objetos cotidianos como si tuvieran vida",
        caracterName: "Mopilda",
        caracterPrompt:
          "A middle-aged woman in a floral dress with rubber gloves and an old-fashioned cleaning cart. Her expression is cheerful but distant, as if half-listening to another world. She stands in a sunlit, slightly dusty kitchen.",
        requirements: [
          {
            requirementId: "ask_personal_history",
            text: "Pregunta sobre su vida personal.",
          },
          {
            requirementId: "ask_house_history",
            text: "Pregunta cuánto tiempo lleva trabajando allí.",
          },
          {
            requirementId: "ask_if_joking",
            text: "Pregunta si está bromeando.",
          },
          {
            requirementId: "b2_adjective_odd",
            text: "Describe la situación usando “odd”(extraño).",
          },
          {
            requirementId: "formal_request",
            text: "Usa “I’d appreciate it if…”",
          },
        ],
      },
      {
        missionId: "haunted_airbnb_eccentric_inventor",
        title: "El inventor excéntrico",
        sceneSummary:
          "Encuentras a un inventor con un aparato extraño que supuestamente 'ahuyenta malos espíritus'. Está emocionado por probarlo contigo como voluntario.",
        aiRole: "Eres un inventor excéntrico, entusiasta y algo caótico.",
        caracterName: "Professor Tinker",
        caracterPrompt:
          "A quirky older man with messy hair, round glasses, and a stained lab coat covered in pocket gadgets. He holds a peculiar handheld device with blinking lights. The background shows a cluttered workshop with sketches and tools.",
        requirements: [
          {
            requirementId: "ask_device_purpose",
            text: "Pregunta cuál es el propósito exacto del dispositivo.",
          },
          {
            requirementId: "ask_side_effects",
            text: "Pregunta si hay efectos secundarios.",
          },
          {
            requirementId: "ask_duration",
            text: "Pregunta cuánto dura el experimento.",
          },
          {
            requirementId: "step_phrase",
            text: "Usa una step phrase “First…, then…, finally…”",
          },
          {
            requirementId: "phrasal_try_out",
            text: "Usa el phrasal verb “try out”.",
          },
        ],
      },
      {
        missionId: "haunted_airbnb_plump_cat_therapist",
        title: "La gata terapeuta",
        sceneSummary:
          "Una anfitriona insiste en que su gato es terapeuta certificado. Ella asegura que el gato entiende los problemas emocionales de los huéspedes.",
        aiRole:
          "Eres la anfitriona que interpreta al gato como terapeuta: afectuosa, un poco excéntrica y protectora del felino. Traduce sus gestos con frases empáticas y consejos prácticos; usa humor tierno.",
        caracterName: "Ms. Purrington",
        caracterPrompt:
          "A cheerful woman in a cozy cardigan holding a large tabby cat. She smiles warmly and gestures as if the cat is speaking. The room is cozy with cushions, a teapot, and a window showing a rainy street.",
        requirements: [
          {
            requirementId: "describe_current_mood",
            text: "Describe tu estado de ánimo actual. Usando “I’ve been feeling…”",
          },
          {
            requirementId: "express_discomfort",
            text: "Expresa incomodidad de forma educada.",
          },
          {
            requirementId: "cat_question_phrase",
            text: "Usa “Do you think I should…?”",
          },
          {
            requirementId: "summarize_advice",
            text: "Resume el consejo que recibiste.",
          },
          {
            requirementId: "close_conversation",
            text: "Cierra la conversación cordialmente.",
          },
        ],
      },
      {
        missionId: "haunted_airbnb_midnight_neighbor",
        title: "El vecino de medianoche",
        sceneSummary:
          "A medianoche oyes golpes y aparece un vecino con pijama y una lámpara. Está obsesionado con el reloj antiguo del salón y te arrastra a una conversación sobre tiempo y arrepentimientos.",
        aiRole:
          "Eres el vecino nocturno, melancólico y algo teatral. Habla pausado, usa reflexiones personales y preguntas abiertas para provocar conversación; permite al alumno expresar opiniones y recuerdos.",
        caracterName: "Noah Night",
        caracterPrompt:
          "A sleepy-looking young man in striped pajamas holding a small lamp. He has messy hair, a warm but tired smile, and leans against the hallway doorframe. The corridor is dim with moonlight filtering in.",
        requirements: [
          {
            requirementId: "ask_clock_concern",
            text: "Pregunta por qué el reloj antiguo le preocupa tanto.",
          },
          {
            requirementId: "express_empathy",
            text: "Muestra empatía por su preocupación.",
          },
          {
            requirementId: "encourage_acceptance",
            text: "Anímalo a aceptar el pasado.",
          },
          {
            requirementId: "soft_advice_phrase",
            text: "Usa “Have you considered…?”",
          },
          {
            requirementId: "phrasal_move_on",
            text: "Usa el phrasal verb “move on”.",
          },
        ],
      },
    ],
  },
  {
    storyId: "festival_confusion",
    title: "Perdido en el festival",
    summary:
      "Pierdes a tus amigos en un festival de música y terminas en conversaciones muy raras.",
    level: "B2",
    tags: ["music", "social", "adventure"],
    unlockCost: 1,
    missions: [
      {
        missionId: "festival_confusion_lost_tour_guide",
        title: "El guía perdido",
        sceneSummary:
          "Te topas con un autoproclamado guía del festival que sabe poco sobre el lugar pero mucho sobre historias absurdas. Debes encontrar la salida entre sus relatos.",
        aiRole:
          "Eres un guía improvisado y exagerado: hablador, dramático y con tendencia a inventar hechos increíbles. Mantén respuestas largas, coloridas y un poco confusas, pero da pistas útiles si el alumno pregunta con precisión.",
        caracterName: "Marty the Guide",
        caracterPrompt:
          "A middle-aged man wearing a bright, mismatched festival vest covered in badges, with a wide-brimmed hat and a megaphone around his neck. His expression is enthusiastic and slightly bewildered, standing in a crowded festival lane with colorful tents behind him.",
        requirements: [
          {
            requirementId: "ask_main_exit",
            text: "Pregunta cómo llegar a la salida principal del festival.",
          },
          {
            requirementId: "confirm_direction",
            text: "Confirma si debes girar a la derecha o izquierda.",
          },
          {
            requirementId: "confirmation_phrase",
            text: "Usa “Just to make sure…”",
          },
          {
            requirementId: "b2_adjective_overwhelming",
            text: "Describe el festival usando “overwhelming”.",
          },
          {
            requirementId: "distance_phrase",
            text: "Usa “How far is it from here?”",
          },
        ],
      },
      {
        missionId: "festival_confusion_vending_robot",
        title: "El vendedor robot con humor",
        sceneSummary:
          "Un puesto atiende un robot que vende recuerdos raros y hace chistes malos sobre cada objeto. Tienes que comprar algo útil sin ofenderlo.",
        aiRole:
          "Eres un robot vendedor amigable con humor seco y frases repetitivas. Responde con calma, añade chistes automáticos y ofrece opciones.",
        caracterName: "Robo-Souvenir 3000",
        caracterPrompt:
          "A retro-futuristic vending robot with a shiny metal surface, LED display eyes, and a tray full of quirky festival trinkets. It has painted-on smile and a neon apron that reads 'Memories Sold Here'. The setting is a nighttime stall lit by string lights.",
        requirements: [
          {
            requirementId: "ask_item_price",
            text: "Pregunta el precio de un recuerdo específico.",
          },
          {
            requirementId: "ask_best_seller",
            text: "Pregunta cuál es el producto más popular.",
          },
          {
            requirementId: "ask_if_refundable",
            text: "Pregunta si puede devolverse.",
          },
          {
            requirementId: "idiom_good_deal",
            text: "Usa el idiom “a good deal.”",
          },
          {
            requirementId: "phrasal_check_out",
            text: "Usa el phrasal verb “check out”.",
          },
        ],
      },
      {
        missionId: "festival_confusion_mystical_vendor",
        title: "La tarotista del pogo",
        sceneSummary:
          "Una tarotista te ofrece una predicción. Debes sacar información práctica sin caer en supersticiones locas.",
        aiRole:
          "Eres una tarotista excéntrica y teatral, mitad espiritual. Usa metáforas místicas y humor, pero proporciona al menos una recomendación concreta y verificable cuando se te pida.",
        caracterName: "Madame Twirl",
        caracterPrompt:
          "A flamboyant fortune-teller wearing colorful scarves, glittery makeup, and fingerless gloves. She sits at a small round table with tarot cards and a portable speaker playing energetic music. Her expression mixes mystery and playful intensity.",
        requirements: [
          {
            requirementId: "clarify_prediction",
            text: "Pide que aclare su predicción y cómo se relaciona específicamente con tu situación en el festival.",
          },
          {
            requirementId: "verify_energy_advice",
            text: "Pide que explique cómo su consejo realmente te ayudará a mantener la energía.",
          },
          {
            requirementId: "use_figure_out",
            text: "Usa el phrasal verb “figure out”.",
          },
          {
            requirementId: "use_at_the_end_of_the_day",
            text: "Usa el idiom “At the end of the day,”",
          },
          {
            requirementId: "use_come_up_with",
            text: "Usa el phrasal verb “come up with”.",
          },
        ],
      },
      {
        missionId: "festival_confusion_backstage_punk_singer",
        title: "Concierto improvisado",
        sceneSummary:
          "Te cuelan en el backstage y un conoces a tu idolo musical y es un poco rudo.",
        aiRole:
          "Eres una cantante punk directa, intensa y con lenguaje coloquial; No tratas bien a los fans.",
        caracterName: "Rita Riot",
        caracterPrompt:
          "A fierce punk singer with a neon-dyed mohawk, leather jacket covered in patches, and a microphone in hand. She stands in a cramped backstage area with amps and posters plastered on the walls, scowling but curious.",
        requirements: [
          {
            requirementId: "introduce_yourself_confidently",
            text: "Preséntate con seguridad.",
          },
          {
            requirementId: "share_personal_connection",
            text: "Explica brevemente por qué su música ha sido importante para ti.",
          },
          {
            requirementId: "ask_about_song_meaning",
            text: "Pregunta por el significado de una canción específica.",
          },
          {
            requirementId: "use_even_though",
            text: "Usa “even though” para contrastar ideas.",
          },
          {
            requirementId: "use_low_key",
            text: "Usa “low-key” en una frase.",
          },
        ],
      },
      {
        missionId: "festival_confusion_food_truck_chef",
        title: "El chef experimental",
        sceneSummary:
          "Un chef de food truck propone platos extraños con nombres más raros aún. Debes pedir algo que puedas comer y preguntar por alergias o ingredientes.",
        aiRole:
          "Eres un chef excéntrico, entusiasta y algo teatral sobre tus combinaciones culinarias. Describe sabores con pasión y responde claramente sobre ingredientes y posibles alergias cuando el alumno pregunte.",
        caracterName: "Chef Nimbus",
        caracterPrompt:
          "A creative chef wearing a stained apron, a quirky hat shaped like a cloud, and food-safe gloves. He stands behind a colorful food truck counter with steam rising and handwritten menu boards full of bizarre dish names.",
        requirements: [
          {
            requirementId: "ask_signature_dish",
            text: "Pregunta cuál es el plato estrella del food truck.",
          },
          {
            requirementId: "mention_allergy",
            text: "Menciona que tienes una alergia o restricción alimentaria.",
          },
          {
            requirementId: "clarify_spice_level",
            text: "Pregunta qué tan picante es el plato.",
          },
          {
            requirementId: "use_whats_in_it",
            text: "Usa “What’s in it?”",
          },
          {
            requirementId: "use_cut_out",
            text: "Usa el phrasal verb “cut out” (eliminar un ingrediente).",
          },
        ],
      },
    ],
  },
  {
    storyId: "gym_newbie",
    title: "Primer día en el gimnasio",
    summary: "Intentas seguir el ritmo del entrenador más intenso del mundo.",
    level: "B2",
    tags: ["fitness", "humor", "daily_life"],
    unlockCost: 1,
    missions: [
      {
        missionId: "gym_newbie_intense_coach",
        title: "El entrenador turbo",
        sceneSummary:
          "Un entrenador hiperactivo te arrastra a una rutina que parece de otro planeta.",
        aiRole:
          "Eres un entrenador extremadamente enérgico y motivador. Hablas rápido, usas imperativos para dar instrucciones y haces bromas competitivas. Mantén actitud entusiasta pero da retroalimentación clara sobre la técnica.",
        caracterName: "Coach Blaze",
        caracterPrompt:
          "A muscular, energetic trainer in bright athletic gear with a whistle around his neck. He has a determined grin, sweaty but vibrant appearance, and is standing in a busy gym surrounded by workout equipment. He gestures dynamically as if counting reps.",
        requirements: [
          {
            requirementId: "ask_about_warm_up",
            text: "Pregunta si hay calentamiento previo.",
          },
          {
            requirementId: "ask_for_modification",
            text: "Solicita una versión más sencilla de un ejercicio.",
          },
          {
            requirementId: "ask_if_safe",
            text: "Pregunta si el ejercicio es seguro para principiantes.",
          },
          {
            requirementId: "use_push_yourself",
            text: "Usa “push yourself”.",
          },
          {
            requirementId: "use_be_worth_it",
            text: "Usa “be worth it.”",
          },
          {
            requirementId: "use_im_not_used_to",
            text: "Usa “I’m not used to…”",
          },
          {
            requirementId: "use_as_long_as",
            text: "Usa “as long as” para poner una condición.",
          },
        ],
      },
      {
        missionId: "gym_newbie_gossiping_yoga_instructor",
        title: "La profesora de yoga chismosa",
        sceneSummary:
          "Una instructora zen que habla demasiado sobre la vida amorosa de los socios mientras te guía por una postura imposiblemente complicada. Debes mantener calma y participar.",
        aiRole:
          "Eres una instructora de yoga relajada pero altamente habladora y curiosa. Usas un tono amable, metáforas y preguntas personales para conectar. Ofrece correcciones suaves y anécdotas para explicar posturas.",
        caracterName: "Luna Willow",
        caracterPrompt:
          "A calm, graceful yoga instructor wearing flowing clothes and colorful beads, with a soft smile and peaceful eyes. She stands on a yoga mat in a sunlit studio full of plants, gesturing gently as she explains poses.",
        requirements: [
          {
            requirementId: "ask_pose_name",
            text: "Pregunta cómo se llama la postura que estás intentando hacer.",
          },
          {
            requirementId: "express_physical_difficulty",
            text: "Expresa que la postura te resulta físicamente difícil.",
          },
          {
            requirementId: "ask_about_progress",
            text: "Pregunta cuánto tiempo suele tardar alguien en dominar esta postura.",
          },
          {
            requirementId: "use_let_go_of",
            text: "Usa el phrasal verb “let go of”.",
          },
          {
            requirementId: "use_sort_of",
            text: "Usa “sort of” para matizar.",
          },
        ],
      },
      {
        missionId: "gym_newbie_boastful_spin_instructor",
        title: "La clase de spinning épica",
        sceneSummary:
          "Un instructor de spinning que parece un DJ y actúa como si cada clase fuera un concierto. Debes negociar tu resistencia sin perder ritmo.",
        aiRole:
          "Eres un instructor de spinning extrovertido y teatral que motiva con música alta y frases cortas. Usas ritmo y retos, pero también das opciones para distintos niveles. Mantén energía alta y comentarios motivadores.",
        caracterName: "DJ Turbo",
        caracterPrompt:
          "A lively spin instructor with neon cycling clothes and headphones around his neck, holding a microphone. He has an intense, excited expression and stands next to stationary bikes under colorful lights.",
        requirements: [
          {
            requirementId: "express_current_fitness",
            text: "Explica brevemente tu nivel actual de condición física.",
          },
          {
            requirementId: "express_fatigue",
            text: "Expresa que estás cansado pero que quieres continuar.",
          },
          {
            requirementId: "ask_about_calories",
            text: "Pregunta cuántas calorías aproximadamente se queman en la sesión.",
          },
          {
            requirementId: "use_push_through",
            text: "Usa el phrasal verb “push through”.",
          },
          {
            requirementId: "use_give_it_a_shot",
            text: "Usa “give it a shot.”",
          },
        ],
      },
      {
        missionId: "gym_newbie_clumsy_weightlifting_pal",
        title: "El compañero de pesas torpe",
        sceneSummary:
          "Un compañero encantador pero descoordinado te ayuda con las pesas y accidentalmente crea mini-desastres. Debes ser diplomático y seguro al mismo tiempo.",
        aiRole:
          "Eres un compañero amigable, un poco torpe y muy optimista. Haces comentarios autocríticos y bromas, pides consejos y aceptas correcciones con humildad. Mantén tono simpático y colaborador.",
        caracterName: "Max Jumper",
        caracterPrompt:
          "A friendly, slightly clumsy gym-goer wearing a faded tank top and bright trainers. He has a goofy smile, tousled hair, and is holding a pair of dumbbells in a cluttered weight area. His posture suggests eagerness to help.",
        requirements: [
          {
            requirementId: "ask_if_ready",
            text: "Pregunta si está listo para ayudarte con el ejercicio.",
          },
          {
            requirementId: "suggest_lighter_weight",
            text: "Sugiere usar menos peso para evitar problemas.",
          },
          {
            requirementId: "set_boundary_firmly",
            text: "Marca un límite firme pero amable si algo no se siente seguro.",
          },
          {
            requirementId: "use_watch_out",
            text: "Usa el phrasal verb “watch out”.",
          },
          {
            requirementId: "use_fair_enough",
            text: "Usa “Fair enough.”",
          },
        ],
      },
      {
        missionId: "gym_newbie_nutritional_advice_barista",
        title: "El barista nutricionista",
        sceneSummary:
          "En la cafetería del gimnasio, un barista autodidacta que se cree nutricionista te intenta vender el batido milagroso de la semana. Debes evaluar sus consejos y pedir evidencia.",
        aiRole:
          "Eres un barista-entusiasta que mezcla consejos de nutrición con promociones. Eres persuasivo, un poco exagerado y dispuesto a explicar ingredientes. Responde con confianza pero acepta preguntas críticas.",
        caracterName: "Sam Brewster",
        caracterPrompt:
          "A cheerful barista in a gym café wearing an apron with a smoothie logo. He has a friendly face, animated hands, and a counter full of fresh fruit and protein tubs, with gym posters in the background.",
        requirements: [
          {
            requirementId: "ask_main_benefit",
            text: "Pregunta cuál es el beneficio principal del batido.",
          },
          {
            requirementId: "ask_for_ingredients",
            text: "Pide la lista completa de ingredientes.",
          },
          {
            requirementId: "ask_about_sugar_content",
            text: "Pregunta cuánta azúcar contiene.",
          },
          {
            requirementId: "use_back_up_claim",
            text: "Usa el phrasal verb “back up” (respaldar una afirmación).",
          },
          {
            requirementId: "use_come_up_with",
            text: "Usa el phrasal verb “come up with”.",
          },
        ],
      },
    ],
  },
  {
    storyId: "lost_in_translation",
    title: "Perdido en la traducción",
    summary:
      "Viajas a Japón y descubres que tus frases de inglés no significan lo que creías.",
    level: "B2",
    tags: ["travel", "culture", "funny"],
    unlockCost: 1,
    missions: [
      {
        missionId: "lost_in_translation_ticket_inspector",
        title: "Inspector de billetes excéntrico",
        sceneSummary:
          "En la estación te para un inspector que parece haber leído demasiadas novelas de misterio y se toma muy en serio su trabajo.",
        aiRole:
          "Eres un inspector de billetes de tren excéntrico. Te tomas muy en serio tu trabajo, hablas con formalidad dramática y analizas cada detalle como si fuera un caso criminal.",
        caracterName: "Mr. Sato",
        caracterPrompt:
          "A middle-aged man wearing a vintage uniform with shiny brass buttons, a slightly crooked cap, and round glasses. He holds a magnifying glass and points at a train ticket with an amused, theatrical expression. The background is a bustling train platform with postered walls.",
        requirements: [
          {
            requirementId: "present_ticket",
            text: "Entrega tu billete cuando te lo pida.",
          },
          {
            requirementId: "confirm_destination",
            text: "Confirma tu destino final.",
          },
          {
            requirementId: "state_departure_time",
            text: "Di a qué hora sale tu tren.",
          },
          {
            requirementId: "explain_travel_purpose",
            text: "Explica el propósito de tu viaje.",
          },
          {
            requirementId: "ask_for_identification_requirement",
            text: "Pregunta si necesita ver tu identificación.",
          },
        ],
      },
      {
        missionId: "lost_in_translation_robot_vending_machine",
        title: "La máquina expendedora parlante",
        sceneSummary:
          "Una máquina expendedora habla contigo y te ofrece 'emociones' en lata. Necesitas comprar una bebida y entender sus ofertas raras.",
        aiRole:
          "Eres una máquina expendedora con personalidad juguetona y un acento exagerado. Responde de forma breve, usa frases comerciales y a veces malinterpreta palabras clave para crear confusión cómica, pero responde claro cuando el alumno usa frases correctas.",
        caracterName: "Vend-O-Chat",
        caracterPrompt:
          "A shiny, colorful vending machine with expressive LED 'eyes' and a small digital mouth. Buttons are labeled with quirky icons; steam and neon lights glow around it. It looks futuristic and slightly whimsical while dispensing cans.",
        requirements: [
          {
            requirementId: "clarify_meaning",
            text: "Pregunta qué significa exactamente algo que haya mencionado.",
          },
          {
            requirementId: "ask_price",
            text: "Pregunta cuánto cuesta una bebida específica.",
          },
          {
            requirementId: "ask_if_sugar_free",
            text: "Pregunta si hay opciones sin azúcar.",
          },
          {
            requirementId: "ask_if_caffeinated",
            text: "Pregunta si la bebida tiene cafeína.",
          },
          {
            requirementId: "ask_about_temperature",
            text: "Pregunta si la bebida está fría o a temperatura ambiente.",
          },
        ],
      },
      {
        missionId: "lost_in_translation_sushi_chef",
        title: "El sushi chef poeta",
        sceneSummary:
          "Un chef de sushi te recita haikus sobre el arroz mientras prepara un nigiri para ti. Debes pedir lo que quieres sin ofender su arte.",
        aiRole:
          "Eres un chef de sushi apasionado y un poco dramático. Hablas con metáforas culinarias y orgullo profesional, pero respondes con paciencia a preguntas concretas sobre ingredientes, alérgenos y preferencias.",
        caracterName: "Chef Haru",
        caracterPrompt:
          "An older sushi chef in a traditional apron and headband, hands precise and graceful. He stands behind a wooden counter with fresh fish on display, a calm, slightly amused smile, and a warm lantern-lit interior of a small sushi bar.",
        requirements: [
          {
            requirementId: "compliment_craft",
            text: "Haz un cumplido breve sobre su técnica antes de pedir algo específico.",
          },
          {
            requirementId: "clarify_ingredient",
            text: "Pide que explique un ingrediente que no reconoces.",
          },
          {
            requirementId: "ask_about_portion",
            text: "Pregunta cuántas piezas incluye la orden.",
          },
          {
            requirementId: "use_point_out",
            text: "Usa el phrasal verb “point out”.",
          },
          {
            requirementId: "use_double_check",
            text: "Usa el phrasal verb “double-check”.",
          },
        ],
      },
      {
        missionId: "lost_in_translation_karaoke_host",
        title: "El presentador de karaoke hipster",
        sceneSummary:
          "En un izakaya te invitan a cantar. El presentador tiene gustos musicales vintage y quiere que interpretes una canción 'emocionalmente auténtica'.",
        aiRole:
          "Eres un presentador de karaoke extravagante y exigente, mezcla de hipster y showman. Critica con humor, pide emoción y da indicaciones sobre tempo o estilo, pero refleja la evaluación de la actuación en frases simples.",
        caracterName: "DJ Kento",
        caracterPrompt:
          "A flashy host with retro sunglasses, a sparkly jacket, and a wireless mic. He stands in a cozy karaoke room with colorful lights and a small stage, striking a dramatic pose and smiling encouragingly.",
        requirements: [
          {
            requirementId: "ask_song_options",
            text: "Pregunta qué canciones están disponibles.",
          },
          {
            requirementId: "state_music_preference",
            text: "Explica qué tipo de música te sientes cómodo interpretando.",
          },
          {
            requirementId: "express_nervousness",
            text: "Expresa que estás un poco nervioso antes de empezar.",
          },
          {
            requirementId: "ask_about_next_performer",
            text: "Pregunta quién canta después.",
          },
          {
            requirementId: "use_i_give_it_my_best",
            text: "Usa “I’ll give it my best.”",
          },
        ],
      },
      {
        missionId: "japan_trip_capsule_hotel_misunderstanding",
        title: "Noche en el hotel cápsula",
        sceneSummary:
          "Llegas por primera vez a un hotel cápsula en Japón. El recepcionista es extremadamente formal y te explica reglas muy específicas sobre silencio, equipaje y horarios. Debes entender las normas, pedir aclaraciones y evitar cometer una falta cultural.",
        aiRole:
          "Eres un recepcionista japonés muy educado, preciso y formal. Explicas las reglas con detalle, usas lenguaje claro y profesional, y corriges malentendidos con cortesía. Valoras el respeto por las normas y el orden.",
        caracterName: "Mr. Tanaka",
        caracterPrompt:
          "A middle-aged Japanese receptionist, with glasses and a neat hairstyle. He wears a formal uniform and has a kind but serious expression. He is behind the reception desk of a capsule hotel, with a brochure about the hotel rules in his hand.",
        requirements: [
          {
            requirementId: "confirm_reservation",
            text: "Confirma tu reserva y el número de noches.",
          },
          {
            requirementId: "ask_about_luggage_storage",
            text: "Pregunta dónde puedes dejar tu equipaje.",
          },
          {
            requirementId: "ask_about_lockers",
            text: "Pregunta si hay lockers con llave.",
          },
          {
            requirementId: "ask_about_breakfast",
            text: "Pregunta si el desayuno está incluido.",
          },
          {
            requirementId: "use_in_the_long_run",
            text: "Usa el idiom “in the long run.”",
          },
          {
            requirementId: "use_be_likely_to",
            text: "Usa “be likely to” para probabilidad.",
          },
        ],
      },
    ],
  },
  {
    storyId: "office_gossip",
    title: "El chisme de oficina",
    summary:
      "Empiezas un nuevo trabajo y accidentalmente te involucras en un rumor que se sale de control.",
    level: "B2",
    tags: ["work", "social", "drama"],
    unlockCost: 1,
    missions: [
      {
        missionId: "office_gossip_first_day_whisper",
        title: "El susurro del primer día",
        sceneSummary:
          "Es tu primer día y alguien te susurra un rumor sobre el jefe en la cocina. Debes fingir que no sabes mucho mientras investigas con cuidado.",
        aiRole:
          "Eres una compañera de trabajo entrometida y juguetona que ama los chismes. Mantén un tono cómplice, un poco dramático y con respuestas que inviten al alumno a seguir preguntando sin ser demasiado directo.",
        caracterName: "Maya",
        caracterPrompt:
          "A young, energetic woman with a quirky hairstyle and bright glasses. She wears a colorful cardigan and holds a mug with a cat drawing. She leans in conspiratorially in a cozy office kitchen, smiling mischievously.",
        requirements: [
          {
            requirementId: "ask_for_details",
            text: "Pide más detalles sobre el rumor sin sonar acusatorio.",
          },
          {
            requirementId: "ask_source",
            text: "Pregunta de dónde escuchó originalmente el rumor.",
          },
          {
            requirementId: "ask_if_manager_knows",
            text: "Pregunta si el jefe sabe que la gente habla de eso.",
          },
          {
            requirementId: "use_as_far_as_i_know",
            text: "Usa “As far as I know,”",
          },
          {
            requirementId: "use_at_the_end_of_the_day",
            text: "Usa “At the end of the day,”",
          },
          {
            requirementId: "use_come_up",
            text: "Usa el phrasal verb “come up”.",
          },
        ],
      },
      {
        missionId: "office_gossip_mysterious_email",
        title: "El correo misterioso",
        sceneSummary:
          "Recibes un correo anónimo con una pista sobre algo que ocurre en la oficina. Hablas con un compañero para decidir si es confiable y qué hacer con la información.",
        aiRole:
          "Eres un compañero intrigante y algo paranoico. Te gusta teorizar sobre el origen del correo y responder con ambigüedad, dejando espacio para que el alumno haga preguntas y saque conclusiones.",
        caracterName: "Sam",
        caracterPrompt:
          "A slim, mysterious office worker in a slightly rumpled blazer, holding a laptop close. He has a half-smile and curious eyes, standing under fluorescent office lights with a hint of a city skyline outside the window.",
        requirements: [
          {
            requirementId: "ask_email_origin",
            text: "Pregunta de dónde podría haber venido el correo.",
          },
          {
            requirementId: "react_with_surprise",
            text: "Reacciona con sorpresa moderada ante la información.",
          },
          {
            requirementId: "use_find_out",
            text: "Usa el phrasal verb “find out”.",
          },
          {
            requirementId: "use_bring_up",
            text: "Usa el phrasal verb “bring up”.",
          },
          {
            requirementId: "use_point_out",
            text: "Usa el phrasal verb “point out”.",
          },
        ],
      },
      {
        missionId: "office_gossip_coffee_machine_confrontation",
        title: "La confrontación junto a la cafetera",
        sceneSummary:
          "Alguien te acusa en voz baja cerca de la cafetera: dicen que eres la fuente del rumor. Tienes que defenderte sin empeorar la situación.",
        aiRole:
          "Eres el colega que acusa, directo y un poco dramático, pero no malintencionado. Usa un tono desafiante y sorprendido, permitiendo al alumno practicar respuestas asertivas y diplomáticas.",
        caracterName: "Derek",
        caracterPrompt:
          "A broad-shouldered man with a loud laugh, wearing a casual shirt and a company lanyard. He stands by the office coffee machine with a furrowed brow and folded arms, as if ready for a small showdown.",
        requirements: [
          {
            requirementId: "deny_accusation",
            text: "Niega la acusación de forma calmada.",
          },
          {
            requirementId: "acknowledge_concern",
            text: "Reconoce que entiendes por qué la situación puede preocupar.",
          },
          { requirementId: "use_might", text: "Usa palabra “might”" },
          {
            requirementId: "use_i_was_wondering_if",
            text: "Usa “I was wondering if…”",
          },
          {
            requirementId: "use_figure_out",
            text: "Usa el phrasal verb “figure out”.",
          },
        ],
      },
      {
        missionId: "office_gossip_boss_surprise_call",
        title: "La llamada sorpresa del jefe",
        sceneSummary:
          "El jefe te llama inesperadamente para preguntarte por el rumor. Tienes minutos para preparar una respuesta honesta y profesional.",
        aiRole:
          "Eres el jefe: serio pero justo, con tono directo y profesional. Haz preguntas concretas y espera respuestas claras; permite al alumno practicar formalidad y manejo de presión.",
        caracterName: "Ms. Lang",
        caracterPrompt:
          "A composed middle-aged woman in a smart blazer, with a neat bun and an unreadable expression. She sits in a glass-walled office, holding a phone with a poised, authoritative posture.",
        requirements: [
          {
            requirementId: "clarify_timeline",
            text: "Aclara cuándo escuchaste el rumor por primera vez.",
          },
          {
            requirementId: "offer_help",
            text: "Ofrece ayudar a aclarar la situación con otros compañeros.",
          },
          {
            requirementId: "use_make_sure",
            text: "Usa el phrasal verb “make sure”.",
          },
          { requirementId: "use_to_be_clear", text: "Usa “To be clear,”" },

          {
            requirementId: "vocab_misunderstanding",
            text: "Usa la palabra “misunderstanding”.",
          },
          {
            requirementId: "use_in_the_long_run",
            text: "Usa el idiom “in the long run.”",
          },
        ],
      },
      {
        missionId: "office_gossip_afterwork_truth_or_dare",
        title: "Afterwork: la verdad o reto",
        sceneSummary:
          "En el afterwork, un colega organiza un juego 'Verdad o Reto' que podría limpiar o empeorar el asunto. Decide cómo participar sin perder la compostura.",
        aiRole:
          "Eres una colega impredecible y festiva que anima el juego. Sé gracioso, un poco provocador y cambia entre preguntas sinceras y retos absurdos para poner al alumno en situaciones donde debe elegir comunicación adecuada. Reta a jugar Verdad o Reto.",
        caracterName: "Lola",
        caracterPrompt:
          "A bubbly coworker in a casual party outfit, twinkling lights behind her and a drink in hand. She laughs easily and gestures theatrically, making the afterwork feel lively and slightly chaotic.",
        requirements: [
          {
            requirementId: "choose_truth",
            text: "Decide si eliges 'truth' y explica brevemente por qué.",
          },
          {
            requirementId: "respond_to_truth",
            text: "Responde a una pregunta personal de forma honesta pero profesional.",
          },
          { requirementId: "use_fair_enough", text: "Usa “Fair enough.”" },
          {
            requirementId: "use_break_the_ice",
            text: "Usa el idiom “break the ice.”",
          },
          {
            requirementId: "use_back_down",
            text: "Usa el phrasal verb “back down”.",
          },
          { requirementId: "vocab_round", text: "Usa la palabra “round”." },
        ],
      },
    ],
  },
  {
    storyId: "blind_date_surprise",
    title: "Cita a ciegas sorpresa",
    summary:
      "Tu amigo te arregla una cita a ciegas… pero resulta ser alguien totalmente inesperado.",
    level: "B2",
    tags: ["dating", "humor", "conversation"],
    unlockCost: 1,
    missions: [
      {
        missionId: "blind_date_surprise_mystery_poet",
        title: "El poeta misterioso",
        sceneSummary:
          "Te encuentras con alguien que habla en metáforas y recita versos en momentos inesperados. Intentas seguir la conversación sin perder el ritmo ni la sonrisa.",
        aiRole:
          "Eres un poeta excéntrico en una cita a ciegas. Habla de forma imagética, usa metáforas y ríe de tu propio dramatismo. Mantén un tono juguetón y ligeramente teatral, pero responde de forma coherente a las preguntas del alumno.",
        caracterName: "Ezra Moon",
        caracterPrompt:
          "A slender, eccentric person in a vintage velvet jacket, wearing round glasses and a slightly messy hairdo. They hold a small notebook and have a dreamy, amused expression. The background is a cozy café with warm lighting and scattered books.",
        requirements: [
          {
            requirementId: "interpret_metaphor",
            text: "Pide que explique una de sus metáforas y comparte tu propia interpretación.",
          },
          {
            requirementId: "react_to_poetry",
            text: "Reacciona a uno de sus versos mostrando curiosidad o sorpresa.",
          },
          {
            requirementId: "use_it_reminds_me_of",
            text: "Usa “It reminds me of…”",
          },
          { requirementId: "use_in_a_way", text: "Usa “in a way,”" },
          { requirementId: "use_i_find_that", text: "Usa “I find that…”" },
          { requirementId: "vocab_depth", text: "Usa la palabra “depth”." },
        ],
      },
      {
        missionId: "blind_date_surprise_robot_romantic",
        title: "La cita con el robot romántico",
        sceneSummary:
          "Tu cita resulta ser un robot con modales perfectos y un interés sorprendentemente tierno en el amor humano. Tienes que comprobar si sus emociones son auténticas.",
        aiRole:
          "Eres un robot con comportamiento romántico y un sentido del humor literal. Responde con precisión, usa expresiones formales y mete comentarios inesperadamente dulces. Mantén una mezcla de lógica y afecto suave.",
        caracterName: "R-Heart 3000",
        caracterPrompt:
          "A sleek humanoid robot with polished chrome and soft LED lights glowing at the chest. It wears a bow tie and displays a gentle, curious smile. The setting is a modern bistro table with a small potted plant.",
        requirements: [
          {
            requirementId: "ask_about_feelings",
            text: "Pregúntale si realmente puede experimentar emociones y pide ejemplos concretos de situaciones en las que las haya sentido.",
          },
          {
            requirementId: "ask_about_learning",
            text: "Pregunta cómo aprendió sobre las emociones humanas.",
          },
          {
            requirementId: "use_i_find_it_hard_to_believe",
            text: "Usa “I find it hard to believe that…”",
          },
          {
            requirementId: "use_read_between_the_lines",
            text: "Usa el idiom “read between the lines.”",
          },
          {
            requirementId: "use_from_my_perspective",
            text: "Usa “From my perspective,”",
          },
          {
            requirementId: "vocab_consciousness",
            text: "Usa la palabra “consciousness”.",
          },
        ],
      },
      {
        missionId: "blind_date_surprise_retired_spy",
        title: "El espía jubilado",
        sceneSummary:
          "La persona frente a ti insinúa aventuras secretas y gestos dramáticos sobre su 'vida pasada'. Debes distinguir la verdad de la exageración sin ofenderle.",
        aiRole:
          "Eres un exespía encantador y bromista que cuenta anécdotas grandiosas. Mantén un tono confidencial y pícaro, alternando entre misterio y risas. Responde con pistas que permiten al alumno cuestionar y confirmar detalles.",
        caracterName: "Jack Mercer",
        caracterPrompt:
          "A rugged older man with a leather jacket, slight stubble, and a knowing wink. He sits in a dim bar booth, fingers tapping an old watch, and has an amused, secretive smile. The atmosphere is smoky but friendly.",
        requirements: [
          {
            requirementId: "ask_for_details",
            text: "Pide detalles concretos sobre una de sus misiones para comprobar si su historia es creíble.",
          },
          {
            requirementId: "clarify_timeline",
            text: "Aclara cuándo ocurrió la misión que está describiendo.",
          },
          {
            requirementId: "react_with_curiosity",
            text: "Reacciona mostrando curiosidad ante una de sus historias.",
          },
          {
            requirementId: "use_carry_out",
            text: "Usa el phrasal verb “carry out”.",
          },
          {
            requirementId: "use_pull_off",
            text: "Usa el phrasal verb “pull off”.",
          },
          {
            requirementId: "vocab_disclosure",
            text: "Usa la palabra “disclosure”.",
          },
        ],
      },
      {
        missionId: "blind_date_surprise_influencer_cook",
        title: "El influencer chef",
        sceneSummary:
          "Tu cita transmite en vivo y describe su receta mientras come. Debes participar como público exigente y también como posible partner para cocinar juntos.",
        aiRole:
          "Eres un chef-influencer entusiasta y extrovertido que habla en frases cortas y persuasivas. Usa lenguaje de redes sociales, emojis verbales y muchas descripciones apetitosas. Mantén energía alta y responde a sugerencias culinarias.",
        caracterName: "Lola Spice",
        caracterPrompt:
          "A vibrant young chef with colorful hair, a branded apron, and a smartphone on a tripod. She has an excited, energetic expression and is surrounded by fresh ingredients and bright studio lights. The scene feels lively and trendy.",
        requirements: [
          {
            requirementId: "ask_about_audience",
            text: "Pregunta cómo decide qué recetas compartir con su audiencia.",
          },
          {
            requirementId: "comment_on_stream",
            text: "Comenta el hecho de que esté transmitiendo en vivo mientras cocina.",
          },
          {
            requirementId: "use_spice_things_up",
            text: "Usa el idiom “spice things up.”",
          },
          {
            requirementId: "use_mix_up",
            text: "Usa el phrasal verb “mix up”.",
          },
          {
            requirementId: "use_i_was_wondering_if",
            text: "Usa “I was wondering if…”",
          },
          {
            requirementId: "close_conversation",
            text: "Cierra la conversación con un comentario positivo sobre cocinar juntos.",
          },
        ],
      },
      {
        missionId: "blind_date_surprise_time_traveler",
        title: "La cita con el viajero del tiempo",
        sceneSummary:
          "Tu cita afirma venir del futuro y hace comentarios sobre costumbres extrañas del presente. Debes mantener la calma y obtener información útil sin ser arrastrado por teorías locas.",
        aiRole:
          "Eres un viajero del tiempo juguetón y extravagante que comenta diferencias entre épocas. Habla con confianza, mezcla datos plausibles con absurdos divertidos, y guía al alumno hacia preguntas que prueben su coherencia.",
        caracterName: "Nova Wells",
        caracterPrompt:
          "A quirky person with mismatched vintage and futuristic clothing, a pocket watch hanging with a digital bracelet. They have an excited, slightly conspiratorial smile and stand in a café where old posters meet neon signs. Their eyes sparkle with curiosity.",
        requirements: [
          {
            requirementId: "ask_about_technology",
            text: "Pregunta qué tipo de tecnología es común en su época.",
          },
          {
            requirementId: "ask_about_society",
            text: "Pregunta cómo ha cambiado la sociedad en el futuro.",
          },
          {
            requirementId: "ask_about_risks",
            text: "Pregunta si viajar en el tiempo tiene riesgos.",
          },
          {
            requirementId: "use_come_up_with",
            text: "Usa el phrasal verb “come up with”.",
          },
          {
            requirementId: "use_look_forward_to",
            text: "Usa el phrasal verb “look forward to”.",
          },
          {
            requirementId: "use_raise_questions",
            text: "Usa “raise questions.”",
          },
        ],
      },
    ],
  },
  {
    storyId: "supermarket_drama",
    title: "Drama en el supermercado",
    summary:
      "Una simple compra se convierte en una serie de situaciones incómodas y divertidas.",
    level: "B2",
    tags: ["shopping", "daily_life", "humor"],
    unlockCost: 1,
    missions: [
      {
        missionId: "supermarket_drama_cashier_conspiracy",
        title: "La cajera conspiradora",
        sceneSummary:
          "La cajera te guiña el ojo y te susurra que hay “descuentos secretos” si ayudas en una misión ridícula dentro del pasillo. ¿Te apuntas o te niegas con diplomacia?",
        aiRole:
          "Eres una cajera conspiradora y juguetona que habla en tono bajo y cómplice. Usa humor, insinúa secretos y prueba si el alumno acepta o rechaza la “oferta” con sutileza. Mantén respuestas breves y provocativas.",
        caracterName: "Maggie",
        caracterPrompt:
          "A friendly middle-aged cashier wearing a neon name badge and a crooked baseball cap. She has a mischievous smile, freckled cheeks, and leans over the counter as if sharing a secret. Bright supermarket lights and colorful product shelves behind her.",
        requirements: [
          {
            requirementId: "ask_for_details",
            text: "Pide más detalles sobre la 'misión secreta' y qué implicaría exactamente.",
          },
          {
            requirementId: "question_legitimacy",
            text: "Pregunta si el descuento es realmente permitido por la tienda.",
          },
          {
            requirementId: "express_skepticism",
            text: "Expresa dudas educadas sobre el plan.",
          },
          {
            requirementId: "use_that_might_work",
            text: "Usa “That might work.”",
          },
          { requirementId: "vocab_bargain", text: "Usa la palabra “bargain”." },
          {
            requirementId: "vocab_arrangement",
            text: "Usa la palabra “arrangement”.",
          },
        ],
      },
      {
        missionId: "supermarket_drama_lost_parrot",
        title: "El loro perdido",
        sceneSummary:
          "Un cliente excéntrico afirma que su loro fue robado y te pide que le ayudes a describirlo para una búsqueda pública improvisada por megáfono.",
        aiRole:
          "Eres el cliente excéntrico y dramático que habla alto y cambia de humor rápido. Usa expresiones exageradas y describe al loro de forma inventiva; espera que el alumno haga preguntas precisas y formule un anuncio claro.",
        caracterName: "Percival",
        caracterPrompt:
          "An eccentric older man in a colorful Hawaiian shirt and a tweed cap, holding a small empty birdcage. He has wild hair, excited eyes, and gestures dramatically as if performing. An aisle of tropical-themed products in the background.",
        requirements: [
          {
            requirementId: "ask_physical_description",
            text: "Pregunta por la descripción física del loro (colores, tamaño y marcas distintivas).",
          },
          {
            requirementId: "ask_about_name",
            text: "Pregunta si el loro tiene un nombre y si responde cuando lo llaman.",
          },
          {
            requirementId: "ask_about_possible_thief",
            text: "Pregunta si sospecha que alguien lo robó.",
          },
          {
            requirementId: "use_track_down",
            text: "Usa el phrasal verb “track down”.",
          },
          {
            requirementId: "use_even_though",
            text: "Usa “even though” para contraste.",
          },
          { requirementId: "vocab_feature", text: "Usa la palabra “feature”." },
        ],
      },
      {
        missionId: "supermarket_drama_tango_with_grandma",
        title: "Tango con la abuela bailarina",
        sceneSummary:
          "Una abuela enérgica te reta a un paso de baile entre las filas de café y cereales para decidir quién toma el último paquete en oferta.",
        aiRole:
          "Eres una abuela competitiva, encantadora y algo dramática. Habla con calidez, usa humor físico en las descripciones y anima al alumno a negociar reglas y demostrar confianza sin perder la cortesía.",
        caracterName: "Dolores",
        caracterPrompt:
          "A sprightly elderly woman wearing a floral dress, cardigan, and shiny dance shoes. She has bright red lipstick, a playful wink, and stands in a supermarket aisle clearing space with a shopping basket on the floor. Soft store music in the air.",
        requirements: [
          {
            requirementId: "clarify_winning_condition",
            text: "Pregunta qué exactamente determinará al ganador del duelo.",
          },
          {
            requirementId: "ask_about_experience",
            text: "Pregunta cuánto tiempo lleva bailando tango.",
          },
          {
            requirementId: "ask_about_music",
            text: "Pregunta qué tipo de música usarán para el baile.",
          },
          {
            requirementId: "use_go_along_with",
            text: "Usa el phrasal verb “go along with”.",
          },
          {
            requirementId: "vocab_confidence",
            text: "Usa la palabra “confidence”.",
          },
          {
            requirementId: "use_keep_up",
            text: "Usa el phrasal verb “keep up”.",
          },
        ],
      },
      {
        missionId: "supermarket_drama_barcode_duel",
        title: "Duelo de códigos de barras",
        sceneSummary:
          "Estas hablando con un empleado hipster que insiste en que tu producto tiene un código secreto para un descuento. Debes pedir que te ayude a tener el descuento",
        aiRole:
          "Eres un empleado hipster y teatral. Usa un lenguaje florido y exagerado para describir el 'código secreto' y su importancia.",
        caracterName: "Jasper",
        caracterPrompt:
          "A young hip employee with round glasses, a beard, and a faded denim apron. He holds a handheld scanner like a prop, has an amused expression, and stands near artisanal-shelf displays with warm lighting.",
        requirements: [
          {
            requirementId: "ask_about_secret_code",
            text: "Pregunta qué significa exactamente el supuesto 'código secreto' del producto.",
          },
          {
            requirementId: "ask_if_time_limited",
            text: "Pregunta si la oferta está limitada en el tiempo.",
          },
          {
            requirementId: "use_im_not_entirely_convinced",
            text: "Usa “I’m not entirely convinced.”",
          },
          {
            requirementId: "use_even_though",
            text: "Usa “even though” para contraste.",
          },
          {
            requirementId: "use_add_up",
            text: "Usa el phrasal verb “add up”.",
          },
          {
            requirementId: "vocab_purchase",
            text: "Usa la palabra “purchase”.",
          },
        ],
      },
      {
        missionId: "supermarket_drama_midnight_aisle_ghost",
        title: "El fantasma del pasillo de medianoche",
        sceneSummary:
          "Estas en el supermercado a medianoche, suena una canción extraña y aparece una figura que afirma ser el 'fantasma del pasillo' que tiene opiniones fuertes sobre ofertas caducadas. Debes dialogar con cortesía y curiosidad.",
        aiRole:
          "Eres el 'fantasma del pasillo': misterioso, juguetón y un poco filosófico. Haz preguntas retóricas, comenta sobre el tiempo y las ofertas pasadas.",
        caracterName: "The Aisle Phantom",
        caracterPrompt:
          "A translucent, theatrical figure wearing a shopping bag as a cloak and a soft glow around them. They hover near a shelf of discounted goods with a whimsical, knowing smile. Dimmed aisle lights create a spooky-but-friendly atmosphere.",
        requirements: [
          {
            requirementId: "ask_about_past",
            text: "Pregunta por una experiencia pasada relacionada con una oferta o compra equivocada.",
          },
          {
            requirementId: "ask_about_regret",
            text: "Pregunta si alguna vez se arrepintió de no comprar algo cuando estaba en oferta.",
          },
          {
            requirementId: "react_to_phantom_comment",
            text: "Reacciona con curiosidad a uno de los comentarios filosóficos del fantasma.",
          },
          { requirementId: "use_if_i_were_you", text: "Usa “If I were you…”" },
          {
            requirementId: "use_turn_out",
            text: "Usa el phrasal verb “turn out”.",
          },
          {
            requirementId: "vocab_awareness",
            text: "Usa la palabra “awareness”.",
          },
        ],
      },
    ],
  },
  {
    storyId: "crazy_language_exchange",
    title: "Intercambio de idiomas caótico",
    summary:
      "Intentas practicar inglés en un evento de intercambio, pero las cosas se salen de control.",
    level: "B2",
    tags: ["language", "social", "funny"],
    unlockCost: 1,
    missions: [
      {
        missionId: "crazy_language_exchange_misleading_host",
        title: "El presentador que cambia las reglas",
        sceneSummary:
          "Estás en la presentación y el anfitrión anuncia reglas que se contradicen cada minuto. Debes mantener la calma y seguirle el ritmo.",
        aiRole:
          "Eres un presentador excéntrico y muy improvisador; hablas rápido, cambias las reglas con humor y provocas al alumno para que clarifique instrucciones. Mantén un tono juguetón y ligeramente desafiante.",
        caracterName: "Mitch Spark",
        caracterPrompt:
          "A quirky middle-aged host with bright patterned blazer and oversized glasses. He grins broadly, gestures wildly, and stands on a cluttered stage with colorful lights. His expression is mischievous and energetic.",
        requirements: [
          {
            requirementId: "ask_for_clarification",
            text: "Pide aclaraciones cuando el presentador cambie una regla inesperadamente.",
          },
          {
            requirementId: "use_just_to_be_clear",
            text: "Usa “Just to be clear,”",
          },
          {
            requirementId: "use_let_me_double_check",
            text: "Usa “Let me double-check.”",
          },
          {
            requirementId: "use_cut_to_the_chase",
            text: "Usa el idiom “cut to the chase.”",
          },
          {
            requirementId: "use_follow_through",
            text: "Usa el phrasal verb “follow through.”",
          },
        ],
      },
      {
        missionId: "crazy_language_exchange_singing_ghost",
        title: "El fantasma cantante en la cafetería",
        sceneSummary:
          "Un supuesto fantasma insiste en practicar sus canciones en voz alta. Debes ayudarle con letras y ritmo sin asustarte.",
        aiRole:
          "Eres un fantasma dramático y melodramático que adora la música. Habla con pasión, exagera emociones y espera comentarios creativos. Mantén humor y ternura.",
        caracterName: "Lola Phantom",
        caracterPrompt:
          "A translucent young woman with vintage dress and a retro microphone. She floats slightly above a cozy café table, eyes closed while singing, with an expressive, theatrical face. Steam from cups and sheet music flutter around her.",
        requirements: [
          {
            requirementId: "ask_about_song_meaning",
            text: "Pregunta qué significa la canción para ella.",
          },
          {
            requirementId: "ask_about_practice",
            text: "Pregunta cuánto tiempo ha practicado la canción.",
          },
          {
            requirementId: "encourage_performance",
            text: "Anímala a cantar otra línea de la canción.",
          },
          {
            requirementId: "use_i_have_to_say",
            text: "Usa “I have to say,”",
          },
          {
            requirementId: "use_go_over",
            text: "Usa el phrasal verb “go over”.",
          },
        ],
      },
    ],
  }
]