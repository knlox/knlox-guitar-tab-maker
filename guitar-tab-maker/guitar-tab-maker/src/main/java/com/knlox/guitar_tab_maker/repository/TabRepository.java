package com.knlox.guitar_tab_maker.repository;

import com.knlox.guitar_tab_maker.model.Tab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TabRepository extends JpaRepository<Tab, Long> {
}

