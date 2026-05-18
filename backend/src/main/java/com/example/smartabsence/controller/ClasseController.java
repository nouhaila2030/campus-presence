package com.example.smartabsence.controller;

import com.example.smartabsence.dto.ClasseDTO;
import com.example.smartabsence.model.Classe;
import com.example.smartabsence.repository.ClasseRepository;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/classes")
public class ClasseController {

    private final ClasseRepository classeRepository;

    public ClasseController(ClasseRepository classeRepository) {
        this.classeRepository = classeRepository;
    }

    @GetMapping
    public List<Classe> getAll() {
        return classeRepository.findAll();
    }

    @PostMapping
    public Classe create(@RequestBody ClasseDTO dto) {
        Classe classe = new Classe();
        classe.setId(dto.getId());
        classe.setNom(dto.getNom());
        classe.setNiveau(dto.getNiveau());
        return classeRepository.save(classe);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        classeRepository.deleteById(id);
    }
}
