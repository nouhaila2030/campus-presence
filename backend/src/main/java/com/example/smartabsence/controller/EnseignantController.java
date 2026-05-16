package com.example.smartabsence.controller;

import com.example.smartabsence.dto.LoginRequest;
import com.example.smartabsence.model.Enseignant;
import com.example.smartabsence.repository.EnseignantRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/enseignants")
public class EnseignantController {

    private final EnseignantRepository enseignantRepository;

    public EnseignantController(EnseignantRepository enseignantRepository) {
        this.enseignantRepository = enseignantRepository;
    }

    @GetMapping
    public List<Enseignant> getAll() {
        return enseignantRepository.findAll();
    }

    @PostMapping
    public Enseignant create(@RequestBody Enseignant enseignant) {
        return enseignantRepository.save(enseignant);
    }

    @PostMapping("/login")
    public ResponseEntity<Enseignant> login(@RequestBody LoginRequest request) {
        return enseignantRepository
                .findByEmailAndPassword(request.getEmail(), request.getPassword())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }
}
