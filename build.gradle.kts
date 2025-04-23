plugins {
    // Base plugin for basic build functionality
    base
}

group = "fr.nicolaslinard.esvp3"
version = "0.0.1"

// Define Node.js related tasks
tasks.register<Exec>("npmInstall") {
    description = "Install Node.js dependencies"
    commandLine("npm", "install")
}

tasks.register<Exec>("npmStart") {
    description = "Start the Node.js server"
    commandLine("node", "server.js")
    dependsOn("npmInstall")
}

// Make the build task depend on npmInstall
tasks.named("build") {
    dependsOn("npmInstall")
}

// Make the run task start the Node.js server
tasks.register("run") {
    dependsOn("npmStart")
}

// Clean task to remove node_modules
tasks.named("clean") {
    doLast {
        delete("node_modules")
    }
}
