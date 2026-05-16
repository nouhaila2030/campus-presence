package com.example.smartabsence.controller;

import com.example.smartabsence.model.Matiere;
import com.example.smartabsence.repository.MatiereRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/matieres")
public class MatiereController {

    private final MatiereRepository matiereRepository;

    public MatiereController(MatiereRepository matiereRepository) {
        this.matiereRepository = matiereRepository;
    }

    @GetMapping
    public List<Matiere> getAll() {
        return matiereRepository.findAll();
    }

    @PostMapping
    public Matiere create(@RequestBody Matiere matiere) {
        return matiereRepository.save(matiere);
    }
}
