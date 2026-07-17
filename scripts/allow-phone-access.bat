@echo off
echo Opening port 3002 for phones on the same Wi-Fi...
netsh advfirewall firewall add rule name="Travel Magazine Dev 3002" dir=in action=allow protocol=TCP localport=3002 profile=private
if %errorlevel% equ 0 (
  echo OK. On your phone open: http://192.168.100.8:3002/en
) else (
  echo Failed. Right-click this file and choose "Run as administrator".
)
pause
