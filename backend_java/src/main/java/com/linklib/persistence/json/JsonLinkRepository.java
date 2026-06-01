package com.linklib.persistence.json;

import com.linklib.domain.Link;
import com.linklib.repository.LinkRepository;
import com.linklib.util.JsonUtil;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class JsonLinkRepository implements LinkRepository {

    private final File file;
    private final List<Link> links = new ArrayList<>();

    public JsonLinkRepository(String path) {
        this.file = new File(path);
        load();
    }

    private void load() {
        try {
            if (!file.exists()) {
                file.getParentFile().mkdirs();
                saveAll();
                return;
            }
            if (file.length() == 0) return;

            Link[] arr = JsonUtil.mapper().readValue(file, Link[].class);
            if (arr != null) {
                for (Link l : arr) links.add(l);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public List<Link> findAll() { return links; }

    @Override
    public Link findById(String id) {
        return links.stream().filter(l -> l.getId().equals(id)).findFirst().orElse(null);
    }

    @Override
    public void save(Link link) {
        links.add(link);
        saveAll();
    }

    @Override
    public void update(Link link) {
        for (int i = 0; i < links.size(); i++) {
            if (links.get(i).getId().equals(link.getId())) {
                links.set(i, link);
                break;
            }
        }
        saveAll();
    }

    @Override
    public void delete(String id) {
        links.removeIf(l -> l.getId().equals(id));
        saveAll();
    }

    private void saveAll() {
        try {
            // Grava em arquivo temporário primeiro.
            // Só renomeia quando a gravação está 100% completa.
            // Assim uma interrupção nunca corrompe o arquivo original.
            File tmp = new File(file.getAbsolutePath() + ".tmp");
            JsonUtil.mapper().writeValue(tmp, links);
            if (file.exists()) file.delete();
            tmp.renameTo(file);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
