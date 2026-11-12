<?php
/**
 * Dasi MMORPG - Servidor Web & Roteador PHP Embutido
 * Permite iniciar e servir o projeto Dasi via PHP CLI integrado:
 *   php -S 127.0.0.1:8080 tools/php_server/router.php
 *
 * Suporta:
 * - Entrega de assets 3D (.glb, .gltf) com MIME types corretos
 * - Entrega de módulos JavaScript e TypeScript (.js, .mjs, .ts)
 * - Dev Viewer e Workbench Validador 3D
 * - Endpoints de API REST (/api/status, /api/health)
 */

$rootDir = realpath(__DIR__ . '/../..');
$devViewerDir = $rootDir . '/src/client/dev_viewer';

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rawurldecode($uri);

// Cabeçalhos de CORS e Cache para Desenvolvimento
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ========================================================
// Rotas de API REST do Servidor PHP
// ========================================================
if ($uri === '/api/status' || $uri === '/api/health') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'status' => 'online',
        'engine' => 'Dasi PHP Auxiliary Server',
        'php_version' => PHP_VERSION,
        'game' => 'Dasi MMORPG - Continent of Legend Reimagined',
        'ports' => [
            'http' => (int)($_SERVER['SERVER_PORT'] ?? 8080),
            'game_websocket' => 8299
        ],
        'timestamp' => time(),
        'uptime' => 'active'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit();
}

if ($uri === '/api/auth/login') {
    header('Content-Type: application/json; charset=utf-8');
    $input = json_decode(file_get_contents('php://input'), true);
    $username = $input['username'] ?? 'Player_' . rand(1000, 9999);
    echo json_encode([
        'success' => true,
        'message' => 'Login concedido via subsistema PHP Dasi',
        'user' => [
            'id' => rand(100, 999),
            'username' => $username,
            'token' => bin2hex(random_bytes(16)),
            'role' => 'dev_player'
        ]
    ]);
    exit();
}

// ========================================================
// Resolução de Arquivos Estáticos
// ========================================================

// Rota raiz -> index.html do Dev Viewer
if ($uri === '/' || $uri === '') {
    $filePath = $devViewerDir . '/index.html';
} elseif (file_exists($devViewerDir . $uri)) {
    // Arquivo relativo ao Dev Viewer
    $filePath = $devViewerDir . $uri;
} elseif (file_exists($rootDir . $uri)) {
    // Arquivo relativo à raiz do projeto (ex: /prototypes/..., /node_modules/...)
    $filePath = $rootDir . $uri;
} else {
    // Tenta caminhos comuns de assets
    $altPaths = [
        $devViewerDir . '/' . ltrim($uri, '/'),
        $rootDir . '/prototypes' . $uri,
        $rootDir . '/src' . $uri,
        $rootDir . '/node_modules' . $uri
    ];
    $filePath = null;
    foreach ($altPaths as $alt) {
        if (file_exists($alt) && !is_dir($alt)) {
            $filePath = $alt;
            break;
        }
    }
}

if (!$filePath || !file_exists($filePath) || is_dir($filePath)) {
    http_response_code(404);
    header('Content-Type: text/html; charset=utf-8');
    echo "<h1>404 - Arquivo não encontrado no Dasi</h1>";
    echo "<p>Caminho requisitado: " . htmlspecialchars($uri) . "</p>";
    exit();
}

// Mapeamento Canônico de MIME Types (Crítico para Three.js, WebGL e Áudio)
$ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
$mimeTypes = [
    'html' => 'text/html; charset=utf-8',
    'htm'  => 'text/html; charset=utf-8',
    'css'  => 'text/css; charset=utf-8',
    'js'   => 'text/javascript; charset=utf-8',
    'mjs'  => 'text/javascript; charset=utf-8',
    'ts'   => 'text/javascript; charset=utf-8',
    'json' => 'application/json; charset=utf-8',
    'glb'  => 'model/gltf-binary',
    'gltf' => 'model/gltf+json',
    'bin'  => 'application/octet-stream',
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif'  => 'image/gif',
    'webp' => 'image/webp',
    'svg'  => 'image/svg+xml',
    'ico'  => 'image/x-icon',
    'wav'  => 'audio/wav',
    'mp3'  => 'audio/mpeg',
    'ogg'  => 'audio/ogg',
    'woff' => 'font/woff',
    'woff2'=> 'font/woff2',
    'ttf'  => 'font/ttf'
];

$contentType = $mimeTypes[$ext] ?? 'application/octet-stream';
header("Content-Type: $contentType");
header("Content-Length: " . filesize($filePath));

readfile($filePath);
exit();
