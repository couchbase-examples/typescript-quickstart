import {
  request,
  describe,
  test,
  expect, //supertest
  connectToDatabase, // couchbase
  app, // REST application
} from './imports'
import { Route } from '../src/models/routeModels'
afterAll(async () => {
  const { cluster } = await connectToDatabase()
  await cluster.close()
})

describe('DELETE /api/v1/route/{id}', () => {
  describe('given we pass a id as request param', () => {
    beforeEach(async () => {
      const { routeCollection } = await connectToDatabase()
      const route: Route = {
        airline: 'Test Airline',
        airlineid: 'Test AirlineId',
        sourceairport: 'Test Airport',
        destinationairport: 'TESTFAA',
      }
      const id = 'route_777'

      await routeCollection
        .insert(id, route)
        .then(() => {
          /*console.log('test item inserted', route)*/
        })
        .catch((e) =>
          console.log(`Test route Insert Failed: ${e.message}`)
        )
    })

    test('should respond with status code 204 Deleted', async () => {
      const id = 'route_777'

      const response = await request(app)
        .delete(`/api/v1/route/${id}`)
        .send()
      expect(response.statusCode).toBe(204)
    })
  })
})
