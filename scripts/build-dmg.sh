#!/bin/bash

# Edlide macOS DMG Build Script with Code Signing and Notarization
# Creates beautiful, signed, and notarized DMG for distribution

set -e

IDENTITY="Developer ID Application: Aitegin Bek (V6TP7FU6AF)"
ENTITLEMENTS="/Users/litezevin/Desktop/Projects/Edlide/certificates,keys/sign-app-entitlements.plist"
API_KEY_PATH="/Users/litezevin/Desktop/Projects/Edlide/certificates,keys/AuthKey_7ATRNBYDTF.p8"
KEY_ID="7ATRNBYDTF"
ISSUER_ID="7e155c1e-f127-4884-b613-97055c066754"

if [ -z "$1" ]; then
    echo "Usage: $0 <path-to-Edlide.app> <arch:arm64|x64>"
    echo ""
    echo "Example:"
    echo "  $0 /Users/litezevin/Desktop/Projects/VSCode-darwin-arm64/Edlide.app arm64"
    echo "  $0 /Users/litezevin/Desktop/Projects/VSCode-darwin-x64/Edlide.app x64"
    exit 1
fi

APP_PATH="$1"
ARCH="$2"

if [ ! -d "$APP_PATH" ]; then
    echo "Error: App not found at $APP_PATH"
    exit 1
fi

if [ "$ARCH" = "x64" ]; then
    ARCH_LABEL="x64"
    OUTPUT_DIR="/Users/litezevin/Desktop/Projects/Mac-x64-Edlide"
else
    ARCH_LABEL="arm64"
    OUTPUT_DIR="/Users/litezevin/Desktop/Projects/Mac-ARM-Edlide"
fi

DMG_PATH="$OUTPUT_DIR/Edlide-$ARCH_LABEL.dmg"

echo "=========================================="
echo "Building Edlide DMG"
echo "=========================================="
echo "App: $APP_PATH"
echo "Architecture: $ARCH_LABEL"
echo "Output DMG: $DMG_PATH"
echo "=========================================="

# Step 1: Remove existing signatures
echo -e "\n[1/7] Removing existing signatures..."
codesign --remove-signature "$APP_PATH" 2>/dev/null || true
find "$APP_PATH" -name "*.node" -o -name "*.dylib" | xargs codesign --remove-signature 2>/dev/null || true

# Step 2: Sign all .node binaries (native modules)
echo -e "\n[2/7] Signing .node binaries..."
NODE_COUNT=$(find "$APP_PATH" -name "*.node" | wc -l)
echo "Found $NODE_COUNT .node files"
find "$APP_PATH" -name "*.node" -type f -exec codesign --force --sign "$IDENTITY" --options runtime --timestamp {} \;

# Step 3: Sign all .dylib files
echo -e "\n[3/7] Signing .dylib files..."
DYLIB_COUNT=$(find "$APP_PATH" -name "*.dylib" | wc -l)
echo "Found $DYLIB_COUNT .dylib files"
find "$APP_PATH" -name "*.dylib" -type f -exec codesign --force --sign "$IDENTITY" --options runtime --timestamp {} \;

# Step 4: Sign helper executables and frameworks
echo -e "\n[4/7] Signing helpers and frameworks..."

# Sign all helper executables with proper entitlements
find "$APP_PATH" -name "*_helper" -type f | while read helper; do
    echo "  Signing helper: $helper"
    codesign --force --sign "$IDENTITY" --entitlements "$ENTITLEMENTS" --options runtime --timestamp "$helper"
done

# Sign ShipIt binary (Squirrel updater)
SHIP_IT=$(find "$APP_PATH" -name "ShipIt" -type f 2>/dev/null)
if [ -n "$SHIP_IT" ]; then
    echo "  Signing ShipIt: $SHIP_IT"
    codesign --force --sign "$IDENTITY" --entitlements "$ENTITLEMENTS" --options runtime --timestamp "$SHIP_IT"
fi

# Sign ripgrep binary
RG_BINARY=$(find "$APP_PATH" -name "rg" -path "*/bin/rg" -type f 2>/dev/null)
for rg in $RG_BINARY; do
    echo "  Signing ripgrep: $rg"
    codesign --force --sign "$IDENTITY" --entitlements "$ENTITLEMENTS" --options runtime --timestamp "$rg"
done

# Sign spawn-helper
SPAWN_HELPER=$(find "$APP_PATH" -name "spawn-helper" -path "*/node-pty/*" -type f 2>/dev/null)
for spawn in $SPAWN_HELPER; do
    echo "  Signing spawn-helper: $spawn"
    codesign --force --sign "$IDENTITY" --entitlements "$ENTITLEMENTS" --options runtime --timestamp "$spawn"
done

# Sign all helper apps with deep signing
find "$APP_PATH" -name "Helper.app" -o -name "*.helper.app" 2>/dev/null | while read helper_app; do
    if [ -d "$helper_app" ]; then
        echo "  Signing helper app: $helper_app"
        codesign --force --sign "$IDENTITY" --entitlements "$ENTITLEMENTS" --options runtime --timestamp --deep "$helper_app"
    fi
done

# Sign all frameworks with deep signing
find "$APP_PATH" -name "*.framework" -type d | while read framework; do
    echo "  Signing framework: $framework"
    codesign --force --sign "$IDENTITY" --entitlements "$ENTITLEMENTS" --options runtime --timestamp --deep "$framework" 2>/dev/null || true
done

# Step 5: Deep sign main app bundle
echo -e "\n[5/7] Deep signing main app bundle with hardened runtime..."
codesign --force --sign "$IDENTITY" \
    --deep \
    --entitlements "$ENTITLEMENTS" \
    --options runtime \
    --timestamp \
    "$APP_PATH"

# Verify signature
echo -e "\nVerifying application signature..."
codesign --verify --verbose "$APP_PATH"
echo "✅ Application signature verified"

# Step 6: Create beautiful DMG using create-dmg
echo -e "\n[6/7] Creating DMG..."
rm -f "$DMG_PATH" 2>/dev/null || true

# Create temporary staging directory
TEMP_DIR="/tmp/edlide-dmg-staging-$$"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Copy app to staging
cp -R "$APP_PATH" "$TEMP_DIR/"

# Create DMG with beautiful layout
# Window: 600x400, App icon on left (180,170), Applications link on right (420,170)
create-dmg \
    --volname "Edlide" \
    --window-pos 200 120 \
    --window-size 600 400 \
    --icon-size 128 \
    --icon "Edlide.app" 170 170 \
    --hide-extension "Edlide.app" \
    --app-drop-link 430 170 \
    --format UDZO \
    --hdiutil-verbose \
    "$DMG_PATH" \
    "$TEMP_DIR"

# Cleanup staging
rm -rf "$TEMP_DIR"

DMG_SIZE=$(du -h "$DMG_PATH" | cut -f1)
echo "✅ DMG created: $DMG_SIZE"
echo "   Path: $DMG_PATH"

# Step 7: Sign the DMG
echo -e "\n[7/7] Signing DMG..."
codesign --force --sign "$IDENTITY" --timestamp "$DMG_PATH"

echo -e "\n=========================================="
echo "✅ DMG creation and signing completed!"
echo "=========================================="
echo ""
echo "MD5 hash:"
md5 "$DMG_PATH"
echo ""
echo "SHA256 hash:"
shasum -a 256 "$DMG_PATH"
echo ""
echo "=========================================="
echo "Next step: Notarization"
echo "Command:"
echo "xcrun notarytool submit \"$DMG_PATH\" \\"
echo "  --key \"$API_KEY_PATH\" \\"
echo "  --key-id \"$KEY_ID\" \\"
echo "  --issuer \"$ISSUER_ID\" \\"
echo "  --wait"
echo ""
echo "After notarization is complete, staple it:"
echo "xcrun stapler staple \"$DMG_PATH\""
echo "=========================================="