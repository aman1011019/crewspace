package com.crewspace.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final int LOCAL_PORT = 8765;
    private static final String APP_URL = "http://127.0.0.1:" + LOCAL_PORT + "/";

    private WebView webView;
    private LocalAssetServer assetServer;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        assetServer = new LocalAssetServer();
        assetServer.start();

        webView = new WebView(this);
        webView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && request.isForMainFrame()) {
                    view.loadDataWithBaseURL(
                            APP_URL,
                            "<html><body style='margin:0;background:#0B0B0F;color:white;font-family:sans-serif;display:flex;height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px'><div><h2>CrewSpace</h2><p>Loading local app...</p></div></body></html>",
                            "text/html",
                            "UTF-8",
                            null
                    );
                    view.postDelayed(() -> view.loadUrl(APP_URL), 700);
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }

            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                return true;
            }
        });

        requestRuntimePermissions();
        webView.loadUrl(APP_URL);
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        if (assetServer != null) {
            assetServer.stop();
            assetServer = null;
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
            return;
        }
        super.onBackPressed();
    }

    private void requestRuntimePermissions() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;

        if (checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.CAMERA}, 10);
        }
        if (Build.VERSION.SDK_INT >= 33 &&
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 11);
        }
    }

    private class LocalAssetServer {
        private final ExecutorService executor = Executors.newCachedThreadPool();
        private volatile boolean running = true;
        private ServerSocket serverSocket;

        void start() {
            executor.execute(() -> {
                try {
                    serverSocket = new ServerSocket(LOCAL_PORT, 8, InetAddress.getByName("127.0.0.1"));
                    while (running) {
                        Socket socket = serverSocket.accept();
                        executor.execute(() -> handle(socket));
                    }
                } catch (IOException ignored) {
                    running = false;
                }
            });
        }

        void stop() {
            running = false;
            try {
                if (serverSocket != null) serverSocket.close();
            } catch (IOException ignored) {
            }
            executor.shutdownNow();
        }

        private void handle(Socket socket) {
            try (Socket client = socket;
                 BufferedReader reader = new BufferedReader(new InputStreamReader(client.getInputStream(), StandardCharsets.UTF_8));
                 OutputStream rawOutput = new BufferedOutputStream(client.getOutputStream())) {

                String requestLine = reader.readLine();
                if (requestLine == null || requestLine.isEmpty()) return;

                String[] parts = requestLine.split(" ");
                String urlPath = parts.length > 1 ? parts[1] : "/";
                while (true) {
                    String header = reader.readLine();
                    if (header == null || header.isEmpty()) break;
                }

                String assetPath = mapAssetPath(urlPath);
                byte[] body;
                String mimeType = mimeType(assetPath);
                int status = 200;
                String statusText = "OK";

                try (InputStream stream = getAssets().open(assetPath)) {
                    body = readAll(stream);
                } catch (IOException missing) {
                    status = 404;
                    statusText = "Not Found";
                    mimeType = "text/html";
                    try (InputStream fallback = getAssets().open("public/index.html")) {
                        body = readAll(fallback);
                    }
                }

                String headers =
                        "HTTP/1.1 " + status + " " + statusText + "\r\n" +
                                "Content-Type: " + mimeType + "; charset=utf-8\r\n" +
                                "Content-Length: " + body.length + "\r\n" +
                                "Cache-Control: no-cache\r\n" +
                                "Access-Control-Allow-Origin: *\r\n" +
                                "Connection: close\r\n\r\n";

                rawOutput.write(headers.getBytes(StandardCharsets.UTF_8));
                rawOutput.write(body);
                rawOutput.flush();
            } catch (IOException ignored) {
            }
        }

        private byte[] readAll(InputStream stream) throws IOException {
            byte[] buffer = new byte[8192];
            int read;
            java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
            while ((read = stream.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }
            return output.toByteArray();
        }

        private String mapAssetPath(String rawPath) {
            String path = rawPath == null || rawPath.isEmpty() ? "/" : rawPath;
            int queryIndex = path.indexOf('?');
            if (queryIndex >= 0) {
                path = path.substring(0, queryIndex);
            }

            try {
                path = URLDecoder.decode(path, "UTF-8");
            } catch (Exception ignored) {
            }

            if (path.contains("..")) {
                path = "/";
            }
            if (path.equals("/")) {
                return "public/index.html";
            }
            if (path.endsWith("/")) {
                return "public" + path + "index.html";
            }
            String last = path.substring(path.lastIndexOf('/') + 1);
            if (!last.contains(".")) {
                return "public" + path + "/index.html";
            }
            return "public" + path;
        }

        private String mimeType(String assetPath) {
            String lower = assetPath.toLowerCase(Locale.US);
            if (lower.endsWith(".html")) return "text/html";
            if (lower.endsWith(".js")) return "application/javascript";
            if (lower.endsWith(".css")) return "text/css";
            if (lower.endsWith(".json")) return "application/json";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".svg")) return "image/svg+xml";
            if (lower.endsWith(".ico")) return "image/x-icon";
            if (lower.endsWith(".txt")) return "text/plain";
            if (lower.endsWith(".woff2")) return "font/woff2";
            return "application/octet-stream";
        }
    }
}
