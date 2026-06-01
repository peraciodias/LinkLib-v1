package com.linklib.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class UrlUtilTest {

    @Test
    public void testExtrairDominio() {
        assertEquals("google.com", UrlUtil.extrairDominio("https://google.com"));
        assertEquals("google.com", UrlUtil.extrairDominio("https://www.google.com"));
        assertEquals("github.com", UrlUtil.extrairDominio("https://github.com/facebook/react"));
        assertNull(UrlUtil.extrairDominio("invalid-url"));
    }
}
