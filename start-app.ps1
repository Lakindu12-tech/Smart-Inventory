Write-Host "Starting SD Bandara Trading Inventory System..." -ForegroundColor Green
Write-Host ""

# Start the development server in background
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev"

# Wait a moment for the server to start
Start-Sleep -Seconds 3

# Open the browser
Start-Process "http://localhost:3000"

Write-Host "Application started! Browser should open automatically." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server when done." -ForegroundColor Red 