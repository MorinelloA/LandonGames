@echo off
rem Double-click this after adding or removing photos in this folder.
rem It rebuilds manifest.json so the Picture Puzzle game finds every photo,
rem whatever the file names are. Then commit + push the site as usual.
powershell -NoProfile -Command "$f = Get-ChildItem -LiteralPath '%~dp0' -File | Where-Object { $_.Extension -match '^\.(jpe?g|png|webp|gif|heic|heif)$' } | Sort-Object Name | Select-Object -ExpandProperty Name; ConvertTo-Json @($f) | Set-Content -LiteralPath (Join-Path '%~dp0' 'manifest.json')"
echo.
echo manifest.json now lists:
type "%~dp0manifest.json"
echo.
pause
