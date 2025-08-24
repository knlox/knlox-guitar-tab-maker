package com.knlox.guitar_tab_maker.repository;

import com.knlox.guitar_tab_maker.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
