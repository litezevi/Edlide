#!/bin/bash

# Edlide macOS DMG Creation and Notarization Script
# Creates properly formatted DMG with app signing and notarization

set -e

API_KEY_PATH="/Users/litezevin/Desktop/Projects/Edlide/certificates,keys/AuthKey_7ATRNBYDTF.p8"
KEY_ID="7ATRNBYDTF"
ISSUER_ID="7e155c1e-f127-4884-b613-97055c066754"

if [ -z "$1" ]; then
    echo "Usage: $0 <path-to-Edlide.app> [arch:arm64|x64]"
    exit 1
fi

APP_PATH="$1"
ARCH="${2:-arm64}"

if [ ! -d "$APP_PATH" ]; then
    echo "Error: App not found at $APP_PATH"
    exit 1
fi

# Determine DMG name based on architecture
if [ "$ARCH" = "x64" ]; then
    DMG_PATH="/Users/litezevin/Desktop/Projects/Mac-x64-Edlide/Edlide-x64.dmg"
else
    DMG_PATH="/Users/litezevin/Desktop/Projects/Mac-ARM-Edlide/Edlide-arm64.dmg"
fi

echo "========================================="
echo "Creating DMG for Edlide"
echo "App: $APP_PATH"
echo "Architecture: $ARCH"
echo "Output: $DMG_PATH"
echo "========================================="

# Step 1: Delete old DMG if exists
echo -e "\n[1/3] Cleaning up old DMG..."
rm -f "$DMG_PATH" 2>/dev/null || true

# Step 2: Create temporary staging directory
echo -e "\n[2/3] Creating DMG (UDZO format with zlib compression)..."
STAGING_DIR="/tmp/edlide-dmg-staging-$$"
rm -rf "$STAGING_DIR"
mkdir -p "$STAGING_DIR"

# Copy app to staging
cp -R "$APP_PATH" "$STAGING_DIR/"

# Create DMG from staging directory
# UDZO format is required for notarization
# Use UDZO (compressed) not UDIF
hdiutil create \
    -srcfolder "$STAGING_DIR" \
    -volname "Edlide" \
    -fs HFS+ \
    -fsargs "-c c=64,a=16,e=16" \
    -format UDZO \
    -imagekey zlib-level=9 \
    "$DMG_PATH"

# Cleanup staging
rm -rf "$STAGING_DIR"

DMG_SIZE=$(du -h "$DMG_PATH" | cut -f1)
echo -e "\n✅ DMG created successfully!"
echo "File: $DMG_PATH"
echo "Size: $DMG_SIZE"

# Step 3: Sign the DMG
echo -e "\n[3/3] Signing DMG..."
codesign --force --sign "Developer ID Application: Aitegin Bek (V6TP7FU6AF)" \
    --timestamp \
    "$DMG_PATH"

echo -e "\n========================================="
echo "✅ DMG creation and signing completed!"
echo "========================================="
echo ""
echo "Next step: Notarize the DMG"
echo "Command:"
echo "xcrun notarytool submit \"$DMG_PATH\" \\"
echo "  --key \"$API_KEY_PATH\" \\"
echo "  --key-id \"$KEY_ID\" \\"
echo "  --issuer \"$ISSUER_ID\" \\"
echo "  --wait"
echo "========================================="