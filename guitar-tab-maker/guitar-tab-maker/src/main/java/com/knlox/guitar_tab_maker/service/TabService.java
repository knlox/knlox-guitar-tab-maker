package com.knlox.guitar_tab_maker.service;

import com.knlox.guitar_tab_maker.model.Tab;
import com.knlox.guitar_tab_maker.repository.TabRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TabService {
    private final TabRepository tabRepository;

    public TabService(TabRepository tabRepository) {
        this.tabRepository = tabRepository;
    }

    public List<Tab> getAllTabs() {
        return tabRepository.findAll();
    }

    public Tab getTabById(Long id) {
        return tabRepository.findById(id).orElse(null);
    }

    public Tab createTab(Tab tab) {
        return tabRepository.save(tab);
    }

    public Tab updateTab(Long id, Tab tabDetails) {
        return tabRepository.findById(id).map(tab -> {
            tab.setTitle(tabDetails.getTitle());
            tab.setArtist(tabDetails.getArtist());
            tab.setTuning(tabDetails.getTuning());
            tab.setTabContent(tabDetails.getTabContent());
            return tabRepository.save(tab);
        }).orElse(null);
    }

    public void deleteTab(Long id) {
        tabRepository.deleteById(id);
    }
}

