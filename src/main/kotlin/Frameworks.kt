package fr.nicolaslinard.esvp3

// Singleton object to hold services that were previously managed by Koin
object ServiceLocator {

    val sessionRepository: ESVPSessionRepository by lazy {
        ESVPSessionRepository()
    }
}

fun configureFrameworks() {
    // No Koin setup needed anymore
}
