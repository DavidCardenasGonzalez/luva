import { CfnOutput, Duration, RemovalPolicy, SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, GlobalSecondaryIndexProps, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import {
  UserPool,
  AccountRecovery,
  OAuthScope,
  ProviderAttribute,
  UserPoolClientIdentityProvider,
  StringAttribute,
  ClientAttributes,
  UserPoolIdentityProviderGoogle,
  UserPoolIdentityProviderApple,
} from 'aws-cdk-lib/aws-cognito';
import {
  RestApi,
  LambdaIntegration,
  Deployment,
  Stage,
  Cors,
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
} from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';

export class LuvaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const splitCsv = (value: string | undefined, fallback: string[]): string[] => {
      const items = (value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      return items.length ? items : fallback;
    };
    const sanitizeDomainPrefix = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 63);

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

    const usersTable = new Table(this, 'LuvaUsersTable', {
      partitionKey: { name: 'email', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });

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
    const userPool = new UserPool(this, 'AuthUserPoolV2', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      customAttributes: {
        levelEstimate: new StringAttribute({ mutable: true }),
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
    });

    const clientReadAttrs = new ClientAttributes().withStandardAttributes({
      email: true,
      emailVerified: true,
      fullname: true,
      givenName: true,
      familyName: true,
      profilePicture: true,
    });
    const clientWriteAttrs = new ClientAttributes().withStandardAttributes({
      email: true,
      fullname: true,
      givenName: true,
      familyName: true,
      profilePicture: true,
    });

    const callbackUrls = splitCsv(process.env.COGNITO_CALLBACK_URLS, ['myapp://callback']);
    const logoutUrls = splitCsv(process.env.COGNITO_LOGOUT_URLS, callbackUrls);
    const domainPrefix = sanitizeDomainPrefix(
      process.env.COGNITO_DOMAIN_PREFIX || `luva-${this.stackName}-${this.account}-${this.region}`
    );
    const userPoolDomain = userPool.addDomain('HostedUiDomainV2', {
      cognitoDomain: { domainPrefix },
    });

    const supportedIdentityProviders: UserPoolClientIdentityProvider[] = [
      UserPoolClientIdentityProvider.COGNITO,
    ];
    const identityProviders: Construct[] = [];

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (googleClientId && googleClientSecret) {
      const googleProvider = new UserPoolIdentityProviderGoogle(this, 'GoogleProviderV2', {
        clientId: googleClientId,
        clientSecretValue: SecretValue.unsafePlainText(googleClientSecret),
        scopes: ['openid', 'email', 'profile'],
        userPool,
        attributeMapping: {
          email: ProviderAttribute.GOOGLE_EMAIL,
          emailVerified: ProviderAttribute.GOOGLE_EMAIL_VERIFIED,
          fullname: ProviderAttribute.GOOGLE_NAME,
          givenName: ProviderAttribute.GOOGLE_GIVEN_NAME,
          familyName: ProviderAttribute.GOOGLE_FAMILY_NAME,
          profilePicture: ProviderAttribute.GOOGLE_PICTURE,
        },
      });
      supportedIdentityProviders.push(UserPoolClientIdentityProvider.GOOGLE);
      identityProviders.push(googleProvider);
    }

    const appleClientId = process.env.APPLE_SERVICE_ID;
    const appleTeamId = process.env.APPLE_TEAM_ID;
    const appleKeyId = process.env.APPLE_KEY_ID;
    const applePrivateKey = process.env.APPLE_PRIVATE_KEY;
    if (appleClientId && appleTeamId && appleKeyId && applePrivateKey) {
      const appleProvider = new UserPoolIdentityProviderApple(this, 'AppleProviderV2', {
        clientId: appleClientId,
        teamId: appleTeamId,
        keyId: appleKeyId,
        privateKeyValue: SecretValue.unsafePlainText(applePrivateKey),
        userPool,
        attributeMapping: {
          email: ProviderAttribute.APPLE_EMAIL,
          emailVerified: ProviderAttribute.APPLE_EMAIL_VERIFIED,
          fullname: ProviderAttribute.APPLE_NAME,
          givenName: ProviderAttribute.APPLE_FIRST_NAME,
          familyName: ProviderAttribute.APPLE_LAST_NAME,
        },
      });
      supportedIdentityProviders.push(UserPoolClientIdentityProvider.APPLE);
      identityProviders.push(appleProvider);
    }

    const userPoolClient = userPool.addClient('AppClientV2', {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        callbackUrls,
        logoutUrls,
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
      },
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: false,
      },
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(1460),
      refreshTokenRotationGracePeriod: Duration.seconds(30),
      enableTokenRevocation: true,
      readAttributes: clientReadAttrs,
      writeAttributes: clientWriteAttrs,
      supportedIdentityProviders,
    });
    identityProviders.forEach((provider) => userPoolClient.node.addDependency(provider));

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
      timeout: Duration.seconds(30),
      logGroup: apiFnLogGroup,
      environment: {
        TABLE_NAME: table.tableName,
        AUDIO_BUCKET: audioRawBucket.bucketName,
        OPENAI_KEY_PARAM: openAiKeyParam.parameterName,
        OPENAI_CHAT_MODEL: 'gpt-4.1-nano',
        EVAL_TIMEOUT_MS: '20000',
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

    const usersFnLogGroup = new LogGroup(this, 'UsersFnLogs', { retention: RetentionDays.ONE_WEEK });
    const usersFn = new NodejsFunction(this, 'UsersFunction', {
      entry: path.join(__dirname, '../../backend/src/handlers/users.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 256,
      timeout: Duration.seconds(15),
      logGroup: usersFnLogGroup,
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        STAGE: 'prod',
      },
    });
    usersTable.grantReadWriteData(usersFn);

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
    const usersAuthorizer = new CognitoUserPoolsAuthorizer(this, 'UsersAuthorizerV2', {
      cognitoUserPools: [userPool],
    });
    const users = v1.addResource('users');
    const usersMe = users.addResource('me');
    const usersMeProgress = usersMe.addResource('progress');
    const proxy = v1.addResource('{proxy+}');
    const lambdaIntegration = new LambdaIntegration(apiFn);
    const usersLambdaIntegration = new LambdaIntegration(usersFn);
    usersMe.addMethod('GET', usersLambdaIntegration, {
      authorizer: usersAuthorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    usersMe.addMethod('POST', usersLambdaIntegration, {
      authorizer: usersAuthorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    usersMeProgress.addMethod('GET', usersLambdaIntegration, {
      authorizer: usersAuthorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    usersMeProgress.addMethod('POST', usersLambdaIntegration, {
      authorizer: usersAuthorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    proxy.addMethod('ANY', lambdaIntegration);
    v1.addMethod('ANY', lambdaIntegration); // for /v1 root

    const deployment = new Deployment(this, 'Deployment', { api });
    const prodStage = new Stage(this, 'ProdStage', { deployment, stageName: 'prod' });

    new CfnOutput(this, 'ApiBaseUrl', {
      value: prodStage.urlForPath('/v1'),
    });
    new CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
    });
    new CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
    });
    new CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
    new CfnOutput(this, 'HostedUiDomain', {
      value: userPoolDomain.baseUrl(),
    });
  }
}
