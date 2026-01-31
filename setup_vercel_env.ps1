# Script to set up Vercel environment variables from local .env files

# Function to read .env file and set variables
function Set-VercelEnv {
    param(
        [string]$EnvFile
    )

    if (Test-Path $EnvFile) {
        Write-Host "Reading $EnvFile..."
        $content = Get-Content $EnvFile
        foreach ($line in $content) {
            if ($line -match "^([^#=]+)=(.*)$") {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                
                if ($key -and $value) {
                    Write-Host "Setting $key..."
                    # Check if variable exists
                    $exists = vercel env ls production | Select-String $key
                    if ($exists) {
                        Write-Host "$key already exists. Removing..."
                        echo "y" | vercel env rm $key production
                    }
                    echo $value | vercel env add $key production
                }
            }
        }
    } else {
        Write-Host "File $EnvFile not found."
    }
}

Write-Host "Starting Vercel Environment Setup..."
Write-Host "Please ensure you have logged in with 'vercel login' and linked your project with 'vercel link'."

# Check if vercel CLI is installed
if (!(Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Error "Vercel CLI not found. Please install it using 'npm i -g vercel'."
    exit 1
}

# Read from root .env if it exists
Set-VercelEnv -EnvFile ".env"
# Read from .env.local if it exists
Set-VercelEnv -EnvFile ".env.local"

Write-Host "Environment variables setup complete."
