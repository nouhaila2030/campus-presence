package com.example.smartabsence.repository;

import com.example.smartabsence.model.Enseignant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EnseignantRepository extends JpaRepository<Enseignant, Long> {

    Optional<Enseignant> findByEmailAndPassword(String email, String password);
}
