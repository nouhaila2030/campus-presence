package com.example.smartabsence.repository;

import com.example.smartabsence.model.Seance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SeanceRepository extends JpaRepository<Seance, Long> {

    List<Seance> findByEnseignantId(Long enseignantId);
}
