package com.example.smartabsence.controller;

import com.example.smartabsence.model.Classe;
import com.example.smartabsence.repository.ClasseRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
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
    public Classe create(@RequestBody Classe classe) {
        return classeRepository.save(classe);
    }
}
