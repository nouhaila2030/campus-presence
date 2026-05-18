package com.example.smartabsence.controller;

import com.example.smartabsence.dto.AbsenceDTO;
import com.example.smartabsence.dto.JustifierRequest;
import com.example.smartabsence.model.Absence;
import com.example.smartabsence.repository.AbsenceRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

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
    public Absence create(@RequestBody AbsenceDTO dto) {
        Absence absence = new Absence();
        absence.setId(dto.getId());
        absence.setDate(dto.getDate());
        absence.setJustifiee(dto.isJustifiee());
        absence.setEtudiant(dto.getEtudiant());
        absence.setSeance(dto.getSeance());
        return absenceRepository.save(absence);
    }

    @PutMapping("/{id}/justifier")
    public Absence justifier(@PathVariable Long id, @RequestBody JustifierRequest request) {
        Absence absence =
                absenceRepository
                        .findById(id)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Absence introuvable"));
        absence.setJustifiee(true);
        absence.setCommentaire(request.getCommentaire());
        return absenceRepository.save(absence);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        absenceRepository.deleteById(id);
    }
}
