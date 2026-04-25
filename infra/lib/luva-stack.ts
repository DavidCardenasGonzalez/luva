import { CfnOutput, Duration, RemovalPolicy, SecretValue, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, BillingMode, GlobalSecondaryIndexProps, ProjectionType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Bucket, BlockPublicAccess, HttpMethods } from 'aws-cdk-lib/aws-s3';
import {
  UserPool,
  CfnUserPoolGroup,
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
  Distribution,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
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
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
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
    const ensureTrailingSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`);
    const uniqueStrings = (values: string[]) => [...new Set(values.filter(Boolean))];
    const configuredBrowserOrigins = splitCsv(process.env.COGNITO_CALLBACK_URLS, [
      'http://localhost:5173/',
      'http://localhost:5174/',
      'https://www.luvaenglish.com/',
      'https://d3i98h9bcz5u45.cloudfront.net/'
    ])
      .filter((origin) => /^https?:\/\//.test(origin))
      .map((origin) => origin.replace(/\/$/, ''));

    const adminPortalBucket = new Bucket(this, 'AdminPortalBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const adminPortalDistribution = new Distribution(this, 'AdminPortalDistribution', {
      comment: 'Luva admin portal',
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(adminPortalBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(1),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.minutes(1),
        },
      ],
    });
    const adminPortalUrl = `https://${adminPortalDistribution.domainName}`;
    const adminPortalRedirectUrl = ensureTrailingSlash(adminPortalUrl);
    const adminTikTokRedirectUri =
      process.env.TIKTOK_REDIRECT_URI || `${adminPortalRedirectUrl}integrations/tiktok`;
    const browserOrigins = uniqueStrings([
      ...configuredBrowserOrigins,
      adminPortalUrl,
    ]);

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

    const generatedVideosTable = new Table(this, 'GeneratedVideosTable', {
      partitionKey: { name: 'storyId', type: AttributeType.STRING },
      sortKey: { name: 'videoId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    generatedVideosTable.addGlobalSecondaryIndex({
      indexName: 'StatusPublishOnIndex',
      partitionKey: { name: 'status', type: AttributeType.STRING },
      sortKey: { name: 'publishOn', type: AttributeType.STRING },
      projectionType: ProjectionType.ALL,
    });

    const feedPostsTable = new Table(this, 'FeedPostsTable', {
      partitionKey: { name: 'postId', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    feedPostsTable.addGlobalSecondaryIndex({
      indexName: 'FeedPostsByOrderIndex',
      partitionKey: { name: 'feedPk', type: AttributeType.STRING },
      sortKey: { name: 'order', type: AttributeType.NUMBER },
      projectionType: ProjectionType.ALL,
    });

    const friendshipsTable = new Table(this, 'FriendshipsTable', {
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      sortKey: { name: 'friendId', type: AttributeType.STRING },
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

    const generatedVideosBucket = new Bucket(this, 'GeneratedVideosBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      cors: [
        {
          allowedOrigins: browserOrigins,
          allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.HEAD],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
    });

    const configuredAssetsBucketName = process.env.ASSETS_BUCKET_NAME?.trim();
    const assetsBucket = new Bucket(this, 'AssetsBucket', {
      ...(configuredAssetsBucketName ? { bucketName: configuredAssetsBucketName } : {}),
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      cors: [
        {
          allowedOrigins: browserOrigins,
          allowedMethods: [HttpMethods.GET, HttpMethods.PUT, HttpMethods.HEAD],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3000,
        },
      ],
    });

    const assetsDistribution = new Distribution(this, 'AssetsDistribution', {
      comment: 'Luva assets',
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(assetsBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });
    const assetsCloudFrontUrl = `https://${assetsDistribution.domainName}`;

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

    new CfnUserPoolGroup(this, 'AdminUserGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'admin',
      description: 'Admin access for the Luva admin portal',
      precedence: 0,
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

    const defaultCallbackUrls = [
      'myapp://callback',
      'http://localhost:5173/',
      'https://www.luvaenglish.com/',
    ];
    const callbackUrls = uniqueStrings([
      ...splitCsv(process.env.COGNITO_CALLBACK_URLS, defaultCallbackUrls),
      adminPortalRedirectUrl,
    ]);
    const logoutUrls = uniqueStrings([
      ...splitCsv(process.env.COGNITO_LOGOUT_URLS, callbackUrls),
      adminPortalRedirectUrl,
    ]);
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
        userPassword: true,
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
    const googleTranslateKeyParamName = '/luva/google/translateApiKey';
    const googleTranslateKeyParamArn = `arn:aws:ssm:${this.region}:${this.account}:parameter${googleTranslateKeyParamName}`;
    const instagramAccessTokenParam = new StringParameter(this, 'InstagramAccessTokenParam', {
      parameterName: '/luva/social/instagram/accessToken',
      stringValue: 'SET_IN_SSM',
      description: 'Instagram Graph API access token for automated publishing',
    });
    const tiktokAccessTokenParam = new StringParameter(this, 'TikTokAccessTokenParam', {
      parameterName: '/luva/social/tiktok/accessToken',
      stringValue: 'SET_IN_SSM',
      description: 'TikTok Content Posting API access token for automated publishing',
    });
    const tiktokRefreshTokenParam = new StringParameter(this, 'TikTokRefreshTokenParam', {
      parameterName: '/luva/social/tiktok/refreshToken',
      stringValue: 'SET_IN_SSM',
      description: 'TikTok OAuth refresh token for administrative publishing',
    });
    const tiktokTokenMetaParam = new StringParameter(this, 'TikTokTokenMetaParam', {
      parameterName: '/luva/social/tiktok/tokenMeta',
      stringValue: 'SET_IN_SSM',
      description: 'TikTok OAuth token metadata stored by the admin portal',
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
        FRIENDSHIPS_TABLE_NAME: friendshipsTable.tableName,
        FEED_POSTS_TABLE_NAME: feedPostsTable.tableName,
        FEED_POSTS_BY_ORDER_INDEX_NAME: 'FeedPostsByOrderIndex',
        AUDIO_BUCKET: audioRawBucket.bucketName,
        OPENAI_KEY_PARAM: openAiKeyParam.parameterName,
        GOOGLE_TRANSLATE_API_KEY_PARAM: googleTranslateKeyParamName,
        OPENAI_CHAT_MODEL: 'gpt-5.4-nano',
        EVAL_TIMEOUT_MS: '20000',
        STAGE: 'prod',
      },
    });

    table.grantReadWriteData(apiFn);
    friendshipsTable.grantReadWriteData(apiFn);
    feedPostsTable.grantReadData(apiFn);
    audioRawBucket.grantReadWrite(apiFn);
    publicBucket.grantReadWrite(apiFn);
    apiFn.addToRolePolicy(new PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParameterHistory'],
      resources: [openAiKeyParam.parameterArn, googleTranslateKeyParamArn],
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

    const adminFnLogGroup = new LogGroup(this, 'AdminFnLogs', { retention: RetentionDays.ONE_WEEK });
    const adminFn = new NodejsFunction(this, 'AdminFunction', {
      entry: path.join(__dirname, '../../backend/src/handlers/admin.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 256,
      timeout: Duration.seconds(60),
      logGroup: adminFnLogGroup,
      environment: {
        USERS_TABLE_NAME: usersTable.tableName,
        GENERATED_VIDEOS_TABLE_NAME: generatedVideosTable.tableName,
        FEED_POSTS_TABLE_NAME: feedPostsTable.tableName,
        FEED_POSTS_BY_ORDER_INDEX_NAME: 'FeedPostsByOrderIndex',
        REVENUECAT_SECRET_KEY: process.env.REVENUECAT_SECRET_KEY || '',
        REVENUECAT_ENTITLEMENT_ID: process.env.REVENUECAT_ENTITLEMENT_ID || 'Luva Pro',
        TIKTOK_CLIENT_KEY: process.env.TIKTOK_CLIENT_KEY || '',
        TIKTOK_CLIENT_SECRET: process.env.TIKTOK_CLIENT_SECRET || '',
        TIKTOK_REDIRECT_URI: adminTikTokRedirectUri,
        TIKTOK_AUTH_SCOPES: process.env.TIKTOK_AUTH_SCOPES || 'video.publish',
        TIKTOK_ACCESS_TOKEN_PARAM: tiktokAccessTokenParam.parameterName,
        TIKTOK_REFRESH_TOKEN_PARAM: tiktokRefreshTokenParam.parameterName,
        TIKTOK_TOKEN_META_PARAM: tiktokTokenMetaParam.parameterName,
        ASSETS_BUCKET_NAME: assetsBucket.bucketName,
        ASSETS_CLOUDFRONT_DOMAIN_NAME: assetsDistribution.domainName,
        ASSETS_CLOUDFRONT_URL: assetsCloudFrontUrl,
        STAGE: 'prod',
      },
    });
    usersTable.grantReadWriteData(adminFn);
    generatedVideosTable.grantReadWriteData(adminFn);
    feedPostsTable.grantReadWriteData(adminFn);
    generatedVideosBucket.grantReadWrite(adminFn);
    assetsBucket.grantReadWrite(adminFn);
    adminFn.addToRolePolicy(new PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParameterHistory', 'ssm:PutParameter'],
      resources: [
        tiktokAccessTokenParam.parameterArn,
        tiktokRefreshTokenParam.parameterArn,
        tiktokTokenMetaParam.parameterArn,
      ],
    }));

    const videoPublisherFnLogGroup = new LogGroup(this, 'VideoPublisherFnLogs', {
      retention: RetentionDays.ONE_WEEK,
    });
    const videoPublisherFn = new NodejsFunction(this, 'VideoPublisherFunction', {
      entry: path.join(__dirname, '../../backend/src/handlers/video-publisher.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_18_X,
      memorySize: 1024,
      timeout: Duration.minutes(6),
      logGroup: videoPublisherFnLogGroup,
      environment: {
        GENERATED_VIDEOS_TABLE_NAME: generatedVideosTable.tableName,
        GENERATED_VIDEOS_STATUS_PUBLISH_ON_INDEX_NAME: 'StatusPublishOnIndex',
        GENERATED_VIDEOS_BUCKET_NAME: generatedVideosBucket.bucketName,
        INSTAGRAM_AUTOPUBLISH_ENABLED: process.env.INSTAGRAM_AUTOPUBLISH_ENABLED || 'false',
        INSTAGRAM_ACCESS_TOKEN_PARAM: instagramAccessTokenParam.parameterName,
        INSTAGRAM_IG_USER_ID: process.env.INSTAGRAM_IG_USER_ID || '',
        INSTAGRAM_GRAPH_API_VERSION: process.env.INSTAGRAM_GRAPH_API_VERSION || 'v23.0',
        INSTAGRAM_SHARE_TO_FEED: process.env.INSTAGRAM_SHARE_TO_FEED || 'false',
        TIKTOK_AUTOPUBLISH_ENABLED: process.env.TIKTOK_AUTOPUBLISH_ENABLED || 'false',
        TIKTOK_ACCESS_TOKEN_PARAM: tiktokAccessTokenParam.parameterName,
        TIKTOK_DEFAULT_PRIVACY_LEVEL: process.env.TIKTOK_DEFAULT_PRIVACY_LEVEL || 'SELF_ONLY',
        TIKTOK_DISABLE_COMMENT: process.env.TIKTOK_DISABLE_COMMENT || 'false',
        TIKTOK_DISABLE_DUET: process.env.TIKTOK_DISABLE_DUET || 'false',
        TIKTOK_DISABLE_STITCH: process.env.TIKTOK_DISABLE_STITCH || 'false',
        SOCIAL_POST_CAPTION_SUFFIX: process.env.SOCIAL_POST_CAPTION_SUFFIX || '',
        STAGE: 'prod',
      },
    });
    generatedVideosTable.grantReadWriteData(videoPublisherFn);
    generatedVideosBucket.grantRead(videoPublisherFn);
    videoPublisherFn.addToRolePolicy(new PolicyStatement({
      actions: ['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParameterHistory'],
      resources: [
        instagramAccessTokenParam.parameterArn,
        tiktokAccessTokenParam.parameterArn,
      ],
    }));
    new Rule(this, 'VideoPublisherScheduleRule', {
      schedule: Schedule.rate(Duration.minutes(7)),
      targets: [new LambdaFunction(videoPublisherFn)],
    });

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
    const friends = v1.addResource('friends');
    const friendById = friends.addResource('{friendId}');
    const friendChat = friendById.addResource('chat');
    const admin = v1.addResource('admin');
    const adminProxy = admin.addResource('{proxy+}');
    const proxy = v1.addResource('{proxy+}');
    const lambdaIntegration = new LambdaIntegration(apiFn);
    const usersLambdaIntegration = new LambdaIntegration(usersFn);
    const adminLambdaIntegration = new LambdaIntegration(adminFn);
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
    friends.addMethod('GET', lambdaIntegration, {
      authorizer: usersAuthorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    friends.addMethod('POST', lambdaIntegration, {
      authorizer: usersAuthorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    friendChat.addMethod('POST', lambdaIntegration, {
      authorizer: usersAuthorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    admin.addMethod('ANY', adminLambdaIntegration, {
      authorizer: usersAuthorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    adminProxy.addMethod('ANY', adminLambdaIntegration, {
      authorizer: usersAuthorizer,
      authorizationType: AuthorizationType.COGNITO,
    });
    proxy.addMethod('ANY', lambdaIntegration);
    v1.addMethod('ANY', lambdaIntegration); // for /v1 root

    const deployment = new Deployment(this, 'Deployment', { api });
    deployment.addToLogicalId({
      routeManifestVersion: '2026-04-24-friends-v1',
      routes: {
        apiRoot: ['ANY /v1', 'ANY /v1/{proxy+}'],
        users: [
          'GET /v1/users/me',
          'POST /v1/users/me',
          'GET /v1/users/me/progress',
          'POST /v1/users/me/progress',
        ],
        friends: [
          'GET /v1/friends',
          'POST /v1/friends',
          'POST /v1/friends/{friendId}/chat',
        ],
        admin: [
          'ANY /v1/admin',
          'ANY /v1/admin/{proxy+}',
        ],
      },
      authorizer: 'cognito-user-pool-v2',
    });
    const prodStage = new Stage(this, 'ProdStage', { deployment, stageName: 'prod' });

    new CfnOutput(this, 'ApiBaseUrl', {
      value: prodStage.urlForPath('/v1'),
    });
    new CfnOutput(this, 'AdminApiBaseUrl', {
      value: prodStage.urlForPath('/v1/admin'),
    });
    new CfnOutput(this, 'AdminPortalBucketName', {
      value: adminPortalBucket.bucketName,
    });
    new CfnOutput(this, 'AdminPortalDistributionId', {
      value: adminPortalDistribution.distributionId,
    });
    new CfnOutput(this, 'AdminPortalUrl', {
      value: adminPortalUrl,
    });
    new CfnOutput(this, 'TikTokRedirectUri', {
      value: adminTikTokRedirectUri,
    });
    new CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
    });
    new CfnOutput(this, 'GeneratedVideosTableName', {
      value: generatedVideosTable.tableName,
    });
    new CfnOutput(this, 'FeedPostsTableName', {
      value: feedPostsTable.tableName,
    });
    new CfnOutput(this, 'FriendshipsTableName', {
      value: friendshipsTable.tableName,
    });
    new CfnOutput(this, 'GeneratedVideosBucketName', {
      value: generatedVideosBucket.bucketName,
    });
    new CfnOutput(this, 'AssetsBucketName', {
      value: assetsBucket.bucketName,
    });
    new CfnOutput(this, 'AssetsDistributionId', {
      value: assetsDistribution.distributionId,
    });
    new CfnOutput(this, 'AssetsUrl', {
      value: assetsCloudFrontUrl,
    });
    new CfnOutput(this, 'VideoPublisherFunctionName', {
      value: videoPublisherFn.functionName,
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
