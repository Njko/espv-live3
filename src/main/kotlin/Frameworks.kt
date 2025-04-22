package fr.nicolaslinard.esvp3

import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

// Singleton object to hold services that were previously managed by Koin
object ServiceLocator {
    val helloService: HelloService by lazy {
        HelloService {
            println("Hello, World!")
        }
    }

    val sessionRepository: ESVPSessionRepository by lazy {
        ESVPSessionRepository()
    }
}

fun Application.configureFrameworks() {
    // No Koin setup needed anymore
}
