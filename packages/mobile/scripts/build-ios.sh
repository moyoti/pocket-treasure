#!/bin/bash
# iOS Build and Install Script for Treasure Cat
# This script builds and installs the app to your connected iPhone

set -e

echo "🔨 Starting iOS Build & Install for Treasure Cat..."
echo ""

cd "$(dirname "$0")"

# Check if device is connected
echo "📱 Checking for connected devices..."
DEVICE_COUNT=$(xcrun devicectl list devices 2>/dev/null | grep -c "iPhone" || echo "0")
if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo "❌ No iPhone connected. Please connect your device via USB."
    exit 1
fi
echo "✅ iPhone detected"
echo ""

# Install Pods if needed
if [ ! -d "Pods" ] || [ ! -f "Pods/Manifest.lock" ]; then
    echo "📦 Installing CocoaPods dependencies..."
    pod install --repo-update || {
        echo "❌ Pod install failed. Trying without repo update..."
        pod install || {
            echo "❌ Failed to install pods. Please run 'pod install' manually in ios/ directory."
            exit 1
        }
    }
    echo "✅ Pods installed"
else
    echo "✅ Pods already installed"
fi
echo ""

# Build and install
echo "🚀 Building and installing to device..."
xcodebuild \
    -workspace ios/TreasureCat.xcworkspace \
    -scheme TreasureCat \
    -configuration Release \
    -destination 'platform=iOS,name=My iPhone' \
    -allowProvisioningUpdates \
    -automaticCodeSigning \
    DEVELOPMENT_TEAM="CVRHCHM6T8" \
    CODE_SIGN_IDENTITY="iPhone Developer" \
    build 2>&1 | tee /tmp/ios-build.log

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo ""
    echo "✅ Build succeeded!"
    echo ""
    echo "📲 Installing to device..."
    
    # Get the app path
    APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "TreasureCat.app" -type d | head -1)
    
    if [ -n "$APP_PATH" ]; then
        echo "✅ App found at: $APP_PATH"
        echo ""
        echo "🎉 Build complete! You can now install using:"
        echo "   xcrun devicectl device install app --device 'My iPhone' '$APP_PATH'"
        echo ""
        echo "Or open Xcode and press Cmd+R to run on device."
    else
        echo "⚠️  App not found in DerivedData. Please check Xcode build location."
    fi
else
    echo ""
    echo "❌ Build failed. Check /tmp/ios-build.log for details."
    exit 1
fi
