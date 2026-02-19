#!/bin/bash

echo "🃏 Starting AI Poker Web App..."
echo ""
echo "Choose a server:"
echo "1) Python (recommended)"
echo "2) Node.js (npx serve)"
echo "3) PHP"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Starting Python server on http://localhost:8000"
        echo "Press Ctrl+C to stop"
        echo ""
        python3 -m http.server 8000
        ;;
    2)
        echo ""
        echo "Starting Node server..."
        npx serve .
        ;;
    3)
        echo ""
        echo "Starting PHP server on http://localhost:8000"
        echo "Press Ctrl+C to stop"
        echo ""
        php -S localhost:8000
        ;;
    *)
        echo "Invalid choice. Starting Python server by default..."
        python3 -m http.server 8000
        ;;
esac
