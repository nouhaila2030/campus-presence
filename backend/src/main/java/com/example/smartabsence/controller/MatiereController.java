package com.example.smartabsence.controller;

import com.example.smartabsence.dto.MatiereDTO;
import com.example.smartabsence.model.Matiere;
import com.example.smartabsence.repository.MatiereRepository;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
    public Matiere create(@RequestBody MatiereDTO dto) {
        Matiere matiere = new Matiere();
        matiere.setId(dto.getId());
        matiere.setNom(dto.getNom());
        matiere.setCoefficient(dto.getCoefficient());
        return matiereRepository.save(matiere);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        matiereRepository.deleteById(id);
    }
}
