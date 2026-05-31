/**
 * One-shot migration that strips legacy story/mission fields from CharacterPostsTable
 * records while validating that each post is still linked to its character via
 * the partition key (characterId).
 *
 * Legacy attributes removed: storyId, missionId, sceneIndex, storyTitle, missionTitle.
 *
 * Usage:
 *   CHARACTER_POSTS_TABLE_NAME=... AWS_REGION=us-east-1 node scripts/migrate-character-posts.js [--dry-run]
 */

const {
  DynamoDBClient,
} = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
  UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');

const LEGACY_FIELDS = ['storyId', 'missionId', 'sceneIndex', 'storyTitle', 'missionTitle'];

async function main() {
  const tableName = process.env.CHARACTER_POSTS_TABLE_NAME;
  if (!tableName) {
    console.error('CHARACTER_POSTS_TABLE_NAME not set');
    process.exit(1);
  }
  const dryRun = process.argv.includes('--dry-run');
  const client = new DynamoDBClient({});
  const dynamo = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });

  console.log(`Scanning ${tableName}${dryRun ? ' (dry-run)' : ''}...`);

  let scanned = 0;
  let updated = 0;
  let mismatches = 0;
  let skipped = 0;
  let exclusiveStartKey;

  do {
    const page = await dynamo.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );
    for (const item of page.Items || []) {
      scanned += 1;
      const characterId = typeof item.characterId === 'string' ? item.characterId : undefined;
      const postId = typeof item.postId === 'string' ? item.postId : undefined;
      if (!characterId || !postId) {
        console.warn('Skipping record with missing key:', item);
        skipped += 1;
        continue;
      }

      const legacyPresent = LEGACY_FIELDS.filter((field) =>
        Object.prototype.hasOwnProperty.call(item, field),
      );
      if (legacyPresent.length === 0) {
        skipped += 1;
        continue;
      }

      // Sanity check: characterId should equal `${storyId}:${missionId}` when both exist.
      if (typeof item.storyId === 'string' && typeof item.missionId === 'string') {
        const expected = `${item.storyId}:${item.missionId}`;
        if (expected !== characterId) {
          console.warn(
            `Mismatch on ${characterId}/${postId}: storyId+missionId='${expected}' != characterId.`,
          );
          mismatches += 1;
        }
      }

      const expressionNames = {};
      for (const field of legacyPresent) {
        expressionNames[`#${field}`] = field;
      }
      const removeExpression = `REMOVE ${legacyPresent.map((field) => `#${field}`).join(', ')}`;

      if (dryRun) {
        console.log(`[dry-run] would remove ${legacyPresent.join(', ')} from ${characterId}/${postId}`);
      } else {
        await dynamo.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { characterId, postId },
            UpdateExpression: removeExpression,
            ExpressionAttributeNames: expressionNames,
            ConditionExpression: 'attribute_exists(characterId) AND attribute_exists(postId)',
          }),
        );
      }
      updated += 1;
    }
    exclusiveStartKey = page.LastEvaluatedKey;
  } while (exclusiveStartKey);

  console.log(
    JSON.stringify(
      {
        scanned,
        updated,
        skipped,
        mismatches,
        dryRun,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
