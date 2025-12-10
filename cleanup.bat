@echo off
echo Limpiando páginas de admin...

REM Remover imports de Navbar
powershell -Command "(Get-Content 'app\dashboard\admin\classes\page.tsx') -replace 'import Navbar from ''@/components/Navbar'';', '' | Set-Content 'app\dashboard\admin\classes\page.tsx'"
powershell -Command "(Get-Content 'app\dashboard\admin\plans\page.tsx') -replace 'import Navbar from ''@/components/Navbar'';', '' | Set-Content 'app\dashboard\admin\plans\page.tsx'"
powershell -Command "(Get-Content 'app\dashboard\admin\memberships\page.tsx') -replace 'import Navbar from ''@/components/Navbar'';', '' | Set-Content 'app\dashboard\admin\memberships\page.tsx'"
powershell -Command "(Get-Content 'app\dashboard\admin\settings\page.tsx') -replace 'import Navbar from ''@/components/Navbar'';', '' | Set-Content 'app\dashboard\admin\settings\page.tsx'"

echo Listo!
pause
