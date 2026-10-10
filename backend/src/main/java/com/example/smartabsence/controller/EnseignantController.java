package com.example.smartabsence.controller;

import com.example.smartabsence.dto.LoginRequest;
import com.example.smartabsence.model.Enseignant;
import com.example.smartabsence.dto.EnseignantDTO;
import com.example.smartabsence.repository.EnseignantRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/enseignants")
public class EnseignantController {

    private final EnseignantRepository enseignantRepository;
    private final PasswordEncoder passwordEncoder;

    public EnseignantController(EnseignantRepository enseignantRepository,
                                PasswordEncoder passwordEncoder) {
        this.enseignantRepository = enseignantRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<Enseignant> getAll() {
        return enseignantRepository.findAll();
    }

    @PostMapping
    public Enseignant create(@RequestBody EnseignantDTO dto) {
        Enseignant enseignant = new Enseignant();
        enseignant.setNom(dto.getNom());
        enseignant.setPrenom(dto.getPrenom());
        enseignant.setEmail(dto.getEmail());
        // Hash the password before persisting
        enseignant.setPassword(passwordEncoder.encode(dto.getPassword()));
        enseignant.setMatricule(dto.getMatricule());
        return enseignantRepository.save(enseignant);
    }

    @PostMapping("/login")
    public ResponseEntity<Enseignant> login(@RequestBody LoginRequest request) {
        return enseignantRepository
                .findByEmail(request.getEmail())
                .filter(e -> passwordEncoder.matches(request.getPassword(), e.getPassword()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        enseignantRepository.deleteById(id);
    }
}
