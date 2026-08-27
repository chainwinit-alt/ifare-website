@echo off
setlocal
cd /d "%~dp0"

rem Keep the DEV AI services on the approved Groq model even if the server
rem still has older NUXT_LLM_GROQ_* environment variables configured.
rem
rem 2026-08-27: these were still pinning qwen/qwen3.6-27b, which nuxt.config.ts
rem deliberately moved away from on 2026-08-12 (Groq Preview model, may be
rem discontinued at short notice, 8.3x the price of gpt-oss-20b, weaker
rem Traditional Chinese tokenizer). Because this file runs at startup, it was
rem overriding that decision on every deploy. Values now match the defaults in
rem nuxt.config.ts - if you change them there, change them here too.
set "NUXT_GROQ_MODEL=openai/gpt-oss-20b"
set "NUXT_LLM_GROQ_MODELS=openai/gpt-oss-20b,openai/gpt-oss-120b"
set "NUXT_LLM_GROQ_INTENT_MODELS=openai/gpt-oss-20b,openai/gpt-oss-120b"

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
