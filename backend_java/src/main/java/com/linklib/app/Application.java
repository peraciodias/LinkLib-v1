package com.linklib.app;
import java.io.File;
import com.linklib.api.LinkController;
import com.linklib.persistence.json.JsonLinkRepository;
import com.linklib.service.LinkService;

public class Application {

    public static void main(String[] args) throws Exception {

        JsonLinkRepository repo =
        new JsonLinkRepository("../data/links.json");
        LinkService service =
                new LinkService(repo);

        LinkController controller =
                new LinkController(service);

        controller.start();
        System.out.println("📂 Repositório de links: " + new File("../data/links.json").getAbsolutePath());
    }
}