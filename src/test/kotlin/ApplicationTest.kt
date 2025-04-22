package fr.nicolaslinard.esvp3

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class ApplicationTest {

    @Test
    fun testRoot() = testApplication {
        application {
            module()
        }
        client.get("/").apply {
            assertEquals(HttpStatusCode.OK, status)
            val body = bodyAsText()
            assertTrue(body.contains("ESVP Voting"), "HTML should contain the title")
            assertTrue(body.contains("Explorer"), "HTML should contain Explorer profile")
            assertTrue(body.contains("Shopper"), "HTML should contain Shopper profile")
            assertTrue(body.contains("Vacationer"), "HTML should contain Vacationer profile")
            assertTrue(body.contains("Prisoner"), "HTML should contain Prisoner profile")
        }
    }

    @Test
    fun testApiEndpointsExist() = testApplication {
        // We're just testing that the routes are registered correctly
        // without actually testing the full functionality

        application {
            module()
        }

        // Test that the API endpoints are registered
        val endpoints = listOf(
            "/api/sessions",
            "/api/sessions/join"
        )

        for (endpoint in endpoints) {
            val response = client.options(endpoint)
            assertTrue(
                response.status == HttpStatusCode.OK || 
                response.status == HttpStatusCode.MethodNotAllowed,
                "Endpoint $endpoint should exist"
            )
        }
    }
}
