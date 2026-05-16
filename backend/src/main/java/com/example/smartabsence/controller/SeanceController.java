package com.example.smartabsence.controller;

import com.example.smartabsence.model.Seance;
import com.example.smartabsence.repository.SeanceRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seances")
public class SeanceController {

    private final SeanceRepository seanceRepository;

    public SeanceController(SeanceRepository seanceRepository) {
        this.seanceRepository = seanceRepository;
    }

    @GetMapping
    public List<Seance> getAll(@RequestParam(required = false) Long enseignantId) {
        if (enseignantId != null) {
            return seanceRepository.findByEnseignantId(enseignantId);
        }
        return seanceRepository.findAll();
    }

    @PostMapping
    public Seance create(@RequestBody Seance seance) {
        return seanceRepository.save(seance);
    }
}
