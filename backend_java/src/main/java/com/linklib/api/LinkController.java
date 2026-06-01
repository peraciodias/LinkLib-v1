package com.linklib.api;

import java.io.File;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.List;
import java.util.Map;

import com.linklib.domain.Link;
import com.linklib.service.LinkService;
import com.linklib.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

public class LinkController {

    private final LinkService service;

    public LinkController(LinkService service) {
        this.service = service;
    }

    public void start() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/links", this::handleLinks);
        server.createContext("/favicons/", this::handleFavicons);
        server.setExecutor(null);
        server.start();
        System.out.println("🚀 API rodando em http://localhost:8080");
    }

    private void handleFavicons(HttpExchange exchange) {
        try {
            String path = exchange.getRequestURI().getPath();
            String filename = path.substring("/favicons/".length());
            File file = new File("../favicons/" + filename);

            if (!file.exists() || file.isDirectory()) {
                exchange.sendResponseHeaders(404, -1);
                return;
            }

            byte[] bytes = java.nio.file.Files.readAllBytes(file.toPath());
            String contentType = "image/x-icon";
            if (filename.endsWith(".png")) contentType = "image/png";
            else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";

            exchange.getResponseHeaders().add("Content-Type", contentType);
            exchange.sendResponseHeaders(200, bytes.length);
            OutputStream os = exchange.getResponseBody();
            os.write(bytes);
            os.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void handleLinks(HttpExchange exchange) {
        try {
            exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
            exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");

            String method = exchange.getRequestMethod();
            String path = exchange.getRequestURI().getPath();

            if ("OPTIONS".equalsIgnoreCase(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equalsIgnoreCase(method) && path.equals("/links")) {
                handleGet(exchange);

            } else if ("POST".equalsIgnoreCase(method) && path.equals("/links")) {
                handlePost(exchange);

            } else if ("PATCH".equalsIgnoreCase(method) && path.startsWith("/links/")) {
                handlePatch(exchange);

            } else if ("DELETE".equalsIgnoreCase(method) && path.startsWith("/links/")) {
                handleDelete(exchange);

            } else {
                exchange.sendResponseHeaders(404, -1);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void handleGet(HttpExchange exchange) throws Exception {
        List<Link> links = service.listar();
        sendJson(exchange, 200, JsonUtil.mapper().writeValueAsString(links));
    }

    private void handlePost(HttpExchange exchange) throws Exception {
        InputStream is = exchange.getRequestBody();
        Map<String, String> body = JsonUtil.mapper().readValue(is, Map.class);
        String url = body.get("url");

        if (url == null || url.isBlank()) {
            sendJson(exchange, 400, "{\"erro\":\"URL não pode ser vazia\"}");
            return;
        }

        try {
            Link link = service.criar(url.trim());
            sendJson(exchange, 201, JsonUtil.mapper().writeValueAsString(link));
        } catch (IllegalArgumentException e) {
            // FIX: retorna 409 Conflict quando URL duplicada
            sendJson(exchange, 409, "{\"erro\":\"" + e.getMessage() + "\"}");
        }
    }

    private void handlePatch(HttpExchange exchange) throws Exception {
        String path = exchange.getRequestURI().getPath();
        String id = path.substring(path.lastIndexOf("/") + 1);

        InputStream is = exchange.getRequestBody();
        Map<String, Object> body = JsonUtil.mapper().readValue(is, Map.class);

        String titulo    = (String) body.get("titulo");
        String categoria = (String) body.get("categoria");
        String legenda   = (String) body.get("legenda");
        Boolean favorito = body.get("favorito") != null ? (Boolean) body.get("favorito") : null;
        List<String> tags = body.get("tags") != null ? (List<String>) body.get("tags") : null;

        try {
            Link link = service.atualizar(id, titulo, categoria, tags, legenda, favorito);
            sendJson(exchange, 200, JsonUtil.mapper().writeValueAsString(link));
        } catch (IllegalArgumentException e) {
            sendJson(exchange, 404, "{\"erro\":\"" + e.getMessage() + "\"}");
        }
    }

    private void handleDelete(HttpExchange exchange) throws Exception {
        String path = exchange.getRequestURI().getPath();
        String id = path.substring(path.lastIndexOf("/") + 1);
        service.deletar(id);
        exchange.sendResponseHeaders(204, -1);
    }

    private void sendJson(HttpExchange exchange, int status, String json) throws Exception {
        byte[] bytes = json.getBytes("UTF-8");
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(bytes);
        os.close();
    }
}