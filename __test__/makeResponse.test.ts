import { describe, test, expect, jest } from '@jest/globals'
import { Response } from 'express'
import {
    AuthenticationFailureError,
    DocumentExistsError,
    DocumentNotFoundError,
    TimeoutError,
} from 'couchbase'

import { errorStatus, makeResponse } from '../src/shared/makeResponse'

// Unit tests for the error -> HTTP status seam. These do not need a cluster.

function fakeResponse() {
    const res = {
        statusCode: 200,
        body: undefined as unknown,
        status: jest.fn((code: number) => {
            res.statusCode = code
            return res
        }),
        json: jest.fn((body: unknown) => {
            res.body = body
            return res
        }),
    }
    return res
}

describe('errorStatus', () => {
    test.each([
        ['DocumentNotFoundError', 404, new DocumentNotFoundError()],
        ['DocumentExistsError', 409, new DocumentExistsError()],
        ['other CouchbaseError', 400, new TimeoutError()],
        ['other CouchbaseError', 400, new AuthenticationFailureError()],
        ['plain Error', 500, new Error('boom')],
        ['plain Error mentioning not found', 500, new Error('route not found')],
        ['non-Error value', 500, 'boom'],
    ])('%s -> %i', (_name, status, error) => {
        expect(errorStatus(error)).toBe(status)
    })
})

describe('makeResponse', () => {
    test('sends the action result as JSON', async () => {
        const res = fakeResponse()
        await makeResponse(res as unknown as Response, async () => ({ a: 1 }))
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({ a: 1 })
    })

    test('maps a duplicate insert to 409 with the error message', async () => {
        const res = fakeResponse()
        jest.spyOn(console, 'error').mockImplementation(() => {})
        await makeResponse(res as unknown as Response, async () => {
            throw new DocumentExistsError()
        })
        expect(res.statusCode).toBe(409)
        expect(res.body).toEqual({ message: 'document exists' })
    })
})
