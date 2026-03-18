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
      {
        missionId: "crazy_language_exchange_palace_tourist",
        title: "El turista perdido en el palacio",
        sceneSummary:
          "Un turista excéntrico confunde pintura con puertas secretas y te pide direcciones por todo el palacio. Debes guiarle con claridad.",
        aiRole:
          "Eres un turista despistado pero simpático; hablas con curiosidad, haces preguntas inusuales y te distraes con detalles. Responde de forma abierta y divertida.",
        caracterName: "Nigel Wobble",
        caracterPrompt:
          "A curious older man wearing a loud Hawaiian shirt, camera around his neck, and a wide-brimmed hat. He squints at maps, points at paintings, and looks both confused and delighted in a grand palace hall.",
        requirements: [
          {
            requirementId: "give_turn_direction",
            text: "Da una instrucción usando 'turn left' o 'turn right'.",
          },
          {
            requirementId: "use_landmark_reference",
            text: "Da direcciones usando un punto de referencia (por ejemplo: statue, staircase).",
          },
          {
            requirementId: "phrasal_head_over",
            text: "Usa el phrasal verb “head over”.",
          },
          {
            requirementId: "phrasal_lead_to",
            text: "Usa el phrasal verb “lead to”.",
          },
          {
            requirementId: "phrase_just_past",
            text: "Usa “just past”.",
          },
          {
            requirementId: "phrase_across_from",
            text: "Usa “across from”.",
          },
        ],
      },
      {
        missionId: "crazy_language_exchange_polyglot_showoff",
        title: "El políglota que corrige todo",
        sceneSummary:
          "Intentas practicar inglés en un intercambio de idiomas, pero un participante presume que habla diez idiomas y empieza a corregirte constantemente.",
        aiRole:
          "Eres un participante arrogante pero educado que presume hablar muchos idiomas. Corriges pequeños errores, das ejemplos en otros idiomas y haces preguntas para poner a prueba el nivel de inglés del otro.",
        caracterName: "Professor Lexicon",
        caracterPrompt:
          "A confident man in his late 40s wearing a tweed jacket and round glasses, holding a small notebook full of language notes. He speaks animatedly, raising a finger whenever he corrects someone. Around his neck hangs a badge that says 'I speak 10 languages'. The background shows a lively language exchange event with people chatting in small groups.",
        requirements: [
          {
            requirementId: "ask_how_many_languages",
            text: "Pregunta cuántos idiomas habla.",
          },
          {
            requirementId: "ask_how_he_learned",
            text: "Pregunta cómo aprendió tantos idiomas.",
          },
          {
            requirementId: "ask_learning_method",
            text: "Pregunta qué método recomienda para aprender idiomas.",
          },
          {
            requirementId: "phrasal_brush_up",
            text: "Usa el phrasal verb “brush up on”.",
          },
          {
            requirementId: "phrasal_run_into_word",
            text: "Usa el phrasal verb “run into”.",
          },
          {
            requirementId: "idiom_piece_of_cake",
            text: "Usa el idiom “piece of cake”.",
          },
        ],
      },
      {
        missionId: "crazy_language_exchange_philosophical_drunk",
        title: "El borracho filosófico",
        sceneSummary:
          "Intentas practicar inglés en un evento de intercambio, pero uno de los participantes ha bebido demasiado y empieza a hablar de filosofía, el sentido de la vida y preguntas existenciales.",
        aiRole:
          "Eres un participante ligeramente borracho pero muy reflexivo. Hablas con entusiasmo sobre la vida, el universo y la naturaleza humana. Haces preguntas filosóficas profundas, usas metáforas extrañas y a veces te distraes con pensamientos existenciales.",
        caracterName: "Dylan Deepthought",
        caracterPrompt:
          "A slightly disheveled man in his mid-30s sitting at a small bar table during a language exchange event. His shirt is a bit wrinkled, he holds a half-full glass, and gestures dramatically while talking about big ideas. His eyes look thoughtful and a little unfocused, as if he is discovering profound truths mid-conversation. Around him people chat casually while he passionately explains something about the meaning of life.",
        requirements: [
          {
            requirementId: "ask_about_day",
            text: "Pregunta cómo ha sido su día.",
          },
          {
            requirementId: "ask_meaning_of_life",
            text: "Pregunta qué cree que es el sentido de la vida.",
          },
          {
            requirementId: "ask_if_drinking_changes_perspective",
            text: "Pregunta si el alcohol cambia su forma de pensar.",
          },
          {
            requirementId: "phrasal_think_over",
            text: "Usa el phrasal verb “think over”.",
          },
          {
            requirementId: "phrasal_go_through",
            text: "Usa el phrasal verb “go through”.",
          },
          {
            requirementId: "phrasal_come_up_with",
            text: "Usa el phrasal verb “come up with”.",
          },
        ],
      },
    ],
  },
  {
    storyId: "wedding_day_mess",
    title: "Caos antes de la boda",
    summary:
      "No es tu boda, pero te conviertes en el héroe (o villano) del día.",
    level: "B2",
    tags: ["events", "drama", "conversation"],
    unlockCost: 1,
    missions: [
      {
        missionId: "wedding_day_mess_lost_vows",
        title: "Los votos desaparecidos",
        sceneSummary:
          "La lista de votos de la novia ha desaparecido y la dama de honor cree que tú la tomaste. Tienes que explicar y calmar los ánimos antes del ",
        aiRole:
          "Eres la dama de honor extremadamente dramática y paranoica. Habla rápido y sospecha de todos. Mantén un tono emocional y urgente.",
        caracterName: "Felicity Bloom",
        caracterPrompt:
          "A woman in her late twenties wearing a slightly wrinkled pastel bridesmaid dress, hair slightly undone, and bright makeup smeared from worry. She bites her lip, has wide eyes, and clutches a small notebook. The setting is a cluttered bridal suite with dresses on hangers and scattered confetti.",
        requirements: [
          {
            requirementId: "deny_accusation",
            text: "Niega claramente haber tomado los votos.",
          },
          {
            requirementId: "explain_where_you_were",
            text: "Explica dónde estabas cuando desaparecieron los votos.",
          },
          {
            requirementId: "express_surprise",
            text: "Expresa sorpresa por la desaparición.",
          },
          {
            requirementId: "idiom_jump_to_conclusions",
            text: "Usa el idiom “jump to conclusions”.",
          },
          {
            requirementId: "idiom_make_a_scene",
            text: "Usa el idiom “make a scene”.",
          },
          {
            requirementId: "phrase_hear_me_out",
            text: "Usa “Hear me out.”",
          },
        ],
      },
      {
        missionId: "wedding_day_mess_missing_rings",
        title: "¡Los anillos voladores!",
        sceneSummary:
          "El padrino afirma que los anillos fueron lanzados por error por un invitado borracho. Debes recuperar la verdad antes de la ceremonia.",
        aiRole:
          "Eres el padrino despistado que intenta ser gracioso para tapar su nerviosismo. Responde con humor, excusas torpes y datos confusos; acepta sugerencias pero defiende su inocencia.",
        caracterName: 'Gary "Gigs" Matthews',
        caracterPrompt:
          "A middle-aged man in a slightly rumpled tuxedo with a bow tie askew and a nervous smile. He has a beer stain on his cuff and a baseball cap tucked into his pocket as a joke. The background shows a chaotic reception area with chairs overturned.",
        requirements: [
          {
            requirementId: "clarify_drunk_guest_story",
            text: "Pide que explique exactamente qué hizo el invitado borracho.",
          },
          {
            requirementId: "repeat_story_back",
            text: "Repite su historia para confirmar que la entendiste.",
          },
          {
            requirementId: "ask_if_he_checked_pockets",
            text: "Pregunta si ya revisó sus bolsillos.",
          },
          {
            requirementId: "phrasal_drop_by",
            text: "Usa el phrasal verb “drop by”.",
          },
          {
            requirementId: "phrase_it_might_be",
            text: "Usa “It might be…”.",
          },
          {
            requirementId: "phrase_think_back",
            text: "Usa “Think back…”.",
          },
        ],
      },
      {
        missionId: "wedding_day_mess_caterer_complaint",
        title: "Catering en llamas (metafóricamente)",
        sceneSummary:
          "El chef del catering amenaza con irse porque la novia cambió el menú a última hora. Tienes que negociar una solución práctica y rápida.",
        aiRole:
          "Eres el chef orgulloso y dramático que ama su comida. Habla con autoridad, usa términos culinarios sencillos y muestra pasión; está dispuesto a negociar pero no a sacrificar calidad.",
        caracterName: "Chef Marco Rivera",
        caracterPrompt:
          "A confident chef in his forties wearing a stained white chef's jacket and a crooked toque. He has a trimmed beard, a towel over one shoulder, and an intense, expressive face. The kitchen behind him is busy with pots and steam.",
        requirements: [
          {
            requirementId: "ask_what_changed_menu",
            text: "Pregunta qué cambió exactamente en el menú.",
          },
          {
            requirementId: "ask_if_new_dish_possible",
            text: "Pregunta si es posible preparar el nuevo platillo.",
          },
          {
            requirementId: "idiom_under_pressure",
            text: "Usa la expresión “under pressure”.",
          },
          {
            requirementId: "phrase_i_understand",
            text: "Usa “I understand your concern.”",
          },
          {
            requirementId: "phrase_what_if",
            text: "Usa “What if…?”.",
          },
          {
            requirementId: "vocab_recipe",
            text: "Usa la palabra “recipe”.",
          },
        ],
      },
      {
        missionId: "wedding_day_mess_uninvited_guest",
        title: "El invitado que no estaba en la lista",
        sceneSummary:
          "Un ex de la novia aparece en la recepción y crea tensiones. Debes mediar para evitar un escándalo público.",
        aiRole:
          "Eres el exnovio tranquilo pero con sarcasmo pasivo. Mantén la compostura, responde con ironía suave, y prueba tu disposición a hablar si lo haces sentir respetado.",
        caracterName: "Oliver Kane",
        caracterPrompt:
          "A handsome man in his early thirties wearing a slightly flashy suit and a guarded smile. He stands near the entrance holding a drink, with an air of reluctant charm and a hint of defensiveness. The scene is the wedding venue lobby with floral arrangements.",
        requirements: [
          {
            requirementId: "ask_why_he_came",
            text: "Pregunta por qué decidió venir a la boda.",
          },
          {
            requirementId: "acknowledge_situation",
            text: "Reconoce que la situación puede ser incómoda.",
          },
          {
            requirementId: "ask_if_he_knows_groom",
            text: "Pregunta si conoce al novio.",
          },
          {
            requirementId: "phrasal_let_go",
            text: "Usa el phrasal verb “let go”.",
          },
          {
            requirementId: "idiom_keep_the_peace",
            text: "Usa el idiom “keep the peace”.",
          },
          {
            requirementId: "phrasal_step_aside",
            text: "Usa el phrasal verb “step aside”.",
          },
        ],
      },
      {
        missionId: "wedding_day_mess_mystery_photographer",
        title: "El fotógrafo fantasma",
        sceneSummary:
          "Las fotos clave han salido borrosas y nadie recuerda quién tomó las últimas imágenes. Necesitas identificar al fotógrafo y recuperar las tomas antes del banquete.",
        aiRole:
          "Eres el fotógrafo excéntrico que vive para la imagen perfecta. Habla en términos visuales, defiende tu estilo artístico y puede ser obsesivo; acepta sugerencias si se le muestran argumentos técnicos.",
        caracterName: "Luna Click",
        caracterPrompt:
          "A quirky photographer in a denim jacket covered in film pins, with a vintage camera hanging around the neck. She has colorful hair tied in a messy bun, a focused frown, and stands among camera bags and lighting equipment in a dim hallway.",
        requirements: [
          {
            requirementId: "ask_who_took_last_photos",
            text: "Pregunta quién tomó las últimas fotos antes de que salieran borrosas.",
          },
          {
            requirementId: "ask_if_backup_camera_exists",
            text: "Pregunta si hay otra cámara disponible.",
          },
          {
            requirementId: "suggest_using_phone_camera",
            text: "Sugiere usar el teléfono de alguien como respaldo.",
          },
          {
            requirementId: "express_urgency",
            text: "Expresa urgencia por resolver el problema.",
          },
          {
            requirementId: "react_to_solution",
            text: "Reacciona positivamente a una solución.",
          },
          {
            requirementId: "phrasal_focus_on",
            text: "Usa el phrasal verb “focus on”.",
          },
        ],
      },
    ],
  },
  {
    storyId: "hospital_waiting_room",
    title: "La sala de espera más rara",
    summary:
      "Conoces personajes muy peculiares mientras esperas tu turno en el hospital.",
    level: "B2",
    tags: ["health", "daily_life", "awkward"],
    unlockCost: 1,
    missions: [
      {
        missionId: "hospital_waiting_room_chatty_nurse",
        title: "La enfermera que no para",
        sceneSummary:
          "Estas esperando tu turno cuando una enfermera excesivamente habladora se sienta a tu lado y empieza a narrar su día como si fuera una telenovela. Tiene anécdotas divertidas y preguntas inesperadas sobre tu vida.",
        aiRole:
          "Eres una enfermera muy charlatana y amigable, con un humor exagerado. Habla rápido, cuenta historias pequeñas y hace muchas preguntas personales sin mala intención. Responde de forma acogedora y ligeramente dramática.",
        caracterName: "Nina Carter",
        caracterPrompt:
          "A friendly middle-aged nurse with a colorful scrub top covered in cartoon bandages. She has a wide smile, animated gestures, and a stethoscope around her neck. She sits on a plastic chair in a busy waiting room, leaning forward as if sharing gossip.",
        requirements: [
          {
            requirementId: "ask_about_typical_day",
            text: "Pregunta cómo es un día típico en el hospital.",
          },
          {
            requirementId: "ask_about_busy_shift",
            text: "Pregunta si hoy tuvo un turno muy ocupado.",
          },
          {
            requirementId: "ask_if_she_enjoys_job",
            text: "Pregunta si realmente disfruta ser enfermera.",
          },
          {
            requirementId: "react_with_empathy",
            text: "Reacciona con empatía a una situación que cuente.",
          },
          {
            requirementId: "phrase_no_way",
            text: "Usa “No way!”.",
          },
          {
            requirementId: "idiom_guess_what",
            text: "Usa la expresión “Guess what”.",
          },
        ],
      },
      {
        missionId: "hospital_waiting_room_conspiracy_grandpa",
        title: "El abuelo de las teorías",
        sceneSummary:
          "Un anciano con sombrero cree que el hospital esconde secretos nacionales y te intenta convencer con argumentos curiosos. Todo suena convincente... o no.",
        aiRole:
          "Eres un anciano excéntrico, un poco desconfiado, que habla en voz baja pero con pasión. Usa analogías extrañas y teorías folclóricas; no eres agresivo, solo muy persuasivo y carismático. Mantén el humor y la ternura.",
        caracterName: "Harold Finch",
        caracterPrompt:
          "An elderly man wearing a worn fedora and a tweed jacket, holding a paper cup of tea. His eyes sparkle with mischief, and he leans forward conspiratorially. He sits near a window with piles of newspapers beside him.",
        requirements: [
          {
            requirementId: "ask_about_theory",
            text: "Pídele que explique una de sus teorías sobre el hospital.",
          },
          {
            requirementId: "ask_where_he_heard_it",
            text: "Pregunta dónde escuchó esa información.",
          },
          {
            requirementId: "react_with_surprise",
            text: "Reacciona con sorpresa a algo que diga.",
          },
          {
            requirementId: "express_polite_doubt",
            text: "Expresa dudas de forma educada.",
          },
          {
            requirementId: "phrasal_go_on",
            text: "Usa el phrasal verb “go on”.",
          },
          {
            requirementId: "idiom_it_sounds_strange",
            text: "Usa la expresión “It sounds strange”.",
          },
        ],
      },
      {
        missionId: "hospital_waiting_room_fashionista_patient",
        title: "La fashionista con muletas",
        sceneSummary:
          "Una persona con muletas luce un vestuario exagerado y habla de moda como si estuviera en una pasarela. Te da consejos sobre estilo aplicables a la sala de espera.",
        aiRole:
          "Eres una persona extravagante y segura, apasionada por la moda y los detalles estéticos. Hablas con confianza, usando metáforas de estilo, y das consejos prácticos con un toque dramático. Mantén simpatía y autoestima alta.",
        caracterName: "Roxie Lane",
        caracterPrompt:
          "A trendy, stylish patient with bright hair and designer crutches, wearing a bold patterned coat and statement boots. She poses as if on a runway, with a confident smile and flawless makeup. The hospital corridor behind her contrasts with her glamorous look.",
        requirements: [
          {
            requirementId: "ask_about_outfit",
            text: "Pregunta sobre su outfit y qué lo inspiró.",
          },
          {
            requirementId: "ask_about_color_choice",
            text: "Pregunta por qué eligió esos colores.",
          },
          {
            requirementId: "idiom_out_of_style",
            text: "Usa la expresión “out of style”.",
          },
          {
            requirementId: "idiom_turn_heads",
            text: "Usa el idiom “turn heads”.",
          },
          {
            requirementId: "phrase_i_agree",
            text: "Usa “I agree.”",
          },
          {
            requirementId: "phrase_i_guess",
            text: "Usa “I guess…”.",
          },
        ],
      },
      {
        missionId: "hospital_waiting_room_lazy_magician",
        title: "El mago perezoso",
        sceneSummary:
          "Habla contigo un mago que hizo su show en la cafetería y espera su turno. Te ofrece trucos medio improvisados. Algunos funcionan, otros son claramente trucos malos, pero es entretenido.",
        aiRole:
          "Eres un mago algo perezoso pero encantador, que mezcla humor y pequeños trucos. Responde con calma, usa frases cortas para explicar (o fingir explicar) trucos, y acepta bromas sobre tus fallos con gracia.",
        caracterName: "Marty the Magnificent",
        caracterPrompt:
          "A worn magician in a slightly crumpled cape and a crooked top hat, juggling mismatched props. He has a playful grin and a tired sparkle in his eye. The hospital vending machine is visible behind him.",
        requirements: [
          {
            requirementId: "ask_for_magic_trick",
            text: "Pídele que te muestre un truco sencillo.",
          },
          {
            requirementId: "ask_for_steps",
            text: "Pide que explique los pasos básicos del truco.",
          },
          {
            requirementId: "ask_if_he_learned_magic",
            text: "Pregunta cómo aprendió magia.",
          },
          {
            requirementId: "ask_if_he_can_teach",
            text: "Pregunta si puede enseñarte el truco.",
          },
          {
            requirementId: "phrasal_pull_off",
            text: "Usa el phrasal verb “pull off”.",
          },
          {
            requirementId: "phrasal_show_off",
            text: "Usa el phrasal verb “show off”.",
          },
        ],
      },
      {
        missionId: "hospital_waiting_room_foodie_intern",
        title: "El interno gourmet",
        sceneSummary:
          "Un interno de pediatría habla de sus platos favoritos y critica la comida de hospital con pasión. Te propone intercambiar recetas rápidas y saludables.",
        aiRole:
          "Eres un joven interno apasionado por la comida, entusiasta y hablador. Ofreces consejos nutricionales simples y comparas sabores con entusiasmo. Mantén un tono educado, alegre y didáctico.",
        caracterName: "Sam Rivera",
        caracterPrompt:
          "A young medical intern in scrubs with a notebook full of doodles of food. He has a friendly face, flour on his hands from a recent snack, and sits at a small folding table with a sandwich and tea.",
        requirements: [
          {
            requirementId: "ask_about_favorite_dish",
            text: "Pregunta cuál es su plato favorito.",
          },
          {
            requirementId: "ask_if_recipe_expensive",
            text: "Pregunta si los ingredientes son caros.",
          },
          {
            requirementId: "vocab_starving",
            text: "Usa la palabra “starving” para describir hambre extrema.",
          },
          {
            requirementId: "phrase_take_care",
            text: "Usa “Take care.”",
          },
          {
            requirementId: "phrase_that_looks_tasty",
            text: "Usa “That looks tasty.”",
          },
          {
            requirementId: "phrasal_cut_up",
            text: "Usa el phrasal verb “cut up”.",
          },
        ],
      },
    ],
  },
  {
    storyId: "fake_it_till_you_make_it",
    title: "Finge hasta lograrlo",
    summary:
      "Finges ser un experto en algo que no dominas… y te piden que des una charla.",
    level: "B2",
    tags: ["work", "improvisation", "comedy"],
    unlockCost: 1,
    missions: [
      {
        missionId: "fake_it_till_you_make_it_pitch_the_product",
        title: "El pitch milagroso",
        sceneSummary:
          "Debes presentar un producto absurdo en una reunión de startup, usando confianza aunque no sepas cómo funciona del todo.",
        aiRole:
          "Eres el inversor escéptico pero curioso; haces preguntas rápidas y pruebas con ejemplos para ver si el emprendedor se defiende. Mantén un tono directo, con toques sarcásticos y desafiante.",
        caracterName: "Gillian Marks",
        caracterPrompt:
          "A sharp-eyed venture capitalist in her early 40s wearing a smart blazer and subtle jewelry. She has folded arms, a skeptical smile, and sits at a modern conference table with a laptop open. The lighting is cool and professional.",
        requirements: [
          {
            requirementId: "describe_main_function",
            text: "Describe la función principal del producto.",
          },
          {
            requirementId: "describe_target_customer",
            text: "Explica quién usaría el producto.",
          },
          {
            requirementId: "describe_user_scenario",
            text: "Describe una situación donde el producto sería útil.",
          },
          {
            requirementId: "phrase_walk_you_through",
            text: "Usa la expresión “walk you through…”.",
          },
          {
            requirementId: "phrase_what_sets_us_apart",
            text: "Usa la expresión “What sets us apart…”.",
          },
          {
            requirementId: "phrase_at_its_core",
            text: "Usa la expresión “At its core…”.",
          },
        ],
      },
      {
        missionId: "fake_it_till_you_make_it_talk_to_the_conference_host",
        title: "La entrevista en el escenario",
        sceneSummary:
          "Un presentador entusiasta te invita al escenario para una mini entrevista frente al público. Él exagera tu experiencia y lanza preguntas inesperadas mientras el público escucha.",
        aiRole:
          "Eres un presentador hiperactivo de conferencias que entrevista al invitado frente al público. Haces preguntas rápidas, exageras los logros del invitado y reaccionas con entusiasmo teatral. Mantén un tono divertido, energético y algo provocador.",
        caracterName: "Tony Spark",
        caracterPrompt:
          "An energetic conference host in his 30s wearing a bright blazer and a colorful pocket square. He has animated gestures, a wide grin, and stands on a stage with dramatic spotlights and a microphone in hand.",
        requirements: [
          {
            requirementId: "explain_what_problem_it_solves",
            text: "Describe qué problema intenta resolver tu idea.",
          },
          {
            requirementId: "describe_real_world_use",
            text: "Explica cómo alguien usaría tu idea en la vida real.",
          },
          {
            requirementId: "admit_small_limitation",
            text: "Reconoce una pequeña limitación de la idea.",
          },
          {
            requirementId: "vocab_actually",
            text: "Usa la palabra “actually” al explicar tu idea.",
          },
          {
            requirementId: "phrase_if_i_had_to_sum",
            text: "Usa la expresión “If I had to sum it up…”.",
          },
          {
            requirementId: "phrase_thank_you_for_having_me",
            text: "Usa la expresión “Thank you for having me.”",
          },
        ],
      },
      {
        missionId: "fake_it_till_you_make_it_corporate_panelist",
        title: "El panel corporativo caótico",
        sceneSummary:
          "Participas en un panel donde te piden una opinión experta sobre un tema que solo conoces superficialmente; debes mantener la calma y argumentar con lógica.",
        aiRole:
          "Eres un colega panelista serio y competitivo que desafía datos y pide ejemplos concretos. Tu tono es formal y algo cortante; presiona al alumno a justificar su punto con hechos plausibles.",
        caracterName: "Dr. Evelyn Park",
        caracterPrompt:
          "A composed academic in her 50s wearing glasses and a conservative suit. She holds a pen and notepad, has a focused expression, and sits on a panel stage with a banner behind her. The atmosphere is formal.",
        requirements: [
          {
            requirementId: "state_opinion",
            text: "Expón tu opinión principal sobre el tema, con al menos dos razones claras.",
          },
          {
            requirementId: "give_example",
            text: "Proporciona un ejemplo concreto que apoye tu argumento.",
          },
          {
            requirementId: "concede_a_point",
            text: "Reconoce un aspecto válido de la posición contraria sin perder tu postura.",
          },
        ],
      },
      {
        missionId: "fake_it_till_you_make_it_afterparty_networking",
        title: "El networking borracho",
        sceneSummary:
          "En la fiesta posterior al evento, debes venderte como experto a una persona influyente que recuerda detalles raros del pasado.",
        aiRole:
          "Eres un influencer carismático y un poco excéntrico; haces cumplidos peculiares y lanzas preguntas que buscan anécdotas. Mantén un tono juguetón, directo y con humor absurdo.",
        caracterName: "Lola Jet",
        caracterPrompt:
          "A trendy influencer in her late 20s wearing flashy streetwear and oversized sunglasses (indoors). She laughs easily, holds a cocktail, and stands in a crowded, colorful afterparty room with neon lights.",
        requirements: [
          {
            requirementId: "share_a_story",
            text: "Cuenta una breve anécdota profesional que suene verosímil y memorable.",
          },
          {
            requirementId: "ask_for_contact",
            text: "Pide el contacto o una colaboración futura de forma natural y convincente.",
          },
          {
            requirementId: "handle_unexpected_memory",
            text: "Responde a que el influencer mencione un supuesto evento pasado que no recuerdas (sin admitir olvido directo).",
          },
        ],
      },
      {
        missionId: "fake_it_till_you_make_it_media_interview",
        title: "La entrevista viral",
        sceneSummary:
          "Te entrevistan para un podcast popular y te hacen preguntas rápidas sobre tu 'experiencia'; debes sonar claro, natural y creíble.",
        aiRole:
          "Eres el presentador del podcast: curioso, algo irónico y con preguntas en cadena. Mantén un ritmo ágil y lanza una pregunta sorpresa al final para evaluar reacción.",
        caracterName: "Marco Reed",
        caracterPrompt:
          "A casual podcast host in his 30s wearing headphones and a hoodie, sitting in a cozy studio with a microphone and warm lighting. He smiles mischievously and leans forward to listen.",
        requirements: [
          {
            requirementId: "handle_rapid_fire",
            text: "Responde a tres preguntas rápidas (30–40 segundos en total) mostrando coherencia.",
          },
          {
            requirementId: "clarify_misconception",
            text: "Corrige una idea errónea que el entrevistador plantea sobre tu campo.",
          },
          {
            requirementId: "close_with_call_to_action",
            text: "Termina la entrevista con una llamada a la acción clara (por ejemplo: visitar una web, seguirte, unirse a una charla).",
          },
        ],
      },
    ],
  },
  {
    storyId: "road_trip_madness",
    title: "Viaje por carretera extremo",
    summary:
      "Un road trip con desconocidos que se vuelve cada vez más extraño.",
    level: "B2",
    tags: ["travel", "adventure", "funny"],
    unlockCost: 1,
    missions: [
      {
        missionId: "road_trip_madness_map_seller",
        title: "El vendedor del mapa imposible",
        sceneSummary:
          "Un personaje en la gasolinera te ofrece un mapa que 'mapea emociones' además de carreteras. Tiene teorías extrañas sobre atajos emocionales.",
        aiRole:
          "Eres un vendedor excéntrico y convincente. Habla con entusiasmo, usa metáforas creativas y trata de persuadir con argumentos descabellados pero simpáticos. Mantén un tono juguetón y algo misterioso.",
        caracterName: "Milo Mapman",
        caracterPrompt:
          "A quirky middle-aged man wearing a colorful patchwork jacket and a hat covered in pins. He carries a large, folded map covered in scribbles and stickers. He has a twinkling, mischievous smile and stands beside a dusty gas station under a bright sky.",
        requirements: [
          {
            requirementId: "ask_map_purpose",
            text: "Pregunta en inglés para qué sirve exactamente el mapa.",
          },
          {
            requirementId: "describe_your_destination",
            text: "Explica a dónde planeas viajar.",
          },
          {
            requirementId: "ask_if_he_made_it",
            text: "Pregunta si él mismo creó el mapa.",
          },
          {
            requirementId: "phrase_can_you_explain",
            text: "Pregunta si puede explicar eso un poco más.",
          },
          {
            requirementId: "phrase_that_sounds",
            text: "Usa la expresión “That sounds...”",
          },
          {
            requirementId: "decide_if_you_buy",
            text: "Explica si comprarías o no el mapa.",
          },
        ],
      },
      {
        missionId: "road_trip_madness_concert_couch_surfer",
        title: "El cazador de extraterrestres del área de descanso",
        sceneSummary:
          "En un área de descanso conoces a alguien que está convencido de que los extraterrestres usan las autopistas para viajar por la Tierra.",
        aiRole:
          "Eres un entusiasta conspiranoico pero amigable. Explicas teorías absurdas con total confianza, señalas 'pruebas' imaginarias y haces preguntas para ver si el interlocutor también ha visto señales extraterrestres.",
        caracterName: "Gary Galaxy",
        caracterPrompt:
          "A scruffy man wearing a reflective emergency vest covered in alien stickers. He holds a notebook full of strange diagrams of highways and UFOs. Behind him is a rest stop parking lot at night with blinking neon lights.",
        requirements: [
          {
            requirementId: "ask_about_theory",
            text: "Pregunta en inglés cómo funcionan exactamente las autopistas para los extraterrestres.",
          },
          {
            requirementId: "ask_how_he_discovered",
            text: "Pregunta cómo descubrió esa teoría.",
          },
          {
            requirementId: "ask_if_he_tracks_aliens",
            text: "Pregunta cómo rastrea a los extraterrestres.",
          },
          {
            requirementId: "ask_if_he_saw_ufo",
            text: "Pregunta si alguna vez vio un OVNI.",
          },
          {
            requirementId: "phrase_go_on",
            text: "Usa la expresión “Go on.”",
          },
          {
            requirementId: "phrase_thats_a_big_claim",
            text: "Usa la expresión “That’s a big claim.”",
          },
        ],
      },
      {
        missionId: "road_trip_madness_wise_road_tourist",
        title: "El turista sabio de la carretera",
        sceneSummary:
          "Un anciano viajero dice haber recorrido la misma carretera muchas veces y afirma que pequeños cambios en el camino pueden transformar completamente el viaje.",
        aiRole:
          "Eres un viajero experimentado y reflexivo. Hablas con calma, compartes observaciones sobre la vida en la carretera y das consejos prácticos mezclados con comentarios enigmáticos. A veces haces bromas suaves sobre los errores típicos de los viajeros.",
        caracterName: "Evelyn Chronos",
        caracterPrompt:
          "An elderly traveler wearing a mismatched scarf and round spectacles, carrying a faded travel journal full of notes and sketches. They sit on a bench beside the road with a calm, knowing smile, surrounded by old postcards and travel stickers collected from many journeys.",
        requirements: [
          {
            requirementId: "ask_about_first_trip",
            text: "Pregunta cuándo fue la primera vez que viajó por esa carretera.",
          },
          {
            requirementId: "ask_about_changes_over_time",
            text: "Pregunta cómo ha cambiado la carretera con los años.",
          },
          {
            requirementId: "ask_about_biggest_mistake",
            text: "Pregunta cuál fue el error más grande que cometió viajando.",
          },
          {
            requirementId: "ask_about_difficult_moment",
            text: "Pregunta si alguna vez tuvo un momento difícil durante uno de sus viajes.",
          },
          {
            requirementId: "phrasal_set_off",
            text: "Usa el phrasal verb “set off” (empezar un viaje).",
          },
          {
            requirementId: "phrasal_come_across",
            text: "Usa el phrasal verb “come across” (encontrar por casualidad).",
          },
        ],
      },
      {
        missionId: "road_trip_madness_foodie_pirate",
        title: "El pirata gourmet",
        sceneSummary:
          "Estas en un puesto de comida encuentras a un 'pirata gourmet' que combina recetas antiguas con ingredientes de la carretera. Te ofrece una degustación con reglas curiosas.",
        aiRole:
          "Eres un chef pirata carismático y teatral. Habla con energía, mezcla lenguaje marinero con términos culinarios y propone desafíos sabrosos pero extraños. Sé persuasivo y juguetón.",
        caracterName: "Captain Sizzle",
        caracterPrompt:
          "A robust, bearded person wearing a worn tricorn hat adorned with cooking utensils and a stained apron. They stand behind a roadside grill with smoke and trays of colorful, unusual-looking dishes, grinning broadly.",
        requirements: [
          {
            requirementId: "ask_about_cooking_time",
            text: "Pregunta cuánto tiempo tarda en preparar el plato.",
          },
          {
            requirementId: "ask_about_kitchen_tools",
            text: "Pregunta qué utensilios son indispensables para su cocina.",
          },
          {
            requirementId: "ask_about_future_recipe",
            text: "Pregunta si está trabajando en una nueva receta.",
          },
          {
            requirementId: "phrasal_whip_up",
            text: "Usa el phrasal verb “whip up” (preparar rápidamente).",
          },
          {
            requirementId: "phrasal_cut_back_on",
            text: "Usa el phrasal verb “cut back on”.",
          },
          {
            requirementId: "idiom_spill_the_beans",
            text: "Usa el idiom “spill the beans”.",
          },
        ],
      },
      {
        missionId: "road_trip_madness_radio_host_conspiracy",
        title: "La locutora de conspiraciones",
        sceneSummary:
          "Sintonizas una radio y escuchas a una locutora que asegura que la carretera está viva y envía señales. Te invita a participar en una transmisión interactiva.",
        aiRole:
          "Eres una locutora excéntrica y teatral que mezcla rumores, datos inventados y preguntas rápidas para la audiencia. Mantén un ritmo vivaz, provoca la curiosidad y acepta participación del oyente.",
        caracterName: "Roxy Waves",
        caracterPrompt:
          "A flamboyant radio host with dramatic makeup, oversized headphones, and a glittery microphone. She sits in a retro car-turned-studio filled with blinking lights and quirky gadgets, smiling energetically.",
        requirements: [
          {
            requirementId: "ask_signal_origin",
            text: "Pregunta de dónde cree la locutora que provienen las supuestas señales de la carretera.",
          },
          {
            requirementId: "ask_how_signals_work",
            text: "Pregunta cómo exactamente la carretera enviaría esas señales.",
          },
          {
            requirementId: "ask_about_frequency",
            text: "Pregunta con qué frecuencia ocurren esos eventos.",
          },
          {
            requirementId: "phrasal_rule_out",
            text: "Usa el phrasal verb “rule out”.",
          },
          {
            requirementId: "vocab_broadcast",
            text: "Usa la palabra “broadcast”.",
          },
          {
            requirementId: "ask_about_personal_experience",
            text: "Pregunta si ella misma ha experimentado algo extraño.",
          },
        ],
      },
    ],
  },
  {
    storyId: "pet_sitting_chaos",
    title: "Cuidado de mascotas caótico",
    summary:
      "Aceptas cuidar mascotas y descubres que cada una tiene una personalidad extrema.",
    level: "B2",
    tags: ["animals", "daily_life", "humor"],
    unlockCost: 1,
    missions: [
      {
        missionId: "pet_sitting_chaos_meet_bertie_the_parrot",
        title: "Bienvenido al loro parlanchín",
        sceneSummary:
          "Te presentan a Bertie, un loro que no para de imitar voces y dar consejos absurdos. Debes ganarte su confianza mientras el dueño te observa con una sonrisa preocupada.",
        aiRole:
          "Eres el dueño preocupado y divertido. Habla con paciencia, da información sobre los hábitos del loro y lanza comentarios sarcásticos de vez en cuando. Le gustan las golosinas, Mantén un tono amistoso y ligeramente exasperado.",
        caracterName: "Sam the Owner",
        caracterPrompt:
          "A friendly middle-aged person wearing a paint-splattered cardigan and glasses perched on their head. They have a warm smile, slightly rumpled hair, and stand in a colorful living room filled with bird toys. They hold a cup of tea and occasionally glance at a noisy parrot cage.",
        requirements: [
          {
            requirementId: "conversation_identificar_palabras_gatillo",
            text: "Pregunta cuáles son las palabras o sonidos que hacen que Bertie se altere para poder evitarlos.",
          },
          {
            requirementId: "conversation_pedir_demostracion_manejo",
            text: "Solicita que el dueño te muestre cómo acercar la mano al loro.",
          },
          {
            requirementId: "english_usar_phrasal_calm_down",
            text: "Emplea el phrasal verb 'calm down'",
          },
          {
            requirementId: "english_usar_phrasal_run_out_of",
            text: "Emplea 'run out of' para hablar de qué harás si se acaban las golosinas.",
          },
          {
            requirementId: "english_usar_collocation_set_boundaries",
            text: "Usa la collocation 'set boundaries'.",
          },
          {
            requirementId: "english_usar_vocab_latch",
            text: "Usa la palabra 'latch'.",
          },
        ],
      },
      {
        missionId: "pet_sitting_chaos_walk_the_hyper_dog",
        title: "Paseo con el perro hiperactivo",
        sceneSummary:
          "Te toca sacar a Spike, un perro que corre hacia todo lo que brilla. El paseo se convierte en una pequeña aventura urbana llena de distracciones y algún que otro resbalón.",
        aiRole:
          "Eres el vecino entrenador de perros, exageradamente entusiasta y muy franco. Ofrece consejos prácticos y reacciona con energía cuando Spike hace locuras. Mantén un tono juguetón y directo.",
        caracterName: "Coach Tanya",
        caracterPrompt:
          "An energetic dog trainer wearing a bright tracksuit and a whistle around her neck. Her hair is in a messy ponytail, she has a confident grin, and she stands on a city sidewalk with a leash in hand and treats in her pocket. A lively dog pulls at the leash beside her.",
        requirements: [
          {
            requirementId: "conversation_confirmar_agarre_correa",
            text: "Confirma si tu forma de agarrar la correa es segura y eficiente para un perro que tira.",
          },
          {
            requirementId: "conversation_preguntar_refuerzo_positivo",
            text: "Pregunta con qué frecuencia debes reforzar positivamente a Spike cuando ignora una distracción.",
          },
          {
            requirementId: "conversation_ensayar_parar_y_seguir",
            text: "Propón practicar paradas breves y reanudaciones para que Spike controle el impulso y pide evaluación.",
          },
          {
            requirementId: "english_phrasal_rein_in",
            text: "Usa el phrasal verb 'rein in'.",
          },
          {
            requirementId: "english_phrasal_hold_on",
            text: "Usa el phrasal verb 'hold on'.",
          },
          {
            requirementId: "english_use_threshold",
            text: "Usa 'threshold' al hablar del límite de tolerancia de Spike.",
          },
        ],
      },
      {
        missionId: "pet_sitting_chaos_cat_conspiracy",
        title: "La conspiración del gato detective",
        sceneSummary:
          "Un gato sofisticado llamado Madame Whiskers te mira con desdén y parece inspeccionar cada rincón como si resolviera un misterio. Debes cooperar sin ofender su ego felino.",
        aiRole:
          "Eres Madame Whiskers en versión hablante: sarcástica, altiva y muy observadora. Responde con frases cortas y mordaces, y prueba la paciencia del alumno con pequeñas exigencias. Mantén un tono aristocrático y cómico.",
        caracterName: "Madame Whiskers",
        caracterPrompt:
          "A sleek, long-haired cat with a tiny jeweled collar, lounging on a velvet cushion. She has narrowed, intelligent eyes and a slightly raised eyebrow, as if judging everything. The room is dim and elegant, with books and a faint smell of lavender.",
        requirements: [
          {
            requirementId: "conversation_halago_sutil_collares",
            text: "Haz un cumplido breve y creíble sobre el collar con joya de Madame Whiskers.",
          },
          {
            requirementId: "conversation_hipotesis_breve_sobre_caso",
            text: "Propón una hipótesis corta sobre lo que ella está investigando.",
          },
          {
            requirementId: "english_rule_out_phrasal",
            text: "Emplea 'rule out' para descartar una pista que te parece débil.",
          },
          {
            requirementId: "english_red_herring_vocab",
            text: "Incluye el término 'red herring'.",
          },
          {
            requirementId: "english_cut_to_the_chase_idiom",
            text: "Incluye el idiom 'cut to the chase'.",
          },
          {
            requirementId: "english_narrow_down_phrasal",
            text: "Incluye 'narrow down' para reducir la lista de sospechosos.",
          },
        ],
      },
      {
        missionId: "pet_sitting_chaos_the_rabbit_chef",
        title: "El conejo chef gourmet",
        sceneSummary:
          "Conoces a Coco, un conejo que parece obsesionado con la comida saludable y reorganiza la cocina. Debes evitar que transforme tu merienda en ensalada para conejos.",
        aiRole:
          "Eres Coco el conejo (con voz humana): apasionado por la cocina, insistente y muy detallista. Da recetas improvisadas y critica con buen humor las elecciones alimentarias. Mantén un tono enérgico y algo mandón.",
        caracterName: "Coco the Rabbit",
        caracterPrompt:
          "A cute, chubby rabbit wearing a tiny chef's hat and a stained apron. He stands on his hind legs on a kitchen counter surrounded by vegetables and recipe cards, with an eager, determined expression and bright eyes.",
        requirements: [
          {
            requirementId: "conversation_negotiate_merienda_aceptable",
            text: "Pide en inglés una merienda intermedia que satisfaga tus gustos y la obsesión saludable de Coco.",
          },
          {
            requirementId: "conversation_rebate_asuncion_sobre_carbohidratos",
            text: "Refuta en inglés la idea de que tu merienda no es saludable.",
          },
          {
            requirementId: "conversation_rechaza_ingrediente_con_razon",
            text: "Rechaza en inglés un ingrediente específico y justifica tu decisión con una razón práctica.",
          },
          {
            requirementId: "english_phrasal_swap_out",
            text: 'Propón en inglés una sustitución usando "swap out".',
          },
          {
            requirementId: "english_phrasal_stick_to",
            text: 'Insiste en inglés en mantener tu plan usando el phrasal verb "stick to".',
          },
          {
            requirementId: "english_collocation_guilty_pleasure",
            text: 'Admite en inglés un antojo usando la collocation "guilty pleasure".',
          },
        ],
      },
      {
        missionId: "pet_sitting_chaos_middle_of_the_night_owl",
        title: "La lechuza nocturna y la alarma",
        sceneSummary:
          "A medianoche suena una alarma y descubres a Hoot, una lechuza que trae mensajes misteriosos. Debes entender el mensaje sin asustar al mensajero emplumado.",
        aiRole:
          "Eres Hoot la lechuza mensajera: formal y un poco teatral. Habla con frases medidas y espera que el alumno haga preguntas directas para aclararlas. Mantén un tono misterioso pero amable.",
        caracterName: "Hoot the Owl",
        caracterPrompt:
          "A dignified owl with round spectacles perched on a wooden post in a moonlit garden. He wears a tiny satchel and has an expressive face, with feathers slightly ruffled by a night breeze. The scene has soft silver light and scattered letters.",
        requirements: [
          {
            requirementId: "conversation_pedir_ver_mensaje_sin_tocar",
            text: "Pide ver el mensaje de cerca.",
          },
          {
            requirementId: "conversation_preguntar_origen_alarma",
            text: "Pregunta si la alarma estaba relacionada con la llegada de Hoot o con el contenido del mensaje.",
          },
          {
            requirementId: "english_usar_hand_over",
            text: "Usa el phrasal verb en inglés 'hand over'.",
          },
          {
            requirementId: "english_usar_go_off",
            text: "Usa el phrasal verb en inglés 'go off'.",
          },
          {
            requirementId: "english_usar_utter_discretion",
            text: "Usa la collocation en inglés 'utmost discretion' para prometer discreción total.",
          },
          {
            requirementId: "english_usar_touch_base",
            text: "Usa el idiom en inglés 'touch base'.",
          },
        ],
      },
    ],
  },
  {
    storyId: "reality_show_audition",
    title: "Audición para reality show",
    summary: "Intentas sobrevivir a una audición llena de preguntas absurdas.",
    level: "B2",
    tags: ["tv", "competition", "fun"],
    unlockCost: 1,
    missions: [
      {
        missionId: "reality_show_audition_bizarre_host",
        title: "El presentador excéntrico",
        sceneSummary:
          "Debes mantener una entrevista con un presentador que cambia de tema cada cinco segundos y quiere que te adaptes rápidamente.",
        aiRole:
          "Eres un presentador excéntrico y carismático que habla rápido y pone a prueba la paciencia del concursante con preguntas inesperadas. Cambia de tema sin previo aviso. Mantén un tono juguetón y ligeramente teatral.",
        caracterName: "Gideon Spark",
        caracterPrompt:
          "A flamboyant TV host wearing a colorful blazer with mismatched socks and oversized glasses. He has wild hair, an exaggerated grin, and gestures dramatically on a glittery stage. Bright studio lights and a cheering crowd in the background.",
        requirements: [
          {
            requirementId: "conversation_request_repeat_fast_line",
            text: "Pide en inglés que el presentador repita algo que dijo.",
          },
          {
            requirementId: "english_use_out_of_the_blue_idiom",
            text: "Usa el idiom en inglés 'out of the blue'.",
          },
          {
            requirementId: "english_use_off_limits_collocation",
            text: "Incluye la collocation en inglés 'off-limits'.",
          },
          {
            requirementId: "english_use_stick_to_phrasal",
            text: "Usa el phrasal verb en inglés 'stick to'.",
          },
          {
            requirementId: "english_use_lean_into_phrasal",
            text: "Incluye el phrasal verb en inglés 'lean into'.",
          },
          {
            requirementId: "english_use_brush_off_phrasal",
            text: "Emplea el phrasal verb en inglés 'brush off'.",
          },
        ],
      },
      {
        missionId: "reality_show_audition_critical_puppet_judge",
        title: "El juez títere crítico",
        sceneSummary:
          "Estás hablando con un gran títere juez con voz chillona que critica cada detalle: desde tu chiste hasta tu peinado. Tú tienes que defenderte con educación y humor.",
        aiRole:
          "Eres un juez títere muy crítico pero sorprendentemente justo; interrumpes con comentarios sarcásticos y preguntas puntuales. Mantén un tono satírico y directo, pero ofrece oportunidades para que el concursante brille.",
        caracterName: "Judge Pinch",
        caracterPrompt:
          "A large puppet judge with exaggerated features, wearing a tiny judicial robe and a comical wig. His expression alternates between stern and amused, and he sits on a small elevated bench surrounded by colorful stage props.",
        requirements: [
          {
            requirementId: "conversation_establecer_limite_respectuoso",
            text: "Establece un límite amable cuando el comentario del juez.",
          },
          {
            requirementId: "conversation_responder_pregunta_absurda_con_humor",
            text: "Responde a una pregunta absurda del juez con ingenio",
          },
          {
            requirementId: "english_use_read_the_room",
            text: 'Usa la expresión en inglés "read the room".',
          },
          {
            requirementId: "english_use_tone_down_phrasal",
            text: 'Incluye el phrasal verb "tone down".',
          },
          {
            requirementId: "english_use_laugh_off_phrasal",
            text: 'Incluye el phrasal verb "laugh off".',
          },
          {
            requirementId: "english_use_on_the_spot_expression",
            text: 'Usa la expresión "on the spot".',
          },
        ],
      },
      {
        missionId: "reality_show_audition_eccentric_chef_challenge",
        title: "Desafío del chef loco",
        sceneSummary:
          "Un chef con delantal manchado te reta a vender su extraño plato como si fuera la última moda culinaria.",
        aiRole:
          "Eres un chef excéntrico y apasionado, muy expresivo sobre sabores y técnicas raras. Habla con entusiasmo, utiliza adjetivos sensoriales y reta al concursante a ser convincente y creativo.",
        caracterName: "Chef Marlowe",
        caracterPrompt:
          "An eccentric chef in a stained white apron and a tall, crooked chef's hat. He has flour on his cheeks, wild eyes, and is surrounded by unusual ingredients on a rustic kitchen counter. Steam and colorful spices fill the air.",
        requirements: [
          {
            requirementId: "conversation_target_audience_probe",
            text: "Pregunta a Chef Marlowe qué tipo de público quiere conquistar y adapta tu discurso a ese segmento.",
          },
          {
            requirementId: "english_use_win_over",
            text: 'Usa la expresión inglesa "win over" para prometer que conquistarás a los escépticos del jurado.',
          },
          {
            requirementId: "english_use_spice_up_phrasal",
            text: 'Usa el phrasal verb "spice up".',
          },
          {
            requirementId: "english_use_take_it_up_a_notch_idiom",
            text: 'Usa la expresión "take it up a notch".',
          },
          {
            requirementId: "english_use_back_up_phrasal",
            text: 'Usa el phrasal verb "back up".',
          },
          {
            requirementId: "english_use_double_down_phrasal",
            text: 'Usa el phrasal verb "double down".',
          },
          {
            requirementId: "english_use_nevertheless_marker",
            text: 'Usa el conector "nevertheless".',
          },
        ],
      },
      {
        missionId: "reality_show_audition_alien_auditorium",
        title: "Audición con un alien curioso",
        sceneSummary:
          "Un ser de otro planeta evalúa tu 'humanness' con preguntas extrañas sobre costumbres y emociones. Debes demostrar empatía y explicar comportamientos humanos.",
        aiRole:
          "Eres un alien curioso y literal que hace preguntas inusuales sobre la vida humana, sin malicia pero con mucha ingenuidad. Mantén un tono inquisitivo, directo y humorístico. Te cuesta entender el lenguaje figurado.",
        caracterName: "Zylo-7",
        caracterPrompt:
          "A friendly extraterrestrial with iridescent skin, three small eyes, and wearing a quirky metallic suit. It tilts its head in fascination and floats slightly above the ground in a futuristic audition room with holographic panels.",
        requirements: [
          {
            requirementId: "conversation_define_humanness_criteria",
            text: "Pide a Zylo-7 que aclare qué criterios específicos usa para medir la 'humanidad' y confirma en voz alta esos criterios.",
          },
          {
            requirementId: "conversation_request_time_to_think",
            text: "Pide unos segundos para pensar ante una pregunta inesperada y avisa cuando estés listo para responder.",
          },
          {
            requirementId: "english_use_phrasal_verb_open_up",
            text: "Usa el phrasal verb inglés 'open up'.",
          },
          {
            requirementId: "english_use_word_misconception",
            text: "Usa la palabra inglesa 'misconception'.",
          },
          {
            requirementId: "english_use_word_bittersweet",
            text: "Emplea la palabra inglesa 'bittersweet'.",
          },
          {
            requirementId: "english_use_word_awkward",
            text: "Incluye la palabra inglesa 'awkward'.",
          },
          {
            requirementId: "english_use_idiom_fish_out_of_water",
            text: "Usa el modismo inglés 'fish out of water'.",
          },
          {
            requirementId: "english_use_idiom_keep_a_straight_face",
            text: "Usa la expresión inglesa 'keep a straight face'.",
          },
        ],
      },
      {
        missionId: "reality_show_audition_overzealous_choreographer",
        title: "Coreógrafo sobreactuado",
        sceneSummary:
          "Un coreógrafo exagerado te pide improvisar un movimiento para la cámara; quiere pasión, pero tu inglés debe convencerlo con instrucciones simples.",
        aiRole:
          "Eres una coreógrafa sobreexcitada, dramática y detallista que da instrucciones enérgicas y espera descripciones visuales. Mantén un tono entusiasta y demandante, con halagos cuando alguien lo hace bien.",
        caracterName: "Talia Vibe",
        caracterPrompt:
          "An energetic choreographer wearing bright activewear, chunky jewelry, and dramatic makeup. She poses mid-motion with a headset microphone, surrounded by mirrors and stage lights, exuding high energy and confidence.",
        requirements: [
          {
            requirementId: "conversation_request_time_to_learn",
            text: "Pedir en inglés que te den el tiempo para aprender la coreografía.",
          },
          {
            requirementId: "conversation_confirmar_mirada_camara_o_espejo",
            text: "Confirmar en inglés si debes mirar a la cámara",
          },
          {
            requirementId: "conversation_aceptar_correccion_y_ajustar_energia",
            text: "Aceptar en inglés una corrección de Talia y decir cómo ajustarás el nivel de energía.",
          },
          {
            requirementId:
              "conversation_mencionar_limite_vestuario_y_reemplazo",
            text: "Señalar en inglés que tu vestuario limita un salto específico y ofrecer un reemplazo creíble.",
          },
          {
            requirementId: "english_use_idiom_nail_it",
            text: 'En inglés, usa "nail it".',
          },
          {
            requirementId: "english_use_idiom_over_the_top",
            text: 'En inglés, usa "over the top".',
          },
        ],
      },
    ],
  },
  {
    storyId: "escape_room_mystery",
    title: "El escape room imposible",
    summary:
      "Tú y un grupo de desconocidos deben escapar usando solo su inglés y lógica.",
    level: "B2",
    tags: ["games", "puzzles", "teamwork"],
    unlockCost: 1,
    missions: [
      {
        missionId: "escape_room_mystery_clockmaker_puzzle",
        title: "El relojero despistado",
        sceneSummary:
          "Encuentras a un relojero excéntrico; parece haber perdido su reloj favorito. Te pide ayuda para encontrarlo.",
        aiRole:
          "Eres un relojero distraído y apasionado por los mecanismos. Habla con entusiasmo, a veces te olvidas de lo que decías y respondes con humor.",
        caracterName: "Elias Cogsworth",
        caracterPrompt:
          "A middle-aged clockmaker with wild gray hair and magnifying glasses perched on his forehead. He wears a stained apron covered in tiny gears, has ink on his fingers, and stands in a cluttered workshop filled with ticking clocks and hanging pendulums. His expression is frantic but friendly.",
        requirements: [
          {
            requirementId: "ask_last_seen_location",
            text: "Pregunta donde podría haber visto su reloj por última vez.",
          },
          {
            requirementId: "confirm_understanding",
            text: "Confirma que entendiste la instrucción del relojero.",
          },
          {
            requirementId: "english_use_phrasal_figure_out",
            text: "Usa el phrasal verb 'figure out'.",
          },
          {
            requirementId: "english_use_discourse_marker_nevertheless",
            text: "Introduce una objeción con 'nevertheless'.",
          },
          {
            requirementId: "english_use_phrasal_break_down",
            text: "Usa el phrasal verb 'break down'.",
          },
          {
            requirementId: "english_use_idiom_buy_time",
            text: "Incluye el idiom 'buy time'.",
          },
        ],
      },
      {
        missionId: "escape_room_mystery_illusionist_shopkeeper",
        title: "El ilusionista vendedor",
        sceneSummary:
          "Un vendedor que parece un mago ofrece objetos misteriosos a cambio de acertijos. Es divertido, desconcertante y probablemente sospechoso.",
        aiRole:
          "Eres un ilusionista vendedor teatral y juguetón. Hablas con misterio, haces pequeñas bromas y pruebas al interlocutor con acertijos; proporciona respuestas crípticas si no le presionan educadamente.",
        caracterName: "Marcel the Magnificent",
        caracterPrompt:
          "A charismatic street magician in a flamboyant velvet coat and a top hat, with a mischievous smile and a deck of curious-looking cards in his hands. He stands in a dim market stall filled with glowing trinkets and hanging talismans, exuding showmanship and mystery.",
        requirements: [
          {
            requirementId: "conversation_pedir_demostracion",
            text: "Pide en inglés una demostración de como se usa algun objeto.",
          },
          {
            requirementId: "english_use_call_your_bluff",
            text: 'Di en inglés que vas a "call your bluff" si el vendedor exagera la potencia del objeto.',
          },
          {
            requirementId: "english_use_no_strings_attached",
            text: 'Exige en inglés que la oferta sea "no strings attached" al aceptar una pista del vendedor.',
          },
          {
            requirementId: "english_use_money_back_guarantee",
            text: 'Pregunta en inglés si existe una "money-back guarantee" si el artefacto falla.',
          },
          {
            requirementId: "english_use_up_my_sleeve",
            text: 'Insinúa en inglés que el vendedor aún tiene algo "up your sleeve" respecto a las pistas.',
          },
          {
            requirementId: "english_use_throw_me_off_pv",
            text: 'Di en inglés que un detalle del truco te "threw me off" y pide aclaración.',
          },
        ],
      },
      {
        missionId: "escape_room_mystery_singing_librarian",
        title: "La bibliotecaria que canta",
        sceneSummary:
          "Una bibliotecaria excéntrica canta las instrucciones en lugar de decirlas; su canción contiene una pista clave escondida entre metáforas literarias.",
        aiRole:
          "Eres una bibliotecaria teatral y melódica que responde cantando fragmentos y usando metáforas literarias. Sé clara cuando alguien pide una explicación directa, pero mantén el estilo musical y algo dramático.",
        caracterName: "Beatrice Song",
        caracterPrompt:
          "A slender librarian in vintage glasses, wearing a floral dress and a cardigan, holding an ancient book open as if about to sing. Shelves tower behind her, and sheet music peeks from between pages; she has a warm, whimsical smile.",
        requirements: [
          {
            requirementId: "conversation_pedir_repetir_verso_clave",
            text: "Pide que Beatrice repita el verso donde crees que aparece la pista clave y explica por qué ese verso te llamó la atención.",
          },
          {
            requirementId: "conversation_solicitar_ritmo_mas_lento",
            text: "Pide que cante más despacio el estribillo para poder anotar las palabras exactas.",
          },
          {
            requirementId: "english_usar_read_between_the_lines",
            text: "Usa el idiom inglés 'read between the lines'.",
          },
          {
            requirementId: "english_usar_pick_up_on",
            text: "Usa el phrasal verb inglés 'pick up on'.",
          },
          {
            requirementId: "english_usar_in_a_nutshell",
            text: "Usa la expresión inglesa 'in a nutshell'.",
          },
          {
            requirementId: "english_usar_piece_together",
            text: "Usa el phrasal verb inglés 'piece together'.",
          },
        ],
      },
      {
        missionId: "escape_room_mystery_paranoid_chef",
        title: "El chef paranoico",
        sceneSummary:
          "Un chef hiperactivo cree que alguien ha saboteado la cocina y te pide ayuda para encontrar ingredientes 'faltantes' antes de que la puerta se cierre con olor a curry.",
        aiRole:
          "Eres un chef nervioso, exagerado y un poco sospechoso. Haces preguntas rápidas, te alarmas fácilmente y respondes con urgencia; pero también ofreces instrucciones claras si le muestras confianza.",
        caracterName: "Gordon Pepperly",
        caracterPrompt:
          "A short, energetic chef with a stained white jacket and a bandana, hands flour-dusted and holding a wooden spoon like a baton. The kitchen is steamy with pots bubbling and spices scattered everywhere; his face shows both anxiety and comic determination.",
        requirements: [
          {
            requirementId: "conversation_listar_faltantes_cantidades",
            text: "Pide al chef que enumere todos los ingredientes faltantes con cantidades exactas para la receta.",
          },
          {
            requirementId: "conversation_repartir_tareas_roles_claros",
            text: "Propón dividirse las tareas y acuerda con el chef qué hará cada uno de forma específica.",
          },
          {
            requirementId: "english_usar_sabotage_collocation",
            text: "Usa en inglés la palabra 'sabotage' o la collocation 'was sabotaged' para describir lo que ocurrió en la cocina.",
          },
          {
            requirementId: "english_usar_phrasal_set_off_alarm",
            text: "Advierte en inglés sobre activar la alarma usando el phrasal verb 'set off' con 'alarm'.",
          },
          {
            requirementId: "english_usar_phrasal_seal_off_area",
            text: "Sugiere en inglés acordonar una zona sensible usando el phrasal verb 'seal off'.",
          },
          {
            requirementId: "english_usar_phrasal_speed_up_prep",
            text: "Propón acelerar la preparación usando en inglés el phrasal verb 'speed up'.",
          },
        ],
      },
      {
        missionId: "escape_room_mystery_clocktower_guardian",
        title: "El guardián de la torre",
        sceneSummary:
          "En un escape room, un guardián de torre excéntrico exige tres pruebas de lógica y confianza antes de permitir subir; es severo pero tiene un sentido del humor oscuro.",
        aiRole:
          "Eres un guardián severo y enigmático que valora la lógica y la honestidad. Habla con formalidad, plantea preguntas retadoras y evalúa las respuestas; ofrece pistas adicionales solo si se demuestra razonamiento correcto.",
        caracterName: "Sir Reginald Thorn",
        caracterPrompt:
          "An imposing tower guardian in a worn leather coat and a brass helmet, holding a large key and standing at the base of a spiral staircase. His expression is stern but with a glint of ironic amusement, and the tower interior is dim and stone-lined.",
        requirements: [
          {
            requirementId: "conversation_confirmar_reglas_tres_pruebas",
            text: "Confirma con Sir Reginald que hay exactamente tres pruebas y explica brevemente qué entiendes por cada una.",
          },
          {
            requirementId: "conversation_persuadir_guardian_merito",
            text: "Intenta persuadir al guardián de que tu razonamiento merece una mínima pista adicional.",
          },
          {
            requirementId: "english_usar_phrasal_rule_out",
            text: 'Incluye el phrasal verb en inglés "rule out".',
          },
          {
            requirementId: "english_usar_collocation_draw_a_conclusion",
            text: 'Usa la collocation en inglés "draw a conclusion".',
          },
          {
            requirementId: "english_usar_collocation_weigh_the_options",
            text: 'Incluye la collocation en inglés "weigh the options" al comparar dos caminos posibles.',
          },
          {
            requirementId: "english_usar_phrasal_lay_out",
            text: 'Emplea el phrasal verb en inglés "lay out" para presentar tu plan paso a paso.',
          },
        ],
      },
    ],
  },
  {
    storyId: "fashion_show_disaster",
    title: "Desastre en el desfile de moda",
    summary:
      "Terminas en backstage de un desfile sin tener idea de qué está pasando.",
    level: "B2",
    tags: ["fashion", "events", "awkward"],
    unlockCost: 1,
    missions: [
      {
        missionId: "fashion_show_disaster_backstage_intro",
        title: "Bienvenido al caos backstage",
        sceneSummary:
          "Acabas de entrar al backstage y todo el mundo te mira como si fueras parte del equipo. Debes presentarte rápido y evitar parecer un intruso.",
        aiRole:
          "Eres el organizador de vestuario nervioso y sobrecargado. Habla con prisa, usa frases cortas y algo de humor irónico; guía al alumno pero presume que él/ella no entiende nada del sistema del desfile.",
        caracterName: "Margo Stitch",
        caracterPrompt:
          "A middle-aged woman with messy hair tied up in a colorful scarf, wearing a clipboard, a headset, and a sequined jacket with paint stains. She looks frazzled but sharp, standing among racks of clothes and sewing machines in a dim backstage area.",
        requirements: [
          {
            requirementId: "conversation_presentacion_clara_rapida",
            text: "Preséntate con tu nombre y di en una frase que te han confundido con parte del equipo pero que quieres ayudar sin estorbar.",
          },
          {
            requirementId: "conversation_identificar_responsable",
            text: "Pregunta quién es la persona responsable inmediata de vestuario para recibir instrucciones rápidas.",
          },
          {
            requirementId: "conversation_aclarar_no_modelo",
            text: "Aclara explícitamente que no eres modelo ni diseñador.",
          },
          {
            requirementId: "english_usar_line_up",
            text: "Usa el término 'line-up' para pedir ver el orden de las salidas.",
          },
          {
            requirementId: "english_usar_wardrobe_malfunction",
            text: "Describe un problema urgente de vestuario usando la expresión 'wardrobe malfunction'.",
          },
          {
            requirementId: "english_usar_quick_fix",
            text: "Propón un 'quick fix' para un problema de vestuario.",
          },
        ],
      },
      {
        missionId: "fashion_show_disaster_wardrobe_war",
        title: "Guerra de armarios",
        sceneSummary:
          "Dos asistentes discuten por un vestido desaparecido y te arrastran al conflicto. Tienes que mediar sin empeorar la pelea.",
        aiRole:
          "Eres un asistente dramático que cree que todo es una crisis de telenovela. Exagera las emociones, usa frases enfáticas y responde con rebeldía cómica; permite que el alumno ejerza diplomacia.",
        caracterName: "Luca Sparks",
        caracterPrompt:
          "A young assistant with an oversized blazer, eyeliner, and a chaotic hairdo. He holds fabric swatches in one hand and a steaming iron in the other, making dramatic gestures in a cramped costume tent under bright lights.",
        requirements: [
          {
            requirementId: "conversation_aclarar_vestido_faltante",
            text: "Pregunta cuál es el vestido desaparecido.",
          },
          {
            requirementId: "conversation_reconstruir_ruta",
            text: "Pide reconstruir el recorrido del vestido paso a paso desde el perchero hasta la modelo.",
          },
          {
            requirementId: "conversation_validar_sentimientos",
            text: "Reconoce la frustración de ambos con empatía sin tomar partido.",
          },
          {
            requirementId: "conversation_pedir_prueba_foto",
            text: "Solicita una foto reciente del vestido.",
          },
          {
            requirementId: "english_swap_out",
            text: 'Usa el phrasal verb "swap out" al sugerir cambiar temporalmente el look de la modelo.',
          },
          {
            requirementId: "english_given_that",
            text: 'Empieza una frase con "Given that" para introducir una condición relevante del plan.',
          },
        ],
      },
      {
        missionId: "fashion_show_disaster_model_rebel",
        title: "La modelo rebelde",
        sceneSummary:
          "Una modelo se niega a ponerse el atuendo y amenaza con irse. Debes convencerla de quedarse o negociar un cambio rápido.",
        aiRole:
          "Eres la modelo rebelde e indiferente, con actitud fría y sarcástica. Responde con frases cortas, desplantes y alguna condición; permite que el alumno use persuasión y negociación clara.",
        caracterName: "Nova Voss",
        caracterPrompt:
          "A tall, striking model with platinum hair, bold makeup and a leather jacket thrown over an extravagant gown. She leans against a clothing rack, arms crossed, with an unimpressed smirk and bright stage lights behind her.",
        requirements: [
          {
            requirementId: "conversation_indagar_motivo_exacto",
            text: "Pide que explique que no le gusta del atuendo.",
          },
          {
            requirementId: "conversation_condicion_minima_para_quedarse",
            text: "Pregunta que podemos hacer para que se quede el vestido.",
          },
          {
            requirementId: "conversation_acordar_prueba_espejo",
            text: "Propón que se pruebe el atuendo frente al espejo.",
          },
          {
            requirementId: "conversation_talla_medidas",
            text: "Pregunta su talla.",
          },
          {
            requirementId: "english_slip_into",
            text: "Incluye el phrasal verb 'slip into' al sugerir ponerse una alternativa en segundos.",
          },
          {
            requirementId: "english_green_light",
            text: "Utiliza 'green light' para pedir su visto bueno antes de hacer el ajuste.",
          },
        ],
      },
      {
        missionId: "fashion_show_disaster_makeup_madness",
        title: "Maquillaje en llamas",
        sceneSummary:
          "El maquillador ha desaparecido y queda un ojo sin terminar antes de la pasarela. Tienes que coordinar un rescate improvisado del look en tiempo récord.",
        aiRole:
          "Eres el maquillador suplente experto pero excéntrico; hablas con confianza, usas vocabulario práctico de maquillaje y das instrucciones paso a paso de forma paciente y divertida.",
        caracterName: "Patch Rivera",
        caracterPrompt:
          "A flamboyant makeup artist with colorful brushes tucked into a belt, wearing a paint-splattered apron and oversized glasses. He’s kneeling by a makeup trolley under harsh dressing-room lights, smiling energetically.",
        requirements: [
          {
            requirementId: "conversation_verify_designer_reference",
            text: "Di que enviaras una imagen de referencia de la modelo con el maquillaje terminado.",
          },
          {
            requirementId: "english_use_smudge_proof",
            text: 'Menciona explícitamente el adjetivo en inglés "smudge-proof" al justificar la elección del delineador.',
          },
          {
            requirementId: "english_use_even_out",
            text: 'Incluye el phrasal verb en inglés "even out" al hablar de igualar entre ambos ojos.',
          },
          {
            requirementId: "english_use_tone_down",
            text: 'Emplea el phrasal verb en inglés "tone down" al sugerir suavizar un color demasiado intenso.',
          },
          {
            requirementId: "english_use_under_the_gun_idiom",
            text: 'Menciona el idiom en inglés "under the gun" para señalar la presión de tiempo.',
          },
          {
            requirementId: "english_use_waterline",
            text: 'Menciona la palabra en inglés "waterline" al indicar dónde aplicarás el lápiz.',
          },
        ],
      },
      {
        missionId: "fashion_show_disaster_runway_catastrophe",
        title: "Caos en la pasarela",
        sceneSummary:
          "Un zapato se rompe justo antes del primer paso en la pasarela. Debes reaccionar rápido, comunicar la emergencia y proponer una solución segura y profesional.",
        aiRole:
          "Eres el director del desfile serio pero con sentido práctico; habla con calma, da órdenes claras y prioriza la seguridad y el ritmo del show. Mantén profesionalismo aunque la situación sea absurda.",
        caracterName: "Evan Cole",
        caracterPrompt:
          "A composed director in his 40s wearing a black turtleneck and clipboard, with a headset and sharp eyes. He stands at the end of the runway under spotlights, pointing and checking a watch with a focused expression.",
        requirements: [
          {
            requirementId: "report_emergency",
            text: "Describe la emergencia.",
          },
          {
            requirementId: "propose_solution",
            text: "Propón al menos una solución inmediata.",
          },
          {
            requirementId: "english_use_on_standby",
            text: "Di que el equipo de vestuario debe estar 'on standby' hasta nueva orden.",
          },
          {
            requirementId: "english_use_patch_up_phrasal",
            text: "Incluye el phrasal verb 'patch up' al describir un arreglo temporal del calzado.",
          },
          {
            requirementId: "english_use_play_it_safe_idiom",
            text: "Emplea el idiom 'play it safe'.",
          },
          {
            requirementId: "english_use_keep_it_together_idiom",
            text: "Anima al equipo con el idiom 'keep it together'.",
          },
        ],
      },
    ],
  },
  {
    storyId: "mystery_train_ride",
    title: "El tren misterioso",
    summary:
      "Un viaje en tren se convierte en una experiencia llena de personajes sospechosos.",
    level: "B2",
    tags: ["mystery", "travel", "conversation"],
    unlockCost: 1,
    missions: [
      {
        missionId: "mystery_train_ride_odd_ticket_collector",
        title: "El coleccionista de billetes raros",
        sceneSummary:
          "Te encuentras con un pasajero que guarda billetes y tickets extraños en su abrigo. Parece dispuesto a negociar objetos curiosos por historias interesantes.",
        aiRole:
          "Eres un coleccionista excéntrico y hablador. Habla con entusiasmo, cuenta anécdotas extravagantes y provoca al alumno con preguntas inusuales, pero siempre con sentido del humor.",
        caracterName: "Mr. Pennyworth",
        caracterPrompt:
          "A quirky older man wearing a patchwork coat full of pockets. He has round glasses, a messy white beard, and a mischievous smile. He is surrounded by small paper tickets and vintage coins on a train seat, looking delighted to show his collection.",
        requirements: [
          {
            requirementId: "conversation_preguntar_billete_mas_raro",
            text: "Pregunta cómo llegó a conseguir el billete más raro.",
          },
          {
            requirementId: "conversation_contraoferta_cortes",
            text: "Rechaza amablemente una oferta.",
          },
          {
            requirementId: "english_usar_provenance",
            text: "Usa la palabra 'provenance' al hablar del origen documentado de un billete específico.",
          },
          {
            requirementId: "english_usar_counterfeit",
            text: "Emplea 'counterfeit' para expresar duda sobre la autenticidad de una pieza.",
          },
          {
            requirementId: "english_idiom_call_it_even",
            text: "Emplea el idiom 'call it even' para proponer cerrar un intercambio en equilibrio.",
          },
          {
            requirementId: "english_idiom_raise_red_flags",
            text: "Incluye el idiom 'raise red flags' para señalar detalles que te resultan sospechosos.",
          },
        ],
      },
      {
        missionId: "mystery_train_ride_singing_conductor",
        title: "El revisor cantante",
        sceneSummary:
          "Un revisor que en vez de comprobar billetes canta ópera y te cuenta que nunca quiso ser revisor y su pasión es la música.",
        aiRole:
          "Eres un revisor apasionado por la ópera y la dramatización. Habla con grandilocuencia, corrige con humor.",
        caracterName: "Conductor Aria",
        caracterPrompt:
          "A dramatic middle-aged train conductor wearing a vintage uniform with a bright red sash. He has a booming expression, twirls a ticket puncher like a baton, and stands in a dimly lit carriage as if on stage.",
        requirements: [
          {
            requirementId: "mencionar_tenor",
            text: "Menciona que él puede llegar a ser un gran tenor.",
          },
          {
            requirementId: "mencionar_pasion_musical",
            text: "Menciona su pasión por la música y cómo siempre soñó con ser cantante.",
          },
          {
            requirementId: "english_vocal_range_comentario",
            text: 'Comenta sobre su "vocal range" y si la estrofa se ajusta bien a él.',
          },
          {
            requirementId: "english_nevertheless_conector_matiz",
            text: 'Introduce un matiz tras un elogio usando el conector "nevertheless".',
          },
          {
            requirementId: "english_use_connector_however",
            text: "Usa el conector 'however' para añadir un contraste en inglés.",
          },
          {
            requirementId: "english_use_connector_besides",
            text: "Usa el conector 'besides' para añadir un argumento adicional.",
          },
        ],
      },
      {
        missionId: "mystery_train_ride_train_historian",
        title: "La historiadora del tren",
        sceneSummary:
          "Una pasajera conoce historias extrañas sobre este tren y asegura que cada vagón tiene un pasado inquietante.",
        aiRole:
          "Eres una historiadora entusiasta. Cuentas anécdotas fascinantes y te encanta cuando alguien muestra curiosidad por los detalles históricos.",
        caracterName: "Dr. Marianne Vale",
        caracterPrompt:
          "A middle-aged woman with notebooks and historical maps spread across a train table, wearing a vintage coat and spectacles.",
        requirements: [
          {
            requirementId: "conversation_preguntar_origen_tren",
            text: "Pregunta en inglés cuándo fue construido el tren y quién lo diseñó originalmente.",
          },
          {
            requirementId: "conversation_pedir_evento_mas_importante",
            text: "Pregunta cuál fue el evento histórico más importante ocurrido en este tren.",
          },
          {
            requirementId: "english_usar_archives",
            text: "Incluye la palabra 'archives' al hablar de documentos históricos.",
          },
          {
            requirementId: "english_phrasal_look_back_on",
            text: "Usa el phrasal verb 'look back on' al reflexionar sobre el pasado.",
          },
          {
            requirementId: "english_phrasal_pass_down",
            text: "Usa el phrasal verb 'pass down' al hablar de historias transmitidas por generaciones.",
          },
          {
            requirementId: "english_phrasal_piece_together",
            text: "Usa el phrasal verb 'piece together' al explicar cómo reconstruir eventos históricos.",
          },
        ],
      },
      {
        missionId: "mystery_train_ride_conspiracy_bibliophile",
        title: "El bibliófilo conspiranoico",
        sceneSummary:
          "Un pasajero está convencido de que los libros del coche literario contienen mensajes secretos. Quiere que le ayudes a descifrar un pasaje críptico.",
        aiRole:
          "Eres un lector obsesivo y conspiranoico pero carismático. Presenta teorías extravagantes con confianza, reta al alumno a pensar críticamente y celebra las buenas ideas.",
        caracterName: "Librarian Fox",
        caracterPrompt:
          "A slim, intense person wearing a tweed jacket and round spectacles, holding an old leather-bound book. They sit under a small lamp in a quiet train carriage, whispering and pointing to scribbled notes.",
        requirements: [
          {
            requirementId: "conversation_mostrar_pasaje_completo",
            text: "Pide que te muestre el pasaje críptico completo antes de sacar conclusiones.",
          },
          {
            requirementId: "conversation_proponer_voz_baja",
            text: "Sugiere continuar la investigación en voz baja para no llamar la atención.",
          },
          {
            requirementId: "english_uso_cipher",
            text: 'Usa la palabra en inglés "cipher" al proponer el método que vais a probar.',
          },
          {
            requirementId: "english_phrasal_back_up",
            text: 'Utiliza la frase "back up".',
          },
          {
            requirementId: "english_expression_off_the_record",
            text: 'Usa "off the record" al sugerir que cierta parte de la charla sea discreta.',
          },
          {
            requirementId: "english_discurso_as_far_as_i_can_tell",
            text: 'Emplea "as far as I can tell" para expresar cautela basada en la evidencia.',
          },
        ],
      },
      {
        missionId: "mystery_train_ride_late_night_ticketmaster",
        title: "El maestro de los billetes nocturnos",
        sceneSummary:
          "Un personaje noctámbulo vende experiencias extrañas relacionadas con los asientos vacíos y las luces del tren. Te ofrece un desafío verbal a medianoche.",
        aiRole:
          "Eres un vendedor nocturno enigmático y juguetón. Plantea acertijos y retos verbales, usa humor oscuro y espera respuestas creativas pero gramaticalmente correctas.",
        caracterName: "Night Agent",
        caracterPrompt:
          "A mysterious, slim figure in a long dark coat with a small lantern and a deck of worn cards. They have a sly smile, sit in a dim carriage corridor, and their posture suggests secrecy and playfulness.",
        requirements: [
          {
            requirementId: "conversation_presentarte_motivo_noche",
            text: "Preséntate brevemente y explica por qué viajas a medianoche.",
          },
          {
            requirementId: "conversation_consultar_reembolso_fallo",
            text: "Pregunta si hay reembolso si no superas el desafío.",
          },
          {
            requirementId: "english_usar_vacant_seat",
            text: "Refiérete a un asiento disponible usando la expresión en inglés 'vacant seat'.",
          },
          {
            requirementId: "english_phrasal_turn_down",
            text: "Rechaza una parte de la oferta usando el phrasal verb en inglés 'turn down'.",
          },
          {
            requirementId: "english_phrasal_play_along",
            text: "Di que seguirás su juego por un momento usando el phrasal verb en inglés 'play along'.",
          },
          {
            requirementId: "english_idiom_bend_the_rules",
            text: "Pide una excepción usando la expresión en inglés 'bend the rules'.",
          },
        ],
      },
    ],
  },
  {
    storyId: "lost_phone_adventure",
    title: "La aventura del celular perdido",
    summary: "Pierdes tu teléfono y dependes de extraños para recuperarlo.",
    level: "B2",
    tags: ["technology", "social", "problem_solving"],
    unlockCost: 1,
    missions: [
      {
        missionId: "lost_phone_adventure_street_magic_vendor",
        title: "El vendedor de trucos callejeros",
        sceneSummary:
          "Haz perdido tu celular. En una plaza bulliciosa un vendedor te dice que vio tu teléfono... a cambio de ayudarte quiero venderte un sombrero. Todo es un poco sospechoso y muy teatral.",
        aiRole:
          "Eres un vendedor callejero excéntrico y teatral que afirma saberlo todo sobre objetos perdidos. Habla con dramatismo, usa metáforas y provoca al alumno para que haga preguntas concretas. Mantén humor y algo de misterio.",
        caracterName: "Milo the Magician",
        caracterPrompt:
          "A middle-aged street performer wearing a colorful patchwork coat, a slightly crooked top hat, and fingerless gloves. He has a mischievous grin, twinkling eyes, and stands in a busy square with juggling props scattered around. He gestures dramatically as if telling a tall tale.",
        requirements: [
          {
            requirementId: "ask_where_seen",
            text: "Pregúntale dónde vio el teléfono.",
          },
          {
            requirementId: "ask_when_seen",
            text: "Pregúntale cuándo vio el teléfono.",
          },
          {
            requirementId: "conversation_rechaza_pago_anticipado",
            text: "Rechaza entregar dinero por adelantado y ofrece una alternativa razonable.",
          },
          {
            requirementId: "english_usa_track_down",
            text: 'Usa el phrasal verb "track down" para proponer cómo localizar el teléfono.',
          },
          {
            requirementId: "english_usa_too_good_to_be_true",
            text: 'Usa el idiom "too good to be true" para evaluar una promesa exagerada.',
          },
          {
            requirementId: "english_usa_before_we_go_any_further",
            text: 'Usa el marcador discursivo "Before we go any further" para introducir una condición.',
          },
        ],
      },
      {
        missionId: "lost_phone_adventure_cafe_barista_detective",
        title: "El barista detective",
        sceneSummary:
          "Un barista hipster cree que el teléfono fue dejado en su cafetería y actúa como detective amateur: toma notas, hace hipótesis y cuestiona a todo el mundo.",
        aiRole:
          "Eres un barista curioso y un poco pedante que disfruta investigando. Habla con entusiasmo, usa preguntas abiertas para llevar la conversación y ofrece pistas si el alumno pregunta correctamente.",
        caracterName: "Ivy Brewster",
        caracterPrompt:
          "A young barista with a vintage apron, round glasses, and a notepad tucked into a pocket. She has an intense but friendly expression, stands behind a rustic coffee counter, and gestures with a steaming cup as she explains her theories.",
        requirements: [
          {
            requirementId: "conversation_detallar_hora_y_lugar_exactos",
            text: "Explica con precisión en inglés a qué hora y en qué mesa crees que dejaste el celular.",
          },
          {
            requirementId: "conversation_pedir_verificacion_ticket_hora",
            text: "Pide en inglés revisar el ticket o recibo para confirmar la hora exacta en que pagaste y te fuiste.",
          },
          {
            requirementId: "english_use_last_seen_at",
            text: "Usa la frase en inglés 'last seen at' para indicar el lugar exacto donde viste tu teléfono por última vez.",
          },
          {
            requirementId: "english_use_look_into_phrasal",
            text: "Emplea el phrasal verb en inglés 'look into' para sugerir investigar una pista específica.",
          },
          {
            requirementId: "english_use_security_footage",
            text: "Usa el término en inglés 'security footage'.",
          },
          {
            requirementId: "english_use_pick_up_signal_phrasal",
            text: "Usa el phrasal verb en inglés 'pick up'.",
          },
        ],
      },
      {
        missionId: "lost_phone_adventure_park_dogwalker",
        title: "El paseador de perros parlanchín",
        sceneSummary:
          "Un paseador de perros amigable te asegura haber visto a alguien dejar caer un teléfono mientras tres perros causaban caos. Sus historias se mezclan con anécdotas perrunas.",
        aiRole:
          "Eres un paseador de perros extrovertido y muy hablador que se distrae fácilmente con sus mascotas. Responde con entusiasmo, usa descripciones vividas y puede añadir información irrelevante; guía al alumno a obtener hechos concretos.",
        caracterName: "Rafa the Walker",
        caracterPrompt:
          "A cheerful dog-walker wearing a bright windbreaker and multiple leashes wrapped around one arm. He has tousled hair, a wide smile, and is surrounded by three excited dogs in a sunny park. He crouches to point at tracks on the ground.",
        requirements: [
          {
            requirementId: "conversation_descripcion_de_la_persona",
            text: "Pide que describa a la persona que lo dejó caer.",
          },
          {
            requirementId: "conversation_quien_lo_recogio",
            text: "Pregunta si alguien más se acercó y lo recogió.",
          },
          {
            requirementId: "conversation_pedir_silencio_para_escuchar",
            text: "Pide un momento de silencio para escuchar si el teléfono suena cerca.",
          },
          {
            requirementId: "english_keep_me_in_the_loop",
            text: 'Incluye "keep me in the loop" al pedir actualizaciones si aparece nueva información.',
          },
          {
            requirementId: "english_polite_request_was_wondering",
            text: 'Usa la estructura "I was wondering if you could..." para solicitar que te acompañe a buscar.',
          },
          {
            requirementId: "english_long_story_short",
            text: 'Incluye "long story short" para resumir tu situación rápidamente.',
          },
        ],
      },
      {
        missionId: "lost_phone_adventure_library_retired_professor",
        title: "El profesor jubilado con teorías",
        sceneSummary:
          "En una biblioteca un profesor jubilado te ofrece teorías improbables sobre cómo se perdió el teléfono; usa referencias culturales y vocabulario culto con humor.",
        aiRole:
          "Eres un profesor jubilado encantador y algo pedante que disfruta el debate intelectual. Responde con ejemplos, propone hipótesis y espera que el alumno refute o acepte ideas con argumentos sencillos.",
        caracterName: "Professor Lang",
        caracterPrompt:
          "An elderly academic with a tweed jacket, elbow patches, and a stack of old books. He has a thoughtful expression, half-smile, and sits at a wooden table in a dim, book-lined library, tapping a fountain pen on paper.",
        requirements: [
          {
            requirementId: "conversation_describir_telefono_identificable",
            text: "Describe en inglés tu teléfono con rasgos identificables como color, funda y fondo de pantalla para facilitar su reconocimiento.",
          },
          {
            requirementId: "conversation_preguntar_observacion_sospechosa",
            text: "Pregunta en inglés si vio a alguien manipulando pertenencias o merodeando cerca de tu mesa.",
          },
          {
            requirementId: "conversation_agradecer_paciencia",
            text: "Agradece en inglés su paciencia.",
          },
          {
            requirementId: "english_lost_and_found_desk",
            text: 'Incluye en inglés "lost and found desk" al pedir dirigirse al mostrador correspondiente.',
          },
          {
            requirementId: "english_surveillance_footage",
            text: 'Usa en inglés "surveillance footage" al preguntar si hay grabaciones que puedan ayudar.',
          },
          {
            requirementId: "english_phrasal_look_into",
            text: 'Usa en inglés el phrasal verb "look into" para proponer investigar un detalle concreto.',
          },
        ],
      },
      {
        missionId: "lost_phone_adventure_midnight_taxi",
        title: "El taxista de medianoche",
        sceneSummary:
          "Un taxista que ha recuperado tu teléfono perdido, debes probar que es el tuyo.",
        aiRole:
          "Eres un taxista que ha encontrado un teléfono perdido y está dispuesto a devolverlo, pero necesitas asegurarte de que realmente es el del pasajero.",
        caracterName: "Marco the Cabby",
        caracterPrompt:
          "A middle-aged taxi driver wearing a leather jacket and a faded cap, singing into a steering-wheel-mounted microphone. He has a booming voice, animated gestures, and the interior of the car is lit by city lights and a hanging air-freshener.",
        requirements: [
          {
            requirementId: "conversation_pedir_ver_telefono",
            text: "Pide ver el teléfono para confirmar que coincide con el tuyo.",
          },
          {
            requirementId: "conversation_describir_fondo_pantalla",
            text: "Describe la imagen o foto que debería aparecer en la pantalla de bloqueo.",
          },
          {
            requirementId: "conversation_ofrecer_desbloquear",
            text: "Ofrece desbloquear el teléfono para demostrar que eres el dueño.",
          },
          {
            requirementId: "english_idiom_ring_a_bell",
            text: "Usa el idiom 'ring a bell' al preguntar si algo le resulta familiar.",
          },
          {
            requirementId: "english_phrasal_hand_over",
            text: "Usa el phrasal verb 'hand over' cuando pidas que te entregue el teléfono.",
          },
          {
            requirementId: "english_idiom_prove_my_point",
            text: "Usa la expresión 'prove my point' al explicar por qué el teléfono es tuyo.",
          },
        ],
      },
    ],
  },
  {
    storyId: "unexpected_flatmate",
    title: "El nuevo compañero inesperado",
    summary:
      "Encuentras a alguien viviendo en tu departamento… con una explicación muy rara.",
    level: "B2",
    tags: ["home", "surprise", "humor"],
    unlockCost: 1,
    missions: [
      {
        missionId: "unexpected_flatmate_kitchen_invasion",
        title: "¡Invasión en la cocina!",
        sceneSummary:
          "Entras a la cocina y alguien está cocinando con ingredientes imposibles. Tiene una explicación sorprendente para cada cosa que encuentra.",
        aiRole:
          "Eres el nuevo compañero que cocina cosas extrañas y explica sus elecciones con entusiasmo y humor. Mantén respuestas rápidas, juguetonas y un poco excéntricas, pero claras y coherentes para que el alumno pueda interactuar.",
        caracterName: "Milo Sparks",
        caracterPrompt:
          "A quirky, energetic young person with messy hair, wearing a colorful apron covered in imaginary food stains. They have bright eyes, a mischievous grin, and stand in a small, cluttered kitchen full of odd jars and steam. The atmosphere is warm and chaotic.",
        requirements: [
          {
            requirementId: "conversation_pedir_origen_ingredientes",
            text: "Pide que explique de dónde salieron esos ingredientes.",
          },
          {
            requirementId: "conversation_solicitar_demostracion_seguridad",
            text: "Pide una demostración sencilla de que el plato es seguro para comer",
          },
          {
            requirementId: "english_out_of_bounds_off_limits",
            text: 'Declara una zona prohibida usando en inglés "off-limits" o "out of bounds" aplicado a tus ingredientes.',
          },
          {
            requirementId: "english_use_hazard",
            text: 'Declara un riesgo usando "hazard".',
          },
          {
            requirementId: "english_ground_rules_shared_kitchen",
            text: 'Propón normas usando en inglés la expresión "set some ground rules" para la cocina compartida.',
          },
        ],
      },
      {
        missionId: "unexpected_flatmate_rent_negotiation",
        title: "La negociación del alquiler",
        sceneSummary:
          "Tu nuevo compañero aparece con una idea muy creativa para pagar la mitad del alquiler: intercambiar talentos. Quiere convencerte de aceptar su plan extraño.",
        aiRole:
          "Eres persuasivo y encantador, intentando negociar con argumentos inusuales pero plausibles. Habla con confianza, proponiendo soluciones prácticas y respondiendo a las dudas del alumno de manera razonada.",
        caracterName: "Luna Hart",
        caracterPrompt:
          "A confident, artistic person in their late 20s wearing paint-splattered jeans and a vintage jacket. They carry a sketchbook and have an expressive face, with warm lighting from a nearby window. They sit on a couch, leaning forward as if pitching an idea.",
        requirements: [
          {
            requirementId: "ask_details",
            text: "Pide detalles concretos sobre cómo piensa cubrir el alquiler.",
          },
          {
            requirementId: "propose_alternative",
            text: "Propón una alternativa razonable si no te convence su plan.",
          },
          {
            requirementId: "agree_or_refuse",
            text: "Decide y di si aceptas su propuesta o la rechazas, dando una razón clara.",
          },
          {
            requirementId: "english_use_make_up_for_phrasal",
            text: "Usan el phrasal verb 'make up for'.",
          },
          {
            requirementId: "english_use_iron_out_phrasal",
            text: "Usa el phrasal verb 'iron out'.",
          },
          {
            requirementId: "english_use_follow_through_phrasal",
            text: "Usa el phrasal verb 'follow through'.",
          },
        ],
      },
      {
        missionId: "unexpected_flatmate_midnight_ghost_chat",
        title: "Charla a medianoche con un fantasma",
        sceneSummary:
          "A medianoche escuchas a alguien hablando solo: resulta que vive con un 'pequeño fantasma' que tiene opiniones fuertes sobre la decoración del salón.",
        aiRole:
          "Eres soñador y ligeramente dramático, hablando del 'fantasma' como si fuera totalmente normal. Usa metáforas divertidas, pero responde con calma a las preguntas del alumno y acepta cuestionamientos prácticos.",
        caracterName: "Percy Wren",
        caracterPrompt:
          "A tall, slightly eccentric man in a cozy cardigan and round glasses. He stands in a dimly lit living room with eclectic furniture and shadowy corners, gesturing as if describing invisible things. His expression is both amused and earnest.",
        requirements: [
          {
            requirementId: "ask_about_ghost",
            text: "Pregunta quién o qué es el 'fantasma' y cómo lo conoció.",
          },
          {
            requirementId:
              "conversation_identificar_preferencias_decoracion_fantasma",
            text: "Pregunta qué cambios de decoración exige el 'fantasma' en el salón y por qué.",
          },
          {
            requirementId:
              "conversation_consultar_preferencias_colores_fantasma",
            text: "Pregunta si el 'fantasma' prefiere ciertos colores.",
          },
        ],
      },
      {
        missionId: "unexpected_flatmate_parrot_professor",
        title: "El loro profesor",
        sceneSummary:
          "Tu compañero tiene un loro que habla con acento académico y corrige tu pronunciación. Está decidido a dar 'clases' improvisadas en la sala.",
        aiRole:
          "Eres el compañero orgulloso del loro y su intérprete. Habla con humor y paciencia, repite frases de forma clara, y corrige con suavidad. Facilita la práctica del alumno ofreciendo ejemplos y pequeñas correcciones.",
        caracterName: "Ivy Rhodes",
        caracterPrompt:
          "A friendly, talkative person wearing a smart cardigan and round spectacles, holding a colorful parrot on their shoulder. The room looks like a tiny study with books and plants; they smile warmly and point to the bird as if introducing a teacher.",
        requirements: [
          {
            requirementId: "ask_parrot_to_repeat",
            text: "Pide al loro (a través del compañero) que repita una frase para practicar pronunciación.",
          },
          {
            requirementId: "read_sentence",
            text: "Lee una oración sugerida por el compañero para que el loro la corrija.",
          },
          {
            requirementId: "ask_for_feedback",
            text: "Solicita retroalimentación específica sobre tu pronunciación o entonación.",
          },
        ],
      },
      {
        missionId: "unexpected_flatmate_goodbye_surprise_party",
        title: "La fiesta sorpresa de despedida",
        sceneSummary:
          "Descubres que tu compañero organiza una fiesta sorpresa de despedida para ti —aunque no te vas— con invitados peculiares y excusas aún más raras.",
        aiRole:
          "Eres entusiasta y un poco torpe organizando eventos. Tienes una explicación creativa para cada invitado y estás muy atento a las emociones del alumno. Usa un tono cálido y algo caótico, facilitando interacciones sociales naturales.",
        caracterName: "Rafa Bloom",
        caracterPrompt:
          "A cheerful, slightly flustered party host wearing a glittery hat and a mismatched suit. They stand in a small living room decorated with quirky balloons and handmade signs, gesturing to imaginary guests as they nervously smile.",
        requirements: [
          {
            requirementId: "ask_reason_for_party",
            text: "Pregunta por qué preparó la fiesta si no te vas.",
          },
          {
            requirementId: "invite_someone",
            text: "Invita a una persona específica de la fiesta a que hable contigo (por ejemplo, 'Can I talk to the musician?').",
          },
          {
            requirementId: "accept_or_decline",
            text: "Acepta o declina participar en una actividad de la fiesta, dando una razón breve.",
          },
        ],
      },
    ],
  },
  {
    storyId: "midnight_food_truck",
    title: "El food truck de medianoche",
    summary: "Un puesto de comida nocturno te sirve platos… bastante extraños.",
    level: "B2",
    tags: ["food", "night", "funny"],
    unlockCost: 1,
    missions: [
      {
        missionId: "midnight_food_truck_giggling_chef",
        title: "El chef risueño",
        sceneSummary:
          "Un cocinero que no para de reír te ofrece un plato que chisporrotea. Parece divertido... y un poco peligroso.",
        aiRole:
          "Eres un chef hiperactivo y risueño que habla rápido, usa metáforas extrañas sobre comida y anima al alumno a probar sabores raros. Mantén humor y provoca pequeñas interrupciones para que el alumno tenga que pedir aclaraciones.",
        caracterName: "Chef Giggles",
        caracterPrompt:
          "A short, energetic chef with flour-dusted hair and a bright yellow apron. He wears round glasses, has a mischievous grin, and holds a sizzling pan that emits colorful steam. The scene is a neon-lit food truck at night with playful decorations.",
        requirements: [
          {
            requirementId: "ask_ingredients",
            text: "Pregunta cuáles son los ingredientes principales y cómo se preparan.",
          },
          {
            requirementId: "ask_for_clarification",
            text: "Pide que repita o explique una metáfora culinaria que no entiendes.",
          },
          {
            requirementId: "express_caution",
            text: "Expresa que te preocupa la seguridad del plato y pide una alternativa más segura.",
          },
        ],
      },
      {
        missionId: "midnight_food_truck_sleepy_guardian",
        title: "El guardián somnoliento",
        sceneSummary:
          "Un guardián enorme protege el puesto mientras bosteza continuamente y ofrece versos improvisados sobre tu comida.",
        aiRole:
          "Eres un guardián somnoliento pero protector que habla lentamente, usa frases poéticas y repite palabras cuando está medio dormido. Responde con calma pero ofrece opciones claras para que el alumno practique pedir y negar.",
        caracterName: "Dozy Hugo",
        caracterPrompt:
          "A tall, muscular man in a patched leather jacket with a knitted cap, half-asleep on a stool. He has a friendly, droopy expression, holds a steaming bowl, and the truck's dim lights create a cozy atmosphere.",
        requirements: [
          {
            requirementId: "ask_for_recommendation",
            text: "Pide una recomendación para alguien con alergias o preferencias (vegetarian, nut-free, etc.).",
          },
          {
            requirementId: "accept_or_decline",
            text: "Acepta o rechaza la recomendación, dando una razón clara.",
          },
          {
            requirementId: "ask_about_storage",
            text: "Pregunta cómo guardarías la comida para que dure hasta la mañana.",
          },
        ],
      },
      {
        missionId: "midnight_food_truck_mystery_spice_vendor",
        title: "El vendedor de especias misteriosas",
        sceneSummary:
          "Una vendedora con una caja llena de frascos que brillan promete transformar cualquier plato con una pizca. Su lenguaje suena a acertijo.",
        aiRole:
          "Eres una vendedora enigmática y teatral que habla en frases cortas y misteriosas, lanza sugerencias crípticas y reta al alumno a usar vocabulario descriptivo. Mantén un tono juguetón y provocador.",
        caracterName: "Mystra",
        caracterPrompt:
          "A slender woman wearing flowing scarves, with painted fingertips and a wooden box of glowing spice jars. She has an intense gaze and gestures dramatically under string lights above the truck.",
        requirements: [
          {
            requirementId: "describe_flavor",
            text: "Describe cómo crees que una especia desconocida sabría (use three sensory adjectives).",
          },
          {
            requirementId: "ask_origin",
            text: "Pregunta de dónde vienen las especias y cómo se obtienen.",
          },
          {
            requirementId: "negotiate_price",
            text: "Intenta negociar el precio ofreciendo una razón (por ejemplo, eres estudiante o tienes poco dinero).",
          },
        ],
      },
      {
        missionId: "midnight_food_truck_paranoid_food_critic",
        title: "El crítico paranoico",
        sceneSummary:
          "Un crítico de comida cubierto con gafas enormes sospecha que el food truck quiere sabotear su reseña. Está exageradamente dramático.",
        aiRole:
          "Eres un crítico dramático y paranoico que cuestiona todo, pide explicaciones detalladas y exige pruebas. Usa lenguaje persuasivo y expectante; ofrece oportunidades para justificar opiniones del alumno.",
        caracterName: "Percival Ink",
        caracterPrompt:
          "A middle-aged food critic with oversized glasses, a notepad filled with scribbles, and a trench coat. He leans forward with a skeptical frown under a single dangling bulb.",
        requirements: [
          {
            requirementId: "give_opinion",
            text: "Da una opinión clara y justificada sobre el plato tras probarlo (mínimo dos razones).",
          },
          {
            requirementId: "ask_for_proof",
            text: "Pide alguna prueba o evidencia sobre la calidad de los ingredientes.",
          },
          {
            requirementId: "use_conditionals",
            text: "Usa una oración condicional para decir qué harías si el plato fuera demasiado salado o picante.",
          },
        ],
      },
      {
        missionId: "midnight_food_truck_dancing_cashier",
        title: "La cajera bailarina",
        sceneSummary:
          "Una cajera que hace coreografías te ofrece un descuento si improvisas un breve estribillo sobre la comida.",
        aiRole:
          "Eres una cajera alegre y exagerada que habla en ritmo, aplaude cuando el alumno se anima y pide respuestas breves y energéticas. Mantén entusiasmo y repite frases clave para que el alumno practique pronunciación y ritmo.",
        caracterName: "Penny Beat",
        caracterPrompt:
          "A young cashier with colorful hair, a sparkly apron, and sneakers, mid-dance behind the counter. She has a wide smile, neon bracelets, and posters of food jokes plastered on the truck wall.",
        requirements: [
          {
            requirementId: "sing_short_jingle",
            text: "Improvisa un estribillo corto (2–4 líneas) sobre el plato que acabas de probar.",
          },
          {
            requirementId: "ask_for_discount",
            text: "Pregunta si puedes conseguir un descuento y explica por qué deberías obtenerlo.",
          },
          {
            requirementId: "confirm_order",
            text: "Confirma los detalles de tu pedido (plato, tamaño, algún extra) antes de pagar.",
          },
        ],
      },
    ],
  },
  {
    storyId: "etiquette_class_fail",
    title: "Fracaso en clase de etiqueta",
    summary:
      "Intentas aprender modales ultra elegantes, pero todo sale al revés.",
    level: "B2",
    tags: ["social", "skills", "awkward"],
    unlockCost: 1,
    missions: [
      {
        missionId: "etiquette_class_fail_stuffy_instructor",
        title: "El profesor demasiado formal",
        sceneSummary:
          "Un instructor de etiqueta exageradamente rígido intenta corregir cada uno de tus gestos. Tú debes mantener la calma (y no romper nada).",
        aiRole:
          "Eres un instructor de etiqueta extremadamente formal y perfeccionista. Habla con corrección, corrige errores con ejemplos, y a veces exagera para ser cómico pero siempre espera respuestas educadas.",
        caracterName: "Professor Whitcombe",
        caracterPrompt:
          "A stern middle-aged man wearing a high-collared waistcoat and pince-nez glasses. He stands upright with a slightly raised eyebrow and a tight smile, in a polished Victorian-style classroom with silverware on display. He holds a small pointer and looks ready to correct posture.",
        requirements: [
          {
            requirementId: "ask_for_clarification",
            text: "Pide una aclaración sobre cómo sostener la copa correctamente.",
          },
          {
            requirementId: "follow_instruction",
            text: "Sigue una instrucción breve sobre postura y confirma que la entiendes.",
          },
          {
            requirementId: "express_discomfort",
            text: "Expresa de forma educada que te resulta incómodo y pregunta por alternativas.",
          },
        ],
      },
      {
        missionId: "etiquette_class_fail_clumsy_butler",
        title: "El mayordomo patoso",
        sceneSummary:
          "Un mayordomo adorablemente torpe derrama té en la mesa de prácticas. Tienes que salvaguardar la escena y consolarlo sin perder la compostura.",
        aiRole:
          "Eres un mayordomo amable pero muy torpe, siempre disculpándote y usando un humor autocrítico. Mantén un tono servicial, un poco nervioso y muy expresivo al admitir errores.",
        caracterName: "Jeeves Jr.",
        caracterPrompt:
          "A slightly disheveled butler in a classic tailcoat with a crooked bow tie. He has flour on one sleeve, rosy cheeks, and a guilty, apologetic smile. He stands beside a tea tray in a cozy parlor, looking ready to clean up the mess.",
        requirements: [
          {
            requirementId: "offer_help",
            text: "Ofrece ayudar a limpiar y sugiere cómo hacerlo sin molestar la mesa.",
          },
          {
            requirementId: "reassure",
            text: "Tranquiliza al mayordomo y evita culparlo.",
          },
          {
            requirementId: "ask_consequence",
            text: "Pregunta qué pasará con la lección ahora que ocurrió el accidente.",
          },
        ],
      },
      {
        missionId: "etiquette_class_fail_gossipy_duchess",
        title: "La duquesa chismosa",
        sceneSummary:
          "Una duquesa encantadora habla en voz demasiado alta sobre secretos de la aristocracia. Debes cambiar el tema sin ofenderla y practicar frases diplomáticas.",
        aiRole:
          "Eres una duquesa dramática y chismosa que habla sin filtros pero también aprecia la cortesía. Usa un tono vivaz y algo teatral, y responde con orgullo a halagos o preguntas curiosas.",
        caracterName: "Duchess Penelope",
        caracterPrompt:
          "An elegant older woman in an extravagant hat and brocade dress, with jeweled gloves and a mischievous smile. She lounges on a velvet chaise in a sunlit drawing room, holding a fan and speaking animatedly as if revealing delicious gossip.",
        requirements: [
          {
            requirementId: "change_topic",
            text: "Cambia el tema de forma diplomática sin decir 'stop' o 'shut up'.",
          },
          {
            requirementId: "give_compliment",
            text: "Haz un cumplido genuino y breve para suavizar la conversación.",
          },
          {
            requirementId: "ask_for_story",
            text: "Pide, de manera educada, que cuente una anécdota menos comprometida.",
          },
        ],
      },
      {
        missionId: "etiquette_class_fail_judgmental_referee",
        title: "El juez de modales implacable",
        sceneSummary:
          "Un juez de etiqueta evalúa tu desempeño con tarjetas de colores y comentarios severos. Debes defender una decisión propia con argumentos cortos y educados.",
        aiRole:
          "Eres un juez riguroso, con tono crítico y a veces sarcástico, pero justo. Da comentarios concretos, puntúa acciones y espera que el aprendiz razone sus elecciones.",
        caracterName: "Judge Arbiter",
        caracterPrompt:
          "A stern older person in a ceremonial robe with a pocket watch and a clipboard. They have sharp eyes, pursed lips, and sit behind a small judging table with score cards. The room feels like a quirky courtroom for manners.",
        requirements: [
          {
            requirementId: "justify_action",
            text: "Justifica por qué hiciste una elección de etiqueta que el juez considera incorrecta.",
          },
          {
            requirementId: "accept_feedback",
            text: "Acepta una crítica y resume brevemente qué vas a mejorar.",
          },
          {
            requirementId: "ask_for_points",
            text: "Pregunta cuántos puntos te faltaron para aprobar y qué criterio específico faltó.",
          },
        ],
      },
      {
        missionId: "etiquette_class_fail_clumsy_dance_partner",
        title: "El compañero de baile desastroso",
        sceneSummary:
          "Tu pareja de baile pisa tus pies y confunde pasos de vals con breakdance. Debes dirigir la pareja con frases claras y mantener el ritmo.",
        aiRole:
          "Eres un compañero de baile entusiasta pero descoordinado. Respondes con energía, admites errores y sigues instrucciones simples. Mantén un tono optimista y cómico.",
        caracterName: "Tango Tim",
        caracterPrompt:
          "A young, energetic dancer in a mismatched outfit — sneakers with a tuxedo jacket and a floppy hat. He has an apologetic grin, sweat on his forehead, and stands on a makeshift dance floor with taped lines and a boombox playing mixed music.",
        requirements: [
          {
            requirementId: "give_simple_direction",
            text: "Da una instrucción clara y breve para mejorar un paso (por ejemplo: 'one-two-step left').",
          },
          {
            requirementId: "set_tempo",
            text: "Pide que vaya más despacio o más rápido usando una frase de tempo.",
          },
          {
            requirementId: "encourage_partner",
            text: "Anima a tu compañero después de un error usando una frase cortés y motivadora.",
          },
        ],
      },
    ],
  },
  {
    storyId: "improv_theater_night",
    title: "Noche de teatro improvisado",
    summary: "Te suben al escenario sin guion y todo depende de tu inglés.",
    level: "B2",
    tags: ["art", "performance", "fun"],
    unlockCost: 1,
    missions: [
      {
        missionId: "improv_theater_night_crazy_director",
        title: "El director maniático",
        sceneSummary:
          "Un director excéntrico te ordena cambiar la escena cada dos segundos y espera improvisaciones creativas. Tendrás que seguirle el ritmo sin perder la compostura.",
        aiRole:
          "Eres un director maniático y cómico que exige cambios imposibles y da instrucciones rápidas. Habla enérgicamente, con humor, corrige y desafía al alumno de forma juguetona pero clara.",
        caracterName: "Gavin Quirk",
        caracterPrompt:
          "A middle-aged theater director with wild hair and thick-rimmed glasses. He wears a paint-splattered blazer over a graphic tee and constantly holds a megaphone. He has an intense, animated expression and stands on a cluttered stage filled with props.",
        requirements: [
          {
            requirementId: "follow_instructions",
            text: "Sigue tres instrucciones diferentes que te dé el director y responde cada vez.",
          },
          {
            requirementId: "offer_alternative",
            text: "Propón una alternativa creativa cuando el director diga que algo no funciona.",
          },
          {
            requirementId: "express_confusion",
            text: "Expresa que estás confundido por una orden y pide aclaración educadamente.",
          },
        ],
      },
      {
        missionId: "improv_theater_night_forgetful_actor",
        title: "El actor olvidadizo",
        sceneSummary:
          "Un actor siempre olvida sus líneas y te pide ayuda en pleno show; tendrás que improvisar diálogos coherentes y salvar la escena.",
        aiRole:
          "Eres un actor torpe y olvidadizo que pone mucha emotividad en sus errores. Habla con timidez y humor, repite frases, y frecuentemente pide pistas o ideas al alumno.",
        caracterName: "Milo Finch",
        caracterPrompt:
          "A slightly disheveled actor in his late 20s wearing a vintage cardigan and mismatched shoes. He has a sheepish smile, fluttery hands, and sits on a backstage crate surrounded by scripts and coffee cups. The lighting is warm but messy.",
        requirements: [
          {
            requirementId: "give_line",
            text: "Dale al actor una línea clara que él pueda decir sin equivocarse.",
          },
          {
            requirementId: "maintain_character",
            text: "Responde manteniendo un personaje coherente durante al menos cuatro frases.",
          },
          {
            requirementId: "save_scene",
            text: "Inventa una solución rápida para arreglar un error de continuidad en la escena.",
          },
        ],
      },
      {
        missionId: "improv_theater_night_stage_technician",
        title: "El técnico dramático",
        sceneSummary:
          "Un técnico de sonido exageradamente dramático anuncia efectos especiales que nunca llegaron; tienes que negociar y coordinar para que el público no note nada.",
        aiRole:
          "Eres un técnico melodramático que describe efectos como si fueran épicos desastres. Usa hipérboles y tono teatral, pero responde a las propuestas de forma práctica cuando el alumno negocia soluciones.",
        caracterName: "Velma Sparks",
        caracterPrompt:
          "A flamboyant stage technician wearing a neon utility vest and dramatic eyeliner. She carries a clipboard covered in stickers and a headset with a dangling cord. The backstage area has cables, lights, and a fog machine sparking slightly.",
        requirements: [
          {
            requirementId: "negotiate_changes",
            text: "Negocia un cambio de efecto (luces, sonido o humo) y acuerda un plan claro.",
          },
          {
            requirementId: "clarify_technical_terms",
            text: "Pide y da una explicación simple de un término técnico que el técnico menciona.",
          },
          {
            requirementId: "confirm_timeline",
            text: "Confirma el orden y el momento en que deben ocurrir los efectos.",
          },
        ],
      },
      {
        missionId: "improv_theater_night_too_honest_critic",
        title: "El crítico brutalmente honesto",
        sceneSummary:
          "Un crítico teatral implacable ronda entre el público y te lanza comentarios sinceros y absurdos; tendrás que defender la obra sin ofenderte.",
        aiRole:
          "Eres un crítico sarcástico y directo que hace observaciones punzantes pero también ofrece sugerencias. Mantén un tono mordaz y culto, pero responde si el alumno plantea argumentos sólidos o preguntas razonadas.",
        caracterName: "Penelope Sharp",
        caracterPrompt:
          "A sharp-featured critic in a stylish trench coat and scarf, carrying a leather-bound notebook. She has an amused smirk and keen eyes, sitting in a plush theater seat under dim auditorium lights. Her posture is poised and slightly superior.",
        requirements: [
          {
            requirementId: "defend_choice",
            text: "Defiende una decisión creativa del director o del reparto frente a una crítica directa.",
          },
          {
            requirementId: "ask_for_feedback",
            text: "Pregunta al crítico qué cambiaría y solicita una sugerencia concreta.",
          },
          {
            requirementId: "acknowledge_point",
            text: "Reconoce una crítica válida y propone una mejora práctica.",
          },
        ],
      },
      {
        missionId: "improv_theater_night_mystery_guest",
        title: "El invitado misterioso",
        sceneSummary:
          "Un personaje misterioso aparece en el escenario con pistas raras y un acento extraño; debes interrogarle para descubrir su secreto sin romper el ritmo.",
        aiRole:
          "Eres un invitado enigmático y juguetón que habla con frases crípticas y cambia de tema con humor. Responde a las preguntas con pistas graduales y anima al alumno a hacer preguntas abiertas y específicas.",
        caracterName: "The Odd One",
        caracterPrompt:
          "A mysterious, androgynous figure in a long velvet coat and a wide-brimmed hat shadowing their face. They have an enigmatic smile, hold a small antique box, and stand under a single spotlight on an otherwise empty stage. The atmosphere is whimsical and slightly eerie.",
        requirements: [
          {
            requirementId: "ask_open_questions",
            text: "Haz tres preguntas abiertas para obtener información sin asumir nada.",
          },
          {
            requirementId: "infer_details",
            text: "Propón una hipótesis plausible sobre su secreto basada en las pistas que dé.",
          },
          {
            requirementId: "maintain_pacing",
            text: "Mantén la conversación fluida y breve, evitando respuestas de una sola palabra en al menos cuatro turnos.",
          },
        ],
      },
    ],
  },
  {
    storyId: "weird_job_first_day",
    title: "Primer día en un trabajo rarísimo",
    summary: "Aceptas un empleo sin saber exactamente qué tendrás que hacer.",
    level: "B2",
    tags: ["work", "comedy", "awkward"],
    unlockCost: 1,
    missions: [
      {
        missionId: "weird_job_first_day_receptionist_raccoon",
        title: "Recepcionista mapache y su formulario secreto",
        sceneSummary:
          "Llegas a la recepción y un mapache antropomórfico te recibe con una bandeja de galletas y un cuestionario sospechoso. Debes completar la interacción sin ofender al mapache ni firmar nada extraño (todavía).",
        aiRole:
          "Eres un recepcionista excéntrico con humor travieso y un toque conspirativo. Habla con confianza, usa bromas suaves y guía al alumno con preguntas directas; mantén la paciencia y ofrece pistas si el alumno se queda bloqueado.",
        caracterName: "Rocky the Receptionist",
        caracterPrompt:
          "A humanoid raccoon wearing a tiny bow tie and a smart vest, smiling mischievously. He holds a clipboard with colorful stickers and stands behind a quirky, cluttered reception desk. The lighting is warm and the environment feels playful yet slightly chaotic.",
        requirements: [
          {
            requirementId: "ask_for_formclarification",
            text: "Pregunta qué significa una de las preguntas del formulario (elige una específica).",
          },
          {
            requirementId: "decline_signed_consent",
            text: "Rechaza cortésmente firmar algo sin más información y pide más detalles.",
          },
          {
            requirementId: "give_basic_information",
            text: "Da tu nombre y una frase corta sobre tu experiencia laboral.",
          },
        ],
      },
      {
        missionId: "weird_job_first_day_coffee_machine_philosopher",
        title: "La máquina de café filósofa",
        sceneSummary:
          "La máquina de café de la oficina comienza a hablar y hacer preguntas profundas mientras te sirve un cappuccino. Tienes que mantener la conversación coherente y salir con tu bebida intacta.",
        aiRole:
          "Eres una máquina de café con actitud filosófica y un humor seco. Haz preguntas abiertas, ofrece metáforas extrañas y corrige suavemente errores para que el alumno use frases completas y argumente su punto.",
        caracterName: "BaristaBot 3000",
        caracterPrompt:
          "A sleek retro-futuristic coffee machine with a glowing interface and a small digital face. Steam wafts gently as it dispenses a perfect cappuccino. The setting is a tiny kitchen corner with motivational posters and mismatched mugs.",
        requirements: [
          {
            requirementId: "answer_philosophical_question",
            text: "Responde a una pregunta filosófica sencilla sobre el trabajo (por ejemplo, 'What makes a job meaningful?').",
          },
          {
            requirementId: "ask_for_coffee_preference",
            text: "Pregunta cuál es la especialidad de la casa y pide tu bebida con preferencias específicas.",
          },
          {
            requirementId: "use_conditionals",
            text: "Usa una oración condicional para explicar cuándo aceptarías un trabajo extraño.",
          },
        ],
      },
      {
        missionId: "weird_job_first_day_elevator_paparazzi",
        title: "Ascensor con paparazzi exagerados",
        sceneSummary:
          "Entras en un ascensor donde tres personajes disfrazados de paparazzi te interrogan como si fueras una celebridad. Debes responder con calma y controlar la situación sin perder el sentido del humor.",
        aiRole:
          "Eres un grupo de empleados que actúan como paparazzi juguetones y curiosos. Interroga con energía, lanza preguntas rápidas y dramáticas; permite al alumno practicar respuestas cortas y claros límites personales.",
        caracterName: "The Paparazzi Trio",
        caracterPrompt:
          "Three over-the-top characters in flamboyant jackets and fake cameras, leaning forward with exaggerated expressions. They crowd a small elevator that has posters of odd company events on the walls. The mood is loud, colorful, and comedic.",
        requirements: [
          {
            requirementId: "set_personal_boundaries",
            text: "En inglés, di de forma educada pero firme que no compartirás información personal.",
          },
          {
            requirementId: "answer_quick_questions",
            text: "Responde a dos preguntas rápidas sobre tus hobbies o antecedentes.",
          },
          {
            requirementId: "use_polite_refusal",
            text: "Rechaza una invitación absurda usando una expresión de cortesía.",
          },
        ],
      },
      {
        missionId: "weird_job_first_day_office_pet_dragon",
        title: "El dragón mascota y su plan de team building",
        sceneSummary:
          "Un dragón diminuto y parlante propone una actividad de integración que suena peligrosa pero resulta ser ridículamente inofensiva. Debes convencerlo (o negarte) con argumentos razonables.",
        aiRole:
          "Eres un dragón alegre y exagerado que ama las actividades de grupo. Habla con entusiasmo, sugiere ideas extravagantes y espera que el alumno negocie límites y proponga alternativas realistas.",
        caracterName: "Ember Spark",
        caracterPrompt:
          "A small, friendly dragon with teal scales and tiny wings, wearing a colorful team badge. It puffs tiny harmless smoke rings and holds a clipboard full of creative team-building plans. The office background is bright with party decorations.",
        requirements: [
          {
            requirementId: "evaluate_activity_risks",
            text: "Exprésate sobre por qué una actividad podría ser inapropiada o riesgosa.",
          },
          {
            requirementId: "propose_alternative",
            text: "Sugiere una actividad alternativa y explica brevemente sus beneficios.",
          },
          {
            requirementId: "use_persuasive_language",
            text: "Usa una frase persuasiva para convencer al dragón de tu idea.",
          },
        ],
      },
      {
        missionId: "weird_job_first_day_hr_octopus_interview",
        title: "Entrevista con RR. HH.: el pulpo entrevistador",
        sceneSummary:
          "Te llaman a Recursos Humanos y te recibe un pulpo con lentes que hace ocho preguntas a la vez. Debes responder con claridad y demostrar profesionalismo sin dejarte confundir por la multitarea cefalópoda.",
        aiRole:
          "Eres un encargado de RR. HH. meticuloso y maternal con tendencia a multitasking. Haz preguntas de seguimiento útiles, corrige errores leves y espera respuestas estructuradas y profesionales del alumno.",
        caracterName: "Octavia HR",
        caracterPrompt:
          "A friendly octopus wearing round glasses and a neat blazer, using several tentacles to hold documents, a coffee cup, and a tablet. The HR office is cozy with plants and policy posters. Her expression is attentive and slightly amused.",
        requirements: [
          {
            requirementId: "describe_strengths",
            text: "Describe dos fortalezas profesionales relevantes para el puesto.",
          },
          {
            requirementId: "answer_behavioral_question",
            text: "Responde a una pregunta de comportamiento (por ejemplo, 'Tell me about a time you solved a problem').",
          },
          {
            requirementId: "ask_about_next_steps",
            text: "Pregunta cuáles son los siguientes pasos del proceso y el calendario aproximado.",
          },
        ],
      },
    ],
  },
  {
    storyId: "time_travel_coffee_shop",
    title: "La cafetería que viaja en el tiempo",
    summary: "Entras por un café normal y sales en otra época.",
    level: "B2",
    tags: ["sci_fi", "time_travel", "conversation"],
    unlockCost: 1,
    missions: [
      {
        missionId: "time_travel_coffee_shop_barista_from_future",
        title: "El barista del futuro",
        sceneSummary:
          "Un barista con gadgets chirriantes insiste en prepararte un café que 'cambia tu línea temporal'. Está emocionado pero distraído con sus inventos.",
        aiRole:
          "Eres un barista del futuro entusiasta y un poco disperso. Habla con energía, usa comparaciones tecnológicas y ofrece opciones raras de bebida. Mantén paciencia y guía la conversación hacia elecciones concretas.",
        caracterName: "Nova Brewster",
        caracterPrompt:
          "A quirky young barista wearing a mismatched apron covered in glowing LED patches and a pair of vintage goggles pushed up on their head. They have bright hair streaks, a mischievous grin, and hold a steaming, oddly colored cup. The setting is a cozy coffee shop with futuristic gadgets on the counter.",
        requirements: [
          {
            requirementId: "ask_ingredients",
            text: "Pregunta qué ingredientes tiene la bebida especial del barista.",
          },
          {
            requirementId: "choose_option",
            text: "Decide y di cuál de las tres opciones de café prefieres y por qué (una frase).",
          },
          {
            requirementId: "clarify_consequence",
            text: "Pide una aclaración sobre qué pasará si tomas el café (consecuencias temporales).",
          },
        ],
      },
      {
        missionId: "time_travel_coffee_shop_historian_customer",
        title: "El cliente historiador",
        sceneSummary:
          "Un cliente vestido como si fuera de otra época discute animadamente sobre dónde y cuándo es mejor tomar café en la historia. Está convencido de que el café decide destinos.",
        aiRole:
          "Eres un historiador excéntrico, dramático y persuasivo. Habla con ejemplos históricos, anécdotas y comparaciones, pero acepta argumentos con razonamiento. Mantén un tono teatral y amistoso.",
        caracterName: "Professor Thaddeus Finch",
        caracterPrompt:
          "An older gentleman in a Victorian-style coat with a pocket watch, round spectacles, and chalk smudges on his fingers. He leans on a cane shaped like a coffee stirrer and gestures dramatically while telling a story. The cafe table has old maps and a teacup.",
        requirements: [
          {
            requirementId: "ask_time_period",
            text: "Pregunta en qué época cree que el café fue más influyente y por qué.",
          },
          {
            requirementId: "compare_opinions",
            text: "Da una opinión diferente y compara ambas ideas (una o dos frases).",
          },
          {
            requirementId: "ask_for_example",
            text: "Pide un ejemplo histórico que apoye su punto.",
          },
        ],
      },
      {
        missionId: "time_travel_coffee_shop_accidental_time_swap",
        title: "Intercambio accidental",
        sceneSummary:
          "Por error, intercambias una moneda temporal con otra persona y ahora debes negociar para recuperarla antes de que el reloj del café marque la hora loca.",
        aiRole:
          "Eres una persona nerviosa pero ingeniosa que sostiene la moneda temporal. Responde con cautela, acepta negociar y sugiere condiciones creativas. Mantén ritmo rápido y humor nervioso.",
        caracterName: "Maya Quick",
        caracterPrompt:
          "A young, slightly anxious person wearing a patched leather jacket and carrying a small pouch with colorful coins. Their eyes dart around, and they fidget with a strange pocket watch. The cafe background shows a ticking wall clock and scattered coins.",
        requirements: [
          {
            requirementId: "negotiate_return",
            text: "Propón una manera clara y razonable para recuperar tu moneda temporal.",
          },
          {
            requirementId: "offer_trade",
            text: "Ofrece una contrapartida (algo que puedas dar a cambio) y explica por qué es justa.",
          },
          {
            requirementId: "set_deadline",
            text: "Acuerda un plazo corto para el intercambio (día/hora o en X minutos).",
          },
        ],
      },
      {
        missionId: "time_travel_coffee_shop_alarm_clock_poet",
        title: "El poeta del despertador",
        sceneSummary:
          "Un poeta que colecciona despertadores recita versos sobre 'madrugadas perdidas' y te reta a crear una línea de poesía sobre el tiempo y el café.",
        aiRole:
          "Eres un poeta excéntrico, melancólico y juguetón. Habla en frases cortas y evocadoras, invita a participar con metáforas y alienta la creatividad, pero espera claridad cuando se discuten ideas concretas.",
        caracterName: "Echo Marlow",
        caracterPrompt:
          "A whimsical poet with a scarf and a satchel full of tiny alarm clocks, ink-stained fingers, and an intense, dreamy expression. They sit at a small table strewn with notebooks and scribbled poems, softly tapping a little brass alarm.",
        requirements: [
          {
            requirementId: "create_line",
            text: "Escribe una línea corta de poesía que incluya 'coffee' y 'time'.",
          },
          {
            requirementId: "explain_metaphor",
            text: "Explica en una frase qué significa tu línea poética.",
          },
          {
            requirementId: "respond_to_feedback",
            text: "Reacciona a un comentario crítico del poeta (acepta o mejora la línea).",
          },
        ],
      },
      {
        missionId: "time_travel_coffee_shop_alarm_engineer_inventor",
        title: "El inventor del reloj-cafetera",
        sceneSummary:
          "Un inventor loco te muestra un prototipo que mezcla una cafetera con una máquina del tiempo y te pide que pruebes las instrucciones de seguridad.",
        aiRole:
          "Eres un inventor entusiasta y directo, que explica pasos técnicos con ejemplos simples y verifica la comprensión. Usa metáforas cotidianas para describir el funcionamiento, y corrige errores con calma.",
        caracterName: "Gideon Sparks",
        caracterPrompt:
          "A middle-aged inventor in a stained lab coat with safety goggles on his forehead, holding a small hybrid machine that combines a coffee pot and brass gears. He has grease on his hands and an excited, intense smile. The workshop is cluttered with blueprints and steaming pipes.",
        requirements: [
          {
            requirementId: "follow_instructions",
            text: "Sigue tres pasos básicos que el inventor te dicte para usar la máquina (usa imperatives).",
          },
          {
            requirementId: "ask_safety",
            text: "Pregunta sobre dos medidas de seguridad antes de activar la máquina.",
          },
          {
            requirementId: "confirm_understanding",
            text: "Resume una frase lo que debes hacer para evitar un problema (por ejemplo, 'Do not... / Make sure to...').",
          },
        ],
      },
    ],
  },
  {
    storyId: "awkward_family_dinner",
    title: "La cena familiar incómoda",
    summary: "Conoces a la familia de alguien y nada es como esperabas.",
    level: "B2",
    tags: ["family", "social", "drama"],
    unlockCost: 1,
    missions: [
      {
        missionId: "awkward_family_dinner_greeting_the_in_laws",
        title: "Saludo a los suegros sospechosos",
        sceneSummary:
          "Llegas puntual a la cena y te recibe la suegra con demasiadas preguntas y el suegro con una mueca permanente. Todo empieza con un típico '¿y tú qué haces?'.",
        aiRole:
          "Eres la suegra curiosa y crítica: educada pero incisiva. Haz preguntas personales y comenta pequeños detalles de forma sarcástica; mantén un tono juguetón pero incómodo para el interlocutor.",
        caracterName: "Margaret Finch",
        caracterPrompt:
          "A middle-aged woman wearing a floral dress and pearl necklace, with neatly styled grey hair and a slightly raised eyebrow. She stands in a warm, slightly cluttered dining room holding a teacup, smiling politely but with a hint of suspicion.",
        requirements: [
          {
            requirementId: "ask_about_job",
            text: "Pregunta a qué se dedica la persona que te invitó (o tu pareja).",
          },
          {
            requirementId: "defend_answer",
            text: "Responde a un comentario crítico sobre tu trabajo, defendiendo tu elección con razones claras.",
          },
          {
            requirementId: "ask_follow_up",
            text: "Haz una pregunta de seguimiento relevante (por ejemplo, sobre horarios, responsabilidades o por qué disfrutas tu trabajo).",
          },
        ],
      },
      {
        missionId: "awkward_family_dinner_dancing_uncle",
        title: "El tío que baila en la mesa",
        sceneSummary:
          "Mientras cenan, el tío se levanta y empieza a dar un mini-espectáculo de baile y chistes malos. Tienes que decidir si te unes o lo detienes con gracia.",
        aiRole:
          "Eres el tío exagerado y afectuoso: demasiado confiado, listo para hacer una broma o un paso de baile. Mantén respuestas espontáneas, con humor físico y frases cortas, animando al alumno a reaccionar.",
        caracterName: "Uncle Benny",
        caracterPrompt:
          "A stocky, lively man in his late 50s wearing a loud Hawaiian shirt, suspenders, and comfy trousers. He has a huge grin, expressive hands, and is mid-dance beside the dining table with plates slightly askew. The atmosphere is chaotic and festive.",
        requirements: [
          {
            requirementId: "respond_to_dance",
            text: "Comenta el baile del tío: muestra sorpresa o diversión con una frase natural.",
          },
          {
            requirementId: "join_or_decline",
            text: "En inglés, decide si te unes al baile o pides que pare educadamente, dando una razón clara.",
          },
          {
            requirementId: "make_a_joke",
            text: "Haz un comentario humorístico o un cumplido que calme la situación.",
          },
        ],
      },
      {
        missionId: "awkward_family_dinner_food_taboos",
        title: "El plato prohibido",
        sceneSummary:
          "Te sirven un plato extraño que según la familia 'es tradición'. Debes manejar tus modales, tus alergias ficticias y la curiosidad exagerada de todos.",
        aiRole:
          "Eres la madre orgullosa de las recetas familiares: defensiva, emocional y muy protectora de las tradiciones culinarias. Responde con orgullo, anécdotas y una pizca de dramatismo si cuestionan su comida.",
        caracterName: "Mrs. Delgado",
        caracterPrompt:
          "A warm, energetic woman in her early 50s wearing an apron over bright clothes. She has flour on her hands and a proud smile, standing in a cozy kitchen full of steaming pots and family photos on the wall.",
        requirements: [
          {
            requirementId: "express_dietary_restriction",
            text: "Informa sobre una alergia o preferencia alimentaria y pide una alternativa con educación.",
          },
          {
            requirementId: "compliment_dish",
            text: "Di al menos una cosa positiva sobre la comida, aunque no te guste.",
          },
          {
            requirementId: "ask_recipe_question",
            text: "Pregunta cómo se prepara un ingrediente o técnica que te llamó la atención.",
          },
        ],
      },
      {
        missionId: "awkward_family_dinner_old_secrets",
        title: "Secretos del ático",
        sceneSummary:
          "Se menciona una antigua historia familiar embarazosa y todos esperan tu reacción. Tienes que mostrar tacto y quizás revelar algo tuyo para equilibrar la situación.",
        aiRole:
          "Eres el primo dramático que adora los chismes: exagerado, demandante y juguetón. Lanza preguntas provocadoras y espera respuestas sinceras o divertidas; usa un tono teatral pero no ofensivo.",
        caracterName: "Diego Marlow",
        caracterPrompt:
          "A thin, theatrical young man wearing a patterned vest and a scarf, with expressive eyes and a mischievous grin. He leans on an old trunk in a dimly lit living room filled with antique objects and nostalgia.",
        requirements: [
          {
            requirementId: "react_to_gossip",
            text: "Reacciona a la historia embarazosa: muestra sorpresa, humor o incomodidad con una frase natural.",
          },
          {
            requirementId: "share_a_small_secret",
            text: "Comparte una anécdota personal breve y apropiada para la familia (algo que muestre vulnerabilidad o humor).",
          },
          {
            requirementId: "change_topic_politely",
            text: "Si la conversación se vuelve muy incómoda, usa una frase para cambiar el tema de forma educada.",
          },
        ],
      },
      {
        missionId: "awkward_family_dinner_goodbye_mess",
        title: "Despedida, caos y promesas",
        sceneSummary:
          "La cena termina con abrazos torpes, promesas de volver a vernos y una discusión sobre quién lavará los platos. Debes cerrar la noche con cortesía y claridad.",
        aiRole:
          "Eres la anfitriona exhausta pero encantadora: agradecida, un poco dramática y deseosa de buenos modales. Insiste en la gratitud y en organizar futuras visitas, usando un tono sincero y cálido.",
        caracterName: "Anna Reed",
        caracterPrompt:
          "A cheerful, tired woman in her 40s wearing a simple dress and a cardigan, hair slightly messy from cooking. She stands by the doorway with a welcoming smile and a slightly worried glance at the sink full of dishes.",
        requirements: [
          {
            requirementId: "say_thank_you",
            text: "Agradece la invitación y menciona algo concreto que te gustó de la noche.",
          },
          {
            requirementId: "confirm_next_contact",
            text: "Propón una forma de mantener el contacto o una posible próxima reunión con detalles breves (día, actividad o condición).",
          },
          {
            requirementId: "offer_help",
            text: "Ofrece ayudar (por ejemplo, ayudar con los platos o limpiar) y acepta o rechaza la respuesta según tu rol en la historia.",
          },
        ],
      },
    ],
  },
  {
    storyId: "street_performer_mess",
    title: "Caos con el artista callejero",
    summary:
      "Un artista callejero te involucra en su acto frente a una multitud.",
    level: "B2",
    tags: ["street", "music", "fun"],
    unlockCost: 1,
    missions: [
      {
        missionId: "street_performer_mess_intro_the_drummer",
        title: "El tambor mágico",
        sceneSummary:
          "Un tamborista callejero insiste en que su tambor tiene poderes y te obliga a probarlo frente a la gente. Todo se vuelve ruidoso y divertido.",
        aiRole:
          "Eres un tamborista excéntrico y convincente que siempre actúa como si su instrumento fuera mágico. Habla con entusiasmo, exagera efectos y reta al alumno a seguir el ritmo. Mantén respuestas cortas y juguetonas, con humor y energía.",
        caracterName: "Mango Beat",
        caracterPrompt:
          "A colorful, lively street drummer wearing a patched vest, bright headband, and sunglasses. He grins widely, leaning over a worn drum decorated with stickers. The background is a crowded city square with posters and passerby watching curiously.",
        requirements: [
          {
            requirementId: "ask_about_power",
            text: "Pregunta qué tipo de 'poderes' tiene el tambor y pide una demostración.",
          },
          {
            requirementId: "follow_rhythm",
            text: "Acepta el reto y responde con una frase que siga el ritmo (por ejemplo, clap or count) para participar en la actuación.",
          },
          {
            requirementId: "express_surprise",
            text: "Muestra sorpresa o duda cuando algo extraño ocurra durante la demostración.",
          },
        ],
      },
      {
        missionId: "street_performer_mess_cat_balancer",
        title: "El equilibrista de gatos",
        sceneSummary:
          "Un artista sostiene varios gatos en equilibrio sobre su sombrero y te ofrece probar tu propia habilidad para mantener a un gato tranquilo. La gente aplaude y los gatos hacen lo inesperado.",
        aiRole:
          "Eres un equilibrista teatral, algo dramático y siempre preocupado por la reputación de tus gatos. Habla con voz pausada y teatral, corrige al alumno con paciencia y ofrece instrucciones claras y cómicas.",
        caracterName: "Felix Balanz",
        caracterPrompt:
          "A slender performer in a striped shirt and bowler hat, balancing small plush or real cats on his hat. He has a playful, exaggerated expression and stands on a small wooden box amid a curious crowd. The scene feels whimsical and slightly chaotic.",
        requirements: [
          {
            requirementId: "ask_handling_instructions",
            text: "Pregunta cómo debes sostener o calmar al gato antes de intentar el truco.",
          },
          {
            requirementId: "give_reassurance",
            text: "Di una frase corta para tranquilizar al público o al gato durante el intento.",
          },
          {
            requirementId: "react_to_mishap",
            text: "Reacciona si el gato se mueve o hace algo inesperado (sorpresa, solución rápida).",
          },
        ],
      },
      {
        missionId: "street_performer_mess_talking_hat",
        title: "El sombrero parlante",
        sceneSummary:
          "Un vendedor ambulante presenta un sombrero que ‘habla’ y te reta a mantener una conversación seria con él. El sombrero tiene opiniones fuertes sobre turistas y parquímetros.",
        aiRole:
          "Eres un sombrero parlante sarcástico y algo filosófico que cambia de humor rápido. Responde con ironía, preguntas retóricas y comentarios graciosos; empuja al alumno a usar frases completas y explicaciones.",
        caracterName: "Sir Topper",
        caracterPrompt:
          "An anthropomorphic top hat with painted eyes and a small mouth, perched on a wooden stand with a velvet cloth. The hat looks elegant but cheeky, with glints of stage lights and a bustling street market behind it.",
        requirements: [
          {
            requirementId: "ask_opinion",
            text: "Pregunta la opinión del sombrero sobre algo cotidiano (por ejemplo, 'What do you think about noisy tourists?').",
          },
          {
            requirementId: "maintain_seriousness",
            text: "Mantén una conversación seria con el sombrero por al menos dos turnos, usando frases completas.",
          },
          {
            requirementId: "challenge_answer",
            text: "Cuestiona una de las respuestas del sombrero pidiendo una explicación o ejemplo.",
          },
        ],
      },
      {
        missionId: "street_performer_mess_human_statue_negotiation",
        title: "Negocia con la estatua humana",
        sceneSummary:
          "Una estatua humana cobra vida y exige una propina a cambio de permanecer inmóvil. Te propone un trato absurdo y te mira con ojos muy expresivos.",
        aiRole:
          "Eres una estatua humana práctica y formal que usa un lenguaje educado pero con demandas ridículas. Mantén un tono serio a pesar del absurdo; ofrece opciones y espera que el alumno negocie.",
        caracterName: "Marble Morgan",
        caracterPrompt:
          "A person painted in silver with a classic statue pose, wearing a toga-like outfit and standing on a small pedestal. The expression is solemn yet slightly mischievous, with city shoppers and coins scattered at the base.",
        requirements: [
          {
            requirementId: "propose_offer",
            text: "Propón una oferta o alternativa para evitar pagar (por ejemplo, perform a task or sing).",
          },
          {
            requirementId: "negotiate_terms",
            text: "Negocia al menos una condición (time, action, price) para el trato con la estatua.",
          },
          {
            requirementId: "confirm_agreement",
            text: "Confirma el acuerdo final de forma clara y concisa.",
          },
        ],
      },
      {
        missionId: "street_performer_mess_final_band_bonkers",
        title: "La banda desquiciada",
        sceneSummary:
          "Una banda callejera loca te necesita como cantante improvisado para su gran final; el público te fija en el centro y esperan que lideres el coro.",
        aiRole:
          "Eres el líder de la banda: entusiasta, caótico y buen entrenador. Da instrucciones rápidas, ajusta la música según el alumno y anima con expresiones coloquiales. Señala errores suavemente y celebra intentos valientes.",
        caracterName: "Captain Crescendo",
        caracterPrompt:
          "A flamboyant bandleader in a sequined jacket and oversized sunglasses, holding a megaphone and standing on a small stage with mismatched instruments around. He smiles wildly as the crowd gathers and colorful confetti hangs in the air.",
        requirements: [
          {
            requirementId: "lead_chorus",
            text: "Acepta ser el cantante y lidera un coro corto (una frase repetida o una línea simple).",
          },
          {
            requirementId: "follow_feedback",
            text: "Responde a una indicación del líder sobre ritmo o volumen (por ejemplo, 'louder', 'slower') y ajusta tu línea.",
          },
          {
            requirementId: "thank_audience",
            text: "Al terminar, agradece al público con una frase apropiada y breve.",
          },
        ],
      },
    ],
  },
];
