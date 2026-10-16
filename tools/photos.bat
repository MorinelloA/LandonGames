@echo off
rem Double-click after adding, changing or removing photos in photos-src.
rem It rebuilds photos\ (small JPEGs, thumbnails and manifest.json) for
rem Picture Puzzle. Then commit and publish the site as usual.
python "%~dp0photos.py" %*
echo.
pause
