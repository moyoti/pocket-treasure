#!/bin/bash
# Clean Android build artifacts to prevent overlay install issues

echo "🧹 Cleaning Android build artifacts..."

# Clean Gradle cache
cd packages/mobile/android
./gradlew clean --no-daemon
cd ../../..

# Clean build directories
rm -rf packages/mobile/android/app/build
rm -rf packages/mobile/android/.gradle
rm -rf packages/mobile/.expo

echo "✅ Clean complete!"
echo "📦 Now rebuild with: cd packages/mobile/android && ./gradlew assembleRelease"
