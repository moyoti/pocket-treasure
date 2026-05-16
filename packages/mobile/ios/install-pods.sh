#!/bin/bash
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890

echo "Starting pod install with retries..."
for i in {1..5}; do
  echo "Attempt $i..."
  pod install --repo-update 2>&1 | tee /tmp/pod-attempt-$i.log
  
  if [ $? -eq 0 ]; then
    echo "✅ Pod install succeeded!"
    exit 0
  else
    echo "❌ Attempt $i failed. Waiting 10 seconds before retry..."
    sleep 10
  fi
done

echo "❌ All attempts failed"
exit 1
