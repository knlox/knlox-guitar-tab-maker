package com.knlox.guitar_tab_maker.controller;

import com.knlox.guitar_tab_maker.model.Tab;
import com.knlox.guitar_tab_maker.service.TabService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tabs")
@CrossOrigin(origins = "*") // allow React frontend later
public class TabController {

    private final TabService tabService;

    public TabController(TabService tabService) {
        this.tabService = tabService;
    }

    @GetMapping
    public List<Tab> getAllTabs() {
        return tabService.getAllTabs();
    }

    @GetMapping("/{id}")
    public Tab getTabById(@PathVariable Long id) {
        return tabService.getTabById(id);
    }

    @PostMapping
    public Tab createTab(@RequestBody Tab tab) {
        return tabService.createTab(tab);
    }

    @PutMapping("/{id}")
    public Tab updateTab(@PathVariable Long id, @RequestBody Tab tabDetails) {
        return tabService.updateTab(id, tabDetails);
    }

    @DeleteMapping("/{id}")
    public void deleteTab(@PathVariable Long id) {
        tabService.deleteTab(id);
    }
}
