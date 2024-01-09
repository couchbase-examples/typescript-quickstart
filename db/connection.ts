import * as couchbase from 'couchbase'

const DB_USERNAME: string = process.env.DB_USERNAME || '';
const DB_PASSWORD: string = process.env.DB_PASSWORD || '';
const DB_CONN_STR: string = process.env.DB_CONN_STR || '';
const DB_BUCKET_NAME: string | undefined = process.env.DB_BUCKET_NAME

if (!DB_USERNAME) {
    throw new Error(
        'Please define the DB_USERNAME environment variable inside dev.env'
    )
}

if (!DB_PASSWORD) {
    throw new Error(
        'Please define the DB_PASSWORD environment variable inside dev.env'
    )
}

if (!DB_CONN_STR) {
    throw new Error(
        'Please define the DB_CONN_STR environment variable inside dev.env'
    )
}

if (!DB_BUCKET_NAME) {
    throw new Error(
        'Please define the DB_BUCKET_NAME environment variable inside dev.env'
    )
}


interface DbConnection {
    cluster: couchbase.Cluster
    bucket: couchbase.Bucket
    scope: couchbase.Scope
    airlineCollection: couchbase.Collection
    airportCollection: couchbase.Collection
    routeCollection: couchbase.Collection
}

declare const global: {
    couchbase?: {
        conn: couchbase.Cluster | null
    }
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached: { conn: couchbase.Cluster | null } = global.couchbase || {
    conn: null,
}

async function createCouchbaseCluster(): Promise<couchbase.Cluster> {
    if (cached.conn) {
        return cached.conn
    }
    const cluster = await couchbase.connect(DB_CONN_STR, {
        username: DB_USERNAME,
        password: DB_PASSWORD,
        configProfile: 'wanDevelopment',
    })

    cached.conn = cluster
    return cluster
}

export async function connectToDatabase(): Promise<DbConnection> {
    const cluster = await createCouchbaseCluster()
    const bucket = cluster.bucket(DB_BUCKET_NAME!)
    const scope = bucket.scope('inventory')
    const airlineCollection = scope.collection('airline')
    const airportCollection = scope.collection('airport')
    const routeCollection = scope.collection('route')

    const dbConnection: DbConnection = {
        cluster,
        bucket,
        scope,
        airlineCollection,
        airportCollection,
        routeCollection,
    }

    return dbConnection
}
