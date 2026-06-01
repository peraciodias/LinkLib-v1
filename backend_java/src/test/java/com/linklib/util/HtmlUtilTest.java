package com.linklib.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class HtmlUtilTest {

    @Test
    public void testExtrairTitulo() {
        // Teste com uma URL real (pode falhar se não houver internet, mas é um exemplo)
        String titulo = HtmlUtil.extrairTitulo("https://www.google.com");
        assertNotNull(titulo);
        assertTrue(titulo.toLowerCase().contains("google"));
    }

    @Test
    public void testExtrairTituloInvalido() {
        assertNull(HtmlUtil.extrairTitulo("https://url-que-nao-existe-123.com"));
    }
}
