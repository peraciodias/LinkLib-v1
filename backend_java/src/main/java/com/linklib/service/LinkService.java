package com.linklib.service;

import com.linklib.domain.Link;
import com.linklib.repository.LinkRepository;
import com.linklib.util.FaviconDownloader;
import com.linklib.util.HtmlUtil;
import com.linklib.util.IdGenerator;
import com.linklib.util.UrlUtil;

import java.time.LocalDateTime;
import java.util.List;

public class LinkService {

    // FIX: usa a interface, não a implementação concreta
    private final LinkRepository repository;

    public LinkService(LinkRepository repository) {
        this.repository = repository;
    }

    public Link criar(String url) {

        if (!url.startsWith("http")) {
            url = "https://" + url;
        }

        final String urlFinal = url;

        // FIX: verifica duplicatas antes de salvar
        boolean jaExiste = repository.findAll().stream()
                .anyMatch(l -> l.getUrl().equalsIgnoreCase(urlFinal));

        if (jaExiste) {
            throw new IllegalArgumentException("URL já cadastrada: " + urlFinal);
        }

        String dominio = UrlUtil.extrairDominio(url);
        String titulo = HtmlUtil.extrairTitulo(url);
        if (titulo == null || titulo.isBlank()) {
            titulo = dominio;
        }

        String favicon = null;
        if (dominio != null) {
            favicon = FaviconDownloader.download(dominio);
        }

        Link link = new Link();
        link.setId(IdGenerator.gerar());
        link.setUrl(url);
        link.setDominio(dominio);
        link.setTitulo(titulo);
        link.setFaviconPath(favicon);
        link.setFavorito(false);

        // FIX: seta a data de criação
        link.setCriadoEm(LocalDateTime.now());

        repository.save(link);

        return link;
    }

    public Link atualizar(String id, String titulo, String categoria, List<String> tags, String legenda, Boolean favorito) {

        Link link = repository.findById(id);

        if (link == null) {
            throw new IllegalArgumentException("Link não encontrado: " + id);
        }

        if (titulo != null && !titulo.isBlank())  link.setTitulo(titulo);
        if (categoria != null)                     link.setCategoria(categoria);
        if (tags != null)                          link.setTags(tags);
        if (legenda != null)                       link.setLegenda(legenda);
        if (favorito != null)                      link.setFavorito(favorito);

        link.setUltimoAcesso(LocalDateTime.now());

        repository.update(link);

        return link;
    }

    public void deletar(String id) {
        repository.delete(id);
    }

    public List<Link> listar() {
        return repository.findAll();
    }

    public List<Link> listarPorCategoria(String categoria) {
        return repository.findAll().stream()
                .filter(l -> categoria.equalsIgnoreCase(l.getCategoria()))
                .toList();
    }
}
