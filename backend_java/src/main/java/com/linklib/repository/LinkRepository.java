package com.linklib.repository;

import com.linklib.domain.Link;

import java.util.List;

public interface LinkRepository {

    List<Link> findAll();

    Link findById(String id);

    void save(Link link);

    void update(Link link);

    void delete(String id);
}