package com.linklib.util;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

public class HtmlUtil {

    public static String extrairTitulo(String url) {
        try {
            Document doc = Jsoup.connect(url)
                    .timeout(10000)
                    .followRedirects(true)
                    .userAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .get();
            return doc.title();
        } catch (Exception e) {
            System.err.println("Erro ao extrair título de " + url + ": " + e.getClass().getSimpleName() + " - " + e.getMessage());
            return null;
        }
    }
}
