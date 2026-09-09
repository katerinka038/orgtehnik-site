# Локальный просмотр сайта: правой кнопкой по файлу -> «Выполнить с помощью PowerShell»
# или в терминале:  powershell -ExecutionPolicy Bypass -File serve.ps1
# Затем открыть в браузере http://localhost:8080/

param([int]$Port = 8080)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.jpg'  = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.png'  = 'image/png'
  '.svg'  = 'image/svg+xml'
  '.webp' = 'image/webp'
  '.ico'  = 'image/x-icon'
  '.woff2'= 'font/woff2'
  '.txt'  = 'text/plain; charset=utf-8'
  '.md'   = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Сайт открыт: http://localhost:$Port/   (Ctrl+C — остановить)" -ForegroundColor Green

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path -eq '/' -or $path.EndsWith('/')) { $path += 'index.html' }

    $file = Join-Path $root ($path.TrimStart('/') -replace '/', '\')
    $full = [System.IO.Path]::GetFullPath($file)

    # не выпускаем запросы за пределы папки сайта
    if (-not $full.StartsWith([System.IO.Path]::GetFullPath($root))) {
      $ctx.Response.StatusCode = 403; $ctx.Response.Close(); continue
    }

    if (Test-Path $full -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $ctx.Response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes('404 — страница не найдена')
      $ctx.Response.ContentType = 'text/plain; charset=utf-8'
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    $ctx.Response.Close()
  }
} finally {
  $listener.Stop(); $listener.Close()
}
