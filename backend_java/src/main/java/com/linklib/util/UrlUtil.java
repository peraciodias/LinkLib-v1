package com.linklib.util;

import java.net.URI;

public class UrlUtil {

    public static String extrairDominio(String url) {

        try {

            URI uri = new URI(url);

            String host = uri.getHost();

            if (host == null) {
                return null;
            }

            if (host.startsWith("www.")) {
                host = host.substring(4);
            }

            return host;

        } catch (Exception e) {

            return null;

        }
    }
}
