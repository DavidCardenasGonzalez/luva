import { DynamoDBClient, ScanCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-providers";

const region = "us-west-2"; // Reemplaza 'us-west-2' con la región en la que se encuentra tu tabla
const awsProfileName = "david";
const credentials = fromIni({
  profile: awsProfileName,
});

// Configura el cliente de DynamoDB con el perfil especificado
const dynamodbClient = new DynamoDBClient({
  region: region,
  credentials: credentials,
});

const tableName = "Bodazen-DatabaseCardTableAEE1226B-12G6AZZGEINOX";

async function borrarRegistrosEnLote(categoryId, lote) {
  try {
    // Parámetros de consulta para escanear la tabla
    const scanParams = {
      TableName: tableName,
      FilterExpression: "#categoryId = :categoryId AND #lote = :lote",
      ExpressionAttributeNames: {
        "#categoryId": "categoryId",
        "#lote": "lote"
      },
      ExpressionAttributeValues: {
        ":categoryId": { S: categoryId },
        ":lote": { S: lote }
      }
    };

    // Escanear la tabla para encontrar los registros con categoryId y lote específicos
    const scanCommand = new ScanCommand(scanParams);
    const scanResults = await dynamodbClient.send(scanCommand);
    console.log(`Registros encontrados: ${scanResults.Count}`);

    // Eliminar los registros encontrados en lotes
    const deletePromises = scanResults.Items.map(async (item) => {
      const deleteParams = {
        TableName: tableName,
        Key: {
          categoryId: item.categoryId,
          PK: item.PK
        }
      };
      const deleteCommand = new DeleteItemCommand(deleteParams);
      await dynamodbClient.send(deleteCommand);
    });

    await Promise.all(deletePromises);

    console.log(`Registros con categoryId: ${categoryId} y lote: ${lote} borrados exitosamente.`);
  } catch (error) {
    console.error("Ocurrió un error:", error);
  }
}

// Llamar a la función para iniciar el proceso de borrado en lote
const categoryId = "2v6Y5OXroYvvWQAHS6e005rCh3V"; // categoryId que ya está hardcodeado
const lote = "47"; // Número de lote a borrar
borrarRegistrosEnLote(categoryId, lote);
