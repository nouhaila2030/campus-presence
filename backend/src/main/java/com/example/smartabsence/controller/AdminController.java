package com.example.smartabsence.controller;

import com.example.smartabsence.dto.AdminDTO;
import com.example.smartabsence.dto.LoginRequest;
import com.example.smartabsence.model.Admin;
import com.example.smartabsence.repository.AdminRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admins")
public class AdminController {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminController(AdminRepository adminRepository,
                           PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<Admin> getAll() {
        return adminRepository.findAll();
    }

    @PostMapping
    public Admin create(@RequestBody AdminDTO dto) {
        Admin admin = new Admin();
        admin.setNom(dto.getNom());
        admin.setPrenom(dto.getPrenom());
        admin.setEmail(dto.getEmail());
        // Hash the password before persisting
        admin.setPassword(passwordEncoder.encode(dto.getPassword()));
        return adminRepository.save(admin);
    }

    @PostMapping("/login")
    public ResponseEntity<Admin> login(@RequestBody LoginRequest request) {
        return adminRepository
                .findByEmail(request.getEmail())
                .filter(a -> passwordEncoder.matches(request.getPassword(), a.getPassword()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }
}
