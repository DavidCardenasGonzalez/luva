import { StoryDefinition } from '../types';

export const STORIES_SEED: StoryDefinition[] = [
  {
    "storyId": "london_trip",
    "title": "Viaje a Londres",
    "summary": "Un emocionante viaje a la capital inglesa.",
    "level": "B2",
    "tags": ["travel", "city", "speaking"],
    "unlockCost": 0,
    "missions": [
      {
        "missionId": "london_trip_taxi",
        "title": "Pedir un taxi",
        "sceneSummary": "Habla con un taxista para llegar al hotel cerca del estadio del Arsenal.",
        "aiRole": "Eres un taxista en Londres. Responde a las preguntas del pasajero de manera clara y amigable, proporcionando información útil sobre el viaje y los lugares turísticos cercanos.",
        "requirements": [
          {
            "requirementId": "taxi_price",
            "text": "Pregunta cuánto cuesta el viaje hasta el hotel que está a unas cuadras del estadio del Arsenal."
          },
          {
            "requirementId": "taxi_payment",
            "text": "Pregunta si se puede pagar con tarjeta o solo en efectivo."
          },
          {
            "requirementId": "taxi_suggestions",
            "text": "Pregunta al taxista por lugares turísticos que puedas visitar durante tu estadía."
          }
        ]
      },
      {
        "missionId": "london_trip_thames",
        "title": "Paseo por el río Támesis",
        "sceneSummary": "Consulta con un guía sobre los paseos en barco por el Támesis.",
        "aiRole": "Eres un guía turístico en Londres. Responde a las preguntas del pasajero de manera clara y amigable, proporcionando información útil sobre los paseos en barco y los lugares de interés cercanos.",
        "requirements": [
          {
            "requirementId": "thames_schedule",
            "text": "Pregunta por los horarios de los paseos en barco por el río Támesis."
          },
          {
            "requirementId": "thames_discounts",
            "text": "Pregunta si hay descuentos para estudiantes o grupos."
          },
          {
            "requirementId": "thames_landmarks",
            "text": "Pregunta qué puntos de interés se pueden ver durante el paseo."
          }
        ]
      }
    ]
  },
   {
    "storyId": "speed_dating_madness",
    "title": "Speed Dating Madness",
    "summary": "Cinco citas en una noche que te llevarán del amor al caos.",
    "level": "B2",
    "tags": ["dating", "conversation", "funny"],
    "unlockCost": 1,
    "missions": [
      {
        "missionId": "date_arrogant_millionaire",
        "title": "La cita con el millonario arrogante",
        "sceneSummary": "Te sientas frente a un hombre con un reloj carísimo y una sonrisa demasiado confiada.",
        "aiRole": "Eres un millonario arrogante en una cita de speed dating. Presumes de tu dinero, viajes y poder, y te gusta impresionar a la gente.",
        "caracterName": "Alexander Beaumont III",
        "caracterPrompt": "A tall, sharply dressed man in his mid-30s wearing an expensive tailored suit and a gold watch. He has slicked-back hair, a confident smirk, and exudes an air of superiority. He’s sitting in a luxurious lounge chair with a glass of champagne.",
        "requirements": [
          {
            "requirementId": "ask_job",
            "text": "Pregúntale a qué se dedica."
          },
          {
            "requirementId": "respond_to_boast",
            "text": "Reacciona a cuando presuma de su riqueza o logros."
          },
          {
            "requirementId": "personal_question",
            "text": "Hazle una pregunta personal para ver si tiene un lado más humano."
          }
        ]
      },
      {
        "missionId": "date_ex_obsessed",
        "title": "La cita con la chica obsesionada con su ex",
        "sceneSummary": "Parece dulce y simpática… hasta que menciona a su ex por quinta vez en dos minutos.",
        "aiRole": "Eres una chica simpática pero completamente obsesionada con tu ex. Lo mencionas en cada conversación sin darte cuenta.",
        "caracterName": "Sophie Carter",
        "caracterPrompt": "A woman in her late 20s with curly red hair, casual chic clothes, and a slightly anxious expression. She holds a cup of coffee and often glances at her phone as if expecting a message.",
        "requirements": [
          {
            "requirementId": "ask_hobbies",
            "text": "Pregúntale sobre sus hobbies o intereses."
          },
          {
            "requirementId": "change_topic",
            "text": "Intenta cambiar de tema cuando empiece a hablar de su ex."
          },
          {
            "requirementId": "talk_about_relationships",
            "text": "Pregunta qué busca en una relación ahora."
          }
        ]
      },
      {
        "missionId": "date_boring_person",
        "title": "La cita con la persona más aburrida del mundo",
        "sceneSummary": "La conversación es tan monótona que hasta el reloj parece ir más lento.",
        "aiRole": "Eres una persona extremadamente aburrida que habla solo de datos y detalles insignificantes. Tu tono es plano y monótono.",
        "caracterName": "Nigel Smith",
        "caracterPrompt": "A man in his early 40s wearing a beige cardigan and glasses. He has a neutral facial expression and is holding a notepad with trivia facts.",
        "requirements": [
          {
            "requirementId": "start_conversation",
            "text": "Inicia la conversación con una pregunta simple."
          },
          {
            "requirementId": "show_interest",
            "text": "Haz un esfuerzo por mostrar interés en sus temas aburridos."
          },
          {
            "requirementId": "introduce_fun_topic",
            "text": "Introduce un tema más interesante y ve si cambia su actitud."
          }
        ]
      },
      {
        "missionId": "date_hippie",
        "title": "La cita con la persona hippie",
        "sceneSummary": "Su aura es tan brillante que casi necesitas gafas de sol. Habla de energías, chakras y viajes espirituales.",
        "aiRole": "Eres una persona hippie amante de la naturaleza, la espiritualidad y el universo. Hablas en metáforas y usas frases profundas.",
        "caracterName": "Luna Starseed",
        "caracterPrompt": "A free-spirited person in their early 30s wearing colorful, flowing clothes and handmade jewelry. They have long wavy hair, carry crystals in a pouch, and speak with a calm, dreamy voice.",
        "requirements": [
          {
            "requirementId": "ask_beliefs",
            "text": "Pregúntale sobre sus creencias o filosofía de vida."
          },
          {
            "requirementId": "react_to_metaphor",
            "text": "Reacciona a una metáfora o frase espiritual que diga."
          },
          {
            "requirementId": "talk_travel",
            "text": "Habla sobre viajes o experiencias espirituales."
          }
        ]
      },
      {
        "missionId": "date_wants_to_marry",
        "title": "La cita con quien quiere casarse mañana",
        "sceneSummary": "Ni siquiera han traído las bebidas y ya está hablando de los nombres de sus futuros hijos.",
        "aiRole": "Eres una persona romántica desesperada por encontrar el amor verdadero. Quieres casarte lo antes posible y lo dejas muy claro desde el principio.",
        "caracterName": "Emily Johnson",
        "caracterPrompt": "A cheerful woman in her early 30s wearing a bright floral dress and a heart-shaped necklace. She has an excited expression and speaks quickly about future plans.",
        "requirements": [
          {
            "requirementId": "react_to_marriage",
            "text": "Reacciona cuando mencione casarse muy pronto."
          },
          {
            "requirementId": "ask_future_plans",
            "text": "Pregúntale sobre sus planes de futuro."
          },
          {
            "requirementId": "talk_about_relationship_goals",
            "text": "Habla de lo que tú buscas en una relación."
          }
        ]
      }
    ]
  }
]
