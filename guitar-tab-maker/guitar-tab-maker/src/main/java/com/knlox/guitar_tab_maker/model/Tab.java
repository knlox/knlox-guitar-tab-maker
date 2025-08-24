package com.knlox.guitar_tab_maker.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tabs")
public class Tab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String artist;
    private String tuning;

    // Use camelCase in Java; map to snake_case in DB
    @Column(name = "tab_content", columnDefinition = "TEXT", nullable = false)
    private String tabContent;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Tab() {
        // JPA needs a no-args constructor
    }

    @PrePersist
    public void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    // --- Getters / Setters ---

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getArtist() { return artist; }
    public void setArtist(String artist) { this.artist = artist; }

    public String getTuning() { return tuning; }
    public void setTuning(String tuning) { this.tuning = tuning; }

    public String getTabContent() { return tabContent; }
    public void setTabContent(String tabContent) { this.tabContent = tabContent; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
