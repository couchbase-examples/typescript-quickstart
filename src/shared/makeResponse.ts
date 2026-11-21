import { Response } from 'express'
import {
    CouchbaseError,
    DocumentExistsError,
    DocumentNotFoundError,
} from 'couchbase'

interface ErrorResponse {
    message: string
}

/**
 * Maps an error thrown by a request handler to the HTTP status documented in
 * swagger.yaml. Classification uses the Couchbase SDK error classes rather
 * than message text, so it does not depend on SDK wording.
 */
function errorStatus(e: unknown): number {
    if (e instanceof DocumentNotFoundError) return 404
    if (e instanceof DocumentExistsError) return 409
    if (e instanceof CouchbaseError) return 400
    return 500
}

async function makeResponse(res: Response, action: () => Promise<any>) {
    try {
        const result = await action()
        res.json(result)
    } catch (e: any) {
        console.error(e)
        const errorResponse: ErrorResponse = {
            message: e?.message ?? String(e),
        }
        res.status(errorStatus(e))
        res.json(errorResponse)
    }
}

export { makeResponse, errorStatus }
