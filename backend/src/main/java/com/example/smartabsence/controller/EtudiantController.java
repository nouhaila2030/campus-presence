package com.example.smartabsence.controller;

import com.example.smartabsence.dto.EtudiantDTO;
import com.example.smartabsence.dto.PhotoUpdateRequest;
import com.example.smartabsence.model.Etudiant;
import com.example.smartabsence.repository.EtudiantRepository;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/etudiants")
public class EtudiantController {

    private final EtudiantRepository etudiantRepository;

    public EtudiantController(EtudiantRepository etudiantRepository) {
        this.etudiantRepository = etudiantRepository;
    }

    @GetMapping
    public List<Etudiant> getAll() {
        return etudiantRepository.findAll();
    }

    @PostMapping
    public Etudiant create(@RequestBody EtudiantDTO dto) {
        Etudiant etudiant = new Etudiant();
        etudiant.setId(dto.getId());
        etudiant.setNom(dto.getNom());
        etudiant.setPrenom(dto.getPrenom());
        etudiant.setEmail(dto.getEmail());
        etudiant.setMatricule(dto.getMatricule());
        etudiant.setPhotoUrl(dto.getPhotoUrl());
        etudiant.setClasse(dto.getClasse());
        return etudiantRepository.save(etudiant);
    }

    @PutMapping("/{id}/photo")
    public ResponseEntity<Etudiant> updatePhoto(
            @PathVariable Long id, @RequestBody PhotoUpdateRequest request) {
        return etudiantRepository
                .findById(id)
                .map(etudiant -> {
                    etudiant.setPhotoUrl(request.getPhotoUrl());
                    return ResponseEntity.ok(etudiantRepository.save(etudiant));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        etudiantRepository.deleteById(id);
    }
}
