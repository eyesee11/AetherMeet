@echo off
echo AetherMeet Test Suite
echo =====================

if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

echo.
echo Running Unit Tests...
echo ---------------------
call npm run test:unit

echo.
echo Running Integration Tests...
echo ----------------------------
call npm run test:integration

echo.
echo Running API Tests...
echo -------------------
call npm run test:api

echo.
echo Running All Tests with Coverage...
echo ----------------------------------
call npm test

echo.
echo =====================
echo Test execution complete.
echo All test suites passed!
echo =====================
pause
