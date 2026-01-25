# Creating Certified macOS DMG Files for Edlide

## QUICK START - COMPLETE BUILD PROCEDURE

⚠️ **Follow this exact procedure to avoid all issues**

### Step 1: Sign Applications (both architectures)

```bash
# ARM (Apple Silicon)
/Users/litezevin/Desktop/Projects/Edlide/scripts/build-dmg.sh \
  /Users/litezevin/Desktop/Projects/VSCode-darwin-arm64/Edlide.app \
  arm64

# x64 (Intel) 
/Users/litezevin/Desktop/Projects/Edlide/scripts/build-dmg.sh \
  /Users/litezevin/Desktop/Projects/VSCode-darwin-x64/Edlide.app \
  x64
```

**This signs ALL binaries with hardened runtime and entitlements**

### Step 2: Create Beautiful DMG with Proper Layout

```bash
# Create DMG script: /Users/litezevin/Desktop/Projects/Edlide/scripts/create-dmg-layout.sh

#!/bin/bash
APP_PATH="$1"
ARCH="$2"
IDENTITY="Developer ID Application: Aitegin Bek (V6TP7FU6AF)"

if [ "$ARCH" = "x64" ]; then
  ARCH_LABEL="x64"
  OUTPUT_DIR="/Users/litezevin/Desktop/Projects/Mac-x64-Edlide"
else
  ARCH_LABEL="arm64"
  OUTPUT_DIR="/Users/litezevin/Desktop/Projects/Mac-ARM-Edlide"
fi

DMG_PATH="$OUTPUT_DIR/Edlide-$ARCH_LABEL.dmg"
TEMP_DIR="/tmp/edlide-dmg-staging-$$"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Copy app (preserve ownership)
ditto --rsrc "$APP_PATH" "$TEMP_DIR/Edlide.app"

# Create DMG with proper layout (App on LEFT, Applications on RIGHT)
create-dmg \
  --volname "Edlide-Install" \
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

rm -rf "$TEMP_DIR"

# Sign DMG
codesign --force --sign "$IDENTITY" --timestamp "$DMG_PATH"
```

```bash
# Run for ARM
/Users/litezevin/Desktop/Projects/Edlide/scripts/create-dmg-layout.sh \
  /Users/litezevin/Desktop/Projects/VSCode-darwin-arm64/Edlide.app \
  arm64

# Run for x64
/Users/litezevin/Desktop/Projects/Edlide/scripts/create-dmg-layout.sh \
  /Users/litezevin/Desktop/Projects/VSCode-darwin-x64/Edlide.app \
  x64
```

### Step 3: Notarize and Staple

```bash
# ARM
xcrun notarytool submit "/Users/litezevin/Desktop/Projects/Mac-ARM-Edlide/Edlide-arm64.dmg" \
  --key "/Users/litezevin/Desktop/Projects/Edlide/certificates,keys/AuthKey_7ATRNBYDTF.p8" \
  --key-id "7ATRNBYDTF" \
  --issuer "7e155c1e-f127-4884-b613-97055c066754" \
  --wait

xcrun stapler staple "/Users/litezevin/Desktop/Projects/Mac-ARM-Edlide/Edlide-arm64.dmg"

# x64
xcrun notarytool submit "/Users/litezevin/Desktop/Projects/Mac-x64-Edlide/Edlide-x64.dmg" \
  --key "/Users/litezevin/Desktop/Projects/Edlide/certificates,keys/AuthKey_7ATRNBYDTF.p8" \
  --key-id "7ATRNBYDTF" \
  --issuer "7e155c1e-f127-4884-b613-97055c066754" \
  --wait

xcrun stapler staple "/Users/litezevin/Desktop/Projects/Mac-x64-Edlide/Edlide-x64.dmg"
```

---

## Overview

This document details the complete process for creating properly signed and notarized macOS DMG files for Edlide distribution. Following this guide will prevent common errors like "Edlide quit unexpectedly" and ensure Gatekeeper passes without issues.

---

## IMPORTANT: Why Failed First Time

**Critical Error**: First notarization attempt FAILED because NOT ALL binaries were properly signed with hardened runtime and entitlements.

**Errors found in logs**:
- ShipIt (Squirrel updater) - not signed, no timestamp, no hardened runtime
- `rg` binary (ripgrep) - not signed, no timestamp, no hardened runtime  
- `spawn-helper` (node-pty) - not signed, no timestamp, no hardened runtime

**Solution**: Updated signing script to sign ALL binaries individually with proper entitlements BEFORE deep signing the main app.

---

## Prerequisites

### Required Files & Locations

| Item | Location |
|------|----------|
| Developer ID Certificate | `/Users/litezevin/Desktop/Projects/Edlide/certificates,keys/developer_id.p12` |
| Entitlements File | `/Users/litezevin/Desktop/Projects/Edlide/certificates,keys/sign-app-entitlements.plist` |
| API Key | `/Users/litezevin/Desktop/Projects/Edlide/certificates,keys/AuthKey_7ATRNBYDTF.p8` |
| Build Script | `/Users/litezevin/Desktop/Projects/Edlide/scripts/build-dmg.sh` |

### Certificate Identity

```bash
Developer ID Application: Aitegin Bek (V6TP7FU6AF)
```

### Notarization Credentials

- **Key ID**: `7ATRNBYDTF`
- **Issuer ID**: `7e155c1e-f127-4884-b613-97055c066754`
- **API Key Path**: `/Users/litezevin/Desktop/Projects/Edlide/certificates,keys/AuthKey_7ATRNBYDTF.p8`

---

## Entitlements Configuration

The entitlements file MUST include these keys for Electron applications:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- V8 JIT compilation in Electron -->
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    
    <!-- JIT-compiled code execution (REQUIRED for Electron) -->
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    
    <!-- Load native node add-ons -->
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    
    <!-- Media permissions -->
    <key>com.apple.security.device.audio-input</key>
    <true/>
    <key>com.apple.security.device.camera</key>
    <true/>
    
    <!-- Apple events access for automation/macros -->
    <key>com.apple.security.automation.apple-events</key>
    <true/>
    
    <!-- Network access -->
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
    
    <!-- File access -->
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.files.downloads.read-write</key>
    <true/>
</dict>
</plist>
```

---

## Step-by-Step Building Process

### Phase 1: Clean & Start Fresh

```bash
# Create output directories
mkdir -p /Users/litezevin/Desktop/Projects/Mac-ARM-Edlide
mkdir -p /Users/litezevin/Desktop/Projects/Mac-x64-Edlide
```

### Phase 2: Build DMG for ARM (Apple Silicon)

```bash
/Users/litezevin/Desktop/Projects/Edlide/scripts/build-dmg.sh \
  /Users/litezevin/Desktop/Projects/VSCode-darwin-arm64/Edlide.app \
  arm64
```

**What happens in this script:**

1. **Remove existing signatures** - Clean slate
   ```bash
   codesign --remove-signature "$APP_PATH"
   find "$APP_PATH" -name "*.node" -o -name "*.dylib" | xargs codesign --remove-signature
   ```

2. **Sign all .node binaries** (native modules)
   ```bash
   find "$APP_PATH" -name "*.node" -type f -exec codesign \
     --force --sign "$IDENTITY" --options runtime --timestamp {} \;
   ```

3. **Sign all .dylib files**
   ```bash
   find "$APP_PATH" -name "*.dylib" -type f -exec codesign \
     --force --sign "$IDENTITY" --options runtime --timestamp {} \;
   ```

4. **Sign CRITICAL binaries individually** (THIS WAS THE KEY FIX!)
   
   **ShipIt (Squirrel updater)**:
   ```bash
   codesign --force --sign "$IDENTITY" \
     --entitlements "$ENTITLEMENTS" \
     --options runtime --timestamp \
     path/to/ShipIt
   ```
   
   **ripgrep binary**:
   ```bash
   codesign --force --sign "$IDENTITY" \
     --entitlements "$ENTITLEMENTS" \
     --options runtime --timestamp \
     path/to/bin/rg
   ```
   
   **spawn-helper (for terminal integration)**:
   ```bash
   codesign --force --sign "$IDENTITY" \
     --entitlements "$ENTITLEMENTS" \
     --options runtime --timestamp \
     path/to/spawn-helper
   ```

5. **Sign all helper apps with deep signing**
   ```bash
   find "$APP_PATH" -name "Helper.app" | while read helper_app; do
     codesign --force --sign "$IDENTITY" \
       --entitlements "$ENTITLEMENTS" \
       --options runtime --timestamp \
       --deep "$helper_app"
   done
   ```

6. **Sign all frameworks with deep signing**
   ```bash
   find "$APP_PATH" -name "*.framework" | while read framework; do
     codesign --force --sign "$IDENTITY" \
       --entitlements "$ENTITLEMENTS" \
       --options runtime --timestamp \
       --deep "$framework"
   done
   ```

7. **Deep sign main app bundle** (FINAL STEP)
   ```bash
   codesign --force --sign "$IDENTITY" \
     --deep \
     --entitlements "$ENTITLEMENTS" \
     --options runtime \
     --timestamp \
     "$APP_PATH"
   ```

8. **Verify signature**
   ```bash
   codesign --verify --verbose "$APP_PATH"
   # Expected output:
   # Edlide.app: valid on disk
   # Edlide.app: satisfies its Designated Requirement
   ```

9. **Create beautiful DMG with create-dmg**
   ```bash
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
   ```
   
   **DMG Layout**:
   - Window size: 600x400 pixels
   - App icon positioned at (170, 170) - LEFT side
   - Applications drop link at (430, 170) - RIGHT side
   - Icon size: 128px (large and visible)
   - Format: UDZO with zlib compression (max compression)

10. **Sign the DMG itself**
    ```bash
    codesign --force --sign "$IDENTITY" --timestamp "$DMG_PATH"
    ```

### Phase 3: Notarization for ARM

```bash
xcrun notarytool submit "/Users/litezevin/Desktop/Projects/Mac-ARM-Edlide/Edlide-arm64.dmg" \
  --key "/Users/litezevin/Desktop/Projects/Edlide/certificates,keys/AuthKey_7ATRNBYDTF.p8" \
  --key-id "7ATRNBYDTF" \
  --issuer "7e155c1e-f127-4884-b613-97055c066754" \
  --wait
```

### Phase 4: Staple Notarization Ticket

```bash
xcrun stapler staple "/Users/litezevin/Desktop/Projects/Mac-ARM-Edlide/Edlide-arm64.dmg"
```

**Expected output:**
```
Processing: /Users/litezevin/Desktop/Projects/Mac-ARM-Edlide/Edlide-arm64.dmg
The staple and validate action worked!
```

### Phase 5: Build DMG for x64 (Intel)

Repeat steps 2-4 for x64 architecture:

```bash
/Users/litezevin/Desktop/Projects/Edlide/scripts/build-dmg.sh \
  /Users/litezevin/Desktop/Projects/VSCode-darwin-x64/Edlide.app \
  x64

xcrun notarytool submit "/Users/litezevin/Desktop/Projects/Mac-x64-Edlide/Edlide-x64.dmg" \
  --key "/Users/litezevin/Desktop/Projects/Edlide/certificates,keys/AuthKey_7ATRNBYDTF.p8" \
  --key-id "7ATRNBYDTF" \
  --issuer "7e155c1e-f127-4884-b613-97055c066754" \
  --wait

xcrun stapler staple "/Users/litezevin/Desktop/Projects/Mac-x64-Edlide/Edlide-x64.dmg"
```

---

## Output Files

| Architecture | Location | SHA256 |
|-------------|----------|--------|
| ARM (M1/M2/M3) | `/Users/litezevin/Desktop/Projects/Mac-ARM-Edlide/Edlide-arm64.dmg` | `9722893f017dfa5150b7956cf3d46c05fd90715f5464c293b7df97b3b053b1ee` |
| x64 (Intel) | `/Users/litezevin/Desktop/Projects/Mac-x64-Edlide/Edlide-x64.dmg` | `6aae5e17a19884bda66c83383a31cc363188d4a82697fd58014b1deb99a0b9ca` |

**File Sizes**:
- ARM DMG: ~137 MB
- x64 DMG: ~143 MB

---

## CRITICAL Success Factors

### 1. Sign ALL Binaries Before Deep Signing

**DON'T** just run `codesign --deep` on the main app!

**MUST** sign these individually FIRST:
- All `.node` files (native node modules)
- All `.dylib` files (shared libraries)
- **ShipIt** binary (Squirrel auto-updater)
- **ripgrep** binary (`bin/rg`)
- **spawn-helper** binary (terminal integration)
- All helper apps (`Helper.app`, `Helper (GPU).app`, etc.)
- All frameworks (`.framework` directories)

### 2. Use Hardened Runtime with Entitlements

EVERY signing command MUST include:
```bash
--entitlements "/Users/litezevin/Desktop/Projects/Edlide/certificates,keys/sign-app-entitlements.plist" \
--options runtime \
--timestamp
```

**Why**: 
- `--entitlements` - Enables JIT execution for Electron V8 engine
- `--options runtime` - Hardened runtime (REQUIRED for notarization)
- `--timestamp` - Validates signature even after certificate expires

### 3. DMG Format Requirements

**MUST use**: `--format UDZO`

- UDZO (compressed) - Required for notarization
- NOT UDIF (read-write) - Will fail notarization
- NOT UDRW - Will fail notarization

### 4. Verification Before Notarization

ALWAYS verify before uploading:
```bash
codesign --verify --verbose Edlide.app
# Should say: "valid on disk" and "satisfies its Designated Requirement"
```

---

## Troubleshooting

### Error: "The binary is not signed with a valid Developer ID certificate"

**Cause**: Binary not signed before DMG creation

**Solution**: Sign all binaries individually (ShipIt, rg, spawn-helper) before deep signing main app

### Error: "The signature does not include a secure timestamp"

**Cause**: Missing `--timestamp` flag in codesign command

**Solution**: Add `--timestamp` to EVERY codesign command

### Error: "The executable does not have the hardened runtime enabled"

**Cause**: Missing `--options runtime` flag

**Solution**: Add `--options runtime --entitlements <file>` to EVERY codesign command

### Notarization Status: Invalid

**Check logs**:
```bash
xcrun notarytool log <submission-id> \
  --key "/path/to/AuthKey.p8" \
  --key-id "7ATRNBYDTF" \
  --issuer "7e155c1e-f127-4884-b613-97055c066754"
```

**Common causes**:
- Unsigned binaries (ShipIt, rg, spawn-helper)
- Missing hardened runtime
- Missing entitlements for Electron
- Wrong DMG format (use UDZO)

### Error: "Edlide quit unexpectedly"

**Cause**: Missing entitlements for Electron features

**Solution**: Ensure entitlements include:
```xml
<key>com.apple.security.cs.allow-jit</key>
<true/>
<key>com.apple.security.cs.allow-unsigned-executable-memory</key>
<true/>
```

These enable V8 JIT compilation in Electron.

---

## Quick Reference Commands

### Verify DMG signature:
```bash
codesign --verify --verbose Edlide.dmg
```

### Check notarization status:
```bash
xcrun stapler validate Edlide.dmg
```

### View entitlements of signed binary:
```bash
codesign -d --entitlements :- Edlide.app
```

### Re-sign after changing app:
```bash
/Users/litezevin/Desktop/Projects/Edlide/scripts/build-dmg.sh \
  <path-to-Edlide.app> <arm64|x64>
```

---

## Build Script Location

```bash
/Users/litezevin/Desktop/Projects/Edlide/scripts/build-dmg.sh
```

Usage:
```bash
./build-dmg.sh <path-to-Edlide.app> <arm64|x64>

# Example:
./build-dmg.sh /Users/litezevin/Desktop/Projects/VSCode-darwin-arm64/Edlide.app arm64
./build-dmg.sh /Users/litezevin/Desktop/Projects/VSCode-darwin-x64/Edlide.app x64
```

---

## Verification Checklist

Before releasing, verify:

- [ ] All binaries signed individually
- [ ] Entitlements applied to all signed binaries
- [ ] Hardened runtime enabled (`--options runtime`)
- [ ] Timed signatures (`--timestamp`)
- [ ] App signature verified (`codesign --verify`)
- [ ] DMG in UDZO format
- [ ] DMG itself signed
- [ ] Notarization submitted and Accepted
- [ ] Notarization stapled to DMG
- [ ] Application launches without errors
- [ ] No "quit unexpectedly" dialogs

---

## Common Pitfalls to Avoid

### ❌ DON'T: Skip signing individual binaries
```bash
# WRONG - This will fail notarization!
codesign --force --sign "$IDENTITY" --deep Edlide.app
```

### ✅ DO: Sign all binaries first
```bash
# RIGHT - Sign everything first!
sign .node files
sign .dylib files
sign ShipIt
sign rg
sign spawn-helper
sign helper apps
sign frameworks
codesign --deep Edlide.app  # LAST step
```

### ❌ DON'T: Use wrong DMG format
```bash
# WRONG - Will fail notarization!
hdiutil create -format UDRW ...
```

### ✅ DO: Use UDZO format
```bash
# RIGHT - Required for notarization!
create-dmg --format UDZO ...
```

### ❌ DON'T: Forget entitlements
```bash
# WRONG - Will cause "quit unexpectedly"!
codesign --force --sign "$IDENTITY" Edlide.app
```

### ✅ DO: Use entitlements
```bash
# RIGHT - Required for Electron!
codesign --force --sign "$IDENTITY" \
  --entitlements "sign-app-entitlements.plist" \
  --options runtime \
  --timestamp \
  Edlide.app
```

---

## Success Criteria

✅ **Completed** - Both ARM and x64 DMG files:
- Properly signed with hardened runtime
- Signed with Developer ID certificate
- All binaries individually signed
- Entitlements applied for Electron
- Notarized and accepted by Apple
- Stapled with notarization ticket
- Text verification: Application launches without "quit unexpectedly" error

**Verification**: Tested on M1 MacBook - application launches and runs without any Gatekeeper warnings or crash dialogs.

---

## Last Build Details

**Date**: January 9, 2026
**Status**: ✅ SUCCESS
**Issues Resolved**: 
- Unsigned binaries (ShipIt, rg, spawn-helper) - Fixed
- Missing hardened runtime on individual binaries - Fixed
- Missing entitlements - Fixed
- Notarization failures - Resolved

**Files Created**:
- ✅ Edlide-arm64.dmg (137 MB) - Signed, Notarized, Stapled
- ✅ Edlide-x64.dmg (143 MB) - Signed, Notarized, Stapled

---