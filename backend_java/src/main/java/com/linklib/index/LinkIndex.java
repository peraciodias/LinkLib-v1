package com.linklib.index;

import com.linklib.domain.Link;

import java.util.*;

public class LinkIndex {

    private Map<String, Link> byId = new HashMap<>();
    private Map<String, List<Link>> byCategoria = new HashMap<>();

    public void build(List<Link> links) {

        byId.clear();
        byCategoria.clear();

        for (Link link : links) {

            byId.put(link.getId(), link);

            if (link.getCategoria() != null) {

                byCategoria
                        .computeIfAbsent(link.getCategoria(), k -> new ArrayList<>())
                        .add(link);
            }
        }
    }

    public Link findById(String id) {
        return byId.get(id);
    }

    public List<Link> findByCategoria(String categoria) {
        return byCategoria.getOrDefault(categoria, Collections.emptyList());
    }
}
