package com.sunpower.repository;

import com.sunpower.entity.Role;
import com.sunpower.entity.User;
import com.sunpower.entity.enums.Enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findFirstByEmailIgnoreCaseOrderByIdDesc(String email);
    Optional<User> findFirstByPhoneOrderByIdDesc(String phone);
    Optional<User> findFirstByUsernameOrderByIdDesc(String username);
}
