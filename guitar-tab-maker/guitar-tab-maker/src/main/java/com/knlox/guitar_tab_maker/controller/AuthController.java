package com.knlox.guitar_tab_maker.controller;

import com.knlox.guitar_tab_maker.model.User;
import com.knlox.guitar_tab_maker.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    private final UserService userService;

    public AuthController(UserService userService) { this.userService = userService; }

    @PostMapping("/register")
    public User register(@RequestBody User u) {
        // NOTE: plain passwords here for demo only. Hash in real app.
        return userService.createOrUpdate(u);
    }

    @PostMapping("/login")
    public User login(@RequestBody User creds) {
        User found = userService.getByEmail(creds.getEmail());
        if (found != null && found.getPassword() != null && found.getPassword().equals(creds.getPassword())) {
            return found;
        }
        return null;
    }
}
