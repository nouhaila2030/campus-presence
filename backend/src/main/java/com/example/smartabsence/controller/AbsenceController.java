package com.example.smartabsence.controller;

import com.example.smartabsence.model.Absence;
import com.example.smartabsence.repository.AbsenceRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/absences")
public class AbsenceController {

    private final AbsenceRepository absenceRepository;

    public AbsenceController(AbsenceRepository absenceRepository) {
        this.absenceRepository = absenceRepository;
    }

    @GetMapping
    public List<Absence> getAll(@RequestParam(required = false) Long seanceId) {
        if (seanceId != null) {
            return absenceRepository.findBySeanceId(seanceId);
        }
        return absenceRepository.findAll();
    }

    @PostMapping
    public Absence create(@RequestBody Absence absence) {
        return absenceRepository.save(absence);
    }
}
