#!/bin/bash

echo "🚀 Starting Deep Clean for Android..."

# Navigate to android directory
cd android || { echo "❌ Android directory not found"; exit 1; }

# 1. Run Gradle Clean
echo "🧹 Running ./gradlew clean..."
./gradlew clean

# 2. Remove Gradle Cache and Build Directories
echo "🗑️  Removing .gradle and build directories..."
rm -rf .gradle
rm -rf app/build
rm -rf build

# 3. Go back to root
cd ..

# 4. Optional: Clean Metro/Watchman (uncomment if needed, but usually not strictly for Android native build errors)
# echo "🧹 Cleaning Metro cache..."
# rm -rf $TMPDIR/metro-*
# rm -rf $TMPDIR/react-*
# rm -rf $TMPDIR/haste-*

echo "✅ Android Deep Clean Complete! You can now run 'npm run android'."

# Launch the app on Android
npx react-native run-android

echo "========================================================"
echo "✅ Launch process completed!"
echo "✨ Check your emulator/device."
echo "========================================================"
