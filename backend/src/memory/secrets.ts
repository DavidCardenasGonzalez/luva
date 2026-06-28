import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

// Small shared SSM secret reader used by the memory module. Keeps the memory
// layer self-contained so it does not depend on helpers inside the large
// handler files. Values are cached per warm Lambda container.
const ssm = new SSMClient({});
const cache = new Map<string, string>();

export async function getSsmSecret(paramName: string): Promise<string> {
  const cached = cache.get(paramName);
  if (cached) return cached;
  let out;
  try {
    out = await ssm.send(
      new GetParameterCommand({ Name: paramName, WithDecryption: true })
    );
  } catch (err: any) {
    // Surface the parameter name + region so ParameterNotFound/AccessDenied is
    // actionable instead of an opaque "UnknownError".
    const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "unknown";
    throw new Error(
      `SSM getParameter failed for "${paramName}" in region "${region}": ${err?.name || "Error"}`
    );
  }
  const value = out.Parameter?.Value;
  if (!value || value === "SET_IN_SSM") {
    throw new Error(`SSM parameter ${paramName} is not configured`);
  }
  cache.set(paramName, value);
  return value;
}
