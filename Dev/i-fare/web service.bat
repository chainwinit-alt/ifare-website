@echo off
setlocal
cd /d "%~dp0"

rem Keep the DEV AI services on the approved Groq model even if the server
rem still has older NUXT_LLM_GROQ_* environment variables configured.
set "NUXT_GROQ_MODEL=qwen/qwen3.6-27b"
set "NUXT_LLM_GROQ_MODELS=qwen/qwen3.6-27b,openai/gpt-oss-120b"
set "NUXT_LLM_GROQ_INTENT_MODELS=qwen/qwen3.6-27b,openai/gpt-oss-120b"

if not exist ".output\server\index.mjs" (
  echo [ERROR] Missing .output\server\index.mjs
  echo Confirm that the migrated folder is named .output and is beside this BAT file.
  pause
  exit /b 1
)

if not exist ".output\server\node_modules\vue\package.json" (
  echo [ERROR] Missing .output\server\node_modules\vue
  echo The .output folder was not copied completely. Copy or extract the entire package again.
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] node.exe was not found in PATH.
  pause
  exit /b 1
)

echo Starting i-Fare with:
node --version
node ".output\server\index.mjs"

set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] i-Fare failed to start. Exit code: %EXIT_CODE%
  echo Check whether port 3000 is already in use.
  pause
)
exit /b %EXIT_CODE%
