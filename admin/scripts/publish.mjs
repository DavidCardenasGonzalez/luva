import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectDir = path.resolve(__dirname, '..')
const distDir = path.join(projectDir, 'dist')

const stackName = process.env.LUVA_INFRA_STACK_NAME?.trim() || 'LuvaStack'
const awsProfile = (
  process.env.LUVA_AWS_PROFILE
  ?? process.env.AWS_PROFILE
  ?? 'david'
).trim()

if (!existsSync(distDir)) {
  throw new Error(`No encontré ${distDir}. Ejecuta primero npm run build.`)
}

const resolvedOutputs = resolveAdminPortalOutputs()
const bucketName = resolvedOutputs.bucketName
const distributionId = resolvedOutputs.distributionId
const portalUrl = resolvedOutputs.portalUrl

runAws(['s3', 'sync', 'dist/', `s3://${bucketName}`, '--delete'], { cwd: projectDir })
runAws(['cloudfront', 'create-invalidation', '--distribution-id', distributionId, '--paths', '/*'])

if (portalUrl) {
  console.log(`Admin publicado en ${portalUrl}`)
} else {
  console.log(`Admin publicado. Distribución invalidada: ${distributionId}`)
}

function resolveAdminPortalOutputs() {
  const envBucketName = process.env.LUVA_ADMIN_PORTAL_BUCKET?.trim()
  const envDistributionId = process.env.LUVA_ADMIN_PORTAL_DISTRIBUTION_ID?.trim()
  const envPortalUrl = process.env.LUVA_ADMIN_PORTAL_URL?.trim()

  if (envBucketName && envDistributionId) {
    return {
      bucketName: envBucketName,
      distributionId: envDistributionId,
      portalUrl: envPortalUrl,
    }
  }

  const outputs = getStackOutputs(stackName)
  const bucketName = envBucketName || outputs.get('AdminPortalBucketName')
  const distributionId = envDistributionId || outputs.get('AdminPortalDistributionId')
  const portalUrl = envPortalUrl || outputs.get('AdminPortalUrl')

  if (!bucketName || !distributionId) {
    throw new Error(
      `No pude resolver AdminPortalBucketName/AdminPortalDistributionId en el stack ${stackName}. ` +
      'Despliega infra primero o define LUVA_ADMIN_PORTAL_BUCKET y LUVA_ADMIN_PORTAL_DISTRIBUTION_ID.'
    )
  }

  return { bucketName, distributionId, portalUrl }
}

function getStackOutputs(targetStackName) {
  const output = execFileSync(
    'aws',
    withProfile([
      'cloudformation',
      'describe-stacks',
      '--stack-name',
      targetStackName,
      '--query',
      'Stacks[0].Outputs',
      '--output',
      'json',
    ]),
    {
      cwd: projectDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  const outputs = JSON.parse(output)
  const pairs = Array.isArray(outputs)
    ? outputs
        .filter((item) => item && typeof item.OutputKey === 'string' && typeof item.OutputValue === 'string')
        .map((item) => [item.OutputKey, item.OutputValue])
    : []

  return new Map(pairs)
}

function runAws(args, options = {}) {
  execFileSync('aws', withProfile(args), {
    cwd: projectDir,
    stdio: 'inherit',
    ...options,
  })
}

function withProfile(args) {
  return awsProfile ? [...args, '--profile', awsProfile] : args
}
