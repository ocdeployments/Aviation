#!/bin/bash
# start-services.sh
# AviationHub startup script for non-systemd environments (Docker, containers).
# On a real VPS with systemd, use the .service files instead.

set -e
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

echo "Starting AviationHub services from $SCRIPT_DIR..."

# Flight tracker (port 3000)
node "$SCRIPT_DIR/flight-tracker.js" &
TRACKER_PID=$!
echo "  Flight tracker started (PID $TRACKER_PID, port 3000)"

# Console server (port 3001)
node "$SCRIPT_DIR/console-server.js" &
CONSOLE_PID=$!
echo "  Console server started (PID $CONSOLE_PID, port 3001)"

# Delay index service (port 3002)
node "$SCRIPT_DIR/delay-index.js" server &
DELAY_PID=$!
echo "  Delay index started (PID $DELAY_PID, port 3002)"

echo ""
echo "All services started. PIDs: $TRACKER_PID $CONSOLE_PID $DELAY_PID"
echo ""
echo "To stop:  kill $TRACKER_PID $CONSOLE_PID $DELAY_PID"
echo ""
echo "To enable on boot (VPS with systemd):"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable flight-tracker aviation-console aviation-delay-index"
echo "  sudo systemctl start flight-tracker aviation-console aviation-delay-index"
