@echo off
title NexusPay Python Microservices
color 0B
echo.
echo  ====================================================
echo   NexusPay - Starting Python Microservices...
echo  ====================================================
echo.

cd /d E:\nexuspay-platform\services

echo  Starting Fraud Detection      on http://localhost:8001
start "Fraud Detection :8001"      cmd /k "cd /d E:\nexuspay-platform\services\fraud-detection      && python3.13 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload"

echo  Starting Currency Conversion  on http://localhost:8002
start "Currency Conversion :8002"  cmd /k "cd /d E:\nexuspay-platform\services\currency-conversion  && python3.13 -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload"

echo  Starting Tax Calculation      on http://localhost:8003
start "Tax Calculation :8003"      cmd /k "cd /d E:\nexuspay-platform\services\tax-calculation      && python3.13 -m uvicorn main:app --host 0.0.0.0 --port 8003 --reload"

echo  Starting Notification         on http://localhost:8004
start "Notification :8004"         cmd /k "cd /d E:\nexuspay-platform\services\notification-service && python3.13 -m uvicorn main:app --host 0.0.0.0 --port 8004 --reload"

echo  Starting Report Generation    on http://localhost:8005
start "Report Generation :8005"    cmd /k "cd /d E:\nexuspay-platform\services\report-generation   && python3.13 -m uvicorn main:app --host 0.0.0.0 --port 8005 --reload"

echo  Starting Analytics            on http://localhost:8006
start "Analytics :8006"            cmd /k "cd /d E:\nexuspay-platform\services\analytics            && python3.13 -m uvicorn main:app --host 0.0.0.0 --port 8006 --reload"

echo  Starting Recommendation       on http://localhost:8007
start "Recommendation :8007"       cmd /k "cd /d E:\nexuspay-platform\services\recommendation-engine && python3.13 -m uvicorn main:app --host 0.0.0.0 --port 8007 --reload"

echo  Starting Inventory Forecast   on http://localhost:8008
start "Inventory Forecast :8008"   cmd /k "cd /d E:\nexuspay-platform\services\inventory-forecast  && python3.13 -m uvicorn main:app --host 0.0.0.0 --port 8008 --reload"

echo  Starting Document Processing  on http://localhost:8009
start "Document Processing :8009"  cmd /k "cd /d E:\nexuspay-platform\services\document-processing && python3.13 -m uvicorn main:app --host 0.0.0.0 --port 8009 --reload"

echo  Starting AI Scoring           on http://localhost:8010
start "AI Scoring :8010"           cmd /k "cd /d E:\nexuspay-platform\services\ai-scoring          && python3.13 -m uvicorn main:app --host 0.0.0.0 --port 8010 --reload"

echo.
echo  ====================================================
echo   All 10 services starting in separate windows.
echo   Wait ~5 seconds then refresh the Monitoring page.
echo.
echo   Fraud Detection    : http://localhost:8001/health
echo   Currency Conversion: http://localhost:8002/health
echo   Tax Calculation    : http://localhost:8003/health
echo   Notification       : http://localhost:8004/health
echo   Report Generation  : http://localhost:8005/health
echo   Analytics          : http://localhost:8006/health
echo   Recommendation     : http://localhost:8007/health
echo   Inventory Forecast : http://localhost:8008/health
echo   Document Processing: http://localhost:8009/health
echo   AI Scoring         : http://localhost:8010/health
echo  ====================================================
echo.
pause
