@echo off
REM ==============================================================================
REM DASI MMORPG - BLENDER 5.2 3D SCENERY BATCH BUILDER
REM ==============================================================================
set BLENDER_EXE=C:\Program Files\Blender Foundation\Blender 5.2\blender.exe

if not exist "%BLENDER_EXE%" (
    echo [ERRO] Blender 5.2 nao encontrado em "%BLENDER_EXE%"
    exit /b 1
)

echo [DASI 3D] Iniciando compilacao procedural de cenarios com Blender 5.2...
"%BLENDER_EXE%" -b --python "%~dp0blender_dasi_world_builder.py" -- %*

if %ERRORLEVEL% EQU 0 (
    echo [DASI 3D] Compilacao concluida com sucesso!
) else (
    echo [DASI 3D] Falha durante a execucao do Blender.
)
