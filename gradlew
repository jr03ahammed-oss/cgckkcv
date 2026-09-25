#!/usr/bin/env bash
if [ -x "/opt/gradle-8.11.1/bin/gradle" ]; then
    exec /opt/gradle-8.11.1/bin/gradle "$@"
elif command -v gradle >/dev/null 2>&1; then
    exec gradle "$@"
else
    echo "Gradle not found. Please install Gradle."
    exit 1
fi
