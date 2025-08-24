package com.knlox.guitar_tab_maker.controller;

import com.knlox.guitar_tab_maker.model.User;
import com.knlox.guitar_tab_maker.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) { this.userService = userService; }

    @GetMapping
    public User getByEmail(@RequestParam String email) {
        return userService.getByEmail(email);
    }

    @PostMapping
    public User createOrUpdate(@RequestBody User u) { return userService.createOrUpdate(u); }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { userService.deleteById(id); }
}
