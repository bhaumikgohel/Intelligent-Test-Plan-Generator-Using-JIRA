#!/bin/bash
# Render deployment entry point

# Create data directory if it doesn't exist
mkdir -p data

# Initialize database
npm run db:init

# Start the server
npm start
