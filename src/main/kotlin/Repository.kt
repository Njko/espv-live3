package fr.nicolaslinard.esvp3

import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import kotlin.random.Random

/**
 * Repository for managing ESVP sessions in memory
 */
class ESVPSessionRepository {
    private val sessions = ConcurrentHashMap<String, ESVPSession>()
    private val sessionsByPinCode = ConcurrentHashMap<String, String>() // Maps pin codes to session IDs

    /**
     * Creates a new ESVP session with the given name
     */
    fun createSession(name: String): ESVPSession {
        val id = UUID.randomUUID().toString()
        val pinCode = generatePinCode()
        val session = ESVPSession(id, name, pinCode)
        sessions[id] = session
        sessionsByPinCode[pinCode] = id
        return session
    }

    /**
     * Finds a session by its ID
     */
    fun findSessionById(id: String): ESVPSession? {
        return sessions[id]
    }

    /**
     * Finds a session by its pin code
     */
    fun findSessionByPinCode(pinCode: String): ESVPSession? {
        val sessionId = sessionsByPinCode[pinCode] ?: return null
        return sessions[sessionId]
    }

    /**
     * Updates the name of a session
     */
    fun updateSessionName(id: String, name: String): ESVPSession? {
        val session = sessions[id] ?: return null
        session.name = name
        return session
    }

    /**
     * Adds a vote to a session
     */
    fun addVote(sessionId: String, userId: String, profile: ESVPProfile): ESVPSession? {
        val session = sessions[sessionId] ?: return null
        session.votes[userId] = profile
        return session
    }

    /**
     * Gets the results of a session
     */
    fun getSessionResults(id: String): Map<ESVPProfile, Int>? {
        val session = sessions[id] ?: return null
        return ESVPProfile.values().associateWith { profile ->
            session.votes.count { it.value == profile }
        }
    }

    /**
     * Generates a unique pin code in the format "XXX-XXX"
     */
    private fun generatePinCode(): String {
        var pinCode: String
        do {
            val firstPart = Random.nextInt(100, 1000)
            val secondPart = Random.nextInt(100, 1000)
            pinCode = "$firstPart-$secondPart"
        } while (sessionsByPinCode.containsKey(pinCode))
        return pinCode
    }
}