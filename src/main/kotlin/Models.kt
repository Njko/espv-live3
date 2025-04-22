package fr.nicolaslinard.esvp3

import kotlinx.serialization.Serializable

/**
 * Enum representing the four ESVP profiles
 */
enum class ESVPProfile {
    EXPLORER,
    SHOPPER,
    VACATIONER,  // "Tourist" in French is "Vacancier"
    PRISONER
}

/**
 * Data class representing an ESVP session
 */
@Serializable
data class ESVPSession(
    val id: String,
    val name: String,
    val pinCode: String,
    val votes: MutableMap<String, ESVPProfile> = mutableMapOf()
)

/**
 * Request and response data classes for the API
 */
@Serializable
data class CreateSessionRequest(
    val name: String
)

@Serializable
data class CreateSessionResponse(
    val id: String,
    val name: String,
    val pinCode: String
)

@Serializable
data class JoinSessionRequest(
    val pinCode: String
)

@Serializable
data class JoinSessionResponse(
    val id: String,
    val name: String
)

@Serializable
data class VoteRequest(
    val userId: String,
    val profile: ESVPProfile
)

@Serializable
data class SessionResultsResponse(
    val id: String,
    val name: String,
    val results: Map<ESVPProfile, Int>
)
