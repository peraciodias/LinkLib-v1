package com.linklib.domain;

import java.time.LocalDateTime;
import java.util.List;

public class Link {

    private String id;
    private String url;
    private String titulo;
    private String dominio;
    private String faviconPath;

    private String categoria;
    private List<String> tags;

    private String legenda;

    private boolean favorito;

    private LocalDateTime criadoEm;
    private LocalDateTime ultimoAcesso;

    public Link() {}

    public Link(String id, String url, String titulo) {
        this.id = id;
        this.url = url;
        this.titulo = titulo;
        this.criadoEm = LocalDateTime.now();
    }

    // getters e setters

    public String getId() { return id; }

    public void setId(String id) { this.id = id; }

    public String getUrl() { return url; }

    public void setUrl(String url) { this.url = url; }

    public String getTitulo() { return titulo; }

    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDominio() { return dominio; }

    public void setDominio(String dominio) { this.dominio = dominio; }

    public String getFaviconPath() { return faviconPath; }

    public void setFaviconPath(String faviconPath) { this.faviconPath = faviconPath; }

    public String getCategoria() { return categoria; }

    public void setCategoria(String categoria) { this.categoria = categoria; }

    public List<String> getTags() { return tags; }

    public void setTags(List<String> tags) { this.tags = tags; }

    public String getLegenda() { return legenda; }

    public void setLegenda(String legenda) { this.legenda = legenda; }

    public boolean isFavorito() { return favorito; }

    public void setFavorito(boolean favorito) { this.favorito = favorito; }

    public LocalDateTime getCriadoEm() { return criadoEm; }

    public void setCriadoEm(LocalDateTime criadoEm) { this.criadoEm = criadoEm; }

    public LocalDateTime getUltimoAcesso() { return ultimoAcesso; }

    public void setUltimoAcesso(LocalDateTime ultimoAcesso) { this.ultimoAcesso = ultimoAcesso; }
}
