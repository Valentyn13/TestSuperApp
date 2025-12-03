#!/bin/bash

# Configuration
OLD_BUNDLE_ID="com.testsuperapp"
NEW_BUNDLE_ID="com.test.superapp1244"

# Paths
ANDROID_MAIN="android/app/src/main"
JAVA_PATH="$ANDROID_MAIN/java"
OLD_PATH_DIR="$JAVA_PATH/${OLD_BUNDLE_ID//.//}"
NEW_PATH_DIR="$JAVA_PATH/${NEW_BUNDLE_ID//.//}"

echo "Renaming from $OLD_BUNDLE_ID to $NEW_BUNDLE_ID"

# -----------------
# ANDROID
# -----------------
echo "Processing Android..."

# 1. Update build.gradle
# Using sed to replace applicationId and namespace
if [ -f "android/app/build.gradle" ]; then
    echo "Updating android/app/build.gradle..."
    sed -i '' "s|applicationId \"$OLD_BUNDLE_ID\"|applicationId \"$NEW_BUNDLE_ID\"|g" android/app/build.gradle
    sed -i '' "s|namespace \"$OLD_BUNDLE_ID\"|namespace \"$NEW_BUNDLE_ID\"|g" android/app/build.gradle
else
    echo "Warning: android/app/build.gradle not found."
fi

# 2. Update AndroidManifest.xml (if it contains the package name)
if [ -f "$ANDROID_MAIN/AndroidManifest.xml" ]; then
    echo "Updating AndroidManifest.xml..."
    sed -i '' "s|package=\"$OLD_BUNDLE_ID\"|package=\"$NEW_BUNDLE_ID\"|g" "$ANDROID_MAIN/AndroidManifest.xml"
fi

# 3. Move Source Files
if [ -d "$OLD_PATH_DIR" ]; then
    echo "Moving files from $OLD_PATH_DIR to $NEW_PATH_DIR..."
    mkdir -p "$NEW_PATH_DIR"
    mv "$OLD_PATH_DIR"/* "$NEW_PATH_DIR/"
    
    # Remove the old directory if it's empty
    rm -rf "$OLD_PATH_DIR"
else
    echo "Warning: Old source directory $OLD_PATH_DIR not found. Skipping file move (maybe already moved?)."
fi

# 4. Update package declaration in source files
echo "Updating package declarations in Java/Kotlin files..."
# We search in the whole java path to catch files even if they were already moved
grep -lR "package $OLD_BUNDLE_ID" "$JAVA_PATH" | xargs sed -i '' "s|package $OLD_BUNDLE_ID|package $NEW_BUNDLE_ID|g"
grep -lR "import $OLD_BUNDLE_ID" "$JAVA_PATH" | xargs sed -i '' "s|import $OLD_BUNDLE_ID|import $NEW_BUNDLE_ID|g"

# 5. Clean Gradle
echo "Cleaning Gradle..."
cd android
./gradlew clean
cd ..

# -----------------
# iOS
# -----------------
echo "Processing iOS..."

# 1. Update project.pbxproj
# Find the .xcodeproj directory, excluding Pods
PROJECT_FILE=$(find ios -name "project.pbxproj" -not -path "*Pods*" | head -n 1)

if [ -f "$PROJECT_FILE" ]; then
    echo "Updating $PROJECT_FILE..."
    sed -i '' "s|PRODUCT_BUNDLE_IDENTIFIER = $OLD_BUNDLE_ID|PRODUCT_BUNDLE_IDENTIFIER = $NEW_BUNDLE_ID|g" "$PROJECT_FILE"
else
    echo "Error: project.pbxproj not found."
fi

echo "Done! Bundle ID updated to $NEW_BUNDLE_ID"
