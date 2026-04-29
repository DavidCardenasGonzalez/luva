import type { APIGatewayProxyResultV2 as Result } from "aws-lambda";

const ROUTE_PREFIX = "/v1";

const ONBOARDING_STEPS = [
  {
    stepNumber: 1,
    eyebrow: "Feedback inmediato",
    title: "Bienvenido a Luva",
    subtitle: "Tu compañero para hablar, aprender y crecer en ingles.",
    primaryCta: "Comenzar",
    conversation: [
      {
        id: "learner-rain",
        role: "learner",
        text: "I'm very tired",
        delayMs: 350,
      },
      {
        id: "luvi-rain",
        role: "luvi",
        text: "Sounds like you need a break.",
        delayMs: 1100,
      },
      {
        id: "feedback-rain",
        role: "feedback",
        text: "Correctness: 98% (Correcto)\nReformulaciones sugeridas\n- I'm exhausted.\n- I'm drained.",
        delayMs: 1850,
      },
    ],
  },
  {
    stepNumber: 2,
    eyebrow: "Personalización",
    title: "Creamos un plan para ti",
    subtitle: "Selecciona las frases que más se parecen a ti para personalizar tu ruta de aprendizaje.",
    primaryCta: "Continuar",
  },
  {
    stepNumber: 3,
    eyebrow: "Elige tu compañero",
    title: "Elige a tu compañero de inglés",
    subtitle: "Practicarás conversaciones reales y mejorarás hablando con tu nuevo amigo de IA.",
    primaryCta: "Comenzar",
  },
  {
    stepNumber: 4,
    eyebrow: "Tu primera misión",
    title: "Preséntate en inglés",
    subtitle: "Cuéntanos quién eres y por qué quieres aprender inglés.",
    primaryCta: "",
  },
];

export const handler = async (event: any): Promise<Result> => {
  const method: string =
    event.httpMethod || event.requestContext?.http?.method || "GET";
  const rawPath: string =
    event.resource && event.path
      ? event.path
      : event.requestContext?.http?.path || "/";
  const path = rawPath.startsWith(ROUTE_PREFIX)
    ? rawPath
    : `${ROUTE_PREFIX}${rawPath}`;

  if (method === "OPTIONS") {
    return json(204, undefined);
  }

  if (method === "GET" && path === `${ROUTE_PREFIX}/onboarding`) {
    return json(200, {
      version: "2026-04-27-onboarding-v1",
      steps: ONBOARDING_STEPS,
    });
  }

  return json(404, {
    code: "NOT_FOUND",
    message: "Onboarding route not found",
  });
};

function json(statusCode: number, body: unknown): Result {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}
