export const STORIES_SEED = [
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
          "Eres el dueño preocupado y divertido. Habla con paciencia, da información sobre los hábitos del loro y lanza comentarios sarcásticos de vez en cuando. Mantén un tono amistoso y ligeramente exasperado.",
        caracterName: "Sam the Owner",
        caracterPrompt:
          "A friendly middle-aged person wearing a paint-splattered cardigan and glasses perched on their head. They have a warm smile, slightly rumpled hair, and stand in a colorful living room filled with bird toys. They hold a cup of tea and occasionally glance at a noisy parrot cage.",
        requirements: [
          {
            requirementId: "ask_parrot_rules",
            text: "Pregunta cuáles son las reglas para cuidar a Bertie (comida, horas, palabras prohibidas).",
          },
          {
            requirementId: "calm_parrot",
            text: "Di una frase corta para calmar al loro cuando empiece a gritar o a imitar a alguien.",
          },
          {
            requirementId: "confirm_schedule",
            text: "Confirma el horario de visitas y llamadas si surge algún problema.",
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
            requirementId: "ask_control_techniques",
            text: "Pregunta qué técnica usar para controlar a Spike durante el paseo.",
          },
          {
            requirementId: "give_command",
            text: "Dale una orden clara al perro (por ejemplo: 'sit', 'stay' o 'heel') y asegúrate de que el entrenador la apruebe.",
          },
          {
            requirementId: "handle_interruption",
            text: "Describe qué harías si Spike corre hacia una bicicleta o una paloma.",
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
            requirementId: "compliment_cat",
            text: "Haz un cumplido auténtico pero breve que no suene exagerado para ganarte al gato.",
          },
          {
            requirementId: "ask_for_permission",
            text: "Pregunta si puedes mover algún objeto que el gato está inspeccionando.",
          },
          {
            requirementId: "report_findings",
            text: "Resume (2–3 frases) lo que crees que el gato estaba investigando.",
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
            requirementId: "negotiate_meal",
            text: "Negocia una merienda que sea aceptable para ti y para Coco (ofrece alternativas).",
          },
          {
            requirementId: "ask_ingredients",
            text: "Pregunta qué ingredientes están bien y cuáles están totalmente prohibidos.",
          },
          {
            requirementId: "give_allergy_info",
            text: "Comunica si tienes alguna alergia o preferencia alimentaria que Coco deba saber.",
          },
        ],
      },
      {
        missionId: "pet_sitting_chaos_middle_of_the_night_owl",
        title: "La lechuza nocturna y la alarma",
        sceneSummary:
          "A medianoche suena una alarma y descubres a Hoot, una lechuza que trae mensajes misteriosos. Debes entender el mensaje sin asustar al mensajero emplumado.",
        aiRole:
          "Eres Hoot la lechuza mensajera: enigmático, formal y un poco teatral. Habla con frases medidas, ofrece pistas crípticas y espera que el alumno haga preguntas directas para aclararlas. Mantén un tono misterioso pero amable.",
        caracterName: "Hoot the Owl",
        caracterPrompt:
          "A dignified owl with round spectacles perched on a wooden post in a moonlit garden. He wears a tiny satchel and has an expressive face, with feathers slightly ruffled by a night breeze. The scene has soft silver light and scattered letters.",
        requirements: [
          {
            requirementId: "ask_message_details",
            text: "Pregunta qué contiene exactamente el mensaje y por qué es urgente.",
          },
          {
            requirementId: "confirm_delivery",
            text: "Confirma a quién debe entregarse el mensaje y cuándo.",
          },
          {
            requirementId: "clarify_consequences",
            text: "Pregunta qué pasaría si el mensaje no se entrega a tiempo.",
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
          "Debes convencer a un presentador que cambia de tema cada cinco segundos y adora las metáforas ridículas.",
        aiRole:
          "Eres un presentador excéntrico y carismático que habla rápido, usa metáforas extravagantes y pone a prueba la paciencia del concursante con preguntas inesperadas. Mantén un tono juguetón y ligeramente teatral.",
        caracterName: "Gideon Spark",
        caracterPrompt:
          "A flamboyant TV host wearing a colorful blazer with mismatched socks and oversized glasses. He has wild hair, an exaggerated grin, and gestures dramatically on a glittery stage. Bright studio lights and a cheering crowd in the background.",
        requirements: [
          {
            requirementId: "introduce_yourself",
            text: "Preséntate de forma clara y segura (nombre, edad aproximada y una frase sobre tu experiencia).",
          },
          {
            requirementId: "handle_rapid_questions",
            text: "Responde a al menos dos preguntas rápidas y distintas del presentador sin perder la calma.",
          },
          {
            requirementId: "use_one_metaphor",
            text: "Usa una metáfora creativa para describir por qué serías bueno en el show.",
          },
        ],
      },
      {
        missionId: "reality_show_audition_critical_puppet_judge",
        title: "El juez títere crítico",
        sceneSummary:
          "Un gran títere juez con voz chillona critica cada detalle: desde tu chiste hasta tu peinado. Tú tienes que defenderte con educación y humor.",
        aiRole:
          "Eres un juez títere muy crítico pero sorprendentemente justo; interrumpes con comentarios sarcásticos y preguntas puntuales. Mantén un tono satírico y directo, pero ofrece oportunidades para que el concursante brille.",
        caracterName: "Judge Pinch",
        caracterPrompt:
          "A large puppet judge with exaggerated features, wearing a tiny judicial robe and a comical wig. His expression alternates between stern and amused, and he sits on a small elevated bench surrounded by colorful stage props.",
        requirements: [
          {
            requirementId: "defend_a_choice",
            text: "Explica por qué tomaste una decisión concreta (por ejemplo, un outfit o un talento) usando al menos dos razones.",
          },
          {
            requirementId: "respond_to_criticism",
            text: "Responde a una crítica sarcástica del juez sin ofender y manteniendo el humor.",
          },
          {
            requirementId: "ask_for_feedback",
            text: "Pide feedback específico para mejorar en la próxima ronda.",
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
            requirementId: "sell_the_dish",
            text: "Vende el extraño plato como si fueras un publicista: usa al menos tres adjetivos sensoriales (taste, smell, texture).",
          },
          {
            requirementId: "answer_ingredient_question",
            text: "Responde qué ingrediente secreto añadiste y por qué mejora el plato.",
          },
          {
            requirementId: "handle_objection",
            text: "Responde a una objeción del chef (ej. «That sounds weird») y ofrece una alternativa.",
          },
        ],
      },
      {
        missionId: "reality_show_audition_alien_auditorium",
        title: "Audición con un alien curioso",
        sceneSummary:
          "Un ser de otro planeta evalúa tu 'humanness' con preguntas extrañas sobre costumbres y emociones. Debes demostrar empatía y explicar comportamientos humanos.",
        aiRole:
          "Eres un alien curioso y literal que hace preguntas inusuales sobre la vida humana, sin malicia pero con mucha ingenuidad. Mantén un tono inquisitivo, directo y humorístico.",
        caracterName: "Zylo-7",
        caracterPrompt:
          "A friendly extraterrestrial with iridescent skin, three small eyes, and wearing a quirky metallic suit. It tilts its head in fascination and floats slightly above the ground in a futuristic audition room with holographic panels.",
        requirements: [
          {
            requirementId: "explain_a_human_custom",
            text: "Explica una costumbre humana (por ejemplo, 'small talk' or 'celebrations') de manera clara y breve.",
          },
          {
            requirementId: "show_empathy",
            text: "Responde a una historia triste que el alien cuenta mostrando empatía y ofreciendo consuelo.",
          },
          {
            requirementId: "ask_a_clarifying_question",
            text: "Haz una pregunta de aclaración sobre algo que el alien diga para mostrar interés.",
          },
        ],
      },
      {
        missionId: "reality_show_audition_overzealous_choreographer",
        title: "Coreógrafo sobreactuado",
        sceneSummary:
          "Un coreógrafo exagerado te pide improvisar un movimiento para la cámara; quiere pasión, pero tu inglés debe convencerlo con instrucciones simples.",
        aiRole:
          "Eres un coreógrafo sobreexcitado, dramático y detallista que da instrucciones enérgicas y espera descripciones visuales. Mantén un tono entusiasta y demandante, con halagos cuando alguien lo hace bien.",
        caracterName: "Talia Vibe",
        caracterPrompt:
          "An energetic choreographer wearing bright activewear, chunky jewelry, and dramatic makeup. She poses mid-motion with a headset microphone, surrounded by mirrors and stage lights, exuding high energy and confidence.",
        requirements: [
          {
            requirementId: "describe_a_move",
            text: "Describe in English a simple dance move clearly so someone can copy it (use action verbs and sequencing).",
          },
          {
            requirementId: "accept_feedback",
            text: "Accept in English a suggestion from the choreographer and restate how you'll change the move.",
          },
          {
            requirementId: "express_confidence",
            text: "Say in English a short confident line to motivate the crew before performing.",
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
          "Encuentras a un relojero excéntrico rodeado de engranajes y relojes que marcan horas distintas; parece haber perdido la llave maestra. Debes negociar pistas antes de que un reloj empiece a sonar a las doce equivocada.",
        aiRole:
          "Eres un relojero distraído y apasionado por los mecanismos. Habla con entusiasmo, a veces te olvidas de lo que decías, das pistas enigmáticas y respondes con humor y metáforas mecánicas.",
        caracterName: "Elias Cogsworth",
        caracterPrompt:
          "A middle-aged clockmaker with wild gray hair and magnifying glasses perched on his forehead. He wears a stained apron covered in tiny gears, has ink on his fingers, and stands in a cluttered workshop filled with ticking clocks and hanging pendulums. His expression is frantic but friendly.",
        requirements: [
          {
            requirementId: "ask_for_clue",
            text: "Pide una pista concreta sobre la ubicación de la llave maestra.",
          },
          {
            requirementId: "clarify_time_conflict",
            text: "Pregunta por qué varios relojes marcan horas distintas y pide que lo explique claramente.",
          },
          {
            requirementId: "confirm_next_step",
            text: "Resume la instrucción siguiente que te da el relojero para comprobar que la entendiste.",
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
            requirementId: "negotiate_trade",
            text: "Negocia un intercambio: qué darías por un objeto que supuestamente abre una puerta.",
          },
          {
            requirementId: "solve_riddle",
            text: "Intenta resolver en voz alta un acertijo que te propone el ilusionista.",
          },
          {
            requirementId: "ask_for_guarantee",
            text: "Pide una garantía o prueba de que el objeto realmente funcionará.",
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
            requirementId: "ask_for_plain_explanation",
            text: "Pide una explicación directa y sin metáforas de la pista que canta.",
          },
          {
            requirementId: "identify_key_word",
            text: "Cita la palabra o frase clave que escuchaste en su canción.",
          },
          {
            requirementId: "link_clue_to_object",
            text: "Explica cómo esa palabra clave se relaciona con un objeto en la sala.",
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
            requirementId: "ask_about_missing_ingredient",
            text: "Pregunta cuál ingrediente falta y por qué es crucial para la receta.",
          },
          {
            requirementId: "suggest_alternative",
            text: "Propón una alternativa razonable al ingrediente faltante y explica por qué funcionaría.",
          },
          {
            requirementId: "agree_on_plan",
            text: "Confirma los pasos a seguir con el chef para recuperar o sustituir el ingrediente.",
          },
        ],
      },
      {
        missionId: "escape_room_mystery_clocktower_guardian",
        title: "El guardián de la torre",
        sceneSummary:
          "Un guardián de torre excéntrico exige tres pruebas de lógica y confianza antes de permitir subir; es severo pero tiene un sentido del humor oscuro.",
        aiRole:
          "Eres un guardián severo y enigmático que valora la lógica y la honestidad. Habla con formalidad, plantea preguntas retadoras y evalúa las respuestas; ofrece pistas adicionales solo si se demuestra razonamiento correcto.",
        caracterName: "Sir Reginald Thorn",
        caracterPrompt:
          "An imposing tower guardian in a worn leather coat and a brass helmet, holding a large key and standing at the base of a spiral staircase. His expression is stern but with a glint of ironic amusement, and the tower interior is dim and stone-lined.",
        requirements: [
          {
            requirementId: "solve_logic_test",
            text: "Responde a una prueba lógica (explica tu razonamiento paso a paso).",
          },
          {
            requirementId: "prove_honesty",
            text: "Da una breve afirmación honesta sobre lo que has hecho hasta ahora en la sala (1–2 frases).",
          },
          {
            requirementId: "ask_for_permission_to_proceed",
            text: "Pide permiso para subir la escalera y justifica brevemente por qué deberías hacerlo.",
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
            requirementId: "introduce_yourself",
            text: "Preséntate diciendo tu nombre y por qué estás ahí (una frase cada uno).",
          },
          {
            requirementId: "ask_for_permission",
            text: "Pide permiso para tocar o mover algo en el backstage.",
          },
          {
            requirementId: "confirm_next_step",
            text: "Pregunta cuál es el siguiente paso que debes hacer para ayudar.",
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
            requirementId: "identify_problem",
            text: "Pregunta qué vestido falta y pide detalles (color, talla, cuándo lo vieron).",
          },
          {
            requirementId: "mediate_conflict",
            text: "Sugiere una solución práctica para encontrar el vestido sin tomar partido.",
          },
          {
            requirementId: "set_deadline",
            text: 'Propón un plazo claro para resolver el problema (por ejemplo: "in 10 minutes").',
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
            requirementId: "ask_reason",
            text: "Pregunta por qué no quiere llevar el atuendo.",
          },
          {
            requirementId: "offer_alternative",
            text: "Ofrece al menos una alternativa razonable o una condición para que se quede.",
          },
          {
            requirementId: "confirm_agreement",
            text: "Consigue una confirmación clara de la modelo sobre lo que hará (quedarse, cambiar, o irse).",
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
            requirementId: "describe_problem",
            text: "Explica exactamente qué parte del maquillaje falta y cuál es el estilo deseado (por ejemplo: smoky eye, natural).",
          },
          {
            requirementId: "delegate_tasks",
            text: "Asigna dos tareas concretas a otros miembros del equipo (por ejemplo: prepare foundation, hold mirror).",
          },
          {
            requirementId: "confirm_time_needed",
            text: "Pregunta y confirma cuánto tiempo necesitas para completar el maquillaje.",
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
            text: "Describe la emergencia con detalle (what happened, who is affected).",
          },
          {
            requirementId: "propose_solution",
            text: "Propón al menos una solución inmediata y viable (e.g., replace shoe, walk barefoot with cover).",
          },
          {
            requirementId: "request_clearance",
            text: "Pide permiso o confirmación para implementar la solución antes de que continúe el show.",
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
            requirementId: "ask_about_collection",
            text: "Pregunta qué tiene en su colección y cómo consiguió el billete más extraño.",
          },
          {
            requirementId: "negotiate_trade",
            text: "Propón un intercambio: ofrece algo (realista) a cambio de un billete y explica por qué tu oferta es razonable.",
          },
          {
            requirementId: "react_to_story",
            text: "Reacciona a una historia sorprendente que él cuente, usando una expresión natural y una pregunta de seguimiento.",
          },
        ],
      },
      {
        missionId: "mystery_train_ride_singing_conductor",
        title: "El revisor cantante",
        sceneSummary:
          "Un revisor que en vez de comprobar billetes canta ópera y corrige las letras según le place. Quiere que le ayudes a elegir la próxima estrofa.",
        aiRole:
          "Eres un revisor apasionado por la ópera y la dramatización. Habla con grandilocuencia, corrige con humor y espera que el alumno participe creativamente pero con claridad.",
        caracterName: "Conductor Aria",
        caracterPrompt:
          "A dramatic middle-aged train conductor wearing a vintage uniform with a bright red sash. He has a booming expression, twirls a ticket puncher like a baton, and stands in a dimly lit carriage as if on stage.",
        requirements: [
          {
            requirementId: "choose_verse",
            text: "Sugiere qué estrofa debería cantar a continuación, usando lenguaje descriptivo y claro.",
          },
          {
            requirementId: "correct_lyrics",
            text: "Corrige suavemente una línea que él canta mal, dando la forma correcta y una breve explicación.",
          },
          {
            requirementId: "give_feedback",
            text: "Dale feedback sobre su actuación, incluyendo una frase positiva y una sugerencia concreta.",
          },
        ],
      },
      {
        missionId: "mystery_train_ride_suspicious_chef",
        title: "El chef sospechoso",
        sceneSummary:
          "En el vagón restaurante hay un chef que ofrece platos extraños con nombres aún más raros. Insiste en que pruebes su especialidad experimental.",
        aiRole:
          "Eres un chef teatral y un poco misterioso. Describe sabores y técnicas de forma vívida, provoca al estudiante a describir sus gustos y responde con picardía si el alumno duda.",
        caracterName: "Chef Basil",
        caracterPrompt:
          "A flamboyant chef wearing a tall white hat and a patterned apron splattered with colorful sauces. He has animated gestures, bright eyes, and stands by a small portable stove on the train, offering a steaming dish.",
        requirements: [
          {
            requirementId: "ask_ingredients",
            text: "Pregúntale qué ingredientes contiene su especialidad y si hay alérgenos.",
          },
          {
            requirementId: "express_preference",
            text: "Di si te gustaría probarlo o no, justificando tu elección con motivos concretos.",
          },
          {
            requirementId: "suggest_alternative",
            text: "Propón una alternativa o modificación del plato que te haría probarlo.",
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
            requirementId: "summarize_passage",
            text: "Resume el significado principal de un breve pasaje que te muestre (1–2 frases).",
          },
          {
            requirementId: "challenge_theory",
            text: "Cuestiona una de sus conclusiones conspirativas con al menos una razón lógica.",
          },
          {
            requirementId: "propose_hypothesis",
            text: "Propón una hipótesis alternativa y cómo podríais comprobarla durante el viaje.",
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
            requirementId: "solve_riddle",
            text: "Responde a un acertijo sencillo que él te proponga (frase corta con la solución).",
          },
          {
            requirementId: "ask_for_clue",
            text: "Pide una pista adicional usando una pregunta educada y directa.",
          },
          {
            requirementId: "negotiate_reward",
            text: "Negocia una recompensa por resolver su reto, proponiendo una compensación razonable.",
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
          "En una plaza bulliciosa un vendedor te dice que vio tu teléfono... a cambio de ayudarte a encontrar su sombrero perdido. Todo es un poco sospechoso y muy teatral.",
        aiRole:
          "Eres un vendedor callejero excéntrico y teatral que afirma saberlo todo sobre objetos perdidos. Habla con dramatismo, usa metáforas y provoca al alumno para que haga preguntas concretas. Mantén humor y algo de misterio.",
        caracterName: "Milo the Magician",
        caracterPrompt:
          "A middle-aged street performer wearing a colorful patchwork coat, a slightly crooked top hat, and fingerless gloves. He has a mischievous grin, twinkling eyes, and stands in a busy square with juggling props scattered around. He gestures dramatically as if telling a tall tale.",
        requirements: [
          {
            requirementId: "ask_where_seen",
            text: "Pregúntale dónde y cuándo vio el teléfono.",
          },
          {
            requirementId: "confirm_description",
            text: "Describe las características de tu teléfono y pide que confirme si es la misma unidad.",
          },
          {
            requirementId: "negotiate_help",
            text: "Negocia por su ayuda (ofrece algo a cambio o pide una pista razonable).",
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
            requirementId: "ask_timeline",
            text: "Pregunta sobre la línea temporal (¿a qué hora lo vieron?)",
          },
          {
            requirementId: "ask_who_was_there",
            text: "Pregunta quién más estaba en la cafetería y solicita descripciones breves.",
          },
          {
            requirementId: "ask_next_step",
            text: "Pide una acción concreta que seguir (¿podemos buscar en la cámara o revisar la mesa?).",
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
            requirementId: "ask_dog_distraction",
            text: "Pregunta si los perros distrajeron a la persona que dejó el teléfono.",
          },
          {
            requirementId: "clarify_direction",
            text: "Pregunta en qué dirección se fue la persona con más detalle.",
          },
          {
            requirementId: "ask_for_contact",
            text: "Pide una forma de contactar al paseador si aparece nueva información.",
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
            requirementId: "challenge_theory",
            text: "Cuestiona una de sus teorías y ofrece una alternativa plausible.",
          },
          {
            requirementId: "ask_evidence",
            text: "Pide la evidencia que respalde su afirmación (¿what proof do you have?).",
          },
          {
            requirementId: "summarize_next_steps",
            text: "Resume los pasos siguientes acordados con el profesor.",
          },
        ],
      },
      {
        missionId: "lost_phone_adventure_midnight_taxi_singer",
        title: "El taxista cantante de medianoche",
        sceneSummary:
          "Un taxista que también canta ópera te recoge y jura que recogió un teléfono en su coche. Su dramatismo convierte la conversación en un mini-concierto.",
        aiRole:
          "Eres un taxista apasionado por la música que dramatiza cada frase. Usa frases poéticas, repite detalles importantes para enfatizar y responde con calidez; permite que el alumno dirija la pregunta hacia la evidencia y la logística.",
        caracterName: "Marco the Cabby",
        caracterPrompt:
          "A middle-aged taxi driver wearing a leather jacket and a faded cap, singing into a steering-wheel-mounted microphone. He has a booming voice, animated gestures, and the interior of the car is lit by city lights and a hanging air-freshener.",
        requirements: [
          {
            requirementId: "confirm_pickup_time",
            text: "Pregunta a qué hora ocurrió el trayecto y cuánto tiempo estuvo el teléfono en el coche.",
          },
          {
            requirementId: "ask_for_id",
            text: "Solicita alguna prueba o detalle que confirme que su coche tenía tu teléfono (por ejemplo, color del funda o pantalla encendida).",
          },
          {
            requirementId: "arrange_meeting",
            text: "Organiza un lugar y hora para revisar el coche o recuperar el teléfono.",
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
            requirementId: "ask_why_cooking",
            text: "Pregunta por qué está usando esos ingredientes raros.",
          },
          {
            requirementId: "express_concern",
            text: "Expresa preocupación o sorpresa por la seguridad/rareza de la comida.",
          },
          {
            requirementId: "ask_for_recipe",
            text: "Pide la receta o los pasos para preparar ese plato.",
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
            requirementId: "suggest_solution",
            text: "Sugiere una solución práctica si el 'fantasma' está causando problemas (ruido, manchas, etc.).",
          },
          {
            requirementId: "express_doubt",
            text: "Expresa escepticismo o duda sobre la existencia del fantasma de forma educada.",
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
