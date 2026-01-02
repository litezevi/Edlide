# Edlide Certificates and Code Signing Guide

## Overview

This document describes all certificates, keys, and code signing procedures for Edlide macOS distribution.

---

## Certificate Files Location

All certificates and keys are stored in:
```
/Users/litezevin/Desktop/Projects/Edlide/certificates,keys/
```

### Files:

| File | Description |
|------|-------------|
| `AuthKey_7ATRNBYDTF.p8` | App Store Connect API Key for notarization |
| `developer_id.csr` | Certificate Signing Request for Developer ID |
| `developerID_application.cer` | Developer ID Application Certificate |
| `dev_id.key` | Private key for CSR |
| `edlide.key` | Another private key |
| `development.cer` | Apple Development Certificate (not for distribution) |
| `dev_id.csr` | CSR for Apple Development |
| `edlide.pem`, `developer_id.pem` | Converted PEM certificates |
| `edlide.p12`, `developer_id.p12` | PKCS#12 bundles for signing |

---

## Apple Developer Account

### Developer ID Certificate

**Certificate Type:** Developer ID Application
**Issuer:** Apple Worldwide Developer Relations CA
**Identity:**
```
Developer ID Application: Aitegin Bek (V6TP7FU6AF)
```

**Subject:**
```
UID=D9Z2Y9794Z, CN=Apple Development: Aitegin Bek (54CD7QK727), OU=V6TP7FU6AF, O=Aitegin Bek, C=KG
```

### Team ID
```
V6TP7FU6AF
```

### App Store Connect API Key

**Key ID:** `7ATRNBYDTF`
**Key File:** `AuthKey_7ATRNBYDTF.p8`
**Issuer ID:** `7e155c1e-f127-4884-b613-97055c066754`

**Key Location:** https://appstoreconnect.apple.com/keys

---

## Certificate Creation Process

### Step 1: Create Private Key and CSR

```bash
cd /Users/litezevin/Desktop/Projects/Edlide

# Create private key and CSR
openssl req -new -newkey rsa:2048 -nodes -keyout dev_id.key -out dev_id.csr

# Fill in:
# - Country Name: RU
# - State: Moscow
# - City: Moscow
# - Org Name: Edlide (or your name)
# - Common Name: litezevin@gmail.com (your Apple ID)
```

### Step 2: Generate Certificate in Apple Developer Portal

1. Go to https://developer.apple.com/account/resources/certificates/add
2. Select **Developer ID Application** → Continue
3. Upload `dev_id.csr`
4. Click **Generate** → **Download**
5. Save as `developerID_application.cer`

### Step 3: Convert to PKCS#12

```bash
# Convert .cer to PEM
openssl x509 -in developerID_application.cer -inform DER -out developer_id.pem -outform PEM

# Create P12 bundle
openssl pkcs12 -export -out developer_id.p12 -inkey dev_id.key -in developer_id.pem -passout pass:wezhys-virtEd-kurfi7
```

### Step 4: Import to Keychain

```bash
# Import P12 to keychain
security import developer_id.p12 -P wezhys-virtEd-kurfi7 -A -t cert -f pkcs12

# Verify identity
security find-identity -v | grep "Developer ID"
```

---

## Code Signing

### Single Command Signing (Simple Apps)

```bash
codesign --force --sign "Developer ID Application: Aitegin Bek (V6TP7FU6AF)" --timestamp --options=runtime Edlide.app
```

### Deep Signing (All Contents - REQUIRED for Edlide)

Since Edlide contains native modules, all `.node` files, dylibs, and helpers must be signed:

```bash
# Sign all .node files
find Edlide.app -name "*.node" -type f -exec codesign --force --sign "Developer ID Application: Aitegin Bek (V6TP7FU6AF)" --timestamp --options=runtime {} \;

# Sign all dylib files
find Edlide.app -name "*.dylib" -type f -exec codesign --force --sign "Developer ID Application: Aitegin Bek (V6TP7FU6AF)" --timestamp --options=runtime {} \;

# Sign all helper binaries
find Edlide.app -name "*_helper" -type f -exec codesign --force --sign "Developer ID Application: Aitegin Bek (V6TP7FU6AF)" --timestamp --options=runtime {} \;

# Sign all executables
find Edlide.app -type f -perm +111 -exec codesign --force --sign "Developer ID Application: Aitegin Bek (V6TP7FU6AF)" --timestamp --options=runtime {} \;

# Deep sign entire bundle
codesign --force --sign "Developer ID Application: Aitegin Bek (V6TP7FU6AF)" --timestamp --options=runtime --deep Edlide.app

# Verify
codesign --verify --verbose Edlide.app
```

### Automated Signing Script

Save as `sign-all.sh`:

```bash
#!/bin/bash
IDENTITY="Developer ID Application: Aitegin Bek (V6TP7FU6AF)"

find Edlide.app -name "*.node" -type f -exec codesign --force --sign "$IDENTITY" --timestamp --options=runtime {} \;
find Edlide.app -name "*.dylib" -type f -exec codesign --force --sign "$IDENTITY" --timestamp --options=runtime {} \;
find Edlide.app -name "*_helper" -type f -exec codesign --force --sign "$IDENTITY" --timestamp --options=runtime {} \;
find Edlide.app -type f -perm +111 -exec codesign --force --sign "$IDENTITY" --timestamp --options=runtime {} \;
codesign --force --sign "$IDENTITY" --timestamp --options=runtime --deep Edlide.app
codesign --verify --verbose Edlide.app
```

Usage:
```bash
chmod +x sign-all.sh
./sign-all.sh
```

---

## Notarization

Notarization is required to avoid "damaged" warning on macOS.

### Step 1: Create App Store Connect API Key

1. Go to https://appstoreconnect.apple.com
2. Users and Access → Keys → **+**
3. Select **App Store Connect API**
4. Name: `Edlide Notarization`
5. Role: **Developer** or **Admin**
6. Generate → Download `.p8` file
7. Copy **Key ID** (e.g., `7ATRNBYDTF`)
8. Copy **Issuer ID** (UUID format, e.g., `7e155c1e-f127-4884-b613-97055c066754`)

### Step 2: Create DMG for Notarization

```bash
cd /path/to/Edlide.app
hdiutil create -srcfolder Edlide.app -ov -format UDZO -size 2g Edlide-mac.dmg
```

**Important:** Must be UDZO format (compressed), not UDIF read-write.

### Step 3: Submit for Notarization

```bash
xcrun notarytool submit Edlide-mac.dmg \
  --key /path/to/AuthKey_7ATRNBYDTF.p8 \
  --key-id 7ATRNBYDTF \
  --issuer 7e155c1e-f127-4884-b613-97055c066754
```

### Step 4: Check Status

```bash
# Using submission ID from Step 3
xcrun notarytool info <SUBMISSION_ID> \
  --key /path/to/AuthKey_7ATRNBYDTF.p8 \
  --key-id 7ATRNBYDTF \
  --issuer 7e155c1e-f127-4884-b613-97055c066754
```

Wait 5-15 minutes. Status should be **Accepted**.

### Step 5: Staple Notarization

```bash
xcrun stapler staple Edlide-mac.dmg
```

---

## Edlide Build Locations

| Version | Path | Status |
|---------|------|--------|
| x64 (Intel) | `/Users/litezevin/Desktop/Projects/Mac-x64-Edlide/` | ✅ Signed + Notarized |
| ARM (Apple Silicon) | `/Users/litezevin/Desktop/Projects/Mac-ARM-Edlide/` | ✅ Signed + Notarized |
| Universal | Not built | - |

### Build Commands

```bash
# x64
npm run gulp vscode-darwin-x64

# ARM
npm run gulp vscode-darwin-arm64

# Universal (both)
npm run gulp vscode-darwin-universal
```

---

## Distribution Files

After signing and notarization:

| File | Location |
|------|----------|
| x64 DMG | `/Users/litezevin/Desktop/Projects/Mac-x64-Edlide/Edlide-mac.dmg` |
| ARM DMG | `/Users/litezevin/Desktop/Projects/Mac-ARM-Edlide/Edlide-mac.dmg` |

---

## Troubleshooting

### "The binary is not signed with a valid Developer ID certificate"

All native modules must be signed. Run the signing script again.

### "The signature does not include a secure timestamp"

Add `--timestamp` to all codesign commands.

### "The executable does not have the hardened runtime enabled"

Add `--options=runtime` to all codesign commands.

### Notarization fails with "Invalid"

Sign all binaries first, then create DMG and resubmit.

### Common Errors

| Error | Solution |
|-------|----------|
| `errSecInternalComponent` | Keychain locked, or wrong certificate |
| `code object is not signed at all` | Sign subcomponents first |
| `No such file or directory` | Check paths to .p12 and .cer files |

---

## Security Notes

- **NEVER commit** `.p12` or `.cer` files to git
- **NEVER share** API keys or private keys
- Use GitHub Secrets for CI/CD signing
- Keep backups of private keys (`dev_id.key`, `edlide.key`)

---

## References

- [Apple Developer Certificates](https://developer.apple.com/account/resources/certificates)
- [Code Signing Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/Introduction/Introduction.html)
- [Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Hardened Runtime](https://developer.apple.com/documentation/security/hardened_runtime)