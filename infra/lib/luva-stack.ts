import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, GlobalSecondaryIndexProps, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { UserPool, AccountRecovery, OAuthScope, ProviderAttribute, UserPoolClientIdentityProvider, StringAttribute, ClientAttributes, UserPoolIdentityProviderGoogle, UserPoolIdentityProviderApple } from 'aws-cdk-lib/aws-cognito';
import { RestApi, LambdaIntegration, Deployment, Stage, Cors } from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';

export class LuvaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DynamoDB single-table
    const table = new Table(this, 'LuvaTable', {
      tableName: 'Luva',
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const gsi1: GlobalSecondaryIndexProps = {
      indexName: 'GSI1',
      partitionKey: { name: 'gsi1pk', type: AttributeType.STRING },
      sortKey: { name: 'gsi1sk', type: AttributeType.STRING },
      projectionType: undefined,
    };
    table.addGlobalSecondaryIndex(gsi1);

    const gsi2: GlobalSecondaryIndexProps = {
      indexName: 'GSI2',
      partitionKey: { name: 'gsi2pk', type: AttributeType.STRING },
      sortKey: { name: 'gsi2sk', type: AttributeType.STRING },
      projectionType: undefined,
    };
    table.addGlobalSecondaryIndex(gsi2);

    // S3 Buckets
    const audioRawBucket = new Bucket(this, 'AudioRawBucket', {
      bucketName: undefined, // Let AWS name it; set if needed
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        { expiration: Duration.days(30) },
      ],
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const publicBucket = new Bucket(this, 'PublicBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Cognito UserPool (Hosted UI)
    const userPool = new UserPool(this, 'UserPool', {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
      },
      customAttributes: {
        levelEstimate: new StringAttribute({ mutable: true }),
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
    });

    const clientReadAttrs = new ClientAttributes().withStandardAttributes({ email: true });
    const clientWriteAttrs = new ClientAttributes().withStandardAttributes({ email: true });

    const callbackUrls = [
      'exp://127.0.0.1:19000',
      'exp://localhost:19000',
      'myapp://callback',
    ];
    const logoutUrls = [
      'myapp://signout',
    ];

    const userPoolClient = userPool.addClient('AppClient', {
      oAuth: {
        callbackUrls,
        logoutUrls,
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
      },
      generateSecret: false,
      authFlows: {
        userSrp: false,
        userPassword: false,
      },
      readAttributes: clientReadAttrs,
      writeAttributes: clientWriteAttrs,
      supportedIdentityProviders: [
        UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    // Identity Providers (placeholders; configure keys in console or SSM then enable)
    // Google
    // new UserPoolIdentityProviderGoogle(this, 'Google', {
    //   clientId: 'GOOGLE_CLIENT_ID',
    //   clientSecretValue: SecretValue.unsafePlainText('GOOGLE_CLIENT_SECRET'),
    //   userPool,
    //   attributeMapping: {
    //     email: ProviderAttribute.GOOGLE_EMAIL,
    //   },
    // });

    // Apple (requires team config)
    // new UserPoolIdentityProviderApple(this, 'Apple', {
    //   clientId: 'APPLE_SERVICE_ID',
    //   keyId: 'APPLE_KEY_ID',
    //   teamId: 'APPLE_TEAM_ID',
    //   privateKey: SecretValue.unsafePlainText('APPLE_PRIVATE_KEY'),
    //   userPool,
    //   attributeMapping: {
    //     email: ProviderAttribute.APPLE_EMAIL,
    //   },
    // });

    // SSM Parameters (names only; values set outside CDK)
    const openAiKeyParam = new StringParameter(this, 'OpenAIKeyParam', {
      parameterName: '/luva/openai/apiKey',
      stringValue: 'SET_IN_SSM',
      description: 'OpenAI API key (placeholder, override in SSM)',
    });

    // Lambda: API
    const apiFnLogGroup = new LogGroup(this, 'ApiFnLogs', { retention: RetentionDays.ONE_WEEK });

    const apiFn = new NodejsFunction(this, 'ApiFunction', {
      entry: path.join(__dirname, '../../backend/src/handlers/api.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 256,
      timeout: Duration.seconds(15),
      logGroup: apiFnLogGroup,
      environment: {
        TABLE_NAME: table.tableName,
        AUDIO_BUCKET: audioRawBucket.bucketName,
        OPENAI_KEY_PARAM: openAiKeyParam.parameterName,
        STAGE: 'prod',
      },
    });

    table.grantReadWriteData(apiFn);
    audioRawBucket.grantReadWrite(apiFn);
    publicBucket.grantReadWrite(apiFn);
    apiFn.addToRolePolicy(new PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParameterHistory'],
      resources: [openAiKeyParam.parameterArn],
    }));

    // API Gateway REST
    const api = new RestApi(this, 'LuvaApi', {
      deploy: false,
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ['*'],
      },
    });

    const v1 = api.root.addResource('v1');
    const proxy = v1.addResource('{proxy+}');
    const lambdaIntegration = new LambdaIntegration(apiFn);
    proxy.addMethod('ANY', lambdaIntegration);
    v1.addMethod('ANY', lambdaIntegration); // for /v1 root

    const deployment = new Deployment(this, 'Deployment', { api });
    new Stage(this, 'ProdStage', { deployment, stageName: 'prod' });

    // Outputs: add as needed
  }
}
