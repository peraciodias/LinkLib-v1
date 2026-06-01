package com.linklib.util;

import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

public class FaviconDownloader {

    public static String download(String dominio) {
        try {
            // Garante que o diretório existe (relativo à raiz do projeto)
            Path dir = Path.of("../favicons");
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }

            // Sanitiza o nome do arquivo
            String safeName = dominio.replaceAll("[^a-zA-Z0-9.-]", "_") + ".png";
            Path path = dir.resolve(safeName);
            
            if (Files.exists(path)) {
                return safeName;
            }

            // Usa o serviço do Google para pegar um ícone de 64px de melhor qualidade
            String faviconUrl = "https://www.google.com/s2/favicons?sz=64&domain=" + dominio;
            URL url = new URL(faviconUrl);

            try (InputStream in = url.openStream()) {
                Files.copy(in, path, StandardCopyOption.REPLACE_EXISTING);
            }

            return safeName;
        } catch (Exception e) {
            System.err.println("Erro ao baixar favicon para " + dominio + ": " + e.getMessage());
            return null;
        }
    }
}
