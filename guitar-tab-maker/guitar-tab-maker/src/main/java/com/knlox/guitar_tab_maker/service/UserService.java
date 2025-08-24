package com.knlox.guitar_tab_maker.service;

import com.knlox.guitar_tab_maker.model.User;
import com.knlox.guitar_tab_maker.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public User createOrUpdate(User u) {
        return userRepository.save(u);
    }

    public void deleteById(Long id) { userRepository.deleteById(id); }
}
