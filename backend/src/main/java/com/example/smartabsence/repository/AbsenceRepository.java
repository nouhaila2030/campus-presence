package com.example.smartabsence.repository;

import com.example.smartabsence.model.Absence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AbsenceRepository extends JpaRepository<Absence, Long> {

    List<Absence> findBySeanceId(Long seanceId);
}
