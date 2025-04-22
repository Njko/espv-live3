package fr.nicolaslinard.esvp3

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.http.content.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun Application.configureRouting() {
    routing {
        // Serve static resources
        static("/") {
            resources("static")
            defaultResource("static/index.html")
        }

        // API routes
        route("/api") {
            val sessionRepository = ServiceLocator.sessionRepository

            // Create a new session
            post("/sessions") {
                val request = call.receive<CreateSessionRequest>()
                val session = sessionRepository.createSession(request.name)
                call.respond(
                    CreateSessionResponse(
                        id = session.id,
                        name = session.name,
                        pinCode = session.pinCode
                    )
                )
            }

            // Join a session with a pin code
            post("/sessions/join") {
                val request = call.receive<JoinSessionRequest>()
                val session = sessionRepository.findSessionByPinCode(request.pinCode)
                    ?: return@post call.respond(HttpStatusCode.NotFound, "Session not found")

                call.respond(
                    JoinSessionResponse(
                        id = session.id,
                        name = session.name
                    )
                )
            }

            // Update session name
            put("/sessions/{id}/name") {
                // Session names cannot be modified after creation
                call.respond(HttpStatusCode.BadRequest, "Session names cannot be modified after creation")
            }

            // Vote in a session
            post("/sessions/{id}/votes") {
                val id = call.parameters["id"] ?: return@post call.respond(HttpStatusCode.BadRequest, "Missing session ID")
                val request = call.receive<VoteRequest>()

                sessionRepository.addVote(id, request.userId, request.profile)
                    ?: return@post call.respond(HttpStatusCode.NotFound, "Session not found")

                call.respond(HttpStatusCode.OK)
            }

            // Get session results
            get("/sessions/{id}/results") {
                val id = call.parameters["id"] ?: return@get call.respond(HttpStatusCode.BadRequest, "Missing session ID")

                val session = sessionRepository.findSessionById(id)
                    ?: return@get call.respond(HttpStatusCode.NotFound, "Session not found")

                val results = sessionRepository.getSessionResults(id)
                    ?: return@get call.respond(HttpStatusCode.NotFound, "Session not found")

                call.respond(
                    SessionResultsResponse(
                        id = session.id,
                        name = session.name,
                        results = results
                    )
                )
            }
        }
    }
}
