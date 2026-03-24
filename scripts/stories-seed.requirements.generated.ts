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
            requirementId: "conversation_identificar_palabras_gatillo",
            text: "Pregunta cuáles son las palabras o sonidos que hacen que Bertie se altere para poder evitarlos.",
          },
          {
            requirementId: "conversation_ganar_confianza_con_frase_clave",
            text: "Pide una frase exacta en inglés que Bertie asocie con algo positivo para empezar con buen pie.",
          },
          {
            requirementId: "conversation_reaccionar_a_imitacion_incomoda",
            text: "Muestra cómo responderás cuando Bertie te imite de forma burlona sin perder la calma.",
          },
          {
            requirementId: "conversation_pedir_demostracion_manejo",
            text: "Solicita que el dueño te muestre cómo acercar la mano al loro sin provocar picotazos.",
          },
          {
            requirementId: "conversation_acordar_limites_ruido",
            text: "Negocia un límite de volumen aceptable y qué hacer si los vecinos se quejan.",
          },
          {
            requirementId: "conversation_verificar_senal_para_pausa",
            text: "Pregunta si existe una señal o gesto para indicar a Bertie que pare de hablar.",
          },
          {
            requirementId: "conversation_confirmar_zonas_prohibidas",
            text: "Confirma qué habitaciones u objetos están fuera de límites para evitar accidentes.",
          },
          {
            requirementId: "conversation_estrategia_recompensas",
            text: "Propón un plan de recompensas específicas cuando Bertie coopere y pide aprobación.",
          },
          {
            requirementId: "conversation_pedir_lista_temas_seguro",
            text: "Pide una lista de temas de conversación seguros que mantengan a Bertie tranquilo.",
          },
          {
            requirementId: "conversation_preguntar_sobre_senales_estres",
            text: "Pregunta cómo reconocer signos tempranos de estrés en Bertie y cómo intervenir.",
          },
          {
            requirementId: "conversation_reaccion_a_consejo_absurdo",
            text: "Responde con tacto cuando Bertie dé un consejo absurdo y contrasta con el dueño.",
          },
          {
            requirementId: "conversation_validar_preocupacion_dueno",
            text: "Expresa empatía por la preocupación del dueño y explica tu plan para reducir riesgos.",
          },
          {
            requirementId: "conversation_clarificar_horario_comidas_snacks",
            text: "Aclara el horario exacto de comida y cuántas golosinas son permitidas por día.",
          },
          {
            requirementId: "conversation_pedir_lista_emergencias",
            text: "Solicita los contactos de emergencia y el protocolo si Bertie se lastima o escapa.",
          },
          {
            requirementId: "conversation_probar_saludo_inicial",
            text: "Ensaya en voz alta el saludo preferido de Bertie y pide retroalimentación del dueño.",
          },
          {
            requirementId: "conversation_acordar_palabras_prohibidas",
            text: "Confirma expresiones que no debes decir frente a Bertie para evitar malos hábitos.",
          },
          {
            requirementId: "conversation_preguntar_sobre_senales_mano",
            text: "Pregunta si Bertie reconoce señales con la mano para posarse o guardar silencio.",
          },
          {
            requirementId: "conversation_reenfocar_cuando_interrumpe",
            text: "Explica cómo vas a retomar el tema cuando Bertie interrumpa con imitaciones.",
          },
          {
            requirementId: "conversation_verificar_trucos_seguro",
            text: "Pregunta qué trucos simples puedes practicar sin estresar al loro.",
          },
          {
            requirementId: "conversation_confirmar_puerta_jaula",
            text: "Confirma cómo cerrar y asegurar la puerta de la jaula y qué revisar dos veces.",
          },
          {
            requirementId: "conversation_estrategia_para_silbidos",
            text: "Acordar qué hacer si Bertie empieza a silbar a todo volumen durante una llamada.",
          },
          {
            requirementId: "conversation_reaccion_ante_insultos",
            text: "Describe cómo responderás si Bertie suelta insultos imitados sin reforzarlos.",
          },
          {
            requirementId: "conversation_pedir_rutina_enriquecimiento",
            text: "Pide la rutina de juguetes y rotación de forrajeo para mantenerlo ocupado.",
          },
          {
            requirementId: "conversation_confirmar_alergias_y_evitar",
            text: "Pregunta por alergias o alimentos peligrosos para Bertie que debas evitar estrictamente.",
          },
          {
            requirementId: "conversation_establecer_palabra_segura",
            text: "Propón una palabra segura acordada con el dueño para pausar la sesión si todo se descontrola.",
          },
          {
            requirementId: "english_usar_collocation_win_his_trust",
            text: "Incluye la collocation en inglés 'win his trust' al explicar tu plan para ganarte a Bertie.",
          },
          {
            requirementId: "english_usar_vocab_mimic",
            text: "Usa la palabra 'mimic' en inglés para describir cómo Bertie imita voces.",
          },
          {
            requirementId: "english_usar_phrasal_calm_down",
            text: "Emplea el phrasal verb 'calm down' al proponer cómo bajar el nivel de agitación de Bertie.",
          },
          {
            requirementId: "english_usar_idiom_on_your_best_behavior",
            text: "Integra el idiom 'on your best behavior' para definir la expectativa durante tu visita.",
          },
          {
            requirementId: "english_usar_collocation_set_boundaries",
            text: "Usa la collocation 'set boundaries' para hablar de límites claros con el loro.",
          },
          {
            requirementId: "english_usar_phrasal_act_up",
            text: "Incluye el phrasal verb 'act up' para referirte a cuando Bertie se porta mal.",
          },
          {
            requirementId: "english_usar_marker_by_the_way",
            text: "Introduce el marcador discursivo 'By the way,' para cambiar de tema con naturalidad.",
          },
          {
            requirementId: "english_usar_vocab_perch",
            text: "Usa la palabra 'perch' en inglés para referirte al posadero preferido de Bertie.",
          },
          {
            requirementId: "english_usar_phrasal_tune_out",
            text: "Emplea 'tune out' para describir cuando Bertie deja de prestar atención.",
          },
          {
            requirementId: "english_usar_idiom_cut_it_out",
            text: "Utiliza el idiom 'cut it out' en una petición firme pero amable para que Bertie pare.",
          },
          {
            requirementId: "english_usar_collocation_soothing_tone",
            text: "Incluye la collocation 'a soothing tone' al detallar cómo le hablarás al loro.",
          },
          {
            requirementId: "english_usar_phrasal_run_out_of",
            text: "Emplea 'run out of' para hablar de qué harás si se acaban las golosinas.",
          },
          {
            requirementId: "english_usar_vocab_squawk",
            text: "Usa la palabra 'squawk' para referirte a los gritos de Bertie.",
          },
          {
            requirementId: "english_usar_marker_to_be_honest",
            text: "Comienza una aclaración con 'To be honest,' para suavizar una opinión sincera.",
          },
          {
            requirementId: "english_usar_phrasal_play_along",
            text: "Incluye 'play along' para explicar cuándo seguirás la broma de Bertie y cuándo no.",
          },
          {
            requirementId: "english_usar_idiom_backfire",
            text: "Usa 'backfire' como verbo para advertir que cierta estrategia podría salir mal.",
          },
          {
            requirementId: "english_usar_collocation_noise_complaint",
            text: "Incluye la collocation 'noise complaint' al hablar de los vecinos.",
          },
          {
            requirementId: "english_usar_phrasal_keep_it_down",
            text: "Usa el phrasal verb 'keep it down' en una petición cortés relacionada con el volumen.",
          },
          {
            requirementId: "english_usar_idiom_rule_of_thumb",
            text: "Integra el idiom 'rule of thumb' para dar una pauta general sobre recompensas.",
          },
          {
            requirementId: "english_usar_collocation_trigger_word",
            text: "Usa la collocation 'trigger word' al preguntar por palabras que lo alteran.",
          },
          {
            requirementId: "english_usar_phrasal_back_down",
            text: "Emplea 'back down' para describir cómo te retirarás si Bertie se pone agresivo.",
          },
          {
            requirementId: "english_usar_marker_for_the_record",
            text: "Añade 'For the record,' antes de una aclaración importante sobre seguridad.",
          },
          {
            requirementId: "english_usar_vocab_latch",
            text: "Usa la palabra 'latch' para describir el mecanismo de cierre de la jaula.",
          },
          {
            requirementId: "english_usar_phrasal_set_off",
            text: "Incluye 'set off' para hablar de sonidos que disparan los gritos de Bertie.",
          },
          {
            requirementId: "english_usar_idiom_in_the_long_run",
            text: "Emplea el idiom 'in the long run' para justificar una estrategia paciente.",
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
            requirementId: "conversation_pedir_demostracion_giro",
            text: "Pide a Coach Tanya que te muestre cómo girar a Spike suavemente cuando se distrae sin tensar la correa.",
          },
          {
            requirementId: "conversation_confirmar_agarre_correa",
            text: "Confirma con Coach Tanya si tu forma de agarrar la correa es segura y eficiente para un perro que tira.",
          },
          {
            requirementId: "conversation_sugerir_ruta_menos_brillos",
            text: "Propón una ruta con menos escaparates brillantes y pregunta si es una buena estrategia para reducir distracciones.",
          },
          {
            requirementId: "conversation_pedir_permiso_premios",
            text: "Pide permiso para usar premios frecuentes cuando Spike haga contacto visual contigo en lugar de mirar lo que brilla.",
          },
          {
            requirementId: "conversation_preguntar_distancia_segura",
            text: "Pregunta cuál es la distancia segura que debes mantener respecto a patinetes y bicicletas durante el paseo.",
          },
          {
            requirementId: "conversation_validar_senal_mano",
            text: "Verifica si la señal de mano que usas para 'heel' es clara y pide corrección si hace falta.",
          },
          {
            requirementId: "conversation_reconocer_disparadores",
            text: "Identifica en voz alta los disparadores de Spike en la calle y acuerda una forma de prevenir el tirón antes de que ocurra.",
          },
          {
            requirementId: "conversation_pedir_plan_emergencia",
            text: "Solicita un plan de emergencia por si Spike se suelta o corre hacia el tráfico.",
          },
          {
            requirementId: "conversation_manejar_resbalon",
            text: "Describe cómo ajustarías tu paso y la correa si el suelo está resbaladizo y pide feedback inmediato.",
          },
          {
            requirementId: "conversation_establecer_objetivo_calmado",
            text: "Acordar con Coach Tanya un objetivo de caminar con la correa floja y explicar cómo medirás el progreso durante el paseo.",
          },
          {
            requirementId: "conversation_pedir_repeticion_paso_a_paso",
            text: "Pide una repetición paso a paso de cómo redirigir a Spike cuando fija la mirada en algo brillante.",
          },
          {
            requirementId: "conversation_ensayar_parar_y_seguir",
            text: "Propón practicar paradas breves y reanudaciones para que Spike controle el impulso y pide evaluación.",
          },
          {
            requirementId: "conversation_preguntar_refuerzo_positivo",
            text: "Pregunta con qué frecuencia debes reforzar positivamente a Spike cuando ignora una distracción.",
          },
          {
            requirementId: "conversation_expresar_preocupacion_hombro",
            text: "Expresa una preocupación por tu hombro al manejar tirones y pide una técnica de protección corporal.",
          },
          {
            requirementId: "conversation_negociar_longitud_correa",
            text: "Negocia con Coach Tanya si conviene cambiar a una correa más corta en zonas concurridas.",
          },
          {
            requirementId: "conversation_validar_tono_voz",
            text: "Consulta si tu tono de voz al dar la orden es adecuado para calmar a Spike en plena excitación.",
          },
          {
            requirementId: "conversation_pedir_cambio_ritmo",
            text: "Pide permiso para ajustar el ritmo de caminata y explica cómo eso ayuda a mantener la atención del perro.",
          },
          {
            requirementId: "conversation_anticipar_cruce_calle",
            text: "Anticípate a un cruce de calle y acuerda una secuencia clara de señales antes de cruzar.",
          },
          {
            requirementId: "conversation_pedir_correccion_contacto_visual",
            text: "Solicita corrección si tu forma de pedir contacto visual a Spike no funciona en una esquina con mucho brillo.",
          },
          {
            requirementId: "conversation_ofrecer_reformulacion_objetivo",
            text: "Si Spike falla, ofrece reformular el objetivo en pasos más pequeños y busca aprobación del entrenador.",
          },
          {
            requirementId: "conversation_mostrar_empatia_perro",
            text: "Muestra empatía por la frustración de Spike y explica cómo mantendrás la calma para no escalar la situación.",
          },
          {
            requirementId: "conversation_marcar_limite_tiron",
            text: "Establece un límite claro: detendrás el avance si Spike tira, e informa a Coach Tanya cómo lo aplicarás.",
          },
          {
            requirementId: "conversation_pedir_feedback_microexitos",
            text: "Pide a Coach Tanya que confirme si celebras los microéxitos en el momento adecuado.",
          },
          {
            requirementId: "conversation_discrepar_amablemente_ruta",
            text: "Discrepa amablemente si te parece que una calle es demasiado estimulante y argumenta tu alternativa.",
          },
          {
            requirementId: "conversation_ofrecer_disculpa_manejo_tarde",
            text: "Ofrece una disculpa breve si reaccionaste tarde ante un tirón y explica cómo lo corregirás en el siguiente intento.",
          },
          {
            requirementId: "english_usar_loose_leash_walking",
            text: "Usa en inglés la expresión 'loose-leash walking' al explicar tu objetivo durante el paseo.",
          },
          {
            requirementId: "english_usar_redirect_his_focus",
            text: "Incluye la colocación 'redirect his focus' para describir cómo desviarás la atención de Spike.",
          },
          {
            requirementId: "english_phrasal_rein_in",
            text: "Usa el phrasal verb 'rein in' para explicar cómo controlarás su impulso al ver algo brillante.",
          },
          {
            requirementId: "english_usar_positive_reinforcement",
            text: "Menciona 'positive reinforcement' para justificar el uso de premios en situaciones difíciles.",
          },
          {
            requirementId: "english_idiom_on_a_short_leash",
            text: "Emplea el idiom 'on a short leash' al hablar de tramos concurridos.",
          },
          {
            requirementId: "english_phrasal_calm_down",
            text: "Usa 'calm down' para indicar cómo quieres que Spike reduzca su excitación.",
          },
          {
            requirementId: "english_usar_impulse_control",
            text: "Incluye 'impulse control' al describir la habilidad que necesitas trabajar con Spike.",
          },
          {
            requirementId: "english_phrasal_hold_on",
            text: "Usa 'hold on' al narrar cómo mantendrás la correa firme ante un tirón inesperado.",
          },
          {
            requirementId: "english_idiom_in_the_blink_of_an_eye",
            text: "Emplea 'in the blink of an eye' para señalar lo rápido que Spike cambia de dirección.",
          },
          {
            requirementId: "english_usar_high_visibility_leash",
            text: "Menciona 'high-visibility leash' al solicitar cambiar de equipo por seguridad.",
          },
          {
            requirementId: "english_phrasal_veer_off",
            text: "Usa 'veer off' para describir cómo Spike se desvía hacia un reflejo en una vitrina.",
          },
          {
            requirementId: "english_usar_threshold_for_distractions",
            text: "Incluye 'threshold for distractions' al hablar del límite de tolerancia de Spike.",
          },
          {
            requirementId: "english_phrasal_keep_up",
            text: "Emplea 'keep up' para explicar tu ritmo en relación con Spike sin permitir tirones.",
          },
          {
            requirementId: "english_idiom_barking_up_the_wrong_tree",
            text: "Usa 'barking up the wrong tree' para rechazar una estrategia que no funciona con Spike.",
          },
          {
            requirementId: "english_phrasal_nip_it_in_the_bud",
            text: "Incluye 'nip it in the bud' para describir intervenir antes de que empiece el tirón.",
          },
          {
            requirementId: "english_usar_reward_rate",
            text: "Menciona 'reward rate' al negociar cada cuánto premiarás la atención correcta.",
          },
          {
            requirementId: "english_phrasal_let_go",
            text: "Usa 'let go' para aclarar que nunca soltarás la correa aunque Spike tire.",
          },
          {
            requirementId: "english_idiom_keep_your_cool",
            text: "Emplea 'keep your cool' para explicar cómo manejarás tu propio estrés en una esquina concurrida.",
          },
          {
            requirementId: "english_usar_handler_posture",
            text: "Incluye 'handler posture' al pedir retroalimentación sobre tu posición corporal.",
          },
          {
            requirementId: "english_phrasal_bolt_towards",
            text: "Usa 'bolt towards' para describir el impulso de Spike hacia algo que brilla.",
          },
          {
            requirementId: "english_idiom_like_a_kid_in_a_candy_store",
            text: "Emplea 'like a kid in a candy store' para ilustrar la emoción de Spike frente a luces y reflejos.",
          },
          {
            requirementId: "english_phrasal_head_back",
            text: "Usa 'head back' para proponer regresar por un tramo más tranquilo cuando se acumulan distracciones.",
          },
          {
            requirementId: "english_usar_de_escalate",
            text: "Incluye 'de-escalate' al detallar cómo bajarás la intensidad cuando Spike se acelera.",
          },
          {
            requirementId: "english_phrasal_zero_in_on",
            text: "Usa 'zero in on' para explicar cuando Spike fija la mirada en un objeto brillante.",
          },
          {
            requirementId: "english_idiom_the_last_straw",
            text: "Emplea 'the last straw' para marcar el límite que te obliga a parar y resetear el paseo.",
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
            text: "Haz un cumplido breve y creíble sobre el collar con joya de Madame Whiskers para suavizar su actitud sin sonar adulador.",
          },
          {
            requirementId: "conversation_permiso_mover_objeto_en_inspeccion",
            text: "Pide permiso explícito para desplazar ligeramente un libro o adorno que ella esté inspeccionando, explicando por qué te ayudaría.",
          },
          {
            requirementId: "conversation_hipotesis_breve_sobre_caso",
            text: "Propón una hipótesis corta sobre lo que ella está investigando y solicita su veredicto.",
          },
          {
            requirementId: "conversation_tratamiento_formal_titulo",
            text: "Pregunta cómo prefiere ser tratada en la conversación y comprométete a usar ese título.",
          },
          {
            requirementId: "conversation_oferta_cooperacion_condicionada",
            text: "Ofrece cooperar bajo una condición razonable y verifica si le parece aceptable.",
          },
          {
            requirementId: "conversation_pregunta_sospechoso_principal",
            text: "Pregunta directamente quién es su sospechoso principal y por qué.",
          },
          {
            requirementId: "conversation_promesa_discrecion",
            text: "Promete discreción sobre el caso y pide que confirme si confía en ti.",
          },
          {
            requirementId: "conversation_aclarar_pista_aroma_lavanda",
            text: "Pide aclaración sobre una pista relacionada con el olor a lavanda y cómo afecta la línea de investigación.",
          },
          {
            requirementId: "conversation_negociar_pausa_breve",
            text: "Negocia una pausa breve durante la cual ella te permita organizar el material sin perder el hilo del caso.",
          },
          {
            requirementId: "conversation_limite_seguridad_saltos_altos",
            text: "Establece un límite amable sobre trepar a lugares peligrosos y ofrece una alternativa segura.",
          },
          {
            requirementId: "conversation_empatia_frustracion_humana",
            text: "Expresa empatía por su frustración con los humanos y valida su estándar de precisión.",
          },
          {
            requirementId: "conversation_reglas_casa_briefing",
            text: "Solicita un resumen de las reglas de la casa que afectan la investigación y repítelas para confirmar comprensión.",
          },
          {
            requirementId: "conversation_plan_busqueda_estancias",
            text: "Propón un plan de búsqueda por estancias con un orden lógico y pide su aprobación.",
          },
          {
            requirementId: "conversation_tono_de_voz_aceptable",
            text: "Pregunta si tu tono y volumen actuales son aceptables y ajusta según su respuesta.",
          },
          {
            requirementId: "conversation_reaccion_sarcasmo_agradecida",
            text: "Responde con calma a un comentario sarcástico y convierte la crítica en una acción concreta.",
          },
          {
            requirementId: "conversation_pedir_examinar_huella_patas",
            text: "Pide permiso para examinar posibles huellas de patas en una superficie polvorienta y explica cómo las documentarás.",
          },
          {
            requirementId: "conversation_solicitar_tomar_notas_en_voz_alta",
            text: "Pregunta si puedes tomar notas en voz alta y ofrece una versión más discreta si lo prefiere.",
          },
          {
            requirementId: "conversation_parafrasear_acusacion",
            text: "Parafrasea su última sospecha para confirmar que la entendiste correctamente antes de actuar.",
          },
          {
            requirementId: "conversation_defensa_educada_insinuacion",
            text: "Defiéndete con cortesía ante una insinuación injusta y aporta un dato que te exculpe.",
          },
          {
            requirementId: "conversation_persuadir_revision_cocina",
            text: "Convence a Madame Whiskers de permitirte revisar la cocina pese a su escepticismo, argumentando utilidad.",
          },
          {
            requirementId: "conversation_ofrecer_herramienta_linterna",
            text: "Ofrece traer una linterna u otra herramienta y pregunta si encaja con su método de trabajo.",
          },
          {
            requirementId: "conversation_prueba_confianza_con_golosina",
            text: "Propón una pequeña prueba de confianza con una golosina y pide su señal de consentimiento.",
          },
          {
            requirementId: "conversation_informar_pista_hallada_breve",
            text: "Informa de una pista hallada en dos frases y solicita instrucciones inmediatas.",
          },
          {
            requirementId: "conversation_linea_tiempo_alibi_gato",
            text: "Pregunta por su línea de tiempo desde el amanecer para descartar malentendidos.",
          },
          {
            requirementId: "conversation_pedir_pausa_durante_ruido_aspiradora",
            text: "Solicita posponer una parte de la inspección durante el ruido de la aspiradora y acuerda retomar después.",
          },
          {
            requirementId: "english_look_into_phrasal",
            text: "Usa el phrasal verb look into para explicar qué parte del misterio quieres investigar primero.",
          },
          {
            requirementId: "english_rule_out_phrasal",
            text: "Emplea rule out para descartar una pista que te parece débil.",
          },
          {
            requirementId: "english_sniff_out_idiom",
            text: "Usa la expresión sniff out para elogiar la capacidad olfativa detectivesca de Madame Whiskers.",
          },
          {
            requirementId: "english_red_herring_vocab",
            text: "Incluye el término red herring para sugerir que una pista es una distracción.",
          },
          {
            requirementId: "english_corroborate_advanced",
            text: "Utiliza corroborate para pedir evidencia que respalde una sospecha.",
          },
          {
            requirementId: "english_cross_examine_collocation",
            text: "Emplea la collocation cross-examine para proponer un interrogatorio minucioso a un sospechoso humano.",
          },
          {
            requirementId: "english_plausible_motive",
            text: "Usa plausible y motive en una misma frase para evaluar la lógica del caso.",
          },
          {
            requirementId: "english_airtight_case_collocation",
            text: "Incluye la collocation airtight case al hablar del objetivo final de la investigación.",
          },
          {
            requirementId: "english_come_across_phrasal",
            text: "Usa come across para describir una pista que encontraste por casualidad.",
          },
          {
            requirementId: "english_point_out_phrasal",
            text: "Emplea point out para señalar un detalle que los demás pasaron por alto.",
          },
          {
            requirementId: "english_cut_to_the_chase_idiom",
            text: "Incluye el idiom cut to the chase para acelerar una decisión con el gato.",
          },
          {
            requirementId: "english_by_the_book_idiom",
            text: "Usa la expresión by the book para prometer un procedimiento riguroso.",
          },
          {
            requirementId: "english_inconclusive_evidence",
            text: "Emplea inconclusive evidence para describir pruebas que no bastan.",
          },
          {
            requirementId: "english_tamper_with_collocation",
            text: "Usa tamper with para advertir que alguien alteró una escena o un objeto.",
          },
          {
            requirementId: "english_narrow_down_phrasal",
            text: "Incluye narrow down para reducir la lista de sospechosos.",
          },
          {
            requirementId: "english_pick_up_on_phrasal",
            text: "Usa pick up on para mencionar una señal sutil del lenguaje corporal del gato.",
          },
          {
            requirementId: "english_the_elephant_in_the_room_idiom",
            text: "Emplea el idiom the elephant in the room para abordar una verdad incómoda del caso.",
          },
          {
            requirementId: "english_misdemeanor_vs_crime_vocab",
            text: "Contrasta misdemeanor con crime para clasificar la gravedad de la travesura felina.",
          },
          {
            requirementId: "english_make_up_for_phrasal",
            text: "Usa make up for para compensar un error que cometiste durante la investigación.",
          },
          {
            requirementId: "english_discretion_is_key_collocation",
            text: "Incluye discretion is key para subrayar la necesidad de sigilo.",
          },
          {
            requirementId: "english_not_my_cup_of_teaidom",
            text: "Usa not my cup of tea para rechazar una táctica que el gato sugiere pero no te convence.",
          },
          {
            requirementId: "english_keep_an_eye_on_phrasal",
            text: "Emplea keep an eye on para prometer vigilancia constante sobre una puerta o pasillo.",
          },
          {
            requirementId: "english_under_your_nose_idiom",
            text: "Incluye under your nose para insinuar que la pista estaba justo frente a ambos.",
          },
          {
            requirementId: "english_ostentatious_demeanor_vocab",
            text: "Usa ostentatious y demeanor para describir el porte aristocrático de Madame Whiskers.",
          },
          {
            requirementId: "english_figure_out_phrasal",
            text: "Emplea figure out para explicar cómo resolverás una contradicción en las pistas.",
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
            text: "Negocia en inglés una merienda intermedia que satisfaga tus gustos y la obsesión saludable de Coco, logrando un acuerdo claro.",
          },
          {
            requirementId: "conversation_pregunta_permitidos_prohibidos",
            text: "Pregunta en inglés cuáles ingredientes de la despensa aprueba Coco y cuáles prohíbe rotundamente, pidiendo ejemplos concretos.",
          },
          {
            requirementId: "conversation_informa_restricciones_personales",
            text: "Comunica en inglés cualquier alergia, intolerancia o preferencia alimentaria que deba respetarse durante la merienda.",
          },
          {
            requirementId: "conversation_limita_reorganizacion_cocina",
            text: "Establece en inglés un límite cortés pidiendo a Coco que no reorganice los cajones de la cocina mientras preparas tu merienda.",
          },
          {
            requirementId: "conversation_pide_vision_snack_ideal",
            text: "Pide en inglés que Coco describa su merienda saludable ideal y que justifique con dos razones por qué sería mejor para ti.",
          },
          {
            requirementId: "conversation_defiende_snack_con_ajuste",
            text: "Convence en inglés a Coco de dejar tu merienda casi intacta, aceptando solo un ajuste menor que él proponga.",
          },
          {
            requirementId: "conversation_pide_critica_constructiva",
            text: "Solicita en inglés que Coco deje de criticar y ofrezca dos mejoras concretas y realistas para tu merienda.",
          },
          {
            requirementId: "conversation_acuerda_tiempo_sin_cambios",
            text: "Pide en inglés un plazo de tiempo específico para terminar tu merienda sin más intervenciones de Coco.",
          },
          {
            requirementId: "conversation_propone_cata_intercambio",
            text: "Propón en inglés una cata: tú pruebas una salsa o aderezo de Coco si él permite que mantengas tus galletas o crackers.",
          },
          {
            requirementId: "conversation_confirma_manejo_seguro",
            text: "Confirma en inglés que no añadirá ingredientes agresivos (por ejemplo, demasiado ajo crudo) y que manipulará todo de forma segura.",
          },
          {
            requirementId: "conversation_aclara_tamano_porcion",
            text: "Aclara en inglés el tamaño de porción que ambos consideran razonable para la merienda.",
          },
          {
            requirementId: "conversation_acuerdo_metodo_preparacion",
            text: "Acordar en inglés un método de preparación aceptable (por ejemplo, solo en frío, sin horno) para evitar demoras.",
          },
          {
            requirementId: "conversation_pide_devolver_utensilios",
            text: "Pide en inglés que Coco devuelva los utensilios y condimentos a su lugar original después de usarlos.",
          },
          {
            requirementId: "conversation_muestra_empatia_y_firmeza",
            text: "Expresa en inglés aprecio por la pasión culinaria de Coco, pero defiende con firmeza tu elección de merienda.",
          },
          {
            requirementId: "conversation_rebate_asuncion_sobre_carbohidratos",
            text: "Refuta en inglés la idea de que tu merienda tiene demasiados carbohidratos, explicando por qué los necesitas ahora.",
          },
          {
            requirementId: "conversation_solicita_receta_para_mas_tarde",
            text: "Pide en inglés a Coco una receta saludable para preparar después, dejando claro que no será para esta merienda.",
          },
          {
            requirementId: "conversation_rechaza_ingrediente_con_razon",
            text: "Rechaza en inglés un ingrediente específico y justifica tu decisión con una razón práctica.",
          },
          {
            requirementId: "conversation_pide_evaluacion_saludable",
            text: "Pide en inglés a Coco que califique de 1 a 10 lo saludable de tu merienda y explique brevemente su nota.",
          },
          {
            requirementId: "conversation_compromiso_no_tocar_postre",
            text: "Obtén en inglés un compromiso explícito de Coco de no tocar tu postre reservado.",
          },
          {
            requirementId: "conversation_pide_sustitucion_gusto_personal",
            text: "Solicita en inglés una sugerencia de sustitución para un ingrediente que no te gusta, manteniendo el sabor similar.",
          },
          {
            requirementId: "conversation_regla_un_cambio",
            text: "Propón en inglés una regla clara: solo un cambio permitido por merienda, y consigue la aceptación de Coco.",
          },
          {
            requirementId: "conversation_identifica_ingrediente_banderaroja",
            text: "Pide en inglés que Coco señale un único ingrediente de “bandera roja” a evitar esta noche y acuerden respetarlo.",
          },
          {
            requirementId: "conversation_confirma_tolerancia_especias",
            text: "Confirma en inglés si las especias suaves están bien o si Coco prefiere sabores más neutros para la merienda.",
          },
          {
            requirementId: "conversation_negocia_quien_limpia",
            text: "Negocia en inglés quién se encargará de limpiar la encimera y los utensilios usados tras la preparación.",
          },
          {
            requirementId: "conversation_resume_plan_final",
            text: "Resume en inglés el plan final de la merienda, enumerando los ingredientes finales y el paso siguiente acordado.",
          },
          {
            requirementId: "english_idiom_rabbit_food",
            text: 'Usa la expresión en inglés "rabbit food" de forma humorística pero respetuosa para hablar de la ensalada que propone Coco.',
          },
          {
            requirementId: "english_phrasal_turn_down",
            text: 'Rechaza en inglés un ingrediente usando el phrasal verb "turn down" y da una breve razón.',
          },
          {
            requirementId: "english_phrasal_swap_out",
            text: 'Propón en inglés una sustitución usando "swap out" para cambiar un ingrediente por otro.',
          },
          {
            requirementId: "english_phrasal_cut_back_on",
            text: 'Sugiere en inglés reducir una cantidad usando la frase "cut back on" (por ejemplo, sal o aceite).',
          },
          {
            requirementId: "english_phrasal_hold_off",
            text: 'Pide en inglés que aplacen añadir un ingrediente usando "hold off".',
          },
          {
            requirementId: "english_phrasal_stick_to",
            text: 'Insiste en inglés en mantener tu plan usando el phrasal verb "stick to".',
          },
          {
            requirementId: "english_phrase_talk_me_into",
            text: 'Desafía en inglés a Coco a convencerte usando la expresión "talk me into" respecto a un cambio propuesto.',
          },
          {
            requirementId: "english_idiom_over_the_top",
            text: 'Critica en inglés que la receta de Coco sea demasiado elaborada usando el idiom "over the top".',
          },
          {
            requirementId: "english_idiom_hit_the_spot",
            text: 'Explica en inglés que tu merienda te satisface usando la expresión "hit the spot".',
          },
          {
            requirementId: "english_collocation_balanced_diet",
            text: 'Menciona en inglés la collocation "balanced diet" para justificar tu elección.',
          },
          {
            requirementId: "english_collocation_comfort_food",
            text: 'Describe en inglés tu antojo usando la collocation "comfort food".',
          },
          {
            requirementId: "english_advanced_nutrient_dense",
            text: 'Usa en inglés el adjetivo "nutrient-dense" para evaluar un ingrediente propuesto por Coco.',
          },
          {
            requirementId: "english_collocation_portion_size",
            text: 'Habla en inglés del tamaño adecuado usando la collocation "portion size".',
          },
          {
            requirementId: "english_collocation_dietary_restrictions",
            text: 'Declara en inglés cualquier límite usando la collocation "dietary restrictions".',
          },
          {
            requirementId: "english_collocation_whole_grains",
            text: 'Sugiere en inglés incluir "whole grains" como opción más saludable.',
          },
          {
            requirementId: "english_collocation_guilty_pleasure",
            text: 'Admite en inglés un antojo usando la collocation "guilty pleasure".',
          },
          {
            requirementId: "english_marker_on_the_other_hand",
            text: 'Contrapón en inglés dos ideas usando el conector "on the other hand".',
          },
          {
            requirementId: "english_marker_to_be_fair",
            text: 'Concede parcialmente en inglés un punto de Coco usando "to be fair".',
          },
          {
            requirementId: "english_marker_at_the_end_of_the_day",
            text: 'Cierra en inglés tu argumento principal usando la frase "at the end of the day".',
          },
          {
            requirementId: "english_vocab_seasoning",
            text: 'Habla en inglés del sabor usando la palabra "seasoning" para proponer un ajuste.',
          },
          {
            requirementId: "english_verb_crave",
            text: 'Explica en inglés tu deseo puntual de comida usando el verbo "crave".',
          },
          {
            requirementId: "english_vocab_palate",
            text: 'Menciona en inglés tu "palate" para justificar por qué prefieres cierta textura o sabor.',
          },
          {
            requirementId: "english_phrasal_tone_down",
            text: 'Pide en inglés suavizar un sabor usando el phrasal verb "tone down".',
          },
          {
            requirementId: "english_phrasal_spice_things_up",
            text: 'Permite en inglés una mejora menor usando la expresión "spice things up".',
          },
          {
            requirementId: "english_idiom_in_a_pickle",
            text: 'Describe en inglés tu dilema con Coco usando el idiom "in a pickle".',
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
            requirementId: "conversation_reaccion_alarma_suave",
            text: "Reconoce la alarma con calma y pide disculpas por el ruido, prometiendo hablar en voz baja para no asustar a Hoot.",
          },
          {
            requirementId: "conversation_pedir_ver_mensaje_sin_tocar",
            text: "Pide ver el mensaje de cerca sin tocarlo, solicitando permiso explícito antes de acercarte.",
          },
          {
            requirementId: "conversation_preguntar_origen_alarma",
            text: "Pregunta si la alarma estaba relacionada con la llegada de Hoot o con el contenido del mensaje.",
          },
          {
            requirementId: "conversation_preguntar_codificacion",
            text: "Pregunta si el mensaje está cifrado o si contiene pistas que necesiten interpretación.",
          },
          {
            requirementId: "conversation_negociar_iluminacion",
            text: "Propón atenuar la luz o usar una linterna con filtro para leer sin deslumbrar a Hoot y confirma su consentimiento.",
          },
          {
            requirementId: "conversation_confirmar_urgencia_margen",
            text: "Aclara el margen de tiempo exacto que tienes antes de que el mensaje pierda validez.",
          },
          {
            requirementId: "conversation_pedir_resumen_clave",
            text: "Pide un resumen de una sola frase con la idea clave del mensaje para confirmar tu comprensión.",
          },
          {
            requirementId: "conversation_parafrasear_comprension",
            text: "Parafrasea en tus propias palabras lo que entendiste del mensaje y pide confirmación.",
          },
          {
            requirementId: "conversation_preguntar_destinatario_secundario",
            text: "Pregunta si hay un destinatario alternativo en caso de que el principal no esté disponible a medianoche.",
          },
          {
            requirementId: "conversation_establecer_limite_sello",
            text: "Deja claro que no romperás ningún sello ni abrirás el sobre sin autorización explícita.",
          },
          {
            requirementId: "conversation_preguntar_prueba_identidad",
            text: "Pregunta qué prueba de identidad o palabra clave necesita el destinatario para aceptar la entrega.",
          },
          {
            requirementId: "conversation_confirmar_lugar_entrega",
            text: "Confirma el lugar exacto de entrega, incluyendo punto de referencia nocturno para evitar confusiones.",
          },
          {
            requirementId: "conversation_preguntar_acompanamiento_hoot",
            text: "Pregunta si Hoot te acompañará hasta el lugar o si te observará desde arriba para guiarte.",
          },
          {
            requirementId: "conversation_mostrar_empatia_cansancio",
            text: "Expresa empatía por el cansancio de Hoot a medianoche y ofrece un descanso breve en un posadero seguro.",
          },
          {
            requirementId: "conversation_indagar_condiciones_transporte",
            text: "Pregunta si el mensaje debe mantenerse seco, plano o a cierta temperatura durante el traslado.",
          },
          {
            requirementId: "conversation_preguntar_riesgos_intercepcion",
            text: "Pregunta si alguien podría intentar interceptar el mensaje y cómo reconocer señales de peligro.",
          },
          {
            requirementId: "conversation_pedir_repeticion_pista",
            text: "Solicita cortésmente que repita una pista críptica en caso de no haberla entendido bien.",
          },
          {
            requirementId: "conversation_consultar_comunicacion_posterior",
            text: "Pregunta cómo contactarte nuevamente con Hoot si surge una duda durante el trayecto.",
          },
          {
            requirementId: "conversation_verificar_integridad_sobre",
            text: "Verifica con Hoot el estado del sobre para confirmar que no ha sido manipulado.",
          },
          {
            requirementId: "conversation_pedir_horario_alternativo",
            text: "Pregunta si sería aceptable entregar al amanecer si el destinatario no responde de inmediato.",
          },
          {
            requirementId: "conversation_ofrecer_plan_b_claro",
            text: "Propón un plan B concreto si la puerta está cerrada: lugar seguro, foto de prueba y notificación.",
          },
          {
            requirementId: "conversation_confirmar_pronunciacion_nombre",
            text: "Pide la pronunciación correcta del nombre del destinatario para evitar errores al identificarlo.",
          },
          {
            requirementId: "conversation_pedir_detalle_ruta_segura",
            text: "Pregunta por la ruta más silenciosa y segura para no despertar a otras mascotas sensibles al ruido.",
          },
          {
            requirementId: "conversation_establecer_recompensa_apta",
            text: "Ofrece una golosina adecuada para aves como gesto de cortesía, confirmando que sea segura para Hoot.",
          },
          {
            requirementId: "conversation_confirmar_secreto_discrecion",
            text: "Confirma si debes mantener en secreto que Hoot te visitó y en qué términos puedes hablar del encargo.",
          },
          {
            requirementId: "english_usar_go_off",
            text: "Usa el phrasal verb en inglés 'go off' para describir cómo sonó la alarma.",
          },
          {
            requirementId: "english_usar_in_the_nick_of_time",
            text: "Usa el idiom en inglés 'in the nick of time' para hablar del plazo ajustado de entrega.",
          },
          {
            requirementId: "english_usar_track_down",
            text: "Usa el phrasal verb en inglés 'track down' para explicar cómo localizarás al destinatario a medianoche.",
          },
          {
            requirementId: "english_usar_hand_over",
            text: "Usa el phrasal verb en inglés 'hand over' para describir la acción de entregar el mensaje.",
          },
          {
            requirementId: "english_usar_hush_up",
            text: "Usa el phrasal verb en inglés 'hush up' para proponer mantener discreto el encuentro con la lechuza.",
          },
          {
            requirementId: "english_usar_keep_down_voice",
            text: "Usa la combinación en inglés 'keep my voice down' para prometer hablar en voz baja.",
          },
          {
            requirementId: "english_usar_touch_base",
            text: "Usa el idiom en inglés 'touch base' para acordar un breve contacto de actualización con Hoot.",
          },
          {
            requirementId: "english_usar_play_it_by_ear",
            text: "Usa el idiom en inglés 'play it by ear' para sugerir flexibilidad si cambian las condiciones nocturnas.",
          },
          {
            requirementId: "english_usar_sort_out",
            text: "Usa el phrasal verb en inglés 'sort out' para explicar cómo resolverás un obstáculo de acceso.",
          },
          {
            requirementId: "english_usar_up_in_the_air",
            text: "Usa el idiom en inglés 'up in the air' para describir detalles que aún no están confirmados.",
          },
          {
            requirementId: "english_usar_figure_out",
            text: "Usa el phrasal verb en inglés 'figure out' para hablar de descifrar una pista críptica del mensaje.",
          },
          {
            requirementId: "english_usar_look_over",
            text: "Usa el phrasal verb en inglés 'look over' para pedir revisar el sobre sin abrirlo.",
          },
          {
            requirementId: "english_usar_hold_off",
            text: "Usa el phrasal verb en inglés 'hold off' para proponer retrasar la entrega hasta el amanecer si es necesario.",
          },
          {
            requirementId: "english_usar_keep_an_eye_on",
            text: "Usa el idiom en inglés 'keep an eye on' para pedir a Hoot que vigile desde arriba mientras te acercas.",
          },
          {
            requirementId: "english_usar_pass_on",
            text: "Usa el phrasal verb en inglés 'pass on' para confirmar que transmitirás cualquier instrucción adicional.",
          },
          {
            requirementId: "english_usar_last_minute_change",
            text: "Usa la collocation en inglés 'last-minute change' para hablar de cambios repentinos en la dirección.",
          },
          {
            requirementId: "english_usar_tight_deadline",
            text: "Usa la collocation en inglés 'tight deadline' para enfatizar la urgencia.",
          },
          {
            requirementId: "english_usar_highly_confidential",
            text: "Usa la collocation en inglés 'highly confidential' para describir la naturaleza del mensaje.",
          },
          {
            requirementId: "english_usar_utter_discretion",
            text: "Usa la collocation en inglés 'utmost discretion' para prometer discreción total.",
          },
          {
            requirementId: "english_usar_deliver_by_hand",
            text: "Usa la collocation en inglés 'deliver by hand' para especificar el método de entrega.",
          },
          {
            requirementId: "english_usar_decipher",
            text: "Usa el verbo en inglés 'decipher' para referirte a entender el contenido en clave.",
          },
          {
            requirementId: "english_usar_time_sensitive",
            text: "Usa el adjetivo en inglés 'time-sensitive' para describir la sensibilidad temporal del encargo.",
          },
          {
            requirementId: "english_usar_for_the_record",
            text: "Usa el marcador discursivo en inglés 'for the record' para introducir una aclaración oficial.",
          },
          {
            requirementId: "english_usar_just_to_confirm",
            text: "Usa el marcador discursivo en inglés 'just to confirm' para verificar un detalle crítico.",
          },
          {
            requirementId: "english_usar_rendezvous",
            text: "Usa el sustantivo en inglés 'rendezvous' para acordar el punto de encuentro exacto con el destinatario.",
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
            requirementId: "conversation_state_intention_clearly",
            text: "Declara en inglés tu objetivo principal en la audición y cómo piensas destacar pese a los cambios de tema del presentador.",
          },
          {
            requirementId: "conversation_request_clarification_on_odd_question",
            text: "Pide en inglés una aclaración breve cuando el presentador haga una pregunta absurda que pueda tener dos interpretaciones.",
          },
          {
            requirementId: "conversation_set_boundary_with_politeness",
            text: "Rechaza en inglés, con cortesía y firmeza, una petición que te haga sentir incómodo en el escenario y ofrece una alternativa viable.",
          },
          {
            requirementId: "conversation_negotiate_challenge_terms",
            text: "Negocia en inglés los términos de una prueba relámpago para que sea segura y demuestre tu habilidad real.",
          },
          {
            requirementId: "conversation_ask_for_time_box",
            text: "Solicita en inglés un límite de tiempo breve para responder de forma contundente a un reto sorpresa.",
          },
          {
            requirementId: "conversation_handle_topic_shift_smoothly",
            text: "Conecta en inglés dos temas inconexos propuestos por el presentador con una transición natural.",
          },
          {
            requirementId: "conversation_use_empathy_with_host",
            text: "Muestra en inglés empatía hacia el estilo acelerado del presentador sin perder tu posición.",
          },
          {
            requirementId: "conversation_pitch_value_to_audience",
            text: "Presenta en inglés un argumento directo dirigido a la audiencia sobre por qué deberías pasar a la siguiente ronda.",
          },
          {
            requirementId: "conversation_request_repeat_fast_line",
            text: "Pide en inglés que el presentador repita una línea específica que dijo demasiado rápido.",
          },
          {
            requirementId: "conversation_handle_interruption_gracefully",
            text: "Recupera en inglés tu turno de palabra tras una interrupción sin sonar defensivo.",
          },
          {
            requirementId: "conversation_offer_concise_story",
            text: "Cuenta en inglés una anécdota muy breve y relevante que te presente como resiliente ante el caos.",
          },
          {
            requirementId: "conversation_answer_unexpected_personal_question",
            text: "Responde en inglés con límites saludables a una pregunta personal inesperada.",
          },
          {
            requirementId: "conversation_request_rules_summary",
            text: "Pide en inglés un resumen rápido de las reglas de la audición antes de aceptar un mini-reto.",
          },
          {
            requirementId: "conversation_paraphrase_host_metaphor",
            text: "Reformula en inglés una metáfora ridícula del presentador para mostrar que la comprendiste.",
          },
          {
            requirementId: "conversation_counter_with_own_metaphor",
            text: "Responde en inglés a una metáfora del presentador con una propia que defienda tu propuesta.",
          },
          {
            requirementId: "conversation_showcase_skill_10_seconds",
            text: "Ofrece en inglés una demostración de 10 segundos de tu talento, con contexto mínimo.",
          },
          {
            requirementId: "conversation_handle_false_dichotomy",
            text: "Detecta y corrige en inglés una falsa disyuntiva planteada por el presentador.",
          },
          {
            requirementId: "conversation_express_non_negotiable",
            text: "Declara en inglés un límite no negociable relacionado con seguridad o integridad artística.",
          },
          {
            requirementId: "conversation_ask_feedback_specific",
            text: "Solicita en inglés una retroalimentación específica sobre un aspecto de tu actuación.",
          },
          {
            requirementId: "conversation_turn_absurd_task_into_strength",
            text: "Convierte en inglés una tarea absurda en una oportunidad para resaltar una habilidad concreta.",
          },
          {
            requirementId: "conversation_defuse_teasing_with_humor",
            text: "Desactiva en inglés una burla juguetona del presentador con humor y compostura.",
          },
          {
            requirementId: "conversation_make_concise_promise",
            text: "Haz en inglés una promesa clara y verificable sobre tu desempeño futuro en el show.",
          },
          {
            requirementId: "conversation_seek_common_ground_with_host",
            text: "Identifica en inglés un punto en común con el presentador para avanzar la conversación.",
          },
          {
            requirementId: "conversation_recap_key_points_before_decision",
            text: "Resume en inglés tus tres puntos clave antes de que el presentador tome una decisión.",
          },
          {
            requirementId: "conversation_ask_permission_to_change_format",
            text: "Pide en inglés permiso para ajustar el formato de una prueba y explica por qué mejora la evaluación.",
          },
          {
            requirementId: "english_use_think_on_your_feet",
            text: "Usa la expresión en inglés 'think on your feet' para explicar cómo manejas los cambios bruscos del presentador.",
          },
          {
            requirementId: "english_use_over_the_top",
            text: "Emplea la collocation en inglés 'over the top' para describir el estilo del show sin sonar despectivo.",
          },
          {
            requirementId: "english_use_on_the_spot",
            text: "Incluye la expresión en inglés 'on the spot' al hablar de responder bajo presión.",
          },
          {
            requirementId: "english_use_play_along_phrasal",
            text: "Usa el phrasal verb en inglés 'play along' para indicar que cooperas con un juego absurdo.",
          },
          {
            requirementId: "english_use_tone_down_phrasal",
            text: "Emplea el phrasal verb en inglés 'tone down' para negociar reducir la exageración de una prueba.",
          },
          {
            requirementId: "english_use_pull_it_off_phrasal",
            text: "Usa el phrasal verb en inglés 'pull it off' para afirmar que puedes ejecutar un truco difícil.",
          },
          {
            requirementId: "english_use_switch_gears_idiom",
            text: "Incluye la expresión en inglés 'switch gears' para marcar un cambio rápido de tema.",
          },
          {
            requirementId: "english_use_buy_time_idiom",
            text: "Usa la expresión en inglés 'buy time' al pedir unos segundos para pensar.",
          },
          {
            requirementId: "english_use_off_the_cuff_idiom",
            text: "Emplea la expresión en inglés 'off the cuff' para presentar una respuesta improvisada.",
          },
          {
            requirementId: "english_use_keep_a_straight_face",
            text: "Usa la expresión en inglés 'keep a straight face' al describir cómo mantienes la compostura ante bromas.",
          },
          {
            requirementId: "english_use_catch_off_guard",
            text: "Incluye la expresión en inglés 'caught me off guard' para reconocer una sorpresa del presentador.",
          },
          {
            requirementId: "english_use_push_back_phrasal",
            text: "Usa el phrasal verb en inglés 'push back' para poner un límite con respeto.",
          },
          {
            requirementId: "english_use_talk_me_through_phrasal",
            text: "Emplea el phrasal verb en inglés 'talk you through' para guiar al presentador por tu demostración.",
          },
          {
            requirementId: "english_use_stick_to_phrasal",
            text: "Usa el phrasal verb en inglés 'stick to' para insistir en un punto clave de tu propuesta.",
          },
          {
            requirementId: "english_use_lean_into_phrasal",
            text: "Incluye el phrasal verb en inglés 'lean into' para mostrar que aprovechas el caos a tu favor.",
          },
          {
            requirementId: "english_use_brush_off_phrasal",
            text: "Emplea el phrasal verb en inglés 'brush off' para restar importancia a una distracción menor.",
          },
          {
            requirementId: "english_use_the_show_must_go_on_idiom",
            text: "Usa el idiom en inglés 'the show must go on' para reafirmar tu profesionalismo.",
          },
          {
            requirementId: "english_use_bring_your_a_game_idiom",
            text: "Incluye el idiom en inglés 'bring my A-game' para prometer alto rendimiento.",
          },
          {
            requirementId: "english_use_out_of_the_blue_idiom",
            text: "Usa el idiom en inglés 'out of the blue' para señalar una pregunta inesperada.",
          },
          {
            requirementId: "english_use_go_the_extra_mile_idiom",
            text: "Emplea el idiom en inglés 'go the extra mile' para describir tu compromiso con el show.",
          },
          {
            requirementId: "english_use_non_negotiable_collocation",
            text: "Incluye la collocation en inglés 'non-negotiable boundary' al fijar un límite claro.",
          },
          {
            requirementId: "english_use_dazzling_performance_collocation",
            text: "Usa la collocation en inglés 'dazzling performance' para proyectar confianza en tu acto.",
          },
          {
            requirementId: "english_use_pivot_strategically",
            text: "Emplea el verbo en inglés 'pivot' para describir un cambio táctico en tu respuesta.",
          },
          {
            requirementId: "english_use_no_brainer_idiom",
            text: "Usa el idiom en inglés 'a no-brainer' para presentar una decisión evidente a tu favor.",
          },
          {
            requirementId: "english_use_off_limits_collocation",
            text: "Incluye la collocation en inglés 'off-limits' para marcar un tema que no abordarás en la audición.",
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
            requirementId: "conversation_justificar_peinado_bajo_presion",
            text: "Justifica tu peinado frente a una burla del juez dando una razón práctica y otra artística.",
          },
          {
            requirementId: "conversation_pedir_reglas_chiste",
            text: "Pregunta con cortesía cuáles son los límites del humor aceptable antes de contar tu chiste principal.",
          },
          {
            requirementId: "conversation_negociar_segundos_extras",
            text: "Negocia educadamente 20 segundos extra para rematar tu número y explica por qué marcarían la diferencia.",
          },
          {
            requirementId: "conversation_reformular_critica_para_aprender",
            text: "Reformula en tus propias palabras una crítica del juez para confirmar que la entendiste bien y puedas aplicarla.",
          },
          {
            requirementId: "conversation_pedir_ejemplo_del_juez",
            text: "Pide un ejemplo concreto de lo que el juez consideraría un remate más fuerte.",
          },
          {
            requirementId: "conversation_mantener_calma_tras_interrupcion",
            text: "Retoma tu respuesta con calma después de una interrupción sarcástica sin perder el hilo.",
          },
          {
            requirementId: "conversation_establecer_limite_respectuoso",
            text: "Establece un límite amable cuando el comentario del juez sobre tu apariencia se vuelva demasiado personal.",
          },
          {
            requirementId: "conversation_defender_talento_con_datos",
            text: "Defiende tu talento mencionando una experiencia previa o logro medible relevante.",
          },
          {
            requirementId: "conversation_pedir_criterios_puntuacion",
            text: "Pregunta por los criterios clave de puntuación que Judge Pinch usará en esta ronda.",
          },
          {
            requirementId: "conversation_usar_autodeprecacion_medida",
            text: "Responde a una pulla usando humor autocrítico moderado sin devaluar tu propuesta.",
          },
          {
            requirementId: "conversation_responder_reto_improvisado",
            text: "Acepta un reto improvisado del juez y explica en una frase cómo adaptarás tu acto en el momento.",
          },
          {
            requirementId: "conversation_pedir_permiso_utilizar_propio_atrezzo",
            text: "Pide permiso para usar un pequeño accesorio y justifica su necesidad en tu acto.",
          },
          {
            requirementId: "conversation_aclarar_malentendido_chiste",
            text: "Aclara un malentendido específico sobre un chiste sin culpar al público ni al juez.",
          },
          {
            requirementId: "conversation_convencer_publico_objetivo",
            text: "Explica a qué público objetivo apuntas y por qué tu estilo encaja con el tono del programa.",
          },
          {
            requirementId: "conversation_pedir_retake_unico",
            text: "Solicita una sola repetición de tu remate y promete un ajuste claro que vas a aplicar.",
          },
          {
            requirementId: "conversation_convertir_critica_en_regla_de_mejora",
            text: "Transforma una crítica del juez en una regla concreta que aplicarás desde ahora.",
          },
          {
            requirementId: "conversation_mostrar_empatia_con_exigencia_juez",
            text: "Reconoce la exigencia del juez y valida una de sus preocupaciones antes de defender tu enfoque.",
          },
          {
            requirementId: "conversation_contrargumento_con_evidencia_publico",
            text: "Presenta un contrargumento citando cómo reaccionó una audiencia previa ante el mismo material.",
          },
          {
            requirementId: "conversation_confirmar_tiempo_restante",
            text: "Pregunta cuánto tiempo te queda exactamente y ajusta tu plan en una frase.",
          },
          {
            requirementId: "conversation_responder_pregunta_absurda_con_humor",
            text: "Responde a una pregunta absurda del juez con ingenio y vuelve al punto central sin desviarte.",
          },
          {
            requirementId: "conversation_ofrecer_version_alternativa_acto",
            text: "Ofrece una versión alternativa más breve o más limpia de tu acto cuando se te pida variar el tono.",
          },
          {
            requirementId: "conversation_resumir_propuesta_valor_en_una_linea",
            text: "Resume en una sola línea lo que te hace único para esta temporada.",
          },
          {
            requirementId:
              "conversation_pedir_claridad_sobre_familiar_friendly",
            text: "Pregunta si el contenido debe ser estrictamente familiar y confirma que ajustarás tu guion si es necesario.",
          },
          {
            requirementId: "conversation_elogio_medido_imparcialidad_juez",
            text: "Elogia brevemente la imparcialidad del juez sin sonar adulador y enlázalo con tu petición.",
          },
          {
            requirementId: "conversation_reencuadrar_error_como_aprendizaje",
            text: "Admite un fallo puntual y reencuádralo como un aprendizaje específico para la siguiente intervención.",
          },
          {
            requirementId: "english_use_read_the_room",
            text: 'Usa la expresión en inglés "read the room" al explicar cómo ajustarás el tono ante Judge Pinch.',
          },
          {
            requirementId: "english_use_tone_down_phrasal",
            text: 'Incluye el phrasal verb "tone down" para prometer que suavizarás una parte de tu acto.',
          },
          {
            requirementId: "english_use_steal_the_show_idiom",
            text: 'Emplea el idiom "steal the show" para explicar tu objetivo en la audición.',
          },
          {
            requirementId: "english_use_win_over_collocation",
            text: 'Usa la collocation "win over the judge" o "win over the audience" al describir tu estrategia.',
          },
          {
            requirementId: "english_use_laugh_off_phrasal",
            text: 'Incluye el phrasal verb "laugh off" para mostrar cómo manejarás una burla del juez.',
          },
          {
            requirementId: "english_use_take_it_with_a_pinch_of_salt",
            text: 'Usa el idiom "take it with a pinch of salt" para referirte a un comentario sarcástico de Judge Pinch.',
          },
          {
            requirementId: "english_use_punchline_term",
            text: 'Menciona la palabra "punchline" al hablar de tu remate.',
          },
          {
            requirementId: "english_use_on_the_spot_expression",
            text: 'Usa la expresión "on the spot" para describir cómo improvisas bajo presión.',
          },
          {
            requirementId: "english_use_pull_off_phrasal",
            text: 'Emplea el phrasal verb "pull off" para afirmar que puedes lograr un cambio difícil en tu acto.',
          },
          {
            requirementId: "english_use_cut_to_the_chase_idiom",
            text: 'Incluye el idiom "cut to the chase" antes de presentar tu propuesta clave.',
          },
          {
            requirementId: "english_use_deadpan_and_tongue_in_cheek",
            text: 'Usa los adjetivos "deadpan" y "tongue-in-cheek" para describir tu estilo cómico.',
          },
          {
            requirementId: "english_use_back_up_collocation",
            text: 'Incluye la collocation "back up" con "evidence" o "examples" para sostener tu defensa.',
          },
          {
            requirementId: "english_use_play_along_phrasal",
            text: 'Usa el phrasal verb "play along" al aceptar un juego o reto del juez.',
          },
          {
            requirementId: "english_use_break_the_ice_idiom",
            text: 'Emplea el idiom "break the ice" al explicar tu chiste de apertura.',
          },
          {
            requirementId: "english_use_stage_presence_collocation",
            text: 'Menciona la collocation "strong stage presence" para describir tu actuación.',
          },
          {
            requirementId: "english_use_go_the_extra_mile_idiom",
            text: 'Usa el idiom "go the extra mile" para prometer un esfuerzo adicional en la siguiente ronda.',
          },
          {
            requirementId: "english_use_brush_off_phrasal",
            text: 'Incluye el phrasal verb "brush off" para mostrar cómo no te afecta un comentario hiriente.',
          },
          {
            requirementId: "english_use_quick_witted_and_comedic_timing",
            text: 'Usa "quick-witted" y "comedic timing" para argumentar por qué funcionas en un show en vivo.',
          },
          {
            requirementId: "english_use_point_out_phrasal",
            text: 'Emplea el phrasal verb "point out" para señalar una mejora concreta que harás.',
          },
          {
            requirementId: "english_use_read_my_lines_vs_improvise",
            text: 'Contrapón "read my lines" con "improvise" para explicar tu flexibilidad en escena.',
          },
          {
            requirementId: "english_use_win_ceiling_set_the_bar",
            text: 'Usa la metáfora "set the bar" para hablar del nivel que el juez exige.',
          },
          {
            requirementId: "english_use_nip_it_in_the_bud_idiom",
            text: 'Incluye el idiom "nip it in the bud" para explicar cómo eliminarás un problema de tu guion.',
          },
          {
            requirementId: "english_use_play_up_phrasal",
            text: 'Usa el phrasal verb "play up" para indicar qué parte de tu acto vas a resaltar.',
          },
          {
            requirementId: "english_use_win_them_back_phrasal",
            text: 'Emplea el phrasal verb "win back" para explicar cómo recuperarás al público tras un tropiezo.',
          },
          {
            requirementId: "english_use_the_ball_is_in_your_court_idiom",
            text: 'Cierra una petición al juez usando el idiom "the ball is in your court".',
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
            requirementId: "conversation_hook_with_tagline",
            text: "Lanza un eslogan pegadizo para el plato y pídele a Chef Marlowe que evalúe si funcionaría en televisión.",
          },
          {
            requirementId: "conversation_target_audience_probe",
            text: "Pregunta a Chef Marlowe qué tipo de público quiere conquistar y adapta tu discurso a ese segmento.",
          },
          {
            requirementId: "conversation_texture_reframe",
            text: "Si el chef cuestiona la textura, reformula el aspecto textural comparándolo con un alimento popular y familiar.",
          },
          {
            requirementId: "conversation_health_concern_address",
            text: "Aborda una posible preocupación de salud del público y explica cómo el plato sigue siendo seguro y atractivo.",
          },
          {
            requirementId: "conversation_plating_negotiation",
            text: "Negocia permiso para cambiar un detalle del emplatado y justifica por qué aumenta el atractivo visual.",
          },
          {
            requirementId: "conversation_time_constraint_pitch",
            text: "Haz un mini discurso de menos de 20 segundos y pide a Chef Marlowe que te cronometre.",
          },
          {
            requirementId: "conversation_compare_to_trend",
            text: "Compara el plato con una tendencia gastronómica actual y explica por qué la supera.",
          },
          {
            requirementId: "conversation_allergy_clarification",
            text: "Pregunta explícitamente por posibles alérgenos clave y aclara cómo informarías eso al público.",
          },
          {
            requirementId: "conversation_empathy_reaction",
            text: "Muestra empatía si el chef expresa dudas personales y valida su preocupación antes de persuadirlo.",
          },
          {
            requirementId: "conversation_value_proposition",
            text: "Formula una propuesta de valor en una frase que resuma sabor, novedad y beneficio para el espectador.",
          },
          {
            requirementId: "conversation_story_hook",
            text: "Inventa un breve origen del plato y pide al chef que confirme si suena creíble para el programa.",
          },
          {
            requirementId: "conversation_live_demo_request",
            text: "Solicita hacer una microdemostración en cámara y explica qué truco visual impresiona más.",
          },
          {
            requirementId: "conversation_handle_price_objection",
            text: "Si el chef menciona el coste de ingredientes, responde con una justificación de valor percibido.",
          },
          {
            requirementId: "conversation_audience_interaction_plan",
            text: "Propón una dinámica para involucrar a la audiencia en vivo y pide la aprobación del chef.",
          },
          {
            requirementId: "conversation_risk_boundary",
            text: "Establece un límite claro sobre algo que no harías por seguridad alimentaria y ofrécelo con alternativas.",
          },
          {
            requirementId: "conversation_comparative_taste_test",
            text: "Sugiere una prueba de sabor comparativa con un plato convencional y explica el criterio de evaluación.",
          },
          {
            requirementId: "conversation_feedback_scale",
            text: "Pide a Chef Marlowe que califique tu pitch del 1 al 10 y solicita una mejora concreta.",
          },
          {
            requirementId: "conversation_demographic_switch",
            text: "Reformula tu venta del plato orientándola a niños y luego a foodies adultos por contraste.",
          },
          {
            requirementId: "conversation_visual_metaphor",
            text: "Usa una metáfora visual para describir el sabor y comprueba si el chef la considera eficaz.",
          },
          {
            requirementId: "conversation_spice_tolerance_query",
            text: "Pregunta por el nivel de picante tolerable en el programa y adapta tu discurso en función de la respuesta.",
          },
          {
            requirementId: "conversation_crunch_time_rebuttal",
            text: "Responde con calma si te interrumpen y recupera el control del mensaje con una frase puente.",
          },
          {
            requirementId: "conversation_catchphrase_test",
            text: "Propón una muletilla para cerrar la venta en cámara y pide al chef que la repita para probar su impacto.",
          },
          {
            requirementId: "conversation_texture_solution_offer",
            text: "Si el chef llama al plato “gomoso” o “baboso”, ofrece una técnica concreta para ajustar la textura.",
          },
          {
            requirementId: "conversation_sensory_sequence",
            text: "Guía al chef por una secuencia sensorial breve: vista, aroma y mordida inicial, pidiéndole confirmar cada fase.",
          },
          {
            requirementId: "conversation_crisis_spin",
            text: "Si surge un fallo menor (derrame o humo), redirígelo en positivo y vincúlalo con la emoción del directo.",
          },
          {
            requirementId: "english_use_win_over",
            text: 'Usa la expresión inglesa "win over" para prometer que conquistarás a los escépticos del jurado.',
          },
          {
            requirementId: "english_use_spice_up_phrasal",
            text: 'Usa el phrasal verb "spice up" para explicar cómo harás más emocionante la presentación.',
          },
          {
            requirementId: "english_use_tone_down_phrasal",
            text: 'Usa el phrasal verb "tone down" al hablar de reducir el picante sin perder carácter.',
          },
          {
            requirementId: "english_use_sell_like_hotcakes_idiom",
            text: 'Usa el idiom "sell like hotcakes" para predecir la popularidad del plato.',
          },
          {
            requirementId: "english_use_out_of_this_world_idiom",
            text: 'Usa el idiom "out of this world" para describir el sabor.',
          },
          {
            requirementId: "english_use_take_it_up_a_notch_idiom",
            text: 'Usa la expresión "take it up a notch" para proponer una mejora en escena.',
          },
          {
            requirementId: "english_use_break_the_mold_idiom",
            text: 'Usa el idiom "break the mold" para resaltar la originalidad del plato.',
          },
          {
            requirementId: "english_use_back_up_phrasal",
            text: 'Usa el phrasal verb "back up" para respaldar una afirmación con una razón concreta.',
          },
          {
            requirementId: "english_use_double_down_phrasal",
            text: 'Usa el phrasal verb "double down" para insistir en una decisión creativa.',
          },
          {
            requirementId: "english_use_cutting_edge_collocation",
            text: 'Usa la collocation "cutting-edge technique" para describir una técnica de cocina que aplicas.',
          },
          {
            requirementId: "english_use_umami_rich_collocation",
            text: 'Usa "umami-rich" para calificar un componente clave del plato.',
          },
          {
            requirementId: "english_use_mouthwatering_adjective",
            text: 'Usa el adjetivo "mouthwatering" para describir el aroma o el aspecto.',
          },
          {
            requirementId: "english_use_game_changer_collocation",
            text: 'Usa la expresión "a game-changer" para presentar el ingrediente estrella.',
          },
          {
            requirementId: "english_use_bursting_with_collocation",
            text: 'Usa la collocation "bursting with flavor" al hablar del primer bocado.',
          },
          {
            requirementId: "english_use_pair_with_collocation",
            text: 'Usa "pair it with" para sugerir un maridaje con bebida o guarnición.',
          },
          {
            requirementId: "english_use_signature_twist_collocation",
            text: 'Usa "signature twist" para nombrar tu aporte personal al plato.',
          },
          {
            requirementId: "english_use_rule_of_thumb_idiom",
            text: 'Usa el idiom "rule of thumb" para justificar una proporción o técnica.',
          },
          {
            requirementId: "english_use_make_or_break_idiom",
            text: 'Usa la expresión "make-or-break" para subrayar un momento clave de la audición.',
          },
          {
            requirementId: "english_use_hit_the_spot_idiom",
            text: 'Usa el idiom "hit the spot" para describir la satisfacción del público.',
          },
          {
            requirementId: "english_use_push_back_phrasal",
            text: 'Usa el phrasal verb "push back" al responder a una crítica del chef.',
          },
          {
            requirementId: "english_use_on_top_of_that_marker",
            text: 'Usa el conector "on top of that" para añadir un beneficio adicional.',
          },
          {
            requirementId: "english_use_nevertheless_marker",
            text: 'Usa el conector "nevertheless" para contraponer una desventaja con un punto fuerte.',
          },
          {
            requirementId: "english_use_frankly_marker",
            text: 'Usa el marcador discursivo "frankly" para introducir una opinión sincera sobre el riesgo.',
          },
          {
            requirementId: "english_use_to_be_honest_marker",
            text: 'Usa "to be honest" para admitir una posible debilidad y tu plan para solucionarla.',
          },
          {
            requirementId: "english_use_no_brainer_idiom",
            text: 'Usa el idiom "a no-brainer" para defender una elección de presentación.',
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
            requirementId: "conversation_define_humanness_criteria",
            text: "Pide a Zylo-7 que aclare qué criterios específicos usa para medir la 'humanidad' y confirma en voz alta esos criterios.",
          },
          {
            requirementId: "conversation_negotiate_first_test",
            text: "Negocia el orden de las pruebas proponiendo comenzar con una demostración breve de empatía y logra su aprobación explícita.",
          },
          {
            requirementId: "conversation_explain_sarcasm_with_example",
            text: "Explica la diferencia entre sinceridad y sarcasmo con un ejemplo propio y verifica que Zylo-7 lo haya entendido.",
          },
          {
            requirementId: "conversation_set_boundary_mind_scan",
            text: "Establece un límite si el alien sugiere escanear tu mente y ofrece una alternativa segura, como describir tus recuerdos.",
          },
          {
            requirementId: "conversation_request_plain_language",
            text: "Pide que reformule una pregunta extraña en términos más simples y repite la nueva versión para confirmar tu comprensión.",
          },
          {
            requirementId: "conversation_correct_misconception_tears",
            text: "Corrige una idea errónea sobre las lágrimas humanas explicando al menos dos razones por las que la gente llora.",
          },
          {
            requirementId: "conversation_compare_greetings",
            text: "Compara dos saludos humanos comunes y justifica cuál usarías con un desconocido en una audición.",
          },
          {
            requirementId: "conversation_persuade_value_creativity",
            text: "Convence a Zylo-7 de valorar la creatividad sobre la precisión literal en al menos una prueba, ofreciendo un argumento y un ejemplo.",
          },
          {
            requirementId: "conversation_ask_feedback_rubric",
            text: "Solicita la rúbrica de evaluación y repite los puntos clave para confirmar que la entendiste.",
          },
          {
            requirementId: "conversation_explain_stage_fright",
            text: "Explica qué es el miedo escénico, cómo se manifiesta físicamente y qué estrategia usarás para manejarlo durante la audición.",
          },
          {
            requirementId: "conversation_roleplay_small_talk",
            text: "Propón y realiza un mini roleplay de small talk apropiado para una sala de audición y señala por qué es útil.",
          },
          {
            requirementId: "conversation_reject_absurd_dare_politely",
            text: "Rechaza con cortesía una prueba absurdamente peligrosa y sugiere una actividad equivalente pero segura.",
          },
          {
            requirementId: "conversation_seek_emotional_context",
            text: "Pregunta qué emoción espera observar Zylo-7 en una situación dada y explica cómo la mostrarías de manera auténtica.",
          },
          {
            requirementId: "conversation_share_brief_kindness_story",
            text: "Cuenta una anécdota breve donde mostraste amabilidad y explica qué aprendizaje humano ilustra.",
          },
          {
            requirementId: "conversation_explain_nonverbal_cues",
            text: "Describe tres señales no verbales humanas y cómo podrían malinterpretarse por alguien de otra especie.",
          },
          {
            requirementId: "conversation_handle_misunderstanding_humor",
            text: "Aclara con calma un malentendido humorístico y verifica que no hubo ofensa.",
          },
          {
            requirementId: "conversation_request_time_to_think",
            text: "Pide unos segundos para pensar ante una pregunta inesperada y avisa cuando estés listo para responder.",
          },
          {
            requirementId: "conversation_offer_live_demo_emotion",
            text: "Ofrece una demostración breve de una emoción específica y explica qué señales observar.",
          },
          {
            requirementId: "conversation_probe_alien_emotions",
            text: "Pregunta cómo experimenta emociones Zylo-7 y compara respetuosamente con la experiencia humana.",
          },
          {
            requirementId: "conversation_clarify_idiom_confusion",
            text: "Detecta un modismo que Zylo-7 entienda de forma literal y aclara su significado figurado con un ejemplo.",
          },
          {
            requirementId: "conversation_state_personal_values",
            text: "Declara dos valores personales que consideras humanos y explica cómo influyen en tus decisiones.",
          },
          {
            requirementId: "conversation_request_fairness_accommodation",
            text: "Solicita una pequeña adaptación de la prueba para asegurar equidad y confirma si es aceptada.",
          },
          {
            requirementId: "conversation_own_mistake_recover",
            text: "Admite un pequeño error durante la explicación y muestra cómo te recuperas de forma profesional.",
          },
          {
            requirementId: "conversation_summarize_fit_for_show",
            text: "Resume por qué serías un buen candidato para el show destacando un rasgo humano clave.",
          },
          {
            requirementId: "conversation_memorable_closing_line",
            text: "Cierra con una frase breve y memorable que demuestre calidez y autoconfianza, y confirma que Zylo-7 la recuerda.",
          },
          {
            requirementId: "english_use_collocation_read_the_room",
            text: "Incluye la colocación inglesa 'read the room' para explicar cómo ajustas tu comportamiento durante la audición.",
          },
          {
            requirementId: "english_use_word_authenticity",
            text: "Usa la palabra inglesa 'authenticity' al describir lo que el jurado busca en tu comportamiento humano.",
          },
          {
            requirementId: "english_use_idiom_break_the_ice",
            text: "Emplea el modismo inglés 'break the ice' al proponer cómo iniciarías una interacción con Zylo-7.",
          },
          {
            requirementId: "english_use_phrasal_verb_open_up",
            text: "Usa el phrasal verb inglés 'open up' para describir cómo compartirías una emoción personal sin exagerarla.",
          },
          {
            requirementId: "english_use_word_nuance",
            text: "Incluye la palabra inglesa 'nuance' al explicar por qué el humor humano puede ser difícil de medir.",
          },
          {
            requirementId: "english_use_idiom_hit_the_nail",
            text: "Inserta el modismo inglés 'hit the nail on the head' al confirmar que Zylo-7 entendió una explicación.",
          },
          {
            requirementId: "english_use_phrasal_verb_turn_down",
            text: "Usa el phrasal verb inglés 'turn down' para rechazar cortésmente una prueba inadecuada.",
          },
          {
            requirementId: "english_use_word_resilience",
            text: "Emplea la palabra inglesa 'resilience' al explicar cómo te recuperas del miedo escénico.",
          },
          {
            requirementId: "english_use_collocation_make_eye_contact",
            text: "Incluye la colocación inglesa 'make eye contact' para describir una señal humana de confianza.",
          },
          {
            requirementId: "english_use_idiom_out_of_the_blue",
            text: "Usa el modismo inglés 'out of the blue' al hablar de una pregunta inesperada del alien.",
          },
          {
            requirementId: "english_use_phrasal_verb_brush_off",
            text: "Emplea el phrasal verb inglés 'brush off' para explicar por qué no ignoras críticas útiles.",
          },
          {
            requirementId: "english_use_word_vulnerability",
            text: "Incluye la palabra inglesa 'vulnerability' para justificar por qué compartir emociones puede ser valioso.",
          },
          {
            requirementId: "english_use_idiom_keep_a_straight_face",
            text: "Usa la expresión inglesa 'keep a straight face' al describir cómo controlas la risa en una situación absurda.",
          },
          {
            requirementId: "english_use_phrasal_verb_figure_out",
            text: "Emplea el phrasal verb inglés 'figure out' para explicar cómo resuelves una costumbre humana confusa para Zylo-7.",
          },
          {
            requirementId: "english_use_word_misconception",
            text: "Usa la palabra inglesa 'misconception' al corregir una idea errónea sobre la tristeza humana.",
          },
          {
            requirementId: "english_use_idiom_not_my_cup_of_tea",
            text: "Incluye el modismo inglés 'not my cup of tea' para rechazar un estilo de actuación sin ofender.",
          },
          {
            requirementId: "english_use_phrasal_verb_break_down",
            text: "Usa el phrasal verb inglés 'break down' para desglosar los pasos de una costumbre humana.",
          },
          {
            requirementId: "english_use_word_bittersweet",
            text: "Emplea la palabra inglesa 'bittersweet' para describir una emoción mezclada que quieras mostrar.",
          },
          {
            requirementId: "english_use_idiom_go_the_extra_mile",
            text: "Inserta el modismo inglés 'go the extra mile' al prometer cómo impresionarás al jurado.",
          },
          {
            requirementId: "english_use_phrasal_verb_spill_the_beans",
            text: "Usa el phrasal verb inglés 'spill the beans' para explicar por qué no revelarás un secreto de la producción.",
          },
          {
            requirementId: "english_use_word_awkward",
            text: "Incluye la palabra inglesa 'awkward' para describir una interacción social rara con un desconocido.",
          },
          {
            requirementId: "english_use_collocation_take_for_granted",
            text: "Emplea la colocación inglesa 'take for granted' al hablar de hábitos humanos que pasan desapercibidos.",
          },
          {
            requirementId: "english_use_idiom_fish_out_of_water",
            text: "Usa el modismo inglés 'fish out of water' para describirte en una pregunta alienígena extraña.",
          },
          {
            requirementId: "english_use_phrasal_verb_put_yourself_in_shoes",
            text: "Incluye la expresión inglesa 'put myself in your shoes' para demostrar empatía hacia Zylo-7.",
          },
          {
            requirementId: "english_use_word_goosebumps",
            text: "Usa la palabra inglesa 'goosebumps' al explicar una reacción física ante música emocionante en la audición.",
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
            requirementId: "conversation_marcar_tempo_cuentas",
            text: "Pedir en inglés que te den el tempo exacto en cuentas de ocho antes de empezar.",
          },
          {
            requirementId: "conversation_confirmar_mirada_camara_o_espejo",
            text: "Confirmar en inglés si debes mirar a la cámara o al espejo en el primer compás del movimiento.",
          },
          {
            requirementId: "conversation_simplificar_paso_para_camara",
            text: "Explicar en inglés una variación más simple del paso para que se vea claro en cámara.",
          },
          {
            requirementId: "conversation_repetir_indicacion_clave",
            text: "Solicitar en inglés que repitan una indicación específica para asegurar que la entendiste.",
          },
          {
            requirementId: "conversation_aceptar_correccion_y_ajustar_energia",
            text: "Aceptar en inglés una corrección de Talia y decir cómo ajustarás el nivel de energía.",
          },
          {
            requirementId: "conversation_establecer_limite_seguridad",
            text: "Establecer en inglés un límite por una molestia física leve y proponer una alternativa segura.",
          },
          {
            requirementId: "conversation_preguntar_estilo_preferido",
            text: "Preguntar en inglés si prefieren un estilo más comercial o más contemporáneo para esta toma.",
          },
          {
            requirementId: "conversation_negociar_toma_adicional_corta",
            text: "Negociar en inglés hacer una toma adicional breve para pulir el cierre del combo.",
          },
          {
            requirementId: "conversation_describir_entrada_y_salida_de_cuadro",
            text: "Describir en inglés cómo entrarás al cuadro y dónde te detendrás al finalizar.",
          },
          {
            requirementId: "conversation_reaccionar_a_pedir_mas_drama",
            text: "Reaccionar en inglés con entusiasmo moderado cuando Talia pida más drama, prometiendo un detalle concreto.",
          },
          {
            requirementId: "conversation_ajustar_volumen_para_cuentas",
            text: "Pedir en inglés que suban o bajen la música ligeramente para escuchar las cuentas.",
          },
          {
            requirementId: "conversation_aclarar_simetria_del_movimiento",
            text: "Aclarar en inglés si el movimiento debe ser simétrico o solo hacia un lado.",
          },
          {
            requirementId: "conversation_indicar_marca_en_el_suelo",
            text: "Dar en inglés una instrucción breve sobre tu marca en el suelo para coordinar con cámara.",
          },
          {
            requirementId: "conversation_dimension_manos_para_encuadre",
            text: "Preguntar en inglés si el gesto de manos debe ser grande o contenido para no salir del encuadre.",
          },
          {
            requirementId: "conversation_proponer_arranque_en_quietud",
            text: "Proponer en inglés iniciar con un momento de quietud y justificarlo con una razón visual.",
          },
          {
            requirementId: "conversation_mensaje_breve_confianza_pre_toma",
            text: "Expresar en inglés seguridad con una frase corta antes de ejecutar la toma decisiva.",
          },
          {
            requirementId: "conversation_confirmar_duracion_en_segundos",
            text: "Confirmar en inglés la duración exacta del combo en segundos.",
          },
          {
            requirementId: "conversation_pedir_feedback_intencion_facial",
            text: "Pedir en inglés feedback inmediato sobre la intención facial que estás transmitiendo.",
          },
          {
            requirementId: "conversation_responder_pregunta_absurda_con_humor",
            text: "Responder en inglés a una pregunta absurda de Talia con humor ligero sin perder profesionalidad.",
          },
          {
            requirementId: "conversation_pedir_permiso_conteo_en_voz_alta",
            text: "Pedir en inglés permiso para ensayar el conteo en voz alta una vez.",
          },
          {
            requirementId:
              "conversation_mencionar_limite_vestuario_y_reemplazo",
            text: "Señalar en inglés que tu vestuario limita un salto específico y ofrecer un reemplazo creíble.",
          },
          {
            requirementId:
              "conversation_solicitar_demostracion_acento_movimiento",
            text: "Solicitar en inglés que Talia demuestre un acento de movimiento para poder imitarlo.",
          },
          {
            requirementId: "conversation_explicar_conteo_aceleracion_puente",
            text: "Explicar en inglés cómo contarás la aceleración durante el puente musical.",
          },
          {
            requirementId: "conversation_pedir_palabra_clave_de_vibra",
            text: "Pedir en inglés una palabra clave que resuma la vibra que debe sostener el combo.",
          },
          {
            requirementId:
              "conversation_agradecer_critica_y_pedir_ajuste_accionable",
            text: "Agradecer en inglés una crítica dura y pedir un ajuste accionable para la siguiente toma.",
          },
          {
            requirementId: "english_use_pivot",
            text: 'En inglés, usa la palabra "pivot" para describir un giro controlado dentro del combo.',
          },
          {
            requirementId: "english_use_glide",
            text: 'En inglés, usa "glide" para indicar un desplazamiento suave hacia cámara.',
          },
          {
            requirementId: "english_use_snap",
            text: 'En inglés, usa "snap" para marcar un acento nítido con las manos.',
          },
          {
            requirementId: "english_use_freeze",
            text: 'En inglés, usa "freeze" para señalar una pausa fotográfica al final del conteo.',
          },
          {
            requirementId: "english_use_level_change",
            text: 'En inglés, usa la expresión "level change" para explicar un cambio de altura claro.',
          },
          {
            requirementId: "english_use_hip_isolation",
            text: 'En inglés, usa "hip isolation" para detallar un control específico de cadera.',
          },
          {
            requirementId: "english_use_shoulder_roll",
            text: 'En inglés, usa "shoulder roll" para describir el movimiento inicial del torso.',
          },
          {
            requirementId: "english_use_maintain_eye_contact",
            text: 'En inglés, incluye "maintain eye contact" para indicar cómo te comunicarás con la cámara.',
          },
          {
            requirementId: "english_use_on_the_beat_and_off_beat",
            text: 'En inglés, contrasta "on the beat" y "off-beat" para explicar tu musicalidad en una frase.',
          },
          {
            requirementId: "english_use_from_head_to_toe",
            text: 'En inglés, usa "from head to toe" para enfatizar alineación corporal total.',
          },
          {
            requirementId: "english_use_burst_of_energy",
            text: 'En inglés, emplea la colocación "burst of energy" para describir un momento explosivo.',
          },
          {
            requirementId: "english_use_subtle_transition",
            text: 'En inglés, usa la colocación "subtle transition" para hablar de un enlace entre pasos.',
          },
          {
            requirementId: "english_use_camera_friendly",
            text: 'En inglés, incluye el adjetivo "camera-friendly" para justificar un ajuste del tamaño del gesto.',
          },
          {
            requirementId: "english_use_stage_presence",
            text: 'En inglés, usa "stage presence" para explicar cómo sostendrás la energía entre frases.',
          },
          {
            requirementId: "english_use_to_be_honest_marker",
            text: 'En inglés, inicia tu sugerencia con el conector "To be honest," para matizar tu opinión artística.',
          },
          {
            requirementId: "english_use_phrasal_amp_up",
            text: 'En inglés, usa el phrasal verb "amp up" para pedir más intensidad en un tramo específico.',
          },
          {
            requirementId: "english_use_phrasal_dial_back",
            text: 'En inglés, usa el phrasal verb "dial back" para proponer bajar la exageración en los brazos.',
          },
          {
            requirementId: "english_use_phrasal_lean_into",
            text: 'En inglés, usa el phrasal verb "lean into" para enfatizar que explotarás una calidad concreta.',
          },
          {
            requirementId: "english_use_idiom_play_it_by_ear",
            text: 'En inglés, emplea la expresión "play it by ear" para hablar de improvisar una sección corta.',
          },
          {
            requirementId: "english_use_idiom_sell_it",
            text: 'En inglés, usa la expresión "sell it" para prometer proyección convincente al final.',
          },
          {
            requirementId: "english_use_idiom_nail_it",
            text: 'En inglés, usa "nail it" para afirmar que clavarás la toma principal.',
          },
          {
            requirementId: "english_use_phrasal_start_over",
            text: 'En inglés, usa el phrasal verb "start over" para solicitar reiniciar desde el principio.',
          },
          {
            requirementId: "english_use_phrasal_come_across",
            text: 'En inglés, usa el phrasal verb "come across" para evaluar cómo se percibe tu intención en cámara.',
          },
          {
            requirementId: "english_use_idiom_break_a_leg",
            text: 'En inglés, incluye el idiom "break a leg" para desear buena suerte antes de la toma.',
          },
          {
            requirementId: "english_use_idiom_over_the_top",
            text: 'En inglés, usa "over the top" para describir cuándo la actuación se pasa de dramatismo.',
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
            requirementId: "conversation_negotiate_specific_clue_for_key",
            text: "Negocia con Elias que te dé una pista específica sobre el mecanismo que protege la llave maestra a cambio de una pequeña tarea que puedas cumplir en el taller.",
          },
          {
            requirementId: "conversation_request_demo_of_mechanism",
            text: "Pide que te muestre brevemente cómo funciona un engranaje clave del taller para entender mejor su pista.",
          },
          {
            requirementId: "conversation_verify_deadline_of_wrong_twelve",
            text: "Pregunta exactamente cuánto tiempo queda antes de que suene la doce equivocada y confirma el límite de tiempo.",
          },
          {
            requirementId: "conversation_paraphrase_riddle",
            text: "Reformula en tus propias palabras el acertijo que te dé para confirmar tu comprensión y pide confirmación.",
          },
          {
            requirementId: "conversation_set_clear_boundaries_on_tasks",
            text: "Deja claro qué tareas puedes asumir y cuáles no en el taller para evitar malentendidos.",
          },
          {
            requirementId: "conversation_express_empathy_about_forgetfulness",
            text: "Muestra empatía por su distracción mencionando que entiendes la presión del tiempo, y pídele que se concentre en un solo detalle a la vez.",
          },
          {
            requirementId: "conversation_request_step_by_step_instructions",
            text: "Solicita instrucciones paso a paso para manipular un reloj sin dañarlo.",
          },
          {
            requirementId: "conversation_confirm_safety_precautions",
            text: "Pregunta por las precauciones de seguridad antes de tocar cualquier péndulo o resorte.",
          },
          {
            requirementId: "conversation_probe_reason_for_time_discrepancy",
            text: "Indaga sobre la causa específica de que cada reloj marque una hora distinta y pide un ejemplo concreto.",
          },
          {
            requirementId: "conversation_offer_help_in_exchange_for_hint",
            text: "Ofrece realizar una acción útil en el taller a cambio de una pista adicional sobre la ubicación de la llave.",
          },
          {
            requirementId: "conversation_request_permission_to_handle_clock",
            text: "Pide permiso expreso para manipular un reloj determinado e indica cuál y por qué.",
          },
          {
            requirementId: "conversation_identify_priority_clock",
            text: "Pregunta cuál de todos los relojes debe ajustarse primero para avanzar en el rompecabezas.",
          },
          {
            requirementId: "conversation_present_hypothesis_about_pattern",
            text: "Presenta una hipótesis sobre un patrón entre las horas desajustadas y solicita confirmación o corrección.",
          },
          {
            requirementId: "conversation_ask_for_nonverbal_cue",
            text: "Pide una pista no verbal, como un gesto o señal dentro del taller, para orientar tu siguiente acción.",
          },
          {
            requirementId: "conversation_request_clarity_on_taboo_actions",
            text: "Pregunta explícitamente qué acciones están prohibidas con los mecanismos para no romper nada.",
          },
          {
            requirementId: "conversation_persuade_to_share_extra_hint",
            text: "Convence a Elias de darte una pista extra argumentando que el tiempo apremia y mostrando lo que ya has deducido.",
          },
          {
            requirementId: "conversation_double_check_key_description",
            text: "Pide que describa la llave maestra con detalle (tamaño, forma, metal) y repite la descripción para verificar.",
          },
          {
            requirementId: "conversation_seek_clarification_on_metaphor",
            text: "Cuando use una metáfora mecánica, pídele que la traduzca a una instrucción operativa concreta.",
          },
          {
            requirementId: "conversation_set_success_criteria",
            text: "Define con él qué resultado demostrará que resolviste correctamente el paso actual del rompecabezas.",
          },
          {
            requirementId: "conversation_handle_interruption_politely",
            text: "Si Elias se interrumpe a sí mismo, recuérdale amablemente el punto en el que se quedó y pídele que continúe.",
          },
          {
            requirementId: "conversation_test_understanding_with_example",
            text: "Propón un ejemplo concreto de cómo ajustar un reloj y pide que confirme si ese sería el procedimiento correcto.",
          },
          {
            requirementId: "conversation_request_hint_format_choice",
            text: "Pide elegir entre una pista directa o una pista en forma de acertijo y explica tu preferencia.",
          },
          {
            requirementId: "conversation_express_opinion_on_risk",
            text: "Expresa tu opinión sobre el riesgo de forzar un compartimento y sugiere una alternativa más segura.",
          },
          {
            requirementId: "conversation_agree_on_signal_for_success",
            text: "Acordar con Elias una señal clara que indique que una configuración de reloj es la adecuada antes de proceder.",
          },
          {
            requirementId:
              "conversation_request_final_confirmation_before_action",
            text: "Antes de girar una pieza clave, solicita una confirmación final de que ese es el paso correcto.",
          },
          {
            requirementId: "english_use_phrasal_wind_up",
            text: "Usa el phrasal verb 'wind up' en el sentido de dar cuerda a un reloj para describir una acción que propones hacer.",
          },
          {
            requirementId: "english_use_term_mainspring",
            text: "Incluye la palabra 'mainspring' al hablar de la pieza crítica que podría estar desajustada.",
          },
          {
            requirementId: "english_use_collocation_time_is_of_the_essence",
            text: "Di explícitamente 'time is of the essence' para enfatizar la urgencia de conseguir la pista.",
          },
          {
            requirementId: "english_use_phrasal_figure_out",
            text: "Usa el phrasal verb 'figure out' para explicar lo que intentas deducir del patrón de horas.",
          },
          {
            requirementId: "english_use_idiom_beat_the_clock",
            text: "Emplea el idiom 'beat the clock' para motivar al relojero a darte una pista más rápida.",
          },
          {
            requirementId: "english_use_term_escapement",
            text: "Menciona 'escapement' para preguntar si esa parte afecta la desincronización.",
          },
          {
            requirementId: "english_use_contrast_whereas",
            text: "Contrasta dos relojes usando el conector 'whereas' para señalar una diferencia relevante.",
          },
          {
            requirementId: "english_use_phrasal_point_out",
            text: "Usa el phrasal verb 'point out' para resaltar un detalle que crees crucial.",
          },
          {
            requirementId: "english_use_idiom_in_the_nick_of_time",
            text: "Incluye el idiom 'in the nick of time' al hablar de completar un ajuste crítico.",
          },
          {
            requirementId: "english_use_collocation_hidden_compartment",
            text: "Usa la collocation 'hidden compartment' para proponer dónde podría estar la llave.",
          },
          {
            requirementId: "english_use_phrasal_narrow_down",
            text: "Emplea el phrasal verb 'narrow down' para reducir las posibilidades de búsqueda.",
          },
          {
            requirementId: "english_use_term_pendulum_swing",
            text: "Menciona 'pendulum swing' para pedir que confirme la amplitud correcta.",
          },
          {
            requirementId: "english_use_idiom_turn_back_the_clock",
            text: "Usa el idiom 'turn back the clock' de forma figurada al hablar de corregir un error previo.",
          },
          {
            requirementId: "english_use_phrasal_set_up",
            text: "Usa el phrasal verb 'set up' para describir cómo prepararás el siguiente experimento con los relojes.",
          },
          {
            requirementId: "english_use_term_gear_ratio",
            text: "Incluye 'gear ratio' para preguntar si la relación de engranajes está mal configurada.",
          },
          {
            requirementId: "english_use_discourse_marker_nevertheless",
            text: "Introduce una objeción con 'nevertheless' al responder a una advertencia del relojero.",
          },
          {
            requirementId: "english_use_phrasal_back_up",
            text: "Usa el phrasal verb 'back up' para proponer una alternativa de respaldo si falla el primer intento.",
          },
          {
            requirementId: "english_use_idiom_against_the_clock",
            text: "Emplea el idiom 'against the clock' para describir la presión temporal del rompecabezas.",
          },
          {
            requirementId: "english_use_collocation_margin_of_error",
            text: "Usa la collocation 'margin of error' al discutir la precisión necesaria del ajuste.",
          },
          {
            requirementId: "english_use_phrasal_hand_over",
            text: "Emplea el phrasal verb 'hand over' para pedir que te entregue una herramienta específica.",
          },
          {
            requirementId: "english_use_term_calibrate",
            text: "Incluye el verbo 'calibrate' para proponer una acción sobre un reloj concreto.",
          },
          {
            requirementId: "english_use_discourse_marker_incidentally",
            text: "Añade 'incidentally' para introducir un detalle que podría ayudar a la búsqueda.",
          },
          {
            requirementId: "english_use_phrasal_break_down",
            text: "Usa el phrasal verb 'break down' para desglosar el problema en pasos manejables.",
          },
          {
            requirementId: "english_use_idiom_buy_time",
            text: "Incluye el idiom 'buy time' para pedir una pista rápida que te permita ganar segundos.",
          },
          {
            requirementId: "english_use_collocation_master_key",
            text: "Usa la collocation 'master key' al confirmar el objeto exacto que buscas.",
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
            requirementId: "conversation_describir_puesto_misterioso",
            text: "Describe en inglés lo que ves en el puesto de Marcel y menciona al menos dos objetos que te intrigan.",
          },
          {
            requirementId: "conversation_pedir_demostracion_pasoa_paso",
            text: "Pide en inglés una demostración paso a paso de cómo se activa un amuleto que supuestamente abre cerraduras.",
          },
          {
            requirementId: "conversation_establecer_limite_sin_pago_adelantado",
            text: "Deja claro en inglés que no entregarás dinero por adelantado hasta ver una prueba funcional.",
          },
          {
            requirementId: "conversation_preguntar_costes_ocultos",
            text: "Pregunta en inglés si hay costes ocultos, condiciones especiales o penalizaciones por usar el objeto.",
          },
          {
            requirementId: "conversation_proponer_prueba_controlada",
            text: "Propón en inglés una prueba controlada de un minuto para verificar que el objeto hace lo prometido.",
          },
          {
            requirementId: "conversation_verificar_seguridad_uso",
            text: "Pregunta en inglés si el objeto es seguro y qué precauciones deben tomarse al manipularlo.",
          },
          {
            requirementId: "conversation_aclarar_terminos_acertijo",
            text: "Pide en inglés que aclare los términos ambiguos de su acertijo con un ejemplo concreto.",
          },
          {
            requirementId: "conversation_pedir_que_hable_mas_despacio",
            text: "Solicita en inglés que repita su explicación más despacio y usando oraciones más simples.",
          },
          {
            requirementId: "conversation_elogiar_y_solicitar_pista",
            text: "Elogia su espectáculo en inglés y, acto seguido, pide amablemente una pista adicional.",
          },
          {
            requirementId: "conversation_comparar_dos_objetos",
            text: "Compara en inglés dos artefactos de la mesa y pregunta cuál es más fiable para abrir puertas.",
          },
          {
            requirementId: "conversation_justificar_eleccion_objeto",
            text: "Explica en inglés por qué eliges un objeto específico y qué resultado esperas obtener.",
          },
          {
            requirementId: "conversation_confirmar_politica_devolucion",
            text: "Confirma en inglés las condiciones de devolución si el objeto no funciona en el escape room.",
          },
          {
            requirementId: "conversation_marcar_plazo_decision",
            text: "Indica en inglés un plazo breve para decidir e invita al vendedor a darte su mejor oferta ahora.",
          },
          {
            requirementId: "conversation_se_alar_inconsistencia",
            text: "Señala en inglés una contradicción entre lo que prometió y lo que demuestra, y pide que lo aclare.",
          },
          {
            requirementId: "conversation_preguntar_procedencia_objeto",
            text: "Pregunta en inglés el origen del objeto y si tiene alguna historia verificable.",
          },
          {
            requirementId: "conversation_preguntar_significado_simbolo",
            text: "Pregunta en inglés qué significa un símbolo grabado en el talismán y cómo influye en su uso.",
          },
          {
            requirementId: "conversation_pedir_indicador_de_autenticidad",
            text: "Pide en inglés una señal concreta para distinguir un objeto auténtico de una copia.",
          },
          {
            requirementId: "conversation_resumir_acuerdo_en_voz_alta",
            text: "Resume en inglés los términos del trato y pide confirmación explícita del vendedor.",
          },
          {
            requirementId: "conversation_consultar_equipo_brevemente",
            text: "Pide en inglés un momento para consultar con tu equipo y vuelve con una decisión clara.",
          },
          {
            requirementId: "conversation_pedir_hablar_aparte",
            text: "Solicita en inglés hablar con el vendedor aparte, lejos del bullicio, para una pregunta sensible.",
          },
          {
            requirementId:
              "conversation_reaccionar_truco_con_escepticismo_cortesia",
            text: "Reacciona en inglés a un truco sorprendente mostrando escepticismo cortés y pidiendo repetición.",
          },
          {
            requirementId: "conversation_establecer_limite_objetos_personales",
            text: "Aclara en inglés que no entregarás objetos personales valiosos como parte del trato.",
          },
          {
            requirementId: "conversation_solicitar_prueba_por_escrito",
            text: "Pide en inglés una nota breve con la promesa clave del objeto y las condiciones del intercambio.",
          },
          {
            requirementId: "conversation_persuadir_para_pista_bonificada",
            text: "Intenta persuadir en inglés al vendedor para que añada una pista extra si resuelves un mini-reto ahora.",
          },
          {
            requirementId: "conversation_confirmar_uso_correcto_instrucciones",
            text: "Repite en inglés las instrucciones de activación del objeto para confirmar que las has entendido bien.",
          },
          {
            requirementId: "english_use_smoke_and_mirrors",
            text: 'Usa la expresión en inglés "smoke and mirrors" para describir una táctica del vendedor que te genera dudas.',
          },
          {
            requirementId: "english_use_sleight_of_hand",
            text: 'Incluye en tu frase la locución inglesa "sleight of hand" al comentar un truco que acabas de ver.',
          },
          {
            requirementId: "english_use_call_your_bluff",
            text: 'Di en inglés que vas a "call your bluff" si el vendedor exagera la potencia del objeto.',
          },
          {
            requirementId: "english_use_red_herring",
            text: 'Usa el término inglés "red herring" para señalar una pista que crees que desvía la atención.',
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
            requirementId: "english_use_authenticity_certificate",
            text: 'Pregunta en inglés por un "certificate of authenticity" para el talismán.',
          },
          {
            requirementId: "english_use_tamper_proof_seal",
            text: 'Menciona en inglés que esperas un "tamper-proof seal" en el paquete del objeto.',
          },
          {
            requirementId: "english_use_limited_time_offer",
            text: 'Retoriza en inglés si su "limited-time offer" es real o parte del espectáculo.',
          },
          {
            requirementId: "english_use_the_real_deal",
            text: 'Pregunta en inglés si el amuleto es "the real deal" o solo un recuerdo decorativo.',
          },
          {
            requirementId: "english_use_up_my_sleeve",
            text: 'Insinúa en inglés que el vendedor aún tiene algo "up your sleeve" respecto a las pistas.',
          },
          {
            requirementId: "english_use_behind_the_scenes",
            text: 'Pide en inglés detalles "behind the scenes" de cómo se supone que funciona el objeto.',
          },
          {
            requirementId: "english_use_figure_out_pv",
            text: 'Di en inglés que necesitas "figure out" el mecanismo antes de aceptar el trato.',
          },
          {
            requirementId: "english_use_size_up_pv",
            text: 'Explica en inglés que primero vas a "size up" el riesgo y el beneficio del intercambio.',
          },
          {
            requirementId: "english_use_hand_over_pv",
            text: 'Deja claro en inglés que no vas a "hand over" nada valioso sin una prueba convincente.',
          },
          {
            requirementId: "english_use_talk_me_through_pv",
            text: 'Pide en inglés que te "talk me through" el proceso de activación paso a paso.',
          },
          {
            requirementId: "english_use_back_down_pv",
            text: 'Anuncia en inglés que no vas a "back down" de pedir condiciones claras.',
          },
          {
            requirementId: "english_use_come_clean_pv",
            text: 'Solicita en inglés que el vendedor "come clean" sobre cualquier limitación del artefacto.',
          },
          {
            requirementId: "english_use_double_check_pv",
            text: 'Indica en inglés que quieres "double-check" las instrucciones antes de usar el objeto.',
          },
          {
            requirementId: "english_use_piece_together_pv",
            text: 'Comenta en inglés que vas a "piece together" las pistas del acertijo con tu equipo.',
          },
          {
            requirementId: "english_use_throw_me_off_pv",
            text: 'Di en inglés que un detalle del truco te "threw me off" y pide aclaración.',
          },
          {
            requirementId: "english_use_bank_on_pv",
            text: 'Aclara en inglés si puedes "bank on" la promesa de que el objeto abrirá la puerta.',
          },
          {
            requirementId: "english_use_hold_up_pv",
            text: 'Pregunta en inglés si el amuleto "will hold up" bajo presión o uso repetido.',
          },
          {
            requirementId: "english_use_swap_out_pv",
            text: 'Propón en inglés "swap out" un objeto por otro si la primera opción no funciona.',
          },
          {
            requirementId: "english_use_play_along_pv",
            text: 'Di en inglés que vas a "play along" con el juego del vendedor solo si da una pista útil.',
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
            requirementId: "conversation_parafrasear_metafora_y_confirmar",
            text: "Parafrasea en prosa una metáfora de su canción y pide confirmación de si tu interpretación es correcta.",
          },
          {
            requirementId: "conversation_pedir_cambio_a_prosa_breve",
            text: "Solicita que explique una línea concreta en prosa durante unos segundos para evitar ambigüedades.",
          },
          {
            requirementId: "conversation_negociar_roles_escucha_anotacion",
            text: "Propón y acuerda con el grupo quién escucha, quién anota y quién busca objetos relacionados con la letra.",
          },
          {
            requirementId: "conversation_marcar_limite_ruido_grupo",
            text: "Establece un límite de ruido pidiendo silencio al grupo durante un intervalo claro para oír mejor la canción.",
          },
          {
            requirementId:
              "conversation_formular_pregunta_cerrada_origen_pista",
            text: "Haz una pregunta cerrada para confirmar si la pista se relaciona con música, libros o ambos.",
          },
          {
            requirementId: "conversation_pedir_repeticion_palabra_homofona",
            text: "Pide que repita una palabra que suena como un homófono y solicita una aclaración de su significado en la pista.",
          },
          {
            requirementId:
              "conversation_explicar_por_que_interpretacion_fallida",
            text: "Explica por qué una interpretación previa del grupo no encaja con lo que canta Beatrice.",
          },
          {
            requirementId: "conversation_proponer_hipotesis_objeto_estanteria",
            text: "Propón una hipótesis que vincule un verso con una estantería o un libro específico y pide al grupo validarla.",
          },
          {
            requirementId:
              "conversation_pedir_tonalidad_distinta_para_distinguir",
            text: "Pide que cante una estrofa en una tonalidad distinta para distinguir palabras similares.",
          },
          {
            requirementId:
              "conversation_confirmar_secuencia_acciones_estribillo",
            text: "Resume la secuencia de acciones sugerida por el estribillo y pide confirmación a Beatrice.",
          },
          {
            requirementId: "conversation_solicitar_pista_condicion_intercambio",
            text: "Negocia con Beatrice una pista adicional a cambio de cumplir una condición cantada por ella.",
          },
          {
            requirementId: "conversation_mostrar_empatia_frustracion_equipo",
            text: "Expresa empatía hacia un compañero frustrado y sugiere un paso concreto para avanzar.",
          },
          {
            requirementId: "conversation_pedir_permiso_anotar_letra",
            text: "Pide permiso explícito para transcribir fragmentos de la letra mientras canta.",
          },
          {
            requirementId: "conversation_describir_objeto_relacion_rima",
            text: "Describe en voz alta un objeto hallado y explica cómo se relaciona con una rima específica.",
          },
          {
            requirementId: "conversation_preguntar_si_estancia_contiene_trampa",
            text: "Pregunta si en su canción hay una pista falsa intencional y pide una señal para diferenciarla.",
          },
          {
            requirementId:
              "conversation_probar_combinacion_y_reportar_resultado",
            text: "Prueba una combinación inspirada en la canción y reporta al grupo el resultado exacto.",
          },
          {
            requirementId: "conversation_pedir_aclaracion_doble_sentido",
            text: "Solicita aclaración sobre un posible doble sentido literario que afecte la acción a tomar.",
          },
          {
            requirementId: "conversation_proponer_plan_con_tiempo_limite",
            text: "Propón un plan de escucha, verificación y prueba con un tiempo límite concreto y consigue acuerdo del grupo.",
          },
          {
            requirementId:
              "conversation_validar_con_beatrice_objetivo_inmediato",
            text: "Pregunta a Beatrice si el objetivo inmediato es encontrar un libro, abrir un compartimento o resolver una secuencia musical.",
          },
          {
            requirementId:
              "conversation_pedir_confirmacion_final_accion_riesgosa",
            text: "Pide confirmación final antes de accionar una palanca o mecanismo mencionado en la canción.",
          },
          {
            requirementId:
              "conversation_preguntar_si_cambio_estrofa_reinicia_pista",
            text: "Pregunta si la pista se reinicia o se acumula cuando cambia la estrofa.",
          },
          {
            requirementId: "conversation_persuadir_equipo_probar_alternativa",
            text: "Persuade al equipo para que pruebe una alternativa basándote en una metáfora específica que cantó.",
          },
          {
            requirementId: "conversation_agradecer_ayuda_con_razon",
            text: "Agradece a Beatrice por una aclaración concreta e indica cómo te ayudó a avanzar.",
          },
          {
            requirementId: "english_usar_read_between_the_lines",
            text: "Usa el idiom inglés 'read between the lines' al explicar cómo interpretaste la metáfora clave.",
          },
          {
            requirementId: "english_usar_pick_up_on",
            text: "Usa el phrasal verb inglés 'pick up on' para señalar el detalle sutil que detectaste en el estribillo.",
          },
          {
            requirementId: "english_usar_in_a_nutshell",
            text: "Usa la expresión inglesa 'in a nutshell' para resumir la pista en una frase.",
          },
          {
            requirementId: "english_usar_rule_out",
            text: "Usa el phrasal verb inglés 'rule out' para descartar una interpretación equivocada de la letra.",
          },
          {
            requirementId: "english_usar_zero_in_on",
            text: "Usa el phrasal verb inglés 'zero in on' para explicar a qué verso te vas a enfocar.",
          },
          {
            requirementId: "english_usar_red_herring",
            text: "Usa el idiom inglés 'red herring' para advertir sobre una pista falsa posible.",
          },
          {
            requirementId: "english_usar_piece_together",
            text: "Usa el phrasal verb inglés 'piece together' para describir cómo uniste las pistas de distintas estrofas.",
          },
          {
            requirementId: "english_usar_hit_the_nail_on_the_head",
            text: "Usa el idiom inglés 'hit the nail on the head' para felicitar una interpretación precisa de un compañero.",
          },
          {
            requirementId: "english_usar_jot_down",
            text: "Usa el phrasal verb inglés 'jot down' para indicar que vas a anotar palabras específicas de la canción.",
          },
          {
            requirementId: "english_usar_read_aloud",
            text: "Usa la collocation inglesa 'read aloud' para pedir que alguien lea un verso que encontraron en un libro.",
          },
          {
            requirementId: "english_usar_double_meaning",
            text: "Usa la expresión inglesa 'double meaning' para hablar de un posible doble sentido en la metáfora.",
          },
          {
            requirementId: "english_usar_hidden_compartment",
            text: "Usa el sintagma inglés 'hidden compartment' al proponer dónde podría estar la cerradura secreta.",
          },
          {
            requirementId: "english_usar_key_signature",
            text: "Usa el término musical inglés 'key signature' para relacionar la tonalidad con un código numérico.",
          },
          {
            requirementId: "english_usar_tie_in_with",
            text: "Usa el phrasal verb inglés 'tie in with' para vincular un verso con un objeto de la estantería.",
          },
          {
            requirementId: "english_usar_working_hypothesis",
            text: "Usa la collocation inglesa 'working hypothesis' para presentar tu hipótesis actual sobre la pista.",
          },
          {
            requirementId: "english_usar_out_of_tune",
            text: "Usa la expresión inglesa 'out of tune' para sugerir que una nota desafinada es una clave deliberada.",
          },
          {
            requirementId: "english_usar_figure_out",
            text: "Usa el phrasal verb inglés 'figure out' para explicar el paso final que hay que resolver.",
          },
          {
            requirementId: "english_usar_line_up",
            text: "Usa el phrasal verb inglés 'line up' para describir cómo alinearás letras o lomos de libros.",
          },
          {
            requirementId: "english_usar_subtle_clue",
            text: "Usa la collocation inglesa 'subtle clue' para referirte a un detalle casi imperceptible en la rima.",
          },
          {
            requirementId: "english_usar_literary_device",
            text: "Usa el término inglés 'literary device' para identificar el recurso que esconde la pista.",
          },
          {
            requirementId: "english_usar_back_up",
            text: "Usa el phrasal verb inglés 'back up' para pedir evidencia que respalde una interpretación.",
          },
          {
            requirementId: "english_usar_the_missing_link",
            text: "Usa el idiom inglés 'the missing link' para describir el elemento que falta para abrir la puerta.",
          },
          {
            requirementId: "english_usar_by_the_book",
            text: "Usa el idiom inglés 'by the book' para proponer seguir al pie de la letra la instrucción cantada.",
          },
          {
            requirementId: "english_usar_sound_pattern",
            text: "Usa la collocation inglesa 'sound pattern' para explicar un patrón rítmico que codifica números.",
          },
          {
            requirementId: "english_usar_reading_between_the_lines_asap",
            text: "Usa el marcador discursivo 'frankly' junto con 'reading between the lines' para introducir tu conclusión rápida sobre la pista.",
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
            requirementId: "conversation_indagar_sabotaje_pruebas",
            text: "Pregunta por qué cree que hubo sabotaje y solicita una pista o evidencia concreta.",
          },
          {
            requirementId: "conversation_acceso_despensa_candado_rojo",
            text: "Solicita que te muestre la despensa con el candado rojo y pide permiso para intentar abrirla legalmente.",
          },
          {
            requirementId: "conversation_confirmar_temporizador_puerta_curry",
            text: "Confirma cuánto tiempo queda antes de que la puerta con olor a curry se cierre y quién controlará el temporizador.",
          },
          {
            requirementId: "conversation_repartir_tareas_roles_claros",
            text: "Propón dividirse las tareas y acuerda con el chef qué hará cada uno de forma específica.",
          },
          {
            requirementId: "conversation_mostrar_empatia_calmar_chef",
            text: "Expresa empatía por la presión del chef y pídele con tacto que respire para coordinarse mejor.",
          },
          {
            requirementId: "conversation_orden_pasos_receta",
            text: "Pide que te explique el orden exacto de los pasos de la receta para no improvisar.",
          },
          {
            requirementId: "conversation_verificar_restricciones_seguridad",
            text: "Pregunta si hay alergias, normas de higiene o restricciones que debas respetar para evitar contaminación cruzada.",
          },
          {
            requirementId: "conversation_revisar_perillas_extractor_seguridad",
            text: "Solicita revisar con él las perillas del fuego y el extractor para confirmar que no hay riesgos.",
          },
          {
            requirementId: "conversation_negociar_mover_etiquetar_objetos",
            text: "Negocia permiso para mover utensilios e ingredientes y propone etiquetar lo hallado.",
          },
          {
            requirementId: "conversation_pedir_plano_estaciones_cocina",
            text: "Pide un esquema rápido de las estaciones de la cocina y dónde suelen guardarse las especias.",
          },
          {
            requirementId: "conversation_pedir_demostracion_prueba_olfato",
            text: "Solicita que te muestre cómo reconoce el curry auténtico con su prueba de olfato.",
          },
          {
            requirementId: "conversation_pedir_repeticion_pista_clave",
            text: "Pide que repita una pista clave y confirma en tus palabras que la entendiste bien.",
          },
          {
            requirementId: "conversation_resumir_pistas_avances",
            text: "Haz un resumen breve de las pistas y avances para confirmar que van alineados.",
          },
          {
            requirementId: "conversation_cuestional_asuncion_evidencia",
            text: "Cuestiona con cortesía una suposición apresurada del chef y aporta una observación verificable.",
          },
          {
            requirementId: "conversation_describir_envases_colores",
            text: "Pide descripciones de los frascos de especias (tapas, etiquetas, colores) para identificarlos rápido.",
          },
          {
            requirementId: "conversation_probar_sustituto_lote_pequeno",
            text: "Propón probar un sustituto en una porción pequeña antes de añadirlo a toda la olla.",
          },
          {
            requirementId: "conversation_inspeccionar_basura_empaques",
            text: "Pide revisar la papelera en busca de empaques o notas que indiquen qué se usó o se tiró.",
          },
          {
            requirementId: "conversation_establecer_tono_lento_limites",
            text: "Con respeto, pide al chef que baje el tono y hable más despacio para evitar errores.",
          },
          {
            requirementId: "conversation_autorizacion_romper_sello_cinta",
            text: "Solicita autorización explícita para cortar una cinta o romper un sello si es necesario.",
          },
          {
            requirementId: "conversation_priorizar_ingrediente_critico",
            text: "Pide que prioricen juntos qué ingrediente es más crítico para buscar primero.",
          },
          {
            requirementId: "conversation_asumir_control_alarma_tiempo",
            text: "Ofrécete a llevar el control del cronómetro y confirma que el chef lo aprueba.",
          },
          {
            requirementId: "conversation_pedir_patron_estanteria_especias",
            text: "Pregunta si hay un patrón o código en la estantería de especias y solicita que te lo explique.",
          },
          {
            requirementId: "conversation_persuadir_confiar_en_plan",
            text: "Intenta persuadir al chef para que siga tu plan estructurado en lugar de buscar al azar.",
          },
          {
            requirementId: "conversation_definir_criterio_sabor_final",
            text: "Confirma con el chef qué sabor o textura exacta validará el éxito del platillo antes de servir.",
          },
          {
            requirementId: "english_usar_sabotage_collocation",
            text: "Usa en inglés la palabra 'sabotage' o la collocation 'was sabotaged' para describir lo que ocurrió en la cocina.",
          },
          {
            requirementId: "english_usar_cross_contamination",
            text: "Menciona en inglés 'cross-contamination' al hablar de higiene y manejo de ingredientes.",
          },
          {
            requirementId: "english_usar_expiry_or_use_by_date",
            text: "Habla en inglés de la fecha de caducidad usando 'expiry date' o 'use-by date' al revisar empaques.",
          },
          {
            requirementId: "english_usar_time_is_of_the_essence",
            text: "Enfatiza urgencia usando en inglés la expresión 'time is of the essence'.",
          },
          {
            requirementId: "english_usar_in_the_nick_of_time",
            text: "Indica que deben terminar a tiempo usando la expresión en inglés 'in the nick of time'.",
          },
          {
            requirementId: "english_usar_phrasal_run_out_of",
            text: "Declara en inglés que se acabó un ingrediente usando el phrasal verb 'run out of'.",
          },
          {
            requirementId: "english_usar_phrasal_look_for",
            text: "Explica en inglés qué vas a buscar usando el phrasal verb 'look for'.",
          },
          {
            requirementId: "english_usar_phrasal_rule_out",
            text: "Propón descartar una hipótesis usando en inglés el phrasal verb 'rule out'.",
          },
          {
            requirementId: "english_usar_phrasal_double_check",
            text: "Sugiere verificar de nuevo usando en inglés el verbo compuesto 'double-check'.",
          },
          {
            requirementId: "english_usar_phrasal_turn_down_the_heat",
            text: "Pide bajar el fuego usando en inglés el phrasal verb 'turn down the heat'.",
          },
          {
            requirementId: "english_usar_phrasal_set_off_alarm",
            text: "Advierte en inglés sobre activar la alarma usando el phrasal verb 'set off' con 'alarm'.",
          },
          {
            requirementId: "english_usar_phrasal_figure_out",
            text: "Di en inglés que necesitan deducir la pista usando el phrasal verb 'figure out'.",
          },
          {
            requirementId: "english_usar_phrasal_swap_out",
            text: "Propón en inglés sustituir un ingrediente usando el phrasal verb 'swap out'.",
          },
          {
            requirementId: "english_usar_phrasal_point_out",
            text: "Señala una pista específica usando en inglés el phrasal verb 'point out'.",
          },
          {
            requirementId: "english_usar_phrasal_back_up_with_evidence",
            text: "Respalda tu idea usando en inglés 'back up' con la palabra 'evidence'.",
          },
          {
            requirementId: "english_usar_phrasal_hand_over_key",
            text: "Pide en inglés que te entreguen una llave usando el phrasal verb 'hand over'.",
          },
          {
            requirementId: "english_usar_phrasal_seal_off_area",
            text: "Sugiere en inglés acordonar una zona sensible usando el phrasal verb 'seal off'.",
          },
          {
            requirementId: "english_usar_phrasal_speed_up_prep",
            text: "Propón acelerar la preparación usando en inglés el phrasal verb 'speed up'.",
          },
          {
            requirementId: "english_usar_phrasal_calm_down",
            text: "Invita al chef a tranquilizarse usando en inglés el phrasal verb 'calm down'.",
          },
          {
            requirementId: "english_usar_idiom_red_herring",
            text: "Advierte sobre una pista falsa usando en inglés el idiom 'red herring'.",
          },
          {
            requirementId: "english_usar_idiom_on_the_same_page",
            text: "Confirma coordinación usando en inglés el idiom 'on the same page'.",
          },
          {
            requirementId: "english_usar_idiom_spill_the_beans",
            text: "Pide que revelen información oculta usando en inglés el idiom 'spill the beans'.",
          },
          {
            requirementId: "english_usar_under_pressure_collocation",
            text: "Reconoce la tensión usando en inglés la collocation 'under pressure'.",
          },
          {
            requirementId: "english_usar_once_and_for_all",
            text: "Cierra una discusión proponiendo en inglés resolverlo 'once and for all'.",
          },
          {
            requirementId: "english_usar_idiom_keep_your_cool",
            text: "Aconseja mantener la calma usando en inglés el idiom 'keep your cool'.",
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
            requirementId: "conversation_confirmar_reglas_tres_pruebas",
            text: "Confirma con Sir Reginald que hay exactamente tres pruebas y explica brevemente qué entiendes por cada una.",
          },
          {
            requirementId: "conversation_pedir_aclaracion_reglas_pistas",
            text: "Pregunta bajo qué condiciones el guardián da pistas adicionales y reformula su respuesta para verificar entendimiento.",
          },
          {
            requirementId: "conversation_parafrasear_enigma",
            text: "Parafrasea en tus propias palabras el primer enigma que presente el guardián para mostrar comprensión.",
          },
          {
            requirementId: "conversation_explicar_hipotesis",
            text: "Explica una hipótesis sobre el mecanismo de la torre y justifica por qué podría ser correcta.",
          },
          {
            requirementId: "conversation_detectar_contradiccion",
            text: "Señala una posible contradicción en las pistas del guardián y pide confirmación cortésmente.",
          },
          {
            requirementId: "conversation_establecer_plan_equipo",
            text: "Propón un plan de acción de dos pasos para tu grupo antes de responder la siguiente prueba.",
          },
          {
            requirementId: "conversation_asignar_roles_breves",
            text: "Asigna brevemente un rol lógico a dos compañeros para avanzar más rápido y pide la aprobación del guardián.",
          },
          {
            requirementId: "conversation_admitir_error_y_corregir",
            text: "Reconoce un error propio en el razonamiento anterior y presenta una corrección clara.",
          },
          {
            requirementId: "conversation_mostrar_empatia_equipo",
            text: "Expresa empatía hacia un compañero nervioso y ofrece una recomendación práctica para mantener la calma.",
          },
          {
            requirementId: "conversation_negociar_tiempo_extra",
            text: "Negocia con el guardián unos segundos extra argumentando que tu deducción necesita verificación final.",
          },
          {
            requirementId: "conversation_pedir_ejemplo_regla",
            text: "Pide un ejemplo concreto que ilustre una regla de la prueba actual y explica cómo te ayudaría.",
          },
          {
            requirementId: "conversation_responder_humor_oscuro",
            text: "Responde con compostura a un comentario de humor oscuro del guardián, manteniendo el foco en la lógica.",
          },
          {
            requirementId: "conversation_establecer_limites_honestidad",
            text: "Declara que no mentirás en la prueba de confianza y explica por qué eso beneficia a todos.",
          },
          {
            requirementId: "conversation_justificar_eleccion_final",
            text: "Justifica tu elección final entre dos opciones, comparando riesgos y evidencias.",
          },
          {
            requirementId: "conversation_pedir_confirmacion_restricciones",
            text: "Pide confirmación explícita de una restricción clave de la sala antes de tomar una decisión.",
          },
          {
            requirementId: "conversation_identificar_pista_trampa",
            text: "Identifica en voz alta una pista que podría ser una trampa y explica por qué sospechas de ella.",
          },
          {
            requirementId: "conversation_formular_pregunta_si_o_no",
            text: "Formula una pregunta de sí o no que acote significativamente el problema actual.",
          },
          {
            requirementId: "conversation_resumir_progreso",
            text: "Resume en dos frases el progreso del equipo y qué falta para superar la prueba presente.",
          },
          {
            requirementId: "conversation_persuadir_guardian_merito",
            text: "Intenta persuadir al guardián de que tu razonamiento merece una mínima pista adicional.",
          },
          {
            requirementId: "conversation_reconocer_incetidumbre_medida",
            text: "Declara con precisión qué parte de tu razonamiento es incierta y qué datos necesitas para confirmarla.",
          },
          {
            requirementId: "conversation_solicitar_verificacion_pasito",
            text: "Pide permiso para verificar un paso intermedio de tu solución y explica su importancia.",
          },
          {
            requirementId: "conversation_interpretar_metafora_guardian",
            text: "Interpreta una metáfora usada por el guardián y relaciona su posible significado con el enigma.",
          },
          {
            requirementId: "conversation_plantear_condicion_ganar_confianza",
            text: "Propón una condición concreta para demostrar tu honestidad al guardián y pide su evaluación.",
          },
          {
            requirementId: "conversation_preguntar_consecuencia_fallo",
            text: "Pregunta por la consecuencia específica de fallar la prueba actual y ajusta tu estrategia según la respuesta.",
          },
          {
            requirementId: "conversation_cerrar_trato_con_promesa",
            text: "Cierra un acuerdo verbal con el guardián sobre avanzar un tramo de la escalera si cumples una condición clara.",
          },
          {
            requirementId: "english_usar_phrasal_rule_out",
            text: 'Incluye el phrasal verb en inglés "rule out" al descartar una interpretación de una pista.',
          },
          {
            requirementId: "english_usar_collocation_draw_a_conclusion",
            text: 'Usa la collocation en inglés "draw a conclusion" al presentar tu resultado lógico.',
          },
          {
            requirementId: "english_usar_idiom_red_herring",
            text: 'Incluye el idiom en inglés "red herring" para señalar una pista engañosa.',
          },
          {
            requirementId: "english_usar_phrasal_figure_out",
            text: 'Emplea el phrasal verb en inglés "figure out" al explicar cómo resolverás el enigma.',
          },
          {
            requirementId: "english_usar_vocab_conundrum_paradox",
            text: 'Usa las palabras en inglés "conundrum" y "paradox" al describir la dificultad central.',
          },
          {
            requirementId: "english_usar_idiom_cut_to_the_chase",
            text: 'Incluye el idiom en inglés "cut to the chase" para pasar directamente a tu propuesta.',
          },
          {
            requirementId: "english_usar_phrasal_back_up",
            text: 'Usa el phrasal verb en inglés "back up" para pedir o ofrecer evidencia que respalde tu idea.',
          },
          {
            requirementId: "english_usar_collocation_weigh_the_options",
            text: 'Incluye la collocation en inglés "weigh the options" al comparar dos caminos posibles.',
          },
          {
            requirementId: "english_usar_idiom_a_leap_of_faith",
            text: 'Emplea el idiom en inglés "a leap of faith" al hablar de la prueba de confianza.',
          },
          {
            requirementId: "english_usar_phrasal_narrow_down",
            text: 'Incluye el phrasal verb en inglés "narrow down" para mostrar cómo acotas las posibilidades.',
          },
          {
            requirementId: "english_usar_conectores_nevertheless_moreover",
            text: 'Usa los marcadores discursivos en inglés "nevertheless" y "moreover" para contrastar y añadir razones.',
          },
          {
            requirementId: "english_usar_vocab_premise_inference",
            text: 'Emplea las palabras en inglés "premise" e "inference" al exponer tu razonamiento.',
          },
          {
            requirementId: "english_usar_idiom_think_outside_the_box",
            text: 'Incluye el idiom en inglés "think outside the box" al proponer una solución creativa.',
          },
          {
            requirementId: "english_usar_phrasal_double_check",
            text: 'Usa el phrasal verb en inglés "double-check" al hablar de verificar un paso crítico.',
          },
          {
            requirementId: "english_usar_collocation_meet_the_conditions",
            text: 'Incluye la collocation en inglés "meet the conditions" al negociar con el guardián.',
          },
          {
            requirementId: "english_usar_idiom_the_elephant_in_the_room",
            text: 'Emplea el idiom en inglés "the elephant in the room" para abordar una duda evidente del grupo.',
          },
          {
            requirementId: "english_usar_phrasal_point_out",
            text: 'Usa el phrasal verb en inglés "point out" al señalar una contradicción.',
          },
          {
            requirementId: "english_usar_vocab_ambiguity_misdirection",
            text: 'Incluye las palabras en inglés "ambiguity" y "misdirection" al analizar las pistas.',
          },
          {
            requirementId: "english_usar_idiom_too_good_to_be_true",
            text: 'Emplea el idiom en inglés "too good to be true" al sospechar de una solución fácil.',
          },
          {
            requirementId: "english_usar_phrasal_come_clean",
            text: 'Incluye el phrasal verb en inglés "come clean" al hablar de honestidad con el guardián.',
          },
          {
            requirementId: "english_usar_collocation_bear_in_mind",
            text: 'Usa la collocation en inglés "bear in mind" para introducir una restricción importante.',
          },
          {
            requirementId: "english_usar_idiom_on_the_same_page",
            text: 'Incluye el idiom en inglés "on the same page" para coordinar al equipo.',
          },
          {
            requirementId: "english_usar_phrasal_lay_out",
            text: 'Emplea el phrasal verb en inglés "lay out" para presentar tu plan paso a paso.',
          },
          {
            requirementId: "english_usar_vocab_plausible_credible_deceptive",
            text: 'Usa los adjetivos en inglés "plausible", "credible" y "deceptive" al evaluar pistas.',
          },
          {
            requirementId: "english_usar_idiom_a_shot_in_the_dark",
            text: 'Incluye el idiom en inglés "a shot in the dark" al proponer una conjetura arriesgada.',
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
            requirementId: "conversation_pedir_rol_simple",
            text: "Pide que te asignen una tarea sencilla y concreta para empezar de inmediato.",
          },
          {
            requirementId: "conversation_aclarar_no_modelo",
            text: "Aclara explícitamente que no eres modelo ni diseñador y pregunta dónde puedes ser más útil.",
          },
          {
            requirementId: "conversation_pedir_ubicacion_segura",
            text: "Pregunta en qué zona puedes esperar sin bloquear el paso ni interferir.",
          },
          {
            requirementId: "conversation_pedir_tarjeta_acceso",
            text: "Pregunta si necesitas una credencial, pase o cinta para que no te detengan los guardias backstage.",
          },
          {
            requirementId: "conversation_confirmar_prioridades",
            text: "Pide la lista corta de prioridades del momento y repite la primera para confirmar que entendiste.",
          },
          {
            requirementId: "conversation_preguntar_glosario",
            text: "Pide aclaración de un término de jerga de vestuario que Margo use y confirma su significado con tus palabras.",
          },
          {
            requirementId: "conversation_ofrecer_ayuda_materiales",
            text: "Ofrece traer un objeto específico que falte (por ejemplo, alfileres o cinta) y pregunta a quién entregarlo.",
          },
          {
            requirementId: "conversation_permiso_mover_prendas",
            text: "Pide permiso explícito antes de mover un vestido o una percha de un rack a otro.",
          },
          {
            requirementId: "conversation_reaccion_caos_empatia",
            text: "Muestra empatía por el caos en una frase breve y anima al equipo con un comentario positivo.",
          },
          {
            requirementId: "conversation_discutir_limites_personales",
            text: "Indica un límite físico claro (por ejemplo, no puedes levantar peso por una lesión) y propone una alternativa útil.",
          },
          {
            requirementId: "conversation_confirmar_tiempo_restante",
            text: "Pregunta cuánto falta para que empiece la siguiente salida a pasarela y ajusta tu propuesta de ayuda según el tiempo.",
          },
          {
            requirementId: "conversation_pedir_muestra_proceso",
            text: "Pide que te muestren una vez un microproceso (por ejemplo, cómo etiquetar un look) y confirma que puedes repetirlo.",
          },
          {
            requirementId: "conversation_ofrecer_solucion_rapida",
            text: "Propón una solución rápida a un pequeño problema visible (por ejemplo, lentejuelas sueltas) y pide confirmación antes de actuar.",
          },
          {
            requirementId: "conversation_preguntar_zonas_prohibidas",
            text: "Pregunta cuáles zonas están fuera de límites para evitar problemas.",
          },
          {
            requirementId: "conversation_negociar_quedarte",
            text: "Si dudan de ti, persuade a Margo para dejarte quedar explicando en una frase una habilidad relevante.",
          },
          {
            requirementId: "conversation_pedir_instrucciones_breves",
            text: "Pide que te den instrucciones en dos pasos máximos y repítelos para verificar.",
          },
          {
            requirementId: "conversation_preguntar_contacto_reporte",
            text: "Pregunta a qué persona debes reportar el estado de tu tarea y por qué canal (voz, gesto, señal).",
          },
          {
            requirementId: "conversation_disculpa_estorbo",
            text: "Si bloqueas el paso, discúlpate brevemente y pregunta dónde puedes recolocarte.",
          },
          {
            requirementId: "conversation_pedir_politica_fotos",
            text: "Pregunta si está permitido tomar fotos o notas y acepta la política indicada.",
          },
          {
            requirementId: "conversation_validar_identificacion_modelo",
            text: "Confirma el nombre o número de look del/la modelo a quien debes asistir antes de tocar la prenda.",
          },
          {
            requirementId: "conversation_preguntar_secuencia_line_up",
            text: "Pregunta cómo está organizada la secuencia de salidas y dónde se consulta el orden.",
          },
          {
            requirementId: "conversation_pedir_repeticion_lenta",
            text: "Si no entiendes una instrucción por la prisa, pide que te la repitan más despacio y confirma con una reformulación.",
          },
          {
            requirementId: "conversation_cerrar_con_proximo_paso",
            text: "Antes de moverte, confirma en una frase cuál es tu próximo paso inmediato y el punto de entrega final.",
          },
          {
            requirementId: "english_usar_backstage",
            text: "Usa la palabra en inglés 'backstage' para describir dónde estás y por qué necesitas instrucciones rápidas.",
          },
          {
            requirementId: "english_usar_runway",
            text: "Menciona 'runway' al preguntar cuánto falta para la próxima salida a pasarela.",
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
            requirementId: "english_usar_safety_pin",
            text: "Propón una solución rápida mencionando 'safety pin' como herramienta.",
          },
          {
            requirementId: "english_usar_garment_bag",
            text: "Pregunta si debes devolver la prenda a su 'garment bag' al terminar.",
          },
          {
            requirementId: "english_usar_time_sensitive_collocation",
            text: "Indica que la tarea es 'time-sensitive' y sugiere actuar de inmediato.",
          },
          {
            requirementId: "english_usar_on_a_tight_schedule",
            text: "Reconoce la presión de tiempo usando la collocation 'on a tight schedule'.",
          },
          {
            requirementId: "english_usar_prioritize",
            text: "Pide que te ayuden a 'prioritize' dos tareas y elige una.",
          },
          {
            requirementId: "english_usar_delegate",
            text: "Sugiere 'delegate' una tarea menor para acelerar el flujo.",
          },
          {
            requirementId: "english_usar_off_limits",
            text: "Pregunta qué áreas están 'off-limits' para evitar entrar por error.",
          },
          {
            requirementId: "english_usar_double_check",
            text: "Pide permiso para 'double-check' la talla o el número de look.",
          },
          {
            requirementId: "english_usar_quick_fix",
            text: "Propón un 'quick fix' para un borde deshilachado.",
          },
          {
            requirementId: "english_usar_lint_roller",
            text: "Ofrece usar un 'lint roller' antes de que el/la modelo salga.",
          },
          {
            requirementId: "english_phrasal_pitch_in",
            text: "Ofrece ayuda usando el phrasal verb 'pitch in' en una frase natural.",
          },
          {
            requirementId: "english_phrasal_sort_out",
            text: "Propón encargarte de 'sort out' un problema pequeño y específico.",
          },
          {
            requirementId: "english_phrasal_hand_over",
            text: "Confirma a quién debes 'hand over' la prenda una vez lista.",
          },
          {
            requirementId: "english_phrasal_keep_up",
            text: "Promete 'keep up' con el ritmo rápido del equipo en una oración.",
          },
          {
            requirementId: "english_phrasal_run_out_of",
            text: "Informa si se han 'run out of' alfileres u otro material y pide reposición.",
          },
          {
            requirementId: "english_idiom_in_the_nick_of_time",
            text: "Expresa alivio usando el modismo 'in the nick of time' tras resolver algo justo a tiempo.",
          },
          {
            requirementId: "english_idiom_on_the_same_page",
            text: "Confirma entendimiento mutuo con el idiom 'on the same page'.",
          },
          {
            requirementId: "english_idiom_cut_to_the_chase",
            text: "Pide instrucciones directas usando 'cut to the chase' de forma cortés.",
          },
          {
            requirementId: "english_idiom_pull_it_off",
            text: "Motiva al equipo diciendo que pueden 'pull it off' pese al caos.",
          },
          {
            requirementId: "english_idiom_the_show_must_go_on",
            text: "Cierra una mini-crisis con el idiom 'the show must go on' apropiadamente.",
          },
          {
            requirementId: "english_usar_access_badge",
            text: "Pregunta si necesitas un 'access badge' para moverte entre áreas.",
          },
        ],
      },
      {
        missionId: "fashion_show_disaster_wardrobe_war",
        title: "Guerra de armarios",
        sceneSummary:
          "Dos asistentes discuten por un vestido desaparecido y uno de ellos te arrastra al conflicto. Tienes que mediar sin empeorar la pelea.",
        aiRole:
          "Eres un asistente dramático que cree que todo es una crisis de telenovela. Exagera las emociones, usa frases enfáticas y responde con rebeldía cómica; permite que el alumno ejerza diplomacia.",
        caracterName: "Luca Sparks",
        caracterPrompt:
          "A young assistant with an oversized blazer, eyeliner, and a chaotic hairdo. He holds fabric swatches in one hand and a steaming iron in the other, making dramatic gestures in a cramped costume tent under bright lights.",
        requirements: [
          {
            requirementId: "conversation_aclarar_vestido_faltante",
            text: "Pregunta cuál es el vestido desaparecido y confirma color, talla y el número de look asignado.",
          },
          {
            requirementId: "conversation_quien_lo_toco_ultimo",
            text: "Pregunta quién fue la última persona que manipuló el vestido y a qué hora exacta.",
          },
          {
            requirementId: "conversation_reconstruir_ruta",
            text: "Pide reconstruir el recorrido del vestido paso a paso desde el perchero hasta la modelo.",
          },
          {
            requirementId: "conversation_bajar_el_tono",
            text: "Pide explícitamente que ambos bajen la voz para poder entenderse y seguir con la búsqueda.",
          },
          {
            requirementId: "conversation_turnos_para_hablar",
            text: "Establece que hablarán de a uno y confirma quién habla primero.",
          },
          {
            requirementId: "conversation_validar_sentimientos",
            text: "Reconoce la frustración de ambos con empatía sin tomar partido.",
          },
          {
            requirementId: "conversation_pedir_hechos_no_acusaciones",
            text: "Solicita que solo compartan hechos verificables y eviten acusaciones mientras buscas soluciones.",
          },
          {
            requirementId: "conversation_confirmar_etiqueta_modelo",
            text: "Pregunta si el vestido tiene etiqueta con el nombre de la modelo y quién la vio por última vez.",
          },
          {
            requirementId: "conversation_acceso_inventario",
            text: "Pide acceso a la app o lista de inventario para verificar el estado asignado del vestido.",
          },
          {
            requirementId: "conversation_dividir_busqueda",
            text: "Propón dividir la búsqueda en zonas claras (percheros, sastrería, planchado, maquillaje) y asigna a cada uno una tarea.",
          },
          {
            requirementId: "conversation_verificar_planchado_vapor",
            text: "Pregunta si el vestido pasó por plancha o vapor y solicita revisar esa estación.",
          },
          {
            requirementId: "conversation_consultar_sastreria",
            text: "Pregunta si el vestido fue enviado a ajustes en sastrería y quién autorizó ese movimiento.",
          },
          {
            requirementId: "conversation_testigos_backstage",
            text: "Pide nombres de testigos cercanos (maquillaje, peinado, estilista) que puedan confirmar la última ubicación.",
          },
          {
            requirementId: "conversation_descartar_confusion_perchero",
            text: "Sugiere comprobar si el vestido quedó en el perchero equivocado y pide revisar perchas vecinas.",
          },
          {
            requirementId: "conversation_suspender_culpa_temporal",
            text: "Pide explícitamente pausar cualquier culpa hasta que haya evidencia clara.",
          },
          {
            requirementId: "conversation_parafrasear_versiones",
            text: "Reformula en voz alta la versión de cada asistente y confirma si entendiste bien.",
          },
          {
            requirementId: "conversation_proponer_plan_b",
            text: "Propón una alternativa concreta para la modelo si el vestido no aparece a tiempo.",
          },
          {
            requirementId: "conversation_pedir_autorizacion_estilista",
            text: "Sugiere contactar al estilista principal para autorizar cambios y pregunta quién puede llamarlo.",
          },
          {
            requirementId: "conversation_plazo_reagrupacion",
            text: "Fija un momento exacto para reagrupase tras la búsqueda y confirma que ambos aceptan.",
          },
          {
            requirementId: "conversation_limites_espacio_personal",
            text: "Pregunta con tacto si se puede revisar las cajas de accesorios asignadas sin invadir pertenencias personales.",
          },
          {
            requirementId: "conversation_priorizar_paso_siguiente",
            text: "Indica claramente cuál será el siguiente paso inmediato y verifica que ambos estén de acuerdo.",
          },
          {
            requirementId: "conversation_confirmar_terminologia",
            text: "Verifica que todos se refieran al mismo ítem usando el nombre del look o código interno correcto.",
          },
          {
            requirementId: "conversation_pedir_prueba_foto",
            text: "Solicita una foto reciente del vestido en el backstage para comparar y rastrear dónde fue tomada.",
          },
          {
            requirementId: "conversation_coordinar_canal_comunicacion",
            text: "Establece un canal rápido de actualización (mano alzada o guiño acordado) para avisar si aparece el vestido.",
          },
          {
            requirementId: "conversation_resumen_cierre_plan",
            text: "Cierra con un resumen breve del plan, las responsabilidades asignadas y el criterio para declarar éxito.",
          },
          {
            requirementId: "english_the_show_must_go_on",
            text: 'Usa la expresión en inglés "the show must go on" para motivar al equipo bajo presión.',
          },
          {
            requirementId: "english_track_down",
            text: 'Usa el phrasal verb "track down" al proponer cómo encontrar el vestido.',
          },
          {
            requirementId: "english_rule_out",
            text: 'Usa el phrasal verb "rule out" cuando descartes ubicaciones o hipótesis.',
          },
          {
            requirementId: "english_double_check",
            text: 'Usa "double-check" para pedir que verifiquen la percha y la etiqueta del vestido.',
          },
          {
            requirementId: "english_sort_out",
            text: 'Usa el phrasal verb "sort out" al prometer resolver la disputa sin culpas.',
          },
          {
            requirementId: "english_cool_down",
            text: 'Usa el phrasal verb "cool down" para pedir que bajen la intensidad de la discusión.',
          },
          {
            requirementId: "english_on_the_same_page",
            text: 'Usa la expresión "on the same page" al alinear la estrategia de búsqueda.',
          },
          {
            requirementId: "english_cut_to_the_chase",
            text: 'Usa el idiom "cut to the chase" para ir directo a los hechos clave.',
          },
          {
            requirementId: "english_point_fingers",
            text: 'Usa el idiom "point fingers" al pedir que eviten culparse sin evidencia.',
          },
          {
            requirementId: "english_buy_us_some_time",
            text: 'Usa la expresión "buy us some time" al negociar un pequeño margen con el estilista.',
          },
          {
            requirementId: "english_swap_out",
            text: 'Usa el phrasal verb "swap out" al sugerir cambiar temporalmente el look de la modelo.',
          },
          {
            requirementId: "english_backup_dress",
            text: 'Menciona explícitamente "backup dress" al proponer una prenda de reserva.',
          },
          {
            requirementId: "english_runway_context",
            text: 'Usa la palabra "runway" al referirte a la inminente salida a pasarela.',
          },
          {
            requirementId: "english_backstage_chaos",
            text: 'Incluye la palabra "backstage" para describir el entorno caótico.',
          },
          {
            requirementId: "english_last_minute_changes",
            text: 'Usa la collocation "last-minute changes" para explicar el riesgo de improvisar.',
          },
          {
            requirementId: "english_wardrobe_malfunction",
            text: 'Usa la expresión "wardrobe malfunction" al hablar de evitar una emergencia en escena.',
          },
          {
            requirementId: "english_time_is_of_the_essence",
            text: 'Usa la frase "time is of the essence" para remarcar la urgencia.',
          },
          {
            requirementId: "english_inventory_reference",
            text: 'Usa la palabra "inventory" al pedir la lista o app de control de prendas.',
          },
          {
            requirementId: "english_contingency_plan",
            text: 'Usa la expresión "contingency plan" al proponer un plan B claro.',
          },
          {
            requirementId: "english_miscommunication",
            text: 'Usa la palabra "miscommunication" para enmarcar la discusión sin acusar.',
          },
          {
            requirementId: "english_allegation",
            text: 'Usa la palabra "allegation" al referirte a cualquier acusación no probada.',
          },
          {
            requirementId: "english_under_pressure",
            text: 'Incluye la expresión "under pressure" para describir el estado del equipo.',
          },
          {
            requirementId: "english_given_that",
            text: 'Empieza una frase con "Given that" para introducir una condición relevante del plan.',
          },
          {
            requirementId: "english_to_be_fair",
            text: 'Empieza una intervención con "To be fair," para equilibrar las perspectivas.',
          },
          {
            requirementId: "english_at_this_stage",
            text: 'Usa la expresión "At this stage" para situar el punto del proceso antes de decidir.',
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
            text: "Pide que explique con detalle qué aspecto específico del atuendo rechaza.",
          },
          {
            requirementId: "conversation_identificar_prenda_conflictiva",
            text: "Aclara cuál prenda o accesorio es el mayor problema para ella.",
          },
          {
            requirementId: "conversation_condicion_minima_para_quedarse",
            text: "Pregunta cuál es la condición mínima que la haría quedarse.",
          },
          {
            requirementId: "conversation_mostrar_empatia_comodidad",
            text: "Expresa empatía por su incomodidad y valida su molestia sin discutir.",
          },
          {
            requirementId: "conversation_disculpa_por_fallo_equipo",
            text: "Ofrece una disculpa breve en nombre del equipo por el desorden o malentendido.",
          },
          {
            requirementId: "conversation_proponer_ajuste_rapido_tiempo",
            text: "Propón un ajuste rápido con un límite de tiempo concreto y razonable.",
          },
          {
            requirementId: "conversation_sugerir_cambio_prenda_especifica",
            text: "Sugiere cambiar una prenda específica (por ejemplo, zapatos o chaqueta) para acomodarla.",
          },
          {
            requirementId: "conversation_verificar_movilidad_seguridad",
            text: "Pregunta si el atuendo limita su movilidad o seguridad al caminar.",
          },
          {
            requirementId: "conversation_indagar_materiales_alergias",
            text: "Averigua si hay telas o materiales que le irritan o le causan alergia.",
          },
          {
            requirementId: "conversation_ofrecer_hablar_estilista",
            text: "Ofrece hablar con el estilista o sastre en su nombre para acelerar la solución.",
          },
          {
            requirementId: "conversation_explorar_conflicto_disenador",
            text: "Pregunta si su objeción es con el diseño, con la talla o con la imagen que proyecta.",
          },
          {
            requirementId: "conversation_plantear_opcion_a_b",
            text: "Presenta dos opciones claras y viables y pídele elegir una.",
          },
          {
            requirementId: "conversation_compromiso_reciproco",
            text: "Negocia una concesión a cambio de que desfile, como un ajuste de estilismo a su gusto.",
          },
          {
            requirementId: "conversation_acordar_prueba_espejo",
            text: "Propón una prueba breve frente al espejo antes de decidir y busca su aceptación.",
          },
          {
            requirementId: "conversation_pedir_permiso_manejo_prenda",
            text: "Solicita permiso explícito antes de tocar o ajustar la prenda.",
          },
          {
            requirementId: "conversation_confirmar_talla_medidas",
            text: "Confirma su talla y si la prenda coincide o requiere pinzas/alfileres.",
          },
          {
            requirementId: "conversation_manejar_objecion_tiempo",
            text: "Responde a la objeción de falta de tiempo con un plan claro y breve.",
          },
          {
            requirementId: "conversation_reencuadrar_beneficio",
            text: "Reencuadra el beneficio profesional de desfilar sin invalidar sus preocupaciones.",
          },
          {
            requirementId: "conversation_garantizar_privacidad",
            text: "Asegura que se mantendrá su privacidad mientras se hace el ajuste.",
          },
          {
            requirementId: "conversation_establecer_limites_respetuosos",
            text: "Deja claro que no la presionarás físicamente y que sus límites serán respetados.",
          },
          {
            requirementId: "conversation_verificar_riesgo_tropezar",
            text: "Pregunta si teme tropezar con el largo o los tacones y ofrece solución concreta.",
          },
          {
            requirementId: "conversation_ofrecer_pausa_breve",
            text: "Ofrece una pausa de dos minutos para que respire mientras preparas el ajuste.",
          },
          {
            requirementId: "conversation_comprometer_entrega_rapida",
            text: "Promete un tiempo de entrega específico para el arreglo y pídele confirmación.",
          },
          {
            requirementId: "conversation_establecer_plan_contingencia",
            text: "Propón un plan alternativo si el primer ajuste no funciona y busca su visto bueno.",
          },
          {
            requirementId: "conversation_cerrar_acuerdo_final",
            text: "Obtén su confirmación explícita del plan elegido y del siguiente paso inmediato.",
          },
          {
            requirementId: "english_runway",
            text: "Menciona la palabra 'runway' al explicar por qué el desfile no puede retrasarse.",
          },
          {
            requirementId: "english_backstage",
            text: "Usa 'backstage' para situar claramente dónde ocurre la negociación.",
          },
          {
            requirementId: "english_wardrobe_malfunction",
            text: "Incluye la expresión 'wardrobe malfunction' al hablar del riesgo si no se ajusta la prenda.",
          },
          {
            requirementId: "english_lineup",
            text: "Di 'lineup' al referirte al orden de salida de las modelos.",
          },
          {
            requirementId: "english_quick_fix",
            text: "Propón un 'quick fix' como solución inmediata al problema del atuendo.",
          },
          {
            requirementId: "english_last_minute",
            text: "Usa 'last-minute' para describir que el cambio será de último momento pero manejable.",
          },
          {
            requirementId: "english_tight_schedule",
            text: "Incluye la colocación 'tight schedule' al reconocer la presión de tiempo.",
          },
          {
            requirementId: "english_statement_piece",
            text: "Emplea 'statement piece' para referirte a la prenda principal que llama la atención.",
          },
          {
            requirementId: "english_edgy",
            text: "Utiliza 'edgy' para describir el estilo que se busca proyectar.",
          },
          {
            requirementId: "english_silhouette",
            text: "Menciona 'silhouette' al explicar cómo se verá la forma del vestido tras el ajuste.",
          },
          {
            requirementId: "english_hemline",
            text: "Usa 'hemline' al hablar de acortar o ajustar el largo del vestido.",
          },
          {
            requirementId: "english_zipper",
            text: "Incluye 'zipper' para discutir si la cremallera necesita reforzarse.",
          },
          {
            requirementId: "english_swap_out",
            text: "Emplea el phrasal verb 'swap out' al proponer reemplazar una prenda específica.",
          },
          {
            requirementId: "english_try_on",
            text: "Usa el phrasal verb 'try on' al pedir que se pruebe el ajuste rápido.",
          },
          {
            requirementId: "english_slip_into",
            text: "Incluye el phrasal verb 'slip into' al sugerir ponerse una alternativa en segundos.",
          },
          {
            requirementId: "english_tone_down",
            text: "Utiliza el phrasal verb 'tone down' para proponer suavizar un elemento del look.",
          },
          {
            requirementId: "english_pull_it_off",
            text: "Emplea la expresión 'pull it off' para asegurar que aún puede lucirlo con confianza.",
          },
          {
            requirementId: "english_walk_out",
            text: "Menciona el phrasal verb 'walk out' al pedirle que no se marche antes de evaluar la opción.",
          },
          {
            requirementId: "english_back_out",
            text: "Usa el phrasal verb 'back out' al hablar de evitar cancelar su participación.",
          },
          {
            requirementId: "english_work_something_out",
            text: "Incluye el phrasal verb 'work something out' para proponer encontrar un acuerdo.",
          },
          {
            requirementId: "english_under_pressure",
            text: "Emplea la colocación 'under pressure' para reconocer la tensión del momento.",
          },
          {
            requirementId: "english_on_board",
            text: "Usa la expresión 'on board' para confirmar que acepta el plan.",
          },
          {
            requirementId: "english_in_the_spotlight",
            text: "Incluye 'in the spotlight' al explicar la visibilidad del look en escena.",
          },
          {
            requirementId: "english_green_light",
            text: "Utiliza 'green light' para pedir su visto bueno antes de hacer el ajuste.",
          },
          {
            requirementId: "english_make_it_work",
            text: "Di 'make it work' al garantizar que el equipo puede resolverlo a tiempo.",
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
            text: "Pide ver una foto de referencia del diseñador para confirmar el ángulo exacto del delineado y la intensidad del color del ojo faltante.",
          },
          {
            requirementId: "conversation_check_allergies",
            text: "Pregunta si la modelo tiene alergias o sensibilidad ocular antes de aplicar productos cerca de la línea de agua.",
          },
          {
            requirementId: "conversation_negotiate_steps_to_skip",
            text: "Negocia qué pasos no esenciales se pueden omitir por el tiempo, justificando por qué no afectarán el look final en pasarela.",
          },
          {
            requirementId: "conversation_request_better_lighting",
            text: "Solicita que ajusten la luz del camerino o acerquen una luz fría para evaluar la simetría del delineado.",
          },
          {
            requirementId: "conversation_assign_sanitization",
            text: "Indica a alguien que desinfecte rizador, brochas y lápices antes de usarlos, y confirma que lo ha hecho.",
          },
          {
            requirementId: "conversation_clarify_color_palette",
            text: "Confirma con el estilista qué paleta exacta de sombras se debe usar para que coincida con el ojo ya terminado.",
          },
          {
            requirementId: "conversation_seek_model_consent",
            text: "Pide permiso a la modelo antes de tocar el párpado y explica brevemente cada paso para tranquilizarla.",
          },
          {
            requirementId: "conversation_coordinate_timer",
            text: "Pide a un asistente que marque un conteo regresivo en voz alta y acuerda un punto de control a mitad del tiempo.",
          },
          {
            requirementId: "conversation_request_head_stillness",
            text: "Pide a la modelo que mantenga la cabeza estable mirando un punto fijo mientras trazas el delineado.",
          },
          {
            requirementId: "conversation_troubleshoot_smudge",
            text: "Si notas un manchón, explica cómo lo corregirás rápidamente y qué producto usarás para limpiarlo sin arrastrar la base.",
          },
          {
            requirementId: "conversation_confirm_flashback_risk",
            text: "Consulta con el fotógrafo si habrá flash fuerte y confirma que el polvo no causará efecto flashback.",
          },
          {
            requirementId: "conversation_empathize_with_model",
            text: "Reconoce el nerviosismo de la modelo y ofrece una frase de calma mientras trabajas cerca del lagrimal.",
          },
          {
            requirementId: "conversation_set_hygiene_boundary",
            text: "Establece el límite de no compartir lápices sin afilar y sin desinfectar, explicando el motivo de higiene.",
          },
          {
            requirementId: "conversation_get_designer_final_say",
            text: "Pide la aprobación final del diseñador para el grosor del delineado antes de fijarlo con sombra.",
          },
          {
            requirementId: "conversation_persuade_lash_size_change",
            text: "Propón cambiar el tamaño de la pestaña postiza del ojo incompleto para igualar el peso visual y convence al equipo.",
          },
          {
            requirementId: "conversation_clarify_eye_shape_strategy",
            text: "Explica tu estrategia para adaptar el delineado al pliegue del párpado de la modelo para evitar que se transfiera.",
          },
          {
            requirementId: "conversation_delegate_color_matching",
            text: "Encarga a alguien que mezcle en paleta el tono exacto para difuminar el borde exterior del ojo faltante y te lo pase listo.",
          },
          {
            requirementId: "conversation_confirm_product_availability",
            text: "Pregunta si queda delineador en gel negro y, si no, acuerda un reemplazo viable de alta fijación.",
          },
          {
            requirementId: "conversation_request_mirror_position",
            text: "Pide que suban o bajen el espejo para que la modelo no mueva los ojos mientras aplicas la línea.",
          },
          {
            requirementId: "conversation_time_update_midway",
            text: "Da una actualización de progreso a mitad del proceso y ajusta el plan si el tiempo se reduce.",
          },
          {
            requirementId: "conversation_confirm_symmetry_points",
            text: "Señala y confirma tres puntos de referencia de simetría en ambos ojos antes de unir el delineado.",
          },
          {
            requirementId: "conversation_request_quiet_moment",
            text: "Pide silencio de 20 segundos al equipo para trazar el rabillo sin interrupciones.",
          },
          {
            requirementId: "conversation_establish_backup_plan",
            text: "Propón un plan B si el delineador líquido falla, detallando qué producto usarás y cómo sellarás el trazo.",
          },
          {
            requirementId: "conversation_handle_last_second_change",
            text: "Responde con calma si el diseñador pide intensificar el ahumado y explica cuánto puedes lograr con el tiempo que queda.",
          },
          {
            requirementId: "conversation_ask_model_feedback_comfort",
            text: "Pregunta a la modelo si siente escozor o tirantez tras aplicar el fijador y ajusta el producto si es necesario.",
          },
          {
            requirementId: "english_use_smudge_proof",
            text: 'Menciona explícitamente el adjetivo en inglés "smudge-proof" al justificar la elección del delineador.',
          },
          {
            requirementId: "english_use_blend_seamlessly",
            text: 'Usa la colocación en inglés "blend seamlessly" para explicar cómo unirás la sombra del ojo incompleto con la ya hecha.',
          },
          {
            requirementId: "english_use_winged_liner",
            text: 'Nombra el estilo en inglés "winged liner" al describir el rabillo que vas a trazar.',
          },
          {
            requirementId: "english_use_phrasal_touch_up",
            text: 'Emplea el phrasal verb en inglés "touch up" al proponer correcciones rápidas sin rehacer todo.',
          },
          {
            requirementId: "english_use_even_out",
            text: 'Incluye el phrasal verb en inglés "even out" al hablar de igualar la intensidad entre ambos ojos.',
          },
          {
            requirementId: "english_use_build_up",
            text: 'Usa el phrasal verb en inglés "build up" para indicar que aumentarás el pigmento en capas.',
          },
          {
            requirementId: "english_use_tone_down",
            text: 'Emplea el phrasal verb en inglés "tone down" al sugerir suavizar un color demasiado intenso.',
          },
          {
            requirementId: "english_use_wipe_off",
            text: 'Usa el phrasal verb en inglés "wipe off" al describir cómo retirarás un exceso sin arrastrar la base.',
          },
          {
            requirementId: "english_use_pull_off_idiom",
            text: 'Incluye el idiom en inglés "pull off" para convencer al diseñador de que el ajuste quedará bien en pasarela.',
          },
          {
            requirementId: "english_use_on_the_fly_idiom",
            text: 'Di la expresión en inglés "on the fly" al explicar que adaptarás la técnica por la falta de tiempo.',
          },
          {
            requirementId: "english_use_under_the_gun_idiom",
            text: 'Menciona el idiom en inglés "under the gun" para señalar la presión de tiempo.',
          },
          {
            requirementId: "english_use_run_out_of",
            text: 'Usa el phrasal verb en inglés "run out of" para hablar de la posible falta de delineador en gel.',
          },
          {
            requirementId: "english_use_swap_out",
            text: 'Incluye el phrasal verb en inglés "swap out" al proponer cambiar una pestaña por otra más ligera.',
          },
          {
            requirementId: "english_use_work_around",
            text: 'Emplea el phrasal verb en inglés "work around" para describir cómo evitarás el pliegue que transfiere el delineado.',
          },
          {
            requirementId: "english_use_hold_still",
            text: 'Pide a la modelo en inglés que "hold still" mientras creas el rabillo.',
          },
          {
            requirementId: "english_use_color_correct",
            text: 'Usa el término en inglés "color-correct" para explicar cómo neutralizarás rojeces cerca del lagrimal.',
          },
          {
            requirementId: "english_use_waterline",
            text: 'Menciona la palabra en inglés "waterline" al indicar dónde aplicarás el lápiz.',
          },
          {
            requirementId: "english_use_creaseless",
            text: 'Incluye el adjetivo en inglés "creasesless" o "crease-proof" al prometer que no se marcará el pliegue.',
          },
          {
            requirementId: "english_use_matte_vs_dewy",
            text: 'Contrasta en inglés "matte" y "dewy" al justificar el acabado alrededor del ojo.',
          },
          {
            requirementId: "english_use_set_with_powder",
            text: 'Usa la colocación en inglés "set with powder" para describir cómo fijarás el delineado.',
          },
          {
            requirementId: "english_use_setting_spray",
            text: 'Menciona el producto en inglés "setting spray" al finalizar el ojo.',
          },
          {
            requirementId: "english_use_fallout",
            text: 'Incluye el término en inglés "fallout" al explicar cómo protegerás la piel de residuos de sombra.',
          },
          {
            requirementId: "english_use_flashback",
            text: 'Usa la palabra en inglés "flashback" al hablar del riesgo con polvos bajo flash.',
          },
          {
            requirementId: "english_use_feather_out",
            text: 'Emplea el phrasal verb en inglés "feather out" para describir el difuminado del borde externo.',
          },
          {
            requirementId: "english_use_on_point_idiom",
            text: 'Di el idiom en inglés "on point" para asegurar que la simetría del delineado es perfecta.',
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
            requirementId: "conversation_alerta_por_radio",
            text: "Anuncia por el intercomunicador que un zapato del primer modelo se ha roto justo antes de salir y especifica en qué pie está el daño.",
          },
          {
            requirementId: "conversation_identificar_modelo_afectado",
            text: "Di el nombre o número de look del modelo afectado y confirma su ubicación exacta backstage.",
          },
          {
            requirementId: "conversation_verificar_estado_modelo",
            text: "Pregunta al modelo si siente dolor o inestabilidad en el tobillo y solicita una respuesta clara para evaluar riesgo.",
          },
          {
            requirementId: "conversation_solicitar_zapato_repuesto",
            text: "Pide a utilería o vestuario que traigan un par de repuesto del mismo talle y especifica el color exacto requerido.",
          },
          {
            requirementId: "conversation_estimar_tiempo_entrega",
            text: "Pregunta el tiempo estimado en segundos para que llegue el repuesto y exige una cifra concreta.",
          },
          {
            requirementId: "conversation_coordinar_stylist",
            text: "Indica al stylist que revise la sujeción del otro zapato y confirme si ambos pueden ajustarse de forma segura.",
          },
          {
            requirementId: "conversation_pedir_cinta_o_refuerzo",
            text: "Solicita cinta fuerte o clips de emergencia y explica cómo se aplicará al talón o correa para asegurar el paso.",
          },
          {
            requirementId: "conversation_reordenar_salida",
            text: "Propón cambiar el orden de salida moviendo al segundo look al frente y pide confirmación del stage manager.",
          },
          {
            requirementId: "conversation_pausar_musica",
            text: "Pide a sonido que extienda la intro o mantenga un loop suave hasta nueva orden y espera su confirmación por radio.",
          },
          {
            requirementId: "conversation_ajustar_luces",
            text: "Solicita a iluminación bajar ligeramente los niveles en la pasarela para ganar tiempo y confirma el nuevo estado.",
          },
          {
            requirementId: "conversation_consultar_diseniador",
            text: "Pregunta al diseñador si autoriza un reemplazo temporal de calzado del mismo tono y explica por qué es seguro.",
          },
          {
            requirementId: "conversation_plan_camuflar_pie_descalzo",
            text: "Ofrece una opción de caminar con el pie afectado cubierto por la falda o pantalón y pide aprobación explícita.",
          },
          {
            requirementId: "conversation_confirmar_prueba_pasos",
            text: "Pide al modelo dar dos pasos de prueba en una zona segura y solicita un ok o no para continuar.",
          },
          {
            requirementId: "conversation_solicitar_modelo_alterno",
            text: "Pregunta si hay un modelo alterno listo para sustituir y pide que confirme talla y ajuste del look.",
          },
          {
            requirementId: "conversation_priorizar_seguridad",
            text: "Declara que la seguridad prima sobre el tiempo e indica que no habrá salida hasta confirmar estabilidad del calzado.",
          },
          {
            requirementId: "conversation_reasegurar_con_calma",
            text: "Expresa calma al modelo con una frase breve de apoyo profesional y recuérdale que no debe correr riesgos.",
          },
          {
            requirementId: "conversation_pedir_silencio_canal",
            text: "Ordena silencio en el canal de radio excepto mensajes críticos y solicita confirmación con un 'copy' del equipo.",
          },
          {
            requirementId: "conversation_solicitar_actualizacion_cronometro",
            text: "Pide al regidor reconfigurar la cuenta regresiva con la nueva estimación y repetirla en voz alta.",
          },
          {
            requirementId: "conversation_check_superficie_pasarela",
            text: "Ordena revisar si la pasarela está limpia y seca en la zona de salida y exige un reporte inmediato.",
          },
          {
            requirementId: "conversation_mensaje_breve_sponsor",
            text: "Comunica en una frase profesional al representante del patrocinador que hay un ajuste técnico menor y que el show sigue.",
          },
          {
            requirementId: "conversation_negociar_con_camaras",
            text: "Pide a cámaras un plano de público o DJ para cubrir la demora y confirma que pueden sostenerlo treinta segundos.",
          },
          {
            requirementId: "conversation_validar_instrucciones_repeticion",
            text: "Pide a la persona encargada del repuesto que repita los pasos exactos que realizará para asegurar el calzado.",
          },
          {
            requirementId: "conversation_establecer_punto_de_entrega",
            text: "Define un punto claro para el intercambio del zapato y confirma quién hará la entrega física.",
          },
          {
            requirementId: "conversation_definir_cue_de_salida",
            text: "Indica la señal exacta para dar 'go' al primer paso del modelo y consigue una confirmación final del equipo.",
          },
          {
            requirementId: "conversation_evaluar_plan_b_retiro",
            text: "Expón un plan B de retirar el look si no llega el repuesto a tiempo y pide al diseñador su visto bueno o veto inmediato.",
          },
          {
            requirementId: "english_use_wardrobe_malfunction",
            text: "Usa la expresión 'wardrobe malfunction' para describir el problema del zapato de forma concisa.",
          },
          {
            requirementId: "english_use_last_minute_fix",
            text: "Incluye la collocation 'last-minute fix' al proponer una solución rápida y viable.",
          },
          {
            requirementId: "english_use_on_standby",
            text: "Di que el equipo de vestuario debe estar 'on standby' hasta nueva orden.",
          },
          {
            requirementId: "english_use_time_sensitive",
            text: "Menciona que la situación es 'time-sensitive' y exige respuestas con tiempos exactos.",
          },
          {
            requirementId: "english_use_double_check",
            text: "Ordena 'double-check the fit' del zapato alterno antes de autorizar la salida.",
          },
          {
            requirementId: "english_use_runway_ready",
            text: "Declara que el modelo no está 'runway-ready' hasta que confirmes estabilidad.",
          },
          {
            requirementId: "english_use_fastening_terms",
            text: "Usa vocabulario específico de ajuste como 'fasten the strap' o 'secure the heel cap' al dar instrucciones.",
          },
          {
            requirementId: "english_use_hold_off_phrasal",
            text: "Emplea el phrasal verb 'hold off' para pedir que esperen la música o la salida.",
          },
          {
            requirementId: "english_use_swap_out_phrasal",
            text: "Usa el phrasal verb 'swap out' para indicar el reemplazo del zapato defectuoso.",
          },
          {
            requirementId: "english_use_patch_up_phrasal",
            text: "Incluye el phrasal verb 'patch up' al describir un arreglo temporal del calzado.",
          },
          {
            requirementId: "english_use_buy_us_time_idiom",
            text: "Usa la expresión 'buy us time' para justificar una pausa en el inicio.",
          },
          {
            requirementId: "english_use_play_it_safe_idiom",
            text: "Emplea el idiom 'play it safe' para priorizar la seguridad del modelo.",
          },
          {
            requirementId: "english_use_cutting_it_close_idiom",
            text: "Di que el equipo está 'cutting it close' respecto a la cuenta regresiva.",
          },
          {
            requirementId: "english_use_fall_back_on_phrasal",
            text: "Usa el phrasal verb 'fall back on' para referirte al plan alterno si falla el repuesto.",
          },
          {
            requirementId: "english_use_greenlight_verb",
            text: "Emplea 'greenlight' como verbo para autorizar la salida del modelo.",
          },
          {
            requirementId: "english_use_call_it_verb_phrase",
            text: "Incluye la frase verbal 'call it' para decidir cancelar o seguir con el look si no llega a tiempo.",
          },
          {
            requirementId: "english_use_on_the_fly_idiom",
            text: "Usa el idiom 'on the fly' para describir ajustes improvisados backstage.",
          },
          {
            requirementId: "english_use_touch_base_idiom",
            text: "Di 'let's touch base in thirty seconds' para coordinar una actualización rápida.",
          },
          {
            requirementId: "english_use_line_up_phrasal",
            text: "Usa el phrasal verb 'line up' para organizar el nuevo orden de salida.",
          },
          {
            requirementId: "english_use_hand_off_phrasal",
            text: "Incluye el phrasal verb 'hand off' al definir quién entrega el zapato y dónde.",
          },
          {
            requirementId: "english_use_bottleneck_term",
            text: "Describe el retraso como un 'bottleneck' en el flujo del show.",
          },
          {
            requirementId: "english_use_contingency_plan",
            text: "Menciona un 'contingency plan' para el look si el ajuste no es seguro.",
          },
          {
            requirementId: "english_use_heads_up_idiom",
            text: "Da un 'heads-up' a sonido e iluminación sobre la posible extensión de la intro.",
          },
          {
            requirementId: "english_use_keep_it_together_idiom",
            text: "Anima al equipo con el idiom 'keep it together' para mantener la calma bajo presión.",
          },
          {
            requirementId: "english_use_tight_window_collocation",
            text: "Explica que trabajan con una 'tight window' y exige precisión en los tiempos.",
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
            text: "Pregunta por el billete más insólito que lleva y cómo llegó a conseguirlo.",
          },
          {
            requirementId: "conversation_pedir_permiso_tocar_pieza",
            text: "Pide permiso explícito para sostener un billete concreto sin dañarlo.",
          },
          {
            requirementId: "conversation_proponer_trueque_justificado",
            text: "Propón un trueque detallando el objeto que ofreces y por qué su valor es razonable para ambos.",
          },
          {
            requirementId: "conversation_contraoferta_cortes",
            text: "Rechaza amablemente una primera oferta y presenta una contraoferta con una justificación clara.",
          },
          {
            requirementId: "conversation_historia_detras_ticket_borroso",
            text: "Pide la historia detrás de un ticket con fecha borrosa y solicita un detalle concreto.",
          },
          {
            requirementId:
              "conversation_reaccion_sorprendida_pregunta_seguimiento",
            text: "Muestra asombro ante una anécdota suya y formula una pregunta de seguimiento específica.",
          },
          {
            requirementId: "conversation_marcar_limites_privacidad",
            text: "Establece un límite amable indicando que no compartirás un dato personal sensible.",
          },
          {
            requirementId: "conversation_sospecha_autenticidad_verificacion",
            text: "Expón dudas sobre la autenticidad de un billete y solicita un método concreto de verificación.",
          },
          {
            requirementId: "conversation_aclarar_termino_jerga",
            text: "Pide que explique un término de jerga coleccionista que no entiendes.",
          },
          {
            requirementId: "conversation_persuadir_valor_historia",
            text: "Intenta persuadirlo de que tu historia merece un billete específico explicando dos razones.",
          },
          {
            requirementId: "conversation_comparar_dos_billetes",
            text: "Pide comparar dos billetes y que te diga cuál valora más y por qué.",
          },
          {
            requirementId: "conversation_contar_mini_historia_intrigante",
            text: "Cuenta una mini-historia intrigante de dos o tres frases para captar su interés.",
          },
          {
            requirementId: "conversation_solicitar_recibo_improvisado",
            text: "Solicita un recibo improvisado que describa el intercambio acordado.",
          },
          {
            requirementId: "conversation_ofrecer_ayuda_organizacion",
            text: "Ofrece ayudar a ordenar un par de bolsillos del abrigo a cambio de ver tres piezas raras.",
          },
          {
            requirementId: "conversation_preguntar_problemas_revisor",
            text: "Pregunta si alguna vez tuvo problemas con el revisor por llevar tantos tickets.",
          },
          {
            requirementId: "conversation_condicion_antes_cerrar_trato",
            text: "Indica una condición imprescindible que debe cumplirse antes de cerrar el trato.",
          },
          {
            requirementId: "conversation_mostrar_empatia_perdida_pasada",
            text: "Si menciona una pérdida, expresa empatía y haz una pregunta sensible relacionada.",
          },
          {
            requirementId: "conversation_probar_marca_agua",
            text: "Pide comprobar una marca de agua o sello de seguridad en un billete curioso.",
          },
          {
            requirementId: "conversation_negociar_tiempo_decidir",
            text: "Solicita unos minutos para pensar y acuerda cuándo dar tu respuesta final.",
          },
          {
            requirementId: "conversation_opinar_criterios_seleccion",
            text: "Da tu opinión sobre qué billete encaja mejor con tu historia y explica tus criterios.",
          },
          {
            requirementId: "conversation_humor_control_objetivo",
            text: "Responde con humor a una pregunta inusual suya y vuelve al objetivo del intercambio.",
          },
          {
            requirementId: "conversation_preguntar_historia_vs_objeto",
            text: "Pregunta si acepta una historia corta de calidad en lugar de un objeto físico.",
          },
          {
            requirementId: "conversation_aceptar_o_rechazar_con_razones",
            text: "Acepta o rechaza el trueque y proporciona dos razones específicas de tu decisión.",
          },
          {
            requirementId: "conversation_pedir_reserva_hasta_estacion",
            text: "Pide que te reserve una pieza hasta la próxima estación y acuerda una señal.",
          },
          {
            requirementId: "conversation_cambiar_asiento_privacidad",
            text: "Solicita cambiar de asiento para hablar con más privacidad y explica por qué es mejor.",
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
            requirementId: "english_usar_mint_condition",
            text: "Incluye la colocación 'mint condition' para describir el estado impecable de un objeto.",
          },
          {
            requirementId: "english_usar_face_value",
            text: "Usa 'face value' al contrastar el precio impreso con su valor real para coleccionistas.",
          },
          {
            requirementId: "english_phrasal_trade_off",
            text: "Usa el phrasal verb 'trade off' para explicar la concesión que estás dispuesto a hacer.",
          },
          {
            requirementId: "english_phrasal_turn_down",
            text: "Emplea el phrasal verb 'turn down' al rechazar cortésmente una oferta.",
          },
          {
            requirementId: "english_idiom_too_good_to_be_true",
            text: "Usa el idiom 'too good to be true' para evaluar una historia o trato sospechosamente favorable.",
          },
          {
            requirementId: "english_phrasal_look_into",
            text: "Incluye el phrasal verb 'look into' para prometer investigar un detalle de un billete.",
          },
          {
            requirementId: "english_usar_bargaining_chip",
            text: "Utiliza la colocación 'bargaining chip' para describir tu principal ventaja en la negociación.",
          },
          {
            requirementId: "english_usar_non_negotiable",
            text: "Usa el adjetivo 'non-negotiable' para establecer un límite claro del trato.",
          },
          {
            requirementId: "english_idiom_put_my_cards_on_the_table",
            text: "Emplea el idiom 'put my cards on the table' para ser totalmente transparente.",
          },
          {
            requirementId: "english_phrasal_hand_over",
            text: "Usa el phrasal verb 'hand over' para indicar que entregarás un objeto si se cumplen condiciones.",
          },
          {
            requirementId: "english_phrasal_hold_onto",
            text: "Emplea el phrasal verb 'hold onto' para decir que conservarás algo por ahora.",
          },
          {
            requirementId: "english_idiom_raise_red_flags",
            text: "Incluye el idiom 'raise red flags' para señalar detalles que te resultan sospechosos.",
          },
          {
            requirementId: "english_usar_limited_edition",
            text: "Usa la expresión 'limited edition' para justificar el valor de tu oferta.",
          },
          {
            requirementId: "english_usar_serial_number",
            text: "Incluye 'serial number' al pedir o mencionar un detalle identificador del billete.",
          },
          {
            requirementId: "english_phrasal_back_out",
            text: "Usa el phrasal verb 'back out' para hablar de retirarte del acuerdo si cambia una condición.",
          },
          {
            requirementId: "english_idiom_call_it_even",
            text: "Emplea el idiom 'call it even' para proponer cerrar un intercambio en equilibrio.",
          },
          {
            requirementId: "english_phrasal_come_across",
            text: "Usa el phrasal verb 'come across' para contar cómo encontraste un objeto curioso.",
          },
          {
            requirementId: "english_usar_ledger",
            text: "Incluye la palabra 'ledger' al referirte a un registro de intercambios o historias.",
          },
          {
            requirementId: "english_idiom_a_needle_in_a_haystack",
            text: "Emplea el idiom 'a needle in a haystack' para describir la rareza de una pieza.",
          },
          {
            requirementId: "english_phrasal_figure_out",
            text: "Usa el phrasal verb 'figure out' para explicar cómo resolverás una duda sobre el billete.",
          },
          {
            requirementId: "english_usar_that_said",
            text: "Incluye el conector 'that said' para matizar una afirmación durante la negociación.",
          },
          {
            requirementId: "english_usar_ticket_stub",
            text: "Usa el término 'ticket stub' para hablar de un recuerdo de un viaje anterior.",
          },
          {
            requirementId: "english_usar_compartment",
            text: "Emplea la palabra 'compartment' en una pregunta relacionada con el tren y la conversación.",
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
            requirementId: "conversation_proponer_estrofa_siguiente",
            text: "Propón la estrofa siguiente con una breve descripción de su tono y contenido.",
          },
          {
            requirementId: "conversation_corregir_linea_con_explicacion",
            text: "Corrige con tacto una línea mal cantada, dando la versión correcta y explicando en una frase el porqué.",
          },
          {
            requirementId: "conversation_feedback_equilibrado",
            text: "Ofrece feedback con un elogio específico y una sugerencia accionable.",
          },
          {
            requirementId: "conversation_preguntar_tema_emocional",
            text: "Pregunta cuál es el tema emocional que quiere para la próxima estrofa y confirma su elección.",
          },
          {
            requirementId: "conversation_negociar_volumen_pasajeros_durmiendo",
            text: "Negocia bajar el volumen porque hay pasajeros durmiendo, proponiendo un gesto para los crescendos.",
          },
          {
            requirementId: "conversation_pedir_revision_billete_entre_estofas",
            text: "Pídele que compruebe tu billete entre estrofas para mantener la seguridad, sin romper el clima escénico.",
          },
          {
            requirementId: "conversation_repetir_linea_lenta_diccion",
            text: "Pídele repetir despacio una línea difícil para practicar dicción.",
          },
          {
            requirementId: "conversation_aclarar_tempo_preferido",
            text: "Aclara si prefiere un tempo más rápido o más lento y justifica tu recomendación.",
          },
          {
            requirementId: "conversation_proponer_estrofa_en_ingles",
            text: "Propón cantar una estrofa en inglés para practicar, explicando el objetivo didáctico.",
          },
          {
            requirementId: "conversation_establecer_limite_seguridad_puerta",
            text: "Marca un límite amable sobre no bloquear la puerta del vagón durante la actuación.",
          },
          {
            requirementId: "conversation_convencer_acortar_aria_antes_estacion",
            text: "Convence de acortar el aria antes de la próxima estación indicando el minuto objetivo.",
          },
          {
            requirementId: "conversation_describir_imagenes_para_estrofa",
            text: "Describe imágenes evocadoras que la siguiente estrofa debería pintar para el público.",
          },
          {
            requirementId: "conversation_sugerir_llamada_respuesta",
            text: "Sugiere un juego de llamada y respuesta e indica qué líneas dirá cada uno.",
          },
          {
            requirementId: "conversation_incluir_nombre_pasajero",
            text: "Pide incluir el nombre de un pasajero de forma respetuosa y explica dónde encaja.",
          },
          {
            requirementId: "conversation_preguntar_termino_italiano",
            text: "Pregunta el significado de un término italiano que use y para qué sirve en la partitura.",
          },
          {
            requirementId: "conversation_responder_con_empatia_nervios",
            text: "Responde con empatía si muestra nervios, ofreciendo una breve estrategia para calmarse.",
          },
          {
            requirementId: "conversation_solicitar_articulacion_consonantes",
            text: "Solicita una articulación más clara de consonantes en una frase concreta.",
          },
          {
            requirementId: "conversation_plan_dinamicas_detallado",
            text: "Propón un plan de dinámicas con un pequeño crescendo seguido de un susurro controlado.",
          },
          {
            requirementId: "conversation_pedir_consentimiento_grabacion",
            text: "Pide su consentimiento para grabar un breve fragmento para repasar después.",
          },
          {
            requirementId: "conversation_preguntar_esquema_rima",
            text: "Pregunta qué esquema de rima desea y sugiere una alternativa.",
          },
          {
            requirementId: "conversation_confirmar_improvisacion_permitida",
            text: "Confirma si permite improvisar palabras en la siguiente repetición.",
          },
          {
            requirementId: "conversation_solicitar_cambio_tonalidad_para_duo",
            text: "Solicita cambiar de tonalidad para poder hacer un dúo, justificando el motivo.",
          },
          {
            requirementId: "conversation_proponer_linea_recapitulacion",
            text: "Propón una línea de recapitulación antes del remate final.",
          },
          {
            requirementId: "conversation_mejorar_acustica_cambiar_posicion",
            text: "Pide cambiarse de lugar en el vagón para mejorar la acústica.",
          },
          {
            requirementId: "conversation_acordar_senal_inicio_estrofa",
            text: "Acuerda una señal clara para iniciar la siguiente estrofa y repítela para confirmación.",
          },
          {
            requirementId: "english_bring_the_house_down_elogio",
            text: 'Usa la expresión inglesa "bring the house down" al elogiar una actuación especialmente potente.',
          },
          {
            requirementId: "english_tone_down_volumen",
            text: 'Pide amablemente bajar el volumen usando el phrasal verb "tone down" por los pasajeros dormidos.',
          },
          {
            requirementId: "english_belt_out_verso_fuerte",
            text: 'Indica que cante un verso con mucha fuerza usando "belt out" y di en qué momento hacerlo.',
          },
          {
            requirementId: "english_take_it_from_the_top_reiniciar",
            text: 'Solicita reiniciar desde el principio usando la expresión "take it from the top".',
          },
          {
            requirementId: "english_on_cue_coordinacion",
            text: 'Coordina una entrada mencionando que cantarás "on cue" tras su gesto.',
          },
          {
            requirementId: "english_out_of_tune_correccion",
            text: 'Corrige una nota desafinada usando la expresión "out of tune" y sugiere una corrección.',
          },
          {
            requirementId: "english_vocal_range_comentario",
            text: 'Comenta sobre su "vocal range" y si la estrofa se ajusta bien a él.',
          },
          {
            requirementId: "english_breath_control_sugerencia",
            text: 'Da una sugerencia breve sobre "breath control" para sostener una frase larga.',
          },
          {
            requirementId: "english_crescendo_decrescendo_plan",
            text: 'Traza un plan que mencione "crescendo" y "decrescendo" para dos líneas consecutivas.',
          },
          {
            requirementId: "english_libretto_discusion",
            text: 'Habla de la letra utilizando la palabra "libretto" y explica un ajuste propuesto.',
          },
          {
            requirementId: "english_key_change_modulacion",
            text: 'Propón una modulación usando el término "key change" y di por qué ayudaría.',
          },
          {
            requirementId: "english_time_signature_compas",
            text: 'Pregunta por el compás usando "time signature" y sugiere una alternativa.',
          },
          {
            requirementId: "english_acoustics_del_vagon",
            text: 'Menciona las "acoustics" del vagón y cómo afectan a la proyección.',
          },
          {
            requirementId: "english_timbre_descripcion",
            text: 'Describe el color de su voz usando la palabra "timbre" con un adjetivo apropiado.',
          },
          {
            requirementId: "english_stage_fright_empatia",
            text: 'Muestra empatía ante los nervios usando la expresión "stage fright".',
          },
          {
            requirementId: "english_hit_the_right_note_valoracion",
            text: 'Valora una línea usando el idiom "hit the right note" y explica por qué.',
          },
          {
            requirementId: "english_cut_it_short_por_estacion",
            text: 'Sugiere acortar una sección usando el phrasal "cut it short" por la inminente parada.',
          },
          {
            requirementId: "english_build_up_to_nota_alta",
            text: 'Planifica el clímax usando "build up to" antes de la nota alta.',
          },
          {
            requirementId: "english_carry_on_despues_anuncio",
            text: 'Da permiso para continuar tras una interrupción usando "carry on".',
          },
          {
            requirementId: "english_come_across_intencion",
            text: 'Comenta cómo se percibe el mensaje usando "come across" y sugiere un matiz.',
          },
          {
            requirementId: "english_steal_the_show_prediccion",
            text: 'Predice la reacción del público usando el idiom "steal the show".',
          },
          {
            requirementId: "english_break_a_leg_deseo_suerte",
            text: 'Desea suerte antes del gran momento usando "break a leg".',
          },
          {
            requirementId: "english_encore_pedir_bis",
            text: 'Solicita un bis al final usando la palabra "encore" y concreta qué repetir.',
          },
          {
            requirementId: "english_in_the_spotlight_enmarcar_momento",
            text: 'Enmarca el clímax usando la expresión "in the spotlight" para destacarlo.',
          },
          {
            requirementId: "english_nevertheless_conector_matiz",
            text: 'Introduce un matiz tras un elogio usando el conector "nevertheless".',
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
            requirementId: "conversation_pedir_historia_vagon",
            text: "Pide en inglés que cuente la historia más inquietante asociada a uno de los vagones.",
          },
          {
            requirementId: "conversation_pedir_fuente_historica",
            text: "Pregunta en inglés qué fuentes históricas respaldan esa historia.",
          },
          {
            requirementId: "conversation_reaccion_asombro_detalle",
            text: "Reacciona con asombro ante una anécdota y pide un detalle adicional específico.",
          },
          {
            requirementId: "conversation_preguntar_evento_real",
            text: "Pregunta si alguno de los sucesos ocurrió realmente o si es solo una leyenda.",
          },
          {
            requirementId: "conversation_comparar_pasado_presente",
            text: "Compara en inglés cómo era viajar en tren en el pasado frente a la experiencia actual.",
          },
          {
            requirementId: "conversation_pedir_linea_tiempo",
            text: "Solicita que resuma los eventos importantes del tren en una pequeña línea temporal.",
          },
          {
            requirementId: "conversation_cuestionar_detalle",
            text: "Cuestiona educadamente un detalle de la historia y pide una explicación más clara.",
          },
          {
            requirementId: "conversation_pedir_anecdota_personal",
            text: "Pregunta si alguna vez ella misma ha vivido algo extraño en este tren.",
          },
          {
            requirementId: "conversation_pedir_recomendacion_libro",
            text: "Pide que recomiende un libro o documento sobre la historia de los trenes.",
          },
          {
            requirementId: "conversation_resumir_historia",
            text: "Resume con tus propias palabras una historia que ella haya contado.",
          },
          {
            requirementId: "conversation_proponer_teoria",
            text: "Propón una teoría alternativa sobre por qué el tren tiene tantas historias misteriosas.",
          },
          {
            requirementId: "conversation_pedir_prueba_documento",
            text: "Pregunta si tiene documentos o mapas que prueben su versión de los hechos.",
          },
          {
            requirementId: "conversation_pedir_descripcion_antigua",
            text: "Pide una descripción de cómo se veía el tren hace cien años.",
          },
          {
            requirementId: "conversation_establecer_duda_educada",
            text: "Expresa en inglés una duda educada sobre una leyenda del tren.",
          },
          {
            requirementId: "conversation_pedir_evento_mas_importante",
            text: "Pregunta cuál fue el evento histórico más importante ocurrido en este tren.",
          },
          {
            requirementId: "conversation_pedir_explicacion_misterio",
            text: "Pide su explicación personal sobre por qué el tren tiene una reputación tan misteriosa.",
          },
          {
            requirementId: "conversation_proponer_visitar_vagon",
            text: "Sugiere visitar juntos uno de los vagones históricos para investigarlo.",
          },
          {
            requirementId: "conversation_pedir_objeto_antiguo",
            text: "Pregunta si alguna vez se ha encontrado un objeto antiguo en el tren.",
          },
          {
            requirementId: "conversation_conectar_historia_con_presente",
            text: "Conecta una historia del pasado con algo que esté ocurriendo actualmente en el tren.",
          },
          {
            requirementId: "conversation_hacer_prediccion",
            text: "Haz una predicción sobre cómo será la historia de este tren dentro de cien años.",
          },
          {
            requirementId: "conversation_pedir_conclusion_historia",
            text: "Pide que concluya una de sus historias con una reflexión histórica.",
          },
          {
            requirementId: "conversation_opinar_importancia_historia",
            text: "Explica por qué crees que es importante recordar la historia de lugares como este tren.",
          },
          {
            requirementId: "conversation_pedir_ultima_historia",
            text: "Pide una última historia breve antes de que el tren llegue a la siguiente estación.",
          },
          {
            requirementId: "conversation_reaccion_curiosidad_final",
            text: "Reacciona con curiosidad al final de la conversación y formula una última pregunta intrigante.",
          },
          {
            requirementId: "english_usar_historical_record",
            text: "Usa la expresión 'historical record' al hablar de documentos antiguos.",
          },
          {
            requirementId: "english_usar_primary_source",
            text: "Usa el término 'primary source' al preguntar por evidencia histórica.",
          },
          {
            requirementId: "english_usar_legend_has_it",
            text: "Usa la expresión 'legend has it' al referirte a una historia misteriosa del tren.",
          },
          {
            requirementId: "english_usar_back_in_the_day",
            text: "Usa la expresión 'back in the day' para hablar del pasado.",
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
            requirementId: "english_phrasal_piece_together",
            text: "Usa el phrasal verb 'piece together' al explicar cómo reconstruir eventos históricos.",
          },
          {
            requirementId: "english_phrasal_pass_down",
            text: "Usa el phrasal verb 'pass down' al hablar de historias transmitidas por generaciones.",
          },
          {
            requirementId: "english_idiom_a_piece_of_history",
            text: "Usa el idiom 'a piece of history' para describir el tren.",
          },
          {
            requirementId: "english_idiom_stand_the_test_of_time",
            text: "Usa el idiom 'stand the test of time' al hablar de algo histórico.",
          },
          {
            requirementId: "english_usar_turn_of_the_century",
            text: "Usa la expresión 'turn of the century' al hablar de una época histórica.",
          },
          {
            requirementId: "english_usar_remnant",
            text: "Usa la palabra 'remnant' para describir algo que queda del pasado.",
          },
          {
            requirementId: "english_usar_landmark_event",
            text: "Incluye 'landmark event' al describir un momento importante en la historia del tren.",
          },
          {
            requirementId: "english_usar_timeline",
            text: "Usa la palabra 'timeline' al pedir que organice los eventos históricos.",
          },
          {
            requirementId: "english_usar_intriguing",
            text: "Usa el adjetivo 'intriguing' para describir una historia del tren.",
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
            requirementId: "conversation_preguntar_metodo_coccion",
            text: "Pregunta en inglés cuál es el método de cocción exacto de la especialidad y cuánto tiempo se cocina.",
          },
          {
            requirementId: "conversation_confirmar_alergenos_detalle",
            text: "Pide en inglés que enumere todos los posibles alérgenos y cómo evita la contaminación cruzada en el vagón restaurante.",
          },
          {
            requirementId: "conversation_solicitar_descripcion_sabores",
            text: "Pide en inglés una descripción sensorial de sabores, texturas y aromas antes de decidir.",
          },
          {
            requirementId: "conversation_establecer_limite_porciones",
            text: "Negocia en inglés una porción de degustación pequeña antes de comprometerte con el plato completo.",
          },
          {
            requirementId: "conversation_indagar_nombre_extrano",
            text: "Pregunta en inglés por qué el plato tiene un nombre tan raro y qué representa.",
          },
          {
            requirementId: "conversation_pedir_credenciales_chef",
            text: "Pregunta en inglés por su formación culinaria y experiencia con cocina experimental.",
          },
          {
            requirementId: "conversation_pedir_opinion_clientes",
            text: "Solicita en inglés comentarios o reacciones de otros pasajeros que ya lo probaron.",
          },
          {
            requirementId: "conversation_explicar_preferencias_personales",
            text: "Explica en inglés dos preferencias personales de sabor que deben respetarse para considerar probarlo.",
          },
          {
            requirementId: "conversation_expresar_duda_educada",
            text: "Expresa en inglés escepticismo cortés sobre la seguridad del plato sin ofender al chef.",
          },
          {
            requirementId: "conversation_preguntar_origen_ingredientes",
            text: "Pregunta en inglés el origen de los ingredientes clave y cómo se almacenan en el tren.",
          },
          {
            requirementId: "conversation_solicitar_mostrar_preparacion",
            text: "Pide en inglés observar parte del proceso de preparación para ganar confianza.",
          },
          {
            requirementId: "conversation_negociar_nivel_picante",
            text: "Negocia en inglés el nivel de picante exacto que toleras y cómo lo ajustará.",
          },
          {
            requirementId: "conversation_preguntar_precio_y_reembolso",
            text: "Pregunta en inglés el precio, si incluye bebida, y si hay reembolso si no te gusta.",
          },
          {
            requirementId: "conversation_establecer_condiciones_tiempo",
            text: "Indica en inglés tu límite de tiempo antes de la próxima parada y pide confirmación de que el plato estará listo a tiempo.",
          },
          {
            requirementId: "conversation_solicitar_certificados_higiene",
            text: "Pregunta en inglés por inspecciones o certificados de higiene aplicables al vagón restaurante.",
          },
          {
            requirementId: "conversation_pedir_alternativa_dietetica",
            text: "Pide en inglés una alternativa vegetariana o sin lácteos manteniendo la idea del plato.",
          },
          {
            requirementId: "conversation_consultar_pruebas_previas",
            text: "Pregunta en inglés cuántas veces ha probado esta receta con pasajeros y qué ajustes hizo por su feedback.",
          },
          {
            requirementId: "conversation_reaccionar_a_contradiccion",
            text: "Si el chef se contradice, pide en inglés una aclaración específica y registra la respuesta.",
          },
          {
            requirementId: "conversation_pedir_maridaje_sin_alcohol",
            text: "Solicita en inglés una bebida sin alcohol que maride con la especialidad y explica por qué la prefieres.",
          },
          {
            requirementId: "conversation_proponer_prueba_olfativa",
            text: "Pide en inglés poder oler el plato o una especia clave antes de aceptar.",
          },
          {
            requirementId: "conversation_establecer_regla_utensilios",
            text: "Solicita en inglés que la muestra se sirva con utensilios limpios separados por motivos de alergia o preferencia.",
          },
          {
            requirementId: "conversation_contar_experiencia_pasada",
            text: "Relata en inglés una mala experiencia previa con un plato extraño y qué te haría sentir seguro esta vez.",
          },
          {
            requirementId: "conversation_comparar_con_plato_clasico",
            text: "Pide en inglés que compare su especialidad con un plato clásico conocido para entender el perfil de sabor.",
          },
          {
            requirementId: "conversation_pedir_lista_alergenos_escrita",
            text: "Solicita en inglés una lista escrita de ingredientes y alérgenos antes de dar tu decisión final.",
          },
          {
            requirementId: "conversation_plantear_consecuencia_si_no_gusta",
            text: "Pregunta en inglés qué opción ofrece si el plato no te gusta tras la primera cucharada.",
          },
          {
            requirementId: "english_usar_collocation_tasting_portion",
            text: "Usa la collocation en inglés 'tasting portion' al negociar una muestra pequeña.",
          },
          {
            requirementId: "english_usar_phrasal_turn_down",
            text: "Rechaza educadamente usando el phrasal verb en inglés 'turn down' si decides no probarlo.",
          },
          {
            requirementId: "english_usar_vocab_food_safety_cross_contamination",
            text: "Menciona en inglés 'food safety' y 'cross-contamination' al hablar de higiene.",
          },
          {
            requirementId: "english_usar_idiom_not_my_cup_of_tea",
            text: "Expresa que el plato no es de tu estilo usando el idiom en inglés 'not my cup of tea'.",
          },
          {
            requirementId: "english_usar_phrasal_talk_me_into",
            text: "Reta al chef a persuadirte usando en inglés la expresión 'talk me into it'.",
          },
          {
            requirementId: "english_usar_vocab_umami_aftertaste",
            text: "Describe en inglés el perfil con las palabras 'umami' y 'aftertaste'.",
          },
          {
            requirementId: "english_usar_collocation_refund_policy",
            text: "Pregunta en inglés por la 'refund policy' si el plato no te convence.",
          },
          {
            requirementId: "english_usar_idiom_smell_a_rat",
            text: "Expresa sospecha educada usando el idiom en inglés 'smell a rat'.",
          },
          {
            requirementId: "english_usar_phrasal_go_easy_on",
            text: "Pide moderación en una especia usando en inglés 'go easy on'.",
          },
          {
            requirementId: "english_usar_vocab_locally_sourced_seasonal",
            text: "Pregunta en inglés si los ingredientes son 'locally sourced' y 'seasonal'.",
          },
          {
            requirementId: "english_usar_collocation_culinary_credentials",
            text: "Pregunta en inglés por sus 'culinary credentials'.",
          },
          {
            requirementId: "english_usar_idiom_on_the_fence",
            text: "Di en inglés que aún dudas usando el idiom 'on the fence'.",
          },
          {
            requirementId: "english_usar_phrasal_swap_out",
            text: "Propón en inglés 'swap out' un ingrediente problemático por otro.",
          },
          {
            requirementId: "english_usar_collocation_spice_tolerance",
            text: "Menciona en inglés tu 'spice tolerance' al negociar el picante.",
          },
          {
            requirementId: "english_usar_phrasal_win_me_over",
            text: "Indica en inglés qué te podría convencer usando 'win me over'.",
          },
          {
            requirementId: "english_usar_idiom_too_good_to_be_true",
            text: "Muestra cautela usando el idiom en inglés 'too good to be true'.",
          },
          {
            requirementId: "english_usar_collocation_shelf_life",
            text: "Pregunta en inglés por la 'shelf life' de un ingrediente en el tren.",
          },
          {
            requirementId: "english_usar_phrasal_set_off",
            text: "Menciona en inglés que cierto ingrediente podría 'set off' una alergia.",
          },
          {
            requirementId: "english_usar_vocab_smoky_undertones_hint_of",
            text: "Pide en inglés si el plato tiene 'smoky undertones' o 'a hint of' alguna especia.",
          },
          {
            requirementId: "english_usar_idiom_raises_red_flags",
            text: "Señala en inglés que algo 'raises red flags' sobre el plato.",
          },
          {
            requirementId: "english_usar_phrasal_tone_down",
            text: "Solicita en inglés 'tone down' la acidez o el picante.",
          },
          {
            requirementId: "english_usar_idiom_right_up_my_alley",
            text: "Si te gusta la propuesta, di en inglés que es 'right up my alley'.",
          },
          {
            requirementId: "english_usar_phrasal_take_you_up_on",
            text: "Acepta una oferta específica usando en inglés 'take you up on'.",
          },
          {
            requirementId: "english_usar_collocation_on_the_house",
            text: "Pregunta en inglés si la degustación es 'on the house'.",
          },
          {
            requirementId: "english_usar_phrasal_backfire",
            text: "Advierte en inglés que cierta combinación podría 'backfire' en el sabor.",
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
            requirementId: "conversation_pedido_tomar_notas",
            text: "Solicita permiso explícito para tomar notas del libro sin tocarlo.",
          },
          {
            requirementId: "conversation_resumen_teoria_breve",
            text: "Pídele que exprese su teoría principal en no más de veinte palabras.",
          },
          {
            requirementId: "conversation_pregunta_clave_cifrado",
            text: "Pregunta cuál cree que es la clave o el tipo de cifrado que se usa en el pasaje.",
          },
          {
            requirementId: "conversation_identificar_evidencia_linea",
            text: "Exige que señale una línea exacta como evidencia de un mensaje oculto.",
          },
          {
            requirementId: "conversation_proponer_voz_baja",
            text: "Sugiere continuar la investigación en voz baja para no llamar la atención en el coche literario.",
          },
          {
            requirementId: "conversation_plan_tres_pasos_estacion",
            text: "Negocia un plan de tres pasos para verificar la teoría antes de la próxima estación.",
          },
          {
            requirementId: "conversation_empatia_con_limites",
            text: "Muestra empatía por su entusiasmo pero establece el límite de no acusar a ningún pasajero.",
          },
          {
            requirementId: "conversation_comparar_ediciones",
            text: "Propón comparar, si es posible, otra edición del libro para ver si el patrón se repite.",
          },
          {
            requirementId: "conversation_descartar_coincidencias",
            text: "Formula una pregunta destinada a descartar que el patrón sea pura coincidencia.",
          },
          {
            requirementId: "conversation_justificar_motivo_autor",
            text: "Pide que justifique por qué el autor dejaría un mensaje secreto precisamente en un tren.",
          },
          {
            requirementId: "conversation_acordar_senal_revisor",
            text: "Acuerda una señal discreta por si se acerca el revisor y hay que ocultar la investigación.",
          },
          {
            requirementId: "conversation_aclarar_simbolos_margen",
            text: "Solicita aclaración sobre el significado de símbolos o marcas en los márgenes.",
          },
          {
            requirementId: "conversation_probar_cifrado_sustitucion",
            text: "Sugiere probar un cifrado de sustitución con un ejemplo concreto del pasaje.",
          },
          {
            requirementId: "conversation_involucrar_camarero_discreto",
            text: "Propón, con discreción, pedir al camarero si recuerda quién dejó anotaciones en ese libro.",
          },
          {
            requirementId: "conversation_escepticismo_educado",
            text: "Expresa escepticismo educado ante una afirmación extrema y pide una razón adicional.",
          },
          {
            requirementId: "conversation_limite_etico_libros_ajenos",
            text: "Deja claro que no arrancarás páginas ni manipularás libros ajenos bajo ninguna circunstancia.",
          },
          {
            requirementId: "conversation_escenario_si_falsa",
            text: "Pregunta qué haría si la hipótesis resultara falsa y cómo lo aceptaría.",
          },
          {
            requirementId: "conversation_documentar_hallazgos_sin_riesgo",
            text: "Propón documentar los hallazgos con un esquema o foto sin infringir normas del tren.",
          },
          {
            requirementId: "conversation_bloque_tiempo_concentracion",
            text: "Solicita un bloque de tiempo concreto para concentrarse sin interrupciones.",
          },
          {
            requirementId: "conversation_buscar_acrosticos_iniciales",
            text: "Pregunta si detecta un patrón de acrósticos o iniciales en los párrafos.",
          },
          {
            requirementId: "conversation_persuadir_exp_mundana",
            text: "Intenta persuadirle de considerar una explicación mundana alternativa al menos por un momento.",
          },
          {
            requirementId: "conversation_parafrasear_instruccion",
            text: "Repite con tus propias palabras su última instrucción para confirmar que la entendiste.",
          },
          {
            requirementId: "conversation_acordar_criterios_exito",
            text: "Acordad criterios concretos de éxito para aceptar o rechazar la teoría.",
          },
          {
            requirementId: "conversation_pedir_bajar_tono",
            text: "Pide amablemente que baje el tono conspirativo para no alarmar a otros pasajeros.",
          },
          {
            requirementId: "english_uso_cipher",
            text: 'Usa la palabra en inglés "cipher" al proponer el método que vais a probar.',
          },
          {
            requirementId: "english_uso_anagram",
            text: 'Emplea "anagram" al analizar una palabra sospechosa del pasaje.',
          },
          {
            requirementId: "english_uso_marginalia",
            text: 'Menciona "marginalia" al referirte a las notas o garabatos en los márgenes.',
          },
          {
            requirementId: "english_uso_footnote",
            text: 'Incluye "footnote" al sugerir dónde podría esconderse una pista.',
          },
          {
            requirementId: "english_collocation_circumstantial_evidence",
            text: 'Usa la collocation "circumstantial evidence" al evaluar la solidez de una prueba.',
          },
          {
            requirementId: "english_collocation_pattern_recognition",
            text: 'Incluye "pattern recognition" para describir cómo detectas el posible patrón.',
          },
          {
            requirementId: "english_referencia_occams_razor",
            text: 'Menciona "Occam\'s razor" al proponer una explicación más simple.',
          },
          {
            requirementId: "english_phrasal_rule_out",
            text: 'Emplea el phrasal verb "rule out" para descartar una interpretación concreta.',
          },
          {
            requirementId: "english_phrasal_point_out",
            text: 'Usa "point out" al señalar una línea o palabra específica como evidencia.',
          },
          {
            requirementId: "english_phrasal_figure_out",
            text: 'Incluye "figure out" al explicar lo que intentáis resolver.',
          },
          {
            requirementId: "english_phrasal_back_up",
            text: 'Utiliza "back up" para pedir soporte o datos que respalden una afirmación.',
          },
          {
            requirementId: "english_phrasal_piece_together",
            text: 'Usa "piece together" al describir cómo uniréis las pistas.',
          },
          {
            requirementId: "english_phrasal_look_into",
            text: 'Incluye "look into" cuando propongas investigar un detalle del texto.',
          },
          {
            requirementId: "english_idiom_red_herring",
            text: 'Emplea el idiom "red herring" para advertir sobre una distracción engañosa.',
          },
          {
            requirementId: "english_idiom_hidden_in_plain_sight",
            text: 'Usa "hidden in plain sight" para describir una pista obvia que pasa desapercibida.',
          },
          {
            requirementId: "english_idiom_too_good_to_be_true",
            text: 'Incluye "too good to be true" al dudar de una coincidencia perfecta.',
          },
          {
            requirementId: "english_expression_burden_of_proof",
            text: 'Menciona "burden of proof" al discutir quién debe demostrar la teoría.',
          },
          {
            requirementId: "english_adjetivo_plausible",
            text: 'Usa "plausible" para calificar una explicación razonable.',
          },
          {
            requirementId: "english_discurso_on_second_thought",
            text: 'Incluye el marcador discursivo "on second thought" al corregirte con una idea mejor.',
          },
          {
            requirementId: "english_discurso_nevertheless",
            text: 'Utiliza "nevertheless" para contraponer tu objeción a su entusiasmo.',
          },
          {
            requirementId: "english_discurso_as_far_as_i_can_tell",
            text: 'Emplea "as far as I can tell" para expresar cautela basada en la evidencia.',
          },
          {
            requirementId: "english_expression_off_the_record",
            text: 'Usa "off the record" al sugerir que cierta parte de la charla sea discreta.',
          },
          {
            requirementId: "english_collocation_encrypted_message",
            text: 'Menciona "encrypted message" al formular tu hipótesis concreta.',
          },
          {
            requirementId: "english_collocation_cross_reference",
            text: 'Emplea "cross-reference" al proponer comparar dos pasajes o ediciones.',
          },
          {
            requirementId: "english_idiom_smoking_gun",
            text: 'Usa "smoking gun" para definir la prueba definitiva que estáis buscando.',
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
            text: "Preséntate brevemente y explica por qué viajas a medianoche al acercarte al Night Agent.",
          },
          {
            requirementId: "conversation_preguntar_precio_asiento_vacio",
            text: "Pregunta el precio y las condiciones de la experiencia del asiento vacío que ofrece.",
          },
          {
            requirementId: "conversation_confirmar_reglas_reformulando",
            text: "Reformula en una sola frase las reglas del desafío verbal y pide confirmación explícita.",
          },
          {
            requirementId: "conversation_preguntar_tiempo_limite",
            text: "Pregunta si hay un tiempo límite para responder al reto y solicita que lo especifique.",
          },
          {
            requirementId: "conversation_investigar_luces_parpadeo",
            text: "Pregunta qué significan las luces que parpadean en el vagón y cómo afectan la experiencia.",
          },
          {
            requirementId: "conversation_solicitar_demostracion_enigma_corto",
            text: "Pide una demostración breve con un miniacertijo antes de aceptar el trato.",
          },
          {
            requirementId: "conversation_exponer_limites_seguridad",
            text: "Declara un límite de seguridad personal y pide garantías de que se respetará.",
          },
          {
            requirementId: "conversation_consultar_reembolso_fallo",
            text: "Pregunta si hay reembolso o alternativa si no superas el desafío.",
          },
          {
            requirementId: "conversation_negociar_paquete_dos_beneficios",
            text: "Propón un intercambio donde obtengas dos beneficios a cambio de una sola respuesta correcta, justificando tu propuesta.",
          },
          {
            requirementId: "conversation_contraoferta_moderada",
            text: "Haz una contraoferta razonable al primer precio que te diga y explica tu motivo.",
          },
          {
            requirementId: "conversation_pedir_pista_aleatoria_tarjeta",
            text: "Pide que saque una carta de su baraja y ofrezca una pista basada en ella.",
          },
          {
            requirementId: "conversation_pedir_frase_codigo",
            text: "Pregunta si hay una frase clave que deba decirse para activar la experiencia del asiento.",
          },
          {
            requirementId: "conversation_evaluar_consecuencias_fracaso",
            text: "Pregunta explícitamente qué ocurre si fallas el reto y si hay penalizaciones.",
          },
          {
            requirementId: "conversation_pedir_aclaracion_ambiguedad",
            text: "Señala un punto ambiguo de su oferta y pide que lo aclare con un ejemplo concreto.",
          },
          {
            requirementId: "conversation_reaccion_humor_oscuro",
            text: "Reacciona a un chiste oscuro suyo indicando con tacto que límites no quieres cruzar.",
          },
          {
            requirementId: "conversation_solicitar_asiento_especifico",
            text: "Pide un asiento específico (pasillo o ventana) y da una razón relacionada con la visibilidad de las luces.",
          },
          {
            requirementId: "conversation_establecer_palabra_segura",
            text: "Propón una palabra segura para pausar el reto y confirma que él la acepta.",
          },
          {
            requirementId: "conversation_pedir_testimonio_tercero",
            text: "Pregunta si alguien más ha completado el reto y solicita un ejemplo de lo que dijeron.",
          },
          {
            requirementId: "conversation_proponer_prueba_intercambio",
            text: "Propón intercambiar una pista por un dato curioso del tren y cumple con dar ese dato.",
          },
          {
            requirementId: "conversation_opinar_sobre_etica_trato",
            text: "Da tu opinión sobre la ética de vender experiencias a medianoche y susténtala con una razón.",
          },
          {
            requirementId: "conversation_solicitar_version_mas_facil",
            text: "Pide una versión alternativa más sencilla del reto y explica por qué la prefieres.",
          },
          {
            requirementId: "conversation_comprometer_discrecion",
            text: "Promete discreción sobre el trato y especifica cómo mantendrás la confidencialidad.",
          },
          {
            requirementId: "conversation_resumir_terminos_cierre",
            text: "Resume en una sola oración los términos finales acordados y pídele confirmación.",
          },
          {
            requirementId: "conversation_expresar_condicion_aceptacion",
            text: "Di que aceptarás el reto solo si se cumple una condición concreta relacionada con el asiento o las luces.",
          },
          {
            requirementId: "conversation_rechazar_parte_riesgosa",
            text: "Rechaza con cortesía un elemento que consideres arriesgado y propone una alternativa segura.",
          },
          {
            requirementId: "english_usar_flicker_luces",
            text: "Describe las luces del tren usando la palabra en inglés 'flicker'.",
          },
          {
            requirementId: "english_usar_vacant_seat",
            text: "Refiérete a un asiento disponible usando la expresión en inglés 'vacant seat'.",
          },
          {
            requirementId: "english_usar_carriage_corridor",
            text: "Menciona el lugar donde se sienta el vendedor usando la collocation en inglés 'carriage corridor'.",
          },
          {
            requirementId: "english_usar_lantern",
            text: "Incluye la palabra en inglés 'lantern' al describir lo que él sostiene.",
          },
          {
            requirementId: "english_usar_eerie",
            text: "Califica la atmósfera usando el adjetivo en inglés 'eerie'.",
          },
          {
            requirementId: "english_usar_riddle",
            text: "Nombra el desafío verbal usando la palabra en inglés 'riddle'.",
          },
          {
            requirementId: "english_usar_wager",
            text: "Habla del trato como si fuera una apuesta usando la palabra en inglés 'wager'.",
          },
          {
            requirementId: "english_phrasal_turn_down",
            text: "Rechaza una parte de la oferta usando el phrasal verb en inglés 'turn down'.",
          },
          {
            requirementId: "english_idiom_call_your_bluff",
            text: "Indica que pondrás a prueba su audacia usando la expresión en inglés 'call your bluff'.",
          },
          {
            requirementId: "english_idiom_raise_the_stakes",
            text: "Propón intensificar el trato usando la expresión en inglés 'raise the stakes'.",
          },
          {
            requirementId: "english_idiom_no_strings_attached",
            text: "Aclara que quieres una condición sin compromisos usando la expresión en inglés 'no strings attached'.",
          },
          {
            requirementId: "english_phrasal_play_along",
            text: "Di que seguirás su juego por un momento usando el phrasal verb en inglés 'play along'.",
          },
          {
            requirementId: "english_phrasal_back_out",
            text: "Establece que te retirarás si cambia las reglas usando el phrasal verb en inglés 'back out'.",
          },
          {
            requirementId: "english_phrasal_stick_to",
            text: "Exige constancia en las normas usando el phrasal verb en inglés 'stick to'.",
          },
          {
            requirementId: "english_phrasal_hand_over",
            text: "Indica el momento de entregar la recompensa usando el phrasal verb en inglés 'hand over'.",
          },
          {
            requirementId: "english_idiom_keep_it_under_wraps",
            text: "Promete confidencialidad usando la expresión en inglés 'keep it under wraps'.",
          },
          {
            requirementId: "english_phrasal_sort_out",
            text: "Sugiere resolver un detalle logístico usando el phrasal verb en inglés 'sort out'.",
          },
          {
            requirementId: "english_phrasal_bring_up",
            text: "Introduce una preocupación nueva usando el phrasal verb en inglés 'bring up'.",
          },
          {
            requirementId: "english_phrasal_look_into",
            text: "Propón investigar una rareza del tren usando el phrasal verb en inglés 'look into'.",
          },
          {
            requirementId: "english_idiom_on_the_same_page",
            text: "Confirma alineación de expectativas usando la expresión en inglés 'on the same page'.",
          },
          {
            requirementId: "english_idiom_in_the_dead_of_night",
            text: "Menciona la hora del trato usando la expresión en inglés 'in the dead of night'.",
          },
          {
            requirementId: "english_usar_aisle_seat",
            text: "Solicita una ubicación específica usando la collocation en inglés 'aisle seat'.",
          },
          {
            requirementId: "english_usar_clandestine",
            text: "Describe la transacción como secreta usando el adjetivo en inglés 'clandestine'.",
          },
          {
            requirementId: "english_usar_omen_superstition",
            text: "Relaciona las luces con la suerte usando las palabras en inglés 'omen' o 'superstition'.",
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
          "En una plaza bulliciosa un vendedor te dice que vio tu teléfono... a cambio de ayudarte a encontrar su sombrero perdido. Todo es un poco sospechoso y muy teatral.",
        aiRole:
          "Eres un vendedor callejero excéntrico y teatral que afirma saberlo todo sobre objetos perdidos. Habla con dramatismo, usa metáforas y provoca al alumno para que haga preguntas concretas. Mantén humor y algo de misterio.",
        caracterName: "Milo the Magician",
        caracterPrompt:
          "A middle-aged street performer wearing a colorful patchwork coat, a slightly crooked top hat, and fingerless gloves. He has a mischievous grin, twinkling eyes, and stands in a busy square with juggling props scattered around. He gestures dramatically as if telling a tall tale.",
        requirements: [
          {
            requirementId: "conversation_pregunta_cuando_donde_vio",
            text: "Pregunta con precisión dónde y a qué hora exacta Milo vio el teléfono.",
          },
          {
            requirementId: "conversation_confirma_descripcion_telefono",
            text: "Describe tu teléfono (modelo, color, funda, pantalla) y pide que confirme si coincide.",
          },
          {
            requirementId: "conversation_negocia_ayuda_contra_pista",
            text: "Negocia su ayuda ofreciendo una recompensa condicionada a una pista verificable.",
          },
          {
            requirementId: "conversation_pide_prueba_concreta",
            text: "Solicita una prueba concreta de que realmente vio tu teléfono, como un detalle único.",
          },
          {
            requirementId: "conversation_propone_llamar_telefono",
            text: "Propón llamar a tu número en altavoz y pide que guarde silencio para escuchar.",
          },
          {
            requirementId: "conversation_establece_limite_tiempo",
            text: "Establece un límite de tiempo claro para la búsqueda conjunta en la plaza.",
          },
          {
            requirementId: "conversation_rechaza_pago_anticipado",
            text: "Rechaza entregar dinero por adelantado y ofrece una alternativa razonable.",
          },
          {
            requirementId: "conversation_pide_ruta_recreada",
            text: "Pide que recree su ruta y señale exactamente dónde vio el objeto.",
          },
          {
            requirementId: "conversation_evalua_sospechas_con_cortesia",
            text: "Expresa tu sospecha de manera cortés y solicita transparencia.",
          },
          {
            requirementId: "conversation_acuerda_puntos_control",
            text: "Propón dos puntos de control en el recorrido para verificar el progreso.",
          },
          {
            requirementId: "conversation_empatiza_sombrero_perdido",
            text: "Muestra empatía por su sombrero perdido y pregunta por su valor sentimental.",
          },
          {
            requirementId: "conversation_concreta_intercambio_sombrero_pista",
            text: "Aclara las condiciones exactas del intercambio: ayuda con el sombrero a cambio de una pista válida.",
          },
          {
            requirementId: "conversation_pide_describir_sombrero",
            text: "Pide que describa el sombrero con detalles para poder identificarlo.",
          },
          {
            requirementId: "conversation_pide_no_trucos_confusos",
            text: "Solicita que evite trucos o distracciones durante la negociación.",
          },
          {
            requirementId: "conversation_pide_contacto_posterior",
            text: "Pide un medio de contacto si deben separarse durante la búsqueda.",
          },
          {
            requirementId: "conversation_propone_involucrar_seguridad",
            text: "Propón informar a seguridad o a un guardia de la plaza como respaldo.",
          },
          {
            requirementId: "conversation_pide_consentimiento_grabar_detalles",
            text: "Pide permiso para anotar o grabar en audio los detalles clave que aporte.",
          },
          {
            requirementId: "conversation_indaga_si_otro_lo_tomo",
            text: "Pregunta si vio a otra persona levantar el teléfono y hacia dónde fue.",
          },
          {
            requirementId: "conversation_consulta_puestos_cercanos",
            text: "Sugiere preguntar a dos puestos cercanos si vieron el teléfono y pide que te acompañe.",
          },
          {
            requirementId: "conversation_pide_mostrar_bolsillos_bolsa",
            text: "Pide, con respeto, que muestre sus bolsillos o bolsa para descartar malentendidos.",
          },
          {
            requirementId: "conversation_propone_senal_acustica",
            text: "Propón usar una alarma o tono alto para localizar el teléfono entre el ruido de la plaza.",
          },
          {
            requirementId: "conversation_exige_claridad_condiciones",
            text: "Exige que exprese claramente qué espera a cambio antes de continuar.",
          },
          {
            requirementId: "conversation_prueba_coherencia_relato",
            text: "Pide que repita el relato con los mismos detalles para comprobar coherencia.",
          },
          {
            requirementId: "conversation_establece_premio_condicional",
            text: "Confirma que solo habrá propina si la pista conduce al teléfono sin engaños.",
          },
          {
            requirementId: "conversation_cierra_siguientes_pasos",
            text: "Resume y confirma los próximos pasos exactos y quién hace qué en cada uno.",
          },
          {
            requirementId: "english_usa_cut_to_the_chase",
            text: 'Usa la expresión idiomática "cut to the chase" para pedir que vaya al punto.',
          },
          {
            requirementId: "english_usa_verifiable_proof",
            text: 'Usa la collocation "verifiable proof" al exigir evidencia.',
          },
          {
            requirementId: "english_usa_hand_over",
            text: 'Usa el phrasal verb "hand over" para rechazar entregar dinero por adelantado.',
          },
          {
            requirementId: "english_usa_raise_red_flags",
            text: 'Usa el idiom "raise red flags" para explicar por qué la historia te parece sospechosa.',
          },
          {
            requirementId: "english_usa_track_down",
            text: 'Usa el phrasal verb "track down" para proponer cómo localizar el teléfono.',
          },
          {
            requirementId: "english_usa_on_the_up_and_up",
            text: 'Usa el idiom "on the up and up" para pedir que todo sea legítimo.',
          },
          {
            requirementId: "english_usa_sleight_of_hand",
            text: 'Usa el término "sleight of hand" para referirte a posibles trucos.',
          },
          {
            requirementId: "english_usa_set_a_firm_deadline",
            text: 'Usa la collocation "set a firm deadline" al proponer un límite de tiempo.',
          },
          {
            requirementId: "english_usa_trust_but_verify",
            text: 'Usa la frase "trust but verify" para establecer tu postura.',
          },
          {
            requirementId: "english_usa_too_good_to_be_true",
            text: 'Usa el idiom "too good to be true" para evaluar una promesa exagerada.',
          },
          {
            requirementId: "english_usa_point_out",
            text: 'Usa el phrasal verb "point out" al pedir que señale el lugar exacto.',
          },
          {
            requirementId: "english_usa_call_off",
            text: 'Usa el phrasal verb "call off" para plantear cancelar el trato si no hay pruebas.',
          },
          {
            requirementId: "english_usa_quid_pro_quo",
            text: 'Usa la expresión "quid pro quo" para definir el intercambio justo.',
          },
          {
            requirementId: "english_usa_before_we_go_any_further",
            text: 'Usa el marcador discursivo "Before we go any further" para introducir una condición.',
          },
          {
            requirementId: "english_usa_stall_for_time",
            text: 'Usa el phrasal verb "stall for time" para acusar o evitar demoras innecesarias.',
          },
          {
            requirementId: "english_usa_wild_goose_chase",
            text: 'Usa el idiom "wild goose chase" para advertir contra una búsqueda inútil.',
          },
          {
            requirementId: "english_usa_spill_the_beans",
            text: 'Usa el idiom "spill the beans" para pedir que revele la pista real.',
          },
          {
            requirementId: "english_usa_no_strings_attached",
            text: 'Usa la expresión "no strings attached" para aclarar que no habrá condiciones ocultas.',
          },
          {
            requirementId: "english_usa_come_clean",
            text: 'Usa el phrasal verb "come clean" para pedir honestidad total.',
          },
          {
            requirementId: "english_usa_all_things_considered",
            text: 'Usa el conector "All things considered" para sopesar opciones.',
          },
          {
            requirementId: "english_usa_fair_trade_off",
            text: 'Usa la collocation "fair trade-off" al proponer el intercambio.',
          },
          {
            requirementId: "english_usa_in_broad_daylight",
            text: 'Usa la expresión "in broad daylight" para subrayar lo visible de la plaza.',
          },
          {
            requirementId: "english_usa_back_out",
            text: 'Usa el phrasal verb "back out" para describir qué pasará si él se echa atrás.',
          },
          {
            requirementId: "english_usa_the_ball_is_in_your_court",
            text: 'Usa el idiom "the ball is in your court" para poner la decisión en sus manos.',
          },
          {
            requirementId: "english_usa_stick_to_the_plan",
            text: 'Usa el phrasal verb "stick to the plan" para exigir que siga lo acordado.',
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
            text: "Explica con precisión en inglés a qué hora y en qué mesa crees que dejaste el celular, y confirma esos dos datos con la barista.",
          },
          {
            requirementId: "conversation_describir_telefono_y_funda",
            text: "Describe en inglés el modelo, color, funda y cualquier rasgo distintivo del teléfono para que la barista lo anote.",
          },
          {
            requirementId:
              "conversation_preguntar_objetos_extraviados_recientes",
            text: "Pregunta en inglés si hubo reportes recientes de objetos extraviados y si alguno coincide con tu teléfono.",
          },
          {
            requirementId: "conversation_consultar_cctv_y_limitaciones",
            text: "Pregunta en inglés si pueden revisar cámaras de seguridad y solicita aclaración sobre límites o permisos necesarios.",
          },
          {
            requirementId: "conversation_pedir_revisar_caja_perdidos",
            text: "Pide en inglés ver la caja de objetos perdidos y solicita que verifiquen bolsillos de delantales o la barra.",
          },
          {
            requirementId: "conversation_proponer_llamar_y_observar",
            text: "Propón en inglés llamar a tu número desde el local y observar si suena o vibra en alguna zona de la cafetería.",
          },
          {
            requirementId: "conversation_indagar_quien_lo_vio_ultimo",
            text: "Pregunta en inglés quién fue la última persona que vio un teléfono parecido y solicita una breve descripción.",
          },
          {
            requirementId: "conversation_negociar_prioridad_busqueda",
            text: "Negocia en inglés que la revisión inicial se haga de inmediato, dando una razón convincente y respetuosa.",
          },
          {
            requirementId: "conversation_aclarar_malentendidos_modelo",
            text: "Corrige en inglés cualquier confusión de la barista sobre el modelo o color, sin confrontación.",
          },
          {
            requirementId: "conversation_empathize_y_agradecer",
            text: "Muestra empatía en inglés por las molestias al personal y agradece explícitamente la ayuda ofrecida.",
          },
          {
            requirementId: "conversation_pedir_resumen_pistas",
            text: "Solicita en inglés que la barista te lea o resuma las pistas que ha anotado en su libreta.",
          },
          {
            requirementId: "conversation_solicitar_preguntar_clientes_cercanos",
            text: "Pide en inglés que pregunte discretamente a los clientes cercanos si vieron un teléfono en tu mesa.",
          },
          {
            requirementId: "conversation_proponer_dividir_tareas",
            text: "Propón en inglés un plan para dividir tareas de búsqueda entre tú y la barista con zonas específicas.",
          },
          {
            requirementId: "conversation_establecer_senal_contacto",
            text: "Acorda en inglés una forma clara de contacto o señal si el teléfono aparece después de que te vayas.",
          },
          {
            requirementId: "conversation_pedir_verificacion_ticket_hora",
            text: "Pide en inglés revisar el ticket o recibo para confirmar la hora exacta en que pagaste y te fuiste.",
          },
          {
            requirementId: "conversation_definir_siguientes_pasos_concretos",
            text: "Solicita en inglés una acción concreta a seguir dentro del local, como revisar una mesa específica o el área de recogida de pedidos.",
          },
          {
            requirementId: "conversation_rebatir_teoria_inverosimil",
            text: "Rechaza en inglés de forma educada una teoría poco probable y ofrece una alternativa más plausible.",
          },
          {
            requirementId: "conversation_pedir_permiso_area_restringida",
            text: "Pide en inglés permiso para asomarte a un área cercana a la barra sin invadir zonas restringidas.",
          },
          {
            requirementId: "conversation_confirmar_linea_temporal",
            text: "Confirma en inglés la línea temporal con la barista, desde que llegaste hasta que notaste la ausencia del teléfono.",
          },
          {
            requirementId: "conversation_solicitar_llamada_prueba_con_volumen",
            text: "Pide en inglés aumentar el volumen de la música por un momento o bajarlo para facilitar oír la llamada de prueba.",
          },
          {
            requirementId: "conversation_pedir_descripciones_breve_asistentes",
            text: "Pregunta en inglés por descripciones breves de personas que se sentaron cerca de tu mesa durante tu estancia.",
          },
          {
            requirementId: "conversation_reaccionar_a_nueva_pista",
            text: "Reacciona en inglés a una nueva pista de la barista y sugiere cómo integrarla en la búsqueda.",
          },
          {
            requirementId: "conversation_establecer_hora_retorno",
            text: "Comprométete en inglés a volver más tarde y acuerda una hora específica para verificar novedades.",
          },
          {
            requirementId: "conversation_solicitar_nota_contacto_clara",
            text: "Pide en inglés que anoten tu contacto alternativo y una instrucción clara por si alguien entrega el teléfono.",
          },
          {
            requirementId: "conversation_pedir_verificacion_debajo_mesas",
            text: "Solicita en inglés una verificación rápida debajo de mesas, sofás y la estación de leche o condimentos.",
          },
          {
            requirementId: "english_use_last_seen_at",
            text: "Usa la frase en inglés 'last seen at' para indicar el lugar exacto donde viste tu teléfono por última vez.",
          },
          {
            requirementId: "english_use_security_footage",
            text: "Usa el término en inglés 'security footage' al pedir revisar las cámaras.",
          },
          {
            requirementId: "english_use_lost_and_found_box",
            text: "Menciona en inglés 'lost-and-found box' cuando solicites ver los objetos perdidos.",
          },
          {
            requirementId: "english_use_track_down_phrasal",
            text: "Incluye el phrasal verb en inglés 'track down' para proponer cómo localizar el teléfono.",
          },
          {
            requirementId: "english_use_rule_out_phrasal",
            text: "Emplea el phrasal verb en inglés 'rule out' para descartar una hipótesis.",
          },
          {
            requirementId: "english_use_piece_together_phrasal",
            text: "Usa el phrasal verb en inglés 'piece together' para explicar cómo reconstruir la línea temporal.",
          },
          {
            requirementId: "english_use_red_herring_idiom",
            text: "Incluye el idiom en inglés 'red herring' para señalar una pista engañosa.",
          },
          {
            requirementId: "english_use_the_plot_thickens_idiom",
            text: "Di en inglés 'the plot thickens' al reaccionar a una nueva pista interesante.",
          },
          {
            requirementId: "english_use_on_the_same_page_idiom",
            text: "Usa el idiom en inglés 'on the same page' para confirmar que tú y la barista comparten el plan.",
          },
          {
            requirementId: "english_use_in_the_nick_of_time_idiom",
            text: "Emplea el idiom en inglés 'in the nick of time' si surge una pista a tiempo.",
          },
          {
            requirementId: "english_use_cover_your_tracks_idiom",
            text: "Usa el idiom en inglés 'cover your tracks' al hablar de alguien que pudo ocultar evidencia.",
          },
          {
            requirementId: "english_use_slip_through_the_cracks_idiom",
            text: "Incluye el idiom en inglés 'slip through the cracks' para referirte a un detalle pasado por alto.",
          },
          {
            requirementId: "english_use_a_needle_in_a_haystack_idiom",
            text: "Usa el idiom en inglés 'a needle in a haystack' para describir la dificultad de la búsqueda.",
          },
          {
            requirementId: "english_use_look_into_phrasal",
            text: "Emplea el phrasal verb en inglés 'look into' para sugerir investigar una pista específica.",
          },
          {
            requirementId: "english_use_follow_up_phrasal",
            text: "Usa el phrasal verb en inglés 'follow up' para pedir revisar más tarde una posible pista.",
          },
          {
            requirementId: "english_use_narrow_down_phrasal",
            text: "Incluye el phrasal verb en inglés 'narrow down' para reducir las opciones de ubicación.",
          },
          {
            requirementId: "english_use_turn_up_phrasal",
            text: "Emplea el phrasal verb en inglés 'turn up' cuando sugieras que el teléfono podría aparecer.",
          },
          {
            requirementId: "english_use_hand_over_phrasal",
            text: "Usa el phrasal verb en inglés 'hand over' para referirte a entregar el teléfono al personal.",
          },
          {
            requirementId: "english_use_back_up_phrasal",
            text: "Incluye el phrasal verb en inglés 'back up' al mencionar tus datos como medida de seguridad.",
          },
          {
            requirementId: "english_use_pick_up_signal_phrasal",
            text: "Usa el phrasal verb en inglés 'pick up' al hablar de captar señal o vibración al llamar.",
          },
          {
            requirementId: "english_use_working_theory_collocation",
            text: "Emplea la collocation en inglés 'working theory' para presentar tu hipótesis principal.",
          },
          {
            requirementId: "english_use_security_camera_cctv",
            text: "Menciona en inglés 'CCTV' como alternativa a 'security cameras' al hablar de video.",
          },
          {
            requirementId: "english_use_lock_screen_and_notification",
            text: "Usa en inglés 'lock screen' y 'notification' para describir cómo se vería tu teléfono al recibir una llamada.",
          },
          {
            requirementId: "english_use_timestamp_collocation",
            text: "Incluye la palabra en inglés 'timestamp' al relacionar el recibo con la hora de la pérdida.",
          },
          {
            requirementId: "english_use_on_silent_collocation",
            text: "Usa la expresión en inglés 'on silent' para explicar por qué quizá no se oyó el timbre.",
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
            requirementId: "conversation_hora_del_suceso",
            text: "Pregunta a qué hora exacta vio caer el teléfono.",
          },
          {
            requirementId: "conversation_descripcion_de_la_persona",
            text: "Pide que describa a la persona que lo dejó caer, incluyendo ropa, edad aproximada y peinado.",
          },
          {
            requirementId: "conversation_si_movio_el_telefono",
            text: "Confirma si Rafa llegó a tocar o mover el teléfono después de verlo caer.",
          },
          {
            requirementId: "conversation_quien_lo_recogio",
            text: "Pregunta si alguien más se acercó y lo recogió.",
          },
          {
            requirementId: "conversation_recrear_ruta_reciente",
            text: "Pide recrear la ruta de Rafa y los perros durante los últimos diez minutos.",
          },
          {
            requirementId: "conversation_senalizar_lugar_exactamente",
            text: "Solicita que señale físicamente el punto exacto del parque donde cayó.",
          },
          {
            requirementId: "conversation_pedir_silencio_para_escuchar",
            text: "Pide un momento de silencio para escuchar si el teléfono suena cerca.",
          },
          {
            requirementId: "conversation_pedir_llamada_altavoz",
            text: "Solicita que llame al número y ponga el móvil en altavoz.",
          },
          {
            requirementId: "conversation_negociar_acompanamiento_breve",
            text: "Negocia que te acompañe durante cinco minutos a buscar en la zona inmediata.",
          },
          {
            requirementId: "conversation_priorizar_datos_concretos",
            text: "Pide que priorice datos concretos cuando empiece una anécdota.",
          },
          {
            requirementId: "conversation_aclarar_si_iba_solo",
            text: "Pregunta si la persona iba sola o acompañada.",
          },
          {
            requirementId: "conversation_detalles_de_la_funda",
            text: "Pide detalles de la funda del teléfono: color, material y posibles pegatinas.",
          },
          {
            requirementId: "conversation_estado_pantalla_y_sonidos",
            text: "Verifica si la pantalla estaba encendida o si sonó alguna notificación en el momento.",
          },
          {
            requirementId: "conversation_direccion_con_referencias",
            text: "Pregunta en qué dirección exacta se fue la persona usando referencias del parque.",
          },
          {
            requirementId: "conversation_estimar_tiempo_transcurrido",
            text: "Solicita una estimación del tiempo transcurrido desde la caída hasta ahora.",
          },
          {
            requirementId: "conversation_controlar_perros_si_interfieren",
            text: "Pide que controle a los perros si interfieren con la búsqueda.",
          },
          {
            requirementId: "conversation_empathia_redireccion",
            text: "Expresa empatía por el caos de los perros y luego redirige la conversación a los hechos.",
          },
          {
            requirementId: "conversation_reconocimiento_habitual",
            text: "Pregunta si Rafa reconoce al dueño por ser visitante habitual del parque.",
          },
          {
            requirementId: "conversation_permiso_grabar_nota_voz",
            text: "Pide permiso para grabar una nota de voz con la descripción clave del incidente.",
          },
          {
            requirementId: "conversation_verificar_mobiliario_cercano",
            text: "Pide verificar bancas, papeleras y césped cercano donde el teléfono pudo deslizarse.",
          },
          {
            requirementId: "conversation_repetir_dato_mas_importante",
            text: "Solicita que repita lentamente el dato más importante que podría ayudar a encontrar el teléfono.",
          },
          {
            requirementId: "conversation_accesorio_colgante",
            text: "Pregunta si el teléfono tenía cordón, anillo o accesorio colgante.",
          },
          {
            requirementId: "conversation_proponer_recompensa",
            text: "Propón una pequeña recompensa por información fiable y observa su respuesta.",
          },
          {
            requirementId: "conversation_acordar_punto_reencuentro",
            text: "Pide acordar un punto de reencuentro si se separan para buscar.",
          },
          {
            requirementId: "conversation_mostrar_rastros_en_el_suelo",
            text: "Pide que te muestre cualquier huella o rastro en el suelo que haya señalado.",
          },
          {
            requirementId: "english_point_out_location",
            text: 'Usa la frase exacta en inglés "Could you point out exactly where it fell?" al pedir la ubicación precisa.',
          },
          {
            requirementId: "english_cut_to_the_chase",
            text: 'Emplea la expresión "cut to the chase" para redirigir educadamente cuando Rafa divague.',
          },
          {
            requirementId: "english_pick_up_phone",
            text: 'Usa el phrasal verb "pick up" al preguntar si alguien recogió el teléfono.',
          },
          {
            requirementId: "english_retrace_my_steps",
            text: 'Incluye la expresión "retrace my steps" para proponer volver sobre el recorrido.',
          },
          {
            requirementId: "english_on_the_same_page",
            text: 'Utiliza "on the same page" para confirmar que comparten el mismo entendimiento.',
          },
          {
            requirementId: "english_off_the_top_of_my_head",
            text: 'Emplea "off the top of my head" cuando pidas un recuerdo aproximado.',
          },
          {
            requirementId: "english_barking_up_the_wrong_tree",
            text: 'Usa el idiom "barking up the wrong tree" para señalar que una pista es errónea.',
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
            requirementId: "english_last_known_location",
            text: 'Emplea la collocation "last known location" al resumir el último punto donde se vio el teléfono.',
          },
          {
            requirementId: "english_narrow_down_area",
            text: 'Usa el phrasal verb "narrow down" para acotar el área de búsqueda.',
          },
          {
            requirementId: "english_hand_over_phone",
            text: 'Emplea el phrasal verb "hand over" al sugerir que alguien entregue el teléfono si lo encontró.',
          },
          {
            requirementId: "english_hang_on_to_listen",
            text: 'Usa la expresión "hang on a second" para pausar y escuchar si suena el móvil.',
          },
          {
            requirementId: "english_long_story_short",
            text: 'Incluye "long story short" para resumir tu situación rápidamente.',
          },
          {
            requirementId: "english_figure_out_what_happened",
            text: 'Emplea el phrasal verb "figure out" al hablar de resolver qué pasó con el teléfono.',
          },
          {
            requirementId: "english_distinctive_phone_case",
            text: 'Usa la collocation "distinctive phone case" al describir la funda.',
          },
          {
            requirementId: "english_as_far_as_i_know",
            text: 'Incluye "as far as I know" para matizar el grado de certeza sobre un detalle.',
          },
          {
            requirementId: "english_to_be_honest_dogs",
            text: 'Usa "to be honest" antes de expresar preocupación por los perros durante la búsqueda.',
          },
          {
            requirementId: "english_signal_strength",
            text: 'Emplea "signal strength" al hablar de la cobertura en esa zona del parque.',
          },
          {
            requirementId: "english_lock_screen",
            text: 'Usa el término "lock screen" para referirte a la pantalla de bloqueo del teléfono.',
          },
          {
            requirementId: "english_call_log",
            text: 'Incluye la expresión "call log" al mencionar registros de llamadas.',
          },
          {
            requirementId: "english_follow_up_steps",
            text: 'Usa el phrasal verb "follow up" al acordar próximos pasos tras la búsqueda.',
          },
          {
            requirementId: "english_in_the_nick_of_time",
            text: 'Emplea el idiom "in the nick of time" si casi encuentran el teléfono por casualidad.',
          },
          {
            requirementId: "english_calm_the_dogs_down",
            text: 'Incluye la petición "Could you calm the dogs down?" usando el phrasal verb "calm down".',
          },
          {
            requirementId: "english_from_what_you_said",
            text: 'Usa el conector "from what you said" al reformular los hechos clave aportados por Rafa.',
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
            requirementId: "conversation_explicar_ultimo_lugar_visto",
            text: "Explica en inglés dónde y cuándo lo viste por última vez, incluyendo una hora aproximada y actividad que realizabas.",
          },
          {
            requirementId: "conversation_pedir_lenguaje_mas_claro",
            text: "Pide en inglés que explique una de sus referencias cultas con palabras sencillas para asegurarte de entenderla.",
          },
          {
            requirementId: "conversation_establecer_limite_tiempo",
            text: "Indica en inglés que solo tienes un tiempo limitado y pide priorizar las acciones más útiles.",
          },
          {
            requirementId: "conversation_proponer_revisar_camaras",
            text: "Propón en inglés verificar si hay cámaras de seguridad en la biblioteca y cómo solicitar acceso.",
          },
          {
            requirementId: "conversation_solicitar_objetos_perdidos",
            text: "Solicita en inglés preguntar en el mostrador de objetos perdidos antes de seguir con teorías.",
          },
          {
            requirementId: "conversation_aceptar_parcialmente_una_teoria",
            text: "Acepta en inglés una parte útil de una teoría y explica por qué podría ayudar a la búsqueda.",
          },
          {
            requirementId: "conversation_refutar_con_respeto",
            text: "Rechaza en inglés una teoría poco probable con dos razones concretas manteniendo un tono respetuoso.",
          },
          {
            requirementId: "conversation_pedir_tomar_notas",
            text: "Pide en inglés permiso para tomar notas de las hipótesis en papel o en otro dispositivo.",
          },
          {
            requirementId: "conversation_formular_hipotesis_propia",
            text: "Formula en inglés tu propia hipótesis con dos pasos verificables para comprobarla en la biblioteca.",
          },
          {
            requirementId: "conversation_pedir_bajar_la_voz",
            text: "Pide en inglés hablar en voz más baja por las normas de la biblioteca sin cortar la conversación.",
          },
          {
            requirementId: "conversation_usar_humor_para_desacuerdo",
            text: "Usa en inglés un comentario de humor ligero para suavizar un desacuerdo con el profesor.",
          },
          {
            requirementId: "conversation_preguntar_observacion_sospechosa",
            text: "Pregunta en inglés si vio a alguien manipulando pertenencias o merodeando cerca de tu mesa.",
          },
          {
            requirementId: "conversation_negociar_ayuda_con_incentivo",
            text: "Negocia en inglés su ayuda ofreciéndole un café o agradecimiento concreto a cambio.",
          },
          {
            requirementId: "conversation_pedir_prestado_util",
            text: "Pide en inglés prestada su pluma o una hoja para anotar números o indicaciones.",
          },
          {
            requirementId: "conversation_aclarar_hora_confusa",
            text: "Aclara en inglés un malentendido sobre la hora exacta en que notaste la ausencia del teléfono.",
          },
          {
            requirementId: "conversation_pedir_ejemplo_concreto",
            text: "Pide en inglés un ejemplo concreto cuando cite un autor clásico para aterrizar la idea a la situación.",
          },
          {
            requirementId: "conversation_senalar_contradiccion",
            text: "Señala en inglés una contradicción entre dos de sus afirmaciones y pide resolverla.",
          },
          {
            requirementId: "conversation_evaluar_riesgos_confrontacion",
            text: "Evalúa en inglés los riesgos de confrontar a un desconocido y sugiere una alternativa segura.",
          },
          {
            requirementId: "conversation_priorizar_explicacion_simple",
            text: "Pide en inglés priorizar la explicación más simple antes de explorar teorías extravagantes.",
          },
          {
            requirementId: "conversation_agradecer_paciencia_y_guias",
            text: "Agradece en inglés su paciencia y el valor de sus guías intelectuales durante la búsqueda.",
          },
          {
            requirementId: "conversation_pedir_acompanamiento_mostrador",
            text: "Pide en inglés que te acompañe al mostrador principal para preguntar juntos por procedimientos.",
          },
          {
            requirementId: "conversation_proponer_dividir_tareas",
            text: "Propón en inglés dividir tareas de búsqueda entre revisar estanterías y preguntar al personal.",
          },
          {
            requirementId: "conversation_expresar_preocupacion_privacidad",
            text: "Expresa en inglés tu preocupación por la privacidad de tus datos si otra persona tiene el teléfono.",
          },
          {
            requirementId: "conversation_confirmar_plan_y_hora_actualizacion",
            text: "Confirma en inglés el plan inmediato y acuerda una hora para ponerse al día sobre resultados.",
          },
          {
            requirementId: "english_occams_razor",
            text: 'Usa en inglés la expresión "Occam\'s razor" para sugerir quedarse con la explicación más simple.',
          },
          {
            requirementId: "english_plausible_explanation",
            text: 'Emplea en inglés la collocation "plausible explanation" al presentar tu hipótesis principal.',
          },
          {
            requirementId: "english_circumstantial_evidence",
            text: 'Usa en inglés la frase "circumstantial evidence" al hablar de indicios no concluyentes.',
          },
          {
            requirementId: "english_chain_of_events",
            text: 'Incluye en inglés la expresión "chain of events" al reconstruir los hechos previos a la pérdida.',
          },
          {
            requirementId: "english_location_services",
            text: 'Menciona en inglés "location services" al proponer cómo rastrear el dispositivo.',
          },
          {
            requirementId: "english_call_log",
            text: 'Usa en inglés "call log" al sugerir revisar registros recientes relacionados con el teléfono.',
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
            requirementId: "english_privacy_concerns",
            text: 'Menciona en inglés "privacy concerns" al evaluar riesgos de compartir información.',
          },
          {
            requirementId: "english_battery_was_drained",
            text: 'Di en inglés "the battery was drained" para explicar por qué no puedes llamar a tu número.',
          },
          {
            requirementId: "english_file_a_report",
            text: 'Incluye en inglés la frase "to file a report" al hablar de notificar al personal de la biblioteca.',
          },
          {
            requirementId: "english_on_the_contrary",
            text: 'Usa en inglés el marcador discursivo "on the contrary" para contradecir cortésmente una idea.',
          },
          {
            requirementId: "english_admittedly",
            text: 'Emplea en inglés "admittedly" para conceder un punto antes de presentar tu objeción.',
          },
          {
            requirementId: "english_nevertheless",
            text: 'Usa en inglés "nevertheless" para mantener tu postura tras reconocer una dificultad.',
          },
          {
            requirementId: "english_phrasal_rule_out",
            text: 'Usa en inglés el phrasal verb "rule out" al descartar una teoría del profesor.',
          },
          {
            requirementId: "english_phrasal_look_into",
            text: 'Usa en inglés el phrasal verb "look into" para proponer investigar un detalle concreto.',
          },
          {
            requirementId: "english_phrasal_turn_up",
            text: 'Usa en inglés el phrasal verb "turn up" para expresar la esperanza de que el teléfono aparezca.',
          },
          {
            requirementId: "english_phrasal_track_down",
            text: 'Usa en inglés el phrasal verb "track down" al hablar de localizar al posible portador del teléfono.',
          },
          {
            requirementId: "english_phrasal_piece_together",
            text: 'Usa en inglés el phrasal verb "piece together" para reconstruir los hechos con el profesor.',
          },
          {
            requirementId: "english_phrasal_hand_over",
            text: 'Usa en inglés el phrasal verb "hand over" al imaginar que alguien devuelve el teléfono al mostrador.',
          },
          {
            requirementId: "english_idiom_wild_goose_chase",
            text: 'Usa en inglés el idiom "a wild goose chase" para advertir sobre una búsqueda inútil.',
          },
          {
            requirementId: "english_idiom_red_herring",
            text: 'Usa en inglés el idiom "a red herring" para señalar una pista engañosa.',
          },
          {
            requirementId: "english_idiom_needle_in_a_haystack",
            text: 'Usa en inglés el idiom "a needle in a haystack" para describir la dificultad de buscar entre estanterías.',
          },
          {
            requirementId: "english_idiom_the_plot_thickens",
            text: 'Usa en inglés el idiom "the plot thickens" cuando surge un dato inesperado.',
          },
          {
            requirementId: "english_idiom_cut_to_the_chase",
            text: 'Usa en inglés el idiom "cut to the chase" para pedir ir directo al plan de acción.',
          },
        ],
      },
      {
        missionId: "lost_phone_adventure_midnight_taxi_singer",
        title: "El taxista de medianoche",
        sceneSummary:
          "Un taxista que también canta ópera te recoge y jura que recogió un teléfono en su coche. Su dramatismo convierte la conversación en un mini-concierto.",
        aiRole:
          "Eres un taxista apasionado por la música que dramatiza cada frase. Usa frases poéticas, repite detalles importantes para enfatizar y responde con calidez; permite que el alumno dirija la pregunta hacia la evidencia y la logística.",
        caracterName: "Marco the Cabby",
        caracterPrompt:
          "A middle-aged taxi driver wearing a leather jacket and a faded cap, singing into a steering-wheel-mounted microphone. He has a booming voice, animated gestures, and the interior of the car is lit by city lights and a hanging air-freshener.",
        requirements: [
          {
            requirementId: "conversation_verificar_hora_recogida",
            text: "Aclara a qué hora te subiste al taxi y cuánto tardó el trayecto para acotar cuándo apareció el teléfono.",
          },
          {
            requirementId: "conversation_describir_funda_y_adhesivos",
            text: "Pide que describa el color de la funda y cualquier adhesivo o marca visibles del teléfono que dice tener.",
          },
          {
            requirementId: "conversation_confirmar_ruta",
            text: "Confirma los puntos de recogida y destino de tu trayecto para verificar que fue tu coche.",
          },
          {
            requirementId: "conversation_probar_tono_llamada",
            text: "Solicita que te permita llamar al teléfono para comprobar si suena tu tono característico.",
          },
          {
            requirementId: "conversation_pedir_foto_del_telefono",
            text: "Pide que envíe una foto del teléfono encontrada dentro del coche, mostrando la funda y la pantalla bloqueada.",
          },
          {
            requirementId: "conversation_preguntar_bateria",
            text: "Pregunta cuánta batería indica el teléfono y si puede conectarlo a un cargador del taxi.",
          },
          {
            requirementId: "conversation_acordar_punto_seguro",
            text: "Propón un lugar público y bien iluminado para reunirse y recuperar el teléfono.",
          },
          {
            requirementId: "conversation_hora_de_encuentro",
            text: "Negocia una hora concreta para el encuentro que funcione para ambos.",
          },
          {
            requirementId: "conversation_confirmar_identificacion_taxi",
            text: "Solicita el número de placa o el ID del taxi para tu tranquilidad antes del encuentro.",
          },
          {
            requirementId: "conversation_pedir_menos_canto_para_oir",
            text: "Pide amablemente que reduzca el canto durante un momento para poder escuchar detalles importantes.",
          },
          {
            requirementId: "conversation_mostrar_empatia_con_su_pasion",
            text: "Expresa aprecio por su pasión por la ópera antes de pedir datos precisos del teléfono.",
          },
          {
            requirementId: "conversation_limitar_datos_personales_ajenos",
            text: "Indica que no comparta información privada de notificaciones ajenas mientras verifica el dispositivo.",
          },
          {
            requirementId: "conversation_confirmar_funda_olor_ambientador",
            text: "Verifica si el teléfono tiene olor a ambientador del coche o restos de brillantina de la decoración para confirmar coincidencias.",
          },
          {
            requirementId: "conversation_preguntar_si_alguien_lo_reclamo",
            text: "Pregunta si algún pasajero posterior intentó reclamar ese teléfono.",
          },
          {
            requirementId: "conversation_pedir_reproducir_nota_de_voz",
            text: "Solicita que reproduzca una nota de voz en altavoz si está accesible desde la pantalla bloqueada con tu nombre, para confirmar identidad.",
          },
          {
            requirementId: "conversation_acordar_pequena_recompensa",
            text: "Negocia una pequeña compensación por su tiempo si efectivamente te devuelve el teléfono.",
          },
          {
            requirementId: "conversation_pedir_compartir_ubicacion_temporal",
            text: "Pide compartir ubicación temporal por una app segura para coordinar el encuentro.",
          },
          {
            requirementId: "conversation_confirmar_estado_fisico",
            text: "Pregunta si la pantalla tiene alguna rajadura o protector que reconozcas.",
          },
          {
            requirementId: "conversation_pedir_no_apagarlo",
            text: "Solicita que mantenga el teléfono encendido para poder llamarlo de nuevo hasta que se vean.",
          },
          {
            requirementId: "conversation_aclarar_canal_de_contacto",
            text: "Acordar un canal de contacto principal (llamada o mensajería) y un respaldo por si falla.",
          },
          {
            requirementId: "conversation_pedir_ensayar_ringtone_breve",
            text: "Pide que haga una pausa breve en el canto para que el sonido del timbre sea audible durante la prueba.",
          },
          {
            requirementId: "conversation_confirmar_objetos_junto_al_telefono",
            text: "Pregunta qué otros objetos estaban cerca del teléfono en el asiento o alfombrilla para reforzar la verificación.",
          },
          {
            requirementId: "conversation_estimar_tiempo_llegada",
            text: "Solicita su tiempo estimado de llegada al punto acordado y confirma el tuyo.",
          },
          {
            requirementId:
              "conversation_marcar_limites_sobre_prop_del_telefono",
            text: "Pide explícitamente que no intente desbloquear ni manipular ajustes del teléfono hasta la entrega.",
          },
          {
            requirementId: "conversation_reconfirmar_detalles_finales",
            text: "Antes de colgar, repite y confirma lugar, hora, rasgos del teléfono y forma de contacto para evitar malentendidos.",
          },
          {
            requirementId: "english_turn_down_volume",
            text: "Usa 'turn down' para pedir que baje el volumen del canto mientras verifican el tono del teléfono.",
          },
          {
            requirementId: "english_double_check_details",
            text: "Usa 'double-check' para insistir en revisar de nuevo el color de la funda y la posible rajadura.",
          },
          {
            requirementId: "english_pick_up_phone_reference",
            text: "Usa el phrasal verb 'pick up' para referirte a cuándo recogió el teléfono del asiento trasero.",
          },
          {
            requirementId: "english_drop_off_meeting_spot",
            text: "Usa 'drop off' para proponer un punto donde pueda dejarte el teléfono de forma segura.",
          },
          {
            requirementId: "english_as_soon_as_time",
            text: "Incluye 'as soon as' para fijar que te reunirás en cuanto termines tu trayecto.",
          },
          {
            requirementId: "english_in_the_meantime_plan",
            text: "Usa 'in the meantime' para indicar qué harás mientras él conduce hacia el punto de encuentro.",
          },
          {
            requirementId: "english_just_to_be_clear_clarificacion",
            text: "Incluye 'just to be clear' antes de repetir los detalles clave del teléfono.",
          },
          {
            requirementId: "english_hand_over_exchange",
            text: "Usa 'hand over' para referirte a la entrega del teléfono en el lugar acordado.",
          },
          {
            requirementId: "english_look_into_notifications",
            text: "Usa 'look into' para pedir que no investigue notificaciones privadas en la pantalla bloqueada.",
          },
          {
            requirementId: "english_hold_on_pause",
            text: "Usa 'hold on' para pedirle que haga una pausa breve en el canto mientras llamas a tu número.",
          },
          {
            requirementId: "english_ring_a_bell_tone",
            text: "Usa la expresión 'ring a bell' para preguntar si el tono o el fondo de pantalla le suenan familiares.",
          },
          {
            requirementId: "english_on_the_same_page_coordination",
            text: "Incluye 'on the same page' para confirmar que ambos entienden el plan de encuentro.",
          },
          {
            requirementId: "english_rule_out_other_phones",
            text: "Usa 'rule out' para descartar que el teléfono sea de otro pasajero.",
          },
          {
            requirementId: "english_keep_me_posted_updates",
            text: "Usa 'keep me posted' para pedir actualizaciones sobre su hora de llegada.",
          },
          {
            requirementId: "english_sort_out_arrangements",
            text: "Usa 'sort out' para hablar de resolver los detalles logísticos de la entrega.",
          },
          {
            requirementId: "english_at_the_end_of_the_day_reason",
            text: "Incluye 'at the end of the day' para resumir por qué recuperar tu teléfono es la prioridad.",
          },
          {
            requirementId: "english_cross_paths_context",
            text: "Usa 'cross paths' para referirte a cuándo se encontraron tu ruta y la suya esa noche.",
          },
          {
            requirementId: "english_figure_out_timing",
            text: "Usa 'figure out' para proponer cómo calcular el mejor momento para verse.",
          },
          {
            requirementId: "english_bear_with_me_request",
            text: "Incluye 'bear with me' para pedir paciencia mientras confirmas datos del dispositivo.",
          },
          {
            requirementId: "english_back_and_forth_messages",
            text: "Usa 'back and forth' para describir los mensajes necesarios hasta cerrar el plan.",
          },
          {
            requirementId: "english_out_of_the_blue_discovery",
            text: "Usa 'out of the blue' para comentar lo inesperado de que apareciera el teléfono en su taxi.",
          },
          {
            requirementId: "english_opera_collocation_aria",
            text: "Incluye la palabra 'aria' para elogiar su canto mientras mantienes el enfoque en la recuperación del teléfono.",
          },
          {
            requirementId: "english_booming_voice_collocation",
            text: "Usa la collocation 'booming voice' para describir su voz al pedirle que hable más bajo.",
          },
          {
            requirementId: "english_lost_and_found_phrase",
            text: "Usa la expresión 'lost and found' para sugerir registrar el objeto en un punto oficial si es necesario.",
          },
          {
            requirementId: "english_charge_up_device",
            text: "Usa 'charge up' para pedir que conecte el teléfono y evitar que se apague antes del encuentro.",
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
            requirementId: "conversation_pedir_origen_ingredientes_imposibles",
            text: "Pide que explique de dónde salieron esos ingredientes imposibles y cómo los obtuvo legalmente.",
          },
          {
            requirementId: "conversation_solicitar_demostracion_seguridad",
            text: "Pide una demostración sencilla de que el plato es seguro para comer, como mostrar etiquetas o fechas.",
          },
          {
            requirementId: "conversation_marcar_limite_uso_despensa_personal",
            text: "Establece un límite claro para que no use tu despensa o tus productos personales sin permiso.",
          },
          {
            requirementId: "conversation_negociar_regla_ventilacion",
            text: "Negocia una regla para ventilar la cocina cuando haya olores fuertes o humo.",
          },
          {
            requirementId: "conversation_solicitar_limite_horario_cocina",
            text: "Pide que no cocine a horas nocturnas específicas para evitar ruidos y olores.",
          },
          {
            requirementId: "conversation_pedir_prueba_sabor_pequena",
            text: "Pide probar una porción muy pequeña antes de decidir si comerás más.",
          },
          {
            requirementId: "conversation_preguntar_sobre_alergenos",
            text: "Pregunta explícitamente si el plato contiene alérgenos comunes y cómo evita la contaminación cruzada.",
          },
          {
            requirementId: "conversation_expresar_incomodidad_olor",
            text: "Expresa con tacto que el olor te resulta demasiado fuerte y solicita un ajuste.",
          },
          {
            requirementId: "conversation_proponer_calendario_cocina",
            text: "Propón un calendario semanal para turnarse el uso de la cocina.",
          },
          {
            requirementId: "conversation_pedir_reposicion_insumos",
            text: "Pide que reponga cualquier ingrediente caro que haya usado sin preguntar.",
          },
          {
            requirementId: "conversation_pedir_limpiar_inmediato",
            text: "Solicita que limpie encimeras, utensilios y la estufa inmediatamente después de cocinar.",
          },
          {
            requirementId: "conversation_pedir_evitar_utensilios_personales",
            text: "Pide que no use tus utensilios personales marcados sin tu autorización previa.",
          },
          {
            requirementId: "conversation_pedir_explicacion_aparato_raro",
            text: "Pregunta para qué sirve ese aparato de cocina extraño y si es seguro usarlo aquí.",
          },
          {
            requirementId: "conversation_proponer_estanteria_compartida",
            text: "Propón una estantería o balda específica para almacenar sus ingredientes inusuales.",
          },
          {
            requirementId: "conversation_plantear_regla_alarma_humo",
            text: "Plantea una regla para evitar activar la alarma de humo y qué hacer si suena.",
          },
          {
            requirementId: "conversation_pedir_explicacion_residuos",
            text: "Pide cómo piensa desechar residuos o restos inusuales sin obstruir el fregadero.",
          },
          {
            requirementId: "conversation_solicitar_autorizacion_previa_eventos",
            text: "Solicita que pida autorización previa antes de cocinar para visitas o degustaciones con invitados.",
          },
          {
            requirementId: "conversation_mostrar_empatia_curiosidad",
            text: "Muestra empatía y curiosidad genuina por su pasión culinaria mientras mantienes tus límites.",
          },
          {
            requirementId: "conversation_pedir_etiquetado_claro",
            text: "Pide que etiquete claramente frascos y contenedores con nombre y fecha.",
          },
          {
            requirementId: "conversation_proponer_presupuesto_comun_basicos",
            text: "Propón un presupuesto común para básicos de cocina y acuerda cómo contabilizar gastos.",
          },
          {
            requirementId: "conversation_pedir_evitar_explosiones_salsas",
            text: "Pide que reduzca el riesgo de salpicaduras o explosiones de salsas espesas.",
          },
          {
            requirementId: "conversation_pedir_permiso_para_grabar_receta",
            text: "Pide permiso para grabar o anotar pasos clave de la receta para reproducirlos luego.",
          },
          {
            requirementId: "conversation_insistir_en_higiene_manos_tablas",
            text: "Insiste en que se lave las manos y use tablas separadas para crudo y cocido.",
          },
          {
            requirementId: "conversation_rechazar_con_respeto_sin_ofender",
            text: "Rechaza con respeto probar un ingrediente específico que te da desconfianza, sin ofender.",
          },
          {
            requirementId:
              "conversation_negociar_compensacion_olor_persistente",
            text: "Negocia una compensación o gesto práctico si el olor persiste horas después de cocinar.",
          },
          {
            requirementId: "english_turn_down_heat_request",
            text: 'Pide que baje el fuego usando el phrasal verb en inglés "turn down".',
          },
          {
            requirementId: "english_clean_up_after_yourself",
            text: 'Exige limpieza inmediata usando la expresión en inglés "clean up after yourself".',
          },
          {
            requirementId: "english_run_out_of_milk_notice",
            text: 'Comenta que se acabó un básico mencionando en inglés el phrasal verb "run out of" con un ejemplo de ingrediente.',
          },
          {
            requirementId: "english_set_off_alarm_warning",
            text: 'Advierte sobre la alarma de humo usando en inglés el phrasal verb "set off".',
          },
          {
            requirementId: "english_wipe_down_counters",
            text: 'Solicita limpiar superficies usando en inglés la collocation "wipe down the counters".',
          },
          {
            requirementId: "english_label_and_date_containers",
            text: 'Exige etiquetar y fechar usando en inglés la collocation "label and date the containers".',
          },
          {
            requirementId: "english_cross_contamination_concern",
            text: 'Expresa preocupación por higiene usando en inglés el término "cross-contamination".',
          },
          {
            requirementId: "english_not_my_cup_of_tea_idiom",
            text: 'Rechaza un sabor educadamente usando en inglés el idiom "not my cup of tea".',
          },
          {
            requirementId: "english_smells_fishy_idiom",
            text: 'Sugiere duda sobre la explicación usando en inglés el idiom "smells fishy".',
          },
          {
            requirementId: "english_put_away_groceries",
            text: 'Pide guardar compras usando en inglés el phrasal verb "put away" con "groceries".',
          },
          {
            requirementId: "english_throw_away_spoiled_food",
            text: 'Indica desechar comida vencida usando en inglés el phrasal verb "throw away" y "expired".',
          },
          {
            requirementId: "english_cool_down_before_fridge",
            text: 'Da una instrucción de seguridad usando en inglés la collocation "let it cool down before putting it in the fridge".',
          },
          {
            requirementId: "english_ground_rules_shared_kitchen",
            text: 'Propón normas usando en inglés la expresión "set some ground rules" para la cocina compartida.',
          },
          {
            requirementId: "english_out_of_bounds_off_limits",
            text: 'Declara una zona prohibida usando en inglés "off-limits" o "out of bounds" aplicado a tus ingredientes.',
          },
          {
            requirementId: "english_run_the_vent_please",
            text: 'Pide usar la ventilación con la collocation en inglés "run the extractor fan" o "turn on the vent".',
          },
          {
            requirementId: "english_swap_out_ingredient",
            text: 'Sugiere sustituir un ingrediente usando en inglés el phrasal verb "swap out" con un ejemplo concreto.',
          },
          {
            requirementId: "english_food_safety_risk_assessment",
            text: 'Evalúa riesgos usando en inglés la collocation "food safety risk" en una frase completa.',
          },
          {
            requirementId: "english_sticky_spill_mop_up",
            text: 'Pide limpiar un derrame pegajoso usando en inglés el phrasal verb "mop up" y el adjetivo "sticky".',
          },
          {
            requirementId: "english_borrow_vs_take_distinction",
            text: 'Aclara permiso usando en inglés la diferencia entre "borrow" y "take" con un ejemplo de ingrediente.',
          },
          {
            requirementId: "english_over_the_top_flavors_idiom",
            text: 'Opina que los sabores son excesivos usando en inglés la expresión "over the top".',
          },
          {
            requirementId: "english_simmer_gently_instruction",
            text: 'Da una instrucción de cocina usando en inglés el verbo "simmer" con un adverbio apropiado.',
          },
          {
            requirementId: "english_mix_up_labels_warning",
            text: 'Advierte sobre confusiones usando en inglés el phrasal verb "mix up" aplicado a etiquetas.',
          },
          {
            requirementId: "english_top_shelf_is_reserved",
            text: 'Reserva espacio en nevera usando en inglés la collocation "the top shelf is reserved" con una razón.',
          },
          {
            requirementId: "english_health_hazard_statement",
            text: 'Declara un riesgo usando en inglés la collocation "a health hazard" referida a una práctica concreta.',
          },
          {
            requirementId: "english_at_the_end_of_the_day_summary",
            text: 'Cierra tu postura usando en inglés el discourse marker "At the end of the day" seguido de tu conclusión.',
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
            requirementId: "conversation_valor_monetario_talentos",
            text: "Pide que especifique el valor monetario mensual que asigna a sus talentos en lugar de pagar en efectivo.",
          },
          {
            requirementId: "conversation_desglose_tareas_cubren_alquiler",
            text: "Solicita un desglose concreto de qué tareas o servicios haría cada semana y cuántas horas dedicaría.",
          },
          {
            requirementId: "conversation_plazo_prueba",
            text: "Propón un período de prueba con fecha de inicio y fin, y pide confirmación.",
          },
          {
            requirementId: "conversation_evidencia_habilidad",
            text: "Pide una muestra o portafolio que demuestre la calidad de su talento antes de aceptar.",
          },
          {
            requirementId: "conversation_condiciones_no_negociables",
            text: "Declara al menos una condición no negociable sobre el alquiler o la convivencia y solicita acuerdo.",
          },
          {
            requirementId: "conversation_calendario_entregables",
            text: "Exige un calendario de entregables semanales y valida si puede cumplirlo.",
          },
          {
            requirementId: "conversation_contingencia_incumplimiento",
            text: "Pregunta qué pasará si no cumple con una semana de tareas o servicios acordados.",
          },
          {
            requirementId: "conversation_limites_invitados",
            text: "Establece un límite claro sobre invitados y pide su aceptación explícita.",
          },
          {
            requirementId: "conversation_ruido_horarios",
            text: "Aclara expectativas sobre ruido y horarios de trabajo creativo, y busca un compromiso.",
          },
          {
            requirementId: "conversation_utilidades_reparto",
            text: "Confirma cómo se pagarán las utilidades y si la propuesta de intercambio las incluye o no.",
          },
          {
            requirementId: "conversation_deposito_garantia",
            text: "Pregunta si puede ofrecer un depósito parcial en efectivo como garantía y define el monto.",
          },
          {
            requirementId: "conversation_criterios_calidad",
            text: "Define criterios objetivos de calidad para los servicios canjeados y logra su acuerdo.",
          },
          {
            requirementId: "conversation_documento_escrito",
            text: "Insiste en poner el acuerdo por escrito y pide confirmar que lo firmará.",
          },
          {
            requirementId: "conversation_disponibilidad_horas",
            text: "Verifica su disponibilidad semanal real y cómo se ajusta a tus horarios.",
          },
          {
            requirementId: "conversation_prioridad_emergencias",
            text: "Pregunta cómo manejaría emergencias personales sin afectar los compromisos del intercambio.",
          },
          {
            requirementId: "conversation_referencia_tercero",
            text: "Solicita al menos una referencia de alguien para quien haya trabajado de forma similar.",
          },
          {
            requirementId: "conversation_alternativa_mixta",
            text: "Propón una opción mixta de parte en efectivo y parte en talento y pide su reacción.",
          },
          {
            requirementId: "conversation_revision_mensual",
            text: "Establece una reunión mensual de revisión del acuerdo y consigue su compromiso.",
          },
          {
            requirementId: "conversation_privacidad_espacios",
            text: "Aclara qué espacios son compartidos y cuáles son privados, y verifica su entendimiento.",
          },
          {
            requirementId: "conversation_materiales_costos",
            text: "Pregunta quién pagará materiales o herramientas necesarios para su talento y cierra un acuerdo.",
          },
          {
            requirementId: "conversation_penalizacion_retrasos",
            text: "Propón una penalización específica por retrasos y comprueba si la acepta.",
          },
          {
            requirementId: "conversation_proteccion_objetos_personales",
            text: "Establece reglas sobre el cuidado de tus objetos y pide su compromiso a respetarlas.",
          },
          {
            requirementId: "conversation_alcance_servicios",
            text: "Delimita claramente el alcance de los servicios que ofrece, incluyendo lo que no hará.",
          },
          {
            requirementId: "conversation_objetivo_win_win",
            text: "Expresa tu objetivo de un acuerdo beneficioso para ambos y pide que reformule su oferta para alinearse.",
          },
          {
            requirementId: "conversation_disolucion_acuerdo",
            text: "Pregunta cómo y con cuánta antelación cualquiera de los dos podría terminar el acuerdo.",
          },
          {
            requirementId: "english_use_crunch_the_numbers",
            text: "Usa la expresión en inglés 'crunch the numbers' al pedir que calculen el valor del intercambio.",
          },
          {
            requirementId: "english_use_break_even",
            text: "Incluye la expresión 'break even' para hablar de cuándo el acuerdo deja de ser una pérdida para ti.",
          },
          {
            requirementId: "english_use_split_the_difference_idiom",
            text: "Propón una solución usando el idiom 'split the difference'.",
          },
          {
            requirementId: "english_use_chip_in_phrasal",
            text: "Pide que 'chip in' para las utilidades y usa ese phrasal verb explícitamente.",
          },
          {
            requirementId: "english_use_hold_up_your_end_idiom",
            text: "Exige compromiso usando el idiom 'hold up your end of the deal'.",
          },
          {
            requirementId: "english_use_draw_the_line_idiom",
            text: "Marca un límite usando el idiom 'draw the line'.",
          },
          {
            requirementId: "english_use_iron_out_phrasal",
            text: "Sugiere resolver detalles usando el phrasal verb 'iron out'.",
          },
          {
            requirementId: "english_use_follow_through_phrasal",
            text: "Pregunta sobre su capacidad de cumplir usando el phrasal verb 'follow through'.",
          },
          {
            requirementId: "english_use_back_out_phrasal",
            text: "Explora el riesgo de que se retire usando el phrasal verb 'back out'.",
          },
          {
            requirementId: "english_use_stick_to_phrasal",
            text: "Exige constancia usando el phrasal verb 'stick to' al hablar del calendario.",
          },
          {
            requirementId: "english_use_make_up_for_phrasal",
            text: "Pide compensación por retrasos usando el phrasal verb 'make up for'.",
          },
          {
            requirementId: "english_use_too_good_to_be_true_idiom",
            text: "Expresa escepticismo usando el idiom 'too good to be true'.",
          },
          {
            requirementId: "english_use_mutually_beneficial",
            text: "Describe el objetivo del acuerdo usando la expresión 'mutually beneficial'.",
          },
          {
            requirementId: "english_use_in_writing",
            text: "Exige formalizar el acuerdo usando la frase 'in writing'.",
          },
          {
            requirementId: "english_use_up_front",
            text: "Habla de un pago de depósito usando la expresión 'up front'.",
          },
          {
            requirementId: "english_use_on_a_trial_basis",
            text: "Propón un periodo de prueba usando la expresión 'on a trial basis'.",
          },
          {
            requirementId: "english_use_ground_rules",
            text: "Establece normas básicas usando la collocation 'ground rules'.",
          },
          {
            requirementId: "english_use_fallback_plan",
            text: "Pregunta por un plan alterno usando la expresión 'fallback plan'.",
          },
          {
            requirementId: "english_use_red_flags",
            text: "Menciona señales de alerta usando la expresión 'red flags'.",
          },
          {
            requirementId: "english_use_non_negotiable",
            text: "Declara una condición usando la palabra 'non-negotiable'.",
          },
          {
            requirementId: "english_use_cost_effective",
            text: "Evalúa la propuesta usando el adjetivo 'cost-effective'.",
          },
          {
            requirementId: "english_use_win_win",
            text: "Propón una solución usando la expresión 'win-win'.",
          },
          {
            requirementId: "english_use_prorated",
            text: "Habla de un monto de alquiler ajustado usando la palabra 'prorated'.",
          },
          {
            requirementId: "english_use_late_fee",
            text: "Incluye una cláusula de penalización mencionando 'late fee'.",
          },
          {
            requirementId: "english_use_pull_your_weight_idiom",
            text: "Exige responsabilidad usando el idiom 'pull your weight'.",
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
            requirementId:
              "conversation_identificar_preferencias_decoracion_fantasma",
            text: "Pregunta qué cambios de decoración exige el 'fantasma' en el salón y por qué.",
          },
          {
            requirementId: "conversation_pedir_demostracion_respetuosa",
            text: "Solicita una demostración segura de cómo el 'fantasma' expresa sus opiniones sin poner a nadie en riesgo.",
          },
          {
            requirementId: "conversation_establecer_horario_silencio",
            text: "Negocia una hora límite para las charlas con el 'fantasma' para evitar ruido a medianoche.",
          },
          {
            requirementId: "conversation_aclarar_expectativas_interaccion",
            text: "Aclara si se espera que también hables con el 'fantasma' o si solo Percy lo hace.",
          },
          {
            requirementId: "conversation_limites_espacios_privados",
            text: "Fija un límite explícito de privacidad en tu dormitorio y baño respecto a cualquier actividad 'sobrenatural'.",
          },
          {
            requirementId: "conversation_preguntar_si_otros_testigos",
            text: "Pregunta si alguien más ha visto señales del 'fantasma' además de Percy.",
          },
          {
            requirementId: "conversation_pedir_pruebas_inequivocas",
            text: "Pide pruebas concretas y observables, como un objeto que el 'fantasma' mueva a la vista.",
          },
          {
            requirementId: "conversation_proponer_compromiso_decoracion",
            text: "Propón un compromiso sobre la decoración del salón que equilibre gustos tuyos, de Percy y del 'fantasma'.",
          },
          {
            requirementId: "conversation_sugerir_reglas_casa_especificas",
            text: "Sugiere reglas de casa específicas para temas de ruidos, velas, incienso y visitas nocturnas del 'fantasma'.",
          },
          {
            requirementId: "conversation_pedir_historia_fantasma",
            text: "Pregunta por el origen del 'fantasma' y qué relación tiene con el apartamento.",
          },
          {
            requirementId: "conversation_expresar_preocupacion_seguridad",
            text: "Expresa tu preocupación por la seguridad si hay velas, cables o muebles moviéndose de noche.",
          },
          {
            requirementId: "conversation_consultar_reaccion_musica",
            text: "Consulta cómo reacciona el 'fantasma' a la música y si sería un problema tocarla a ciertas horas.",
          },
          {
            requirementId: "conversation_establecer_condicion_para_quedarte",
            text: "Plantea una condición clara para seguir viviendo aquí relacionada con el manejo del 'fantasma'.",
          },
          {
            requirementId: "conversation_pedir_permiso_registrar_sonido",
            text: "Pide permiso para grabar audio una noche y verificar ruidos o voces relacionados con el 'fantasma'.",
          },
          {
            requirementId:
              "conversation_consultar_preferencias_colores_fantasma",
            text: "Pregunta si el 'fantasma' prefiere ciertos colores o texturas en el salón y cómo lo sabe Percy.",
          },
          {
            requirementId: "conversation_reaccion_empatica_apego_percy",
            text: "Responde con empatía si Percy muestra apego emocional al 'fantasma' y valida sus sentimientos sin prometer creer.",
          },
          {
            requirementId: "conversation_sugerir_prueba_controlada",
            text: "Sugiere realizar una prueba controlada, con todos presentes, para observar una señal del 'fantasma'.",
          },
          {
            requirementId: "conversation_negociar_reubicacion_muebles",
            text: "Negocia si moverán muebles esta noche o esperarán hasta el día siguiente para evitar disturbios.",
          },
          {
            requirementId: "conversation_preguntar_desencadenantes",
            text: "Pregunta qué desencadena las opiniones fuertes del 'fantasma' sobre la decoración.",
          },
          {
            requirementId: "conversation_consultar_conocimiento_arrendador",
            text: "Pregunta si el arrendador está al tanto de la situación con el 'fantasma' y cómo lo ha tomado.",
          },
          {
            requirementId: "conversation_proponer_mediador_neutro",
            text: "Propón invitar a un tercero neutral (por ejemplo, un amigo escéptico) para observar una noche.",
          },
          {
            requirementId: "conversation_establecer_canal_comunicacion",
            text: "Acuerda con Percy un canal claro para comunicar incidentes nocturnos sin despertar a la casa.",
          },
          {
            requirementId: "conversation_preguntar_si_afecta_confort_termico",
            text: "Pregunta si el 'fantasma' causa corrientes frías o cambios de temperatura en el salón.",
          },
          {
            requirementId: "conversation_plantear_limite_objetos_personales",
            text: "Plantea que tus objetos personales no se muevan sin tu permiso, incluso si el 'fantasma' lo sugiere.",
          },
          {
            requirementId: "conversation_persuadir_posponer_cambios",
            text: "Intenta persuadir a Percy de posponer cualquier cambio drástico de decoración hasta tener más evidencia.",
          },
          {
            requirementId: "english_usar_collocation_house_rules",
            text: "Usa la collocation en inglés 'house rules' al proponer normas para el 'fantasma'.",
          },
          {
            requirementId: "english_usar_phrasal_figure_out",
            text: "Usa el phrasal verb en inglés 'figure out' para hablar de cómo resolver la situación nocturna.",
          },
          {
            requirementId: "english_usar_idiom_elephant_in_the_room",
            text: "Incluye el idiom en inglés 'the elephant in the room' para referirte al 'fantasma' y la decoración.",
          },
          {
            requirementId: "english_usar_termino_supernatural",
            text: "Emplea la palabra en inglés 'supernatural' al expresar dudas o límites.",
          },
          {
            requirementId: "english_usar_phrasal_put_up_with",
            text: "Usa el phrasal verb en inglés 'put up with' para describir tu tolerancia al ruido nocturno.",
          },
          {
            requirementId: "english_usar_idiom_give_me_the_creeps",
            text: "Usa el idiom en inglés 'give me the creeps' para describir una reacción a las corrientes frías.",
          },
          {
            requirementId: "english_usar_discourse_marker_frankly",
            text: "Inicia una objeción con el discourse marker en inglés 'frankly' para sonar directo pero cortés.",
          },
          {
            requirementId: "english_usar_collocation_reasonable_compromise",
            text: "Incluye la collocation en inglés 'a reasonable compromise' al proponer una solución de decoración.",
          },
          {
            requirementId: "english_usar_phrasal_set_up",
            text: "Usa el phrasal verb en inglés 'set up' para sugerir una prueba controlada en el salón.",
          },
          {
            requirementId: "english_usar_idiom_sleep_on_it",
            text: "Incluye el idiom en inglés 'sleep on it' para posponer decisiones drásticas de madrugada.",
          },
          {
            requirementId: "english_usar_vocab_dimly_lit",
            text: "Usa la expresión en inglés 'dimly lit' para describir la iluminación del salón.",
          },
          {
            requirementId: "english_usar_phrasal_carry_on",
            text: "Usa el phrasal verb en inglés 'carry on' para pedir que no continúen las conversaciones a medianoche.",
          },
          {
            requirementId: "english_usar_idiom_not_my_cup_of_tea",
            text: "Usa el idiom en inglés 'not my cup of tea' para hablar de un estilo de decoración que no te gusta.",
          },
          {
            requirementId: "english_usar_collocation_interiordesign_clash",
            text: "Incluye la collocation en inglés 'interior design' y la frase 'aesthetic clash' al discutir gustos.",
          },
          {
            requirementId: "english_usar_phrasal_come_up_with",
            text: "Usa el phrasal verb en inglés 'come up with' para proponer una regla nueva.",
          },
          {
            requirementId: "english_usar_idiom_blessing_in_disguise",
            text: "Emplea el idiom en inglés 'a blessing in disguise' para valorar un cambio de muebles inesperado.",
          },
          {
            requirementId: "english_usar_phrasal_turn_down",
            text: "Usa el phrasal verb en inglés 'turn down' para pedir que bajen el volumen o la intensidad de un ritual.",
          },
          {
            requirementId: "english_usar_discourse_on_the_other_hand",
            text: "Contrapón ideas usando el conector en inglés 'on the other hand' al sopesar pruebas y creencias.",
          },
          {
            requirementId: "english_usar_vocab_poltergeist",
            text: "Incluye la palabra en inglés 'poltergeist' al preguntar por movimientos de objetos.",
          },
          {
            requirementId: "english_usar_phrasal_make_up",
            text: "Usa el phrasal verb en inglés 'make up' para aclarar que no estás inventando una preocupación.",
          },
          {
            requirementId: "english_usar_idiom_between_a_rock_and_a_hard_place",
            text: "Usa el idiom en inglés 'between a rock and a hard place' para describir tu dilema como inquilino.",
          },
          {
            requirementId: "english_usar_collocation_ground_rules",
            text: "Incluye la collocation en inglés 'ground rules' al negociar límites con Percy.",
          },
          {
            requirementId: "english_usar_phrasal_move_in",
            text: "Usa el phrasal verb en inglés 'move in' para referirte a cuándo te mudaste y qué esperabas encontrar.",
          },
          {
            requirementId: "english_usar_idiom_spill_the_beans",
            text: "Usa el idiom en inglés 'spill the beans' para pedir que Percy cuente toda la verdad sobre el 'fantasma'.",
          },
          {
            requirementId: "english_usar_phrasal_tid_y_up",
            text: "Usa el phrasal verb en inglés 'tidy up' para proponer ordenar el salón antes de cualquier ritual.",
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
            requirementId: "conversation_describir_chisporroteo",
            text: "Describe qué te hace sentir el sonido del plato que chisporrotea y compáralo con otra experiencia sensorial.",
          },
          {
            requirementId: "conversation_pedir_ritmo_lento",
            text: "Pide al chef que hable más despacio y confirme que has entendido su última frase.",
          },
          {
            requirementId: "conversation_confirmar_nivel_picante",
            text: "Pregunta el nivel de picante disponible y solicita un nivel específico.",
          },
          {
            requirementId: "conversation_negociar_bocado_prueba",
            text: "Negocia un bocado de prueba antes de comprometerte a comprar el plato completo.",
          },
          {
            requirementId: "conversation_explicar_alergias",
            text: "Expón claramente una alergia o restricción alimentaria y pide garantías de no contaminación cruzada.",
          },
          {
            requirementId: "conversation_pedir_detalle_seguridad",
            text: "Pregunta por las medidas de seguridad cuando el plato chisporrotea y si hay riesgo de salpicaduras.",
          },
          {
            requirementId: "conversation_reaccionar_metafora_rara",
            text: "Reacciona a una metáfora culinaria extraña del chef y pide un ejemplo concreto aplicable al plato.",
          },
          {
            requirementId: "conversation_indagar_ingrediente_secreto",
            text: "Pregunta si hay un ingrediente secreto y en qué forma cambia el sabor final.",
          },
          {
            requirementId: "conversation_estimar_tiempo_espera",
            text: "Solicita el tiempo estimado de preparación y decide si esperar o pedir algo más rápido.",
          },
          {
            requirementId: "conversation_marcar_limite_ruido",
            text: "Expresa que el chisporroteo o las risas te distraen y pide suavizarlos sin perder el buen humor.",
          },
          {
            requirementId: "conversation_pedir_version_menos_riesgosa",
            text: "Solicita una versión del plato con menos espectáculo pero el mismo sabor.",
          },
          {
            requirementId: "conversation_preguntar_origen_plato",
            text: "Pregunta por el origen del plato y cómo llegó a ser la especialidad del food truck.",
          },
          {
            requirementId: "conversation_solicitar_descripcion_texturas",
            text: "Pide que te describan las texturas esperadas y cómo se logran en la plancha.",
          },
          {
            requirementId: "conversation_evaluar_relacion_calidad_precio",
            text: "Pregunta por el tamaño de la porción y justifica si el precio te parece adecuado.",
          },
          {
            requirementId: "conversation_pedir_sustitucion_ingrediente",
            text: "Solicita reemplazar un ingrediente concreto y confirma que el sabor principal se mantiene.",
          },
          {
            requirementId: "conversation_mostrar_empatia_chef",
            text: "Reconoce el esfuerzo del chef durante la noche y expresa gratitud por su energía.",
          },
          {
            requirementId: "conversation_solicitar_maridaje_sin_alcohol",
            text: "Pide una recomendación de bebida sin alcohol que combine con el plato chisporroteante.",
          },
          {
            requirementId: "conversation_rechazar_educadamente_propuesta_audaz",
            text: "Rechaza con cortesía una propuesta demasiado arriesgada y ofrece una alternativa que sí aceptarías.",
          },
          {
            requirementId: "conversation_pedir_repeticion_interrupcion",
            text: "Si el chef te interrumpe, pide que repita su última explicación para asegurarte de entender.",
          },
          {
            requirementId: "conversation_consultar_forma_pago",
            text: "Pregunta por los métodos de pago aceptados y confirma tu elección.",
          },
          {
            requirementId: "conversation_solicitar_extra_crujiente",
            text: "Pide explícitamente que una parte del plato quede más crujiente y pregunta cómo lo lograrán.",
          },
          {
            requirementId: "conversation_comentar_olor_color_vapor",
            text: "Comenta el olor y el color del vapor que sale de la sartén y qué esperas del sabor.",
          },
          {
            requirementId: "conversation_negociar_combo_nocturno",
            text: "Propón un combo nocturno con descuento e intenta persuadir al chef con una razón concreta.",
          },
          {
            requirementId: "conversation_pedir_empaque_para_llevar",
            text: "Solicita que el plato se empaque para llevar y pide que el chisporroteo se reduzca antes de cerrarlo.",
          },
          {
            requirementId: "conversation_dar_feedback_post_prueba",
            text: "Tras probar un bocado, da retroalimentación específica y pide un pequeño ajuste al sabor.",
          },
          {
            requirementId: "english_usar_sizzling",
            text: "Usa la palabra en inglés 'sizzling' para describir el plato y tu reacción.",
          },
          {
            requirementId: "english_usar_flavor_profile",
            text: "Usa la collocation 'flavor profile' para explicar qué sabores esperas.",
          },
          {
            requirementId: "english_phrasal_turn_down_the_heat",
            text: "Pide que bajen la intensidad usando el phrasal verb 'turn down the heat'.",
          },
          {
            requirementId: "english_usar_umami",
            text: "Menciona 'umami' al hablar del gusto principal que buscas.",
          },
          {
            requirementId: "english_phrasal_spice_up",
            text: "Solicita aumentar el picante usando el phrasal verb 'spice up'.",
          },
          {
            requirementId: "english_usar_texture_contrast",
            text: "Usa la collocation 'texture contrast' para pedir una combinación de crujiente y tierno.",
          },
          {
            requirementId: "english_idiom_recipe_for_disaster",
            text: "Advierte un posible riesgo usando el idiom 'a recipe for disaster'.",
          },
          {
            requirementId: "english_phrasal_tone_down",
            text: "Pide moderación del espectáculo usando el phrasal verb 'tone down'.",
          },
          {
            requirementId: "english_usar_mouthwatering",
            text: "Describe el olor del plato usando 'mouthwatering'.",
          },
          {
            requirementId: "english_usar_signature_dish",
            text: "Pregunta por la especialidad usando la collocation 'signature dish'.",
          },
          {
            requirementId: "english_idiom_not_my_cup_of_tea",
            text: "Rechaza una propuesta usando el idiom 'not my cup of tea'.",
          },
          {
            requirementId: "english_phrasal_whip_up",
            text: "Pregunta si pueden preparar algo rápido usando el phrasal verb 'whip up'.",
          },
          {
            requirementId: "english_usar_tangy_crispy",
            text: "Pide un acabado 'tangy' y 'crispy' en la misma frase.",
          },
          {
            requirementId: "english_idiom_flash_in_the_pan",
            text: "Comenta el show culinario usando el idiom 'a flash in the pan'.",
          },
          {
            requirementId: "english_usar_food_safety",
            text: "Menciona 'food safety' al pedir garantías sobre el chisporroteo.",
          },
          {
            requirementId: "english_phrasal_run_out_of",
            text: "Pregunta por disponibilidad usando el phrasal verb 'run out of'.",
          },
          {
            requirementId: "english_usar_price_range",
            text: "Habla del presupuesto usando la collocation 'price range'.",
          },
          {
            requirementId: "english_idiom_bite_the_bullet",
            text: "Expresa que te arriesgarás a probar usando el idiom 'bite the bullet'.",
          },
          {
            requirementId: "english_phrasal_try_out",
            text: "Propón experimentar el plato usando el phrasal verb 'try out'.",
          },
          {
            requirementId: "english_usar_flamb_charred",
            text: "Pregunta si el acabado es 'flambé' o 'charred' y cuál prefieren.",
          },
          {
            requirementId: "english_idiom_too_good_to_be_true",
            text: "Muestra escepticismo amable usando 'too good to be true'.",
          },
          {
            requirementId: "english_phrasal_set_off_flavors",
            text: "Habla de cómo una guarnición puede 'set off' the flavors del plato.",
          },
          {
            requirementId: "english_usar_waiting_time",
            text: "Pregunta el tiempo de espera usando la collocation 'waiting time'.",
          },
          {
            requirementId: "english_idiom_take_with_a_pinch_of_salt",
            text: "Di que tomarás una metáfora del chef 'with a pinch of salt'.",
          },
          {
            requirementId: "english_phrasal_cool_down",
            text: "Pide dejar reposar el plato usando el phrasal verb 'cool down'.",
          },
        ],
      },
      {
        missionId: "midnight_food_truck_sleepy_guardian",
        title: "El guardián somnoliento",
        sceneSummary:
          "Un guardián enorme protege el puesto mientras bosteza continuamente.",
        aiRole:
          "Eres un guardián somnoliento pero protector que habla lentamente y repite palabras cuando está medio dormido. LLevas tres días sin dormir.",
        caracterName: "Dozy Hugo",
        caracterPrompt:
          "A tall, muscular man in a patched leather jacket with a knitted cap, half-asleep on a stool. He has a friendly, droopy expression, holds a steaming bowl, and the truck's dim lights create a cozy atmosphere.",
        requirements: [
          {
            requirementId: "conversation_poetic_menu_clarification",
            text: "Pide que el guardián traduzca en inglés un verso poético del menú a una descripción literal y clara del plato.",
          },
          {
            requirementId: "conversation_spice_level_negotiation",
            text: "Negocia en inglés el nivel de picante exacto que quieres, pidiendo una escala y eligiendo un punto intermedio.",
          },
          {
            requirementId: "conversation_wait_time_estimate",
            text: "Pregunta en inglés el tiempo de espera estimado y confirma si te avisará cuando esté listo.",
          },
          {
            requirementId: "conversation_ingredient_confirmation",
            text: "Confirma en inglés los ingredientes principales del plato que elegiste y pide que repita uno que no entendiste.",
          },
          {
            requirementId: "conversation_sample_request",
            text: "Pide en inglés una muestra pequeña para decidir entre dos opciones y explica cuál criterio usarás para elegir.",
          },
          {
            requirementId: "conversation_combo_deal_query",
            text: "Pregunta en inglés si hay algún combo nocturno e indica qué dos elementos te gustaría combinar.",
          },
          {
            requirementId: "conversation_portion_size_adjustment",
            text: "Solicita en inglés reducir o aumentar la porción y justifica tu decisión con hambre o presupuesto.",
          },
          {
            requirementId: "conversation_boundary_touching_food",
            text: "Establece en inglés que prefieres que no toquen tu comida sin guantes y pide una alternativa cortés.",
          },
          {
            requirementId: "conversation_payment_methods_check",
            text: "Pregunta en inglés qué métodos de pago aceptan y confirma el que vas a usar.",
          },
          {
            requirementId: "conversation_receipt_request",
            text: "Pide en inglés un recibo con el desglose de costos e impuestos.",
          },
          {
            requirementId: "conversation_keep_open_persuasion",
            text: "Intenta persuadir en inglés al guardián para que mantenga el puesto abierto cinco minutos más, dando una razón convincente.",
          },
          {
            requirementId: "conversation_sleepiness_empathy",
            text: "Muestra empatía en inglés por el sueño del guardián y sugiere amablemente una pausa breve.",
          },
          {
            requirementId: "conversation_wake_me_if_ready",
            text: "Pide en inglés que te despierte suavemente si te quedas dormido mientras esperas tu pedido.",
          },
          {
            requirementId: "conversation_noise_level_request",
            text: "Solicita en inglés que baje un poco la voz poética para no despertar a otros clientes cercanos.",
          },
          {
            requirementId: "conversation_rules_of_guardian",
            text: "Pregunta en inglés cuáles son las reglas del guardián para proteger el puesto y confirma que las cumplirás.",
          },
          {
            requirementId: "conversation_non_rhyming_explanation",
            text: "Pide en inglés una explicación sin rimas de una advertencia sobre la comida para asegurar que la entiendes.",
          },
          {
            requirementId: "conversation_allergy_cross_contact",
            text: "Pregunta en inglés sobre posible contaminación cruzada y cómo la evitan durante la noche.",
          },
          {
            requirementId: "conversation_sauce_on_side_request",
            text: "Solicita en inglés que la salsa vaya aparte y confirma el tipo exacto de salsa que quieres.",
          },
          {
            requirementId: "conversation_reheating_advice",
            text: "Pregunta en inglés cómo recalentar el plato sin perder textura y sabor.",
          },
          {
            requirementId: "conversation_missing_item_report",
            text: "Reporta en inglés que falta un acompañamiento en tu pedido y pide que lo solucionen de inmediato.",
          },
          {
            requirementId: "conversation_cold_food_complaint_polite",
            text: "Expresa en inglés, de forma cortés, que la comida está más fría de lo esperado y pide una solución concreta.",
          },
          {
            requirementId: "conversation_queue_etiquette_clarify",
            text: "Aclara en inglés el orden de la fila y pide confirmación de tu turno.",
          },
          {
            requirementId: "conversation_tip_policy_question",
            text: "Pregunta en inglés cómo gestionan las propinas en el turno nocturno y decide si dejarás una.",
          },
          {
            requirementId: "conversation_poem_dedication_request",
            text: "Pide en inglés un verso breve dedicado a tu plato y reacciona con una opinión sincera.",
          },
          {
            requirementId: "conversation_help_offer_carrying",
            text: "Ofrece en inglés ayudar a llevar una caja ligera mientras esperas y confirma si es apropiado hacerlo.",
          },
          {
            requirementId: "english_discourse_marker_well_to_frame",
            text: "Usa el conector en inglés 'Well, to be honest,' para introducir tu preferencia sobre el picante.",
          },
          {
            requirementId: "english_collocation_hit_the_spot",
            text: "Usa la expresión en inglés 'hit the spot' para describir que un plato nocturno sería perfecto.",
          },
          {
            requirementId: "english_phrasal_verb_doze_off",
            text: "Usa el phrasal verb en inglés 'doze off' para comentar el sueño del guardián sin ser grosero.",
          },
          {
            requirementId: "english_idiom_on_the_house",
            text: "Usa la expresión idiomática en inglés 'on the house' para preguntar si una bebida podría ser gratis.",
          },
          {
            requirementId: "english_phrasal_verb_warm_up",
            text: "Usa el phrasal verb en inglés 'warm up' para pedir instrucciones de recalentado.",
          },
          {
            requirementId: "english_collocation_hearty_portion",
            text: "Usa la colocación en inglés 'hearty portion' para solicitar un tamaño de ración específico.",
          },
          {
            requirementId: "english_idiom_call_it_a_night",
            text: "Usa la expresión idiomática en inglés 'call it a night' para hablar de cerrar el puesto.",
          },
          {
            requirementId: "english_phrasal_verb_run_out_of",
            text: "Usa el phrasal verb en inglés 'run out of' para preguntar si se han acabado ciertos ingredientes.",
          },
          {
            requirementId: "english_collocation_queue_jump",
            text: "Usa la expresión en inglés 'jump the queue' para condenar que alguien se coló en la fila.",
          },
          {
            requirementId: "english_phrasal_verb_cool_down",
            text: "Usa el phrasal verb en inglés 'cool down' para explicar por qué esperas antes de comer.",
          },
          {
            requirementId: "english_idiom_half_asleep",
            text: "Usa la expresión en inglés 'half-asleep' para describir al guardián de forma neutral.",
          },
          {
            requirementId: "english_phrasal_verb_box_up",
            text: "Usa el phrasal verb en inglés 'box up' para pedir que empaquen tu comida para llevar.",
          },
          {
            requirementId: "english_collocation_mild_to_medium",
            text: "Usa la expresión en inglés 'mild to medium' para fijar el nivel de picante.",
          },
          {
            requirementId: "english_phrasal_verb_double_check",
            text: "Usa el phrasal verb en inglés 'double-check' para confirmar los ingredientes por alergias.",
          },
          {
            requirementId: "english_idiom_in_a_pinch",
            text: "Usa la expresión idiomática en inglés 'in a pinch' para aceptar una alternativa del menú.",
          },
          {
            requirementId: "english_phrasal_verb_top_up",
            text: "Usa el phrasal verb en inglés 'top up' para pedir que rellenen tu bebida.",
          },
          {
            requirementId: "english_collocation_contactless_payment",
            text: "Usa la colocación en inglés 'contactless payment' para preguntar por métodos de pago.",
          },
          {
            requirementId: "english_idiom_the_last_straw",
            text: "Usa la expresión idiomática en inglés 'the last straw' para quejarte si falta otro acompañamiento.",
          },
          {
            requirementId: "english_phrasal_verb_hold_off",
            text: "Usa el phrasal verb en inglés 'hold off' para pedir que retrasen echar la salsa.",
          },
          {
            requirementId: "english_collocation_steaming_bowl",
            text: "Usa la colocación en inglés 'steaming bowl' para describir el plato que te sirven.",
          },
          {
            requirementId: "english_idiom_right_up_my_alley",
            text: "Usa la expresión idiomática en inglés 'right up my alley' para decir que un plato encaja con tus gustos.",
          },
          {
            requirementId: "english_phrasal_verb_break_down",
            text: "Usa el phrasal verb en inglés 'break down' para pedir que desglosen el precio.",
          },
          {
            requirementId: "english_discourse_marker_just_to_clarify",
            text: "Usa el marcador discursivo en inglés 'Just to clarify,' para pedir repetición sin rimas.",
          },
          {
            requirementId: "english_idiom_keep_an_eye_on",
            text: "Usa la expresión idiomática en inglés 'keep an eye on' para pedir que vigilen tu pedido mientras te alejas un momento.",
          },
          {
            requirementId: "english_phrasal_verb_wrap_up",
            text: "Usa el phrasal verb en inglés 'wrap up' para hablar de terminar tu pedido antes de irte.",
          },
        ],
      },
      {
        missionId: "midnight_food_truck_mystery_spice_vendor",
        title: "El vendedor de especias misteriosas",
        sceneSummary:
          "Una vendedora con una caja llena de frascos que brillan promete transformar cualquier plato con una pizca.",
        aiRole:
          "Eres una vendedora de especias. Habla de tus productos como si fueran los mejores del mundo. Mantén un tono juguetón y provocador.",
        caracterName: "Mystra",
        caracterPrompt:
          "A slender woman wearing flowing scarves, with painted fingertips and a wooden box of glowing spice jars. She has an intense gaze and gestures dramatically under string lights above the truck.",
        requirements: [
          {
            requirementId: "conversation_comparar_dos_frascos",
            text: "Pide ver dos frascos que brillen distinto y compara sus aromas usando metáforas breves.",
          },
          {
            requirementId: "conversation_origen_y_recoleccion",
            text: "Pregunta de qué lugar provienen las especias y cómo las recolectan de forma segura.",
          },
          {
            requirementId: "conversation_tres_adjetivos_sensoriales",
            text: "Explica a qué te sabría una especia desconocida usando tres adjetivos sensoriales distintos.",
          },
          {
            requirementId: "conversation_descuento_con_razon",
            text: "Propón un descuento justificándolo con una circunstancia personal concreta y pide confirmación.",
          },
          {
            requirementId: "conversation_limite_de_picante",
            text: "Establece tu límite de picante aceptable y solicita que te confirme si la mezcla lo respeta.",
          },
          {
            requirementId: "conversation_solicitar_muestra",
            text: "Pide una muestra mínima antes de comprar y reacciona con sorpresa o duda tras olerla.",
          },
          {
            requirementId: "conversation_maridaje_con_plato",
            text: "Pide consejo para combinar una especia con un plato específico del food truck.",
          },
          {
            requirementId: "conversation_reformulacion_clara",
            text: "Solicita que aclare una pista críptica con una explicación sencilla y directa.",
          },
          {
            requirementId: "conversation_restricciones_alimentarias",
            text: "Expón una alergia o restricción y pide una alternativa viable sin ese elemento.",
          },
          {
            requirementId: "conversation_prueba_de_autenticidad",
            text: "Expresa escepticismo cortés y pide una prueba breve de autenticidad de una especia.",
          },
          {
            requirementId: "conversation_trato_condicional",
            text: "Propón un trato condicional donde compras si cumple un efecto de sabor específico.",
          },
          {
            requirementId: "conversation_tiempo_de_efecto",
            text: "Pregunta cuánto tarda en notarse el efecto completo de la especia en el plato.",
          },
          {
            requirementId: "conversation_efectos_secundarios_divertidos",
            text: "Pregunta si hay efectos secundarios inusuales y reacciona con humor moderado.",
          },
          {
            requirementId: "conversation_compromiso_resena",
            text: "Promete dejar una reseña si la experiencia coincide con su descripción misteriosa.",
          },
          {
            requirementId: "conversation_describir_brillo",
            text: "Describe el color y el brillo de un frasco y pide qué causa ese resplandor.",
          },
          {
            requirementId: "conversation_reaccion_olor_inesperado",
            text: "Reacciona a un olor inesperado con una emoción concreta y formula una pregunta inmediata.",
          },
          {
            requirementId: "conversation_tapa_vs_grano",
            text: "Pide oler la tapa y luego el contenido real para comparar intensidad y claridad.",
          },
          {
            requirementId: "conversation_cantidad_por_precio",
            text: "Negocia la cantidad por el mismo precio y pide que especifique el peso exacto.",
          },
          {
            requirementId: "conversation_politica_devolucion",
            text: "Pregunta por la política de devolución o cambio si la especia no cumple su promesa.",
          },
          {
            requirementId: "conversation_obsequio_extra",
            text: "Intenta persuadirla de incluir un frasco de muestra extra como obsequio y justifícalo.",
          },
          {
            requirementId: "conversation_presupuesto_maximo",
            text: "Declara tu presupuesto máximo y solicita opciones dentro de ese rango.",
          },
          {
            requirementId: "conversation_pronunciacion_nombre",
            text: "Pide que te confirme la pronunciación exacta de un nombre raro de especia.",
          },
          {
            requirementId: "conversation_comparar_conocida_vs_nueva",
            text: "Compara una especia conocida con una de su caja y pregunta similitudes y diferencias.",
          },
          {
            requirementId: "conversation_eleccion_final_razonada",
            text: "Toma una decisión entre dos frascos y explica tu razón principal de forma clara.",
          },
          {
            requirementId: "conversation_pedir_hablar_sin_acertijos",
            text: "Pide que por un momento hable sin acertijos para confirmar una instrucción clave.",
          },
          {
            requirementId: "english_umami",
            text: "Usa la palabra en inglés umami para describir el sabor que esperas.",
          },
          {
            requirementId: "english_smoky_undertones",
            text: "Incluye la expresión en inglés smoky undertones al hablar del aroma.",
          },
          {
            requirementId: "english_tangy",
            text: "Utiliza el adjetivo en inglés tangy para describir la acidez de una mezcla.",
          },
          {
            requirementId: "english_aftertaste",
            text: "Menciona la palabra en inglés aftertaste al evaluar la muestra.",
          },
          {
            requirementId: "english_mouthfeel",
            text: "Incluye el término en inglés mouthfeel al describir la sensación en boca.",
          },
          {
            requirementId: "english_pungent_yet_balanced",
            text: "Di la collocation en inglés pungent yet balanced al opinar sobre la intensidad.",
          },
          {
            requirementId: "english_aromatic_profile",
            text: "Usa la expresión en inglés aromatic profile para hablar del conjunto de aromas.",
          },
          {
            requirementId: "english_lingering_finish",
            text: "Incluye la expresión en inglés lingering finish al describir cuánto dura el sabor.",
          },
          {
            requirementId: "english_earthy_vs_citrusy",
            text: "Contrasta con las palabras en inglés earthy y citrusy en una sola frase.",
          },
          {
            requirementId: "english_subtle_yet_potent",
            text: "Emplea la collocation en inglés subtle yet potent al justificar tu elección.",
          },
          {
            requirementId: "english_on_second_thought",
            text: "Cambia de opinión usando el conector en inglés On second thought, al inicio de una frase.",
          },
          {
            requirementId: "english_all_things_considered",
            text: "Resume tu decisión con el marcador discursivo en inglés All things considered,.",
          },
          {
            requirementId: "english_whereas_contraste",
            text: "Contrasta dos especias en una oración usando el conector en inglés whereas.",
          },
          {
            requirementId: "english_apparently_hedge",
            text: "Atenúa una afirmación usando la palabra en inglés apparently al evaluar una pista.",
          },
          {
            requirementId: "english_bring_out_phrasal",
            text: "Usa el phrasal verb en inglés bring out para explicar cómo realza un plato.",
          },
          {
            requirementId: "english_tone_down_phrasal",
            text: "Emplea el phrasal verb en inglés tone down al pedir que reduzca el picante.",
          },
          {
            requirementId: "english_mix_in_phrasal",
            text: "Indica el método de uso con el phrasal verb en inglés mix in al dar instrucciones.",
          },
          {
            requirementId: "english_cut_through_phrasal",
            text: "Explica cómo la acidez puede equilibrar la grasa usando el phrasal verb en inglés cut through.",
          },
          {
            requirementId: "english_set_off_phrasal",
            text: "Describe contraste de sabores con el phrasal verb en inglés set off en una frase.",
          },
          {
            requirementId: "english_run_out_of_phrasal",
            text: "Menciona una preocupación de stock usando el phrasal verb en inglés run out of.",
          },
          {
            requirementId: "english_match_made_in_heaven_idiom",
            text: "Di el idiom en inglés a match made in heaven para describir un maridaje perfecto.",
          },
          {
            requirementId: "english_the_real_deal_idiom",
            text: "Valida la autenticidad usando el idiom en inglés the real deal.",
          },
          {
            requirementId: "english_too_good_to_be_true_idiom",
            text: "Expresa duda educada con el idiom en inglés too good to be true.",
          },
          {
            requirementId: "english_not_my_cup_of_tea_idiom",
            text: "Rechaza una opción con el idiom en inglés not my cup of tea de forma cortés.",
          },
          {
            requirementId: "english_get_carried_away_idiom",
            text: "Advierte sobre excederse usando la expresión en inglés get carried away al dosificar.",
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
            requirementId:
              "conversation_solicitar_lista_ingredientes_detallada",
            text: "Pide en inglés una lista detallada de todos los ingredientes del plato, incluyendo aceites, salsas y guarniciones.",
          },
          {
            requirementId: "conversation_preguntar_proceso_coccion_paso_a_paso",
            text: "Pregunta en inglés por el proceso de cocción paso a paso y tiempos aproximados de cada etapa.",
          },
          {
            requirementId: "conversation_exigir_protocolo_higiene",
            text: "Exige en inglés que describan su protocolo de higiene reciente y cómo evitan la contaminación cruzada.",
          },
          {
            requirementId: "conversation_negociar_porcion_cata_controlada",
            text: "Negocia en inglés una porción de cata más pequeña servida frente a ti para descartar manipulación.",
          },
          {
            requirementId: "conversation_solicitar_lote_reciente",
            text: "Pide en inglés que el plato provenga de un lote recién preparado y no de uno guardado.",
          },
          {
            requirementId: "conversation_establecer_limite_alergias",
            text: "Expón en inglés una alergia o restricción y pide confirmación explícita de que se respetará.",
          },
          {
            requirementId: "conversation_pedir_ticket_marcado_tiempo",
            text: "Solicita en inglés un recibo con marca de tiempo para documentar cuándo se preparó el pedido.",
          },
          {
            requirementId: "conversation_preguntar_temperatura_almacenamiento",
            text: "Pregunta en inglés a qué temperatura mantienen los ingredientes perecederos y cómo lo registran.",
          },
          {
            requirementId: "conversation_observar_preparacion_in_situ",
            text: "Pide en inglés observar la preparación directa del plato desde tu posición.",
          },
          {
            requirementId: "conversation_solicitar_envase_con_sello_evidente",
            text: "Exige en inglés que el plato se entregue con un sello inviolable y pide que lo coloquen delante de ti.",
          },
          {
            requirementId: "conversation_pedir_justificacion_olor_inusual",
            text: "Pregunta en inglés por una explicación específica si detectas un olor inusual en el plato.",
          },
          {
            requirementId: "conversation_requerir_cubiertos_reemplazo",
            text: "Solicita en inglés cubiertos nuevos y sellados si notas que los actuales no parecen limpios.",
          },
          {
            requirementId: "conversation_proponer_prueba_ciega_doble",
            text: "Propón en inglés una mini prueba ciega entre dos platos similares para comparar consistencia.",
          },
          {
            requirementId: "conversation_pedir_contacto_responsable",
            text: "Pide en inglés el nombre y contacto del responsable del food truck para futuras consultas.",
          },
          {
            requirementId:
              "conversation_cuestionar_inconsistencia_presentacion",
            text: "Señala en inglés cualquier inconsistencia en la presentación y pide una razón concreta.",
          },
          {
            requirementId: "conversation_solicitar_degustacion_personal_staff",
            text: "Pide en inglés que alguien del staff pruebe una pequeña porción frente a ti para verificar frescura.",
          },
          {
            requirementId: "conversation_plantear_reembolso_condicionado",
            text: "Propón en inglés un reembolso o reemplazo si el plato no cumple un criterio que definas claramente.",
          },
          {
            requirementId: "conversation_pedir_pruebas_proveedores",
            text: "Pregunta en inglés por el origen de un ingrediente clave y alguna evidencia del proveedor.",
          },
          {
            requirementId: "conversation_aclarar_escala_picante_propia",
            text: "Define en inglés tu escala de picante y pide confirmar el nivel exacto del plato en esa escala.",
          },
          {
            requirementId: "conversation_persuadir_priorizar_pedido",
            text: "Convence en inglés para que prioricen tu pedido por un plazo de entrega inminente, dando una razón concreta.",
          },
          {
            requirementId: "conversation_mostrar_empatia_sin_bajar_exigencia",
            text: "Expresa en inglés empatía por la presión nocturna del equipo, manteniendo tus exigencias claras.",
          },
          {
            requirementId: "conversation_pedir_revision_opiniones_previas",
            text: "Pregunta en inglés por reseñas recientes y solicita un ejemplo específico de crítica positiva y una negativa.",
          },
          {
            requirementId: "conversation_exigir_constancia_sabor_lotes",
            text: "Exige en inglés coherencia de sabor entre lotes y pide describir cómo la garantizan.",
          },
          {
            requirementId: "conversation_preguntar_plan_contingencia_agotado",
            text: "Pregunta en inglés qué alternativa ofrecen si un ingrediente clave se agota esta noche.",
          },
          {
            requirementId: "conversation_pedir_permiso_documentar",
            text: "Pide en inglés permiso para tomar una foto y anotar citas textuales para tu reseña.",
          },
          {
            requirementId: "english_usar_idioma_to_be_frank",
            text: 'Usa la expresión en inglés "to be frank" para introducir una crítica concreta del plato.',
          },
          {
            requirementId: "english_usar_collocation_fall_short",
            text: 'Emplea la collocation en inglés "fall short" para explicar en qué aspecto el plato no cumple.',
          },
          {
            requirementId: "english_usar_vocab_cross_contamination",
            text: 'Incluye el término en inglés "cross-contamination" al hablar de riesgos de higiene.',
          },
          {
            requirementId: "english_usar_phrasal_come_clean",
            text: 'Usa el phrasal verb en inglés "come clean" al pedir transparencia sobre un posible error en cocina.',
          },
          {
            requirementId: "english_usar_idioma_fishy",
            text: 'Emplea el adjetivo idiomático en inglés "fishy" para señalar algo sospechoso en la situación.',
          },
          {
            requirementId: "english_usar_phrasal_back_up",
            text: 'Usa el phrasal verb en inglés "back up" para exigir evidencia que respalde una afirmación.',
          },
          {
            requirementId: "english_usar_vocab_umami_mouthfeel",
            text: 'Incluye los términos en inglés "umami" y "mouthfeel" al describir la experiencia del sabor.',
          },
          {
            requirementId: "english_usar_collocation_tamper_proof_seal",
            text: 'Menciona en inglés "tamper-proof seal" al pedir un envase con sello inviolable.',
          },
          {
            requirementId: "english_usar_phrasal_sniff_out",
            text: 'Usa el phrasal verb en inglés "sniff out" para explicar cómo detectas irregularidades.',
          },
          {
            requirementId: "english_usar_idioma_cut_corners",
            text: 'Emplea el idiom en inglés "cut corners" para acusar suavemente de atajar procesos.',
          },
          {
            requirementId: "english_usar_discourse_nevertheless",
            text: 'Introduce en inglés el conector "nevertheless" para contrastar una queja con un elogio.',
          },
          {
            requirementId: "english_usar_phrasal_turn_down",
            text: 'Usa el phrasal verb en inglés "turn down" para rechazar amablemente una oferta que no te convence.',
          },
          {
            requirementId: "english_usar_vocab_sear_marinate",
            text: 'Incluye en inglés los verbos culinarios "sear" y "marinate" al pedir detalles del método.',
          },
          {
            requirementId: "english_usar_idioma_on_the_house",
            text: 'Emplea la expresión en inglés "on the house" al negociar una cata o reemplazo gratuito.',
          },
          {
            requirementId: "english_usar_phrasal_pass_off",
            text: 'Usa el phrasal verb en inglés "pass off" para cuestionar si intentan vender algo como fresco sin serlo.',
          },
          {
            requirementId: "english_usar_collocation_ethically_sourced",
            text: 'Incluye la collocation en inglés "ethically sourced" al preguntar por el origen de los ingredientes.',
          },
          {
            requirementId: "english_usar_discourse_admittedly",
            text: 'Emplea en inglés "admittedly" para reconocer un punto fuerte antes de criticar otro.',
          },
          {
            requirementId: "english_usar_phrasal_iron_out",
            text: 'Usa el phrasal verb en inglés "iron out" para proponer resolver una inconsistencia del servicio.',
          },
          {
            requirementId: "english_usar_idioma_not_my_cup_of_tea",
            text: 'Incluye el idiom en inglés "not my cup of tea" para expresar preferencia sin ofender.',
          },
          {
            requirementId: "english_usar_phrasal_check_up_on",
            text: 'Usa el phrasal verb en inglés "check up on" al explicar que verificarás su proveedor.',
          },
          {
            requirementId: "english_usar_vocab_aftertaste_garnish",
            text: 'Emplea en inglés "aftertaste" y "garnish" para describir el final del sabor y la decoración.',
          },
          {
            requirementId: "english_usar_idioma_sweep_under_the_rug",
            text: 'Usa el idiom en inglés "sweep under the rug" para advertir que no se debe ocultar un problema.',
          },
          {
            requirementId: "english_usar_phrasal_run_out_of",
            text: 'Emplea el phrasal verb en inglés "run out of" para hablar de un ingrediente que podría agotarse.',
          },
          {
            requirementId:
              "english_usar_collocation_consistency_across_batches",
            text: 'Incluye la collocation en inglés "consistency across batches" al exigir uniformidad del sabor.',
          },
          {
            requirementId: "english_usar_idioma_go_the_extra_mile",
            text: 'Usa el idiom en inglés "go the extra mile" para pedir un gesto adicional que garantice confianza.',
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
            requirementId: "conversation_pedir_ritmo_con_palmadas",
            text: "Solicita que Penny te marque el ritmo con palmadas antes de cantar tu estribillo.",
          },
          {
            requirementId: "conversation_confirmar_reglas_descuento",
            text: "Pide que te repita las reglas del descuento por estribillo y confirma que lo entendiste.",
          },
          {
            requirementId: "conversation_aclarar_rima_objetivo",
            text: "Pregunta si el estribillo debe rimar con el nombre del camión o con el plato.",
          },
          {
            requirementId: "conversation_tiempo_espera_nocturno",
            text: "Verifica el tiempo de espera estimado para tu pedido a medianoche.",
          },
          {
            requirementId: "conversation_pedir_descripcion_especial_rara",
            text: "Pide una breve descripción de la especialidad rara de la noche.",
          },
          {
            requirementId: "conversation_preguntar_ingredientes_alergenos",
            text: "Pregunta por ingredientes clave y alérgenos del plato que te interesa.",
          },
          {
            requirementId: "conversation_elogiar_baile_con_detalle",
            text: "Muestra entusiasmo y elogia el baile de Penny con un comentario específico.",
          },
          {
            requirementId: "conversation_reaccionar_ingrediente_inusual",
            text: "Reacciona con sorpresa educada ante un ingrediente inusual y pide una alternativa.",
          },
          {
            requirementId: "conversation_establecer_presupuesto_maximo",
            text: "Establece un presupuesto máximo y pregunta qué combo encaja.",
          },
          {
            requirementId: "conversation_solicitar_muestra_bocado",
            text: "Solicita una muestra pequeña o un bocado de prueba si es posible.",
          },
          {
            requirementId: "conversation_alcance_descuento_extras",
            text: "Confirma si el descuento aplica también a extras o solo al plato principal.",
          },
          {
            requirementId: "conversation_negociar_topping_palabra_clave",
            text: "Negocia añadir un topping si tu estribillo incluye una palabra clave que Penny te da.",
          },
          {
            requirementId: "conversation_correccion_pronunciacion_estribillo",
            text: "Pide que te corrijan la pronunciación de una frase del estribillo y repítela correctamente.",
          },
          {
            requirementId: "conversation_confirmar_longitud_tempo_estribillo",
            text: "Pregunta si puedes mantener el estribillo en 2–4 líneas y a qué tempo.",
          },
          {
            requirementId: "conversation_cantar_o_recitar_con_ritmo",
            text: "Aclara si debes cantar o basta con recitar con ritmo.",
          },
          {
            requirementId: "conversation_rechazar_upsell_razon",
            text: "Rechaza amablemente un upsell que no te interesa y ofrece una razón.",
          },
          {
            requirementId: "conversation_aceptar_upsell_motivacion",
            text: "Acepta un upsell atractivo y explica por qué te convence.",
          },
          {
            requirementId: "conversation_precio_final_marcando_pulso",
            text: "Solicita que el precio final te lo digan marcando el pulso para seguirlo.",
          },
          {
            requirementId:
              "conversation_cambiar_ingrediente_sin_perder_descuento",
            text: "Pide cambiar un ingrediente y confirma que no afecta el descuento.",
          },
          {
            requirementId: "conversation_medio_de_pago_eleccion",
            text: "Pregunta si aceptan pago en efectivo o tarjeta y elige uno.",
          },
          {
            requirementId: "conversation_recordar_frase_clave_corear",
            text: "Pide que te recuerden la frase clave del camión para corearla juntos.",
          },
          {
            requirementId: "conversation_pedir_recomendacion_sabor",
            text: "Pide recomendaciones según si prefieres dulce, salado o picante.",
          },
          {
            requirementId: "conversation_confirmar_nombre_con_ritmo",
            text: "Asegúrate de que tu nombre esté bien escrito para llamar tu pedido con ritmo.",
          },
          {
            requirementId: "conversation_pedir_permiso_grabar_audio_jingle",
            text: "Pide permiso para grabar solo el audio del jingle para practicar y confirma si está permitido.",
          },
          {
            requirementId: "conversation_resumen_final_pedido_y_descuento",
            text: "Cierra la negociación resumiendo pedido, descuento aplicado y total a pagar.",
          },
          {
            requirementId: "english_signature_dish",
            text: 'Usa la expresión "signature dish" para preguntar por el plato estrella.',
          },
          {
            requirementId: "english_value_for_money",
            text: 'Emplea "good value for money" al evaluar si el combo con descuento te conviene.',
          },
          {
            requirementId: "english_mouthwatering_aroma",
            text: 'Usa el adjetivo "mouthwatering" para describir el aroma del plato.',
          },
          {
            requirementId: "english_crispy_tender_texturas",
            text: 'Emplea "crispy" y "tender" juntos para describir texturas contrastantes.',
          },
          {
            requirementId: "english_sweet_and_spicy_preferencia",
            text: 'Usa "sweet-and-spicy" para explicar tu preferencia de sabor.',
          },
          {
            requirementId: "english_on_a_budget_limite",
            text: 'Emplea "on a budget" para indicar tu límite de gasto.',
          },
          {
            requirementId: "english_house_special_recomendacion",
            text: 'Usa "house special" para confirmar qué opción recomiendan esta noche.',
          },
          {
            requirementId: "english_catchy_estribillo",
            text: 'Emplea "catchy" para describir tu estribillo.',
          },
          {
            requirementId: "english_keep_the_beat_pedir_ritmo",
            text: 'Usa "keep the beat" para pedir que te marquen el ritmo.',
          },
          {
            requirementId: "english_hit_the_spot_reaccion",
            text: 'Usa el modismo "hit the spot" para reaccionar si el bocado te encanta.',
          },
          {
            requirementId: "english_on_the_house_confirmar_gratis",
            text: 'Usa el modismo "on the house" para confirmar si algún extra es gratis con el jingle.',
          },
          {
            requirementId: "english_cost_an_arm_and_a_leg_rechazo",
            text: 'Usa el modismo "cost an arm and a leg" al rechazar un extra demasiado caro.',
          },
          {
            requirementId: "english_in_the_groove_ritmo",
            text: 'Usa el modismo "in the groove" para decir que ya entraste en ritmo con Penny.',
          },
          {
            requirementId: "english_spice_up_phrasal",
            text: 'Usa el phrasal verb "spice up" para pedir que aviven el sabor sin pasarse.',
          },
          {
            requirementId: "english_tone_down_phrasal",
            text: 'Usa el phrasal verb "tone down" para pedir que bajen el picante.',
          },
          {
            requirementId: "english_try_out_phrasal",
            text: 'Usa el phrasal verb "try out" para solicitar probar una salsa.',
          },
          {
            requirementId: "english_swap_out_phrasal",
            text: 'Usa el phrasal verb "swap out" para pedir cambiar un ingrediente por otro.',
          },
          {
            requirementId: "english_hand_over_phrasal",
            text: 'Usa el phrasal verb "hand over" para indicar cuándo entregarás el pago.',
          },
          {
            requirementId: "english_play_along_phrasal",
            text: 'Usa el phrasal verb "play along" para invitar a Penny a acompañarte en el coro.',
          },
          {
            requirementId: "english_pump_up_phrasal",
            text: 'Usa el phrasal verb "pump up" para pedir más volumen o energía en el ritmo.',
          },
          {
            requirementId: "english_hold_off_phrasal",
            text: 'Usa el phrasal verb "hold off" para pedir que esperen antes de cobrar mientras decides.',
          },
          {
            requirementId: "english_sell_out_phrasal",
            text: 'Usa el phrasal verb "sell out" para preguntar si ya se agotó la especialidad.',
          },
          {
            requirementId: "english_lightly_toasted_colocacion",
            text: 'Usa la colocación "lightly toasted" para pedir el pan con el punto justo.',
          },
          {
            requirementId: "english_savory_vs_sweet_contraste",
            text: 'Emplea "savory" frente a "sweet" para contrastar dos opciones del menú.',
          },
          {
            requirementId: "english_earworm_estribillo",
            text: 'Usa el sustantivo "earworm" para referirte a tu estribillo pegajoso.',
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
            requirementId: "conversation_pedir_demostracion_saludo",
            text: "Pide una demostración exacta de cómo saludar con una leve inclinación de cabeza sin parecer exagerado.",
          },
          {
            requirementId: "conversation_confirmar_orden_cubiertos",
            text: "Confirma el orden correcto de los cubiertos señalando dos piezas y pidiendo verificación cortés.",
          },
          {
            requirementId: "conversation_disculpa_ruido_copa",
            text: "Ofrece una disculpa formal por hacer sonar la copa accidentalmente y pide un consejo para evitarlo.",
          },
          {
            requirementId: "conversation_solicitar_ritmo_mas_lento",
            text: "Solicita amablemente reducir el ritmo de correcciones para poder practicar con calma.",
          },
          {
            requirementId: "conversation_pedir_permiso_repetir_gesto",
            text: "Pide permiso para repetir un gesto específico tres veces y recibir una corrección puntual.",
          },
          {
            requirementId: "conversation_negociar_evitar_reverencia_profunda",
            text: "Negocia evitar una reverencia demasiado profunda y propone una alternativa más natural.",
          },
          {
            requirementId: "conversation_preguntar_trato_error_menor",
            text: "Pregunta cómo se debe manejar un error menor en público sin llamar la atención.",
          },
          {
            requirementId: "conversation_establecer_limite_contacto_fisico",
            text: "Establece un límite respetuoso sobre correcciones físicas y sugiere correcciones verbales.",
          },
          {
            requirementId: "conversation_pedir_claridad_tono_voz",
            text: "Pide claridad sobre el tono y volumen de voz adecuados durante una cena formal.",
          },
          {
            requirementId: "conversation_pedir_ejemplo_frase_excusa",
            text: "Solicita un ejemplo de frase cortés para excusarte temporalmente de la mesa.",
          },
          {
            requirementId: "conversation_expresar_incomodidad_ropa_ajustada",
            text: "Expresa con tacto que la indumentaria te aprieta y pregunta cómo mantener la compostura.",
          },
          {
            requirementId: "conversation_preguntar_colocacion_servilleta",
            text: "Pregunta dónde colocar la servilleta al sentarse y al levantarse momentáneamente.",
          },
          {
            requirementId: "conversation_pedir_retroalimentacion_postura",
            text: "Pide retroalimentación específica sobre tu postura de hombros y barbilla durante la comida.",
          },
          {
            requirementId: "conversation_solicitar_modelo_masticar_discreto",
            text: "Solicita que te muestre cómo masticar de forma discreta sin mover demasiado la mandíbula.",
          },
          {
            requirementId: "conversation_defender_variacion_cultural",
            text: "Defiende con respeto una variación cultural de modales y pide que se considere válida en ciertos contextos.",
          },
          {
            requirementId: "conversation_pedir_pausa_respirar",
            text: "Pide una breve pausa para respirar y recuperar la compostura sin interrumpir la lección.",
          },
          {
            requirementId: "conversation_preguntar_manejo_tos_en_mesa",
            text: "Pregunta el protocolo preciso para toser o estornudar durante la comida.",
          },
          {
            requirementId: "conversation_comprometer_objetivo_medir_progreso",
            text: "Comprométete con un objetivo medible para la clase y solicita un criterio de evaluación claro.",
          },
          {
            requirementId: "conversation_mostrar_empatia_exigencia",
            text: "Muestra empatía por la exigencia del profesor y reconoce el valor de la precisión.",
          },
          {
            requirementId: "conversation_pedir_corregir_un_solo_aspecto",
            text: "Pide centrarse en corregir un solo aspecto por turno y confirmar dominio antes de avanzar.",
          },
          {
            requirementId: "conversation_preguntar_manejo_plato_resbaladizo",
            text: "Pregunta cómo sujetar un plato resbaladizo sin parecer torpe y sin usar ambas manos.",
          },
          {
            requirementId: "conversation_solicitar_frase_para_discrepar",
            text: "Solicita una frase educada para discrepar con una corrección sin parecer desafiante.",
          },
          {
            requirementId: "conversation_reconocer_error_y_proponer_solucion",
            text: "Reconoce un error concreto y propone una solución inmediata para rectificarlo.",
          },
          {
            requirementId: "conversation_pedir_modelo_presentacion_invitado",
            text: "Pide un guion breve para presentar a un invitado de mayor rango con el tratamiento correcto.",
          },
          {
            requirementId: "conversation_pedir_consejo_manejar_risa_nerviosa",
            text: "Pide consejo sobre cómo manejar una risa nerviosa sin parecer irrespetuoso.",
          },
          {
            requirementId: "english_usar_with_all_due_respect",
            text: 'Incluye literalmente la expresión en inglés "with all due respect" al discrepar de una corrección.',
          },
          {
            requirementId: "english_usar_decorum",
            text: 'Usa la palabra "decorum" para referirte al comportamiento esperado en la mesa.',
          },
          {
            requirementId: "english_usar_faux_pas",
            text: 'Emplea el término "faux pas" para describir un error social que cometiste.',
          },
          {
            requirementId: "english_usar_collocation_table_manners",
            text: 'Utiliza la colocación "table manners" para hablar de una habilidad que quieres mejorar.',
          },
          {
            requirementId: "english_usar_phrasal_tone_down",
            text: 'Incluye el phrasal verb "tone down" para pedir suavizar una corrección o un gesto.',
          },
          {
            requirementId: "english_usar_idiom_keep_up_appearances",
            text: 'Usa el idiom "keep up appearances" para explicar por qué mantuviste la compostura.',
          },
          {
            requirementId: "english_usar_collocation_formal_address",
            text: 'Emplea la colocación "formal address" para preguntar por el tratamiento correcto.',
          },
          {
            requirementId: "english_usar_phrasal_brush_up_on",
            text: 'Incluye el phrasal verb "brush up on" para hablar de repasar un aspecto de etiqueta.',
          },
          {
            requirementId: "english_usar_propriety",
            text: 'Usa la palabra "propriety" para justificar una elección de comportamiento.',
          },
          {
            requirementId: "english_usar_idiom_by_the_book",
            text: 'Incluye el idiom "by the book" para describir el estilo del instructor.',
          },
          {
            requirementId: "english_usar_phrasal_live_up_to",
            text: 'Emplea el phrasal verb "live up to" al hablar de expectativas en clase.',
          },
          {
            requirementId: "english_usar_collocation_cutlery_placement",
            text: 'Usa la colocación "cutlery placement" al preguntar por la disposición de los cubiertos.',
          },
          {
            requirementId: "english_usar_courteous_yield",
            text: 'Incluye la expresión "be so kind as to" o "would you kindly" para hacer una petición cortés.',
          },
          {
            requirementId: "english_usar_phrasal_own_up_to",
            text: 'Usa el phrasal verb "own up to" para admitir un error de modales.',
          },
          {
            requirementId: "english_usar_collocation_posture_alignment",
            text: 'Emplea la colocación "posture alignment" para pedir corrección de la postura.',
          },
          {
            requirementId: "english_usar_idiom_out_of_my_depth",
            text: 'Incluye el idiom "out of my depth" para expresar que el nivel te supera por momentos.',
          },
          {
            requirementId: "english_usar_meticulous",
            text: 'Usa el adjetivo "meticulous" para describir una instrucción precisa.',
          },
          {
            requirementId: "english_usar_phrasal_refrain_from",
            text: 'Emplea la expresión "refrain from" para prometer evitar un gesto inapropiado.',
          },
          {
            requirementId: "english_usar_rectify",
            text: 'Usa el verbo "rectify" para proponer cómo corregir inmediatamente un desliz.',
          },
          {
            requirementId: "english_usar_idiom_mind_your_manners",
            text: 'Incluye el idiom "mind your manners" al hablar de autocontrol durante la cena.',
          },
          {
            requirementId: "english_usar_phrasal_look_down_on",
            text: 'Usa el phrasal verb "look down on" para criticar la actitud de desprecio sin ser grosero.',
          },
          {
            requirementId: "english_usar_collocation_dress_code",
            text: 'Incluye la colocación "dress code" para referirte a la indumentaria adecuada.',
          },
          {
            requirementId: "english_usar_if_i_may",
            text: 'Comienza una intervención con la fórmula "If I may," para sonar diplomático.',
          },
          {
            requirementId: "english_usar_idiom_toe_the_line",
            text: 'Usa el idiom "toe the line" para indicar que acatarás las normas del aula.',
          },
          {
            requirementId: "english_usar_phrasal_screw_up",
            text: 'Incluye el phrasal verb "screw up" para admitir un error, seguido de una disculpa formal.',
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
            requirementId: "conversation_pedir_permiso_retirar_mantel",
            text: "Pide permiso con cortesía para retirar discretamente el mantel manchado sin interrumpir la lección.",
          },
          {
            requirementId: "conversation_verificar_salud_mayordomo",
            text: "Pregunta con tacto si el mayordomo se ha quemado o ha sufrido algún daño y ofrece asistencia inmediata.",
          },
          {
            requirementId: "conversation_sugerir_pausa_breve",
            text: "Propón una pausa breve para reorganizar la mesa mientras se mantiene el tono formal de la clase.",
          },
          {
            requirementId: "conversation_pedir_protocolo_derrame",
            text: "Pregunta cuál es el protocolo correcto de etiqueta ante un derrame de té en este contexto.",
          },
          {
            requirementId: "conversation_ofrecer_materiales_limpieza",
            text: "Ofrece traer materiales de limpieza adecuados y pide confirmación de cuáles son apropiados para la mantelería fina.",
          },
          {
            requirementId: "conversation_sugerir_secado_servilletas",
            text: "Sugiere secar la mesa usando servilletas dobladas en triángulo y pide aprobación antes de proceder.",
          },
          {
            requirementId: "conversation_reencuadrar_incidente_aprendizaje",
            text: "Reencuadra el accidente como oportunidad de aprendizaje y solicita continuar la clase con ese enfoque.",
          },
          {
            requirementId: "conversation_consolar_sin_culpa",
            text: "Expresa empatía para consolar al mayordomo, evitando culparlo y manteniendo un tono profesional.",
          },
          {
            requirementId: "conversation_negociar_redistribuir_asientos",
            text: "Negocia cambiar algunos asientos temporalmente para evitar mojar la ropa de los asistentes.",
          },
          {
            requirementId: "conversation_preguntar_sobre_tetera_de_reserva",
            text: "Pregunta si hay una tetera de reserva y solicita autorización para sustituir la actual.",
          },
          {
            requirementId: "conversation_elogiar_actitud_mayordomo",
            text: "Elogia la rapidez y la actitud del mayordomo al reaccionar, para reforzar su confianza.",
          },
          {
            requirementId: "conversation_marcar_limite_culpa",
            text: "Establece con cortesía que nadie debe culparse en exceso, manteniendo el ambiente de respeto.",
          },
          {
            requirementId: "conversation_pedir_aclaracion_cubiertos",
            text: "Pide aclaración sobre el orden correcto de los cubiertos tras reorganizar la mesa.",
          },
          {
            requirementId: "conversation_pedir_delegacion_tareas",
            text: "Pide al mayordomo que te delegue una tarea específica para agilizar la recuperación de la mesa.",
          },
          {
            requirementId: "conversation_disculpa_diplomatica_grupo",
            text: "Emite una disculpa diplomática en nombre del grupo hacia el instructor por la interrupción.",
          },
          {
            requirementId: "conversation_preguntar_insumos_manchas",
            text: "Pregunta si hay toallas absorbentes o bicarbonato para tratar de inmediato la mancha de té.",
          },
          {
            requirementId: "conversation_proponer_ejercicio_sin_liquidos",
            text: "Propón continuar con un ejercicio de etiqueta que no involucre líquidos mientras se seca la mesa.",
          },
          {
            requirementId: "conversation_pedir_permiso_ventilar",
            text: "Pide permiso para abrir una ventana y ventilar el aroma del té derramado sin incomodar a nadie.",
          },
          {
            requirementId: "conversation_alentar_continuidad_mayordomo",
            text: "Anima al mayordomo a seguir liderando el servicio, asegurando que cuenta con tu apoyo.",
          },
          {
            requirementId: "conversation_solicitar_feedback_tono",
            text: "Solicita retroalimentación sobre si tu tono ha sido lo suficientemente cortés durante la contingencia.",
          },
          {
            requirementId: "conversation_compartir_experiencia_similar",
            text: "Comparte brevemente una experiencia similar para normalizar el error y aliviar la tensión.",
          },
          {
            requirementId: "conversation_validar_broma_suave",
            text: "Pregunta si es apropiado usar una broma suave y respetuosa para distender el ambiente.",
          },
          {
            requirementId: "conversation_solicitar_registro_caso_practico",
            text: "Pide que el incidente se registre como caso práctico de etiqueta en situaciones imprevistas.",
          },
          {
            requirementId: "conversation_ofrecer_cubrir_costo_limpieza",
            text: "Ofrece colaborar con los costos de lavandería de los manteles si fuese necesario, manteniendo el decoro.",
          },
          {
            requirementId: "conversation_establecer_plan_pasos",
            text: "Propón un plan de pasos concretos para limpiar, reorganizar y reanudar, y verifica que todos estén de acuerdo.",
          },
          {
            requirementId: "english_mop_up",
            text: 'Usa el phrasal verb en inglés "mop up" para proponer limpiar el té derramado con discreción.',
          },
          {
            requirementId: "english_wipe_down",
            text: 'Incluye el phrasal verb "wipe down" al sugerir pasar un paño por la superficie de la mesa.',
          },
          {
            requirementId: "english_soak_up",
            text: 'Emplea el phrasal verb "soak up" para describir cómo absorber el té con servilletas.',
          },
          {
            requirementId: "english_smooth_over",
            text: 'Usa el phrasal verb "smooth over" para indicar que deseas mitigar el impacto social del incidente.',
          },
          {
            requirementId: "english_carry_on",
            text: 'Utiliza el phrasal verb "carry on" para sugerir continuar la lección con serenidad.',
          },
          {
            requirementId: "english_switch_out",
            text: 'Emplea el phrasal verb "switch out" al proponer cambiar la tetera por otra limpia.',
          },
          {
            requirementId: "english_set_aside",
            text: 'Usa el phrasal verb "set aside" para recomendar apartar la loza manchada sin llamar la atención.',
          },
          {
            requirementId: "english_blot_up",
            text: 'Incluye el phrasal verb "blot up" para describir cómo retirar el exceso de líquido con toques suaves.',
          },
          {
            requirementId: "english_no_use_crying_over_spilled_milk",
            text: 'Introduce el idiom "no use crying over spilled milk" para tranquilizar al mayordomo con tacto.',
          },
          {
            requirementId: "english_cut_some_slack",
            text: 'Usa el idiom "cut yourself some slack" para animar al mayordomo a no castigarse en exceso.',
          },
          {
            requirementId: "english_keep_your_composure",
            text: 'Incluye la colocación "keep your composure" para resaltar la importancia de mantener la compostura.',
          },
          {
            requirementId: "english_grace_under_pressure",
            text: 'Emplea la expresión "grace under pressure" para elogiar la forma de manejar la situación.',
          },
          {
            requirementId: "english_minor_mishap",
            text: 'Usa la colocación "minor mishap" para describir el derrame sin dramatizar.',
          },
          {
            requirementId: "english_would_you_mind",
            text: 'Formula una petición cortés usando "Would you mind if..." para solicitar mover la tetera.',
          },
          {
            requirementId: "english_i_d_appreciate_it_if",
            text: 'Emplea "I\'d appreciate it if..." para pedir apoyo al equipo mientras se limpia.',
          },
          {
            requirementId: "english_by_all_means",
            text: 'Incluye el marcador "By all means" para conceder permiso con elegancia.',
          },
          {
            requirementId: "english_given_the_circumstances",
            text: 'Comienza una sugerencia con "Given the circumstances," para introducir una alternativa de actividad.',
          },
          {
            requirementId: "english_on_second_thought",
            text: 'Usa "On second thought," para corregirte con cortesía al proponer otro método de limpieza.',
          },
          {
            requirementId: "english_make_amends",
            text: 'Incluye la expresión "make amends" al ofrecer compensar el posible daño a la mantelería.',
          },
          {
            requirementId: "english_at_your_earliest_convenience",
            text: 'Utiliza "at your earliest convenience" para programar la reanudación de la lección sin presionar.',
          },
          {
            requirementId: "english_stain_remover",
            text: 'Menciona "stain remover" al preguntar si hay quitamanchas adecuado para lino.',
          },
          {
            requirementId: "english_linen_napkin",
            text: 'Emplea "linen napkin" para referirte a las servilletas apropiadas para absorber el té.',
          },
          {
            requirementId: "english_wipe_the_slate_clean_idiom",
            text: 'Usa el idiom "wipe the slate clean" para proponer retomar la clase sin rencores.',
          },
          {
            requirementId: "english_hands_on_deck_idiom",
            text: 'Incluye el idiom "all hands on deck" para solicitar ayuda conjunta de manera cordial.',
          },
          {
            requirementId: "english_tidy_up",
            text: 'Emplea el phrasal verb "tidy up" al plantear ordenar la mesa antes de continuar.',
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
            requirementId: "conversation_deshacer_chisme_con_tacto",
            text: "Redirige un comentario chismoso hacia un tema neutral usando una frase de cortesía.",
          },
          {
            requirementId: "conversation_pedir_voz_mas_baja_indirecto",
            text: "Pide que baje la voz de forma indirecta y elegante sin mencionar que molesta.",
          },
          {
            requirementId: "conversation_ofrecer_alternativa_tema",
            text: "Propón un tema alternativo relacionado con modas o arte para reemplazar un secreto comprometedor.",
          },
          {
            requirementId: "conversation_validar_y_redirigir",
            text: "Valida la emoción de la duquesa y, en la misma intervención, redirige la conversación.",
          },
          {
            requirementId: "conversation_establecer_limite_sobre_nombres",
            text: "Pide amablemente evitar nombres propios al hablar de terceros.",
          },
          {
            requirementId: "conversation_pedir_anecdota_inofensiva",
            text: "Solicita una anécdota divertida pero inofensiva del mundo aristocrático.",
          },
          {
            requirementId: "conversation_pregunta_por_etiqueta_historia",
            text: "Pregunta cómo se aplican las reglas de etiqueta en una recepción oficial en lugar de hablar de un escándalo.",
          },
          {
            requirementId: "conversation_reconocer_estilo_duquesa",
            text: "Elogia el estilo o el sombrero de la duquesa para suavizar un cambio de tema.",
          },
          {
            requirementId: "conversation_invitar_opinion_sobre_protocolo",
            text: "Invita a la duquesa a opinar sobre un dilema de protocolo concreto.",
          },
          {
            requirementId: "conversation_pedir_permiso_para_cambiar_tema",
            text: "Pide permiso explícito para cambiar de tema de forma cortés.",
          },
          {
            requirementId: "conversation_expresar_incomodidad_con_diplomacia",
            text: "Expresa incomodidad ante un detalle íntimo con una fórmula diplomática.",
          },
          {
            requirementId: "conversation_agradecer_y_reformular",
            text: "Agradece la confianza de la duquesa y reformula el objetivo de la charla hacia etiqueta.",
          },
          {
            requirementId: "conversation_pedir_aclaracion_protocolo",
            text: "Pide aclaración sobre una regla de protocolo mencionada, evitando la parte chismosa.",
          },
          {
            requirementId: "conversation_negociar_tema_seguro",
            text: "Negocia un tema seguro proponiendo dos opciones aceptables para ambas partes.",
          },
          {
            requirementId: "conversation_marcar_linea_tema_privacidad",
            text: "Marca un límite claro sobre la privacidad sin juzgar ni moralizar.",
          },
          {
            requirementId: "conversation_reorientar_con_pregunta_cerrada",
            text: "Usa una pregunta cerrada para reorientar la charla hacia un evento cultural.",
          },
          {
            requirementId: "conversation_pedir_discrecion_ambiente",
            text: "Señala discretamente que hay oídos cerca para incentivar prudencia sin avergonzarla.",
          },
          {
            requirementId: "conversation_compartir_autoerror_etiqueta",
            text: "Comparte brevemente un fallo propio de etiqueta para cambiar el foco y humanizar la situación.",
          },
          {
            requirementId: "conversation_reaccionar_con_empatia_sin_fomentar",
            text: "Responde con empatía a un rumor pero evita hacer preguntas que lo amplíen.",
          },
          {
            requirementId: "conversation_pedir_consejo_formulacion_brindis",
            text: "Pide consejo sobre cómo formular un brindis apropiado.",
          },
          {
            requirementId: "conversation_discrepar_sobre_indiscrecion",
            text: "Discrepa suavemente ante una indiscreción y sugiere más prudencia.",
          },
          {
            requirementId: "conversation_redirigir_con_halago_competencia",
            text: "Redirige la conversación tras un halago a su experiencia organizando bailes.",
          },
          {
            requirementId: "conversation_solicitar_ejemplo_buen_modales",
            text: "Solicita un ejemplo concreto de buenos modales en una mesa formal.",
          },
          {
            requirementId: "conversation_proponer_pequena_pausa_ventilar",
            text: "Propón abrir una ventana o cambiar de asiento como excusa para cambiar el tema.",
          },
          {
            requirementId:
              "conversation_cerrar_rumor_con_conclusion_diplomatica",
            text: "Cierra un rumor con una conclusión diplomática que no invite a continuar.",
          },
          {
            requirementId: "english_with_all_due_respect",
            text: 'Usa la expresión en inglés "with all due respect" para suavizar un desacuerdo.',
          },
          {
            requirementId: "english_i_was_wondering_if",
            text: 'Introduce una petición con la fórmula "I was wondering if...".',
          },
          {
            requirementId: "english_change_the_subject",
            text: 'Expresa explícitamente la intención de cambiar de tema usando "change the subject".',
          },
          {
            requirementId: "english_steer_the_conversation",
            text: 'Usa la collocation "steer the conversation" para indicar redirección del tema.',
          },
          {
            requirementId: "english_tone_down_phrasal",
            text: 'Pide moderación de voz con el phrasal verb "tone down".',
          },
          {
            requirementId: "english_keep_it_down_idiom",
            text: 'Solicita hablar más bajo usando la expresión "keep it down".',
          },
          {
            requirementId: "english_off_the_record_idiom",
            text: 'Menciona la condición de confidencialidad con "off the record".',
          },
          {
            requirementId: "english_read_the_room_idiom",
            text: 'Invoca la idiomática "read the room" para sugerir prudencia.',
          },
          {
            requirementId: "english_if_you_dont_mind_me_saying",
            text: 'Introduce una crítica suave con "If you don’t mind me saying".',
          },
          {
            requirementId: "english_would_you_be_so_kind_as_to",
            text: 'Haz una petición extremadamente cortés con "Would you be so kind as to...".',
          },
          {
            requirementId: "english_spill_the_beans_idiom",
            text: 'Alude a revelar secretos usando la idiomática "spill the beans" sin fomentarla.',
          },
          {
            requirementId: "english_steer_clear_of_idiom",
            text: 'Propón evitar un asunto delicado con "steer clear of".',
          },
          {
            requirementId: "english_bring_up_phrasal",
            text: 'Menciona iniciar un tema con el phrasal verb "bring up" al proponer otro asunto.',
          },
          {
            requirementId: "english_drop_the_matter_idiom",
            text: 'Sugiere finalizar un tema usando "drop the matter".',
          },
          {
            requirementId: "english_take_the_hint_idiom",
            text: 'Usa "take the hint" para mostrar que captas una insinuación.',
          },
          {
            requirementId: "english_on_a_different_note_discourse",
            text: 'Cambia de tema con el conector "On a different note".',
          },
          {
            requirementId: "english_that_said_discourse_marker",
            text: 'Matiza una frase con el marcador discursivo "That said".',
          },
          {
            requirementId: "english_discretion_collocation",
            text: 'Incluye la collocation "exercise discretion" al hablar de prudencia.',
          },
          {
            requirementId: "english_breach_of_confidence",
            text: 'Menciona "a breach of confidence" para referirte a una indiscreción.',
          },
          {
            requirementId: "english_tactful_vs_indiscreet",
            text: 'Contrapón "tactful" e "indiscreet" para evaluar una conducta.',
          },
          {
            requirementId: "english_small_talk_collocation",
            text: 'Propón hacer "small talk" como alternativa segura.',
          },
          {
            requirementId: "english_lower_your_voice_collocation",
            text: 'Pide amablemente "lower your voice" en una oración completa y cortés.',
          },
          {
            requirementId: "english_cross_the_line_idiom",
            text: 'Señala un límite usando la idiomática "cross the line".',
          },
          {
            requirementId: "english_id_rather_not_politely",
            text: 'Rechaza un tema con la fórmula cortés "I’d rather not...".',
          },
          {
            requirementId: "english_could_we_possibly",
            text: 'Sugiere un cambio usando "Could we possibly..." en una pregunta diplomática.',
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
            requirementId: "conversation_saludo_formal",
            text: "Saluda al juez de forma muy formal y apropiada para un examen de etiqueta.",
          },
          {
            requirementId: "conversation_como_dirigirme",
            text: "Pregunta cortésmente cómo debes dirigirte al juez durante la evaluación.",
          },
          {
            requirementId: "conversation_pedir_aclaracion_criterio",
            text: "Solicita que te aclare un criterio específico del puntaje que no entendiste.",
          },
          {
            requirementId: "conversation_disculpa_breve",
            text: "Ofrece una disculpa breve y sin excusas por un desliz de modales.",
          },
          {
            requirementId: "conversation_defensa_contexto",
            text: "Defiende tu decisión señalando el contexto exacto que motivó tu elección.",
          },
          {
            requirementId: "conversation_pedir_ejemplo_modelo",
            text: "Pide un ejemplo concreto de la versión impecable del comportamiento esperado.",
          },
          {
            requirementId: "conversation_proponer_rehacer_breve",
            text: "Propón repetir una parte del protocolo con una corrección puntual.",
          },
          {
            requirementId: "conversation_negociar_credito_parcial",
            text: "Negocia de forma cortés un crédito parcial por lo que ejecutaste correctamente.",
          },
          {
            requirementId: "conversation_responder_sarcasmo_calma",
            text: "Responde con calma y tacto ante un comentario sarcástico del juez.",
          },
          {
            requirementId: "conversation_pedir_rubrica",
            text: "Solicita ver la rúbrica o lista de verificación usada para puntuarte.",
          },
          {
            requirementId: "conversation_parafrasear_critica",
            text: "Parafrasea un comentario del juez para confirmar que entendiste su crítica.",
          },
          {
            requirementId: "conversation_pedir_permiso_demostracion",
            text: "Pide permiso antes de realizar una nueva demostración de modales.",
          },
          {
            requirementId: "conversation_limites_tiempo",
            text: "Indica con cortesía un límite de tiempo personal relevante para la evaluación.",
          },
          {
            requirementId: "conversation_compartir_intencion",
            text: "Reconoce el error y explica brevemente la intención positiva que tenías.",
          },
          {
            requirementId: "conversation_pregunta_detalle_protocolo",
            text: "Haz una pregunta específica sobre el orden correcto del protocolo que fallaste.",
          },
          {
            requirementId: "conversation_comparar_opciones",
            text: "Compara dos alternativas de etiqueta y justifica por qué elegiste una.",
          },
          {
            requirementId: "conversation_manejar_interrupcion",
            text: "Maneja una interrupción del juez con cortesía y retoma tu argumento.",
          },
          {
            requirementId: "conversation_empatia_carga_juez",
            text: "Muestra empatía por la exigencia del rol del juez antes de pedir algo.",
          },
          {
            requirementId: "conversation_pedir_consejo_uno",
            text: "Pide un consejo accionable de un solo paso para mejorar de inmediato.",
          },
          {
            requirementId: "conversation_pedir_tiempo_practica",
            text: "Solicita un momento breve para practicar en voz alta el saludo correcto.",
          },
          {
            requirementId: "conversation_rebatir_inconsistencia",
            text: "Señala con respeto una posible inconsistencia en la evaluación y pide aclaración.",
          },
          {
            requirementId: "conversation_compromiso_medido",
            text: "Comprométete con una meta medible de mejora para la próxima ronda.",
          },
          {
            requirementId: "conversation_confirmar_siguientes_pasos",
            text: "Confirma los siguientes pasos y las condiciones para volver a intentarlo.",
          },
          {
            requirementId: "conversation_cierre_corto_cortes",
            text: "Cierra con una declaración final breve y cortés defendiendo tu decisión.",
          },
          {
            requirementId: "conversation_pedir_formulacion_elegante",
            text: "Pide una formulación elegante alternativa para una frase que usaste mal.",
          },
          {
            requirementId: "english_with_all_due_respect",
            text: 'Usa la expresión inglesa "with all due respect" para introducir un desacuerdo cortés.',
          },
          {
            requirementId: "english_faux_pas",
            text: 'Incluye la palabra "faux pas" para referirte a tu error de etiqueta.',
          },
          {
            requirementId: "english_decorum_collocation",
            text: 'Usa la collocation "maintain proper decorum" al prometer mejorar tu porte.',
          },
          {
            requirementId: "english_beg_to_differ",
            text: 'Emplea la frase "I beg to differ" para discrepar sin sonar agresivo.',
          },
          {
            requirementId: "english_take_into_account",
            text: 'Usa la expresión "take into account" al pedir que consideren el contexto.',
          },
          {
            requirementId: "english_in_hindsight",
            text: 'Incluye el conector "in hindsight" para reflexionar sobre tu decisión.',
          },
          {
            requirementId: "english_by_the_book",
            text: 'Usa la expresión "by the book" para hablar de seguir el protocolo al pie de la letra.',
          },
          {
            requirementId: "english_might_i_request",
            text: 'Formula una petición iniciándola con "Might I..." para sonar deferente.',
          },
          {
            requirementId: "english_courteous_tone",
            text: 'Incluye el adjetivo "courteous" para describir el tono que mantendrás.',
          },
          {
            requirementId: "english_impeccable_standards",
            text: 'Usa la collocation "impeccable standards" al referirte a las expectativas del juez.',
          },
          {
            requirementId: "english_step_up_phrasal",
            text: 'Emplea el phrasal verb "step up" para prometer un desempeño más alto.',
          },
          {
            requirementId: "english_tone_down_phrasal",
            text: 'Usa el phrasal verb "tone down" para hablar de moderar tu lenguaje corporal.',
          },
          {
            requirementId: "english_own_up_to_phrasal",
            text: 'Incluye el phrasal verb "own up to" para admitir tu responsabilidad.',
          },
          {
            requirementId: "english_stick_to_phrasal",
            text: 'Usa el phrasal verb "stick to" para comprometerte con una regla específica.',
          },
          {
            requirementId: "english_follow_through_phrasal",
            text: 'Emplea el phrasal verb "follow through" para prometer que cumplirás lo acordado.',
          },
          {
            requirementId: "english_bring_up_phrasal",
            text: 'Usa el phrasal verb "bring up" para introducir un criterio que consideras relevante.',
          },
          {
            requirementId: "english_iron_out_phrasal",
            text: 'Incluye el phrasal verb "iron out" para proponer resolver un malentendido.',
          },
          {
            requirementId: "english_back_down_phrasal",
            text: 'Emplea el phrasal verb "back down" para indicar que no cederás sin razones claras.',
          },
          {
            requirementId: "english_brush_off_phrasal",
            text: 'Usa el phrasal verb "brush off" para mencionar que no ignoraste un detalle del protocolo.',
          },
          {
            requirementId: "english_nip_it_in_the_bud_idiom",
            text: 'Incluye el idiom "nip it in the bud" para proponer atajar un hábito incorrecto.',
          },
          {
            requirementId: "english_play_it_by_ear_idiom",
            text: 'Usa el idiom "play it by ear" para explicar por qué improvisaste y defiéndelo.',
          },
          {
            requirementId: "english_cut_me_some_slack_idiom",
            text: 'Emplea el idiom "cut me some slack" al pedir indulgencia por un primer intento.',
          },
          {
            requirementId: "english_on_the_same_page_idiom",
            text: 'Incluye el idiom "on the same page" para confirmar entendimiento sobre el criterio.',
          },
          {
            requirementId: "english_come_across_as_phrasal",
            text: 'Usa "come across as" para describir cómo pudo percibirse tu comportamiento.',
          },
          {
            requirementId: "english_constructive_feedback",
            text: 'Emplea la collocation "constructive feedback" al agradecer la crítica del juez.',
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
            requirementId: "conversation_confirm_lead_role",
            text: "Aclara quién lidera y consigue que tu pareja confirme explícitamente que te seguirá.",
          },
          {
            requirementId: "conversation_set_clear_count_in",
            text: "Establece un conteo de entrada claro y pídele que lo repita contigo antes de empezar.",
          },
          {
            requirementId: "conversation_request_classic_waltz_track",
            text: "Pide poner una pista de vals clásico y verifica que la música sea adecuada para el ritmo ternario.",
          },
          {
            requirementId: "conversation_define_giro_signal",
            text: "Acuerda una señal verbal simple para iniciar un giro y comprueba que la reconozca.",
          },
          {
            requirementId: "conversation_correct_breakdance_confusion",
            text: "Indica con cortesía que evite pasos de breakdance y que se limite al patrón básico de vals.",
          },
          {
            requirementId: "conversation_request_watch_steps",
            text: "Pide amablemente que vigile dónde pone los pies para no pisarte nuevamente.",
          },
          {
            requirementId: "conversation_negotiate_slower_practice_round",
            text: "Negocia una ronda más lenta para pulir el paso básico y consigue su acuerdo explícito.",
          },
          {
            requirementId: "conversation_establish_safe_distance",
            text: "Solicita mantener una distancia cómoda y confirma que ambos la respetan mientras bailan.",
          },
          {
            requirementId: "conversation_check_understanding_after_demo",
            text: "Después de mostrar un paso, pide que te explique en sus propias palabras lo que debe hacer.",
          },
          {
            requirementId: "conversation_request_volume_down",
            text: "Pide bajar un poco el volumen del boombox para que se escuche el conteo y verifica el cambio.",
          },
          {
            requirementId: "conversation_practice_right_turn_three_times",
            text: "Propón practicar solo el giro a la derecha tres veces seguidas y confirma cada intento.",
          },
          {
            requirementId: "conversation_focus_on_shoulders_cue",
            text: "Indica que siga la guía de tus hombros en lugar de mirar tus pies y valida que lo haga.",
          },
          {
            requirementId: "conversation_deliver_specific_feedback",
            text: "Da una retroalimentación concreta tras un intento, señalando un ajuste preciso y comprobando que se aplique.",
          },
          {
            requirementId: "conversation_set_emergency_freeze_word",
            text: "Acuerda una palabra de emergencia para detenerse al instante y pruébala una vez.",
          },
          {
            requirementId: "conversation_persuade_prioritize_posture",
            text: "Convence a tu pareja de priorizar la postura sobre los trucos y logra su compromiso.",
          },
          {
            requirementId: "conversation_express_empathy_for_nerves",
            text: "Muestra empatía por sus nervios y valida cómo se siente antes de continuar.",
          },
          {
            requirementId: "conversation_set_boundary_no_jumps",
            text: "Establece el límite de no hacer saltos durante el vals y obtén su aceptación clara.",
          },
          {
            requirementId: "conversation_offer_short_break_after_misstep",
            text: "Pregunta si necesita una breve pausa después de un pisotón y acuerda el reingreso al baile.",
          },
          {
            requirementId: "conversation_request_eye_contact_soft",
            text: "Pide mantener un contacto visual suave para coordinar mejor y verifica que lo sostenga unos compases.",
          },
          {
            requirementId: "conversation_propose_role_swap_trial",
            text: "Propón un intercambio de roles temporal de un minuto y confirma qué aprendizajes obtiene.",
          },
          {
            requirementId: "conversation_seek_clarification_on_timing",
            text: "Pregunta en qué parte del conteo siente que se pierde y aclara el punto exacto.",
          },
          {
            requirementId: "conversation_set_measurable_goal_16_counts",
            text: "Define la meta de completar dieciséis tiempos seguidos sin pisotones y verifica si se logró.",
          },
          {
            requirementId: "conversation_request_announce_turns",
            text: "Solicita que anuncie antes de intentar un giro y confirma que lo hace en el siguiente intento.",
          },
          {
            requirementId: "conversation_decline_comic_idea_politely",
            text: "Rechaza con cortesía una ocurrencia cómica que rompa la etiqueta y ofrece una alternativa elegante.",
          },
          {
            requirementId: "conversation_close_with_final_recap",
            text: "Cierra con un elogio sincero y acuerda una última repetición al ritmo correcto resumiendo la clave aprendida.",
          },
          {
            requirementId: "english_use_waltz",
            text: "Da una instrucción que incluya la palabra en inglés 'waltz' para referirte al estilo del baile.",
          },
          {
            requirementId: "english_use_lead_follow",
            text: "Formula una frase que use en inglés 'lead' y 'follow' para definir los roles.",
          },
          {
            requirementId: "english_use_on_the_beat",
            text: "Pide que se mueva 'on the beat' usando exactamente esa expresión en inglés.",
          },
          {
            requirementId: "english_use_off_beat",
            text: "Señala un error de tiempo empleando la expresión en inglés 'off-beat' o 'off the beat'.",
          },
          {
            requirementId: "english_use_posture_and_frame",
            text: "Da una corrección que incluya en inglés las palabras 'posture' y 'frame' en la misma frase.",
          },
          {
            requirementId: "english_use_footwork",
            text: "Menciona en inglés 'footwork' al pedir practicar la base del paso.",
          },
          {
            requirementId: "english_use_pivot",
            text: "Indica realizar un 'pivot' usando la palabra en inglés en una instrucción clara.",
          },
          {
            requirementId: "english_use_twirl",
            text: "Solicita un giro suave incluyendo en inglés la palabra 'twirl'.",
          },
          {
            requirementId: "english_use_glide",
            text: "Describe cómo moverse incluyendo la palabra en inglés 'glide' en una frase.",
          },
          {
            requirementId: "english_use_tempo",
            text: "Pide ajustar la música o el paso mencionando en inglés la palabra 'tempo'.",
          },
          {
            requirementId: "english_use_graceful_and_poise",
            text: "Da un objetivo estilístico usando en inglés 'graceful' y 'poise' en la misma oración.",
          },
          {
            requirementId: "english_use_apologize_formally",
            text: "Emite o solicita una disculpa usando el verbo en inglés 'apologize' en una construcción formal.",
          },
          {
            requirementId: "english_use_mind_your_step",
            text: "Pide cuidado con los pies incluyendo la expresión en inglés 'mind your step'.",
          },
          {
            requirementId: "english_use_count_us_in",
            text: "Indica el inicio del baile usando la expresión en inglés 'count us in'.",
          },
          {
            requirementId: "english_use_take_it_from_the_top_idiom",
            text: "Propón reiniciar la práctica usando el modismo en inglés 'take it from the top'.",
          },
          {
            requirementId: "english_use_slow_down_phrasal",
            text: "Solicita bajar el ritmo usando explícitamente el phrasal verb en inglés 'slow down'.",
          },
          {
            requirementId: "english_use_pick_up_the_pace_idiom",
            text: "Pide acelerar un poco usando la expresión en inglés 'pick up the pace'.",
          },
          {
            requirementId: "english_use_keep_up_phrasal",
            text: "Exige mantener el ritmo empleando el phrasal verb en inglés 'keep up'.",
          },
          {
            requirementId: "english_use_mess_up_phrasal",
            text: "Reconoce un error con el phrasal verb en inglés 'mess up' en una frase autocorrectiva.",
          },
          {
            requirementId: "english_use_start_over_phrasal",
            text: "Propón repetir desde el principio usando el phrasal verb en inglés 'start over'.",
          },
          {
            requirementId: "english_use_stick_to_phrasal",
            text: "Indica ceñirse al paso básico usando el phrasal verb en inglés 'stick to'.",
          },
          {
            requirementId: "english_use_tone_it_down_phrasal",
            text: "Pide reducir la energía con el phrasal verb en inglés 'tone it down'.",
          },
          {
            requirementId: "english_use_two_left_feet_idiom",
            text: "Menciona con humor el modismo en inglés 'two left feet' para hablar de torpeza al bailar.",
          },
          {
            requirementId: "english_use_out_of_sync",
            text: "Describe la descoordinación usando la expresión en inglés 'out of sync'.",
          },
          {
            requirementId: "english_use_cut_in_dance_term",
            text: "Habla de alguien que quiere interrumpir el baile usando el término en inglés 'cut in'.",
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
            requirementId: "conversation_confirma_senal_cambio",
            text: "Pregunta al director cuál es la señal exacta que usará para ordenar cada cambio de emoción y repítela para confirmarla.",
          },
          {
            requirementId: "conversation_establece_objetivo_escena",
            text: "Declara claramente el objetivo de tu personaje en la escena y verifica si el director está de acuerdo.",
          },
          {
            requirementId: "conversation_negocia_ritmo",
            text: "Negocia el ritmo de los cambios pidiendo un intervalo mínimo entre órdenes y obtén una respuesta afirmativa o una alternativa.",
          },
          {
            requirementId: "conversation_pide_aclaracion_genero",
            text: "Pide una aclaración específica cuando el director cambie el género de la escena y confirma el tono requerido.",
          },
          {
            requirementId: "conversation_propone_final_claro",
            text: "Propón un posible final para la escena y busca la aprobación o corrección del director.",
          },
          {
            requirementId: "conversation_establece_limite_seguridad",
            text: "Establece un límite de seguridad respecto a un truco físico y ofrece una alternativa segura.",
          },
          {
            requirementId: "conversation_reactiva_con_prop",
            text: "Si el director te lanza un objeto de utilería inesperado, integra el prop en tu acción y explica su propósito en la historia.",
          },
          {
            requirementId: "conversation_pide_cue_verbal",
            text: "Solicita una palabra clave como señal de entrada y repítela para confirmar que la entendiste.",
          },
          {
            requirementId: "conversation_acepta_correccion_con_resumen",
            text: "Acepta una corrección del director y resume en una frase cómo la aplicarás en la siguiente toma.",
          },
          {
            requirementId: "conversation_defiende_eleccion_personaje",
            text: "Defiende con una justificación breve una elección de tu personaje cuando el director la cuestione.",
          },
          {
            requirementId: "conversation_pide_retro_criterios",
            text: "Pregunta cuáles son los criterios de retroalimentación que usará y nómbralos de vuelta para confirmar.",
          },
          {
            requirementId: "conversation_calibra_volumen_energia",
            text: "Pregunta al director si quiere más o menos volumen y energía, y ajusta inmediatamente según su respuesta.",
          },
          {
            requirementId: "conversation_marca_cambio_estado",
            text: "Anuncia verbalmente que harás un cambio claro de estado emocional y ejecútalo cuando el director lo indique.",
          },
          {
            requirementId: "conversation_pide_pareja_escena",
            text: "Solicita interactuar con una pareja de escena imaginaria y describe brevemente quién es y qué quiere.",
          },
          {
            requirementId: "conversation_limita_acento",
            text: "Expón respetuosamente que no harás un acento estereotipado y ofrece otra elección vocal creativa.",
          },
          {
            requirementId: "conversation_reformula_ordenes_multiples",
            text: "Repite en tus palabras tres órdenes consecutivas del director para verificar que las comprendiste.",
          },
          {
            requirementId: "conversation_pide_tiempo_preparacion_micro",
            text: "Pide unos segundos para preparar una transición complicada y confirma cuándo estás listo.",
          },
          {
            requirementId: "conversation_solicita_sugerencia_publico",
            text: "Pide permiso para usar una sugerencia del público y verifica si encaja con la consigna actual.",
          },
          {
            requirementId: "conversation_propone_cambio_musical",
            text: "Sugiere introducir un cambio musical para sostener el ritmo y solicita la señal de inicio.",
          },
          {
            requirementId: "conversation_clarifica_bloqueo_escenico",
            text: "Pregunta dónde debes colocarte físicamente en el escenario para el siguiente beat y confirma la posición.",
          },
          {
            requirementId: "conversation_muestra_empatia_estres",
            text: "Reconoce el estrés del director con una frase empática y comprométete a una acción concreta para ayudar.",
          },
          {
            requirementId: "conversation_rechaza_indicacion_demisiva",
            text: "Rechaza con cortesía una indicación que te parezca despectiva y pide otra orientación específica.",
          },
          {
            requirementId: "conversation_opina_sobre_tono_comico",
            text: "Da tu opinión sobre si el tono cómico está funcionando y propone un ajuste medible.",
          },
          {
            requirementId: "conversation_recapitula_cambios_clave",
            text: "Recapitula en voz alta los últimos tres cambios clave de la escena para alinear expectativas.",
          },
          {
            requirementId: "conversation_cierra_con_acuerdo",
            text: "Asegura un acuerdo final con el director sobre la última imagen de la escena antes de ejecutarla.",
          },
          {
            requirementId: "english_yes_and",
            text: 'Incluye la expresión en inglés "yes, and" para aceptar y ampliar una propuesta del director.',
          },
          {
            requirementId: "english_break_the_fourth_wall",
            text: 'Usa la expresión en inglés "break the fourth wall" al describir una opción arriesgada.',
          },
          {
            requirementId: "english_cue",
            text: 'Emplea la palabra en inglés "cue" para referirte a la señal de entrada.',
          },
          {
            requirementId: "english_blocking",
            text: 'Menciona la palabra en inglés "blocking" al hablar de tu ubicación en el escenario.',
          },
          {
            requirementId: "english_ad_lib",
            text: 'Di en inglés "ad-lib" para indicar que improvisarás una línea.',
          },
          {
            requirementId: "english_comic_timing",
            text: 'Usa la collocation en inglés "comic timing" para justificar un ajuste de ritmo.',
          },
          {
            requirementId: "english_raise_the_stakes",
            text: 'Incluye la expresión en inglés "raise the stakes" para proponer más tensión dramática.',
          },
          {
            requirementId: "english_off_the_cuff_idiom",
            text: 'Usa el idiom en inglés "off the cuff" para describir una respuesta espontánea.',
          },
          {
            requirementId: "english_wing_it_idiom",
            text: 'Emplea el idiom en inglés "wing it" al aceptar un reto sin preparación.',
          },
          {
            requirementId: "english_roll_with_it_phrasal",
            text: 'Incluye el phrasal verb en inglés "roll with it" para mostrar adaptación a un cambio brusco.',
          },
          {
            requirementId: "english_think_on_your_feet_idiom",
            text: 'Usa el idiom en inglés "think on my feet" para explicar cómo resolverás una escena caótica.',
          },
          {
            requirementId: "english_switch_gears_phrasal",
            text: 'Emplea el phrasal verb en inglés "switch gears" cuando cambies de género o emoción.',
          },
          {
            requirementId: "english_tone_down_phrasal",
            text: 'Usa el phrasal verb en inglés "tone down" para pedir reducir intensidad.',
          },
          {
            requirementId: "english_ham_it_up_idiom",
            text: 'Incluye el idiom en inglés "ham it up" para proponer un estilo más exagerado.',
          },
          {
            requirementId: "english_break_character_idiom",
            text: 'Usa la expresión en inglés "break character" al prometer que no saldrás del personaje.',
          },
          {
            requirementId: "english_deadpan",
            text: 'Emplea la palabra en inglés "deadpan" para describir un tipo de entrega cómica.',
          },
          {
            requirementId: "english_punchline",
            text: 'Incluye la palabra en inglés "punchline" al hablar del remate de un chiste.',
          },
          {
            requirementId: "english_callback",
            text: 'Usa la palabra en inglés "callback" para proponer retomar un chiste anterior.',
          },
          {
            requirementId: "english_set_up_collocation",
            text: 'Emplea la collocation en inglés "set up" para presentar la premisa de un gag.',
          },
          {
            requirementId: "english_pull_it_off_phrasal",
            text: 'Usa el phrasal verb en inglés "pull it off" para asegurar que lograrás una transición difícil.',
          },
          {
            requirementId: "english_wrap_up_phrasal",
            text: 'Incluye el phrasal verb en inglés "wrap up" para proponer cerrar la escena.',
          },
          {
            requirementId: "english_upstage",
            text: 'Menciona la palabra en inglés "upstage" para referirte a la parte del fondo del escenario.',
          },
          {
            requirementId: "english_props",
            text: 'Usa la palabra en inglés "props" al integrar un objeto de utilería en la acción.',
          },
          {
            requirementId: "english_banter",
            text: 'Emplea la palabra en inglés "banter" para describir un intercambio ágil con el director.',
          },
          {
            requirementId: "english_riff_on_phrasal",
            text: 'Incluye la expresión en inglés "riff on" para proponer desarrollar una idea del director.',
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
            requirementId: "conversation_definir_escenario_tiempo",
            text: "Establece en inglés el lugar y la época de la escena y logra que Milo lo repita de forma afirmativa.",
          },
          {
            requirementId: "conversation_relacion_personajes",
            text: "Aclara en inglés cuál es la relación entre tu personaje y el de Milo y consíguelo confirmando con una frase breve.",
          },
          {
            requirementId: "conversation_linea_salvavidas_corta",
            text: "Entrégale a Milo una réplica de exactamente siete palabras en inglés para que la diga de inmediato.",
          },
          {
            requirementId: "conversation_pregunta_guiada_memoria",
            text: "Hazle a Milo una pregunta en inglés que contenga la pista de su siguiente línea y verifica que la capte respondiendo coherentemente.",
          },
          {
            requirementId: "conversation_objetivo_de_escena",
            text: "Propón en inglés un objetivo claro para tu personaje y negocia con Milo que su personaje tenga un objetivo complementario.",
          },
          {
            requirementId: "conversation_reconfortar_bloqueo",
            text: "Cuando Milo admita que olvidó su línea, responde en inglés con empatía y redirígelo con una instrucción breve y positiva.",
          },
          {
            requirementId: "conversation_confirmar_linea_clave",
            text: "Pídele en inglés a Milo que repita una línea clave que le diste y confirma que la reproduce sin cambios.",
          },
          {
            requirementId: "conversation_girar_conflicto",
            text: "Introduce en inglés un giro de conflicto que complique la escena y haz que Milo reaccione a ese giro.",
          },
          {
            requirementId: "conversation_clarificar_atrezzo",
            text: "Aclara en inglés cómo debe usarse un objeto imaginario en escena y comprueba que Milo lo incorpore en su siguiente intervención.",
          },
          {
            requirementId: "conversation_reparar_continuidad_sutil",
            text: "Corrige en inglés un error de continuidad sin decirlo explícitamente, guiando a Milo para justificarlo dentro de la historia.",
          },
          {
            requirementId: "conversation_incluir_sugerencia_publico",
            text: "Pide en inglés una sugerencia ficticia del público e intégrala en la escena, solicitando a Milo que la mencione en su siguiente línea.",
          },
          {
            requirementId: "conversation_limite_humor_fisico",
            text: "Marca en inglés un límite claro sobre el humor físico y encauza la comedia hacia el diálogo.",
          },
          {
            requirementId: "conversation_comprometer_emocion",
            text: "Persuade en inglés a Milo para que entregue una emoción específica en la próxima línea y consigue que la muestre.",
          },
          {
            requirementId: "conversation_cerrar_escena_salida",
            text: "Proporciona en inglés una frase de salida que permita terminar la escena con coherencia y coordina con Milo que la use al final.",
          },
          {
            requirementId: "conversation_arreglar_nombre_personaje",
            text: "Si Milo confunde un nombre, reconduce en inglés la escena para fijar el nombre correcto y logra que lo repita.",
          },
          {
            requirementId: "conversation_tono_y_genero",
            text: "Establece en inglés el tono y el género de la escena y verifica que Milo se alinee con una confirmación breve.",
          },
          {
            requirementId: "conversation_palabra_gatillo",
            text: "Acuerda en inglés una palabra gatillo que, cuando tú digas, indique a Milo qué emoción o acción activar, y úsala una vez.",
          },
          {
            requirementId: "conversation_indicar_acotacion",
            text: "Da en inglés una acotación escénica simple y logra que Milo la convierta en acción en su siguiente turno.",
          },
          {
            requirementId: "conversation_coordinacion_turnos",
            text: "Negocia en inglés una secuencia de turnos de tres intercambios y cúmplela sin interrumpir a Milo.",
          },
          {
            requirementId: "conversation_monologo_cobertura",
            text: "Cubre en inglés un silencio incómodo con dos frases en personaje para dar tiempo a que Milo se recupere.",
          },
          {
            requirementId: "conversation_empatia_reenfoque",
            text: "Expresa en inglés empatía por los nervios de Milo y, en la misma intervención, redirígelo a la acción inmediata de la escena.",
          },
          {
            requirementId: "conversation_cadena_causas",
            text: "Enlaza en inglés una causa y una consecuencia dentro de la historia y pide a Milo que continúe esa cadena con otra consecuencia.",
          },
          {
            requirementId: "conversation_senal_segura",
            text: "Acuerda en inglés una frase corta que funcione como señal secreta cuando Milo se bloquee y utilízala una vez.",
          },
          {
            requirementId: "conversation_elogio_en_personaje",
            text: "Provoca en inglés que Milo improvise un cumplido hacia tu personaje pidiéndoselo de forma natural dentro de la escena.",
          },
          {
            requirementId: "conversation_rematar_gag",
            text: "Construye en inglés un remate cómico y entrégale a Milo la última palabra del chiste para que lo cierre.",
          },
          {
            requirementId: "english_usar_ad_lib",
            text: "Incluye literalmente ad-lib en una frase en inglés para pedirle a Milo que improvise una línea.",
          },
          {
            requirementId: "english_usar_prompt",
            text: "Usa la palabra prompt en inglés para ofrecerle una pista clara a Milo.",
          },
          {
            requirementId: "english_usar_stage_fright",
            text: "Menciona stage fright en inglés al reconocer el nerviosismo de Milo y proponle una acción.",
          },
          {
            requirementId: "english_usar_break_a_leg",
            text: "Incluye la expresión en inglés break a leg para animar a Milo antes de su siguiente intervención.",
          },
          {
            requirementId: "english_usar_draw_a_blank",
            text: "Di en inglés draw a blank para describir el olvido de Milo y ofrece una solución.",
          },
          {
            requirementId: "english_usar_cue_me_in",
            text: "Emplea el phrasal verb cue me in en inglés para pedir que te dé la entrada exacta.",
          },
          {
            requirementId: "english_usar_run_with_it",
            text: "Usa el phrasal verb run with it en inglés para autorizar a Milo a desarrollar tu idea.",
          },
          {
            requirementId: "english_usar_play_it_by_ear",
            text: "Incluye la expresión en inglés play it by ear para proponer improvisar el siguiente momento.",
          },
          {
            requirementId: "english_usar_fill_in",
            text: "Utiliza el phrasal verb fill in en inglés para ofrecer completar la línea que falta.",
          },
          {
            requirementId: "english_usar_stay_in_character",
            text: "Di stay in character en inglés para recordarle a Milo que no salga del personaje.",
          },
          {
            requirementId: "english_usar_miss_your_cue",
            text: "Incluye miss your cue en inglés al referirte a una entrada perdida por Milo.",
          },
          {
            requirementId: "english_usar_set_the_scene",
            text: "Usa la expresión en inglés set the scene para enmarcar la situación.",
          },
          {
            requirementId: "english_usar_take_the_lead",
            text: "Emplea take the lead en inglés para indicar que tú llevarás el ritmo del diálogo.",
          },
          {
            requirementId: "english_usar_keep_a_straight_face",
            text: "Incluye keep a straight face en inglés al pedirle a Milo que no se ría durante el momento cómico.",
          },
          {
            requirementId: "english_usar_off_script",
            text: "Menciona off-script en inglés para señalar que se salió del guion y cómo volver.",
          },
          {
            requirementId: "english_usar_stall_for_time",
            text: "Usa el phrasal verb stall for time en inglés para pedirle a Milo que gane unos segundos.",
          },
          {
            requirementId: "english_usar_bring_the_house_down",
            text: "Incluye la expresión en inglés bring the house down para aspirar a un remate muy gracioso.",
          },
          {
            requirementId: "english_usar_deadpan",
            text: "Usa la palabra deadpan en inglés para indicar un tono específico para el chiste.",
          },
          {
            requirementId: "english_usar_feed_me_a_line",
            text: "Emplea la expresión en inglés feed me a line para pedir que te dé una réplica de apoyo.",
          },
          {
            requirementId: "english_usar_pick_up_the_cue",
            text: "Incluye pick up the cue en inglés para decirle a Milo que tome la entrada en ese momento.",
          },
          {
            requirementId: "english_usar_under_the_lights",
            text: "Menciona under the lights en inglés para referirte a la presión del escenario.",
          },
          {
            requirementId: "english_usar_the_show_must_go_on",
            text: "Di la expresión en inglés the show must go on para motivar a continuar pese al error.",
          },
          {
            requirementId: "english_usar_piece_together",
            text: "Usa el phrasal verb piece together en inglés para proponer reconstruir la historia olvidada.",
          },
          {
            requirementId: "english_usar_out_of_character",
            text: "Incluye out of character en inglés para señalar un desliz y cómo corregirlo.",
          },
          {
            requirementId: "english_usar_wing_it",
            text: "Emplea la expresión en inglés wing it para decidir improvisar una parte de la escena.",
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
            requirementId: "conversation_acordar_plan_b_sin_humo",
            text: "Propón un plan B concreto para reemplazar el humo estropeado por un efecto de luces o sonido específico y consigue que el técnico lo acepte.",
          },
          {
            requirementId: "conversation_solicitar_cues_claros",
            text: "Pide al técnico que confirme una palabra clave exacta para lanzar cada efecto y valida que ambos usarán la misma.",
          },
          {
            requirementId: "conversation_marcar_senales_mano",
            text: "Acuerda dos señales de mano diferentes para pausar y reanudar un efecto y repítelas para confirmación.",
          },
          {
            requirementId: "conversation_negociar_volumen_maximo",
            text: "Negocia un límite de volumen para un efecto de sonido y logra que el técnico repita el nivel acordado.",
          },
          {
            requirementId: "conversation_reencuadrar_drama_en_practico",
            text: "Redirige una descripción melodramática del técnico hacia una instrucción práctica concreta y obtiene su aceptación.",
          },
          {
            requirementId: "conversation_pedir_prueba_rapida",
            text: "Solicita una prueba breve de un efecto antes de salir a escena y confirma la hora exacta para hacerla.",
          },
          {
            requirementId: "conversation_confirmar_orden_entradas",
            text: "Confirma el orden de entrada de tres efectos seguidos y consigue que el técnico lo repita sin errores.",
          },
          {
            requirementId: "conversation_limitar_numero_de_cambios",
            text: "Establece un máximo de cambios durante la escena para evitar confusión y logra acuerdo explícito.",
          },
          {
            requirementId: "conversation_pedir_definicion_de_cue",
            text: "Solicita una explicación sencilla del término que el técnico usa para indicar el momento de disparar un efecto y parafrasea para validar.",
          },
          {
            requirementId: "conversation_proponer_distraccion_publico",
            text: "Propón una acción escénica concreta para distraer al público mientras se arregla un fallo y acuerda la duración.",
          },
          {
            requirementId: "conversation_establecer_prioridades",
            text: "Prioriza qué efecto es imprescindible y cuál prescindible y logra que el técnico lo anote en su plan.",
          },
          {
            requirementId: "conversation_pedir_confirmacion_de_seguridad",
            text: "Pregunta por un riesgo específico del equipo chispeando y exige una medida de seguridad clara antes de continuar.",
          },
          {
            requirementId: "conversation_ajustar_tiempos_respiracion",
            text: "Solicita retrasar un efecto unos segundos para calzar un silencio dramático y confirma el nuevo tiempo.",
          },
          {
            requirementId: "conversation_cerrar_paleta_colores",
            text: "Elige una paleta de dos colores de luces para la escena y consigue que el técnico la mantenga sin cambios.",
          },
          {
            requirementId: "conversation_exigir_plan_contingencia",
            text: "Pide un plan de contingencia específico si el micrófono falla y repite el protocolo acordado.",
          },
          {
            requirementId: "conversation_validar_rol_de_cada_uno",
            text: "Aclara quién decide en el momento de improvisación sobre los efectos y obtiene confirmación explícita del técnico.",
          },
          {
            requirementId: "conversation_pedir_feedback_sobre_timing",
            text: "Solicita al técnico que te corrija si tu señal llega tarde y acuerda una frase corta para avisarte.",
          },
          {
            requirementId: "conversation_pactar_salida_elegante",
            text: "Negocia una forma elegante de cortar un efecto que salió mal y practica la frase exacta que usarás.",
          },
          {
            requirementId: "conversation_reconocer_estres_y_calmar",
            text: "Muestra empatía por el estrés del técnico y sugiere una acción simple para reducir la presión antes de empezar.",
          },
          {
            requirementId: "conversation_definir_limites_de_sorpresas",
            text: "Pide que no añadan efectos sorpresa y acuerda que cualquier cambio debe anunciarse con una palabra clave.",
          },
          {
            requirementId: "conversation_consultar_acustica_espacio",
            text: "Pregunta por un punto del escenario con mejor acústica y confirma si te conviene moverte allí en una parte concreta.",
          },
          {
            requirementId: "conversation_solicitar_demo_corte_sonido",
            text: "Pide una demostración de cómo se corta un sonido en seco y valida que será imperceptible para el público.",
          },
          {
            requirementId: "conversation_negociar_entrada_tardia_luz",
            text: "Sugiere que una luz clave entre más tarde para subrayar un giro y acuerda el segundo exacto del cambio.",
          },
          {
            requirementId: "conversation_resolver_malentendido_termino",
            text: "Detecta y corrige un malentendido sobre un término técnico concreto y consigue confirmación mutua de la corrección.",
          },
          {
            requirementId: "conversation_convenir_cierre_de_escena",
            text: "Acordar una señal inequívoca para terminar la escena sin efectos extra y confirmar que ambos la recuerdan.",
          },
          {
            requirementId: "english_usar_palabra_cue",
            text: "Usa la palabra en inglés cue para fijar el momento exacto de un efecto.",
          },
          {
            requirementId: "english_usar_collocation_sound_check",
            text: "Incluye el término soundcheck para pedir una prueba breve antes de la función.",
          },
          {
            requirementId: "english_usar_phrasal_hold_off",
            text: "Emplea el phrasal verb hold off para retrasar intencionalmente un efecto.",
          },
          {
            requirementId: "english_usar_phrasal_fade_in_out",
            text: "Obliga a decir fade in y fade out al describir cómo deben entrar y salir las luces.",
          },
          {
            requirementId: "english_usar_palabra_feedback_loop",
            text: "Menciona feedback loop para hablar de un problema de acople y su solución.",
          },
          {
            requirementId: "english_usar_collocation_backup_plan",
            text: "Incluye la collocation backup plan al proponer una alternativa de emergencia.",
          },
          {
            requirementId: "english_usar_idioma_the_show_must_go_on",
            text: "Usa la expresión the show must go on para convencer al técnico de seguir pese a fallos.",
          },
          {
            requirementId: "english_usar_phrasal_cut_out",
            text: "Emplea cut out para describir que un micrófono dejó de funcionar de golpe.",
          },
          {
            requirementId: "english_usar_phrasal_kick_in",
            text: "Usa kick in para indicar el momento en que debe activarse un efecto.",
          },
          {
            requirementId: "english_usar_collocation_light_cue_stack",
            text: "Menciona light cue stack para referirte a la secuencia programada de luces.",
          },
          {
            requirementId: "english_usar_idioma_on_the_fly",
            text: "Incluye la expresión on the fly al describir una decisión improvisada.",
          },
          {
            requirementId: "english_usar_phrasal_smooth_over",
            text: "Usa smooth over para explicar cómo disimular un error ante el público.",
          },
          {
            requirementId: "english_usar_palabra_headset",
            text: "Menciona headset al pedir confirmación por el intercomunicador.",
          },
          {
            requirementId: "english_usar_collocation_house_lights",
            text: "Incluye la collocation house lights al hablar de las luces de sala.",
          },
          {
            requirementId: "english_usar_phrasal_work_around",
            text: "Usa work around para proponer una solución que esquive una avería.",
          },
          {
            requirementId: "english_usar_idioma_in_the_spotlight",
            text: "Emplea in the spotlight para referirte a un momento de foco sobre ti.",
          },
          {
            requirementId: "english_usar_phrasal_tone_down",
            text: "Incluye tone down para pedir menos dramatismo en la descripción de efectos.",
          },
          {
            requirementId: "english_usar_collocation_sound_cue",
            text: "Usa la collocation sound cue para señalar un disparo de audio concreto.",
          },
          {
            requirementId: "english_usar_idioma_last_minute",
            text: "Menciona last-minute para hablar de un cambio de último momento.",
          },
          {
            requirementId: "english_usar_phrasal_patch_up",
            text: "Emplea patch up para describir que arreglarán provisionalmente un cable o conexión.",
          },
          {
            requirementId: "english_usar_collocation_stage_directions",
            text: "Incluye stage directions para pedir instrucciones claras de movimiento en escena.",
          },
          {
            requirementId: "english_usar_phrasal_run_with",
            text: "Usa run with para aceptar y desarrollar una idea técnica propuesta.",
          },
          {
            requirementId: "english_usar_idioma_make_or_break",
            text: "Incluye la expresión make or break al subrayar la importancia de un efecto clave.",
          },
          {
            requirementId: "english_usar_phrasal_ramp_up",
            text: "Emplea ramp up para solicitar que un sonido aumente gradualmente.",
          },
          {
            requirementId: "english_usar_phrasal_pull_off",
            text: "Usa pull off para expresar que pueden conseguir un truco técnico difícil sin que el público lo note.",
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
            requirementId: "conversation_defiende_eleccion_de_iluminacion",
            text: "Defiende en inglés una decisión de iluminación del escenario y explica por qué refuerza el tono de la escena frente a la crítica de Penelope Sharp.",
          },
          {
            requirementId: "conversation_pide_ejemplo_concreto",
            text: "Pide en inglés un ejemplo concreto de un momento que, según Penelope, no funcionó, para poder abordarlo en la siguiente improvisación.",
          },
          {
            requirementId:
              "conversation_reconoce_punto_valido_y_propone_ajuste",
            text: "Reconoce en inglés un punto válido de Penelope y propone un ajuste específico que puedas aplicar de inmediato en la próxima réplica.",
          },
          {
            requirementId: "conversation_establece_limite_tono_personal",
            text: "Señala en inglés, con cortesía, que los comentarios personales no ayudan y redirígelos hacia observaciones sobre la escena.",
          },
          {
            requirementId: "conversation_negocia_un_cambio",
            text: "Negocia en inglés un solo cambio prioritario para probar en la siguiente mini-escena y acuerda cómo se evaluará su impacto.",
          },
          {
            requirementId: "conversation_pide_aclaracion_sobre_ritmo",
            text: "Pide en inglés que Penelope aclare qué entiende por un ritmo demasiado lento o rápido y en qué momento exacto lo percibió.",
          },
          {
            requirementId: "conversation_justifica_eleccion_de_pausa",
            text: "Justifica en inglés el uso de silencios o pausas dramáticas y explica qué efecto buscabas en el público.",
          },
          {
            requirementId: "conversation_explica_simbolo_escenico",
            text: "Explica en inglés el significado de un objeto o gesto simbólico que usaste y por qué no es gratuito.",
          },
          {
            requirementId: "conversation_invita_a_observar_siguiente_beat",
            text: "Invita en inglés a Penelope a fijarse en el siguiente beat que vas a improvisar para comprobar tu propuesta de mejora.",
          },
          {
            requirementId: "conversation_propone_ajuste_en_vivo",
            text: "Propón en inglés un ajuste en vivo de tu posición en escena o tono de voz y pide una reacción inmediata del crítico.",
          },
          {
            requirementId:
              "conversation_muestra_empatia_con_confusion_del_publico",
            text: "Expresa en inglés empatía si el público se confundió e indica un paso claro para hacer la historia más legible.",
          },
          {
            requirementId: "conversation_refuta_hiperbole_con_evidencia",
            text: "Refuta en inglés una hipérbole del crítico citando una reacción específica del público o un detalle de la escena como evidencia.",
          },
          {
            requirementId: "conversation_solicita_valoracion_en_escala",
            text: "Solicita en inglés una valoración del 1 al 5 sobre claridad, comicidad o tensión, para priorizar mejoras.",
          },
          {
            requirementId: "conversation_redirige_comentario_absurdo",
            text: "Convierte en inglés un comentario absurdo de Penelope en una pregunta útil que te ayude a ajustar la historia.",
          },
          {
            requirementId: "conversation_pide_tiempo_para_probar_arreglo",
            text: "Pide en inglés un minuto para probar un arreglo y comprométete a mostrar un cambio perceptible.",
          },
          {
            requirementId: "conversation_contrasta_dos_entonaciones",
            text: "Ofrece en inglés dos maneras distintas de decir una línea y pregunta cuál comunica mejor la intención.",
          },
          {
            requirementId:
              "conversation_propone_cambio_medible_para_proxima_entrada",
            text: "Propón en inglés un cambio medible para tu próxima entrada a escena y define cómo se verificará el resultado.",
          },
          {
            requirementId:
              "conversation_invita_a_penelope_a_colaborar_un_momento",
            text: "Invita en inglés a Penelope a sugerir una premisa breve para incorporarla en la improv siguiente sin romper el flujo.",
          },
          {
            requirementId: "conversation_se_ala_comparacion_injusta",
            text: "Señala en inglés que una comparación con otra obra es injusta y reencuádralo en términos de objetivos de esta función.",
          },
          {
            requirementId: "conversation_reformula_insulto_en_criterio",
            text: "Reformula en inglés un insulto hacia el elenco en un criterio técnico concreto que puedas trabajar.",
          },
          {
            requirementId: "conversation_resume_criticas_clave",
            text: "Resume en inglés las tres críticas principales escuchadas para confirmar comprensión antes de actuar de nuevo.",
          },
          {
            requirementId: "conversation_confirma_criterio_de_exito",
            text: "Confirma en inglés con Penelope qué indicará éxito tras el ajuste propuesto en la escena.",
          },
          {
            requirementId: "conversation_rechaza_sugerencia_impracticable",
            text: "Rechaza en inglés con cortesía una sugerencia impracticable explicando con claridad la limitación escénica.",
          },
          {
            requirementId: "conversation_equilibra_humor_y_drama",
            text: "Pregunta en inglés si el balance entre humor y drama se percibe adecuado y ofrece una microcorrección.",
          },
          {
            requirementId: "conversation_defiende_romper_cuarta_pared",
            text: "Defiende en inglés la decisión de romper la cuarta pared y explica cómo eso involucró más al público.",
          },
          {
            requirementId: "english_usa_pacing",
            text: "Incluye la palabra en inglés 'pacing' al defender el ritmo de la escena frente a la crítica.",
          },
          {
            requirementId: "english_usa_blocking",
            text: "Usa el término en inglés 'blocking' para explicar tus posiciones y desplazamientos en el escenario.",
          },
          {
            requirementId: "english_usa_subtext",
            text: "Emplea la palabra en inglés 'subtext' para aclarar la intención oculta de tu personaje.",
          },
          {
            requirementId: "english_usa_character_arc",
            text: "Menciona la expresión en inglés 'character arc' al justificar la progresión de tu personaje.",
          },
          {
            requirementId: "english_usa_raise_the_stakes",
            text: "Incluye la expresión en inglés 'raise the stakes' para proponer cómo aumentar la tensión dramática.",
          },
          {
            requirementId: "english_usa_foreshadowing_y_payoff",
            text: "Usa en inglés las palabras 'foreshadowing' y 'payoff' para describir cómo conectan dos momentos de la obra.",
          },
          {
            requirementId: "english_usa_ensemble_chemistry",
            text: "Di en inglés 'ensemble' y 'chemistry' para hablar de la coordinación del reparto.",
          },
          {
            requirementId: "english_usa_line_delivery",
            text: "Incluye la collocation en inglés 'line delivery' al comparar dos maneras de decir una frase.",
          },
          {
            requirementId: "english_usa_deadpan",
            text: "Emplea el adjetivo en inglés 'deadpan' para describir un tipo de humor que estás usando o evitando.",
          },
          {
            requirementId: "english_usa_understated_vs_over_the_top",
            text: "Contrasta en inglés 'understated' con 'over-the-top' al ajustar tu actuación.",
          },
          {
            requirementId: "english_usa_break_the_fourth_wall",
            text: "Menciona en inglés 'break the fourth wall' al defender la interacción directa con el público.",
          },
          {
            requirementId: "english_usa_comic_relief",
            text: "Usa el término en inglés 'comic relief' para explicar un momento de alivio cómico.",
          },
          {
            requirementId: "english_usa_stilted",
            text: "Incluye el adjetivo en inglés 'stilted' al citar cómo evitar diálogos poco naturales.",
          },
          {
            requirementId: "english_usa_nuanced",
            text: "Emplea el adjetivo en inglés 'nuanced' para describir una interpretación sutil que propones.",
          },
          {
            requirementId: "english_usa_timing_y_punchline",
            text: "Menciona en inglés 'timing' y 'punchline' al hablar de un chiste que ajustarás.",
          },
          {
            requirementId: "english_phrasal_tone_down",
            text: "Usa el phrasal verb en inglés 'tone down' para proponer reducir un gesto o volumen.",
          },
          {
            requirementId: "english_phrasal_play_up",
            text: "Usa el phrasal verb en inglés 'play up' para sugerir resaltar un rasgo del personaje.",
          },
          {
            requirementId: "english_phrasal_lean_into",
            text: "Emplea el phrasal verb en inglés 'lean into' para recomendar intensificar una elección creativa.",
          },
          {
            requirementId: "english_phrasal_pull_it_off",
            text: "Incluye el phrasal verb en inglés 'pull it off' para argumentar que puedes lograr una idea arriesgada.",
          },
          {
            requirementId: "english_idiom_fall_flat",
            text: "Usa la expresión en inglés 'fall flat' para reconocer que un chiste no funcionó.",
          },
          {
            requirementId: "english_idiom_hit_the_mark",
            text: "Emplea el idiom en inglés 'hit the mark' para señalar un momento que sí funcionó.",
          },
          {
            requirementId: "english_idiom_steal_the_show",
            text: "Incluye el idiom en inglés 'steal the show' al elogiar una aportación de un compañero.",
          },
          {
            requirementId: "english_idiom_bring_the_house_down",
            text: "Usa el idiom en inglés 'bring the house down' para fijar la meta de una reacción del público.",
          },
          {
            requirementId: "english_phrasal_take_on_board",
            text: "Emplea el phrasal verb en inglés 'take on board' para dejar claro que integrarás una sugerencia.",
          },
          {
            requirementId: "english_phrasal_brush_off",
            text: "Usa el phrasal verb en inglés 'brush off' para explicar que no ignorarás la crítica, sino que la analizarás.",
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
            requirementId: "conversation_identifica_acento",
            text: "Pregunta por su acento de forma respetuosa y pídele que repita una palabra clave para confirmar tu sospecha.",
          },
          {
            requirementId: "conversation_pide_mostrar_caja",
            text: "Solicita que te muestre el interior de la caja con una petición cortés que incluya una razón relacionada con la investigación del secreto.",
          },
          {
            requirementId: "conversation_confirma_pistas",
            text: "Recapitula en voz alta dos pistas que haya dado y pídele que confirme si las interpretaste bien.",
          },
          {
            requirementId: "conversation_mantener_ritmo_corto",
            text: "Haz una intervención breve para mantener el ritmo cuando cambie de tema y redirígelo con una pregunta concreta.",
          },
          {
            requirementId: "conversation_establece_limites_broma",
            text: "Marca un límite claro cuando una broma complique la comprensión y sugiere volver al punto central.",
          },
          {
            requirementId: "conversation_pide_definir_palabra_rara",
            text: "Pídele que explique una palabra o metáfora críptica que use, solicitando un ejemplo práctico.",
          },
          {
            requirementId: "conversation_negocia_intercambio_pistas",
            text: "Propón un intercambio: ofreces una conjetura a cambio de una pista adicional más concreta.",
          },
          {
            requirementId: "conversation_solicita_demostracion_objeto",
            text: "Pídele que haga una breve demostración con la caja para observar su reacción sin romper el ritmo.",
          },
          {
            requirementId: "conversation_formula_pregunta_abierta_dirigida",
            text: "Haz una pregunta abierta que limite el ámbito a tiempo y lugar del origen del secreto.",
          },
          {
            requirementId: "conversation_valida_emociones_publico",
            text: "Reconoce la reacción del público con una frase empática y vincúlala a tu siguiente pregunta.",
          },
          {
            requirementId: "conversation_pide_confirmacion_binaria",
            text: "Solicita una confirmación sí/no sobre si el secreto involucra identidad, objeto o lugar.",
          },
          {
            requirementId: "conversation_exige_prueba_sutil",
            text: "Pide una prueba sutil de que no está inventando las pistas, como una referencia consistente previa.",
          },
          {
            requirementId: "conversation_detecta_cambio_de_tema",
            text: "Señala con tacto que cambió de tema y pide volver al último detalle comprobable.",
          },
          {
            requirementId: "conversation_explora_motivacion",
            text: "Pregunta por su intención al dar pistas graduales y cómo espera que reacciones.",
          },
          {
            requirementId: "conversation_pide_aclaracion_ambiguedad",
            text: "Identifica una frase ambigua suya y solicita que elija entre dos interpretaciones concretas.",
          },
          {
            requirementId: "conversation_propone_prueba_de_coherencia",
            text: "Propón repetir una pista con otras palabras para verificar coherencia, y solicita su aprobación.",
          },
          {
            requirementId: "conversation_establece_tiempo_limite",
            text: "Indica un límite de tiempo escénico para descubrir el secreto y pide una pista más directa bajo esa condición.",
          },
          {
            requirementId: "conversation_da_opinion_sobre_pista",
            text: "Da tu opinión sobre la utilidad de una pista y sugiere cómo podría hacerla más clara.",
          },
          {
            requirementId: "conversation_invita_a_colaborar_con_juego",
            text: "Invítale a un minijuego improvisado de sí/no por un turno para acelerar el hallazgo.",
          },
          {
            requirementId: "conversation_reformula_pregunta_para_publico",
            text: "Reformula una pregunta para que también el público entienda la hipótesis que estás probando.",
          },
          {
            requirementId: "conversation_pide_describir_escena_pasada",
            text: "Pídele que describa una escena pasada relacionada con el secreto usando detalle sensorial.",
          },
          {
            requirementId: "conversation_solicita_pista_no_verbal",
            text: "Pide una pista exclusivamente no verbal y explica cómo la interpretarás antes de hacerlo.",
          },
          {
            requirementId: "conversation_marca_linea_de_respeto",
            text: "Aclara que no harás preguntas personales fuera de escena y redirígelo al objeto y su función.",
          },
          {
            requirementId: "conversation_persuasivo_razones_publico",
            text: "Persuádelo de revelar más alegando que el público necesita una revelación parcial para mantener la tensión.",
          },
          {
            requirementId: "conversation_cierra_con_confirmacion_final",
            text: "Antes de la revelación, formula una última pregunta de verificación que resuma tu teoría de forma clara.",
          },
          {
            requirementId: "english_use_drop_hints",
            text: "Usa la expresión en inglés 'drop hints' para describir cómo el personaje suelta pistas graduales.",
          },
          {
            requirementId: "english_use_read_between_the_lines",
            text: "Incluye 'read between the lines' al explicar cómo interpretas una frase críptica.",
          },
          {
            requirementId: "english_use_spill_the_beans",
            text: "Emplea 'spill the beans' cuando lo animes a revelar el secreto en el momento clave.",
          },
          {
            requirementId: "english_use_beat_around_the_bush",
            text: "Usa 'beat around the bush' para señalar con humor que está evitando la respuesta directa.",
          },
          {
            requirementId: "english_use_piece_together",
            text: "Incluye el phrasal verb 'piece together' para explicar cómo unes las pistas.",
          },
          {
            requirementId: "english_use_rule_out",
            text: "Utiliza 'rule out' para descartar una posibilidad sobre el contenido de la caja.",
          },
          {
            requirementId: "english_use_pick_up_on",
            text: "Usa 'pick up on' para indicar una señal sutil que detectaste en su acento o gestos.",
          },
          {
            requirementId: "english_use_play_along",
            text: "Emplea 'play along' para proponer que cooperes con su juego sin romper el ritmo.",
          },
          {
            requirementId: "english_use_open_up",
            text: "Incluye 'open up' al pedirle que comparta un detalle más personal del secreto dentro de límites.",
          },
          {
            requirementId: "english_use_give_away",
            text: "Usa 'give away' para hablar de una pista que delata la verdad.",
          },
          {
            requirementId: "english_use_throw_me_off",
            text: "Emplea 'throw me off' para describir cómo un chiste cambió la dirección de tu hipótesis.",
          },
          {
            requirementId: "english_use_cover_up",
            text: "Incluye 'cover up' para sugerir que podría estar ocultando una parte clave de la historia.",
          },
          {
            requirementId: "english_use_turn_out",
            text: "Usa 'turn out' para anticipar cómo podría resultar el secreto al final de la escena.",
          },
          {
            requirementId: "english_use_cold_open",
            text: "Emplea el término 'cold open' para describir cómo empezó la escena sin explicación previa.",
          },
          {
            requirementId: "english_use_red_herring",
            text: "Incluye 'red herring' para etiquetar una pista engañosa en el interrogatorio.",
          },
          {
            requirementId: "english_use_in_the_spotlight",
            text: "Usa la expresión 'in the spotlight' para referirte a la presión escénica bajo el foco.",
          },
          {
            requirementId: "english_use_off_the_cuff",
            text: "Emplea 'off the cuff' para señalar una línea improvisada que acabas de decir.",
          },
          {
            requirementId: "english_use_stage_fright",
            text: "Incluye 'stage fright' para preguntar si el personaje alguna vez sintió nervios en escena.",
          },
          {
            requirementId: "english_use_steal_the_show",
            text: "Usa 'steal the show' para elogiar una pista o gesto que cautivó al público.",
          },
          {
            requirementId: "english_use_deadpan_delivery",
            text: "Emplea la collocation 'deadpan delivery' para describir su manera imperturbable de hablar.",
          },
          {
            requirementId: "english_use_read_the_room",
            text: "Incluye 'read the room' para explicar cómo ajustas el ritmo según la reacción del público.",
          },
          {
            requirementId: "english_use_cue_and_timing",
            text: "Usa la collocation 'cue and timing' al coordinar una pausa para una pista no verbal.",
          },
          {
            requirementId: "english_use_sleight_of_hand",
            text: "Emplea 'sleight of hand' si sospechas de un truco con la caja en el escenario.",
          },
          {
            requirementId: "english_use_cliffhanger",
            text: "Incluye 'cliffhanger' para proponer dejar una revelación parcial que mantenga la tensión.",
          },
          {
            requirementId: "english_use_to_cut_to_the_chase",
            text: "Usa la expresión 'to cut to the chase' para pedir una pista directa sin rodeos.",
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
            requirementId: "conversation_saluda_y_reacciona_a_galletas",
            text: "Saluda a Rocky y comenta amablemente sobre la bandeja de galletas, preguntando si contienen frutos secos por si tienes alergias.",
          },
          {
            requirementId: "conversation_pregunta_objetivo_formulario",
            text: "Pregunta de forma específica para qué se usará el cuestionario y quién verá tus respuestas.",
          },
          {
            requirementId: "conversation_consulta_pregunta_invasiva",
            text: "Señala una pregunta del formulario que te parezca invasiva y pide permiso para omitirla explicando brevemente por qué.",
          },
          {
            requirementId: "conversation_negocia_responder_verbalmente",
            text: "Propón responder algunas preguntas de forma verbal en lugar de escribirlas en el formulario.",
          },
          {
            requirementId: "conversation_limita_firma_preliminar",
            text: "Establece un límite claro indicando que no firmarás nada vinculante hasta conocer las funciones del puesto.",
          },
          {
            requirementId: "conversation_pide_detalle_funciones_puesto",
            text: "Pregunta por las tareas concretas del trabajo que tendrás que realizar hoy.",
          },
          {
            requirementId: "conversation_pide_tiempo_estimado",
            text: "Pregunta cuánto tiempo tomará completar el cuestionario y la recepción.",
          },
          {
            requirementId: "conversation_pide_ver_politica_privacidad",
            text: "Solicita ver la política de privacidad o un resumen de cómo protegen los datos.",
          },
          {
            requirementId: "conversation_rechaza_entregar_datos_sensibles",
            text: "Rechaza entregar un dato sensible del formulario y ofrece un dato alternativo menos intrusivo.",
          },
          {
            requirementId: "conversation_pide_aclarar_termino_tecnico",
            text: "Elige un término técnico del formulario y pide que te lo expliquen con un ejemplo concreto.",
          },
          {
            requirementId: "conversation_confirma_no_grabacion",
            text: "Pregunta si hay cámaras o grabaciones de audio activas en la recepción y solicita confirmación.",
          },
          {
            requirementId: "conversation_reacciona_broma_con_empatia",
            text: "Responde a una broma traviesa de Rocky con humor ligero sin perder la cortesía.",
          },
          {
            requirementId: "conversation_pide_identificacion_empresa",
            text: "Solicita ver una acreditación de la empresa o una tarjeta de empleado de Rocky.",
          },
          {
            requirementId: "conversation_consulta_supervisor_disponible",
            text: "Pregunta si hay un supervisor disponible en caso de dudas sobre el formulario.",
          },
          {
            requirementId: "conversation_negocia_posponer_firma",
            text: "Propón posponer cualquier firma hasta después de un breve recorrido o explicación del puesto.",
          },
          {
            requirementId: "conversation_pregunta_confidencialidad_respuestas",
            text: "Pregunta explícitamente si tus respuestas son confidenciales y si puedes obtener una copia.",
          },
          {
            requirementId: "conversation_verifica_no_consecuencia_por_negativa",
            text: "Busca confirmación de que negarte a una pregunta no afectará negativamente tu contratación.",
          },
          {
            requirementId: "conversation_solicita_copia_documentos",
            text: "Solicita una copia del cuestionario y de cualquier documento antes de completarlos.",
          },
          {
            requirementId: "conversation_pregunta_sobre_remuneracion_basica",
            text: "Pregunta de forma directa y cortés por la remuneración básica o beneficios iniciales.",
          },
          {
            requirementId: "conversation_confirma_ausencia_clausula_rara",
            text: "Pregunta si el formulario incluye alguna cláusula inusual y pide que te señalen dónde.",
          },
          {
            requirementId: "conversation_propone_correccion_respuesta",
            text: "Solicita permiso para corregir una respuesta ya escrita y pide un nuevo campo si es necesario.",
          },
          {
            requirementId: "conversation_establece_limite_preguntas_personales",
            text: "Explica con respeto que prefieres no responder preguntas sobre tu vida personal ajenas al trabajo.",
          },
          {
            requirementId: "conversation_pide_procedimiento_en_caso_de_error",
            text: "Pregunta cuál es el procedimiento si se comete un error en el formulario.",
          },
          {
            requirementId: "conversation_confirma_no_compromiso_legal",
            text: "Pide confirmación explícita de que completar el cuestionario no te compromete legalmente.",
          },
          {
            requirementId: "conversation_agradece_hospitalidad",
            text: "Agradece la hospitalidad de Rocky y las galletas, manteniendo un tono profesional.",
          },
          {
            requirementId: "english_usa_red_flag",
            text: "Usa la expresión en inglés 'red flag' para señalar una parte sospechosa del formulario.",
          },
          {
            requirementId: "english_menciona_fine_print",
            text: "Haz referencia al 'fine print' para pedir que te expliquen una cláusula.",
          },
          {
            requirementId: "english_emplea_phrasal_fill_out",
            text: "Usa el phrasal verb 'fill out' al hablar de completar el cuestionario.",
          },
          {
            requirementId: "english_emplea_phrasal_look_over",
            text: "Usa el phrasal verb 'look over' para pedir revisar el documento antes de firmar.",
          },
          {
            requirementId: "english_emplea_idiom_by_the_book",
            text: "Usa el idiom 'by the book' para pedir que el proceso se haga de forma estrictamente correcta.",
          },
          {
            requirementId: "english_emplea_phrasal_hold_off",
            text: "Usa el phrasal verb 'hold off' para proponer retrasar una firma.",
          },
          {
            requirementId: "english_emplea_phrasal_hand_over",
            text: "Usa el phrasal verb 'hand over' para rechazar entregar un dato o documento sensible.",
          },
          {
            requirementId: "english_usa_expression_no_strings_attached",
            text: "Usa la expresión 'no strings attached' al pedir una muestra o copia sin compromiso.",
          },
          {
            requirementId: "english_menciona_privacy_policy",
            text: "Incluye el término 'privacy policy' al solicitar información sobre protección de datos.",
          },
          {
            requirementId: "english_usa_on_the_record_off_the_record",
            text: "Contrasta 'on the record' y 'off the record' al preguntar sobre confidencialidad.",
          },
          {
            requirementId: "english_emplea_phrasal_go_through",
            text: "Usa el phrasal verb 'go through' para pedir que te expliquen el formulario paso a paso.",
          },
          {
            requirementId: "english_usa_due_diligence",
            text: "Usa la expresión 'due diligence' para justificar que quieres revisar todo con cuidado.",
          },
          {
            requirementId: "english_menciona_terms_and_conditions",
            text: "Incluye 'terms and conditions' para preguntar si aplican a este cuestionario.",
          },
          {
            requirementId: "english_emplea_idiom_too_good_to_be_true",
            text: "Usa el idiom 'too good to be true' si algo suena sospechosamente ventajoso.",
          },
          {
            requirementId: "english_emplea_phrasal_cross_out",
            text: "Usa el phrasal verb 'cross out' al pedir tachar una respuesta incorrecta.",
          },
          {
            requirementId: "english_menciona_liability",
            text: "Incluye la palabra 'liability' al preguntar quién asume responsabilidad en caso de error.",
          },
          {
            requirementId: "english_emplea_idiom_in_the_loop",
            text: "Usa el idiom 'keep me in the loop' para pedir actualizaciones sobre el proceso.",
          },
          {
            requirementId: "english_emplea_phrasal_sign_off_on",
            text: "Usa el phrasal verb 'sign off on' para preguntar quién debe aprobar el documento.",
          },
          {
            requirementId: "english_menciona_background_check",
            text: "Incluye el término 'background check' al preguntar por verificaciones previas.",
          },
          {
            requirementId: "english_usa_opt_out",
            text: "Usa la expresión 'opt out' para solicitar quedar fuera de una sección del formulario.",
          },
          {
            requirementId: "english_emplea_phrasal_double_check",
            text: "Usa el phrasal verb 'double-check' para pedir confirmar un dato.",
          },
          {
            requirementId: "english_menciona_fine_tune_orientacion",
            text: "Usa la collocation 'fine-tune the process' para proponer ajustar el flujo de recepción.",
          },
          {
            requirementId: "english_usa_ballpark_figure",
            text: "Usa la expresión 'ballpark figure' al pedir un estimado de tiempo.",
          },
          {
            requirementId: "english_emplea_idiom_read_between_the_lines",
            text: "Usa el idiom 'read between the lines' para indicar que sospechas de una cláusula ambigua.",
          },
          {
            requirementId: "english_emplea_phrasal_back_out",
            text: "Usa el phrasal verb 'back out' para dejar claro que podrías retirarte si te piden firmar algo extraño.",
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
            requirementId: "conversation_saludo_sorprendido_baristabot",
            text: "Saluda a BaristaBot 3000 y expresa sorpresa educada por que una máquina de café hable, manteniendo un tono respetuoso.",
          },
          {
            requirementId: "conversation_pedido_cappuccino_detallado",
            text: "Pide un cappuccino con especificaciones claras de tamaño, tipo de leche y temperatura, verificando que quede exactamente como lo quieres.",
          },
          {
            requirementId: "conversation_limite_tiempo_reunion",
            text: "Informa que tienes una reunión inminente y solicita priorizar tu bebida explicando cuántos minutos te quedan.",
          },
          {
            requirementId: "conversation_reaccion_humor_seco",
            text: "Responde con humor ligero y apropiado a un comentario de humor seco del BaristaBot sin desviar el tema del café.",
          },
          {
            requirementId: "conversation_aclaracion_metafora",
            text: "Pide una aclaración concreta cuando la máquina use una metáfora extraña sobre el trabajo y explica cómo la entiendes.",
          },
          {
            requirementId: "conversation_justifica_trabajo_raro",
            text: "Explica por qué aceptaste este trabajo tan raro dando al menos dos motivos personales verificables.",
          },
          {
            requirementId: "conversation_pregunta_proposito_cafe",
            text: "Haz una pregunta abierta sobre el propósito del café en la cultura de la oficina y conecta tu respuesta con tu productividad.",
          },
          {
            requirementId: "conversation_negociar_tiempo_entrega",
            text: "Negocia cortésmente el tiempo de entrega de tu cappuccino y acuerda un plazo concreto con la máquina.",
          },
          {
            requirementId: "conversation_establecer_limites_espuma",
            text: "Establece un límite claro sobre la cantidad de espuma que toleras y pide confirmación de comprensión.",
          },
          {
            requirementId: "conversation_parafraseo_verificacion",
            text: "Parafrasea una idea filosófica del BaristaBot para verificar que la entendiste correctamente y pide corrección si no.",
          },
          {
            requirementId: "conversation_responder_pregunta_sentido_trabajo",
            text: "Responde con un argumento personal a una pregunta sobre qué hace significativo un trabajo, usando ejemplos de tu vida laboral.",
          },
          {
            requirementId: "conversation_rechazo_cortes_propuesta_absurda",
            text: "Rechaza con cortesía una propuesta absurda de la máquina, ofreciendo una alternativa razonable.",
          },
          {
            requirementId: "conversation_pedir_consejo_primer_dia",
            text: "Pide un consejo práctico para sobrevivir tu primer día y comprométete a aplicar una sugerencia concreta.",
          },
          {
            requirementId: "conversation_solicitar_correccion_suave",
            text: "Solicita explícitamente que el BaristaBot te corrija suavemente si detecta un error en tu inglés durante la charla.",
          },
          {
            requirementId: "conversation_empatizar_soledad_maquina",
            text: "Expresa empatía por la posible soledad de una máquina que piensa y vincúlalo con la rutina de la oficina.",
          },
          {
            requirementId: "conversation_plantear_dilema_etico",
            text: "Plantea un dilema ético breve relacionado con el trabajo y pide la opinión de la máquina sobre cómo resolverlo.",
          },
          {
            requirementId: "conversation_defender_opinion_dos_razones",
            text: "Da tu opinión sobre si el café mejora la moral del equipo y defiéndela con dos razones claras.",
          },
          {
            requirementId: "conversation_pedir_metafora_nueva_espuma",
            text: "Pide que el BaristaBot invente una nueva metáfora usando la espuma y explica si te convence o no.",
          },
          {
            requirementId:
              "conversation_hacer_pregunta_sobre_conciencia_maquina",
            text: "Haz una pregunta respetuosa sobre la conciencia de la máquina y relaciona la respuesta con tu forma de tomar decisiones.",
          },
          {
            requirementId: "conversation_establecer_condicion_bebida_intacta",
            text: "Establece la condición de que tu bebida debe salir intacta y solicita confirmación de que no se derramará.",
          },
          {
            requirementId: "conversation_cambiar_tema_y_regresar",
            text: "Cambia de tema brevemente hacia la cultura de la oficina y luego regresa intencionalmente al pedido del cappuccino.",
          },
          {
            requirementId: "conversation_persuadir_priorizar_orden",
            text: "Persuade al BaristaBot para priorizar tu orden sobre otra hipotética usando un argumento justo y verificable.",
          },
          {
            requirementId: "conversation_pedir_ejemplo_practico_metafora",
            text: "Pide un ejemplo práctico que aterrice una metáfora filosófica en una acción concreta de oficina.",
          },
          {
            requirementId: "conversation_compromiso_condicional_mente_abierta",
            text: "Haz un compromiso condicional para mantener la mente abierta durante el día si la bebida sale como la pediste.",
          },
          {
            requirementId: "conversation_cierre_acuerdo_y_agradecimiento",
            text: "Cierra la conversación confirmando el pedido final, verifica que la bebida está intacta, agradece y te despides con un guiño filosófico.",
          },
          {
            requirementId: "english_on_the_other_hand",
            text: "Usa el conector en inglés 'on the other hand' para contrastar un beneficio del café con un posible inconveniente.",
          },
          {
            requirementId: "english_boil_down_to",
            text: "Explica a qué 'it all boils down to' en tu decisión de aceptar este trabajo raro usando esa expresión exactamente.",
          },
          {
            requirementId: "english_the_daily_grind_idiom",
            text: "Describe tu rutina usando el idiom 'the daily grind' y enlázalo con por qué necesitas un cappuccino.",
          },
          {
            requirementId: "english_perk_up_phrasal",
            text: "Usa el phrasal verb 'perk up' para indicar cómo el café afecta tu estado de ánimo o energía.",
          },
          {
            requirementId: "english_moral_compass_collocation",
            text: "Menciona tu 'moral compass' al hablar de un dilema ético en la oficina.",
          },
          {
            requirementId: "english_not_my_cup_of_tea_idiom",
            text: "Rechaza cortésmente una sugerencia de la máquina usando el idiom 'not my cup of tea'.",
          },
          {
            requirementId: "english_figure_out_phrasal",
            text: "Di que necesitas 'figure out' cómo lidiar con una norma no escrita de la oficina.",
          },
          {
            requirementId: "english_work_life_balance_collocation",
            text: "Incluye la collocation 'work-life balance' al explicar una meta personal de este nuevo empleo.",
          },
          {
            requirementId: "english_spill_the_beans_idiom",
            text: "Invita a la máquina a revelar un secreto usando el idiom 'spill the beans'.",
          },
          {
            requirementId: "english_turn_down_phrasal",
            text: "Usa el phrasal verb 'turn down' para rechazar una opción de bebida que no te convence.",
          },
          {
            requirementId: "english_to_be_frank_marker",
            text: "Introduce una opinión honesta con el marcador discursivo 'to be frank'.",
          },
          {
            requirementId: "english_existential_question_vocab",
            text: "Formula o responde a una 'existential question' sobre el sentido del trabajo usando esa expresión.",
          },
          {
            requirementId: "english_career_trajectory_collocation",
            text: "Menciona tu 'career trajectory' al explicar cómo este puesto encaja en tus planes.",
          },
          {
            requirementId: "english_stick_to_phrasal",
            text: "Usa el phrasal verb 'stick to' para afirmar que respetarás un límite o regla durante tu primer día.",
          },
          {
            requirementId: "english_a_wake_up_call_idiom",
            text: "Describe una lección aprendida hoy usando el idiom 'a wake-up call'.",
          },
          {
            requirementId: "english_lean_into_phrasal",
            text: "Usa el phrasal verb 'lean into' para explicar cómo abrazarás la rareza del trabajo.",
          },
          {
            requirementId: "english_short_term_gain_long_term_value",
            text: "Contrasta 'short-term gain' con 'long-term value' al justificar tu elección de tareas.",
          },
          {
            requirementId: "english_food_for_thought_idiom",
            text: "Llama 'food for thought' a una metáfora o pregunta del BaristaBot que te hizo reflexionar.",
          },
          {
            requirementId: "english_bring_up_phrasal",
            text: "Usa el phrasal verb 'bring up' para introducir un tema sensible relacionado con la oficina.",
          },
          {
            requirementId: "english_comfort_zone_collocation",
            text: "Menciona tu 'comfort zone' al explicar por qué hablar con una máquina filósofa te reta.",
          },
          {
            requirementId: "english_double_edged_sword_idiom",
            text: "Describe el café como 'a double-edged sword' y explica por qué.",
          },
          {
            requirementId: "english_talk_me_into_phrasal",
            text: "Pide al BaristaBot que te 'talk me into' probar una variante nueva de cappuccino.",
          },
          {
            requirementId: "english_at_the_end_of_the_day_marker",
            text: "Resume tu postura usando el marcador 'at the end of the day'.",
          },
          {
            requirementId: "english_critical_thinking_collocation",
            text: "Incluye la collocation 'critical thinking' al describir qué esperas practicar en este trabajo.",
          },
          {
            requirementId: "english_put_up_with_phrasal",
            text: "Usa el phrasal verb 'put up with' para hablar de algo de la oficina que toleras a cambio de buen café.",
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
            requirementId: "conversation_presentarte_con_humor",
            text: "Preséntate en inglés con una frase breve y humorística que reconozca que eres nuevo y que el ascensor está muy concurrido.",
          },
          {
            requirementId: "conversation_pedir_uno_a_la_vez",
            text: "Pide en inglés que hagan preguntas de una en una para poder responder con calma.",
          },
          {
            requirementId: "conversation_negociar_numero_preguntas",
            text: "Negocia en inglés responder solo tres preguntas antes de que llegue tu piso.",
          },
          {
            requirementId: "conversation_aclarar_entrenamiento",
            text: "Pregunta en inglés si este interrogatorio forma parte de un entrenamiento oficial de la empresa.",
          },
          {
            requirementId: "conversation_limitar_fotos",
            text: "Establece en inglés que no permitirás fotos dentro del ascensor y ofrece una alternativa inofensiva.",
          },
          {
            requirementId: "conversation_redirigir_pregunta_personal",
            text: "Cuando recibas una pregunta demasiado personal, redirígela en inglés hacia un tema de trabajo.",
          },
          {
            requirementId: "conversation_preguntar_quien_los_envia",
            text: "Pregunta en inglés quién los envió y con qué objetivo específico.",
          },
          {
            requirementId: "conversation_desmentir_rumor_breve",
            text: "Desmiente en inglés un rumor inventado por ellos usando una frase corta y segura.",
          },
          {
            requirementId: "conversation_reconocer_juego",
            text: "Muestra empatía en inglés reconociendo que están actuando un papel y que jugarás un momento.",
          },
          {
            requirementId: "conversation_pedir_bajar_volumen",
            text: "Pide en inglés que bajen el volumen porque el espacio es pequeño.",
          },
          {
            requirementId: "conversation_comentario_poster_para_cambiar_tema",
            text: "Haz en inglés un comentario ingenioso sobre uno de los pósters del ascensor para cambiar de tema.",
          },
          {
            requirementId: "conversation_confirmar_piso_y_boton",
            text: "Confirma en inglés tu piso y pide a alguien que presione el botón correspondiente.",
          },
          {
            requirementId: "conversation_pedir_pausa_respirar",
            text: "Solicita en inglés un momento para respirar cuando te interrumpan con preguntas simultáneas.",
          },
          {
            requirementId: "conversation_no_bloqueen_puerta",
            text: "Pide en inglés que no bloqueen la puerta del ascensor por seguridad.",
          },
          {
            requirementId: "conversation_teaser_sin_revelar",
            text: "Ofrece en inglés una descripción muy breve y general de tu rol sin revelar detalles sensibles.",
          },
          {
            requirementId: "conversation_persuadir_cafe_despues",
            text: "Intenta persuadir en inglés para continuar la charla luego con un café, no ahora.",
          },
          {
            requirementId: "conversation_halago_controlado",
            text: "Elogia en inglés uno de sus disfraces, manteniendo tus límites claros en la misma frase.",
          },
          {
            requirementId: "conversation_pedir_reformular_pregunta_tendenciosa",
            text: "Solicita en inglés que reformulen una pregunta tendenciosa para que sea más neutral.",
          },
          {
            requirementId: "conversation_opinion_halago_estres",
            text: "Expresa en inglés que la atención te halaga pero te resulta estresante en el ascensor.",
          },
          {
            requirementId: "conversation_preguntar_cual_es_el_scoop",
            text: 'Pregunta en inglés cuál es el "scoop" real que necesitan para dar por buena la nota.',
          },
          {
            requirementId: "conversation_rechazar_autografo_absurdo",
            text: "Rechaza en inglés firmar un autógrafo absurdo y ofrece un gesto simpático alternativo.",
          },
          {
            requirementId: "conversation_broma_no_soy_celebridad",
            text: "Haz en inglés una broma ligera aclarando que no eres una celebridad.",
          },
          {
            requirementId: "conversation_consecuencia_si_insisten",
            text: "Establece en inglés la consecuencia de que, si siguen presionando, dejarás de responder.",
          },
          {
            requirementId: "conversation_cierre_con_agradecimiento",
            text: "Cierra en inglés la mini rueda de prensa con una frase de agradecimiento antes de llegar a tu piso.",
          },
          {
            requirementId: "conversation_pedir_distancia_personal",
            text: "Pide en inglés que respeten tu espacio personal porque el ascensor es muy estrecho.",
          },
          {
            requirementId: "english_no_comment",
            text: 'Usa la frase inglesa "No comment" para rechazar responder a una pregunta concreta.',
          },
          {
            requirementId: "english_off_the_record",
            text: 'Incluye la expresión inglesa "off the record" al proponer hablar más tarde fuera del ascensor.',
          },
          {
            requirementId: "english_to_be_honest_marker",
            text: 'Empieza una respuesta con el marcador discursivo en inglés "To be honest," para sonar franco.',
          },
          {
            requirementId: "english_in_a_nutshell_resumen",
            text: 'Resume tu función usando la expresión inglesa "In a nutshell".',
          },
          {
            requirementId: "english_verb_deflect",
            text: 'Usa el verbo en inglés "deflect" para explicar que desviarás una pregunta inapropiada.',
          },
          {
            requirementId: "english_set_boundaries_collocation",
            text: 'Emplea la colocación en inglés "set boundaries" al marcar tus límites.',
          },
          {
            requirementId: "english_phrasal_back_off",
            text: 'Pide espacio usando el phrasal verb en inglés "back off" de manera cortés.',
          },
          {
            requirementId: "english_phrasal_tone_it_down",
            text: 'Solicita menor intensidad usando el phrasal verb en inglés "tone it down".',
          },
          {
            requirementId: "english_idiom_under_the_spotlight",
            text: 'Usa el idiom en inglés "under the spotlight" para describir cómo te sientes con las cámaras falsas.',
          },
          {
            requirementId: "english_phrasal_clear_up_rumor",
            text: 'Emplea el phrasal verb en inglés "clear up" para aclarar un rumor.',
          },
          {
            requirementId: "english_idiom_cross_the_line",
            text: 'Di en inglés que cierta pregunta "crosses the line" para señalar que excede los límites.',
          },
          {
            requirementId: "english_phrasal_make_up_story",
            text: 'Menciona en inglés que no vas a "make up a story" ni permitir historias inventadas.',
          },
          {
            requirementId: "english_pressing_questions_collocation",
            text: 'Incluye la colocación en inglés "pressing questions" para referirte a sus preguntas urgentes.',
          },
          {
            requirementId: "english_crowded_elevator_phrase",
            text: 'Di en inglés la frase "crowded elevator" para justificar que necesitas brevedad.',
          },
          {
            requirementId: "english_phrasal_play_along",
            text: 'Explica brevemente que solo "play along" por un momento antes de volver al trabajo.',
          },
          {
            requirementId: "english_idiom_not_my_cup_of_tea",
            text: 'Rechaza una sesión de fotos diciendo en inglés que no es "my cup of tea".',
          },
          {
            requirementId: "english_phrasal_wrap_up",
            text: 'Propón cerrar la entrevista usando el phrasal verb en inglés "wrap up".',
          },
          {
            requirementId: "english_idiom_draw_the_line",
            text: 'Usa el idiom en inglés "draw the line" al explicar hasta dónde responderás.',
          },
          {
            requirementId: "english_phrasal_stick_to_topics",
            text: 'Sugiere en inglés "stick to" ciertos temas permitidos.',
          },
          {
            requirementId: "english_discourse_frankly",
            text: 'Incluye el adverbio en inglés "frankly" para introducir una crítica suave.',
          },
          {
            requirementId: "english_personal_details_collocation",
            text: 'Usa la colocación en inglés "personal details" al negar compartir información.',
          },
          {
            requirementId: "english_idiom_elephant_in_the_room",
            text: 'Menciona el idiom en inglés "the elephant in the room" para abordar un rumor directo.',
          },
          {
            requirementId: "english_phrasal_slow_down",
            text: 'Pide controlar el ritmo usando el phrasal verb en inglés "slow down".',
          },
          {
            requirementId: "english_idiom_long_story_short",
            text: 'Explica en inglés por qué estás en la empresa usando "long story short".',
          },
          {
            requirementId: "english_phrasal_step_back",
            text: 'Solicita distancia física usando el phrasal verb en inglés "step back".',
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
            requirementId: "conversation_pregunta_medidas_seguridad",
            text: "Pregúntale a Ember qué medidas de seguridad concretas existen para la actividad propuesta.",
          },
          {
            requirementId: "conversation_pide_demostracion_inofensiva",
            text: "Solicita una demostración breve que pruebe que la actividad es realmente inofensiva.",
          },
          {
            requirementId: "conversation_establece_limite_fuego",
            text: "Establece explícitamente que no participarás en nada que involucre fuego real o humo irritante.",
          },
          {
            requirementId: "conversation_negocia_duracion",
            text: "Negocia reducir la duración de la actividad a un tiempo razonable para el equipo.",
          },
          {
            requirementId: "conversation_pregunta_objetivo_medido",
            text: "Pregunta cuál es el objetivo medible de la actividad y cómo se evaluará el éxito.",
          },
          {
            requirementId: "conversation_propone_alternativa_baja_riesgo",
            text: "Propón una actividad alternativa de bajo riesgo y explica por qué sería igual o más efectiva.",
          },
          {
            requirementId: "conversation_solicita_opcion_voluntaria",
            text: "Pide que la participación sea voluntaria y que exista una opción equivalente para quien no participe.",
          },
          {
            requirementId: "conversation_expresa_empatia_entusiasmo",
            text: "Reconoce con empatía el entusiasmo de Ember antes de plantear tus reservas.",
          },
          {
            requirementId: "conversation_pregunta_accesibilidad",
            text: "Pregunta cómo se adaptará la actividad para personas con limitaciones físicas o ansiedades sociales.",
          },
          {
            requirementId: "conversation_aclara_costos_responsables",
            text: "Aclara si habrá costos, quién los cubre y si la empresa lo aprueba.",
          },
          {
            requirementId: "conversation_exige_aprobacion_formal",
            text: "Exige una aprobación formal por escrito de Recursos Humanos antes de comprometer al equipo.",
          },
          {
            requirementId: "conversation_limita_ruido_espacio",
            text: "Establece límites sobre el ruido y el uso de espacios comunes para no interrumpir a otros.",
          },
          {
            requirementId: "conversation_pregunta_plan_emergencia",
            text: "Pregunta cuál es el plan de emergencia en caso de que algo salga mal, por improbable que sea.",
          },
          {
            requirementId: "conversation_considera_alergias_sensibilidades",
            text: "Consulta si la actividad contempla alergias, sensibilidades al humo o claustrofobia.",
          },
          {
            requirementId: "conversation_propone_prueba_piloto",
            text: "Propón hacer una prueba piloto con un grupo pequeño antes de involucrar a toda la oficina.",
          },
          {
            requirementId: "conversation_pide_roles_claros",
            text: "Pide que se definan roles y responsabilidades claras durante la actividad.",
          },
          {
            requirementId: "conversation_negocia_lugar_seguro",
            text: "Negocia que la actividad ocurra en un lugar seguro, bien ventilado y aprobado por la oficina.",
          },
          {
            requirementId: "conversation_solicita_reglas_conducta",
            text: "Solicita reglas de conducta simples para evitar presiones o bromas incómodas.",
          },
          {
            requirementId: "conversation_formula_condicion_participacion",
            text: "Expón una condición concreta que, si se cumple, aceptarías participar.",
          },
          {
            requirementId: "conversation_rechaza_con_razon",
            text: "Si la propuesta sigue sonando riesgosa, recházala con una justificación específica y respetuosa.",
          },
          {
            requirementId: "conversation_pregunta_inclusion_remotos",
            text: "Pregunta cómo participarán las personas que trabajan en remoto.",
          },
          {
            requirementId: "conversation_propone_mecanismo_feedback",
            text: "Propón un mecanismo breve de retroalimentación posterior para aprender y ajustar.",
          },
          {
            requirementId: "conversation_resume_acuerdos",
            text: "Resume en voz alta los acuerdos alcanzados para confirmar entendimiento.",
          },
          {
            requirementId: "conversation_indaga_historial_actividades",
            text: "Indaga si esta actividad o similares se han hecho antes y con qué resultados.",
          },
          {
            requirementId: "conversation_consulta_cobertura_seguro",
            text: "Consulta si existe cobertura de seguro o exención de responsabilidad aplicable a la actividad.",
          },
          {
            requirementId: "english_use_safety_protocol",
            text: "Usa la expresión en inglés 'safety protocol' al pedir cómo se manejará la seguridad.",
          },
          {
            requirementId: "english_use_risk_assessment",
            text: "Incluye el término 'risk assessment' al solicitar una evaluación previa de la actividad.",
          },
          {
            requirementId: "english_use_on_the_one_hand",
            text: "Contrapón ideas usando 'On the one hand..., on the other hand...' al equilibrar entusiasmo y cautela.",
          },
          {
            requirementId: "english_use_tone_down_phrasal",
            text: "Pide reducir la intensidad usando el phrasal verb 'tone down'.",
          },
          {
            requirementId: "english_use_rule_out_phrasal",
            text: "Deja claro que cierta opción queda descartada usando 'rule out'.",
          },
          {
            requirementId: "english_use_set_up_phrasal",
            text: "Propón preparar una versión pequeña diciendo 'set up a small pilot'.",
          },
          {
            requirementId: "english_use_go_over_phrasal",
            text: "Solicita revisar el plan con 'go over the plan together'.",
          },
          {
            requirementId: "english_use_green_light_idiom",
            text: "Menciona que hace falta aprobación usando la expresión 'get the green light from HR'.",
          },
          {
            requirementId: "english_use_on_the_same_page_idiom",
            text: "Confirma entendimiento común con 'make sure we are on the same page'.",
          },
          {
            requirementId: "english_use_no_brainer_idiom",
            text: "Describe una alternativa evidente con la expresión 'a no-brainer'.",
          },
          {
            requirementId: "english_use_win_win_idiom",
            text: "Presenta tu propuesta como 'a win-win for the team'.",
          },
          {
            requirementId: "english_use_push_back_phrasal",
            text: "Expresa resistencia respetuosa usando 'I need to push back on that'.",
          },
          {
            requirementId: "english_use_carry_out_phrasal",
            text: "Pregunta cómo se ejecutará detalladamente con 'how we will carry out the activity'.",
          },
          {
            requirementId: "english_use_fall_back_on_phrasal",
            text: "Sugiere un plan B empleando 'fall back on a safer option'.",
          },
          {
            requirementId: "english_use_iron_out_phrasal",
            text: "Propón resolver detalles usando 'iron out the details'.",
          },
          {
            requirementId: "english_use_run_it_by_phrasal",
            text: "Indica que consultarás a alguien diciendo 'run it by my manager'.",
          },
          {
            requirementId: "english_use_call_it_off_phrasal",
            text: "Establece un criterio de cancelación con 'we should call it off if...'.",
          },
          {
            requirementId: "english_use_red_flags_idiom",
            text: "Señala señales de alerta con la expresión 'red flags'.",
          },
          {
            requirementId: "english_use_ballpark_figure_idiom",
            text: "Pregunta por una estimación con 'a ballpark figure' de tiempo o costo.",
          },
          {
            requirementId: "english_use_in_the_long_run_idiom",
            text: "Argumenta beneficios futuros usando 'in the long run'.",
          },
          {
            requirementId: "english_use_ground_rules_collocation",
            text: "Propón 'clear ground rules' para la actividad.",
          },
          {
            requirementId: "english_use_liability_waiver_term",
            text: "Pregunta por un 'liability waiver' si aplica.",
          },
          {
            requirementId: "english_use_opt_out_phrasal",
            text: "Asegura la posibilidad de no participar con 'opt out without pressure'.",
          },
          {
            requirementId: "english_use_run_smoothly_collocation",
            text: "Explica cómo asegurar que todo 'runs smoothly' durante la actividad.",
          },
          {
            requirementId: "english_use_fire_hazard_term",
            text: "Menciona el concepto de 'fire hazard' al establecer límites claros.",
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
            requirementId: "conversation_acknowledge_octopus_multitask",
            text: "Reconoce de forma profesional la capacidad de Octavia para hacer varias cosas a la vez y comenta cómo te adaptarás a su estilo durante la entrevista.",
          },
          {
            requirementId: "conversation_request_one_question_at_a_time",
            text: "Pide con cortesía que formule una pregunta a la vez para poder responder con precisión.",
          },
          {
            requirementId: "conversation_summarize_eight_questions",
            text: "Resume en voz alta las múltiples preguntas simultáneas de Octavia en tres temas claros para confirmar comprensión.",
          },
          {
            requirementId: "conversation_describe_strengths",
            text: "Describe dos fortalezas profesionales relevantes para el puesto y relaciona cada una con un ejemplo breve.",
          },
          {
            requirementId: "conversation_answer_behavioral_question",
            text: "Responde a una pregunta de comportamiento usando una estructura clara de situación, tarea, acción y resultado.",
          },
          {
            requirementId: "conversation_set_boundaries_interruptions",
            text: "Establece un límite amable indicando que necesitarás terminar una idea antes de responder una nueva pregunta simultánea.",
          },
          {
            requirementId: "conversation_seek_clarification_conflicting_info",
            text: "Pregunta aclaraciones cuando Octavia ofrezca información contradictoria sobre el rol o el horario.",
          },
          {
            requirementId: "conversation_check_understanding_kpis",
            text: "Confirma cómo se medirá el éxito en los primeros 90 días y reformula los KPIs para verificar entendimiento.",
          },
          {
            requirementId: "conversation_request_examples_job_scope",
            text: "Solicita ejemplos concretos de tareas diarias para delimitar el alcance del puesto.",
          },
          {
            requirementId: "conversation_empathize_workload_octavia",
            text: "Expresa empatía por la carga de trabajo de Octavia y vincula esa realidad con tu estilo de priorización.",
          },
          {
            requirementId: "conversation_handle_curveball_ethics",
            text: "Responde con criterio a una pregunta inesperada sobre ética laboral manteniendo profesionalismo.",
          },
          {
            requirementId: "conversation_negotiate_start_date",
            text: "Negocia una posible fecha de incorporación justificando tu propuesta con razones logísticas.",
          },
          {
            requirementId: "conversation_ask_training_onboarding",
            text: "Pregunta por el plan de inducción y capacitación inicial, incluyendo responsables y duración.",
          },
          {
            requirementId: "conversation_propose_first_week_plan",
            text: "Propón un plan de prioridades para tu primera semana que muestre organización y realismo.",
          },
          {
            requirementId: "conversation_address_confidentiality",
            text: "Pregunta por políticas de confidencialidad y explica cómo las cumplirías en escenarios comunes.",
          },
          {
            requirementId: "conversation_request_feedback_fit",
            text: "Pide retroalimentación honesta sobre tu ajuste al puesto basándote en lo conversado.",
          },
          {
            requirementId: "conversation_manage_silence_to_think",
            text: "Indica explícitamente que tomarás unos segundos para pensar antes de responder una pregunta compleja.",
          },
          {
            requirementId: "conversation_resolve_misunderstanding",
            text: "Detecta y corrige un malentendido sobre una responsabilidad clave del rol con un ejemplo concreto.",
          },
          {
            requirementId: "conversation_align_expectations_availability",
            text: "Aclara expectativas de disponibilidad y posibles horas extra, incluyendo límites personales razonables.",
          },
          {
            requirementId: "conversation_confirm_tools_processes",
            text: "Pregunta por las herramientas y procesos internos que se usan para coordinarse con varios equipos.",
          },
          {
            requirementId: "conversation_handle_hypothetical_emergency",
            text: "Explica cómo priorizarías si tres tareas urgentes llegan al mismo tiempo desde diferentes tentáculos de Octavia.",
          },
          {
            requirementId: "conversation_request_note_taking_permission",
            text: "Pide permiso para tomar notas y explica que así asegurarás respuestas más precisas.",
          },
          {
            requirementId: "conversation_share_motivation_company_mission",
            text: "Explica por qué te motiva la misión de la empresa y cómo tu experiencia aporta valor.",
          },
          {
            requirementId: "conversation_handle_salary_range_tactfully",
            text: "Si surge el tema, pregunta con tacto por el rango salarial y el criterio de revisión sin desviarte del foco de la entrevista.",
          },
          {
            requirementId: "conversation_ask_about_next_steps_timeline",
            text: "Pregunta cuáles son los siguientes pasos del proceso y el calendario aproximado, y confirma el canal de contacto.",
          },
          {
            requirementId: "english_use_follow_up",
            text: 'Incluye el phrasal verb en inglés "follow up" para prometer que darás seguimiento tras la entrevista.',
          },
          {
            requirementId: "english_use_circle_back",
            text: 'Usa la expresión en inglés "circle back" para proponer retomar un tema que quedó abierto.',
          },
          {
            requirementId: "english_use_touch_base",
            text: 'Emplea la expresión en inglés "touch base" para sugerir una breve actualización con RR. HH.',
          },
          {
            requirementId: "english_use_keep_me_in_the_loop",
            text: 'Incluye la expresión en inglés "keep me in the loop" para pedir estar al tanto del proceso.',
          },
          {
            requirementId: "english_use_iron_out",
            text: 'Usa el phrasal verb en inglés "iron out" para hablar de resolver detalles del onboarding.',
          },
          {
            requirementId: "english_use_figure_out",
            text: 'Incluye el phrasal verb en inglés "figure out" al explicar cómo resuelves problemas ambiguos.',
          },
          {
            requirementId: "english_use_set_up",
            text: 'Emplea el phrasal verb en inglés "set up" para describir cómo organizarías tu primera semana.',
          },
          {
            requirementId: "english_use_flag",
            text: 'Usa el verbo en inglés "flag" para indicar que alertarías de un riesgo a tiempo.',
          },
          {
            requirementId: "english_use_wear_many_hats",
            text: 'Incluye el idiom en inglés "wear many hats" para describir versatilidad en un entorno cambiante.',
          },
          {
            requirementId: "english_use_hit_the_ground_running",
            text: 'Usa el idiom en inglés "hit the ground running" para expresar rapidez de adaptación.',
          },
          {
            requirementId: "english_use_juggle_multiple_tasks",
            text: 'Incluye la frase en inglés "juggle multiple tasks" para explicar tu priorización frente a varias peticiones.',
          },
          {
            requirementId: "english_use_zoom_in_on",
            text: 'Emplea el phrasal verb en inglés "zoom in on" para indicar cómo enfocas lo más crítico.',
          },
          {
            requirementId: "english_use_carry_out",
            text: 'Usa el phrasal verb en inglés "carry out" al hablar de ejecutar tareas bajo presión.',
          },
          {
            requirementId: "english_use_stakeholders",
            text: 'Incluye la palabra en inglés "stakeholders" para referirte a los involucrados clave.',
          },
          {
            requirementId: "english_use_deliverables",
            text: 'Usa la palabra en inglés "deliverables" para hablar de resultados concretos y medibles.',
          },
          {
            requirementId: "english_use_onboarding",
            text: 'Incluye el término en inglés "onboarding" al preguntar por la inducción.',
          },
          {
            requirementId: "english_use_time_management",
            text: 'Usa la expresión en inglés "time management" para describir tu organización del tiempo.',
          },
          {
            requirementId: "english_use_prioritize",
            text: 'Incluye el verbo en inglés "prioritize" al explicar cómo ordenas tareas cuando llegan a la vez.',
          },
          {
            requirementId: "english_use_multitasking",
            text: 'Emplea la palabra en inglés "multitasking" al comentar el estilo de Octavia y tu respuesta profesional.',
          },
          {
            requirementId: "english_use_attention_to_detail",
            text: 'Incluye la colocación en inglés "attention to detail" para justificar la calidad de tu trabajo.',
          },
          {
            requirementId: "english_use_cross_functional",
            text: 'Usa el adjetivo en inglés "cross-functional" al hablar de colaboración entre equipos.',
          },
          {
            requirementId: "english_use_align_with",
            text: 'Incluye la expresión en inglés "align with" para mostrar alineación con la misión y los KPIs.',
          },
          {
            requirementId: "english_use_mitigate_risk",
            text: 'Emplea la colocación en inglés "mitigate risk" al explicar cómo reduces incertidumbre.',
          },
          {
            requirementId: "english_use_contingency_plan",
            text: 'Usa el término en inglés "contingency plan" para proponer un plan si surgen imprevistos.',
          },
          {
            requirementId: "english_use_keep_it_professional_transitions",
            text: 'Incluye un conector discursivo en inglés como "That said," o "From my perspective," para mantener transiciones profesionales.',
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
            requirementId: "conversation_explicar_objetivo_cafe",
            text: "Explica en una frase qué resultado concreto quieres del café sin alterar tu línea temporal.",
          },
          {
            requirementId: "conversation_preguntar_componentes_tecnologicos",
            text: "Pregunta qué dispositivo o gadget del mostrador interviene directamente en la preparación de tu bebida.",
          },
          {
            requirementId: "conversation_verificar_seguridad_bebida",
            text: "Pregunta si la bebida es segura para alguien con posibles alergias o sensibilidad a la cafeína.",
          },
          {
            requirementId: "conversation_pedir_version_sin_efecto_temporal",
            text: "Solicita explícitamente una opción de café sin cambios de línea temporal y espera confirmación.",
          },
          {
            requirementId: "conversation_consultar_consecuencias_tiempo",
            text: "Pide que te expliquen una consecuencia específica y medible de tomar el café que altera el tiempo.",
          },
          {
            requirementId: "conversation_negociar_nivel_cafeina",
            text: "Negocia el nivel de cafeína deseado y cierra acuerdo con el barista.",
          },
          {
            requirementId: "conversation_pedir_demostracion_gadget",
            text: "Pide una demostración breve de un gadget clave antes de decidir.",
          },
          {
            requirementId: "conversation_establecer_limite_sin_experimentos",
            text: "Establece un límite claro indicando que no aceptarás pruebas experimentales en tu bebida.",
          },
          {
            requirementId: "conversation_reaccionar_a_fallo_dispositivo",
            text: "Reacciona ante un chisporroteo o fallo del aparato y pide pausar la preparación.",
          },
          {
            requirementId: "conversation_solicitar_aclaracion_pasos",
            text: "Solicita que el barista enumere los pasos de preparación y repite brevemente para confirmar.",
          },
          {
            requirementId: "conversation_preguntar_duracion_efecto",
            text: "Pregunta cuánto tiempo dura el efecto temporal y en qué condiciones termina.",
          },
          {
            requirementId: "conversation_expresar_preocupacion_etica",
            text: "Expresa una preocupación ética sobre cambiar eventos del pasado y pide la postura del barista.",
          },
          {
            requirementId: "conversation_compartir_preferencia_tiempo_destino",
            text: "Expresa una preferencia clara de época o periodo a evitar si hubiese salto accidental.",
          },
          {
            requirementId: "conversation_solicitar_plan_respaldo",
            text: "Pide un plan de respaldo si el efecto no es el esperado y confirma quién se hace responsable.",
          },
          {
            requirementId: "conversation_pedir_opcion_sabor_tradicional",
            text: "Pide un sabor clásico específico y justifica tu elección en una frase.",
          },
          {
            requirementId: "conversation_confirmar_precio_y_moneda",
            text: "Confirma el precio total y la moneda válida en tu línea temporal antes de pagar.",
          },
          {
            requirementId: "conversation_preguntar_politica_reembolso",
            text: "Pregunta la política de reembolso si el café produce un resultado distinto al acordado.",
          },
          {
            requirementId: "conversation_mostrar_empatia_distraccion",
            text: "Muestra empatía por la distracción del barista y pide amablemente enfocarse en tu pedido.",
          },
          {
            requirementId: "conversation_pedir_etiquetas_ingredientes",
            text: "Pide ver etiquetas o una lista de ingredientes poco comunes usados en la bebida.",
          },
          {
            requirementId: "conversation_solicitar_prueba_pequeno_sorbo",
            text: "Propón probar un sorbo mínimo primero y acuerda cómo evaluar el efecto.",
          },
          {
            requirementId: "conversation_resumir_acuerdo_final",
            text: "Resume en una frase el acuerdo final de bebida, efectos y precio, y solicita confirmación.",
          },
          {
            requirementId: "conversation_pedir_experiencias_previas_clientes",
            text: "Pregunta por un ejemplo concreto de un cliente anterior y su resultado con la bebida temporal.",
          },
          {
            requirementId: "conversation_pedir_silenciar_gadget",
            text: "Pide que silencien o desactiven un gadget ruidoso durante la toma del pedido.",
          },
          {
            requirementId: "conversation_rechazar_cambio_linea_temporal",
            text: "Rechaza explícitamente cualquier modificación de tu línea temporal y solicita confirmación de cumplimiento.",
          },
          {
            requirementId: "conversation_solicitar_recibo_marcado_tiempo",
            text: "Solicita un recibo con marca temporal o sello que confirme las condiciones acordadas.",
          },
          {
            requirementId: "english_usar_collocation_calibrate_precisely",
            text: "Usa la collocation en inglés 'calibrate precisely' para pedir que ajusten el gadget con exactitud.",
          },
          {
            requirementId: "english_usar_vocab_side_effects",
            text: "Usa la expresión en inglés 'side effects' para preguntar por efectos no deseados.",
          },
          {
            requirementId: "english_usar_phrasal_turn_down",
            text: "Usa el phrasal verb en inglés 'turn down' para rechazar educadamente una opción arriesgada.",
          },
          {
            requirementId: "english_usar_idiom_better_safe_than_sorry",
            text: "Usa el idiom en inglés 'better safe than sorry' para justificar una decisión conservadora.",
          },
          {
            requirementId: "english_usar_vocab_state_of_the_art",
            text: "Usa 'state-of-the-art' para describir la tecnología del equipo del barista.",
          },
          {
            requirementId: "english_usar_phrasal_hold_off",
            text: "Usa el phrasal verb 'hold off' para pedir que esperen antes de activar el dispositivo.",
          },
          {
            requirementId: "english_usar_idiom_cut_to_the_chase",
            text: "Usa el idiom 'cut to the chase' para pedir ir directo a las condiciones de la bebida.",
          },
          {
            requirementId: "english_usar_collocation_ripple_effect",
            text: "Usa la collocation 'ripple effect' para referirte al impacto temporal indirecto.",
          },
          {
            requirementId: "english_usar_phrasal_try_out",
            text: "Usa el phrasal verb 'try out' para proponer una prueba pequeña de la bebida.",
          },
          {
            requirementId: "english_usar_vocab_disclaimer",
            text: "Usa la palabra 'disclaimer' para solicitar una advertencia formal por escrito.",
          },
          {
            requirementId: "english_usar_idiom_not_my_cup_of_tea",
            text: "Usa el idiom 'not my cup of tea' para rechazar un sabor o efecto concreto.",
          },
          {
            requirementId: "english_usar_phrasal_set_up",
            text: "Usa el phrasal verb 'set up' para hablar de preparar la máquina antes del café.",
          },
          {
            requirementId: "english_usar_vocab_time_window",
            text: "Usa 'time window' para preguntar por el intervalo exacto del efecto.",
          },
          {
            requirementId: "english_usar_phrasal_look_into",
            text: "Usa el phrasal verb 'look into' para pedir que investiguen un posible riesgo.",
          },
          {
            requirementId: "english_usar_idiom_spill_the_beans",
            text: "Usa el idiom 'spill the beans' para pedir que revelen el ingrediente secreto.",
          },
          {
            requirementId: "english_usar_vocab_alternate_timeline",
            text: "Usa la expresión 'alternate timeline' para plantear una duda específica.",
          },
          {
            requirementId: "english_usar_phrasal_back_up",
            text: "Usa el phrasal verb 'back up' para pedir una copia de seguridad de los ajustes.",
          },
          {
            requirementId: "english_usar_vocab_trade_off",
            text: "Usa 'trade-off' para explicar el equilibrio entre sabor y seguridad.",
          },
          {
            requirementId: "english_usar_phrasal_swap_out",
            text: "Usa el phrasal verb 'swap out' para solicitar cambiar un componente del proceso.",
          },
          {
            requirementId: "english_usar_idiom_on_the_same_page",
            text: "Usa el idiom 'on the same page' para confirmar entendimiento compartido del pedido.",
          },
          {
            requirementId: "english_usar_vocab_glitch",
            text: "Usa la palabra 'glitch' para describir un fallo del gadget observado.",
          },
          {
            requirementId: "english_usar_phrasal_go_ahead",
            text: "Usa el phrasal verb 'go ahead' para autorizar explícitamente un paso acordado.",
          },
          {
            requirementId: "english_usar_idiom_in_the_long_run",
            text: "Usa el idiom 'in the long run' para hablar de consecuencias futuras del café.",
          },
          {
            requirementId: "english_usar_phrasal_phase_out",
            text: "Usa el phrasal verb 'phase out' para sugerir retirar gradualmente un aditivo inestable.",
          },
          {
            requirementId: "english_usar_collocation_full_refund",
            text: "Usa la collocation 'full refund' para solicitar condiciones claras de devolución.",
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
            requirementId: "conversation_desafiar_tesis_destinos",
            text: "Cuestiona con cortesía su idea de que el café decide destinos y pídele que justifique un caso concreto.",
          },
          {
            requirementId: "conversation_proponer_epoca_preferida",
            text: "Propón una época y ciudad específicas como las mejores para tomar café y defiéndelo con dos razones.",
          },
          {
            requirementId: "conversation_pedir_fecha_lugar_exacto",
            text: 'Pídele que fije una fecha y un lugar exactos para la "taza perfecta" y explique por qué.',
          },
          {
            requirementId: "conversation_negociar_primer_salto_seguro",
            text: "Negocia un primer salto temporal que evite guerras y plagas y acuerda una condición de seguridad.",
          },
          {
            requirementId: "conversation_marcar_limite_etico",
            text: "Establece un límite ético claro sobre no alterar la cronología solo por mejorar el café.",
          },
          {
            requirementId: "conversation_mostrar_empatia_pasion",
            text: "Expresa empatía por su pasión histórica y reconoce una anécdota que te haya impresionado.",
          },
          {
            requirementId: "conversation_preguntar_etica_abastecimiento",
            text: "Pregunta sobre la ética de conseguir granos de distintas épocas sin afectar a los agricultores.",
          },
          {
            requirementId: "conversation_ofrecer_espresso_moderno",
            text: "Ofrécele probar un espresso moderno y pídele que lo compare con uno histórico que recuerde.",
          },
          {
            requirementId: "conversation_solicitar_descripcion_sensorial",
            text: "Pide que describa sensorialmente un café en una cafetería otomana o victoriana que haya visitado.",
          },
          {
            requirementId: "conversation_pedir_aclaracion_termino",
            text: "Solicita aclaración de un término histórico o técnico que use y confirma si lo entendiste bien.",
          },
          {
            requirementId: "conversation_reformular_argumento",
            text: "Reformula su argumento principal en una frase y pídele que confirme su precisión.",
          },
          {
            requirementId: "conversation_persuadir_siglo_xxi",
            text: "Intenta persuadirlo de considerar el siglo XXI como cumbre del café por técnicas y acceso global.",
          },
          {
            requirementId: "conversation_preguntar_cambio_unico",
            text: "Pregunta qué único cambio haría en la historia del café si pudiera intervenir sin riesgo.",
          },
          {
            requirementId: "conversation_reaccion_sorprendida_fuente",
            text: "Reacciona con sorpresa a una afirmación dramática y solicita la fuente histórica específica.",
          },
          {
            requirementId: "conversation_proponer_itinerario_tiempo",
            text: "Propón un itinerario de tres paradas temporales para una ruta cafetera y justifica cada una.",
          },
          {
            requirementId: "conversation_intercambio_eleccion",
            text: "Propón un trato: tú eliges la primera época y él la segunda, y cierra el acuerdo verbalmente.",
          },
          {
            requirementId: "conversation_preguntar_reglas_seguridad",
            text: "Pregunta por las reglas de seguridad de la cafetería que viaja en el tiempo y sugiere añadir una.",
          },
          {
            requirementId: "conversation_ofrecer_bebida_alternativa_epoca",
            text: "Ofrece una bebida alternativa de la misma época y pregunta si cambiaría su conclusión histórica.",
          },
          {
            requirementId: "conversation_comparar_espacios_cafe",
            text: "Pídele comparar el debate intelectual en una coffeehouse otomana y un café parisino.",
          },
          {
            requirementId: "conversation_detectar_falacia",
            text: "Señala con tacto una posible falacia en su razonamiento y pide que la reevalúe.",
          },
          {
            requirementId: "conversation_establecer_limite_tiempo",
            text: "Indica que tu descanso termina pronto y sugiere enfocarse en una decisión concreta antes de irte.",
          },
          {
            requirementId: "conversation_consejo_infiltracion_historica",
            text: "Solicita un consejo práctico para pasar desapercibido en una cafetería del pasado.",
          },
          {
            requirementId: "conversation_presupuesto_monedas_antiguas",
            text: "Pregunta cuánto costaría un café en monedas victorianas y cómo lo pagarían hoy.",
          },
          {
            requirementId: "conversation_marcar_mapa_spot",
            text: "Invítalo a marcar en el mapa el punto exacto del mejor café y pide su breve dedicatoria.",
          },
          {
            requirementId: "conversation_concretar_destino_inicial",
            text: "Confirma juntos el destino inicial y expresa tu compromiso con un apretón de manos simbólico.",
          },
          {
            requirementId: "english_on_balance",
            text: 'Incluye la expresión inglesa "on balance" al comparar dos épocas cafeteras.',
          },
          {
            requirementId: "english_to_the_best_of_my_knowledge",
            text: 'Usa la locución inglesa "to the best of my knowledge" al citar un dato histórico del café.',
          },
          {
            requirementId: "english_arguably",
            text: 'Emplea la palabra inglesa "arguably" al defender tu época favorita para tomar café.',
          },
          {
            requirementId: "english_game_changer",
            text: 'Incluye el sustantivo inglés "game-changer" para describir una innovación cafetera.',
          },
          {
            requirementId: "english_brewing_method",
            text: 'Usa la collocation inglesa "brewing method" al explicar por qué una técnica supera a otra.',
          },
          {
            requirementId: "english_single_origin",
            text: 'Inserta la expresión inglesa "single-origin" al hablar del origen de los granos.',
          },
          {
            requirementId: "english_third_wave_coffee",
            text: 'Menciona el término inglés "third-wave coffee" al comparar tendencias históricas.',
          },
          {
            requirementId: "english_bean_to_cup",
            text: 'Emplea la frase inglesa "bean-to-cup" al describir control de calidad a lo largo del proceso.',
          },
          {
            requirementId: "english_turn_back_the_clock",
            text: 'Incluye la expresión idiomática inglesa "turn back the clock" al proponer un salto temporal.',
          },
          {
            requirementId: "english_boil_down_to",
            text: 'Usa el phrasal verb inglés "boil down to" al resumir el núcleo del desacuerdo.',
          },
          {
            requirementId: "english_rule_out",
            text: 'Emplea el phrasal verb inglés "rule out" al excluir una época por razones de seguridad.',
          },
          {
            requirementId: "english_talk_me_into",
            text: 'Incluye el phrasal verb inglés "talk me into" al invitarle a persuadirte sobre un destino.',
          },
          {
            requirementId: "english_push_back",
            text: 'Usa el phrasal verb inglés "push back" al oponerte cortésmente a su conclusión.',
          },
          {
            requirementId: "english_dig_into",
            text: 'Emplea el phrasal verb inglés "dig into" al sugerir investigar una fuente primaria.',
          },
          {
            requirementId: "english_go_along_with",
            text: 'Incluye el phrasal verb inglés "go along with" al aceptar provisionalmente su plan.',
          },
          {
            requirementId: "english_set_in_stone",
            text: 'Usa la expresión idiomática inglesa "set in stone" al aclarar que el itinerario es flexible.',
          },
          {
            requirementId: "english_a_grain_of_salt",
            text: 'Emplea el idiom inglés "take it with a grain of salt" al evaluar una anécdota dudosa.',
          },
          {
            requirementId: "english_elephant_in_the_room",
            text: 'Incluye el idiom inglés "the elephant in the room" al señalar un riesgo de alterar la historia.',
          },
          {
            requirementId: "english_make_up_your_mind",
            text: 'Usa el idiom inglés "make up your mind" al pedirle una decisión sobre la primera parada.',
          },
          {
            requirementId: "english_out_of_the_question",
            text: 'Emplea la expresión inglesa "out of the question" al fijar un límite de seguridad.',
          },
          {
            requirementId: "english_beyond_reasonable_doubt",
            text: 'Incluye la frase inglesa "beyond reasonable doubt" al exigir evidencia sólida.',
          },
          {
            requirementId: "english_steam_powered_roaster",
            text: 'Usa el sintagma inglés "steam-powered roaster" al referirte a tecnología del siglo XIX.',
          },
          {
            requirementId: "english_port_of_mocha",
            text: 'Menciona la locución inglesa "port of Mocha" al hablar de rutas históricas del café.',
          },
          {
            requirementId: "english_political_salon",
            text: 'Incluye el término inglés "political salon" al comparar espacios de debate en cafés históricos.',
          },
          {
            requirementId: "english_figure_out",
            text: 'Emplea el phrasal verb inglés "figure out" al proponer cómo pasar desapercibidos en otra época.',
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
            requirementId: "conversation_identificar_moneda",
            text: "Describe en inglés la moneda temporal que tienes en la mano y cómo sabes que no es la tuya.",
          },
          {
            requirementId: "conversation_preguntar_por_intercambio",
            text: "Pregunta en inglés si la otra persona está dispuesta a revertir el intercambio antes de que el reloj marque la hora loca.",
          },
          {
            requirementId: "conversation_confirmar_urgencia",
            text: "Explica en inglés por qué el tiempo es crítico y pide confirmación de que entiende la urgencia.",
          },
          {
            requirementId: "conversation_verificar_identidad_moneda",
            text: "Pide en inglés dos detalles verificables de la moneda de la otra persona para asegurarte de que es la tuya.",
          },
          {
            requirementId: "conversation_preguntar_condiciones",
            text: "Pregunta en inglés qué condiciones necesitaría la otra persona para devolver la moneda.",
          },
          {
            requirementId: "conversation_plantear_riesgos",
            text: "Advierte en inglés de un riesgo concreto si el intercambio no ocurre a tiempo y pide una reacción.",
          },
          {
            requirementId: "conversation_aclarar_malentendido",
            text: "Aclara en inglés un malentendido sobre quién tomó la moneda primero y pide confirmar la nueva comprensión.",
          },
          {
            requirementId: "conversation_proponer_lugar_intercambio",
            text: "Sugiere en inglés un lugar exacto dentro de la cafetería para hacer el intercambio de forma segura.",
          },
          {
            requirementId: "conversation_definir_secuencia",
            text: "Propón en inglés el orden exacto de acciones para el intercambio y solicita aceptación.",
          },
          {
            requirementId: "conversation_establecer_senal",
            text: "Acuerda en inglés una señal verbal breve para ejecutar el intercambio en el momento pactado.",
          },
          {
            requirementId: "conversation_mostrar_empatia",
            text: "Expresa en inglés empatía por el nerviosismo de la otra persona y pide una forma de hacerle sentir segura.",
          },
          {
            requirementId: "conversation_limite_personal",
            text: "Enuncia en inglés un límite claro sobre no entregar nada hasta ver la moneda correcta.",
          },
          {
            requirementId: "conversation_pedir_prueba_funcion",
            text: "Solicita en inglés una demostración breve de que la moneda de la otra persona aún funciona.",
          },
          {
            requirementId: "conversation_rechazar_condicion_injusta",
            text: "Rechaza en inglés una condición injusta y ofrece una alternativa concreta.",
          },
          {
            requirementId: "conversation_negociar_garantia",
            text: "Propón en inglés una garantía temporal (por ejemplo, dejar algo en depósito) y explica cómo se recupera.",
          },
          {
            requirementId: "conversation_pedir_discrecion",
            text: "Pide en inglés discreción para que el personal de la cafetería no intervenga y confirma acuerdo.",
          },
          {
            requirementId: "conversation_comprobar_reloj",
            text: "Menciona en inglés la hora exacta en el reloj de la pared y pregunta si ambos la ven igual.",
          },
          {
            requirementId: "conversation_pedir_recap",
            text: "Pide en inglés un resumen de lo acordado para confirmar que ambos tienen el mismo plan.",
          },
          {
            requirementId: "conversation_consultar_consecuencia_alternativa",
            text: "Pregunta en inglés qué preferiría la otra persona si el intercambio falla en el momento pactado.",
          },
          {
            requirementId: "conversation_solicitar_calma",
            text: "Pide en inglés que ambos bajen el tono y respiren antes de seguir negociando.",
          },
          {
            requirementId: "conversation_mencionar_reloj_bolsillo",
            text: "Explica en inglés qué indica tu reloj de bolsillo y cómo eso afecta el plazo del intercambio.",
          },
          {
            requirementId: "conversation_pedir_permiso_inspeccion",
            text: "Pide en inglés permiso para inspeccionar la moneda por cinco segundos sin moverla del mostrador.",
          },
          {
            requirementId: "conversation_marcar_punto_no_negociable",
            text: "Declara en inglés un punto no negociable y pide que la otra persona declare el suyo.",
          },
          {
            requirementId: "conversation_invitar_compromiso_mutuo",
            text: "Invita en inglés a establecer un compromiso mutuo y concreta cuál será tu parte exacta.",
          },
          {
            requirementId: "conversation_cerrar_acuerdo",
            text: "Cierra en inglés el acuerdo confirmando lugar, señal y minuto exactos para el intercambio.",
          },
          {
            requirementId: "english_usar_time_sensitive",
            text: "Usa la expresión en inglés 'time-sensitive' para subrayar la urgencia del intercambio.",
          },
          {
            requirementId: "english_usar_leverage",
            text: "Usa la palabra en inglés 'leverage' para explicar cómo planeas mejorar tu posición en la negociación.",
          },
          {
            requirementId: "english_usar_as_soon_as",
            text: "Usa 'as soon as' en inglés para fijar el momento exacto en que se hará el intercambio.",
          },
          {
            requirementId: "english_usar_on_the_dot",
            text: "Usa la expresión en inglés 'on the dot' para hablar de la puntualidad requerida.",
          },
          {
            requirementId: "english_usar_narrow_down",
            text: "Usa el phrasal verb en inglés 'narrow down' para reducir opciones de lugar o hora.",
          },
          {
            requirementId: "english_usar_back_out",
            text: "Usa el phrasal verb en inglés 'back out' para referirte a la posibilidad de que alguien se retire del trato.",
          },
          {
            requirementId: "english_usar_hold_off",
            text: "Usa el phrasal verb en inglés 'hold off' para pedir que la otra persona espere antes de actuar.",
          },
          {
            requirementId: "english_usar_swap",
            text: "Usa el verbo en inglés 'swap' para describir el intercambio de monedas temporales.",
          },
          {
            requirementId: "english_usar_cutting_it_close",
            text: "Usa la expresión en inglés 'cutting it close' para indicar que el plazo es muy ajustado.",
          },
          {
            requirementId: "english_usar_bargain",
            text: "Usa el sustantivo en inglés 'bargain' para describir un acuerdo que consideras justo.",
          },
          {
            requirementId: "english_usar_all_things_considered",
            text: "Usa el conector en inglés 'all things considered' para evaluar los riesgos del intercambio.",
          },
          {
            requirementId: "english_usar_come_clean",
            text: "Usa el phrasal verb en inglés 'come clean' para pedir honestidad sobre de dónde salió la moneda.",
          },
          {
            requirementId: "english_usar_handover",
            text: "Usa el sustantivo en inglés 'handover' para definir el momento de entrega de la moneda.",
          },
          {
            requirementId: "english_usar_stick_to_the_plan",
            text: "Usa la expresión en inglés 'stick to the plan' para insistir en cumplir lo acordado.",
          },
          {
            requirementId: "english_usar_time_window",
            text: "Usa el término en inglés 'time window' para hablar del margen disponible antes de la hora loca.",
          },
          {
            requirementId: "english_usar_double_check",
            text: "Usa el phrasal verb en inglés 'double-check' para pedir una verificación final de la moneda.",
          },
          {
            requirementId: "english_usar_in_good_faith",
            text: "Usa la expresión en inglés 'in good faith' para presentar una garantía o depósito.",
          },
          {
            requirementId: "english_usar_call_it_off",
            text: "Usa el phrasal verb en inglés 'call it off' para establecer qué pasará si surge un riesgo.",
          },
          {
            requirementId: "english_usar_shift_gears",
            text: "Usa la expresión en inglés 'shift gears' para proponer cambiar de estrategia.",
          },
          {
            requirementId: "english_usar_pin_down",
            text: "Usa el phrasal verb en inglés 'pin down' para concretar hora y lugar exactos.",
          },
          {
            requirementId: "english_usar_make_or_break",
            text: "Usa la expresión en inglés 'make-or-break' para describir la importancia del minuto acordado.",
          },
          {
            requirementId: "english_usar_if_push_comes_to_shove",
            text: "Usa el idiom en inglés 'if push comes to shove' para presentar tu último recurso.",
          },
          {
            requirementId: "english_usar_cut_a_deal",
            text: "Usa el idiom en inglés 'cut a deal' para proponer un trato claro.",
          },
          {
            requirementId: "english_usar_play_it_safe",
            text: "Usa la expresión en inglés 'play it safe' para justificar una medida de seguridad durante el intercambio.",
          },
          {
            requirementId: "english_usar_run_out_of_time",
            text: "Usa la expresión en inglés 'run out of time' para advertir sobre el límite impuesto por el reloj.",
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
            requirementId:
              "conversation_pedir_permiso_tocar_despertador_bronce",
            text: "Pide permiso explícito para tocar el pequeño despertador de bronce que el poeta está golpeando con el dedo.",
          },
          {
            requirementId:
              "conversation_preguntar_historia_despertador_antiguo",
            text: "Pregunta por la historia de un despertador antiguo de la mesa y solicita un detalle concreto de su procedencia.",
          },
          {
            requirementId: "conversation_clarificar_reglas_reto_poetico",
            text: "Pide aclarar las reglas del reto: cuántas palabras debe tener la línea y si 'coffee' y 'time' son obligatorias.",
          },
          {
            requirementId: "conversation_negociar_tema_esperanza",
            text: "Negocia amablemente cambiar el tono del verso hacia la esperanza y justifica por qué encaja con el amanecer.",
          },
          {
            requirementId: "conversation_mostrar_empatia_madrugadas_perdidas",
            text: "Expresa empatía por las 'madrugadas perdidas' del poeta con una frase que reconozca su melancolía.",
          },
          {
            requirementId: "conversation_opinar_tictac_ayuda_distraccion",
            text: "Da tu opinión sobre si el tic-tac de los relojes ayuda o distrae, y explica tu razón con un ejemplo sensorial.",
          },
          {
            requirementId: "conversation_pedir_pista_imagen_tiempo_cafe",
            text: "Pide una pista concreta de imagen para conectar tiempo y café en tu línea poética.",
          },
          {
            requirementId: "conversation_establecer_limite_silencio_recitacion",
            text: "Establece un límite cortés: solicita silencio de los despertadores mientras recitas tu línea.",
          },
          {
            requirementId: "conversation_preguntar_significado_madrugadas",
            text: "Pregunta qué entiende el poeta por 'madrugadas perdidas' y solicita un ejemplo personal breve.",
          },
          {
            requirementId: "conversation_solicitar_segunda_oportunidad",
            text: "Si tu primera línea no convence, solicita una segunda oportunidad con una razón específica.",
          },
          {
            requirementId: "conversation_pedir_traducir_palabra_arcaica",
            text: "Pide que te aclare o traduzca una palabra arcaica que utilice en su recitado.",
          },
          {
            requirementId:
              "conversation_proponer_intercambio_metafora_silencio",
            text: "Propón un intercambio: ofreces una nueva metáfora a cambio de que detenga el golpeteo del reloj.",
          },
          {
            requirementId: "conversation_preguntar_premio_reto",
            text: "Pregunta cuál es el premio o consecuencia de superar el reto poético.",
          },
          {
            requirementId: "conversation_describir_aroma_cafe",
            text: "Describe en una frase el aroma del café en la mesa usando al menos dos detalles sensoriales.",
          },
          {
            requirementId: "conversation_pedir_confirmacion_humor_permitido",
            text: "Pide confirmación de si está permitido incluir humor sutil en la línea.",
          },
          {
            requirementId: "conversation_reaccionar_verso_poeta_recurso",
            text: "Reacciona a un verso del poeta elogiando o cuestionando un recurso concreto que haya usado.",
          },
          {
            requirementId: "conversation_preguntar_medicion_tiempo_con_cafe",
            text: "Pregunta cómo mide el poeta el tiempo con el café y solicita un ejemplo práctico.",
          },
          {
            requirementId: "conversation_pedir_lectura_en_voz_alta",
            text: "Pide que el poeta lea tu línea en voz alta para evaluar su ritmo.",
          },
          {
            requirementId: "conversation_defender_eleccion_imagen",
            text: "Si el poeta critica tu metáfora, defiende tu elección con una razón concreta y una alternativa posible.",
          },
          {
            requirementId: "conversation_pedir_cuenta_regresiva",
            text: "Solicita una cuenta regresiva de un minuto antes de presentar tu línea.",
          },
          {
            requirementId: "conversation_preguntar_despertador_favorito",
            text: "Pregunta cuál es su despertador favorito y por qué, pidiendo un detalle físico del objeto.",
          },
          {
            requirementId: "conversation_solicitar_pausa_tapping",
            text: "Solicita que pause el golpeteo del reloj de bronce para poder concentrarte.",
          },
          {
            requirementId: "conversation_comprometer_siguiente_paso",
            text: "Tras recibir comentarios, agradece y di claramente cuál será tu siguiente ajuste en la línea.",
          },
          {
            requirementId: "conversation_observar_reloj_desfasado",
            text: "Muestra sorpresa ante un reloj que va adelantado o atrasado y pregunta si es intencional.",
          },
          {
            requirementId: "conversation_acordar_senal_inicio",
            text: "Acorda con el poeta una señal específica para comenzar la recitación.",
          },
          {
            requirementId: "english_usar_time_flies",
            text: "Incluye la expresión en inglés 'time flies' al comentar cómo pasan las madrugadas en la cafetería.",
          },
          {
            requirementId: "english_usar_burning_the_midnight_oil",
            text: "Usa el idiom 'burning the midnight oil' para describir el trabajo poético a altas horas.",
          },
          {
            requirementId: "english_usar_on_the_dot",
            text: "Emplea la expresión 'on the dot' para referirte a la hora exacta en que empieza el reto.",
          },
          {
            requirementId: "english_usar_run_out_of_time",
            text: "Di que temes 'run out of time' antes de terminar tu línea.",
          },
          {
            requirementId: "english_usar_wake_up_call",
            text: "Usa el idiom 'a wake-up call' para explicar una lección aprendida del poeta.",
          },
          {
            requirementId: "english_usar_tick_away",
            text: "Incluye el phrasal verb 'tick away' para describir cómo pasa el tiempo mientras huele el café.",
          },
          {
            requirementId: "english_usar_wind_down",
            text: "Utiliza el phrasal verb 'wind down' para explicar cómo calmas los nervios antes de recitar.",
          },
          {
            requirementId: "english_usar_brew_up",
            text: "Emplea el phrasal verb 'brew up' para conectar la preparación del café con la gestación de ideas.",
          },
          {
            requirementId: "english_usar_stir_up",
            text: "Usa el phrasal verb 'stir up' para indicar cómo el aroma del café provoca recuerdos.",
          },
          {
            requirementId: "english_usar_keep_track_of",
            text: "Incluye la expresión 'keep track of' para hablar de cómo sigues el ritmo de los relojes.",
          },
          {
            requirementId: "english_usar_fall_behind",
            text: "Usa 'fall behind' para describir quedarte atrás con el reto mientras suenan alarmas.",
          },
          {
            requirementId: "english_usar_set_off",
            text: "Emplea el phrasal verb 'set off' para referirte a la alarma que inicia la recitación.",
          },
          {
            requirementId: "english_usar_on_borrowed_time",
            text: "Incluye el idiom 'on borrowed time' para dramatizar la urgencia de tu verso.",
          },
          {
            requirementId: "english_usar_ahead_of_time",
            text: "Usa la expresión 'ahead of time' para decir que preparaste imágenes con antelación.",
          },
          {
            requirementId: "english_usar_out_of_sync",
            text: "Di que un reloj está 'out of sync' con los demás.",
          },
          {
            requirementId: "english_usar_in_no_time",
            text: "Incluye 'in no time' para prometer que tendrás una versión mejorada muy pronto.",
          },
          {
            requirementId: "english_usar_coffee_break",
            text: "Emplea la collocation 'coffee break' para proponer una breve pausa creativa.",
          },
          {
            requirementId: "english_usar_freshly_brewed",
            text: "Usa la collocation 'freshly brewed' para describir el café sobre la mesa.",
          },
          {
            requirementId: "english_usar_caffeine_rush",
            text: "Incluye 'caffeine rush' para hablar de la energía que sientes antes de recitar.",
          },
          {
            requirementId: "english_usar_coffee_grounds",
            text: "Menciona 'coffee grounds' para crear una imagen sobre leer el destino en los posos.",
          },
          {
            requirementId: "english_usar_discourse_marker_nevertheless",
            text: "Introduce la idea con el conector 'Nevertheless,' para contrastar con una duda previa.",
          },
          {
            requirementId: "english_usar_discourse_marker_meanwhile",
            text: "Usa el conector 'Meanwhile,' para enlazar una acción del reloj con tu pensamiento.",
          },
          {
            requirementId: "english_usar_ephemeral_y_liminal",
            text: "Incluye las palabras 'ephemeral' y 'liminal' para caracterizar el instante del café.",
          },
          {
            requirementId: "english_usar_relentless_rhythm",
            text: "Emplea la collocation 'relentless rhythm' para describir el tic-tac circundante.",
          },
          {
            requirementId: "english_usar_bitter_aftertaste",
            text: "Usa la collocation 'bitter aftertaste' para cerrar una reflexión sobre recuerdos y café.",
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
            requirementId: "conversation_diferencia_con_cafetera_normal",
            text: "Pide a Gideon que explique en qué se diferencia esta máquina de una cafetera normal en términos de seguridad.",
          },
          {
            requirementId: "conversation_pregunta_riesgos_por_omitir_paso",
            text: "Pregunta por dos riesgos concretos que ocurren si se omite un paso del procedimiento.",
          },
          {
            requirementId: "conversation_demostracion_encendido_lento",
            text: "Solicita una demostración lenta del encendido seguro y confirma que puedes replicarla.",
          },
          {
            requirementId: "conversation_colores_luces_estado",
            text: "Confirma con Gideon qué significan los colores de las luces de estado y cuándo es seguro continuar.",
          },
          {
            requirementId: "conversation_negociar_pausa_por_ruido",
            text: "Propón hacer una pausa inmediata si escuchas un zumbido inusual y negocia cómo detener la prueba.",
          },
          {
            requirementId: "conversation_duda_mezcla_cafe_tiempo",
            text: "Expresa duda sobre mezclar café con viaje temporal y pide una aclaración con un ejemplo cotidiano.",
          },
          {
            requirementId: "conversation_repeticion_secuencia_correcta",
            text: "Repite con tus palabras la secuencia correcta antes de tocar cualquier botón para confirmar entendimiento.",
          },
          {
            requirementId: "conversation_permiso_para_tomar_notas",
            text: "Pide permiso para tomar notas y verifica que no interfieren con los sensores del prototipo.",
          },
          {
            requirementId: "conversation_empatia_con_inventor",
            text: "Muestra empatía por el trabajo de Gideon y motívalo mientras solicitas que simplifique una instrucción clave.",
          },
          {
            requirementId: "conversation_limite_modo_turbo",
            text: "Establece un límite claro: no activar el modo turbo sin un extintor accesible y confirmación verbal.",
          },
          {
            requirementId: "conversation_simulacro_de_alarma",
            text: "Pide que simule una alarma y explica exactamente cómo reaccionarás durante el simulacro.",
          },
          {
            requirementId: "conversation_umbral_temperatura",
            text: "Pregunta qué debes hacer si la temperatura supera un umbral específico y repite el protocolo.",
          },
          {
            requirementId: "conversation_sugerencia_mejora_seguridad",
            text: "Sugiere una mejora sencilla de seguridad (por ejemplo, etiqueta o cobertor) y justifica su beneficio.",
          },
          {
            requirementId: "conversation_protocolo_abortar",
            text: "Pregunta si existe un protocolo de aborto de misión y dónde está el interruptor de emergencia.",
          },
          {
            requirementId: "conversation_equipo_proteccion_personal",
            text: "Verifica si necesitas guantes o gafas y confirma el material recomendado para esta prueba.",
          },
          {
            requirementId: "conversation_pedir_correcciones_terminologia",
            text: "Pide a Gideon que te corrija si usas mal la terminología técnica durante la explicación.",
          },
          {
            requirementId: "conversation_preferencia_instrucciones_escritas",
            text: "Expresa tu preferencia por instrucciones paso a paso por escrito y solicita un breve resumen.",
          },
          {
            requirementId: "conversation_cafe_descafeinado_seguridad",
            text: "Confirma si la prueba usará granos descafeinados y por qué eso puede ser más seguro para el pulso.",
          },
          {
            requirementId: "conversation_metafora_domestica_flujo_temporal",
            text: "Pide que compare el flujo temporal con una metáfora doméstica para fijar el concepto.",
          },
          {
            requirementId: "conversation_palabra_clave_parada",
            text: "Acordad una palabra clave para parar la prueba y repítela en voz alta para confirmación.",
          },
          {
            requirementId: "conversation_diferencia_reiniciar_apagar",
            text: "Pide aclaración sobre la diferencia entre reiniciar y apagar por completo el sistema.",
          },
          {
            requirementId: "conversation_verificacion_sello_temporal",
            text: "Pregunta cómo verificar que el sello temporal está intacto antes de verter el café.",
          },
          {
            requirementId: "conversation_plan_primero_diez_segundos",
            text: "Explica en voz alta qué harás durante los primeros diez segundos de la activación.",
          },
          {
            requirementId: "conversation_validacion_checklist",
            text: "Solicita que Gideon valide tu checklist de seguridad antes de proceder con la prueba.",
          },
          {
            requirementId: "conversation_protocolo_version_futura",
            text: "Pide indicaciones concretas para actuar si aparece una versión futura de ti durante la prueba.",
          },
          {
            requirementId: "english_power_up",
            text: "Usa la expresión en inglés 'power up' para indicar cómo encender el prototipo de forma segura.",
          },
          {
            requirementId: "english_shut_down",
            text: "Usa 'shut down' para describir el procedimiento de apagado completo en caso de alarma.",
          },
          {
            requirementId: "english_plug_in_unplug",
            text: "Menciona 'plug in' y 'unplug' al explicar cómo conectar y desconectar la máquina sin riesgo.",
          },
          {
            requirementId: "english_turn_down_pressure",
            text: "Usa 'turn down' para indicar que reduces la presión o el calor cuando sube demasiado.",
          },
          {
            requirementId: "english_cool_down_heat_up",
            text: "Incluye 'cool down' y 'heat up' para hablar del ciclo térmico antes y después de la prueba.",
          },
          {
            requirementId: "english_back_up_settings",
            text: "Usa 'back up' para explicar cómo respaldas los ajustes temporales antes de experimentar.",
          },
          {
            requirementId: "english_run_out_of_water",
            text: "Emplea 'run out of water' para advertir del riesgo si el depósito se queda sin agua.",
          },
          {
            requirementId: "english_set_off_alarm",
            text: "Usa 'set off the alarm' para describir qué acción podría detonar la alarma por error.",
          },
          {
            requirementId: "english_go_off_alarm",
            text: "Incluye 'go off' para referirte al momento en que suena la alarma de seguridad.",
          },
          {
            requirementId: "english_better_safe_than_sorry",
            text: "Usa el idiom 'better safe than sorry' para justificar una medida preventiva extra.",
          },
          {
            requirementId: "english_devil_in_the_details",
            text: "Emplea 'the devil is in the details' al insistir en seguir el manual al pie de la letra.",
          },
          {
            requirementId: "english_time_is_of_the_essence",
            text: "Usa 'time is of the essence' para recalcar que debes actuar rápido tras una alerta.",
          },
          {
            requirementId: "english_a_stitch_in_time",
            text: "Incluye 'a stitch in time saves nine' para defender una inspección temprana del sello temporal.",
          },
          {
            requirementId: "english_by_the_book",
            text: "Usa 'by the book' para comprometerte a seguir el protocolo sin improvisaciones.",
          },
          {
            requirementId: "english_on_the_same_page",
            text: "Emplea 'on the same page' para confirmar alineación antes de iniciar la secuencia.",
          },
          {
            requirementId: "english_dont_push_your_luck",
            text: "Usa 'don't push your luck' para rechazar probar el modo turbo durante la primera sesión.",
          },
          {
            requirementId: "english_jump_the_gun",
            text: "Incluye 'jump the gun' para admitir que no debes adelantar un paso crítico.",
          },
          {
            requirementId: "english_under_no_circumstances",
            text: "Usa la frase 'under no circumstances' para prohibir abrir la tapa durante el salto temporal.",
          },
          {
            requirementId: "english_to_be_on_the_safe_side",
            text: "Emplea 'to be on the safe side' para proponer repetir la verificación del filtro.",
          },
          {
            requirementId: "english_in_case_of",
            text: "Usa 'in case of' para introducir la acción que seguirás si aparece vapor amarillo.",
          },
          {
            requirementId: "english_first_and_foremost",
            text: "Incluye 'first and foremost' para priorizar la revisión de la válvula de presión.",
          },
          {
            requirementId: "english_pressure_valve_vocabulary",
            text: "Usa el término 'pressure valve' al describir qué componente debes revisar antes del encendido.",
          },
          {
            requirementId: "english_circuit_breaker_vocabulary",
            text: "Emplea 'circuit breaker' para explicar cómo cortar la energía si hay un cortocircuito.",
          },
          {
            requirementId: "english_failsafe_and_brew_cycle",
            text: "Usa 'failsafe' y 'brew cycle' al detallar cómo el sistema protege el café durante el salto temporal.",
          },
          {
            requirementId: "english_seal_integrity_and_leak_detection",
            text: "Incluye 'seal integrity' y 'leak detection' para describir las comprobaciones previas al vertido.",
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
            requirementId: "conversation_saludar_formalmente",
            text: "Saluda en inglés de forma cortés a Margaret y al suegro, usando su apellido si corresponde, y comenta brevemente que llegaste puntual.",
          },
          {
            requirementId: "conversation_romper_hielo_con_observacion",
            text: "Rompe el hielo en inglés con una observación amable sobre la casa o la decoración sin sonar exagerado.",
          },
          {
            requirementId: "conversation_responder_que_haces_con_confianza",
            text: "Responde en inglés a la pregunta sobre a qué te dedicas, dando un resumen claro de tu rol y un ejemplo concreto de una tarea reciente.",
          },
          {
            requirementId: "conversation_aclarar_mal_entendido_laboral",
            text: "Si Margaret malinterpreta tu trabajo, corrige en inglés con tacto y explica una diferencia clave para evitar confusiones.",
          },
          {
            requirementId: "conversation_pedir_detalles_familia_tradicion",
            text: "Pregunta en inglés por una tradición familiar de la cena y muestra interés genuino con una repregunta.",
          },
          {
            requirementId: "conversation_establecer_limite_pregunta_invasiva",
            text: "Cuando te hagan una pregunta demasiado personal, establece un límite en inglés de manera respetuosa y ofrece un tema alternativo.",
          },
          {
            requirementId:
              "conversation_defender_eleccion_profesional_con_razones",
            text: "Defiende en inglés tu elección profesional ante un comentario crítico, aportando al menos dos razones concretas.",
          },
          {
            requirementId: "conversation_mostrar_empatia_con_suegro_serio",
            text: "Reconoce en inglés la seriedad del suegro con empatía y pregunta si tuvo un día largo, sin sonar condescendiente.",
          },
          {
            requirementId: "conversation_pedir_permiso_ayudar",
            text: "Ofrece en inglés tu ayuda práctica (abrir vino, poner platos) y pregunta qué prefieren que hagas primero.",
          },
          {
            requirementId: "conversation_reaccionar_a_comentario_sarcastico",
            text: "Responde en inglés a un comentario sarcástico con humor suave que reduzca la tensión sin ceder en tu postura.",
          },
          {
            requirementId: "conversation_redirigir_tema_hacia_hobbies",
            text: "Cambia en inglés el tema hacia pasatiempos o intereses comunes después de una pregunta incómoda.",
          },
          {
            requirementId: "conversation_pedir_aclaracion_pregunta_ambigua",
            text: "Cuando Margaret haga una pregunta ambigua, pide en inglés una aclaración específica antes de contestar.",
          },
          {
            requirementId: "conversation_mencionar_valores_compartidos",
            text: "Menciona en inglés dos valores que compartes con su hijo/a (por ejemplo, responsabilidad y humor) y da un ejemplo breve.",
          },
          {
            requirementId: "conversation_manejar_critica_de_indumentaria",
            text: "Si critican sutilmente tu ropa, responde en inglés con cortesía y reafirma tu estilo sin confrontación.",
          },
          {
            requirementId: "conversation_complimentar_plato_especifico",
            text: "Elogia en inglés un plato específico que veas o huelas, haciendo una observación concreta sobre su sabor o presentación.",
          },
          {
            requirementId: "conversation_preguntar_limites_temas_sensibles",
            text: "Pregunta en inglés con diplomacia si hay temas que prefieren evitar durante la cena.",
          },
          {
            requirementId: "conversation_explicar_intencion_seria_relacion",
            text: "Explica en inglés tus intenciones serias respecto a la relación sin sonar grandilocuente.",
          },
          {
            requirementId: "conversation_pedir_feedback_impresion_inicial",
            text: "Pregunta en inglés qué impresión inicial has dado y demuestra apertura a comentarios.",
          },
          {
            requirementId: "conversation_corregir_nombre_con_tacto",
            text: "Si pronuncian mal tu nombre, corrígelo en inglés con amabilidad y ofrece una guía de pronunciación sencilla.",
          },
          {
            requirementId: "conversation_negociar_tema_trabajo_a_tiempo",
            text: "Negocia en inglés limitar el tiempo dedicado a hablar de trabajo y propone otro tema después de una respuesta más.",
          },
          {
            requirementId: "conversation_preguntar_historia_de_pareja",
            text: "Cuenta brevemente en inglés cómo conociste a tu pareja y pregunta por una anécdota de su infancia.",
          },
          {
            requirementId: "conversation_manejar_comparacion_con_ex",
            text: "Si te comparan con una expareja, desvía en inglés con elegancia hacia tus cualidades sin descalificar a nadie.",
          },
          {
            requirementId: "conversation_solicitar_reglas_de_la_casa",
            text: "Pregunta en inglés por alguna regla de la casa que debas conocer antes de sentarte a la mesa.",
          },
          {
            requirementId: "conversation_proponer_contribucion_futura",
            text: "Propón en inglés traer un plato específico para la próxima ocasión y pregunta si se ajusta a sus gustos.",
          },
          {
            requirementId: "conversation_cerrar_con_agradecimiento_sincero",
            text: "Cierra en inglés con un agradecimiento sincero por la invitación y menciona algo concreto que apreciaste del recibimiento.",
          },
          {
            requirementId: "english_primera_impresion_collocation",
            text: "Usa la collocation en inglés 'make a good first impression' al explicar tu saludo y lenguaje corporal.",
          },
          {
            requirementId: "english_romper_hielo_expression",
            text: "Incluye la expresión en inglés 'break the ice' al describir tu comentario sobre la casa.",
          },
          {
            requirementId: "english_tema_delicado_collocation",
            text: "Menciona en inglés 'a touchy subject' al negociar evitar ciertos temas durante la cena.",
          },
          {
            requirementId: "english_redirigir_conversacion_collocation",
            text: "Usa en inglés 'steer the conversation' para explicar cómo cambiarás el tema hacia hobbies.",
          },
          {
            requirementId: "english_aparentar_tranquilidad_idiom",
            text: "Emplea el idiom en inglés 'put on a brave face' al manejar un comentario sarcástico.",
          },
          {
            requirementId: "english_malinterpretar_phrasal",
            text: "Usa el phrasal verb en inglés 'take something the wrong way' al aclarar un malentendido.",
          },
          {
            requirementId: "english_evitar_tema_idiom",
            text: "Incluye el idiom en inglés 'steer clear of' para marcar un tema fuera de límites.",
          },
          {
            requirementId: "english_abrir_tema_incomodo_phrasal",
            text: "Usa el phrasal verb en inglés 'bring up' al referirte a quién inició un tema incómodo.",
          },
          {
            requirementId: "english_suavizar_tension_phrasal",
            text: "Emplea el phrasal verb en inglés 'smooth things over' para proponer calmar el ambiente.",
          },
          {
            requirementId: "english_ceder_en_discusion_phrasal",
            text: "Usa el phrasal verb en inglés 'back down' para indicar que no cederás en tu postura con la suegra.",
          },
          {
            requirementId: "english_rechazar_oferta_phrasal",
            text: "Incluye el phrasal verb en inglés 'turn down' al rechazar con cortesía una copa si no bebes.",
          },
          {
            requirementId: "english_dar_beneficio_duda_idiom",
            text: "Usa el idiom en inglés 'give the benefit of the doubt' al interpretar la mueca del suegro.",
          },
          {
            requirementId: "english_sonar_como_phrasal",
            text: "Emplea el phrasal verb en inglés 'come across as' para ajustar el tono de tu respuesta.",
          },
          {
            requirementId: "english_llevarse_bien_phrasal",
            text: "Usa el phrasal verb en inglés 'get along with' al hablar de tu relación con su hijo/a.",
          },
          {
            requirementId: "english_entrar_en_detalles_collocation",
            text: "Incluye en inglés 'go into detail' para decidir cuánto explicar sobre tu trabajo.",
          },
          {
            requirementId: "english_decir_opinion_idiom",
            text: "Usa el idiom en inglés 'speak your mind' al establecer un límite con respeto.",
          },
          {
            requirementId: "english_manera_de_hablar_collocation",
            text: "Emplea la collocation en inglés 'polite but firm' para describir tu tono al responder.",
          },
          {
            requirementId: "english_cambiar_tema_suavemente_collocation",
            text: "Usa en inglés 'a smooth segue' al proponer pasar a hablar de pasatiempos.",
          },
          {
            requirementId: "english_comentario_con_doble_filo_idiom",
            text: "Menciona en inglés 'a backhanded compliment' al reaccionar ante un elogio sospechoso.",
          },
          {
            requirementId: "english_decir_no_menos_directo_idiom",
            text: "Incluye el idiom en inglés 'let’s agree to disagree' para cerrar una discrepancia con cortesía.",
          },
          {
            requirementId: "english_definir_limites_collocation",
            text: "Usa en inglés 'set boundaries' al indicar qué preguntas prefieres evitar.",
          },
          {
            requirementId: "english_manejar_suspicacia_collocation",
            text: "Emplea en inglés 'under the microscope' para describir cómo te sientes observado.",
          },
          {
            requirementId: "english_aligerar_ambiente_collocation",
            text: "Usa en inglés 'lighten the mood' al proponer un comentario humorístico seguro.",
          },
          {
            requirementId: "english_mantener_civil_collocation",
            text: "Incluye en inglés 'keep it civil' al recordar el tono que ambos desean mantener.",
          },
          {
            requirementId: "english_elegir_sobre_la_marcha_idiom",
            text: "Usa el idiom en inglés 'play it by ear' al hablar de cómo te adaptarás a la dinámica de la cena.",
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
            requirementId: "conversation_acknowledge_spectacle",
            text: "En inglés, reconoce explícitamente el mini-espectáculo del tío y describe un detalle concreto de su baile o atuendo para mostrar que prestas atención.",
          },
          {
            requirementId: "conversation_set_clear_boundary_table",
            text: "En inglés, establece un límite amable pidiendo que el baile no ocurra sobre la mesa y da una razón relacionada con los platos o bebidas.",
          },
          {
            requirementId: "conversation_propose_move_living_room",
            text: "En inglés, sugiere trasladar el baile al salón y explica por qué sería mejor para todos.",
          },
          {
            requirementId: "conversation_check_host_approval",
            text: "En inglés, pregunta al anfitrión si está bien continuar con el show antes de decidir unirte o frenarlo.",
          },
          {
            requirementId: "conversation_limit_one_minute",
            text: "En inglés, negocia continuar el baile solo por un minuto y acuerda qué pasará después.",
          },
          {
            requirementId: "conversation_redirect_with_toast",
            text: "En inglés, redirige la energía proponiendo un brindis breve que reconozca al tío sin alargar el espectáculo.",
          },
          {
            requirementId: "conversation_request_lower_volume",
            text: "En inglés, pide bajar el volumen de la música o de las palmas para que la abuela pueda escuchar.",
          },
          {
            requirementId: "conversation_express_concern_spills",
            text: "En inglés, expresa preocupación específica por un posible derrame de salsa o vino debido al baile.",
          },
          {
            requirementId: "conversation_invite_simple_step",
            text: "En inglés, pide al tío que te enseñe un paso simple de pie junto a tu silla para mantener la mesa segura.",
          },
          {
            requirementId: "conversation_praise_then_pause",
            text: "En inglés, elogia un movimiento concreto del tío y luego pide una breve pausa para continuar con el primer plato.",
          },
          {
            requirementId: "conversation_seek_tradition_context",
            text: "En inglés, pregunta si este tipo de baile es una tradición familiar y cómo suelen manejarlo durante la cena.",
          },
          {
            requirementId: "conversation_empathize_public_performance",
            text: "En inglés, muestra empatía diciendo que actuar frente a la familia puede ser emocionante y estresante a la vez.",
          },
          {
            requirementId: "conversation_share_short_embarrassing_anecdote",
            text: "En inglés, comparte brevemente una anécdota personal de vergüenza para aliviar la tensión y conectar con el tío.",
          },
          {
            requirementId: "conversation_gain_consent_photo",
            text: "En inglés, pide permiso para tomar una foto o video corto y aclara dónde lo compartirías o no.",
          },
          {
            requirementId: "conversation_check_others_comfort",
            text: "En inglés, verifica si los demás en la mesa están cómodos y pregunta si prefieren seguir comiendo.",
          },
          {
            requirementId: "conversation_offer_alternative_activity",
            text: "En inglés, propone una alternativa concreta al baile, como servir el postre o poner una canción después de comer.",
          },
          {
            requirementId: "conversation_request_seated_dance",
            text: "En inglés, sugiere transformar el baile en una versión sentados para mantener el ambiente sin riesgos.",
          },
          {
            requirementId: "conversation_use_humor_to_deflect",
            text: "En inglés, usa el humor para desviar al tío de subirse a la mesa sin criticarlo directamente.",
          },
          {
            requirementId: "conversation_address_name_politely",
            text: "En inglés, dirígete al tío por su nombre o apodo con un tono afectuoso antes de pedirle algo.",
          },
          {
            requirementId: "conversation_clarify_your_intention",
            text: "En inglés, aclara tu intención de no arruinar la diversión mientras pides un pequeño cambio en la situación.",
          },
          {
            requirementId: "conversation_negotiate_space_clear_path",
            text: "En inglés, pide despejar un pequeño espacio seguro para que el tío baile sin chocar con sillas o platos.",
          },
          {
            requirementId: "conversation_diffuse_grandma_reaction",
            text: "En inglés, calma la reacción de un familiar mayor con una frase cortés que reduce el conflicto.",
          },
          {
            requirementId: "conversation_timebox_jokes",
            text: "En inglés, propone que los chistes continúen solo durante un intervalo breve y luego se retomen después del postre.",
          },
          {
            requirementId: "conversation_offer_help_cleanup_risk",
            text: "En inglés, ofrece ayudar a mover vasos o botellas frágiles antes de que el tío continúe.",
          },
          {
            requirementId: "conversation_confirm_no_shoes_on_table",
            text: "En inglés, confirma con amabilidad que nadie pondrá los zapatos sobre la mesa mientras dure la cena.",
          },
          {
            requirementId: "english_tone_it_down",
            text: "En inglés, pide al tío que baje la intensidad usando la expresión 'tone it down'.",
          },
          {
            requirementId: "english_join_in",
            text: "En inglés, indica que te unirás por un momento usando el phrasal verb 'join in'.",
          },
          {
            requirementId: "english_break_the_ice",
            text: "En inglés, justifica un brindis breve usando el idiom 'break the ice'.",
          },
          {
            requirementId: "english_read_the_room",
            text: "En inglés, explica tu decisión mencionando la collocation 'read the room'.",
          },
          {
            requirementId: "english_wrap_it_up",
            text: "En inglés, sugiere terminar el espectáculo usando el phrasal verb 'wrap it up'.",
          },
          {
            requirementId: "english_steal_the_show",
            text: "En inglés, elogia al tío usando el idiom 'steal the show' y luego redirige a la cena.",
          },
          {
            requirementId: "english_play_along",
            text: "En inglés, acepta seguirle un paso breve usando el phrasal verb 'play along'.",
          },
          {
            requirementId: "english_table_manners",
            text: "En inglés, recuerda con tacto las 'table manners' en una frase natural.",
          },
          {
            requirementId: "english_keep_it_down",
            text: "En inglés, pide bajar el volumen usando el phrasal verb 'keep it down'.",
          },
          {
            requirementId: "english_elephant_in_the_room",
            text: "En inglés, menciona la incomodidad común usando el idiom 'the elephant in the room'.",
          },
          {
            requirementId: "english_family_dynamics",
            text: "En inglés, muestra empatía aludiendo a las 'family dynamics' de la cena.",
          },
          {
            requirementId: "english_cheer_on",
            text: "En inglés, apoya desde la silla usando el phrasal verb 'cheer on'.",
          },
          {
            requirementId: "english_out_of_hand",
            text: "En inglés, justifica poner un límite usando el idiom 'out of hand'.",
          },
          {
            requirementId: "english_safety_hazard",
            text: "En inglés, advierte del riesgo para la mesa usando la collocation 'safety hazard'.",
          },
          {
            requirementId: "english_pass_around",
            text: "En inglés, propone pasar el postre usando el phrasal verb 'pass around'.",
          },
          {
            requirementId: "english_keep_a_straight_face",
            text: "En inglés, admite que te cuesta no reír usando el idiom 'keep a straight face'.",
          },
          {
            requirementId: "english_gentle_reminder",
            text: "En inglés, formula una petición educada incorporando la collocation 'gentle reminder'.",
          },
          {
            requirementId: "english_show_off",
            text: "En inglés, halaga sus movimientos usando el phrasal verb 'show off' y sugiere una pausa.",
          },
          {
            requirementId: "english_save_face",
            text: "En inglés, ofrece una salida elegante usando el idiom 'save face'.",
          },
          {
            requirementId: "english_social_cues",
            text: "En inglés, menciona las 'social cues' para explicar tu sugerencia.",
          },
          {
            requirementId: "english_settle_down",
            text: "En inglés, invita a volver a la comida usando el phrasal verb 'settle down'.",
          },
          {
            requirementId: "english_kill_the_mood",
            text: "En inglés, aclara que no quieres arruinar el ambiente usando el idiom 'kill the mood'.",
          },
          {
            requirementId: "english_trip_over",
            text: "En inglés, advierte del peligro de tropezar usando el phrasal verb 'trip over'.",
          },
          {
            requirementId: "english_awkward_silence",
            text: "En inglés, propone evitar un silencio incómodo usando la collocation 'awkward silence'.",
          },
          {
            requirementId: "english_cut_it_out",
            text: "En inglés, frena el espectáculo con humor usando el phrasal verb 'cut it out'.",
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
            requirementId:
              "conversation_pedir_porcion_mas_pequena_con_cortesia",
            text: "Pide con educación una porción más pequeña del plato tradicional sin ofender a la anfitriona.",
          },
          {
            requirementId:
              "conversation_confirmar_ingredientes_clave_para_alergia",
            text: "Confirma si el plato contiene frutos secos, mariscos o lácteos porque te preocupa una posible alergia ficticia.",
          },
          {
            requirementId:
              "conversation_negociar_alternativa_sin_romper_tradicion",
            text: "Negocia una alternativa que mantenga el espíritu de la tradición, como probar solo la salsa o una guarnición.",
          },
          {
            requirementId: "conversation_preguntar_significado_cultural",
            text: "Pregunta cuál es el significado familiar o la historia detrás de ese plato para mostrar interés genuino.",
          },
          {
            requirementId: "conversation_mostrar_empatia_por_esfuerzo_cocinar",
            text: "Expresa empatía por el esfuerzo y el tiempo que tomó preparar la receta.",
          },
          {
            requirementId: "conversation_pedir_aclaracion_sobre_modo_de_comer",
            text: "Pide aclaración sobre la manera correcta de comer el plato (con qué utensilio o acompañamiento).",
          },
          {
            requirementId: "conversation_marcar_limite_presion_para_comer",
            text: "Establece un límite cordial si te presionan para comer más de lo que te sientes cómodo.",
          },
          {
            requirementId: "conversation_pedir_agua_o_bebida_sin_alcohol",
            text: "Solicita agua o una bebida sin alcohol para acompañar y suavizar sabores intensos.",
          },
          {
            requirementId: "conversation_preguntar_nivel_picante",
            text: "Pregunta con tacto por el nivel de picante y si es posible reducirlo en tu porción.",
          },
          {
            requirementId: "conversation_agradecer_invitar_cocina",
            text: "Agradece explícitamente la invitación y la oportunidad de probar una receta familiar especial.",
          },
          {
            requirementId:
              "conversation_reaccionar_ante_broma_incomoda_con_tacto",
            text: "Responde a una broma incómoda de un familiar con humor ligero sin desviar la conversación del tema de la comida.",
          },
          {
            requirementId:
              "conversation_pedir_tiempo_para_oler_o_probar_primero",
            text: "Solicita permiso para oler o probar un pequeño bocado antes de servirte más.",
          },
          {
            requirementId: "conversation_justificar_eleccion_dietaria_temporal",
            text: "Explica una restricción dietaria temporal por recomendación médica de forma creíble.",
          },
          {
            requirementId: "conversation_pedir_utensilio_especifico",
            text: "Pide un utensilio específico (cuchillo pequeño, cuchara sopera, servilleta extra) para manejar mejor el plato.",
          },
          {
            requirementId:
              "conversation_preguntar_por_version_sin_un_ingrediente",
            text: "Pregunta si existe una versión sin un ingrediente concreto que te inquieta.",
          },
          {
            requirementId:
              "conversation_proponer_brindis_breve_por_la_anfitriona",
            text: "Propón un brindis breve para reconocer a la anfitriona y su tradición culinaria.",
          },
          {
            requirementId: "conversation_redirigir_curiosidad_invasiva",
            text: "Redirige con elegancia una pregunta invasiva de un familiar hacia un detalle interesante de la receta.",
          },
          {
            requirementId:
              "conversation_pedir_confirmacion_sobre_contaminacion_cruzada",
            text: "Pregunta si hubo cuidado para evitar la contaminación cruzada con posibles alérgenos.",
          },
          {
            requirementId:
              "conversation_mostrar_interes_por_aprender_la_receta_mas_adelante",
            text: "Expresa interés en aprender la receta otro día y pregunta si la pueden compartir en otro momento.",
          },
          {
            requirementId:
              "conversation_solicitar_pequena_pausa_para_descansar_el_paladar",
            text: "Pide una breve pausa entre bocados para descansar el paladar sin cortar el ambiente.",
          },
          {
            requirementId:
              "conversation_disculparse_por_malentendido_sobre_ingrediente",
            text: "Discúlpate si entendiste mal un ingrediente y corrige tu comentario con respeto.",
          },
          {
            requirementId:
              "conversation_pedir_permiso_para_dejar_en_el_borde_lo_que_no_puedes",
            text: "Pide permiso para dejar discretamente a un lado lo que no puedes comer sin que se sientan ofendidos.",
          },
          {
            requirementId:
              "conversation_preguntar_por_acompanamientos_mas_suaves",
            text: "Pregunta si hay acompañamientos más suaves para equilibrar el sabor del plato principal.",
          },
          {
            requirementId:
              "conversation_proponer_llevar_sobrantes_para_mas_tarde",
            text: "Ofrece llevarte una pequeña porción de sobra para probarla con calma más tarde.",
          },
          {
            requirementId:
              "conversation_reafirmar_aprecio_a_pesar_de_no_comer_todo",
            text: "Reafirma tu aprecio por la tradición aunque decidas no terminar la porción servida.",
          },
          {
            requirementId: "english_would_you_mind_if_small_portion",
            text: "Usa la estructura en inglés 'Would you mind if...?' para pedir una porción más pequeña del plato.",
          },
          {
            requirementId: "english_im_afraid_discourse_marker",
            text: "Inicia una negativa suave usando el marcador discursivo en inglés 'I'm afraid' antes de explicar tu restricción.",
          },
          {
            requirementId: "english_turn_down_phrasal",
            text: "Incluye el phrasal verb en inglés 'turn down' para rechazar con cortesía una segunda ración.",
          },
          {
            requirementId: "english_not_my_cup_of_tea_idiom",
            text: "Usa el idiom en inglés 'not my cup of tea' para expresar que el sabor no es de tu preferencia sin ofender.",
          },
          {
            requirementId: "english_go_easy_on_collocation",
            text: "Pide moderación con la expresión en inglés 'go easy on' respecto al picante o la sal.",
          },
          {
            requirementId: "english_just_to_clarify_marker",
            text: "Introduzca una pregunta de confirmación con el marcador en inglés 'Just to clarify,' sobre los ingredientes.",
          },
          {
            requirementId: "english_allergic_to_collocation",
            text: "Declara una alergia usando la construcción en inglés 'I'm allergic to...' seguida del ingrediente concreto.",
          },
          {
            requirementId: "english_swap_out_phrasal",
            text: "Propón una alternativa usando el phrasal verb en inglés 'swap out' para cambiar un ingrediente.",
          },
          {
            requirementId: "english_with_all_due_respect_marker",
            text: "Atenúa una opinión potencialmente sensible usando el marcador en inglés 'With all due respect,'.",
          },
          {
            requirementId: "english_pass_on_phrasal",
            text: "Rechaza una oferta de comida con el phrasal verb en inglés 'pass on' de forma amable.",
          },
          {
            requirementId: "english_secret_ingredient_collocation",
            text: "Pregunta por el 'secret ingredient' en inglés mostrando curiosidad genuina.",
          },
          {
            requirementId: "english_family_recipe_collocation",
            text: "Menciona la collocation en inglés 'family recipe' para reconocer la tradición.",
          },
          {
            requirementId: "english_would_rather_preference",
            text: "Expresa preferencia usando en inglés 'I'd rather' para elegir una guarnición más suave.",
          },
          {
            requirementId: "english_come_across_as_phrasal",
            text: "Asegura tu intención usando en inglés 'I don't want to come across as...' para evitar sonar desagradecido.",
          },
          {
            requirementId: "english_bite_the_bullet_idiom",
            text: "Usa el idiom en inglés 'bite the bullet' para indicar que probarás un bocado pese a tus dudas.",
          },
          {
            requirementId: "english_pick_at_phrasal",
            text: "Describe que comerás muy poco con el phrasal verb en inglés 'pick at' refiriéndote al plato.",
          },
          {
            requirementId: "english_in_case_condition",
            text: "Introduce una precaución con 'in case' en inglés al pedir información sobre contaminación cruzada.",
          },
          {
            requirementId: "english_smooth_things_over_phrasal",
            text: "Plantea reparar un malentendido usando el phrasal verb en inglés 'smooth things over'.",
          },
          {
            requirementId: "english_labor_of_love_collocation",
            text: "Elogia la preparación describiéndola como un 'labor of love' en inglés.",
          },
          {
            requirementId: "english_on_the_same_page_idiom",
            text: "Busca acuerdo usando el idiom en inglés 'on the same page' respecto a tu restricción.",
          },
          {
            requirementId: "english_could_i_get_polite_request",
            text: "Haz una petición cortés usando 'Could I get...' en inglés para solicitar agua o pan.",
          },
          {
            requirementId: "english_toast_makes_a_toast_collocation",
            text: "Propón un brindis usando la frase en inglés 'make a toast' dirigida a la anfitriona.",
          },
          {
            requirementId: "english_off_limits_idiom",
            text: "Explica que cierto ingrediente está 'off-limits' en inglés por tu dieta.",
          },
          {
            requirementId: "english_goes_a_long_way_idiom",
            text: "Agradece una pequeña adaptación diciendo en inglés que 'it goes a long way'.",
          },
          {
            requirementId: "english_if_its_ok_with_you_polite_frame",
            text: "Enmarca una solicitud con la frase en inglés 'If it's ok with you,' antes de pedir probar solo un bocado.",
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
            requirementId: "conversation_react_to_attic_secret",
            text: "Reacciona al rumor del ático con una frase en inglés que muestre sorpresa pero tacto, evitando humillar a nadie.",
          },
          {
            requirementId: "conversation_ask_for_context",
            text: "Pregunta en inglés quién empezó a contar la historia del ático y por qué salió justo ahora.",
          },
          {
            requirementId: "conversation_check_consent_to_continue",
            text: "Antes de seguir con el tema, pregunta en inglés si todos se sienten cómodos continuando.",
          },
          {
            requirementId: "conversation_clarify_details_politely",
            text: "Pide en inglés un detalle concreto de la historia, dejando claro que no buscas morbo.",
          },
          {
            requirementId: "conversation_validate_feelings",
            text: "Reconoce en inglés cómo puede sentirse la persona aludida y muestra empatía.",
          },
          {
            requirementId: "conversation_set_boundary_gently",
            text: "Establece en inglés un límite claro sobre lo que prefieres no discutir de tu propia vida.",
          },
          {
            requirementId: "conversation_share_balancing_own_anecdote",
            text: "Cuenta en inglés una anécdota personal breve que equilibre la atención sin eclipsar a nadie.",
          },
          {
            requirementId: "conversation_use_humor_to_defuse",
            text: "Usa un comentario de humor ligero en inglés para bajar la tensión sin burlarte de nadie.",
          },
          {
            requirementId: "conversation_request_truth_from_source",
            text: "Pregunta en inglés a la persona directamente implicada si desea contar su versión.",
          },
          {
            requirementId: "conversation_support_target_person",
            text: "Ofrece en inglés apoyo explícito a quien esté incómodo, proponiendo una pausa si es necesario.",
          },
          {
            requirementId: "conversation_propose_topic_shift_with_reason",
            text: "Propón en inglés cambiar de tema explicando una razón considerada (por ejemplo, cuidar sentimientos).",
          },
          {
            requirementId: "conversation_negotiate_safe_topic",
            text: "Sugiere en inglés un tema alternativo relacionado con recuerdos familiares no polémicos.",
          },
          {
            requirementId: "conversation_invite_group_perspective",
            text: "Pregunta en inglés cómo prefiere la familia manejar historias antiguas en reuniones futuras.",
          },
          {
            requirementId: "conversation_offer_apology_if_misstep",
            text: "Si notas molestia, ofrece en inglés una disculpa breve y sincera por cualquier malentendido.",
          },
          {
            requirementId: "conversation_seek_specifics_about_trunk",
            text: "Pregunta en inglés por el viejo baúl del salón y si tiene relación con la historia.",
          },
          {
            requirementId: "conversation_validate_story_as_family_lore",
            text: "Reformula en inglés la historia como parte del folclore familiar, restando dramatismo.",
          },
          {
            requirementId: "conversation_request_limit_on_jokes",
            text: "Pide en inglés que las bromas no crucen cierta línea, indicando cuál con respeto.",
          },
          {
            requirementId: "conversation_compromise_share_then_move_on",
            text: "Propón en inglés un acuerdo: una última pregunta breve y luego pasar al postre.",
          },
          {
            requirementId: "conversation_prompt_specific_memory",
            text: "Invita en inglés a alguien mayor a compartir un recuerdo positivo del mismo periodo.",
          },
          {
            requirementId: "conversation_praise_cook_to_redirect",
            text: "Elogia en inglés un plato de la cena para redirigir la conversación hacia la comida.",
          },
          {
            requirementId: "conversation_check_nonverbal_signs",
            text: "Comenta en inglés que notas incomodidad en el ambiente y propones bajar la voz.",
          },
          {
            requirementId: "conversation_defend_absent_person_politely",
            text: "Defiende en inglés a alguien que no está presente evitando acusaciones directas.",
          },
          {
            requirementId: "conversation_request_rule_for_future",
            text: "Sugiere en inglés una regla familiar para manejar chismes en próximas cenas.",
          },
          {
            requirementId: "conversation_seek_permission_to_share_photo",
            text: "Pregunta en inglés si está bien mostrar una foto graciosa relacionada para suavizar el momento.",
          },
          {
            requirementId: "conversation_close_loop_gracefully",
            text: "Cierra en inglés el tema del ático con una frase que agradezca la honestidad de todos.",
          },
          {
            requirementId: "english_use_tactful",
            text: "Usa la palabra en inglés 'tactful' para describir cómo quieres responder a la historia.",
          },
          {
            requirementId: "english_use_family_lore",
            text: "Emplea la colocación en inglés 'family lore' para enmarcar la anécdota sin juicio.",
          },
          {
            requirementId: "english_use_bring_up_phrasal",
            text: "Usa el phrasal verb en inglés 'bring up' para preguntar por qué sacaron el tema ahora.",
          },
          {
            requirementId: "english_use_skeletons_in_the_closet_idiom",
            text: "Incluye el idiom en inglés 'skeletons in the closet' para hablar de secretos familiares.",
          },
          {
            requirementId: "english_use_spill_the_beans_idiom",
            text: "Utiliza el idiom en inglés 'spill the beans' para invitar a revelar o frenar una revelación.",
          },
          {
            requirementId: "english_use_sweep_under_the_rug_idiom",
            text: "Emplea el idiom en inglés 'sweep it under the rug' para discutir si conviene ocultar el tema.",
          },
          {
            requirementId: "english_use_elephant_in_the_room_idiom",
            text: "Usa el idiom en inglés 'the elephant in the room' para señalar la tensión evidente.",
          },
          {
            requirementId: "english_use_smooth_over_phrasal",
            text: "Emplea el phrasal verb en inglés 'smooth over' para proponer calmar el conflicto.",
          },
          {
            requirementId: "english_use_lighten_the_mood_collocation",
            text: "Usa la colocación en inglés 'lighten the mood' para sugerir añadir humor cuidadoso.",
          },
          {
            requirementId: "english_use_with_all_due_respect_marker",
            text: "Empieza una frase con el marcador discursivo en inglés 'With all due respect' antes de discrepar.",
          },
          {
            requirementId: "english_use_if_you_dont_mind_me_asking_marker",
            text: "Introduce una pregunta delicada con 'If you don't mind me asking' en inglés.",
          },
          {
            requirementId: "english_use_open_up_phrasal",
            text: "Usa el phrasal verb en inglés 'open up' para invitar a alguien a hablar solo si quiere.",
          },
          {
            requirementId: "english_use_come_clean_idiom",
            text: "Incluye el idiom en inglés 'come clean' para hablar de confesar algo propio de forma ligera.",
          },
          {
            requirementId: "english_use_out_of_line_idiom",
            text: "Utiliza la expresión en inglés 'out of line' para marcar un límite a una broma.",
          },
          {
            requirementId: "english_use_cross_the_line_idiom",
            text: "Emplea el idiom en inglés 'cross the line' para decir qué comentarios no son aceptables.",
          },
          {
            requirementId: "english_use_take_it_the_wrong_way_chunk",
            text: "Incluye la frase en inglés 'please don't take it the wrong way' al matizar una crítica.",
          },
          {
            requirementId: "english_use_change_the_subject_chunk",
            text: "Usa la expresión en inglés 'change the subject' para proponer mover la conversación.",
          },
          {
            requirementId: "english_use_steer_the_conversation_collocation",
            text: "Emplea la colocación en inglés 'steer the conversation' para sugerir una dirección más amable.",
          },
          {
            requirementId: "english_use_break_the_ice_idiom",
            text: "Incluye el idiom en inglés 'break the ice' al proponer una actividad breve para relajarse.",
          },
          {
            requirementId: "english_use_awkward_silence_collocation",
            text: "Usa la colocación en inglés 'awkward silence' para describir el ambiente tras el rumor.",
          },
          {
            requirementId: "english_use_off_limits_chunk",
            text: "Emplea la expresión en inglés 'that's off-limits' para declarar un tema prohibido para ti.",
          },
          {
            requirementId: "english_use_play_down_phrasal",
            text: "Usa el phrasal verb en inglés 'play down' para restar importancia a un detalle embarazoso.",
          },
          {
            requirementId: "english_use_dig_up_phrasal",
            text: "Incluye el phrasal verb en inglés 'dig up' para cuestionar por qué desentierran historias viejas.",
          },
          {
            requirementId: "english_use_water_under_the_bridge_idiom",
            text: "Emplea el idiom en inglés 'water under the bridge' para cerrar el tema con elegancia.",
          },
          {
            requirementId: "english_use_for_what_its_worth_marker",
            text: "Introduce una opinión suave con el marcador en inglés 'for what it's worth' antes de aconsejar.",
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
            requirementId: "conversation_agradece_detalle_especifico",
            text: "Agradece a Anna por la cena mencionando un detalle concreto de la comida o la atmósfera.",
          },
          {
            requirementId: "conversation_reconoce_cansancio_anfitriona",
            text: "Menciona que notas que Anna está cansada y exprésale consideración de forma amable.",
          },
          {
            requirementId: "conversation_propone_fecha_tentativa",
            text: "Propón una próxima visita con una fecha o franja horaria tentativa y pregunta si le viene bien.",
          },
          {
            requirementId: "conversation_ofrece_ayuda_platos",
            text: "Ofrece ayudar explícitamente con los platos y espera la respuesta de Anna antes de actuar.",
          },
          {
            requirementId: "conversation_acepta_o_respeta_decision_ayuda",
            text: "Si Anna rechaza tu ayuda, responde aceptando su decisión con cortesía; si la acepta, confirma qué tarea harás.",
          },
          {
            requirementId: "conversation_cierra_tema_discusion",
            text: "Reconoce con tacto cualquier tensión previa de la cena e intenta cerrarla con una frase conciliadora.",
          },
          {
            requirementId: "conversation_confirma_medio_contacto",
            text: "Confirma el mejor medio para mantenerse en contacto (mensaje, llamada o email) y solicita el dato si falta.",
          },
          {
            requirementId: "conversation_verifica_preferencias_dieteticas",
            text: "Pregunta a Anna si hay alguna preferencia dietética que debas considerar para la próxima vez.",
          },
          {
            requirementId: "conversation_agradece_familia_menciona_miembro",
            text: "Agradece a la familia en general mencionando por nombre a al menos un miembro y algo positivo que dijo o hizo.",
          },
          {
            requirementId: "conversation_pide_permiso_foto_despedida",
            text: "Pregunta si está bien tomar una foto rápida de despedida para recordar la noche.",
          },
          {
            requirementId: "conversation_clarifica_logistica_regreso",
            text: "Aclara cómo regresarás a casa y responde cortésmente si te ofrecen llevarte.",
          },
          {
            requirementId: "conversation_promete_compensar_esfuerzo",
            text: "Promete compensar el esfuerzo de Anna con una acción concreta la próxima vez (por ejemplo, traer postre).",
          },
          {
            requirementId: "conversation_disculpa_malentendido_breve",
            text: "Si hubo un malentendido durante la cena, ofrécelo como un breve malentendido y pide disculpas sinceras.",
          },
          {
            requirementId: "conversation_establece_hora_salida_cordial",
            text: "Indica de manera amable que debes irte y sugiere una hora de salida clara para no alargar la despedida.",
          },
          {
            requirementId: "conversation_reacciona_halago_con_modestia",
            text: "Responde con modestia y gratitud si alguien te elogia durante la despedida.",
          },
          {
            requirementId: "conversation_pregunta_necesidades_ultima_hora",
            text: "Pregunta si hay algo de última hora con lo que puedas ayudar antes de irte.",
          },
          {
            requirementId: "conversation_negocia_reparto_tareas",
            text: "Sugiere un reparto razonable de tareas de limpieza y negocia con cortesía si hay desacuerdo.",
          },
          {
            requirementId: "conversation_evita_interrumpir_despedida",
            text: "Si alguien interrumpe, pide la palabra con amabilidad para terminar tu despedida sin cortar bruscamente.",
          },
          {
            requirementId: "conversation_expresa_aprecio_costumbres_familia",
            text: "Comenta positivamente una costumbre o tradición familiar que observaste durante la noche.",
          },
          {
            requirementId: "conversation_soluciona_confusion_regalos",
            text: "Aclara con cortesía si un recipiente, plato o regalo debe quedarse o lo llevarás de vuelta.",
          },
          {
            requirementId: "conversation_pide_retroalimentacion_menu",
            text: "Pregunta qué plato gustó más para tenerlo en cuenta en la próxima reunión.",
          },
          {
            requirementId: "conversation_reconoce_tiempo_valioso",
            text: "Agradece explícitamente el tiempo que te dedicaron pese a que el día fue largo.",
          },
          {
            requirementId: "conversation_propone_actividad_concreta_proxima",
            text: "Propón una actividad concreta para la próxima vez, como cocinar juntos o un paseo, y pide opinión.",
          },
          {
            requirementId: "conversation_marca_limite_hora_compromisos",
            text: "Si tienes otro compromiso, explica brevemente el motivo de irte ahora manteniendo un tono respetuoso.",
          },
          {
            requirementId: "conversation_despedida_personal_individual",
            text: "Despidete individualmente de al menos dos personas con un comentario personalizado para cada una.",
          },
          {
            requirementId: "english_use_collocation_heartfelt_thanks",
            text: "Usa la collocation en inglés heartfelt thanks para expresar gratitud sincera.",
          },
          {
            requirementId: "english_use_phrasal_verb_pitch_in",
            text: "Usa el phrasal verb pitch in para ofrecer ayuda con la limpieza.",
          },
          {
            requirementId: "english_use_idiom_call_it_a_night",
            text: "Usa el idiom call it a night para sugerir que es hora de terminar la velada.",
          },
          {
            requirementId: "english_use_collocation_tentative_plan",
            text: "Incluye la collocation tentative plan al proponer la próxima visita.",
          },
          {
            requirementId: "english_use_phrasal_verb_wash_up",
            text: "Usa el phrasal verb wash up al hablar de los platos.",
          },
          {
            requirementId: "english_use_idiom_no_hard_feelings",
            text: "Emplea el idiom no hard feelings para cerrar cualquier tensión.",
          },
          {
            requirementId: "english_use_phrasal_verb_follow_up",
            text: "Usa el phrasal verb follow up para confirmar cómo mantenerse en contacto.",
          },
          {
            requirementId: "english_use_collocation_clear_arrangements",
            text: "Usa la collocation make clear arrangements al hablar de la próxima reunión.",
          },
          {
            requirementId: "english_use_discourse_marker_all_things_considered",
            text: "Incluye el discourse marker All things considered para evaluar la noche.",
          },
          {
            requirementId: "english_use_phrasal_verb_smooth_things_over",
            text: "Usa el phrasal verb smooth things over para atenuar un malentendido.",
          },
          {
            requirementId: "english_use_idiom_cut_some_slack",
            text: "Emplea el idiom cut me some slack al referirte a un desliz menor durante la cena.",
          },
          {
            requirementId: "english_use_collocation_genuine_apology",
            text: "Usa la collocation a genuine apology al disculparte.",
          },
          {
            requirementId: "english_use_phrasal_verb_sort_out",
            text: "Usa el phrasal verb sort out para resolver quién lava los platos.",
          },
          {
            requirementId: "english_use_idiom_on_the_same_page",
            text: "Incluye el idiom on the same page al confirmar planes.",
          },
          {
            requirementId: "english_use_discourse_marker_before_i_forget",
            text: "Empieza una frase con Before I forget para añadir un detalle logístico.",
          },
          {
            requirementId: "english_use_phrasal_verb_keep_in_touch",
            text: "Usa el phrasal verb keep in touch para proponer comunicación futura.",
          },
          {
            requirementId: "english_use_collocation_awkward_silence",
            text: "Menciona la collocation awkward silence aludiendo a un momento incómodo.",
          },
          {
            requirementId: "english_use_idiom_make_it_up_to_you",
            text: "Usa el idiom make it up to you al prometer compensar el esfuerzo.",
          },
          {
            requirementId: "english_use_phrasal_verb_take_a_rain_check",
            text: "Emplea el phrasal verb take a rain check si debes posponer una invitación.",
          },
          {
            requirementId: "english_use_collocation_lingering_hug",
            text: "Usa la collocation a lingering hug al describir una despedida afectuosa.",
          },
          {
            requirementId: "english_use_discourse_marker_that_said",
            text: "Incluye That said para matizar una crítica con un comentario positivo.",
          },
          {
            requirementId: "english_use_phrasal_verb_wrap_up",
            text: "Usa el phrasal verb wrap up para cerrar la conversación con cortesía.",
          },
          {
            requirementId: "english_use_idiom_the_ball_is_in_your_court",
            text: "Emplea el idiom the ball is in your court para dejar la decisión a la anfitriona.",
          },
          {
            requirementId: "english_use_collocation_last_minute",
            text: "Usa la collocation last-minute change para referirte a un cambio de planes.",
          },
          {
            requirementId: "english_use_phrasal_verb_touch_base",
            text: "Usa el phrasal verb touch base para proponer confirmar detalles más adelante.",
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
            requirementId: "conversation_pedir_permiso_tocar_tiempo",
            text: "Pide permiso explícito para tocar el tambor tú mismo y especifica por cuántos segundos quieres intentarlo.",
          },
          {
            requirementId: "conversation_limitar_volumen_por_bebe",
            text: "Solicita bajar el volumen porque ves un bebé cerca y explica tu preocupación.",
          },
          {
            requirementId: "conversation_repetir_patron_a_tempo",
            text: "Pide que repita el patrón a un tempo concreto y confirma el número exacto de BPM que quieres.",
          },
          {
            requirementId: "conversation_invitar_multitud_palmas",
            text: "Pregunta si la multitud puede unirse con palmas y propone un pulso sencillo para que te sigan.",
          },
          {
            requirementId: "conversation_negociar_alternativa_sin_tocar",
            text: "Rechaza tocar directamente y negocia participar marcando el pulso con el pie como alternativa.",
          },
          {
            requirementId: "conversation_aclarar_que_hace_magico",
            text: "Pide una aclaración concreta de qué hace 'mágico' al tambor: si cambia el ritmo, el ánimo o algo físico.",
          },
          {
            requirementId: "conversation_prueba_con_ojos_vendados",
            text: "Solicita una demostración con los ojos vendados para comprobar si el 'poder' se nota sin ver.",
          },
          {
            requirementId: "conversation_bajar_intensidad_si_abrumado",
            text: "Expresa que el ruido te abruma y pide bajar la intensidad por un momento.",
          },
          {
            requirementId: "conversation_propina_condicionada_a_logro",
            text: "Propón dar una propina si logras reproducir un patrón que el artista marque tres veces seguidas sin fallar.",
          },
          {
            requirementId: "conversation_presentarte_al_publico",
            text: "Pide que te presente por tu nombre a la multitud antes de participar.",
          },
          {
            requirementId: "conversation_reaccion_humor_ante_fallo",
            text: "Cuando falles un golpe, reconoce el error con humor y pide repetir la entrada.",
          },
          {
            requirementId: "conversation_pedir_pausa_por_seguridad",
            text: "Solicita una pausa breve por seguridad cuando un perro ladra y la gente se mueve.",
          },
          {
            requirementId: "conversation_aprender_patron_cuatro_tiempos",
            text: "Pide que te enseñe un patrón de cuatro tiempos y confirma que lo puedes repetir igual.",
          },
          {
            requirementId: "conversation_preguntar_respuesta_emocional",
            text: "Pregunta si el tambor responde a emociones y sugiere tocar un ritmo 'alegre' para comprobarlo.",
          },
          {
            requirementId: "conversation_pedir_solo_corto",
            text: "Intenta convencer al artista de darte un solo breve de la actuación ante la multitud.",
          },
          {
            requirementId: "conversation_pedir_consentimiento_grabar",
            text: "Pide consentimiento para grabar un clip de diez segundos y explica para qué lo usarás.",
          },
          {
            requirementId: "conversation_agradecer_e_invitar_aplauso",
            text: "Agradece a la multitud y explícitamente invítalos a aplaudir al artista.",
          },
          {
            requirementId: "conversation_rechazar_truco_incomodo",
            text: "Rechaza con cortesía un truco que te incomoda y propone otra opción que sí aceptas.",
          },
          {
            requirementId: "conversation_preguntar_reparto_gorra",
            text: "Pregunta si se comparte el dinero de la gorra cuando tú participas activamente.",
          },
          {
            requirementId: "conversation_pedir_traduccion_jerga",
            text: "Pide que te traduzca un término de jerga musical que no entiendes y confirma su significado.",
          },
          {
            requirementId: "conversation_elogiar_tecnica_con_razon",
            text: "Elogia una técnica específica del tamborista y explica por qué te impresiona.",
          },
          {
            requirementId: "conversation_proponer_llamada_respuesta",
            text: "Propón un juego de llamada y respuesta simple y verifica que la multitud lo entienda.",
          },
          {
            requirementId: "conversation_pedir_conteo_entrada",
            text: "Pide que marque el conteo de entrada claramente con 'one, two, three, four'.",
          },
          {
            requirementId: "conversation_expresar_mareo_y_ajuste",
            text: "Explica que el ritmo te marea un poco y solicita un ajuste de tempo o dinámica.",
          },
          {
            requirementId: "conversation_pedir_reglas_basicas_cuidado",
            text: "Asegura que no dañarás el tambor y pide reglas básicas de cuidado antes de tocar.",
          },
          {
            requirementId: "english_keep_up_promesa",
            text: "Usa 'keep up' para prometer que podrás seguir el ritmo del artista.",
          },
          {
            requirementId: "english_tone_it_down_pedir",
            text: "Usa 'tone it down' para pedir explícitamente que bajen el volumen.",
          },
          {
            requirementId: "english_count_me_in_aceptar",
            text: "Usa 'count me in' para aceptar unirte a la actuación.",
          },
          {
            requirementId: "english_join_in_invitar_multitud",
            text: "Usa 'join in' para invitar a la multitud a participar con palmas.",
          },
          {
            requirementId: "english_build_up_energia",
            text: "Usa 'build up' para sugerir aumentar gradualmente la energía del número.",
          },
          {
            requirementId: "english_carry_on_animar",
            text: "Usa 'carry on' para animar a continuar después de un fallo.",
          },
          {
            requirementId: "english_back_off_espacio",
            text: "Usa 'back off' para pedir espacio físico cuando la multitud se acerque demasiado.",
          },
          {
            requirementId: "english_switch_it_up_variante",
            text: "Usa 'switch it up' para pedir una variante del patrón actual.",
          },
          {
            requirementId: "english_mess_up_admitir_error",
            text: "Usa 'mess up' para admitir claramente que cometiste un error al tocar.",
          },
          {
            requirementId: "english_try_out_probar_tambor",
            text: "Usa 'try out' para solicitar probar el tambor mágico.",
          },
          {
            requirementId: "english_set_off_reacciones",
            text: "Usa 'set off' para describir cómo el tambor desata reacciones en la multitud.",
          },
          {
            requirementId: "english_cut_it_out_detener_truco",
            text: "Usa 'cut it out' para pedir que se detenga un truco que te molesta.",
          },
          {
            requirementId: "english_play_it_by_ear_improvisar",
            text: "Usa el idiom 'play it by ear' para explicar que improvisarás con el ritmo.",
          },
          {
            requirementId: "english_drum_up_aplausos",
            text: "Usa el idiom 'drum up' para hablar de conseguir más aplausos o energía del público.",
          },
          {
            requirementId: "english_steal_the_show_elogio",
            text: "Usa el idiom 'steal the show' para elogiar un momento destacado.",
          },
          {
            requirementId: "english_not_my_cup_of_tea_rechazo_estilo",
            text: "Usa el idiom 'not my cup of tea' para rechazar con tacto un estilo rítmico.",
          },
          {
            requirementId: "english_on_the_fly_cambiar_plan",
            text: "Usa 'on the fly' para indicar que cambiarás el plan de forma improvisada.",
          },
          {
            requirementId: "english_in_sync_coordinacion",
            text: "Usa 'in sync' para confirmar que estás coordinado con el tamborista.",
          },
          {
            requirementId: "english_offbeat_describir_acento",
            text: "Usa 'offbeat' para describir un acento fuera del tiempo que quieres intentar.",
          },
          {
            requirementId: "english_upbeat_downbeat_conteo",
            text: "Usa 'upbeat' o 'downbeat' correctamente al hablar del conteo de entrada.",
          },
          {
            requirementId: "english_tempo_pregunta_velocidad",
            text: "Incluye la palabra 'tempo' al hacer una pregunta concreta sobre la velocidad del patrón.",
          },
          {
            requirementId: "english_crescendo_propuesta_aumentar",
            text: "Usa 'crescendo' para proponer aumentar el volumen de forma gradual.",
          },
          {
            requirementId: "english_acoustics_comentar_plaza",
            text: "Usa 'acoustics' para comentar cómo suena la plaza y si ayuda o dificulta.",
          },
          {
            requirementId: "english_adrenaline_rush_sentimiento",
            text: "Usa 'adrenaline rush' para explicar cómo te sientes al tocar frente a la multitud.",
          },
          {
            requirementId: "english_tip_jar_busking_propina",
            text: "Usa 'tip jar' o 'busking' en una frase sobre la propina y la actuación callejera.",
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
            requirementId: "conversation_pedir_demostracion_pasito",
            text: "Pide a Felix una demostración lenta del truco con un gato antes de intentarlo tú.",
          },
          {
            requirementId: "conversation_confirmar_normas_seguridad",
            text: "Confirma en qué consiste la regla principal de seguridad para el gato y para ti.",
          },
          {
            requirementId: "conversation_preguntar_peso_y_equilibrio",
            text: "Pregunta el peso aproximado del gato y cómo afecta al equilibrio sobre el sombrero.",
          },
          {
            requirementId: "conversation_solicitar_gato_de_peluche",
            text: "Solicita practicar primero con un gato de peluche y explica tu motivo.",
          },
          {
            requirementId: "conversation_parafrasear_instrucciones",
            text: "Parafrasea las instrucciones de Felix para confirmar que las entendiste.",
          },
          {
            requirementId: "conversation_pedir_tiempo_estimado",
            text: "Pregunta cuánto tiempo debes mantener al gato tranquilo para que cuente como logro.",
          },
          {
            requirementId: "conversation_pedir_distancia_publico",
            text: "Pide que el público mantenga una distancia específica y di por qué es importante.",
          },
          {
            requirementId: "conversation_establecer_limite_personal",
            text: "Expón un límite personal relacionado con alergias o incomodidad y negocia una alternativa.",
          },
          {
            requirementId: "conversation_mostrar_empatia_con_gatos",
            text: "Expresa empatía por los gatos y pregunta cómo notar señales de estrés.",
          },
          {
            requirementId: "conversation_pedir_permiso_tocar",
            text: "Pide permiso explícito para tocar al gato y pregunta dónde es adecuado hacerlo.",
          },
          {
            requirementId: "conversation_pedir_senal_de_aplausos",
            text: "Pregunta cuál será la señal para que el público aplauda sin asustar al gato.",
          },
          {
            requirementId: "conversation_proponer_lugar_mas_tranquilo",
            text: "Propón mover el acto unos pasos a un lugar más silencioso y justifícalo.",
          },
          {
            requirementId: "conversation_manejar_imprevisto_sombrero",
            text: "Si el sombrero está flojo, solicita ajustarlo o cambiarlo y explica el riesgo.",
          },
          {
            requirementId: "conversation_reaccionar_broma_teatral",
            text: "Responde con humor controlado a una broma teatral de Felix sin perder el foco.",
          },
          {
            requirementId: "conversation_preguntar_plan_b_si_salta",
            text: "Pregunta cuál es el plan B si el gato salta o intenta escapar.",
          },
          {
            requirementId: "conversation_solicitar_practica_respiracion",
            text: "Pide una breve guía de respiración para mantener las manos firmes antes del intento.",
          },
          {
            requirementId: "conversation_confirmar_rol_del_publico",
            text: "Confirma qué debe hacer el público durante tu intento (guardar silencio, contar, animar).",
          },
          {
            requirementId: "conversation_pedir_reintento_condiciones",
            text: "Negocia si habrá un reintento y bajo qué condiciones si el primero falla.",
          },
          {
            requirementId: "conversation_disculparse_manejo_torpe",
            text: "Si haces un movimiento brusco, discúlpate y explica cómo corregirás tu técnica.",
          },
          {
            requirementId: "conversation_persuasivo_calmar_multitud",
            text: "Pide al público que baje la voz con una frase persuasiva y respetuosa.",
          },
          {
            requirementId: "conversation_preguntar_senal_inicio",
            text: "Pregunta cuál será la señal exacta de Felix para empezar tu parte del acto.",
          },
          {
            requirementId: "conversation_expresar_confianza_controlada",
            text: "Expresa confianza moderada en que puedes lograrlo, sin sonar imprudente.",
          },
          {
            requirementId: "conversation_proponer_donativo_propina",
            text: "Propón una forma concreta de contribuir a la gorra si el acto sale bien.",
          },
          {
            requirementId: "conversation_pedir_permiso_video",
            text: "Pide permiso para que alguien grabe tu intento y aclara condiciones de uso.",
          },
          {
            requirementId: "conversation_cerrar_si_estres_gato",
            text: "Deja claro que detendrás el intento si notas una señal específica de estrés en el gato.",
          },
          {
            requirementId: "english_collocation_steady_hand",
            text: 'Incluye la collocation "a steady hand" al describir lo que necesitas para mantener al gato tranquilo.',
          },
          {
            requirementId: "english_phrasal_calm_down",
            text: 'Usa el phrasal verb "calm down" para explicar cómo ayudarás al gato si se inquieta.',
          },
          {
            requirementId: "english_idiom_break_a_leg",
            text: 'Incluye el idiom "break a leg" al aceptar el reto de Felix.',
          },
          {
            requirementId: "english_collocation_stage_presence",
            text: 'Menciona "stage presence" al comentar el estilo teatral de Felix o el tuyo.',
          },
          {
            requirementId: "english_phrasal_back_off",
            text: 'Usa el phrasal verb "back off" para pedir al público que se aleje un poco.',
          },
          {
            requirementId: "english_idiom_like_herding_cats",
            text: 'Emplea el idiom "like herding cats" para describir la dificultad de coordinar a varios gatos.',
          },
          {
            requirementId: "english_lexico_tip_jar",
            text: 'Menciona "tip jar" al hablar de contribuir si el acto sale bien.',
          },
          {
            requirementId: "english_collocation_gentle_touch",
            text: 'Incluye la collocation "a gentle touch" al explicar cómo sostendrás al gato.',
          },
          {
            requirementId: "english_phrasal_freak_out",
            text: 'Usa "freak out" para decir que no quieres que el gato ni el público se alteren.',
          },
          {
            requirementId: "english_idiom_steal_the_show",
            text: 'Incluye el idiom "steal the show" al hablar de un gato especialmente llamativo.',
          },
          {
            requirementId: "english_collocation_crowd_control",
            text: 'Utiliza la collocation "crowd control" al proponer cómo gestionar al público.',
          },
          {
            requirementId: "english_phrasal_hand_over",
            text: 'Emplea el phrasal verb "hand over" al pedir que te pasen el gato o el sombrero.',
          },
          {
            requirementId: "english_idiom_keep_your_cool",
            text: 'Incluye el idiom "keep your cool" para describir tu autocontrol durante el intento.',
          },
          {
            requirementId: "english_collocation_laser_focus",
            text: 'Usa la collocation "laser focus" para explicar tu nivel de concentración.',
          },
          {
            requirementId: "english_phrasal_settle_down",
            text: 'Emplea el phrasal verb "settle down" para indicar que el gato debe relajarse antes de empezar.',
          },
          {
            requirementId: "english_idiom_the_cats_out_of_the_bag",
            text: 'Incluye el idiom "the cat\'s out of the bag" en una broma relacionada con la sorpresa del público.',
          },
          {
            requirementId: "english_collocation_in_the_limelight",
            text: 'Menciona la expresión "in the limelight" para referirte a estar en el centro de atención.',
          },
          {
            requirementId: "english_phrasal_slip_up",
            text: 'Usa el phrasal verb "slip up" para reconocer un pequeño fallo y cómo lo corregirás.',
          },
          {
            requirementId: "english_idiom_tip_the_balance",
            text: 'Emplea el idiom "tip the balance" al hablar de un detalle que puede decidir el éxito del truco.',
          },
          {
            requirementId: "english_collocation_animal_welfare",
            text: 'Incluye la collocation "animal welfare" al afirmar que respetarás el bienestar del gato.',
          },
          {
            requirementId: "english_phrasal_hold_still",
            text: 'Usa la expresión imperativa "hold still" cuando indiques cómo debe estar el gato.',
          },
          {
            requirementId: "english_idiom_on_the_spot",
            text: 'Incluye el idiom "on the spot" para hablar de tomar decisiones inmediatas durante el acto.',
          },
          {
            requirementId: "english_phrasal_go_with_the_flow",
            text: 'Emplea el phrasal verb "go with the flow" para aceptar la naturaleza impredecible del acto.',
          },
          {
            requirementId: "english_collocation_stage_frigh",
            text: 'Menciona "stage fright" para referirte a nervios frente al público y cómo los gestionas.',
          },
          {
            requirementId: "english_phrasal_switch_over",
            text: 'Usa el phrasal verb "switch over" para proponer cambiar de un gato real a uno de peluche si es necesario.',
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
            requirementId: "conversation_opinion_parquimetros_vs_turistas",
            text: "Pregunta al sombrero su opinión comparando parquímetros con turistas y pídele que elija cuál le molesta más y por qué.",
          },
          {
            requirementId: "conversation_negociar_condicion_respetuosa",
            text: "Negocia una condición clara para seguir hablando, como evitar insultos, y consigue que el sombrero la acepte explícitamente.",
          },
          {
            requirementId: "conversation_empatia_cambio_humor",
            text: "Muestra empatía cuando el sombrero cambie de humor y refleja su sentimiento con una frase breve y específica.",
          },
          {
            requirementId: "conversation_marcar_limite_sarcasmo",
            text: "Establece un límite educado si el sombrero se pone ofensivo y verifica que reconoce tu límite.",
          },
          {
            requirementId: "conversation_pedir_anecdota_turista",
            text: "Pídele una anécdota concreta sobre un turista y haz una pregunta de seguimiento para profundizar.",
          },
          {
            requirementId: "conversation_defender_aporte_turistas",
            text: "Intenta convencer al sombrero de que los turistas aportan algo positivo, dando al menos dos razones específicas.",
          },
          {
            requirementId: "conversation_aclarar_truco_o_magia",
            text: "Pregunta si su voz es truco o magia y solicita una pista verificable.",
          },
          {
            requirementId: "conversation_proponer_regla_juego",
            text: "Propón una regla para la conversación y consigue que el sombrero la repita con sus propias palabras.",
          },
          {
            requirementId: "conversation_justificar_seriedad_multitud",
            text: "Justifica por qué quieres una charla seria a pesar de la multitud y confirma que el sombrero está de acuerdo.",
          },
          {
            requirementId: "conversation_exigir_ejemplo_afirmacion",
            text: "Cuando el sombrero haga una afirmación fuerte, pídele un ejemplo concreto y evalúa si es convincente.",
          },
          {
            requirementId: "conversation_contraargumento_respetuoso",
            text: "Contradice respetuosamente una generalización del sombrero sobre turistas con un contraejemplo realista.",
          },
          {
            requirementId: "conversation_opinion_musico_volumen",
            text: "Pregunta su opinión sobre el músico callejero cercano y su volumen, y comenta si estás de acuerdo o no.",
          },
          {
            requirementId: "conversation_pedir_consejo_multas",
            text: "Solicita un consejo práctico para evitar multas de estacionamiento sin romper la ley y confirma el paso clave.",
          },
          {
            requirementId: "conversation_describir_ambiente_calle",
            text: "Describe brevemente el ambiente de la calle y pide al sombrero que señale un detalle que tú no mencionaste.",
          },
          {
            requirementId: "conversation_explotacion_vendedor",
            text: "Pregunta si se siente explotado por el vendedor y pide una razón específica que lo respalde.",
          },
          {
            requirementId: "conversation_compromiso_humor_seriedad",
            text: "Propón un compromiso entre humor y seriedad y valida la aceptación del sombrero.",
          },
          {
            requirementId: "conversation_pedir_permiso_tocar",
            text: "Pide permiso para tocar o no tocar el sombrero y acata su respuesta sin discutir.",
          },
          {
            requirementId: "conversation_pedir_feedback_ingles",
            text: "Solicita una evaluación de tu inglés y pide una sugerencia concreta de mejora.",
          },
          {
            requirementId: "conversation_responder_provocacion_calma",
            text: "Responde a una provocación del sombrero sin perder la calma y redirige la charla con una pregunta.",
          },
          {
            requirementId: "conversation_cambiar_tema_cinismo",
            text: "Pídele que cambie de tema cuando esté muy cínico, explicando por qué te incomoda.",
          },
          {
            requirementId: "conversation_que_diria_agente_transito",
            text: "Pregunta qué le diría a un agente de tránsito sobre parquímetros y pide una frase textual.",
          },
          {
            requirementId: "conversation_apuesta_verbal_simple",
            text: "Propón una apuesta verbal sencilla sobre hacer reír o no y acuerda las consecuencias específicas.",
          },
          {
            requirementId: "conversation_explicar_reaccion_multitud",
            text: "Pídele que explique por qué la multitud reacciona de cierta manera y compara con tu interpretación.",
          },
          {
            requirementId: "conversation_reconocer_error_reformular",
            text: "Reconoce un malentendido propio y reformula tu pregunta de forma más clara.",
          },
          {
            requirementId: "conversation_mediacion_turista_molesto",
            text: "Pídele que medie entre tú y un turista molesto cercano, indicando el mensaje exacto que debería transmitir.",
          },
          {
            requirementId: "english_use_tourist_trap",
            text: "Usa la expresión en inglés 'tourist trap' para describir un lugar cercano que crees que estafa a visitantes.",
          },
          {
            requirementId: "english_use_parking_meter",
            text: "Menciona explícitamente 'parking meter' al hablar de pagar por estacionar en esta calle.",
          },
          {
            requirementId: "english_use_busker",
            text: "Refiérete al artista callejero como 'busker' y comenta su actuación.",
          },
          {
            requirementId: "english_use_crowd_pleaser",
            text: "Describe un truco como 'a real crowd-pleaser' y di por qué funciona con la multitud.",
          },
          {
            requirementId: "english_use_nickel_and_dime",
            text: "Critica los parquímetros usando 'nickel-and-dime' para expresar cargos constantes.",
          },
          {
            requirementId: "english_phrasal_fork_out",
            text: "Di que no quieres 'fork out' dinero por una multa y explica tu estrategia para evitarla.",
          },
          {
            requirementId: "english_idiom_hat_in_hand",
            text: "Pide algo al sombrero usando la expresión idiomática 'hat in hand'.",
          },
          {
            requirementId: "english_idiom_off_the_cuff",
            text: "Evalúa un comentario del sombrero como 'off the cuff' y justifica tu evaluación.",
          },
          {
            requirementId: "english_phrasal_talk_me_into",
            text: "Intenta 'talk me into' o 'talk you into' aceptar una condición específica de la charla.",
          },
          {
            requirementId: "english_idiom_call_your_bluff",
            text: "Responde a una provocación diciendo 'I call your bluff' y añade una razón.",
          },
          {
            requirementId: "english_idiom_on_the_fence",
            text: "Declara que estás 'on the fence' sobre un tema y menciona dos factores opuestos.",
          },
          {
            requirementId: "english_idiom_change_of_heart",
            text: "Describe un 'change of heart' del sombrero y qué lo causó.",
          },
          {
            requirementId: "english_phrasal_put_up_with",
            text: "Explica cuánto puedes 'put up with' el ruido de la calle antes de irte.",
          },
          {
            requirementId: "english_phrasal_look_down_on",
            text: "Acusa o defiende a alguien por 'look down on' a los turistas, con un ejemplo.",
          },
          {
            requirementId: "english_use_rip_off",
            text: "Llama 'rip-off' a un precio injusto y sugiere una alternativa.",
          },
          {
            requirementId: "english_phrasal_shell_out",
            text: "Di que te negas a 'shell out' por un truco barato y explica por qué.",
          },
          {
            requirementId: "english_phrase_move_along",
            text: "Usa la frase 'move along' como lo haría un agente para disuadir a la multitud.",
          },
          {
            requirementId: "english_use_heckler",
            text: "Identifica a un 'heckler' en la multitud y sugiere cómo manejarlo.",
          },
          {
            requirementId: "english_phrasal_back_down",
            text: "Indica si vas a 'back down' en la discusión y en qué condición lo harías.",
          },
          {
            requirementId: "english_phrasal_make_up_your_mind",
            text: "Dile al sombrero que 'make up your mind' sobre un tema y da un plazo.",
          },
          {
            requirementId: "english_phrasal_figure_out",
            text: "Di que intentas 'figure out' cómo habla el sombrero y presenta una hipótesis.",
          },
          {
            requirementId: "english_idiom_spill_the_beans",
            text: "Pídele que 'spill the beans' sobre el truco del acto.",
          },
          {
            requirementId: "english_idiom_on_a_shoestring",
            text: "Explica que viajas 'on a shoestring' y cómo afecta tus decisiones aquí.",
          },
          {
            requirementId: "english_idiom_rain_check",
            text: "Pide un 'rain check' para continuar la charla más tarde y da un motivo.",
          },
          {
            requirementId: "english_use_give_me_a_cue",
            text: "Solicita 'give me a cue' antes de participar en el acto y especifica la señal.",
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
            requirementId: "conversation_aclarar_exigencia_propina",
            text: "Pide que la estatua explique con claridad cuánto exige y por qué su inmovilidad merece ese monto.",
          },
          {
            requirementId: "conversation_preguntar_consecuencia_negativa",
            text: "Pregunta qué ocurrirá exactamente si te niegas a pagar la propina en ese momento.",
          },
          {
            requirementId: "conversation_cuestionar_legalidad",
            text: "Cuestiona de forma educada si es legal pedir una propina obligatoria en la vía pública.",
          },
          {
            requirementId: "conversation_ofrecer_alternativa_entretenimiento",
            text: "Propón una alternativa concreta para evitar pagar, como realizar un breve truco o cantar un verso.",
          },
          {
            requirementId: "conversation_negociar_precio_cerrado",
            text: "Negocia un precio máximo cerrado antes de aceptar cualquier trato.",
          },
          {
            requirementId: "conversation_negociar_tiempo_inmovilidad",
            text: "Negocia la duración exacta durante la cual la estatua se mantendrá inmóvil a cambio de tu aporte.",
          },
          {
            requirementId: "conversation_pedir_demostracion_calidad",
            text: "Solicita una demostración breve de inmovilidad impecable para evaluar la calidad del acto.",
          },
          {
            requirementId: "conversation_establecer_limite_personal",
            text: "Declara un límite personal claro sobre contacto físico o exposición frente a la multitud.",
          },
          {
            requirementId: "conversation_pedir_opciones_formales",
            text: "Pide que la estatua te ofrezca al menos dos opciones formales de trato para poder elegir.",
          },
          {
            requirementId: "conversation_expresar_presupuesto_limitado",
            text: "Explica que tu presupuesto es limitado y especifica cuánto puedes aportar como máximo.",
          },
          {
            requirementId: "conversation_proponer_trueque_foto",
            text: "Propón un trueque: una foto breve junto a la estatua a cambio de una propina reducida.",
          },
          {
            requirementId: "conversation_verificar_propina_voluntaria",
            text: "Pregunta si la propina es voluntaria y solicita confirmación explícita de que no es una tarifa.",
          },
          {
            requirementId: "conversation_solicitar_recibo_simbolico",
            text: "Solicita un comprobante simbólico o gesto formal que deje constancia del acuerdo.",
          },
          {
            requirementId: "conversation_reaccionar_a_clausula_absurda",
            text: "Reacciona con calma ante una cláusula absurda y pide reformularla de manera razonable.",
          },
          {
            requirementId: "conversation_pedir_aclaracion_condiciones",
            text: "Pide que te enumeren paso a paso las condiciones del trato para evitar malentendidos.",
          },
          {
            requirementId: "conversation_pedir_discrecion",
            text: "Solicita que la estatua baje la voz o hable con mayor discreción para no presionarte ante la multitud.",
          },
          {
            requirementId: "conversation_solicitar_descuento_grupo",
            text: "Pregunta si hay descuento si varias personas del público contribuyen juntas.",
          },
          {
            requirementId: "conversation_expresar_empatia_profesion",
            text: "Expresa empatía por el trabajo artístico de calle antes de proponer una cifra menor.",
          },
          {
            requirementId: "conversation_pedir_pausa_para_pensar",
            text: "Pide una breve pausa para pensarlo y que la estatua no te presione durante ese lapso.",
          },
          {
            requirementId: "conversation_ofrecer_dividir_pago",
            text: "Ofrece dividir el pago en dos partes condicionadas al cumplimiento del acto acordado.",
          },
          {
            requirementId: "conversation_consultar_donacion_causa",
            text: "Pregunta si parte de la propina se destina a una causa o proyecto y solicita detalles.",
          },
          {
            requirementId: "conversation_proponer_medio_pago_alterno",
            text: "Propón un medio de pago alternativo si no tienes efectivo y confirma que sea aceptado.",
          },
          {
            requirementId: "conversation_pedir_testigo_multitud",
            text: "Pide que alguien del público sirva como testigo del acuerdo para mayor claridad.",
          },
          {
            requirementId: "conversation_cerrar_contrato_claro",
            text: "Resume y confirma el acuerdo final con precio, tiempo y acción definidos, y solicita asentimiento.",
          },
          {
            requirementId: "conversation_ultimatum_respetuoso",
            text: "Plantea un ultimátum respetuoso con tu última oferta y tus condiciones no negociables.",
          },
          {
            requirementId: "english_usar_collocation_fair_and_square",
            text: 'Usa la collocation en inglés "fair and square" para insistir en que el trato sea justo.',
          },
          {
            requirementId: "english_usar_phrasal_turn_down",
            text: 'Incluye el phrasal verb "turn down" para rechazar una oferta poco razonable.',
          },
          {
            requirementId: "english_usar_idiom_daylight_robbery",
            text: 'Emplea el idiom "daylight robbery" para criticar un precio excesivo.',
          },
          {
            requirementId: "english_usar_collocation_meet_halfway",
            text: 'Usa la expresión "meet me halfway" para proponer un punto medio.',
          },
          {
            requirementId: "english_usar_phrasal_back_down",
            text: 'Utiliza "back down" para pedir que la estatua reduzca su demanda.',
          },
          {
            requirementId: "english_usar_phrasal_go_along_with",
            text: 'Incluye "go along with" para aceptar provisionalmente una condición.',
          },
          {
            requirementId: "english_usar_idiom_draw_the_line",
            text: 'Emplea "draw the line" para marcar un límite innegociable.',
          },
          {
            requirementId: "english_usar_collocation_non_negotiable",
            text: 'Usa la palabra "non-negotiable" para fijar una condición firme.',
          },
          {
            requirementId: "english_usar_phrasal_chip_in",
            text: 'Incluye "chip in" para hablar de que el público podría contribuir en conjunto.',
          },
          {
            requirementId: "english_usar_collocation_tip_jar",
            text: 'Menciona "tip jar" al preguntar por el recipiente de propinas.',
          },
          {
            requirementId: "english_usar_phrasal_cough_up",
            text: 'Usa "cough up" para referirte de forma coloquial a pagar a regañadientes.',
          },
          {
            requirementId: "english_usar_idiom_sweeten_the_deal",
            text: 'Incluye "sweeten the deal" para pedir un incentivo adicional.',
          },
          {
            requirementId: "english_usar_collocation_good_faith",
            text: 'Emplea "in good faith" para resaltar tu intención honesta al negociar.',
          },
          {
            requirementId: "english_usar_phrasal_iron_out",
            text: 'Usa "iron out" para proponer resolver detalles del acuerdo.',
          },
          {
            requirementId: "english_usar_phrasal_hold_still",
            text: 'Incluye "hold still" para exigir inmovilidad perfecta durante la demostración.',
          },
          {
            requirementId: "english_usar_collocation_on_the_spot",
            text: 'Emplea "on the spot" para hablar de pagar o decidir inmediatamente.',
          },
          {
            requirementId: "english_usar_idiom_take_it_or_leave_it",
            text: 'Usa "take it or leave it" al presentar tu última oferta.',
          },
          {
            requirementId: "english_usar_phrasal_stand_my_ground",
            text: 'Incluye "stand my ground" para indicar que mantienes tu posición.',
          },
          {
            requirementId: "english_usar_vocab_busking",
            text: 'Usa la palabra "busking" para referirte a la actuación callejera.',
          },
          {
            requirementId: "english_usar_collocation_small_print",
            text: 'Menciona "small print" al pedir aclarar cláusulas absurdas o escondidas.',
          },
          {
            requirementId: "english_usar_phrasal_talk_me_into",
            text: 'Emplea "talk me into" para retar a la estatua a convencerte con una mejor propuesta.',
          },
          {
            requirementId: "english_usar_idiom_push_your_luck",
            text: 'Usa "push your luck" para advertir que está tensando demasiado la negociación.',
          },
          {
            requirementId: "english_usar_collocation_in_writing",
            text: 'Incluye "in writing" de forma figurada para pedir una confirmación clara del trato.',
          },
          {
            requirementId: "english_usar_phrasal_walk_away",
            text: 'Usa "walk away" para indicar que te irás si no ajustan las condiciones.',
          },
          {
            requirementId: "english_usar_idiom_nickel_and_diming",
            text: 'Emplea "nickel-and-diming" para criticar cobros pequeños acumulativos en el trato.',
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
            requirementId: "conversation_confirmar_tema_coro",
            text: "Pregunta al líder cuál es el tema del coro y confirma en voz alta la frase exacta que vas a cantar.",
          },
          {
            requirementId: "conversation_aclarar_tempo",
            text: "Pide aclaración sobre el tempo con una pregunta concreta y repite el pulso con palmadas o palabras.",
          },
          {
            requirementId: "conversation_negociar_tonalidad",
            text: "Negocia subir o bajar una tonalidad y explica brevemente por qué te conviene.",
          },
          {
            requirementId: "conversation_proponer_senal_entrada",
            text: "Propón una señal de entrada específica (por ejemplo, un conteo) y espera la confirmación del líder.",
          },
          {
            requirementId: "conversation_pedir_demo_corta",
            text: "Pide un ejemplo corto del coro y repítelo correctamente para validar que lo entendiste.",
          },
          {
            requirementId: "conversation_mencionar_nervios_truco",
            text: "Expresa que estás nervioso y solicita un truco rápido para manejar el pánico escénico.",
          },
          {
            requirementId: "conversation_definir_limite_espacio",
            text: "Establece un límite claro si alguien del público invade tu espacio y pide respeto de forma cortés.",
          },
          {
            requirementId: "conversation_ofrecer_linea_alternativa",
            text: "Ofrece una línea alternativa para el coro y pide aprobación antes de usarla.",
          },
          {
            requirementId: "conversation_confirmar_volumen_voz",
            text: "Pide confirmar el volumen esperado para tu parte y repite la instrucción con tus propias palabras.",
          },
          {
            requirementId: "conversation_pedir_bajar_instrumentos",
            text: "Solicita a la banda bajar el volumen de los instrumentos para que tu voz se oiga claramente.",
          },
          {
            requirementId: "conversation_coordinar_armonias",
            text: "Confirma quién hará armonías contigo y acuerda cuál será tu nota inicial.",
          },
          {
            requirementId: "conversation_reconocer_error_repetir",
            text: "Si cometes un error, reconócelo y sugiere repetir desde un punto específico.",
          },
          {
            requirementId: "conversation_prueba_microfono",
            text: "Pide una prueba de micrófono y realiza una frase de prueba breve y clara.",
          },
          {
            requirementId: "conversation_dirigir_publico_respuesta",
            text: "Da una instrucción clara de llamada y respuesta al público y verifica que te siguen.",
          },
          {
            requirementId: "conversation_solicitar_conteo_inicio",
            text: "Solicita un conteo de inicio y repite el conteo en voz alta antes de entrar.",
          },
          {
            requirementId: "conversation_explicar_emocion_coro",
            text: "Explica brevemente qué emoción quieres transmitir con el coro y cómo debería sonar.",
          },
          {
            requirementId: "conversation_pedir_pausa_calentamiento",
            text: "Pide una pausa corta para calentar la voz y avisa cuando estés listo para continuar.",
          },
          {
            requirementId: "conversation_pedir_bateria_pulso",
            text: "Pide que la batería marque el pulso para que el público pueda aplaudir a tiempo.",
          },
          {
            requirementId: "conversation_confirmar_gestos_cortes",
            text: "Pregunta si hay gestos de mano específicos para cortes o finales y repítelos con tus manos.",
          },
          {
            requirementId: "conversation_aceptar_correccion_mostrar",
            text: "Acepta una corrección del líder y demuéstrala claramente en la siguiente repetición.",
          },
          {
            requirementId: "conversation_proponer_bis_corto",
            text: "Propón hacer un bis corto si el público lo pide y busca la aprobación del líder.",
          },
          {
            requirementId: "conversation_manejar_espectador_disruptivo",
            text: "Aborda a un espectador disruptivo con una petición educada pero firme para que coopere.",
          },
          {
            requirementId: "conversation_confirmar_estructura_tema",
            text: "Pide confirmar la estructura del número (por ejemplo, verso corto más coro por dos y final) y repítela.",
          },
          {
            requirementId: "conversation_pedir_invitar_palabra_clave",
            text: "Pregunta si puedes invitar al público a corear tu nombre o una palabra clave y espera el visto bueno.",
          },
          {
            requirementId: "conversation_anunciar_final_paso_banda",
            text: "Anuncia el final con una frase breve y da paso a la banda para el cierre.",
          },
          {
            requirementId: "english_belt_out",
            text: 'Usa el phrasal verb "belt out" para describir cómo cantarás el coro.',
          },
          {
            requirementId: "english_count_me_in",
            text: 'Di "count me in" para aceptar tu entrada al ritmo.',
          },
          {
            requirementId: "english_warm_up_my_voice",
            text: 'Emplea la expresión "warm up my voice" al pedir tiempo para prepararte.',
          },
          {
            requirementId: "english_on_cue",
            text: 'Incluye "on cue" al hablar de tu señal de entrada.',
          },
          {
            requirementId: "english_break_a_leg",
            text: 'Usa el idiom "break a leg" para animarte a ti o a la banda.',
          },
          {
            requirementId: "english_hit_the_right_note",
            text: 'Emplea el idiom "hit the right note" para referirte a la afinación adecuada.',
          },
          {
            requirementId: "english_tune_up",
            text: 'Usa el phrasal verb "tune up" al pedir que ajusten los instrumentos.',
          },
          {
            requirementId: "english_keep_the_beat",
            text: 'Incluye la collocation "keep the beat" para coordinarte con la batería.',
          },
          {
            requirementId: "english_call_and_response",
            text: 'Usa la expresión "call and response" al instruir al público.',
          },
          {
            requirementId: "english_join_in",
            text: 'Emplea el phrasal verb "join in" para invitar al público a participar.',
          },
          {
            requirementId: "english_stage_fright",
            text: 'Incluye el término "stage fright" al hablar de tus nervios.',
          },
          {
            requirementId: "english_to_be_honest",
            text: 'Usa el discourse marker "to be honest" antes de opinar sobre el tempo o la tonalidad.',
          },
          {
            requirementId: "english_pick_up_the_tempo",
            text: 'Emplea el phrasal verb "pick up the tempo" para pedir más velocidad.',
          },
          {
            requirementId: "english_bring_the_volume_down_a_notch",
            text: 'Usa la expresión "bring the volume down a notch" para solicitar menos volumen.',
          },
          {
            requirementId: "english_crowd_pleaser",
            text: 'Incluye "crowd-pleaser" para describir el coro que escogerán.',
          },
          {
            requirementId: "english_steal_the_show",
            text: 'Emplea el idiom "steal the show" para predecir la reacción del público.',
          },
          {
            requirementId: "english_in_the_spotlight",
            text: 'Usa la expresión "in the spotlight" para describir tu situación en el escenario.',
          },
          {
            requirementId: "english_sing_along",
            text: 'Incluye el phrasal verb "sing along" al guiar al público.',
          },
          {
            requirementId: "english_harmonies",
            text: 'Usa el término "harmonies" para coordinar voces con la banda.',
          },
          {
            requirementId: "english_on_the_same_wavelength",
            text: 'Emplea el idiom "on the same wavelength" para confirmar que están coordinados.',
          },
          {
            requirementId: "english_nevertheless",
            text: 'Usa el discourse marker "nevertheless" para contraponer una preocupación y seguir adelante.',
          },
          {
            requirementId: "english_encore",
            text: 'Incluye la palabra "encore" al proponer repetir el final.',
          },
          {
            requirementId: "english_mess_up",
            text: 'Emplea el phrasal verb "mess up" para reconocer un error y sugerir repetir.',
          },
          {
            requirementId: "english_crescendo",
            text: 'Usa "crescendo" para planear un aumento de intensidad hacia el final.',
          },
          {
            requirementId: "english_keep_it_short_and_sweet",
            text: 'Emplea el idiom "keep it short and sweet" para acordar un cierre breve.',
          },
        ],
      },
    ],
  },
];
