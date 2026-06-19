package com.example.smartabsence.controller;

import com.example.smartabsence.model.Absence;
import com.example.smartabsence.model.Etudiant;
import com.example.smartabsence.model.Seance;
import com.example.smartabsence.repository.AbsenceRepository;
import com.example.smartabsence.repository.EtudiantRepository;
import com.example.smartabsence.repository.SeanceRepository;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = "*")
public class AttendanceController {

    private static final String IA_URL = "http://localhost:5000";

    private final AbsenceRepository   absenceRepository;
    private final EtudiantRepository  etudiantRepository;
    private final SeanceRepository    seanceRepository;
    private final RestTemplate        restTemplate = new RestTemplate();

    public AttendanceController(AbsenceRepository absenceRepository,
                                EtudiantRepository etudiantRepository,
                                SeanceRepository seanceRepository) {
        this.absenceRepository  = absenceRepository;
        this.etudiantRepository = etudiantRepository;
        this.seanceRepository   = seanceRepository;
    }

    /**
     * GET /api/attendance/health
     * Vérifie que l'API Flask IA est accessible
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkIaHealth() {
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(IA_URL + "/health", Map.class);
            Map<String, Object> result = new HashMap<>(response.getBody());
            result.put("ia_connected", true);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of(
                "ia_connected", false,
                "error", "Service IA inaccessible : " + e.getMessage()
            ));
        }
    }

    /**
     * POST /api/attendance/scan?seanceId=1
     * Reçoit une photo depuis le mobile → envoie à Flask IA → enregistre les absences
     */
    @PostMapping("/scan")
    public ResponseEntity<Map<String, Object>> scanAndRecord(
            @RequestParam("image") MultipartFile image,
            @RequestParam("seanceId") Long seanceId) {

        // 1. Vérifier que la séance existe
        Optional<Seance> seanceOpt = seanceRepository.findById(seanceId);
        if (seanceOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Séance introuvable : " + seanceId));
        }
        Seance seance = seanceOpt.get();

        // 2. Envoyer la photo à Flask IA
        Map iaResult;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new org.springframework.core.io.ByteArrayResource(image.getBytes()) {
                @Override public String getFilename() { return image.getOriginalFilename(); }
            });

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> iaResponse = restTemplate.postForEntity(
                IA_URL + "/scan-group", requestEntity, Map.class
            );
            iaResult = iaResponse.getBody();
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of(
                "error", "Service IA inaccessible : " + e.getMessage()
            ));
        }

        // 3. Récupérer les présents/absents depuis la réponse IA
        List<String> presentNames = (List<String>) iaResult.getOrDefault("present", List.of());
        List<String> absentNames  = (List<String>) iaResult.getOrDefault("absent",  List.of());
        int totalDetected = (int) iaResult.getOrDefault("total_detected", 0);

        // 4. Enregistrer les absences en base
        List<String> recorded = new ArrayList<>();
        List<String> notFound = new ArrayList<>();

        for (String name : absentNames) {
            // Chercher l'étudiant par nom complet (prénom + nom)
            List<Etudiant> etudiants = etudiantRepository.findAll();
            Optional<Etudiant> etudiantOpt = etudiants.stream()
                .filter(e -> (e.getPrenom() + " " + e.getNom()).equalsIgnoreCase(name)
                          || (e.getNom() + " " + e.getPrenom()).equalsIgnoreCase(name))
                .findFirst();

            if (etudiantOpt.isPresent()) {
                Etudiant etudiant = etudiantOpt.get();
                // Éviter les doublons
                boolean exists = absenceRepository.findAll().stream()
                    .anyMatch(a -> a.getEtudiant() != null
                               && a.getEtudiant().getId().equals(etudiant.getId())
                               && a.getSeance() != null
                               && a.getSeance().getId().equals(seanceId));

                if (!exists) {
                    Absence absence = new Absence();
                    absence.setEtudiant(etudiant);
                    absence.setSeance(seance);
                    absence.setDate(LocalDate.now());
                    absence.setJustifiee(false);
                    absenceRepository.save(absence);
                    recorded.add(name);
                }
            } else {
                notFound.add(name);
            }
        }

        // 5. Retourner le résultat complet
        return ResponseEntity.ok(Map.of(
            "seanceId",       seanceId,
            "totalDetected",  totalDetected,
            "present",        presentNames,
            "absent",         absentNames,
            "recorded",       recorded,
            "notFoundInDb",   notFound,
            "iaStatus",       "ok"
        ));
    }

    /**
     * POST /api/attendance/recognize
     * Reconnaissance simple d'un visage (test)
     */
    @PostMapping("/recognize")
    public ResponseEntity<Map> recognizeFace(@RequestParam("image") MultipartFile image) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", new org.springframework.core.io.ByteArrayResource(image.getBytes()) {
                @Override public String getFilename() { return image.getOriginalFilename(); }
            });

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            ResponseEntity<Map> iaResponse = restTemplate.postForEntity(
                IA_URL + "/recognize", requestEntity, Map.class
            );
            return ResponseEntity.ok(iaResponse.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("error", e.getMessage()));
        }
    }
}
