package com.linklib.util;

import java.util.UUID;

public class IdGenerator {

    public static String gerar() {

        return UUID.randomUUID().toString();

    }

}
